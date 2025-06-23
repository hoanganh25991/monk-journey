import * as THREE from 'three';

/**
 * Represents a dark sanctum structure
 */
export class DarkSanctum {
    /**
     * Create a new dark sanctum
     */
    constructor() {
        this.random = Math.random;
        this.baseSize = 18 + this.random() * 4; // Base size between 18-22 units
        this.pillarHeight = 8 + this.random() * 2; // Pillar height between 8-10 units
    }
    
    /**
     * Create the dark sanctum mesh
     * @returns {THREE.Group} - The dark sanctum group
     */
    createMesh() {
        const sanctumGroup = new THREE.Group();
        
        // Create main structure (dark temple)
        const baseGeometry = new THREE.BoxGeometry(this.baseSize, 1, this.baseSize);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        base.receiveShadow = true;
        base.castShadow = true;
        
        sanctumGroup.add(base);
        
        // Create pillars
        const pillarGeometry = new THREE.CylinderGeometry(1, 1, this.pillarHeight, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0x330033,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create 8 pillars in a circle
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.baseSize / 2.5;
            
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(
                Math.cos(angle) * radius,
                this.pillarHeight / 2,
                Math.sin(angle) * radius
            );
            pillar.castShadow = true;
            
            sanctumGroup.add(pillar);
        }
        
        // Create central altar
        const altarGeometry = new THREE.BoxGeometry(4, 2, 4);
        const altarMaterial = new THREE.MeshStandardMaterial({
            color: 0x330033,
            roughness: 0.6,
            metalness: 0.4
        });
        const altar = new THREE.Mesh(altarGeometry, altarMaterial);
        altar.position.y = 1.5;
        altar.castShadow = true;
        
        sanctumGroup.add(altar);
        
        // Create magical orb on altar
        const orbGeometry = new THREE.SphereGeometry(1, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: 0x9900cc,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x330066,
            emissiveIntensity: 0.8
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.y = 3.5;
        
        sanctumGroup.add(orb);
        
        // Create floating runes around the orb
        const runeGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
        const runeMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900cc,
            transparent: true,
            opacity: 0.7
        });
        
        // Create 5 floating runes
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const radius = 2;
            
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(
                Math.cos(angle) * radius,
                3.5,
                Math.sin(angle) * radius
            );
            rune.rotation.x = Math.PI / 2;
            
            sanctumGroup.add(rune);
        }
        
        // Create dark aura around the sanctum
        const auraGeometry = new THREE.RingGeometry(this.baseSize / 2, this.baseSize / 2 + 2, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x330033,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.1;
        
        sanctumGroup.add(aura);
        
        // Add some random decorative elements
        if (this.random() > 0.5) {
            // Add skulls around the altar
            for (let i = 0; i < 5; i++) {
                const skullGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                const skullMaterial = new THREE.MeshStandardMaterial({
                    color: 0xdddddd,
                    roughness: 0.9
                });
                const skull = new THREE.Mesh(skullGeometry, skullMaterial);
                
                const angle = (i / 5) * Math.PI * 2;
                const radius = 3;
                
                skull.position.set(
                    Math.sin(angle) * radius,
                    1.5,
                    Math.cos(angle) * radius
                );
                
                sanctumGroup.add(skull);
            }
        }
        
        return sanctumGroup;
    }
}