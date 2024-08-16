import { EnchantmentPurchaseT } from "../../types";

const xpboostData: EnchantmentPurchaseT = {
    title: "§d§lXP Boost",
    description: "§6Increases the amount of XP gained per block broken",
    name: "xpboost",
    baseCost: 75000,
    costIncrease: 10,
    effectTitle: "%% XP gained",
    effectType: "percent",
    effectAmount: 25,
    effectSymbol: "+",
}

export { xpboostData };