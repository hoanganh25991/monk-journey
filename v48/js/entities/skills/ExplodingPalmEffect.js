import * as THREE from "three";
import { SkillEffect } from "./SkillEffect.js";

/**
 * Specialized effect for Exploding Palm skill
 */
export class ExplodingPalmEffect extends SkillEffect {
  constructor(skill) {
    super(skill);
    this.markSize = 1.0;
    this.markHeight = 2.0;
    this.targetEntity = null;
    this.explodingPalmState = null;
  }

  /**
   * Create an Exploding Palm effect
   * @param {THREE.Vector3} position - Position to place the mark
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
      this.createMarkEffect(effectGroup, position);
      
      // Position effect at the starting position
      // Adjust Y position to be on the ground
      position.y = this.markHeight;
      effectGroup.position.copy(position);
      
      // Set the correct rotation to face the direction
      if (direction) {
        const rotationAngle = Math.atan2(direction.x, direction.z);
        effectGroup.rotation.y = rotationAngle;
      }
      
      // Calculate target position based on direction and range
      this.targetPosition = position.clone().add(
        this.direction.clone().multiplyScalar(this.explodingPalmState.maxDistance || 30)
      );
      
      // Store effect
      this.effect = effectGroup;
      this.isActive = true;
      
      return effectGroup;
    } catch (error) {
      console.error("Error creating ExplodingPalm effect:", error);
      return new THREE.Group();
    }
  }

  /**
   * Create the Exploding Palm effect
   * @param {THREE.Group} effectGroup - Group to add the effect to
   * @param {THREE.Vector3} position - Position to place the mark
   * @private
   */
  createMarkEffect(effectGroup, position) {
    try {
      // Create a flying palm effect that moves forward from the player

    // Create the main palm group
    const palmGroup = new THREE.Group();

    // Create a 3D palm model with fingers
    const handGroup = new THREE.Group();

    // Create palm base (hand) - INCREASED SIZE for visibility
    const palmBaseGeometry = new THREE.BoxGeometry(1.2, 0.3, 1.5);
    const palmBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xff3333,
      emissiveIntensity: 2, // Increased intensity
      transparent: true,
      opacity: 0.9,
    });

    const palmBase = new THREE.Mesh(palmBaseGeometry, palmBaseMaterial);
    palmBase.position.y = 0;
    handGroup.add(palmBase);

    // Create fingers (5 elongated shapes)
    const fingerCount = 5;
    const fingerPositions = [
      { x: -0.45, z: 0.6 }, // Thumb - adjusted positions
      { x: -0.225, z: 0.75 }, // Index
      { x: 0, z: 0.825 }, // Middle
      { x: 0.225, z: 0.75 }, // Ring
      { x: 0.45, z: 0.6 }, // Pinky
    ];

    const fingerLengths = [0.45, 0.6, 0.75, 0.6, 0.45]; // Longer fingers for visibility

