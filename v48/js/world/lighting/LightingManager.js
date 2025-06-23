import * as THREE from 'three';

/**
 * Manages world lighting
 */
export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        
        // Lighting collections
        this.lights = [];
        
        // Time of day
        this.timeOfDay = 0.5; // 0 = midnight, 0.5 = noon, 1 = midnight
        this.dayNightCycle = true;
        this.dayNightCycleSpeed = 0.0001; // Speed of day/night cycle
    }
    
    /**
     * Initialize the lighting system
     */
    init() {
        this.createLights();
    }
    
    /**
     * Create lights for the world
     */
    createLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // IMPROVED: Configure shadow properties for better coverage and quality
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        
        // CRITICAL FIX: Add these settings to improve shadow quality and prevent shadow disappearance
        directionalLight.shadow.bias = -0.0001; // Helps prevent shadow acne
        directionalLight.shadow.normalBias = 0.02; // Helps with normal-mapped surfaces
        directionalLight.shadow.radius = 1; // Slight blur for softer shadows
        
        // Create a target for the directional light
        directionalLight.target.position.set(0, 0, 0);
        this.scene.add(directionalLight.target);
        
        // Add the light to the scene
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        this.sunLight = directionalLight;
        
        // Add a hemisphere light
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7e4f, 0.6);
        this.scene.add(hemisphereLight);
        this.lights.push(hemisphereLight);
        this.skyLight = hemisphereLight;
    }
    
    /**
     * Update lighting based on time of day and player position
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Vector3} [playerPosition] - Optional player position to update light position
     */
    update(deltaTime, playerPosition) {
        if (this.dayNightCycle) {
            // Update time of day
            this.timeOfDay += this.dayNightCycleSpeed * deltaTime;
            if (this.timeOfDay > 1) {
                this.timeOfDay = 0;
            }
            
            // Update lighting based on time of day
            this.updateLightingForTimeOfDay();
        }
        
        // If player position is provided, update the shadow camera position
        if (playerPosition) {
            this.updateLightPositionForPlayer(playerPosition);
        }
    }
    
    /**
     * Update directional light position to follow the player
     * @param {THREE.Vector3} playerPosition - The player's current position
     */
    updateLightPositionForPlayer(playerPosition) {
        if (!this.sunLight) return;
        
        // Get the current sun angle and height from time of day
        const sunAngle = Math.PI * 2 * this.timeOfDay - Math.PI / 2;
        const sunHeight = Math.sin(sunAngle);
        const sunDistance = 100;
        
        // Calculate sun position relative to player
        const relativeX = Math.cos(sunAngle) * sunDistance;
        const relativeY = Math.max(0.1, sunHeight) * sunDistance;
        const relativeZ = 0;
        
        // Update sun position to be relative to player
        this.sunLight.position.set(
            playerPosition.x + relativeX,
            playerPosition.y + relativeY,
            playerPosition.z + relativeZ
        );
        
        // Update the target of the directional light to look at the player
        this.sunLight.target.position.copy(playerPosition);
        
        // Make sure the target is added to the scene
        if (!this.sunLight.target.parent) {
            this.scene.add(this.sunLight.target);
        }
    }
    
    /**
     * Update lighting based on current time of day
     */
    updateLightingForTimeOfDay() {
        // Calculate sun angle and height (but don't update position here)
        const sunAngle = Math.PI * 2 * this.timeOfDay - Math.PI / 2;
        const sunHeight = Math.sin(sunAngle);
        
        // Update sun intensity based on height
        const sunIntensity = Math.max(0, sunHeight);
        this.sunLight.intensity = sunIntensity;
        
        // Update ambient light based on time of day
        const ambientIntensity = 0.2 + sunIntensity * 0.3;
        this.lights[0].intensity = ambientIntensity;
        
        // Update sky light based on time of day
        const skyColor = new THREE.Color();
        const groundColor = new THREE.Color();
        
        if (sunHeight > 0) {
            // Day
            skyColor.setHSL(0.6, 1, 0.5 + sunHeight * 0.5);
            groundColor.setHSL(0.095, 0.5, 0.3 + sunHeight * 0.1);
        } else {
            // Night
            skyColor.setHSL(0.7, 0.8, Math.max(0.1, 0.3 + sunHeight * 0.2));
            groundColor.setHSL(0.095, 0.5, Math.max(0.1, 0.3 + sunHeight * 0.1));
        }
        
        this.skyLight.color.copy(skyColor);
        this.skyLight.groundColor.copy(groundColor);
        this.skyLight.intensity = 0.3 + sunIntensity * 0.3;
    }
    
    /**
     * Set the time of day
     * @param {number} time - Time of day (0-1)
     */
    setTimeOfDay(time) {
        this.timeOfDay = Math.max(0, Math.min(1, time));
        this.updateLightingForTimeOfDay();
    }
    
    /**
     * Toggle day/night cycle
     * @param {boolean} enabled - Whether the day/night cycle is enabled
     */
    setDayNightCycle(enabled) {
        this.dayNightCycle = enabled;
    }
    
    /**
     * Set day/night cycle speed
     * @param {number} speed - Speed of day/night cycle
     */
    setDayNightCycleSpeed(speed) {
        this.dayNightCycleSpeed = speed;
    }
    
    /**
     * Clear all lights
     */
    clear() {
        this.lights.forEach(light => {
            if (light.parent) {
                this.scene.remove(light);
            }
        });
        this.lights = [];
    }
}