import * as THREE from 'three';

export class CollisionManager {
    constructor(player, enemyManager, world) {
        this.player = player;
        this.enemyManager = enemyManager;
        this.world = world;
        this.collisionDistance = 1.0; // Default collision distance
        
        // Track which enemies have been hit by which skills to prevent multiple hits
        this.skillHitRegistry = new Map();
        
        // Performance optimization flags
        this.lastCollisionCheck = Date.now();
        this.objectCollisionInterval = 100; // Check object collisions every 100ms by default
        this.enemyCollisionInterval = 50; // Check enemy-enemy collisions every 50ms by default
        this.frameCount = 0; // Track frames for staggered collision checks
    }
    
    update() {
        // Skip collision detection if game is paused
        if (this.player.game && this.player.game.isPaused) {
            return; // Don't process collisions when game is paused
        }
        
        // Increment frame counter
        this.frameCount++;
        
        // Get current time for interval-based checks
        const currentTime = Date.now();
        
        // Check if we're in critical performance mode
        const inCriticalMode = this.world && 
                              this.world.criticalPerformanceMode === true;
        
        // Always check these collisions every frame (critical for gameplay)
        // Check player-enemy collisions
        this.checkPlayerEnemyCollisions();
        
        // Check player-terrain collisions (always needed for player movement)
        this.checkPlayerTerrainCollisions();
        
        // Check player skill-enemy collisions (critical for combat)
        this.checkSkillEnemyCollisions();
        
        // Optimize less critical collision checks based on performance mode
        if (inCriticalMode) {
            // In critical performance mode, check object collisions less frequently
            if (currentTime - this.lastCollisionCheck > this.objectCollisionInterval) {
                // Check player-object collisions (can be checked less frequently)
                this.checkPlayerObjectCollisions();
                this.lastCollisionCheck = currentTime;
            }
            
            // Skip enemy-enemy collisions entirely in critical mode
            // This is a significant performance optimization
        } else {
            // In normal mode, check all collisions
            // Check player-object collisions
            this.checkPlayerObjectCollisions();
            
            // Check enemy-enemy collisions (least critical, can be staggered)
            // Only check every 3 frames to improve performance
            if (this.frameCount % 3 === 0) {
                this.checkEnemyEnemyCollisions();
            }
        }
    }
    
    checkPlayerEnemyCollisions() {
        const playerPosition = this.player.getPosition();
        const playerRadius = this.player.getCollisionRadius();
        
        // Check collision with each enemy
        this.enemyManager.enemies.forEach(enemy => {
            const enemyPosition = enemy.getPosition();
            const enemyRadius = enemy.getCollisionRadius();
            
            // Calculate distance between player and enemy
            const distance = playerPosition.distanceTo(enemyPosition);
            
            // Check if collision occurred
            if (distance < playerRadius + enemyRadius) {
                // Handle collision
                this.handlePlayerEnemyCollision(enemy);
            }
        });
    }
    
    handlePlayerEnemyCollision(enemy) {
        // Push player away from enemy
        const playerPosition = this.player.getPosition();
        const enemyPosition = enemy.getPosition();
        
        // Calculate direction from enemy to player
        const direction = new THREE.Vector3().subVectors(playerPosition, enemyPosition).normalize();
        
        // Move player away from enemy
        const pushDistance = 0.1;
        this.player.setPosition(
            playerPosition.x + direction.x * pushDistance,
            playerPosition.y,
            playerPosition.z + direction.z * pushDistance
        );
    }
    
    checkPlayerObjectCollisions() {
        const playerPosition = this.player.getPosition();
        const playerRadius = this.player.getCollisionRadius();
        
        // Check collision with structures if available
        if (this.world && this.world.structureManager && this.world.structureManager.structures) {
            this.world.structureManager.structures.forEach(structureData => {
                // Get the actual THREE.Object3D from the structure data
                const object = structureData.object;
                
                // Skip if object is not valid
                if (!object) return;
                
                try {
                    // Get object bounding box
                    const boundingBox = new THREE.Box3().setFromObject(object);
                    
                    // Create a sphere that encompasses the bounding box
                    const center = new THREE.Vector3();
                    boundingBox.getCenter(center);
                    const size = new THREE.Vector3();
                    boundingBox.getSize(size);
                    const objectRadius = Math.max(size.x, size.z) / 2;
                    
                    // Calculate distance between player and object center
                    const distance = new THREE.Vector2(playerPosition.x, playerPosition.z)
                        .distanceTo(new THREE.Vector2(center.x, center.z));
                    
                    // Check if collision occurred
                    if (distance < playerRadius + objectRadius) {
                        // Handle collision
                        this.handlePlayerObjectCollision(object, center);
                    }
                } catch (error) {
                    console.warn("Error checking collision with structure:", error);
                }
            });
        }
        
        // Check collision with interactive objects
        this.checkPlayerInteractiveObjectsCollisions();
    }
    
