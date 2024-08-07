import { Player } from "@minecraft/server";

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
    [x: string]: {};
    playerData: {};
    effects: EffectDataT;
    dropMultiplier: number;
    xpMultiplier: number;
    damageMultiplier: number;
    baseHaste: number;
    effectIndex: number;
    lastEffectTime: number;
    player: Player;
    ranks: { [key: string]: MinecraftDynamicPropertyT };
    [key: string]: any;
}

export type EnchantmentDataT = {
    name: string;
    currentDisplayName: string;
    level: number;
    [key: string]: any;
}