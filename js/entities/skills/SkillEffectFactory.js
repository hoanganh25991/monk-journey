import { SkillEffect } from './SkillEffect.js';
import { WaveStrikeEffect } from './WaveStrikeEffect.js';
import { CycloneStrikeEffect } from './CycloneStrikeEffect.js';
import { SevenSidedStrikeEffect } from './SevenSidedStrikeEffect.js';
import { FistOfThunderEffect } from './FistOfThunderEffect.js';
import { InnerSanctuaryEffect } from './InnerSanctuaryEffect.js';
import { WaveOfLightEffect } from './WaveOfLightEffect.js';
import { MysticAllyEffect } from './MysticAllyEffect.js';
import { ExplodingPalmEffect } from './ExplodingPalmEffect.js';
import { ShieldOfZenEffect } from './ShieldOfZenEffect.js';
import { BreathOfHeavenEffect } from './BreathOfHeavenEffect.js';
import { FlyingDragonEffect } from './FlyingDragonEffect.js';
import { FlyingKickEffect } from './FlyingKickEffect.js';
import { DeadlyReachEffect } from './DeadlyReachEffect.js';
import { ImprisonedFistsEffect } from './ImprisonedFistsEffect.js';
import { BulPalmEffect } from './BulPalmEffect.js';
import { BulBreathOfHeavenEffect } from './BulBreathOfHeavenEffect.js';
import { BulShadowCloneEffect } from './BulShadowCloneEffect.js';

// Import Breath of Heaven variant effects
import { CircleOfLifeEffect } from './variants/BreathOfHeaven/CircleOfLifeEffect.js';
import { InfusedWithLightEffect } from './variants/BreathOfHeaven/InfusedWithLightEffect.js';
import { RadiantBreathEffect } from './variants/BreathOfHeaven/RadiantBreathEffect.js';
import { SoothingMistEffect } from './variants/BreathOfHeaven/SoothingMistEffect.js';
import { ZephyrsGraceEffect } from './variants/BreathOfHeaven/ZephyrsGraceEffect.js';

// Import Cyclone Strike variant effects
import { EyeOfTheStormEffect } from './variants/CycloneStrike/EyeOfTheStormEffect.js';
import { PathOfTheStormEffect } from './variants/CycloneStrike/PathOfTheStormEffect.js';
import { StormSpiritEffect } from './variants/CycloneStrike/StormSpiritEffect.js';
import { TempestsHeartEffect } from './variants/CycloneStrike/TempestsHeartEffect.js';

// Import Exploding Palm variant effects
import { CripplingInsightEffect } from './variants/ExplodingPalm/CripplingInsightEffect.js';
import { ReachingRebukeEffect } from './variants/ExplodingPalm/ReachingRebukeEffect.js';
import { ScoldingStormEffect } from './variants/ExplodingPalm/ScoldingStormEffect.js';
import { BreathOfIncenseEffect } from './variants/ExplodingPalm/BreathOfIncenseEffect.js';
import { PathOfThePresentEffect } from './variants/ExplodingPalm/PathOfThePresentEffect.js';

// Import Flying Dragon variant effects
import { ShadowDragonEffect } from './variants/FlyingDragon/ShadowDragonEffect.js';
import { DragonFlightEffect } from './variants/FlyingDragon/DragonFlightEffect.js';
import { InfernoDragonEffect } from './variants/FlyingDragon/InfernoDragonEffect.js';
import { ThunderDragonEffect } from './variants/FlyingDragon/ThunderDragonEffect.js';
import { GaleDragonEffect } from './variants/FlyingDragon/GaleDragonEffect.js';

// Import Flying Kick variant effects
import { MantleOfTheCraneEffect } from './variants/FlyingKick/MantleOfTheCraneEffect.js';
import { TigersFlightEffect } from './variants/FlyingKick/TigersFlightEffect.js';
import { GracesBountyEffect } from './variants/FlyingKick/GracesBountyEffect.js';
import { MomentumFlowEffect } from './variants/FlyingKick/MomentumFlowEffect.js';
import { SpokesOfTheWheelEffect } from './variants/FlyingKick/SpokesOfTheWheelEffect.js';

