import { world, Player, Vector3, EntityComponentTypes, EntityEquippableComponent, EquipmentSlot } from "@minecraft/server";
import { EffectDataT } from "../../../types";
import { rankPriority } from "./ranks";
import { PlayerData } from "../../../util/scripts/extensions/PlayerData";
import { safeJsonParser, safeJsonStringify } from "../../../util/scripts/functions/json";

const playersData: { [key: string]: SkygenPlayerData } = {};
export function getPlayerData(playerName: string) {
    return playersData[playerName];
}

export function hasPlayerData(playerName: string) {
    return playersData[playerName] ? true : false;
}

export function deletePlayerData(playerName: string) {
    delete playersData[playerName];
}

export class SkygenPlayerData extends PlayerData {
    player: Player;

    constructor(player: Player) {
        super(player);
        this.player = player;
    }

    getEffects(): { [key: string]: EffectDataT } {
        const effects = (this.player.getDynamicProperty("effects") as string) || "{}";
        return safeJsonParser(effects) as unknown as { [key: string]: EffectDataT } || {};
    }

    addEffect(effectName: string, effectData: EffectDataT) {
        const effects = this.getEffects();
        effects[effectName] = effectData;
        this.player.setDynamicProperty("effects", safeJsonStringify(effects));
    }

    removeEffect(effectName: string) {
        const effects = this.getEffects();
        delete effects[effectName];
        this.player.setDynamicProperty("effects", safeJsonStringify(effects));
    }

    removeAllEffects() {
        this.player.setDynamicProperty("effects", "{}");
    }

    getEffectIndex() {
        return this.player.getDynamicProperty("effectIndex") as number || 0;
    }

    setEffectIndex(newValue: number) {
        this.player.setDynamicProperty("effectIndex", newValue);
    }

    getIsBanned() {
        return this.player.getDynamicProperty("isBanned") || false;
    }

    setIsBanned(newValue: boolean) {
        this.player.setDynamicProperty("isBanned", newValue);
    }

    getRanks(): { [key: string]: number } {
        const ranks = (this.player.getDynamicProperty("ranks") as string) || `{ "Member": 0 }`;
        return safeJsonParser(ranks) as unknown as { [key: string]: number } || {};
    }

    hasRank(rankName: string) {
        const ranks = this.getRanks();
        return ranks[rankName] ? true : false;
    }

    addRank(rankName: string) {
        let rankP = rankPriority[rankName];
        if (!rankPriority) throw Error("Invalid rank name.");

        const ranks = this.getRanks();
        ranks[rankName] = rankP;

        this.player.setDynamicProperty("ranks", safeJsonStringify(ranks));
    }

    removeRank(rankName: string) {
        const ranks = this.getRanks();
        if (!ranks[rankName]) return;

        delete ranks[rankName];
        this.player.setDynamicProperty("ranks", safeJsonStringify(ranks));
    }

    getHasJoined() {
        return this.player.getDynamicProperty("hasPlayerJoined") || false;
    }

    setHasJoined(newValue: boolean) {
        this.player.setDynamicProperty("hasPlayerJoined", newValue);
    }
}

// Creates a player's data 
// Only creates the player's data class if they don't already have one
export function createPlayerData(player: Player) {
    if (!hasPlayerData(player.name)) {
        playersData[player.name] = new SkygenPlayerData(player);
    }
}

// Gets a player's object from their name.
// Handles player's with spaces in their names aswell.
export function getPlayerFromName(playerName: string | string[]) {
    if (typeof playerName == "string") {
        // Handles player's without spaces in their name.
        const allPlayers = world.getAllPlayers();
        let targetPlayer: Player | undefined = undefined;
        for (const potentialPlayer of allPlayers) {
            console.log(potentialPlayer.name, playerName)
            if (potentialPlayer.name == playerName) {
                targetPlayer = potentialPlayer;
                break;
            }
        }

        return targetPlayer;
    } else {
        // Handles player's with spaces in their names
        // Check if the player is indicated to have a space in their name, and if not, then return normally.
        const playerNameStrings = playerName;
        const initialString = playerNameStrings[0];
        if (!initialString.includes(`"`)) {
            return getPlayerFromName(initialString);
        }

        // Add the intiial index to the finalPlayerName then keep adding until another quotation mark is found.
        let finalPlayerName = "";
        finalPlayerName += initialString;
        for (let i = 1; i < playerNameStrings.length; i++) {
            const currentSection = playerNameStrings[i];
            finalPlayerName += currentSection;
            if (currentSection.includes(`"`)) {
                break;
            }
        }

        // Remove all quotation marks from the final player name.
        finalPlayerName = finalPlayerName.replaceAll(`"`, "");

        // Go through all players until the name is found.
        const allPlayers = world.getAllPlayers();
        let targetPlayer: Player | undefined = undefined;
        for (const potentialPlayer of allPlayers) {
            console.log(potentialPlayer.name, playerName)
            if (potentialPlayer.name == finalPlayerName) {
                targetPlayer = potentialPlayer;
                break;
            }
        }
    }
}