import * as THREE from 'three';
import { InnerSanctuaryEffect } from '../../InnerSanctuaryEffect.js';

/**
 * Effect for the Temple of Protection variant of Inner Sanctuary
 * Increases the damage reduction effect of the sanctuary
 * Visual style: Deep blue sanctuary with protective pillars and energy shields
 */
export class TempleOfProtectionEffect extends InnerSanctuaryEffect {
    constructor(skill) {
        super(skill);
        
        // Variant-specific properties
        this.damageReductionMultiplier = 2.0; // Double the damage reduction
        
        // Apply damage reduction multiplier
        if (this.skill.damageReduction) {
            this.skill.damageReduction *= this.damageReductionMultiplier;
        } else {
            this.skill.damageReduction = 0.5 * this.damageReductionMultiplier; // Default 50% reduction
        }
        
        // Visual properties
        this.protectivePillars = [];
        this.energyShields = [];
        this.protectionRunes = [];
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
        
        // Modify the base sanctuary colors to deep blue
        this._modifySanctuaryColors(sanctuaryGroup);
        
        // Add protective pillars
        this._addProtectivePillars(sanctuaryGroup);
        
        // Add energy shields
        this._addEnergyShields(sanctuaryGroup);
        
        // Add protection runes
        this._addProtectionRunes(sanctuaryGroup);
    }
    
