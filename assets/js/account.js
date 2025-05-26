document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const profileMessagesEl = document.getElementById('profile-messages');

    // Input field elements
    const emailEl = document.getElementById('email');
    const usernameEl = document.getElementById('username'); // Added this based on typical user info
    const fullNameEl = document.getElementById('full_name');
    const phoneNumberEl = document.getElementById('phone_number');
    const addressLine1El = document.getElementById('address_line1');
    const addressLine2El = document.getElementById('address_line2');
    const cityEl = document.getElementById('city');
    const stateEl = document.getElementById('state');
    const zipCodeEl = document.getElementById('zip_code');

    // --- Utility Function for Displaying Messages ---
    function displayProfileMessage(message, type = 'info', duration = 5000) {
        if (profileMessagesEl) {
            profileMessagesEl.textContent = message;
            profileMessagesEl.className = `alert alert-${type}`; // Assumes Bootstrap-like classes
            profileMessagesEl.style.display = 'block';
            
            // Clear previous timer if any
            if (profileMessagesEl.currentTimer) {
                clearTimeout(profileMessagesEl.currentTimer);
            }

            profileMessagesEl.currentTimer = setTimeout(() => {
                if (profileMessagesEl) {
                    profileMessagesEl.style.display = 'none';
                }
            }, duration);
        } else {
            console.log(`Profile Message (${type}): ${message}`);
        }
    }

    // --- Fetch and Populate Profile Data on Load ---
    async function loadProfileData() {
        try {
            // Assuming current_user data (email, username) might be passed from template,
            // or fetched if API provides it. For this example, we fetch all from /api/profile.
            // If your /api/profile also returns email and username, this is fine.
            // Otherwise, you might need a separate way to get those if they are part of User model
            // but not UserProfile model.
            
            const response = await fetch('/api/profile'); // GET request by default
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to load profile data.' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            if (data) {
                // Populate basic user info (email and username might come from a different source or also profile)
                if (emailEl && data.email) emailEl.value = data.email; // Assuming API returns email
                else if (emailEl && emailEl.dataset.currentUserEmail) emailEl.value = emailEl.dataset.currentUserEmail; // Fallback to data attribute if passed by template

                if (usernameEl && data.username) usernameEl.value = data.username; // Assuming API returns username
                else if (usernameEl && usernameEl.dataset.currentUserUsername) usernameEl.value = usernameEl.dataset.currentUserUsername;


                // Populate profile-specific fields
                if (fullNameEl && data.full_name) fullNameEl.value = data.full_name;
                if (phoneNumberEl && data.phone_number) phoneNumberEl.value = data.phone_number;
                if (addressLine1El && data.address_line1) addressLine1El.value = data.address_line1;
                if (addressLine2El && data.address_line2) addressLine2El.value = data.address_line2;
                if (cityEl && data.city) cityEl.value = data.city;
                if (stateEl && data.state) stateEl.value = data.state;
                if (zipCodeEl && data.zip_code) zipCodeEl.value = data.zip_code;
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            displayProfileMessage(error.message || 'Could not load your profile information. Please try again later.', 'danger');
        }
    }

    // --- Handle Profile Update ---
    if (profileForm) {
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default browser submission

            const formData = {
                full_name: fullNameEl ? fullNameEl.value : undefined,
                phone_number: phoneNumberEl ? phoneNumberEl.value : undefined,
                address_line1: addressLine1El ? addressLine1El.value : undefined,
                address_line2: addressLine2El ? addressLine2El.value : undefined,
                city: cityEl ? cityEl.value : undefined,
                state: stateEl ? stateEl.value : undefined,
                zip_code: zipCodeEl ? zipCodeEl.value : undefined,
            };

            // Filter out undefined fields to only send data for fields that exist
            const profileData = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== undefined));

            try {
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add CSRF token header if required by your Flask setup for POST requests
                        // 'X-CSRFToken': getCsrfToken(), 
                    },
                    body: JSON.stringify(profileData),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || result.message || `HTTP error! Status: ${response.status}`);
                }

                displayProfileMessage(result.message || 'Profile updated successfully!', 'success');
                
                // Optionally, re-populate form with data from response if backend sanitizes/modifies it
                if (result.profile) {
                    if (fullNameEl && result.profile.full_name) fullNameEl.value = result.profile.full_name;
                    if (phoneNumberEl && result.profile.phone_number) phoneNumberEl.value = result.profile.phone_number;
                    if (addressLine1El && result.profile.address_line1) addressLine1El.value = result.profile.address_line1;
                    if (addressLine2El && result.profile.address_line2) addressLine2El.value = result.profile.address_line2;
                    if (cityEl && result.profile.city) cityEl.value = result.profile.city;
                    if (stateEl && result.profile.state) stateEl.value = result.profile.state;
                    if (zipCodeEl && result.profile.zip_code) zipCodeEl.value = result.profile.zip_code;
                }

            } catch (error) {
                console.error('Error updating profile:', error);
                displayProfileMessage(error.message || 'Failed to update profile. Please try again.', 'danger');
            }
        });
    }

    // --- Initial Load ---
    // Check if the user is authenticated before trying to load profile data.
    // Assumes 'isAuthenticated' is a global variable set by the backend template.
    if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
        loadProfileData();
    } else if (window.location.pathname.includes('/account')) { 
        // If on account page and not authenticated, show message or redirect
        displayProfileMessage('You must be logged in to view this page.', 'warning');
        // Optionally redirect to login: window.location.href = '/login?next=/account';
    }
});

// Helper function to get CSRF token if stored in a meta tag or cookie (example)
// function getCsrfToken() {
//     const token = document.querySelector('meta[name="csrf-token"]');
//     if (token) {
//         return token.getAttribute('content');
//     }
//     // Fallback to cookie or other methods if needed
//     return null; 
// }
