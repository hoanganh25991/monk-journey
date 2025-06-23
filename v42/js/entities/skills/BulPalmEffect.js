import * as THREE from "three";
import { SkillEffect } from "./SkillEffect.js";

/**
 * Specialized effect for Bul Palm skill
 * Creates a giant palm that travels on the ground, causing periodic explosions along its path
 */
export class BulPalmEffect extends SkillEffect {
  constructor(skill) {
    super(skill);
    
    // Palm effect settings
    this.palmHeight = 0.5; // Height above ground
    this.palmScale = 1.5; // Size of the palm
    
    // Explosion settings
    this.explosionInterval = 0.5; // Time between explosions in seconds
    this.lastExplosionTime = 0;
    this.explosionTrail = []; // Store explosion effects along the path
    
    // State tracking
    this.direction = null;
    this.distanceTraveled = 0;
    
    // Default color (fallback if skill color is not defined)
    this.defaultColor = 0x33ff33; // Green color for Bul Palm
  }
  
  /**
   * Get the skill color or use the default green color as fallback
   * @returns {number} - The color value to use
   * @private
   */
  getSkillColor() {
    return this.skill && this.skill.color ? this.skill.color : this.defaultColor;
  }
  
  /**
   * Get a lighter variant of the skill color for highlights
   * @returns {number} - The lighter color value
   * @private
   */
  getLighterColor() {
    const color = new THREE.Color(this.getSkillColor());
    // Make the color lighter
    color.r = Math.min(1, color.r * 1.3);
    color.g = Math.min(1, color.g * 1.3);
    color.b = Math.min(1, color.b * 1.3);
    return color.getHex();
  }
  
  /**
   * Get a brighter variant of the skill color for emissive effects
   * @returns {number} - The brighter color value
   * @private
   */
  getBrighterColor() {
    const color = new THREE.Color(this.getSkillColor());
    // Make the color brighter for emissive
    color.r = Math.min(1, color.r * 1.5);
    color.g = Math.min(1, color.g * 1.5);
    color.b = Math.min(1, color.b * 1.5);
    return color.getHex();
  }

  /**
   * Create a standard material with common properties
   * @param {number} color - The color to use
   * @param {number} emissiveIntensity - The emissive intensity
   * @param {boolean} useEmissive - Whether to use emissive
   * @param {number} opacity - The opacity
   * @param {boolean} wireframe - Whether to use wireframe
   * @param {boolean} doubleSided - Whether to render both sides
   * @returns {THREE.MeshStandardMaterial|THREE.MeshBasicMaterial} - The created material
   */
  createMaterial(color, emissiveIntensity = 2.5, useEmissive = true, opacity = 0.9, wireframe = false, doubleSided = false) {
    const materialType = useEmissive ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial;
    const materialOptions = {
      color: color,
      transparent: true,
      opacity: opacity,
      wireframe: wireframe,
      side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
    };
    
    if (useEmissive) {
      materialOptions.emissive = color;
      materialOptions.emissiveIntensity = emissiveIntensity;
    }
    
    return new materialType(materialOptions);
  }

  /**
   * Create a Bul Palm effect
   * @param {THREE.Vector3} position - Position to place the palm
   * @param {THREE.Vector3} direction - Direction to move
   * @returns {THREE.Group} - The created effect
   */
  create(position, direction) {
    try {
      // Clone position to avoid modifying the original
      position = position.clone();
      
      // Create a group for the effect
      const effectGroup = new THREE.Group();
      
      // Store the direction for movement
      this.direction = direction ? direction.clone().normalize() : new THREE.Vector3(0, 0, 1);
      
      // Create the palm effect
      this.createPalmEffect(effectGroup, position);
      
      // Position effect at the starting position
      // Adjust Y position to be on the ground
      position.y = this.palmHeight;
      effectGroup.position.copy(position);
      
      // Set the correct rotation to face the direction
      if (direction) {
        const rotationAngle = Math.atan2(direction.x, direction.z);
        effectGroup.rotation.y = rotationAngle;
      }
      
      // Calculate target position based on direction and range
      this.targetPosition = position.clone().add(
        this.direction.clone().multiplyScalar(this.skill.range || 40)
      );
      
      // Store effect
      this.effect = effectGroup;
      this.isActive = true;
      
      return effectGroup;
    } catch (error) {
      console.error("Error creating BulPalm effect:", error);
      return new THREE.Group();
    }
  }

