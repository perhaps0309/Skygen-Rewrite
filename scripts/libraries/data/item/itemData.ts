import { EntityComponentTypes, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { EffectDataT, EnchantmentDataT, ItemEffectDataT } from "../../../types";
import { MinecraftFormatCodes, removeFormat } from "../../chatFormat";
import { enchantmentTitles } from "../../enchantments/enchantmentHandler";
import { safeJsonParser, safeJsonStringify } from "../player/playerData";
import { ItemEffects } from "./effects";

function debugWarn(functionName: string, message: string) {
    console.warn(`[ItemData.${functionName}] ${message}`);
}

export class ItemData {
    public item: ItemStack;
    public slot: EquipmentSlot | number | undefined;
    private player: Player;

    constructor(item: ItemStack, player: Player, slot?: EquipmentSlot | number) {
        this.item = item;
        this.player = player;
        this.slot = slot; // You need to set the slot for anything besides lore adjustments.
    }

    public getDynamicProperty(key: string): any {
        let value = this.item.getDynamicProperty(key);
        return safeJsonParser(value);
    }

    public setDynamicProperty(key: string, value: any): void {
        if (value === undefined) throw Error("Invalid value.");
        if (typeof value === "object") value = safeJsonStringify(value);

        this.item.setDynamicProperty(key, value);
        this.updateItem();
    }

    // Lore functions
    public getLore(): string[] {
        return this.item.getLore();
    }

    public setLore(lore: string[]): void {
        this.item.setLore(lore);
        this.updateItem();
    }

    public addLore(lore: string): void {
        const currentLore = this.getLore();
        currentLore.push(lore);
        this.setLore(currentLore);
    }

    public removeLore(lore: string | number): void {
        const currentLore = this.getLore();
        if (typeof lore === "number") {
            currentLore.splice(lore, 1);
        } else {
            const index = currentLore.indexOf(lore);
            if (index !== -1) {
                currentLore.splice(index, 1);
            }
        }

        this.setLore(currentLore);
    }

    public addCustomLore(lore: string | string[], category?: string): void {
        let customLore = this.getDynamicProperty("lore") || {};
        const index = typeof lore === "string" ? lore : lore[0];
        customLore[category || index] = lore;
        this.setDynamicProperty("lore", customLore);
    }

    public removeCustomLore(lore: string | string[], category?: string): void {
        let customLore = this.getDynamicProperty("lore") || {};
        const index = typeof lore === "string" ? lore : lore[0];
        delete customLore[category || index];
        this.setDynamicProperty("lore", customLore);
    }

    // Enchantment functions
    public getEnchantments(): { [key: string]: EnchantmentDataT } {
        return this.getDynamicProperty("enchantments") || {};
    }

    public setEnchantments(enchantments: { [key: string]: EnchantmentDataT }): void {
        this.setDynamicProperty("enchantments", enchantments);
        this.updateLore();
    }

    public addEnchantment(enchantment: EnchantmentDataT): void {
        const enchantments = this.getEnchantments();
        enchantments[enchantment.name] = enchantment;

        this.setEnchantments(enchantments);
    }

    public removeEnchantment(enchantment: string): void {
        const enchantments = this.getEnchantments();
        delete enchantments[enchantment];

        this.setEnchantments(enchantments);
    }

    // Effect functions 
    public getEffects(): { [key: string]: any } {
        return this.getDynamicProperty("effects") || {};
    }

    public setEffects(effects: { [key: string]: any }): void {
        this.setDynamicProperty("effects", effects);
    }

    public addEffect(effect: ItemEffectDataT): void {
        const effects = this.getEffects();
        effects[effect.effect] = effect;

        this.setEffects(effects);
    }

    public removeEffect(effect: string): void {
        const effects = this.getEffects();
        delete effects[effect];

        this.setEffects(effects);
    }

    // Dynamic property functions
    public updateItem(): void {
        if (this.slot === undefined) return;
        if (typeof this.slot === "number") {
            const inventory = this.player.getComponent("minecraft:inventory") as EntityInventoryComponent;
            const container = inventory.container;

            // Check if the player has an inventory
            if (!container) return;

            // Update the item in the player's inventory
            container.setItem(this.slot, this.item);
        } else {
            const playerEquipment = this.player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent
            playerEquipment.setEquipment(this.slot, this.item);
        }
    }

    public updateLore(): void {
        const longestText = "Has Custom Properties";
        let enchantments = this.getEnchantments();

        // Remove the old lore
        this.setLore([]);

        // Get custom item lore data with spaces saved for centering
        let customLore = this.getDynamicProperty("lore") || {}; // either category with an array of strings or a string
        for (const key in customLore) {
            let currentLore = customLore[key];
            if (typeof currentLore === "string") {
                const displayLength = removeFormat(currentLore).length;
                const displaySpaces = longestText.length - displayLength;
                const newTitle = " ".repeat(Math.floor(displaySpaces / 2 + 0.5) + 3) + currentLore;
                this.addLore(newTitle);
            } else {
                this.addLore(" ".repeat(Math.floor(longestText.length / 2 + 0.5) + 3) + MinecraftFormatCodes.BOLD + key + MinecraftFormatCodes.RESET)
                currentLore.forEach((line: string) => {
                    const displayLength = removeFormat(line).length;
                    const displaySpaces = longestText.length - displayLength;
                    const newTitle = " ".repeat(Math.floor(displaySpaces / 2 + 0.5) + 3) + line;
                    this.addLore(newTitle);
                });
            }
        }

        let enchantmentSpacing = longestText.length - ("Enchantments".length);
        this.addLore(" ".repeat(Math.floor(enchantmentSpacing / 2) + 1) + MinecraftFormatCodes.BOLD + "Enchantments" + MinecraftFormatCodes.RESET)
        for (const enchantment in enchantments) {
            const enchantmentData = enchantments[enchantment];
            const enchantmentTitle = enchantmentTitles[enchantmentData.name] || enchantmentData.name + "-failed"

            const displayLength = removeFormat(enchantmentTitle + " " + enchantmentData.level).length;
            const displaySpaces = longestText.length - displayLength;
            const newTitle = " ".repeat(Math.floor(displaySpaces / 2 + 0.5) + 3) + enchantmentTitle + " " + enchantmentData.level;
            this.addLore(newTitle);
        }

        // Item Effects
        const effects = this.getEffects(); // return if no effects
        if (Object.keys(effects).length === 0) return;

        let effectSpacing = longestText.length - ("Effects".length);
        this.addLore(" ".repeat(Math.floor(effectSpacing / 2) + 1) + MinecraftFormatCodes.BOLD + "Effects" + MinecraftFormatCodes.RESET);

        for (const effect in effects) {
            const effectData = effects[effect] as ItemEffectDataT;

            let effectTitle = ItemEffects[effectData.name] || effectData.name + "-failed";
            const displayLength = removeFormat(effectTitle).length;
            const displaySpaces = longestText.length - displayLength;
            const newTitle = " ".repeat(Math.floor(displaySpaces / 2 + 0.5) + 3) + effectTitle;
            this.addLore(newTitle);
        }

        this.updateItem();
    }
}