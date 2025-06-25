import { UIComponent } from '../UIComponent.js';
import * as THREE from 'three';

/**
 * Camera Control UI component
 * Provides drag-to-rotate camera controls for the game
 * Only active on the right half of the screen
 */
export class CameraControlUI extends UIComponent {
    /**
     * Create a new CameraControlUI component
     * @param {import("../game/Game.js").Game} game - Reference to the game instance
     */
    constructor(game) {
        super('game-container', game);
        
        // Initialize camera control state
        this.cameraState = {
            active: false,
            potentialDrag: false, // Track if we're in a potential drag state
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            rotationX: 0,
            rotationY: 0,
            // Store the original rotation values at the start of a drag
            originalRotationX: 0,
            originalRotationY: 0,
        };
        
        // Camera mode state
        this.cameraModes = {
            THIRD_PERSON: 'third-person',    // Default third-person view
            OVER_SHOULDER: 'over-shoulder'   // First-person-like view showing back of head
        };
        
        // Current camera mode
        this.currentCameraMode = this.cameraModes.THIRD_PERSON;
        
        // Camera distances for different modes
        this.cameraDistances = {
            [this.cameraModes.THIRD_PERSON]: 15,     // Default distance for third-person
            [this.cameraModes.OVER_SHOULDER]: 15      // Increased distance for over-shoulder view to be further behind player
        };
        
        // Default camera distance (can be modified via settings)
        this.cameraDistance = this.cameraDistances[this.currentCameraMode];
        
        // Camera height configuration for different modes
        this.cameraHeights = {
            [this.cameraModes.THIRD_PERSON]: 20,     // Default height for third-person
            [this.cameraModes.OVER_SHOULDER]: 5     // Higher position for over-shoulder view
        };
        
        // Camera look offset configuration for different modes
        this.cameraLookOffsets = {
            [this.cameraModes.THIRD_PERSON]: 5,      // Default look offset for third-person
            [this.cameraModes.OVER_SHOULDER]: 3      // Look slightly upward in over-shoulder view
        };
        
        // Camera height configuration (can be adjusted for testing)
        this.cameraHeightConfig = {
            // Height offset from player position (negative values move camera down)
            heightOffset: this.cameraHeights[this.currentCameraMode],
            // Vertical offset for lookAt target (0 = eye level, positive = look up, negative = look down)
            verticalLookOffset: this.cameraLookOffsets[this.currentCameraMode]
        };
        
        // Store the initial camera position and rotation
        this.initialCameraPosition = null;
        this.initialCameraRotation = null;
        
        // Visual indicator elements
        this.baseElement = null;
        this.handleElement = null;
        
        console.debug("CameraControlUI initialized with camera mode support");
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    async init() {
        // Create camera control button
        this.createCameraControlButton();
        
        // Set up event listeners for the button
        this.setupCameraControlButtonEvents();
        
        // Create camera height adjustment controls
        this.createCameraHeightControls();
        
        // Store initial camera position and rotation
        if (this.game && this.game.camera) {
            this.initialCameraPosition = this.game.camera.position.clone();
            this.initialCameraRotation = this.game.camera.rotation.clone();
        }
        
        // Load camera distance from settings if available
        await this.loadCameraSettings();
        
        return true;
    }
    
    /**
     * Create camera height adjustment controls
     */
    createCameraHeightControls() {
        // Create container for camera height controls
        const container = document.createElement('div');
        container.id = 'camera-height-controls';
        container.style.position = 'absolute';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.color = 'white';
        container.style.zIndex = '1000';
        container.style.display = 'none'; // Hidden by default
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'Camera Height Adjustment';
        title.style.marginBottom = '10px';
        title.style.fontWeight = 'bold';
        container.appendChild(title);
        
        // Create height offset control
        const heightOffsetContainer = document.createElement('div');
        heightOffsetContainer.style.marginBottom = '10px';
        
        const heightOffsetLabel = document.createElement('label');
        heightOffsetLabel.textContent = 'Camera Height: ';
        heightOffsetLabel.setAttribute('for', 'camera-height-offset');
        heightOffsetContainer.appendChild(heightOffsetLabel);
        
        const heightOffsetValue = document.createElement('span');
        heightOffsetValue.id = 'camera-height-offset-value';
        heightOffsetValue.textContent = this.cameraHeightConfig.heightOffset;
        heightOffsetContainer.appendChild(heightOffsetValue);
        
        const heightOffsetSlider = document.createElement('input');
        heightOffsetSlider.type = 'range';
        heightOffsetSlider.id = 'camera-height-offset';
        heightOffsetSlider.min = '-20';
        heightOffsetSlider.max = '20';
        heightOffsetSlider.step = '1';
        heightOffsetSlider.value = this.cameraHeightConfig.heightOffset;
        heightOffsetSlider.style.width = '100%';
        heightOffsetSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.cameraHeightConfig.heightOffset = value;
            heightOffsetValue.textContent = value;
            
            // Update the stored height for the current camera mode
            this.cameraHeights[this.currentCameraMode] = value;
            
            // Save the setting to localStorage
            import('../config/storage-keys.js').then(module => {
                const STORAGE_KEYS = module.STORAGE_KEYS;
                localStorage.setItem(STORAGE_KEYS.CAMERA_HEIGHT, value);
            }).catch(error => {
                console.error("Error saving camera height to localStorage:", error);
            });
            
            // Update camera position
            if (this.validateGameComponents()) {
                this.updateCameraOrbit(this.cameraState.rotationX, this.cameraState.rotationY);
            }
        });
        heightOffsetContainer.appendChild(heightOffsetSlider);
        container.appendChild(heightOffsetContainer);
        
        // Create look offset control
        const lookOffsetContainer = document.createElement('div');
        lookOffsetContainer.style.marginBottom = '10px';
        
        const lookOffsetLabel = document.createElement('label');
        lookOffsetLabel.textContent = 'Look Direction: ';
        lookOffsetLabel.setAttribute('for', 'camera-look-offset');
        lookOffsetContainer.appendChild(lookOffsetLabel);
        
        const lookOffsetValue = document.createElement('span');
        lookOffsetValue.id = 'camera-look-offset-value';
        lookOffsetValue.textContent = this.cameraHeightConfig.verticalLookOffset;
        lookOffsetContainer.appendChild(lookOffsetValue);
        
