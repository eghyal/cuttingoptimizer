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
  // QR CODE CONFIGURATION
  // ============================================================================
  
  var QR_CODE_IMAGE_SRC = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021126610014COM.GO-JEK.WWW01189360091431965170060210G1965170060303UMI51440014ID.CO.QRIS.WWW0215ID10264739087250303UMI5204899953033605802ID5925First%20has%20to%20be%20Sketched%2C6014LAMPUNG%20TENGAH61053416462070703A016304DBAB";

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
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text('(continued)', PAGE_MARGIN, 20);
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
          
          // If new page, redraw header
          if (y === 25 && rowIndex > 0) {
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

      // QR CODE
      var qrSize = 50;
      var qrX = (210 - qrSize) / 2;
      pdf.setDrawColor(BORDER_COLOR);
      pdf.rect(qrX - 5, y - 5, qrSize + 10, qrSize + 10, 'D');

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
  // 1D PDF EXPORT - REVISED TABLE FORMAT
  // ============================================================================
  function export1DToPDF(result, formData) {
      // Check if jsPDF is available
      if (!window.jspdf || !window.jspdf.jsPDF) {
          alert('PDF Export Error: jsPDF library not loaded. Please check your internet connection.');
          return;
      }
      
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

      // Bar Results - REVISED FORMAT
      pdf.addPage();
      y = 25;
      y = drawSectionTitle(pdf, 'BAR CUTTING RESULTS', y);

      // New format: Bar, Cuts, Used Length, Waste, Efficiency, Cut Details
      var barHeaders = ['Bar', 'Cuts', 'Used Length', 'Waste', 'Efficiency', 'Cut Details'];
      
      var barData = result.bars.map(function(bar) {
          // Count cuts by length only (no ID)
          var detailsMap = new Map();
          bar.items.forEach(function(item) {
              var length = item.originalLength;
              var count = detailsMap.get(length) || 0;
              detailsMap.set(length, count + 1);
          });
          
          // Format: lengthmm (count), e.g., "430mm (2), 531mm (6)"
          var details = Array.from(detailsMap.entries())
              .map(function(entry) { 
                  return entry[0] + 'mm (' + entry[1] + ')'; 
              })
              .join(', ');
          
          return [
              bar.id,
              bar.items.length.toString(), // Cuts count
              bar.usedLength + ' mm',
              bar.remainingLength + ' mm',
              bar.efficiency + '%',
              details,
          ];
      });

      // Adjusted column widths for new format
      drawTable(pdf, y, barHeaders, barData, [25, 15, 35, 30, 25, 60]);

      // Donation Page
      addDonationSection(pdf);

      // Footer
      addPageBreaks(pdf);
      pdf.save('1D_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  // ============================================================================
  // 2D PDF EXPORT - Enhanced with Detailed Item Information
  // ============================================================================
  function export2DToPDF(result, formData, itemColors) {
      // Check if jsPDF is available
      if (!window.jspdf || !window.jspdf.jsPDF) {
          alert('PDF Export Error: jsPDF library not loaded. Please check your internet connection.');
          return;
      }
      
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
          { label: 'Date:', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), label2: 'Plate Size:', value2: formData.plateWidth + ' × ' + formData.plateHeight + ' mm' },
          { label: 'Algorithm:', value: formData.algorithm, label2: 'Plate Area:', value2: (formData.plateWidth * formData.plateHeight).toLocaleString() + ' mm²' },
          { label: 'Kerf Width:', value: formData.kerfWidth + ' mm' }
      ];

      pdf.setFontSize(10);
      detailsData.forEach(function(row, idx) {
          var currentY = y + Math.floor(idx / 2) * 7;
          var currentX = (idx % 2 === 0) ? PAGE_MARGIN : 115;
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
          pdf.text(row.label, currentX, currentY);
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text(row.value, (idx % 2 === 0) ? currentX + 35 : currentX + 40, currentY);
      });
      y += Math.ceil(detailsData.length / 2) * 7 + 8;

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
          var currentX = (index % 2 === 0) ? PAGE_MARGIN : 115;
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

      // NEW: Detailed Items List (Plate by Plate)
      pdf.addPage();
      y = 25;
      y = drawSectionTitle(pdf, 'DETAILED CUT LIST BY PLATE', y);
      
      var detailHeaders = ['Plate', 'Item ID', 'Dimensions', 'Position (X,Y)', 'Rotated'];
      
      var detailData = [];
      result.plates.forEach(function(plate) {
          plate.items.forEach(function(item) {
              detailData.push([
                  plate.id,
                  item.originalId,
                  item.originalWidth + '×' + item.originalHeight + ' mm',
                  item.x + ', ' + item.y,
                  item.rotated ? 'Yes' : 'No'
              ]);
          });
      });
      
      y = drawTable(pdf, y, detailHeaders, detailData, [25, 30, 40, 35, 25]);

      // Visualization Pages - Fixed
      if (result.plates && result.plates.length > 0) {
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

              // Draw items with consistent colors
              if (plate.items && plate.items.length > 0) {
                  plate.items.forEach(function(item) {
                      var itemX = PAGE_MARGIN + (item.x / formData.plateWidth) * vizWidth;
                      var itemY = vizBoxY + (item.y / formData.plateHeight) * vizHeight;
                      var itemW = (item.width / formData.plateWidth) * vizWidth;
                      var itemH = (item.height / formData.plateHeight) * vizHeight;
                      
                      // Get color from Map or use default
                      var color = '#3b82f6';
                      if (itemColors && itemColors instanceof Map && itemColors.has(item.originalId)) {
                          color = itemColors.get(item.originalId);
                      } else if (itemColors && typeof itemColors === 'object' && itemColors[item.originalId]) {
                          color = itemColors[item.originalId];
                      }
                      
                      var rgb = hexToRgb(color) || {r: 59, g: 130, b: 246};

                      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
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
              }
          });
      }

      // Donation Page
      addDonationSection(pdf);

      // Footer
      addPageBreaks(pdf);
      pdf.save('2D_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  // Helper function to convert hex to RGB
  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  }

  // ============================================================================
  // PROJECT PDF EXPORT - Revised 1D Table Format to match standalone 1D export
  // ============================================================================
  function exportProjectToPDF(results) {
      // Check if jsPDF is available
      if (!window.jspdf || !window.jspdf.jsPDF) {
          alert('PDF Export Error: jsPDF library not loaded. Please check your internet connection.');
          return;
      }
      
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

      // ============================================================================
      // INPUT DATA SECTION - All groups first
      // ============================================================================
      y = drawSectionTitle(pdf, 'INPUT DATA - ALL GROUPS', y);

      // Group summary table
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(FONT_COLOR_MEDIUM);
      pdf.text('Total Groups: ' + results.length, PAGE_MARGIN, y);
      y += 8;

      results.forEach(function(res, idx) {
          const is1D = res.type === '1d';
          const group = res.group;
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text((idx + 1) + '. ' + group.name + ' (' + (is1D ? '1D' : '2D') + ')', PAGE_MARGIN, y);
          y += 6;
          
          // Parameters
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(FONT_COLOR_MEDIUM);
          var params = '';
          if (is1D) {
              params = 'Material: ' + group.parameters.materialLength + 'mm | Kerf: ' + group.parameters.kerfWidth + 'mm | Algo: ' + group.parameters.algorithm;
          } else {
              params = 'Plate: ' + group.parameters.plateWidth + 'x' + group.parameters.plateHeight + 'mm | Kerf: ' + group.parameters.kerfWidth + 'mm | Algo: ' + group.parameters.algorithm;
          }
          pdf.text(params, PAGE_MARGIN + 10, y);
          y += 8;
          
          // Items table
          var itemHeaders = is1D ? ['ID', 'Length', 'Qty'] : ['ID', 'Width', 'Height', 'Qty'];
          var itemData = group.items.map(function(item) {
              if (is1D) {
                  return [item.itemId, item.length + 'mm', item.quantity];
              } else {
                  return [item.itemId, item.width + 'mm', item.height + 'mm', item.quantity];
              }
          });
          var colWidths = is1D ? [30, 40, 30] : [30, 35, 35, 30];
          
          y = drawTable(pdf, y, itemHeaders, itemData, colWidths);
          y += 5;
      });
      
      // ============================================================================
      // OUTPUT DATA SECTION - Per group with page breaks
      // ============================================================================
      pdf.addPage();
      y = 25;
      y = drawSectionTitle(pdf, 'OUTPUT RESULTS - GROUP DETAILS', y);

      results.forEach(function(res, groupIndex) {
          const is1D = res.type === '1d';
          const group = res.group;
          
          // Page break before each group (except the first one)
          if (groupIndex > 0) {
              pdf.addPage();
              y = 25;
              y = drawSectionTitle(pdf, 'OUTPUT RESULTS - GROUP DETAILS', y);
          }
          
          // Group header
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(FONT_COLOR_DARK);
          pdf.text('Group ' + (groupIndex + 1) + ': ' + group.name, PAGE_MARGIN, y);
          y += 6;
          
          // Summary stats
          pdf.setFontSize(10);
          var summaryStats = [
              ['Algorithm', group.parameters.algorithm],
              ['Efficiency', res.result.overallEfficiency + '%'],
              [is1D ? 'Total Bars' : 'Total Plates', is1D ? res.result.totalBars.toString() : res.result.totalPlates.toString()],
              ['Total Items', res.result.totalItems.toString()]
          ];
          
          summaryStats.forEach(function(stat, idx) {
              var currentY = y + Math.floor(idx / 2) * 7;
              var currentX = (idx % 2 === 0) ? PAGE_MARGIN : 115;
              pdf.setFont('helvetica', 'normal'); pdf.setTextColor(FONT_COLOR_MEDIUM);
              pdf.text(stat[0] + ':', currentX, currentY);
              pdf.setFont('helvetica', 'bold'); pdf.setTextColor(FONT_COLOR_DARK);
              pdf.text(stat[1], (idx % 2 === 0) ? currentX + 35 : currentX + 40, currentY);
          });
          y += Math.ceil(summaryStats.length / 2) * 7 + 8;
          
          // VISUALIZATION SECTION
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(is1D ? 'Bar Layouts' : 'Plate Layouts', PAGE_MARGIN, y);
          y += 8;
          
          // Generate colors for this group
          const groupItemIds = [...new Set(
              is1D ? 
              res.result.bars.flatMap(bar => bar.items.map(i => i.originalId)) :
              res.result.plates.flatMap(plate => plate.items.map(i => i.originalId))
          )];
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#ef4444', '#0ea5e9'];
          const itemColors = new Map();
          groupItemIds.forEach((id, i) => {
              itemColors.set(id, colors[i % colors.length]);
          });
          
          if (is1D) {
              // 1D Bar visualization - REVISED FORMAT (same as standalone 1D export)
              // Format: Bar, Cuts, Used Length, Waste, Efficiency, Cut Details
              var barHeaders = ['Bar', 'Cuts', 'Used Length', 'Waste', 'Efficiency', 'Cut Details'];
              var barData = res.result.bars.map(function(bar) {
                  // Count cuts by length only (no ID)
                  var detailsMap = new Map();
                  bar.items.forEach(function(item) {
                      var length = item.originalLength;
                      var count = detailsMap.get(length) || 0;
                      detailsMap.set(length, count + 1);
                  });
                  
                  // Format: lengthmm (count), e.g., "430mm (2), 531mm (6)"
                  var details = Array.from(detailsMap.entries())
                      .map(function(entry) { 
                          return entry[0] + 'mm (' + entry[1] + ')'; 
                      })
                      .join(', ');
                  
                  return [
                      bar.id,
                      bar.items.length.toString(), // Cuts count
                      bar.usedLength + ' mm',
                      bar.remainingLength + ' mm',
                      bar.efficiency + '%',
                      details,
                  ];
              });

              // Use same column widths as standalone 1D export
              y = drawTable(pdf, y, barHeaders, barData, [25, 15, 35, 30, 25, 60]);
          } else {
              // NEW: 2D Detailed item table before visualization
              var detailHeaders = ['Plate', 'Item ID', 'Dimensions', 'Position', 'Rotated'];
              var detailData = [];
              
              res.result.plates.forEach(function(plate) {
                  plate.items.forEach(function(item) {
                      detailData.push([
                          plate.id,
                          item.originalId,
                          item.originalWidth + '×' + item.originalHeight + ' mm',
                          item.x + ', ' + item.y,
                          item.rotated ? 'Yes' : 'No'
                      ]);
                  });
              });
              
              if (detailData.length > 0) {
                  y = drawTable(pdf, y, detailHeaders, detailData, [25, 30, 40, 35, 25]);
                  y += 5;
              }
              
              // 2D Plate visualization - multiple plates per page
              if (res.result.plates && res.result.plates.length > 0) {
                  pdf.addPage();
                  y = 25;
                  pdf.setFontSize(12);
                  pdf.setFont('helvetica', 'bold');
                  pdf.text('Plate Visualizations', PAGE_MARGIN, y);
                  y += 10;
                  
                  res.result.plates.forEach(function(plate, plateIndex) {
                      // Page break every 2 plates
                      if (plateIndex > 0 && plateIndex % 2 === 0) {
                          pdf.addPage();
                          y = 25;
                          pdf.setFontSize(12);
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('Plate Visualizations (continued)', PAGE_MARGIN, y);
                          y += 10;
                      }
                      
                      var currentY = (plateIndex % 2 === 0) ? y : y + 125;
                      
                      // Plate title
                      pdf.setFontSize(10);
                      pdf.setFont('helvetica', 'bold');
                      pdf.setTextColor(FONT_COLOR_DARK);
                      pdf.text('Plate ' + plate.id, PAGE_MARGIN, currentY);
                      
                      pdf.setFontSize(9);
                      pdf.setFont('helvetica', 'normal');
                      pdf.setTextColor(FONT_COLOR_MEDIUM);
                      pdf.text('Eff: ' + plate.getEfficiency() + '% | Items: ' + plate.items.length + ' | Waste: ' + plate.getWasteArea().toLocaleString() + ' mm²', PAGE_MARGIN, currentY + 5);

                      // Visualization box
                      var vizWidth = 180;
                      var plateAspectRatio = group.parameters.plateHeight / group.parameters.plateWidth;
                      var vizHeight = Math.min(vizWidth * plateAspectRatio, 95);
                      var vizBoxY = currentY + 10;

                      pdf.setDrawColor(BORDER_COLOR);
                      pdf.rect(PAGE_MARGIN, vizBoxY, vizWidth, vizHeight, 'D');

                      // Draw items with consistent colors
                      if (plate.items && plate.items.length > 0) {
                          plate.items.forEach(function(item) {
                              var itemX = PAGE_MARGIN + (item.x / group.parameters.plateWidth) * vizWidth;
                              var itemY = vizBoxY + (item.y / group.parameters.plateHeight) * vizHeight;
                              var itemW = (item.width / group.parameters.plateWidth) * vizWidth;
                              var itemH = (item.height / group.parameters.plateHeight) * vizHeight;
                              
                              var color = itemColors.get(item.originalId) || '#3b82f6';
                              var rgb = hexToRgb(color) || {r: 59, g: 130, b: 246};

                              pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                              pdf.rect(itemX, itemY, itemW, itemH, 'F');
                              pdf.setDrawColor(255, 255, 255);
                              pdf.setLineWidth(0.2);
                              pdf.rect(itemX, itemY, itemW, itemH, 'D');
                              
                              if (itemW > 10 && itemH > 8) {
                                  pdf.setFontSize(7);
                                  pdf.setTextColor(255, 255, 255);
                                  var label = item.rotated ? 'R\n' + item.originalId : item.originalId;
                                  pdf.text(label, itemX + itemW / 2, itemY + itemH / 2, { align: 'center', baseline: 'middle' });
                              }
                          });
                      }
                  });
              }
          }
          
          // Move y to bottom for next iteration
          y = 250;
      });

      // Donation Page
      addDonationSection(pdf);

      // Footer
      addPageBreaks(pdf);
      pdf.save('Project_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
  }

  // Attach exports to window
  window.export1DToPDF = export1DToPDF;
  window.export2DToPDF = export2DToPDF;
  window.exportProjectToPDF = exportProjectToPDF;

  console.log('✅ PDF Export module loaded - Fixed table format for 1D results');
})(window);
