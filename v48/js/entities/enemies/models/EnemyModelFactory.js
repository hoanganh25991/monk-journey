import { SkeletonModel } from './SkeletonModel.js';
import { SkeletonArcherModel } from './SkeletonArcherModel.js';
import { ZombieModel } from './ZombieModel.js';
import { ZombieBruteModel } from './ZombieBruteModel.js';
import { DemonModel } from './DemonModel.js';
import { FrostTitanModel } from './FrostTitanModel.js';
import { NecromancerModel } from './NecromancerModel.js';
import { ShadowBeastModel } from './ShadowBeastModel.js';
import { InfernalGolemModel } from './InfernalGolemModel.js';
import { FireElementalModel } from './FireElementalModel.js';
import { FrostElementalModel } from './FrostElementalModel.js';
import { CorruptedTreantModel } from './CorruptedTreantModel.js';
import { SwampWitchModel } from './SwampWitchModel.js';
import { MountainTrollModel } from './MountainTrollModel.js';
import { VoidWraithModel } from './VoidWraithModel.js';
import { SimpleEnemyModel } from './SimpleEnemyModel.js';
import { DefaultModel } from './DefaultModel.js';

/**
 * Factory class for creating enemy models
 */
export class EnemyModelFactory {
    /**
     * Create an appropriate model for the given enemy type
     * @param {Object} enemy - The enemy instance
     * @param {THREE.Group} modelGroup - The THREE.js group to add model parts to
     * @returns {EnemyModel} The created model instance
     */
    static createModel(enemy, modelGroup) {
        switch (enemy.type) {
            // Skeleton types
            case 'skeleton':
            case 'skeleton_king':
                return new SkeletonModel(enemy, modelGroup);
                
            case 'skeleton_archer':
                return new SkeletonArcherModel(enemy, modelGroup);
                
            // Zombie types
            case 'zombie':
                return new ZombieModel(enemy, modelGroup);
                
            case 'zombie_brute':
                return new ZombieBruteModel(enemy, modelGroup);
                
            // Demon types
            case 'demon':
            case 'demon_lord':
            case 'demon_scout':      // Added demon scout
            case 'ash_demon':        // Added ash demon
            case 'flame_imp':        // Added flame imp (smaller demon)
                return new DemonModel(enemy, modelGroup);
                
            // Boss types
            case 'frost_titan':
                return new FrostTitanModel(enemy, modelGroup);
                
            // Caster types
            case 'necromancer':
            case 'necromancer_lord':
                return new NecromancerModel(enemy, modelGroup);
                
            case 'swamp_witch':
            case 'blood_cultist':    // Added blood cultist (similar to witch)
                return new SwampWitchModel(enemy, modelGroup);
                
            // Beast types
            case 'shadow_beast':
            case 'shadow_stalker':   // Added shadow stalker
                return new ShadowBeastModel(enemy, modelGroup);
                
            // Elemental types
            case 'fire_elemental':
                return new FireElementalModel(enemy, modelGroup);
                
            case 'frost_elemental':
                return new FrostElementalModel(enemy, modelGroup);
                
            // Golem types
            case 'infernal_golem':
            case 'lava_golem':       // Added lava golem
            case 'ice_golem':        // Added ice golem
                return new InfernalGolemModel(enemy, modelGroup);
                
            // Plant types
            case 'corrupted_treant':
                return new CorruptedTreantModel(enemy, modelGroup);
                
            // Mountain creatures
            case 'mountain_troll':
            case 'snow_troll':       // Added snow troll
                return new MountainTrollModel(enemy, modelGroup);
                
            // Dark Sanctum creatures
            case 'void_wraith':
            case 'frozen_revenant':  // Added frozen revenant
            case 'cursed_spirit':    // Added cursed spirit
                return new VoidWraithModel(enemy, modelGroup);
                
            // Use SimpleEnemyModel for these animal-like enemy types
            case 'forest_spider':
            case 'feral_wolf':
            case 'hellhound':
            case 'winter_wolf':
            case 'poison_toad':
            case 'bog_lurker':
            case 'ruin_crawler':
            case 'harpy':            // Added harpy
            case 'ancient_guardian': // Added ancient guardian
                return new SimpleEnemyModel(enemy, modelGroup);
                
            // Default fallback
            default:
                console.warn(`No specific model implementation for enemy type: ${enemy.type}, using default model`);
                return new DefaultModel(enemy, modelGroup);
        }
    }
    
    /**
     * Load a model from a GLB file (for future implementation)
     * @param {Object} enemy - The enemy instance
     * @param {THREE.Group} modelGroup - The THREE.js group to add model parts to
     * @param {string} path - Path to the GLB file
     * @returns {Promise} - Promise that resolves when the model is loaded
     */
    static async loadModelFromGLB(enemy, modelGroup, path) {
        // This is a placeholder for future implementation
        // Will be used to load models from GLB files
        console.debug(`Loading model from ${path} for ${enemy.type} - not yet implemented`);
        
        // For now, fall back to the default model creation
        const model = this.createModel(enemy, modelGroup);
        return model;
    }
}