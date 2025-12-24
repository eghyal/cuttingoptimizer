// ============================================
// GLOBAL UTILITY FUNCTIONS
// ============================================

function showError(containerId, message) {
    const errorContainer = document.getElementById(containerId);
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        
        // Scroll to error
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 5000);
    }
}

function showLoading(buttonId, textId, spinnerId) {
    const button = document.getElementById(buttonId);
    const text = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);
    
    if (button) button.disabled = true;
    if (text) text.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
}

function hideLoading(buttonId, textId, spinnerId) {
    const button = document.getElementById(buttonId);
    const text = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);
    
    if (button) button.disabled = false;
    if (text) text.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
}

function showExporting(buttonId, textId, spinnerId) {
    const button = document.getElementById(buttonId);
    const text = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);
    
    if (button) button.disabled = true;
    if (text) text.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
}

function hideExporting(buttonId, textId, spinnerId) {
    const button = document.getElementById(buttonId);
    const text = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);
    
    if (button) button.disabled = false;
    if (text) text.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
}

function formatNumber(num, decimals = 1) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
}

function createStatsCard(title, value, unit = '') {
    return `
        <div class="stat-card">
            <div class="stat-value">${value}</div>
            <div class="stat-label">${title}${unit ? ` ${unit}` : ''}</div>
        </div>
    `;
}

// ============================================
// 1D OPTIMIZER IMPLEMENTATION
// ============================================

