/**
 * AudioTab.js
 * Manages the audio settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';

export class AudioTab extends SettingsTab {
    /**
     * Create an audio settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('audio', game, settingsMenu);
        
        // Audio settings elements
        this.muteCheckbox = document.getElementById('mute-checkbox');
        this.musicVolumeSlider = document.getElementById('music-volume-slider');
        this.musicVolumeValue = document.getElementById('music-volume-value');
        this.sfxVolumeSlider = document.getElementById('sfx-volume-slider');
        this.sfxVolumeValue = document.getElementById('sfx-volume-value');
        this.testSoundButton = document.getElementById('test-sound-button');
        this.audioDisabledMessage = document.getElementById('audio-disabled-message');
        this.simulatedAudioNote = document.getElementById('simulated-audio-note');
        
        this.init();
    }
    
    /**
     * Initialize the audio settings
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Check if audio is available
        const audioAvailable = this.game && this.game.audio && this.game.audio.isAvailable;
        
        // Show/hide audio disabled message
        if (this.audioDisabledMessage) {
            this.audioDisabledMessage.style.display = audioAvailable ? 'none' : 'block';
        }
        
        // Show/hide simulated audio note
        if (this.simulatedAudioNote) {
            this.simulatedAudioNote.style.display = (this.game && this.game.audio && this.game.audio.isSimulated) ? 'block' : 'none';
        }
        
        if (this.muteCheckbox) {
            // Set current mute state
            const muted = localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
            this.muteCheckbox.checked = muted;
            
            // Add change event listener
            this.muteCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.MUTED, this.muteCheckbox.checked);
                
                // Apply mute settings immediately if game is available
                if (this.game && this.game.audio) {
                    this.game.audio.setMuted(this.muteCheckbox.checked);
                }
            });
        }
        
        if (this.musicVolumeSlider && this.musicVolumeValue) {
            // Set current music volume
            const musicVolume = parseFloat(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)) || 0.5;
            this.musicVolumeSlider.value = musicVolume;
            this.musicVolumeValue.textContent = Math.round(musicVolume * 1);
            
            // Add input event listener
            this.musicVolumeSlider.addEventListener('input', () => {
                const value = parseFloat(this.musicVolumeSlider.value);
                this.musicVolumeValue.textContent = Math.round(value * 1);
                localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, value);
                
                // Apply music volume settings immediately if game is available
                if (this.game && this.game.audio) {
                    this.game.audio.setMusicVolume(value);
                }
            });
        }
        
        if (this.sfxVolumeSlider && this.sfxVolumeValue) {
            // Set current SFX volume
            const sfxVolume = parseFloat(localStorage.getItem(STORAGE_KEYS.SFX_VOLUME)) || 0.5;
            this.sfxVolumeSlider.value = sfxVolume;
            this.sfxVolumeValue.textContent = Math.round(sfxVolume * 1);
            
            // Add input event listener
            this.sfxVolumeSlider.addEventListener('input', () => {
                const value = parseFloat(this.sfxVolumeSlider.value);
                this.sfxVolumeValue.textContent = Math.round(value * 1);
                localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, value);
                
                // Apply SFX volume settings immediately if game is available
                if (this.game && this.game.audio) {
                    this.game.audio.setSfxVolume(value);
                }
            });
        }
        
        if (this.testSoundButton) {
            // Add click event listener
            this.testSoundButton.addEventListener('click', () => {
                // Play test sound if game is available
                if (this.game && this.game.audio) {
                    this.game.audio.playSfx('test');
                }
            });
        }
        
        return true;
    }
    
    /**
     * Save the audio settings
     */
    saveSettings() {
        if (this.muteCheckbox) {
            localStorage.setItem(STORAGE_KEYS.MUTED, this.muteCheckbox.checked);
        }
        
        if (this.musicVolumeSlider) {
            localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, this.musicVolumeSlider.value);
        }
        
        if (this.sfxVolumeSlider) {
            localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, this.sfxVolumeSlider.value);
        }
    }
    
    /**
     * Reset the audio settings to defaults
     */
    resetToDefaults() {
        if (this.muteCheckbox) {
            this.muteCheckbox.checked = false;
        }
        
        if (this.musicVolumeSlider && this.musicVolumeValue) {
            this.musicVolumeSlider.value = 0.5;
            this.musicVolumeValue.textContent = 50;
        }
        
        if (this.sfxVolumeSlider && this.sfxVolumeValue) {
            this.sfxVolumeSlider.value = 0.5;
            this.sfxVolumeValue.textContent = 50;
        }
        
        this.saveSettings();
    }
}