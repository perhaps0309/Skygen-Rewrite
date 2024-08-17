import { Player, Vector3 } from "@minecraft/server";

export type MinecraftDynamicPropertyT = boolean | number | string | Vector3 | {} | undefined;

export type BlockDataT = {
    item: string;
    minAmount: number;
    maxAmount: number;
}

export type EffectDataT = {
    effect: string;
    duration: number;
    strength: number;
    title: string;
    startTime: number;
    displaying: boolean;
    lastDisplayTime: number;
    applied: boolean;
    [key: string]: MinecraftDynamicPropertyT;
}

export type EnchantmentDataT = {
    name: string;
    level: number;
    [key: string]: any;
}

export type ItemEffectDataT = {
    name: string;
    level: number;
    [key: string]: any;
}

export type EnchantmentPurchaseT = {
    name: string;
    title: string;
    description: string;
    baseCost: number;
    effectTitle: string; // "more damage", "more drops",
    effectType: string; // "percent", "flat"
    effectAmount: number;
    effectSymbol?: string;
    maxLevel?: number;
    applicable?: string[]; // "pickaxe", "axe", "shovel", "sword", "bow", "armor", "tool", "hoe"
    rarity: string; // "common", "uncommon", "rare", "epic", "legendary"
}

export type PlotT = {
    location: Vector3; // Set on the corner where the fill command takes place
    permissions: { [playerName: string]: number };
}

export type AdminSelectionT = {
    firstSelection: Vector3 | undefined;
    secondSelection: Vector3 | undefined;
}

export type GeneratorDataT = {
    type: string;
    upgrades: { cooldown: number, dropsMultiplier: number, luck: number };
    level: number;
    maxLevel: number;
    autoMiner: { speed: number, cooldown: number, storage: number };
    position: Vector3;
    owner: Player;
}