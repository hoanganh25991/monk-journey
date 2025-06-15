import * as THREE from "three";
import { BulPalmRainEffect } from "./BulPalmRainEffect.js";

/**
 * Specialized effect for Bul Palm Storm of Palms skill variant
 * Creates multiple giant palms that fall from the sky and follow the hero, causing explosions on impact
 */
export class StormOfPalmsEffect extends BulPalmRainEffect {
  constructor(skill) {
    super(skill);
    
    // Get configuration from skill if available, otherwise use defaults
    const config = skill.stormOfPalmsConfig || {};
    
    // Apply damage and mana cost multipliers (matching BulPalmRainEffect)
    this.damage = skill.damage * 3.5; // Slightly higher than BulPalmRainEffect (3.0)
    this.manaCost = skill.manaCost * 1.8; // Higher than BulPalmRainEffect (1.5) due to enhanced features
    
    // Override palm rain effect settings with enhanced values
    // Increase palm count based on original duration
    const durationMultiplier = 1.5; // 50% more duration
    this.palmCount = config.palmCount || Math.ceil(30 * durationMultiplier); // Increased from 20 to 30 + duration multiplier
    this.palmDelay = config.palmDelay || 0.12; // Faster palm creation (reduced from 0.15)
    
    // Area settings
    this.areaRadius = skill.radius * 3.5 || 10.5; // Slightly larger area than the original
    
    // Height settings
    this.startHeight = 35; // Higher starting point for more dramatic effect
    this.fallSpeed = config.fallSpeed || 30; // Faster falling speed (increased from 25)
    
    // New settings for this variant
    this.followHero = true; // This variant follows the hero
    this.heroPosition = null; // Will store the hero's position
    this.lastHeroPosition = new THREE.Vector3(); // Last known hero position
    this.moveWithHeroThreshold = 0.1; // Minimum distance the hero must move to update the effect position
    
    // Log configuration for debugging
    console.debug('StormOfPalmsEffect initialized with:', {
      palmCount: this.palmCount,
      palmDelay: this.palmDelay,
      areaRadius: this.areaRadius,
      fallSpeed: this.fallSpeed,
      duration: skill.duration,
      followHero: this.followHero
    });
  }
  
  /**
   * Create a Storm of Palms effect
   * @param {THREE.Vector3} position - Position to place the effect
   * @param {THREE.Vector3} direction - Direction (used for area orientation)
   * @returns {THREE.Group} - The created effect
   */
  create(position, direction) {
    // Initialize center position before calling parent create
    this.centerPosition = position.clone();
    
    // Use the parent class's create method
    const effectGroup = super.create(position, direction);
    
    // Store the initial hero position
    this.heroPosition = position.clone();
    this.lastHeroPosition = position.clone();
    
    // Create a special indicator to show this is a moving storm
    this.createStormIndicator(effectGroup);
    
    // Log creation for debugging
    console.debug('Storm of Palms effect created at position:', position);
    
    return effectGroup;
  }
  
  /**
   * Create a special indicator to show this is a moving storm
   * @param {THREE.Group} effectGroup - Group to add the indicator to
   * @private
   */
  createStormIndicator(effectGroup) {
    // Create a pulsing inner circle to indicate the storm follows the player
    const innerGeometry = new THREE.RingGeometry(this.areaRadius * 0.3, this.areaRadius * 0.35, 48);
    const innerMaterial = this.createMaterial(
      this.getBrighterColor(),
      2.5,
      true,
      0.8,
      false,
      true
    );
    
    const innerIndicator = new THREE.Mesh(innerGeometry, innerMaterial);
    innerIndicator.rotation.x = -Math.PI / 2; // Lay flat on the ground
    innerIndicator.position.y = 0.15; // Slightly above the main indicator
    
    // Add pulsing animation data
    innerIndicator.userData = {
      pulseSpeed: 3, // Faster pulse than the main indicator
      initialOpacity: 0.8
    };
    
    this.innerIndicator = innerIndicator;
    effectGroup.add(innerIndicator);
    
    // Create directional arrows to indicate movement
    this.createDirectionalArrows(effectGroup);
  }
  
