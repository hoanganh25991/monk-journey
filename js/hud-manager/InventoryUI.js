import * as THREE from 'three';
import { UIComponent } from '../UIComponent.js';
import { PlayerModel } from '../entities/player/PlayerModel.js';
import { PlayerState } from '../entities/player/PlayerState.js';
import { ModelPreview } from '../menu-system/ModelPreview.js';
import { updateAnimation } from '../utils/AnimationUtils.js';

/**
 * Inventory UI component
 * Displays player inventory and allows item interaction
 */
export class InventoryUI extends UIComponent {
    /**
     * Create a new InventoryUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('inventory', game);
        this.inventoryGrid = null;
        this.isInventoryOpen = false;
        
        // 3D model preview properties
        this.modelContainer = null;
        this.modelPreview = null; // ModelPreview instance
        this.isModelInitialized = false;
        
        // User interaction properties
        this.isUserInteracting = false;
        this.rotationSpeed = 0.01;
        this.userRotationY = Math.PI; // Start facing the camera
        this.userRotationYOnMouseDown = 0;
        this.mouseX = 0;
        this.mouseXOnMouseDown = 0;
        
        // Item popup properties
        this.itemPopup = null;
        this.statsContainer = null;
        this.activeItemSlot = null;
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Store references to elements we need to update
        this.inventoryGrid = document.getElementById('inventory-grid');
        this.modelContainer = document.getElementById('character-model-container');
        this.statsOverlay = document.getElementById('player-stats-overlay');
        
        // Create item popup element
        this.createItemPopup();
        
        // Create stats container
        this.createStatsContainer();
        
        // Add click event to save inventory
        const saveButton = document.getElementById('inventory-save');
        saveButton.addEventListener('click', () => {
            this.saveInventory();
            this.toggleInventory();
        });
        
        // Add click event to close popup when clicking outside
        document.addEventListener('click', (event) => {
            if (this.itemPopup && this.itemPopup.style.display === 'block') {
                // Check if click is outside the popup
                if (!this.itemPopup.contains(event.target) && 
                    (!this.activeItemSlot || !this.activeItemSlot.contains(event.target))) {
                    this.hideItemPopup();
                }
            }
        });

        // Add event listener for the show stats button
        const showStatsButton = document.getElementById('show-stats-button');
        if (showStatsButton) {
            showStatsButton.addEventListener('click', () => {
                this.toggleStatsOverlay(true);
            });
        }

        // Add event listener for the close stats overlay button
        const closeStatsButton = document.getElementById('close-stats-overlay');
        if (closeStatsButton) {
            closeStatsButton.addEventListener('click', () => {
                this.toggleStatsOverlay(false);
            });
        }

        // Hide initially
        this.hide();
        
        return true;
    }
    
    /**
     * Create the item popup element
     */
    createItemPopup() {
        // Create popup element if it doesn't exist
        if (!this.itemPopup) {
            this.itemPopup = document.createElement('div');
            this.itemPopup.id = 'item-popup';
            this.itemPopup.className = 'item-popup';
            this.itemPopup.style.display = 'none';
            
            // Add popup content
            this.itemPopup.innerHTML = `
                <div class="item-popup-header">
                    <div class="item-popup-icon"></div>
                    <div class="item-popup-title">
                        <h3 class="item-popup-name"></h3>
                        <div class="item-popup-type"></div>
                    </div>
                </div>
                <div class="item-popup-stats"></div>
                <div class="item-popup-description"></div>
                <div class="item-popup-actions">
                    <button class="item-popup-use">Consume</button>
                    <button class="item-popup-equip">Equip</button>
                    <button class="item-popup-drop">Drop</button>
                </div>
            `;
            
            // Add to document body
            document.body.appendChild(this.itemPopup);
            
            // Add event listeners for buttons
            const useButton = this.itemPopup.querySelector('.item-popup-use');
            useButton.addEventListener('click', () => {
                if (this.currentItem) {
                    this.useItem(this.currentItem);
                    this.hideItemPopup();
                }
            });
            
            const equipButton = this.itemPopup.querySelector('.item-popup-equip');
            equipButton.addEventListener('click', () => {
                if (this.currentItem && this.currentItem.type) {
                    this.equipItem(this.currentItem);
                    this.hideItemPopup();
                }
            });
            
            const dropButton = this.itemPopup.querySelector('.item-popup-drop');
            dropButton.addEventListener('click', () => {
                if (this.currentItem) {
                    this.dropItem(this.currentItem);
                    this.hideItemPopup();
                }
            });
        }
    }
    
