import {
    ItemStack,
    EntityInventoryComponent,
    ItemComponentTypes,
    ItemEnchantableComponent,
    GameMode,
    PlayerBreakBlockAfterEvent,
    system,
} from "@minecraft/server";
import { validBlockTypes, toolTypes } from "../../libraries/data/generators/generatorData";
import { ItemData } from "../../libraries/data/item/ItemData";
import { EffectDataT, EnchantmentDataT } from "../../types";
import { playersData } from "../../main";

export function telekinesisAfterBreak(event: PlayerBreakBlockAfterEvent) {
    const player = event.player;
    const playerItem = event.itemStackBeforeBreak; // Use this to calculate fortune, silk touch, and custom enchants
    const playerItemAfterBreak = event.itemStackAfterBreak; // Use this if you need the current state of the item
    const blockBroken = event.brokenBlockPermutation;
    const blockId = blockBroken.type.id;
    if (player.getGameMode() != GameMode.survival || !playerItem || !playerItemAfterBreak) return;

    // Check if the player is holding an item
    const itemType = toolTypes[playerItem.typeId];
    if (!itemType) return;

    // Check if item is a pickaxe/axe and is in the validBlockTypes list
    const blockData = validBlockTypes[itemType][blockId];
    const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
    if (!playerItem || !playerInventory.container || !itemType || !blockData) return;

    // Get and apply item enchantments
    const itemEnchantments = (playerItem.getComponent(ItemComponentTypes.Enchantable) as ItemEnchantableComponent).getEnchantments();
    if (!itemEnchantments) return;

    // Get the player's effects and apply the luck fromn the effects
    const playerEffects = playersData[player.name].getEffects();
    const playerLuck = playerEffects["luck-custom"];
    let blockCount = blockData.minAmount;
    let totalLuck = playerLuck ? playerLuck.strength : 0; // Luck 1 = 1 per level, Luck 2 = 2 per level, Luck 3 = 3 per level

    // Get custom enchantments
    let itemData = new ItemData(playerItem, player);
    const customEnchantments = itemData.getEnchantments();
    for (const enchantment of Object.values(customEnchantments)) {
        const anyEnchantment = enchantment as any;
        if (anyEnchantment.name == "luck1") {
            totalLuck += anyEnchantment.level;
        } else if (anyEnchantment.name == "luck2") {
            totalLuck += anyEnchantment.level * 2;
        } else if (anyEnchantment.name == "luck3") {
            totalLuck += anyEnchantment.level * 4;
        }
    }

    for (const enchantment of Object.values(customEnchantments)) {
        const anyEnchantment = enchantment as any;
        switch (anyEnchantment.name) {
            case "fortune": {
                // Use luck and fortune to calculate the block drop, (1/(level+2))+((level+1)/2)
                // Max amount has weight of 10, min amount has weight of 1
                const fortuneLevel = anyEnchantment.level;
                const chance = (1 / (fortuneLevel + 2)) + ((fortuneLevel + 1) / 2);
                const weightedChance = chance * totalLuck;
                const randomValue = Math.random();

                if (randomValue < weightedChance) {
                    blockCount = blockData.maxAmount;
                } else { // Go between min and max amount using luck
                    blockCount = Math.min(chance * (blockData.maxAmount - blockData.minAmount) + blockData.minAmount, blockData.maxAmount);
                }

                break;
            }
            default:
                continue;
        }
    }

    if (playerEffects["double_drops-custom"]) {
        blockCount *= 2;
    }

    // Add the block to the player's inventory
    const playerContainer = playerInventory.container;
    const blockStack = new ItemStack(blockData.item, blockCount);
    playerContainer.addItem(blockStack);

    // Kill the block drop by running a kill command
    const blockPosition = event.block.location;
    event.dimension.runCommand(`/kill @e[type=item,r=2,x=${blockPosition.x},y=${blockPosition.y},z=${blockPosition.z}]`);
}
