X
main.js
import { world, system, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const warps = new Map();
const bannedPlayers = new Set();
const mutedPlayers = new Set();
const playerRanks = new Map();
const tpaRequests = new Map(); // Store TPA requests here
let infoText = "Welcome to our server! Enjoy your stay.";
let moneyObjective;

// Initialize Money objective
system.run(() => {
    try {
        moneyObjective = world.scoreboard.getObjective("Money");
        if (!moneyObjective) {
            moneyObjective = world.scoreboard.addObjective("Money", "dummy");
        }
        console.log("Money objective created or already exists");
    } catch (e) {
        console.error("Error creating Money objective:", e);
    }
});

function initializePlayerMoney(player) {
    if (!(player instanceof Player)) return;
    try {
        player.runCommandAsync(`scoreboard players add "${player.name}" Money 0`).catch(e => {
            console.error(`Failed to initialize money for ${player.name}:`, e);
        });
    } catch (e) {
        console.error(`Error during player money initialization for ${player.name}:`, e);
    }
}

// Player Menu
function showPlayerMenu(player) {
    const form = new ActionFormData()
        .title("Player Menu")
        .body("Select an option:")
        .button("Warps", "textures/ui/worldsIcon.png")
        .button("Money Transfer", "textures/items/emerald")
        .button("TPA", "textures/items/ender_pearl")
        .button("Info", "textures/items/book_writable")
        .button("Credit", "textures/items/diamond");

    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showWarpsMenu(player); break;
            case 1: showMoneyTransferMenu(player); break;
            case 2: showTPAMenu(player); break;
            case 3: showInfoMenu(player); break;
            case 4: showCreditMenu(player); break;
        }
    });
}

function showWarpsMenu(player) {
    const form = new ActionFormData()
        .title("Warps")
        .body("Select a warp point:");

    if (warps.size === 0) {
        form.button("No warps available", "textures/blocks/barrier.png");
    } else {
        for (const [name] of warps) {
            form.button(name, "textures/items/compass_item.png");
        }
    }

    form.show(player).then((response) => {
        if (response.canceled || warps.size === 0) return;
        const warpName = Array.from(warps.keys())[response.selection];
        const location = warps.get(warpName);
        if (location) {
            player.teleport(location);
            player.sendMessage(`Teleported to ${warpName}`);
        }
    });
}

function showMoneyTransferMenu(player) {
    const players = world.getAllPlayers();
    const playerNames = players.map(p => p.name);

    new ModalFormData()
        .title("Money Transfer")
        .dropdown('§o§5Choose Who To Send Money!', playerNames)
        .textField('§uEnter The Amount You\'re Sending!', '§oOnly Use Numbers')
        .show(player)
        .then(response => {
            if (response.canceled) return;
            const [dropdownIndex, textField] = response.formValues;
            const selectedPlayer = players[dropdownIndex];

            if (!selectedPlayer || !(selectedPlayer instanceof Player)) {
                player.sendMessage("§cSelected player not found or invalid");
                return;
            }

            if (selectedPlayer.name === player.name) {
                player.sendMessage("§cYou Can't Select Yourself");
                return;
            }

            const amount = parseInt(textField);
            if (isNaN(amount) || amount <= 0) {
                player.sendMessage("§cInvalid amount entered");
                return;
            }

            player.runCommandAsync(`scoreboard players remove "${player.name}" Money ${amount}`).then(() => {
                selectedPlayer.runCommandAsync(`scoreboard players add "${selectedPlayer.name}" Money ${amount}`).then(() => {
                    player.sendMessage(`§aSent §l${selectedPlayer.name} §r§2$${amount}`);
                    selectedPlayer.sendMessage(`§l${player.name} §r§aHas Given You §2$${amount}`);
                }).catch(e => {
                    player.sendMessage("§cAn error occurred during the transfer to the recipient");
                    console.error(`Error transferring money to ${selectedPlayer.name}:`, e);
                    // Refund the player if the transfer fails
                    player.runCommandAsync(`scoreboard players add "${player.name}" Money ${amount}`);
                });
            }).catch(e => {
                player.sendMessage("§cYou don't have enough money for this transfer");
                console.error(`Error deducting money from ${player.name}:`, e);
            });
        })
        .catch(error => {
            console.warn("Error in moneyTransfer:", error);
            player.sendMessage("§cAn error occurred during the transfer");
        });
}

