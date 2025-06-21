import { ItemModel } from './ItemModel.js';
import { StaffModel } from './weapons/StaffModel.js';
import { DaggerModel } from './weapons/DaggerModel.js';
import { FistModel } from './weapons/FistModel.js';
import { HelmetModel } from './armor/HelmetModel.js';
import { RobeModel } from './armor/RobeModel.js';
import { BootsModel } from './armor/BootsModel.js';
import { BeltModel } from './armor/BeltModel.js';
import { GlovesModel } from './armor/GlovesModel.js';
import { AmuletModel } from './accessory/AmuletModel.js';
import { TalismanModel } from './accessory/TalismanModel.js';
import { RingModel } from './accessory/RingModel.js';
import { PotionModel } from './consumable/PotionModel.js';
import { FoodModel } from './consumable/FoodModel.js';
import { ScrollModel } from './consumable/ScrollModel.js';

/**
 * Factory class for creating item models
 * Selects the appropriate model class based on item type and subtype
 */
export class ItemModelFactory {
    /**
     * Create a new item model
     * @param {Item} item - The item to create a model for
     * @param {THREE.Group} modelGroup - Optional group to add the model to
     * @returns {ItemModel} The created item model
     */
    static createModel(item, modelGroup) {
        const type = item.type;
        const subType = item.subType;
        
        // Select model class based on type and subType
        switch (type) {
            case 'weapon':
                switch (subType) {
                    case 'staff':
                        return new StaffModel(item, modelGroup);
                    case 'dagger':
                        return new DaggerModel(item, modelGroup);
                    case 'fist':
                        return new FistModel(item, modelGroup);
                    default:
                        console.warn(`No specific model for weapon subtype: ${subType}, using default`);
                        return new ItemModel(item, modelGroup);
                }
                
            case 'armor':
                switch (subType) {
                    case 'helmet':
                        return new HelmetModel(item, modelGroup);
                    case 'robe':
                        return new RobeModel(item, modelGroup);
                    case 'boots':
                        return new BootsModel(item, modelGroup);
                    case 'belt':
                        return new BeltModel(item, modelGroup);
                    case 'gloves':
                        return new GlovesModel(item, modelGroup);
                    // Add more armor subtypes as they are implemented
                    default:
                        console.warn(`No specific model for armor subtype: ${subType}, using default`);
                        return new ItemModel(item, modelGroup);
                }
                
            case 'accessory':
                switch (subType) {
                    case 'amulet':
                        return new AmuletModel(item, modelGroup);
                    case 'talisman':
                        return new TalismanModel(item, modelGroup);
                    case 'ring':
                        return new RingModel(item, modelGroup);
                    // Add more accessory subtypes as they are implemented
                    default:
                        console.warn(`No specific model for accessory subtype: ${subType}, using default`);
                        return new ItemModel(item, modelGroup);
                }
                
            case 'consumable':
                switch (subType) {
                    case 'potion':
                        return new PotionModel(item, modelGroup);
                    case 'food':
                        return new FoodModel(item, modelGroup);
                    case 'scroll':
                        return new ScrollModel(item, modelGroup);
                    // Add more consumable subtypes as they are implemented
                    default:
                        console.warn(`No specific model for consumable subtype: ${subType}, using default`);
                        return new ItemModel(item, modelGroup);
                }
                
            default:
                console.warn(`Unknown item type: ${type}, using default model`);
                return new ItemModel(item, modelGroup);
        }
    }
    
    /**
     * Apply rarity effects to an item model
     * @param {ItemModel} model - The item model
     * @param {string} rarity - The item rarity
     */
    static applyRarityEffects(model, rarity) {
        // Define colors and glow intensities for different rarities
        const rarityEffects = {
            common: { color: 0xCCCCCC, glow: false },
            uncommon: { color: 0x00FF00, glow: 0.2 },
            rare: { color: 0x0070DD, glow: 0.3 },
            epic: { color: 0xA335EE, glow: 0.4 },
            legendary: { color: 0xFF8000, glow: 0.5 },
            mythic: { color: 0xFF0000, glow: 0.6 }
        };
        
        // Get effects for this rarity
        const effects = rarityEffects[rarity] || rarityEffects.common;
        
        // Apply subtle color tint
        model.applyColor(effects.color);
        
        // Apply glow effect for higher rarities
        if (effects.glow) {
            model.addGlowEffect(effects.color, effects.glow);
        }
    }
}