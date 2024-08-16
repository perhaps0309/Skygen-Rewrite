import { world, Vector3, ChatSendBeforeEvent, system, EntityInventoryComponent, ItemLockMode } from '@minecraft/server';
import { chatError, chatServer, chatSuccess } from './libraries/chatFormat';
import { PlotT } from './types';
import { Vector3Builder } from '@minecraft/math';
import { WorldDataHandler } from './libraries/data/world/worldData';
import { getPlayerFromName } from './libraries/data/player/playerData';
import { createPlot, createPlots, destroyPlots } from './libraries/data/world/plots';

export function invalidPermissions(event: ChatSendBeforeEvent) {
    return chatError(event.sender, "You do not have permissions to run this command.");
}

// !help 

export function help(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const commands = [
        "§ehelp - §aDisplays this help menu",
        "§ereport - §aOpens the report menu",
        "§eplot - §aCreates a plot for the player",
        "§eaddperm §d<player> <build:destroy> §a- Allows a player permissions on your plot",
        "§eaddrestrictedperm §d<player> <build:destroy> §a- Allows a player permissions on your plot while you are online",
        "§eremoveperm §d<player> <build:destroy> §a- Removes a player's permissions on your plot"
    ];

    const adminCommands = [
        "§elockinv §d<player> <duration> §e- §aLocks a player's inventory",
        "§eunlockinv §d<player> §e- §aUnlocks a player's inventory",
        "§eresetPlots - §aResets all plots",
        "§esetplotarea - §aSets the world plot area",
    ]

    chatServer(player, "§eGame Commands");
    commands.forEach(command => player.sendMessage(command));
    player.sendMessage("\n");

    // Check if admin
    chatServer(player, "§4Admin Commands")
    adminCommands.forEach(command => player.sendMessage(command));
    player.sendMessage("\n");
}

// !report

export function report(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const targetPlayerName = args[0];
    if (!targetPlayerName) {
        return chatError(player, "You must provide the username who you want to report.");
    }
}

// !punish
export function punish(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const targetPlayerName = args[0];
    if (!targetPlayerName) {
        return chatError(player, "You must provide the username who you want to grant permissions.");
    }

    const targetPlayer = getPlayerFromName(targetPlayerName);
    if (!targetPlayer) {
        return chatError(player, "No player by that username found.");
    }

    const playerInventory = targetPlayer.getComponent("minecraft:inventory") as EntityInventoryComponent;
    const inventoryContainer = playerInventory.container;
    if (!inventoryContainer) return;

    for (let i = 0; i < inventoryContainer.size; i++) {
        const slot = inventoryContainer.getSlot(i);
        if (slot.getItem()) {
            slot.lockMode = ItemLockMode.slot;
        }
    }
}

// !unpunish
export function unpunish(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const targetPlayerName = args[0];
    if (!targetPlayerName) {
        return chatError(player, "You must provide the username who you want to unpunish.");
    }

    const targetPlayer = getPlayerFromName(targetPlayerName);
    if (!targetPlayer) {
        return chatError(player, "No player by that username found.");
    }

    const playerInventory = targetPlayer.getComponent("minecraft:inventory") as EntityInventoryComponent;
    const inventoryContainer = playerInventory.container;
    if (!inventoryContainer) return;

    for (let i = 0; i < inventoryContainer.size; i++) {
        const slot = inventoryContainer.getSlot(i);
        if (slot.getItem()) {
            slot.lockMode = ItemLockMode.none;
        }
    }
}

// !createplot

export function createPlotChat(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const playerPosition = player.location;
    createPlots(playerPosition, world.getDimension("overworld"));
}

export function destroyPlotChat(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const playerPosition = player.location;
    destroyPlots(playerPosition, world.getDimension("overworld"));
}

// !setplotarea
export function setPlotArea(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const playerPosition = player.location;
    world.setDynamicProperty("plotArea", playerPosition)
    chatSuccess(player, "Successfully set world plot location.");
}

export function getPlotFromPosition(position: Vector3) {
    const plots = WorldDataHandler.get("plots", world) as unknown as { [key: string]: PlotT };
    if (!plots) {
        return;
    }

    let plotFound = "";
    for (const plotPlayerName in plots) {
        const plot = plots[plotPlayerName];
        const location = plot.location;
        const xMin = location.x;
        const zMin = location.z;
        const xMax = location.x + 51;
        const zMax = location.z + 51;

        if (position.x >= xMin && position.x <= xMax && position.z >= zMin && position.z <= zMax) {
            plotFound = plotPlayerName;
        }
    }

    return plotFound;
}

