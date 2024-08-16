import { EntityEffectOptions, PlayerSpawnAfterEvent, system } from "@minecraft/server";
import { PlayerDataHandler } from "../../libraries/data/player/playerData";
import { EffectDataT } from "../../types";
import { playersData } from "../../main";

export function playerSpawn(event: PlayerSpawnAfterEvent) {
    // Reapply effects when player spawns, after a death for example
    // Start by checking if they are missing any effects and reapply them
    const player = event.player;
    const playerEffects = playersData[player.name].getEffects();
    const effectKeys = Object.keys(playerEffects);

    for (const effect of effectKeys) {
        const effectData = playerEffects[effect];

        if (effectData.effect.includes("-custom")) {
            effectData.applied = true;
            playerEffects[effect] = effectData;
            PlayerDataHandler.set("effects", playerEffects, player);
            continue;
        }

        if (effectData.applied) {
            const entityOptions: EntityEffectOptions = {
                amplifier: effectData.strength,
                showParticles: false,
            };

            const remainingDuration = effectData.duration - (Math.round((system.currentTick - effectData.startTime) / 20));
            player.addEffect(effectData.effect, remainingDuration * 20, entityOptions);
            playerEffects[effect] = effectData;
            PlayerDataHandler.set("effects", playerEffects, player);
        }
    }
}