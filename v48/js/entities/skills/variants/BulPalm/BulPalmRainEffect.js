import * as THREE from "three";
import { BulPalmEffect } from "../../BulPalmEffect.js";

/**
 * Specialized effect for Bul Palm Rain skill variant
 * Creates multiple giant palms that fall from the sky, causing explosions on impact
 */
export class BulPalmRainEffect extends BulPalmEffect {
  constructor(skill) {
    super(skill);
    
    // Get configuration from skill if available, otherwise use defaults
    const config = skill.palmRainConfig || {};
    
    // Palm rain effect settings
    this.damage = skill.damage * 3;
    this.manaCost = skill.manaCost * 1.5;
    this.palmCount = config.palmCount || 20; // Number of palms to create (default: 20)
    this.palmsCreated = 0; // Counter for created palms
    this.palmDelay = config.palmDelay || 0.15; // Delay between palm creations in seconds (default: 0.15)
    this.lastPalmTime = 0; // Time since last palm creation
    this.palmGroups = []; // Store all palm groups
    
    // Area settings
    this.areaRadius = skill.radius * 3 || 9; // Use configured radius or calculate from skill radius
    
    // Height settings
    this.startHeight = 30; // Height from which palms start falling
    this.fallSpeed = config.fallSpeed || 25; // Speed at which palms fall (default: 25)
    
    // Default color (fallback if skill color is not defined)
    this.defaultColor = 0x33ff33; // Green color for Bul Palm
    
    // Log configuration for debugging
    console.debug('BulPalmRainEffect initialized with:', {
      palmCount: this.palmCount,
      palmDelay: this.palmDelay,
      areaRadius: this.areaRadius,
      fallSpeed: this.fallSpeed,
      duration: skill.duration
    });
  }
  
  /**
   * Create a Bul Palm Rain effect
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
      
      // Position effect at the starting position
      effectGroup.position.copy(position);
      
      // Store effect
      this.effect = effectGroup;
      this.isActive = true;
      
      return effectGroup;
    } catch (error) {
      console.error("Error creating BulPalmRain effect:", error);
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
    // Create a circular area indicator (larger and more visible)
    const areaGeometry = new THREE.RingGeometry(this.areaRadius - 0.2, this.areaRadius, 48);
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
    
    this.areaIndicator = areaIndicator;
    effectGroup.add(areaIndicator);
  }
  
  /**
   * Create a single falling palm
   * @private
   */
  createFallingPalm() {
    // Generate random position within the area
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.areaRadius;
    
    const offsetX = Math.cos(angle) * distance;
    const offsetZ = Math.sin(angle) * distance;
    
    // Calculate palm position
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
    // Base scale factor of 1.0 is for a standard radius of 5
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
      hasExploded: false
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
   * Create an explosion when a palm hits the ground
   * @param {Object} palmData - Data for the palm that hit the ground
   * @private
   */
  createPalmExplosion(palmData) {
    // Make hand invisible
    palmData.handGroup.visible = false;
    
    // Make explosion group visible
    palmData.explosionGroup.visible = true;
    
    // Calculate scale factor based on skill radius
    // Base scale factor of 1.0 is for a standard radius of 5
    // We'll scale proportionally to the skill's radius
    const baseRadius = 5;
    const radiusScaleFactor = this.skill.radius / baseRadius;
    
    // Create giant palm for explosion with scale factor based on skill radius
    this.createGiantPalm(palmData.explosionGroup, radiusScaleFactor);
    
    // Create explosion core - scaled based on skill radius
    const coreGeometry = new THREE.SphereGeometry(0.4 * radiusScaleFactor, 16, 16);
    const coreMaterial = this.createMaterial(this.getBrighterColor());
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    palmData.explosionGroup.add(core);
    
    // Create explosion waves - scaled based on skill radius
    this.createWaveSystem(
      palmData.explosionGroup, 
      4, 
      0.4 * radiusScaleFactor
    );
    
    // Create explosion particles - scaled based on skill radius
    // Increase particle count based on radius for more impressive explosions
    const particleCount = Math.floor(35 * Math.sqrt(radiusScaleFactor));
    
    this.createParticleSystem(
      palmData.explosionGroup, 
      particleCount,
      { 
        min: 0.4 * radiusScaleFactor, 
        max: 0.4 * radiusScaleFactor 
      },
      { 
        min: 0.12 * radiusScaleFactor, 
        max: 0.12 * radiusScaleFactor 
      },
      true
    );
    
    // Mark as exploded
    palmData.hasExploded = true;
    palmData.explosionAge = 0;
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
    
    // Create new palms with delay until we reach the maximum
    this.lastPalmTime += delta;
    if (this.lastPalmTime >= this.palmDelay && this.palmsCreated < this.palmCount) {
      this.createFallingPalm();
      this.lastPalmTime = 0;
    }
    
    // Update all palm groups
    this.updatePalmGroups(delta);
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
      
      // Fade out when all palms are created
      if (this.palmsCreated >= this.palmCount) {
        this.areaIndicator.material.opacity *= Math.max(0, 1 - (this.age - (this.palmCount * this.palmDelay)) / 2);
      }
    }
  }
  
