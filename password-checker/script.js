// Password Strength Checker
function checkPassword() {
    const password = document.getElementById('password-input').value;
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    // Update requirements
    updateRequirements(password);
    
    // Calculate strength
    const strength = calculatePasswordStrength(password);
    
    // Update strength meter
    updateStrengthMeter(strength);
}

function updateRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    for (const [req, met] of Object.entries(requirements)) {
        const element = document.getElementById(req);
        element.style.color = met ? '#00C851' : '#666';
        element.style.fontWeight = met ? '500' : '400';
    }
    
    return Object.values(requirements).filter(Boolean).length;
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    // Length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    // Character types
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    // Complexity
    if (/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$/.test(password)) {
        score += 2;
    }
    
    return score;
}

function updateStrengthMeter(strength) {
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    // Remove previous classes
    strengthBar.className = '';
    
    // Calculate percentage and update width
    const percentage = (strength / 9) * 100;
    strengthBar.style.width = `${percentage}%`;
    
    // Update color and text based on strength
    if (strength <= 2) {
        strengthBar.classList.add('strength-weak');
        strengthText.textContent = 'Weak Password';
    } else if (strength <= 4) {
        strengthBar.classList.add('strength-fair');
        strengthText.textContent = 'Fair Password';
    } else if (strength <= 6) {
        strengthBar.classList.add('strength-good');
        strengthText.textContent = 'Good Password';
    } else {
        strengthBar.classList.add('strength-strong');
        strengthText.textContent = 'Strong Password';
    }
}

// Password Generator
function generatePassword() {
    const length = parseInt(document.getElementById('length-range').value);
    const includeUpper = document.getElementById('uppercase-check').checked;
    const includeLower = document.getElementById('lowercase-check').checked;
    const includeNumbers = document.getElementById('numbers-check').checked;
    const includeSymbols = document.getElementById('symbols-check').checked;
    
    const charset = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*(),.?":{}|<>'
    };
    
    let availableChars = '';
    if (includeUpper) availableChars += charset.upper;
    if (includeLower) availableChars += charset.lower;
    if (includeNumbers) availableChars += charset.numbers;
    if (includeSymbols) availableChars += charset.symbols;
    
    if (!availableChars) {
        alert('Please select at least one character type');
        return;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        password += availableChars[randomIndex];
    }
    
    document.getElementById('generated-password').value = password;
}

function copyPassword() {
    const passwordField = document.getElementById('generated-password');
    passwordField.select();
    document.execCommand('copy');
    
    const copyBtn = document.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// Update length value display
document.getElementById('length-range').addEventListener('input', function() {
    document.getElementById('length-value').textContent = this.value;
}); 