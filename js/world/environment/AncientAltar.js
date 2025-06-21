import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MATERIAL_QUALITY_LEVELS } from '../../config/render.js';

/**
 * Ancient Altar - A mystical altar found in ruins
 * Creates a stone altar with magical runes and effects
 */
export class AncientAltar {
    /**
     * Create a new Ancient Altar
     * @param {THREE.Scene} scene - The scene to add the altar to
     * @param {Object} worldManager - The world manager instance
     * @param {THREE.Vector3} position - The position of the altar
     * @param {number} size - The size multiplier for the altar
     */
    constructor(scene, worldManager, position, size = 1) {
        this.scene = scene;
        this.worldManager = worldManager;
        this.position = position;
        this.size = size;
        this.object = new THREE.Group();
        this.object.position.copy(position);
        this.object.scale.set(size, size, size);
        
        // Create the altar
        this.createAltar();
        
        // Add to scene
        this.scene.add(this.object);
    }
    
    /**
     * Create the altar mesh
     */
    createAltar() {
        // Create base altar structure
        const baseGeometry = new THREE.CylinderGeometry(1.5, 2, 0.8, 6);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.8,
            metalness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.4;
        this.object.add(base);
        
        // Create altar top
        const topGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 6);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.7,
            metalness: 0.3
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.95;
        this.object.add(top);
        
        // Create rune circle on top
        const runeGeometry = new THREE.RingGeometry(0.6, 0.8, 32);
        const runeMaterial = new THREE.MeshStandardMaterial({
            color: 0x3388ff,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0x1144aa,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        const runeCircle = new THREE.Mesh(runeGeometry, runeMaterial);
        runeCircle.rotation.x = -Math.PI / 2;
        runeCircle.position.y = 1.11;
        this.object.add(runeCircle);
        
        // Add decorative pillars around the altar
        this.addDecorativePillars();
        
        // Add magical effect
        this.addMagicalEffect();
        
        // Add collision data
        this.addCollisionData();
    }
    
    /**
     * Add decorative pillars around the altar
     */
    addDecorativePillars() {
        const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create 4 pillars around the altar
        const pillarPositions = [
            new THREE.Vector3(1.8, 0.75, 0),
            new THREE.Vector3(-1.8, 0.75, 0),
            new THREE.Vector3(0, 0.75, 1.8),
            new THREE.Vector3(0, 0.75, -1.8)
        ];
        
        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.copy(pos);
            
            // Add a small decorative top to each pillar
            const topGeometry = new THREE.SphereGeometry(0.25, 8, 8);
            const topMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.7,
                metalness: 0.3
            });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.y = 0.85;
            pillar.add(top);
            
            this.object.add(pillar);
        });
    }
    
    /**
     * Add magical effect to the altar
     */
    addMagicalEffect() {
        // Create a point light in the center
        const light = new THREE.PointLight(0x3388ff, 1.5, 10);
        light.position.y = 1.2;
        this.object.add(light);
        
        // Create a pulsing animation for the light
        this.pulseAnimation = {
            time: 0,
            update: (delta) => {
                this.pulseAnimation.time += delta;
                const intensity = 1 + 0.5 * Math.sin(this.pulseAnimation.time * 2);
                light.intensity = intensity;
                
                // Also update the emissive intensity of the rune circle
                if (this.object.children[2] && this.object.children[2].material) {
                    this.object.children[2].material.emissiveIntensity = 0.3 + 0.3 * Math.sin(this.pulseAnimation.time * 2);
                }
            }
        };
        
        // Register the animation with the world manager if available
        if (this.worldManager && this.worldManager.registerAnimation) {
            this.worldManager.registerAnimation(this.pulseAnimation.update);
        }
    }
    
    /**
     * Add collision data to the altar
     */
    addCollisionData() {
        // Add collision data if the world manager supports it
        if (this.worldManager && this.worldManager.addObjectCollider) {
            // Create a cylinder collider for the altar
            const collider = new THREE.CylinderGeometry(2, 2, 1.5, 8);
            this.worldManager.addObjectCollider(this.object, collider, {
                position: new THREE.Vector3(0, 0.75, 0),
                type: 'ancient_altar',
                isInteractable: true,
                interactionDistance: 3,
                onInteract: () => {
                    console.log('Player interacted with Ancient Altar');
                    // Trigger any special effects or gameplay events when interacted with
                    if (this.worldManager.game && this.worldManager.game.events) {
                        this.worldManager.game.events.dispatchEvent({
                            type: 'altar-interaction',
                            altar: this
                        });
                    }
                }
            });
        }
    }
}