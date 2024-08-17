import { EnchantmentPurchaseT } from "../../types";

const fortuneData: EnchantmentPurchaseT = {
    title: "§e§lFortune",
    description: "§aIncreases the maximum amount of blocks dropped by 1 per level",
    name: "fortune",
    baseCost: 500000, // 500,000
    effectTitle: " maximum drops",
    effectType: "flat",
    effectAmount: 1,
    effectSymbol: "+",
    rarity: "epic"
}

export { fortuneData };