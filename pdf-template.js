// ============================================
// PDF TEMPLATE ENGINE - CLEAN & MODERN
// Optimized for A4 reports with minimal design
// ============================================

class PDFTemplate {
    constructor(pageSize = 'A4', orientation = 'portrait') {
        this.pageSize = pageSize;
        this.orientation = orientation;
        this.colors = {
            primary: [44, 62, 80],      // #2c3e50 - Dark blue gray
            secondary: [226, 232, 240], // #e2e8f0 - Light gray
            accent: [59, 130, 246],     // #3b82f6 - Blue for highlights
            lightGray: [243, 244, 246], // #f3f4f6
            white: [255, 255, 255],
            black: [15, 23, 42],        // #0f172a - Near black
            text: [30, 41, 59],         // #1e293b - Dark text
            textLight: [100, 116, 139], // #64748b - Light text
            border: [226, 232, 240],    // #e2e8f0 - Border color
            success: [22, 163, 74],     // #16a34a - Green
            warning: [234, 88, 12],     // #ea580c - Orange
            error: [220, 38, 38]        // #dc2626 - Red
        };
        
        // Item colors palette - Earth tones (soft and professional)
        this.itemColors = [
            [59, 130, 246],    // Blue
            [16, 185, 129],    // Green
            [245, 158, 11],    // Yellow
            [139, 92, 246],    // Purple
            [6, 182, 212],     // Cyan
            [249, 115, 22],    // Orange
            [20, 184, 166],    // Teal
            [236, 72, 153],    // Pink
            [132, 204, 22],    // Lime
            [239, 68, 68]      // Red
        ];
        
        this.currentY = 0;
        this.pageNumber = 1;
        this.totalPages = 1;
        this.itemColorMap = new Map();
        this.pageWidth = orientation === 'portrait' ? 210 : 297;
        this.pageHeight = orientation === 'portrait' ? 297 : 210;
        this.margin = 15;
        this.contentWidth = this.pageWidth - (this.margin * 2);
    }
    
    initPDF(title = 'Cutting Optimization Report') {
        const { jsPDF } = window.jspdf;
        this.pdf = new jsPDF(this.orientation, 'mm', this.pageSize);
        this.pdf.setProperties({
            title: title,
            subject: 'Cutting Pattern Optimization',
            author: 'EAV Cutting Optimizer',
            creator: 'Eghy Al Vandi',
            keywords: 'cutting, optimization, material, efficiency'
        });
        
        // Set compression for smaller file size
        this.pdf.setCreationDate(new Date());
        
        // Set default font
        this.pdf.setFont('helvetica');
        this.pdf.setFontSize(10);
        
        return this.pdf;
    }
    
    // ========== PAGE LAYOUT METHODS ==========
    
    addCoverPage(title, subtitle = '', projectInfo = {}) {
        const pdf = this.pdf;
        
        // Clean white background - HEADER PUTIH
        pdf.setFillColor(...this.colors.white);
        pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
        
        // Simple header line
        pdf.setDrawColor(...this.colors.primary);
        pdf.setLineWidth(1);
        pdf.line(this.margin, 30, this.pageWidth - this.margin, 30);
        
        // Title - teks hitam untuk kontras dengan background putih
        pdf.setTextColor(...this.colors.black);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, this.pageWidth / 2, 70, { align: 'center' });
        
