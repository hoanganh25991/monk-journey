import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { qualityLevels } from '../config/quality-levels.js';
import { RENDER_CONFIG } from '../config/render.js';

export class PerformanceManager {
    constructor(game) {
        this.game = game;
        this.targetFPS = 60; // Changed from 30 to 60 for better default performance
        this.fpsHistory = [];
        this.historySize = 30; // Store last 30 frames for smoothing
        this.adaptiveQualityEnabled = false; // Disabled by default
        this.lastOptimizationTime = 0;
        this.optimizationInterval = 1000; // Check every second
        this.lastPerformanceAlertTime = 0;
        this.performanceAlertInterval = 10000; // Show alert every 10 seconds at most
        
        // Quality is now managed through settings menu, not dynamically adjusted
        
        // FPS multiplier for display
        this.fpsDisplayMultiplier = 1.0; // Display actual FPS value
        
        // Standard width for all indicators
        this.standardIndicatorWidth = '100px';
        
        this.memoryUsage = {
            current: 0,
            peak: 0,
            lastCheck: 0,
            checkInterval: 2000 // Check memory every 2 seconds
        };
        this.qualityLevels = qualityLevels;
        
        // Load quality level from local storage or use 'ultra' as default
        this.currentQuality = localStorage.getItem('monk_journey_quality_level') || 'ultra';
        this.stats = null;
        this.memoryDisplay = null;
        this.disposalQueue = []; // Queue for objects to be disposed
        this.disposalInterval = 5000; // Process disposal queue every 5 seconds
        this.lastDisposalTime = 0;
    }
    
    init() {
        // Initialize Stats.js for FPS monitoring
        this.stats = new Stats();
        this.applyStandardIndicatorStyle(this.stats.dom, 0);
        
        // Modify Stats.js to show 1.5x FPS
        this.modifyStatsDisplay();
        
        document.body.appendChild(this.stats.dom);
        
        // Create memory usage display
        this.createMemoryDisplay();
        
        // Add GPU indicator next to Stats.js
        this.createGPUIndicator();
        
        // Create quality level indicator
        this.createQualityIndicator();
        
        // Apply initial quality settings
        this.applyQualitySettings(this.currentQuality);
        
        // Enable WebGL optimizations
        this.enableOptimizations();
        
        // Initialize garbage collection helper
        this.initGarbageCollectionHelper();
        
        // Check if performance info should be visible
        this.applyPerformanceInfoVisibility();
        
        console.debug("Performance Manager initialized with quality:", this.currentQuality);
        
        return this;
    }
    
    /**
     * Apply performance info visibility based on localStorage setting
     */
    applyPerformanceInfoVisibility() {
        // Get the stored value or default to true (show performance info)
        const showPerformanceInfo = localStorage.getItem('monk_journey_show_performance_info');
        const showPerformanceInfoValue = showPerformanceInfo === null ? true : showPerformanceInfo === 'true';
        
        // Set visibility based on the setting
        if (this.stats) this.stats.dom.style.display = showPerformanceInfoValue ? 'block' : 'none';
        if (this.memoryDisplay) this.memoryDisplay.style.display = showPerformanceInfoValue ? 'block' : 'none';
        if (this.gpuEnabledIndicator) this.gpuEnabledIndicator.style.display = showPerformanceInfoValue ? 'block' : 'none';
        if (this.qualityIndicator) this.qualityIndicator.style.display = showPerformanceInfoValue ? 'block' : 'none';
    }
    
    // Apply standard styling to all indicators
    applyStandardIndicatorStyle(element, topPosition) {
        element.style.position = 'absolute';
        element.style.top = topPosition + 'px';
        element.style.right = '0px';
        element.style.left = 'auto';
        element.style.width = this.standardIndicatorWidth;
        element.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        element.style.color = '#0ff';
        element.style.fontSize = '11px';
        element.style.fontFamily = 'monospace';
        element.style.borderRadius = '3px 0 0 3px';
        element.style.zIndex = '100';
        element.style.opacity = '0.5';
        element.style.transition = 'opacity 0.2s';
        element.style.boxSizing = 'border-box'; // Ensure padding is included in width
        
        // Add hover effect to increase opacity
        element.addEventListener('mouseenter', () => {
            element.style.opacity = '1';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.opacity = '0.5';
        });
        
        // Ensure any canvas elements inside use full width
        const canvases = element.querySelectorAll('canvas');
        if (canvases.length > 0) {
            canvases.forEach(canvas => {
                // canvas.style.width = '100%';
                // canvas.style.height = '48px';
                // canvas.style.display = 'block'; // Keep hide other charts, wait to click to
                canvas.style.margin = 'auto';
            });
        }
    }
    
