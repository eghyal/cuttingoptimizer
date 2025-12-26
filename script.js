// ============================================
// ENHANCED CUTTING OPTIMIZER - CLEAN & MODULAR
// Optimized for performance, readability, and maintainability
// ============================================

// ============================================
// CORE UTILITIES - IMPROVED
// ============================================

const AppUtils = {
    // Color palette for visualizations
    colors: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316',
        '#ef4444', '#0ea5e9', '#14b8a6', '#a855f7'
    ],

    // Show error message with auto-hide
    showError(containerId, message, duration = 5000) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.textContent = message;
        container.classList.remove('hidden');
        
        // Scroll to error smoothly
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => container.classList.add('hidden'), duration);
        }
    },

    // Show loading state
    showLoading(buttonId, textId, spinnerId) {
        const button = document.getElementById(buttonId);
        const text = document.getElementById(textId);
        const spinner = document.getElementById(spinnerId);
        
        if (button) {
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
        }
        if (text) text.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
    },

    // Hide loading state
    hideLoading(buttonId, textId, spinnerId) {
        const button = document.getElementById(buttonId);
        const text = document.getElementById(textId);
        const spinner = document.getElementById(spinnerId);
        
        if (button) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
        }
        if (text) text.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
    },

    // Format number with thousand separators (integer only)
    formatNumber(num) {
        if (isNaN(num) || num === null || num === undefined) return '0';
        return Math.round(parseFloat(num)).toLocaleString('en-US');
    },

    // Create stats card HTML
    createStatsCard(title, value, unit = '') {
        const formattedValue = unit ? `${this.formatNumber(value)} ${unit}` : this.formatNumber(value);
        return `
            <div class="stat-card" role="region" aria-label="${title} statistic">
                <div class="stat-value" aria-live="polite">${formattedValue}</div>
                <div class="stat-label">${title}${unit ? ` ${unit}` : ''}</div>
            </div>
        `;
    },

    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validate number input
    validateNumber(input, min = 0, max = Infinity) {
        const value = parseFloat(input);
        return !isNaN(value) && value >= min && value <= max;
    },

    // Generate unique ID
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Safe get element
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) console.warn(`Element with ID "${id}" not found`);
        return element;
    }
};

// ============================================
// 1D OPTIMIZER MODULE - MODERNIZED
// ============================================

class OneDOptimizer {
    constructor() {
        this.currentResult = null;
        this.currentBarIndex = 0;
        this.itemColors = new Map();
        this.init();
    }

    init() {
        // DOM Elements
        this.elements = {
            addItemBtn: AppUtils.getElement('addItemBtn1D'),
            cutListContainer: AppUtils.getElement('cutListContainer1D'),
            optimizeBtn: AppUtils.getElement('optimizeBtn1D'),
            resultsContainer: AppUtils.getElement('resultsContainer1D'),
            emptyResults: AppUtils.getElement('emptyResults1D'),
            errorContainer: AppUtils.getElement('error1D'),
            summaryStats: AppUtils.getElement('summaryStats1D'),
            barCounter: AppUtils.getElement('barCounter1D'),
            prevBarBtn: AppUtils.getElement('prevBarBtn1D'),
            nextBarBtn: AppUtils.getElement('nextBarBtn1D'),
            barDetails: AppUtils.getElement('barDetails1D'),
            exportPdfBtn: AppUtils.getElement('exportPdfBtn1D'),
            form: AppUtils.getElement('optimizerForm1D')
        };

        // Initialize if elements exist
        if (this.elements.cutListContainer) {
            this.setupEventListeners();
            this.addInitialItem();
        }
    }

