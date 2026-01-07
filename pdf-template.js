class PDFTemplate {
    constructor(pageSize = 'A4', orientation = 'portrait') {
        this.pageSize = pageSize;
        this.orientation = orientation;
        this.colors = {
            primary: [44, 62, 80],
            secondary: [226, 232, 240],
            accent: [59, 130, 246],
            lightGray: [243, 244, 246],
            white: [255, 255, 255],
            black: [15, 23, 42],
            text: [30, 41, 59],
            textLight: [100, 116, 139],
            border: [226, 232, 240],
            success: [22, 163, 74],
            warning: [234, 88, 12],
            error: [220, 38, 38]
        };
        this.itemColors = [
            [59, 130, 246], [16, 185, 129], [245, 158, 11], [139, 92, 246],
            [6, 182, 212], [249, 115, 22], [20, 184, 166], [236, 72, 153],
            [132, 204, 22], [239, 68, 68]
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
        const {jsPDF} = window.jspdf;
        this.pdf = new jsPDF(this.orientation, 'mm', this.pageSize);
        this.pdf.setProperties({
            title: title,
            subject: 'Cutting Pattern Optimization',
            author: 'EAV Cutting Optimizer',
            creator: 'Eghy Al Vandi',
            keywords: 'cutting, optimization, material, efficiency'
        });
        this.pdf.setCreationDate(new Date());
        this.pdf.setFont('helvetica');
        this.pdf.setFontSize(10);
        return this.pdf;
    }

    addCoverPage(title, subtitle = '', projectInfo = {}) {
        const pdf = this.pdf;
        pdf.setFillColor(...this.colors.white);
        pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
        pdf.setDrawColor(...this.colors.primary);
        pdf.setLineWidth(1);
        pdf.line(this.margin, 30, this.pageWidth - this.margin, 30);
        pdf.setTextColor(...this.colors.black);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, this.pageWidth / 2, 70, {align: 'center'});
        if (subtitle) {
            pdf.setTextColor(...this.colors.textLight);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'normal');
            pdf.text(subtitle, this.pageWidth / 2, 90, {align: 'center'});
        }
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.line(this.pageWidth / 2 - 30, 100, this.pageWidth / 2 + 30, 100);
        let y = 120;
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
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
        const timeStr = now.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Report generated on ${dateStr} at ${timeStr}`, this.pageWidth / 2, this.pageHeight - 40, {align: 'center'});
        pdf.text('EAV Cutting Optimizer - Professional Cutting Optimization Software', this.pageWidth / 2, this.pageHeight - 30, {align: 'center'});
        this.currentY = 40;
        this.pageNumber = 1;
        this.addPageNumber();
        return this.currentY;
    }

    addHeader(title, showPageNumber = true) {
        const pdf = this.pdf;
        pdf.setFillColor(...this.colors.white);
        pdf.rect(0, 0, this.pageWidth, 30, 'F');
        pdf.setTextColor(...this.colors.black);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, this.margin, 20);
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.3);
        pdf.line(this.margin, 25, this.pageWidth - this.margin, 25);
        if (showPageNumber) {
            this.addPageNumber();
        }
        this.currentY = 35;
        return this.currentY;
    }

    addPageNumber() {
        const pdf = this.pdf;
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${this.pageNumber} of ${this.totalPages}`, this.pageWidth - this.margin, 20, {align: 'right'});
        return this;
    }

    addFooter() {
        const pdf = this.pdf;
        const pageHeight = this.pageHeight;
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.3);
        pdf.line(this.margin, pageHeight - 20, this.pageWidth - this.margin, pageHeight - 20);
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(8);
        const title = this.pdf.internal.getProperties().title || 'Cutting Optimization Report';
        pdf.text(title, this.margin, pageHeight - 15);
        pdf.text('CONFIDENTIAL - INTERNAL USE ONLY', this.pageWidth - this.margin, pageHeight - 15, {align: 'right'});
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

    checkPageBreak(requiredHeight, minSpace = 40) {
        const remainingSpace = this.pageHeight - this.currentY - minSpace;
        if (remainingSpace < requiredHeight) {
            this.addNewPage();
            return true;
        }
        return false;
    }

    addSectionTitle(text, level = 1) {
        this.checkPageBreak(30);
        const pdf = this.pdf;
        const fontSize = level === 1 ? 14 : 12;
        const fontWeight = level === 1 ? 'bold' : 'bold';
        const marginTop = level === 1 ? 5 : 3;
        const lineY = this.currentY + 4;
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontWeight);
        pdf.text(text, this.margin, this.currentY);
        if (level === 1) {
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.3);
            pdf.line(this.margin, lineY, this.margin + 40, lineY);
        }
        this.currentY += marginTop + 10;
        return this.currentY;
    }

    addParagraph(text, options = {}) {
        const {maxWidth = this.contentWidth, fontSize = 10, lineHeight = 5, color = 'text'} = options;
        this.checkPageBreak(30);
        const pdf = this.pdf;
        pdf.setTextColor(...this.colors[color]);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            if (this.checkPageBreak(lineHeight + 2)) {
                this.currentY += 5;
            }
            pdf.text(line, this.margin, this.currentY);
            this.currentY += lineHeight;
        });
        this.currentY += 5;
        return this.currentY;
    }

    addMetricCard(title, value, unit = '', options = {}) {
        const {width = 85, height = 50, x = null, color = 'primary'} = options;
        this.checkPageBreak(height + 15);
        const cardX = x || this.margin;
        const pdf = this.pdf;
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(...this.colors.white);
        pdf.roundedRect(cardX, this.currentY, width, height, 2, 2, 'FD');
        pdf.setTextColor(...this.colors.textLight);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title.toUpperCase(), cardX + width / 2, this.currentY + 10, {align: 'center'});
        pdf.setTextColor(...this.colors[color]);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        const valueText = unit ? `${this.formatNumber(value)}${unit}` : this.formatNumber(value);
        pdf.text(valueText, cardX + width / 2, this.currentY + height - 15, {align: 'center'});
        if (!x) {
            this.currentY += height + 10;
        }
        return {x: cardX, y: this.currentY - height - 10, width, height};
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
        const {columnWidths = null, fontSize = 9, headerBg = true, striped = true} = options;
        const rowHeight = 8;
        const headerHeight = 10;
        const tableWidth = this.contentWidth;
        let calculatedWidths;
        if (columnWidths) {
            calculatedWidths = columnWidths;
        } else {
            const colCount = headers.length;
            const colWidth = tableWidth / colCount;
            calculatedWidths = new Array(colCount).fill(colWidth);
        }
        const tableHeight = headerHeight + (data.length * rowHeight);
        this.checkPageBreak(tableHeight + 25);
        const startY = this.currentY;
        let currentY = startY;
        const pdf = this.pdf;
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
            pdf.text(header, currentX + 3, currentY + headerHeight / 2 + 1, {baseline: 'middle'});
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.2);
            pdf.line(currentX + calculatedWidths[i], currentY, currentX + calculatedWidths[i], currentY + headerHeight);
            currentX += calculatedWidths[i];
        });
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.line(this.margin, currentY + headerHeight, this.margin + tableWidth, currentY + headerHeight);
        currentY += headerHeight;
        data.forEach((row, rowIndex) => {
            if (currentY + rowHeight > this.pageHeight - 40) {
                pdf.setDrawColor(...this.colors.border);
                pdf.setLineWidth(0.3);
                pdf.line(this.margin, currentY, this.margin + tableWidth, currentY);
                this.addNewPage();
                currentY = this.currentY;
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
                    pdf.text(header, currentX + 3, currentY + headerHeight / 2 + 1, {baseline: 'middle'});
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
            if (striped && rowIndex % 2 === 0) {
                pdf.setFillColor(...this.colors.lightGray);
                pdf.rect(this.margin, currentY, tableWidth, rowHeight, 'F');
            }
            currentX = this.margin;
            row.forEach((cell, cellIndex) => {
                pdf.setTextColor(...this.colors.text);
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', 'normal');
                pdf.text(this.sanitizeText(cell.toString()), currentX + 3, currentY + rowHeight / 2 + 1, {baseline: 'middle'});
                currentX += calculatedWidths[cellIndex];
            });
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.1);
            pdf.line(this.margin, currentY + rowHeight, this.margin + tableWidth, currentY + rowHeight);
            currentY += rowHeight;
        });
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.rect(this.margin, startY, tableWidth, currentY - startY);
        this.currentY = currentY + 10;
        return this.currentY;
    }

    draw1DBar(bar, materialLength, options = {}) {
        const {width = this.contentWidth, height = 25, showLabels = true, showWaste = true} = options;
        this.checkPageBreak(height + 80);
        const pdf = this.pdf;
        const scale = width / materialLength;
        const barX = this.margin;
        const barY = this.currentY;
        pdf.setTextColor(...this.colors.text);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Bar ${bar.id}`, barX, barY - 5);
        pdf.setFillColor(...this.colors.lightGray);
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.rect(barX, barY, width, height, 'S');
        let currentX = 0;
        bar.items.forEach((item, index) => {
            const originalLength = Math.round(item.originalLength || item.length);
            const segmentWidth = originalLength * scale;
            const color = this.getItemColor(item.originalId || item.id);
            pdf.setFillColor(...color);
            pdf.setDrawColor(...this.colors.white);
            pdf.setLineWidth(0.8);
            pdf.rect(barX + currentX, barY, segmentWidth, height, 'FD');
            if (showLabels && segmentWidth > 15) {
                pdf.setTextColor(...this.colors.white);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                const centerX = barX + currentX + segmentWidth / 2;
                const centerY = barY + height / 2;
                pdf.text(item.originalId || item.id, centerX, centerY, {
                    align: 'center',
                    baseline: 'middle',
                    renderingMode: 'fillThenStroke',
                    strokeWidth: 0.2
                });
            }
            currentX += segmentWidth;
        });
        if (showWaste && bar.remainingLength > 0) {
            const wasteWidth = bar.remainingLength * scale;
            pdf.setFillColor(...this.colors.lightGray);
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.3);
            pdf.rect(barX + currentX, barY, wasteWidth, height, 'FD');
            if (wasteWidth > 20) {
                pdf.setTextColor(...this.colors.textLight);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'italic');
                pdf.text('WASTE', barX + currentX + wasteWidth / 2, barY + height / 2, {align: 'center', baseline: 'middle'});
            }
        }
        const efficiency = Math.round((bar.usedLength / materialLength) * 100);
        const waste = Math.round(bar.remainingLength);
        const infoY = barY + height + 8;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...this.colors.text);
        pdf.text(`Efficiency: ${efficiency}%`, barX, infoY);
        pdf.text(`Items: ${bar.items.length}`, barX + width / 2 - 20, infoY);
        pdf.text(`Waste: ${this.formatNumber(waste)} mm`, barX + width - 5, infoY, {align: 'right'});
        this.currentY = barY + height + 25;
        this.checkPageBreak(25);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(10);
        pdf.text(`Items on Bar ${bar.id}:`, this.margin, this.currentY);
        this.currentY += 6;
        const maxItems = 8;
        const itemsToShow = bar.items.slice(0, maxItems);
        const colWidth = this.contentWidth / 2;
        itemsToShow.forEach((item, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = this.margin + 5 + (col * colWidth);
            const rowY = this.currentY + (row * 6);
            const color = this.getItemColor(item.originalId || item.id);
            const originalLength = Math.round(item.originalLength || item.length);
            pdf.setFillColor(...color);
            pdf.rect(x, rowY - 3, 4, 4, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...this.colors.text);
            pdf.text(`${item.originalId || item.id}: ${originalLength} mm`, x + 7, rowY);
        });
        const rowsUsed = Math.ceil(itemsToShow.length / 2);
        this.currentY += rowsUsed * 6 + 10;
        if (bar.items.length > maxItems) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(...this.colors.textLight);
            pdf.text(`...and ${bar.items.length - maxItems} more items`, this.margin, this.currentY);
            this.currentY += 5;
        }
        return this.currentY;
    }

    draw2DPlate(plate, plateWidth, plateHeight, options = {}) {
        const {width = this.contentWidth, height = 150, showGrid = false, showLabels = true} = options;
        this.checkPageBreak(height + 80);
        const pdf = this.pdf;
        const plateRatio = plateHeight / plateWidth;
        const adjustedHeight = width * plateRatio;
        const finalHeight = Math.min(adjustedHeight, 120);
        const scaleX = width / plateWidth;
        const scaleY = finalHeight / plateHeight;
        const plateX = this.margin;
        const plateY = this.currentY;
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Plate ${plate.id}`, plateX, plateY);
        pdf.setFillColor(...this.colors.white);
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.8);
        pdf.rect(plateX, plateY + 10, width, finalHeight, 'S');
        plate.items.forEach(item => {
            const itemX = plateX + (item.x * scaleX);
            const itemY = plateY + 10 + (item.y * scaleY);
            const itemWidth = item.width * scaleX;
            const itemHeight = item.height * scaleY;
            const color = this.getItemColor(item.originalId || item.id);
            pdf.setFillColor(...color);
            pdf.setDrawColor(...this.colors.white);
            pdf.setLineWidth(1);
            pdf.rect(itemX, itemY, itemWidth, itemHeight, 'FD');
            if (showLabels && itemWidth > 10 && itemHeight > 10) {
                pdf.setTextColor(...this.colors.white);
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                const centerX = itemX + itemWidth / 2;
                const centerY = itemY + itemHeight / 2;
                const itemId = item.originalId || item.id;
                pdf.text(itemId, centerX, centerY, {
                    align: 'center',
                    baseline: 'middle',
                    renderingMode: 'fillThenStroke',
                    strokeWidth: 0.3
                });
            }
        });
        const efficiency = plate.getEfficiency ? plate.getEfficiency() : Math.round(plate.efficiency || 0);
        const wasteArea = plate.getWasteArea ? plate.getWasteArea() : Math.round(plate.wasteArea || 0);
        const infoY = plateY + finalHeight + 20;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...this.colors.text);
        pdf.text(`Efficiency: ${efficiency}%`, plateX, infoY);
        pdf.text(`Items: ${plate.items.length}`, plateX + width / 2 - 20, infoY);
        pdf.text(`Waste: ${this.formatNumber(wasteArea)} mm²`, plateX + width - 5, infoY, {align: 'right'});
        this.currentY = plateY + finalHeight + 35;
        this.checkPageBreak(25);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(10);
        pdf.text(`Items on Plate ${plate.id}:`, this.margin, this.currentY);
        this.currentY += 6;
        const maxItems = 12;
        const itemsToShow = plate.items.slice(0, maxItems);
        const colWidth = this.contentWidth / 2;
        itemsToShow.forEach((item, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = this.margin + 5 + (col * colWidth);
            const rowY = this.currentY + (row * 6);
            const color = this.getItemColor(item.originalId || item.id);
            const actualWidth = Math.round(item.originalWidth || item.width);
            const actualHeight = Math.round(item.originalHeight || item.height);
            pdf.setFillColor(...color);
            pdf.rect(x, rowY - 3, 4, 4, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...this.colors.text);
            let itemText = `${item.originalId || item.id}: ${actualWidth}×${actualHeight}`;
            if (item.rotated) itemText += ' (R)';
            pdf.text(this.sanitizeText(itemText), x + 7, rowY);
        });
        const rowsUsed = Math.ceil(itemsToShow.length / 2);
        this.currentY += rowsUsed * 6 + 10;
        if (plate.items.length > maxItems) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(...this.colors.textLight);
            pdf.text(`...and ${plate.items.length - maxItems} more items`, this.margin, this.currentY);
            this.currentY += 5;
        }
        return this.currentY;
    }

    addFFCA01PatternSection(formData) {
        this.checkPageBreak(80);
        const pdf = this.pdf;
        const {smallRingA, bigRingA, smallRingB, bigRingB, multiplier, kerfWidth} = formData;
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FF-CA-01 PATTERN CONFIGURATION', this.margin, this.currentY);
        this.currentY += 15;
        pdf.setTextColor(...this.colors.text);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Pattern Dimensions', this.margin, this.currentY);
        this.currentY += 10;
        const colWidths = [35, 60, 60];
        const tableX = this.margin;
        const tableY = this.currentY;
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        pdf.setFillColor(...this.colors.lightGray);
        pdf.rect(tableX, tableY, tableWidth, 10, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(...this.colors.text);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Pattern', tableX + 5, tableY + 7);
        pdf.text('Small Ring', tableX + colWidths[0] + 5, tableY + 7);
        pdf.text('Big Ring', tableX + colWidths[0] + colWidths[1] + 5, tableY + 7);
        pdf.setDrawColor(...this.colors.border);
        pdf.setLineWidth(0.5);
        pdf.line(tableX, tableY + 10, tableX + tableWidth, tableY + 10);
        this.currentY += 15;
        pdf.setFont('helvetica', 'normal');
        pdf.text('A', tableX + 5, this.currentY);
        pdf.text(`${this.formatNumber(smallRingA)} mm`, tableX + colWidths[0] + 5, this.currentY);
        pdf.text(`${this.formatNumber(bigRingA)} mm`, tableX + colWidths[0] + colWidths[1] + 5, this.currentY);
        this.currentY += 8;
        pdf.text('B', tableX + 5, this.currentY);
        pdf.text(`${this.formatNumber(smallRingB)} mm`, tableX + colWidths[0] + 5, this.currentY);
        pdf.text(`${this.formatNumber(bigRingB)} mm`, tableX + colWidths[0] + colWidths[1] + 5, this.currentY);
        pdf.rect(tableX, tableY, tableWidth, 33);
        this.currentY += 15;
        pdf.setTextColor(...this.colors.accent);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Total Sets: ${this.formatNumber(multiplier)}`, this.margin, this.currentY);
        pdf.setTextColor(...this.colors.text);
        this.currentY += 10;
        this.currentY += 5;
        return this.currentY;
    }

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
        const factor = Math.pow(10, decimals);
        const rounded = Math.round(parseFloat(num) * factor) / factor;
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

    sanitizeText(text) {
        if (!text) return '';
        return text.replace(/[!»«]/g, '')
                   .replace(/×/g, 'x')
                   .replace(/[^\x00-\x7F]/g, '');
    }

    addSummaryBox(title, items, options = {}) {
        const {width = this.contentWidth, fontSize = 9, border = true} = options;
        this.checkPageBreak((items.length * 7) + 30);
        const pdf = this.pdf;
        const boxX = this.margin;
        const boxY = this.currentY;
        const itemHeight = 7;
        const padding = 5;
        const boxHeight = (items.length * itemHeight) + (padding * 2) + 15;
        if (border) {
            pdf.setFillColor(...this.colors.white);
            pdf.setDrawColor(...this.colors.border);
            pdf.setLineWidth(0.5);
            pdf.rect(boxX, boxY, width, boxHeight, 'S');
        }
        pdf.setTextColor(...this.colors.primary);
        pdf.setFontSize(fontSize + 1);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, boxX + padding, boxY + padding + 5);
        let currentY = boxY + padding + 15;
        items.forEach((item, index) => {
            pdf.setTextColor(...this.colors.text);
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.label, boxX + padding, currentY);
            pdf.setTextColor(...this.colors.text);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.value, boxX + width - padding - 5, currentY, {align: 'right'});
            currentY += itemHeight;
        });
        this.currentY = boxY + boxHeight + 10;
        return this.currentY;
    }
}

window.PDFTemplate = PDFTemplate;
console.log('PDF Template Engine loaded - Clean & Modern version (Optimized)');