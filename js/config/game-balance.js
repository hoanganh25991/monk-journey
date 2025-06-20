/**
 * Game Balance Configuration
 * Contains settings for game balance, difficulty scaling, combat mechanics, enemy configuration, and item drops
 */

// Player progression and stats configuration
export const PLAYER_PROGRESSION = {
    DEFAULT_PLAYER_STATS: {
        // Level and experience
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        
        // Health and mana
        health: 500,
        maxHealth: 500,
        mana: 600,         // Increased from 200 to 600 (3x)
        maxMana: 600,      // Increased from 200 to 600 (3x)
        
        // Base attributes
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        
        // Movement and combat
        movementSpeed: 15,
        attackPower: 10
    },

    // Experience scaling configuration
    EXPERIENCE_SCALING: {
        // Base multiplier for experience required to level up
        baseMultiplier: 1.5,
        
        // Additional scaling factor that increases with level
        // This makes higher levels progressively harder to reach
        progressiveIncrease: 0.05,
        
        // Maximum multiplier cap to prevent excessive grinding
        maxMultiplier: 3.0
    },
    
    // Legacy experience multiplier (for backward compatibility)
    LEVEL_UP_EXPERIENCE_MULTIPLIER : 1.5,

    // Resource regeneration rates (per second)
    RESOURCE_REGENERATION: {
        health: 2,
        // Base mana regeneration value (scales with player level in PlayerStats.js)
        // Each level adds 10% to this base value (implemented in PlayerStats.regenerateResources)
        mana: 5    // Base value at level 1
    },

    // Stat increases per level (used for linear scaling)
    LEVEL_UP_STAT_INCREASES: {
        maxHealth: 10,
        maxMana: 15,
        strength: 1,
        dexterity: 1,
        intelligence: 1,
        attackPower: 2,
        movementSpeed: 0.5
    },
    
    // Exponential stat scaling configuration
    STAT_SCALING: {
        // Whether to use exponential scaling (true) or linear scaling (false)
        useExponentialScaling: true,
        
        // Health scaling
        health: {
            baseValue: 500,
            growthFactor: 1.15
        },
        
        // Mana scaling
        mana: {
            baseValue: 600,
            growthFactor: 1.2
        },
        
        // Attribute scaling
        strength: {
            baseValue: 10,
            growthFactor: 1.1
        },
        
        dexterity: {
            baseValue: 10,
            growthFactor: 1.1
        },
        
        intelligence: {
            baseValue: 10,
            growthFactor: 1.1
        },
        
        // Combat scaling
        attackPower: {
            baseValue: 10,
            growthFactor: 1.12
        },
        
        // Movement scaling
        movementSpeed: {
            baseValue: 15,
            growthFactor: 1.08
        }
    }
};

