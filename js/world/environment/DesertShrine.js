import * as THREE from 'three';
import { EnvironmentObject } from './EnvironmentObject.js';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a desert shrine environment object
 * A small sacred structure found in desert environments
 */
export class DesertShrine extends EnvironmentObject {
    /**
     * Create a new desert shrine
     * @param {THREE.Scene} scene - The scene to add the shrine to
     * @param {Object} MapManager - The world manager
     * @param {THREE.Vector3} position - The position of the shrine
     * @param {number} size - The size of the shrine
     */
    constructor(scene, MapManager, position, size = 1) {
        super(scene, MapManager, position, size, 'desert_shrine');
        
        // Randomize shrine properties
        this.shrineType = Math.floor(Math.random() * 3); // 0: obelisk, 1: altar, 2: small temple
        this.hasGlyphs = Math.random() > 0.3; // 70% chance to have glyphs/hieroglyphs
        this.hasTorches = Math.random() > 0.5; // 50% chance to have torches/fire
        
        // Get zone type from world manager if available
        this.zoneType = MapManager?.getZoneTypeAt(position.x, position.z) || 'Desert';
        
        // Create the shrine
        this.object = this.create();
    }
    
    /**
     * Create the desert shrine mesh
     * @returns {THREE.Group} - The desert shrine group
     */
    create() {
        const shrineGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Desert;
        
        // Determine colors
        const stoneColor = zoneColors.structure || 0xEDC9AF; // Desert Sand
        const accentColor = zoneColors.accent || 0xFF4500; // Sunset Orange
        const glyphColor = 0xB8860B; // Dark Goldenrod
        const fireColor = 0xFF4500; // Orange Red
        
        // Create stone material
        const stoneMaterial = new THREE.MeshStandardMaterial({
            color: stoneColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create accent material
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: accentColor,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create glyph material if needed
        let glyphMaterial;
        if (this.hasGlyphs) {
            glyphMaterial = new THREE.MeshStandardMaterial({
                color: glyphColor,
                roughness: 0.5,
                metalness: 0.5,
                emissive: glyphColor,
                emissiveIntensity: 0.2
            });
        }
        
        // Create shrine based on type
        switch(this.shrineType) {
            case 0: // Obelisk
                this.createObelisk(shrineGroup, stoneMaterial, accentMaterial, glyphMaterial);
                break;
                
            case 1: // Altar
                this.createAltar(shrineGroup, stoneMaterial, accentMaterial, glyphMaterial);
                break;
                
            case 2: // Small temple
                this.createSmallTemple(shrineGroup, stoneMaterial, accentMaterial, glyphMaterial);
                break;
                
            default:
                this.createObelisk(shrineGroup, stoneMaterial, accentMaterial, glyphMaterial);
        }
        
        // Add torches if enabled
        if (this.hasTorches) {
            const torchCount = this.shrineType === 2 ? 4 : 2;
            
            for (let i = 0; i < torchCount; i++) {
                const torch = this.createTorch(fireColor);
                
                // Position torch based on shrine type
                let radius, angle, height;
                
                if (this.shrineType === 0) { // Obelisk
                    radius = this.size * 0.7;
                    angle = (i / torchCount) * Math.PI * 2;
                    height = this.size * 0.1;
                } else if (this.shrineType === 1) { // Altar
                    radius = this.size * 0.8;
                    angle = (i / torchCount) * Math.PI * 2;
                    height = this.size * 0.5;
                } else { // Small temple
                    radius = this.size * 1.2;
                    angle = (i / torchCount) * Math.PI * 2 + Math.PI / 4;
                    height = this.size * 0.5;
                }
                
                torch.position.x = Math.cos(angle) * radius;
                torch.position.z = Math.sin(angle) * radius;
                torch.position.y = height;
                
                shrineGroup.add(torch);
            }
        }
        
        // Add sand mound at base
        const sandGeometry = new THREE.CircleGeometry(this.size * 1.5, 32);
        const sandMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.sand || 0xF4A460,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const sand = new THREE.Mesh(sandGeometry, sandMaterial);
        sand.rotation.x = -Math.PI / 2;
        sand.position.y = 0.01; // Slightly above ground to prevent z-fighting
        
        shrineGroup.add(sand);
        
        // Position the entire shrine at the specified position
        shrineGroup.position.copy(this.position);
        
        return shrineGroup;
    }
    
    /**
     * Create an obelisk shrine
     * @param {THREE.Group} group - The group to add the obelisk to
     * @param {THREE.Material} stoneMaterial - The stone material
     * @param {THREE.Material} accentMaterial - The accent material
     * @param {THREE.Material} glyphMaterial - The glyph material (optional)
     */
    createObelisk(group, stoneMaterial, accentMaterial, glyphMaterial) {
        // Create base
        const baseGeometry = new THREE.BoxGeometry(
            this.size * 1.2,
            this.size * 0.3,
            this.size * 1.2
        );
        
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.y = this.size * 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        
        group.add(base);
        
        // Create middle section
        const middleGeometry = new THREE.BoxGeometry(
            this.size * 0.8,
            this.size * 0.2,
            this.size * 0.8
        );
        
        const middle = new THREE.Mesh(middleGeometry, stoneMaterial);
        middle.position.y = this.size * 0.4;
        middle.castShadow = true;
        
        group.add(middle);
        
        // Create obelisk shaft
        const shaftHeight = this.size * 2;
        const shaftGeometry = new THREE.BoxGeometry(
            this.size * 0.4,
            shaftHeight,
            this.size * 0.4
        );
        
        const shaft = new THREE.Mesh(shaftGeometry, stoneMaterial);
        shaft.position.y = this.size * 0.5 + shaftHeight / 2;
        shaft.castShadow = true;
        
        group.add(shaft);
        
        // Create pyramid top
        const topGeometry = new THREE.ConeGeometry(
            this.size * 0.3,
            this.size * 0.5,
            4
        );
        
        const top = new THREE.Mesh(topGeometry, accentMaterial);
        top.position.y = this.size * 0.5 + shaftHeight + this.size * 0.25;
        top.castShadow = true;
        
        group.add(top);
        
        // Add glyphs if enabled
        if (glyphMaterial && this.hasGlyphs) {
            // Add glyphs to each side of the shaft
            for (let i = 0; i < 4; i++) {
                const glyphsGeometry = new THREE.PlaneGeometry(
                    this.size * 0.3,
                    shaftHeight * 0.7
                );
                
                const glyphs = new THREE.Mesh(glyphsGeometry, glyphMaterial);
                
                // Position on each side of the shaft
                const angle = (i / 4) * Math.PI * 2;
                const offset = this.size * 0.21; // Slightly beyond shaft surface
                
                glyphs.position.x = Math.cos(angle) * offset;
                glyphs.position.z = Math.sin(angle) * offset;
                glyphs.position.y = this.size * 0.5 + shaftHeight / 2;
                
                // Rotate to face outward
                glyphs.rotation.y = angle + Math.PI / 2;
                
                group.add(glyphs);
                
                // Create pattern of "hieroglyphs" using small boxes
                const glyphCount = 10 + Math.floor(Math.random() * 10);
                
                for (let j = 0; j < glyphCount; j++) {
                    const size = this.size * (0.03 + Math.random() * 0.04);
                    const glyphBoxGeometry = new THREE.BoxGeometry(
                        size,
                        size,
                        this.size * 0.02
                    );
                    
                    const glyphBox = new THREE.Mesh(glyphBoxGeometry, glyphMaterial);
                    
                    // Random position on the glyph plane
                    glyphBox.position.x = (Math.random() - 0.5) * this.size * 0.25;
                    glyphBox.position.y = (Math.random() - 0.5) * shaftHeight * 0.65;
                    glyphBox.position.z = this.size * 0.01; // Slightly raised from plane
                    
                    glyphs.add(glyphBox);
                }
            }
        }
    }
    
    /**
     * Create an altar shrine
     * @param {THREE.Group} group - The group to add the altar to
     * @param {THREE.Material} stoneMaterial - The stone material
     * @param {THREE.Material} accentMaterial - The accent material
     * @param {THREE.Material} glyphMaterial - The glyph material (optional)
     */
    createAltar(group, stoneMaterial, accentMaterial, glyphMaterial) {
        // Create base platform
        const baseGeometry = new THREE.BoxGeometry(
            this.size * 2,
            this.size * 0.3,
            this.size * 2
        );
        
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.y = this.size * 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        
        group.add(base);
        
        // Create steps
        const stepGeometry = new THREE.BoxGeometry(
            this.size * 1.6,
            this.size * 0.2,
            this.size * 1.6
        );
        
        const step = new THREE.Mesh(stepGeometry, stoneMaterial);
        step.position.y = this.size * 0.4;
        step.castShadow = true;
        
        group.add(step);
        
        // Create altar table
        const tableGeometry = new THREE.BoxGeometry(
            this.size * 1.2,
            this.size * 0.4,
            this.size * 0.8
        );
        
        const table = new THREE.Mesh(tableGeometry, stoneMaterial);
        table.position.y = this.size * 0.7;
        table.castShadow = true;
        
        group.add(table);
        
        // Create offering bowl
        const bowlGeometry = new THREE.SphereGeometry(
            this.size * 0.3,
            16,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );
        
        const bowl = new THREE.Mesh(bowlGeometry, accentMaterial);
        bowl.rotation.x = Math.PI;
        bowl.position.y = this.size * 0.9;
        bowl.castShadow = true;
        
        group.add(bowl);
        
        // Add decorative pillars at corners
        for (let i = 0; i < 4; i++) {
            const pillarGeometry = new THREE.CylinderGeometry(
                this.size * 0.1,
                this.size * 0.15,
                this.size * 1,
                8
            );
            
            const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
            
            // Position at corners
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const radius = this.size * 0.8;
            
            pillar.position.x = Math.cos(angle) * radius;
            pillar.position.z = Math.sin(angle) * radius;
            pillar.position.y = this.size * 0.5;
            
            pillar.castShadow = true;
            
            group.add(pillar);
            
            // Add decorative top to pillar
            const topGeometry = new THREE.SphereGeometry(this.size * 0.15, 8, 8);
            const top = new THREE.Mesh(topGeometry, accentMaterial);
            top.position.y = this.size * 1;
            
            pillar.add(top);
        }
        
        // Add glyphs if enabled
        if (glyphMaterial && this.hasGlyphs) {
            // Add glyphs to front of altar
            const frontGlyphsGeometry = new THREE.PlaneGeometry(
                this.size * 1,
                this.size * 0.3
            );
            
            const frontGlyphs = new THREE.Mesh(frontGlyphsGeometry, glyphMaterial);
            frontGlyphs.position.z = this.size * 0.41;
            frontGlyphs.position.y = this.size * 0.7;
            
            table.add(frontGlyphs);
            
            // Add circular glyph on top of altar
            const circleGlyphGeometry = new THREE.CircleGeometry(this.size * 0.25, 32);
            const circleGlyph = new THREE.Mesh(circleGlyphGeometry, glyphMaterial);
            circleGlyph.rotation.x = -Math.PI / 2;
            circleGlyph.position.y = this.size * 0.21;
            
            table.add(circleGlyph);
            
            // Add pattern inside circle
            const ringGeometry = new THREE.RingGeometry(
                this.size * 0.15,
                this.size * 0.17,
                32
            );
            
            const ring = new THREE.Mesh(ringGeometry, glyphMaterial);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = this.size * 0.211;
            
            table.add(ring);
        }
    }
    
    /**
     * Create a small temple shrine
     * @param {THREE.Group} group - The group to add the temple to
     * @param {THREE.Material} stoneMaterial - The stone material
     * @param {THREE.Material} accentMaterial - The accent material
     * @param {THREE.Material} glyphMaterial - The glyph material (optional)
     */
    createSmallTemple(group, stoneMaterial, accentMaterial, glyphMaterial) {
        // Create base platform
        const baseGeometry = new THREE.BoxGeometry(
            this.size * 2.5,
            this.size * 0.3,
            this.size * 2.5
        );
        
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.y = this.size * 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        
        group.add(base);
        
        // Create steps
        const stepGeometry = new THREE.BoxGeometry(
            this.size * 2,
            this.size * 0.2,
            this.size * 2
        );
        
        const step = new THREE.Mesh(stepGeometry, stoneMaterial);
        step.position.y = this.size * 0.4;
        step.castShadow = true;
        
        group.add(step);
        
        // Create temple floor
        const floorGeometry = new THREE.BoxGeometry(
            this.size * 1.8,
            this.size * 0.1,
            this.size * 1.8
        );
        
        const floor = new THREE.Mesh(floorGeometry, stoneMaterial);
        floor.position.y = this.size * 0.55;
        floor.castShadow = true;
        
        group.add(floor);
        
        // Create pillars
        for (let i = 0; i < 4; i++) {
            const pillarGeometry = new THREE.CylinderGeometry(
                this.size * 0.15,
                this.size * 0.2,
                this.size * 1.2,
                8
            );
            
            const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
            
            // Position at corners
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const radius = this.size * 0.7;
            
            pillar.position.x = Math.cos(angle) * radius;
            pillar.position.z = Math.sin(angle) * radius;
            pillar.position.y = this.size * 1.15;
            
            pillar.castShadow = true;
            
            group.add(pillar);
            
            // Add decorative capital to pillar
            const capitalGeometry = new THREE.BoxGeometry(
                this.size * 0.3,
                this.size * 0.1,
                this.size * 0.3
            );
            
            const capital = new THREE.Mesh(capitalGeometry, accentMaterial);
            capital.position.y = this.size * 0.65;
            
            pillar.add(capital);
        }
        
        // Create roof
        const roofGeometry = new THREE.BoxGeometry(
            this.size * 1.9,
            this.size * 0.2,
            this.size * 1.9
        );
        
        const roof = new THREE.Mesh(roofGeometry, stoneMaterial);
        roof.position.y = this.size * 1.85;
        roof.castShadow = true;
        
        group.add(roof);
        
        // Create pyramid top
        const topGeometry = new THREE.ConeGeometry(
            this.size * 1.3,
            this.size * 0.8,
            4
        );
        
        const top = new THREE.Mesh(topGeometry, accentMaterial);
        top.position.y = this.size * 2.35;
        top.castShadow = true;
        
        group.add(top);
        
        // Create central altar
        const altarGeometry = new THREE.BoxGeometry(
            this.size * 0.6,
            this.size * 0.5,
            this.size * 0.6
        );
        
        const altar = new THREE.Mesh(altarGeometry, accentMaterial);
        altar.position.y = this.size * 0.8;
        altar.castShadow = true;
        
        group.add(altar);
        
        // Add statue on altar
        const statueGeometry = new THREE.CylinderGeometry(
            this.size * 0.1,
            this.size * 0.15,
            this.size * 0.4,
            8
        );
        
        const statue = new THREE.Mesh(statueGeometry, stoneMaterial);
        statue.position.y = this.size * 0.3;
        
        altar.add(statue);
        
        // Add head to statue
        const headGeometry = new THREE.SphereGeometry(this.size * 0.12, 8, 8);
        const head = new THREE.Mesh(headGeometry, stoneMaterial);
        head.position.y = this.size * 0.3;
        
        statue.add(head);
        
        // Add glyphs if enabled
        if (glyphMaterial && this.hasGlyphs) {
            // Add glyphs to pillars
            for (let i = 4; i < 8; i++) { // Pillars are at indices 4-7
                const pillar = group.children[i];
                
                const glyphsGeometry = new THREE.PlaneGeometry(
                    this.size * 0.2,
                    this.size * 0.8
                );
                
                const glyphs = new THREE.Mesh(glyphsGeometry, glyphMaterial);
                glyphs.position.z = this.size * 0.16;
                glyphs.position.y = 0;
                
                pillar.add(glyphs);
            }
            
            // Add glyphs to altar sides
            for (let i = 0; i < 4; i++) {
                const glyphsGeometry = new THREE.PlaneGeometry(
                    this.size * 0.5,
                    this.size * 0.3
                );
                
                const glyphs = new THREE.Mesh(glyphsGeometry, glyphMaterial);
                
                // Position on each side of the altar
                const angle = (i / 4) * Math.PI * 2;
                const offset = this.size * 0.31;
                
                glyphs.position.x = Math.cos(angle) * offset;
                glyphs.position.z = Math.sin(angle) * offset;
                glyphs.position.y = 0;
                
                // Rotate to face outward
                glyphs.rotation.y = angle + Math.PI / 2;
                
                altar.add(glyphs);
            }
            
            // Add hieroglyphic band around roof
            const bandGeometry = new THREE.BoxGeometry(
                this.size * 1.92,
                this.size * 0.1,
                this.size * 1.92
            );
            
            // Use wireframe to create pattern effect
            const bandMaterial = new THREE.MeshBasicMaterial({
                color: glyphMaterial.color,
                wireframe: true
            });
            
            const band = new THREE.Mesh(bandGeometry, bandMaterial);
            band.position.y = this.size * 1.85;
            
            group.add(band);
        }
    }
    
    /**
     * Create a torch with flame effect
     * @param {number} fireColor - The color of the fire
     * @returns {THREE.Group} - The torch group
     */
    createTorch(fireColor) {
        const torchGroup = new THREE.Group();
        
        // Create torch pole
        const poleGeometry = new THREE.CylinderGeometry(
            this.size * 0.03,
            this.size * 0.04,
            this.size * 0.5,
            8
        );
        
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Saddle Brown
            roughness: 0.9,
            metalness: 0.1
        });
        
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = this.size * 0.25;
        pole.castShadow = true;
        
        torchGroup.add(pole);
        
        // Create torch bowl
        const bowlGeometry = new THREE.CylinderGeometry(
            this.size * 0.08,
            this.size * 0.05,
            this.size * 0.1,
            8
        );
        
        const bowlMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0522D, // Sienna
            roughness: 0.8,
            metalness: 0.2
        });
        
        const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
        bowl.position.y = this.size * 0.55;
        bowl.castShadow = true;
        
        torchGroup.add(bowl);
        
        // Create fire
        const fireGeometry = new THREE.ConeGeometry(
            this.size * 0.07,
            this.size * 0.2,
            8
        );
        
        const fireMaterial = new THREE.MeshStandardMaterial({
            color: fireColor,
            roughness: 0.3,
            metalness: 0.7,
            emissive: fireColor,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.position.y = this.size * 0.7;
        
        torchGroup.add(fire);
        
        // Add point light for fire glow
        const light = new THREE.PointLight(fireColor, 1, this.size * 3);
        light.position.y = this.size * 0.7;
        
        torchGroup.add(light);
        
        return torchGroup;
    }
}