  /**
   * Create the palm effect visuals
   * @param {THREE.Group} effectGroup - Group to add the effect to
   * @param {THREE.Vector3} position - Position to place the palm
   * @private
   */
  createPalmEffect(effectGroup, position) {
    try {
      // Create the main palm group
      const palmGroup = new THREE.Group();

      // Create a 3D palm model with fingers
      const handGroup = new THREE.Group();
      
      // Create palm base (hand)
      const palmBaseGeometry = new THREE.BoxGeometry(1.5, 0.4, 1.8);
      const palmBaseMaterial = this.createMaterial(this.getSkillColor());
      
      const palmBase = new THREE.Mesh(palmBaseGeometry, palmBaseMaterial);
      palmBase.position.y = 0;
      handGroup.add(palmBase);
      
      // Create fingers (5 elongated shapes)
      this.createFingers(handGroup);
      
      // Add energy aura around the hand
      this.createAura(handGroup);
      
      // Add energy particles around the hand
      this.particles = this.createParticleSystem(
        handGroup, 
        55, // particleCount
        { min: 1.4, max: 2.2 }, // radius range
        { min: 0.06, max: 0.16 }, // size range
        false, // no gravity
        true // orbit animation
      );
      
      // Add trailing energy effect
      this.createTrailingEffect(handGroup);
      
      // Set hand orientation
      handGroup.rotation.x = -Math.PI / 2; // Point fingers forward
      
      // Position hand above ground
      handGroup.position.y = 1.8;
      
      // Store references
      this.handGroup = handGroup;
      
      // Add hand to palm group
      palmGroup.add(handGroup);
      
      // Create explosion effect (initially hidden)
      this.createExplosionEffect(palmGroup);
      
      // Store references
      this.palmGroup = palmGroup;
      
      // Add palm group to effect group
      effectGroup.add(palmGroup);
      
      // Initialize state
      this.age = 0;
      this.phase = "traveling"; // 'traveling', 'exploding'
      this.explosionTriggered = false;
      this.explosionTriggerTime = 0;
      
    } catch (error) {
      console.error("Error in createPalmEffect:", error);
    }
  }

