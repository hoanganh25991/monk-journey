// Audio Generator Script for Monk Journey
// This script generates audio files for the game using the Web Audio API

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Import sound configurations from the source of truth
const { 
    PLAYER_SOUNDS, 
    SKILL_SOUNDS, 
    ENEMY_SOUNDS, 
    EFFECT_SOUNDS,
    UI_SOUNDS, 
    ENVIRONMENT_SOUNDS, 
    MUSIC 
} = require('../js/config/sounds.js');

// Create audio directory if it doesn't exist
const audioDir = path.join('assets', 'audio');
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    console.debug(`Created directory: ${audioDir}`);
}

// Convert the imported sound configurations to the format needed for audio generation
function buildSoundDefinitions() {
    const soundDefs = {};
    
    // Process each sound category
    const processCategory = (category) => {
        Object.values(category).forEach(sound => {
            if (sound.file && sound.simulated) {
                soundDefs[sound.file] = {
                    ...sound.simulated,
                    volume: sound.volume
                };
            }
        });
    };
    
    // Process all sound categories
    processCategory(PLAYER_SOUNDS);
    processCategory(SKILL_SOUNDS);
    processCategory(ENEMY_SOUNDS);
    processCategory(EFFECT_SOUNDS);
    processCategory(UI_SOUNDS);
    processCategory(ENVIRONMENT_SOUNDS);
    processCategory(MUSIC);
    
    return soundDefs;
}

// Generate sound definitions from the imported configurations
const sounds = buildSoundDefinitions();

// Generate audio files using SoX
function generateAudioFiles() {
    console.debug('Generating audio files...');
    
    // Check if SoX is installed
    exec('which sox', (error, stdout, stderr) => {
        if (error) {
            console.error('SoX is not installed. Please install SoX to generate audio files.');
            console.error('On macOS: brew install sox');
            console.error('On Linux: apt-get install sox');
            console.error('On Windows: Download from http://sox.sourceforge.net/');
            return;
        }
        
        // Generate each sound
        Object.entries(sounds).forEach(([filename, params]) => {
            const outputPath = path.join(audioDir, filename);
            
            // Generate command based on sound type
            let command = '';
            
            if (params.type === 'sine') {
                command = `sox -n "${outputPath}" synth ${params.duration} sine ${params.frequency} vol ${params.volume}`;
            } else if (params.type === 'square') {
                command = `sox -n "${outputPath}" synth ${params.duration} square ${params.frequency} vol ${params.volume}`;
            } else if (params.type === 'sawtooth') {
                command = `sox -n "${outputPath}" synth ${params.duration} sawtooth ${params.frequency} vol ${params.volume}`;
            } else if (params.type === 'triangle') {
                command = `sox -n "${outputPath}" synth ${params.duration} triangle ${params.frequency} vol ${params.volume}`;
            }
            
            // Add effects
            if (params.decay) {
                command += ' fade 0 ' + params.duration + ' ' + params.duration;
            }
            
            if (params.attack && params.attack > 0) {
                // Add attack parameter (fade in)
                command += ` fade ${params.attack} ${params.duration} ${params.duration}`;
            }
            
            if (params.slide) {
                const endFreq = params.frequency + params.slide;
                command = command.replace(`${params.frequency}`, `${params.frequency}:${endFreq}`);
            }
            
            if (params.reverb) {
                command += ' reverb';
            }
            
            if (params.vibrato) {
                // Add vibrato effect - depth and rate
                command += ` tremolo ${params.vibrato / 100} ${params.vibrato}`;
            }
            
            if (params.tremolo) {
                // Add tremolo effect - depth and rate
                command += ` tremolo ${params.tremolo / 100} ${params.tremolo / 2}`;
            }
            
            if (params.noise && params.noise > 0) {
                // Add noise by mixing with white noise
                // Using a simpler approach to avoid SoX segmentation faults
                const noiseLevel = params.noise;
                command += ` synth ${params.duration} whitenoise vol ${noiseLevel}`;
            }
            
            if (params.filter) {
                // Add filter effect
                switch (params.filter) {
                    case 'lowpass':
                        command += ' lowpass 1000';
                        break;
                    case 'highpass':
                        command += ' highpass 1000';
                        break;
                    case 'bandpass':
                        command += ' bandpass 1000 200';
                        break;
                }
            }
            
            if (params.distortion && params.distortion > 0) {
                // Add distortion effect (using overdrive)
                command += ' overdrive ' + (params.distortion * 20);
            }
            
            if (params.arpeggio && Array.isArray(params.arpeggio)) {
                // For arpeggio, we need to create multiple sounds and combine them
                // This is a simplified approach
                const arpeggioCommands = params.arpeggio.map((multiplier, index) => {
                    const arpeggioFreq = params.frequency * multiplier;
                    const delay = index * (params.duration / params.arpeggio.length);
                    return `synth ${params.duration / params.arpeggio.length} ${params.type} ${arpeggioFreq} vol ${params.volume} delay ${delay}`;
                });
                
                // Replace the main command with a complex arpeggio command
                if (arpeggioCommands.length > 0) {
                    command = `sox -n "${outputPath}" ` + arpeggioCommands.join(' : ');
                }
            }
            
            // Execute command
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error generating ${filename}:`, error);
                    console.error(`Command was: ${command}`);
                    
                    // Try a simplified fallback command if the original fails
                    console.debug(`Attempting simplified fallback for ${filename}...`);
                    
                    // Create a simpler command without complex effects
                    let fallbackCommand = '';
                    if (params.type === 'sine') {
                        fallbackCommand = `sox -n "${outputPath}" synth ${params.duration} sine ${params.frequency} vol ${params.volume}`;
                    } else if (params.type === 'square') {
                        fallbackCommand = `sox -n "${outputPath}" synth ${params.duration} square ${params.frequency} vol ${params.volume}`;
                    } else if (params.type === 'sawtooth') {
                        fallbackCommand = `sox -n "${outputPath}" synth ${params.duration} sawtooth ${params.frequency} vol ${params.volume}`;
                    } else if (params.type === 'triangle') {
                        fallbackCommand = `sox -n "${outputPath}" synth ${params.duration} triangle ${params.frequency} vol ${params.volume}`;
                    }
                    
                    // Add basic fade if needed
                    if (params.decay) {
                        fallbackCommand += ' fade 0 ' + params.duration + ' ' + params.duration;
                    }
                    
                    // Try the fallback command
                    exec(fallbackCommand, (fallbackError, fallbackStdout, fallbackStderr) => {
                        if (fallbackError) {
                            console.error(`Fallback also failed for ${filename}:`, fallbackError);
                            // Create a placeholder file as last resort
                            generatePlaceholderFile(filename);
                        } else {
                            console.debug(`Generated ${filename} using fallback command`);
                        }
                    });
                    
                    return;
                }
                
                // Verify the file was created successfully
                if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                    console.debug(`✅ Successfully generated ${filename}`);
                    
                    // Special handling for music files
                    if (params.melody && filename.includes('theme')) {
                        console.debug(`Generated ${filename} (music track)`);
                        
                        // For music files with tempo, we could add additional processing here
                        if (params.tempo) {
                            console.debug(`Music tempo: ${params.tempo} BPM`);
                        }
                    }
                } else {
                    console.error(`❌ File generation failed for ${filename} (file is empty or doesn't exist)`);
                    // Create a placeholder as last resort
                    generatePlaceholderFile(filename);
                }
            });
        });
    });
}

