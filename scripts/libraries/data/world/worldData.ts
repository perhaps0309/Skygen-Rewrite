import { World } from "@minecraft/server";

export const WorldDataHandler = {
    // Gets the value of a property from the world
    // If it's JSON, then it will automatically be parsed
    get(key: string, world: World) {
        let value = world.getDynamicProperty(key);
        try { value = JSON.parse(value as string); } catch (err) { }
        return value;
    },

    // Sets the value of a property on the world
    set(key: string, value: any, world: World) {
        if (value === undefined) throw Error("Invalid value.");
        if (typeof value === "object") value = JSON.stringify(value);
        world.setDynamicProperty(key, value);
    },

    // Checks if the world has a property
    has(key: string, world: World) {
        return !!(world).getDynamicProperty(key);
    },

    // Deletes a property from the world
    delete(key: string, world: World) {
        world.setDynamicProperty(key, undefined);
    },

    // Gets all of a world's data
    entries(world: World) {
        const dynamicPropertyIds = world.getDynamicPropertyIds();
        const entries: { [key: string]: any } = {}
        for (const dynamicPropertyKey of dynamicPropertyIds) {
            entries[dynamicPropertyKey] = this.get(dynamicPropertyKey, world);
        }

        return entries;
    },

    // Deletes all of a world's data
    deleteAll(world: World) {
        const worldData = this.entries(world);
        for (const dynamicPropertyKey of Object.keys(worldData)) {
            this.delete(dynamicPropertyKey, world);
        }
    },
};

export class WorldData {

}