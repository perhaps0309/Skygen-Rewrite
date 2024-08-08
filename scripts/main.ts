import {
	world,
	system,
	EntityEffectOptions,
	EntityComponentTypes,
	EntityEquippableComponent,
	EquipmentSlot,
	Player,
	ScoreboardIdentity,
	ItemStack,
	ItemDurabilityComponent,
} from "@minecraft/server";
import { telekinesisAfterBreak } from "./events/afterEvents/playerBreakBlock";
import { addEffect, PlayerData } from "./libraries/playerData";
import { } from "@minecraft/server-ui";
import {
	addCustomEnchantment,
	addLore,
	ItemData,
	removeCustomEnchantment,
	updateLore,
} from "./libraries/itemData";
import { MinecraftColors } from "./libraries/chatFormat";
import { EffectDataT, MinecraftDynamicPropertyT, PlayerDataT } from "./types";
import { ModalFormData, MessageFormData, ActionFormData } from "@minecraft/server-ui";

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

function abbreviateMoney(value: number): string {
	const suffixes = ["", "k", "M", "B", "T"]; // Add more suffixes if needed
	const suffixIndex = Math.floor(("" + value).length / 3);
	let shortValue: string;

	if (suffixIndex === 0) {
		shortValue = value.toString();
	} else {
		const abbreviatedValue = (value / Math.pow(1000, suffixIndex)).toFixed(1);
		shortValue = parseFloat(abbreviatedValue) + suffixes[suffixIndex];
	}

	return shortValue;
}

// Intercept players interacting with a custom villager

const enchantments: {
	[key: string]: {
		title: string;
		description: string;
		name: string;
		baseCost: number;
		costIncrease: number;
		effectTitle: string; // "more damage", "more drops",
		effectType: string; // "percent", "flat"
		effectAmount: number;
		effectSymbol?: string;
	}
} = {
	luck1: {
		title: "§b§lLuck I",
		description: "§6Increases the chance of getting rare drops",
		name: "luck1",
		baseCost: 50000,
		costIncrease: 50,
		effectTitle: "%% chance of getting rare drops",
		effectType: "percent",
		effectAmount: 5,
		effectSymbol: "+",
	},
	luck2: {
		title: "§2§lLuck II",
		description: "Greatly increases the chance of getting rare drops",
		name: "luck2",
		baseCost: 100000,
		costIncrease: 100,
		effectTitle: "%% chance of getting rare drops",
		effectType: "percent",
		effectAmount: 15,
		effectSymbol: "+",
	},
	xpboost: {
		title: "§d§lXP Boost",
		description: "§6Increases the amount of XP gained per block broken",
		name: "xpboost",
		baseCost: 75000,
		costIncrease: 10,
		effectTitle: "%% XP gained",
		effectType: "percent",
		effectAmount: 25,
		effectSymbol: "+",
	},
	fortune: {
		title: "§e§lFortune",
		description: "§aIncreases the maximum amount of blocks dropped by 1 per level",
		name: "fortune",
		baseCost: 25000,
		costIncrease: 25, // 25% increase per level
		effectTitle: " maximum drops",
		effectType: "flat",
		effectAmount: 1,
		effectSymbol: "+",
	}
}

// Function to get the player's money from the scoreboard
function getPlayerMoney(player: Player): number {
	try {
		const moneyObjective = world.scoreboard.getObjective("money");
		const score = moneyObjective?.getScore(player.scoreboardIdentity as ScoreboardIdentity) || 0;
		return score;
	} catch (error) {
		return 0;
	}
}

// Function to set the player's money on the scoreboard
function setPlayerMoney(player: Player, amount: number): void {
	let moneyObjective = world.scoreboard.getObjective("money");
	if (!moneyObjective) {
		world.scoreboard.addObjective("money", "Money");
		moneyObjective = world.scoreboard.getObjective("money");
	}

	if (moneyObjective) {
		moneyObjective.setScore(player.scoreboardIdentity as ScoreboardIdentity, amount);
	}
}

// Function to get the player's enchantment level
function getEnchantmentLevel(player: Player, enchantment: string): number {
	const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
	let playerItem = playerEquipment.getEquipment(EquipmentSlot.Mainhand);
	if (!playerItem || !playerItem.typeId.includes("pick")) {
		return 0;
	}
	const enchantmentData = (ItemData.get("enchantments", playerItem) as any) || {};
	return enchantmentData[enchantment]?.level || 0;
}