  /**
   * Create directional arrows to indicate the storm follows the player
   * @param {THREE.Group} effectGroup - Group to add the arrows to
   * @private
   */
  createDirectionalArrows(effectGroup) {
    const arrowCount = 8;
    const arrowGroup = new THREE.Group();
    
    for (let i = 0; i < arrowCount; i++) {
      const angle = (i / arrowCount) * Math.PI * 2;
      const distance = this.areaRadius * 0.7;
      
      // Create arrow shape
      const arrowShape = new THREE.Shape();
      const arrowSize = 0.8;
      
      // Draw arrow pointing inward
      arrowShape.moveTo(0, arrowSize);
      arrowShape.lineTo(-arrowSize * 0.5, 0);
      arrowShape.lineTo(arrowSize * 0.5, 0);
      arrowShape.lineTo(0, arrowSize);
      
      const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
      const arrowMaterial = this.createMaterial(
        this.getSkillColor(),
        2.0,
        true,
        0.7,
        false,
        true
      );
      
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      
      // Position arrow
      arrow.position.set(
        Math.cos(angle) * distance,
        0.2, // Slightly above ground
        Math.sin(angle) * distance
      );
      
      // Rotate arrow to point inward
      arrow.rotation.x = -Math.PI / 2; // Lay flat
      arrow.rotation.z = -angle + Math.PI; // Point inward
      
      // Add animation data
      arrow.userData = {
        angle: angle,
        distance: distance,
        pulseSpeed: 2 + (i % 3) * 0.5, // Varied pulse speeds
        initialOpacity: 0.7,
        moveSpeed: 1.5 // Speed of inward/outward movement
      };
      
      arrowGroup.add(arrow);
    }
    
    this.arrowGroup = arrowGroup;
    effectGroup.add(arrowGroup);
  }
  
  /**
   * Update the effect
   * @param {number} delta - Time since last update in seconds
   */
  update(delta) {
    if (!this.isActive || !this.effect) return;
    
    // First, update the base properties
    this.age += delta;
    this.elapsedTime += delta;
    
    // IMPORTANT: Update the skill's position property to match the effect's position
    // This ensures the skill.position is always available
    this.skill.position.copy(this.effect.position);
    
    // Now get current hero position from the skill's position
    const skillPosition = this.skill.position.clone();
    
    // Check if the hero has moved significantly
    if (skillPosition.distanceTo(this.lastHeroPosition) > this.moveWithHeroThreshold) {
      // Update the center position to follow the hero
      this.centerPosition.x = skillPosition.x;
      this.centerPosition.z = skillPosition.z;
      
      // Update the effect position
      this.effect.position.x = skillPosition.x;
      this.effect.position.z = skillPosition.z;
      
      // Update all existing palms to maintain their relative position to the hero
      this.updatePalmPositions(skillPosition);
      
      // Update the last known hero position
      this.lastHeroPosition.copy(skillPosition);
    }
    
    // Create new palms at regular intervals
    if (this.palmsCreated < this.palmCount) {
      this.lastPalmTime += delta;
      
      if (this.lastPalmTime >= this.palmDelay) {
        this.createFallingPalm();
        this.lastPalmTime = 0;
      }
    }
    
    // Update existing palms
    for (let i = 0; i < this.palmGroups.length; i++) {
      this.updateFallingPalm(this.palmGroups[i], delta);
    }
    
    // Update the storm-specific indicators
    this.updateStormIndicators(delta);
  }
  
  /**
   * Update all palm positions to maintain their relative position to the hero
   * @param {THREE.Vector3} newHeroPosition - The new hero position
   * @private
   */
  updatePalmPositions(newHeroPosition) {
    // Update all palms that haven't exploded yet
    for (const palmData of this.palmGroups) {
      if (!palmData.hasExploded) {
        // Update the palm position based on its offset from center
        palmData.group.position.x = newHeroPosition.x + palmData.offsetFromCenter.x;
        palmData.group.position.z = newHeroPosition.z + palmData.offsetFromCenter.y;
        
        // Update target position for explosion
        palmData.targetPosition.x = palmData.group.position.x;
        palmData.targetPosition.z = palmData.group.position.z;
      }
    }
  }
  