function init1DOptimizer() {
    // State
    let currentResult = null;
    let currentBarIndex = 0;
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    let itemColors = new Map();

    // DOM Elements
    const addItemBtn = document.getElementById('addItemBtn1D');
    const cutListContainer = document.getElementById('cutListContainer1D');
    const optimizeBtn = document.getElementById('optimizeBtn1D');
    const resultsContainer = document.getElementById('resultsContainer1D');
    const emptyResults = document.getElementById('emptyResults1D');
    const errorContainer = document.getElementById('error1D');
    const summaryStats = document.getElementById('summaryStats1D');
    const barCounter = document.getElementById('barCounter1D');
    const prevBarBtn = document.getElementById('prevBarBtn1D');
    const nextBarBtn = document.getElementById('nextBarBtn1D');
    const barDetails = document.getElementById('barDetails1D');
    const exportPdfBtn = document.getElementById('exportPdfBtn1D');

    // Add Item Function
    function addItemRow() {
        const itemRow = document.createElement('div');
        itemRow.className = 'cut-list-input-group';
        itemRow.innerHTML = `
            <input type="text" name="itemId[]" placeholder="ID" class="w-full">
            <input type="number" name="itemLength[]" placeholder="Length" min="1" step="1" class="w-full">
            <input type="number" name="itemQuantity[]" placeholder="Qty" min="1" step="1" class="w-full">
            <button type="button" class="remove-item-btn btn" style="background-color: #fee2e2; color: #991b1b; border-color: #fecaca;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cutListContainer.appendChild(itemRow);
        
        // Add remove event listener
        const removeBtn = itemRow.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', function() {
            itemRow.remove();
        });
    }

    // Remove Item Function
    function setupRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('.cut-list-input-group');
                row.remove();
            });
        });
    }

    // Get Items from Form
    function getItemsFromForm() {
        const items = [];
        const itemRows = cutListContainer.querySelectorAll('.cut-list-input-group');
        
        itemRows.forEach(row => {
            const id = row.querySelector('input[name="itemId[]"]').value.trim() || 'Item';
            const length = parseFloat(row.querySelector('input[name="itemLength[]"]').value) || 0;
            const quantity = parseInt(row.querySelector('input[name="itemQuantity[]"]').value) || 1;
            
            if (length > 0 && quantity > 0) {
                items.push({ id, length, quantity });
            }
        });
        
        return items;
    }

    // Validate Inputs
    function validateInputs(items, materialLength) {
        if (items.length === 0) {
            throw new Error("Please add at least one item to optimize.");
        }
        
        if (materialLength <= 0) {
            throw new Error("Material length must be greater than 0.");
        }
        
        const kerfWidth = parseFloat(document.getElementById('kerfWidth').value) || 0;
        
        // Check each item
        items.forEach(item => {
            if (item.length <= 0) {
                throw new Error(`Item "${item.id}" has invalid length.`);
            }
            
            if (item.quantity <= 0) {
                throw new Error(`Item "${item.id}" has invalid quantity.`);
            }
            
            if (item.length + kerfWidth > materialLength) {
                throw new Error(`Item "${item.id}" (${item.length}mm + ${kerfWidth}mm kerf) exceeds material length of ${materialLength}mm.`);
            }
        });
        
        return true;
    }

    // Update Item Colors
    function updateItemColors(bars) {
        const uniqueLengths = new Set();
        bars.forEach(bar => {
            bar.items.forEach(item => {
                uniqueLengths.add(item.originalLength);
            });
        });

        const sortedLengths = Array.from(uniqueLengths).sort((a, b) => b - a);
        const newColors = new Map();
        sortedLengths.forEach((length, i) => {
            newColors.set(length, colors[i % colors.length]);
        });
        itemColors = newColors;
    }

    // Display Results
    function displayResults(result) {
        currentResult = result;
        currentBarIndex = 0;
        
        // Show results container, hide empty state
        resultsContainer.classList.remove('hidden');
        emptyResults.classList.add('hidden');
        
        // Update summary stats
        const totalWaste = result.totalWaste || 0;
        const totalMaterialLength = result.totalUsedLength + totalWaste;
        const wastePercentage = totalMaterialLength > 0 ? (totalWaste / totalMaterialLength) * 100 : 0;
        
        summaryStats.innerHTML = `
            ${createStatsCard('Total Bars', result.totalBars)}
            ${createStatsCard('Efficiency', result.overallEfficiency.toFixed(1), '%')}
            ${createStatsCard('Total Waste', totalWaste.toFixed(0), 'mm')}
            ${createStatsCard('Time', result.executionTime, 'ms')}
        `;
        
        // Update item colors
        updateItemColors(result.bars);
        
        // Display first bar
        displayBar(currentBarIndex);
        
        // Update bar counter
        updateBarCounter();
        
        // Setup navigation buttons
        updateNavigationButtons();
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Display Bar - REVISED: dengan garis outline dan label di tengah
    function displayBar(index) {
        if (!currentResult || !currentResult.bars[index]) return;
        
        const bar = currentResult.bars[index];
        const materialLength = parseFloat(document.getElementById('materialLength').value) || 6000;
        const kerfWidth = parseFloat(document.getElementById('kerfWidth').value) || 0;
        
        // Create bar visualization
        let barVisualization = '';
        let totalUsed = 0;
        
        bar.items.forEach((item, i) => {
            const widthPercentage = (item.originalLength / materialLength) * 100;
            const color = itemColors.get(item.originalLength) || colors[0];
            totalUsed += item.originalLength;
            
            // FIXED: Tambahkan border dan label dengan ukuran
            barVisualization += `
                <div class="bar-segment" 
                     style="width: ${widthPercentage}%; background-color: ${color}; border: 1px solid #ffffff;"
                     title="${item.originalId}: ${item.originalLength}mm">
                    <div class="segment-content">
                        ${widthPercentage > 8 ? `<span class="segment-length">${item.originalLength}mm</span>` : ''}
                        ${widthPercentage > 15 ? `<span class="segment-id">${item.originalId}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        // Add waste segment if any
        if (bar.remainingLength > 0) {
            const wastePercentage = (bar.remainingLength / materialLength) * 100;
            barVisualization += `
                <div class="bar-segment" style="width: ${wastePercentage}%; background-color: #e5e7eb; border: 1px solid #d1d5db;">
                    <div class="segment-content">
                        ${wastePercentage > 8 ? `<span class="segment-waste">Waste: ${bar.remainingLength}mm</span>` : ''}
                    </div>
                </div>`;
        }
        
        // Create items list
        let itemsList = '';
        bar.items.forEach(item => {
            const color = itemColors.get(item.originalLength) || colors[0];
            itemsList += `
                <div class="bar-item-row">
                    <div class="flex items-center">
                        <span class="item-color-indicator" style="background-color: ${color}"></span>
                        <span class="text-sm text-gray-700">${item.originalId}</span>
                    </div>
                    <div class="text-sm text-gray-600">${item.originalLength} mm</div>
                </div>
            `;
        });
        
        // Update bar details
        barDetails.innerHTML = `
            <div class="bar-info">
                <div>
                    <span class="font-medium text-gray-700">Efficiency:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.efficiency.toFixed(1)}%</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Waste:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.remainingLength.toFixed(0)} mm</span>
                </div>
            </div>
            
            <div class="bar-visualization-container">
                <div class="bar-visualization">
                    ${barVisualization}
                </div>
                <div class="bar-total">
                    <span>Total Length: ${materialLength}mm</span>
                </div>
            </div>
            
            <div class="bar-items-list">
                <h5 class="font-medium text-gray-700 mb-2">Items on this bar (${bar.items.length}):</h5>
                ${itemsList}
            </div>
        `;
        
        // Tambahkan style untuk segment-content
        const style = document.createElement('style');
        style.textContent = `
            .bar-segment {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid #ffffff;
            }
            .bar-segment:last-child {
                border-right: none;
            }
            .segment-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                padding: 2px;
            }
            .segment-length {
                font-size: 11px;
                font-weight: 600;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.7);
                text-align: center;
                word-break: break-word;
                line-height: 1.2;
            }
            .segment-id {
                font-size: 10px;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.7);
                margin-top: 2px;
            }
            .segment-waste {
                font-size: 10px;
                color: #666;
                font-weight: 500;
                text-align: center;
            }
            .bar-total {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-top: 8px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    // Update Bar Counter
    function updateBarCounter() {
        if (!currentResult) return;
        barCounter.textContent = `Bar ${currentBarIndex + 1} of ${currentResult.bars.length}`;
    }

    // Update Navigation Buttons
    function updateNavigationButtons() {
        if (!currentResult) return;
        if (prevBarBtn) prevBarBtn.disabled = currentBarIndex === 0;
        if (nextBarBtn) nextBarBtn.disabled = currentBarIndex === currentResult.bars.length - 1;
    }

    // Event Listeners
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItemRow);
    }

    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            try {
                // Get form values
                const materialLength = parseFloat(document.getElementById('materialLength').value) || 6000;
                const kerfWidth = parseFloat(document.getElementById('kerfWidth').value) || 0;
                const algorithm = document.getElementById('algorithm').value;
                const items = getItemsFromForm();
                
                // Validate
                validateInputs(items, materialLength);
                
                // Show loading
                showLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
                errorContainer.classList.add('hidden');
                
                // Apply kerf to items
                const itemsWithKerf = items.map(item => ({
                    ...item,
                    length: item.length + kerfWidth
                }));
                
                // Run optimization with delay to show loading
                setTimeout(() => {
                    try {
                        const optimizer = new CuttingOptimizer1D(algorithm);
                        const result = optimizer.optimize(itemsWithKerf, materialLength);
                        
                        // Display results
                        displayResults(result);
                        
                        // Hide loading
                        hideLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
                        
                    } catch (error) {
                        hideLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
                        showError('error1D', error.message || 'An unknown error occurred during optimization.');
                    }
                }, 100);
                
            } catch (error) {
                hideLoading('optimizeBtn1D', 'optimizeText1D', 'optimizeSpinner1D');
                showError('error1D', error.message);
            }
        });
    }

    if (prevBarBtn) {
        prevBarBtn.addEventListener('click', function() {
            if (currentBarIndex > 0) {
                currentBarIndex--;
                displayBar(currentBarIndex);
                updateBarCounter();
                updateNavigationButtons();
            }
        });
    }

    if (nextBarBtn) {
        nextBarBtn.addEventListener('click', function() {
            if (currentResult && currentBarIndex < currentResult.bars.length - 1) {
                currentBarIndex++;
                displayBar(currentBarIndex);
                updateBarCounter();
                updateNavigationButtons();
            }
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async function() {
            if (!currentResult) return;
            
            try {
                // Get form data
                const materialLength = parseFloat(document.getElementById('materialLength').value) || 6000;
                const kerfWidth = parseFloat(document.getElementById('kerfWidth').value) || 0;
                const algorithm = document.getElementById('algorithm').value;
                const items = getItemsFromForm();
                
                const formData = {
                    materialLength,
                    kerfWidth,
                    algorithm,
                    items
                };
                
                // Show exporting state
                showExporting('exportPdfBtn1D', 'exportText1D', 'exportSpinner1D');
                
                // Check if jsPDF is available
                if (typeof window.jspdf === 'undefined') {
                    throw new Error('PDF library not loaded. Please check your internet connection.');
                }
                
                // FIXED: Gunakan window.export1DToPDF untuk menghindari undefined error
                if (typeof window.export1DToPDF !== 'function') {
                    throw new Error('PDF export function not loaded. Please refresh the page.');
                }
                
                // Export PDF
                await window.export1DToPDF(currentResult, formData, itemColors);
                
            } catch (error) {
                console.error('PDF Export Error:', error);
                alert('Error generating PDF: ' + error.message);
            } finally {
                // Hide exporting state
                hideExporting('exportPdfBtn1D', 'exportText1D', 'exportSpinner1D');
            }
        });
    }

    // Initialize remove buttons
    setupRemoveButtons();
}

