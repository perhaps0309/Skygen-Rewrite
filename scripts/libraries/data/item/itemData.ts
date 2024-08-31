import { EntityComponentTypes, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { EffectDataT, EnchantmentDataT, ItemEffectDataT } from "../../../types";
import { MinecraftFormatCodes, removeFormat } from "../../chatFormat";
import { enchantmentTitles } from "../../enchantments/enchantmentHandler";
import { ItemEffects } from "./effects";
import { safeJsonParser, safeJsonStringify } from "../../../util/scripts/functions/json";

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

    /**
     * Get a dynamic property from a non-stackable ItemStack
     * @param {string} key - The key of the dynamic property
     * @example
     * const playerStats = itemData.getDynamicProperty("playerStats");
     * if (playerStats) {
     *   console.log(playerStats.health);
     *   console.log(playerStats.attack);
     * }
     * @returns {any}
     */
    public getDynamicProperty(key: string): any {
        let value = this.item.getDynamicProperty(key);
        return safeJsonParser(value);
    }

    /**
     * Set a dynamic property on a non-stackable ItemStack
     * @param {string} key - The key of the dynamic property
     * @param {any} value - The value of the dynamic property
     * @example
     * itemData.setDynamicProperty("playerStats", {health: 20, attack: 10});
     * @returns {void}
     */
    public setDynamicProperty(key: string, value: any): void {
        if (value === undefined) throw Error("Invalid value.");
        if (typeof value === "object") value = safeJsonStringify(value);

        this.item.setDynamicProperty(key, value);
        this.updateItem();
    }

    // Lore functions
    /**
     * Get the lore of the item, returns an array of strings
     * @example
     * const lore = itemData.getLore();
     * console.log(lore);
     * // ["This is a line of lore", "This is another line of lore"]
     * @returns {string[]}
     */
    public getLore(): string[] {
        return this.item.getLore();
    }

    /**
     * Set the lore of the item
     * @param {string[]} lore - The lore to set
     * @example
     * itemData.setLore(["This is a line of lore", "This is another line of lore"]);
     */
    public setLore(lore: string[]): void {
        this.item.setLore(lore);
        this.updateItem();
    }

    /**
     * Add a line of lore to the item
     * @param {string} lore - The lore to add
     * @example 
     * itemData.addLore("This is a line of lore");
     */
    public addLore(lore: string): void {
        const currentLore = this.getLore();
        currentLore.push(lore);
        this.setLore(currentLore);
    }

    /**
     * Remove a line of lore from the item
     * @param {string | number} lore - The lore to remove
     * @example 
     * // Remove the first line of lore
     * itemData.removeLore(0);
     * 
     * // Remove a specific line of lore
     * itemData.removeLore("This is a line of lore");
     * @returns {void}
     */
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

    // Custom Lore functions

    /**
     * Get the custom lore of the item, returns an object with string or string[] values
     * @example
     * const customLore = itemData.getCustomLore();
     * console.log(customLore);
     * // { "Category": ["This is a line of lore", "This is another line of lore"] }
     * @returns {{ [key: string]: string | string[] }}
     */
    public getCustomLore(): { [key: string]: string | string[] } {
        return this.getDynamicProperty("lore") || {};
    }

    /**
     * Adds custom lore to the item, centered in the middle of the lore with category titles
     * @param {{ [key: string]: string | string[] }} customLore - The custom lore to set
     * @param {string} category - The category of the custom lore
     * @example
     * itemData.addCustomLore("This is a line of custom lore", "LoreCategory");
     * itemData.addCustomLore(["This is a line of custom lore", "This is another line of custom lore"], "LoreCategory");
     * itemData.addCustomLore("This is a line of custom lore"); // Doesn't require categories
     * 
     * // Update the lore
     * itemData.updateLore();
     */
    public addCustomLore(lore: string | string[], category?: string): void {
        let customLore = this.getDynamicProperty("lore") || {};
        const index = typeof lore === "string" ? lore : lore[0];
        customLore[category || index] = lore;
        this.setDynamicProperty("lore", customLore);
    }

    /**
     * Removes custom lore from the item
     * @param {string | string[]} lore - The custom lore to remove
     * @param {string} category - The category of the custom lore to remove
     * @example
     * itemData.removeCustomLore("This is a line of custom lore", "LoreCategory"); // Remove lore inside a category
     * itemData.removeCustomLore("LoreCategory") // Remove the entire category
     * itemData.removeCustomLore("This is a line of custom lore"); // Remove lore without a category
     * 
     * // Update the item to update the lore
     * itemData.updateLore();
     */
    public removeCustomLore(lore: string | string[], category?: string): void {
        let customLore = this.getDynamicProperty("lore") || {};
        const index = typeof lore === "string" ? lore : lore[0];
        delete customLore[category || index];
        this.setDynamicProperty("lore", customLore);
    }

    // Enchantment functions
    /**
     * Get the enchantments of the item, returns an object with EnchantmentDataT values
     * @example
     * const enchantments = itemData.getEnchantments();
     * console.log(enchantments); // { "sharpness": { name: "sharpness", level: 1 } }
     * @returns {{ [key: string]: EnchantmentDataT }}
     */
    public getEnchantments(): { [key: string]: EnchantmentDataT } {
        return this.getDynamicProperty("enchantments") || {};
    }

    /**
     * Set the enchantments of the item
     * @param {{ [key: string]: EnchantmentDataT }} enchantments - The enchantments to set
     * @example
     * itemData.setEnchantments({ "sharpness": { name: "sharpness", level: 1 } });
     * @returns {void}
     */
    public setEnchantments(enchantments: { [key: string]: EnchantmentDataT }): void {
        this.setDynamicProperty("enchantments", enchantments);
        this.updateLore();
    }

    /**
     * Add an enchantment to the item
     * @param {EnchantmentDataT} enchantment - The enchantment to add
     * @example
     * itemData.addEnchantment({ name: "sharpness", level: 1 });
     * @returns {void}
     */
    public addEnchantment(enchantment: EnchantmentDataT): void {
        const enchantments = this.getEnchantments();
        enchantments[enchantment.name] = enchantment;

        this.setEnchantments(enchantments);
    }

    /**
     * Remove an enchantment from the item
     * @param {string} enchantment - The enchantment to remove
     * @example
     * itemData.removeEnchantment("sharpness");
     * @returns {void}
     */
    public removeEnchantment(enchantment: string): void {
        const enchantments = this.getEnchantments();
        delete enchantments[enchantment];

        this.setEnchantments(enchantments);
    }

    // Effect functions 
    /**
     * Get the effects of the item, returns an object with EffectDataT values
     * @example
     * const effects = itemData.getEffects();
     * console.log(effects); // { "speed": { name: "speed", level: 1 } }
     * @returns {{ [key: string]: any }}
     */
    public getEffects(): { [key: string]: any } {
        return this.getDynamicProperty("effects") || {};
    }

    /**
     * Set the effects of the item
     * @param {{ [key: string]: any }} effects - The effects to set
     * @example
     * itemData.setEffects({ "speed": { name: "speed", level: 1 } });
     * @returns {void}
     */
    public setEffects(effects: { [key: string]: any }): void {
        this.setDynamicProperty("effects", effects);
    }

    /**
     * Add an effect to the item, you still have to manually setup the item effects (examples in GitHub)
     * @param {ItemEffectDataT} effect - The effect to add
     * @example
     * itemData.addEffect({ name: "speed", level: 1 });
     * @returns {void}
     */
    public addEffect(effect: ItemEffectDataT): void {
        const effects = this.getEffects();
        effects[effect.effect] = effect;

        this.setEffects(effects);
    }

    /**
     * Remove an effect from the item
     * @param {string} effect - The effect to remove
     * @example
     * itemData.removeEffect("speed");
     * @returns {void}
     */
    public removeEffect(effect: string): void {
        const effects = this.getEffects();
        delete effects[effect];

        this.setEffects(effects);
    }

    // Dynamic property functions
    /**
     * Update the item, this is required after setting dynamic properties
     * @returns 
     * @example 
     * this.addCustomLore("This is a line of custom lore", "LoreCategory");
     * this.updateLore(); 
     * // When you get the item, it returns a copy of the item, so you need to update the item in the player's inventory
     */
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

    /**
     * Update the lore of the item, this is required after setting custom lore, enchantments, or effects
     * @returns 
     * @example 
     * this.addCustomLore("This is a line of custom lore", "LoreCategory");
     * this.updateLore(); 
     * // When you get the item, it returns a copy of the item, so you need to update the item in the player's inventory
     * @returns {void}
     */
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