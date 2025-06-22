/**
 * Enemy Configuration
 * 
 * This file centralizes all enemy type definitions used across the application.
 * It provides a single source of truth for enemy types, their properties,
 * and their relationships to different categories and model implementations.
 */

/**
 * Enemy types dictionary
 * A single source of truth for all enemy type string literals
 */
export const ENEMY_TYPES = {
    // Skeleton types
    SKELETON: 'skeleton',
    SKELETON_KING: 'skeleton_king',
    SKELETON_ARCHER: 'skeleton_archer',
    
    // Zombie types
    ZOMBIE: 'zombie',
    ZOMBIE_BRUTE: 'zombie_brute',
    
    // Demon types
    DEMON: 'demon',
    DEMON_LORD: 'demon_lord',
    DEMON_SCOUT: 'demon_scout',
    ASH_DEMON: 'ash_demon',
    FLAME_IMP: 'flame_imp',
    
    // Boss types
    FROST_TITAN: 'frost_titan',
    FROST_MONARCH: 'frost_monarch',
    
    // Caster types
    NECROMANCER: 'necromancer',
    NECROMANCER_LORD: 'necromancer_lord',
    SWAMP_WITCH: 'swamp_witch',
    BLOOD_CULTIST: 'blood_cultist',
    PLAGUE_LORD: 'plague_lord',
    
    // Beast types
    SHADOW_BEAST: 'shadow_beast',
    SHADOW_STALKER: 'shadow_stalker',
    
    // Elemental types
    FIRE_ELEMENTAL: 'fire_elemental',
    FROST_ELEMENTAL: 'frost_elemental',
    
    // Golem types
    INFERNAL_GOLEM: 'infernal_golem',
    LAVA_GOLEM: 'lava_golem',
    ICE_GOLEM: 'ice_golem',
    ANCIENT_CONSTRUCT: 'ancient_construct',
    
    // Plant types
    CORRUPTED_TREANT: 'corrupted_treant',
    ANCIENT_TREANT: 'ancient_treant',
    
    // Mountain creatures
    MOUNTAIN_TROLL: 'mountain_troll',
    SNOW_TROLL: 'snow_troll',
    ANCIENT_YETI: 'ancient_yeti',
    
    // Dark Sanctum creatures
    VOID_WRAITH: 'void_wraith',
    VOID_HARBINGER: 'void_harbinger',
    FROZEN_REVENANT: 'frozen_revenant',
    CURSED_SPIRIT: 'cursed_spirit',
    
    // Swamp creatures
    SWAMP_HORROR: 'swamp_horror',
    
    // Fire bosses
    INFERNO_LORD: 'inferno_lord',
    
    // Molten creatures
    MOLTEN_BEHEMOTH: 'molten_behemoth',
    
    // Spider creatures
    SPIDER_QUEEN: 'spider_queen',
    
    // Animal-like creatures (use SimpleEnemyModel)
    FOREST_SPIDER: 'forest_spider',
    FERAL_WOLF: 'feral_wolf',
    HELLHOUND: 'hellhound',
    WINTER_WOLF: 'winter_wolf',
    POISON_TOAD: 'poison_toad',
    BOG_LURKER: 'bog_lurker',
    RUIN_CRAWLER: 'ruin_crawler',
    HARPY: 'harpy',
    ANCIENT_GUARDIAN: 'ancient_guardian'
};

/**
 * Enemy model mappings
 * Maps enemy types to their corresponding model classes
 */
