import { world, system, EntityComponentTypes, EntityEquippableComponent, EquipmentSlot, ItemStack, ItemDurabilityComponent, EntityInventoryComponent } from "@minecraft/server";
import { telekinesisAfterBreak } from "./events/afterEvents/playerBreakBlock";
import { getPlayerFromName, PlayerData, PlayerDataHandler } from "./libraries/data/player/playerData";
import { ItemData } from "./libraries/data/item/itemData";
import { MinecraftColors } from "./libraries/chatFormat";
import { applyEffectProperties, rotateEffectTitles } from "./libraries/data/player/effects";
import { setPlayerMoney } from "./libraries/data/player/money";
import { handlePlayerJoin } from "./events/afterEvents/playerJoin";
import { chatSend } from "./events/beforeEvents/chatSend";
import { playerSpawn } from "./events/afterEvents/playerSpawn";
import { checkIfPlot } from "./events/beforeEvents/checkIfPlot";
import { handleAdminStick, handleGeneratorCreation } from "./events/beforeEvents/ItemUseOn";
import { openEnchantmentMenu } from "./libraries/enchantments/enchantmentHandler";

// Create a new PlayerData class instance once a user first spawns and keep it for later.
export const playersData: { [key: string]: PlayerData } = {};
world.afterEvents.playerSpawn.subscribe((event) => {
	if (!playersData[event.player.name]) {
		playersData[event.player.name] = new PlayerData(event.player);
	}

	handlePlayerJoin(event);
	playerSpawn(event);
});

world.afterEvents.playerLeave.subscribe((event) => {
	delete playersData[event.playerName];
});

world.beforeEvents.chatSend.subscribe(chatSend);
world.beforeEvents.itemUseOn.subscribe(handleGeneratorCreation);
world.beforeEvents.itemUse.subscribe((event) => {
	// @TODO: Handle compass menu aswell
	handleAdminStick(event);
});

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	// Check if the block the player is interacting with is on someone else's plot.
	if (checkIfPlot(event)) {
		return event.cancel = true;
	}

	// If the block is an enchanting table, then open the custom enchantment menu
	if (event.block.typeId == "minecraft:enchanting_table") {
		const player = event.player;
		system.run(() => {
			openEnchantmentMenu(player)
		});

		event.cancel = true;
	}
});

// Subscribe to player interactions

world.beforeEvents.playerBreakBlock.subscribe((event) => {
	// Check if the block broken is on someone else's plot.
	if (checkIfPlot(event)) {
		return event.cancel = true;
	}
});


world.afterEvents.playerBreakBlock.subscribe((event) => {
	const player = event.player;
	const block = event.brokenBlockPermutation;
	const item = event.itemStackAfterBreak;
	if (!item) return;

	// Testing
	switch (block.type.id) {
		case "minecraft:gold_block": {
			let itemData = new ItemData(item, player)
			itemData.addEnchantment({
				name: "fortune",
				level: 23
			})

			// Give the player a coal generator chicken
			const itemStack = new ItemStack("minecraft:stone", 1);
			itemStack.nameTag = MinecraftColors.DARK_GRAY + "Coal" + " §r§fGenerator";
			itemStack.keepOnDeath = true;
			itemStack.setLore([MinecraftColors.GRAY + "Right-click to spawn a §8coal §7generator"]);
			const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
			if (!playerInventory.container) return;

			playerInventory.container.addItem(itemStack);
			break;
		}
		case "minecraft:redstone_block": {
			removeCustomEnchantment(player, item, "fortune");
			break;
		}
		case "minecraft:emerald_block": {
			item.clearDynamicProperties();
			item.setLore([]);
			const durabilityComponent = item.getComponent("durability") as ItemDurabilityComponent;
			if (durabilityComponent) {
				durabilityComponent.damage = 0;
			}

			const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

			playerEquipment.setEquipment(EquipmentSlot.Mainhand, item);

			// Clear effects
			playersData[player.name].removeAllEffects();

			let playerEffects = player.getEffects();
			playerEffects.forEach((effect) => {
				player.removeEffect(effect.typeId);
			});

			break;
		}
		case "minecraft:diamond_block": {
			// Add haste effect
			const newHaste = {
				effect: "haste",
				duration: 120,
				strength: 3,
				title: MinecraftColors.YELLOW + "Haste III",
				startTime: system.currentTick,
				displaying: false,
				lastDisplayTime: 0,
				applied: false,
			};

			const newNightVision = {
				effect: "night_vision",
				duration: 120,
				strength: 1,
				title: MinecraftColors.DARK_BLUE + "Night Vision I",
				startTime: system.currentTick,
				displaying: false,
				lastDisplayTime: 0,
				applied: false,
			};

			const newDoubleDrops = {
				effect: "double_drops-custom",
				duration: 120,
				strength: 1,
				title: MinecraftColors.GOLD + "Double Drops",
				startTime: system.currentTick,
				displaying: false,
				lastDisplayTime: 0,
				applied: false,
			};

			const newLuck = {
				effect: "luck-custom",
				duration: 120,
				strength: 1,
				title: MinecraftColors.GREEN + "Luck II",
				startTime: system.currentTick,
				displaying: false,
				lastDisplayTime: 0,
				applied: false,
			};

			const playerData = playersData[player.name];
			playerData.addEffect(newHaste.effect, newHaste);
			playerData.addEffect(newNightVision.effect, newNightVision);
			playerData.addEffect(newDoubleDrops.effect, newDoubleDrops);
			playerData.addEffect(newLuck.effect, newLuck);
			break;
		}
		case "minecraft:coal_block": {
			setPlayerMoney(player, 100000);
			break;
		}
	}

	telekinesisAfterBreak(event);
});

// Tick System
// Runs code every so many ticks.
function tickSystem() {
	// Run every second
	if (system.currentTick % 20 === 0) {
		// Get all players, and check if they have effects
		// If the player is banned, then kick them from the world.
		const allPlayers = world.getAllPlayers()
		for (const player of allPlayers) {
			if (playersData[player.name].getIsBanned()) {
				world.getDimension("overworld").runCommand(`/kick ${player.name} You're banned from this server.`);
			}

			applyEffectProperties(player);
		}
	}

	// Runs every 5 seconds
	if (system.currentTick % 100 === 0) {
		// Alternate the effects displayed
		const allPlayers = world.getAllPlayers()
		for (const player of allPlayers) {
			rotateEffectTitles(player);
		}
	}

	system.run(tickSystem);
}

system.run(tickSystem);