// Function to set the player's enchantment level
function setEnchantmentLevel(player: Player, enchantment: string, level: number): void {
	const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
	let playerItem = playerEquipment.getEquipment(EquipmentSlot.Mainhand);
	if (!playerItem || !playerItem.typeId.includes("pick")) {
		return;
	}

	const enchantmentData = (ItemData.get("enchantments", playerItem) as any) || {};
	console.warn(enchantmentData);

	enchantmentData[enchantment].level = level;
	ItemData.set("enchantments", enchantmentData, playerItem, player);
}

// Function to open the enchantment menu
function openEnchantmentMenu(player: Player): void {
	const form = new ActionFormData()
		.title("Enchantment Menu")
		.body("Select an enchantment to upgrade:");

	for (const enchantment in enchantments) {
		let enchantmentT = enchantment as keyof typeof enchantments;
		const currentLevel = getEnchantmentLevel(player, enchantment);
		const baseCost = enchantments[enchantmentT].baseCost;
		const costIncrease = enchantments[enchantmentT].costIncrease;
		const enchantmentCost = baseCost + (currentLevel * costIncrease);
		form.button(enchantments[enchantmentT].title + " - " + abbreviateMoney(enchantmentCost));
	}

	// @ts-ignore
	form.show(player).then(response => {
		if (response.canceled) return;
		if (!response.selection) return;

		const selectedEnchantment = Object.keys(enchantments)[response.selection];
		const currentLevel = getEnchantmentLevel(player, selectedEnchantment);
		let playerMoney = getPlayerMoney(player);

		let enchantmentData = enchantments[selectedEnchantment];
		let enchantmentTitle = enchantmentData.title;

		const effectTitle = enchantmentData.effectTitle;
		const effectAmount = enchantmentData.effectAmount;
		const effectSymbol = enchantmentData.effectSymbol; // "-" or "+"

		// Calculate the cost of the enchantment
		const baseCost = enchantmentData.baseCost;
		const costIncrease = enchantmentData.costIncrease;
		const enchantmentCosts = baseCost + (currentLevel * costIncrease);

		let enchantmentBody = [
			`§r§6${enchantmentData.description}\n\n`,
			`§eCurrent Level: §r§e${currentLevel} - ${effectSymbol}${effectAmount * currentLevel}${effectTitle}\n`,
			`§eNext Level: §r§e${currentLevel + 1} - ${effectSymbol}${effectAmount * (currentLevel + 1)}${effectTitle}\n`,
			`§eCost: §r§e${abbreviateMoney(enchantmentCosts)}`
		]

		const modalForm = new ActionFormData()
			.title(`${enchantmentTitle} - §a[${playerMoney} Money]`)
			.body(enchantmentBody.join(""))


		modalForm.button("§2§lUpgrade Level +1");
		modalForm.button("§8§lGo Back");

		// @ts-ignore
		modalForm.show(player).then(modalResponse => {
			if (modalResponse.canceled) return;
			let buttonResponse = modalResponse.selection;

			if (buttonResponse === 1) {
				openEnchantmentMenu(player);
				return;
			}

			const playerMoney = getPlayerMoney(player);
			if (playerMoney >= enchantmentCosts) {
				const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
				let playerItem: ItemStack | undefined = playerEquipment.getEquipment(EquipmentSlot.Mainhand);
				if (!playerItem) {
					return;
				}

				setPlayerMoney(player, playerMoney - enchantmentCosts);
				setEnchantmentLevel(player, selectedEnchantment, currentLevel + 1);
				player.sendMessage(`${selectedEnchantment} increased to level ${currentLevel + 1}!`);

				updateLore(player, playerItem);
			} else {
				player.sendMessage(`You do not have enough money to upgrade ${selectedEnchantment}.`);
			}
		});
	});
}

// Subscribe to player interactions
world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
	const entity = event.target;
	const player = event.player;

	if (entity.typeId === "minecraft:villager_v2" && entity.hasTag("enchantment_menu")) {
		event.cancel = true;

		const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
		let playerItem = playerEquipment.getEquipment(EquipmentSlot.Mainhand);
		if (!playerItem || !playerItem.typeId.includes("pick")) {
			return;
		}

		// Open the enchantment menu 
		system.run(function () {
			openEnchantmentMenu(player);
		});
	}
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

			updateLore(event.player, item);
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