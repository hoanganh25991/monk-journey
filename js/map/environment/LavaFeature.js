import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * Lava Feature - Creates a lava pool in the environment
 */
export class LavaFeature extends EnvironmentObject {
    constructor(scene, MapManager, position, size) {
        super(scene, MapManager, position, size, 'lava');
        return this.create();
    }
    
    /**
     * Create the lava feature
     * @returns {THREE.Mesh} - Lava mesh
     */
    create() {
        const geometry = new THREE.CircleGeometry(this.size, 16);
        const material = new THREE.MeshLambertMaterial({
            color: 0xFF4500,
            emissive: 0xFF2200,
            emissiveIntensity: 0.3
        });
        
        const lava = new THREE.Mesh(geometry, material);
        lava.rotation.x = -Math.PI / 2;
        lava.position.set(
            this.position.x,
            this.getTerrainHeight(this.position.x, this.position.z) + 0.1,
            this.position.z
        );
        
        lava.userData = { type: 'lava' };
        this.addToScene(lava);
        
        return lava;
    }
}