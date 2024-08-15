import { world, Player, Vector3, EntityComponentTypes, EntityEquippableComponent, EquipmentSlot } from "@minecraft/server";
import { EffectDataT } from "../../../types";
export const PlayerDataHandler = {
    // Gets the value of a property from the player
    // If it's JSON, then it will automatically be parsed
    get(key: string, player: Player) {
        let value = player.getDynamicProperty(key);
        try { value = JSON.parse(value as string); } catch (err) { }
        return value;
    },

    // Sets the value of a property on the player
    set(key: string, value: any, player: Player) {
        if (value === undefined) throw Error("Invalid value.");
        if (typeof value === "object") value = JSON.stringify(value);
        player.setDynamicProperty(key, value);
    },

    // Checks if the player has a property
    has(key: string, player: Player) {
        return !!(player).getDynamicProperty(key);
    },

    // Deletes a property from the player
    delete(key: string, player: Player) {
        player.setDynamicProperty(key, undefined);
    },

    // Gets all of a player's data
    entries(player: Player) {
        const dynamicPropertyIds = player.getDynamicPropertyIds();
        const entries: { [key: string]: any } = {}
        for (const dynamicPropertyKey of dynamicPropertyIds) {
            entries[dynamicPropertyKey] = this.get(dynamicPropertyKey, player);
        }

        return entries;
    },

    // Deletes all of a player's data
    deleteAll(player: Player) {
        const playerData = this.entries(player);
        for (const dynamicPropertyKey of Object.keys(playerData)) {
            this.delete(dynamicPropertyKey, player);
        }
    },

    // Loops through all players and get their data
    getAll() {
        const players = world.getPlayers();
        const data: { [key: string]: any } = {};
        for (const player of players) {
            data[player.name] = this.entries(player); // Get current data for the player
            data[player.name].player = player; // Append the player object onto the player's data
        }

        return data;
    }
};

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

// Tries to parse the value as JSON data, and if it it fails, then returns the original data.
function safeJsonParser(value: string) {
    try {
        value = JSON.parse(value as string);
    } catch (err) { }
    return value;
}

// Tries to stringify JSON data, and if it fails, then returns the original data.
function safeJsonStringify(value: any) {
    // If the value is an object, then stringify it.
    // Otherwise, return the original value.
    if (typeof value === "object") {
        value = JSON.stringify(value)
    }
    return value;
}

export class PlayerData {
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    getEffects(): { [key: string]: EffectDataT } {
        const effects = (this.player.getDynamicProperty("effects") as string) || "";
        return safeJsonParser(effects) as unknown as { [key: string]: EffectDataT } || {};
    }

    setEffect(effectName: string, effectData: EffectDataT) {
        const effects = this.getEffects();
        effects[effectName] = effectData;
        this.player.setDynamicProperty("effects", safeJsonStringify(effects));
    }

    getRanks(): { [key: string]: number } {
        const ranks = (this.player.getDynamicProperty("ranks") as string) || "";
        return safeJsonParser(ranks) as unknown as { [key: string]: number } || {};
    }

    setRank(rankName: string, rankPriority: number) {
        const ranks = this.getRanks();
        ranks[rankName] = rankPriority;
        this.player.setDynamicProperty("ranks", safeJsonStringify(ranks));
    }

    getPlots() {

    }

    setPlots() {

    }

    getIsBanned() {
        return this.player.getDynamicProperty("isBanned") || false;
    }

    setIsBanned(newValue: boolean) {
        this.player.setDynamicProperty("isBanned", newValue);
    }

    // Retrieves a player's equippable slots such as armor, mainhand, offhand.
    getEquippable() {
        return this.player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
    }
}