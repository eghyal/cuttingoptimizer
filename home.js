// Navigation function with loading indicator
function navigateTo(url) {
    // Add loading effect to all cards
    const cards = document.querySelectorAll('.modern-card');
    cards.forEach(card => {
        card.classList.add('loading');
    });
    
    // Navigate after short delay for feedback
    setTimeout(() => {
        window.location.href = url;
    }, 150);
}

// Prevent all scrolling and zooming
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('wheel', function(e) {
    if (e.ctrlKey) return; // Allow zoom with ctrl
    e.preventDefault();
}, { passive: false });

// Prevent keyboard scrolling
document.addEventListener('keydown', function(e) {
    const keyCodes = [32, 33, 34, 35, 36, 37, 38, 39, 40];
    if (keyCodes.includes(e.keyCode)) {
        e.preventDefault();
    }
}, false);

// Add click animation
document.querySelectorAll('.modern-card').forEach(card => {
    card.addEventListener('click', function() {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);
    });
});

// Force layout to fit screen without scroll
function forceFitLayout() {
    const container = document.querySelector('.home-container');
    const body = document.body;
    const html = document.documentElement;
    
    // Reset any inline styles that might cause issues
    container.style.height = '100vh';
    container.style.width = '100vw';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    
    // Ensure viewport is properly set
    const viewport = document.querySelector('meta[name="viewport"]');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
}

// Reset animation states when page loads or becomes visible
function resetAnimationStates() {
    const cards = document.querySelectorAll('.modern-card');
    cards.forEach(card => {
        card.style.transform = '';
        card.classList.remove('loading');
    });
}

// Call on load and resize
window.addEventListener('load', function() {
    console.log('Home page initialized - Modern layout active');
    forceFitLayout();
    resetAnimationStates();
    
    // Additional safety: disable double-tap zoom on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

window.addEventListener('resize', forceFitLayout);
window.addEventListener('orientationchange', function() {
    setTimeout(forceFitLayout, 100);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        setTimeout(resetAnimationStates, 50);
    }
});

// Handle pageshow event (for Safari back/forward cache)
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        resetAnimationStates();
        forceFitLayout();
    }
});

// Prevent any form of zooming
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page DOM loaded');
    resetAnimationStates();
    
    // Extra protection against unwanted scrolling
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
});

// Touch device optimizations
if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
}

// Add hover class for devices that support hover
if (window.matchMedia('(hover: hover)').matches) {
    document.documentElement.classList.add('hover-support');
}

// Performance optimization
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(forceFitLayout, 100);
});
