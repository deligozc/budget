// js/components/executiveSummaryDashboard.js - Yönetici Özet Dashboard Bileşeni

class ExecutiveSummaryDashboard {
    constructor(dataManager, chartManager) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.containerId = 'executiveSummaryContainer';
        this.container = null;
        this.charts = {};
        this.timeRange = 'monthly'; // monthly, quarterly, yearly
        this.isInitialized = false;
        this.alertTypes = {
            critical: { icon: 'alert-triangle', color: '#EF4444', bgColor: '#FEF2F2' },
            warning: { icon: 'alert-circle', color: '#F59E0B', bgColor: '#FFFBEB' },
            info: { icon: 'info', color: '#3B82F6', bgColor: '#EFF6FF' },
            success: { icon: 'check-circle', color: '#10B981', bgColor: '#ECFDF5' }
        };
    }

    /**
     * Initialize the Executive Summary Dashboard
     */
    async initialize() {
        console.log('Executive Summary Dashboard başlatılıyor...');

        // Create container if it doesn't exist
        this.createContainer();
        
        // Load initial data
        await this.loadData();
        
        // Create dashboard sections
        await this.createDashboard();
        
        // Initialize charts
        await this.initializeCharts();
        
        // Create event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('Executive Summary Dashboard başarıyla başlatıldı');
    }

    /**
     * Create container for the dashboard
     */
    createContainer() {
        // Check if container already exists
        const existingContainer = document.getElementById(this.containerId);
        if (existingContainer) {
            this.container = existingContainer;
            return;
        }

        // Create container
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'executive-summary-dashboard mb-8';
        
        // Find where to insert the container
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            // Insert after the dashboard controls
            const dashboardControls = dashboardContent.querySelector('.dashboard-controls');
            if (dashboardControls) {
                dashboardControls.after(this.container);
            } else {
                dashboardContent.prepend(this.container);
            }
        }
    }

    /**
     * Load data for the dashboard
     */
    async loadData() {
        try {
            // Load summary statistics
            this.summaryStats = await this.dataManager.getSummaryStats();
            
            // Load transactions
            this.transactions = await this.dataManager.getTransactions();
            
            // Calculate trends
            this.trends = await this.calculateTrends();
            
            // Generate critical alerts
            this.alerts = await this.generateAlerts();
            
        } catch (error) {
            console.error('Executive Summary Dashboard veri yükleme hatası:', error);
        }
    }

    /**
     * Create dashboard layout
     */
    async createDashboard() {
        // Create dashboard sections
        const dashboardHtml = `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Yönetici Özet Panosu</h3>
                    <div class="flex space-x-2">
                        <select id="executiveSummaryTimeRange" class="p-2 border border-gray-300 rounded-lg text-sm">
                            <option value="monthly">Aylık</option>
                            <option value="quarterly">Çeyreklik</option>
                            <option value="yearly">Yıllık</option>
                        </select>
                        <button id="refreshExecutiveSummary" class="btn btn-secondary text-sm">
                            <i data-lucide="refresh-cw" style="width: 0.875rem; height: 0.875rem;"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>
                
                <!-- Executive KPIs -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div id="topLevelKPI1" class="executive-kpi-card"></div>
                    <div id="topLevelKPI2" class="executive-kpi-card"></div>
                    <div id="topLevelKPI3" class="executive-kpi-card"></div>
                    <div id="topLevelKPI4" class="executive-kpi-card"></div>
                </div>
                
                <!-- Trend Summaries -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">Gelir/Gider Trendi</h3>
                            <div class="chart-actions">
                                <button class="chart-filter active" data-chart="incomeExpenseTrend" data-view="line">Çizgi</button>
                                <button class="chart-filter" data-chart="incomeExpenseTrend" data-view="bar">Çubuk</button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="incomeExpenseTrendChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">Kategori Dağılım Trendi</h3>
                            <div class="chart-actions">
                                <button class="chart-filter active" data-chart="categoryTrend" data-type="expense">Gider</button>
                                <button class="chart-filter" data-chart="categoryTrend" data-type="income">Gelir</button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="categoryTrendChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Critical Alerts -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Kritik Uyarılar</h3>
                        <div class="chart-actions">
                            <span id="alertsCount" class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">0</span>
                        </div>
                    </div>
                    <div id="criticalAlertsContainer" class="p-4 space-y-3">
                        <!-- Alerts will be added dynamically -->
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = dashboardHtml;
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(this.container);
        }
        
        // Render KPI cards
        this.renderKPICards();
        
        // Render critical alerts
        this.renderCriticalAlerts();
    }

    /**
     * Render KPI cards
     */
    renderKPICards() {
        try {
            // Get the current time range for filtering
            const timeRangeFilter = this.getTimeRangeFilter();
            
            // Calculate KPI values based on time range
            const kpiData = this.calculateKPIData(timeRangeFilter);
            
            // Define KPI cards structure
            const kpiCards = [
                {
                    id: 'topLevelKPI1',
                    title: 'Net Bütçe Durumu',
                    value: kpiData.netBudget,
                    previousValue: kpiData.previousNetBudget,
                    format: 'currency',
                    icon: 'wallet',
                    color: kpiData.netBudget >= 0 ? 'success' : 'danger'
                },
                {
                    id: 'topLevelKPI2',
                    title: 'Tasarruf Oranı',
                    value: kpiData.savingsRate,
                    previousValue: kpiData.previousSavingsRate,
                    format: 'percent',
                    icon: 'piggy-bank',
                    color: kpiData.savingsRate >= 0.1 ? 'success' : kpiData.savingsRate >= 0.05 ? 'warning' : 'danger'
                },
                {
                    id: 'topLevelKPI3',
                    title: 'En Büyük Gider Kategorisi',
                    value: kpiData.topExpenseCategory.amount,
                    subtext: kpiData.topExpenseCategory.name,
                    previousValue: kpiData.topExpenseCategory.previousAmount,
                    format: 'currency',
                    icon: 'shopping-cart',
                    color: 'info'
                },
                {
                    id: 'topLevelKPI4',
                    title: 'Bekleyen Ödeme Sayısı',
                    value: kpiData.pendingPayments,
                    previousValue: kpiData.previousPendingPayments,
                    format: 'number',
                    icon: 'clock',
                    color: kpiData.pendingPayments > 3 ? 'danger' : kpiData.pendingPayments > 0 ? 'warning' : 'success'
                }
            ];
            
            // Render each KPI card
            kpiCards.forEach(card => {
                const cardElement = document.getElementById(card.id);
                if (!cardElement) return;
                
                // Calculate percent change
                const percentChange = card.previousValue ? 
                    ((card.value - card.previousValue) / Math.abs(card.previousValue)) * 100 : 0;
                
                // Format values
                const formattedValue = this.formatValue(card.value, card.format);
                const trendIcon = percentChange > 0 ? 'trending-up' : percentChange < 0 ? 'trending-down' : 'minus';
                const trendClass = card.id === 'topLevelKPI1' || card.id === 'topLevelKPI2' ? 
                    (percentChange > 0 ? 'text-green-600' : percentChange < 0 ? 'text-red-600' : 'text-gray-500') : 
                    (percentChange > 0 ? 'text-red-600' : percentChange < 0 ? 'text-green-600' : 'text-gray-500');
                
                // Generate card HTML
                cardElement.innerHTML = `
                    <div class="p-4 bg-white rounded-lg shadow border border-gray-100 h-full">
                        <div class="flex justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-500">${card.title}</p>
                                <p class="text-2xl font-bold mt-1 ${card.color === 'success' ? 'text-green-600' : 
                                    card.color === 'danger' ? 'text-red-600' : 
                                    card.color === 'warning' ? 'text-amber-500' : 'text-blue-600'}">${formattedValue}</p>
                                ${card.subtext ? `<p class="text-sm text-gray-500">${card.subtext}</p>` : ''}
                            </div>
                            <div class="w-10 h-10 rounded-full flex items-center justify-center ${
                                card.color === 'success' ? 'bg-green-100 text-green-600' : 
                                card.color === 'danger' ? 'bg-red-100 text-red-600' : 
                                card.color === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                            }">
                                <i data-lucide="${card.icon}" class="w-5 h-5"></i>
                            </div>
                        </div>
                        <div class="mt-3 flex items-center text-xs">
                            <span class="${trendClass} flex items-center">
                                <i data-lucide="${trendIcon}" class="w-3 h-3 mr-1"></i>
                                ${Math.abs(percentChange).toFixed(1)}%
                            </span>
                            <span class="text-gray-500 ml-1">
                                ${this.getComparisonPeriodText()}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
        } catch (error) {
            console.error('KPI kartları render hatası:', error);
        }
    }

    /**
     * Calculate KPI data based on time range
     */
    calculateKPIData(timeRangeFilter) {
        try {
            // Filter transactions by time range
            const currentTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.startDate && date <= timeRangeFilter.endDate;
            });
            
            // Filter transactions for previous period
            const previousTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.previousStartDate && date <= timeRangeFilter.previousEndDate;
            });
            
            // Calculate current period metrics
            const totalIncome = currentTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const totalExpense = currentTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const netBudget = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 ? (netBudget / totalIncome) : 0;
            
            // Calculate previous period metrics
            const prevTotalIncome = previousTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const prevTotalExpense = previousTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const previousNetBudget = prevTotalIncome - prevTotalExpense;
            const previousSavingsRate = prevTotalIncome > 0 ? (previousNetBudget / prevTotalIncome) : 0;
            
            // Find top expense category
            const expensesByCategory = {};
            const prevExpensesByCategory = {};
            
            // Current period expense categories
            currentTransactions
                .filter(t => t.type === 'expense')
                .forEach(transaction => {
                    const categoryId = transaction.categoryId;
                    if (!expensesByCategory[categoryId]) {
                        expensesByCategory[categoryId] = {
                            id: categoryId,
                            amount: 0,
                            name: ''
                        };
                    }
                    expensesByCategory[categoryId].amount += (transaction.amount || 0);
                });
                
            // Previous period expense categories
            previousTransactions
                .filter(t => t.type === 'expense')
                .forEach(transaction => {
                    const categoryId = transaction.categoryId;
                    if (!prevExpensesByCategory[categoryId]) {
                        prevExpensesByCategory[categoryId] = {
                            id: categoryId,
                            amount: 0
                        };
                    }
                    prevExpensesByCategory[categoryId].amount += (transaction.amount || 0);
                });
                
            // Find top category
            let topExpenseCategory = { id: null, amount: 0, name: 'Veri Yok', previousAmount: 0 };
            
            for (const categoryId in expensesByCategory) {
                if (expensesByCategory[categoryId].amount > topExpenseCategory.amount) {
                    topExpenseCategory = expensesByCategory[categoryId];
                }
            }
            
            // Get category name and previous amount
            if (topExpenseCategory.id) {
                // Get category name
                const category = this.getCategoryById(topExpenseCategory.id);
                if (category) {
                    topExpenseCategory.name = category.name;
                }
                
                // Get previous amount
                if (prevExpensesByCategory[topExpenseCategory.id]) {
                    topExpenseCategory.previousAmount = prevExpensesByCategory[topExpenseCategory.id].amount;
                }
            }
            
            // Calculate pending payments
            const pendingPayments = currentTransactions
                .filter(t => t.type === 'expense' && t.status === 'planned')
                .length;
                
            const previousPendingPayments = previousTransactions
                .filter(t => t.type === 'expense' && t.status === 'planned')
                .length;
            
            return {
                netBudget,
                previousNetBudget,
                savingsRate,
                previousSavingsRate,
                topExpenseCategory,
                pendingPayments,
                previousPendingPayments
            };
            
        } catch (error) {
            console.error('KPI veri hesaplama hatası:', error);
            return {
                netBudget: 0,
                previousNetBudget: 0,
                savingsRate: 0,
                previousSavingsRate: 0,
                topExpenseCategory: { name: 'Veri Yok', amount: 0, previousAmount: 0 },
                pendingPayments: 0,
                previousPendingPayments: 0
            };
        }
    }

    /**
     * Get category by id
     */
    getCategoryById(categoryId) {
        try {
            const categories = this.dataManager.getCategories();
            
            // Loop through category types
            for (const type in categories) {
                const categoryList = categories[type];
                const category = categoryList.find(c => c.id === categoryId);
                if (category) return category;
            }
            
            return null;
        } catch (error) {
            console.error('Kategori arama hatası:', error);
            return null;
        }
    }

    /**
     * Format value based on type
     */
    formatValue(value, format) {
        switch (format) {
            case 'currency':
                return formatCurrency(value);
            case 'percent':
                return `%${(value * 100).toFixed(1)}`;
            case 'number':
                return value.toString();
            default:
                return value.toString();
        }
    }

    /**
     * Get comparison period text
     */
    getComparisonPeriodText() {
        switch (this.timeRange) {
            case 'monthly':
                return 'geçen aya göre';
            case 'quarterly':
                return 'geçen çeyreğe göre';
            case 'yearly':
                return 'geçen yıla göre';
            default:
                return 'önceki döneme göre';
        }
    }

    /**
     * Get time range filter
     */
    getTimeRangeFilter() {
        const now = new Date();
        let startDate, endDate, previousStartDate, previousEndDate;
        
        switch (this.timeRange) {
            case 'monthly':
                // Current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                
                // Previous month
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
                
            case 'quarterly':
                // Current quarter
                const currentQuarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
                endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
                
                // Previous quarter
                previousStartDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
                previousEndDate = new Date(now.getFullYear(), currentQuarter * 3, 0);
                break;
                
            case 'yearly':
                // Current year
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                
                // Previous year
                previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
                previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
                break;
                
            default:
                // Default to monthly
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }
        
        return { startDate, endDate, previousStartDate, previousEndDate };
    }

    /**
     * Initialize charts
     */
    async initializeCharts() {
        try {
            // Get the time range filter
            const timeRangeFilter = this.getTimeRangeFilter();
            
            // Filter transactions by time range
            const filteredTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.startDate && date <= timeRangeFilter.endDate;
            });
            
            // Initialize Income/Expense Trend Chart
            await this.initializeIncomeExpenseTrendChart(filteredTransactions, timeRangeFilter);
            
            // Initialize Category Trend Chart
            await this.initializeCategoryTrendChart(filteredTransactions, timeRangeFilter);
            
        } catch (error) {
            console.error('Chart başlatma hatası:', error);
        }
    }

    /**
     * Initialize Income/Expense Trend Chart
     */
    async initializeIncomeExpenseTrendChart(transactions, timeRangeFilter) {
        try {
            const ctx = document.getElementById('incomeExpenseTrendChart');
            if (!ctx) return;
            
            // Prepare data
            const { labels, incomeData, expenseData } = this.prepareIncomeExpenseTrendData(transactions, timeRangeFilter);
            
            // Create chart
            this.charts.incomeExpenseTrend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Gelir',
                            data: incomeData,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Gider',
                            data: expenseData,
                            borderColor: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += formatCurrency(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Income/Expense Trend Chart başlatma hatası:', error);
        }
    }

    /**
     * Prepare Income/Expense Trend Data
     */
    prepareIncomeExpenseTrendData(transactions, timeRangeFilter) {
        const labels = [];
        const incomeData = [];
        const expenseData = [];
        
        try {
            // Determine time divisions based on time range
            let timeDivisions = [];
            
            switch (this.timeRange) {
                case 'monthly':
                    // Days of the month
                    const daysInMonth = timeRangeFilter.endDate.getDate();
                    timeDivisions = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                    break;
                    
                case 'quarterly':
                    // Weeks of the quarter
                    const weeks = [];
                    let currentDate = new Date(timeRangeFilter.startDate);
                    let weekCounter = 1;
                    
                    while (currentDate <= timeRangeFilter.endDate) {
                        weeks.push(weekCounter);
                        currentDate.setDate(currentDate.getDate() + 7);
                        weekCounter++;
                    }
                    
                    timeDivisions = weeks;
                    break;
                    
                case 'yearly':
                    // Months of the year
                    timeDivisions = Array.from({ length: 12 }, (_, i) => i + 1);
                    break;
                    
                default:
                    // Default to days of the month
                    const defaultDaysInMonth = timeRangeFilter.endDate.getDate();
                    timeDivisions = Array.from({ length: defaultDaysInMonth }, (_, i) => i + 1);
            }
            
            // Initialize data arrays
            timeDivisions.forEach(division => {
                // Create labels based on time range
                let label;
                switch (this.timeRange) {
                    case 'monthly':
                        label = `${division}`;
                        break;
                    case 'quarterly':
                        label = `Hafta ${division}`;
                        break;
                    case 'yearly':
                        // Convert month number to name
                        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                                           'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                        label = monthNames[division - 1];
                        break;
                    default:
                        label = `${division}`;
                }
                
                labels.push(label);
                incomeData.push(0);
                expenseData.push(0);
            });
            
            // Aggregate transaction data
            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                let index;
                
                // Determine index based on time range
                switch (this.timeRange) {
                    case 'monthly':
                        index = date.getDate() - 1;
                        break;
                    case 'quarterly':
                        // Calculate week number within the quarter
                        const startDate = timeRangeFilter.startDate;
                        const diffDays = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
                        index = Math.floor(diffDays / 7);
                        break;
                    case 'yearly':
                        index = date.getMonth();
                        break;
                    default:
                        index = date.getDate() - 1;
                }
                
                // Make sure index is within bounds
                if (index >= 0 && index < timeDivisions.length) {
                    if (transaction.type === 'income') {
                        incomeData[index] += transaction.amount || 0;
                    } else if (transaction.type === 'expense') {
                        expenseData[index] += transaction.amount || 0;
                    }
                }
            });
            
            return { labels, incomeData, expenseData };
            
        } catch (error) {
            console.error('Income/Expense Trend Data hazırlama hatası:', error);
            return { labels: [], incomeData: [], expenseData: [] };
        }
    }

    /**
     * Initialize Category Trend Chart
     */
    async initializeCategoryTrendChart(transactions, timeRangeFilter) {
        try {
            const ctx = document.getElementById('categoryTrendChart');
            if (!ctx) return;
            
            // Prepare data for expense categories by default
            const { labels, datasets } = await this.prepareCategoryTrendData(transactions, 'expense');
            
            // Create chart
            this.charts.categoryTrend = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += formatCurrency(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            stacked: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Category Trend Chart başlatma hatası:', error);
        }
    }

    /**
     * Prepare Category Trend Data
     */
    async prepareCategoryTrendData(transactions, type = 'expense') {
        try {
            // Filter transactions by type
            const filteredTransactions = transactions.filter(t => t.type === type);
            
            // Get time divisions based on time range
            const timeDivisions = this.getTimeDivisions();
            
            // Get categories for the given type
            const categories = await this.dataManager.getCategories();
            const categoryList = categories[type] || [];
            
            // Create datasets for each category
            const datasets = [];
            const categoryData = {};
            
            // Initialize category data
            categoryList.forEach(category => {
                categoryData[category.id] = Array(timeDivisions.length).fill(0);
            });
            
            // Aggregate transaction data by category
            filteredTransactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const index = this.getTimeIndex(date);
                
                // Make sure index is within bounds and category exists
                if (index >= 0 && index < timeDivisions.length && categoryData[transaction.categoryId]) {
                    categoryData[transaction.categoryId][index] += transaction.amount || 0;
                }
            });
            
            // Create datasets
            categoryList.forEach(category => {
                if (categoryData[category.id].some(amount => amount > 0)) {
                    datasets.push({
                        label: category.name,
                        data: categoryData[category.id],
                        backgroundColor: category.color || this.getRandomColor(),
                        borderColor: category.color || this.getRandomColor(),
                        borderWidth: 1
                    });
                }
            });
            
            // Sort datasets by total amount (descending)
            datasets.sort((a, b) => {
                const totalA = a.data.reduce((sum, val) => sum + val, 0);
                const totalB = b.data.reduce((sum, val) => sum + val, 0);
                return totalB - totalA;
            });
            
            // Limit to top 5 categories
            const topDatasets = datasets.slice(0, 5);
            
            return { labels: timeDivisions, datasets: topDatasets };
            
        } catch (error) {
            console.error('Category Trend Data hazırlama hatası:', error);
            return { labels: [], datasets: [] };
        }
    }

    /**
     * Get time divisions based on time range
     */
    getTimeDivisions() {
        const timeDivisions = [];
        
        switch (this.timeRange) {
            case 'monthly':
                // Days of the month as labels
                const today = new Date();
                const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                
                // Create 4 weeks
                timeDivisions.push('1. Hafta');
                timeDivisions.push('2. Hafta');
                timeDivisions.push('3. Hafta');
                timeDivisions.push('4. Hafta');
                
                break;
                
            case 'quarterly':
                // Months of the quarter
                const today2 = new Date();
                const currentQuarter = Math.floor(today2.getMonth() / 3);
                const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                
                for (let i = 0; i < 3; i++) {
                    const monthIndex = currentQuarter * 3 + i;
                    timeDivisions.push(monthNames[monthIndex]);
                }
                break;
                
            case 'yearly':
                // Quarters of the year
                timeDivisions.push('1. Çeyrek');
                timeDivisions.push('2. Çeyrek');
                timeDivisions.push('3. Çeyrek');
                timeDivisions.push('4. Çeyrek');
                break;
                
            default:
                // Default to weeks of the month
                timeDivisions.push('1. Hafta');
                timeDivisions.push('2. Hafta');
                timeDivisions.push('3. Hafta');
                timeDivisions.push('4. Hafta');
        }
        
        return timeDivisions;
    }

    /**
     * Get time index for a date
     */
    getTimeIndex(date) {
        switch (this.timeRange) {
            case 'monthly':
                // Get week of month
                return Math.floor((date.getDate() - 1) / 7);
                
            case 'quarterly':
                // Get month of quarter
                const currentQuarter = Math.floor(date.getMonth() / 3);
                return date.getMonth() - (currentQuarter * 3);
                
            case 'yearly':
                // Get quarter of year
                return Math.floor(date.getMonth() / 3);
                
            default:
                // Default to week of month
                return Math.floor((date.getDate() - 1) / 7);
        }
    }

    /**
     * Get random color
     */
    getRandomColor() {
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#A855F7', '#06B6D4'
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Calculate trends
     */
    async calculateTrends() {
        try {
            // Get the current time range for filtering
            const timeRangeFilter = this.getTimeRangeFilter();
            
            // Filter transactions by time range
            const currentTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.startDate && date <= timeRangeFilter.endDate;
            });
            
            // Filter transactions for previous period
            const previousTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.previousStartDate && date <= timeRangeFilter.previousEndDate;
            });
            
            // Calculate current period metrics
            const currentIncome = currentTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const currentExpense = currentTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            // Calculate previous period metrics
            const previousIncome = previousTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const previousExpense = previousTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            // Calculate trends
            const incomeTrend = previousIncome !== 0 ? 
                ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
                
            const expenseTrend = previousExpense !== 0 ? 
                ((currentExpense - previousExpense) / previousExpense) * 100 : 0;
                
            return {
                income: {
                    current: currentIncome,
                    previous: previousIncome,
                    trend: incomeTrend
                },
                expense: {
                    current: currentExpense,
                    previous: previousExpense,
                    trend: expenseTrend
                }
            };
            
        } catch (error) {
            console.error('Trend hesaplama hatası:', error);
            return {
                income: { current: 0, previous: 0, trend: 0 },
                expense: { current: 0, previous: 0, trend: 0 }
            };
        }
    }

    /**
     * Generate alerts
     */
    async generateAlerts() {
        try {
            // Get the current time range for filtering
            const timeRangeFilter = this.getTimeRangeFilter();
            
            // Filter transactions by time range
            const currentTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.startDate && date <= timeRangeFilter.endDate;
            });
            
            // Filter transactions for previous period
            const previousTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.previousStartDate && date <= timeRangeFilter.previousEndDate;
            });
            
            const alerts = [];
            
            // Alert 1: Budget deficit alert
            const currentIncome = currentTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const currentExpense = currentTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            if (currentExpense > currentIncome) {
                alerts.push({
                    type: 'critical',
                    title: 'Bütçe Açığı',
                    message: `Bu dönemde ${formatCurrency(currentExpense - currentIncome)} bütçe açığınız var. Harcamalarınızı azaltmanız önerilir.`,
                    actionText: 'Tasarruf Önerileri',
                    actionUrl: '#',
                    icon: 'alert-triangle'
                });
            }
            
            // Alert 2: Spending increase alert
            const previousExpense = previousTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            if (previousExpense > 0) {
                const expenseIncrease = ((currentExpense - previousExpense) / previousExpense) * 100;
                
                if (expenseIncrease > 20) {
                    alerts.push({
                        type: 'warning',
                        title: 'Harcama Artışı',
                        message: `Harcamalarınız önceki döneme göre %${expenseIncrease.toFixed(1)} arttı. Bu artışın sebeplerini incelemeniz önerilir.`,
                        actionText: 'Detayları Gör',
                        actionUrl: '#',
                        icon: 'trending-up'
                    });
                }
            }
            
            // Alert 3: Category overspending
            // Calculate category spending for current and previous period
            const categorySpending = {};
            const prevCategorySpending = {};
            
            // Current period expense categories
            currentTransactions
                .filter(t => t.type === 'expense')
                .forEach(transaction => {
                    const categoryId = transaction.categoryId;
                    if (!categorySpending[categoryId]) {
                        categorySpending[categoryId] = 0;
                    }
                    categorySpending[categoryId] += (transaction.amount || 0);
                });
                
            // Previous period expense categories
            previousTransactions
                .filter(t => t.type === 'expense')
                .forEach(transaction => {
                    const categoryId = transaction.categoryId;
                    if (!prevCategorySpending[categoryId]) {
                        prevCategorySpending[categoryId] = 0;
                    }
                    prevCategorySpending[categoryId] += (transaction.amount || 0);
                });
                
            // Check for significant category increases
            for (const categoryId in categorySpending) {
                if (prevCategorySpending[categoryId] && prevCategorySpending[categoryId] > 0) {
                    const increase = ((categorySpending[categoryId] - prevCategorySpending[categoryId]) / prevCategorySpending[categoryId]) * 100;
                    
                    if (increase > 30 && categorySpending[categoryId] > 500) {
                        const category = this.getCategoryById(categoryId);
                        if (category) {
                            alerts.push({
                                type: 'warning',
                                title: 'Kategori Aşımı',
                                message: `"${category.name}" kategorisinde harcamalarınız önceki döneme göre %${increase.toFixed(1)} arttı.`,
                                actionText: 'İncele',
                                actionUrl: '#',
                                icon: 'alert-circle'
                            });
                        }
                    }
                }
            }
            
            // Alert 4: Upcoming payments
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            
            const upcomingPayments = this.transactions.filter(transaction => {
                if (transaction.type !== 'expense' || transaction.status !== 'planned') return false;
                
                const date = new Date(transaction.date);
                return date >= today && date <= nextWeek;
            });
            
            if (upcomingPayments.length > 0) {
                const totalAmount = upcomingPayments.reduce((sum, t) => sum + (t.amount || 0), 0);
                
                alerts.push({
                    type: 'info',
                    title: 'Yaklaşan Ödemeler',
                    message: `Önümüzdeki hafta ${upcomingPayments.length} adet toplam ${formatCurrency(totalAmount)} ödemeniz bulunuyor.`,
                    actionText: 'Ödemeleri Gör',
                    actionUrl: '#',
                    icon: 'calendar'
                });
            }
            
            // Alert 5: Savings opportunity
            if (currentIncome > 0) {
                const savingsRate = (currentIncome - currentExpense) / currentIncome;
                
                if (savingsRate < 0.1 && savingsRate >= 0) {
                    alerts.push({
                        type: 'info',
                        title: 'Tasarruf Fırsatı',
                        message: `Bu dönemde tasarruf oranınız sadece %${(savingsRate * 100).toFixed(1)}. Finansal hedefleriniz için tasarruf oranınızı %20'ye çıkarmanızı öneririz.`,
                        actionText: 'Tasarruf Önerileri',
                        actionUrl: '#',
                        icon: 'piggy-bank'
                    });
                }
            }
            
            return alerts;
            
        } catch (error) {
            console.error('Uyarı üretme hatası:', error);
            return [];
        }
    }

    /**
     * Render critical alerts
     */
    renderCriticalAlerts() {
        try {
            const alertsContainer = document.getElementById('criticalAlertsContainer');
            const alertsCountElement = document.getElementById('alertsCount');
            
            if (!alertsContainer || !this.alerts) return;
            
            // Update alerts count
            if (alertsCountElement) {
                alertsCountElement.textContent = this.alerts.length.toString();
            }
            
            // Clear container
            alertsContainer.innerHTML = '';
            
            // No alerts message
            if (this.alerts.length === 0) {
                alertsContainer.innerHTML = `
                    <div class="flex items-center justify-center p-6 text-gray-500">
                        <i data-lucide="check-circle" class="w-5 h-5 mr-2 text-green-500"></i>
                        <span>Şu anda kritik uyarı bulunmuyor.</span>
                    </div>
                `;
                lucide.createIcons(alertsContainer);
                return;
            }
            
            // Render alerts
            this.alerts.forEach(alert => {
                const alertType = this.alertTypes[alert.type] || this.alertTypes.info;
                
                const alertElement = document.createElement('div');
                alertElement.className = `flex p-4 rounded-lg ${alert.type === 'critical' ? 'recommendation-critical' : ''} mb-3`;
                alertElement.style.backgroundColor = alertType.bgColor;
                
                alertElement.innerHTML = `
                    <div class="flex-shrink-0 mr-3">
                        <i data-lucide="${alertType.icon}" class="w-5 h-5" style="color: ${alertType.color};"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${alert.title}</h4>
                        <p class="text-sm text-gray-700 mt-1">${alert.message}</p>
                        ${alert.actionText ? `
                            <div class="mt-2">
                                <button class="text-xs font-medium px-2 py-1 rounded" 
                                        style="background-color: ${alertType.color}20; color: ${alertType.color};">
                                    ${alert.actionText}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <button class="ml-2 text-gray-400 hover:text-gray-600 dismiss-alert">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                `;
                
                alertsContainer.appendChild(alertElement);
            });
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons(alertsContainer);
            }
            
            // Add event listeners to dismiss buttons
            const dismissButtons = alertsContainer.querySelectorAll('.dismiss-alert');
            dismissButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const alertElement = e.target.closest('div[class^="flex p-4 rounded-lg"]');
                    if (alertElement) {
                        alertElement.style.height = `${alertElement.offsetHeight}px`;
                        setTimeout(() => {
                            alertElement.style.height = '0';
                            alertElement.style.opacity = '0';
                            alertElement.style.marginBottom = '0';
                            alertElement.style.padding = '0';
                            alertElement.style.overflow = 'hidden';
                            alertElement.style.transition = 'all 0.3s ease-out';
                        }, 10);
                        setTimeout(() => {
                            alertElement.remove();
                            
                            // Update alerts count
                            if (alertsCountElement) {
                                const count = alertsContainer.querySelectorAll('div[class^="flex p-4 rounded-lg"]').length;
                                alertsCountElement.textContent = count.toString();
                                
                                // Show no alerts message if all alerts are dismissed
                                if (count === 0) {
                                    alertsContainer.innerHTML = `
                                        <div class="flex items-center justify-center p-6 text-gray-500">
                                            <i data-lucide="check-circle" class="w-5 h-5 mr-2 text-green-500"></i>
                                            <span>Şu anda kritik uyarı bulunmuyor.</span>
                                        </div>
                                    `;
                                    lucide.createIcons(alertsContainer);
                                }
                            }
                        }, 300);
                    }
                });
            });
            
        } catch (error) {
            console.error('Kritik uyarıları render etme hatası:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        try {
            // Time range change event
            const timeRangeSelect = document.getElementById('executiveSummaryTimeRange');
            if (timeRangeSelect) {
                timeRangeSelect.addEventListener('change', (e) => {
                    this.timeRange = e.target.value;
                    this.update();
                });
            }
            
            // Refresh button click event
            const refreshButton = document.getElementById('refreshExecutiveSummary');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.update();
                });
            }
            
            // Chart type toggle buttons
            document.querySelectorAll('.chart-filter[data-chart="incomeExpenseTrend"]').forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all buttons in the group
                    document.querySelectorAll('.chart-filter[data-chart="incomeExpenseTrend"]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Update chart type
                    const chartType = e.target.getAttribute('data-view');
                    this.updateIncomeExpenseTrendChartType(chartType);
                });
            });
            
            // Category filter buttons
            document.querySelectorAll('.chart-filter[data-chart="categoryTrend"]').forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all buttons in the group
                    document.querySelectorAll('.chart-filter[data-chart="categoryTrend"]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Update category type
                    const categoryType = e.target.getAttribute('data-type');
                    this.updateCategoryTrendChartType(categoryType);
                });
            });
            
        } catch (error) {
            console.error('Event listener kurulum hatası:', error);
        }
    }

    /**
     * Update Income/Expense Trend Chart Type
     */
    updateIncomeExpenseTrendChartType(chartType) {
        try {
            if (!this.charts.incomeExpenseTrend) return;
            
            // Update chart type
            this.charts.incomeExpenseTrend.config.type = chartType;
            
            // Update chart
            this.charts.incomeExpenseTrend.update();
            
        } catch (error) {
            console.error('Chart type güncelleme hatası:', error);
        }
    }

    /**
     * Update Category Trend Chart Type
     */
    async updateCategoryTrendChartType(categoryType) {
        try {
            if (!this.charts.categoryTrend) return;
            
            // Get the time range filter
            const timeRangeFilter = this.getTimeRangeFilter();
            
            // Filter transactions by time range
            const filteredTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.startDate && date <= timeRangeFilter.endDate;
            });
            
            // Prepare data for the selected category type
            const { labels, datasets } = await this.prepareCategoryTrendData(filteredTransactions, categoryType);
            
            // Update chart data
            this.charts.categoryTrend.data.labels = labels;
            this.charts.categoryTrend.data.datasets = datasets;
            
            // Update chart
            this.charts.categoryTrend.update();
            
        } catch (error) {
            console.error('Category type güncelleme hatası:', error);
        }
    }

    /**
     * Update the dashboard
     */
    async update() {
        try {
            console.log('Executive Summary Dashboard güncelleniyor...');
            
            // Load fresh data
            await this.loadData();
            
            // Render KPI cards
            this.renderKPICards();
            
            // Render critical alerts
            this.renderCriticalAlerts();
            
            // Update charts
            this.updateCharts();
            
            console.log('Executive Summary Dashboard güncellendi');
            
        } catch (error) {
            console.error('Dashboard güncelleme hatası:', error);
        }
    }

    /**
     * Update charts
     */
    async updateCharts() {
        try {
            // Get the time range filter
            const timeRangeFilter = this.getTimeRangeFilter();
            
            // Filter transactions by time range
            const filteredTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeRangeFilter.startDate && date <= timeRangeFilter.endDate;
            });
            
            // Update Income/Expense Trend Chart
            if (this.charts.incomeExpenseTrend) {
                // Prepare data
                const { labels, incomeData, expenseData } = this.prepareIncomeExpenseTrendData(filteredTransactions, timeRangeFilter);
                
                // Update chart data
                this.charts.incomeExpenseTrend.data.labels = labels;
                this.charts.incomeExpenseTrend.data.datasets[0].data = incomeData;
                this.charts.incomeExpenseTrend.data.datasets[1].data = expenseData;
                
                // Update chart
                this.charts.incomeExpenseTrend.update();
            }
            
            // Update Category Trend Chart
            if (this.charts.categoryTrend) {
                // Get current category type
                const categoryTypeButton = document.querySelector('.chart-filter[data-chart="categoryTrend"].active');
                const categoryType = categoryTypeButton ? categoryTypeButton.getAttribute('data-type') : 'expense';
                
                // Prepare data
                const { labels, datasets } = await this.prepareCategoryTrendData(filteredTransactions, categoryType);
                
                // Update chart data
                this.charts.categoryTrend.data.labels = labels;
                this.charts.categoryTrend.data.datasets = datasets;
                
                // Update chart
                this.charts.categoryTrend.update();
            }
            
        } catch (error) {
            console.error('Chart güncelleme hatası:', error);
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        try {
            console.log('Executive Summary Dashboard temizleniyor...');
            
            // Destroy charts
            for (const chartName in this.charts) {
                if (this.charts[chartName]) {
                    this.charts[chartName].destroy();
                }
            }
            
            // Clear charts object
            this.charts = {};
            
            console.log('Executive Summary Dashboard temizlendi');
            
        } catch (error) {
            console.error('Dashboard temizleme hatası:', error);
        }
    }
}

// Export the class
const executiveSummaryDashboard = new ExecutiveSummaryDashboard(dataManager, chartManager);