import { EntityComponentTypes, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { EnchantmentDataT } from "../../../types";
import { MinecraftFormatCodes, removeFormat } from "../../chatFormat";
import { enchantmentTitles } from "../../enchantments/enchantmentHandler";
import { safeJsonParser, safeJsonStringify } from "../player/playerData";

export class ItemData {
    public item: ItemStack;
    public slot: EquipmentSlot | number;
    private player: Player;

    constructor(item: ItemStack, player: Player, slot: EquipmentSlot | number) {
        this.item = item;
        this.player = player;
        this.slot = slot;
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

    // Enchantment functions
    public getEnchantments(): { [key: string]: EnchantmentDataT } {
        let enchantments = this.getDynamicProperty("enchantments");
        if (!enchantments) {
            enchantments = {};
            this.setDynamicProperty("enchantments", enchantments);
        }

        return enchantments;
    }

    public addEnchantment(enchantment: EnchantmentDataT): void {
        const enchantments = this.getEnchantments();
        enchantments[enchantment.name] = enchantment;

        this.setDynamicProperty("enchantments", enchantments);
        this.updateLore();
    }

    // Dynamic property functions
    public updateItem(): void {
        if (typeof this.slot === "number") {
            const inventory = this.player.getComponent("minecraft:inventory") as EntityInventoryComponent;
            const container = inventory.container;

            // Check if the player has an inventory
            if (!container) return;

            // Update the item in the player's inventory
            container.setItem(this.slot, this.item);
        } else {
            const playerEquipment = this.player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
            playerEquipment.setEquipment(this.slot, this.item);
        }
    }

    public updateLore(): void {
        const longestText = "Has Custom Properties";
        let enchantments = this.getEnchantments();

        // Remove the old lore
        const currentLore = this.getLore();
        currentLore.forEach((lore, index) => {
            this.removeLore(index);
        });

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
    }
}