import {
	EntityComponentTypes,
	EntityEquippableComponent,
	EquipmentSlot,
	ItemStack,
	Player,
	world,
} from "@minecraft/server";
import { EnchantmentDataT } from "../types";
import { MinecraftFormatCodes, removeFormat } from "./chatFormat";

export const ItemDataHandler = {
	// Gets the value of a property from the item
	// If it's JSON, then it will automatically be parsed
	get(key: string, item: ItemStack) {
		let value = item.getDynamicProperty(key);
		try { value = JSON.parse(value as string); } catch (err) { }
		return value;
	},

	// Sets the value of a property on the item
	set(key: string, value: any, item: ItemStack, player: Player) {
		if (value === undefined) throw Error("Invalid value.");
		if (typeof value === "object") value = JSON.stringify(value);

		const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
		item.setDynamicProperty(key, value);
		playerEquipment.setEquipment(EquipmentSlot.Mainhand, item);
	},

	// Checks if the item has a property
	has(key: string, item: ItemStack) {
		return !!item.getDynamicProperty(key);
	},

	// Deletes a property from the item
	delete(key: string, item: ItemStack) {
		item.setDynamicProperty(key, undefined);
	},

	// Gets all of an item's data
	entries(item: ItemStack) {
		const dynamicPropertyIds = item.getDynamicPropertyIds();
		const entries: { [key: string]: any } = {};
		for (const dynamicPropertyKey of dynamicPropertyIds) {
			entries[dynamicPropertyKey] = this.get(dynamicPropertyKey, item);
		}

		return entries;
	},

	// Deletes all of an item's data
	deleteAll(item: ItemStack) {
		const itemData = this.entries(item);
		for (const dynamicPropertyKey of Object.keys(itemData)) {
			this.delete(dynamicPropertyKey, item);
		}
	},
};

// Adds custom text to an item
export function addLore(player: Player, item: ItemStack, text: string) {
	// Check if lore limit is past 21 lines
	const lore = item.getLore();
	if (lore.length >= 21) return;

	const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;
	lore.push(text);

	item.setLore(lore);
	playerEquipment.setEquipment(EquipmentSlot.Mainhand, item);
}

// Removes custom text from an item
export function removeLore(player: Player, item: ItemStack, text: string) {
	const lore = item.getLore();
	const playerEquipment = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

	// Search lore for text and remove it
	lore.forEach((currentLore, index) => {
		if (removeFormat(text) == removeFormat(text)) {
			lore.splice(index, 1);
		}
	});

	lore.forEach((currentLore, index) => {
		if (removeFormat(text) == removeFormat(text)) {
			lore.splice(index, 1);
		}
	});

	item.setLore(lore);
	playerEquipment.setEquipment(EquipmentSlot.Mainhand, item);
}

export function updateLore(player: Player, item: ItemStack) {
	const longestText = "Has Custom Properties";
	let currentEnchantments = (ItemDataHandler.get("enchantments", item) as unknown as { [key: string]: EnchantmentDataT; }) || {};

	// Go through the items lore and find any enchantments and remove them
	const lore = item.getLore();
	for (let i = 0; i < lore.length; i++) {
		const currentLore = lore[i];
		removeLore(player, item, currentLore);
	}

	// Add the enchantments back to the item 
	let enchantmentSpacing = longestText.length - ("Enchantments".length);
	addLore(player, item, " ".repeat(Math.floor(enchantmentSpacing / 2) + 1) + MinecraftFormatCodes.BOLD + "Enchantments" + MinecraftFormatCodes.RESET);
	for (const enchantment in currentEnchantments) {
		const currentEnchantmentData = currentEnchantments[enchantment] as EnchantmentDataT;
		const displayName = currentEnchantmentData.currentDisplayName;
		const displayLength = removeFormat(displayName + " " + currentEnchantmentData.level).length;
		const spaces = longestText.length - displayLength;
		const maxLength = longestText.length;
		if (displayLength > maxLength) {
			// shorten down to 14 characters
			currentEnchantmentData.currentDisplayName = displayName.slice(0, maxLength);
		}

		const newDisplayName = " ".repeat(Math.floor(spaces / 2 + 0.5) + 3) + displayName + " " + currentEnchantmentData.level;
		addLore(player, item, newDisplayName);
	}
}

// Adds a custom enchantment to an item
// Automatically formats the enchantment
export function addCustomEnchantment(player: Player, item: ItemStack, enchantmentData: EnchantmentDataT) {
	// Check if the item already has the new enchantment
	const currentEnchantments = (ItemDataHandler.get("enchantments", item) as unknown as { [key: string]: EnchantmentDataT; }) || {};
	if (currentEnchantments[enchantmentData.name]) return;

	currentEnchantments[enchantmentData.name] = enchantmentData;

	// Set the enchantments property
	ItemDataHandler.set("enchantments", currentEnchantments, item, player);
	updateLore(player, item);
}

// Removes a custom enchantment from an item
export function removeCustomEnchantment(player: Player, item: ItemStack, name: string) {
	const currentEnchantments = (ItemDataHandler.get("enchantments", item) as unknown as { [key: string]: EnchantmentDataT | undefined; }) || {};
	if (!currentEnchantments[name]) return;

	const displayName = currentEnchantments[name].currentDisplayName;

	// Go through the items lore and find the specified enchantment then remove it
	const lore = item.getLore();
	for (let i = 0; i < lore.length; i++) {
		const currentLore = lore[i];
		if (currentLore == displayName || (lore.length == 1 && currentLore.toLowerCase().includes("enchantments"))) {
			removeLore(player, item, currentLore);
		}
	}

	// Remove enchantment from custom properties
	delete currentEnchantments[name];

	world.sendMessage("Removing prop 1")
	ItemDataHandler.set("enchantments", currentEnchantments, item, player);
}
