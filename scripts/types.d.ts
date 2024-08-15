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

export type PlayerDataT = {
    effects: EffectDataT;
    dropMultiplier: number;
    xpMultiplier: number;
    damageMultiplier: number;
    baseHaste: number;
    effectIndex: number;
    lastEffectTime: number;
    player: Player;
    ranks: { [key: string]: number };
    isBanned: boolean;
}

export type EnchantmentDataT = {
    name: string;
    currentDisplayName: string;
    level: number;
    [key: string]: any;
}

export type EnchantmentPurchaseT = {
    title: string;
    description: string;
    name: string;
    baseCost: number;
    costIncrease: number;
    effectTitle: string; // "more damage", "more drops",
    effectType: string; // "percent", "flat"
    effectAmount: number;
    effectSymbol?: string;
    maxLevel?: number;
}

export type PlotT = {
    location: Vector3; // Set on the corner where the fill command takes place
    permissions: { [playerName: string]: number };
}

export type AdminSelectionT = {
    firstSelection: Vector3 | undefined;
    secondSelection: Vector3 | undefined;
}