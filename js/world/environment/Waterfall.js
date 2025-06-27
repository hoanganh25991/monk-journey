import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a waterfall environment object styled for Monk Journey
 */
export class Waterfall {
    /**
     * Create a new waterfall
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     */
    constructor(zoneType = 'Forest') {
        // Randomize waterfall properties
        
        this.height = 5 + Math.random() * 5; // Height between 5-10 units
        this.width = 2 + Math.random() * 3; // Width between 2-5 units
        this.depth = 1 + Math.random() * 1; // Depth between 1-2 units
        
        // Store zone type for color selection
        this.zoneType = zoneType;
        
        // Particle system properties
        this.particleCount = 500;
        this.particleSize = 0.1;
        this.particleSpeed = 0.1;
        this.lastUpdate = Date.now();
    }
    
    /**
     * Create the waterfall mesh
     * @returns {THREE.Group} - The waterfall group
     */
    createMesh() {
        const waterfallGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create rock structure behind waterfall
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.rock || 0x808080, // Gray default
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create rock cliff face
        const rockGeometry = new THREE.BoxGeometry(this.width + 2, this.height, this.depth);
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = this.height / 2;
        rock.position.z = -this.depth / 2;
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        waterfallGroup.add(rock);
        
        // Create water pool at the bottom
        const poolMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.water || 0x4682B4, // Steel Blue default
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        });
        
        const poolGeometry = new THREE.CylinderGeometry(this.width + 1, this.width + 1, 0.5, 16);
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.position.y = 0.25;
        pool.position.z = this.depth + 1;
        pool.receiveShadow = true;
        
        waterfallGroup.add(pool);
        
        // Create waterfall particles
        const waterMaterial = new THREE.PointsMaterial({
            color: zoneColors.water || 0x4682B4, // Steel Blue default
            size: this.particleSize,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Create particle positions
        const particlePositions = new Float32Array(this.particleCount * 3);
        const particleVelocities = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            // Initial position at top of waterfall with random spread
            const x = (Math.random() - 0.5) * this.width;
            const y = this.height;
            const z = this.depth / 2 + Math.random() * 0.5;
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
            
            // Store velocity for animation
            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.05,
                y: -this.particleSpeed - Math.random() * 0.1,
                z: Math.random() * 0.05
            });
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particles = new THREE.Points(particleGeometry, waterMaterial);
        particles.userData.velocities = particleVelocities;
        particles.userData.update = (delta) => {
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < this.particleCount; i++) {
                // Update position based on velocity
                positions[i * 3] += particleVelocities[i].x * delta;
                positions[i * 3 + 1] += particleVelocities[i].y * delta;
                positions[i * 3 + 2] += particleVelocities[i].z * delta;
                
                // Reset particle if it falls below the pool
                if (positions[i * 3 + 1] < 0.5) {
                    positions[i * 3] = (Math.random() - 0.5) * this.width;
                    positions[i * 3 + 1] = this.height;
                    positions[i * 3 + 2] = this.depth / 2 + Math.random() * 0.5;
                }
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
        };
        
        waterfallGroup.add(particles);
        waterfallGroup.userData.animate = (delta) => {
            if (particles.userData.update) {
                particles.userData.update(delta);
            }
        };
        
        // Create mist at the bottom of the waterfall
        const mistMaterial = new THREE.SpriteMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        for (let i = 0; i < 10; i++) {
            const mistSize = 1 + Math.random() * 2;
            const mist = new THREE.Sprite(mistMaterial);
            mist.scale.set(mistSize, mistSize, 1);
            
            const mistX = (Math.random() - 0.5) * this.width;
            const mistY = 0.5 + Math.random() * 0.5;
            const mistZ = this.depth + 1 + (Math.random() - 0.5);
            
            mist.position.set(mistX, mistY, mistZ);
            waterfallGroup.add(mist);
        }
        
        return waterfallGroup;
    }
}