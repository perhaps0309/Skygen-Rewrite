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
    world,
    Vector3, // Add this line to import the Vector3 class
} from "@minecraft/server";
import { validBlockTypes, toolTypes } from "../../libraries/baseData";
import { addLore, ItemDataHandler, removeLore } from "../../libraries/itemData";
import { removeFormat } from "../../libraries/chatFormat";
import { WorldDataHandler } from "../../libraries/worldData";
import { PlayerDataHandler } from "../../libraries/playerData";
import { AdminSelectionT } from "../../types";

let genTypes: { [key: string]: string } = {
    "coal": "minecraft:coal_ore"
}

let genBlocks: { [key: string]: string } = {} // This will be used to store the block positions, and the generator type
function tickSystem() {
    // Run every second
    if (system.currentTick % 1 === 0) { // 20 ticks = 1 second
        let dimension = world.getDimension("overworld")
        for (const blockPos in genBlocks) {
            let blockPosS = blockPos.split(",");
            let blockVector3: Vector3 = { x: Number(blockPosS[0]), y: Number(blockPosS[1] + 1), z: Number(blockPosS[2]) };

            let block = dimension.getBlock(blockVector3);
            if (!block) continue;
            if (block.typeId === "minecraft:air") {
                let generatorType = genBlocks[blockPos];
                console.warn(generatorType)
                dimension.setBlockType(blockVector3, generatorType);
            }
        }
    }

    system.run(tickSystem);
}

system.run(tickSystem);

export function handleGeneratorCreation(event: ItemUseOnBeforeEvent) {
    const player = event.source;
    const item = event.itemStack;
    const block = event.block;

    // Check if player is a player, and is holding stone
    if (!item) return;

    // console.warn(!player, !item, item.typeId !== "minecraft:stone", block.typeId !== "minecraft:dirt")
    if (!player || !item || item.typeId !== "minecraft:stone" || block.typeId !== "minecraft:dirt") return;

    const itemLore = item.getLore()
    if (!itemLore[0] || !itemLore[0].includes("generator")) return;

    let generatorOp = itemLore[0].split(" generator")[0].split("a ")[1].split("generator")[0]
    let generatorType: string = removeFormat(generatorOp)
    console.warn("genType", generatorType, generatorOp);

    // Set the block to a repeating command block

    event.cancel = true;
    system.run(function () {
        player.sendMessage(`Set a repeating command block to generate ${generatorType} at ${block.x}, ${block.y + 1}, ${block.z}`);
        block.dimension.setBlockType(block, "minecraft:bedrock");

        // Remove the item from the player's inventory
        const playerInventory = event.source.getComponent("minecraft:inventory") as EntityInventoryComponent;
        if (!playerInventory.container) return;

        system.run(function () {
            // Remove the item from the player's inventory if amount is 1
            const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
            if (playerInventory) {
                const container = playerInventory.container;
                if (!container) return;
                for (let i = 0; i < container.size; i++) {
                    const slot = container.getItem(i);
                    if (slot && slot.typeId === item.typeId && slot.getLore()[0] === itemLore[0]) {
                        container.setItem(i, new ItemStack("minecraft:air", 1));
                        break;
                    }
                }
            }
        })

        // Add the block to the genBlocks object
        genBlocks[`${block.x},${block.y},${block.z}`] = generatorType;
    })
}

export function handleAdminStick(event: ItemUseOnBeforeEvent) {
    const player = event.source;
    const item = event.itemStack;
    const block = event.block;
    if (!item) return;
    if (item.typeId != "minecraft:stick") return;

    let adminSelections = PlayerDataHandler.get("AdminSelections", player) as unknown as AdminSelectionT;
    if (!adminSelections) {
        adminSelections = {
            firstSelection: undefined,
            secondSelection: undefined
        }
        PlayerDataHandler.set("AdminSelections", adminSelections, player);
    }


}