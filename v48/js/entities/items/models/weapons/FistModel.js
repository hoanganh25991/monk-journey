import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for fist weapon type
 * Creates a knuckle-duster style weapon
 */
export class FistModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create base structure (curved bar)
        const baseGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x696969, // Dim gray
            roughness: 0.5,
            metalness: 0.7
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = Math.PI / 2; // Orient correctly
        base.rotation.y = Math.PI; // Rotate to face forward
        base.castShadow = true;
        
        this.modelGroup.add(base);
        
        // Create finger loops
        this.createFingerLoops();
        
        // Create striking surface (spikes or blunt surface)
        this.createStrikingSurface();
        
        // Add decorative elements
        this.addDecorativeElements();
        
        // Position the fist weapon correctly
        this.modelGroup.rotation.x = Math.PI / 6; // Tilt slightly
        this.modelGroup.rotation.z = Math.PI / 4; // Rotate to be at an angle
        this.modelGroup.scale.set(0.7, 0.7, 0.7); // Scale down a bit
    }
    
    /**
     * Create finger loops for the fist weapon
     */
    createFingerLoops() {
        const loopCount = 4;
        const loopMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x696969, // Dim gray
            roughness: 0.5,
            metalness: 0.7
        });
        
        for (let i = 0; i < loopCount; i++) {
            const loopGeometry = new THREE.TorusGeometry(0.03, 0.01, 8, 16);
            const loop = new THREE.Mesh(loopGeometry, loopMaterial);
            
            // Position loops along the base
            const angle = (i / (loopCount - 1)) * Math.PI;
            loop.position.set(
                Math.sin(angle) * 0.15,
                0,
                Math.cos(angle) * 0.15 - 0.15
            );
            
            loop.rotation.x = Math.PI / 2; // Orient correctly
            loop.castShadow = true;
            
            this.modelGroup.add(loop);
        }
    }
    
    /**
     * Create striking surface for the fist weapon
     */
    createStrikingSurface() {
        // Create spikes on the front
        const spikeCount = 4;
        const spikeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA9A9A9, // Dark gray
            roughness: 0.3,
            metalness: 0.9
        });
        
        for (let i = 0; i < spikeCount; i++) {
            const spikeGeometry = new THREE.ConeGeometry(0.02, 0.08, 4);
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Position spikes along the front of the base
            const offset = (i - (spikeCount - 1) / 2) * 0.07;
            spike.position.set(offset, 0.03, 0);
            
            spike.rotation.x = -Math.PI / 2; // Point forward
            spike.castShadow = true;
            
            this.modelGroup.add(spike);
        }
        
        // Create a reinforced plate
        const plateGeometry = new THREE.BoxGeometry(0.3, 0.06, 0.02);
        const plateMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080, // Gray
            roughness: 0.4,
            metalness: 0.8
        });
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.position.set(0, 0.01, 0);
        plate.castShadow = true;
        
        this.modelGroup.add(plate);
    }
    
    /**
     * Add decorative elements to the fist weapon
     */
    addDecorativeElements() {
        // Add small gems or studs
        const gemCount = 3;
        const gemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, // Dark red
            roughness: 0.2,
            metalness: 0.9,
            emissive: 0x8B0000,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < gemCount; i++) {
            const gemGeometry = new THREE.OctahedronGeometry(0.02, 0);
            const gem = new THREE.Mesh(gemGeometry, gemMaterial);
            
            // Position gems along the top of the base
            const offset = (i - (gemCount - 1) / 2) * 0.1;
            gem.position.set(offset, 0.04, -0.15);
            
            gem.castShadow = true;
            
            this.modelGroup.add(gem);
        }
        
        // Add a small chain
        const chainLinkCount = 3;
        const chainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xC0C0C0, // Silver
            roughness: 0.4,
            metalness: 0.8
        });
        
        let prevLink = null;
        for (let i = 0; i < chainLinkCount; i++) {
            const linkGeometry = new THREE.TorusGeometry(0.02, 0.005, 8, 16);
            const link = new THREE.Mesh(linkGeometry, chainMaterial);
            
            // Position chain links hanging from the bottom
            link.position.set(
                -0.15,
                -0.03 - (i * 0.04),
                -0.15
            );
            
            // Alternate the rotation of links
            if (i % 2 === 0) {
                link.rotation.x = Math.PI / 2;
            } else {
                link.rotation.z = Math.PI / 2;
            }
            
            link.castShadow = true;
            
            this.modelGroup.add(link);
            prevLink = link;
        }
    }
    
    updateAnimations(delta) {
        // Subtle animations for the fist weapon
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Make the gems pulse
            for (let i = 0; i < 3; i++) {
                const gem = this.modelGroup.children[6 + i]; // Gems start at index 6
                if (gem && gem.material) {
                    gem.material.emissiveIntensity = 0.3 + Math.sin(time * 2 + i) * 0.2;
                }
            }
            
            // Animate the chain links
            for (let i = 0; i < 3; i++) {
                const link = this.modelGroup.children[9 + i]; // Chain links start at index 9
                if (link) {
                    link.position.x = -0.15 + Math.sin(time * 2 + i * 0.5) * 0.02;
                }
            }
            
            // Subtle rotation
            this.modelGroup.rotation.z = Math.PI / 4 + Math.sin(time * 0.5) * 0.05;
        }
    }
}