import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Tempest's Heart variant of Cyclone Strike
 * Creates a vortex that deals damage and has a powerful visual effect
 * Visual style: Swirling energy with lightning
 */
export class TempestsHeartEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.lightningInterval = 0.5; // Time between lightning strikes
        this.lastLightningTime = 0;
        this.vortexColor = new THREE.Color(0x3399ff); // Blue for vortex
        this.lightningColor = new THREE.Color(0x66ccff); // Light blue for lightning
        
        // Visual elements
        this.vortexMesh = null;
        this.lightningBolts = [];
        this.energyRings = [];
    }

    /**
     * Create the Tempest's Heart effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.vortexColor.clone();
                    });
                } else {
                    child.material.color = this.vortexColor.clone();
                }
            }
        });
        
        // Add vortex
        this.addVortex(effectGroup);
        
        // Add energy rings
        this.addEnergyRings(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add a vortex to the effect
     * @param {THREE.Group} group - The group to add the vortex to
     */
    addVortex(group) {
        // Create a spiral shape for the vortex
        const spiralPoints = [];
        const turns = 3;
        const pointsPerTurn = 20;
        const totalPoints = turns * pointsPerTurn;
        const height = 3;
        
        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const angle = t * turns * Math.PI * 2;
            const radius = this.skill.radius * (1 - t * 0.8);
            
            spiralPoints.push(
                new THREE.Vector3(
                    Math.cos(angle) * radius,
                    t * height,
                    Math.sin(angle) * radius
                )
            );
        }
        
        // Create a tube geometry along the spiral
        const curve = new THREE.CatmullRomCurve3(spiralPoints);
        const tubeGeometry = new THREE.TubeGeometry(curve, totalPoints, 0.1, 8, false);
        
        // Create material with glow effect
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: this.vortexColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const vortexMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
        group.add(vortexMesh);
        
        // Store for animation
        this.vortexMesh = vortexMesh;
    }
    
    /**
     * Add energy rings to the effect
     * @param {THREE.Group} group - The group to add energy rings to
     */
    addEnergyRings(group) {
        const ringCount = 5;
        
        for (let i = 0; i < ringCount; i++) {
            const radius = this.skill.radius * (0.3 + i * 0.15);
            const height = i * 0.5;
            
            const ringGeometry = new THREE.RingGeometry(radius - 0.1, radius, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: this.vortexColor,
                transparent: true,
                opacity: 0.7 - i * 0.1,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2; // Lay flat
            ring.position.y = height;
            
            group.add(ring);
            
            // Store for animation
            this.energyRings.push({
                ring,
                initialHeight: height,
                rotationSpeed: 0.5 + i * 0.2,
                pulsePhase: i * Math.PI / ringCount
            });
        }
    }
    
    /**
     * Create a lightning bolt effect
     * @param {THREE.Vector3} startPosition - Start position of the lightning
     * @param {THREE.Vector3} endPosition - End position of the lightning
     * @returns {THREE.Line} - The created lightning bolt
     */
    createLightningBolt(startPosition, endPosition) {
        // Create a jagged line for lightning
        const segments = 10;
        const points = [];
        
        // Start point
        points.push(startPosition.clone());
        
        // Middle points with randomness
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            
            // Interpolate between start and end
            const point = new THREE.Vector3(
                startPosition.x + (endPosition.x - startPosition.x) * t,
                startPosition.y + (endPosition.y - startPosition.y) * t,
                startPosition.z + (endPosition.z - startPosition.z) * t
            );
            
            // Add randomness perpendicular to the line
            const perpX = -(endPosition.z - startPosition.z);
            const perpZ = endPosition.x - startPosition.x;
            const perpLength = Math.sqrt(perpX * perpX + perpZ * perpZ);
            
            if (perpLength > 0) {
                const randomOffset = (Math.random() - 0.5) * 0.5;
                point.x += (perpX / perpLength) * randomOffset;
                point.z += (perpZ / perpLength) * randomOffset;
            }
            
            // Add vertical randomness
            point.y += (Math.random() - 0.5) * 0.2;
            
            points.push(point);
        }
        
        // End point
        points.push(endPosition.clone());
        
        // Create geometry and material
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.lightningColor,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        
        const lightning = new THREE.Line(geometry, material);
        
        // Add to scene
        if (this.skill.game.scene) {
            this.skill.game.scene.add(lightning);
            
            // Store for animation and cleanup
            this.lightningBolts.push({
                bolt: lightning,
                creationTime: this.elapsedTime,
                duration: 0.2 + Math.random() * 0.3
            });
        }
        
        return lightning;
    }
    
    /**
     * Update the Tempest's Heart effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Rotate vortex
            if (this.vortexMesh) {
                this.vortexMesh.rotation.y += delta * 2;
            }
            
            // Animate energy rings
            this.energyRings.forEach(ringData => {
                const ring = ringData.ring;
                const initialHeight = ringData.initialHeight;
                const rotationSpeed = ringData.rotationSpeed;
                const pulsePhase = ringData.pulsePhase;
                
                // Rotate ring
                ring.rotation.z += delta * rotationSpeed;
                
                // Pulse size
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 5 + pulsePhase);
                ring.scale.set(pulseFactor, pulseFactor, 1);
                
                // Oscillate height
                ring.position.y = initialHeight + 0.1 * Math.sin(this.elapsedTime * 3 + pulsePhase);
            });
            
            // Create lightning bolts periodically
            this.lastLightningTime += delta;
            if (this.lastLightningTime >= this.lightningInterval) {
                this.createRandomLightning();
                this.lastLightningTime = 0;
            }
            
            // Update existing lightning bolts
            this.updateLightningBolts();
            
            // Apply damage to enemies
            this.applyDamage(delta);
        }
    }
    
    /**
     * Create random lightning bolts around the effect
     */
    createRandomLightning() {
        if (!this.effect || !this.skill.game.scene) return;
        
        // Create 1-3 lightning bolts
        const boltCount = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < boltCount; i++) {
            // Random angle
            const angle = Math.random() * Math.PI * 2;
            
            // Random radius within skill radius
            const radius = this.skill.radius * (0.3 + Math.random() * 0.7);
            
            // Start position (above the effect)
            const startPosition = new THREE.Vector3(
                this.effect.position.x,
                this.effect.position.y + 3 + Math.random() * 2,
                this.effect.position.z
            );
            
            // End position (on the ground at random point within radius)
            const endPosition = new THREE.Vector3(
                this.effect.position.x + Math.cos(angle) * radius,
                this.effect.position.y,
                this.effect.position.z + Math.sin(angle) * radius
            );
            
            // Create the lightning bolt
            this.createLightningBolt(startPosition, endPosition);
        }
    }
    
    /**
     * Update and remove expired lightning bolts
     */
    updateLightningBolts() {
        // Filter out expired lightning bolts
        const activeBolts = [];
        
        for (let i = 0; i < this.lightningBolts.length; i++) {
            const boltData = this.lightningBolts[i];
            const age = this.elapsedTime - boltData.creationTime;
            
            if (age < boltData.duration) {
                // Still active, update opacity based on age
                const opacity = 1 - (age / boltData.duration);
                boltData.bolt.material.opacity = opacity;
                
                activeBolts.push(boltData);
            } else {
                // Expired, remove from scene
                if (this.skill.game.scene) {
                    this.skill.game.scene.remove(boltData.bolt);
                }
                
                // Dispose resources
                boltData.bolt.geometry.dispose();
                boltData.bolt.material.dispose();
            }
        }
        
        // Update the list of active bolts
        this.lightningBolts = activeBolts;
    }
    
    /**
     * Apply damage to enemies within the effect
     * @param {number} delta - Time since last update in seconds
     */
    applyDamage(delta) {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
        // Get position for damage calculations
        // const damagePosition = this.effect.position.clone();
        
        // const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
        //     damagePosition,
        //     this.skill.radius
        // );
        
        // enemies.forEach(enemy => {
        //     // Apply damage
        //     enemy.takeDamage(this.skill.damage * delta);
            
        //     // Chance to create a lightning strike to the enemy
        //     if (Math.random() < delta * 2) {
        //         const enemyPosition = enemy.getPosition();
        //         if (enemyPosition) {
        //             // Start position (above the effect)
        //             const startPosition = new THREE.Vector3(
        //                 this.effect.position.x,
        //                 this.effect.position.y + 3,
        //                 this.effect.position.z
        //             );
                    
        //             // End position (at the enemy)
        //             const endPosition = new THREE.Vector3(
        //                 enemyPosition.x,
        //                 enemyPosition.y + 1,
        //                 enemyPosition.z
        //             );
                    
        //             // Create the lightning bolt
        //             this.createLightningBolt(startPosition, endPosition);
                    
        //             // Apply extra damage from lightning
        //             enemy.takeDamage(this.skill.damage * 0.5);
        //         }
        //     }
        // });
    }
    
    /**
     * Clean up resources when the effect is destroyed
     */
    destroy() {
        super.destroy();
        
        // Clean up lightning bolts
        this.lightningBolts.forEach(boltData => {
            if (this.skill.game.scene) {
                this.skill.game.scene.remove(boltData.bolt);
            }
            
            boltData.bolt.geometry.dispose();
            boltData.bolt.material.dispose();
        });
        
        this.lightningBolts = [];
    }
}