// ============================================
// 2D OPTIMIZER IMPLEMENTATION
// ============================================

function init2DOptimizer() {
    // State
    let currentResult = null;
    let currentPlateIndex = 0;
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    let itemColors = new Map();

    // DOM Elements
    const addItemBtn = document.getElementById('addItemBtn2D');
    const cutListContainer = document.getElementById('cutListContainer2D');
    const optimizeBtn = document.getElementById('optimizeBtn2D');
    const resultsContainer = document.getElementById('resultsContainer2D');
    const emptyResults = document.getElementById('emptyResults2D');
    const errorContainer = document.getElementById('error2D');
    const summaryStats = document.getElementById('summaryStats2D');
    const plateCounter = document.getElementById('plateCounter2D');
    const prevPlateBtn = document.getElementById('prevPlateBtn2D');
    const nextPlateBtn = document.getElementById('nextPlateBtn2D');
    const plateDetails = document.getElementById('plateDetails2D');
    const exportPdfBtn = document.getElementById('exportPdfBtn2D');

    // Add Item Function
    function addItemRow() {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <!-- Row 1: Item ID -->
            <div class="item-id-row">
                <input type="text" name="itemId[]" placeholder="Item ID" class="w-full">
            </div>
            
            <!-- Row 2: Dimensions and Quantity -->
            <div class="item-dimensions-row">
                <div class="dimension-input">
                    <label>Width (mm)</label>
                    <input type="number" name="itemWidth[]" min="1" step="1" class="w-full">
                </div>
                <div class="dimension-input">
                    <label>Height (mm)</label>
                    <input type="number" name="itemHeight[]" min="1" step="1" class="w-full">
                </div>
                <div class="dimension-input">
                    <label>Quantity</label>
                    <input type="number" name="itemQuantity[]" min="1" step="1" class="w-full">
                </div>
            </div>
            
            <!-- Row 3: Rotation and Remove Button -->
            <div class="item-actions-row">
                <div class="rotation-checkbox">
                    <input type="checkbox" name="itemRotation[]" checked>
                    <span class="text-sm text-gray-600">Allow Rotation</span>
                </div>
                <button type="button" class="remove-item-btn">
                    <i class="fas fa-trash"></i>
                    Remove
                </button>
            </div>
        `;
        
        cutListContainer.appendChild(itemRow);
        
        // Add remove event listener
        const removeBtn = itemRow.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', function() {
            itemRow.remove();
        });
    }

    // Remove Item Function
    function setupRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const row = this.closest('.item-row');
                row.remove();
            });
        });
    }

    // Get Items from Form
    function getItemsFromForm() {
        const items = [];
        const itemRows = cutListContainer.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const id = row.querySelector('input[name="itemId[]"]').value.trim() || 'Item';
            const width = parseFloat(row.querySelector('input[name="itemWidth[]"]').value) || 0;
            const height = parseFloat(row.querySelector('input[name="itemHeight[]"]').value) || 0;
            const quantity = parseInt(row.querySelector('input[name="itemQuantity[]"]').value) || 1;
            const rotation = row.querySelector('input[name="itemRotation[]"]').checked;
            
            if (width > 0 && height > 0 && quantity > 0) {
                items.push({ id, width, height, quantity, rotation });
            }
        });
        
        return items;
    }

    // Validate Inputs
    function validateInputs(items, plateWidth, plateHeight) {
        if (items.length === 0) {
            throw new Error("Please add at least one item to optimize.");
        }
        
        if (plateWidth <= 0 || plateHeight <= 0) {
            throw new Error("Plate dimensions must be greater than 0.");
        }
        
        const kerfWidth = parseFloat(document.getElementById('kerfWidth2d').value) || 0;
        
        // Check each item
        items.forEach(item => {
            if (item.width <= 0 || item.height <= 0) {
                throw new Error(`Item "${item.id}" has invalid dimensions.`);
            }
            
            if (item.quantity <= 0) {
                throw new Error(`Item "${item.id}" has invalid quantity.`);
            }
            
            const itemWidthWithKerf = item.width + kerfWidth;
            const itemHeightWithKerf = item.height + kerfWidth;
            
            // Check if item fits
            if (!item.rotation && (itemWidthWithKerf > plateWidth || itemHeightWithKerf > plateHeight)) {
                throw new Error(`Item "${item.id}" (${itemWidthWithKerf}×${itemHeightWithKerf}mm) is larger than plate (${plateWidth}×${plateHeight}mm) and cannot be rotated.`);
            }
            
            if (item.rotation) {
                const fitsWidth = itemWidthWithKerf <= plateWidth && itemHeightWithKerf <= plateHeight;
                const fitsHeight = itemHeightWithKerf <= plateWidth && itemWidthWithKerf <= plateHeight;
                if (!fitsWidth && !fitsHeight) {
                    throw new Error(`Item "${item.id}" (${itemWidthWithKerf}×${itemHeightWithKerf}mm) is too large for plate (${plateWidth}×${plateHeight}mm), even with rotation.`);
                }
            }
        });
        
        return true;
    }

    // Update Item Colors
    function updateItemColors(plates) {
        const uniqueIds = new Set();
        plates.forEach(plate => {
            plate.items.forEach(item => {
                uniqueIds.add(item.originalId);
            });
        });

        const sortedIds = Array.from(uniqueIds).sort();
        const newColors = new Map();
        sortedIds.forEach((id, i) => {
            newColors.set(id, colors[i % colors.length]);
        });
        itemColors = newColors;
    }

    // Display Results
    function displayResults(result) {
        currentResult = result;
        currentPlateIndex = 0;
        
        // Show results container, hide empty state
        resultsContainer.classList.remove('hidden');
        emptyResults.classList.add('hidden');
        
        // Update summary stats
        const plateWidth = parseFloat(document.getElementById('plateWidth').value) || 2440;
        const plateHeight = parseFloat(document.getElementById('plateHeight').value) || 1220;
        const totalArea = result.totalPlates * plateWidth * plateHeight;
        const totalWasteArea = totalArea - result.totalUsedArea;
        const wastePercentage = totalArea > 0 ? (totalWasteArea / totalArea) * 100 : 0;
        
        summaryStats.innerHTML = `
            ${createStatsCard('Total Plates', result.totalPlates)}
            ${createStatsCard('Efficiency', result.overallEfficiency.toFixed(1), '%')}
            ${createStatsCard('Unplaced', result.unplacedItems)}
            ${createStatsCard('Time', result.executionTime, 'ms')}
        `;
        
        // Update item colors
        updateItemColors(result.plates);
        
        // Display first plate
        displayPlate(currentPlateIndex);
        
        // Update plate counter
        updatePlateCounter();
        
        // Setup navigation buttons
        updateNavigationButtons();
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Display Plate - REVISED: dengan outline dan label ukuran
    function displayPlate(index) {
        if (!currentResult || !currentResult.plates[index]) return;
        
        const plate = currentResult.plates[index];
        const plateWidth = parseFloat(document.getElementById('plateWidth').value) || 2440;
        const plateHeight = parseFloat(document.getElementById('plateHeight').value) || 1220;
        const kerfWidth = parseFloat(document.getElementById('kerfWidth2d').value) || 0;
        
        // Calculate visualization dimensions
        const containerHeight = 300;
        const containerWidth = '100%';
        
        // Create plate visualization
        const visualId = `plate-visual-${index}`;
        const containerId = `plate-visual-container-${index}`;
        
        let plateVisualization = '';
        
        plate.items.forEach((item, i) => {
            const left = (item.x / plateWidth) * 100;
            const top = (item.y / plateHeight) * 100;
            const width = (item.width / plateWidth) * 100;
            const height = (item.height / plateHeight) * 100;
            const color = itemColors.get(item.originalId) || colors[0];
            const actualWidth = item.width - kerfWidth;
            const actualHeight = item.height - kerfWidth;
            
            // FIXED: Tambahkan border dan label dengan ukuran
            plateVisualization += `
                <div class="plate-item" 
                     style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 0 1px rgba(0,0,0,0.1);"
                     title="${item.originalId}: ${actualWidth}×${actualHeight}mm${item.rotated ? ' (Rotated)' : ''}">
                    <div class="plate-item-content">
                        ${width > 15 && height > 15 ? 
                            `<span class="plate-item-id">${item.originalId}</span>` : ''}
                        ${width > 20 && height > 20 ? 
                            `<span class="plate-item-dimensions">${actualWidth}×${actualHeight}</span>` : ''}
                        ${item.rotated && width > 10 && height > 10 ? 
                            `<span class="plate-item-rotated">R</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        // Create items list
        let itemsList = '';
        plate.items.forEach(item => {
            const color = itemColors.get(item.originalId) || colors[0];
            const actualWidth = item.width - kerfWidth;
            const actualHeight = item.height - kerfWidth;
            itemsList += `
                <div class="plate-item-row">
                    <div class="flex items-center">
                        <span class="item-color-indicator" style="background-color: ${color}"></span>
                        <span class="text-sm text-gray-700">${item.originalId}</span>
                        ${item.rotated ? '<span class="rotated-indicator">(R)</span>' : ''}
                    </div>
                    <div class="text-sm text-gray-600">
                        ${actualWidth} × ${actualHeight} mm
                    </div>
                </div>
            `;
        });
        
        // Update plate details
        plateDetails.innerHTML = `
            <div class="plate-info">
                <div>
                    <span class="font-medium text-gray-700">Efficiency:</span>
                    <span class="ml-2 font-semibold text-gray-900">${plate.getEfficiency().toFixed(1)}%</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Items:</span>
                    <span class="ml-2 font-semibold text-gray-900">${plate.items.length}</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Waste:</span>
                    <span class="ml-2 font-semibold text-gray-900">${formatNumber(plate.getWasteArea())} mm²</span>
                </div>
            </div>
            
            <div id="${containerId}" class="plate-visual-container">
                <div id="${visualId}" class="plate-visual">
                    ${plateVisualization}
                </div>
                <div class="plate-dimensions">
                    ${plateWidth} × ${plateHeight} mm
                </div>
                <div class="zoom-controls">
                    <button class="zoom-btn" onclick="zoomInPlate('${containerId}', '${visualId}')">+</button>
                    <button class="zoom-btn" onclick="zoomOutPlate('${containerId}', '${visualId}')">-</button>
                </div>
                <button class="zoom-reset-btn" onclick="resetPlateZoom('${containerId}', '${visualId}')">Reset</button>
            </div>
            
            <div class="mobile-instruction">
                <i class="fas fa-expand-arrows-alt"></i> Pinch to zoom, drag to pan
            </div>
            
            <div class="plate-items-list">
                <h5 class="font-medium text-gray-700 mb-2">Items on this plate (${plate.items.length}):</h5>
                ${itemsList}
            </div>
        `;
        
        // Tambahkan style untuk plate-item
        const style = document.createElement('style');
        style.textContent = `
            .plate-item {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                overflow: hidden;
            }
            .plate-item-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                padding: 3px;
                text-align: center;
            }
            .plate-item-id {
                font-size: 11px;
                font-weight: 700;
                color: white;
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                margin-bottom: 2px;
                line-height: 1.2;
            }
            .plate-item-dimensions {
                font-size: 9px;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                line-height: 1.2;
            }
            .plate-item-rotated {
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 8px;
                color: white;
                background-color: rgba(0,0,0,0.5);
                border-radius: 2px;
                padding: 1px 3px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
        
        // Initialize pinch zoom
        setTimeout(() => {
            initPlatePinchZoom(containerId, visualId);
        }, 100);
    }

    // Update Plate Counter
    function updatePlateCounter() {
        if (!currentResult) return;
        plateCounter.textContent = `Plate ${currentPlateIndex + 1} of ${currentResult.plates.length}`;
    }

    // Update Navigation Buttons
    function updateNavigationButtons() {
        if (!currentResult) return;
        if (prevPlateBtn) prevPlateBtn.disabled = currentPlateIndex === 0;
        if (nextPlateBtn) nextPlateBtn.disabled = currentPlateIndex === currentResult.plates.length - 1;
    }

    // Event Listeners
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addItemRow);
    }

    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            try {
                // Get form values
                const plateWidth = parseFloat(document.getElementById('plateWidth').value) || 2440;
                const plateHeight = parseFloat(document.getElementById('plateHeight').value) || 1220;
                const kerfWidth = parseFloat(document.getElementById('kerfWidth2d').value) || 0;
                const algorithm = document.getElementById('algorithm2d').value;
                const items = getItemsFromForm();
                
                // Validate
                validateInputs(items, plateWidth, plateHeight);
                
                // Show loading
                showLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
                errorContainer.classList.add('hidden');
                
                // Apply kerf to items
                const itemsWithKerf = items.map(item => ({
                    ...item,
                    width: item.width + kerfWidth,
                    height: item.height + kerfWidth
                }));
                
                // Run optimization with delay to show loading
                setTimeout(() => {
                    try {
                        const optimizer = new PlateOptimizer2D(algorithm);
                        const result = optimizer.optimize(itemsWithKerf, plateWidth, plateHeight);
                        
                        // Display results
                        displayResults(result);
                        
                        // Hide loading
                        hideLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
                        
                    } catch (error) {
                        hideLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
                        showError('error2D', error.message || 'An unknown error occurred during optimization.');
                    }
                }, 100);
                
            } catch (error) {
                hideLoading('optimizeBtn2D', 'optimizeText2D', 'optimizeSpinner2D');
                showError('error2D', error.message);
            }
        });
    }

    if (prevPlateBtn) {
        prevPlateBtn.addEventListener('click', function() {
            if (currentPlateIndex > 0) {
                currentPlateIndex--;
                displayPlate(currentPlateIndex);
                updatePlateCounter();
                updateNavigationButtons();
            }
        });
    }

    if (nextPlateBtn) {
        nextPlateBtn.addEventListener('click', function() {
            if (currentResult && currentPlateIndex < currentResult.plates.length - 1) {
                currentPlateIndex++;
                displayPlate(currentPlateIndex);
                updatePlateCounter();
                updateNavigationButtons();
            }
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async function() {
            if (!currentResult) return;
            
            try {
                // Get form data
                const plateWidth = parseFloat(document.getElementById('plateWidth').value) || 2440;
                const plateHeight = parseFloat(document.getElementById('plateHeight').value) || 1220;
                const kerfWidth = parseFloat(document.getElementById('kerfWidth2d').value) || 0;
                const algorithm = document.getElementById('algorithm2d').value;
                const items = getItemsFromForm();
                
                const formData = {
                    plateWidth,
                    plateHeight,
                    kerfWidth2d: kerfWidth,
                    algorithm2d: algorithm,
                    items
                };
                
                // Show exporting state
                showExporting('exportPdfBtn2D', 'exportText2D', 'exportSpinner2D');
                
                // Check if jsPDF is available
                if (typeof window.jspdf === 'undefined') {
                    throw new Error('PDF library not loaded. Please check your internet connection.');
                }
                
                // FIXED: Gunakan window.export2DToPDF untuk menghindari undefined error
                if (typeof window.export2DToPDF !== 'function') {
                    throw new Error('PDF export function not loaded. Please refresh the page.');
                }
                
                // Export PDF
                await window.export2DToPDF(currentResult, formData, itemColors);
                
            } catch (error) {
                console.error('PDF Export Error:', error);
                alert('Error generating PDF: ' + error.message);
            } finally {
                // Hide exporting state
                hideExporting('exportPdfBtn2D', 'exportText2D', 'exportSpinner2D');
            }
        });
    }

    // Initialize remove buttons
    setupRemoveButtons();
}

