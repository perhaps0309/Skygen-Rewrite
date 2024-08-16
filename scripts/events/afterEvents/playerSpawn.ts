import { EntityEffectOptions, PlayerSpawnAfterEvent, system } from "@minecraft/server";
import { EffectDataT } from "../../types";
import { playersData } from "../../main";

export function playerSpawn(event: PlayerSpawnAfterEvent) {
    // Reapply effects when player spawns, after a death for example
    // Start by checking if they are missing any effects and reapply them
    const player = event.player;
    const playerData = playersData[player.name];
    const playerEffects = playerData.getEffects();
    const effectKeys = Object.keys(playerEffects);

    for (const effectName of effectKeys) {
        const effectData = playerEffects[effectName];

        if (effectData.effect.includes("-custom")) {
            effectData.applied = true;
            playerData.addEffect(effectName, effectData);
            continue;
        }

        if (effectData.applied) {
            const entityOptions: EntityEffectOptions = {
                amplifier: effectData.strength,
                showParticles: false,
            };

            const remainingDuration = effectData.duration - (Math.round((system.currentTick - effectData.startTime) / 20));
            player.addEffect(effectData.effect, remainingDuration * 20, entityOptions);
            playerData.addEffect(effectName, effectData);
        }
    }
}