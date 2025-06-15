import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for ring accessory type
 * Creates a magical ring with gem and decorative elements
 */
export class RingModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create ring band
        const bandGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 32);
        const bandMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.2,
            metalness: 0.9
        });
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.rotation.x = Math.PI / 2;
        band.castShadow = true;
        
        this.modelGroup.add(band);
        
        // Create gem setting
        this.createGemSetting();
        
        // Add decorative elements
        this.addDecorativeElements();
        
        // Position the ring correctly
        this.modelGroup.scale.set(0.6, 0.6, 0.6); // Scale down
    }
    
    /**
     * Create gem setting on the ring
     */
    createGemSetting() {
        // Create main gem
        const gemGeometry = new THREE.OctahedronGeometry(0.15, 0);
        const gemMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8A2BE2, // Blue Violet
            roughness: 0.1,
            metalness: 0.8,
            emissive: 0x8A2BE2,
            emissiveIntensity: 0.4
        });
        const gem = new THREE.Mesh(gemGeometry, gemMaterial);
        gem.position.set(0, 0.2, 0);
        gem.castShadow = true;
        
        this.modelGroup.add(gem);
        
        // Create setting base
        const settingGeometry = new THREE.CylinderGeometry(0.18, 0.12, 0.08, 12);
        const settingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.3,
            metalness: 0.9
        });
        const setting = new THREE.Mesh(settingGeometry, settingMaterial);
        setting.position.set(0, 0.1, 0);
        setting.castShadow = true;
        
        this.modelGroup.add(setting);
        
        // Create prongs to hold the gem
        const prongCount = 6;
        for (let i = 0; i < prongCount; i++) {
            const prongGeometry = new THREE.CylinderGeometry(0.02, 0.015, 0.12, 6);
            const prong = new THREE.Mesh(prongGeometry, settingMaterial);
            
            // Position prongs around the gem
            const angle = (i / prongCount) * Math.PI * 2;
            prong.position.set(
                Math.sin(angle) * 0.16,
                0.15,
                Math.cos(angle) * 0.16
            );
            
            // Angle prongs slightly inward
            prong.rotation.x = Math.sin(angle) * 0.15;
            prong.rotation.z = Math.cos(angle) * 0.15;
            
            prong.castShadow = true;
            
            this.modelGroup.add(prong);
        }
    }
    
    /**
     * Add decorative elements to the ring
     */
    addDecorativeElements() {
        const decorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, // Gold
            roughness: 0.3,
            metalness: 0.9
        });
        
        // Add decorative band details
        const detailCount = 8;
        for (let i = 0; i < detailCount; i++) {
            const detailGeometry = new THREE.SphereGeometry(0.02, 8, 6);
            const detail = new THREE.Mesh(detailGeometry, decorMaterial);
            
            // Position details around the band
            const angle = (i / detailCount) * Math.PI * 2;
            detail.position.set(
                Math.sin(angle) * 0.25,
                0,
                Math.cos(angle) * 0.25
            );
            
            detail.castShadow = true;
            
            this.modelGroup.add(detail);
        }
        
        // Add small accent gems
        const accentCount = 4;
        const accentMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00CED1, // Dark Turquoise
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x00CED1,
            emissiveIntensity: 0.2
        });
        
        for (let i = 0; i < accentCount; i++) {
            const accentGeometry = new THREE.OctahedronGeometry(0.04, 0);
            const accent = new THREE.Mesh(accentGeometry, accentMaterial);
            
            // Position accent gems around the setting
            const angle = (i / accentCount) * Math.PI * 2 + Math.PI / 4;
            accent.position.set(
                Math.sin(angle) * 0.2,
                0.08,
                Math.cos(angle) * 0.2
            );
            
            accent.castShadow = true;
            
            this.modelGroup.add(accent);
        }
        
        // Add decorative engravings on the band
        this.createBandEngravings(decorMaterial);
    }
    
    /**
     * Create decorative engravings on the ring band
     */
    createBandEngravings(material) {
        const engravingCount = 12;
        
        for (let i = 0; i < engravingCount; i++) {
            const engravingGeometry = new THREE.BoxGeometry(0.02, 0.005, 0.03);
            const engraving = new THREE.Mesh(engravingGeometry, material);
            
            // Position engravings around the band
            const angle = (i / engravingCount) * Math.PI * 2;
            engraving.position.set(
                Math.sin(angle) * 0.28,
                0,
                Math.cos(angle) * 0.28
            );
            
            // Orient engravings radially
            engraving.rotation.y = angle;
            
            engraving.castShadow = true;
            
            this.modelGroup.add(engraving);
        }
    }
    
    updateAnimations(delta) {
        // Animations for the ring
        const time = Date.now() * 0.001; // Convert to seconds
        
        if (this.modelGroup) {
            // Make the main gem pulse
            const gem = this.modelGroup.children[1]; // Main gem
            if (gem && gem.material) {
                gem.material.emissiveIntensity = 0.4 + Math.sin(time * 1.5) * 0.2;
                
                // Subtle rotation of the gem
                gem.rotation.y += delta * 0.8;
                gem.rotation.x += delta * 0.3;
            }
            
            // Make the accent gems pulse out of sync
            for (let i = 0; i < 4; i++) {
                const accentIndex = 10 + i; // Accent gems start after band details
                const accent = this.modelGroup.children[accentIndex];
                if (accent && accent.material) {
                    accent.material.emissiveIntensity = 0.2 + Math.sin(time * 2 + i * 0.5) * 0.15;
                }
            }
            
            // Gentle rotation of the entire ring
            this.modelGroup.rotation.y += delta * 0.2;
            
            // Subtle floating animation
            this.modelGroup.position.y = Math.sin(time * 0.5) * 0.02;
        }
    }
}