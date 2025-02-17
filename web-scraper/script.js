// Global variables
let isScrapingActive = false;
let scrapedData = null;

// Initialize tabs
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
});

function switchTab(tabId) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) btn.classList.add('active');
    });

    // Update active tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabId) pane.classList.add('active');
    });
}

function log(message) {
    const logArea = document.getElementById('log-area');
    const timestamp = new Date().toLocaleTimeString();
    logArea.innerHTML += `[${timestamp}] ${message}\n`;
    logArea.scrollTop = logArea.scrollHeight;
}

async function startScraping() {
    const urlInput = document.getElementById('website-url');
    const url = urlInput.value.trim();

    if (!url) {
        alert('Please enter a website URL');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlInput.value = 'https://' + url;
    }

    // Update UI state
    isScrapingActive = true;
    updateScrapingState(true);
    clearResults();

    try {
        // Start progress indicator
        document.getElementById('progress-indicator').classList.add('progress-active');
        
        // Use a proxy service or backend API to handle CORS
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        log(`Starting to scrape: ${url}`);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (data.contents) {
            // Parse the HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            // Extract data
            scrapedData = {
                metadata: {
                    url: url,
                    timestamp: new Date().toISOString(),
                    domain: new URL(url).hostname
                },
                sections: {
                    text_content: extractTextContent(doc),
                    links: extractLinks(doc, url),
                    images: extractImages(doc, url),
                    forms: extractForms(doc),
                    tables: extractTables(doc),
                    emails: extractEmails(doc)
                }
            };

            // Display results
            displayResults(scrapedData);
            log('Scraping completed successfully');
        }
    } catch (error) {
        log(`Error: ${error.message}`);
        alert('Failed to scrape the website. Please check the URL and try again.');
    } finally {
        // Update UI state
        isScrapingActive = false;
        updateScrapingState(false);
        document.getElementById('progress-indicator').classList.remove('progress-active');
    }
}

function stopScraping() {
    isScrapingActive = false;
    updateScrapingState(false);
    log('Scraping stopped by user');
}

function updateScrapingState(isActive) {
    const startButton = document.getElementById('start-scraping');
    const stopButton = document.getElementById('stop-scraping');
    const exportJsonButton = document.getElementById('export-json');
    const exportTxtButton = document.getElementById('export-txt');
    const statusText = document.getElementById('status-text');

    startButton.disabled = isActive;
    stopButton.disabled = !isActive;
    exportJsonButton.disabled = isActive;
    exportTxtButton.disabled = isActive;
    statusText.textContent = isActive ? 'Scraping in progress...' : 'Ready';
}

function clearResults() {
    document.querySelectorAll('.content-area').forEach(area => {
        area.innerHTML = '';
    });
}

// Data extraction functions
function extractTextContent(doc) {
    const textNodes = Array.from(doc.body.getElementsByTagName('*'))
        .filter(element => !['script', 'style'].includes(element.tagName.toLowerCase()))
        .map(element => element.textContent.trim())
        .filter(text => text.length > 0);
    return [...new Set(textNodes)];
}

function extractLinks(doc, baseUrl) {
    return Array.from(doc.getElementsByTagName('a'))
        .map(link => ({
            text: link.textContent.trim(),
            url: new URL(link.href, baseUrl).href
        }))
        .filter(link => link.text && link.url.startsWith('http'));
}

function extractImages(doc, baseUrl) {
    return Array.from(doc.getElementsByTagName('img'))
        .map(img => ({
            src: new URL(img.src, baseUrl).href,
            alt: img.alt || '',
            title: img.title || ''
        }))
        .filter(img => img.src);
}

function extractForms(doc) {
    return Array.from(doc.getElementsByTagName('form'))
        .map(form => ({
            action: form.action || '',
            method: form.method || 'get',
            fields: Array.from(form.querySelectorAll('input, textarea, select'))
                .map(field => ({
                    type: field.type || 'text',
                    name: field.name || '',
                    id: field.id || ''
                }))
        }));
}

function extractTables(doc) {
    return Array.from(doc.getElementsByTagName('table'))
        .map(table => Array.from(table.rows)
            .map(row => Array.from(row.cells)
                .map(cell => cell.textContent.trim())
            )
        );
}

function extractEmails(doc) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const text = doc.body.textContent;
    const emails = text.match(emailRegex) || [];
    return [...new Set(emails)];
}

// Display functions
function displayResults(data) {
    // Text Content
    const textArea = document.querySelector('#text .content-area');
    textArea.innerHTML = data.sections.text_content
        .map(text => `<p>${text}</p>`)
        .join('');

    // Links
    const linksArea = document.querySelector('#links .content-area');
    linksArea.innerHTML = data.sections.links
        .map(link => `<a href="${link.url}" target="_blank">${link.text}</a>`)
        .join('<br>');

    // Images
    const imagesArea = document.querySelector('#images .content-area');
    imagesArea.innerHTML = data.sections.images
        .map(img => `<img src="${img.src}" alt="${img.alt}" title="${img.title}">`)
        .join('');

    // Forms
    const formsArea = document.querySelector('#forms .content-area');
    formsArea.innerHTML = data.sections.forms
        .map(form => `
            <div class="form-info">
                <h4>Form</h4>
                <p>Action: ${form.action}</p>
                <p>Method: ${form.method}</p>
                <h5>Fields:</h5>
                <ul>
                    ${form.fields.map(field => `
                        <li>Type: ${field.type}, Name: ${field.name}, ID: ${field.id}</li>
                    `).join('')}
                </ul>
            </div>
        `).join('<hr>');

    // Tables
    const tablesArea = document.querySelector('#tables .content-area');
    tablesArea.innerHTML = data.sections.tables
        .map(table => `
            <table class="scraped-table">
                ${table.map(row => `
                    <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                `).join('')}
            </table>
        `).join('<hr>');

    // Emails
    const emailsArea = document.querySelector('#emails .content-area');
    emailsArea.innerHTML = data.sections.emails
        .map(email => `<div>${email}</div>`)
        .join('');
}

function exportResults(format) {
    if (!scrapedData) return;

    const filename = `scraped_data_${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}`;
    let content;
    let type;

    if (format === 'json') {
        content = JSON.stringify(scrapedData, null, 2);
        type = 'application/json';
    } else {
        content = Object.entries(scrapedData.sections)
            .map(([section, data]) => `### ${section.toUpperCase()} ###\n\n${
                Array.isArray(data) ? data.map(item => 
                    typeof item === 'object' ? JSON.stringify(item, null, 2) : item
                ).join('\n') : data
            }\n\n`)
            .join('---\n\n');
        type = 'text/plain';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
} 