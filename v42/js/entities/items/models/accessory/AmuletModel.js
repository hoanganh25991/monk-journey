import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for amulet accessory type
 * Creates a magical pendant on a chain
 */
export class AmuletModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create pendant (main gem)
        const pendantGeometry = new THREE.OctahedronGeometry(0.2, 0);
        const pendantMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4B0082, // Indigo
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x4B0082,
            emissiveIntensity: 0.5
        });
        const pendant = new THREE.Mesh(pendantGeometry, pendantMaterial);
        pendant.position.y = 0;
        pendant.castShadow = true;
        
        this.modelGroup.add(pendant);
        
        // Create setting/frame around pendant
        this.createPendantSetting(pendant);
        
        // Create chain
        this.createChain();
        
        // Add decorative elements
        this.addDecorativeElements();
        
        // Position the amulet correctly
        this.modelGroup.scale.set(0.5, 0.5, 0.5); // Scale down
    }
    
    /**
     * Create setting/frame around the pendant
     */
    createPendantSetting(pendant) {
        const settingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.3,
            metalness: 0.9
        });
        
        // Create prongs to hold the gem
        const prongCount = 4;
        for (let i = 0; i < prongCount; i++) {
            const prongGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.15, 8);
            const prong = new THREE.Mesh(prongGeometry, settingMaterial);
            
            // Position prongs around the pendant
            const angle = (i / prongCount) * Math.PI * 2;
            prong.position.set(
                Math.sin(angle) * 0.2,
                Math.cos(angle) * 0.2,
                0
            );
            
            // Orient prongs to point toward pendant center
            prong.lookAt(new THREE.Vector3(0, 0, 0));
            prong.rotateX(Math.PI / 2);
            
            prong.castShadow = true;
            
            this.modelGroup.add(prong);
        }
        
        // Create decorative rim
        const rimGeometry = new THREE.TorusGeometry(0.22, 0.02, 8, 24);
        const rim = new THREE.Mesh(rimGeometry, settingMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.castShadow = true;
        
        this.modelGroup.add(rim);
    }
    
    /**
     * Create chain for the amulet
     */
    createChain() {
        const chainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.3,
            metalness: 0.9
        });
        
        // Create chain links
        const linkCount = 8;
        const linkRadius = 0.05;
        
        for (let i = 0; i < linkCount; i++) {
            const linkGeometry = new THREE.TorusGeometry(linkRadius, 0.01, 8, 16);
            const link = new THREE.Mesh(linkGeometry, chainMaterial);
            
            // Position links in a semicircle above the pendant
            const angle = (i / (linkCount - 1)) * Math.PI;
            link.position.set(
                Math.sin(angle) * 0.3,
                Math.cos(angle) * 0.3 + 0.3,
                0
            );
            
            // Alternate link orientations
            if (i % 2 === 0) {
                link.rotation.y = Math.PI / 2;
            } else {
                link.rotation.x = Math.PI / 2;
            }
            
            link.castShadow = true;
            
            this.modelGroup.add(link);
        }
    }
    
    /**
     * Add decorative elements to the amulet
     */
    addDecorativeElements() {
        // Add small secondary gems
        const gemCount = 3;
        const gemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00FFFF, // Cyan
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x00FFFF,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < gemCount; i++) {
            const gemGeometry = new THREE.OctahedronGeometry(0.05, 0);
            const gem = new THREE.Mesh(gemGeometry, gemMaterial);
            
            // Position gems around the pendant
            const angle = (i / gemCount) * Math.PI * 2;
            gem.position.set(
                Math.sin(angle) * 0.3,
                Math.cos(angle) * 0.3,
                0.05
            );
            
            gem.castShadow = true;
            
            this.modelGroup.add(gem);
        }
        
        // Add a decorative bail (connector between pendant and chain)
        const bailGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
        const bailMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.3,
            metalness: 0.9
        });
        const bail = new THREE.Mesh(bailGeometry, bailMaterial);
        bail.position.set(0, 0.3, 0);
        bail.rotation.x = Math.PI / 2;
        bail.castShadow = true;
        
        this.modelGroup.add(bail);
    }
    
    updateAnimations(delta) {
        // Animations for the amulet
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Make the pendant pulse
            const pendant = this.modelGroup.children[0];
            if (pendant && pendant.material) {
                pendant.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3;
                
                // Subtle rotation of the pendant
                pendant.rotation.y += delta * 0.5;
            }
            
            // Make the secondary gems pulse out of sync
            for (let i = 0; i < 3; i++) {
                const gem = this.modelGroup.children[6 + i]; // Secondary gems
                if (gem && gem.material) {
                    gem.material.emissiveIntensity = 0.3 + Math.sin(time * 2 + i) * 0.2;
                }
            }
            
            // Gentle swaying of the entire amulet
            this.modelGroup.rotation.z = Math.sin(time * 0.7) * 0.1;
        }
    }
}