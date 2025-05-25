// assets/js/cart.js

// Initialize cart if it doesn't exist
if (!localStorage.getItem('cart')) {
    localStorage.setItem('cart', JSON.stringify([]));
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const countElement = document.getElementById('cart-count');
    
    if (cart.length > 0) {
        countElement.textContent = cart.reduce((total, item) => total + item.quantity, 0);
        countElement.style.display = 'block';
    } else {
        countElement.style.display = 'none';
    }
}

// Add to cart function
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += product.quantity || 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: product.quantity || 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show notification
    showCartNotification(product);
}

// Show cart notification
function showCartNotification(product) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification alert alert-success';
    notification.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        Added to cart: ${product.name}
        <a href="cart.html" class="ms-2">View Cart</a>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Load cart items on cart page
function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const cartItemsElement = document.getElementById('cart-items');
    const emptyRow = document.querySelector('.cart-empty-row');
    
    if (cart.length === 0) {
        emptyRow.style.display = '';
        document.getElementById('checkout-btn').setAttribute('disabled', 'true');
        updateTotals(0);
        return;
    }
    
    emptyRow.style.display = 'none';
    document.getElementById('checkout-btn').removeAttribute('disabled');
    
    let html = '';
    let subtotal = 0;
    
    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
        <tr data-id="${item.id}">
            <td>
                <button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}">
                    <i class="fas fa-times"></i>
                </button>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.name}" class="img-thumbnail me-3" style="width: 60px;">
                    <div>
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">${item.category}</small>
                    </div>
                </div>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <div class="input-group input-group-sm" style="width: 100px;">
                    <button class="btn btn-outline-secondary decrease-qty" type="button" data-id="${item.id}">-</button>
                    <input type="number" class="form-control text-center quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="btn btn-outline-secondary increase-qty" type="button" data-id="${item.id}">+</button>
                </div>
            </td>
            <td class="item-total">$${itemTotal.toFixed(2)}</td>
        </tr>
        `;
    });
    
    cartItemsElement.innerHTML = html;
    updateTotals(subtotal);
    
    // Add event listeners for cart controls
    addCartEventListeners();
}

function addCartEventListeners() {
    // Remove item
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            removeFromCart(this.dataset.id);
        });
    });
    
    // Decrease quantity
    document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            updateQuantity(productId, -1);
            updateItemTotal(productId);
        });
    });
    
    // Increase quantity
    document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            updateQuantity(productId, 1);
            updateItemTotal(productId);
        });
    });
    
    // Manual quantity input
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const productId = this.dataset.id;
            const newQuantity = parseInt(this.value) || 1;
            setQuantity(productId, newQuantity);
            updateItemTotal(productId);
        });
    });
    
    // Remove the update cart button event listener since we don't need it anymore
    const updateCartBtn = document.getElementById('update-cart');
    if (updateCartBtn) {
        updateCartBtn.style.display = 'none'; // Hide the button
    }
}

function updateItemTotal(productId) {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        const row = document.querySelector(`tr[data-id="${productId}"]`);
        if (row) {
            const itemTotal = item.price * item.quantity;
            row.querySelector('.item-total').textContent = `$${itemTotal.toFixed(2)}`;
        }
    }
    
    // Update the totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    const tax = subtotal * 0.1; // 10% tax for example
    const total = subtotal + tax;
    
    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update the UI immediately
    const row = document.querySelector(`tr[data-id="${productId}"]`);
    if (row) {
        row.remove();
    }
    
    // Update totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateTotals(subtotal);
    
    // Show empty cart message if needed
    if (cart.length === 0) {
        document.querySelector('.cart-empty-row').style.display = '';
        document.getElementById('checkout-btn').setAttribute('disabled', 'true');
    }
    
    updateCartCount();
}

function updateQuantity(productId, change) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const newQuantity = cart[itemIndex].quantity + change;
        
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update the quantity input field
        const input = document.querySelector(`.quantity-input[data-id="${productId}"]`);
        if (input) {
            input.value = newQuantity;
        }
        
        updateCartCount();
    }
}

function setQuantity(productId, quantity) {
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart'));
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update the quantity input field
        const input = document.querySelector(`.quantity-input[data-id="${productId}"]`);
        if (input) {
            input.value = quantity;
        }
        
        updateCartCount();
    }
}

function setupCheckoutButton() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                e.preventDefault();
                alert('Your cart is empty. Please add items before checking out.');
            }
        });
    }
}
// Call this in your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    setupCheckoutButton(); // Add this line
    
    // If we're on the cart page, load cart items
    if (document.getElementById('cart-items')) {
        loadCart();
    }
});