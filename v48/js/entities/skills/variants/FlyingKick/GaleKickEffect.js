import * as THREE from 'three';
import { FlyingKickEffect } from '../../FlyingKickEffect.js';

/**
 * Effect for the Gale Kick variant of Flying Kick
 * Increases the speed and distance of the kick, allowing for rapid repositioning
 * Visual style: Wind streaks and speed lines
 */
export class GaleKickEffect extends FlyingKickEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.speedMultiplier = 1.5; // 50% faster
        this.rangeMultiplier = 1.5; // 50% longer range
        
        // Apply multipliers to the skill
        this.originalKickSpeed = this.skill.kickSpeed;
        this.originalRange = this.skill.range;
        this.skill.kickSpeed *= this.speedMultiplier;
        this.skill.range *= this.rangeMultiplier;
        
        // Visual properties
        this.speedLines = [];
        this.windColor = new THREE.Color(0xccffcc);
    }

    /**
     * Create the Gale Kick effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Add speed lines
        this.addSpeedLines(effectGroup);
        
        // Add wind trail
        this.addWindTrail(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add speed lines to the effect
     * @param {THREE.Group} group - The group to add speed lines to
     */
    addSpeedLines(group) {
        const lineCount = 10;
        
        for (let i = 0; i < lineCount; i++) {
            // Create a line geometry
            const lineGeometry = new THREE.BufferGeometry();
            const linePoints = [];
            
            // Create a line with random offset
            const lineLength = 5 + Math.random() * 5;
            const xOffset = (Math.random() - 0.5) * 1.5;
            const yOffset = (Math.random() - 0.5) * 1.5;
            
            linePoints.push(
                new THREE.Vector3(xOffset, yOffset, 0),
                new THREE.Vector3(xOffset, yOffset, -lineLength)
            );
            
            lineGeometry.setFromPoints(linePoints);
            
            const lineMaterial = new THREE.LineBasicMaterial({
                color: this.windColor,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            
            // Store initial properties for animation
            line.userData.initialZ = -lineLength;
            line.userData.speed = 10 + Math.random() * 10;
            
            group.add(line);
            this.speedLines.push(line);
        }
    }
    
    /**
     * Add wind trail to the effect
     * @param {THREE.Group} group - The group to add the wind trail to
     */
    addWindTrail(group) {
        // Create a particle system for the wind trail
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in a cone behind the monk
            const angle = (Math.random() - 0.5) * Math.PI / 4; // Narrow cone
            const distance = Math.random() * 10;
            
            positions[i * 3] = Math.sin(angle) * distance * 0.5; // Narrow in x
            positions[i * 3 + 1] = (Math.random() - 0.5) * distance * 0.5; // Narrow in y
            positions[i * 3 + 2] = -distance; // Extend backward
            
            // Random sizes
            sizes[i] = 0.05 + Math.random() * 0.1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: this.windColor,
            size: 0.1,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Store for animation
        this.windTrail = particles;
    }
    
    /**
     * Update the Gale Kick effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Update speed lines
            this.speedLines.forEach(line => {
                if (line.geometry && line.geometry.attributes && line.geometry.attributes.position) {
                    const positions = line.geometry.attributes.position.array;
                    
                    // Move the line forward
                    positions[5] += line.userData.speed * delta; // Update z of second point
                    
                    // If the line is too short, reset it
                    if (positions[5] > -1) {
                        const newLength = 5 + Math.random() * 5;
                        positions[5] = line.userData.initialZ;
                    }
                    
                    line.geometry.attributes.position.needsUpdate = true;
                }
            });
            
            // Update wind trail
            if (this.windTrail && this.windTrail.geometry) {
                const positions = this.windTrail.geometry.attributes.position.array;
                const count = positions.length / 3;
                
                for (let i = 0; i < count; i++) {
                    // Move particles forward
                    positions[i * 3 + 2] += delta * 5;
                    
                    // If particle moves too far forward, reset it
                    if (positions[i * 3 + 2] > 0) {
                        const angle = (Math.random() - 0.5) * Math.PI / 4;
                        const distance = Math.random() * 10;
                        
                        positions[i * 3] = Math.sin(angle) * distance * 0.5;
                        positions[i * 3 + 1] = (Math.random() - 0.5) * distance * 0.5;
                        positions[i * 3 + 2] = -distance;
                    }
                }
                
                this.windTrail.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
    
    /**
     * Reset the effect
     * Restores original skill properties
     */
    reset() {
        // Restore original skill properties
        this.skill.kickSpeed = this.originalKickSpeed;
        this.skill.range = this.originalRange;
        
        // Call parent reset
        super.reset();
        
        // Re-apply multipliers for next use
        this.skill.kickSpeed *= this.speedMultiplier;
        this.skill.range *= this.rangeMultiplier;
        
        return this;
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Restore original skill properties
        this.skill.kickSpeed = this.originalKickSpeed;
        this.skill.range = this.originalRange;
        
        // Clean up speed lines
        this.speedLines.forEach(line => {
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        });
        this.speedLines = [];
        
        // Clean up wind trail
        this.windTrail = null;
        
        // Call parent dispose
        super.dispose();
    }
}