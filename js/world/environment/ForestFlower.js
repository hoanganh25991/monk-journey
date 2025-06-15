import * as THREE from 'three';

/**
 * Forest Flower - A specialized flower variant for forest environments
 * Features more vibrant colors and unique shapes compared to standard flowers
 */
export class ForestFlower {
    constructor(scene, worldManager) {
        this.scene = scene;
        this.worldManager = worldManager;
    }
    
    /**
     * Create a forest flower mesh
     * @param {THREE.Vector3} position - Position of the flower
     * @param {number} size - Size multiplier for the flower
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The flower group
     */
    createMesh(position, size = 1, data = {}) {
        // Create a group to hold all parts of the flower
        const flowerGroup = new THREE.Group();
        
        // Get color variations from data or use defaults
        const petalColor = data.petalColor || this.getRandomPetalColor();
        const centerColor = data.centerColor || this.getComplementaryColor(petalColor);
        const stemColor = data.stemColor || 0x2E7D32; // Default to forest green
        
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.03 * size, 0.05 * size, 0.4 * size, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: stemColor });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        // Create leaves (2-3 small leaves on the stem)
        const leafCount = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < leafCount; i++) {
            const leafGeometry = new THREE.PlaneGeometry(0.15 * size, 0.08 * size);
            const leafMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x388E3C, 
                side: THREE.DoubleSide 
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position leaf along stem
            const heightPercent = 0.1 + (i / leafCount) * 0.6;
            leaf.position.y = heightPercent * 0.4 * size;
            
            // Rotate leaf outward from stem
            const angle = (i / leafCount) * Math.PI * 2;
            leaf.rotation.y = angle;
            leaf.rotation.x = Math.PI / 4;
            
            stem.add(leaf);
        }
        
        // Create flower head based on random type
        const flowerType = data.flowerType || Math.floor(Math.random() * 3);
        let flowerHead;
        
        switch (flowerType) {
            case 0:
                // Bell-shaped flower
                flowerHead = this.createBellFlower(size, petalColor, centerColor);
                break;
            case 1:
                // Star-shaped flower
                flowerHead = this.createStarFlower(size, petalColor, centerColor);
                break;
            case 2:
            default:
                // Cluster flower
                flowerHead = this.createClusterFlower(size, petalColor, centerColor);
                break;
        }
        
        // Position flower head at top of stem
        flowerHead.position.y = 0.4 * size;
        
        // Add slight random rotation for natural look
        flowerGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Add parts to the group
        flowerGroup.add(stem);
        flowerGroup.add(flowerHead);
        
        // Position the flower
        flowerGroup.position.copy(position);
        
        // Add to scene if scene is provided
        if (this.scene) {
            this.scene.add(flowerGroup);
        }
        
        return flowerGroup;
    }
    
    /**
     * Create a bell-shaped flower
     * @param {number} size - Size multiplier
     * @param {number} petalColor - Color for petals
     * @param {number} centerColor - Color for flower center
     * @returns {THREE.Group} - The flower head group
     */
    createBellFlower(size, petalColor, centerColor) {
        const flowerHead = new THREE.Group();
        
        // Create bell shape
        const bellGeometry = new THREE.ConeGeometry(0.15 * size, 0.25 * size, 6, 1, true);
        const bellMaterial = new THREE.MeshLambertMaterial({ 
            color: petalColor,
            side: THREE.DoubleSide
        });
        const bell = new THREE.Mesh(bellGeometry, bellMaterial);
        bell.rotation.x = Math.PI; // Flip to point downward
        
        // Create center stamen
        const stamenGeometry = new THREE.CylinderGeometry(0.02 * size, 0.02 * size, 0.3 * size, 8);
        const stamenMaterial = new THREE.MeshLambertMaterial({ color: centerColor });
        const stamen = new THREE.Mesh(stamenGeometry, stamenMaterial);
        stamen.position.y = -0.1 * size; // Position inside bell
        
        flowerHead.add(bell);
        flowerHead.add(stamen);
        
        return flowerHead;
    }
    
    /**
     * Create a star-shaped flower
     * @param {number} size - Size multiplier
     * @param {number} petalColor - Color for petals
     * @param {number} centerColor - Color for flower center
     * @returns {THREE.Group} - The flower head group
     */
    createStarFlower(size, petalColor, centerColor) {
        const flowerHead = new THREE.Group();
        
        // Create center
        const centerGeometry = new THREE.SphereGeometry(0.08 * size, 16, 8);
        const centerMaterial = new THREE.MeshLambertMaterial({ color: centerColor });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        
        // Create petals (5-7 petals)
        const petalCount = Math.floor(Math.random() * 3) + 5;
        for (let i = 0; i < petalCount; i++) {
            const petalGeometry = new THREE.PlaneGeometry(0.2 * size, 0.08 * size);
            const petalMaterial = new THREE.MeshLambertMaterial({ 
                color: petalColor,
                side: THREE.DoubleSide
            });
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            // Position petal around center
            const angle = (i / petalCount) * Math.PI * 2;
            petal.position.x = Math.cos(angle) * 0.1 * size;
            petal.position.z = Math.sin(angle) * 0.1 * size;
            
            // Rotate petal to face outward
            petal.rotation.y = angle;
            petal.rotation.x = Math.PI / 4;
            
            flowerHead.add(petal);
        }
        
        flowerHead.add(center);
        
        return flowerHead;
    }
    
    /**
     * Create a cluster flower (multiple small blooms)
     * @param {number} size - Size multiplier
     * @param {number} petalColor - Color for petals
     * @param {number} centerColor - Color for flower center
     * @returns {THREE.Group} - The flower head group
     */
    createClusterFlower(size, petalColor, centerColor) {
        const flowerHead = new THREE.Group();
        
        // Create multiple small blooms (5-9 blooms)
        const bloomCount = Math.floor(Math.random() * 5) + 5;
        
        for (let i = 0; i < bloomCount; i++) {
            // Create a small bloom
            const bloomGeometry = new THREE.SphereGeometry(0.05 * size, 8, 6);
            
            // Vary colors slightly for each bloom
            const hue = this.getHueVariation(petalColor, 0.1);
            const bloomMaterial = new THREE.MeshLambertMaterial({ color: hue });
            const bloom = new THREE.Mesh(bloomGeometry, bloomMaterial);
            
            // Position bloom in a cluster pattern
            const angle = (i / bloomCount) * Math.PI * 2;
            const radius = 0.08 * size;
            bloom.position.x = Math.cos(angle) * radius;
            bloom.position.z = Math.sin(angle) * radius;
            
            // Random height variation
            bloom.position.y = (Math.random() * 0.05 - 0.025) * size;
            
            flowerHead.add(bloom);
        }
        
        // Add center bloom
        const centerGeometry = new THREE.SphereGeometry(0.06 * size, 8, 6);
        const centerMaterial = new THREE.MeshLambertMaterial({ color: centerColor });
        const centerBloom = new THREE.Mesh(centerGeometry, centerMaterial);
        flowerHead.add(centerBloom);
        
        return flowerHead;
    }
    
    /**
     * Get a random petal color for the flower
     * @returns {number} - The color as a hex value
     */
    getRandomPetalColor() {
        // Forest flowers tend to have more vibrant colors
        const colors = [
            0xE91E63, // Pink
            0x9C27B0, // Purple
            0x673AB7, // Deep Purple
            0x3F51B5, // Indigo
            0x2196F3, // Blue
            0x03A9F4, // Light Blue
            0x00BCD4, // Cyan
            0x009688, // Teal
            0x4CAF50, // Green
            0x8BC34A, // Light Green
            0xCDDC39, // Lime
            0xFFEB3B, // Yellow
            0xFFC107, // Amber
            0xFF9800, // Orange
            0xFF5722  // Deep Orange
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Get a complementary color
     * @param {number} color - The base color
     * @returns {number} - A complementary color
     */
    getComplementaryColor(color) {
        // Extract RGB components
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // Convert to HSL, rotate hue by 180 degrees, convert back to RGB
        const [h, s, l] = this.rgbToHsl(r, g, b);
        const newH = (h + 0.5) % 1;
        const [newR, newG, newB] = this.hslToRgb(newH, s, l);
        
        // Convert back to hex
        return (newR << 16) | (newG << 8) | newB;
    }
    
    /**
     * Get a color with slight hue variation
     * @param {number} color - The base color
     * @param {number} variation - Amount of variation (0-1)
     * @returns {number} - The new color
     */
    getHueVariation(color, variation) {
        // Extract RGB components
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // Convert to HSL, adjust hue slightly, convert back to RGB
        const [h, s, l] = this.rgbToHsl(r, g, b);
        const newH = (h + (Math.random() * variation * 2 - variation) + 1) % 1;
        const [newR, newG, newB] = this.hslToRgb(newH, s, l);
        
        // Convert back to hex
        return (newR << 16) | (newG << 8) | newB;
    }
    
    /**
     * Convert RGB to HSL
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Array} - [h, s, l] values (0-1)
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return [h, s, l];
    }
    
    /**
     * Convert HSL to RGB
     * @param {number} h - Hue (0-1)
     * @param {number} s - Saturation (0-1)
     * @param {number} l - Lightness (0-1)
     * @returns {Array} - [r, g, b] values (0-255)
     */
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}