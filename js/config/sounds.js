/**
 * Sound configuration for the game
 * This file defines all sound effects and music used in the game
 */

// Player sounds
export const PLAYER_SOUNDS = {
    attack: {
        id: 'playerAttack',
        file: 'attack.mp3',
        volume: 0.7,
        // Parameters for simulated sound if audio files aren't available
        simulated: {
            frequency: 220,
            duration: 0.3,
            type: 'sawtooth',
            decay: true
        }
    },
    hit: {
        id: 'playerHit',
        file: 'player_hit.mp3',
        volume: 0.8,
        simulated: {
            frequency: 330,
            duration: 0.2,
            type: 'sine',
            decay: true
        }
    },
    death: {
        id: 'playerDeath',
        file: 'player_death.mp3',
        volume: 1.0,
        simulated: {
            frequency: 110,
            duration: 0.5,
            type: 'sine',
            decay: true,
            slide: -20
        }
    },
    levelUp: {
        id: 'levelUp',
        file: 'level_up.mp3',
        volume: 1.0,
        simulated: {
            frequency: 440,
            duration: 0.4,
            type: 'sine',
            decay: false,
            arpeggio: [1, 1.25, 1.5]
        }
    }
};

// Skill sounds
export const SKILL_SOUNDS = {
    // Wave Strike
    waveStrike: {
        id: 'waveStrike',
        file: 'wave_strike.mp3',
        volume: 1.0, // Increased from 0.8 to 1.0 for better audibility
        // simulated: {
        //     frequency: 280,
        //     duration: 0.4, // Increased duration slightly for better audibility
        //     type: 'sine',
        //     decay: true,
        //     slide: 60, // Increased slide for more dramatic effect
        //     noise: 0.08, // Increased noise for more watery sound
        //     filter: 'lowpass',
        //     vibrato: 8 // Added vibrato for wave-like effect
        // }
    },
    waterImpact: {
        id: 'waterImpact',
        file: 'water_impact.mp3',
        volume: 0.7,
        simulated: {
            frequency: 350,
            duration: 0.2,
            type: 'sine',
            decay: true,
            slide: -20,
            noise: 0.2,
            filter: 'lowpass'
        }
    },
    waterDissipate: {
        id: 'waterDissipate',
        file: 'water_dissipate.mp3',
        volume: 0.6,
        simulated: {
            frequency: 240,
            duration: 0.4,
            type: 'sine',
            decay: true,
            slide: -30,
            noise: 0.1,
            filter: 'lowpass'
        }
    },
    
    // Cyclone Strike
    cycloneStrike: {
        id: 'skillCycloneStrike',
        file: 'cyclone_strike.mp3',
        volume: 0.8,
        simulated: {
            frequency: 350,
            duration: 0.4,
            type: 'sawtooth',
            decay: true,
            vibrato: 15,
            tremolo: 8,
            noise: 0.1,
            filter: 'bandpass'
        }
    },
    windPull: {
        id: 'windPull',
        file: 'wind_pull.mp3',
        volume: 0.7,
        simulated: {
            frequency: 330,
            duration: 0.3,
            type: 'sawtooth',
            decay: true,
            vibrato: 20,
            tremolo: 10,
            noise: 0.15,
            filter: 'bandpass'
        }
    },
    windDissipate: {
        id: 'windDissipate',
        file: 'wind_dissipate.mp3',
        volume: 0.6,
        simulated: {
            frequency: 300,
            duration: 0.4,
            type: 'sine',
            decay: true,
            slide: -40,
            vibrato: 10,
            tremolo: 5,
            noise: 0.08,
            filter: 'bandpass'
        }
    },
    
    // Seven-Sided Strike
    sevenSidedStrike: {
        id: 'sevenSidedStrike',
        file: 'seven_sided_strike.mp3',
        volume: 0.8,
        simulated: {
            frequency: 380,
            duration: 0.5,
            type: 'square',
            decay: true,
            attack: 0.01,
            filter: 'highpass',
            arpeggio: [1, 1.5, 2, 1.5, 1, 1.5, 2]
        }
    },
    rapidStrike: {
        id: 'rapidStrike',
        file: 'rapid_strike.mp3',
        volume: 0.8,
        simulated: {
            frequency: 420,
            duration: 0.2,
            type: 'square',
            decay: true,
            attack: 0.005,
            filter: 'highpass',
            arpeggio: [1, 1.2, 1.4, 1.6, 1.8, 2.0, 1.8]
        }
    },
    strikeComplete: {
        id: 'strikeComplete',
        file: 'strike_complete.mp3',
        volume: 0.7,
        simulated: {
            frequency: 400,
            duration: 0.3,
            type: 'square',
            decay: true,
            slide: -20,
            attack: 0.01,
            filter: 'highpass'
        }
    },
    
    // Inner Sanctuary
    innerSanctuary: {
        id: 'skillInnerSanctuary',
        file: 'inner_sanctuary.mp3',
        volume: 0.6,
        simulated: {
            frequency: 180,
            duration: 0.6,
            type: 'sine',
            decay: false,
            reverb: true
        }
    },
    barrierForm: {
        id: 'barrierForm',
        file: 'barrier_form.mp3',
        volume: 0.6,
        simulated: {
            frequency: 200,
            duration: 0.4,
            type: 'sine',
            decay: false,
            reverb: true
        }
    },
    barrierDissipate: {
        id: 'barrierDissipate',
        file: 'barrier_dissipate.mp3',
        volume: 0.5,
        simulated: {
            frequency: 160,
            duration: 0.5,
            type: 'sine',
            decay: true,
            slide: -30,
            reverb: true
        }
    },
    
    // Fist of Thunder
    fistOfThunder: {
        id: 'skillFistOfThunder',
        file: 'fist_of_thunder.mp3',
        volume: 0.8,
        simulated: {
            frequency: 520,
            duration: 0.3,
            type: 'sine',
            decay: true,
            slide: 80,
            vibrato: 20,
            noise: 0.2,
            distortion: 0.3,
            filter: 'highpass'
        }
    },
    thunderStrike: {
        id: 'thunderStrike',
        file: 'thunder_strike.mp3',
        volume: 0.8,
        simulated: {
            frequency: 550,
            duration: 0.2,
            type: 'sawtooth',
            decay: true,
            slide: -40,
            noise: 0.25,
            distortion: 0.4,
            filter: 'highpass'
        }
    },
    thunderEcho: {
        id: 'thunderEcho',
        file: 'thunder_echo.mp3',
        volume: 0.6,
        simulated: {
            frequency: 450,
            duration: 0.4,
            type: 'sine',
            decay: true,
            reverb: true,
            noise: 0.15,
            filter: 'bandpass'
        }
    },
    
    // Mystic Ally
    mysticAlly: {
        id: 'skillMysticAlly',
        file: 'mystic_ally.mp3',
        volume: 0.7,
        simulated: {
            frequency: 260,
            duration: 0.5,
            type: 'sine',
            decay: false,
            arpeggio: [1, 1.3, 1.6, 1.3]
        }
    },
    allySummonComplete: {
        id: 'allySummonComplete',
        file: 'ally_summon.mp3',
        volume: 0.7,
        simulated: {
            frequency: 280,
            duration: 0.3,
            type: 'sine',
            decay: false,
            reverb: true,
            arpeggio: [1, 1.5, 2]
        }
    },
    allyDismiss: {
        id: 'allyDismiss',
        file: 'ally_dismiss.mp3',
        volume: 0.6,
        simulated: {
            frequency: 220,
            duration: 0.4,
            type: 'sine',
            decay: true,
            reverb: true,
            arpeggio: [2, 1.5, 1]
        }
    },
    
    // Wave of Light
    waveOfLight: {
        id: 'waveOfLight',
        file: 'wave_of_light.mp3',
        volume: 0.9,
        simulated: {
            frequency: 420,
            duration: 0.6,
            type: 'triangle',
            decay: true,
            slide: -30,
            reverb: true,
            filter: 'highpass'
        }
    },
    bellRing: {
        id: 'bellRing',
        file: 'bell_ring.mp3',
        volume: 0.9,
        simulated: {
            frequency: 600,
            duration: 0.7,
            type: 'sine',
            decay: true,
            reverb: true
        }
    },
    bellFade: {
        id: 'bellFade',
        file: 'bell_fade.mp3',
        volume: 0.7,
        simulated: {
            frequency: 500,
            duration: 0.5,
            type: 'sine',
            decay: true,
            slide: -50,
            reverb: true
        }
    },
    
    // Exploding Palm
    explodingPalm: {
        id: 'explodingPalm',
        file: 'exploding_palm.mp3',
        volume: 0.8,
        simulated: {
            frequency: 340,
            duration: 0.4,
            type: 'sawtooth',
            decay: true,
            slide: 40,
            attack: 0.01,
            noise: 0.15,
            distortion: 0.4,
            arpeggio: [1, 1.2]
        }
    },
    markApplied: {
        id: 'markApplied',
        file: 'mark_applied.mp3',
        volume: 0.7,
        simulated: {
            frequency: 320,
            duration: 0.3,
            type: 'sawtooth',
            decay: true,
            slide: 30,
            filter: 'bandpass',
            distortion: 0.2
        }
    },
    massiveExplosion: {
        id: 'massiveExplosion',
        file: 'massive_explosion.mp3',
        volume: 0.9,
        simulated: {
            frequency: 220,
            duration: 0.6,
            type: 'sawtooth',
            decay: true,
            slide: -30,
            noise: 0.3,
            distortion: 0.5,
            filter: 'lowpass',
            attack: 0.01
        }
    },
    
    // Breath of Heaven
    breathOfHeaven: {
        id: 'breathOfHeaven',
        file: 'breath_of_heaven.mp3',
        volume: 0.8,
        simulated: {
            frequency: 400,
            duration: 0.5,
            type: 'sine',
            decay: false,
            reverb: true,
            arpeggio: [1, 1.2, 1.5, 1.8]
        }
    },
    healingPulse: {
        id: 'healingPulse',
        file: 'healing_pulse.mp3',
        volume: 0.7,
        simulated: {
            frequency: 450,
            duration: 0.3,
            type: 'sine',
            decay: false,
            reverb: true
        }
    },
    divineEcho: {
        id: 'divineEcho',
        file: 'divine_echo.mp3',
        volume: 0.6,
        simulated: {
            frequency: 380,
            duration: 0.4,
            type: 'sine',
            decay: true,
            slide: -20,
            reverb: true
        }
    },
    
    // Deadly Reach
    deadlyReachCast: {
        id: 'deadlyReachCast',
        file: 'deadly_reach_cast.mp3',
        volume: 0.8,
        simulated: {
            frequency: 300,
            duration: 0.3,
            type: 'sine',
            decay: false,
            slide: 30,
            filter: 'bandpass'
        }
    },
    deadlyReachImpact: {
        id: 'deadlyReachImpact',
        file: 'deadly_reach_impact.mp3',
        volume: 0.7,
        simulated: {
            frequency: 350,
            duration: 0.2,
            type: 'square',
            decay: true,
            attack: 0.01,
            filter: 'highpass'
        }
    },
    deadlyReachEnd: {
        id: 'deadlyReachEnd',
        file: 'deadly_reach_end.mp3',
        volume: 0.6,
        simulated: {
            frequency: 280,
            duration: 0.3,
            type: 'sine',
            decay: true,
            slide: -20
        }
    },
    
    // Flying Dragon
    flyingDragon: {
        id: 'flyingDragon',
        file: 'flying_dragon.mp3',
        volume: 0.9,
        simulated: {
            frequency: 380,
            duration: 0.5,
            type: 'sawtooth',
            decay: false,
            slide: 50,
            vibrato: 10,
            filter: 'highpass'
        }
    },
    dragonStrike: {
        id: 'dragonStrike',
        file: 'dragon_strike.mp3',
        volume: 0.9,
        simulated: {
            frequency: 420,
            duration: 0.3,
            type: 'sawtooth',
            decay: true,
            attack: 0.01,
            noise: 0.1,
            distortion: 0.3,
            filter: 'highpass'
        }
    },
    dragonLand: {
        id: 'dragonLand',
        file: 'dragon_land.mp3',
        volume: 0.8,
        simulated: {
            frequency: 300,
            duration: 0.4,
            type: 'sawtooth',
            decay: true,
            slide: -40,
            noise: 0.2,
            filter: 'lowpass'
        }
    },
    
    // Flying Kick
    flyingKick: {
        id: 'flyingKick',
        file: 'flying_kick.mp3',
        volume: 0.8,
        simulated: {
            frequency: 350,
            duration: 0.3,
            type: 'sawtooth',
            decay: false,
            slide: 30,
            filter: 'bandpass'
        }
    },
    kickImpact: {
        id: 'kickImpact',
        file: 'kick_impact.mp3',
        volume: 0.8,
        simulated: {
            frequency: 380,
            duration: 0.2,
            type: 'square',
            decay: true,
            attack: 0.01,
            noise: 0.1,
            filter: 'highpass'
        }
    },
    kickLand: {
        id: 'kickLand',
        file: 'kick_land.mp3',
        volume: 0.7,
        simulated: {
            frequency: 320,
            duration: 0.3,
            type: 'sawtooth',
            decay: true,
            slide: -30,
            filter: 'lowpass'
        }
    },
    
    // Imprisoned Fists
    imprisonedFists: {
        id: 'imprisonedFists',
        file: 'imprisoned_fists.mp3',
        volume: 0.8,
        simulated: {
            frequency: 300,
            duration: 0.4,
            type: 'sawtooth',
            decay: false,
            vibrato: 5,
            filter: 'bandpass'
        }
    },
    chainImpact: {
        id: 'chainImpact',
        file: 'chain_impact.mp3',
        volume: 0.7,
        simulated: {
            frequency: 250,
            duration: 0.3,
            type: 'sawtooth',
            decay: true,
            noise: 0.1,
            filter: 'lowpass'
        }
    },
    chainsBreak: {
        id: 'chainsBreak',
        file: 'chains_break.mp3',
        volume: 0.7,
        simulated: {
            frequency: 280,
            duration: 0.4,
            type: 'sawtooth',
            decay: true,
            slide: -20,
            noise: 0.2,
            filter: 'highpass'
        }
    }
};

