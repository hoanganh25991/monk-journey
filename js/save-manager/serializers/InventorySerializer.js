/**
 * Handles serialization and deserialization of player inventory and equipment
 */
import { ITEM_TEMPLATES } from '../../config/items.js';

export class InventorySerializer {
    /**
     * Helper method to find item template by various matching strategies
     * @param {Object} itemData - The item data to match
     * @returns {Object|null} - The matching template or null
     */
    static findItemTemplate(itemData) {
        const itemName = typeof itemData === 'string' ? itemData : itemData.name;
        const templateId = typeof itemData === 'object' ? itemData.templateId : null;
        const itemId = typeof itemData === 'object' ? itemData.id : null;
        
        let itemTemplate = null;
        
        // First try to find by templateId if available
        if (templateId) {
            itemTemplate = ITEM_TEMPLATES.find(template => template.id === templateId);
        }
        
        // If not found by templateId, try to find by exact name match
        if (!itemTemplate) {
            itemTemplate = ITEM_TEMPLATES.find(template => template.name === itemName);
        }
        
        // If still not found, try to find by removing quality prefixes and suffixes from the name
        if (!itemTemplate) {
            const qualityPrefixes = [
                // ItemGenerator prefixes (common/uncommon/rare/epic)
                'Fine ', 'Superior ', 'Exquisite ',
                // Item.js legendary prefixes
                'Ancient ', 'Celestial ', 'Divine ', 'Eternal ', 'Fabled ', 
                'Hallowed ', 'Immortal ', 'Legendary ', 'Mythical ', 'Sacred ',
                // Item.js mythic prefixes
                'Astral ', 'Cosmic ', 'Ethereal ', 'Godly ', 'Infinite ', 
                'Omnipotent ', 'Primordial ', 'Transcendent ', 'Ultimate ', 'Void '
            ];
            const qualitySuffixes = [
                ' of the Ancients', ' of Enlightenment', ' of Transcendence', 
                ' of the Cosmos', ' of Divinity', ' of the Elements', 
                ' of Mastery', ' of Power', ' of the Sage', ' of the Void'
            ];
            let baseName = itemName;
            
            // Remove quality prefixes
            for (const prefix of qualityPrefixes) {
                if (baseName.startsWith(prefix)) {
                    baseName = baseName.substring(prefix.length);
                    break;
                }
            }
            
            // Remove quality suffixes
            for (const suffix of qualitySuffixes) {
                if (baseName.endsWith(suffix)) {
                    baseName = baseName.substring(0, baseName.length - suffix.length);
                    break;
                }
            }
            
            // Try to find by base name
            itemTemplate = ITEM_TEMPLATES.find(template => template.name === baseName);
        }
        
        // If still not found, try legacy ID matching
        if (!itemTemplate && itemId) {
            itemTemplate = ITEM_TEMPLATES.find(template => template.id === itemId);
        }
        
        return itemTemplate;
    }
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
        
        // Optimize inventory storage - store name, amount, and templateId for proper loading
        const optimizedInventory = inventoryItems.map(item => ({
            name: item.name,
            amount: item.amount,
            templateId: item.templateId || null
        }));
        
        // Optimize equipment storage - store item name and templateId for proper loading
        const optimizedEquipment = {};
        Object.entries(equipment).forEach(([slot, item]) => {
            optimizedEquipment[slot] = item ? {
                name: item.name,
                templateId: item.templateId || null
            } : null;
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
                const itemTemplate = this.findItemTemplate(itemData);
                
                if (itemTemplate) {
                    // Create a new item from the template, preserving the original name
                    const item = { 
                        ...itemTemplate, 
                        name: itemData.name, // Keep the generated name with quality prefix
                        amount: itemData.amount,
                        templateId: itemTemplate.id // Ensure templateId is set for future saves
                    };
                    player.addToInventory(item);
                } else {
                    console.warn(`Item template not found for: ${itemData.name} (Template ID: ${itemData.templateId || 'N/A'})`);
                    console.debug('Available item templates:', ITEM_TEMPLATES.map(t => `${t.name} (${t.id})`));
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
                    const itemTemplate = this.findItemTemplate(itemData);
                    const itemName = typeof itemData === 'string' ? itemData : itemData.name;
                    const templateId = typeof itemData === 'object' ? itemData.templateId : null;
                    
                    if (itemTemplate) {
                        // Set the equipment slot with the full item data, preserving the original name
                        player.inventory.equipment[slot] = { 
                            ...itemTemplate, 
                            name: itemName, // Keep the generated name with quality prefix
                            templateId: itemTemplate.id // Ensure templateId is set for future saves
                        };
                    } else {
                        console.warn(`Equipment template not found for: ${itemName} (Template ID: ${templateId || 'N/A'})`);
                        console.debug('Available item templates:', ITEM_TEMPLATES.map(t => `${t.name} (${t.id})`));
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