import * as THREE from 'three';

/**
 * SwampLight - Creates a glowing light effect for swamp environments
 * Represents the eerie, bioluminescent lights that appear in swamps
 */
export class SwampLight {
    /**
     * Create a new SwampLight
     * @param {THREE.Scene} scene - The scene to add the swamp light to
     * @param {Object} worldManager - The world manager
     * @param {THREE.Vector3} position - The position of the swamp light
     * @param {number} size - The size multiplier for the swamp light
     * @param {Object} data - Additional configuration data
     */
    constructor(scene, worldManager, position, size, data = {}) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.position = position;
        this.size = size || 1.0;
        this.data = data;
        
        // Create the swamp light mesh
        this.object = this.createMesh();
    }
    
    /**
     * Create the swamp light mesh
     * @returns {THREE.Group} - The swamp light group
     */
    createMesh() {
        const group = new THREE.Group();
        
        // Create the glowing orb
        const orbGeometry = new THREE.SphereGeometry(0.2 * this.size, 16, 16);
        const orbMaterial = new THREE.MeshLambertMaterial({
            color: 0x7AFFB2, // Pale green-blue color
            emissive: 0x3A7F59, // Emissive color for glow effect
            transparent: true,
            opacity: 0.8
        });
        
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        
        // Add a point light for the glow effect
        const light = new THREE.PointLight(0x7AFFB2, 1.5, 3 * this.size);
        light.position.set(0, 0, 0);
        
        // Create a wispy effect around the orb
        const wisps = this.createWisps();
        
        // Add everything to the group
        group.add(orb);
        group.add(light);
        group.add(wisps);
        
        // Position the group
        group.position.copy(this.position);
        
        // Add a slight hover animation
        this.setupAnimation(group);
        
        // Add to scene
        this.scene.add(group);
        
        return group;
    }
    
    /**
     * Create wispy effects around the main orb
     * @returns {THREE.Group} - Group containing wispy particles
     */
    createWisps() {
        const wispsGroup = new THREE.Group();
        const numWisps = 5;
        
        for (let i = 0; i < numWisps; i++) {
            // Create a small, glowing particle
            const wispGeometry = new THREE.SphereGeometry(0.05 * this.size, 8, 8);
            const wispMaterial = new THREE.MeshLambertMaterial({
                color: 0x7AFFB2,
                emissive: 0x3A7F59,
                transparent: true,
                opacity: 0.6
            });
            
            const wisp = new THREE.Mesh(wispGeometry, wispMaterial);
            
            // Position the wisp in a random orbit around the main orb
            const angle = Math.random() * Math.PI * 2;
            const radius = (0.3 + Math.random() * 0.2) * this.size;
            wisp.position.x = Math.cos(angle) * radius;
            wisp.position.y = (Math.random() - 0.5) * 0.2 * this.size;
            wisp.position.z = Math.sin(angle) * radius;
            
            // Store the original position and a random speed for animation
            wisp.userData.originalPosition = wisp.position.clone();
            wisp.userData.speed = 0.5 + Math.random() * 0.5;
            wisp.userData.angle = angle;
            
            wispsGroup.add(wisp);
        }
        
        return wispsGroup;
    }
    
    /**
     * Set up animation for the swamp light
     * @param {THREE.Group} group - The group to animate
     */
    setupAnimation(group) {
        // Store initial position
        group.userData.originalY = group.position.y;
        
        // Set up animation parameters
        group.userData.animationTime = Math.random() * Math.PI * 2;
        group.userData.hoverSpeed = 0.5 + Math.random() * 0.5;
        group.userData.hoverHeight = 0.1 * this.size;
        
        // Set up wisp animation
        if (this.worldManager && this.worldManager.animationManager) {
            this.worldManager.animationManager.registerAnimation((deltaTime) => {
                // Hover animation for the main group
                group.userData.animationTime += deltaTime * group.userData.hoverSpeed;
                group.position.y = group.userData.originalY + 
                    Math.sin(group.userData.animationTime) * group.userData.hoverHeight;
                
                // Animate each wisp
                group.children[2].children.forEach(wisp => {
                    wisp.userData.angle += deltaTime * wisp.userData.speed;
                    
                    const radius = wisp.userData.originalPosition.length();
                    wisp.position.x = Math.cos(wisp.userData.angle) * radius;
                    wisp.position.z = Math.sin(wisp.userData.angle) * radius;
                });
                
                return true; // Keep the animation running
            });
        }
    }
}

export default SwampLight;