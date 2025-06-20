import * as THREE from 'three';
import { Bush } from './Bush.js';

/**
 * SmallPlant - Creates a small plant using a scaled-down bush
 */
export class SmallPlant {
    /**
     * Constructor for SmallPlant
     * @param {THREE.Scene} scene - The scene to add the small plant to
     * @param {Object} worldManager - The world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create a small plant mesh
     * @param {THREE.Vector3} position - Position of the small plant
     * @param {number} size - Size of the small plant
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The small plant group
     */
    createMesh(position, size, data = {}) {
        // Create a simple small plant using a scaled-down bush
        const bush = new Bush();
        const plantGroup = bush.createMesh();
        plantGroup.position.copy(position);
        // Scale it down to make it a small plant
        const plantSize = size * 0.3;
        plantGroup.scale.set(plantSize, plantSize, plantSize);
        this.scene.add(plantGroup);
        return plantGroup;
    }
}