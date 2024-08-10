import { world, system, EntityComponentTypes, EntityEquippableComponent, EquipmentSlot, ItemStack, ItemDurabilityComponent, EntityInventoryComponent } from "@minecraft/server";
import { telekinesisAfterBreak } from "./events/afterEvents/playerBreakBlock";
import { PlayerDataHandler } from "./libraries/playerData";
import { addCustomEnchantment, removeCustomEnchantment, updateLore } from "./libraries/itemData";
import { MinecraftColors } from "./libraries/chatFormat";
import { PlayerDataT } from "./types";
import { addEffect, applyEffectProperties, rotateEffectTitles } from "./libraries/effects";
import { setPlayerMoney } from "./libraries/money";

world.afterEvents.playerSpawn.subscribe(playerSpawn);
world.afterEvents.playerSpawn.subscribe(handlePlayerJoin);
world.beforeEvents.chatSend.subscribe(chatSend);
world.beforeEvents.itemUseOn.subscribe((event) => {
	handleGeneratorCreation(event);
	handleAdminStick(event);
})

import { handlePlayerJoin } from "./events/afterEvents/playerJoin";
import { chatSend } from "./events/beforeEvents/chatSend";
import { playerSpawn } from "./events/afterEvents/playerSpawn";
import { checkIfPlot } from "./events/beforeEvents/checkIfPlot";
import { handleAdminStick, handleGeneratorCreation } from "./events/beforeEvents/ItemUseOn";
import { openEnchantmentMenu } from "./libraries/enchantmentHandler";

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	// Check if block is an enchantment table
	if (event.block.type.id !== "minecraft:enchanting_table") return;

	const player = event.player;
	system.run(() => {
		openEnchantmentMenu(player)
	});

	event.cancel = true;
});

// Subscribe to player interactions

world.beforeEvents.playerBreakBlock.subscribe((event) => {
	if (checkIfPlot(event)) {
		return event.cancel = true;
	}
});


world.afterEvents.playerBreakBlock.subscribe((event) => {
	const block = event.brokenBlockPermutation;
	const item = event.itemStackAfterBreak;
	if (!item) return;

	// Testing
	switch (block.type.id) {
		case "minecraft:gold_block": {
			addCustomEnchantment(event.player, item, {
				name: "fortune",
				currentDisplayName: MinecraftColors.AQUA + "Fortune",
				level: 8,
			});

			addCustomEnchantment(event.player, item, {
				name: "luck1",
				currentDisplayName: MinecraftColors.GREEN + "Luck I",
				level: 23,
			});

			addCustomEnchantment(event.player, item, {
				name: "luck2",
				currentDisplayName: MinecraftColors.DARK_GREEN + "Luck II",
				level: 4,
			});

			addCustomEnchantment(event.player, item, {
				name: "xpboost",
				currentDisplayName: MinecraftColors.LIGHT_PURPLE + "XP Boost",
				level: 7,
			});

			updateLore(event.player, item);

			// Give the player a coal generator chicken
			const itemStack = new ItemStack("minecraft:stone", 1);
			itemStack.nameTag = MinecraftColors.DARK_GRAY + "Coal" + " §r§fGenerator";
			itemStack.keepOnDeath = true;
			itemStack.setLore([MinecraftColors.GRAY + "Right-click to spawn a §8coal §7generator"]);
			const playerInventory = event.player.getComponent("minecraft:inventory") as EntityInventoryComponent;
			if (!playerInventory.container) return;

			playerInventory.container.addItem(itemStack);
			break;
		}
		case "minecraft:redstone_block": {
			removeCustomEnchantment(event.player, item, "fortune");
			break;
		}
		case "minecraft:emerald_block": {
			item.clearDynamicProperties();
			item.setLore([]);
			const durabilityComponent = item.getComponent("durability") as ItemDurabilityComponent;
			if (durabilityComponent) {
				durabilityComponent.damage = 0;
			}

			const playerEquipment = event.player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

			playerEquipment.setEquipment(EquipmentSlot.Mainhand, item);

			// Clear effects
			PlayerDataHandler.set("effects", {}, event.player);

			let playerEffects = event.player.getEffects();
			playerEffects.forEach((effect) => {
				event.player.removeEffect(effect.typeId);
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

			addEffect(event.player, newHaste);
			addEffect(event.player, newNightVision);
			addEffect(event.player, newDoubleDrops);
			addEffect(event.player, newLuck);
			break;
		}
		case "minecraft:coal_block": {
			setPlayerMoney(event.player, 100000);
			break;
		}
	}

	telekinesisAfterBreak(event);
});

// Tick System

function tickSystem() {
	// Run every second
	if (system.currentTick % 20 === 0) {
		// Get all players, and check if they have effects
		const allPlayerData = PlayerDataHandler.getAll();
		for (const playerName in allPlayerData) {
			const playerData: PlayerDataT = allPlayerData[playerName];
			applyEffectProperties(playerData);
		}
	}

	// Runs every 5 seconds
	if (system.currentTick % 100 === 0) {
		// Alternate the effects displayed
		const allPlayerData = PlayerDataHandler.getAll();
		for (const playerName in allPlayerData) {
			const playerData: PlayerDataT = allPlayerData[playerName];
			rotateEffectTitles(playerData);
		}
	}

	system.run(tickSystem);
}

system.run(tickSystem);