// Level up rewards
// Item set definitions
export const ITEM_SETS = {
    // Monk-specific sets
    monkSets: {
        // The Enlightened One set
        enlightenedOne: {
            id: "enlightenedOne",
            name: "The Enlightened One",
            description: "Ancient garments worn by the first monks to achieve enlightenment.",
            pieces: [
                { type: "armor", subType: "helmet", name: "Crown of Wisdom" },
                { type: "armor", subType: "robe", name: "Vestments of Clarity" },
                { type: "armor", subType: "gloves", name: "Fists of Serenity" },
                { type: "armor", subType: "belt", name: "Sash of Balance" },
                { type: "armor", subType: "boots", name: "Steps of Tranquility" },
                { type: "accessory", subType: "amulet", name: "Pendant of Enlightenment" }
            ],
            bonuses: [
                { 
                    count: 2, 
                    description: "+20% Meditation effectiveness",
                    effects: [{ type: "meditationEffectiveness", value: 20 }]
                },
                { 
                    count: 4, 
                    description: "+30% Spirit regeneration and +15% cooldown reduction",
                    effects: [
                        { type: "spiritRegen", value: 30 },
                        { type: "cooldownReduction", value: 15 }
                    ]
                },
                { 
                    count: 6, 
                    description: "Wave of Light creates 3 smaller waves that each deal 40% damage",
                    effects: [{ type: "skillModifier", skill: "waveOfLight", modifier: "tripleWave" }]
                }
            ]
        },
        
        // Thunderfist set
        thunderfist: {
            id: "thunderfist",
            name: "Thunderfist",
            description: "Harness the power of lightning with every strike.",
            pieces: [
                { type: "weapon", subType: "fist", name: "Fist of Thunder" },
                { type: "armor", subType: "gloves", name: "Storm Grips" },
                { type: "armor", subType: "belt", name: "Lightning Coil" },
                { type: "accessory", subType: "ring", name: "Thundergod's Vigor" }
            ],
            bonuses: [
                { 
                    count: 2, 
                    description: "+50% Lightning damage",
                    effects: [{ type: "elementalDamage", element: "lightning", value: 50 }]
                },
                { 
                    count: 4, 
                    description: "Your attacks have a 20% chance to call down lightning, dealing 150% weapon damage",
                    effects: [{ type: "proc", procType: "lightning", chance: 20, damage: 150 }]
                }
            ]
        },
        
        // Jade Harmony set
        jadeHarmony: {
            id: "jadeHarmony",
            name: "Jade Harmony",
            description: "Find inner peace and outward strength through perfect balance.",
            pieces: [
                { type: "weapon", subType: "staff", name: "Staff of Harmony" },
                { type: "armor", subType: "helmet", name: "Jade Crown" },
                { type: "armor", subType: "robe", name: "Jade Vestments" },
                { type: "armor", subType: "boots", name: "Jade Footwraps" },
                { type: "accessory", subType: "amulet", name: "Jade Pendant" }
            ],
            bonuses: [
                { 
                    count: 2, 
                    description: "+25% Healing effectiveness",
                    effects: [{ type: "healingEffectiveness", value: 25 }]
                },
                { 
                    count: 3, 
                    description: "+15% Damage reduction and +10% Movement speed",
                    effects: [
                        { type: "damageReduction", value: 15 },
                        { type: "movementSpeed", value: 10 }
                    ]
                },
                { 
                    count: 5, 
                    description: "Exploding Palm affects 2 additional enemies and its damage is increased by 100%",
                    effects: [
                        { type: "skillModifier", skill: "explodingPalm", modifier: "additionalTargets", value: 2 },
                        { type: "skillDamage", skill: "explodingPalm", value: 100 }
                    ]
                }
            ]
        }
    },
    
    // Generic sets that any class can use
    genericSets: {
        // Ancient Wisdom set
        ancientWisdom: {
            id: "ancientWisdom",
            name: "Ancient Wisdom",
            description: "Knowledge from the ancients flows through these artifacts.",
            pieces: [
                { type: "accessory", subType: "amulet", name: "Pendant of Knowledge" },
                { type: "accessory", subType: "ring", name: "Band of Secrets" },
                { type: "accessory", subType: "ring", name: "Circle of Truth" }
            ],
            bonuses: [
                { 
                    count: 2, 
                    description: "+20% Experience gained",
                    effects: [{ type: "experienceBonus", value: 20 }]
                },
                { 
                    count: 3, 
                    description: "+15% Cooldown reduction and +10% Resource cost reduction",
                    effects: [
                        { type: "cooldownReduction", value: 15 },
                        { type: "resourceCostReduction", value: 10 }
                    ]
                }
            ]
        },
        
        // Celestial Guardian set
        celestialGuardian: {
            id: "celestialGuardian",
            name: "Celestial Guardian",
            description: "Protected by the spirits of ancient guardians.",
            pieces: [
                { type: "armor", subType: "helmet", name: "Celestial Crown" },
                { type: "armor", subType: "robe", name: "Celestial Vestments" },
                { type: "armor", subType: "gloves", name: "Celestial Grips" },
                { type: "armor", subType: "boots", name: "Celestial Treads" }
            ],
            bonuses: [
                { 
                    count: 2, 
                    description: "+20% Health and +10% All resistances",
                    effects: [
                        { type: "healthBonus", value: 20 },
                        { type: "allResistance", value: 10 }
                    ]
                },
                { 
                    count: 4, 
                    description: "When you take damage, you have a 15% chance to become invulnerable for 2 seconds",
                    effects: [{ type: "proc", procType: "invulnerability", chance: 15, duration: 2 }]
                }
            ]
        }
    }
};

