/**
 * PlayerStatusEffects.js
 * Manages status effects applied to the player
 */
export class PlayerStatusEffects {
    /**
     * Creates a new PlayerStatusEffects instance
     * @param {import('./PlayerStats.js').PlayerStats} playerStats - The player's stats
     * @param {import('./PlayerMovement.js').PlayerMovement} playerMovement - The player's movement component
     * @param {Object} [game=null] - The main game instance
     */
    constructor(playerStats, playerMovement, game = null) {
        this.playerStats = playerStats;
        this.playerMovement = playerMovement;
        this.game = game;
        
        /**
         * Active status effects
         * @type {Map<string, {duration: number, originalValue: number, intensity: number}>}
         */
        this.activeEffects = new Map();
        
        /**
         * Effect definitions
         * @type {Object}
         */
        this.effectDefinitions = {
            slow: {
                apply: (intensity) => {
                    // Store original movement speed
                    const originalSpeed = this.playerStats.getMovementSpeed();
                    
                    // Apply slow effect (reduce speed by intensity percentage)
                    const slowFactor = 1 - (intensity || 0.3); // Default 30% slow
                    this.playerStats.movementSpeed = originalSpeed * slowFactor;
                    
                    // Visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.showStatusEffect('slow');
                    }
                    
                    // Return original value for restoration later
                    return originalSpeed;
                },
                remove: (originalValue) => {
                    // Restore original movement speed
                    this.playerStats.movementSpeed = originalValue;
                    
                    // Remove visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.hideStatusEffect('slow');
                    }
                }
            },
            stun: {
                apply: (intensity) => {
                    // Store original can-move state
                    const originalCanMove = this.playerMovement.canMove;
                    
                    // Apply stun effect
                    this.playerMovement.canMove = false;
                    
                    // Visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.showStatusEffect('stun');
                    }
                    
                    // Return original value for restoration later
                    return originalCanMove;
                },
                remove: (originalValue) => {
                    // Restore original can-move state
                    this.playerMovement.canMove = originalValue;
                    
                    // Remove visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.hideStatusEffect('stun');
                    }
                }
            },
            // Add more effects as needed
            invulnerable: {
                apply: (intensity) => {
                    // Store original state (nothing to store for invulnerability)
                    const originalValue = false;
                    
                    // Visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.showStatusEffect('invulnerable');
                    }
                    
                    // Add visual effect to player model if available
                    if (this.game?.effectsManager) {
                        // Create a shield/glow effect around the player
                        this.game.effectsManager.createShieldEffect(this.playerMovement.getPosition());
                    }
                    
                    return originalValue;
                },
                remove: (originalValue) => {
                    // Remove visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.hideStatusEffect('invulnerable');
                    }
                    
                    // Remove shield effect if it exists
                    if (this.game?.effectsManager) {
                        this.game.effectsManager.removeShieldEffect();
                    }
                }
            },
            // Defense boost effect for Fist of Thunder skill
            defenseBoost: {
                apply: (intensity) => {
                    // Store original state (nothing to store for defense boost)
                    const originalValue = 0;
                    
                    // Visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.showStatusEffect('defenseBoost');
                    }
                    
                    // Add visual effect to player model if available
                    if (this.game?.effectsManager) {
                        // Create a shield/glow effect around the player
                        this.game.effectsManager.createDefenseBoostEffect(this.playerMovement.getPosition());
                    }
                    
                    console.debug(`Applied defense boost effect: ${intensity * 100}% damage reduction`);
                    
                    return originalValue;
                },
                remove: (originalValue) => {
                    // Remove visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.hideStatusEffect('defenseBoost');
                    }
                    
                    // Remove shield effect if it exists
                    if (this.game?.effectsManager) {
                        this.game.effectsManager.removeDefenseBoostEffect();
                    }
                    
                    console.debug("Defense boost effect expired");
                }
            },
            // Freeze effect
            freeze: {
                apply: (intensity) => {
                    // Store original movement speed and can-move state
                    const originalSpeed = this.playerStats.getMovementSpeed();
                    const originalCanMove = this.playerMovement.canMove;
                    
                    // Apply freeze effect (completely stop movement)
                    this.playerStats.movementSpeed = 0;
                    this.playerMovement.canMove = false;
                    
                    // Visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.showStatusEffect('freeze');
                    }
                    
                    // Add visual effect to player model if available
                    if (this.game?.effectsManager) {
                        this.game.effectsManager.createFreezeEffect(this.playerMovement.getPosition());
                    }
                    
                    console.debug(`Applied freeze effect for ${intensity} seconds`);
                    
                    // Return original values for restoration later
                    return { speed: originalSpeed, canMove: originalCanMove };
                },
                remove: (originalValue) => {
                    // Restore original movement speed and can-move state
                    if (originalValue && typeof originalValue === 'object') {
                        this.playerStats.movementSpeed = originalValue.speed;
                        this.playerMovement.canMove = originalValue.canMove;
                    } else {
                        // Fallback to default values
                        this.playerStats.movementSpeed = this.playerStats.baseMovementSpeed || 5;
                        this.playerMovement.canMove = true;
                    }
                    
                    // Remove visual feedback
                    if (this.game?.hudManager) {
                        this.game.hudManager.hideStatusEffect('freeze');
                    }
                    
                    // Remove freeze effect if it exists
                    if (this.game?.effectsManager) {
                        this.game.effectsManager.removeFreezeEffect();
                    }
                    
                    console.debug("Freeze effect expired");
                }
            }
        };
    }
    
    /**
     * Apply a status effect to the player
     * @param {string} effectType - The type of effect to apply
     * @param {number} duration - Duration of the effect in seconds
     * @param {number} [intensity=1] - Intensity of the effect (1 = 100%)
     * @returns {boolean} - Whether the effect was successfully applied
     */
    applyEffect(effectType, duration, intensity = 1) {
        // Check if effect type exists
        if (!this.effectDefinitions[effectType]) {
            console.warn(`Unknown effect type: ${effectType}`);
            return false;
        }
        
        // Get effect definition
        const effectDef = this.effectDefinitions[effectType];
        
        // Check if effect is already active
        if (this.activeEffects.has(effectType)) {
            // Get existing effect
            const existingEffect = this.activeEffects.get(effectType);
            
            // If new effect is more intense or has longer duration, replace it
            if (intensity > existingEffect.intensity || duration > existingEffect.duration) {
                // Remove existing effect
                effectDef.remove(existingEffect.originalValue);
                
                // Apply new effect
                const originalValue = effectDef.apply(intensity);
                
                // Update effect data
                existingEffect.duration = duration;
                existingEffect.intensity = intensity;
                existingEffect.originalValue = originalValue;
            } else {
                // Just extend duration if new effect is not stronger
                existingEffect.duration = Math.max(existingEffect.duration, duration);
            }
        } else {
            // Apply new effect
            const originalValue = effectDef.apply(intensity);
            
            // Store effect data
            this.activeEffects.set(effectType, {
                duration,
                originalValue,
                intensity
            });
            
            // Play sound effect if available
            if (this.game?.audioManager) {
                this.game.audioManager.playSound(`effect_${effectType}`);
            }
            
            console.debug(`Applied ${effectType} effect to player for ${duration} seconds at ${intensity * 100}% intensity`);
        }
        
        return true;
    }
    
    /**
     * Remove a specific status effect
     * @param {string} effectType - The type of effect to remove
     * @returns {boolean} - Whether the effect was successfully removed
     */
    removeEffect(effectType) {
        // Check if effect is active
        if (!this.activeEffects.has(effectType)) {
            return false;
        }
        
        // Get effect data
        const effectData = this.activeEffects.get(effectType);
        
        // Get effect definition
        const effectDef = this.effectDefinitions[effectType];
        
        // Remove effect
        effectDef.remove(effectData.originalValue);
        
        // Remove from active effects
        this.activeEffects.delete(effectType);
        
        console.debug(`Removed ${effectType} effect from player`);
        
        return true;
    }
    
    /**
     * Update all active effects
     * @param {number} delta - Time since last update in seconds
     */
    update(delta) {
        // Process each active effect
        for (const [effectType, effectData] of this.activeEffects.entries()) {
            // Reduce duration
            effectData.duration -= delta;
            
            // Remove expired effects
            if (effectData.duration <= 0) {
                this.removeEffect(effectType);
            }
        }
    }
    
    /**
     * Check if a specific effect is active
     * @param {string} effectType - The type of effect to check
     * @returns {boolean} - Whether the effect is active
     */
    hasEffect(effectType) {
        return this.activeEffects.has(effectType);
    }
    
    /**
     * Get the remaining duration of an effect
     * @param {string} effectType - The type of effect to check
     * @returns {number} - Remaining duration in seconds, or 0 if not active
     */
    getEffectDuration(effectType) {
        if (!this.activeEffects.has(effectType)) {
            return 0;
        }
        
        return this.activeEffects.get(effectType).duration;
    }
    
    /**
     * Get all active effects
     * @returns {Object} - Map of active effects with their durations
     */
    getAllEffects() {
        const effects = {};
        
        for (const [effectType, effectData] of this.activeEffects.entries()) {
            effects[effectType] = {
                duration: effectData.duration,
                intensity: effectData.intensity
            };
        }
        
        return effects;
    }
    
    /**
     * Clear all active effects
     */
    clearAllEffects() {
        // Remove each effect
        for (const effectType of this.activeEffects.keys()) {
            this.removeEffect(effectType);
        }
    }
}