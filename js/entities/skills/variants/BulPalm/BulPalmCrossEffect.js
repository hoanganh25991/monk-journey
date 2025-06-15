import * as THREE from "three";
import { BulPalmEffect } from "../../BulPalmEffect.js";

/**
 * Specialized effect for Bul Palm Cross skill variant
 * Creates 4 giant palms in a plus (+) pattern that fall from the sky simultaneously,
 * causing a massive explosion when they hit the ground
 */
export class BulPalmCrossEffect extends BulPalmEffect {
  constructor(skill) {
    super(skill);
    
    // Get configuration from skill if available, otherwise use defaults
    const config = skill.palmCrossConfig || {};
    
    // Palm cross effect settings
    this.palmCount = 4; // Fixed number of palms in a plus (+) pattern
    this.palmsCreated = 0; // Counter for created palms
    this.palmGroups = []; // Store all palm groups
    
    // Area settings
    this.areaRadius = skill.radius || 3; // Use configured radius
    this.palmRadius = this.areaRadius * 4; // Each palm is 4x normal size
    
    // Height settings
    this.startHeight = 30; // Height from which palms start falling
    this.fallSpeed = config.fallSpeed || 25; // Speed at which palms fall (default: 25)
    
    // Explosion settings
    this.hasExploded = false;
    this.explosionTriggered = false;
    this.explosionGroup = null;
    
    // Default color (fallback if skill color is not defined)
    this.defaultColor = 0x33ff33; // Green color for Bul Palm
    
    // Log configuration for debugging
    console.debug('BulPalmCrossEffect initialized with:', {
      palmCount: this.palmCount,
      areaRadius: this.areaRadius,
      palmRadius: this.palmRadius,
      fallSpeed: this.fallSpeed,
      duration: skill.duration
    });
  }
  
  /**
   * Create a Bul Palm Cross effect with palms in a plus (+) pattern
   * @param {THREE.Vector3} position - Position to place the effect
   * @param {THREE.Vector3} direction - Direction (used for area orientation)
   * @returns {THREE.Group} - The created effect
   */
  create(position, direction) {
    try {
      // Clone position to avoid modifying the original
      position = position.clone();
      
      // Create a group for the effect
      const effectGroup = new THREE.Group();
      
      // Store the direction for area orientation
      this.direction = direction ? direction.clone().normalize() : new THREE.Vector3(0, 0, 1);
      
      // Store the center position
      this.centerPosition = position.clone();
      
      // Create area indicator
      this.createAreaIndicator(effectGroup, position);
      
      // Create the explosion group (initially hidden)
      this.createMainExplosionGroup(effectGroup);
      
      // Position effect at the starting position
      effectGroup.position.copy(position);
      
      // Store effect first so it's available in createCrossPalms
      this.effect = effectGroup;
      this.isActive = true;
      
      // Create all 4 palms in a cross pattern
      this.createCrossPalms();
      
      return effectGroup;
    } catch (error) {
      console.error("Error creating BulPalmCross effect:", error);
      return new THREE.Group();
    }
  }
  
  /**
   * Create an area indicator to show where palms will fall
   * @param {THREE.Group} effectGroup - Group to add the indicator to
   * @param {THREE.Vector3} position - Position to place the indicator
   * @private
   */
  createAreaIndicator(effectGroup, position) {
    // Create a circular area indicator
    const areaGeometry = new THREE.RingGeometry(this.areaRadius * 3.8, this.areaRadius * 4, 48);
    const areaMaterial = this.createMaterial(
      this.getSkillColor(),
      1.5,
      true,
      0.6,
      false,
      true
    );
    
    const areaIndicator = new THREE.Mesh(areaGeometry, areaMaterial);
    areaIndicator.rotation.x = -Math.PI / 2; // Lay flat on the ground
    areaIndicator.position.y = 0.1; // Slightly above ground
    
    // Add pulsing animation data
    areaIndicator.userData = {
      pulseSpeed: 2,
      initialOpacity: 0.6
    };
    
    // Create inner circle for better visibility
    const innerCircleGeometry = new THREE.CircleGeometry(this.areaRadius * 3.7, 48);
    const innerCircleMaterial = this.createMaterial(
      this.getSkillColor(),
      1.0,
      true,
      0.2,
      false,
      true
    );
    
    const innerCircle = new THREE.Mesh(innerCircleGeometry, innerCircleMaterial);
    innerCircle.rotation.x = -Math.PI / 2; // Lay flat on the ground
    innerCircle.position.y = 0.05; // Slightly above ground but below the ring
    
    // Store references
    this.areaIndicator = areaIndicator;
    this.innerCircle = innerCircle;
    
    // Add to effect group
    effectGroup.add(areaIndicator);
    effectGroup.add(innerCircle);
  }
  