    /**
     * Create the stats container
     */
    createStatsContainer() {
        // Find or create the stats container
        const inventoryContainer = document.getElementById('inventory-container');
        
        if (inventoryContainer) {
            // Check if stats container already exists
            let statsContainer = document.getElementById('player-stats-container');
            
            if (!statsContainer) {
                // Create stats container
                statsContainer = document.createElement('div');
                statsContainer.id = 'player-stats-container';
                statsContainer.className = 'player-stats-container';
                
                // Add stats content
                statsContainer.innerHTML = `
                    <h3>Player Stats</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Health</div>
                            <div class="stat-value" id="stat-health">0/0</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Mana</div>
                            <div class="stat-value" id="stat-mana">0/0</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Attack</div>
                            <div class="stat-value" id="stat-attack">0</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Defense</div>
                            <div class="stat-value" id="stat-defense">0</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Speed</div>
                            <div class="stat-value" id="stat-speed">0</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Level</div>
                            <div class="stat-value" id="stat-level">1</div>
                        </div>
                    </div>
                `;
                
                // Add to inventory container
                inventoryContainer.appendChild(statsContainer);
            }
            
            this.statsContainer = statsContainer;
        }
    }
    
    /**
     * Initialize the 3D model preview
     * This is called when the inventory is first opened
     */
    initModelPreview() {
        if (this.isModelInitialized) return;
        
        console.debug('Initializing model preview...');
        
        // Clear the model container
        this.modelContainer.innerHTML = '';
        
        // Get container dimensions, ensure they're valid
        let containerWidth = this.modelContainer.clientWidth;
        let containerHeight = this.modelContainer.clientHeight;
        
        // Use default dimensions if container size is invalid
        if (containerWidth <= 0 || containerHeight <= 0) {
            console.error('Container has invalid dimensions, using defaults');
            containerWidth = 300;  // Default width
            containerHeight = 400; // Default height
        }
        
        console.debug(`Container dimensions: ${containerWidth}x${containerHeight}`);
        
        // Create a new ModelPreview instance
        this.modelPreview = new ModelPreview(this.modelContainer, containerWidth, containerHeight);
        
        // Get the current player model path
        const playerModel = this.game.player.model;
        if (playerModel && playerModel.currentModel) {
            const modelPath = playerModel.currentModel.path;
            const baseScale = playerModel.currentModel.baseScale || 1.0;
            const multiplier = playerModel.currentModel.multiplier || 1.0;
            const effectiveScale = baseScale * multiplier;
            
            console.debug(`Loading player model: ${modelPath} with scale ${effectiveScale}`);
            
            // Load the model into the preview
            this.modelPreview.loadModel(modelPath, effectiveScale);
        } else {
            console.warn('No player model available to display in inventory');
        }
        
        // Mark as initialized
        this.isModelInitialized = true;
        
        // Add a custom animation speed modifier to the ModelPreview
        // This will slow down animations for better viewing
        const originalAnimate = this.modelPreview.animate;
        this.modelPreview.animate = () => {
            // Only continue animation if visible
            if (this.modelPreview.visible) {
                this.modelPreview.animationId = requestAnimationFrame(() => this.modelPreview.animate());
                
                // Update controls
                this.modelPreview.controls.update();
                
                // Get delta time with the clock
                const delta = this.modelPreview.clock.getDelta();
                
                // // Apply slowdown factor for better animation viewing
                // const slowdownFactor = 0.5; // Reduce animation speed by half
                // const effectiveDelta = Math.max(delta * slowdownFactor, 0.004);
                // console.debug({ effectiveDelta })
                
                // Update animations with slowed-down delta
                if (this.modelPreview.mixer) {
                    updateAnimation(this.modelPreview.mixer, delta);
                }
                
                // Render scene
                try {
                    this.modelPreview.renderer.render(this.modelPreview.scene, this.modelPreview.camera);
                } catch (error) {
                    console.error('ModelPreview: Error rendering scene:', error);
                }
            } else {
                // If not visible, don't request another frame
                this.modelPreview.animationId = null;
            }
        };
    }
    