// ============================================
// MOBILE PINCH ZOOM FUNCTIONS
// ============================================

function initPlatePinchZoom(containerId, visualId) {
    const container = document.getElementById(containerId);
    const visual = document.getElementById(visualId);
    
    if (!container || !visual) return;
    
    let scale = 1;
    let posX = 0;
    let posY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let lastDistance = 0;
    
    // Touch events for mobile
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    // Mouse events for desktop testing
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    function handleTouchStart(e) {
        if (e.touches.length === 1) {
            // Single touch - pan
            isDragging = true;
            const rect = container.getBoundingClientRect();
            startX = e.touches[0].clientX - posX;
            startY = e.touches[0].clientY - posY;
        } else if (e.touches.length === 2) {
            // Two touches - pinch zoom
            isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }
    
    function handleTouchMove(e) {
        if (e.touches.length === 1 && isDragging) {
            // Pan
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            posX = e.touches[0].clientX - startX;
            posY = e.touches[0].clientY - startY;
            updateTransform();
        } else if (e.touches.length === 2) {
            // Pinch zoom
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (lastDistance > 0) {
                const delta = distance - lastDistance;
                const zoomFactor = 1 + delta * 0.01;
                
                // Calculate center point for zoom
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                
                zoomAt(centerX, centerY, zoomFactor);
            }
            
            lastDistance = distance;
        }
    }
    
    function handleTouchEnd() {
        isDragging = false;
        lastDistance = 0;
    }
    
    function handleMouseDown(e) {
        isDragging = true;
        startX = e.clientX - posX;
        startY = e.clientY - posY;
        e.preventDefault();
    }
    
    function handleMouseMove(e) {
        if (isDragging) {
            posX = e.clientX - startX;
            posY = e.clientY - startY;
            updateTransform();
        }
    }
    
    function handleMouseUp() {
        isDragging = false;
    }
    
    function handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = container.getBoundingClientRect();
        const centerX = e.clientX - rect.left;
        const centerY = e.clientY - rect.top;
        
        zoomAt(centerX, centerY, zoomFactor);
    }
    
    function zoomAt(clientX, clientY, zoomFactor) {
        // Calculate the position relative to the container
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Calculate the position in the visual's coordinate system
        const visualX = (x - posX) / scale;
        const visualY = (y - posY) / scale;
        
        // Apply zoom
        const newScale = scale * zoomFactor;
        scale = Math.max(0.5, Math.min(3, newScale));
        
        // Adjust position to keep the point under the cursor
        posX = x - visualX * scale;
        posY = y - visualY * scale;
        
        updateTransform();
    }
    
    function updateTransform() {
        visual.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    }
    
    // Store functions for button controls
    window[`zoomInPlate_${containerId}`] = function() {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        zoomAt(centerX, centerY, 1.2);
    };
    
    window[`zoomOutPlate_${containerId}`] = function() {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        zoomAt(centerX, centerY, 0.8);
    };
    
    window[`resetPlateZoom_${containerId}`] = function() {
        scale = 1;
        posX = 0;
        posY = 0;
        updateTransform();
    };
}

