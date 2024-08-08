import { world, Player, Vector3 } from "@minecraft/server";
import { EffectDataT, MinecraftDynamicPropertyT, PlayerDataT } from '../types';

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