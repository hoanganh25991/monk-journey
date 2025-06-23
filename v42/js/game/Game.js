import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WorldManager } from '../world/WorldManager.js';
import { Player } from '../entities/player/Player.js';
import { InputHandler } from '../InputHandler.js';
import { HUDManager } from '../hud-manager/HUDManager.js';
import { EnemyManager } from '../entities/enemies/EnemyManager.js';
import { CollisionManager } from '../CollisionManager.js';
import { QuestManager } from '../QuestManager.js';
import { AudioManager } from '../AudioManager.js';
import { SaveManager } from '../save-manager/SaveManager.js';
// DifficultyManager removed - using DIFFICULTY_SCALING directly
import { PerformanceManager } from '../PerformanceManager.js';
import { EffectsManager } from '../EffectsManager.js';
import { GameState } from './GameState.js';
import { GameEvents } from './GameEvents.js';
import { SceneOptimizer } from './SceneOptimizer.js';
import { LoadingManager } from './LoadingManager.js';
import { RENDER_CONFIG } from '../config/render.js';
import { MenuManager } from '../menu-system/MenuManager.js';
import { isDebugMode } from '../utils/FlagUtils.js';
import { InteractionSystem } from '../interaction/InteractionSystem.js';
import { MultiplayerManager } from '../multiplayer/MultiplayerManager.js';
import { ItemGenerator } from '../entities/items/ItemGenerator.js';
import { ItemDropManager } from '../entities/items/ItemDropManager.js';
import { STORAGE_KEYS } from '../config/storage-keys.js';

/**
 * Main Game class that serves as a facade to the underlying game systems
 * 
 * @class
 * @property {HTMLElement} canvas - The main game canvas element
 * @property {THREE.Clock} clock - Clock used for tracking time and calculating delta time between frames
 * @property {boolean} debugMode - Flag to enable/disable debug logging
 * @property {boolean} animationLoopStarted - Flag to prevent multiple animation loops from starting
 * @property {GameState} state - Manages the game state (running, paused, etc.)
 * @property {GameEvents} events - Event system for game-wide event handling
 * @property {THREE.LoadingManager} loadingManager - Manages asset loading and tracks loading progress
 * @property {HTMLElement} loadingScreen - Reference to the loading screen element in the DOM
 * @property {THREE.WebGLRenderer} renderer - WebGL renderer for the game
 * @property {THREE.Scene} scene - The main 3D scene containing all game objects
 * @property {THREE.PerspectiveCamera} camera - The main camera used for rendering the scene
 * @property {OrbitControls} controls - Camera controls for development/debugging purposes
 * @property {PerformanceManager} performanceManager - Manages performance optimizations and settings
 * @property {WorldManager} world - Manages the game world, terrain, and environment
 * @property {Player} player - The player character with model, animations, and controls
 * @property {InputHandler} inputHandler - Handles user input (keyboard, mouse, touch)
 * @property {EffectsManager} effectsManager - Manages visual effects, particles, and skill effects
 * @property {HUDManager} hudManager - Manages the heads-up display and UI elements
 * @property {EnemyManager} enemyManager - Manages enemy spawning, AI, and behavior
 * @property {CollisionManager} collisionManager - Handles collision detection between game objects
 * @property {InteractionSystem} interactionSystem - Manages interactions between the player and the world
 * @property {QuestManager} questManager - Manages game quests and objectives
 * @property {AudioManager} audioManager - Manages sound effects and music
 * @property {SaveManager} saveManager - Handles saving and loading game state
 * @property {string} difficulty - Current game difficulty setting
 * @property {MenuManager} menuManager - Manages game menus and UI screens
 * @property {number} _lastMemoryLog - Timestamp of the last memory usage log
 */