// Enemy sounds
export const ENEMY_SOUNDS = {
    attack: {
        id: 'enemyAttack',
        file: 'enemy_attack.mp3',
        volume: 0.6,
        simulated: {
            frequency: 200,
            duration: 0.2,
            type: 'sawtooth',
            decay: true
        }
    },
    hit: {
        id: 'enemyHit',
        file: 'enemy_hit.mp3',
        volume: 0.7,
        simulated: {
            frequency: 250,
            duration: 0.1,
            type: 'square',
            decay: true
        }
    },
    death: {
        id: 'enemyDeath',
        file: 'enemy_death.mp3',
        volume: 0.8,
        simulated: {
            frequency: 150,
            duration: 0.4,
            type: 'sine',
            decay: true,
            slide: -30
        }
    },
    bossDeath: {
        id: 'bossDeath',
        file: 'boss_death.mp3',
        volume: 1.0,
        simulated: {
            frequency: 100,
            duration: 0.7,
            type: 'sawtooth',
            decay: true,
            slide: -50,
            vibrato: 5
        }
    },
    bossSpawn: {
        id: 'bossSpawn',
        file: 'boss_spawn.mp3',
        volume: 0.9,
        simulated: {
            frequency: 120,
            duration: 0.8,
            type: 'sawtooth',
            decay: false,
            slide: 80,
            vibrato: 10,
            tremolo: 6,
            noise: 0.15,
            distortion: 0.3,
            filter: 'bandpass',
            reverb: true
        }
    }
};

