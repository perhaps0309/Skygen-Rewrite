import { ChatSendBeforeEvent } from "@minecraft/server";

export default {
    name: "punishment",
    callback: (event: ChatSendBeforeEvent) => {
        const player = event.sender;
        const message = event.message;


    }
}