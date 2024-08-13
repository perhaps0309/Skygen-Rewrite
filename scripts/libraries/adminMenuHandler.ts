import { ActionFormData } from "@minecraft/server-ui";
import { MinecraftColors, MinecraftFormatCodes } from "./chatFormat";
import { PlayerDataHandler } from "./playerData";
import { Player, world } from "@minecraft/server";
import { adminActions, openBaseMenu } from "../adminActions/moderationActions";

const playersWithMenuOpened: string[] = [];
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

        openBaseMenu(player, mappedActions[response.selection]);
    });
    playersWithMenuOpened.push(player.name);
}