    // Modify Stats.js to show 1.5x FPS and ensure canvas uses full width
    modifyStatsDisplay() {
        // Get the original update method
        const originalUpdate = this.stats.update;
        
        // Override the update method to show 1.5x FPS
        this.stats.update = () => {
            // Call the original update method
            originalUpdate.call(this.stats);
            
            // Find the FPS panel (first panel)
            const fpsPanel = this.stats.dom.children[0];
            if (fpsPanel) {
                // Find the text element that displays the FPS
                const fpsText = fpsPanel.querySelector('.fps');
                if (fpsText) {
                    // Get the current FPS value
                    const currentFPS = parseInt(fpsText.textContent);
                    if (!isNaN(currentFPS)) {
                        // Calculate the multiplied FPS
                        const multipliedFPS = Math.round(currentFPS * this.fpsDisplayMultiplier);
                        // Update the display
                        fpsText.textContent = multipliedFPS + ' FPS';
                    }
                }
                
                // Find the canvas element and ensure it uses full width
                const canvas = fpsPanel.querySelector('canvas');
                if (canvas) {
                    // Set canvas to use full width of its container
                    canvas.style.width = '100%';
                    canvas.style.height = '48px'; // Maintain height
                    canvas.style.display = 'block'; // Ensure block display
                }
            }
        };
        
        // Apply the canvas fix immediately after initialization
        setTimeout(() => {
            const panels = this.stats.dom.children;
            for (let i = 0; i < panels.length; i++) {
                const canvas = panels[i].querySelector('canvas');
                if (canvas) {
                    canvas.style.width = '100%';
                    canvas.style.height = '48px';
                    canvas.style.display = 'block';
                }
            }
        }, 0);
    }
    
    createQualityIndicator() {
        // Create quality indicator container
        this.qualityIndicator = document.createElement('div');
        this.qualityIndicator.id = 'quality-indicator';
        this.applyStandardIndicatorStyle(this.qualityIndicator, 48 + 5 + 14 + 5 + 14 + 5); // Position below memory display
        
        // Update the quality text
        this.updateQualityIndicator();

        document.body.appendChild(this.qualityIndicator);
    }
    
    updateQualityIndicator() {
        if (!this.qualityIndicator) return;
        
        // Get color based on quality level
        let qualityColor;
        switch (this.currentQuality) {
            case 'ultra':
                qualityColor = '#ff00ff'; // Purple for ultra
                break;
            case 'high':
                qualityColor = '#00ff00'; // Green for high
                break;
            case 'medium':
                qualityColor = '#ffff00'; // Yellow for medium
                break;
            case 'low':
                qualityColor = '#ff8800'; // Orange for low
                break;
            case 'minimal':
                qualityColor = '#ff0000'; // Red for minimal
                break;
            default:
                qualityColor = '#ffffff'; // White for unknown
        }
        
        // Update the indicator text
        this.qualityIndicator.innerHTML = `
            <div style="color: ${qualityColor}; font-weight: bold;">
                QUALITY: ${this.currentQuality.toUpperCase()}
            </div>
            <div style="font-size: 10px; color: #aaa; margin-top: 2px;">
                Target FPS: ${this.targetFPS} | Click to change
            </div>
        `;
    }
    
    createMemoryDisplay() {
        // Create memory display container
        this.memoryDisplay = document.createElement('div');
        this.memoryDisplay.id = 'memory-display';
        this.applyStandardIndicatorStyle(this.memoryDisplay, 48 + 5); // Position below stats.js
        this.memoryDisplay.textContent = 'MEM: 0 MB';
        
        document.body.appendChild(this.memoryDisplay);
    }
    
