import { EntityEffectOptions, Player, system } from "@minecraft/server";
import { EffectDataT, MinecraftDynamicPropertyT, PlayerDataT } from "../../../types";
import { PlayerDataHandler } from "./playerData";

/*
    Example data:
    const newHaste = {
        effect: "haste",
        duration: 120,
        strength: 3,
        title: "Haste",
        startTime: system.currentTick
    }
*/
export function addEffect(player: Player, newEffectData: EffectDataT) {
    const playerEffects = PlayerDataHandler.get("effects", player) as unknown as { [key: string]: MinecraftDynamicPropertyT } || {};
    playerEffects[newEffectData.effect] = newEffectData;
    PlayerDataHandler.set("effects", playerEffects, player);
}

export function applyEffectProperties(playerData: PlayerDataT) {
    const playerName = playerData.player.name;
    const effectKeys = Object.keys(playerData.effects);

    // Check if the player's current effect index is undefined or too large and reset it.
    if (playerData.effectIndex == undefined || playerData.effectIndex > effectKeys.length - 1) {
        playerData.effectIndex = 0;
    }

    // Get the effect data for the effect currently being displayed then display it
    const effectData = playerData.effects[effectKeys[playerData.effectIndex]] as EffectDataT;
    if (effectData) {
        playerData.player.dimension.runCommand(`/title "${playerName}" actionbar ${effectData.title} - ${effectData.duration - (Math.round((system.currentTick - effectData.startTime) / 20))}s`);
    }

    for (const effect of effectKeys) {
        // Get effect data and setup the effect's options using EntityEffectOptions
        const effectData = playerData.effects[effect] as EffectDataT;

        // Check if expired
        if (system.currentTick - effectData.startTime > effectData.duration * 20) {
            delete playerData.effects[effect];
            PlayerDataHandler.set("effects", playerData.effects, playerData.player);
            continue;
        }

        // Check if the effect is already applied
        if (effectData.applied) {
            continue;
        };

        if (effectData.effect.includes("-custom")) {
            effectData.applied = true;
            continue;
        }

        // Apply the effect

        const entityOptions: EntityEffectOptions = {
            amplifier: effectData.strength,
            showParticles: false,
        };

        const player = playerData.player;
        player.addEffect(effectData.effect, effectData.duration * 20, entityOptions);
        effectData.applied = true;
        playerData.effects[effect] = effectData;
        PlayerDataHandler.set("effects", playerData.effects, player);
    }
}

export function rotateEffectTitles(playerData: PlayerDataT) {
    const player = playerData.player;
    const effectKeys = Object.keys(playerData.effects);
    if (playerData.effectIndex === undefined || playerData.effectIndex + 1 > effectKeys.length) playerData.effectIndex = 0;

    playerData.effectIndex++;
    PlayerDataHandler.set("effects", playerData.effects, player);
    PlayerDataHandler.set("effectIndex", playerData.effectIndex, player);
}