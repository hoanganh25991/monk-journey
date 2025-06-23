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
        
        // Calculate effective stats based on level and rarity
        this.calculateEffectiveStats();
    }
    
    calculateEffectiveStats() {
        // Rarity multipliers
        const rarityMultipliers = {
            common: 1.0,
            uncommon: 1.2,
            rare: 1.5,
            epic: 2.0,
            legendary: 2.5,
            mythic: 3.0
        };
        
        // Level scaling factor
        const levelScaling = 1 + (this.level * 0.05);
        
        // Apply scaling to base stats
        this.stats = {};
        for (const [key, value] of Object.entries(this.baseStats)) {
            this.stats[key] = Math.round(value * levelScaling * rarityMultipliers[this.rarity]);
        }
        
        // Process secondary stats
        this.processedSecondaryStats = this.secondaryStats.map(stat => {
            return {
                type: stat.type,
                value: Math.round(stat.value * levelScaling * rarityMultipliers[this.rarity]),
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
}
