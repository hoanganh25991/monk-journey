import * as THREE from 'three';
import { BreathOfHeavenEffect } from '../../BreathOfHeavenEffect.js';

/**
 * Effect for the Circle of Life variant of Breath of Heaven
 * Creates a larger healing aura with increased healing power
 * Visual style: Concentric rings with floating lotus flowers
 */
export class CircleOfLifeEffect extends BreathOfHeavenEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.radiusMultiplier = 1.5; // 50% larger radius
        this.healingMultiplier = 1.3; // 30% more healing
        
        // Visual properties
        this.lotusFlowers = [];
        this.rotationSpeed = 0.5; // Rotation speed for the rings
    }

    /**
     * Create the Circle of Life effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Modify the base aura to be larger
        const baseAura = effectGroup.children[0];
        baseAura.scale.set(this.radiusMultiplier, this.radiusMultiplier, this.radiusMultiplier);
        
        // Add concentric rings
        this.addConcentricRings(effectGroup);
        
        // Add floating lotus flowers
        this.addLotusFlowers(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add concentric rings to the effect
     * @param {THREE.Group} group - The group to add rings to
     */
    addConcentricRings(group) {
        const ringCount = 3;
        const baseRadius = this.skill.radius * this.radiusMultiplier;
        
        for (let i = 0; i < ringCount; i++) {
            const radius = baseRadius * (0.4 + (i * 0.3));
            const ringGeometry = new THREE.RingGeometry(radius - 0.1, radius, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x00ff88),
                transparent: true,
                opacity: 0.6 - (i * 0.15),
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2; // Lay flat
            ring.userData.rotationSpeed = 0.2 * (i + 1); // Different rotation speeds
            ring.userData.rotationDirection = i % 2 === 0 ? 1 : -1; // Alternate directions
            
            group.add(ring);
        }
    }
    
    /**
     * Add floating lotus flowers to the effect
     * @param {THREE.Group} group - The group to add lotus flowers to
     */
    addLotusFlowers(group) {
        const flowerCount = 8;
        const baseRadius = this.skill.radius * this.radiusMultiplier * 0.7;
        
        for (let i = 0; i < flowerCount; i++) {
            // Create a lotus flower using simple geometries
            const flower = this.createLotusFlower();
            
            // Position around a circle
            const angle = (i / flowerCount) * Math.PI * 2;
            flower.position.x = Math.cos(angle) * baseRadius;
            flower.position.z = Math.sin(angle) * baseRadius;
            flower.position.y = 0.5 + Math.random() * 0.5; // Random height
            
            // Store initial position for animation
            flower.userData.initialY = flower.position.y;
            flower.userData.floatSpeed = 0.5 + Math.random() * 0.5;
            flower.userData.floatOffset = Math.random() * Math.PI * 2;
            flower.userData.orbitSpeed = 0.2 + Math.random() * 0.3;
            flower.userData.orbitRadius = baseRadius;
            flower.userData.orbitAngle = angle;
            
            group.add(flower);
            this.lotusFlowers.push(flower);
        }
    }
    
    /**
     * Create a stylized lotus flower using simple geometries
     * @returns {THREE.Group} - The created lotus flower
     */
    createLotusFlower() {
        const flowerGroup = new THREE.Group();
        
        // Create petals
        const petalCount = 8;
        const petalColor = new THREE.Color(0xffccff);
        
        for (let i = 0; i < petalCount; i++) {
            // Create a petal using a scaled box
            const petalGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.4);
            const petalMaterial = new THREE.MeshBasicMaterial({
                color: petalColor,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            // Position and rotate the petal
            const angle = (i / petalCount) * Math.PI * 2;
            petal.position.x = Math.cos(angle) * 0.2;
            petal.position.z = Math.sin(angle) * 0.2;
            petal.rotation.y = angle;
            petal.rotation.x = Math.PI / 6; // Tilt upward slightly
            
            flowerGroup.add(petal);
        }
        
        // Create center of flower
        const centerGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const centerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        flowerGroup.add(center);
        
        return flowerGroup;
    }
    
    /**
     * Update the Circle of Life effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Rotate the rings
            this.effect.children.forEach(child => {
                if (child.geometry instanceof THREE.RingGeometry) {
                    const speed = child.userData.rotationSpeed || this.rotationSpeed;
                    const direction = child.userData.rotationDirection || 1;
                    child.rotation.z += speed * delta * direction;
                }
            });
            
            // Animate lotus flowers
            this.lotusFlowers.forEach(flower => {
                // Floating animation
                const initialY = flower.userData.initialY || 0.5;
                const floatSpeed = flower.userData.floatSpeed || 1;
                const floatOffset = flower.userData.floatOffset || 0;
                
                flower.position.y = initialY + Math.sin(this.elapsedTime * floatSpeed + floatOffset) * 0.2;
                
                // Orbit animation
                const orbitSpeed = flower.userData.orbitSpeed || 0.2;
                const orbitRadius = flower.userData.orbitRadius || 1;
                const orbitAngle = flower.userData.orbitAngle || 0;
                
                const newAngle = orbitAngle + orbitSpeed * delta;
                flower.position.x = Math.cos(newAngle) * orbitRadius;
                flower.position.z = Math.sin(newAngle) * orbitRadius;
                flower.userData.orbitAngle = newAngle;
                
                // Rotate the flower to face outward
                flower.rotation.y = newAngle + Math.PI;
            });
        }
    }
    
    /**
     * Apply healing effect with increased healing
     */
    applyHealingEffect() {
        // Apply the healing multiplier to the skill's healing value
        const originalHealing = this.skill.healing;
        this.skill.healing = originalHealing * this.healingMultiplier;
        
        // Call the parent method to apply the healing
        super.applyHealingEffect();
        
        // Restore the original healing value
        this.skill.healing = originalHealing;
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear lotus flowers array
        this.lotusFlowers = [];
        
        // Call parent dispose
        super.dispose();
    }
}