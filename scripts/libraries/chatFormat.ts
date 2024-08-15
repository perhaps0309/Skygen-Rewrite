import { Player } from "@minecraft/server";

export enum MinecraftColors {
    BLACK = "§0",
    DARK_BLUE = "§1",
    DARK_GREEN = "§2",
    DARK_AQUA = "§3",
    DARK_RED = "§4",
    DARK_PURPLE = "§5",
    GOLD = "§6",
    GRAY = "§7",
    DARK_GRAY = "§8",
    BLUE = "§9",
    GREEN = "§a",
    AQUA = "§b",
    RED = "§c",
    LIGHT_PURPLE = "§d",
    YELLOW = "§e",
    WHITE = "§f"
}

export enum MinecraftFormatCodes {
    OBFUSCATED = "§k",
    BOLD = "§l",
    STRIKETHROUGH = "§m",
    UNDERLINE = "§n",
    ITALIC = "§o",
    RESET = "§r"
}

export function removeFormat(str: string): string {
    let newStr = str;

    // Remove all color codes
    for (const color of Object.values(MinecraftColors)) {
        newStr = newStr.replaceAll(color, "");
    }

    // Remove all format codes
    for (const format of Object.values(MinecraftFormatCodes)) {
        newStr = newStr.replaceAll(format, "");
    }

    return newStr;
}

export function chatSuccess(player: Player, message: string) {
    player.sendMessage(MinecraftColors.GREEN + MinecraftFormatCodes.BOLD + "SUCCESS << " + MinecraftFormatCodes.RESET + message);
}

export function chatWarn(player: Player, message: string) {
    player.sendMessage(MinecraftColors.YELLOW + MinecraftFormatCodes.BOLD + "WARNING << " + MinecraftFormatCodes.BOLD + message);
}

export function chatError(player: Player, message: string) {
    player.sendMessage(MinecraftColors.RED + MinecraftFormatCodes.BOLD + "ERROR << " + MinecraftFormatCodes.RESET + message);
}

export function chatServer(player: Player, message: string) {
    player.sendMessage(MinecraftFormatCodes.BOLD + MinecraftColors.GREEN + "Bouncy" + MinecraftColors.AQUA + "MC << " + MinecraftFormatCodes.RESET + message);
}