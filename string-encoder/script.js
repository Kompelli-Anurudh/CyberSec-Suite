// Define the encoding/decoding formats and their functions
const formats = {
    // Binary conversion
    'Binary': {
        encode: text => text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
        decode: binary => binary.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('')
    },
    // Hexadecimal conversion
    'Hexadecimal': {
        encode: text => Array.from(text).map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join(' '),
        decode: hex => hex.split(' ').map(h => String.fromCharCode(parseInt(h, 16))).join('')
    },
    // HTML Escape (Basic)
    'HTML Escape (Basic)': {
        encode: text => text.replace(/[<>&"']/g, char => ({
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&apos;'
        })[char]),
        decode: html => html.replace(/&[^;]+;/g, entity => ({
            '&lt;': '<',
            '&gt;': '>',
            '&amp;': '&',
            '&quot;': '"',
            '&apos;': "'"
        })[entity] || entity)
    },
    // URL Encoding
    'URL Encoding': {
        encode: text => encodeURIComponent(text),
        decode: url => decodeURIComponent(url)
    },
    // Base64
    'Base64': {
        encode: text => btoa(unescape(encodeURIComponent(text))),
        decode: b64 => decodeURIComponent(escape(atob(b64)))
    },
    // Case transformations
    'Upper Case': {
        encode: text => text.toUpperCase(),
        decode: text => text.toLowerCase()
    },
    'Lower Case': {
        encode: text => text.toLowerCase(),
        decode: text => text
    },
    'Capitalize': {
        encode: text => text.replace(/\b\w/g, char => char.toUpperCase()),
        decode: text => text.toLowerCase()
    },
    'camelCase': {
        encode: text => text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase()),
        decode: text => text.replace(/[A-Z]/g, char => ` ${char.toLowerCase()}`).trim()
    },
    'PascalCase': {
        encode: text => text.toLowerCase().replace(/(^|[^a-zA-Z0-9]+)(.)/g, (_, __, char) => char.toUpperCase()),
        decode: text => text.replace(/[A-Z]/g, char => ` ${char.toLowerCase()}`).trim()
    },
    'snake_case': {
        encode: text => text.toLowerCase().replace(/\s+/g, '_'),
        decode: text => text.replace(/_/g, ' ')
    },
    'SCREAMING_SNAKE': {
        encode: text => text.toUpperCase().replace(/\s+/g, '_'),
        decode: text => text.toLowerCase().replace(/_/g, ' ')
    },
    'kebab-case': {
        encode: text => text.toLowerCase().replace(/\s+/g, '-'),
        decode: text => text.replace(/-/g, ' ')
    },
    'Reverse': {
        encode: text => text.split('').reverse().join(''),
        decode: text => text.split('').reverse().join('')
    }
};

// Function to create output item
function createOutputItem(format, value, container) {
    const item = document.createElement('div');
    item.className = 'output-item';
    
    const title = document.createElement('h4');
    title.textContent = format;
    
    const content = document.createElement('div');
    content.className = 'output-content';
    content.textContent = value;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(value);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 1500);
    };
    
    item.appendChild(title);
    item.appendChild(content);
    item.appendChild(copyBtn);
    container.appendChild(item);
}

// Function to update all outputs
function updateOutputs(text) {
    const encodeGrid = document.getElementById('encode-grid');
    const decodeGrid = document.getElementById('decode-grid');
    
    encodeGrid.innerHTML = '';
    decodeGrid.innerHTML = '';
    
    if (!text) return;
    
    for (const [format, functions] of Object.entries(formats)) {
        try {
            const encoded = functions.encode(text);
            createOutputItem(format, encoded, encodeGrid);
            
            if (format !== 'Reverse') { // Skip decode for reverse since it's the same operation
                const decoded = functions.decode(encoded);
                createOutputItem(format, decoded, decodeGrid);
            }
        } catch (error) {
            console.error(`Error processing ${format}:`, error);
        }
    }
}

// Set up input listener
const inputText = document.getElementById('input-text');
inputText.addEventListener('input', (e) => updateOutputs(e.target.value));