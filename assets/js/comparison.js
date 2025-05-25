// Comparison state
let comparisonProducts = [];

// Initialize comparison system
function initComparison() {
    // Load comparison from localStorage
    const savedComparison = localStorage.getItem('productComparison');
    if (savedComparison) {
        comparisonProducts = JSON.parse(savedComparison);
        updateComparisonDisplay();
    }
    
    // Add event listeners
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-compare')) {
            const productId = e.target.closest('.add-to-compare').dataset.id;
            toggleProductComparison(productId);
        }
        
        if (e.target.id === 'compare-button') {
            openComparisonModal();
        }
    });
}

// Toggle product in comparison
function toggleProductComparison(productId) {
    if (comparisonProducts.includes(productId)) {
        comparisonProducts = comparisonProducts.filter(id => id !== productId);
    } else {
        if (comparisonProducts.length >= 4) {
            alert('You can compare up to 4 products at a time');
            return;
        }
        comparisonProducts.push(productId);
    }
    
    // Save to localStorage
    localStorage.setItem('productComparison', JSON.stringify(comparisonProducts));
    updateComparisonDisplay();
}

// Update comparison display in UI
function updateComparisonDisplay() {
    const compareBtn = document.getElementById('compare-button');
    const compareBadge = document.getElementById('compare-badge');
    
    if (comparisonProducts.length > 0) {
        compareBtn.classList.remove('d-none');
        compareBadge.textContent = comparisonProducts.length;
    } else {
        compareBtn.classList.add('d-none');
    }
}

// Open comparison modal
function openComparisonModal() {
    if (comparisonProducts.length < 2) {
        alert('Please select at least 2 products to compare');
        return;
    }
    
    // Fetch comparison products
    fetch('assets/data/products.json')
        .then(response => response.json())
        .then(products => {
            const compareProducts = products.filter(p => comparisonProducts.includes(p.id));
            
            // Generate comparison table
            const comparisonBody = document.getElementById('comparison-body');
            comparisonBody.innerHTML = '';
            
            // Add rows for each comparison aspect
            addComparisonRow('Image', compareProducts, p => `<img src="${p.image}" style="height: 80px;" alt="${p.name}">`);
            addComparisonRow('Price', compareProducts, p => `$${p.price.toFixed(2)}`);
            addComparisonRow('Frame Type', compareProducts, p => p.frameType);
            addComparisonRow('Material', compareProducts, p => p.material);
            addComparisonRow('Colors', compareProducts, p => p.colors.join(', '));
            addComparisonRow('Rating', compareProducts, p => {
                const stars = Math.round(p.rating);
                return `<div class="text-warning">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>`;
            });
            
            // Show modal
            const comparisonModal = new bootstrap.Modal(document.getElementById('comparisonModal'));
            comparisonModal.show();
        });
}

function addComparisonRow(label, products, getValue) {
    const row = document.createElement('tr');
    
    const labelCell = document.createElement('th');
    labelCell.textContent = label;
    labelCell.scope = 'row';
    row.appendChild(labelCell);
    
    products.forEach(product => {
        const cell = document.createElement('td');
        cell.innerHTML = getValue(product);
        row.appendChild(cell);
    });
    
    document.getElementById('comparison-body').appendChild(row);
}