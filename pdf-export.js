let isExporting = false;

function formatNumber(num) {
    if (isNaN(num) || num === null || num === undefined) return '0';
    return Math.round(parseFloat(num)).toLocaleString('en-US');
}

function getItemColor(itemId, itemColors) {
    if (!itemId || !itemColors || !Array.isArray(itemColors)) {
        return {r: 59, g: 130, b: 246}; // Default blue color
    }
    
    // Create a simple hash from the item ID
    let hash = 0;
    for (let i = 0; i < itemId.length; i++) {
        const char = itemId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use the hash to select a color from itemColors array
    const colorIndex = Math.abs(hash) % itemColors.length;
    const color = itemColors[colorIndex];
    
    // Ensure color is in the right format
    if (Array.isArray(color) && color.length >= 3) {
        return {r: color[0], g: color[1], b: color[2]};
    } else if (typeof color === 'object' && color.r !== undefined) {
        return color;
    }
    
    // Fallback color
    return {r: 59, g: 130, b: 246};
}

function addFooter(pdf, currentPage, totalPages) {
    const pageWidth = 210;
    const pageHeight = 297;
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, {align: 'center'});
    pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 15, pageHeight - 10, {align: 'right'});
}

function checkPageBreak(pdf, currentY, minMargin = 25) {
    const pageHeight = 297;
    return currentY + minMargin > pageHeight;
}

function sanitizeText(text) {
    if (!text) return '';
    return text.replace(/[!»«]/g, '')
               .replace(/×/g, 'x')
               .replace(/[^\x00-\x7F]/g, '');
}

function groupUniqueItems(items) {
    const groups = new Map();
    items.forEach(item => {
        let key;
        if (item.originalWidth && item.originalHeight) {
            key = `${item.originalId}_${item.originalWidth}_${item.originalHeight}_${item.rotated || false}`;
        } else {
            key = `${item.originalId}_${item.originalLength}`;
        }
        if (!groups.has(key)) {
            groups.set(key, {
                id: item.originalId || item.id,
                width: item.originalWidth || item.width,
                height: item.originalHeight || item.height,
                length: item.originalLength || item.length,
                rotated: item.rotated || false,
                count: 0
            });
        }
        groups.get(key).count++;
    });
    return Array.from(groups.values());
}

