/**
 * MultiplayerUIManager.js
 * Handles all UI-related functionality for multiplayer
 * Including host/join UI, QR code generation/scanning, and connection status
 */

export class MultiplayerUIManager {
    /**
     * Initialize the multiplayer UI manager
     * @param {MultiplayerManager} multiplayerManager - Reference to the main multiplayer manager
     */
    constructor(multiplayerManager) {
        this.multiplayerManager = multiplayerManager;
        this.qrCodeScanner = null;
        this.availableCameras = [];
        this.selectedCameraId = null;
        this.connectionInfoListenersInitialized = false;
    }

    /**
     * Initialize the UI manager
     */
    async init() {
        // Set up UI event listeners
        this.setupUIListeners();
        
        // Check URL parameters for direct join
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('join') === 'true' && urlParams.get('connect-id')) {
            // Get the connection ID from URL
            const connectId = urlParams.get('connect-id');
            console.debug('Direct join detected with connection ID:', connectId);
            
            // Show multiplayer modal and join UI
            this.showMultiplayerModal();
            await this.showJoinUI();
            
            // Show manual code view
            document.getElementById('scan-qr-view').style.display = 'none';
            document.getElementById('manual-code-view').style.display = 'flex';
            
            // Auto-fill the connection code
            const input = document.getElementById('manual-connection-input');
            if (input) {
                input.value = connectId;
            }
            
            // Auto-connect after a short delay
            setTimeout(() => {
                this.updateConnectionStatus('Connecting...', 'join-connection-status');
                this.multiplayerManager.joinGame(connectId);
            }, 500);
        }
        
