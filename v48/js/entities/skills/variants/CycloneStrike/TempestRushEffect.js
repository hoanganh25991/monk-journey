import * as THREE from 'three';
import { CycloneStrikeEffect } from '../../CycloneStrikeEffect.js';

/**
 * Effect for the Tempest Rush variant of Cyclone Strike
 * Creates a powerful cyclone that grants knockback immunity
 * Visual style: Intense wind currents and lightning arcs
 */
export class TempestRushEffect extends CycloneStrikeEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.knockbackImmunity = true;
        this.damageMultiplier = 1.2; // 20% more damage
        
        // Visual properties
        this.windStreams = [];
        this.lightningArcs = [];
        this.tempestColor = new THREE.Color(0x6495ED); // Cornflower blue
    }

    /**
     * Create the Tempest Rush effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Change the color of the base effect to tempest color
        effectGroup.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color = this.tempestColor.clone();
                    });
                } else {
                    child.material.color = this.tempestColor.clone();
                }
            }
        });
        
        // Add intense wind streams
        this.addWindStreams(effectGroup);
        
        // Add lightning arcs
        this.addLightningArcs(effectGroup);
        
        // Add energy shield to represent knockback immunity
        this.addEnergyShield(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add intense wind streams to the effect
     * @param {THREE.Group} group - The group to add wind streams to
     */
    addWindStreams(group) {
        const streamCount = 12;
        const baseRadius = this.skill.radius;
        
        for (let i = 0; i < streamCount; i++) {
            // Create a wind stream
            const stream = this.createWindStream();
            
            // Position in a spiral pattern
            const angle = (i / streamCount) * Math.PI * 2;
            const heightOffset = (i / streamCount) * 2; // Spiral upward
            
            stream.position.x = Math.cos(angle) * baseRadius * 0.7;
            stream.position.z = Math.sin(angle) * baseRadius * 0.7;
            stream.position.y = heightOffset * 0.5;
            
            // Rotate to follow the spiral
            stream.rotation.y = angle + Math.PI / 2;
            stream.rotation.x = Math.PI / 6; // Tilt upward
            
            // Store initial position for animation
            stream.userData.initialAngle = angle;
            stream.userData.radius = baseRadius * 0.7;
            stream.userData.height = heightOffset * 0.5;
            stream.userData.rotationSpeed = 1 + Math.random() * 0.5;
            
            group.add(stream);
            this.windStreams.push(stream);
        }
    }
    
    /**
     * Create a stylized wind stream using simple geometries
     * @returns {THREE.Group} - The created wind stream
     */
    createWindStream() {
        const streamGroup = new THREE.Group();
        
        // Create a curved path for the wind stream
        const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.5, 0.3, 0),
            new THREE.Vector3(1, 0.5, 0),
            new THREE.Vector3(1.5, 0.3, 0)
        );
        
        // Create geometry from the curve
        const points = curve.getPoints(20);
        const streamGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create material
        const streamMaterial = new THREE.LineBasicMaterial({
            color: this.tempestColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Create line
        const streamLine = new THREE.Line(streamGeometry, streamMaterial);
        streamGroup.add(streamLine);
        
        // Add small particles along the stream
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const point = curve.getPoint(t);
            
            const particleGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: this.tempestColor,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(point);
            
            // Store position along curve for animation
            particle.userData.curvePosition = t;
            particle.userData.speed = 1 + Math.random() * 1;
            
            streamGroup.add(particle);
        }
        
        return streamGroup;
    }
    
    /**
     * Add lightning arcs to the effect
     * @param {THREE.Group} group - The group to add lightning arcs to
     */
    addLightningArcs(group) {
        const arcCount = 5;
        const baseRadius = this.skill.radius * 0.6;
        
        for (let i = 0; i < arcCount; i++) {
            // Create a lightning arc
            const arc = this.createLightningArc();
            
            // Position randomly within the effect
            const angle = Math.random() * Math.PI * 2;
            arc.position.x = Math.cos(angle) * baseRadius * Math.random();
            arc.position.z = Math.sin(angle) * baseRadius * Math.random();
            arc.position.y = 0.5 + Math.random() * 1.5;
            
            // Random rotation
            arc.rotation.y = Math.random() * Math.PI * 2;
            
            // Store for animation
            arc.userData.lifespan = 0.3 + Math.random() * 0.3; // Short lifespan
            arc.userData.age = 0;
            arc.userData.nextPosition = {
                x: Math.cos(Math.random() * Math.PI * 2) * baseRadius * Math.random(),
                y: 0.5 + Math.random() * 1.5,
                z: Math.sin(Math.random() * Math.PI * 2) * baseRadius * Math.random()
            };
            
            group.add(arc);
            this.lightningArcs.push(arc);
        }
    }
    
    /**
     * Create a stylized lightning arc using simple geometries
     * @returns {THREE.Line} - The created lightning arc
     */
    createLightningArc() {
        // Create a jagged line for the lightning
        const points = [];
        const segmentCount = 10;
        const arcLength = 1 + Math.random() * 0.5;
        
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            const x = t * arcLength;
            const y = (Math.random() - 0.5) * 0.2;
            const z = (Math.random() - 0.5) * 0.2;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const arcMaterial = new THREE.LineBasicMaterial({
            color: 0xaaddff, // Light blue for lightning
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Line(arcGeometry, arcMaterial);
    }
    
    /**
     * Add an energy shield to represent knockback immunity
     * @param {THREE.Group} group - The group to add the shield to
     */
    addEnergyShield(group) {
        const shieldGeometry = new THREE.SphereGeometry(this.skill.radius * 0.9, 32, 32);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: this.tempestColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        group.add(shield);
        
        // Store for animation
        this.energyShield = shield;
    }
    
    /**
     * Update the Tempest Rush effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate wind streams
            this.windStreams.forEach(stream => {
                const initialAngle = stream.userData.initialAngle || 0;
                const radius = stream.userData.radius || 1;
                const height = stream.userData.height || 0;
                const rotationSpeed = stream.userData.rotationSpeed || 1;
                
                // Spiral inward and upward
                const newAngle = initialAngle + this.elapsedTime * rotationSpeed;
                const newRadius = radius * (1 - this.elapsedTime / (this.skill.duration * 1.5));
                
                stream.position.x = Math.cos(newAngle) * newRadius;
                stream.position.z = Math.sin(newAngle) * newRadius;
                stream.position.y = height + this.elapsedTime * 0.5;
                
                // Update rotation to follow the spiral
                stream.rotation.y = newAngle + Math.PI / 2;
                
                // Animate particles along the stream
                stream.children.forEach(child => {
                    if (child.userData.curvePosition !== undefined) {
                        const speed = child.userData.speed || 1;
                        let position = child.userData.curvePosition + delta * speed;
                        
                        // Loop back to start when reaching the end
                        if (position > 1) {
                            position = position % 1;
                        }
                        
                        // Update position along the curve
                        const curve = new THREE.CubicBezierCurve3(
                            new THREE.Vector3(0, 0, 0),
                            new THREE.Vector3(0.5, 0.3, 0),
                            new THREE.Vector3(1, 0.5, 0),
                            new THREE.Vector3(1.5, 0.3, 0)
                        );
                        
                        const point = curve.getPoint(position);
                        child.position.copy(point);
                        
                        // Store updated position
                        child.userData.curvePosition = position;
                    }
                });
            });
            
            // Animate lightning arcs
            this.lightningArcs.forEach((arc, index) => {
                arc.userData.age += delta;
                
                // If the arc has reached its lifespan, reset it
                if (arc.userData.age >= arc.userData.lifespan) {
                    // Remove old arc
                    this.effect.remove(arc);
                    
                    // Create a new arc
                    const newArc = this.createLightningArc();
                    
                    // Position at the next position
                    newArc.position.x = arc.userData.nextPosition.x;
                    newArc.position.y = arc.userData.nextPosition.y;
                    newArc.position.z = arc.userData.nextPosition.z;
                    
                    // Random rotation
                    newArc.rotation.y = Math.random() * Math.PI * 2;
                    
                    // Calculate next position
                    const baseRadius = this.skill.radius * 0.6;
                    const nextAngle = Math.random() * Math.PI * 2;
                    newArc.userData.lifespan = 0.3 + Math.random() * 0.3;
                    newArc.userData.age = 0;
                    newArc.userData.nextPosition = {
                        x: Math.cos(nextAngle) * baseRadius * Math.random(),
                        y: 0.5 + Math.random() * 1.5,
                        z: Math.sin(nextAngle) * baseRadius * Math.random()
                    };
                    
                    // Add to the effect
                    this.effect.add(newArc);
                    
                    // Update the array
                    this.lightningArcs[index] = newArc;
                }
            });
            
            // Animate energy shield
            if (this.energyShield) {
                // Pulse the shield
                const pulseFactor = 1 + 0.1 * Math.sin(this.elapsedTime * 5);
                this.energyShield.scale.set(pulseFactor, pulseFactor, pulseFactor);
                
                // Rotate the shield
                this.energyShield.rotation.y += delta * 0.2;
                this.energyShield.rotation.x += delta * 0.1;
            }
        }
    }
    
    /**
     * Override the damage application to apply increased damage
     * @param {Enemy} enemy - The enemy to damage
     * @param {number} amount - The amount of damage to deal
     */
    applyDamage(enemy, amount) {
        // Apply increased damage
        const enhancedDamage = amount * this.damageMultiplier;
        super.applyDamage(enemy, enhancedDamage);
    }
    
    /**
     * Apply knockback immunity to the player
     */
    applyKnockbackImmunity() {
        if (!this.skill.game || !this.skill.game.player || !this.knockbackImmunity) return;
        
        const player = this.skill.game.player;
        if (player && player.stats) {
            // Apply knockback immunity for the duration of the effect
            player.stats.addTemporaryBoost('knockbackResistance', 1, this.skill.duration);
            
            // Show a notification if available
            if (this.skill.game.hudManager && this.skill.game.hudManager.showNotification) {
                this.skill.game.hudManager.showNotification(`Knockback immunity granted for ${this.skill.duration} seconds!`);
            }
        }
    }
    
    /**
     * Override the activate method to apply knockback immunity
     */
    activate() {
        super.activate();
        this.applyKnockbackImmunity();
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.windStreams = [];
        this.lightningArcs = [];
        this.energyShield = null;
        
        // Call parent dispose
        super.dispose();
    }
}