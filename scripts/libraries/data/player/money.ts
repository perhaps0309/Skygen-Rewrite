import { Player, ScoreboardIdentity, world } from "@minecraft/server";

// Function to get the player's money from the scoreboard
/**
 * Gets the money for a player
 * @param player Player to get the money for
 * @returns player money amount or 0
 */
export function getPlayerMoney(player: Player): number {
    try {
        const moneyObjective = world.scoreboard.getObjective("money");
        const score = moneyObjective?.getScore(player.scoreboardIdentity as ScoreboardIdentity) || 0;
        return score;
    } catch (error) {
        return 0;
    }
}

// Function to set the player's money on the scoreboard
/**
 * Sets the money for a player
 * @param player Player to set the money for
 * @param amount Amount of money to set
 */
export function setPlayerMoney(player: Player, amount: number): void {
    let moneyObjective = world.scoreboard.getObjective("money");
    if (!moneyObjective) {
        world.scoreboard.addObjective("money", "Money");
        moneyObjective = world.scoreboard.getObjective("money");
    }

    if (moneyObjective) {
        moneyObjective.setScore(player.scoreboardIdentity as ScoreboardIdentity, amount);
    }
}

/**
 * Abbreviates the money to a more readable format
 * @param value Value to abbreviate
 * @param num Amount of decimal places to show
 * @returns string
 * @example
 * abbreviateMoney(1000) // 1k
 * abbreviateMoney(1000000) // 1M
 * abbreviateMoney(1000000000) // 1B
 */
export function abbreviateMoney(value: number, num: number = 1): string {
    if (value < 1000) {
        return value.toString();
    }

    const units = ["", "k", "M", "B", "T"];
    let unitIndex = 0;

    while (value >= 1000 && unitIndex < units.length - 1) {
        value /= 1000;
        unitIndex++;
    }

    return value.toFixed(num) + units[unitIndex];
}

/**
 * Abbreviates the level to a more precise readable format, using commas
 * @param value Value to abbreviate
 * @returns string
 * @example
 * abbreviateLevel(1000) // 1,000
 * abbreviateLevel(1000000) // 1,000,000
 */
export function abbreviateLevel(value: number): string {  // display like 1,295 instead of 1.3k
    let newLevel = value.toString();
    if (newLevel.length > 3) {
        newLevel = newLevel.slice(0, -3) + "," + newLevel.slice(-3);
    }

    return newLevel;
}