// Effect sounds (for status effects)
export const EFFECT_SOUNDS = {
    effect_defenseBoost: {
        id: 'effect_defenseBoost',
        file: 'effect_defense_boost.mp3',
        volume: 0.7,
        simulated: {
            frequency: 320,
            duration: 0.4,
            type: 'sine',
            decay: false,
            reverb: true,
            arpeggio: [1, 1.25, 1.5],
            filter: 'lowpass'
        }
    },
    effect_speedBoost: {
        id: 'effect_speedBoost',
        file: 'effect_speed_boost.mp3',
        volume: 0.7,
        simulated: {
            frequency: 450,
            duration: 0.3,
            type: 'sine',
            decay: false,
            vibrato: 8,
            arpeggio: [1, 1.5, 2],
            filter: 'highpass'
        }
    },
    effect_damageBoost: {
        id: 'effect_damageBoost',
        file: 'effect_damage_boost.mp3',
        volume: 0.8,
        simulated: {
            frequency: 380,
            duration: 0.4,
            type: 'square',
            decay: false,
            attack: 0.01,
            arpeggio: [1, 1.3, 1.6],
            filter: 'bandpass'
        }
    },
    effect_regeneration: {
        id: 'effect_regeneration',
        file: 'effect_regeneration.mp3',
        volume: 0.6,
        simulated: {
            frequency: 280,
            duration: 0.5,
            type: 'sine',
            decay: false,
            reverb: true,
            arpeggio: [1, 1.2, 1.4, 1.2],
            filter: 'lowpass'
        }
    },
    effect_invulnerability: {
        id: 'effect_invulnerability',
        file: 'effect_invulnerability.mp3',
        volume: 0.8,
        simulated: {
            frequency: 520,
            duration: 0.6,
            type: 'triangle',
            decay: false,
            reverb: true,
            vibrato: 12,
            arpeggio: [1, 1.5, 2, 1.5],
            filter: 'highpass'
        }
    },
    effect_invulnerable: {
        id: 'effect_invulnerable',
        file: 'effect_invulnerable.mp3',
        volume: 0.8,
        simulated: {
            frequency: 550,
            duration: 0.5,
            type: 'triangle',
            decay: false,
            reverb: true,
            vibrato: 10,
            arpeggio: [1, 1.3, 1.6, 2],
            filter: 'highpass'
        }
    },
    effect_slow: {
        id: 'effect_slow',
        file: 'effect_slow.mp3',
        volume: 0.7,
        simulated: {
            frequency: 200,
            duration: 0.4,
            type: 'sine',
            decay: true,
            slide: -30,
            vibrato: 5,
            filter: 'lowpass',
            reverb: true
        }
    }
};

