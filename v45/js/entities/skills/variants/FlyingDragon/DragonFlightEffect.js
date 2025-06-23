import * as THREE from 'three';
import { FlyingDragonEffect } from '../../FlyingDragonEffect.js';

/**
 * Effect for the Dragon's Flight variant of Flying Dragon
 * Increases the distance and speed of the flight
 * Visual style: Streamlined air currents and motion blur
 */
export class DragonFlightEffect extends FlyingDragonEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.distanceMultiplier = 1.5; // 50% more distance
        this.speedMultiplier = 1.7; // 70% more speed
        
        // Visual properties
        this.airStreams = [];
        this.motionBlur = null;
        this.airColor = new THREE.Color(0xaaffff); // Light blue air color
    }

    /**
     * Create the Dragon's Flight effect
     * @param {THREE.Vector3} position - Position to create the effect at
     * @param {THREE.Vector3} direction - Direction the effect should face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create base effect first
        const effectGroup = super.create(position, direction);
        
        // Add air streams
        this.addAirStreams(effectGroup);
        
        // Add motion blur
        this.addMotionBlur(effectGroup);
        
        return effectGroup;
    }
    
    /**
     * Add air streams to the effect
     * @param {THREE.Group} group - The group to add air streams to
     */
    addAirStreams(group) {
        const streamCount = 6;
        
        for (let i = 0; i < streamCount; i++) {
            // Create an air stream
            const stream = this.createAirStream();
            
            // Position behind the player
            stream.position.z = -1 - i * 0.5;
            
            // Offset to the sides
            const offset = (i % 2 === 0) ? 0.3 : -0.3;
            stream.position.x = offset;
            
            // Store for animation
            stream.userData.index = i;
            stream.userData.offset = offset;
            
            group.add(stream);
            this.airStreams.push(stream);
        }
    }
    
    /**
     * Create a stylized air stream using simple geometries
     * @returns {THREE.Group} - The created air stream
     */
    createAirStream() {
        const streamGroup = new THREE.Group();
        
        // Create main stream shape
        const streamGeometry = new THREE.PlaneGeometry(0.5, 2.0);
        const streamMaterial = new THREE.MeshBasicMaterial({
            color: this.airColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const stream = new THREE.Mesh(streamGeometry, streamMaterial);
        streamGroup.add(stream);
        
        // Add some smaller streams
        const smallStreamCount = 3;
        for (let i = 0; i < smallStreamCount; i++) {
            const smallGeometry = new THREE.PlaneGeometry(0.2, 1.0);
            const smallMaterial = streamMaterial.clone();
            smallMaterial.opacity = 0.3;
            
            const smallStream = new THREE.Mesh(smallGeometry, smallMaterial);
            
            // Position along the main stream
            smallStream.position.y = (i / smallStreamCount - 0.5) * 1.5;
            smallStream.position.x = (Math.random() - 0.5) * 0.3;
            
            // Rotate slightly
            smallStream.rotation.z = (Math.random() - 0.5) * 0.2;
            
            streamGroup.add(smallStream);
        }
        
        return streamGroup;
    }
    
    /**
     * Add motion blur to the effect
     * @param {THREE.Group} group - The group to add motion blur to
     */
    addMotionBlur(group) {
        // Create a series of transparent planes to simulate motion blur
        const blurCount = 5;
        const blurGroup = new THREE.Group();
        
        for (let i = 0; i < blurCount; i++) {
            // Create a plane that follows the player's silhouette
            const blurGeometry = new THREE.PlaneGeometry(0.8, 1.5);
            const blurMaterial = new THREE.MeshBasicMaterial({
                color: this.airColor,
                transparent: true,
                opacity: 0.2 - (i * 0.03),
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const blurPlane = new THREE.Mesh(blurGeometry, blurMaterial);
            
            // Position behind the player
            blurPlane.position.z = -0.2 - (i * 0.2);
            
            blurGroup.add(blurPlane);
        }
        
        group.add(blurGroup);
        this.motionBlur = blurGroup;
    }
    
    /**
     * Update the Dragon's Flight effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        super.update(delta);
        
        if (this.isActive && this.effect) {
            // Animate air streams
            this.airStreams.forEach(stream => {
                const index = stream.userData.index || 0;
                const offset = stream.userData.offset || 0;
                
                // Move streams backward to create the illusion of forward movement
                stream.position.z -= delta * 5 * this.speedMultiplier;
                
                // Reset streams that go too far back
                if (stream.position.z < -10) {
                    stream.position.z = 0;
                }
                
                // Wave motion
                stream.position.x = offset + Math.sin(this.elapsedTime * 3 + index) * 0.1;
                stream.rotation.z = Math.sin(this.elapsedTime * 2 + index) * 0.1;
                
                // Scale based on speed
                const scaleFactor = 1 + Math.sin(this.elapsedTime * 5) * 0.1;
                stream.scale.set(1, scaleFactor, 1);
            });
            
            // Animate motion blur
            if (this.motionBlur) {
                // Pulse the blur based on speed
                const pulseFactor = 1 + Math.sin(this.elapsedTime * 8) * 0.2;
                this.motionBlur.scale.set(pulseFactor, 1, 1);
                
                // Rotate slightly for dynamic effect
                this.motionBlur.rotation.z = Math.sin(this.elapsedTime * 3) * 0.05;
            }
        }
    }
    
    /**
     * Override the movement method to increase distance and speed
     * @param {number} delta - Time since last update in seconds
     */
    updateMovement(delta) {
        if (!this.isActive || !this.skill.game || !this.skill.game.player) return;
        
        // Get the player
        const player = this.skill.game.player;
        
        // Apply increased speed and distance
        if (player.moveInDirection) {
            const direction = player.getDirection();
            if (direction) {
                // Apply speed multiplier to movement
                player.moveInDirection(
                    direction,
                    this.skill.moveSpeed * this.speedMultiplier,
                    delta
                );
                
                // Adjust the total distance traveled
                this.distanceTraveled += this.skill.moveSpeed * this.speedMultiplier * delta;
                
                // Check if we've reached the maximum distance (with multiplier)
                if (this.distanceTraveled >= this.skill.maxDistance * this.distanceMultiplier) {
                    this.endEffect();
                }
            }
        }
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clear arrays
        this.airStreams = [];
        this.motionBlur = null;
        
        // Call parent dispose
        super.dispose();
    }
}