import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for belt armor type
 * Creates a utility belt with pouches and buckles
 */
export class BeltModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create main belt strap
        this.createBeltStrap();
        
        // Create belt buckle
        this.createBeltBuckle();
        
        // Create utility pouches
        this.createPouches();
        
        // Add decorative elements
        this.addDecorations();
        
        // Position the belt correctly
        this.modelGroup.scale.set(0.7, 0.7, 0.7);
    }
    
    /**
     * Create the main belt strap
     */
    createBeltStrap() {
        const beltMaterial = this.getBeltMaterial();
        
        // Main belt strap (curved to simulate being worn)
        const beltGeometry = new THREE.TorusGeometry(0.4, 0.025, 8, 32, Math.PI * 1.8);
        const beltStrap = new THREE.Mesh(beltGeometry, beltMaterial);
        beltStrap.rotation.x = Math.PI / 2;
        beltStrap.position.y = 0;
        beltStrap.castShadow = true;
        
        this.modelGroup.add(beltStrap);
        
        // Belt end piece
        const endGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.15);
        const beltEnd = new THREE.Mesh(endGeometry, beltMaterial);
        beltEnd.position.set(0.35, 0, 0.2);
        beltEnd.rotation.y = -Math.PI / 6;
        beltEnd.castShadow = true;
        
        this.modelGroup.add(beltEnd);
    }
    
    /**
     * Create the belt buckle
     */
    createBeltBuckle() {
        const buckleMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700, // Gold
            roughness: 0.2,
            metalness: 0.9
        });
        
        // Main buckle frame
        const buckleFrameGeometry = new THREE.TorusGeometry(0.06, 0.01, 8, 16);
        const buckleFrame = new THREE.Mesh(buckleFrameGeometry, buckleMaterial);
        buckleFrame.position.set(0, 0, 0.4);
        buckleFrame.rotation.x = Math.PI / 2;
        buckleFrame.castShadow = true;
        
        this.modelGroup.add(buckleFrame);
        
        // Buckle prong
        const prongGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6);
        const prong = new THREE.Mesh(prongGeometry, buckleMaterial);
        prong.position.set(0, 0, 0.4);
        prong.rotation.z = Math.PI / 2;
        prong.castShadow = true;
        
        this.modelGroup.add(prong);
        
        // Decorative buckle center
        const centerGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8);
        const center = new THREE.Mesh(centerGeometry, buckleMaterial);
        center.position.set(0, 0, 0.42);
        center.rotation.x = Math.PI / 2;
        center.castShadow = true;
        
        this.modelGroup.add(center);
    }
    
    /**
     * Create utility pouches
     */
    createPouches() {
        const pouchMaterial = this.getBeltMaterial();
        
        // Left side pouch
        this.createPouch(pouchMaterial, -0.25, 0.15);
        
        // Right side pouch  
        this.createPouch(pouchMaterial, 0.25, -0.15);
        
        // Back pouch (larger)
        this.createLargePouch(pouchMaterial, 0, -0.4);
    }
    
    /**
     * Create a small utility pouch
     */
    createPouch(material, x, z) {
        const pouchGroup = new THREE.Group();
        
        // Main pouch body
        const pouchGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.06);
        const pouch = new THREE.Mesh(pouchGeometry, material);
        pouch.position.set(x, -0.05, z);
        pouch.castShadow = true;
        pouchGroup.add(pouch);
        
        // Pouch flap
        const flapGeometry = new THREE.BoxGeometry(0.09, 0.02, 0.07);
        const flap = new THREE.Mesh(flapGeometry, material);
        flap.position.set(x, 0.02, z + 0.01);
        flap.rotation.x = -Math.PI / 6;
        flap.castShadow = true;
        pouchGroup.add(flap);
        
        // Pouch strap
        const strapGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 6);
        const strap = new THREE.Mesh(strapGeometry, material);
        strap.position.set(x, 0, z);
        strap.rotation.z = Math.PI / 2;
        strap.castShadow = true;
        pouchGroup.add(strap);
        
        this.modelGroup.add(pouchGroup);
    }
    
    /**
     * Create a larger back pouch
     */
    createLargePouch(material, x, z) {
        const pouchGroup = new THREE.Group();
        
        // Main pouch body (larger)
        const pouchGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.08);
        const pouch = new THREE.Mesh(pouchGeometry, material);
        pouch.position.set(x, -0.075, z);
        pouch.castShadow = true;
        pouchGroup.add(pouch);
        
        // Pouch flap
        const flapGeometry = new THREE.BoxGeometry(0.13, 0.03, 0.09);
        const flap = new THREE.Mesh(flapGeometry, material);
        flap.position.set(x, 0.03, z + 0.01);
        flap.rotation.x = -Math.PI / 8;
        flap.castShadow = true;
        pouchGroup.add(flap);
        
        // Multiple straps
        for (let i = 0; i < 2; i++) {
            const strapGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.12, 6);
            const strap = new THREE.Mesh(strapGeometry, material);
            strap.position.set(x + (i - 0.5) * 0.08, 0, z);
            strap.rotation.z = Math.PI / 2;
            strap.castShadow = true;
            pouchGroup.add(strap);
        }
        
        this.modelGroup.add(pouchGroup);
    }
    
    /**
     * Get belt material based on item properties
     */
    getBeltMaterial() {
        // Determine material based on item rarity or type
        let color = 0x8B4513; // Default brown leather
        let metalness = 0.1;
        let roughness = 0.8;
        let emissive = 0x000000;
        let emissiveIntensity = 0;
        
        if (this.item && this.item.rarity) {
            switch (this.item.rarity) {
                case 'common':
                    color = 0x8B4513; // Brown leather
                    break;
                case 'uncommon':
                    color = 0x2F4F4F; // Dark slate gray
                    metalness = 0.2;
                    roughness = 0.7;
                    break;
                case 'rare':
                    color = 0x4169E1; // Royal blue
                    emissive = 0x000080;
                    emissiveIntensity = 0.1;
                    metalness = 0.3;
                    roughness = 0.6;
                    break;
                case 'epic':
                    color = 0x9932CC; // Dark orchid
                    emissive = 0x4B0082;
                    emissiveIntensity = 0.15;
                    metalness = 0.4;
                    roughness = 0.5;
                    break;
                case 'legendary':
                    color = 0xFF8C00; // Dark orange
                    emissive = 0xFF4500;
                    emissiveIntensity = 0.2;
                    metalness = 0.5;
                    roughness = 0.4;
                    break;
                case 'mythic':
                    color = 0xDC143C; // Crimson
                    emissive = 0xFF0000;
                    emissiveIntensity = 0.25;
                    metalness = 0.6;
                    roughness = 0.3;
                    break;
            }
        }
        
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: roughness,
            metalness: metalness,
            emissive: emissive,
            emissiveIntensity: emissiveIntensity
        });
    }
    
    /**
     * Add decorative elements to the belt
     */
    addDecorations() {
        // Add studs along the belt
        this.addStuds();
        
        // Add small utility items
        this.addUtilityItems();
        
        // Add belt loops
        this.addBeltLoops();
    }
    
    /**
     * Add decorative studs
     */
    addStuds() {
        const studMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0, // Silver
            roughness: 0.2,
            metalness: 0.9
        });
        
        const studGeometry = new THREE.SphereGeometry(0.008, 8, 8);
        const studCount = 12;
        
        for (let i = 0; i < studCount; i++) {
            const angle = (i / studCount) * Math.PI * 1.8 - Math.PI * 0.9;
            const stud = new THREE.Mesh(studGeometry, studMaterial);
            
            stud.position.set(
                Math.sin(angle) * 0.42,
                0.03,
                Math.cos(angle) * 0.42
            );
            stud.castShadow = true;
            
            this.modelGroup.add(stud);
        }
    }
    
    /**
     * Add small utility items
     */
    addUtilityItems() {
        const utilityMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F2F2F, // Dark gray
            roughness: 0.4,
            metalness: 0.6
        });
        
        // Small knife handle
        const knifeGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 6);
        const knife = new THREE.Mesh(knifeGeometry, utilityMaterial);
        knife.position.set(0.15, -0.02, 0.25);
        knife.rotation.z = Math.PI / 2;
        knife.castShadow = true;
        this.modelGroup.add(knife);
        
        // Small vial/potion
        const vialGeometry = new THREE.CylinderGeometry(0.008, 0.006, 0.04, 8);
        const vialMaterial = new THREE.MeshStandardMaterial({
            color: 0x0000FF,
            transparent: true,
            opacity: 0.7,
            emissive: 0x000080,
            emissiveIntensity: 0.2
        });
        const vial = new THREE.Mesh(vialGeometry, vialMaterial);
        vial.position.set(-0.15, -0.02, 0.25);
        vial.castShadow = true;
        this.modelGroup.add(vial);
        
        // Coin purse strings
        const stringMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });
        
        const stringGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.03, 4);
        for (let i = 0; i < 3; i++) {
            const string = new THREE.Mesh(stringGeometry, stringMaterial);
            string.position.set(-0.22 + i * 0.01, -0.08, -0.35);
            string.rotation.x = Math.PI / 6 + i * 0.1;
            this.modelGroup.add(string);
        }
    }
    
    /**
     * Add belt loops
     */
    addBeltLoops() {
        const loopMaterial = this.getBeltMaterial();
        const loopGeometry = new THREE.TorusGeometry(0.015, 0.005, 6, 12);
        
        const loopPositions = [
            { x: 0.2, z: 0.35 },
            { x: -0.2, z: 0.35 },
            { x: 0.35, z: 0.1 },
            { x: -0.35, z: 0.1 }
        ];
        
        loopPositions.forEach(pos => {
            const loop = new THREE.Mesh(loopGeometry, loopMaterial);
            loop.position.set(pos.x, 0.04, pos.z);
            loop.rotation.x = Math.PI / 2;
            loop.castShadow = true;
            this.modelGroup.add(loop);
        });
    }
    
    updateAnimations(delta) {
        if (!this.modelGroup) return;
        
        const time = Date.now() * 0.001;
        
        // Subtle floating animation
        this.modelGroup.position.y = Math.sin(time * 0.6) * 0.005;
        
        // Gentle rotation
        this.modelGroup.rotation.y += delta * 0.1;
        
        // Buckle shine effect
        const buckle = this.modelGroup.children.find(child => 
            child.geometry instanceof THREE.TorusGeometry && child.position.z > 0.3
        );
        if (buckle && buckle.material) {
            buckle.material.emissiveIntensity = 0.1 + Math.sin(time * 3) * 0.05;
            buckle.rotation.z += delta * 0.2;
        }
        
        // Pouch swaying
        this.modelGroup.children.forEach(child => {
            if (child instanceof THREE.Group) {
                // This is likely a pouch group
                child.rotation.y = Math.sin(time * 1.5 + child.position.x) * 0.02;
                child.position.y = Math.sin(time * 2 + child.position.x) * 0.005;
            }
        });
        
        // Rare+ belts glow animation
        if (this.item && this.item.rarity && 
            ['rare', 'epic', 'legendary', 'mythic'].includes(this.item.rarity)) {
            
            // Belt strap glow
            const beltStrap = this.modelGroup.children[0];
            if (beltStrap && beltStrap.material && beltStrap.material.emissive) {
                const baseIntensity = beltStrap.material.emissiveIntensity || 0.1;
                beltStrap.material.emissiveIntensity = baseIntensity + Math.sin(time * 1.5) * 0.05;
            }
        }
        
        // Utility vial glowing
        const vial = this.modelGroup.children.find(child => 
            child.material && child.material.color && child.material.color.b > 0.8
        );
        if (vial && vial.material) {
            vial.material.emissiveIntensity = 0.2 + Math.sin(time * 4) * 0.1;
        }
        
        // Stud reflections
        this.modelGroup.children.forEach(child => {
            if (child.geometry instanceof THREE.SphereGeometry && 
                child.material && child.material.metalness > 0.8) {
                // This is likely a stud
                child.rotation.y += delta * 2;
            }
        });
    }
}