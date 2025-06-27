import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a magic circle environment object styled for Monk Journey
 */
export class MagicCircle {
    /**
     * Create a new magic circle
     * @param {THREE.Scene} scene - The scene to add the magic circle to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the magic circle
     * @param {number} size - The size of the magic circle
     * @param {Object} data - Additional data for the magic circle
     */
    constructor(scene, worldManager, position, size = 1, data = {}) {
        // Store references
        this.scene = scene;
        this.worldManager = worldManager;
        this.position = position;
        
        // Randomize circle properties
        
        this.size = size * (1 + Math.random() * 0.3); // Apply size with some variation
        
        // Store zone type for color selection (get from data or default to Ruins)
        this.zoneType = data.zoneType || 'Ruins';
        
        // Animation properties
        this.rotationSpeed = 0.001 + Math.random() * 0.002;
        this.pulseSpeed = 0.01 + Math.random() * 0.01;
        this.pulseAmount = 0.1 + Math.random() * 0.2;
        this.time = 0;
    }
    
    /**
     * Create the magic circle mesh
     * @returns {THREE.Group} - The magic circle group
     */
    createMesh(position = this.position, size = this.size, data = {}) {
        const circleGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Ruins;
        
        // Determine circle color based on zone
        let circleColor, glowColor;
        let emissiveIntensity = 0.7;
        
        switch(this.zoneType) {
            case 'Forest':
                circleColor = 0x00FF00; // Green
                glowColor = 0x90EE90; // Light Green
                break;
            case 'Desert':
                circleColor = 0xFFD700; // Gold
                glowColor = 0xFFA500; // Orange
                break;
            case 'Mountains':
                circleColor = 0x87CEEB; // Sky Blue
                glowColor = 0xADD8E6; // Light Blue
                break;
            case 'Swamp':
                circleColor = 0x9370DB; // Medium Purple
                glowColor = 0xBA55D3; // Medium Orchid
                break;
            case 'Ruins':
                circleColor = 0xFF4500; // Orange Red
                glowColor = 0xFF6347; // Tomato
                break;
            case 'Dark Sanctum':
                circleColor = 0x800080; // Purple
                glowColor = 0x9400D3; // Dark Violet
                emissiveIntensity = 0.9;
                break;
            default:
                circleColor = 0xFF4500; // Orange Red
                glowColor = 0xFF6347; // Tomato
        }
        
        // Create ground circle
        const groundRadius = this.size * 2;
        const groundGeometry = new THREE.CircleGeometry(groundRadius, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.01; // Slightly above ground to avoid z-fighting
        ground.receiveShadow = true;
        
        circleGroup.add(ground);
        
        // Create main magic circle
        const circleRadius = this.size * 1.8;
        const circleGeometry = new THREE.RingGeometry(circleRadius * 0.95, circleRadius, 64);
        const circleMaterial = new THREE.MeshStandardMaterial({
            color: circleColor,
            roughness: 0.3,
            metalness: 0.7,
            emissive: circleColor,
            emissiveIntensity: emissiveIntensity,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = 0.02; // Slightly above ground
        
        circleGroup.add(circle);
        
        // Create inner circle
        const innerRadius = circleRadius * 0.7;
        const innerGeometry = new THREE.RingGeometry(innerRadius * 0.9, innerRadius, 64);
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: glowColor,
            roughness: 0.3,
            metalness: 0.7,
            emissive: glowColor,
            emissiveIntensity: emissiveIntensity,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
        innerCircle.rotation.x = -Math.PI / 2;
        innerCircle.position.y = 0.03; // Slightly above main circle
        
        circleGroup.add(innerCircle);
        
        // Create runes around the circle
        const runeCount = 8 + Math.floor(Math.random() * 8);
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const runeRadius = this.size * 0.2;
            
            // Create a simple rune shape (could be more complex in a real implementation)
            const runeGeometry = new THREE.PlaneGeometry(runeRadius, runeRadius);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position rune around the circle
            const x = Math.cos(angle) * circleRadius * 0.8;
            const z = Math.sin(angle) * circleRadius * 0.8;
            
            rune.position.set(x, 0.04, z); // Slightly above inner circle
            rune.rotation.x = -Math.PI / 2;
            
            circleGroup.add(rune);
        }
        
        // Add central pillar of light
        const lightPillarGeometry = new THREE.CylinderGeometry(
            this.size * 0.2, // top radius
            this.size * 0.5, // bottom radius
            this.size * 4, // height
            16, // radial segments
            4, // height segments
            true // open-ended
        );
        
        const lightPillarMaterial = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const lightPillar = new THREE.Mesh(lightPillarGeometry, lightPillarMaterial);
        lightPillar.position.y = this.size * 2; // Half the height
        
        circleGroup.add(lightPillar);
        
        // Add point light in the center
        const light = new THREE.PointLight(circleColor, 1, this.size * 10);
        light.position.set(0, this.size * 0.5, 0);
        circleGroup.add(light);
        
        // Add animation to the circle group
        if (this.worldManager && this.worldManager.addAnimatedObject) {
            this.worldManager.addAnimatedObject({
                update: (deltaTime) => {
                    this.time += deltaTime;
                    
                    // Rotate the circles
                    circle.rotation.z += this.rotationSpeed * deltaTime;
                    innerCircle.rotation.z -= this.rotationSpeed * 1.5 * deltaTime;
                    
                    // Pulse the light
                    const pulse = Math.sin(this.time * this.pulseSpeed) * this.pulseAmount + 1;
                    light.intensity = pulse;
                    
                    // Pulse the opacity of the light pillar
                    lightPillarMaterial.opacity = 0.2 + Math.sin(this.time * this.pulseSpeed * 0.5) * 0.1;
                }
            });
        }
        
        // Position the entire group at the specified position
        if (position) {
            circleGroup.position.copy(position);
        }
        
        // Add to scene
        this.scene.add(circleGroup);
        
        return circleGroup;
    }
}