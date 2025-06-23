import * as THREE from 'three';
import { ExplodingPalmEffect } from '../../ExplodingPalmEffect.js';

/**
 * Effect for the Shocking Palm variant of Exploding Palm
 * Adds a lightning effect that chains to nearby enemies upon explosion
 * Visual style: Electric arcs and lightning bolts
 */
export class ShockingPalmEffect extends ExplodingPalmEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.chainLightning = true;
        this.chainRange = 5; // Range to chain to other enemies
        this.chainCount = 3; // Number of enemies to chain to
        this.chainDamageMultiplier = 0.7; // 70% damage for chained targets
        
        // Visual properties
        this.lightningArcs = [];
        this.electricColor = new THREE.Color(0x00ffff); // Cyan electric color
        this.lightningBolts = [];
    }

    /**
     * Create the Shocking Palm effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to electric color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.electricColor.clone();
                    });
                } else {
                    child.material.color = this.electricColor.clone();
                }
            }
        });
        
        // Add electric arcs
        this.addElectricArcs(effectGroup);
        
        // Add lightning hand
        this.addLightningHand(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add electric arcs to the effect
     * @param {THREE.Group} group - The group to add electric arcs to
     */
    addElectricArcs(group) {
        const arcCount = 8;
        
        for (let i = 0; i < arcCount; i++) {
            // Create an electric arc
            const arc = this.createElectricArc();
            
            // Position randomly around the center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.skill.radius * 0.8;
            
            arc.position.x = Math.cos(angle) * radius;
            arc.position.z = Math.sin(angle) * radius;
            arc.position.y = Math.random() * 1.5;
            
            // Rotate randomly
            arc.rotation.x = Math.random() * Math.PI;
            arc.rotation.y = Math.random() * Math.PI;
            arc.rotation.z = Math.random() * Math.PI;
            
            // Store for animation
            arc.userData.lifespan = 0.2 + Math.random() * 0.3; // Short lifespan
            arc.userData.age = 0;
            
            group.add(arc);
            this.lightningArcs.push(arc);
        }
    }
    
    /**
     * Create a stylized electric arc using line segments
     * @returns {THREE.Line} - The created electric arc
     */
    createElectricArc() {
        const segmentCount = 10;
        const arcLength = 0.5 + Math.random() * 0.5;
        
        // Create jagged line for lightning
        const points = [];
        for (let i = 0; i < segmentCount; i++) {
            const t = i / (segmentCount - 1);
            const x = t * arcLength;
            const y = (Math.random() - 0.5) * 0.2;
            const z = (Math.random() - 0.5) * 0.2;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.electricColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Line(geometry, material);
    }
    
    /**
     * Add a lightning hand to the effect
     * @param {THREE.Group} group - The group to add the lightning hand to
     */
    addLightningHand(group) {
        // Create a stylized hand shape using boxes
        const handGroup = new THREE.Group();
        
        // Palm
        const palmGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.4);
        const palmMaterial = new THREE.MeshBasicMaterial({
            color: this.electricColor,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const palm = new THREE.Mesh(palmGeometry, palmMaterial);
        handGroup.add(palm);
        
        // Fingers
        const fingerCount = 5;
        const fingerPositions = [
            { x: -0.12, z: -0.15, length: 0.25, angle: -0.2 },
            { x: -0.04, z: -0.18, length: 0.3, angle: -0.1 },
            { x: 0.04, z: -0.18, length: 0.35, angle: 0 },
            { x: 0.12, z: -0.15, length: 0.3, angle: 0.1 },
            { x: 0.15, z: -0.05, length: 0.2, angle: 0.3 } // Thumb
        ];
        
        for (let i = 0; i < fingerCount; i++) {
            const pos = fingerPositions[i];
            const fingerGeometry = new THREE.BoxGeometry(0.06, 0.08, pos.length);
            const fingerMaterial = palmMaterial.clone();
            
            const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
            finger.position.x = pos.x;
            finger.position.z = pos.z - pos.length/2;
            finger.rotation.x = pos.angle;
            
            handGroup.add(finger);
        }
        
        // Add electric arcs between fingers
        for (let i = 0; i < fingerCount - 1; i++) {
            const arc = this.createElectricArc();
            arc.scale.set(0.5, 0.5, 0.5);
            
            // Position between fingers
            const pos1 = fingerPositions[i];
            const pos2 = fingerPositions[i + 1];
            
            arc.position.x = (pos1.x + pos2.x) / 2;
            arc.position.z = (pos1.z + pos2.z) / 2 - 0.1;
            
            // Rotate to connect fingers
            arc.rotation.y = Math.atan2(pos2.x - pos1.x, pos2.z - pos1.z);
            
            handGroup.add(arc);
        }
        
        // Position and rotate the hand
        handGroup.rotation.x = Math.PI / 2; // Palm facing down
        handGroup.position.y = 0.5;
        
        // Add to effect group
        group.add(handGroup);
        
        // Store for animation
        this.lightningHand = handGroup;
    }
    
    /**
     * Update the Shocking Palm effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Update existing arcs
            for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
                const arc = this.lightningArcs[i];
                
                // Age the arc
                arc.userData.age += delta;
                
                // Remove old arcs
                if (arc.userData.age > arc.userData.lifespan) {
                    this.effect.remove(arc);
                    this.lightningArcs.splice(i, 1);
                    
                    // Create a new arc to replace it
                    const newArc = this.createElectricArc();
                    
                    // Position randomly
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * this.skill.radius * 0.8;
                    
                    newArc.position.x = Math.cos(angle) * radius;
                    newArc.position.z = Math.sin(angle) * radius;
                    newArc.position.y = Math.random() * 1.5;
                    
                    // Rotate randomly
                    newArc.rotation.x = Math.random() * Math.PI;
                    newArc.rotation.y = Math.random() * Math.PI;
                    newArc.rotation.z = Math.random() * Math.PI;
                    
                    // Store for animation
                    newArc.userData.lifespan = 0.2 + Math.random() * 0.3;
                    newArc.userData.age = 0;
                    
                    this.effect.add(newArc);
                    this.lightningArcs.push(newArc);
                }
            }
            
            // Animate lightning hand
            if (this.lightningHand) {
                // Pulse the hand
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 10);
                this.lightningHand.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Flicker the opacity for electric effect
                this.lightningHand.traverse(child => {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.opacity = 0.5 + Math.random() * 0.5;
                            });
                        } else {
                            child.material.opacity = 0.5 + Math.random() * 0.5;
                        }
                    }
                });
            }
            
            // Update lightning bolts
            for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
                const bolt = this.lightningBolts[i];
                
                // Age the bolt
                bolt.userData.age += delta;
                
                // Remove old bolts
                if (bolt.userData.age > bolt.userData.lifespan) {
                    if (bolt.parent) {
                        bolt.parent.remove(bolt);
                    }
                    this.lightningBolts.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Create a lightning bolt between two points
     * @param {THREE.Vector3} start - Start position
     * @param {THREE.Vector3} end - End position
     * @returns {THREE.Line} - The created lightning bolt
     */
    createLightningBolt(start, end) {
        const segmentCount = 10;
        const direction = end.clone().sub(start);
        const length = direction.length();
        
        // Create jagged line for lightning
        const points = [];
        for (let i = 0; i < segmentCount; i++) {
            const t = i / (segmentCount - 1);
            
            // Calculate position along the line
            const pos = start.clone().add(direction.clone().multiplyScalar(t));
            
            // Add randomness perpendicular to the line
            if (i > 0 && i < segmentCount - 1) {
                const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
                const jitter = (Math.random() - 0.5) * length * 0.2;
                pos.add(perpendicular.multiplyScalar(jitter));
                
                // Add some vertical randomness
                pos.y += (Math.random() - 0.5) * length * 0.1;
            }
            
            points.push(pos);
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.electricColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const bolt = new THREE.Line(geometry, material);
        
        // Store lifespan for animation
        bolt.userData.lifespan = 0.3; // Short lifespan
        bolt.userData.age = 0;
        
        return bolt;
    }
    
    /**
     * Apply chain lightning effect when an enemy dies
     * @param {Enemy} deadEnemy - The enemy that died
     */
    applyChainLightning(deadEnemy) {
        if (!this.chainLightning || !this.skill.game || !this.skill.game.enemyManager) return;
        
        // Get position of the dead enemy
        const deadEnemyPosition = deadEnemy.getPosition();
        if (!deadEnemyPosition) return;
        
        // Find nearby enemies to chain to
        const nearbyEnemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            deadEnemyPosition,
            this.chainRange
        );
        
        // Filter out the dead enemy
        const chainTargets = nearbyEnemies.filter(enemy => enemy !== deadEnemy);
        
        // Limit to maximum chain count
        const targets = chainTargets.slice(0, this.chainCount);
        
        // Apply damage and create visual effects
        targets.forEach(enemy => {
            // IMPORTANT: THIS CHECKED BY COLLISIONMANAGER
            // Apply chain damage
            // const chainDamage = this.skill.damage * this.chainDamageMultiplier;
            // enemy.takeDamage(chainDamage);
            
            // Create lightning bolt effect
            const enemyPosition = enemy.getPosition();
            if (enemyPosition) {
                const bolt = this.createLightningBolt(deadEnemyPosition, enemyPosition);
                this.skill.game.scene.add(bolt);
                this.lightningBolts.push(bolt);
            }
        });
    }
    
    /**
     * Override the explosion handler to add chain lightning
     * @param {Enemy} enemy - The enemy that exploded
     */
    handleEnemyExplosion(enemy) {
        // Call parent method first
        super.handleEnemyExplosion(enemy);
        
        // Apply chain lightning effect
        this.applyChainLightning(enemy);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.lightningArcs = [];
        this.lightningBolts.forEach(bolt => {
            if (bolt.parent) {
                bolt.parent.remove(bolt);
            }
        });
        this.lightningBolts = [];
        
        // Call parent dispose
        super.dispose();
    }
}