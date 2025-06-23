/**
 * Item Templates Configuration
 * Contains templates for generating different types of items
 */

// Item templates for item generation
export const ITEM_TEMPLATES = [
    // ==================== WEAPONS ====================
    
    // Fist Weapons
    {
        id: "basicFist",
        name: "Monk's Fist",
        type: "weapon",
        subType: "fist",
        description: "A simple training weapon for monks.",
        icon: "👊",
        baseStats: {
            damage: 10,
            attackSpeed: 1.2
        },
        possibleSecondaryStats: [
            "critChance",
            "critDamage",
            "attackSpeed",
            "elementalDamage",
            "cooldownReduction"
        ],
        possibleEffects: [
            {
                id: "stunChance",
                name: "Stunning Blow",
                description: "Attacks have a 10% chance to stun enemies for 1 second",
                trigger: "onHit",
                chance: 10,
                effect: "stun",
                params: { duration: 1 }
            }
        ],
        visual: {
            model: "models/weapons/basic_fist.glb",
            texture: "textures/weapons/basic_fist.png"
        }
    },
    {
        id: "tigerClaw",
        name: "Tiger Claw",
        type: "weapon",
        subType: "fist",
        description: "Sharp claws that tear through enemies.",
        icon: "🐯",
        baseStats: {
            damage: 12,
            attackSpeed: 1.3
        },
        possibleSecondaryStats: [
            "critChance",
            "critDamage",
            "attackSpeed",
            "elementalDamage",
            "bleedChance"
        ],
        possibleEffects: [
            {
                id: "bleedEffect",
                name: "Rending Claws",
                description: "Attacks cause enemies to bleed for 3 seconds, dealing 30% weapon damage per second",
                trigger: "onHit",
                chance: 25,
                effect: "bleed",
                params: { duration: 3, damagePercent: 30 }
            }
        ],
        visual: {
            model: "models/weapons/tiger_claw.glb",
            texture: "textures/weapons/tiger_claw.png"
        }
    },
    {
        id: "dragonFist",
        name: "Dragon Fist",
        type: "weapon",
        subType: "fist",
        description: "Legendary weapon said to contain the power of dragons.",
        icon: "🐉",
        baseStats: {
            damage: 15,
            attackSpeed: 1.1
        },
        possibleSecondaryStats: [
            "critChance",
            "critDamage",
            "elementalDamage",
            "cooldownReduction",
            "resourceGeneration"
        ],
        possibleEffects: [
            {
                id: "fireBreath",
                name: "Dragon's Breath",
                description: "Critical hits release a cone of fire dealing 80% weapon damage",
                trigger: "onCrit",
                chance: 100,
                effect: "coneDamage",
                params: { element: "fire", angle: 45, range: 5, damagePercent: 80 }
            }
        ],
        visual: {
            model: "models/weapons/dragon_fist.glb",
            texture: "textures/weapons/dragon_fist.png",
            particles: "effects/fire_trail.json"
        }
    },
    
    // Staves
    {
        id: "basicStaff",
        name: "Wooden Staff",
        type: "weapon",
        subType: "staff",
        description: "A simple wooden staff for training.",
        icon: "🥢",
        baseStats: {
            damage: 8,
            attackSpeed: 0.9,
            skillDamage: 10
        },
        possibleSecondaryStats: [
            "skillDamage",
            "cooldownReduction",
            "elementalDamage",
            "resourceGeneration",
            "aoeRadius"
        ],
        possibleEffects: [
            {
                id: "wisdomBonus",
                name: "Staff of Wisdom",
                description: "Increases experience gained by 10%",
                trigger: "passive",
                effect: "experienceBonus",
                params: { value: 10 }
            }
        ],
        visual: {
            model: "models/weapons/basic_staff.glb",
            texture: "textures/weapons/basic_staff.png"
        }
    },
    {
        id: "stormStaff",
        name: "Storm Staff",
        type: "weapon",
        subType: "staff",
        description: "A staff crackling with lightning energy.",
        icon: "⚡",
        baseStats: {
            damage: 9,
            attackSpeed: 0.8,
            skillDamage: 15
        },
        possibleSecondaryStats: [
            "skillDamage",
            "cooldownReduction",
            "elementalDamage",
            "resourceGeneration",
            "aoeRadius"
        ],
        possibleEffects: [
            {
                id: "chainLightning",
                name: "Chain Lightning",
                description: "Skills have a 15% chance to chain to nearby enemies, dealing 40% damage",
                trigger: "onSkillHit",
                chance: 15,
                effect: "chainLightning",
                params: { jumps: 3, damagePercent: 40 }
            }
        ],
        visual: {
            model: "models/weapons/storm_staff.glb",
            texture: "textures/weapons/storm_staff.png",
            particles: "effects/lightning_trail.json"
        }
    },
    
    // Daggers
    {
        id: "basicDagger",
        name: "Ceremonial Dagger",
        type: "weapon",
        subType: "dagger",
        description: "A ceremonial dagger used in ancient rituals.",
        icon: "🗡️",
        baseStats: {
            damage: 7,
            attackSpeed: 1.5
        },
        possibleSecondaryStats: [
            "critChance",
            "critDamage",
            "attackSpeed",
            "elementalDamage",
            "movementSpeed"
        ],
        possibleEffects: [
            {
                id: "quickStrike",
                name: "Quick Strike",
                description: "Increases attack speed by 10% for 3 seconds after a critical hit",
                trigger: "onCrit",
                chance: 100,
                effect: "buff",
                params: { stat: "attackSpeed", value: 10, duration: 3 }
            }
        ],
        visual: {
            model: "models/weapons/basic_dagger.glb",
            texture: "textures/weapons/basic_dagger.png"
        }
    },
    
    // ==================== ARMOR ====================
    
    // Robes
    {
        id: "basicRobe",
        name: "Monk's Robe",
        type: "armor",
        subType: "robe",
        description: "Simple cloth robes worn by monks.",
        icon: "👘",
        baseStats: {
            defense: 5,
            movementSpeed: 5
        },
        possibleSecondaryStats: [
            "healthBonus",
            "manaBonus",
            "cooldownReduction",
            "damageReduction",
            "allResistance"
        ],
        possibleEffects: [
            {
                id: "meditationBonus",
                name: "Meditative Garment",
                description: "Increases spirit regeneration by 10% while standing still",
                trigger: "passive",
                condition: "notMoving",
                effect: "resourceRegen",
                params: { resource: "spirit", value: 10 }
            }
        ],
        visual: {
            model: "models/armor/basic_robe.glb",
            texture: "textures/armor/basic_robe.png"
        }
    },
    {
        id: "silkRobe",
        name: "Silk Robe",
        type: "armor",
        subType: "robe",
        description: "Finely woven silk robes that enhance mobility.",
        icon: "🧵",
        baseStats: {
            defense: 7,
            movementSpeed: 8
        },
        possibleSecondaryStats: [
            "healthBonus",
            "manaBonus",
            "cooldownReduction",
            "damageReduction",
            "allResistance",
            "dodgeChance"
        ],
        possibleEffects: [
            {
                id: "flowLikeWater",
                name: "Flow Like Water",
                description: "Increases dodge chance by 5% and movement speed by 10% for 3 seconds after dodging an attack",
                trigger: "onDodge",
                chance: 100,
                effect: "buff",
                params: { stats: [
                    { stat: "dodgeChance", value: 5 },
                    { stat: "movementSpeed", value: 10 }
                ], duration: 3 }
            }
        ],
        visual: {
            model: "models/armor/silk_robe.glb",
            texture: "textures/armor/silk_robe.png"
        }
    },
    
    // Helmets
    {
        id: "basicHelmet",
        name: "Monk's Headband",
        type: "armor",
        subType: "helmet",
        description: "A simple cloth headband worn by monks.",
        icon: "👑",
        baseStats: {
            defense: 3,
            wisdom: 2
        },
        possibleSecondaryStats: [
            "healthBonus",
            "manaBonus",
            "cooldownReduction",
            "experienceBonus",
            "wisdomBonus"
        ],
        possibleEffects: [
            {
                id: "innerFocus",
                name: "Inner Focus",
                description: "Reduces the spirit cost of skills by 5%",
                trigger: "passive",
                effect: "resourceCostReduction",
                params: { resource: "spirit", value: 5 }
            }
        ],
        visual: {
            model: "models/armor/basic_headband.glb",
            texture: "textures/armor/basic_headband.png"
        }
    },
    
    // Gloves
    {
        id: "basicGloves",
        name: "Training Wraps",
        type: "armor",
        subType: "gloves",
        description: "Cloth wraps to protect the hands during training.",
        icon: "🧤",
        baseStats: {
            defense: 2,
            attackSpeed: 3
        },
        possibleSecondaryStats: [
            "critChance",
            "critDamage",
            "attackSpeed",
            "elementalDamage",
            "skillDamage"
        ],
        possibleEffects: [
            {
                id: "preciseStrikes",
                name: "Precise Strikes",
                description: "Increases critical hit chance by 5% for the first attack against an enemy",
                trigger: "onFirstHit",
                chance: 100,
                effect: "critBonus",
                params: { value: 5 }
            }
        ],
        visual: {
            model: "models/armor/basic_gloves.glb",
            texture: "textures/armor/basic_gloves.png"
        }
    },
    
    // Belts
    {
        id: "basicBelt",
        name: "Monk's Sash",
        type: "armor",
        subType: "belt",
        description: "A simple cloth sash worn around the waist.",
        icon: "➰",
        baseStats: {
            defense: 2,
            resourceMax: 5
        },
        possibleSecondaryStats: [
            "healthBonus",
            "manaBonus",
            "resourceGeneration",
            "cooldownReduction",
            "movementSpeed"
        ],
        possibleEffects: [
            {
                id: "spiritReserve",
                name: "Spirit Reserve",
                description: "Gain 5 spirit when you defeat an enemy",
                trigger: "onKill",
                chance: 100,
                effect: "resourceGain",
                params: { resource: "spirit", value: 5 }
            }
        ],
        visual: {
            model: "models/armor/basic_belt.glb",
            texture: "textures/armor/basic_belt.png"
        }
    },
    
    // Boots
    {
        id: "basicBoots",
        name: "Monk's Sandals",
        type: "armor",
        subType: "boots",
        description: "Simple sandals that allow for quick movement.",
        icon: "👟",
        baseStats: {
            defense: 2,
            movementSpeed: 5
        },
        possibleSecondaryStats: [
            "movementSpeed",
            "dodgeChance",
            "jumpHeight",
            "staminaRegen",
            "fallDamageReduction"
        ],
        possibleEffects: [
            {
                id: "swiftness",
                name: "Swiftness",
                description: "Increases movement speed by 15% for 3 seconds after using a movement skill",
                trigger: "onMovementSkill",
                chance: 100,
                effect: "buff",
                params: { stat: "movementSpeed", value: 15, duration: 3 }
            }
        ],
        visual: {
            model: "models/armor/basic_boots.glb",
            texture: "textures/armor/basic_boots.png"
        }
    },
    
    // ==================== ACCESSORIES ====================
    
    // Amulets
    {
        id: "manaAmulet",
        name: "Mana Crystal Amulet",
        type: "accessory",
        subType: "amulet",
        description: "A crystal amulet that significantly increases maximum mana.",
        icon: "🔮",
        baseStats: {
            manaBonus: 50
        },
        possibleSecondaryStats: [
            "manaRegen",
            "cooldownReduction",
            "spellPower",
            "allResistance"
        ],
        possibleEffects: [
            {
                id: "manaFlow",
                name: "Mana Flow",
                description: "Increases mana regeneration by 15% when below 30% mana",
                trigger: "passive",
                condition: "lowMana",
                threshold: 30,
                effect: "resourceRegen",
                params: { resource: "mana", value: 15 }
            }
        ],
        visual: {
            model: "models/accessories/mana_amulet.glb",
            texture: "textures/accessories/mana_amulet.png"
        }
    },
    {
        id: "basicAmulet",
        name: "Jade Pendant",
        type: "accessory",
        subType: "amulet",
        description: "A simple jade pendant that enhances spiritual energy.",
        icon: "📿",
        baseStats: {
            manaBonus: 10,
            skillEffectiveness: 5
        },
        possibleSecondaryStats: [
            "manaBonus",
            "manaRegen",
            "cooldownReduction",
            "skillDamage",
            "elementalDamage",
            "healingEffectiveness"
        ],
        possibleEffects: [
            {
                id: "spiritualGuidance",
                name: "Spiritual Guidance",
                description: "Increases the effectiveness of healing skills by 15%",
                trigger: "passive",
                effect: "healingBonus",
                params: { value: 15 }
            }
        ],
        visual: {
            model: "models/accessories/basic_amulet.glb",
            texture: "textures/accessories/basic_amulet.png"
        }
    },
    {
        id: "enlightenedAmulet",
        name: "Enlightened Pendant",
        type: "accessory",
        subType: "amulet",
        description: "An ancient pendant worn by enlightened monks.",
        icon: "🔮",
        baseStats: {
            manaBonus: 15,
            skillEffectiveness: 8
        },
        possibleSecondaryStats: [
            "manaBonus",
            "manaRegen",
            "cooldownReduction",
            "skillDamage",
            "elementalDamage",
            "healingEffectiveness",
            "wisdomBonus"
        ],
        possibleEffects: [
            {
                id: "enlightenment",
                name: "Enlightenment",
                description: "After using 3 different skills in succession, your next skill costs no spirit",
                trigger: "onSkillSequence",
                count: 3,
                effect: "freeSkill",
                params: { }
            }
        ],
        visual: {
            model: "models/accessories/enlightened_amulet.glb",
            texture: "textures/accessories/enlightened_amulet.png",
            particles: "effects/enlightened_glow.json"
        }
    },
    
    // Rings
    {
        id: "basicRing",
        name: "Iron Band",
        type: "accessory",
        subType: "ring",
        description: "A simple iron ring that enhances combat abilities.",
        icon: "💍",
        baseStats: {
            critChance: 2,
            attackPower: 3
        },
        possibleSecondaryStats: [
            "critChance",
            "critDamage",
            "attackSpeed",
            "elementalDamage",
            "resourceGeneration",
            "goldFind"
        ],
        possibleEffects: [
            {
                id: "luckyFind",
                name: "Lucky Find",
                description: "Increases gold found by 10%",
                trigger: "passive",
                effect: "goldFind",
                params: { value: 10 }
            }
        ],
        visual: {
            model: "models/accessories/basic_ring.glb",
            texture: "textures/accessories/basic_ring.png"
        }
    },
    {
        id: "elementalRing",
        name: "Elemental Band",
        type: "accessory",
        subType: "ring",
        description: "A ring infused with elemental energy.",
        icon: "🌀",
        baseStats: {
            elementalDamage: 10,
            attackPower: 5
        },
        possibleSecondaryStats: [
            "critChance",
            "critDamage",
            "elementalDamage",
            "skillDamage",
            "cooldownReduction",
            "resourceGeneration"
        ],
        possibleEffects: [
            {
                id: "elementalHarmony",
                name: "Elemental Harmony",
                description: "Your skills gain the elemental type of your weapon",
                trigger: "passive",
                effect: "elementalAdaptation",
                params: { }
            }
        ],
        visual: {
            model: "models/accessories/elemental_ring.glb",
            texture: "textures/accessories/elemental_ring.png",
            particles: "effects/elemental_glow.json"
        }
    },
    
    // Talismans
    {
        id: "basicTalisman",
        name: "Wooden Talisman",
        type: "accessory",
        subType: "talisman",
        description: "A wooden charm carved with ancient symbols.",
        icon: "🪵",
        baseStats: {
            allResistance: 5,
            healthRegen: 2
        },
        possibleSecondaryStats: [
            "allResistance",
            "healthBonus",
            "healthRegen",
            "damageReduction",
            "dodgeChance",
            "magicFind"
        ],
        possibleEffects: [
            {
                id: "protection",
                name: "Protection",
                description: "Reduces damage taken by 5% when below 30% health",
                trigger: "passive",
                condition: "lowHealth",
                threshold: 30,
                effect: "damageReduction",
                params: { value: 5 }
            }
        ],
        visual: {
            model: "models/accessories/basic_talisman.glb",
            texture: "textures/accessories/basic_talisman.png"
        }
    },
    
    // ==================== CONSUMABLES ====================
    
    // Potions
    {
        id: "minorHealthPotion",
        name: "Minor Health Potion",
        type: "consumable",
        subType: "potion",
        description: "Restores a small amount of health.",
        icon: "🧪",
        baseStats: {
            healthRestore: 50
        },
        possibleSecondaryStats: [],
        possibleEffects: [],
        visual: {
            model: "models/consumables/minor_health_potion.glb",
            texture: "textures/consumables/minor_health_potion.png"
        },
        useEffect: {
            type: "heal",
            value: 50,
            duration: 0
        }
    },
    {
        id: "minorManaPotion",
        name: "Minor Spirit Potion",
        type: "consumable",
        subType: "potion",
        description: "Restores a small amount of spirit.",
        icon: "🧪",
        baseStats: {
            manaRestore: 30
        },
        possibleSecondaryStats: [],
        possibleEffects: [],
        visual: {
            model: "models/consumables/minor_mana_potion.glb",
            texture: "textures/consumables/minor_mana_potion.png"
        },
        useEffect: {
            type: "resource",
            resource: "spirit",
            value: 30,
            duration: 0
        }
    },
    {
        id: "greaterManaPotion",
        name: "Greater Mana Potion",
        type: "consumable",
        subType: "potion",
        description: "Restores a significant amount of mana and temporarily increases mana regeneration.",
        icon: "🧪",
        baseStats: {
            manaRestore: 100
        },
        possibleSecondaryStats: [],
        possibleEffects: [],
        visual: {
            model: "models/consumables/greater_mana_potion.glb",
            texture: "textures/consumables/greater_mana_potion.png"
        },
        useEffect: {
            type: "resource",
            resource: "mana",
            value: 100,
            duration: 0,
            secondaryEffect: {
                type: "buff",
                stat: "manaRegen",
                value: 20,
                duration: 30
            }
        }
    },
    
    // Scrolls
    {
        id: "scrollOfStrength",
        name: "Scroll of Strength",
        type: "consumable",
        subType: "scroll",
        description: "Temporarily increases attack power.",
        icon: "📜",
        baseStats: {
            duration: 60
        },
        possibleSecondaryStats: [],
        possibleEffects: [],
        visual: {
            model: "models/consumables/scroll.glb",
            texture: "textures/consumables/scroll_strength.png"
        },
        useEffect: {
            type: "buff",
            stat: "attackPower",
            value: 20,
            duration: 60
        }
    },
    
    // Food
    {
        id: "riceBall",
        name: "Rice Ball",
        type: "consumable",
        subType: "food",
        description: "A simple rice ball that provides sustenance.",
        icon: "🍙",
        baseStats: {
            duration: 300
        },
        possibleSecondaryStats: [],
        possibleEffects: [],
        visual: {
            model: "models/consumables/rice_ball.glb",
            texture: "textures/consumables/rice_ball.png"
        },
        useEffect: {
            type: "buff",
            stats: [
                { stat: "healthRegen", value: 3 },
                { stat: "manaRegen", value: 2 }
            ],
            duration: 300
        }
    }
];

// Helper function to get item templates by type
export function getItemTemplatesByType(type, subType = null) {
    if (subType) {
        return ITEM_TEMPLATES.filter(template => template.type === type && template.subType === subType);
    }
    return ITEM_TEMPLATES.filter(template => template.type === type);
}

// Helper function to get a random item template
export function getRandomItemTemplate(options = {}) {
    let filteredTemplates = [...ITEM_TEMPLATES];
    
    // Filter by type if specified
    if (options.type) {
        filteredTemplates = filteredTemplates.filter(template => template.type === options.type);
    }
    
    // Filter by subType if specified
    if (options.subType) {
        filteredTemplates = filteredTemplates.filter(template => template.subType === options.subType);
    }
    
    // Return a random template from the filtered list
    if (filteredTemplates.length === 0) {
        console.warn('No item templates match the specified criteria');
        return ITEM_TEMPLATES[0];
    }
    
    return filteredTemplates[Math.floor(Math.random() * filteredTemplates.length)];
}