// js/components/advancedAnalyticsDashboard.js - Gelişmiş Analitik Dashboard Bileşeni

class AdvancedAnalyticsDashboard {
    constructor(dataManager, chartManager, aiRecommendations) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.aiRecommendations = aiRecommendations;
        this.containerId = 'advancedAnalyticsDashboardContainer';
        this.container = null;
        this.charts = {};
        this.isInitialized = false;
    }

    /**
     * Initialize the Advanced Analytics Dashboard
     */
    async initialize() {
        console.log('Gelişmiş Analitik Dashboard başlatılıyor...');

        // Create container if it doesn't exist
        this.createContainer();
        
        // Create dashboard sections
        await this.createDashboard();
        
        // Initialize charts and visualizations
        await this.initializeVisualizations();
        
        // Create event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('Gelişmiş Analitik Dashboard başarıyla başlatıldı');
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
        this.container.className = 'advanced-analytics-dashboard mb-8';
        
        // Find where to insert the container
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            // Insert after the operational dashboard
            const operationalDashboard = document.getElementById('operationalDashboardContainer');
            if (operationalDashboard) {
                operationalDashboard.after(this.container);
            } else {
                // Insert after executive summary dashboard
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
    }

    /**
     * Create dashboard layout
     */
    async createDashboard() {
        // Create dashboard sections
        const dashboardHtml = `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Gelişmiş Analitik Dashboard</h3>
                    <button id="refreshAdvancedAnalytics" class="btn btn-secondary text-sm">
                        <i data-lucide="refresh-cw" style="width: 0.875rem; height: 0.875rem;"></i>
                        <span>Yenile</span>
                    </button>
                </div>
                
                <!-- Analytics Selection Tabs -->
                <div class="mb-6">
                    <div class="border-b border-gray-200">
                        <nav class="flex -mb-px">
                            <button class="analytics-tab-button active" data-tab="forecast">
                                <i data-lucide="trending-up" class="w-4 h-4 mr-2"></i>
                                Tahminleme
                            </button>
                            <button class="analytics-tab-button" data-tab="cohort">
                                <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                                Kohort Analizi
                            </button>
                            <button class="analytics-tab-button" data-tab="rfm">
                                <i data-lucide="bar-chart-2" class="w-4 h-4 mr-2"></i>
                                RFM Analizi
                            </button>
                            <button class="analytics-tab-button" data-tab="pareto">
                                <i data-lucide="pie-chart" class="w-4 h-4 mr-2"></i>
                                Pareto Analizi
                            </button>
                        </nav>
                    </div>
                </div>
                
                <!-- Forecast Analysis Section -->
                <div id="forecastAnalysisSection" class="analytics-section active">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div class="chart-card col-span-2">
                            <div class="chart-header">
                                <h3 class="chart-title">Gelir/Gider Tahmini</h3>
                                <div class="chart-subtitle text-sm text-gray-500">Son 6 ay verilerine dayanarak gelecek 3 ay için tahminleme</div>
                            </div>
                            <div class="chart-container">
                                <canvas id="forecastTrendChart" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">Tahmin Özeti</h3>
                            </div>
                            <div class="p-4">
                                <div id="forecastSummary" class="space-y-4">
                                    <!-- Forecast summary content will be populated dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">3 Aylık Tahmin Detayları</h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                        <th class="py-3 px-4 text-left">Ay</th>
                                        <th class="py-3 px-4 text-right">Tahmini Gelir</th>
                                        <th class="py-3 px-4 text-right">Tahmini Gider</th>
                                        <th class="py-3 px-4 text-right">Tahmini Bakiye</th>
                                        <th class="py-3 px-4 text-right">Önceki Aya Göre Değişim</th>
                                    </tr>
                                </thead>
                                <tbody id="forecastTableBody">
                                    <!-- Forecast table rows will be populated dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Cohort Analysis Section -->
                <div id="cohortAnalysisSection" class="analytics-section hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div class="chart-card col-span-2">
                            <div class="chart-header">
                                <h3 class="chart-title">Kohort Trend Analizi</h3>
                                <div class="chart-subtitle text-sm text-gray-500">Aynı zaman diliminde (ay) yapılan işlemlerin analizi</div>
                            </div>
                            <div class="chart-container">
                                <canvas id="cohortTrendChart" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">Gider/Gelir Oranı Değişimi</h3>
                            </div>
                            <div class="p-4">
                                <div id="cohortRatioSummary" class="space-y-4">
                                    <!-- Cohort ratio summary will be populated dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">Ay Bazlı Kohort Verileri</h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                        <th class="py-3 px-4 text-left">Ay</th>
                                        <th class="py-3 px-4 text-right">İşlem Sayısı</th>
                                        <th class="py-3 px-4 text-right">Gelir</th>
                                        <th class="py-3 px-4 text-right">Gider</th>
                                        <th class="py-3 px-4 text-right">Net Bakiye</th>
                                        <th class="py-3 px-4 text-right">Gider/Gelir Oranı</th>
                                    </tr>
                                </thead>
                                <tbody id="cohortTableBody">
                                    <!-- Cohort table rows will be populated dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- RFM Analysis Section -->
                <div id="rfmAnalysisSection" class="analytics-section hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">RFM Analizi</h3>
                                <div class="chart-subtitle text-sm text-gray-500">Recency (Yakınlık), Frequency (Sıklık), Monetary (Parasal)</div>
                            </div>
                            <div class="chart-container">
                                <canvas id="rfmRadarChart" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">RFM Skor Açıklaması</h3>
                            </div>
                            <div class="p-4">
                                <p class="text-sm text-gray-600 mb-3">Skorlar 1-5 arasındadır (5 en yüksek değer). Yüksek skor, finansal planlamanızda önemli kategorileri gösterir.</p>
                                <div class="grid grid-cols-3 gap-4">
                                    <div>
                                        <p class="text-sm font-medium">Yakınlık (R)</p>
                                        <p class="text-xs text-gray-600">Son harcamanın ne kadar yakın olduğu</p>
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium">Sıklık (F)</p>
                                        <p class="text-xs text-gray-600">Harcama sıklığı</p>
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium">Parasal (M)</p>
                                        <p class="text-xs text-gray-600">Harcama tutarı</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">Kategori RFM Skorları</h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                        <th class="py-3 px-4 text-left">Kategori</th>
                                        <th class="py-3 px-4 text-center">Yakınlık (R)</th>
                                        <th class="py-3 px-4 text-center">Sıklık (F)</th>
                                        <th class="py-3 px-4 text-center">Parasal (M)</th>
                                        <th class="py-3 px-4 text-center">RFM Skoru</th>
                                        <th class="py-3 px-4 text-right">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody id="rfmTableBody">
                                    <!-- RFM table rows will be populated dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Pareto Analysis Section -->
                <div id="paretoAnalysisSection" class="analytics-section hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">Pareto Analizi (80/20 Kuralı)</h3>
                                <div class="chart-subtitle text-sm text-gray-500">Harcamaların %80'inin kategorilerin %20'sinden gelip gelmediği</div>
                            </div>
                            <div class="chart-container">
                                <canvas id="paretoChart" height="300"></canvas>
                            </div>
                        </div>
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3 class="chart-title">Pareto Özeti</h3>
                            </div>
                            <div class="p-4">
                                <div id="paretoSummary" class="space-y-4">
                                    <!-- Pareto summary will be populated dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="chart-title">Kategori Harcama Dağılımı</h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                        <th class="py-3 px-4 text-left">Kategori</th>
                                        <th class="py-3 px-4 text-right">Toplam Harcama</th>
                                        <th class="py-3 px-4 text-center">Yüzde</th>
                                        <th class="py-3 px-4 text-center">Kümülatif Yüzde</th>
                                        <th class="py-3 px-4 text-center">İşlem Sayısı</th>
                                    </tr>
                                </thead>
                                <tbody id="paretoTableBody">
                                    <!-- Pareto table rows will be populated dynamically -->
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
    }

    /**
     * Initialize visualizations
     */
    async initializeVisualizations() {
        try {
            // Check if AI Recommendations is available
            if (!this.aiRecommendations) {
                console.warn('AI Recommendations component is not available for Advanced Analytics Dashboard');
                // Create placeholder visualizations
                this.createPlaceholderVisualizations();
                return;
            }
            
            // Get data from AI Recommendations
            const forecastData = this.aiRecommendations.forecastData || {};
            const cohortData = this.aiRecommendations.cohortData || {};
            const rfmData = this.aiRecommendations.rfmData || {};
            const paretoData = this.aiRecommendations.paretoData || {};
            
            // Initialize each analysis visualization
            if (forecastData && Object.keys(forecastData).length > 0) {
                this.initializeForecastVisualization(forecastData);
            } else {
                this.createPlaceholderVisualization('forecast');
            }
            
            if (cohortData && Object.keys(cohortData).length > 0) {
                this.initializeCohortVisualization(cohortData);
            } else {
                this.createPlaceholderVisualization('cohort');
            }
            
            if (rfmData && Object.keys(rfmData).length > 0) {
                this.initializeRFMVisualization(rfmData);
            } else {
                this.createPlaceholderVisualization('rfm');
            }
            
            if (paretoData && Object.keys(paretoData).length > 0) {
                this.initializeParetoVisualization(paretoData);
            } else {
                this.createPlaceholderVisualization('pareto');
            }
        } catch (error) {
            console.error('Visualizations başlatma hatası:', error);
        }
    }
    
    /**
     * Create placeholder visualizations for all analytics types
     */
    createPlaceholderVisualizations() {
        this.createPlaceholderVisualization('forecast');
        this.createPlaceholderVisualization('cohort');
        this.createPlaceholderVisualization('rfm');
        this.createPlaceholderVisualization('pareto');
    }
    
    /**
     * Create a placeholder visualization when no data is available
     */
    createPlaceholderVisualization(type) {
        const titles = {
            'forecast': 'Gelir ve Gider Tahminleri',
            'cohort': 'Kategori Kohort Analizi',
            'rfm': 'Kategori RFM Analizi',
            'pareto': 'Pareto Analizi (80/20 Kuralı)'
        };
        
        const descriptions = {
            'forecast': 'Gelecek dönem gelir ve gider tahminleri, tarihsel verileriniz üzerinden yapay zeka ile hesaplanır.',
            'cohort': 'Kategorilerinizin zaman içindeki davranışlarını gösteren kohort analizi.',
            'rfm': 'Kategorilerinizin sıklık, miktar ve güncelliğe göre önceliklendirilmesi.',
            'pareto': 'Harcamalarınızın %80\'inin hangi kategorilerin %20\'sinden geldiğini gösteren analiz.'
        };
        
        const containerId = `${type}VisualizationContainer`;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`${type} visualization container not found`);
            return;
        }
        
        container.innerHTML = `
            <div class="p-6 border border-gray-200 rounded-lg bg-white shadow-sm h-full">
                <h3 class="text-lg font-medium text-gray-900 mb-2">${titles[type]}</h3>
                <div class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                    <i data-lucide="bar-chart-3" class="w-12 h-12 text-gray-300 mb-3"></i>
                    <p class="text-gray-500 text-center">${descriptions[type]}</p>
                    <p class="text-sm text-gray-400 mt-3">Bu analiz için yeterli veri bulunmuyor.</p>
                </div>
            </div>
        `;
        
        // Initialize Lucide icons
        lucide.createIcons(container);
    }

    /**
     * Initialize Forecast Visualization
     */
    initializeForecastVisualization(forecastData) {
        try {
            // Initialize forecast trend chart
            const ctx = document.getElementById('forecastTrendChart');
            if (!ctx) return;
            
            // Create chart
            this.charts.forecastTrend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [...Array(6).fill(0).map((_, i) => `Son ${6-i} Ay`), 'Gelecek 1. Ay', 'Gelecek 2. Ay', 'Gelecek 3. Ay'],
                    datasets: [
                        {
                            label: 'Gelir',
                            data: [...forecastData.historicalIncome, ...forecastData.forecastIncome],
                            borderColor: 'rgba(16, 185, 129, 1)', // Green
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: false,
                            pointRadius: 4,
                            pointBackgroundColor: (context) => {
                                return context.dataIndex >= 6 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 1)';
                            },
                            pointStyle: (context) => {
                                return context.dataIndex >= 6 ? 'triangle' : 'circle';
                            },
                            segment: {
                                borderDash: (context) => {
                                    return context.p1DataIndex >= 5 ? [6, 6] : undefined;
                                }
                            }
                        },
                        {
                            label: 'Gider',
                            data: [...forecastData.historicalExpense, ...forecastData.forecastExpense],
                            borderColor: 'rgba(239, 68, 68, 1)', // Red
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: false,
                            pointRadius: 4,
                            pointBackgroundColor: (context) => {
                                return context.dataIndex >= 6 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 1)';
                            },
                            pointStyle: (context) => {
                                return context.dataIndex >= 6 ? 'triangle' : 'circle';
                            },
                            segment: {
                                borderDash: (context) => {
                                    return context.p1DataIndex >= 5 ? [6, 6] : undefined;
                                }
                            }
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
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatCurrency(context.raw);
                                },
                                title: function(tooltipItems) {
                                    const index = tooltipItems[0].dataIndex;
                                    if (index >= 6) {
                                        return 'Tahmin: ' + tooltipItems[0].label;
                                    }
                                    return tooltipItems[0].label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: (context) => {
                                    return context.index === 5 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)';
                                },
                                lineWidth: (context) => {
                                    return context.index === 5 ? 2 : 1;
                                }
                            }
                        }
                    }
                }
            });
            
            // Update forecast summary
            const summaryContainer = document.getElementById('forecastSummary');
            if (summaryContainer) {
                const nextMonthIncome = forecastData.forecastIncome[0];
                const nextMonthExpense = forecastData.forecastExpense[0];
                const predictedBalance = nextMonthIncome - nextMonthExpense;
                
                summaryContainer.innerHTML = `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">Gelecek Ay Tahmini</h4>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm text-gray-600">Tahmini Gelir</p>
                                <p class="text-xl font-bold text-green-600">${formatCurrency(nextMonthIncome)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Tahmini Gider</p>
                                <p class="text-xl font-bold text-red-600">${formatCurrency(nextMonthExpense)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Tahmini Bakiye</p>
                                <p class="text-xl font-bold ${predictedBalance >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(predictedBalance)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">Analiz Sonucu</h4>
                        <p class="text-sm text-gray-700">
                            ${predictedBalance >= 0 ? 
                                `Gelecek ay için pozitif bakiye bekleniyor. Bu tutarı tasarruf veya yatırım için değerlendirebilirsiniz.` : 
                                `Gelecek ay için negatif bakiye riski bulunuyor. Giderlerinizi azaltmak veya ek gelir kaynakları bulmak faydalı olabilir.`
                            }
                        </p>
                    </div>
                `;
            }
            
            // Update forecast table
            const tableBody = document.getElementById('forecastTableBody');
            if (tableBody) {
                let previousBalance = 0;
                
                for (let i = 0; i < 3; i++) {
                    const income = forecastData.forecastIncome[i];
                    const expense = forecastData.forecastExpense[i];
                    const balance = income - expense;
                    
                    // Calculate change from previous month
                    const change = i === 0 ? 0 : balance - previousBalance;
                    previousBalance = balance;
                    
                    const row = document.createElement('tr');
                    row.className = 'border-b hover:bg-gray-50';
                    
                    row.innerHTML = `
                        <td class="py-3 px-4 text-left font-medium">${i + 1}. Ay</td>
                        <td class="py-3 px-4 text-right text-green-600">${formatCurrency(income)}</td>
                        <td class="py-3 px-4 text-right text-red-600">${formatCurrency(expense)}</td>
                        <td class="py-3 px-4 text-right ${balance >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(balance)}</td>
                        <td class="py-3 px-4 text-right">
                            ${i === 0 ? '-' : `
                                <span class="${change >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${change >= 0 ? '+' : ''}${formatCurrency(change)}
                                </span>
                            `}
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                }
            }
        } catch (error) {
            console.error('Forecast visualization hatası:', error);
        }
    }

    /**
     * Initialize Cohort Visualization
     */
    initializeCohortVisualization(cohortData) {
        try {
            // Get cohort keys (months)
            const cohortKeys = Array.isArray(cohortData.months) ? cohortData.months : (cohortData.cohorts || []).sort();
            
            // Display last 6 months (or less if not enough data)
            const displayCohorts = cohortKeys.slice(-6);
            
            // Initialize cohort trend chart
            const ctx = document.getElementById('cohortTrendChart');
            if (!ctx || displayCohorts.length === 0) return;
            
            // Prepare chart data
            const labels = displayCohorts;
            const incomeData = [];
            const expenseData = [];
            const balanceData = [];
            
            displayCohorts.forEach(cohortKey => {
                const metrics = cohortData.metrics?.[cohortKey] || {};
                incomeData.push(metrics.totalIncome || 0);
                expenseData.push(metrics.totalExpense || 0);
                balanceData.push(metrics.netBalance || 0);
            });
            
            // Create chart
            this.charts.cohortTrend = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
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
                        },
                        {
                            label: 'Net Bakiye',
                            data: balanceData,
                            type: 'line',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1,
                            pointRadius: 4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Gelir/Gider'
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        y1: {
                            position: 'right',
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Net Bakiye'
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            });
            
            // Update cohort ratio summary
            const ratioContainer = document.getElementById('cohortRatioSummary');
            if (ratioContainer) {
                // Check if we have first and last month data
                if (cohortKeys.length >= 2) {
                    const firstMonth = cohortKeys[0];
                    const lastMonth = cohortKeys[cohortKeys.length - 1];
                    
                    const firstMonthMetrics = cohortData.metrics?.[firstMonth] || {};
                    const lastMonthMetrics = cohortData.metrics?.[lastMonth] || {};
                    
                    const firstMonthRatio = firstMonthMetrics.totalIncome > 0 ? 
                        firstMonthMetrics.totalExpense / firstMonthMetrics.totalIncome : 0;
                    
                    const lastMonthRatio = lastMonthMetrics.totalIncome > 0 ? 
                        lastMonthMetrics.totalExpense / lastMonthMetrics.totalIncome : 0;
                    
                    const change = lastMonthRatio - firstMonthRatio;
                    const percentChange = firstMonthRatio > 0 ? 
                        (change / firstMonthRatio) * 100 : 0;
                    
                    ratioContainer.innerHTML = `
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p class="text-sm text-gray-600">İlk Ay Oranı</p>
                                <p class="text-xl font-medium">${Math.round(firstMonthRatio * 100)}%</p>
                                <p class="text-xs text-gray-500">${firstMonth}</p>
                            </div>
                            <div class="text-2xl text-gray-400">
                                <i data-lucide="arrow-right"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Son Ay Oranı</p>
                                <p class="text-xl font-medium ${change <= 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${Math.round(lastMonthRatio * 100)}%
                                    ${change !== 0 ? `<span class="text-sm">(${change < 0 ? '' : '+'}${Math.round(percentChange)}%)</span>` : ''}
                                </p>
                                <p class="text-xs text-gray-500">${lastMonth}</p>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <h4 class="font-medium text-gray-900 mb-2">Trend Analizi</h4>
                            <p class="text-sm text-gray-700">
                                ${change <= 0 ? 
                                    `Gider/Gelir oranınız zaman içinde iyileşme gösteriyor. Bu, finansal sağlığınızın güçlendiğine işaret eder.` : 
                                    `Gider/Gelir oranınız zaman içinde artış gösteriyor. Bu trendin sürmesi durumunda finansal zorluklarla karşılaşabilirsiniz.`
                                }
                            </p>
                        </div>
                    `;
                    
                    // Initialize lucide icons
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons(ratioContainer);
                    }
                } else {
                    ratioContainer.innerHTML = `
                        <div class="p-4 bg-gray-50 rounded-lg text-center">
                            <p class="text-gray-500">Trend analizi için yeterli veri yok.</p>
                        </div>
                    `;
                }
            }
            
            // Update cohort table
            const tableBody = document.getElementById('cohortTableBody');
            if (tableBody) {
                displayCohorts.forEach(cohortKey => {
                    const metrics = cohortData.metrics?.[cohortKey] || {};
                    const totalIncome = metrics.totalIncome || 0;
                    const totalExpense = metrics.totalExpense || 0;
                    const ratio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
                    
                    const row = document.createElement('tr');
                    row.className = 'border-b hover:bg-gray-50';
                    
                    row.innerHTML = `
                        <td class="py-3 px-4 text-left font-medium">${cohortKey}</td>
                        <td class="py-3 px-4 text-right">${metrics.transactionCount || 0}</td>
                        <td class="py-3 px-4 text-right text-green-600">${formatCurrency(totalIncome)}</td>
                        <td class="py-3 px-4 text-right text-red-600">${formatCurrency(totalExpense)}</td>
                        <td class="py-3 px-4 text-right ${(metrics.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(metrics.netBalance || 0)}</td>
                        <td class="py-3 px-4 text-right ${ratio <= 80 ? 'text-green-600' : 'text-red-600'}">%${ratio.toFixed(1)}</td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Cohort visualization hatası:', error);
        }
    }

    /**
     * Initialize RFM Visualization
     */
    initializeRFMVisualization(rfmData) {
        try {
            const categoryRFM = rfmData.categoryRFM || {};
            
            // Get top categories by RFM score
            const topCategories = Object.entries(categoryRFM)
                .sort((a, b) => b[1].rfmScore - a[1].rfmScore)
                .slice(0, 10)
                .map(([categoryId, data]) => ({
                    id: categoryId,
                    ...data
                }));
            
            // Initialize RFM radar chart
            const ctx = document.getElementById('rfmRadarChart');
            if (!ctx || topCategories.length === 0) return;
            
            // Create chart
            this.charts.rfmRadar = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Yakınlık (R)', 'Sıklık (F)', 'Parasal (M)'],
                    datasets: topCategories.slice(0, 5).map((category, index) => {
                        const colors = [
                            { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.8)' },
                            { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.8)' },
                            { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.8)' },
                            { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.8)' },
                            { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.8)' }
                        ];
                        
                        return {
                            label: category.name,
                            data: [category.recencyScore, category.frequencyScore, category.monetaryScore],
                            backgroundColor: colors[index].bg,
                            borderColor: colors[index].border,
                            borderWidth: 2,
                            pointBackgroundColor: colors[index].border,
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: colors[index].border,
                            pointRadius: 4
                        };
                    })
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            min: 0,
                            max: 5,
                            ticks: {
                                stepSize: 1
                            },
                            pointLabels: {
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const category = topCategories[context.datasetIndex];
                                    const dimension = ['Yakınlık', 'Sıklık', 'Parasal'][context.dataIndex];
                                    let detail = '';
                                    
                                    if (dimension === 'Yakınlık') {
                                        detail = `${category.recency} gün önce`;
                                    } else if (dimension === 'Sıklık') {
                                        detail = `${category.frequency} işlem`;
                                    } else {
                                        detail = `${formatCurrency(category.monetary)}`;
                                    }
                                    
                                    return `${category.name} - ${dimension}: ${context.raw} (${detail})`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Update RFM table
            const tableBody = document.getElementById('rfmTableBody');
            if (tableBody) {
                topCategories.forEach(category => {
                    const row = document.createElement('tr');
                    row.className = 'border-b hover:bg-gray-50';
                    
                    row.innerHTML = `
                        <td class="py-3 px-4 text-left font-medium">${category.name}</td>
                        <td class="py-3 px-4 text-center">
                            ${this.renderRFMStars(category.recencyScore)}
                            <div class="text-xs text-gray-500">${category.recency} gün</div>
                        </td>
                        <td class="py-3 px-4 text-center">
                            ${this.renderRFMStars(category.frequencyScore)}
                            <div class="text-xs text-gray-500">${category.frequency} işlem</div>
                        </td>
                        <td class="py-3 px-4 text-center">
                            ${this.renderRFMStars(category.monetaryScore)}
                            <div class="text-xs text-gray-500">${formatCurrency(category.monetary)}</div>
                        </td>
                        <td class="py-3 px-4 text-center font-bold">${category.rfmScore.toFixed(1)}</td>
                        <td class="py-3 px-4 text-right text-red-600">${formatCurrency(category.monetary)}</td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('RFM visualization hatası:', error);
        }
    }

    /**
     * Initialize Pareto Visualization
     */
    initializeParetoVisualization(paretoData) {
        try {
            const paretoCategories = paretoData.paretoCategories || [];
            const allCategories = paretoData.allCategories || [];
            
            // Initialize Pareto chart
            const ctx = document.getElementById('paretoChart');
            if (!ctx || allCategories.length === 0) return;
            
            // Sort categories by total amount (descending)
            const sortedCategories = [...allCategories].sort((a, b) => b.total - a.total);
            
            // Prepare chart data
            const labels = sortedCategories.slice(0, 10).map(c => c.name);
            const amountData = sortedCategories.slice(0, 10).map(c => c.total);
            
            // Calculate cumulative percentages
            let cumulativeData = [];
            let runningSum = 0;
            const totalAmount = sortedCategories.reduce((sum, c) => sum + c.total, 0);
            
            sortedCategories.slice(0, 10).forEach(category => {
                runningSum += category.total;
                cumulativeData.push((runningSum / totalAmount) * 100);
            });
            
            // Create chart
            this.charts.pareto = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Harcama',
                            data: amountData,
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Kümülatif %',
                            data: cumulativeData,
                            type: 'line',
                            fill: false,
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1,
                            pointRadius: 4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Harcama Tutarı'
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        y1: {
                            position: 'right',
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Kümülatif Yüzde'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.dataset.label === 'Harcama') {
                                        return 'Harcama: ' + formatCurrency(context.raw);
                                    } else {
                                        return 'Kümülatif: ' + context.raw.toFixed(1) + '%';
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            // Update Pareto summary
            const summaryContainer = document.getElementById('paretoSummary');
            if (summaryContainer) {
                const categoryCount = paretoData.categoryCount || 0;
                const paretoCategoryCount = paretoData.paretoCategoryCount || 0;
                const paretoRatio = paretoCategoryCount / categoryCount;
                const topCategory = paretoCategories[0] || null;
                
                summaryContainer.innerHTML = `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">Pareto Analiz Sonucu</h4>
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-sm text-gray-600">Toplam Kategori</p>
                                <p class="text-xl font-medium">${categoryCount}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Pareto Kategorileri</p>
                                <p class="text-xl font-medium">${paretoCategoryCount}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Pareto Oranı</p>
                                <p class="text-xl font-medium">${(paretoRatio * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                        <p class="text-sm text-gray-700">
                            ${paretoRatio <= 0.2 ? 
                                `Pareto prensibi (80/20 kuralı) doğrulanıyor. Harcamalarınızın %80'i sadece ${paretoCategoryCount} kategoriden geliyor (tüm kategorilerin %${(paretoRatio * 100).toFixed(1)}'i).` : 
                                `Harcamalarınız kategoriler arasında nispeten dengeli dağılmış durumda. Bu durum bütçe kontrolü için olumlu bir gösterge olabilir.`
                            }
                        </p>
                    </div>
                    
                    ${topCategory ? `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-medium text-gray-900 mb-2">En Yüksek Harcama Kategorisi</h4>
                            <p class="text-lg font-medium">${topCategory.name}</p>
                            <p class="text-sm text-gray-600">Toplam: ${formatCurrency(topCategory.total)}</p>
                            <p class="text-sm text-gray-600">Yüzde: %${topCategory.percentage.toFixed(1)}</p>
                            <p class="text-sm text-gray-700 mt-2">
                                ${topCategory.percentage > 30 ? 
                                    `Bu kategoride yapacağınız küçük tasarruflar bile genel bütçenize önemli katkı sağlayabilir.` : 
                                    `Bu kategori en yüksek harcama kalemine sahip olsa da, dengeli bir dağılım gösteriyor.`
                                }
                            </p>
                        </div>
                    ` : ''}
                `;
            }
            
            // Update Pareto table
            const tableBody = document.getElementById('paretoTableBody');
            if (tableBody) {
                sortedCategories.forEach(category => {
                    const row = document.createElement('tr');
                    row.className = 'border-b hover:bg-gray-50';
                    
                    // Highlight Pareto categories
                    const isPareto = category.cumulativePercentage <= 80;
                    if (isPareto) {
                        row.classList.add('bg-red-50');
                    }
                    
                    row.innerHTML = `
                        <td class="py-3 px-4 text-left font-medium ${isPareto ? 'text-red-700' : ''}">${category.name}</td>
                        <td class="py-3 px-4 text-right ${isPareto ? 'text-red-700' : ''}">${formatCurrency(category.total)}</td>
                        <td class="py-3 px-4 text-center ${isPareto ? 'text-red-700' : ''}">${category.percentage.toFixed(1)}%</td>
                        <td class="py-3 px-4 text-center ${isPareto ? 'text-red-700' : ''}">
                            <div class="flex items-center">
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${category.cumulativePercentage}%"></div>
                                </div>
                                <span class="ml-2">${category.cumulativePercentage.toFixed(1)}%</span>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-center ${isPareto ? 'text-red-700' : ''}">${category.transactionCount}</td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Pareto visualization hatası:', error);
        }
    }

    /**
     * Render RFM stars (1-5)
     */
    renderRFMStars(score) {
        const fullStars = Math.floor(score);
        const remainder = score - fullStars;
        let html = '';
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            html += '<i data-lucide="star" class="w-4 h-4 inline-block text-amber-500"></i>';
        }
        
        // Add partial star if needed
        if (remainder >= 0.25) {
            if (remainder < 0.75) {
                html += '<i data-lucide="star-half" class="w-4 h-4 inline-block text-amber-500"></i>';
            } else {
                html += '<i data-lucide="star" class="w-4 h-4 inline-block text-amber-500"></i>';
            }
        }
        
        // Add empty stars
        const emptyStars = 5 - Math.ceil(score);
        for (let i = 0; i < emptyStars; i++) {
            html += '<i data-lucide="star" class="w-4 h-4 inline-block text-gray-300"></i>';
        }
        
        return html;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.analytics-tab-button');
        if (tabButtons) {
            tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all buttons and sections
                    document.querySelectorAll('.analytics-tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    document.querySelectorAll('.analytics-section').forEach(section => {
                        section.classList.add('hidden');
                    });
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    // Show selected section
                    const tabName = e.target.getAttribute('data-tab');
                    const section = document.getElementById(`${tabName}AnalysisSection`);
                    if (section) {
                        section.classList.remove('hidden');
                        
                        // Trigger chart resize
                        if (this.charts[`${tabName}Trend`] || this.charts[`${tabName}Chart`] || this.charts[`${tabName}Radar`]) {
                            setTimeout(() => {
                                window.dispatchEvent(new Event('resize'));
                            }, 100);
                        }
                    }
                });
            });
        }
        
        // Refresh button
        const refreshButton = document.getElementById('refreshAdvancedAnalytics');
        if (refreshButton) {
            refreshButton.addEventListener('click', async () => {
                // Regenerate AI recommendations
                await this.aiRecommendations.generateRecommendations();
                
                // Update visualizations
                this.cleanupCharts();
                await this.initializeVisualizations();
            });
        }
    }
    
    /**
     * Clean up charts
     */
    cleanupCharts() {
        // Destroy all charts
        for (const chartName in this.charts) {
            if (this.charts[chartName]) {
                this.charts[chartName].destroy();
                delete this.charts[chartName];
            }
        }
    }

    /**
     * Update the dashboard with latest data
     */
    async update() {
        if (!this.isInitialized) {
            await this.initialize();
            return;
        }
        
        console.log('Updating Advanced Analytics Dashboard...');
        
        try {
            // Clean up existing charts
            this.cleanupCharts();
            
            // Initialize visualizations with fresh data
            await this.initializeVisualizations();
            
            console.log('Advanced Analytics Dashboard updated successfully');
        } catch (error) {
            console.error('Error updating Advanced Analytics Dashboard:', error);
        }
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Clean up charts
        this.cleanupCharts();
        
        // Clean up event listeners
        // (would need to reference them specifically if we stored them)
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.isInitialized = false;
    }
}

// Export the class but don't initialize immediately to avoid circular dependency
const advancedAnalyticsDashboard = {
    instance: null,
    initialize: function() {
        if (!this.instance) {
            this.instance = new AdvancedAnalyticsDashboard(dataManager, chartManager, window.aiRecommendations);
        }
        return this.instance;
    },
    update: function() {
        if (this.instance) {
            return this.instance.update();
        }
    },
    cleanup: function() {
        if (this.instance) {
            return this.instance.cleanup();
        }
    }
};