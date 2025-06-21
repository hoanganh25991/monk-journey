export class Item {
    constructor(config) {
        // Basic properties
        this.id = config.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.name = config.name || 'Unknown Item';
        this.description = config.description || '';
        this.type = config.type || 'misc'; // weapon, armor, accessory, consumable
        this.subType = config.subType || ''; // fist, staff, robe, amulet, etc.
        this.icon = config.icon || '📦';
        this.level = config.level || 1;
        this.rarity = config.rarity || 'common'; // common, uncommon, rare, epic, legendary, mythic
        this.amount = config.amount || 1;
        this.templateId = config.templateId || null; // Store original template ID for save/load

        // Base stats
        this.baseStats = config.baseStats || {};
        
        // Secondary stats
        this.secondaryStats = config.secondaryStats || [];
        
        // Special effects
        this.specialEffects = config.specialEffects || [];
        
        // Set information
        this.setId = config.setId || null;
        
        // Visual properties - model path should be provided by ItemGenerator
        this.visual = config.visual || {};
        
        // Set default texture and particles if not provided
        this.visual.texture = this.visual.texture || null;
        this.visual.particles = this.visual.particles || null;
        
        // Add special effects for legendary and mythic items
        if (this.rarity === 'legendary' || this.rarity === 'mythic') {
            this.addRaritySpecialEffects();
        }
        
        // Enhance name for legendary and mythic items
        if (this.rarity === 'legendary' || this.rarity === 'mythic') {
            this.enhanceItemName();
        }
        
        // Add visual effects for legendary and mythic items
        if (this.rarity === 'legendary' || this.rarity === 'mythic') {
            this.addRarityVisualEffects();
        }
        
        // Calculate effective stats based on level and rarity
        this.calculateEffectiveStats();
    }
    
    calculateEffectiveStats() {
        // Rarity multipliers - significantly increased for legendary and mythic items
        const rarityMultipliers = {
            common: 1.0,
            uncommon: 1.3,
            rare: 1.8,
            epic: 2.5,
            legendary: 4.0,  // Increased from 2.5 to 4.0
            mythic: 6.0      // Increased from 3.0 to 6.0
        };
        
        // Level scaling factor
        const levelScaling = 1 + (this.level * 0.05);
        
        // Apply scaling to base stats
        this.stats = {};
        for (const [key, value] of Object.entries(this.baseStats)) {
            this.stats[key] = Math.round(value * levelScaling * rarityMultipliers[this.rarity]);
        }
        
        // For legendary and mythic items, add special scaling for certain stats
        if (this.rarity === 'legendary' || this.rarity === 'mythic') {
            // Apply additional multipliers to specific stats for legendary/mythic items
            const specialStatBoosts = {
                damage: this.rarity === 'legendary' ? 1.5 : 2.0,
                attackSpeed: this.rarity === 'legendary' ? 1.2 : 1.4,
                skillDamage: this.rarity === 'legendary' ? 1.5 : 2.0,
                defense: this.rarity === 'legendary' ? 1.3 : 1.6,
                movementSpeed: this.rarity === 'legendary' ? 1.2 : 1.3,
                critChance: this.rarity === 'legendary' ? 1.5 : 2.0,
                elementalDamage: this.rarity === 'legendary' ? 1.8 : 2.5
            };
            
            // Apply special boosts if the stat exists
            for (const [statName, boostMultiplier] of Object.entries(specialStatBoosts)) {
                if (this.stats[statName]) {
                    this.stats[statName] = Math.round(this.stats[statName] * boostMultiplier);
                }
            }
        }
        
        // Process secondary stats
        this.processedSecondaryStats = this.secondaryStats.map(stat => {
            let value = Math.round(stat.value * levelScaling * rarityMultipliers[this.rarity]);
            
            // Apply special multipliers to secondary stats for legendary and mythic items
            if (this.rarity === 'legendary' || this.rarity === 'mythic') {
                const secondaryStatBoost = this.rarity === 'legendary' ? 1.5 : 2.0;
                value = Math.round(value * secondaryStatBoost);
                
                // Extra boost for elemental damage secondary stats
                if (stat.type === 'elementalDamage' || stat.element) {
                    const elementalBoost = this.rarity === 'legendary' ? 1.3 : 1.8;
                    value = Math.round(value * elementalBoost);
                }
            }
            
            return {
                type: stat.type,
                value: value,
                element: stat.element || null
            };
        });
    }
    
    // Get a specific stat value
    getStat(statName) {
        if (this.stats[statName] !== undefined) {
            return this.stats[statName];
        }
        
        // Check secondary stats
        const secondaryStat = this.processedSecondaryStats.find(stat => stat.type === statName);
        if (secondaryStat) {
            return secondaryStat.value;
        }
        
        return 0;
    }
    
    // Check if item has a specific effect
    hasEffect(effectId) {
        return this.specialEffects.some(effect => effect.id === effectId);
    }
    
    // Get a specific effect
    getEffect(effectId) {
        return this.specialEffects.find(effect => effect.id === effectId);
    }
    
    // Get item display color based on rarity
    getColorHex() {
        const rarityColors = {
            common: '#FFFFFF',
            uncommon: '#1EFF00',
            rare: '#0070DD',
            epic: '#A335EE',
            legendary: '#FF8000',
            mythic: '#FF0000'
        };
        
        return rarityColors[this.rarity] || '#FFFFFF';
    }
    
    // Add special effects based on item rarity
    addRaritySpecialEffects() {
        const possibleEffects = [
            {
                id: 'criticalMastery',
                name: 'Critical Mastery',
                description: 'Increases critical hit damage by 50%',
                modifier: { stat: 'critDamage', value: 50 }
            },
            {
                id: 'elementalMastery',
                name: 'Elemental Mastery',
                description: 'Increases all elemental damage by 30%',
                modifier: { stat: 'allElementalDamage', value: 30 }
            },
            {
                id: 'lifeSteal',
                name: 'Life Steal',
                description: 'Converts 5% of damage dealt to health',
                modifier: { stat: 'lifeSteal', value: 5 }
            },
            {
                id: 'spiritRegen',
                name: 'Spirit Regeneration',
                description: 'Increases spirit regeneration by 50%',
                modifier: { stat: 'spiritRegen', value: 50 }
            },
            {
                id: 'cooldownReduction',
                name: 'Cooldown Mastery',
                description: 'Reduces all skill cooldowns by 15%',
                modifier: { stat: 'cooldownReduction', value: 15 }
            },
            {
                id: 'areaEffect',
                name: 'Area Effect',
                description: 'Attacks have a 20% chance to hit all enemies in a small radius',
                modifier: { stat: 'aoeChance', value: 20 }
            },
            {
                id: 'dodgeMastery',
                name: 'Dodge Mastery',
                description: 'Increases dodge chance by 10%',
                modifier: { stat: 'dodgeChance', value: 10 }
            },
            {
                id: 'elementalAffinity',
                name: 'Elemental Affinity',
                description: 'Reduces elemental damage taken by 20%',
                modifier: { stat: 'elementalResistance', value: 20 }
            }
        ];
        
        // Legendary items get 1-2 special effects
        // Mythic items get 2-3 special effects
        const numEffects = this.rarity === 'legendary' 
            ? 1 + Math.floor(Math.random() * 2) 
            : 2 + Math.floor(Math.random() * 2);
        
        // Shuffle the effects array
        const shuffledEffects = [...possibleEffects].sort(() => 0.5 - Math.random());
        
        // Add the first numEffects to the item
        for (let i = 0; i < numEffects && i < shuffledEffects.length; i++) {
            // Check if effect already exists
            if (!this.hasEffect(shuffledEffects[i].id)) {
                this.specialEffects.push(shuffledEffects[i]);
            }
        }
        
        // Add a unique effect for mythic items
        if (this.rarity === 'mythic') {
            const uniqueEffects = [
                {
                    id: 'enlightenment',
                    name: 'Enlightenment',
                    description: 'Increases experience gained by 25%',
                    modifier: { stat: 'experienceGain', value: 25 }
                },
                {
                    id: 'transcendence',
                    name: 'Transcendence',
                    description: 'When health drops below 20%, become invulnerable for 3 seconds (120s cooldown)',
                    modifier: { stat: 'transcendence', value: 1 }
                },
                {
                    id: 'spiritBurst',
                    name: 'Spirit Burst',
                    description: 'Skills have a 15% chance to cost no spirit',
                    modifier: { stat: 'freeSkillChance', value: 15 }
                }
            ];
            
            const randomUniqueEffect = uniqueEffects[Math.floor(Math.random() * uniqueEffects.length)];
            if (!this.hasEffect(randomUniqueEffect.id)) {
                this.specialEffects.push(randomUniqueEffect);
            }
        }
    }
    
    // Enhance item name based on rarity
    enhanceItemName() {
        const legendaryPrefixes = [
            'Ancient', 'Celestial', 'Divine', 'Eternal', 'Fabled', 
            'Hallowed', 'Immortal', 'Legendary', 'Mythical', 'Sacred'
        ];
        
        const mythicPrefixes = [
            'Astral', 'Cosmic', 'Ethereal', 'Godly', 'Infinite', 
            'Omnipotent', 'Primordial', 'Transcendent', 'Ultimate', 'Void'
        ];
        
        const suffixes = [
            'of the Ancients', 'of Enlightenment', 'of Transcendence', 
            'of the Cosmos', 'of Divinity', 'of the Elements', 
            'of Mastery', 'of Power', 'of the Sage', 'of the Void'
        ];
        
        // Select appropriate prefix based on rarity
        const prefixes = this.rarity === 'legendary' ? legendaryPrefixes : mythicPrefixes;
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        // 50% chance to add a suffix instead of a prefix
        if (Math.random() > 0.5) {
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            this.name = `${this.name} ${suffix}`;
        } else {
            this.name = `${prefix} ${this.name}`;
        }
    }
    
    // Add visual effects based on rarity
    addRarityVisualEffects() {
        // Legendary visual effects
        const legendaryEffects = [
            { type: 'glow', color: '#FF8000', intensity: 2.0 },
            { type: 'particles', effect: 'golden_sparkle', intensity: 1.0 },
            { type: 'trail', color: '#FF8000', duration: 0.5 }
        ];
        
        // Mythic visual effects
        const mythicEffects = [
            { type: 'glow', color: '#FF0000', intensity: 3.0 },
            { type: 'particles', effect: 'flame_aura', intensity: 1.5 },
            { type: 'trail', color: '#FF0000', duration: 1.0 },
            { type: 'pulse', color: '#FF0000', frequency: 1.5 }
        ];
        
        // Set visual effects based on rarity
        this.visual.effects = this.rarity === 'legendary' ? legendaryEffects : mythicEffects;
        
        // Add particle effects
        if (this.rarity === 'legendary') {
            this.visual.particles = this.visual.particles || 'particles/legendary.json';
        } else if (this.rarity === 'mythic') {
            this.visual.particles = this.visual.particles || 'particles/mythic.json';
        }
    }
}
