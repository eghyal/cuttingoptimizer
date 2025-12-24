// ============================================
// 1D OPTIMIZATION ALGORITHMS
// ============================================

class CuttingItem1D {
    constructor(id, length, quantity) {
        this.id = id;
        this.length = length;
        this.quantity = quantity;
        this.placed = false;
        this.position = 0;
        this.barId = '';
        this.originalLength = length;
        // FIXED: Add originalId to prevent undefined
        this.originalId = this.extractOriginalId(id);
    }

    extractOriginalId(itemId) {
        // Extract base ID without the number suffix
        // Example: "A-1" -> "A", "B-2" -> "B", "Item-3" -> "Item"
        const match = itemId.match(/^(.+)-(\d+)$/);
        return match ? match[1] : itemId;
    }
}

class Bar1D {
    constructor(id, maxLength) {
        this.id = id;
        this.maxLength = maxLength;
        this.items = [];
        this.usedLength = 0;
        this.remainingLength = maxLength;
        this.efficiency = 0;
        this.wastePercentage = 0;
    }

    canPlace(item) {
        return this.remainingLength >= item.length;
    }

    placeItem(item) {
        if (this.canPlace(item)) {
            item.placed = true;
            item.position = this.usedLength;
            item.barId = this.id;
            this.items.push(item);
            this.usedLength += item.length;
            this.remainingLength -= item.length;
            this.efficiency = (this.usedLength / this.maxLength) * 100;
            this.wastePercentage = (this.remainingLength / this.maxLength) * 100;
            return true;
        }
        return false;
    }

    getWaste() {
        return this.remainingLength;
    }
}

class CuttingOptimizer1D {
    constructor(algorithm) {
        this.algorithm = algorithm.toLowerCase();
    }

    optimize(items, materialLength) {
        const startTime = Date.now();
        const allItems = [];
        
        // Create individual items with unique IDs
        items.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                // FIXED: Create item with original ID preserved
                const itemId = `${item.id}-${i + 1}`;
                allItems.push(new CuttingItem1D(itemId, item.length, 1));
            }
        });

        let bars;
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

        const totalBars = bars.length;
        const totalItemsPlaced = bars.reduce((sum, bar) => sum + bar.items.length, 0);
        const totalMaterialLength = totalBars * materialLength;
        const totalUsedLength = bars.reduce((sum, bar) => sum + bar.usedLength, 0);
        const totalWaste = bars.reduce((sum, bar) => sum + bar.getWaste(), 0);
        const overallEfficiency = totalMaterialLength > 0 ? (totalUsedLength / totalMaterialLength) * 100 : 0;
        
        return {
            bars,
            totalBars,
            totalItems: totalItemsPlaced,
            totalUsedLength,
            totalWaste,
            overallEfficiency,
            executionTime: Date.now() - startTime,
            algorithm: this.algorithm,
        };
    }

    firstFitAlgorithm(items, materialLength) {
        const sortedItems = [...items].sort((a, b) => b.length - a.length);
        const bars = [];
        
        sortedItems.forEach(item => {
            let placed = false;
            for (const bar of bars) {
                if (bar.placeItem(item)) {
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                const newBar = new Bar1D(`BAR-${bars.length + 1}`, materialLength);
                if (newBar.placeItem(item)) {
                    bars.push(newBar);
                }
            }
        });
        return bars;
    }

    bestFitAlgorithm(items, materialLength) {
        const sortedItems = [...items].sort((a, b) => b.length - a.length);
        const bars = [];
        
        for (const item of sortedItems) {
            let bestBar = null;
            let bestRemaining = materialLength + 1;
            
            for (const bar of bars) {
                if (bar.canPlace(item)) {
                    const remaining = bar.remainingLength - item.length;
                    if (remaining >= 0 && remaining < bestRemaining) {
                        bestRemaining = remaining;
                        bestBar = bar;
                    }
                }
            }
            
            if (bestBar) {
                bestBar.placeItem(item);
            } else {
                const newBar = new Bar1D(`BAR-${bars.length + 1}`, materialLength);
                if (newBar.placeItem(item)) {
                    bars.push(newBar);
                }
            }
        }
        return bars;
    }

    worstFitAlgorithm(items, materialLength) {
        const sortedItems = [...items].sort((a, b) => b.length - a.length);
        const bars = [];
        
        for (const item of sortedItems) {
            let worstBar = null;
            let worstRemaining = -1;
            
            for (const bar of bars) {
                if (bar.canPlace(item) && bar.remainingLength > worstRemaining) {
                    worstRemaining = bar.remainingLength;
                    worstBar = bar;
                }
            }
            
            if (worstBar) {
                worstBar.placeItem(item);
            } else {
                const newBar = new Bar1D(`BAR-${bars.length + 1}`, materialLength);
                if (newBar.placeItem(item)) {
                    bars.push(newBar);
                }
            }
        }
        return bars;
    }
}

