import { EnemyModel } from './EnemyModel.js';
import * as THREE from 'three';

/**
 * Model class for Ancient Yeti enemies
 * Creates a large, frost-covered creature model suitable for boss encounters
 */
export class AncientYetiModel extends EnemyModel {
    /**
     * Create a new Ancient Yeti model
     * @param {Enemy} enemy - The enemy instance
     * @param {THREE.Group} modelGroup - The THREE.js group to add model parts to
     */
    constructor(enemy, modelGroup) {
        super(enemy, modelGroup);
    }
    
    /**
     * Create the 3D model for the Ancient Yeti
     */
    createModel() {
        // Ancient Yeti is a large, frost-covered creature
        const primaryColor = 0xF0F8FF; // Alice blue - frost-covered fur
        const secondaryColor = 0xE6E6FA; // Lavender - lighter accents
        const accentColor = 0x4682B4; // Steel blue - icy accents
        
        // Main body materials
        const furMaterial = new THREE.MeshPhongMaterial({ 
            color: primaryColor,
            shininess: 20
        });
        
        const iceMaterial = new THREE.MeshPhongMaterial({ 
            color: accentColor,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
        
        const darkFurMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xDCDCDC,
            shininess: 10
        });
        
        // Create main body (large torso)
        const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.5, 2.5, 8);
        const bodyMesh = new THREE.Mesh(bodyGeometry, furMaterial);
        bodyMesh.position.set(0, 1.0, 0);
        this.modelGroup.add(bodyMesh);
        
        // Create head (large and imposing)
        const headGeometry = new THREE.SphereGeometry(0.8, 8, 6);
        const headMesh = new THREE.Mesh(headGeometry, furMaterial);
        headMesh.position.set(0, 2.8, 0.2);
        this.modelGroup.add(headMesh);
        
        // Create massive arms
        this.createArm(-1.8, 1.5, 0, furMaterial);
        this.createArm(1.8, 1.5, 0, furMaterial);
        
        // Create powerful legs
        this.createLeg(-0.6, -0.5, 0, furMaterial);
        this.createLeg(0.6, -0.5, 0, furMaterial);
        
        // Add facial features
        this.createFace(darkFurMaterial, iceMaterial);
        
        // Add ice/frost accents
        this.addIceAccents(iceMaterial);
        
        // Add intimidating details
        this.addBossDetails(accentColor);
        