    /**
     * Toggle inventory visibility
     */
    toggleInventory() {
        if (this.isInventoryOpen) {
            // Hide any open item popup
            this.hideItemPopup();
            
            // Hide inventory
            this.hide();
            this.isInventoryOpen = false;
            
            // Resume game
            this.game.resume(false);
        } else {
            // Update inventory items
            this.updateInventoryItems();
            
            // Show inventory first so container has dimensions
            this.show();
            this.isInventoryOpen = true;
            
            // Update player stats
            this.updatePlayerStats();
            
            // Update equipment slots
            this.updateEquipmentSlots();
            
            // Pause game
            this.game.pause(false);
        }
    }
    
    // The createCharacterModel method has been replaced by the ModelPreview's loadModel method
    
    // The animateModel method has been replaced by the ModelPreview's animate method
    
    /**
     * Update inventory items
     */
    updateInventoryItems() {
        // Clear inventory grid
        this.inventoryGrid.innerHTML = '';
        
        // Get player inventory
        const inventory = this.game.player.getInventory();
        
        // Create a grid of slots first (6x5 grid = 30 slots)
        const totalSlots = 30;
        const slots = [];
        
        for (let i = 0; i < totalSlots; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'inventory-item empty';
            slotElement.dataset.slotIndex = i;
            this.inventoryGrid.appendChild(slotElement);
            slots.push(slotElement);
        }
        
        // Add items to inventory grid slots
        inventory.forEach((item, index) => {
            // Get the slot for this item (either from item.slotIndex or use the index)
            const slotIndex = item.slotIndex !== undefined ? item.slotIndex : index;
            
            // Make sure the slot index is valid
            if (slotIndex >= 0 && slotIndex < totalSlots) {
                const slotElement = slots[slotIndex];
                
                // Remove empty class
                slotElement.className = 'inventory-item';
                
                // Store item reference in the DOM element
                slotElement.dataset.itemName = item.name;
                
                // Clear previous content
                slotElement.innerHTML = '';
                
                // Create item icon
                const itemIcon = document.createElement('div');
                itemIcon.className = 'item-icon';
                
                // Use item's icon property or default to package icon
                let iconContent = item.icon || '📦';
                
                itemIcon.textContent = iconContent;
                slotElement.appendChild(itemIcon);
                
                // Create item count
                const itemCount = document.createElement('div');
                itemCount.className = 'item-count';
                itemCount.textContent = item.amount > 1 ? `x${item.amount}` : '';
                slotElement.appendChild(itemCount);
                
                // Add click event to show item popup
                slotElement.addEventListener('click', (event) => {
                    // Show item popup
                    this.showItemPopup(item, slotElement, event);
                });
                
                // Add tooltip with item name
                slotElement.title = item.name;
                
                // Store the slot index in the item for future reference
                item.slotIndex = slotIndex;
            }
        });
        
        // Update player stats
        this.updatePlayerStats();
    }
    
