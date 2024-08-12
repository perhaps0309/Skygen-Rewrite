import { ActionFormData } from "@minecraft/server-ui";
import { MinecraftColors, MinecraftFormatCodes } from "./chatFormat";
import { PlayerDataHandler } from "./playerData";
import { Player, world } from "@minecraft/server";

const playersWithMenuOpened: string[] = [];

// @TODO: Clean this up later (seperate files)
const adminActions: { [key: string]: any } = {
    "Warn": {
        run: (player: Player, secondStage: boolean, targetPlayer?: Player | null) => {
            console.warn("cant be doing this bro");
            if (!secondStage) {
                const form = new ActionFormData()
                    .title(MinecraftFormatCodes.BOLD + MinecraftColors.RED + `Warn`)
                    .body("§eSelect a user to warn.\n");

                for (const playerName in world.getAllPlayers()) {
                    form.button(playerName);
                }

                // @ts-ignore
                form.show(player).then((response) => {
                    if (response.canceled) return;
                    if (!response.selection) return;
                });
                console.warn("boom")
            } else {
                if (!targetPlayer) return;
            }
        },
    },
    "Kick": {
        run: (player: Player, secondStage: boolean) => { },
    },
    "Ban": {
        run: (player: Player, secondStage: boolean) => { },
    },
    "Teleport to": {
        run: (player: Player, secondStage: boolean) => { },
    },
    "Teleport here": {
        run: (player: Player, secondStage: boolean) => { },
    },
    "Spectate": {
        run: (player: Player, secondStage: boolean) => { },
    },
    "Invsee": {
        run: (player: Player, secondStage: boolean) => { },
    }
}

export function handleAdminMenu(player: Player) {
    if (playersWithMenuOpened.includes(player.name)) return;

    let playerRanks = PlayerDataHandler.get("ranks", player) as unknown as { [key: string]: number };
    if (!playerRanks) {
        playerRanks = { "Member": 0 }
        return PlayerDataHandler.set("ranks", playerRanks, player);
    }

    const form = new ActionFormData()
        .title(MinecraftFormatCodes.BOLD + MinecraftColors.RED + `Admin Menu`)
        .body("§eSelect an action to take.\n");

    const mappedActions: string[] = []
    for (const actionName in adminActions) {
        mappedActions.push(actionName);
        form.button(actionName);
    }

    // @ts-ignore
    form.show(player).then((response) => {
        playersWithMenuOpened.splice(playersWithMenuOpened.indexOf(player.name), 1);
        if (response.canceled) return;
        if (response.selection === undefined) return;

        console.warn(mappedActions[response.selection]);
        const runFunction = adminActions[mappedActions[response.selection]];
        runFunction(player, false);
    });
    playersWithMenuOpened.push(player.name);
}