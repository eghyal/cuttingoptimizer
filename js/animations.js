/**
 * Animation Controller - Intersection Observer for Scroll Animations
 * Minimalist approach with no external dependencies
 */

(function() {
  'use strict';

  // Animation Controller
  const AnimationController = {
    observer: null,
    animatedElements: [],
    
    init: function() {
      this.setupIntersectionObserver();
      this.setupSmoothScrolling();
      this.setupPageTransitions();
      console.log('✅ Animation Controller initialized');
    },

    setupIntersectionObserver: function() {
      // Check if IntersectionObserver is supported
      if (!('IntersectionObserver' in window)) {
        // Fallback: show all elements immediately
        this.showAllElements();
        return;
      }

      const options = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            
            // Add stagger effect to children if parent has stagger class
            if (entry.target.classList.contains('stagger-children')) {
              this.animateChildren(entry.target);
            }
            
            // Unobserve after animation (optional - remove if you want re-animation)
            // this.observer.unobserve(entry.target);
          }
        });
      }, options);

      // Observe all elements with scroll-animate class
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach(el => {
        this.observer.observe(el);
        this.animatedElements.push(el);
      });
    },

    animateChildren: function(parent) {
      const children = parent.children;
      Array.from(children).forEach((child, index) => {
        child.style.animationDelay = `${index * 0.1}s`;
        child.classList.add('fade-in-up');
      });
    },

    showAllElements: function() {
      // Fallback for browsers without IntersectionObserver
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    },

    setupSmoothScrolling: function() {
      // Smooth scroll for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    },

    setupPageTransitions: function() {
      // Add page transition class to body
      document.body.classList.add('page-transition');
      
      // Handle view transitions between form and results
      this.setupViewTransitions();
    },

    setupViewTransitions: function() {
      // Monitor for results container becoming visible
      const resultsContainers = [
        'optimizer-1d-results',
        'optimizer-2d-results',
        'project-results'
      ];

      resultsContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!container.classList.contains('hidden')) {
                  // Results are now visible - animate them
                  this.animateResults(container);
                }
              }
            });
          });

          observer.observe(container, { attributes: true });
        }
      });
    },

    animateResults: function(container) {
      // Add animation classes to result elements
      const statCards = container.querySelectorAll('.stat-card');
      statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
      });

      // Animate visualizations
      const vizContainer = container.querySelector('.bar-viz-container, .plate-viz-container');
      if (vizContainer) {
        vizContainer.style.opacity = '0';
        vizContainer.style.transform = 'scale(0.95)';
        setTimeout(() => {
          vizContainer.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          vizContainer.style.opacity = '1';
          vizContainer.style.transform = 'scale(1)';
        }, 300);
      }
    },

    // Public method to manually trigger animation on an element
    animateElement: function(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (element && element.classList.contains('scroll-animate')) {
        element.classList.add('is-visible');
      }
    },

    // Public method to refresh observer (useful after dynamic content)
    refresh: function() {
      if (this.observer) {
        const newElements = document.querySelectorAll('.scroll-animate:not(.is-visible)');
        newElements.forEach(el => {
          this.observer.observe(el);
        });
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AnimationController.init());
  } else {
    AnimationController.init();
  }

  // Expose to global scope for manual triggering
  window.AnimationController = AnimationController;

})();