// Enemy configuration
export const ENEMY_CONFIG = {
    // Health regeneration rates for different enemy types (per second)
    HEALTH_REGENERATION_RATES: {
        // Default regeneration rate (used if type not specified)
        'default': 0,
        
        // Undead enemies - minimal regeneration
        'skeleton': 0.5,
        'skeleton_archer': 0.5,
        'skeleton_king': 1.0,
        'zombie': 0.8,
        'zombie_brute': 1.2,
        
        // Magical/elemental enemies - moderate regeneration
        'necromancer': 2.0,
        'necromancer_lord': 3.0,
        'fire_elemental': 2.5,
        'frost_elemental': 2.5,
        'frost_titan': 4.0,
        'void_wraith': 3.0,
        
        // Natural/beast enemies - high regeneration
        'forest_spider': 1.5,
        'corrupted_treant': 3.0,
        'feral_wolf': 2.0,
        'swamp_horror': 4.0,
        'bog_lurker': 2.5,
        'mountain_troll': 3.5,
        
        // Demonic enemies - variable regeneration
        'demon': 1.5,
        'demon_scout': 1.0,
        'demon_lord': 3.0,
        'ash_demon': 2.0,
        'hellhound': 2.5,
        
        // Golem enemies - slow but steady regeneration
        'infernal_golem': 1.0,
        'lava_golem': 1.5,
        'ice_golem': 1.0
    },
    
    // Zone difficulty multipliers
    ZONE_DIFFICULTY_MULTIPLIERS: {
        'forest': 1.0,
        'ruins': 1.2,
        'swamp': 1.4,
        'mountains': 1.6,
        'dark_sanctum': 1.8,
        'hellfire_peaks': 2.0,
        'frozen_wastes': 2.2
    },

    // Zone-based enemy spawning
    ZONE_ENEMIES: {
        'forest': ['skeleton', 'zombie', 'shadow_beast', 'forest_spider', 'corrupted_treant', 'feral_wolf'],
        'ruins': ['skeleton', 'skeleton_archer', 'necromancer', 'ancient_guardian', 'cursed_spirit', 'ruin_crawler'],
        'swamp': ['zombie', 'zombie_brute', 'shadow_beast', 'poison_toad', 'bog_lurker', 'swamp_witch'],
        'mountains': ['demon', 'demon_scout', 'infernal_golem', 'frost_elemental', 'mountain_troll', 'harpy'],
        'dark_sanctum': ['necromancer', 'shadow_beast', 'infernal_golem', 'void_wraith', 'blood_cultist', 'shadow_stalker'],
        'hellfire_peaks': ['fire_elemental', 'lava_golem', 'ash_demon', 'flame_imp', 'hellhound'],
        'frozen_wastes': ['frost_elemental', 'ice_golem', 'snow_troll', 'frozen_revenant', 'winter_wolf']
    },
    
    // Zone-based boss spawning - this provides a clear mapping between zones and their bosses
    ZONE_BOSSES: {
        'forest': ['skeleton_king'],
        'ruins': ['necromancer_lord'],
        'swamp': ['swamp_horror'],
        'mountains': ['demon_lord'],
        'dark_sanctum': ['necromancer_lord', 'void_wraith'],
        'hellfire_peaks': ['demon_lord', 'lava_golem'],
        'frozen_wastes': ['frost_titan', 'ice_golem']
    },

    // Enemy types
    ENEMY_TYPES: [
        // Original enemies - scaled to better match player stats
        {
            type: 'skeleton',
            name: 'Skeleton',
            health: 120,
            damage: 15,
            speed: 3,
            attackRange: 1.5,
            attackSpeed: 1.5,
            experienceValue: 25,
            color: 0xcccccc,
            behavior: 'aggressive',
            zone: 'ruins'
        },
        {
            type: 'skeleton_archer',
            name: 'Skeleton Archer',
            health: 100,
            damage: 18,
            speed: 2.5,
            attackRange: 8,
            attackSpeed: 2,
            experienceValue: 30,
            color: 0xddccbb,
            behavior: 'ranged',
            zone: 'ruins'
        },
        {
            type: 'zombie',
            name: 'Zombie',
            health: 160,
            damage: 20,
            speed: 2,
            attackRange: 1.2,
            attackSpeed: 1,
            experienceValue: 35,
            color: 0x88aa88,
            behavior: 'slow',
            zone: 'swamp'
        },
        {
            type: 'zombie_brute',
            name: 'Zombie Brute',
            health: 220,
            damage: 30,
            speed: 1.5,
            attackRange: 1.8,
            attackSpeed: 0.8,
            experienceValue: 50,
            color: 0x668866,
            behavior: 'tank',
            zone: 'swamp'
        },
        {
            type: 'demon',
            name: 'Demon',
            health: 180,
            damage: 25,
            speed: 4,
            attackRange: 1.8,
            attackSpeed: 2,
            experienceValue: 55,
            color: 0xaa3333,
            behavior: 'aggressive',
            zone: 'mountains'
        },
        {
            type: 'demon_scout',
            name: 'Demon Scout',
            health: 140,
            damage: 20,
            speed: 5,
            attackRange: 1.5,
            attackSpeed: 2.5,
            experienceValue: 45,
            color: 0xcc5555,
            behavior: 'flanker',
            zone: 'mountains'
        },
        {
            type: 'necromancer',
            name: 'Necromancer',
            health: 150,
            damage: 22,
            speed: 2.5,
            attackRange: 6,
            attackSpeed: 1.8,
            experienceValue: 50,
            color: 0x330033,
            behavior: 'caster',
            zone: 'ruins'
        },
        {
            type: 'shadow_beast',
            name: 'Shadow Beast',
            health: 170,
            damage: 28,
            speed: 3.5,
            attackRange: 1.5,
            attackSpeed: 2.2,
            experienceValue: 60,
            color: 0x000000,
            behavior: 'ambusher',
            zone: 'forest'
        },
        {
            type: 'infernal_golem',
            name: 'Infernal Golem',
            health: 250,
            damage: 35,
            speed: 1.8,
            attackRange: 2.0,
            attackSpeed: 1.0,
            experienceValue: 75,
            color: 0x333333,
            behavior: 'tank',
            zone: 'mountains'
        },
        
        // Forest enemies - scaled to better match player stats
        {
            type: 'forest_spider',
            name: 'Forest Spider',
            health: 130,
            damage: 18,
            speed: 4.5,
            attackRange: 1.2,
            attackSpeed: 2.0,
            experienceValue: 30,
            color: 0x553300,
            behavior: 'ambusher',
            zone: 'forest',
            abilities: ['web_trap', 'poison_bite']
        },
        {
            type: 'corrupted_treant',
            name: 'Corrupted Treant',
            health: 240,
            damage: 24,
            speed: 1.5,
            attackRange: 2.5,
            attackSpeed: 0.8,
            experienceValue: 45,
            color: 0x336633,
            behavior: 'tank',
            zone: 'forest',
            abilities: ['root_grasp', 'thorn_spray']
        },
        {
            type: 'feral_wolf',
            name: 'Feral Wolf',
            health: 140,
            damage: 20,
            speed: 5.0,
            attackRange: 1.3,
            attackSpeed: 2.2,
            experienceValue: 35,
            color: 0x777777,
            behavior: 'pack',
            zone: 'forest',
            abilities: ['howl', 'pounce']
        },
        
        // Ruins enemies - scaled to better match player stats
        {
            type: 'ancient_guardian',
            name: 'Ancient Guardian',
            health: 260,
            damage: 28,
            speed: 1.8,
            attackRange: 2.0,
            attackSpeed: 1.0,
            experienceValue: 65,
            color: 0x888866,
            behavior: 'defensive',
            zone: 'ruins',
            abilities: ['stone_throw', 'ground_pound']
        },
        {
            type: 'cursed_spirit',
            name: 'Cursed Spirit',
            health: 135,
            damage: 22,
            speed: 3.0,
            attackRange: 4.0,
            attackSpeed: 1.5,
            experienceValue: 40,
            color: 0xaaaaff,
            behavior: 'caster',
            zone: 'ruins',
            abilities: ['spirit_drain', 'haunt']
        },
        {
            type: 'ruin_crawler',
            name: 'Ruin Crawler',
            health: 155,
            damage: 19,
            speed: 3.2,
            attackRange: 1.0,
            attackSpeed: 1.8,
            experienceValue: 35,
            color: 0x996633,
            behavior: 'swarm',
            zone: 'ruins',
            abilities: ['burrow', 'surprise_attack']
        },
        
        // Swamp enemies - scaled to better match player stats
        {
            type: 'poison_toad',
            name: 'Poison Toad',
            health: 145,
            damage: 18,
            speed: 2.5,
            attackRange: 5.0,
            attackSpeed: 1.2,
            experienceValue: 40,
            color: 0x66aa66,
            behavior: 'ranged',
            zone: 'swamp',
            abilities: ['poison_spit', 'toxic_cloud']
        },
        {
            type: 'bog_lurker',
            name: 'Bog Lurker',
            health: 190,
            damage: 26,
            speed: 1.8,
            attackRange: 2.2,
            attackSpeed: 1.0,
            experienceValue: 50,
            color: 0x445544,
            behavior: 'ambusher',
            zone: 'swamp',
            abilities: ['swamp_grab', 'mud_throw']
        },
        {
            type: 'swamp_witch',
            name: 'Swamp Witch',
            health: 140,
            damage: 24,
            speed: 2.2,
            attackRange: 7.0,
            attackSpeed: 1.5,
            experienceValue: 55,
            color: 0x559955,
            behavior: 'caster',
            zone: 'swamp',
            abilities: ['hex', 'summon_toad']
        },
        
        // Mountains enemies
        {
            type: 'frost_elemental',
            name: 'Frost Elemental',
            health: 90,
            damage: 22,
            speed: 2.5,
            attackRange: 5.0,
            attackSpeed: 1.5,
            experienceValue: 45,
            color: 0x88ccff,
            behavior: 'caster',
            zone: 'mountains',
            abilities: ['ice_shard', 'frost_armor']
        },
        {
            type: 'mountain_troll',
            name: 'Mountain Troll',
            health: 180,
            damage: 28,
            speed: 1.5,
            attackRange: 2.5,
            attackSpeed: 0.8,
            experienceValue: 65,
            color: 0x778877,
            behavior: 'tank',
            zone: 'mountains',
            abilities: ['boulder_throw', 'regeneration']
        },
        {
            type: 'harpy',
            name: 'Harpy',
            health: 75,
            damage: 16,
            speed: 4.5,
            attackRange: 1.5,
            attackSpeed: 2.0,
            experienceValue: 40,
            color: 0xddbb88,
            behavior: 'flanker',
            zone: 'mountains',
            abilities: ['dive_attack', 'screech']
        },
        
        // Dark Sanctum enemies
        {
            type: 'void_wraith',
            name: 'Void Wraith',
            health: 85,
            damage: 24,
            speed: 3.0,
            attackRange: 3.0,
            attackSpeed: 1.8,
            experienceValue: 55,
            color: 0x440088,
            behavior: 'caster',
            zone: 'dark_sanctum',
            abilities: ['void_bolt', 'phase_shift']
        },
        {
            type: 'blood_cultist',
            name: 'Blood Cultist',
            health: 70,
            damage: 18,
            speed: 2.8,
            attackRange: 1.8,
            attackSpeed: 1.6,
            experienceValue: 45,
            color: 0x880000,
            behavior: 'aggressive',
            zone: 'dark_sanctum',
            abilities: ['blood_ritual', 'life_drain']
        },
        {
            type: 'shadow_stalker',
            name: 'Shadow Stalker',
            health: 95,
            damage: 26,
            speed: 3.8,
            attackRange: 1.5,
            attackSpeed: 2.2,
            experienceValue: 60,
            color: 0x222222,
            behavior: 'ambusher',
            zone: 'dark_sanctum',
            abilities: ['shadow_step', 'darkness_cloud']
        },
        
        // Hellfire Peaks enemies
        {
            type: 'fire_elemental',
            name: 'Fire Elemental',
            health: 100,
            damage: 25,
            speed: 2.8,
            attackRange: 4.5,
            attackSpeed: 1.6,
            experienceValue: 50,
            color: 0xff6600,
            behavior: 'caster',
            zone: 'hellfire_peaks',
            abilities: ['fireball', 'flame_wave']
        },
        {
            type: 'lava_golem',
            name: 'Lava Golem',
            health: 190,
            damage: 30,
            speed: 1.5,
            attackRange: 2.2,
            attackSpeed: 0.9,
            experienceValue: 70,
            color: 0xcc3300,
            behavior: 'tank',
            zone: 'hellfire_peaks',
            abilities: ['magma_slam', 'heat_aura']
        },
        {
            type: 'ash_demon',
            name: 'Ash Demon',
            health: 120,
            damage: 22,
            speed: 3.2,
            attackRange: 2.0,
            attackSpeed: 1.8,
            experienceValue: 55,
            color: 0x666666,
            behavior: 'aggressive',
            zone: 'hellfire_peaks',
            abilities: ['ash_cloud', 'burning_touch']
        },
        {
            type: 'flame_imp',
            name: 'Flame Imp',
            health: 60,
            damage: 15,
            speed: 4.5,
            attackRange: 1.2,
            attackSpeed: 2.5,
            experienceValue: 30,
            color: 0xff9900,
            behavior: 'swarm',
            zone: 'hellfire_peaks',
            abilities: ['fire_dart', 'self_destruct']
        },
        {
            type: 'hellhound',
            name: 'Hellhound',
            health: 85,
            damage: 20,
            speed: 4.8,
            attackRange: 1.5,
            attackSpeed: 2.2,
            experienceValue: 45,
            color: 0x993300,
            behavior: 'pack',
            zone: 'hellfire_peaks',
            abilities: ['fire_breath', 'pounce']
        },
        
        // Frozen Wastes enemies
        {
            type: 'ice_golem',
            name: 'Ice Golem',
            health: 170,
            damage: 26,
            speed: 1.6,
            attackRange: 2.2,
            attackSpeed: 0.9,
            experienceValue: 65,
            color: 0xaaddff,
            behavior: 'tank',
            zone: 'frozen_wastes',
            abilities: ['ice_slam', 'frost_armor']
        },
        {
            type: 'snow_troll',
            name: 'Snow Troll',
            health: 150,
            damage: 24,
            speed: 2.0,
            attackRange: 2.0,
            attackSpeed: 1.0,
            experienceValue: 60,
            color: 0xddddee,
            behavior: 'aggressive',
            zone: 'frozen_wastes',
            abilities: ['snowball', 'frost_bite']
        },
        {
            type: 'frozen_revenant',
            name: 'Frozen Revenant',
            health: 90,
            damage: 22,
            speed: 2.5,
            attackRange: 1.8,
            attackSpeed: 1.5,
            experienceValue: 50,
            color: 0x8888ff,
            behavior: 'caster',
            zone: 'frozen_wastes',
            abilities: ['ice_lance', 'freezing_touch']
        },
        {
            type: 'winter_wolf',
            name: 'Winter Wolf',
            health: 80,
            damage: 18,
            speed: 4.5,
            attackRange: 1.5,
            attackSpeed: 2.0,
            experienceValue: 40,
            color: 0xeeeeff,
            behavior: 'pack',
            zone: 'frozen_wastes',
            abilities: ['frost_howl', 'snow_dash']
        }
    ],

    // Boss types
    BOSS_TYPES: [
        // Original bosses
        {
            type: 'skeleton_king',
            name: 'Skeleton King',
            health: 300,
            damage: 25,
            speed: 2.5,
            attackRange: 2,
            attackSpeed: 1.2,
            experienceValue: 200,
            color: 0xcccccc,
            scale: 2,
            isBoss: true,
            behavior: 'boss',
            zone: 'ruins',
            abilities: ['summon_minions', 'ground_slam']
        },
        {
            type: 'swamp_horror',
            name: 'Swamp Horror',
            health: 400,
            damage: 30,
            speed: 1.8,
            attackRange: 2.2,
            attackSpeed: 1,
            experienceValue: 250,
            color: 0x446644,
            scale: 2.2,
            isBoss: true,
            behavior: 'boss',
            zone: 'swamp',
            abilities: ['poison_cloud', 'tentacle_grab']
        },
        {
            type: 'demon_lord',
            name: 'Demon Lord',
            health: 500,
            damage: 35,
            speed: 3,
            attackRange: 2.5,
            attackSpeed: 1.5,
            experienceValue: 300,
            color: 0xaa3333,
            scale: 2.5,
            isBoss: true,
            behavior: 'boss',
            zone: 'mountains',
            abilities: ['fire_nova', 'teleport']
        },
        {
            type: 'frost_titan',
            name: 'Frost Titan',
            health: 600,
            damage: 40,
            speed: 2.0,
            attackRange: 3,
            attackSpeed: 1.0,
            experienceValue: 350,
            color: 0x88ccff,
            scale: 3,
            isBoss: true,
            behavior: 'boss',
            zone: 'mountains',
            abilities: ['ice_storm', 'frost_nova', 'ice_barrier']
        },
        {
            type: 'necromancer_lord',
            name: 'Necromancer Lord',
            health: 550,
            damage: 35,
            speed: 2.2,
            attackRange: 8,
            attackSpeed: 1.5,
            experienceValue: 320,
            color: 0x330033,
            scale: 2.2,
            isBoss: true,
            behavior: 'boss',
            zone: 'dark_sanctum',
            abilities: ['summon_undead', 'death_nova', 'life_drain']
        },
        
        // Forest bosses
        {
            type: 'ancient_treant',
            name: 'Ancient Treant',
            health: 450,
            damage: 30,
            speed: 1.5,
            attackRange: 3,
            attackSpeed: 0.8,
            experienceValue: 280,
            color: 0x225522,
            scale: 2.8,
            isBoss: true,
            behavior: 'boss',
            zone: 'forest',
            abilities: ['root_prison', 'nature_wrath', 'healing_sap']
        },
        {
            type: 'spider_queen',
            name: 'Spider Queen',
            health: 380,
            damage: 28,
            speed: 3.2,
            attackRange: 2.5,
            attackSpeed: 1.8,
            experienceValue: 260,
            color: 0x663300,
            scale: 2.3,
            isBoss: true,
            behavior: 'boss',
            zone: 'forest',
            abilities: ['web_prison', 'summon_spiderlings', 'venom_spray']
        },
        
        // Ruins bosses
        {
            type: 'ancient_construct',
            name: 'Ancient Construct',
            health: 520,
            damage: 38,
            speed: 1.8,
            attackRange: 2.5,
            attackSpeed: 1.0,
            experienceValue: 310,
            color: 0xbbaa88,
            scale: 2.6,
            isBoss: true,
            behavior: 'boss',
            zone: 'ruins',
            abilities: ['stone_barrage', 'earthquake', 'ancient_curse']
        },
        
        // Swamp bosses
        {
            type: 'plague_lord',
            name: 'Plague Lord',
            health: 480,
            damage: 32,
            speed: 2.0,
            attackRange: 4,
            attackSpeed: 1.2,
            experienceValue: 290,
            color: 0x557755,
            scale: 2.4,
            isBoss: true,
            behavior: 'boss',
            zone: 'swamp',
            abilities: ['plague_cloud', 'summon_flies', 'toxic_explosion']
        },
        
        // Dark Sanctum bosses
        {
            type: 'void_harbinger',
            name: 'Void Harbinger',
            health: 580,
            damage: 42,
            speed: 2.5,
            attackRange: 5,
            attackSpeed: 1.5,
            experienceValue: 340,
            color: 0x330066,
            scale: 2.7,
            isBoss: true,
            behavior: 'boss',
            zone: 'dark_sanctum',
            abilities: ['void_rift', 'shadow_tendrils', 'mind_shatter']
        },
        
        // Hellfire Peaks bosses
        {
            type: 'inferno_lord',
            name: 'Inferno Lord',
            health: 650,
            damage: 45,
            speed: 2.2,
            attackRange: 3.5,
            attackSpeed: 1.3,
            experienceValue: 380,
            color: 0xff3300,
            scale: 3.0,
            isBoss: true,
            behavior: 'boss',
            zone: 'hellfire_peaks',
            abilities: ['meteor_strike', 'flame_pillar', 'inferno_aura']
        },
        {
            type: 'molten_behemoth',
            name: 'Molten Behemoth',
            health: 700,
            damage: 48,
            speed: 1.5,
            attackRange: 2.8,
            attackSpeed: 0.9,
            experienceValue: 400,
            color: 0xcc5500,
            scale: 3.2,
            isBoss: true,
            behavior: 'boss',
            zone: 'hellfire_peaks',
            abilities: ['lava_wave', 'molten_smash', 'eruption']
        },
        
        // Frozen Wastes bosses
        {
            type: 'frost_monarch',
            name: 'Frost Monarch',
            health: 620,
            damage: 43,
            speed: 2.0,
            attackRange: 4.0,
            attackSpeed: 1.2,
            experienceValue: 370,
            color: 0x66ccff,
            scale: 2.8,
            isBoss: true,
            behavior: 'boss',
            zone: 'frozen_wastes',
            abilities: ['blizzard', 'ice_prison', 'freezing_touch']
        },
        {
            type: 'ancient_yeti',
            name: 'Ancient Yeti',
            health: 680,
            damage: 46,
            speed: 1.8,
            attackRange: 2.5,
            attackSpeed: 1.0,
            experienceValue: 390,
            color: 0xeeeeff,
            scale: 3.1,
            isBoss: true,
            behavior: 'boss',
            zone: 'frozen_wastes',
            abilities: ['avalanche', 'frost_breath', 'ice_shards']
        }
    ]
};

