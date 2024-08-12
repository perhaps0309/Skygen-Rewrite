import { world, PlayerJoinAfterEvent, Player, PlayerSpawnAfterEvent, ItemStack, EntityItemComponent, EntityInventoryComponent, ItemLockMode } from "@minecraft/server";
import { PlayerDataHandler } from "../../libraries/playerData";
import { MinecraftColors, MinecraftFormatCodes } from "../../libraries/chatFormat";
import { getHighestRank } from "../../libraries/ranks";

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
    const { highestPriority } = getHighestRank(player);

    if (!PlayerDataHandler.get("hasJoinedBefore", player)) {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BouncySkygen ► " + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server for the first time!\n");
        PlayerDataHandler.set("hasJoinedBefore", true, player);
    } else {
        world.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "BouncySkygen ► " + MinecraftFormatCodes.RESET + MinecraftColors.AQUA + playerName + MinecraftColors.WHITE + " has joined the server again!\n");
    }

    if (highestPriority > 0) {
        const playerInventory = player.getComponent("minecraft:inventory") as EntityInventoryComponent;
        const inventoryContainer = playerInventory.container;
        if (!inventoryContainer) return;

        const stick = new ItemStack("minecraft:stick", 1);
        stick.nameTag = MinecraftFormatCodes.BOLD + MinecraftColors.RED + "Admin Stick";
        stick.lockMode = ItemLockMode.slot;
        inventoryContainer.setItem(7, stick);
    }
}