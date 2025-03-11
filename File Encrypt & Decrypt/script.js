// UI Elements
const encryptFileInput = document.getElementById('encrypt-file');
const encryptPasswordInput = document.getElementById('encrypt-password');
const encryptBtn = document.getElementById('encrypt-btn');
const decryptFileInput = document.getElementById('decrypt-file');
const decryptPasswordInput = document.getElementById('decrypt-password');
const decryptBtn = document.getElementById('decrypt-btn');
const progressIndicator = document.getElementById('progress-indicator');
const statusText = document.getElementById('status-text');
const encryptValidation = document.getElementById('encrypt-validation');
const decryptValidation = document.getElementById('decrypt-validation');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    encryptBtn.addEventListener('click', encryptFile);
    decryptBtn.addEventListener('click', decryptFile);
    
    // File input listeners
    encryptFileInput.addEventListener('change', () => updateFileLabel(encryptFileInput));
    decryptFileInput.addEventListener('change', () => updateFileLabel(decryptFileInput));
    
    // Password input listeners
    encryptPasswordInput.addEventListener('input', validatePassword);
    decryptPasswordInput.addEventListener('input', validatePassword);

    // Password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const icon = button.querySelector('.eye-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                input.type = 'password';
                icon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    });
});

function updateFileLabel(input) {
    const label = input.nextElementSibling;
    if (input.files.length > 0) {
        label.textContent = input.files[0].name;
    } else {
        label.textContent = input.id === 'encrypt-file' ? 'Choose File to Encrypt' : 'Choose File to Decrypt';
    }
}

function validatePassword(e) {
    const password = e.target.value;
    const isEncrypt = e.target.id === 'encrypt-password';
    const btn = isEncrypt ? encryptBtn : decryptBtn;
    const validationDiv = isEncrypt ? encryptValidation : decryptValidation;
    
    if (password.length < 8) {
        e.target.classList.add('invalid');
        btn.disabled = true;
        validationDiv.textContent = 'Password must be at least 8 characters long';
    } else {
        e.target.classList.remove('invalid');
        btn.disabled = false;
        validationDiv.textContent = '';
    }
}

async function encryptFile() {
    const file = encryptFileInput.files[0];
    const password = encryptPasswordInput.value;
    
    if (!file || !password) {
        updateStatus('Please select a file and enter a password');
        return;
    }
    
    try {
        updateUI(true);
        updateStatus(`Encrypting ${file.name}...`);
        
        // Generate a random salt
        const salt = crypto.getRandomValues(new Uint8Array(16));
        
        // Derive key from password
        const key = await deriveKey(password, salt);
        
        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Read and encrypt the file
        const fileData = await readFile(file);
        const encrypted = await encryptData(fileData, key, iv);
        
        // Combine salt + iv + encrypted data
        const finalData = new Uint8Array(salt.length + iv.length + encrypted.length);
        finalData.set(salt, 0);
        finalData.set(iv, salt.length);
        finalData.set(encrypted, salt.length + iv.length);
        
        // Save the encrypted file with original name
        saveFile(finalData, file.name);
        updateStatus('Encryption completed successfully');
    } catch (error) {
        updateStatus(`Encryption failed: ${error.message}`);
    } finally {
        updateUI(false);
    }
}

async function decryptFile() {
    const file = decryptFileInput.files[0];
    const password = decryptPasswordInput.value;
    
    if (!file || !password) {
        updateStatus('Please select a file and enter a password');
        return;
    }
    
    try {
        updateUI(true);
        updateStatus(`Decrypting ${file.name}...`);
        
        const fileData = await readFile(file);
        
        // Extract salt, iv, and encrypted data
        const salt = fileData.slice(0, 16);
        const iv = fileData.slice(16, 28);
        const encryptedData = fileData.slice(28);
        
        // Derive key from password and salt
        const key = await deriveKey(password, salt);
        
        // Decrypt the data
        const decrypted = await decryptData(encryptedData, key, iv);
        
        // Save the decrypted file with original name
        saveFile(decrypted, file.name);
        updateStatus('Decryption completed successfully');
    } catch (error) {
        updateStatus(`Decryption failed: ${error.message}`);
    } finally {
        updateUI(false);
    }
}

async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Use PBKDF2 to derive a key
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptData(data, key, iv) {
    return new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        )
    );
}

async function decryptData(data, key, iv) {
    return new Uint8Array(
        await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        )
    );
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

function saveFile(data, filename) {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateUI(isProcessing) {
    encryptBtn.disabled = isProcessing;
    decryptBtn.disabled = isProcessing;
    encryptFileInput.disabled = isProcessing;
    decryptFileInput.disabled = isProcessing;
    encryptPasswordInput.disabled = isProcessing;
    decryptPasswordInput.disabled = isProcessing;
    progressIndicator.style.width = isProcessing ? '100%' : '0';
}

function updateStatus(message) {
    statusText.textContent = message;
} 