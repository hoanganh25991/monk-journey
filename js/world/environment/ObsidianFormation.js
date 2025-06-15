import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents an obsidian formation environment object
 * Dark, glossy volcanic glass formations
 */
export class ObsidianFormation extends EnvironmentObject {
    /**
     * Create a new obsidian formation
     * @param {THREE.Scene} scene - The scene to add the formation to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the formation
     * @param {number} size - The size of the formation
     */
    constructor(scene, worldManager, position, size = 1) {
        super(scene, worldManager, position, size, 'obsidian_formation');
        
        // Randomize formation properties
        this.formationType = Math.floor(Math.random() * 3); // 0: spikes, 1: slab, 2: cluster
        this.hasGlowingCracks = Math.random() > 0.5; // 50% chance to have glowing cracks
        this.reflectivity = 0.3 + Math.random() * 0.4; // Random reflectivity between 0.3-0.7
        
        // Get zone type from world manager if available
        this.zoneType = worldManager?.getCurrentZoneType(position) || 'Volcanic Wastes';
        
        // Create the formation
        this.object = this.create();
    }
    
    /**
     * Create the obsidian formation mesh
     * @returns {THREE.Group} - The obsidian formation group
     */
    create() {
        const formationGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS['Volcanic Wastes'];
        
        // Determine colors
        const obsidianColor = 0x0C0C0C; // Almost black
        const crackColor = this.zoneType === 'Volcanic Wastes' ? 0xFF4500 : // Orange Red
                          (this.zoneType === 'Dark Sanctum' ? 0x8B0000 : // Dark Red
                          0xE3CF57); // Sulfur Yellow (default)
        
        // Create obsidian material with high reflectivity
        const obsidianMaterial = new THREE.MeshStandardMaterial({
            color: obsidianColor,
            roughness: 0.1,
            metalness: this.reflectivity,
            envMapIntensity: 1.5
        });
        
        // Create glowing crack material if enabled
        let crackMaterial;
        if (this.hasGlowingCracks) {
            crackMaterial = new THREE.MeshStandardMaterial({
                color: crackColor,
                roughness: 0.3,
                metalness: 0.7,
                emissive: crackColor,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.9
            });
        }
        
        // Create formation based on type
        switch(this.formationType) {
            case 0: // Spikes
                this.createObsidianSpikes(formationGroup, obsidianMaterial, crackMaterial);
                break;
                
            case 1: // Slab
                this.createObsidianSlab(formationGroup, obsidianMaterial, crackMaterial);
                break;
                
            case 2: // Cluster
                this.createObsidianCluster(formationGroup, obsidianMaterial, crackMaterial);
                break;
                
            default:
                this.createObsidianSpikes(formationGroup, obsidianMaterial, crackMaterial);
        }
        
        // Add base rock
        const baseGeometry = new THREE.CylinderGeometry(
            this.size * 0.8,
            this.size * 1,
            this.size * 0.3,
            8
        );
        
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.rock || 0x696969, // Dim Gray
            roughness: 0.9,
            metalness: 0.1
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -this.size * 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        
        formationGroup.add(base);
        
        // Add ambient glow if the formation has glowing cracks
        if (this.hasGlowingCracks) {
            const light = new THREE.PointLight(crackColor, 1, this.size * 3);
            light.position.y = this.size * 0.5;
            formationGroup.add(light);
        }
        
        // Position the entire formation at the specified position
        formationGroup.position.copy(this.position);
        
        return formationGroup;
    }
    