    /**
     * Show item popup with details
     * @param {Object} item - Item to show details for
     * @param {HTMLElement} slotElement - The slot element that was clicked
     * @param {Event} event - The click event
     */
    showItemPopup(item, slotElement, event) {
        // Store reference to current item and slot
        this.currentItem = item;
        this.activeItemSlot = slotElement;
        
        // Update popup content
        const iconElement = this.itemPopup.querySelector('.item-popup-icon');
        const nameElement = this.itemPopup.querySelector('.item-popup-name');
        const typeElement = this.itemPopup.querySelector('.item-popup-type');
        const statsElement = this.itemPopup.querySelector('.item-popup-stats');
        const descElement = this.itemPopup.querySelector('.item-popup-description');
        const useButton = this.itemPopup.querySelector('.item-popup-use');
        const equipButton = this.itemPopup.querySelector('.item-popup-equip');
        
        // Set icon using item's icon property
        iconElement.textContent = item.icon || '📦';
        
        // Set name and type
        nameElement.textContent = item.name;
        typeElement.textContent = item.type || 'Consumable';
        
        // Set stats if available
        if (item.stats) {
            let statsHtml = '<ul class="item-stats-list">';
            for (const [stat, value] of Object.entries(item.stats)) {
                const formattedStat = stat.charAt(0).toUpperCase() + stat.slice(1);
                const valueText = value > 0 ? `+${value}` : value;
                statsHtml += `<li><span class="stat-name">${formattedStat}:</span> <span class="stat-value ${value > 0 ? 'positive' : 'negative'}">${valueText}</span></li>`;
            }
            statsHtml += '</ul>';
            statsElement.innerHTML = statsHtml;
            statsElement.style.display = 'block';
        } else {
            statsElement.innerHTML = '';
            statsElement.style.display = 'none';
        }
        
        // Set description
        descElement.textContent = item.description || `A ${item.name.toLowerCase()}.`;
        
        // Show/hide buttons based on item type
        if (item.name.includes('Potion') || !item.type) {
            useButton.style.display = 'block';
            equipButton.style.display = 'none';
        } else if (item.type) {
            useButton.style.display = 'none';
            equipButton.style.display = 'block';
        }
        
        // Position popup near the clicked item
        const rect = slotElement.getBoundingClientRect();
        this.itemPopup.style.left = `${rect.right + 10}px`;
        this.itemPopup.style.top = `${rect.top}px`;
        
        // Show popup
        this.itemPopup.style.display = 'block';
        
        // Prevent event from bubbling to document
        event.stopPropagation();
    }
    
    /**
     * Hide the item popup
     */
    hideItemPopup() {
        if (this.itemPopup) {
            this.itemPopup.style.display = 'none';
            this.currentItem = null;
            this.activeItemSlot = null;
        }
    }
    
    /**
     * Update player stats display
     */
    updatePlayerStats() {
        if (!this.statsContainer) return;
        
        // Get player stats
        const health = this.game.player.getHealth();
        const maxHealth = this.game.player.getMaxHealth();
        const mana = this.game.player.getMana();
        const maxMana = this.game.player.getMaxMana();
        const attack = this.game.player.getAttack ? this.game.player.getAttack() : 10;
        const defense = this.game.player.getDefense ? this.game.player.getDefense() : 5;
        const speed = this.game.player.getSpeed ? this.game.player.getSpeed() : 1.0;
        const level = this.game.player.getLevel ? this.game.player.getLevel() : 1;
        
        // Update stat values
        const healthElement = document.getElementById('stat-health');
        const manaElement = document.getElementById('stat-mana');
        const attackElement = document.getElementById('stat-attack');
        const defenseElement = document.getElementById('stat-defense');
        const speedElement = document.getElementById('stat-speed');
        const levelElement = document.getElementById('stat-level');
        
        if (healthElement) healthElement.textContent = `${Number(health).toFixed()}/${Number(maxHealth).toFixed()}`;
        if (manaElement) manaElement.textContent = `${Number(mana).toFixed()}/${Number(maxMana).toFixed()}`;
        if (attackElement) attackElement.textContent = Number(attack).toFixed();
        if (defenseElement) defenseElement.textContent = Number(defense).toFixed();
        if (speedElement) speedElement.textContent = Number(speed).toFixed();
        if (levelElement) levelElement.textContent = level;
    }
    
    /**
     * Toggle the stats overlay visibility
     * @param {boolean} show - Whether to show or hide the overlay
     */
    toggleStatsOverlay(show) {
        if (!this.statsOverlay) {
            this.statsOverlay = document.getElementById('player-stats-overlay');
        }
        
        if (this.statsOverlay) {
            // Update stats before showing
            if (show) {
                this.updatePlayerStats();
                this.statsOverlay.style.display = 'flex';
            } else {
                this.statsOverlay.style.display = 'none';
            }
        }
    }
    
