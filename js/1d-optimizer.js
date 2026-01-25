(function(window, document) {
  'use strict';

  // ============================================================================
  // 1D OPTIMIZER CORE CLASSES
  // ============================================================================

  function Bar1D(id, maxLength) {
    this.id = id;
    this.maxLength = maxLength;
    this.items = [];
    this.usedLength = 0;
    this.remainingLength = maxLength;
    this.efficiency = 0;
    this.wastePercentage = 0;
  }

  Bar1D.prototype.canPlace = function(item) {
    return this.remainingLength >= item.length;
  };

  Bar1D.prototype.placeItem = function(item) {
    if (this.canPlace(item)) {
      item.placed = true;
      item.position = this.usedLength;
      item.barId = this.id;
      this.items.push(item);
      this.usedLength += item.length;
      this.remainingLength = this.maxLength - this.usedLength;
      this.efficiency = Math.round((this.usedLength / this.maxLength) * 100);
      this.wastePercentage = 100 - this.efficiency;
      return true;
    }
    return false;
  };

  // ============================================================================
  // CUTTING OPTIMIZER 1D
  // ============================================================================

  function CuttingOptimizer1D(algorithm) {
    this.algorithm = algorithm;
  }

  CuttingOptimizer1D.prototype.optimize = function(items, materialLength) {
    var startTime = Date.now();
    var allItems = [];

    // Prepare items array
    items.forEach(function(item) {
      for (var i = 0; i < item.quantity; i++) {
        allItems.push({
          id: item.id,
          length: item.length,
          quantity: item.quantity,
          placed: false,
          position: 0,
          barId: '',
          originalId: item.id,
          originalLength: item.originalLength
        });
      }
    });

    // Run selected algorithm
    var bars;
    switch (this.algorithm) {
      case 'best-fit':
        bars = this.bestFitAlgorithm(allItems, materialLength);
        break;
      case 'worst-fit':
        bars = this.worstFitAlgorithm(allItems, materialLength);
        break;
      default:
        bars = this.firstFitAlgorithm(allItems, materialLength);
    }

    // Calculate statistics
    var totalBars = bars.length;
    var totalItemsPlaced = bars.reduce(function(sum, bar) { return sum + bar.items.length; }, 0);
    var totalUsedLength = bars.reduce(function(sum, bar) { return sum + bar.usedLength; }, 0);
    var totalMaterialLength = totalBars * materialLength;
    var totalWaste = totalMaterialLength - totalUsedLength;
    var overallEfficiency = totalMaterialLength > 0 ? (totalUsedLength / totalMaterialLength) * 100 : 0;

    return {
      bars: bars,
      totalBars: totalBars,
      totalItems: totalItemsPlaced,
      totalUsedLength: totalUsedLength,
      totalWaste: totalWaste,
      totalMaterialLength: totalMaterialLength,
      overallEfficiency: Math.round(overallEfficiency),
      executionTime: Date.now() - startTime,
      algorithm: this.algorithm
    };
  };

  // First-Fit Algorithm (default)
  CuttingOptimizer1D.prototype.firstFitAlgorithm = function(items, materialLength) {
    var sortedItems = items.slice().sort(function(a, b) { return b.length - a.length; });
    var bars = [];

    sortedItems.forEach(function(item) {
      var placed = false;
      for (var i = 0; i < bars.length; i++) {
        if (bars[i].placeItem(item)) {
          placed = true;
          break;
        }
      }
      if (!placed) {
        var newBar = new Bar1D('BAR-' + (bars.length + 1), materialLength);
        if (newBar.placeItem(item)) {
          bars.push(newBar);
        }
      }
    });

    return bars;
  };

  // Best-Fit Algorithm
  CuttingOptimizer1D.prototype.bestFitAlgorithm = function(items, materialLength) {
    var sortedItems = items.slice().sort(function(a, b) { return b.length - a.length; });
    var bars = [];

    sortedItems.forEach(function(item) {
      var bestBar = null;
      var bestRemaining = Infinity;

      for (var i = 0; i < bars.length; i++) {
        if (bars[i].canPlace(item)) {
          var remaining = bars[i].remainingLength - item.length;
          if (remaining >= 0 && remaining < bestRemaining) {
            bestRemaining = remaining;
            bestBar = bars[i];
          }
        }
      }

      if (bestBar) {
        bestBar.placeItem(item);
      } else {
        var newBar = new Bar1D('BAR-' + (bars.length + 1), materialLength);
        newBar.placeItem(item);
        bars.push(newBar);
      }
    });
    return bars;
  };

  // Worst-Fit Algorithm (experimental)
  CuttingOptimizer1D.prototype.worstFitAlgorithm = function(items, materialLength) {
    var sortedItems = items.slice().sort(function(a, b) { return b.length - a.length; });
    var bars = [];

    sortedItems.forEach(function(item) {
      var worstBar = null;
      var maxRemaining = -1;

      for (var i = 0; i < bars.length; i++) {
        if (bars[i].canPlace(item)) {
          if (bars[i].remainingLength > maxRemaining) {
            maxRemaining = bars[i].remainingLength;
            worstBar = bars[i];
          }
        }
      }

      if (worstBar) {
        worstBar.placeItem(item);
      } else {
        var newBar = new Bar1D('BAR-' + (bars.length + 1), materialLength);
        newBar.placeItem(item);
        bars.push(newBar);
      }
    });
    return bars;
  };

  // ============================================================================
  // 1D OPTIMIZER UI MANAGER - NO ANIMATIONS
  // ============================================================================

  function Optimizer1DManager() {
    console.log('🔧 1D Optimizer Manager: Creating...');
    
    this.items = [
      { id: 'A', length: '', quantity: '', key: this.generateId() }
    ];
    
    this.materialLength = 6000;
    this.kerfWidth = 3;
    this.algorithm = 'first-fit';
    this.result = null;
    this.formData = null;
    this.currentBarIndex = 0;
    this.itemColors = new Map();
    
    // Initialize when DOM is ready
    this.initialize();
  }

  Optimizer1DManager.prototype.generateId = function() {
    return 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  Optimizer1DManager.prototype.initialize = function() {
    console.log('🔧 1D Optimizer Manager: Initializing...');
    
    // Render items table immediately
    this.renderItems();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Set default values
    this.setDefaultValues();
  };

  Optimizer1DManager.prototype.setDefaultValues = function() {
    var materialInput = document.getElementById('material-length');
    var kerfInput = document.getElementById('kerf-width');
    var algorithmSelect = document.getElementById('algorithm-1d');
    
    if (materialInput) materialInput.value = this.materialLength;
    if (kerfInput) kerfInput.value = this.kerfWidth;
    if (algorithmSelect) algorithmSelect.value = this.algorithm;
    
    // Add change listeners for parameters
    var self = this;
    if (materialInput) {
      materialInput.addEventListener('change', function(e) {
        self.materialLength = Math.max(1, parseInt(e.target.value) || 6000);
      });
    }
    
    if (kerfInput) {
      kerfInput.addEventListener('change', function(e) {
        self.kerfWidth = Math.max(0, parseInt(e.target.value) || 0);
      });
    }
    
    if (algorithmSelect) {
      algorithmSelect.addEventListener('change', function(e) {
        self.algorithm = e.target.value;
      });
    }
  };

  Optimizer1DManager.prototype.setupEventListeners = function() {
    console.log('🔧 1D Optimizer Manager: Setting up event listeners...');
    
    var self = this;
    
    // Add Item Button
    var addBtn = document.getElementById('add-item-1d');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        self.addItem();
      });
    }
    
    // Optimize Button
    var optimizeBtn = document.getElementById('optimize-1d');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', function() {
        self.optimize();
      });
    }
    
    // FIXED: Use closest() to handle clicks on child elements (SVGs)
    document.addEventListener('click', function(e) {
      var prevBtn = e.target.closest('#prev-bar-1d');
      var nextBtn = e.target.closest('#next-bar-1d');
      
      if (prevBtn) {
        e.preventDefault();
        self.prevBar();
      } else if (nextBtn) {
        e.preventDefault();
        self.nextBar();
      }
    });

    // Input changes for items
    document.addEventListener('input', function(e) {
      if (e.target.classList.contains('item-input') || 
          e.target.classList.contains('item-input-id') || 
          e.target.classList.contains('item-input-qty')) {
        self.updateItem(e.target);
      }
    });

    // Remove item buttons
    document.addEventListener('click', function(e) {
      if (e.target.closest('.btn-remove')) {
        e.preventDefault();
        var btn = e.target.closest('.btn-remove');
        var itemId = btn.dataset.remove;
        if (itemId) self.removeItem(itemId);
      }
    });
  };

  Optimizer1DManager.prototype.addItem = function() {
    var nextId = String.fromCharCode(65 + this.items.length);
    this.items.push({
      id: nextId,
      length: '',
      quantity: '',
      key: this.generateId()
    });
    this.renderItems();
  };

  Optimizer1DManager.prototype.removeItem = function(itemId) {
    if (this.items.length <= 1) {
      this.showError('Cannot remove the last item');
      return;
    }
    
    this.items = this.items.filter(function(item) { return item.key !== itemId; });
    this.renderItems();
  };

  Optimizer1DManager.prototype.updateItem = function(input) {
    var row = input.closest('.item-row');
    if (!row) return;
    
    var itemId = row.dataset.id;
    var field = input.dataset.field;
    var value = input.value;

    var item = this.items.find(function(i) { return i.key === itemId; });
    if (!item) return;

    if (field === 'id') {
      item[field] = value; // Allow string values for ID
    } else {
      // Allow empty values for placeholders
      if (value === '') {
        item[field] = '';
      } else {
        var numValue = parseInt(value, 10);
        var sanitizedValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
        item[field] = sanitizedValue;
      }
    }
  };

  Optimizer1DManager.prototype.renderItems = function() {
    var container = document.getElementById('items-container-1d');
    if (!container) {
      console.error('❌ Items container not found');
      return;
    }
    
    container.innerHTML = this.items.map(function(item) {
      return `
        <div class="item-row" data-id="${item.key}" role="listitem">
          <input type="text" 
                 placeholder="ID" 
                 value="${item.id}" 
                 class="form-input item-input-id" 
                 data-field="id" 
                 data-id="${item.key}"
                 aria-label="Item identifier">
          <input type="number" 
                 placeholder="mm" 
                 value="${item.length}" 
                 class="form-input item-input placeholder-opacity" 
                 data-field="length" 
                 data-id="${item.key}" 
                 min="1"
                 aria-label="Item length in millimeters">
          <input type="number" 
                 placeholder="Qty" 
                 value="${item.quantity}" 
                 class="form-input item-input-qty placeholder-opacity" 
                 data-field="quantity" 
                 data-id="${item.key}" 
                 min="1"
                 aria-label="Item quantity">
          <button type="button" 
                  class="btn-remove" 
                  data-remove="${item.key}" 
                  ${this.items.length <= 1 ? 'disabled' : ''}
                  aria-label="Remove item ${item.id}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `;
    }.bind(this)).join('');
  };

  Optimizer1DManager.prototype.validateInputs = function() {
    var validItems = this.items.filter(function(i) {
      var length = parseInt(i.length, 10);
      var quantity = parseInt(i.quantity, 10);
      return !isNaN(length) && length > 0 && !isNaN(quantity) && quantity > 0;
    });
    
    if (validItems.length === 0) {
      this.showError('Please add at least one item with valid length and quantity.');
      return null;
    }

    if (this.materialLength <= 0) {
      this.showError('Material Length must be greater than zero.');
      return null;
    }

    // Check if any item is too large
    for (var i = 0; i < validItems.length; i++) {
      var itemLength = parseInt(validItems[i].length, 10);
      if (itemLength + this.kerfWidth > this.materialLength) {
        this.showError('Item "' + validItems[i].id + '" length (' + itemLength + 'mm + ' + this.kerfWidth + 'mm kerf) exceeds material length of ' + this.materialLength + 'mm.');
        return null;
      }
    }
    
    return validItems;
  };

  Optimizer1DManager.prototype.optimize = function() {
    console.log('⚡ 1D Optimizer: Starting optimization...');
    
    var validItems = this.validateInputs();
    if (!validItems) return;
    
    this.setLoading(true);
    
    var processedItems = validItems.map(function(item) {
      return {
        id: item.id,
        length: parseInt(item.length, 10) + this.kerfWidth,
        quantity: parseInt(item.quantity, 10),
        originalLength: parseInt(item.length, 10)
      };
    }.bind(this));
    
    var self = this;
    // NO ANIMATION - Process immediately
    try {
      var optimizer = new CuttingOptimizer1D(self.algorithm);
      self.result = optimizer.optimize(processedItems, self.materialLength);
      self.formData = {
        items: self.items,
        materialLength: self.materialLength,
        kerfWidth: self.kerfWidth,
        algorithm: self.algorithm
      };
      
      self.renderResults();
      
      if (window.AccessibilityManager) {
        window.AccessibilityManager.announce('Optimization completed. ' + self.result.totalBars + ' bars required.');
      }
      
    } catch (error) {
      console.error('❌ Optimization error:', error);
      self.showError('An error occurred during optimization: ' + error.message);
      
      if (window.AccessibilityManager) {
        window.AccessibilityManager.announce('Optimization failed: ' + error.message);
      }
    } finally {
      self.setLoading(false);
    }
  };

  Optimizer1DManager.prototype.renderResults = function() {
    var formContainer = document.getElementById('optimizer-1d-form');
    var resultsContainer = document.getElementById('optimizer-1d-results');
    
    if (!formContainer || !resultsContainer) {
      console.error('❌ Result containers not found');
      return;
    }
    
    formContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    
    var uniqueItemIds = [...new Set(this.result.bars.flatMap(function(b) { return b.items.map(function(i) { return i.originalId; }); }))];
    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#ef4444', '#0ea5e9'];
    uniqueItemIds.forEach(function(id, i) {
      this.itemColors.set(id, colors[i % colors.length]);
    }.bind(this));
    
    this.currentBarIndex = 0;
    
    var resultsHTML = `
      <div class="panel results-view">
        <div class="panel-header">
          <div class="panel-title-group">
            <svg xmlns="http://www.w3.org/2000/svg" class="panel-icon results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 class="panel-title">Optimization Results</h2>
          </div>
          <div class="action-buttons">
            <button class="btn btn-secondary" id="back-to-form-1d">Back to Form</button>
            <button class="btn btn-primary" id="export-pdf-1d">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-pdf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
        <div class="panel-content">
          <div class="stat-grid">
            <div class="stat-card">
              <p class="stat-label">Total Bars</p>
              <p class="stat-value">${this.result.totalBars}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Efficiency</p>
              <p class="stat-value">${this.result.overallEfficiency}<span class="stat-unit">%</span></p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Total Waste</p>
              <p class="stat-value">${this.result.totalWaste.toLocaleString()}<span class="stat-unit">mm</span></p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Time</p>
              <p class="stat-value">${this.result.executionTime}<span class="stat-unit">ms</span></p>
            </div>
          </div>

          <div class="nav-controls">
            <h3 class="nav-title">Bar Layouts</h3>
            <div class="nav-buttons">
              <span class="nav-counter">Bar ${this.currentBarIndex + 1} of ${this.result.bars.length}</span>
              <button class="nav-btn" id="prev-bar-1d" ${this.currentBarIndex === 0 ? 'disabled' : ''} aria-label="Previous bar visualization">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button class="nav-btn" id="next-bar-1d" ${this.currentBarIndex === this.result.bars.length - 1 ? 'disabled' : ''} aria-label="Next bar visualization">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div id="bar-visualization-container" role="region" aria-label="Bar cutting visualization">
            ${this.renderBarVisualization()}
          </div>
        </div>
      </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    
    var backBtn = document.getElementById('back-to-form-1d');
    if (backBtn) backBtn.addEventListener('click', this.backToForm.bind(this));
    
    var exportBtn = document.getElementById('export-pdf-1d');
    if (exportBtn) exportBtn.addEventListener('click', this.exportToPDF.bind(this));
    
    resultsContainer.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  Optimizer1DManager.prototype.renderBarVisualization = function() {
    if (!this.result || !this.result.bars[this.currentBarIndex]) {
      return '<div class="empty-state" role="alert">No bar data available</div>';
    }
    
    var bar = this.result.bars[this.currentBarIndex];
    var self = this;
    var segments = bar.items.map(function(item, index) {
      var widthPercentage = (item.originalLength / self.materialLength) * 100;
      var color = self.itemColors.get(item.originalId) || '#3b82f6';
      return `
        <div class="bar-segment" 
             style="width: ${widthPercentage}%; background-color: ${color};"
             title="${item.originalId}: ${item.originalLength}mm"
             role="img" aria-label="Item ${item.originalId}, length ${item.originalLength}mm">
          ${widthPercentage > 5 ? '<span class="truncate">' + item.originalId + '</span>' : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="bar-viz-container">
        <div class="bar-visualization" title="Total Length: ${this.materialLength}mm" role="img" aria-label="Bar ${bar.id}, efficiency ${bar.efficiency}%">
          ${segments}
        </div>
        <div class="bar-info">
          <p><b>Bar ${bar.id}:</b> Efficiency: ${bar.efficiency}% | Waste: ${bar.remainingLength}mm | Items: ${bar.items.length}</p>
        </div>
      </div>
    `;
  };

  Optimizer1DManager.prototype.prevBar = function() {
    if (this.currentBarIndex > 0) {
      this.currentBarIndex--;
      this.updateBarVisualization();
    }
  };

  Optimizer1DManager.prototype.nextBar = function() {
    if (this.currentBarIndex < this.result.bars.length - 1) {
      this.currentBarIndex++;
      this.updateBarVisualization();
    }
  };

  Optimizer1DManager.prototype.updateBarVisualization = function() {
    var container = document.getElementById('bar-visualization-container');
    if (container) {
      container.innerHTML = this.renderBarVisualization();
    }

    var counter = document.querySelector('.nav-counter');
    if (counter) {
      counter.textContent = 'Bar ' + (this.currentBarIndex + 1) + ' of ' + this.result.bars.length;
    }

    var prevBtn = document.getElementById('prev-bar-1d');
    var nextBtn = document.getElementById('next-bar-1d');
    if (prevBtn) prevBtn.disabled = this.currentBarIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentBarIndex === this.result.bars.length - 1;
  };

  Optimizer1DManager.prototype.backToForm = function() {
    var formContainer = document.getElementById('optimizer-1d-form');
    var resultsContainer = document.getElementById('optimizer-1d-results');
    
    if (formContainer) formContainer.classList.remove('hidden');
    if (resultsContainer) resultsContainer.classList.add('hidden');
    
    this.result = null;
    this.formData = null;
    this.currentBarIndex = 0;
    this.itemColors.clear();
    
    formContainer.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  Optimizer1DManager.prototype.exportToPDF = function() {
    if (!this.result || !this.formData) {
      this.showError('No results to export');
      return;
    }
    
    try {
      if (typeof window.export1DToPDF === 'function') {
        window.export1DToPDF(this.result, this.formData);
        
        if (window.AccessibilityManager) {
          window.AccessibilityManager.announce('PDF export started. Download will begin shortly.');
        }
      } else {
        this.showError('PDF export is not available. Please check your connection.');
      }
    } catch (error) {
      console.error('❌ PDF Export failed:', error);
      this.showError('Failed to export PDF. Please try again.');
    }
  };

  // Helper methods
  Optimizer1DManager.prototype.setLoading = function(loading) {
    var overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.toggle('hidden', !loading);
    }
    
    var optimizeBtn = document.getElementById('optimize-1d');
    if (optimizeBtn) {
      if (loading) {
        optimizeBtn.disabled = true;
      } else {
        optimizeBtn.disabled = false;
      }
    }
  };

  Optimizer1DManager.prototype.showError = function(message) {
    if (window.App && typeof window.App.showError === 'function') {
      window.App.showError(message, 'optimizer-1d-form');
      return;
    }
    
    var container = document.getElementById('optimizer-1d-form');
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

    setTimeout(function() { errorEl.remove(); }, 5000);
  };

  // Export classes to global scope
  window.CuttingOptimizer1D = CuttingOptimizer1D;
  window.Bar1D = Bar1D;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (document.getElementById('optimizer-1d-form')) {
        window.optimizer1D = new Optimizer1DManager();
        console.log('✅ 1D Optimizer initialized - No animations');
      }
    });
  } else {
    if (document.getElementById('optimizer-1d-form')) {
      window.optimizer1D = new Optimizer1DManager();
      console.log('✅ 1D Optimizer initialized - No animations');
    }
  }

  console.log('✅ 1D Optimizer script loaded - No animations');
})(window, document);