    checkPlayerInteractiveObjectsCollisions() {
        const playerPosition = this.player.getPosition();
        
        // Get nearby interactive objects
        const interactiveObjects = this.world.getInteractiveObjectsNear(
            playerPosition, 
            5 // Interaction radius
        );
        
        // Check if player is pressing the interaction key
        if (this.player.isInteracting() && interactiveObjects.length > 0) {
            // Find the closest interactive object
            let closestObject = interactiveObjects[0];
            let closestDistance = playerPosition.distanceTo(closestObject.position);
            
            for (let i = 1; i < interactiveObjects.length; i++) {
                const distance = playerPosition.distanceTo(interactiveObjects[i].position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestObject = interactiveObjects[i];
                }
            }
            
            // Use the centralized interaction system if available
            if (this.player.game && this.player.game.interactionSystem) {
                this.player.game.interactionSystem.handleCollisionInteraction(closestObject);
            } else {
                // Fallback to legacy method
                console.warn('Interaction system not available, using legacy method');
            }
        }
    }
    
    handlePlayerObjectCollision(object, objectCenter) {
        const playerPosition = this.player.getPosition();
        
        // Calculate direction from object to player
        const direction = new THREE.Vector2(
            playerPosition.x - objectCenter.x,
            playerPosition.z - objectCenter.z
        ).normalize();
        
        // Move player away from object
        const pushDistance = 0.1;
        this.player.setPosition(
            playerPosition.x + direction.x * pushDistance,
            playerPosition.y,
            playerPosition.z + direction.z * pushDistance
        );
    }
    
    checkPlayerTerrainCollisions() {
        const playerPosition = this.player.getPosition();
        
        // Validate player position
        if (isNaN(playerPosition.x) || isNaN(playerPosition.y) || isNaN(playerPosition.z)) {
            console.warn("Invalid player position in terrain collision check:", playerPosition);
            // Reset player to a safe position
            this.player.setPosition(0, 2, 0);
            return;
        }
        
        // Get terrain height at player position
        let terrainHeight;
        try {
            terrainHeight = this.world.getTerrainHeight(playerPosition.x, playerPosition.z);
        } catch (error) {
            console.debug(`Error getting terrain height in collision manager: ${error.message}`);
            terrainHeight = null;
        }
        
        // Validate terrain height
        if (terrainHeight === null || terrainHeight === undefined || isNaN(terrainHeight) || !isFinite(terrainHeight)) {
            console.warn("Invalid terrain height calculated:", terrainHeight);
            // Use a safe default height
            const safeHeight = 2;
            this.player.setPosition(playerPosition.x, safeHeight, playerPosition.z);
            return;
        }
        
        // Let the player's updateTerrainHeight method handle the height adjustment
        // This avoids duplicate height adjustments that can cause vibration
        
        // Water has been removed, so player is never in water
        this.player.setInWater(false);
    }
    
    checkSkillEnemyCollisions() {
        // Get active player skills
        const activeSkills = this.player.getActiveSkills();
        
        // Check each active skill for collisions with enemies
        activeSkills.forEach(skill => {
            const skillPosition = skill.getPosition();
            const skillRadius = skill.getRadius();
            
            // Check collision with each enemy
            this.enemyManager.enemies.forEach(enemy => {
                const enemyPosition = enemy.getPosition();
                const enemyRadius = enemy.getCollisionRadius();
                
                // Calculate distance between skill and enemy
                const distance = skillPosition.distanceTo(enemyPosition);
                
                // Check if collision occurred
                if (distance < skillRadius + enemyRadius) {
                    // Handle collision
                    this.handleSkillEnemyCollision(skill, enemy);
                }
            });
        });
    }
    
