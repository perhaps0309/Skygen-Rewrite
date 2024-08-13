import { Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { MinecraftFormatCodes, MinecraftColors, chatSuccess } from "../libraries/chatFormat";
import { PlayerDataHandler } from "../libraries/playerData";

// Holds all the functions that admins can perform from their admin stick.
export const adminActions: { [key: string]: any } = {
    "Warn": {
        run: warn,
    },
    "Kick": {
        run: kick
    },
    "Ban": {
        run: ban,
    },
    "Unban": {
        run: unban
    },
    "Teleport to": {
        run: teleportTo
    },
    "Teleport here": {
        run: teleportFrom
    },
    "Spectate": () => { },
    "Invsee": () => { },
}

export function warn(player: Player, targetPlayer: Player) {
    // temp message
    player.sendMessage("Warned.")
    chatSuccess(player, `Gave a warning to ${targetPlayer.name}.`);
}

function kick(player: Player, targetPlayer: Player) {
    world.getDimension("overworld").runCommand(`/kick ${targetPlayer.name}`);
    chatSuccess(player, `Kicked ${targetPlayer.name}.`);
}

function ban(player: Player, targetPlayer: Player) {
    PlayerDataHandler.set("isBanned", true, targetPlayer);
    chatSuccess(player, `Banned ${targetPlayer.name}.`);
}

function unban(player: Player, targetPlayer: Player) {
    PlayerDataHandler.set("isBanned", false, targetPlayer);
    chatSuccess(player, `Unbanned ${targetPlayer.name}.`);
}

function teleportTo(player: Player, targetPlayer: Player) {
    player.teleport(targetPlayer.location);
    chatSuccess(player, `Teleported to ${targetPlayer.name}.`);
}

function teleportFrom(player: Player, targetPlayer: Player) {
    targetPlayer.teleport(player.location);
    chatSuccess(player, `Teleported ${targetPlayer.name} to ${player.name}.`);
}

export function openBaseMenu(player: Player, commandRan: string) {
    const form = new ActionFormData()
        .title(MinecraftFormatCodes.BOLD + MinecraftColors.RED + `Warn`)
        .body("§eSelect a user to warn.\n");

    const allPlayers = world.getAllPlayers();
    for (const player of allPlayers) {
        form.button(player.name);
    }

    // @ts-ignore
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === undefined) return;

        const targetPlayer = allPlayers[response.selection];
        adminActions[commandRan].run(player, targetPlayer);
    });
}