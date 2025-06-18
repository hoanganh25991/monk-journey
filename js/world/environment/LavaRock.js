import * as THREE from 'three';

/**
 * LavaRock - Creates volcanic rocks with glowing cracks and emissive properties
 */
export class LavaRock {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the lava rock mesh
     * @param {THREE.Vector3} position - Position of the rock
     * @param {number} size - Size scale of the rock
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The rock group
     */
    createMesh(position, size, data = {}) {
        const rockGroup = new THREE.Group();
        
        // Create the main rock body
        const rockGeometry = new THREE.DodecahedronGeometry(0.5 * size, 1);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F1B14, // Dark volcanic color
            roughness: 0.9,
            metalness: 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = 0.25 * size;
        
        // Add random rotation and scaling
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        
        rock.scale.set(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        );
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        rockGroup.add(rock);
        
        // Add glowing lava cracks
        this.addLavaCracks(rockGroup, size);
        
        // Add heat shimmer effect
        this.addHeatEffect(rockGroup, size);
        
        // Position the entire group
        rockGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(rockGroup);
        
        return rockGroup;
    }
    
    /**
     * Add glowing lava cracks to the rock
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addLavaCracks(group, size) {
        const crackCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < crackCount; i++) {
            // Create crack as a thin glowing line
            const crackGeometry = new THREE.BoxGeometry(
                0.4 * size * Math.random(),
                0.02 * size,
                0.02 * size
            );
            
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF4500, // Orange-red
                emissive: 0xFF4500,
                emissiveIntensity: 0.8
            });
            
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            // Position cracks on the rock surface
            const angle = Math.random() * Math.PI * 2;
            const height = 0.1 * size + Math.random() * 0.3 * size;
            
            crack.position.x = Math.cos(angle) * 0.25 * size;
            crack.position.z = Math.sin(angle) * 0.25 * size;
            crack.position.y = height;
            
            // Random rotation
            crack.rotation.x = Math.random() * Math.PI;
            crack.rotation.y = Math.random() * Math.PI;
            crack.rotation.z = Math.random() * Math.PI;
            
            group.add(crack);
        }
        
        // Add central glowing core
        const coreGeometry = new THREE.SphereGeometry(0.1 * size, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF6600,
            emissive: 0xFF6600,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.25 * size;
        group.add(core);
        
        // Add point light for glow effect
        const light = new THREE.PointLight(0xFF4500, 1, 1.5 * size);
        light.position.y = 0.25 * size;
        group.add(light);
    }
    
    /**
     * Add heat shimmer particles
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addHeatEffect(group, size) {
        const particleCount = 8;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3 * size;
            const height = Math.random() * 0.5 * size;
            
            particlePositions.push(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
        }
        
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFF8C00,
            size: 0.03 * size,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        // Add some ember sparks
        const emberCount = 5;
        for (let i = 0; i < emberCount; i++) {
            const emberGeometry = new THREE.SphereGeometry(0.01 * size, 4, 4);
            const emberMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF4500,
                emissive: 0xFF4500,
                emissiveIntensity: 1.0
            });
            
            const ember = new THREE.Mesh(emberGeometry, emberMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.2;
            ember.position.x = Math.cos(angle) * radius * size;
            ember.position.z = Math.sin(angle) * radius * size;
            ember.position.y = 0.1 * size + Math.random() * 0.3 * size;
            
            group.add(ember);
        }
    }
}