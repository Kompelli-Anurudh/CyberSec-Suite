// UI Elements
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
const selectedImage = document.getElementById('selected-image');
const messageInput = document.getElementById('message-input');
const loadTextBtn = document.getElementById('load-text');
const passwordInput = document.getElementById('password-input');
const encodeBtn = document.getElementById('encode-btn');
const decodeBtn = document.getElementById('decode-btn');
const outputText = document.getElementById('output-text');
const progressIndicator = document.getElementById('progress-indicator');
const statusText = document.getElementById('status-text');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    imageInput.addEventListener('change', handleImageSelect);
    loadTextBtn.addEventListener('click', loadTextFile);
    encodeBtn.addEventListener('click', encodeMessage);
    decodeBtn.addEventListener('click', decodeMessage);

    // Add password toggle functionality
    const passwordToggle = document.querySelector('.password-toggle');
    passwordToggle.addEventListener('click', () => {
        const input = passwordInput;
        const icon = passwordToggle.querySelector('.eye-icon');
        
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

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
        alert('Please select an image file (PNG, JPEG, or BMP)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        selectedImage.textContent = `Selected: ${file.name}`;
    };
    reader.readAsDataURL(file);
}

function loadTextFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = e => {
            messageInput.value = e.target.result;
            updateStatus('Text file loaded successfully');
        };
        
        reader.onerror = () => {
            updateStatus('Error reading text file');
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

async function encodeMessage() {
    if (!validateInputs('encode')) return;

    try {
        updateUI(true);
        updateStatus('Encoding message...');
        
        const image = await loadImage(imagePreview.src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const message = messageInput.value;
        const password = passwordInput.value;
        
        // Encode message length at the beginning
        const messageLength = message.length;
        if (messageLength * 8 > imageData.data.length / 4 - 4) {
            throw new Error('Message is too long for this image');
        }
        
        // Encode the message
        encodeData(imageData.data, message);
        ctx.putImageData(imageData, 0, 0);
        
        // Save the image
        const encodedImage = canvas.toDataURL('image/png');
        downloadImage(encodedImage, 'encoded_image.png');
        
        updateStatus('Message encoded successfully');
    } catch (error) {
        updateStatus(`Error: ${error.message}`);
    } finally {
        updateUI(false);
    }
}

async function decodeMessage() {
    if (!validateInputs('decode')) return;

    try {
        updateUI(true);
        updateStatus('Decoding message...');
        
        const image = await loadImage(imagePreview.src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const password = passwordInput.value;
        
        // Decode the message
        const message = decodeData(imageData.data);
        outputText.value = message;
        
        updateStatus('Message decoded successfully');
    } catch (error) {
        updateStatus(`Error: ${error.message}`);
    } finally {
        updateUI(false);
    }
}

function validateInputs(mode) {
    if (!imagePreview.src) {
        alert('Please select an image first');
        return false;
    }
    
    if (!passwordInput.value) {
        alert('Please enter a password');
        return false;
    }
    
    if (mode === 'encode' && !messageInput.value) {
        alert('Please enter a message to encode');
        return false;
    }
    
    return true;
}

function updateUI(isProcessing) {
    encodeBtn.disabled = isProcessing;
    decodeBtn.disabled = isProcessing;
    imageInput.disabled = isProcessing;
    messageInput.disabled = isProcessing;
    passwordInput.disabled = isProcessing;
    loadTextBtn.disabled = isProcessing;
    
    progressIndicator.style.width = isProcessing ? '100%' : '0';
    progressIndicator.classList.toggle('scanning', isProcessing);
}

function updateStatus(message) {
    statusText.textContent = message;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}

function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function encodeData(imageData, message) {
    const messageLength = message.length;
    let bitIndex = 0;
    
    // Encode message length (32 bits)
    for (let i = 0; i < 32; i++) {
        const bit = (messageLength >> i) & 1;
        imageData[i * 4] = (imageData[i * 4] & 254) | bit;
    }
    
    // Encode message
    for (let i = 0; i < messageLength; i++) {
        const charCode = message.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            const bit = (charCode >> j) & 1;
            const pos = (32 + bitIndex) * 4;
            imageData[pos] = (imageData[pos] & 254) | bit;
            bitIndex++;
        }
    }
}

function decodeData(imageData) {
    // Decode message length
    let messageLength = 0;
    for (let i = 0; i < 32; i++) {
        const bit = imageData[i * 4] & 1;
        messageLength |= bit << i;
    }
    
    // Decode message
    let message = '';
    for (let i = 0; i < messageLength; i++) {
        let charCode = 0;
        for (let j = 0; j < 8; j++) {
            const pos = (32 + i * 8 + j) * 4;
            const bit = imageData[pos] & 1;
            charCode |= bit << j;
        }
        message += String.fromCharCode(charCode);
    }
    
    return message;
} 