// Generate a placeholder file for a specific sound
function generatePlaceholderFile(filename) {
    console.debug(`Generating placeholder for ${filename}...`);
    
    const outputPath = path.join(audioDir, filename);
    
    // Create an empty file with a valid WAV header
    fs.writeFileSync(outputPath, Buffer.from([
        // Simple WAV header (44 bytes)
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x24, 0x00, 0x00, 0x00, // Chunk size (36 + data size)
        0x57, 0x41, 0x56, 0x45, // "WAVE"
        0x66, 0x6D, 0x74, 0x20, // "fmt "
        0x10, 0x00, 0x00, 0x00, // Subchunk1 size (16)
        0x01, 0x00,             // Audio format (1 = PCM)
        0x01, 0x00,             // Number of channels (1)
        0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
        0x88, 0x58, 0x01, 0x00, // Byte rate (44100 * 1 * 2)
        0x02, 0x00,             // Block align (1 * 2)
        0x10, 0x00,             // Bits per sample (16)
        0x64, 0x61, 0x74, 0x61, // "data"
        0x00, 0x00, 0x00, 0x00  // Data size (0)
    ]));
    
    console.debug(`Generated placeholder for ${filename}`);
}

// Generate placeholder audio files if SoX is not available
function generatePlaceholderFiles() {
    console.debug('Generating placeholder audio files for all sounds...');
    
    Object.keys(sounds).forEach(filename => {
        generatePlaceholderFile(filename);
    });
}

// Try to generate audio files with SoX, fall back to placeholders
generateAudioFiles();

// If SoX fails, check for empty files after a delay and generate placeholders
setTimeout(() => {
    console.debug('Checking for empty or missing audio files...');
    
    // Get all sound files that should exist
    const expectedFiles = Object.keys(sounds);
    let emptyFiles = [];
    
    // Check each expected file
    expectedFiles.forEach(filename => {
        const filePath = path.join(audioDir, filename);
        
        // Check if file exists and has content
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            emptyFiles.push(filename);
        }
    });
    
    // Generate placeholders for any empty or missing files
    if (emptyFiles.length > 0) {
        console.debug(`Found ${emptyFiles.length} empty or missing audio files, creating placeholders...`);
        emptyFiles.forEach(filename => {
            generatePlaceholderFile(filename);
        });
    } else {
        console.debug('All audio files were generated successfully!');
    }
}, 10000); // Increased timeout to allow more time for generation

console.debug('Audio generation script started. Check the assets/audio directory for the generated files.');