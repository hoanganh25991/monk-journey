import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for potion consumable type
 * Creates a magical potion bottle with liquid inside
 */
export class PotionModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create bottle (combined cylinder and cone)
        const bottleGroup = new THREE.Group();
        
        // Bottle body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12);
        const glassMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE6E6FA, // Lavender
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, glassMaterial);
        body.position.y = 0;
        body.castShadow = true;
        
        bottleGroup.add(body);
        
        // Bottle neck (cylinder)
        const neckGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.15, 12);
        const neck = new THREE.Mesh(neckGeometry, glassMaterial);
        neck.position.y = 0.225;
        neck.castShadow = true;
        
        bottleGroup.add(neck);
        
        // Bottle top (small cylinder)
        const topGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12);
        const corkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            roughness: 0.9,
            metalness: 0.1
        });
        const top = new THREE.Mesh(topGeometry, corkMaterial);
        top.position.y = 0.325;
        top.castShadow = true;
        
        bottleGroup.add(top);
        
        this.modelGroup.add(bottleGroup);
        
        // Create liquid inside
        this.createLiquid();
        
        // Add decorative elements
        this.addDecorativeElements();
        
        // Position the potion correctly
        this.modelGroup.scale.set(0.7, 0.7, 0.7); // Scale down
    }
    
    /**
     * Create liquid inside the bottle
     */
    createLiquid() {
        // Determine potion color based on item properties
        // Default to healing red if no specific type
        const potionColor = 0xFF0000; // Red for healing
        
        // Create liquid (slightly smaller cylinder than bottle)
        const liquidGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.25, 12);
        const liquidMaterial = new THREE.MeshStandardMaterial({ 
            color: potionColor,
            roughness: 0.3,
            metalness: 0.7,
            transparent: true,
            opacity: 0.8,
            emissive: potionColor,
            emissiveIntensity: 0.3
        });
        const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
        liquid.position.y = -0.025; // Slightly lower than bottle center
        
        this.modelGroup.add(liquid);
    }
    
    /**
     * Add decorative elements to the potion
     */
    addDecorativeElements() {
        // Add label
        const labelGeometry = new THREE.PlaneGeometry(0.2, 0.15);
        const labelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFF8DC, // Cornsilk
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 0, 0.16);
        label.castShadow = false;
        
        this.modelGroup.add(label);
        
        // Add symbol on label (simple cross for healing)
        const symbolGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.01);
        const symbolMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, // Dark red
            roughness: 0.5,
            metalness: 0.5
        });
        const symbolHorizontal = new THREE.Mesh(symbolGeometry, symbolMaterial);
        symbolHorizontal.position.set(0, 0, 0.17);
        
        this.modelGroup.add(symbolHorizontal);
        
        const symbolVertical = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.08, 0.01),
            symbolMaterial
        );
        symbolVertical.position.set(0, 0, 0.17);
        
        this.modelGroup.add(symbolVertical);
        
        // Add small bubbles inside liquid
        const bubbleCount = 5;
        const bubbleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < bubbleCount; i++) {
            const size = 0.02 + Math.random() * 0.02;
            const bubbleGeometry = new THREE.SphereGeometry(size, 8, 8);
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            
            // Random position inside the liquid
            bubble.position.set(
                (Math.random() - 0.5) * 0.2,
                -0.1 + Math.random() * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            this.modelGroup.add(bubble);
        }
    }
    
    updateAnimations(delta) {
        // Animations for the potion
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Make the liquid glow pulse
            const liquid = this.modelGroup.children[1]; // Liquid
            if (liquid && liquid.material && liquid.material.type === 'MeshStandardMaterial') {
                try {
                    const newIntensity = 0.3 + Math.sin(time * 1.5) * 0.2;
                    if (liquid.material.emissiveIntensity !== newIntensity) {
                        liquid.material.emissiveIntensity = newIntensity;
                    }
                } catch (error) {
                    // Silently ignore material update errors to prevent WebGL issues
                    console.warn('Material update error in PotionModel:', error.message);
                }
            }
            
            // Animate bubbles rising
            for (let i = 0; i < 5; i++) {
                const bubble = this.modelGroup.children[5 + i]; // Bubbles start at index 5
                if (bubble) {
                    // Move bubbles upward
                    bubble.position.y += delta * 0.1;
                    
                    // Add slight horizontal movement
                    bubble.position.x += Math.sin(time * 2 + i) * delta * 0.05;
                    
                    // Reset bubble position when it reaches the top
                    if (bubble.position.y > 0.1) {
                        bubble.position.y = -0.1;
                        bubble.position.x = (Math.random() - 0.5) * 0.2;
                        bubble.position.z = (Math.random() - 0.5) * 0.2;
                    }
                }
            }
            
            // Gentle rotation of the entire potion
            this.modelGroup.rotation.y += delta * 0.3;
        }
    }
}