// Filter state
let currentFilters = {
    category: 'all',
    priceRange: [0, 500],
    colors: [],
    materials: [],
    frameTypes: [],
    ratings: [],
    inStock: false,
    onSale: false
};

// Initialize filters
function initFilters() {
    const priceSlider = document.getElementById('priceRangeSlider');
    
    // Only initialize slider if not already initialized
    if (priceSlider && !priceSlider.noUiSlider) {
        noUiSlider.create(priceSlider, {
            start: [50, 300],
            connect: true,
            range: {
                'min': 0,
                'max': 500
            },
            format: {
                to: value => `$${Math.round(value)}`,
                from: value => Number(value.replace('$', ''))
            }
        });
        
        priceSlider.noUiSlider.on('update', function(values) {
            document.getElementById('priceMinDisplay').textContent = values[0];
            document.getElementById('priceMaxDisplay').textContent = values[1];
            currentFilters.priceRange = values.map(v => Number(v.replace('$', '')));
            applyFilters();
        });
    }
    
    // Color filter
    document.querySelectorAll('.color-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                currentFilters.colors.push(this.value);
            } else {
                currentFilters.colors = currentFilters.colors.filter(c => c !== this.value);
            }
            applyFilters();
        });
    });
    
    // Other filter event listeners
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('change', function() {
            const filterName = this.dataset.filter;
            const value = this.value;
            
            if (this.type === 'checkbox') {
                if (this.checked) {
                    if (!currentFilters[filterName].includes(value)) {
                        currentFilters[filterName].push(value);
                    }
                } else {
                    currentFilters[filterName] = currentFilters[filterName].filter(v => v !== value);
                }
            } else {
                currentFilters[filterName] = value;
            }
            
            applyFilters();
        });
    });
}

// Apply all current filters
function applyFilters() {
    fetch('assets/data/products.json')
        .then(response => response.json())
        .then(products => {
            // Apply filters
            let filteredProducts = products;
            
            // Category filter
            if (currentFilters.category !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.category === currentFilters.category);
            }
            
            // Price range filter
            filteredProducts = filteredProducts.filter(p => 
                p.price >= currentFilters.priceRange[0] && 
                p.price <= currentFilters.priceRange[1]
            );
            
            // Color filter
            if (currentFilters.colors.length > 0) {
                filteredProducts = filteredProducts.filter(p => 
                    currentFilters.colors.some(c => p.colors.includes(c))
                );
            }
            
            // Material filter
            if (currentFilters.materials.length > 0) {
                filteredProducts = filteredProducts.filter(p => 
                    currentFilters.materials.includes(p.material)
                );
            }
            
            // Frame type filter
            if (currentFilters.frameTypes.length > 0) {
                filteredProducts = filteredProducts.filter(p => 
                    currentFilters.frameTypes.includes(p.frameType)
                );
            }
            
            // Rating filter
            if (currentFilters.ratings.length > 0) {
                filteredProducts = filteredProducts.filter(p => 
                    currentFilters.ratings.some(r => p.rating >= r && p.rating < r + 1)
                );
            }
            
            // In stock filter
            if (currentFilters.inStock) {
                filteredProducts = filteredProducts.filter(p => p.stock > 0);
            }
            
            // On sale filter
            if (currentFilters.onSale) {
                filteredProducts = filteredProducts.filter(p => p.onSale);
            }
            
            // Display results
            displayProducts(filteredProducts);
            updateActiveFilterDisplay();
        });
}

// Update active filter display
function updateActiveFilterDisplay() {
    const activeFiltersContainer = document.getElementById('activeFilters');
    activeFiltersContainer.innerHTML = '';
    
    // Price range
    if (currentFilters.priceRange[0] > 0 || currentFilters.priceRange[1] < 500) {
        const priceFilter = document.createElement('div');
        priceFilter.className = 'badge bg-light text-dark me-2 mb-2';
        priceFilter.innerHTML = `
            Price: $${currentFilters.priceRange[0]} - $${currentFilters.priceRange[1]}
            <button class="btn-close btn-close-white btn-sm ms-2" onclick="removePriceFilter()"></button>
        `;
        activeFiltersContainer.appendChild(priceFilter);
    }
    
    // Add other active filters similarly...
}

function removePriceFilter() {
    currentFilters.priceRange = [0, 500];
    document.getElementById('priceRangeSlider').noUiSlider.set([0, 500]);
    applyFilters();
}