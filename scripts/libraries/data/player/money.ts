import { Player, ScoreboardIdentity, world } from "@minecraft/server";

// Function to get the player's money from the scoreboard
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

export function abbreviateMoney(value: number): string {
    const suffixes = ["", "k", "M", "B", "T"]; // Add more suffixes if needed
    const suffixIndex = Math.floor(("" + value).length / 3);
    let shortValue: string;

    if (suffixIndex === 0) {
        shortValue = value.toString();
    } else {
        const abbreviatedValue = (value / Math.pow(1000, suffixIndex)).toFixed(1);
        shortValue = parseFloat(abbreviatedValue) + suffixes[suffixIndex];
    }

    return shortValue;
}