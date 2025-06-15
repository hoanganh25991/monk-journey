import * as THREE from 'three';

/**
 * GlowingMushroom - Creates a mushroom that emits a magical glow
 */
export class GlowingMushroom {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }

    /**
     * Create the glowing mushroom mesh
     * @param {THREE.Vector3} position - Position of the mushroom
     * @param {number} size - Size scale of the mushroom
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The mushroom group
     */
    createMesh(position, size, data = {}) {
        const mushroomGroup = new THREE.Group();
        
        // Determine the mushroom color
        const colors = [
            0x4FC3F7, // Blue
            0x81C784, // Green
            0xBA68C8, // Purple
            0xFFB74D  // Orange
        ];
        const colorIndex = data.colorIndex || Math.floor(Math.random() * colors.length);
        const mushroomColor = colors[colorIndex];
        
        // Create the stem
        const stemGeometry = new THREE.CylinderGeometry(0.1 * size, 0.15 * size, 0.5 * size, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xE0E0E0,
            emissive: mushroomColor,
            emissiveIntensity: 0.2
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25 * size;
        mushroomGroup.add(stem);
        
        // Create the cap
        const capGeometry = new THREE.SphereGeometry(0.3 * size, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshLambertMaterial({ 
            color: mushroomColor,
            emissive: mushroomColor,
            emissiveIntensity: 0.5
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.5 * size;
        cap.scale.set(1.2, 1, 1.2);
        mushroomGroup.add(cap);
        
        // Add spots to the cap
        this.addSpotsToMushroom(mushroomGroup, size, mushroomColor);
        
        // Add glow effect
        this.addGlowEffect(mushroomGroup, size, mushroomColor);
        
        // Position the entire group
        mushroomGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(mushroomGroup);
        
        return mushroomGroup;
    }
    
    /**
     * Add spots to the mushroom cap
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} baseColor - Base color of the mushroom
     */
    addSpotsToMushroom(group, size, baseColor) {
        // Create 5-10 spots on the cap
        const spotCount = 5 + Math.floor(Math.random() * 6);
        
        // Make spots a lighter version of the base color
        const spotColor = new THREE.Color(baseColor);
        spotColor.lerp(new THREE.Color(0xFFFFFF), 0.5);
        
        for (let i = 0; i < spotCount; i++) {
            // Create a small sphere for each spot
            const spotGeometry = new THREE.SphereGeometry(0.05 * size, 8, 8);
            // MeshBasicMaterial doesn't support emissive properties, using just color
            const spotMaterial = new THREE.MeshBasicMaterial({ 
                color: spotColor,
                transparent: true,
                opacity: 0.9
            });
            const spot = new THREE.Mesh(spotGeometry, spotMaterial);
            
            // Position on the cap
            const angle = Math.random() * Math.PI * 2;
            const radius = (0.1 + Math.random() * 0.15) * size;
            
            spot.position.x = Math.cos(angle) * radius;
            spot.position.z = Math.sin(angle) * radius;
            spot.position.y = 0.5 * size + 0.05 * size;
            
            group.add(spot);
        }
    }
    
    /**
     * Add glow effect to the mushroom
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} glowColor - Color of the glow
     */
    addGlowEffect(group, size, glowColor) {
        // Add a point light
        const light = new THREE.PointLight(glowColor, 1, 2 * size);
        light.position.y = 0.5 * size;
        group.add(light);
        
        // Add particles for additional glow effect
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = (0.3 + Math.random() * 0.3) * size;
            const height = (0.3 + Math.random() * 0.5) * size;
            
            particlePositions.push(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
        }
        
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: glowColor,
            size: 0.05 * size,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
    }
}