// Import Inner Sanctuary variant effects
import { CircleOfWrathEffect } from './variants/InnerSanctuary/CircleOfWrathEffect.js';
import { SanctifiedGroundEffect } from './variants/InnerSanctuary/SanctifiedGroundEffect.js';
import { SafeHavenEffect } from './variants/InnerSanctuary/SafeHavenEffect.js';
import { TempleOfProtectionEffect } from './variants/InnerSanctuary/TempleOfProtectionEffect.js';
import { ForbiddenPalaceEffect } from './variants/InnerSanctuary/ForbiddenPalaceEffect.js';

// Import Mystic Allies variant effects
import { FireAlliesEffect } from './variants/MysticAllies/FireAlliesEffect.js';
import { WaterAlliesEffect } from './variants/MysticAllies/WaterAlliesEffect.js';

// Import Imprisoned Fists variant effects
import { ThunderousGripEffect } from './variants/ImprisonedFists/ThunderousGripEffect.js';
import { FrozenShacklesEffect } from './variants/ImprisonedFists/FrozenShacklesEffect.js';
import { ShadowBindEffect } from './variants/ImprisonedFists/ShadowBindEffect.js';
import { GaleChainsEffect } from './variants/ImprisonedFists/GaleChainsEffect.js';
import { FieryChainsEffect } from './variants/ImprisonedFists/FieryChainsEffect.js';

// Import Wave Strike variant effects
import { TidalWaveEffect } from './variants/WaveStrike/TidalWaveEffect.js';
import { ThunderWaveEffect } from './variants/WaveStrike/ThunderWaveEffect.js';
import { FrozenWaveEffect } from './variants/WaveStrike/FrozenWaveEffect.js';

// Import Seven-Sided Strike variant effects
import { ShadowAssaultEffect } from './variants/SevenSidedStrike/ShadowAssaultEffect.js';
import { SustainedAssaultEffect } from './variants/SevenSidedStrike/SustainedAssaultEffect.js';
import { FistOfFuryEffect } from './variants/SevenSidedStrike/FistOfFuryEffect.js';
import { PandemoniumEffect } from './variants/SevenSidedStrike/PandemoniumEffect.js';
import { InnerPeaceEffect } from './variants/SevenSidedStrike/InnerPeaceEffect.js';

// Import Shield of Zen variant effects
import { TranscendenceEffect } from './variants/ShieldOfZen/TranscendenceEffect.js';
import { RetributionAuraEffect } from './variants/ShieldOfZen/RetributionAuraEffect.js';
import { SpiritualProtectionEffect } from './variants/ShieldOfZen/SpiritualProtectionEffect.js';
import { DiamondAuraEffect } from './variants/ShieldOfZen/DiamondAuraEffect.js';

// Import Wave of Light variant effects
import { ExplosiveLightEffect } from './variants/WaveOfLight/ExplosiveLightEffect.js';
import { LightningBellEffect } from './variants/WaveOfLight/LightningBellEffect.js';
import { PillarOfTheLightEffect } from './variants/WaveOfLight/PillarOfTheLightEffect.js';
import { WallOfLightEffect } from './variants/WaveOfLight/WallOfLightEffect.js';

// Import Bul Palm variant effects
import { BulPalmRainEffect } from './variants/BulPalm/BulPalmRainEffect.js';
import { BulPalmCrossEffect } from './variants/BulPalm/BulPalmCrossEffect.js';
import { StormOfPalmsEffect } from './variants/BulPalm/StormOfPalmsEffect.js';

/**
 * Factory class for creating skill effects
 */
export class SkillEffectFactory {
    // Flag to track initialization status
    static initialized = false;
    
    /**
     * Initialize the factory by preloading necessary assets
     * This should be called during game initialization to avoid loading delays during gameplay
     * @returns {Promise} - Promise that resolves when initialization is complete
     */
    static async initialize() {
        if (this.initialized) {
            console.debug('SkillEffectFactory already initialized');
            return;
        }
        
        console.debug('Initializing SkillEffectFactory...');
        
        // Preload models for effects that need them
        try {
            // Preload Buddha model for Shield of Zen effect
            await ShieldOfZenEffect.preloadModel();
            
            // Add other model preloading here as needed
            await FlyingDragonEffect.preloadModel();
            
            this.initialized = true;
            console.debug('SkillEffectFactory initialization complete');
        } catch (error) {
            console.error('Error initializing SkillEffectFactory:', error);
            // Continue even if preloading fails - effects will use fallbacks
        }
    }
    
