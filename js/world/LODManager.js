import * as THREE from 'three';

/**
 * LODManager - Manages Level of Detail (LOD) for objects in the scene
 * Provides functionality to optimize rendering for distant objects
 */
export class LODManager {
    /**
     * Create a new LOD Manager
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {Object} worldManager - Reference to the world manager
     */
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
        
        // Configuration for LOD distances
        this.config = {
            // Distance thresholds for different LOD levels
            distances: {
                high: 0,      // Full detail (0-50 units)
                medium: 50,   // Medium detail (50-100 units)
                low: 100,     // Low detail (100-150 units)
                wireframe: 150, // Wireframe only (150+ units)
                outlineOnly: 200 // Only black outlines for very distant objects (200+ units)
            },
            // Whether to use wireframe for very distant objects
            useWireframeForDistant: true,
            // Whether to use edge rendering for distant objects
            useEdgeRendering: true,
            // Whether to use only outlines for extremely distant objects
            useOutlineOnlyForVeryDistant: true,
            // Whether LOD is enabled
            enabled: true
        };
        
        // Track objects with LOD applied
        this.lodObjects = new Map();
        
        // Materials for different LOD levels
        this.wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        // Edge detection material (for outline rendering)
        this.edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 1
        });
        
        // Outline-only material for very distant objects
        this.outlineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 1.5
        });
    }
    
    /**
     * Initialize the LOD Manager
     */
    init() {
        console.debug('LOD Manager initialized');
    }
    
    /**
     * Apply LOD to an object
     * @param {THREE.Object3D} object - The object to apply LOD to
     * @param {string} objectType - The type of object (tree, rock, etc.)
     * @param {THREE.Vector3} position - The position of the object
     * @returns {THREE.Object3D} - The object with LOD applied
     */
    applyLOD(object, objectType, position) {
        if (!this.config.enabled) {
            return object;
        }
        
        // Create a new LOD object
        const lod = new THREE.LOD();
        
        // Add the original high-detail object as the first level
        lod.addLevel(object, this.config.distances.high);
        
        // Create medium detail version (simplified geometry)
        const mediumDetailObject = this.createSimplifiedVersion(object, objectType, 'medium');
        if (mediumDetailObject) {
            lod.addLevel(mediumDetailObject, this.config.distances.medium);
        }
        
        // Create low detail version (very simplified geometry)
        const lowDetailObject = this.createSimplifiedVersion(object, objectType, 'low');
        if (lowDetailObject) {
            lod.addLevel(lowDetailObject, this.config.distances.low);
        }
        
        // Create wireframe version for very distant objects
        if (this.config.useWireframeForDistant) {
            const wireframeObject = this.createWireframeVersion(object);
            if (wireframeObject) {
                lod.addLevel(wireframeObject, this.config.distances.wireframe);
            }
        }
        
        // Create outline-only version for extremely distant objects
        if (this.config.useOutlineOnlyForVeryDistant) {
            const outlineObject = this.createOutlineOnlyVersion(object);
            if (outlineObject) {
                lod.addLevel(outlineObject, this.config.distances.outlineOnly);
            }
        }
        
        // Position the LOD object
        lod.position.copy(position);
        
        // Store reference to the LOD object
        this.lodObjects.set(object.uuid, lod);
        
        return lod;
    }
    
    /**
     * Create a simplified version of an object for medium/low detail
     * @param {THREE.Object3D} originalObject - The original object
     * @param {string} objectType - The type of object
     * @param {string} detailLevel - The detail level ('medium' or 'low')
     * @returns {THREE.Object3D} - The simplified object
     */
    createSimplifiedVersion(originalObject, objectType, detailLevel) {
        // Clone the original object
        const simplifiedObject = originalObject.clone();
        
        // Apply simplification based on object type and detail level
        simplifiedObject.traverse(child => {
            if (child.isMesh) {
                // Simplify geometry
                if (child.geometry) {
                    // For medium detail, reduce geometry complexity by ~50%
                    // For low detail, reduce geometry complexity by ~75%
                    const reductionFactor = detailLevel === 'medium' ? 0.5 : 0.25;
                    
                    // Create simplified materials
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        
                        materials.forEach(material => {
                            // Simplify material properties for distant objects
                            if (detailLevel === 'low') {
                                // For low detail, use a simpler material
                                const simpleMaterial = new THREE.MeshBasicMaterial({
                                    color: material.color || 0x808080,
                                    transparent: material.transparent || false,
                                    opacity: material.opacity || 1.0,
                                    side: material.side || THREE.FrontSide
                                });
                                
                                // Replace the material
                                if (Array.isArray(child.material)) {
                                    const index = child.material.indexOf(material);
                                    if (index !== -1) {
                                        child.material[index] = simpleMaterial;
                                    }
                                } else {
                                    child.material = simpleMaterial;
                                }
                            }
                        });
                    }
                }
                
                // Disable shadows for simplified versions
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });
        
        return simplifiedObject;
    }
    
    /**
     * Create a wireframe version of an object for very distant rendering
     * @param {THREE.Object3D} originalObject - The original object
     * @returns {THREE.Object3D} - The wireframe object
     */
    createWireframeVersion(originalObject) {
        // Create a new group to hold the wireframe
        const wireframeGroup = new THREE.Group();
        
        // Clone the original object
        const wireframeObject = originalObject.clone();
        
        // Apply wireframe material to all meshes
        wireframeObject.traverse(child => {
            if (child.isMesh) {
                // Store original material for reference
                child.userData.originalMaterial = child.material;
                
                // Apply wireframe material
                child.material = this.wireframeMaterial.clone();
                
                // Disable shadows
                child.castShadow = false;
                child.receiveShadow = false;
                
                // If edge rendering is enabled, add edges
                if (this.config.useEdgeRendering) {
                    const edges = new THREE.EdgesGeometry(child.geometry);
                    const line = new THREE.LineSegments(edges, this.edgeMaterial);
                    line.position.copy(child.position);
                    line.rotation.copy(child.rotation);
                    line.scale.copy(child.scale);
                    wireframeGroup.add(line);
                }
            }
        });
        
        // Add the wireframe object to the group
        wireframeGroup.add(wireframeObject);
        
        return wireframeGroup;
    }
    
    /**
     * Create an outline-only version of an object for extremely distant rendering
     * This version only shows black outlines for maximum performance
     * @param {THREE.Object3D} originalObject - The original object
     * @returns {THREE.Object3D} - The outline-only object
     */
    createOutlineOnlyVersion(originalObject) {
        // Create a new group to hold the outline
        const outlineGroup = new THREE.Group();
        
        // Process all meshes in the original object
        originalObject.traverse(child => {
            if (child.isMesh && child.geometry) {
                // Create edges geometry from the mesh
                const edges = new THREE.EdgesGeometry(child.geometry);
                
                // Create line segments with the outline material
                const line = new THREE.LineSegments(edges, this.outlineMaterial);
                
                // Copy position, rotation, and scale from the original mesh
                if (child.parent) {
                    // Get world position/rotation/scale
                    const worldPosition = new THREE.Vector3();
                    const worldQuaternion = new THREE.Quaternion();
                    const worldScale = new THREE.Vector3();
                    
                    child.getWorldPosition(worldPosition);
                    child.getWorldQuaternion(worldQuaternion);
                    child.getWorldScale(worldScale);
                    
                    // Apply to the line
                    line.position.copy(worldPosition);
                    line.quaternion.copy(worldQuaternion);
                    line.scale.copy(worldScale);
                } else {
                    // Direct copy if no parent
                    line.position.copy(child.position);
                    line.rotation.copy(child.rotation);
                    line.scale.copy(child.scale);
                }
                
                // Add to the outline group
                outlineGroup.add(line);
            }
        });
        
        return outlineGroup;
    }
    
    /**
     * Update LOD based on camera position
     * @param {THREE.Vector3} cameraPosition - The camera position
     */
    update(cameraPosition) {
        if (!this.config.enabled) {
            return;
        }
        
        // Update all LOD objects
        this.lodObjects.forEach(lodObject => {
            lodObject.update(cameraPosition);
        });
    }
    
    /**
     * Enable or disable LOD
     * @param {boolean} enabled - Whether LOD is enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }
    
    /**
     * Set LOD configuration
     * @param {Object} config - The LOD configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    
    /**
     * Get the current LOD configuration
     * @returns {Object} - The current LOD configuration
     */
    getConfig() {
        return this.config;
    }
    
    /**
     * Update LOD settings based on quality level
     * @param {string} quality - The quality level ('high', 'medium', 'low', or 'minimal')
     */
    updateQualitySettings(quality) {
        console.debug(`Updating LOD settings for quality: ${quality}`);
        
        switch (quality) {
            case 'high':
                this.config.distances = {
                    high: 0,
                    medium: 75,      // Further distances for high quality
                    low: 150,
                    wireframe: 250,
                    outlineOnly: 350
                };
                this.config.useWireframeForDistant = false;
                this.config.useOutlineOnlyForVeryDistant = false;
                break;
                
            case 'medium':
                this.config.distances = {
                    high: 0,
                    medium: 50,      // Standard distances
                    low: 100,
                    wireframe: 150,
                    outlineOnly: 200
                };
                this.config.useWireframeForDistant = true;
                this.config.useOutlineOnlyForVeryDistant = false;
                break;
                
            case 'low':
                this.config.distances = {
                    high: 0,
                    medium: 25,      // Closer distances for low quality
                    low: 50,
                    wireframe: 75,
                    outlineOnly: 100
                };
                this.config.useWireframeForDistant = true;
                this.config.useOutlineOnlyForVeryDistant = true;
                break;
                
            case 'minimal':
                this.config.distances = {
                    high: 0,
                    medium: 15,      // Very close distances for minimal quality
                    low: 30,
                    wireframe: 45,
                    outlineOnly: 60
                };
                this.config.useWireframeForDistant = true;
                this.config.useOutlineOnlyForVeryDistant = true;
                break;
                
            default:
                console.warn(`Unknown quality level for LOD: ${quality}`);
        }
        
        // Update wireframe material opacity based on quality
        if (quality === 'minimal') {
            this.wireframeMaterial.opacity = 0.3;
        } else if (quality === 'low') {
            this.wireframeMaterial.opacity = 0.4;
        } else {
            this.wireframeMaterial.opacity = 0.5;
        }
    }
}