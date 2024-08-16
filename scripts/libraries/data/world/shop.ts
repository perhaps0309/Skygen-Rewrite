let shopData: { [key: string]: { title: string, icon: string, items: { [key: string]: { name: string, buyPrice: number, sellPrice: number, multipleBuying: boolean, buyingLimit: number, stackLimit: number, icon: string } } } } = { // Categories
    "items": {
        title: "Items",
        icon: "minecraft:emerald",
        items: {
            "minecraft:diamond": {
                name: "Diamond",
                buyPrice: 1000, // Set to 0 to disable buying
                sellPrice: 250, // Set to 0 to disable selling
                multipleBuying: true,
                buyingLimit: 64,
                stackLimit: 0, // Set to 0 for no limit
                icon: "minecraft:diamond",
            },
            "minecraft:iron_ingot": {
                name: "Iron Ingot",
                buyPrice: 500,
                sellPrice: 100,
                multipleBuying: true,
                buyingLimit: 64,
                stackLimit: 0,
                icon: "minecraft:iron_ingot",
            }
        }
    }
}

export { shopData }