/* 
Display:
(type Generator)
Cooldown: (duration left)s // duration till player can mine again, change to text Ready when ready, change block to bedrock when not ready
Cooldown level: 1/10 
Generator level: 1/10
<Press for options>
*/

import { EntityInventoryComponent, EquipmentSlot, ItemStack, ItemUseOnBeforeEvent, Player } from "@minecraft/server";
import { GeneratorDataT } from "../../../types";
import { ItemData } from "../item/itemData";
import { Vector3Builder } from "@minecraft/math";
let generatorTitles: { [key: string]: string } = {
    "coal_ore": "§8Coal Generator"
}

/**
 * Create a generator ItemStack
 * @param {string} type - The type of generator (eg; "coal_ore")
 * @param {number} amount - The amount of items to create
 * @param {Player} player - The player to give the item to
 * @param {GeneratorDataT} GeneratorData - The data of the generator
 * @returns {ItemStack}
 * @example
 * createGeneratorItem("coal_ore", 1, player, {
 *    type: "coal_ore",
 *    upgrades: {cooldown:1, dropsMultiplier:1, luck:1},
 *    level: 1,
 *    maxLevel: 10,
 *    autoMiner: {speed:1, cooldown:1, storage:1},
 *    position: new Vector3Builder({ x: 0, y: 0, z: 0 }),
 *    owner: player
 * });
 */

export function createGeneratorItem(type: string, amount: number, player: Player, GeneratorData: GeneratorDataT): ItemStack {
    let itemStack = new ItemStack("minecraft:paper", amount);
    itemStack.nameTag = generatorTitles[type] || type;

    let itemData = new ItemData(itemStack, player)
    itemData.setLore(compressGeneratorData(GeneratorData));

    return itemData.item;
}

export function compressGeneratorData(generatorData: GeneratorDataT): string[] { // Compresses the generator data into item lore
    let itemLore: string[] = [];
    itemLore.push("§7Right click to place " + generatorTitles[generatorData.type]);
    itemLore.push("§7Level: " + generatorData.level + "/" + generatorData.maxLevel);
    itemLore.push("§7Cooldown: " + generatorData.upgrades.cooldown + "s");
    itemLore.push("§7Drops Multiplier: " + generatorData.upgrades.dropsMultiplier);
    itemLore.push("§7Auto Miner Level: " + generatorData.autoMiner.level);
    itemLore.push("§7Auto Miner Speed: " + generatorData.autoMiner.speed);
    itemLore.push("§7Auto Miner Storage: " + generatorData.autoMiner.storage);
    itemLore.push("§dOwner: " + generatorData.owner?.name || "None");

    return itemLore;
}

export function decompressGeneratorData(itemLore: string[]): GeneratorDataT { // Decompresses the generator data from item lore
    let generatorData: GeneratorDataT = {
        type: "",
        upgrades: { cooldown: 1, dropsMultiplier: 1 },
        level: 1,
        maxLevel: 10,
        autoMiner: { level: 1, speed: 1, storage: 1 },
        position: new Vector3Builder({ x: 0, y: 0, z: 0 }),
        owner: undefined
    }

    // Get type from generatorTitles
    generatorData.type = Object.keys(generatorTitles).find(key => generatorTitles[key] === itemLore[0].replace("§7Right click to place ", "")) || "";
    itemLore.forEach(line => {
        let split = line.split(": ");
        if (split.length < 2) return;
        let key = split[0];
        let value = split[1];
        switch (key) {
            case "Level":
                let levelSplit = value.split("/");
                generatorData.level = parseInt(levelSplit[0]);
                generatorData.maxLevel = parseInt(levelSplit[1]);
                break;
            case "Cooldown":
                generatorData.upgrades.cooldown = parseInt(value.replace("s", ""));
                break;
            case "Drops Multiplier":
                generatorData.upgrades.dropsMultiplier = parseInt(value);
                break;
            case "Auto Miner Speed":
                generatorData.autoMiner.speed = parseInt(value);
                break;
            case "Auto Miner Level":
                generatorData.autoMiner.level = parseInt(value);
                break;
            case "Auto Miner Storage":
                generatorData.autoMiner.storage = parseInt(value);
                break;
        }
    });

    return generatorData;
}


export function generatorCreation(event: ItemUseOnBeforeEvent) {
    const player = event.source;
    const item = event.itemStack; // Check if item is a generator item

    if (!item) return;
    if (!item.nameTag) return;

    // Check if nameTag has a generator title
    let generatorType = Object.keys(generatorTitles).find(key => generatorTitles[key] === item.nameTag);
    if (!generatorType) return;

    let eventBlock = event.block;
    let generatorData: GeneratorDataT = decompressGeneratorData(item.getLore());

    // Check if type is a valid generator type
    if (!generatorData.type || generatorTitles[generatorData.type]) return;
}