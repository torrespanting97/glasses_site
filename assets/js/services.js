document.addEventListener('DOMContentLoaded', function() {
    console.log('services.js loaded');

    // ===== Initial Setup =====
    const headerHeight = document.querySelector('header')?.offsetHeight || 100;
    const scrollOffset = headerHeight + 20; // Additional 20px padding

    // ===== Tooltip Initialization =====
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // ===== Navigation Handling =====
    function handleNavigation() {
        // Check if we have a hash in the URL
        const hash = window.location.hash;
        if (!hash) return;

        // Find the target section
        const targetSection = document.querySelector(hash);
        if (!targetSection) {
            console.warn(`Target section not found: ${hash}`);
            return;
        }

        // Scroll to the section
        setTimeout(() => {
            window.scrollTo({
                top: targetSection.offsetTop - scrollOffset,
                behavior: 'smooth'
            });
            highlightSection(hash);
        }, 100);
    }

    // ===== Highlight Current Section =====
    function highlightSection(sectionId) {
        // Remove highlight from all sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.remove('active-service');
        });

        // Add highlight to target section
        const targetSection = document.querySelector(sectionId);
        if (targetSection) {
            targetSection.classList.add('active-service');
        }
    }

    // ===== Scroll Event Listener =====
    function handleScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + scrollOffset;

        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
                currentSection = '#' + section.id;
            }
        });

        // Update active nav links
        document.querySelectorAll('.service-nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === currentSection);
        });
    }

    // ===== Event Listeners =====
    // Handle initial page load and hash changes
    window.addEventListener('load', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    // Handle smooth scrolling for same-page links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#!') return;

            // If link points to current page
            if (this.href.split('#')[0] === window.location.href.split('#')[0]) {
                e.preventDefault();
                history.pushState(null, null, targetId);
                handleNavigation();
            }
            // Else will follow the link normally (to services.html#section)
        });
    });

    // Handle scroll events with debounce
    const debouncedScroll = debounce(handleScroll, 100);
    window.addEventListener('scroll', debouncedScroll);

    // ===== Debugging Helpers =====
    document.querySelectorAll('.accordion-button').forEach(accordion => {
        accordion.addEventListener('click', function() {
            console.log('Accordion toggled:', this.getAttribute('data-bs-target'));
        });
    });

    document.querySelectorAll('[data-bs-toggle="modal"]').forEach(button => {
        button.addEventListener('click', function() {
            console.log('Modal triggered:', this.getAttribute('data-bs-target'));
        });
    });

    // ===== Utility Functions =====
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
});