        // Apply enemy scaling
        this.applyEnemyScale();
    }
    
    /**
     * Create a powerful arm for the Ancient Yeti
     * @param {number} x - X position
     * @param {number} y - Y position  
     * @param {number} z - Z position
     * @param {THREE.Material} material - Material to use
     */
    createArm(x, y, z, material) {
        const armGroup = new THREE.Group();
        
        // Upper arm (thick and muscular)
        const upperArmGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 6);
        const upperArmMesh = new THREE.Mesh(upperArmGeometry, material);
        upperArmMesh.position.set(0, 0, 0);
        upperArmMesh.rotation.z = x < 0 ? 0.3 : -0.3;
        armGroup.add(upperArmMesh);
        
        // Lower arm/forearm
        const forearmGeometry = new THREE.CylinderGeometry(0.35, 0.4, 1.0, 6);
        const forearmMesh = new THREE.Mesh(forearmGeometry, material);
        forearmMesh.position.set(0, -1.0, 0);
        forearmMesh.rotation.z = x < 0 ? 0.2 : -0.2;
        armGroup.add(forearmMesh);
        
        // Massive claw/hand
        const handGeometry = new THREE.SphereGeometry(0.45, 6, 4);
        const handMesh = new THREE.Mesh(handGeometry, material);
        handMesh.position.set(0, -1.8, 0);
        handMesh.scale.set(1, 0.8, 1.2);
        armGroup.add(handMesh);
        
        // Add claws
        for (let i = 0; i < 3; i++) {
            const clawGeometry = new THREE.ConeGeometry(0.08, 0.3, 4);
            const clawMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
            const clawMesh = new THREE.Mesh(clawGeometry, clawMaterial);
            clawMesh.position.set(
                (i - 1) * 0.15,
                -2.1,
                0.3
            );
            clawMesh.rotation.x = -Math.PI / 6;
            armGroup.add(clawMesh);
        }
        
        armGroup.position.set(x, y, z);
        this.modelGroup.add(armGroup);
    }
    
    /**
     * Create a powerful leg for the Ancient Yeti
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position  
     * @param {THREE.Material} material - Material to use
     */
    createLeg(x, y, z, material) {
        const legGroup = new THREE.Group();
        
        // Thigh
        const thighGeometry = new THREE.CylinderGeometry(0.45, 0.5, 1.2, 6);
        const thighMesh = new THREE.Mesh(thighGeometry, material);
        thighMesh.position.set(0, 0, 0);
        legGroup.add(thighMesh);
        
        // Lower leg
        const calfGeometry = new THREE.CylinderGeometry(0.35, 0.4, 1.0, 6);
        const calfMesh = new THREE.Mesh(calfGeometry, material);
        calfMesh.position.set(0, -1.0, 0);
        legGroup.add(calfMesh);
        
        // Large foot
        const footGeometry = new THREE.BoxGeometry(0.8, 0.3, 1.2);
        const footMesh = new THREE.Mesh(footGeometry, material);
        footMesh.position.set(0, -1.8, 0.2);
        legGroup.add(footMesh);
        
        legGroup.position.set(x, y, z);
        this.modelGroup.add(legGroup);
    }
    
    /**
     * Create facial features for the Ancient Yeti
     * @param {THREE.Material} darkMaterial - Dark material for features
     * @param {THREE.Material} iceMaterial - Ice material for eyes
     */
    createFace(darkMaterial, iceMaterial) {
        // Snout/muzzle
        const snoutGeometry = new THREE.CylinderGeometry(0.25, 0.35, 0.4, 6);
        const snoutMesh = new THREE.Mesh(snoutGeometry, darkMaterial);
        snoutMesh.position.set(0, 2.6, 0.6);
        snoutMesh.rotation.x = Math.PI / 2;
        this.modelGroup.add(snoutMesh);
        
        // Glowing ice eyes
        const eyeGeometry = new THREE.SphereGeometry(0.15, 6, 4);
        
        const leftEye = new THREE.Mesh(eyeGeometry, iceMaterial);
        leftEye.position.set(-0.3, 2.9, 0.5);
        this.modelGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, iceMaterial);
        rightEye.position.set(0.3, 2.9, 0.5);
        this.modelGroup.add(rightEye);
        
        // Intimidating horns
        const hornGeometry = new THREE.ConeGeometry(0.1, 0.6, 6);
        const hornMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.4, 3.3, 0);
        leftHorn.rotation.z = 0.3;
        this.modelGroup.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.4, 3.3, 0);
        rightHorn.rotation.z = -0.3;
        this.modelGroup.add(rightHorn);
    }
    
    /**
     * Add ice and frost accents to make the yeti look ancient and powerful
     * @param {THREE.Material} iceMaterial - Ice material to use
     */
    addIceAccents(iceMaterial) {
        // Ice spikes on shoulders
        for (let i = 0; i < 2; i++) {
            const spikeGeometry = new THREE.ConeGeometry(0.15, 0.8, 6);
            const spikeMesh = new THREE.Mesh(spikeGeometry, iceMaterial);
            spikeMesh.position.set(
                i === 0 ? -1.2 : 1.2,
                2.2,
                -0.2
            );
            spikeMesh.rotation.z = (i === 0 ? 0.5 : -0.5);
            this.modelGroup.add(spikeMesh);
        }
        
        // Icicles hanging from arms
        for (let side = -1; side <= 1; side += 2) {
            for (let j = 0; j < 3; j++) {
                const icicleGeometry = new THREE.ConeGeometry(0.05, 0.3, 4);
                const icicleMesh = new THREE.Mesh(icicleGeometry, iceMaterial);
                icicleMesh.position.set(
                    side * 1.8 + (Math.random() - 0.5) * 0.4,
                    0.8 - j * 0.3,
                    (Math.random() - 0.5) * 0.4
                );
                icicleMesh.rotation.x = Math.PI;
                this.modelGroup.add(icicleMesh);
            }
        }
    }
    
    /**
     * Add intimidating boss-specific details
     * @param {number} accentColor - Accent color for details
     */
    addBossDetails(accentColor) {
        // Frost aura effect (simplified as rotating ice crystals)
        const auraGroup = new THREE.Group();
        
        for (let i = 0; i < 8; i++) {
            const crystalGeometry = new THREE.OctahedronGeometry(0.1);
            const crystalMaterial = new THREE.MeshPhongMaterial({ 
                color: accentColor,
                transparent: true,
                opacity: 0.6
            });
            const crystalMesh = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            const angle = (i / 8) * Math.PI * 2;
            crystalMesh.position.set(
                Math.cos(angle) * 2.5,
                1.5 + Math.sin(i) * 0.5,
                Math.sin(angle) * 2.5
            );
            
            auraGroup.add(crystalMesh);
        }
        
        this.modelGroup.add(auraGroup);
        
        // Store aura for potential animation
        this.auraGroup = auraGroup;
    }
    
    /**
     * Apply scaling based on enemy properties
     */
    applyEnemyScale() {
        // Ancient Yeti is a boss, so make it imposing but fit in scene
        const baseScale = this.enemy.scale || 1.5; // Much smaller base scale
        this.modelGroup.scale.setScalar(baseScale * 0.5); // Further reduction to fit in scene
    }
    
    /**
     * Update method for potential animations (called by enemy update loop)
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Rotate the frost aura slowly
        if (this.auraGroup) {
            this.auraGroup.rotation.y += deltaTime * 0.5;
        }
    }
}