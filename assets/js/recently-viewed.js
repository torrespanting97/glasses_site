// Initialize recently viewed
function initRecentlyViewed() {
    const recentlyViewed = getRecentlyViewed();
    if (recentlyViewed.length > 0) {
        displayRecentlyViewed(recentlyViewed);
    }
}

// Get recently viewed from localStorage
function getRecentlyViewed() {
    return JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
}

// Add product to recently viewed
function addToRecentlyViewed(productId) {
    let recentlyViewed = getRecentlyViewed();
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(id => id !== productId);
    
    // Add to beginning
    recentlyViewed.unshift(productId);
    
    // Keep only last 5 viewed
    if (recentlyViewed.length > 5) {
        recentlyViewed = recentlyViewed.slice(0, 5);
    }
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    displayRecentlyViewed(recentlyViewed);
}

// Display recently viewed products
function displayRecentlyViewed(productIds) {
    const container = document.getElementById('recently-viewed');
    if (!container) return;
    
    fetch('assets/data/products.json')
        .then(response => response.json())
        .then(products => {
            const recentProducts = products.filter(p => productIds.includes(p.id));
            
            if (recentProducts.length === 0) {
                container.style.display = 'none';
                return;
            }
            
            container.innerHTML = `
                <h3 class="mb-4">Recently Viewed</h3>
                <div class="row">
                    ${recentProducts.map(product => `
                        <div class="col-6 col-md-3 mb-3">
                            <div class="card h-100">
                                <img src="${product.image}" class="card-img-top" alt="${product.name}">
                                <div class="card-body">
                                    <h6 class="card-title">${product.name}</h6>
                                    <div class="text-primary">$${product.price.toFixed(2)}</div>
                                    <a href="product.html?id=${product.id}" class="stretched-link"></a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
}