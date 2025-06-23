import * as THREE from 'three';
import { 
    MOVEMENT_KEYS, 
    ACTION_KEYS, 
    UI_KEYS, 
    SKILL_KEYS, 
    getAllSkillKeys,
    getSkillIndexFromKeyCode,
    isSkillKey,
    CAST_INTERVAL,
    INTERACTION_RANGE
} from './config/input.js';
import { InteractionResultHandler } from './InteractionResultHandler.js';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};
        
        // Track skill keys being held down
        this.skillKeysHeld = {};
        
        // Cooldown tracking for continuous casting
        this.skillCastCooldowns = {};
        
        // Create interaction handler
        this.interactionHandler = new InteractionResultHandler(game);
        
        // Initialize skill key tracking
        const skillKeys = getAllSkillKeys();
        skillKeys.forEach(key => {
            this.skillKeysHeld[key] = false;
            this.skillCastCooldowns[key] = 0;
        });
        
        // Initialize input event listeners
        this.initKeyboardEvents();
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    initKeyboardEvents() {
        // Key down event
        window.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Debug: Log key press
            // console.debug('Key pressed:', event.code);
            
            // Handle special key presses
            switch (event.code) {
                // UI toggle keys
                case UI_KEYS.TOGGLE_INVENTORY:
                    this.game.hudManager.toggleInventory();
                    console.debug('Toggling inventory');
                    break;
                    
                case UI_KEYS.TOGGLE_SKILL_TREE:
                    this.game.hudManager.toggleSkillTree();
                    console.debug('Toggling skill tree');
                    break;
                    
                case UI_KEYS.TOGGLE_HUD:
                    const hudVisible = this.game.hudManager.toggleHUD();
                    console.debug(`HUD visibility toggled: ${hudVisible ? 'visible' : 'hidden'}`);
                    break;
                    
                case UI_KEYS.TOGGLE_MINIMAP:
                    const minimapVisible = this.game.hudManager.toggleMiniMap();
                    console.debug(`Mini map visibility toggled: ${minimapVisible ? 'visible' : 'hidden'}`);
                    break;
                    
                case UI_KEYS.MINIMAP_ZOOM_IN:
                    this.game.hudManager.decreaseMiniMapScale();
                    break;
                    
                case UI_KEYS.MINIMAP_ZOOM_OUT:
                    this.game.hudManager.increaseMiniMapScale();
                    break;
                    
                // Primary attack key
                case SKILL_KEYS.PRIMARY_ATTACK:
                    // Mark key as held down for basic attack
                    this.skillKeysHeld[event.code] = true;
                    
                    // Use basic attack (teleport or punch)
                    this.game.player.usePrimaryAttack();
                    break;
                    
                // Action keys
                case ACTION_KEYS.INTERACT:
                    // Interact with objects using the keyboard-based interaction method
                    this.handleInteractionWithNearestObject();
                    break;
                    
                case ACTION_KEYS.START_GAME:
                    // Only allow starting a new game when the game is not already running
                    if (this.game.isPaused && document.getElementById('game-menu')) {
                        console.debug('Start game key pressed - starting new game');
                        
                        // Hide any existing game menu
                        const existingGameMenu = document.getElementById('game-menu');
                        if (existingGameMenu) {
                            existingGameMenu.style.display = 'none';
                        }
                        
                        // Hide any existing options menu
                        const existingOptionsMenu = document.getElementById('main-options-menu');
                        if (existingOptionsMenu) {
                            existingOptionsMenu.style.display = 'none';
                        }
                        
                        // Start the game
                        this.game.start();
                        
                        // Make sure settings button is visible
                        const homeButton = document.getElementById('home-button');
                        if (homeButton) {
                            homeButton.style.display = 'block';
                        }
                        
                        console.debug("Game started - enemies and player are now active");
                    } else {
                        console.debug('Start game key pressed but game is already running or not at main menu');
                    }
                    break;
                    
                // Handle all skill keys (Digit1-Digit9)
                default:
                    // Check if this is a skill key
                    if (isSkillKey(event.code) && event.code !== SKILL_KEYS.PRIMARY_ATTACK) {
                        // Mark skill key as held down
                        this.skillKeysHeld[event.code] = true;
                        
                        // Get skill index from key code
                        const skillIndex = getSkillIndexFromKeyCode(event.code);
                        
                        console.debug(`Using skill with index: ${skillIndex} from key: ${event.code}`);
                        
                        // Check if this is Digit1 and if the first skill is a primary attack
                        if (event.code === SKILL_KEYS.SKILL_1 && this.game.player.skills && this.game.player.skills.getSkills) {
                            const skills = this.game.player.skills.getSkills();
                            if (skills && skills.length > 0 && skills[0].primaryAttack) {
                                console.debug('Skill 1 is assigned to primary attack, using usePrimaryAttack() for consistent behavior');
                                this.game.player.usePrimaryAttack();
                            } else {
                                this.game.player.useSkill(skillIndex);
                            }
                        } else {
                            this.game.player.useSkill(skillIndex);
                        }
                    }
                    break;
            }
        });
        
        // Key up event
        window.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            
            // Handle skill key release
            if (this.skillKeysHeld[event.code] !== undefined) {
                this.skillKeysHeld[event.code] = false;
                this.skillCastCooldowns[event.code] = 0;
            }
        });
    }
    
    // Method to handle interaction with objects in front of the player
    // This replaces the mouse-based interaction with keyboard-based interaction
    handleInteractionWithNearestObject() {
        // Set player interaction state to true
        this.game.player.setInteracting(true);
        
        // Use the centralized interaction system if available
        if (this.game.interactionSystem) {
            console.debug('Using centralized interaction system for keyboard interaction');
            this.game.interactionSystem.handleKeyboardInteraction();
            return;
        }
        
        // Legacy implementation as fallback
        console.warn('Interaction system not available, using legacy method');
        this.handleLegacyInteraction();
    }
    
    // Legacy interaction handler for backward compatibility
    handleLegacyInteraction() {
        // Get player position and rotation
        const playerPosition = this.game.player.getPosition();
        const playerRotation = this.game.player.getRotation();
        
        // Calculate forward direction from player rotation
        const playerForward = new THREE.Vector3(
            Math.sin(playerRotation.y),
            0,
            Math.cos(playerRotation.y)
        );
        
        // Use interaction range from config
        const interactionRange = INTERACTION_RANGE; // Units in world space
        
        // Calculate interaction point in front of player
        const interactionPoint = new THREE.Vector3()
            .copy(playerPosition)
            .add(
                new THREE.Vector3()
                    .copy(playerForward)
                    .multiplyScalar(interactionRange)
            );
        
        // Get all interactive objects if they exist
        let interactiveObjects = [];
        if (this.game.world.interactiveManager && this.game.world.interactiveManager.getInteractiveObjects) {
            const objects = this.game.world.interactiveManager.getInteractiveObjects();
            if (objects && objects.length > 0) {
                interactiveObjects = objects;
            }
        } else if (this.game.world.interactiveObjects) {
            // Fallback to old structure if it exists
            console.warn('Using legacy interactiveObjects structure');
            interactiveObjects = this.game.world.interactiveObjects;
        } else {
            console.warn('No interactive objects manager found');
            // Reset interaction state after a short delay
            setTimeout(() => {
                this.game.player.setInteracting(false);
            }, 500);
            return;
        }
        
        // Find the nearest interactive object within range
        let nearestObject = null;
        let minDistance = interactionRange;
        
        for (const obj of interactiveObjects) {
            if (obj.mesh) {
                // Get object position
                const objPosition = new THREE.Vector3();
                obj.mesh.getWorldPosition(objPosition);
                
                // Calculate distance to player
                const distance = objPosition.distanceTo(playerPosition);
                
                // Check if this object is closer than the current nearest
                if (distance < minDistance) {
                    nearestObject = obj;
                    minDistance = distance;
                }
            }
        }
        
        // Interact with the nearest object if found
        if (nearestObject) {
            console.debug('Interacting with nearest object:', nearestObject);
            const result = nearestObject.onInteract();
            
            // Use the shared interaction handler
            this.interactionHandler.handleInteractionResult(result, nearestObject);
        } else {
            console.debug('No interactive objects within range');
            this.game.hudManager.showNotification('Nothing to interact with nearby');
        }
        
        // Reset interaction state after a short delay
        setTimeout(() => {
            this.game.player.setInteracting(false);
        }, 500);
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode] === true;
    }
    
    getMovementDirection() {
        // Get raw input direction in local space (relative to screen)
        const localDirection = new THREE.Vector3(0, 0, 0);
        
        // Check for keyboard input using movement keys from config
        if (MOVEMENT_KEYS.FORWARD.some(key => this.isKeyPressed(key))) {
            localDirection.z -= 1;
        }
        
        if (MOVEMENT_KEYS.BACKWARD.some(key => this.isKeyPressed(key))) {
            localDirection.z += 1;
        }
        
        if (MOVEMENT_KEYS.LEFT.some(key => this.isKeyPressed(key))) {
            localDirection.x -= 1;
        }
        
        if (MOVEMENT_KEYS.RIGHT.some(key => this.isKeyPressed(key))) {
            localDirection.x += 1;
        }
        
        // Check for joystick input (if available)
        if (this.game && this.game.hudManager && this.game.hudManager.getJoystickDirection) {
            const joystickDir = this.game.hudManager.getJoystickDirection();
            
            // Only use joystick if it's active (has non-zero values)
            if (joystickDir && (joystickDir.x !== 0 || joystickDir.y !== 0)) {
                // Override keyboard input with joystick input
                localDirection.x = joystickDir.x;
                localDirection.z = joystickDir.y; // Y axis of joystick maps to Z axis in 3D space
            }
        }
        
        // If no input, return zero vector
        if (localDirection.length() === 0) {
            return localDirection;
        }
        
        // Normalize the local direction
        localDirection.normalize();
        
        // Transform the local direction to world space based on camera rotation
        const worldDirection = new THREE.Vector3();
        
        // Get camera rotation around Y axis (horizontal rotation)
        let cameraRotationY = 0;
        
        // If we have a camera control UI, use its rotation
        if (this.game && this.game.hudManager && this.game.hudManager.components && 
            this.game.hudManager.components.cameraControlUI) {
            cameraRotationY = this.game.hudManager.components.cameraControlUI.cameraState.rotationY;
        } 
        // Fallback to camera's rotation if available
        else if (this.game && this.game.camera) {
            cameraRotationY = this.game.camera.rotation.y;
        }
        
        // Create rotation matrix for the camera's Y rotation
        const rotationMatrix = new THREE.Matrix4().makeRotationY(cameraRotationY);
        
        // Apply rotation to the local direction to get world direction
        worldDirection.copy(localDirection).applyMatrix4(rotationMatrix);
        
        // Ensure Y component is zero (we only want horizontal movement)
        worldDirection.y = 0;
        
        // Normalize again to ensure unit length
        if (worldDirection.length() > 0) {
            worldDirection.normalize();
        }
        
        return worldDirection;
    }
    
    // Mouse target and state methods removed as per requirements
    
    update(delta) {
        // Skip input processing if game is paused
        if (this.game && this.game.isPaused) {
            return; // Don't process inputs when game is paused
        }
        
        // Process only the keys that are actually held down
        for (const keyCode in this.skillKeysHeld) {
            if (this.skillKeysHeld[keyCode]) {
                // Reduce cooldown
                this.skillCastCooldowns[keyCode] -= delta;
                
                // If cooldown is up, cast the skill again
                if (this.skillCastCooldowns[keyCode] <= 0) {
                    try {
                        if (keyCode === SKILL_KEYS.PRIMARY_ATTACK) {
                            // Special handling for primary attack key
                            console.debug('Continuous casting: Basic attack');
                            this.game.player.usePrimaryAttack();
                            this.skillCastCooldowns[keyCode] = CAST_INTERVAL;
                        } else if (isSkillKey(keyCode)) {
                            // For skill keys
                            const skillIndex = getSkillIndexFromKeyCode(keyCode);
                            console.debug('Continuous casting: Skill key', keyCode, 'Skill index:', skillIndex);
                            
                            // Check if this is Skill 1 and if the first skill is a primary attack
                            if (keyCode === SKILL_KEYS.SKILL_1 && this.game.player.skills && this.game.player.skills.getSkills) {
                                const skills = this.game.player.skills.getSkills();
                                if (skills && skills.length > 0 && skills[0].primaryAttack) {
                                    console.debug('Continuous casting: Skill 1 is primary attack, using usePrimaryAttack()');
                                    this.game.player.usePrimaryAttack();
                                } else {
                                    this.game.player.useSkill(skillIndex);
                                }
                            } else {
                                this.game.player.useSkill(skillIndex);
                            }
                            this.skillCastCooldowns[keyCode] = CAST_INTERVAL;
                        }
                    } catch (error) {
                        console.error(`Error in continuous casting for key ${keyCode}:`, error);
                        // Reset the key state to prevent further errors
                        this.skillKeysHeld[keyCode] = false;
                        this.skillCastCooldowns[keyCode] = 0;
                    }
                }
            }
        }
    }
}