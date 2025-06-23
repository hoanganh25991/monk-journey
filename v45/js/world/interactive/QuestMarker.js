import * as THREE from 'three';

/**
 * Represents a quest marker interactive object
 */
export class QuestMarker {
    /**
     * Create a new quest marker
     * @param {string} questName - Name of the quest
     * @param {Object} game - Reference to the game instance
     */
    constructor(questName, game) {
        this.questName = questName;
        this.game = game;
        this.isInteractive = true;
    }
    
    /**
     * Create the quest marker mesh
     * @returns {THREE.Group} - The quest marker group
     */
    createMesh() {
        const markerGroup = new THREE.Group();
        
        // Create marker post
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 1;
        post.castShadow = true;
        post.receiveShadow = true;
        
        markerGroup.add(post);
        
        // Create marker sign
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const signGeometry = new THREE.BoxGeometry(1, 0.8, 0.1);
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 1.8, 0);
        sign.castShadow = true;
        sign.receiveShadow = true;
        
        markerGroup.add(sign);
        
        // Create glowing marker
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            emissive: 0xffcc00,
            emissiveIntensity: 0.5
        });
        
        const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(0, 2.2, 0);
        
        markerGroup.add(marker);
        
        // Add a quest icon to the sign
        this.addQuestIcon(markerGroup, sign);
        
        // Add a glow effect
        this.addGlowEffect(markerGroup, marker);
        
        // Add floating "Click Me" indicator
        this.addInteractionIndicator(markerGroup);
        
        // Make the entire marker group interactive
        markerGroup.userData = {
            type: 'questMarker',
            questName: this.questName,
            interactive: true,
            onClick: () => this.handleClick()
        };
        
        // Add a larger invisible collision mesh for easier interaction
        this.addInteractionCollider(markerGroup);
        
        return markerGroup;
    }
    
    /**
     * Add a quest icon to the sign
     * @param {THREE.Group} markerGroup - The marker group
     * @param {THREE.Mesh} sign - The sign mesh
     */
    addQuestIcon(markerGroup, sign) {
        // Create a simple exclamation mark as the quest icon
        const iconMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });
        
        // Create exclamation mark stem
        const stemGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.05);
        const stem = new THREE.Mesh(stemGeometry, iconMaterial);
        stem.position.set(0, 1.8, 0.1);
        
        // Create exclamation mark dot
        const dotGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const dot = new THREE.Mesh(dotGeometry, iconMaterial);
        dot.position.set(0, 1.5, 0.1);
        
        markerGroup.add(stem);
        markerGroup.add(dot);
        
        // Add quest type text based on quest name
        let questColor;
        if (this.questName.includes('Main')) {
            questColor = 0xffcc00; // Gold for main quests
        } else if (this.questName.includes('Side')) {
            questColor = 0x00ccff; // Blue for side quests
        } else {
            questColor = 0x00ff00; // Green for other quests
        }
        
        // Add a colored band to the sign to indicate quest type
        const bandMaterial = new THREE.MeshBasicMaterial({
            color: questColor
        });
        
        const bandGeometry = new THREE.BoxGeometry(1, 0.1, 0.12);
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.position.set(0, 2.1, 0);
        
        markerGroup.add(band);
    }
    
    /**
     * Add a glow effect to the marker
     * @param {THREE.Group} markerGroup - The marker group
     * @param {THREE.Mesh} marker - The marker mesh
     */
    addGlowEffect(markerGroup, marker) {
        // Create a slightly larger, transparent version of the marker for the glow
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(marker.position);
        
        markerGroup.add(glow);
        
        // Animate the glow
        this.animateGlow(glow);
    }
    
    /**
     * Animate the glow effect
     * @param {THREE.Mesh} glow - The glow mesh to animate
     */
    animateGlow(glow) {
        // Create a simple pulse animation
        const pulseAnimation = () => {
            // Pulse the scale of the glow
            const time = Date.now() * 0.001; // Convert to seconds
            const scale = 1 + 0.2 * Math.sin(time * 2); // Pulse between 0.8 and 1.2
            
            glow.scale.set(scale, scale, scale);
            
            // Continue animation
            requestAnimationFrame(pulseAnimation);
        };
        
        // Start the animation
        pulseAnimation();
    }
    
    /**
     * Add a floating indicator to show the marker is interactive
     * @param {THREE.Group} markerGroup - The marker group to add the indicator to
     */
    addInteractionIndicator(markerGroup) {
        // Create a sprite for the indicator
        const indicatorMaterial = new THREE.SpriteMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const indicator = new THREE.Sprite(indicatorMaterial);
        indicator.position.set(0, 3, 0); // Position above the marker
        indicator.scale.set(0.5, 0.5, 0.5);
        
        // Add the indicator to the marker group
        markerGroup.add(indicator);
        
        // Animate the indicator
        this.animateIndicator(indicator);
    }
    
    /**
     * Animate the interaction indicator
     * @param {THREE.Sprite} indicator - The indicator to animate
     */
    animateIndicator(indicator) {
        // Create a simple floating animation
        const floatAnimation = () => {
            // Make the indicator float up and down
            const time = Date.now() * 0.001; // Convert to seconds
            indicator.position.y = 3 + 0.1 * Math.sin(time * 3); // Float between 2.9 and 3.1
            
            // Continue animation
            requestAnimationFrame(floatAnimation);
        };
        
        // Start the animation
        floatAnimation();
    }
    
    /**
     * Add an invisible collider to make interaction easier
     * @param {THREE.Group} markerGroup - The marker group to add the collider to
     */
    addInteractionCollider(markerGroup) {
        // Create a larger invisible collision mesh for easier interaction
        const colliderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
        const colliderMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.0, // Completely invisible
            depthWrite: false
        });
        
        const collider = new THREE.Mesh(colliderGeometry, colliderMaterial);
        collider.position.y = 1.5; // Center it on the marker
        
        // Make the collider interactive
        collider.userData = {
            type: 'questMarkerCollider',
            questName: this.questName,
            interactive: true,
            onClick: () => this.handleClick()
        };
        
        markerGroup.add(collider);
    }
    
    /**
     * Handle click/touch interaction with the quest marker
     */
    handleClick() {
        if (this.isInteractive && this.game) {
            // Call the toggleQuest function to open the quest UI
            this.game.toggleQuest(this.questName);
            
            // Visual feedback for interaction
            this.playInteractionEffect();
        }
    }
    
    /**
     * Play a visual effect when the marker is interacted with
     */
    playInteractionEffect() {
        // This could be expanded with particle effects, sound, etc.
        console.debug(`Quest marker "${this.questName}" clicked!`);
    }
}