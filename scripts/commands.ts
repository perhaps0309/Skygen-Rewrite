import { ChatSendAfterEvent, ChatSendBeforeEvent, world } from "@minecraft/server";
import { Vector3Builder } from '@minecraft/math';
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";

// !punish
export function punish(event: ChatSendAfterEvent, args: string[]) {
    const player = event.sender;
    const targetPlayer = args[0];
}

// !unpunish
export function unpunish(event: ChatSendAfterEvent, args: string[]) {
    const player = event.sender;
    const targetPlayer = args[0];
}

// !setplotarea
export function setPlotArea(event: ChatSendAfterEvent, args: string[]) {
    const player = event.sender;
    const playerPosition = player.location;
    const size = { x: 50, z: 50 }
    const cornerPiece = new Vector3Builder(playerPosition.x - 50, playerPosition.y, playerPosition.z - 50);
    for (let i = cornerPiece.x; i < size.x; i++) {
        console.warn("boom");
        world.getDimension("overworld").setBlockType(new Vector3Builder(i, cornerPiece.y, cornerPiece.z), MinecraftBlockTypes.GrassBlock);
        for (let i = cornerPiece.z; i < size.z; i++) {
            world.getDimension("overworld").setBlockType(new Vector3Builder(cornerPiece.x, cornerPiece.y, i), MinecraftBlockTypes.GrassBlock);
        }
    }
}