  /**
   * Create the main explosion group that will be used when all palms hit
   * @param {THREE.Group} effectGroup - Group to add the explosion to
   * @private
   */
  createMainExplosionGroup(effectGroup) {
    const explosionGroup = new THREE.Group();
    explosionGroup.visible = false;
    
    // Store reference
    this.explosionGroup = explosionGroup;
    
    // Add to effect group
    effectGroup.add(explosionGroup);
  }
  
  /**
   * Create all 4 palms in a plus (+) pattern
   * @private
   */
  createCrossPalms() {
    // Define the 4 directions for the palms in a plus (+) pattern
    // Using cardinal directions at 0, 90, 180, and 270 degrees
    // This creates a plus sign pattern instead of an X pattern
    
    const baseDirections = [
      new THREE.Vector3(0, 0, 1),    // North (0 degrees)
      new THREE.Vector3(1, 0, 0),    // East (90 degrees)
      new THREE.Vector3(0, 0, -1),   // South (180 degrees)
      new THREE.Vector3(-1, 0, 0)    // West (270 degrees)
    ];
    
    // Normalize each direction vector to ensure consistent spacing
    const directions = baseDirections.map(dir => dir.clone().normalize());
    
    // Create a palm in each direction
    for (let i = 0; i < directions.length; i++) {
      this.createDirectionalPalm(directions[i], i);
    }
  }
  
  /**
   * Create a palm in a specific direction
   * @param {THREE.Vector3} direction - Direction vector
   * @param {number} index - Index of the palm (0-3)
   * @private
   */
  createDirectionalPalm(direction, index) {
    // Calculate palm position
    // Position the palm at the edge of the area in the given direction
    // Use the exact radius of the area indicator
    const areaIndicatorRadius = this.areaRadius * 3.9; // Match the area indicator radius
    // Calculate position relative to the effect group
    const palmPosition = new THREE.Vector3(
      direction.x * areaIndicatorRadius,
      this.startHeight,
      direction.z * areaIndicatorRadius
    );
    
    // Create palm group
    const palmGroup = new THREE.Group();
    
    // Create the palm effect (reusing methods from parent class)
    const handGroup = new THREE.Group();
    
    // Calculate scale factor - 4x normal size
    const scaleFactor = 4.0;
    
    // Create palm base (hand) - scaled to 4x normal size
    const palmBaseGeometry = new THREE.BoxGeometry(
      1.5 * scaleFactor, 
      0.4 * scaleFactor, 
      1.8 * scaleFactor
    );
    const palmBaseMaterial = this.createMaterial(this.getSkillColor());
    
    const palmBase = new THREE.Mesh(palmBaseGeometry, palmBaseMaterial);
    palmBase.position.y = 0;
    handGroup.add(palmBase);
    
    // Store the scale factor for use in other methods
    handGroup.userData = { scaleFactor, direction, index };
    
    // Create scaled fingers
    this.createScaledFingers(handGroup, scaleFactor);
    
    // Add energy aura with larger radius
    this.createAura(handGroup);
    
    // Add particles - scaled based on palm size
    const particleCount = Math.floor(15 * Math.sqrt(scaleFactor));
    
    const particles = this.createParticleSystem(
      handGroup, 
      particleCount,
      { 
        min: 0.8 * scaleFactor, 
        max: 1.2 * scaleFactor 
      },
      { 
        min: 0.04 * scaleFactor, 
        max: 0.08 * scaleFactor 
      },
      false,
      true
    );
    
    // Set hand orientation - palm flat to hit the ground horizontally
    handGroup.rotation.x = 0; // Palm flat (horizontal)
    
    // Rotate around Y-axis to face the center
    const angle = Math.atan2(-direction.x, -direction.z);
    handGroup.rotation.y = angle;
    
    // Add hand to palm group
    palmGroup.add(handGroup);
    
    // Create individual explosion effect (initially hidden)
    const individualExplosionGroup = new THREE.Group();
    individualExplosionGroup.visible = false;
    palmGroup.add(individualExplosionGroup);
    
    // Position palm group
    palmGroup.position.copy(palmPosition);
    
    // Store palm data
    const palmData = {
      group: palmGroup,
      handGroup: handGroup,
      explosionGroup: individualExplosionGroup,
      particles: particles,
      startPosition: palmPosition.clone(),
      targetPosition: new THREE.Vector3(
        // Target position relative to the effect group
        direction.x * areaIndicatorRadius,
        0, // Ground level relative to effect group
        direction.z * areaIndicatorRadius
      ),
      direction: direction.clone(),
      age: 0,
      hasExploded: false,
      index: index
    };
    
    // Always add palms to the effect group to keep them positioned relative to the effect
    // This ensures they fall at the correct position relative to the hero
    this.effect.add(palmGroup);
    
    // Log palm creation for debugging
    console.debug(`Created palm ${index} at position:`, palmPosition);
    
    // Add to palm groups
    this.palmGroups.push(palmData);
    
    // Increment counter
    this.palmsCreated++;
  }
  