// Helper functions for zoom buttons
function zoomInPlate(containerId, visualId) {
    if (window[`zoomInPlate_${containerId}`]) {
        window[`zoomInPlate_${containerId}`]();
    }
}

function zoomOutPlate(containerId, visualId) {
    if (window[`zoomOutPlate_${containerId}`]) {
        window[`zoomOutPlate_${containerId}`]();
    }
}

function resetPlateZoom(containerId, visualId) {
    if (window[`resetPlateZoom_${containerId}`]) {
        window[`resetPlateZoom_${containerId}`]();
    }
}

// ============================================
// CUSTOM OPTIMIZER IMPLEMENTATION
// ============================================

function initCustomOptimizer() {
    // State
    let currentResult = null;
    let currentBarIndex = 0;
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    let itemColors = new Map();

    // DOM Elements
    const generateCutListBtn = document.getElementById('generateCutListBtn');
    const optimizeBtn = document.getElementById('optimizeBtnCustom');
    const addItemBtn = document.getElementById('addCustomItemBtn');
    const cutListContainer = document.getElementById('cutListContainerCustom');
    const resultsContainer = document.getElementById('resultsContainerCustom');
    const emptyResults = document.getElementById('emptyResultsCustom');
    const errorContainer = document.getElementById('errorCustom');
    const summaryStats = document.getElementById('summaryStatsCustom');
    const barCounter = document.getElementById('barCounterCustom');
    const prevBarBtn = document.getElementById('prevBarBtnCustom');
    const nextBarBtn = document.getElementById('nextBarBtnCustom');
    const barDetails = document.getElementById('barDetailsCustom');
    const exportPdfBtn = document.getElementById('exportPdfBtnCustom');

    // FF-CA-01 Parameters
    const smallRingAInput = document.getElementById('smallRingA');
    const bigRingAInput = document.getElementById('bigRingA');
    const smallRingBInput = document.getElementById('smallRingB');
    const bigRingBInput = document.getElementById('bigRingB');
    const multiplierInput = document.getElementById('multiplier');

    // Generate Cut List from FF-CA-01 parameters
    function generateCutListFromFFCA01() {
        const smallRingA = parseFloat(smallRingAInput.value) || 0;
        const bigRingA = parseFloat(bigRingAInput.value) || 0;
        const smallRingB = parseFloat(smallRingBInput.value) || 0;
        const bigRingB = parseFloat(bigRingBInput.value) || 0;
        const multiplier = parseInt(multiplierInput.value) || 1;
        const kerfWidth = parseFloat(document.getElementById('kerfWidthCustom').value) || 0;

        // Clear existing items
        cutListContainer.innerHTML = '';

        const items = [];
        
        // Add items for pattern A
        if (smallRingA > 0) {
            items.push({
                id: 'A-Small',
                length: smallRingA + kerfWidth,
                quantity: 4 * multiplier,
                originalLength: smallRingA,
                type: 'small-ring',
                pattern: 'A'
            });
        }
        
        if (bigRingA > 0) {
            items.push({
                id: 'A-Big',
                length: bigRingA + kerfWidth,
                quantity: 4 * multiplier,
                originalLength: bigRingA,
                type: 'big-ring',
                pattern: 'A'
            });
        }
        
        // Add items for pattern B
        if (smallRingB > 0) {
            items.push({
                id: 'B-Small',
                length: smallRingB + kerfWidth,
                quantity: 4 * multiplier,
                originalLength: smallRingB,
                type: 'small-ring',
                pattern: 'B'
            });
        }
        
        if (bigRingB > 0) {
            items.push({
                id: 'B-Big',
                length: bigRingB + kerfWidth,
                quantity: 4 * multiplier,
                originalLength: bigRingB,
                type: 'big-ring',
                pattern: 'B'
            });
        }

        // Add items to container
        items.forEach((item, index) => {
            const itemRow = document.createElement('div');
            itemRow.className = 'cut-list-input-group';
            itemRow.innerHTML = `
                <input type="text" name="itemId[]" placeholder="ID" value="${item.id}" class="w-full" readonly>
                <input type="number" name="itemLength[]" placeholder="Length" value="${item.length}" min="1" step="1" class="w-full" readonly>
                <input type="number" name="itemQuantity[]" placeholder="Qty" value="${item.quantity}" min="1" step="1" class="w-full" readonly>
            `;
            
            cutListContainer.appendChild(itemRow);
        });

        // Show notification
        showNotification('Cut list generated successfully!', 'success');
        
        // Scroll to cut list
        cutListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        return items;
    }

    // Get Items from Form (including custom parameters)
    function getItemsFromForm() {
        const items = [];
        const itemRows = cutListContainer.querySelectorAll('.cut-list-input-group');
        
        itemRows.forEach(row => {
            const id = row.querySelector('input[name="itemId[]"]').value.trim();
            const length = parseFloat(row.querySelector('input[name="itemLength[]"]').value) || 0;
            const quantity = parseInt(row.querySelector('input[name="itemQuantity[]"]').value) || 1;
            
            if (length > 0 && quantity > 0) {
                items.push({ id, length, quantity });
            }
        });
        
        return items;
    }

    // Get FF-CA-01 parameters
    function getFFCA01Params() {
        return {
            smallRingA: parseFloat(smallRingAInput.value) || 0,
            bigRingA: parseFloat(bigRingAInput.value) || 0,
            smallRingB: parseFloat(smallRingBInput.value) || 0,
            bigRingB: parseFloat(bigRingBInput.value) || 0,
            multiplier: parseInt(multiplierInput.value) || 1,
            kerfWidth: parseFloat(document.getElementById('kerfWidthCustom').value) || 0
        };
    }

    // Validate Inputs
    function validateInputs(items, materialLength, ffca01Params) {
        if (items.length === 0) {
            throw new Error("Please generate a cut list first.");
        }
        
        if (materialLength <= 0) {
            throw new Error("Material length must be greater than 0.");
        }
        
        const kerfWidth = parseFloat(document.getElementById('kerfWidthCustom').value) || 0;
        
        // Check each item
        items.forEach(item => {
            if (item.length <= 0) {
                throw new Error(`Item "${item.id}" has invalid length.`);
            }
            
            if (item.quantity <= 0) {
                throw new Error(`Item "${item.id}" has invalid quantity.`);
            }
            
            if (item.length > materialLength) {
                throw new Error(`Item "${item.id}" (${item.length}mm) exceeds material length of ${materialLength}mm.`);
            }
        });
        
        // Validate FF-CA-01 specific parameters
        const { smallRingA, bigRingA, smallRingB, bigRingB, multiplier } = ffca01Params;
        
        if (multiplier <= 0) {
            throw new Error("Multiplier must be greater than 0.");
        }
        
        if ((smallRingA > 0 || bigRingA > 0) && (smallRingA <= 0 || bigRingA <= 0)) {
            throw new Error("For pattern A, both Small Ring and Big Ring must be filled.");
        }
        
        if ((smallRingB > 0 || bigRingB > 0) && (smallRingB <= 0 || bigRingB <= 0)) {
            throw new Error("For pattern B, both Small Ring and Big Ring must be filled.");
        }
        
        return true;
    }

    // Update Item Colors
    function updateItemColors(bars) {
        const uniqueIds = new Set();
        bars.forEach(bar => {
            bar.items.forEach(item => {
                uniqueIds.add(item.originalId);
            });
        });

        const sortedIds = Array.from(uniqueIds).sort();
        const newColors = new Map();
        sortedIds.forEach((id, i) => {
            newColors.set(id, colors[i % colors.length]);
        });
        itemColors = newColors;
    }

    // Display Results
    function displayResults(result) {
        currentResult = result;
        currentBarIndex = 0;
        
        // Show results container, hide empty state
        resultsContainer.classList.remove('hidden');
        emptyResults.classList.add('hidden');
        
        // Update summary stats
        const totalWaste = result.totalWaste || 0;
        const totalMaterialLength = result.totalUsedLength + totalWaste;
        const wastePercentage = totalMaterialLength > 0 ? (totalWaste / totalMaterialLength) * 100 : 0;
        
        // Include custom stats if available
        let customStatsHTML = '';
        if (result.customStats) {
            customStatsHTML = `
                <div class="stat-card">
                    <div class="stat-value">${result.customStats.totalCuts}</div>
                    <div class="stat-label">Total Cuts</div>
                </div>
            `;
        }
        
        summaryStats.innerHTML = `
            ${createStatsCard('Total Bars', result.totalBars)}
            ${createStatsCard('Efficiency', result.overallEfficiency.toFixed(1), '%')}
            ${createStatsCard('Total Waste', totalWaste.toFixed(0), 'mm')}
            ${customStatsHTML}
        `;
        
        // Update item colors
        updateItemColors(result.bars);
        
        // Display first bar
        displayBar(currentBarIndex);
        
        // Update bar counter
        updateBarCounter();
        
        // Setup navigation buttons
        updateNavigationButtons();
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Display Bar
    function displayBar(index) {
        if (!currentResult || !currentResult.bars[index]) return;
        
        const bar = currentResult.bars[index];
        const materialLength = parseFloat(document.getElementById('materialLengthCustom').value) || 6000;
        const kerfWidth = parseFloat(document.getElementById('kerfWidthCustom').value) || 0;
        
        // Create bar visualization
        let barVisualization = '';
        let totalUsed = 0;
        
        bar.items.forEach((item, i) => {
            const widthPercentage = (item.originalLength / materialLength) * 100;
            const color = itemColors.get(item.originalId) || colors[0];
            totalUsed += item.originalLength;
            
            barVisualization += `
                <div class="bar-segment" 
                     style="width: ${widthPercentage}%; background-color: ${color}; border: 1px solid #ffffff;"
                     title="${item.originalId}: ${item.originalLength}mm">
                    <div class="segment-content">
                        ${widthPercentage > 8 ? `<span class="segment-length">${item.originalLength}mm</span>` : ''}
                        ${widthPercentage > 15 ? `<span class="segment-id">${item.originalId}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        // Add waste segment if any
        if (bar.remainingLength > 0) {
            const wastePercentage = (bar.remainingLength / materialLength) * 100;
            barVisualization += `
                <div class="bar-segment" style="width: ${wastePercentage}%; background-color: #e5e7eb; border: 1px solid #d1d5db;">
                    <div class="segment-content">
                        ${wastePercentage > 8 ? `<span class="segment-waste">Waste: ${bar.remainingLength}mm</span>` : ''}
                    </div>
                </div>`;
        }
        
        // Create items list
        let itemsList = '';
        bar.items.forEach(item => {
            const color = itemColors.get(item.originalId) || colors[0];
            itemsList += `
                <div class="bar-item-row">
                    <div class="flex items-center">
                        <span class="item-color-indicator" style="background-color: ${color}"></span>
                        <span class="text-sm text-gray-700">${item.originalId}</span>
                    </div>
                    <div class="text-sm text-gray-600">${item.originalLength} mm</div>
                </div>
            `;
        });
        
        // Update bar details
        barDetails.innerHTML = `
            <div class="bar-info">
                <div>
                    <span class="font-medium text-gray-700">Efficiency:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.efficiency.toFixed(1)}%</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Waste:</span>
                    <span class="ml-2 font-semibold text-gray-900">${bar.remainingLength.toFixed(0)} mm</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700">Pattern:</span>
                    <span class="ml-2 font-semibold text-gray-900">FF-CA-01</span>
                </div>
            </div>
            
            <div class="bar-visualization-container">
                <div class="bar-visualization">
                    ${barVisualization}
                </div>
                <div class="bar-total">
                    <span>Total Length: ${materialLength}mm</span>
                </div>
            </div>
            
            <div class="bar-items-list">
                <h5 class="font-medium text-gray-700 mb-2">Items on this bar (${bar.items.length}):</h5>
                ${itemsList}
            </div>
        `;
        
        // Tambahkan style untuk segment-content
        const style = document.createElement('style');
        style.textContent = `
            .bar-segment {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid #ffffff;
            }
            .bar-segment:last-child {
                border-right: none;
            }
            .segment-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                padding: 2px;
            }
            .segment-length {
                font-size: 11px;
                font-weight: 600;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.7);
                text-align: center;
                word-break: break-word;
                line-height: 1.2;
            }
            .segment-id {
                font-size: 10px;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.7);
                margin-top: 2px;
            }
            .segment-waste {
                font-size: 10px;
                color: #666;
                font-weight: 500;
                text-align: center;
            }
            .bar-total {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-top: 8px;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    // Update Bar Counter
    function updateBarCounter() {
        if (!currentResult) return;
        barCounter.textContent = `Bar ${currentBarIndex + 1} of ${currentResult.bars.length}`;
    }

    // Update Navigation Buttons
    function updateNavigationButtons() {
        if (!currentResult) return;
        if (prevBarBtn) prevBarBtn.disabled = currentBarIndex === 0;
        if (nextBarBtn) nextBarBtn.disabled = currentBarIndex === currentResult.bars.length - 1;
    }

    // Helper function for notifications
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-3"></i>
                <span class="text-white">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-10px)';
                notification.style.transition = 'all 0.3s';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    // Event Listeners
    if (generateCutListBtn) {
        generateCutListBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            try {
                // Generate cut list
                generateCutListFromFFCA01();
            } catch (error) {
                showError('errorCustom', error.message);
            }
        });
    }

    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            try {
                // Get form values
                const materialLength = parseFloat(document.getElementById('materialLengthCustom').value) || 6000;
                const kerfWidth = parseFloat(document.getElementById('kerfWidthCustom').value) || 0;
                const algorithm = document.getElementById('algorithmCustom').value;
                const ffca01Params = getFFCA01Params();
                const items = getItemsFromForm();
                
                // Validate
                validateInputs(items, materialLength, ffca01Params);
                
                // Show loading
                showLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
                errorContainer.classList.add('hidden');
                
                // Apply kerf to items
                const itemsWithKerf = items.map(item => ({
                    ...item,
                    length: item.length
                }));
                
                // Run optimization with delay to show loading
                setTimeout(() => {
                    try {
                        // Use custom optimizer for FF-CA-01
                        const customOptimizer = new CustomOptimizer('ff-ca-01', algorithm);
                        const result = customOptimizer.optimizeFFCA01(ffca01Params, materialLength);
                        
                        // Display results
                        displayResults(result);
                        
                        // Hide loading
                        hideLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
                        
                    } catch (error) {
                        hideLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
                        showError('errorCustom', error.message || 'An unknown error occurred during optimization.');
                    }
                }, 100);
                
            } catch (error) {
                hideLoading('optimizeBtnCustom', 'optimizeTextCustom', 'optimizeSpinnerCustom');
                showError('errorCustom', error.message);
            }
        });
    }

    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            const itemRow = document.createElement('div');
            itemRow.className = 'cut-list-input-group';
            itemRow.innerHTML = `
                <input type="text" name="itemId[]" placeholder="ID" class="w-full">
                <input type="number" name="itemLength[]" placeholder="Length" min="1" step="1" class="w-full">
                <input type="number" name="itemQuantity[]" placeholder="Qty" min="1" step="1" class="w-full">
                <button type="button" class="remove-item-btn btn" style="background-color: #fee2e2; color: #991b1b; border-color: #fecaca;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            cutListContainer.appendChild(itemRow);
            
            // Add remove event listener
            const removeBtn = itemRow.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', function() {
                itemRow.remove();
            });
        });
    }

    if (prevBarBtn) {
        prevBarBtn.addEventListener('click', function() {
            if (currentBarIndex > 0) {
                currentBarIndex--;
                displayBar(currentBarIndex);
                updateBarCounter();
                updateNavigationButtons();
            }
        });
    }

    if (nextBarBtn) {
        nextBarBtn.addEventListener('click', function() {
            if (currentResult && currentBarIndex < currentResult.bars.length - 1) {
                currentBarIndex++;
                displayBar(currentBarIndex);
                updateBarCounter();
                updateNavigationButtons();
            }
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', async function() {
            if (!currentResult) return;
            
            try {
                // Get form data
                const materialLength = 6000; // Fixed material length for FF-CA-01
                const kerfWidth = parseFloat(document.getElementById('kerfWidthCustom').value) || 0;
                const algorithm = document.getElementById('algorithmCustom').value;
                const ffca01Params = getFFCA01Params();
                
                const formData = {
                    materialLength,
                    kerfWidth,
                    algorithm,
                    mode: 'ff-ca-01',
                    ffca01Params
                };
                
                // Show exporting state
                showExporting('exportPdfBtnCustom', 'exportTextCustom', 'exportSpinnerCustom');
                
                // Check if jsPDF is available
                if (typeof window.jspdf === 'undefined') {
                    // Try to load jsPDF dynamically
                    await loadJsPDF();
                }
                
                // Check for custom export function
                if (typeof window.exportCustomToPDF !== 'function') {
                    // Fallback to export1DToPDF
                    if (typeof window.export1DToPDF !== 'function') {
                        throw new Error('PDF export function not loaded.');
                    }
                    console.warn('exportCustomToPDF not found, using export1DToPDF as fallback');
                    await window.export1DToPDF(currentResult, formData, itemColors);
                } else {
                    // Use exportCustomToPDF
                    await window.exportCustomToPDF(currentResult, formData, itemColors);
                }
                
            } catch (error) {
                console.error('PDF Export Error:', error);
                
                // Show user-friendly error
                const errorMessage = error.message || 'Unknown error occurred';
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg';
                notification.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-circle mr-3"></i>
                        <span>PDF Export Failed: ${errorMessage}</span>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // Auto remove after 5 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(-10px)';
                    notification.style.transition = 'all 0.3s';
                    setTimeout(() => notification.remove(), 300);
                }, 5000);
            } finally {
                // Hide exporting state
                hideExporting('exportPdfBtnCustom', 'exportTextCustom', 'exportSpinnerCustom');
            }
        });
    }

    // Fungsi untuk load jsPDF secara dinamis
    function loadJsPDF() {
        return new Promise((resolve, reject) => {
            if (typeof window.jspdf !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF loaded dynamically');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load jsPDF library'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Initialize with sample data
    function initializeWithSampleData() {
        // Set sample values for FF-CA-01
        if (smallRingAInput) smallRingAInput.value = 100;
        if (bigRingAInput) bigRingAInput.value = 200;
        if (smallRingBInput) smallRingBInput.value = 150;
        if (bigRingBInput) bigRingBInput.value = 250;
        if (multiplierInput) multiplierInput.value = 1;
        
        // Generate initial cut list
        generateCutListFromFFCA01();
    }

    // Initialize on load
    setTimeout(initializeWithSampleData, 500);
}

// ============================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ============================================

window.init1DOptimizer = init1DOptimizer;
window.init2DOptimizer = init2DOptimizer;
window.showError = showError;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.zoomInPlate = zoomInPlate;
window.zoomOutPlate = zoomOutPlate;
window.resetPlateZoom = resetPlateZoom;
window.initCustomOptimizer = initCustomOptimizer;