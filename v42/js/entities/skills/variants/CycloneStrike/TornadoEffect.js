import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Tornado variant of Cyclone Strike
 * Creates a persistent tornado that deals continuous damage
 * Visual style: Tall, swirling funnel cloud with debris
 */
export class TornadoEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.continuousDamage = true;
        this.damageTickRate = 1.0; // Damage every 1 second
        this.durationMultiplier = 1.5; // 50% longer duration
        this.lastDamageTime = 0;
        
        // Visual properties
        this.funnelMesh = null;
        this.debris = [];
        this.tornadoColor = new THREE.Color(0xcccccc); // Gray color
    }

    /**
     * Create the Tornado effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to tornado color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.tornadoColor.clone();
                    });
                } else {
                    child.material.color = this.tornadoColor.clone();
                }
            }
        });
        
        // Add funnel cloud
        this.addFunnelCloud(effectGroup);
        
        // Add debris
        this.addDebris(effectGroup);
        
        // Add ground swirl
        this.addGroundSwirl(effectGroup);
        
        // Extend the duration
        this.skill.duration *= this.durationMultiplier;
        
        return effectGroup;
    }
    
    /**
     * Add a funnel cloud to the effect
     * @param {THREE.Group} group - The group to add the funnel cloud to
     */
    addFunnelCloud(group) {
        // Create a funnel shape using a custom geometry
        const height = 5; // Tall tornado
        const baseRadius = this.skill.radius;
        const topRadius = baseRadius * 0.2;
        const segments = 32;
        const heightSegments = 10;
        
        // Create geometry
        const geometry = new THREE.CylinderGeometry(topRadius, baseRadius, height, segments, heightSegments, true);
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            color: this.tornadoColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create mesh
        const funnel = new THREE.Mesh(geometry, material);
        funnel.position.y = height / 2;
        
        group.add(funnel);
        this.funnelMesh = funnel;
        
        // Add swirling lines to the funnel
        this.addSwirlLines(funnel, height, baseRadius, topRadius);
    }
    
    /**
     * Add swirling lines to the funnel
     * @param {THREE.Mesh} funnel - The funnel mesh to add lines to
     * @param {number} height - The height of the funnel
     * @param {number} baseRadius - The radius at the base of the funnel
     * @param {number} topRadius - The radius at the top of the funnel
     */
    addSwirlLines(funnel, height, baseRadius, topRadius) {
        const lineCount = 8;
        
        for (let i = 0; i < lineCount; i++) {
            // Create a spiral curve
            const points = [];
            const turns = 5; // Number of turns in the spiral
            const pointCount = 100;
            
            for (let j = 0; j < pointCount; j++) {
                const t = j / (pointCount - 1);
                const angle = t * Math.PI * 2 * turns + (i / lineCount) * Math.PI * 2;
                const radius = baseRadius * (1 - t) + topRadius * t;
                
                const x = Math.cos(angle) * radius;
                const y = t * height;
                const z = Math.sin(angle) * radius;
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            // Create geometry
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            
            // Create material
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            // Create line
            const line = new THREE.Line(lineGeometry, lineMaterial);
            
            funnel.add(line);
        }
    }
    
    /**
     * Add debris to the effect
     * @param {THREE.Group} group - The group to add debris to
     */
    addDebris(group) {
        const debrisCount = 20;
        const baseRadius = this.skill.radius * 0.8;
        
        for (let i = 0; i < debrisCount; i++) {
            // Create a piece of debris
            const debris = this.createDebris();
            
            // Position randomly within the tornado
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * baseRadius;
            const height = Math.random() * 4;
            
            debris.position.x = Math.cos(angle) * radius;
            debris.position.z = Math.sin(angle) * radius;
            debris.position.y = height;
            
            // Random rotation
            debris.rotation.x = Math.random() * Math.PI * 2;
            debris.rotation.y = Math.random() * Math.PI * 2;
            debris.rotation.z = Math.random() * Math.PI * 2;
            
            // Store initial position for animation
            debris.userData.angle = angle;
            debris.userData.radius = radius;
            debris.userData.height = height;
            debris.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5,
                z: (Math.random() - 0.5) * 5
            };
            debris.userData.orbitSpeed = 2 + Math.random() * 3;
            
            group.add(debris);
            this.debris.push(debris);
        }
    }
    
    /**
     * Create a piece of debris using simple geometries
     * @returns {THREE.Mesh} - The created debris
     */
    createDebris() {
        // Randomly choose a geometry type
        const geometryType = Math.floor(Math.random() * 3);
        let geometry;
        
        switch (geometryType) {
            case 0: // Box
                geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                break;
            case 1: // Sphere
                geometry = new THREE.SphereGeometry(0.1, 8, 8);
                break;
            case 2: // Cone
                geometry = new THREE.ConeGeometry(0.1, 0.2, 8);
                break;
        }
        
        // Create material
        const material = new THREE.MeshBasicMaterial({
            color: 0x999999, // Gray color for debris
            transparent: true,
            opacity: 0.8
        });
        
        // Create mesh
        return new THREE.Mesh(geometry, material);
    }
    
    /**
     * Add a ground swirl to the effect
     * @param {THREE.Group} group - The group to add the ground swirl to
     */
    addGroundSwirl(group) {
        const ringGeometry = new THREE.RingGeometry(0.5, this.skill.radius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.tornadoColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Lay flat
        ring.position.y = 0.05; // Just above ground
        
        group.add(ring);
        
        // Add texture to make it look like swirling dust
        const textureSize = 512;
        const data = new Uint8Array(textureSize * textureSize * 4);
        
        // Create a noise pattern
        for (let i = 0; i < textureSize; i++) {
            for (let j = 0; j < textureSize; j++) {
                const index = (i * textureSize + j) * 4;
                
                // Create a swirl pattern
                const x = j / textureSize - 0.5;
                const y = i / textureSize - 0.5;
                const distance = Math.sqrt(x * x + y * y);
                const angle = Math.atan2(y, x);
                
                // Swirl pattern with some noise
                const noise = Math.sin(distance * 30 + angle * 15) * 0.5 + 0.5;
                
                // Set color (gray color)
                data[index] = 204; // R
                data[index + 1] = 204; // G
                data[index + 2] = 204; // B
                
                // Set alpha based on noise and distance
                data[index + 3] = Math.max(0, Math.min(255, noise * 255 * (1 - distance * 2)));
            }
        }
        
        // Create texture
        const texture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat);
        texture.needsUpdate = true;
        
        // Apply texture to the ring
        ringMaterial.map = texture;
        ringMaterial.needsUpdate = true;
    }
    
    /**
     * Update the Tornado effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Rotate the funnel
            if (this.funnelMesh) {
                this.funnelMesh.rotation.y += delta * 2;
            }
            
            // Animate debris
            this.debris.forEach(debris => {
                const angle = debris.userData.angle || 0;
                const radius = debris.userData.radius || 1;
                const height = debris.userData.height || 0;
                const rotationSpeed = debris.userData.rotationSpeed || { x: 0, y: 0, z: 0 };
                const orbitSpeed = debris.userData.orbitSpeed || 2;
                
                // Rotate the debris
                debris.rotation.x += delta * rotationSpeed.x;
                debris.rotation.y += delta * rotationSpeed.y;
                debris.rotation.z += delta * rotationSpeed.z;
                
                // Move in a spiral pattern
                const newAngle = angle + this.elapsedTime * orbitSpeed;
                const newRadius = radius * (1 - this.elapsedTime / (this.skill.duration * 2));
                
                debris.position.x = Math.cos(newAngle) * newRadius;
                debris.position.z = Math.sin(newAngle) * newRadius;
                
                // Move upward
                debris.position.y = height + this.elapsedTime * 0.5;
                
                // If debris gets too high, reset it
                if (debris.position.y > 5) {
                    debris.position.y = 0;
                    debris.userData.height = 0;
                }
            });
            
            // Apply continuous damage
            if (this.continuousDamage) {
                this.lastDamageTime += delta;
                if (this.lastDamageTime >= this.damageTickRate) {
                    this.applyDamageTick();
                    this.lastDamageTime = 0;
                }
            }
        }
    }
    
    /**
     * Apply a damage tick to enemies in range
     */
    applyDamageTick() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // const damagePosition = this.effect.position.clone();
        
        // const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
        //     damagePosition,
        //     this.skill.radius
        // );
        
        // enemies.forEach(enemy => {
        //     const damageAmount = this.skill.damage * 0.3; // 30% of base damage per tick
        //     enemy.takeDamage(damageAmount);
            
        //     // Apply a small knockback effect
        //     if (enemy.applyKnockback) {
        //         const direction = new THREE.Vector3()
        //             .subVectors(enemy.getPosition(), damagePosition)
        //             .normalize();
                
        //         enemy.applyKnockback(direction, 1); // Small knockback force
        //     }
        // });
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.funnelMesh = null;
        this.debris = [];
        
        // Call parent dispose
        super.dispose();
    }
}