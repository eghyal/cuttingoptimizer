/**
 * Windows Flip 3D Mobile Slider
 * Windows 7 Win+Tab Style Flip 3D Effect
 * Single page with all cards visible
 */

class WindowsFlip3DSlider {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.currentCard = 0;
        this.totalCards = 3;
        this.isAnimating = false;
        this.animationDuration = 600;
        this.cards = [];
        
        this.init();
    }
    
    init() {
        if (!this.isMobile) {
            this.cleanup();
            return;
        }
        
        this.createFlip3DStructure();
        this.setupEventListeners();
        this.updateFlip3DDisplay();
    }
    
    createFlip3DStructure() {
        const optionsGrid = document.getElementById('optionsGrid');
        if (!optionsGrid) return;
        
        // Create Windows Flip 3D container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        sliderContainer.innerHTML = `
            <div class="flip3d-container">
                <div class="flip3d-scene"></div>
            </div>
            <div class="flip3d-controls">
                <button class="flip3d-btn prev" aria-label="Previous card"></button>
                <button class="flip3d-btn next" aria-label="Next card"></button>
            </div>
            <div class="selection-indicator">Selected: 1D Optimizer</div>
        `;
        
        const scene = sliderContainer.querySelector('.flip3d-scene');
        
        // Get the original circles
        const circleWrappers = Array.from(optionsGrid.querySelectorAll('.option-circle-wrapper'));
        
        // Create Windows Flip 3D cards
        circleWrappers.forEach((wrapper, index) => {
            const card = document.createElement('div');
            card.className = `flip3d-card ${index === 0 ? 'active' : ''}`;
            card.dataset.index = index;
            
            // Clone the circle content
            const circleClone = wrapper.cloneNode(true);
            const circle = circleClone.querySelector('.option-circle');
            
            // Remove original onclick and add our own
            if (circle) {
                circle.removeAttribute('onclick');
                circle.addEventListener('click', () => {
                    this.selectCard(index);
                });
                
                // Add keyboard navigation
                circle.setAttribute('tabindex', '0');
                circle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.selectCard(index);
                    }
                });
            }
            
            card.appendChild(circleClone);
            scene.appendChild(card);
            this.cards.push(card);
        });
        
        // Insert slider after title section
        const titleSection = document.querySelector('.title-section');
        if (titleSection && titleSection.parentNode) {
            titleSection.parentNode.insertBefore(sliderContainer, titleSection.nextSibling);
        }
        
        // Create or update navigation dots
        let dotsContainer = document.querySelector('.slider-dots');
        if (!dotsContainer) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'slider-dots';
            
            for (let i = 0; i < this.totalCards; i++) {
                const dot = document.createElement('span');
                dot.className = `dot ${i === 0 ? 'active' : ''}`;
                dot.dataset.index = i;
                dot.setAttribute('aria-label', `Select card ${i + 1}`);
                dotsContainer.appendChild(dot);
            }
            
            // Add instruction
            const instruction = document.createElement('div');
            instruction.className = 'flip-instruction';
            instruction.textContent = 'Tap any card to select';
            dotsContainer.appendChild(instruction);
            
            sliderContainer.parentNode.insertBefore(dotsContainer, sliderContainer.nextSibling);
        }
        
        // Add keyboard hint for tablets
        if (window.innerWidth >= 481 && window.innerWidth <= 768) {
            const keyboardHint = document.createElement('div');
            keyboardHint.className = 'keyboard-hint';
            keyboardHint.innerHTML = 'Press ← → keys to navigate';
            sliderContainer.appendChild(keyboardHint);
        }
    }
    
    setupEventListeners() {
        // Dot click events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const index = parseInt(e.target.dataset.index);
                this.selectCard(index);
            }
            
            // Navigation buttons
            if (e.target.classList.contains('flip3d-btn')) {
                if (e.target.classList.contains('prev')) {
                    this.prevCard();
                } else if (e.target.classList.contains('next')) {
                    this.nextCard();
                }
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isMobile || this.isAnimating) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevCard();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextCard();
                    break;
                case 'Enter':
                case ' ':
                    // Handle card activation
                    const activeCard = document.querySelector('.flip3d-card.active');
                    if (activeCard) {
                        const index = parseInt(activeCard.dataset.index);
                        this.activateCard(index);
                    }
                    break;
            }
        });
        
        // Card click events (delegated)
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.flip3d-card');
            if (card && !this.isAnimating) {
                const index = parseInt(card.dataset.index);
                this.selectCard(index);
            }
        });
        
        // Card keyboard events
        document.addEventListener('keydown', (e) => {
            const card = e.target.closest('.flip3d-card');
            if (card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                const index = parseInt(card.dataset.index);
                this.selectCard(index);
            }
        });
        
        // Resize handling
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd < 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                this.createFlip3DStructure();
                this.setupEventListeners();
            } else {
                this.cleanup();
            }
        }
    }
    
    selectCard(index) {
        if (this.isAnimating || index === this.currentCard) return;
        
        this.isAnimating = true;
        this.currentCard = index;
        
        // Add flip animation to the selected card
        const selectedCard = this.cards[index];
        selectedCard.classList.add('flip-animation');
        
        // Update display
        this.updateFlip3DDisplay();
        
        // Show selection indicator
        this.showSelectionIndicator(index);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            selectedCard.classList.remove('flip-animation');
            this.isAnimating = false;
        }, this.animationDuration);
    }
    
    activateCard(index) {
        const card = this.cards[index];
        const circle = card.querySelector('.option-circle');
        
        if (circle) {
            // Simulate click on the circle to navigate
            circle.click();
        }
    }
    
    nextCard() {
        const nextIndex = (this.currentCard + 1) % this.totalCards;
        this.selectCard(nextIndex);
    }
    
    prevCard() {
        const prevIndex = (this.currentCard - 1 + this.totalCards) % this.totalCards;
        this.selectCard(prevIndex);
    }
    
    updateFlip3DDisplay() {
        // Update card classes
        this.cards.forEach((card, index) => {
            card.classList.remove('active');
            
            if (index === this.currentCard) {
                card.classList.add('active');
            }
        });
        
        // Update dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentCard);
        });
        
        // Update selection indicator text
        this.updateSelectionIndicator();
    }
    
    showSelectionIndicator(index) {
        const indicator = document.querySelector('.selection-indicator');
        if (!indicator) return;
        
        const cardNames = ['1D Optimizer', '2D Optimizer', 'Custom Optimizer'];
        indicator.textContent = `Selected: ${cardNames[index]}`;
        indicator.classList.add('show');
        
        // Hide after delay
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 1500);
    }
    
    updateSelectionIndicator() {
        const indicator = document.querySelector('.selection-indicator');
        if (!indicator) return;
        
        const cardNames = ['1D Optimizer', '2D Optimizer', 'Custom Optimizer'];
        indicator.textContent = `Selected: ${cardNames[this.currentCard]}`;
    }
    
    cleanup() {
        // Remove Flip 3D elements
        const sliderContainer = document.querySelector('.slider-container');
        const sliderDots = document.querySelector('.slider-dots');
        
        if (sliderContainer && sliderContainer.parentNode) {
            sliderContainer.parentNode.removeChild(sliderContainer);
        }
        
        if (sliderDots && sliderDots.parentNode) {
            sliderDots.parentNode.removeChild(sliderDots);
        }
        
        // Show original grid
        const optionsGrid = document.getElementById('optionsGrid');
        if (optionsGrid) {
            optionsGrid.style.display = 'grid';
        }
        
        this.cards = [];
    }
    
    destroy() {
        this.cleanup();
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize Windows Flip 3D slider
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on mobile
    if (window.innerWidth <= 768) {
        window.flip3dSlider = new WindowsFlip3DSlider();
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768 && !window.flip3dSlider) {
            window.flip3dSlider = new WindowsFlip3DSlider();
        } else if (window.innerWidth > 768 && window.flip3dSlider) {
            window.flip3dSlider.destroy();
            window.flip3dSlider = null;
        }
    });
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (window.flip3dSlider && !document.hidden) {
        // Refresh display when page becomes visible
        setTimeout(() => {
            window.flip3dSlider.updateFlip3DDisplay();
        }, 100);
    }
});

// Update navigation function to work with Flip 3D
function navigateTo(url) {
    // Stop any animations
    if (window.flip3dSlider) {
        window.flip3dSlider.isAnimating = false;
    }
    
    // Add loading effect to all circles
    const circles = document.querySelectorAll('.option-circle');
    circles.forEach(circle => {
        circle.classList.add('loading');
    });
    
    setTimeout(() => {
        window.location.href = url;
    }, 150);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowsFlip3DSlider;
}
