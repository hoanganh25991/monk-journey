import { Item } from './Item.js';
import { ITEM_TEMPLATES } from '../../config/items.js';
import { COMBAT_BALANCE } from '../../config/game-balance.js';

export class ItemGenerator {
    constructor(game) {
        this.game = game;
    }
    
    /**
     * Generate a random item
     * @param {Object} options - Generation options
     * @param {number} options.level - Item level (defaults to player level)
     * @param {string} options.type - Item type (weapon, armor, accessory, consumable)
     * @param {string} options.rarity - Force a specific rarity
     * @param {string} options.subType - Force a specific subType
     * @returns {Item} - The generated item
     */
    generateItem(options = {}) {
        // Default to player level if available
        const level = options.level || (this.game.player ? this.game.player.stats.getLevel() : 1);
        
        // Select item type
        const type = options.type || this.selectRandomItemType();
        
        // Select item subtype based on type
        const subType = options.subType || this.selectRandomSubType(type);
        
        // Select rarity based on level and luck
        const rarity = options.rarity || this.selectRarity(level);
        
        // Get base template for this type/subtype
        const template = this.getItemTemplate(type, subType);
        
        // Generate base stats
        const baseStats = this.generateBaseStats(template, level);
        
        // Generate secondary stats based on rarity
        const secondaryStats = this.generateSecondaryStats(template, rarity, level);
        
        // Generate special effects based on rarity
        const specialEffects = this.generateSpecialEffects(template, rarity);
        
        // Determine if it's a set item
        const setId = this.determineSetId(rarity, type, subType);
        
        // Create the item
        const item = new Item({
            name: this.generateItemName(template, rarity, setId),
            description: template.description,
            type: type,
            subType: subType,
            icon: template.icon,
            level: level,
            rarity: rarity,
            baseStats: baseStats,
            secondaryStats: secondaryStats,
            specialEffects: specialEffects,
            setId: setId,
            visual: template.visual,
            templateId: template.id // Store the original template ID for save/load
        });
        
        return item;
    }
    
    // Helper methods for item generation
    selectRandomItemType() {
        const types = ['weapon', 'armor', 'accessory', 'consumable'];
        // Use item type weights from game-balance config
        const weights = [
            COMBAT_BALANCE.items.itemTypeWeights.weapon,
            COMBAT_BALANCE.items.itemTypeWeights.armor,
            COMBAT_BALANCE.items.itemTypeWeights.accessory,
            COMBAT_BALANCE.items.itemTypeWeights.consumable
        ];
        
        return this.weightedRandom(types, weights);
    }
    
    selectRandomSubType(type) {
        const subTypes = {
            weapon: ['fist', 'staff', 'dagger'],
            armor: ['robe', 'belt', 'boots', 'gloves', 'helmet'],
            accessory: ['amulet', 'ring', 'talisman'],
            consumable: ['potion', 'scroll', 'food']
        };
        
        return this.randomElement(subTypes[type] || []);
    }
    
    selectRarity(level) {
        // Base chances adjusted by level
        let chances = {
            common: 100 - (level * 1.5),
            uncommon: 20 + (level * 0.5),
            rare: 10 + (level * 0.3),
            epic: 5 + (level * 0.2),
            legendary: 1 + (level * 0.1),
            mythic: 0 + (level * 0.05)
        };
        
        // Ensure minimum chances
        chances.common = Math.max(chances.common, 40);
        chances.uncommon = Math.max(chances.uncommon, 20);
        chances.rare = Math.max(chances.rare, 10);
        chances.epic = Math.max(chances.epic, 5);
        chances.legendary = Math.max(chances.legendary, 1);
        chances.mythic = Math.max(chances.mythic, 0.5);
        
        // Convert to weights array
        const rarities = Object.keys(chances);
        const weights = Object.values(chances);
        
        return this.weightedRandom(rarities, weights);
    }
    
    getItemTemplate(type, subType) {
        // Find matching template
        const matchingTemplates = ITEM_TEMPLATES.filter(
            template => template.type === type && template.subType === subType
        );
        
        if (matchingTemplates.length === 0) {
            console.warn(`No template found for ${type}/${subType}, using default`);
            return ITEM_TEMPLATES[0];
        }
        
        // Get a random template
        const template = this.randomElement(matchingTemplates);
        
        // Ensure the template has a visual property
        if (!template.visual) {
            template.visual = {};
        }
        
        return template;
    }
    
    generateBaseStats(template, level) {
        const baseStats = {};
        
        // Copy base stats from template
        for (const [key, value] of Object.entries(template.baseStats || {})) {
            // Add some randomness (±10%)
            const randomFactor = 0.9 + (Math.random() * 0.2);
            
            // Apply level scaling from game-balance
            const levelScalingFactor = 1 + (level * COMBAT_BALANCE.items.levelScalingFactor);
            
            // Apply weapon damage scaling for weapon items
            if (key === 'damage' && template.type === 'weapon') {
                baseStats[key] = Math.round(value * randomFactor * levelScalingFactor * 
                                (1 + COMBAT_BALANCE.player.weaponDamageIncrease * level));
            } 
            // Apply armor damage reduction for armor items
            else if (key === 'armor' && template.type === 'armor') {
                baseStats[key] = Math.round(value * randomFactor * levelScalingFactor * 
                                (1 + COMBAT_BALANCE.player.armorDamageReduction * level));
            }
            // Apply regular level scaling for other stats
            else {
                baseStats[key] = Math.round(value * randomFactor * levelScalingFactor);
            }
        }
        
        return baseStats;
    }
    
