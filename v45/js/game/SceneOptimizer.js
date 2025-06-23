import * as THREE from 'three';

/**
 * Utility class for optimizing Three.js scenes
 */
export class SceneOptimizer {
    /**
     * Apply optimizations to a Three.js scene
     * @param {THREE.Scene} scene - The scene to optimize
     */
    static optimizeScene(scene) {
        // Apply scene-wide optimizations
        scene.traverse(object => {
            if (object.isMesh) {
                // Enable frustum culling
                object.frustumCulled = true;
                
                // Optimize shadows
                if (object.castShadow) {
                    object.castShadow = true;
                    // Only update shadow when object moves
                    object.matrixAutoUpdate = true;
                }
                
                // Optimize materials
                if (object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    
                    materials.forEach(material => {
                        // Set precision based on device capability
                        material.precision = 'mediump';
                        
                        // Only use fog if scene has fog
                        material.fog = !!scene.fog;
                        
                        // Optimize textures if present
                        if (material.map) {
                            material.map.anisotropy = 1;
                        }
                    });
                }
            }
            
            // Optimize lights
            if (object.isLight) {
                if (object.shadow) {
                    // Set initial shadow map size based on performance level
                    object.shadow.mapSize.width = 1024;
                    object.shadow.mapSize.height = 1024;
                    
                    // Optimize shadow camera frustum
                    if (object.shadow.camera) {
                        // Tighten shadow camera frustum to scene size
                        const camera = object.shadow.camera;
                        if (camera.isOrthographicCamera) {
                            // Adjust based on scene size
                            const size = 20;
                            camera.left = -size;
                            camera.right = size;
                            camera.top = size;
                            camera.bottom = -size;
                            camera.updateProjectionMatrix();
                        }
                    }
                }
            }
        });
        
        console.debug("Scene optimizations applied");
    }
    
    /**
     * Optimize a specific mesh
     * @param {THREE.Mesh} mesh - The mesh to optimize
     * @param {boolean} hasFog - Whether the scene has fog
     */
    static optimizeMesh(mesh, hasFog = true) {
        // Enable frustum culling
        mesh.frustumCulled = true;
        
        // Optimize materials
        if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            
            materials.forEach(material => {
                // Set precision based on device capability
                material.precision = 'mediump';
                
                // Only use fog if scene has fog
                material.fog = hasFog;
                
                // Optimize textures if present
                if (material.map) {
                    material.map.anisotropy = 1;
                }
            });
        }
    }
    
    /**
     * Optimize a light for better performance
     * @param {THREE.Light} light - The light to optimize
     */
    static optimizeLight(light) {
        if (light.shadow) {
            // Set initial shadow map size based on performance level
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
            
            // Optimize shadow camera frustum
            if (light.shadow.camera) {
                // Tighten shadow camera frustum to scene size
                const camera = light.shadow.camera;
                if (camera.isOrthographicCamera) {
                    // Adjust based on scene size
                    const size = 20;
                    camera.left = -size;
                    camera.right = size;
                    camera.top = size;
                    camera.bottom = -size;
                    camera.updateProjectionMatrix();
                }
            }
        }
    }
}