export const ENEMY_MODEL_MAPPINGS = {
    // Skeleton Model
    SKELETON_TYPES: [
        ENEMY_TYPES.SKELETON,
        ENEMY_TYPES.SKELETON_KING
    ],
    
    // Skeleton Archer Model
    SKELETON_ARCHER_TYPES: [
        ENEMY_TYPES.SKELETON_ARCHER
    ],
    
    // Zombie Model
    ZOMBIE_TYPES: [
        ENEMY_TYPES.ZOMBIE
    ],
    
    // Zombie Brute Model
    ZOMBIE_BRUTE_TYPES: [
        ENEMY_TYPES.ZOMBIE_BRUTE
    ],
    
    // Demon Model
    DEMON_TYPES: [
        ENEMY_TYPES.DEMON,
        ENEMY_TYPES.DEMON_LORD,
        ENEMY_TYPES.DEMON_SCOUT,
        ENEMY_TYPES.ASH_DEMON,
        ENEMY_TYPES.FLAME_IMP
    ],
    
    // Frost Titan Model
    FROST_TITAN_TYPES: [
        ENEMY_TYPES.FROST_TITAN
    ],
    
    // Frost Monarch Model
    FROST_MONARCH_TYPES: [
        ENEMY_TYPES.FROST_MONARCH
    ],
    
    // Necromancer Model
    NECROMANCER_TYPES: [
        ENEMY_TYPES.NECROMANCER,
        ENEMY_TYPES.NECROMANCER_LORD
    ],
    
    // Swamp Witch Model
    SWAMP_WITCH_TYPES: [
        ENEMY_TYPES.SWAMP_WITCH,
        ENEMY_TYPES.BLOOD_CULTIST,
        ENEMY_TYPES.PLAGUE_LORD
    ],
    
    // Shadow Beast Model
    SHADOW_BEAST_TYPES: [
        ENEMY_TYPES.SHADOW_BEAST,
        ENEMY_TYPES.SHADOW_STALKER
    ],
    
    // Fire Elemental Model
    FIRE_ELEMENTAL_TYPES: [
        ENEMY_TYPES.FIRE_ELEMENTAL
    ],
    
    // Frost Elemental Model
    FROST_ELEMENTAL_TYPES: [
        ENEMY_TYPES.FROST_ELEMENTAL
    ],
    
    // Infernal Golem Model
    INFERNAL_GOLEM_TYPES: [
        ENEMY_TYPES.INFERNAL_GOLEM,
        ENEMY_TYPES.LAVA_GOLEM,
        ENEMY_TYPES.ICE_GOLEM
    ],
    
    // Ancient Construct Model
    ANCIENT_CONSTRUCT_TYPES: [
        ENEMY_TYPES.ANCIENT_CONSTRUCT
    ],
    
    // Corrupted Treant Model
    CORRUPTED_TREANT_TYPES: [
        ENEMY_TYPES.CORRUPTED_TREANT
    ],
    
    // Ancient Treant Model
    ANCIENT_TREANT_TYPES: [
        ENEMY_TYPES.ANCIENT_TREANT
    ],
    
    // Mountain Troll Model
    MOUNTAIN_TROLL_TYPES: [
        ENEMY_TYPES.MOUNTAIN_TROLL,
        ENEMY_TYPES.SNOW_TROLL
    ],
    
    // Ancient Yeti Model
    ANCIENT_YETI_TYPES: [
        ENEMY_TYPES.ANCIENT_YETI
    ],
    
    // Void Wraith Model
    VOID_WRAITH_TYPES: [
        ENEMY_TYPES.VOID_WRAITH,
        ENEMY_TYPES.VOID_HARBINGER,
        ENEMY_TYPES.FROZEN_REVENANT,
        ENEMY_TYPES.CURSED_SPIRIT
    ],
    
    // Swamp Horror Model
    SWAMP_HORROR_TYPES: [
        ENEMY_TYPES.SWAMP_HORROR
    ],
    
    // Inferno Lord Model
    INFERNO_LORD_TYPES: [
        ENEMY_TYPES.INFERNO_LORD
    ],
    
    // Molten Behemoth Model
    MOLTEN_BEHEMOTH_TYPES: [
        ENEMY_TYPES.MOLTEN_BEHEMOTH
    ],
    
    // Spider Queen Model
    SPIDER_QUEEN_TYPES: [
        ENEMY_TYPES.SPIDER_QUEEN
    ],
    
    // Simple Enemy Model (animal-like creatures)
    SIMPLE_ENEMY_TYPES: [
        ENEMY_TYPES.FOREST_SPIDER,
        ENEMY_TYPES.FERAL_WOLF,
        ENEMY_TYPES.HELLHOUND,
        ENEMY_TYPES.WINTER_WOLF,
        ENEMY_TYPES.POISON_TOAD,
        ENEMY_TYPES.BOG_LURKER,
        ENEMY_TYPES.RUIN_CRAWLER,
        ENEMY_TYPES.HARPY,
        ENEMY_TYPES.ANCIENT_GUARDIAN
    ]
};

