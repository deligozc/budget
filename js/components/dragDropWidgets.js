// js/components/dragDropWidgets.js - Dashboard Widget Sürükle-Bırak Yönetimi

class DragDropWidgets {
    constructor() {
        this.draggedElement = null;
        this.dropTarget = null;
        this.widgetPositions = [];
        this.dragEnabled = false;
        this.editMode = false;
        this.widgets = [];
        this.containerSelector = '#dashboardContent';
        this.widgetSelector = '.widget';
        this.storageKey = 'budgetTracker_widgetPositions';
    }

    /**
     * Initialize drag-drop functionality
     */
    initialize() {
        console.log('DragDropWidgets başlatılıyor...');

        // Load saved widget positions
        this.loadWidgetPositions();

        // Convert existing sections to widgets
        this.convertSectionsToWidgets();

        // Setup drag-drop event listeners
        this.setupEventListeners();

        // Create dashboard controls for edit mode
        this.createDashboardControls();

        console.log('DragDropWidgets başarıyla başlatıldı');
    }

    /**
     * Convert existing dashboard sections to draggable widgets
     */
    convertSectionsToWidgets() {
        const dashboardContainer = document.querySelector(this.containerSelector);
        if (!dashboardContainer) return;

        // Find all top-level sections in the dashboard
        const sections = [
            ...dashboardContainer.querySelectorAll('.stats-grid'), // KPI Cards
            ...dashboardContainer.querySelectorAll('#advancedKpiContainer'), // Advanced KPI Cards
            ...Array.from(dashboardContainer.querySelectorAll('#aiRecommendationsContainer')).map(el => el.parentElement), // AI Recommendations Section
            ...dashboardContainer.querySelectorAll('.charts-grid'), // Main Charts
            ...dashboardContainer.querySelectorAll('#advancedChartsSection'), // Advanced Charts
            ...Array.from(dashboardContainer.querySelectorAll('#tagCloud')).map(el => el.closest('.chart-card')), // Tag Cloud
            ...dashboardContainer.querySelectorAll('.recent-transactions') // Recent Transactions
        ].filter(Boolean);

        // Convert each section to a widget
        sections.forEach((section, index) => {
            // Skip if already a widget
            if (section.classList.contains('widget')) return;

            // Create widget container
            const widgetId = `widget-${index}`;
            section.classList.add('widget');
            section.setAttribute('data-widget-id', widgetId);
            section.setAttribute('draggable', 'false');

            // Add widget controls
            const controls = document.createElement('div');
            controls.className = 'widget-controls';
            controls.innerHTML = `
                <button class="widget-drag-handle" title="Taşı">
                    <i data-lucide="move"></i>
                </button>
                <button class="widget-toggle" title="Gizle/Göster">
                    <i data-lucide="eye"></i>
                </button>
            `;

            section.insertBefore(controls, section.firstChild);

            // Initialize control icons
            lucide.createIcons(controls);

            // Save widget
            this.widgets.push({
                id: widgetId,
                element: section,
                visible: true,
                order: this.getWidgetPositionById(widgetId) || index
            });
        });

        // Apply saved widget order
        this.applyWidgetOrder();
    }

    /**
     * Setup event listeners for drag-drop
     */
    setupEventListeners() {
        // Store bound method references to be able to remove them later
        this.handleDragStartBound = this.handleDragStart.bind(this);
        this.handleDragOverBound = this.handleDragOver.bind(this);
        this.handleDragEnterBound = this.handleDragEnter.bind(this);
        this.handleDragLeaveBound = this.handleDragLeave.bind(this);
        this.handleDropBound = this.handleDrop.bind(this);
        this.handleDragEndBound = this.handleDragEnd.bind(this);
        
        // Add event listeners using the bound methods
        document.addEventListener('dragstart', this.handleDragStartBound);
        document.addEventListener('dragover', this.handleDragOverBound);
        document.addEventListener('dragenter', this.handleDragEnterBound);
        document.addEventListener('dragleave', this.handleDragLeaveBound);
        document.addEventListener('drop', this.handleDropBound);
        document.addEventListener('dragend', this.handleDragEndBound);

        // Handle widget visibility toggle and drag handle clicks
        this.handleWidgetClicksBound = this.handleWidgetClicks.bind(this);
        document.addEventListener('click', this.handleWidgetClicksBound);
    }
    