  /**
   * Create an explosion when all palms hit the ground
   * @private
   */
  createCombinedExplosion() {
    // Make explosion group visible
    this.explosionGroup.visible = true;
    
    // Calculate a larger scale factor for the combined explosion
    const scaleFactor = 8.0; // Even bigger than individual palms
    
    // Create giant palm for explosion
    this.createGiantPalm(this.explosionGroup, scaleFactor);
    
    // Create explosion core
    const coreGeometry = new THREE.SphereGeometry(0.8 * scaleFactor, 24, 24);
    const coreMaterial = this.createMaterial(this.getBrighterColor(), 3.0);
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.explosionGroup.add(core);
    
    // Create explosion waves - more waves for bigger explosion
    this.createWaveSystem(
      this.explosionGroup, 
      6, // More waves
      0.8 * scaleFactor // Larger base size
    );
    
    // Create explosion particles - many more particles for impressive explosion
    const particleCount = 150; // Lots of particles
    
    this.createParticleSystem(
      this.explosionGroup, 
      particleCount,
      { 
        min: 0.8 * scaleFactor, 
        max: 1.2 * scaleFactor 
      },
      { 
        min: 0.15 * scaleFactor, 
        max: 0.25 * scaleFactor 
      },
      true // Use gravity
    );
    
    // Mark as exploded
    this.hasExploded = true;
    this.explosionAge = 0;
    
    // Apply a stronger screen shake for the combined explosion
    this.applyScreenShake(1.0, 0.8); // Higher intensity and longer duration for the big explosion
  }
  
