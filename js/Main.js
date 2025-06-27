/**
 * main.js
 * Entry point for the game application
 */

import { Game } from './game/Game.js';
import { DEFAULT_CHARACTER_MODEL } from './config/player-models.js';
import { STORAGE_KEYS } from './config/storage-keys.js';
import * as THREE from 'three';

// Set up console warning filter to suppress specific THREE.js warnings
(function setupConsoleFilter() {
    // Store the original console.warn
    const originalWarn = console.warn;
    
    // Override console.warn to filter out specific THREE.js material warnings
    console.warn = function(...args) {
        // Check if this is the specific THREE.js material warning we want to suppress
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes("THREE.Material: 'roughness' is not a property of THREE.MeshLambertMaterial") ||
             args[0].includes("THREE.Material: 'metalness' is not a property of THREE.MeshLambertMaterial") ||
             args[0].includes("THREE.Material: 'emissive' is not a property of THREE.MeshBasicMaterial") ||
             args[0].includes("THREE.Material: 'emissiveIntensity' is not a property of THREE.MeshBasicMaterial"))) {
            // Suppress this specific warning
            return;
        }
        
        // Pass other warnings to the original console.warn
        return originalWarn.apply(console, args);
    };
    
    // Store the original error method
    const originalError = console.error;
    
    // Override console.error to catch and handle specific shader errors
    console.error = function(...args) {
        // Check if this is a shader-related error we want to handle
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes("Cannot set properties of undefined (setting 'value')") ||
             args[0].includes("WebGL: INVALID_OPERATION: uniform") ||
             args[0].includes("WebGL: INVALID_VALUE: uniformMatrix") ||
             args[0].includes("WebGL: INVALID_OPERATION: uniformMatrix"))) {
            
            console.warn("Caught WebGL shader error:", args[0]);
            // Return without crashing
            return;
        }
        
        // Pass other errors to the original console.error
        return originalError.apply(console, args);
    };
    
    // Since we can't patch THREE geometry constructors directly in ES6 modules,
    // we'll rely on robust validation at the factory level and add a utility function
    window.createSafeCylinderGeometry = function(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength) {
        // Validate parameters to prevent NaN
        const validatedRadiusTop = (typeof radiusTop === 'number' && !isNaN(radiusTop) && radiusTop >= 0) ? radiusTop : 1;
        const validatedRadiusBottom = (typeof radiusBottom === 'number' && !isNaN(radiusBottom) && radiusBottom >= 0) ? radiusBottom : 1;
        const validatedHeight = (typeof height === 'number' && !isNaN(height) && height > 0) ? height : 1;
        const validatedRadialSegments = (typeof radialSegments === 'number' && !isNaN(radialSegments) && radialSegments >= 3) ? radialSegments : 8;
        const validatedHeightSegments = (typeof heightSegments === 'number' && !isNaN(heightSegments) && heightSegments >= 1) ? heightSegments : 1;
        
        // Log if we had to correct any values
        if (radiusTop !== validatedRadiusTop || radiusBottom !== validatedRadiusBottom || height !== validatedHeight || 
            radialSegments !== validatedRadialSegments || heightSegments !== validatedHeightSegments) {
            console.warn('CylinderGeometry: Invalid parameters detected and corrected', {
                original: { radiusTop, radiusBottom, height, radialSegments, heightSegments },
                corrected: { 
                    radiusTop: validatedRadiusTop, 
                    radiusBottom: validatedRadiusBottom, 
                    height: validatedHeight, 
                    radialSegments: validatedRadialSegments, 
                    heightSegments: validatedHeightSegments 
                }
            });
        }
        
        return new THREE.CylinderGeometry(
            validatedRadiusTop, 
            validatedRadiusBottom, 
            validatedHeight, 
            validatedRadialSegments, 
            validatedHeightSegments, 
            openEnded, 
            thetaStart, 
            thetaLength
        );
    };
    
    // Add a more comprehensive safe geometry creator that can handle all cases
    window.SafeGeometry = {
        createCylinder: function(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength) {
            return window.createSafeCylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);
        },
        createTorus: function(radius, tube, radialSegments, tubularSegments, arc) {
            return window.createSafeTorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
        }
    };
    
    window.createSafeTorusGeometry = function(radius, tube, radialSegments, tubularSegments, arc) {
        // Validate parameters to prevent NaN
        const validatedRadius = (typeof radius === 'number' && !isNaN(radius) && radius > 0) ? radius : 1;
        const validatedTube = (typeof tube === 'number' && !isNaN(tube) && tube > 0) ? tube : 0.4;
        const validatedRadialSegments = (typeof radialSegments === 'number' && !isNaN(radialSegments) && radialSegments >= 3) ? radialSegments : 12;
        const validatedTubularSegments = (typeof tubularSegments === 'number' && !isNaN(tubularSegments) && tubularSegments >= 3) ? tubularSegments : 48;
        const validatedArc = (typeof arc === 'number' && !isNaN(arc) && arc > 0) ? arc : Math.PI * 2;
        
        // Log if we had to correct any values
        if (radius !== validatedRadius || tube !== validatedTube || radialSegments !== validatedRadialSegments || tubularSegments !== validatedTubularSegments) {
            console.warn('TorusGeometry: Invalid parameters detected and corrected', {
                original: { radius, tube, radialSegments, tubularSegments, arc },
                corrected: { 
                    radius: validatedRadius, 
                    tube: validatedTube, 
                    radialSegments: validatedRadialSegments, 
                    tubularSegments: validatedTubularSegments, 
                    arc: validatedArc 
                }
            });
        }
        
        return new THREE.TorusGeometry(
            validatedRadius, 
            validatedTube, 
            validatedRadialSegments, 
            validatedTubularSegments, 
            validatedArc
        );
    };
    
    // Patch THREE.BufferGeometry.prototype.computeBoundingSphere to handle NaN values
    try {
        const originalComputeBoundingSphere = THREE.BufferGeometry.prototype.computeBoundingSphere;
        THREE.BufferGeometry.prototype.computeBoundingSphere = function() {
            try {
                // Check for position attribute
                const position = this.attributes.position;
                if (position && position.array) {
                    // Check for NaN values in position array
                    const hasNaN = Array.from(position.array).some(val => isNaN(val));
                    if (hasNaN) {
                        console.error('BufferGeometry.computeBoundingSphere(): Position attribute contains NaN values', {
                            geometry: this,
                            position: position.array
                        });
                        
                        // Create a default bounding sphere instead of failing
                        this.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
                        return;
                    }
                }
                
                // Call original method if no NaN values detected
                return originalComputeBoundingSphere.call(this);
            } catch (error) {
                console.error('Error in computeBoundingSphere, using default:', error);
                // Fallback to default bounding sphere
                this.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);
            }
        };
    } catch (e) {
        console.warn('Could not patch BufferGeometry.computeBoundingSphere, using factory-level validation only:', e);
    }
    
    // Patch THREE.CylinderGeometry constructor to catch NaN values globally
    try {
        const originalCylinderGeometry = THREE.CylinderGeometry;
        
        // Create a wrapper class that extends the original
        class PatchedCylinderGeometry extends originalCylinderGeometry {
            constructor(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength) {
                // Validate parameters to prevent NaN
                const validatedRadiusTop = (typeof radiusTop === 'number' && !isNaN(radiusTop) && radiusTop >= 0) ? radiusTop : 1;
                const validatedRadiusBottom = (typeof radiusBottom === 'number' && !isNaN(radiusBottom) && radiusBottom >= 0) ? radiusBottom : 1;
                const validatedHeight = (typeof height === 'number' && !isNaN(height) && height > 0) ? height : 1;
                const validatedRadialSegments = (typeof radialSegments === 'number' && !isNaN(radialSegments) && radialSegments >= 3) ? radialSegments : 8;
                const validatedHeightSegments = (typeof heightSegments === 'number' && !isNaN(heightSegments) && heightSegments >= 1) ? heightSegments : 1;
                
                // Log if we had to correct any values
                if (radiusTop !== validatedRadiusTop || radiusBottom !== validatedRadiusBottom || height !== validatedHeight || 
                    radialSegments !== validatedRadialSegments || heightSegments !== validatedHeightSegments) {
                    console.warn('THREE.CylinderGeometry: Invalid parameters detected and corrected', {
                        original: { radiusTop, radiusBottom, height, radialSegments, heightSegments },
                        corrected: { 
                            radiusTop: validatedRadiusTop, 
                            radiusBottom: validatedRadiusBottom, 
                            height: validatedHeight, 
                            radialSegments: validatedRadialSegments, 
                            heightSegments: validatedHeightSegments 
                        }
                    });
                }
                
                super(
                    validatedRadiusTop, 
                    validatedRadiusBottom, 
                    validatedHeight, 
                    validatedRadialSegments, 
                    validatedHeightSegments, 
                    openEnded, 
                    thetaStart, 
                    thetaLength
                );
            }
        }
        
        // Try to replace the CylinderGeometry using Object.defineProperty
        try {
            Object.defineProperty(THREE, 'CylinderGeometry', {
                value: PatchedCylinderGeometry,
                writable: false,
                enumerable: true,
                configurable: true
            });
            console.debug('Successfully patched THREE.CylinderGeometry constructor for NaN protection');
        } catch (defineError) {
            // If we can't override, create a global alternative
            window.SafeCylinderGeometry = PatchedCylinderGeometry;
            console.warn('Could not override THREE.CylinderGeometry, created window.SafeCylinderGeometry instead:', defineError);
        }
        
    } catch (e) {
        console.warn('Could not patch THREE.CylinderGeometry constructor:', e);
    }
    
    // Patch THREE.TorusGeometry constructor to catch NaN values globally
    try {
        const originalTorusGeometry = THREE.TorusGeometry;
        
        // Create a wrapper class that extends the original
        class PatchedTorusGeometry extends originalTorusGeometry {
            constructor(radius, tube, radialSegments, tubularSegments, arc) {
                // Validate parameters to prevent NaN
                const validatedRadius = (typeof radius === 'number' && !isNaN(radius) && radius > 0) ? radius : 1;
                const validatedTube = (typeof tube === 'number' && !isNaN(tube) && tube > 0) ? tube : 0.4;
                const validatedRadialSegments = (typeof radialSegments === 'number' && !isNaN(radialSegments) && radialSegments >= 3) ? radialSegments : 12;
                const validatedTubularSegments = (typeof tubularSegments === 'number' && !isNaN(tubularSegments) && tubularSegments >= 3) ? tubularSegments : 48;
                const validatedArc = (typeof arc === 'number' && !isNaN(arc) && arc > 0) ? arc : Math.PI * 2;
                
                // Log if we had to correct any values
                if (radius !== validatedRadius || tube !== validatedTube || radialSegments !== validatedRadialSegments || 
                    tubularSegments !== validatedTubularSegments || arc !== validatedArc) {
                    console.warn('THREE.TorusGeometry: Invalid parameters detected and corrected', {
                        original: { radius, tube, radialSegments, tubularSegments, arc },
                        corrected: { 
                            radius: validatedRadius, 
                            tube: validatedTube, 
                            radialSegments: validatedRadialSegments, 
                            tubularSegments: validatedTubularSegments, 
                            arc: validatedArc 
                        }
                    });
                }
                
                super(
                    validatedRadius, 
                    validatedTube, 
                    validatedRadialSegments, 
                    validatedTubularSegments, 
                    validatedArc
                );
            }
        }
        
        // Try to replace the TorusGeometry using Object.defineProperty
        try {
            Object.defineProperty(THREE, 'TorusGeometry', {
                value: PatchedTorusGeometry,
                writable: false,
                enumerable: true,
                configurable: true
            });
            console.debug('Successfully patched THREE.TorusGeometry constructor for NaN protection');
        } catch (defineError) {
            // If we can't override, create a global alternative
            window.SafeTorusGeometry = PatchedTorusGeometry;
            console.warn('Could not override THREE.TorusGeometry, created window.SafeTorusGeometry instead:', defineError);
        }
        
    } catch (e) {
        console.warn('Could not patch THREE.TorusGeometry constructor:', e);
    }
    
    // Patch THREE.SphereGeometry constructor to catch NaN values globally
    try {
        const originalSphereGeometry = THREE.SphereGeometry;
        
        // Create a wrapper class that extends the original
        class PatchedSphereGeometry extends originalSphereGeometry {
            constructor(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {
                // Validate parameters to prevent NaN
                const validatedRadius = (typeof radius === 'number' && !isNaN(radius) && radius > 0) ? radius : 1;
                const validatedWidthSegments = (typeof widthSegments === 'number' && !isNaN(widthSegments) && widthSegments >= 3) ? widthSegments : 32;
                const validatedHeightSegments = (typeof heightSegments === 'number' && !isNaN(heightSegments) && heightSegments >= 2) ? heightSegments : 16;
                const validatedPhiStart = (typeof phiStart === 'number' && !isNaN(phiStart)) ? phiStart : 0;
                const validatedPhiLength = (typeof phiLength === 'number' && !isNaN(phiLength) && phiLength > 0) ? phiLength : Math.PI * 2;
                const validatedThetaStart = (typeof thetaStart === 'number' && !isNaN(thetaStart)) ? thetaStart : 0;
                const validatedThetaLength = (typeof thetaLength === 'number' && !isNaN(thetaLength) && thetaLength > 0) ? thetaLength : Math.PI;
                
                // Log if we had to correct any values
                if (radius !== validatedRadius || widthSegments !== validatedWidthSegments || heightSegments !== validatedHeightSegments) {
                    console.warn('THREE.SphereGeometry: Invalid parameters detected and corrected', {
                        original: { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength },
                        corrected: { 
                            radius: validatedRadius, 
                            widthSegments: validatedWidthSegments, 
                            heightSegments: validatedHeightSegments,
                            phiStart: validatedPhiStart,
                            phiLength: validatedPhiLength,
                            thetaStart: validatedThetaStart,
                            thetaLength: validatedThetaLength
                        }
                    });
                }
                
                super(
                    validatedRadius, 
                    validatedWidthSegments, 
                    validatedHeightSegments, 
                    validatedPhiStart, 
                    validatedPhiLength, 
                    validatedThetaStart, 
                    validatedThetaLength
                );
            }
        }
        
        // Try to replace the SphereGeometry using Object.defineProperty
        try {
            Object.defineProperty(THREE, 'SphereGeometry', {
                value: PatchedSphereGeometry,
                writable: false,
                enumerable: true,
                configurable: true
            });
            console.debug('Successfully patched THREE.SphereGeometry constructor for NaN protection');
        } catch (defineError) {
            // If we can't override, create a global alternative
            window.SafeSphereGeometry = PatchedSphereGeometry;
            console.warn('Could not override THREE.SphereGeometry, created window.SafeSphereGeometry instead:', defineError);
        }
        
    } catch (e) {
        console.warn('Could not patch THREE.SphereGeometry constructor:', e);
    }

    // Patch THREE.WebGLRenderer.prototype.render to catch shader errors
    try {
        const originalRender = THREE.WebGLRenderer.prototype.render;
        THREE.WebGLRenderer.prototype.render = function(scene, camera) {
            try {
                // Check WebGL context before rendering
                const gl = this.getContext();
                if (!gl || gl.isContextLost()) {
                    console.warn("WebGL context lost, skipping render");
                    return;
                }
                
                return originalRender.call(this, scene, camera);
            } catch (error) {
                if (error.message && (
                    error.message.includes("Cannot set properties of undefined (setting 'value')") ||
                    error.message.includes("Cannot read properties of undefined") ||
                    error.message.includes("WebGL: INVALID_OPERATION") ||
                    error.message.includes("uniform") ||
                    error.message.includes("getUniformLocation")
                )) {
                    console.warn("Caught WebGL render error:", error.message);
                    
                    // Try to reset WebGL state
                    try {
                        if (this.state) {
                            this.state.reset();
                        }
                    } catch (resetError) {
                        console.warn("Failed to reset WebGL state:", resetError.message);
                    }
                    
                    // Continue without crashing
                    return;
                }
                throw error; // Re-throw other errors
            }
        };
    } catch (e) {
        console.warn('Could not patch WebGLRenderer.render, using default error handling:', e);
    }
})();