    /**
     * Modify the sanctuary colors to deep blue
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to modify
     * @private
     */
    _modifySanctuaryColors(sanctuaryGroup) {
        // Define the temple color (deep blue)
        const templeColor = new THREE.Color(0x0033aa);
        
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
                            mat.color.set(templeColor);
                            mat.emissive.set(templeColor);
                        });
                    } else {
                        child.material.color.set(templeColor);
                        child.material.emissive.set(templeColor);
                    }
                }
            }
        });
    }
    
    /**
     * Add protective pillars to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add pillars to
     * @private
     */
    _addProtectivePillars(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const pillarCount = 8;
        
        for (let i = 0; i < pillarCount; i++) {
            const angle = (i / pillarCount) * Math.PI * 2;
            const pillarRadius = baseRadius * 0.85; // Near the edge
            
            // Create a protective pillar
            const pillarHeight = 4.0;
            const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.4, pillarHeight, 8);
            const pillarMaterial = new THREE.MeshBasicMaterial({
                color: 0x0055cc,
                transparent: true,
                opacity: 0.8
            });
            
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            
            // Position pillar
            pillar.position.set(
                Math.cos(angle) * pillarRadius,
                pillarHeight / 2, // Half height above ground
                Math.sin(angle) * pillarRadius
            );
            
            // Store animation data
            pillar.userData = {
                pulseSpeed: 0.3 + Math.random() * 0.2,
                initialOpacity: 0.8
            };
            
            sanctuaryGroup.add(pillar);
            this.protectivePillars.push(pillar);
            
            // Add a pillar cap
            const capGeometry = new THREE.SphereGeometry(0.4, 16, 16);
            const capMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.set(
                pillar.position.x,
                pillarHeight,
                pillar.position.z
            );
            
            // Store animation data
            cap.userData = {
                pulseSpeed: 0.5 + Math.random() * 0.3,
                initialOpacity: 0.9
            };
            
            sanctuaryGroup.add(cap);
            this.protectivePillars.push(cap);
        }
    }
    
    /**
     * Add energy shields to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add shields to
     * @private
     */
    _addEnergyShields(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        
        // Create a main dome shield
        const domeGeometry = new THREE.SphereGeometry(baseRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshBasicMaterial({
            color: 0x0055cc,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 0; // At ground level
        
        // Store animation data
        dome.userData = {
            pulseSpeed: 0.2
        };
        
        sanctuaryGroup.add(dome);
        this.energyShields.push(dome);
        
        // Create a hexagonal shield pattern
        const hexSegments = 6;
        const hexRadius = baseRadius * 0.9;
        const hexHeight = 3.0;
        
        for (let i = 0; i < hexSegments; i++) {
            const startAngle = (i / hexSegments) * Math.PI * 2;
            const endAngle = ((i + 1) / hexSegments) * Math.PI * 2;
            
            // Create points for the shield panel
            const points = [
                // Bottom points
                new THREE.Vector3(
                    Math.cos(startAngle) * hexRadius,
                    0.1, // Slightly above ground
                    Math.sin(startAngle) * hexRadius
                ),
                new THREE.Vector3(
                    Math.cos(endAngle) * hexRadius,
                    0.1,
                    Math.sin(endAngle) * hexRadius
                ),
                // Top points
                new THREE.Vector3(
                    Math.cos(endAngle) * hexRadius,
                    hexHeight,
                    Math.sin(endAngle) * hexRadius
                ),
                new THREE.Vector3(
                    Math.cos(startAngle) * hexRadius,
                    hexHeight,
                    Math.sin(startAngle) * hexRadius
                )
            ];
            
            // Create geometry from points
            const panelGeometry = new THREE.BufferGeometry();
            const vertices = [];
            
            // Create triangles (two for the quad)
            vertices.push(
                points[0].x, points[0].y, points[0].z,
                points[1].x, points[1].y, points[1].z,
                points[2].x, points[2].y, points[2].z,
                
                points[0].x, points[0].y, points[0].z,
                points[2].x, points[2].y, points[2].z,
                points[3].x, points[3].y, points[3].z
            );
            
            panelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            panelGeometry.computeVertexNormals();
            
            const panelMaterial = new THREE.MeshBasicMaterial({
                color: 0x0088ff,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            
            // Store animation data
            panel.userData = {
                pulseSpeed: 0.3 + Math.random() * 0.2,
                initialOpacity: 0.4
            };
            
            sanctuaryGroup.add(panel);
            this.energyShields.push(panel);
        }
    }
    
    /**
     * Add protection runes to the sanctuary
     * @param {THREE.Group} sanctuaryGroup - The sanctuary group to add runes to
     * @private
     */
    _addProtectionRunes(sanctuaryGroup) {
        const baseRadius = this.skill.radius || 5;
        const runeCount = 4;
        
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const runeRadius = baseRadius * 0.5; // Inside the sanctuary
            
            // Create a protection rune
            const runeGeometry = new THREE.PlaneGeometry(1.5, 1.5);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune
            rune.position.set(
                Math.cos(angle) * runeRadius,
                0.2, // Just above ground
                Math.sin(angle) * runeRadius
            );
            
            // Rotate rune to lay flat
            rune.rotation.x = -Math.PI / 2;
            
            // Store animation data
            rune.userData = {
                rotationSpeed: 0.2 + Math.random() * 0.2,
                pulseSpeed: 0.4 + Math.random() * 0.3,
                initialOpacity: 0.9
            };
            
            sanctuaryGroup.add(rune);
            this.protectionRunes.push(rune);
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
        
        // Update protective pillars
        this.protectivePillars.forEach(pillar => {
            // Pulse opacity
            if (pillar.material && pillar.userData.initialOpacity) {
                pillar.material.opacity = pillar.userData.initialOpacity + 
                    0.1 * Math.sin(this.elapsedTime * pillar.userData.pulseSpeed);
            }
            
            // Pulse emissive intensity for caps
            if (pillar.material && pillar.material.color.r > 0.5) { // Identify caps by brighter color
                const pulseValue = 0.8 + 0.2 * Math.sin(this.elapsedTime * pillar.userData.pulseSpeed);
                pillar.scale.set(pulseValue, pulseValue, pulseValue);
            }
        });
        
        // Update energy shields
        this.energyShields.forEach(shield => {
            // Pulse opacity
            if (shield.material && shield.userData.initialOpacity) {
                shield.material.opacity = shield.userData.initialOpacity + 
                    0.1 * Math.sin(this.elapsedTime * shield.userData.pulseSpeed);
            }
            
            // Pulse scale for dome
            if (shield.geometry instanceof THREE.SphereGeometry) {
                const pulseValue = 1.0 + 0.05 * Math.sin(this.elapsedTime * shield.userData.pulseSpeed);
                shield.scale.set(pulseValue, pulseValue, pulseValue);
            }
        });
        
        // Update protection runes
        this.protectionRunes.forEach(rune => {
            // Rotate the rune
            rune.rotation.z += rune.userData.rotationSpeed * delta;
            
            // Pulse opacity
            rune.material.opacity = rune.userData.initialOpacity + 
                0.1 * Math.sin(this.elapsedTime * rune.userData.pulseSpeed);
            
            // Pulse scale
            const pulseScale = 1.0 + 0.1 * Math.sin(this.elapsedTime * rune.userData.pulseSpeed);
            rune.scale.set(pulseScale, pulseScale, pulseScale);
        });
        
        // Create periodic protection pulses
        if (Math.floor(this.elapsedTime * 2) % 3 === 0 && Math.floor(this.elapsedTime * 10) % 10 === 0) {
            this._createProtectionPulse();
        }
    }
    
    /**
     * Create a protection pulse effect
     * @private
     */
    _createProtectionPulse() {
        if (!this.skill.game || !this.skill.game.scene) return;
        
        const sanctuaryPosition = this.effect.position.clone();
        const baseRadius = this.skill.radius || 5;
        
        // Create a ring geometry for the pulse
        const ringGeometry = new THREE.RingGeometry(baseRadius - 0.1, baseRadius, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(sanctuaryPosition);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = -Math.PI / 2; // Lay flat
        
        // Add to scene
        this.skill.game.scene.add(ring);
        
        // Animate and remove the ring
        let pulseTime = 0;
        const pulseDuration = 1.0;
        
        const animatePulse = () => {
            if (!this.skill.game || !this.skill.game.scene) return;
            
            pulseTime += 0.016; // Approximate delta time
            const progress = Math.min(1.0, pulseTime / pulseDuration);
            
            // Pulse height
            ring.position.y = 0.1 + progress * 3.0;
            
            // Fade out
            ring.material.opacity = 0.8 * (1 - progress);
            
            // Remove when complete
            if (progress >= 1.0) {
                this.skill.game.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            } else {
                // Continue animation in the next frame
                requestAnimationFrame(animatePulse);
            }
        };
        
        // Start the animation
        animatePulse();
    }
    
    /**
     * Dispose of the effect and clean up resources
     */
    dispose() {
        // Clean up protective pillars
        this.protectivePillars = [];
        
        // Clean up energy shields
        this.energyShields = [];
        
        // Clean up protection runes
        this.protectionRunes = [];
        
        // Call parent dispose
        super.dispose();
    }
}