// For backward compatibility, export the individual constants
export const ZONE_DIFFICULTY_MULTIPLIERS = ENEMY_CONFIG.ZONE_DIFFICULTY_MULTIPLIERS;
export const ZONE_ENEMIES = ENEMY_CONFIG.ZONE_ENEMIES;
export const ZONE_BOSSES = ENEMY_CONFIG.ZONE_BOSSES;
export const ENEMY_TYPES = ENEMY_CONFIG.ENEMY_TYPES;
export const BOSS_TYPES = ENEMY_CONFIG.BOSS_TYPES;

// Combat balance settings
export const COMBAT_BALANCE = {
    // Player combat settings
    player: {
        // Base damage multipliers for combo punches (5 punches total)
        comboPunchMultipliers: [1.0, 1.2, 1.5, 1.8, 2.5],
        // Cooldown between punches (seconds)
        comboPunchCooldown: 0.4,
        // Time window to continue combo (seconds)
        comboTimeWindow: 2.0,
        // Base damage for skills - reduced to balance with enemy health
        skillDamageMultiplier: 0.5,
        // Health regeneration per second
        healthRegenPerSecond: 2,
        // Mana regeneration per second
        manaRegenPerSecond: 5,
        // Damage reduction from armor (percentage per point)
        armorDamageReduction: 0.02,
        // Damage increase from weapon (percentage per point)
        weaponDamageIncrease: 0.05,
        // Power scaling with level (percentage increase per level)
        powerScalingPerLevel: 0.1, // 10% increase per level
        // Critical hit chance base value
        baseCritChance: 0.05, // 5% base crit chance
        // Critical hit damage multiplier
        critDamageMultiplier: 1.5, // 150% damage on crit
        // Elemental damage bonus multiplier
        elementalDamageMultiplier: 1.2 // 20% bonus for elemental damage
    },
    
    // Enemy combat settings
    enemy: {
        // Base damage multiplier - increased to make enemies more threatening
        damageMultiplier: 1.5,
        // Health multiplier - significantly increased to better match player health
        healthMultiplier: 1.0,
        // Experience multiplier
        experienceMultiplier: 1.0,
        // Level scaling factor (how much stronger enemies get per player level)
        levelScalingFactor: 0.12, // Increased to 12% per level
        // Boss health multiplier
        bossHealthMultiplier: 1.0, // Increased to make bosses more challenging
        // Boss damage multiplier
        bossDamageMultiplier: 1.8, // Increased to make bosses more threatening
        // Elite enemy health multiplier
        eliteHealthMultiplier: 2.2, // Increased for better scaling
        // Elite enemy damage multiplier
        eliteDamageMultiplier: 1.5, // Increased for better scaling
        // Champion enemy health multiplier
        championHealthMultiplier: 2.8, // Increased for better scaling
        // Champion enemy damage multiplier
        championDamageMultiplier: 1.6, // Increased for better scaling
        // Enemy health scaling formula parameters
        healthScaling: {
            base: 1.0,
            levelFactor: 0.15, // Increased to 15% per level
            difficultyFactor: 1.0 // Multiplied by difficulty setting
        },
        // Enemy damage scaling formula parameters
        damageScaling: {
            base: 1.0,
            levelFactor: 0.12, // Increased to 12% per level
            difficultyFactor: 1.0 // Multiplied by difficulty setting
        },
        // Enemy defense scaling formula parameters
        defenseScaling: {
            base: 1.0,
            levelFactor: 0.08, // Increased to 8% per level
            difficultyFactor: 1.0 // Multiplied by difficulty setting
        }
    },
    
    // Item balance settings
    items: {
        // Weapon damage per quality level
        weaponDamagePerQuality: 5,
        // Armor protection per quality level
        armorProtectionPerQuality: 3,
        // Accessory stat bonus per quality level
        accessoryBonusPerQuality: 2,
        
        // Rarity multipliers for item stats
        rarityMultipliers: {
            common: 1.0,
            uncommon: 1.2,
            rare: 1.5,
            epic: 2.0,
            legendary: 2.5,
            mythic: 3.0
        },
        
        // Level scaling factor for items
        levelScalingFactor: 0.05, // 5% per level
        
        // Secondary stat value ranges
        secondaryStatBaseValues: {
            critChance: 2,
            critDamage: 10,
            attackSpeed: 5,
            cooldownReduction: 3,
            healthBonus: 5,
            manaBonus: 5,
            elementalDamage: 10,
            damageReduction: 2,
            movementSpeed: 3,
            goldFind: 10,
            magicFind: 5,
            experienceBonus: 5
        },
        
        // Rarity drop chances (base values, modified by player level and difficulty)
        rarityDropChances: {
            common: 60,
            uncommon: 25,
            rare: 10,
            epic: 4,
            legendary: 1,
            mythic: 0.1
        },
        
        // Level influence on rarity chances (percentage points per level)
        levelRarityInfluence: {
            common: -0.5,    // Decreases by 0.5% per level
            uncommon: 0.2,   // Increases by 0.2% per level
            rare: 0.15,      // Increases by 0.15% per level
            epic: 0.1,       // Increases by 0.1% per level
            legendary: 0.04, // Increases by 0.04% per level
            mythic: 0.01     // Increases by 0.01% per level
        },
        
        // Minimum level requirements for rarities
        rarityMinLevel: {
            common: 1,
            uncommon: 1,
            rare: 5,
            epic: 10,
            legendary: 20,
            mythic: 30
        },
        
        // Secondary stat count by rarity
        secondaryStatCount: {
            common: 0,
            uncommon: 1,
            rare: 2,
            epic: 3,
            legendary: 4,
            mythic: 5
        },
        
        // Special effect count by rarity
        specialEffectCount: {
            common: 0,
            uncommon: 0,
            rare: 1,
            epic: 1,
            legendary: 2,
            mythic: 3
        },
        
        // Set item chances by rarity
        setItemChances: {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0.2,      // 20% chance
            legendary: 0.3, // 30% chance
            mythic: 0.5     // 50% chance
        },
        
        // Item type drop weights
        itemTypeWeights: {
            weapon: 40,
            armor: 30,
            accessory: 20,
            consumable: 10
        },
        
        // Elemental damage types
        elementalTypes: ['fire', 'ice', 'lightning', 'holy'],
        
        // Elemental effects
        elementalEffects: {
            fire: {
                name: "Fire",
                description: "Burns enemies over time",
                damageOverTime: true,
                duration: 3,
                tickDamagePercent: 10
            },
            ice: {
                name: "Ice",
                description: "Slows enemy movement and attack speed",
                slowPercent: 30,
                duration: 2
            },
            lightning: {
                name: "Lightning",
                description: "Has a chance to chain to nearby enemies",
                chainChance: 0.3,
                chainCount: 2,
                chainDamagePercent: 50
            },
            holy: {
                name: "Holy",
                description: "Heals the player for a portion of damage dealt",
                healPercent: 10
            }
        }
    }
};