function createBarCuttingResultsTable(pdf, bars, formData, startY) {
    let y = startY;
    const margin = 15;
    const tableWidth = 180;
    const colWidths = [15, 18, 22, 18, 20, 87]; // Bar, Cuts, Used, Waste, Eff, Details
    const headerHeight = 10;
    const rowHeight = 7;
    const fontSize = 8;
    
    // Table title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    pdf.text('BAR CUTTING RESULTS', margin, y);
    y += 12;
    
    // Table header - White background with dark text
    pdf.setFillColor(255, 255, 255); // Putih
    pdf.setTextColor(30, 41, 59); // Warna teks gelap
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');
    
    let currentX = margin;
    const headers = ['Bar', 'Cuts', 'Used Length', 'Waste', 'Efficiency', 'Cut Details'];
    
    // Draw header background and border
    pdf.setDrawColor(226, 232, 240); // Warna border abu-abu terang
    pdf.setLineWidth(0.3);
    
    // Draw header background
    pdf.rect(margin, y, tableWidth, headerHeight, 'F');
    
    // Draw header borders
    pdf.rect(margin, y, tableWidth, headerHeight, 'S'); // Outer border
    
    // Draw vertical borders for each column
    let borderX = margin;
    for (let i = 0; i < headers.length; i++) {
        borderX += colWidths[i];
        pdf.line(borderX, y, borderX, y + headerHeight);
    }
    
    // Draw header text
    currentX = margin;
    for (let i = 0; i < headers.length; i++) {
        pdf.text(headers[i], currentX + 2, y + headerHeight/2 + 2);
        currentX += colWidths[i];
    }
    y += headerHeight;
    
    // Table rows - Alternating colors dengan border penuh
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fontSize);
    
    bars.forEach((bar, index) => {
        // Check for page break
        if (y > 280) {
            pdf.addPage();
            y = 20;
            
            // Repeat header on new page
            pdf.setFillColor(255, 255, 255);
            pdf.setTextColor(30, 41, 59);
            pdf.setFont('helvetica', 'bold');
            
            // Draw header background and border
            pdf.setDrawColor(226, 232, 240);
            pdf.rect(margin, y, tableWidth, headerHeight, 'F');
            pdf.rect(margin, y, tableWidth, headerHeight, 'S');
            
            // Draw vertical borders
            let borderX = margin;
            for (let i = 0; i < headers.length; i++) {
                borderX += colWidths[i];
                pdf.line(borderX, y, borderX, y + headerHeight);
            }
            
            // Draw header text
            currentX = margin;
            for (let i = 0; i < headers.length; i++) {
                pdf.text(headers[i], currentX + 2, y + headerHeight/2 + 2);
                currentX += colWidths[i];
            }
            y += headerHeight;
        }
        
        // Group cuts by length for details
        const cutGroups = {};
        bar.items.forEach(item => {
            const len = item.originalLength || item.length;
            if (!cutGroups[len]) cutGroups[len] = 0;
            cutGroups[len]++;
        });
        
        let details = '';
        Object.keys(cutGroups).sort((a, b) => b - a).forEach((len, i) => {
            if (i > 0) details += ', ';
            details += `${len} mm (${cutGroups[len]})`;
        });
        
        // Alternating row colors dengan border penuh
        if (index % 2 === 0) {
            pdf.setFillColor(255, 255, 255); // Putih untuk baris genap
        } else {
            pdf.setFillColor(248, 250, 252); // Abu-abu sangat terang untuk baris ganjil
        }
        
        // Draw row background dengan border
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, y, tableWidth, rowHeight, 'FD'); // Fill and draw
        
        // Draw vertical borders
        let borderX = margin;
        for (let i = 0; i < headers.length; i++) {
            borderX += colWidths[i];
            pdf.line(borderX, y, borderX, y + rowHeight);
        }
        
        // Set teks warna gelap untuk kontras yang baik
        pdf.setTextColor(30, 41, 59); // Warna slate-800
        
        currentX = margin;
        
        // Bar
        pdf.text(bar.id, currentX + 2, y + rowHeight/2 + 2);
        currentX += colWidths[0];
        
        // Cuts
        pdf.text(bar.items.length.toString(), currentX + 2, y + rowHeight/2 + 2);
        currentX += colWidths[1];
        
        // Used Length
        pdf.text(`${bar.usedLength} mm`, currentX + 2, y + rowHeight/2 + 2);
        currentX += colWidths[2];
        
        // Waste
        pdf.text(`${bar.remainingLength} mm`, currentX + 2, y + rowHeight/2 + 2);
        currentX += colWidths[3];
        
        // Efficiency - warna kondisional berdasarkan nilai
        let efficiencyColor;
        if (bar.efficiency > 90) {
            efficiencyColor = {r: 22, g: 163, b: 74}; // Hijau
        } else if (bar.efficiency > 80) {
            efficiencyColor = {r: 234, g: 88, b: 12}; // Oranye
        } else {
            efficiencyColor = {r: 220, g: 38, b: 38}; // Merah
        }
        pdf.setTextColor(efficiencyColor.r, efficiencyColor.g, efficiencyColor.b);
        pdf.text(`${bar.efficiency}%`, currentX + 2, y + rowHeight/2 + 2);
        pdf.setTextColor(30, 41, 59); // Reset ke warna gelap
        currentX += colWidths[4];
        
        // Cut Details
        pdf.text(details, currentX + 2, y + rowHeight/2 + 2);
        
        y += rowHeight;
    });
    
    return y;
}

