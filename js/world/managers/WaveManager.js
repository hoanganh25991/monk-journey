import * as THREE from 'three';

/**
 * WaveManager - Manages wave-based enemy spawning with consistent enemy counts
 * Maintains exactly 500 enemies on the field at all times during wave mode
 */
export class WaveManager {
    /**
     * Create a new WaveManager
     * @param {import("../../game/Game.js").Game} game - Reference to the game instance
     */
    constructor(game) {
        this.game = game;
        
        // Wave configuration
        this.isWaveMode = false;
        this.currentWave = 1;
        this.enemiesPerWave = 500; // Consistent enemy count on field
        this.enemiesKilledThisWave = 0;
        this.difficultyMultiplier = 1.0;
        this.portalDifficulty = 1.0; // From portal configuration
        
        // Enemy tracking
        this.activeEnemies = new Set();
        this.lastEnemyCheckTime = 0;
        this.enemyCheckInterval = 3000; // Check every 3 seconds
        
        // Wave progression
        this.waveStrengthIncrease = 0.15; // 15% increase per wave
        this.maxWaves = 999; // Essentially unlimited
        
        // Wave area tracking
        this.waveAreaCenter = null; // Center of the wave area
        this.waveAreaRadius = 150; // Radius in units - if player goes beyond this, stop wave mode
        this.lastPlayerPositionCheck = 0;
        this.playerPositionCheckInterval = 2000; // Check every 2 seconds
        
        // UI elements for wave display
        this.waveDisplayElement = null;
        this.createWaveDisplay();
        
        // Bind methods
        this.onEnemyKilled = this.onEnemyKilled.bind(this);
        this.checkEnemyCount = this.checkEnemyCount.bind(this);
        
        console.debug('WaveManager initialized');
    }
    