    setupEventListeners() {
        // Add item button
        if (this.elements.addItemBtn) {
            this.elements.addItemBtn.addEventListener('click', () => this.addItemRow());
        }

        // Optimize button
        if (this.elements.optimizeBtn) {
            this.elements.optimizeBtn.addEventListener('click', (e) => this.handleOptimize(e));
        }

        // Navigation buttons
        if (this.elements.prevBarBtn) {
            this.elements.prevBarBtn.addEventListener('click', () => this.navigateBar(-1));
        }

        if (this.elements.nextBarBtn) {
            this.elements.nextBarBtn.addEventListener('click', () => this.navigateBar(1));
        }

        // PDF Export
        if (this.elements.exportPdfBtn) {
            this.elements.exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        }

        // Form submission
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleOptimize(e);
            });
        }
    }

    addItemRow(item = { id: '', length: '', quantity: 1 }) {
        const row = document.createElement('div');
        row.className = 'cut-list-input-group';
        row.innerHTML = `
            <input type="text" name="itemId[]" placeholder="ID" value="${item.id || ''}" 
                   class="w-full" aria-label="Item ID">
            <input type="number" name="itemLength[]" placeholder="Length" min="1" step="1" 
                   value="${item.length || ''}" class="w-full" aria-label="Item length in millimeters">
            <input type="number" name="itemQuantity[]" placeholder="Qty" min="1" step="1" 
                   value="${item.quantity || 1}" class="w-full" aria-label="Item quantity">
            <button type="button" class="remove-item-btn btn" 
                    style="background-color: #fee2e2; color: #991b1b; border-color: #fecaca;"
                    aria-label="Remove this item">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        this.elements.cutListContainer.appendChild(row);
        
        // Add remove event listener
        const removeBtn = row.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', () => row.remove());
        
        return row;
    }

    addInitialItem() {
        if (this.elements.cutListContainer.children.length === 0) {
            this.addItemRow({ id: 'A', length: '1000', quantity: 2 });
        }
    }

    getFormData() {
        const materialLength = parseInt(AppUtils.getElement('materialLength').value) || 6000;
        const kerfWidth = parseInt(AppUtils.getElement('kerfWidth').value) || 0;
        const algorithm = AppUtils.getElement('algorithm').value;
        
        const items = [];
        const itemRows = this.elements.cutListContainer.querySelectorAll('.cut-list-input-group');
        
        itemRows.forEach(row => {
            const id = row.querySelector('input[name="itemId[]"]').value.trim() || 'Item';
            const length = parseInt(row.querySelector('input[name="itemLength[]"]').value) || 0;
            const quantity = parseInt(row.querySelector('input[name="itemQuantity[]"]').value) || 1;
            
            if (length > 0 && quantity > 0) {
                items.push({ 
                    id, 
                    length: Math.round(length + kerfWidth),
                    originalLength: Math.round(length),
                    quantity 
                });
            }
        });
        
        return { materialLength, kerfWidth, algorithm, items };
    }

    validateInputs(data) {
        const { materialLength, kerfWidth, items } = data;
        
        if (items.length === 0) {
            throw new Error("Please add at least one item to optimize.");
        }
        
        if (materialLength <= 0) {
            throw new Error("Material length must be greater than 0.");
        }
        
        items.forEach(item => {
            if (item.length <= 0) {
                throw new Error(`Item "${item.id}" has invalid length.`);
            }
            
            if (item.quantity <= 0) {
                throw new Error(`Item "${item.id}" has invalid quantity.`);
            }
            
            if (item.length > materialLength) {
                throw new Error(`Item "${item.id}" (${item.originalLength}mm + ${kerfWidth}mm kerf) exceeds material length of ${materialLength}mm.`);
            }
        });
        
        return true;
    }

    async handleOptimize(event) {
        event.preventDefault();
        
        try {
            const data = this.getFormData();
            this.validateInputs(data);
            
            // Show loading
            AppUtils.showLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
            this.elements.errorContainer.classList.add('hidden');
            
            // Run optimization with slight delay for UI feedback
            setTimeout(() => {
                try {
                    const optimizer = new CuttingOptimizer1D(data.algorithm);
                    const result = optimizer.optimize(data.items, data.materialLength);
                    
                    this.displayResults(result, data);
                    
                } catch (error) {
                    AppUtils.hideLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
                    AppUtils.showError('error1D', error.message || 'Optimization failed. Please check your inputs.');
                }
            }, 50);
            
        } catch (error) {
            AppUtils.hideLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
            AppUtils.showError('error1D', error.message);
        }
    }

    updateItemColors(bars) {
        const uniqueIds = new Set();
        bars.forEach(bar => {
            bar.items.forEach(item => {
                uniqueIds.add(item.originalId);
            });
        });

        const sortedIds = Array.from(uniqueIds).sort();
        const newColors = new Map();
        sortedIds.forEach((id, i) => {
            newColors.set(id, AppUtils.colors[i % AppUtils.colors.length]);
        });
        this.itemColors = newColors;
    }

    displayResults(result, formData) {
        this.currentResult = result;
        this.currentBarIndex = 0;
        
        // Ensure integer values
        result.overallEfficiency = Math.round(result.overallEfficiency || 0);
        result.totalWaste = Math.round(result.totalWaste || 0);
        result.totalUsedLength = Math.round(result.totalUsedLength || 0);
        
        // Show results container
        this.elements.resultsContainer.classList.remove('hidden');
        this.elements.emptyResults.classList.add('hidden');
        
        // Update summary stats
        const totalWaste = result.totalWaste || 0;
        const totalMaterialLength = result.totalUsedLength + totalWaste;
        const wastePercentage = totalMaterialLength > 0 ? 
            Math.round((totalWaste / totalMaterialLength) * 100) : 0;
        
        this.elements.summaryStats.innerHTML = `
            ${AppUtils.createStatsCard('Total Bars', result.totalBars)}
            ${AppUtils.createStatsCard('Efficiency', Math.round(result.overallEfficiency), '%')}
            ${AppUtils.createStatsCard('Total Waste', Math.round(totalWaste), 'mm')}
            ${AppUtils.createStatsCard('Time', Math.round(result.executionTime), 'ms')}
        `;
        
        // Update item colors
        this.updateItemColors(result.bars);
        
        // Display first bar
        this.displayBar(this.currentBarIndex, formData);
        
        // Update UI state
        this.updateUIState();
        
        // Scroll to results
        this.elements.resultsContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    displayBar(index, formData) {
        if (!this.currentResult || !this.currentResult.bars[index]) return;
        
        const bar = this.currentResult.bars[index];
        const materialLength = formData.materialLength;
        
        // Ensure integer values
        bar.efficiency = Math.round(bar.efficiency || 0);
        bar.remainingLength = Math.round(bar.remainingLength || 0);
        bar.usedLength = Math.round(bar.usedLength || 0);
        
        // Create bar visualization
        let visualization = '';
        let totalUsed = 0;
        
        bar.items.forEach((item) => {
            const originalLength = Math.round(item.originalLength);
            const widthPercentage = (originalLength / materialLength) * 100;
            const color = this.itemColors.get(item.originalId) || AppUtils.colors[0];
            totalUsed += originalLength;
            
            visualization += `
                <div class="bar-segment" 
                     style="width: ${widthPercentage}%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 0 1px rgba(0,0,0,0.2);"
                     title="${item.originalId}: ${originalLength}mm"
                     aria-label="${item.originalId} segment, ${originalLength} millimeters">
                    <div class="segment-content">
                        ${widthPercentage > 8 ? `<span class="segment-length">${originalLength}mm</span>` : ''}
                        ${widthPercentage > 15 ? `<span class="segment-id">${item.originalId}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        // Add waste segment
        if (bar.remainingLength > 0) {
            const wastePercentage = (bar.remainingLength / materialLength) * 100;
            visualization += `
                <div class="bar-segment" 
                     style="width: ${wastePercentage}%; background-color: #e5e7eb; border: 1px solid #d1d5db;"
                     title="Waste: ${Math.round(bar.remainingLength)}mm"
                     aria-label="Waste segment, ${Math.round(bar.remainingLength)} millimeters">
                    <div class="segment-content">
                        ${wastePercentage > 8 ? `<span class="segment-waste">Waste: ${Math.round(bar.remainingLength)}mm</span>` : ''}
                    </div>
                </div>`;
        }
        
        // Create items list
        let itemsList = '';
        bar.items.forEach(item => {
            const color = this.itemColors.get(item.originalId) || AppUtils.colors[0];
            const originalLength = Math.round(item.originalLength);
            itemsList += `
                <div class="bar-item-row" aria-label="${item.originalId} item, ${originalLength} millimeters">
                    <div class="flex items-center">
                        <span class="item-color-indicator" style="background-color: ${color}; border: 1px solid rgba(0,0,0,0.2);"></span>
                        <span class="text-sm text-gray-700">${item.originalId}</span>
                    </div>
                    <div class="text-sm text-gray-600">${originalLength} mm</div>
                </div>
            `;
        });
        
        // Update bar details
        this.elements.barDetails.innerHTML = `
            <div class="bar-info">
                <div>
                    <span class="font-medium text-gray-700">Efficiency:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.efficiency}%</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Waste:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.remainingLength} mm</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Used:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.usedLength} mm</span>
                </div>
            </div>
            
            <div class="bar-visualization-container">
                <div class="bar-visualization" role="img" aria-label="Bar visualization with ${bar.items.length} items">
                    ${visualization}
                </div>
                <div class="bar-total">
                    <span>Total Length: ${AppUtils.formatNumber(materialLength)}mm | Used: ${AppUtils.formatNumber(totalUsed)}mm</span>
                </div>
            </div>
            
            <div class="bar-items-list">
                <h5 class="font-medium text-gray-700 mb-2">Items on this bar (${bar.items.length}):</h5>
                ${itemsList}
            </div>
        `;
        
        // Update counter
        this.elements.barCounter.textContent = `Bar ${index + 1} of ${this.currentResult.bars.length}`;
    }

    navigateBar(direction) {
        const newIndex = this.currentBarIndex + direction;
        if (newIndex >= 0 && newIndex < this.currentResult.bars.length) {
            this.currentBarIndex = newIndex;
            this.displayBar(this.currentBarIndex, this.getFormData());
            this.updateNavigationButtons();
        }
    }

    updateNavigationButtons() {
        if (!this.currentResult) return;
        
        if (this.elements.prevBarBtn) {
            this.elements.prevBarBtn.disabled = this.currentBarIndex === 0;
            this.elements.prevBarBtn.setAttribute('aria-disabled', this.currentBarIndex === 0);
        }
        
        if (this.elements.nextBarBtn) {
            this.elements.nextBarBtn.disabled = this.currentBarIndex === this.currentResult.bars.length - 1;
            this.elements.nextBarBtn.setAttribute('aria-disabled', this.currentBarIndex === this.currentResult.bars.length - 1);
        }
    }

    updateUIState() {
        this.updateNavigationButtons();
        AppUtils.hideLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
    }

    async exportToPDF() {
        if (!this.currentResult) {
            AppUtils.showError('error1D', 'Please run optimization first before exporting.');
            return;
        }
        
        try {
            AppUtils.showLoading('exportPdfBtn1D', 'exportText1D', 'exportSpinner1D');
            
            const formData = this.getFormData();
            
            // Ensure PDF functions are available
            if (typeof window.export1DToPDF !== 'function') {
                throw new Error('PDF export functions not loaded');
            }
            
            // Export PDF
            await window.export1DToPDF(this.currentResult, formData, this.itemColors);
            
        } catch (error) {
            console.error('1D PDF Export Error:', error);
            AppUtils.showError('error1D', `PDF Export Failed: ${error.message}`);
        } finally {
            AppUtils.hideLoading('exportPdfBtn1D', 'exportText1D', 'exportSpinner1D');
        }
    }
}

// ============================================
// 2D OPTIMIZER MODULE - MODERNIZED
// ============================================

class TwoDOptimizer {
    constructor() {
        this.currentResult = null;
        this.currentPlateIndex = 0;
        this.itemColors = new Map();
        this.init();
    }

    init() {
        // DOM Elements
        this.elements = {
            addItemBtn: AppUtils.getElement('addItemBtn2D'),
            cutListContainer: AppUtils.getElement('cutListContainer2D'),
            optimizeBtn: AppUtils.getElement('optimizeBtn2D'),
            resultsContainer: AppUtils.getElement('resultsContainer2D'),
            emptyResults: AppUtils.getElement('emptyResults2D'),
            errorContainer: AppUtils.getElement('error2D'),
            summaryStats: AppUtils.getElement('summaryStats2D'),
            plateCounter: AppUtils.getElement('plateCounter2D'),
            prevPlateBtn: AppUtils.getElement('prevPlateBtn2D'),
            nextPlateBtn: AppUtils.getElement('nextPlateBtn2D'),
            plateDetails: AppUtils.getElement('plateDetails2D'),
            exportPdfBtn: AppUtils.getElement('exportPdfBtn2D')
        };

        // Initialize if elements exist
        if (this.elements.cutListContainer) {
            this.setupEventListeners();
            this.addInitialItem();
        }
    }

    setupEventListeners() {
        // Add item button
        if (this.elements.addItemBtn) {
            this.elements.addItemBtn.addEventListener('click', () => this.addItemRow());
        }

        // Optimize button
        if (this.elements.optimizeBtn) {
            this.elements.optimizeBtn.addEventListener('click', (e) => this.handleOptimize(e));
        }

        // Navigation buttons
        if (this.elements.prevPlateBtn) {
            this.elements.prevPlateBtn.addEventListener('click', () => this.navigatePlate(-1));
        }

        if (this.elements.nextPlateBtn) {
            this.elements.nextPlateBtn.addEventListener('click', () => this.navigatePlate(1));
        }

        // PDF Export
        if (this.elements.exportPdfBtn) {
            this.elements.exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        }
    }

    addItemRow(item = { id: '', width: '', height: '', quantity: 1, rotation: true }) {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <!-- Row 1: Item ID -->
            <div class="item-id-row">
                <input type="text" name="itemId[]" placeholder="Item ID" value="${item.id || ''}" 
                       class="w-full" aria-label="Item ID">
            </div>
            
            <!-- Row 2: Dimensions and Quantity -->
            <div class="item-dimensions-row">
                <div class="dimension-input">
                    <label>Width (mm)</label>
                    <input type="number" name="itemWidth[]" min="1" step="1" 
                           value="${item.width || ''}" class="w-full" aria-label="Item width">
                </div>
                <div class="dimension-input">
                    <label>Height (mm)</label>
                    <input type="number" name="itemHeight[]" min="1" step="1" 
                           value="${item.height || ''}" class="w-full" aria-label="Item height">
                </div>
                <div class="dimension-input">
                    <label>Quantity</label>
                    <input type="number" name="itemQuantity[]" min="1" step="1" 
                           value="${item.quantity || 1}" class="w-full" aria-label="Item quantity">
                </div>
            </div>
            
            <!-- Row 3: Rotation and Remove Button -->
            <div class="item-actions-row">
                <div class="rotation-checkbox">
                    <input type="checkbox" name="itemRotation[]" ${item.rotation ? 'checked' : ''} 
                           id="rot-${AppUtils.generateId()}" aria-label="Allow rotation">
                    <span class="text-sm text-gray-600">Allow Rotation</span>
                </div>
                <button type="button" class="remove-item-btn" aria-label="Remove this item">
                    <i class="fas fa-trash"></i>
                    Remove
                </button>
            </div>
        `;
        
        this.elements.cutListContainer.appendChild(row);
        
        // Add remove event listener
        const removeBtn = row.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', () => row.remove());
        
        return row;
    }

    addInitialItem() {
        if (this.elements.cutListContainer.children.length === 0) {
            this.addItemRow({ 
                id: 'A', 
                width: '500', 
                height: '300', 
                quantity: 2, 
                rotation: true 
            });
        }
    }

    getFormData() {
        const plateWidth = parseInt(AppUtils.getElement('plateWidth').value) || 2440;
        const plateHeight = parseInt(AppUtils.getElement('plateHeight').value) || 1220;
        const kerfWidth = parseInt(AppUtils.getElement('kerfWidth2d').value) || 0;
        const algorithm = AppUtils.getElement('algorithm2d').value;
        
        const items = [];
        const itemRows = this.elements.cutListContainer.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const id = row.querySelector('input[name="itemId[]"]').value.trim() || 'Item';
            const width = parseInt(row.querySelector('input[name="itemWidth[]"]').value) || 0;
            const height = parseInt(row.querySelector('input[name="itemHeight[]"]').value) || 0;
            const quantity = parseInt(row.querySelector('input[name="itemQuantity[]"]').value) || 1;
            const rotation = row.querySelector('input[name="itemRotation[]"]').checked;
            
            if (width > 0 && height > 0 && quantity > 0) {
                items.push({ 
                    id, 
                    width: Math.round(width + kerfWidth),
                    height: Math.round(height + kerfWidth),
                    originalWidth: Math.round(width),
                    originalHeight: Math.round(height),
                    quantity,
                    rotation 
                });
            }
        });
        
        return { plateWidth, plateHeight, kerfWidth, algorithm, items };
    }

    validateInputs(data) {
        const { plateWidth, plateHeight, kerfWidth, items } = data;
        
        if (items.length === 0) {
            throw new Error("Please add at least one item to optimize.");
        }
        
        if (plateWidth <= 0 || plateHeight <= 0) {
            throw new Error("Plate dimensions must be greater than 0.");
        }
        
        items.forEach(item => {
            if (item.width <= 0 || item.height <= 0) {
                throw new Error(`Item "${item.id}" has invalid dimensions.`);
            }
            
            if (item.quantity <= 0) {
                throw new Error(`Item "${item.id}" has invalid quantity.`);
            }
            
            const maxDimension = Math.max(item.width, item.height);
            if (maxDimension > Math.max(plateWidth, plateHeight)) {
                throw new Error(`Item "${item.id}" is too large for the plate.`);
            }
        });
        
        return true;
    }

    async handleOptimize(event) {
        event.preventDefault();
        
        try {
            const data = this.getFormData();
            this.validateInputs(data);
            
            // Show loading
            AppUtils.showLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
            this.elements.errorContainer.classList.add('hidden');
            
            // Run optimization
            setTimeout(() => {
                try {
                    const optimizer = new PlateOptimizer2D(data.algorithm);
                    const result = optimizer.optimize(data.items, data.plateWidth, data.plateHeight);
                    
                    this.displayResults(result, data);
                    
                } catch (error) {
                    AppUtils.hideLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
                    AppUtils.showError('error2D', error.message || 'Optimization failed.');
                }
            }, 50);
            
        } catch (error) {
            AppUtils.hideLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
            AppUtils.showError('error2D', error.message);
        }
    }

    updateItemColors(plates) {
        const uniqueIds = new Set();
        plates.forEach(plate => {
            plate.items.forEach(item => {
                uniqueIds.add(item.originalId);
            });
        });

        const sortedIds = Array.from(uniqueIds).sort();
        const newColors = new Map();
        sortedIds.forEach((id, i) => {
            newColors.set(id, AppUtils.colors[i % AppUtils.colors.length]);
        });
        this.itemColors = newColors;
    }

    displayResults(result, formData) {
        this.currentResult = result;
        this.currentPlateIndex = 0;
        
        // Ensure integer values
        result.overallEfficiency = Math.round(result.overallEfficiency || 0);
        result.totalUsedArea = Math.round(result.totalUsedArea || 0);
        result.unplacedItems = Math.round(result.unplacedItems || 0);
        
        // Show results container
        this.elements.resultsContainer.classList.remove('hidden');
        this.elements.emptyResults.classList.add('hidden');
        
        // Calculate statistics
        const totalPlates = result.totalPlates || 0;
        const totalUsedArea = result.totalUsedArea || 0;
        const totalPlateArea = totalPlates * formData.plateWidth * formData.plateHeight;
        const totalWasteArea = Math.max(0, totalPlateArea - totalUsedArea);
        
        // Update summary stats
        this.elements.summaryStats.innerHTML = `
            ${AppUtils.createStatsCard('Total Plates', totalPlates)}
            ${AppUtils.createStatsCard('Efficiency', Math.round(result.overallEfficiency), '%')}
            ${AppUtils.createStatsCard('Waste Area', Math.round(totalWasteArea / 1000000), 'm²')}
            ${AppUtils.createStatsCard('Unplaced Items', result.unplacedItems)}
        `;
        
        // Update item colors
        this.updateItemColors(result.plates);
        
        // Display first plate
        this.displayPlate(this.currentPlateIndex, formData);
        
        // Update UI state
        this.updateUIState();
        
        // Scroll to results
        this.elements.resultsContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    displayPlate(index, formData) {
        if (!this.currentResult || !this.currentResult.plates[index]) return;
        
        const plate = this.currentResult.plates[index];
        const { plateWidth, plateHeight, kerfWidth } = formData;
        
        // Calculate plate statistics
        const efficiency = plate.getEfficiency ? Math.round(plate.getEfficiency()) : 
                         Math.round(plate.efficiency || 0);
        const wasteArea = plate.getWasteArea ? Math.round(plate.getWasteArea()) : 
                         Math.round(plate.wasteArea || 0);
        
        // Create plate visualization
        let visualization = '';
        
        plate.items.forEach(item => {
            const left = (item.x / plateWidth) * 100;
            const top = (item.y / plateHeight) * 100;
            const width = (item.width / plateWidth) * 100;
            const height = (item.height / plateHeight) * 100;
            const color = this.itemColors.get(item.originalId) || AppUtils.colors[0];
            const actualWidth = Math.round(item.originalWidth - kerfWidth);
            const actualHeight = Math.round(item.originalHeight - kerfWidth);
            
            visualization += `
                <div class="plate-item" 
                     style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; 
                            background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 0 1px rgba(0,0,0,0.3);"
                     title="${item.originalId}: ${actualWidth}×${actualHeight}mm${item.rotated ? ' (Rotated)' : ''}"
                     aria-label="${item.originalId} item, ${actualWidth} by ${actualHeight} millimeters${item.rotated ? ', rotated' : ''}">
                    <div class="plate-item-content">
                        ${width > 8 && height > 8 ? 
                            `<span class="plate-item-id">${item.originalId}</span>` : ''}
                        ${width > 15 && height > 12 ? 
                            `<span class="plate-item-dimensions">${actualWidth}×${actualHeight}</span>` : ''}
                        ${item.rotated && width > 5 && height > 5 ? 
                            `<span class="plate-item-rotated" aria-label="Rotated">R</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        // Create items list
        let itemsList = '';
        plate.items.forEach(item => {
            const color = this.itemColors.get(item.originalId) || AppUtils.colors[0];
            const actualWidth = Math.round(item.originalWidth - kerfWidth);
            const actualHeight = Math.round(item.originalHeight - kerfWidth);
            
            itemsList += `
                <div class="plate-item-row" aria-label="${item.originalId} item, ${actualWidth} by ${actualHeight} millimeters">
                    <div class="flex items-center">
                        <span class="item-color-indicator" style="background-color: ${color}; border: 1px solid rgba(0,0,0,0.2);"></span>
                        <span class="text-sm text-gray-700">${item.originalId}</span>
                        ${item.rotated ? '<span class="rotated-indicator" aria-label="Rotated">(Rotated)</span>' : ''}
                    </div>
                    <div class="text-sm text-gray-600">${actualWidth} × ${actualHeight} mm</div>
                </div>
            `;
        });
        
        // Update plate details
        this.elements.plateDetails.innerHTML = `
            <div class="plate-info">
                <div>
                    <span class="font-medium text-gray-700">Efficiency:</span>
                    <span class="ml-2 font-semibold text-gray-900">${efficiency}%</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Waste Area:</span>
                    <span class="ml-2 font-semibold text-gray-900">${AppUtils.formatNumber(wasteArea)} mm²</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Items:</span>
                    <span class="ml-2 font-semibold text-gray-900">${plate.items.length}</span>
                </div>
            </div>
            
            <div class="plate-visual-container" role="img" aria-label="Plate visualization with ${plate.items.length} items">
                ${visualization}
                <div class="plate-dimensions" aria-label="Plate dimensions">
                    ${AppUtils.formatNumber(plateWidth)} × ${AppUtils.formatNumber(plateHeight)} mm
                </div>
            </div>
            
            <div class="plate-items-list">
                <h5 class="font-medium text-gray-700 mb-2">Items on this plate (${plate.items.length}):</h5>
                ${itemsList}
            </div>
        `;
        
        // Update counter
        this.elements.plateCounter.textContent = `Plate ${index + 1} of ${this.currentResult.plates.length}`;
    }

    navigatePlate(direction) {
        const newIndex = this.currentPlateIndex + direction;
        if (newIndex >= 0 && newIndex < this.currentResult.plates.length) {
            this.currentPlateIndex = newIndex;
            this.displayPlate(this.currentPlateIndex, this.getFormData());
            this.updateNavigationButtons();
        }
    }

    updateNavigationButtons() {
        if (!this.currentResult) return;
        
        if (this.elements.prevPlateBtn) {
            this.elements.prevPlateBtn.disabled = this.currentPlateIndex === 0;
            this.elements.prevPlateBtn.setAttribute('aria-disabled', this.currentPlateIndex === 0);
        }
        
        if (this.elements.nextPlateBtn) {
            this.elements.nextPlateBtn.disabled = this.currentPlateIndex === this.currentResult.plates.length - 1;
            this.elements.nextPlateBtn.setAttribute('aria-disabled', this.currentPlateIndex === this.currentResult.plates.length - 1);
        }
    }

    updateUIState() {
        this.updateNavigationButtons();
        AppUtils.hideLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
    }

    async exportToPDF() {
        if (!this.currentResult) {
            AppUtils.showError('error2D', 'Please run optimization first before exporting.');
            return;
        }
        
        try {
            AppUtils.showLoading('exportPdfBtn2D', 'exportText2D', 'exportSpinner2D');
            
            const formData = this.getFormData();
            
            // Ensure PDF functions are available
            if (typeof window.export2DToPDF !== 'function') {
                throw new Error('PDF export functions not loaded');
            }
            
            // Export PDF
            await window.export2DToPDF(this.currentResult, formData, this.itemColors);
            
        } catch (error) {
            console.error('2D PDF Export Error:', error);
            AppUtils.showError('error2D', `PDF Export Failed: ${error.message}`);
        } finally {
            AppUtils.hideLoading('exportPdfBtn2D', 'exportText2D', 'exportSpinner2D');
        }
    }
}

// ============================================
// CUSTOM OPTIMIZER MODULE - MODERNIZED
// ============================================

class CustomOptimizerModule {
    constructor() {
        this.currentResult = null;
        this.currentBarIndex = 0;
        this.itemColors = new Map();
        this.init();
    }

    init() {
        // DOM Elements
        this.elements = {
            optimizeBtn: AppUtils.getElement('optimizeBtnCustom'),
            resultsContainer: AppUtils.getElement('resultsContainerCustom'),
            emptyResults: AppUtils.getElement('emptyResultsCustom'),
            errorContainer: AppUtils.getElement('errorCustom'),
            summaryStats: AppUtils.getElement('summaryStatsCustom'),
            barCounter: AppUtils.getElement('barCounterCustom'),
            prevBarBtn: AppUtils.getElement('prevBarBtnCustom'),
            nextBarBtn: AppUtils.getElement('nextBarBtnCustom'),
            barDetails: AppUtils.getElement('barDetailsCustom'),
            exportPdfBtn: AppUtils.getElement('exportPdfBtnCustom'),
            form: AppUtils.getElement('optimizerFormCustom')
        };

        // Form inputs
        this.inputs = {
            smallRingA: AppUtils.getElement('smallRingA'),
            bigRingA: AppUtils.getElement('bigRingA'),
            smallRingB: AppUtils.getElement('smallRingB'),
            bigRingB: AppUtils.getElement('bigRingB'),
            multiplier: AppUtils.getElement('multiplier'),
            kerfWidth: AppUtils.getElement('kerfWidthCustom'),
            algorithm: AppUtils.getElement('algorithmCustom')
        };

        // Initialize if elements exist
        if (this.elements.optimizeBtn) {
            this.setupEventListeners();
            this.initializeSampleData();
        }
    }

    setupEventListeners() {
        // Optimize button
        if (this.elements.optimizeBtn) {
            this.elements.optimizeBtn.addEventListener('click', (e) => this.handleOptimize(e));
        }

        // Navigation buttons
        if (this.elements.prevBarBtn) {
            this.elements.prevBarBtn.addEventListener('click', () => this.navigateBar(-1));
        }

        if (this.elements.nextBarBtn) {
            this.elements.nextBarBtn.addEventListener('click', () => this.navigateBar(1));
        }

        // PDF Export
        if (this.elements.exportPdfBtn) {
            this.elements.exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        }

        // Form submission
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleOptimize(e);
            });
        }
    }

    initializeSampleData() {
        // Set default values for FF-CA-01
        setTimeout(() => {
            if (this.inputs.smallRingA) this.inputs.smallRingA.value = 100;
            if (this.inputs.bigRingA) this.inputs.bigRingA.value = 200;
            if (this.inputs.smallRingB) this.inputs.smallRingB.value = 120;
            if (this.inputs.bigRingB) this.inputs.bigRingB.value = 220;
            if (this.inputs.multiplier) this.inputs.multiplier.value = 1;
            if (this.inputs.kerfWidth) this.inputs.kerfWidth.value = 2;
        }, 100);
    }

    getFormData() {
        return {
            smallRingA: parseInt(this.inputs.smallRingA.value) || 0,
            bigRingA: parseInt(this.inputs.bigRingA.value) || 0,
            smallRingB: parseInt(this.inputs.smallRingB.value) || 0,
            bigRingB: parseInt(this.inputs.bigRingB.value) || 0,
            multiplier: parseInt(this.inputs.multiplier.value) || 1,
            kerfWidth: parseInt(this.inputs.kerfWidth.value) || 0,
            algorithm: this.inputs.algorithm.value,
            materialLength: 6000 // Fixed for FF-CA-01
        };
    }

    validateInputs(data) {
        const { smallRingA, bigRingA, smallRingB, bigRingB, multiplier } = data;
        
        if (multiplier <= 0) {
            throw new Error("Multiplier must be greater than 0.");
        }
        
        // Check if at least one pattern is fully defined
        const patternAValid = smallRingA > 0 && bigRingA > 0;
        const patternBValid = smallRingB > 0 && bigRingB > 0;
        
        if (!patternAValid && !patternBValid) {
            throw new Error("Please enter dimensions for at least one pattern.");
        }
        
        // Validate individual patterns if provided
        if (smallRingA > 0 !== bigRingA > 0) {
            throw new Error("Pattern A requires both Small Ring and Big Ring dimensions.");
        }
        
        if (smallRingB > 0 !== bigRingB > 0) {
            throw new Error("Pattern B requires both Small Ring and Big Ring dimensions.");
        }
        
        return true;
    }

    generateCutList(params) {
        const items = [];
        const { smallRingA, bigRingA, smallRingB, bigRingB, multiplier, kerfWidth } = params;
        
        // Pattern A items
        if (smallRingA > 0 && bigRingA > 0) {
            items.push({
                id: 'A-Small',
                originalLength: smallRingA,
                length: smallRingA + kerfWidth,
                quantity: 4 * multiplier,
                pattern: 'A',
                type: 'small-ring'
            });
            
            items.push({
                id: 'A-Big',
                originalLength: bigRingA,
                length: bigRingA + kerfWidth,
                quantity: 4 * multiplier,
                pattern: 'A',
                type: 'big-ring'
            });
        }
        
        // Pattern B items
        if (smallRingB > 0 && bigRingB > 0) {
            items.push({
                id: 'B-Small',
                originalLength: smallRingB,
                length: smallRingB + kerfWidth,
                quantity: 4 * multiplier,
                pattern: 'B',
                type: 'small-ring'
            });
            
            items.push({
                id: 'B-Big',
                originalLength: bigRingB,
                length: bigRingB + kerfWidth,
                quantity: 4 * multiplier,
                pattern: 'B',
                type: 'big-ring'
            });
        }
        
        return items;
    }

    async handleOptimize(event) {
        event.preventDefault();
        
        try {
            const data = this.getFormData();
            this.validateInputs(data);
            
            // Show loading
            AppUtils.showLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
            this.elements.errorContainer.classList.add('hidden');
            
            // Run optimization
            setTimeout(() => {
                try {
                    const optimizer = new CustomOptimizer('ff-ca-01', data.algorithm);
                    const result = optimizer.optimizeFFCA01(data, data.materialLength);
                    
                    this.displayResults(result, data);
                    
                } catch (error) {
                    AppUtils.hideLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
                    AppUtils.showError('errorCustom', error.message || 'FF-CA-01 optimization failed.');
                }
            }, 50);
            
        } catch (error) {
            AppUtils.hideLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
            AppUtils.showError('errorCustom', error.message);
        }
    }

    updateItemColors(bars) {
        const uniqueIds = new Set();
        bars.forEach(bar => {
            bar.items.forEach(item => {
                uniqueIds.add(item.originalId);
            });
        });

        const sortedIds = Array.from(uniqueIds).sort();
        const newColors = new Map();
        sortedIds.forEach((id, i) => {
            newColors.set(id, AppUtils.colors[i % AppUtils.colors.length]);
        });
        this.itemColors = newColors;
    }

    displayResults(result, formData) {
        this.currentResult = result;
        this.currentBarIndex = 0;
        
        // Ensure integer values
        result.overallEfficiency = Math.round(result.overallEfficiency || 0);
        result.totalWaste = Math.round(result.totalWaste || 0);
        result.totalUsedLength = Math.round(result.totalUsedLength || 0);
        
        // Round bar data
        if (result.bars) {
            result.bars.forEach(bar => {
                bar.efficiency = Math.round(bar.efficiency || 0);
                bar.remainingLength = Math.round(bar.remainingLength || 0);
                bar.usedLength = Math.round(bar.usedLength || 0);
            });
        }
        
        // Show results container
        this.elements.resultsContainer.classList.remove('hidden');
        this.elements.emptyResults.classList.add('hidden');
        
        // Calculate statistics
        const totalWaste = result.totalWaste || 0;
        const totalUsedLength = result.totalUsedLength || 0;
        const totalMaterialLength = totalUsedLength + totalWaste;
        
        // Update summary stats
        let statsHTML = `
            ${AppUtils.createStatsCard('Total Bars', result.totalBars || 0)}
            ${AppUtils.createStatsCard('Efficiency', Math.round(result.overallEfficiency), '%')}
            ${AppUtils.createStatsCard('Total Waste', Math.round(totalWaste), 'mm')}
        `;
        
        // Add custom stats if available
        if (result.customStats) {
            statsHTML += AppUtils.createStatsCard('Total Cuts', result.customStats.totalCuts || 0);
        } else {
            statsHTML += AppUtils.createStatsCard('Material Used', Math.round(totalUsedLength / 1000), 'm');
        }
        
        this.elements.summaryStats.innerHTML = statsHTML;
        
        // Update item colors
        this.updateItemColors(result.bars);
        
        // Display first bar
        this.displayBar(this.currentBarIndex, formData);
        
        // Update UI state
        this.updateUIState();
        
        // Scroll to results
        this.elements.resultsContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    displayBar(index, formData) {
        if (!this.currentResult || !this.currentResult.bars || !this.currentResult.bars[index]) return;
        
        const bar = this.currentResult.bars[index];
        const materialLength = formData.materialLength || 6000;
        
        // Ensure integer values
        bar.efficiency = Math.round(bar.efficiency || 0);
        bar.remainingLength = Math.round(bar.remainingLength || 0);
        bar.usedLength = Math.round(bar.usedLength || 0);
        
        // Create bar visualization
        let visualization = '';
        let totalUsed = 0;
        
        bar.items.forEach(item => {
            const originalLength = Math.round(item.originalLength || 0);
            const widthPercentage = (originalLength / materialLength) * 100;
            const color = this.itemColors.get(item.originalId) || AppUtils.colors[0];
            totalUsed += originalLength;
            
            visualization += `
                <div class="bar-segment" 
                     style="width: ${widthPercentage}%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 0 1px rgba(0,0,0,0.2);"
                     title="${item.originalId}: ${originalLength}mm"
                     aria-label="${item.originalId} segment, ${originalLength} millimeters">
                    <div class="segment-content">
                        ${widthPercentage > 8 ? `<span class="segment-length">${originalLength}mm</span>` : ''}
                        ${widthPercentage > 15 ? `<span class="segment-id">${item.originalId}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        // Add waste segment
        if (bar.remainingLength > 0) {
            const wastePercentage = (bar.remainingLength / materialLength) * 100;
            visualization += `
                <div class="bar-segment" 
                     style="width: ${wastePercentage}%; background-color: #e5e7eb; border: 1px solid #d1d5db;"
                     title="Waste: ${Math.round(bar.remainingLength)}mm"
                     aria-label="Waste segment, ${Math.round(bar.remainingLength)} millimeters">
                    <div class="segment-content">
                        ${wastePercentage > 8 ? `<span class="segment-waste">Waste: ${Math.round(bar.remainingLength)}mm</span>` : ''}
                    </div>
                </div>`;
        }
        
        // Create items list
        let itemsList = '';
        bar.items.forEach(item => {
            const color = this.itemColors.get(item.originalId) || AppUtils.colors[0];
            const originalLength = Math.round(item.originalLength || 0);
            
            itemsList += `
                <div class="bar-item-row" aria-label="${item.originalId} item, ${originalLength} millimeters">
                    <div class="flex items-center">
                        <span class="item-color-indicator" style="background-color: ${color}; border: 1px solid rgba(0,0,0,0.2);"></span>
                        <span class="text-sm text-gray-700">${item.originalId}</span>
                    </div>
                    <div class="text-sm text-gray-600">${originalLength} mm</div>
                </div>
            `;
        });
        
        // Pattern statistics
        let patternStats = '';
        if (this.currentResult.customStats?.efficiencyByPattern) {
            const { A, B } = this.currentResult.customStats.efficiencyByPattern;
            patternStats = `
                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h6 class="font-medium text-gray-700 mb-2">Pattern Efficiency:</h6>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span class="text-gray-600">Pattern A:</span>
                            <span class="ml-2 font-semibold">${A.efficiency}%</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Pattern B:</span>
                            <span class="ml-2 font-semibold">${B.efficiency}%</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Update bar details
        this.elements.barDetails.innerHTML = `
            <div class="bar-info">
                <div>
                    <span class="font-medium text-gray-700">Efficiency:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.efficiency}%</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Waste:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.remainingLength} mm</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Pattern:</span>
                    <span class="ml-2 font-semibold text-gray-900">FF-CA-01</span>
                </div>
            </div>
            
            <div class="bar-visualization-container">
                <div class="bar-visualization" role="img" aria-label="FF-CA-01 bar visualization with ${bar.items.length} items">
                    ${visualization}
                </div>
                <div class="bar-total">
                    <span>Material: ${AppUtils.formatNumber(materialLength)}mm | Used: ${AppUtils.formatNumber(totalUsed)}mm</span>
                </div>
            </div>
            
            <div class="bar-items-list">
                <h5 class="font-medium text-gray-700 mb-2">Items on this bar (${bar.items.length}):</h5>
                ${itemsList}
            </div>
            
            ${patternStats}
        `;
        
        // Update counter
        this.elements.barCounter.textContent = `Bar ${index + 1} of ${this.currentResult.bars.length}`;
    }

    navigateBar(direction) {
        const newIndex = this.currentBarIndex + direction;
        if (this.currentResult && newIndex >= 0 && newIndex < this.currentResult.bars.length) {
            this.currentBarIndex = newIndex;
            this.displayBar(this.currentBarIndex, this.getFormData());
            this.updateNavigationButtons();
        }
    }

    updateNavigationButtons() {
        if (!this.currentResult) return;
        
        if (this.elements.prevBarBtn) {
            this.elements.prevBarBtn.disabled = this.currentBarIndex === 0;
            this.elements.prevBarBtn.setAttribute('aria-disabled', this.currentBarIndex === 0);
        }
        
        if (this.elements.nextBarBtn) {
            this.elements.nextBarBtn.disabled = this.currentBarIndex === this.currentResult.bars.length - 1;
            this.elements.nextBarBtn.setAttribute('aria-disabled', this.currentBarIndex === this.currentResult.bars.length - 1);
        }
    }

    updateUIState() {
        this.updateNavigationButtons();
        AppUtils.hideLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
    }

    async exportToPDF() {
        if (!this.currentResult) {
            AppUtils.showError('errorCustom', 'Please run optimization first before exporting.');
            return;
        }
        
        try {
            AppUtils.showLoading('exportPdfBtnCustom', 'exportTextCustom', 'exportSpinnerCustom');
            
            const formData = this.getFormData();
            const cutList = this.generateCutList(formData);
            
            // Prepare data for PDF export
            const exportData = {
                ...this.currentResult,
                formData: {
                    ...formData,
                    items: cutList
                }
            };
            
            // Ensure PDF functions are available
            if (typeof window.exportCustomToPDF !== 'function') {
                throw new Error('PDF export functions not loaded');
            }
            
            // Export PDF
            await window.exportCustomToPDF(exportData, formData, this.itemColors);
            
        } catch (error) {
            console.error('Custom PDF Export Error:', error);
            AppUtils.showError('errorCustom', `PDF Export Failed: ${error.message}`);
        } finally {
            AppUtils.hideLoading('exportPdfBtnCustom', 'exportTextCustom', 'exportSpinnerCustom');
        }
    }
}

// ============================================
// INITIALIZATION & EXPORTS
// ============================================

// Initialize based on current page
function initializeApp() {
    const path = window.location.pathname;
    
    if (path.includes('1d-optimizer.html') || document.getElementById('optimizerForm1D')) {
        window.oneDOptimizer = new OneDOptimizer();
        console.log('1D Optimizer initialized');
    }
    
    if (path.includes('2d-optimizer.html') || document.getElementById('optimizer2D')) {
        window.twoDOptimizer = new TwoDOptimizer();
        console.log('2D Optimizer initialized');
    }
    
    if (path.includes('custom-optimizer.html') || document.getElementById('optimizerFormCustom')) {
        window.customOptimizer = new CustomOptimizerModule();
        console.log('Custom Optimizer initialized');
    }
    
    // Legacy support for global functions
    window.init1DOptimizer = () => new OneDOptimizer();
    window.init2DOptimizer = () => new TwoDOptimizer();
    window.initCustomOptimizer = () => new CustomOptimizerModule();
    window.showError = AppUtils.showError;
    window.showLoading = AppUtils.showLoading;
    window.hideLoading = AppUtils.hideLoading;
    window.formatNumber = AppUtils.formatNumber;
    
    console.log('Cutting Optimizer App initialized successfully');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppUtils,
        OneDOptimizer,
        TwoDOptimizer,
        CustomOptimizerModule
    };
}
