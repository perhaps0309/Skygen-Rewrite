import { Player } from "@minecraft/server";
import { PlayerDataHandler } from "./playerData";

export function getHighestRank(player: Player) {
    let playerRanks = PlayerDataHandler.get("ranks", player) as unknown as { [key: string]: number };
    if (!playerRanks) {
        playerRanks = { "Member": 0 }
        PlayerDataHandler.set("ranks", playerRanks, player);
    }

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