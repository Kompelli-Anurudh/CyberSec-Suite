document.addEventListener('DOMContentLoaded', () => {
    const httpRequestTextarea = document.getElementById('http-request');
    const generatePocButton = document.getElementById('generate-poc');
    const copyPocButton = document.getElementById('copy-poc');
    const pocFormContainer = document.getElementById('poc-form-container');

    generatePocButton.addEventListener('click', () => {
        const request = httpRequestTextarea.value.trim();
        if (!request) {
            alert('Please paste an HTTP request first');
            return;
        }

        try {
            const pocForm = generatePocForm(request);
            pocFormContainer.innerHTML = `<pre><code>${escapeHtml(pocForm)}</code></pre>`;
            copyPocButton.disabled = false;
        } catch (error) {
            alert('Error parsing HTTP request: ' + error.message);
        }
    });

    copyPocButton.addEventListener('click', () => {
        const pocForm = generatePocForm(httpRequestTextarea.value.trim());
        navigator.clipboard.writeText(pocForm)
            .then(() => alert('POC form copied to clipboard!'))
            .catch(err => alert('Failed to copy: ' + err.message));
    });

    function generatePocForm(request) {
        // Validate request format
        const lines = request.split('\n');
        if (lines.length < 1) {
            throw new Error('Invalid HTTP request format');
        }

        // Parse the HTTP request
        const [requestLine, ...headerLines] = lines;
        const [method, path, httpVersion] = requestLine.split(' ');
        
        if (!method || !path) {
            throw new Error('Invalid request line format');
        }

        // Find the host from headers
        const hostHeader = headerLines.find(line => line.toLowerCase().startsWith('host:'));
        if (!hostHeader) {
            throw new Error('Host header is required');
        }
        const host = hostHeader.split(':')[1]?.trim() || '';
        
        // Find the content type and body
        const contentTypeHeader = headerLines.find(line => line.toLowerCase().startsWith('content-type:'));
        const contentType = contentTypeHeader ? contentTypeHeader.split(':')[1].trim() : '';
        
        // Find request body
        const bodyIndex = headerLines.findIndex(line => line.trim() === '');
        const body = bodyIndex !== -1 ? headerLines.slice(bodyIndex + 1).join('\n').trim() : '';
        
        // Parse body parameters
        let params = {};
        if (body) {
            if (contentType.includes('application/x-www-form-urlencoded')) {
                try {
                    params = Object.fromEntries(new URLSearchParams(body));
                } catch (e) {
                    throw new Error('Invalid URL-encoded form data');
                }
            } else if (contentType.includes('application/json')) {
                try {
                    params = JSON.parse(body);
                } catch (e) {
                    throw new Error('Invalid JSON body format');
                }
            }
        }

        // Generate the form HTML with proper escaping
        const formAction = `https://${host}${path}`;
        let formHtml = `<form action="${escapeHtml(formAction)}" method="${method.toLowerCase()}">\n`;
        
        // Add hidden inputs for parameters
        for (const [key, value] of Object.entries(params)) {
            formHtml += `    <input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}">\n`;
        }
        
        formHtml += '    <input type="submit" value="Submit" class="primary-btn">\n';
        formHtml += '</form>';
        
        return formHtml;
    }

    // Helper function to escape HTML special characters
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});

