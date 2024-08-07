import {
	world,
	system,
	EntityEffectOptions,
	EntityComponentTypes,
	EntityEquippableComponent,
	EquipmentSlot,
} from "@minecraft/server";
import { telekinesisAfterBreak } from "./events/afterEvents/playerBreakBlock";
import { addEffect, PlayerData } from "./libraries/playerData";
import { } from "@minecraft/server-ui";
import {
	addCustomEnchantment,
	addLore,
	removeCustomEnchantment,
} from "./libraries/itemData";
import { MinecraftColors } from "./libraries/chatFormat";
import { EffectDataT, MinecraftDynamicPropertyT, PlayerDataT } from "./types";

// Register default player data
const defaultData = {
	dropMultiplier: 1,
	xpMultiplier: 1,
	effects: {}, // haste = {effect: string, duration: number, strength: number, title: string, startTime: number}
};

world.beforeEvents.chatSend.subscribe((event) => {
	const player = event.sender;
	const message = event.message;

	let playerRanks: { [key: string]: MinecraftDynamicPropertyT } = PlayerData.get("ranks", player) as unknown as MinecraftDynamicPropertyT;
	if (!playerRanks) playerRanks = { "Member": 0 };

	let playerRank = "";
	let highestPriority = 0;
	for (const rank in playerRanks) {
		const rankPriority = playerRanks[rank];
		if (rankPriority > highestPriority) {
			highestPriority = rankPriority;
			playerRank = rank;
		}
	}

	event.cancel = true;
	world.sendMessage(`§f[${playerRank}§f]§r | ${player.name}: ${message}`);
});

world.afterEvents.playerJoin.subscribe((event) => {
	const playerName = event.playerName;
	const allPlayers = world.getAllPlayers();

	for (const currentPlayer of allPlayers) {
		if (currentPlayer.name === playerName) {
			PlayerData.set(playerName, defaultData, currentPlayer);
		}
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
			break;
		}
		case "minecraft:redstone_block": {
			removeCustomEnchantment(event.player, item, "fortune");
			break;
		}
		case "minecraft:emerald_block": {
			item.clearDynamicProperties();
			item.setLore([]);
			const playerEquipment = event.player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

			playerEquipment.setEquipment(EquipmentSlot.Mainhand, item);

			// Clear effects
			PlayerData.set("effects", {}, event.player);

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
		const allPlayerData = PlayerData.getAll();
		for (const playerName in allPlayerData) {
			const playerData: PlayerDataT = allPlayerData[playerName];
			const effectKeys = Object.keys(playerData.effects);

			// Check if the player's current effect index is undefined or too large and reset it.
			if (playerData.effectIndex == undefined || playerData.effectIndex > effectKeys.length - 1) {
				playerData.effectIndex = 0;
			}

			// Get the effect data for the effect currently being displayed then display it
			const effectData = playerData.effects[effectKeys[playerData.effectIndex]];
			if (effectData) {
				playerData.player.dimension.runCommand(`/title ${playerName} actionbar ${effectData.title} - ${effectData.duration - (Math.round((system.currentTick - effectData.startTime) / 20))}s`);
			}

			for (const effect of effectKeys) {
				// Get effect data and setup the effect's options using EntityEffectOptions
				const effectData: EffectDataT = playerData.effects[effect];

				// Check if expired
				// if (system.currentTick - effectData.startTime > effectData.duration) {
				// 	world.sendMessage("expired monkey");
				// 	PlayerData.set("effects", playerData.effects, playerData.player);
				// 	continue;
				// }

				// Check if the effect is already applied
				if (effectData.applied) {
					continue;
				};

				if (effectData.effect.includes("-custom")) {
					effectData.applied = true;
					continue;
				}

				// Apply the effect

				const entityOptions: EntityEffectOptions = {
					amplifier: effectData.strength,
					showParticles: false,
				};

				const player = playerData.player;
				player.addEffect(effectData.effect, effectData.duration * 20, entityOptions);
				effectData.applied = true;
				playerData.effects[effect] = effectData;
				PlayerData.set("effects", playerData.effects, player);
			}
		}
	}

	// Runs every 5 seconds
	if (system.currentTick % 100 === 0) {
		// Alternate the effects displayed
		const allPlayerData = PlayerData.getAll();
		for (const playerName in allPlayerData) {
			const playerData: PlayerDataT = allPlayerData[playerName];
			const player = playerData.player;
			const effectKeys = Object.keys(playerData.effects);
			if (playerData.effectIndex + 1 > effectKeys.length) playerData.effectIndex = 0;

			playerData.effectIndex++;
			PlayerData.set("effects", playerData.effects, player);
			PlayerData.set("effectIndex", playerData.effectIndex, player);
		}
	}

	system.run(tickSystem);
}

system.run(tickSystem);

world.afterEvents.playerSpawn.subscribe((event) => {
	// Reapply effects when player spawns, after a death for example
	// Start by checking if they are missing any effects and reapply them
	const player = event.player;
	const playerEffects = PlayerData.get("effects", player) as unknown as { [key: string]: MinecraftDynamicPropertyT } || {};
	const effectKeys = Object.keys(playerEffects);

	for (const effect of effectKeys) {
		const effectData = playerEffects[effect];
		if (effectData.effect.includes("-custom")) {
			effectData.applied = true;
			playerEffects[effect] = effectData;
			PlayerData.set("effects", playerEffects, player);
			continue;
		}

		if (effectData.applied) {
			const entityOptions: EntityEffectOptions = {
				amplifier: effectData.strength,
				showParticles: false,
			};

			const remainingDuration = effectData.duration - (Math.round((system.currentTick - effectData.startTime) / 20));
			player.addEffect(effectData.effect, remainingDuration * 20, entityOptions);
			playerEffects[effect] = effectData;
			PlayerData.set("effects", playerEffects, player);
		}
	}
});