function createCompactInputTable(pdf, items, startY, options = {}) {
    const {is2D = false, kerfWidth = 0, maxRowsOnFirstPage = 15} = options;
    let y = startY;
    const margin = 20;
    const tableWidth = 170;
    const fontSize = items.length > 20 ? 8 : 9;
    const rowHeight = items.length > 20 ? 6 : 7;
    const headerHeight = items.length > 20 ? 8 : 10;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize + 1);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Input Cut List', margin, y);
    y += 8;
    
    // Header dengan background putih dan teks gelap
    pdf.setFillColor(255, 255, 255); // Putih
    pdf.rect(margin, y, tableWidth, headerHeight, 'F');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(30, 41, 59); // Teks gelap
    pdf.setFont('helvetica', 'bold');
    
    if (is2D) {
        pdf.text('ID', margin + 5, y + headerHeight/2 + 1);
        pdf.text('Width', margin + 40, y + headerHeight/2 + 1);
        pdf.text('Height', margin + 70, y + headerHeight/2 + 1);
        pdf.text('Qty', margin + 100, y + headerHeight/2 + 1);
        pdf.text('Area', margin + 120, y + headerHeight/2 + 1);
    } else {
        pdf.text('ID', margin + 5, y + headerHeight/2 + 1);
        pdf.text('Length', margin + 40, y + headerHeight/2 + 1);
        pdf.text('Qty', margin + 80, y + headerHeight/2 + 1);
        pdf.text('Total', margin + 110, y + headerHeight/2 + 1);
    }
    
    // Draw header border
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, y, tableWidth, headerHeight, 'S');
    
    y += headerHeight + 4;
    
    const itemsToShowOnFirstPage = items.slice(0, maxRowsOnFirstPage);
    itemsToShowOnFirstPage.forEach((item, index) => {
        if (y > 250 && index >= maxRowsOnFirstPage) {
            return;
        }
        
        pdf.setFont('helvetica', 'normal');
        // Teks warna gelap untuk kontras
        pdf.setTextColor(30, 41, 59);
        
        // Alternating row colors dengan border
        if (index % 2 === 0) {
            pdf.setFillColor(255, 255, 255); // Putih
        } else {
            pdf.setFillColor(248, 250, 252); // Abu-abu sangat terang
        }
        
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, y - rowHeight/2, tableWidth, rowHeight + 1, 'FD');
        
        if (is2D) {
            const actualWidth = Math.round(item.width - kerfWidth);
            const actualHeight = Math.round(item.height - kerfWidth);
            const area = actualWidth * actualHeight;
            const totalArea = area * item.quantity;
            
            pdf.text(sanitizeText(item.id), margin + 5, y);
            pdf.text(formatNumber(actualWidth), margin + 40, y);
            pdf.text(formatNumber(actualHeight), margin + 70, y);
            pdf.text(formatNumber(item.quantity), margin + 100, y);
            pdf.text(formatNumber(totalArea), margin + 120, y);
        } else {
            const actualLength = Math.round(item.length - kerfWidth);
            const totalLength = actualLength * item.quantity;
            
            pdf.text(sanitizeText(item.id), margin + 5, y);
            pdf.text(formatNumber(actualLength), margin + 40, y);
            pdf.text(formatNumber(item.quantity), margin + 80, y);
            pdf.text(formatNumber(totalLength), margin + 110, y);
        }
        
        y += rowHeight;
    });
    
    if (items.length > maxRowsOnFirstPage) {
        const remaining = items.length - maxRowsOnFirstPage;
        pdf.setFontSize(fontSize - 1);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 116, 139); // Warna slate-500
        pdf.text(`...and ${remaining} more items (continued on next page if needed)`, margin, y + 5);
        y += 10;
    }
    
    return y;
}