/**
 * Enemy categories
 * Useful for grouping similar enemies by characteristics
 */
export const ENEMY_CATEGORIES = {
    UNDEAD: [
        ENEMY_TYPES.SKELETON,
        ENEMY_TYPES.SKELETON_KING,
        ENEMY_TYPES.SKELETON_ARCHER,
        ENEMY_TYPES.ZOMBIE,
        ENEMY_TYPES.ZOMBIE_BRUTE,
        ENEMY_TYPES.NECROMANCER,
        ENEMY_TYPES.NECROMANCER_LORD,
        ENEMY_TYPES.FROZEN_REVENANT
    ],
    
    DEMONS: [
        ENEMY_TYPES.DEMON,
        ENEMY_TYPES.DEMON_LORD,
        ENEMY_TYPES.DEMON_SCOUT,
        ENEMY_TYPES.ASH_DEMON,
        ENEMY_TYPES.FLAME_IMP,
        ENEMY_TYPES.INFERNO_LORD
    ],
    
    ELEMENTALS: [
        ENEMY_TYPES.FIRE_ELEMENTAL,
        ENEMY_TYPES.FROST_ELEMENTAL
    ],
    
    CONSTRUCTS: [
        ENEMY_TYPES.INFERNAL_GOLEM,
        ENEMY_TYPES.LAVA_GOLEM,
        ENEMY_TYPES.ICE_GOLEM,
        ENEMY_TYPES.ANCIENT_CONSTRUCT
    ],
    
    PLANTS: [
        ENEMY_TYPES.CORRUPTED_TREANT,
        ENEMY_TYPES.ANCIENT_TREANT
    ],
    
    BEASTS: [
        ENEMY_TYPES.SHADOW_BEAST,
        ENEMY_TYPES.SHADOW_STALKER,
        ENEMY_TYPES.FOREST_SPIDER,
        ENEMY_TYPES.FERAL_WOLF,
        ENEMY_TYPES.HELLHOUND,
        ENEMY_TYPES.WINTER_WOLF,
        ENEMY_TYPES.POISON_TOAD,
        ENEMY_TYPES.BOG_LURKER,
        ENEMY_TYPES.RUIN_CRAWLER,
        ENEMY_TYPES.HARPY,
        ENEMY_TYPES.ANCIENT_GUARDIAN
    ],
    
    GIANTS: [
        ENEMY_TYPES.MOUNTAIN_TROLL,
        ENEMY_TYPES.SNOW_TROLL,
        ENEMY_TYPES.ANCIENT_YETI,
        ENEMY_TYPES.FROST_TITAN,
        ENEMY_TYPES.MOLTEN_BEHEMOTH
    ],
    
    CASTERS: [
        ENEMY_TYPES.NECROMANCER,
        ENEMY_TYPES.NECROMANCER_LORD,
        ENEMY_TYPES.SWAMP_WITCH,
        ENEMY_TYPES.BLOOD_CULTIST,
        ENEMY_TYPES.PLAGUE_LORD
    ],
    
    SPIRITS: [
        ENEMY_TYPES.VOID_WRAITH,
        ENEMY_TYPES.VOID_HARBINGER,
        ENEMY_TYPES.CURSED_SPIRIT
    ],
    
    BOSSES: [
        ENEMY_TYPES.SKELETON_KING,
        ENEMY_TYPES.DEMON_LORD,
        ENEMY_TYPES.FROST_TITAN,
        ENEMY_TYPES.FROST_MONARCH,
        ENEMY_TYPES.NECROMANCER_LORD,
        ENEMY_TYPES.INFERNO_LORD,
        ENEMY_TYPES.SPIDER_QUEEN,
        ENEMY_TYPES.MOLTEN_BEHEMOTH,
        ENEMY_TYPES.ANCIENT_YETI,
        ENEMY_TYPES.SWAMP_HORROR,
        ENEMY_TYPES.PLAGUE_LORD
    ]
};

