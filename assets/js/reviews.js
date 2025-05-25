// Initialize review system
function initReviews() {
    // Load reviews for products
    document.querySelectorAll('.product-rating').forEach(element => {
        const productId = element.dataset.id;
        const rating = parseFloat(element.dataset.rating);
        renderRatingStars(element, rating);
    });
    
    // Review form submission
    document.getElementById('review-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        submitReview();
    });
}

// Render rating stars
function renderRatingStars(container, rating) {
    const stars = Math.round(rating);
    container.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = i <= stars ? 'text-warning' : 'text-muted';
        star.innerHTML = '★';
        container.appendChild(star);
    }
}

// Submit new review
function submitReview() {
    const form = document.getElementById('review-form');
    const productId = form.dataset.productId;
    const rating = parseInt(form.querySelector('input[name="rating"]:checked').value);
    const name = form.querySelector('input[name="name"]').value;
    const review = form.querySelector('textarea[name="review"]').value;
    
    // In a real app, this would be a fetch() to your backend
    const newReview = {
        id: Date.now(),
        productId: productId,
        rating: rating,
        name: name,
        review: review,
        date: new Date().toISOString().split('T')[0]
    };
    
    // Save to localStorage (simulating backend)
    let reviews = JSON.parse(localStorage.getItem('productReviews') || '{}');
    if (!reviews[productId]) reviews[productId] = [];
    reviews[productId].push(newReview);
    localStorage.setItem('productReviews', JSON.stringify(reviews));
    
    // Show success message
    alert('Thank you for your review!');
    form.reset();
    
    // Reload reviews
    loadProductReviews(productId);
}

// Load reviews for a product
function loadProductReviews(productId) {
    const reviews = JSON.parse(localStorage.getItem('productReviews') || '{}');
    const productReviews = reviews[productId] || [];
    const reviewsContainer = document.getElementById('product-reviews');
    
    if (productReviews.length === 0) {
        reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        return;
    }
    
    // Calculate average rating
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    document.getElementById('average-rating').textContent = avgRating.toFixed(1);
    renderRatingStars(document.getElementById('average-rating-stars'), avgRating);
    
    // Display reviews
    reviewsContainer.innerHTML = '';
    productReviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'card mb-3';
        reviewElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <div>
                        <strong>${review.name}</strong>
                        <div class="text-warning">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    </div>
                    <small class="text-muted">${review.date}</small>
                </div>
                <p>${review.review}</p>
            </div>
        `;
        reviewsContainer.appendChild(reviewElement);
    });
}