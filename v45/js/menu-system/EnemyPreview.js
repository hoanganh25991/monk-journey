/**
 * EnemyPreview.js
 * Creates a preview of enemy models with animations for the settings menu
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ENEMY_TYPES, BOSS_TYPES } from '../config/game-balance.js';
import { updateAnimation } from '../utils/AnimationUtils.js';
import { EnemyModelFactory } from '../entities/enemies/models/EnemyModelFactory.js';

export class EnemyPreview {
    /**
     * Create a new enemy preview
     * @param {HTMLElement} container - The container element
     * @param {number} width - The width of the preview
     * @param {number} height - The height of the preview
     */
    constructor(container, width = 300, height = 485) {
        this.container = container;
        this.width = width;
        this.height = height;
        
        // Create a wrapper element for the preview
        this.wrapper = document.createElement('div');
        this.wrapper.style.width = `${width}px`;
        this.wrapper.style.height = `${height}px`;
        this.wrapper.style.position = 'relative';
        this.container.appendChild(this.wrapper);
        
        // Scene setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationMixer = null;
        this.clock = new THREE.Clock();
        this.animationId = null;
        this.currentEnemy = null;
        this.currentModel = new THREE.Group();
        this.animations = {};
        this.currentAnimation = null;
        this.visible = true;
        
        // Set up visibility observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.debug('EnemyPreview visibility changed:', entry.isIntersecting);
                this.visible = entry.isIntersecting;
                
                if (entry.isIntersecting) {
                    // Resume animation when visible
                    if (!this.animationId) {
                        console.debug('EnemyPreview: Resuming animation');
                        this.animate();
                    }
                } else {
                    // Pause animation when not visible
                    if (this.animationId) {
                        console.debug('EnemyPreview: Pausing animation');
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            });
        }, {
            threshold: 0.1 // Trigger when at least 10% of the element is visible
        });
        
        // Start observing the container
        this.observer.observe(this.wrapper);
        console.debug('EnemyPreview: Visibility observer set up');
    }
    
    /**
     * Initialize the preview
     */
    init() {
        console.debug('EnemyPreview: Initializing with dimensions', this.width, this.height);
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x111111);
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            // Add directional light (simulates sunlight)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 10, 7.5);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);
            
            // Add point light to highlight the model
            const pointLight = new THREE.PointLight(0xffffff, 1, 100);
            pointLight.position.set(0, 5, 5);
            this.scene.add(pointLight);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
            this.camera.position.set(0, 2, 5);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            
            // Add renderer to wrapper
            this.wrapper.appendChild(this.renderer.domElement);
            console.debug('EnemyPreview: Renderer added to wrapper');
            
            // Add orbit controls
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 3;
            this.controls.maxDistance = 10;
            this.controls.maxPolarAngle = Math.PI / 2;
            
            // Add a ground plane
            const groundGeometry = new THREE.PlaneGeometry(10, 10);
            const groundMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                roughness: 0.8,
                metalness: 0.2
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Start animation loop
            console.debug('EnemyPreview: Starting animation loop');
            this.animate();
            
            // Set default enemy
            this.setDefaultEnemy();
        } catch (error) {
            console.error('EnemyPreview: Error during initialization:', error);
        }
    }
    
    /**
     * Set the default enemy
     */
    setDefaultEnemy() {
        const allEnemies = [...ENEMY_TYPES, ...BOSS_TYPES];
        if (allEnemies && allEnemies.length > 0) {
            console.debug('EnemyPreview: Setting up default enemy:', allEnemies[0].name);
            this.loadEnemyModel(allEnemies[0]);
        }
    }
    
    /**
     * Load an enemy model
     * @param {Object} enemy - The enemy object
     */
    loadEnemyModel(enemy) {
        if (!enemy) return;
        
        this.currentEnemy = enemy;
        
        // Clear existing model and animations
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            this.currentModel = null;
        }
        
        if (this.animationMixer) {
            this.animationMixer = null;
        }
        
        this.animations = {};
        
        // Create a group to hold the model
        this.currentModel = new THREE.Group();
        
        // Use EnemyModelFactory to create the appropriate model for this enemy type
        try {
            // Create a model using the factory
            const model = EnemyModelFactory.createModel(enemy, this.currentModel);
            
            // Call createModel() to build the actual geometry
            model.createModel();

            // Add the model to the scene
            this.scene.add(this.currentModel);
            
            // Add a nameplate above the model
            this.addNameplate(enemy.name);
            
            // Reset camera position
            this.resetCamera();
            
            console.debug(`EnemyPreview: Created model for ${enemy.name} using EnemyModelFactory`);
        } catch (error) {
            console.error(`EnemyPreview: Error creating model for ${enemy.name}:`, error);
            
            // Fallback to simple placeholder if the factory fails
            console.debug(`EnemyPreview: Falling back to simple placeholder for ${enemy.name}`);
        }
    }
    
    /**
     * Add a nameplate above the model
     * @param {string} name - The name to display
     */
    addNameplate(name) {
        // Create a canvas for the nameplate
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        context.font = 'bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create a plane for the nameplate
        const geometry = new THREE.PlaneGeometry(2, 0.5);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const nameplate = new THREE.Mesh(geometry, material);
        nameplate.position.set(0, 2.5, 0);
        nameplate.rotation.x = -Math.PI / 8; // Tilt slightly for better visibility
        
        // Add to the model
        this.currentModel.add(nameplate);
    }
    
    /**
     * Reset the camera to the default position
     */
    resetCamera() {
        this.camera.position.set(0, 2, 5);
        this.controls.target.set(0, 1, 0);
        this.controls.update();
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.visible) {
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Update animations
        if (this.animationMixer) {
            const delta = this.clock.getDelta();
            this.animationMixer.update(delta);
        }
        
        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            try {
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                console.error('EnemyPreview: Error rendering scene:', error);
            }
        } else {
            console.warn('EnemyPreview: Cannot render - missing renderer, scene, or camera');
        }
    }
    
    /**
     * Force restart the animation
     */
    forceRestartAnimation() {
        console.debug('EnemyPreview: Force restarting animation');
        
        // Set visibility to true
        this.visible = true;
        
        // Cancel existing animation frame if any
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Restart animation
        this.animate();
    }
    
    /**
     * Set the size of the preview
     * @param {number} width - The width
     * @param {number} height - The height
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        
        // Update wrapper size
        this.wrapper.style.width = `${width}px`;
        this.wrapper.style.height = `${height}px`;
        
        // Update camera aspect ratio
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        // Update renderer size
        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
        
        console.debug(`EnemyPreview: Size updated to ${width}x${height}`);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        console.debug('EnemyPreview: Disposing resources');
        
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Dispose of Three.js objects
        if (this.controls) {
            this.controls.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove from DOM
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
    }
}