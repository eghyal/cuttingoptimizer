/**
 * Excel Template Generator & Parser - Ultra Simplified Version
 * Removed: Parameter columns from template
 * Updated: Parse logic to use website defaults only
 * CHANGED: Removed Rotate column from 2D sheet - always default to true
 */

(function(window) {
  'use strict';

  var ExcelTemplate = {
    
    /**
     * Generate and download Excel template - Minimal version
     */
    generateTemplate: function() {
      var wb = XLSX.utils.book_new();
      
      // 1D Sheet - Hanya Item data
      var headers1D = ['Group Name', 'Item ID', 'Length (mm)', 'Quantity'];
      var ws1D = XLSX.utils.aoa_to_sheet([headers1D]);
      
      // Example data
      var example1D = [
        ['Group 1', 'A1', '300', '10'],
        ['Group 1', 'A2', '2100', '5'],
        ['Group 2', 'B1', '320', '10']
      ];
      XLSX.utils.sheet_add_aoa(ws1D, example1D, { origin: 1 });
      
      XLSX.utils.book_append_sheet(wb, ws1D, '1D');
      
      // 2D Sheet - Hanya Item data (TANPA ROTATE)
      var headers2D = ['Group Name', 'Item ID', 'Width (mm)', 'Height (mm)', 'Quantity'];
      var ws2D = XLSX.utils.aoa_to_sheet([headers2D]);
      
      // Example data - TANPA ROTATE
      var example2D = [
        ['Plate Group 1', 'P1', '320', '1200', '10'],
        ['Plate Group 1', 'P2', '1100', '320', '4']
      ];
      XLSX.utils.sheet_add_aoa(ws2D, example2D, { origin: 1 });
      
      XLSX.utils.book_append_sheet(wb, ws2D, '2D');
      
      // Example Sheet
      var exampleData = [
        ['CONTOH PENGISIAN - 1D'],
        [''],
        headers1D,
        ['UNP 200x80', 'A1', '300', '10'],
        ['UNP 200x80', 'A2', '2100', '10'],
        ['SIKU 50', 'B1', '320', '10'],
        [''],
        ['CONTOH PENGISIAN - 2D'],
        [''],
        headers2D,
        ['Steel Plate 3mm', 'P1', '320', '1200', '10'],
        ['Steel Plate 3mm', 'P2', '1100', '320', '4']
      ];
      var wsExample = XLSX.utils.aoa_to_sheet(exampleData);
      XLSX.utils.book_append_sheet(wb, wsExample, 'Contoh Pengisian');
      
      // Set column widths
      ws1D['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
      ws2D['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
      
      XLSX.writeFile(wb, 'EAV_Project_Template.xlsx');
    },

    /**
     * Parse Excel file data - Updated for new format
     */
    parseExcelData: function(data) {
      var groups = {};
      var errors = [];
      
      data.forEach(function(row, index) {
        var line = index + 2;
        
        if (!row['Group Name']) {
          errors.push('Line ' + line + ': Group Name is required');
          return;
        }
        
        if (!row['Item ID']) {
          errors.push('Line ' + line + ': Item ID is required');
          return;
        }
        
        var groupName = row['Group Name'];
        var type = null;
        
        // Determine type by checking which columns exist
        if (row['Length (mm)'] !== undefined) {
          type = '1d';
        } else if (row['Width (mm)'] !== undefined && row['Height (mm)'] !== undefined) {
          type = '2d';
        } else {
          errors.push('Line ' + line + ': Could not determine type (missing Length or Width/Height)');
          return;
        }
        
        if (!groups[groupName]) {
          groups[groupName] = {
            groupId: groupName,
            name: groupName,
            type: type,
            // Use defaults from website, not from Excel
            parameters: type === '1d' ? {
              materialLength: 6000,
              kerfWidth: 3,
              algorithm: 'first-fit'
            } : {
              plateWidth: 2440,
              plateHeight: 1220,
              kerfWidth: 3,
              algorithm: 'GUILLOTINE'
            },
            items: []
          };
        }
        
        if (groups[groupName].type !== type) {
          errors.push('Line ' + line + ': All items in group ' + groupName + ' must have the same type');
          return;
        }
        
        // ADDED: Set rotation to true by default for 2D items
        groups[groupName].items.push({
          itemId: row['Item ID'],
          length: row['Length (mm)'] || '',
          width: row['Width (mm)'] || '',
          height: row['Height (mm)'] || '',
          quantity: parseInt(row['Quantity']) || 0,
          rotation: type === '2d' ? true : true // Always true for both types
        });
      });
      
      return {
        groups: Object.values(groups),
        errors: errors
      };
    },

    /**
     * Convert data to Excel format (for export)
     */
    convertToExcel: function(materialGroups) {
      var excelData = [];
      
      materialGroups.forEach(function(group) {
        group.items.forEach(function(item) {
          excelData.push({
            'Group Name': group.name,
            'Item ID': item.itemId,
            'Length (mm)': group.type === '1d' ? item.length : '',
            'Width (mm)': group.type === '2d' ? item.width : '',
            'Height (mm)': group.type === '2d' ? item.height : '',
            'Quantity': item.quantity
            // REMOVED: No rotation column in export
          });
        });
      });
      
      return excelData;
    },

    /**
     * Validate Excel data structure
     */
    validateExcelStructure: function(data) {
      if (!Array.isArray(data) || data.length === 0) {
        return { valid: false, error: 'Excel file is empty or invalid format' };
      }
      
      var firstRow = data[0];
      var requiredColumns = ['Group Name', 'Item ID', 'Quantity'];
      
      for (var i = 0; i < requiredColumns.length; i++) {
        if (firstRow[requiredColumns[i]] === undefined) {
          return { 
            valid: false, 
            error: 'Missing required column: ' + requiredColumns[i] 
          };
        }
      }
      
      return { valid: true };
    }
  };

  // Export to global scope
  window.ExcelTemplate = ExcelTemplate;
  
  console.log('✅ Excel Template module loaded - Simplified format (No Rotate column)');

})(window);