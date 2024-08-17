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
import { ItemData } from "../item/ItemData";
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
    itemData.addCustomLore("§7Right click to place " + itemStack.nameTag, "§dGenerator Info")
    itemData.addCustomLore("§7Level: " + GeneratorData.level + "/" + GeneratorData.maxLevel, "§dGenerator Info")
    itemData.addCustomLore("§7Cooldown: " + GeneratorData.upgrades.cooldown + "s", "§dGenerator Info")
    itemData.addCustomLore("§7Drops Multiplier: " + GeneratorData.upgrades.dropsMultiplier, "§dGenerator Info")

    itemData.updateLore();
    return itemData.item;
}

export function generatorCreation(event: ItemUseOnBeforeEvent) {
    const player = event.source;
    const item = event.itemStack; // Check if item is a generator item


}