  /**
   * Create fingers for the palm
   * @param {THREE.Group} handGroup - Group to add fingers to
   * @private
   */
  createFingers(handGroup) {
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
      // Create finger
      const fingerGeometry = new THREE.BoxGeometry(
        0.22,
        0.275,
        fingerLengths[i]
      );
      const fingerMaterial = this.createMaterial(this.getSkillColor());
      
      const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
      
      // Position finger
      finger.position.set(
        fingerPositions[i].x,
        0.1,
        fingerPositions[i].z + fingerLengths[i] / 2
      );
      
      // Add finger joints (knuckles)
      const knuckleGeometry = new THREE.SphereGeometry(0.125, 8, 8);
      const knuckleMaterial = this.createMaterial(this.getLighterColor());
      
      const knuckle = new THREE.Mesh(knuckleGeometry, knuckleMaterial);
      knuckle.position.set(fingerPositions[i].x, 0.1, fingerPositions[i].z);
      
      handGroup.add(finger);
      handGroup.add(knuckle);
      
      // Add fingernails
      this.createFingernail(handGroup, fingerPositions[i], fingerLengths[i]);
    }
  }

  /**
   * Create a fingernail
   * @param {THREE.Group} handGroup - Group to add the nail to
   * @param {Object} position - Position data for the finger
   * @param {number} fingerLength - Length of the finger
   * @private
   */
  createFingernail(handGroup, position, fingerLength) {
    const nailGeometry = new THREE.BoxGeometry(0.18, 0.09, 0.18);
    
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
      0.18,
      position.z + fingerLength
    );
    
    handGroup.add(nail);
  }

  /**
   * Create an energy aura around the hand
   * @param {THREE.Group} handGroup - Group to add the aura to
   * @private
   */
  createAura(handGroup) {
    const auraGeometry = new THREE.SphereGeometry(1.8, 16, 16);
    const auraMaterial = this.createMaterial(
      this.getBrighterColor(), 
      2.5, 
      true, 
      0.6, 
      true, 
      true
    );
    
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.scale.set(1.8, 0.9, 2.1);
    handGroup.add(aura);
  }

  /**
   * Create a particle system
   * @param {THREE.Group} parent - The parent group to add particles to
   * @param {number} count - Number of particles to create
   * @param {Object} radiusRange - Min and max radius for particle distribution
   * @param {Object} sizeRange - Min and max size of particles
   * @param {boolean} useGravity - Whether particles should have gravity
   * @param {boolean} useOrbit - Whether particles should orbit
   * @returns {Array} - Array of created particles
   * @private
   */
  createParticleSystem(parent, count, radiusRange, sizeRange, useGravity = false, useOrbit = false) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      // Random position around the center
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const radius = radiusRange.min + Math.random() * (radiusRange.max - radiusRange.min);
      
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi) * (useGravity ? 1 : 0.5); // Flatten in Y if not using gravity
      const z = radius * Math.cos(theta);
      
      // Create particle
      const particleSize = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min);
      const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
      const particleMaterial = this.createMaterial(
        this.getSkillColor(), 
        2.5, 
        true, 
        0.8 + Math.random() * 0.2
      );
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(x, y, z);
      
      // Store particle animation data
      particle.userData = {
        // Common properties
        age: 0,
        maxAge: useGravity ? (1 + Math.random()) : Infinity,
        
        // Orbit properties (if using orbit)
        ...(useOrbit && {
          orbitSpeed: 1.2 + Math.random() * 2.5,
          orbitRadius: new THREE.Vector3(x, y, z).length(),
          orbitAxis: new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize(),
          orbitAngle: Math.random() * Math.PI * 2,
          initialPosition: new THREE.Vector3(x, y, z),
        }),
        
        // Gravity properties (if using gravity)
        ...(useGravity && {
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ).normalize().multiplyScalar(Math.random() * 3 + 1.5),
          gravity: -0.1 - Math.random() * 0.05,
        })
      };
      
      parent.add(particle);
      particles.push(particle);
    }
    
    return particles;
  }

  /**
   * Create trailing energy effect
   * @param {THREE.Group} handGroup - Group to add the trail to
   * @private
   */
  createTrailingEffect(handGroup) {
    const trailCount = 9;
    this.trails = [];
    
    for (let i = 0; i < trailCount; i++) {
      const trailGeometry = new THREE.PlaneGeometry(1.5, 1.5);
      const trailMaterial = this.createMaterial(
        this.getSkillColor(), 
        0, 
        false, 
        0.8 - i * 0.08, 
        false, 
        true
      );
      
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.z = -0.8 - i * 0.5;
      trail.rotation.x = Math.PI / 2;
      
      handGroup.add(trail);
      this.trails.push(trail);
    }
  }

  /**
   * Create explosion effect
   * @param {THREE.Group} palmGroup - Group to add the explosion to
   * @private
   */
  createExplosionEffect(palmGroup) {
    const explosionGroup = new THREE.Group();
    explosionGroup.visible = false;

    // Create giant palm for explosion
    this.createGiantPalm(explosionGroup);
    
    // Create explosion core
    const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMaterial = this.createMaterial(this.getBrighterColor());
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    explosionGroup.add(core);
    
    // Create explosion waves
    this.createWaveSystem(explosionGroup, 4, 0.4);
    
    // Create explosion particles
    this.createParticleSystem(
      explosionGroup, 
      35, // particleCount
      { min: 0.4, max: 0.4 }, // radius range
      { min: 0.12, max: 0.12 }, // size range
      true // use gravity
    );
    
    // Store references
    this.explosionGroup = explosionGroup;
    
    // Add explosion group to palm group
    palmGroup.add(explosionGroup);
  }

  /**
   * Create a giant palm shape for the explosion
   * @param {THREE.Group} explosionGroup - Group to add the giant palm to
   * @private
   */
  createGiantPalm(explosionGroup) {
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
    
    // Store animation data
    giantPalm.userData = {
      initialScale: 0.3,
      targetScale: 4.5,
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
   * Create a wave system for explosions
   * @param {THREE.Group} parent - The parent group to add waves to
   * @param {number} count - Number of waves to create
   * @param {number} baseSize - Base size of waves
   * @returns {Array} - Array of created waves
   * @private
   */
  createWaveSystem(parent, count, baseSize) {
    const waves = [];
    
    for (let i = 0; i < count; i++) {
      const waveGeometry = new THREE.SphereGeometry(baseSize, 16, 16);
      const waveMaterial = this.createMaterial(
        this.getSkillColor(), 
        1.5, 
        true, 
        0.8 - i * 0.1, 
        true
      );
      
      const wave = new THREE.Mesh(waveGeometry, waveMaterial);
      
      // Store animation data
      wave.userData = {
        expansionSpeed: 3.5 - i * 0.5,
        initialScale: 1.2 + i * 0.6,
      };
      
      // Set initial scale
      wave.scale.set(
        wave.userData.initialScale,
        wave.userData.initialScale,
        wave.userData.initialScale
      );
      
      parent.add(wave);
      waves.push(wave);
    }
    
    return waves;
  }

  /**
   * Create a periodic explosion along the path
   * @param {THREE.Vector3} position - Position to create the explosion
   * @private
   */
  createPathExplosion(position) {
    // Create a new explosion group
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);
    
    // Create explosion core
    const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const coreMaterial = this.createMaterial(this.getBrighterColor());

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    explosionGroup.add(core);

    // Create explosion waves
    const waves = this.createWaveSystem(explosionGroup, 3, 0.3);

    // Create explosion particles
    const particles = this.createParticleSystem(
      explosionGroup, 
      20, // particleCount
      { min: 0.3, max: 0.3 }, // radius range
      { min: 0.1, max: 0.1 }, // size range
      true // use gravity
    );

    // Add to scene
    if (this.effect && this.effect.parent) {
      this.effect.parent.add(explosionGroup);
    } else {
      this.effect.add(explosionGroup);
    }

    // Store explosion data
    const explosionData = {
      group: explosionGroup,
      age: 0,
      maxAge: 1.5, // Explosion lasts for 1.5 seconds
      waves: waves,
      particles: particles,
    };

    // Add to explosion trail
    this.explosionTrail.push(explosionData);

    return explosionData;
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
    
    // Handle different phases
    switch (this.phase) {
      case "traveling":
        this.updateTravelingPhase(delta);
        break;
      case "exploding":
        this.updateExplodingPhase(delta);
        break;
    }
    
    // Update explosion trail
    this.updateExplosionTrail(delta);
  }

  /**
   * Update the traveling phase of the palm
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateTravelingPhase(delta) {
    // Calculate distance to target
    const currentPosition = this.effect.position.clone();
    const distanceToTarget = currentPosition.distanceTo(this.targetPosition);
    
    // Calculate movement speed
    const speed = this.skill.projectileSpeed || 18;
    const moveDistance = Math.min(speed * delta, distanceToTarget);
    this.distanceTraveled += moveDistance;
    
    // Move the palm forward
    if (this.direction) {
      this.effect.position.x += this.direction.x * moveDistance;
      this.effect.position.z += this.direction.z * moveDistance;
    }
    
    // Animate hand
    if (this.handGroup) {
      // Slight bobbing motion
      this.handGroup.position.y = 1.8 + Math.sin(this.age * 6) * 0.15;
      
      // Slight rotation
      this.handGroup.rotation.z = Math.sin(this.age * 4) * 0.15;
    }
    
    // Animate particles
    this.updateOrbitingParticles(this.particles, this.age);
    
    // Animate trails
    this.updateTrails(delta);
    
    // Create periodic explosions along the path
    this.createPeriodicExplosions(delta);
    
    // Check if palm has reached the target or maximum distance
    this.checkTargetReached(distanceToTarget);
  }

  /**
   * Update orbiting particles
   * @param {Array} particles - Array of particles to update
   * @param {number} age - Current age of the effect
   * @private
   */
  updateOrbitingParticles(particles, age) {
    for (const particle of particles) {
      if (particle.userData && particle.userData.orbitAxis) {
        // Orbit around hand
        const axis = particle.userData.orbitAxis;
        const angle = particle.userData.orbitAngle + age * particle.userData.orbitSpeed;
        const radius = particle.userData.orbitRadius;
        
        // Create rotation matrix
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        const initialPos = particle.userData.initialPosition.clone();
        initialPos.applyMatrix4(rotationMatrix);
        
        particle.position.copy(initialPos);
      }
    }
  }

  /**
   * Update trailing effects
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateTrails(delta) {
    for (let i = 0; i < this.trails.length; i++) {
      const trail = this.trails[i];
      // Fade out trails based on distance
      const maxDistance = this.skill.range || 40;
      trail.material.opacity = (0.8 - i * 0.08) * (1 - this.distanceTraveled / maxDistance);
    }
  }

  /**
   * Create periodic explosions along the path
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  createPeriodicExplosions(delta) {
    this.lastExplosionTime += delta;
    if (this.lastExplosionTime >= this.explosionInterval) {
      // Create explosion at current position
      const explosionPosition = this.effect.position.clone();
      explosionPosition.y += 0.5; // Raise explosion slightly above ground
      this.createPathExplosion(explosionPosition);
      
      // Reset timer
      this.lastExplosionTime = 0;
    }
  }

  /**
   * Check if the palm has reached its target
   * @param {number} distanceToTarget - Distance to the target
   * @private
   */
  checkTargetReached(distanceToTarget) {
    const maxDistance = this.skill.range || 40;
    if (distanceToTarget < 1.0 || this.distanceTraveled >= maxDistance) {
      // Transition to exploding phase
      this.phase = "exploding";
      
      // Make explosion group visible
      if (this.explosionGroup) {
        this.explosionGroup.visible = true;
      }
      
      // Hide hand group
      if (this.handGroup) {
        this.handGroup.visible = false;
      }
    }
  }

  /**
   * Update the exploding phase of the palm
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateExplodingPhase(delta) {
    // Calculate explosion age
    if (!this.explosionTriggered) {
      this.explosionTriggered = true;
      this.explosionTriggerTime = this.age;
    }
    
    const explosionAge = this.age - this.explosionTriggerTime;
    
    // Update giant palm
    this.updateGiantPalm(explosionAge, delta);
    
    // Update explosion core
    this.updateExplosionCore(explosionAge);
    
    // Update explosion waves
    this.updateExplosionWaves(explosionAge, delta);
    
    // Update explosion particles
    this.updateExplosionParticles(delta);
  }

  /**
   * Update the giant palm in the explosion
   * @param {number} explosionAge - Age of the explosion
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateGiantPalm(explosionAge, delta) {
    const giantPalm = this.explosionGroup.children[0];
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

  /**
   * Update the explosion core
   * @param {number} explosionAge - Age of the explosion
   * @private
   */
  updateExplosionCore(explosionAge) {
    const core = this.explosionGroup.children[1];
    if (core) {
      // Pulse size
      const pulseScale = 1.0 + 0.5 * Math.sin(explosionAge * 10);
      core.scale.set(pulseScale, pulseScale, pulseScale);
      
      // Fade out
      core.material.opacity = Math.max(0, 1 - explosionAge * 0.5);
    }
  }

  /**
   * Update explosion waves
   * @param {number} explosionAge - Age of the explosion
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateExplosionWaves(explosionAge, delta) {
    for (let i = 2; i < 6; i++) { // Waves are at indices 2, 3, 4, 5
      if (i < this.explosionGroup.children.length) {
        const wave = this.explosionGroup.children[i];
        this.updateWave(wave, explosionAge, delta);
      }
    }
  }

  /**
   * Update a wave with standard animation
   * @param {THREE.Mesh} wave - The wave to update
   * @param {number} age - Age of the effect
   * @param {number} delta - Time since last update
   * @private
   */
  updateWave(wave, age, delta) {
    if (wave && wave.userData) {
      // Expand wave
      const expansionScale = wave.userData.initialScale + wave.userData.expansionSpeed * age;
      wave.scale.set(expansionScale, expansionScale, expansionScale);
      
      // Fade out
      wave.material.opacity = Math.max(0, wave.material.opacity - delta * 0.5);
    }
  }

  /**
   * Update explosion particles
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateExplosionParticles(delta) {
    for (let i = 6; i < this.explosionGroup.children.length; i++) {
      const particle = this.explosionGroup.children[i];
      this.updateParticle(particle, delta);
    }
  }

  /**
   * Update a particle with standard animation
   * @param {THREE.Mesh} particle - The particle to update
   * @param {number} delta - Time since last update
   * @private
   */
  updateParticle(particle, delta) {
    if (particle && particle.userData) {
      // Update age
      particle.userData.age += delta;
      
      // Move particle if it has velocity
      if (particle.userData.velocity) {
        particle.position.x += particle.userData.velocity.x * delta;
        particle.position.y += particle.userData.velocity.y * delta;
        particle.position.z += particle.userData.velocity.z * delta;
        
        // Apply gravity if defined
        if (particle.userData.gravity) {
          particle.userData.velocity.y += particle.userData.gravity * delta;
        }
      }
      
      // Fade out based on age
      if (particle.userData.maxAge !== Infinity) {
        const ageProgress = particle.userData.age / particle.userData.maxAge;
        particle.material.opacity = Math.max(0, 1 - ageProgress);
        
        // Scale down
        const scale = Math.max(0.1, 1 - ageProgress);
        particle.scale.set(scale, scale, scale);
      }
    }
  }

  /**
   * Update the explosion trail
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateExplosionTrail(delta) {
    // Update each explosion in the trail
    for (let i = this.explosionTrail.length - 1; i >= 0; i--) {
      const explosion = this.explosionTrail[i];
      explosion.age += delta;
      
      // Update explosion waves
      for (const wave of explosion.waves) {
        this.updateWave(wave, explosion.age, delta);
      }
      
      // Update explosion particles
      for (const particle of explosion.particles) {
        this.updateParticle(particle, delta);
      }
      
      // Remove explosion if it's too old
      if (explosion.age >= explosion.maxAge) {
        this.disposeObject(explosion.group);
        
        // Remove from array
        this.explosionTrail.splice(i, 1);
      }
    }
  }

  /**
   * Dispose of a Three.js object and its children
   * @param {THREE.Object3D} object - The object to dispose
   * @private
   */
  disposeObject(object) {
    // Remove from scene
    if (object.parent) {
      object.parent.remove(object);
    }
    
    // Dispose of resources
    object.traverse(child => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(child.material);
        }
      }
      
      // Clear any userData
      if (child.userData) {
        // If userData contains Vector3 objects, null them out
        if (child.userData.initialPosition) {
          child.userData.initialPosition = null;
        }
        if (child.userData.velocity) {
          child.userData.velocity = null;
        }
        if (child.userData.orbitAxis) {
          child.userData.orbitAxis = null;
        }
        
        // Clear the userData object
        child.userData = {};
      }
    });
  }

  /**
   * Dispose of a material and its textures
   * @param {THREE.Material} material - The material to dispose
   * @private
   */
  disposeMaterial(material) {
    // Dispose of any textures
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
    
    // Dispose of the material itself
    material.dispose();
  }

  /**
   * Enhanced dispose method to properly clean up all resources
   */
  dispose() {
    if (!this.effect) return;
    
    // Clear references
    this.particles = [];
    this.trails = [];
    this.handGroup = null;
    this.explosionGroup = null;
    this.palmGroup = null;
    
    // Clean up explosion trail
    for (const explosion of this.explosionTrail) {
      this.disposeObject(explosion.group);
    }
    
    // Clear explosion trail
    this.explosionTrail.length = 0;
    
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
    this.lastExplosionTime = 0;
    this.distanceTraveled = 0;
    
    // Clear explosion trail
    this.explosionTrail.length = 0;
  }
}