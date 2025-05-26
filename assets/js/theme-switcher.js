// assets/js/theme-switcher.js

function setTheme(themeName) {
  localStorage.setItem('selectedTheme', themeName);
  document.documentElement.setAttribute('data-theme', themeName);
}

function getStoredTheme() {
  return localStorage.getItem('selectedTheme');
}

function getPreferredTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }
  // Check for OS preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light'; // Default to light theme
}

// Set initial theme when the script loads
// We wrap this in a try-catch block in case localStorage is unavailable (e.g. in some iframe scenarios or when cookies are disabled)
try {
  setTheme(getPreferredTheme());
} catch (e) {
  console.error('Failed to set initial theme:', e);
  // Fallback to a default theme if localStorage access fails or other errors occur
  document.documentElement.setAttribute('data-theme', 'light');
}

// Placeholder for theme toggle button event listener
// This should ideally run after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleButton = document.getElementById('theme-toggle-button'); // Assuming a button with this ID
  if (themeToggleButton) {
    console.log('Theme toggle button found and listener being attached.'); // New log
    themeToggleButton.addEventListener('click', () => { // Corrected arrow function syntax
      console.log('Theme toggle button clicked.'); // New log
      try {
        let currentTheme = document.documentElement.getAttribute('data-theme');
        console.log('Current data-theme attribute is:', currentTheme); // New log

        if (currentTheme === 'dark') {
          console.log('Changing theme to light.'); // New log
          setTheme('light');
        } else {
          console.log('Changing theme to dark.'); // New log
          setTheme('dark');
        }
        
        // Verify after setting
        // const newTheme = document.documentElement.getAttribute('data-theme');
        // console.log('Theme changed. New data-theme attribute is:', newTheme); // New log
      } catch (e) {
        console.error('Error during theme toggle:', e); // New log for errors within the click handler
      }
    });
  } else {
    console.warn("Theme toggle button not found. Ensure a button with ID 'theme-toggle-button' exists.");
  }
});