    /**
     * Create obsidian spikes formation
     * @param {THREE.Group} group - The group to add spikes to
     * @param {THREE.Material} obsidianMaterial - The obsidian material
     * @param {THREE.Material} crackMaterial - The crack material (optional)
     */
    createObsidianSpikes(group, obsidianMaterial, crackMaterial) {
        const spikeCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < spikeCount; i++) {
            // Create spike
            const height = this.size * (0.8 + Math.random() * 1.2);
            const radius = this.size * (0.1 + Math.random() * 0.15);
            
            const spikeGeometry = new THREE.ConeGeometry(radius, height, 5);
            const spike = new THREE.Mesh(spikeGeometry, obsidianMaterial);
            
            // Position spike
            const angle = (i / spikeCount) * Math.PI * 2 + Math.random() * 0.5;
            const distance = this.size * Math.random() * 0.5;
            
            spike.position.x = Math.cos(angle) * distance;
            spike.position.z = Math.sin(angle) * distance;
            spike.position.y = height / 2;
            
            // Random rotation and slight tilt
            spike.rotation.y = Math.random() * Math.PI;
            spike.rotation.x = (Math.random() - 0.5) * 0.3;
            spike.rotation.z = (Math.random() - 0.5) * 0.3;
            
            spike.castShadow = true;
            
            group.add(spike);
            
            // Add glowing cracks if enabled
            if (crackMaterial && this.hasGlowingCracks) {
                const crackCount = 1 + Math.floor(Math.random() * 2);
                
                for (let j = 0; j < crackCount; j++) {
                    // Create a thin, jagged line as a crack
                    const points = [];
                    const segments = 5 + Math.floor(Math.random() * 5);
                    const crackHeight = height * (0.3 + Math.random() * 0.6);
                    const startY = height * Math.random() * 0.3;
                    
                    for (let k = 0; k <= segments; k++) {
                        const y = startY + (k / segments) * crackHeight;
                        const xOffset = (Math.random() - 0.5) * radius * 0.4;
                        const zOffset = (Math.random() - 0.5) * radius * 0.4;
                        
                        points.push(new THREE.Vector3(xOffset, y, zOffset));
                    }
                    
                    const crackGeometry = new THREE.TubeGeometry(
                        new THREE.CatmullRomCurve3(points),
                        segments,
                        radius * 0.05,
                        8,
                        false
                    );
                    
                    const crack = new THREE.Mesh(crackGeometry, crackMaterial);
                    crack.rotation.y = Math.random() * Math.PI * 2;
                    
                    spike.add(crack);
                }
            }
        }
    }
    
    /**
     * Create obsidian slab formation
     * @param {THREE.Group} group - The group to add slab to
     * @param {THREE.Material} obsidianMaterial - The obsidian material
     * @param {THREE.Material} crackMaterial - The crack material (optional)
     */
    createObsidianSlab(group, obsidianMaterial, crackMaterial) {
        // Create main slab
        const width = this.size * (1 + Math.random() * 0.5);
        const height = this.size * (1.2 + Math.random() * 0.8);
        const depth = this.size * (0.2 + Math.random() * 0.3);
        
        const slabGeometry = new THREE.BoxGeometry(width, height, depth);
        const slab = new THREE.Mesh(slabGeometry, obsidianMaterial);
        
        slab.position.y = height / 2;
        
        // Slight random rotation
        slab.rotation.y = Math.random() * Math.PI;
        slab.rotation.x = (Math.random() - 0.5) * 0.2;
        slab.rotation.z = (Math.random() - 0.5) * 0.2;
        
        slab.castShadow = true;
        
        group.add(slab);
        
        // Add glowing cracks if enabled
        if (crackMaterial && this.hasGlowingCracks) {
            const crackCount = 2 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < crackCount; i++) {
                // Create a thin, jagged plane as a crack
                const crackShape = new THREE.Shape();
                
                // Start point
                const startX = -width / 2 + Math.random() * width * 0.3;
                const startY = -height / 2 + Math.random() * height * 0.3;
                
                crackShape.moveTo(startX, startY);
                
                // Create jagged path
                const points = 3 + Math.floor(Math.random() * 4);
                let currentX = startX;
                let currentY = startY;
                
                for (let j = 0; j < points; j++) {
                    // Random direction but generally moving upward and across
                    const nextX = currentX + (Math.random() * width * 0.4);
                    const nextY = currentY + (Math.random() * height * 0.4);
                    
                    // Add some jaggedness
                    const midX = (currentX + nextX) / 2 + (Math.random() - 0.5) * width * 0.1;
                    const midY = (currentY + nextY) / 2 + (Math.random() - 0.5) * height * 0.1;
                    
                    crackShape.lineTo(midX, midY);
                    crackShape.lineTo(nextX, nextY);
                    
                    currentX = nextX;
                    currentY = nextY;
                }
                
                // Create geometry from shape
                const crackGeometry = new THREE.ShapeGeometry(crackShape);
                const crack = new THREE.Mesh(crackGeometry, crackMaterial);
                
                // Position crack on slab surface
                crack.position.z = depth / 2 + 0.01; // Slightly above surface
                
                // Add to random side of slab
                if (Math.random() > 0.5) {
                    crack.position.z *= -1;
                    crack.rotation.y = Math.PI;
                }
                
                slab.add(crack);
            }
        }
        
        // Add smaller fragments around the main slab
        const fragmentCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < fragmentCount; i++) {
            const fragWidth = width * (0.2 + Math.random() * 0.3);
            const fragHeight = height * (0.2 + Math.random() * 0.3);
            const fragDepth = depth;
            
            const fragGeometry = new THREE.BoxGeometry(fragWidth, fragHeight, fragDepth);
            const fragment = new THREE.Mesh(fragGeometry, obsidianMaterial);
            
            // Position fragment around the main slab
            const angle = Math.random() * Math.PI * 2;
            const distance = this.size * (0.7 + Math.random() * 0.3);
            
            fragment.position.x = Math.cos(angle) * distance;
            fragment.position.z = Math.sin(angle) * distance;
            fragment.position.y = fragHeight / 2;
            
            // Random rotation
            fragment.rotation.y = Math.random() * Math.PI;
            fragment.rotation.x = (Math.random() - 0.5) * 0.5;
            fragment.rotation.z = (Math.random() - 0.5) * 0.5;
            
            fragment.castShadow = true;
            
            group.add(fragment);
        }
    }
    
    /**
     * Create obsidian cluster formation
     * @param {THREE.Group} group - The group to add cluster to
     * @param {THREE.Material} obsidianMaterial - The obsidian material
     * @param {THREE.Material} crackMaterial - The crack material (optional)
     */
    createObsidianCluster(group, obsidianMaterial, crackMaterial) {
        const clusterCount = 5 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < clusterCount; i++) {
            // Create a random geometric shape for variety
            let geometry;
            const shapeType = Math.floor(Math.random() * 3);
            const size = this.size * (0.3 + Math.random() * 0.5);
            
            switch(shapeType) {
                case 0:
                    geometry = new THREE.OctahedronGeometry(size, 0);
                    break;
                case 1:
                    geometry = new THREE.TetrahedronGeometry(size, 0);
                    break;
                case 2:
                    geometry = new THREE.DodecahedronGeometry(size, 0);
                    break;
                default:
                    geometry = new THREE.OctahedronGeometry(size, 0);
            }
            
            const crystal = new THREE.Mesh(geometry, obsidianMaterial);
            
            // Position crystal in the cluster
            const angle = Math.random() * Math.PI * 2;
            const radius = this.size * Math.random() * 0.7;
            const height = size * (0.5 + Math.random() * 0.5);
            
            crystal.position.x = Math.cos(angle) * radius;
            crystal.position.z = Math.sin(angle) * radius;
            crystal.position.y = height;
            
            // Random rotation
            crystal.rotation.x = Math.random() * Math.PI;
            crystal.rotation.y = Math.random() * Math.PI;
            crystal.rotation.z = Math.random() * Math.PI;
            
            crystal.castShadow = true;
            
            group.add(crystal);
            
            // Add glowing cracks if enabled
            if (crackMaterial && this.hasGlowingCracks && Math.random() > 0.5) {
                // Create a simple glowing edge
                const edgeGeometry = new THREE.EdgesGeometry(geometry);
                const edges = new THREE.LineSegments(
                    edgeGeometry,
                    new THREE.LineBasicMaterial({
                        color: crackMaterial.color,
                        transparent: true,
                        opacity: 0.7,
                        linewidth: 1
                    })
                );
                
                crystal.add(edges);
            }
        }
        
        // Add connecting obsidian "veins" between some crystals
        if (clusterCount > 3) {
            const veinCount = Math.floor(clusterCount / 2);
            
            for (let i = 0; i < veinCount; i++) {
                // Select two random crystals to connect
                const crystal1 = group.children[1 + Math.floor(Math.random() * clusterCount)];
                const crystal2 = group.children[1 + Math.floor(Math.random() * clusterCount)];
                
                // Skip if same crystal or either is undefined
                if (!crystal1 || !crystal2 || crystal1 === crystal2) continue;
                
                // Create a tube connecting the crystals
                const points = [];
                points.push(new THREE.Vector3().copy(crystal1.position));
                
                // Add some midpoints for a curved path
                const midPoint = new THREE.Vector3().addVectors(crystal1.position, crystal2.position).multiplyScalar(0.5);
                midPoint.y -= Math.random() * this.size * 0.3; // Dip down slightly
                
                points.push(midPoint);
                points.push(new THREE.Vector3().copy(crystal2.position));
                
                const curve = new THREE.CatmullRomCurve3(points);
                const veinGeometry = new THREE.TubeGeometry(curve, 8, this.size * 0.05, 8, false);
                const vein = new THREE.Mesh(veinGeometry, obsidianMaterial);
                
                vein.castShadow = true;
                
                group.add(vein);
                
                // Add glowing crack along the vein if enabled
                if (crackMaterial && this.hasGlowingCracks) {
                    const crackGeometry = new THREE.TubeGeometry(curve, 8, this.size * 0.02, 8, false);
                    const crack = new THREE.Mesh(crackGeometry, crackMaterial);
                    
                    group.add(crack);
                }
            }
        }
    }
}