/**
 * Enemy difficulty tiers
 * Categorizes enemies by their general difficulty/threat level
 */
export const ENEMY_DIFFICULTY_TIERS = {
    BASIC: [
        ENEMY_TYPES.SKELETON,
        ENEMY_TYPES.ZOMBIE,
        ENEMY_TYPES.FOREST_SPIDER,
        ENEMY_TYPES.FERAL_WOLF,
        ENEMY_TYPES.POISON_TOAD
    ],
    
    INTERMEDIATE: [
        ENEMY_TYPES.SKELETON_ARCHER,
        ENEMY_TYPES.ZOMBIE_BRUTE,
        ENEMY_TYPES.DEMON,
        ENEMY_TYPES.SHADOW_BEAST,
        ENEMY_TYPES.FIRE_ELEMENTAL,
        ENEMY_TYPES.FROST_ELEMENTAL,
        ENEMY_TYPES.HELLHOUND,
        ENEMY_TYPES.WINTER_WOLF,
        ENEMY_TYPES.BOG_LURKER,
        ENEMY_TYPES.RUIN_CRAWLER,
        ENEMY_TYPES.HARPY
    ],
    
    ADVANCED: [
        ENEMY_TYPES.DEMON_SCOUT,
        ENEMY_TYPES.ASH_DEMON,
        ENEMY_TYPES.NECROMANCER,
        ENEMY_TYPES.SWAMP_WITCH,
        ENEMY_TYPES.SHADOW_STALKER,
        ENEMY_TYPES.INFERNAL_GOLEM,
        ENEMY_TYPES.LAVA_GOLEM,
        ENEMY_TYPES.ICE_GOLEM,
        ENEMY_TYPES.CORRUPTED_TREANT,
        ENEMY_TYPES.MOUNTAIN_TROLL,
        ENEMY_TYPES.SNOW_TROLL,
        ENEMY_TYPES.VOID_WRAITH,
        ENEMY_TYPES.BLOOD_CULTIST,
        ENEMY_TYPES.ANCIENT_GUARDIAN
    ],
    
    ELITE: [
        ENEMY_TYPES.FLAME_IMP,
        ENEMY_TYPES.ANCIENT_TREANT,
        ENEMY_TYPES.VOID_HARBINGER,
        ENEMY_TYPES.FROZEN_REVENANT,
        ENEMY_TYPES.CURSED_SPIRIT,
        ENEMY_TYPES.ANCIENT_CONSTRUCT,
        ENEMY_TYPES.SWAMP_HORROR
    ],
    
    BOSS: [
        ENEMY_TYPES.SKELETON_KING,
        ENEMY_TYPES.DEMON_LORD,
        ENEMY_TYPES.FROST_TITAN,
        ENEMY_TYPES.FROST_MONARCH,
        ENEMY_TYPES.NECROMANCER_LORD,
        ENEMY_TYPES.INFERNO_LORD,
        ENEMY_TYPES.SPIDER_QUEEN,
        ENEMY_TYPES.MOLTEN_BEHEMOTH,
        ENEMY_TYPES.ANCIENT_YETI,
        ENEMY_TYPES.PLAGUE_LORD
    ]
};

export default {
    ENEMY_TYPES,
    ENEMY_MODEL_MAPPINGS,
    ENEMY_CATEGORIES,
    ENEMY_DIFFICULTY_TIERS
};