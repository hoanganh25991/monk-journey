import * as THREE from 'three';

/**
 * Represents a boss spawn point interactive object
 */
export class BossSpawnPoint {
    /**
     * Create a new boss spawn point
     * @param {string} bossType - Type of boss
     */
    constructor(bossType) {
        this.bossType = bossType;
    }
    
    /**
     * Create the boss spawn point mesh
     * @returns {THREE.Group} - The boss spawn point group
     */
    createMesh() {
        const markerGroup = new THREE.Group();
        
        // Create base
        const baseGeometry = new THREE.CircleGeometry(3, 32);
        const baseMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900cc,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = -Math.PI / 2;
        base.position.y = 0.1;
        
        markerGroup.add(base);
        
        // Create runes on the ground
        const runeGeometry = new THREE.TorusGeometry(2.5, 0.2, 8, 32);
        const runeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const rune = new THREE.Mesh(runeGeometry, runeMaterial);
        rune.rotation.x = -Math.PI / 2;
        rune.position.y = 0.15;
        
        markerGroup.add(rune);
        
        return markerGroup;
    }
}