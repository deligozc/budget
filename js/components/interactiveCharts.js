/**
 * Interactive Charts Component
 * Enhances chart interactivity with drill-down, filters, and controls
 */

class InteractiveCharts {
    constructor() {
        this.drillDownData = null;
        this.activeChart = null;
        this.chartOptions = {
            timeRange: {
                start: null,
                end: null
            },
            chartType: {
                monthly: 'line',
                category: 'doughnut'
            },
            selectedCategories: [],
            comparisonMode: false,
            annotations: []
        };
        
        // Advanced chart instances
        this.advancedCharts = {};
        
        // Enhanced chart types
        this.enhancedChartTypes = {
            waterfall: {
                name: "Waterfall Chart",
                description: "Gelir/gider akış grafiği"
            },
            sankey: {
                name: "Sankey Diagram",
                description: "Para akış diyagramı"
            },
            heatmap: {
                name: "Heatmap",
                description: "Kategori/zaman harcama yoğunluğu"
            },
            radar: {
                name: "Radar Chart",
                description: "Çok boyutlu kategori analizi"
            },
            gantt: {
                name: "Gantt Chart",
                description: "Bütçe planı timeline'ı"
            }
        };
    }

    /**
     * Initialize interactive charts
     */
    initialize() {
        // Setup event listeners after DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.setupChartControls();
            this.createAdvancedChartSection();
        });
        
        // Setup event delegation for chart interactions
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Chart type switcher
            if (target.closest('.chart-type-switch')) {
                this.handleChartTypeSwitch(target.closest('.chart-type-switch'));
            }
            
            // Time range selector
            if (target.closest('.time-range-option')) {
                this.handleTimeRangeSelection(target.closest('.time-range-option'));
            }
            
            // Drill down trigger
            if (target.closest('[data-drill-down]')) {
                this.handleDrillDown(target.closest('[data-drill-down]'));
            }
            
            // Comparison toggle
            if (target.closest('.comparison-toggle')) {
                this.toggleComparisonMode(target.closest('.comparison-toggle'));
            }
            
            // Add annotation
            if (target.closest('.add-annotation')) {
                this.addAnnotation(target.closest('.chart-container'));
            }
        });
    }
    
    /**
     * Setup chart controls on existing charts
     */
    setupChartControls() {
        // Add chart type switcher to Monthly Overview chart
        const monthlyChartHeader = document.querySelector('.chart-card:has(#monthlyChart) .chart-header');
        if (monthlyChartHeader) {
            const typeSwitch = document.createElement('div');
            typeSwitch.className = 'chart-type-controls ml-auto flex items-center space-x-2';
            typeSwitch.innerHTML = `
                <span class="text-xs text-gray-500">Grafik türü:</span>
                <div class="chart-type-switch flex">
                    <button data-chart-type="line" data-target="monthlyChart" class="active" title="Çizgi grafik">
                        <i data-lucide="line-chart" class="w-4 h-4"></i>
                    </button>
                    <button data-chart-type="bar" data-target="monthlyChart" title="Sütun grafik">
                        <i data-lucide="bar-chart" class="w-4 h-4"></i>
                    </button>
                    <button data-chart-type="area" data-target="monthlyChart" title="Alan grafik">
                        <i data-lucide="area-chart" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            
            // Add time range selector
            const timeRange = document.createElement('div');
            timeRange.className = 'time-range-selector ml-4';
            timeRange.innerHTML = `
                <select class="time-range-select text-xs border border-gray-300 rounded p-1">
                    <option value="3m">Son 3 ay</option>
                    <option value="6m" selected>Son 6 ay</option>
                    <option value="1y">Son 1 yıl</option>
                    <option value="all">Tümü</option>
                </select>
            `;
            
            typeSwitch.appendChild(timeRange);
            monthlyChartHeader.appendChild(typeSwitch);
            
            // Add comparison toggle
            const comparisonToggle = document.createElement('div');
            comparisonToggle.className = 'ml-4';
            comparisonToggle.innerHTML = `
                <button class="comparison-toggle text-xs border border-gray-300 rounded p-1 flex items-center" data-target="monthlyChart">
                    <i data-lucide="git-compare" class="w-3 h-3 mr-1"></i>
                    <span>Karşılaştır</span>
                </button>
            `;
            
            typeSwitch.appendChild(comparisonToggle);
        }
        
        // Add chart type switcher to Category Distribution chart
        const categoryChartHeader = document.querySelector('.chart-card:has(#categoryChart) .chart-header');
        if (categoryChartHeader) {
            const typeSwitch = document.createElement('div');
            typeSwitch.className = 'chart-type-controls ml-auto flex items-center space-x-2';
            typeSwitch.innerHTML = `
                <span class="text-xs text-gray-500">Grafik türü:</span>
                <div class="chart-type-switch flex">
                    <button data-chart-type="doughnut" data-target="categoryChart" class="active" title="Halka grafik">
                        <i data-lucide="circle" class="w-4 h-4"></i>
                    </button>
                    <button data-chart-type="pie" data-target="categoryChart" title="Pasta grafik">
                        <i data-lucide="pie-chart" class="w-4 h-4"></i>
                    </button>
                    <button data-chart-type="bar" data-target="categoryChart" title="Sütun grafik">
                        <i data-lucide="bar-chart" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            
            categoryChartHeader.appendChild(typeSwitch);
            
            // Add category filter
            const categoryFilter = document.createElement('div');
            categoryFilter.className = 'category-filter ml-4';
            categoryFilter.innerHTML = `
                <button class="text-xs border border-gray-300 rounded p-1 flex items-center" id="categoryFilterBtn">
                    <i data-lucide="filter" class="w-3 h-3 mr-1"></i>
                    <span>Filtrele</span>
                </button>
            `;
            
            typeSwitch.appendChild(categoryFilter);
        }
        
        // Initialize icons
        lucide.createIcons();
    }
    
    /**
     * Create advanced chart section
     */
    createAdvancedChartSection() {
        // Create advanced charts section
        const dashboard = document.getElementById('dashboardContent');
        if (!dashboard) return;
        
        // Check if the section already exists
        if (document.getElementById('advancedChartsSection')) return;
        
        // Create section after existing charts
        const section = document.createElement('div');
        section.id = 'advancedChartsSection';
        section.className = 'mb-8 mt-6';
        
        // Create options from enhanced chart types
        const chartOptions = Object.entries(this.enhancedChartTypes)
            .map(([value, chart]) => `<option value="${value}">${chart.name}</option>`)
            .join('');
        
        section.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Gelişmiş Grafikler</h3>
                <div class="advanced-chart-controls flex items-center space-x-2">
                    <select id="advancedChartSelector" class="text-sm border border-gray-300 rounded p-1">
                        ${chartOptions}
                    </select>
                    <button id="loadAdvancedChart" class="btn btn-sm btn-primary">
                        <i data-lucide="bar-chart-3" class="w-3 h-3 mr-1"></i>
                        <span>Göster</span>
                    </button>
                </div>
            </div>
            
            <div class="advanced-chart-container">
                <div id="advancedChartWrapper" class="chart-card p-4">
                    <div id="advancedChartPlaceholder" class="text-center py-20 text-gray-400">
                        <i data-lucide="bar-chart-3" class="w-12 h-12 mx-auto mb-4"></i>
                        <p>Gelişmiş grafik türü seçin ve "Göster" butonuna tıklayın.</p>
                    </div>
                    <div id="advancedChartDescription" class="text-sm text-gray-500 mb-4" style="display: none;"></div>
                    <canvas id="advancedChart" style="display: none;"></canvas>
                </div>
            </div>
        `;
        
        // Add section to dashboard
        const chartsGrid = document.querySelector('.charts-grid');
        if (chartsGrid) {
            chartsGrid.parentNode.insertBefore(section, chartsGrid.nextSibling);
            
            // Initialize advanced chart selector
            this.initAdvancedChartSelector();
        }
        
        // Initialize icons
        lucide.createIcons();
    }
    
    /**
     * Initialize advanced chart selector
     */
    initAdvancedChartSelector() {
        const selector = document.getElementById('advancedChartSelector');
        const loadBtn = document.getElementById('loadAdvancedChart');
        
        if (selector && loadBtn) {
            // Show chart description on selector change
            selector.addEventListener('change', () => {
                const chartType = selector.value;
                const description = document.getElementById('advancedChartDescription');
                
                if (description && this.enhancedChartTypes[chartType]) {
                    description.textContent = this.enhancedChartTypes[chartType].description;
                    description.style.display = 'block';
                }
            });
            
            // Trigger initial description update
            if (selector.value) {
                const chartType = selector.value;
                const description = document.getElementById('advancedChartDescription');
                
                if (description && this.enhancedChartTypes[chartType]) {
                    description.textContent = this.enhancedChartTypes[chartType].description;
                    description.style.display = 'block';
                }
            }
            
            // Load chart on button click
            loadBtn.addEventListener('click', () => {
                const chartType = selector.value;
                this.renderAdvancedChart(chartType);
            });
        }
    }
    
    /**
     * Render advanced chart based on type
     */
    async renderAdvancedChart(chartType) {
        const chartCanvas = document.getElementById('advancedChart');
        const placeholder = document.getElementById('advancedChartPlaceholder');
        const descriptionEl = document.getElementById('advancedChartDescription');
        
        if (!chartCanvas || !placeholder) return;
        
        // Show canvas and description, hide placeholder
        chartCanvas.style.display = 'block';
        placeholder.style.display = 'none';
        
        if (descriptionEl) {
            descriptionEl.style.display = 'block';
            if (this.enhancedChartTypes[chartType]) {
                descriptionEl.textContent = this.enhancedChartTypes[chartType].description;
            }
        }
        
        // Add loading state
        const chartWrapper = document.getElementById('advancedChartWrapper');
        if (chartWrapper) {
            const loadingEl = document.createElement('div');
            loadingEl.id = 'advancedChartLoading';
            loadingEl.className = 'text-center py-8 text-gray-400';
            loadingEl.innerHTML = `
                <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                <p>Grafik yükleniyor...</p>
            `;
            
            // Insert after description but before canvas
            if (descriptionEl) {
                descriptionEl.after(loadingEl);
            } else {
                chartCanvas.before(loadingEl);
            }
            
            // Initialize icon
            lucide.createIcons(loadingEl);
        }
        
        // Clear previous chart
        if (this.advancedCharts[chartType]) {
            this.advancedCharts[chartType].destroy();
        }
        
        try {
            // Fetch data
            const transactions = await dataManager.getTransactions();
            
            // Remove loading state
            const loadingEl = document.getElementById('advancedChartLoading');
            if (loadingEl) {
                loadingEl.remove();
            }
            
            // Render selected chart type
            switch (chartType) {
                case 'waterfall':
                    this.renderWaterfallChart(chartCanvas, transactions);
                    break;
                case 'sankey':
                    this.renderSankeyDiagram(chartCanvas, transactions);
                    break;
                case 'heatmap':
                    this.renderHeatmapChart(chartCanvas, transactions);
                    break;
                case 'radar':
                    this.renderRadarChart(chartCanvas, transactions);
                    break;
                case 'gantt':
                    this.renderGanttChart(chartCanvas);
                    break;
                default:
                    console.error('Unknown chart type:', chartType);
                    
                    // Show error message
                    const errorEl = document.createElement('div');
                    errorEl.className = 'text-center py-8 text-red-500';
                    errorEl.textContent = 'Bilinmeyen grafik türü: ' + chartType;
                    chartCanvas.before(errorEl);
            }
        } catch (error) {
            console.error('Error rendering advanced chart:', error);
            
            // Remove loading state
            const loadingEl = document.getElementById('advancedChartLoading');
            if (loadingEl) {
                loadingEl.remove();
            }
            
            // Show error message
            const errorEl = document.createElement('div');
            errorEl.className = 'text-center py-8 text-red-500';
            errorEl.textContent = 'Grafik yüklenirken bir hata oluştu: ' + error.message;
            chartCanvas.before(errorEl);
        }
    }
    
    /**
     * Render waterfall chart showing income/expense flow
     */
    async renderWaterfallChart(canvas, transactions) {
        // Group transactions by month
        const monthlyData = {};
        
        // Get last 6 months
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            monthlyData[monthKey] = {
                income: 0,
                expense: 0,
                net: 0,
                month: date.toLocaleDateString('tr-TR', { month: 'short' }),
                balance: 0
            };
        }
        
        // Calculate monthly income/expense
        transactions.forEach(t => {
            if (t.status !== 'actual') return;
            
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            if (monthlyData[monthKey]) {
                if (t.type === 'income') {
                    monthlyData[monthKey].income += t.amount || 0;
                } else {
                    monthlyData[monthKey].expense += t.amount || 0;
                }
            }
        });
        
        // Calculate net and running balance
        let runningBalance = 0;
        Object.keys(monthlyData).forEach(key => {
            const month = monthlyData[key];
            month.net = month.income - month.expense;
            runningBalance += month.net;
            month.balance = runningBalance;
        });
        
        // Prepare waterfall chart data
        const labels = Object.values(monthlyData).map(m => m.month);
        const netValues = Object.values(monthlyData).map(m => m.net);
        const incomeValues = Object.values(monthlyData).map(m => m.income);
        const expenseValues = Object.values(monthlyData).map(m => m.expense);
        
        // Create waterfall chart
        this.advancedCharts['waterfall'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Gelir',
                        data: incomeValues,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Gider',
                        data: expenseValues.map(v => -v), // Negative for expenses
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Net Bakiye',
                        data: Object.values(monthlyData).map(m => m.balance),
                        type: 'line',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Ay'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Tutar (₺)'
                        },
                        ticks: {
                            callback: (value) => {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Aylık Gelir/Gider Akış Grafiği',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                
                                if (context.datasetIndex === 0) {
                                    return `${label}: ${formatCurrency(value)}`;
                                } else if (context.datasetIndex === 1) {
                                    return `${label}: ${formatCurrency(-value)}`; // Convert back to positive
                                } else {
                                    return `${label}: ${formatCurrency(value)}`;
                                }
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    /**
     * Render sankey diagram showing money flow
     */
    async renderSankeyDiagram(canvas, transactions) {
        // Since Sankey diagrams aren't natively supported by Chart.js, we'll simulate one using a bar chart
        // Group transactions by category and account
        const categoryTotals = {};
        const accountTotals = {};
        const categoryToAccount = {};
        
        // Get last 3 months of transactions
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const recentTransactions = transactions.filter(t => {
            return t.status === 'actual' && new Date(t.date) >= threeMonthsAgo;
        });
        
        // Calculate totals
        recentTransactions.forEach(t => {
            const categoryId = t.categoryId || 'unknown';
            const accountId = t.accountId || 'unknown';
            
            // Initialize if not exists
            if (!categoryTotals[categoryId]) categoryTotals[categoryId] = 0;
            if (!accountTotals[accountId]) accountTotals[accountId] = 0;
            
            // Update totals
            if (t.type === 'expense') {
                categoryTotals[categoryId] += t.amount || 0;
                
                // Track category to account flow
                const key = `${categoryId}-${accountId}`;
                if (!categoryToAccount[key]) categoryToAccount[key] = 0;
                categoryToAccount[key] += t.amount || 0;
            } else {
                accountTotals[accountId] += t.amount || 0;
            }
        });
        
        // Get category and account names
        const categories = await dataManager.getCategories();
        const accounts = await dataManager.getAccounts() || [];
        
        // Map IDs to names
        const categoryNames = {};
        const accountNames = {};
        
        // Map category IDs to names
        for (const type in categories) {
            if (Array.isArray(categories[type])) {
                categories[type].forEach(category => {
                    categoryNames[category.id] = category.name;
                });
            }
        }
        
        // Map account IDs to names
        if (Array.isArray(accounts)) {
            accounts.forEach(account => {
                accountNames[account.id] = account.name;
            });
        }
        
        // Prepare data for the chart - top 5 categories and accounts
        const topCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, amount]) => ({
                id,
                name: categoryNames[id] || `Kategori #${id.substring(0, 4)}`,
                amount
            }));
            
        const topAccounts = Object.entries(accountTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, amount]) => ({
                id,
                name: accountNames[id] || `Hesap #${id.substring(0, 4)}`,
                amount
            }));
        
        // Create color scale
        const categoryColors = [
            'rgba(239, 68, 68, 0.7)',   // Red
            'rgba(245, 158, 11, 0.7)',  // Amber
            'rgba(249, 115, 22, 0.7)',  // Orange
            'rgba(217, 70, 239, 0.7)',  // Purple
            'rgba(236, 72, 153, 0.7)'   // Pink
        ];
        
        const accountColors = [
            'rgba(16, 185, 129, 0.7)',  // Emerald
            'rgba(59, 130, 246, 0.7)',  // Blue
            'rgba(6, 182, 212, 0.7)',   // Cyan
            'rgba(14, 165, 233, 0.7)',  // Sky
            'rgba(99, 102, 241, 0.7)'   // Indigo
        ];
        
        // Create fake Sankey diagram using stacked bar chart
        this.advancedCharts['sankey'] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Kategoriler', 'Hesaplar'],
                datasets: [
                    // Category bars (first column)
                    ...topCategories.map((category, index) => ({
                        label: category.name,
                        data: [category.amount, 0],
                        backgroundColor: categoryColors[index % categoryColors.length],
                        borderColor: categoryColors[index % categoryColors.length].replace('0.7', '1'),
                        borderWidth: 1,
                        stack: 'Categories'
                    })),
                    
                    // Account bars (second column)
                    ...topAccounts.map((account, index) => ({
                        label: account.name,
                        data: [0, account.amount],
                        backgroundColor: accountColors[index % accountColors.length],
                        borderColor: accountColors[index % accountColors.length].replace('0.7', '1'),
                        borderWidth: 1,
                        stack: 'Accounts'
                    }))
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            callback: (value) => {
                                return formatCurrency(value);
                            }
                        }
                    },
                    y: {
                        stacked: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Para Akış Diyagramı (Son 3 Ay)',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
        
        // Add explanation
        const chartWrapper = document.getElementById('advancedChartWrapper');
        if (chartWrapper) {
            const explanation = document.createElement('div');
            explanation.className = 'text-sm text-gray-500 mt-4 px-4';
            explanation.innerHTML = '<p>Bu grafik son 3 aydaki en yüksek tutarlı 5 kategori ve 5 hesap arasındaki para akışını gösterir.</p>';
            chartWrapper.appendChild(explanation);
        }
    }
    
    /**
     * Render heatmap showing category/time spending intensity
     */
    async renderHeatmapChart(canvas, transactions) {
        // Group transactions by month and category
        const heatmapData = {};
        const categoryIds = new Set();
        const monthLabels = [];
        
        // Get last 12 months
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const monthLabel = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
            
            monthLabels.push(monthLabel);
            heatmapData[monthKey] = {};
        }
        
        // Filter to expense transactions only
        const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.status === 'actual');
        
        // Group by month and category
        expenseTransactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const categoryId = t.categoryId || 'unknown';
            
            categoryIds.add(categoryId);
            
            if (heatmapData[monthKey]) {
                if (!heatmapData[monthKey][categoryId]) {
                    heatmapData[monthKey][categoryId] = 0;
                }
                heatmapData[monthKey][categoryId] += t.amount || 0;
            }
        });
        
        // Get category names
        const categories = await dataManager.getCategories();
        const categoryNames = {};
        
        // Map category IDs to names
        for (const type in categories) {
            if (Array.isArray(categories[type])) {
                categories[type].forEach(category => {
                    categoryNames[category.id] = category.name;
                });
            }
        }
        
        // Sort categories by total amount
        const sortedCategoryIds = [...categoryIds].sort((a, b) => {
            const totalA = Object.values(heatmapData).reduce((sum, month) => sum + (month[a] || 0), 0);
            const totalB = Object.values(heatmapData).reduce((sum, month) => sum + (month[b] || 0), 0);
            return totalB - totalA;
        });
        
        // Limit to top 10 categories
        const topCategories = sortedCategoryIds.slice(0, 10);
        
        // Create datasets for each category
        const datasets = topCategories.map((categoryId, index) => {
            const data = monthLabels.map((_, i) => {
                const monthKey = Object.keys(heatmapData)[i];
                return heatmapData[monthKey][categoryId] || 0;
            });
            
            return {
                label: categoryNames[categoryId] || `Kategori #${categoryId.substring(0, 4)}`,
                data,
                backgroundColor: getHeatmapColor(data, index),
                borderWidth: 1,
                borderColor: '#fff'
            };
        });
        
        // Create heatmap using matrix format
        this.advancedCharts['heatmap'] = new Chart(canvas, {
            type: 'matrix',
            data: {
                datasets: [{
                    label: 'Harcama Yoğunluğu',
                    data: topCategories.flatMap((categoryId, categoryIndex) => 
                        monthLabels.map((_, monthIndex) => {
                            const monthKey = Object.keys(heatmapData)[monthIndex];
                            const value = heatmapData[monthKey][categoryId] || 0;
                            
                            return {
                                x: monthIndex,
                                y: categoryIndex,
                                v: value
                            };
                        })
                    ),
                    backgroundColor(context) {
                        const value = context.dataset.data[context.dataIndex].v;
                        // Find max value for normalization
                        const maxValue = Math.max(...context.dataset.data.map(d => d.v));
                        
                        // Normalize to 0-1 range
                        const normalized = maxValue > 0 ? value / maxValue : 0;
                        
                        // Generate color from normalized value (red intensity)
                        return `rgba(239, 68, 68, ${Math.max(0.1, normalized)})`;
                    },
                    borderColor: '#fff',
                    borderWidth: 1,
                    width: ({chart}) => (chart.chartArea || {}).width / 12 - 1,
                    height: ({chart}) => (chart.chartArea || {}).height / topCategories.length - 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        labels: monthLabels,
                        offset: true,
                        ticks: {
                            align: 'center'
                        }
                    },
                    y: {
                        type: 'category',
                        labels: topCategories.map(id => categoryNames[id] || `Kategori #${id.substring(0, 4)}`),
                        offset: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Kategori/Zaman Harcama Yoğunluğu',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const dataIndex = context[0].dataIndex;
                                const data = context[0].dataset.data[dataIndex];
                                const categoryId = topCategories[data.y];
                                const categoryName = categoryNames[categoryId] || `Kategori #${categoryId.substring(0, 4)}`;
                                const monthLabel = monthLabels[data.x];
                                
                                return `${categoryName} - ${monthLabel}`;
                            },
                            label: function(context) {
                                const value = context.dataset.data[context.dataIndex].v;
                                return `Harcama: ${formatCurrency(value)}`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Add color legend
        const chartWrapper = document.getElementById('advancedChartWrapper');
        if (chartWrapper) {
            const legend = document.createElement('div');
            legend.className = 'flex justify-center items-center mt-4 space-x-2';
            legend.innerHTML = `
                <span class="text-xs text-gray-500">Düşük</span>
                <div class="w-24 h-4 bg-gradient-to-r from-red-100 to-red-500 rounded"></div>
                <span class="text-xs text-gray-500">Yüksek</span>
            `;
            
            chartWrapper.appendChild(legend);
        }
        
        // Helper function for heatmap coloring
        function getHeatmapColor(data, categoryIndex) {
            // Find max value for this category
            const maxValue = Math.max(...data);
            
            // Return a function that generates colors based on value
            return (ctx) => {
                const value = data[ctx.dataIndex];
                const normalized = maxValue > 0 ? value / maxValue : 0;
                
                // Generate color (red with varying opacity)
                return `rgba(239, 68, 68, ${Math.max(0.1, normalized)})`;
            };
        }
    }
    
    /**
     * Render radar chart for multi-dimensional category analysis
     */
    async renderRadarChart(canvas, transactions) {
        // Get last 3 months of transactions
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const recentTransactions = transactions.filter(t => {
            return t.status === 'actual' && new Date(t.date) >= threeMonthsAgo;
        });
        
        // Group by category and month
        const categoryMonthly = {};
        
        // Get months for the last 3 months
        const months = [];
        for (let i = 2; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const monthLabel = date.toLocaleDateString('tr-TR', { month: 'long' });
            
            months.push({ key: monthKey, label: monthLabel });
        }
        
        // Calculate category totals by month
        recentTransactions.forEach(t => {
            if (t.type !== 'expense') return;
            
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const categoryId = t.categoryId || 'unknown';
            
            if (!categoryMonthly[categoryId]) {
                categoryMonthly[categoryId] = {};
                months.forEach(month => {
                    categoryMonthly[categoryId][month.key] = 0;
                });
            }
            
            if (categoryMonthly[categoryId][monthKey] !== undefined) {
                categoryMonthly[categoryId][monthKey] += t.amount || 0;
            }
        });
        
        // Get category names
        const categories = await dataManager.getCategories();
        const categoryNames = {};
        
        // Map category IDs to names
        for (const type in categories) {
            if (Array.isArray(categories[type])) {
                categories[type].forEach(category => {
                    categoryNames[category.id] = category.name;
                });
            }
        }
        
        // Find top 6 categories by total amount
        const topCategories = Object.entries(categoryMonthly)
            .map(([id, monthData]) => ({
                id,
                name: categoryNames[id] || `Kategori #${id.substring(0, 4)}`,
                total: Object.values(monthData).reduce((sum, amount) => sum + amount, 0)
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);
            
        // Create dataset for each month
        const datasets = months.map((month, index) => {
            const colors = [
                { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.8)' },
                { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.8)' },
                { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.8)' }
            ];
            
            return {
                label: month.label,
                data: topCategories.map(category => categoryMonthly[category.id][month.key]),
                backgroundColor: colors[index].bg,
                borderColor: colors[index].border,
                borderWidth: 2,
                pointBackgroundColor: colors[index].border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors[index].border,
                pointRadius: 4
            };
        });
        
        // Create radar chart
        this.advancedCharts['radar'] = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: topCategories.map(c => c.name),
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        ticks: {
                            callback: value => formatCurrency(value),
                            backdropColor: 'rgba(255, 255, 255, 0.75)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Kategori Analizi (Son 3 Ay)',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    /**
     * Render gantt chart for budget plan timeline
     */
    async renderGanttChart(canvas) {
        // Fetch budget data
        const budgets = await dataManager.getBudgets() || [];
        
        if (!Array.isArray(budgets) || budgets.length === 0) {
            // Show no data message
            const chartWrapper = document.getElementById('advancedChartWrapper');
            if (chartWrapper) {
                const noData = document.createElement('div');
                noData.className = 'text-center py-20 text-gray-400';
                noData.innerHTML = `
                    <i data-lucide="calendar" class="w-12 h-12 mx-auto mb-4"></i>
                    <p>Gantt grafiği için bütçe planı verisi bulunamadı.</p>
                    <button id="createBudgetPlanBtn" class="mt-4 btn btn-sm btn-primary">
                        <i data-lucide="plus" class="w-3 h-3 mr-1"></i>
                        <span>Bütçe Planı Oluştur</span>
                    </button>
                `;
                
                // Replace canvas with no data message
                canvas.style.display = 'none';
                chartWrapper.appendChild(noData);
                
                // Initialize icons
                lucide.createIcons();
                
                // Add event listener for create button
                document.getElementById('createBudgetPlanBtn')?.addEventListener('click', () => {
                    // Switch to budget planning tab
                    document.getElementById('reportsTab')?.click();
                    
                    // Open budget plan modal after a short delay
                    setTimeout(() => {
                        document.getElementById('addBudgetPlan')?.click();
                    }, 500);
                });
                
                return;
            }
        }
        
        // Filter to future budgets
        const today = new Date();
        const futureBudgets = budgets.filter(budget => {
            const budgetDate = new Date(budget.year, budget.month ? budget.month - 1 : 0, 1);
            return budgetDate >= today;
        });
        
        // Get category names
        const categories = await dataManager.getCategories();
        const categoryNames = {};
        
        // Map category IDs to names
        for (const type in categories) {
            if (Array.isArray(categories[type])) {
                categories[type].forEach(category => {
                    categoryNames[category.id] = category.name;
                    
                    // Also map subcategories
                    if (category.subcategories && Array.isArray(category.subcategories)) {
                        category.subcategories.forEach(subcategory => {
                            categoryNames[subcategory.id] = `${category.name} > ${subcategory.name}`;
                        });
                    }
                });
            }
        }
        
        // Sort budgets by date
        const sortedBudgets = [...futureBudgets].sort((a, b) => {
            const dateA = new Date(a.year, a.month ? a.month - 1 : 0, 1);
            const dateB = new Date(b.year, b.month ? b.month - 1 : 0, 1);
            return dateA - dateB;
        });
        
        // Limit to next 12 budgets
        const limitedBudgets = sortedBudgets.slice(0, 12);
        
        // Group by category
        const categoryBudgets = {};
        limitedBudgets.forEach(budget => {
            const categoryId = budget.subcategoryId || budget.categoryId;
            const key = categoryId;
            
            if (!categoryBudgets[key]) {
                categoryBudgets[key] = [];
            }
            
            categoryBudgets[key].push(budget);
        });
        
        // Create datasets for each category
        const datasets = Object.entries(categoryBudgets).map(([categoryId, budgets], index) => {
            const colors = [
                'rgba(59, 130, 246, 0.7)',  // Blue
                'rgba(16, 185, 129, 0.7)',  // Emerald
                'rgba(245, 158, 11, 0.7)',  // Amber
                'rgba(239, 68, 68, 0.7)',   // Red
                'rgba(139, 92, 246, 0.7)',  // Violet
                'rgba(236, 72, 153, 0.7)',  // Pink
                'rgba(6, 182, 212, 0.7)',   // Cyan
            ];
            
            return {
                label: categoryNames[categoryId] || `Kategori #${categoryId.substring(0, 4)}`,
                data: budgets.map(budget => {
                    const startDate = new Date(budget.year, budget.month ? budget.month - 1 : 0, 1);
                    const endDate = budget.month 
                        ? new Date(budget.year, budget.month, 0) 
                        : new Date(budget.year, 11, 31);
                    
                    // Calculate duration in days
                    const duration = (endDate - startDate) / (1000 * 60 * 60 * 24);
                    
                    return {
                        x: [startDate, endDate],
                        y: categoryNames[categoryId] || `Kategori #${categoryId.substring(0, 4)}`,
                        plannedAmount: budget.plannedAmount
                    };
                }),
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.7', '1'),
                borderWidth: 1
            };
        });
        
        // Create gantt chart using bar chart with date scale
        this.advancedCharts['gantt'] = new Chart(canvas, {
            type: 'bar',
            data: {
                datasets: datasets.flatMap(dataset => 
                    dataset.data.map((item, i) => ({
                        label: dataset.label,
                        data: [{
                            x: item.x,
                            y: item.y,
                            plannedAmount: item.plannedAmount
                        }],
                        backgroundColor: dataset.backgroundColor,
                        borderColor: dataset.borderColor,
                        borderWidth: dataset.borderWidth,
                        barPercentage: 0.8,
                        categoryPercentage: 0.9
                    }))
                )
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM yyyy'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Zaman'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Kategori'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Bütçe Planı Timeline',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const data = context.raw;
                                const start = new Date(data.x[0]).toLocaleDateString('tr-TR');
                                const end = new Date(data.x[1]).toLocaleDateString('tr-TR');
                                const amount = formatCurrency(data.plannedAmount);
                                
                                return [
                                    `${context.dataset.label}`,
                                    `Tutar: ${amount}`,
                                    `Başlangıç: ${start}`,
                                    `Bitiş: ${end}`
                                ];
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    /**
     * Handle chart type switch
     */
    handleChartTypeSwitch(switchButton) {
        // Get chart type and target
        const chartType = switchButton.dataset.chartType;
        const targetChart = switchButton.dataset.target;
        
        if (!chartType || !targetChart) return;
        
        // Update active state
        const chartTypeControls = switchButton.closest('.chart-type-switch');
        if (chartTypeControls) {
            const buttons = chartTypeControls.querySelectorAll('button');
            buttons.forEach(btn => btn.classList.remove('active'));
            switchButton.classList.add('active');
        }
        
        // Store chart type preference
        this.chartOptions.chartType[targetChart] = chartType;
        
        // Trigger chart update
        this.updateChartType(targetChart, chartType);
    }
    
    /**
     * Handle time range selection
     */
    handleTimeRangeSelection(element) {
        const rangeValue = element.value || element.dataset.range;
        if (!rangeValue) return;
        
        // Calculate date range
        const end = new Date();
        let start;
        
        switch (rangeValue) {
            case '3m':
                start = new Date();
                start.setMonth(start.getMonth() - 3);
                break;
            case '6m':
                start = new Date();
                start.setMonth(start.getMonth() - 6);
                break;
            case '1y':
                start = new Date();
                start.setFullYear(start.getFullYear() - 1);
                break;
            case 'all':
                start = null;
                break;
            default:
                // Try to parse as date string
                start = new Date(rangeValue);
                if (isNaN(start.getTime())) {
                    start = new Date();
                    start.setMonth(start.getMonth() - 6);
                }
        }
        
        // Store time range
        this.chartOptions.timeRange = {
            start: start ? start.toISOString().split('T')[0] : null,
            end: end.toISOString().split('T')[0]
        };
        
        // Update chart with new time range
        if (typeof chartManager !== 'undefined' && chartManager.updateCharts) {
            chartManager.updateCharts(this.chartOptions.timeRange);
        }
    }
    
    /**
     * Handle drill down
     */
    handleDrillDown(element) {
        const chartId = element.dataset.chart;
        const category = element.dataset.category;
        const date = element.dataset.date;
        
        if (!chartId) return;
        
        // Store drill down data
        this.drillDownData = { chartId, category, date };
        
        // Create drill down view
        this.showDrillDownView(chartId, category, date);
    }
    
    /**
     * Toggle comparison mode
     */
    toggleComparisonMode(element) {
        const targetChart = element.dataset.target;
        if (!targetChart) return;
        
        // Toggle state
        this.chartOptions.comparisonMode = !this.chartOptions.comparisonMode;
        
        // Update button state
        element.classList.toggle('active', this.chartOptions.comparisonMode);
        
        // Update chart with comparison mode
        this.updateComparisonMode(targetChart, this.chartOptions.comparisonMode);
    }
    
    /**
     * Add annotation to chart
     */
    addAnnotation(chartContainer) {
        if (!chartContainer) return;
        
        // Create annotation form modal
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal">
                <div class="modal-header">
                    <h3>Not Ekle</h3>
                    <button class="modal-close" onclick="document.getElementById('modalContainer').innerHTML = ''">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="annotationForm">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                            <input type="date" id="annotationDate" class="w-full p-2 border border-gray-300 rounded-lg" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Not</label>
                            <textarea id="annotationText" class="w-full p-2 border border-gray-300 rounded-lg" rows="3" required></textarea>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                            <select id="annotationColor" class="w-full p-2 border border-gray-300 rounded-lg">
                                <option value="rgba(59, 130, 246, 0.7)">Mavi</option>
                                <option value="rgba(16, 185, 129, 0.7)">Yeşil</option>
                                <option value="rgba(245, 158, 11, 0.7)">Turuncu</option>
                                <option value="rgba(239, 68, 68, 0.7)">Kırmızı</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('modalContainer').innerHTML = ''">İptal</button>
                    <button id="saveAnnotation" class="btn btn-primary">Kaydet</button>
                </div>
            </div>
        `;
        
        // Initialize icons
        lucide.createIcons();
        
        // Set default date to today
        document.getElementById('annotationDate').valueAsDate = new Date();
        
        // Handle save
        document.getElementById('saveAnnotation')?.addEventListener('click', () => {
            const date = document.getElementById('annotationDate').value;
            const text = document.getElementById('annotationText').value;
            const color = document.getElementById('annotationColor').value;
            
            if (!date || !text) return;
            
            // Add annotation
            this.chartOptions.annotations.push({
                date,
                text,
                color
            });
            
            // Close modal
            document.getElementById('modalContainer').innerHTML = '';
            
            // Update charts with new annotation
            if (typeof chartManager !== 'undefined' && chartManager.updateCharts) {
                chartManager.updateCharts();
            }
        });
    }
    
    /**
     * Update chart type
     */
    updateChartType(chartId, chartType) {
        if (typeof chartManager !== 'undefined' && chartManager.updateChartType) {
            chartManager.updateChartType(chartId, chartType);
        }
    }
    
    /**
     * Update comparison mode
     */
    updateComparisonMode(chartId, enabled) {
        if (typeof chartManager !== 'undefined' && chartManager.updateComparisonMode) {
            chartManager.updateComparisonMode(chartId, enabled);
        }
    }
    
    /**
     * Show drill down view
     */
    showDrillDownView(chartId, category, date) {
        // Create drill down modal
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>Detaylı Analiz</h3>
                    <button class="modal-close" onclick="document.getElementById('modalContainer').innerHTML = ''">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="drill-down-info mb-4">
                        ${category ? `<span class="badge bg-blue-100 text-blue-800 mr-2">Kategori: ${category}</span>` : ''}
                        ${date ? `<span class="badge bg-green-100 text-green-800">Tarih: ${date}</span>` : ''}
                    </div>
                    
                    <div class="drill-down-chart-container h-64 mb-4">
                        <canvas id="drillDownChart"></canvas>
                    </div>
                    
                    <div class="drill-down-table">
                        <div class="text-center py-10 text-gray-400" id="drillDownLoading">
                            <i data-lucide="loader" class="w-8 h-8 mx-auto mb-2 animate-spin"></i>
                            <p>Veriler yükleniyor...</p>
                        </div>
                        <div id="drillDownData"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML = ''">Kapat</button>
                </div>
            </div>
        `;
        
        // Initialize icons
        lucide.createIcons();
        
        // Load drill down data
        this.loadDrillDownData(chartId, category, date);
    }
    
    /**
     * Load drill down data
     */
    async loadDrillDownData(chartId, category, date) {
        try {
            // Get transactions filtered by category and/or date
            const filters = {};
            
            if (category) {
                // First check if category is a category ID
                const categories = await dataManager.getCategories();
                let categoryId = null;
                
                // Search for category by name or ID
                for (const type in categories) {
                    if (Array.isArray(categories[type])) {
                        const match = categories[type].find(c => 
                            c.id === category || c.name === category
                        );
                        
                        if (match) {
                            categoryId = match.id;
                            break;
                        }
                    }
                }
                
                if (categoryId) {
                    filters.categoryId = categoryId;
                }
            }
            
            if (date) {
                // Check if date is a month name
                const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                               'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                               
                const monthIndex = months.findIndex(m => date.includes(m));
                
                if (monthIndex >= 0) {
                    // Extract year from date string
                    const yearMatch = date.match(/\d{4}/);
                    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
                    
                    // Set date range for the month
                    const startDate = new Date(year, monthIndex, 1);
                    const endDate = new Date(year, monthIndex + 1, 0);
                    
                    filters.startDate = startDate.toISOString().split('T')[0];
                    filters.endDate = endDate.toISOString().split('T')[0];
                } else {
                    // Try to parse as date
                    const parsedDate = new Date(date);
                    if (!isNaN(parsedDate.getTime())) {
                        filters.startDate = parsedDate.toISOString().split('T')[0];
                        filters.endDate = parsedDate.toISOString().split('T')[0];
                    }
                }
            }
            
            // Get transactions
            const transactions = await dataManager.getTransactions(filters);
            
            // Render drill down chart
            this.renderDrillDownChart(transactions);
            
            // Render drill down table
            this.renderDrillDownTable(transactions);
            
        } catch (error) {
            console.error('Error loading drill down data:', error);
            
            // Show error message
            const dataContainer = document.getElementById('drillDownData');
            if (dataContainer) {
                dataContainer.innerHTML = `
                    <div class="text-center py-4 text-red-500">
                        <p>Veri yüklenirken bir hata oluştu.</p>
                    </div>
                `;
            }
        } finally {
            // Hide loading indicator
            const loading = document.getElementById('drillDownLoading');
            if (loading) {
                loading.style.display = 'none';
            }
        }
    }
    
    /**
     * Render drill down chart
     */
    renderDrillDownChart(transactions) {
        const chartCanvas = document.getElementById('drillDownChart');
        if (!chartCanvas) return;
        
        // Group transactions by subcategory or date
        const groupedData = {};
        const groupBy = this.drillDownData?.category ? 'date' : 'category';
        
        transactions.forEach(transaction => {
            let key;
            
            if (groupBy === 'date') {
                // Group by week
                const date = new Date(transaction.date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else {
                // Group by category
                key = transaction.categoryId || 'unknown';
            }
            
            if (!groupedData[key]) {
                groupedData[key] = {
                    income: 0,
                    expense: 0
                };
            }
            
            if (transaction.type === 'income') {
                groupedData[key].income += transaction.amount || 0;
            } else {
                groupedData[key].expense += transaction.amount || 0;
            }
        });
        
        // Prepare chart data
        const labels = [];
        const incomeData = [];
        const expenseData = [];
        
        if (groupBy === 'date') {
            // Sort by date
            const sortedKeys = Object.keys(groupedData).sort();
            
            sortedKeys.forEach(key => {
                const date = new Date(key);
                labels.push(date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }));
                incomeData.push(groupedData[key].income);
                expenseData.push(groupedData[key].expense);
            });
        } else {
            // Sort by expense amount
            const sortedEntries = Object.entries(groupedData)
                .sort((a, b) => b[1].expense - a[1].expense);
                
            // Get category names
            const getNames = async () => {
                const categories = await dataManager.getCategories();
                const categoryNames = {};
                
                // Map category IDs to names
                for (const type in categories) {
                    if (Array.isArray(categories[type])) {
                        categories[type].forEach(category => {
                            categoryNames[category.id] = category.name;
                        });
                    }
                }
                
                // Update labels with category names
                sortedEntries.forEach(([key, data], index) => {
                    if (index < 10) { // Limit to top 10
                        labels.push(categoryNames[key] || `Kategori #${key.substring(0, 4)}`);
                        incomeData.push(data.income);
                        expenseData.push(data.expense);
                    }
                });
                
                // Create chart
                createChart();
            };
            
            getNames();
            return;
        }
        
        // Create chart
        function createChart() {
            // Create chart
            const chart = new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Gelir',
                            data: incomeData,
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Gider',
                            data: expenseData,
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: groupBy === 'date' ? 'Haftalık Gelir/Gider' : 'Kategori Dağılımı',
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw;
                                    return `${label}: ${formatCurrency(value)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        if (groupBy === 'date') {
            createChart();
        }
    }
    
    /**
     * Render drill down table
     */
    renderDrillDownTable(transactions) {
        const dataContainer = document.getElementById('drillDownData');
        if (!dataContainer) return;
        
        if (transactions.length === 0) {
            dataContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p>Seçilen filtrelere uygun işlem bulunamadı.</p>
                </div>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // Build table HTML
        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                            <th class="py-3 px-4 text-left">Tarih</th>
                            <th class="py-3 px-4 text-left">Açıklama</th>
                            <th class="py-3 px-4 text-left">Kategori</th>
                            <th class="py-3 px-4 text-right">Tutar</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Get category names (async)
        const loadCategoryNames = async () => {
            const categories = await dataManager.getCategories();
            const categoryNames = {};
            
            // Map category IDs to names
            for (const type in categories) {
                if (Array.isArray(categories[type])) {
                    categories[type].forEach(category => {
                        categoryNames[category.id] = category.name;
                    });
                }
            }
            
            // Continue building table rows
            sortedTransactions.forEach(transaction => {
                const date = new Date(transaction.date).toLocaleDateString('tr-TR');
                const description = transaction.description || '-';
                const categoryName = categoryNames[transaction.categoryId] || '-';
                const amount = formatCurrency(transaction.amount || 0);
                const amountClass = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
                
                tableHTML += `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-4 text-left whitespace-nowrap">${date}</td>
                        <td class="py-3 px-4 text-left">${escapeHtml(description)}</td>
                        <td class="py-3 px-4 text-left">${escapeHtml(categoryName)}</td>
                        <td class="py-3 px-4 text-right ${amountClass} font-medium">${amount}</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
            </div>
            `;
            
            // Add summary
            const totalIncome = sortedTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const totalExpense = sortedTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const netAmount = totalIncome - totalExpense;
            const netClass = netAmount >= 0 ? 'text-green-600' : 'text-red-600';
            
            tableHTML += `
                <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-sm text-gray-600">Toplam İşlem:</span>
                            <span class="font-medium ml-2">${sortedTransactions.length}</span>
                        </div>
                        <div>
                            <span class="text-sm text-gray-600">Toplam Gelir:</span>
                            <span class="font-medium text-green-600 ml-2">${formatCurrency(totalIncome)}</span>
                        </div>
                        <div>
                            <span class="text-sm text-gray-600">Toplam Gider:</span>
                            <span class="font-medium text-red-600 ml-2">${formatCurrency(totalExpense)}</span>
                        </div>
                        <div>
                            <span class="text-sm text-gray-600">Net:</span>
                            <span class="font-medium ${netClass} ml-2">${formatCurrency(netAmount)}</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Update container
            dataContainer.innerHTML = tableHTML;
        };
        
        // Load category names and build table
        loadCategoryNames();
    }
    
    /**
     * Update all charts
     */
    async update() {
        // Refresh chart controls
        this.setupChartControls();
        
        // Update existing chart options if needed
        if (typeof chartManager !== 'undefined' && chartManager.updateCharts) {
            chartManager.updateCharts(this.chartOptions.timeRange);
        }
        
        // Update active advanced chart if any
        const advancedChartSelector = document.getElementById('advancedChartSelector');
        if (advancedChartSelector && advancedChartSelector.value) {
            this.renderAdvancedChart(advancedChartSelector.value);
        }
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Destroy advanced charts
        Object.values(this.advancedCharts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.advancedCharts = {};
    }
}

// Helper functions
function formatCurrency(value) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value || 0);
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Create instance
const interactiveCharts = new InteractiveCharts();