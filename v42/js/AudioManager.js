import * as THREE from 'three';
import { ALL_SOUNDS, ALL_MUSIC } from './config/sounds.js';
import { STORAGE_KEYS } from './config/storage-keys.js';

export class AudioManager {
    constructor(game) {
        this.game = game;
        this.audioEnabled = true;
        this.isMuted = false;
        this.musicVolume = 0.1;
        this.sfxVolume = 0.8;
        
        // Audio listeners and sources
        this.listener = null;
        this.musicSource = null;
        this.currentMusic = null;
        
        // Sound collections
        this.sounds = {};
        this.music = {};
        
        // Audio file availability tracking
        this.audioFilesAvailable = false;
        
        console.debug('Audio system initialized');
    }
    
    init() {
        try {
            // Create audio listener
            this.listener = new THREE.AudioListener();
            this.game.camera.add(this.listener);
            
            // Load user settings from localStorage
            this.loadSettingsFromLocalStorage();
            
            // Check if audio files exist
            this.checkAudioFilesExist().then(available => {
                this.audioFilesAvailable = available;
                
                if (available) {
                    console.debug('Audio files found, initializing audio system');
                    // Create sound collections
                    this.createSoundEffects();
                    this.createMusic();
                } else {
                    console.warn('Audio files not found, using simulated audio');
                    // Create simulated sound collections
                    this.createSimulatedSoundEffects();
                    this.createSimulatedMusic();
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error initializing audio system:', error);
            this.audioEnabled = false;
            return false;
        }
    }
    
    // Load settings directly from localStorage using the same keys as AudioTab.js
    loadSettingsFromLocalStorage() {
        try {
            // Load mute setting
            const muted = localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
            this.isMuted = muted;
            
            // Load music volume
            const musicVolume = parseFloat(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)) || 0.5;
            this.setMusicVolume(musicVolume);
            
            // Load SFX volume
            const sfxVolume = parseFloat(localStorage.getItem(STORAGE_KEYS.SFX_VOLUME)) || 0.8;
            this.setSFXVolume(sfxVolume);
            
            console.debug('Audio settings loaded from localStorage:', { 
                muted: this.isMuted, 
                musicVolume: this.musicVolume, 
                sfxVolume: this.sfxVolume 
            });
            
            return true;
        } catch (error) {
            console.error('Error loading audio settings from localStorage:', error);
            return false;
        }
    }
    
    async checkAudioFilesExist() {
        try {
            // Check if main theme exists as a simple test
            const response = await fetch('assets/audio/main_theme.mp3', { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.warn('Error checking audio files:', error);
            return false;
        }
    }
    
    createSoundEffects() {
        // Load all sound effects from the sound configuration
        Object.values(ALL_SOUNDS).forEach(sound => {
            this.sounds[sound.id] = this.createSound(sound.id, sound.file, sound.volume);
        });
    }
    
    createMusic() {
        // Load all music tracks from the music configuration
        Object.values(ALL_MUSIC).forEach(music => {
            this.music[music.id] = this.createSound(music.id, music.file, music.volume, music.loop);
        });
    }
    
    createSimulatedSoundEffects() {
        // Load all sound effects from the sound configuration
        Object.values(ALL_SOUNDS).forEach(sound => {
            const simParams = sound.simulated;
            if (simParams) {
                // Extract parameters for simulated sound
                const frequency = simParams.frequency || 220;
                const volume = sound.volume || 0.7;
                const duration = simParams.duration || 0.3;
                const loop = false;
                
                // Create the simulated sound
                this.sounds[sound.id] = this.createSimulatedSound(
                    sound.id, 
                    frequency, 
                    volume, 
                    duration, 
                    loop, 
                    simParams
                );
            }
        });
    }
    
    createSimulatedMusic() {
        // Load all music tracks from the music configuration
        Object.values(ALL_MUSIC).forEach(music => {
            const simParams = music.simulated;
            if (simParams) {
                // Extract parameters for simulated music
                const frequency = simParams.frequency || 220;
                const volume = music.volume || this.musicVolume;
                const duration = simParams.duration || 5.0;
                const loop = true;
                
                // Create the simulated music
                this.music[music.id] = this.createSimulatedSound(
                    music.id, 
                    frequency, 
                    volume, 
                    duration, 
                    loop, 
                    simParams
                );
            }
        });
    }
    
    createSound(name, filename, volume = 1.0, loop = false) {
        try {
            // Create audio object
            const sound = new THREE.Audio(this.listener);
            
            // Set properties
            sound.name = name;
            sound.setVolume(volume);
            sound.setLoop(loop);
            
            // Load audio file
            const audioLoader = new THREE.AudioLoader();
            
            // Load the actual file
            audioLoader.load(`assets/audio/${filename}`, buffer => {
                sound.setBuffer(buffer);
                console.debug(`Loaded audio: ${name}`);
            }, 
            // Progress callback
            (xhr) => {
                console.debug(`${name} loading: ${(xhr.loaded / xhr.total * 100)}% loaded`);
            },
            // Error callback
            (error) => {
                console.error(`Error loading audio ${name}:`, error);
                // Fall back to simulated sound
                this.simulateAudioBuffer(sound);
            });
            
            return sound;
        } catch (error) {
            console.error(`Error creating sound ${name}:`, error);
            return null;
        }
    }
    
    createSimulatedSound(name, frequency = 220, volume = 1.0, duration = 0.5, loop = false, options = {}) {
        try {
            // Create audio object
            const sound = new THREE.Audio(this.listener);
            
            // Set properties
            sound.name = name;
            sound.setVolume(volume);
            sound.setLoop(loop);
            
            // Handle frequency as array or single value
            let freqValue = frequency;
            if (Array.isArray(frequency)) {
                // If it's an array, we'll create a complex sound with multiple frequencies
                this.simulateComplexAudioBuffer(sound, frequency, duration, options);
            } else {
                // Create a simulated buffer with a single frequency
                this.simulateAudioBuffer(sound, freqValue, duration, options);
            }
            
            return sound;
        } catch (error) {
            console.error(`Error creating simulated sound ${name}:`, error);
            return null;
        }
    }
    
    simulateAudioBuffer(sound, frequency = 220, duration = 0.5, options = {}) {
        // Create a simple oscillator-based sound as a placeholder
        const context = this.listener.context;
        const sampleRate = context.sampleRate;
        const buffer = context.createBuffer(1, sampleRate * duration, sampleRate);
        
        // Extract options
        const waveType = options.type || 'sine';
        const slide = options.slide || 0;
        const vibrato = options.vibrato || 0;
        const tremolo = options.tremolo || 0;
        const noise = options.noise || 0;
        const attack = options.attack || 0.01;
        const decay = options.decay !== undefined ? options.decay : true;
        
        // Fill the buffer with the appropriate waveform
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            // Time in seconds
            const t = i / sampleRate;
            
            // Calculate amplitude envelope
            let amplitude = 0.5;
            if (decay) {
                // Attack-decay envelope
                const attackTime = Math.min(attack, duration * 0.5);
                const attackPhase = Math.min(t / attackTime, 1);
                const decayPhase = 1 - ((t - attackTime) / (duration - attackTime));
                amplitude = t < attackTime ? attackPhase * 0.5 : decayPhase * 0.5;
            }
            
            // Apply frequency slide if needed
            const slideAmount = slide * (t / duration);
            const currentFreq = frequency + slideAmount;
            
            // Apply vibrato if needed
            const vibratoFreq = 5; // 5 Hz vibrato
            const vibratoAmount = vibrato * Math.sin(2 * Math.PI * vibratoFreq * t) * 10;
            
            // Apply tremolo if needed
            const tremoloFreq = 8; // 8 Hz tremolo
            const tremoloAmount = 1 - (tremolo * 0.5 * (1 + Math.sin(2 * Math.PI * tremoloFreq * t)));
            
            // Generate the waveform
            let sample = 0;
            const phase = 2 * Math.PI * (currentFreq + vibratoAmount) * t;
            
            switch (waveType) {
                case 'sine':
                    sample = Math.sin(phase);
                    break;
                case 'square':
                    sample = Math.sign(Math.sin(phase));
                    break;
                case 'sawtooth':
                    sample = 2 * ((t * (currentFreq + vibratoAmount)) % 1) - 1;
                    break;
                case 'triangle':
                    sample = 2 * Math.abs(2 * ((t * (currentFreq + vibratoAmount)) % 1) - 1) - 1;
                    break;
                default:
                    sample = Math.sin(phase);
            }
            
            // Add noise if needed
            if (noise > 0) {
                sample = sample * (1 - noise) + (Math.random() * 2 - 1) * noise;
            }
            
            // Apply amplitude and tremolo
            data[i] = sample * amplitude * tremoloAmount;
        }
        
        sound.setBuffer(buffer);
    }
    
    simulateComplexAudioBuffer(sound, frequencies = [220], duration = 0.5, options = {}) {
        // Create a complex sound with multiple frequencies
        const context = this.listener.context;
        const sampleRate = context.sampleRate;
        const buffer = context.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Clear the buffer
        for (let i = 0; i < buffer.length; i++) {
            data[i] = 0;
        }
        
        // Generate each frequency component and mix them
        frequencies.forEach((freq, index) => {
            // Create a temporary buffer for this frequency
            const tempBuffer = new Float32Array(buffer.length);
            
            // Extract options
            const waveType = options.type || 'sine';
            const slide = options.slide || 0;
            const vibrato = options.vibrato || 0;
            const tremolo = options.tremolo || 0;
            const noise = options.noise || 0;
            const attack = options.attack || 0.01;
            const decay = options.decay !== undefined ? options.decay : true;
            
            // Adjust amplitude for multiple frequencies to prevent clipping
            const baseAmplitude = 0.5 / Math.sqrt(frequencies.length);
            
            // Generate the waveform for this frequency
            for (let i = 0; i < buffer.length; i++) {
                // Time in seconds
                const t = i / sampleRate;
                
                // Calculate amplitude envelope
                let amplitude = baseAmplitude;
                if (decay) {
                    // Attack-decay envelope
                    const attackTime = Math.min(attack, duration * 0.5);
                    const attackPhase = Math.min(t / attackTime, 1);
                    const decayPhase = 1 - ((t - attackTime) / (duration - attackTime));
                    amplitude = t < attackTime ? attackPhase * baseAmplitude : decayPhase * baseAmplitude;
                }
                
                // Apply frequency slide if needed - alternate direction for harmonics
                const slideDirection = index % 2 === 0 ? 1 : -0.5;
                const slideAmount = slide * (t / duration) * slideDirection;
                const currentFreq = freq + slideAmount;
                
                // Apply vibrato if needed
                const vibratoFreq = 5 + index; // Slightly different vibrato for each harmonic
                const vibratoAmount = vibrato * Math.sin(2 * Math.PI * vibratoFreq * t) * 10;
                
                // Apply tremolo if needed
                const tremoloFreq = 8 - index * 0.5; // Slightly different tremolo for each harmonic
                const tremoloAmount = 1 - (tremolo * 0.5 * (1 + Math.sin(2 * Math.PI * tremoloFreq * t)));
                
                // Generate the waveform
                let sample = 0;
                const phase = 2 * Math.PI * (currentFreq + vibratoAmount) * t;
                
                switch (waveType) {
                    case 'sine':
                        sample = Math.sin(phase);
                        break;
                    case 'square':
                        sample = Math.sign(Math.sin(phase));
                        break;
                    case 'sawtooth':
                        sample = 2 * ((t * (currentFreq + vibratoAmount)) % 1) - 1;
                        break;
                    case 'triangle':
                        sample = 2 * Math.abs(2 * ((t * (currentFreq + vibratoAmount)) % 1) - 1) - 1;
                        break;
                    default:
                        sample = Math.sin(phase);
                }
                
                // Add noise if needed - less noise for higher harmonics
                if (noise > 0) {
                    const noiseAmount = noise / (index + 1);
                    sample = sample * (1 - noiseAmount) + (Math.random() * 2 - 1) * noiseAmount;
                }
                
                // Apply amplitude and tremolo
                tempBuffer[i] = sample * amplitude * tremoloAmount;
            }
            
            // Mix this frequency component into the main buffer
            for (let i = 0; i < buffer.length; i++) {
                data[i] += tempBuffer[i];
            }
        });
        
        // Apply some basic limiting to prevent clipping
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.max(-0.99, Math.min(0.99, data[i]));
        }
        
        sound.setBuffer(buffer);
    }
    
    playSound(name) {
        if (!this.audioEnabled || this.isMuted) return;
        
        const sound = this.sounds[name];
        if (sound) {
            try {
                // If the sound is already playing, stop it first
                if (sound.isPlaying) {
                    sound.stop();
                }
                
                // Play the sound
                sound.play();
                return true;
            } catch (error) {
                console.warn(`Could not play sound ${name}:`, error);
                return false;
            }
        }
        return false;
    }
    
    playMusic(name = 'mainTheme') {
        if (!this.audioEnabled || this.isMuted) return false;
        
        // Stop current music if playing
        this.stopMusic();
        
        // Play new music
        const music = this.music[name];
        if (music) {
            try {
                music.play();
                this.currentMusic = name;
                return true;
            } catch (error) {
                console.warn(`Could not play music ${name}:`, error);
                return false;
            }
        }
        return false;
    }
    
    stopMusic() {
        if (this.currentMusic && this.music[this.currentMusic]) {
            try {
                this.music[this.currentMusic].stop();
                return true;
            } catch (error) {
                console.warn(`Could not stop music ${this.currentMusic}:`, error);
                return false;
            }
        }
        this.currentMusic = null;
        return true;
    }
    
    /**
     * Pause all audio (both music and sound effects)
     * @returns {boolean} True if successful
     */
    pause() {
        let musicPaused = false;
        let soundEffectsPaused = false;
        
        // Pause current music if playing
        if (this.currentMusic && this.music[this.currentMusic]) {
            try {
                this.music[this.currentMusic].pause();
                musicPaused = true;
                console.debug(`Music ${this.currentMusic} paused`);
            } catch (error) {
                console.warn(`Could not pause music ${this.currentMusic}:`, error);
            }
        }
        
        // Pause all sound effects
        if (this.audioEnabled) {
            try {
                // Iterate through all sound effects and pause them if they're playing
                for (const soundName in this.sounds) {
                    const sound = this.sounds[soundName];
                    if (sound && sound.isPlaying) {
                        sound.pause();
                    }
                }
                soundEffectsPaused = true;
                console.debug('All sound effects paused');
            } catch (error) {
                console.warn('Could not pause all sound effects:', error);
            }
        }
        
        return musicPaused || soundEffectsPaused;
    }
    
    /**
     * Resume all audio (both music and sound effects)
     * @returns {boolean} True if successful
     */
    resume() {
        let musicResumed = false;
        let soundEffectsResumed = false;
        
        // Resume current music if paused
        if (this.currentMusic && this.music[this.currentMusic]) {
            try {
                this.music[this.currentMusic].play();
                musicResumed = true;
                console.debug(`Music ${this.currentMusic} resumed`);
            } catch (error) {
                console.warn(`Could not resume music ${this.currentMusic}:`, error);
            }
        }
        
        // Resume all sound effects
        if (this.audioEnabled && !this.isMuted) {
            try {
                // Iterate through all sound effects and resume them if they were playing
                for (const soundName in this.sounds) {
                    const sound = this.sounds[soundName];
                    // Only resume sounds that were playing and are now paused
                    if (sound && sound.isPaused) {
                        sound.play();
                    }
                }
                soundEffectsResumed = true;
                console.debug('All sound effects resumed');
            } catch (error) {
                console.warn('Could not resume all sound effects:', error);
            }
        }
        
        return musicResumed || soundEffectsResumed;
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // Stop all sounds
            this.stopMusic();
            
            // Stop all sound effects
            Object.values(this.sounds).forEach(sound => {
                if (sound && sound.isPlaying) {
                    try {
                        sound.stop();
                    } catch (error) {
                        console.warn(`Could not stop sound:`, error);
                    }
                }
            });
        } else {
            // Resume music if it was playing
            if (this.currentMusic) {
                this.playMusic(this.currentMusic);
            }
        }
        
        return this.isMuted;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Update all music volumes
        Object.values(this.music).forEach(music => {
            if (music) {
                music.setVolume(this.musicVolume);
            }
        });
        
        return this.musicVolume;
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        
        // Update all sound effect volumes
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.setVolume(this.sfxVolume);
            }
        });
        
        return this.sfxVolume;
    }
    
    getMusicVolume() {
        return this.musicVolume;
    }
    
    getSFXVolume() {
        return this.sfxVolume;
    }
    
    isMusicPlaying() {
        return this.currentMusic !== null && this.music[this.currentMusic]?.isPlaying;
    }
    
    getCurrentMusic() {
        return this.currentMusic;
    }
    
    isAudioEnabled() {
        return this.audioEnabled;
    }
    
    areAudioFilesAvailable() {
        return this.audioFilesAvailable;
    }
    
    // Check if auto-pause is enabled - now always returns false as this is handled by Game.js
    isAutoPauseEnabled() {
        // Auto-pause is now handled by Game.js
        return false;
    }
    
    // Save audio settings to localStorage
    saveSettings() {
        try {
            // Save individual settings using the same keys as AudioTab.js
            localStorage.setItem(STORAGE_KEYS.MUTED, this.isMuted.toString());
            localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, this.musicVolume.toString());
            localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, this.sfxVolume.toString());
            
            // Also save as a combined object for backward compatibility
            const settings = {
                isMuted: this.isMuted,
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume
            };
            
            localStorage.setItem(STORAGE_KEYS.AUDIO_SETTINGS, JSON.stringify(settings));
            
            console.debug('Audio settings saved to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving audio settings:', error);
            return false;
        }
    }
    
    // Load audio settings from localStorage (legacy method)
    loadSettings() {
        try {
            // First try to load settings using the new method
            const result = this.loadSettingsFromLocalStorage();
            if (result) {
                return true;
            }
            
            // If that fails, try the legacy method
            const settingsJson = localStorage.getItem(STORAGE_KEYS.AUDIO_SETTINGS);
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                
                // Apply settings
                this.isMuted = settings.isMuted || false;
                this.setMusicVolume(settings.musicVolume || 0.5);
                this.setSFXVolume(settings.sfxVolume || 0.8);
                
                console.debug('Audio settings loaded from legacy storage');
                return true;
            }
        } catch (error) {
            console.error('Error loading audio settings:', error);
        }
        return false;
    }
}