        // Subtitle
        if (subtitle) {
            pdf.setTextColor(...this.colors.textLight);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'normal');
            pdf.text(subtitle, this.pageWidth / 2, 90, { align: 'center' });
        }
        
        // Decorative line under title
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.line(this.pageWidth / 2 - 30, 100, this.pageWidth / 2 + 30, 100);
        
        let y = 120;
        
        // Project information if provided
        if (Object.keys(projectInfo).length > 0) {
            pdf.setTextColor(...this.colors.text);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PROJECT INFORMATION', this.margin, y);
            y += 10;
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            
            Object.entries(projectInfo).forEach(([key, value], index) => {
                const rowY = y + (index * 8);
                pdf.setTextColor(...this.colors.textLight);
                pdf.text(`${key}:`, this.margin + 5, rowY);
                pdf.setTextColor(...this.colors.text);
                pdf.text(String(value), this.margin + 40, rowY);
            });
            
            y += (Object.keys(projectInfo).length * 8) + 20;
        }
        
        // Report generated info
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Report generated on ${dateStr} at ${timeStr}`, this.pageWidth / 2, this.pageHeight - 40, { align: 'center' });
        
        pdf.text('EAV Cutting Optimizer - Professional Cutting Optimization Software', 
                this.pageWidth / 2, this.pageHeight - 30, { align: 'center' });
        
        this.currentY = 40;
        this.pageNumber = 1;
        this.addPageNumber();
        
        return this.currentY;
    }
    
    addHeader(title, showPageNumber = true) {
        const pdf = this.pdf;
        
        // Simple text header without background - PUTIH
        pdf.setFillColor(...this.colors.white);
        pdf.rect(0, 0, this.pageWidth, 30, 'F');
        
        pdf.setTextColor(...this.colors.black); // Teks hitam untuk kontras
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, this.margin, 20);
        
        // Subtle line under header
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.3);
        pdf.line(this.margin, 25, this.pageWidth - this.margin, 25);
        
        if (showPageNumber) {
            this.addPageNumber();
        }
        
        this.currentY = 35;
        return this.currentY;
    }
    
    // PERBAIKAN: Hilangkan * di depan page number
    addPageNumber() {
        const pdf = this.pdf;
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${this.pageNumber} of ${this.totalPages}`, 
                this.pageWidth - this.margin, 20, { align: 'right' });
        return this;
    }
    
    addFooter() {
        const pdf = this.pdf;
        const pageHeight = this.pageHeight;
        
        // Simple footer line
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.3);
        pdf.line(this.margin, pageHeight - 20, this.pageWidth - this.margin, pageHeight - 20);
        
        // Footer text
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(8);
        
        // Left: Document title
        const title = this.pdf.internal.getProperties().title || 'Cutting Optimization Report';
        pdf.text(title, this.margin, pageHeight - 15);
        
        // Right: Confidential notice
        pdf.text('CONFIDENTIAL - INTERNAL USE ONLY', this.pageWidth - this.margin, pageHeight - 15, { align: 'right' });
        
        return this;
    }
    
    addNewPage(headerTitle = '') {
        this.pdf.addPage();
        this.pageNumber++;
        this.currentY = 35;
        
        if (headerTitle) {
            this.addHeader(headerTitle);
        } else {
            this.addPageNumber();
            this.currentY = 35;
        }
        
        this.addFooter();
        return this.currentY;
    }
    
    // PERBAIKAN: Fungsi checkPageBreak yang lebih akurat
    checkPageBreak(requiredHeight, minSpace = 40) {
        const remainingSpace = this.pageHeight - this.currentY - minSpace;
        if (remainingSpace < requiredHeight) {
            this.addNewPage();
            return true;
        }
        return false;
    }
    
    // ========== CONTENT ELEMENTS ==========
    
    addSectionTitle(text, level = 1) {
        this.checkPageBreak(30);
        
        const pdf = this.pdf;
        const fontSize = level === 1 ? 14 : 12;
        const fontWeight = level === 1 ? 'bold' : 'bold';
        const marginTop = level === 1 ? 5 : 3;
        const lineY = this.currentY + 4;
        
        // Section title
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontWeight);
        pdf.text(text, this.margin, this.currentY);
        
        // Optional subtle underline
        if (level === 1) {
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.3);
            pdf.line(this.margin, lineY, this.margin + 40, lineY);
        }
        
        this.currentY += marginTop + 10;
        return this.currentY;
    }
    
    addParagraph(text, options = {}) {
        const { maxWidth = this.contentWidth, fontSize = 10, lineHeight = 5, color = 'text' } = options;
        
        this.checkPageBreak(30);
        
        const pdf = this.pdf;
        pdf.setTextColor(...this.colors[color]);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'normal');
        
        // Split text into lines
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        lines.forEach(line => {
            if (this.checkPageBreak(lineHeight + 2)) {
                this.currentY += 5;
            }
            pdf.text(line, this.margin, this.currentY);
            this.currentY += lineHeight;
        });
        
        this.currentY += 5; // Extra space after paragraph
        return this.currentY;
    }
    
    addMetricCard(title, value, unit = '', options = {}) {
        const { width = 85, height = 50, x = null, color = 'primary' } = options;
        
        this.checkPageBreak(height + 15);
        
        const cardX = x || this.margin;
        const pdf = this.pdf;
        
        // Card with subtle border
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(...this.colors.white);
        pdf.roundedRect(cardX, this.currentY, width, height, 2, 2, 'FD');
        
        // Title
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title.toUpperCase(), cardX + width / 2, this.currentY + 10, { align: 'center' });
        
        // Value
        pdf.setTextColor(...this.colors[color]);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        
        const valueText = unit ? `${this.formatNumber(value)} ${unit}` : this.formatNumber(value);
        pdf.text(valueText, cardX + width / 2, this.currentY + height - 15, { align: 'center' });
        
        // Store position for grid layout
        if (!x) {
            this.currentY += height + 10;
        }
        
        return { x: cardX, y: this.currentY - height - 10, width, height };
    }
    
    addMetricsGrid(metrics, columns = 3, cardWidth = 85, cardHeight = 50) {
        this.checkPageBreak(cardHeight + 25);
        
        const availableWidth = this.contentWidth;
        const gap = (availableWidth - (columns * cardWidth)) / (columns - 1);
        let currentX = this.margin;
        
        metrics.forEach((metric, index) => {
            if (index > 0 && index % columns === 0) {
                this.currentY += cardHeight + 15;
                currentX = this.margin;
                this.checkPageBreak(cardHeight + 25);
            }
            
            this.addMetricCard(metric.title, metric.value, metric.unit || '', {
                width: cardWidth,
                height: cardHeight,
                x: currentX,
                color: metric.color || 'primary'
            });
            
            currentX += cardWidth + gap;
        });
        
        this.currentY += cardHeight + 15;
        return this.currentY;
    }
    
    addDataTable(headers, data, options = {}) {
        const { columnWidths = null, fontSize = 9, headerBg = true, striped = true } = options;
        
        const rowHeight = 8;
        const headerHeight = 10;
        const tableWidth = this.contentWidth;
        
        // Calculate column widths if not provided
        let calculatedWidths;
        if (columnWidths) {
            calculatedWidths = columnWidths;
        } else {
            const colCount = headers.length;
            const colWidth = tableWidth / colCount;
            calculatedWidths = new Array(colCount).fill(colWidth);
        }
        
        // Check if we need a new page
        const tableHeight = headerHeight + (data.length * rowHeight);
        this.checkPageBreak(tableHeight + 25);
        
        const startY = this.currentY;
        let currentY = startY;
        const pdf = this.pdf;
        
        // Table header
        if (headerBg) {
            pdf.setFillColor(...this.colors.lightGray);
        }
        
        let currentX = this.margin;
        headers.forEach((header, i) => {
            if (headerBg) {
                pdf.rect(currentX, currentY, calculatedWidths[i], headerHeight, 'F');
            }
            
            pdf.setTextColor(...this.colors.text);
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', 'bold');
            pdf.text(header, currentX + 3, currentY + headerHeight / 2 + 1, { baseline: 'middle' });
            
            // Column border
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.2);
            pdf.line(currentX + calculatedWidths[i], currentY, currentX + calculatedWidths[i], currentY + headerHeight);
            
            currentX += calculatedWidths[i];
        });
        
        // Header bottom border
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.line(this.margin, currentY + headerHeight, this.margin + tableWidth, currentY + headerHeight);
        
        currentY += headerHeight;
        
        // Table rows
        data.forEach((row, rowIndex) => {
            // Check for page break
            if (currentY + rowHeight > this.pageHeight - 40) {
                // Draw bottom border for current page
                pdf.setDrawColor(...this.colors.border);
                pdf.setLineWidth(0.3);
                pdf.line(this.margin, currentY, this.margin + tableWidth, currentY);
                
                // Add new page and redraw headers
                this.addNewPage();
                currentY = this.currentY;
                
                // Redraw headers on new page
                if (headerBg) {
                    pdf.setFillColor(...this.colors.lightGray);
                }
                
                currentX = this.margin;
                headers.forEach((header, i) => {
                    if (headerBg) {
                        pdf.rect(currentX, currentY, calculatedWidths[i], headerHeight, 'F');
                    }
                    
                    pdf.setTextColor(...this.colors.text);
                    pdf.setFontSize(fontSize);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(header, currentX + 3, currentY + headerHeight / 2 + 1, { baseline: 'middle' });
                    
                    pdf.setDrawColor(...this.colors.border);
                    pdf.setLineWidth(0.2);
                    pdf.line(currentX + calculatedWidths[i], currentY, currentX + calculatedWidths[i], currentY + headerHeight);
                    
                    currentX += calculatedWidths[i];
                });
                
                pdf.setDrawColor(...this.colors.border);
                pdf.setLineWidth(0.5);
                pdf.line(this.margin, currentY + headerHeight, this.margin + tableWidth, currentY + headerHeight);
                
                currentY += headerHeight;
            }
            
            // Alternate row background
            if (striped && rowIndex % 2 === 0) {
                pdf.setFillColor(...this.colors.lightGray);
                pdf.rect(this.margin, currentY, tableWidth, rowHeight, 'F');
            }
            
            currentX = this.margin;
            row.forEach((cell, cellIndex) => {
                pdf.setTextColor(...this.colors.text);
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', 'normal');
                pdf.text(this.sanitizeText(cell.toString()), currentX + 3, currentY + rowHeight / 2 + 1, { baseline: 'middle' });
                currentX += calculatedWidths[cellIndex];
            });
            
            // Row bottom border
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.1);
            pdf.line(this.margin, currentY + rowHeight, this.margin + tableWidth, currentY + rowHeight);
            
            currentY += rowHeight;
        });
        
        // Table outer border
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.rect(this.margin, startY, tableWidth, currentY - startY);
        
        this.currentY = currentY + 10;
        return this.currentY;
    }
    
    // ========== VISUALIZATION METHODS ==========
    
    // PERBAIKAN BUG 3: Hanya ID saja di tengah potongan, hapus dimensi
    draw1DBar(bar, materialLength, options = {}) {
        const { width = this.contentWidth, height = 25, showLabels = true, showWaste = true } = options;
        
        this.checkPageBreak(height + 80); // Tambah ruang untuk keterangan
        
        const pdf = this.pdf;
        const scale = width / materialLength;
        const barX = this.margin;
        const barY = this.currentY;
        
        // Bar info di atas
        pdf.setTextColor(...this.colors.text);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Bar ${bar.id}`, barX, barY - 5);
        
        // Bar background with subtle border
        pdf.setFillColor(...this.colors.lightGray);
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.rect(barX, barY, width, height, 'S');
        
        // Draw segments with clear outlines
        let currentX = 0;
        bar.items.forEach((item, index) => {
            const originalLength = Math.round(item.originalLength || item.length);
            const segmentWidth = originalLength * scale;
            const color = this.getItemColor(item.originalId || item.id);
            
            // Draw segment with white outline
            pdf.setFillColor(...color);
            pdf.setDrawColor(...this.colors.white);
            pdf.setLineWidth(0.8);
            pdf.rect(barX + currentX, barY, segmentWidth, height, 'FD');
            
            // Add label if segment is wide enough - PERBAIKAN BUG 3: Hanya ID saja
            if (showLabels && segmentWidth > 15) {
                pdf.setTextColor(...this.colors.white);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                
                const centerX = barX + currentX + segmentWidth / 2;
                const centerY = barY + height / 2;
                
                // PERBAIKAN BUG 3: Hanya tampilkan ID saja di tengah
                pdf.text(item.originalId || item.id, centerX, centerY, { 
                    align: 'center', 
                    baseline: 'middle',
                    renderingMode: 'fillThenStroke',
                    strokeWidth: 0.2
                });
            }
            
            currentX += segmentWidth;
        });
        
        // Draw waste segment if any
        if (showWaste && bar.remainingLength > 0) {
            const wasteWidth = bar.remainingLength * scale;
            
            // Hatch pattern for waste
            pdf.setFillColor(...this.colors.lightGray);
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.3);
            pdf.rect(barX + currentX, barY, wasteWidth, height, 'FD');
            
            // Waste label
            if (wasteWidth > 20) {
                pdf.setTextColor(...this.colors.textLight);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'italic');
                pdf.text('WASTE', barX + currentX + wasteWidth / 2, barY + height / 2, { 
                    align: 'center', 
                    baseline: 'middle' 
                });
            }
        }
        
        // Bar statistics below
        const efficiency = Math.round((bar.usedLength / materialLength) * 100);
        const waste = Math.round(bar.remainingLength);
        
        const infoY = barY + height + 8;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...this.colors.text);
        
        pdf.text(`Efficiency: ${efficiency}%`, barX, infoY);
        pdf.text(`Items: ${bar.items.length}`, barX + width / 2 - 20, infoY);
        pdf.text(`Waste: ${this.formatNumber(waste)} mm`, barX + width - 5, infoY, { align: 'right' });
        
        this.currentY = barY + height + 25;
        
        // PERBAIKAN BUG 3: Tambah keterangan items di bawah bar dengan jarak yang lebih dekat
        this.checkPageBreak(25);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(10);
        pdf.text(`Items on Bar ${bar.id}:`, this.margin, this.currentY);
        this.currentY += 6; // Kurangi jarak dari sebelumnya (8 menjadi 6)
        
        // Items list dalam 2 kolom
        const maxItems = 8;
        const itemsToShow = bar.items.slice(0, maxItems);
        const colWidth = this.contentWidth / 2;
        
        itemsToShow.forEach((item, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = this.margin + 5 + (col * colWidth);
            const rowY = this.currentY + (row * 6); // Kurangi jarak baris dari 7 menjadi 6
            
            const color = this.getItemColor(item.originalId || item.id);
            const originalLength = Math.round(item.originalLength || item.length);
            
            // Color indicator
            pdf.setFillColor(...color);
            pdf.rect(x, rowY - 3, 4, 4, 'F');
            
            // Item info
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...this.colors.text);
            pdf.text(`${item.originalId || item.id}: ${originalLength} mm`, x + 7, rowY);
        });
        
        const rowsUsed = Math.ceil(itemsToShow.length / 2);
        this.currentY += rowsUsed * 6 + 10; // Kurangi jarak dari 15 menjadi 10
        
        // PERBAIKAN BUG 3: Tambah keterangan "...and X more items" dengan jarak yang lebih dekat
        if (bar.items.length > maxItems) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(...this.colors.textLight);
            pdf.text(`...and ${bar.items.length - maxItems} more items`, this.margin, this.currentY);
            this.currentY += 5; // Kurangi jarak dari sebelumnya
        }
        
        return this.currentY;
    }
    
    // PERBAIKAN BUG 3: Hanya ID saja di tengah potongan
    draw2DPlate(plate, plateWidth, plateHeight, options = {}) {
        const { 
            width = this.contentWidth, 
            height = 150, 
            showGrid = false,
            showLabels = true
        } = options;
        
        this.checkPageBreak(height + 80);
        
        const pdf = this.pdf;
        
        // Hitung tinggi berdasarkan ratio asli plate
        const plateRatio = plateHeight / plateWidth;
        const adjustedHeight = width * plateRatio;
        const finalHeight = Math.min(adjustedHeight, 120); // Max 120mm untuk ruang item list
        
        const scaleX = width / plateWidth;
        const scaleY = finalHeight / plateHeight;
        
        const plateX = this.margin;
        const plateY = this.currentY;
        
        // Plate header
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Plate ${plate.id}`, plateX, plateY);
        
        // Plate background with border
        pdf.setFillColor(...this.colors.white);
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.8);
        pdf.rect(plateX, plateY + 10, width, finalHeight, 'S');
        
        // Draw items with clear outlines - PERBAIKAN BUG 3: Hanya ID saja
        plate.items.forEach(item => {
            const itemX = plateX + (item.x * scaleX);
            const itemY = plateY + 10 + (item.y * scaleY);
            const itemWidth = item.width * scaleX;
            const itemHeight = item.height * scaleY;
            const color = this.getItemColor(item.originalId || item.id);
            
            // Draw item with white outline for clear separation
            pdf.setFillColor(...color);
            pdf.setDrawColor(...this.colors.white);
            pdf.setLineWidth(1);
            pdf.rect(itemX, itemY, itemWidth, itemHeight, 'FD');
            
            // Add label if item is large enough - PERBAIKAN BUG 3: Hanya ID saja
            if (showLabels && itemWidth > 10 && itemHeight > 10) {
                pdf.setTextColor(...this.colors.white);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                
                const centerX = itemX + itemWidth / 2;
                const centerY = itemY + itemHeight / 2;
                
                // PERBAIKAN BUG 3: Hanya tampilkan ID saja di tengah
                const itemId = item.originalId || item.id;
                pdf.text(itemId, centerX, centerY, { 
                    align: 'center', 
                    baseline: 'middle',
                    renderingMode: 'fillThenStroke',
                    strokeWidth: 0.3
                });
            }
        });
        
        // Plate statistics
        const efficiency = plate.getEfficiency ? plate.getEfficiency() : Math.round(plate.efficiency || 0);
        const wasteArea = plate.getWasteArea ? plate.getWasteArea() : Math.round(plate.wasteArea || 0);
        
        const infoY = plateY + finalHeight + 20;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...this.colors.text);
        
        pdf.text(`Efficiency: ${efficiency}%`, plateX, infoY);
        pdf.text(`Items: ${plate.items.length}`, plateX + width / 2 - 20, infoY);
        pdf.text(`Waste: ${this.formatNumber(wasteArea)} mm²`, plateX + width - 5, infoY, { align: 'right' });
        
        this.currentY = plateY + finalHeight + 35;
        
        // PERBAIKAN BUG 3: Tambah keterangan items di bawah plate dengan jarak yang lebih dekat
        this.checkPageBreak(25);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(10);
        pdf.text(`Items on Plate ${plate.id}:`, this.margin, this.currentY);
        this.currentY += 6; // Kurangi jarak dari sebelumnya (8 menjadi 6)
        
        // Items list dalam 2 kolom - PERBAIKAN BUG 6: Gunakan sanitizeText untuk menghindari karakter aneh
        const maxItems = 12;
        const itemsToShow = plate.items.slice(0, maxItems);
        const colWidth = this.contentWidth / 2;
        
        itemsToShow.forEach((item, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = this.margin + 5 + (col * colWidth);
            const rowY = this.currentY + (row * 6); // Kurangi jarak baris dari 7 menjadi 6
            
            const color = this.getItemColor(item.originalId || item.id);
            const actualWidth = Math.round(item.originalWidth || item.width);
            const actualHeight = Math.round(item.originalHeight || item.height);
            
            // Color indicator
            pdf.setFillColor(...color);
            pdf.rect(x, rowY - 3, 4, 4, 'F');
            
            // Item info - PERBAIKAN BUG 6: Gunakan sanitizeText untuk menghindari karakter aneh
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...this.colors.text);
            
            let itemText = `${item.originalId || item.id}: ${actualWidth}×${actualHeight}`;
            if (item.rotated) itemText += ' (R)';
            
            // PERBAIKAN BUG 6: Bersihkan teks dari karakter khusus
            pdf.text(this.sanitizeText(itemText), x + 7, rowY);
        });
        
        const rowsUsed = Math.ceil(itemsToShow.length / 2);
        this.currentY += rowsUsed * 6 + 10; // Kurangi jarak dari 20 menjadi 10
        
        // PERBAIKAN BUG 3: Tambah keterangan "...and X more items" dengan jarak yang lebih dekat
        if (plate.items.length > maxItems) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(...this.colors.textLight);
            pdf.text(`...and ${plate.items.length - maxItems} more items`, this.margin, this.currentY);
            this.currentY += 5; // Kurangi jarak dari sebelumnya
        }
        
        return this.currentY;
    }
    
    // ========== FF-CA-01 SPECIFIC METHODS ==========
    
    // PERBAIKAN BUG 4: HAPUS GAMBAR FF-CA-01 dari template
    addFFCA01PatternSection(formData) {
        this.checkPageBreak(80); // Kurangi dari 100 menjadi 80 karena tidak ada gambar
        
        const pdf = this.pdf;
        const { smallRingA, bigRingA, smallRingB, bigRingB, multiplier, kerfWidth } = formData;
        
        // Section title
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FF-CA-01 PATTERN CONFIGURATION', this.margin, this.currentY);
        this.currentY += 15;
        
        // PERBAIKAN: HAPUS bagian gambar FF-CA-01
        // Langsung ke Pattern Dimensions
        pdf.setTextColor(...this.colors.text);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Pattern Dimensions', this.margin, this.currentY);
        this.currentY += 10;
        
        // PERBAIKAN BUG 5: Table untuk pattern dimensions lebih ramping
        const colWidths = [35, 60, 60]; // Lebih ramping dari sebelumnya
        const tableX = this.margin;
        const tableY = this.currentY;
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        
        // PERBAIKAN BUG 5: Table header dengan warna abu-abu (lightGray)
        pdf.setFillColor(...this.colors.lightGray);
        pdf.rect(tableX, tableY, tableWidth, 10, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...this.colors.text);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Pattern', tableX + 5, tableY + 7);
        pdf.text('Small Ring', tableX + colWidths[0] + 5, tableY + 7);
        pdf.text('Big Ring', tableX + colWidths[0] + colWidths[1] + 5, tableY + 7);
        
        // Border untuk header
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.line(tableX, tableY + 10, tableX + tableWidth, tableY + 10);
        
        this.currentY += 15;
        
        // Pattern A row
        pdf.setFont('helvetica', 'normal');
        pdf.text('A', tableX + 5, this.currentY);
        pdf.text(`${this.formatNumber(smallRingA)} mm`, tableX + colWidths[0] + 5, this.currentY);
        pdf.text(`${this.formatNumber(bigRingA)} mm`, tableX + colWidths[0] + colWidths[1] + 5, this.currentY);
        
        this.currentY += 8;
        
        // Pattern B row
        pdf.text('B', tableX + 5, this.currentY);
        pdf.text(`${this.formatNumber(smallRingB)} mm`, tableX + colWidths[0] + 5, this.currentY);
        pdf.text(`${this.formatNumber(bigRingB)} mm`, tableX + colWidths[0] + colWidths[1] + 5, this.currentY);
        
        // Border untuk seluruh tabel
        pdf.rect(tableX, tableY, tableWidth, 33); // 10 (header) + 8 + 8 + 7 (padding)
        
        this.currentY += 15;
        
        // Total Sets information
        pdf.setTextColor(...this.colors.accent);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Total Sets: ${this.formatNumber(multiplier)}`, this.margin, this.currentY);
        pdf.setTextColor(...this.colors.text); // Reset warna
        
        this.currentY += 10;
        
        // PERBAIKAN BUG 4: HAPUS keterangan berikut:
        // pdf.text(`Note: Each pattern requires 4 small rings and 4 big rings.`, 
        //         this.margin, this.currentY);
        // this.currentY += 7;
        // 
        // pdf.text(`Total rings per set: 8 small + 8 big = 16 rings`, 
        //         this.margin, this.currentY);
        // this.currentY += 15;
        
        // Sebagai gantinya, hanya tambah sedikit spasi
        this.currentY += 5;
        
        return this.currentY;
    }
    
    // PERBAIKAN BUG 2: LEGEND DIHAPUS - Hapus metode addLegend sepenuhnya
    // Metode addLegend dan addSimpleLegend dihapus karena tidak diperlukan
    
    // ========== UTILITY METHODS ==========
    
    getItemColor(itemId) {
        if (!itemId) return this.itemColors[0];
        
        if (!this.itemColorMap.has(itemId)) {
            const colorIndex = this.itemColorMap.size % this.itemColors.length;
            this.itemColorMap.set(itemId, this.itemColors[colorIndex]);
        }
        return this.itemColorMap.get(itemId);
    }
    
    formatNumber(num, decimals = 0) {
        if (isNaN(num) || num === null || num === undefined) return '0';
        
        // Round to integer by default, allow decimals if specified
        const factor = Math.pow(10, decimals);
        const rounded = Math.round(parseFloat(num) * factor) / factor;
        
        // Format with thousand separators
        return rounded.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    calculatePercentage(part, total) {
        const partNum = parseFloat(part) || 0;
        const totalNum = parseFloat(total) || 0;
        return totalNum > 0 ? Math.round((partNum / totalNum) * 100) : 0;
    }
    
    // PERBAIKAN BUG 6: Fungsi untuk membersihkan teks dari karakter khusus
    sanitizeText(text) {
        if (!text) return '';
        
        // Ganti karakter khusus dengan karakter yang aman
        return text
            .replace(/[!»«]/g, '')  // Hapus karakter khusus seperti !»
            .replace(/×/g, 'x')      // Ganti × dengan x untuk konsistensi
            .replace(/[^\x00-\x7F]/g, ''); // Hapus karakter non-ASCII
    }
    
    // PERBAIKAN: Metode addSummaryBox yang lebih aman
    addSummaryBox(title, items, options = {}) {
        const { width = this.contentWidth, fontSize = 9, border = true } = options;
        
        this.checkPageBreak((items.length * 7) + 30);
        
        const pdf = this.pdf;
        const boxX = this.margin;
        const boxY = this.currentY;
        const itemHeight = 7;
        const padding = 5;
        
        const boxHeight = (items.length * itemHeight) + (padding * 2) + 15;
        
        // Box background and border
        if (border) {
            pdf.setFillColor(...this.colors.white);
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.5);
            pdf.rect(boxX, boxY, width, boxHeight, 'S');
        }
        
        // Title
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(fontSize + 1);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, boxX + padding, boxY + padding + 5);
        
        // Items
        let currentY = boxY + padding + 15;
        items.forEach((item, index) => {
            pdf.setTextColor(...this.colors.text);
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.label, boxX + padding, currentY);
            
            pdf.setTextColor(...this.colors.text);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.value, boxX + width - padding - 5, currentY, { align: 'right' });
            
            currentY += itemHeight;
        });
        
        this.currentY = boxY + boxHeight + 10;
        return this.currentY;
    }
}

// Export untuk browser
window.PDFTemplate = PDFTemplate;

console.log('PDF Template Engine loaded - Clean & Modern version (Optimized)');