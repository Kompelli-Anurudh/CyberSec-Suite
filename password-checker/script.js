// UI Elements - Password Checker
const passwordInput = document.getElementById('password');
const checkButton = document.getElementById('checkBtn');
const resultsContainer = document.getElementById('results');
const strengthMeter = document.getElementById('strengthMeter');
const strengthText = document.getElementById('strengthText');
const criteriaList = document.getElementById('criteriaList');

// UI Elements - Password Generator
const generateButton = document.getElementById('generateBtn');
const copyButton = document.getElementById('copyBtn');
const generatedPasswordInput = document.getElementById('generated-password');
const lengthRange = document.getElementById('length-range');
const lengthValue = document.getElementById('length-value');
const uppercaseCheck = document.getElementById('uppercase-check');
const lowercaseCheck = document.getElementById('lowercase-check');
const numbersCheck = document.getElementById('numbers-check');
const symbolsCheck = document.getElementById('symbols-check');

// Password criteria
const criteria = [
    { id: 'length', description: 'At least 8 characters', test: pwd => pwd.length >= 8 },
    { id: 'uppercase', description: 'At least one uppercase letter', test: pwd => /[A-Z]/.test(pwd) },
    { id: 'lowercase', description: 'At least one lowercase letter', test: pwd => /[a-z]/.test(pwd) },
    { id: 'number', description: 'At least one number', test: pwd => /[0-9]/.test(pwd) },
    { id: 'special', description: 'At least one special character', test: pwd => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
];

// Character sets for password generation
const charsets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*(),.?":{}|<>'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Password Checker
    criteriaList.innerHTML = criteria.map(criterion => 
        `<li id="${criterion.id}">${criterion.description}</li>`
    ).join('');
    
    const meterDiv = document.createElement('div');
    strengthMeter.appendChild(meterDiv);
    
    // Add event listeners - Password Checker
    checkButton.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    // Add event listeners - Password Generator
    generateButton.addEventListener('click', generatePassword);
    copyButton.addEventListener('click', copyToClipboard);
    lengthRange.addEventListener('input', updateLengthValue);
});

// Password Checker Functions
function checkPassword() {
    const password = passwordInput.value;
    
    if (!password) {
        alert('Please enter a password');
        return;
    }
    
    resultsContainer.style.display = 'block';
    
    const metCriteria = criteria.filter(criterion => criterion.test(password));
    
    criteria.forEach(criterion => {
        const element = document.getElementById(criterion.id);
        const isMet = criterion.test(password);
        element.className = isMet ? 'met' : '';
    });
    
    const strength = calculateStrength(password, metCriteria.length);
    
    const meterDiv = strengthMeter.querySelector('div');
    meterDiv.style.width = `${strength.percentage}%`;
    meterDiv.className = strength.class;
    
    strengthText.textContent = strength.description;
}

function calculateStrength(password, criteriaCount) {
    let percentage = (criteriaCount / criteria.length) * 100;
    
    if (password.length >= 12) percentage += 10;
    if (password.length >= 16) percentage += 10;
    
    percentage = Math.min(percentage, 100);
    
    if (percentage >= 80) {
        return { percentage, class: 'strength-strong', description: 'Strong Password' };
    } else if (percentage >= 60) {
        return { percentage, class: 'strength-medium', description: 'Medium Strength Password' };
    } else {
        return { percentage, class: 'strength-weak', description: 'Weak Password' };
    }
}

// Password Generator Functions
function generatePassword() {
    const length = parseInt(lengthRange.value);
    let charset = '';
    
    if (uppercaseCheck.checked) charset += charsets.uppercase;
    if (lowercaseCheck.checked) charset += charsets.lowercase;
    if (numbersCheck.checked) charset += charsets.numbers;
    if (symbolsCheck.checked) charset += charsets.symbols;
    
    if (!charset) {
        alert('Please select at least one character type');
        return;
    }
    
    let password = '';
    const charsetLength = charset.length;
    
    // Ensure at least one character from each selected type
    if (uppercaseCheck.checked) password += getRandomChar(charsets.uppercase);
    if (lowercaseCheck.checked) password += getRandomChar(charsets.lowercase);
    if (numbersCheck.checked) password += getRandomChar(charsets.numbers);
    if (symbolsCheck.checked) password += getRandomChar(charsets.symbols);
    
    // Fill the rest of the password
    while (password.length < length) {
        password += getRandomChar(charset);
    }
    
    // Shuffle the password
    password = shuffleString(password);
    
    generatedPasswordInput.value = password;
    copyButton.textContent = 'Copy to Clipboard';
}

function getRandomChar(charset) {
    return charset[Math.floor(Math.random() * charset.length)];
}

function shuffleString(str) {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
}

function copyToClipboard() {
    if (!generatedPasswordInput.value) {
        alert('Generate a password first');
        return;
    }
    
    generatedPasswordInput.select();
    document.execCommand('copy');
    
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
        copyButton.textContent = 'Copy to Clipboard';
    }, 2000);
}

function updateLengthValue() {
    lengthValue.textContent = lengthRange.value;
} 