        const lookOffsetSlider = document.createElement('input');
        lookOffsetSlider.type = 'range';
        lookOffsetSlider.id = 'camera-look-offset';
        lookOffsetSlider.min = '-20';
        lookOffsetSlider.max = '20';
        lookOffsetSlider.step = '1';
        lookOffsetSlider.value = this.cameraHeightConfig.verticalLookOffset;
        lookOffsetSlider.style.width = '100%';
        lookOffsetSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.cameraHeightConfig.verticalLookOffset = value;
            lookOffsetValue.textContent = value;
            
            // Update the stored look offset for the current camera mode
            this.cameraLookOffsets[this.currentCameraMode] = value;
            
            // Save the setting to localStorage
            import('../config/storage-keys.js').then(module => {
                const STORAGE_KEYS = module.STORAGE_KEYS;
                localStorage.setItem(STORAGE_KEYS.CAMERA_LOOK_OFFSET, value);
            }).catch(error => {
                console.error("Error saving camera look offset to localStorage:", error);
            });
            
            // Update camera position
            if (this.validateGameComponents()) {
                this.updateCameraOrbit(this.cameraState.rotationX, this.cameraState.rotationY);
            }
        });
        lookOffsetContainer.appendChild(lookOffsetSlider);
        container.appendChild(lookOffsetContainer);
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'camera-height-toggle';
        toggleButton.textContent = 'Show Camera Controls';
        toggleButton.style.position = 'absolute';
        toggleButton.style.bottom = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.zIndex = '1001';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#4CAF50';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '4px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.display = 'none'; // TODO: enable when need adjust
        
        toggleButton.addEventListener('click', () => {
            if (container.style.display === 'none') {
                container.style.display = 'block';
                toggleButton.textContent = 'Hide Camera Controls';
            } else {
                container.style.display = 'none';
                toggleButton.textContent = 'Show Camera Controls';
            }
        });
        
        // Add elements to the DOM
        document.body.appendChild(container);
        document.body.appendChild(toggleButton);
        
        // Store references
        this.cameraHeightControls = {
            container,
            toggleButton,
            heightOffsetSlider,
            lookOffsetSlider
        };
    }
    
    /**
     * Load camera settings from localStorage
     */
    async loadCameraSettings() {
        try {
            // Import storage keys
            const module = await import('../config/storage-keys.js');
            const STORAGE_KEYS = module.STORAGE_KEYS;
            
            // Load camera zoom setting
            const storedZoom = localStorage.getItem(STORAGE_KEYS.CAMERA_ZOOM);
            if (storedZoom) {
                this.cameraDistance = parseInt(storedZoom);
                console.debug("Loaded camera distance from settings:", this.cameraDistance);
                
                // Update the camera distances for the current mode
                this.cameraDistances[this.currentCameraMode] = this.cameraDistance;
            }
            
            // Load camera height setting
            const storedHeight = localStorage.getItem(STORAGE_KEYS.CAMERA_HEIGHT);
            if (storedHeight) {
                const heightOffset = parseInt(storedHeight);
                this.cameraHeightConfig.heightOffset = heightOffset;
                console.debug("Loaded camera height from settings:", heightOffset);
                
                // Update the camera heights for the current mode
                this.cameraHeights[this.currentCameraMode] = heightOffset;
            }
            
            // Load camera look offset setting
            const storedLookOffset = localStorage.getItem(STORAGE_KEYS.CAMERA_LOOK_OFFSET);
            if (storedLookOffset) {
                const lookOffset = parseInt(storedLookOffset);
                this.cameraHeightConfig.verticalLookOffset = lookOffset;
                console.debug("Loaded camera look offset from settings:", lookOffset);
                
                // Update the camera look offsets for the current mode
                this.cameraLookOffsets[this.currentCameraMode] = lookOffset;
            }
            
            // Load camera mode setting
            const storedMode = localStorage.getItem(STORAGE_KEYS.CAMERA_MODE);
            if (storedMode && Object.values(this.cameraModes).includes(storedMode)) {
                this.currentCameraMode = storedMode;
                console.debug("Loaded camera mode from settings:", this.currentCameraMode);
                
                // Update the camera distance based on the mode
                this.cameraDistance = this.cameraDistances[this.currentCameraMode];
                
                // Update the camera height and look offset based on the mode
                this.cameraHeightConfig.heightOffset = this.cameraHeights[this.currentCameraMode];
                this.cameraHeightConfig.verticalLookOffset = this.cameraLookOffsets[this.currentCameraMode];
                
                // Update the camera mode button UI - button should exist by now
                this.updateCameraModeButtonUI();
            }
            
            // Apply the camera settings immediately if the game and player are available
            if (this.validateGameComponents()) {
                // If we have rotation values, update the camera orbit
                if (this.cameraState.rotationX !== undefined && this.cameraState.rotationY !== undefined) {
                    this.updateCameraOrbit(this.cameraState.rotationX, this.cameraState.rotationY);
                } else {
                    // Otherwise, just set the initial position with the new distance
                    const playerPosition = this.game.player.getPosition();
                    if (playerPosition) {
                        // Calculate a default position behind the player
                        const defaultRotationX = -0.5; // Negative value for downward angle (looking down at player)
                        const defaultRotationY = Math.PI; // Behind the player
                        
                        // Store these as the initial rotation values
                        this.cameraState.rotationX = defaultRotationX;
                        this.cameraState.rotationY = defaultRotationY;
                        
                        // Update the camera position
                        this.updateCameraOrbit(defaultRotationX, defaultRotationY);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading camera settings:", error);
        }
    }
    
    /**
     * Validate that all required game components are available
     * @returns {boolean} - True if all components are valid
     */
    validateGameComponents() {
        if (!this.game) {
            console.warn('Game instance not available in CameraControlUI');
            return false;
        }
        
        if (!this.game.camera) {
            console.warn('Game camera not available in CameraControlUI');
            return false;
        }
        
        if (!this.game.renderer) {
            console.warn('Game renderer not available in CameraControlUI');
            return false;
        }
        
        if (!this.game.scene) {
            console.warn('Game scene not available in CameraControlUI');
            return false;
        }
        
        if (!this.game.player) {
            console.warn('Game player not available in CameraControlUI');
            return false;
        }
        
        return true;
    }
    
    /**
     * Get reference to the camera control buttons (defined in HTML)
     */
    createCameraControlButton() {
        // Get reference to the predefined camera control button
        this.cameraButton = document.getElementById('camera-control-button');
        
        if (!this.cameraButton) {
            console.error('Camera control button element not found in HTML');
            return;
        }
        
        // Get reference to the camera mode button
        this.cameraModeButton = document.getElementById('camera-mode-button');
        
        if (!this.cameraModeButton) {
            console.error('Camera mode button element not found in HTML');
            return;
        }
        
        // Get references to the existing visual indicator elements (if they exist)
        this.indicatorContainer = document.getElementById('camera-control-indicator');
        this.baseElement = document.getElementById('camera-control-base');
        this.handleElement = document.getElementById('camera-control-handle');
        
        // Ensure the indicator is initially hidden
        if (this.indicatorContainer) {
            this.indicatorContainer.style.display = 'none';
        }
        
        // Update the camera mode button UI based on current mode
        this.updateCameraModeButtonUI();
    }
    
    /**
     * Update the camera mode button UI based on current mode
     */
    updateCameraModeButtonUI() {
        if (!this.cameraModeButton) {
            console.debug('Camera mode button not available for UI update');
            return;
        }
        
        console.debug('Updating camera mode button UI for mode:', this.currentCameraMode);
        
        // Update button appearance based on current mode
        if (this.currentCameraMode === this.cameraModes.OVER_SHOULDER) {
            this.cameraModeButton.classList.add('active');
            this.cameraModeButton.title = 'Currently: Over-shoulder view | Click to switch to third-person view';
            
            // Update icon to indicate current mode
            const iconElement = this.cameraModeButton.querySelector('.camera-mode-icon');
            if (iconElement) {
                iconElement.textContent = '👁️';
            }
        } else {
            this.cameraModeButton.classList.remove('active');
            this.cameraModeButton.title = 'Currently: Third-person view | Click to switch to over-shoulder view';
            
            // Update icon to indicate current mode
            const iconElement = this.cameraModeButton.querySelector('.camera-mode-icon');
            if (iconElement) {
                iconElement.textContent = '👀';
            }
        }
    }
    
    /**
     * Set up camera control button event listeners
     */
    setupCameraControlButtonEvents() {
        if (!this.cameraButton || !this.cameraModeButton) {
            console.error('Camera control buttons not found');
            return;
        }
        
        // Set up camera mode button event listeners
        this.setupCameraModeButtonEvents();
        
        // Touch start event on button
        this.cameraButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const touch = event.touches[0];
            
            // Store touch start position but don't activate camera control yet
            // We'll wait for movement to confirm it's a drag and not a tap
            this.cameraState.startX = touch.clientX;
            this.cameraState.startY = touch.clientY;
            this.cameraState.currentX = touch.clientX;
            this.cameraState.currentY = touch.clientY;
            this.cameraState.potentialDrag = true; // Mark as potential drag
            this.cameraState.active = false; // Not active until we confirm it's a drag
            
            // Store initial camera rotation for potential drag
            this.storeInitialCameraRotation();
            
            // Visual feedback - make button slightly larger
            this.cameraButton.style.transform = 'scale(0.95)';
        }, { passive: false });
        
        // Mouse down event on button (for testing on desktop)
        this.cameraButton.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Store mouse start position but don't activate camera control yet
            // We'll wait for movement to confirm it's a drag and not a click
            this.cameraState.startX = event.clientX;
            this.cameraState.startY = event.clientY;
            this.cameraState.currentX = event.clientX;
            this.cameraState.currentY = event.clientY;
            this.cameraState.potentialDrag = true; // Mark as potential drag
            this.cameraState.active = false; // Not active until we confirm it's a drag
            
            // Store initial camera rotation for potential drag
            this.storeInitialCameraRotation();
            
            // Visual feedback - make button slightly larger
            this.cameraButton.style.transform = 'scale(0.95)';
            
            // Add global mouse move and up events
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        });
        
        // Touch move event on document (to allow dragging outside the button)
        document.addEventListener('touchmove', (event) => {
            if (this.cameraState.potentialDrag || this.cameraState.active) {
                const touch = event.touches[0];
                
                // If we have a potential drag, check if it's moved enough to be considered a drag
                if (this.cameraState.potentialDrag && !this.cameraState.active) {
                    const dragDistanceX = Math.abs(touch.clientX - this.cameraState.startX);
                    const dragDistanceY = Math.abs(touch.clientY - this.cameraState.startY);
                    const minDragDistance = 10; // Threshold to distinguish drag from tap
                    
                    // If moved enough, activate camera control
                    if (dragDistanceX > minDragDistance || dragDistanceY > minDragDistance) {
                        this.cameraState.active = true;
                        // Show the visual indicator since we confirmed it's a drag
                        this.showVisualIndicator(this.cameraState.startX, this.cameraState.startY);
                        console.debug("Camera drag activated after movement threshold");
                    }
                }
                
                // Only handle move if camera control is active
                if (this.cameraState.active) {
                    this.handleCameraControlMove(touch.clientX, touch.clientY);
                    // Prevent default to avoid scrolling
                    event.preventDefault();
                }
            }
        }, { passive: false });
        
        // Touch end event on document
        document.addEventListener('touchend', (event) => {
            if (this.cameraState.potentialDrag || this.cameraState.active) {
                // Reset button visual feedback
                this.cameraButton.style.transform = 'scale(1)';
                
                // If it was just a tap (not a drag), handle it as a quick camera reset
                if (this.cameraState.potentialDrag && !this.cameraState.active) {
                    this.resetCameraToDefault();
                } else {
                    // Otherwise handle as camera control end
                    this.handleCameraControlEnd();
                }
                
                // Reset potential drag state
                this.cameraState.potentialDrag = false;
            }
        });
        
        // Touch cancel event on document
        document.addEventListener('touchcancel', () => {
            if (this.cameraState.potentialDrag || this.cameraState.active) {
                // Reset button visual feedback
                this.cameraButton.style.transform = 'scale(1)';
                this.handleCameraControlEnd();
                this.cameraState.potentialDrag = false;
            }
        });
        
        // Mouse move handler (defined as property to allow removal)
        this.handleMouseMove = (event) => {
            if (this.cameraState.potentialDrag || this.cameraState.active) {
                // If we have a potential drag, check if it's moved enough to be considered a drag
                if (this.cameraState.potentialDrag && !this.cameraState.active) {
                    const dragDistanceX = Math.abs(event.clientX - this.cameraState.startX);
                    const dragDistanceY = Math.abs(event.clientY - this.cameraState.startY);
                    const minDragDistance = 10; // Threshold to distinguish drag from click
                    
                    // If moved enough, activate camera control
                    if (dragDistanceX > minDragDistance || dragDistanceY > minDragDistance) {
                        this.cameraState.active = true;
                        // Show the visual indicator since we confirmed it's a drag
                        this.showVisualIndicator(this.cameraState.startX, this.cameraState.startY);
                        console.debug("Camera drag activated after movement threshold");
                    }
                }
                
                // Only handle move if camera control is active
                if (this.cameraState.active) {
                    this.handleCameraControlMove(event.clientX, event.clientY);
                }
            }
        };
        
        // Mouse up handler (defined as property to allow removal)
        this.handleMouseUp = (event) => {
            if (this.cameraState.potentialDrag || this.cameraState.active) {
                // Reset button visual feedback
                this.cameraButton.style.transform = 'scale(1)';
                
                // If it was just a click (not a drag), handle it as a quick camera reset
                if (this.cameraState.potentialDrag && !this.cameraState.active) {
                    this.resetCameraToDefault();
                } else {
                    // Otherwise handle as camera control end
                    this.handleCameraControlEnd();
                }
                
                // Reset potential drag state
                this.cameraState.potentialDrag = false;
                
                // Remove global mouse move and up events
                document.removeEventListener('mousemove', this.handleMouseMove);
                document.removeEventListener('mouseup', this.handleMouseUp);
            }
        };
    }
    
    /**
     * Handle camera control start event
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    /**
     * Store the initial camera rotation for potential drag
     */
    storeInitialCameraRotation() {
        // Calculate the current camera rotation based on its position relative to the player
        if (this.game && this.game.camera && this.game.player) {
            const playerPosition = this.game.player.getPosition();
            const cameraPosition = this.game.camera.position;
            
            // Calculate the horizontal angle (around Y axis)
            // This is the angle in the XZ plane
            const dx = cameraPosition.x - playerPosition.x;
            const dz = cameraPosition.z - playerPosition.z;
            const horizontalAngle = Math.atan2(dx, dz);
            
            // Calculate the vertical angle (around X axis)
            // This is the angle from the XZ plane to the camera
            const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
            const dy = cameraPosition.y - (playerPosition.y + 20); // Adjust for height offset
            const verticalAngle = Math.atan2(dy, horizontalDistance);
            
            // Store the calculated angles
            this.cameraState.rotationY = horizontalAngle;
            this.cameraState.rotationX = verticalAngle;
            
            // Store the original rotation values at the start of the drag
            this.cameraState.originalRotationX = verticalAngle;
            this.cameraState.originalRotationY = horizontalAngle;
            
            console.debug("Initial camera rotation calculated:", {
                x: this.cameraState.rotationX,
                y: this.cameraState.rotationY,
                originalX: this.cameraState.originalRotationX,
                originalY: this.cameraState.originalRotationY,
                verticalDegrees: THREE.MathUtils.radToDeg(verticalAngle),
                horizontalDegrees: THREE.MathUtils.radToDeg(horizontalAngle)
            });
            
            // Make sure orbit controls are enabled
            if (this.game.controls) {
                this.game.controls.enabled = true;
            }
        } else {
            // Fallback to using camera rotation directly if we can't calculate from position
            if (this.game && this.game.camera) {
                this.cameraState.rotationX = this.game.camera.rotation.x;
                this.cameraState.rotationY = this.game.camera.rotation.y;
                
                // Store the original rotation values at the start of the drag
                this.cameraState.originalRotationX = this.game.camera.rotation.x;
                this.cameraState.originalRotationY = this.game.camera.rotation.y;
                
                console.debug("Initial camera rotation (fallback):", {
                    x: this.cameraState.rotationX,
                    y: this.cameraState.rotationY,
                    originalX: this.cameraState.originalRotationX,
                    originalY: this.cameraState.originalRotationY
                });
            }
        }
    }
    
    /**
     * Handle a tap interaction (when user taps but doesn't drag)
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    handleTapInteraction(clientX, clientY) {
        console.debug("Tap detected - checking for interaction:", {clientX, clientY});
        
        // Check if we should handle it as an interaction
        if (this.game && this.game.interactionSystem) {
            // Get the object at the tap position using raycasting
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                // Calculate normalized device coordinates (-1 to +1)
                const rect = canvas.getBoundingClientRect();
                const x = ((clientX - rect.left) / rect.width) * 2 - 1;
                const y = -((clientY - rect.top) / rect.height) * 2 + 1;
                
                console.debug("Tap detected at normalized coordinates:", {x, y});
                
                // Create a raycaster directly here instead of relying on WorldManager
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(x, y), this.game.camera);
                
                // Get all interactive objects from the interaction system
                let interactiveObjects = [];
                if (this.game.interactionSystem && this.game.interactionSystem.getInteractiveObjects) {
                    interactiveObjects = this.game.interactionSystem.getInteractiveObjects();
                } else if (this.game.world && this.game.world.interactiveManager) {
                    // Fallback to world's interactive manager
                    interactiveObjects = this.game.world.interactiveManager.getInteractiveObjects();
                }
                
                // Filter objects that have meshes
                const meshes = [];
                const objectMap = new Map(); // Map to track which mesh belongs to which interactive object
                
                interactiveObjects.forEach(obj => {
                    if (obj.mesh) {
                        meshes.push(obj.mesh);
                        objectMap.set(obj.mesh.id, obj);
                        
                        // Also check children if they exist
                        if (obj.mesh.children && obj.mesh.children.length > 0) {
                            obj.mesh.children.forEach(child => {
                                meshes.push(child);
                                objectMap.set(child.id, obj);
                            });
                        }
                    }
                });
                
                // Perform raycast
                const intersects = raycaster.intersectObjects(meshes, true);
                
                if (intersects && intersects.length > 0) {
                    // Find the interactive object for the intersected mesh
                    let currentObject = intersects[0].object;
                    let interactiveObject = null;
                    
                    // Traverse up the parent chain to find a match in our map
                    while (currentObject && !interactiveObject) {
                        interactiveObject = objectMap.get(currentObject.id);
                        if (!interactiveObject && currentObject.parent) {
                            currentObject = currentObject.parent;
                        } else {
                            break;
                        }
                    }
                    
                    if (interactiveObject) {
                        console.debug("Found interactive object at tap position:", interactiveObject);
                        // Handle the interaction
                        this.game.interactionSystem.handleTouchInteraction(interactiveObject);
                        return; // Exit early after handling interaction
                    }
                }
                
                // If we get here, we didn't find an interactive object
                console.debug("No interactive object found at tap position");
                
                // Try a simpler approach - check if there's an object near the player
                if (this.game.player && this.game.interactionSystem) {
                    const nearbyObject = this.game.interactionSystem.getNearestInteractiveObject();
                    if (nearbyObject) {
                        console.debug("Found nearby interactive object:", nearbyObject);
                        this.game.interactionSystem.handleTouchInteraction(nearbyObject);
                    }
                }
            }
        }
    }
    
    /**
     * Handle camera control start event - now only used when we confirm it's a drag
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    handleCameraControlStart(clientX, clientY) {
        console.debug("Camera control start:", {clientX, clientY});
        
        // Set camera control state
        this.cameraState.active = true;
        this.cameraState.startX = clientX;
        this.cameraState.startY = clientY;
        this.cameraState.currentX = clientX;
        this.cameraState.currentY = clientY;
        
        // Store initial camera rotation
        this.storeInitialCameraRotation();
        
        // Show and position the visual indicator
        this.showVisualIndicator(clientX, clientY);
    }
    
    /**
     * Show and position the visual indicator
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    showVisualIndicator(x, y) {
        if (!this.indicatorContainer) return;
        
        // Position the indicator container at the start position
        this.indicatorContainer.style.left = `${x}px`;
        this.indicatorContainer.style.top = `${y}px`;
        
        // Position the handle at the center of the base
        this.handleElement.style.left = '50%';
        this.handleElement.style.top = '50%';
        
        // Show the indicator
        this.indicatorContainer.style.display = 'block';
    }
    
    /**
     * Handle camera control move event
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    handleCameraControlMove(clientX, clientY) {
        if (!this.cameraState.active || !this.game || !this.game.camera) return;
        
        // Update current position
        this.cameraState.currentX = clientX;
        this.cameraState.currentY = clientY;
        
        // Calculate delta from START position instead of current position
        // This allows the camera to return to its original position when dragged back
        const totalDeltaX = clientX - this.cameraState.startX;
        const totalDeltaY = clientY - this.cameraState.startY;
        
        // Calculate new rotation based on delta and sensitivity
        // Use different sensitivity for horizontal and vertical movement
        const horizontalSensitivity = 0.005; // Reduced for left/right movement
        const verticalSensitivity = 0.005;   // Reduced for up/down movement
        
        // Calculate horizontal rotation (around Y axis) from the original rotation
        const rotationY = this.cameraState.originalRotationY - totalDeltaX * horizontalSensitivity;
        
        // Calculate vertical rotation (around X axis) from the original rotation
        // Allow full vertical rotation range from -89° to +89° (in radians)
        const maxVerticalRotation = THREE.MathUtils.degToRad(89);
        
        // Calculate new rotation from the original rotation value
        let newRotationX = this.cameraState.originalRotationX - totalDeltaY * verticalSensitivity;
        
        // Clamp to prevent flipping
        newRotationX = Math.max(-maxVerticalRotation, Math.min(maxVerticalRotation, newRotationX));
        
        // Store the new rotation values for next frame
        this.cameraState.rotationX = newRotationX;
        this.cameraState.rotationY = rotationY;
        
        // Log detailed information for debugging
        console.debug("Camera drag detected:", {
            totalDeltaX, 
            totalDeltaY, 
            originalRotationX: this.cameraState.originalRotationX,
            originalRotationY: this.cameraState.originalRotationY,
            newRotationX, 
            rotationY,
            verticalDegrees: THREE.MathUtils.radToDeg(newRotationX),
            horizontalDegrees: THREE.MathUtils.radToDeg(rotationY)
        });
        
        // Update camera position to orbit around the player
        this.updateCameraOrbit(newRotationX, rotationY);
        
        // Update visual indicator
        this.updateVisualIndicator(totalDeltaX, totalDeltaY);
        
        // Prevent default behavior to avoid scrolling
        return false;
    }
    
    /**
     * Update the visual indicator based on drag distance
     * @param {number} deltaX - X distance from start position
     * @param {number} deltaY - Y distance from start position
     */
    updateVisualIndicator(deltaX, deltaY) {
        if (!this.handleElement) return;
        
        // Calculate distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Maximum distance the handle can move from center (in pixels)
        const maxDistance = 30;
        
        // Limit distance
        const limitedDistance = Math.min(distance, maxDistance);
        
        // Calculate normalized direction
        let normalizedX = 0;
        let normalizedY = 0;
        
        if (distance > 0) {
            normalizedX = deltaX / distance;
            normalizedY = deltaY / distance;
        }
        
        // Calculate new position
        const newX = normalizedX * limitedDistance;
        const newY = normalizedY * limitedDistance;
        
        // Update handle position
        this.handleElement.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
    }
    
    /**
     * Update camera position to orbit around the player
     * @param {number} rotationX - X rotation (vertical)
     * @param {number} rotationY - Y rotation (horizontal)
     */
    updateCameraOrbit(rotationX, rotationY) {
        try {
            console.debug("updateCameraOrbit", {rotationX, rotationY});
            
            // Comprehensive validation of game components
            if (!this.validateGameComponents()) {
                console.debug("Game components validation failed, skipping camera orbit update");
                return;
            }
            
            // Additional validation for WebGL context
            if (this.game.webglContextLost) {
                console.debug("WebGL context is lost, skipping camera orbit update");
                return;
            }
            
            // Get player position
            const playerPosition = this.game.player.getPosition();
            if (!playerPosition) {
                console.error("Player position is null or undefined");
                return;
            }
            console.debug("Player position:", playerPosition);
            
            // Use the camera distance from settings or default
            const distance = this.cameraDistance;
            
            // Validate rotation values to prevent NaN or Infinity
            if (isNaN(rotationX) || !isFinite(rotationX) || isNaN(rotationY) || !isFinite(rotationY)) {
                console.error("Invalid rotation values:", {rotationX, rotationY});
                return;
            }
            
            // Create a new THREE.Spherical to handle the orbital position calculation
            // This is a more reliable way to position a camera in an orbit
            const spherical = new THREE.Spherical(
                distance,                    // radius
                Math.PI/2 - rotationX,       // phi (vertical angle from top)
                rotationY                    // theta (horizontal angle)
            );
            
            // Convert spherical coordinates to cartesian
            const cameraOffset = new THREE.Vector3();
            cameraOffset.setFromSpherical(spherical);
            
            // Add the player position to get the final camera position
            // Apply height offsets to position camera appropriately using the configurable height offset
            // Negative values move the camera down, positive values move it up
            const heightOffset = this.cameraHeightConfig.heightOffset;
            
            const cameraPosition = new THREE.Vector3(
                playerPosition.x + cameraOffset.x,
                playerPosition.y + cameraOffset.y + heightOffset, // Adjusted height offset for better view
                playerPosition.z + cameraOffset.z
            );
            
            // Validate camera position to prevent NaN or Infinity
            if (isNaN(cameraPosition.x) || !isFinite(cameraPosition.x) ||
                isNaN(cameraPosition.y) || !isFinite(cameraPosition.y) ||
                isNaN(cameraPosition.z) || !isFinite(cameraPosition.z)) {
                console.error("Invalid camera position calculated:", cameraPosition);
                return;
            }
            
            console.debug("New camera position calculated:", cameraPosition);
            console.debug("Vertical angle in degrees:", THREE.MathUtils.radToDeg(rotationX));
            
            // Store original camera position for comparison
            const originalPosition = this.game.camera.position.clone();
            
            // Update camera position
            this.game.camera.position.copy(cameraPosition);
            
            console.debug("Camera position updated from:", originalPosition, "to:", this.game.camera.position);
            
            // Calculate look direction based on rotation
            // When looking up (positive rotationX), we want to look higher than the player's head
            // When looking down (negative rotationX), we want to look lower
            
            // Calculate vertical offset based on camera mode and rotation
            let verticalOffset;
            
            // Use the configurable vertical look offset as the base value
            // Then add rotation-based adjustment to allow looking up/down when rotating
            const rotationFactor = this.currentCameraMode === this.cameraModes.OVER_SHOULDER ? 15 : 25;
            verticalOffset = this.cameraHeightConfig.verticalLookOffset + (rotationX * rotationFactor);
            
            // Look at position that changes with vertical rotation
            const lookAtPosition = new THREE.Vector3(
                playerPosition.x,
                playerPosition.y + verticalOffset, // Adjust vertical look target based on rotation and mode
                playerPosition.z
            );
            
            // Validate lookAt position
            if (isNaN(lookAtPosition.x) || !isFinite(lookAtPosition.x) ||
                isNaN(lookAtPosition.y) || !isFinite(lookAtPosition.y) ||
                isNaN(lookAtPosition.z) || !isFinite(lookAtPosition.z)) {
                console.error("Invalid lookAt position calculated:", lookAtPosition);
                return;
            }
            
            this.game.camera.lookAt(lookAtPosition);
            
            console.debug("Camera lookAt set to:", lookAtPosition, "with vertical offset:", verticalOffset);
            
            // Update orbit controls target if available
            if (this.game.controls) {
                try {
                    const originalTarget = this.game.controls.target.clone();
                    
                    this.game.controls.target.copy(lookAtPosition);
                    
                    console.debug("OrbitControls target updated from:", originalTarget, "to:", this.game.controls.target);
                    
                    // Check if controls are enabled
                    console.debug("OrbitControls enabled:", this.game.controls.enabled);
                    
                    // Make sure controls are enabled and updated
                    this.game.controls.enabled = true;
                    this.game.controls.update();
                    
                    console.debug("OrbitControls updated");
                } catch (error) {
                    console.error("Error updating orbit controls:", error);
                }
            } else {
                console.debug("OrbitControls not available");
            }
            
            // Update player's view direction if needed
            if (this.game.player && typeof this.game.player.setLookDirection === 'function') {
                try {
                    // Create a look direction vector directly from the rotation angles
                    // This is more reliable than calculating from positions
                    const lookDirection = new THREE.Vector3();
                    
                    // Use spherical coordinates to create a direction vector
                    // This ensures the vertical component is correct
                    const sphericalLook = new THREE.Spherical(
                        1,                      // unit radius
                        Math.PI/2 - rotationX,  // phi (vertical angle from top)
                        rotationY               // theta (horizontal angle)
                    );
                    
                    lookDirection.setFromSpherical(sphericalLook);
                    
                    // Validate look direction
                    if (isNaN(lookDirection.x) || !isFinite(lookDirection.x) ||
                        isNaN(lookDirection.y) || !isFinite(lookDirection.y) ||
                        isNaN(lookDirection.z) || !isFinite(lookDirection.z)) {
                        console.error("Invalid look direction calculated:", lookDirection);
                        return;
                    }
                    
                    // Log the raw rotation values for debugging
                    console.debug("Creating look direction from rotations:", {
                        rotationX: rotationX,
                        rotationY: rotationY,
                        verticalDegrees: THREE.MathUtils.radToDeg(rotationX),
                        horizontalDegrees: THREE.MathUtils.radToDeg(rotationY)
                    });
                    
                    // Update the player's look direction
                    this.game.player.setLookDirection(lookDirection);
                } catch (error) {
                    console.error("Error updating player look direction:", error);
                }
            } else {
                console.debug("Player look direction update not available");
            }
            
            // Force a render to update the scene
            if (this.validateGameComponents() && this.game.renderer) {
                try {
                    // Disable orbit controls temporarily to prevent them from overriding our camera position
                    const orbitControlsEnabled = this.game.controls ? this.game.controls.enabled : false;
                    if (this.game.controls) {
                        this.game.controls.enabled = false;
                    }
                    
                    // Force the camera to update its matrix
                    this.game.camera.updateMatrixWorld(true);
                    
                    // Force a render with our camera settings using safe render
                    if (this.game.safeRender) {
                        this.game.safeRender(this.game.scene, this.game.camera);
                    } else {
                        // Fallback to direct render with error handling
                        try {
                            this.game.renderer.render(this.game.scene, this.game.camera);
                        } catch (error) {
                            console.warn('Render error in camera control:', error.message);
                        }
                    }
                    
                    // Restore orbit controls state
                    if (this.game.controls) {
                        this.game.controls.enabled = orbitControlsEnabled;
                    }
                    
                    console.debug("Forced scene render with camera matrix update");
                } catch (error) {
                    console.error("Error during forced render:", error);
                }
            } else {
                console.debug("Game renderer not available");
            }
            
            // Set a flag to ensure the camera position is maintained in the next frame
            this.cameraUpdatePending = true;
        } catch (error) {
            console.error("Critical error in updateCameraOrbit:", error);
            // Try to recover by resetting to default view
            try {
                this.resetCameraToDefault();
            } catch (recoveryError) {
                console.error("Failed to recover from camera error:", recoveryError);
            }
        }
    }
    
    /**
     * Handle camera control end event
     */
    handleCameraControlEnd() {
        // Only process if camera control was active
        if (!this.cameraState.active) {
            return;
        }
        
        // Reset camera control state
        this.cameraState.active = false;
        
        // Hide the visual indicator
        if (this.indicatorContainer) {
            this.indicatorContainer.style.display = 'none';
        }
        
        console.debug("Camera control ended");
        
        // Keep the camera update pending flag true
        // This ensures the camera position is maintained even after the control is released
        // The player should be able to look around and maintain that view
        this.cameraUpdatePending = true;
    }
    
    /**
     * Update method called every frame
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Check if we have a pending camera update from the last frame
        if (this.cameraUpdatePending && this.game && this.game.camera && this.game.player) {
            // Get the current camera state
            const rotationX = this.cameraState.rotationX;
            const rotationY = this.cameraState.rotationY;
            
            // Only update if we have valid rotation values
            if (rotationX !== undefined && rotationY !== undefined) {
                // Get player position
                const playerPosition = this.game.player.getPosition();
                
                // Use the camera distance from settings or default
                const distance = this.cameraDistance;
                
                // Create a new THREE.Spherical to handle the orbital position calculation
                const spherical = new THREE.Spherical(
                    distance,                    // radius
                    Math.PI/2 - rotationX,       // phi (vertical angle from top)
                    rotationY                    // theta (horizontal angle)
                );
                
                // Convert spherical coordinates to cartesian
                const cameraOffset = new THREE.Vector3();
                cameraOffset.setFromSpherical(spherical);
                
                // Add the player position to get the final camera position
                // Use the configured height offset from cameraHeightConfig
                const heightOffset = this.cameraHeightConfig.heightOffset;
                
                const cameraPosition = new THREE.Vector3(
                    playerPosition.x + cameraOffset.x,
                    playerPosition.y + cameraOffset.y + heightOffset, // Use the user-configured height offset
                    playerPosition.z + cameraOffset.z
                );
                
                // Update camera position
                this.game.camera.position.copy(cameraPosition);
                
                // Calculate vertical offset based on user configuration and rotation
                // Use the configurable vertical look offset as the base value
                // Then add rotation-based adjustment to allow looking up/down when rotating
                const rotationFactor = this.currentCameraMode === this.cameraModes.OVER_SHOULDER ? 15 : 25;
                const verticalOffset = this.cameraHeightConfig.verticalLookOffset + (rotationX * rotationFactor);
                
                // Look at position that changes with vertical rotation
                const lookAtPosition = new THREE.Vector3(
                    playerPosition.x,
                    playerPosition.y + verticalOffset,
                    playerPosition.z
                );
                
                // Update camera look-at
                this.game.camera.lookAt(lookAtPosition);
                
                // Update orbit controls target if available
                if (this.game.controls) {
                    this.game.controls.target.copy(lookAtPosition);
                }
                
                // Force the camera to update its matrix
                this.game.camera.updateMatrixWorld(true);
                
                // Log that we're maintaining the camera position
                // console.debug("Maintaining camera position in update loop");
            }
        }
    }
    
    /**
     * Set the camera distance and update the camera position
     * @param {number} distance - New camera distance
     */
    setCameraDistance(distance) {
        // Update the camera distance
        this.cameraDistance = distance;
        console.debug("Camera distance set to:", distance);
        
        // Apply the new distance if we have rotation values
        if (this.cameraState.rotationX !== undefined && this.cameraState.rotationY !== undefined) {
            this.updateCameraOrbit(this.cameraState.rotationX, this.cameraState.rotationY);
        }
        
        // Save the setting to localStorage
        import('../config/storage-keys.js').then(module => {
            const STORAGE_KEYS = module.STORAGE_KEYS;
            localStorage.setItem(STORAGE_KEYS.CAMERA_ZOOM, distance);
        }).catch(error => {
            console.error("Error saving camera distance to localStorage:", error);
        });
    }
    
    /**
     * Set camera height configuration
     * @param {number} heightOffset - Height offset from player position (negative values move camera down)
     * @param {number} verticalLookOffset - Vertical offset for lookAt target (0 = eye level, positive = look up, negative = look down)
     */
    setCameraHeightConfig(heightOffset, verticalLookOffset) {
        // Update the camera height configuration
        this.cameraHeightConfig.heightOffset = heightOffset;
        this.cameraHeightConfig.verticalLookOffset = verticalLookOffset;
        
        console.debug("Camera height configuration updated:", this.cameraHeightConfig);
        
        // Apply the new configuration immediately if possible
        if (this.validateGameComponents()) {
            this.updateCameraOrbit(this.cameraState.rotationX, this.cameraState.rotationY);
        }
    }
    
    /**
     * Reset camera to default position behind the player
     */
    resetCameraToDefault() {
        try {
            console.debug("Resetting camera to default position");
            
            if (!this.validateGameComponents()) {
                console.error("Cannot reset camera - game components not valid");
                return;
            }
            
            // Check for WebGL context loss
            if (this.game.webglContextLost) {
                console.error("Cannot reset camera - WebGL context is lost");
                return;
            }
            
            // Set default rotation values
            const defaultRotationX = -0.5; // Negative value for downward angle (looking down at player)
            const defaultRotationY = Math.PI; // Behind the player
            
            // Store these as the current rotation values
            this.cameraState.rotationX = defaultRotationX;
            this.cameraState.rotationY = defaultRotationY;
            
            // Set camera to default mode if we're having issues
            this.currentCameraMode = this.cameraModes.THIRD_PERSON;
            this.cameraDistance = this.cameraDistances[this.currentCameraMode];
            
            // Update the camera mode button UI
            this.updateCameraModeButtonUI();
            
            // Update the camera position with a safe call
            try {
                this.updateCameraOrbit(defaultRotationX, defaultRotationY);
                console.debug("Camera reset to default position");
            } catch (error) {
                console.error("Error during camera reset:", error);
                
                // Last resort - try to directly position the camera
                if (this.game && this.game.camera && this.game.player) {
                    try {
                        const playerPosition = this.game.player.getPosition();
                        if (playerPosition) {
                            // Position camera directly behind player
                            this.game.camera.position.set(
                                playerPosition.x, 
                                playerPosition.y + 20, 
                                playerPosition.z + 20
                            );
                            this.game.camera.lookAt(playerPosition);
                            console.debug("Camera emergency reset applied");
                        }
                    } catch (emergencyError) {
                        console.error("Emergency camera positioning failed:", emergencyError);
                    }
                }
            }
        } catch (error) {
            console.error("Critical error in resetCameraToDefault:", error);
        }
    }
    
    /**
     * Set up camera mode button event listeners
     */
    setupCameraModeButtonEvents() {
        if (!this.cameraModeButton) {
            console.error('Camera mode button not found');
            return;
        }
        
        // Touch event for camera mode button
        this.cameraModeButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleCameraMode();
        }, { passive: false });
        
        // Mouse event for camera mode button (for desktop testing)
        this.cameraModeButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleCameraMode();
        });
    }
    
    /**
     * Toggle between camera modes
     */
    toggleCameraMode() {
        try {
            // Store previous mode in case we need to revert
            const previousMode = this.currentCameraMode;
            
            // Toggle between camera modes
            if (this.currentCameraMode === this.cameraModes.THIRD_PERSON) {
                this.currentCameraMode = this.cameraModes.OVER_SHOULDER;
            } else {
                this.currentCameraMode = this.cameraModes.THIRD_PERSON;
            }
            
            console.debug("Camera mode toggled to:", this.currentCameraMode);
            
            // Update the camera distance based on the new mode
            this.cameraDistance = this.cameraDistances[this.currentCameraMode];
            
            // Update the camera height and look offset based on the new mode
            this.cameraHeightConfig.heightOffset = this.cameraHeights[this.currentCameraMode];
            this.cameraHeightConfig.verticalLookOffset = this.cameraLookOffsets[this.currentCameraMode];
            
            // Update the UI sliders to reflect the new values
            if (this.cameraHeightControls) {
                const heightSlider = this.cameraHeightControls.heightOffsetSlider;
                const lookSlider = this.cameraHeightControls.lookOffsetSlider;
                
                if (heightSlider) {
                    heightSlider.value = this.cameraHeightConfig.heightOffset;
                    document.getElementById('camera-height-offset-value').textContent = this.cameraHeightConfig.heightOffset;
                }
                
                if (lookSlider) {
                    lookSlider.value = this.cameraHeightConfig.verticalLookOffset;
                    document.getElementById('camera-look-offset-value').textContent = this.cameraHeightConfig.verticalLookOffset;
                }
            }
            
            // Validate game components before updating camera
            if (!this.validateGameComponents()) {
                console.error("Cannot update camera orbit - game components not valid");
                // Revert to previous mode if components aren't valid
                this.currentCameraMode = previousMode;
                return;
            }
            
            // Check for WebGL context loss
            if (this.game.webglContextLost) {
                console.error("Cannot update camera orbit - WebGL context is lost");
                // Revert to previous mode
                this.currentCameraMode = previousMode;
                return;
            }
            
            // Update the camera position with error handling
            if (this.cameraState.rotationX !== undefined && this.cameraState.rotationY !== undefined) {
                try {
                    this.updateCameraOrbit(this.cameraState.rotationX, this.cameraState.rotationY);
                } catch (error) {
                    console.error("Error updating camera orbit:", error);
                    // Revert to previous mode
                    this.currentCameraMode = previousMode;
                    return;
                }
            }
            
            // Update the camera mode button UI
            this.updateCameraModeButtonUI();
            
            // Save the camera mode to localStorage
            import('../config/storage-keys.js').then(module => {
                const STORAGE_KEYS = module.STORAGE_KEYS;
                localStorage.setItem(STORAGE_KEYS.CAMERA_MODE, this.currentCameraMode);
            }).catch(error => {
                console.error("Error saving camera mode to localStorage:", error);
            });
        } catch (error) {
            console.error("Error in toggleCameraMode:", error);
            // If any unexpected error occurs, try to recover
            this.resetCameraToDefault();
        }
    }
    
    /**
     * Remove event listeners when component is disposed
     */
    removeEventListeners() {
        // Remove camera button event listeners
        if (this.cameraButton) {
            // Remove camera button from DOM
            if (this.cameraButton.parentNode) {
                this.cameraButton.parentNode.removeChild(this.cameraButton);
            }
        }
        
        // Remove camera mode button event listeners
        if (this.cameraModeButton) {
            // Remove camera mode button from DOM
            if (this.cameraModeButton.parentNode) {
                this.cameraModeButton.parentNode.removeChild(this.cameraModeButton);
            }
        }
        
        // We can remove the named handlers we stored as properties
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        // Hide the indicator instead of removing it
        if (this.indicatorContainer) {
            this.indicatorContainer.style.display = 'none';
        }
    }
}