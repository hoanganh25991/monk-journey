import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a rock environment object styled for Monk Journey
 */
export class Rock {
    /**
     * Create a new rock
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     */
    constructor(zoneType = 'Forest') {
        // Randomize rock properties
        this.random = Math.random;
        this.size = 0.5 + this.random() * 1.5; // Rock size between 0.5-2 units
        
        // Store zone type for color selection
        this.zoneType = zoneType;
    }
    
    /**
     * Create the rock mesh
     * @returns {THREE.Group} - The rock group
     */
    createMesh() {
        const rockGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create rock with zone-appropriate color
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.rock || 0x708090, // Slate Gray default
            roughness: 0.9,
            metalness: 0.2
        });
        
        // Determine rock shape based on zone
        let rockGeometry;
        
        // Create different rock shapes based on zone type for more variety
        if (this.zoneType === 'Desert') {
            // Smoother, more eroded rocks for desert
            rockGeometry = new THREE.SphereGeometry(this.size, 6, 4);
        } else if (this.zoneType === 'Mountain') {
            // Sharp, angular rocks for mountains
            rockGeometry = new THREE.OctahedronGeometry(this.size, 0);
        } else if (this.zoneType === 'Dark Sanctum') {
            // Darker, more angular rocks for dark sanctum
            rockGeometry = new THREE.TetrahedronGeometry(this.size, 0);
        } else {
            // Default rock shape - more stylized for Monk Journey
            rockGeometry = new THREE.DodecahedronGeometry(this.size, 0);
        }
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = this.size / 2;
        
        // Add some random rotation to make it look more natural
        rock.rotation.x = this.random() * Math.PI;
        rock.rotation.y = this.random() * Math.PI;
        rock.rotation.z = this.random() * Math.PI;
        
        // Add some random scaling to make it look more natural but maintain style
        rock.scale.set(
            0.8 + this.random() * 0.4,
            0.8 + this.random() * 0.4,
            0.8 + this.random() * 0.4
        );
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        rockGroup.add(rock);
        
        // Add decorative elements for certain zone types
        if (this.zoneType === 'Forest' && this.random() > 0.7) {
            // Add moss or small plants on forest rocks
            const mossGeometry = new THREE.SphereGeometry(this.size * 0.3, 4, 4);
            const mossMaterial = new THREE.MeshStandardMaterial({
                color: zoneColors.vegetation || 0x556B2F, // Olive Green default
                roughness: 0.9,
                metalness: 0.1
            });
            
            const moss = new THREE.Mesh(mossGeometry, mossMaterial);
            moss.scale.set(1, 0.3, 1); // Flatten it
            moss.position.set(
                (this.random() - 0.5) * this.size * 0.5,
                this.size * 0.8,
                (this.random() - 0.5) * this.size * 0.5
            );
            rockGroup.add(moss);
        } else if (this.zoneType === 'Desert' && this.random() > 0.8) {
            // Add sand texture or cracks to desert rocks
            const crackGeometry = new THREE.BoxGeometry(this.size * 0.8, 0.05, 0.05);
            const crackMaterial = new THREE.MeshStandardMaterial({
                color: zoneColors.sand || 0xF4A460, // Sandy Brown default
                roughness: 1.0,
                metalness: 0.0
            });
            
            // Add a few cracks
            for (let i = 0; i < 3; i++) {
                const crack = new THREE.Mesh(crackGeometry, crackMaterial);
                crack.position.set(
                    0,
                    this.size * (0.3 + this.random() * 0.5),
                    0
                );
                crack.rotation.set(
                    this.random() * Math.PI,
                    this.random() * Math.PI,
                    this.random() * Math.PI
                );
                rockGroup.add(crack);
            }
        }
        
        return rockGroup;
    }
}