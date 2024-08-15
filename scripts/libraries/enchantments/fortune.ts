import { EnchantmentPurchaseT } from "../../types";

const fortuneData: EnchantmentPurchaseT = {
    title: "§e§lFortune",
    description: "§aIncreases the maximum amount of blocks dropped by 1 per level",
    name: "fortune",
    baseCost: 25000,
    costIncrease: 25, // 25% increase per level
    effectTitle: " maximum drops",
    effectType: "flat",
    effectAmount: 1,
    effectSymbol: "+",
}

export { fortuneData };