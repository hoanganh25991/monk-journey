/**
 * Item Templates Configuration
 * Contains templates for generating different types of items
 */

import { ItemTypes } from './item-types.js';

/**
 * @type {Array<import('./item-types.js').ItemTemplate>}
 */
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
    },
    {
        id: "phoenixGauntlets",
        name: "Phoenix Flame Gauntlets",
        type: "weapon",
        subType: "fist",
        description: "Gauntlets imbued with the eternal flame of the phoenix, growing stronger with each strike.",
        icon: "🔥",
        rarity: "legendary",
        baseStats: {
            damage: 25,
            attackSpeed: 1.4,
            critChance: 10,
            elementalDamage: 15
        },
        secondaryStats: [
            {
                type: "damageOverTime",
                value: 5,
                element: "fire"
            },
            {
                type: "stackingDamage",
                value: 2, // Damage increases by 2% per hit, stacking up to 10 times
                maxStacks: 10
            }
        ],
    },
    {
        id: "celestialKnuckles",
        name: "Celestial Star Knuckles",
        type: "weapon",
        subType: "fist",
        description: "Forged from fallen stars, these knuckles channel cosmic energy that intensifies over time.",
        icon: "⭐",
        rarity: "mythic",
        baseStats: {
            damage: 30,
            attackSpeed: 1.5,
            critChance: 15,
            critDamage: 50,
            elementalDamage: 20
        },
        secondaryStats: [
            {
                type: "damageScaling",
                value: 0.5, // Damage increases by 0.5% per second in combat, up to 50%
                maxValue: 50
            },
            {
                type: "burstDamage",
                value: 100, // Every 10th hit deals 100% additional damage
                frequency: 10
            }
        ],
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
    },
    {
        id: "voidStaff",
        name: "Void Channeler",
        type: "weapon",
        subType: "staff",
        description: "A mysterious staff that draws power from the void, growing stronger as it consumes energy.",
        icon: "🌌",
        rarity: "epic",
        baseStats: {
            damage: 15,
            attackSpeed: 0.7,
            skillDamage: 25,
            manaRegen: 5
        },
        secondaryStats: [
            {
                type: "resourceScaling",
                value: 0.3, // Damage increases by 0.3% for each 1% of mana spent
                resource: "mana"
            }
        ],
    },
    {
        id: "elementalHarmony",
        name: "Staff of Elemental Harmony",
        type: "weapon",
        subType: "staff",
        description: "A legendary staff that harmonizes all elemental energies, cycling through elements with each attack.",
        icon: "🌈",
        rarity: "legendary",
        baseStats: {
            damage: 20,
            attackSpeed: 1.0,
            skillDamage: 40,
            elementalDamage: 25
        },
        secondaryStats: [
            {
                type: "elementalCycle",
                value: 15, // Each element adds 15% damage
                elements: ["fire", "water", "earth", "air"]
            },
            {
                type: "comboScaling",
                value: 5, // Each consecutive hit with the same skill increases damage by 5%, up to 50%
                maxValue: 50
            }
        ],
    },
    {
        id: "cosmicPillar",
        name: "Pillar of Creation",
        type: "weapon",
        subType: "staff",
        description: "A mythical staff said to have been used to create the universe itself. Its power grows exponentially with continued use.",
        icon: "🌠",
        rarity: "mythic",
        baseStats: {
            damage: 25,
            attackSpeed: 0.8,
            skillDamage: 60,
            critChance: 15,
            critDamage: 75,
            elementalDamage: 30
        },
        secondaryStats: [
            {
                type: "exponentialScaling",
                value: 1, // Damage increases by 1% per second in combat, compounding
                maxValue: 100
            },
            {
                type: "skillEmpowerment",
                value: 10, // Each skill use empowers the next skill by 10%, stacking up to 5 times
                maxStacks: 5
            }
        ],
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
    },
    {
        id: "meditationCrown",
        name: "Meditation Crown",
        type: "armor",
        subType: "helmet",
        description: "A special crown that enhances focus and spiritual awareness.",
        icon: "👑",
        baseStats: {
            defense: 4,
            wisdom: 5,
            manaRegen: 2
        },
    },
    {
        id: "enlightenedHood",
        name: "Enlightened Hood",
        type: "armor",
        subType: "helmet",
        description: "A mystical hood worn by those who have achieved spiritual enlightenment.",
        icon: "🧠",
        baseStats: {
            defense: 5,
            wisdom: 8,
            skillDamage: 5
        },
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
    },
    {
        id: "ironGloves",
        name: "Iron Knuckle Gloves",
        type: "armor",
        subType: "gloves",
        description: "Reinforced gloves with iron plates over the knuckles.",
        icon: "🥊",
        baseStats: {
            defense: 4,
            attackSpeed: 2,
            damage: 5
        },
    },
    {
        id: "dragonClawGloves",
        name: "Dragon Claw Gloves",
        type: "armor",
        subType: "gloves",
        description: "Mystical gloves that transform the wearer's strikes to resemble dragon claws.",
        icon: "🐲",
        baseStats: {
            defense: 5,
            attackSpeed: 4,
            damage: 8,
            elementalDamage: 5
        },
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
    },
    {
        id: "swiftBoots",
        name: "Swift Traveler Boots",
        type: "armor",
        subType: "boots",
        description: "Lightweight boots designed for long journeys and quick movements.",
        icon: "👢",
        baseStats: {
            defense: 3,
            movementSpeed: 8
        },
    },
    {
        id: "cloudwalkers",
        name: "Cloudwalkers",
        type: "armor",
        subType: "boots",
        description: "Mystical boots that make the wearer feel as light as air.",
        icon: "☁️",
        baseStats: {
            defense: 4,
            movementSpeed: 10,
            jumpHeight: 5
        },
    },
    
    // Arms/Bracers
    {
        id: "basicBracers",
        name: "Training Bracers",
        type: "armor",
        subType: "arms",
        description: "Simple cloth bracers to protect the forearms during training.",
        icon: "🧶",
        baseStats: {
            defense: 3,
            attackSpeed: 2
        },
    },
    {
        id: "ironBracers",
        name: "Iron Bracers",
        type: "armor",
        subType: "arms",
        description: "Sturdy iron bracers that provide good protection in combat.",
        icon: "⚔️",
        baseStats: {
            defense: 5,
            attackPower: 3
        },
    },
    {
        id: "windBracers",
        name: "Wind Spirit Bracers",
        type: "armor",
        subType: "arms",
        description: "Enchanted bracers that channel the power of wind spirits.",
        icon: "🌪️",
        baseStats: {
            defense: 4,
            attackSpeed: 5,
            elementalDamage: 8
        },
    },
    
    // Shoulders
    {
        id: "basicShoulders",
        name: "Monk's Shoulder Pads",
        type: "armor",
        subType: "shoulders",
        description: "Simple padded cloth to protect the shoulders.",
        icon: "🧥",
        baseStats: {
            defense: 4,
            maxHealth: 10
        },
    },
    {
        id: "mountainShoulders",
        name: "Mountain Guardian Spaulders",
        type: "armor",
        subType: "shoulders",
        description: "Heavy spaulders that provide excellent protection.",
        icon: "🏔️",
        baseStats: {
            defense: 7,
            maxHealth: 15,
            allResistance: 3
        },
    },
    {
        id: "spiritShoulders",
        name: "Spirit Caller Mantle",
        type: "armor",
        subType: "shoulders",
        description: "A mystical mantle that enhances spiritual connection.",
        icon: "👻",
        baseStats: {
            defense: 5,
            manaBonus: 20,
            skillDamage: 8
        },
    },
    
    // Legs/Pants
    {
        id: "basicLegs",
        name: "Monk's Leggings",
        type: "armor",
        subType: "legs",
        description: "Simple cloth leggings that allow for fluid movement.",
        icon: "👖",
        baseStats: {
            defense: 4,
            movementSpeed: 3
        },
    },
    {
        id: "silkLegs",
        name: "Silk Leggings",
        type: "armor",
        subType: "legs",
        description: "Finely woven silk leggings that enhance mobility and comfort.",
        icon: "🧵",
        baseStats: {
            defense: 5,
            movementSpeed: 5,
            healthRegen: 2
        },
    },
    {
        id: "dragonLegs",
        name: "Dragon Scale Leggings",
        type: "armor",
        subType: "legs",
        description: "Leggings crafted from the scales of a dragon, offering superior protection.",
        icon: "🐉",
        baseStats: {
            defense: 8,
            movementSpeed: 2,
            allResistance: 5
        },
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
        },
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
        },
    },
    {
        id: "spiritCoreAmulet",
        name: "Spirit Core Amulet",
        type: "accessory",
        subType: "amulet",
        description: "An amulet containing a concentrated core of spiritual energy that enhances all abilities.",
        icon: "💠",
        rarity: "epic",
        baseStats: {
            manaBonus: 75,
            skillDamage: 15,
            manaRegen: 8
        },
        secondaryStats: [
            {
                type: "spiritConversion",
                value: 15 // Converts 15% of max spirit to damage
            }
        ],
    },
    {
        id: "celestialHeart",
        name: "Celestial Heart",
        type: "accessory",
        subType: "amulet",
        description: "A legendary amulet containing the crystallized heart of a celestial being, pulsing with divine energy.",
        icon: "💗",
        rarity: "legendary",
        baseStats: {
            manaBonus: 120,
            skillDamage: 30,
            manaRegen: 15,
            cooldownReduction: 10
        },
        secondaryStats: [
            {
                type: "skillEmpowerment",
                value: 2, // Each skill cast empowers the next skill by 2%, stacking up to 50%
                maxValue: 50
            },
            {
                type: "manaEfficiency",
                value: 0.5 // For each 1% of mana spent, gain 0.5% increased damage for 5 seconds
            }
        ],
    },
    {
        id: "soulNexus",
        name: "Soul Nexus",
        type: "accessory",
        subType: "amulet",
        description: "A mythical amulet that serves as a conduit between realms, drawing power from both the physical and spiritual worlds.",
        icon: "🌟",
        rarity: "mythic",
        baseStats: {
            manaBonus: 200,
            skillDamage: 50,
            manaRegen: 25,
            cooldownReduction: 20,
            allResistance: 15
        },
        secondaryStats: [
            {
                type: "dualityHarmony",
                value: 0.2, // Gain 0.2% damage for each point of both health and mana
                maxValue: 100
            },
            {
                type: "soulResonance",
                value: 5, // Every 5 seconds, release a soul burst dealing 5% of all damage dealt in that period
                interval: 5
            },
            {
                type: "transcendentSpirit",
                value: 0.1, // Permanently gain 0.1% increased spirit and damage for each enemy defeated
                persistent: true
            }
        ],
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
    },
    {
        id: "crescentMoonRing",
        name: "Crescent Moon Ring",
        type: "accessory",
        subType: "ring",
        description: "A ring that harnesses lunar energy, growing stronger as combat continues.",
        icon: "🌙",
        rarity: "epic",
        baseStats: {
            critChance: 8,
            attackPower: 12,
            critDamage: 25
        },
        secondaryStats: [
            {
                type: "combatScaling",
                value: 1, // Every 10 seconds in combat increases damage by 1%, up to 20%
                interval: 10,
                maxValue: 20
            }
        ],
    },
    {
        id: "infinityBand",
        name: "Infinity Band",
        type: "accessory",
        subType: "ring",
        description: "A legendary ring that continuously amplifies the wearer's power with each victory.",
        icon: "♾️",
        rarity: "legendary",
        baseStats: {
            critChance: 12,
            attackPower: 20,
            critDamage: 40,
            elementalDamage: 15
        },
        secondaryStats: [
            {
                type: "victoryScaling",
                value: 0.5, // Each enemy defeated increases damage by 0.5%, persisting until rest
                maxValue: 50
            },
            {
                type: "critScaling",
                value: 5 // Critical hits increase critical damage by 5% for 10 seconds, stacking up to 5 times
            }
        ],
    },
    {
        id: "eternityLoop",
        name: "Eternity Loop",
        type: "accessory",
        subType: "ring",
        description: "A mythical ring that exists in all timelines simultaneously, accumulating power across dimensions.",
        icon: "🔄",
        rarity: "mythic",
        baseStats: {
            critChance: 15,
            attackPower: 30,
            critDamage: 60,
            elementalDamage: 25,
            attackSpeed: 10
        },
        secondaryStats: [
            {
                type: "timeScaling",
                value: 0.1, // Damage increases by 0.1% per second of real-time gameplay, persisting between sessions
                persistent: true
            },
            {
                type: "damageAmplification",
                value: 0.5, // 0.5% of all damage dealt is permanently added to the ring's power
                maxValue: 100
            }
        ],
    },
    {
        id: "superiorEternityLoop",
        name: "Superior Eternity Loop",
        type: "accessory",
        subType: "ring",
        description: "An enhanced version of the Eternity Loop with greater power across all dimensions.",
        icon: "🔄",
        rarity: "mythic",
        baseStats: {
            critChance: 18,
            attackPower: 35,
            critDamage: 70,
            elementalDamage: 30,
            attackSpeed: 12
        },
        secondaryStats: [
            {
                type: "timeScaling",
                value: 0.15, // Damage increases by 0.15% per second of real-time gameplay, persisting between sessions
                persistent: true
            },
            {
                type: "damageAmplification",
                value: 0.8, // 0.8% of all damage dealt is permanently added to the ring's power
                maxValue: 150
            }
        ],
    },
    {
        id: "fineIronBand",
        name: "Fine Iron Band",
        type: "accessory",
        subType: "ring",
        description: "A finely crafted iron ring with superior craftsmanship.",
        icon: "💍",
        rarity: "uncommon",
        baseStats: {
            critChance: 4,
            attackPower: 6,
            defense: 3
        },
        secondaryStats: [
            {
                type: "resourceRegen",
                value: 2, // Increases resource regeneration by 2%
                resource: "all"
            }
        ],
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
    },
    {
        id: "dragonscaleTalisman",
        name: "Dragonscale Talisman",
        type: "accessory",
        subType: "talisman",
        description: "A talisman crafted from ancient dragon scales that enhances offensive capabilities while providing protection.",
        icon: "🐲",
        rarity: "epic",
        baseStats: {
            allResistance: 15,
            healthRegen: 5,
            attackPower: 10,
            elementalDamage: 12
        },
        secondaryStats: [
            {
                type: "adaptiveDamage",
                value: 20 // Converts 20% of resistance to damage when above 50% health
            }
        ],
    },
    {
        id: "chakraTalisman",
        name: "Seven Chakras Talisman",
        type: "accessory",
        subType: "talisman",
        description: "A legendary talisman that aligns the seven chakras, unlocking greater power as the monk achieves spiritual balance.",
        icon: "🧘",
        rarity: "legendary",
        baseStats: {
            allResistance: 20,
            healthRegen: 8,
            manaRegen: 10,
            attackPower: 15,
            skillDamage: 25
        },
        secondaryStats: [
            {
                type: "balanceScaling",
                value: 3, // For every 10% of both health and mana, gain 3% increased damage
                maxValue: 30
            },
            {
                type: "chakraUnlock",
                value: 7, // Each chakra unlocks at different health thresholds, providing unique bonuses
                thresholds: [100, 85, 70, 55, 40, 25, 10]
            }
        ],
    },
    {
        id: "cosmicNexus",
        name: "Cosmic Nexus",
        type: "accessory",
        subType: "talisman",
        description: "A mythical talisman that serves as a nexus for cosmic energies, channeling the power of the universe into devastating attacks.",
        icon: "🌌",
        rarity: "mythic",
        baseStats: {
            allResistance: 30,
            healthRegen: 12,
            manaRegen: 15,
            attackPower: 25,
            skillDamage: 40,
            critChance: 10,
            critDamage: 50
        },
        secondaryStats: [
            {
                type: "cosmicAlignment",
                value: 0.5, // Damage increases by 0.5% for each second perfectly aligned with combat rhythm
                maxValue: 100
            },
            {
                type: "universalHarmony",
                value: 10, // Every 30 seconds, unleash a cosmic burst dealing 10% of all damage dealt in that period
                interval: 30
            },
            {
                type: "transcendentPower",
                value: 1, // Gain 1% increased damage for each enemy defeated, persisting through death
                persistent: true,
                maxValue: 200
            }
        ],
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
            healthRestore: 50,
            effectType: "instant"
        },
        consumable: true
    },
    {
        id: "minorManaPotion",
        name: "Minor Spirit Potion",
        type: "consumable",
        subType: "potion",
        description: "Restores a small amount of spirit.",
        icon: "🧪",
        baseStats: {
            manaRestore: 30,
            effectType: "instant"
        },
        consumable: true
    },
    {
        id: "greaterManaPotion",
        name: "Greater Mana Potion",
        type: "consumable",
        subType: "potion",
        description: "Restores a significant amount of mana and temporarily increases mana regeneration.",
        icon: "🧪",
        baseStats: {
            manaRestore: 100,
            effectType: "buff",
            duration: 30,
            buffStats: {
                manaRegen: 5
            }
        },
        consumable: true
    },
    {
        id: "rejuvenationPotion",
        name: "Potion of Rejuvenation",
        type: "consumable",
        subType: "potion",
        description: "Restores health and mana over time.",
        icon: "🧪",
        baseStats: {
            healthRestore: 20,
            manaRestore: 20,
            effectType: "over_time",
            duration: 15,
            buffStats: {
                healthRegen: 5,
                manaRegen: 3
            }
        },
        consumable: true
    },
    {
        id: "elixirOfPower",
        name: "Elixir of Power",
        type: "consumable",
        subType: "potion",
        description: "Temporarily increases attack power and critical hit chance.",
        icon: "⚡",
        baseStats: {
            effectType: "buff",
            duration: 45,
            buffStats: {
                attackPower: 15,
                critChance: 10
            }
        },
        consumable: true
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
            effectType: "buff",
            duration: 60,
            buffStats: {
                attackPower: 20
            }
        },
        consumable: true
    },
    {
        id: "scrollOfProtection",
        name: "Scroll of Protection",
        type: "consumable",
        subType: "scroll",
        description: "Temporarily increases defense and all resistances.",
        icon: "📜",
        baseStats: {
            effectType: "buff",
            duration: 60,
            buffStats: {
                defense: 15,
                allResistance: 10
            }
        },
        consumable: true
    },
    {
        id: "scrollOfElementalFury",
        name: "Scroll of Elemental Fury",
        type: "consumable",
        subType: "scroll",
        description: "Temporarily imbues attacks with elemental energy that grows stronger with each hit.",
        icon: "🌪️",
        rarity: "epic",
        baseStats: {
            effectType: "buff",
            duration: 120,
            buffStats: {
                elementalDamage: 30,
                attackSpeed: 10
            }
        },
        secondaryStats: [
            {
                type: "stackingElemental",
                value: 1, // Each hit increases elemental damage by 1%, stacking up to 30 times
                maxStacks: 30
            }
        ],
        consumable: true
    },
    {
        id: "scrollOfTimeDilation",
        name: "Scroll of Time Dilation",
        type: "consumable",
        subType: "scroll",
        description: "Temporarily warps time around the user, dramatically increasing attack and movement speed.",
        icon: "⏱️",
        rarity: "legendary",
        baseStats: {
            effectType: "buff",
            duration: 30,
            buffStats: {
                attackSpeed: 50,
                movementSpeed: 30,
                cooldownReduction: 30
            }
        },
        secondaryStats: [
            {
                type: "acceleratingDamage",
                value: 2, // Damage increases by 2% every second while active
                maxValue: 60
            }
        ],
        consumable: true
    },
    {
        id: "scrollOfTranscendence",
        name: "Scroll of Transcendence",
        type: "consumable",
        subType: "scroll",
        description: "A mythical scroll that temporarily elevates the user to a higher plane of existence, granting godlike power.",
        icon: "✨",
        rarity: "mythic",
        baseStats: {
            effectType: "buff",
            duration: 20,
            buffStats: {
                attackPower: 100,
                skillDamage: 100,
                critChance: 50,
                critDamage: 100,
                attackSpeed: 30,
                movementSpeed: 50,
                cooldownReduction: 50
            }
        },
        secondaryStats: [
            {
                type: "invulnerability",
                value: 5 // User is invulnerable for the first 5 seconds
            },
            {
                type: "afterEffect",
                value: 10, // After the effect ends, gain 10% of the buff's power permanently
                permanent: true
            }
        ],
        consumable: true
    },
    
    // Food
    {
        id: "riceBall",
        name: "Rice Ball",
        type: "consumable",
        subType: "food",
        description: "A simple rice ball that provides sustenance and temporarily increases maximum health.",
        icon: "🍙",
        baseStats: {
            healthRestore: 30,
            effectType: "buff",
            duration: 120,
            buffStats: {
                maxHealth: 50
            }
        },
        consumable: true
    },
    {
        id: "herbalTea",
        name: "Herbal Tea",
        type: "consumable",
        subType: "food",
        description: "A soothing tea that restores mana and increases wisdom temporarily.",
        icon: "🍵",
        baseStats: {
            manaRestore: 25,
            effectType: "buff",
            duration: 180,
            buffStats: {
                wisdom: 10
            }
        },
        consumable: true
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