  /**
   * Create a giant palm for the explosion with custom scale
   * @param {THREE.Group} explosionGroup - Group to add the giant palm to
   * @param {number} scaleFactor - Scale factor for the palm
   * @private
   */
  createGiantPalm(explosionGroup, scaleFactor) {
    const giantPalmShape = new THREE.Shape();
    
    // Palm center
    giantPalmShape.moveTo(0, 0);
    giantPalmShape.absarc(0, 0, 0.7, 0, Math.PI * 2, false);
    
    // Fingers (5 elongated shapes)
    const giantFingerCount = 5;
    for (let i = 0; i < giantFingerCount; i++) {
      const angle = (i / giantFingerCount) * Math.PI * 1.2 - Math.PI * 0.1;
      const length = 1.1 + (i === 2 ? 0.4 : 0); // Middle finger longer
      
      const fingerShape = new THREE.Shape();
      fingerShape.moveTo(0, 0);
      fingerShape.absellipse(
        Math.cos(angle) * 0.7,
        Math.sin(angle) * 0.7,
        0.25,
        length,
        0,
        Math.PI * 2,
        false,
        angle
      );
      
      giantPalmShape.holes.push(fingerShape);
    }
    
    const giantPalmGeometry = new THREE.ShapeGeometry(giantPalmShape);
    const giantPalmMaterial = this.createMaterial(
      this.getSkillColor(), 
      3.5
    );
    
    const giantPalm = new THREE.Mesh(giantPalmGeometry, giantPalmMaterial);
    giantPalm.rotation.x = -Math.PI / 2;
    giantPalm.position.y = 0.6;
    
    // Store animation data with custom scale
    giantPalm.userData = {
      initialScale: 0.3 * scaleFactor,
      targetScale: 4.5 * scaleFactor,
      rotationSpeed: 1.8,
    };
    
    // Start with small scale
    giantPalm.scale.set(
      giantPalm.userData.initialScale,
      giantPalm.userData.initialScale,
      giantPalm.userData.initialScale
    );
    
    explosionGroup.add(giantPalm);
  }
  
  /**
   * Update the effect
   * @param {number} delta - Time since last update in seconds
   */
  update(delta) {
    if (!this.isActive || !this.effect) return;
    
    this.elapsedTime += delta;
    this.age += delta;
    
    // Check if effect has expired
    if (this.elapsedTime >= this.skill.duration) {
      this.isActive = false;
      this.dispose();
      return;
    }
    
    // Update the skill's position property to match the effect's position
    this.skill.position.copy(this.effect.position);
    
    // Update area indicator
    this.updateAreaIndicator(delta);
    
    // Update all palm groups
    this.updatePalmGroups(delta);
    
    // Update combined explosion if triggered
    if (this.hasExploded) {
      this.explosionAge += delta;
      this.updateCombinedExplosion(delta);
    }
  }
  