// !plot
export function plot(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;

    const basePlotLocation = world.getDynamicProperty("plotArea") as Vector3;
    let plots = WorldDataHandler.get("plots", world) as unknown as { [key: string]: PlotT };
    if (!basePlotLocation) {
        return chatError(player, "A world plot location has not been set yet.")
    }
    if (!plots) {
        plots = {
            [player.name + Math.random()]: {
                location: basePlotLocation,
                permissions: {}
            }
        }
        world.setDynamicProperty("plots", JSON.stringify(plots));
    }

    const directions = [
        new Vector3Builder(50, 0, 0),   // Right
        new Vector3Builder(-50, 0, 0),  // Left
        new Vector3Builder(0, 0, 50),   // North
        new Vector3Builder(0, 0, -50),  // South
        new Vector3Builder(50, 0, 50),  // North-East
        new Vector3Builder(50, 0, -50), // South-East
        new Vector3Builder(-50, 0, 50), // North-West
        new Vector3Builder(-50, 0, -50) // South-West
    ];

    let newPlotLocation: Vector3 | undefined = Object.keys(plots).length == 0 ? basePlotLocation : undefined;
    const plotKeys = Object.keys(plots);
    if (!newPlotLocation) {
        for (let i = 0; i < plotKeys.length; i++) {
            const plotPlayerName = plotKeys[i];
            console.warn(`Plot player name: ${plotPlayerName}`);
            const plot = plots[plotPlayerName];
            const plotLocation = plot.location;

            for (const direction of directions) {
                console.warn(`Current direction: ${direction}`);
                const potentialPlotLocation = new Vector3Builder(
                    plotLocation.x + direction.x,
                    plotLocation.y,
                    plotLocation.z + direction.z
                );

                // Check if this potential plot location is free
                if (!getPlotFromPosition(potentialPlotLocation)) {
                    newPlotLocation = new Vector3Builder(potentialPlotLocation);
                    break;
                }
            }

            if (!newPlotLocation) {
                continue;
            }
        }
    }

    if (!newPlotLocation) {
        return chatError(player, "Unable to find a plot location.")
    }

    system.run(function plotTick() {
        let successCount = 0;
        player.teleport(newPlotLocation);
        successCount += world.getDimension("overworld").runCommand(`/fill ${newPlotLocation.x - 1} ${newPlotLocation.y} ${newPlotLocation.z - 1} ${newPlotLocation.x + 51} ${newPlotLocation.y} ${newPlotLocation.z + 51} minecraft:black_concrete`).successCount;
        successCount += world.getDimension("overworld").runCommand(`/fill ${newPlotLocation.x} ${newPlotLocation.y} ${newPlotLocation.z} ${newPlotLocation.x + 50} ${newPlotLocation.y} ${newPlotLocation.z + 50} minecraft:grass_block`).successCount;

        if (successCount < 2) {
            system.run(plotTick);
        } else {
            player.teleport(new Vector3Builder(newPlotLocation.x, newPlotLocation.y + 5, newPlotLocation.z));
        }
    });

    plots = {
        [player.name + Math.random()]: {
            location: newPlotLocation,
            permissions: {}
        }
    }
    world.setDynamicProperty("plots", JSON.stringify(plots));
    chatSuccess(player, "Successfully created plot");
}

// !resetPlots
export function resetPlots(event: ChatSendBeforeEvent, args: string[]) {
    const plots = WorldDataHandler.get("plots", world) as unknown as { [key: string]: PlotT };
    if (!plots) {
        return;
    }

    for (const plotPlayerName in plots) {
        delete plots[plotPlayerName];
    }

    for (const plotPlayerName in plots) {
        console.warn(plotPlayerName);
    }

    world.setDynamicProperty("plots", JSON.stringify(plots));
    chatSuccess(event.sender, "Successfully reset plots");
}

// !grantperm
export function addPerm(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const plots = WorldDataHandler.get("plots", world) as unknown as { [key: string]: PlotT };
    if (!plots) {
        return;
    }

    const targetPlayerName = args[0];
    if (!targetPlayerName) {
        return chatError(player, "You must provide the username who you want to give perms.")
    }

    if (!plots[player.name]) {
        return chatError(player, "You don't have a plot.")
    }

    if (plots[player.name].permissions[targetPlayerName] == 1) {
        return chatError(player, `${targetPlayerName} already has permissions on your plot.`)
    }

    plots[player.name].permissions[targetPlayerName] = 1;
    WorldDataHandler.set("plots", plot, world);
    chatSuccess(player, `Successfully gave plot permissions to ${targetPlayerName}.`)
}

// !removeperm
export function removePerm(event: ChatSendBeforeEvent, args: string[]) {
    const player = event.sender;
    const plots = WorldDataHandler.get("plots", world) as unknown as { [key: string]: PlotT };
    if (!plots) {
        return;
    }

    const targetPlayer = args[0];
    if (!targetPlayer) {
        return chatError(player, "You must provide the username who you want to remove perms.");
    }

    if (!plots[player.name]) {
        return chatError(player, "You don't have a plot.");
    }

    if (!plots[player.name].permissions[targetPlayer] || plots[player.name].permissions[targetPlayer] == 0) {
        return chatError(player, `${targetPlayer} does not have permissions on your plot.`)
    }

    plots[player.name].permissions[targetPlayer] = 0;
    WorldDataHandler.set("plots", plot, world);
    chatSuccess(player, `Successfully removed plot permissions from ${targetPlayer}.`)
}