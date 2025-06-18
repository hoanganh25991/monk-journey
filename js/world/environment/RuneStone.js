import * as THREE from 'three';

/**
 * RuneStone - Creates a stone with ancient runes carved into it
 */
export class RuneStone {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the rune stone mesh
     * @param {THREE.Vector3} position - Position of the stone
     * @param {number} size - Size scale of the stone
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The stone group
     */
    createMesh(position, size, data = {}) {
        const stoneGroup = new THREE.Group();
        
        // Create the main stone
        const stoneGeometry = new THREE.BoxGeometry(1 * size, 2 * size, 0.4 * size);
        const stoneMaterial = new THREE.MeshLambertMaterial({ 
            color: data.color || 0x607D8B,
            roughness: 0.8,
            metalness: 0.1
        });
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        
        // Slightly tilt the stone for a more natural look
        stone.rotation.z = (Math.random() - 0.5) * 0.2;
        stone.rotation.x = (Math.random() - 0.5) * 0.1;
        
        stoneGroup.add(stone);
        
        // Add runes to the stone
        this.addRunes(stoneGroup, size);
        
        // Add a subtle glow effect if specified
        if (data.glowing) {
            this.addGlowEffect(stoneGroup, size);
        }
        
        // Position the entire group
        stoneGroup.position.copy(position);
        // Adjust y-position to sit properly on the ground
        stoneGroup.position.y += size;
        
        // Add to scene
        this.scene.add(stoneGroup);
        
        return stoneGroup;
    }
    
    /**
     * Add rune carvings to the stone
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addRunes(group, size) {
        // Create runes using line segments
        const runeMaterial = new THREE.LineBasicMaterial({ 
            color: 0xFFFFFF,
            linewidth: 2
        });
        
        // Define some simple rune shapes
        const runeShapes = [
            // Vertical line with horizontal branches
            [
                new THREE.Vector3(0, 0.5, 0.21),
                new THREE.Vector3(0, -0.5, 0.21),
                new THREE.Vector3(0, 0, 0.21),
                new THREE.Vector3(0.3, 0, 0.21)
            ],
            // Triangle
            [
                new THREE.Vector3(-0.3, -0.4, 0.21),
                new THREE.Vector3(0, 0.4, 0.21),
                new THREE.Vector3(0.3, -0.4, 0.21),
                new THREE.Vector3(-0.3, -0.4, 0.21)
            ],
            // X shape
            [
                new THREE.Vector3(-0.3, 0.4, 0.21),
                new THREE.Vector3(0.3, -0.4, 0.21),
                new THREE.Vector3(0, 0, 0.21),
                new THREE.Vector3(-0.3, -0.4, 0.21),
                new THREE.Vector3(0.3, 0.4, 0.21)
            ],
            // Square with diagonal
            [
                new THREE.Vector3(-0.3, 0.4, 0.21),
                new THREE.Vector3(0.3, 0.4, 0.21),
                new THREE.Vector3(0.3, -0.4, 0.21),
                new THREE.Vector3(-0.3, -0.4, 0.21),
                new THREE.Vector3(-0.3, 0.4, 0.21),
                new THREE.Vector3(0.3, -0.4, 0.21)
            ]
        ];
        
        // Add 3-5 runes to the stone
        const runeCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < runeCount; i++) {
            // Select a random rune shape
            const runeShape = runeShapes[Math.floor(Math.random() * runeShapes.length)];
            
            // Scale and position the rune
            const scaledPoints = runeShape.map(point => {
                return new THREE.Vector3(
                    point.x * size,
                    point.y * size + (i - runeCount/2) * 0.6 * size, // Distribute vertically
                    point.z * size
                );
            });
            
            const runeGeometry = new THREE.BufferGeometry().setFromPoints(scaledPoints);
            const rune = new THREE.Line(runeGeometry, runeMaterial);
            
            group.add(rune);
        }
    }
    
    /**
     * Add a subtle glow effect to the runes
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addGlowEffect(group, size) {
        // Create a glowing plane just in front of the stone
        const glowGeometry = new THREE.PlaneGeometry(0.9 * size, 1.8 * size);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x81D4FA,
            transparent: true,
            opacity: 0.3,
            side: THREE.FrontSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        
        // Position just in front of the stone
        glow.position.z = 0.22 * size;
        
        group.add(glow);
        
        // Add a point light for additional effect
        const light = new THREE.PointLight(0x81D4FA, 1, 2 * size);
        light.position.z = 0.5 * size;
        
        group.add(light);
    }
}