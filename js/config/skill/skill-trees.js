import { applyBuffsToVariants } from '../../utils/SkillTreeUtils.js';

// Define the base skill trees
const BASE_SKILL_TREES = {
  "Breath of Heaven": {
    baseDescription:
      "A healing skill that restores health to the Monk and nearby allies.",
    variants: {
      "Circle of Life": {
        description: "Increases the healing radius and amount healed.",
        effects: ["Increased healing", "Extended radius"],
        unlockedBy: "Legendary item Circle of Life",
        cost: 5,
        requiredPoints: 0,
      },
      "Infused with Light": {
        description: "Grants a temporary damage boost to allies healed.",
        effects: ["Damage boost", "Area of effect"],
        unlockedBy: "Legendary item Infused Light",
        cost: 5,
        requiredPoints: 0,
      },
      "Radiant Breath": {
        description:
          "Adds a blinding effect to enemies within the healing area.",
        effects: ["Blind effect", "Area of effect"],
        unlockedBy: "Legendary item Radiant Breath",
        cost: 5,
        requiredPoints: 0,
      },
      "Soothing Mist": {
        description: "Heals over time instead of instantly.",
        effects: ["Healing over time", "Area of effect"],
        unlockedBy: "Legendary item Soothing Mist",
        cost: 5,
        requiredPoints: 0,
      },
      "Zephyr's Grace": {
        description: "Increases movement speed of allies healed.",
        effects: ["Movement speed increase", "Area of effect"],
        unlockedBy: "Legendary item Zephyr's Grace",
        cost: 5,
        requiredPoints: 0,
      },
    },
    buffs: {
      "Empowered Healing": {
        description: "Increases the healing amount by 15%.",
        effects: ["Increased healing"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases healing by 15%",
          "Increases healing by 30%",
          "Increases healing by 45%",
        ],
        requiredVariant: "any",
      },
      "Quick Recovery": {
        description: "Reduces the cooldown of Breath of Heaven by 1 second.",
        effects: ["Cooldown reduction"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Reduces cooldown by 1 second",
          "Reduces cooldown by 2 seconds",
          "Reduces cooldown by 3 seconds",
        ],
        requiredVariant: "any",
      },
      "Resilient Spirit": {
        description: "Grants a temporary shield to allies healed.",
        effects: ["Shield", "Damage absorption"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Shield absorbs 10% of max health",
          "Shield absorbs 20% of max health",
          "Shield absorbs 30% of max health",
        ],
        requiredVariant: "any",
      },
      "Healing Winds": {
        description: "Increases the healing radius by 20%.",
        effects: ["Extended radius"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases radius by 20%",
          "Increases radius by 40%",
          "Increases radius by 60%",
        ],
        requiredVariant: "any",
      },
    },
  },
  "Cyclone Strike": {
    baseDescription:
      "Generate a vortex of wind that pulls in enemies and deals damage.",
    variants: {
      "Eye of the Storm": {
        description:
          "Increases the radius of Cyclone Strike by 20%.",
        effects: ["Increased radius", "Area of effect"],
        unlockedBy: "Legendary off-hand Eye of the Storm",
        cost: 5,
        requiredPoints: 0,
      },
      "Path of the Storm": {
        description:
          "Cyclone Strike also temporarily decreases all damage you take by 20%.",
        effects: ["Damage reduction", "Area of effect"],
        unlockedBy: "Legendary legs Path of the Storm",
        cost: 5,
        requiredPoints: 0,
      },
      "Storm Spirit": {
        description:
          "Generates a powerful tornado that continually damages all nearby enemies.",
        effects: ["Continuous damage", "Area of effect"],
        unlockedBy: "Legendary chest armor Storm Spirit",
        cost: 5,
        requiredPoints: 0,
      },
      "Tempest's Heart": {
        description:
          "Turns the Monk into a vortex that pulls in enemies and then detonates, damaging and knocking away all nearby enemies.",
        effects: ["Knockback", "Area of effect"],
        unlockedBy: "Legendary chest armor Tempest's Heart",
        cost: 5,
        requiredPoints: 0,
      },
    },
    buffs: {
      "Boundless Breath": {
        description:
          "Cooldown reduced by 0.07 seconds or 1.6 energy recovered per yard moved.",
        effects: ["Cooldown reduction", "Energy recovery"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Cooldown reduced by 0.07s or 1.6 energy per yard",
          "Cooldown reduced by 0.14s or 3.2 energy per yard",
          "Cooldown reduced by 0.21s or 4.8 energy per yard",
        ],
        requiredVariant: "any",
      },
      "Eye of the Storm": {
        description: "Increases Cyclone Strike radius by 29.0%.",
        effects: ["Increased radius"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases radius by 29%",
          "Increases radius by 58%",
          "Increases radius by 87%",
        ],
        requiredVariant: "any",
      },
      "Terminal Pace": {
        description:
          "Damage increased by 1.9% for every 1% increase in Movement Speed, up to 57%.",
        effects: ["Damage increase"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Damage increased by 1.9% per 1% Movement Speed",
          "Damage increased by 3.8% per 1% Movement Speed",
          "Damage increased by 5.7% per 1% Movement Speed",
        ],
        requiredVariant: "any",
      },
      Awakened: {
        description: "Cyclone Strike damage increased by 10%.",
        effects: ["Damage increase"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Damage increased by 10%",
          "Damage increased by 20%",
          "Damage increased by 30%",
        ],
        requiredVariant: "any",
      },
    },
  },
  "Exploding Palm": {
    baseDescription:
      "A skill that marks an enemy for death, causing them to explode upon death and deal damage to nearby enemies.",
    variants: {
      "Crippling Insight": {
        description:
          "Maximum charges of Exploding Palm increased by 1.",
        effects: ["Additional charge", "Area of effect"],
        unlockedBy: "Legendary head Crippling Insight",
        cost: 5,
        requiredPoints: 0,
      },
      "Reaching Rebuke": {
        description:
          "Exploding Palm now launches you at a location and strikes that area with a giant palm as you land, damaging all nearby enemies.",
        effects: ["Movement ability", "Area of effect"],
        unlockedBy: "Legendary off-hand Reaching Rebuke",
        cost: 5,
        requiredPoints: 0,
      },
      "Scolding Storm": {
        description:
          "Exploding Palm is now icy and inflicts Chill on enemies.",
        effects: ["Chill effect", "Area of effect"],
        unlockedBy: "Legendary off-hand Scolding Storm",
        cost: 5,
        requiredPoints: 0,
      },
      "Breath of Incense": {
        description:
          "Seven-Sided Strike can now trigger the Exploding Palm explosion when it kills Bleeding enemies.",
        effects: ["Skill synergy", "Area of effect"],
        unlockedBy: "Legendary chest Breath of Incense",
        cost: 5,
        requiredPoints: 0,
      },
      "Path of the Present": {
        description:
          "Exploding Palm now throws a giant palm in a direction, damaging and Stunning all enemies in its path.",
        effects: ["Stun effect", "Area of effect"],
        unlockedBy: "Legendary weapon Path of the Present",
        cost: 5,
        requiredPoints: 0,
      },
    },
    buffs: {
      "Enhanced Detonation": {
        description: "Increases the explosion damage by 20%.",
        effects: ["Increased damage"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases explosion damage by 20%",
          "Increases explosion damage by 40%",
          "Increases explosion damage by 60%",
        ],
        requiredVariant: "any",
      },
      "Rapid Palm": {
        description: "Reduces the cooldown of Exploding Palm by 1 second.",
        effects: ["Cooldown reduction"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Reduces cooldown by 1 second",
          "Reduces cooldown by 2 seconds",
          "Reduces cooldown by 3 seconds",
        ],
        requiredVariant: "any",
      },
      "Widened Blast": {
        description: "Increases the explosion radius by 25%.",
        effects: ["Extended radius"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases explosion radius by 25%",
          "Increases explosion radius by 50%",
          "Increases explosion radius by 75%",
        ],
        requiredVariant: "any",
      },
      "Lingering Pain": {
        description: "Extends the duration of the bleed effect by 2 seconds.",
        effects: ["Extended duration"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Extends bleed duration by 2 seconds",
          "Extends bleed duration by 4 seconds",
          "Extends bleed duration by 6 seconds",
        ],
        requiredVariant: "any",
      },
    },
  },
  "Flying Dragon": {
    baseDescription:
      "A powerful attack that launches the Monk into the air, striking enemies with a flurry of kicks.",
    variants: {
      "Dragon's Flight": {
        description:
          "Increases the distance and speed of the flight, allowing you to cover more ground.",
        effects: ["Increased distance", "Increased speed"],
        unlockedBy: "Legendary item Dragon's Flight",
        cost: 5,
        requiredPoints: 0,
      },
      "Inferno Dragon": {
        description:
          "Adds fire damage to each kick, burning enemies over time.",
        effects: ["Fire damage", "Damage over time"],
        unlockedBy: "Legendary item Inferno Dragon",
        cost: 5,
        requiredPoints: 0,
      },
      "Thunder Dragon": {
        description: "Each kick releases a shockwave that stuns enemies.",
        effects: ["Stun effect", "Area of effect"],
        unlockedBy: "Legendary item Thunder Dragon",
        cost: 5,
        requiredPoints: 0,
      },
      "Gale Dragon": {
        description:
          "Creates a wind barrier that deflects projectiles while flying.",
        effects: ["Projectile deflection", "Increased defense"],
        unlockedBy: "Legendary item Gale Dragon",
        cost: 5,
        requiredPoints: 0,
      },
      "Shadow Dragon": {
        description:
          "Leaves behind a shadow that mimics your attacks for a short duration.",
        effects: ["Shadow clone", "Increased damage"],
        unlockedBy: "Legendary item Shadow Dragon",
        cost: 5,
        requiredPoints: 0,
      },
    },
    buffs: {
      "Extended Flight": {
        description: "Increases the duration of the flight by 2 seconds.",
        effects: ["Extended duration"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases flight duration by 2 seconds",
          "Increases flight duration by 4 seconds",
          "Increases flight duration by 6 seconds",
        ],
        requiredVariant: "any",
      },
      "Empowered Kicks": {
        description: "Increases the damage of each kick by 15%.",
        effects: ["Increased damage"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases kick damage by 15%",
          "Increases kick damage by 30%",
          "Increases kick damage by 45%",
        ],
        requiredVariant: "any",
      },
      "Swift Descent": {
        description: "Reduces the cooldown of Flying Dragon by 1 second.",
        effects: ["Cooldown reduction"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Reduces cooldown by 1 second",
          "Reduces cooldown by 2 seconds",
          "Reduces cooldown by 3 seconds",
        ],
        requiredVariant: "any",
      },
      "Aerial Mastery": {
        description: "Increases the Monk's evasion while airborne.",
        effects: ["Increased evasion"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases evasion by 10%",
          "Increases evasion by 20%",
          "Increases evasion by 30%",
        ],
        requiredVariant: "any",
      },
    },
  },
  "Flying Kick": {
    baseDescription:
      "A swift kick that propels the Monk forward, dealing damage to enemies in its path.",
    variants: {
      "Mantle of the Crane": {
        description:
          "Flying Kick range increased by 20%.",
        effects: ["Increased range", "Area of effect"],
        unlockedBy: "Legendary shoulder Mantle of the Crane",
        cost: 5,
        requiredPoints: 0,
      },
      "Tiger's Flight": {
        description:
          "Flying Kick now generates a flaming tornado that damages enemies in its path.",
        effects: ["Fire damage", "Area of effect"],
        unlockedBy: "Legendary legs Tiger's Flight",
        cost: 5,
        requiredPoints: 0,
      },
      "Grace's Bounty": {
        description:
          "Flying Kick becomes Spinning Kick, damaging all nearby enemies.",
        effects: ["Area damage", "Transformation"],
        unlockedBy: "Legendary legs Grace's Bounty",
        cost: 5,
        requiredPoints: 0,
      },
      "Momentum's Flow": {
        description:
          "Flying Kick now unleashes a series of kicks at enemies in a direction, with the final kick knocking enemies away.",
        effects: ["Multiple hits", "Knockback"],
        unlockedBy: "Legendary legs Momentum's Flow",
        cost: 5,
        requiredPoints: 0,
      },
      "Spokes of the Wheel": {
        description:
          "Flying Kick also temporarily increases all damage you deal by 10%.",
        effects: ["Damage boost", "Temporary buff"],
        unlockedBy: "Legendary weapon Spokes of the Wheel",
        cost: 5,
        requiredPoints: 0,
      },
    },
    buffs: {
      "Extended Reach": {
        description: "Increases the range of Flying Kick by 20%.",
        effects: ["Increased range"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases range by 20%",
          "Increases range by 40%",
          "Increases range by 60%",
        ],
        requiredVariant: "any",
      },
      "Empowered Impact": {
        description: "Increases the damage of Flying Kick by 15%.",
        effects: ["Increased damage"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases damage by 15%",
          "Increases damage by 30%",
          "Increases damage by 45%",
        ],
        requiredVariant: "any",
      },
      "Swift Recovery": {
        description: "Reduces the cooldown of Flying Kick by 1 second.",
        effects: ["Cooldown reduction"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Reduces cooldown by 1 second",
          "Reduces cooldown by 2 seconds",
          "Reduces cooldown by 3 seconds",
        ],
        requiredVariant: "any",
      },
      "Aerial Agility": {
        description: "Increases evasion while performing Flying Kick.",
        effects: ["Increased evasion"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases evasion by 10%",
          "Increases evasion by 20%",
          "Increases evasion by 30%",
        ],
        requiredVariant: "any",
      },
    },
  },
  "Imprisoned Fists": {
    baseDescription:
      "A powerful strike that locks enemies in place, preventing them from moving.",
    variants: {
      "Frozen Shackles": {
        description:
          "Imprisoned Fists now freezes enemies, dealing cold damage over time.",
        effects: ["Freeze effect", "Cold damage"],
        unlockedBy: "Legendary item Frozen Shackles",
      },
      "Fiery Chains": {
        description:
          "Adds fire damage to the strike, burning enemies over time.",
        effects: ["Fire damage", "Damage over time"],
        unlockedBy: "Legendary item Fiery Chains",
      },
      "Thunderous Grip": {
        description:
          "Each strike releases a shockwave that stuns nearby enemies.",
        effects: ["Stun effect", "Area of effect"],
        unlockedBy: "Legendary item Thunderous Grip",
      },
      "Shadow Bind": {
        description:
          "Creates shadow tendrils that immobilize enemies for a longer duration.",
        effects: ["Extended immobilization", "Shadow damage"],
        unlockedBy: "Legendary item Shadow Bind",
      },
      "Gale Chains": {
        description:
          "Increases the range and speed of the strike, allowing for rapid engagement.",
        effects: ["Increased range", "Increased speed"],
        unlockedBy: "Legendary item Gale Chains",
      },
    },
    buffs: {
      "Extended Lock": {
        description:
          "Increases the duration of the immobilization effect by 20%.",
        effects: ["Extended immobilization"],
      },
      "Empowered Strike": {
        description: "Increases the damage of Imprisoned Fists by 15%.",
        effects: ["Increased damage"],
      },
      "Swift Recovery": {
        description: "Reduces the cooldown of Imprisoned Fists by 1 second.",
        effects: ["Cooldown reduction"],
      },
      "Aerial Agility": {
        description: "Increases evasion while performing Imprisoned Fists.",
        effects: ["Increased evasion"],
      },
    },
  },
  "Inner Sanctuary": {
    baseDescription:
      "Create a circular sanctuary on the ground that reduces all damage taken by you and your allies within the area.",
    variants: {
      "Sanctified Ground": {
        description:
          "The sanctuary also heals allies over time while they remain within its bounds.",
        effects: ["Healing over time"],
        unlockedBy: "Legendary item Healing Circle",
      },
      "Forbidden Palace": {
        description:
          "Enemies within the sanctuary have their movement speed reduced.",
        effects: ["Enemy movement speed reduction"],
        unlockedBy: "Legendary item Palace of Restraint",
      },
      "Safe Haven": {
        description:
          "Increases the duration of the sanctuary and provides a shield to allies when they enter.",
        effects: ["Increased duration", "Shield on entry"],
        unlockedBy: "Legendary item Guardian's Refuge",
      },
      "Temple of Protection": {
        description: "Increases the damage reduction effect of the sanctuary.",
        effects: ["Increased damage reduction"],
        unlockedBy: "Legendary item Protector's Temple",
      },
      "Circle of Wrath": {
        description: "Enemies within the sanctuary take damage over time.",
        effects: ["Damage over time to enemies"],
        unlockedBy: "Legendary item Wrathful Circle",
      },
    },
    buffs: {
      "Extended Sanctuary": {
        description: "Increases the radius of Inner Sanctuary by 20%.",
        effects: ["Increased radius"],
      },
      "Empowered Sanctuary": {
        description:
          "Increases the damage reduction effect by an additional 10%.",
        effects: ["Additional damage reduction"],
      },
      "Quick Setup": {
        description: "Reduces the cooldown of Inner Sanctuary by 2 seconds.",
        effects: ["Cooldown reduction"],
      },
      "Resilient Barrier": {
        description:
          "Increases the duration of the shield provided by Safe Haven.",
        effects: ["Increased shield duration"],
      },
    },
  },
  "Mystic Allies": {
    baseDescription:
      "Summon two spirit allies to fight by your side for a short duration, dealing damage to enemies.",
    variants: {
      "Fire Allies": {
        description:
          "Summon fiery spirit allies that deal fire damage and have a chance to burn enemies over time.",
        effects: ["Fire damage", "Burning effect"],
        unlockedBy: "Legendary item Ember Spirits",
      },
      "Water Allies": {
        description:
          "Summon water spirit allies that heal you and your allies over time.",
        effects: ["Healing effect"],
        unlockedBy: "Legendary item Tidal Companions",
      },
      "Earth Allies": {
        description:
          "Summon earth spirit allies that increase your defense and reduce incoming damage.",
        effects: ["Increased defense", "Damage reduction"],
        unlockedBy: "Legendary item Stone Guardians",
      },
      "Air Allies": {
        description:
          "Summon air spirit allies that increase your movement speed and attack speed.",
        effects: ["Increased movement speed", "Increased attack speed"],
        unlockedBy: "Legendary item Wind Walkers",
      },
      "Shadow Allies": {
        description:
          "Summon shadow spirit allies that deal increased damage to enemies affected by crowd control effects.",
        effects: ["Increased damage to CC'd enemies"],
        unlockedBy: "Legendary item Night Stalkers",
      },
    },
    buffs: {
      "Extended Duration": {
        description: "Increases the duration of Mystic Allies by 20%.",
        effects: ["Increased duration"],
      },
      "Empowered Allies": {
        description: "Increases the damage of Mystic Allies by 15%.",
        effects: ["Increased damage"],
      },
      "Quick Summon": {
        description: "Reduces the cooldown of Mystic Allies by 1 second.",
        effects: ["Cooldown reduction"],
      },
      "Resilient Spirits": {
        description: "Increases the health of Mystic Allies by 25%.",
        effects: ["Increased health"],
      },
    },
  },
  "Mystic Strike": {
    baseDescription:
      "Dash forward and leave a spirit behind that returns to you, dealing damage.",
    variants: {
      "Spirit's Reach": {
        description: "Increases the dash distance and damage.",
        effects: ["Increased distance", "Increased damage"],
        unlockedBy: "Legendary item Spirit's Extension",
      },
      "Phantom Strike": {
        description: "Leaves behind a decoy that explodes after a delay.",
        effects: ["Decoy", "Explosive damage"],
        unlockedBy: "Legendary item Phantom's Echo",
      },
      "Ethereal Embrace": {
        description: "Grants a shield when the spirit returns.",
        effects: ["Shield", "Damage absorption"],
        unlockedBy: "Legendary item Ethereal Guard",
      },
      "Shadow Step": {
        description: "Allows you to teleport to the spirit's location.",
        effects: ["Teleportation", "Increased mobility"],
        unlockedBy: "Legendary item Shadow Walker",
      },
      "Soul Reaver": {
        description: "Drains life from enemies as the spirit returns.",
        effects: ["Life drain", "Area of effect"],
        unlockedBy: "Legendary item Reaver's Grasp",
      },
    },
    buffs: {
      "Quickened Strikes": {
        description: "Reduces the cooldown of Mystic Strike by 1 second.",
        effects: ["Cooldown reduction"],
      },
      "Empowered Spirit": {
        description:
          "Increases the damage dealt by the returning spirit by 15%.",
        effects: ["Increased damage"],
      },
      "Lingering Presence": {
        description:
          "Extends the duration of the spirit's presence by 3 seconds.",
        effects: ["Extended duration"],
      },
      "Resilient Dash": {
        description: "Increases your defense while dashing with Mystic Strike.",
        effects: ["Increased defense"],
      },
    },
  },
  "Seven-Sided Strike": {
    baseDescription:
      "Dash rapidly between nearby enemies, striking them for multiple hits.",
    variants: {
      "Blazing Fists": {
        description:
          "Each strike ignites enemies, dealing fire damage over time.",
        effects: ["Fire damage", "Damage over time"],
        unlockedBy: "Legendary item Inferno Knuckles",
      },
      "Frozen Assault": {
        description: "Each strike has a chance to freeze enemies.",
        effects: ["Freeze effect", "Crowd control"],
        unlockedBy: "Legendary item Glacial Fists",
      },
      Thunderclap: {
        description: "Each strike releases a shockwave, dealing area damage.",
        effects: ["Area damage", "Shockwave"],
        unlockedBy: "Legendary item Thunderous Grasp",
      },
      "Phantom Echo": {
        description: "Creates an echo that repeats the strikes after a delay.",
        effects: ["Echo strikes", "Delayed damage"],
        unlockedBy: "Legendary item Echoing Spirit",
      },
      "Celestial Impact": {
        description: "Increases the number of strikes and damage.",
        effects: ["Increased strikes", "Increased damage"],
        unlockedBy: "Legendary item Celestial Gauntlets",
      },
    },
    buffs: {
      "Rapid Strikes": {
        description: "Reduces the cooldown of Seven-Sided Strike by 2 seconds.",
        effects: ["Cooldown reduction"],
      },
      "Empowered Blows": {
        description: "Increases the damage of each strike by 20%.",
        effects: ["Increased damage"],
      },
      "Lingering Shadows": {
        description: "Extends the duration of the strike sequence by 1 second.",
        effects: ["Extended duration"],
      },
      "Resilient Assault": {
        description: "Increases your defense during the strike sequence.",
        effects: ["Increased defense"],
      },
    },
  },
  "Shield of Zen": {
    baseDescription:
      "Create a protective shield that absorbs damage and grants immunity to control impairing effects.",
    variants: {
      "Radiant Barrier": {
        description:
          "The shield emits a healing aura, restoring health to nearby allies.",
        effects: ["Healing aura", "Health restoration"],
        unlockedBy: "Legendary item Luminous Guard",
      },
      "Reflective Shield": {
        description: "Reflects a portion of absorbed damage back to attackers.",
        effects: ["Damage reflection"],
        unlockedBy: "Legendary item Mirror Plate",
      },
      "Fortified Wall": {
        description: "Increases the shield's absorption capacity and duration.",
        effects: ["Increased absorption", "Extended duration"],
        unlockedBy: "Legendary item Bastion's Embrace",
      },
      "Mystic Veil": {
        description:
          "Grants invisibility to the Monk while the shield is active.",
        effects: ["Invisibility"],
        unlockedBy: "Legendary item Veil of Shadows",
      },
      "Zen's Retribution": {
        description:
          "Upon expiration, the shield explodes, dealing damage to nearby enemies.",
        effects: ["Explosive damage"],
        unlockedBy: "Legendary item Retribution's End",
      },
    },
    buffs: {
      "Harmonious Defense": {
        description: "Reduces the cooldown of Shield of Zen by 2 seconds.",
        effects: ["Cooldown reduction"],
      },
      "Empowered Shielding": {
        description: "Increases the damage absorption of the shield by 25%.",
        effects: ["Increased absorption"],
      },
      "Lingering Protection": {
        description: "Extends the duration of the shield by 1 second.",
        effects: ["Extended duration"],
      },
      "Resilient Guard": {
        description: "Increases your defense while the shield is active.",
        effects: ["Increased defense"],
      },
    },
  },
  "Wave of Light": {
    baseDescription:
      "Unleash a wave of energy that crushes enemies in its path, dealing massive damage.",
    variants: {
      "Crashing Wave": {
        description:
          "The wave travels further and deals increased damage to distant enemies.",
        effects: ["Extended range", "Increased damage"],
        unlockedBy: "Legendary item Ocean's Fury",
      },
      "Blinding Light": {
        description:
          "Enemies hit by the wave are blinded for a short duration.",
        effects: ["Blinding effect"],
        unlockedBy: "Legendary item Radiant Dawn",
      },
      "Molten Wave": {
        description:
          "The wave leaves a trail of fire, burning enemies over time.",
        effects: ["Fire damage over time"],
        unlockedBy: "Legendary item Ember's Wrath",
      },
      "Thunderous Wave": {
        description:
          "The wave emits a thunderous sound, stunning enemies briefly.",
        effects: ["Stunning effect"],
        unlockedBy: "Legendary item Thunderclap",
      },
      "Healing Wave": {
        description:
          "Allies hit by the wave are healed for a portion of the damage dealt.",
        effects: ["Healing effect"],
        unlockedBy: "Legendary item Light's Embrace",
      },
    },
    buffs: {
      "Focused Energy": {
        description: "Reduces the energy cost of Wave of Light by 20%.",
        effects: ["Reduced energy cost"],
      },
      "Amplified Power": {
        description: "Increases the damage of Wave of Light by 15%.",
        effects: ["Increased damage"],
      },
      "Swift Wave": {
        description: "Reduces the cooldown of Wave of Light by 1 second.",
        effects: ["Cooldown reduction"],
      },
      "Resonating Echo": {
        description:
          "Wave of Light has a chance to echo, casting a second wave.",
        effects: ["Chance for additional wave"],
      },
    },
  },
  "Wave Strike": {
    baseDescription:
      "Unleash a powerful wave of energy that travels forward, damaging all enemies in its path.",
    variants: {
      "Tidal Force": {
        description:
          "The wave travels further and deals increased damage to enemies at the end of its path.",
        effects: ["Extended range", "Increased end damage"],
        unlockedBy: "Legendary item Ocean's Might",
      },
      "Shocking Wave": {
        description:
          "Enemies hit by the wave are electrified, taking additional lightning damage over time.",
        effects: ["Lightning damage over time"],
        unlockedBy: "Legendary item Storm Surge",
      },
      "Freezing Wave": {
        description:
          "The wave chills enemies, reducing their movement speed for a short duration.",
        effects: ["Chilling effect", "Movement speed reduction"],
        unlockedBy: "Legendary item Frostbite",
      },
      "Explosive Wave": {
        description:
          "The wave explodes on impact, dealing area damage to nearby enemies.",
        effects: ["Area damage on impact"],
        unlockedBy: "Legendary item Detonation Core",
      },
      "Healing Surge": {
        description:
          "Allies hit by the wave are healed for a portion of the damage dealt.",
        effects: ["Healing effect"],
        unlockedBy: "Legendary item Life's Flow",
      },
    },
    buffs: {
      "Energy Efficiency": {
        description: "Reduces the energy cost of Wave Strike by 20%.",
        effects: ["Reduced energy cost"],
      },
      "Power Surge": {
        description: "Increases the damage of Wave Strike by 15%.",
        effects: ["Increased damage"],
      },
      "Rapid Waves": {
        description: "Reduces the cooldown of Wave Strike by 1 second.",
        effects: ["Cooldown reduction"],
      },
      "Echoing Waves": {
        description: "Wave Strike has a chance to cast an additional wave.",
        effects: ["Chance for additional wave"],
      },
    },
  },
  "Bul Palm": {
    baseDescription:
      "Giant palm moving, damaging all enemies on the path.",
    variants: {
      "Palm Rain": {
        description: "Summons 10 giant palms from the sky that crash down on enemies in an area.",
        effects: ["Multiple palms", "Area of effect", "Increased damage"],
        unlockedBy: "Legendary gloves Hand of the Heavens",
        cost: 5,
        requiredPoints: 0,
      },
      "Palm Cross": {
        description: "Summons 4 giant palms in a cross pattern that fall simultaneously and cause a massive explosion.",
        effects: ["Cross pattern", "Giant palms", "Massive explosion"],
        unlockedBy: "Legendary bracers Cross of the Heavens",
        cost: 5,
        requiredPoints: 0,
      },
      "Storm of Palms": {
        description: "Summons a storm of giant palms that follow you and crash down on enemies in your path.",
        effects: ["Follows hero", "Increased palm count", "Extended duration"],
        unlockedBy: "Legendary amulet Storm Caller's Pendant",
        cost: 5,
        requiredPoints: 0,
      }
    },
    buffs: {
      "Palm Mastery": {
        description: "Increases the damage of Bul Palm by 15%.",
        effects: ["Increased damage"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases damage by 15%",
          "Increases damage by 30%",
          "Increases damage by 45%",
        ],
        requiredVariant: "any",
      },
      "Swift Palms": {
        description: "Reduces the cooldown of Bul Palm by 0.5 seconds.",
        effects: ["Cooldown reduction"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Reduces cooldown by 0.5 seconds",
          "Reduces cooldown by 1.0 seconds",
          "Reduces cooldown by 1.5 seconds",
        ],
        requiredVariant: "any",
      },
      "Widened Impact": {
        description: "Increases the explosion radius by 20%.",
        effects: ["Extended radius"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Increases explosion radius by 20%",
          "Increases explosion radius by 40%",
          "Increases explosion radius by 60%",
        ],
        requiredVariant: "any",
      },
      "Empowered Palms": {
        description: "Palm Rain variant summons 2 additional palms.",
        effects: ["Additional palms"],
        cost: 5,
        maxLevel: 3,
        levelBonuses: [
          "Summons 2 additional palms",
          "Summons 4 additional palms",
          "Summons 6 additional palms",
        ],
        requiredVariant: "Palm Rain",
      },
    },
  },
  "Bul Breath Of Heaven": {
    baseDescription:
      "Same like Breath of Heaven, which allows you to run faster, but x5 current effect, like cast 5 times continuously.",
    variants: {},
    buffs: {},
  },
  "Bul Shadow Clone": {
    baseDescription: "Creates multiple shadow clones of the monk in yellow theme color. These transparent clones automatically seek out enemies, attack them, and can absorb damage.",
    variants: {},
    buffs: {},
  }
};

// Apply buffs to variants by reference
applyBuffsToVariants(BASE_SKILL_TREES);

// Export the modified skill trees
export const SKILL_TREES = BASE_SKILL_TREES;
