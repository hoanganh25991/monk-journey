import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for dagger weapon type
 * Creates a sleek dagger with blade and handle
 */
export class DaggerModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create dagger blade (elongated pyramid)
        const bladeGeometry = new THREE.CylinderGeometry(0.01, 0.08, 0.6, 4);
        const bladeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xC0C0C0, // Silver
            roughness: 0.3,
            metalness: 0.9
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.2;
        blade.rotation.x = Math.PI; // Flip to have point up
        blade.castShadow = true;
        
        this.modelGroup.add(blade);
        
        // Create handle (cylinder)
        const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown for wooden handle
            roughness: 0.8,
            metalness: 0.2
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        handle.castShadow = true;
        
        this.modelGroup.add(handle);
        
        // Create guard (flattened box)
        const guardGeometry = new THREE.BoxGeometry(0.2, 0.03, 0.05);
        const guardMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xB87333, // Copper
            roughness: 0.4,
            metalness: 0.7
        });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.y = 0;
        guard.castShadow = true;
        
        this.modelGroup.add(guard);
        
        // Add decorative elements
        this.addDecorativeElements();
        
        // Position the dagger correctly
        this.modelGroup.rotation.x = Math.PI / 4; // Tilt
        this.modelGroup.rotation.y = Math.PI / 6; // Rotate slightly
        this.modelGroup.scale.set(0.8, 0.8, 0.8); // Scale down a bit
    }
    
    /**
     * Add decorative elements to the dagger
     */
    addDecorativeElements() {
        // Add pommel (small sphere at the end of handle)
        const pommelGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const pommelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xB87333, // Copper
            roughness: 0.4,
            metalness: 0.7
        });
        const pommel = new THREE.Mesh(pommelGeometry, pommelMaterial);
        pommel.position.y = -0.3;
        pommel.castShadow = true;
        
        this.modelGroup.add(pommel);
        
        // Add grip texture (rings around handle)
        const gripCount = 3;
        const gripMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2F4F4F, // Dark slate gray
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (let i = 0; i < gripCount; i++) {
            const gripGeometry = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
            const grip = new THREE.Mesh(gripGeometry, gripMaterial);
            
            // Position along the handle
            grip.position.y = -0.25 + (i * 0.1);
            grip.rotation.x = Math.PI / 2; // Orient correctly
            
            this.modelGroup.add(grip);
        }
        
        // Add blade edge highlight
        const edgeGeometry = new THREE.BoxGeometry(0.005, 0.55, 0.01);
        const edgeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, // White
            roughness: 0.1,
            metalness: 1.0
        });
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.position.set(0, 0.2, 0.04);
        
        this.modelGroup.add(edge);
    }
    
    updateAnimations(delta) {
        // Subtle gleaming effect on the blade
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Make the blade gleam
            const blade = this.modelGroup.children[0];
            if (blade && blade.material && blade.material.type === 'MeshStandardMaterial') {
                try {
                    // Vary the metalness slightly to create a gleaming effect
                    const newMetalness = 0.7 + Math.sin(time * 3) * 0.3;
                    if (blade.material.metalness !== newMetalness) {
                        blade.material.metalness = newMetalness;
                    }
                } catch (error) {
                    // Silently ignore material update errors to prevent WebGL issues
                    console.warn('Material update error in DaggerModel:', error.message);
                }
            }
            
            // Subtle rotation
            this.modelGroup.rotation.z = Math.sin(time * 0.5) * 0.05;
        }
    }
}