// Difficulty scaling settings
export const DIFFICULTY_SCALING = {
    // Base difficulty at player level 1
    baseDifficulty: 1.0,
    // Difficulty increase per player level
    difficultyPerLevel: 0.05,
    // Maximum difficulty multiplier
    maxDifficultyMultiplier: 3.0,
    // Level at which enemies start using special abilities
    specialAbilityStartLevel: 5,
    // Level at which enemies start having resistances
    resistanceStartLevel: 10,
    
    // Difficulty levels configuration
    difficultyLevels: {
        // Basic (Easy) difficulty
        basic: {
            name: "Basic (Easy)",
            enemyLevelOffset: -5, // Enemy Level = Player Level - 5 (minimum 1)
            damageMultiplier: 0.7, // 70% of normal damage
            healthMultiplier: 0.7, // 70% of normal health
            experienceMultiplier: 0.8, // 80% of normal experience
            itemQualityMultiplier: 0.8, // 80% chance for better quality
            itemDropRateMultiplier: 1.2, // 120% normal drop rate
            affixChanceMultiplier: 0.5, // 50% chance for affixes
            specialAbilityChanceMultiplier: 0.5 // 50% chance for special abilities
        },
        
        // Medium (Normal) difficulty - default
        medium: {
            name: "Medium (Normal)",
            enemyLevelOffset: -2, // Enemy Level = Player Level - 2 (minimum 1)
            damageMultiplier: 1.0, // Normal damage
            healthMultiplier: 1.0, // Normal health
            experienceMultiplier: 1.0, // Normal experience
            itemQualityMultiplier: 1.0, // Normal quality chance
            itemDropRateMultiplier: 1.0, // Normal drop rate
            affixChanceMultiplier: 1.0, // Normal chance for affixes
            specialAbilityChanceMultiplier: 1.0 // Normal chance for special abilities
        },
        
        // Hard (Challenging) difficulty
        hard: {
            name: "Hard (Challenging)",
            enemyLevelOffset: 2, // Enemy Level = Player Level + 2
            damageMultiplier: 1.3, // 130% of normal damage
            healthMultiplier: 1.5, // 150% of normal health
            experienceMultiplier: 1.2, // 120% of normal experience
            itemQualityMultiplier: 1.2, // 120% chance for better quality
            itemDropRateMultiplier: 1.0, // Normal drop rate
            affixChanceMultiplier: 1.5, // 150% chance for affixes
            specialAbilityChanceMultiplier: 1.5 // 150% chance for special abilities
        },
        
        // Hell (Very Hard) difficulty
        hell: {
            name: "Hell (Very Hard)",
            enemyLevelOffset: 5, // Enemy Level = Player Level + 5
            damageMultiplier: 2.0, // 200% of normal damage
            healthMultiplier: 2.5, // 250% of normal health
            experienceMultiplier: 1.5, // 150% of normal experience
            itemQualityMultiplier: 1.5, // 150% chance for better quality
            itemDropRateMultiplier: 0.8, // 80% normal drop rate (rarer but better)
            affixChanceMultiplier: 2.0, // 200% chance for affixes
            specialAbilityChanceMultiplier: 2.0 // 200% chance for special abilities
        },
        
        // Inferno (Endgame) difficulty
        inferno: {
            name: "Inferno (Endgame)",
            enemyLevelOffset: 10, // Enemy Level = Player Level + 10
            damageMultiplier: 3.0, // 300% of normal damage
            healthMultiplier: 4.0, // 400% of normal health
            experienceMultiplier: 2.0, // 200% of normal experience
            itemQualityMultiplier: 2.0, // 200% chance for better quality
            itemDropRateMultiplier: 0.7, // 70% normal drop rate (much rarer but much better)
            affixChanceMultiplier: 3.0, // 300% chance for affixes
            specialAbilityChanceMultiplier: 3.0, // 300% chance for special abilities
            guaranteedRareAffix: true // Guarantees at least one rare affix on elite+ enemies
        }
    },
    
    // Enemy affix system
    affixes: {
        // Chance for an elite enemy to have an affix (base value, modified by difficulty)
        eliteAffixChance: 0.8, // 80% chance
        // Chance for a champion enemy to have an affix (base value, modified by difficulty)
        championAffixChance: 1.0, // 100% chance
        // Maximum number of affixes per enemy type
        maxAffixesPerEnemyType: {
            normal: 0,
            elite: 1,
            champion: 2,
            miniBoss: 3,
            boss: 4
        },
        // List of possible affixes and their effects
        affixList: [
            {
                id: "frozen",
                name: "Frozen",
                description: "Creates ice patches that slow and damage players",
                damageMultiplier: 1.0,
                healthMultiplier: 1.1
            },
            {
                id: "molten",
                name: "Molten",
                description: "Leaves fire trails and explodes on death",
                damageMultiplier: 1.2,
                healthMultiplier: 1.0
            },
            {
                id: "teleporter",
                name: "Teleporter",
                description: "Can teleport to avoid attacks",
                damageMultiplier: 1.1,
                healthMultiplier: 1.0
            },
            {
                id: "shielded",
                name: "Shielded",
                description: "Periodically immune to damage",
                damageMultiplier: 1.0,
                healthMultiplier: 1.3
            },
            {
                id: "vampiric",
                name: "Vampiric",
                description: "Heals from damage dealt",
                damageMultiplier: 1.1,
                healthMultiplier: 1.2
            },
            {
                id: "berserker",
                name: "Berserker",
                description: "Gains increased damage at low health",
                damageMultiplier: 1.3,
                healthMultiplier: 1.0
            },
            {
                id: "arcane",
                name: "Arcane",
                description: "Creates arcane beams that deal high damage",
                damageMultiplier: 1.2,
                healthMultiplier: 1.1
            },
            {
                id: "poison",
                name: "Poison",
                description: "Leaves poison clouds that deal damage over time",
                damageMultiplier: 1.1,
                healthMultiplier: 1.1
            }
        ]
    },
    
    // Dynamic difficulty adjustment settings
    dynamicDifficulty: {
        enabled: true, // Whether dynamic difficulty is enabled by default
        // How quickly the system responds to player performance (0-1)
        // Higher values mean faster adjustment
        adjustmentRate: 0.2,
        // Maximum adjustment factor (up or down)
        maxAdjustmentFactor: 0.3, // ±30% adjustment
        // Metrics used for adjustment
        metrics: {
            // Weight of player damage taken in adjustment calculation
            damageTakenWeight: 0.4,
            // Weight of time to kill enemies in adjustment calculation
            timeToKillWeight: 0.4,
            // Weight of player death frequency in adjustment calculation
            deathFrequencyWeight: 0.2
        },
        // Cooldown between adjustments (in seconds)
        adjustmentCooldown: 60,
        // Performance thresholds
        thresholds: {
            // If player is taking too much damage, reduce difficulty
            highDamageTaken: 0.7, // 70% of max health per encounter
            // If player is killing too quickly, increase difficulty
            fastKillTime: 0.5, // 50% faster than expected
            // If player is dying too frequently, reduce difficulty
            highDeathRate: 0.2 // More than 1 death per 5 encounters
        }
    },
    
    // World tier system (endgame progression)
    worldTiers: {
        // Minimum player level to unlock world tiers
        unlockLevel: 30,
        tiers: [
            {
                tier: 1,
                name: "World Tier I",
                difficultyMultiplier: 1.0,
                itemQualityMultiplier: 1.0,
                itemQuantityMultiplier: 1.0,
                experienceMultiplier: 1.0,
                goldMultiplier: 1.0
            },
            {
                tier: 2,
                name: "World Tier II",
                difficultyMultiplier: 1.5,
                itemQualityMultiplier: 1.2,
                itemQuantityMultiplier: 1.1,
                experienceMultiplier: 1.2,
                goldMultiplier: 1.2
            },
            {
                tier: 3,
                name: "World Tier III",
                difficultyMultiplier: 2.0,
                itemQualityMultiplier: 1.4,
                itemQuantityMultiplier: 1.2,
                experienceMultiplier: 1.4,
                goldMultiplier: 1.4
            },
            {
                tier: 4,
                name: "World Tier IV",
                difficultyMultiplier: 2.5,
                itemQualityMultiplier: 1.6,
                itemQuantityMultiplier: 1.3,
                experienceMultiplier: 1.6,
                goldMultiplier: 1.6
            },
            {
                tier: 5,
                name: "World Tier V",
                difficultyMultiplier: 3.0,
                itemQualityMultiplier: 1.8,
                itemQuantityMultiplier: 1.4,
                experienceMultiplier: 1.8,
                goldMultiplier: 1.8
            },
            {
                tier: 6,
                name: "World Tier VI",
                difficultyMultiplier: 4.0,
                itemQualityMultiplier: 2.0,
                itemQuantityMultiplier: 1.5,
                experienceMultiplier: 2.0,
                goldMultiplier: 2.0,
                guaranteedLegendary: true
            }
        ]
    }
};

