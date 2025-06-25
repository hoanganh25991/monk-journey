import * as THREE from 'three';
import { ItemModelFactory } from './models/ItemModelFactory.js';
import { Item } from './Item.js';

/**
 * Manages item drops in the game world
 * Creates visual representations of dropped items and handles pickup
 */
export class ItemDropManager {
    /**
     * Create a new ItemDropManager
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {import("../../game/Game.js").Game} game - The game instance
     */
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.droppedItems = new Map(); // Map of item ID to dropped item data
        this.autoRemoveDelay = 10; // Delay in seconds before auto-removing items if not picked up
        this.autoRemoveDistance = 16 * 16;
        
        // Optimization: Only check pickup distances every few frames
        this.pickupCheckInterval = 0.3; // Check every 100ms instead of every frame
        this.timeSinceLastPickupCheck = 0;
        
        // Rotation optimization
        this.rotationSpeed = 2.0; // Radians per second for smoother rotation
    }

    /**
     * Drop an item at a specific position
     * @param {Item} item - The item to drop
     * @param {THREE.Vector3} position - The position to drop the item
     * @returns {string} The ID of the dropped item
     */
    dropItem(item, position) {
        // Create a group for the item
        const itemGroup = new THREE.Group();
        itemGroup.position.copy(position);
        
        // Add a small random offset to prevent items from stacking exactly
        itemGroup.position.x += (Math.random() - 0.5) * 0.5;
        itemGroup.position.z += (Math.random() - 0.5) * 0.5;
        
        // Ensure item is above ground and more visible
        if (this.game && this.game.world) {
            const terrainHeight = this.game.world.getTerrainHeight(position.x, position.z);
            if (terrainHeight !== null) {
                itemGroup.position.y = terrainHeight + 0.5; // Higher above ground for better visibility
            } else {
                // Fallback if terrain height is null
                itemGroup.position.y = position.y + 0.5;
            }
        } else {
            // Fallback if world is not available
            itemGroup.position.y = position.y + 0.5;
        }
        
        // Create the item model
        const itemModel = ItemModelFactory.createModel(item, itemGroup);
        itemModel.createModel();
        
        // Create a flat ring around the item for better visibility
        const ringGeometry = new THREE.RingGeometry(0.4, 0.6, 16); // Smaller ring, just slightly larger than item
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        // Position the ring flat and parallel to the ground, always horizontal
        ring.rotation.x = -Math.PI / 2; // Rotate to lay flat and parallel to ground
        ring.position.copy(itemGroup.position); // Copy the item group's position
        ring.position.y += 0.05; // Slightly above ground level
        
        // Add the ring directly to the scene (not to itemGroup) to keep it always horizontal
        this.scene.add(ring);
        
        // Scale the item to make it more visible (3x larger)
        // itemGroup.scale.set(3, 3, 3);
        
        // Apply rarity effects safely
        try {
            ItemModelFactory.applyRarityEffects(itemModel, item.rarity);
        } catch (error) {
            console.warn(`Failed to apply rarity effects for item ${item.name}:`, error.message);
        }
        
        // Ensure all materials in the item are properly initialized
        this.validateItemMaterials(itemGroup);
        
        // Validate ring material separately
        this.validateRingMaterial(ring);
        
        // Add to scene
        this.scene.add(itemGroup);
        
        // Store reference to dropped item
        this.droppedItems.set(item.id, {
            item: item,
            group: itemGroup,
            model: itemModel,
            ring: ring,
            dropTime: Date.now()
        });
        
        // Show notification
        if (this.game && this.game.hudManager) {
            this.game.hudManager.showNotification(`${item.name} dropped!`);
        }
        
        // Notify game of item drop for more frequent material validation
        if (this.game && typeof this.game.notifyItemDropped === 'function') {
            this.game.notifyItemDropped();
        }
        
        return item.id;
    }
    

    
    /**
     * Update all dropped items
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Skip processing if player is not available
        if (!this.game || !this.game.player) return;
        
        // Update pickup check timer
        this.timeSinceLastPickupCheck += delta;
        const shouldCheckPickup = this.timeSinceLastPickupCheck >= this.pickupCheckInterval;
        
        // Get player position once if we're checking pickup
        let playerPosition = null;
        if (shouldCheckPickup) {
            playerPosition = this.game.player.getPosition();
            this.timeSinceLastPickupCheck = 0; // Reset timer
        }
        
        // Update each dropped item
        for (const [id, itemData] of this.droppedItems.entries()) {
            // Always update rotation for smooth animation
            if (itemData.group) {
                itemData.group.rotation.y += delta * this.rotationSpeed;
                
                // Update terrain height for dropped items to keep them above ground
                // Only check terrain height occasionally to avoid performance issues
                if (Math.random() < 0.01 && this.game && this.game.world) { // ~1% chance per frame
                    const terrainHeight = this.game.world.getTerrainHeight(
                        itemData.group.position.x, 
                        itemData.group.position.z
                    );
                    if (terrainHeight !== null) {
                        const desiredY = terrainHeight + 0.5; // Keep items 0.5 units above ground
                        
                        // Only update if the difference is significant to avoid jittering
                        if (Math.abs(itemData.group.position.y - desiredY) > 0.1) {
                            itemData.group.position.y = desiredY;
                            
                            // Update ring position to match item position
                            if (itemData.ring) {
                                itemData.ring.position.y = desiredY + 0.05; // Slightly above item
                            }
                        }
                    }
                }
            }
            
            // Only check distances periodically to reduce computation
            if (shouldCheckPickup && playerPosition) {
                const itemPosition = itemData.group.position;
                const distance = playerPosition.distanceTo(itemPosition);
                
                // Remove items that are too far away
                if (distance > this.autoRemoveDistance) {
                    this.removeDroppedItem(id, itemData);
                    continue;
                }
                
                // Auto-pickup if player is close enough (instant pickup)
                if (distance < 1.5) {
                    this.pickupItem(id);
                    continue; // Skip to next item since this one was picked up
                }
            }
            
            // Auto-remove item if it's been on the ground for too long
            const currentTime = Date.now();
            const itemDropTime = itemData.dropTime || 0;
            const timeOnGround = (currentTime - itemDropTime) / 1000; // Convert to seconds
            
            if (timeOnGround >= this.autoRemoveDelay) {
                this.removeDroppedItem(id, itemData, true); // true = show notification
                continue;
            }
        }
    }
    
    /**
     * Helper method to remove a dropped item from the scene and cleanup resources
     * @param {string} itemId - The ID of the item to remove
     * @param {Object} itemData - The item data object
     * @param {boolean} showNotification - Whether to show a disappear notification
     */
    removeDroppedItem(itemId, itemData, showNotification = false) {
        // Dispose of model resources if available
        if (itemData.model && typeof itemData.model.dispose === 'function') {
            itemData.model.dispose();
        }
        
        // Dispose of ring resources if available
        if (itemData.ring) {
            try {
                if (itemData.ring.geometry) {
                    itemData.ring.geometry.dispose();
                }
                if (itemData.ring.material) {
                    itemData.ring.material.dispose();
                }
                // Remove ring from scene since it's added directly to scene
                this.scene.remove(itemData.ring);
            } catch (error) {
                console.warn('Error disposing ring resources:', error.message);
            }
        }
        
        // Remove item group from scene
        if (itemData.group) {
            this.scene.remove(itemData.group);
        }
        
        // Remove from map
        this.droppedItems.delete(itemId);
        
        // Show notification if requested and HUD is available
        if (showNotification && this.game && this.game.hudManager) {
            this.game.hudManager.showNotification(`${itemData.item.name} disappeared!`);
        }
    }
    
    /**
     * Pick up an item
     * @param {string} itemId - The ID of the item to pick up
     */
    pickupItem(itemId) {
        // Get item data
        const itemData = this.droppedItems.get(itemId);
        if (!itemData) return;
        
        // Add to player inventory
        if (this.game && this.game.player) {
            this.game.player.addToInventory(itemData.item);
            
            // Show notification
            if (this.game.hudManager) {
                this.game.hudManager.showNotification(`Picked up ${itemData.item.name}`);
            }
        }
        
        // Dispose of model resources if available
        if (itemData.model && typeof itemData.model.dispose === 'function') {
            itemData.model.dispose();
        }
        
        // Dispose of ring resources if available
        if (itemData.ring) {
            try {
                if (itemData.ring.geometry) {
                    itemData.ring.geometry.dispose();
                }
                if (itemData.ring.material) {
                    itemData.ring.material.dispose();
                }
                // Remove ring from scene since it's added directly to scene
                this.scene.remove(itemData.ring);
            } catch (error) {
                console.warn('Error disposing ring resources during pickup:', error.message);
            }
        }
        
        // Remove item group from scene
        if (itemData.group) {
            this.scene.remove(itemData.group);
        }
        
        // Remove from map
        this.droppedItems.delete(itemId);
    }
    
    /**
     * Validate and fix materials in an item group to prevent WebGL errors
     * @param {THREE.Group} itemGroup - The item group to validate
     */
    validateItemMaterials(itemGroup) {
        if (!itemGroup) return;
        
        itemGroup.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach((material, index) => {
                    if (!material) return;
                    
                    try {
                        // Ensure material properties are compatible with material type
                        if (material.type === 'MeshBasicMaterial') {
                            // Remove properties that MeshBasicMaterial doesn't support
                            if (material.roughness !== undefined) delete material.roughness;
                            if (material.metalness !== undefined) delete material.metalness;
                            if (material.emissiveIntensity !== undefined) delete material.emissiveIntensity;
                        } else if (material.type === 'MeshLambertMaterial') {
                            // Remove properties that MeshLambertMaterial doesn't support
                            if (material.roughness !== undefined) delete material.roughness;
                            if (material.metalness !== undefined) delete material.metalness;
                            if (material.emissiveIntensity !== undefined) delete material.emissiveIntensity;
                        }
                        
                        // Mark material for update to ensure proper compilation
                        material.needsUpdate = true;
                        
                        // Set a unique name for debugging
                        if (!material.name) {
                            material.name = `ItemMaterial_${child.name || 'unnamed'}_${index}`;
                        }
                        
                    } catch (error) {
                        console.warn(`Material validation error for ${child.name || 'unnamed'}:`, error.message);
                        
                        // Replace with a safe fallback material
                        const fallbackMaterial = new THREE.MeshBasicMaterial({
                            color: 0x808080,
                            transparent: material.transparent || false,
                            opacity: material.opacity || 1
                        });
                        
                        if (Array.isArray(child.material)) {
                            child.material[index] = fallbackMaterial;
                        } else {
                            child.material = fallbackMaterial;
                        }
                    }
                });
            }
        });
    }
    
    /**
     * Validate ring material to prevent WebGL errors
     * @param {THREE.Mesh} ring - The ring mesh to validate
     */
    validateRingMaterial(ring) {
        if (!ring || !ring.material) return;
        
        try {
            // Ensure the ring material is properly configured
            const material = ring.material;
            
            // MeshBasicMaterial should be safe, but let's ensure proper properties
            if (material.type === 'MeshBasicMaterial') {
                // Ensure transparency is properly set
                if (material.transparent && (material.opacity === undefined || material.opacity === null)) {
                    material.opacity = 0.6;
                }
                
                // Mark for update to ensure proper compilation
                material.needsUpdate = true;
                
                // Set a unique name for debugging
                if (!material.name) {
                    material.name = 'ItemDropRingMaterial';
                }
            }
        } catch (error) {
            console.warn('Ring material validation error:', error.message);
            
            // Replace with a safe fallback material
            try {
                const fallbackMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                ring.material = fallbackMaterial;
            } catch (fallbackError) {
                console.error('Failed to create fallback ring material:', fallbackError.message);
            }
        }
    }
    
    /**
     * Remove all dropped items
     */
    clear() {
        // Remove all items from scene using helper method
        for (const [id, itemData] of this.droppedItems.entries()) {
            this.removeDroppedItem(id, itemData);
        }
    }
}