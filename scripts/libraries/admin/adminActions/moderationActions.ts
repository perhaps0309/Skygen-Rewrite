import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { MinecraftFormatCodes, MinecraftColors, chatSuccess } from "../../chatFormat";
import { PlayerDataHandler } from "../../data/player/playerData";
import { isAdmin } from "../../data/player/ranks";

// Holds all the functions that admins can perform from their admin stick.
export const adminActions: { [key: string]: any } = {
    "Warn": {
        run: warn,
        description: "§eSelect a user to warn."
    },
    "Kick": {
        run: kick,
        description: "§eSelect a user to kick."
    },
    "Ban": {
        run: ban,
        description: "§eSelect a user to ban."
    },
    "Unban": {
        run: unban,
        description: "§eSelect a user to unban.",
        dataFilter: {
            filter: { // PlayerDataHandler.get(key, player) === value, if value is a function, it will be run with the player as the argument.
                isBanned: true
            },
            playerSearch: "all", // all, online, offline, function, disabled
            rankFilter: {
                admin: false, // If true, only players with the rank of Admin or higher will be shown. Otherwise, admins will not be shown.
            }
        }
    },
    "Teleport to": {
        run: teleportTo,
        description: "§eSelect a user to teleport to."
    },
    "Teleport here": {
        run: teleportFrom,
        description: "§eSelect a user to teleport to you."
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
    let commandData = adminActions[commandRan];
    const form = new ModalFormData()
        .title(MinecraftFormatCodes.BOLD + MinecraftColors.RED + `${commandRan} - ${commandData.description || "No description available."}`)

    // dataFilter handling
    if (commandData.dataFilter) {
        let dataFilter = commandData.dataFilter.filter;
        let filter = dataFilter.filter;
        let playerSearch = dataFilter.playerSearch || "all";
        let rankFilter = dataFilter.rankFilter;

        let players: Player[] = [];
        if (playerSearch === "all") { // TODO: impliment offline player search
            players = world.getAllPlayers();
        } else if (playerSearch === "online") {
            players = world.getAllPlayers();
        } else if (playerSearch === "offline") {
            // players = world.getAllPlayers();
        } else if (playerSearch === "function") {
            // players = world.getAllPlayers();
        }
    }


    // @ts-ignore
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.formValues === undefined) return;


    });
}