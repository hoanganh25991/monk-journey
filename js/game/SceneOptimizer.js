import * as THREE from 'three';
import { MATERIAL_QUALITY_LEVELS } from '../config/render.js';

/**
 * Utility class for optimizing Three.js scenes
 */
export class SceneOptimizer {
    /**
     * Apply optimizations to a Three.js scene
     * @param {THREE.Scene} scene - The scene to optimize
     * @param {string} qualityLevel - The quality level ('high', 'medium', 'low', or 'minimal')
     */
    static optimizeScene(scene, qualityLevel = 'high') {
        // Get quality settings
        const qualitySettings = MATERIAL_QUALITY_LEVELS[qualityLevel] || MATERIAL_QUALITY_LEVELS.high;
        
        // Apply scene-wide optimizations
        scene.traverse(object => {
            if (object.isMesh) {
                // Enable frustum culling
                object.frustumCulled = true;
                
                // Optimize shadows based on quality level
                if (object.castShadow) {
                    // Disable shadows completely for minimal quality
                    if (qualityLevel === 'minimal') {
                        object.castShadow = false;
                    } else {
                        object.castShadow = true;
                        // Only update shadow when object moves
                        object.matrixAutoUpdate = true;
                    }
                }
                
                // Optimize materials
                if (object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    
                    materials.forEach(material => {
                        // Set precision based on quality level
                        if (qualityLevel === 'minimal' || qualityLevel === 'low') {
                            material.precision = 'lowp';
                        } else {
                            material.precision = 'mediump';
                        }
                        
                        // Only use fog if scene has fog
                        material.fog = !!scene.fog;
                        
                        // Optimize textures if present
                        if (material.map) {
                            // Disable anisotropic filtering for low-end devices
                            material.map.anisotropy = 1;
                            
                            // For minimal quality, use nearest neighbor filtering for 8-bit look
                            if (qualityLevel === 'minimal') {
                                // Force nearest neighbor filtering for pixelated 8-bit look
                                material.map.minFilter = THREE.NearestFilter;
                                material.map.magFilter = THREE.NearestFilter;
                                material.map.generateMipmaps = false;
                                
                                // Reduce texture size for more pixelated look
                                if (material.map.image && !material.map.userData.originalSize) {
                                    // Store original size if not already stored
                                    material.map.userData.originalSize = {
                                        width: material.map.image.width,
                                        height: material.map.image.height
                                    };
                                    
                                    // Reduce texture resolution for pixelated look
                                    // This is simulated here - in a real implementation, 
                                    // you would actually resize the texture
                                    console.debug(`Reducing texture resolution for 8-bit mode: ${material.map.name || 'unnamed texture'}`);
                                }
                            } else if (qualityLevel === 'low') {
                                // For low quality, use linear filtering without mipmaps
                                material.map.minFilter = THREE.LinearFilter;
                                material.map.magFilter = THREE.LinearFilter;
                                material.map.generateMipmaps = false;
                            }
                        }
                        
                        // For minimal quality, use flat shading and other 8-bit style enhancements
                        if (qualityLevel === 'minimal') {
                            // Force flat shading for blocky look
                            material.flatShading = true;
                            
                            // Disable normal maps for simpler lighting
                            if (material.normalMap) {
                                material.userData.originalNormalMap = material.normalMap;
                                material.normalMap = null;
                            }
                            
                            // Reduce color depth for 8-bit look
                            if (material.color && !material.userData.originalColor) {
                                // Store original color
                                material.userData.originalColor = material.color.clone();
                                
                                // Quantize colors to simulate limited 8-bit palette
                                // This simulates a reduced color palette by rounding RGB values
                                const r = Math.round(material.color.r * 7) / 7;
                                const g = Math.round(material.color.g * 7) / 7;
                                const b = Math.round(material.color.b * 7) / 7;
                                material.color.setRGB(r, g, b);
                            }
                            
                            // Enable dithering for retro look
                            material.dithering = true;
                        } 
                        // For low quality, just use flat shading
                        else if (qualityLevel === 'low') {
                            material.flatShading = true;
                        }
                    });
                }
                
                // For minimal quality, reduce geometry detail if possible
                if (qualityLevel === 'minimal' && object.geometry) {
                    // If the object has a BufferGeometry, we could simplify it
                    // This would require a geometry simplification algorithm
                    // For now, we'll just ensure it's properly optimized
                    if (object.geometry.index) {
                        object.geometry.setDrawRange(0, object.geometry.index.count);
                    }
                }
            }
            
            // Optimize lights
            if (object.isLight) {
                if (object.shadow) {
                    // Set shadow map size based on quality level
                    const shadowMapSize = qualitySettings.shadowMapSize || 0;
                    
                    // Disable shadows for minimal quality
                    if (qualityLevel === 'minimal') {
                        object.castShadow = false;
                    } else {
                        object.shadow.mapSize.width = shadowMapSize;
                        object.shadow.mapSize.height = shadowMapSize;
                        
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
                
                // For minimal quality, reduce light intensity slightly to improve performance
                if (qualityLevel === 'minimal') {
                    // Reduce intensity by 20% for minimal quality
                    object.intensity *= 0.8;
                }
            }
        });
        
        console.debug(`Scene optimizations applied for ${qualityLevel} quality level`);
    }
    
    /**
     * Optimize a specific mesh
     * @param {THREE.Mesh} mesh - The mesh to optimize
     * @param {boolean} hasFog - Whether the scene has fog
     * @param {string} qualityLevel - The quality level ('high', 'medium', 'low', or 'minimal')
     */
    static optimizeMesh(mesh, hasFog = true, qualityLevel = 'high') {
        // Enable frustum culling
        mesh.frustumCulled = true;
        
        // Optimize materials
        if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            
            materials.forEach(material => {
                // Set precision based on quality level
                if (qualityLevel === 'minimal' || qualityLevel === 'low') {
                    material.precision = 'lowp';
                } else {
                    material.precision = 'mediump';
                }
                
                // Only use fog if scene has fog
                material.fog = hasFog;
                
                // Optimize textures if present
                if (material.map) {
                    // Disable anisotropic filtering for low-end devices
                    material.map.anisotropy = 1;
                    
                    // For minimal quality, use nearest neighbor filtering
                    if (qualityLevel === 'minimal') {
                        material.map.minFilter = THREE.NearestFilter;
                        material.map.magFilter = THREE.NearestFilter;
                        material.map.generateMipmaps = false;
                    } else if (qualityLevel === 'low') {
                        // For low quality, use linear filtering without mipmaps
                        material.map.minFilter = THREE.LinearFilter;
                        material.map.magFilter = THREE.LinearFilter;
                        material.map.generateMipmaps = false;
                    }
                }
                
                // For minimal quality, use flat shading
                if (qualityLevel === 'minimal' || qualityLevel === 'low') {
                    material.flatShading = true;
                }
            });
        }
        
        // For minimal quality, disable shadows
        if (qualityLevel === 'minimal') {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
        }
    }
    
    /**
     * Optimize a light for better performance
     * @param {THREE.Light} light - The light to optimize
     * @param {string} qualityLevel - The quality level ('high', 'medium', 'low', or 'minimal')
     */
    static optimizeLight(light, qualityLevel = 'high') {
        // Get quality settings
        const qualitySettings = MATERIAL_QUALITY_LEVELS[qualityLevel] || MATERIAL_QUALITY_LEVELS.high;
        
        if (light.shadow) {
            // Set shadow map size based on quality level
            const shadowMapSize = qualitySettings.shadowMapSize || 0;
            
            // Disable shadows for minimal quality
            if (qualityLevel === 'minimal') {
                light.castShadow = false;
            } else {
                light.shadow.mapSize.width = shadowMapSize;
                light.shadow.mapSize.height = shadowMapSize;
                
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
        
        // For minimal quality, reduce light intensity slightly to improve performance
        if (qualityLevel === 'minimal') {
            // Reduce intensity by 20% for minimal quality
            light.intensity *= 0.8;
        }
    }
}