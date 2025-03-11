document.addEventListener('DOMContentLoaded', () => {
    const inputTypeButtons = document.querySelectorAll('.input-type-btn');
    const textInputContainer = document.getElementById('text-input-container');
    const fileInputContainer = document.getElementById('file-input-container');
    const textInput = document.getElementById('text-input');
    const fileInput = document.getElementById('file-input');
    const generateBtn = document.getElementById('generate-btn');
    const resultsSection = document.querySelector('.results-section');
    const hashResults = document.getElementById('hash-results');

    // Input type switching
    inputTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            inputTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const inputType = button.dataset.type;
            if (inputType === 'text') {
                textInputContainer.classList.remove('hidden');
                fileInputContainer.classList.add('hidden');
            } else {
                textInputContainer.classList.add('hidden');
                fileInputContainer.classList.remove('hidden');
            }
        });
    });

    // Generate hash values
    generateBtn.addEventListener('click', async () => {
        const selectedAlgorithms = Array.from(document.querySelectorAll('.algorithm-checkbox input:checked'))
            .map(checkbox => checkbox.value);

        if (selectedAlgorithms.length === 0) {
            alert('Please select at least one hash algorithm.');
            return;
        }

        const activeInputType = document.querySelector('.input-type-btn.active').dataset.type;
        let content = '';

        if (activeInputType === 'text') {
            content = textInput.value;
            if (!content) {
                alert('Please enter some text to hash.');
                return;
            }
            generateHashes(content, selectedAlgorithms);
        } else {
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select a file.');
                return;
            }
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                alert('File size exceeds 100MB limit.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                generateHashes(e.target.result, selectedAlgorithms);
            };
            reader.readAsText(file);
        }
    });

    function generateHashes(content, algorithms) {
        hashResults.innerHTML = '';
        resultsSection.classList.remove('hidden');

        algorithms.forEach(algorithm => {
            let hash = '';
            switch (algorithm) {
                case 'md5':
                    hash = CryptoJS.MD5(content).toString();
                    break;
                case 'sha1':
                    hash = CryptoJS.SHA1(content).toString();
                    break;
                case 'sha256':
                    hash = CryptoJS.SHA256(content).toString();
                    break;
                case 'sha512':
                    hash = CryptoJS.SHA512(content).toString();
                    break;
            }

            const resultElement = document.createElement('div');
            resultElement.className = 'hash-result';
            resultElement.innerHTML = `
                <h4 class="hash-algorithm">${algorithm.toUpperCase()}</h4>
                <div class="hash-value">${hash}</div>
                <button class="copy-btn" data-hash="${hash}">Copy</button>
            `;
            hashResults.appendChild(resultElement);
        });

        // Add copy functionality
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const hash = btn.dataset.hash;
                navigator.clipboard.writeText(hash).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 1500);
                });
            });
        });
    }
});