function showTPAMenu(player) {
    const players = world.getAllPlayers().filter(p => p !== player);
    const playerNames = players.map(p => p.name);

    const form = new ActionFormData()
        .title("TPA")
        .body("Select a player to send a teleport request:")
        .button("View TPA Requests", "textures/ui/icon_bell.png") // Button to view TPA requests

    if (players.length > 0) {
        playerNames.forEach(name => form.button(name, "textures/items/ender_pearl.png"));
    } else {
        form.button("No players available", "textures/blocks/barrier.png");
    }

    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === 0) {
            showTPARequests(player); // Show requests if chosen
        } else {
            const targetPlayer = players[response.selection - 1];
            sendTPARequest(player, targetPlayer);
        }
    });
}

function sendTPARequest(sender, receiver) {
    if (!receiver || !(receiver instanceof Player)) {
        sender.sendMessage("§cPlayer not found or invalid.");
        return;
    }

    tpaRequests.set(receiver.name, sender.name); // Store the request
    receiver.sendMessage(`§a${sender.name} has sent you a TPA request. Use your compass to respond.`);
}

function showTPARequests(player) {
    const form = new ActionFormData()
        .title("Pending TPA Requests");

    if (!tpaRequests.has(player.name)) {
        form.body("§cYou have no pending TPA requests.");
        form.button("Close", "textures/blocks/barrier.png");
    } else {
        const senderName = tpaRequests.get(player.name);
        form.body(`${senderName} wants to teleport to you.`);
        form.button("Accept", "textures/items/green_dye");
        form.button("Decline", "textures/items/red_dye");
    }

    form.show(player).then((response) => {
        if (response.canceled) return;
        if (!tpaRequests.has(player.name)) return;

        const senderName = tpaRequests.get(player.name);
        const sender = world.getAllPlayers().find(p => p.name === senderName);

        if (!sender) {
            player.sendMessage("§cSender not found or no longer online.");
            tpaRequests.delete(player.name);
            return;
        }

        if (response.selection === 0) {
            sender.teleport(player.location);
            sender.sendMessage(`Teleported to ${player.name}`);
            player.sendMessage(`${sender.name} teleported to you`);
        } else if (response.selection === 1) {
            sender.sendMessage(`${player.name} declined your TPA request`);
        }
        tpaRequests.delete(player.name); // Remove the request after processing
    });
}

function showInfoMenu(player) {
    const form = new ActionFormData()
        .title("Server Info")
        .body(infoText)
        .button("OK", "textures/blocks/barrier.png");

    form.show(player);
}

function showCreditMenu(player) {
    const form = new ActionFormData()
        .title("Credits")
        .body("Made by Razberiwaffl\nFrom Beyond scripting\nDiscord: https://discord.gg/BUkbAvcum4")
        .button("OK", "textures/blocks/barrier.png");

    form.show(player);
}

// Admin Menu
function showAdminMenu(player) {
    if (!player.hasTag("Admin")) return;

    const form = new ActionFormData()
        .title("Admin Menu")
        .body("Select an option:")
        .button("Mute Player", "textures/items/book_writable")
        .button("Unmute Player", "textures/items/book_enchanted")
        .button("Ban Player", "textures/items/diamond_sword")
        .button("Chat Ranks", "textures/items/name_tag")
        .button("Set Warp Locations", "textures/items/map_empty")
        .button("Change Info Screen", "textures/items/book_portfolio");

    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showMutePlayerMenu(player); break;
            case 1: showUnmutePlayerMenu(player); break;
            case 2: showBanPlayerMenu(player); break;
            case 3: showChatRanksMenu(player); break;
            case 4: showSetWarpMenu(player); break;
            case 5: showChangeInfoMenu(player); break;
        }
    });
}

function showMutePlayerMenu(player) {
    const players = world.getAllPlayers();
    const playerNames = players.map(p => p.name);

    const form = new ActionFormData()
        .title("Mute Player")
        .body("Select a player to mute:");

    if (players.length === 0) {
        form.button("No players available", "textures/blocks/barrier.png");
    } else {
        players.forEach(p => form.button(p.name, "textures/items/book_writable"));
    }

    form.show(player).then((response) => {
        if (response.canceled || players.length === 0) return;
        const targetPlayer = players[response.selection];
        mutedPlayers.add(targetPlayer.name);
        player.sendMessage(`Muted ${targetPlayer.name}`);
    });
}

function showUnmutePlayerMenu(player) {
    const players = Array.from(mutedPlayers);
    const playerNames = players.length ? players : ["No muted players available"];

    const form = new ActionFormData()
        .title("Unmute Player")
        .body("Select a player to unmute:");

    if (players.length > 0) {
        players.forEach(name => form.button(name, "textures/items/encahnted_book"));
    } else {
        form.button("No muted players available", "textures/blocks/barrier.png");
    }

    form.show(player).then((response) => {
        if (response.canceled || players.length === 0) return;
        const playerName = players[response.selection];
        mutedPlayers.delete(playerName);
        player.sendMessage(`Unmuted ${playerName}`);
    });
}

