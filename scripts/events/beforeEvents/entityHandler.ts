import { PlayerInteractWithEntityBeforeEvent, world, Player, Entity, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { shopData } from "../../libraries/data/world/shop";

function categoryHandler(player: Player, entity: Entity, event: PlayerInteractWithEntityBeforeEvent, category: any) {
    let shopItems = category.items;
    let shopCategoryForm = new ActionFormData();
    shopCategoryForm.title(`§eShop Menu - §d${category.title}`);
    shopCategoryForm.body("§7Please select an item to purchase.\n");

    let buttonLength = 0;
    let itemIndex: { [key: string]: any } = {}; // Create an index to store the item pressed
    for (const item in shopItems) {
        let itemData = shopItems[item];
        shopCategoryForm.button(`${itemData.name} - ${itemData.buyPrice}`);
        itemIndex[item] = itemData;
        buttonLength++;
    }

    // Add a back button
    shopCategoryForm.button("§cBack");

    // @ts-ignore
    shopCategoryForm.show(player).then((response) => {
        if (response.canceled) return;
        if (!response.selection && response.selection !== 0) return;
        if (response.selection == buttonLength) {
            finishInteraction(player, entity, event);
            return;
        }

        let item = Object.keys(itemIndex)[response.selection];
        let itemData = itemIndex[item];
        let itemForm = new ModalFormData()
            .title(`§eShop Menu - §d${itemData.name}`)
            .slider("§7Select the amount to §cbuy§e/§asell", 1, itemData.buyingLimit, 1)
            .dropdown("§cBuy §eor §aSell", ["Sell", "Buy"], 1)
            .dropdown("§7Purchase Type", ["Stacks", "Individual"], 1)
            .toggle("§aSell All", false)
            .toggle("§cBuy All", false)
            .submitButton("§aConfirm")

        // @ts-ignore
        itemForm.show(player).then((response) => {
            categoryHandler(player, entity, event, category);
        });
    });
}

function finishInteraction(player: Player, entity: Entity, event: PlayerInteractWithEntityBeforeEvent) {
    let shopSelection = new ActionFormData();
    shopSelection.title("§eShop Menu - §dSelect a category");
    shopSelection.body("§7Please select a category.\n");

    let categoryIndex: { [key: string]: any } = {}; // Create an index to store the category pressed
    for (const category in shopData) {
        shopSelection.button(category);
        categoryIndex[category] = shopData[category];
    }

    // @ts-ignore
    shopSelection.show(player).then((response) => {
        if (response.canceled) return;
        if (!response.selection && response.selection !== 0) return;

        let category = Object.keys(categoryIndex)[response.selection];
        let shopCategory = categoryIndex[category];
        categoryHandler(player, entity, event, shopCategory);
    });
}
export function handleShopInteraction(event: PlayerInteractWithEntityBeforeEvent) {
    const player = event.player;
    const entity = event.target; // Get the entity the player is interacting with
    if (entity.typeId !== "minecraft:villager_v2" || !entity.hasTag("shop_menu")) return; // Check if the entity is a villager and has the shop_menu tag

    event.cancel = true; // Cancel the event to prevent the trade menu from opening
    system.run(() => {
        finishInteraction(player, entity, event);
    });
}