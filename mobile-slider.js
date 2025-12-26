/**
 * Mobile Slider for Isometric Slideshow
 * Windows 7 Task Switcher / Android Photos Widget Style
 * Only activates on mobile devices
 */

class MobileSlider {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.currentSlide = 0;
        this.totalSlides = 3;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.velocity = 0;
        this.lastTimestamp = 0;
        this.swipeThreshold = 50;
        this.autoRotateInterval = null;
        
        this.init();
    }
    
    init() {
        if (!this.isMobile) {
            this.cleanup();
            return;
        }
        
        this.createSliderStructure();
        this.setupEventListeners();
        this.updateSlider();
        this.startAutoRotate();
    }
    
    createSliderStructure() {
        const optionsGrid = document.getElementById('optionsGrid');
        if (!optionsGrid) return;
        
        // Create slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        sliderContainer.innerHTML = `
            <div class="slider-track"></div>
            <div class="touch-feedback"></div>
        `;
        
        const track = sliderContainer.querySelector('.slider-track');
        
        // Get the original circles
        const circleWrappers = Array.from(optionsGrid.querySelectorAll('.option-circle-wrapper'));
        
        // Create slides from circles
        circleWrappers.forEach((wrapper, index) => {
            const slide = document.createElement('div');
            slide.className = `slider-slide ${index === 0 ? 'active' : ''}`;
            slide.dataset.index = index;
            
            // Clone the circle content
            const circleClone = wrapper.cloneNode(true);
            
            // Update onclick to include slide index
            const circle = circleClone.querySelector('.option-circle');
            if (circle) {
                const originalOnClick = circle.getAttribute('onclick');
                if (originalOnClick) {
                    circle.setAttribute('onclick', `${originalOnClick.replace('navigateTo', 'sliderNavigateTo')}`);
                }
            }
            
            slide.appendChild(circleClone);
            track.appendChild(slide);
        });
        
        // Insert slider after update section
        const updateSection = document.querySelector('.update-section');
        if (updateSection && updateSection.parentNode) {
            updateSection.parentNode.insertBefore(sliderContainer, updateSection.nextSibling);
        }
        
        // Create navigation dots if they don't exist
        if (!document.querySelector('.slider-dots')) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'slider-dots';
            
            for (let i = 0; i < this.totalSlides; i++) {
                const dot = document.createElement('span');
                dot.className = `dot ${i === 0 ? 'active' : ''}`;
                dot.dataset.index = i;
                dot.innerHTML = '●';
                dotsContainer.appendChild(dot);
            }
            
            // Add swipe instruction
            const instruction = document.createElement('div');
            instruction.className = 'swipe-instruction';
            instruction.textContent = 'Swipe left or right to navigate';
            dotsContainer.appendChild(instruction);
            
            sliderContainer.parentNode.insertBefore(dotsContainer, sliderContainer.nextSibling);
        }
        
        // Create navigation arrows for tablets
        if (window.innerWidth >= 481 && window.innerWidth <= 768) {
            const prevArrow = document.createElement('button');
            prevArrow.className = 'slider-nav prev';
            prevArrow.innerHTML = '‹';
            prevArrow.setAttribute('aria-label', 'Previous slide');
            
            const nextArrow = document.createElement('button');
            nextArrow.className = 'slider-nav next';
            nextArrow.innerHTML = '›';
            nextArrow.setAttribute('aria-label', 'Next slide');
            
            sliderContainer.appendChild(prevArrow);
            sliderContainer.appendChild(nextArrow);
        }
    }
    
    setupEventListeners() {
        // Touch events
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Mouse events for testing
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Dot click events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
            }
            
            // Navigation arrows
            if (e.target.classList.contains('slider-nav')) {
                if (e.target.classList.contains('prev')) {
                    this.prevSlide();
                } else if (e.target.classList.contains('next')) {
                    this.nextSlide();
                }
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isMobile) return;
            
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
                e.preventDefault();
            }
        });
        
        // Resize handling
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Prevent default touch actions
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Pause auto-rotate on hover (for tablets)
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', () => {
                this.stopAutoRotate();
            });
            
            sliderContainer.addEventListener('mouseleave', () => {
                this.startAutoRotate();
            });
        }
    }
    
    handleTouchStart(e) {
        if (!this.isMobile || !e.touches[0]) return;
        
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.currentX = this.startX;
        this.lastTimestamp = e.timeStamp;
        this.velocity = 0;
        
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.classList.add('touching');
        }
        
        this.stopAutoRotate();
    }
    
    handleTouchMove(e) {
        if (!this.isMobile || !this.isDragging || !e.touches[0]) return;
        
        e.preventDefault();
        
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - this.currentX;
        const deltaTime = e.timeStamp - this.lastTimestamp;
        
        this.currentX = touchX;
        this.velocity = deltaTime > 0 ? deltaX / deltaTime : 0;
        this.lastTimestamp = e.timeStamp;
        
        this.updateSlidePosition(deltaX);
    }
    
    handleTouchEnd(e) {
        if (!this.isMobile || !this.isDragging) return;
        
        this.isDragging = false;
        
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.classList.remove('touching');
        }
        
        const deltaX = this.currentX - this.startX;
        const isSwipe = Math.abs(deltaX) > this.swipeThreshold;
        const isFastSwipe = Math.abs(this.velocity) > 0.5;
        
        if (isSwipe || isFastSwipe) {
            if (deltaX > 0) {
                // Swipe right - previous slide
                this.prevSlide();
            } else {
                // Swipe left - next slide
                this.nextSlide();
            }
        } else {
            // Return to current slide
            this.goToSlide(this.currentSlide);
        }
        
        this.startAutoRotate();
    }
    
    handleMouseDown(e) {
        if (!this.isMobile || e.button !== 0) return;
        
        this.isDragging = true;
        this.startX = e.clientX;
        this.currentX = this.startX;
        this.lastTimestamp = e.timeStamp;
        this.velocity = 0;
        
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.classList.add('touching');
        }
        
        this.stopAutoRotate();
    }
    
    handleMouseMove(e) {
        if (!this.isMobile || !this.isDragging) return;
        
        const mouseX = e.clientX;
        const deltaX = mouseX - this.currentX;
        const deltaTime = e.timeStamp - this.lastTimestamp;
        
        this.currentX = mouseX;
        this.velocity = deltaTime > 0 ? deltaX / deltaTime : 0;
        this.lastTimestamp = e.timeStamp;
        
        this.updateSlidePosition(deltaX);
    }
    
    handleMouseUp(e) {
        if (!this.isMobile || !this.isDragging) return;
        
        this.isDragging = false;
        
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.classList.remove('touching');
        }
        
        const deltaX = this.currentX - this.startX;
        const isSwipe = Math.abs(deltaX) > this.swipeThreshold;
        
        if (isSwipe) {
            if (deltaX > 0) {
                this.prevSlide();
            } else {
                this.nextSlide();
            }
        } else {
            this.goToSlide(this.currentSlide);
        }
        
        this.startAutoRotate();
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                this.createSliderStructure();
                this.setupEventListeners();
            } else {
                this.cleanup();
            }
        }
        
        this.updateSlider();
    }
    
    updateSlidePosition(deltaX) {
        const slides = document.querySelectorAll('.slider-slide');
        const track = document.querySelector('.slider-track');
        
        if (!slides.length || !track) return;
        
        // Calculate drag percentage
        const slideWidth = 100 / this.totalSlides;
        const dragPercentage = (deltaX / window.innerWidth) * 100;
        
        // Update track position with rubber band effect
        let trackPosition = -(this.currentSlide * slideWidth) + (dragPercentage / 3);
        
        // Apply rubber band limits
        const minPosition = -(this.totalSlides - 1) * slideWidth;
        if (trackPosition > 0) {
            trackPosition = 0;
        } else if (trackPosition < minPosition) {
            trackPosition = minPosition;
        }
        
        track.style.transform = `translateX(${trackPosition}%)`;
    }
    
    goToSlide(index) {
        // Ensure index is within bounds
        this.currentSlide = (index + this.totalSlides) % this.totalSlides;
        this.updateSlider();
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateSlider();
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateSlider();
    }
    
    updateSlider() {
        const slides = document.querySelectorAll('.slider-slide');
        const dots = document.querySelectorAll('.dot');
        const track = document.querySelector('.slider-track');
        
        if (!slides.length || !track) return;
        
        // Update track position
        const slideWidth = 100 / this.totalSlides;
        track.style.transform = `translateX(-${this.currentSlide * slideWidth}%)`;
        
        // Update slide classes
        slides.forEach((slide, index) => {
            slide.classList.remove('active', 'prev', 'next');
            
            if (index === this.currentSlide) {
                slide.classList.add('active');
            } else if (index === (this.currentSlide - 1 + this.totalSlides) % this.totalSlides) {
                slide.classList.add('prev');
            } else if (index === (this.currentSlide + 1) % this.totalSlides) {
                slide.classList.add('next');
            }
        });
        
        // Update dots
        if (dots.length) {
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentSlide);
            });
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('slideChanged', {
            detail: { currentSlide: this.currentSlide }
        }));
    }
    
    startAutoRotate() {
        // Auto-rotate only if not dragging and on mobile
        if (!this.isMobile || this.isDragging) return;
        
        this.stopAutoRotate();
        
        this.autoRotateInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Rotate every 5 seconds
    }
    
    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }
    
    cleanup() {
        this.stopAutoRotate();
        
        // Remove slider elements if they exist
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
    }
    
    destroy() {
        this.cleanup();
        
        // Remove event listeners
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('resize', this.handleResize);
    }
}

// Global function for navigation from slider
function sliderNavigateTo(url) {
    const slider = window.mobileSlider;
    if (slider) {
        slider.stopAutoRotate();
    }
    
    // Add loading effect
    const circles = document.querySelectorAll('.option-circle');
    circles.forEach(circle => {
        circle.classList.add('loading');
    });
    
    setTimeout(() => {
        window.location.href = url;
    }, 150);
}

// Initialize slider when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on mobile
    if (window.innerWidth <= 768) {
        window.mobileSlider = new MobileSlider();
    }
    
    // Also check on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768 && !window.mobileSlider) {
            window.mobileSlider = new MobileSlider();
        } else if (window.innerWidth > 768 && window.mobileSlider) {
            window.mobileSlider.destroy();
            window.mobileSlider = null;
        }
    });
});

// Handle page visibility for auto-rotate
document.addEventListener('visibilitychange', () => {
    if (window.mobileSlider) {
        if (document.hidden) {
            window.mobileSlider.stopAutoRotate();
        } else {
            window.mobileSlider.startAutoRotate();
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileSlider;
}