function showBanPlayerMenu(player) {
    const players = world.getAllPlayers();
    const playerNames = players.map(p => p.name);

    const form = new ActionFormData()
        .title("Ban Player")
        .body("Select a player to ban:");

    if (players.length === 0) {
        form.button("No players available", "textures/blocks/barrier.png");
    } else {
        players.forEach(p => form.button(p.name, "textures/items/diamond_sword"));
    }

    form.show(player).then((response) => {
        if (response.canceled || players.length === 0) return;
        const targetPlayer = players[response.selection];
        bannedPlayers.add(targetPlayer.name);
        targetPlayer.addTag("banned");
        player.sendMessage(`Banned ${targetPlayer.name}`);
    });
}

function showChatRanksMenu(player) {
    const players = world.getAllPlayers();
    const playerNames = players.map(p => p.name);

    const form = new ModalFormData()
        .title("Chat Ranks")
        .dropdown("Select player", playerNames.length ? playerNames : ["No players available"])
        .textField("Rank", "Enter rank (leave empty to remove)");

    form.show(player).then((response) => {
        if (response.canceled || players.length === 0) return;
        const targetPlayer = players[response.formValues[0]];
        const rank = response.formValues[1];
        if (rank) {
            playerRanks.set(targetPlayer.name, rank);
            targetPlayer.addTag(`rank:${rank}`);
            player.sendMessage(`Set ${targetPlayer.name}'s rank to ${rank}`);
        } else {
            playerRanks.delete(targetPlayer.name);
            for (const tag of targetPlayer.getTags()) {
                if (tag.startsWith("rank:")) {
                    targetPlayer.removeTag(tag);
                }
            }
            player.sendMessage(`Removed ${targetPlayer.name}'s rank`);
        }
    });
}

function showSetWarpMenu(player) {
    const form = new ModalFormData()
        .title("Set Warp Location")
        .textField("Warp Name", "Enter warp name");

    form.show(player).then((response) => {
        if (response.canceled) return;
        const warpName = response.formValues[0];
        const location = player.location;
        const dimension = player.dimension;
        warps.set(warpName, { x: location.x, y: location.y, z: location.z, dimension });
        player.sendMessage(`Set warp ${warpName} at your current location`);
    });
}

function showChangeInfoMenu(player) {
    const form = new ModalFormData()
        .title("Change Info Screen")
        .textField("Info Text", "Enter new info text (use \\n for new lines)");

    form.show(player).then((response) => {
        if (response.canceled) return;
        infoText = response.formValues[0].replace(/\\n/g, "\n");
        player.sendMessage("Updated info screen text");
    });
}

// Event listeners
world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    if (event.itemStack.typeId === "minecraft:compass") {
        showPlayerMenu(player);
    } else if (event.itemStack.typeId === "minecraft:nether_star" && player.hasTag("Admin")) {
        showAdminMenu(player);
    }
});

world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    if (mutedPlayers.has(player.name)) {
        event.cancel = true;
        player.sendMessage("You are muted and cannot send messages.");
        return;
    }
    const rank = playerRanks.get(player.name) || "Member";
    const message = event.message;
    event.cancel = true;
    world.sendMessage(`§f[${rank}§f]§r | ${player.name}: ${message}`);
});

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (player instanceof Player) {
        initializePlayerMoney(player);
    }
});

world.afterEvents.playerJoin.subscribe((event) => {
    const player = event.player;
    if (player instanceof Player) {
        player.sendMessage("Welcome to the server! Use a compass to open the menu.");
        initializePlayerMoney(player);
    } else {
        console.warn(`Invalid player object in playerJoin event for ${event.playerName}`);
    }
});

world.afterEvents.playerLeave.subscribe((event) => {
    const playerName = event.playerName;
    console.log(`${playerName} has left the server.`);
    // You can add any cleanup code here if needed
});

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (player instanceof Player && (bannedPlayers.has(player.name) || player.hasTag("banned"))) {
            player.runCommandAsync("kick " + player.name + " You are banned from this server.").catch(e => {
                console.warn(`Failed to kick banned player ${player.name}:`, e);
            });
        }
    }
}, 20 * 60); // Run every minute (20 ticks * 60 seconds)

// Error handling for unhandled promises
system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === "minecraft:script_logger_config") {
        const data = JSON.parse(event.message);
        if (data.log_errors) {
            console.error("Unhandled promise rejection:", data.error);
        }
    }
});

console.log("Server GUI script loaded successfully!");
