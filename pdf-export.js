// ============================================
// PDF EXPORT SYSTEM - OPTIMIZED FOR CLEAN A4 REPORTS
// ============================================

// Variable untuk mencegah multiple export
let isExporting = false;

// Helper function untuk menambahkan footer yang seragam
function addFooter(pdf, currentPage, totalPages) {
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    
    // Footer text - Engineered by Eghy Al Vandi (tengah bawah)
    pdf.setFontSize(8); // PERBAIKAN: Kecilkan font footer
    pdf.setTextColor(148, 163, 184);
    pdf.text('Engineered by Eghy Al Vandi', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Page info - Page X of Y
    pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
}

// PERBAIKAN: Fungsi untuk mengecek page break
function checkPageBreak(pdf, currentY, minMargin = 25) { // PERBAIKAN: Kurangi minMargin dari 30 ke 25
    const pageHeight = 297; // A4 height in mm
    return currentY + minMargin > pageHeight;
}

// PERBAIKAN BUG 6: Fungsi untuk membersihkan teks dari karakter khusus
function sanitizeText(text) {
    if (!text) return '';
    
    // Ganti karakter khusus dengan karakter yang aman
    return text
        .replace(/[!»«]/g, '')  // Hapus karakter khusus seperti !»
        .replace(/×/g, 'x')      // Ganti × dengan x untuk konsistensi
        .replace(/[^\x00-\x7F]/g, ''); // Hapus karakter non-ASCII
}

// PERBAIKAN TAMBAHAN 1: Fungsi untuk mengelompokkan item yang sama
function groupUniqueItems(items) {
    const groups = new Map();
    
    items.forEach(item => {
        // Buat key unik berdasarkan ID dan dimensi
        let key;
        if (item.originalWidth && item.originalHeight) {
            // Untuk item 2D
            key = `${item.originalId}_${item.originalWidth}_${item.originalHeight}_${item.rotated || false}`;
        } else {
            // Untuk item 1D
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

// PERBAIKAN TAMBAHAN 2: Fungsi untuk membuat tabel input yang lebih kompak
function createCompactInputTable(pdf, items, startY, options = {}) {
    const { 
        is2D = false, 
        kerfWidth = 0,
        maxRowsOnFirstPage = 15 // Maksimal baris di halaman pertama
    } = options;
    
    let y = startY;
    const margin = 20;
    const tableWidth = 170;
    
    // Tentukan ukuran font berdasarkan jumlah item
    const fontSize = items.length > 20 ? 8 : 9; // Font lebih kecil jika banyak item
    const rowHeight = items.length > 20 ? 6 : 7; // Baris lebih rapat jika banyak item
    const headerHeight = items.length > 20 ? 8 : 10;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize + 1);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Input Cut List', margin, y);
    y += 8; // PERBAIKAN: Jarak lebih proporsional
    
    // Table headers
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, tableWidth, headerHeight, 'F');
    
    pdf.setFontSize(fontSize);
    pdf.setTextColor(71, 85, 105);
    
    if (is2D) {
        pdf.text('ID', margin + 5, y + headerHeight / 2 + 1);
        pdf.text('Width', margin + 40, y + headerHeight / 2 + 1);
        pdf.text('Height', margin + 70, y + headerHeight / 2 + 1);
        pdf.text('Qty', margin + 100, y + headerHeight / 2 + 1);
        pdf.text('Area', margin + 120, y + headerHeight / 2 + 1);
    } else {
        pdf.text('ID', margin + 5, y + headerHeight / 2 + 1);
        pdf.text('Length', margin + 40, y + headerHeight / 2 + 1);
        pdf.text('Qty', margin + 80, y + headerHeight / 2 + 1);
        pdf.text('Total', margin + 110, y + headerHeight / 2 + 1);
    }
    
    y += headerHeight + 4; // PERBAIKAN: Jarak lebih proporsional
    
    // Table rows
    const itemsToShowOnFirstPage = items.slice(0, maxRowsOnFirstPage);
    
    itemsToShowOnFirstPage.forEach((item, index) => {
        // Jika melebihi batas halaman pertama, berhenti
        if (y > 250 && index >= maxRowsOnFirstPage) {
            return;
        }
        
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 41, 59);
        
        // Alternating row background
        if (index % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, y - rowHeight/2, tableWidth, rowHeight + 1, 'F');
        }
        
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
    
    // Jika ada item lebih dari yang ditampilkan di halaman pertama
    if (items.length > maxRowsOnFirstPage) {
        const remaining = items.length - maxRowsOnFirstPage;
        pdf.setFontSize(fontSize - 1);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 116, 139);
        pdf.text(`...and ${remaining} more items (continued on next page if needed)`, margin, y + 5);
        y += 10;
    }
    
    return y;
}

// 1D OPTIMIZER PDF EXPORT
async function export1DToPDF(result, formData, itemColors) {
    // Cegah multiple export
    if (isExporting) {
        console.warn('PDF export already in progress');
        return Promise.resolve(false);
    }
    
    return new Promise(async (resolve, reject) => {
        try {
            isExporting = true;
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Set document properties
            pdf.setProperties({
                title: '1D Cutting Optimization Report',
                subject: 'Linear Material Cutting Analysis',
                author: 'EAV Cutting Optimizer',
                creator: 'Eghy Al Vandi'
            });
            
            // ========== PAGE 1: COVER PAGE ==========
            pdf.setFont('helvetica', 'normal');
            
            // Header dengan warna putih
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 35, 'F'); // PERBAIKAN: Kurangi tinggi header
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(22); // PERBAIKAN: Kecilkan font judul
            pdf.setFont('helvetica', 'bold');
            pdf.text('CUTTING OPTIMIZATION REPORT', 105, 20, { align: 'center' }); // PERBAIKAN: Naikkan posisi
            
            pdf.setFontSize(11); // PERBAIKAN: Kecilkan font subtitle
            pdf.text('1D Linear Material Optimization', 105, 28, { align: 'center' }); // PERBAIKAN: Naikkan posisi
            
            // Main content area
            pdf.setTextColor(30, 41, 59);
            let y = 45; // PERBAIKAN: Mulai lebih awal
            
            // Report type
            pdf.setFontSize(16); // PERBAIKAN: Kecilkan font
            pdf.text('1D CUTTING ANALYSIS', 20, y);
            y += 12; // PERBAIKAN: Kurangi jarak
            
            // Divider line
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(20, y, 190, y);
            y += 15; // PERBAIKAN: Kurangi jarak
            
            // Summary information
            pdf.setFontSize(11); // PERBAIKAN: Kecilkan font
            pdf.setFont('helvetica', 'bold');
            pdf.text('Project Summary', 20, y);
            y += 8; // PERBAIKAN: Kurangi jarak
            
            pdf.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            pdf.text(`Date: ${dateStr}`, 20, y);
            pdf.text(`Material Length: ${formatNumber(formData.materialLength)} mm`, 110, y);
            y += 6; // PERBAIKAN: Kurangi jarak
            
            pdf.text(`Algorithm: ${formData.algorithm}`, 20, y);
            pdf.text(`Kerf Width: ${formatNumber(formData.kerfWidth)} mm`, 110, y);
            y += 12; // PERBAIKAN: Kurangi jarak
            
            // Key metrics
            pdf.setFont('helvetica', 'bold');
            pdf.text('Optimization Results', 20, y);
            y += 8; // PERBAIKAN: Kurangi jarak
            
            const totalWaste = parseInt(result.totalWaste) || 0;
            const totalUsedLength = parseInt(result.totalUsedLength) || 0;
            const totalMaterialLength = totalUsedLength + totalWaste;
            const efficiency = totalMaterialLength > 0 ? Math.round((totalUsedLength / totalMaterialLength) * 100) : 0;
            
            // Metrics in a clean grid
            const metrics = [
                { label: 'Total Bars', value: formatNumber(result.totalBars) },
                { label: 'Total Items', value: formatNumber(result.totalItems) },
                { label: 'Material Efficiency', value: `${formatNumber(efficiency)}%` },
                { label: 'Total Waste', value: `${formatNumber(totalWaste)} mm` },
                { label: 'Material Used', value: `${formatNumber(totalUsedLength)} mm` },
                { label: 'Execution Time', value: `${formatNumber(result.executionTime)} ms` }
            ];
            
            const col1X = 25;
            const col2X = 105;
            
            metrics.forEach((metric, index) => {
                const x = index % 2 === 0 ? col1X : col2X;
                const rowY = y + Math.floor(index / 2) * 10; // PERBAIKAN: Kurangi jarak baris dari 12 ke 10
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                pdf.setTextColor(100, 116, 139);
                pdf.text(metric.label, x, rowY);
                
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10); // PERBAIKAN: Kecilkan font
                pdf.setTextColor(30, 41, 59);
                pdf.text(metric.value, x + 50, rowY);
            });
            
            y += 35; // PERBAIKAN: Kurangi jarak dari 50 ke 35
            
            // PERBAIKAN TAMBAHAN 2: Gunakan fungsi kompak untuk input cut list
            if (formData.items && formData.items.length > 0) {
                // Cek apakah masih muat di halaman pertama
                const estimatedTableHeight = 30 + (Math.min(formData.items.length, 15) * 6);
                if (!checkPageBreak(pdf, y, estimatedTableHeight + 20)) {
                    // Masih muat, buat tabel kompak
                    y = createCompactInputTable(pdf, formData.items, y, {
                        is2D: false,
                        kerfWidth: formData.kerfWidth,
                        maxRowsOnFirstPage: 15
                    });
                } else {
                    // Tidak muat, hanya beri ringkasan
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 41, 59);
                    pdf.text(`Input Items: ${formData.items.length} items (see next page for details)`, 20, y);
                    y += 10;
                }
            }
            
            // Footer untuk cover page
            addFooter(pdf, 1, 1 + Math.ceil(result.bars?.length / 2) || 1);
            
            // PERBAIKAN TAMBAHAN 2: Halaman input cut list jika tidak muat di halaman pertama
            if (formData.items && formData.items.length > 15) {
                pdf.addPage();
                
                // Page header
                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, 0, 210, 25, 'F'); // Header lebih kecil
                
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text('INPUT CUT LIST (CONTINUED)', 105, 15, { align: 'center' });
                
                let currentY = 35;
                
                // Tabel lanjutan dengan font kecil
                const fontSize = 8;
                const rowHeight = 6;
                const headerHeight = 8;
                
                // Table headers
                pdf.setFillColor(241, 245, 249);
                pdf.rect(20, currentY, 170, headerHeight, 'F');
                
                pdf.setFontSize(fontSize);
                pdf.setTextColor(71, 85, 105);
                pdf.text('ID', 25, currentY + headerHeight / 2 + 1);
                pdf.text('Length (mm)', 65, currentY + headerHeight / 2 + 1);
                pdf.text('Quantity', 115, currentY + headerHeight / 2 + 1);
                pdf.text('Total (mm)', 155, currentY + headerHeight / 2 + 1);
                
                currentY += headerHeight + 4;
                
                // Table rows mulai dari item ke-16
                const startIdx = 15;
                formData.items.slice(startIdx).forEach((item, index) => {
                    const actualIndex = startIdx + index;
                    
                    // Check page break
                    if (currentY > 270) {
                        pdf.addPage();
                        currentY = 35;
                        
                        // Redraw headers
                        pdf.setFillColor(241, 245, 249);
                        pdf.rect(20, currentY, 170, headerHeight, 'F');
                        
                        pdf.setFontSize(fontSize);
                        pdf.setTextColor(71, 85, 105);
                        pdf.text('ID', 25, currentY + headerHeight / 2 + 1);
                        pdf.text('Length (mm)', 65, currentY + headerHeight / 2 + 1);
                        pdf.text('Quantity', 115, currentY + headerHeight / 2 + 1);
                        pdf.text('Total (mm)', 155, currentY + headerHeight / 2 + 1);
                        
                        currentY += headerHeight + 4;
                    }
                    
                    const actualLength = Math.round(item.length - formData.kerfWidth);
                    const totalLength = actualLength * item.quantity;
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(30, 41, 59);
                    
                    // Alternating row background
                    if (actualIndex % 2 === 0) {
                        pdf.setFillColor(248, 250, 252);
                        pdf.rect(20, currentY - rowHeight/2, 170, rowHeight + 1, 'F');
                    }
                    
                    pdf.text(sanitizeText(item.id), 25, currentY);
                    pdf.text(formatNumber(actualLength), 65, currentY);
                    pdf.text(formatNumber(item.quantity), 115, currentY);
                    pdf.text(formatNumber(totalLength), 155, currentY);
                    
                    currentY += rowHeight;
                });
                
                // Footer untuk halaman input
                addFooter(pdf, 2, 2 + Math.ceil(result.bars?.length / 2) || 1);
            }
            
            // Jika ada bars, buat halaman visualisasi
            if (result.bars && result.bars.length > 0) {
                const barsPerPage = 2;
                const totalBarPages = Math.ceil(result.bars.length / barsPerPage);
                
                for (let pageIdx = 0; pageIdx < totalBarPages; pageIdx++) {
                    pdf.addPage();
                    
                    // Page header dengan warna putih
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, 210, 25, 'F'); // PERBAIKAN: Header lebih kecil
                    
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(13); // PERBAIKAN: Kecilkan font
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('BAR VISUALIZATION', 105, 15, { align: 'center' }); // PERBAIKAN: Naikkan posisi
                    
                    // Draw bars untuk halaman ini
                    const startIdx = pageIdx * barsPerPage;
                    const endIdx = Math.min(startIdx + barsPerPage, result.bars.length);
                    const pageBars = result.bars.slice(startIdx, endIdx);
                    
                    let currentY = 40; // PERBAIKAN: Mulai lebih awal
                    
                    pageBars.forEach((bar, index) => {
                        // Check page break untuk setiap bar
                        if (currentY > 230) { // PERBAIKAN: Threshold lebih rendah
                            pdf.addPage();
                            currentY = 40;
                        }
                        
                        // Bar header
                        pdf.setTextColor(30, 41, 59);
                        pdf.setFontSize(10); // PERBAIKAN: Kecilkan font
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(`Bar ${bar.id}`, 20, currentY);
                        
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                        pdf.setTextColor(71, 85, 105);
                        pdf.text(`Efficiency: ${formatNumber(bar.efficiency)}% | Items: ${bar.items.length} | Waste: ${formatNumber(bar.remainingLength)} mm`, 20, currentY + 5);
                        
                        currentY += 12; // PERBAIKAN: Kurangi jarak dari 15 ke 12
                        
                        // Bar visualization container
                        const barWidth = 170;
                        const barHeight = 20; // PERBAIKAN: Kecilkan tinggi bar
                        const scale = barWidth / formData.materialLength;
                        
                        // Bar background
                        pdf.setDrawColor(226, 232, 240);
                        pdf.setLineWidth(0.5);
                        pdf.rect(20, currentY, barWidth, barHeight);
                        
                        // Draw segments - Hanya ID saja di tengah
                        let currentX = 0;
                        bar.items.forEach(item => {
                            const segmentWidth = item.originalLength * scale;
                            const color = getItemColor(item.originalId, itemColors);
                            
                            // Draw segment dengan outline
                            pdf.setFillColor(color.r, color.g, color.b);
                            pdf.setDrawColor(255, 255, 255);
                            pdf.setLineWidth(0.3);
                            pdf.rect(20 + currentX, currentY, segmentWidth, barHeight, 'FD');
                            
                            // Tambah label jika segment cukup lebar - Hanya ID saja di tengah
                            if (segmentWidth > 10) {
                                pdf.setTextColor(255, 255, 255);
                                pdf.setFontSize(8); // PERBAIKAN: Kecilkan font
                                pdf.setFont('helvetica', 'bold');
                                
                                const centerX = 20 + currentX + segmentWidth / 2;
                                const centerY = currentY + barHeight / 2;
                                
                                // Hanya tampilkan ID saja di tengah
                                pdf.text(item.originalId, centerX, centerY, { align: 'center', baseline: 'middle' });
                            }
                            
                            currentX += segmentWidth;
                        });
                        
                        // Draw waste segment jika ada
                        if (bar.remainingLength > 0) {
                            const wasteWidth = bar.remainingLength * scale;
                            pdf.setFillColor(241, 245, 249);
                            pdf.setDrawColor(226, 232, 240);
                            pdf.rect(20 + currentX, currentY, wasteWidth, barHeight, 'FD');
                            
                            if (wasteWidth > 25) {
                                pdf.setTextColor(148, 163, 184);
                                pdf.setFontSize(7); // PERBAIKAN: Kecilkan font
                                pdf.setFont('helvetica', 'italic');
                                pdf.text('WASTE', 20 + currentX + wasteWidth / 2, currentY + barHeight / 2, 
                                        { align: 'center', baseline: 'middle' });
                            }
                        }
                        
                        currentY += barHeight + 10; // PERBAIKAN: Kurangi jarak dari 12 ke 10
                        
                        // PERBAIKAN TAMBAHAN 1: Tampilkan item unik saja dengan quantity
                        pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(30, 41, 59);
                        pdf.text(`Items on Bar ${bar.id}:`, 20, currentY);
                        currentY += 5; // PERBAIKAN: Kurangi jarak
                        
                        // Dapatkan item unik dari bar ini
                        const uniqueItems = groupUniqueItems(bar.items);
                        const maxItems = 8;
                        const itemsToShow = uniqueItems.slice(0, maxItems);
                        
                        const colWidth = 80;
                        itemsToShow.forEach((item, i) => {
                            const col = i % 2;
                            const row = Math.floor(i / 2);
                            const x = 25 + (col * colWidth);
                            const rowY = currentY + (row * 6); // PERBAIKAN: Jarak baris lebih rapat
                            
                            const color = getItemColor(item.id, itemColors);
                            
                            // Color indicator
                            pdf.setFillColor(color.r, color.g, color.b);
                            pdf.rect(x, rowY - 3, 4, 4, 'F');
                            
                            // Item info dengan quantity
                            pdf.setFontSize(8); // PERBAIKAN: Kecilkan font
                            pdf.setFont('helvetica', 'normal');
                            pdf.setTextColor(71, 85, 105);
                            
                            let itemText = `${item.id}: ${formatNumber(item.length)} mm`;
                            if (item.count > 1) {
                                itemText += ` (×${item.count})`;
                            }
                            
                            pdf.text(itemText, x + 7, rowY);
                        });
                        
                        // Hitung baris yang digunakan
                        const rowsUsed = Math.ceil(itemsToShow.length / 2);
                        currentY += rowsUsed * 6 + 10; // PERBAIKAN: Kurangi jarak
                        
                        // PERBAIKAN: Jika ada items lebih dari maxItems, tambah keterangan
                        if (uniqueItems.length > maxItems) {
                            pdf.setFontSize(7); // PERBAIKAN: Kecilkan font
                            pdf.setFont('helvetica', 'italic');
                            pdf.setTextColor(100, 116, 139);
                            pdf.text(`...and ${uniqueItems.length - maxItems} more unique items`, 20, currentY);
                            currentY += 5; // PERBAIKAN: Kurangi jarak
                        }
                    });
                    
                    // Page footer
                    const pageOffset = formData.items && formData.items.length > 15 ? 3 : 2;
                    const currentPage = pageIdx + pageOffset;
                    addFooter(pdf, currentPage, pageOffset + totalBarPages);
                }
            }
            
            // Save PDF - HANYA SATU FILE
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `1D-Cutting-Report-${timestamp}.pdf`;
            
            // Simpan PDF dengan penundaan untuk mencegah multiple download
            setTimeout(() => {
                pdf.save(filename);
                console.log('1D PDF report generated successfully');
                isExporting = false;
                resolve(true);
            }, 100);
            
        } catch (error) {
            console.error('1D PDF Export Error:', error);
            isExporting = false;
            reject(error);
        }
    });
}