export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.clock = new THREE.Clock();
        this.debugMode = false; // Set to true to enable debug logging
        
        // Flag to prevent multiple animation loops
        this.animationLoopStarted = false;
        
        // Initialize sub-systems
        this.state = new GameState();
        this.events = new GameEvents();
        this.loadingManager = new LoadingManager().getManager();
        this.itemGenerator = new ItemGenerator(this);
        
        // Load difficulty from localStorage or use 'medium' as default
        this.difficulty = localStorage.getItem(STORAGE_KEYS.DIFFICULTY) || 'medium';
        console.debug(`Game initialized with difficulty: ${this.difficulty}`);
    }
    
    /**
     * Add an event listener
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     */
    addEventListener(event, callback) {
        this.events.addEventListener(event, callback);
    }
    
    /**
     * Remove an event listener
     * @param {string} event - The event name
     * @param {Function} callback - The callback function to remove
     */
    removeEventListener(event, callback) {
        this.events.removeEventListener(event, callback);
    }
    
    /**
     * Check if the game is currently paused
     * @returns {boolean} True if the game is paused
     */
    get isPaused() {
        return this.state.isPaused();
    }
    
    /**
     * Check if the game is currently running
     * @returns {boolean} True if the game is running
     */
    get isRunning() {
        return this.state.isRunning();
    }
    
    /**
     * Check if the game has been started at least once
     * @returns {boolean} True if the game has been started
     */
    get hasStarted() {
        return this.state.hasStarted();
    }
    
    /**
     * Initialize the game
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async init() {
        try {
            // Get reference to loading screen if available
            this.loadingScreen = document.getElementById('loading-screen');
            
            // Update loading progress
            this.updateLoadingProgress(5, 'Initializing renderer...', 'Setting up WebGL');
            
            // Initialize renderer with quality settings from localStorage or use 'ultra' as default
            const qualityLevel = localStorage.getItem('monk_journey_quality_level') || 'ultra';
            this.renderer = this.createRenderer(qualityLevel);
            
            this.updateLoadingProgress(10, 'Creating game world...', 'Setting up scene');
            
            // Initialize scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x5a6d7e); // Darker blue-gray sky color
            // Fog will be managed by FogManager
            
            // Initialize item drop manager
            this.itemDropManager = new ItemDropManager(this.scene, this);
            
            // Initialize camera
            this.camera = new THREE.PerspectiveCamera(
                75, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                1000
            );
            this.camera.position.set(0, 10, 20);
            
            // Initialize orbit controls (for development)
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent camera from going below ground
            
            this.updateLoadingProgress(15, 'Optimizing performance...', 'Initializing performance manager');
            
            // Initialize performance manager (before other systems)
            this.performanceManager = new PerformanceManager(this);
            this.performanceManager.init();
            
            this.updateLoadingProgress(20, 'Building world...', 'Generating terrain and environment');
            
            // Initialize world
            this.world = new WorldManager(this.scene, this.loadingManager, this);
            await this.world.init();
            
            this.updateLoadingProgress(40, 'Loading character...', 'Preparing player model and animations');
            
            // Initialize player
            this.player = new Player(this, this.scene, this.camera, this.loadingManager);
            await this.player.init();
            
            this.updateLoadingProgress(60, 'Setting up controls...', 'Initializing input handler');
            
            // Initialize input handler
            this.inputHandler = new InputHandler(this);
            
            this.updateLoadingProgress(65, 'Creating user interface...', 'Building HUD elements');
            
            // Initialize Effects Manager
            this.updateLoadingProgress(67, 'Loading effects...', 'Preloading skill effects and models');
            this.effectsManager = new EffectsManager(this);
            await this.effectsManager.init();
            
            // Initialize UI manager
            this.hudManager = new HUDManager(this);
            await this.hudManager.init();
            
            this.updateLoadingProgress(75, 'Spawning enemies...', 'Initializing enemy AI and models');
            
            // Initialize enemy manager
            this.enemyManager = new EnemyManager(this.scene, this.player, this.loadingManager, this, this.itemDropManager);
            await this.enemyManager.init();
            
            this.updateLoadingProgress(80, 'Setting up physics...', 'Initializing collision detection');
            
            // Initialize collision manager
            this.collisionManager = new CollisionManager(this.player, this.enemyManager, this.world);
            
            // Initialize interaction system
            this.updateLoadingProgress(83, 'Setting up interaction system...', 'Unifying interaction methods');
            this.interactionSystem = new InteractionSystem(this);
            
            this.updateLoadingProgress(85, 'Loading quests...', 'Initializing quest system');
            
            // Initialize quest manager
            this.questManager = new QuestManager(this);
            
            this.updateLoadingProgress(90, 'Loading audio...', 'Initializing sound effects and music');
            
            // Initialize audio manager
            this.audioManager = new AudioManager(this);
            await this.audioManager.init();
            
            this.updateLoadingProgress(95, 'Setting up save system...', 'Initializing game save functionality');
            
            // Initialize save manager
            this.saveManager = new SaveManager(this);
            await this.saveManager.init();
            
            this.updateLoadingProgress(98, 'Applying difficulty settings...', 'Finalizing game setup');
            
            // Initialize menu manager
            this.updateLoadingProgress(99, 'Initializing menu system...', 'Setting up game menus');
            this.menuManager = new MenuManager(this);
            
            // Initialize multiplayer manager
            this.updateLoadingProgress(99.5, 'Setting up multiplayer...', 'Initializing WebRTC connections');
            this.multiplayerManager = new MultiplayerManager(this);
            await this.multiplayerManager.init();

            // Set initial difficulty
            this.enemyManager.setDifficulty(this.difficulty);

            this.updateLoadingProgress(100, 'Game ready!', 'Initialization complete');
            
            // Apply performance optimizations to the scene
            SceneOptimizer.optimizeScene(this.scene);
            
            // Set up event listeners
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('Error initializing game:', error);
            this.updateLoadingProgress(0, 'Error initializing game', error.message);
            return false;
        }
    }
    
    /**
     * Update loading progress in the loading screen
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} status - Status message
     * @param {string} detail - Detailed information
     */
    updateLoadingProgress(percent, status, detail) {
        // Update loading bar
        const loadingBar = document.getElementById('loading-bar');
        if (loadingBar) {
            loadingBar.style.width = `${percent}%`;
        }
        
        // Update loading text
        const loadingText = document.getElementById('loading-text');
        if (loadingText && status) {
            loadingText.textContent = status;
        }
        
        // Update loading info
        const loadingInfo = document.getElementById('loading-info');
        if (loadingInfo && detail) {
            loadingInfo.textContent = detail;
        }
        
        // Log progress to console
        console.debug(`Loading progress: ${percent}% - ${status} - ${detail}`);
    }
    
    /**
     * Set up event listeners for window and document events
     */
    setupEventListeners() {
        if (isDebugMode()) {
            console.debug('Event listeners for PWA features are disabled in debug mode.');
            return;
        }
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Handle visibility change events
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());
        
        // Handle mobile-specific events
        window.addEventListener('pagehide', () => this.onPageHide());
        window.addEventListener('pageshow', () => this.onPageShow());
        
        // Handle blur/focus events (additional fallback for some browsers)
        window.addEventListener('blur', () => this.onBlur());
        window.addEventListener('focus', () => this.onFocus());
    }
    
    /**
     * Request fullscreen mode for the game canvas
     * @returns {Promise} A promise that resolves when fullscreen is entered or rejects if there's an error
     */
    requestFullscreen() {
        if (isDebugMode()) {
            console.debug('Fullscreen request is ignored in debug mode.');
            return Promise.resolve();
        }
        console.debug("Requesting fullscreen mode...");
        
        // Set a flag to prevent pause on visibility change
        window.isFullscreenChange = true;
        
        // Different browsers have different fullscreen APIs
        const element = document.documentElement; // Use the entire document for fullscreen
        
        // Create a promise to handle fullscreen request
        const fullscreenPromise = new Promise((resolve, reject) => {
            try {
                // Add event listener for fullscreen change
                const fullscreenChangeHandler = () => {
                    // Remove the event listener after it's triggered
                    document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
                    document.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler);
                    document.removeEventListener('mozfullscreenchange', fullscreenChangeHandler);
                    document.removeEventListener('MSFullscreenChange', fullscreenChangeHandler);
                    
                    // Reset the flag after a short delay
                    setTimeout(() => {
                        window.isFullscreenChange = false;
                    }, 100);
                    
                    // Adjust renderer size to match new dimensions
                    if (this.isFullscreen()) {
                        this.adjustRendererSize();
                        resolve();
                    } else {
                        reject(new Error("Failed to enter fullscreen mode"));
                    }
                };
                
                // Add event listeners for fullscreen change
                document.addEventListener('fullscreenchange', fullscreenChangeHandler);
                document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
                document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
                document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
                
                // Request fullscreen
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                } else if (element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                } else {
                    console.warn("Fullscreen API not supported in this browser");
                    window.isFullscreenChange = false;
                    resolve(); // Resolve anyway if not supported
                }
            } catch (error) {
                console.error("Error requesting fullscreen:", error);
                window.isFullscreenChange = false;
                reject(error);
            }
        });
        
        return fullscreenPromise;
    }
    
    /**
     * Adjust renderer size to match current window dimensions
     */
    adjustRendererSize() {
        if (this.renderer && this.camera) {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            console.debug(`Adjusting renderer size to ${width}x${height}`);
            
            // Update camera aspect ratio
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            // Update renderer size
            this.renderer.setSize(width, height, true);
            
            // Update pixel ratio for high-DPI displays
            const pixelRatio = window.devicePixelRatio || 1;
            this.renderer.setPixelRatio(pixelRatio);
        }
    }
    
    /**
     * Exit fullscreen mode
     * @returns {Promise} A promise that resolves when fullscreen is exited or rejects if there's an error
     */
    exitFullscreen() {
        console.debug("Exiting fullscreen mode...");
        
        // Set a flag to prevent pause on visibility change
        window.isFullscreenChange = true;
        
        // Create a promise to handle fullscreen exit
        const exitFullscreenPromise = new Promise((resolve, reject) => {
            try {
                // Add event listener for fullscreen change
                const fullscreenChangeHandler = () => {
                    // Remove the event listener after it's triggered
                    document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
                    document.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler);
                    document.removeEventListener('mozfullscreenchange', fullscreenChangeHandler);
                    document.removeEventListener('MSFullscreenChange', fullscreenChangeHandler);
                    
                    // Reset the flag after a short delay
                    setTimeout(() => {
                        window.isFullscreenChange = false;
                    }, 100);
                    
                    // Adjust renderer size to match new dimensions
                    this.adjustRendererSize();
                    resolve();
                };
                
                // Add event listeners for fullscreen change
                document.addEventListener('fullscreenchange', fullscreenChangeHandler);
                document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
                document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
                document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
                
                // Exit fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                } else {
                    console.warn("Fullscreen API not supported in this browser");
                    window.isFullscreenChange = false;
                    resolve(); // Resolve anyway if not supported
                }
            } catch (error) {
                console.error("Error exiting fullscreen:", error);
                window.isFullscreenChange = false;
                reject(error);
            }
        });
        
        return exitFullscreenPromise;
    }
    
    /**
     * Check if the game is currently in fullscreen mode
     * @returns {boolean} True if the game is in fullscreen mode
     */
    isFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }
    
    /**
     * Toggle fullscreen mode
     * @returns {Promise} A promise that resolves when the fullscreen state has been toggled
     */
    toggleFullscreen() {
        if (this.isFullscreen()) {
            return this.exitFullscreen();
        } else {
            return this.requestFullscreen();
        }
    }
    
    /**
     * Start the game
     * @param {boolean} isLoadedGame - Whether this is a loaded game or a new game
     */
    start(isLoadedGame = false) {
        console.debug("Game starting...");
        
        // Make sure the canvas is visible
        this.canvas.style.display = 'block';
        
        // Adjust renderer size before entering fullscreen
        this.adjustRendererSize();
        
        // Reset camera position if needed
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Disable orbit controls when game starts
        // this.controls.enabled = false;
        
        // Only reset player position if this is a new game, not a loaded game
        if (!isLoadedGame) {
            console.debug("Starting new game - resetting player position to default");
            this.player.setPosition(0, 1, -13);
        } else {
            console.debug("Starting loaded game - keeping saved player position");
        }
        
        // Start the game loop
        this.state.setRunning();
        this.clock.start();
        
        // Start the animation loop
        this.animate();
        
        // Start background music
        this.audioManager.playMusic();
        
        // Request fullscreen mode after game is started
        this.requestFullscreen().catch(error => {
            console.warn("Could not enter fullscreen mode:", error);
            // Even if fullscreen fails, make sure the renderer is properly sized
            this.adjustRendererSize();
        });
        
        // Dispatch event that game has started
        this.events.dispatch('gameStateChanged', 'running');
        
        console.debug("Game started successfully");
    }
    
    /**
     * Pause the game
     * Properly pauses all game systems including physics, animations, and timers
     */
    pause(emitEvent = true) {
        console.debug("Pausing game...");
        
        // Set game state to paused
        this.state.setPaused();
        
        // Pause the clock to stop delta time accumulation
        this.clock.stop();
        
        // Pause audio
        if (this.audioManager) {
            this.audioManager.pause();
        }
        
        // Pause player animations
        if (this.player && this.player.model && this.player.model.mixer) {
            this.player.model.mixer.timeScale = 0;
        }
        
        // Pause all enemy animations
        if (this.enemyManager) {
            this.enemyManager.pause();
        }
        
        // Pause particle effects
        if (this.effectsManager) {
            this.effectsManager.pause();
        }
        
        // Dispatch event that game has been paused
        emitEvent && this.events.dispatch('gameStateChanged', 'paused');
        
        console.debug("Game paused successfully");
    }
    
    /**
     * Resume the game
     * Properly resumes all game systems that were paused
     */
    resume(emitEvent = true) {
        console.debug("Resuming game...");
        
        // Set game state to running
        this.state.setRunning();
        
        // Resume the clock to continue delta time calculation
        this.clock.start();
        
        // Resume audio
        if (this.audioManager) {
            this.audioManager.resume();
        }
        
        // Resume player animations
        if (this.player && this.player.model && this.player.model.mixer) {
            this.player.model.mixer.timeScale = 1;
        }
        
        // Resume all enemy animations
        if (this.enemyManager) {
            this.enemyManager.resume();
        }
        
        // Resume particle effects
        if (this.effectsManager) {
            this.effectsManager.resume();
        }
        
        // Dispatch event that game has been resumed
        emitEvent && this.events.dispatch('gameStateChanged', 'running');
        
        console.debug("Game resumed successfully");
    }
    
    /**
     * Game animation loop
     */
    animate() {
        // Always continue the animation loop regardless of pause state
        requestAnimationFrame(() => this.animate());
        
        // Log memory usage every 5 seconds for debugging
        const now = Date.now();
        if (!this._lastMemoryLog || now - this._lastMemoryLog > 5000) {
            if (window.performance && window.performance.memory) {
                const memoryInfo = window.performance.memory;
                console.debug(`Memory usage: ${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB / ${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB`);
            }
            this._lastMemoryLog = now;
        }
        
        const delta = this.clock.getDelta();
        
        // Update performance manager first
        this.performanceManager.update(delta);
        
        // Update controls (only if enabled)
        if (this.controls.enabled) {
            this.controls.update();
        }
        
        // If game is paused, only render the scene but don't update game logic
        if (this.state.isPaused()) {
            // Just render the scene
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        // Update input handler for continuous skill casting
        this.inputHandler.update(delta);
        
        // Update player
        this.player.update(delta);
        
        // Update world based on player position
        // Use performance-based draw distance
        const drawDistance = this.performanceManager.getDrawDistanceMultiplier();
        this.world.updateWorldForPlayer(this.player.getPosition(), drawDistance);
        
        // Update enemies
        this.enemyManager.update(delta);
        
        // Update item drops
        if (this.itemDropManager) {
            this.itemDropManager.update(delta);
        }
        
        // Check collisions
        this.collisionManager.update();
        
        // Update interaction system
        if (this.interactionSystem) {
            this.interactionSystem.update(delta);
        }
        
        // Update UI
        this.hudManager.update(delta);
        
        // Update effects
        this.effectsManager.update(delta);
        
        // Update multiplayer
        if (this.multiplayerManager) {
            this.multiplayerManager.update(delta);
        }
        
        // Render scene with potential optimizations
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Handle window resize event
     */
    onWindowResize() {
        // Check if this is triggered by a fullscreen change
        if (window.isFullscreenChange) {
            console.debug('Handling resize as part of fullscreen change');
            return; // The fullscreen handlers will take care of resizing
        }
        
        // For normal window resizing, adjust the renderer size
        this.adjustRendererSize();
    }

    /**
     * Handle visibility change event
     */
    onVisibilityChange() {
        // Check if this is triggered by a fullscreen change
        if (window.isFullscreenChange) {
            console.debug('Ignoring visibility change due to fullscreen toggle');
            return;
        }
        
        this.pause();
        // if (document.visibilityState === 'hidden') {
        //     console.debug('The page is now hidden.');
        //     this.pause();
        // } else if (document.visibilityState === 'visible') {
        //     console.debug('The page is now visible.');
        //     this.resume();
        // }
    }

    /**
     * Handle page hide event (for mobile browsers)
     */
    onPageHide() {
        // Check if this is triggered by a fullscreen change
        if (window.isFullscreenChange) {
            console.debug('Ignoring page hide event due to fullscreen toggle');
            return;
        }
        this.pause();
    }
    
    /**
     * Handle page show event (for mobile browsers)
     */
    onPageShow() {
        // Check if this is triggered by a fullscreen change
        if (window.isFullscreenChange) {
            console.debug('Ignoring page show event due to fullscreen toggle');
            return;
        }
        this.pause();
        // this.resume();
    }
    
    /**
     * Handle window blur event
     */
    onBlur() {
        // Check if this is triggered by a fullscreen change
        if (window.isFullscreenChange) {
            console.debug('Ignoring blur event due to fullscreen toggle');
            return;
        }
        this.pause();
    }
    
    /**
     * Handle window focus event
     */
    onFocus() {
        // Check if this is triggered by a fullscreen change
        if (window.isFullscreenChange) {
            console.debug('Ignoring focus event due to fullscreen toggle');
            return;
        }
        this.pause();
        // this.resume();
    }
    
    /**
     * Create a WebGLRenderer with settings for the specified quality level
     * @param {string} qualityLevel - The quality level to use
     * @returns {THREE.WebGLRenderer} The configured renderer
     */
    createRenderer(qualityLevel) {
        if (!RENDER_CONFIG[qualityLevel]) {
            console.error(`Unknown quality level: ${qualityLevel}, falling back to medium`);
            qualityLevel = 'ultra';
        }
        
        const config = RENDER_CONFIG[qualityLevel].init;
        
        // Create renderer with the specified configuration
        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: config.antialias,
            powerPreference: config.powerPreference,
            precision: config.precision,
            stencil: config.stencil,
            logarithmicDepthBuffer: config.logarithmicDepthBuffer,
            depth: config.depth,
            alpha: config.alpha
        });
        
        // Apply additional settings
        this.applyRendererSettings(renderer, qualityLevel);
        
        // Set size (this is common for all quality levels)
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        return renderer;
    }
    
    /**
     * Apply renderer settings based on quality level
     * @param {THREE.WebGLRenderer} renderer - The Three.js renderer
     * @param {string} qualityLevel - The quality level to apply
     */
    applyRendererSettings(renderer, qualityLevel) {
        if (!RENDER_CONFIG[qualityLevel]) {
            console.error(`Unknown quality level: ${qualityLevel}`);
            return;
        }
        
        const settings = RENDER_CONFIG[qualityLevel].settings;
        
        // Apply settings
        renderer.setPixelRatio(settings.pixelRatio);
        renderer.shadowMap.enabled = settings.shadowMapEnabled;
        
        // Apply shadow map type
        switch (settings.shadowMapType) {
            case 'PCFSoftShadowMap':
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
            case 'PCFShadowMap':
                renderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            case 'BasicShadowMap':
                renderer.shadowMap.type = THREE.BasicShadowMap;
                break;
            default:
                renderer.shadowMap.type = THREE.PCFShadowMap;
        }
        
        // Apply color space
        switch (settings.outputColorSpace) {
            case 'SRGBColorSpace':
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                break;
            case 'LinearSRGBColorSpace':
                renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
                break;
            default:
                renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        
        console.debug(`Applied ${qualityLevel} renderer settings`);
    }
}