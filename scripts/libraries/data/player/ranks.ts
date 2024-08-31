import { Player } from "@minecraft/server";
import { MinecraftColors } from "../../chatFormat";
import { getPlayerData } from "./playerData";

export const rankPriority: { [key: string]: number } = {
    "none": 0, // Default rank for all players
    "member": 1, // Assigned after player spawn
    "admin": 89,
    "developer": 99,
    "owner": 999
}

export const rankColors: { [key: string]: string } = {
    "member": MinecraftColors.AQUA,
    "admin": MinecraftColors.RED,
    "owner": MinecraftColors.DARK_PURPLE
}

export function getHighestRank(player: Player) {
    let playerRanks = getPlayerData(player.name).getRanks();
    let playerRank = "";
    let highestPriority = 0;
    for (const rank in playerRanks) {
        const rankPriority = playerRanks[rank];
        if (rankPriority > highestPriority) {
            highestPriority = rankPriority;
            playerRank = rank;
        }
    }

    return {
        playerRank,
        highestPriority
    }
}

export function isAdmin(player: Player) {
    let rankData = getHighestRank(player);

    let highestPriority = rankData.highestPriority;
    let playerRank = rankData.playerRank;

    let playerAdmin = playerRank === "Admin" || highestPriority >= 89;
    let playerDeveloper = playerRank === "Developer" || highestPriority >= 99;
    let playerOwner = playerRank === "Owner" || highestPriority >= 999;
    return {
        admin: playerAdmin,
        owner: playerOwner,
        developer: playerDeveloper,
        playerRank: rankData.playerRank,
        highestPriority: rankData.highestPriority
    }
}