// 2D OPTIMIZER PDF EXPORT
async function export2DToPDF(result, formData, itemColors) {
    // Cegah multiple export
    if (isExporting) {
        console.warn('PDF export already in progress');
        return Promise.resolve(false);
    }
    
    return new Promise(async (resolve, reject) => {
        try {
            isExporting = true;
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Set document properties
            pdf.setProperties({
                title: '2D Plate Cutting Report',
                subject: 'Sheet Material Optimization Analysis',
                author: 'EAV Cutting Optimizer',
                creator: 'Eghy Al Vandi'
            });
            
            // ========== PAGE 1: COVER PAGE ==========
            pdf.setFont('helvetica', 'normal');
            
            // Header dengan warna putih
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 35, 'F'); // PERBAIKAN: Header lebih kecil
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(22); // PERBAIKAN: Kecilkan font
            pdf.setFont('helvetica', 'bold');
            pdf.text('PLATE CUTTING REPORT', 105, 20, { align: 'center' });
            
            pdf.setFontSize(11); // PERBAIKAN: Kecilkan font
            pdf.text('2D Sheet Material Optimization', 105, 28, { align: 'center' });
            
            // Main content area
            pdf.setTextColor(30, 41, 59);
            let y = 45; // PERBAIKAN: Mulai lebih awal
            
            // Report type
            pdf.setFontSize(16); // PERBAIKAN: Kecilkan font
            pdf.text('2D PLATE ANALYSIS', 20, y);
            y += 12; // PERBAIKAN: Kurangi jarak
            
            // Divider line
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(20, y, 190, y);
            y += 15; // PERBAIKAN: Kurangi jarak
            
            // Project information
            pdf.setFontSize(11); // PERBAIKAN: Kecilkan font
            pdf.setFont('helvetica', 'bold');
            pdf.text('Project Details', 20, y);
            y += 8; // PERBAIKAN: Kurangi jarak
            
            pdf.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const plateWidth = parseInt(formData.plateWidth) || 2440;
            const plateHeight = parseInt(formData.plateHeight) || 1220;
            const kerfWidth = parseInt(formData.kerfWidth2d) || 0;
            const algorithm = formData.algorithm2d || 'GUILLOTINE';
            
            pdf.text(`Date: ${dateStr}`, 20, y);
            pdf.text(`Plate Size: ${formatNumber(plateWidth)} × ${formatNumber(plateHeight)} mm`, 110, y);
            y += 6; // PERBAIKAN: Kurangi jarak
            
            pdf.text(`Algorithm: ${algorithm}`, 20, y);
            // PERBAIKAN: Ubah m² menjadi mm²
            pdf.text(`Plate Area: ${formatNumber(plateWidth * plateHeight)} mm²`, 110, y);
            y += 6; // PERBAIKAN: Kurangi jarak
            
            pdf.text(`Kerf Width: ${formatNumber(kerfWidth)} mm`, 20, y);
            y += 12; // PERBAIKAN: Kurangi jarak
            
            // Key metrics
            pdf.setFont('helvetica', 'bold');
            pdf.text('Optimization Results', 20, y);
            y += 8; // PERBAIKAN: Kurangi jarak
            
            const totalPlates = parseInt(result.totalPlates) || 0;
            const totalUsedArea = parseInt(result.totalUsedArea) || 0;
            const totalPlateArea = totalPlates * plateWidth * plateHeight;
            const totalWasteArea = Math.max(0, totalPlateArea - totalUsedArea);
            const efficiency = totalPlateArea > 0 ? Math.round((totalUsedArea / totalPlateArea) * 100) : 0;
            
            // Metrics in a clean grid
            // PERBAIKAN: Ubah semua satuan m² menjadi mm²
            const metrics = [
                { label: 'Total Plates', value: formatNumber(totalPlates) },
                { label: 'Total Items', value: formatNumber(result.totalItems) },
                { label: 'Material Efficiency', value: `${formatNumber(efficiency)}%` },
                { label: 'Waste Area', value: `${formatNumber(totalWasteArea)} mm²` },
                { label: 'Used Area', value: `${formatNumber(totalUsedArea)} mm²` },
                { label: 'Execution Time', value: `${formatNumber(result.executionTime)} ms` }
            ];
            
            const col1X = 25;
            const col2X = 105;
            
            metrics.forEach((metric, index) => {
                const x = index % 2 === 0 ? col1X : col2X;
                const rowY = y + Math.floor(index / 2) * 10; // PERBAIKAN: Kurangi jarak baris
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                pdf.setTextColor(100, 116, 139);
                pdf.text(metric.label, x, rowY);
                
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10); // PERBAIKAN: Kecilkan font
                pdf.setTextColor(30, 41, 59);
                pdf.text(metric.value, x + 50, rowY);
            });
            
            y += 35; // PERBAIKAN: Kurangi jarak dari 50 ke 35
            
            // PERBAIKAN TAMBAHAN 2: Gunakan fungsi kompak untuk input cut list
            if (formData.items && formData.items.length > 0) {
                // Cek apakah masih muat di halaman pertama
                const estimatedTableHeight = 30 + (Math.min(formData.items.length, 12) * 6);
                if (!checkPageBreak(pdf, y, estimatedTableHeight + 20)) {
                    // Masih muat, buat tabel kompak
                    y = createCompactInputTable(pdf, formData.items, y, {
                        is2D: true,
                        kerfWidth: kerfWidth,
                        maxRowsOnFirstPage: 12
                    });
                } else {
                    // Tidak muat, hanya beri ringkasan
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(30, 41, 59);
                    pdf.text(`Input Items: ${formData.items.length} items (see next page for details)`, 20, y);
                    y += 10;
                }
            }
            
            // Footer untuk cover page
            addFooter(pdf, 1, 1 + (result.plates?.length || 0));
            
            // Create plate visualization pages dengan ratio yang benar 1:2
            if (result.plates && result.plates.length > 0) {
                const platesPerPage = 1;
                const totalPlatePages = result.plates.length;
                
                for (let pageIdx = 0; pageIdx < totalPlatePages; pageIdx++) {
                    pdf.addPage();
                    
                    // Page header dengan putih
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, 210, 25, 'F'); // PERBAIKAN: Header lebih kecil
                    
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(13); // PERBAIKAN: Kecilkan font
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('PLATE VISUALIZATION', 105, 15, { align: 'center' });
                    
                    const plate = result.plates[pageIdx];
                    let currentY = 40; // PERBAIKAN: Mulai lebih awal
                    
                    // Plate header
                    pdf.setTextColor(30, 41, 59);
                    pdf.setFontSize(11); // PERBAIKAN: Kecilkan font
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(`Plate ${plate.id}`, 20, currentY);
                    
                    const plateEfficiency = plate.getEfficiency ? plate.getEfficiency() : Math.round(plate.efficiency || 0);
                    const wasteArea = plate.getWasteArea ? plate.getWasteArea() : Math.round(plate.wasteArea || 0);
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                    pdf.setTextColor(71, 85, 105);
                    pdf.text(`${formatNumber(plateWidth)} × ${formatNumber(plateHeight)} mm | Efficiency: ${formatNumber(plateEfficiency)}% | Items: ${plate.items.length} | Waste: ${formatNumber(wasteArea)} mm²`, 
                            20, currentY + 5);
                    
                    currentY += 12; // PERBAIKAN: Kurangi jarak dari 15 ke 12
                    
                    // Plate visualization dengan ratio yang benar 1:2
                    const vizWidth = 170;
                    const plateRatio = plateHeight / plateWidth; // 1220/2440 = 0.5
                    const adjustedHeight = Math.min(vizWidth * plateRatio, 100); // PERBAIKAN: Kecilkan maksimal tinggi
                    
                    const scaleX = vizWidth / plateWidth;
                    const scaleY = adjustedHeight / plateHeight;
                    
                    // Plate container
                    pdf.setDrawColor(226, 232, 240);
                    pdf.setLineWidth(0.5);
                    pdf.rect(20, currentY, vizWidth, adjustedHeight);
                    
                    // Draw items - Hanya ID saja
                    plate.items.forEach(item => {
                        const itemX = 20 + (item.x * scaleX);
                        const itemY = currentY + (item.y * scaleY);
                        const itemWidth = item.width * scaleX;
                        const itemHeight = item.height * scaleY;
                        const color = getItemColor(item.originalId, itemColors);
                        
                        // Draw item dengan outline
                        pdf.setFillColor(color.r, color.g, color.b);
                        pdf.setDrawColor(255, 255, 255);
                        pdf.setLineWidth(0.3);
                        pdf.rect(itemX, itemY, itemWidth, itemHeight, 'FD');
                        
                        // Add label jika item cukup besar - Hanya ID saja di tengah
                        if (itemWidth > 10 && itemHeight > 10) {
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(7); // PERBAIKAN: Kecilkan font
                            pdf.setFont('helvetica', 'bold');
                            
                            const centerX = itemX + itemWidth / 2;
                            const centerY = itemY + itemHeight / 2;
                            
                            // Hanya tampilkan ID saja di tengah
                            pdf.text(item.originalId, centerX, centerY, { align: 'center', baseline: 'middle' });
                            
                            if (item.rotated) {
                                pdf.setFontSize(5); // PERBAIKAN: Kecilkan font
                                pdf.text('↻', itemX + itemWidth - 3, itemY + 3);
                            }
                        }
                    });
                    
                    currentY += adjustedHeight + 12; // PERBAIKAN: Kurangi jarak dari 15 ke 12
                    
                    // PERBAIKAN TAMBAHAN 1: Tampilkan item unik saja dengan quantity
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10); // PERBAIKAN: Kecilkan font
                    pdf.setTextColor(30, 41, 59);
                    pdf.text(`Items on Plate ${plate.id}:`, 20, currentY);
                    currentY += 5; // PERBAIKAN: Kurangi jarak
                    
                    // Dapatkan item unik dari plate ini
                    const uniqueItems = groupUniqueItems(plate.items);
                    const maxItems = 12;
                    const itemsToShow = uniqueItems.slice(0, maxItems);
                    
                    const colWidth = 85;
                    const cols = 2;
                    
                    itemsToShow.forEach((item, index) => {
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        const x = 25 + (col * colWidth);
                        const rowY = currentY + (row * 6); // PERBAIKAN: Jarak baris lebih rapat
                        
                        const color = getItemColor(item.id, itemColors);
                        const actualWidth = Math.round(item.width - kerfWidth);
                        const actualHeight = Math.round(item.height - kerfWidth);
                        
                        // Color indicator
                        pdf.setFillColor(color.r, color.g, color.b);
                        pdf.rect(x, rowY - 3, 4, 4, 'F');
                        
                        // Item info dengan quantity - PERBAIKAN: Gunakan sanitizeText
                        pdf.setFontSize(8); // PERBAIKAN: Kecilkan font
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(71, 85, 105);
                        
                        let itemText = `${item.id}: ${formatNumber(actualWidth)}×${formatNumber(actualHeight)}`;
                        if (item.rotated) itemText += ' ↻';
                        if (item.count > 1) {
                            itemText += ` (×${item.count})`;
                        }
                        
                        // PERBAIKAN: Bersihkan teks dari karakter khusus
                        pdf.text(sanitizeText(itemText), x + 7, rowY);
                    });
                    
                    // Hitung baris yang digunakan
                    const rowsUsed = Math.ceil(itemsToShow.length / cols);
                    currentY += rowsUsed * 6 + 8; // PERBAIKAN: Kurangi jarak
                    
                    // PERBAIKAN: Jika ada items lebih dari maxItems, tambah keterangan
                    if (uniqueItems.length > maxItems) {
                        pdf.setFontSize(7); // PERBAIKAN: Kecilkan font
                        pdf.setFont('helvetica', 'italic');
                        pdf.setTextColor(100, 116, 139);
                        pdf.text(`...and ${uniqueItems.length - maxItems} more unique items`, 20, currentY);
                        currentY += 5; // PERBAIKAN: Kurangi jarak
                    }
                    
                    // Page footer
                    const pageOffset = formData.items && formData.items.length > 12 ? 3 : 2;
                    const currentPage = pageIdx + pageOffset;
                    addFooter(pdf, currentPage, pageOffset + totalPlatePages);
                }
            }
            
            // Save PDF - HANYA SATU FILE
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `2D-Plate-Report-${timestamp}.pdf`;
            
            // Simpan PDF dengan penundaan untuk mencegah multiple download
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

