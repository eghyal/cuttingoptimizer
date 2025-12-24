// Custom Algorithms for FF-CA-01 Optimization
// This file extends the optimization-algorithms.js functionality

// Initialize custom optimizer
function initCustomOptimizerModule() {
    console.log("Custom optimizer module initialized");
    
    // Pre-fill form with example values for testing
    const exampleValues = {
        smallRingA: 100,
        bigRingA: 200,
        smallRingB: 120,
        bigRingB: 220,
        multiplier: 1,
        kerfWidth: 2
    };
    
    // Set example values if fields are empty
    Object.keys(exampleValues).forEach(key => {
        const element = document.getElementById(key === 'kerfWidth' ? 'kerfWidthCustom' : key);
        if (element && !element.value) {
            element.value = exampleValues[key];
        }
    });
}

// Enhanced FF-CA-01 optimization with pattern validation
function validateFFCA01Pattern(params) {
    const errors = [];
    
    // Check if at least one pattern has values
    const patternA = params.smallRingA > 0 || params.bigRingA > 0;
    const patternB = params.smallRingB > 0 || params.bigRingB > 0;
    
    if (!patternA && !patternB) {
        errors.push("At least one pattern (A or B) must have ring dimensions");
    }
    
    // Validate individual dimensions
    if (params.smallRingA < 0 || params.bigRingA < 0 || 
        params.smallRingB < 0 || params.bigRingB < 0) {
        errors.push("Ring dimensions cannot be negative");
    }
    
    // Check if small ring is smaller than big ring
    if (params.smallRingA > 0 && params.bigRingA > 0 && 
        params.smallRingA >= params.bigRingA) {
        errors.push("In Pattern A: Small Ring must be smaller than Big Ring");
    }
    
    if (params.smallRingB > 0 && params.bigRingB > 0 && 
        params.smallRingB >= params.bigRingB) {
        errors.push("In Pattern B: Small Ring must be smaller than Big Ring");
    }
    
    // Check multiplier
    if (params.multiplier < 1) {
        errors.push("Multiplier must be at least 1");
    }
    
    // Check kerf width
    if (params.kerfWidth < 0) {
        errors.push("Kerf width cannot be negative");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Calculate total length required for one set
function calculateSetLength(params) {
    let totalLength = 0;
    
    // Pattern A: 4 small rings + 4 big rings
    if (params.smallRingA > 0) totalLength += 4 * (params.smallRingA + params.kerfWidth);
    if (params.bigRingA > 0) totalLength += 4 * (params.bigRingA + params.kerfWidth);
    
    // Pattern B: 4 small rings + 4 big rings
    if (params.smallRingB > 0) totalLength += 4 * (params.smallRingB + params.kerfWidth);
    if (params.bigRingB > 0) totalLength += 4 * (params.bigRingB + params.kerfWidth);
    
    return totalLength;
}

// Estimate number of bars needed
function estimateBarsRequired(params, materialLength = 6000) {
    const setLength = calculateSetLength(params);
    const totalLength = setLength * params.multiplier;
    
    // Simple estimation: total length divided by material length
    const estimatedBars = Math.ceil(totalLength / materialLength);
    
    return {
        setLength: setLength,
        totalLength: totalLength,
        estimatedBars: estimatedBars,
        estimatedEfficiency: (totalLength / (estimatedBars * materialLength)) * 100
    };
}

// Generate detailed item list for display
function generateDetailedItemList(params) {
    const items = [];
    const multiplier = params.multiplier || 1;
    
    // Pattern A items
    if (params.smallRingA > 0) {
        items.push({
            id: 'A-Small',
            description: 'Small Ring Pattern A',
            length: params.smallRingA + params.kerfWidth,
            originalLength: params.smallRingA,
            quantity: 4 * multiplier,
            pattern: 'A',
            type: 'small-ring',
            color: '#60a5fa'
        });
    }
    
    if (params.bigRingA > 0) {
        items.push({
            id: 'A-Big',
            description: 'Big Ring Pattern A',
            length: params.bigRingA + params.kerfWidth,
            originalLength: params.bigRingA,
            quantity: 4 * multiplier,
            pattern: 'A',
            type: 'big-ring',
            color: '#2563eb'
        });
    }
    
    // Pattern B items
    if (params.smallRingB > 0) {
        items.push({
            id: 'B-Small',
            description: 'Small Ring Pattern B',
            length: params.smallRingB + params.kerfWidth,
            originalLength: params.smallRingB,
            quantity: 4 * multiplier,
            pattern: 'B',
            type: 'small-ring',
            color: '#34d399'
        });
    }
    
    if (params.bigRingB > 0) {
        items.push({
            id: 'B-Big',
            description: 'Big Ring Pattern B',
            length: params.bigRingB + params.kerfWidth,
            originalLength: params.bigRingB,
            quantity: 4 * multiplier,
            pattern: 'B',
            type: 'big-ring',
            color: '#059669'
        });
    }
    
    return items;
}

// Format results for display
function formatOptimizationResults(result) {
    const materialLength = 6000; // Default material length
    
    return {
        summary: {
            totalBars: result.totalBars,
            totalItems: result.totalItems,
            totalUsedLength: result.totalUsedLength.toFixed(1),
            totalWaste: result.totalWaste.toFixed(1),
            overallEfficiency: result.overallEfficiency.toFixed(2),
            wastePercentage: ((result.totalWaste / (result.totalBars * materialLength)) * 100).toFixed(2),
            executionTime: result.executionTime
        },
        details: {
            algorithm: result.algorithm,
            mode: result.mode,
            customStats: result.customStats || {},
            bars: result.bars || []
        }
    };
}

// Export functions for use in browser
window.initCustomOptimizerModule = initCustomOptimizerModule;
window.validateFFCA01Pattern = validateFFCA01Pattern;
window.calculateSetLength = calculateSetLength;
window.estimateBarsRequired = estimateBarsRequired;
window.generateDetailedItemList = generateDetailedItemList;
window.formatOptimizationResults = formatOptimizationResults;