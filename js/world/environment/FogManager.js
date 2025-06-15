import * as THREE from 'three';
import { FOG_CONFIG } from '../../config/render.js';

/**
 * Manages fog effects in the game world
 * Provides realistic atmospheric fog that adjusts based on:
 * - Player position
 * - Zone type
 * - Time of day
 * - Weather conditions
 * - Performance settings
 * - Distance-based darkening for far objects
 */
export class FogManager {
    constructor(scene, worldManager, game = null) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.game = game;
        
        // Current fog settings
        this.currentFogColor = new THREE.Color(FOG_CONFIG.color);
        this.currentFogDensity = FOG_CONFIG.density;
        this.targetFogColor = new THREE.Color(FOG_CONFIG.color);
        this.targetFogDensity = FOG_CONFIG.density;
        
        // Distance-based fog settings
        this.distanceFalloff = FOG_CONFIG.distanceFalloff || 1.5;
        this.maxVisibleDistance = FOG_CONFIG.maxVisibleDistance || 150;
        this.darkeningFactor = FOG_CONFIG.darkeningFactor || 0.7;
        
        // Initialize fog based on config
        this.initFog();
        
        // Track player's last position for optimization
        this.lastPlayerPosition = new THREE.Vector3(0, 0, 0);
        this.positionUpdateThreshold = 50; // Increased threshold to reduce updates (was 5)
        
        // For time-based fog effects
        this.timeOfDay = 'day'; // 'day', 'dawn', 'dusk', 'night'
        
        // For weather-based fog effects
        this.currentWeather = 'clear'; // 'clear', 'rain', 'fog', 'storm'
        
        // Performance tracking
        this.qualityLevel = 'ultra';
        this.drawDistanceMultiplier = 1.0;
        