  /**
   * Update the area indicator animation
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateAreaIndicator(delta) {
    if (this.areaIndicator) {
      // Pulse opacity
      const pulseValue = (Math.sin(this.age * this.areaIndicator.userData.pulseSpeed) + 1) / 2;
      this.areaIndicator.material.opacity = this.areaIndicator.userData.initialOpacity * pulseValue;
      
      // Also pulse the inner circle
      if (this.innerCircle) {
        this.innerCircle.material.opacity = 0.2 * pulseValue;
      }
      
      // Fade out when explosion happens
      if (this.hasExploded) {
        const fadeOutFactor = Math.max(0, 1 - this.explosionAge);
        this.areaIndicator.material.opacity *= fadeOutFactor;
        
        if (this.innerCircle) {
          this.innerCircle.material.opacity *= fadeOutFactor;
        }
      }
    }
  }
  
  /**
   * Update all palm groups
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updatePalmGroups(delta) {
    let allPalmsLanded = true;
    let allPalmsExploded = true;
    
    for (const palmData of this.palmGroups) {
      palmData.age += delta;
      
      if (!this.hasExploded) {
        // Update falling palm
        this.updateFallingPalm(palmData, delta);
        
        // Check if this palm has reached the ground (ground level is 0 relative to effect group)
        if (palmData.group.position.y > 0) {
          allPalmsLanded = false;
          allPalmsExploded = false;
        }
        
        // Check if this palm has exploded individually
        if (!palmData.hasExploded) {
          allPalmsExploded = false;
        }
        
        // Update impact effect if it exists
        if (palmData.impactGroup && palmData.impactAge !== undefined) {
          palmData.impactAge += delta;
          this.updateImpactEffect(palmData, delta);
        }
      } else {
        // Hide individual palms when combined explosion happens
        palmData.handGroup.visible = false;
        
        // Also hide individual impact effects
        if (palmData.impactGroup) {
          palmData.impactGroup.visible = false;
        }
      }
    }
    
    // If all palms have landed AND all palms have their individual explosions
    // AND we haven't triggered the combined explosion yet
    if (allPalmsLanded && allPalmsExploded && !this.hasExploded && this.palmGroups.length === 4) {
      // Add a small delay before the combined explosion for dramatic effect
      setTimeout(() => {
        if (this.isActive && !this.hasExploded) {
          this.createCombinedExplosion();
        }
      }, 500); // 500ms delay for more dramatic effect after all palms have hit
    }
  }
  
  /**
   * Update the impact effect for a palm
   * @param {Object} palmData - Data for the palm with the impact effect
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateImpactEffect(palmData, delta) {
    if (!palmData.impactGroup || palmData.impactGroup.children.length === 0) return;
    
    const ring = palmData.impactGroup.children[0];
    if (!ring || !ring.userData) return;
    
    // Scale up the ring
    const scaleProgress = Math.min(palmData.impactAge * 2, 1); // Complete in 0.5 seconds
    const currentScale = ring.userData.initialScale + 
      (ring.userData.targetScale - ring.userData.initialScale) * scaleProgress;
    
    ring.scale.set(currentScale, currentScale, currentScale);
    
    // Fade out as it expands
    if (ring.material) {
      ring.material.opacity = Math.max(0, 0.8 - palmData.impactAge * 1.6);
    }
  }
  
  /**
   * Update a falling palm
   * @param {Object} palmData - Data for the palm to update
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateFallingPalm(palmData, delta) {
    // Move palm down
    const moveDistance = this.fallSpeed * delta;
    palmData.group.position.y -= moveDistance;
    
    // Check if palm has hit the ground (ground level is 0 relative to effect group)
    if (palmData.group.position.y <= 0) {
      // Snap to ground
      palmData.group.position.y = 0;
      
      // Create individual explosion if not already exploded
      if (!palmData.hasExploded && !this.hasExploded) {
        // Create small impact effect
        this.createPalmImpact(palmData);
        
        // Mark this palm as having exploded individually
        palmData.hasExploded = true;
        
        // Add a screen shake effect for impact feedback
        this.applyScreenShake(0.5, 0.3);
      }
    }
    
    // Update particles
    this.updateOrbitingParticles(palmData.particles, palmData.age);
  }
  
  /**
   * Create a small impact effect when a palm hits the ground
   * @param {Object} palmData - Data for the palm that hit the ground
   * @private
   */
  createPalmImpact(palmData) {
    // Create a small shockwave at the impact point
    const impactGroup = new THREE.Group();
    
    // Create a ring for the shockwave
    const ringGeometry = new THREE.RingGeometry(0.2, 1.0, 32);
    const ringMaterial = this.createMaterial(
      this.getBrighterColor(),
      2.0,
      true,
      0.8,
      false,
      true
    );
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2; // Lay flat on the ground
    ring.position.y = 0.1; // Slightly above ground
    
    // Add animation data
    ring.userData = {
      initialScale: 0.5,
      targetScale: 3.0,
      age: 0
    };
    
    // Start with initial scale
    ring.scale.set(
      ring.userData.initialScale,
      ring.userData.initialScale,
      ring.userData.initialScale
    );
    
    impactGroup.add(ring);
    
    // Add impact group to the palm's explosion group
    palmData.explosionGroup.add(impactGroup);
    palmData.explosionGroup.visible = true;
    
    // Mark as having an impact effect
    palmData.impactGroup = impactGroup;
    palmData.impactAge = 0;
  }
  
