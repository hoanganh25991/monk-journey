/**
 * CharacterModelTab.js
 * Manages the character model settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { ModelPreview } from '../ModelPreview.js';
import { CHARACTER_MODELS } from '../../config/player-models.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';

export class CharacterModelTab extends SettingsTab {
    /**
     * Create a character model settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('model-preview', game, settingsMenu);
        
        // Character model settings elements
        this.modelPreviewContainer = document.getElementById('model-preview-container');
        this.modelSelect = document.getElementById('model-select');
        this.prevModelButton = document.getElementById('prev-model-button');
        this.nextModelButton = document.getElementById('next-model-button');

        this.animationSelect = document.getElementById('animation-select');
        this.prevAnimButton = document.getElementById('prev-anim-button');
        this.nextAnimButton = document.getElementById('next-anim-button');

        this.resetCameraButton = document.getElementById('reset-camera-button');
        
        this.modelPreview = null;
        
        this.init();
    }
    
    /**
     * Initialize the character model settings
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        this.initializeModelOptions();
        this.setupModelNavigationButtons();
        this.initializeModelPreviewContainer();
        this.initializeAnimationOptions();
        return true;
    }
    
    /**
     * Initialize model options in the select element
     * @private
     */
    initializeModelOptions() {
        if (!this.modelSelect) return;
        
        // Clear existing options
        while (this.modelSelect.options.length > 0) {
            this.modelSelect.remove(0);
        }
        
        // Add model options
        CHARACTER_MODELS.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = model.name;
            this.modelSelect.appendChild(option);
        });
        
        // Get the stored selected model index or default to 0
        let selectedModelIndex = 0;
        const storedModelIndex = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
        
        if (storedModelIndex !== null && !isNaN(parseInt(storedModelIndex)) && 
            parseInt(storedModelIndex) >= 0 && parseInt(storedModelIndex) < CHARACTER_MODELS.length) {
            selectedModelIndex = parseInt(storedModelIndex);
        }
        
        // Set the selected model
        this.modelSelect.value = selectedModelIndex;
        
        // Add change event listeners
        this.modelSelect.addEventListener('change', () => {
            const selectedIndex = parseInt(this.modelSelect.value);
            localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, selectedIndex);
            
            // Update the model preview
            if (this.modelPreview) {
                const selectedModel = CHARACTER_MODELS[selectedIndex];
                if (selectedModel && selectedModel.modelPath) {
                    this.modelPreview.loadModel(selectedModel.modelPath, selectedModel.scale || 1.0);
                }
            }
        });
    }
    
    /**
     * Set up navigation buttons for model selection
     * @private
     */
    setupModelNavigationButtons() {
        if (this.prevModelButton) {
            this.prevModelButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.modelSelect.value);
                const newIndex = (currentIndex - 1 + CHARACTER_MODELS.length) % CHARACTER_MODELS.length;
                this.modelSelect.value = newIndex;
                this.modelSelect.dispatchEvent(new Event('change'));
            });
        }
        
        if (this.nextModelButton) {
            this.nextModelButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.modelSelect.value);
                const newIndex = (currentIndex + 1) % CHARACTER_MODELS.length;
                this.modelSelect.value = newIndex;
                this.modelSelect.dispatchEvent(new Event('change'));
            });
        }
        
        if (this.prevModelPreviewButton) {
            this.prevModelPreviewButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.modelPreviewSelect.value);
                const newIndex = (currentIndex - 1 + CHARACTER_MODELS.length) % CHARACTER_MODELS.length;
                this.modelPreviewSelect.value = newIndex;
                this.modelPreviewSelect.dispatchEvent(new Event('change'));
            });
        }
        
        if (this.nextModelPreviewButton) {
            this.nextModelPreviewButton.addEventListener('click', () => {
                const currentIndex = parseInt(this.modelPreviewSelect.value);
                const newIndex = (currentIndex + 1) % CHARACTER_MODELS.length;
                this.modelPreviewSelect.value = newIndex;
                this.modelPreviewSelect.dispatchEvent(new Event('change'));
            });
        }
    }
    
    /**
     * Initialize the model preview container
     * @private
     */
    initializeModelPreviewContainer() {
        if (!this.modelPreviewContainer) {
            console.error('ModelPreviewContainer not found in the DOM');
            return;
        }
        
        console.debug('Initializing model preview container');
        
        // Create model preview with specific dimensions
        this.modelPreview = new ModelPreview(this.modelPreviewContainer, 300, 485);
        
        // Get the selected model
        const selectedModelIndex = parseInt(this.modelSelect.value || 0);
        const selectedModel = selectedModelIndex >= 0 && selectedModelIndex < CHARACTER_MODELS.length ? 
            CHARACTER_MODELS[selectedModelIndex] : null;
        
        // Set the model
        if (selectedModel && selectedModel.modelPath) {
            console.debug(`Loading model: ${selectedModel.modelPath}`);
            const scale = selectedModel.baseScale || selectedModel.scale || 1.0;
            this.modelPreview.loadModel(selectedModel.modelPath, scale);
            
            // Get the selected animation
            const selectedAnimationIndex = parseInt(this.animationSelect.value || 0);
            
            // Set the animation
            if (selectedModel.animations && selectedModel.animations.length > 0) {
                const animation = selectedModel.animations[selectedAnimationIndex];
                if (animation && animation.name) {
                    console.debug(`Playing animation: ${animation.name}`);
                    this.modelPreview.playAnimation(animation.name);
                }
            }
        } else {
            console.error('Selected model not found or has no modelPath', selectedModel);
        }
    }
    
    /**
     * Initialize animation options in the select element
     * @private
     */
    initializeAnimationOptions() {
        if (!this.animationSelect) {
            console.error('Animation select elements not found in the DOM');
            return;
        }
        
        console.debug('Initializing animation options');
        
        // Get the selected model
        const selectedModelIndex = parseInt(this.modelSelect.value || 0);
        const selectedModel = selectedModelIndex >= 0 && selectedModelIndex < CHARACTER_MODELS.length ? 
            CHARACTER_MODELS[selectedModelIndex] : null;
            
        if (!selectedModel) {
            console.error('Selected model not found for animation options');
            return;
        }
        
        // Clear existing options
        while (this.animationSelect.options.length > 0) {
            this.animationSelect.remove(0);
        }
        
        // Add animation options
        if (selectedModel.animations && selectedModel.animations.length > 0) {
            console.debug(`Adding ${selectedModel.animations.length} animation options`);
            selectedModel.animations.forEach((animation, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = animation.displayName || animation.name || `Animation ${index + 1}`;
                this.animationSelect.appendChild(option);
                
                const previewOption = document.createElement('option');
                previewOption.value = index;
                previewOption.textContent = animation.displayName || animation.name || `Animation ${index + 1}`;
            });
        } else {
            console.warn('No animations found for the selected model');
            
            // Add a default "No animations" option
            const noAnimOption = document.createElement('option');
            noAnimOption.value = "0";
            noAnimOption.textContent = "No animations available";
            this.animationSelect.appendChild(noAnimOption);
            
            const noAnimPreviewOption = document.createElement('option');
            noAnimPreviewOption.value = "0";
            noAnimPreviewOption.textContent = "No animations available";
        }
        
        // Get the stored selected animation index or default to 0
        let selectedAnimationIndex = 0;
        const storedAnimationIndex = localStorage.getItem(STORAGE_KEYS.SELECTED_ANIMATION);
        
        if (storedAnimationIndex !== null && !isNaN(parseInt(storedAnimationIndex)) && 
            parseInt(storedAnimationIndex) >= 0 && selectedModel.animations && 
            parseInt(storedAnimationIndex) < selectedModel.animations.length) {
            selectedAnimationIndex = parseInt(storedAnimationIndex);
        }
        
        // Set the selected animation
        this.animationSelect.value = selectedAnimationIndex;
        
        // Add change event listeners
        this.animationSelect.addEventListener('change', () => {
            const selectedIndex = parseInt(this.animationSelect.value);
            localStorage.setItem(STORAGE_KEYS.SELECTED_ANIMATION, selectedIndex);
            
            // Get the current selected model
            const modelIndex = parseInt(this.modelSelect.value || 0);
            const currentModel = modelIndex >= 0 && modelIndex < CHARACTER_MODELS.length ? 
                CHARACTER_MODELS[modelIndex] : null;
            
            // Update the model preview animation
            if (this.modelPreview && currentModel && currentModel.animations && 
                currentModel.animations.length > 0 && selectedIndex < currentModel.animations.length) {
                const animation = currentModel.animations[selectedIndex];
                if (animation && animation.name) {
                    this.modelPreview.playAnimation(animation.name);
                }
            }
        });
        
        // Set up animation navigation buttons
        if (this.prevAnimButton) {
            this.prevAnimButton.addEventListener('click', () => {
                // Get the current selected model
                const modelIndex = parseInt(this.modelSelect.value || 0);
                const currentModel = modelIndex >= 0 && modelIndex < CHARACTER_MODELS.length ? 
                    CHARACTER_MODELS[modelIndex] : null;
                
                if (!currentModel || !currentModel.animations || currentModel.animations.length === 0) return;
                
                const currentIndex = parseInt(this.animationSelect.value);
                const newIndex = (currentIndex - 1 + currentModel.animations.length) % currentModel.animations.length;
                this.animationSelect.value = newIndex;
                this.animationSelect.dispatchEvent(new Event('change'));
            });
        }
        
        if (this.nextAnimButton) {
            this.nextAnimButton.addEventListener('click', () => {
                // Get the current selected model
                const modelIndex = parseInt(this.modelSelect.value || 0);
                const currentModel = modelIndex >= 0 && modelIndex < CHARACTER_MODELS.length ? 
                    CHARACTER_MODELS[modelIndex] : null;
                
                if (!currentModel || !currentModel.animations || currentModel.animations.length === 0) return;
                
                const currentIndex = parseInt(this.animationSelect.value);
                const newIndex = (currentIndex + 1) % currentModel.animations.length;
                this.animationSelect.value = newIndex;
                this.animationSelect.dispatchEvent(new Event('change'));
            });
        }
    }
    
    /**
     * Resize the model preview to fit the container
     */
    resize() {
        this.resizeModelPreview();
    }
    
    /**
     * Resize the model preview to fit the container
     * @private
     */
    resizeModelPreview() {
        if (!this.modelPreview) return;
        
        const container = this.modelPreviewContainer;
        if (!container) return;
        
        // Get the container dimensions
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Update the model preview size
        this.modelPreview.setSize(width, height);
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // Resize the model preview when the tab is activated
        setTimeout(() => {
            this.resize();
        }, 50);
    }
    
    /**
     * Save the character model settings
     */
    saveSettings() {
        if (this.modelSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, this.modelSelect.value);
        }
        
        if (this.sizeSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_SIZE, this.sizeSelect.value);
        }
        
        if (this.animationSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_ANIMATION, this.animationSelect.value);
        }
    }
}