    /**
     * Create a skill effect based on the skill name and variant
     * @param {Skill} skill - The skill to create an effect for
     * @returns {SkillEffect} - The created skill effect
     */
    static createEffect(skill) {
        console.debug(`SkillEffectFactory.createEffect called for skill: ${skill.name}, type: ${skill.type}, variant: ${skill.variant || 'none'}`);
        
        let effect;
        
        // First check if there's a variant-specific effect class
        if (skill.variant) {
            // Try to create a variant-specific effect
            effect = this.createVariantEffect(skill);
            
            // If a variant-specific effect was created, return it
            if (effect) {
                console.debug(`Created variant-specific effect for ${skill.name} (${skill.variant})`);
                return effect;
            }
            
            // Otherwise, fall back to the base effect
            console.debug(`No variant-specific effect found for ${skill.name} (${skill.variant}), using base effect`);
        }
        
        // Create the base effect for the skill
        switch (skill.name) {
            case 'Wave Strike':
                console.debug(`Creating WaveStrikeEffect for ${skill.name}`);
                effect = new WaveStrikeEffect(skill);
                break;
            case 'Cyclone Strike':
                console.debug(`Creating CycloneStrikeEffect for ${skill.name}`);
                effect = new CycloneStrikeEffect(skill);
                break;
            case 'Seven-Sided Strike':
                console.debug(`Creating SevenSidedStrikeEffect for ${skill.name}`);
                effect = new SevenSidedStrikeEffect(skill);
                break;
            case 'Fist of Thunder':
                console.debug(`Creating FistOfThunderEffect for ${skill.name}`);
                effect = new FistOfThunderEffect(skill);
                break;
            case 'Inner Sanctuary':
                console.debug(`Creating InnerSanctuaryEffect for ${skill.name}`);
                effect = new InnerSanctuaryEffect(skill);
                break;
            case 'Wave of Light':
                console.debug(`Creating WaveOfLightEffect for ${skill.name}`);
                effect = new WaveOfLightEffect(skill);
                break;
            case 'Mystic Allies':
                console.debug(`Creating MysticAllyEffect for ${skill.name}`);
                effect = new MysticAllyEffect(skill);
                break;
            case 'Exploding Palm':
                console.debug(`Creating ExplodingPalmEffect for ${skill.name}`);
                effect = new ExplodingPalmEffect(skill);
                break;
            case 'Breath of Heaven':
                console.debug(`Creating BreathOfHeavenEffect for ${skill.name}`);
                effect = new BreathOfHeavenEffect(skill);
                break;
            case 'Shield of Zen':
                console.debug(`Creating ShieldOfZenEffect for ${skill.name}`);
                effect = new ShieldOfZenEffect(skill);
                break;
            case 'Flying Dragon':
                console.debug(`Creating FlyingDragonEffect for ${skill.name}`);
                effect = new FlyingDragonEffect(skill);
                break;
            case 'Flying Kick':
                console.debug(`Creating FlyingKickEffect for ${skill.name}`);
                effect = new FlyingKickEffect(skill);
                break;
            case 'Deadly Reach':
                console.debug(`Creating DeadlyReachEffect for ${skill.name}`);
                effect = new DeadlyReachEffect(skill);
                break;
            case 'Imprisoned Fists':
                console.debug(`Creating ImprisonedFistsEffect for ${skill.name}`);
                effect = new ImprisonedFistsEffect(skill);
                break;
            case 'Bul Palm':
                console.debug(`Creating BulPalmEffect for ${skill.name}`);
                effect = new BulPalmEffect(skill);
                break;
            case 'Bul Breath Of Heaven':
                console.debug(`Creating BulBreathOfHeavnEffect for ${skill.name}`);
                effect = new BulBreathOfHeavenEffect(skill);
                break;
            case 'Bul Shadow Clone':
                console.debug(`Creating BulShadowCloneEffect for ${skill.name}`);
                effect = new BulShadowCloneEffect(skill);
                break;
            default:
                console.debug(`Creating default SkillEffect for ${skill.name}`);
                effect = new SkillEffect(skill);
                break;
        }
        
        console.debug(`Effect created: ${effect.constructor.name}`);
        return effect;
    }
    