// Skill modification system
export const SKILL_MODIFICATIONS = {
    // Modifications for Wave of Light skill
    waveOfLight: {
        tripleWave: {
            name: "Triple Wave",
            description: "Wave of Light creates 3 smaller waves that each deal 40% damage",
            damageMultiplier: 0.4,
            waveCount: 3,
            visualEffect: "tripleWaveEffect"
        },
        fireWave: {
            name: "Fire Wave",
            description: "Wave of Light becomes a wave of fire that burns enemies for 3 seconds",
            elementType: "fire",
            burnDuration: 3,
            burnDamagePercent: 50,
            visualEffect: "fireWaveEffect"
        },
        wideWave: {
            name: "Wide Wave",
            description: "Wave of Light is 50% wider and pushes enemies back",
            widthMultiplier: 1.5,
            knockbackDistance: 5,
            visualEffect: "wideWaveEffect"
        }
    },
    
    // Modifications for Flying Kick skill
    flyingKick: {
        lightningKick: {
            name: "Lightning Kick",
            description: "Flying Kick charges you with lightning, dealing damage to nearby enemies",
            elementType: "lightning",
            aoeRadius: 3,
            aoeDamagePercent: 60,
            visualEffect: "lightningKickEffect"
        },
        teleportKick: {
            name: "Teleport Kick",
            description: "Flying Kick can be used again within 2 seconds at no spirit cost",
            cooldownReset: true,
            resetWindow: 2,
            noResourceCost: true,
            visualEffect: "teleportKickEffect"
        },
        explosiveKick: {
            name: "Explosive Kick",
            description: "Flying Kick creates an explosion on impact, dealing 80% weapon damage",
            explosionRadius: 4,
            explosionDamagePercent: 80,
            visualEffect: "explosiveKickEffect"
        }
    },
    
    // Modifications for Exploding Palm skill
    explodingPalm: {
        essenceBleed: {
            name: "Essence Bleed",
            description: "Exploding Palm's bleed effect lasts twice as long and deals 50% more damage",
            durationMultiplier: 2.0,
            damageMultiplier: 1.5,
            visualEffect: "essenceBleedEffect"
        },
        chainExplosion: {
            name: "Chain Explosion",
            description: "When an enemy affected by Exploding Palm dies, the explosion has a 40% chance to apply Exploding Palm to nearby enemies",
            chainChance: 0.4,
            chainRadius: 5,
            visualEffect: "chainExplosionEffect"
        },
        frostPalm: {
            name: "Frost Palm",
            description: "Exploding Palm becomes cold damage and freezes enemies for 2 seconds when they die",
            elementType: "ice",
            freezeDuration: 2,
            visualEffect: "frostPalmEffect"
        }
    }
};

export const LEVEL_UP_REWARDS = {
    // Health increase per level
    healthPerLevel: 10,
    // Mana increase per level
    manaPerLevel: 5,
    // Attack power increase per level
    attackPowerPerLevel: 2,
    // Stat points awarded per level
    statPointsPerLevel: 3,
    // Skill points awarded per level
    skillPointsPerLevel: 1,
    // Gold awarded per level
    goldPerLevel: 100,
    // Special rewards at milestone levels
    milestones: {
        5: {
            description: "First Skill Variant Unlocked",
            skillPoints: 2,
            gold: 250
        },
        10: {
            description: "Second Skill Variant Unlocked",
            skillPoints: 3,
            gold: 500,
            item: {
                type: "accessory",
                minRarity: "rare"
            }
        },
        15: {
            description: "Third Skill Variant Unlocked",
            skillPoints: 3,
            statPoints: 5,
            gold: 750
        },
        20: {
            description: "Special Ability Unlocked",
            skillPoints: 4,
            gold: 1000,
            item: {
                type: "weapon",
                minRarity: "epic"
            }
        },
        30: {
            description: "World Tier System Unlocked",
            skillPoints: 5,
            statPoints: 10,
            gold: 2000,
            item: {
                type: "any",
                minRarity: "legendary"
            }
        }
    },
    // Stat scaling with level
    statScaling: {
        // Base stats at level 1
        baseStats: {
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            vitality: 10
        },
        // How much each stat contributes to derived attributes
        statContributions: {
            // Strength increases attack power and physical resistance
            strength: {
                attackPower: 1.0, // 1 attack power per point
                physicalResistance: 0.1 // 0.1% physical resistance per point
            },
            // Dexterity increases critical hit chance and dodge
            dexterity: {
                critChance: 0.1, // 0.1% crit chance per point
                dodge: 0.1 // 0.1% dodge chance per point
            },
            // Intelligence increases mana and skill effectiveness
            intelligence: {
                manaBonus: 1.0, // 1 mana per point
                skillEffectiveness: 0.5 // 0.5% skill effectiveness per point
            },
            // Vitality increases health and all resistances
            vitality: {
                healthBonus: 2.0, // 2 health per point
                allResistance: 0.05 // 0.05% all resistance per point
            }
        }
    }
};