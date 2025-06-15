import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for talisman accessory type
 * Creates a mystical charm with runic symbols
 */
export class TalismanModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create main talisman body (hexagonal stone)
        const talismanGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 6);
        const talismanMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2F4F4F, // Dark slate gray
            roughness: 0.4,
            metalness: 0.3,
            emissive: 0x4B0082,
            emissiveIntensity: 0.2
        });
        const talisman = new THREE.Mesh(talismanGeometry, talismanMaterial);
        talisman.position.y = 0;
        talisman.castShadow = true;
        
        this.modelGroup.add(talisman);
        
        // Create runic symbols
        this.createRunicSymbols();
        
        // Create metal binding
        this.createMetalBinding();
        
        // Create attachment point
        this.createAttachmentPoint();
        
        // Create mystical aura
        this.createMysticalAura();
        
        // Add decorative crystals
        this.addDecorativeCrystals();
        
        // Position the talisman correctly
        this.modelGroup.scale.set(0.6, 0.6, 0.6); // Scale down appropriately
    }
    
    /**
     * Create runic symbols on the talisman surface
     */
    createRunicSymbols() {
        const runeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700, // Gold
            emissive: 0xFFD700,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.9
        });
        
        // Create central rune (star pattern)
        const centralRuneGeometry = new THREE.RingGeometry(0.08, 0.12, 5);
        const centralRune = new THREE.Mesh(centralRuneGeometry, runeMaterial);
        centralRune.position.set(0, 0.03, 0);
        centralRune.rotation.x = -Math.PI / 2;
        
        this.modelGroup.add(centralRune);
        
        // Create smaller runes around the edge
        const smallRuneGeometry = new THREE.RingGeometry(0.02, 0.04, 3);
        const runeCount = 6;
        
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const smallRune = new THREE.Mesh(smallRuneGeometry, runeMaterial);
            
            smallRune.position.set(
                Math.sin(angle) * 0.18,
                0.03,
                Math.cos(angle) * 0.18
            );
            smallRune.rotation.x = -Math.PI / 2;
            smallRune.rotation.z = angle;
            
            this.modelGroup.add(smallRune);
        }
        
        // Create linear runes (ancient script)
        const lineRuneGeometry = new THREE.BoxGeometry(0.03, 0.001, 0.08);
        
        for (let i = 0; i < 3; i++) {
            const lineRune = new THREE.Mesh(lineRuneGeometry, runeMaterial);
            const angle = (i / 3) * Math.PI * 2;
            
            lineRune.position.set(
                Math.sin(angle) * 0.15,
                0.03,
                Math.cos(angle) * 0.15
            );
            lineRune.rotation.y = angle + Math.PI / 2;
            
            this.modelGroup.add(lineRune);
        }
    }
    
    /**
     * Create metal binding around the talisman
     */
    createMetalBinding() {
        const bindingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown (bronze)
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Create outer ring
        const outerRingGeometry = new THREE.TorusGeometry(0.27, 0.015, 8, 16);
        const outerRing = new THREE.Mesh(outerRingGeometry, bindingMaterial);
        outerRing.rotation.x = Math.PI / 2;
        outerRing.castShadow = true;
        
        this.modelGroup.add(outerRing);
        
        // Create decorative studs
        const studGeometry = new THREE.SphereGeometry(0.01, 8, 8);
        const studCount = 8;
        
        for (let i = 0; i < studCount; i++) {
            const angle = (i / studCount) * Math.PI * 2;
            const stud = new THREE.Mesh(studGeometry, bindingMaterial);
            
            stud.position.set(
                Math.sin(angle) * 0.27,
                0,
                Math.cos(angle) * 0.27
            );
            stud.castShadow = true;
            
            this.modelGroup.add(stud);
        }
    }
    
    /**
     * Create attachment point for wearing
     */
    createAttachmentPoint() {
        const attachmentMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Bronze
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Create bail (attachment loop)
        const bailGeometry = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
        const bail = new THREE.Mesh(bailGeometry, attachmentMaterial);
        bail.position.set(0, 0, 0.28);
        bail.rotation.x = Math.PI / 2;
        bail.castShadow = true;
        
        this.modelGroup.add(bail);
        
        // Create connection piece
        const connectionGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8);
        const connection = new THREE.Mesh(connectionGeometry, attachmentMaterial);
        connection.position.set(0, 0, 0.25);
        connection.rotation.x = Math.PI / 2;
        connection.castShadow = true;
        
        this.modelGroup.add(connection);
    }
    
    /**
     * Create mystical aura effect
     */
    createMysticalAura() {
        const auraMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x9370DB, // Medium purple
            emissive: 0x9370DB,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        // Create aura rings
        const auraCount = 3;
        for (let i = 0; i < auraCount; i++) {
            const auraGeometry = new THREE.RingGeometry(0.3 + i * 0.05, 0.32 + i * 0.05, 16);
            const aura = new THREE.Mesh(auraGeometry, auraMaterial);
            aura.position.y = 0.01 + i * 0.02;
            aura.rotation.x = -Math.PI / 2;
            
            this.modelGroup.add(aura);
        }
        
        // Create floating particles effect (represented by small spheres)
        const particleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            emissive: 0x9370DB,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6
        });
        
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.008, 8, 8);
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.35 + Math.random() * 0.1;
            
            particle.position.set(
                Math.sin(angle) * radius,
                0.05 + Math.random() * 0.1,
                Math.cos(angle) * radius
            );
            
            this.modelGroup.add(particle);
        }
    }
    
    /**
     * Add decorative crystals to the talisman
     */
    addDecorativeCrystals() {
        const crystalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00CED1, // Dark turquoise
            roughness: 0.1,
            metalness: 0.1,
            emissive: 0x00CED1,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.8
        });
        
        // Create small crystals at corners
        const crystalCount = 6;
        for (let i = 0; i < crystalCount; i++) {
            const crystalGeometry = new THREE.OctahedronGeometry(0.025, 0);
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            const angle = (i / crystalCount) * Math.PI * 2;
            crystal.position.set(
                Math.sin(angle) * 0.22,
                0.04,
                Math.cos(angle) * 0.22
            );
            crystal.rotation.y = angle;
            crystal.castShadow = true;
            
            this.modelGroup.add(crystal);
        }
        
        // Create central power crystal
        const powerCrystalGeometry = new THREE.OctahedronGeometry(0.04, 0);
        const powerCrystal = new THREE.Mesh(powerCrystalGeometry, crystalMaterial);
        powerCrystal.position.set(0, 0.05, 0);
        powerCrystal.castShadow = true;
        
        this.modelGroup.add(powerCrystal);
    }
    
    updateAnimations(delta) {
        if (!this.modelGroup) return;
        
        const time = Date.now() * 0.001;
        
        // Rotate the main talisman slowly
        const mainTalisman = this.modelGroup.children[0];
        if (mainTalisman) {
            mainTalisman.rotation.y += delta * 0.3;
        }
        
        // Pulsing runic symbols
        this.modelGroup.children.forEach(child => {
            if (child.material && child.material.emissive && 
                child.material.color.r === 1 && child.material.color.g === 0.843) {
                // This is likely a runic symbol (gold color)
                child.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3;
            }
        });
        
        // Floating particles orbital motion
        this.modelGroup.children.forEach((child, index) => {
            if (child.geometry instanceof THREE.SphereGeometry && 
                child.position.length() > 0.3) {
                // This is likely a floating particle
                const angle = time * 0.5 + index * 0.5;
                const radius = 0.35 + Math.sin(time * 2 + index) * 0.05;
                
                child.position.x = Math.sin(angle) * radius;
                child.position.z = Math.cos(angle) * radius;
                child.position.y = 0.05 + Math.sin(time * 3 + index) * 0.03;
                
                // Pulsing particle glow
                if (child.material && child.material.emissive) {
                    child.material.emissiveIntensity = 0.8 + Math.sin(time * 4 + index) * 0.4;
                }
            }
        });
        
        // Aura rings animation
        this.modelGroup.children.forEach((child, index) => {
            if (child.geometry instanceof THREE.RingGeometry && 
                child.material.transparent && child.material.opacity < 0.5) {
                // This is likely an aura ring
                child.rotation.z += delta * (0.2 + index * 0.1);
                child.material.opacity = 0.2 + Math.sin(time * 1.5 + index) * 0.1;
            }
        });
        
        // Crystal pulsing
        this.modelGroup.children.forEach(child => {
            if (child.geometry instanceof THREE.OctahedronGeometry) {
                child.rotation.y += delta * 0.8;
                child.rotation.x += delta * 0.5;
                
                if (child.material && child.material.emissive) {
                    child.material.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.2;
                }
            }
        });
        
        // Overall mystical floating motion
        this.modelGroup.position.y = Math.sin(time * 1.2) * 0.02;
        this.modelGroup.rotation.y += delta * 0.1;
    }
}