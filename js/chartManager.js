// js/chartManager.js - Grafik Yönetimi

class ChartManager {
    constructor() {
        this.charts = {};
        this.defaultColors = {
            income: '#10B981',
            expense: '#EF4444',
            balance: '#3B82F6'
        };
        this.currentPeriod = 'monthly';
        this.currentCategoryType = 'expense';
        this.currentDashboardPeriod = 'thisMonth';
    }
    
    /**
     * Bir chart'ı güvenli bir şekilde yok et
     * Canvas üzerindeki tüm chart instance'larını temizler
     */
    safelyDestroyChart(ctx, chartInstance = null) {
        try {
            // Önce belirtilen instance varsa temizle
            if (chartInstance && typeof chartInstance.destroy === 'function') {
                try {
                    chartInstance.destroy();
                } catch (error) {
                    console.error('Error destroying chart instance:', error);
                }
            }

            // Canvas element ve ID kontrolü
            if (!ctx) return false;
            
            // Canvas DOM'da hala var mı kontrol et
            if (!document.body.contains(ctx)) {
                console.warn('Canvas is no longer in the document');
                return false;
            }
            
            // Chart.js global registry'de chart var mı kontrol et
            if (typeof Chart !== 'undefined') {
                // Chart.getChart API'sini kullan (Chart.js 3.x+)
                if (typeof Chart.getChart === 'function') {
                    try {
                        const existingChart = Chart.getChart(ctx);
                        if (existingChart) {
                            existingChart.destroy();
                        }
                    } catch (error) {
                        console.error('Error destroying chart from registry:', error);
                    }
                }
                
                // Alternatif yöntem - Chart.instances üzerinden kontrol
                if (Chart.instances) {
                    // Tüm chart instance'ları üzerinde döngü yap
                    Object.keys(Chart.instances).forEach(key => {
                        const chartInst = Chart.instances[key];
                        // Eğer chart aynı canvas üzerindeyse yok et
                        if (chartInst.canvas && chartInst.canvas === ctx) {
                            try {
                                chartInst.destroy();
                            } catch (error) {
                                console.error('Error destroying chart from instances:', error);
                            }
                        }
                    });
                }
            }
            
            // Canvas'ı temizle
            if (ctx.getContext) {
                try {
                    const context = ctx.getContext('2d');
                    context.clearRect(0, 0, ctx.width, ctx.height);
                } catch (error) {
                    console.error('Error clearing canvas context:', error);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error in safelyDestroyChart:', error);
            return false;
        }
    }
    
    /**
     * Tüm grafikleri güncelle
     */
    updateCharts() {
        console.log("Grafikler güncelleniyor...");
        
        // Dashboard grafikleri
        this.createMonthlyChart();
        this.createCategoryChart();
        this.createTagCloud();
        this.createBudgetPerformanceChart();
        this.addTrendIndicators();
        this.updateBudgetSummaryCards();
        
        // Diğer grafikler
        if (this.charts.accountChart) {
            // Mevcut hesap grafiğini bul ve yeniden oluştur
            const accountId = this.charts.accountChart.accountId;
            if (accountId) {
                this.createAccountChart(accountId, 'accountChart');
            }
        }
    }

    /**
     * Tüm grafikleri başlat
     */
    async initializeCharts() {
        try {
            // Eğer grafikler zaten oluşturulmuşsa önce hepsini yok et
            this.destroyAllCharts();
            
            // DOM hazır olana kadar bekle
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            this.setupChartEvents();
            
            // Canvas'ları kontrol et
            const monthlyCanvas = document.getElementById('monthlyChart');
            const categoryCanvas = document.getElementById('categoryChart');
            
            // Grafikleri sırayla oluştur
            if (monthlyCanvas) {
                try {
                    await this.createMonthlyChart();
                } catch (error) {
                    console.error('Monthly chart creation error:', error);
                }
            }
            
            if (categoryCanvas) {
                try {
                    await this.createCategoryChart();
                } catch (error) {
                    console.error('Category chart creation error:', error);
                }
            }
            
            try {
                await this.createTagCloud();
            } catch (error) {
                console.error('Tag cloud creation error:', error);
            }
            
            try {
                await this.createBudgetPerformanceChart();
            } catch (error) {
                console.error('Budget performance chart creation error:', error);
            }
            
            this.addTrendIndicators();
            this.updateBudgetSummaryCards();
        } catch (error) {
            console.error('Chart initialization error:', error);
        }
    }
    
    /**
     * Tüm grafikleri temizle
     */
    destroyAllCharts() {
        try {
            // Tüm grafikleri temizle
            for (const chartKey in this.charts) {
                if (this.charts[chartKey]) {
                    try {
                        const chartInstance = this.charts[chartKey];
                        const canvas = chartInstance.canvas;
                        
                        // safelyDestroyChart metodunu kullan
                        if (canvas) {
                            this.safelyDestroyChart(canvas, chartInstance);
                        } else {
                            // Canvas referansı yoksa direkt destroy çağır
                            chartInstance.destroy();
                        }
                    } catch (error) {
                        console.error(`Error destroying ${chartKey} chart:`, error);
                    }
                    this.charts[chartKey] = null;
                }
            }
        } catch (error) {
            console.error('Error destroying charts:', error);
        }
    }
    
    /**
     * Chart event listener'ları için setup
     */
    setupChartEvents() {
        // Chart period filter events
        const chartPeriodFilters = document.querySelectorAll('.chart-filter[data-period]');
        chartPeriodFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                // Remove active class from all period filters
                chartPeriodFilters.forEach(f => f.classList.remove('active'));
                // Add active class to clicked filter
                e.target.classList.add('active');
                
                // Update chart based on selected period
                this.currentPeriod = e.target.dataset.period;
                this.createMonthlyChart();
            });
        });
        
        // Chart type filter events for category chart
        const chartTypeFilters = document.querySelectorAll('.chart-filter[data-type]');
        chartTypeFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                try {
                    // Remove active class from all type filters
                    chartTypeFilters.forEach(f => f.classList.remove('active'));
                    // Add active class to clicked filter
                    e.currentTarget.classList.add('active');
                    
                    // Update chart based on selected type
                    this.currentCategoryType = e.currentTarget.dataset.type;
                    this.createCategoryChart();
                } catch (error) {
                    console.error("Error handling category type filter click:", error);
                }
            });
        });
        
        // Dashboard period selector
        const dashboardPeriod = document.getElementById('dashboardPeriod');
        if (dashboardPeriod) {
            dashboardPeriod.addEventListener('change', (e) => {
                this.currentDashboardPeriod = e.target.value;
                this.updateDashboard();
                
                // Also update KPI cards
                if (typeof app !== 'undefined' && app.kpiCards) {
                    let filters = {};
                    switch(this.currentDashboardPeriod) {
                        case 'thisMonth':
                            filters = getCurrentMonthRange();
                            break;
                        case 'lastMonth':
                            filters = getLastMonthRange();
                            break;
                        case 'thisYear':
                            filters = getCurrentYearRange();
                            break;
                        case 'allTime':
                            filters = {};
                            break;
                    }
                    // Normalize filters
                    const normalizedFilters = this.normalizeFilters(filters);
                    // Update KPI cards
                    app.kpiCards.update(normalizedFilters);
                }
                
                // Update budget period display
                const budgetPeriodInfo = document.getElementById('budgetPeriodInfo');
                if (budgetPeriodInfo) {
                    let periodText = '';
                    switch(this.currentDashboardPeriod) {
                        case 'thisMonth':
                            periodText = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                            break;
                        case 'lastMonth':
                            const lastMonth = new Date();
                            lastMonth.setMonth(lastMonth.getMonth() - 1);
                            periodText = lastMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                            break;
                        case 'thisYear':
                            periodText = new Date().getFullYear() + ' yılı';
                            break;
                        case 'allTime':
                            periodText = 'Tüm zamanlar';
                            break;
                    }
                    budgetPeriodInfo.textContent = periodText + ' bütçesi';
                }
            });
        }
        
        // Tag analysis type selector
        const tagAnalysisType = document.getElementById('tagAnalysisType');
        if (tagAnalysisType) {
            tagAnalysisType.addEventListener('change', (e) => {
                try {
                    this.createTagCloud(e.target.value);
                } catch (error) {
                    console.error("Error handling tag analysis type change:", error);
                }
            });
        }
        
        // Refresh dashboard button
        const refreshDashboard = document.getElementById('refreshDashboard');
        if (refreshDashboard) {
            refreshDashboard.addEventListener('click', () => {
                this.updateDashboard();
            });
        }
        
        // View all transactions link
        const viewAllTransactions = document.getElementById('viewAllTransactions');
        if (viewAllTransactions) {
            viewAllTransactions.addEventListener('click', () => {
                // Switch to transactions tab
                if (typeof app !== 'undefined') {
                    app.showTab('transactions');
                }
            });
        }
    }
    
    /**
     * Dashboard'daki tüm bileşenleri güncelle
     */
    updateDashboard() {
        try {
            let filters = {};
            
            switch(this.currentDashboardPeriod) {
                case 'thisMonth':
                    filters = getCurrentMonthRange();
                    break;
                case 'lastMonth':
                    filters = getLastMonthRange();
                    break;
                case 'thisYear':
                    filters = getCurrentYearRange();
                    break;
                case 'allTime':
                    filters = {};
                    break;
            }
        
            // Update summary stats
            const stats = dataManager.getSummaryStats(filters);
            if (typeof app !== 'undefined') {
                app.updateElement('totalIncome', formatCurrency(stats.totalIncome));
                app.updateElement('totalExpense', formatCurrency(stats.totalExpense));
                app.updateElement('netBalance', formatCurrency(stats.netBalance));
                
                // Also update trend indicators with normalized filters
                this.addTrendIndicators(this.normalizeFilters(filters));
            }
            
            // Ensure filter format is consistent before passing
            const normalizedFilters = this.normalizeFilters(filters);
            
            // Update charts with normalized filters
            this.updateCharts(normalizedFilters);
            
            // Update budget summary cards with the normalized filters
            this.updateBudgetSummaryCards(normalizedFilters);
            
            // Update tag cloud with the normalized filters
            this.createTagCloud(document.getElementById('tagAnalysisType')?.value || 'expense', normalizedFilters);
            
            // Update recent transactions with the normalized filters
            if (typeof app !== 'undefined') {
                app.updateRecentTransactions(normalizedFilters);
            }
        } catch (error) {
            console.error("Error updating dashboard:", error);
        }
    }

    /**
     * Normalize filter format to ensure consistency
     * @param {Object} filters - Filters to normalize
     * @returns {Object} - Normalized filters
     */
    normalizeFilters(filters = {}) {
        const normalized = {...filters};
        
        // Convert start/end to startDate/endDate if needed
        if (normalized.start && !normalized.startDate) {
            normalized.startDate = normalized.start;
            delete normalized.start;
        }
        
        if (normalized.end && !normalized.endDate) {
            normalized.endDate = normalized.end;
            delete normalized.end;
        }
        
        // Convert startDate/endDate to start/end if needed
        if (normalized.startDate && !normalized.start) {
            normalized.start = normalized.startDate;
        }
        
        if (normalized.endDate && !normalized.end) {
            normalized.end = normalized.endDate;
        }
        
        return normalized;
    }

    /**
     * Grafikleri güncelle
     * @param {Object} filters - Optional filters to apply to chart data
     */
    async updateCharts(filters = {}) {
        try {
            console.log("Updating charts with filters:", filters);
            
            // Grafikler varsa güncelle, yoksa oluştur
            if (this.charts.monthly) {
                await this.updateMonthlyChart(filters);
            } else {
                await this.createMonthlyChart(filters);
            }
            
            if (this.charts.category) {
                await this.updateCategoryChart(filters);
            } else {
                await this.createCategoryChart(filters);
            }
            
            // Bütçe Performans grafiğini güncelle
            if (this.charts.budgetPerformance) {
                await this.updateBudgetPerformanceChart(filters);
            } else {
                await this.createBudgetPerformanceChart(filters);
            }
            
            // Tag bulutunu güncelle
            await this.createTagCloud(document.getElementById('tagAnalysisType')?.value || 'expense', filters);
        } catch (error) {
            console.error('Grafikler güncellenirken hata oluştu:', error);
        }
    }

    /**
     * Aylık genel bakış grafiği
     * @param {Object} filters - Optional filters to apply to chart data
     */
    async createMonthlyChart(filters = {}) {
        try {
            const ctx = document.getElementById('monthlyChart');
            if (!ctx) return;
    
            // Önceki grafiği güvenli bir şekilde temizle
            if (this.charts.monthly) {
                await this.safelyDestroyChart(ctx, this.charts.monthly);
                this.charts.monthly = null;
                
                // Canvas'ın hala geçerli olduğundan emin ol
                if (!document.body.contains(ctx)) {
                    console.warn('Monthly chart canvas is no longer in the document');
                    return;
                }
                
                // Yeni chart oluşturmadan önce kısa bir gecikme ekle
                await new Promise(resolve => setTimeout(resolve, 50));
            }
    
            // Aylık verileri async olarak çek ve boş dizi kontrolü yap
            const monthlyData = await dataManager.getMonthlyStats(filters) || [];
            
            // Veri dizi değilse boş dizi kullan
            const safeMonthlyData = Array.isArray(monthlyData) ? monthlyData : [];
            
            // Canvas'ın hala geçerli olduğundan emin ol
            if (!document.body.contains(ctx)) {
                console.warn('Monthly chart canvas is no longer in the document');
                return;
            }
            
            this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: safeMonthlyData.map(d => d.monthName || ''),
                datasets: [
                    {
                        label: 'Gelir',
                        data: safeMonthlyData.map(d => d.totalIncome || 0),
                        borderColor: this.defaultColors.income,
                        backgroundColor: this.defaultColors.income + '20',
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.defaultColors.income,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    {
                        label: 'Gider',
                        data: safeMonthlyData.map(d => d.totalExpense || 0),
                        borderColor: this.defaultColors.expense,
                        backgroundColor: this.defaultColors.expense + '20',
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.defaultColors.expense,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    {
                        label: 'Net Bakiye',
                        data: safeMonthlyData.map(d => d.netBalance || 0),
                        borderColor: this.defaultColors.balance,
                        backgroundColor: this.defaultColors.balance + '20',
                        fill: '+1',
                        tension: 0.4,
                        pointBackgroundColor: this.defaultColors.balance,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11,
                                family: 'Inter'
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            },
                            font: {
                                size: 11,
                                family: 'Inter'
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        // Canvas yüksekliğini ayarla
        ctx.style.height = '300px';
        } catch (error) {
            console.error('Error creating monthly chart:', error);
        }
    }

    /**
     * Kategori dağılım grafiği
     * @param {Object} filters - Optional filters to apply to chart data
     */
    async createCategoryChart(filters = {}) {
        try {
            const ctx = document.getElementById('categoryChart');
            if (!ctx) return;

            // Önceki grafiği güvenli bir şekilde temizle
            if (this.charts.category) {
                await this.safelyDestroyChart(ctx, this.charts.category);
                this.charts.category = null;
                
                // Canvas'ın hala geçerli olduğundan emin ol
                if (!document.body.contains(ctx)) {
                    console.warn('Category chart canvas is no longer in the document');
                    return;
                }
                
                // Yeni chart oluşturmadan önce kısa bir gecikme ekle
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Kategori tipini kontrol et (gelir veya gider)
            const typeFilter = document.querySelector('.chart-filter[data-type].active')?.dataset.type || 'expense';

            // Kategori istatistikleri
            let dateFilters = {};
            
            // Eğer filtreler verilmişse ve startDate/endDate varsa, onları kullan
            if (filters && (filters.startDate || filters.endDate)) {
                dateFilters = {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                };
            } else {
                // Yoksa varsayılan olarak bu ayı kullan
                const monthRange = getCurrentMonthRange();
                dateFilters = {
                    startDate: monthRange.start,
                    endDate: monthRange.end
                };
            }
            
            console.log("Fetching category stats with filters:", { ...dateFilters, type: typeFilter });
            const categoryStats = await dataManager.getCategoryStats(typeFilter, dateFilters) || [];
            
            // Dizi kontrolü
            if (!Array.isArray(categoryStats)) {
                console.error('Category stats is not an array:', categoryStats);
                this.showEmptyChart(ctx, `Kategori verileri yüklenemedi`);
                return;
            }

            // En çok harcama yapılan 5 kategori
            const topCategories = categoryStats.slice(0, 5);
            
            if (topCategories.length === 0) {
                // Veri yoksa placeholder göster
                this.showEmptyChart(ctx, `Bu ay hiç ${typeFilter === 'income' ? 'gelir' : 'gider'} kaydı bulunmuyor`);
                return;
            }

            this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: topCategories.map(c => c.categoryName),
                datasets: [{
                    data: topCategories.map(c => c.amount),
                    backgroundColor: topCategories.map(c => c.categoryColor),
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                family: 'Inter'
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                
                                return data.labels.map((label, index) => {
                                    const value = data.datasets[0].data[index];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        pointStyle: 'circle'
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });

        // Canvas yüksekliğini ayarla
        ctx.style.height = '300px';
            
        // Kategori filtre butonlarına event listener ekle
        document.querySelectorAll('.chart-filter[data-type]').forEach(button => {
            if (!button.hasEventListener) {
                button.addEventListener('click', (e) => {
                    // Aktif filtreyi güncelle
                    document.querySelectorAll('.chart-filter[data-type]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.currentTarget.classList.add('active');
                    
                    // Grafiği güncelle
                    this.updateCategoryChart();
                });
                button.hasEventListener = true;
            }
        });
        } catch (error) {
            console.error("Error creating category chart:", error);
        }
    }

    /**
     * Boş grafik placeholder'ı
     */
    async showEmptyChart(ctx, message) {
        try {
            // Önceki chart'ı güvenli bir şekilde temizle
            if (this.charts.category) {
                await this.safelyDestroyChart(ctx, this.charts.category);
                this.charts.category = null;
                
                // Yeni chart oluşturmadan önce kısa bir gecikme ekle
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // Canvas'ın hala geçerli olduğundan emin ol
            if (!document.body.contains(ctx)) {
                console.warn('Canvas is no longer in the document when showing empty chart');
                return null;
            }

            this.charts.category = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Veri Yok'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#E5E7EB'],
                        borderWidth: 0
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
                            enabled: false
                        }
                    },
                    cutout: '60%'
                },
                plugins: [{
                    id: 'emptyMessage',
                    afterDraw: function(chart) {
                        const ctx = chart.ctx;
                        const width = chart.width;
                        const height = chart.height;
                        
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '14px Inter';
                        ctx.fillStyle = '#6B7280';
                        ctx.fillText(message, width / 2, height / 2);
                        ctx.restore();
                    }
                }]
            });

            return this.charts.category;
        } catch (error) {
            console.error('Error showing empty chart:', error);
            return null;
        }
    }

    /**
     * Aylık grafiği güncelle
     * @param {Object} filters - Optional filters to apply to chart data
     */
    async updateMonthlyChart(filters = {}) {
        try {
            if (!this.charts.monthly) {
                await this.createMonthlyChart();
                return;
            }
    
            const monthlyData = await dataManager.getMonthlyStats(filters) || [];
            
            // Ensure data is an array
            if (!Array.isArray(monthlyData)) {
                console.error('Monthly data is not an array:', monthlyData);
                return;
            }
            
            this.charts.monthly.data.labels = monthlyData.map(d => d.monthName || '');
            this.charts.monthly.data.datasets[0].data = monthlyData.map(d => d.totalIncome || 0);
            this.charts.monthly.data.datasets[1].data = monthlyData.map(d => d.totalExpense || 0);
            this.charts.monthly.data.datasets[2].data = monthlyData.map(d => d.netBalance || 0);
            
            this.charts.monthly.update('active');
        } catch (error) {
            console.error('Error updating monthly chart:', error);
        }
    }

    /**
     * Kategori grafiğini güncelle
     * @param {Object} filters - Optional filters to apply to chart data
     */
    async updateCategoryChart(filters = {}) {
        try {
            // Canvas'ı bul
            const ctx = document.getElementById('categoryChart');
            if (!ctx) return;
            
            // Önce mevcut grafiği temizle
            if (this.charts.category) {
                await this.safelyDestroyChart(ctx, this.charts.category);
                this.charts.category = null;
                
                // Temizleme sonrası kısa bir bekleme
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Yeni grafiği oluştur ve filtreleri geçir
            await this.createCategoryChart(filters);
        } catch (error) {
            console.error("Error updating category chart:", error);
        }
    }

    /**
     * Hesap bazlı rapor grafiği
     */
    createAccountChart(accountId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Mevcut canvas'ı temizle
        container.innerHTML = '';

        // Canvas oluştur
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        container.appendChild(canvas);

        const transactions = dataManager.getTransactions({ accountId });
        
        // Son 12 ayın verilerini hesapla
        const monthlyData = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            
            const monthTransactions = transactions.filter(t => 
                isDateInRange(t.date, monthStart, monthEnd)
            );
            
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expense = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            monthlyData.push({
                month: date.toLocaleDateString('tr-TR', { month: 'short' }),
                income,
                expense,
                balance: income - expense
            });
        }

        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Gelir',
                        data: monthlyData.map(d => d.income),
                        backgroundColor: this.defaultColors.income + '80',
                        borderColor: this.defaultColors.income,
                        borderWidth: 1
                    },
                    {
                        label: 'Gider',
                        data: monthlyData.map(d => d.expense),
                        backgroundColor: this.defaultColors.expense + '80',
                        borderColor: this.defaultColors.expense,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
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
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });

        return chart;
    }

    /**
     * Trend analizi grafiği
     */
    createTrendChart(containerId, period = 'monthly') {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Mevcut canvas'ı temizle
        container.innerHTML = '';

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        let data, labels;
        
        if (period === 'monthly') {
            const monthlyStats = dataManager.getMonthlyStats();
            data = monthlyStats.map(m => m.netBalance);
            labels = monthlyStats.map(m => m.monthName);
        } else if (period === 'weekly') {
            // Son 12 hafta
            data = [];
            labels = [];
            const now = new Date();
            
            for (let i = 11; i >= 0; i--) {
                const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
                const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
                
                const weekStats = dataManager.getSummaryStats({
                    startDate: weekStart.toISOString().split('T')[0],
                    endDate: weekEnd.toISOString().split('T')[0]
                });
                
                data.push(weekStats.netBalance);
                labels.push(`${weekStart.getDate()}/${weekStart.getMonth() + 1}`);
            }
        }

        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Net Bakiye Trendi',
                    data,
                    borderColor: this.defaultColors.balance,
                    backgroundColor: this.defaultColors.balance + '20',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.defaultColors.balance,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });

        return chart;
    }

    /**
     * Tüm grafikleri yok et
     */
    destroyCharts() {
        try {
            Object.keys(this.charts).forEach(key => {
                if (this.charts[key]) {
                    try {
                        const chartInstance = this.charts[key];
                        const canvas = chartInstance.canvas;
                        
                        // safelyDestroyChart metodunu kullan
                        if (canvas) {
                            this.safelyDestroyChart(canvas, chartInstance);
                        } else if (typeof chartInstance.destroy === 'function') {
                            // Canvas referansı yoksa direkt destroy çağır
                            chartInstance.destroy();
                        }
                    } catch (error) {
                        console.error(`Error destroying chart ${key}:`, error);
                    }
                    this.charts[key] = null;
                }
            });
            this.charts = {};
        } catch (error) {
            console.error('Error in destroyCharts:', error);
        }
    }
    
    /**
     * Tag cloud oluştur
     * @param {string} type - Tag type filter ('expense', 'income', or 'all')
     * @param {Object} filters - Optional date range filters
     */
    async createTagCloud(type = 'expense', filters = {}) {
        try {
            const tagCloudContainer = document.getElementById('tagCloud');
            if (!tagCloudContainer) return;
            
            // Get transactions based on type and filters
            let transactions = [];
            let queryParams = { ...filters };
            
            if (type !== 'all') {
                queryParams.type = type;
            }
            
            console.log("Fetching tag cloud transactions with filters:", queryParams);
            transactions = await dataManager.getTransactions(queryParams) || [];
            
            // Ensure transactions is an array
            if (!Array.isArray(transactions)) {
                console.error('Transactions is not an array:', transactions);
                tagCloudContainer.innerHTML = `
                    <div class="text-center p-8 text-gray-500">
                        <p>İşlem verileri yüklenemedi</p>
                    </div>
                `;
                return;
            }
        
        // Extract all tags and count occurrences
        const tagCounts = {};
        transactions.forEach(transaction => {
            if (transaction.tags && transaction.tags.length > 0) {
                transaction.tags.forEach(tag => {
                    if (tagCounts[tag]) {
                        tagCounts[tag].count++;
                        tagCounts[tag].amount += transaction.amount;
                    } else {
                        tagCounts[tag] = { 
                            count: 1, 
                            amount: transaction.amount, 
                            type: transaction.type 
                        };
                    }
                });
            }
        });
        
        // Convert to array and sort by count
        const tagArray = Object.keys(tagCounts).map(tag => ({
            name: tag,
            count: tagCounts[tag].count,
            amount: tagCounts[tag].amount,
            type: tagCounts[tag].type
        })).sort((a, b) => b.count - a.count);
        
        // Generate HTML for tag cloud
        if (tagArray.length === 0) {
            tagCloudContainer.innerHTML = `
                <div class="text-center p-8 text-gray-500">
                    <p>Henüz etiket kullanılmamış</p>
                </div>
            `;
            return;
        }
        
        // Calculate font sizes based on counts (min: 12px, max: 28px)
        const maxCount = Math.max(...tagArray.map(t => t.count));
        const minCount = Math.min(...tagArray.map(t => t.count));
        const fontSizeScale = (count) => {
            // If all tags have the same count, use a medium size
            if (maxCount === minCount) return 18;
            // Otherwise, scale between 12px and 28px
            return 12 + ((count - minCount) / (maxCount - minCount)) * 16;
        };
        
        // Generate tag elements with appropriate sizing
        tagCloudContainer.innerHTML = tagArray.slice(0, 30).map(tag => {
            const fontSize = fontSizeScale(tag.count);
            const fontWeight = fontSize > 20 ? 600 : fontSize > 15 ? 500 : 400;
            const tagColor = tag.type === 'income' ? this.defaultColors.income : this.defaultColors.expense;
            
            return `
                <div class="tag-item px-3 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
                     style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${tagColor};"
                     data-tag="${tag.name}" data-count="${tag.count}" data-amount="${tag.amount}">
                    ${escapeHtml(tag.name)}
                    <span class="text-xs text-gray-500 ml-1">(${tag.count})</span>
                </div>
            `;
        }).join('');
        
        // Add click event for tags
        tagCloudContainer.querySelectorAll('.tag-item').forEach(tagElement => {
            tagElement.addEventListener('click', (e) => {
                const tagName = e.currentTarget.dataset.tag;
                const tagCount = e.currentTarget.dataset.count;
                const tagAmount = e.currentTarget.dataset.amount;
                
                // Show a modal with transactions for this tag
                this.showTagDetails(tagName, tagCount, tagAmount);
            });
        });
        } catch (error) {
            console.error("Error creating tag cloud:", error);
            if (tagCloudContainer) {
                tagCloudContainer.innerHTML = `
                    <div class="text-center p-8 text-gray-500">
                        <p>Etiket verisi yüklenirken bir hata oluştu</p>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Etiket detaylarını gösteren modal
     */
    showTagDetails(tagName, tagCount, tagAmount) {
        // Find transactions with this tag
        const transactions = dataManager.getTransactions()
            .filter(t => t.tags && t.tags.includes(tagName))
            .slice(0, 10); // Limit to 10 transactions
            
        const modal = createModal(
            `"${tagName}" Etiketi Analizi`,
            `
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-gray-600">Kullanım Sayısı</p>
                            <p class="text-xl font-bold text-gray-800">${tagCount}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Toplam Tutar</p>
                            <p class="text-xl font-bold text-gray-800">${formatCurrency(tagAmount)}</p>
                        </div>
                    </div>
                </div>
                
                <h4 class="font-medium text-gray-900">Son İşlemler</h4>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    ${transactions.length > 0 ? 
                        transactions.map(t => `
                            <div class="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                                <div>
                                    <p class="text-sm font-medium">${escapeHtml(t.description || 'İşlem')}</p>
                                    <p class="text-xs text-gray-500">${formatDate(t.date)}</p>
                                </div>
                                <span class="font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                                </span>
                            </div>
                        `).join('') : 
                        '<p class="text-gray-500 text-sm">İşlem bulunamadı</p>'
                    }
                </div>
                
                <div class="mt-4">
                    <button id="viewAllTagTransactions" class="text-blue-600 hover:underline text-sm">
                        Tüm işlemleri görüntüle
                    </button>
                </div>
            </div>
            `,
            [
                {
                    text: 'Kapat',
                    class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                }
            ]
        );
        
        // Add event listener for "View All" button
        const viewAllBtn = document.getElementById('viewAllTagTransactions');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                // Close modal
                document.getElementById('modalContainer').innerHTML = '';
                
                // Switch to transactions tab and filter by tag
                if (typeof app !== 'undefined') {
                    app.showTab('transactions');
                    
                    // Set filter for this tag (would need to implement tag filtering in tableManager)
                    // For now, we can just alert the user
                    showToast(`"${tagName}" etiketli işlemler için filtreleme yapılıyor...`, 'info');
                    
                    // Future enhancement: Implement tag filtering in transactions table
                }
            });
        }
    }
    
    /**
     * Trend göstergelerini ekle
     */
    addTrendIndicators(currentFilters = {}) {
        // Get current period data
        const currentStats = dataManager.getSummaryStats(currentFilters);
        
        // Get previous period data
        let previousFilters = {};
        if (currentFilters.startDate && currentFilters.endDate) {
            // Calculate previous period
            const currentStart = new Date(currentFilters.startDate);
            const currentEnd = new Date(currentFilters.endDate);
            const duration = currentEnd.getTime() - currentStart.getTime();
            
            const previousEnd = new Date(currentStart);
            previousEnd.setDate(previousEnd.getDate() - 1);
            
            const previousStart = new Date(previousEnd);
            previousStart.setTime(previousStart.getTime() - duration);
            
            previousFilters = {
                startDate: previousStart.toISOString().split('T')[0],
                endDate: previousEnd.toISOString().split('T')[0]
            };
        }
        
        const previousStats = dataManager.getSummaryStats(previousFilters);
        
        // Calculate trends
        const incomeTrend = this.calculateTrend(currentStats.totalIncome, previousStats.totalIncome);
        const expenseTrend = this.calculateTrend(currentStats.totalExpense, previousStats.totalExpense);
        const balanceTrend = this.calculateTrend(currentStats.netBalance, previousStats.netBalance);
        
        // Update DOM elements
        this.updateTrendIndicator('incomeTrend', incomeTrend);
        this.updateTrendIndicator('expenseTrend', expenseTrend);
        this.updateTrendIndicator('balanceTrend', balanceTrend);
        this.updateTrendIndicator('monthlyTrend', balanceTrend);
    }
    
    /**
     * Trend hesapla
     */
    calculateTrend(currentValue, previousValue) {
        // If previous value is 0, can't calculate percentage change
        if (previousValue === 0) {
            return currentValue > 0 ? { direction: 'up', percentage: 100 } :
                   currentValue < 0 ? { direction: 'down', percentage: 100 } :
                   { direction: 'neutral', percentage: 0 };
        }
        
        const difference = currentValue - previousValue;
        const percentage = Math.abs(Math.round((difference / previousValue) * 100));
        
        return {
            direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral',
            percentage: percentage
        };
    }
    
    /**
     * Trend göstergesini güncelle
     */
    updateTrendIndicator(elementId, trend) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let iconName, colorClass;
        
        switch (trend.direction) {
            case 'up':
                iconName = 'trending-up';
                colorClass = 'text-green-600';
                break;
            case 'down':
                iconName = 'trending-down';
                colorClass = 'text-red-600';
                break;
            default:
                iconName = 'minus';
                colorClass = 'text-gray-500';
                break;
        }
        
        element.className = `stat-trend ${trend.direction} ${colorClass}`;
        element.innerHTML = `
            <i data-lucide="${iconName}" class="w-4 h-4"></i>
            <span>${trend.percentage}% ${
                trend.direction === 'up' ? 'artış' : 
                trend.direction === 'down' ? 'azalış' : 
                'değişim yok'
            }</span>
        `;
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Bütçe Performans Grafiği
     * @param {Object} filters - Optional filters to apply to chart data
     */
    async createBudgetPerformanceChart(filters = {}) {
        const ctx = document.getElementById('budgetPerformanceChart');
        if (!ctx) return;

        // Önceki grafiği güvenli bir şekilde temizle
        if (this.charts.budgetPerformance) {
            await this.safelyDestroyChart(ctx, this.charts.budgetPerformance);
            this.charts.budgetPerformance = null;
            
            // Canvas'ın hala geçerli olduğundan emin ol
            if (!document.body.contains(ctx)) {
                console.warn('Budget performance chart canvas is no longer in the document');
                return;
            }
            
            // Yeni chart oluşturmadan önce kısa bir gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Sağlanan filtrelerden yıl ve ay belirle, veya varsayılan değerleri kullan
        let dateFilters = {...filters}; // Sağlanan filtreleri kopyala
        const year = new Date().getFullYear();
        let month = null;
        
        // Filtreler verilmişse onları kullan, yoksa dashboard periyoduna göre oluştur
        if (!dateFilters.startDate && !dateFilters.endDate) {
            switch(this.currentDashboardPeriod) {
                case 'thisMonth':
                    dateFilters = getCurrentMonthRange();
                    month = new Date().getMonth() + 1;
                    break;
                case 'lastMonth':
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    month = lastMonth.getMonth() + 1;
                    dateFilters = getLastMonthRange();
                    break;
                case 'thisYear':
                    dateFilters = getCurrentYearRange();
                    break;
                case 'allTime':
                    dateFilters = {};
                    break;
            }
        } else {
            // Tarihe göre ay tespiti yap
            if (dateFilters.startDate) {
                const startDate = new Date(dateFilters.startDate);
                month = startDate.getMonth() + 1;
            }
        }
        
        console.log("Using budget performance filters:", dateFilters, "month:", month);

        // Bütçe analizi verilerini al (async)
        const budgetAnalysis = await dataManager.getBudgetAnalysis(year, month) || [];
        
        // Ensure budgetAnalysis is an array
        if (!Array.isArray(budgetAnalysis)) {
            console.error('Budget analysis is not an array:', budgetAnalysis);
            this.showEmptyChart(ctx, 'Bütçe verileri yüklenemedi');
            return;
        }
        
        if (budgetAnalysis.length === 0) {
            // Veri yoksa placeholder göster
            this.showEmptyChart(ctx, 'Bu dönem için bütçe planı bulunmuyor');
            return;
        }

        // Sadece ilk 8 kategoriyi göster
        const topCategories = budgetAnalysis.slice(0, 8);
        
        // Verileri hazırla
        const labels = topCategories.map(item => item.categoryName);
        const plannedData = topCategories.map(item => item.plannedAmount);
        const actualData = topCategories.map(item => item.actualAmount);
        const varianceData = topCategories.map(item => item.variance);
        
        // Variance renkleri belirle (kırmızı: aşım, yeşil: altında)
        const varianceColors = varianceData.map(variance => 
            variance > 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)'
        );

        this.charts.budgetPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Planlanan',
                        data: plannedData,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Gerçekleşen',
                        data: actualData,
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.x;
                                return `${label}: ${formatCurrency(value)}`;
                            },
                            afterBody: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const variance = varianceData[index];
                                const varianceText = variance > 0 
                                    ? `Aşım: ${formatCurrency(variance)}` 
                                    : `Tasarruf: ${formatCurrency(Math.abs(variance))}`;
                                
                                const variancePercent = Math.round((variance / plannedData[index]) * 100);
                                const percentText = `(${variancePercent}%)`;
                                
                                return [`Fark: ${varianceText} ${percentText}`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            },
                            font: {
                                size: 11,
                                family: 'Inter'
                            }
                        }
                    },
                    y: {
                        stacked: false,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11,
                                family: 'Inter'
                            }
                        }
                    }
                }
            }
        });

        // Canvas yüksekliğini ayarla
        ctx.style.height = '300px';
    }

    /**
     * Bütçe Performans grafiğini güncelle
     * @param {Object} filters - Optional filters to apply to chart data
     */
    updateBudgetPerformanceChart(filters = {}) {
        this.createBudgetPerformanceChart(filters);
    }

    /**
     * Bütçe Performans Özeti Kartlarını Güncelle
     * @param {Object} filters - Optional filters to apply to card data
     */
    updateBudgetSummaryCards(filters = {}) {
        // Sağlanan filtrelerden yıl ve ay belirle, veya varsayılan değerleri kullan
        let dateFilters = {...filters}; // Sağlanan filtreleri kopyala
        const year = new Date().getFullYear();
        let month = null;
        let periodText = '';
        
        // Filtreler verilmişse onları kullan, yoksa dashboard periyoduna göre oluştur
        if (!dateFilters.startDate && !dateFilters.endDate) {
            switch(this.currentDashboardPeriod) {
                case 'thisMonth':
                    dateFilters = getCurrentMonthRange();
                    month = new Date().getMonth() + 1;
                    periodText = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                    break;
                case 'lastMonth':
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    month = lastMonth.getMonth() + 1;
                    periodText = lastMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                    dateFilters = getLastMonthRange();
                    break;
                case 'thisYear':
                    dateFilters = getCurrentYearRange();
                    periodText = year + ' yılı';
                    break;
                case 'allTime':
                    dateFilters = {};
                    periodText = 'Tüm zamanlar';
                    break;
            }
        } else {
            // Tarihe göre dönem metnini belirle
            if (dateFilters.startDate && dateFilters.endDate) {
                const startDate = new Date(dateFilters.startDate);
                const endDate = new Date(dateFilters.endDate);
                
                // Aynı ay içindeyse
                if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
                    month = startDate.getMonth() + 1;
                    periodText = startDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                } else {
                    periodText = `${startDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                }
            }
        }
        
        console.log("Updating budget summary cards with filters:", dateFilters, "periodText:", periodText);

        // Bütçe dönemi bilgisini güncelle
        const budgetPeriodInfo = document.getElementById('budgetPeriodInfo');
        if (budgetPeriodInfo) {
            budgetPeriodInfo.textContent = periodText + ' bütçesi';
        }

        // Özet istatistikleri al
        const stats = dataManager.getSummaryStats(dateFilters);
        
        // Kart elementlerini güncelle
        const elements = {
            'plannedIncome': { id: 'plannedIncome', value: stats.plannedIncome },
            'plannedExpense': { id: 'plannedExpense', value: stats.plannedExpense },
            'incomeVariance': { 
                id: 'incomeVariance', 
                value: stats.incomeVariance, 
                isVariance: true, 
                planned: stats.plannedIncome 
            },
            'expenseVariance': { 
                id: 'expenseVariance', 
                value: stats.expenseVariance, 
                isVariance: true, 
                planned: stats.plannedExpense,
                isExpense: true 
            }
        };

        Object.values(elements).forEach(element => {
            const el = document.getElementById(element.id);
            if (!el) return;
            
            if (element.isVariance) {
                // Sapma değeri için özel format
                const value = element.value;
                const isPositive = element.isExpense ? value < 0 : value > 0;
                const prefix = isPositive ? '+' : '';
                const percentage = element.planned !== 0 
                    ? Math.round((value / element.planned) * 100) 
                    : 0;
                
                const classColor = isPositive ? 'text-green-700' : 'text-red-700';
                
                el.className = `text-lg font-bold ${classColor}`;
                el.textContent = `${prefix}${formatCurrency(value)} (${percentage}%)`;
            } else {
                // Normal değerler için
                el.textContent = formatCurrency(element.value);
            }
        });
    }
}

// Global instance
const chartManager = new ChartManager();