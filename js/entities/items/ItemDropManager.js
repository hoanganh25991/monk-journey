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
        this.pickupCheckInterval = 0.2; // Check every 100ms instead of every frame
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
        
        // Apply rarity effects
        ItemModelFactory.applyRarityEffects(itemModel, item.rarity);
        
        // Add to scene
        this.scene.add(itemGroup);
        
        // Store reference to dropped item
        this.droppedItems.set(item.id, {
            item: item,
            group: itemGroup,
            model: itemModel,
            dropTime: Date.now()
        });
        
        // Show notification
        if (this.game && this.game.hudManager) {
            this.game.hudManager.showNotification(`${item.name} dropped!`);
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
                if (distance < 2.5) {
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
        
        // Remove item group from scene
        if (itemData.group) {
            this.scene.remove(itemData.group);
        }
        
        // Remove from map
        this.droppedItems.delete(itemId);
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