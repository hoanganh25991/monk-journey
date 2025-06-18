import * as THREE from 'three';

/**
 * MysteriousPortal - Creates a mysterious portal environment object
 * A glowing portal that appears to lead to another dimension
 */
export class MysteriousPortal {
    /**
     * Create a new MysteriousPortal
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {import("../MapManager.js").MapManager} MapManager - Reference to the world manager
     */
    constructor(scene, MapManager) {
        this.scene = scene;
        this.MapManager = MapManager;
    }
    
    /**
     * Create the portal mesh
     * @param {THREE.Vector3} position - Position of the portal
     * @param {number} size - Size of the portal
     * @param {Object} data - Additional data for customization
     * @returns {THREE.Group} - The portal group
     */
    createMesh(position, size = 1, data = {}) {
        // Create a group to hold all portal elements
        const portalGroup = new THREE.Group();
        
        // Use custom properties from data if provided
        const variant = data.variant || Math.floor(Math.random() * 3);
        const glowing = data.glowing !== undefined ? data.glowing : true;
        
        // Define portal colors based on variant
        let portalColor, emissiveColor, particleColor;
        switch (variant) {
            case 0: // Blue/cyan portal
                portalColor = 0x00c8ff;
                emissiveColor = 0x00a0ff;
                particleColor = 0x80d8ff;
                break;
            case 1: // Purple/magenta portal
                portalColor = 0xc800ff;
                emissiveColor = 0xa000ff;
                particleColor = 0xd880ff;
                break;
            case 2: // Green portal
                portalColor = 0x00ff80;
                emissiveColor = 0x00c060;
                particleColor = 0x80ffc0;
                break;
            default: // Default to blue
                portalColor = 0x00c8ff;
                emissiveColor = 0x00a0ff;
                particleColor = 0x80d8ff;
        }
        
        // Create portal base (a disc)
        const baseGeometry = new THREE.CylinderGeometry(
            size * 1.5, // Top radius
            size * 1.5, // Bottom radius
            size * 0.2, // Height
            32, // Radial segments
            1, // Height segments
            false // Open ended
        );
        
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = Math.PI / 2; // Lay flat
        portalGroup.add(base);
        
        // Create portal disc (the actual portal)
        const portalGeometry = new THREE.CircleGeometry(size * 1.2, 32);
        const portalMaterial = new THREE.MeshStandardMaterial({
            color: portalColor,
            emissive: emissiveColor,
            emissiveIntensity: glowing ? 1.0 : 0.2,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.position.y = size * 0.15; // Slightly above the base
        portal.rotation.x = -Math.PI / 2; // Lay flat but facing up
        portalGroup.add(portal);
        
        // Add portal particles
        if (glowing) {
            this.addPortalParticles(portalGroup, size, particleColor);
        }
        
        // Add decorative stones around the portal
        this.addDecorativeStones(portalGroup, size);
        
        // Add runes on the base
        this.addRunes(portalGroup, size, emissiveColor);
        
        // Position the portal group
        portalGroup.position.copy(position);
        
        // Add animation data to userData
        portalGroup.userData = {
            ...portalGroup.userData,
            animationData: {
                rotationSpeed: 0.005,
                pulseSpeed: 0.02,
                pulseMin: 0.7,
                pulseMax: 1.3,
                pulsePhase: Math.random() * Math.PI * 2
            },
            type: 'mysterious_portal',
            glowing: glowing
        };
        
        // Set up animation
        this.setupAnimation(portalGroup, portal);
        
        // Add to scene
        this.scene.add(portalGroup);
        
        return portalGroup;
    }
    
    /**
     * Add particles around the portal
     * @param {THREE.Group} portalGroup - The portal group
     * @param {number} size - Size of the portal
     * @param {number} particleColor - Color of the particles
     */
    addPortalParticles(portalGroup, size, particleColor) {
        // Create particles
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Create particles in a circle around the portal
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = size * (0.8 + Math.random() * 0.7);
            const height = size * (0.1 + Math.random() * 0.3);
            
            particlePositions[i * 3] = Math.cos(angle) * radius;
            particlePositions[i * 3 + 1] = height;
            particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: particleColor,
            size: size * 0.15,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        portalGroup.add(particles);
        
        // Store reference for animation
        portalGroup.userData.particles = particles;
    }
    
    /**
     * Add decorative stones around the portal
     * @param {THREE.Group} portalGroup - The portal group
     * @param {number} size - Size of the portal
     */
    addDecorativeStones(portalGroup, size) {
        const stoneCount = 5 + Math.floor(Math.random() * 3);
        const stoneGroup = new THREE.Group();
        
        for (let i = 0; i < stoneCount; i++) {
            const angle = (i / stoneCount) * Math.PI * 2;
            const radius = size * 2;
            
            // Create a stone
            const stoneGeometry = new THREE.BoxGeometry(
                size * 0.3, 
                size * (0.8 + Math.random() * 0.4), 
                size * 0.3
            );
            
            const stoneMaterial = new THREE.MeshStandardMaterial({
                color: 0x555555,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            
            // Position the stone
            stone.position.x = Math.cos(angle) * radius;
            stone.position.z = Math.sin(angle) * radius;
            stone.position.y = size * 0.4; // Half height
            
            // Rotate the stone slightly
            stone.rotation.y = angle + (Math.random() - 0.5) * 0.5;
            stone.rotation.x = (Math.random() - 0.5) * 0.2;
            stone.rotation.z = (Math.random() - 0.5) * 0.2;
            
            stoneGroup.add(stone);
        }
        
        portalGroup.add(stoneGroup);
    }
    
    /**
     * Add runes on the base of the portal
     * @param {THREE.Group} portalGroup - The portal group
     * @param {number} size - Size of the portal
     * @param {number} glowColor - Color of the glowing runes
     */
    addRunes(portalGroup, size, glowColor) {
        const runeCount = 8;
        const runeGroup = new THREE.Group();
        
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const radius = size * 1.3;
            
            // Create a rune (simple glowing symbol)
            const runeGeometry = new THREE.PlaneGeometry(size * 0.3, size * 0.3);
            const runeMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: glowColor,
                emissiveIntensity: 1.0,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            
            // Position the rune
            rune.position.x = Math.cos(angle) * radius;
            rune.position.z = Math.sin(angle) * radius;
            rune.position.y = size * 0.11; // Just above the base
            
            // Rotate to lay flat
            rune.rotation.x = -Math.PI / 2;
            
            runeGroup.add(rune);
        }
        
        portalGroup.add(runeGroup);
        
        // Store reference for animation
        portalGroup.userData.runes = runeGroup;
    }
    
    /**
     * Setup animation for the portal
     * @param {THREE.Group} portalGroup - The portal group
     * @param {THREE.Mesh} portal - The portal mesh
     */
    setupAnimation(portalGroup, portal) {
        // Animation is handled by the game loop
        // We just store the necessary data in userData
        
        // Store the original scale for pulsing effect
        portal.userData = {
            ...portal.userData,
            originalScale: portal.scale.clone(),
            time: Math.random() * 1000 // Random start time for variation
        };
    }
}