        return true;
    }

    /**
     * Set up UI event listeners for multiplayer buttons
     */
    setupUIListeners() {
        // Multiplayer button (in game menu)
        const multiplayerButton = document.getElementById('multiplayer-button');
        if (multiplayerButton) {
            multiplayerButton.addEventListener('click', () => {
                // If we're already in multiplayer mode, show connection info
                if (this.multiplayerManager.connection && this.multiplayerManager.connection.isConnected) {
                    console.debug('[MultiplayerUIManager] Showing multiplayer connection info');
                    this.showConnectionInfoScreen();
                } else {
                    // Otherwise show the multiplayer modal
                    this.showMultiplayerModal();
                }
            });
        }
        
        // Host game button
        const hostGameBtn = document.getElementById('host-game-btn');
        if (hostGameBtn) {
            hostGameBtn.addEventListener('click', () => {
                this.multiplayerManager.hostGame();
            });
        }
        
        // Join game button
        const joinGameBtn = document.getElementById('join-game-btn');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', async () => {
                // Show join UI first
                await this.showJoinUI();
                
                // Then switch to QR scanner view and start it
                document.getElementById('scan-qr-view').style.display = 'flex';
                document.getElementById('manual-code-view').style.display = 'none';
                await this.startQRScannerWithUI();
            });
        }
        
        // Manual connect button
        const manualConnectBtn = document.getElementById('manual-connect-btn');
        if (manualConnectBtn) {
            manualConnectBtn.addEventListener('click', () => {
                const code = document.getElementById('manual-connection-input').value;
                if (code) {
                    // Update button text and disable it
                    manualConnectBtn.textContent = 'Connecting...';
                    manualConnectBtn.disabled = true;
                    
                    this.updateConnectionStatus('Connecting...', 'join-connection-status');
                    this.multiplayerManager.joinGame(code);
                } else {
                    this.updateConnectionStatus('Please enter a connection code', 'join-connection-status');
                }
            });
        }
        
        // No join option buttons anymore - removed
        
        // Start game button (for host)
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            // Add click event listener
            startGameBtn.addEventListener('click', () => this.multiplayerManager.startMultiplayerGame());
            
            // Hide the button if player is not the host
            if (this.multiplayerManager.connection && !this.multiplayerManager.connection.isHost) {
                startGameBtn.style.display = 'none';
            }
        }
        
        // Close multiplayer modal
        const closeMultiplayerBtn = document.getElementById('close-multiplayer-btn');
        if (closeMultiplayerBtn) {
            closeMultiplayerBtn.addEventListener('click', () => this.closeMultiplayerModal());
        }
        
        // Copy connection code button
        const connectionCode = document.getElementById('connection-code');
        if (connectionCode) {
            connectionCode.addEventListener('click', () => this.copyConnectionCode());
        }
        
        // Copy button for connection code
        const copyCodeBtn = document.getElementById('copy-code-btn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => this.copyConnectionCode());
        }
        
        // Paste button for connection code
        const pasteCodeBtn = document.getElementById('paste-code-btn');
        if (pasteCodeBtn) {
            pasteCodeBtn.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('manual-connection-input');
                    if (input) {
                        input.value = text;
                    }
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                    this.updateConnectionStatus('Failed to paste from clipboard. Please enter code manually.', 'join-connection-status');
                }
            });
        }
        
        // QR Scanner toggle button
        const toggleScanBtn = document.getElementById('toggle-scan-btn');
        if (toggleScanBtn) {
            toggleScanBtn.addEventListener('click', () => {
                if (this.qrCodeScanner) {
                    this.stopQRScanner();
                } else {
                    this.startQRScanner();
                }
            });
        }
        
        // Quick connect button in QR scanner tab
        const quickConnectBtn = document.getElementById('quick-connect-btn');
        if (quickConnectBtn) {
            quickConnectBtn.addEventListener('click', () => {
                const code = document.getElementById('quick-connection-input').value;
                if (code) {
                    this.updateConnectionStatus('Connecting...', 'join-connection-status');
                    this.multiplayerManager.joinGame(code);
                } else {
                    this.updateConnectionStatus('Please enter a connection code', 'join-connection-status');
                }
            });
        }
        
        // Quick connection input field - allow Enter key to connect
        const quickConnectionInput = document.getElementById('quick-connection-input');
        if (quickConnectionInput) {
            quickConnectionInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const code = quickConnectionInput.value;
                    if (code) {
                        this.updateConnectionStatus('Connecting...', 'join-connection-status');
                        this.multiplayerManager.joinGame(code);
                    } else {
                        this.updateConnectionStatus('Please enter a connection code', 'join-connection-status');
                    }
                }
            });
        }
        
        // Back buttons
        
        const backFromJoinBtn = document.getElementById('back-from-join-btn');
        if (backFromJoinBtn) {
            backFromJoinBtn.addEventListener('click', () => {
                this.stopQRScanner();
                this.showMultiplayerModal();
            });
        }
        
        const leaveGameBtn = document.getElementById('leave-game-btn');
        if (leaveGameBtn) {
            leaveGameBtn.addEventListener('click', () => {
                console.debug('[MultiplayerUIManager] Leaving multiplayer game');
                
                // Disconnect from the multiplayer game
                this.multiplayerManager.leaveGame();
                
                // Update UI
                this.updateMultiplayerButton(false);
                
                // Close the multiplayer modal
                this.closeMultiplayerModal();
                
                // Return to game menu if the game has a menu manager
                if (this.multiplayerManager.game && this.multiplayerManager.game.menuManager) {
                    this.multiplayerManager.game.menuManager.showMenu('gameMenu');
                }
            });
        }
    }

    /**
     * Show the multiplayer modal
     */
    showMultiplayerModal() {
        const modal = document.getElementById('multiplayer-menu');
        if (modal) {
            modal.style.display = 'flex';
            
            // Show initial screen, hide others
            document.getElementById('multiplayer-initial-screen').style.display = 'flex';
            document.getElementById('join-game-screen').style.display = 'none';
            // Player waiting screen has been removed and merged into connection-info-screen
            const playerWaitingScreen = document.getElementById('player-waiting-screen');
            if (playerWaitingScreen) {
                playerWaitingScreen.style.display = 'none';
            }
            document.getElementById('connection-info-screen').style.display = 'none';
            
            // Reset connection status
            const statusElements = document.querySelectorAll('.connection-status');
            statusElements.forEach(el => el.textContent = '');
        }
    }
    
    /**
     * Show the connection info screen
     * Displays current connection status, host info, and connected players
     */
    showConnectionInfoScreen() {
        const modal = document.getElementById('multiplayer-menu');
        if (modal) {
            modal.style.display = 'flex';
            
            // Get the connection info screen element
            const connectionInfoScreen = document.getElementById('connection-info-screen');
            
            // Set up event listeners for the buttons if not already done
            if (!this.connectionInfoListenersInitialized) {
                const disconnectBtn = document.getElementById('disconnect-btn');
                if (disconnectBtn) {
                    disconnectBtn.addEventListener('click', () => {
                        console.debug('[MultiplayerUIManager] Disconnecting from multiplayer game');
                        
                        // Disconnect from the multiplayer game
                        this.multiplayerManager.leaveGame();
                        
                        // Update UI
                        this.updateMultiplayerButton(false);
                        
                        // Close the multiplayer modal
                        this.closeMultiplayerModal();
                        
                        // Return to game menu if the game has a menu manager
                        if (this.multiplayerManager.game && this.multiplayerManager.game.menuManager) {
                            this.multiplayerManager.game.menuManager.showMenu('gameMenu');
                        }
                    });
                }
                
                const closeBtn = document.getElementById('close-connection-info-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.closeMultiplayerModal());
                }
                
                this.connectionInfoListenersInitialized = true;
            }
            
            // Hide other screens, show connection info screen
            document.getElementById('multiplayer-initial-screen').style.display = 'none';
            document.getElementById('join-game-screen').style.display = 'none';
            // Player waiting screen has been removed and merged into connection-info-screen
            const playerWaitingScreen = document.getElementById('player-waiting-screen');
            if (playerWaitingScreen) {
                playerWaitingScreen.style.display = 'none';
            }
            connectionInfoScreen.style.display = 'flex';
            
            // Update connection info
            this.updateConnectionInfoScreen();
        }
    }

    /**
     * Close the multiplayer modal
     */
    closeMultiplayerModal() {
        const modal = document.getElementById('multiplayer-menu');
        if (modal) {
            modal.style.display = 'none';
            
            // Stop QR scanner if active
            this.stopQRScanner();
            
            // Hide connection info screen if it exists
            const connectionInfoScreen = document.getElementById('connection-info-screen');
            if (connectionInfoScreen) {
                connectionInfoScreen.style.display = 'none';
            }
        }
    }
    
    /**
     * Update the connection info screen with current connection data
     */
    updateConnectionInfoScreen() {
        // Update connection status
        const statusElement = document.getElementById('connection-info-status');
        if (statusElement) {
            if (this.multiplayerManager.connection && this.multiplayerManager.connection.isConnected) {
                statusElement.textContent = 'Connected';
                statusElement.className = 'status-connected';
            } else {
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'status-disconnected';
            }
        }
        
        // Update role info
        const roleElement = document.getElementById('connection-role-info');
        if (roleElement) {
            if (this.multiplayerManager.connection) {
                if (this.multiplayerManager.connection.isHost) {
                    roleElement.textContent = 'You are the host';
                } else {
                    roleElement.textContent = 'You are connected as a player';
                }
            } else {
                roleElement.textContent = '';
            }
        }
        
        // Update start game button visibility based on host status
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            if (this.multiplayerManager.connection && this.multiplayerManager.connection.isHost) {
                startGameBtn.style.display = 'block';
            } else {
                startGameBtn.style.display = 'none';
            }
        }
        
        // Update player list
        this.updateConnectionInfoPlayerList();
        
        // Update connection code display and QR code for both host and members
        if (this.multiplayerManager.connection && this.multiplayerManager.connection.isConnected) {
            // For host, use the room ID
            // For players, use the host's ID which is the room ID
            const roomId = this.multiplayerManager.connection.isHost ? 
                this.multiplayerManager.connection.roomId : 
                this.multiplayerManager.connection.hostId;
                
            if (roomId) {
                this.displayConnectionCode(roomId);
                
                // Generate QR code for the connection info screen for both host and members
                const qrContainer = document.getElementById('connection-info-qr');
                if (qrContainer) {
                    // Make sure QR container is visible
                    qrContainer.style.display = 'block';
                    
                    // Clear any previous QR code
                    qrContainer.innerHTML = '';
                    
                    // Generate QR code
                    console.debug(`Generating QR code with room ID: ${roomId}`);
                    this.generateQRCode(roomId);
                } else {
                    console.warn('QR container element not found');
                }
            } else {
                console.warn('Room ID not available for QR code generation');
            }
        }
    }
    
    /**
     * Update the player list in the connection info screen
     */
    updateConnectionInfoPlayerList() {
        const playersList = document.getElementById('connection-info-players');
        if (!playersList) return;
        
        // Clear existing list
        playersList.innerHTML = '';
        
        // Add host entry if we're connected
        if (this.multiplayerManager.connection && this.multiplayerManager.connection.isConnected) {
            // Get host ID and color
            let hostId = this.multiplayerManager.connection.isHost ? 
                this.multiplayerManager.connection.peer.id : 
                this.multiplayerManager.connection.hostId;
            
            // Get host color
            let hostColor = '#FF5733'; // Default color
            if (this.multiplayerManager.assignedColors.has(hostId)) {
                hostColor = this.multiplayerManager.assignedColors.get(hostId);
            }
            
            // Create host entry
            const hostItem = document.createElement('div');
            hostItem.className = 'player-item host-player';
            
            // Create host color indicator
            const hostColorIndicator = document.createElement('div');
            hostColorIndicator.className = 'player-color-indicator';
            hostColorIndicator.style.backgroundColor = hostColor;
            
            // Create host name span
            const hostName = document.createElement('span');
            hostName.textContent = 'Host';
            
            // Add "You" indicator if the user is the host
            if (this.multiplayerManager.connection.isHost) {
                const youIndicator = document.createElement('span');
                youIndicator.className = 'you-indicator';
                youIndicator.textContent = '(You)';
                hostName.appendChild(youIndicator);
            }
            
            // Append elements
            hostItem.appendChild(hostColorIndicator);
            hostItem.appendChild(hostName);
            playersList.appendChild(hostItem);
            
            // Add connected players
            if (this.multiplayerManager.connection.peers) {
                this.multiplayerManager.connection.peers.forEach((conn, peerId) => {
                    // Get player color
                    let playerColor = '#33FF57'; // Default color
                    if (this.multiplayerManager.assignedColors.has(peerId)) {
                        playerColor = this.multiplayerManager.assignedColors.get(peerId);
                    }
                    
                    // Create player item
                    const playerItem = document.createElement('div');
                    playerItem.className = 'player-item';
                    
                    // Create player color indicator
                    const colorIndicator = document.createElement('div');
                    colorIndicator.className = 'player-color-indicator';
                    colorIndicator.style.backgroundColor = playerColor;
                    
                    // Create player name span
                    const playerName = document.createElement('span');
                    playerName.textContent = `Player ${peerId.substring(0, 8)}`;
                    
                    // Add "You" indicator if this is the current player
                    if (peerId === this.multiplayerManager.connection.peer.id) {
                        const youIndicator = document.createElement('span');
                        youIndicator.className = 'you-indicator';
                        youIndicator.textContent = '(You)';
                        playerName.appendChild(youIndicator);
                    }
                    
                    // Create kick button (for host only)
                    if (this.multiplayerManager.connection.isHost) {
                        const kickButton = document.createElement('button');
                        kickButton.className = 'kick-player-btn';
                        kickButton.textContent = '✕';
                        kickButton.title = 'Remove player';
                        kickButton.setAttribute('data-player-id', peerId);
                        kickButton.addEventListener('click', (event) => {
                            event.stopPropagation();
                            const playerId = event.target.getAttribute('data-player-id');
                            if (playerId && this.multiplayerManager.connection) {
                                this.multiplayerManager.connection.kickPlayer(playerId);
                                // Update the UI after kicking
                                setTimeout(() => this.updateConnectionInfoScreen(), 500);
                            }
                        });
                        
                        // Append elements
                        playerItem.appendChild(colorIndicator);
                        playerItem.appendChild(playerName);
                        playerItem.appendChild(kickButton);
                    } else {
                        // Append elements without kick button for non-hosts
                        playerItem.appendChild(colorIndicator);
                        playerItem.appendChild(playerName);
                    }
                    
                    playersList.appendChild(playerItem);
                });
            }
        } else {
            // Not connected
            const noConnectionItem = document.createElement('div');
            noConnectionItem.className = 'no-connection-message';
            noConnectionItem.textContent = 'Not connected to any multiplayer game';
            playersList.appendChild(noConnectionItem);
        }
    }

    // showHostUI method has been removed as it's no longer needed

    /**
     * Show the join UI
     */
    async showJoinUI() {
        // Hide initial screen, show join screen
        document.getElementById('multiplayer-initial-screen').style.display = 'none';
        document.getElementById('join-game-screen').style.display = 'flex';
        // Player waiting screen has been removed and merged into connection-info-screen
        const playerWaitingScreen = document.getElementById('player-waiting-screen');
        if (playerWaitingScreen) {
            playerWaitingScreen.style.display = 'none';
        }
        
        // By default, show manual code view
        document.getElementById('scan-qr-view').style.display = 'none';
        document.getElementById('manual-code-view').style.display = 'flex';
        
        // Clear input fields to prepare for new connection
        const manualInput = document.getElementById('manual-connection-input');
        if (manualInput) {
            manualInput.value = '';
        }
        
        const quickInput = document.getElementById('quick-connection-input');
        if (quickInput) {
            quickInput.value = '';
        }
        
        // Reset connect button state
        const manualConnectBtn = document.getElementById('manual-connect-btn');
        if (manualConnectBtn) {
            manualConnectBtn.disabled = false;
        }
        
        // Set up back button
        const backButton = document.getElementById('back-from-join-btn');
        if (backButton) {
            backButton.onclick = () => {
                this.stopQRScanner();
                this.showMultiplayerModal();
            };
        }
        
        // Focus on the input field
        if (manualInput) {
            manualInput.focus();
        }
        
        this.updateConnectionStatus('Enter the connection code to join the game', 'join-connection-status');
    }
    
    /**
     * Start QR scanner with loading indicator
     */
    async startQRScannerWithUI() {
        try {
            // Show loading indicator
            const qrScannerView = document.getElementById('qr-scanner-view');
            if (qrScannerView) {
                // Create and add loading overlay if it doesn't exist
                let loadingOverlay = document.getElementById('qr-scanner-loading');
                if (!loadingOverlay) {
                    loadingOverlay = document.createElement('div');
                    loadingOverlay.id = 'qr-scanner-loading';
                    loadingOverlay.className = 'loading-overlay';
                    loadingOverlay.innerHTML = `
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Initializing camera...</div>
                    `;
                    qrScannerView.parentNode.appendChild(loadingOverlay);
                } else {
                    loadingOverlay.style.display = 'flex';
                }
            }
            
            this.updateConnectionStatus('Initializing camera...', 'join-connection-status');
            
            // Load HTML5-QRCode library if not already loaded - do this in parallel
            const libraryPromise = (typeof Html5Qrcode === 'undefined') ? this.loadQRScannerJS() : Promise.resolve();
            
            // Start a timeout to show manual entry if camera takes too long
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    console.debug('Camera initialization taking longer than expected, showing manual entry option');
                    // Show manual code view alongside camera view
                    const manualCodeView = document.getElementById('manual-code-view');
                    if (manualCodeView) {
                        manualCodeView.style.display = 'flex';
                    }
                    resolve();
                }, 3000); // 3 seconds timeout
            });
            
            // Wait for library to load
            await libraryPromise;
            
            // Get available cameras and set up camera selection - prioritize back camera
            await this.getAvailableCameras();
            
            // Start scanner automatically with higher FPS for better detection
            await this.startQRScanner();
            
            // Hide loading overlay
            const loadingOverlay = document.getElementById('qr-scanner-loading');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            this.updateConnectionStatus('Camera active. Point at a QR code to connect.', 'join-connection-status');
            return true;
        } catch (error) {
            console.error('Error initializing QR scanner:', error);
            this.updateConnectionStatus('QR scanner not available. Please enter connection code manually.', 'join-connection-status');
            
            // Show manual code view if camera fails
            document.getElementById('scan-qr-view').style.display = 'none';
            document.getElementById('manual-code-view').style.display = 'flex';
            return false;
        }
    }
    
    /**
     * Show the connection info screen (after joining a game)
     * This replaces the old showPlayerWaitingScreen function
     */
    showPlayerWaitingScreen() {
        // For backward compatibility, redirect to the connection info screen
        this.showConnectionInfoScreen();
    }
    
    /**
     * Get available cameras
     * @returns {Promise<Array>} A promise that resolves with an array of camera devices
     */
    async getAvailableCameras() {
        if (typeof Html5Qrcode === 'undefined') {
            await this.loadQRScannerJS();
        }
        
        try {
            // Get available cameras using the Html5Qrcode API
            this.availableCameras = await Html5Qrcode.getCameras();
            console.debug('Available cameras:', this.availableCameras);
            
            // Populate the camera select dropdown
            const cameraSelect = document.getElementById('camera-select');
            if (cameraSelect) {
                // Clear existing options
                cameraSelect.innerHTML = '';
                
                // Add options for each camera
                this.availableCameras.forEach(camera => {
                    const option = document.createElement('option');
                    option.value = camera.id;
                    option.textContent = camera.label || `Camera ${camera.id.substring(0, 4)}`;
                    cameraSelect.appendChild(option);
                });
                
                // Show the select dropdown if we have multiple cameras
                if (this.availableCameras.length > 1) {
                    cameraSelect.style.display = 'block';
                    
                    // Set up event listener for camera selection
                    cameraSelect.onchange = (e) => {
                        this.selectedCameraId = e.target.value;
                        
                        // Restart scanner with new camera if it's currently running
                        if (this.qrCodeScanner) {
                            this.stopQRScanner();
                            this.startQRScanner();
                        }
                    };
                    
                    // Set initial selected camera (prefer back camera if available)
                    const backCamera = this.availableCameras.find(camera => 
                        camera.label && (
                            camera.label.toLowerCase().includes('back') || 
                            camera.label.toLowerCase().includes('rear') ||
                            camera.label.toLowerCase().includes('environment')
                        )
                    );
                    
                    if (backCamera) {
                        this.selectedCameraId = backCamera.id;
                        cameraSelect.value = backCamera.id;
                    } else if (this.availableCameras.length > 0) {
                        this.selectedCameraId = this.availableCameras[0].id;
                        cameraSelect.value = this.availableCameras[0].id;
                    }
                } else if (this.availableCameras.length === 1) {
                    // Only one camera available
                    this.selectedCameraId = this.availableCameras[0].id;
                    cameraSelect.style.display = 'none';
                }
            }
            
            return this.availableCameras;
        } catch (error) {
            console.error('Error getting cameras:', error);
            this.updateConnectionStatus('Could not access cameras. Please check permissions.', 'join-connection-status');
            return [];
        }
    }
    
    /**
     * Start the QR scanner
     */
    async startQRScanner() {
        if (typeof Html5Qrcode === 'undefined') {
            this.updateConnectionStatus('QR scanner library not loaded. Please enter code manually.', 'join-connection-status');
            return;
        }
        
        try {
            // Get available cameras if we haven't already
            if (this.availableCameras.length === 0) {
                await this.getAvailableCameras();
            }
            
            // Create QR scanner instance
            this.qrCodeScanner = new Html5Qrcode('qr-scanner-view');
            
            // Configure camera settings
            let cameraConfig;
            
            if (this.selectedCameraId) {
                // Use selected camera ID if available
                cameraConfig = { deviceId: this.selectedCameraId };
            } else {
                // Fall back to environment facing camera
                cameraConfig = { facingMode: 'environment' };
            }
            
            // Show the "Enter Code" button overlay
            const enterCodeOverlay = document.getElementById('enter-code-overlay');
            if (enterCodeOverlay) {
                // Make the overlay visible
                enterCodeOverlay.style.display = 'flex';
                
                // Add event listener to the button if not already added
                if (!enterCodeOverlay.hasAttribute('data-listener-added')) {
                    enterCodeOverlay.addEventListener('click', () => {
                        // Stop scanner
                        this.stopQRScanner();
                        
                        // Show manual code view
                        document.getElementById('scan-qr-view').style.display = 'none';
                        document.getElementById('manual-code-view').style.display = 'flex';
                        
                        // Focus on the input field
                        const input = document.getElementById('manual-connection-input');
                        if (input) {
                            input.focus();
                        }
                        
                        this.updateConnectionStatus('Enter the connection code to join the game', 'join-connection-status');
                    });
                    
                    // Mark that we've added the listener
                    enterCodeOverlay.setAttribute('data-listener-added', 'true');
                }
            }
            
            // Start the scanner with improved settings
            await this.qrCodeScanner.start(
                cameraConfig,
                { 
                    fps: 15,                // Higher FPS for better detection
                    qrbox: { width: 250, height: 250 }, // Optimal size for QR detection
                    aspectRatio: 1,         // Square aspect ratio
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], // Only scan for QR codes
                    disableFlip: false,     // Allow mirrored QR codes
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true // Use native API if available
                    }
                },
                (decodedText) => {
                    // Stop scanning immediately when QR code is detected
                    this.stopQRScanner();
                    this.updateConnectionStatus('QR code detected! Connecting...', 'join-connection-status');
                    
                    // Check if the decoded text is a URL with our parameters
                    let connectId = decodedText;
                    
                    try {
                        // Try to parse as URL - more flexible URL detection
                        if (decodedText.startsWith('http') || decodedText.includes('?join=') || decodedText.includes('connect-id=')) {
                            console.debug('Detected possible URL in QR code:', decodedText);
                            
                            // Create URL object to parse parameters
                            const url = new URL(decodedText);
                            const params = new URLSearchParams(url.search);
                            
                            // Check for connect-id parameter
                            if (params.get('connect-id')) {
                                connectId = params.get('connect-id');
                                console.debug('Extracted connection ID from URL:', connectId);
                            }
                        }
                    } catch (e) {
                        console.debug('Not a valid URL or parsing failed:', e);
                        console.debug('Using scanned text as direct connection ID');
                    }
                    
                    // Show the extracted connection ID in the UI
                    const manualInput = document.getElementById('manual-connection-input');
                    if (manualInput) {
                        manualInput.value = connectId;
                    }
                    
                    // Auto-connect with the scanned connection ID
                    this.multiplayerManager.joinGame(connectId);
                },
                (errorMessage) => {
                    // Handle scan errors silently
                }
            ).catch(err => {
                this.updateConnectionStatus('Error starting camera: ' + err, 'join-connection-status');
                
                // Go back to initial options if camera fails
                document.getElementById('join-initial-options').style.display = 'flex';
                document.getElementById('scan-qr-view').style.display = 'none';
            });
            
            this.updateConnectionStatus('Camera active. Point at a QR code to connect.', 'join-connection-status');
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            this.updateConnectionStatus('Failed to start camera. Please enter code manually.', 'join-connection-status');
            
            // Go back to initial options if camera fails
            document.getElementById('join-initial-options').style.display = 'flex';
            document.getElementById('scan-qr-view').style.display = 'none';
        }
    }
    
    /**
     * Stop the QR scanner
     */
    stopQRScanner() {
        if (this.qrCodeScanner) {
            this.qrCodeScanner.stop().catch(err => {
                console.error('Error stopping camera:', err);
            });
            this.qrCodeScanner = null;
            
            // Keep camera select visible if we have multiple cameras
            const cameraSelect = document.getElementById('camera-select');
            if (cameraSelect && this.availableCameras.length > 1) {
                cameraSelect.style.display = 'block';
            }
            
            // Hide loading overlay if it exists
            const loadingOverlay = document.getElementById('qr-scanner-loading');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Hide enter code overlay if it exists
            const enterCodeOverlay = document.getElementById('enter-code-overlay');
            if (enterCodeOverlay) {
                enterCodeOverlay.style.display = 'none';
            }
        }
    }

    /**
     * Update connection status
     * @param {string} message - The status message
     * @param {string} [elementId='host-connection-status'] - The ID of the status element to update
     */
    updateConnectionStatus(message, elementId = 'host-connection-status') {
        const statusElement = document.getElementById(elementId);
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    /**
     * Generate QR code for connection
     * @param {string} data - The data to encode in the QR code
     */
    /**
     * Build a connection URL with the given connection ID
     * @param {string} connectionId - The connection ID to include in the URL
     * @returns {string} The full URL for joining the game
     */
    buildConnectionURL(connectionId) {
        return `${window.location.href.split('?')[0]}?join=true&connect-id=${connectionId}`;
    }
    
    async generateQRCode(data) {
        const qrContainer = document.getElementById('connection-info-qr');
        if (!qrContainer) return;
        
        try {
            // Load QRCode.js library if not already loaded
            if (typeof QRCode === 'undefined') {
                await this.loadQRCodeJS();
            }
            
            // Clear previous QR code
            qrContainer.innerHTML = '';
            
            // Create a complete URL with the connection ID using the helper function
            const fullUrl = this.buildConnectionURL(data);
            
            // Generate new QR code with the full URL
            new QRCode(qrContainer, {
                text: fullUrl,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Store the full URL for copying
            qrContainer.dataset.fullUrl = fullUrl;
        } catch (error) {
            console.error('Error generating QR code:', error);
            qrContainer.textContent = `Connection code: ${data}`;
        }
    }

    /**
     * Copy connection code to clipboard
     */
    copyConnectionCode() {
        // Get the room ID from the connection manager
        const roomId = this.multiplayerManager.connection && this.multiplayerManager.connection.roomId;
        if (!roomId) {
            console.error('No room ID available to copy');
            this.updateConnectionStatus('No connection code available', 'host-connection-status');
            return;
        }
        
        // Find the active code element (either in host UI or connection info screen)
        const hostCodeElement = document.getElementById('connection-code');
        const infoCodeElement = document.getElementById('connection-info-code');
        
        // Make sure both elements have the roomId text if they exist
        if (hostCodeElement && hostCodeElement.textContent !== roomId) {
            hostCodeElement.textContent = roomId;
        }
        
        if (infoCodeElement && infoCodeElement.textContent !== roomId) {
            infoCodeElement.textContent = roomId;
        }
        
        // Copy only the connection ID (roomId) to clipboard
        try {
            // Use the Clipboard API with proper error handling
            navigator.clipboard.writeText(roomId)
                .then(() => {
                    // Show success message
                    this.updateConnectionStatus('Connection ID copied to clipboard!', 'host-connection-status');
                    
                    // Also update the connection info status if visible
                    const connectionInfoStatus = document.getElementById('connection-info-status');
                    if (connectionInfoStatus && 
                        document.getElementById('connection-info-screen').style.display === 'flex') {
                        connectionInfoStatus.textContent = 'Connection ID copied to clipboard!';
                    }
                    
                    // Highlight the code elements briefly
                    if (hostCodeElement) {
                        hostCodeElement.classList.add('copied');
                        setTimeout(() => {
                            hostCodeElement.classList.remove('copied');
                        }, 1000);
                    }
                    
                    if (infoCodeElement) {
                        infoCodeElement.classList.add('copied');
                        setTimeout(() => {
                            infoCodeElement.classList.remove('copied');
                        }, 1000);
                    }
                })
                .catch(err => {
                    console.error('Clipboard write failed:', err);
                    this.updateConnectionStatus('Failed to copy connection ID. Please copy it manually.', 'host-connection-status');
                });
        } catch (error) {
            console.error('Failed to copy connection ID:', error);
            this.updateConnectionStatus('Failed to copy connection ID. Please copy it manually.', 'host-connection-status');
        }
    }
    
    /**
     * Set player color in the waiting screen
     * @param {string} color - The color assigned to the player
     */
    setPlayerColor(color) {
        const colorIndicator = document.getElementById('player-color-indicator');
        if (colorIndicator) {
            colorIndicator.style.backgroundColor = color;
        }
    }

    /**
     * Add player to connected players list (host only)
     * @param {string} playerId - The ID of the player to add
     * @param {string} playerColor - The color assigned to the player
     */
    addPlayerToList(playerId, playerColor) {
        const playersList = document.getElementById('connected-players-list');
        if (!playersList) return;
        
        // Create player item
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.id = `player-${playerId}`;
        
        // Create player color indicator
        const colorIndicator = document.createElement('div');
        colorIndicator.className = 'player-color-indicator';
        colorIndicator.style.backgroundColor = playerColor;
        
        // Create player name span
        const playerName = document.createElement('span');
        playerName.textContent = `Player ${playerId.substring(0, 8)}`;
        
        // Create kick button (for host only)
        const kickButton = document.createElement('button');
        kickButton.className = 'kick-player-btn';
        kickButton.textContent = '✕';
        kickButton.title = 'Remove player';
        kickButton.setAttribute('data-player-id', playerId);
        kickButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const peerId = event.target.getAttribute('data-player-id');
            if (peerId && this.multiplayerManager.connection) {
                this.multiplayerManager.connection.kickPlayer(peerId);
            }
        });
        
        // Append elements
        playerItem.appendChild(colorIndicator);
        playerItem.appendChild(playerName);
        playerItem.appendChild(kickButton);
        playersList.appendChild(playerItem);
    }

    /**
     * Remove player from connected players list (host only)
     * @param {string} playerId - The ID of the player to remove
     */
    removePlayerFromList(playerId) {
        const playerItem = document.getElementById(`player-${playerId}`);
        if (playerItem) {
            playerItem.remove();
        }
    }

    /**
     * Update host entry in the player list
     * @param {string} hostId - The ID of the host
     * @param {string} hostColor - The color assigned to the host
     */
    updateHostEntry(hostId, hostColor) {
        const hostEntry = document.querySelector('.connected-players-list .host-player .player-color-indicator');
        if (hostEntry) {
            hostEntry.style.backgroundColor = hostColor;
        }
    }

    /**
     * Enable or disable the start game button
     * @param {boolean} enabled - Whether the button should be enabled
     */
    setStartButtonEnabled(enabled) {
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.disabled = !enabled;
        }
    }

    /**
     * Display the connection code
     * @param {string} code - The connection code to display
     */
    displayConnectionCode(code) {
        // Update code in host UI
        const codeElement = document.getElementById('connection-code');
        if (codeElement) {
            codeElement.textContent = code;
            
            // Make sure the copy button is visible and working
            const copyBtn = document.getElementById('copy-code-btn');
            if (copyBtn) {
                copyBtn.style.display = 'inline-block';
                copyBtn.onclick = () => this.copyConnectionCode();
            }
            
            // Also make the connection code element clickable
            codeElement.style.cursor = 'pointer';
            codeElement.onclick = () => this.copyConnectionCode();
        }
        
        // Also update code in connection info screen
        const connectionInfoCode = document.getElementById('connection-info-code');
        if (connectionInfoCode) {
            connectionInfoCode.textContent = code;
            connectionInfoCode.style.cursor = 'pointer';
            connectionInfoCode.onclick = () => this.copyConnectionCode();
            
            // Make sure the copy button is visible and working
            const copyBtn = document.getElementById('connection-copy-code-btn');
            if (copyBtn) {
                copyBtn.style.display = 'inline-block';
                copyBtn.onclick = () => this.copyConnectionCode();
            }
        }
    }

    /**
     * Load QRCode.js library
     * @returns {Promise} A promise that resolves when QRCode.js is loaded
     */
    loadQRCodeJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load QRCode.js'));
            document.head.appendChild(script);
        });
    }

    /**
     * Load HTML5-QRCode library
     * @returns {Promise} A promise that resolves when HTML5-QRCode is loaded
     */
    loadQRScannerJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load HTML5-QRCode'));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Update the multiplayer button text based on connection status
     * @param {boolean} isConnected - Whether we're connected to a multiplayer game
     */
    updateMultiplayerButton(isConnected) {
        const multiplayerButton = document.getElementById('multiplayer-button');
        if (multiplayerButton) {
            if (isConnected) {
                multiplayerButton.textContent = 'Disconnect';
                multiplayerButton.classList.add('connected');
            } else {
                multiplayerButton.textContent = 'Multiplayer';
                multiplayerButton.classList.remove('connected');
            }
        }
    }
}