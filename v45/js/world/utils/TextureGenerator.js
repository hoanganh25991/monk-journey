import * as THREE from 'three';

/**
 * Utility class for generating textures
 */
export class TextureGenerator {
    /**
     * Create a procedural texture
     * @param {number} baseColor - Base color (hex)
     * @param {number} darkColor - Dark color for details (hex)
     * @param {number} size - Texture size
     * @returns {THREE.Texture} - The generated texture
     */
    static createProceduralTexture(baseColor, darkColor, size = 256) {
        // Create a canvas for the texture
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Fill with base color
        context.fillStyle = '#' + new THREE.Color(baseColor).getHexString();
        context.fillRect(0, 0, size, size);
        
        // Add noise pattern
        const darkColorStyle = '#' + new THREE.Color(darkColor).getHexString();
        
        // Create a noise pattern with small dots
        for (let y = 0; y < size; y += 2) {
            for (let x = 0; x < size; x += 2) {
                if (Math.random() < 0.2) {
                    context.fillStyle = darkColorStyle;
                    const dotSize = 1 + Math.random();
                    context.fillRect(x, y, dotSize, dotSize);
                }
            }
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10); // Repeat the texture to avoid visible tiling
        
        return texture;
    }
    
    /**
     * Create a gradient texture
     * @param {number} topColor - Top color (hex)
     * @param {number} bottomColor - Bottom color (hex)
     * @param {number} size - Texture size
     * @returns {THREE.Texture} - The generated texture
     */
    static createGradientTexture(topColor, bottomColor, size = 256) {
        // Create a canvas for the texture
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#' + new THREE.Color(topColor).getHexString());
        gradient.addColorStop(1, '#' + new THREE.Color(bottomColor).getHexString());
        
        // Fill with gradient
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    /**
     * Create a noise texture
     * @param {number} baseColor - Base color (hex)
     * @param {number} noiseColor - Noise color (hex)
     * @param {number} size - Texture size
     * @param {number} density - Noise density (0-1)
     * @returns {THREE.Texture} - The generated texture
     */
    static createNoiseTexture(baseColor, noiseColor, size = 256, density = 0.3) {
        // Create a canvas for the texture
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Fill with base color
        context.fillStyle = '#' + new THREE.Color(baseColor).getHexString();
        context.fillRect(0, 0, size, size);
        
        // Add noise pattern
        context.fillStyle = '#' + new THREE.Color(noiseColor).getHexString();
        
        const noiseScale = size / 10;
        for (let y = 0; y < size; y += noiseScale) {
            for (let x = 0; x < size; x += noiseScale) {
                if (Math.random() < density) {
                    context.fillRect(x, y, noiseScale, noiseScale);
                }
            }
        }
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        return texture;
    }
}