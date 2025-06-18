// Skills configuration
import { SKILL_ICONS } from './skill/skill-icons.js';
import { SKILL_SOUNDS } from './sounds.js';
// Type definitions are available in skill-types.js
// @ts-check
/** @typedef {import('./skill/skill-types.js').SkillConfig} SkillConfig */
/** @typedef {import('./skill/skill-types.js').SkillSounds} SkillSounds */
/** @typedef {import('./skill/skill-types.js').SkillType} SkillType */
/** @typedef {import('./skill/skill-types.js').GroundRectangleProps} GroundRectangleProps */
/** @typedef {import('./skill/skill-types.js').SkillCollections} SkillCollections */

// Primary attacks - basic attacks that don't consume mana
/** @type {SkillConfig[]} */
export const PRIMARY_ATTACKS = [
    {
        name: 'Fist of Thunder',
        description: 'Teleport to the nearest enemy and strike them with lightning',
        type: 'teleport',
        damage: 15, // Balanced primary attack damage
        manaCost: 0,
        cooldown: 0.2, // Very short cooldown for basic attack
        range: 15, // Teleport range
        radius: 3, // Increased area of effect for more reliable hits
        duration: 0.5, // Short duration
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        primaryAttack: true,
        sounds: {
            cast: SKILL_SOUNDS.fistOfThunder.id, // Sound of lightning charging
            impact: SKILL_SOUNDS.thunderStrike.id, // Crackling lightning impact
            end: SKILL_SOUNDS.thunderEcho.id // Echo of thunder after strike
        }
    },
    {
        name: "Deadly Reach",
        description: "Extend your reach to strike enemies from a distance.",
        type: "projectile",
        damage: 10, // Keeping this the same as it's already balanced
        manaCost: 0,
        cooldown: 0.2,
        range: 20, // Increased range for a proper ranged attack
        radius: 1, // Small area of effect at impact point
        duration: 1.5, // Duration for the beam to extend and retract
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        piercing: true, // Can pierce through enemies
        knockback: true, // Final strike can knock back enemies
        primaryAttack: true,
        projectileSpeed: 15, // Speed of the projectile
        stationaryAttack: true, // Flag to indicate this skill should not move the hero
        sounds: {
            cast: SKILL_SOUNDS.deadlyReachCast.id, // Sound of energy focusing
            impact: SKILL_SOUNDS.deadlyReachImpact.id, // Sound of strike hitting
            end: SKILL_SOUNDS.deadlyReachEnd.id // Sound of energy dispersing
        }
    }
];

