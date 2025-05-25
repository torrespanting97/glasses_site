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
    themeToggleButton.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      if (currentTheme === 'dark') {
        setTheme('light');
      } else {
        setTheme('dark');
      }
    });
  } else {
    console.warn("Theme toggle button not found. Ensure a button with ID 'theme-toggle-button' exists.");
  }
});
