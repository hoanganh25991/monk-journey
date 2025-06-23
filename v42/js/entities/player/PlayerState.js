/**
 * PlayerState.js
 * Manages the player's state (moving, attacking, etc.)
 */
export class PlayerState {
    constructor() {
        // Initialize state
        this.state = {
            isMoving: false,
            isAttacking: false,
            isUsingSkill: false,
            isDead: false,
            inWater: false,
            isInteracting: false
        };
        
        // Initialize status effects
        this.statusEffects = {
            slow: {
                active: false,
                endTime: 0,
                intensity: 0 // 0-1 value representing effect strength
            },
            freeze: {
                active: false,
                endTime: 0,
                intensity: 0
            },
            burn: {
                active: false,
                endTime: 0,
                intensity: 0,
                tickDamage: 0
            },
            poison: {
                active: false,
                endTime: 0,
                intensity: 0,
                tickDamage: 0
            }
        };
    }
    
    // State methods
    isMoving() {
        return this.state.isMoving;
    }
    
    isAttacking() {
        return this.state.isAttacking;
    }
    
    isUsingSkill() {
        return this.state.isUsingSkill;
    }
    
    isDead() {
        return this.state.isDead;
    }
    
    isInWater() {
        return this.state.inWater;
    }
    
    isInteracting() {
        return this.state.isInteracting;
    }
    
    // State setters
    setMoving(isMoving) {
        this.state.isMoving = isMoving;
    }
    
    setAttacking(isAttacking) {
        this.state.isAttacking = isAttacking;
    }
    
    setUsingSkill(isUsingSkill) {
        this.state.isUsingSkill = isUsingSkill;
    }
    
    setDead(isDead) {
        this.state.isDead = isDead;
    }
    
    setInWater(inWater) {
        this.state.inWater = inWater;
    }
    
    setInteracting(isInteracting) {
        this.state.isInteracting = isInteracting;
    }
    
    // Status effect methods
    /**
     * Apply a status effect to the player
     * @param {string} effectType - The type of effect (slow, freeze, burn, poison)
     * @param {number} duration - Duration in seconds
     * @param {number} intensity - Effect intensity (0-1)
     * @param {number} tickDamage - Damage per tick for damage-over-time effects
     */
    applyStatusEffect(effectType, duration, intensity = 0.5, tickDamage = 0) {
        if (this.statusEffects[effectType]) {
            this.statusEffects[effectType].active = true;
            this.statusEffects[effectType].endTime = Date.now() + (duration * 1000);
            this.statusEffects[effectType].intensity = intensity;
            
            if (tickDamage > 0 && (effectType === 'burn' || effectType === 'poison')) {
                this.statusEffects[effectType].tickDamage = tickDamage;
            }
            
            console.debug(`Player affected by ${effectType} for ${duration} seconds (intensity: ${intensity})`);
            return true;
        }
        return false;
    }
    
    /**
     * Check if a status effect is active
     * @param {string} effectType - The type of effect
     * @returns {boolean} True if the effect is active
     */
    hasStatusEffect(effectType) {
        if (this.statusEffects[effectType]) {
            // Check if effect is active and not expired
            if (this.statusEffects[effectType].active && Date.now() < this.statusEffects[effectType].endTime) {
                return true;
            } else if (this.statusEffects[effectType].active) {
                // If expired, deactivate it
                this.statusEffects[effectType].active = false;
                return false;
            }
        }
        return false;
    }
    
    /**
     * Get the intensity of a status effect
     * @param {string} effectType - The type of effect
     * @returns {number} The effect intensity (0-1) or 0 if not active
     */
    getStatusEffectIntensity(effectType) {
        if (this.hasStatusEffect(effectType)) {
            return this.statusEffects[effectType].intensity;
        }
        return 0;
    }
    
    /**
     * Update status effects (check expiration, apply damage ticks)
     * @param {number} delta - Time since last update in seconds
     * @param {Player} player - Reference to the player for applying damage
     */
    updateStatusEffects(delta, player) {
        // Check each effect
        for (const [effectType, effect] of Object.entries(this.statusEffects)) {
            if (effect.active) {
                // Check if expired
                if (Date.now() >= effect.endTime) {
                    effect.active = false;
                    console.debug(`${effectType} effect expired`);
                } 
                // Apply damage for DoT effects
                else if ((effectType === 'burn' || effectType === 'poison') && effect.tickDamage > 0) {
                    // Apply damage every 0.5 seconds
                    if (Math.random() < delta * 2) { // Randomize slightly to avoid all ticks happening at once
                        const tickDamage = effect.tickDamage * effect.intensity;
                        player.takeDamage(tickDamage);
                        console.debug(`${effectType} dealt ${tickDamage.toFixed(1)} damage`);
                    }
                }
            }
        }
    }
    
    /**
     * Remove all status effects
     */
    clearStatusEffects() {
        for (const effect of Object.values(this.statusEffects)) {
            effect.active = false;
        }
    }
}