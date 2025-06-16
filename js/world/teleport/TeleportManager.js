import * as THREE from 'three';
import { MULTIPLIER_PORTALS, RETURN_PORTAL, DESTINATION_TERRAINS } from '../../config/teleport-portals.js';
import { ZONE_COLORS } from '../../config/colors.js';
import { ZONE_ENEMIES } from '../../config/game-balance.js';
import { PortalModelFactory } from './PortalModelFactory.js';

/**
 * TeleportManager - Manages teleport portals in the game world
 */
export class TeleportManager {
    /**
     * Create a new TeleportManager
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {import("./../WorldManager.js").WorldManager} worldManager - Reference to the world manager
     * @param {import("./../../game/Game.js").Game} game
     */
    constructor(scene, worldManager, game) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Create portal model factory
        this.portalModelFactory = new PortalModelFactory(scene);
        
        // Array to store all teleport portals
        this.portals = [];
        
        // Portal animation properties - enhanced for spiral effects
        this.animationSpeed = 1.5;
        this.hoverHeight = 0.5;
        this.rotationSpeed = 0.02; // Increased for more dramatic spiral effect
        this.spiralIntensity = 2.0; // New property for spiral effect strength
        
        // Portal interaction properties
        this.interactionRadius = 4; // Player must be within this distance to trigger teleport
        this.teleportCooldown = 3000; // 3 seconds cooldown between teleports
        this.lastTeleportTime = 0;
        this.activePortal = null; // Currently active portal for interaction
        
        // Portal effect properties
        this.effectDuration = 2000; // 2 seconds teleport effect for longer distances
        this.fadeOutDuration = 1000; // 1 second fade out
        this.fadeInDuration = 1000; // 1 second fade in
        
        // Minimap properties
        this.minimapColor = 'rgba(0, 255, 255, 0.8)'; // Cyan color for minimap
        this.minimapSize = 6; // Size on minimap
        
        // Multiplier portal properties
        this.multiplierPortals = MULTIPLIER_PORTALS;
        this.returnPortal = RETURN_PORTAL;
        this.destinationTerrains = DESTINATION_TERRAINS;
        this.activeMultiplier = 1; // Default multiplier (no effect)
        this.lastPlayerPosition = null; // Store position before teleporting to multiplier zone
        this.currentDestinationTerrain = null; // Current terrain type for multiplier destination
        this.returnPortalMesh = null; // Reference to return portal mesh
        
        // Text display for portals
        this.portalLabels = {}; // Store references to portal labels
        
