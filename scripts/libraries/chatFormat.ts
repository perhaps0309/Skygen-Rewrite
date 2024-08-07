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

export function removeFormat(str: string) {
    let newStr = "";
    for (const color in Object.values(MinecraftColors)) {
        newStr = str.replaceAll(color, "");
    }

    for (const format in Object.values(MinecraftFormatCodes)) {
        newStr = str.replaceAll(format, "");
    }

    return newStr;
}