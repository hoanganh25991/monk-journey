import * as THREE from 'three';

/**
 * Manages the sky in the game world
 * Provides a simple sky implementation that doesn't impact performance
 */
export class SkyManager {
    constructor(scene) {
        this.scene = scene;
        this.sky = null;
        this.sun = null;
        this.timeOfDay = 'day'; // 'day', 'dawn', 'dusk', 'night'
        this.weather = 'clear'; // 'clear', 'rain', 'fog', 'storm'
        
        // Sky colors for different times of day
        this.skyColors = {
            day: 0x87ceeb,    // Light sky blue
            dawn: 0xffa07a,   // Light salmon
            dusk: 0xff7f50,   // Coral
            night: 0x191970   // Midnight blue
        };
        
        // Weather modifiers
        this.weatherModifiers = {
            clear: new THREE.Color(1, 1, 1),
            rain: new THREE.Color(0.7, 0.7, 0.8),
            fog: new THREE.Color(0.8, 0.8, 0.8),
            storm: new THREE.Color(0.5, 0.5, 0.6)
        };
        
        this.initSky();
    }
    
    /**
     * Initialize the sky
     */
    initSky() {
        // Simple implementation - just use scene background color
        // This is the most performance-friendly approach
        this.updateSkyColor();
    }
    
    /**
     * Update the sky color based on time of day and weather
     */
    updateSkyColor() {
        // Get base color for time of day
        const baseColor = new THREE.Color(this.skyColors[this.timeOfDay] || this.skyColors.day);
        
        // Apply weather modifier
        const weatherModifier = this.weatherModifiers[this.weather] || this.weatherModifiers.clear;
        baseColor.multiply(weatherModifier);
        
        // Set scene background color
        if (this.scene) {
            this.scene.background = baseColor;
        }
    }
    
    /**
     * Set the time of day
     * @param {string} timeOfDay - 'day', 'dawn', 'dusk', or 'night'
     */
    setTimeOfDay(timeOfDay) {
        if (this.timeOfDay !== timeOfDay) {
            this.timeOfDay = timeOfDay;
            this.updateSkyColor();
        }
    }
    
    /**
     * Set the weather condition
     * @param {string} weather - 'clear', 'rain', 'fog', or 'storm'
     */
    setWeather(weather) {
        if (this.weather !== weather) {
            this.weather = weather;
            this.updateSkyColor();
        }
    }
    
    /**
     * Update the sky (called each frame)
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Nothing to update in the simple implementation
        // This method is here for future enhancements
    }
}