// UI Elements
const domainInput = document.getElementById('domain-input');
const resolveBtn = document.getElementById('resolve-btn');
const resultsContainer = document.getElementById('dns-results');
const exportJsonBtn = document.getElementById('export-json');
const recordTypeCheckboxes = document.querySelectorAll('.record-types input[type="checkbox"]');

// Store results for export
let currentResults = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    resolveBtn.addEventListener('click', resolveDNS);
    domainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') resolveDNS();
    });
    exportJsonBtn.addEventListener('click', exportResults);
});

async function resolveDNS() {
    const domain = domainInput.value.trim();
    if (!domain) {
        alert('Please enter a domain name');
        return;
    }

    // Get selected record types
    const selectedTypes = Array.from(recordTypeCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    if (selectedTypes.length === 0) {
        alert('Please select at least one record type');
        return;
    }

    try {
        updateUI(true);
        clearResults();
        
        const results = await Promise.all(selectedTypes.map(type => 
            queryDNS(domain, type)
        ));

        // Process and display results
        currentResults = results.flat().filter(result => result !== null);
        displayResults(currentResults);
        
        exportJsonBtn.disabled = currentResults.length === 0;
        updateUI(false);
    } catch (error) {
        alert(`DNS resolution failed: ${error.message}`);
        updateUI(false);
    }
}

async function queryDNS(domain, recordType) {
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType}`);
        const data = await response.json();

        if (!data.Answer) {
            return null;
        }

        return data.Answer.map(record => ({
            type: recordType,
            value: record.data,
            ttl: record.TTL
        }));
    } catch (error) {
        console.error(`Error querying ${recordType} records:`, error);
        return null;
    }
}

function displayResults(results) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No DNS records found';
        resultsContainer.appendChild(noResults);
        return;
    }

    results.forEach(result => {
        const resultRow = document.createElement('div');
        resultRow.className = 'result-row';

        const typeCol = document.createElement('span');
        typeCol.className = 'col-type';
        typeCol.textContent = result.type;

        const valueCol = document.createElement('span');
        valueCol.className = 'col-value';
        valueCol.textContent = result.value;

        const ttlCol = document.createElement('span');
        ttlCol.className = 'col-ttl';
        ttlCol.textContent = result.ttl;

        resultRow.appendChild(typeCol);
        resultRow.appendChild(valueCol);
        resultRow.appendChild(ttlCol);

        resultsContainer.appendChild(resultRow);
    });
}

function clearResults() {
    resultsContainer.innerHTML = '';
    currentResults = [];
    exportJsonBtn.disabled = true;
}

function exportResults() {
    if (currentResults.length === 0) {
        alert('No results to export');
        return;
    }

    const domain = domainInput.value.trim();
    const exportData = {
        domain: domain,
        timestamp: new Date().toISOString(),
        results: currentResults
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dns_results_${domain}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateUI(isProcessing) {
    resolveBtn.disabled = isProcessing;
    domainInput.disabled = isProcessing;
    recordTypeCheckboxes.forEach(cb => cb.disabled = isProcessing);
    resolveBtn.textContent = isProcessing ? 'Resolving...' : 'Resolve DNS';
} 