(function() {
  'use strict';

  // Global App Object
  window.App = {
    isModalOpen: false,
    isInitialized: false,
    shortcutModal: null,
    activeModal: null,
    tourStep: 1,
    maxTourSteps: 4,
    tourInitialized: false,
    
    init: function() {
      // Guard against double initialization
      if (this.isInitialized) {
        console.log('⚠️ App: Already initialized, skipping...');
        return;
      }
      
      console.log('🚀 App: Initializing...');
      this.setupEventListeners();
      this.updateActiveNav();
      this.loadQRImage();
      this.setupKeyboardShortcuts();
      this.setupFocusManagement();
      this.setupNumericValidation();
      
      // Check first visit with delay to ensure all resources loaded
      var self = this;
      setTimeout(function() {
        self.checkFirstVisit();
      }, 500); // Reduced delay for faster tour appearance
      
      this.isInitialized = true;
    },
    
    setupEventListeners: function() {
      console.log('🔧 App: Setting up event listeners...');
      
      var self = this;
      
      // FIXED: Donate buttons - handle all possible IDs across all pages
      var donateBtnIds = ['donate-btn', 'donate-btn-1d', 'donate-btn-2d', 'donate-btn-project'];
      donateBtnIds.forEach(function(id) {
        var btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', function() {
            self.openModal('donation-modal');
          });
        }
      });
      
      // Modal close buttons
      this.setupModalCloseButtons();
      
      // Tour buttons - FIXED: Better event handling
      this.setupTourButtons();
      
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
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop') && self.isModalOpen) {
          // Only close if clicking the backdrop itself, not the content
          if (e.target === e.currentTarget) {
            self.closeModal();
          }
        }
      });
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
        tourClose.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeTour();
        });
      }
      
      // Tour skip button
      var tourSkip = document.getElementById('tour-skip');
      if (tourSkip) {
        tourSkip.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          self.closeTour();
        });
      }
      
      // Tour next button - FIXED: Ensure single binding
      var tourNext = document.getElementById('tour-next');
      if (tourNext && !this.tourInitialized) {
        // Remove existing listeners to prevent double binding
        var newBtn = tourNext.cloneNode(true);
        tourNext.parentNode.replaceChild(newBtn, tourNext);
        
        newBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          self.nextTourStep();
        });
        this.tourInitialized = true;
      }
      
      // Tour dots navigation
      var dots = document.querySelectorAll('.dot');
      dots.forEach(function(dot) {
        // Remove old listeners
        var newDot = dot.cloneNode(true);
        dot.parentNode.replaceChild(newDot, dot);
        
        newDot.addEventListener('click', function() {
          var step = parseInt(this.dataset.step);
          if (step && step !== self.tourStep) {
            self.tourStep = step;
            self.updateTourStep();
          }
        });
      });
    },
    
    setupKeyboardShortcuts: function() {
      var self = this;
      
      // Global keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // Skip if typing in input fields (except specific shortcuts)
        var isInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        
        // Don't trigger shortcuts when modal is open (except Escape)
        if (self.isModalOpen) {
          if (e.key === 'Escape') {
            e.preventDefault();
            var tourModal = document.getElementById('tour-modal');
            if (tourModal && !tourModal.classList.contains('hidden')) {
              self.closeTour();
            } else {
              self.closeModal();
            }
          }
          // Tour navigation with arrow keys
          var tourModal = document.getElementById('tour-modal');
          if (tourModal && !tourModal.classList.contains('hidden')) {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              self.nextTourStep();
            } else if (e.key === 'ArrowLeft' && self.tourStep > 1) {
              e.preventDefault();
              self.tourStep--;
              self.updateTourStep();
            }
          }
          return;
        }
        
        var key = e.key.toLowerCase();
        var ctrlOrMeta = e.ctrlKey || e.metaKey;
        var altKey = e.altKey;
        
        // Handle Ctrl+I for Import Excel (only on project page)
        if (ctrlOrMeta && key === 'i') {
          e.preventDefault();
          var fileInput = document.getElementById('excel-file');
          if (fileInput) {
            fileInput.click();
            if (window.AccessibilityManager) {
              window.AccessibilityManager.announce('Import Excel dialog opened.');
            }
          }
          return;
        }
        
        // Allow ? shortcut even in inputs
        if (e.key === '?' && !ctrlOrMeta && !altKey) {
          e.preventDefault();
          self.showShortcutModal();
          return;
        }
        
        // Block other shortcuts when in input
        if (isInInput) {
          return;
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
          case '3':
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
          case ' ':
          case 'spacebar':
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
      });
    },
    
    setupFocusManagement: function() {
      var self = this;
      // Trap focus inside modals when open
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && self.isModalOpen) {
          var modal = document.querySelector('.modal-backdrop:not(.hidden)');
          if (!modal) return;
          
          var focusable = modal.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
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
      });
    },
    
    setupNumericValidation: function() {
      var self = this;
      document.addEventListener('keydown', function(e) {
        // Skip validation for ID fields and group name fields (allow strings)
        if (e.target.classList.contains('item-input-id') || 
            e.target.classList.contains('item-input-2d-id') ||
            e.target.classList.contains('cut-item-id') ||
            e.target.classList.contains('group-name-input')) {
          return;
        }
        
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
          self.showInputError(e.target, 'Please enter numbers only');
        }
      });
      
      // Additional validation for paste events
      document.addEventListener('paste', function(e) {
        // Skip validation for ID fields and group name fields
        if (e.target.classList.contains('item-input-id') || 
            e.target.classList.contains('item-input-2d-id') ||
            e.target.classList.contains('cut-item-id') ||
            e.target.classList.contains('group-name-input')) {
          return;
        }
        
        if (!e.target.classList.contains('numeric-only') && 
            !e.target.classList.contains('item-input') &&
            !e.target.classList.contains('cut-item-input')) {
          return;
        }
        
        var pastedText = (e.clipboardData || window.clipboardData).getData('text');
        if (!/^\d+$/.test(pastedText)) {
          e.preventDefault();
          self.showInputError(e.target, 'Only numeric values can be pasted');
        }
      });
    },
    
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
      console.log('📱 App: Opening modal ' + modalId);
      this.isModalOpen = true;
      this.activeModal = modalId;
      var modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focus trap - delay slightly to allow animation to start
        setTimeout(function() {
          var focusable = modal.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusable.length) {
            focusable[0].focus();
          }
        }, 100);
      }
    },
    
    closeModal: function(modalId) {
      console.log('📱 App: Closing modal');
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
    
    // Tour functionality - FIXED COMPREHENSIVELY
    checkFirstVisit: function() {
      // Check if user has visited before
      var hasVisited = localStorage.getItem('eav-visited');
      
      // DEBUG: Uncomment line below to test tour (clears visited status)
      // localStorage.removeItem('eav-visited'); hasVisited = false;
      
      if (!hasVisited) {
        console.log('👋 First visit detected, showing tour...');
        // Small delay to ensure DOM is fully ready
        setTimeout(function() {
          window.App.openTour();
        }, 300);
      } else {
        console.log('👋 Returning visitor, skipping tour');
      }
    },
    
    openTour: function() {
      console.log('🎯 Opening tour...');
      this.tourStep = 1;
      this.openModal('tour-modal');
      
      // Ensure tour is visible then update step
      var self = this;
      setTimeout(function() {
        self.updateTourStep();
      }, 100); // Reduced delay for snappier response
    },
    
    closeTour: function() {
      console.log('🎯 Closing tour...');
      this.closeModal('tour-modal');
      // Mark as visited
      localStorage.setItem('eav-visited', 'true');
      this.tourStep = 1;
      
      // Reset steps for next time
      var steps = document.querySelectorAll('.tour-step');
      steps.forEach(function(step) {
        step.classList.remove('active');
        step.style.display = 'none';
      });
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
      var self = this;
      console.log('🎯 Updating tour step:', this.tourStep);
      
      // Get all steps
      var steps = document.querySelectorAll('#tour-modal .tour-step');
      
      // Hide all steps first
      steps.forEach(function(step) {
        step.classList.remove('active');
        step.style.display = 'none';
      });
      
      // Show current step with slight delay for transition
      var currentStep = document.querySelector('#tour-modal .tour-step[data-step="' + this.tourStep + '"]');
      if (currentStep) {
        // Force display first
        currentStep.style.display = 'flex';
        // Force reflow to ensure transition works
        void currentStep.offsetHeight;
        // Add active class for animation
        currentStep.classList.add('active');
      }
      
      // Update dots
      var dots = document.querySelectorAll('#tour-modal .dot');
      dots.forEach(function(dot, index) {
        if (index + 1 === self.tourStep) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
      
      // Update button text
      var nextBtn = document.getElementById('tour-next');
      if (nextBtn) {
        nextBtn.textContent = this.tourStep === this.maxTourSteps ? 'Get Started' : 'Next';
      }
      
      // Update skip button text for last step
      var skipBtn = document.getElementById('tour-skip');
      if (skipBtn) {
        skipBtn.textContent = this.tourStep === this.maxTourSteps ? 'Close' : 'Skip Tour';
      }
      
      // Announce to screen readers
      if (currentStep && window.AccessibilityManager) {
        var stepText = currentStep.querySelector('h3') ? currentStep.querySelector('h3').textContent : '';
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
      setTimeout(function() { successEl.remove(); }, 3000);
      
      // Announce to screen readers
      if (window.AccessibilityManager) {
        window.AccessibilityManager.announce(message);
      }
    }
  };

  // Initialize when DOM is ready - Only initialize once
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
  `;
  document.head.appendChild(style);

  console.log('✅ App script loaded with comprehensive tour fix');
})();