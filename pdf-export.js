if (typeof window.exportCustomToPDF === 'undefined') {
    window.exportCustomToPDF = async function(result, formData, itemColors) {
        // Fallback ke export1DToPDF jika fungsi custom belum diimplementasi
        if (typeof window.export1DToPDF === 'function') {
            console.log('Using export1DToPDF as fallback for custom export');
            return await window.export1DToPDF(result, formData, itemColors);
        } else {
            throw new Error('PDF export functions not available');
        }
    };
}

// ============================================
// PDF EXPORT FUNCTIONS - REVISED
// ============================================

// Colors for PDF export (matching UI colors)
const PDF_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

// Convert hex color to RGB
function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') {
        return { r: 0, g: 0, b: 0 };
    }
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const bigint = parseInt(hex, 16);
    
    if (isNaN(bigint)) {
        return { r: 0, g: 0, b: 0 };
    }
    
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Format number with thousand separators
function formatNumber(num, decimals = 1) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    
    return num.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: decimals 
    });
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.pdf-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `pdf-notification fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
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

// ============================================
// 1D PDF REPORT
// ============================================

async function export1DToPDF(result, formData, itemColors) {
    return new Promise((resolve, reject) => {
        try {
            if (typeof window.jspdf === 'undefined') {
                throw new Error('PDF library not loaded. Please check your internet connection.');
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Extract form data
            const materialLength = parseFloat(formData.materialLength) || 6000;
            const kerfWidth = parseFloat(formData.kerfWidth) || 0;
            const algorithm = formData.algorithm || 'first-fit';
            
            // Calculate statistics
            const totalMaterialLength = result.totalUsedLength + result.totalWaste;
            const wastePercentage = totalMaterialLength > 0 ? (result.totalWaste / totalMaterialLength) * 100 : 0;
            
            // ========== PAGE 1: COVER & SUMMARY ==========
            // Title
            pdf.setFontSize(20);
            pdf.setTextColor(30, 30, 30);
            pdf.text('1D Cutting Optimization Report', pageWidth / 2, 25, { align: 'center' });
            
            // Generation Date
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, pageWidth / 2, 32, { align: 'center' });
            
            // Horizontal divider
            pdf.setDrawColor(220, 220, 220);
            pdf.line(20, 36, pageWidth - 20, 36);
            
            // Executive Summary Title
            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Executive Summary', 20, 48);
            
            // Summary data
            let yPos = 58;
            const summaryData = [
                ['Material Length', `${materialLength} mm`],
                ['Total Bars Used', result.totalBars.toString()],
                ['Overall Efficiency', `${result.overallEfficiency.toFixed(1)}%`],
                ['Total Waste', `${result.totalWaste.toFixed(1)} mm (${wastePercentage.toFixed(1)}%)`],
                ['Algorithm', algorithm],
                ['Kerf Width', `${kerfWidth} mm`]
            ];
            
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            
            summaryData.forEach((row, index) => {
                const bgColor = index % 2 === 0 ? [250, 250, 250] : [245, 245, 245];
                pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                pdf.rect(25, yPos - 2, pageWidth - 50, 6, 'F');
                
                pdf.setFont(undefined, 'bold');
                pdf.text(row[0] + ':', 30, yPos + 1);
                pdf.setFont(undefined, 'normal');
                pdf.text(row[1], pageWidth - 30, yPos + 1, { align: 'right' });
                yPos += 6;
            });
            
            yPos += 8;
            
            // Input Cut List Title
            pdf.setFontSize(12);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Input Cut List', 20, yPos);
            yPos += 8;
            
            // Group input items
            const groupedInputItems = {};
            if (formData.items && Array.isArray(formData.items)) {
                formData.items.forEach(item => {
                    if (item && item.length > 0 && item.quantity > 0) {
                        const lengthWithoutKerf = item.length - kerfWidth;
                        const key = `${lengthWithoutKerf}`;
                        if (!groupedInputItems[key]) {
                            groupedInputItems[key] = { 
                                id: item.id || 'Item', 
                                length: lengthWithoutKerf, 
                                quantity: 0 
                            };
                        }
                        groupedInputItems[key].quantity += item.quantity;
                    }
                });
            }
            
            // Table Header
            pdf.setFillColor(70, 70, 70);
            pdf.rect(25, yPos, pageWidth - 50, 5, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            
            pdf.text('Item ID', 30, yPos + 3.5);
            pdf.text('Length (mm)', 80, yPos + 3.5);
            pdf.text('Quantity', pageWidth - 30, yPos + 3.5, { align: 'right' });
            
            yPos += 6;
            pdf.setTextColor(40, 40, 40);
            pdf.setFont(undefined, 'normal');
            
            // Table Rows
            const inputItems = Object.values(groupedInputItems).sort((a, b) => b.length - a.length);
            
            if (inputItems.length > 0) {
                inputItems.forEach((item, index) => {
                    const fillColor = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
                    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
                    pdf.rect(25, yPos, pageWidth - 50, 5, 'F');
                    
                    pdf.text(item.id.toString(), 30, yPos + 3.5);
                    pdf.text(formatNumber(item.length), 80, yPos + 3.5);
                    pdf.text(item.quantity.toString(), pageWidth - 30, yPos + 3.5, { align: 'right' });
                    
                    yPos += 5;
                });
            }
            
            // Footer for page 1
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text('Page 1 of 2', pageWidth - 20, pageHeight - 10, { align: 'right' });
            
            // ========== PAGE 2: BAR LAYOUT DIAGRAMS ==========
            pdf.addPage();
            
            // Title
            pdf.setFontSize(16);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Bar Layout Diagrams', pageWidth / 2, 20, { align: 'center' });
            
            const bars = result.bars || [];
            let barY = 30;
            const maxBarsPerPage = 4;
            
            for (let i = 0; i < bars.length; i++) {
                const bar = bars[i];
                
                // Check if we need a new page
                if (i > 0 && i % maxBarsPerPage === 0) {
                    pdf.addPage();
                    barY = 20;
                }
                
                // Bar header
                pdf.setFontSize(9);
                pdf.setTextColor(50, 50, 50);
                const headerText = `${bar.id} (Eff: ${bar.efficiency.toFixed(1)}%, Waste: ${formatNumber(bar.remainingLength)}mm)`;
                pdf.text(headerText, 25, barY);
                
                // Bar visualization
                const barWidth = pageWidth - 50;
                const barHeight = 10;
                
                // Draw bar background with subtle border
                pdf.setDrawColor(180, 180, 180);
                pdf.setFillColor(245, 245, 245);
                pdf.rect(25, barY + 3, barWidth, barHeight, 'FD');
                
                let currentX = 25;
                
                // Draw segments
                if (bar.items && Array.isArray(bar.items)) {
                    bar.items.forEach(item => {
                        const segmentWidth = ((item.originalLength || item.length || 0) / materialLength) * barWidth;
                        const color = hexToRgb(itemColors.get(item.originalLength) || PDF_COLORS[0]);
                        
                        // Draw segment
                        pdf.setFillColor(color.r, color.g, color.b);
                        pdf.rect(currentX, barY + 3, segmentWidth, barHeight, 'F');
                        
                        // Add border between segments
                        pdf.setDrawColor(255, 255, 255);
                        pdf.setLineWidth(0.5);
                        pdf.line(currentX, barY + 3, currentX, barY + 3 + barHeight);
                        
                        // Add length label
                        if (segmentWidth > 25) {
                            pdf.setFontSize(7);
                            pdf.setTextColor(255, 255, 255);
                            const text = (item.originalLength || item.length || 0).toString();
                            const textWidth = pdf.getTextWidth(text);
                            
                            if (textWidth < segmentWidth - 8) {
                                pdf.text(
                                    text,
                                    currentX + segmentWidth / 2,
                                    barY + 3 + barHeight / 2,
                                    { align: 'center', baseline: 'middle' }
                                );
                            } else if (segmentWidth > 15) {
                                // Try abbreviated
                                const abbreviated = text.length > 4 ? text.substring(0, 3) + '..' : text;
                                pdf.text(
                                    abbreviated,
                                    currentX + segmentWidth / 2,
                                    barY + 3 + barHeight / 2,
                                    { align: 'center', baseline: 'middle' }
                                );
                            }
                        }
                        
                        currentX += segmentWidth;
                    });
                }
                
                // Draw waste area with pattern
                if (bar.remainingLength > 0) {
                    const wasteWidth = (bar.remainingLength / materialLength) * barWidth;
                    
                    // Cross-hatch pattern for waste
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.2);
                    
                    // Draw diagonal lines for waste area
                    const patternSpacing = 3;
                    for (let offset = 0; offset < wasteWidth; offset += patternSpacing) {
                        const startX = currentX + offset;
                        pdf.line(
                            startX, 
                            barY + 3, 
                            startX + Math.min(patternSpacing, wasteWidth - offset), 
                            barY + 3 + barHeight
                        );
                    }
                    
                    // Light background for waste
                    pdf.setFillColor(248, 248, 248);
                    pdf.rect(currentX, barY + 3, wasteWidth, barHeight, 'F');
                    
                    // Add waste label
                    if (wasteWidth > 30) {
                        pdf.setFontSize(6);
                        pdf.setTextColor(150, 150, 150);
                        pdf.text(
                            'WASTE',
                            currentX + wasteWidth / 2,
                            barY + 3 + barHeight / 2,
                            { align: 'center', baseline: 'middle' }
                        );
                    }
                }
                
                // Draw outer border
                pdf.setDrawColor(150, 150, 150);
                pdf.setLineWidth(0.3);
                pdf.rect(25, barY + 3, barWidth, barHeight, 'D');
                
                barY += 25;
            }
            
            // Footer for page 2
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text('Page 2 of 2', pageWidth - 20, pageHeight - 10, { align: 'right' });
            
            // ========== SAVE PDF ==========
            const filename = `1D-Cutting-Report-${new Date().toISOString().slice(0,10)}.pdf`;
            pdf.save(filename);
            
            showNotification('1D PDF report generated successfully!', 'success');
            resolve(true);
            
        } catch (error) {
            console.error('Error generating 1D PDF:', error);
            showNotification('Failed to generate PDF: ' + error.message, 'error');
            reject(error);
        }
    });
}

// ============================================
// 2D PDF REPORT
// ============================================

async function export2DToPDF(result, formData, itemColors) {
    return new Promise((resolve, reject) => {
        try {
            if (typeof window.jspdf === 'undefined') {
                throw new Error('PDF library not loaded. Please check your internet connection.');
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Extract form data
            const plateWidth = parseFloat(formData.plateWidth) || 2440;
            const plateHeight = parseFloat(formData.plateHeight) || 1220;
            const kerfWidth = parseFloat(formData.kerfWidth2d) || 0;
            const algorithm = formData.algorithm2d || 'GUILLOTINE';
            
            // Calculate statistics
            const totalArea = (result.totalPlates || 0) * plateWidth * plateHeight;
            const totalUsedArea = result.totalUsedArea || 0;
            const totalWasteArea = totalArea - totalUsedArea;
            const wastePercentage = totalArea > 0 ? (totalWasteArea / totalArea) * 100 : 0;
            
            // ========== PAGE 1: COVER & SUMMARY ==========
            // Title
            pdf.setFontSize(20);
            pdf.setTextColor(30, 30, 30);
            pdf.text('2D Cutting Optimization Report', pageWidth / 2, 25, { align: 'center' });
            
            // Generation Date
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, pageWidth / 2, 32, { align: 'center' });
            
            // Horizontal divider
            pdf.setDrawColor(220, 220, 220);
            pdf.line(20, 36, pageWidth - 20, 36);
            
            // Executive Summary Title
            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Executive Summary', 20, 48);
            
            // Summary data
            let yPos = 58;
            const summaryData = [
                ['Plate Size', `${plateWidth} x ${plateHeight} mm`],
                ['Total Plates Used', result.totalPlates.toString()],
                ['Overall Efficiency', `${result.overallEfficiency.toFixed(2)}%`],
                ['Total Waste Area', `${formatNumber(totalWasteArea)} mm² (${wastePercentage.toFixed(1)}%)`],
                ['Unplaced Items', result.unplacedItems.toString()],
                ['Algorithm', algorithm],
                ['Kerf Width', `${kerfWidth} mm`]
            ];
            
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            
            summaryData.forEach((row, index) => {
                const bgColor = index % 2 === 0 ? [250, 250, 250] : [245, 245, 245];
                pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                pdf.rect(25, yPos - 2, pageWidth - 50, 6, 'F');
                
                pdf.setFont(undefined, 'bold');
                pdf.text(row[0] + ':', 30, yPos + 1);
                pdf.setFont(undefined, 'normal');
                pdf.text(row[1], pageWidth - 30, yPos + 1, { align: 'right' });
                yPos += 6;
            });
            
            yPos += 8;
            
            // Input Cut List Title
            pdf.setFontSize(12);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Input Cut List', 20, yPos);
            yPos += 8;
            
            // Group input items
            const groupedInputItems = {};
            if (formData.items && Array.isArray(formData.items)) {
                formData.items.forEach(item => {
                    if (item && item.width > 0 && item.height > 0 && item.quantity > 0) {
                        const widthWithoutKerf = item.width - kerfWidth;
                        const heightWithoutKerf = item.height - kerfWidth;
                        const key = `${widthWithoutKerf}x${heightWithoutKerf}`;
                        if (!groupedInputItems[key]) {
                            groupedInputItems[key] = { 
                                id: item.id || 'Item',
                                width: widthWithoutKerf,
                                height: heightWithoutKerf,
                                rotation: item.rotation,
                                quantity: 0 
                            };
                        }
                        groupedInputItems[key].quantity += item.quantity;
                    }
                });
            }
            
            // Table Header
            pdf.setFillColor(70, 70, 70);
            pdf.rect(25, yPos, pageWidth - 50, 5, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            
            pdf.text('Item ID', 30, yPos + 3.5);
            pdf.text('Size (W x H)', 70, yPos + 3.5);
            pdf.text('Qty', 120, yPos + 3.5);
            pdf.text('Rotation', 150, yPos + 3.5);
            
            yPos += 6;
            pdf.setTextColor(40, 40, 40);
            pdf.setFont(undefined, 'normal');
            
            // Table Rows
            const inputItems = Object.values(groupedInputItems).sort((a, b) => (b.width * b.height) - (a.width * a.height));
            
            if (inputItems.length > 0) {
                inputItems.forEach((item, index) => {
                    const fillColor = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
                    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
                    pdf.rect(25, yPos, pageWidth - 50, 5, 'F');
                    
                    pdf.text((item.id || 'Item').toString(), 30, yPos + 3.5);
                    pdf.text(`${item.width} × ${item.height}`, 70, yPos + 3.5);
                    pdf.text(item.quantity.toString(), 120, yPos + 3.5);
                    pdf.text(item.rotation ? 'Yes' : 'No', 150, yPos + 3.5);
                    
                    yPos += 5;
                });
            }
            
            // Footer for page 1
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text(`Page 1 of ${result.plates.length + 1}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
            
            // ========== PLATE LAYOUT PAGES ==========
            const plates = result.plates || [];
            
            for (let i = 0; i < plates.length; i++) {
                pdf.addPage();
                
                const plate = plates[i];
                const plateEfficiency = plate.getEfficiency ? plate.getEfficiency() : 0;
                const plateWasteArea = plate.getWasteArea ? plate.getWasteArea() : 0;
                const plateWastePercentage = plate.getWastePercentage ? plate.getWastePercentage() : 0;
                
                // Plate title
                pdf.setFontSize(16);
                pdf.setTextColor(40, 40, 40);
                const plateTitle = `Plate Layout: ${plate.id || `PLATE-${i + 1}`}`;
                pdf.text(plateTitle, pageWidth / 2, 20, { align: 'center' });
                
                // Plate info
                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 80);
                
                // Create a compact info box
                const infoBoxWidth = 160;
                const infoBoxX = (pageWidth - infoBoxWidth) / 2;
                
                pdf.setFillColor(245, 245, 245);
                pdf.rect(infoBoxX, 25, infoBoxWidth, 12, 'F');
                
                pdf.setDrawColor(200, 200, 200);
                pdf.rect(infoBoxX, 25, infoBoxWidth, 12, 'D');
                
                // Efficiency
                pdf.setFont(undefined, 'bold');
                pdf.text('Efficiency', infoBoxX + 10, 32);
                pdf.setFont(undefined, 'normal');
                pdf.text(`${plateEfficiency.toFixed(1)}%`, infoBoxX + 50, 32);
                
                // Waste
                pdf.setFont(undefined, 'bold');
                pdf.text('Waste', infoBoxX + 90, 32);
                pdf.setFont(undefined, 'normal');
                pdf.text(`${formatNumber(plateWasteArea)} mm²`, infoBoxX + 115, 32);
                
                // Plate visualization
                const visualY = 45;
                const visualWidth = pageWidth - 60;
                const visualHeight = 140;
                
                // Calculate aspect ratio
                const plateAspect = plateWidth / plateHeight;
                const visualAspect = visualWidth / visualHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (plateAspect > visualAspect) {
                    // Width is limiting factor
                    drawWidth = visualWidth;
                    drawHeight = drawWidth / plateAspect;
                } else {
                    // Height is limiting factor
                    drawHeight = visualHeight;
                    drawWidth = drawHeight * plateAspect;
                }
                
                // Center the drawing
                drawX = (pageWidth - drawWidth) / 2;
                drawY = visualY;
                
                // Draw plate background with shadow effect
                pdf.setFillColor(250, 250, 250);
                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.5);
                pdf.rect(drawX, drawY, drawWidth, drawHeight, 'FD');
                
                // Add subtle grid lines for scale reference
                pdf.setDrawColor(230, 230, 230);
                pdf.setLineWidth(0.1);
                
                // Draw vertical grid lines
                const gridLines = 5;
                for (let g = 1; g < gridLines; g++) {
                    const x = drawX + (drawWidth / gridLines) * g;
                    pdf.line(x, drawY, x, drawY + drawHeight);
                }
                
                // Draw horizontal grid lines
                for (let g = 1; g < gridLines; g++) {
                    const y = drawY + (drawHeight / gridLines) * g;
                    pdf.line(drawX, y, drawX + drawWidth, y);
                }
                
                // Draw items with borders and labels
                if (plate.items && Array.isArray(plate.items)) {
                    plate.items.forEach(item => {
                        if (!item) return;
                        
                        const x = drawX + (item.x / plateWidth) * drawWidth;
                        const y = drawY + (item.y / plateHeight) * drawHeight;
                        const w = (item.width / plateWidth) * drawWidth;
                        const h = (item.height / plateHeight) * drawHeight;
                        
                        // Get color for this item
                        const color = hexToRgb(itemColors.get(item.originalId) || PDF_COLORS[i % PDF_COLORS.length]);
                        
                        // Draw item rectangle with border
                        pdf.setFillColor(color.r, color.g, color.b);
                        pdf.setDrawColor(255, 255, 255);
                        pdf.setLineWidth(0.5);
                        pdf.rect(x, y, w, h, 'FD');
                        
                        // Add item label
                        if (w > 20 && h > 12) {
                            pdf.setFontSize(7);
                            pdf.setTextColor(255, 255, 255);
                            
                            // Add text shadow for better readability
                            pdf.setTextColor(0, 0, 0, 30);
                            pdf.text(
                                item.originalId || item.id || 'Item',
                                x + w / 2 + 0.3,
                                y + h / 2 + 0.3,
                                { align: 'center', baseline: 'middle' }
                            );
                            
                            pdf.setTextColor(255, 255, 255);
                            pdf.text(
                                item.originalId || item.id || 'Item',
                                x + w / 2,
                                y + h / 2,
                                { align: 'center', baseline: 'middle' }
                            );
                            
                            // Add dimensions
                            if (w > 25 && h > 20) {
                                pdf.setFontSize(6);
                                const actualWidth = item.width - kerfWidth;
                                const actualHeight = item.height - kerfWidth;
                                pdf.text(
                                    `${actualWidth}×${actualHeight}`,
                                    x + w / 2,
                                    y + h / 2 + 4,
                                    { align: 'center', baseline: 'middle' }
                                );
                            }
                        } else if (w > 10 && h > 8) {
                            // Use abbreviated label
                            pdf.setFontSize(6);
                            pdf.setTextColor(255, 255, 255);
                            const label = item.originalId || item.id || 'Item';
                            const abbreviated = label.length > 3 ? label.substring(0, 2) + '.' : label;
                            pdf.text(
                                abbreviated,
                                x + w / 2,
                                y + h / 2,
                                { align: 'center', baseline: 'middle' }
                            );
                        }
                        
                        // Add rotation indicator
                        if (item.rotated && w > 15 && h > 10) {
                            pdf.setFontSize(5);
                            pdf.setTextColor(255, 255, 255);
                            pdf.text(
                                'R',
                                x + 2,
                                y + 2
                            );
                        }
                    });
                }
                
                // Add plate dimensions label
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.text(
                    `${plateWidth} × ${plateHeight} mm`,
                    pageWidth / 2,
                    drawY + drawHeight + 8,
                    { align: 'center' }
                );
                
                // Items legend
                const legendStartY = drawY + drawHeight + 15;
                pdf.setFontSize(9);
                pdf.setTextColor(60, 60, 60);
                
                if (plate.items && plate.items.length > 0) {
                    // Group items by type for summary
                    const itemGroups = {};
                    plate.items.forEach(item => {
                        const id = item.originalId || item.id || 'Item';
                        if (!itemGroups[id]) {
                            itemGroups[id] = {
                                id,
                                count: 0,
                                rotated: item.rotated,
                                color: itemColors.get(item.originalId) || PDF_COLORS[0]
                            };
                        }
                        itemGroups[id].count++;
                    });
                    
                    // Display grouped items in a compact grid
                    const groups = Object.values(itemGroups);
                    const itemsPerRow = 3;
                    const itemWidth = 50;
                    let col = 0;
                    let row = 0;
                    
                    groups.forEach((group, index) => {
                        const legendX = 30 + (col * itemWidth);
                        const legendY = legendStartY + (row * 8);
                        
                        if (legendY < pageHeight - 20) {
                            const color = hexToRgb(group.color);
                            
                            // Color indicator with border
                            pdf.setFillColor(color.r, color.g, color.b);
                            pdf.setDrawColor(200, 200, 200);
                            pdf.rect(legendX, legendY - 3, 6, 6, 'FD');
                            
                            // Item text
                            pdf.text(
                                `${group.id}: ${group.count}${group.rotated ? ' (R)' : ''}`,
                                legendX + 9,
                                legendY
                            );
                            
                            col++;
                            if (col >= itemsPerRow) {
                                col = 0;
                                row++;
                            }
                        }
                    });
                }
                
                // Footer
                pdf.setFontSize(8);
                pdf.setTextColor(150, 150, 150);
                pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, { align: 'center' });
                pdf.text(`Page ${i + 2} of ${plates.length + 1}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
            }
            
            // ========== SAVE PDF ==========
            const filename = `2D-Cutting-Report-${new Date().toISOString().slice(0,10)}.pdf`;
            pdf.save(filename);
            
            showNotification('2D PDF report generated successfully!', 'success');
            resolve(true);
            
        } catch (error) {
            console.error('Error generating 2D PDF:', error);
            showNotification('Failed to generate PDF: ' + error.message, 'error');
            reject(error);
        }
    });
}

// ============================================
// CUSTOM PDF REPORT (FF-CA-01) - REVISI: Tambah gambar FF-CA-01
// ============================================

async function exportCustomToPDFFull(result, formData, itemColors) {
    return new Promise((resolve, reject) => {
        try {
            if (typeof window.jspdf === 'undefined') {
                throw new Error('PDF library not loaded. Please check your internet connection.');
            }
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Extract form data
            const materialLength = 6000; // Fixed for FF-CA-01
            const kerfWidth = parseFloat(formData.kerfWidth) || 0;
            const algorithm = formData.algorithm || 'first-fit';
            const mode = formData.mode || 'ff-ca-01';
            const ffca01Params = formData.ffca01Params || {};
            
            // Calculate statistics
            const totalMaterialLength = result.totalUsedLength + result.totalWaste;
            const wastePercentage = totalMaterialLength > 0 ? (result.totalWaste / totalMaterialLength) * 100 : 0;
            
            // ========== PAGE 1: COVER & FF-CA-01 PARAMETERS ==========
            // Title
            pdf.setFontSize(20);
            pdf.setTextColor(30, 30, 30);
            pdf.text(`${mode.toUpperCase()} Cutting Optimization Report`, pageWidth / 2, 25, { align: 'center' });
            
            // Generation Date
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, pageWidth / 2, 32, { align: 'center' });
            
            // Horizontal divider
            pdf.setDrawColor(220, 220, 220);
            pdf.line(20, 36, pageWidth - 20, 36);
            
            // FF-CA-01 Parameters Title
            pdf.setFontSize(14);
            pdf.setTextColor(40, 40, 40);
            pdf.text('FF-CA-01 Parameters', 20, 48);
            
            // FF-CA-01 diagram/image placeholder
            pdf.setFontSize(10);
            pdf.setTextColor(80, 80, 80);
            pdf.text('Pattern Diagram:', 25, 58);
            
            // REVISI: Draw FF-CA-01 pattern diagram
            const diagramY = 62;
            const diagramWidth = 60;
            
            // Pattern A
            pdf.setDrawColor(59, 130, 246);
            pdf.setFillColor(219, 234, 254);
            pdf.roundedRect(25, diagramY, diagramWidth, 15, 2, 2, 'FD');
            pdf.setFontSize(8);
            pdf.setTextColor(30, 64, 175);
            pdf.text('Pattern A', 30, diagramY + 5);
            pdf.text(`Small: ${ffca01Params.smallRingA || 0}mm`, 30, diagramY + 10);
            pdf.text(`Big: ${ffca01Params.bigRingA || 0}mm`, 30, diagramY + 14);
            
            // Pattern B
            pdf.setDrawColor(16, 185, 129);
            pdf.setFillColor(220, 252, 231);
            pdf.roundedRect(25, diagramY + 20, diagramWidth, 15, 2, 2, 'FD');
            pdf.setTextColor(6, 95, 70);
            pdf.text('Pattern B', 30, diagramY + 25);
            pdf.text(`Small: ${ffca01Params.smallRingB || 0}mm`, 30, diagramY + 30);
            pdf.text(`Big: ${ffca01Params.bigRingB || 0}mm`, 30, diagramY + 34);
            
            // Multiplier
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`Multiplier: ${ffca01Params.multiplier || 1}x`, 25, diagramY + 45);
            
            // Parameters table
            let yPos = diagramY + 55;
            const paramsData = [
                ['Material Length', `${materialLength} mm`],
                ['Total Bars Used', result.totalBars.toString()],
                ['Overall Efficiency', `${result.overallEfficiency.toFixed(1)}%`],
                ['Total Waste', `${result.totalWaste.toFixed(1)} mm (${wastePercentage.toFixed(1)}%)`],
                ['Algorithm', algorithm],
                ['Kerf Width', `${kerfWidth} mm`],
                ['Total Cuts', result.customStats?.totalCuts || '0'],
                ['Mode', mode.toUpperCase()]
            ];
            
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            
            paramsData.forEach((row, index) => {
                const bgColor = index % 2 === 0 ? [250, 250, 250] : [245, 245, 245];
                pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                pdf.rect(25, yPos - 2, pageWidth - 50, 6, 'F');
                
                pdf.setFont(undefined, 'bold');
                pdf.text(row[0] + ':', 30, yPos + 1);
                pdf.setFont(undefined, 'normal');
                pdf.text(row[1], pageWidth - 30, yPos + 1, { align: 'right' });
                yPos += 6;
            });
            
            yPos += 8;
            
            // REVISI: Input Cut List Title dengan gambar FF-CA-01
            pdf.setFontSize(12);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Input Cut List with FF-CA-01 Pattern', 20, yPos);
            yPos += 8;
            
            // Table Header for generated items
            pdf.setFillColor(70, 70, 70);
            pdf.rect(25, yPos, pageWidth - 50, 5, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            
            pdf.text('Item ID', 30, yPos + 3.5);
            pdf.text('Length (mm)', 80, yPos + 3.5);
            pdf.text('Quantity', 130, yPos + 3.5);
            pdf.text('Pattern', 170, yPos + 3.5);
            
            yPos += 6;
            pdf.setTextColor(40, 40, 40);
            pdf.setFont(undefined, 'normal');
            
            // Table Rows from generated items
            if (result.generatedItems && Array.isArray(result.generatedItems)) {
                result.generatedItems.forEach((item, index) => {
                    const fillColor = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
                    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
                    pdf.rect(25, yPos, pageWidth - 50, 5, 'F');
                    
                    pdf.text(item.id.toString(), 30, yPos + 3.5);
                    pdf.text(formatNumber(item.originalLength || item.length), 80, yPos + 3.5);
                    pdf.text(item.quantity.toString(), 130, yPos + 3.5);
                    pdf.text(item.pattern || '-', 170, yPos + 3.5);
                    
                    yPos += 5;
                });
            }
            
            // Footer for page 1
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text('Page 1 of 2', pageWidth - 20, pageHeight - 10, { align: 'right' });
            
            // ========== PAGE 2: BAR LAYOUT DIAGRAMS ==========
            pdf.addPage();
            
            // Title
            pdf.setFontSize(16);
            pdf.setTextColor(40, 40, 40);
            pdf.text('Bar Layout Diagrams', pageWidth / 2, 20, { align: 'center' });
            
            const bars = result.bars || [];
            let barY = 30;
            const maxBarsPerPage = 4;
            
            for (let i = 0; i < bars.length; i++) {
                const bar = bars[i];
                
                // Check if we need a new page
                if (i > 0 && i % maxBarsPerPage === 0) {
                    pdf.addPage();
                    barY = 20;
                }
                
                // Bar header
                pdf.setFontSize(9);
                pdf.setTextColor(50, 50, 50);
                const headerText = `${bar.id} (Eff: ${bar.efficiency.toFixed(1)}%, Waste: ${formatNumber(bar.remainingLength)}mm)`;
                pdf.text(headerText, 25, barY);
                
                // Bar visualization
                const barWidth = pageWidth - 50;
                const barHeight = 10;
                
                // Draw bar background with subtle border
                pdf.setDrawColor(180, 180, 180);
                pdf.setFillColor(245, 245, 245);
                pdf.rect(25, barY + 3, barWidth, barHeight, 'FD');
                
                let currentX = 25;
                
                // Draw segments
                if (bar.items && Array.isArray(bar.items)) {
                    bar.items.forEach(item => {
                        const segmentWidth = ((item.originalLength || item.length || 0) / materialLength) * barWidth;
                        const color = hexToRgb(itemColors.get(item.originalId) || PDF_COLORS[0]);
                        
                        // Draw segment
                        pdf.setFillColor(color.r, color.g, color.b);
                        pdf.rect(currentX, barY + 3, segmentWidth, barHeight, 'F');
                        
                        // Add border between segments
                        pdf.setDrawColor(255, 255, 255);
                        pdf.setLineWidth(0.5);
                        pdf.line(currentX, barY + 3, currentX, barY + 3 + barHeight);
                        
                        // Add length label
                        if (segmentWidth > 25) {
                            pdf.setFontSize(7);
                            pdf.setTextColor(255, 255, 255);
                            const text = (item.originalLength || item.length || 0).toString();
                            const textWidth = pdf.getTextWidth(text);
                            
                            if (textWidth < segmentWidth - 8) {
                                pdf.text(
                                    text,
                                    currentX + segmentWidth / 2,
                                    barY + 3 + barHeight / 2,
                                    { align: 'center', baseline: 'middle' }
                                );
                            } else if (segmentWidth > 15) {
                                // Try abbreviated
                                const abbreviated = text.length > 4 ? text.substring(0, 3) + '..' : text;
                                pdf.text(
                                    abbreviated,
                                    currentX + segmentWidth / 2,
                                    barY + 3 + barHeight / 2,
                                    { align: 'center', baseline: 'middle' }
                                );
                            }
                        }
                        
                        currentX += segmentWidth;
                    });
                }
                
                // Draw waste area with pattern
                if (bar.remainingLength > 0) {
                    const wasteWidth = (bar.remainingLength / materialLength) * barWidth;
                    
                    // Cross-hatch pattern for waste
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.2);
                    
                    // Draw diagonal lines for waste area
                    const patternSpacing = 3;
                    for (let offset = 0; offset < wasteWidth; offset += patternSpacing) {
                        const startX = currentX + offset;
                        pdf.line(
                            startX, 
                            barY + 3, 
                            startX + Math.min(patternSpacing, wasteWidth - offset), 
                            barY + 3 + barHeight
                        );
                    }
                    
                    // Light background for waste
                    pdf.setFillColor(248, 248, 248);
                    pdf.rect(currentX, barY + 3, wasteWidth, barHeight, 'F');
                    
                    // Add waste label
                    if (wasteWidth > 30) {
                        pdf.setFontSize(6);
                        pdf.setTextColor(150, 150, 150);
                        pdf.text(
                            'WASTE',
                            currentX + wasteWidth / 2,
                            barY + 3 + barHeight / 2,
                            { align: 'center', baseline: 'middle' }
                        );
                    }
                }
                
                // Draw outer border
                pdf.setDrawColor(150, 150, 150);
                pdf.setLineWidth(0.3);
                pdf.rect(25, barY + 3, barWidth, barHeight, 'D');
                
                barY += 25;
            }
            
            // Footer for page 2
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text('Page 2 of 2', pageWidth - 20, pageHeight - 10, { align: 'right' });
            
            // ========== SAVE PDF ==========
            const filename = `${mode}-Cutting-Report-${new Date().toISOString().slice(0,10)}.pdf`;
            pdf.save(filename);
            
            showNotification(`${mode} PDF report generated successfully!`, 'success');
            resolve(true);
            
        } catch (error) {
            console.error('Error generating Custom PDF:', error);
            showNotification('Failed to generate PDF: ' + error.message, 'error');
            reject(error);
        }
    });
}

// ============================================
// EXPORT FUNCTIONS TO WINDOW
// ============================================

window.export1DToPDF = export1DToPDF;
window.export2DToPDF = export2DToPDF;
window.hexToRgb = hexToRgb;
window.formatNumber = formatNumber;
window.showNotification = showNotification;
// Gunakan fungsi full untuk exportCustomToPDF
window.exportCustomToPDF = exportCustomToPDFFull;