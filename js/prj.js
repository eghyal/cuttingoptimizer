/**
 * Project Manager - Complete Fixed Version
 * Removed: All fade animations for add/delete/remove operations
 * Fixed: Project PDF export functionality
 * Improved: Results layout with better structure
 * Fixed: Default values for kerf, group name, and parameters
 */

(function(window, document) {
  'use strict';

  // Initialize Project
  async function initProject() {
    console.log('📁 Project Manager: Initializing...');
    
    let groups = JSON.parse(localStorage.getItem('projectGroups')) || [];
    
    if (groups.length === 0) {
      groups = [createGroup('Group 1', '1d')];
      saveGroups(groups);
    }
    
    renderGroups(groups);
    setupEventListeners(groups);
  }

  function createGroup(name, type) {
    return {
      id: Date.now().toString(),
      name: name,
      type: type,
      parameters: type === '1d' ? {
        materialLength: 6000,
        kerfWidth: 3, // FIXED: Changed from 5 to 3
        algorithm: 'first-fit'
      } : {
        plateWidth: 2440,
        plateHeight: 1220,
        kerfWidth: 3, // FIXED: Changed from 0 to 3
        algorithm: 'GUILLOTINE'
      },
      items: [createDefaultItem(type)]
    };
  }

  function createDefaultItem(type) {
    return {
      id: Date.now() + '-1',
      itemId: 'A1', // FIXED: Ensure first item ID is A1
      length: '',
      width: '',
      height: '',
      quantity: '',
      rotation: true
    };
  }

  function saveGroups(groups) {
    localStorage.setItem('projectGroups', JSON.stringify(groups));
  }

  function renderGroups(groups) {
    const container = document.getElementById('groups-container');
    if (!container) return;
    
    if (groups.length === 0) {
      container.innerHTML = `
        <div class="empty-groups">
          <svg xmlns="http://www.w3.org/2000/svg" class="empty-groups-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 class="empty-groups-title">No Material Groups</h3>
          <p class="empty-groups-text">Add your first material group to start optimizing</p>
        </div>
      `;
      return;
    }
    
    // Render without fade animation
    container.innerHTML = groups.map(group => renderGroup(group)).join('');
  }

  function renderGroup(group) {
    const is1D = group.type === '1d';
    
    return `
      <div class="group-card" data-group-id="${group.id}">
        <div class="group-header">
          <div class="group-title-container">
            <span class="group-type-badge ${is1D ? 'one-d' : 'two-d'}">
              ${is1D ? '1D' : '2D'}
            </span>
            <input type="text" 
                   class="group-name-input" 
                   value="${group.name}" 
                   data-field="name"
                   placeholder="Group Name">
          </div>
          <div class="group-actions">
            <button class="btn btn-secondary btn-sm" data-action="change-type" title="Change Type">
              ${is1D ? 'Switch to 2D' : 'Switch to 1D'}
            </button>
            <button class="btn btn-danger btn-sm" data-action="remove-group" title="Remove Group">
              Remove
            </button>
          </div>
        </div>
        
        <div class="group-content">
          <div class="group-parameters">
            ${is1D ? `
              <div class="parameter-group">
                <label class="parameter-label">Material Length (mm)</label>
                <input type="number" 
                       class="parameter-input" 
                       value="${group.parameters.materialLength}" 
                       data-field="materialLength"
                       min="1">
              </div>
              <div class="parameter-group">
                <label class="parameter-label">Kerf Width (mm)</label>
                <input type="number" 
                       class="parameter-input" 
                       value="${group.parameters.kerfWidth}" 
                       data-field="kerfWidth"
                       min="0">
              </div>
              <div class="parameter-group">
                <label class="parameter-label">Algorithm</label>
                <select class="parameter-input" data-field="algorithm">
                  <option value="first-fit" ${group.parameters.algorithm === 'first-fit' ? 'selected' : ''}>First-Fit</option>
                  <option value="best-fit" ${group.parameters.algorithm === 'best-fit' ? 'selected' : ''}>Best-Fit</option>
                  <option value="worst-fit" ${group.parameters.algorithm === 'worst-fit' ? 'selected' : ''}>Worst-Fit</option>
                </select>
              </div>
            ` : `
              <div class="parameter-group">
                <label class="parameter-label">Plate Width (mm)</label>
                <input type="number" 
                       class="parameter-input" 
                       value="${group.parameters.plateWidth}" 
                       data-field="plateWidth"
                       min="1">
              </div>
              <div class="parameter-group">
                <label class="parameter-label">Plate Height (mm)</label>
                <input type="number" 
                       class="parameter-input" 
                       value="${group.parameters.plateHeight}" 
                       data-field="plateHeight"
                       min="1">
              </div>
              <div class="parameter-group">
                <label class="parameter-label">Kerf Width (mm)</label>
                <input type="number" 
                       class="parameter-input" 
                       value="${group.parameters.kerfWidth}" 
                       data-field="kerfWidth"
                       min="0">
              </div>
              <div class="parameter-group">
                <label class="parameter-label">Algorithm</label>
                <select class="parameter-input" data-field="algorithm">
                  <option value="GUILLOTINE" ${group.parameters.algorithm === 'GUILLOTINE' ? 'selected' : ''}>Guillotine</option>
                  <option value="MAXRECTS" ${group.parameters.algorithm === 'MAXRECTS' ? 'selected' : ''}>MaxRects</option>
                  <option value="SIMPLE" ${group.parameters.algorithm === 'SIMPLE' ? 'selected' : ''}>Simple</option>
                </select>
              </div>
            `}
          </div>
          
          <div class="cut-list-section">
            <div class="cut-list-header">
              <h3 class="cut-list-title">Cut Items</h3>
              <button class="btn btn-add btn-sm" data-action="add-item">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon-plus" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Item
              </button>
            </div>
            
            <div class="cut-list-items">
              ${group.items.map(item => renderCutItem(group, item)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCutItem(group, item) {
    const is1D = group.type === '1d';
    
    return `
      <div class="cut-item-row ${is1D ? 'one-d' : 'two-d'}" data-item-id="${item.id}">
        <input type="text" 
               class="cut-item-input cut-item-id" 
               value="${item.itemId}" 
               data-field="itemId"
               placeholder="ID">
        
        ${is1D ? `
          <input type="number" 
                 class="cut-item-input cut-item-length" 
                 value="${item.length}" 
                 data-field="length"
                 placeholder="Length (mm)"
                 min="1">
        ` : `
          <input type="number" 
                 class="cut-item-input cut-item-width" 
                 value="${item.width}" 
                 data-field="width"
                 placeholder="Width (mm)"
                 min="1">
          <input type="number" 
                 class="cut-item-input cut-item-height" 
                 value="${item.height}" 
                 data-field="height"
                 placeholder="Height (mm)"
                 min="1">
        `}
        
        <input type="number" 
               class="cut-item-input cut-item-qty" 
               value="${item.quantity}" 
               data-field="quantity"
               placeholder="Qty"
               min="1">
        
        ${!is1D ? `
          <label class="rotation-checkbox">
            <input type="checkbox" 
                   ${item.rotation ? 'checked' : ''}
                   data-field="rotation">
            Rotate
          </label>
        ` : ''}
        
        <div class="cut-item-actions">
          <button class="btn-remove" data-action="remove-item" title="Remove Item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  function getNextItemId(items) {
    if (items.length === 0) return 'A1';
    
    const lastItem = items[items.length - 1];
    const match = lastItem.itemId.match(/([A-Z]+)(\d+)/);
    
    if (match) {
      const letters = match[1];
      const number = parseInt(match[2]);
      return letters + (number + 1);
    }
    
    return lastItem.itemId + '1';
  }

  function setupEventListeners(groups) {
    const addGroupBtn = document.getElementById('add-group');
    if (addGroupBtn) {
      addGroupBtn.addEventListener('click', () => {
        const newGroup = createGroup(`Group ${groups.length + 1}`, '1d');
        groups.push(newGroup);
        saveGroups(groups);
        renderGroups(groups);
      });
    }
    
    const optimizeBtn = document.getElementById('optimize-project');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => optimizeProject(groups));
    }
    
    const downloadBtn = document.getElementById('download-template');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.ExcelTemplate && typeof window.ExcelTemplate.generateTemplate === 'function') {
          window.ExcelTemplate.generateTemplate();
        } else {
          downloadExcelTemplate();
        }
      });
    }
    
    const importBtn = document.getElementById('import-excel');
    const fileInput = document.getElementById('excel-file');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => handleExcelImport(e, groups));
    }
    
    document.addEventListener('click', handleClick.bind(null, groups));
    document.addEventListener('input', handleInput.bind(null, groups));
    document.addEventListener('change', handleChange.bind(null, groups));
  }

  function handleClick(groups, event) {
    const target = event.target;
    const button = target.closest('button');
    
    if (!button) return;
    
    const action = button.dataset.action;
    if (!action) return;
    
    event.preventDefault();
    
    const groupCard = button.closest('.group-card');
    const groupId = groupCard ? groupCard.dataset.groupId : null;
    
    const itemRow = button.closest('.cut-item-row');
    const itemId = itemRow ? itemRow.dataset.itemId : null;
    
    const group = groups.find(g => g.id === groupId);
    
    switch (action) {
      case 'remove-group':
        if (groups.length <= 1) {
          showError('Cannot remove the last group');
          return;
        }
        const index = groups.findIndex(g => g.id === groupId);
        groups.splice(index, 1);
        saveGroups(groups);
        renderGroups(groups);
        break;
        
      case 'change-type':
        if (group) {
          group.type = group.type === '1d' ? '2d' : '1d';
          group.items = [createDefaultItem(group.type)];
          group.parameters = group.type === '1d' ? {
            materialLength: 6000,
            kerfWidth: 3, // FIXED: Consistent default
            algorithm: 'first-fit'
          } : {
            plateWidth: 2440,
            plateHeight: 1220,
            kerfWidth: 3, // FIXED: Consistent default
            algorithm: 'GUILLOTINE'
          };
          saveGroups(groups);
          renderGroups(groups);
        }
        break;
        
      case 'add-item':
        if (group) {
          const nextId = getNextItemId(group.items);
          group.items.push(createDefaultItem(group.type));
          group.items[group.items.length - 1].itemId = nextId;
          saveGroups(groups);
          renderGroups(groups);
        }
        break;
        
      case 'remove-item':
        if (group && itemId && group.items.length > 1) {
          group.items = group.items.filter(item => item.id !== itemId);
          saveGroups(groups);
          renderGroups(groups);
        } else if (group && group.items.length <= 1) {
          showError('Cannot remove the last item');
        }
        break;
    }
  }

  function handleInput(groups, event) {
    const target = event.target;
    
    if (target.classList.contains('group-name-input')) {
      const groupCard = target.closest('.group-card');
      const groupId = groupCard.dataset.groupId;
      const group = groups.find(g => g.id === groupId);
      if (group) {
        group.name = target.value;
        saveGroups(groups);
      }
      return;
    }
    
    if (target.classList.contains('parameter-input')) {
      const field = target.dataset.field;
      if (['itemId', 'length', 'width', 'height', 'quantity'].includes(field)) return;
      
      const groupCard = target.closest('.group-card');
      const groupId = groupCard.dataset.groupId;
      const group = groups.find(g => g.id === groupId);
      
      if (group) {
        group.parameters[field] = target.type === 'number' ? 
          (parseInt(target.value) || 0) : target.value;
        saveGroups(groups);
      }
    }
    
    if (target.classList.contains('cut-item-id') || 
        target.classList.contains('cut-item-length') ||
        target.classList.contains('cut-item-width') ||
        target.classList.contains('cut-item-height') ||
        target.classList.contains('cut-item-qty')) {
      
      const field = target.dataset.field;
      const itemRow = target.closest('.cut-item-row');
      const itemId = itemRow.dataset.itemId;
      const groupCard = target.closest('.group-card');
      const groupId = groupCard.dataset.groupId;
      
      const group = groups.find(g => g.id === groupId);
      const item = group ? group.items.find(i => i.id === itemId) : null;
      
      if (item) {
        item[field] = target.type === 'number' ? 
          (parseInt(target.value) || '') : target.value;
        saveGroups(groups);
      }
    }
  }

  function handleChange(groups, event) {
    const target = event.target;
    
    if (target.type === 'checkbox') {
      const field = target.dataset.field;
      const itemRow = target.closest('.cut-item-row');
      const itemId = itemRow.dataset.itemId;
      const groupCard = target.closest('.group-card');
      const groupId = groupCard.dataset.groupId;
      
      const group = groups.find(g => g.id === groupId);
      const item = group ? group.items.find(i => i.id === itemId) : null;
      
      if (item && field === 'rotation') {
        item.rotation = target.checked;
        saveGroups(groups);
      }
    }
    
    if (target.tagName === 'SELECT' && target.classList.contains('parameter-input')) {
      const field = target.dataset.field;
      const groupCard = target.closest('.group-card');
      const groupId = groupCard.dataset.groupId;
      const group = groups.find(g => g.id === groupId);
      
      if (group) {
        group.parameters[field] = target.value;
        saveGroups(groups);
      }
    }
  }

  // Main optimization function - async with progress
  async function optimizeProject(groups) {
    // Check dependencies first
    if (typeof window.CuttingOptimizer1D === 'undefined') {
      showError('1D Optimizer module not loaded. Please refresh the page.');
      console.error('❌ CuttingOptimizer1D is not available in window');
      return;
    }
    
    if (typeof window.PlateOptimizer2D === 'undefined') {
      showError('2D Optimizer module not loaded. Please refresh the page.');
      console.error('❌ PlateOptimizer2D is not available in window');
      return;
    }
    
    const errors = [];
    const validGroups = [];
    
    // Validate groups
    groups.forEach(group => {
      const validItems = group.items.filter(item => {
        if (group.type === '1d') {
          const length = parseInt(item.length);
          const qty = parseInt(item.quantity);
          return length > 0 && qty > 0;
        } else {
          const width = parseInt(item.width);
          const height = parseInt(item.height);
          const qty = parseInt(item.quantity);
          return width > 0 && height > 0 && qty > 0;
        }
      });
      
      if (validItems.length === 0) {
        errors.push(`Group "${group.name}" has no valid items`);
      } else {
        validGroups.push({...group, items: validItems});
      }
    });
    
    if (errors.length > 0) {
      showError('Validation errors:\n\n' + errors.join('\n'));
      return;
    }
    
    const resultsContainer = document.getElementById('project-results');
    const formContainer = document.getElementById('optimizer-prj-form');
    
    // Show loading
    resultsContainer.innerHTML = `
      <div class="loading-overlay" style="position: relative;">
        <div class="loading-spinner">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="loading-text">Optimizing... <span id="progress-text">0%</span></p>
        </div>
      </div>
    `;
    resultsContainer.classList.remove('hidden');
    formContainer.classList.add('hidden');
    
    try {
      const results = await processGroupsWithProgress(validGroups);
      showResults(groups, results);
    } catch (error) {
      showError('Optimization failed: ' + error.message);
      resultsContainer.classList.add('hidden');
      formContainer.classList.remove('hidden');
    }
  }

  // Process groups with progress tracking
  async function processGroupsWithProgress(groups) {
    const results = [];
    const total = groups.length;
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const progress = Math.round(((i + 1) / total) * 100);
      
      // Update progress
      const progressText = document.getElementById('progress-text');
      if (progressText) {
        progressText.textContent = `${progress}% (${i + 1}/${total})`;
      }
      
      // Process group
      const result = await processGroup(group);
      results.push(result);
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return results;
  }

  // Process single group with timeout protection
  function processGroup(group) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout processing "${group.name}"`));
      }, 30000);
      
      try {
        const is1D = group.type === '1d';
        const algorithm = group.parameters.algorithm;
        
        if (is1D) {
          const optimizer = new window.CuttingOptimizer1D(algorithm);
          const items = group.items.map(item => {
            const length = parseInt(item.length) || 0;
            const qty = parseInt(item.quantity) || 0;
            const kerf = parseInt(group.parameters.kerfWidth) || 0;
            return {
              id: item.itemId,
              length: length + kerf,
              quantity: qty,
              originalLength: length
            };
          });
          
          const materialLength = parseInt(group.parameters.materialLength) || 6000;
          const result = optimizer.optimize(items, materialLength);
          clearTimeout(timeoutId);
          resolve({ group, type: '1d', result });
        } else {
          const optimizer = new window.PlateOptimizer2D(algorithm);
          const items = group.items.map(item => {
            const width = parseInt(item.width) || 0;
            const height = parseInt(item.height) || 0;
            const qty = parseInt(item.quantity) || 0;
            const kerf = parseInt(group.parameters.kerfWidth) || 0;
            return {
              id: item.itemId,
              width: width + kerf,
              height: height + kerf,
              quantity: qty,
              rotation: item.rotation !== false,
              originalWidth: width,
              originalHeight: height
            };
          });
          
          const plateWidth = parseInt(group.parameters.plateWidth) || 2440;
          const plateHeight = parseInt(group.parameters.plateHeight) || 1220;
          const result = optimizer.optimize(items, plateWidth, plateHeight);
          clearTimeout(timeoutId);
          resolve({ group, type: '2d', result });
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Show results with visualizations
  function showResults(originalGroups, optimizationResults) {
    const resultsContainer = document.getElementById('project-results');
    const totalGroups = optimizationResults.length;
    const totalItems = optimizationResults.reduce((sum, res) => sum + res.result.totalItems, 0);
    const avgEfficiency = totalGroups > 0 ? Math.round(
      optimizationResults.reduce((sum, res) => sum + res.result.overallEfficiency, 0) / totalGroups
    ) : 0;
    
    // Generate colors for items
    const itemColors = new Map();
    const uniqueItemIds = [...new Set(optimizationResults.flatMap(res => 
      res.result.bars ? res.result.bars.flatMap(bar => bar.items.map(i => i.originalId)) :
      res.result.plates.flatMap(plate => plate.items.map(i => i.originalId))
    ))];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#ef4444', '#0ea5e9'];
    uniqueItemIds.forEach((id, i) => {
      itemColors.set(id, colors[i % colors.length]);
    });
    
    // Store globally for navigation
    window.projectResultsData = {
      results: optimizationResults,
      itemColors: itemColors,
      currentIndices: new Array(optimizationResults.length).fill(0)
    };
    
    resultsContainer.innerHTML = `
      <div class="panel results-view">
        <div class="panel-header">
          <div class="panel-title-group">
            <svg xmlns="http://www.w3.org/2000/svg" class="panel-icon results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 class="panel-title">Project Cutting Optimization Results</h2>
          </div>
          <div class="action-buttons">
            <button class="btn btn-secondary" id="back-to-form-project">Back to Form</button>
            <button class="btn btn-primary" id="export-pdf-project">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-pdf" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
        <div class="panel-content">
          <div class="stat-grid">
            <div class="stat-card">
              <p class="stat-label">Total Groups</p>
              <p class="stat-value">${totalGroups}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Total Items</p>
              <p class="stat-value">${totalItems}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Avg Efficiency</p>
              <p class="stat-value">${avgEfficiency}<span class="stat-unit">%</span></p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Execution Time</p>
              <p class="stat-value">${optimizationResults[0]?.result.executionTime || 0}<span class="stat-unit">ms</span></p>
            </div>
          </div>

          <div class="group-results" style="margin-top: 2rem;">
            ${optimizationResults.map((res, index) => renderGroupResult(res, index, itemColors)).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Attach event listeners
    const backBtn = document.getElementById('back-to-form-project');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        resultsContainer.classList.add('hidden');
        document.getElementById('optimizer-prj-form').classList.remove('hidden');
      });
    }
    
    // FIXED: PDF export button now properly calls the function
    const exportBtn = document.getElementById('export-pdf-project');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        try {
          // FIXED: Pass correct data structure
          if (typeof window.exportProjectToPDF === 'function') {
            window.exportProjectToPDF(optimizationResults);
          } else {
            showError('PDF export is not available. Please check your connection.');
          }
        } catch (error) {
          console.error('PDF Export failed:', error);
          showError('Failed to export PDF. Please try again.');
        }
      });
    }
    
    // Setup navigation for each group
    optimizationResults.forEach((res, groupIndex) => {
      const prevBtn = document.getElementById(`prev-viz-${groupIndex}`);
      const nextBtn = document.getElementById(`next-viz-${groupIndex}`);
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateVisualization(groupIndex, -1));
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateVisualization(groupIndex, 1));
      }
    });
    
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Render group result with visualization
  function renderGroupResult(res, groupIndex, itemColors) {
    const is1D = res.type === '1d';
    const group = res.group;
    
    return `
      <div class="group-result-card" data-group-index="${groupIndex}" style="margin-bottom: 2rem;">
        <div class="group-result-header">
          <h3 class="group-result-title">${group.name} (${is1D ? '1D Linear' : '2D Sheet'})</h3>
        </div>
        <div class="group-result-stats">
          <div class="group-result-stat">
            <div class="group-result-label">Algorithm</div>
            <div class="group-result-value">${group.parameters.algorithm}</div>
          </div>
          <div class="group-result-stat">
            <div class="group-result-label">Efficiency</div>
            <div class="group-result-value">${res.result.overallEfficiency}%</div>
          </div>
          <div class="group-result-stat">
            <div class="group-result-label">${is1D ? 'Total Bars' : 'Total Plates'}</div>
            <div class="group-result-value">${is1D ? res.result.totalBars : res.result.totalPlates}</div>
          </div>
          <div class="group-result-stat">
            <div class="group-result-label">Total Items</div>
            <div class="group-result-value">${res.result.totalItems}</div>
          </div>
        </div>
        
        <div class="visualization-container" style="margin-top: 1.5rem;">
          ${renderGroupVisualization(res, groupIndex, itemColors)}
        </div>
      </div>
    `;
  }

  // Render visualization for a group
  function renderGroupVisualization(res, groupIndex, itemColors) {
    if (res.type === '1d') {
      return render1DVisualization(res.result, groupIndex, itemColors, res.group.parameters);
    } else {
      return render2DVisualization(res.result, groupIndex, itemColors, res.group.parameters);
    }
  }

  // 1D Visualization
  function render1DVisualization(result, groupIndex, itemColors, parameters) {
    if (!result.bars || result.bars.length === 0) return '<div class="empty-state">No bars to display</div>';
    
    const currentIndex = window.projectResultsData.currentIndices[groupIndex] || 0;
    const bar = result.bars[currentIndex];
    const hasMultiple = result.bars.length > 1;
    
    const segments = bar.items.map((item, i) => {
      const widthPercentage = (item.originalLength / parameters.materialLength) * 100;
      const color = itemColors.get(item.originalId) || '#3b82f6';
      return `
        <div class="bar-segment" 
             style="width: ${widthPercentage}%; background-color: ${color};"
             title="${item.originalId}: ${item.originalLength}mm">
          ${widthPercentage > 5 ? '<span class="truncate">' + item.originalId + '</span>' : ''}
        </div>
      `;
    }).join('');
    
    return `
      <div class="nav-controls">
        <h3 class="nav-title">Bar Layouts</h3>
        ${hasMultiple ? `
          <div class="nav-buttons">
            <span class="nav-counter">Bar ${currentIndex + 1} of ${result.bars.length}</span>
            <button class="nav-btn" id="prev-viz-${groupIndex}" ${currentIndex === 0 ? 'disabled' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button class="nav-btn" id="next-viz-${groupIndex}" ${currentIndex === result.bars.length - 1 ? 'disabled' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
      <div class="bar-viz-container">
        <div class="bar-visualization" style="height: 3.5rem;">
          ${segments}
        </div>
        <div class="bar-info">
          <p><b>Bar ${bar.id}:</b> Eff: ${bar.efficiency}% | Waste: ${bar.remainingLength}mm | Items: ${bar.items.length}</p>
        </div>
      </div>
    `;
  }

  // 2D Visualization
  function render2DVisualization(result, groupIndex, itemColors, parameters) {
    if (!result.plates || result.plates.length === 0) return '<div class="empty-state">No plates to display</div>';
    
    const currentIndex = window.projectResultsData.currentIndices[groupIndex] || 0;
    const plate = result.plates[currentIndex];
    const hasMultiple = result.plates.length > 1;
    const aspectRatio = parameters.plateHeight / parameters.plateWidth;
    
    const items = plate.items.map(item => {
      const left = (item.x / parameters.plateWidth) * 100;
      const top = (item.y / parameters.plateHeight) * 100;
      const width = (item.width / parameters.plateWidth) * 100;
      const height = (item.height / parameters.plateHeight) * 100;
      const color = itemColors.get(item.originalId) || '#3b82f6';
      
      return `
        <div class="plate-item"
             style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; background-color: ${color};"
             title="${item.originalId}: ${item.originalWidth}x${item.originalHeight}mm ${item.rotated ? '(rotated)' : ''}">
          ${width > 5 && height > 5 ? '<span class="truncate">' + item.originalId + '</span>' : ''}
        </div>
      `;
    }).join('');
    
    return `
      <div class="nav-controls">
        <h3 class="nav-title">Plate Layouts</h3>
        ${hasMultiple ? `
          <div class="nav-buttons">
            <span class="nav-counter">Plate ${currentIndex + 1} of ${result.plates.length}</span>
            <button class="nav-btn" id="prev-viz-${groupIndex}" ${currentIndex === 0 ? 'disabled' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button class="nav-btn" id="next-viz-${groupIndex}" ${currentIndex === result.plates.length - 1 ? 'disabled' : ''}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
      <div class="plate-viz-container">
        <div class="plate-visualization" style="padding-bottom: ${aspectRatio * 100}%;">
          ${items}
        </div>
        <div class="plate-info">
          <p><b>Plate ${plate.id}:</b> Eff: ${plate.getEfficiency()}% | Items: ${plate.items.length}</p>
        </div>
      </div>
    `;
  }

  // Navigation function
  function navigateVisualization(groupIndex, direction) {
    const data = window.projectResultsData;
    const res = data.results[groupIndex];
    const maxIndex = res.type === '1d' ? res.result.bars.length - 1 : res.result.plates.length - 1;
    
    data.currentIndices[groupIndex] = Math.max(0, Math.min(maxIndex, data.currentIndices[groupIndex] + direction));
    
    const container = document.querySelector(`[data-group-index="${groupIndex}"] .visualization-container`);
    if (container) {
      container.innerHTML = renderGroupVisualization(res, groupIndex, data.itemColors);
      
      // Re-attach event listeners
      const prevBtn = document.getElementById(`prev-viz-${groupIndex}`);
      const nextBtn = document.getElementById(`next-viz-${groupIndex}`);
      
      if (prevBtn) {
        prevBtn.onclick = () => navigateVisualization(groupIndex, -1);
      }
      if (nextBtn) {
        nextBtn.onclick = () => navigateVisualization(groupIndex, 1);
      }
    }
  }

  // Excel import functions
  function handleExcelImport(event, groups) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const newGroups = [];
        
        // Process 1D sheet
        const sheet1D = workbook.Sheets['1D'];
        if (sheet1D) {
          const json1D = XLSX.utils.sheet_to_json(sheet1D);
          newGroups.push(...processSheetData(json1D, '1d'));
        }
        
        // Process 2D sheet
        const sheet2D = workbook.Sheets['2D'];
        if (sheet2D) {
          const json2D = XLSX.utils.sheet_to_json(sheet2D);
          newGroups.push(...processSheetData(json2D, '2d'));
        }
        
        // Replace groups
        groups.length = 0;
        groups.push(...newGroups);
        saveGroups(groups);
        renderGroups(groups);
        
        event.target.value = '';
        showSuccess('Excel imported successfully! Imported ' + newGroups.length + ' groups.');
        
      } catch (error) {
        console.error('Error importing Excel:', error);
        showError('Error importing Excel. Please check the file format.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  }

  function processSheetData(data, type) {
    const groupsMap = {};
    
    data.forEach(row => {
      const groupName = row['Group Name'];
      if (!groupName) return;
      
      if (!groupsMap[groupName]) {
        groupsMap[groupName] = {
          id: Date.now().toString() + Math.random(),
          name: groupName,
          type: type,
          parameters: type === '1d' ? {
            materialLength: row['Material Length (mm)'] || 6000,
            kerfWidth: row['Kerf (mm)'] || 3, // FIXED: Consistent default
            algorithm: row['Algorithm'] || 'first-fit'
          } : {
            plateWidth: row['Plate Width (mm)'] || 2440,
            plateHeight: row['Plate Height (mm)'] || 1220,
            kerfWidth: row['Kerf (mm)'] || 3, // FIXED: Consistent default
            algorithm: row['Algorithm'] || 'GUILLOTINE'
          },
          items: []
        };
      }
      
      groupsMap[groupName].items.push({
        id: Date.now().toString() + Math.random(),
        itemId: row['Item ID'] || 'A1',
        length: type === '1d' ? (row['Length (mm)'] || '') : '',
        width: type === '2d' ? (row['Width (mm)'] || '') : '',
        height: type === '2d' ? (row['Height (mm)'] || '') : '',
        quantity: row['Quantity'] || '',
        rotation: type === '2d' ? (row['Rotate'] || 'Yes').toString().toLowerCase() === 'yes' : true
      });
    });
    
    return Object.values(groupsMap);
  }

  function downloadExcelTemplate() {
    const wb = XLSX.utils.book_new();
    
    // 1D Sheet
    const headers1D = ['Group Name', 'Material Length (mm)', 'Kerf (mm)', 'Algorithm', 'Item ID', 'Length (mm)', 'Quantity'];
    const ws1D = XLSX.utils.aoa_to_sheet([headers1D]);
    
    // Add data validation for 1D algorithms
    if (!ws1D['!dataValidation']) ws1D['!dataValidation'] = [];
    ws1D['!dataValidation'].push({
      type: 'list',
      allowBlank: false,
      sqref: 'D2:D1000',
      formulas: ['"first-fit,best-fit,worst-fit"']
    });
    
    // Add example data
    const example1D = [
      ['Group 1', '6000', '3', 'first-fit', 'A1', '300', '10'], // FIXED: kerf = 3
      ['Group 1', '6000', '3', 'first-fit', 'A2', '2100', '5'],
      ['Group 2', '6000', '3', 'best-fit', 'B1', '320', '10']
    ];
    XLSX.utils.sheet_add_aoa(ws1D, example1D, { origin: 1 });
    
    XLSX.utils.book_append_sheet(wb, ws1D, '1D');
    
    // 2D Sheet
    const headers2D = ['Group Name', 'Plate Width (mm)', 'Plate Height (mm)', 'Kerf (mm)', 'Algorithm', 'Item ID', 'Width (mm)', 'Height (mm)', 'Quantity', 'Rotate'];
    const ws2D = XLSX.utils.aoa_to_sheet([headers2D]);
    
    // Add data validation for 2D algorithms
    if (!ws2D['!dataValidation']) ws2D['!dataValidation'] = [];
    ws2D['!dataValidation'].push({
      type: 'list',
      allowBlank: false,
      sqref: 'E2:E1000',
      formulas: ['"GUILLOTINE,MAXRECTS,SIMPLE"']
    });
    
    // Add data validation for Rotate
    ws2D['!dataValidation'].push({
      type: 'list',
      allowBlank: false,
      sqref: 'J2:J1000',
      formulas: ['"Yes,No"']
    });
    
    // Add example data
    const example2D = [
      ['Plate Group 1', '2440', '1220', '3', 'GUILLOTINE', 'P1', '320', '1200', '10', 'Yes'], // FIXED: kerf = 3
      ['Plate Group 1', '2440', '1220', '3', 'GUILLOTINE', 'P2', '1100', '320', '4', 'Yes']
    ];
    XLSX.utils.sheet_add_aoa(ws2D, example2D, { origin: 1 });
    
    XLSX.utils.book_append_sheet(wb, ws2D, '2D');
    
    XLSX.writeFile(wb, 'EAV_Project_Template.xlsx');
  }

  // Message functions
  function showError(message) {
    if (window.App && typeof window.App.showError === 'function') {
      window.App.showError(message, 'optimizer-prj-form');
      return;
    }
    alert(message);
  }

  function showSuccess(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: var(--color-green-500);
      color: white;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      font-weight: var(--font-medium);
    `;
    successEl.textContent = message;
    document.body.appendChild(successEl);
    setTimeout(() => successEl.remove(), 3000);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProject);
  } else {
    initProject();
  }

  // Export to window
  window.projectManager = {
    init: initProject,
    saveGroups: saveGroups,
    renderGroups: renderGroups
  };

  console.log('✅ Project Manager script loaded - All animations removed');
})(window, document);