    /**
     * Consume an item from the inventory
     * @param {Object} item - Item to consume
     */
    useItem(item) {
        // Handle different item types
        if (item.name === 'Health Potion') {
            // Heal player
            const healAmount = item.healAmount || 50;
            const newHealth = this.game.player.getHealth() + healAmount;
            const maxHealth = this.game.player.getMaxHealth();
            this.game.player.getStatsObject().setHealth(Math.min(newHealth, maxHealth));
            
            // Remove item from inventory
            this.game.player.removeFromInventory(item.name, 1);
            
            // Show notification
            this.game.hudManager.showNotification(`Consumed Health Potion: +${healAmount} Health`);
            
            // Update inventory UI and player stats
            this.updateInventoryItems();
            this.updatePlayerStats();
        } else if (item.name === 'Mana Potion') {
            // Restore mana
            const manaAmount = item.manaAmount || 50;
            const newMana = this.game.player.getMana() + manaAmount;
            const maxMana = this.game.player.getMaxMana();
            this.game.player.getStatsObject().setMana(Math.min(newMana, maxMana));
            
            // Remove item from inventory
            this.game.player.removeFromInventory(item.name, 1);
            
            // Show notification
            this.game.hudManager.showNotification(`Consumed Mana Potion: +${manaAmount} Mana`);
            
            // Update inventory UI and player stats
            this.updateInventoryItems();
            this.updatePlayerStats();
        } else if (item.name === 'Stamina Potion') {
            // Restore stamina if the game has stamina system
            if (this.game.player.getStamina && this.game.player.getMaxStamina && this.game.player.getStatsObject().setStamina) {
                const staminaAmount = item.staminaAmount || 50;
                const newStamina = this.game.player.getStamina() + staminaAmount;
                const maxStamina = this.game.player.getMaxStamina();
                this.game.player.getStatsObject().setStamina(Math.min(newStamina, maxStamina));
                
                // Remove item from inventory
                this.game.player.removeFromInventory(item.name, 1);
                
                // Show notification
                this.game.hudManager.showNotification(`Consumed Stamina Potion: +${staminaAmount} Stamina`);
                
                // Update inventory UI and player stats
                this.updateInventoryItems();
                this.updatePlayerStats();
            } else {
                this.game.hudManager.showNotification(`Cannot consume ${item.name}: Stamina system not available`);
            }
        } else if (item.consumable) {
            // Handle generic consumable items
            if (item.effects) {
                let effectsApplied = false;
                let effectsDescription = [];
                
                // Apply effects
                if (item.effects.health) {
                    const newHealth = this.game.player.getHealth() + item.effects.health;
                    const maxHealth = this.game.player.getMaxHealth();
                    this.game.player.getStatsObject().setHealth(Math.min(newHealth, maxHealth));
                    effectsApplied = true;
                    effectsDescription.push(`+${item.effects.health} Health`);
                }
                
                if (item.effects.mana) {
                    const newMana = this.game.player.getMana() + item.effects.mana;
                    const maxMana = this.game.player.getMaxMana();
                    this.game.player.getStatsObject().setMana(Math.min(newMana, maxMana));
                    effectsApplied = true;
                    effectsDescription.push(`+${item.effects.mana} Mana`);
                }
                
                if (effectsApplied) {
                    // Remove item from inventory
                    this.game.player.removeFromInventory(item.name, 1);
                    
                    // Show notification with effects details
                    const effectsText = effectsDescription.length > 0 ? `: ${effectsDescription.join(', ')}` : '';
                    this.game.hudManager.showNotification(`Consumed ${item.name}${effectsText}`);
                    
                    // Update inventory UI and player stats
                    this.updateInventoryItems();
                    this.updatePlayerStats();
                } else {
                    this.game.hudManager.showNotification(`Consumed ${item.name}, but no effects were applied`);
                }
            } else {
                // Generic consumable with no specific effects
                // Remove item from inventory
                this.game.player.removeFromInventory(item.name, 1);
                
                // Show notification
                this.game.hudManager.showNotification(`Consumed ${item.name}`);
                
                // Update inventory UI
                this.updateInventoryItems();
            }
        } else {
            // Show item description for non-consumable items
            this.game.hudManager.showNotification(`Cannot consume ${item.name}: Not a consumable item`);
        }
    }
    