    initGarbageCollectionHelper() {
        // Set up periodic garbage collection suggestion
        setInterval(() => {
            // Suggest garbage collection to browser
            if (window.gc) {
                try {
                    window.gc();
                    console.debug("Manual garbage collection triggered");
                } catch (e) {
                    console.debug("Manual garbage collection not available");
                }
            }
        }, 60000); // Every minute
    }
    
    createGPUIndicator() {
        // Create GPU Enabled indicator below memory stats
        this.gpuEnabledIndicator = document.createElement('div');
        this.gpuEnabledIndicator.id = 'gpu-enabled-indicator';
        this.applyStandardIndicatorStyle(this.gpuEnabledIndicator, 48 + 5 + 14 + 5); // Position below quality indicator
        this.gpuEnabledIndicator.textContent = 'GPU Enabled';
        
        // Create GPU info panel (hidden by default)
        this.gpuInfoPanel = document.createElement('div');
        this.gpuInfoPanel.id = 'gpu-info-panel';
        this.gpuInfoPanel.style.position = 'absolute';
        this.gpuInfoPanel.style.top = '0px';
        this.gpuInfoPanel.style.right = '0px';
        this.gpuInfoPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.gpuInfoPanel.style.color = '#0ff';
        this.gpuInfoPanel.style.padding = '10px';
        this.gpuInfoPanel.style.fontSize = '12px';
        this.gpuInfoPanel.style.fontFamily = 'monospace';
        this.gpuInfoPanel.style.borderRadius = '3px 0 0 3px';
        this.gpuInfoPanel.style.zIndex = '1002';
        this.gpuInfoPanel.style.display = 'none';
        this.gpuInfoPanel.style.width = '250px'; // Wider panel for GPU info
        
        // Get GPU information
        const gpuInfo = this.getGPUInfo();
        this.gpuInfoPanel.innerHTML = gpuInfo;
        
        // Add click event to show/hide GPU info panel for the new indicator
        this.gpuEnabledIndicator.addEventListener('click', () => {
            if (this.gpuInfoPanel.style.display === 'block') {
                this.gpuInfoPanel.style.display = 'none';
            } else {
                this.gpuInfoPanel.style.display = 'block';
            }
        });

        this.gpuInfoPanel.addEventListener('click', () => {
            if (this.gpuInfoPanel.style.display === 'block') {
                this.gpuInfoPanel.style.display = 'none';
            } else {
                this.gpuInfoPanel.style.display = 'block';
            }
        });
        
        // Add to document
        document.body.appendChild(this.gpuEnabledIndicator);
        document.body.appendChild(this.gpuInfoPanel);
    }
    
    getGPUInfo() {
        // Get WebGL context from the renderer
        const gl = this.game.renderer.getContext();
        
        // Get GPU information
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        
        let gpuVendor = 'Unknown';
        let gpuRenderer = 'Unknown';
        
        if (debugInfo) {
            gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        
        // Get WebGL version
        const glVersion = gl.getParameter(gl.VERSION);
        const glslVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
        
        // Get max texture size
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        
        // Get max viewport dimensions
        const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
        
        // Get max render buffer size
        const maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        
        // Get acceleration status
        const accelerated = this.isGPUAccelerated();
        
        // Format the information
        return `
            <div style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;">GPU INFORMATION</div>
            <div><span style="color: #aaa;">Vendor:</span> ${gpuVendor}</div>
            <div><span style="color: #aaa;">Renderer:</span> ${gpuRenderer}</div>
            <div><span style="color: #aaa;">WebGL Version:</span> ${glVersion}</div>
            <div><span style="color: #aaa;">GLSL Version:</span> ${glslVersion}</div>
            <div><span style="color: #aaa;">Max Texture Size:</span> ${maxTextureSize}px</div>
            <div><span style="color: #aaa;">Max Viewport:</span> ${maxViewportDims[0]}x${maxViewportDims[1]}</div>
            <div><span style="color: #aaa;">Max Render Buffer:</span> ${maxRenderBufferSize}</div>
            <div><span style="color: #aaa;">Hardware Acceleration:</span> ${accelerated ? '<span style="color: #4CAF50;">Enabled</span>' : '<span style="color: #F44336;">Disabled</span>'}</div>
            <div><span style="color: #aaa;">Power Preference:</span> <span style="color: #4CAF50;">High Performance</span></div>
            <div style="margin-top: 5px; font-size: 10px; color: #aaa;">GPU acceleration is ${accelerated ? 'active' : 'not active'} for this session.</div>
        `;
    }
    
    isGPUAccelerated() {
        // Check if GPU acceleration is enabled
        // This is a best-effort detection as there's no foolproof way to detect GPU acceleration
        
        // Method 1: Check for hardware acceleration via canvas
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return false; // WebGL not supported
        }
        
        // Method 2: Check for specific GPU features
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // If renderer string contains terms like "SwiftShader", "ANGLE", or "llvmpipe", 
            // it might be software rendering
            const softwareRenderers = ['swiftshader', 'llvmpipe', 'software', 'mesa'];
            const isSoftware = softwareRenderers.some(term => 
                renderer.toLowerCase().includes(term)
            );
            
            return !isSoftware;
        }
        
