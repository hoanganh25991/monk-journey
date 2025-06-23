import { ModelObjectPool } from '../../world/utils/ModelObjectPool.js';
import * as THREE from 'three';

/**
 * Specialized object pool for character models (NPCs, players, etc.)
 * Helps improve performance by reusing character model instances
 */
export class CharacterModelPool {
    constructor(scene) {
        this.scene = scene;
        
        // Create the model pool
        this.modelPool = new ModelObjectPool(scene);
        
        // Initialize common character model types
        this.initializeCommonModels();
    }
    
    /**
     * Initialize pools for common character model types
     */
    initializeCommonModels() {
        // NPC models
        this.initializeNPCModel('merchant');
        this.initializeNPCModel('villager');
        this.initializeNPCModel('guard');
        this.initializeNPCModel('quest_giver');
        
        // Player class models (for future multiplayer)
        this.initializePlayerModel('barbarian');
        this.initializePlayerModel('wizard');
        this.initializePlayerModel('necromancer');
    }
    
    /**
     * Initialize a pool for a specific NPC model type
     * @param {string} npcType - The NPC type
     */
    initializeNPCModel(npcType) {
        this.modelPool.initializePool(
            `npc_${npcType}`,
            // Factory function
            () => {
                // Create a group for the NPC model
                const modelGroup = new THREE.Group();
                modelGroup.visible = false; // Start invisible
                
                // Create a simple placeholder model
                // In a real implementation, this would load the appropriate model
                const body = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8),
                    new THREE.MeshLambertMaterial({ color: 0x8866aa })
                );
                body.position.y = 0.9;
                modelGroup.add(body);
                
                // Add head
                const head = new THREE.Mesh(
                    new THREE.SphereGeometry(0.25, 8, 8),
                    new THREE.MeshLambertMaterial({ color: 0xffcc99 })
                );
                head.position.y = 1.9;
                modelGroup.add(head);
                
                // Add to scene
                this.scene.add(modelGroup);
                
                // Add metadata
                modelGroup.userData = {
                    type: npcType,
                    isCharacter: true,
                    isNPC: true
                };
                
                return modelGroup;
            },
            // Reset function
            (modelGroup) => {
                modelGroup.visible = false;
                modelGroup.position.set(0, 0, 0);
                modelGroup.rotation.set(0, 0, 0);
                modelGroup.scale.set(1, 1, 1);
            },
            // Initial size
            2 // Start with 2 pre-created NPCs per type
        );
    }
    
    /**
     * Initialize a pool for a specific player class model
     * @param {string} playerClass - The player class
     */
    initializePlayerModel(playerClass) {
        this.modelPool.initializePool(
            `player_${playerClass}`,
            // Factory function
            () => {
                // Create a group for the player model
                const modelGroup = new THREE.Group();
                modelGroup.visible = false; // Start invisible
                
                // Create a simple placeholder model
                // In a real implementation, this would load the appropriate model
                const body = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8),
                    new THREE.MeshLambertMaterial({ color: 0x3366cc })
                );
                body.position.y = 0.9;
                modelGroup.add(body);
                
                // Add head
                const head = new THREE.Mesh(
                    new THREE.SphereGeometry(0.25, 8, 8),
                    new THREE.MeshLambertMaterial({ color: 0xffcc99 })
                );
                head.position.y = 1.9;
                modelGroup.add(head);
                
                // Add weapon placeholder
                const weapon = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.8, 0.1),
                    new THREE.MeshLambertMaterial({ color: 0xcccccc })
                );
                weapon.position.set(0.5, 1.2, 0);
                modelGroup.add(weapon);
                
                // Add to scene
                this.scene.add(modelGroup);
                
                // Add metadata
                modelGroup.userData = {
                    type: playerClass,
                    isCharacter: true,
                    isPlayer: true
                };
                
                return modelGroup;
            },
            // Reset function
            (modelGroup) => {
                modelGroup.visible = false;
                modelGroup.position.set(0, 0, 0);
                modelGroup.rotation.set(0, 0, 0);
                modelGroup.scale.set(1, 1, 1);
            },
            // Initial size
            1 // Start with 1 pre-created player model per class
        );
    }
    
    /**
     * Get an NPC model from the pool
     * @param {string} npcType - The NPC type
     * @param {Object} config - Configuration for the model (optional)
     * @returns {THREE.Group} - The NPC model
     */
    getNPC(npcType, config = {}) {
        return this.modelPool.get(`npc_${npcType}`, config);
    }
    
    /**
     * Return an NPC model to the pool
     * @param {string} npcType - The NPC type
     * @param {THREE.Group} model - The model to return
     */
    releaseNPC(npcType, model) {
        this.modelPool.release(`npc_${npcType}`, model);
    }
    
    /**
     * Get a player model from the pool
     * @param {string} playerClass - The player class
     * @param {Object} config - Configuration for the model (optional)
     * @returns {THREE.Group} - The player model
     */
    getPlayer(playerClass, config = {}) {
        return this.modelPool.get(`player_${playerClass}`, config);
    }
    
    /**
     * Return a player model to the pool
     * @param {string} playerClass - The player class
     * @param {THREE.Group} model - The model to return
     */
    releasePlayer(playerClass, model) {
        this.modelPool.release(`player_${playerClass}`, model);
    }
    
    /**
     * Get statistics about the pool usage
     * @returns {Object} - Pool statistics
     */
    getStats() {
        return this.modelPool.getStats();
    }
    
    /**
     * Clear all pools
     */
    clear() {
        this.modelPool.clear();
    }
}