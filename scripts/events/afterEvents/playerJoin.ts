import { world, PlayerJoinAfterEvent, Player, PlayerSpawnAfterEvent } from "@minecraft/server";
import { PlayerDataHandler } from "../../libraries/playerData";
import { MinecraftColors, MinecraftFormatCodes } from "../../libraries/chatFormat";

// Register default player data
const defaultData = {
    dropMultiplier: 1,
    xpMultiplier: 1,
    effects: {}, // haste = {effect: string, duration: number, strength: number, title: string, startTime: number}
    hasJoinedBefore: false
};

export function handlePlayerJoin(event: PlayerSpawnAfterEvent) {
    const player = event.player;
    const playerName = player.name;

    if (!PlayerDataHandler.get("hasJoinedBefore", player)) {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BouncySkygen ► " + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server for the first time!\n");
        PlayerDataHandler.set("hasJoinedBefore", true, player);
    } else {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BouncySkygen ► " + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server again!\n");
    }
}