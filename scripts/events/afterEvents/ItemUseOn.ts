import {
    ItemStack,
    EntityInventoryComponent,
    ItemComponentTypes,
    ItemEnchantableComponent,
    GameMode,
    PlayerBreakBlockAfterEvent,
    system,
    EntityLoadAfterEvent,
    SpawnEntityOptions,
    ItemUseOnBeforeEvent,
} from "@minecraft/server";
import { validBlockTypes, toolTypes } from "../../libraries/baseData";
import { addLore, ItemDataHandler, removeLore } from "../../libraries/itemData";

let genTypes: { [key: string]: string } = {
    "coal": "minecraft:coal_ore"
}
export function itemUseOn(event: ItemUseOnBeforeEvent) {
    const player = event.source;
    const item = event.itemStack;
    const block = event.block;

    // Check if player is a player, and is holding a spawn egg 
    if (!item) return;

    console.warn(!player, !item, item.typeId !== "minecraft:egg", block.typeId !== "minecraft:dirt")
    if (!player || !item || item.typeId !== "minecraft:egg" || block.typeId !== "minecraft:dirt") return;

    const itemLore = item.getLore()
    console.warn(!itemLore[0], !itemLore[0].includes("generator"))
    if (!itemLore[0] || !itemLore[0].includes("generator")) return;
    let generatorType: string = itemLore[0].split(" generator")[0].split(" ")[1];

    // Set the block to a repeating command block


    player.sendMessage(`Set a repeating command block to generate ${generatorType} at ${block.x}, ${block.y + 1}, ${block.z}`);
    event.cancel = true;

    // Remove the item from the player's inventory
    const playerInventory = event.source.getComponent("minecraft:inventory") as EntityInventoryComponent;
    if (!playerInventory.container) return;

    system.run(function () {
        item.amount -= 1;
    })
}