  /**
   * Update the combined explosion
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateCombinedExplosion(delta) {
    // Update giant palm
    if (this.explosionGroup.children.length > 0) {
      const giantPalm = this.explosionGroup.children[0];
      if (giantPalm && giantPalm.userData) {
        // Scale up to target size
        const scaleProgress = Math.min(this.explosionAge * 1.5, 1); // Complete in ~0.67 seconds
        const currentScale = giantPalm.userData.initialScale + 
          (giantPalm.userData.targetScale - giantPalm.userData.initialScale) * scaleProgress;
        
        giantPalm.scale.set(currentScale, currentScale, currentScale);
        
        // Rotate
        giantPalm.rotation.z += giantPalm.userData.rotationSpeed * delta;
        
        // Fade out after reaching full size
        if (scaleProgress >= 1) {
          giantPalm.material.opacity = Math.max(0, giantPalm.material.opacity - delta);
        }
      }
    }
    
    // Update explosion core
    if (this.explosionGroup.children.length > 1) {
      const core = this.explosionGroup.children[1];
      if (core) {
        // Pulse size
        const pulseScale = 1.0 + 0.5 * Math.sin(this.explosionAge * 10);
        core.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Fade out
        core.material.opacity = Math.max(0, 1 - this.explosionAge * 0.5);
      }
    }
    
    // Update explosion waves
    for (let i = 2; i < 8; i++) { // Waves are at indices 2-7 (6 waves)
      if (i < this.explosionGroup.children.length) {
        const wave = this.explosionGroup.children[i];
        this.updateWave(wave, this.explosionAge, delta);
      }
    }
    
    // Update explosion particles
    for (let i = 8; i < this.explosionGroup.children.length; i++) {
      const particle = this.explosionGroup.children[i];
      this.updateParticle(particle, delta);
    }
  }
  
  /**
   * Enhanced dispose method to properly clean up all resources
   */
  dispose() {
    if (!this.effect) return;
    
    // Clean up all palm groups
    for (const palmData of this.palmGroups) {
      this.disposeObject(palmData.group);
    }
    
    // Clear palm groups
    this.palmGroups.length = 0;
    
    // Dispose of the main effect
    this.disposeObject(this.effect);
    
    // Call parent dispose
    super.dispose();
  }
  
  /**
   * Reset the effect to its initial state
   */
  reset() {
    // Call the dispose method to clean up resources
    this.dispose();
    
    // Reset state variables
    this.isActive = false;
    this.elapsedTime = 0;
    this.age = 0;
    this.palmsCreated = 0;
    this.hasExploded = false;
    
    // Clear palm groups
    this.palmGroups.length = 0;
  }
  
  /**
   * Create scaled fingers for the palm based on scale factor
   * @param {THREE.Group} handGroup - Group to add fingers to
   * @param {number} scaleFactor - Scale factor
   * @private
   */
  createScaledFingers(handGroup, scaleFactor) {
    const fingerCount = 5;
    const fingerPositions = [
      { x: -0.55, z: 0.7 }, // Thumb
      { x: -0.275, z: 0.85 }, // Index
      { x: 0, z: 0.95 }, // Middle
      { x: 0.275, z: 0.85 }, // Ring
      { x: 0.55, z: 0.7 }, // Pinky
    ];
    
    const fingerLengths = [0.55, 0.7, 0.85, 0.7, 0.55];
    
    for (let i = 0; i < fingerCount; i++) {
      // Create finger with scaled dimensions
      const fingerGeometry = new THREE.BoxGeometry(
        0.22 * scaleFactor,
        0.275 * scaleFactor,
        fingerLengths[i] * scaleFactor
      );
      const fingerMaterial = this.createMaterial(this.getSkillColor());
      
      const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
      
      // Position finger with scaled coordinates
      finger.position.set(
        fingerPositions[i].x * scaleFactor,
        0.1 * scaleFactor,
        (fingerPositions[i].z + fingerLengths[i] / 2) * scaleFactor
      );
      
      // Add finger joints (knuckles) with scaled dimensions
      const knuckleGeometry = new THREE.SphereGeometry(0.125 * scaleFactor, 8, 8);
      const knuckleMaterial = this.createMaterial(this.getLighterColor());
      
      const knuckle = new THREE.Mesh(knuckleGeometry, knuckleMaterial);
      knuckle.position.set(
        fingerPositions[i].x * scaleFactor, 
        0.1 * scaleFactor, 
        fingerPositions[i].z * scaleFactor
      );
      
      handGroup.add(finger);
      handGroup.add(knuckle);
      
      // Add scaled fingernails
      this.createScaledFingernail(
        handGroup, 
        { 
          x: fingerPositions[i].x * scaleFactor, 
          z: fingerPositions[i].z * scaleFactor 
        }, 
        fingerLengths[i] * scaleFactor,
        scaleFactor
      );
    }
  }
  
