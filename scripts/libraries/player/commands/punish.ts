import { ChatSendBeforeEvent, EntityInventoryComponent, ItemLockMode, Player, system, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { getPlayerFromName, PlayerDataHandler } from "../../data/player/playerData";
import { chatError } from "../../chatFormat";

export default {
    name: "punish",
    title: "§ePunish",
    description: "§aPunishes a player by locking all their items",
    permissions: ["punish"],
    requiredArgs: ["player"],
    run: (event: ChatSendBeforeEvent, args: string[]) => {
        const player = event.sender;
        const targetPlayerName = args[0];
        if (!targetPlayerName) {
            return chatError(player, "You must provide the username who you want to grant permissions.");
        }

        const targetPlayer = getPlayerFromName(args);
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
}