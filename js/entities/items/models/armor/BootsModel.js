import * as THREE from 'three';
import { ItemModel } from '../ItemModel.js';

/**
 * Model for boots armor type
 * Creates a pair of protective footwear
 */
export class BootsModel extends ItemModel {
    constructor(item, modelGroup) {
        super(item, modelGroup);
        this.createModel();
    }
    
    createModel() {
        // Create pair of boots
        this.createLeftBoot();
        this.createRightBoot();
        
        // Add decorative elements
        this.addDecorations();
        
        // Position the boots correctly
        this.modelGroup.scale.set(0.8 / 3, 0.8 / 3, 0.8 / 3); // 1/3 scale applied
    }
    
    /**
     * Create the left boot
     */
    createLeftBoot() {
        const bootGroup = new THREE.Group();
        
        // Boot material based on item quality/type
        const bootMaterial = this.getBootMaterial();
        
        // Create sole
        const soleGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.4);
        const sole = new THREE.Mesh(soleGeometry, bootMaterial);
        sole.position.set(-0.15, 0.025, 0);
        sole.castShadow = true;
        bootGroup.add(sole);
        
        // Create foot section
        const footGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.35);
        const foot = new THREE.Mesh(footGeometry, bootMaterial);
        foot.position.set(-0.15, 0.125, 0);
        foot.castShadow = true;
        bootGroup.add(foot);
        
        // Create ankle section
        const ankleGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.2, 8);
        const ankle = new THREE.Mesh(ankleGeometry, bootMaterial);
        ankle.position.set(-0.15, 0.25, -0.05);
        ankle.castShadow = true;
        bootGroup.add(ankle);
        
        // Create heel reinforcement
        const heelGeometry = new THREE.BoxGeometry(0.18, 0.1, 0.1);
        const heel = new THREE.Mesh(heelGeometry, bootMaterial);
        heel.position.set(-0.15, 0.1, -0.15);
        heel.castShadow = true;
        bootGroup.add(heel);
        
        // Create toe cap
        const toeCapGeometry = new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const toeCap = new THREE.Mesh(toeCapGeometry, bootMaterial);
        toeCap.position.set(-0.15, 0.125, 0.15);
        toeCap.rotation.x = -Math.PI / 2;
        toeCap.castShadow = true;
        bootGroup.add(toeCap);
        
        this.modelGroup.add(bootGroup);
    }
    
    /**
     * Create the right boot
     */
    createRightBoot() {
        const bootGroup = new THREE.Group();
        
        // Boot material
        const bootMaterial = this.getBootMaterial();
        
        // Create sole
        const soleGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.4);
        const sole = new THREE.Mesh(soleGeometry, bootMaterial);
        sole.position.set(0.15, 0.025, 0);
        sole.castShadow = true;
        bootGroup.add(sole);
        
        // Create foot section
        const footGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.35);
        const foot = new THREE.Mesh(footGeometry, bootMaterial);
        foot.position.set(0.15, 0.125, 0);
        foot.castShadow = true;
        bootGroup.add(foot);
        
        // Create ankle section
        const ankleGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.2, 8);
        const ankle = new THREE.Mesh(ankleGeometry, bootMaterial);
        ankle.position.set(0.15, 0.25, -0.05);
        ankle.castShadow = true;
        bootGroup.add(ankle);
        
        // Create heel reinforcement
        const heelGeometry = new THREE.BoxGeometry(0.18, 0.1, 0.1);
        const heel = new THREE.Mesh(heelGeometry, bootMaterial);
        heel.position.set(0.15, 0.1, -0.15);
        heel.castShadow = true;
        bootGroup.add(heel);
        
        // Create toe cap
        const toeCapGeometry = new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const toeCap = new THREE.Mesh(toeCapGeometry, bootMaterial);
        toeCap.position.set(0.15, 0.125, 0.15);
        toeCap.rotation.x = -Math.PI / 2;
        toeCap.castShadow = true;
        bootGroup.add(toeCap);
        
        this.modelGroup.add(bootGroup);
    }
    
    /**
     * Get boot material based on item properties
     */
    getBootMaterial() {
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
                    metalness = 0.3;
                    roughness = 0.6;
                    break;
                case 'rare':
                    color = 0x4169E1; // Royal blue
                    emissive = 0x000080;
                    emissiveIntensity = 0.1;
                    metalness = 0.4;
                    roughness = 0.5;
                    break;
                case 'epic':
                    color = 0x9932CC; // Dark orchid
                    emissive = 0x4B0082;
                    emissiveIntensity = 0.2;
                    metalness = 0.5;
                    roughness = 0.4;
                    break;
                case 'legendary':
                    color = 0xFF8C00; // Dark orange
                    emissive = 0xFF4500;
                    emissiveIntensity = 0.3;
                    metalness = 0.6;
                    roughness = 0.3;
                    break;
                case 'mythic':
                    color = 0xDC143C; // Crimson
                    emissive = 0xFF0000;
                    emissiveIntensity = 0.4;
                    metalness = 0.7;
                    roughness = 0.2;
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
     * Add decorative elements to the boots
     */
    addDecorations() {
        // Add laces
        this.addBootLaces();
        
        // Add buckles or straps
        this.addBuckles();
        
        // Add studs or reinforcements
        this.addStuds();
        
        // Add sole treads
        this.addSoleTreads();
    }
    
    /**
     * Add boot laces
     */
    addBootLaces() {
        const laceMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F2F2F, // Dark gray
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Left boot laces
        this.createBootLace(laceMaterial, -0.15);
        
        // Right boot laces
        this.createBootLace(laceMaterial, 0.15);
    }
    
    /**
     * Create laces for a single boot
     */
    createBootLace(material, xOffset) {
        const laceGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.15, 6);
        
        // Create multiple lace segments
        for (let i = 0; i < 4; i++) {
            // Horizontal laces
            const horizontalLace = new THREE.Mesh(laceGeometry, material);
            horizontalLace.position.set(xOffset, 0.15 + i * 0.05, 0.08);
            horizontalLace.rotation.z = Math.PI / 2;
            horizontalLace.castShadow = true;
            this.modelGroup.add(horizontalLace);
            
            // Diagonal laces (left side)
            if (i < 3) {
                const diagonalLaceLeft = new THREE.Mesh(laceGeometry, material);
                diagonalLaceLeft.position.set(xOffset - 0.05, 0.175 + i * 0.05, 0.08);
                diagonalLaceLeft.rotation.z = Math.PI / 4;
                diagonalLaceLeft.scale.y = 0.7;
                diagonalLaceLeft.castShadow = true;
                this.modelGroup.add(diagonalLaceLeft);
                
                // Diagonal laces (right side)
                const diagonalLaceRight = new THREE.Mesh(laceGeometry, material);
                diagonalLaceRight.position.set(xOffset + 0.05, 0.175 + i * 0.05, 0.08);
                diagonalLaceRight.rotation.z = -Math.PI / 4;
                diagonalLaceRight.scale.y = 0.7;
                diagonalLaceRight.castShadow = true;
                this.modelGroup.add(diagonalLaceRight);
            }
        }
    }
    
    /**
     * Add buckles or straps
     */
    addBuckles() {
        const buckleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7D6B, // Dark khaki (bronze-like)
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Left boot buckle
        this.createBuckle(buckleMaterial, -0.15);
        
        // Right boot buckle
        this.createBuckle(buckleMaterial, 0.15);
    }
    
    /**
     * Create buckle for a single boot
     */
    createBuckle(material, xOffset) {
        // Buckle frame
        const buckleGeometry = new THREE.TorusGeometry(0.03, 0.005, 6, 12);
        const buckle = new THREE.Mesh(buckleGeometry, material);
        buckle.position.set(xOffset, 0.3, 0);
        buckle.rotation.x = Math.PI / 2;
        buckle.castShadow = true;
        this.modelGroup.add(buckle);
        
        // Buckle strap
        const strapGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.01);
        const strap = new THREE.Mesh(strapGeometry, this.getBootMaterial());
        strap.position.set(xOffset, 0.3, -0.02);
        strap.castShadow = true;
        this.modelGroup.add(strap);
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
        
        // Add studs to both boots
        [-0.15, 0.15].forEach(xOffset => {
            // Toe studs
            for (let i = 0; i < 3; i++) {
                const stud = new THREE.Mesh(studGeometry, studMaterial);
                stud.position.set(xOffset + (i - 1) * 0.03, 0.125, 0.15);
                stud.castShadow = true;
                this.modelGroup.add(stud);
            }
            
            // Side studs
            for (let i = 0; i < 2; i++) {
                const stud = new THREE.Mesh(studGeometry, studMaterial);
                stud.position.set(xOffset + (Math.sign(xOffset) * 0.12), 0.15 + i * 0.05, 0.05);
                stud.castShadow = true;
                this.modelGroup.add(stud);
            }
        });
    }
    
    /**
     * Add sole tread patterns
     */
    addSoleTreads() {
        const treadMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F2F2F, // Dark gray
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Add treads to both boots
        [-0.15, 0.15].forEach(xOffset => {
            // Create tread pattern
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 3; j++) {
                    const treadGeometry = new THREE.BoxGeometry(0.02, 0.01, 0.02);
                    const tread = new THREE.Mesh(treadGeometry, treadMaterial);
                    tread.position.set(
                        xOffset + (j - 1) * 0.06,
                        -0.005,
                        -0.15 + i * 0.075
                    );
                    tread.castShadow = true;
                    this.modelGroup.add(tread);
                }
            }
        });
    }
    
    updateAnimations(delta) {
        if (!this.modelGroup) return;
        
        const time = Date.now() * 0.001;
        
        // Subtle floating animation
        this.modelGroup.position.y = Math.sin(time * 0.8) * 0.01;
        
        // Gentle rocking motion
        this.modelGroup.rotation.z = Math.sin(time * 1.2) * 0.02;
        
        // Rare+ boots glow animation
        if (this.item && this.item.rarity && 
            ['rare', 'epic', 'legendary', 'mythic'].includes(this.item.rarity)) {
            
            this.modelGroup.children.forEach(bootGroup => {
                if (bootGroup instanceof THREE.Group) {
                    bootGroup.children.forEach(part => {
                        if (part.material && part.material.emissive) {
                            const baseIntensity = part.material.emissiveIntensity || 0.1;
                            part.material.emissiveIntensity = baseIntensity + Math.sin(time * 2) * 0.1;
                        }
                    });
                }
            });
        }
        
        // Buckle shine effect
        this.modelGroup.children.forEach(child => {
            if (child.geometry instanceof THREE.TorusGeometry) {
                child.rotation.y += delta * 0.5;
            }
        });
    }
}