/**
 * Main class responsible for initializing and managing the game startup process
 */
class Main {
    /**
     * Initialize the Main class
     */
    constructor() {
        // Default configuration for character model
        // Check if logs are enabled, default to false for better performance
        if (localStorage.getItem(STORAGE_KEYS.LOG_ENABLED) !== 'true') {
            console.debug = () => {};
            console.log = () => {};
            // Note: console.warn is already filtered by the setupConsoleFilter function
        }
        window.selectedModelId = DEFAULT_CHARACTER_MODEL;
        window.selectedSizeMultiplier = 1.0;
        
        // Bind methods to ensure correct 'this' context
        this.initializeGame = this.initializeGame.bind(this);
    }
    
    /**
     * Initialize the game and create the game instance
     */
    async initializeGame() {
        console.debug("Initializing game...");
        
        try {
            // Create game instance and make it globally accessible
            const game = new Game();
            window.game = game;
            
            this.completeGameAssetsLoad();
            this.showLoadingScreen();
            // Initialize the game (loads resources but keeps game paused)
            await game.init();
            console.debug("Game initialized successfully");
            
            // Display the main menu
            this.hideLoadingScreen();
            this.showMainMenu(game);
        } catch (error) {
            console.error("Error initializing game:", error);
            this.showErrorMessage(error);
        }
    }
    
