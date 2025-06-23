import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Eye of the Storm variant of Cyclone Strike
 * Increases the radius of Cyclone Strike by 20%
 * Visual style: Swirling ice crystals and snowflakes
 */
export class EyeOfTheStormEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.freezeEffect = true;
        this.freezeDuration = 2; // 2 seconds freeze
        
        // Visual properties
        this.iceParticles = [];
        this.snowflakes = [];
        this.iceColor = new THREE.Color(0x88ccff);
    }

    /**
     * Create the Frigid Cyclone effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to ice blue
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.iceColor.clone();
                    });
                } else {
                    child.material.color = this.iceColor.clone();
                }
            }
        });
        
        // Add ice crystals
        this.addIceCrystals(effectGroup);
        
        // Add snowflakes
        this.addSnowflakes(effectGroup);
        
        // Add frost ring
        this.addFrostRing(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add ice crystals to the effect
     * @param {THREE.Group} group - The group to add ice crystals to
     */
    addIceCrystals(group) {
        const crystalCount = 12;
        const baseRadius = this.skill.radius * 0.7;
        
        for (let i = 0; i < crystalCount; i++) {
            // Create an ice crystal
            const crystal = this.createIceCrystal();
            
            // Position in a spiral pattern
            const angle = (i / crystalCount) * Math.PI * 2;
            const heightOffset = (i / crystalCount) * 2; // Spiral upward
            
            crystal.position.x = Math.cos(angle) * baseRadius * (0.5 + i/crystalCount);
            crystal.position.z = Math.sin(angle) * baseRadius * (0.5 + i/crystalCount);
            crystal.position.y = heightOffset;
            
            // Rotate to face outward
            crystal.rotation.y = angle + Math.PI;
            crystal.rotation.x = Math.random() * Math.PI / 4;
            crystal.rotation.z = Math.random() * Math.PI / 4;
            
            // Store initial position for animation
            crystal.userData.initialAngle = angle;
            crystal.userData.radius = baseRadius * (0.5 + i/crystalCount);
            crystal.userData.height = heightOffset;
            crystal.userData.rotationSpeed = 0.5 + Math.random() * 0.5;
            
            group.add(crystal);
            this.iceParticles.push(crystal);
        }
    }
    
    /**
     * Create a stylized ice crystal using simple geometries
     * @returns {THREE.Group} - The created ice crystal
     */
    createIceCrystal() {
        const crystalGroup = new THREE.Group();
        
        // Create main crystal shape
        const crystalGeometry = new THREE.ConeGeometry(0.2, 0.8, 5);
        const crystalMaterial = new THREE.MeshBasicMaterial({
            color: this.iceColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.rotation.x = Math.PI; // Point upward
        crystalGroup.add(crystal);
        
        // Add a smaller crystal on top
        const topCrystalGeometry = new THREE.ConeGeometry(0.1, 0.4, 5);
        const topCrystal = new THREE.Mesh(topCrystalGeometry, crystalMaterial.clone());
        topCrystal.position.y = 0.6;
        topCrystal.rotation.x = Math.PI; // Point upward
        crystalGroup.add(topCrystal);
        
        // Add some small crystal shards
        const shardCount = 3;
        for (let i = 0; i < shardCount; i++) {
            const shardGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
            const shardMaterial = crystalMaterial.clone();
            shardMaterial.opacity = 0.6;
            
            const shard = new THREE.Mesh(shardGeometry, shardMaterial);
            
            // Position around the main crystal
            const angle = (i / shardCount) * Math.PI * 2;
            shard.position.x = Math.cos(angle) * 0.15;
            shard.position.z = Math.sin(angle) * 0.15;
            shard.position.y = 0.2;
            
            // Rotate outward
            shard.rotation.x = Math.PI / 6;
            shard.rotation.y = angle;
            
            crystalGroup.add(shard);
        }
        
        return crystalGroup;
    }
    
    /**
     * Add snowflakes to the effect
     * @param {THREE.Group} group - The group to add snowflakes to
     */
    addSnowflakes(group) {
        const snowflakeCount = 50;
        const baseRadius = this.skill.radius;
        
        // Create snowflake geometry
        const snowflakeGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(snowflakeCount * 3);
        const sizes = new Float32Array(snowflakeCount);
        
        for (let i = 0; i < snowflakeCount; i++) {
            // Random position within the cyclone
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius;
            const height = Math.random() * 3;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        snowflakeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        snowflakeGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create snowflake material
        const snowflakeMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create snowflake points
        const snowflakes = new THREE.Points(snowflakeGeometry, snowflakeMaterial);
        group.add(snowflakes);
        
        // Store for animation
        this.snowflakes = snowflakes;
    }
    
    /**
     * Add a frost ring to the effect
     * @param {THREE.Group} group - The group to add the frost ring to
     */
    addFrostRing(group) {
        const ringGeometry = new THREE.RingGeometry(this.skill.radius - 0.2, this.skill.radius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        group.add(ring);
    }
    
    /**
     * Update the Frigid Cyclone effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate ice crystals
            this.iceParticles.forEach(crystal => {
                const initialAngle = crystal.userData.initialAngle || 0;
                const radius = crystal.userData.radius || 1;
                const height = crystal.userData.height || 0;
                const rotationSpeed = crystal.userData.rotationSpeed || 1;
                
                // Spiral inward and upward
                const newAngle = initialAngle + this.elapsedTime * rotationSpeed;
                const newRadius = radius * (1 - this.elapsedTime / (this.skill.duration * 1.5));
                
                crystal.position.x = Math.cos(newAngle) * newRadius;
                crystal.position.z = Math.sin(newAngle) * newRadius;
                crystal.position.y = height + this.elapsedTime * 0.5;
                
                // Rotate the crystal
                crystal.rotation.y = newAngle + Math.PI;
                crystal.rotation.x += delta * 0.5;
            });
            
            // Animate snowflakes
            if (this.snowflakes && this.snowflakes.geometry) {
                const positions = this.snowflakes.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Get current position
                    const x = positions[i * 3];
                    const y = positions[i * 3 + 1];
                    const z = positions[i * 3 + 2];
                    
                    // Calculate distance from center
                    const distance = Math.sqrt(x * x + z * z);
                    
                    // Move inward and upward
                    const angle = Math.atan2(z, x);
                    const newDistance = distance * 0.98; // Move inward
                    
                    positions[i * 3] = Math.cos(angle) * newDistance;
                    positions[i * 3 + 1] = y + delta * 0.5; // Move upward
                    positions[i * 3 + 2] = Math.sin(angle) * newDistance;
                    
                    // If snowflake gets too close to center or too high, reset it
                    if (newDistance < 0.2 || y > 3) {
                        const newAngle = Math.random() * Math.PI * 2;
                        const newRadius = this.skill.radius * 0.8 + Math.random() * this.skill.radius * 0.2;
                        
                        positions[i * 3] = Math.cos(newAngle) * newRadius;
                        positions[i * 3 + 1] = 0;
                        positions[i * 3 + 2] = Math.sin(newAngle) * newRadius;
                    }
                }
                
                this.snowflakes.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
    
    /**
     * Apply freeze effect to enemies
     * @param {Enemy} enemy - The enemy to apply the effect to
     */
    applyFreezeEffect(enemy) {
        if (!enemy || !this.freezeEffect) return;
        
        // Apply freeze status effect
        if (enemy.addStatusEffect) {
            enemy.addStatusEffect('freeze', this.freezeDuration);
        }
    }
    
    /**
     * Override the damage application to add freeze effect
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply base damage
        super.applyDamage(enemy, amount);
        
        // Apply freeze effect
        this.applyFreezeEffect(enemy);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.iceParticles = [];
        this.snowflakes = null;
        
        // Call parent dispose
        super.dispose();
    }
}