// ============================================
// 2D OPTIMIZATION ALGORITHMS
// ============================================

class CuttingItem2D {
    constructor(id, width, height, quantity, rotation = true) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.quantity = quantity;
        this.canRotate = rotation;
        this.placed = false;
        this.x = 0;
        this.y = 0;
        this.rotated = false;
        this.area = width * height;
        this.originalWidth = width;
        this.originalHeight = height;
        this.originalId = this.extractOriginalId(id);
    }

    extractOriginalId(itemId) {
        // Extract base ID without the number suffix
        const match = itemId.match(/^(.+)-(\d+)$/);
        return match ? match[1] : itemId;
    }

    rotate() {
        if (this.canRotate) {
            [this.width, this.height] = [this.height, this.width];
            this.rotated = !this.rotated;
        }
    }
}

class Plate2D {
    constructor(id, width, height) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.items = [];
        this.usedArea = 0;
        this.totalArea = width * height;
        this.freeRects = [{ x: 0, y: 0, width: width, height: height }];
    }

    getEfficiency() {
        return (this.usedArea / this.totalArea) * 100;
    }

    getWasteArea() {
        return this.totalArea - this.usedArea;
    }

    getWastePercentage() {
        return this.totalArea > 0 ? (this.getWasteArea() / this.totalArea) * 100 : 0;
    }

    canPlace(item, x, y) {
        if (x < 0 || y < 0 || x + item.width > this.width || y + item.height > this.height) {
            return false;
        }
        
        for (const placedItem of this.items) {
            if (x < placedItem.x + placedItem.width &&
                x + item.width > placedItem.x &&
                y < placedItem.y + placedItem.height &&
                y + item.height > placedItem.y) {
                return false;
            }
        }
        return true;
    }

    placeItem(item, x, y) {
        if (this.canPlace(item, x, y)) {
            item.x = x;
            item.y = y;
            item.placed = true;
            this.items.push(item);
            this.usedArea += item.area;
            this.updateFreeRects(item);
            return true;
        }
        return false;
    }

    updateFreeRects(placedItem) {
        const newFreeRects = [];
        
        for (const freeRect of this.freeRects) {
            this.splitFreeRect(freeRect, placedItem).forEach(r => newFreeRects.push(r));
        }
        
        this.freeRects = newFreeRects.filter(rect => !this.isContained(rect, placedItem));
        this.mergeRects();
    }

    splitFreeRect(freeRect, placedItem) {
        if (placedItem.x >= freeRect.x + freeRect.width ||
            placedItem.x + placedItem.width <= freeRect.x ||
            placedItem.y >= freeRect.y + freeRect.height ||
            placedItem.y + placedItem.height <= freeRect.y) {
            return [freeRect];
        }
        
        const newRects = [];
        
        if (placedItem.x > freeRect.x) {
            newRects.push({
                x: freeRect.x,
                y: freeRect.y,
                width: placedItem.x - freeRect.x,
                height: freeRect.height
            });
        }
        
        if (placedItem.x + placedItem.width < freeRect.x + freeRect.width) {
            newRects.push({
                x: placedItem.x + placedItem.width,
                y: freeRect.y,
                width: freeRect.x + freeRect.width - (placedItem.x + placedItem.width),
                height: freeRect.height
            });
        }
        
        if (placedItem.y > freeRect.y) {
            newRects.push({
                x: freeRect.x,
                y: freeRect.y,
                width: freeRect.width,
                height: placedItem.y - freeRect.y
            });
        }
        
        if (placedItem.y + placedItem.height < freeRect.y + freeRect.height) {
            newRects.push({
                x: freeRect.x,
                y: placedItem.y + placedItem.height,
                width: freeRect.width,
                height: freeRect.y + freeRect.height - (placedItem.y + placedItem.height)
            });
        }
        
        return newRects;
    }

    isContained(rectA, rectB) {
        return rectA.x >= rectB.x &&
               rectA.y >= rectB.y &&
               rectA.x + rectA.width <= rectB.x + rectB.width &&
               rectA.y + rectA.height <= rectB.y + rectB.height;
    }

    mergeRects() {
        let i = 0;
        while (i < this.freeRects.length) {
            let j = i + 1;
            while (j < this.freeRects.length) {
                if (this.isContained(this.freeRects[j], this.freeRects[i])) {
                    this.freeRects.splice(j, 1);
                } else if (this.isContained(this.freeRects[i], this.freeRects[j])) {
                    this.freeRects.splice(i, 1);
                    i--;
                    break;
                } else {
                    j++;
                }
            }
            i++;
        }
    }
}

