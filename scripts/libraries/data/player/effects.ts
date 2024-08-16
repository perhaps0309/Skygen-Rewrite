import { EntityEffectOptions, Player, system } from "@minecraft/server";
import { EffectDataT, MinecraftDynamicPropertyT } from "../../../types";
import { PlayerDataHandler } from "./playerData";
import { playersData } from "../../../main";

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

export function applyEffectProperties(player: Player) {
    const playerName = player.name;
    const playerData = playersData[playerName];
    const playerEffects = playerData.getEffects();
    const effectNames = Object.keys(playerEffects);

    // Check if the player's current effect index is undefined or too large and reset it.
    let effectIndex = playerData.getEffectIndex();
    if (effectIndex > effectNames.length - 1) {
        effectIndex = 0;
        playerData.setEffectIndex(effectIndex);
    }

    // Get the effect data for the effect currently being displayed then display it
    const effectData = playerEffects[effectNames[effectIndex]];
    if (effectData) {
        playerData.player.dimension.runCommand(`/title "${playerName}" actionbar ${effectData.title} - ${effectData.duration - (Math.round((system.currentTick - effectData.startTime) / 20))}s`);
    }

    for (const effectName of effectNames) {
        // Get effect data and setup the effect's options using EntityEffectOptions
        const effectData = playerEffects[effectName] as EffectDataT;

        // Check if expired
        if (system.currentTick - effectData.startTime > effectData.duration * 20) {
            playerData.removeEffect(effectName);
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
        playerData.addEffect(effectName, effectData);
    }
}

export function rotateEffectTitles(player: Player) {
    const playerData = playersData[player.name];
    const effectKeys = Object.keys(playerData.getEffects());
    const effectIndex = playerData.getEffectIndex();
    if (effectIndex + 1 > effectKeys.length) {
        playerData.setEffectIndex(0);
    }

    playerData.setEffectIndex(effectIndex + 1);
}