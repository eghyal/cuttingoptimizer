/**
 * Main Application - Modal, Navigation & Tour
 * Enhanced: Startup tour for first-time users
 */

(function() {
  'use strict';

  // Global App Object
  window.App = {
    isModalOpen: false,
    isInitialized: false,
    shortcutModal: null,
    activeModal: null,
    tourStep: 0,
    maxTourSteps: 4,
    
    init: function() {
      console.log('🚀 App: Initializing...');
      this.setupEventListeners();
      this.updateActiveNav();
      this.loadQRImage();
      this.setupKeyboardShortcuts();
      this.setupFocusManagement();
      this.setupNumericValidation();
      this.checkFirstVisit();
      this.isInitialized = true;
    },
    
    setupEventListeners: function() {
      console.log('🔧 App: Setting up event listeners...');
      
      // Donate button
      var donateBtn = document.getElementById('donate-btn');
      if (donateBtn) {
        donateBtn.addEventListener('click', this.openModal.bind(this, 'donation-modal'));
      }
      
      // Modal close buttons
      this.setupModalCloseButtons();
      
      // Tour close/skip/next buttons
      this.setupTourButtons();
      
      // Home button navigation
      var logoElements = document.querySelectorAll('.logo');
      logoElements.forEach(function(logo) {
        logo.addEventListener('click', function(e) {
          var href = this.getAttribute('href');
          if (href && href === '../index.html' || href === 'index.html') {
            // Allow default navigation
            return;
          }
        });
      });
      
      // Prevent form submission on Enter
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.target.classList.contains('item-input-id')) {
          e.preventDefault();
          // Move to next input
          var inputs = Array.from(document.querySelectorAll('input:not([disabled])'));
          var currentIndex = inputs.indexOf(e.target);
          if (currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
          }
        }
      });
      
      // Click outside modal to close
      var modalBackdrop = document.querySelector('.modal-backdrop');
      if (modalBackdrop) {
        modalBackdrop.addEventListener('click', function(e) {
          if (e.target === this) {
            this.closeModal();
          }
        }.bind(this));
      }
    },
    
    setupModalCloseButtons: function() {
      var self = this;
      
      // Donation modal close
      var modalClose = document.getElementById('modal-close');
      if (modalClose) {
        modalClose.addEventListener('click', function() {
          self.closeModal('donation-modal');
        });
      }
      
      // Shortcut modal close
      var shortcutClose = document.getElementById('shortcut-close');
      if (shortcutClose) {
        shortcutClose.addEventListener('click', function() {
          self.closeModal('shortcut-modal');
        });
      }
    },
    
    setupTourButtons: function() {
      var self = this;
      
      // Tour close button
      var tourClose = document.getElementById('tour-close');
      if (tourClose) {
        tourClose.addEventListener('click', this.closeTour.bind(this));
      }
      
      // Tour skip button
      var tourSkip = document.getElementById('tour-skip');
      if (tourSkip) {
        tourSkip.addEventListener('click', this.closeTour.bind(this));
      }
      
      // Tour next button
      var tourNext = document.getElementById('tour-next');
      if (tourNext) {
        tourNext.addEventListener('click', this.nextTourStep.bind(this));
      }
    },
    
    setupKeyboardShortcuts: function() {
      // Global keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // Skip if typing in input fields (except specific shortcuts)
        var isInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        
        // Don't trigger shortcuts when modal is open (except Escape)
        if (this.isModalOpen) {
          if (e.key === 'Escape') {
            e.preventDefault();
            this.closeModal();
          }
          return;
        }
        
        // Tour navigation with arrow keys
        if (document.getElementById('tour-modal') && !document.getElementById('tour-modal').classList.contains('hidden')) {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.nextTourStep();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.closeTour();
          }
          return;
        }
        
        var key = e.key.toLowerCase();
        var ctrlOrMeta = e.ctrlKey || e.metaKey;
        var altKey = e.altKey;
        
        // Allow ? shortcut even in inputs
        if (e.key === '?' && !ctrlOrMeta && !altKey) {
          e.preventDefault();
          this.showShortcutModal();
          return;
        }
        
        // Block other shortcuts when in input
        if (isInInput) {
          return; // Block all shortcuts
        }
        
        // Determine current page
        var currentPath = window.location.pathname;
        var isOptimizerPage = currentPath.includes('/pages/');
        var isHomePage = !isOptimizerPage || currentPath.endsWith('index.html') || currentPath.endsWith('/');
        
        switch(key) {
          case 'h':
          case 'escape':
            if (!altKey && !ctrlOrMeta) {
              e.preventDefault();
              window.location.href = '../index.html';
            }
            break;
          case '1':
            if (!altKey && !ctrlOrMeta && isHomePage) {
              e.preventDefault();
              window.location.href = 'pages/1d.html';
            }
            break;
          case '2':
            if (!altKey && !ctrlOrMeta && isHomePage) {
              e.preventDefault();
              window.location.href = 'pages/2d.html';
            }
            break;
          case 'p':
            if (!altKey && !ctrlOrMeta && isHomePage) {
              e.preventDefault();
              window.location.href = 'pages/prj.html';
            }
            break;
          case 'a':
            if (!altKey && !ctrlOrMeta) {
              e.preventDefault();
              var addBtn = document.getElementById('add-item-1d') || 
                           document.getElementById('add-item-2d') ||
                           document.getElementById('add-group');
              if (addBtn) addBtn.click();
            }
            break;
          case 'o':
            if (!altKey && !ctrlOrMeta) {
              e.preventDefault();
              var optimizeBtn = document.getElementById('optimize-1d') || 
                               document.getElementById('optimize-2d') || 
                               document.getElementById('optimize-project');
              if (optimizeBtn && !optimizeBtn.disabled) {
                optimizeBtn.click();
              }
            }
            break;
          case 'g':
            if (!altKey && !ctrlOrMeta && document.getElementById('add-group')) {
              e.preventDefault();
              document.getElementById('add-group').click();
            }
            break;
        }
      }.bind(this));
    },
    
    setupFocusManagement: function() {
      // Trap focus inside modals when open
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && this.isModalOpen) {
          var modal = document.querySelector('.modal-backdrop:not(.hidden)');
          if (!modal) return;
          
          var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          var first = focusable[0];
          var last = focusable[focusable.length - 1];
          
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }.bind(this));
    },
    
    // NEW: Setup numeric validation for number inputs
    setupNumericValidation: function() {
      document.addEventListener('keydown', function(e) {
        // Only validate numeric inputs
        if (!e.target.classList.contains('numeric-only') && 
            !e.target.classList.contains('item-input') &&
            !e.target.classList.contains('cut-item-input')) {
          return;
        }
        
        // Allow: backspace, delete, tab, escape, enter, decimal point
        if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
          return;
        }
        
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
          e.preventDefault();
          // Show error message
          this.showInputError(e.target, 'Please enter numbers only');
        }
      }.bind(this));
      
      // Additional validation for paste events
      document.addEventListener('paste', function(e) {
        if (!e.target.classList.contains('numeric-only') && 
            !e.target.classList.contains('item-input') &&
            !e.target.classList.contains('cut-item-input')) {
          return;
        }
        
        var pastedText = (e.clipboardData || window.clipboardData).getData('text');
        if (!/^\d+$/.test(pastedText)) {
          e.preventDefault();
          this.showInputError(e.target, 'Only numeric values can be pasted');
        }
      }.bind(this));
    },
    
    // NEW: Show input error message
    showInputError: function(input, message) {
      // Remove existing error
      var existingError = input.parentNode.querySelector('.input-error');
      if (existingError) {
        existingError.remove();
      }
      
      var errorEl = document.createElement('div');
      errorEl.className = 'input-error';
      errorEl.style.cssText = `
        color: var(--color-red-600);
        font-size: var(--text-xs);
        margin-top: var(--space-1);
        position: absolute;
        bottom: -1.5rem;
        left: 0;
      `;
      errorEl.textContent = message;
      errorEl.setAttribute('role', 'alert');
      
      input.parentNode.style.position = 'relative';
      input.parentNode.appendChild(errorEl);
      
      // Auto-remove after 3 seconds
      setTimeout(function() {
        if (errorEl.parentNode) {
          errorEl.remove();
        }
      }, 3000);
      
      // Add shake animation to input
      input.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(function() {
        input.style.animation = '';
      }, 500);
    },
    
    loadQRImage: function() {
      var qrImg = document.querySelector('.qr-image');
      if (qrImg && !qrImg.src.includes('base64')) {
        qrImg.onerror = function() {
          this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlFSIENvZGU8L3RleHQ+PC9zdmc+';
        };
      }
    },
    
    openModal: function(modalId) {
      console.log('📱 App: Opening modal...');
      this.isModalOpen = true;
      this.activeModal = modalId;
      var modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Focus trap
        var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) {
          focusable[0].focus();
        }
      }
    },
    
    closeModal: function(modalId) {
      console.log('📱 App: Closing modal...');
      this.isModalOpen = false;
      var modal = modalId ? document.getElementById(modalId) : document.querySelector('.modal-backdrop:not(.hidden)');
      if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.activeModal = null;
      }
    },
    
    showShortcutModal: function() {
      this.openModal('shortcut-modal');
    },
    
    // Tour functionality
    checkFirstVisit: function() {
      // Check if user has visited before
      var hasVisited = localStorage.getItem('eav-visited');
      if (!hasVisited) {
        // Show tour after a short delay
        setTimeout(function() {
          this.openTour();
        }.bind(this), 1000);
      }
    },
    
    openTour: function() {
      this.tourStep = 1;
      this.openModal('tour-modal');
      this.updateTourStep();
    },
    
    closeTour: function() {
      this.closeModal('tour-modal');
      // Mark as visited
      localStorage.setItem('eav-visited', 'true');
      this.tourStep = 0;
    },
    
    nextTourStep: function() {
      if (this.tourStep < this.maxTourSteps) {
        this.tourStep++;
        this.updateTourStep();
      } else {
        this.closeTour();
      }
    },
    
    updateTourStep: function() {
      // Update step visibility
      var steps = document.querySelectorAll('#tour-modal .tour-step');
      steps.forEach(function(step) {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === this.tourStep) {
          step.classList.add('active');
        }
      }.bind(this));
      
      // Update dots
      var dots = document.querySelectorAll('#tour-modal .dot');
      dots.forEach(function(dot, index) {
        dot.classList.remove('active');
        if (index + 1 === this.tourStep) {
          dot.classList.add('active');
        }
      }.bind(this));
      
      // Update button text
      var nextBtn = document.getElementById('tour-next');
      if (nextBtn) {
        nextBtn.textContent = this.tourStep === this.maxTourSteps ? 'Get Started' : 'Next';
      }
      
      // Announce to screen readers
      var activeStep = document.querySelector('#tour-modal .tour-step.active');
      if (activeStep && window.AccessibilityManager) {
        var stepText = activeStep.textContent;
        window.AccessibilityManager.announce('Tour step ' + this.tourStep + ' of ' + this.maxTourSteps + ': ' + stepText);
      }
    },
    
    updateActiveNav: function() {
      var currentPath = window.location.pathname;
      var navLinks = document.querySelectorAll('.nav-link');
      
      navLinks.forEach(function(link) {
        link.classList.remove('active');
        var href = link.getAttribute('href');
        
        if (href) {
          var isHome = (currentPath.endsWith('/') || currentPath.endsWith('index.html')) && href === 'index.html';
          var isMatchingPage = currentPath.includes(href) || 
                               (currentPath.includes('pages/1d') && href.includes('1d')) ||
                               (currentPath.includes('pages/2d') && href.includes('2d')) ||
                               (currentPath.includes('pages/prj') && href.includes('prj'));
          
          if (isHome || isMatchingPage) {
            link.classList.add('active');
          }
        }
      });
    },
    
    showError: function(message, containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;

      // Remove existing errors
      var existingErrors = container.querySelectorAll('.error-message');
      existingErrors.forEach(function(error) { error.remove(); });

      // Create error element
      var errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.textContent = message;
      errorEl.setAttribute('role', 'alert');
      
      // Add to container
      var firstChild = container.firstChild;
      if (firstChild) {
        container.insertBefore(errorEl, firstChild);
      } else {
        container.appendChild(errorEl);
      }

      // Auto-remove after 5 seconds
      setTimeout(function() { errorEl.remove(); }, 5000);
      
      // Announce to screen readers
      if (window.AccessibilityManager) {
        window.AccessibilityManager.announce('Error: ' + message);
      }
    },
    
    showSuccess: function(message) {
      var successEl = document.createElement('div');
      successEl.className = 'success-message';
      successEl.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: var(--color-green-500);
        color: white;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        font-weight: var(--font-medium);
        animation: slideIn 0.3s ease-out;
      `;
      successEl.setAttribute('role', 'status');
      successEl.textContent = message;
      document.body.appendChild(successEl);
      setTimeout(() => successEl.remove(), 3000);
      
      // Announce to screen readers
      if (window.AccessibilityManager) {
        window.AccessibilityManager.announce(message);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.App.init();
    });
  } else {
    window.App.init();
  }

  // Add animations
  var style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
    .input-error {
      color: var(--color-red-600);
      font-size: var(--text-xs);
      margin-top: var(--space-1);
      position: absolute;
      bottom: -1.5rem;
      left: 0;
    }
    @keyframes fadeInUpModal {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  console.log('✅ App script loaded with Tour functionality');
})();