import * as THREE from 'three';
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
import { AncientTreantModel } from './AncientTreantModel.js';
import { SwampWitchModel } from './SwampWitchModel.js';
import { MountainTrollModel } from './MountainTrollModel.js';
import { VoidWraithModel } from './VoidWraithModel.js';
import { SwampHorrorModel } from './SwampHorrorModel.js';
import { InfernoLordModel } from './InfernoLordModel.js';
import { SpiderQueenModel } from './SpiderQueenModel.js';
import { FrostMonarchModel } from './FrostMonarchModel.js';
import { AncientConstructModel } from './AncientConstructModel.js';
import { AncientYetiModel } from './AncientYetiModel.js';
import { MoltenBehemothModel } from './MoltenBehemothModel.js';
import { SimpleEnemyModel } from './SimpleEnemyModel.js';
import { DefaultModel } from './DefaultModel.js';

/**
 * Shared resource manager for enemy models
 */
class SharedResourceManager {
    constructor() {
        this.geometries = new Map();
        this.materials = new Map();
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        // Create shared geometries
        this.geometries.set('box_body', new THREE.BoxGeometry(0.6, 1.2, 0.3));
        this.geometries.set('box_small', new THREE.BoxGeometry(0.4, 0.8, 0.2));
        this.geometries.set('box_large', new THREE.BoxGeometry(0.8, 1.6, 0.4));
        this.geometries.set('sphere_head', new THREE.SphereGeometry(0.25, 16, 16));
        this.geometries.set('sphere_large', new THREE.SphereGeometry(0.4, 16, 16));
        this.geometries.set('cylinder_arm', new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8));
        this.geometries.set('cylinder_leg', new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8));
        this.geometries.set('cylinder_thick', new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8));
        this.geometries.set('cone_horn', new THREE.ConeGeometry(0.1, 0.3, 8));
        this.geometries.set('box_weapon', new THREE.BoxGeometry(0.1, 1, 0.1));
        
        // Create shared materials with common colors
        this.materials.set('skeleton', new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        this.materials.set('zombie', new THREE.MeshStandardMaterial({ color: 0x4a5d23 }));
        this.materials.set('demon', new THREE.MeshStandardMaterial({ color: 0x8b0000 }));
        this.materials.set('frost', new THREE.MeshStandardMaterial({ color: 0x87ceeb }));
        this.materials.set('fire', new THREE.MeshStandardMaterial({ color: 0xff4500 }));
        this.materials.set('shadow', new THREE.MeshStandardMaterial({ color: 0x2f2f2f }));
        this.materials.set('gold', new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
        this.materials.set('silver', new THREE.MeshStandardMaterial({ color: 0x888888 }));
        this.materials.set('green', new THREE.MeshStandardMaterial({ color: 0x228b22 }));
        this.materials.set('purple', new THREE.MeshStandardMaterial({ color: 0x800080 }));
        
        this.initialized = true;
    }
    
    getGeometry(type) {
        if (!this.initialized) this.init();
        return this.geometries.get(type);
    }
    
    getMaterial(type) {
        if (!this.initialized) this.init();
        return this.materials.get(type);
    }
    
    dispose() {
        // Dispose all shared resources
        for (const geometry of this.geometries.values()) {
            geometry.dispose();
        }
        for (const material of this.materials.values()) {
            material.dispose();
        }
        this.geometries.clear();
        this.materials.clear();
        this.initialized = false;
    }
}

// Global shared resource manager instance
const sharedResources = new SharedResourceManager();

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
                
            case 'frost_monarch':
                return new FrostMonarchModel(enemy, modelGroup);
                
            // Caster types
            case 'necromancer':
            case 'necromancer_lord':
                return new NecromancerModel(enemy, modelGroup);
                
            case 'swamp_witch':
            case 'blood_cultist':    // Added blood cultist (similar to witch)
            case 'plague_lord':      // Added plague lord (similar to necromancer)
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
                
            case 'ancient_construct':
                return new AncientConstructModel(enemy, modelGroup);
                
            // Plant types
            case 'corrupted_treant':
                return new CorruptedTreantModel(enemy, modelGroup);
                
            case 'ancient_treant':
                return new AncientTreantModel(enemy, modelGroup);
                
            // Mountain creatures
            case 'mountain_troll':
            case 'snow_troll':       // Added snow troll
                return new MountainTrollModel(enemy, modelGroup);
                
            case 'ancient_yeti':
                return new AncientYetiModel(enemy, modelGroup);
                
            // Dark Sanctum creatures
            case 'void_wraith':
            case 'void_harbinger':   // Added void harbinger
            case 'frozen_revenant':  // Added frozen revenant
            case 'cursed_spirit':    // Added cursed spirit
                return new VoidWraithModel(enemy, modelGroup);
                
            // Swamp creatures
            case 'swamp_horror':
                return new SwampHorrorModel(enemy, modelGroup);
                
            // Fire bosses
            case 'inferno_lord':
                return new InfernoLordModel(enemy, modelGroup);
                
            // Molten creatures
            case 'molten_behemoth':
                return new MoltenBehemothModel(enemy, modelGroup);
                
            // Spider creatures
            case 'spider_queen':
                return new SpiderQueenModel(enemy, modelGroup);
                
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
     * Get shared geometry
     * @param {string} type - Geometry type
     * @returns {THREE.Geometry} Shared geometry
     */
    static getSharedGeometry(type) {
        return sharedResources.getGeometry(type);
    }
    
    /**
     * Get shared material
     * @param {string} type - Material type
     * @returns {THREE.Material} Shared material
     */
    static getSharedMaterial(type) {
        return sharedResources.getMaterial(type);
    }
    
    /**
     * Initialize shared resources
     */
    static initSharedResources() {
        sharedResources.init();
    }
    
    /**
     * Dispose all shared resources (call when game ends)
     */
    static disposeSharedResources() {
        sharedResources.dispose();
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