        // Setup click/touch event listeners
        this.setupTouchClickEvents();
    }
    
    /**
     * Setup touch and click event listeners for portal interaction
     */
    setupTouchClickEvents() {
        // Add click/touch event listener to the canvas
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // Use both click and touchend events for better cross-device support
            canvas.addEventListener('click', this.handleTouchClick.bind(this));
            canvas.addEventListener('touchend', this.handleTouchClick.bind(this));
            console.debug('Touch/click event listeners added for portal interaction');
        } else {
            console.warn('Canvas not found, touch/click events for portals not initialized');
            // Try again when the DOM is fully loaded
            window.addEventListener('DOMContentLoaded', () => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    canvas.addEventListener('click', this.handleTouchClick.bind(this));
                    canvas.addEventListener('touchend', this.handleTouchClick.bind(this));
                    console.debug('Touch/click event listeners added on DOMContentLoaded');
                }
            });
        }
    }
    
    /**
     * Handle touch or click events for portal interaction
     * @param {Event} event - The touch or click event
     */
    handleTouchClick(event) {
        // Skip if no active portal or on cooldown
        if (!this.activePortal || Date.now() - this.lastTeleportTime < this.teleportCooldown) {
            return;
        }
        
        // Skip if game is not initialized
        if (!this.game) {
            console.warn("Cannot teleport: game is not initialized");
            return;
        }
        
        // Prevent default behavior for touch events
        if (event.type === 'touchend') {
            event.preventDefault();
        }
        
        console.debug('Touch/click detected with active portal - teleporting player');
        
        // Check if we're in multiplayer mode and have remote players
        if (this.game.multiplayerManager && this.game.multiplayerManager.remotePlayerManager) {
            const remotePlayerManager = this.game.multiplayerManager.remotePlayerManager;
            const remotePlayers = remotePlayerManager.getPlayers();
            
            // Check if any remote players are near the portal
            let closestPlayer = null;
            let closestDistance = this.interactionRadius;
            
            // First check the local player
            if (this.game.player && this.game.player.getPosition) {
                try {
                    const playerPos = this.game.player.getPosition();
                    const portalPos = this.activePortal.sourcePosition;
                    const distance = Math.sqrt(
                        Math.pow(playerPos.x - portalPos.x, 2) + 
                        Math.pow(playerPos.z - portalPos.z, 2)
                    );
                    
                    if (distance < closestDistance) {
                        closestPlayer = this.game.player;
                        closestDistance = distance;
                    }
                } catch (error) {
                    console.warn("Error checking local player position:", error);
                }
            }
            
            // Then check remote players
            remotePlayers.forEach((remotePlayer, peerId) => {
                if (remotePlayer && remotePlayer.getPosition) {
                    try {
                        const playerPos = remotePlayer.getPosition();
                        const portalPos = this.activePortal.sourcePosition;
                        const distance = Math.sqrt(
                            Math.pow(playerPos.x - portalPos.x, 2) + 
                            Math.pow(playerPos.z - portalPos.z, 2)
                        );
                        
                        if (distance < closestDistance) {
                            closestPlayer = remotePlayer;
                            closestDistance = distance;
                        }
                    } catch (error) {
                        console.warn(`Error checking remote player ${peerId} position:`, error);
                    }
                }
            });
            
            // Teleport the closest player if one was found
            if (closestPlayer) {
                console.debug(`Teleporting closest player (distance: ${closestDistance.toFixed(2)})`);
                this.teleportPlayer(this.activePortal, closestPlayer);
            } else {
                console.debug("No players found near the portal");
            }
        } else if (this.game.player) {
            // Default behavior - teleport local player if it exists
            console.debug("Teleporting local player (no multiplayer detected)");
            this.teleportPlayer(this.activePortal, this.game.player);
        } else {
            console.warn("Cannot teleport: no valid player found");
        }
    }
    
    /**
     * Initialize the teleport manager
     */
    init() {
        console.debug("Initializing teleport manager...");
        
        // Reset active portal
        this.activePortal = null;
        
        // Create default portals if none exist
        if (this.portals.length === 0) {
            this.createDefaultPortals();
            this.createMultiplierPortals();
            // Also create a teleport network
            this.createTeleportNetwork(3, 2000, 200, 0);
        }
        
        // Re-setup touch/click events to ensure they're properly bound
        this.setupTouchClickEvents();
        
        return true;
    }
    
    /**
     * Create a network of interconnected teleport portals
     * @param {number} portalCount - Number of portals in the network
     * @param {number} radius - Radius of the circle on which to place portals
     * @param {number} height - Height above ground for the network
     * @param {number} yOffset - Y-axis offset for the entire network
     */
    createTeleportNetwork(portalCount = 5, radius = 3000, height = 0, yOffset = 0) {
        console.debug(`Creating teleport network with ${portalCount} portals at radius ${radius}`);
        
        const networkPortals = [];
        const centerPoint = new THREE.Vector3(0, height + yOffset, 0);
        
        // Create portals in a circle
        for (let i = 0; i < portalCount; i++) {
            const angle = (i / portalCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const portalPosition = new THREE.Vector3(x, height + yOffset, z);
            
            // Create a portal with a temporary target (will be updated later)
            const portal = this.createPortal(
                portalPosition,
                centerPoint, // Temporary target
                `Network Node ${i + 1}`,
                `Network Destination ${i + 1}`
            );
            
            networkPortals.push(portal);
        }
        
        // Connect portals in a circular pattern (each portal leads to the next)
        for (let i = 0; i < networkPortals.length; i++) {
            const currentPortal = networkPortals[i];
            const nextPortal = networkPortals[(i + 1) % networkPortals.length];
            
            // Update the target position to the next portal in the network
            currentPortal.targetPosition.copy(nextPortal.sourcePosition);
            currentPortal.targetName = nextPortal.sourceName;
            
            console.debug(`Connected ${currentPortal.sourceName} to ${currentPortal.targetName}`);
        }
        
        return networkPortals;
    }
    
    /**
     * Create default teleport portals
     */
    createDefaultPortals() {
        // Create original portals with 10x farther destinations
        
        // Portal 1: Near starting area (original but with 10x farther destination)
        this.createPortal(
            new THREE.Vector3(10, 0, 10),
            new THREE.Vector3(1000, 0, 1000), // 10x farther
            "Temple Entrance",
            "Distant Mountain Peak"
        );
        
        // Portal 2: Far away location (original but with 10x farther destination)
        this.createPortal(
            new THREE.Vector3(-80, 0, -80),
            new THREE.Vector3(500, 0, -1200), // 10x farther
            "Forest Clearing",
            "Far Desert Oasis"
        );
        
        // Portal 3: Another interesting location (original but with 10x farther destination)
        this.createPortal(
            new THREE.Vector3(120, 0, -50),
            new THREE.Vector3(-1000, 0, 800), // 10x farther
            "Waterfall",
            "Distant Ancient Ruins"
        );
    }
    
    /**
     * Create multiplier portals for enemy spawning
     */
    createMultiplierPortals() {
        console.debug("Creating multiplier portals for enemy spawning");
        
        // Create portals in a semi-circle arrangement
        const centerPoint = new THREE.Vector3(0, 0, 0);
        const radius = 30; // Distance from center
        const startAngle = -Math.PI / 2; // Start at top (negative Z)
        const angleStep = Math.PI / (this.multiplierPortals.length - 1); // Distribute across 180 degrees
        
        // Create a portal for each multiplier
        this.multiplierPortals.forEach((portalConfig, index) => {
            // Calculate position in semi-circle
            const angle = startAngle + (angleStep * index);
            const x = centerPoint.x + Math.cos(angle) * radius;
            const z = centerPoint.z + Math.sin(angle) * radius;
            
            // Create destination position (far away in a specific direction)
            // Each multiplier portal goes to a different location
            const destDistance = 2000 + (index * 500); // Increasing distances
            const destAngle = Math.PI * 2 * (index / this.multiplierPortals.length);
            const destX = Math.cos(destAngle) * destDistance;
            const destZ = Math.sin(destAngle) * destDistance;
            
            // Select a random terrain type for this destination
            const terrainType = this.destinationTerrains[index % this.destinationTerrains.length];
            
            // Create the portal with custom properties
            const portal = this.createPortal(
                new THREE.Vector3(x, 0, z),
                new THREE.Vector3(destX, 0, destZ),
                `${portalConfig.name} Portal`,
                `${terrainType.name} (${portalConfig.name})`,
                portalConfig.color,
                portalConfig.emissiveColor,
                portalConfig.size
            );
            
            // Store additional properties on the portal object
            portal.multiplier = portalConfig.multiplier;
            portal.multiplierPortalId = portalConfig.id;
            portal.destinationTerrain = terrainType;
            
            // Create text label for the portal
            this.createPortalLabel(portal);
            
            console.debug(`Created ${portalConfig.name} portal at (${x.toFixed(1)}, ${z.toFixed(1)}) → (${destX.toFixed(1)}, ${destZ.toFixed(1)})`);
        });
    }
    
    /**
     * Create a text label for a portal using Three.js
     * @param {Object} portal - The portal to label
     */
    createPortalLabel(portal) {
        // Create a canvas for the nameplate
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256 * 2;
        canvas.height = 64;
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text properties based on portal type first
        if (portal.multiplier) {
            context.fillStyle = '#FF9500'; // Orange for multiplier portals
            context.strokeStyle = '#000000';
        } else if (portal.isReturnPortal) {
            context.fillStyle = '#00FF00'; // Green for return portals
            context.strokeStyle = '#000000';
        } else {
            context.fillStyle = '#FFFFFF'; // White for regular portals
            context.strokeStyle = '#000000';
        }
        
        // Add text with the correct portal name
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Use portal.sourceName instead of undefined 'name' variable
        const displayName = portal.sourceName || `Portal ${portal.id}`;
        context.fillText(displayName, canvas.width / 2, canvas.height / 2);
        
        // Add stroke for better visibility
        context.lineWidth = 2;
        context.strokeText(displayName, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create a plane for the nameplate
        const geometry = new THREE.PlaneGeometry(2, 0.5);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false // Make sure it's always visible
        });
        
        const portalLabel = new THREE.Mesh(geometry, material);
        
        // Position nameplate above portal
        portalLabel.position.copy(portal.sourcePosition.clone());
        portalLabel.position.y += portal.size || 5; // Position above portal
        
        // Add to scene
        this.scene.add(portalLabel);
        
        // Store reference to nameplate
        this.portalLabels[portal.id] = portalLabel;
        
        console.debug(`Created label for portal "${displayName}" (ID: ${portal.id})`);
    }
    
    /**
     * Create a new teleport portal
     * @param {THREE.Vector3} sourcePosition - The position of the source portal
     * @param {THREE.Vector3} targetPosition - The position to teleport to
     * @param {string} sourceName - Name of the source portal
     * @param {string} targetName - Name of the target location
     * @param {number} color - Custom color for the portal (optional)
     * @param {number} emissiveColor - Custom emissive color (optional)
     * @param {number} size - Custom size for the portal (optional)
     * @returns {Object} - The created portal object
     */
    createPortal(sourcePosition, targetPosition, sourceName, targetName, color, emissiveColor, size) {
        // Validate positions
        if (!sourcePosition || !targetPosition) {
            console.error('Invalid positions provided for portal creation');
            sourcePosition = sourcePosition || new THREE.Vector3(0, 0, 0);
            targetPosition = targetPosition || new THREE.Vector3(0, 0, 0);
        }
        
        // Create clones to avoid modifying the original vectors
        sourcePosition = sourcePosition.clone();
        targetPosition = targetPosition.clone();
        
        // Adjust Y position based on terrain height
        try {
            if (this.worldManager && this.worldManager.getTerrainHeight) {
                sourcePosition.y = this.worldManager.getTerrainHeight(sourcePosition.x, sourcePosition.z) + 0.5;
                targetPosition.y = this.worldManager.getTerrainHeight(targetPosition.x, targetPosition.z) + 0.5;
            }
            
            // Elevate the source position (this will affect the portal's height)
            sourcePosition.y += 2.8;
        } catch (e) {
            console.warn('Error adjusting portal height:', e);
            // Set default heights if terrain height calculation fails
            sourcePosition.y = 2.8;
            targetPosition.y = 0.5;
        }
        
        // Use the portal model factory to create the portal mesh
        const portalMesh = this.portalModelFactory.createPortalMesh(
            sourcePosition, 
            color, 
            emissiveColor, 
            size
        );
        
        // Create particle effect for the portal
        const particles = this.portalModelFactory.createPortalParticles(
            sourcePosition, 
            color || this.portalModelFactory.portalColor, 
            size || this.portalModelFactory.portalRadius
        );
        
        // Create portal object
        const portal = {
            id: `portal_${this.portals.length}`,
            sourceName: sourceName || `Portal ${this.portals.length + 1}`,
            targetName: targetName || `Destination ${this.portals.length + 1}`,
            sourcePosition: sourcePosition.clone(),
            targetPosition: targetPosition.clone(),
            mesh: portalMesh,
            particles: particles,
            creationTime: Date.now(),
            lastInteractionTime: 0,
            color: color || this.portalModelFactory.portalColor,
            size: size || this.portalModelFactory.portalRadius
        };
        
        // Add to portals array
        this.portals.push(portal);
        
        console.debug(`Created teleport portal from "${portal.sourceName}" to "${portal.targetName}"`);
        
        return portal;
    }
    

    
    /**
     * Update all portals
     * @param {number} deltaTime - Time since last update in seconds
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    update(deltaTime, playerPosition) {
        // Skip if no portals or no player
        if (this.portals.length === 0 || !playerPosition) return;
        
        // Current time for animations
        const time = Date.now() / 1000;
        
        // Update each portal
        this.portals.forEach(portal => {
            // Animate portal
            this.animatePortal(portal, time);
            
            // Check for player interaction
            this.checkPlayerInteraction(portal, playerPosition);
            
            // Update portal label position
            this.updatePortalLabel(portal);
        });
    }
    
    /**
     * Update the position of a portal's label in 3D space
     * @param {Object} portal - The portal whose label to update
     */
    updatePortalLabel(portal) {
        return;
    }
    
    /**
     * Animate a portal with enhanced spiral/cyclone effects
     * @param {Object} portal - The portal to animate
     * @param {number} time - Current time in seconds
     */
    animatePortal(portal, time) {
        if (!portal.mesh) return;
        
        // Enhanced hover animation with slight wobble
        const hoverOffset = Math.sin(time * this.animationSpeed) * this.hoverHeight;
        const wobbleOffset = Math.cos(time * this.animationSpeed * 2.3) * 0.1;
        portal.mesh.position.y = portal.sourcePosition.y + hoverOffset + wobbleOffset;
        
        // Animate the portal mesh components if it's a group
        if (portal.mesh.cycloneMesh) {
            // Cyclone spiral rotation - only rotate on Y-axis (around the portal's flat surface)
            portal.mesh.cycloneMesh.rotation.y += this.rotationSpeed * 3;
            
            // Add pulsing scale effect
            const pulseScale = 1 + Math.sin(time * 2) * 0.1;
            portal.mesh.cycloneMesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
        
        if (portal.mesh.innerRingMesh) {
            // Inner ring counter-rotation - only rotate on Y-axis (around the portal's flat surface)
            portal.mesh.innerRingMesh.rotation.y -= this.rotationSpeed * 2;
            
            // Add breathing effect
            const breatheScale = 1 + Math.sin(time * 1.5) * 0.15;
            portal.mesh.innerRingMesh.scale.set(breatheScale, breatheScale, breatheScale);
        }
        
        // Outer ring removed for cleaner look
        
        // Enhanced particle animations
        this.animatePortalParticles(portal, time);
    }
    
    /**
     * Animate portal particles with spiral effects
     * @param {Object} portal - The portal object
     * @param {number} time - Current time in seconds
     */
    animatePortalParticles(portal, time) {
        if (!portal.particles) return;
        
        // Animate spiral particles (main cyclone effect)
        if (portal.particles.spiralParticles) {
            const spiralGeometry = portal.particles.spiralParticles.geometry;
            const positions = spiralGeometry.attributes.position;
            const angles = spiralGeometry.attributes.angle;
            const speeds = spiralGeometry.attributes.speed;
            
            if (positions && angles && speeds) {
                const posArray = positions.array;
                const angleArray = angles.array;
                const speedArray = speeds.array;
                const particleCount = posArray.length / 3;
                
                for (let i = 0; i < particleCount; i++) {
                    const ix = i * 3;
                    const iy = i * 3 + 1;
                    const iz = i * 3 + 2;
                    
                    // Update angle for spiral motion
                    angleArray[i] += speedArray[i] * 0.02;
                    
                    // Calculate spiral position
                    const spiralPosition = (i / particleCount);
                    const currentAngle = angleArray[i] + time * this.animationSpeed * 2;
                    const spiralRadius = this.portalRadius * (1 - spiralPosition * 0.8) * (0.8 + Math.sin(time + i) * 0.2);
                    
                    // Spiral inward motion - keep particles on the flat surface
                    posArray[ix] = Math.cos(currentAngle) * spiralRadius;
                    posArray[iy] = Math.sin(time * 2 + i) * 0.2; // Reduced vertical movement to keep particles on surface
                    posArray[iz] = Math.sin(currentAngle) * spiralRadius;
                }
                
                positions.needsUpdate = true;
                angles.needsUpdate = true;
            }
        }
        
        // Outer and ambient particles removed for cleaner portal effect
    }
    
    /**
     * Check for player interaction with a portal
     * @param {Object} portal - The portal to check
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    checkPlayerInteraction(portal, playerPosition) {
        // Validate inputs
        if (!portal || !portal.sourcePosition || !playerPosition) {
            return;
        }
        
        try {
            // Calculate distance to portal
            const distance = playerPosition.distanceTo(portal.sourcePosition);
            
            // Check if player is within interaction radius
            if (distance <= this.interactionRadius) {
                // Check cooldown
                const currentTime = Date.now();
                if (currentTime - this.lastTeleportTime < this.teleportCooldown) {
                    return; // Still on cooldown
                }
                
                // Initialize lastInteractionTime if it doesn't exist
                if (!portal.lastInteractionTime) {
                    portal.lastInteractionTime = 0;
                }
                
                // Check if this is a new interaction (not already standing in portal)
                if (currentTime - portal.lastInteractionTime > 1000) {
                    portal.lastInteractionTime = currentTime;
                    
                    // Show teleport prompt with spiral symbols
                    if (this.game && this.game.hudManager) {
                        const spiralSymbols = ['🌀', '🍥', '𖦹', '𖣐'];
                        const randomSpiral = spiralSymbols[Math.floor(Math.random() * spiralSymbols.length)];
                        this.game.hudManager.showNotification(
                            `${randomSpiral} ${portal.targetName} ${randomSpiral}`,
                            5000
                        );
                    }
                    
                    // Store the active portal for click/touch interaction
                    this.activePortal = portal;
                    
                    // Check for key press (handled by game's input manager)
                    if (this.game && this.game.inputManager && this.game.player) {
                        // Check if E key is pressed
                        if (this.game.inputManager.isKeyPressed('KeyE')) {
                            console.debug('E key pressed - teleporting player');
                            this.teleportPlayer(portal, this.game.player);
                        }
                    }
                }
            } else {
                // Player moved away from portal
                if (portal === this.activePortal) {
                    this.activePortal = null;
                }
            }
        } catch (error) {
            console.warn("Error in checkPlayerInteraction:", error);
        }
    }
    
    /**
     * Teleport a player to the target location
     * @param {Object} portal - The portal to teleport through
     * @param {Object} [player] - The player to teleport (defaults to local player if not provided)
     */
    teleportPlayer(portal, player) {
        // Validate portal
        if (!portal || !portal.sourceName || !portal.targetName || !portal.targetPosition) {
            console.error("Cannot teleport: invalid portal data", portal);
            return;
        }
        
        // Use provided player or default to local player
        const targetPlayer = player || (this.game ? this.game.player : null);
        
        // Skip if no game or player
        if (!this.game) {
            console.error("Cannot teleport: game is null");
            return;
        }
        
        if (!targetPlayer) {
            console.error("Cannot teleport: player is null");
            return;
        }
        
        // Verify player has required methods
        if (typeof targetPlayer.getPosition !== 'function' || typeof targetPlayer.setPosition !== 'function') {
            console.error("Cannot teleport: player does not have required methods");
            return;
        }
        
        try {
            const playerPosition = targetPlayer.getPosition();
            console.debug(`Starting teleport from ${portal.sourceName} to ${portal.targetName}`);
            console.debug(`Current player position: ${playerPosition.x}, ${playerPosition.y}, ${playerPosition.z}`);
            console.debug(`Target position: ${portal.targetPosition.x}, ${portal.targetPosition.y}, ${portal.targetPosition.z}`);
        } catch (error) {
            console.error("Error getting player position:", error);
            return;
        }
        
        // Set cooldown
        this.lastTeleportTime = Date.now();
        
        // Check if this is a return portal
        const isReturnPortal = portal.isReturnPortal;
        
        // Check if this is a multiplier portal
        const isMultiplierPortal = portal.multiplier && portal.multiplier > 1;
        
        // Store player's current position if teleporting to a multiplier zone
        if (isMultiplierPortal) {
            this.lastPlayerPosition = targetPlayer.getPosition().clone();
            this.activeMultiplier = portal.multiplier;
            this.currentDestinationTerrain = portal.destinationTerrain;
            console.debug(`Setting active multiplier to ${this.activeMultiplier}x`);
        }
        
        // If returning from a multiplier zone, reset the multiplier
        if (isReturnPortal) {
            this.activeMultiplier = 1;
            console.debug(`Returning from multiplier zone, resetting multiplier to 1x`);
        }
        
        // Show teleport effect
        this.showTeleportEffect(portal);
        
        // Teleport the player after a short delay
        setTimeout(() => {
            // Ensure target position has correct terrain height
            let targetY = portal.targetPosition.y;
            
            // If we have terrain height information, use it
            if (this.worldManager && this.worldManager.getTerrainHeight) {
                targetY = this.worldManager.getTerrainHeight(portal.targetPosition.x, portal.targetPosition.z) + 0.5;
                console.debug(`Adjusted target height to terrain: ${targetY}`);
            }
            
            try {
                // Move player to target position
                // Extract x, y, z coordinates from the Vector3 object
                targetPlayer.setPosition(
                    portal.targetPosition.x,
                    targetY,
                    portal.targetPosition.z
                );
                
                // Force update the player's target position if it has one
                if (targetPlayer.movement && targetPlayer.movement.targetPosition) {
                    targetPlayer.movement.targetPosition.set(
                        portal.targetPosition.x,
                        targetY,
                        portal.targetPosition.z
                    );
                }
                
                // Also update the player's model position directly if available
                if (targetPlayer.model && typeof targetPlayer.model.setPosition === 'function') {
                    const position = new THREE.Vector3(portal.targetPosition.x, targetY, portal.targetPosition.z);
                    targetPlayer.model.setPosition(position);
                    console.debug('Updated player model position directly');
                }
                
                console.debug(`Successfully teleported player to: ${portal.targetPosition.x}, ${targetY}, ${portal.targetPosition.z}`);
            } catch (error) {
                console.error("Error teleporting player:", error);
                return;
            }
            
            // Only update camera and show notifications if this is the local player
            const isLocalPlayer = targetPlayer === this.game.player;
            
            if (isLocalPlayer) {
                // Force an immediate camera update if the player has a movement component
                if (targetPlayer.movement && typeof targetPlayer.movement.updateCamera === 'function') {
                    targetPlayer.movement.updateCamera();
                    console.debug('Forced camera update after teleport');
                }
                
                // Show arrival notification with spiral effects
                if (this.game && this.game.hudManager) {
                    const spiralSymbols = ['🌀', '🍥', '𖦹', '𖣐'];
                    const randomSpiral = spiralSymbols[Math.floor(Math.random() * spiralSymbols.length)];
                    this.game.hudManager.showNotification(
                        `✨ Teleported to ${portal.targetName} ${randomSpiral}`,
                        3000
                    );
                    
                    // If this is a multiplier portal, show additional notification
                    if (isMultiplierPortal) {
                        this.game.hudManager.showNotification(
                            `⚡ Enemy spawn rate: ${portal.multiplier}x ${randomSpiral}`,
                            5000
                        );
                    }
                }
            }
            
            // Zoom out minimap temporarily to show both locations (only for local player)
            if (isLocalPlayer && this.game && this.game.hudManager && 
                this.game.hudManager.components && 
                this.game.hudManager.components.miniMapUI) {
                
                const miniMap = this.game.hudManager.components.miniMapUI;
                
                // Store original scale
                const originalScale = miniMap.scale;
                
                // Calculate zoom factor based on distance
                const distance = portal.sourcePosition.distanceTo(portal.targetPosition);
                const zoomFactor = Math.min(10, Math.max(3, Math.floor(distance / 500)));
                
                console.debug(`Teleport distance: ${distance.toFixed(2)}, using zoom factor: ${zoomFactor}`);
                
                // Zoom out based on distance
                miniMap.setScale(originalScale * zoomFactor);
                
                // Zoom back in after 8 seconds for longer distances
                setTimeout(() => {
                    miniMap.setScale(originalScale);
                }, 8000);
            }
            
            // If this is a multiplier portal, create a return portal
            if (isMultiplierPortal && !isReturnPortal) {
                this.createReturnPortal(
                    new THREE.Vector3(
                        portal.targetPosition.x + 10, // Offset slightly
                        portal.targetPosition.y,
                        portal.targetPosition.z + 10
                    ),
                    this.lastPlayerPosition
                );
                
                // Spawn enemies based on multiplier
                this.spawnMultiplierEnemies(portal.multiplier, portal.targetPosition);
                
                // Modify terrain if we have a destination terrain type
                if (portal.destinationTerrain && this.worldManager && this.worldManager.terrainManager) {
                    this.modifyDestinationTerrain(portal.targetPosition, portal.destinationTerrain);
                }
            }
        }, this.effectDuration);
    }
    
    /**
     * Create a return portal at the destination
     * @param {THREE.Vector3} position - Position for the return portal
     * @param {THREE.Vector3} targetPosition - Position to return to
     */
    createReturnPortal(position, targetPosition) {
        // Remove any existing return portal
        this.removeReturnPortal();
        
        // Create the return portal
        const returnPortal = this.createPortal(
            position,
            targetPosition,
            "Return Portal",
            "Previous Location",
            this.returnPortal.color,
            this.returnPortal.emissiveColor,
            this.returnPortal.size
        );
        
        // Mark as return portal
        returnPortal.isReturnPortal = true;
        
        // Store reference
        this.returnPortalMesh = returnPortal.mesh;
        
        console.debug(`Created return portal at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        
        return returnPortal;
    }
    
    /**
     * Remove the return portal if it exists
     */
    removeReturnPortal() {
        // Find and remove any existing return portals
        for (let i = this.portals.length - 1; i >= 0; i--) {
            if (this.portals[i].isReturnPortal) {
                this.removePortal(this.portals[i].id);
            }
        }
        
        this.returnPortalMesh = null;
    }
    
    /**
     * Spawn enemies based on the multiplier
     * @param {number} multiplier - The enemy spawn multiplier
     * @param {THREE.Vector3} position - Center position for spawning
     */
    spawnMultiplierEnemies(multiplier, position) {
        // Skip if no enemy manager
        if (!this.game || !this.game.enemyManager) {
            console.warn("Cannot spawn multiplier enemies: enemy manager not found");
            return;
        }
        
        console.debug(`Spawning enemies with ${multiplier}x multiplier at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
        
        const spawnCount = multiplier;
        
        // Get current zone for appropriate enemy types
        let currentZone = this.game.world.getZoneAt(position);

        // Get enemy types for this zone
        const zoneEnemyTypes = this.getRandomzoneEnemyTypes();
        
        // Dramatically increase max enemies limit for extreme multipliers
        const originalMaxEnemies = this.game.enemyManager.maxEnemies;
        // For extreme multipliers, allow up to 1000 enemies on screen (double the multiplier)
        this.game.enemyManager.maxEnemies = Math.max(originalMaxEnemies, multiplier * 2);
        console.debug(`Set max enemies to ${this.game.enemyManager.maxEnemies} for ${multiplier}x multiplier`);
       
        // For extreme multipliers, spawn in a complete 360° surrounding pattern
        // with multiple rings to completely surround the player
        this.spawnMassiveEnemyWave(position, multiplier, spawnCount, zoneEnemyTypes);
        
        
        // For higher multipliers, add some elite or champion enemies
        // Number of special enemies scales with multiplier
        const specialEnemyCount = Math.min(50, Math.floor(multiplier / 10));
        
        // Get elite or champion enemy types
        const eliteTypes = this.game.enemyManager.enemyTypes.filter(type => 
            type.rarity === 'elite' || type.rarity === 'champion'
        );
        
        if (eliteTypes.length > 0) {
            console.debug(`Adding ${specialEnemyCount} elite/champion enemies to multiplier zone`);
            
            for (let i = 0; i < specialEnemyCount; i++) {
                // Select a random elite type
                const eliteType = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
                
                // Random position within a closer range to the player
                const angle = Math.random() * Math.PI * 2;
                const distance = 15 + Math.random() * 10; // 15-25 units from center
                const x = position.x + Math.cos(angle) * distance;
                const z = position.z + Math.sin(angle) * distance;
                const y = this.game.world.getTerrainHeight(x, z);
                
                // Spawn elite enemy
                const elitePosition = new THREE.Vector3(x, y, z);
                this.game.enemyManager.spawnEnemy(eliteType.type, elitePosition);
            }
        }
        
        // More dramatic notification for higher multipliers
        if (multiplier >= 500) {
            this.game.hudManager.showNotification(
                `DEATH ZONE! ${multiplier} enemies spawned!`,
                5000
            );
        } else if (multiplier >= 100) {
            this.game.hudManager.showNotification(
                `EXTREME DANGER! ${multiplier} enemies approaching!`,
                5000
            );
        } else if (multiplier >= 50) {
            this.game.hudManager.showNotification(
                `DANGER! Massive enemy wave approaching!`,
                5000
            );
        } else if (multiplier >= 20) {
            this.game.hudManager.showNotification(
                `WARNING! Large enemy force detected!`,
                4000
            );
        } else {
            this.game.hudManager.showNotification(
                `Spawned ${spawnCount} enemies!`,
                3000
            );
        }
        
        // For extreme multipliers, start a continuous spawn loop with very short intervals
        this.startContinuousSpawning(multiplier, spawnCount);
    }
    
    /**
     * Spawn a massive wave of enemies for extreme multipliers (x100+)
     * This creates a complete 360° surrounding pattern with multiple rings
     * @param {THREE.Vector3} position - Center position for spawning
     * @param {number} multiplier - The enemy spawn multiplier
     * @param {number} totalEnemies - Total number of enemies to spawn
     * @param {Array} zoneEnemyTypes - Array of enemy types for the current zone
     */
    spawnMassiveEnemyWave(position, multiplier, totalEnemies) {
        console.debug(`Spawning massive wave of ${totalEnemies} enemies for ${multiplier}x multiplier`);
        
        // Create multiple rings of enemies to completely surround the player
        const numRings = 5; // 5 concentric rings of enemies
        const enemiesPerRing = Math.ceil(totalEnemies / numRings);
        
        // Ring distances from player (units)
        const ringDistances = [
            10,  // Inner ring (very close)
            20,  // Second ring
            35,  // Middle ring
            50,  // Fourth ring
            70   // Outer ring
        ];
        
        // For each ring, distribute enemies evenly around the circle
        for (let r = 0; r < numRings; r++) {
            const ringDistance = ringDistances[r];
            
            // More enemies in inner rings, fewer in outer rings
            const ringEnemyMultiplier = r === 0 ? 1.5 : // 50% more in inner ring
                                       r === 1 ? 1.2 : // 20% more in second ring
                                       r === 2 ? 1.0 : // Normal amount in middle ring
                                       r === 3 ? 0.8 : // 20% fewer in fourth ring
                                       0.5;            // 50% fewer in outer ring
                                       
            const enemiesInThisRing = Math.ceil(enemiesPerRing * ringEnemyMultiplier);
            
            // Calculate angle step for even distribution
            const angleStep = (Math.PI * 2) / enemiesInThisRing;
            
            // Random starting angle for variation
            const startAngle = Math.random() * Math.PI * 2;
            
            // Select a random enemy type for this ring
            const zoneEnemyTypes = this.getRandomzoneEnemyTypes();
            const ringEnemyType = zoneEnemyTypes[Math.floor(Math.random() * zoneEnemyTypes.length)];
            
            // Spawn enemies in this ring
            for (let i = 0; i < enemiesInThisRing; i++) {
                // Calculate position on the ring
                const angle = startAngle + (angleStep * i);
                
                // Add some randomness to the distance
                const jitter = (Math.random() * 0.3 + 0.85) * ringDistance; // 85-115% of ring distance
                
                const x = position.x + Math.cos(angle) * jitter;
                const z = position.z + Math.sin(angle) * jitter;
                
                // Get terrain height at position
                const y = this.game.world.getTerrainHeight(x, z);
                
                // Spawn enemy
                const enemyPosition = new THREE.Vector3(x, y, z);
                this.game.enemyManager.spawnEnemy(ringEnemyType, enemyPosition);
            }
        }
    }
    
    /**
     * Start continuous spawning of enemies at very short intervals
     * For extreme multipliers like x500, this creates an overwhelming experience
     * @param {THREE.Vector3} position - Center position for spawning
     * @param {number} multiplier - The enemy spawn multiplier
     */
    startContinuousSpawning(multiplier, spawnCount) {
        // Skip if no enemy manager
        if (!this.game || !this.game.enemyManager) {
            return;
        }
        
        // Store a reference to the continuous spawning interval
        if (!this.continuousSpawnIntervals) {
            this.continuousSpawnIntervals = [];
        }
        
        // For extreme multipliers, spawn very frequently
        // x500 = every 1 second
        // x100 = every 2 seconds
        const spawnInterval = 10_000 / Math.log(multiplier);
        const zoneEnemyTypes = this.getRandomzoneEnemyTypes();
        
        console.debug(`Starting continuous enemy spawning every ${spawnInterval}ms for ${multiplier}x multiplier`);
        
        // Start the continuous spawning interval
        const intervalId = setInterval(() => {
            // Only continue if still in multiplier zone
            if (this.activeMultiplier > 1) {
                // Get player's current position
                const playerPos = this.game.player.getPosition();
                
                // For extreme multipliers, spawn massive waves continuously
                // This will spawn exactly 500 enemies every second for x500 multiplier
                this.spawnMassiveEnemyWave(playerPos, multiplier, spawnCount, zoneEnemyTypes);
            } else {
                // Player left multiplier zone, stop spawning
                console.debug(`Player left multiplier zone, stopping continuous spawning`);
                clearInterval(intervalId);
                
                // Remove this interval from the tracking array
                const index = this.continuousSpawnIntervals.indexOf(intervalId);
                if (index > -1) {
                    this.continuousSpawnIntervals.splice(index, 1);
                }
            }
        }, spawnInterval);
        
        // Track this interval for cleanup
        this.continuousSpawnIntervals.push(intervalId);
        
        // Also track player movement to spawn enemies as they move
        this.trackPlayerMovement(multiplier);
    }

    getRandomzoneEnemyTypes() {
        const keys = Object.keys(ZONE_ENEMIES);
        const randomIndex = Math.floor(Math.random() * keys.length);
        return ZONE_ENEMIES[keys[randomIndex]];
    }
    
    /**
     * Track player movement and spawn enemies when they move
     * This ensures enemies continuously spawn around the player as they move
     * @param {number} multiplier - The enemy spawn multiplier
     */
    trackPlayerMovement(multiplier) {
        // Skip if already tracking
        if (this.playerMovementTrackerId) {
            return;
        }
        
        let lastPosition = this.game.player.getPosition().clone();
        const movementThreshold = 10; // Units of movement to trigger new spawn
        
        // Check player position every 500ms
        this.playerMovementTrackerId = setInterval(() => {
            // Only continue if still in multiplier zone
            if (this.game && 
                this.game.teleportManager && 
                this.game.teleportManager.activeMultiplier > 1) {
                
                const currentPosition = this.game.player.getPosition();
                const distanceMoved = currentPosition.distanceTo(lastPosition);
                
                // If player moved significantly, spawn new enemies
                if (distanceMoved > movementThreshold) {
                    console.debug(`Player moved ${distanceMoved.toFixed(1)} units, spawning new enemies`);
                    
                    // For extreme multipliers, spawn a full wave when player moves
                    if (multiplier >= 500) {
                        // Spawn exactly 500 enemies for x500 portals
                        this.spawnMassiveWave(currentPosition, 500);
                    } else if (multiplier >= 100) {
                        // For x100-x499, spawn half-sized waves on movement
                        this.spawnMassiveWave(currentPosition, Math.floor(multiplier / 2));
                    }
                    
                    // Update last position
                    lastPosition = currentPosition.clone();
                }
            } else {
                // Player left multiplier zone, stop tracking
                console.debug(`Player left multiplier zone, stopping movement tracking`);
                clearInterval(this.playerMovementTrackerId);
                this.playerMovementTrackerId = null;
            }
        }, 500);
    }
    
    
    /**
     * Modify the terrain at the destination based on the terrain type
     * @param {THREE.Vector3} position - Center position of the destination
     * @param {Object} terrainType - The terrain configuration
     */
    modifyDestinationTerrain(position, terrainType) {
        // Skip if no terrain manager
        if (!this.worldManager || !this.worldManager.terrainManager) {
            console.warn("Cannot modify destination terrain: terrain manager not found");
            return;
        }
        
        console.debug(`Modifying destination terrain to ${terrainType.name} at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
        
        // Define the radius of terrain to modify
        const modificationRadius = terrainType.size || 100;
        
        // Get all terrain chunks within the radius
        const chunkSize = this.worldManager.terrainManager.terrainChunkSize;
        const centerChunkX = Math.floor(position.x / chunkSize);
        const centerChunkZ = Math.floor(position.z / chunkSize);
        const chunkRadius = Math.ceil(modificationRadius / chunkSize) + 1;
        
        let modifiedChunks = 0;
        
        // Apply custom coloring to terrain chunks in the area
        for (let x = centerChunkX - chunkRadius; x <= centerChunkX + chunkRadius; x++) {
            for (let z = centerChunkZ - chunkRadius; z <= centerChunkZ + chunkRadius; z++) {
                const chunkKey = `${x},${z}`;
                const chunk = this.worldManager.terrainManager.terrainChunks[chunkKey];
                
                if (chunk) {
                    // Calculate distance from center to chunk center
                    const chunkCenterX = (x + 0.5) * chunkSize;
                    const chunkCenterZ = (z + 0.5) * chunkSize;
                    const distX = chunkCenterX - position.x;
                    const distZ = chunkCenterZ - position.z;
                    const distance = Math.sqrt(distX * distX + distZ * distZ);
                    
                    // Only modify chunks within the radius
                    if (distance <= modificationRadius) {
                        // Apply custom coloring to this chunk
                        this.applyDangerTerrainColor(chunk, terrainType);
                        modifiedChunks++;
                        
                        // Force the chunk to update in the scene
                        chunk.updateMatrix();
                        chunk.updateMatrixWorld(true);
                        
                        // Mark the chunk as modified
                        chunk.userData.isModified = true;
                        chunk.userData.modifiedTerrainType = terrainType.id;
                    }
                }
            }
        }
        
        console.debug(`Modified ${modifiedChunks} terrain chunks with ${terrainType.id} theme`);
        
        // Request a render update if we have access to the renderer
        if (this.game && this.game.renderer) {
            this.game.renderer.render(this.scene, this.game.camera);
            console.debug("Forced render update after terrain modification");
        }
    }
    
    /**
     * Apply danger-themed coloring to a terrain chunk
     * @param {THREE.Mesh} terrain - The terrain mesh to color
     * @param {Object} terrainType - The terrain configuration
     */
    applyDangerTerrainColor(terrain, terrainType) {
        if (!terrain || !terrain.geometry || !terrain.geometry.attributes || !terrain.geometry.attributes.position) {
            console.warn("Cannot apply danger terrain color: invalid terrain geometry");
            return;
        }
        
        console.debug(`Applying danger terrain color for ${terrainType.id || 'unknown'} terrain type`);
        
        const colors = [];
        const positions = terrain.geometry.attributes.position.array;
        
        // Use the terrain type's ground color as base
        const baseColorHex = terrainType.groundColor || 0x880000; // Default to dark red if not specified
        const baseColor = new THREE.Color(baseColorHex);
        
        // Add some variation based on terrain type
        let accentColor;
        switch (terrainType.id) {
            case 'hellscape':
                accentColor = new THREE.Color(0xFF4500); // Orange-red for lava
                break;
            case 'void':
                accentColor = new THREE.Color(0x3311AA); // Deep purple for void
                break;
            case 'ancient_ruins':
                accentColor = new THREE.Color(0xAA7722); // Golden for ruins
                break;
            case 'crystal_cavern':
                accentColor = new THREE.Color(0x66CCFF); // Bright blue for crystals
                break;
            default:
                accentColor = new THREE.Color(0xDD3311); // Default danger accent
        }
        
        // Create deterministic noise patterns for natural variation
        const noiseScale = 0.05;
        const noiseOffset = terrain.position.x * 0.01 + terrain.position.z * 0.01;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Get vertex position for noise calculation
            const x = positions[i];
            const z = positions[i + 2];
            
            // Use deterministic noise pattern for natural variation
            const noiseValue = Math.sin(x * noiseScale + noiseOffset) * Math.cos(z * noiseScale + noiseOffset);
            
            // Mix base color with accent color based on noise
            let color = baseColor.clone();
            
            if (noiseValue > 0.7) {
                // Areas with accent color
                color.lerp(accentColor, 0.7);
            } else if (noiseValue < -0.7) {
                // Darker areas
                color.multiplyScalar(0.7);
            }
            
            // Add subtle micro-variation to make terrain look more natural
            const microVariation = (Math.sin(x * 0.1 + z * 0.1) * 0.05);
            
            // Apply variation to each color channel
            color = new THREE.Color(
                Math.max(0, Math.min(1, color.r + microVariation)),
                Math.max(0, Math.min(1, color.g + microVariation)),
                Math.max(0, Math.min(1, color.b + microVariation))
            );
            
            colors.push(color.r, color.g, color.b);
        }
        
        // Apply colors to terrain
        terrain.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Make sure vertex colors are used by updating the material
        if (terrain.material) {
            // If it's an array of materials, update each one
            if (Array.isArray(terrain.material)) {
                terrain.material.forEach(mat => {
                    mat.vertexColors = true;
                    mat.needsUpdate = true; // Force material update
                });
            } else {
                // Single material
                terrain.material.vertexColors = true;
                terrain.material.needsUpdate = true; // Force material update
            }
            
            console.debug("Updated terrain material to use vertex colors");
        } else {
            console.warn("Terrain has no material to update for vertex colors");
        }
        
        // Force geometry update
        terrain.geometry.attributes.color.needsUpdate = true;
        
        // Mark the terrain for rendering update
        if (terrain.geometry) {
            terrain.geometry.computeVertexNormals();
        }
    }
    
    /**
     * Show enhanced spiral teleport effect
     * @param {Object} portal - The portal being used
     */
    showTeleportEffect(portal) {
        // Skip if no game or player
        if (!this.game || !this.game.player) return;
        
        // Calculate distance to determine effect intensity
        const distance = portal.sourcePosition.distanceTo(portal.targetPosition);
        const isLongDistance = distance > 1000;
        const isExtremeDistance = distance > 5000;
        
        console.debug(`Teleport distance: ${distance.toFixed(2)}, long: ${isLongDistance}, extreme: ${isExtremeDistance}`);
        
        // Show enhanced spiral effect using pre-defined HTML element
        this.showTeleportSpiralEffect(isExtremeDistance);
        
        // Play teleport sound with spiral effect
        if (this.game.audioManager) {
            // Adjust volume based on distance
            const volume = isExtremeDistance ? 0.8 : (isLongDistance ? 0.7 : 0.5);
            this.game.audioManager.playSound('teleport', volume);
            
            // For extreme distances, add multiple sound layers
            if (isExtremeDistance && this.game.audioManager.playSound) {
                setTimeout(() => {
                    this.game.audioManager.playSound('teleport', 0.4);
                }, 300);
                setTimeout(() => {
                    this.game.audioManager.playSound('teleport', 0.2);
                }, 600);
            }
        }
        
        // Temporarily boost portal animation during teleport
        const originalAnimationSpeed = this.animationSpeed;
        const originalRotationSpeed = this.rotationSpeed;
        
        this.animationSpeed *= 3;
        this.rotationSpeed *= 5;
        
        // Reset animation speeds after effect
        setTimeout(() => {
            this.animationSpeed = originalAnimationSpeed;
            this.rotationSpeed = originalRotationSpeed;
        }, this.effectDuration);
    }
    
    /**
     * Get all portals for the minimap
     * @returns {Array} - Array of portal objects for the minimap
     */
    getPortals() {
        return this.portals.map(portal => ({
            position: portal.sourcePosition,
            targetPosition: portal.targetPosition,
            name: portal.sourceName,
            targetName: portal.targetName,
            type: 'portal'
        }));
    }
    
    /**
     * Create a temporary portal for teleport-to-origin functionality
     * @param {THREE.Vector3} sourcePosition - The position of the source portal
     * @param {THREE.Vector3} targetPosition - The position to teleport to (default: origin)
     * @param {number} duration - Portal duration in milliseconds (default: 10 seconds)
     * @returns {Object} - The created temporary portal object
     */
    createTemporaryPortal(sourcePosition, targetPosition = null, duration = 10000) {
        // Default target position is origin (0, 0, 0)
        if (!targetPosition) {
            targetPosition = new THREE.Vector3(0, 0, 0);
            // Adjust target Y position based on terrain height
            try {
                if (this.worldManager && this.worldManager.getTerrainHeight) {
                    targetPosition.y = this.worldManager.getTerrainHeight(0, 0) + 0.5;
                }
            } catch (e) {
                console.warn('Error adjusting target portal height:', e);
                targetPosition.y = 0.5;
            }
        }
        
        // Create the portal with custom colors for temporary portals
        const temporaryPortal = this.createPortal(
            sourcePosition,
            targetPosition,
            'Origin Portal',
            'Starting Area',
            0x00ffff, // Cyan color for origin portals
            0x0099ff, // Blue emissive
            1.5       // Slightly larger size
        );
        
        // Mark as temporary
        temporaryPortal.isTemporary = true;
        temporaryPortal.expirationTime = Date.now() + duration;
        
        console.debug(`Created temporary portal at (${sourcePosition.x.toFixed(1)}, ${sourcePosition.y.toFixed(1)}, ${sourcePosition.z.toFixed(1)}) for ${duration}ms`);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removePortal(temporaryPortal.id);
            console.debug('Temporary portal expired and removed');
        }, duration);
        
        return temporaryPortal;
    }
    
    /**
     * Remove a portal
     * @param {string} portalId - ID of the portal to remove
     */
    removePortal(portalId) {
        const portalIndex = this.portals.findIndex(p => p.id === portalId);
        
        if (portalIndex !== -1) {
            const portal = this.portals[portalIndex];
            
            // Remove mesh using the factory
            if (portal.mesh) {
                this.portalModelFactory.removeMesh(portal.mesh);
            }
            
            // Remove particles using the factory
            if (portal.particles) {
                this.portalModelFactory.removeMesh(portal.particles);
            }
            
            // Remove label sprite
            const sprite = this.portalLabels[portal.id];
            if (sprite) {
                // Remove from scene
                this.scene.remove(sprite);
                
                // Dispose of texture and material
                if (sprite.material) {
                    if (sprite.material.map) {
                        sprite.material.map.dispose();
                    }
                    sprite.material.dispose();
                }
                
                // Remove from portalLabels object
                delete this.portalLabels[portal.id];
            }
            
            // Remove from array
            this.portals.splice(portalIndex, 1);
            
            // console.debug(`Removed teleport portal: ${portal.sourceName}`);
        }
    }
    
    /**
     * Clear all portals
     */
    clear() {
        // Remove all portals from scene using the factory
        this.portals.forEach(portal => {
            if (portal.mesh) {
                this.portalModelFactory.removeMesh(portal.mesh);
            }
            
            if (portal.particles) {
                this.portalModelFactory.removeMesh(portal.particles);
            }
            
            // Remove label sprite
            const sprite = this.portalLabels[portal.id];
            if (sprite) {
                // Remove from scene
                this.scene.remove(sprite);
                
                // Dispose of texture and material
                if (sprite.material) {
                    if (sprite.material.map) {
                        sprite.material.map.dispose();
                    }
                    sprite.material.dispose();
                }
            }
        });
        
        // Clear arrays and reset active portal
        this.portals = [];
        this.portalLabels = {};
        this.activePortal = null;
        
        console.debug("Cleared all teleport portals");
    }
    
    /**
     * Show the teleport spiral effect using pre-defined HTML element
     * @param {boolean} isExtremeDistance - Whether this is an extreme distance teleport
     */
    showTeleportSpiralEffect(isExtremeDistance = false) {
        // Get the pre-defined spiral container element
        const spiralContainer = document.getElementById('teleport-spiral-container');
        
        if (!spiralContainer) {
            console.warn('Teleport spiral container not found in DOM');
            return;
        }
        
        // Reset any previous state
        spiralContainer.classList.remove('extreme-spiral');
        spiralContainer.style.animation = '';
        
        // Show the container
        spiralContainer.style.display = 'block';
        
        // Enhanced effect for extreme distances
        if (isExtremeDistance) {
            spiralContainer.classList.add('extreme-spiral');
        }
        
        // Hide spiral effect after duration
        setTimeout(() => {
            // Add fade out animation
            spiralContainer.style.animation = 'spiralFadeOut 0.8s ease-in forwards';
            
            setTimeout(() => {
                // Hide the container
                spiralContainer.style.display = 'none';
                // Reset animation for next use
                spiralContainer.style.animation = '';
                // Remove extreme class for next use
                spiralContainer.classList.remove('extreme-spiral');
            }, 800);
        }, this.effectDuration - 800);
    }
}