class PlateOptimizer2D {
    constructor(algorithm) {
        this.algorithm = algorithm.toUpperCase();
    }

    optimize(items, plateWidth, plateHeight) {
        const startTime = Date.now();
        const allItems = [];
        
        items.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                allItems.push(new CuttingItem2D(
                    `${item.id}-${i + 1}`,
                    item.width,
                    item.height,
                    1,
                    item.rotation
                ));
            }
        });

        let plates;
        switch (this.algorithm) {
            case 'GUILLOTINE':
            case 'MAXRECTS':
                plates = this.bestFitBinPack(allItems, plateWidth, plateHeight);
                break;
            default:
                plates = this.simpleBinPack(allItems, plateWidth, plateHeight);
        }

        const totalPlates = plates.length;
        const totalItemsPlaced = plates.reduce((sum, p) => sum + p.items.length, 0);
        const totalArea = plates.reduce((sum, p) => sum + p.totalArea, 0);
        const totalUsedArea = plates.reduce((sum, p) => sum + p.usedArea, 0);
        const overallEfficiency = totalArea > 0 ? (totalUsedArea / totalArea) * 100 : 0;

        return {
            plates,
            totalPlates,
            totalItems: totalItemsPlaced,
            totalUsedArea,
            overallEfficiency,
            unplacedItems: allItems.length - totalItemsPlaced,
            executionTime: Date.now() - startTime,
            algorithm: this.algorithm,
        };
    }

    simpleBinPack(items, plateWidth, plateHeight) {
        const plates = [];
        const sortedItems = items.sort((a, b) => b.area - a.area);

        for (const item of sortedItems) {
            if (item.placed) continue;

            let placed = false;
            for (const plate of plates) {
                const pos = this.findPositionSimple(item, plate);
                if (pos) {
                    plate.placeItem(item, pos.x, pos.y);
                    item.rotated = pos.rotated;
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                const newPlate = new Plate2D(`PLATE-${plates.length + 1}`, plateWidth, plateHeight);
                const pos = this.findPositionSimple(item, newPlate);
                if (pos) {
                    newPlate.placeItem(item, pos.x, pos.y);
                    item.rotated = pos.rotated;
                    plates.push(newPlate);
                }
            }
        }
        return plates;
    }

    findPositionSimple(item, plate) {
        // Try without rotation
        for (let y = 0; y <= plate.height - item.height; y++) {
            for (let x = 0; x <= plate.width - item.width; x++) {
                if (plate.canPlace(item, x, y)) {
                    return { x, y, rotated: false };
                }
            }
        }
        
        // Try with rotation
        if (item.canRotate) {
            item.rotate();
            for (let y = 0; y <= plate.height - item.height; y++) {
                for (let x = 0; x <= plate.width - item.width; x++) {
                    if (plate.canPlace(item, x, y)) {
                        return { x, y, rotated: true };
                    }
                }
            }
            item.rotate(); // rotate back
        }
        return null;
    }

    bestFitBinPack(items, plateWidth, plateHeight) {
        const plates = [];
        const sortedItems = items.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));

        for (const item of sortedItems) {
            if (item.placed) continue;
            
            let bestFit = null;
            
            for (const plate of plates) {
                const fit = this.findBestFitForPlate(item, plate);
                if (fit && (!bestFit || fit.score < bestFit.score)) {
                    bestFit = { plate, ...fit };
                }
            }

            if (bestFit) {
                if (bestFit.rotated) item.rotate();
                bestFit.plate.placeItem(item, bestFit.x, bestFit.y);
            } else {
                const newPlate = new Plate2D(`PLATE-${plates.length + 1}`, plateWidth, plateHeight);
                const fit = this.findBestFitForPlate(item, newPlate);
                if (fit) {
                    if (fit.rotated) item.rotate();
                    newPlate.placeItem(item, fit.x, fit.y);
                    plates.push(newPlate);
                }
            }
        }
        return plates;
    }

    findBestFitForPlate(item, plate) {
        let bestFit = null;

        for (let rotated = 0; rotated < (item.canRotate ? 2 : 1); rotated++) {
            const currentItem = new CuttingItem2D(item.id, item.width, item.height, 1, item.canRotate);
            if (rotated === 1) currentItem.rotate();

            for (const rect of plate.freeRects) {
                if (currentItem.width <= rect.width && currentItem.height <= rect.height) {
                    const score = rect.width * rect.height - currentItem.area;
                    if (!bestFit || score < bestFit.score) {
                        bestFit = { x: rect.x, y: rect.y, rotated: rotated === 1, score };
                    }
                }
            }
        }
        return bestFit;
    }
}