// UI sounds
export const UI_SOUNDS = {
    buttonClick: {
        id: 'buttonClick',
        file: 'button_click.mp3',
        volume: 0.5,
        simulated: {
            frequency: 500,
            duration: 0.1,
            type: 'sine',
            decay: true
        }
    },
    inventoryOpen: {
        id: 'inventoryOpen',
        file: 'inventory_open.mp3',
        volume: 0.5,
        simulated: {
            frequency: 350,
            duration: 0.2,
            type: 'sine',
            decay: true,
            arpeggio: [1, 1.5]
        }
    },
    itemPickup: {
        id: 'itemPickup',
        file: 'item_pickup.mp3',
        volume: 0.6,
        simulated: {
            frequency: 400,
            duration: 0.2,
            type: 'sine',
            decay: true,
            arpeggio: [1, 1.2]
        }
    },
    dangerWarning: {
        id: 'dangerWarning',
        file: 'danger_warning.mp3',
        volume: 0.8,
        simulated: {
            frequency: 800,
            duration: 0.5,
            type: 'sawtooth',
            decay: false,
            vibrato: 15,
            tremolo: 10,
            noise: 0.1,
            filter: 'highpass'
        }
    }
};

// Environment sounds
export const ENVIRONMENT_SOUNDS = {
    chestOpen: {
        id: 'chestOpen',
        file: 'chest_open.mp3',
        volume: 0.7,
        simulated: {
            frequency: 300,
            duration: 0.3,
            type: 'sine',
            decay: true,
            arpeggio: [1, 1.2, 1.5]
        }
    },
    doorOpen: {
        id: 'doorOpen',
        file: 'door_open.mp3',
        volume: 0.7,
        simulated: {
            frequency: 200,
            duration: 0.4,
            type: 'sine',
            decay: true,
            slide: -20
        }
    },
    teleport: {
        id: 'teleport',
        file: 'teleport.mp3',
        volume: 0.8,
        simulated: {
            frequency: 400,
            duration: 0.6,
            type: 'sine',
            decay: true,
            slide: 100,
            vibrato: 15,
            tremolo: 8,
            reverb: true,
            filter: 'highpass',
            arpeggio: [1, 1.5, 2, 1.5, 1]
        }
    }
};

