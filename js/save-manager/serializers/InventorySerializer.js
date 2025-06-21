/**
 * Handles serialization and deserialization of player inventory and equipment
 */
import { ITEM_TEMPLATES } from '../../config/items.js';

export class InventorySerializer {
    /**
     * Serialize player inventory and equipment data for saving
     * @param {Object} player - The player object
     * @returns {Object} Serialized inventory and equipment data
     */
    static serialize(player) {
        if (!player || !player.inventory) {
            console.warn('Player or inventory object is null or undefined');
            return { inventory: [], equipment: {} };
        }
        
        // Get inventory items
        const inventoryItems = player.getInventory() || [];
        
        // Get equipment items
        const equipment = player.getEquipment() || {};
        
        // Optimize inventory storage - only store name and amount
        const optimizedInventory = inventoryItems.map(item => ({
            name: item.name,
            amount: item.amount
        }));
        
        // Optimize equipment storage - only store item name
        const optimizedEquipment = {};
        Object.entries(equipment).forEach(([slot, item]) => {
            optimizedEquipment[slot] = item ? item.name : null;
        });
        
        return {
            inventory: optimizedInventory,
            equipment: optimizedEquipment,
            gold: player.getGold() || 0
        };
    }
    
    /**
     * Deserialize inventory and equipment data from save
     * @param {Object} player - The player object to update
     * @param {Object} inventoryData - The saved inventory data
     */
    static deserialize(player, inventoryData) {
        if (!player || !player.inventory || !inventoryData) {
            console.error('Player, inventory, or inventory data is null or undefined');
            return;
        }
        
        console.debug('Loading inventory data:', Object.keys(inventoryData));
        
        // Clear existing inventory
        if (player.inventory.inventory) {
            player.inventory.inventory = [];
        }
        
        // Load inventory items
        if (inventoryData.inventory && Array.isArray(inventoryData.inventory)) {
            console.debug(`Loading ${inventoryData.inventory.length} inventory items`);
            
            inventoryData.inventory.forEach(itemData => {
                // Find the item template by name or ID
                let itemTemplate = ITEM_TEMPLATES.find(template => template.name === itemData.name);
                
                // If not found by name, try to find by ID
                if (!itemTemplate && itemData.id) {
                    itemTemplate = ITEM_TEMPLATES.find(template => template.id === itemData.id);
                }
                
                if (itemTemplate) {
                    // Create a new item from the template
                    const item = { ...itemTemplate, amount: itemData.amount };
                    player.addToInventory(item);
                } else {
                    console.warn(`Item template not found for: ${itemData.name} (ID: ${itemData.id || 'N/A'})`);
                    console.debug('Available item names:', ITEM_TEMPLATES.map(t => t.name));
                    // Fallback to just adding the basic item data we have
                    player.addToInventory(itemData);
                }
            });
        }
        
        // Clear existing equipment
        if (player.inventory.equipment) {
            Object.keys(player.inventory.equipment).forEach(slot => {
                player.inventory.equipment[slot] = null;
            });
        }
        
        // Load equipment
        if (inventoryData.equipment) {
            console.debug('Loading player equipment');
            
            Object.entries(inventoryData.equipment).forEach(([slot, itemData]) => {
                if (itemData && player.inventory.equipment.hasOwnProperty(slot)) {
                    // Handle both string (legacy) and object formats
                    const itemName = typeof itemData === 'string' ? itemData : itemData.name;
                    const itemId = typeof itemData === 'object' ? itemData.id : null;
                    
                    // Find the item template by name or ID
                    let itemTemplate = ITEM_TEMPLATES.find(template => template.name === itemName);
                    
                    // If not found by name, try to find by ID
                    if (!itemTemplate && itemId) {
                        itemTemplate = ITEM_TEMPLATES.find(template => template.id === itemId);
                    }
                    
                    if (itemTemplate) {
                        // Set the equipment slot with the full item data
                        player.inventory.equipment[slot] = { ...itemTemplate };
                    } else {
                        console.warn(`Equipment template not found for: ${itemName} (ID: ${itemId || 'N/A'})`);
                        // Fallback to just setting the available data
                        player.inventory.equipment[slot] = typeof itemData === 'string' ? { name: itemData } : itemData;
                    }
                }
            });
        }
        
        // Load gold
        if (inventoryData.gold !== undefined) {
            player.inventory.gold = inventoryData.gold;
        }
        
        // Recalculate equipment bonuses
        player.inventory.calculateEquipmentBonuses();
        
        console.debug('Inventory data loaded successfully');
    }
}