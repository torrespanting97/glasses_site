// assets/js/checkout.js

// Load checkout items and setup form
function loadCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkoutItemsElement = document.getElementById('checkout-items');
    
    if (cart.length === 0) {
        // Redirect to cart if empty
        window.location.href = 'cart.html';
        return;
    }
    
    let html = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center">
                <img src="${item.image}" alt="${item.name}" class="img-thumbnail me-3" style="width: 50px;">
                <div>
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">Qty: ${item.quantity}</small>
                </div>
            </div>
            <span>$${itemTotal.toFixed(2)}</span>
        </div>
        `;
    });
    
    checkoutItemsElement.innerHTML = html;
    updateCheckoutTotals(subtotal);
    
    // Setup form submission
    setupCheckoutForm();
    
    // Setup payment method toggles
    setupPaymentMethods();
    
    // Setup shipping method changes
    setupShippingMethods();
    
    // Load states for dropdown
    loadStates();
}

function updateCheckoutTotals(subtotal) {
    // Get shipping method
    const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked').value;
    let shipping = 0;
    
    if (shippingMethod === 'express') {
        shipping = 9.99;
    }
    
    const tax = subtotal * 0.1; // 10% tax for example
    const total = subtotal + shipping + tax;
    
    document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
    document.getElementById('checkout-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
}

function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateCheckoutForm()) {
            return;
        }
        
        // Process order
        processOrder();
    });
}

function validateCheckoutForm() {
    // Simple validation - in a real app you'd want more robust validation
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone', 
        'address', 'city', 'state', 'zip', 'country'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    // Validate credit card if selected
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    if (paymentMethod === 'creditCard') {
        const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];
        cardFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
    }
    
    if (!isValid) {
        // Scroll to first error
        const firstError = document.querySelector('.is-invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return false;
    }
    
    return true;
}

function processOrder() {
    // In a real app, you would send this data to your server
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const formData = new FormData(document.getElementById('checkout-form'));
    const orderData = {
        customer: Object.fromEntries(formData),
        items: cart,
        orderDate: new Date().toISOString(),
        orderNumber: 'VP' + Math.floor(Math.random() * 1000000),
        status: 'Processing'
    };
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = document.querySelector('input[name="shippingMethod"]:checked').value === 'express' ? 9.99 : 0;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    
    orderData.totals = {
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2)
    };
    
    // Save order to localStorage (in a real app, you'd save to a database)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    localStorage.setItem('cart', JSON.stringify([]));
    updateCartCount();
    
    // Show confirmation
    showOrderConfirmation(orderData);
}

function showOrderConfirmation(orderData) {
    document.getElementById('confirmation-email').textContent = orderData.customer.email;
    document.getElementById('order-number').textContent = orderData.orderNumber;
    
    const modal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
    modal.show();
}

function setupPaymentMethods() {
    const creditCardRadio = document.getElementById('creditCard');
    const paypalRadio = document.getElementById('paypal');
    const creditCardFields = document.getElementById('creditCardFields');
    
    function togglePaymentFields() {
        if (creditCardRadio.checked) {
            creditCardFields.style.display = 'block';
        } else {
            creditCardFields.style.display = 'none';
        }
    }
    
    creditCardRadio.addEventListener('change', togglePaymentFields);
    paypalRadio.addEventListener('change', togglePaymentFields);
    
    // Initialize
    togglePaymentFields();
}

function setupShippingMethods() {
    const shippingRadios = document.querySelectorAll('input[name="shippingMethod"]');
    
    shippingRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            updateCheckoutTotals(subtotal);
        });
    });
}

function loadStates() {
    const states = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
        'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
        'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
        'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
        'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
        'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ];
    
    const stateSelect = document.getElementById('state');
    
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Helper function to update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countElement = document.getElementById('cart-count');
    
    if (cart.length > 0) {
        countElement.textContent = cart.length;
        countElement.style.display = 'block';
    } else {
        countElement.style.display = 'none';
    }
}