    /**
     * Display the main game menu
     * @param {Game} game - The game instance
     */
    showMainMenu(game) {
        console.debug("Checking if we should show game menu or go directly to multiplayer...");
        
        this.hideLoadingScreen();
        
        // Check URL parameters for direct multiplayer join
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('join') === 'true') {
            console.debug("Direct multiplayer join detected, skipping main menu");
            
            // Check if we have a connect-id parameter
            const connectId = urlParams.get('connect-id');
            if (connectId) {
                console.debug("Direct connection ID found:", connectId);
                
                // Wait a short moment for game systems to initialize
                setTimeout(() => {
                    // If the game has a multiplayer manager, connect directly
                    if (game.multiplayerManager) {
                        console.debug("Directly connecting to game with ID:", connectId);
                        
                        // Join the game directly without showing the host/join screen
                        game.multiplayerManager.joinGame(connectId);
                    } else {
                        console.error("MultiplayerManager not available, falling back to UI flow");
                        // Fallback to clicking the multiplayer button
                        const multiplayerButton = document.getElementById('multiplayer-button');
                        if (multiplayerButton) {
                            multiplayerButton.click();
                        } else {
                            this.showRegularMainMenu(game);
                        }
                    }
                }, 500); // Short delay to ensure game systems are ready
            } else {
                // No connect-id, just open the multiplayer UI
                console.debug("No connection ID found, opening multiplayer UI");
                const multiplayerButton = document.getElementById('multiplayer-button');
                if (multiplayerButton) {
                    console.debug("Automatically opening multiplayer UI");
                    multiplayerButton.click();
                } else {
                    console.error("Multiplayer button not found, falling back to main menu");
                    this.showRegularMainMenu(game);
                }
            }
        } else {
            // Show regular main menu
            this.showRegularMainMenu(game);
        }
    }
    
    /**
     * Display the regular main menu
     * @param {Game} game - The game instance
     */
    showRegularMainMenu(game) {
        console.debug("Displaying regular game menu...");
        
        // Use the menu manager if available
        if (game.menuManager) {
            game.menuManager.showMenu('gameMenu');
        } else {
            // Fallback to direct creation if menu manager is not available
            console.error("MenuManager not available, creating GameMenu directly");
        }

        // Use a small delay to ensure DOM updates have completed
        setTimeout(() => {
            // Ensure menu is visible
            this.ensureMenuVisibility();
            
            console.debug("Game menu displayed - waiting for user input");
        }, 200);
    }
    
    /**
     * Hide the loading screen
     */
    completeGameAssetsLoad() {
        if (window.simulatedLoadingScreen) {
            window.simulatedLoadingScreen.complete();
            return;
        }
    }

    showLoadingScreen() {
        if (window.simulatedLoadingScreen) {
            window.simulatedLoadingScreen.show();
            return;
        }
    }

    hideLoadingScreen() {
        if (window.simulatedLoadingScreen) {
            window.simulatedLoadingScreen.hide();
            return;
        }
    }
    
    /**
     * Ensure the game menu is visible
     */
    ensureMenuVisibility() {
        const menuElement = document.getElementById('game-menu');
        
        if (!menuElement) {
            console.warn("Game menu element not found");
            return;
        }
        
        // Force the menu to be visible if it's not already
        if (menuElement.style.display !== 'flex') {
            console.debug("Ensuring game menu visibility");
            menuElement.style.display = 'flex';
            
            // Force a repaint
            document.body.offsetHeight;
        }
    }
    
    /**
     * Display error message when game initialization fails
     * @param {Error} error - The error that occurred
     */
    showErrorMessage(error) {
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Create and display error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <h2>Error Loading Game</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()">Retry</button>
        `;
        
        document.body.appendChild(errorContainer);
    }
}

// Create instance of Main class
const gameMain = new Main();

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', gameMain.initializeGame);