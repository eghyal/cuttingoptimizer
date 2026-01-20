/**
 * Excel Template Generator & Parser for Project Manager
 * Added: Proper dropdown validation for algorithms
 */

(function(window) {
  'use strict';

  var ExcelTemplate = {
    
    /**
     * Generate and download Excel template - 3 sheets with dropdown validation
     */
    generateTemplate: function() {
      var wb = XLSX.utils.book_new();
      
      // 1D Sheet - with algorithm dropdown
      var headers1D = ['Group Name', 'Material Length (mm)', 'Kerf (mm)', 'Algorithm', 'Item ID', 'Length (mm)', 'Quantity'];
      var ws1D = XLSX.utils.aoa_to_sheet([headers1D]);
      
      // Add data validation for algorithm in 1D sheet (cells D2:D1000)
      if (!ws1D['!dataValidation']) ws1D['!dataValidation'] = [];
      ws1D['!dataValidation'].push({
        type: 'list',
        allowBlank: false,
        sqref: 'D2:D1000',
        formulas: ['"first-fit,best-fit,worst-fit"']
      });
      
      // Add example data
      var example1D = [
        ['Group 1', '6000', '5', 'first-fit', 'A1', '300', '10'],
        ['Group 1', '6000', '5', 'first-fit', 'A2', '2100', '5'],
        ['Group 2', '6000', '3', 'best-fit', 'B1', '320', '10']
      ];
      XLSX.utils.sheet_add_aoa(ws1D, example1D, { origin: 1 });
      
      XLSX.utils.book_append_sheet(wb, ws1D, '1D');
      
      // 2D Sheet - with algorithm and rotate dropdown
      var headers2D = ['Group Name', 'Plate Width (mm)', 'Plate Height (mm)', 'Kerf (mm)', 'Algorithm', 'Item ID', 'Width (mm)', 'Height (mm)', 'Quantity', 'Rotate'];
      var ws2D = XLSX.utils.aoa_to_sheet([headers2D]);
      
      // Add data validation for algorithm in 2D sheet (cells E2:E1000)
      if (!ws2D['!dataValidation']) ws2D['!dataValidation'] = [];
      ws2D['!dataValidation'].push({
        type: 'list',
        allowBlank: false,
        sqref: 'E2:E1000',
        formulas: ['"GUILLOTINE,MAXRECTS,SIMPLE"']
      });
      
      // Add data validation for Rotate in 2D sheet (cells J2:J1000)
      ws2D['!dataValidation'].push({
        type: 'list',
        allowBlank: false,
        sqref: 'J2:J1000',
        formulas: ['"Yes,No"']
      });
      
      // Add example data
      var example2D = [
        ['Plate Group 1', '2440', '1220', '2', 'GUILLOTINE', 'P1', '320', '1200', '10', 'Yes'],
        ['Plate Group 1', '2440', '1220', '2', 'GUILLOTINE', 'P2', '1100', '320', '4', 'Yes']
      ];
      XLSX.utils.sheet_add_aoa(ws2D, example2D, { origin: 1 });
      
      XLSX.utils.book_append_sheet(wb, ws2D, '2D');
      
      // Example Sheet
      var exampleData = [
        ['CONTOH PENGISIAN - 1D'],
        [''],
        headers1D,
        ['UNP 200x80', '6000', '5', 'first-fit', 'A1', '300', '10'],
        ['UNP 200x80', '6000', '5', 'first-fit', 'A2', '2100', '10'],
        ['SIKU 50', '6000', '3', 'best-fit', 'B1', '320', '10'],
        [''],
        ['CONTOH PENGISIAN - 2D'],
        [''],
        headers2D,
        ['Steel Plate 3mm', '2440', '1220', '2', 'GUILLOTINE', 'C1', '320', '1200', '10', 'Yes'],
        ['Steel Plate 3mm', '2440', '1220', '2', 'GUILLOTINE', 'C2', '1100', '320', '4', 'Yes']
      ];
      var wsExample = XLSX.utils.aoa_to_sheet(exampleData);
      XLSX.utils.book_append_sheet(wb, wsExample, 'Contoh Pengisian');
      
      // Set column widths for better visibility
      ws1D['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];
      ws2D['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
      
      XLSX.writeFile(wb, 'EAV_Project_Template.xlsx');
    },

    /**
     * Parse Excel file data - Only read 1D and 2D sheets
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
        var algorithm = (row['Algorithm'] || '').toString().toLowerCase();
        var type = null;
        
        // Determine type from algorithm
        var valid1DAlgos = ['first-fit', 'best-fit', 'worst-fit'];
        var valid2DAlgos = ['guillotine', 'maxrects', 'simple'];
        
        if (valid1DAlgos.includes(algorithm)) {
          type = '1d';
        } else if (valid2DAlgos.includes(algorithm)) {
          type = '2d';
        } else {
          errors.push('Line ' + line + ': Invalid algorithm ' + algorithm);
          return;
        }
        
        if (!groups[groupName]) {
          groups[groupName] = {
            groupId: groupName,
            name: groupName,
            type: type,
            parameters: type === '1d' ? {
              materialLength: parseInt(row['Material Length (mm)']) || 6000,
              plateWidth: '',
              plateHeight: '',
              kerfWidth: parseInt(row['Kerf Width (mm)']) || parseInt(row['Kerf (mm)']) || 0,
              algorithm: algorithm
            } : {
              materialLength: '',
              plateWidth: parseInt(row['Plate Width (mm)']) || 2440,
              plateHeight: parseInt(row['Plate Height (mm)']) || 1220,
              kerfWidth: parseInt(row['Kerf Width (mm)']) || parseInt(row['Kerf (mm)']) || 0,
              algorithm: algorithm
            },
            items: []
          };
        }
        
        if (groups[groupName].type !== type) {
          errors.push('Line ' + line + ': All items in group ' + groupName + ' must have the same type');
          return;
        }
        
        groups[groupName].items.push({
          itemId: row['Item ID'],
          length: row['Length (mm)'] || '',
          width: row['Width (mm)'] || '',
          height: row['Height (mm)'] || '',
          quantity: parseInt(row['Quantity']) || 0,
          rotation: (row['Rotation'] || row['Rotate'] || 'Yes').toString().toLowerCase() === 'yes'
        });
      });
      
      return {
        groups: Object.values(groups),
        errors: errors
      };
    },

    /**
     * Convert data to Excel format
     */
    convertToExcel: function(materialGroups) {
      var excelData = [];
      
      materialGroups.forEach(function(group) {
        group.items.forEach(function(item) {
          excelData.push({
            'Group Name': group.name,
            'Type': group.type.toUpperCase(),
            'Material Length (mm)': group.type === '1d' ? group.parameters.materialLength : '',
            'Plate Width (mm)': group.type === '2d' ? group.parameters.plateWidth : '',
            'Plate Height (mm)': group.type === '2d' ? group.parameters.plateHeight : '',
            'Kerf Width (mm)': group.parameters.kerfWidth,
            'Algorithm': group.parameters.algorithm,
            'Item ID': item.itemId,
            'Length (mm)': group.type === '1d' ? item.length : '',
            'Width (mm)': group.type === '2d' ? item.width : '',
            'Height (mm)': group.type === '2d' ? item.height : '',
            'Quantity': item.quantity,
            'Rotation': item.rotation ? 'Yes' : 'No'
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
  
  console.log('✅ Excel Template module loaded - With dropdown validation support');

})(window);