  /**
   * Update the storm-specific indicators
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateStormIndicators(delta) {
    // Update inner indicator
    if (this.innerIndicator) {
      // Pulse opacity with a different phase than the main indicator
      const pulseValue = (Math.sin(this.age * this.innerIndicator.userData.pulseSpeed + Math.PI) + 1) / 2;
      this.innerIndicator.material.opacity = this.innerIndicator.userData.initialOpacity * pulseValue;
      
      // Rotate slowly
      this.innerIndicator.rotation.z += delta * 0.5;
    }
    
    // Update directional arrows
    if (this.arrowGroup) {
      for (let i = 0; i < this.arrowGroup.children.length; i++) {
        const arrow = this.arrowGroup.children[i];
        const userData = arrow.userData;
        
        // Pulse opacity
        const pulseValue = (Math.sin(this.age * userData.pulseSpeed) + 1) / 2;
        arrow.material.opacity = userData.initialOpacity * pulseValue;
        
        // Move arrows in and out
        const distanceOffset = Math.sin(this.age * userData.moveSpeed) * 0.5;
        const currentDistance = userData.distance + distanceOffset;
        
        arrow.position.x = Math.cos(userData.angle) * currentDistance;
        arrow.position.z = Math.sin(userData.angle) * currentDistance;
      }
      
      // Fade out arrows when all palms are created
      if (this.palmsCreated >= this.palmCount) {
        for (let i = 0; i < this.arrowGroup.children.length; i++) {
          const arrow = this.arrowGroup.children[i];
          arrow.material.opacity *= Math.max(0, 1 - (this.age - (this.palmCount * this.palmDelay)) / 2);
        }
      }
    }
  }
  
  /**
   * Create a single falling palm
   * @private
   * @override
   */
  createFallingPalm() {
    // Generate random position within the area
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.areaRadius;
    
    const offsetX = Math.cos(angle) * distance;
    const offsetZ = Math.sin(angle) * distance;
    
    // Calculate palm position - use current center position which follows the hero
    const palmPosition = new THREE.Vector3(
      this.centerPosition.x + offsetX,
      this.centerPosition.y + this.startHeight,
      this.centerPosition.z + offsetZ
    );
    
    // Create palm group
    const palmGroup = new THREE.Group();
    
    // Create the palm effect (reusing methods from parent class)
    const handGroup = new THREE.Group();
    
    // Calculate scale factor based on skill radius
    const baseRadius = 5;
    const radiusScaleFactor = this.skill.radius / baseRadius;
    
    // Create palm base (hand) - scaled based on skill radius
    const palmBaseGeometry = new THREE.BoxGeometry(
      1.5 * radiusScaleFactor, 
      0.4 * radiusScaleFactor, 
      1.8 * radiusScaleFactor
    );
    const palmBaseMaterial = this.createMaterial(this.getSkillColor());
    
    const palmBase = new THREE.Mesh(palmBaseGeometry, palmBaseMaterial);
    palmBase.position.y = 0;
    handGroup.add(palmBase);
    
    // Store the scale factor for use in other methods
    handGroup.userData = { radiusScaleFactor };
    
    // Override parent's createFingers method to use our scale factor
    this.createScaledFingers(handGroup, radiusScaleFactor);
    
    // Add energy aura
    this.createAura(handGroup);
    
    // Add particles - scaled based on skill radius
    // Increase particle count based on radius for more impressive effects
    const particleCount = Math.floor(15 * Math.sqrt(radiusScaleFactor));
    
    const particles = this.createParticleSystem(
      handGroup, 
      particleCount,
      { 
        min: 0.8 * radiusScaleFactor, 
        max: 1.2 * radiusScaleFactor 
      },
      { 
        min: 0.04 * radiusScaleFactor, 
        max: 0.08 * radiusScaleFactor 
      },
      false,
      true
    );
    
    // Only rotate around Y-axis for visual variety, but keep Z-axis at 0 to ensure all palms face directly down
    handGroup.rotation.y = Math.random() * Math.PI * 2;
    handGroup.rotation.z = 0; // No tilt, all palms face directly to the ground
    
    // Add hand to palm group
    palmGroup.add(handGroup);
    
    // Create explosion effect (initially hidden)
    const explosionGroup = new THREE.Group();
    explosionGroup.visible = false;
    palmGroup.add(explosionGroup);
    
    // Position palm group
    palmGroup.position.copy(palmPosition);
    
    // Store palm data
    const palmData = {
      group: palmGroup,
      handGroup: handGroup,
      explosionGroup: explosionGroup,
      particles: particles,
      startPosition: palmPosition.clone(),
      targetPosition: new THREE.Vector3(
        palmPosition.x,
        this.centerPosition.y,
        palmPosition.z
      ),
      age: 0,
      hasExploded: false,
      // Store the offset from center for this palm to maintain relative position when moving
      offsetFromCenter: new THREE.Vector2(offsetX, offsetZ)
    };
    
    // Add to scene
    if (this.effect && this.effect.parent) {
      this.effect.parent.add(palmGroup);
    } else {
      this.effect.add(palmGroup);
    }
    
    // Add to palm groups
    this.palmGroups.push(palmData);
    
    // Increment counter
    this.palmsCreated++;
  }
  
  /**
   * Update a falling palm
   * @param {Object} palmData - Data for the palm to update
   * @param {number} delta - Time since last update in seconds
   * @private
   * @override
   */
  updateFallingPalm(palmData, delta) {
    // Update palm age
    palmData.age += delta;
    
    // Move palm down
    const moveDistance = this.fallSpeed * delta;
    palmData.group.position.y -= moveDistance;
    
    // Check if palm has hit the ground
    if (palmData.group.position.y <= this.centerPosition.y) {
      // Snap to ground
      palmData.group.position.y = 0.5;
      
      // Create explosion if it hasn't already exploded
      if (!palmData.hasExploded) {
        this.createPalmExplosion(palmData);
      }
    }
    
    // Update particles
    this.updateOrbitingParticles(palmData.particles, palmData.age);
    
    // Add a slight rotation to the palm as it falls for visual effect
    if (!palmData.hasExploded) {
      palmData.handGroup.rotation.y += delta * 0.2;
    }
  }
}