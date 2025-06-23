import * as THREE from 'three';

/**
 * Represents a treasure chest interactive object
 */
export class TreasureChest {
    /**
     * Create a new treasure chest
     */
    constructor() {
        this.isOpen = false;
        this.lid = null;
    }
    
    /**
     * Create the treasure chest mesh
     * @returns {THREE.Group} - The treasure chest group
     */
    createMesh() {
        const chestGroup = new THREE.Group();
        
        // Create chest base
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const baseGeometry = new THREE.BoxGeometry(1.5, 1, 1);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        
        chestGroup.add(base);
        
        // Create chest lid
        const lidGeometry = new THREE.BoxGeometry(1.5, 0.5, 1);
        const lid = new THREE.Mesh(lidGeometry, baseMaterial);
        lid.position.y = 1.25;
        lid.castShadow = true;
        lid.receiveShadow = true;
        
        chestGroup.add(lid);
        this.lid = lid;
        
        // Create metal details
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x996600,
            emissiveIntensity: 0.3
        });
        
        // Create lock
        const lockGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        const lock = new THREE.Mesh(lockGeometry, metalMaterial);
        lock.position.set(0, 1, 0.55);
        
        chestGroup.add(lock);
        
        // Add a subtle glow effect to make it more noticeable
        this.addGlowEffect(chestGroup);
        
        // Add floating "Click Me" indicator
        this.addInteractionIndicator(chestGroup);
        
        return chestGroup;
    }
    
    /**
     * Add a subtle glow effect to the chest
     * @param {THREE.Group} chestGroup - The chest group to add the glow to
     */
    addGlowEffect(chestGroup) {
        // Create a slightly larger, transparent version of the chest for the glow
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        // Create glow for base
        const baseGlowGeometry = new THREE.BoxGeometry(1.7, 1.2, 1.2);
        const baseGlow = new THREE.Mesh(baseGlowGeometry, glowMaterial);
        baseGlow.position.y = 0.5;
        
        // Create glow for lid
        const lidGlowGeometry = new THREE.BoxGeometry(1.7, 0.7, 1.2);
        const lidGlow = new THREE.Mesh(lidGlowGeometry, glowMaterial);
        lidGlow.position.y = 1.25;
        
        // Add glows to a separate group
        const glowGroup = new THREE.Group();
        glowGroup.add(baseGlow);
        glowGroup.add(lidGlow);
        
        // Add the glow group to the chest group
        chestGroup.add(glowGroup);
        
        // Animate the glow
        this.animateGlow(glowGroup);
    }
    
    /**
     * Animate the glow effect
     * @param {THREE.Group} glowGroup - The glow group to animate
     */
    animateGlow(glowGroup) {
        // Create a simple pulse animation
        const pulseAnimation = () => {
            // Skip if the chest is open
            if (this.isOpen) return;
            
            // Pulse the scale of the glow
            const time = Date.now() * 0.001; // Convert to seconds
            const scale = 1 + 0.1 * Math.sin(time * 2); // Pulse between 0.9 and 1.1
            
            glowGroup.scale.set(scale, scale, scale);
            
            // Continue animation
            requestAnimationFrame(pulseAnimation);
        };
        
        // Start the animation
        pulseAnimation();
    }
    
    /**
     * Add a floating indicator to show the chest is interactive
     * @param {THREE.Group} chestGroup - The chest group to add the indicator to
     */
    addInteractionIndicator(chestGroup) {
        // Create a sprite for the indicator
        const indicatorMaterial = new THREE.SpriteMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const indicator = new THREE.Sprite(indicatorMaterial);
        indicator.position.set(0, 2.5, 0); // Position above the chest
        indicator.scale.set(0.5, 0.5, 0.5);
        
        // Add the indicator to the chest group
        chestGroup.add(indicator);
        
        // Animate the indicator
        this.animateIndicator(indicator);
    }
    
    /**
     * Animate the interaction indicator
     * @param {THREE.Sprite} indicator - The indicator to animate
     */
    animateIndicator(indicator) {
        // Create a simple floating animation
        const floatAnimation = () => {
            // Skip if the chest is open
            if (this.isOpen) {
                indicator.visible = false;
                return;
            }
            
            // Make the indicator float up and down
            const time = Date.now() * 0.001; // Convert to seconds
            indicator.position.y = 2.5 + 0.1 * Math.sin(time * 3); // Float between 2.4 and 2.6
            
            // Continue animation
            requestAnimationFrame(floatAnimation);
        };
        
        // Start the animation
        floatAnimation();
    }
    
    /**
     * Open the chest
     * @param {THREE.Group} chestGroup - The chest group to open (optional)
     */
    open(chestGroup) {
        // If a chest group is provided, find the lid
        if (chestGroup) {
            // Find the lid (second child)
            if (chestGroup.children.length > 1) {
                this.lid = chestGroup.children[1];
            }
        }
        
        // Rotate lid to open
        if (this.lid) {
            this.lid.rotation.x = -Math.PI / 3;
        }
        
        this.isOpen = true;
    }
}