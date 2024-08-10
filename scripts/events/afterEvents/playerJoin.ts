import { world, PlayerJoinAfterEvent, Player } from "@minecraft/server";
import { PlayerDataHandler } from "../../libraries/playerData";
import { MinecraftColors, MinecraftFormatCodes } from "../../libraries/chatFormat";

// Register default player data
const defaultData = {
    dropMultiplier: 1,
    xpMultiplier: 1,
    effects: {}, // haste = {effect: string, duration: number, strength: number, title: string, startTime: number}
    hasJoinedBefore: false
};

export function handlePlayerJoin(event: PlayerJoinAfterEvent) {
    const playerName = event.playerName;
    const allPlayers = world.getAllPlayers();

    let playerObject = null;
    for (const currentPlayer of allPlayers) {
        if (currentPlayer.name === playerName && PlayerDataHandler.has("dropMultiplier", currentPlayer) === false) {
            PlayerDataHandler.set(playerName, defaultData, currentPlayer);
            playerObject = currentPlayer;
            break;
        } else if (currentPlayer.name === playerName) {
            playerObject = currentPlayer;
        }
    }

    if (playerObject === null) return;

    if (!PlayerDataHandler.get("hasJoinedBefore", playerObject)) {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BeyondSkygen ►" + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server for the first time!");
        PlayerDataHandler.set("hasJoinedBefore", true, playerObject);
    } else {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BeyondSkygen ►" + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server again!");
    }
}