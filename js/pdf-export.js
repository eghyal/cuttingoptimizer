/**
 * PDF Export Module - Reusable PDF generation functions
 * Pixel-Perfect Migration from React TypeScript
 * Made globally available without module system
 * Updated with QRIS Support
 * FIXED: exportProjectToPDF now inside IIFE to access helpers
 */

(function(window) {
  'use strict';

  // ============================================================================
  // PDF HELPER CONSTANTS & FUNCTIONS
  // ============================================================================

  var PAGE_MARGIN = 15;
  var FONT_COLOR_DARK = '#020617';
  var FONT_COLOR_MEDIUM = '#475569';
  var FONT_COLOR_LIGHT = '#64748b';
  var FONT_COLOR_RED = '#ef4444';
  var BORDER_COLOR = '#e2e8f0';
  var ROW_HIGHLIGHT_COLOR = '#f8fafc';
  var EFFICIENCY_GREEN = '#10b981';
  var EFFICIENCY_RED = '#ef4444';

  // ============================================================================
  // QR CODE CONFIGURATION - MASUKKAN GAMBAR QR CODE ANDA DI SINI
  // ============================================================================
  
  // ANDA BISA GUNAKAN SALAH SATU DARI DUA OPSI BERIKUT:
  
  // OPSI 1: URL Langsung ke gambar QR code (pastikan URL bisa diakses dan CORS-enabled)
  // Salin URL gambar QR code Anda di bawah ini (contoh menggunakan API QR Server):
  var QR_CODE_IMAGE_SRC = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021126610014COM.GO-JEK.WWW01189360091431965170060210G1965170060303UMI51440014ID.CO.QRIS.WWW0215ID10264739087250303UMI5204899953033605802ID5925First%20has%20to%20be%20Sketched%2C6014LAMPUNG%20TENGAH61053416462070703A016304DBAB";
  
  // OPSI 2: Data URL Base64 (LEBIH AMAN & TANPA MASALAH CORS)
  // Jika Anda memiliki base64 string gambar QR code, gunakan format:
  // var QR_CODE_IMAGE_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...";

  function addFooter(pdf, pageNum, totalPages) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_LIGHT);
      pdf.text('Engineered by Eghy Al Vandi', 105, 285, { align: 'center' });
      pdf.text('Page ' + pageNum + ' of ' + totalPages, 210 - PAGE_MARGIN, 285, { align: 'right' });
  }

  function addPageBreaks(pdf) {
      var totalPages = pdf.internal.getNumberOfPages();
      for (var i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          addFooter(pdf, i, totalPages);
      }
  }

  function checkAndAddPage(pdf, y, margin) {
      margin = margin || 20;
      if (y > 297 - margin) {
          pdf.addPage();
          return 25;
      }
      return y;
  }

  function drawSectionTitle(pdf, title, y) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(FONT_COLOR_DARK);
      pdf.text(title, PAGE_MARGIN, y);
      y += 4;
      pdf.setDrawColor(BORDER_COLOR);
      pdf.setLineWidth(0.2);
      pdf.line(PAGE_MARGIN, y, 210 - PAGE_MARGIN, y);
      return y + 10;
  }

  function drawTable(pdf, y, headers, data, colWidths) {
      var rowHeight = 10;
      var headerHeight = 10;
      var tableWidth = colWidths.reduce(function(a, b) { return a + b; }, 0);

      // Header
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(FONT_COLOR_MEDIUM);
      pdf.setFillColor(ROW_HIGHLIGHT_COLOR);
      pdf.rect(PAGE_MARGIN, y, tableWidth, headerHeight, 'F');
      var currentX = PAGE_MARGIN;
      for (var i = 0; i < headers.length; i++) {
          pdf.text(headers[i], currentX + 4, y + 7);
          currentX += colWidths[i];
      }
      y += headerHeight;

      // Rows
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_DARK);
      for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {
          var row = data[rowIndex];
          y = checkAndAddPage(pdf, y, 30);
          if (rowIndex > 0 && y === 25) {
               var newX = PAGE_MARGIN;
               pdf.setFontSize(9);
               pdf.setFont('helvetica', 'bold');
               pdf.setTextColor(FONT_COLOR_MEDIUM);
               pdf.setFillColor(ROW_HIGHLIGHT_COLOR);
               pdf.rect(PAGE_MARGIN, y - headerHeight, tableWidth, headerHeight, 'F');
               for (var j = 0; j < headers.length; j++) {
                  pdf.text(headers[j], newX + 4, y - 3);
                  newX += colWidths[j];
               }
               pdf.setFontSize(10);
               pdf.setFont('helvetica', 'normal');
          }

          if (rowIndex % 2 !== 0) {
              pdf.setFillColor(ROW_HIGHLIGHT_COLOR);
              pdf.rect(PAGE_MARGIN, y, tableWidth, rowHeight, 'F');
          }
          currentX = PAGE_MARGIN;
          for (var k = 0; k < row.length; k++) {
              var text = String(row[k]);
              if (headers[k] === 'Efficiency') {
                  var eff = parseInt(text.replace('%', ''), 10);
                  pdf.setTextColor(eff >= 90 ? EFFICIENCY_GREEN : EFFICIENCY_RED);
              } else {
                   pdf.setTextColor(FONT_COLOR_DARK);
              }
               pdf.text(text, currentX + 4, y + 6.5, { maxWidth: colWidths[k] - 8 });
              currentX += colWidths[k];
          }
          y += rowHeight;
      }
      return y;
  }

  function addDonationSection(pdf) {
      pdf.addPage();
      var y = 25;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(FONT_COLOR_DARK);
      pdf.text('SUPPORT THIS PROJECT', 105, y, { align: 'center' });
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_MEDIUM);
      var text = "This website is free to use.\nIf you find it helpful, please consider making a donation\nto support its maintenance and future development.";
      var lines = text.split('\n');
      pdf.text(lines, 105, y, { align: 'center' });
      y += lines.length * 5 + 15;

      // QR CODE IMPLEMENTATION
      var qrSize = 50; // Ukuran QR code dalam mm
      var qrX = (210 - qrSize) / 2; // Pusatkan secara horizontal

      // Menambahkan Box di belakang QR agar lebih rapi
      pdf.setDrawColor(BORDER_COLOR);
      pdf.rect(qrX - 5, y - 5, qrSize + 10, qrSize + 10, 'D');

      // Menggambar QR Code dari sumber yang telah dikonfigurasi
      try {
          pdf.addImage(QR_CODE_IMAGE_SRC, 'PNG', qrX, y, qrSize, qrSize);
      } catch (e) {
          console.error("Error loading QR image:", e);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(FONT_COLOR_RED);
          pdf.text('QR code could not be loaded', 105, y + (qrSize/2), { align: 'center' });
      }
      
      y += qrSize + 15;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(FONT_COLOR_DARK);
      pdf.text('FIRST HAS TO BE SKETCHED, DIGITAL & KREATIF', 105, y, { align: 'center' });
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_MEDIUM);
      pdf.text('NMID: ID1026473908725', 105, y, { align: 'center' });
  }

  // ============================================================================
  // 1D PDF EXPORT
  // ============================================================================
  function export1DToPDF(result, formData) {
      var { jsPDF } = window.jspdf;
      var pdf = new jsPDF('p', 'mm', 'a4');
      var y = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(FONT_COLOR_DARK);
      pdf.text('CUTTING OPTIMIZATION REPORT', 105, y, { align: 'center' });
      y += 7;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_MEDIUM);
      pdf.text('1D Linear Material Optimization', 105, y, { align: 'center' });
      y += 12;

      // Analysis Section
      y = drawSectionTitle(pdf, '1D CUTTING ANALYSIS', y);
      
      y += 5;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Project Summary', PAGE_MARGIN, y);
      y += 8;

      var summaryData = [
          { label: 'Date:', value: new Date().toLocaleDateString('en-US'), label2: 'Material Length:', value2: formData.materialLength + ' mm' },
          { label: 'Algorithm:', value: formData.algorithm, label2: 'Kerf Width:', value2: formData.kerfWidth + ' mm' },
      ];

      pdf.setFontSize(10);
      summaryData.forEach(function(row) {
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label, PAGE_MARGIN, y);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value, PAGE_MARGIN + 35, y);
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label2, 115, y);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value2, 115 + 35, y);
          y += 7;
      });
      y += 8;

      // Results
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Optimization Results', PAGE_MARGIN, y);
      y += 8;

      var resultsData = [
          { label: 'Total Bars', value: result.totalBars.toString(), label2: 'Total Items', value2: result.totalItems.toString() },
          { label: 'Material Efficiency', value: result.overallEfficiency + '%', label2: 'Total Waste', value2: result.totalWaste.toLocaleString() + ' mm' },
          { label: 'Material Used', value: (result.totalMaterialLength || 0).toLocaleString() + ' mm', label2: 'Execution Time', value2: result.executionTime + ' ms' },
      ];

      resultsData.forEach(function(row) {
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label, PAGE_MARGIN, y);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value, PAGE_MARGIN + 45, y);
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label2, 115, y);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value2, 115 + 45, y);
          y += 7;
      });
      y += 8;

      // Cut List
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Input Cut List', PAGE_MARGIN, y);
      y += 8;

      var cutListHeaders = ['ID', 'Length', 'Qty', 'Total'];
      var cutListData = formData.items.filter(function(i) { return i.quantity > 0; }).map(function(item) {
          return [
              item.id,
              item.length + ' mm',
              item.quantity,
              (item.length * item.quantity).toLocaleString()
          ];
      });

      y = drawTable(pdf, y, cutListHeaders, cutListData, [30, 50, 30, 70]);

      // Bar Results
      pdf.addPage();
      y = 25;
      y = drawSectionTitle(pdf, 'BAR CUTTING RESULTS', y);

      var barHeaders = ['Bar', 'Used Length', 'Waste', 'Efficiency', 'Cut Details'];
      
      var barData = result.bars.map(function(bar) {
          var detailsMap = new Map();
          bar.items.forEach(function(item) {
              var count = detailsMap.get(item.originalLength) || 0;
              detailsMap.set(item.originalLength, count + 1);
          });
          var details = Array.from(detailsMap.entries())
              .map(function(entry) { return entry[0] + 'mm (' + entry[1] + ')'; })
              .join(', ');
          
          return [
              bar.id,
              bar.usedLength + ' mm',
              bar.remainingLength + ' mm',
              bar.efficiency + '%',
              details,
          ];
      });

      drawTable(pdf, y, barHeaders, barData, [30, 35, 30, 25, 60]);

      // Donation Page
      addDonationSection(pdf);

      // Footer
      addPageBreaks(pdf);
      pdf.save('1D_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  // ============================================================================
  // 2D PDF EXPORT
  // ============================================================================
  function export2DToPDF(result, formData, itemColors) {
      var { jsPDF } = window.jspdf;
      var pdf = new jsPDF('p', 'mm', 'a4');
      var y = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(FONT_COLOR_DARK);
      pdf.text('PLATE CUTTING REPORT', 105, y, { align: 'center' });
      y += 7;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_MEDIUM);
      pdf.text('2D Sheet Material Optimization', 105, y, { align: 'center' });
      y += 12;
      
      // Analysis Section
      y = drawSectionTitle(pdf, '2D PLATE ANALYSIS', y);

      // Project Details
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Project Details', PAGE_MARGIN, y);
      y += 8;

      var detailsData = [
          { label: 'Date:', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
          { label: 'Algorithm:', value: formData.algorithm },
          { label: 'Kerf Width:', value: formData.kerfWidth + ' mm' },
      ];
      var detailsData2 = [
          { label: 'Plate Size:', value: formData.plateWidth + ' × ' + formData.plateHeight + ' mm' },
          { label: 'Plate Area:', value: (formData.plateWidth * formData.plateHeight).toLocaleString() + ' mm²' },
      ];

      pdf.setFontSize(10);
      detailsData.forEach(function(row) {
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label, PAGE_MARGIN, y);
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value, PAGE_MARGIN + 35, y);
          y += 7;
      });
      var y2 = y - (detailsData.length * 7);
      detailsData2.forEach(function(row) {
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label, 120, y2);
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value, 120 + 25, y2);
          y2 += 7;
      });
      y += 8;

      // Optimization Results
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Optimization Results', PAGE_MARGIN, y);
      y += 8;

      var resultsData = [
          { label: 'Total Plates', value: result.totalPlates.toString() },
          { label: 'Total Items', value: result.totalItems.toString() },
          { label: 'Material Efficiency', value: result.overallEfficiency + '%' },
          { label: 'Waste Area', value: (result.totalPlates * formData.plateWidth * formData.plateHeight - result.totalUsedArea).toLocaleString() + ' mm²' },
          { label: 'Used Area', value: result.totalUsedArea.toLocaleString() + ' mm²' },
          { label: 'Execution Time', value: result.executionTime + ' ms' },
      ];

      pdf.setFontSize(10);
      resultsData.forEach(function(stat, index) {
          var currentY = y + Math.floor(index / 2) * 10;
          var currentX = (index % 2 === 0) ? PAGE_MARGIN : 120;
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(stat.label, currentX, currentY);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(stat.value, currentX + 40, currentY);
      });
      y += Math.ceil(resultsData.length / 2) * 10 + 8;

      // Input Cut List
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Input Cut List', PAGE_MARGIN, y);
      y += 8;

      var cutListHeaders = ['ID', 'Width', 'Height', 'Qty', 'Area'];
      var cutListData = formData.items.filter(function(i) { return i.quantity > 0; }).map(function(i) {
          return [
              i.id,
              i.width,
              i.height,
              i.quantity,
              (i.width * i.height * i.quantity).toLocaleString()
          ];
      });

      y = drawTable(pdf, y, cutListHeaders, cutListData, [20, 30, 30, 30, 70]);

      // Visualization Pages
      if (result.plates.length > 0) {
          pdf.addPage();
          var vizY = 25;
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('PLATE VISUALIZATION', 105, vizY, { align: 'center' });
          vizY += 15;

          result.plates.forEach(function(plate, index) {
              if (index > 0 && index % 2 === 0) {
                  pdf.addPage();
                  vizY = 25;
                  pdf.setFontSize(16);
                  pdf.setFont('helvetica', 'bold');
                  pdf.text('PLATE VISUALIZATION', 105, vizY, { align: 'center' });
                  vizY += 15;
              }
              
              var currentVizY = (index % 2 === 0) ? vizY : vizY + 125;
              
              // Plate title
              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(FONT_COLOR_DARK);
              pdf.text('Plate ' + plate.id, PAGE_MARGIN, currentVizY);
              
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(FONT_COLOR_MEDIUM);
              pdf.text(formData.plateWidth + ' × ' + formData.plateHeight + ' mm | Eff: ' + plate.getEfficiency() + '% | Items: ' + plate.items.length, PAGE_MARGIN, currentVizY + 5);

              // Visualization box
              var vizWidth = 180;
              var plateAspectRatio = formData.plateHeight / formData.plateWidth;
              var vizHeight = Math.min(vizWidth * plateAspectRatio, 95);
              var vizBoxY = currentVizY + 10;

              pdf.setDrawColor(BORDER_COLOR);
              pdf.rect(PAGE_MARGIN, vizBoxY, vizWidth, vizHeight, 'D');

              // Draw items
              plate.items.forEach(function(item) {
                  var itemX = PAGE_MARGIN + (item.x / formData.plateWidth) * vizWidth;
                  var itemY = vizBoxY + (item.y / formData.plateHeight) * vizHeight;
                  var itemW = (item.width / formData.plateWidth) * vizWidth;
                  var itemH = (item.height / formData.plateHeight) * vizHeight;
                  var color = itemColors.get(item.originalId) || '#3b82f6';
                  var rgb = color.match(/\w\w/g).map(function(val) { return parseInt(val, 16); });

                  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
                  pdf.rect(itemX, itemY, itemW, itemH, 'F');
                  pdf.setDrawColor(255, 255, 255);
                  pdf.setLineWidth(0.2);
                  pdf.rect(itemX, itemY, itemW, itemH, 'D');
                  
                  if (itemW > 10 && itemH > 8) {
                      pdf.setFontSize(7);
                      pdf.setTextColor(255, 255, 255);
                      var label = item.originalId;
                      if(item.rotated) label = 'R\n' + label;
                      pdf.text(label, itemX + itemW / 2, itemY + itemH / 2, { align: 'center', baseline: 'middle' });
                  }
              });

              // Legend
              var legendY = vizBoxY + vizHeight + 8;
              var legendX = PAGE_MARGIN;
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(FONT_COLOR_MEDIUM);
              pdf.text('Items:', legendX, legendY);
              legendX += 12;

              var legendItems = new Map();
              plate.items.forEach(function(item) {
                  var key = item.originalId + '_' + item.rotated;
                  var existing = legendItems.get(key);
                  if (existing) {
                      existing.count++;
                  } else {
                      legendItems.set(key, { item: item, count: 1 });
                  }
              });

              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'normal');
              
              Array.from(legendItems.values()).forEach(function(legend) {
                  var color = itemColors.get(legend.item.originalId) || '#3b82f6';
                  var rgb = color.match(/\w\w/g).map(function(val) { return parseInt(val, 16); });
                  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
                  pdf.rect(legendX, legendY - 3, 4, 4, 'F');
                  legendX += 6;

                  var rotationIndicator = legend.item.rotated ? ' (R)' : '';
                  var text = legend.item.originalId + ': ' + legend.item.originalWidth + 'x' + legend.item.originalHeight + rotationIndicator + ' (x' + legend.count + ')';
                  pdf.setTextColor(FONT_COLOR_DARK);
                  pdf.text(text, legendX, legendY);
                  legendX += pdf.getStringUnitWidth(text) * 3 + 5;

                  if (legendX > 180) {
                      legendX = PAGE_MARGIN + 12;
                      legendY += 6;
                  }
              });
          });
      }

      // Donation Page
      addDonationSection(pdf);

      // Footer
      addPageBreaks(pdf);
      pdf.save('2D_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  // ============================================================================
  // PROJECT PDF EXPORT - FIXED: Now inside IIFE with proper scope access
  // ============================================================================
  function exportProjectToPDF(results) {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      let y = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(FONT_COLOR_DARK);
      pdf.text('PROJECT CUTTING OPTIMIZATION REPORT', 105, y, { align: 'center' });
      y += 7;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_MEDIUM);
      pdf.text('Multiple Material Optimization Project', 105, y, { align: 'center' });
      y += 12;

      // Summary
      y = drawSectionTitle(pdf, 'PROJECT SUMMARY', y);
      
      const totalGroups = results.length;
      const totalItems = results.reduce((sum, res) => sum + res.result.totalItems, 0);
      const avgEfficiency = totalGroups > 0 ? Math.round(results.reduce((sum, res) => sum + res.result.overallEfficiency, 0) / totalGroups) : 0;

      const summaryData = [
          { label: 'Date:', value: new Date().toLocaleDateString('en-US'), label2: 'Total Groups:', value2: totalGroups.toString() },
          { label: 'Total Items:', value: totalItems.toString(), label2: 'Avg Efficiency:', value2: avgEfficiency + '%' },
      ];

      pdf.setFontSize(10);
      summaryData.forEach(row => {
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label, PAGE_MARGIN, y);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value, PAGE_MARGIN + 35, y);
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label2, 115, y);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value2, 115 + 35, y);
          y += 7;
      });
      y += 8;

      // Group Results
      results.forEach((res, index) => {
          if (y > 250) {
              pdf.addPage();
              y = 25;
          }
          
          const is1D = res.type === '1d';
          const group = res.group;
          
          y = drawSectionTitle(pdf, `${group.name} (${is1D ? '1D Linear' : '2D Sheet'})`, y);
          
          const groupData = [
              { label: 'Algorithm:', value: group.parameters.algorithm, label2: 'Efficiency:', value2: res.result.overallEfficiency + '%' },
              { label: is1D ? 'Total Bars:' : 'Total Plates:', value: is1D ? res.result.totalBars.toString() : res.result.totalPlates.toString(), label2: 'Items:', value2: res.result.totalItems.toString() },
          ];
          
          pdf.setFontSize(10);
          groupData.forEach(row => {
              pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
              pdf.text(row.label, PAGE_MARGIN, y);
              pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
              pdf.text(row.value, PAGE_MARGIN + 40, y);
              pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
              pdf.text(row.label2, 115, y);
              pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
              pdf.text(row.value2, 115 + 25, y);
              y += 7;
          });
          y += 5;

          // Cut List
          const cutHeaders = is1D ? ['ID', 'Length', 'Qty'] : ['ID', 'Width', 'Height', 'Qty'];
          const cutData = group.items.map(item => {
              if (is1D) {
                  return [item.itemId, item.length + ' mm', item.quantity];
              } else {
                  return [item.itemId, item.width + ' mm', item.height + ' mm', item.quantity];
              }
          });

          const colWidths = is1D ? [30, 50, 30] : [30, 40, 40, 30];
          y = drawTable(pdf, y, cutHeaders, cutData, colWidths);
          y += 8;
      });

      // Donation Page
      addDonationSection(pdf);

      // Footer
      addPageBreaks(pdf);
      pdf.save('Project_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  // Attach all exports to window
  window.export1DToPDF = export1DToPDF;
  window.export2DToPDF = export2DToPDF;
  window.exportProjectToPDF = exportProjectToPDF; // FIXED: Now properly scoped

  console.log('✅ PDF Export module loaded with Project support');
})(window);