  /**
   * Update all palm groups
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updatePalmGroups(delta) {
    for (let i = this.palmGroups.length - 1; i >= 0; i--) {
      const palmData = this.palmGroups[i];
      palmData.age += delta;
      
      if (!palmData.hasExploded) {
        // Update falling palm
        this.updateFallingPalm(palmData, delta);
      } else {
        // Update explosion
        palmData.explosionAge += delta;
        this.updatePalmExplosion(palmData, delta);
        
        // Remove palm if explosion is finished
        if (palmData.explosionAge >= 1.5) {
          this.disposeObject(palmData.group);
          this.palmGroups.splice(i, 1);
        }
      }
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
    
    // Check if palm has hit the ground - add a small offset (2.0 units) to ensure it reaches the ground
    if (palmData.group.position.y <= this.centerPosition.y) {
      // Snap to ground
      palmData.group.position.y = 0.5;
      
      // Create explosion
      this.createPalmExplosion(palmData);
    }
    
    // Update particles
    this.updateOrbitingParticles(palmData.particles, palmData.age);
  }
  
  /**
   * Update a palm explosion
   * @param {Object} palmData - Data for the palm explosion to update
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updatePalmExplosion(palmData, delta) {
    const explosionGroup = palmData.explosionGroup;
    const explosionAge = palmData.explosionAge;
    
    // Update giant palm
    if (explosionGroup.children.length > 0) {
      const giantPalm = explosionGroup.children[0];
      if (giantPalm && giantPalm.userData) {
        // Scale up to target size
        const scaleProgress = Math.min(explosionAge * 2, 1); // Complete in 0.5 seconds
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
    if (explosionGroup.children.length > 1) {
      const core = explosionGroup.children[1];
      if (core) {
        // Pulse size
        const pulseScale = 1.0 + 0.5 * Math.sin(explosionAge * 10);
        core.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Fade out
        core.material.opacity = Math.max(0, 1 - explosionAge * 0.5);
      }
    }
    
    // Update explosion waves
    for (let i = 2; i < 6; i++) { // Waves are at indices 2, 3, 4, 5
      if (i < explosionGroup.children.length) {
        const wave = explosionGroup.children[i];
        this.updateWave(wave, explosionAge, delta);
      }
    }
    
    // Update explosion particles
    for (let i = 6; i < explosionGroup.children.length; i++) {
      const particle = explosionGroup.children[i];
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
    this.lastPalmTime = 0;
    
    // Clear palm groups
    this.palmGroups.length = 0;
  }
  
  /**
   * Create scaled fingers for the palm based on skill radius
   * @param {THREE.Group} handGroup - Group to add fingers to
   * @param {number} scaleFactor - Scale factor based on skill radius
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
   * @param {number} scaleFactor - Scale factor based on skill radius
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
}