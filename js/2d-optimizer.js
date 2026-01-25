/**
 * 2D Optimizer - Fixed Version with Global Export
 * Changed from module to IIFE pattern for reliability
 * NO UNDO/REDO FEATURE - Clean implementation
 */

(function(window, document) {
  'use strict';

  // ============================================================================
  // 2D OPTIMIZER CORE CLASSES
  // ============================================================================

  function Plate2D(id, width, height) {
    this.id = id;
    this.width = width;
    this.height = height;
    this.items = [];
    this.usedArea = 0;
    this.totalArea = width * height;
    this.freeRects = [{ x: 0, y: 0, width: width, height: height }];
  }

  Plate2D.prototype.getEfficiency = function() {
    return this.totalArea > 0 ? Math.round((this.usedArea / this.totalArea) * 100) : 0;
  };

  Plate2D.prototype.getWasteArea = function() {
    return this.totalArea - this.usedArea;
  };

  Plate2D.prototype.placeItem = function(item, x, y, rotated) {
    if (rotated) {
      var temp = item.width;
      item.width = item.height;
      item.height = temp;
      item.rotated = true;
    }
    item.x = x;
    item.y = y;
    item.placed = true;
    this.items.push(item);
    this.usedArea += item.width * item.height;
    this.splitFreeRects(item);
  };

  Plate2D.prototype.splitFreeRects = function(placedItem) {
    var newFreeRects = [];
    for (var i = 0; i < this.freeRects.length; i++) {
      var freeRect = this.freeRects[i];
      // Check for intersection
      if (placedItem.x < freeRect.x + freeRect.width && placedItem.x + placedItem.width > freeRect.x &&
          placedItem.y < freeRect.y + freeRect.height && placedItem.y + placedItem.height > freeRect.y) {
        
        // Top
        if (placedItem.y > freeRect.y) {
          newFreeRects.push({
            x: freeRect.x,
            y: freeRect.y,
            width: freeRect.width,
            height: placedItem.y - freeRect.y
          });
        }
        // Bottom
        if (placedItem.y + placedItem.height < freeRect.y + freeRect.height) {
          newFreeRects.push({
            x: freeRect.x,
            y: placedItem.y + placedItem.height,
            width: freeRect.width,
            height: freeRect.y + freeRect.height - (placedItem.y + placedItem.height)
          });
        }
        // Left
        if (placedItem.x > freeRect.x) {
          newFreeRects.push({
            x: freeRect.x,
            y: freeRect.y,
            width: placedItem.x - freeRect.x,
            height: freeRect.height
          });
        }
        // Right
        if (placedItem.x + placedItem.width < freeRect.x + freeRect.width) {
          newFreeRects.push({
            x: placedItem.x + placedItem.width,
            y: freeRect.y,
            width: freeRect.x + freeRect.width - (placedItem.x + placedItem.width),
            height: freeRect.height
          });
        }
      } else {
        newFreeRects.push(freeRect);
      }
    }
    this.freeRects = newFreeRects.filter(function(rect) { return rect.width > 0 && rect.height > 0; });
    this.mergeFreeRects();
  };

  Plate2D.prototype.mergeFreeRects = function() {
    var i = 0;
    while (i < this.freeRects.length) {
      var j = i + 1;
      while (j < this.freeRects.length) {
        var rect1 = this.freeRects[i];
        var rect2 = this.freeRects[j];
        if (this.isContained(rect2, rect1)) {
          this.freeRects.splice(j, 1);
        } else if (this.isContained(rect1, rect2)) {
          this.freeRects.splice(i, 1);
          i--;
          break;
        } else {
          j++;
        }
      }
      i++;
    }
  };

  Plate2D.prototype.isContained = function(inner, outer) {
    return inner.x >= outer.x && inner.y >= outer.y &&
           inner.x + inner.width <= outer.x + outer.width &&
           inner.y + inner.height <= outer.y + outer.height;
  };

  // ============================================================================
  // PLATE OPTIMIZER 2D
  // ============================================================================

  function PlateOptimizer2D(algorithm) {
    this.algorithm = algorithm;
  }

  PlateOptimizer2D.prototype.optimize = function(items, plateWidth, plateHeight) {
    var startTime = Date.now();
    var allItems = [];
    
    // Prepare items array
    items.forEach(function(item) {
      for (var i = 0; i < item.quantity; i++) {
        allItems.push({
          id: item.id,
          width: item.width,
          height: item.height,
          quantity: item.quantity,
          rotation: item.rotation,
          placed: false,
          x: 0,
          y: 0,
          rotated: false,
          area: item.width * item.height,
          originalId: item.id,
          originalWidth: item.originalWidth,
          originalHeight: item.originalHeight
        });
      }
    });

    // Pack items using selected algorithm
    var plates = this.packItems(allItems, plateWidth, plateHeight);
    
    // Calculate statistics
    var totalPlates = plates.length;
    var totalItemsPlaced = plates.reduce(function(sum, p) { return sum + p.items.length; }, 0);
    var totalUsedArea = plates.reduce(function(sum, p) { return sum + p.usedArea; }, 0);
    var totalPlateArea = totalPlates * plateWidth * plateHeight;
    var overallEfficiency = totalPlateArea > 0 ? Math.round((totalUsedArea / totalPlateArea) * 100) : 0;

    return {
      plates: plates,
      totalPlates: totalPlates,
      totalItems: totalItemsPlaced,
      totalUsedArea: totalUsedArea,
      overallEfficiency: overallEfficiency,
      unplacedItems: allItems.length - totalItemsPlaced,
      executionTime: Date.now() - startTime,
      algorithm: this.algorithm
    };
  };

  PlateOptimizer2D.prototype.packItems = function(items, plateWidth, plateHeight) {
    var plates = [];
    var sortedItems = items.slice().sort(function(a, b) {
      return Math.max(b.width, b.height) - Math.max(a.width, a.height);
    });

    for (var i = 0; i < sortedItems.length; i++) {
      var item = sortedItems[i];
      var bestFit = null;
      
      // Try to place in existing plates
      for (var j = 0; j < plates.length; j++) {
        var fit = this.findBestFitForPlate(item, plates[j]);
        if (fit && (!bestFit || fit.score < bestFit.score)) {
          bestFit = { plate: plates[j], x: fit.x, y: fit.y, rotated: fit.rotated, score: fit.score };
        }
      }

      // Place in best fit or create new plate
      if (bestFit) {
        bestFit.plate.placeItem(item, bestFit.x, bestFit.y, bestFit.rotated);
      } else {
        var newPlate = new Plate2D('PLATE-' + (plates.length + 1), plateWidth, plateHeight);
        var fit = this.findBestFitForPlate(item, newPlate);
        if (fit) {
          newPlate.placeItem(item, fit.x, fit.y, fit.rotated);
          plates.push(newPlate);
        }
      }
    }
    return plates;
  };

  PlateOptimizer2D.prototype.findBestFitForPlate = function(item, plate) {
    var bestFit = null;
    var bestScore = Infinity;

    // Try both orientations if rotation is allowed
    for (var rotated = 0; rotated < (item.rotation ? 2 : 1); rotated++) {
      var w = rotated ? item.height : item.width;
      var h = rotated ? item.width : item.height;

      // Try each free rectangle
      for (var i = 0; i < plate.freeRects.length; i++) {
        var rect = plate.freeRects[i];
        if (w <= rect.width && h <= rect.height) {
          var score;
          switch (this.algorithm) {
            case 'GUILLOTINE':
              score = Math.min(rect.width - w, rect.height - h);
              break;
            case 'MAXRECTS':
              score = rect.width * rect.height - w * h;
              break;
            case 'SIMPLE':
              score = rect.x + rect.y;
              break;
            default:
              score = rect.width * rect.height - w * h;
          }
          if (score < bestScore) {
            bestScore = score;
            bestFit = { x: rect.x, y: rect.y, rotated: !!rotated, score: score };
          }
        }
      }
    }
    return bestFit;
  };

  // ============================================================================
  // 2D OPTIMIZER UI MANAGER
  // ============================================================================

  function Optimizer2DManager() {
    console.log('🔧 2D Optimizer Manager: Creating...');
    
    // Initialize with only 1 default item (ID: A)
    this.items = [
      { id: 'A', width: '', height: '', quantity: '', rotation: true, key: this.generateId() }
    ];
    
    this.plateWidth = 2440;
    this.plateHeight = 1220;
    this.kerfWidth = 0;
    this.algorithm = 'GUILLOTINE';
    this.result = null;
    this.formData = null;
    this.currentPlateIndex = 0;
    this.itemColors = new Map();
    
    // Initialize when DOM is ready
    this.initialize();
  }

  Optimizer2DManager.prototype.generateId = function() {
    return 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  Optimizer2DManager.prototype.initialize = function() {
    console.log('🔧 2D Optimizer Manager: Initializing...');
    
    // Render items table immediately
    this.renderItems();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Set default values
    this.setDefaultValues();
  };

  Optimizer2DManager.prototype.setDefaultValues = function() {
    var widthInput = document.getElementById('plate-width');
    var heightInput = document.getElementById('plate-height');
    var kerfInput = document.getElementById('kerf-width-2d');
    var algorithmSelect = document.getElementById('algorithm-2d');
    
    if (widthInput) widthInput.value = this.plateWidth;
    if (heightInput) heightInput.value = this.plateHeight;
    if (kerfInput) kerfInput.value = this.kerfWidth;
    if (algorithmSelect) algorithmSelect.value = this.algorithm;
    
    // Add change listeners for parameters
    var self = this;
    if (widthInput) {
      widthInput.addEventListener('change', function(e) {
        self.plateWidth = Math.max(1, parseInt(e.target.value) || 2440);
      });
    }
    
    if (heightInput) {
      heightInput.addEventListener('change', function(e) {
        self.plateHeight = Math.max(1, parseInt(e.target.value) || 1220);
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

  Optimizer2DManager.prototype.setupEventListeners = function() {
    console.log('🔧 2D Optimizer Manager: Setting up event listeners...');
    
    var self = this;
    
    // Add Item Button
    var addBtn = document.getElementById('add-item-2d');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        self.addItem();
      });
    }
    
    // Optimize Button
    var optimizeBtn = document.getElementById('optimize-2d');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', function() {
        self.optimize();
      });
    }
    
    // Back to form button
    var backBtn = document.getElementById('back-to-form-2d');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        self.backToForm();
      });
    }
    
    // Export PDF button
    var exportBtn = document.getElementById('export-pdf-2d');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        self.exportToPDF();
      });
    }
    
    // FIXED: Use closest() to handle clicks on child elements (SVGs)
    document.addEventListener('click', function(e) {
      var prevBtn = e.target.closest('#prev-plate-2d');
      var nextBtn = e.target.closest('#next-plate-2d');
      
      if (prevBtn) {
        e.preventDefault();
        self.prevPlate();
      } else if (nextBtn) {
        e.preventDefault();
        self.nextPlate();
      }
    });

    // Input changes for items
    document.addEventListener('input', function(e) {
      if (e.target.classList.contains('item-input')) {
        self.updateItem(e.target);
      }
    });

    // Remove item buttons and checkbox changes
    document.addEventListener('click', function(e) {
      if (e.target.closest('.btn-remove')) {
        e.preventDefault();
        var btn = e.target.closest('.btn-remove');
        var itemId = btn.dataset.remove;
        if (itemId) self.removeItem(itemId);
      }
    });

    document.addEventListener('change', function(e) {
      if (e.target.classList.contains('item-checkbox')) {
        self.updateCheckbox(e.target);
      }
    });
  };

  Optimizer2DManager.prototype.addItem = function() {
    var nextId = String.fromCharCode(65 + this.items.length);
    this.items.push({
      id: nextId,
      width: '',
      height: '',
      quantity: '',
      rotation: true,
      key: this.generateId()
    });
    this.renderItems();
  };

  Optimizer2DManager.prototype.removeItem = function(itemId) {
    if (this.items.length <= 1) {
      this.showError('Cannot remove the last item');
      return;
    }
    
    this.items = this.items.filter(function(item) { return item.key !== itemId; });
    this.renderItems();
  };

  Optimizer2DManager.prototype.updateItem = function(input) {
    var row = input.closest('.item-card-2d');
    if (!row) return;
    
    var itemId = row.dataset.id;
    var field = input.dataset.field;
    var value = input.value;

    var item = this.items.find(function(i) { return i.key === itemId; });
    if (!item) return;

    if (field === 'id') {
      item[field] = value;
    } else {
      // Allow empty values for placeholders
      if (value === '') {
        item[field] = '';
      } else {
        var numValue = parseInt(value, 10);
        var sanitizedValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
        item[field] = sanitizedValue;
      }
      // Auto-adjust quantity placeholder
      if (field === 'width' || field === 'height') {
        var qtyInput = row.querySelector('.item-input-2d-qty');
        if (qtyInput && !qtyInput.value) {
          qtyInput.placeholder = 'Qty';
        }
      }
    }
  };

  Optimizer2DManager.prototype.updateCheckbox = function(checkbox) {
    var row = checkbox.closest('.item-card-2d');
    if (!row) return;
    
    var itemId = row.dataset.id;
    var item = this.items.find(function(i) { return i.key === itemId; });
    if (item) {
      item.rotation = checkbox.checked;
    }
  };

  Optimizer2DManager.prototype.renderItems = function() {
    var container = document.getElementById('items-container-2d');
    if (!container) {
      console.error('❌ Items container not found');
      return;
    }
    
    container.innerHTML = this.items.map(function(item) {
      return `
        <div class="item-card-2d" data-id="${item.key}">
          <div class="item-grid-2d">
            <input type="text" 
                   placeholder="ID" 
                   value="${item.id}" 
                   class="form-input item-input item-input-2d-id" 
                   data-field="id" 
                   data-id="${item.key}">
            <input type="number" 
                   placeholder="mm" 
                   value="${item.width}" 
                   class="form-input item-input item-input-2d-width placeholder-opacity" 
                   data-field="width" 
                   data-id="${item.key}" 
                   min="1">
            <input type="number" 
                   placeholder="mm" 
                   value="${item.height}" 
                   class="form-input item-input item-input-2d-height placeholder-opacity" 
                   data-field="height" 
                   data-id="${item.key}" 
                   min="1">
            <input type="number" 
                   placeholder="Qty" 
                   value="${item.quantity}" 
                   class="form-input item-input item-input-2d-qty placeholder-opacity" 
                   data-field="quantity" 
                   data-id="${item.key}" 
                   min="1">
          </div>
          <div class="item-actions-2d">
            <label class="checkbox-label">
              <input type="checkbox" 
                     class="item-checkbox" 
                     data-id="${item.key}" 
                     ${item.rotation ? 'checked' : ''}>
              <span>Rotate</span>
            </label>
            <button type="button" 
                    class="btn-remove" 
                    data-remove="${item.key}" 
                    ${this.items.length <= 1 ? 'disabled' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      `;
    }.bind(this)).join('');
  };

  Optimizer2DManager.prototype.validateInputs = function() {
    // Filter valid items
    var validItems = this.items.filter(function(i) {
      var width = parseInt(i.width, 10);
      var height = parseInt(i.height, 10);
      var quantity = parseInt(i.quantity, 10);
      return !isNaN(width) && width > 0 && !isNaN(height) && height > 0 && !isNaN(quantity) && quantity > 0;
    });
    
    if (validItems.length === 0) {
      this.showError('Please add at least one item with valid dimensions and quantity.');
      return null;
    }

    if (this.plateWidth <= 0 || this.plateHeight <= 0) {
      this.showError('Plate dimensions must be greater than zero.');
      return null;
    }

    // Check if any item is too large
    for (var i = 0; i < validItems.length; i++) {
      var item = validItems[i];
      var itemWidth = parseInt(item.width, 10);
      var itemHeight = parseInt(item.height, 10);
      var canFit = (itemWidth <= this.plateWidth && itemHeight <= this.plateHeight) ||
                   (item.rotation && itemHeight <= this.plateWidth && itemWidth <= this.plateHeight);
      if (!canFit) {
        this.showError('Item "' + item.id + '" (' + itemWidth + 'x' + itemHeight + 'mm) is too large for the plate.');
        return null;
      }
    }
    
    return validItems;
  };

  Optimizer2DManager.prototype.optimize = function() {
    console.log('⚡ 2D Optimizer: Starting optimization...');
    
    // Validate inputs
    var validItems = this.validateInputs();
    if (!validItems) return;
    
    // Show loading
    this.setLoading(true);
    
    // Process items (add kerf width)
    var processedItems = validItems.map(function(item) {
      return {
        id: item.id,
        width: parseInt(item.width, 10) + this.kerfWidth,
        height: parseInt(item.height, 10) + this.kerfWidth,
        quantity: parseInt(item.quantity, 10),
        rotation: item.rotation || true,
        originalWidth: parseInt(item.width, 10),
        originalHeight: parseInt(item.height, 10)
      };
    }.bind(this));
    
    // Run optimization (with small delay to show loading)
    var self = this;
    setTimeout(function() {
      try {
        var optimizer = new PlateOptimizer2D(self.algorithm);
        self.result = optimizer.optimize(processedItems, self.plateWidth, self.plateHeight);
        self.formData = {
          items: self.items,
          plateWidth: self.plateWidth,
          plateHeight: self.plateHeight,
          kerfWidth: self.kerfWidth,
          algorithm: self.algorithm
        };
        
        self.renderResults();
        
        // Announce success to screen readers
        if (window.AccessibilityManager) {
          window.AccessibilityManager.announce('Optimization completed. ' + self.result.totalPlates + ' plates required.');
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
    }, 300);
  };

  Optimizer2DManager.prototype.renderResults = function() {
    var formContainer = document.getElementById('optimizer-2d-form');
    var resultsContainer = document.getElementById('optimizer-2d-results');
    
    if (!formContainer || !resultsContainer) {
      console.error('❌ Result containers not found');
      return;
    }
    
    // Hide form, show results
    formContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    
    // Generate colors for items
    var uniqueItemIds = [...new Set(this.result.plates.flatMap(function(p) { return p.items.map(function(i) { return i.originalId; }); }))];
    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#ef4444', '#0ea5e9'];
    uniqueItemIds.forEach(function(id, i) {
      this.itemColors.set(id, colors[i % colors.length]);
    }.bind(this));
    
    // Reset current plate index
    this.currentPlateIndex = 0;
    
    // Create results HTML
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
            <button class="btn btn-secondary" id="back-to-form-2d">Back to Form</button>
            <button class="btn btn-primary" id="export-pdf-2d">
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
              <p class="stat-label">Total Plates</p>
              <p class="stat-value">${this.result.totalPlates}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Efficiency</p>
              <p class="stat-value">${this.result.overallEfficiency}<span class="stat-unit">%</span></p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Unplaced</p>
              <p class="stat-value">${this.result.unplacedItems}<span class="stat-unit">items</span></p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Time</p>
              <p class="stat-value">${this.result.executionTime}<span class="stat-unit">ms</span></p>
            </div>
          </div>

          <div class="nav-controls">
            <h3 class="nav-title">Plate Layouts</h3>
            <div class="nav-buttons">
              <span class="nav-counter">Plate ${this.currentPlateIndex + 1} of ${this.result.plates.length}</span>
              <button class="nav-btn" id="prev-plate-2d" ${this.currentPlateIndex === 0 ? 'disabled' : ''} aria-label="Previous plate visualization">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button class="nav-btn" id="next-plate-2d" ${this.currentPlateIndex === this.result.plates.length - 1 ? 'disabled' : ''} aria-label="Next plate visualization">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div id="plate-visualization-container" role="region" aria-label="Plate cutting visualization">
            ${this.renderPlateVisualization()}
          </div>
        </div>
      </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Re-attach event listeners for new buttons
    var backBtn = document.getElementById('back-to-form-2d');
    if (backBtn) backBtn.addEventListener('click', this.backToForm.bind(this));
    
    var exportBtn = document.getElementById('export-pdf-2d');
    if (exportBtn) exportBtn.addEventListener('click', this.exportToPDF.bind(this));
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  Optimizer2DManager.prototype.renderPlateVisualization = function() {
    if (!this.result || !this.result.plates[this.currentPlateIndex]) {
      return '<div class="empty-state" role="alert">No plate data available</div>';
    }
    
    var plate = this.result.plates[this.currentPlateIndex];
    var aspectRatio = this.plateHeight / this.plateWidth;
    var self = this;
    var items = plate.items.map(function(item, index) {
      var left = (item.x / self.plateWidth) * 100;
      var top = (item.y / self.plateHeight) * 100;
      var width = (item.width / self.plateWidth) * 100;
      var height = (item.height / self.plateHeight) * 100;
      var color = self.itemColors.get(item.originalId) || '#3b82f6';
      
      return `
        <div class="plate-item"
             style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; background-color: ${color};"
             title="${item.originalId}: ${item.originalWidth}x${item.originalHeight}mm ${item.rotated ? '(rotated)' : ''}"
             role="img" aria-label="Item ${item.originalId}, ${item.originalWidth}x${item.originalHeight}mm">
          ${width > 5 && height > 5 ? '<span class="truncate">' + item.originalId + '</span>' : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="plate-viz-container">
        <div class="plate-visualization" style="padding-bottom: ${aspectRatio * 100}%;">
          ${items}
        </div>
        <div class="plate-info">
          <p><b>Efficiency:</b> ${plate.getEfficiency()}%</p>
          <p><b>Items on Plate:</b> ${plate.items.length}</p>
        </div>
      </div>
    `;
  };

  Optimizer2DManager.prototype.prevPlate = function() {
    if (this.currentPlateIndex > 0) {
      this.currentPlateIndex--;
      this.updatePlateVisualization();
    }
  };

  Optimizer2DManager.prototype.nextPlate = function() {
    if (this.currentPlateIndex < this.result.plates.length - 1) {
      this.currentPlateIndex++;
      this.updatePlateVisualization();
    }
  };

  Optimizer2DManager.prototype.updatePlateVisualization = function() {
    var container = document.getElementById('plate-visualization-container');
    if (container) {
      container.innerHTML = this.renderPlateVisualization();
    }

    var counter = document.querySelector('.nav-counter');
    if (counter) {
      counter.textContent = 'Plate ' + (this.currentPlateIndex + 1) + ' of ' + this.result.plates.length;
    }

    var prevBtn = document.getElementById('prev-plate-2d');
    var nextBtn = document.getElementById('next-plate-2d');
    if (prevBtn) prevBtn.disabled = this.currentPlateIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentPlateIndex === this.result.plates.length - 1;
  };

  Optimizer2DManager.prototype.backToForm = function() {
    var formContainer = document.getElementById('optimizer-2d-form');
    var resultsContainer = document.getElementById('optimizer-2d-results');
    
    if (formContainer) formContainer.classList.remove('hidden');
    if (resultsContainer) resultsContainer.classList.add('hidden');
    
    this.result = null;
    this.formData = null;
    this.currentPlateIndex = 0;
    this.itemColors.clear();
    
    // Scroll to form
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  Optimizer2DManager.prototype.exportToPDF = function() {
    if (!this.result || !this.formData) {
      this.showError('No results to export');
      return;
    }
    
    try {
      if (typeof window.export2DToPDF === 'function') {
        window.export2DToPDF(this.result, this.formData, this.itemColors);
        
        // Announce to screen readers
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
  Optimizer2DManager.prototype.setLoading = function(loading) {
    var overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.toggle('hidden', !loading);
    }
    
    // Also set button loading state
    var optimizeBtn = document.getElementById('optimize-2d');
    if (optimizeBtn) {
      if (loading) {
        optimizeBtn.classList.add('btn-loading');
        optimizeBtn.disabled = true;
      } else {
        optimizeBtn.classList.remove('btn-loading');
        optimizeBtn.disabled = false;
      }
    }
  };

  Optimizer2DManager.prototype.showError = function(message) {
    // Use App's showError method if available
    if (window.App && typeof window.App.showError === 'function') {
      window.App.showError(message, 'optimizer-2d-form');
      return;
    }
    
    // Fallback error display
    var container = document.getElementById('optimizer-2d-form');
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
  };

  // ============================================================================
  // INITIALIZATION & GLOBAL EXPORT
  // ============================================================================

  // Export classes to global scope
  window.PlateOptimizer2D = PlateOptimizer2D;
  window.Plate2D = Plate2D;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Check if we're on the 2D page
      if (document.getElementById('optimizer-2d-form')) {
        window.optimizer2D = new Optimizer2DManager();
        console.log('✅ 2D Optimizer initialized - Undo/Redo not implemented');
      }
    });
  } else {
    if (document.getElementById('optimizer-2d-form')) {
      window.optimizer2D = new Optimizer2DManager();
      console.log('✅ 2D Optimizer initialized - Undo/Redo not implemented');
    }
  }

  console.log('✅ 2D Optimizer script loaded - With global exports, no undo/redo');
})(window, document);