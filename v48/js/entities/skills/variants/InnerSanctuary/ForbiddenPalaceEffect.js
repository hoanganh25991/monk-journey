import * as THREE from 'three';
import { InnerSanctuaryEffect } from '../../InnerSanctuaryEffect.js';

/**
 * Effect for the Forbidden Palace variant of Inner Sanctuary
 * Enemies within the sanctuary have their movement speed reduced
 * Visual style: Dark purple/blue sanctuary with binding runes and slow-time effects
 */
export class ForbiddenPalaceEffect extends InnerSanctuaryEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.speedReductionFactor = 0.7; // Reduce enemy speed by 70%
        this.affectedEnemies = new Map(); // Track affected enemies
        
        // Visual properties
        this.bindingRunes = [];
        this.slowTimeEffects = [];
        this.boundaryWalls = [];
    }

    /**
     * Create the Inner Sanctuary effect
     * @param {THREE.Group} effectGroup - Group to add the effect to
     * @param {THREE.Vector3} position - Player position
     * @private
     */
    _createInnerSanctuaryEffect(effectGroup, position) {
        // Call the parent method to create the base sanctuary
        super._createInnerSanctuaryEffect(effectGroup, position);
        
        // Get the sanctuary group (first child of effect group)
        const sanctuaryGroup = effectGroup.children[0];
        
        // Modify the base sanctuary colors to dark purple/blue
        this._modifySanctuaryColors(sanctuaryGroup);
        
        // Add binding runes
        this._addBindingRunes(sanctuaryGroup);
        
        // Add slow-time effects
        this._addSlowTimeEffects(sanctuaryGroup);
        
        // Add boundary walls
        this._addBoundaryWalls(sanctuaryGroup);
    }
    
    /**
     * Modify the sanctuary colors to dark purple/blue
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to modify
     * @private
     */
    _modifySanctuaryColors(sanctuaryGroup) {
        // Define the forbidden color (dark purple/blue)
        const forbiddenColor = new THREE.Color(0x3311aa);
        
        // Traverse all children and modify materials
        sanctuaryGroup.traverse(child => {
            if (child.material) {
                // Check if it's a mesh
                if (child instanceof THREE.Mesh) {
                    // Clone the material to avoid affecting other instances
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone());
                    } else {
                        child.material = child.material.clone();
                    }
                    
                    // Modify the material color and emissive
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color.set(forbiddenColor);
                            mat.emissive.set(forbiddenColor);
                        });
                    } else {
                        child.material.color.set(forbiddenColor);
                        child.material.emissive.set(forbiddenColor);
                    }
                }
            }
        });
    }
    
    /**
     * Add binding runes to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add runes to
     * @private
     */
    _addBindingRunes(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const runeCount = 6;
        
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const runeRadius = baseRadius * 0.8;
            
            // Create a binding rune
            const runeGeometry = new THREE.PlaneGeometry(1.0, 1.0);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0x6633cc,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune
            rune.position.set(
                Math.cos(angle) * runeRadius,
                0.1, // Just above ground
                Math.sin(angle) * runeRadius
            );
            
            // Rotate rune to lay flat
            rune.rotation.x = -Math.PI / 2;
            
            // Store animation data
            rune.userData = {
                initialY: rune.position.y,
                pulseSpeed: 0.5 + Math.random() * 0.5,
                rotationSpeed: 0.3 + Math.random() * 0.3
            };
            
            sanctuaryGroup.add(rune);
            this.bindingRunes.push(rune);
        }
    }
    
    /**
     * Add slow-time effects to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add effects to
     * @private
     */
    _addSlowTimeEffects(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        
        // Create a time distortion effect (concentric rings)
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const radius = baseRadius * (0.3 + i * 0.2);
            const ringGeometry = new THREE.RingGeometry(radius - 0.1, radius, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x6633cc,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -Math.PI / 2; // Lay flat
            ring.position.y = 0.05 + i * 0.05; // Stack slightly above each other
            
            // Store animation data
            ring.userData = {
                rotationSpeed: 0.1 - (i * 0.03), // Outer rings rotate slower
                pulseSpeed: 0.2 + (i * 0.1)
            };
            
            sanctuaryGroup.add(ring);
            this.slowTimeEffects.push(ring);
        }
        
        // Create a time distortion dome
        const domeGeometry = new THREE.SphereGeometry(baseRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshBasicMaterial({
            color: 0x3311aa,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 0; // At ground level
        
        // Store animation data
        dome.userData = {
            pulseSpeed: 0.3,
            rotationSpeed: 0.05
        };
        
        sanctuaryGroup.add(dome);
        this.slowTimeEffects.push(dome);
    }
    
    /**
     * Add boundary walls to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add walls to
     * @private
     */
    _addBoundaryWalls(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const wallHeight = 3.0;
        const wallSegments = 12;
        
        // Create a cylindrical boundary wall
        const wallGeometry = new THREE.CylinderGeometry(
            baseRadius, // Top radius
            baseRadius, // Bottom radius
            wallHeight, // Height
            wallSegments, // Radial segments
            1, // Height segments
            true // Open-ended
        );
        
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0x3311aa,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = wallHeight / 2; // Position so bottom is at ground level
        
        // Store animation data
        wall.userData = {
            pulseSpeed: 0.2,
            initialOpacity: 0.2
        };
        
        sanctuaryGroup.add(wall);
        this.boundaryWalls.push(wall);
        
        // Add vertical lines along the wall
        const lineCount = wallSegments;
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2;
            
            // Create a line geometry
            const points = [
                new THREE.Vector3(
                    Math.cos(angle) * baseRadius,
                    0,
                    Math.sin(angle) * baseRadius
                ),
                new THREE.Vector3(
                    Math.cos(angle) * baseRadius,
                    wallHeight,
                    Math.sin(angle) * baseRadius
                )
            ];
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x6633cc,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            
            // Store animation data
            line.userData = {
                pulseSpeed: 0.5 + Math.random() * 0.5,
                initialOpacity: 0.7
            };
            
            sanctuaryGroup.add(line);
            this.boundaryWalls.push(line);
        }
    }
    
    /**
     * Update the Inner Sanctuary effect
     * @param {number} delta - Time since last update in seconds
     * @private
     */
    _updateInnerSanctuaryEffect(delta) {
        // Call the parent method to update the base sanctuary
        super._updateInnerSanctuaryEffect(delta);
        
        // Update binding runes
        this.bindingRunes.forEach(rune => {
            // Rotate the rune
            rune.rotation.z += rune.userData.rotationSpeed * delta;
            
            // Pulse the rune
            const pulseScale = 1.0 + 0.2 * Math.sin(this.elapsedTime * rune.userData.pulseSpeed);
            rune.scale.set(pulseScale, pulseScale, pulseScale);
        });
        
        // Update slow-time effects
        this.slowTimeEffects.forEach(effect => {
            // Rotate the effect
            if (effect.rotation) {
                effect.rotation.z += effect.userData.rotationSpeed * delta;
            }
            
            // Pulse the effect
            const pulseScale = 1.0 + 0.1 * Math.sin(this.elapsedTime * effect.userData.pulseSpeed);
            effect.scale.set(pulseScale, 1.0, pulseScale); // Only scale in x and z to maintain height
        });
        
        // Update boundary walls
        this.boundaryWalls.forEach(wall => {
            // Pulse opacity
            if (wall.material && wall.userData.initialOpacity) {
                wall.material.opacity = wall.userData.initialOpacity + 
                    0.1 * Math.sin(this.elapsedTime * wall.userData.pulseSpeed);
            }
        });
        
        // Apply speed reduction to enemies within the sanctuary
        this._applySpeedReduction();
    }
    
    /**
     * Apply speed reduction to enemies within the sanctuary
     * @private
     */
    _applySpeedReduction() {
        if (!this.skill.game || !this.skill.game.enemyManager) return;
        
        // Get the sanctuary position
        const sanctuaryPosition = this.effect.position.clone();
        const radius = this.skill.radius || 5;
        
        // Get enemies within the sanctuary radius
        const enemies = this.skill.game.enemyManager.getEnemiesNearPosition(
            sanctuaryPosition,
            radius
        );
        
        // Track which enemies are still affected
        const stillAffected = new Set();
        
        // Apply speed reduction to each enemy
        enemies.forEach(enemy => {
            stillAffected.add(enemy.id);
            
            // If enemy is not already affected, apply the effect
            if (!this.affectedEnemies.has(enemy.id)) {
                // Store original speed
                const originalSpeed = enemy.moveSpeed || 1.0;
                this.affectedEnemies.set(enemy.id, originalSpeed);
                
                // Apply speed reduction
                enemy.moveSpeed = originalSpeed * (1 - this.speedReductionFactor);
                
                // Create visual effect
                this._createSlowEffect(enemy);
            }
        });
        
        // Remove effect from enemies that are no longer in the sanctuary
        this.affectedEnemies.forEach((originalSpeed, enemyId) => {
            if (!stillAffected.has(enemyId)) {
                // Find the enemy
                const enemy = this.skill.game.enemyManager.getEnemyById(enemyId);
                
                // Restore original speed
                if (enemy) {
                    enemy.moveSpeed = originalSpeed;
                }
                
                // Remove from tracking
                this.affectedEnemies.delete(enemyId);
            }
        });
    }
    
    /**
     * Create a slow effect on an enemy
     * @param {Enemy} enemy - The enemy to create the effect on
     * @private
     */
    _createSlowEffect(enemy) {
        if (!this.skill.game || !this.skill.game.scene) return;
        
        const enemyPosition = enemy.getPosition();
        
        // Create a slow effect ring around the enemy
        const ringGeometry = new THREE.RingGeometry(0.8, 1.0, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x6633cc,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(enemyPosition);
        ring.position.y = 0.1; // Just above ground
        ring.rotation.x = -Math.PI / 2; // Lay flat
        
        // Store enemy reference and animation data
        ring.userData = {
            enemy: enemy,
            rotationSpeed: 0.3,
            pulseSpeed: 0.5,
            initialOpacity: 0.7
        };
        
        // Add to scene
        this.skill.game.scene.add(ring);
        
        // Store for animation and cleanup
        this.slowTimeEffects.push(ring);
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Restore original speed to all affected enemies
        this.affectedEnemies.forEach((originalSpeed, enemyId) => {
            if (this.skill.game && this.skill.game.enemyManager) {
                const enemy = this.skill.game.enemyManager.getEnemyById(enemyId);
                if (enemy) {
                    enemy.moveSpeed = originalSpeed;
                }
            }
        });
        
        // Clear affected enemies map
        this.affectedEnemies.clear();
        
        // Clean up binding runes
        this.bindingRunes = [];
        
        // Clean up slow-time effects
        this.slowTimeEffects = [];
        
        // Clean up boundary walls
        this.boundaryWalls = [];
        
        // Call parent dispose
        super.dispose();
    }
}