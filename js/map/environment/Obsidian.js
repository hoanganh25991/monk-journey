import * as THREE from 'three';

/**
 * Obsidian - Creates individual obsidian rocks (different from ObsidianFormation)
 * These are smaller, sharp volcanic glass formations
 */
export class Obsidian {
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }

    /**
     * Create the obsidian mesh
     * @param {THREE.Vector3} position - Position of the obsidian
     * @param {number} size - Size scale of the obsidian
     * @param {Object} data - Additional configuration data
     * @returns {THREE.Group} - The obsidian group
     */
    createMesh(position, size, data = {}) {
        const obsidianGroup = new THREE.Group();
        
        // Create main obsidian pieces
        const pieceCount = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < pieceCount; i++) {
            this.createObsidianPiece(obsidianGroup, size, i);
        }
        
        // Add reflective highlights
        this.addReflectiveElements(obsidianGroup, size);
        
        // Position the entire group
        obsidianGroup.position.copy(position);
        
        // Add to scene
        this.scene.add(obsidianGroup);
        
        return obsidianGroup;
    }
    
    /**
     * Create individual obsidian piece
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     * @param {number} index - Piece index for variation
     */
    createObsidianPiece(group, size, index) {
        // Create sharp, angular geometry for obsidian
        const shapes = [
            new THREE.OctahedronGeometry(0.3 * size, 0),
            new THREE.TetrahedronGeometry(0.35 * size, 0),
            new THREE.ConeGeometry(0.2 * size, 0.6 * size, 6)
        ];
        
        const geometry = shapes[index % shapes.length];
        
        // Obsidian material - glossy black volcanic glass
        const obsidianMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a, // Very dark gray/black
            metalness: 0.1,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            reflectivity: 0.9,
            transmission: 0.1, // Slight transparency like real obsidian
            ior: 1.5
        });
        
        const obsidian = new THREE.Mesh(geometry, obsidianMaterial);
        
        // Position pieces relative to each other
        if (index > 0) {
            const angle = (index / 3) * Math.PI * 2;
            const offset = 0.2 * size;
            obsidian.position.x = Math.cos(angle) * offset;
            obsidian.position.z = Math.sin(angle) * offset;
        }
        
        obsidian.position.y = 0.15 * size;
        
        // Random rotation for natural look
        obsidian.rotation.x = (Math.random() - 0.5) * Math.PI * 0.3;
        obsidian.rotation.y = Math.random() * Math.PI * 2;
        obsidian.rotation.z = (Math.random() - 0.5) * Math.PI * 0.3;
        
        // Slight scale variation
        const scaleVariation = 0.8 + Math.random() * 0.4;
        obsidian.scale.set(scaleVariation, scaleVariation, scaleVariation);
        
        obsidian.castShadow = true;
        obsidian.receiveShadow = true;
        
        group.add(obsidian);
    }
    
    /**
     * Add reflective elements and highlights
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addReflectiveElements(group, size) {
        // Add small reflective facets that catch light
        const facetCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < facetCount; i++) {
            const facetGeometry = new THREE.PlaneGeometry(0.05 * size, 0.05 * size);
            const facetMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x333333,
                metalness: 0.2,
                roughness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                reflectivity: 1.0
            });
            
            const facet = new THREE.Mesh(facetGeometry, facetMaterial);
            
            // Position facets on the obsidian surface
            const angle = Math.random() * Math.PI * 2;
            const height = 0.1 * size + Math.random() * 0.2 * size;
            const radius = 0.1 * size + Math.random() * 0.1 * size;
            
            facet.position.x = Math.cos(angle) * radius;
            facet.position.z = Math.sin(angle) * radius;
            facet.position.y = height;
            
            // Orient facets outward from center
            facet.lookAt(
                facet.position.x * 2,
                facet.position.y,
                facet.position.z * 2
            );
            
            group.add(facet);
        }
        
        // Add sharp edge highlights
        this.addEdgeHighlights(group, size);
    }
    
    /**
     * Add highlights along sharp edges
     * @param {THREE.Group} group - The group to add to
     * @param {number} size - Size scale
     */
    addEdgeHighlights(group, size) {
        const edgeCount = 4 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < edgeCount; i++) {
            // Create thin line geometry for edge highlights
            const points = [];
            const startAngle = Math.random() * Math.PI * 2;
            const startRadius = 0.15 * size;
            const endRadius = 0.25 * size;
            const height = 0.1 * size + Math.random() * 0.3 * size;
            
            points.push(new THREE.Vector3(
                Math.cos(startAngle) * startRadius,
                height,
                Math.sin(startAngle) * startRadius
            ));
            
            points.push(new THREE.Vector3(
                Math.cos(startAngle) * endRadius,
                height + 0.05 * size,
                Math.sin(startAngle) * endRadius
            ));
            
            const edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.8
            });
            
            const edge = new THREE.Line(edgeGeometry, edgeMaterial);
            group.add(edge);
        }
        
        // Add subtle glow effect for the edges
        const glowGeometry = new THREE.SphereGeometry(0.4 * size, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x2a2a2a,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.15 * size;
        group.add(glow);
    }
}