    for (let i = 0; i < fingerCount; i++) {
      // Create finger - INCREASED SIZE for visibility
      const fingerGeometry = new THREE.BoxGeometry(
        0.18,
        0.225,
        fingerLengths[i]
      );
      const fingerMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff3333,
        emissiveIntensity: 2, // Increased intensity
        transparent: true,
        opacity: 0.9,
      });

      const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);

      // Position finger
      finger.position.set(
        fingerPositions[i].x,
        0.075,
        fingerPositions[i].z + fingerLengths[i] / 2
      );

      // Add finger joints (knuckles) - INCREASED SIZE for visibility
      const knuckleGeometry = new THREE.SphereGeometry(0.105, 8, 8);
      const knuckleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        emissive: 0xff4444,
        emissiveIntensity: 2, // Increased intensity
        transparent: true,
        opacity: 0.9,
      });

      const knuckle = new THREE.Mesh(knuckleGeometry, knuckleMaterial);
      knuckle.position.set(fingerPositions[i].x, 0.075, fingerPositions[i].z);

      handGroup.add(finger);
      handGroup.add(knuckle);

      // Add fingernails - INCREASED SIZE for visibility
      const nailGeometry = new THREE.BoxGeometry(0.15, 0.075, 0.15);
      const nailMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdddd,
        emissive: 0xffaaaa,
        emissiveIntensity: 1.5, // Increased intensity
        transparent: true,
        opacity: 0.9,
      });

      const nail = new THREE.Mesh(nailGeometry, nailMaterial);
      nail.position.set(
        fingerPositions[i].x,
        0.15,
        fingerPositions[i].z + fingerLengths[i]
      );

      handGroup.add(nail);
    }

    // Add energy aura around the hand - INCREASED SIZE for visibility
    const auraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const auraMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff5500,
      emissiveIntensity: 2, // Increased intensity
      transparent: true,
      opacity: 0.5, // Increased opacity
      side: THREE.DoubleSide,
      wireframe: true,
    });

    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.scale.set(1.5, 0.75, 1.8); // Increased scale
    handGroup.add(aura);

    // Add energy particles around the hand - INCREASED SIZE and COUNT
    const particleCount = 45; // More particles
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      // Random position around the hand
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const radius = 1.2 + Math.random() * 0.6; // Larger radius

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi) * 0.5; // Flatten in Y
      const z = radius * Math.cos(theta);

      // Create particle - INCREASED SIZE
      const particleSize = 0.05 + Math.random() * 0.08; // Larger particles
      const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff3300,
        emissiveIntensity: 2, // Increased intensity
        transparent: true,
        opacity: 0.8 + Math.random() * 0.2, // Higher opacity
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(x, y, z);

      // Store particle animation data
      particle.userData = {
        orbitSpeed: 1.0 + Math.random() * 2.0, // Faster orbit
        orbitRadius: new THREE.Vector3(x, y, z).length(),
        orbitAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        orbitAngle: Math.random() * Math.PI * 2,
        initialPosition: new THREE.Vector3(x, y, z),
      };

      handGroup.add(particle);
      particles.push(particle);
    }

    // Add trailing energy effect - INCREASED SIZE
    const trailCount = 7; // More trails
    const trails = [];

    for (let i = 0; i < trailCount; i++) {
      const trailGeometry = new THREE.PlaneGeometry(1.2, 1.2); // Larger trails
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.7 - i * 0.1, // Higher base opacity
        side: THREE.DoubleSide,
      });

      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.z = -0.7 - i * 0.4; // More spacing
      trail.rotation.x = Math.PI / 2;

      handGroup.add(trail);
      trails.push(trail);
    }

    // Rotate hand to face forward with fingers pointing upward (to the sky)
    handGroup.rotation.x = -Math.PI / 2; // Rotate to make fingers point up
    handGroup.rotation.z = 0; // No rotation on Z axis

    // Position higher for better visibility
    handGroup.position.y = 1.5; // Higher position

    palmGroup.add(handGroup);

    // Create explosion effect (initially hidden)
    const explosionGroup = new THREE.Group();
    explosionGroup.visible = false;

    // Create giant palm for explosion - IMPROVED SHAPE
    const giantPalmShape = new THREE.Shape();

    // Create a larger hand shape for the explosion
    // Palm center - INCREASED SIZE
    giantPalmShape.moveTo(0, 0);
    giantPalmShape.absarc(0, 0, 0.6, 0, Math.PI * 2, false); // Larger palm center

    // Fingers (5 elongated shapes) - IMPROVED SHAPE
    const giantFingerCount = 5;
    for (let i = 0; i < giantFingerCount; i++) {
      const angle = (i / giantFingerCount) * Math.PI * 1.2 - Math.PI * 0.1;
      const length = 0.9 + (i === 2 ? 0.3 : 0); // Longer fingers, middle finger even longer

      const fingerShape = new THREE.Shape();
      fingerShape.moveTo(0, 0);
      fingerShape.absellipse(
        Math.cos(angle) * 0.6, // Adjusted to match larger palm
        Math.sin(angle) * 0.6,
        0.22, // Wider fingers
        length,
        0,
        Math.PI * 2,
        false,
        angle
      );

      giantPalmShape.holes.push(fingerShape);
    }

    const giantPalmGeometry = new THREE.ShapeGeometry(giantPalmShape);
    const giantPalmMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff3300,
      emissiveIntensity: 3, // Increased intensity
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

    const giantPalm = new THREE.Mesh(giantPalmGeometry, giantPalmMaterial);
    giantPalm.rotation.x = -Math.PI / 2;
    giantPalm.position.y = 0.5; // Position above ground
    giantPalm.scale.set(4, 4, 4); // Make it even larger

    // Store animation data
    giantPalm.userData = {
      initialScale: 0.2, // Start slightly larger
      targetScale: 4, // Grow to larger size
      rotationSpeed: 1.5, // Rotate faster
    };

    // Start with small scale
    giantPalm.scale.set(
      giantPalm.userData.initialScale,
      giantPalm.userData.initialScale,
      giantPalm.userData.initialScale
    );

    explosionGroup.add(giantPalm);

    // Create explosion core
    const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff5500,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9,
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    explosionGroup.add(core);

    // Create explosion waves
    const waveCount = 3;
    for (let i = 0; i < waveCount; i++) {
      const waveGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const waveMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff3300,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.7 - i * 0.1,
        wireframe: true,
      });

      const wave = new THREE.Mesh(waveGeometry, waveMaterial);

      // Store animation data
      wave.userData = {
        expansionSpeed: 3 - i * 0.5,
        initialScale: 1 + i * 0.5,
      };

      // Set initial scale
      wave.scale.set(
        wave.userData.initialScale,
        wave.userData.initialScale,
        wave.userData.initialScale
      );

      explosionGroup.add(wave);
    }

    // Create explosion particles
    const explosionParticleCount = 30;
    for (let i = 0; i < explosionParticleCount; i++) {
      // Random direction
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const radius = 0.3;

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      // Create particle
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff3300,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.9,
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(x, y, z);

      // Store animation data
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(Math.random() * 3 + 1),
        gravity: -0.1,
        age: 0,
        maxAge: 1 + Math.random(),
      };

      explosionGroup.add(particle);
    }

    // Add explosion group to palm group
    palmGroup.add(explosionGroup);

    // Add palm group to effect group
    effectGroup.add(palmGroup);

    // Store animation state
    this.explodingPalmState = {
      age: 0,
      phase: "flying", // 'flying', 'attached', 'exploding'
      palmGroup: palmGroup,
      handGroup: handGroup,
      particles: particles,
      trails: trails,
      explosionGroup: explosionGroup,
      targetEntity: null,
      attachedPosition: null,
      flyingSpeed: 15, // Units per second
      distanceTraveled: 0,
      maxDistance: 30, // Maximum travel distance
      explosionTriggered: false,
      explosionTriggerTime: 0,
    };
    
    // Initialize state
    this.age = 0;
    this.distanceTraveled = 0;
    
    } catch (error) {
      console.error("Error in createMarkEffect:", error);
    }
  }

  /**
   * Update the Exploding Palm effect
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
    switch (this.explodingPalmState.phase) {
      case "flying":
        this.updateFlyingPhase(delta);
        break;
      case "attached":
        this.updateAttachedPhase(delta);
        break;
      case "exploding":
        this.updateExplodingPhase(delta);
        break;
    }
  }



  /**
   * Update the flying phase of the palm
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateFlyingPhase(delta) {
    // Calculate distance to target
    const currentPosition = this.effect.position.clone();
    const distanceToTarget = currentPosition.distanceTo(this.targetPosition);
    
    // Calculate movement speed
    const speed = this.explodingPalmState.flyingSpeed || 15;
    const moveDistance = Math.min(speed * delta, distanceToTarget);
    this.distanceTraveled += moveDistance;
    this.explodingPalmState.distanceTraveled = this.distanceTraveled;
    
    // Move the palm forward
    if (this.direction) {
      this.effect.position.x += this.direction.x * moveDistance;
      this.effect.position.z += this.direction.z * moveDistance;
    }
    
    // Update palm state age
    this.explodingPalmState.age = this.age;
    
    // Animate hand
    if (this.explodingPalmState.handGroup) {
      // Slight bobbing motion
      this.explodingPalmState.handGroup.position.y = 1.5 + Math.sin(this.age * 6) * 0.15;
      
      // Slight rotation
      this.explodingPalmState.handGroup.rotation.z = Math.sin(this.age * 4) * 0.15;
    }
    
    // Animate particles
    for (const particle of this.explodingPalmState.particles) {
      if (particle.userData) {
        // Orbit around hand
        const axis = particle.userData.orbitAxis;
        const angle = particle.userData.orbitAngle + this.age * particle.userData.orbitSpeed;
        const radius = particle.userData.orbitRadius;
        
        // Create rotation matrix
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        const initialPos = particle.userData.initialPosition.clone();
        initialPos.applyMatrix4(rotationMatrix);
        
        particle.position.copy(initialPos);
      }
    }
    
    // Animate trails
    for (let i = 0; i < this.explodingPalmState.trails.length; i++) {
      const trail = this.explodingPalmState.trails[i];
      // Fade out trails based on distance
      const maxDistance = this.explodingPalmState.maxDistance || 30;
      trail.material.opacity = (0.7 - i * 0.1) * (1 - this.distanceTraveled / maxDistance);
    }
    
    // Check if palm has reached the target or maximum distance
    const maxDistance = this.explodingPalmState.maxDistance || 30;
    if (distanceToTarget < 1.0 || this.distanceTraveled >= maxDistance) {
      // Transition to exploding phase
      this.explodingPalmState.phase = "exploding";
      
      // Make explosion group visible
      if (this.explodingPalmState.explosionGroup) {
        this.explodingPalmState.explosionGroup.visible = true;
      }
      
      // Hide hand group
      if (this.explodingPalmState.handGroup) {
        this.explodingPalmState.handGroup.visible = false;
      }
    }
  }

  /**
   * Update the attached phase of the palm
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateAttachedPhase(delta) {
    // If we have a target entity, update position to follow it
    if (
      this.explodingPalmState.targetEntity &&
      this.explodingPalmState.targetEntity.getPosition
    ) {
      const targetPos = this.explodingPalmState.targetEntity.getPosition();
      if (targetPos) {
        // Update palm position to follow target
        this.explodingPalmState.palmGroup.position.copy(targetPos);
        // Keep at appropriate height
        this.explodingPalmState.palmGroup.position.y = 1.5;
      }
    }

    // Pulse the hand
    const handGroup = this.explodingPalmState.handGroup;
    if (handGroup) {
      // Pulse scale
      const pulseScale =
        1.0 + 0.2 * Math.sin(this.explodingPalmState.age * 5);
      handGroup.scale.set(pulseScale, pulseScale, pulseScale);

      // Pulse color intensity
      handGroup.traverse((child) => {
        if (
          child.material &&
          child.material.emissiveIntensity !== undefined
        ) {
          child.material.emissiveIntensity =
            2.0 + Math.sin(this.explodingPalmState.age * 8);
        }
      });
    }

    // Check if target entity is dead
    if (
      this.explodingPalmState.targetEntity &&
      this.explodingPalmState.targetEntity.isDead &&
      this.explodingPalmState.targetEntity.isDead()
    ) {
      // Transition to exploding phase
      this.explodingPalmState.phase = "exploding";
      this.explodingPalmState.explosionGroup.visible = true;
      this.explodingPalmState.handGroup.visible = false;
    }
  }

  /**
   * Update the exploding phase of the palm
   * @param {number} delta - Time since last update in seconds
   * @private
   */
  updateExplodingPhase(delta) {
    // Calculate explosion age
    if (!this.explodingPalmState.explosionTriggered) {
      this.explodingPalmState.explosionTriggered = true;
      this.explodingPalmState.explosionTriggerTime = this.age;
    }
    
    const explosionAge = this.age - this.explodingPalmState.explosionTriggerTime;
    
    // Update giant palm
    const giantPalm = this.explodingPalmState.explosionGroup.children[0];
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
    
    // Update explosion core
    const core = this.explodingPalmState.explosionGroup.children[1];
    if (core) {
      // Pulse size
      const pulseScale = 1.0 + 0.5 * Math.sin(explosionAge * 10);
      core.scale.set(pulseScale, pulseScale, pulseScale);
      
      // Fade out
      core.material.opacity = Math.max(0, 1 - explosionAge * 0.5);
    }
    
    // Update explosion waves
    for (let i = 2; i < 5; i++) { // Waves are at indices 2, 3, 4
      if (i < this.explodingPalmState.explosionGroup.children.length) {
        const wave = this.explodingPalmState.explosionGroup.children[i];
        if (wave && wave.userData) {
          // Expand wave
          const expansionScale = wave.userData.initialScale + wave.userData.expansionSpeed * explosionAge;
          wave.scale.set(expansionScale, expansionScale, expansionScale);
          
          // Fade out
          wave.material.opacity = Math.max(0, wave.material.opacity - delta * 0.5);
        }
      }
    }
    
    // Update explosion particles
    for (let i = 5; i < this.explodingPalmState.explosionGroup.children.length; i++) {
      const particle = this.explodingPalmState.explosionGroup.children[i];
      if (particle && particle.userData) {
        // Update age
        particle.userData.age += delta;
        
        // Move particle
        particle.position.x += particle.userData.velocity.x * delta;
        particle.position.y += particle.userData.velocity.y * delta;
        particle.position.z += particle.userData.velocity.z * delta;
        
        // Apply gravity
        particle.userData.velocity.y += particle.userData.gravity * delta;
        
        // Fade out based on age
        const ageProgress = particle.userData.age / particle.userData.maxAge;
        particle.material.opacity = Math.max(0, 1 - ageProgress);
        
        // Scale down
        const scale = Math.max(0.1, 1 - ageProgress);
        particle.scale.set(scale, scale, scale);
      }
    }
  }

  /**
   * Enhanced dispose method to properly clean up all resources
   * Overrides the base class dispose method with more thorough cleanup
   */
  dispose() {
    if (!this.effect) return;
    
    // Clean up Exploding Palm specific resources
    if (this.explodingPalmState) {
      // Clear particle references
      if (this.explodingPalmState.particles) {
        this.explodingPalmState.particles.length = 0;
      }
      
      // Clear trail references
      if (this.explodingPalmState.trails) {
        this.explodingPalmState.trails.length = 0;
      }
      
      // Clear references
      this.explodingPalmState.palmGroup = null;
      this.explodingPalmState.handGroup = null;
      this.explodingPalmState.explosionGroup = null;
      this.explodingPalmState.targetEntity = null;
      
      // Clear state
      this.explodingPalmState = null;
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
    
    // Remove from parent
    if (this.effect.parent) {
      this.effect.parent.remove(this.effect);
    }
    
    // Clear references
    this.effect = null;
    this.isActive = false;
    this.currentDirection = null;
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
    this.targetEntity = null;
  }
}