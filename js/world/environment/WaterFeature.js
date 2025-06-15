import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';

/**
 * Water Feature - Creates a water body in the environment
 */
export class WaterFeature extends EnvironmentObject {
    constructor(scene, worldManager, position, size) {
        super(scene, worldManager, position, size, 'water');
        return this.create();
    }
    
    /**
     * Create the water feature
     * @returns {THREE.Mesh} - Water mesh
     */
    create() {
        const geometry = new THREE.CircleGeometry(this.size, 16);
        const material = new THREE.MeshLambertMaterial({
            color: 0x4682B4,
            transparent: true,
            opacity: 0.7
        });
        
        const water = new THREE.Mesh(geometry, material);
        water.rotation.x = -Math.PI / 2;
        water.position.set(
            this.position.x,
            this.getTerrainHeight(this.position.x, this.position.z) + 0.1,
            this.position.z
        );
        
        water.userData = { type: 'water' };
        this.addToScene(water);
        
        return water;
    }
}