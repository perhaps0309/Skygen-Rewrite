import { ChatSendBeforeEvent, Player, system, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { PlayerDataHandler } from "../../data/player/playerData";
import { chatError } from "../../chatFormat";

const reportCategories = {
    Inappropriate: [ // Subcategories
        "§6Inappropriate Behavior",
        "§cInappropriate Language",
        "§4Inappropriate Skin",
        "§eInappropriate Username",
        "§aInappropriate Builds",
    ],
    Cheating: [
        "§0Nuker",
        "§4Kill Aura",
        "§gFly",
        "§bSpeed",
    ],
    Gameplay: [
        "§4Scamming",
        "§6Trolling",
        "§eGriefing",
    ]
}

const reportCommand = {
    name: "report",
    title: "§eReport",
    description: "§aOpens the report menu.",
    permissions: ["report"],
    requiredArgs: [], // player, number, boolean, string
    run: (event: ChatSendBeforeEvent, args: string[]) => {
        const player = event.sender;
        let form = new ActionFormData();
        form.title("§eReport Menu");
        form.body("§7Please select a player to report, troll reports will result in a ban.\n");

        const players = world.getAllPlayers();
        for (const player of players) {
            let playerColor = PlayerDataHandler.get("rankColor", player);
            if (!playerColor) playerColor = "§a";

            form.button(playerColor + player.name);
        }

        // @ts-ignore
        form.show(player).then((data) => {
            if (!data.selection || data.canceled) return;
            const reportedPlayer = players[data.selection];

            if (!reportedPlayer) {
                chatError(player, "Player not found.");
                return;
            }

            const allCategories = [];
            for (const category in reportCategories) {
                for (const subcategory of category) {
                    allCategories.push(subcategory);
                }
            }

            let reportForm = new ModalFormData();
            reportForm.title("§eReport Menu - §c" + reportedPlayer.name);
            reportForm.dropdown("§7Please select a reason.", allCategories, 0);
            reportForm.textField("§7Please provide any additional information.", "§7Optional");

            reportForm.submitButton("§aSubmit Report");
            reportForm.submitButton("§cCancel");

            // @ts-ignore
            reportForm.show(player).then((data) => {
                if (!data.formValues || data.canceled) return;

                const category = data.formValues[0];
                const additionalInfo = data.formValues[1];

                const reportData = {
                    reporter: player,
                    reported: reportedPlayer,
                    category: category,
                    additionalInfo: additionalInfo,
                }

                console.warn("reported " + reportedPlayer.name + " for " + category + " with additional info: " + additionalInfo);
            });
        });
    }
}

export default reportCommand;