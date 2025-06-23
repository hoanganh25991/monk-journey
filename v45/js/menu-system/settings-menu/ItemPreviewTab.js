/**
 * ItemPreviewTab.js
 * Manages the item preview tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { ItemPreview } from '../ItemPreview.js';
import { ItemGenerator } from '../../entities/items/ItemGenerator.js';
import { ITEM_TEMPLATES } from '../../config/item-templates.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';

export class ItemPreviewTab extends SettingsTab {
    /**
     * Create an item preview tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('item-preview', game, settingsMenu);
        
        // Item preview elements
        this.itemPreviewContainer = document.getElementById('item-preview-container');
        this.itemTypeSelect = document.getElementById('item-type-select');
        this.itemSubTypeSelect = document.getElementById('item-sub-type-select');
        this.itemRaritySelect = document.getElementById('item-rarity-select');
        this.prevItemButton = document.getElementById('prev-item-button');
        this.nextItemButton = document.getElementById('next-item-button');
        this.itemDetailsContainer = document.getElementById('item-details');
        this.resetItemCameraButton = document.getElementById('reset-item-camera-button');
        this.generateRandomItemButton = document.getElementById('generate-random-item-button');
        
        this.itemPreview = null;
        this.currentItem = null;
        
        // Group items by type and subtype
        this.itemsByType = {};
        this.currentItemIndex = 0;
        this.filteredItems = [];
        
        this.init();
    }
    
    /**
     * Initialize the item preview
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Group items by type and subtype
        this.groupItemsByType();
        
        // Initialize item type select dropdown
        this.initializeItemTypeOptions();
        
        // Initialize item subtype select dropdown
        this.initializeItemSubTypeOptions();
        
        // Initialize item rarity select dropdown
        this.initializeItemRarityOptions();
        
        // Set up navigation buttons for item preview
        this.setupItemNavigationButtons();
        
        // Initialize the item preview container
        this.initializeItemPreviewContainer();
        
        // Set up generate random item button
        this.setupGenerateRandomItemButton();
        
        return true;
    }
    
    /**
     * Group items by type and subtype
     * @private
     */
    groupItemsByType() {
        this.itemsByType = {};
        
        // Group items by type and subtype
        ITEM_TEMPLATES.forEach(item => {
            if (!this.itemsByType[item.type]) {
                this.itemsByType[item.type] = {};
            }
            
            if (!this.itemsByType[item.type][item.subType]) {
                this.itemsByType[item.type][item.subType] = [];
            }
            
            this.itemsByType[item.type][item.subType].push(item);
        });
    }
    
    /**
     * Initialize item type options in the select element
     * @private
     */
    initializeItemTypeOptions() {
        if (!this.itemTypeSelect) return;
        
        // Clear existing options
        while (this.itemTypeSelect.options.length > 0) {
            this.itemTypeSelect.remove(0);
        }
        
        // Add "All" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Types';
        this.itemTypeSelect.appendChild(allOption);
        
        // Add item type options
        Object.keys(this.itemsByType).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = this.capitalizeFirstLetter(type);
            this.itemTypeSelect.appendChild(option);
        });
        
        // Get the stored selected item type or default to 'all'
        let selectedItemType = 'all';
        const storedItemType = localStorage.getItem(STORAGE_KEYS.SELECTED_ITEM_TYPE);
        
        if (storedItemType && (storedItemType === 'all' || this.itemsByType[storedItemType])) {
            selectedItemType = storedItemType;
        }
        
        // Set the selected item type
        this.itemTypeSelect.value = selectedItemType;
        
        // Add change event listener
        this.itemTypeSelect.addEventListener('change', () => {
            const selectedType = this.itemTypeSelect.value;
            localStorage.setItem(STORAGE_KEYS.SELECTED_ITEM_TYPE, selectedType);
            
            // Update the item subtype options
            this.initializeItemSubTypeOptions();
            
            // Update the filtered items
            this.updateFilteredItems();
            
            // Reset the current item index
            this.currentItemIndex = 0;
            
            // Update the current item
            this.updateCurrentItem();
        });
    }
    
    /**
     * Initialize item subtype options in the select element
     * @private
     */
    initializeItemSubTypeOptions() {
        if (!this.itemSubTypeSelect) return;
        
        // Clear existing options
        while (this.itemSubTypeSelect.options.length > 0) {
            this.itemSubTypeSelect.remove(0);
        }
        
        // Add "All" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Subtypes';
        this.itemSubTypeSelect.appendChild(allOption);
        
        // Get the selected item type
        const selectedType = this.itemTypeSelect.value;
        
        // Add item subtype options
        if (selectedType !== 'all' && this.itemsByType[selectedType]) {
            Object.keys(this.itemsByType[selectedType]).forEach(subType => {
                const option = document.createElement('option');
                option.value = subType;
                option.textContent = this.capitalizeFirstLetter(subType);
                this.itemSubTypeSelect.appendChild(option);
            });
        }
        
        // Get the stored selected item subtype or default to 'all'
        let selectedItemSubType = 'all';
        const storedItemSubType = localStorage.getItem(STORAGE_KEYS.SELECTED_ITEM_SUBTYPE);
        
        if (storedItemSubType && (storedItemSubType === 'all' || 
            (selectedType !== 'all' && this.itemsByType[selectedType] && 
             this.itemsByType[selectedType][storedItemSubType]))) {
            selectedItemSubType = storedItemSubType;
        }
        
        // Set the selected item subtype
        this.itemSubTypeSelect.value = selectedItemSubType;
        
        // Add change event listener
        this.itemSubTypeSelect.addEventListener('change', () => {
            const selectedSubType = this.itemSubTypeSelect.value;
            localStorage.setItem(STORAGE_KEYS.SELECTED_ITEM_SUBTYPE, selectedSubType);
            
            // Update the filtered items
            this.updateFilteredItems();
            
            // Reset the current item index
            this.currentItemIndex = 0;
            
            // Update the current item
            this.updateCurrentItem();
        });
    }
    
    /**
     * Initialize item rarity options in the select element
     * @private
     */
    initializeItemRarityOptions() {
        if (!this.itemRaritySelect) return;
        
        // Clear existing options
        while (this.itemRaritySelect.options.length > 0) {
            this.itemRaritySelect.remove(0);
        }
        
        // Add "All" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Rarities';
        this.itemRaritySelect.appendChild(allOption);
        
        // Add item rarity options
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        rarities.forEach(rarity => {
            const option = document.createElement('option');
            option.value = rarity;
            option.textContent = this.capitalizeFirstLetter(rarity);
            this.itemRaritySelect.appendChild(option);
        });
        
        // Get the stored selected item rarity or default to 'all'
        let selectedItemRarity = 'all';
        const storedItemRarity = localStorage.getItem(STORAGE_KEYS.SELECTED_ITEM_RARITY);
        
        if (storedItemRarity && (storedItemRarity === 'all' || rarities.includes(storedItemRarity))) {
            selectedItemRarity = storedItemRarity;
        }
        
        // Set the selected item rarity
        this.itemRaritySelect.value = selectedItemRarity;
        
        // Add change event listener
        this.itemRaritySelect.addEventListener('change', () => {
            const selectedRarity = this.itemRaritySelect.value;
            localStorage.setItem(STORAGE_KEYS.SELECTED_ITEM_RARITY, selectedRarity);
            
            // Update the filtered items
            this.updateFilteredItems();
            
            // Reset the current item index
            this.currentItemIndex = 0;
            
            // Update the current item
            this.updateCurrentItem();
        });
    }
    
    /**
     * Update the filtered items based on the selected filters
     * @private
     */
    updateFilteredItems() {
        const selectedType = this.itemTypeSelect.value;
        const selectedSubType = this.itemSubTypeSelect.value;
        const selectedRarity = this.itemRaritySelect.value;
        
        // Filter items based on selected type and subtype
        this.filteredItems = [];
        
        if (selectedType === 'all') {
            // Include all items
            Object.values(this.itemsByType).forEach(subtypes => {
                Object.values(subtypes).forEach(items => {
                    this.filteredItems.push(...items);
                });
            });
        } else if (selectedSubType === 'all') {
            // Include all items of the selected type
            Object.values(this.itemsByType[selectedType] || {}).forEach(items => {
                this.filteredItems.push(...items);
            });
        } else {
            // Include only items of the selected type and subtype
            this.filteredItems = [...(this.itemsByType[selectedType]?.[selectedSubType] || [])];
        }
        
        // If a specific rarity is selected, generate items with that rarity
        if (selectedRarity !== 'all') {
            // We'll generate items with the selected rarity when needed
            // For now, just keep the filtered items as is
        }
        
        console.debug(`Filtered items: ${this.filteredItems.length}`);
    }
    
    /**
     * Set up navigation buttons for item preview
     * @private
     */
    setupItemNavigationButtons() {
        if (this.prevItemButton) {
            this.prevItemButton.addEventListener('click', () => {
                if (this.filteredItems.length === 0) return;
                
                this.currentItemIndex = (this.currentItemIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
                this.updateCurrentItem();
            });
        }
        
        if (this.nextItemButton) {
            this.nextItemButton.addEventListener('click', () => {
                if (this.filteredItems.length === 0) return;
                
                this.currentItemIndex = (this.currentItemIndex + 1) % this.filteredItems.length;
                this.updateCurrentItem();
            });
        }
    }
    
    /**
     * Set up generate random item button
     * @private
     */
    setupGenerateRandomItemButton() {
        if (this.generateRandomItemButton) {
            this.generateRandomItemButton.addEventListener('click', () => {
                this.generateRandomItem();
            });
        }
    }
    
    /**
     * Generate a random item based on the selected filters
     * @private
     */
    generateRandomItem() {
        if (!this.itemPreview) return;
        
        const selectedType = this.itemTypeSelect.value;
        const selectedSubType = this.itemSubTypeSelect.value;
        const selectedRarity = this.itemRaritySelect.value;
        
        // Generate options for the item generator
        const options = {
            level: this.game.player ? this.game.player.stats.getLevel() : 1
        };
        
        // Add type if selected
        if (selectedType !== 'all') {
            options.type = selectedType;
        }
        
        // Add subtype if selected
        if (selectedSubType !== 'all') {
            options.subType = selectedSubType;
        }
        
        // Add rarity if selected
        if (selectedRarity !== 'all') {
            options.rarity = selectedRarity;
        }
        
        // Generate the item using the ItemPreview's generator
        const item = this.itemPreview.generateRandomItem(options);
        
        // Set as current item
        this.currentItem = item;
        
        // Update the item details
        this.updateItemDetails();
    }
    
    /**
     * Initialize the item preview container
     * @private
     */
    initializeItemPreviewContainer() {
        if (!this.itemPreviewContainer) return;
        
        // Create item preview with game instance
        this.itemPreview = new ItemPreview(this.itemPreviewContainer, 
                                          this.itemPreviewContainer.clientWidth, 
                                          this.itemPreviewContainer.clientHeight, 
                                          this.game);
        
        // Update the filtered items
        this.updateFilteredItems();
        
        // Update the current item
        this.updateCurrentItem();
        
        // Set up reset camera button
        if (this.resetItemCameraButton) {
            this.resetItemCameraButton.addEventListener('click', () => {
                if (this.itemPreview) {
                    this.itemPreview.resetCamera();
                }
            });
        }
    }
    
    /**
     * Update the current item
     * @private
     */
    updateCurrentItem() {
        if (!this.itemPreview) return;
        
        if (this.filteredItems.length === 0) {
            this.currentItem = null;
            this.itemPreview.loadItemModel(null);
        } else {
            const template = this.filteredItems[this.currentItemIndex];
            
            // Get the selected rarity
            const selectedRarity = this.itemRaritySelect.value;
            
            if (selectedRarity === 'all') {
                // Use the template as is
                this.currentItem = template;
                this.itemPreview.loadItemModel(template);
            } else {
                // Generate an item with the selected rarity using the ItemPreview's generator
                this.currentItem = this.itemPreview.generateSpecificItem(
                    template.type,
                    template.subType,
                    selectedRarity,
                    this.game.player ? this.game.player.stats.getLevel() : 1
                );
            }
        }
        
        // Update the item details
        this.updateItemDetails();
    }
    
    /**
     * Update the item details display
     * @private
     */
    updateItemDetails() {
        if (!this.itemDetailsContainer) return;
        
        if (!this.currentItem) {
            this.itemDetailsContainer.innerHTML = '<p>No item selected</p>';
            return;
        }
        
        // Get rarity color
        const rarityColor = this.getRarityColor(this.currentItem.rarity);
        
        // Create the item details HTML
        let html = `
            <h3 style="color: ${rarityColor};">${this.currentItem.name || 'Unknown Item'}</h3>
            <p>${this.currentItem.description || 'No description available.'}</p>
            <div class="item-stats">
                <div class="item-stat">
                    <span class="stat-label">Type:</span>
                    <span class="stat-value">${this.capitalizeFirstLetter(this.currentItem.type || 'Unknown')}</span>
                </div>
                <div class="item-stat">
                    <span class="stat-label">Subtype:</span>
                    <span class="stat-value">${this.capitalizeFirstLetter(this.currentItem.subType || 'Unknown')}</span>
                </div>
                <div class="item-stat">
                    <span class="stat-label">Rarity:</span>
                    <span class="stat-value" style="color: ${rarityColor};">${this.capitalizeFirstLetter(this.currentItem.rarity || 'Common')}</span>
                </div>
        `;
        
        // Add base stats
        if (this.currentItem.baseStats && Object.keys(this.currentItem.baseStats).length > 0) {
            html += '<h4>Base Stats</h4>';
            
            for (const [key, value] of Object.entries(this.currentItem.baseStats)) {
                html += `
                    <div class="item-stat">
                        <span class="stat-label">${this.formatStatName(key)}:</span>
                        <span class="stat-value">${value}</span>
                    </div>
                `;
            }
        }
        
        // Add secondary stats
        if (this.currentItem.secondaryStats && this.currentItem.secondaryStats.length > 0) {
            html += '<h4>Secondary Stats</h4>';
            
            this.currentItem.secondaryStats.forEach(stat => {
                let statText = `${stat.value}`;
                
                if (stat.element) {
                    statText += ` ${this.capitalizeFirstLetter(stat.element)}`;
                }
                
                html += `
                    <div class="item-stat">
                        <span class="stat-label">${this.formatStatName(stat.type)}:</span>
                        <span class="stat-value">${statText}</span>
                    </div>
                `;
            });
        }
        
        // Add special effects
        if (this.currentItem.specialEffects && this.currentItem.specialEffects.length > 0) {
            html += '<h4>Special Effects</h4>';
            
            this.currentItem.specialEffects.forEach(effect => {
                html += `
                    <div class="item-effect">
                        <span class="effect-name">${effect.name || 'Unknown Effect'}</span>
                        <p class="effect-description">${effect.description || 'No description available.'}</p>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
        // Set the item details HTML
        this.itemDetailsContainer.innerHTML = html;
    }
    
    /**
     * Get the color for a rarity
     * @param {string} rarity - The rarity
     * @returns {string} - The color
     * @private
     */
    getRarityColor(rarity) {
        const rarityColors = {
            common: '#FFFFFF',
            uncommon: '#1EFF00',
            rare: '#0070DD',
            epic: '#A335EE',
            legendary: '#FF8000',
            mythic: '#FF0000'
        };
        
        return rarityColors[rarity] || '#FFFFFF';
    }
    
    /**
     * Format a stat name for display
     * @param {string} statName - The stat name
     * @returns {string} - The formatted stat name
     * @private
     */
    formatStatName(statName) {
        // Replace camelCase with spaces
        const formatted = statName.replace(/([A-Z])/g, ' $1');
        
        // Capitalize first letter
        return this.capitalizeFirstLetter(formatted);
    }
    
    /**
     * Capitalize the first letter of a string
     * @param {string} string - The string to capitalize
     * @returns {string} - The capitalized string
     * @private
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Resize the item preview to fit the container
     */
    resize() {
        this.resizeItemPreview();
    }
    
    /**
     * Resize the item preview to fit the container
     * @private
     */
    resizeItemPreview() {
        if (!this.itemPreview) return;
        
        const container = this.itemPreviewContainer;
        if (!container) return;
        
        // Get the container dimensions
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Update the item preview size
        this.itemPreview.setSize(width, height);
    }
    
    /**
     * Called when the tab is activated
     */
    onActivate() {
        // Resize the item preview when the tab is activated
        setTimeout(() => {
            this.resize();
        }, 50);
    }
    
    /**
     * Save the item preview settings
     */
    saveSettings() {
        if (this.itemTypeSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_ITEM_TYPE, this.itemTypeSelect.value);
        }
        
        if (this.itemSubTypeSelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_ITEM_SUBTYPE, this.itemSubTypeSelect.value);
        }
        
        if (this.itemRaritySelect) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_ITEM_RARITY, this.itemRaritySelect.value);
        }
    }
}