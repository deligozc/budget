// js/components/operationalDashboard.js - Operasyonel Dashboard Bileşeni

class OperationalDashboard {
    constructor(dataManager, chartManager) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.containerId = 'operationalDashboardContainer';
        this.container = null;
        this.charts = {};
        this.timeRange = 'weekly'; // daily, weekly, monthly
        this.isInitialized = false;
        this.metricsHistory = {};
        this.performanceIndicators = {
            savingsRate: { target: 0.2, weight: 0.25 },
            expenseRatio: { target: 0.7, weight: 0.25 },
            budgetAdherence: { target: 0.9, weight: 0.25 },
            paymentCompletion: { target: 0.95, weight: 0.25 }
        };
    }

    /**
     * Initialize the Operational Dashboard
     */
    async initialize() {
        console.log('Operasyonel Dashboard başlatılıyor...');

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
        console.log('Operasyonel Dashboard başarıyla başlatıldı');
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
        this.container.className = 'operational-dashboard mb-8';
        
        // Find where to insert the container
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            // Insert after the executive summary dashboard
            const executiveSummaryDashboard = document.getElementById('executiveSummaryContainer');
            if (executiveSummaryDashboard) {
                executiveSummaryDashboard.after(this.container);
            } else {
                // Insert after dashboard controls
                const dashboardControls = dashboardContent.querySelector('.dashboard-controls');
                if (dashboardControls) {
                    dashboardControls.after(this.container);
                } else {
                    dashboardContent.prepend(this.container);
                }
            }
        }
    }

    /**
     * Load data for the dashboard
     */
    async loadData() {
        try {
            // Load transactions
            this.transactions = await this.dataManager.getTransactions();
            
            // Load categories
            this.categories = await this.dataManager.getCategories();
            
            // Load accounts
            this.accounts = await this.dataManager.getAccounts();
            
            // Calculate operational metrics
            this.metrics = await this.calculateOperationalMetrics();
            
            // Calculate performance indicators
            this.performance = await this.calculatePerformanceIndicators();
            
            // Generate metrics history (last 10 periods)
            this.metricsHistory = await this.generateMetricsHistory(10);
            
        } catch (error) {
            console.error('Operasyonel Dashboard veri yükleme hatası:', error);
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
                    <h3 class="text-lg font-medium text-gray-900">Operasyonel Dashboard</h3>
                    <div class="flex space-x-2">
                        <select id="operationalTimeRange" class="p-2 border border-gray-300 rounded-lg text-sm">
                            <option value="daily">Günlük</option>
                            <option value="weekly" selected>Haftalık</option>
                            <option value="monthly">Aylık</option>
                        </select>
                        <button id="refreshOperationalDashboard" class="btn btn-secondary text-sm">
                            <i data-lucide="refresh-cw" style="width: 0.875rem; height: 0.875rem;"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>
                
                <!-- Performance Score Gauge -->
                <div class="chart-card mb-6">
                    <div class="chart-header">
                        <h3 class="chart-title">Finansal Performans Skoru</h3>
                    </div>
                    <div class="flex items-center">
                        <div class="w-1/3 flex justify-center">
                            <div class="performance-gauge">
                                <canvas id="performanceGaugeChart" width="200" height="200"></canvas>
                                <div id="performanceScore" class="gauge-value"></div>
                            </div>
                        </div>
                        <div class="w-2/3">
                            <div class="grid grid-cols-2 gap-4">
                                <div id="savingsMetric" class="metric-card"></div>
                                <div id="expenseRatioMetric" class="metric-card"></div>
                                <div id="budgetAdherenceMetric" class="metric-card"></div>
                                <div id="paymentCompletionMetric" class="metric-card"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Daily/Weekly Metrics -->
                <div class="chart-card mb-6">
                    <div class="chart-header">
                        <h3 class="chart-title"><span id="metricsTimeframe">Haftalık</span> Metrikler</h3>
                        <div class="chart-actions">
                            <button class="chart-filter" data-metric="income">Gelir</button>
                            <button class="chart-filter active" data-metric="expense">Gider</button>
                            <button class="chart-filter" data-metric="balance">Bakiye</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="periodicMetricsChart" height="300"></canvas>
                    </div>
                </div>
                
                <!-- Performance History -->
                <div class="chart-card mb-6">
                    <div class="chart-header">
                        <h3 class="chart-title">Performans Geçmişi</h3>
                        <div class="chart-actions">
                            <button class="chart-filter active" data-history="performance">Toplam Skor</button>
                            <button class="chart-filter" data-history="metrics">Detaylı Metrikler</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="performanceHistoryChart" height="300"></canvas>
                    </div>
                </div>
                
                <!-- Detailed Transaction Analysis -->
                <div class="chart-card mb-6">
                    <div class="chart-header">
                        <h3 class="chart-title">İşlem Analizi</h3>
                        <div class="chart-actions">
                            <select id="transactionAnalysisType" class="p-1 border border-gray-300 rounded text-sm">
                                <option value="day-of-week">Haftanın Günleri</option>
                                <option value="time-of-day">Günün Saatleri</option>
                                <option value="day-of-month">Ayın Günleri</option>
                            </select>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="transactionAnalysisChart" height="300"></canvas>
                    </div>
                </div>
                
                <!-- Recent Transactions with Status -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Son İşlem Aktiviteleri</h3>
                        <div class="chart-actions">
                            <span id="operationalTransactionCount" class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">0</span>
                        </div>
                    </div>
                    <div id="operationalTransactionsTable" class="p-4">
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                    </tr>
                                </thead>
                                <tbody id="operationalTransactionsBody" class="bg-white divide-y divide-gray-200">
                                    <!-- Transaction rows will be added dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = dashboardHtml;
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(this.container);
        }
        
        // Render metric cards
        this.renderMetricCards();
        
        // Render transaction table
        this.renderTransactionTable();
    }

    /**
     * Render metric cards
     */
    renderMetricCards() {
        try {
            if (!this.performance) return;
            
            // Define metric cards data
            const metricCards = [
                {
                    id: 'savingsMetric',
                    title: 'Tasarruf Oranı',
                    value: this.performance.savingsRate.value,
                    target: this.performance.savingsRate.target,
                    score: this.performance.savingsRate.score,
                    icon: 'piggy-bank',
                    format: 'percent'
                },
                {
                    id: 'expenseRatioMetric',
                    title: 'Gider Oranı',
                    value: this.performance.expenseRatio.value,
                    target: this.performance.expenseRatio.target,
                    score: this.performance.expenseRatio.score,
                    icon: 'trending-down',
                    format: 'percent',
                    inversed: true
                },
                {
                    id: 'budgetAdherenceMetric',
                    title: 'Bütçe Uyumu',
                    value: this.performance.budgetAdherence.value,
                    target: this.performance.budgetAdherence.target,
                    score: this.performance.budgetAdherence.score,
                    icon: 'check-square',
                    format: 'percent'
                },
                {
                    id: 'paymentCompletionMetric',
                    title: 'Ödeme Tamamlama',
                    value: this.performance.paymentCompletion.value,
                    target: this.performance.paymentCompletion.target,
                    score: this.performance.paymentCompletion.score,
                    icon: 'calendar-check',
                    format: 'percent'
                }
            ];
            
            // Render each metric card
            metricCards.forEach(card => {
                const cardElement = document.getElementById(card.id);
                if (!cardElement) return;
                
                // Calculate percent of target
                const percentOfTarget = card.inversed 
                    ? (card.target / card.value) * 100 
                    : (card.value / card.target) * 100;
                
                // Format values
                const formattedValue = this.formatValue(card.value, card.format);
                const formattedTarget = this.formatValue(card.target, card.format);
                
                // Determine color based on score
                let colorClass;
                if (card.score >= 0.8) {
                    colorClass = 'bg-green-100 text-green-700';
                } else if (card.score >= 0.6) {
                    colorClass = 'bg-yellow-100 text-yellow-700';
                } else {
                    colorClass = 'bg-red-100 text-red-700';
                }
                
                // Generate card HTML
                cardElement.innerHTML = `
                    <div class="p-3 rounded-lg ${colorClass}">
                        <div class="flex justify-between items-center mb-2">
                            <p class="text-sm font-medium">${card.title}</p>
                            <div class="rounded-full p-1 ${colorClass}">
                                <i data-lucide="${card.icon}" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div class="flex justify-between items-end">
                            <p class="text-lg font-bold">${formattedValue}</p>
                            <p class="text-xs">Hedef: ${formattedTarget}</p>
                        </div>
                        <div class="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div class="h-full ${card.score >= 0.8 ? 'bg-green-500' : card.score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}" 
                                 style="width: ${Math.min(100, percentOfTarget)}%"></div>
                        </div>
                    </div>
                `;
            });
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Update performance score
            const performanceScoreElement = document.getElementById('performanceScore');
            if (performanceScoreElement) {
                performanceScoreElement.textContent = `${Math.round(this.performance.overallScore * 100)}`;
                
                // Set color based on score
                if (this.performance.overallScore >= 0.8) {
                    performanceScoreElement.style.color = '#10B981'; // green
                } else if (this.performance.overallScore >= 0.6) {
                    performanceScoreElement.style.color = '#F59E0B'; // yellow
                } else {
                    performanceScoreElement.style.color = '#EF4444'; // red
                }
            }
            
        } catch (error) {
            console.error('Metrik kartları render hatası:', error);
        }
    }

    /**
     * Render transaction table
     */
    renderTransactionTable() {
        try {
            const tableBody = document.getElementById('operationalTransactionsBody');
            const transactionCountElement = document.getElementById('operationalTransactionCount');
            
            if (!tableBody || !this.transactions) return;
            
            // Filter transactions based on time range
            const timeFilter = this.getTimeRangeFilter();
            const filteredTransactions = this.transactions
                .filter(transaction => {
                    const date = new Date(transaction.date);
                    return date >= timeFilter.startDate && date <= timeFilter.endDate;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5); // Show only the last 5 transactions
            
            // Update transaction count
            if (transactionCountElement) {
                transactionCountElement.textContent = filteredTransactions.length.toString();
            }
            
            // Clear table body
            tableBody.innerHTML = '';
            
            // No transactions message
            if (filteredTransactions.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        Bu dönemde işlem bulunmuyor.
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }
            
            // Render transactions
            filteredTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Get category
                const category = this.getCategoryById(transaction.categoryId);
                
                // Format date
                const date = new Date(transaction.date);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
                
                // Determine status color and text
                let statusColor, statusText;
                if (transaction.status === 'planned') {
                    statusColor = 'bg-blue-100 text-blue-800';
                    statusText = 'Planlandı';
                } else if (transaction.status === 'pending') {
                    statusColor = 'bg-yellow-100 text-yellow-800';
                    statusText = 'Beklemede';
                } else if (transaction.status === 'completed') {
                    statusColor = 'bg-green-100 text-green-800';
                    statusText = 'Tamamlandı';
                } else {
                    statusColor = 'bg-gray-100 text-gray-800';
                    statusText = 'Gerçekleşti';
                }
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formattedDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${escapeHtml(transaction.description || 'İsimsiz İşlem')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ${category ? `
                            <div class="flex items-center">
                                <span class="w-2 h-2 rounded-full mr-1.5" style="background-color: ${category.color || '#6B7280'};"></span>
                                ${escapeHtml(category.name)}
                            </div>
                        ` : 'Kategori Yok'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount || 0)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">
                            ${statusText}
                        </span>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('İşlem tablosu render hatası:', error);
        }
    }

    /**
     * Initialize charts
     */
    async initializeCharts() {
        try {
            // Initialize performance gauge
            this.initializePerformanceGauge();
            
            // Initialize periodic metrics chart
            this.initializePeriodicMetricsChart();
            
            // Initialize performance history chart
            this.initializePerformanceHistoryChart();
            
            // Initialize transaction analysis chart
            this.initializeTransactionAnalysisChart();
            
        } catch (error) {
            console.error('Chart başlatma hatası:', error);
        }
    }

    /**
     * Initialize performance gauge
     */
    initializePerformanceGauge() {
        try {
            const ctx = document.getElementById('performanceGaugeChart');
            if (!ctx) return;
            
            // Create gauge chart
            this.charts.performanceGauge = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [
                            this.performance.overallScore * 100, 
                            100 - (this.performance.overallScore * 100)
                        ],
                        backgroundColor: [
                            this.getScoreColor(this.performance.overallScore),
                            '#f1f5f9'
                        ],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Performance Gauge başlatma hatası:', error);
        }
    }

    /**
     * Initialize periodic metrics chart
     */
    initializePeriodicMetricsChart() {
        try {
            const ctx = document.getElementById('periodicMetricsChart');
            if (!ctx) return;
            
            // Get time range filter
            const timeFilter = this.getTimeRangeFilter();
            
            // Prepare chart data for expenses by default
            const { labels, data } = this.preparePeriodicMetricsData('expense', timeFilter);
            
            // Create chart
            this.charts.periodicMetrics = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Gider',
                        data: data,
                        backgroundColor: '#ef4444',
                        borderColor: '#ef4444',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return formatCurrency(context.raw);
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
            console.error('Periodic Metrics Chart başlatma hatası:', error);
        }
    }

    /**
     * Initialize performance history chart
     */
    initializePerformanceHistoryChart() {
        try {
            const ctx = document.getElementById('performanceHistoryChart');
            if (!ctx) return;
            
            // Prepare chart data
            const { labels, data } = this.preparePerformanceHistoryData();
            
            // Create chart
            this.charts.performanceHistory = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Performans Skoru',
                        data: data,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Skor: ${context.raw.toFixed(0)}%`;
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
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return `${value}%`;
                                }
                            }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Performance History Chart başlatma hatası:', error);
        }
    }

    /**
     * Initialize transaction analysis chart
     */
    initializeTransactionAnalysisChart() {
        try {
            const ctx = document.getElementById('transactionAnalysisChart');
            if (!ctx) return;
            
            // Prepare chart data for day of week by default
            const { labels, incomeData, expenseData } = this.prepareTransactionAnalysisData('day-of-week');
            
            // Create chart
            this.charts.transactionAnalysis = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Gelir',
                            data: incomeData,
                            backgroundColor: '#10B981',
                            borderColor: '#10B981',
                            borderWidth: 1
                        },
                        {
                            label: 'Gider',
                            data: expenseData,
                            backgroundColor: '#EF4444',
                            borderColor: '#EF4444',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
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
            console.error('Transaction Analysis Chart başlatma hatası:', error);
        }
    }

    /**
     * Prepare periodic metrics data
     */
    preparePeriodicMetricsData(metricType, timeFilter) {
        try {
            const labels = [];
            const data = [];
            
            // Filter transactions by type and time range
            const filteredTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return transaction.type === metricType && 
                       date >= timeFilter.startDate && 
                       date <= timeFilter.endDate;
            });
            
            // Determine how to group data based on time range
            if (this.timeRange === 'daily') {
                // Group by hour of day (24 hours)
                for (let hour = 0; hour < 24; hour++) {
                    const hourLabel = hour.toString().padStart(2, '0') + ':00';
                    labels.push(hourLabel);
                    
                    // Sum transactions for this hour
                    const hourlyTotal = filteredTransactions
                        .filter(t => new Date(t.date).getHours() === hour)
                        .reduce((sum, t) => sum + (t.amount || 0), 0);
                    
                    data.push(hourlyTotal);
                }
            } else if (this.timeRange === 'weekly') {
                // Group by day of week (7 days)
                const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                
                for (let day = 0; day < 7; day++) {
                    labels.push(dayNames[day]);
                    
                    // Sum transactions for this day (adjust day of week to match JS getDay() - Sunday is 0)
                    const adjustedDay = day === 6 ? 0 : day + 1;
                    const dailyTotal = filteredTransactions
                        .filter(t => new Date(t.date).getDay() === adjustedDay)
                        .reduce((sum, t) => sum + (t.amount || 0), 0);
                    
                    data.push(dailyTotal);
                }
            } else if (this.timeRange === 'monthly') {
                // Group by day of month (up to 31 days)
                const daysInMonth = new Date(timeFilter.endDate.getFullYear(), timeFilter.endDate.getMonth() + 1, 0).getDate();
                
                for (let day = 1; day <= daysInMonth; day++) {
                    labels.push(day.toString());
                    
                    // Sum transactions for this day
                    const dailyTotal = filteredTransactions
                        .filter(t => new Date(t.date).getDate() === day)
                        .reduce((sum, t) => sum + (t.amount || 0), 0);
                    
                    data.push(dailyTotal);
                }
            }
            
            return { labels, data };
            
        } catch (error) {
            console.error('Periodic Metrics verisi hazırlama hatası:', error);
            return { labels: [], data: [] };
        }
    }

    /**
     * Prepare performance history data
     */
    preparePerformanceHistoryData() {
        try {
            const labels = [];
            const data = [];
            
            // Check if metrics history exists
            if (!this.metricsHistory || !this.metricsHistory.periods) {
                return { labels: [], data: [] };
            }
            
            // Get period labels and overall scores
            this.metricsHistory.periods.forEach(period => {
                labels.push(period.label);
                data.push(period.overallScore * 100); // Convert to percentage
            });
            
            return { labels, data };
            
        } catch (error) {
            console.error('Performance History verisi hazırlama hatası:', error);
            return { labels: [], data: [] };
        }
    }

    /**
     * Prepare detailed metrics history data
     */
    prepareDetailedMetricsHistoryData() {
        try {
            const labels = [];
            const datasets = [];
            
            // Check if metrics history exists
            if (!this.metricsHistory || !this.metricsHistory.periods) {
                return { labels: [], datasets: [] };
            }
            
            // Get period labels
            this.metricsHistory.periods.forEach(period => {
                labels.push(period.label);
            });
            
            // Create datasets for each metric
            const metrics = [
                { key: 'savingsRate', label: 'Tasarruf Oranı', color: '#10B981' },
                { key: 'expenseRatio', label: 'Gider Oranı', color: '#EF4444' },
                { key: 'budgetAdherence', label: 'Bütçe Uyumu', color: '#3B82F6' },
                { key: 'paymentCompletion', label: 'Ödeme Tamamlama', color: '#8B5CF6' }
            ];
            
            metrics.forEach(metric => {
                const metricData = this.metricsHistory.periods.map(period => {
                    return period.metrics[metric.key] ? period.metrics[metric.key].score * 100 : 0;
                });
                
                datasets.push({
                    label: metric.label,
                    data: metricData,
                    borderColor: metric.color,
                    backgroundColor: metric.color + '20',
                    borderWidth: 2,
                    tension: 0.4
                });
            });
            
            return { labels, datasets };
            
        } catch (error) {
            console.error('Detailed Metrics History verisi hazırlama hatası:', error);
            return { labels: [], datasets: [] };
        }
    }

    /**
     * Prepare transaction analysis data
     */
    prepareTransactionAnalysisData(analysisType) {
        try {
            let labels = [];
            let incomeData = [];
            let expenseData = [];
            
            // Filter recent transactions (last 3 months)
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            
            const recentTransactions = this.transactions.filter(t => {
                const date = new Date(t.date);
                return date >= threeMonthsAgo;
            });
            
            // Prepare data based on analysis type
            switch (analysisType) {
                case 'day-of-week':
                    // Group by day of week
                    labels = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                    incomeData = Array(7).fill(0);
                    expenseData = Array(7).fill(0);
                    
                    recentTransactions.forEach(t => {
                        const date = new Date(t.date);
                        const dayOfWeek = date.getDay();
                        // Convert Sunday (0) to index 6, and others to 0-5
                        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        
                        if (t.type === 'income') {
                            incomeData[index] += (t.amount || 0);
                        } else if (t.type === 'expense') {
                            expenseData[index] += (t.amount || 0);
                        }
                    });
                    break;
                    
                case 'time-of-day':
                    // Group by time of day (4-hour blocks)
                    labels = ['00:00-04:00', '04:00-08:00', '08:00-12:00', '12:00-16:00', '16:00-20:00', '20:00-24:00'];
                    incomeData = Array(6).fill(0);
                    expenseData = Array(6).fill(0);
                    
                    recentTransactions.forEach(t => {
                        const date = new Date(t.date);
                        const hour = date.getHours();
                        const index = Math.floor(hour / 4);
                        
                        if (t.type === 'income') {
                            incomeData[index] += (t.amount || 0);
                        } else if (t.type === 'expense') {
                            expenseData[index] += (t.amount || 0);
                        }
                    });
                    break;
                    
                case 'day-of-month':
                    // Group by day of month (10-day blocks)
                    labels = ['1-10', '11-20', '21-31'];
                    incomeData = Array(3).fill(0);
                    expenseData = Array(3).fill(0);
                    
                    recentTransactions.forEach(t => {
                        const date = new Date(t.date);
                        const day = date.getDate();
                        let index;
                        
                        if (day <= 10) index = 0;
                        else if (day <= 20) index = 1;
                        else index = 2;
                        
                        if (t.type === 'income') {
                            incomeData[index] += (t.amount || 0);
                        } else if (t.type === 'expense') {
                            expenseData[index] += (t.amount || 0);
                        }
                    });
                    break;
            }
            
            return { labels, incomeData, expenseData };
            
        } catch (error) {
            console.error('Transaction Analysis verisi hazırlama hatası:', error);
            return { 
                labels: [], 
                incomeData: [], 
                expenseData: [] 
            };
        }
    }

    /**
     * Calculate operational metrics
     */
    async calculateOperationalMetrics() {
        try {
            // Get time range filter
            const timeFilter = this.getTimeRangeFilter();
            
            // Filter transactions by time range
            const filteredTransactions = this.transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return date >= timeFilter.startDate && date <= timeFilter.endDate;
            });
            
            // Calculate income and expense
            const totalIncome = filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const totalExpense = filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            // Calculate savings rate
            const savingsRate = totalIncome > 0 ? 
                (totalIncome - totalExpense) / totalIncome : 0;
                
            // Calculate expense ratio
            const expenseRatio = totalIncome > 0 ? 
                totalExpense / totalIncome : 1;
                
            // Calculate budget adherence
            // Get planned and actual expenses by category
            const plannedByCategory = {};
            const actualByCategory = {};
            
            filteredTransactions.forEach(t => {
                if (t.type !== 'expense') return;
                
                const categoryId = t.categoryId;
                
                if (t.status === 'planned') {
                    plannedByCategory[categoryId] = (plannedByCategory[categoryId] || 0) + (t.amount || 0);
                } else {
                    actualByCategory[categoryId] = (actualByCategory[categoryId] || 0) + (t.amount || 0);
                }
            });
            
            // Calculate adherence for each category
            let totalAdherence = 0;
            let categoryCount = 0;
            
            for (const categoryId in plannedByCategory) {
                if (plannedByCategory[categoryId] > 0) {
                    const planned = plannedByCategory[categoryId];
                    const actual = actualByCategory[categoryId] || 0;
                    
                    // Calculate adherence (how close actual is to planned)
                    // If actual > planned, adherence is lower
                    const adherence = actual <= planned ? 
                        actual / planned : 
                        planned / actual;
                    
                    totalAdherence += adherence;
                    categoryCount++;
                }
            }
            
            // Average adherence across categories
            const budgetAdherence = categoryCount > 0 ? 
                totalAdherence / categoryCount : 1;
                
            // Calculate payment completion rate
            const totalPlanned = filteredTransactions
                .filter(t => t.status === 'planned')
                .length;
                
            const totalCompleted = filteredTransactions
                .filter(t => t.status === 'completed')
                .length;
                
            const paymentCompletion = totalPlanned > 0 ? 
                totalCompleted / totalPlanned : 1;
                
            return {
                savingsRate,
                expenseRatio,
                budgetAdherence,
                paymentCompletion,
                totalIncome,
                totalExpense
            };
            
        } catch (error) {
            console.error('Operasyonel metrik hesaplama hatası:', error);
            return {
                savingsRate: 0,
                expenseRatio: 0,
                budgetAdherence: 0,
                paymentCompletion: 0,
                totalIncome: 0,
                totalExpense: 0
            };
        }
    }

    /**
     * Calculate performance indicators
     */
    async calculatePerformanceIndicators() {
        try {
            if (!this.metrics) return null;
            
            // Calculate score for each metric
            const savingsRateScore = this.calculateIndicatorScore(
                this.metrics.savingsRate,
                this.performanceIndicators.savingsRate.target
            );
            
            // For expense ratio, lower is better
            const expenseRatioScore = this.calculateIndicatorScore(
                1 - this.metrics.expenseRatio,
                1 - this.performanceIndicators.expenseRatio.target
            );
            
            const budgetAdherenceScore = this.calculateIndicatorScore(
                this.metrics.budgetAdherence,
                this.performanceIndicators.budgetAdherence.target
            );
            
            const paymentCompletionScore = this.calculateIndicatorScore(
                this.metrics.paymentCompletion,
                this.performanceIndicators.paymentCompletion.target
            );
            
            // Calculate overall score (weighted average)
            const overallScore = 
                (savingsRateScore * this.performanceIndicators.savingsRate.weight) +
                (expenseRatioScore * this.performanceIndicators.expenseRatio.weight) +
                (budgetAdherenceScore * this.performanceIndicators.budgetAdherence.weight) +
                (paymentCompletionScore * this.performanceIndicators.paymentCompletion.weight);
            
            return {
                overallScore,
                savingsRate: {
                    value: this.metrics.savingsRate,
                    target: this.performanceIndicators.savingsRate.target,
                    score: savingsRateScore
                },
                expenseRatio: {
                    value: this.metrics.expenseRatio,
                    target: this.performanceIndicators.expenseRatio.target,
                    score: expenseRatioScore
                },
                budgetAdherence: {
                    value: this.metrics.budgetAdherence,
                    target: this.performanceIndicators.budgetAdherence.target,
                    score: budgetAdherenceScore
                },
                paymentCompletion: {
                    value: this.metrics.paymentCompletion,
                    target: this.performanceIndicators.paymentCompletion.target,
                    score: paymentCompletionScore
                }
            };
            
        } catch (error) {
            console.error('Performans göstergeleri hesaplama hatası:', error);
            return {
                overallScore: 0,
                savingsRate: { value: 0, target: 0.2, score: 0 },
                expenseRatio: { value: 0, target: 0.7, score: 0 },
                budgetAdherence: { value: 0, target: 0.9, score: 0 },
                paymentCompletion: { value: 0, target: 0.95, score: 0 }
            };
        }
    }

    /**
     * Calculate indicator score
     * @param {number} value - Actual value
     * @param {number} target - Target value
     * @returns {number} Score between 0 and 1
     */
    calculateIndicatorScore(value, target) {
        // For percentage targets
        if (target <= 1) {
            // If value is at least the target, score is 1
            if (value >= target) return 1;
            
            // If value is less than target, score is proportional
            return value / target;
        }
        
        // For non-percentage targets
        return value >= target ? 1 : value / target;
    }

    /**
     * Generate metrics history
     */
    async generateMetricsHistory(periods = 10) {
        try {
            const history = {
                periods: []
            };
            
            // Generate data for each period
            for (let i = 0; i < periods; i++) {
                // Get time range for this period
                const periodFilter = this.getPeriodTimeFilter(i);
                
                // Filter transactions for this period
                const periodTransactions = this.transactions.filter(transaction => {
                    const date = new Date(transaction.date);
                    return date >= periodFilter.startDate && date <= periodFilter.endDate;
                });
                
                // Skip periods with no transactions
                if (periodTransactions.length === 0) continue;
                
                // Calculate metrics for this period
                const metrics = await this.calculatePeriodMetrics(periodTransactions);
                
                // Calculate performance indicators for this period
                const performance = await this.calculatePeriodPerformance(metrics);
                
                // Add period to history
                history.periods.push({
                    label: periodFilter.label,
                    startDate: periodFilter.startDate,
                    endDate: periodFilter.endDate,
                    metrics: metrics,
                    overallScore: performance.overallScore
                });
            }
            
            // Sort periods by date (newest first)
            history.periods.sort((a, b) => b.startDate - a.startDate);
            
            return history;
            
        } catch (error) {
            console.error('Metrik geçmişi oluşturma hatası:', error);
            return { periods: [] };
        }
    }

    /**
     * Calculate metrics for a period
     */
    async calculatePeriodMetrics(transactions) {
        try {
            // Calculate income and expense
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            // Calculate savings rate
            const savingsRate = totalIncome > 0 ? 
                (totalIncome - totalExpense) / totalIncome : 0;
                
            // Calculate expense ratio
            const expenseRatio = totalIncome > 0 ? 
                totalExpense / totalIncome : 1;
                
            // Calculate budget adherence
            // Get planned and actual expenses by category
            const plannedByCategory = {};
            const actualByCategory = {};
            
            transactions.forEach(t => {
                if (t.type !== 'expense') return;
                
                const categoryId = t.categoryId;
                
                if (t.status === 'planned') {
                    plannedByCategory[categoryId] = (plannedByCategory[categoryId] || 0) + (t.amount || 0);
                } else {
                    actualByCategory[categoryId] = (actualByCategory[categoryId] || 0) + (t.amount || 0);
                }
            });
            
            // Calculate adherence for each category
            let totalAdherence = 0;
            let categoryCount = 0;
            
            for (const categoryId in plannedByCategory) {
                if (plannedByCategory[categoryId] > 0) {
                    const planned = plannedByCategory[categoryId];
                    const actual = actualByCategory[categoryId] || 0;
                    
                    // Calculate adherence (how close actual is to planned)
                    const adherence = actual <= planned ? 
                        actual / planned : 
                        planned / actual;
                    
                    totalAdherence += adherence;
                    categoryCount++;
                }
            }
            
            // Average adherence across categories
            const budgetAdherence = categoryCount > 0 ? 
                totalAdherence / categoryCount : 1;
                
            // Calculate payment completion rate
            const totalPlanned = transactions
                .filter(t => t.status === 'planned')
                .length;
                
            const totalCompleted = transactions
                .filter(t => t.status === 'completed')
                .length;
                
            const paymentCompletion = totalPlanned > 0 ? 
                totalCompleted / totalPlanned : 1;
                
            return {
                savingsRate,
                expenseRatio,
                budgetAdherence,
                paymentCompletion,
                totalIncome,
                totalExpense
            };
            
        } catch (error) {
            console.error('Dönem metrik hesaplama hatası:', error);
            return {
                savingsRate: 0,
                expenseRatio: 0,
                budgetAdherence: 0,
                paymentCompletion: 0,
                totalIncome: 0,
                totalExpense: 0
            };
        }
    }

    /**
     * Calculate performance indicators for a period
     */
    async calculatePeriodPerformance(metrics) {
        try {
            // Calculate score for each metric
            const savingsRateScore = this.calculateIndicatorScore(
                metrics.savingsRate,
                this.performanceIndicators.savingsRate.target
            );
            
            // For expense ratio, lower is better
            const expenseRatioScore = this.calculateIndicatorScore(
                1 - metrics.expenseRatio,
                1 - this.performanceIndicators.expenseRatio.target
            );
            
            const budgetAdherenceScore = this.calculateIndicatorScore(
                metrics.budgetAdherence,
                this.performanceIndicators.budgetAdherence.target
            );
            
            const paymentCompletionScore = this.calculateIndicatorScore(
                metrics.paymentCompletion,
                this.performanceIndicators.paymentCompletion.target
            );
            
            // Calculate overall score (weighted average)
            const overallScore = 
                (savingsRateScore * this.performanceIndicators.savingsRate.weight) +
                (expenseRatioScore * this.performanceIndicators.expenseRatio.weight) +
                (budgetAdherenceScore * this.performanceIndicators.budgetAdherence.weight) +
                (paymentCompletionScore * this.performanceIndicators.paymentCompletion.weight);
            
            return {
                overallScore,
                savingsRate: {
                    score: savingsRateScore
                },
                expenseRatio: {
                    score: expenseRatioScore
                },
                budgetAdherence: {
                    score: budgetAdherenceScore
                },
                paymentCompletion: {
                    score: paymentCompletionScore
                }
            };
            
        } catch (error) {
            console.error('Dönem performans göstergeleri hesaplama hatası:', error);
            return {
                overallScore: 0,
                savingsRate: { score: 0 },
                expenseRatio: { score: 0 },
                budgetAdherence: { score: 0 },
                paymentCompletion: { score: 0 }
            };
        }
    }

    /**
     * Get time range filter
     */
    getTimeRangeFilter() {
        const now = new Date();
        let startDate, endDate;
        
        switch (this.timeRange) {
            case 'daily':
                // Current day
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
                
            case 'weekly':
                // Current week (Monday to Sunday)
                const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get Monday
                
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6); // Sunday
                endDate.setHours(23, 59, 59);
                break;
                
            case 'monthly':
                // Current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
                
            default:
                // Default to weekly
                const defaultDayOfWeek = now.getDay();
                const defaultMondayOffset = defaultDayOfWeek === 0 ? -6 : 1 - defaultDayOfWeek;
                
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + defaultMondayOffset);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59);
        }
        
        return { startDate, endDate };
    }

    /**
     * Get time filter for a specific period
     */
    getPeriodTimeFilter(periodOffset) {
        const now = new Date();
        let startDate, endDate, label;
        
        switch (this.timeRange) {
            case 'daily':
                // Previous days
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - periodOffset, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - periodOffset, 23, 59, 59);
                
                // Format date as DD.MM.YYYY
                label = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getFullYear()}`;
                break;
                
            case 'weekly':
                // Previous weeks
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get current Monday
                
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset - (7 * periodOffset));
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59);
                
                // Format week as DD.MM - DD.MM
                const weekEndDate = new Date(endDate);
                label = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')} - ${weekEndDate.getDate().toString().padStart(2, '0')}.${(weekEndDate.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
                
            case 'monthly':
                // Previous months
                startDate = new Date(now.getFullYear(), now.getMonth() - periodOffset, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() - periodOffset + 1, 0, 23, 59, 59);
                
                // Format month as Month YYYY
                const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                label = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
                break;
                
            default:
                // Default to weekly
                const defaultDayOfWeek = now.getDay();
                const defaultMondayOffset = defaultDayOfWeek === 0 ? -6 : 1 - defaultDayOfWeek;
                
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + defaultMondayOffset - (7 * periodOffset));
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59);
                
                // Format week as DD.MM - DD.MM
                const defaultWeekEndDate = new Date(endDate);
                label = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')} - ${defaultWeekEndDate.getDate().toString().padStart(2, '0')}.${(defaultWeekEndDate.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        
        return { startDate, endDate, label };
    }

    /**
     * Get score color based on value
     */
    getScoreColor(score) {
        if (score >= 0.8) {
            return '#10B981'; // green
        } else if (score >= 0.6) {
            return '#F59E0B'; // yellow
        } else {
            return '#EF4444'; // red
        }
    }

    /**
     * Get category by id
     */
    getCategoryById(categoryId) {
        try {
            if (!this.categories) return null;
            
            // Loop through category types
            for (const type in this.categories) {
                const categoryList = this.categories[type];
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
     * Setup event listeners
     */
    setupEventListeners() {
        try {
            // Time range change event
            const timeRangeSelect = document.getElementById('operationalTimeRange');
            if (timeRangeSelect) {
                timeRangeSelect.addEventListener('change', (e) => {
                    this.timeRange = e.target.value;
                    
                    // Update time frame text
                    const timeframeElement = document.getElementById('metricsTimeframe');
                    if (timeframeElement) {
                        timeframeElement.textContent = this.timeRange === 'daily' ? 'Günlük' : 
                                                      this.timeRange === 'weekly' ? 'Haftalık' : 'Aylık';
                    }
                    
                    this.update();
                });
            }
            
            // Refresh button click event
            const refreshButton = document.getElementById('refreshOperationalDashboard');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.update();
                });
            }
            
            // Metric filter buttons
            document.querySelectorAll('.chart-filter[data-metric]').forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all buttons in the group
                    document.querySelectorAll('.chart-filter[data-metric]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Update metric type
                    const metricType = e.target.getAttribute('data-metric');
                    this.updatePeriodicMetricsChart(metricType);
                });
            });
            
            // History filter buttons
            document.querySelectorAll('.chart-filter[data-history]').forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all buttons in the group
                    document.querySelectorAll('.chart-filter[data-history]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Update history chart type
                    const historyType = e.target.getAttribute('data-history');
                    this.updatePerformanceHistoryChart(historyType);
                });
            });
            
            // Transaction analysis type change
            const analysisTypeSelect = document.getElementById('transactionAnalysisType');
            if (analysisTypeSelect) {
                analysisTypeSelect.addEventListener('change', (e) => {
                    this.updateTransactionAnalysisChart(e.target.value);
                });
            }
            
        } catch (error) {
            console.error('Event listener kurulum hatası:', error);
        }
    }

    /**
     * Update periodic metrics chart
     */
    updatePeriodicMetricsChart(metricType) {
        try {
            if (!this.charts.periodicMetrics) return;
            
            // Get time range filter
            const timeFilter = this.getTimeRangeFilter();
            
            // Prepare chart data
            const { labels, data } = this.preparePeriodicMetricsData(metricType, timeFilter);
            
            // Update chart title and color
            let title, color;
            switch (metricType) {
                case 'income':
                    title = 'Gelir';
                    color = '#10B981'; // green
                    break;
                case 'expense':
                    title = 'Gider';
                    color = '#EF4444'; // red
                    break;
                case 'balance':
                    title = 'Net Bakiye';
                    color = '#3B82F6'; // blue
                    break;
            }
            
            // Update chart data
            this.charts.periodicMetrics.data.labels = labels;
            this.charts.periodicMetrics.data.datasets[0].label = title;
            this.charts.periodicMetrics.data.datasets[0].data = data;
            this.charts.periodicMetrics.data.datasets[0].backgroundColor = color;
            this.charts.periodicMetrics.data.datasets[0].borderColor = color;
            
            // Update chart
            this.charts.periodicMetrics.update();
            
        } catch (error) {
            console.error('Periodic Metrics Chart güncelleme hatası:', error);
        }
    }

    /**
     * Update performance history chart
     */
    updatePerformanceHistoryChart(historyType) {
        try {
            if (!this.charts.performanceHistory) return;
            
            let chartData;
            
            if (historyType === 'performance') {
                // Overall performance score
                chartData = this.preparePerformanceHistoryData();
                
                // Update chart type and dataset
                this.charts.performanceHistory.config.type = 'line';
                this.charts.performanceHistory.data.datasets = [{
                    label: 'Performans Skoru',
                    data: chartData.data,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }];
                
                // Update y axis
                this.charts.performanceHistory.options.scales.y.max = 100;
                this.charts.performanceHistory.options.scales.y.ticks.callback = function(value) {
                    return `${value}%`;
                };
                
            } else {
                // Detailed metrics
                chartData = this.prepareDetailedMetricsHistoryData();
                
                // Update chart type and datasets
                this.charts.performanceHistory.config.type = 'line';
                this.charts.performanceHistory.data.datasets = chartData.datasets;
                
                // Update y axis
                this.charts.performanceHistory.options.scales.y.max = 100;
                this.charts.performanceHistory.options.scales.y.ticks.callback = function(value) {
                    return `${value}%`;
                };
            }
            
            // Update chart labels
            this.charts.performanceHistory.data.labels = chartData.labels;
            
            // Update chart
            this.charts.performanceHistory.update();
            
        } catch (error) {
            console.error('Performance History Chart güncelleme hatası:', error);
        }
    }

    /**
     * Update transaction analysis chart
     */
    updateTransactionAnalysisChart(analysisType) {
        try {
            if (!this.charts.transactionAnalysis) return;
            
            // Prepare chart data
            const { labels, incomeData, expenseData } = this.prepareTransactionAnalysisData(analysisType);
            
            // Update chart data
            this.charts.transactionAnalysis.data.labels = labels;
            this.charts.transactionAnalysis.data.datasets[0].data = incomeData;
            this.charts.transactionAnalysis.data.datasets[1].data = expenseData;
            
            // Update chart
            this.charts.transactionAnalysis.update();
            
        } catch (error) {
            console.error('Transaction Analysis Chart güncelleme hatası:', error);
        }
    }

    /**
     * Update the dashboard
     */
    async update() {
        try {
            console.log('Operasyonel Dashboard güncelleniyor...');
            
            // Load fresh data
            await this.loadData();
            
            // Render metric cards
            this.renderMetricCards();
            
            // Render transaction table
            this.renderTransactionTable();
            
            // Update charts
            this.updateCharts();
            
            console.log('Operasyonel Dashboard güncellendi');
            
        } catch (error) {
            console.error('Dashboard güncelleme hatası:', error);
        }
    }

    /**
     * Update charts
     */
    async updateCharts() {
        try {
            // Update performance gauge
            if (this.charts.performanceGauge) {
                this.charts.performanceGauge.data.datasets[0].data = [
                    this.performance.overallScore * 100,
                    100 - (this.performance.overallScore * 100)
                ];
                
                this.charts.performanceGauge.data.datasets[0].backgroundColor = [
                    this.getScoreColor(this.performance.overallScore),
                    '#f1f5f9'
                ];
                
                this.charts.performanceGauge.update();
            }
            
            // Update periodic metrics chart
            if (this.charts.periodicMetrics) {
                // Get current metric type
                const metricTypeButton = document.querySelector('.chart-filter[data-metric].active');
                const metricType = metricTypeButton ? metricTypeButton.getAttribute('data-metric') : 'expense';
                
                // Update chart
                this.updatePeriodicMetricsChart(metricType);
            }
            
            // Update performance history chart
            if (this.charts.performanceHistory) {
                // Get current history type
                const historyTypeButton = document.querySelector('.chart-filter[data-history].active');
                const historyType = historyTypeButton ? historyTypeButton.getAttribute('data-history') : 'performance';
                
                // Update chart
                this.updatePerformanceHistoryChart(historyType);
            }
            
            // Update transaction analysis chart
            if (this.charts.transactionAnalysis) {
                // Get current analysis type
                const analysisTypeSelect = document.getElementById('transactionAnalysisType');
                const analysisType = analysisTypeSelect ? analysisTypeSelect.value : 'day-of-week';
                
                // Update chart
                this.updateTransactionAnalysisChart(analysisType);
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
            console.log('Operasyonel Dashboard temizleniyor...');
            
            // Destroy charts
            for (const chartName in this.charts) {
                if (this.charts[chartName]) {
                    this.charts[chartName].destroy();
                }
            }
            
            // Clear charts object
            this.charts = {};
            
            console.log('Operasyonel Dashboard temizlendi');
            
        } catch (error) {
            console.error('Dashboard temizleme hatası:', error);
        }
    }
}

// Export the class
const operationalDashboard = new OperationalDashboard(dataManager, chartManager);