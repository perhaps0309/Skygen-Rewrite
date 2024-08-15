import { Vector3Builder } from '@minecraft/math';
import { world, Vector3, ChatSendBeforeEvent, system, Player, EntityInventoryComponent, ItemLockMode, Dimension } from '@minecraft/server';

const plotSize = 10;
const plotBorder = "minecraft:stonebrick";
const plotFloor = "minecraft:dirt";

const plotColumns = 5;
const plotRows = 1;

const plotSpacing = 3;
const spacingBlock = "minecraft:oak_planks";

export function createPlot(center: Vector3, dimension: Dimension) {
    // Create the plot border
    dimension.runCommand(`/fill ${center.x + plotSize + 1} ${center.y} ${center.z + plotSize + 1} ${center.x - plotSize - 1} ${center.y} ${center.z - plotSize - 1} ${plotBorder}`);

    // Create the plot floor
    dimension.runCommand(`/fill ${center.x + plotSize} ${center.y} ${center.z + plotSize} ${center.x - plotSize} ${center.y} ${center.z - plotSize} ${plotFloor}`);
    console.warn(`/fill ${center.x + plotSize + 1} ${center.y} ${center.z + plotSize + 1} ${center.x - plotSize - 1} ${center.y} ${center.z - plotSize - 1} ${plotBorder}`)
    console.warn(`/fill ${center.x + plotSize} ${center.y} ${center.z + plotSize} ${center.x - plotSize} ${center.y} ${center.z - plotSize} ${plotFloor}`)
}

export function createPlots(firstPlotCenter: Vector3, dimension: Dimension) { // Create a 4x10 grid of plots
    for (let row = 1; row <= plotRows; row++) {
        for (let column = 1; column < plotColumns; column++) {
            const x = (firstPlotCenter.x + (plotSize + 1) * column) + (plotSpacing * column);
            const z = (firstPlotCenter.z + (plotSize + 1) * row) + (plotSpacing * row);

            createPlot(new Vector3Builder(x, firstPlotCenter.y, z), dimension);
            console.warn(`Created plot(Row ${row} Column ${column}) at ${x}, ${firstPlotCenter.y}, ${z}`);
        }
    }
}

export function destroyPlot(center: Vector3, dimension: Dimension) {
    // Destroy the plot border
    dimension.runCommand(`/fill ${center.x + plotSize + 1} ${center.y} ${center.z + plotSize + 1} ${center.x - plotSize - 1} ${center.y} ${center.z - plotSize - 1} air`);

    // Destroy the plot floor
    dimension.runCommand(`/fill ${center.x + plotSize} ${center.y} ${center.z + plotSize} ${center.x - plotSize} ${center.y} ${center.z - plotSize} air`);
}

export function destroyPlots(firstPlotCenter: Vector3, dimension: Dimension) {
    for (let row = 1; row <= plotRows; row++) {
        for (let column = 1; column <= plotColumns; column++) {
            const x = (firstPlotCenter.x + (plotSize + 1) * column) + (plotSpacing * column);
            const z = (firstPlotCenter.z + (plotSize + 1) * row) + (plotSpacing * row);

            destroyPlot(new Vector3Builder(x, firstPlotCenter.y, z), dimension);
        }
    }
}