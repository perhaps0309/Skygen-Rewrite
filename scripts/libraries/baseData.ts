import { BlockDataT } from "../types";

export const validBlockTypes: { [key: string]: { [key: string]: BlockDataT } } = {
    pickaxe: {
        "minecraft:coal_ore": { item: "minecraft:coal", minAmount: 1, maxAmount: 10 },
        "minecraft:diamond_ore": { item: "minecraft:diamond", minAmount: 1, maxAmount: 10 },
        "minecraft:emerald_ore": { item: "minecraft:emerald", minAmount: 1, maxAmount: 10 },
        "minecraft:gold_ore": { item: "minecraft:gold_ingot", minAmount: 1, maxAmount: 10 },
        "minecraft:iron_ore": { item: "minecraft:iron_ingot", minAmount: 1, maxAmount: 10 },
        "minecraft:redstone_ore": { item: "minecraft:redstone", minAmount: 1, maxAmount: 10 },
        "minecraft:lapis_ore": { item: "minecraft:lapis_lazuli", minAmount: 1, maxAmount: 10 },
    },
    axe: {
        "minecraft:oak_log": { item: "minecraft:oak_log", minAmount: 1, maxAmount: 10 },
    }
};

export const toolTypes: { [key: string]: string } = {
    // Pickaxes
    "minecraft:wooden_pickaxe": "pickaxe",
    "minecraft:stone_pickaxe": "pickaxe",
    "minecraft:iron_pickaxe": "pickaxe",
    "minecraft:gold_pickaxe": "pickaxe",
    "minecraft:diamond_pickaxe": "pickaxe",
    "minecraft:netherite_pickaxe": "pickaxe",

    // Axes
    "minecraft:wooden_axe": "axe",
    "minecraft:stone_axe": "axe",
    "minecraft:iron_axe": "axe",
    "minecraft:gold_axe": "axe",
    "minecraft:diamond_axe": "axe",
    "minecraft:netherite_axe": "axe",
}