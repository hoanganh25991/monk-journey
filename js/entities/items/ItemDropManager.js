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
        this.lightBeams = new Map(); // Map of item ID to light beam effect
        this.autoPickupDelay = 1; // Delay in seconds before auto-pickup (was instant before)
        this.autoRemoveDelay = 7; // Delay in seconds before auto-removing items if not picked up
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
        
        // Add light beam for all items to make them more visible
        // Different colors/intensities based on rarity
        this.addLightBeamEffect(item, itemGroup);
        
        // Show notification
        if (this.game && this.game.hudManager) {
            this.game.hudManager.showNotification(`${item.name} dropped!`);
        }
        
        return item.id;
    }
    
    /**
     * Add a light beam effect for items
     * @param {Item} item - The item
     * @param {THREE.Group} itemGroup - The item's group
     */
    addLightBeamEffect(item, itemGroup) {
        // Get color based on rarity
        const rarityColors = {
            common: 0xFFFFFF,    // White for common
            uncommon: 0x1EFF00,  // Green for uncommon
            magic: 0x0070DD,     // Blue for magic
            rare: 0x0070DD,      // Blue for rare
            epic: 0xA335EE,      // Purple for epic
            legendary: 0xFF8000, // Orange for legendary
            mythic: 0xFF0000     // Red for mythic
        };
        
        const color = rarityColors[item.rarity] || 0xFFFFFF;
        
        // Create light source
        const light = new THREE.PointLight(color, 1, 10);
        light.position.set(0, 2, 0); // Position above the item
        itemGroup.add(light);
        
        // Create light beam cylinder - straight beam (same radius top and bottom) and 3x longer (12 units)
        const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, 12 * 3, 8, 1, true);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Create a separate group for the beam to keep it independent of item rotation
        const beamGroup = new THREE.Group();
        this.scene.add(beamGroup);
        
        // Set beam group position to match item position
        beamGroup.position.copy(itemGroup.position);
        
        // Create the beam and add it to the beam group
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(0, 6, 0); // Position higher above the item to accommodate the 3x longer beam (36 units)
        beamGroup.add(beam);
        
        // Store reference to light beam and its group
        this.lightBeams.set(item.id, {
            light: light,
            beam: beam,
            beamGroup: beamGroup,
            intensity: 1.0,
            itemPosition: itemGroup.position.clone() // Store initial position
        });
    }
    
    /**
     * Update all dropped items
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Update each dropped item
        for (const [id, itemData] of this.droppedItems.entries()) {
            // Skip processing if player is not available
            if (!this.game || !this.game.player) continue;
            
            const playerPosition = this.game.player.getPosition();
            const itemPosition = itemData.group.position;
            const distance = playerPosition.distanceTo(itemPosition);
            
            if (distance > 100) {
                // Dispose of model resources if available
                if (itemData.model && typeof itemData.model.dispose === 'function') {
                    itemData.model.dispose();
                }
                
                // Remove item group from scene
                if (itemData.group) {
                    this.scene.remove(itemData.group);
                }
                
                // Remove beam group from scene
                const lightBeam = this.lightBeams.get(id);
                if (lightBeam && lightBeam.beamGroup) {
                    this.scene.remove(lightBeam.beamGroup);
                }
                
                // Remove from maps
                this.droppedItems.delete(id);
                this.lightBeams.delete(id);
                
                // Skip to next item
                continue;
            }
            
            // Update item model animations
            if (itemData.model && typeof itemData.model.updateAnimations === 'function') {
                try {
                    itemData.model.updateAnimations(delta);
                } catch (error) {
                    console.warn(`Error updating animations for item ${id}:`, error);
                    // Continue with other updates even if animation fails
                }
            }
            
            // Make items float and rotate for better visibility
            const time = Date.now() * 0.001; // Convert to seconds
            const floatHeight = Math.sin(time * 2) * 0.1; // Gentle floating effect
            
            // Apply floating effect
            if (itemData.group) {
                // Store the base height if not already stored
                if (!itemData.baseHeight) {
                    itemData.baseHeight = itemData.group.position.y;
                }
                
                // Apply floating effect
                itemData.group.position.y = itemData.baseHeight + floatHeight;
                
                // Apply rotation effect
                itemData.group.rotation.y += delta * 1.0; // Rotate items slowly
            }
            
            // Update light beam effect
            if (this.lightBeams.has(id)) {
                const lightBeam = this.lightBeams.get(id);
                
                // Pulse the light
                const time = Date.now() * 0.001; // Convert to seconds
                const pulseIntensity = 0.7 + Math.sin(time * 2) * 0.3;
                
                lightBeam.light.intensity = pulseIntensity;
                
                // Update beam group position to follow the item's position (only y-axis for floating)
                if (lightBeam.beamGroup && itemData.group) {
                    // Keep x and z coordinates the same as the original position
                    lightBeam.beamGroup.position.x = lightBeam.itemPosition.x;
                    lightBeam.beamGroup.position.z = lightBeam.itemPosition.z;
                    
                    // Only update y position to match the floating item
                    lightBeam.beamGroup.position.y = itemData.group.position.y;
                    
                    // Ensure beam stays perfectly vertical (no rotation)
                    lightBeam.beamGroup.rotation.set(0, 0, 0);
                }
            }
            
            // Auto-pickup if player is close enough and item has been on the ground for the delay period
            const currentTime = Date.now();
            const itemDropTime = itemData.dropTime || 0;
            const timeOnGround = (currentTime - itemDropTime) / 1000; // Convert to seconds
            
            if (distance < 1.5 && timeOnGround >= this.autoPickupDelay) {
                this.pickupItem(id);
            }
            
            // Auto-remove item if it's been on the ground for too long
            if (timeOnGround >= this.autoRemoveDelay) {
                // Dispose of model resources if available
                if (itemData.model && typeof itemData.model.dispose === 'function') {
                    itemData.model.dispose();
                }
                
                // Remove item group from scene
                if (itemData.group) {
                    this.scene.remove(itemData.group);
                }
                
                // Remove beam group from scene
                const lightBeam = this.lightBeams.get(id);
                if (lightBeam && lightBeam.beamGroup) {
                    this.scene.remove(lightBeam.beamGroup);
                }
                
                // Remove from maps
                this.droppedItems.delete(id);
                this.lightBeams.delete(id);
                
                // Show notification if HUD is available
                if (this.game && this.game.hudManager) {
                    this.game.hudManager.showNotification(`${itemData.item.name} disappeared!`);
                }
                
                // Skip to next item since this one was removed
                continue;
            }
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
        
        // Remove beam group from scene
        const lightBeam = this.lightBeams.get(itemId);
        if (lightBeam && lightBeam.beamGroup) {
            this.scene.remove(lightBeam.beamGroup);
        }
        
        // Remove from maps
        this.droppedItems.delete(itemId);
        this.lightBeams.delete(itemId);
    }
    
    /**
     * Remove all dropped items
     */
    clear() {
        // Remove all items and beam groups from scene
        for (const [id, itemData] of this.droppedItems.entries()) {
            // Dispose of model resources if available
            if (itemData.model && typeof itemData.model.dispose === 'function') {
                itemData.model.dispose();
            }
            
            if (itemData.group) {
                this.scene.remove(itemData.group);
            }
            
            // Remove beam group
            const lightBeam = this.lightBeams.get(id);
            if (lightBeam && lightBeam.beamGroup) {
                this.scene.remove(lightBeam.beamGroup);
            }
        }
        
        // Clear maps
        this.droppedItems.clear();
        this.lightBeams.clear();
    }
    
    /**
     * Set the auto-remove delay for dropped items
     * @param {number} seconds - The delay in seconds before items are automatically removed
     */
    setAutoRemoveDelay(seconds) {
        if (typeof seconds === 'number' && seconds >= 0) {
            this.autoRemoveDelay = seconds;
        }
    }
    
    /**
     * Get the current auto-remove delay for dropped items
     * @returns {number} The delay in seconds
     */
    getAutoRemoveDelay() {
        return this.autoRemoveDelay;
    }
}