// Normal skills that consume mana and have various effects
/** @type {SkillConfig[]} */
export const NORMAL_SKILLS = [
    {
        name: 'Wave of Light',
        description: 'Summon a massive bell that crashes down on enemies',
        type: 'wave',
        damage: 35, // Reduced from 50 for better balance
        manaCost: 25, // Increased from 20 to match damage output
        cooldown: 0.2, // Reduced cooldown
        range: 25,
        radius: 5,
        duration: 3.0, // Further increased duration from 3.5 to 5.0
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.waveOfLight.id, // Monk summoning the bell with chanting
            impact: SKILL_SOUNDS.bellRing.id, // Deep, resonant bell sound
            end: SKILL_SOUNDS.bellFade.id // Bell sound fading with reverberations
        }
    },
    {
        name: 'Shield of Zen',
        description: 'Envelop yourself in a golden aura with a protective Buddha figure that absorbs 30% of damage and reflects 10% back to attackers',
        type: 'buff',
        damage: 2, // This is a defensive skill, low damage is appropriate
        manaCost: 25, // Reduced from 30 as it's a defensive skill
        cooldown: 0.2, // Reduced cooldown
        range: 0, // Self-cast
        radius: 3, // Area of effect around player
        duration: 8, // 10 seconds duration
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.innerSanctuary.id, // Reusing Inner Sanctuary sound for now
            impact: SKILL_SOUNDS.barrierForm.id, // Sound of protective barrier forming
            end: SKILL_SOUNDS.barrierDissipate.id // Sound of barrier fading away
        }
    },
    {
        name: 'Breath of Heaven',
        description: 'A healing skill that restores health to the Monk and nearby allies.',
        type: 'heal',
        damage: 5, // Low damage is appropriate for a healing skill
        healing: 15, // Increased from 10 to make healing more effective
        manaCost: 25, // Increased from 20 to balance the improved healing
        cooldown: 0.2, // Longer cooldown for healing ability
        range: 0, // Centered on player
        radius: 8, // Large radius to affect multiple allies/enemies
        duration: 5, // Duration in seconds
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.breathOfHeaven.id, // Heavenly choir sound
            impact: SKILL_SOUNDS.healingPulse.id, // Soft healing pulse sound
            end: SKILL_SOUNDS.divineEcho.id // Echoing divine sound as effect fades
        }
    },
    {
        name: 'Wave Strike',
        description: 'Send a wave of energy towards enemies',
        type: 'ranged',
        damage: 25, // Increased from 20 to make it more effective
        manaCost: 20, // Kept the same as it's balanced
        cooldown: 0.2, // Reduced cooldown
        range: 25,
        radius: 3,
        duration: 3.5, // Further increased duration from 2.5 to 3.5
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.waveStrike.id, // Monk channels energy and releases a wave
            impact: SKILL_SOUNDS.waterImpact.id, // Watery impact sound when hitting enemies
            end: SKILL_SOUNDS.waterDissipate.id // Sound of water energy dissipating
        }
    },
    {
        name: 'Cyclone Strike',
        description: 'Generate a vortex of wind that pulls in enemies and deals damage.',
        type: 'aoe',
        damage: 30, // Kept the same as it's balanced
        manaCost: 35, // Reduced from 40 to make it more usable
        cooldown: 0.2, // Reduced cooldown
        range: 0,
        radius: 4,
        get duration() { return 1.5 + Math.log(this.radius) },
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.cycloneStrike.id, // Powerful wind gathering sound
            impact: SKILL_SOUNDS.windPull.id, // Sound of enemies being pulled by wind
            end: SKILL_SOUNDS.windDissipate.id // Wind dissipating after the cyclone ends
        }
    },
    {
        name: 'Seven-Sided Strike',
        description: 'Rapidly attack multiple enemies',
        type: 'multi',
        damage: 40, // Reduced from 50 for better balance
        manaCost: 35, // Increased from 30 to match the power
        cooldown: 0.2, // Reduced cooldown
        range: 0,
        radius: 5,
        duration: 2.5,
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        hits: 7,
        sounds: {
            cast: SKILL_SOUNDS.sevenSidedStrike.id, // Monk chanting and focusing energy
            impact: SKILL_SOUNDS.rapidStrike.id, // Quick succession of strike impacts
            end: SKILL_SOUNDS.strikeComplete.id // Final strike with emphasis
        }
    },
    {
        name: 'Inner Sanctuary',
        description: 'Create a protective zone that reduces damage',
        type: 'buff',
        damage: 5, // Low damage is appropriate for a defensive skill
        manaCost: 25, // Increased from 20 to match the utility
        cooldown: 0.2, // Reduced cooldown
        range: 0,
        radius: 5,
        duration: 10, // Further increased duration from 7 to 10
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.innerSanctuary.id, // Monk chanting a protection mantra
            impact: SKILL_SOUNDS.barrierForm.id, // Sound of protective barrier forming
            end: SKILL_SOUNDS.barrierDissipate.id // Sound of barrier fading away
        }
    },
    {
        name: 'Mystic Allies',
        description: 'Summon spirit allies to fight alongside you',
        type: 'summon',
        damage: 30, // Reduced from 50 for better balance
        manaCost: 40, // Increased from 0 to match the power (summoning should cost mana)
        cooldown: 0.2, // Reduced cooldown
        range: 0, // Increased range for summoning
        radius: 10, // Increased radius for summoning circle
        duration: 8, // Increased duration to 30 seconds
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        allyCount: 2, // Number of allies to summon
        sounds: {
            cast: SKILL_SOUNDS.mysticAlly.id, // Mystical summoning incantation
            impact: SKILL_SOUNDS.allySummonComplete.id, // Sound of ally materializing
            end: SKILL_SOUNDS.allyDismiss.id // Sound of ally returning to spirit realm
        }
    },
    {
        name: 'Exploding Palm',
        description: 'A skill that marks an enemy for death, causing them to explode upon death and deal damage to nearby enemies.',
        type: 'mark',
        damage: 45, // Reduced from 55 for better balance
        manaCost: 45, // Reduced from 50 to match the adjusted damage
        cooldown: 0.2, // Reduced cooldown
        range: 30,
        radius: 3,
        duration: 3, // Further increased duration from 15 to 20 seconds
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.explodingPalm.id, // Sound of monk focusing deadly energy
            impact: SKILL_SOUNDS.markApplied.id, // Sound of mark being applied to enemy
            end: SKILL_SOUNDS.massiveExplosion.id // Powerful explosion when mark detonates
        }
    },
    {
        name: 'Flying Dragon',
        description: 'A powerful attack that launches the Monk into the air, striking enemies with a flurry of kicks.',
        type: 'dash',
        damage: 100, // Significantly reduced from 120 for better balance
        manaCost: 60, // Reduced from 100 to match the adjusted damage
        cooldown: 0.2,
        range: 30, // Increased range for fast forward movement
        radius: 5, // Adjusted radius for the area of effect
        duration: 3, // Slightly reduced duration for a faster, more impactful attack
        flightSpeed: 25, // Speed of the dash forward
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        verticalLeap: true, // Indicates the monk leaps into the air
        multiHit: 5, // Number of kicks in the flurry
        windEffect: true, // Visual wind effect when moving forward
        sounds: {
            cast: SKILL_SOUNDS.flyingDragon.id, // Sound of monk leaping into the air
            impact: SKILL_SOUNDS.dragonStrike.id, // Sound of powerful kicks landing
            end: SKILL_SOUNDS.dragonLand.id // Sound of monk landing after the attack
        }
    },
    {
        name: 'Flying Kick',
        description: 'A swift kick that propels the Monk forward, dealing damage to enemies in its path.',
        type: 'dash',
        damage: 30, // Kept the same as it's balanced
        manaCost: 25, // Increased from 20 to match other mobility skills
        cooldown: 0.2,
        radius: 2,
        // Configuration parameters for the kick effect:
        range: 30,       // Maximum distance the kick can travel (in units)
        duration: 5,      // Maximum time the effect can last (in seconds)
        kickSpeed: 40,    // Speed of the kick (units per second)
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        sounds: {
            cast: SKILL_SOUNDS.flyingKick.id, // Sound of monk preparing to kick
            impact: SKILL_SOUNDS.kickImpact.id, // Sound of kick connecting with enemies
            end: SKILL_SOUNDS.kickLand.id // Sound of monk landing after the kick
        }
    },
    {
        name: 'Imprisoned Fists',
        description: 'A powerful strike that locks enemies in place, preventing them from moving.',
        type: 'control',
        damage: 15, // Increased from 5 to make it more impactful
        manaCost: 30, // Increased from 25 to match the utility
        range: 10,
        radius: 5,
        moveSpeed: 30, // Speed at which the effect moves forward
        cooldown: 0.2,
        lockDuration: 5,
        get duration() { return this.lockDuration + (this.range / this.moveSpeed) },
        get color() { return SKILL_ICONS[this.name].color; },
        get icon() { return SKILL_ICONS[this.name].emoji; },
        immobilize: true, // Prevents enemies from moving
        // Ground rectangle properties for collision detection
        groundRectangle: {
            // Width equals the skill's radius
            useSkillRadiusForWidth: true,
            // Length increases along travel direction
            dynamicLength: true,
            // Small Y offset from terrain height
            yOffset: 0.1
        },
        // Apply lock effect to enemies hit during travel
        lockEnemiesDuringTravel: true,
        // Lock effect duration (in seconds)
        sounds: {
            cast: SKILL_SOUNDS.imprisonedFists.id, // Sound of monk focusing energy
            impact: SKILL_SOUNDS.chainImpact.id, // Sound of chains binding enemies
            end: SKILL_SOUNDS.chainsBreak.id // Sound of chains breaking as effect ends
        }
    },
    {
        name: 'Bul Palm',
        description: 'Giant palm moving, damaging all enemies on the path.',
        type: 'projectile',
        get damage() {
            if (!this.variant) {
                return 200;
            }
            return 500;
        }, // Reduced from 100 for better balance
        get manaCost() {
            if (!this.variant) {
                return 50;
            }
            return 50;
        }, // Increased from 25 to match the power
        cooldown: 0.2, // Moderate cooldown
        range: 40, // Long range
        radius: 3, // Explosion radius
        // Rain variant configuration
        palmRainConfig: {
            palmCount: 20, // Number of palms to create
            palmDelay: 0.15, // Delay between palm creations in seconds
            fallSpeed: 25, // Speed at which palms fall
        },
        // Storm of Palms variant configuration
        stormOfPalmsConfig: {
            palmCount: 30, // Increased number of palms
            palmDelay: 0.12, // Faster palm creation
            fallSpeed: 30, // Faster falling speed
        },
        // Duration is calculated based on palmCount and palmDelay plus extra time for explosions
        get duration() { 
            if (this.variant === 'Storm of Palms' && this.stormOfPalmsConfig) {
                return 5 + (this.stormOfPalmsConfig.palmCount * this.stormOfPalmsConfig.palmDelay) + 3;
            } else if (this.palmRainConfig) {
                return (this.palmRainConfig.palmCount * this.palmRainConfig.palmDelay) + 2;
            } else {
                return 5; // Default duration if not using rain variant
            }
        },
        get color() { return SKILL_ICONS[this.name]?.color; }, // Green color
        get icon() { return SKILL_ICONS[this.name]?.emoji; }, // Leaf emoji as fallback
        sounds: {
            cast: SKILL_SOUNDS.explodingPalm.id, // Reusing sound temporarily
            impact: SKILL_SOUNDS.markApplied.id, // Reusing sound temporarily
            end: SKILL_SOUNDS.massiveExplosion.id // Reusing sound temporarily
        },
        explosionInterval: 0.1, // Time between explosions in seconds
        explosionDamageMultiplier: 0.5, // Damage multiplier for each explosion
        piercing: true, // Can pierce through enemies
        projectileSpeed: 10, // Speed of the projectile
        isCustomSkill: true,
    },
    {
        name: 'Bul Breath Of Heaven',
        description: 'Same like Breath of Heaven, which allows you to run faster, but x5 current effect, like cast 5 times continuously.',
        type: 'buff',
        damage: 5, // Low damage is appropriate for a utility skill
        healing: 20, // Increased from 10 to match the enhanced effect
        manaCost: 35, // Increased from 25 to match the enhanced effect
        cooldown: 0.2, // Moderate cooldown
        range: 0, // Self-cast
        radius: 5, // Large radius to affect multiple allies/enemies
        duration: 5, // Duration in seconds
        get color() { return SKILL_ICONS[this.name]?.color; }, // Green color
        get icon() { return SKILL_ICONS[this.name]?.emoji; }, // Leaf emoji as fallback
        sounds: {
            cast: SKILL_SOUNDS.breathOfHeaven.id, // Reusing Breath of Heaven sound
            impact: SKILL_SOUNDS.healingPulse.id, // Soft healing pulse sound
            end: SKILL_SOUNDS.divineEcho.id // Echoing divine sound as effect fades
        },
        speedBoostMultiplier: 0.6, // 10x speed boost (5x the normal 2x boost)
        speedBoostDuration: 5, // 10 seconds of speed boost
        isCustomSkill: true,
    },
    {
        name: 'Bul Shadow Clone',
        description: 'Creates multiple shadow clones of the monk in yellow theme color. These transparent clones automatically seek out enemies, attack them, and can absorb damage.',
        type: 'summon',
        damage: 25, // Moderate damage for each clone
        manaCost: 45, // Higher mana cost for powerful ability
        cooldown: 0.2, // Standard cooldown
        range: 0, // Centered on player
        radius: 5, // Large radius for clones to operate in
        duration: 20, // Duration in seconds
        get color() { return SKILL_ICONS["Shadow Allies"]?.color || "#ffdd00"; }, // Yellow theme color
        get icon() { return SKILL_ICONS["Shadow Allies"]?.emoji || "👥"; }, // Shadow emoji as fallback
        sounds: {
            cast: SKILL_SOUNDS.mysticAlly.id, // Mystical summoning sound
            impact: SKILL_SOUNDS.allySummonComplete.id, // Sound of clone materializing
            end: SKILL_SOUNDS.allyDismiss.id // Sound of clones disappearing
        },
        allyCount: 5, // Number of shadow clones to summon
        cloneHealth: 50, // Health points for each clone
        cloneAttackDamage: 15, // Attack damage for each clone
        cloneSpeed: 8, // Movement speed of clones
        cloneTransparency: 0.7, // Transparency level (0-1)
        cloneColor: "#ffdd00", // Yellow theme color
        autoTargetEnemies: true, // Clones automatically target enemies
        isCustomSkill: true,
    },
    // TODO: Add more skills here
];

// For backward compatibility, export a combined array of all skills
/** @type {SkillConfig[]} */
export const SKILLS = [...PRIMARY_ATTACKS, ...NORMAL_SKILLS];

/** @type {SkillConfig[]} */
export const BATTLE_SKILLS = [
    ...NORMAL_SKILLS.slice(0, 7), // First 7 normal skills
    PRIMARY_ATTACKS[0], // First primary skill
]