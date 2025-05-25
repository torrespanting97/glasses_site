// Initialize shop
document.addEventListener('DOMContentLoaded', function() {
    // Load products based on URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'all';
    const searchQuery = urlParams.get('q') || '';
    
    // Initialize all systems
    initFilters();
    initComparison();
    initReviews();
    initRecentlyViewed();
    
    // Load and display products
    loadProducts(category, searchQuery).then(products => {
        displayProducts(products);
        updateFilterCounts(products);
    });
});

// Modified loadProducts function to use local data
async function loadProducts(category = 'all', searchQuery = '') {
    // Use local products data instead of fetch
    const products = window.productsData || [];
    
    // Filter by category if not 'all'
    if (category !== 'all') {
        return products.filter(p => p.category === category);
    }
    
    // Filter by search query if present
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query)
        );
    }
    
    return products;
}

// Display products in the grid
function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
    
    if (products.length === 0) {
        productGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4>No products found</h4>
                <p>Try adjusting your filters or search query</p>
                <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }
    
// In your shop.js, modify the product rendering to include cart functionality
products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'col-md-4 col-6 mb-4';
    productCard.innerHTML = `
        <div class="card product-card h-100">
            ${product.onSale ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2">Sale</span>` : ''}
            <div class="product-image-container">
                <img src="${product.image}" class="card-img-top" alt="${product.name}" loading="lazy">
                <div class="product-actions">
                    <button class="btn btn-sm btn-outline-secondary quick-view" data-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary add-to-compare" data-id="${product.id}">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary add-to-wishlist" data-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="product-rating" data-id="${product.id}" data-rating="${product.rating}"></div>
                    <small class="text-muted">${product.reviews.length} reviews</small>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold text-primary">$${product.price.toFixed(2)}</span>
                        ${product.oldPrice ? `<small class="text-decoration-line-through text-muted ms-2">$${product.oldPrice.toFixed(2)}</small>` : ''}
                    </div>
                </div>
            </div>
            <div class="card-footer bg-transparent">
                <button class="btn btn-primary w-100 add-to-cart" data-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}"
                    data-image="${product.image}"
                    data-category="${product.category}">
                    <i class="fas fa-shopping-cart me-2"></i>Add to Cart
                </button>
            </div>
        </div>
    `;
    productGrid.appendChild(productCard);
});

// Add event listeners for add-to-cart buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
        const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
        const product = {
            id: button.dataset.id,
            name: button.dataset.name,
            price: parseFloat(button.dataset.price),
            image: button.dataset.image,
            category: button.dataset.category,
            quantity: 1
        };
        
        // Call the addToCart function (defined in cart.js)
        if (typeof addToCart === 'function') {
            addToCart(product);
        } else {
            console.error('Cart functionality not loaded');
            // Fallback behavior
            window.location.href = 'cart.html';
        }
    }
});
    
    // Initialize rating stars
    initRatingDisplays();
    
    // Add event listeners
    addProductEventListeners();
    
    // Add to recently viewed
    products.slice(0, 3).forEach(product => {
        addToRecentlyViewed(product.id);
    });
}

// Reset all filters
function resetFilters() {
    window.location.href = 'shop.html';
}