        // Create a distance-based darkening shader if needed
        this.setupDistanceDarkening();
    }
    
    // setGame method removed - game is now passed in constructor
    
    /**
     * Initialize fog based on configuration
     */
    initFog() {
        if (!FOG_CONFIG.enabled) {
            this.scene.fog = null;
            return;
        }
        
        // Create the appropriate fog type
        switch (FOG_CONFIG.type) {
            case 'exp2':
                // Exponential squared fog - best for hiding distant objects
                this.scene.fog = new THREE.FogExp2(
                    FOG_CONFIG.color,
                    FOG_CONFIG.density
                );
                break;
            case 'exp':
                // THREE.js doesn't have exponential fog, so we use FogExp2 with adjusted density
                this.scene.fog = new THREE.FogExp2(
                    FOG_CONFIG.color,
                    FOG_CONFIG.density * 0.7 // Adjust density for exponential fog
                );
                break;
            case 'linear':
                // Linear fog with adjusted near/far values
                this.scene.fog = new THREE.Fog(
                    FOG_CONFIG.color,
                    FOG_CONFIG.near,
                    FOG_CONFIG.far
                );
                break;
            default:
                // Default to exponential squared fog
                this.scene.fog = new THREE.FogExp2(
                    FOG_CONFIG.color,
                    FOG_CONFIG.density
                );
        }
        
        // Apply initial fog color
        this.scene.fog.color.set(FOG_CONFIG.color);
        
        console.debug(`Fog initialized with type: ${FOG_CONFIG.type}, density: ${FOG_CONFIG.density}`);
    }
    
    /**
     * Setup distance-based darkening effect using a scene post-processing shader
     * This creates a gradual darkening effect for distant objects
     */
    setupDistanceDarkening() {
        // Check if the scene already has a background color
        if (!this.scene.background) {
            // Set a default background color that matches the fog
            this.scene.background = new THREE.Color(FOG_CONFIG.color).multiplyScalar(0.5);
        }
        
        // We'll use the scene's background as the "far distance" color
        // This ensures that objects at maximum distance blend with the background
        
        // If the game has a renderer with post-processing capabilities, we could add
        // a custom shader for distance-based darkening. For now, we'll rely on the
        // exponential fog which naturally creates a stronger effect at distance.
        
        // Adjust the scene's background to be darker than the fog color
        // This creates the illusion that objects fade to darkness at distance
        if (this.scene.background instanceof THREE.Color) {
            const bgColor = new THREE.Color(FOG_CONFIG.color).multiplyScalar(this.darkeningFactor);
            this.scene.background.copy(bgColor);
        }
    }
    
    /**
     * Update fog based on player position, zone, time of day, and performance settings
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Vector3} playerPosition - Current player position
     */
    update(deltaTime, playerPosition) {
        if (!this.scene.fog || !FOG_CONFIG.enabled) {
            return;
        }
        
        // Skip update if player hasn't moved much
        if (playerPosition.distanceTo(this.lastPlayerPosition) < this.positionUpdateThreshold) {
            // Still update fog color and density transitions
            this.updateFogTransitions(deltaTime);
            return;
        }
        
        // Update last player position
        this.lastPlayerPosition.copy(playerPosition);
        
        // Get current zone at player position
        let zone = null;
        if (this.worldManager && this.worldManager.zoneManager) {
            zone = this.worldManager.zoneManager.getZoneAt(playerPosition);
        }
        
        // Get current performance settings
        if (this.game && this.game.performanceManager) {
            this.qualityLevel = this.game.performanceManager.getCurrentQualityLevel();
            this.drawDistanceMultiplier = this.game.performanceManager.getDrawDistanceMultiplier();
        }
        
        // Calculate base fog density based on performance settings
        let baseDensity = FOG_CONFIG.density;
        if (FOG_CONFIG.qualityMultipliers[this.qualityLevel]) {
            baseDensity *= FOG_CONFIG.qualityMultipliers[this.qualityLevel];
        }
        
        // Adjust density based on draw distance
        if (this.drawDistanceMultiplier < 1.0) {
            // Increase fog density when draw distance is reduced
            baseDensity *= (1.0 / this.drawDistanceMultiplier) * 0.5;
        }
        
        // Set target fog color based on zone
        if (zone) {
            this.setFogColorForZone(zone.name);
        } else {
            // Default sky color if no zone
            this.targetFogColor.set(FOG_CONFIG.color);
        }
        
        // Adjust fog based on time of day
        this.adjustFogForTimeOfDay();
        
        // Adjust fog based on weather
        this.adjustFogForWeather();
        
        // Set target fog density
        this.targetFogDensity = baseDensity;
        
        // Update fog transitions
        this.updateFogTransitions(deltaTime);
    }
    
    /**
     * Smoothly transition fog color and density
     * @param {number} deltaTime - Time since last update
     */
    updateFogTransitions(deltaTime) {
        if (!this.scene.fog) {
            return;
        }
        
        // Calculate transition speed based on delta time, but much slower
        // Reduced transition speed to 0.1 of original to make changes more gradual
        const transitionSpeed = FOG_CONFIG.transitionSpeed * (deltaTime * 60) * 0.1; // Normalize for 60fps
        
        // Smoothly transition fog color
        this.currentFogColor.lerp(this.targetFogColor, transitionSpeed);
        this.scene.fog.color.copy(this.currentFogColor);
        
        // Also update the background color to match the darkened fog color
        if (this.scene.background instanceof THREE.Color) {
            const bgColor = new THREE.Color().copy(this.currentFogColor).multiplyScalar(this.darkeningFactor);
            this.scene.background.copy(bgColor);
        }
        
        // Smoothly transition fog density
        if (this.scene.fog instanceof THREE.FogExp2) {
            // For exponential fog, adjust the density directly
            this.currentFogDensity += (this.targetFogDensity - this.currentFogDensity) * transitionSpeed;
            this.scene.fog.density = this.currentFogDensity;
            
            // Apply distance falloff adjustment to make distant objects darker
            // Higher values of distanceFalloff make the fog effect stronger at distance
            const adjustedDensity = this.currentFogDensity * this.distanceFalloff;
            this.scene.fog.density = adjustedDensity;
            
        } else if (this.scene.fog instanceof THREE.Fog) {
            // For linear fog, we need a different approach since near/far don't work well for hiding distant objects
            
            // First, update the current density for consistency
            this.currentFogDensity += (this.targetFogDensity - this.currentFogDensity) * transitionSpeed;
            
            // Calculate adjusted near and far values based on density
            // Higher density = shorter far distance
            const near = FOG_CONFIG.near;
            
            // Calculate far based on density and draw distance
            // This creates an inverse relationship - higher density = shorter far distance
            const densityFactor = FOG_CONFIG.density / this.currentFogDensity;
            const drawDistanceFactor = this.drawDistanceMultiplier;
            
            // Calculate far value with a non-linear relationship to density
            // This makes the fog effect much stronger at distance
            const baseFar = FOG_CONFIG.far;
            const far = baseFar * Math.pow(densityFactor, 0.5) * drawDistanceFactor;
            
            // Apply the calculated values
            this.scene.fog.near = near;
            this.scene.fog.far = far;
        }
    }
    
    /**
     * Set fog color based on zone type
     * @param {string} zoneName - The name of the zone
     */
    setFogColorForZone(zoneName) {
        switch (zoneName) {
            case 'Forest':
                this.targetFogColor.set(0x7ab07c); // Lighter greenish fog for forest
                break;
            case 'Desert':
                this.targetFogColor.set(0xd8c090); // Lighter tan fog for desert
                break;
            case 'Mountains':
                this.targetFogColor.set(0x90a0c0); // Lighter blue fog for mountains
                break;
            case 'Swamp':
                this.targetFogColor.set(0x6a8040); // Less dark green fog for swamp
                break;
            case 'Dark Sanctum':
                this.targetFogColor.set(0x483060); // Less dark purple fog for dark sanctum
                break;
            case 'Ruins':
                this.targetFogColor.set(0x909090); // Lighter gray fog for ruins
                break;
            default:
                this.targetFogColor.set(FOG_CONFIG.color); // Default lighter blue-gray
        }
    }
    
    /**
     * Adjust fog based on time of day
     * Enhanced to create more dramatic distance effects
     */
    adjustFogForTimeOfDay() {
        // Store the original density before applying time-of-day adjustments
        const originalDensity = this.targetFogDensity;
        
        switch (this.timeOfDay) {
            case 'dawn':
                // Pinkish-orange tint at dawn
                this.targetFogColor.lerp(new THREE.Color(0xffc0d0), 0.3);
                // Increase density at dawn to create morning mist effect
                this.targetFogDensity = originalDensity * 1.4;
                // Increase distance falloff for dawn
                this.distanceFalloff = FOG_CONFIG.distanceFalloff * 1.2;
                break;
                
            case 'dusk':
                // Orange-red tint at dusk
                this.targetFogColor.lerp(new THREE.Color(0xffa060), 0.3);
                // Increase density at dusk for sunset haze
                this.targetFogDensity = originalDensity * 1.5;
                // Increase distance falloff for dusk
                this.distanceFalloff = FOG_CONFIG.distanceFalloff * 1.3;
                break;
                
            case 'night':
                // Dark blue at night, but not too bright
                this.targetFogColor.lerp(new THREE.Color(0x101035), 0.6);
                // Significantly increase density at night to hide distant objects
                this.targetFogDensity = originalDensity * 2.0;
                // Increase distance falloff for night - objects disappear more quickly with distance
                this.distanceFalloff = FOG_CONFIG.distanceFalloff * 1.8;
                // Increase darkening factor at night
                this.darkeningFactor = FOG_CONFIG.darkeningFactor * 0.7;
                break;
                
            default: // day
                // During day, add a slight blue tint for sky color
                this.targetFogColor.lerp(new THREE.Color(0x90b0e0), 0.2);
                // Keep base density during day
                this.targetFogDensity = originalDensity * 1.0;
                // Use standard distance falloff during day
                this.distanceFalloff = FOG_CONFIG.distanceFalloff;
                // Use standard darkening factor during day
                this.darkeningFactor = FOG_CONFIG.darkeningFactor;
        }
    }
    
    /**
     * Adjust fog based on weather conditions
     * Enhanced to create more dramatic distance effects
     */
    adjustFogForWeather() {
        // Store the density after time-of-day adjustments
        const timeAdjustedDensity = this.targetFogDensity;
        
        switch (this.currentWeather) {
            case 'rain':
                // Darker gray fog during rain
                this.targetFogColor.lerp(new THREE.Color(0x606880), 0.5);
                // Significantly increase density during rain
                this.targetFogDensity = timeAdjustedDensity * 1.6;
                // Increase distance falloff during rain
                this.distanceFalloff = this.distanceFalloff * 1.3;
                break;
                
            case 'fog':
                // Gray fog during foggy weather
                this.targetFogColor.lerp(new THREE.Color(0xa0a0a0), 0.7);
                // Dramatically increase density during fog
                this.targetFogDensity = timeAdjustedDensity * 3.0;
                // Increase distance falloff during fog
                this.distanceFalloff = this.distanceFalloff * 2.0;
                break;
                
            case 'storm':
                // Dark gray fog during storms
                this.targetFogColor.lerp(new THREE.Color(0x404050), 0.6);
                // Dramatically increase density during storms
                this.targetFogDensity = timeAdjustedDensity * 2.5;
                // Increase distance falloff during storms
                this.distanceFalloff = this.distanceFalloff * 1.8;
                // Increase darkening factor during storms
                this.darkeningFactor = this.darkeningFactor * 0.8;
                break;
                
            default: // clear weather
                // In clear weather, keep the time-adjusted settings
                // No additional adjustments needed
                break;
        }
    }
    
    /**
     * Set the current time of day
     * @param {string} timeOfDay - 'day', 'dawn', 'dusk', or 'night'
     */
    setTimeOfDay(timeOfDay) {
        this.timeOfDay = timeOfDay;
    }
    
    /**
     * Set the current weather condition
     * @param {string} weather - 'clear', 'rain', 'fog', or 'storm'
     */
    setWeather(weather) {
        this.currentWeather = weather;
    }
    
    /**
     * Enable or disable fog
     * @param {boolean} enabled - Whether fog should be enabled
     */
    setFogEnabled(enabled) {
        if (enabled && !this.scene.fog) {
            this.initFog();
        } else if (!enabled && this.scene.fog) {
            this.scene.fog = null;
        }
    }
    
    /**
     * Set fog density directly (overrides automatic settings)
     * @param {number} density - The fog density
     */
    setFogDensity(density) {
        this.targetFogDensity = density;
    }
    
    /**
     * Set fog color directly (overrides automatic settings)
     * @param {number|string} color - The fog color as hex
     */
    setFogColor(color) {
        this.targetFogColor.set(color);
    }
}