// Music tracks
export const MUSIC = {
    mainTheme: {
        id: 'mainTheme',
        file: 'main_theme.mp3',
        volume: 0.1,
        loop: true,
        // simulated: {
        //     frequency: 220,
        //     duration: 5.0,
        //     type: 'sine',
        //     decay: false,
        //     melody: true
        // }
    },
    battleTheme: {
        id: 'battleTheme',
        file: 'battle_theme.mp3',
        volume: 0.1,
        loop: true,
        // simulated: {
        //     frequency: 280,
        //     duration: 5.0,
        //     type: 'square',
        //     decay: false,
        //     melody: true,
        //     tempo: 140
        // }
    },
    bossTheme: {
        id: 'bossTheme',
        file: 'boss_theme.mp3',
        volume: 0.1,
        loop: true,
        // simulated: {
        //     frequency: 180,
        //     duration: 5.0,
        //     type: 'sawtooth',
        //     decay: false,
        //     melody: true,
        //     tempo: 160
        // }
    }
};

// Export all sounds as a single object for convenience
export const ALL_SOUNDS = {
    ...Object.values(PLAYER_SOUNDS).reduce((acc, sound) => {
        acc[sound.id] = sound;
        return acc;
    }, {}),
    ...Object.values(SKILL_SOUNDS).reduce((acc, sound) => {
        acc[sound.id] = sound;
        return acc;
    }, {}),
    ...Object.values(ENEMY_SOUNDS).reduce((acc, sound) => {
        acc[sound.id] = sound;
        return acc;
    }, {}),
    ...Object.values(EFFECT_SOUNDS).reduce((acc, sound) => {
        acc[sound.id] = sound;
        return acc;
    }, {}),
    ...Object.values(UI_SOUNDS).reduce((acc, sound) => {
        acc[sound.id] = sound;
        return acc;
    }, {}),
    ...Object.values(ENVIRONMENT_SOUNDS).reduce((acc, sound) => {
        acc[sound.id] = sound;
        return acc;
    }, {})
};

// Export all music as a single object for convenience
export const ALL_MUSIC = Object.values(MUSIC).reduce((acc, music) => {
    acc[music.id] = music;
    return acc;
}, {});
