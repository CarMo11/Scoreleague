// Minimal test script
console.log('Minimal script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - minimal script');
    
    // Test basic functionality
    const matchesList = document.getElementById('matches-list');
    if (matchesList) {
        console.log('Found matches-list element');
        matchesList.innerHTML = '<div style="color: white; padding: 20px;">Test: JavaScript is working!</div>';
    } else {
        console.log('matches-list element not found');
    }
});