    /**
     * Handle widget-related clicks
     */
    handleWidgetClicks(e) {
        // Handle widget visibility toggle
        const toggleButton = e.target.closest('.widget-toggle');
        if (toggleButton) {
            const widget = toggleButton.closest(this.widgetSelector);
            if (widget) {
                this.toggleWidgetVisibility(widget);
            }
        }

        // Handle drag handle clicks
        const dragHandle = e.target.closest('.widget-drag-handle');
        if (dragHandle && this.editMode) {
            const widget = dragHandle.closest(this.widgetSelector);
            if (widget) {
                widget.setAttribute('draggable', 'true');
            }
        }
    }

    /**
     * Create dashboard controls for edit mode
     */
    createDashboardControls() {
        const dashboardControls = document.querySelector('.dashboard-controls');
        if (!dashboardControls) return;

        // Create edit mode toggle
        const editModeButton = document.createElement('button');
        editModeButton.id = 'dashboardEditMode';
        editModeButton.className = 'btn btn-secondary text-sm ml-2';
        editModeButton.innerHTML = `
            <i data-lucide="layout-dashboard" style="width: 0.875rem; height: 0.875rem;"></i>
            <span>Düzenle</span>
        `;

        // Add edit mode button to dashboard controls
        dashboardControls.querySelector('.dashboard-actions').appendChild(editModeButton);

        // Initialize icon
        lucide.createIcons(editModeButton);

        // Add event listener
        editModeButton.addEventListener('click', this.toggleEditMode.bind(this));
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        this.editMode = !this.editMode;
        
        // Update button text
        const editButton = document.getElementById('dashboardEditMode');
        if (editButton) {
            editButton.innerHTML = this.editMode 
                ? `<i data-lucide="check" style="width: 0.875rem; height: 0.875rem;"></i>
                   <span>Tamamla</span>`
                : `<i data-lucide="layout-dashboard" style="width: 0.875rem; height: 0.875rem;"></i>
                   <span>Düzenle</span>`;
            
            // Update button style
            editButton.classList.toggle('btn-primary', this.editMode);
            editButton.classList.toggle('btn-secondary', !this.editMode);
            
            // Initialize icon
            lucide.createIcons(editButton);
        }
        
        // Enable/disable dragging
        this.enableDragging(this.editMode);
        
        // Show/hide widget controls
        document.querySelectorAll(this.widgetSelector).forEach(widget => {
            widget.classList.toggle('edit-mode', this.editMode);
        });
        
        // Show toast message
        if (this.editMode) {
            showToast('Dashboard düzenleme modu aktif. Widget\'ları sürükleyerek düzenleyebilirsiniz.', 'info');
        } else {
            // Save widget positions when exiting edit mode
            this.saveWidgetPositions();
            showToast('Dashboard düzeni kaydedildi.', 'success');
        }
    }

    /**
     * Enable or disable dragging for all widgets
     */
    enableDragging(enable) {
        document.querySelectorAll(this.widgetSelector).forEach(widget => {
            widget.setAttribute('draggable', enable.toString());
        });
        
        this.dragEnabled = enable;
    }

