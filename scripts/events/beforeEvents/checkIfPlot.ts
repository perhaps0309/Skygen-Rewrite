import { PlayerBreakBlockBeforeEvent, PlayerInteractWithBlockBeforeEvent, world } from "@minecraft/server";
import { getPlotFromPosition } from "../../commands";
import { WorldDataHandler } from "../../libraries/worldData";
import { PlotT } from "../../types";

export function checkIfPlot(event: PlayerBreakBlockBeforeEvent | PlayerInteractWithBlockBeforeEvent) {
    const player = event.player;
    const plots = WorldDataHandler.get("plots", world) as unknown as { [key: string]: PlotT };
    const plotPlayerName = getPlotFromPosition(event.block.location);
    if (!plotPlayerName || plotPlayerName == player.name) return false;

    const plot = plots[plotPlayerName];
    if (!plot.permissions) {
        plots[plotPlayerName].permissions = {};
        WorldDataHandler.set("plots", plots, world);
    }

    if (plot.permissions[player.name] < 1) {
        return true;
    }
}