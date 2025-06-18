import * as THREE from 'three';

/**
 * Represents a market environment object
 */
export class Market {
    /**
     * Create a new market
     * @param {THREE.Scene} scene - The scene to add the market to
     * @param {Object} MapManager - The world manager
     */
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the market mesh
     * @param {Object} data - Market data including position and size
     * @returns {THREE.Group} - The market group
     */
    createMesh(data) {
        const size = data.size || 8;
        const marketGroup = new THREE.Group();
        
        // Create market ground
        const groundGeometry = new THREE.PlaneGeometry(size, size);
        
        // Get theme colors
        let groundColor = 0xCCCCCC; // Default ground color
        
        if (this.MapManager.mapLoader && 
            this.MapManager.mapLoader.currentMap && 
            this.MapManager.mapLoader.currentMap.theme) {
            const themeColors = this.MapManager.mapLoader.currentMap.theme.colors;
            
            // Use theme-specific path color if available
            if (themeColors && themeColors.path) {
                // Convert hex string to number
                groundColor = parseInt(themeColors.path.replace('#', '0x'), 16);
            }
        }
        
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: groundColor,
            roughness: 0.7
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.y = 0.05; // Slightly above ground
        
        marketGroup.add(ground);
        
        // Add market stalls
        const stallCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < stallCount; i++) {
            const stallSize = 1 + Math.random() * 0.5;
            
            // Create stall base
            const baseGeometry = new THREE.BoxGeometry(stallSize * 2, stallSize * 0.5, stallSize * 2);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            
            // Create stall roof
            const roofGeometry = new THREE.BoxGeometry(stallSize * 2.5, stallSize * 0.2, stallSize * 2.5);
            const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xA52A2A, roughness: 0.7 });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = stallSize * 1.5;
            
            // Create stall posts
            const postGeometry = new THREE.CylinderGeometry(stallSize * 0.1, stallSize * 0.1, stallSize * 1.5, 6);
            const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
            
            const posts = [];
            const postPositions = [
                { x: stallSize * 0.8, z: stallSize * 0.8 },
                { x: -stallSize * 0.8, z: stallSize * 0.8 },
                { x: stallSize * 0.8, z: -stallSize * 0.8 },
                { x: -stallSize * 0.8, z: -stallSize * 0.8 }
            ];
            
            for (const pos of postPositions) {
                const post = new THREE.Mesh(postGeometry, postMaterial);
                post.position.set(pos.x, stallSize * 0.75, pos.z);
                posts.push(post);
            }
            
            // Create stall group
            const stall = new THREE.Group();
            stall.add(base);
            stall.add(roof);
            posts.forEach(post => stall.add(post));
            
            // Position stall in market
            const angle = (i / stallCount) * Math.PI * 2;
            const distance = size * 0.3;
            stall.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            // Random rotation
            stall.rotation.y = Math.random() * Math.PI * 2;
            
            marketGroup.add(stall);
        }
        
        marketGroup.position.set(data.position.x, data.position.y || 0, data.position.z);
        marketGroup.userData = { type: 'market' };
        
        return marketGroup;
    }
}