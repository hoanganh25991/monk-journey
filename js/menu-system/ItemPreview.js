/**
 * ItemPreview.js
 * Creates a preview of an item for the settings menu
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { updateAnimation } from '../utils/AnimationUtils.js';
import { ItemGenerator } from '../entities/items/ItemGenerator.js';
import { ItemModelFactory } from '../entities/items/models/ItemModelFactory.js';

export class ItemPreview {
    /**
     * Create a new item preview
     * @param {HTMLElement} container - The container element
     * @param {number} width - The width of the preview
     * @param {number} height - The height of the preview
     * @param {import('../game/Game.js').Game} game - The game instance
     */
    constructor(container, width = 300, height = 300, game = null) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.game = game;
        
        // Create an item generator
        this.itemGenerator = new ItemGenerator(game);
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.animationId = null;
        this.visible = true;
        this.animations = {};
        this.currentAnimation = null;
        this.currentItem = null;
        this.itemModels = new Map(); // Map to store item models
        
        // Create a wrapper to handle visibility
        this.wrapper = document.createElement('div');
        this.wrapper.style.width = `${width}px`;
        this.wrapper.style.height = `${height}px`;
        this.container.appendChild(this.wrapper);
        
        // Set up intersection observer to pause rendering when not visible
        this.setupVisibilityObserver();
        
        this.init();
    }
    
    /**
     * Set up visibility observer to pause rendering when not visible
     * @private
     */
    setupVisibilityObserver() {
        // For debugging - always set visible to true initially
        this.visible = true;
        
        // Create an intersection observer to detect when the preview is visible
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.debug('ItemPreview visibility changed:', entry.isIntersecting);
                this.visible = entry.isIntersecting;
                
                if (this.visible) {
                    // Resume animation when visible
                    if (!this.animationId) {
                        console.debug('ItemPreview: Resuming animation');
                        this.animate();
                    }
                } else {
                    // Pause animation when not visible
                    if (this.animationId) {
                        console.debug('ItemPreview: Pausing animation');
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            });
        }, {
            root: null, // Use viewport as root
            threshold: 0.1 // Trigger when at least 10% is visible
        });
        
        // Start observing the container
        this.observer.observe(this.wrapper);
        console.debug('ItemPreview: Visibility observer set up');
    }
    
    /**
     * Initialize the preview
     * @private
     */
    init() {
        console.debug('ItemPreview: Initializing with dimensions', this.width, this.height);
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x111111);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
            this.camera.position.set(0, 0, 1.5); // Zoomed in 5x closer (from 5 to 1)
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // Add renderer to wrapper
            this.wrapper.appendChild(this.renderer.domElement);
            console.debug('ItemPreview: Renderer added to wrapper');
            
            // Add orbit controls
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 1;
            this.controls.maxDistance = 10;
            this.controls.enablePan = true;
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 1.0;
            
            // Add lights
            this.addLights();
            
            // Add ground plane
            this.addGround();
            
            // Start animation loop
            console.debug('ItemPreview: Starting animation loop');
            this.animate();
        } catch (error) {
            console.error('ItemPreview: Error during initialization:', error);
        }
    }
    
    /**
     * Add lights to the scene
     * @private
     */
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        
        this.scene.add(directionalLight);
    }
    
    /**
     * Add ground plane to the scene
     * @private
     */
    addGround() {
        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Rotate and position the ground
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
    }
    
    /**
     * Load an item model
     * @param {Object} item - The item to load
     */
    loadItemModel(item) {
        console.debug('ItemPreview: Loading model for item', item ? item.name : 'unknown');
        
        // Remove existing model if any
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
        }
        
        // Clear any existing item models
        if (this.itemModels.size > 0) {
            for (const model of this.itemModels.values()) {
                const modelGroup = model.getModelGroup();
                this.scene.remove(modelGroup);
            }
            this.itemModels.clear();
        }
        
        // Reset mixer and animations
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        
        // Store the current item
        this.currentItem = item;
        
        // Check if item exists
        if (!item) {
            console.warn('ItemPreview: No item provided');
            this.createDefaultModel(null);
            return;
        }
        
        // Create a group for this item
        const modelGroup = new THREE.Group();
        modelGroup.name = `item-preview-${item.id || 'unknown'}`;
        
        // Create the appropriate model based on item type
        const itemModel = ItemModelFactory.createModel(item, modelGroup);
        
        // Apply rarity effects
        ItemModelFactory.applyRarityEffects(itemModel, item.rarity);
        
        // Add to scene
        this.scene.add(modelGroup);
        
        // Store reference
        this.itemModels.set(item.id || 'preview', itemModel);
        
        // Set as the current model
        this.model = modelGroup;
        
        // Center the model
        this.centerModel();
    }
    
    /**
     * Create a default model for when no item is provided
     * @param {Object} item - The item to create a default model for (can be null)
     * @private
     */
    createDefaultModel(item) {
        // Create a simple cube as a placeholder
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        
        // Create material based on item rarity or default to white
        let color = 0xCCCCCC; // Default gray
        if (item && item.rarity) {
            switch (item.rarity) {
                case 'common': color = 0xffffff; break;
                case 'uncommon': color = 0x1eff00; break;
                case 'rare': color = 0x0070dd; break;
                case 'epic': color = 0xa335ee; break;
                case 'legendary': color = 0xff8000; break;
                case 'mythic': color = 0xff0000; break;
            }
        }
        
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.5,
            metalness: 0.5
        });
        
        // Create mesh
        this.model = new THREE.Mesh(geometry, material);
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.model);
    }
    
    /**
     * Center the model in the scene and dynamically adjust camera
     * @private
     */
    centerModel() {
        if (!this.model) return;
        
        // Create a bounding box
        const box = new THREE.Box3().setFromObject(this.model);
        
        // Get the center of the bounding box
        const center = box.getCenter(new THREE.Vector3());
        
        // Move the model so its center is at the origin
        this.model.position.x = -center.x;
        this.model.position.z = -center.z;
        
        // Position the model so it's standing on the ground
        const size = box.getSize(new THREE.Vector3());
        this.model.position.y = -box.min.y;
        
        // Dynamically adjust camera position based on item dimensions
        this.adjustCameraForItem(size);
    }
    
    /**
     * Dynamically adjust camera position based on item dimensions
     * @param {THREE.Vector3} size - The size of the item's bounding box
     * @private
     */
    adjustCameraForItem(size) {
        // Get the maximum dimension of the item
        const maxDimension = Math.max(size.x, size.y, size.z);
        
        // Calculate the optimal distance based on item type and size
        let optimalDistance;
        
        // Check if we have an item type and subType to make specific adjustments
        if (this.currentItem && this.currentItem.type) {
            // First check the main type
            switch (this.currentItem.type.toLowerCase()) {
                case 'weapon':
                    // For weapons, check the subType
                    if (this.currentItem.subType) {
                        switch (this.currentItem.subType.toLowerCase()) {
                            case 'staff':
                            case 'spear':
                            case 'polearm':
                                // For long weapons, ensure the entire length is visible
                                // Use a more aggressive scaling factor for the y dimension (length)
                                optimalDistance = Math.max(2.0, size.y * 1.2 * 1.7);
                                
                                // Add extra distance for very long staffs
                                if (size.y > 3) {
                                    optimalDistance *= 1.2 * 1.7;
                                }
                                
                                console.debug('Staff adjustment: size.y =', size.y, 'optimalDistance =', optimalDistance);
                                break;
                                
                            case 'fist':
                                optimalDistance = Math.max(1.0, maxDimension);
                                break;
                            case 'sword':
                            case 'axe':
                            case 'mace':
                            case 'dagger':
                                // For handheld weapons
                                optimalDistance = Math.max(1.5, maxDimension * 1.0);
                                break;
                                
                            default:
                                // Default for other weapon types
                                optimalDistance = Math.max(1.5, maxDimension * 1.1);
                        }
                    } else {
                        // Generic weapon without subtype
                        optimalDistance = Math.max(1.5, maxDimension * 1.1);
                    }
                    break;
                    
                case 'armor':
                    // For armor, check the subType
                    if (this.currentItem.subType) {
                        switch (this.currentItem.subType.toLowerCase()) {
                            case 'helmet':
                            case 'robe':
                            case 'chest':
                            case 'shield':
                                // For armor pieces, ensure we can see the full item
                                optimalDistance = Math.max(1.5, maxDimension * 1.2 * 1.5);
                                break;
                                
                            default:
                                // Default for other armor types
                                optimalDistance = Math.max(1.5, maxDimension * 1.2 * 1.5);
                        }
                    } else {
                        // Generic armor without subtype
                        optimalDistance = Math.max(1.5, maxDimension * 1.2 * 1.5);
                    }
                    break;
                    
                case 'accessory':
                    // For accessories, check the subType
                    if (this.currentItem.subType) {
                        switch (this.currentItem.subType.toLowerCase()) {
                            case 'ring':
                            case 'amulet':
                            case 'trinket':
                                // For small items, zoom in closer but maintain minimum distance
                                optimalDistance = Math.max(1.2, maxDimension * 1.5);
                                break;
                                
                            default:
                                // Default for other accessory types
                                optimalDistance = Math.max(1.2, maxDimension * 1.5);
                        }
                    } else {
                        // Generic accessory without subtype
                        optimalDistance = Math.max(1.2, maxDimension * 1.5);
                    }
                    break;
                    
                default:
                    // Default calculation for any other item type
                    optimalDistance = Math.max(1.5, maxDimension * 1.1);
            }
        } else {
            // If no item type or no item, use a generic calculation
            optimalDistance = Math.max(1.5, maxDimension * 1.1);
        }
        
        // Add a margin to ensure the entire item is visible
        // Use a larger margin for longer items
        const isLongItem = this.currentItem && 
            this.currentItem.type?.toLowerCase() === 'weapon' && 
            ['staff', 'spear', 'polearm'].includes(this.currentItem.subType?.toLowerCase());
            
        if (isLongItem) {
            // Larger margin for staffs and other long items
            optimalDistance *= 1.4;
        } else {
            // Standard margin for other items
            optimalDistance *= 1.2;
        }
        
        // Clamp the distance to reasonable bounds
        // Allow greater maximum distance for long items
        const maxDistance = isLongItem ? 15 : 10;
        optimalDistance = Math.min(maxDistance, Math.max(1.0, optimalDistance));
        
        // Adjust field of view for long items
        if (isLongItem) {
            // Use a wider FOV for staffs and other long items to fit them better
            this.camera.fov = 55; // Wider FOV (default was 45)
        } else {
            // Reset to default FOV for other items
            this.camera.fov = 45;
        }
        
        // Set the camera position
        this.camera.position.set(0, 0, optimalDistance);
        this.camera.updateProjectionMatrix();
        
        console.debug('ItemPreview: Adjusted camera for item', 
            this.currentItem ? `${this.currentItem.name} (${this.currentItem.type})` : 'unknown',
            '- distance:', optimalDistance, 
            '- FOV:', this.camera.fov);
    }
    
    /**
     * Animation loop
     * @private
     */
    animate() {
        // Only continue animation if visible
        if (this.visible) {
            this.animationId = requestAnimationFrame(() => this.animate());
            
            // Update controls
            this.controls.update();
            
            // Update animations
            const delta = this.clock.getDelta();
            
            // Update item model animations
            for (const model of this.itemModels.values()) {
                model.updateAnimations(delta);
            }
            
            // Render scene
            try {
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                console.error('ItemPreview: Error rendering scene:', error);
            }
        } else {
            // If not visible, don't request another frame
            this.animationId = null;
        }
    }
    
    /**
     * Set the size of the preview
     * @param {number} width - The width of the preview
     * @param {number} height - The height of the preview
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        
        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height);
    }
    
    /**
     * Reset camera to optimal position for current item
     */
    resetCamera() {
        if (this.model) {
            // If we have a model, recalculate the optimal camera position
            const box = new THREE.Box3().setFromObject(this.model);
            const size = box.getSize(new THREE.Vector3());
            this.adjustCameraForItem(size);
        } else {
            // Default position if no model is loaded
            this.camera.position.set(0, 0, 1.5);
        }
        
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    /**
     * Toggle auto-rotation
     * @param {boolean} enabled - Whether auto-rotation should be enabled
     */
    setAutoRotation(enabled) {
        this.controls.autoRotate = enabled;
    }
    
    /**
     * Set auto-rotation speed
     * @param {number} speed - The auto-rotation speed
     */
    setAutoRotationSpeed(speed) {
        this.controls.autoRotateSpeed = speed;
    }
    
    /**
     * Force restart animation
     */
    forceRestartAnimation() {
        if (this.mixer && this.currentAnimation && this.animations[this.currentAnimation]) {
            this.animations[this.currentAnimation].reset().play();
        }
    }
    
    /**
     * Generate a random item using the ItemGenerator
     * @param {Object} options - Options for item generation
     * @returns {Object} - The generated item
     */
    generateRandomItem(options = {}) {
        if (!this.itemGenerator) {
            console.error('ItemPreview: ItemGenerator not initialized');
            return null;
        }
        
        // Generate the item using ItemGenerator
        // This will handle setting the model path in item.visual.model
        const item = this.itemGenerator.generateItem(options);
        
        // Load the item model
        this.loadItemModel(item);
        
        return item;
    }
    
    /**
     * Generate an item with specific properties
     * @param {string} type - Item type
     * @param {string} subType - Item subtype
     * @param {string} rarity - Item rarity
     * @param {number} level - Item level
     * @returns {Object} - The generated item
     */
    generateSpecificItem(type, subType, rarity, level = 1) {
        if (!this.itemGenerator) {
            console.error('ItemPreview: ItemGenerator not initialized');
            return null;
        }
        
        // Create options object for ItemGenerator
        const options = {
            type: type,
            subType: subType,
            rarity: rarity,
            level: level
        };
        
        return this.generateRandomItem(options);
    }
    
    /**
     * Get the current item
     * @returns {Object} - The current item
     */
    getCurrentItem() {
        return this.currentItem;
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Dispose of observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Dispose of controls
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Dispose of model
        if (this.model) {
            this.scene.remove(this.model);
            this.model.traverse((node) => {
                if (node.isMesh) {
                    node.geometry.dispose();
                    if (node.material.map) node.material.map.dispose();
                    node.material.dispose();
                }
            });
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        this.currentItem = null;
    }
}