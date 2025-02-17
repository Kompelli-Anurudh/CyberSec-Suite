// UI Elements
const fileInput = document.getElementById('file-input');
const fileLabel = document.querySelector('.file-label');
const selectedPath = document.getElementById('selected-path');
const encryptionPassword = document.getElementById('encryption-password');
const togglePasswordBtn = document.getElementById('toggle-password');
const encryptBtn = document.getElementById('encrypt-btn');
const decryptBtn = document.getElementById('decrypt-btn');
const progressIndicator = document.getElementById('progress-indicator');
const statusText = document.getElementById('status-text');
const logArea = document.getElementById('log-area');

// State
let isProcessing = false;
let selectedFile = null;

// File Input Handler
fileInput.addEventListener('change', handleFileSelection);

function handleFileSelection(e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        selectedPath.textContent = `Selected: ${file.name}`;
        log(`Selected file: ${file.name}`);
    } else {
        selectedPath.textContent = 'No file selected';
        selectedFile = null;
    }
}

// Password Toggle
togglePasswordBtn.addEventListener('click', () => {
    const type = encryptionPassword.type === 'password' ? 'text' : 'password';
    encryptionPassword.type = type;
    togglePasswordBtn.textContent = type === 'password' ? 'Show' : 'Hide';
});

// Logging Function
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    logArea.innerHTML += `[${timestamp}] ${message}\n`;
    logArea.scrollTop = logArea.scrollHeight;
}

// Update Progress
function updateProgress(percent) {
    progressIndicator.style.width = `${percent}%`;
}

// Update Status
function updateStatus(message) {
    statusText.textContent = message;
    log(message);
}

// Validate Password
function validatePassword() {
    if (!encryptionPassword.value) {
        updateStatus('Please enter a password');
        return false;
    }
    return true;
}

// Generate Encryption Key from Password
async function generateKey(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

// Process File
async function processFile(operation) {
    if (!selectedFile) {
        updateStatus('Please select a file');
        return;
    }
    if (!validatePassword()) return;
    
    isProcessing = true;
    updateUI(true);
    
    try {
        updateStatus(`Starting ${operation}...`);
        updateProgress(0);
        
        const processedData = await encryptOrDecryptFile(selectedFile, operation);
        
        if (processedData) {
            const fileName = `${operation}ed_${selectedFile.name}`;
            downloadFile(processedData, fileName);
            log(`${operation} completed. Download started.`);
            updateProgress(100);
        }
        
        updateStatus(`${operation} completed successfully`);
    } catch (error) {
        updateStatus(`${operation} failed: ${error.message}`);
    } finally {
        isProcessing = false;
        updateUI(false);
    }
}

// Encrypt/Decrypt File
async function encryptOrDecryptFile(file, operation) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const buffer = reader.result;
                const key = await generateKey(encryptionPassword.value);
                
                let processedData;
                if (operation === 'encrypt') {
                    // Generate IV
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    
                    // Encrypt data
                    const encryptedData = await crypto.subtle.encrypt(
                        {
                            name: 'AES-GCM',
                            iv: iv
                        },
                        key,
                        buffer
                    );
                    
                    // Combine IV and encrypted data
                    const combinedData = new Uint8Array(iv.length + encryptedData.byteLength);
                    combinedData.set(iv);
                    combinedData.set(new Uint8Array(encryptedData), iv.length);
                    
                    processedData = combinedData;
                } else {
                    // Extract IV and encrypted data
                    const data = new Uint8Array(buffer);
                    const iv = data.slice(0, 12);
                    const encryptedData = data.slice(12);
                    
                    // Decrypt data
                    const decryptedData = await crypto.subtle.decrypt(
                        {
                            name: 'AES-GCM',
                            iv: iv
                        },
                        key,
                        encryptedData
                    );
                    
                    processedData = decryptedData;
                }
                
                resolve(processedData);
            } catch (error) {
                log(`Error ${operation}ing file: ${error.message}`);
                reject(error);
            }
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

// Download File
function downloadFile(data, fileName) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Update UI State
function updateUI(processing) {
    encryptBtn.disabled = processing;
    decryptBtn.disabled = processing;
    fileInput.disabled = processing;
}

// Encrypt Handler
encryptBtn.addEventListener('click', () => processFile('encrypt'));

// Decrypt Handler
decryptBtn.addEventListener('click', () => processFile('decrypt')); 