    handleSkillEnemyCollision(skill, enemy) {
        // We need to generate a unique key that identifies:
        // 1. The specific skill instance (not just the skill type)
        // 2. The specific enemy
        // 3. The specific cast of the skill (to allow multiple casts)
        
        // Get a unique identifier for this skill instance
        // We'll use a combination of the skill name, creation time, and a unique ID if available
        let skillInstanceId;
        if (skill.instanceId) {
            // If the skill has an instance ID, use it
            skillInstanceId = skill.instanceId;
        } else {
            // Otherwise, generate one based on the skill's creation time and name
            // This will be different for each cast of the skill
            skillInstanceId = `${skill.name}-${Date.now()}`;
            skill.instanceId = skillInstanceId; // Store it for future reference
        }
        
        const enemyId = enemy.id || enemy.uuid || `enemy-${enemy.getPosition().toArray().join(',')}`;
        const hitKey = `${skillInstanceId}-${enemyId}`;
        
        // Check if this specific instance of the skill has already hit this enemy
        if (this.skillHitRegistry.has(hitKey)) {
            return; // Skip if already hit by this specific instance
        }
        
        // Mark this enemy as hit by this specific skill instance
        this.skillHitRegistry.set(hitKey, {
            timestamp: Date.now(),
            skillName: skill.name,
            enemyId: enemyId
        });
        
        // Apply skill damage to enemy
        const damage = skill.getDamage();
        enemy.takeDamage(damage);
        
        // Get enemy position for effects
        const enemyPosition = enemy.getPosition();
        
        // Show damage number with bleeding effect
        this.player.game.hudManager.createBleedingEffect(damage, enemyPosition);
        
        // Check if enemy is defeated
        if (enemy.getHealth() <= 0) {
            // Award experience to player
            this.player.addExperience(enemy.getExperienceValue());
            
            // Check for quest completion
            this.player.game.questManager.updateEnemyKill(enemy);
        }
        
        // Call the skill's hit effect method
        // This allows skills to create visual effects when they hit an enemy
        if (skill.effect) {
            // All skill effects inherit from SkillEffect which has a createHitEffect method
            skill.effect.createHitEffect(enemyPosition);
        }
        
        // Clean up old entries from the hit registry occasionally
        if (Math.random() < 0.01) { // ~1% chance per frame
            this.cleanupHitRegistry();
        }
    }
    
    /**
     * Clean up old entries from the hit registry
     * This prevents the registry from growing too large over time
     */
    cleanupHitRegistry() {
        // Get current time
        const currentTime = Date.now();
        
        // Remove entries older than 5 seconds
        // This allows the same skill to hit the same enemy again if cast after 5 seconds
        let removedCount = 0;
        for (const [key, data] of this.skillHitRegistry.entries()) {
            if (data.timestamp && currentTime - data.timestamp > 5000) {
                this.skillHitRegistry.delete(key);
                removedCount++;
            }
        }
        
        // Log cleanup if entries were removed
        if (removedCount > 0) {
            console.debug(`Cleaned up ${removedCount} entries from hit registry. New size: ${this.skillHitRegistry.size}`);
        }
        
        // If the registry is still too large, clear it completely
        // This is a fallback to prevent memory issues
        if (this.skillHitRegistry.size > 1000) {
            console.debug(`Hit registry too large (${this.skillHitRegistry.size}), clearing all entries`);
            this.skillHitRegistry.clear();
        }
    }
    
    checkEnemyEnemyCollisions() {
        const enemies = this.enemyManager.enemies;
        
        // Check each pair of enemies for collisions
        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const enemy1 = enemies[i];
                const enemy2 = enemies[j];
                
                const position1 = enemy1.getPosition();
                const position2 = enemy2.getPosition();
                
                const radius1 = enemy1.getCollisionRadius();
                const radius2 = enemy2.getCollisionRadius();
                
                // Calculate distance between enemies
                const distance = position1.distanceTo(position2);
                
                // Check if collision occurred
                if (distance < radius1 + radius2) {
                    // Handle collision
                    this.handleEnemyEnemyCollision(enemy1, enemy2);
                }
            }
        }
    }
    
    handleEnemyEnemyCollision(enemy1, enemy2) {
        const position1 = enemy1.getPosition();
        const position2 = enemy2.getPosition();
        
        // Calculate direction from enemy2 to enemy1
        const direction = new THREE.Vector3().subVectors(position1, position2).normalize();
        
        // Move enemies away from each other
        const pushDistance = 0.05;
        
        enemy1.setPosition(
            position1.x + direction.x * pushDistance,
            position1.y,
            position1.z + direction.z * pushDistance
        );
        
        enemy2.setPosition(
            position2.x - direction.x * pushDistance,
            position2.y,
            position2.z - direction.z * pushDistance
        );
    }
}