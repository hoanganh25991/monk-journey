import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for staff weapon type
 * Creates a magical staff with a glowing orb
 */
export class StaffModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create staff handle (long cylinder)
        const handleGeometry = new THREE.CylinderGeometry(0.03, 0.05, 1.5, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown for wooden staff
            roughness: 0.8,
            metalness: 0.2
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = 0;
        handle.castShadow = true;
        
        // Add some texture to the handle by deforming slightly
        const positionAttribute = handle.geometry.getAttribute('position');
        const positions = positionAttribute.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Only modify x and z to keep the staff straight
            positions[i] += (Math.random() - 0.5) * 0.01;     // x
            positions[i + 2] += (Math.random() - 0.5) * 0.01; // z
        }
        
        positionAttribute.needsUpdate = true;
        
        this.modelGroup.add(handle);
        
        // Create orb at the top (sphere)
        const orbGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4169E1, // Royal blue for magical orb
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x4169E1,
            emissiveIntensity: 0.5
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.y = 0.8;
        orb.castShadow = true;
        
        this.modelGroup.add(orb);
        
        // Add decorative elements to the staff
        this.addDecorativeElements(handle);
        
        // Position the staff correctly
        this.modelGroup.rotation.x = Math.PI / 6; // Tilt slightly
        this.modelGroup.position.y = -0.5; // Lower to be held properly
    }
    
    /**
     * Add decorative elements to the staff
     */
    addDecorativeElements(handle) {
        // Add wrappings around the handle
        const wrappingCount = 5;
        const wrappingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.3,
            metalness: 0.8
        });
        
        for (let i = 0; i < wrappingCount; i++) {
            const wrappingGeometry = new THREE.TorusGeometry(0.06, 0.01, 8, 16);
            const wrapping = new THREE.Mesh(wrappingGeometry, wrappingMaterial);
            
            // Position along the staff
            wrapping.position.y = -0.6 + (i * 0.3);
            wrapping.rotation.x = Math.PI / 2; // Orient correctly
            
            this.modelGroup.add(wrapping);
        }
        
        // Add a small crystal near the top
        const crystalGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
        const crystalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF69B4, // Hot pink
            roughness: 0.2,
            metalness: 0.9,
            emissive: 0xFF69B4,
            emissiveIntensity: 0.3
        });
        
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(0.1, 0.6, 0);
        crystal.rotation.z = -Math.PI / 4; // Angle outward
        
        this.modelGroup.add(crystal);
    }
    
    updateAnimations(delta) {
        // Make the orb pulse and rotate
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Pulse the orb
            const orb = this.modelGroup.children[1];
            if (orb) {
                orb.scale.set(
                    1 + Math.sin(time * 2) * 0.1,
                    1 + Math.sin(time * 2) * 0.1,
                    1 + Math.sin(time * 2) * 0.1
                );
                
                // Adjust emissive intensity
                if (orb.material) {
                    orb.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.2;
                }
            }
            
            // Subtle rotation of the entire staff
            this.modelGroup.rotation.z = Math.sin(time * 0.5) * 0.05;
        }
    }
}