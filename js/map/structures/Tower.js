import * as THREE from 'three';
import { ZONE_COLORS } from '../../config/colors.js';

/**
 * Represents a tower structure styled for Monk Journey
 */
export class Tower {
    /**
     * Create a new tower
     * @param {string} zoneType - The type of zone (Forest, Desert, etc.)
     */
    constructor(zoneType = 'Forest') {
        // Randomize tower properties
        this.random = Math.random;
        this.height = 10 + this.random() * 15; // Tower height between 10-25 units
        this.radius = 2 + this.random() * 3; // Tower radius between 2-5 units
        this.segments = Math.floor(6 + this.random() * 6); // Tower segments between 6-12
        
        // Store zone type for color selection
        this.zoneType = zoneType;
    }
    
    /**
     * Create the tower mesh
     * @returns {THREE.Group} - The tower group
     */
    createMesh() {
        const towerGroup = new THREE.Group();
        
        // Get colors based on zone type
        const zoneColors = ZONE_COLORS[this.zoneType] || ZONE_COLORS.Forest;
        
        // Create pagoda-style tower for Monk Journey theme
        // We'll create multiple tiers for a pagoda-like appearance
        const tiers = Math.floor(3 + this.random() * 2); // 3-5 tiers
        const tierHeight = this.height / tiers;
        
        // Create each tier
        for (let i = 0; i < tiers; i++) {
            // Each tier gets progressively smaller
            const tierRadius = this.radius * (1 - (i * 0.15));
            const tierY = i * tierHeight;
            
            // Create tier
            const tierGeometry = new THREE.CylinderGeometry(
                tierRadius * 0.9, // Top radius (slightly smaller)
                tierRadius, // Bottom radius
                tierHeight * 0.8, // Slightly shorter than full height to create gaps
                8 // Octagonal shape for Asian style
            );
            
            // Use zone-appropriate color
            const tierMaterial = new THREE.MeshStandardMaterial({
                color: zoneColors.structure || 0x36454F, // Charcoal default
                roughness: 0.8,
                metalness: 0.2
            });
            
            const tier = new THREE.Mesh(tierGeometry, tierMaterial);
            tier.position.y = tierY + tierHeight * 0.4; // Position with gap between tiers
            tier.castShadow = true;
            tier.receiveShadow = true;
            
            towerGroup.add(tier);
            
            // Add decorative roof for each tier
            const roofRadius = tierRadius * 1.3; // Roof extends beyond the tier
            const roofHeight = tierHeight * 0.4;
            
            const roofGeometry = new THREE.ConeGeometry(roofRadius, roofHeight, 8);
            const roofMaterial = new THREE.MeshStandardMaterial({
                color: zoneColors.accent || 0x8B0000, // Deep Red default
                roughness: 0.7,
                metalness: 0.3
            });
            
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = tierY + tierHeight * 0.8 + roofHeight * 0.5;
            roof.scale.y = 0.6; // Flatten it for a more curved appearance
            roof.castShadow = true;
            
            towerGroup.add(roof);
            
            // Add decorative eaves at the corners of each roof
            for (let j = 0; j < 4; j++) {
                const angle = (j / 4) * Math.PI * 2;
                const eaveGeometry = new THREE.BoxGeometry(roofRadius * 0.3, 0.1, roofRadius * 0.3);
                const eave = new THREE.Mesh(eaveGeometry, roofMaterial);
                
                // Position at corners with slight upward curve
                eave.position.set(
                    Math.sin(angle) * (roofRadius * 0.8),
                    tierY + tierHeight * 0.8 + 0.1,
                    Math.cos(angle) * (roofRadius * 0.8)
                );
                
                // Rotate to point outward
                eave.rotation.y = angle + Math.PI / 4;
                // Tilt upward for curved effect
                eave.rotation.x = Math.PI * 0.1;
                
                towerGroup.add(eave);
            }
            
            // Add windows to each tier
            const windowsPerTier = Math.floor(4 + this.random() * 2); // 4-6 windows
            
            for (let j = 0; j < windowsPerTier; j++) {
                const angle = (j / windowsPerTier) * Math.PI * 2;
                
                // Create lattice-style window
                const windowGroup = new THREE.Group();
                
                // Window frame
                const frameGeometry = new THREE.BoxGeometry(1, 1, 0.3);
                const frameMaterial = new THREE.MeshStandardMaterial({
                    color: zoneColors.structure || 0x36454F, // Charcoal default
                    roughness: 0.8,
                    metalness: 0.2
                });
                
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                windowGroup.add(frame);
                
                // Window glass
                const glassGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
                const glassMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffaa,
                    emissive: 0xffffaa,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.7
                });
                
                const glass = new THREE.Mesh(glassGeometry, glassMaterial);
                glass.position.z = 0.1;
                windowGroup.add(glass);
                
                // Add lattice pattern
                const latticeColor = zoneColors.structure || 0x36454F;
                const latticeGeometry1 = new THREE.BoxGeometry(0.8, 0.1, 0.3);
                const latticeGeometry2 = new THREE.BoxGeometry(0.1, 0.8, 0.3);
                const latticeMaterial = new THREE.MeshStandardMaterial({
                    color: latticeColor,
                    roughness: 0.8,
                    metalness: 0.2
                });
                
                // Horizontal lattice
                const latticeH = new THREE.Mesh(latticeGeometry1, latticeMaterial);
                latticeH.position.y = 0;
                windowGroup.add(latticeH);
                
                // Vertical lattice
                const latticeV = new THREE.Mesh(latticeGeometry2, latticeMaterial);
                latticeV.position.x = 0;
                windowGroup.add(latticeV);
                
                // Position and rotate window
                windowGroup.position.set(
                    Math.sin(angle) * (tierRadius - 0.2),
                    tierY + tierHeight * 0.4,
                    Math.cos(angle) * (tierRadius - 0.2)
                );
                windowGroup.rotation.y = angle + Math.PI / 2;
                
                towerGroup.add(windowGroup);
            }
        }
        
        // Add a decorative spire at the top
        const spireHeight = this.height * 0.2;
        const spireGeometry = new THREE.CylinderGeometry(0.2, 0.5, spireHeight, 8);
        const spireMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0x8B0000, // Deep Red default
            roughness: 0.7,
            metalness: 0.5
        });
        
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.y = this.height + spireHeight / 2;
        towerGroup.add(spire);
        
        // Add decorative elements based on zone type
        if (this.zoneType === 'Forest') {
            // Add lanterns for forest pagodas
            this.addLanterns(towerGroup, zoneColors);
        } else if (this.zoneType === 'Desert') {
            // Add banners for desert towers
            this.addBanners(towerGroup, zoneColors);
        } else if (this.zoneType === 'Mountain') {
            // Add snow caps for mountain towers
            this.addSnowCaps(towerGroup, zoneColors);
        } else if (this.zoneType === 'Dark Sanctum') {
            // Add dark energy effects for dark sanctum
            this.addDarkEffects(towerGroup, zoneColors);
        }
        
        return towerGroup;
    }
    
    /**
     * Add decorative lanterns to the tower
     * @param {THREE.Group} towerGroup - The tower group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addLanterns(towerGroup, zoneColors) {
        // Create lantern material
        const lanternMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0x8B0000, // Deep Red default
            roughness: 0.7,
            metalness: 0.3,
            emissive: zoneColors.accent || 0x8B0000,
            emissiveIntensity: 0.3
        });
        
        // Add lanterns around the base
        const lanternCount = Math.floor(4 + this.random() * 3); // 4-7 lanterns
        
        for (let i = 0; i < lanternCount; i++) {
            const angle = (i / lanternCount) * Math.PI * 2;
            const lanternSize = 0.4 + this.random() * 0.2;
            const lanternGeometry = new THREE.SphereGeometry(lanternSize, 8, 8);
            const lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
            
            // Position lanterns around the base
            lantern.position.set(
                Math.sin(angle) * (this.radius * 1.5),
                lanternSize,
                Math.cos(angle) * (this.radius * 1.5)
            );
            
            towerGroup.add(lantern);
            
            // Add string to lantern
            const stringHeight = 1 + this.random() * 0.5;
            const stringGeometry = new THREE.CylinderGeometry(0.02, 0.02, stringHeight, 4);
            const stringMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const string = new THREE.Mesh(stringGeometry, stringMaterial);
            
            string.position.set(
                Math.sin(angle) * (this.radius * 1.5),
                lanternSize + stringHeight / 2,
                Math.cos(angle) * (this.radius * 1.5)
            );
            
            towerGroup.add(string);
        }
    }
    
    /**
     * Add decorative banners to the tower
     * @param {THREE.Group} towerGroup - The tower group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addBanners(towerGroup, zoneColors) {
        // Create banner material
        const bannerMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.accent || 0xFF4500, // Sunset Orange default
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        
        // Add banners at different heights
        const bannerCount = Math.floor(2 + this.random() * 2); // 2-4 banners
        
        for (let i = 0; i < bannerCount; i++) {
            const bannerHeight = this.height * (0.3 + i * 0.2); // Position at different heights
            const bannerWidth = 2 + this.random() * 1;
            const bannerLength = 4 + this.random() * 2;
            
            // Create banner
            const bannerGeometry = new THREE.PlaneGeometry(bannerWidth, bannerLength);
            const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
            
            // Position banner
            const angle = i * Math.PI / 2; // Distribute around the tower
            banner.position.set(
                Math.sin(angle) * (this.radius + 0.5),
                bannerHeight,
                Math.cos(angle) * (this.radius + 0.5)
            );
            
            // Rotate banner to face outward
            banner.rotation.y = angle + Math.PI / 2;
            
            towerGroup.add(banner);
            
            // Add pole for banner
            const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, bannerLength + 1, 6);
            const poleMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown
                roughness: 0.7,
                metalness: 0.3
            });
            
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(
                Math.sin(angle) * (this.radius + 0.1),
                bannerHeight,
                Math.cos(angle) * (this.radius + 0.1)
            );
            
            towerGroup.add(pole);
        }
    }
    
    /**
     * Add snow caps to the tower for mountain zones
     * @param {THREE.Group} towerGroup - The tower group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addSnowCaps(towerGroup, zoneColors) {
        // Create snow material
        const snowMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.snow || 0xFFFAFA, // Snow White default
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Add snow on the top roof
        const snowCapGeometry = new THREE.ConeGeometry(this.radius * 0.9, this.height * 0.1, 8);
        const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
        snowCap.position.y = this.height + this.height * 0.1;
        snowCap.scale.y = 0.3; // Flatten it
        towerGroup.add(snowCap);
        
        // Add snow on window sills
        const tiers = Math.floor(3 + this.random() * 2); // Match the number of tiers
        const tierHeight = this.height / tiers;
        
        for (let i = 0; i < tiers; i++) {
            const tierY = i * tierHeight;
            const tierRadius = this.radius * (1 - (i * 0.15));
            
            // Add snow on each tier's roof
            const snowRingGeometry = new THREE.TorusGeometry(tierRadius * 1.1, 0.2, 8, 16);
            const snowRing = new THREE.Mesh(snowRingGeometry, snowMaterial);
            snowRing.position.y = tierY + tierHeight * 0.8;
            snowRing.rotation.x = Math.PI / 2;
            towerGroup.add(snowRing);
        }
    }
    
    /**
     * Add dark energy effects for dark sanctum
     * @param {THREE.Group} towerGroup - The tower group
     * @param {Object} zoneColors - Colors for the current zone
     */
    addDarkEffects(towerGroup, zoneColors) {
        // Create dark energy material
        const energyMaterial = new THREE.MeshStandardMaterial({
            color: zoneColors.fire || 0xFF4500, // Flame Orange default
            roughness: 0.3,
            metalness: 0.8,
            emissive: zoneColors.fire || 0xFF4500,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
        });
        
        // Add energy orb at the top
        const orbGeometry = new THREE.SphereGeometry(this.radius * 0.7, 12, 12);
        const orb = new THREE.Mesh(orbGeometry, energyMaterial);
        orb.position.y = this.height + this.radius * 0.7;
        towerGroup.add(orb);
        
        // Add energy tendrils coming from the orb
        const tendrilCount = 5 + Math.floor(this.random() * 5); // 5-10 tendrils
        
        for (let i = 0; i < tendrilCount; i++) {
            const angle = (i / tendrilCount) * Math.PI * 2;
            const tendrilLength = this.radius * 2 + this.random() * this.radius;
            
            const tendrilGeometry = new THREE.CylinderGeometry(0.1, 0.3, tendrilLength, 6);
            const tendril = new THREE.Mesh(tendrilGeometry, energyMaterial);
            
            // Position tendrils radiating from the orb
            tendril.position.set(
                Math.sin(angle) * (this.radius * 0.5),
                this.height + this.radius * 0.7 - tendrilLength / 2,
                Math.cos(angle) * (this.radius * 0.5)
            );
            
            // Rotate tendrils to point downward and outward
            tendril.rotation.x = Math.PI / 4;
            tendril.rotation.y = angle;
            
            towerGroup.add(tendril);
        }
    }
}