// CUSTOM OPTIMIZER PDF EXPORT (FF-CA-01)
async function exportCustomToPDF(result, formData, itemColors) {
    // Cegah multiple export
    if (isExporting) {
        console.warn('PDF export already in progress');
        return Promise.resolve(false);
    }
    
    return new Promise(async (resolve, reject) => {
        try {
            isExporting = true;
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Set document properties
            pdf.setProperties({
                title: 'FF-CA-01 Cutting Report',
                subject: 'Specialized Ring Pattern Optimization',
                author: 'EAV Cutting Optimizer',
                creator: 'Eghy Al Vandi'
            });
            
            // ========== PAGE 1: COVER PAGE ==========
            pdf.setFont('helvetica', 'normal');
            
            // Header dengan warna putih
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 210, 35, 'F'); // PERBAIKAN: Header lebih kecil
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(22); // PERBAIKAN: Kecilkan font
            pdf.setFont('helvetica', 'bold');
            pdf.text('FF-CA-01 PATTERN REPORT', 105, 20, { align: 'center' });
            
            pdf.setFontSize(11); // PERBAIKAN: Kecilkan font
            pdf.text('Specialized Ring Cutting Pattern', 105, 28, { align: 'center' });
            
            // Main content area
            pdf.setTextColor(30, 41, 59);
            let y = 45; // PERBAIKAN: Mulai lebih awal
            
            // Report type
            pdf.setFontSize(16); // PERBAIKAN: Kecilkan font
            pdf.text('FF-CA-01 ANALYSIS', 20, y);
            y += 12; // PERBAIKAN: Kurangi jarak
            
            // Divider line
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.line(20, y, 190, y);
            y += 15; // PERBAIKAN: Kurangi jarak
            
            // Project information
            pdf.setFontSize(11); // PERBAIKAN: Kecilkan font
            pdf.setFont('helvetica', 'bold');
            pdf.text('Pattern Parameters', 20, y);
            y += 8; // PERBAIKAN: Kurangi jarak
            
            pdf.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const materialLength = 6000; // Fixed for FF-CA-01
            const kerfWidth = parseInt(formData.kerfWidth) || 0;
            const algorithm = formData.algorithm || 'first-fit';
            
            // Pastikan nilai dari input diambil dengan benar, bukan 0
            const smallRingA = parseInt(formData.smallRingA) || 0;
            const bigRingA = parseInt(formData.bigRingA) || 0;
            const smallRingB = parseInt(formData.smallRingB) || 0;
            const bigRingB = parseInt(formData.bigRingB) || 0;
            const multiplier = parseInt(formData.multiplier) || 1;
            
            pdf.text(`Date: ${dateStr}`, 20, y);
            pdf.text(`Material Length: ${formatNumber(materialLength)} mm`, 110, y);
            y += 6; // PERBAIKAN: Kurangi jarak
            
            pdf.text(`Algorithm: ${algorithm}`, 20, y);
            pdf.text(`Kerf Width: ${formatNumber(kerfWidth)} mm`, 110, y);
            y += 6; // PERBAIKAN: Kurangi jarak
            
            // Total Sets
            pdf.setTextColor(220, 38, 38); // Merah untuk highlight
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total Sets: ${formatNumber(multiplier)}`, 20, y);
            pdf.setTextColor(30, 41, 59); // Kembali ke warna normal
            y += 12; // PERBAIKAN: Kurangi jarak
            
            // Pattern Dimensions - PERBAIKAN: Sesuaikan jarak untuk menghindari overlap
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10); // PERBAIKAN: Kecilkan font
            pdf.setTextColor(30, 41, 59);
            pdf.text('Pattern Dimensions', 20, y);
            y += 6; // PERBAIKAN: Kurangi jarak judul ke tabel dari 8 ke 6
            
            // Table dengan desain lebih clean dan ramping
            const tableWidth = 160; // Lebih ramping dari 170
            const tableX = 25; // Geser ke kanan sedikit
            const tableY = y;
            
            // Header table dengan background abu-abu (lightGray) seperti 1D dan 2D
            pdf.setFillColor(241, 245, 249); // Light gray
            pdf.rect(tableX, tableY, tableWidth, 8, 'F'); // PERBAIKAN: Kecilkan tinggi header dari 10 ke 8
            
            pdf.setTextColor(71, 85, 105); // Dark gray text
            pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
            pdf.setFont('helvetica', 'bold');
            
            // Header columns yang lebih proporsional
            const col1 = 35;
            const col2 = 62;
            const col3 = 63;
            
            pdf.text('Pattern', tableX + 8, tableY + 5); // PERBAIKAN: Sesuaikan posisi vertikal (dari 7 ke 5)
            pdf.text('Small Ring', tableX + col1 + 8, tableY + 5);
            pdf.text('Big Ring', tableX + col1 + col2 + 8, tableY + 5);
            
            y += 8;
            
            // Row untuk Pattern A
            pdf.setFillColor(255, 255, 255);
            pdf.rect(tableX, y, tableWidth, 7, 'F'); // PERBAIKAN: Kecilkan tinggi row dari 8 ke 7
            
            pdf.setTextColor(30, 41, 59);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
            pdf.text('A', tableX + 8, y + 5); // PERBAIKAN: Sesuaikan posisi vertikal (dari 6 ke 5)
            pdf.text(`${formatNumber(smallRingA)} mm`, tableX + col1 + 8, y + 5);
            pdf.text(`${formatNumber(bigRingA)} mm`, tableX + col1 + col2 + 8, y + 5);
            
            y += 7;
            
            // Row untuk Pattern B
            pdf.setFillColor(248, 250, 252); // Very light gray untuk row alternatif
            pdf.rect(tableX, y, tableWidth, 7, 'F'); // PERBAIKAN: Kecilkan tinggi row dari 8 ke 7
            
            pdf.text('B', tableX + 8, y + 5); // PERBAIKAN: Sesuaikan posisi vertikal (dari 6 ke 5)
            pdf.text(`${formatNumber(smallRingB)} mm`, tableX + col1 + 8, y + 5);
            pdf.text(`${formatNumber(bigRingB)} mm`, tableX + col1 + col2 + 8, y + 5);
            
            y += 7; // PERBAIKAN: Tambah jarak setelah baris terakhir
            
            // Border untuk table
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.5);
            pdf.rect(tableX, tableY, tableWidth, 22); // PERBAIKAN: Sesuaikan tinggi total (8 header + 7 + 7 = 22)
            
            // Divider lines untuk columns
            pdf.line(tableX + col1, tableY, tableX + col1, tableY + 22);
            pdf.line(tableX + col1 + col2, tableY, tableX + col1 + col2, tableY + 22);
            
            y += 15; // PERBAIKAN: Tambah jarak setelah tabel dari 12 ke 15 agar tidak terlalu dekat dengan Optimization Results
            
            // Key metrics
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11); // PERBAIKAN: Kecilkan font
            pdf.setTextColor(30, 41, 59);
            pdf.text('Optimization Results', 20, y);
            y += 8; // PERBAIKAN: Kurangi jarak
            
            const totalWaste = parseInt(result.totalWaste) || 0;
            const totalUsedLength = parseInt(result.totalUsedLength) || 0;
            const totalMaterialLength = totalUsedLength + totalWaste;
            const efficiency = totalMaterialLength > 0 ? Math.round((totalUsedLength / totalMaterialLength) * 100) : 0;
            
            // Metrics in a clean grid - Total Sets = multiplier
            const metrics = [
                { label: 'Total Bars', value: formatNumber(result.totalBars) },
                { label: 'Total Sets', value: formatNumber(multiplier) },
                { label: 'Material Efficiency', value: `${formatNumber(efficiency)}%` },
                { label: 'Total Waste', value: `${formatNumber(totalWaste)} mm` },
                { label: 'Material Used', value: `${formatNumber(totalUsedLength)} mm` },
                { label: 'Execution Time', value: `${formatNumber(result.executionTime)} ms` }
            ];
            
            const col1X = 25;
            const col2X = 105;
            
            metrics.forEach((metric, index) => {
                const x = index % 2 === 0 ? col1X : col2X;
                const rowY = y + Math.floor(index / 2) * 10; // PERBAIKAN: Kurangi jarak baris
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                pdf.setTextColor(100, 116, 139);
                pdf.text(metric.label, x, rowY);
                
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10); // PERBAIKAN: Kecilkan font
                pdf.setTextColor(30, 41, 59);
                pdf.text(metric.value, x + 50, rowY);
            });
            
            y += 35; // PERBAIKAN: Kurangi jarak dari 50 ke 35
            
            // Footer untuk cover page
            addFooter(pdf, 1, 1 + Math.ceil(result.bars?.length / 2) || 1);
            
            // Create bar visualization pages
            if (result.bars && result.bars.length > 0) {
                const barsPerPage = 2;
                const totalBarPages = Math.ceil(result.bars.length / barsPerPage);
                
                for (let pageIdx = 0; pageIdx < totalBarPages; pageIdx++) {
                    pdf.addPage();
                    
                    // Page header dengan putih
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, 210, 25, 'F'); // PERBAIKAN: Header lebih kecil
                    
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(13); // PERBAIKAN: Kecilkan font
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('FF-CA-01 BAR VISUALIZATION', 105, 15, { align: 'center' });
                    
                    // Draw bars untuk halaman ini
                    const startIdx = pageIdx * barsPerPage;
                    const endIdx = Math.min(startIdx + barsPerPage, result.bars.length);
                    const pageBars = result.bars.slice(startIdx, endIdx);
                    
                    let currentY = 40; // PERBAIKAN: Mulai lebih awal
                    
                    pageBars.forEach((bar, index) => {
                        // Check page break
                        if (currentY > 230) { // PERBAIKAN: Threshold lebih rendah
                            pdf.addPage();
                            currentY = 40;
                        }
                        
                        // Bar header
                        pdf.setTextColor(30, 41, 59);
                        pdf.setFontSize(10); // PERBAIKAN: Kecilkan font
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(`Bar ${bar.id}`, 20, currentY);
                        
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                        pdf.setTextColor(71, 85, 105);
                        pdf.text(`Efficiency: ${formatNumber(bar.efficiency)}% | Items: ${bar.items.length} | Waste: ${formatNumber(bar.remainingLength)} mm`, 
                                20, currentY + 5);
                        
                        currentY += 12; // PERBAIKAN: Kurangi jarak
                        
                        // Bar visualization
                        const barWidth = 170;
                        const barHeight = 20; // PERBAIKAN: Kecilkan tinggi bar
                        const scale = barWidth / materialLength;
                        
                        // Bar background
                        pdf.setDrawColor(226, 232, 240);
                        pdf.setLineWidth(0.5);
                        pdf.rect(20, currentY, barWidth, barHeight);
                        
                        // Draw segments - Hanya ID saja di tengah
                        let currentX = 0;
                        bar.items.forEach(item => {
                            const segmentWidth = item.originalLength * scale;
                            const color = getItemColor(item.originalId, itemColors);
                            
                            // Draw segment dengan outline
                            pdf.setFillColor(color.r, color.g, color.b);
                            pdf.setDrawColor(255, 255, 255);
                            pdf.setLineWidth(0.3);
                            pdf.rect(20 + currentX, currentY, segmentWidth, barHeight, 'FD');
                            
                            // Add label jika segment cukup lebar - Hanya ID saja di tengah
                            if (segmentWidth > 10) {
                                pdf.setTextColor(255, 255, 255);
                                pdf.setFontSize(8); // PERBAIKAN: Kecilkan font
                                pdf.setFont('helvetica', 'bold');
                                
                                const centerX = 20 + currentX + segmentWidth / 2;
                                const centerY = currentY + barHeight / 2;
                                
                                // Hanya tampilkan ID saja di tengah
                                pdf.text(item.originalId, centerX, centerY, { align: 'center', baseline: 'middle' });
                            }
                            
                            currentX += segmentWidth;
                        });
                        
                        // Draw waste segment jika ada
                        if (bar.remainingLength > 0) {
                            const wasteWidth = bar.remainingLength * scale;
                            pdf.setFillColor(241, 245, 249);
                            pdf.setDrawColor(226, 232, 240);
                            pdf.rect(20 + currentX, currentY, wasteWidth, barHeight, 'FD');
                            
                            if (wasteWidth > 25) {
                                pdf.setTextColor(148, 163, 184);
                                pdf.setFontSize(7); // PERBAIKAN: Kecilkan font
                                pdf.setFont('helvetica', 'italic');
                                pdf.text('WASTE', 20 + currentX + wasteWidth / 2, currentY + barHeight / 2, 
                                        { align: 'center', baseline: 'middle' });
                            }
                        }
                        
                        currentY += barHeight + 10; // PERBAIKAN: Kurangi jarak
                        
                        // PERBAIKAN TAMBAHAN 1: Tampilkan item unik saja dengan quantity
                        pdf.setFontSize(9); // PERBAIKAN: Kecilkan font
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(30, 41, 59);
                        pdf.text(`Items on Bar ${bar.id}:`, 20, currentY);
                        currentY += 5; // PERBAIKAN: Kurangi jarak
                        
                        // Dapatkan item unik dari bar ini
                        const uniqueItems = groupUniqueItems(bar.items);
                        const maxItems = 8;
                        const itemsToShow = uniqueItems.slice(0, maxItems);
                        
                        const colWidth = 80;
                        itemsToShow.forEach((item, i) => {
                            const col = i % 2;
                            const row = Math.floor(i / 2);
                            const x = 25 + (col * colWidth);
                            const rowY = currentY + (row * 6); // PERBAIKAN: Jarak baris lebih rapat
                            
                            const color = getItemColor(item.id, itemColors);
                            
                            // Color indicator
                            pdf.setFillColor(color.r, color.g, color.b);
                            pdf.rect(x, rowY - 3, 4, 4, 'F');
                            
                            // Item info dengan quantity
                            pdf.setFontSize(8); // PERBAIKAN: Kecilkan font
                            pdf.setFont('helvetica', 'normal');
                            pdf.setTextColor(71, 85, 105);
                            
                            let itemText = `${item.id}: ${formatNumber(item.length)} mm`;
                            if (item.count > 1) {
                                itemText += ` (×${item.count})`;
                            }
                            
                            pdf.text(itemText, x + 7, rowY);
                        });
                        
                        // Hitung baris yang digunakan
                        const rowsUsed = Math.ceil(itemsToShow.length / 2);
                        currentY += rowsUsed * 6 + 10; // PERBAIKAN: Kurangi jarak
                        
                        // PERBAIKAN: Jika ada items lebih dari maxItems, tambah keterangan
                        if (uniqueItems.length > maxItems) {
                            pdf.setFontSize(7); // PERBAIKAN: Kecilkan font
                            pdf.setFont('helvetica', 'italic');
                            pdf.setTextColor(100, 116, 139);
                            pdf.text(`...and ${uniqueItems.length - maxItems} more unique items`, 20, currentY);
                            currentY += 5; // PERBAIKAN: Kurangi jarak
                        }
                    });
                    
                    // Page footer
                    const currentPage = pageIdx + 2; // +2 karena page 1 adalah cover
                    addFooter(pdf, currentPage, 1 + totalBarPages);
                }
            }
            
            // Save PDF - HANYA SATU FILE
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `FF-CA-01-Report-${timestamp}.pdf`;
            
            // Simpan PDF dengan penundaan untuk mencegah multiple download
            setTimeout(() => {
                pdf.save(filename);
                console.log('FF-CA-01 PDF report generated successfully');
                isExporting = false;
                resolve(true);
            }, 100);
            
        } catch (error) {
            console.error('Custom PDF Export Error:', error);
            isExporting = false;
            reject(error);
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format number dengan thousand separators
function formatNumber(num, decimals = 0) {
    if (isNaN(num) || num === null || num === undefined) return '0';
    
    const rounded = decimals > 0 ? parseFloat(num).toFixed(decimals) : Math.round(num);
    return rounded.toLocaleString('en-US');
}

// Get color untuk item ID
function getItemColor(itemId, itemColors) {
    // Default color palette (earth tones)
    const defaultColors = [
        { r: 59, g: 130, b: 246 },   // Blue
        { r: 16, g: 185, b: 129 },   // Green
        { r: 245, g: 158, b: 11 },   // Yellow
        { r: 239, g: 68, b: 68 },    // Red
        { r: 139, g: 92, b: 246 },   // Purple
        { r: 236, g: 72, b: 153 },   // Pink
        { r: 6, g: 182, b: 212 },    // Cyan
        { r: 132, g: 204, b: 22 },   // Lime
        { r: 249, g: 115, b: 22 },   // Orange
        { r: 20, g: 184, b: 166 }    // Teal
    ];
    
    // Jika itemColors disediakan sebagai Map, gunakan itu
    if (itemColors && itemColors instanceof Map && itemColors.has(itemId)) {
        const hexColor = itemColors.get(itemId);
        return hexToRgb(hexColor);
    }
    
    // Fallback: generate consistent color berdasarkan itemId
    const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return defaultColors[hash % defaultColors.length];
}

// Convert hex color ke RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // Default blue
}

// Export functions untuk browser
window.export1DToPDF = export1DToPDF;
window.export2DToPDF = export2DToPDF;
window.exportCustomToPDF = exportCustomToPDF;

console.log('PDF export functions loaded successfully (Fully Optimized)');