  /**
   * Create a scaled fingernail
   * @param {THREE.Group} handGroup - Group to add the nail to
   * @param {Object} position - Position data for the finger
   * @param {number} fingerLength - Length of the finger
   * @param {number} scaleFactor - Scale factor
   * @private
   */
  createScaledFingernail(handGroup, position, fingerLength, scaleFactor) {
    const nailGeometry = new THREE.BoxGeometry(
      0.18 * scaleFactor, 
      0.09 * scaleFactor, 
      0.18 * scaleFactor
    );
    
    // Create a very light variant for nails
    const baseColor = new THREE.Color(this.getSkillColor());
    const nailColor = new THREE.Color(
      Math.min(1, baseColor.r * 0.2 + 0.8),
      Math.min(1, baseColor.g * 0.2 + 0.8),
      Math.min(1, baseColor.b * 0.2 + 0.8)
    );
    const nailEmissive = new THREE.Color(
      Math.min(1, baseColor.r * 0.4 + 0.6),
      Math.min(1, baseColor.g * 0.4 + 0.6),
      Math.min(1, baseColor.b * 0.4 + 0.6)
    );
    
    const nailMaterial = new THREE.MeshStandardMaterial({
      color: nailColor,
      emissive: nailEmissive,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.9,
    });
    
    const nail = new THREE.Mesh(nailGeometry, nailMaterial);
    nail.position.set(
      position.x,
      0.18 * scaleFactor,
      position.z + fingerLength
    );
    
    handGroup.add(nail);
  }
  
  /**
   * Apply a screen shake effect
   * @param {number} intensity - The intensity of the shake (0-1)
   * @param {number} duration - The duration of the shake in seconds
   */
  applyScreenShake(intensity = 0.5, duration = 0.3) {
    return;
    // Get the canvas element
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    
    console.debug(`Applying screen shake: intensity=${intensity}, duration=${duration}`);
    
    // Get the game container instead of just the canvas
    // This ensures we shake the entire game view while preserving UI elements
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    // Store original transform
    const originalTransform = gameContainer.style.transform || '';
    
    // Make sure the game container has position relative or absolute
    if (window.getComputedStyle(gameContainer).position === 'static') {
      gameContainer.style.position = 'relative';
    }
    
    // Ensure joystick stays visible during shake
    const joystickContainer = document.getElementById('virtual-joystick-container');
    if (joystickContainer) {
      // Temporarily increase z-index to ensure it stays on top
      const originalZIndex = joystickContainer.style.zIndex || '900';
      joystickContainer.style.zIndex = '2000'; // Higher than any other UI element
      
      // Reset z-index after shake completes
      setTimeout(() => {
        joystickContainer.style.zIndex = originalZIndex;
      }, duration * 1000 + 50); // Add small buffer to ensure it completes after shake
    }
    
    // Set up variables for the shake effect
    let startTime = performance.now();
    let shaking = true;
    
    // Function to update the shake effect
    const updateShake = () => {
      if (!shaking) return;
      
      // Calculate elapsed time
      const elapsed = (performance.now() - startTime) / 1000; // Convert to seconds
      
      // Check if shake should end
      if (elapsed >= duration) {
        shaking = false;
        gameContainer.style.transform = originalTransform;
        return;
      }
      
      // Calculate shake factor (decreases over time)
      const shakeFactor = (1 - elapsed / duration) * intensity;
      
      // Apply random offset to game container position
      const offsetX = (Math.random() - 0.5) * 2 * shakeFactor * 15; // Multiply by 15 for pixels
      const offsetY = (Math.random() - 0.5) * 2 * shakeFactor * 15; // Multiply by 15 for pixels
      
      // Apply shake to game container position
      gameContainer.style.transform = `${originalTransform} translate(${offsetX}px, ${offsetY}px)`;
      
      // Request next frame
      requestAnimationFrame(updateShake);
    };
    
    // Start the shake effect
    requestAnimationFrame(updateShake);
  }
}