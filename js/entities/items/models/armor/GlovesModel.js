import { ItemModel } from '../ItemModel.js';
import * as THREE from 'three';

/**
 * Model class for gloves items
 * Creates a 3D representation of gloves/gauntlets
 */
export class GlovesModel extends ItemModel {
    /**
     * Create a new gloves model
     * @param {Item} item - The gloves item
     * @param {THREE.Group} modelGroup - Optional group to add the model to
     */
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createGlovesModel();
    }
    
    /**
     * Create the 3D model for gloves
     */
    createGlovesModel() {
        // Create materials based on item rarity/tier
        const material = this.createBaseMaterial();
        
        // Create left glove
        const leftGlove = this.createSingleGlove(material, -0.3);
        this.modelGroup.add(leftGlove);
        
        // Create right glove
        const rightGlove = this.createSingleGlove(material, 0.3);
        this.modelGroup.add(rightGlove);
        
        // Add accent details if higher tier
        if (this.item.rarity !== 'common') {
            this.addGloveDetails();
        }
        
        // Scale based on item properties
        this.applyItemScale();
    }
    
    /**
     * Create a single glove
     * @param {THREE.Material} material - The material to use
     * @param {number} xOffset - X position offset for left/right positioning
     * @returns {THREE.Group} The glove model group
     */
    createSingleGlove(material, xOffset) {
        const gloveGroup = new THREE.Group();
        
        // Main hand/palm part
        const palmGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.4);
        const palmMesh = new THREE.Mesh(palmGeometry, material);
        palmMesh.position.set(xOffset, 0, 0);
        gloveGroup.add(palmMesh);
        
        // Fingers (simplified as small boxes)
        for (let i = 0; i < 4; i++) {
            const fingerGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.15);
            const fingerMesh = new THREE.Mesh(fingerGeometry, material);
            fingerMesh.position.set(
                xOffset + (i - 1.5) * 0.05,
                0.08,
                0.15
            );
            gloveGroup.add(fingerMesh);
        }
        
        // Thumb
        const thumbGeometry = new THREE.BoxGeometry(0.04, 0.12, 0.04);
        const thumbMesh = new THREE.Mesh(thumbGeometry, material);
        thumbMesh.position.set(
            xOffset + (xOffset > 0 ? 0.15 : -0.15),
            0.02,
            0.05
        );
        gloveGroup.add(thumbMesh);
        
        // Wrist guard/cuff
        const cuffGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.08, 8);
        const cuffMesh = new THREE.Mesh(cuffGeometry, material);
        cuffMesh.position.set(xOffset, -0.1, -0.15);
        gloveGroup.add(cuffMesh);
        
        return gloveGroup;
    }
    
    /**
     * Add decorative details for higher tier gloves
     */
    addGloveDetails() {
        // Add metallic accents for rare+ items
        const accentMaterial = new THREE.MeshPhongMaterial({ 
            color: this.getAccentColor(),
            shininess: 100
        });
        
        // Add knuckle plates
        for (let side = 0; side < 2; side++) {
            const xOffset = side === 0 ? -0.3 : 0.3;
            
            for (let i = 0; i < 4; i++) {
                const plateGeometry = new THREE.BoxGeometry(0.05, 0.02, 0.06);
                const plateMesh = new THREE.Mesh(plateGeometry, accentMaterial);
                plateMesh.position.set(
                    xOffset + (i - 1.5) * 0.05,
                    0.09,
                    0.08
                );
                this.modelGroup.add(plateMesh);
            }
        }
    }
    
    /**
     * Get accent color based on item rarity
     * @returns {number} Hex color value
     */
    getAccentColor() {
        const rarityColors = {
            uncommon: 0x00AA00,
            rare: 0x0066CC,
            epic: 0x9933CC,
            legendary: 0xFF6600,
            mythic: 0xFF0000
        };
        
        return rarityColors[this.item.rarity] || 0x666666;
    }
    
    /**
     * Create base material for the gloves
     * @returns {THREE.Material} The created material
     */
    createBaseMaterial() {
        // Base colors for different tiers
        const baseColors = {
            common: 0x8B4513,     // Brown leather
            uncommon: 0x654321,   // Dark brown
            rare: 0x2F4F4F,       // Dark slate gray
            epic: 0x4B0082,       // Indigo
            legendary: 0x8B0000,  // Dark red
            mythic: 0x191970      // Midnight blue
        };
        
        const color = baseColors[this.item.rarity] || baseColors.common;
        
        return new THREE.MeshPhongMaterial({
            color: color,
            shininess: this.item.rarity === 'common' ? 10 : 50
        });
    }
    
    /**
     * Apply scaling based on item properties
     */
    applyItemScale() {
        // Scale slightly based on tier
        const scaleMultipliers = {
            common: 0.9,
            uncommon: 1.0,
            rare: 1.1,
            epic: 1.15,
            legendary: 1.2,
            mythic: 1.25
        };
        
        const scale = scaleMultipliers[this.item.rarity] || 1.0;
        this.modelGroup.scale.setScalar(scale);
    }
}