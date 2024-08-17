import { EntityComponentTypes, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

import { fortuneData } from "./fortune";
import { luck1Data } from "./luck1";
import { luck2Data } from "./luck2";
import { xpboostData } from "./enlightment";
import { EnchantmentPurchaseT } from "../../types";
import { abbreviateLevel, abbreviateMoney, getPlayerMoney, setPlayerMoney } from "../data/player/money";
import { chatError, chatSuccess, chatWarn, MinecraftColors } from "../chatFormat";
import { ItemData } from "../data/item/ItemData";

import { xpboost2Data } from "./enlightment2";
import { blastMiningData } from "./blastmining";

/*
TODO: More Enchantments, balance prices and fix cost calculations
TODO: Make it so you can't add Luck I and Luck II

Enchantments:
- Fortune - EPIC 500k
- Fortune II - LEGENDARY 2m
- Luck I - EPIC 750k
- Luck II - LEGENDARY 1.5m
- Enlightment I (XP Boost) - RARE 75k
- Enlightment II (XP Boost) - EPIC 500k
- Blast Mining  (Chance to mine multiple blocks at once) RARE 40k
- Smelting (Auto smelts ores) RARE 25k
- Double Drops (Chance to get double drops) EPIC 1m
- Lucky Mining (Chance to get random ores) RARE 100k
- Telekinesis EPIC 50k
- Energized (Restores health and hunger upon mining blocks) RARE 50k
- Shatter (Instantly breaks blocks, but -30% drops) EPIC 500k
- Timber (Breaks entire tree) EPIC 250k
- Auto-Replant (Replants crops) EPIC 500k
- Farmer's Delight (+15% crop yield) EPIC 150k
- Harvest Master (+30% crop yield, growth speed +10% per level) LEGENDARY 2m

- Quick Gen (Reduces cooldown of generators by 5% per level) LEGENDARY 2.5m
- Lucky Gen (Increases drops from generators by 5% per level) LEGENDARY 3m
- Harvest Moon (Causes ores and crops to yield 25% more resources during night per level, max of 2 levels) Can't be combined with Harvest Day LEGENDARY 2.5m
- Harvest Day (Causes ores and crops to yield 25% more resources during day per level, max of 2 levels) Can't be combined with Harvest Moon LEGENDARY 2.5m

- Purification (Purifies all negative status effects applicable to chestplate only) LEGENDARY 10m
- Hardened Skin (Reduces all incoming damage by 10% per level, applicable to armor) EPIC 1.5m
- Speed Boost (Increases movement speed by 10% per level, applicable to boots) RARE 100k
*/

const enchantments: { [key: string]: EnchantmentPurchaseT } = {
    "fortune": fortuneData,
    "luck1": luck1Data,
    "luck2": luck2Data,
    "xpboost": xpboostData,
    "xpboost2": xpboost2Data,
    "blastmining": blastMiningData,
};

export const enchantmentTitles: { [key: string]: string } = {
    "fortune": MinecraftColors.AQUA + "Fortune",
    "luck1": MinecraftColors.GREEN + "Luck I",
    "luck2": MinecraftColors.DARK_GREEN + "Luck II",
    "xpboost": MinecraftColors.LIGHT_PURPLE + "Enlightment I",
    "xpboost2": MinecraftColors.DARK_PURPLE + "Enlightment II",
    "blastmining": MinecraftColors.GOLD + "Blast Mining",
}

let specialTypes: { [key: string]: MinecraftColors } = {
    "wooden": MinecraftColors.GREEN,
    "stone": MinecraftColors.GRAY,
    "iron": MinecraftColors.WHITE,
    "gold": MinecraftColors.GOLD,
    "diamond": MinecraftColors.AQUA,
    "netherite": MinecraftColors.DARK_RED,
    "leather": MinecraftColors.GRAY,
    "chainmail": MinecraftColors.WHITE,
}

export function handleEnchantmentMenu(player: Player, playerItem: ItemStack, playerSlot: EquipmentSlot | number): void {
    let itemType = playerItem.typeId
    let itemMaterial = itemType.split(":")[1].split("_")[0]
    let itemColor = specialTypes[itemMaterial] || MinecraftColors.WHITE
    const form = new ActionFormData()
        .title(`§5§lEnchantment Menu - §r${itemColor}${playerItem.nameTag || playerItem.typeId.replace("minecraft:", "").split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}`)
        .body("§eSelect an §5§lenchantment §r§eto §eupgrade\n");

    let itemData = new ItemData(playerItem, player, playerSlot);
    let itemEnchantments = itemData.getEnchantments();
    for (const enchantment in enchantments) {
        let enchantmentData = enchantments[enchantment];

        const currentLevel = itemEnchantments[enchantment]?.level || 0;
        const baseCost = enchantmentData.baseCost;
        const enchantmentCost = (currentLevel + 1) * baseCost

        let levelDisplay = currentLevel === 0 ? "" : " [" + abbreviateLevel(currentLevel) + "]";
        form.button(enchantmentData.title + " - " + abbreviateMoney(enchantmentCost) + levelDisplay);
    }

    // @ts-ignore
    form.show(player).then(response => {
        if (response.canceled) return;
        if (!response.selection && response.selection !== 0) return;

        const selectedEnchantment = Object.keys(enchantments)[response.selection];
        const currentLevel = itemEnchantments[selectedEnchantment]?.level || 0;
        let playerMoney = getPlayerMoney(player);

        let enchantmentData = enchantments[selectedEnchantment];
        let enchantmentTitle = enchantmentData.title;

        const effectTitle = enchantmentData.effectTitle;
        const effectAmount = enchantmentData.effectAmount;
        const effectSymbol = enchantmentData.effectSymbol; // "-" or "+"

        // Calculate the cost of the enchantment
        const baseCost = enchantmentData.baseCost;
        let enchantmentCosts = baseCost * (currentLevel + 1);

        let enchantmentBody = [
            `§r§6${enchantmentData.description}\n\n`,
            `§eCurrent Level: §r§e${currentLevel} - ${effectSymbol}${effectAmount * currentLevel}${effectTitle}\n`,
            `§eNext Level: §r§e${currentLevel + 1} - ${effectSymbol}${effectAmount * (currentLevel + 1)}${effectTitle}\n`,
            `§eCost: §r§e${abbreviateMoney(enchantmentCosts)}`
        ]

        const modalForm = new ActionFormData()
            .title(`${enchantmentTitle} - §a[${abbreviateMoney(playerMoney)} Money]`)
            .body(enchantmentBody.join(""))

        modalForm.button("§2§lUpgrade Level +1"); // +1, +5
        modalForm.button("§e§lUpgrade Level +5");
        modalForm.button("§8§lGo Back");

        // @ts-ignore
        modalForm.show(player).then(modalResponse => {
            if (modalResponse.canceled) return;
            const buttonResponse = modalResponse.selection;

            if (buttonResponse === 2) {
                openEnchantmentMenu(player);
                return;
            }

            let levelIncrease = buttonResponse === 0 ? 1 : 5;
            for (let i = 0; i < levelIncrease; i++) {
                enchantmentCosts += baseCost * (currentLevel + i + 1);
            }

            const playerMoney = getPlayerMoney(player);
            if (playerMoney >= enchantmentCosts) {
                setPlayerMoney(player, playerMoney - enchantmentCosts);

                itemData.addEnchantment({
                    name: selectedEnchantment,
                    level: currentLevel + levelIncrease,
                });

                chatSuccess(player, `${enchantmentData.title} §r§aincreased to level §l${currentLevel + levelIncrease}!`);
                chatWarn(player, `§eYou now have §a${abbreviateMoney(getPlayerMoney(player))} §eMoney`);
                handleEnchantmentMenu(player, playerItem, playerSlot);
            } else {
                chatError(player, "You do not have enough money to purchase this enchantment.");
            }
        });
    });
}

// Function to open the enchantment menu
export function openEnchantmentMenu(player: Player): void {
    // Check if the player has a tool equipped, if not prompt to select a tool
    const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
    let playerItem: ItemStack = playerEquipment.getEquipment(EquipmentSlot.Mainhand)!;
    if (!playerItem) {
        const storedItems: Array<{ item: ItemStack, slot: EquipmentSlot | number }> = [];
        const form = new ActionFormData()
            .title("Enchantment Menu - No Tool Equipped")
            .body("Please select a tool or armor piece to enchant");

        // Get player's armor and inventory
        const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        if (!playerInventory.container) return;

        let playerHelmet = playerEquipment.getEquipment(EquipmentSlot.Head);
        let playerChestplate = playerEquipment.getEquipment(EquipmentSlot.Chest);
        let playerLeggings = playerEquipment.getEquipment(EquipmentSlot.Legs);
        let playerBoots = playerEquipment.getEquipment(EquipmentSlot.Feet);
        const armorPieces = [playerHelmet, playerChestplate, playerLeggings, playerBoots];
        const armorTypes: EquipmentSlot[] = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];

        // Add armor pieces to the form
        for (const armorPiece of armorPieces) {
            if (armorPiece) {
                let itemTag = armorPiece.nameTag;
                if (!itemTag) {
                    // Remove the "minecraft:" prefix and capitalize the first letter of each word
                    itemTag = armorPiece.typeId.split(":")[1].split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

                    let armorMaterial = armorPiece.typeId.split(":")[1].split("_")[0];
                    let armorColor = specialTypes[armorMaterial] || MinecraftColors.WHITE;
                    itemTag = armorColor + itemTag;
                }

                form.button(`${itemTag} - §d${armorTypes[armorPieces.indexOf(armorPiece)]}`);
                storedItems.push({
                    item: armorPiece,
                    slot: EquipmentSlot[armorTypes[armorPieces.indexOf(armorPiece)]]
                });
            }
        }

        // Search inventory for a tool, looping through each slot
        for (let i = 0; i < playerInventory.container.size; i++) {
            const item = playerInventory.container.getItem(i);
            if (!item) continue;
            if (item.typeId.includes("pick") || item.typeId.includes("axe") || item.typeId.includes("shovel") || item.typeId.includes("hoe") || item.typeId.includes("sword")) {
                let itemTag = item.nameTag;
                if (!itemTag) {
                    // Remove the "minecraft:" prefix and capitalize the first letter of each word
                    itemTag = item.typeId.split(":")[1].split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

                    let itemMaterial = item.typeId.split(":")[1].split("_")[0];
                    let itemColor = specialTypes[itemMaterial] || MinecraftColors.WHITE;
                    itemTag = itemColor + itemTag;
                }


                form.button(`${itemTag} - §dSlot ${i}`);
                storedItems.push({
                    item: item,
                    slot: i
                });
            }
        }

        // @ts-ignore
        form.show(player).then(response => {
            if (response.canceled) return;
            if (response.selection === undefined) return;

            const selectedSlot = storedItems[response.selection];
            playerItem = selectedSlot.item;

            handleEnchantmentMenu(player, playerItem, selectedSlot.slot);
        });
    } else {
        handleEnchantmentMenu(player, playerItem, EquipmentSlot.Mainhand);
    }
}