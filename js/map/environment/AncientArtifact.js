import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents an ancient artifact environment object
 * These are mysterious relics from a bygone era
 */
export class AncientArtifact extends EnvironmentObject {
    /**
     * Create a new ancient artifact
     * @param {THREE.Scene} scene - The scene to add the artifact to
     * @param {Object} MapManager - The map manager
     * @param {THREE.Vector3} position - The position of the artifact
     * @param {number} size - The size of the artifact
     */
    constructor(scene, MapManager, position, size = 1) {
        super(scene, MapManager, position, size, 'ancient_artifact');
        
        // Randomize artifact properties
        this.artifactType = Math.floor(Math.random() * 4); // 0: orb, 1: tablet, 2: statue, 3: mechanism
        this.hasInscriptions = Math.random() > 0.3; // 70% chance to have inscriptions
        this.isActivated = Math.random() > 0.7; // 30% chance to be activated/glowing
        
        // Get zone type from map manager if available
        const zoneInfo = MapManager?.getCurrentZoneInfo?.(position);
        this.zoneType = zoneInfo?.type || 'Ruins';
        
        // Create the artifact
        this.object = this.create();
    }
    
    /**
     * Create the ancient artifact mesh
     * @returns {THREE.Group} - The ancient artifact group
     */
    create() {
        const artifactGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Ruins;
        
        // Determine artifact color based on zone and type
        let artifactColor, glowColor, inscriptionColor;
        let emissiveIntensity = this.isActivated ? 0.7 : 0.1;
        
        switch(this.zoneType) {
            case 'Ruins':
                artifactColor = 0xA9A9A9; // Dark Gray
                glowColor = 0xD8BFD8; // Thistle
                inscriptionColor = 0xFFD700; // Gold
                break;
            case 'Desert':
                artifactColor = 0xEDC9AF; // Desert Sand
                glowColor = 0xFFA500; // Orange
                inscriptionColor = 0xB8860B; // Dark Goldenrod
                break;
            case 'Mountain':
                artifactColor = 0xA9A9A9; // Dark Gray
                glowColor = 0xADD8E6; // Light Blue
                inscriptionColor = 0x87CEEB; // Sky Blue
                break;
            case 'Swamp':
                artifactColor = 0x708090; // Slate Gray
                glowColor = 0x40E0D0; // Turquoise
                inscriptionColor = 0x20B2AA; // Light Sea Green
                break;
            case 'Forest':
                artifactColor = 0x36454F; // Charcoal
                glowColor = 0x6B8E23; // Olive Drab
                inscriptionColor = 0x9ACD32; // Yellow Green
                break;
            case 'Dark Sanctum':
                artifactColor = 0x0C0C0C; // Obsidian Black
                glowColor = 0xE3CF57; // Sulfur Yellow
                inscriptionColor = 0x8B0000; // Dark Red
                emissiveIntensity = this.isActivated ? 0.9 : 0.2;
                break;
            case 'Ancient Tech':
                artifactColor = 0xA9A9A9; // Dark Gray
                glowColor = 0x00FFFF; // Cyan
                inscriptionColor = 0x7FFF00; // Chartreuse
                emissiveIntensity = this.isActivated ? 0.9 : 0.2;
                break;
            default:
                artifactColor = 0xA9A9A9; // Dark Gray
                glowColor = 0xD8BFD8; // Thistle
                inscriptionColor = 0xFFD700; // Gold
        }
        
        // Create base/pedestal
        const baseGeometry = new THREE.CylinderGeometry(
            this.size * 0.5,
            this.size * 0.6,
            this.size * 0.3,
            8
        );
        
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.structure || 0x708090,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = this.size * 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        
        artifactGroup.add(base);
        
        // Create artifact material
        const artifactMaterial = new THREE.MeshStandardMaterial({
            color: artifactColor,
            roughness: 0.4,
            metalness: 0.6,
            emissive: this.isActivated ? glowColor : 0x000000,
            emissiveIntensity: emissiveIntensity
        });
        
        // Create artifact geometry based on type
        let artifact;
        
        switch(this.artifactType) {
            case 0: // Orb
                const orbGeometry = new THREE.SphereGeometry(this.size * 0.3, 16, 16);
                artifact = new THREE.Mesh(orbGeometry, artifactMaterial);
                artifact.position.y = this.size * 0.6;
                break;
                
            case 1: // Tablet
                const tabletGeometry = new THREE.BoxGeometry(
                    this.size * 0.6,
                    this.size * 0.5,
                    this.size * 0.1
                );
                artifact = new THREE.Mesh(tabletGeometry, artifactMaterial);
                artifact.position.y = this.size * 0.55;
                // Slight tilt
                artifact.rotation.x = -Math.PI / 6;
                break;
                
            case 2: // Statue
                // Create a simple humanoid statue
                const bodyGeometry = new THREE.CylinderGeometry(
                    this.size * 0.15,
                    this.size * 0.2,
                    this.size * 0.4,
                    8
                );
                const body = new THREE.Mesh(bodyGeometry, artifactMaterial);
                body.position.y = this.size * 0.5;
                
                const headGeometry = new THREE.SphereGeometry(this.size * 0.15, 12, 12);
                const head = new THREE.Mesh(headGeometry, artifactMaterial);
                head.position.y = this.size * 0.75;
                
                artifact = new THREE.Group();
                artifact.add(body);
                artifact.add(head);
                break;
                
            case 3: // Mechanism
                // Create a complex mechanical device
                const centerGeometry = new THREE.CylinderGeometry(
                    this.size * 0.2,
                    this.size * 0.2,
                    this.size * 0.1,
                    12
                );
                const center = new THREE.Mesh(centerGeometry, artifactMaterial);
                center.position.y = this.size * 0.5;
                center.rotation.x = Math.PI / 2;
                
                const ringGeometry = new THREE.TorusGeometry(
                    this.size * 0.3,
                    this.size * 0.05,
                    16,
                    32
                );
                const ring = new THREE.Mesh(ringGeometry, artifactMaterial);
                ring.position.y = this.size * 0.5;
                
                const ring2Geometry = new THREE.TorusGeometry(
                    this.size * 0.3,
                    this.size * 0.05,
                    16,
                    32
                );
                const ring2 = new THREE.Mesh(ring2Geometry, artifactMaterial);
                ring2.position.y = this.size * 0.5;
                ring2.rotation.x = Math.PI / 2;
                
                artifact = new THREE.Group();
                artifact.add(center);
                artifact.add(ring);
                artifact.add(ring2);
                break;
                
            default:
                const defaultGeometry = new THREE.SphereGeometry(this.size * 0.3, 16, 16);
                artifact = new THREE.Mesh(defaultGeometry, artifactMaterial);
                artifact.position.y = this.size * 0.6;
        }
        
        artifact.castShadow = true;
        artifactGroup.add(artifact);
        
        // Add inscriptions if enabled
        if (this.hasInscriptions) {
            const inscriptionMaterial = new THREE.MeshBasicMaterial({
                color: inscriptionColor,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            // Add inscriptions based on artifact type
            if (this.artifactType === 0) { // Orb
                // Add circular patterns around the orb
                const ringCount = 2 + Math.floor(Math.random() * 2);
                
                for (let i = 0; i < ringCount; i++) {
                    const inscriptionGeometry = new THREE.RingGeometry(
                        this.size * (0.31 + i * 0.03),
                        this.size * (0.33 + i * 0.03),
                        32
                    );
                    
                    const inscription = new THREE.Mesh(inscriptionGeometry, inscriptionMaterial);
                    inscription.position.copy(artifact.position);
                    inscription.lookAt(new THREE.Vector3(0, 10, 0)); // Face upward
                    
                    artifactGroup.add(inscription);
                }
            } else if (this.artifactType === 1) { // Tablet
                // Add inscription lines on the tablet
                const lineCount = 3 + Math.floor(Math.random() * 3);
                const lineWidth = this.size * 0.5;
                const lineHeight = this.size * 0.05;
                const startY = artifact.position.y - this.size * 0.15;
                
                for (let i = 0; i < lineCount; i++) {
                    const lineGeometry = new THREE.PlaneGeometry(lineWidth, lineHeight);
                    const line = new THREE.Mesh(lineGeometry, inscriptionMaterial);
                    
                    line.position.set(0, startY + i * (lineHeight * 1.5), this.size * 0.06);
                    line.rotation.x = -Math.PI / 6; // Match tablet tilt
                    
                    artifactGroup.add(line);
                }
            } else if (this.artifactType === 2 || this.artifactType === 3) { // Statue or Mechanism
                // Add glowing symbols around the base
                const symbolCount = 4 + Math.floor(Math.random() * 3);
                
                for (let i = 0; i < symbolCount; i++) {
                    const angle = (i / symbolCount) * Math.PI * 2;
                    const symbolGeometry = new THREE.PlaneGeometry(this.size * 0.15, this.size * 0.15);
                    const symbol = new THREE.Mesh(symbolGeometry, inscriptionMaterial);
                    
                    const radius = this.size * 0.5;
                    symbol.position.x = Math.cos(angle) * radius;
                    symbol.position.z = Math.sin(angle) * radius;
                    symbol.position.y = this.size * 0.16;
                    
                    symbol.rotation.x = -Math.PI / 2; // Lay flat on base
                    
                    artifactGroup.add(symbol);
                }
            }
        }
        
        // Add point light for glow effect if activated
        if (this.isActivated) {
            const light = new THREE.PointLight(glowColor, 1, this.size * 5);
            light.position.y = artifact.position.y;
            artifactGroup.add(light);
        }
        
        // Position the entire artifact at the specified position
        artifactGroup.position.copy(this.position);
        
        return artifactGroup;
    }
}