    /**
     * Create a variant-specific effect for a skill
     * @param {Skill} skill - The skill to create an effect for
     * @returns {SkillEffect|null} - The created effect, or null if no variant-specific effect exists
     */
    static createVariantEffect(skill) {
        const skillName = skill.name;
        const variantName = skill.variant;
        
        if (!skillName || !variantName) return null;
        
        console.debug(`Creating variant effect for ${skillName} (${variantName})`);
        
        // Handle Breath of Heaven variants
        if (skillName === 'Breath of Heaven') {
            switch (variantName) {
                case 'Circle of Life':
                    return new CircleOfLifeEffect(skill);
                    
                case 'Infused with Light':
                    return new InfusedWithLightEffect(skill);
                    
                case 'Radiant Breath':
                    return new RadiantBreathEffect(skill);
                    
                case 'Soothing Mist':
                    return new SoothingMistEffect(skill);
                    
                case 'Zephyr\'s Grace':
                    return new ZephyrsGraceEffect(skill);
            }
        }
        
        // Handle Cyclone Strike variants
        else if (skillName === 'Cyclone Strike') {
            switch (variantName) {
                case 'Eye of the Storm':
                    return new EyeOfTheStormEffect(skill);
                    
                case 'Path of the Storm':
                    return new PathOfTheStormEffect(skill);
                    
                case 'Storm Spirit':
                    return new StormSpiritEffect(skill);
                    
                case 'Tempest\'s Heart':
                    return new TempestsHeartEffect(skill);
            }
        }
        
        // Handle Exploding Palm variants
        else if (skillName === 'Exploding Palm') {
            switch (variantName) {
                case 'Crippling Insight':
                    return new CripplingInsightEffect(skill);
                    
                case 'Reaching Rebuke':
                    return new ReachingRebukeEffect(skill);
                    
                case 'Scolding Storm':
                    return new ScoldingStormEffect(skill);
                    
                case 'Breath of Incense':
                    return new BreathOfIncenseEffect(skill);
                    
                case 'Path of the Present':
                    return new PathOfThePresentEffect(skill);
            }
        }
        
        // Handle Flying Dragon variants
        else if (skillName === 'Flying Dragon') {
            switch (variantName) {
                case 'Dragon\'s Flight':
                    return new DragonFlightEffect(skill);
                    
                case 'Inferno Dragon':
                    return new InfernoDragonEffect(skill);
                    
                case 'Thunder Dragon':
                    return new ThunderDragonEffect(skill);
                    
                case 'Gale Dragon':
                    return new GaleDragonEffect(skill);
                    
                case 'Shadow Dragon':
                    return new ShadowDragonEffect(skill);
            }
        }
        
        // Handle Flying Kick variants
        else if (skillName === 'Flying Kick') {
            switch (variantName) {
                case 'Mantle of the Crane':
                    return new MantleOfTheCraneEffect(skill);
                    
                case 'Tiger\'s Flight':
                    return new TigersFlightEffect(skill);
                    
                case 'Grace\'s Bounty':
                    return new GracesBountyEffect(skill);
                    
                case 'Momentum\'s Flow':
                    return new MomentumFlowEffect(skill);
                    
                case 'Spokes of the Wheel':
                    return new SpokesOfTheWheelEffect(skill);
            }
        }
        
        // Handle Inner Sanctuary variants
        else if (skillName === 'Inner Sanctuary') {
            switch (variantName) {
                case 'Circle of Wrath':
                    // Creates a damaging field that harms enemies who enter
                    return new CircleOfWrathEffect(skill);
                    
                case 'Sanctified Ground':
                    // Increases healing for allies standing within the sanctuary
                    return new SanctifiedGroundEffect(skill);
                    
                case 'Safe Haven':
                    // Provides additional damage reduction for allies
                    return new SafeHavenEffect(skill);
                    
                case 'Temple of Protection':
                    // Creates a barrier that blocks projectiles
                    return new TempleOfProtectionEffect(skill);
                    
                case 'Forbidden Palace':
                    // Reduces enemy attack speed and movement within the sanctuary
                    return new ForbiddenPalaceEffect(skill);
            }
        }
        
        // Handle Mystic Allies variants
        else if (skillName === 'Mystic Allies') {
            switch (variantName) {
                case 'Fire Allies':
                    // Summons allies that deal fire damage and burn enemies
                    return new FireAlliesEffect(skill);
                    
                case 'Water Allies':
                    // Summons allies that deal water damage and slow enemies
                    return new WaterAlliesEffect(skill);
            }
        }
        
        // Handle Imprisoned Fists variants
        else if (skillName === 'Imprisoned Fists') {
            switch (variantName) {
                case 'Thunderous Grip':
                    // Adds lightning damage that chains between enemies
                    return new ThunderousGripEffect(skill);
                    
                case 'Frozen Shackles':
                    // Freezes enemies in place for a short duration
                    return new FrozenShacklesEffect(skill);
                    
                case 'Shadow Bind':
                    // Creates shadow tendrils that hold enemies in place
                    return new ShadowBindEffect(skill);
                    
                case 'Gale Chains':
                    // Creates wind chains that pull enemies together
                    return new GaleChainsEffect(skill);
                    
                case 'Fiery Chains':
                    // Creates burning chains that deal damage over time
                    return new FieryChainsEffect(skill);
            }
        }
        
        // Handle Wave Strike variants
        else if (skillName === 'Wave Strike') {
            switch (variantName) {
                case 'Tidal Force':
                    // The wave travels further and deals increased damage to enemies at the end of its path
                    return new TidalWaveEffect(skill);
                    
                case 'Shocking Wave':
                    // Enemies hit by the wave are electrified, taking additional lightning damage over time
                    return new ThunderWaveEffect(skill);
                    
                case 'Freezing Wave':
                    // The wave chills enemies, reducing their movement speed for a short duration
                    return new FrozenWaveEffect(skill);
                    
                // Note: 'Explosive Wave' and 'Healing Surge' variants need implementation
                // TODO: Add effect classes for these variants
            }
        }
        
        // Handle Seven-Sided Strike variants
        else if (skillName === 'Seven-Sided Strike') {
            switch (variantName) {
                case 'Blazing Fists':
                    // Each strike ignites enemies, dealing fire damage over time
                    return new ShadowAssaultEffect(skill); // Temporarily using existing effect
                    
                case 'Frozen Assault':
                    // Each strike has a chance to freeze enemies
                    return new SustainedAssaultEffect(skill); // Temporarily using existing effect
                    
                case 'Thunderclap':
                    // Each strike releases a thunderclap that stuns enemies
                    return new FistOfFuryEffect(skill); // Temporarily using existing effect
                    
                case 'Phantom Echo':
                    // Creates an echo that repeats the strikes after a delay
                    return new PandemoniumEffect(skill); // Temporarily using existing effect
                    
                case 'Celestial Impact':
                    // Increases the number of strikes and damage
                    return new InnerPeaceEffect(skill); // Temporarily using existing effect
                    
                // TODO: Implement proper effect classes for these variants
            }
        }
        
        // Handle Shield of Zen variants
        else if (skillName === 'Shield of Zen') {
            switch (variantName) {
                case 'Transcendence':
                    // Elevates the monk's spiritual state, providing enhanced protection
                    return new TranscendenceEffect(skill);
                    
                case 'Retribution Aura':
                    // Creates an aura that damages enemies who attack the monk
                    return new RetributionAuraEffect(skill);
                    
                case 'Spiritual Protection':
                    // Provides protection against spiritual and magical attacks
                    return new SpiritualProtectionEffect(skill);
                    
                case 'Diamond Aura':
                    // Creates a diamond-hard aura that significantly reduces physical damage
                    return new DiamondAuraEffect(skill);
            }
        }
        
        // Handle Wave of Light variants
        else if (skillName === 'Wave of Light') {
            switch (variantName) {
                case 'Explosive Light':
                    // Creates an explosion of light that damages enemies in an area
                    return new ExplosiveLightEffect(skill);
                    
                case 'Lightning Bell':
                    // Summons a bell that strikes with lightning
                    return new LightningBellEffect(skill);
                    
                case 'Pillar of the Light':
                    // Creates a pillar of light that damages enemies over time
                    return new PillarOfTheLightEffect(skill);
                    
                case 'Wall of Light':
                    // Creates a wall of light that blocks and damages enemies
                    return new WallOfLightEffect(skill);
            }
        }
        
        // Handle Bul Palm variants
        else if (skillName === 'Bul Palm') {
            switch (variantName) {
                case 'Palm Rain':
                    // Summons multiple palms from the sky that crash down on enemies
                    return new BulPalmRainEffect(skill);
                case 'Palm Cross':
                    // Summons 4 giant palms in a cross pattern that fall and cause a massive explosion
                    return new BulPalmCrossEffect(skill);
                case 'Storm of Palms':
                    // Summons multiple palms that follow the hero and crash down on enemies
                    return new StormOfPalmsEffect(skill);
            }
        }
        
        // No variant-specific effect found
        console.debug(`No variant-specific effect found for ${skillName} (${variantName})`);
        return null;
    }
}