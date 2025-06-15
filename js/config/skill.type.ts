/**
 * Type definitions for skill configuration objects
 */

/**
 * Sound configuration for skills
 */
export interface SkillSounds {
  /** Sound played when the skill is cast */
  cast: string | null;
  /** Sound played when the skill impacts enemies */
  impact: string | null;
  /** Sound played when the skill effect ends */
  end: string | null;
}

/**
 * Skill types supported by the game
 */
export type SkillType = 
  | 'teleport'   // Teleport to a location
  | 'projectile' // Fires a projectile
  | 'wave'       // Creates a wave effect
  | 'buff'       // Applies a buff
  | 'heal'       // Heals the player or allies
  | 'ranged'     // Ranged attack
  | 'aoe'        // Area of effect
  | 'multi'      // Multiple attacks
  | 'summon'     // Summons allies
  | 'mark'       // Marks enemies
  | 'dash'       // Dash attack
  | 'control';   // Control effects

/**
 * Optional ground rectangle properties for skill collision detection
 */
export interface GroundRectangleProps {
  /** Whether to use the skill's radius for the rectangle width */
  useSkillRadiusForWidth?: boolean;
  /** Whether the length should increase dynamically along travel direction */
  dynamicLength?: boolean;
  /** Y-axis offset from terrain height */
  yOffset?: number;
}

/**
 * Skill configuration object
 * Used to define skills in the skills.js configuration file
 */
export interface SkillConfig {
  /** Name of the skill */
  name: string;
  /** Description of what the skill does */
  description: string;
  /** Type of skill effect */
  type: SkillType;
  /** Base damage of the skill */
  damage: number;
  /** Mana cost to use the skill */
  manaCost: number;
  /** Cooldown time in seconds before the skill can be used again */
  cooldown: number;
  /** Maximum range of the skill in game units */
  range: number;
  /** Radius of effect in game units */
  radius: number;
  /** Duration of the skill effect in seconds */
  duration: number;
  /** Color getter function that returns the skill's color from SKILL_ICONS */
  color: () => string;
  /** Icon getter function that returns the skill's emoji from SKILL_ICONS */
  icon: () => string;
  /** Sound configuration for the skill */
  sounds: SkillSounds;
  
  // Optional properties based on skill type
  /** Whether this is a primary attack that doesn't consume mana */
  primaryAttack?: boolean;
  /** Whether the projectile can pierce through enemies */
  piercing?: boolean;
  /** Whether the skill can knock back enemies */
  knockback?: boolean;
  /** Speed of the projectile in game units per second */
  projectileSpeed?: number;
  /** Whether the player should remain stationary when using this skill */
  stationaryAttack?: boolean;
  /** Number of hits for multi-hit skills */
  hits?: number;
  /** Amount of health restored for healing skills */
  healing?: number;
  /** Number of allies to summon for summon skills */
  allyCount?: number;
  /** Speed of the dash for dash skills */
  dashSpeed?: number;
  /** Whether the skill includes a vertical leap */
  verticalLeap?: boolean;
  /** Number of hits in a multi-hit sequence */
  multiHit?: number;
  /** Whether the skill has a wind visual effect */
  windEffect?: boolean;
  /** Speed of the kick for kick skills */
  kickSpeed?: number;
  /** Whether the skill immobilizes enemies */
  immobilize?: boolean;
  /** Speed at which the effect moves forward */
  moveSpeed?: number;
  /** Ground rectangle properties for collision detection */
  groundRectangle?: GroundRectangleProps;
  /** Whether to lock enemies during travel */
  lockEnemiesDuringTravel?: boolean;
  /** Duration of the lock effect in seconds */
  lockDuration?: number;
}

/**
 * Arrays of skill configurations exported from skills.js
 */
export interface SkillCollections {
  /** Primary attacks that don't consume mana */
  PRIMARY_ATTACKS: SkillConfig[];
  /** Normal skills that consume mana */
  NORMAL_SKILLS: SkillConfig[];
  /** Combined array of all skills */
  SKILLS: SkillConfig[];
  /** Skills available in battle */
  BATTLE_SKILLS: SkillConfig[];
}