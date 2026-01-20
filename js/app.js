/**
 * Main Application - Modal and Navigation
 * Fixed: Simplified event delegation and initialization
 */

(function() {
  'use strict';

  // Global App Object
  window.App = {
    isModalOpen: false,
    isInitialized: false,
    
    init: function() {
      console.log('🚀 App: Initializing...');
      this.setupEventListeners();
      this.updateActiveNav();
      this.loadQRImage();
      this.isInitialized = true;
    },
    
    setupEventListeners: function() {
      console.log('🔧 App: Setting up event listeners...');
      
      // Donate button
      var donateBtn = document.getElementById('donate-btn');
      if (donateBtn) {
        donateBtn.addEventListener('click', this.openModal.bind(this));
      }
      
      // Modal close button
      var modalClose = document.getElementById('modal-close');
      if (modalClose) {
        modalClose.addEventListener('click', this.closeModal.bind(this));
      }
      
      // Modal backdrop click
      var modal = document.getElementById('donation-modal');
      if (modal) {
        modal.addEventListener('click', function(e) {
          if (e.target === modal) {
            this.closeModal();
          }
        }.bind(this));
      }
      
      // Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && this.isModalOpen) {
          this.closeModal();
        }
      }.bind(this));
      
      // Mobile home button (if exists)
      var mobileHomeBtn = document.querySelector('.mobile-home-btn');
      if (mobileHomeBtn) {
        mobileHomeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          var href = this.dataset.href || '../index.html';
          window.location.href = href;
        });
      }
    },
    
    loadQRImage: function() {
      var qrImg = document.querySelector('.qr-image');
      if (qrImg && !qrImg.src.includes('base64')) {
        qrImg.onerror = function() {
          this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlFSIENvZGU8L3RleHQ+PC9zdmc+';
        };
      }
    },
    
    openModal: function() {
      console.log('📱 App: Opening modal...');
      this.isModalOpen = true;
      var modal = document.getElementById('donation-modal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    },
    
    closeModal: function() {
      console.log('📱 App: Closing modal...');
      this.isModalOpen = false;
      var modal = document.getElementById('donation-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
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
                               (currentPath.includes('pages/2d') && href.includes('2d'));
          
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
      
      // Add to container
      var firstChild = container.firstChild;
      if (firstChild) {
        container.insertBefore(errorEl, firstChild);
      } else {
        container.appendChild(errorEl);
      }

      // Auto-remove after 5 seconds
      setTimeout(function() { errorEl.remove(); }, 5000);
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

  console.log('✅ App script loaded');
})();