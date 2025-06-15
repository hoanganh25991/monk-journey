/**
 * PlayerInventory.js
 * Manages the player's inventory and equipment
 */

export class PlayerInventory {
    constructor() {
        // Initialize inventory
        this.inventory = [];
        this.gold = 0;
        
        // Initialize equipment with expanded slots
        this.equipment = {
            weapon: null,
            armor: null,
            helmet: null,
            boots: null,
            gloves: null,
            belt: null,
            accessory1: null,
            accessory2: null,
            talisman: null
        };
        
        // Equipment stat bonuses cache
        this.equipmentBonuses = {
            manaBonus: 0,
            healthBonus: 0,
            attackBonus: 0,
            defenseBonus: 0,
            speedBonus: 0
        };
    }
    
    // Inventory management
    addToInventory(item) {
        // Check if item already exists in inventory
        const existingItem = this.inventory.find(i => i.name === item.name);
        
        if (existingItem) {
            // Increase amount
            existingItem.amount += item.amount;
        } else {
            // Add new item
            this.inventory.push({ ...item });
        }
    }
    
    removeFromInventory(itemName, amount = 1) {
        // Find item in inventory
        const itemIndex = this.inventory.findIndex(i => i.name === itemName);
        
        if (itemIndex >= 0) {
            // Decrease amount
            this.inventory[itemIndex].amount -= amount;
            
            // Remove item if amount is 0 or less
            if (this.inventory[itemIndex].amount <= 0) {
                this.inventory.splice(itemIndex, 1);
            }

            return true;
        }
        
        return false;
    }
    
    // Equipment management
    equipItem(item) {
        // Check if item is equippable
        if (!item.type) {
            return false;
        }
        
        // Determine the correct equipment slot
        let slot = item.type;
        
        // Handle special cases for accessories
        if (item.type === 'accessory') {
            if (item.subType === 'talisman') {
                slot = 'talisman';
            } else if (!this.equipment.accessory1) {
                slot = 'accessory1';
            } else if (!this.equipment.accessory2) {
                slot = 'accessory2';
            } else {
                // Both accessory slots are full, replace the first one
                slot = 'accessory1';
            }
        }
        
        // Check if the slot exists
        if (!this.equipment.hasOwnProperty(slot)) {
            return false;
        }
        
        // Unequip current item if any
        if (this.equipment[slot]) {
            this.addToInventory(this.equipment[slot]);
        }
        
        // Equip new item
        this.equipment[slot] = item;
        
        // Remove from inventory
        this.removeFromInventory(item.name);
        
        // Recalculate equipment bonuses
        this.calculateEquipmentBonuses();
        
        return true;
    }
    
    unequipItem(slot) {
        // Check if slot is valid
        if (!this.equipment.hasOwnProperty(slot)) {
            return false;
        }
        
        // Check if item is equipped
        if (!this.equipment[slot]) {
            return false;
        }
        
        // Add to inventory
        this.addToInventory(this.equipment[slot]);
        
        // Remove from equipment
        this.equipment[slot] = null;
        
        // Recalculate equipment bonuses
        this.calculateEquipmentBonuses();
        
        return true;
    }
    
    /**
     * Calculate all stat bonuses from equipped items
     */
    calculateEquipmentBonuses() {
        // Reset bonuses
        this.equipmentBonuses = {
            manaBonus: 0,
            healthBonus: 0,
            attackBonus: 0,
            defenseBonus: 0,
            speedBonus: 0
        };
        
        // Loop through all equipped items
        Object.values(this.equipment).forEach(item => {
            if (!item) return;
            
            // Process base stats
            if (item.baseStats) {
                // Add mana bonus
                if (item.baseStats.manaBonus) {
                    this.equipmentBonuses.manaBonus += item.baseStats.manaBonus;
                }
                
                // Add health bonus
                if (item.baseStats.healthBonus) {
                    this.equipmentBonuses.healthBonus += item.baseStats.healthBonus;
                }
                
                // Add attack bonus
                if (item.baseStats.damage) {
                    this.equipmentBonuses.attackBonus += item.baseStats.damage;
                }
                
                // Add defense bonus
                if (item.baseStats.defense) {
                    this.equipmentBonuses.defenseBonus += item.baseStats.defense;
                }
                
                // Add speed bonus
                if (item.baseStats.movementSpeed) {
                    this.equipmentBonuses.speedBonus += item.baseStats.movementSpeed;
                }
            }
            
            // Process secondary stats
            if (item.secondaryStats && Array.isArray(item.secondaryStats)) {
                item.secondaryStats.forEach(stat => {
                    if (stat.type === 'manaBonus') {
                        this.equipmentBonuses.manaBonus += stat.value;
                    } else if (stat.type === 'healthBonus') {
                        this.equipmentBonuses.healthBonus += stat.value;
                    } else if (stat.type === 'attackPower') {
                        this.equipmentBonuses.attackBonus += stat.value;
                    } else if (stat.type === 'defense') {
                        this.equipmentBonuses.defenseBonus += stat.value;
                    } else if (stat.type === 'movementSpeed') {
                        this.equipmentBonuses.speedBonus += stat.value;
                    }
                });
            }
        });
    }
    
    // Gold management
    addGold(amount) {
        this.gold += amount;
    }
    
    removeGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    // Getters
    getInventory() {
        return this.inventory;
    }
    
    getEquipment() {
        return this.equipment;
    }
    
    getGold() {
        return this.gold;
    }
    
    /**
     * Get equipment stat bonuses
     * @returns {Object} Equipment stat bonuses
     */
    getEquipmentBonuses() {
        return this.equipmentBonuses;
    }
    
    /**
     * Get mana bonus from equipment
     * @returns {number} Total mana bonus
     */
    getManaBonus() {
        return this.equipmentBonuses.manaBonus;
    }
    
    /**
     * Get health bonus from equipment
     * @returns {number} Total health bonus
     */
    getHealthBonus() {
        return this.equipmentBonuses.healthBonus;
    }
    
    /**
     * Get attack bonus from equipment
     * @returns {number} Total attack bonus
     */
    getAttackBonus() {
        return this.equipmentBonuses.attackBonus;
    }
    
    /**
     * Get defense bonus from equipment
     * @returns {number} Total defense bonus
     */
    getDefenseBonus() {
        return this.equipmentBonuses.defenseBonus;
    }
    
    /**
     * Get speed bonus from equipment
     * @returns {number} Total speed bonus
     */
    getSpeedBonus() {
        return this.equipmentBonuses.speedBonus;
    }
}