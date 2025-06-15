import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * GlowingFlowers - A cluster of glowing flowers with magical properties
 * Creates a beautiful group of luminescent flowers that emit soft light
 */
export class GlowingFlowers extends EnvironmentObject {
    constructor(scene, worldManager) {
        super(scene, worldManager);
        this.type = 'glowing_flowers';
        this.name = 'Glowing Flowers';
        this.description = 'A magical cluster of flowers that glow with ethereal light';
    }

    /**
     * Create the glowing flowers mesh
     * @param {THREE.Vector3} position - Position for the flowers
     * @param {number} size - Size multiplier for the flowers
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} The flowers group
     */
    createMesh(position, size = 1, data = {}) {
        const flowersGroup = new THREE.Group();
        
        // Configuration
        const flowerCount = 3 + Math.floor(Math.random() * 5); // 3-7 flowers
        const clusterRadius = 0.8 * size;
        const baseFlowerSize = 0.3 * size;
        
        // Create individual flowers
        for (let i = 0; i < flowerCount; i++) {
            const flower = this.createSingleFlower(baseFlowerSize);
            
            // Position flowers in a cluster
            const angle = (i / flowerCount) * Math.PI * 2 + Math.random() * 0.5;
            const distance = Math.random() * clusterRadius;
            
            flower.position.set(
                Math.cos(angle) * distance,
                Math.random() * 0.1 * size, // Slight height variation
                Math.sin(angle) * distance
            );
            
            // Random rotation for natural look
            flower.rotation.y = Math.random() * Math.PI * 2;
            
            flowersGroup.add(flower);
        }
        
        // Add ambient light effect
        const ambientLight = this.createAmbientLight(size);
        flowersGroup.add(ambientLight);
        
        // Position the entire group
        flowersGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(flowersGroup);
        
        return flowersGroup;
    }
    
    /**
     * Create a single glowing flower
     * @param {number} size - Size of the flower
     * @returns {THREE.Group} Single flower group
     */
    createSingleFlower(size) {
        const flowerGroup = new THREE.Group();
        
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.02 * size, 0.03 * size, 0.4 * size, 6);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.2 * size;
        flowerGroup.add(stem);
        
        // Create petals
        const petalCount = 5 + Math.floor(Math.random() * 3); // 5-7 petals
        const petalColors = [0xFF69B4, 0x9370DB, 0x00CED1, 0x98FB98, 0xFFB6C1];
        const glowColor = petalColors[Math.floor(Math.random() * petalColors.length)];
        
        for (let i = 0; i < petalCount; i++) {
            const petal = this.createPetal(size, glowColor);
            const angle = (i / petalCount) * Math.PI * 2;
            
            petal.position.set(
                Math.cos(angle) * 0.15 * size,
                0.35 * size,
                Math.sin(angle) * 0.15 * size
            );
            
            petal.rotation.z = angle;
            petal.rotation.x = Math.PI / 6; // Slight upward tilt
            
            flowerGroup.add(petal);
        }
        
        // Create flower center
        const centerGeometry = new THREE.SphereGeometry(0.05 * size, 8, 6);
        const centerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.3
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.35 * size;
        flowerGroup.add(center);
        
        // Add point light for glow effect
        const pointLight = new THREE.PointLight(glowColor, 0.5, 2 * size, 2);
        pointLight.position.y = 0.35 * size;
        flowerGroup.add(pointLight);
        
        return flowerGroup;
    }
    
    /**
     * Create a flower petal
     * @param {number} size - Size of the petal
     * @param {number} color - Color of the petal
     * @returns {THREE.Mesh} Petal mesh
     */
    createPetal(size, color) {
        // Create petal shape using an ellipse-like geometry
        const petalGeometry = new THREE.SphereGeometry(0.08 * size, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        
        // Apply scaling to create petal shape
        const positions = petalGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Scale to create elongated petal shape
            positions.setX(i, x * 0.6);
            positions.setY(i, y);
            positions.setZ(i, z * 1.5);
        }
        
        const petalMaterial = new THREE.MeshLambertMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        return new THREE.Mesh(petalGeometry, petalMaterial);
    }
    
    /**
     * Create ambient light effect for the flower cluster
     * @param {number} size - Size multiplier
     * @returns {THREE.PointLight} Ambient light
     */
    createAmbientLight(size) {
        const ambientLight = new THREE.PointLight(0xFFFFFF, 0.3, 3 * size, 1.5);
        ambientLight.position.y = 0.5 * size;
        return ambientLight;
    }
    
    /**
     * Get interaction data for the glowing flowers
     * @returns {Object} Interaction configuration
     */
    getInteractionData() {
        return {
            type: 'collect',
            item: 'glowing_petal',
            message: 'You gently pluck a glowing petal that pulses with magical energy.',
            sound: 'item_collect',
            particles: 'sparkle'
        };
    }
}