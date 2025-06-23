import * as THREE from 'three';

/**
 * Base class for all item models
 * Provides common functionality for creating and managing item models
 */
export class ItemModel {
    /**
     * Create a new item model
     * @param {Item} item - The item this model represents
     * @param {THREE.Group} modelGroup - The group to add this model to
     */
    constructor(item, modelGroup) {
        this.item = item;
        this.modelGroup = modelGroup || new THREE.Group();
        this.modelGroup.name = `item-${item.id}`;
    }
    
    /**
     * Create the 3D model for this item
     * Should be implemented by subclasses
     */
    createModel() {
        // Base implementation creates a placeholder cube
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.7,
            metalness: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.modelGroup.add(mesh);
    }
    
    /**
     * Update animations for this item
     * @param {number} delta - Time since last update in seconds
     */
    updateAnimations(delta) {
        // Base implementation does simple rotation
        if (this.modelGroup) {
            this.modelGroup.rotation.y += delta * 0.5;
        }
    }
    
    /**
     * Get the model group
     * @returns {THREE.Group} The model group
     */
    getModelGroup() {
        return this.modelGroup;
    }
    
    /**
     * Apply a material to all meshes in the model
     * @param {THREE.Material} material - The material to apply
     */
    applyMaterial(material) {
        this.modelGroup.traverse(child => {
            if (child.isMesh) {
                child.material = material;
            }
        });
    }
    
    /**
     * Apply a color to all meshes in the model
     * @param {number} color - The color to apply
     */
    applyColor(color) {
        this.modelGroup.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.color.set(color);
            }
        });
    }
    
    /**
     * Create a glowing effect for the item
     * @param {number} color - The glow color
     * @param {number} intensity - The glow intensity
     */
    addGlowEffect(color, intensity = 0.5) {
        this.modelGroup.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.emissive = new THREE.Color(color);
                child.material.emissiveIntensity = intensity;
            }
        });
    }
}