    generateSecondaryStats(template, rarity, level) {
        // Number of secondary stats based on rarity
        const statCounts = {
            common: 0,
            uncommon: 1,
            rare: 2,
            epic: 3,
            legendary: 4,
            mythic: 5
        };
        
        // Add some randomness to count
        let count = statCounts[rarity];
        if (Math.random() < 0.3) {
            count += 1; // 30% chance for an extra stat
        }
        
        // Get possible secondary stats for this item type
        const possibleStats = template.possibleSecondaryStats || [];
        
        // Generate the stats
        const secondaryStats = [];
        for (let i = 0; i < count && i < possibleStats.length; i++) {
            const statType = this.randomElement(possibleStats);
            
            // Remove from possible stats to avoid duplicates
            const index = possibleStats.indexOf(statType);
            if (index > -1) {
                possibleStats.splice(index, 1);
            }
            
            // Generate value based on stat type and level
            const value = this.generateStatValue(statType, level, rarity);
            
            // Add elemental type if needed
            let stat = { type: statType, value: value };
            if (statType === 'elementalDamage') {
                stat.element = this.randomElement(['fire', 'ice', 'lightning', 'holy']);
            }
            
            secondaryStats.push(stat);
        }
        
        return secondaryStats;
    }
    
    generateStatValue(statType, level, rarity) {
        // Use base values from game-balance config
        const baseValues = COMBAT_BALANCE.items.secondaryStatBaseValues;
        
        // Use rarity multipliers from game-balance config
        const rarityMultipliers = COMBAT_BALANCE.items.rarityMultipliers;
        
        // Calculate base value
        let value = baseValues[statType] || 5;
        
        // Scale with level using game-balance level scaling factor
        value *= (1 + (level * COMBAT_BALANCE.items.levelScalingFactor));
        
        // Apply rarity multiplier
        value *= rarityMultipliers[rarity];
        
        // Add some randomness (±15%)
        const randomFactor = 0.85 + (Math.random() * 0.3);
        value *= randomFactor;
        
        // Apply special multipliers for certain stat types
        if (statType === 'critChance') {
            // Apply base crit chance from combat balance
            value += COMBAT_BALANCE.player.baseCritChance * 100; // Convert from decimal to percentage
        } else if (statType === 'critDamage') {
            // Apply crit damage multiplier from combat balance
            value *= COMBAT_BALANCE.player.critDamageMultiplier;
        } else if (statType === 'elementalDamage') {
            // Apply elemental damage multiplier from combat balance
            value *= COMBAT_BALANCE.player.elementalDamageMultiplier;
        } else if (statType === 'manaBonus') {
            // Scale mana bonus with level more aggressively
            value *= (1 + (level * 0.1));
        } else if (statType === 'manaRegen') {
            // Scale mana regen with level
            value *= (1 + (level * 0.05));
        }
        
        // Round to appropriate precision
        if (['critChance', 'attackSpeed', 'cooldownReduction', 'damageReduction', 'movementSpeed', 'manaRegen'].includes(statType)) {
            // These are small percentages, round to 1 decimal place
            return Math.round(value * 10) / 10;
        }
        
        return Math.round(value);
    }
    
    generateSpecialEffects(template, rarity) {
        // Only higher rarities get special effects
        if (!['rare', 'epic', 'legendary', 'mythic'].includes(rarity)) {
            return [];
        }
        
        // Number of effects based on rarity
        const effectCounts = {
            rare: 1,
            epic: 1,
            legendary: 2,
            mythic: 3
        };
        
        // Get possible effects for this template
        const possibleEffects = template.possibleEffects || [];
        if (possibleEffects.length === 0) {
            return [];
        }
        
        // Generate effects
        const effects = [];
        const count = effectCounts[rarity];
        
        for (let i = 0; i < count && i < possibleEffects.length; i++) {
            const effect = this.randomElement(possibleEffects);
            effects.push(JSON.parse(JSON.stringify(effect))); // Deep copy
        }
        
        return effects;
    }
    
    determineSetId(rarity, type, subType) {
        // Only epic+ items can be set items
        if (!['epic', 'legendary', 'mythic'].includes(rarity)) {
            return null;
        }
        
        // Use set item chances from game-balance config
        const setChances = COMBAT_BALANCE.items.setItemChances;
        
        if (Math.random() < setChances[rarity]) {
            // Get possible sets for this item type/subtype
            const possibleSets = ITEM_TEMPLATES
                .filter(template => template.type === type && template.setId)
                .map(template => template.setId);
            
            if (possibleSets.length > 0) {
                return this.randomElement(possibleSets);
            }
        }
        
        return null;
    }
    
    generateItemName(template, rarity, setId) {
        if (setId) {
            // Use set name pattern
            const setInfo = ITEM_TEMPLATES.find(t => t.setId === setId);
            if (setInfo && setInfo.setName) {
                return `${setInfo.setName} ${template.subType}`;
            }
        }
        
        // Use rarity-based naming
        if (rarity === 'legendary' || rarity === 'mythic') {
            // Legendary items have unique names
            return template.uniqueNames ? this.randomElement(template.uniqueNames) : template.name;
        }
        
        // Regular items use quality + name pattern
        const qualityPrefixes = {
            common: '',
            uncommon: 'Fine ',
            rare: 'Superior ',
            epic: 'Exquisite '
        };
        
        return `${qualityPrefixes[rarity]}${template.name}`;
    }
    
    // Utility methods
    randomElement(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }
    
    weightedRandom(items, weights) {
        // Calculate sum of weights
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        // Get random value within total weight
        let random = Math.random() * totalWeight;
        
        // Find the item based on weights
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random < 0) {
                return items[i];
            }
        }
        
        // Fallback
        return items[0];
    }
}
