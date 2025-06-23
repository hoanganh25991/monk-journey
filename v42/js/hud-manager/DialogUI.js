import { UIComponent } from '../UIComponent.js';

/**
 * Dialog UI component
 * Displays dialog boxes with text and continue button
 */
export class DialogUI extends UIComponent {
    /**
     * Create a new DialogUI component
     * @param {import('../game/Game.js').Game} game - Reference to the game instance
     */
    constructor(game) {
        super('dialog-box', game);
        this.dialogText = null;
        this.dialogContinue = null;
        this.isDialogOpen = false;
        this.game = game;
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Store references to elements we need to update
        this.dialogText = document.getElementById('dialog-text');
        this.dialogContinue = document.getElementById('dialog-continue');
        
        // Add click event to close dialog
        this.container.addEventListener('click', () => {
            this.hideDialog();
        });
        
        // Hide initially
        this.hide();
        
        return true;
    }
    
    /**
     * Show a dialog with title and text
     * @param {string} title - Dialog title
     * @param {string} text - Dialog text
     */
    showDialog(title, text) {
        // Update dialog text
        this.dialogText.innerHTML = `<h3>${title}</h3><p>${text}</p>`;
        
        // Show dialog box
        this.show();
        this.isDialogOpen = true;
        
        // Pause game
        this.game.pause(false);

        console.debug('Dialog opened:', title);
    }
    
    /**
     * Hide the dialog
     */
    hideDialog() {
        // Hide dialog box
        this.hide();
        this.isDialogOpen = false;
        
        // Resume game
        this.game.resume(false);
        
        console.debug('Dialog closed');
    }
}