    /**
     * Create the wave display UI element
     */
    createWaveDisplay() {
        // Remove existing display if any
        if (this.waveDisplayElement) {
            this.waveDisplayElement.remove();
        }
        
        // Create wave display container
        this.waveDisplayElement = document.createElement('div');
        this.waveDisplayElement.id = 'wave-display';
        this.waveDisplayElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Arial', sans-serif;
            font-size: 18px;
            font-weight: bold;
            border: 2px solid #ffd700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            z-index: 1000;
            text-align: center;
            min-width: 200px;
            display: none;
            animation: waveGlow 2s ease-in-out infinite alternate;
        `;
        
        // Add CSS animation for glow effect
        if (!document.getElementById('wave-display-styles')) {
            const style = document.createElement('style');
            style.id = 'wave-display-styles';
            style.textContent = `
                @keyframes waveGlow {
                    0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
                    100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
                }
                
                .wave-complete {
                    animation: waveComplete 1s ease-in-out;
                    background: rgba(0, 255, 0, 0.9) !important;
                }
                
                @keyframes waveComplete {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(this.waveDisplayElement);
        console.debug('Wave display UI created');
    }
    
    /**
     * Start wave mode with specified difficulty
     * @param {number} portalDifficulty - Difficulty multiplier from portal (0.002 to 2.0)
     * @param {string} portalName - Name of the portal for display
     * @param {THREE.Vector3} centerPosition - Center position of the wave area (optional)
     */
    startWaveMode(portalDifficulty = 1.0, portalName = 'Standard Mode', centerPosition = null) {
        console.debug(`Starting wave mode with difficulty ${portalDifficulty} from ${portalName}`);
        
        this.isWaveMode = true;
        this.currentWave = 1;
        this.enemiesKilledThisWave = 0;
        this.portalDifficulty = portalDifficulty;
        this.activeEnemies.clear();
        
        // Set wave area center (for distance checking)
        if (centerPosition) {
            this.waveAreaCenter = centerPosition.clone();
        } else if (this.game && this.game.player) {
            this.waveAreaCenter = this.game.player.getPosition().clone();
        }
        
        // Show wave display
        this.updateWaveDisplay();
        this.waveDisplayElement.style.display = 'block';
        
        // Start enemy monitoring
        this.startEnemyMonitoring();
        
        // Spawn initial wave
        this.spawnInitialWave();
        
        // Show wave start notification
        if (this.game.hudManager) {
            this.game.hudManager.showNotification(
                `🌊 WAVE MODE STARTED! - ${portalName}\n` +
                `Wave 1 beginning with ${this.enemiesPerWave} enemies!\n` +
                `Stay within the area to continue waves!`,
                5000
            );
        }
    }
    
    /**
     * Stop wave mode and return to normal gameplay
     */
    stopWaveMode() {
        console.debug('Stopping wave mode - returning to normal enemy spawning');
        
        this.isWaveMode = false;
        this.waveDisplayElement.style.display = 'none';
        
        // Stop enemy monitoring
        this.stopEnemyMonitoring();
        
        // Clean up active enemies tracking
        this.activeEnemies.clear();
        
        // Reset enemy manager max enemies to normal values
        if (this.game && this.game.enemyManager) {
            this.game.enemyManager.maxEnemies = 100; // Return to normal max enemies
            console.debug('Reset enemy manager max enemies to normal (100)');
        }
        
        if (this.game.hudManager) {
            this.game.hudManager.showNotification(
                `🏁 Wave mode ended! Completed ${this.currentWave - 1} waves!\n` +
                `Returning to normal enemy spawning...`,
                4000
            );
        }
        
        // Reset wave tracking variables
        this.currentWave = 1;
        this.enemiesKilledThisWave = 0;
        this.portalDifficulty = 1.0;
        this.waveAreaCenter = null;
        
        // Clear any wave-specific enemy modifications
        this.clearWaveEnemyModifications();
        
        console.debug('Wave mode fully stopped - normal enemy spawning resumed');
    }
    
    /**
     * Clear any wave-specific modifications applied to existing enemies
     */
    clearWaveEnemyModifications() {
        if (!this.game || !this.game.enemyManager) return;
        
        // Reset any enemies that have wave modifications back to normal
        this.game.enemyManager.enemies.forEach((enemy, id) => {
            if (enemy && enemy.baseHealth !== undefined) {
                // Reset health to base values if it was modified by wave scaling
                enemy.health = enemy.baseHealth;
                enemy.maxHealth = enemy.baseHealth;
                
                // Clear wave modification flags
                delete enemy.baseHealth;
                delete enemy.baseDamage;
                delete enemy.waveModified;
                
                console.debug(`Reset enemy ${id} to normal stats`);
            }
        });
        
        console.debug('Cleared wave-specific enemy modifications');
    }
    
    /**
     * Update the wave display UI
     */
    updateWaveDisplay() {
        if (!this.waveDisplayElement || !this.isWaveMode) return;
        
        const progress = Math.min(this.enemiesKilledThisWave, this.enemiesPerWave);
        const percentage = Math.floor((progress / this.enemiesPerWave) * 100);
        
        this.waveDisplayElement.innerHTML = `
            <div style="margin-bottom: 8px;">🌊 WAVE ${this.currentWave}</div>
            <div style="font-size: 14px; margin-bottom: 8px;">
                Progress: ${progress}/${this.enemiesPerWave} (${percentage}%)
            </div>
            <div style="background: rgba(255,255,255,0.3); height: 6px; border-radius: 3px; margin-bottom: 8px;">
                <div style="background: #ffd700; height: 100%; width: ${percentage}%; border-radius: 3px; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 12px; color: #ccc;">
                Enemies: ${this.activeEnemies.size}/500
            </div>
        `;
    }
    
    /**
     * Start monitoring enemy count every 3 seconds
     */
    startEnemyMonitoring() {
        this.enemyMonitoringInterval = setInterval(this.checkEnemyCount, this.enemyCheckInterval);
        console.debug('Started enemy monitoring - checking every 3 seconds');
    }
    
    /**
     * Stop enemy monitoring
     */
    stopEnemyMonitoring() {
        if (this.enemyMonitoringInterval) {
            clearInterval(this.enemyMonitoringInterval);
            this.enemyMonitoringInterval = null;
            console.debug('Stopped enemy monitoring');
        }
    }
    
    /**
     * Check enemy count and spawn more if needed
     * Also check if player is still in wave area
     */
    checkEnemyCount() {
        if (!this.isWaveMode || !this.game.enemyManager) return;
        
        // Check if player is still in wave area
        if (this.checkPlayerInWaveArea() === false) {
            console.debug('Player left wave area - stopping wave mode');
            this.stopWaveMode();
            return;
        }
        
        // Update active enemies count from enemy manager
        this.updateActiveEnemiesFromManager();
        
        const currentEnemyCount = this.activeEnemies.size;
        const needed = this.enemiesPerWave - currentEnemyCount;
        
        console.debug(`Enemy count check: ${currentEnemyCount}/${this.enemiesPerWave}, need to spawn: ${needed}`);
        
        if (needed > 0) {
            this.spawnEnemies(needed);
        }
        
        // Update display
        this.updateWaveDisplay();
    }
    
    /**
     * Check if player is still within the wave area
     * @returns {boolean} True if player is in wave area, false if they left
     */
    checkPlayerInWaveArea() {
        if (!this.waveAreaCenter || !this.game || !this.game.player) {
            return true; // If we can't check, assume they're still in area
        }
        
        const currentTime = Date.now();
        
        // Don't check too frequently to avoid performance issues
        if (currentTime - this.lastPlayerPositionCheck < this.playerPositionCheckInterval) {
            return true;
        }
        
        this.lastPlayerPositionCheck = currentTime;
        
        const playerPosition = this.game.player.getPosition();
        const distance = playerPosition.distanceTo(this.waveAreaCenter);
        
        if (distance > this.waveAreaRadius) {
            console.debug(`Player left wave area: distance ${distance.toFixed(1)} > radius ${this.waveAreaRadius}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Update our active enemies tracking from the enemy manager
     */
    updateActiveEnemiesFromManager() {
        if (!this.game.enemyManager) return;
        
        // Clear our set and rebuild from enemy manager
        this.activeEnemies.clear();
        
        // Add all living enemies from enemy manager
        this.game.enemyManager.enemies.forEach((enemy, id) => {
            if (enemy && enemy.health > 0) {
                this.activeEnemies.add(id);
            }
        });
    }
    
    /**
     * Spawn initial wave of enemies
     */
    spawnInitialWave() {
        console.debug(`Spawning initial wave of ${this.enemiesPerWave} enemies`);
        this.spawnEnemies(this.enemiesPerWave);
    }
    
    /**
     * Spawn a specific number of enemies around the player
     * @param {number} count - Number of enemies to spawn
     */
    spawnEnemies(count) {
        if (!this.game.enemyManager || !this.game.player) return;
        
        const playerPosition = this.game.player.getPosition();
        console.debug(`Spawning ${count} enemies around player at (${playerPosition.x.toFixed(1)}, ${playerPosition.z.toFixed(1)})`);
        
        // Get appropriate enemy types for current zone
        const enemyTypes = this.getWaveEnemyTypes();
        
        // Calculate enemy stats based on wave and portal difficulty
        const waveMultiplier = 1 + (this.currentWave - 1) * this.waveStrengthIncrease;
        const finalDifficulty = this.portalDifficulty * waveMultiplier;
        
        // Spawn enemies in rings around the player
        this.spawnEnemiesInRings(playerPosition, count, enemyTypes, finalDifficulty);
    }
    
    /**
     * Spawn enemies in concentric rings around a position
     * @param {THREE.Vector3} centerPosition - Center position for spawning
     * @param {number} totalCount - Total number of enemies to spawn
     * @param {Array} enemyTypes - Array of enemy types to choose from
     * @param {number} difficultyMultiplier - Difficulty multiplier for enemy stats
     */
    spawnEnemiesInRings(centerPosition, totalCount, enemyTypes, difficultyMultiplier) {
        const rings = [
            { distance: 15, count: 0.35 }, // 35% in inner ring
            { distance: 25, count: 0.30 }, // 30% in middle ring
            { distance: 40, count: 0.25 }, // 25% in outer ring
            { distance: 60, count: 0.10 }  // 10% in far ring
        ];
        
        let spawnedCount = 0;
        
        for (const ring of rings) {
            const enemiesInRing = Math.floor(totalCount * ring.count);
            if (enemiesInRing === 0) continue;
            
            const angleStep = (Math.PI * 2) / enemiesInRing;
            const startAngle = Math.random() * Math.PI * 2;
            
            for (let i = 0; i < enemiesInRing && spawnedCount < totalCount; i++) {
                const angle = startAngle + (angleStep * i);
                const distance = ring.distance + (Math.random() - 0.5) * 8; // Add some variation
                
                const x = centerPosition.x + Math.cos(angle) * distance;
                const z = centerPosition.z + Math.sin(angle) * distance;
                
                // Get terrain height
                let y = 0;
                try {
                    const terrainHeight = this.game.world.getTerrainHeight(x, z);
                    y = (terrainHeight !== null && terrainHeight !== undefined && isFinite(terrainHeight)) ? terrainHeight : 0;
                } catch (error) {
                    y = 0;
                }
                
                // Select random enemy type
                const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                
                // Spawn enemy with modified stats
                const enemyPosition = new THREE.Vector3(x, y, z);
                const enemy = this.game.enemyManager.spawnEnemy(enemyType, enemyPosition);
                
                if (enemy) {
                    // Apply difficulty scaling
                    this.scaleEnemyDifficulty(enemy, difficultyMultiplier);
                    
                    // Track this enemy
                    this.activeEnemies.add(enemy.id);
                    spawnedCount++;
                }
            }
        }
        
        console.debug(`Spawned ${spawnedCount} enemies for wave ${this.currentWave} with difficulty ${difficultyMultiplier.toFixed(3)}`);
    }
    
    /**
     * Scale enemy difficulty based on wave and portal settings
     * @param {Enemy} enemy - The enemy to scale
     * @param {number} difficultyMultiplier - The difficulty multiplier to apply
     */
    scaleEnemyDifficulty(enemy, difficultyMultiplier) {
        if (!enemy) return;
        
        // Scale health and damage based on difficulty
        if (enemy.baseHealth === undefined) {
            enemy.baseHealth = enemy.health;
        }
        if (enemy.baseDamage === undefined) {
            enemy.baseDamage = enemy.damage;
        }
        
        enemy.health = Math.max(1, Math.floor(enemy.baseHealth * difficultyMultiplier));
        enemy.maxHealth = enemy.health;
        enemy.damage = Math.max(1, Math.floor(enemy.baseDamage * difficultyMultiplier));
        
        // Mark as wave-modified for cleanup later
        enemy.waveModified = true;
        
        console.debug(`Scaled enemy (${enemy.type}): Health ${enemy.baseHealth} -> ${enemy.health}, Damage ${enemy.baseDamage} -> ${enemy.damage}`);
    }
    
    /**
     * Get appropriate enemy types for wave spawning
     * @returns {Array} Array of enemy type strings
     */
    getWaveEnemyTypes() {
        // Try to get zone-specific enemies, fallback to basic types
        if (this.game.world && this.game.world.getZoneAt) {
            const playerPos = this.game.player.getPosition();
            const zone = this.game.world.getZoneAt(playerPos);
            
            if (zone && this.game.enemyManager.zoneEnemies[zone]) {
                return this.game.enemyManager.zoneEnemies[zone];
            }
        }
        
        // Fallback to basic enemy types
        return ['skeleton', 'zombie', 'spider', 'goblin'];
    }
    
    /**
     * Handle enemy death event
     * @param {string} enemyId - ID of the killed enemy
     */
    onEnemyKilled(enemyId) {
        if (!this.isWaveMode) return;
        
        // Remove from our tracking
        this.activeEnemies.delete(enemyId);
        
        // Increment kill count
        this.enemiesKilledThisWave++;
        
        console.debug(`Enemy killed in wave mode: ${this.enemiesKilledThisWave}/${this.enemiesPerWave} (${this.activeEnemies.size} active)`);
        
        // Check if wave is complete
        if (this.enemiesKilledThisWave >= this.enemiesPerWave) {
            this.completeWave();
        } else {
            // Update display
            this.updateWaveDisplay();
        }
    }
    
    /**
     * Complete the current wave and start the next one
     */
    completeWave() {
        console.debug(`Wave ${this.currentWave} completed!`);
        
        // Add visual effect to wave display
        this.waveDisplayElement.classList.add('wave-complete');
        setTimeout(() => {
            this.waveDisplayElement.classList.remove('wave-complete');
        }, 1000);
        
        // Show completion notification
        if (this.game.hudManager) {
            this.game.hudManager.showNotification(
                `🎉 WAVE ${this.currentWave} COMPLETE!\n` +
                `Starting Wave ${this.currentWave + 1}...`,
                4000
            );
        }
        
        // Advance to next wave
        this.currentWave++;
        this.enemiesKilledThisWave = 0;
        
        // Update display
        this.updateWaveDisplay();
        
        // Give a brief pause before spawning enemies for next wave
        setTimeout(() => {
            this.checkEnemyCount(); // This will spawn enemies if needed
        }, 2000);
    }
    
    /**
     * Get current wave information for display
     * @returns {Object} Wave information
     */
    getWaveInfo() {
        return {
            isActive: this.isWaveMode,
            currentWave: this.currentWave,
            enemiesKilled: this.enemiesKilledThisWave,
            enemiesNeeded: this.enemiesPerWave,
            activeEnemies: this.activeEnemies.size,
            difficulty: this.portalDifficulty,
            waveStrength: 1 + (this.currentWave - 1) * this.waveStrengthIncrease
        };
    }
    
    /**
     * Cleanup when the wave manager is destroyed
     */
    destroy() {
        this.stopWaveMode();
        
        if (this.waveDisplayElement) {
            this.waveDisplayElement.remove();
        }
        
        console.debug('WaveManager destroyed');
    }
}