async function export1DToPDF(result, formData, itemColors) {
    if (isExporting) {
        console.warn('PDF export already in progress');
        return Promise.resolve(false);
    }
    
    return new Promise(async (resolve, reject) => {
        try {
            isExporting = true;
            const {jsPDF} = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            pdf.setProperties({
                title: '1D Cutting Optimization Report',
                subject: 'Linear Material Cutting Analysis',
                author: 'EAV Cutting Optimizer',
                creator: 'Eghy Al Vandi'
            });

            // ===== PAGE 1: Cover and Summary =====
            pdf.setFont('helvetica', 'normal');
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 35, 'F');

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(22);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CUTTING OPTIMIZATION REPORT', 105, 20, {align: 'center'});

            pdf.setFontSize(11);
            pdf.text('1D Linear Material Optimization', 105, 28, {align: 'center'});

            pdf.setTextColor(30, 41, 59);
            let y = 45;

            pdf.setFontSize(16);
            pdf.text('1D CUTTING ANALYSIS', 20, y);
            y += 12;

            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(20, y, 190, y);
            y += 15;

            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Project Summary', 20, y);
            y += 8;

            pdf.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
            pdf.text(`Date: ${dateStr}`, 20, y);
            pdf.text(`Material Length: ${formatNumber(formData.materialLength)} mm`, 110, y);
            y += 6;

            pdf.text(`Algorithm: ${formData.algorithm}`, 20, y);
            pdf.text(`Kerf Width: ${formatNumber(formData.kerfWidth)} mm`, 110, y);
            y += 12;

            pdf.setFont('helvetica', 'bold');
            pdf.text('Optimization Results', 20, y);
            y += 8;

            const totalWaste = parseInt(result.totalWaste) || 0;
            const totalUsedLength = parseInt(result.totalUsedLength) || 0;
            const totalMaterialLength = totalUsedLength + totalWaste;
            const efficiency = totalMaterialLength > 0 ? Math.round((totalUsedLength / totalMaterialLength) * 100) : 0;

            const metrics = [
                {label: 'Total Bars', value: formatNumber(result.totalBars)},
                {label: 'Total Items', value: formatNumber(result.totalItems)},
                {label: 'Material Efficiency', value: `${formatNumber(efficiency)}%`},
                {label: 'Total Waste', value: `${formatNumber(totalWaste)} mm`},
                {label: 'Material Used', value: `${formatNumber(totalUsedLength)} mm`},
                {label: 'Execution Time', value: `${formatNumber(result.executionTime)} ms`}
            ];

            const col1X = 25;
            const col2X = 105;

            metrics.forEach((metric, index) => {
                const x = index % 2 === 0 ? col1X : col2X;
                const rowY = y + Math.floor(index / 2) * 10;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.text(metric.label, x, rowY);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(30, 41, 59);
                pdf.text(metric.value, x + 50, rowY);
            });

            y += 35;

            // Input items table (compact)
            if (formData.items && formData.items.length > 0) {
                const estimatedTableHeight = 30 + (Math.min(formData.items.length, 15) * 6);
                if (!checkPageBreak(pdf, y, estimatedTableHeight + 20)) {
                    y = createCompactInputTable(pdf, formData.items, y, {
                        is2D: false,
                        kerfWidth: formData.kerfWidth,
                        maxRowsOnFirstPage: 15
                    });
                } else {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 41, 59);
                    pdf.text(`Input Items: ${formData.items.length} items (see next page for details)`, 20, y);
                    y += 10;
                }
            }

            // Add footer for page 1
            addFooter(pdf, 1, 2);

            // ===== PAGE 2: Bar Cutting Results Table =====
            pdf.addPage();

            // Create the bar cutting results table with fixed colors
            createBarCuttingResultsTable(pdf, result.bars || [], formData, 20);

            // Add footer for page 2
            addFooter(pdf, 2, 2);

            // Save the PDF
            const fileName = `1D_Cutting_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            isExporting = false;
            resolve(true);

        } catch (error) {
            console.error('PDF export error:', error);
            isExporting = false;
            reject(error);
        }
    });
}

async function export2DToPDF(result, formData, itemColors) {
    if (isExporting) {
        console.warn('PDF export already in progress');
        return Promise.resolve(false);
    }
    return new Promise(async (resolve, reject) => {
        try {
            isExporting = true;
            const {jsPDF} = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setProperties({
                title: '2D Plate Cutting Report',
                subject: 'Sheet Material Optimization Analysis',
                author: 'EAV Cutting Optimizer',
                creator: 'Eghy Al Vandi'
            });
            pdf.setFont('helvetica', 'normal');
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 35, 'F');
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(22);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PLATE CUTTING REPORT', 105, 20, {align: 'center'});
            pdf.setFontSize(11);
            pdf.text('2D Sheet Material Optimization', 105, 28, {align: 'center'});
            pdf.setTextColor(30, 41, 59);
            let y = 45;
            pdf.setFontSize(16);
            pdf.text('2D PLATE ANALYSIS', 20, y);
            y += 12;
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(20, y, 190, y);
            y += 15;
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Project Details', 20, y);
            y += 8;
            pdf.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
            const plateWidth = parseInt(formData.plateWidth) || 2440;
            const plateHeight = parseInt(formData.plateHeight) || 1220;
            const kerfWidth = parseInt(formData.kerfWidth2d) || 0;
            const algorithm = formData.algorithm2d || 'GUILLOTINE';
            pdf.text(`Date: ${dateStr}`, 20, y);
            pdf.text(`Plate Size: ${formatNumber(plateWidth)} × ${formatNumber(plateHeight)} mm`, 110, y);
            y += 6;
            pdf.text(`Algorithm: ${algorithm}`, 20, y);
            pdf.text(`Plate Area: ${formatNumber(plateWidth * plateHeight)} mm²`, 110, y);
            y += 6;
            pdf.text(`Kerf Width: ${formatNumber(kerfWidth)} mm`, 20, y);
            y += 12;
            pdf.setFont('helvetica', 'bold');
            pdf.text('Optimization Results', 20, y);
            y += 8;
            const totalPlates = parseInt(result.totalPlates) || 0;
            const totalUsedArea = parseInt(result.totalUsedArea) || 0;
            const totalPlateArea = totalPlates * plateWidth * plateHeight;
            const totalWasteArea = Math.max(0, totalPlateArea - totalUsedArea);
            const efficiency = totalPlateArea > 0 ? Math.round((totalUsedArea / totalPlateArea) * 100) : 0;
            const metrics = [
                {label: 'Total Plates', value: formatNumber(totalPlates)},
                {label: 'Total Items', value: formatNumber(result.totalItems)},
                {label: 'Material Efficiency', value: `${formatNumber(efficiency)}%`},
                {label: 'Waste Area', value: `${formatNumber(totalWasteArea)} mm²`},
                {label: 'Used Area', value: `${formatNumber(totalUsedArea)} mm²`},
                {label: 'Execution Time', value: `${formatNumber(result.executionTime)} ms`}
            ];
            const col1X = 25;
            const col2X = 105;
            metrics.forEach((metric, index) => {
                const x = index % 2 === 0 ? col1X : col2X;
                const rowY = y + Math.floor(index / 2) * 10;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.text(metric.label, x, rowY);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(30, 41, 59);
                pdf.text(metric.value, x + 50, rowY);
            });
            y += 35;
            if (formData.items && formData.items.length > 0) {
                const estimatedTableHeight = 30 + (Math.min(formData.items.length, 12) * 6);
                if (!checkPageBreak(pdf, y, estimatedTableHeight + 20)) {
                    y = createCompactInputTable(pdf, formData.items, y, {
                        is2D: true,
                        kerfWidth: kerfWidth,
                        maxRowsOnFirstPage: 12
                    });
                } else {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 41, 59);
                    pdf.text(`Input Items: ${formData.items.length} items (see next page for details)`, 20, y);
                    y += 10;
                }
            }
            addFooter(pdf, 1, 1 + (result.plates?.length || 0));
            if (result.plates && result.plates.length > 0) {
                const platesPerPage = 1;
                const totalPlatePages = result.plates.length;
                for (let pageIdx = 0; pageIdx < totalPlatePages; pageIdx++) {
                    pdf.addPage();
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, 210, 25, 'F');
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(13);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('PLATE VISUALIZATION', 105, 15, {align: 'center'});
                    const plate = result.plates[pageIdx];
                    let currentY = 40;
                    pdf.setTextColor(30, 41, 59);
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(`Plate ${plate.id}`, 20, currentY);
                    const plateEfficiency = plate.getEfficiency ? plate.getEfficiency() : Math.round(plate.efficiency || 0);
                    const wasteArea = plate.getWasteArea ? plate.getWasteArea() : Math.round(plate.wasteArea || 0);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(71, 85, 105);
                    pdf.text(`${formatNumber(plateWidth)} × ${formatNumber(plateHeight)} mm | Efficiency: ${formatNumber(plateEfficiency)}% | Items: ${plate.items.length} | Waste: ${formatNumber(wasteArea)} mm²`, 20, currentY + 5);
                    currentY += 12;
                    const vizWidth = 170;
                    const plateRatio = plateHeight / plateWidth;
                    const adjustedHeight = Math.min(vizWidth * plateRatio, 100);
                    const scaleX = vizWidth / plateWidth;
                    const scaleY = adjustedHeight / plateHeight;
                    pdf.setDrawColor(226, 232, 240);
                    pdf.setLineWidth(0.5);
                    pdf.rect(20, currentY, vizWidth, adjustedHeight);
                    plate.items.forEach(item => {
                        const itemX = 20 + (item.x * scaleX);
                        const itemY = currentY + (item.y * scaleY);
                        const itemWidth = item.width * scaleX;
                        const itemHeight = item.height * scaleY;
                        const color = getItemColor(item.originalId, itemColors);
                        pdf.setFillColor(color.r, color.g, color.b);
                        pdf.setDrawColor(255, 255, 255);
                        pdf.setLineWidth(0.3);
                        pdf.rect(itemX, itemY, itemWidth, itemHeight, 'FD');
                        if (itemWidth > 10 && itemHeight > 10) {
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(7);
                            pdf.setFont('helvetica', 'bold');
                            const centerX = itemX + itemWidth / 2;
                            const centerY = itemY + itemHeight / 2;
                            pdf.text(item.originalId, centerX, centerY, {align: 'center', baseline: 'middle'});
                            if (item.rotated) {
                                pdf.setFontSize(5);
                                pdf.text('↻', itemX + itemWidth - 3, itemY + 3);
                            }
                        }
                    });
                    currentY += adjustedHeight + 12;
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 41, 59);
                    pdf.text(`Items on Plate ${plate.id}:`, 20, currentY);
                    currentY += 5;
                    const uniqueItems = groupUniqueItems(plate.items);
                    const maxItems = 12;
                    const itemsToShow = uniqueItems.slice(0, maxItems);
                    const colWidth = 85;
                    const cols = 2;
                    itemsToShow.forEach((item, index) => {
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        const x = 25 + (col * colWidth);
                        const rowY = currentY + (row * 6);
                        const color = getItemColor(item.id, itemColors);
                        const actualWidth = Math.round(item.width - kerfWidth);
                        const actualHeight = Math.round(item.height - kerfWidth);
                        pdf.setFillColor(color.r, color.g, color.b);
                        pdf.rect(x, rowY - 3, 4, 4, 'F');
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(71, 85, 105);
                        let itemText = `${item.id}: ${formatNumber(actualWidth)}×${formatNumber(actualHeight)}`;
                        if (item.rotated) itemText += ' ↻';
                        if (item.count > 1) {
                            itemText += ` (×${item.count})`;
                        }
                        pdf.text(sanitizeText(itemText), x + 7, rowY);
                    });
                    const rowsUsed = Math.ceil(itemsToShow.length / cols);
                    currentY += rowsUsed * 6 + 8;
                    if (uniqueItems.length > maxItems) {
                        pdf.setFontSize(7);
                        pdf.setFont('helvetica', 'italic');
                        pdf.setTextColor(100, 116, 139);
                        pdf.text(`...and ${uniqueItems.length - maxItems} more unique items`, 20, currentY);
                        currentY += 5;
                    }
                    const pageOffset = formData.items && formData.items.length > 12 ? 3 : 2;
                    const currentPage = pageIdx + pageOffset;
                    addFooter(pdf, currentPage, pageOffset + totalPlatePages);
                }
            }
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `2D-Plate-Report-${timestamp}.pdf`;
            setTimeout(() => {
                pdf.save(filename);
                console.log('2D PDF report generated successfully');
                isExporting = false;
                resolve(true);
            }, 100);
        } catch (error) {
            console.error('2D PDF Export Error:', error);
            isExporting = false;
            reject(error);
        }
    });
}

async function exportCustomToPDF(result, formData, itemColors) {
    if (isExporting) {
        console.warn('PDF export already in progress');
        return Promise.resolve(false);
    }
    return new Promise(async (resolve, reject) => {
        try {
            isExporting = true;
            const {jsPDF} = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            pdf.setProperties({
                title: 'FF-CA-01 Cutting Report',
                subject: 'Specialized Ring Pattern Optimization',
                author: 'EAV Cutting Optimizer',
                creator: 'Eghy Al Vandi'
            });

            // ===== PAGE 1: Cover and Summary =====
            pdf.setFont('helvetica', 'normal');
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 35, 'F');

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(22);
            pdf.setFont('helvetica', 'bold');
            pdf.text('FF-CA-01 PATTERN REPORT', 105, 20, {align: 'center'});

            pdf.setFontSize(11);
            pdf.text('Specialized Ring Cutting Pattern', 105, 28, {align: 'center'});

            pdf.setTextColor(30, 41, 59);
            let y = 45;

            pdf.setFontSize(16);
            pdf.text('FF-CA-01 ANALYSIS', 20, y);
            y += 12;

            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(20, y, 190, y);
            y += 15;

            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Pattern Parameters', 20, y);
            y += 8;

            pdf.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
            const materialLength = 6000;
            const kerfWidth = parseInt(formData.kerfWidth) || 0;
            const algorithm = formData.algorithm || 'first-fit';
            const smallRingA = parseInt(formData.smallRingA) || 0;
            const bigRingA = parseInt(formData.bigRingA) || 0;
            const smallRingB = parseInt(formData.smallRingB) || 0;
            const bigRingB = parseInt(formData.bigRingB) || 0;
            const multiplier = parseInt(formData.multiplier) || 1;

            pdf.text(`Date: ${dateStr}`, 20, y);
            pdf.text(`Material Length: ${formatNumber(materialLength)} mm`, 110, y);
            y += 6;

            pdf.text(`Algorithm: ${algorithm}`, 20, y);
            pdf.text(`Kerf Width: ${formatNumber(kerfWidth)} mm`, 110, y);
            y += 6;

            pdf.setTextColor(220, 38, 38);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total Sets: ${formatNumber(multiplier)}`, 20, y);
            pdf.setTextColor(30, 41, 59);
            y += 12;

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(30, 41, 59);
            pdf.text('Pattern Dimensions', 20, y);
            y += 6;

            const tableWidth = 160;
            const tableX = 25;
            const tableY = y;
            pdf.setFillColor(241, 245, 249);
            pdf.rect(tableX, tableY, tableWidth, 8, 'F');
            pdf.setTextColor(71, 85, 105);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            const col1 = 35;
            const col2 = 62;
            const col3 = 63;
            pdf.text('Pattern', tableX + 8, tableY + 5);
            pdf.text('Small Ring', tableX + col1 + 8, tableY + 5);
            pdf.text('Big Ring', tableX + col1 + col2 + 8, tableY + 5);
            y += 8;

            pdf.setFillColor(255, 255, 255);
            pdf.rect(tableX, y, tableWidth, 7, 'F');
            pdf.setTextColor(30, 41, 59);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.text('A', tableX + 8, y + 5);
            pdf.text(`${formatNumber(smallRingA)} mm`, tableX + col1 + 8, y + 5);
            pdf.text(`${formatNumber(bigRingA)} mm`, tableX + col1 + col2 + 8, y + 5);
            y += 7;

            pdf.setFillColor(248, 250, 252);
            pdf.rect(tableX, y, tableWidth, 7, 'F');
            pdf.text('B', tableX + 8, y + 5);
            pdf.text(`${formatNumber(smallRingB)} mm`, tableX + col1 + 8, y + 5);
            pdf.text(`${formatNumber(bigRingB)} mm`, tableX + col1 + col2 + 8, y + 5);
            y += 12;

            // Optimization Results
            pdf.setFont('helvetica', 'bold');
            pdf.text('Optimization Results', 20, y);
            y += 8;

            const totalWaste = parseInt(result.totalWaste) || 0;
            const totalUsedLength = parseInt(result.totalUsedLength) || 0;
            const totalMaterialLength = parseInt(result.totalMaterialLength) || 0;
            const efficiency = totalMaterialLength > 0 ? Math.round((totalUsedLength / totalMaterialLength) * 100) : 0;

            const metrics = [
                {label: 'Total Bars', value: formatNumber(result.totalBars)},
                {label: 'Total Rings', value: formatNumber(result.totalItems)},
                {label: 'Material Efficiency', value: `${formatNumber(efficiency)}%`},
                {label: 'Total Waste', value: `${formatNumber(totalWaste)} mm`},
                {label: 'Material Used', value: `${formatNumber(totalUsedLength)} mm`},
                {label: 'Execution Time', value: `${formatNumber(result.executionTime)} ms`}
            ];

            const col1X = 25;
            const col2X = 105;

            metrics.forEach((metric, index) => {
                const x = index % 2 === 0 ? col1X : col2X;
                const rowY = y + Math.floor(index / 2) * 10;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.text(metric.label, x, rowY);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(30, 41, 59);
                pdf.text(metric.value, x + 50, rowY);
            });

            y += 35;

            // Add footer for page 1
            addFooter(pdf, 1, 2);

            // ===== PAGE 2: Bar Cutting Results Table =====
            pdf.addPage();

            // Create the bar cutting results table (same as 1D optimizer)
            createBarCuttingResultsTable(pdf, result.bars || [], formData, 20);

            // Add footer for page 2
            addFooter(pdf, 2, 2);

            // Save the PDF
            const fileName = `FF-CA-01_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            isExporting = false;
            resolve(true);

        } catch (error) {
            console.error('FF-CA-01 PDF export error:', error);
            isExporting = false;
            reject(error);
        }
    });
}