    /**
     * Handle drag start event
     */
    handleDragStart(e) {
        if (!this.dragEnabled) return;
        
        const widget = e.target.closest(this.widgetSelector);
        if (!widget) return;
        
        this.draggedElement = widget;
        
        // Set drag image (optional)
        // Add styling for dragged element
        widget.classList.add('dragging');
        
        // Set data transfer
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', widget.getAttribute('data-widget-id'));
        
        // Wait a bit to add dragging class for visual effect
        setTimeout(() => {
            widget.classList.add('dragging');
        }, 0);
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        if (!this.dragEnabled || !this.draggedElement) return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    /**
     * Handle drag enter event
     */
    handleDragEnter(e) {
        if (!this.dragEnabled || !this.draggedElement) return;
        
        const widget = e.target.closest(this.widgetSelector);
        if (!widget || widget === this.draggedElement) return;
        
        // Highlight drop target
        widget.classList.add('drop-target');
        this.dropTarget = widget;
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        if (!this.dragEnabled || !this.draggedElement) return;
        
        const widget = e.target.closest(this.widgetSelector);
        if (!widget || widget === this.draggedElement) return;
        
        // Remove highlight
        widget.classList.remove('drop-target');
        
        // Only clear dropTarget if it's the current widget
        if (this.dropTarget === widget) {
            this.dropTarget = null;
        }
    }

    /**
     * Handle drop event
     */
    handleDrop(e) {
        if (!this.dragEnabled || !this.draggedElement) return;
        
        e.preventDefault();
        
        const dropTarget = e.target.closest(this.widgetSelector);
        if (!dropTarget || dropTarget === this.draggedElement) return;
        
        // Get container and positions
        const container = document.querySelector(this.containerSelector);
        const draggedRect = this.draggedElement.getBoundingClientRect();
        const targetRect = dropTarget.getBoundingClientRect();
        
        // Determine if we're dropping before or after the target
        const dropBefore = targetRect.top + (targetRect.height / 2) > draggedRect.top;
        
        // Reorder nodes
        if (dropBefore) {
            container.insertBefore(this.draggedElement, dropTarget);
        } else {
            container.insertBefore(this.draggedElement, dropTarget.nextSibling);
        }
        
        // Remove highlighting
        dropTarget.classList.remove('drop-target');
        
        // Update widget order
        this.updateWidgetOrder();
        
        // Clear drop target
        this.dropTarget = null;
    }

    /**
     * Handle drag end event
     */
    handleDragEnd(e) {
        if (!this.dragEnabled || !this.draggedElement) return;
        
        // Remove all drag-related classes
        document.querySelectorAll(`${this.widgetSelector}.dragging`).forEach(el => {
            el.classList.remove('dragging');
        });
        
        document.querySelectorAll(`${this.widgetSelector}.drop-target`).forEach(el => {
            el.classList.remove('drop-target');
        });
        
        // Clear drag state
        this.draggedElement = null;
        this.dropTarget = null;
        
        // Save widget positions
        this.saveWidgetPositions();
    }

    /**
     * Toggle widget visibility
     */
    toggleWidgetVisibility(widget) {
        const widgetId = widget.getAttribute('data-widget-id');
        const widgetIndex = this.widgets.findIndex(w => w.id === widgetId);
        
        if (widgetIndex !== -1) {
            // Toggle visibility
            this.widgets[widgetIndex].visible = !this.widgets[widgetIndex].visible;
            
            // Update UI
            const contentElement = widget.querySelector(':scope > :not(.widget-controls)');
            if (contentElement) {
                contentElement.style.display = this.widgets[widgetIndex].visible ? '' : 'none';
            }
            
            // Update toggle button icon
            const toggleButton = widget.querySelector('.widget-toggle');
            if (toggleButton) {
                toggleButton.innerHTML = this.widgets[widgetIndex].visible
                    ? '<i data-lucide="eye"></i>'
                    : '<i data-lucide="eye-off"></i>';
                
                // Initialize icon
                lucide.createIcons(toggleButton);
            }
            
            // Save widget positions
            this.saveWidgetPositions();
        }
    }

    /**
     * Update widget order after drag-drop
     */
    updateWidgetOrder() {
        const widgets = document.querySelectorAll(this.widgetSelector);
        
        widgets.forEach((widget, index) => {
            const widgetId = widget.getAttribute('data-widget-id');
            const widgetIndex = this.widgets.findIndex(w => w.id === widgetId);
            
            if (widgetIndex !== -1) {
                this.widgets[widgetIndex].order = index;
            }
        });
    }

    /**
     * Apply saved widget order
     */
    applyWidgetOrder() {
        // Sort widgets by saved order
        this.widgets.sort((a, b) => a.order - b.order);
        
        // Get container
        const container = document.querySelector(this.containerSelector);
        if (!container) return;
        
        // Reorder widgets in DOM
        this.widgets.forEach(widget => {
            container.appendChild(widget.element);
            
            // Apply visibility
            const contentElement = widget.element.querySelector(':scope > :not(.widget-controls)');
            if (contentElement) {
                contentElement.style.display = widget.visible ? '' : 'none';
            }
            
            // Update toggle button icon
            const toggleButton = widget.element.querySelector('.widget-toggle');
            if (toggleButton) {
                toggleButton.innerHTML = widget.visible
                    ? '<i data-lucide="eye"></i>'
                    : '<i data-lucide="eye-off"></i>';
                
                // Initialize icon
                lucide.createIcons(toggleButton);
            }
        });
    }

    /**
     * Save widget positions to localStorage
     */
    saveWidgetPositions() {
        const positions = this.widgets.map(widget => ({
            id: widget.id,
            order: widget.order,
            visible: widget.visible
        }));
        
        localStorage.setItem(this.storageKey, JSON.stringify(positions));
        console.log('Widget positions saved:', positions);
    }

    /**
     * Load widget positions from localStorage
     */
    loadWidgetPositions() {
        const savedData = localStorage.getItem(this.storageKey);
        
        if (savedData) {
            try {
                this.widgetPositions = JSON.parse(savedData);
                console.log('Widget positions loaded:', this.widgetPositions);
            } catch (error) {
                console.error('Failed to parse saved widget positions:', error);
                this.widgetPositions = [];
            }
        } else {
            this.widgetPositions = [];
        }
    }

    /**
     * Get saved position for a widget by ID
     */
    getWidgetPositionById(widgetId) {
        const position = this.widgetPositions.find(p => p.id === widgetId);
        return position ? position.order : null;
    }

    /**
     * Get saved visibility for a widget by ID
     */
    getWidgetVisibilityById(widgetId) {
        const position = this.widgetPositions.find(p => p.id === widgetId);
        return position ? position.visible : true;
    }

    /**
     * Reset widget positions to default
     */
    resetWidgetPositions() {
        localStorage.removeItem(this.storageKey);
        this.widgetPositions = [];
        
        // Reset widgets
        this.widgets.forEach((widget, index) => {
            widget.order = index;
            widget.visible = true;
        });
        
        // Apply default order
        this.applyWidgetOrder();
        
        showToast('Dashboard düzeni sıfırlandı.', 'success');
    }

    /**
     * Update after dashboard content changes
     */
    update() {
        // Refresh widgets if needed
        this.convertSectionsToWidgets();
        
        // Apply saved order
        this.applyWidgetOrder();
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Remove event listeners using stored bound methods
        if (this.handleDragStartBound) document.removeEventListener('dragstart', this.handleDragStartBound);
        if (this.handleDragOverBound) document.removeEventListener('dragover', this.handleDragOverBound);
        if (this.handleDragEnterBound) document.removeEventListener('dragenter', this.handleDragEnterBound);
        if (this.handleDragLeaveBound) document.removeEventListener('dragleave', this.handleDragLeaveBound);
        if (this.handleDropBound) document.removeEventListener('drop', this.handleDropBound);
        if (this.handleDragEndBound) document.removeEventListener('dragend', this.handleDragEndBound);
        if (this.handleWidgetClicksBound) document.removeEventListener('click', this.handleWidgetClicksBound);
        
        // Clear bound method references
        this.handleDragStartBound = null;
        this.handleDragOverBound = null;
        this.handleDragEnterBound = null;
        this.handleDragLeaveBound = null;
        this.handleDropBound = null;
        this.handleDragEndBound = null;
        this.handleWidgetClicksBound = null;
    }
}

// Create instance
const dragDropWidgets = new DragDropWidgets();