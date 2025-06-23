import * as THREE from 'three';
import { SkillEffect } from './SkillEffect.js';

/**
 * Specialized effect for Seven-Sided Strike skill
 */
export class SevenSidedStrikeEffect extends SkillEffect {
    constructor(skill) {
        super(skill);
        this.direction = new THREE.Vector3(0, 0, 1); // Default forward direction
        this.sevenSidedStrikeState = null;
    }

    /**
     * Create a Seven-Sided Strike effect
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to face
     * @returns {THREE.Group} - The created effect
     */
    create(position, direction) {
        // Create a group for the effect
        const effectGroup = new THREE.Group();
        
        // Store the direction vector
        this.direction = direction.clone();
        
        // Create the Seven-Sided Strike effect
        this._createSevenSidedStrikeEffect(effectGroup, position, direction);
        
        // Position effect
        effectGroup.position.copy(position);
        
        // Store effect
        this.effect = effectGroup;
        this.isActive = true;
        
        return effectGroup;
    }

    /**
     * Create the Seven-Sided Strike effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Starting position
     * @param {THREE.Vector3} direction - Direction to face
     * @private
     */
    _createSevenSidedStrikeEffect(effectGroup, position, direction) {
        // Create the main monk figure (will be cloned for each strike)
        const monkGroup = new THREE.Group();
        
        // Monk body (simplified)
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc8844, // Monk robe color
            metalness: 0.2,
            roughness: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5; // Position at half height
        monkGroup.add(body);
        
        // Monk head
        const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xd2b48c, // Tan skin color
            metalness: 0.1,
            roughness: 0.9
        });
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.0; // Position above body
        monkGroup.add(head);
        
        // Monk arms
        const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0xd2b48c, // Tan skin color
            metalness: 0.1,
            roughness: 0.9
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.25, 0.7, 0);
        leftArm.rotation.z = Math.PI / 4; // Angle arm outward
        monkGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.25, 0.7, 0);
        rightArm.rotation.z = -Math.PI / 4; // Angle arm outward
        monkGroup.add(rightArm);
        
        // Monk fist (right hand) with energy effect
        const fistGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const fistMaterial = new THREE.MeshStandardMaterial({
            color: 0xd2b48c, // Tan skin color
            metalness: 0.1,
            roughness: 0.9
        });
        
        const fist = new THREE.Mesh(fistGeometry, fistMaterial);
        fist.position.set(0.4, 0.7, 0);
        monkGroup.add(fist);
        
        // Energy around fist
        const energyGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const energyMaterial = new THREE.MeshStandardMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.7,
            emissive: this.skill.color,
            emissiveIntensity: 1.0
        });
        
        const energy = new THREE.Mesh(energyGeometry, energyMaterial);
        energy.position.set(0.4, 0.7, 0);
        monkGroup.add(energy);
        
        // Hide the monk initially
        monkGroup.visible = false;
        
        // Create strike points in a heptagon (7-sided) pattern
        const strikePoints = [];
        const radius = this.skill.radius || 5;
        
        for (let i = 0; i < this.skill.hits; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create a marker for each strike point
            const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const markerMaterial = new THREE.MeshBasicMaterial({
                color: this.skill.color,
                transparent: true,
                opacity: 0.5
            });
            
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(x, 0.1, z);
            marker.visible = false; // Hide initially
            
            effectGroup.add(marker);
            
            strikePoints.push({
                position: new THREE.Vector3(x, 0, z),
                mesh: marker,
                visited: false
            });
        }
        
        // Create a central vortex effect
        const vortexGeometry = new THREE.RingGeometry(0.5, 2, 32);
        const vortexMaterial = new THREE.MeshBasicMaterial({
            color: this.skill.color,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortex.rotation.x = -Math.PI / 2; // Lay flat
        vortex.position.y = -2.5; // On the ground
        
        // Store rotation data for animation
        vortex.userData = {
            rotationSpeed: 2.0
        };
        
        effectGroup.add(vortex);
        
        // Store animation state
        this.sevenSidedStrikeState = {
            currentStrike: -1,
            strikeDuration: this.skill.duration / this.skill.hits / 5 ,
            strikeTimer: 0,
            vortex: vortex,
            monkTemplate: monkGroup,
            strikePoints: strikePoints,
            activeMonks: [],
            connectingLines: [],
            flashEffects: []
        };
    }

    /**
     * Update the Seven-Sided Strike effect
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        if (!this.isActive || !this.effect) return;
        
        this.elapsedTime += delta;
        
        // Check if effect has expired
        if (this.elapsedTime >= this.skill.duration) {
            this.isActive = false;
            this.dispose(); // Properly dispose of the effect when it expires
            return;
        }
        
        // IMPORTANT: Update the skill's position property to match the effect's position
        // This is crucial for collision detection in CollisionManager
        this.skill.position.copy(this.effect.position);
        
        // Update the Seven-Sided Strike effect
        this._updateSevenSidedStrikeEffect(delta);
    }
    
    /**
     * Update the Seven-Sided Strike effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateSevenSidedStrikeEffect(delta) {
        // Update the strike timer
        this.sevenSidedStrikeState.strikeTimer += delta;
        
        // Calculate which strike should be active
        const newStrikeIndex = Math.floor(this.elapsedTime / this.sevenSidedStrikeState.strikeDuration);
        
        // If we've moved to a new strike
        if (newStrikeIndex !== this.sevenSidedStrikeState.currentStrike) {
            // Update current strike index
            this.sevenSidedStrikeState.currentStrike = newStrikeIndex;
            this.sevenSidedStrikeState.strikeTimer = 0;
            
            // Find all monk figures (they're the ones with userData.index)
            const monkFigures = [];
            const connectingLines = [];
            
            for (let i = 0; i < this.effect.children.length; i++) {
                const child = this.effect.children[i];
                if (child.userData && child.userData.index !== undefined) {
                    monkFigures.push(child);
                }
                if (child.userData && child.userData.isConnectingLine) {
                    connectingLines.push(child);
                }
            }
            
            // Deactivate all monks
            for (const monk of monkFigures) {
                monk.userData.active = false;
            }
            
            // Remove all connecting lines
            for (const line of connectingLines) {
                this.effect.remove(line);
            }
            this.sevenSidedStrikeState.connectingLines = [];
            
            // Choose next strike point
            let nextPoint = null;
            const unvisitedPoints = this.sevenSidedStrikeState.strikePoints.filter(p => !p.visited);
            
            if (unvisitedPoints.length > 0) {
                // Choose a random unvisited point
                nextPoint = unvisitedPoints[Math.floor(Math.random() * unvisitedPoints.length)];
                nextPoint.visited = true;
            } else {
                // All points visited, reset and choose any point
                for (const point of this.sevenSidedStrikeState.strikePoints) {
                    point.visited = false;
                }
                nextPoint = this.sevenSidedStrikeState.strikePoints[
                    Math.floor(Math.random() * this.sevenSidedStrikeState.strikePoints.length)
                ];
                nextPoint.visited = true;
            }
            
            // Show the marker for this point
            if (nextPoint.mesh) {
                nextPoint.mesh.visible = true;
                
                // Make it pulse
                nextPoint.mesh.userData = {
                    ...nextPoint.mesh.userData,
                    pulseTime: 0,
                    pulseSpeed: 3.0
                };
                
                // Create a flash effect at the strike point
                const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
                const flashMaterial = new THREE.MeshBasicMaterial({
                    color: this.skill.color,
                    transparent: true,
                    opacity: 1.0
                });
                
                const flash = new THREE.Mesh(flashGeometry, flashMaterial);
                flash.position.copy(nextPoint.position);
                flash.position.y = 0.5;
                flash.scale.set(0.1, 0.1, 0.1);
                
                // Store animation data
                flash.userData = {
                    age: 0,
                    maxAge: 0.3,
                    isFlash: true
                };
                
                this.effect.add(flash);
                this.sevenSidedStrikeState.flashEffects.push(flash);
                
                // Create a monk at this point
                const monk = this.sevenSidedStrikeState.monkTemplate.clone();
                monk.position.copy(nextPoint.position);
                monk.position.y = 0; // On the ground
                
                // Face toward center
                const direction = new THREE.Vector3();
                direction.subVectors(this.effect.position, nextPoint.position).normalize();
                monk.rotation.y = Math.atan2(direction.x, direction.z);
                
                // Store data
                monk.userData = {
                    index: newStrikeIndex,
                    active: true,
                    age: 0,
                    maxAge: this.sevenSidedStrikeState.strikeDuration * 8
                };
                
                monk.visible = true;
                this.effect.add(monk);
                
                // Create a connecting line from center to strike point - using a tube geometry for thicker lines
                const startPoint = new THREE.Vector3(0, 0.1, 0);
                const endPoint = new THREE.Vector3(nextPoint.position.x, 0.1, nextPoint.position.z);
                
                // Create a path for the tube
                const path = new THREE.LineCurve3(startPoint, endPoint);
                
                // Create a tube geometry with radius 0.05 (3x thicker than default line)
                const lineGeometry = new THREE.TubeGeometry(path, 1, 0.05, 8, false);
                
                const lineMaterial = new THREE.MeshBasicMaterial({
                    color: this.skill.color,
                    transparent: true,
                    opacity: 0.7
                });
                
                // Create a mesh instead of a line
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.userData = {
                    isConnectingLine: true,
                    age: 0,
                    maxAge: this.sevenSidedStrikeState.strikeDuration
                };
                
                this.effect.add(line);
                this.sevenSidedStrikeState.connectingLines.push(line);
            }
        }
        
        // Update vortex rotation
        if (this.sevenSidedStrikeState.vortex) {
            this.sevenSidedStrikeState.vortex.rotation.z += 
                this.sevenSidedStrikeState.vortex.userData.rotationSpeed * delta;
        }
        
        // Update active monks
        for (let i = 0; i < this.effect.children.length; i++) {
            const child = this.effect.children[i];
            
            // Update monk figures
            if (child.userData && child.userData.index !== undefined) {
                child.userData.age += delta;
                
                // Fade out monk when it gets old
                if (child.userData.age > child.userData.maxAge) {
                    child.visible = false;
                }
            }
            
            // Update connecting lines
            if (child.userData && child.userData.isConnectingLine) {
                child.userData.age += delta;
                
                // Fade out line over time
                const lineProgress = child.userData.age / child.userData.maxAge;
                child.material.opacity = 0.7 * (1 - lineProgress);
                
                if (lineProgress >= 1) {
                    this.effect.remove(child);
                    this.sevenSidedStrikeState.connectingLines = 
                        this.sevenSidedStrikeState.connectingLines.filter(line => line !== child);
                }
            }
            
            // Update flash effects
            if (child.userData && child.userData.isFlash) {
                child.userData.age += delta;
                
                // Expand and fade out
                const flashProgress = child.userData.age / child.userData.maxAge;
                const scale = 0.1 + flashProgress * 2;
                child.scale.set(scale, scale, scale);
                child.material.opacity = 1 - flashProgress;
                
                if (flashProgress >= 1) {
                    this.effect.remove(child);
                    this.sevenSidedStrikeState.flashEffects = 
                        this.sevenSidedStrikeState.flashEffects.filter(flash => flash !== child);
                }
            }
            
            // Update marker pulses
            if (child.userData && child.userData.pulseTime !== undefined) {
                child.userData.pulseTime += delta;
                
                // Pulse size
                const pulseScale = 1 + 0.3 * Math.sin(child.userData.pulseTime * child.userData.pulseSpeed);
                child.scale.set(pulseScale, pulseScale, pulseScale);
                
                // Hide markers after a while
                if (child.userData.pulseTime > 0.5) {
                    child.visible = false;
                }
            }
        }
    }

    /**
     * Enhanced dispose method to properly clean up all resources
     * Overrides the base class dispose method with more thorough cleanup
     */
    dispose() {
        if (!this.effect) return;
        
        // Clean up Seven-Sided Strike specific resources
        if (this.sevenSidedStrikeState) {
            // Clear references
            this.sevenSidedStrikeState.activeMonks = [];
            this.sevenSidedStrikeState.connectingLines = [];
            this.sevenSidedStrikeState.flashEffects = [];
            
            // Clear strike points
            if (this.sevenSidedStrikeState.strikePoints) {
                for (const point of this.sevenSidedStrikeState.strikePoints) {
                    point.position = null;
                    point.mesh = null;
                }
                this.sevenSidedStrikeState.strikePoints = [];
            }
            
            // Clear state
            this.sevenSidedStrikeState = null;
        }
        
        // Recursively dispose of geometries and materials
        this.effect.traverse(child => {
            // Dispose of geometries
            if (child.geometry) {
                child.geometry.dispose();
            }
            
            // Dispose of materials
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        // Dispose of any textures
                        if (material.map) material.map.dispose();
                        if (material.normalMap) material.normalMap.dispose();
                        if (material.specularMap) material.specularMap.dispose();
                        if (material.emissiveMap) material.emissiveMap.dispose();
                        
                        // Dispose of the material itself
                        material.dispose();
                    });
                } else {
                    // Dispose of any textures
                    if (child.material.map) child.material.map.dispose();
                    if (child.material.normalMap) child.material.normalMap.dispose();
                    if (child.material.specularMap) child.material.specularMap.dispose();
                    if (child.material.emissiveMap) child.material.emissiveMap.dispose();
                    
                    // Dispose of the material itself
                    child.material.dispose();
                }
            }
            
            // Clear any userData
            if (child.userData) {
                child.userData = {};
            }
        });
        
        // Remove from parent
        if (this.effect.parent) {
            this.effect.parent.remove(this.effect);
        }
        
        // Clear references
        this.effect = null;
        this.isActive = false;
    }
    
    /**
     * Override the reset method to properly clean up all resources
     */
    reset() {
        // Call the dispose method to clean up resources
        this.dispose();
        
        // Reset state variables
        this.isActive = false;
        this.elapsedTime = 0;
        this.direction.set(0, 0, 1);
    }
}