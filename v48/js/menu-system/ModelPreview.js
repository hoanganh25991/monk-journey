/**
 * ModelPreview.js
 * Creates a preview of a 3D model for the settings menu
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { updateAnimation } from '../utils/AnimationUtils.js';

export class ModelPreview {
    constructor(container, width = 300, height = 485) {
        this.container = container;
        this.width = width;
        this.height = height;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.animationId = null;
        this.visible = true;
        this.animations = {};
        this.currentAnimation = null;
        
        // Check if there's an existing wrapper with ID 'model-preview-fullscreen-wrapper'
        const existingWrapper = this.container.querySelector('#model-preview-fullscreen-wrapper');
        
        if (existingWrapper) {
            // Use the existing wrapper
            this.wrapper = existingWrapper;
            this.wrapper.style.width = `${width}px`;
            this.wrapper.style.height = `${height}px`;
        } else {
            // Create a wrapper to handle visibility
            this.wrapper = document.createElement('div');
            this.wrapper.style.width = `${width}px`;
            this.wrapper.style.height = `${height}px`;
            this.container.appendChild(this.wrapper);
        }
        
        // Set up intersection observer to pause rendering when not visible
        this.setupVisibilityObserver();
        
        this.init();
    }
    
    setupVisibilityObserver() {
        // For debugging - always set visible to true initially
        this.visible = true;
        
        // Create an intersection observer to detect when the preview is visible
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.debug('ModelPreview visibility changed:', entry.isIntersecting);
                this.visible = entry.isIntersecting;
                
                if (this.visible) {
                    // Resume animation when visible
                    if (!this.animationId) {
                        console.debug('ModelPreview: Resuming animation');
                        this.animate();
                    }
                } else {
                    // Pause animation when not visible
                    if (this.animationId) {
                        console.debug('ModelPreview: Pausing animation');
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            });
        }, {
            root: null, // Use viewport as root
            threshold: 0.1 // Trigger when at least 10% is visible
        });
        
        // Start observing the container
        this.observer.observe(this.wrapper);
        console.debug('ModelPreview: Visibility observer set up');
    }
    
    init() {
        console.debug('ModelPreview: Initializing with dimensions', this.width, this.height);
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x111111);
            
            // Create camera with wider field of view for better model visibility
            this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
            // Position camera further back (z-axis) and slightly higher (y-axis) to see the whole model
            this.camera.position.set(0, 2.0, 9.0); // Zoomed out by 2.25x from original z=4 position (1.5x more than before)
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // Add renderer to wrapper
            this.wrapper.appendChild(this.renderer.domElement);
            console.debug('ModelPreview: Renderer added to wrapper');
            
            // Add orbit controls with enhanced settings for better model viewing
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 3; // Increased minimum distance to prevent clipping into model
            this.controls.maxDistance = 12; // Increased maximum distance for better zooming capability
            this.controls.enablePan = true; // Allow panning for better positioning
            this.controls.autoRotate = false; // Can be enabled for automatic rotation
            this.controls.autoRotateSpeed = 1.0; // Speed of auto-rotation if enabled
            
            // Add lights
            this.addLights();
            
            // Add ground plane
            this.addGround();
            
            // Start animation loop
            console.debug('ModelPreview: Starting animation loop');
            this.animate();
        } catch (error) {
            console.error('ModelPreview: Error during initialization:', error);
        }
    }
    
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        
        this.scene.add(directionalLight);
    }
    
    addGround() {
        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Rotate and position the ground
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
    }
    
    loadModel(modelPath, scale = 1.0) {
        // Remove existing model if any
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
        }
        
        // Reset mixer and animations
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        
        // Load new model
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                this.model = gltf.scene;
                
                // Apply shadows to all meshes
                this.model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                
                // Set up animations if they exist
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    
                    // Store all animations
                    this.animations = {};
                    gltf.animations.forEach(animation => {
                        // Make sure animation has a name
                        if (!animation.name || animation.name === '') {
                            animation.name = `animation_${gltf.animations.indexOf(animation)}`;
                            console.debug(`ModelPreview: Unnamed animation detected, assigned name: ${animation.name}`);
                        }
                        
                        const action = this.mixer.clipAction(animation);
                        this.animations[animation.name] = action;
                    });
                    
                    // Log all available animations
                    const animationNames = Object.keys(this.animations);
                    console.debug(`ModelPreview: Loaded ${animationNames.length} animations:`, animationNames.join(', '));
                    
                    // Play the first animation if we have any
                    if (animationNames.length > 0) {
                        const firstAnimName = animationNames[0];
                        this.animations[firstAnimName].play();
                        this.currentAnimation = firstAnimName;
                        console.debug(`ModelPreview: Playing initial animation "${firstAnimName}"`);
                    } else {
                        console.warn('ModelPreview: No animations available to play');
                    }
                } else {
                    console.debug('ModelPreview: Model has no animations');
                }
                
                // Scale the model
                this.model.scale.set(scale, scale, scale);
                
                // Center the model
                this.centerModel();
                
                // Add to scene
                this.scene.add(this.model);
            },
            (xhr) => {
                console.debug(`Loading model: ${(xhr.loaded / xhr.total * 100)}% loaded`);
            },
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }
    
    centerModel() {
        if (!this.model) return;
        
        // Create a bounding box
        const box = new THREE.Box3().setFromObject(this.model);
        
        // Get the center of the bounding box
        const center = box.getCenter(new THREE.Vector3());
        
        // Move the model so its center is at the origin
        this.model.position.x = -center.x;
        this.model.position.z = -center.z;
        
        // Position the model so it's standing on the ground
        const size = box.getSize(new THREE.Vector3());
        this.model.position.y = -box.min.y;
        
        // Adjust camera position based on model size if needed
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 4) {
            // For larger models, move camera back proportionally
            const distanceFactor = maxDimension / 4;
            this.camera.position.z = Math.min(20, 9.0 * distanceFactor); // Updated to match the new default camera distance
            this.camera.updateProjectionMatrix();
        }
    }
    
    animate() {
        // Only continue animation if visible
        if (this.visible) {
            this.animationId = requestAnimationFrame(() => this.animate());
            
            // Update controls
            this.controls.update();
            
            // Update animations using AnimationUtils
            const delta = this.clock.getDelta();
            if (this.mixer) {
                updateAnimation(this.mixer, delta);
            }
            
            // Render scene
            try {
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                console.error('ModelPreview: Error rendering scene:', error);
            }
        } else {
            // If not visible, don't request another frame
            this.animationId = null;
        }
    }
    
    setSize(width, height) {
        this.width = width;
        this.height = height;
        
        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height);
    }
    
    // Auto-rotation and rotation speed methods have been removed
    
    /**
     * Reset camera to default position
     */
    resetCamera() {
        this.camera.position.set(0, 2.0, 9.0);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    /**
     * Get a list of all available animation names
     * @returns {Array} - Array of animation names
     */
    getAnimationNames() {
        return Object.keys(this.animations);
    }
    
    /**
     * Get the name of the currently playing animation
     * @returns {string|null} - Name of the current animation or null if none is playing
     */
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    
    /**
     * Play a specific animation by name
     * @param {string} animationName - Name of the animation to play
     * @param {number} transitionDuration - Duration of crossfade transition in seconds
     * @returns {boolean} - Whether the animation was successfully played
     */
    playAnimation(animationName, transitionDuration = 0.5) {
        console.debug(`ModelPreview: Attempting to play animation "${animationName}"`);
        console.debug(`ModelPreview: Available animations:`, Object.keys(this.animations));
        
        // If we don't have animations or the requested animation doesn't exist, return false
        if (!this.animations || !this.animations[animationName]) {
            console.warn(`ModelPreview: Animation "${animationName}" not found`);
            return false;
        }
        
        // If this is already the current animation, don't restart it
        if (this.currentAnimation === animationName) {
            console.debug(`ModelPreview: Animation "${animationName}" is already playing`);
            return true;
        }
        
        try {
            // Crossfade to the new animation
            this.animations[animationName].reset().fadeIn(transitionDuration).play();
            
            // If there was a previous animation, fade it out
            if (this.currentAnimation && this.animations[this.currentAnimation]) {
                this.animations[this.currentAnimation].fadeOut(transitionDuration);
            }
            
            // Update current animation
            this.currentAnimation = animationName;
            console.debug(`ModelPreview: Successfully playing animation "${animationName}"`);
            
            return true;
        } catch (error) {
            console.error(`ModelPreview: Error playing animation "${animationName}":`, error);
            return false;
        }
    }
    
    dispose() {
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Disconnect the observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Remove renderer from wrapper
        if (this.renderer && this.renderer.domElement) {
            this.wrapper.removeChild(this.renderer.domElement);
        }
        
        // Remove wrapper from container
        if (this.wrapper && this.wrapper.parentNode) {
            this.container.removeChild(this.wrapper);
        }
        
        // Dispose of resources
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.model = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
    }
}