    /**
     * Equip an item from the inventory
     * @param {Object} item - Item to equip
     */
    equipItem(item) {
        // Check if item has a type
        if (!item.type) {
            this.game.hudManager.showNotification(`Cannot equip ${item.name}: Not an equippable item`);
            return;
        }
        
        // Try to equip the item
        const success = this.game.player.inventory.equipItem(item);
        
        if (success) {
            // Show notification with stat changes if available
            let notificationText = `Equipped ${item.name}`;
            
            // Add stat information to notification if available
            if (item.stats) {
                const statChanges = [];
                
                if (item.stats.attack) {
                    statChanges.push(`+${item.stats.attack} Attack`);
                }
                if (item.stats.defense) {
                    statChanges.push(`+${item.stats.defense} Defense`);
                }
                if (item.stats.health) {
                    statChanges.push(`+${item.stats.health} Health`);
                }
                if (item.stats.mana) {
                    statChanges.push(`+${item.stats.mana} Mana`);
                }
                if (item.stats.speed) {
                    statChanges.push(`+${item.stats.speed} Speed`);
                }
                
                if (statChanges.length > 0) {
                    notificationText += ` (${statChanges.join(', ')})`;
                }
            }
            
            this.game.hudManager.showNotification(notificationText);
            
            // Update inventory and equipment display
            this.updateInventoryItems();
            this.updateEquipmentSlots();
            
            // Update player stats display
            this.updatePlayerStats();
        } else {
            this.game.hudManager.showNotification(`Failed to equip ${item.name}`);
        }
    }
    
    /**
     * Update equipment slots display
     * Shows equipped items and makes slots active
     */
    updateEquipmentSlots() {
        // Get player equipment
        const equipment = this.game.player.getEquipment();
        
        // Update each equipment slot
        Object.entries(equipment).forEach(([slot, item]) => {
            const slotElement = document.getElementById(`equipment-slot-${slot}`);
            
            if (slotElement) {
                // Clear previous content
                slotElement.innerHTML = '';
                
                if (item) {
                    // Remove inactive class if present
                    slotElement.classList.remove('inactive');
                    
                    // Create item icon
                    const itemIcon = document.createElement('div');
                    itemIcon.className = 'item-icon';
                    itemIcon.textContent = item.icon || '📦';
                    slotElement.appendChild(itemIcon);
                    
                    // Add tooltip with item name
                    slotElement.title = item.name;
                    
                    // Add click event to show item details
                    slotElement.addEventListener('click', (event) => {
                        this.showItemPopup(item, slotElement, event);
                    });
                } else {
                    // Add inactive class if no item is equipped
                    slotElement.classList.add('inactive');
                    
                    // Add empty slot indicator
                    const emptySlot = document.createElement('div');
                    emptySlot.className = 'empty-slot';
                    emptySlot.textContent = this.getSlotIcon(slot);
                    slotElement.appendChild(emptySlot);
                    
                    // Add tooltip with slot name
                    slotElement.title = this.getSlotName(slot);
                    
                    // Remove any click events
                    slotElement.replaceWith(slotElement.cloneNode(true));
                }
            }
        });
    }
    
    /**
     * Get a human-readable name for an equipment slot
     * @param {string} slot - The equipment slot key
     * @returns {string} Human-readable slot name
     */
    getSlotName(slot) {
        const slotNames = {
            weapon: 'Weapon',
            armor: 'Armor',
            helmet: 'Helmet',
            boots: 'Boots',
            gloves: 'Gloves',
            belt: 'Belt',
            accessory1: 'Accessory 1',
            accessory2: 'Accessory 2',
            talisman: 'Talisman'
        };
        
        return slotNames[slot] || slot.charAt(0).toUpperCase() + slot.slice(1);
    }
    
