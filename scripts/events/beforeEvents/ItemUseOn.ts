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
    Vector3,
    ItemUseBeforeEvent,
    ItemLockMode, // Add this line to import the Vector3 class
} from "@minecraft/server";
import { validBlockTypes, toolTypes } from "../../libraries/data/generators/generatorData";
import { removeFormat } from "../../libraries/chatFormat";
import { WorldDataHandler } from "../../libraries/data/world/worldData";
import { AdminSelectionT } from "../../types";
import { handleAdminMenu } from "../../libraries/admin/adminMenuHandler";

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
                console.warn('test', generatorType, blockVector3)
                dimension.setBlockType(blockVector3, generatorType);
            }
        }
    }

    system.run(tickSystem);
}

system.run(tickSystem);

export function handleAdminStick(event: ItemUseBeforeEvent) {
    const player = event.source;
    const item = event.itemStack;
    if (!item) return;
    // if (item.typeId != "minecraft:stick" || !player.hasTag("AdminPerms")) return;

    system.run(() => {
        handleAdminMenu(player);
    });
}

export function handleCompass(event: ItemUseOnBeforeEvent) {
    const player = event.source;
    const item = event.itemStack;
    if (!item) return;
    if (item.typeId != "minecraft:compass" || item.lockMode !== ItemLockMode.slot) return; // Check if the item is a compass and is locked


}