import { ChatSendBeforeEvent } from "@minecraft/server";

export default {
    name: "punishment",
    requiredRank: 1,
    callback: (event: ChatSendBeforeEvent) => {
        const player = event.sender;
        const message = event.message;
        const args = message.split(" ").shift();
    }
}