        // Method 3: Check if the renderer has high-performance setting
        if (this.game && this.game.renderer) {
            return this.game.renderer.getContext().getContextAttributes().powerPreference === 'high-performance';
        }
        
        // Default to true if we can't determine
        return true;
    }
    
    update(delta) {
        // Update stats.js
        if (this.stats) {
            this.stats.update();
        }
        
        // Calculate current FPS
        const fps = 1 / delta;
        
        // Add to history
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > this.historySize) {
            this.fpsHistory.shift();
        }
        
        // Calculate average FPS
        const avgFPS = this.fpsHistory.reduce((sum, value) => sum + value, 0) / this.fpsHistory.length;
        
        // Check memory usage periodically
        const now = performance.now();
        if (now - this.memoryUsage.lastCheck > this.memoryUsage.checkInterval) {
            this.updateMemoryUsage(avgFPS);
            this.memoryUsage.lastCheck = now;
        }
        
        // Process disposal queue
        if (now - this.lastDisposalTime > this.disposalInterval) {
            this.processDisposalQueue();
            this.lastDisposalTime = now;
        }
        
        // Adaptive quality has been removed - quality is now set through settings menu
    }
    
    updateMemoryUsage(avgFPS) {
        // Get memory info if available
        if (window.performance && window.performance.memory) {
            const memInfo = window.performance.memory;
            const usedHeapSize = memInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
            const totalHeapSize = memInfo.totalJSHeapSize / (1024 * 1024); // Convert to MB
            
            this.memoryUsage.current = usedHeapSize;
            this.memoryUsage.peak = Math.max(this.memoryUsage.peak, usedHeapSize);
            
            // Calculate percentage used
            const percentUsed = (usedHeapSize / totalHeapSize) * 100;
            
            // Update memory display
            if (this.memoryDisplay) {
                this.memoryDisplay.textContent = `MEM: ${usedHeapSize.toFixed(0)}MB`;
                
                // Change color based on memory usage
                if (percentUsed > 80) {
                    this.memoryDisplay.style.color = '#ff5555'; // Red for high usage
                } else if (percentUsed > 60) {
                    this.memoryDisplay.style.color = '#ffff55'; // Yellow for medium usage
                } else {
                    this.memoryDisplay.style.color = '#55ff55'; // Green for low usage
                }
            }
            
            // Log high memory usage but don't auto-adjust quality
            if (percentUsed > 90) {
                console.debug(`High memory usage detected (${percentUsed.toFixed(1)}%)`);
            }
        } else {
            // If memory API is not available
            if (this.memoryDisplay) {
                this.memoryDisplay.textContent = 'MEM: Not available';
            }
        }
    }
    
    processDisposalQueue() {
        if (this.disposalQueue.length === 0) return;
        
        console.debug(`Processing disposal queue: ${this.disposalQueue.length} items`);
        
        // Process a batch of items from the queue
        const batchSize = Math.min(20, this.disposalQueue.length);
        const batch = this.disposalQueue.splice(0, batchSize);
        
        batch.forEach(item => {
            try {
                if (item.geometry) {
                    item.geometry.dispose();
                }
                
                if (item.material) {
                    // Handle array of materials
                    if (Array.isArray(item.material)) {
                        item.material.forEach(mat => {
                            this.disposeMaterial(mat);
                        });
                    } else {
                        this.disposeMaterial(item.material);
                    }
                }
                
                if (item.dispose && typeof item.dispose === 'function') {
                    item.dispose();
                }
                
                // Remove from parent if applicable
                if (item.parent) {
                    item.parent.remove(item);
                }
                
                // Clear any references
                if (item.clear && typeof item.clear === 'function') {
                    item.clear();
                }
            } catch (error) {
                console.error("Error disposing object:", error);
            }
        });
        
        // Force a garbage collection hint
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                // Ignore if not available
            }
        }
    }
    
    disposeMaterial(material) {
        if (!material) return;
        
        // Dispose textures
        const textureProps = [
            'map', 'normalMap', 'bumpMap', 'specularMap', 'emissiveMap',
            'roughnessMap', 'metalnessMap', 'alphaMap', 'aoMap',
            'envMap', 'lightMap', 'displacementMap'
        ];
        
        textureProps.forEach(prop => {
            if (material[prop]) {
                material[prop].dispose();
            }
        });
        
        // Dispose material
        material.dispose();
    }
    
    queueForDisposal(object) {
        if (!object) return;
        
        // Add to disposal queue
        this.disposalQueue.push(object);
        
        // If queue is getting too large, process immediately
        if (this.disposalQueue.length > 100) {
            this.processDisposalQueue();
        }
    }
    
    // The adjustQuality method has been removed
    // Quality is now managed through the settings menu and localStorage
    
    // The increaseQuality method has been removed
    // Quality is now managed through the settings menu and localStorage
    
    // The decreaseQuality method has been removed
    // Quality is now managed through the settings menu and localStorage

    applyQualitySettings(qualityLevel) {
        if (!this.qualityLevels[qualityLevel] || !RENDER_CONFIG[qualityLevel]) {
            console.error(`Unknown quality level: ${qualityLevel}`);
            return;
        }
        
        const settings = this.qualityLevels[qualityLevel];
        const renderSettings = RENDER_CONFIG[qualityLevel];
        const previousQuality = this.currentQuality;
        this.currentQuality = qualityLevel;
        
        // Log quality change
        if (previousQuality !== qualityLevel) {
            console.debug(`Quality changed from ${previousQuality} to ${qualityLevel}`);
        }
        
        // Update renderer settings
        const renderer = this.game.renderer;
        
        // Apply renderer settings using Game's applyRendererSettings method
        this.game.applyRendererSettings(renderer, qualityLevel);
        
        // Update shadow map size for all lights
        this.updateShadowMapSizes(settings.shadowMapSize);
        
        // Update fog density based on draw distance
        if (this.game.scene.fog) {
            this.game.scene.fog.density = 0.002 * (1 / settings.drawDistance);
        }
        
        // Apply texture quality settings
        this.updateTextureQuality(settings.textureQuality);
        
        // Apply object detail settings
        this.updateObjectDetail(settings.objectDetail, settings.maxVisibleObjects);
        
        // Update antialiasing
        // Note: Changing antialiasing requires recreating the renderer
        // This is expensive, so we only do it when necessary
        if (renderer.antialias !== renderSettings.init.antialias) {
            console.debug("Antialiasing change requires renderer recreation - skipping");
            // In a real implementation, we would recreate the renderer here
        }
        
        // Update particle manager settings if available
        if (this.game.particleManager) {
            // Set low performance mode for low and minimal quality levels
            const lowPerformanceMode = (qualityLevel === 'low' || qualityLevel === 'minimal');
            this.game.particleManager.setPerformanceMode(lowPerformanceMode);
            console.debug(`Particle manager performance mode set to: ${lowPerformanceMode ? 'LOW' : 'HIGH'}`);
        }
        
        // Update the quality indicator in the UI
        this.updateQualityIndicator();
        
        // Force a renderer update
        renderer.clear();
        
        // Quality has been updated
        console.debug(`Quality settings applied: ${qualityLevel}`);
    }
    
    updateTextureQuality(qualityMultiplier) {
        // Apply texture quality settings to all textures in the scene
        this.game.scene.traverse(object => {
            if (object.isMesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                
                materials.forEach(material => {
                    // Update texture properties if they exist
                    if (material.map) {
                        // Adjust anisotropy based on quality
                        const maxAnisotropy = this.game.renderer.capabilities.getMaxAnisotropy();
                        material.map.anisotropy = Math.max(1, Math.floor(maxAnisotropy * qualityMultiplier));
                        
                        // Adjust mipmaps
                        if (qualityMultiplier < 0.5) {
                            material.map.minFilter = THREE.NearestFilter;
                            material.map.magFilter = THREE.NearestFilter;
                        } else {
                            material.map.minFilter = THREE.LinearMipmapLinearFilter;
                            material.map.magFilter = THREE.LinearFilter;
                        }
                        
                        // Force texture update
                        material.map.needsUpdate = true;
                    }
                });
            }
        });
    }
    
    updateObjectDetail(detailMultiplier, maxVisibleObjects) {
        // Apply object detail settings
        let visibleObjectCount = 0;
        
        this.game.scene.traverse(object => {
            if (object.isMesh) {
                // Count visible objects
                visibleObjectCount++;
                
                // Hide objects beyond the max visible count
                if (visibleObjectCount > maxVisibleObjects) {
                    object.visible = false;
                    return;
                }
                
                // Show objects within the limit
                object.visible = true;
                
                // Adjust level of detail if available
                if (object.userData && object.userData.lod) {
                    const lodLevel = detailMultiplier < 0.3 ? 2 : // Low detail
                                    detailMultiplier < 0.7 ? 1 : // Medium detail
                                    0; // High detail
                    
                    // Apply LOD level if the object supports it
                    if (typeof object.userData.setLOD === 'function') {
                        object.userData.setLOD(lodLevel);
                    }
                }
                
                // Simplify geometry for low detail levels
                if (detailMultiplier < 0.5 && object.geometry && object.geometry.attributes) {
                    // For very low detail, we could implement geometry simplification here
                    // This would require storing original geometry or having LOD versions
                }
            }
        });
    }
    
    updateShadowMapSizes(size) {
        // Update shadow map size for all lights in the scene
        this.game.scene.traverse(object => {
            if (object.isLight && object.shadow) {
                object.shadow.mapSize.width = size;
                object.shadow.mapSize.height = size;
                object.shadow.map = null; // Force shadow map recreation
            }
        });
    }
    
    enableOptimizations() {
        // Enable various Three.js optimizations
        
        // 1. Optimize renderer
        const renderer = this.game.renderer;
        renderer.powerPreference = "high-performance";
        
        // 2. Enable frustum culling
        this.game.scene.traverse(object => {
            if (object.isMesh) {
                object.frustumCulled = true;
            }
        });
        
        // 3. Optimize materials
        this.game.scene.traverse(object => {
            if (object.isMesh) {
                // Optimize materials
                if (object.material) {
                    // Convert to array if it's a single material
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    
                    materials.forEach(material => {
                        // Disable unnecessary features
                        material.precision = "mediump"; // Use medium precision
                        material.fog = !!this.game.scene.fog; // Only use fog if scene has fog
                        
                        // Optimize textures
                        if (material.map) {
                            material.map.anisotropy = 1; // Reduce anisotropic filtering
                            material.map.generateMipmaps = true;
                        }
                    });
                }
                
                // Optimize geometry
                if (object.geometry) {
                    // Make sure geometry is indexed
                    if (!object.geometry.index && object.geometry.attributes.position) {
                        // Note: In a real implementation, we would index the geometry here
                        // but it's complex and requires careful handling
                    }
                }
            }
        });
        
        // 4. Optimize camera
        if (this.game.camera) {
            // Adjust near and far planes to be as tight as possible
            // This improves depth buffer precision
            this.game.camera.near = 0.1;
            this.game.camera.far = 500; // Reduce from 1000
            this.game.camera.updateProjectionMatrix();
        }
        
        // 5. Optimize physics/collision detection
        // This would depend on the specific physics system used
        
        console.debug("Applied WebGL and Three.js optimizations");
    }
    
    getParticleMultiplier() {
        return this.qualityLevels[this.currentQuality].particleCount;
    }
    
    getDrawDistanceMultiplier() {
        return this.qualityLevels[this.currentQuality].drawDistance;
    }
    
    setTargetFPS(fps) {
        this.targetFPS = fps;
    }
    
    toggleAdaptiveQuality() {
        this.adaptiveQualityEnabled = !this.adaptiveQualityEnabled;
        return this.adaptiveQualityEnabled;
    }
}