// ============================================
// CUSTOM OPTIMIZATION ALGORITHMS - FF-CA-01
// ============================================

class CustomOptimizer {
    constructor(mode = 'ff-ca-01', algorithm = 'first-fit') {
        this.mode = mode;
        this.algorithm = algorithm;
        this.stats = {
            placementsAttempted: 0,
            placementsSuccessful: 0,
            cacheHits: 0,
            cacheMisses: 0,
            executionTime: 0
        };
    }
    
    // Generate items based on FF-CA-01 parameters
    generateFFCA01Items(params) {
        const {
            smallRingA,
            bigRingA,
            smallRingB,
            bigRingB,
            multiplier = 1,
            kerfWidth = 0
        } = params;
        
        const items = [];
        
        // Add items for pattern A
        if (smallRingA > 0) {
            items.push({
                id: 'A-Small',
                length: parseFloat(smallRingA) + parseFloat(kerfWidth),
                quantity: 4 * parseInt(multiplier),
                originalLength: parseFloat(smallRingA),
                type: 'small-ring',
                pattern: 'A'
            });
        }
        
        if (bigRingA > 0) {
            items.push({
                id: 'A-Big',
                length: parseFloat(bigRingA) + parseFloat(kerfWidth),
                quantity: 4 * parseInt(multiplier),
                originalLength: parseFloat(bigRingA),
                type: 'big-ring',
                pattern: 'A'
            });
        }
        
        // Add items for pattern B
        if (smallRingB > 0) {
            items.push({
                id: 'B-Small',
                length: parseFloat(smallRingB) + parseFloat(kerfWidth),
                quantity: 4 * parseInt(multiplier),
                originalLength: parseFloat(smallRingB),
                type: 'small-ring',
                pattern: 'B'
            });
        }
        
        if (bigRingB > 0) {
            items.push({
                id: 'B-Big',
                length: parseFloat(bigRingB) + parseFloat(kerfWidth),
                quantity: 4 * parseInt(multiplier),
                originalLength: parseFloat(bigRingB),
                type: 'big-ring',
                pattern: 'B'
            });
        }
        
        return items.filter(item => item.length > 0 && item.quantity > 0);
    }
    