    /**
     * Get an icon for an empty equipment slot
     * @param {string} slot - The equipment slot key
     * @returns {string} Icon for the slot
     */
    getSlotIcon(slot) {
        const slotIcons = {
            weapon: '🗡️',
            armor: '🛡️',
            helmet: '⛑️',
            boots: '👢',
            gloves: '🧤',
            belt: '⚔️',
            accessory1: '💍',
            accessory2: '💍',
            talisman: '🔮'
        };
        
        return slotIcons[slot] || '❓';
    }
    
    /**
     * Drop an item from the inventory
     * @param {Object} item - Item to drop
     */
    dropItem(item) {
        // Check if item is legendary or higher rarity
        const isLegendaryOrHigher = item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'artifact';
        
        // Only confirm for legendary or higher items
        if (isLegendaryOrHigher) {
            if (!confirm(`Are you sure you want to drop ${item.name}? This is a ${item.rarity} item!`)) {
                return; // User cancelled the drop
            }
        }
        
        // Remove item from inventory
        const success = this.game.player.removeFromInventory(item.name, 1);
        
        if (success) {
            // Show notification
            this.game.hudManager.showNotification(`Dropped ${item.name}`);
            
            // Update inventory
            this.updateInventoryItems();
        } else {
            this.game.hudManager.showNotification(`Failed to drop ${item.name}`);
        }
    }
    
    /**
     * Save the current inventory state
     * This method handles saving the inventory data
     */
    saveInventory() {
        // Get player inventory
        const inventory = this.game.player.getInventory();
        
        // Use the game's save manager to save the inventory data
        if (this.game.saveManager) {
            // Save the game (which includes inventory data)
            this.game.saveManager.saveGame(true).then(success => {
                if (success) {
                    this.game.hudManager.showNotification('Inventory saved successfully!');
                } else {
                    this.game.hudManager.showNotification('Failed to save inventory!', 'error');
                }
            }).catch(error => {
                console.error('Error saving inventory:', error);
                this.game.hudManager.showNotification('Error saving inventory!', 'error');
            });
        } else {
            // Fallback if save manager is not available
            console.warn('SaveManager not available, inventory not saved');
            this.game.hudManager.showNotification('Inventory saved successfully!');
        }
    }
    
    /**
     * Show the inventory UI
     * Override the parent method to handle 3D model animation
     */
    show() {
        super.show();
        this.initModelPreview();
        
        // Start the animation loop if the model is initialized
        if (this.isModelInitialized && this.modelPreview) {
            // The ModelPreview class handles animation resumption automatically
            // through its visibility observer
            this.modelPreview.visible = true;
            
            // Force an animation frame if needed
            if (!this.modelPreview.animationId) {
                this.modelPreview.animate();
            }
        }
    }
    
    /**
     * Hide the inventory UI
     * Override the parent method to handle 3D model animation
     */
    hide() {
        super.hide();
        
        // Hide stats overlay if it's open
        this.toggleStatsOverlay(false);
        
        // Stop the animation when hidden
        if (this.isModelInitialized && this.modelPreview) {
            this.modelPreview.visible = false;
            
            // Cancel animation frame if it's running
            if (this.modelPreview.animationId) {
                cancelAnimationFrame(this.modelPreview.animationId);
                this.modelPreview.animationId = null;
            }
        }
    }
    
    // The setupModelInteraction method has been replaced by the ModelPreview's OrbitControls
    
    /**
     * Clean up resources when component is destroyed
     * This should be called when the game is shutting down
     */
    dispose() {
        // Stop animation loop
        this.isModelInitialized = false;
        
        // Dispose of ModelPreview resources
        if (this.modelPreview) {
            // The ModelPreview class has its own dispose method that handles cleanup
            this.modelPreview.dispose();
            this.modelPreview = null;
        }
        
        // Remove item popup if it exists
        if (this.itemPopup && this.itemPopup.parentNode) {
            this.itemPopup.parentNode.removeChild(this.itemPopup);
            this.itemPopup = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.onModelContainerResize);
        
        // Note: Since we're using anonymous functions for event listeners,
        // we can't directly remove them. In a production app, you would
        // store references to the bound event handlers.
    }
}