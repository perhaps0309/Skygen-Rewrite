import { world, system, EntityComponentTypes, EntityEquippableComponent, EquipmentSlot, ItemStack, ItemDurabilityComponent, EntityInventoryComponent } from "@minecraft/server";
import { telekinesisAfterBreak } from "./events/afterEvents/playerBreakBlock";
import { getPlayerFromName, PlayerData } from "./libraries/data/player/playerData";
import { ItemData } from "./libraries/data/item/itemData";
import { MinecraftColors } from "./libraries/chatFormat";
import { applyEffectProperties, rotateEffectTitles } from "./libraries/data/player/effects";
import { setPlayerMoney } from "./libraries/data/player/money";
import { handlePlayerJoin } from "./events/afterEvents/playerJoin";
import { chatSend } from "./events/beforeEvents/chatSend";
import { playerSpawn } from "./events/afterEvents/playerSpawn";
import { checkIfPlot } from "./events/beforeEvents/checkIfPlot";
import { handleAdminStick } from "./events/beforeEvents/ItemUseOn";
import { openEnchantmentMenu } from "./libraries/enchantments/enchantmentHandler";
import { handleShopInteraction } from "./events/beforeEvents/entityHandler";
import { createGeneratorItem, generatorCreation } from "./libraries/data/world/generators";
import { Vector3Builder } from "@minecraft/math";

// Create a new PlayerData class instance for every player currently in the server.
// This is mainly to support reloading.
export const playersData: { [key: string]: PlayerData } = {};
const allPlayers = world.getAllPlayers();
for (const player of allPlayers) {
	playersData[player.name] = new PlayerData(player);
}

world.beforeEvents.playerInteractWithEntity.subscribe(handleShopInteraction)
world.afterEvents.playerSpawn.subscribe((event) => {
	// Create a PlayerData class for anyone who spawns in for the first time.
	if (!playersData[event.player.name]) {
		playersData[event.player.name] = new PlayerData(event.player);
	}

	handlePlayerJoin(event);
	playerSpawn(event);
});

world.afterEvents.playerLeave.subscribe((event) => {
	delete playersData[event.playerName];
});

world.beforeEvents.itemUseOn.subscribe(generatorCreation);
world.beforeEvents.chatSend.subscribe(chatSend);
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
			let itemData = new ItemData(item, player, EquipmentSlot.Mainhand);
			itemData.addEnchantment({
				name: "fortune",
				level: 23
			})

			itemData.updateItem();

			let generatorItem = createGeneratorItem("coal_ore", 1, player, {
				type: "coal_ore",
				upgrades: { cooldown: 1, dropsMultiplier: 1 },
				level: 1,
				maxLevel: 10,
				position: new Vector3Builder({ x: 0, y: 0, z: 0 }),
				autoMiner: {
					speed: 0,
					level: 0,
					storage: 0
				},
				owner: player
			});

			const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
			if (!playerInventory.container) return;

			playerInventory.container.addItem(generatorItem);

			break;
		}
		case "minecraft:redstone_block": {
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