    // Calculate pattern efficiency
    calculatePatternEfficiency(bars, items) {
        const patternTotals = {
            A: { totalLength: 0, usedLength: 0 },
            B: { totalLength: 0, usedLength: 0 }
        };
        
        // Calculate total length for each pattern
        items.forEach(item => {
            if (item.pattern === 'A') {
                patternTotals.A.totalLength += item.originalLength * item.quantity;
            } else if (item.pattern === 'B') {
                patternTotals.B.totalLength += item.originalLength * item.quantity;
            }
        });
        
        // Calculate used length for each pattern from bars
        bars.forEach(bar => {
            bar.items.forEach(item => {
                const pattern = item.originalId.charAt(0); // 'A' or 'B'
                if (pattern === 'A') {
                    patternTotals.A.usedLength += item.originalLength;
                } else if (pattern === 'B') {
                    patternTotals.B.usedLength += item.originalLength;
                }
            });
        });
        
        // Calculate efficiency percentages
        const efficiencyA = patternTotals.A.totalLength > 0 ? 
            (patternTotals.A.usedLength / patternTotals.A.totalLength) * 100 : 0;
        const efficiencyB = patternTotals.B.totalLength > 0 ? 
            (patternTotals.B.usedLength / patternTotals.B.totalLength) * 100 : 0;
        
        return {
            A: { 
                totalLength: patternTotals.A.totalLength,
                usedLength: patternTotals.A.usedLength,
                efficiency: efficiencyA
            },
            B: { 
                totalLength: patternTotals.B.totalLength,
                usedLength: patternTotals.B.usedLength,
                efficiency: efficiencyB
            }
        };
    }
    
    // Optimize using 1D algorithm with custom parameters
    optimizeFFCA01(params, materialLength = 6000) {
        const startTime = Date.now();
        
        // Generate items from FF-CA-01 parameters
        const customItems = this.generateFFCA01Items(params);
        
        if (customItems.length === 0) {
            throw new Error("No valid items generated from FF-CA-01 parameters");
        }
        
        // Use existing 1D optimizer
        const optimizer = new CuttingOptimizer1D(this.algorithm);
        const result = optimizer.optimize(customItems, materialLength);
        
        // Enhance result with custom data
        result.mode = this.mode;
        result.customParams = params;
        result.generatedItems = customItems;
        result.materialLength = materialLength;
        
        // Calculate additional statistics
        const totalCuts = customItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPatterns = {
            A: customItems.filter(item => item.pattern === 'A').reduce((sum, item) => sum + item.quantity, 0),
            B: customItems.filter(item => item.pattern === 'B').reduce((sum, item) => sum + item.quantity, 0)
        };
        
        result.customStats = {
            totalCuts,
            totalPatterns,
            cutsPerPattern: totalCuts / 2,
            efficiencyByPattern: this.calculatePatternEfficiency(result.bars, customItems)
        };
        
        result.executionTime = Date.now() - startTime;
        this.stats.executionTime = result.executionTime;
        
        return result;
    }
}

// Export for use in browser
window.CuttingOptimizer1D = CuttingOptimizer1D;
window.PlateOptimizer2D = PlateOptimizer2D;
window.Bar1D = Bar1D;
window.Plate2D = Plate2D;
window.CustomOptimizer = CustomOptimizer;