// Item drop configuration
export const DROP_CHANCES = {
    bossDropChance: 1.0,    // 100% drop chance for bosses
    normalDropChance: 0.05 * 2   // 5% drop chance for regular enemies (increased from 0.1% to make drops more visible)
};

// Item quality distribution
export const ITEM_QUALITY_CHANCES = {
    common: 0.6,      // 60% chance for common items
    magic: 0.25,      // 25% chance for magic items
    rare: 0.1,        // 10% chance for rare items
    legendary: 0.05   // 5% chance for legendary items
};

// Item type distribution
export const ITEM_TYPE_CHANCES = {
    weapon: 0.1,
    armor: 0.1,
    accessory: 0.5,
    consumable: 0.5
};

// Regular enemy drop table
export const REGULAR_DROP_TABLE = [
    { name: 'Health Potion', amount: 1, weight: 40 },
    { name: 'Mana Potion', amount: 1, weight: 30 },
    { name: 'Gold Coin', amount: Math.floor(5 + Math.random() * 20), weight: 20 },
    { name: 'Common Weapon', type: 'weapon', damage: 5 + Math.floor(Math.random() * 5), damageReduction: 0, amount: 1, weight: 5 },
    { name: 'Common Armor', type: 'armor', damage: 0, damageReduction: 0.05 + Math.random() * 0.05, amount: 1, weight: 5 }
];

// Boss drop table
export const BOSS_DROP_TABLE = [
    { name: 'Greater Health Potion', amount: 2, weight: 20 },
    { name: 'Greater Mana Potion', amount: 2, weight: 15 },
    { name: 'Gold Pile', amount: Math.floor(50 + Math.random() * 100), weight: 20 },
    { name: 'Rare Weapon', type: 'weapon', damage: 15 + Math.floor(Math.random() * 10), damageReduction: 0, amount: 1, weight: 15 },
    { name: 'Rare Armor', type: 'armor', damage: 0, damageReduction: 0.1 + Math.random() * 0.1, amount: 1, weight: 15 },
    { name: 'Rare Helmet', type: 'helmet', damage: 2 + Math.floor(Math.random() * 3), damageReduction: 0.05 + Math.random() * 0.05, amount: 1, weight: 10 },
    { name: 'Rare Boots', type: 'boots', damage: 0, damageReduction: 0.05 + Math.random() * 0.05, amount: 1, weight: 5 }
];
