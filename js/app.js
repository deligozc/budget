// js/app.js - Ana Uygulama Kontrolcüsü

class BudgetTrackerApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.initialized = false;
        this.init();
    }

    /**
     * Uygulamayı başlat
     */
    async init() {
        try {
            console.log('Bütçe Takibi uygulaması başlatılıyor...');
            
            // Event listener'ları kurulumu
            this.setupEventListeners();
            
            // İlk yükleme
            await this.loadInitialData();
            
            // Dashboard'ı başlat
            this.initializeDashboard();
            
            // İlk tab'ı göster
            this.showTab('dashboard');
            
            this.initialized = true;
            console.log('Uygulama başarıyla başlatıldı');
            
            // Hoş geldin mesajı
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('Uygulama başlatma hatası:', error);
            showToast('Uygulama başlatılırken hata oluştu!', 'error');
        }
    }

    /**
     * Event listener'ları kurulumu
     */
    setupEventListeners() {
        try {
            // Tüm İşlemleri Temizle butonu
            document.getElementById('clearTransactionsBtn')?.addEventListener('click', () => {
                try {
                    this.showClearTransactionsConfirmation();
                } catch (error) {
                    console.error('Clear transactions error:', error);
                }
            });
            
            // Tab butonları
            const tabs = ['dashboard', 'categories', 'transactions', 'reports'];
            tabs.forEach(tab => {
                const tabElement = document.getElementById(`${tab}Tab`);
                if (tabElement) {
                    tabElement.addEventListener('click', async () => {
                        try {
                            await this.showTab(tab);
                        } catch (error) {
                            console.error(`Error showing tab ${tab}:`, error);
                            // Show error message to user
                            const content = document.getElementById(`${tab}Content`);
                            if (content) {
                                content.innerHTML = `
                                    <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 my-4">
                                        <p class="font-medium">Bir hata oluştu</p>
                                        <p class="text-sm">${error.message || 'Bilinmeyen hata'}</p>
                                        <button class="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md text-sm" 
                                                onclick="location.reload()">Sayfayı Yenile</button>
                                    </div>
                                `;
                                // Make the content visible
                                content.classList.remove('hidden');
                            }
                        }
                    });
                }
            });

            // Sayfa yüklenme eventi
            document.addEventListener('DOMContentLoaded', () => {
                try {
                    if (!this.initialized) {
                        this.init();
                    }
                } catch (error) {
                    console.error('Initialization error:', error);
                }
            });

            // Sayfa kapatılırken otomatik yedekleme
            window.addEventListener('beforeunload', () => {
                try {
                    exportImportManager.createAutoBackup();
                } catch (error) {
                    console.error('Otomatik yedekleme hatası:', error);
                }
            });

            // Klavye kısayolları
            document.addEventListener('keydown', (e) => {
                try {
                    this.handleKeyboardShortcuts(e);
                } catch (error) {
                    console.error('Keyboard shortcut error:', error);
                }
            });

            // Responsive menü (mobil)
            this.setupMobileNavigation();
        } catch (error) {
            console.error('Event listener setup error:', error);
        }
    }

    /**
     * İlk veri yüklemesi
     */
    async loadInitialData() {
        // Veriler zaten dataManager'da yüklü, sadece kontrol edelim
        const data = dataManager.getData();
        if (!data) {
            console.log('İlk kez kullanım - örnek veriler oluşturuluyor');
            await this.createSampleData();
        }
    }

    /**
     * Örnek veriler oluştur (ilk kullanım için)
     */
    async createSampleData() {
        try {
            // Örnek hesap ekle
            const sampleAccount = dataManager.addAccount({
                name: 'Ana Hesap',
                type: 'bank',
                balance: 5000,
                color: '#3B82F6'
            });

            // Örnek kategoriler zaten dataManager'da var
            const categories = dataManager.getCategories();
            const incomeCategory = categories.income[0];
            const expenseCategory = categories.expense[0];

            if (sampleAccount && incomeCategory && expenseCategory) {
                // Örnek işlemler ekle
                const sampleTransactions = [
                    {
                        amount: 8000,
                        type: 'income',
                        categoryId: incomeCategory.id,
                        accountId: sampleAccount.id,
                        description: 'Maaş',
                        date: new Date().toISOString().split('T')[0],
                        tags: ['maaş', 'gelir']
                    },
                    {
                        amount: 500,
                        type: 'expense',
                        categoryId: expenseCategory.id,
                        accountId: sampleAccount.id,
                        description: 'Haftalık market alışverişi',
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        tags: ['gıda', 'temel ihtiyaç']
                    }
                ];

                sampleTransactions.forEach(transaction => {
                    dataManager.addTransaction(transaction);
                });

                console.log('Örnek veriler oluşturuldu');
            }
        } catch (error) {
            console.error('Örnek veri oluşturma hatası:', error);
        }
    }

    /**
     * Dashboard'ı başlat
     */
    async initializeDashboard() {
        try {
            // Grafikleri başlatmadan önce önce veri yükle
            await this.updateDashboard();
            
            // Chart elementlerinin DOM'da olduğundan emin ol
            const monthlyChartEl = document.getElementById('monthlyChart');
            const categoryChartEl = document.getElementById('categoryChart');
            
            if (!monthlyChartEl || !categoryChartEl) {
                console.warn('Chart elementleri DOM\'da bulunamadı, farklı bir sekme olabilir');
                return;
            }
            
            // Chart'ları başlatmadan önce kütüphanelerin ve chartManager'ın yüklendiğinden emin ol
            if (typeof Chart !== 'undefined' && typeof chartManager !== 'undefined') {
                // Önceki grafikleri temizle
                if (typeof chartManager.destroyAllCharts === 'function') {
                    chartManager.destroyAllCharts();
                }
                
                // Biraz bekle ve sonra grafikleri başlat
                await new Promise(resolve => setTimeout(resolve, 100));
                await chartManager.initializeCharts();
                
                // Advanced KPI Cards'ı başlat
                if (typeof KPICards !== 'undefined') {
                    await this.initializeKPICards();
                } else {
                    console.warn('KPICards bileşeni yüklenemedi');
                }
                
                // Interactive Charts'ı başlat
                if (typeof InteractiveCharts !== 'undefined') {
                    await this.initializeInteractiveCharts();
                } else {
                    console.warn('InteractiveCharts bileşeni yüklenemedi');
                }
                
                // Quick Actions'ı başlat
                if (typeof QuickActions !== 'undefined') {
                    await this.initializeQuickActions();
                } else {
                    console.warn('QuickActions bileşeni yüklenemedi');
                }
                
                // AI Recommendations'ı başlat
                if (typeof AIRecommendations !== 'undefined') {
                    await this.initializeAIRecommendations();
                } else {
                    console.warn('AIRecommendations bileşeni yüklenemedi');
                }
                
                // Drag Drop Widgets'ı başlat
                if (typeof dragDropWidgets !== 'undefined') {
                    await this.initializeDragDropWidgets();
                } else {
                    console.warn('DragDropWidgets bileşeni yüklenemedi');
                }
                
                // Executive Summary Dashboard'ı başlat
                if (typeof executiveSummaryDashboard !== 'undefined') {
                    await this.initializeExecutiveSummaryDashboard();
                } else {
                    console.warn('ExecutiveSummaryDashboard bileşeni yüklenemedi');
                }
                
                // Operational Dashboard'ı başlat
                if (typeof operationalDashboard !== 'undefined') {
                    await this.initializeOperationalDashboard();
                } else {
                    console.warn('OperationalDashboard bileşeni yüklenemedi');
                }
                
                // Advanced Analytics Dashboard'ı başlat
                if (typeof advancedAnalyticsDashboard !== 'undefined') {
                    await this.initializeAdvancedAnalyticsDashboard();
                } else {
                    console.warn('AdvancedAnalyticsDashboard bileşeni yüklenemedi');
                }
            } else {
                console.warn('Chart.js veya chartManager henüz yüklenmedi, grafik gösterilemiyor');
                
                // ChartManager yüklenene kadar bekle (maksimum 2 saniye)
                if (typeof Chart !== 'undefined') {
                    console.log('chartManager için bekleniyor...');
                    
                    // Basit bir bekleme mekanizması
                    await new Promise(resolve => {
                        let attempts = 0;
                        const checkInterval = setInterval(() => {
                            attempts++;
                            if (typeof chartManager !== 'undefined') {
                                clearInterval(checkInterval);
                                console.log('chartManager yüklendi, grafikler başlatılıyor');
                                
                                // Önceki grafikleri temizle
                                if (typeof chartManager.destroyAllCharts === 'function') {
                                    chartManager.destroyAllCharts();
                                }
                                
                                // Biraz bekle ve sonra grafikleri başlat
                                setTimeout(() => {
                                    chartManager.initializeCharts();
                                    
                                    // Yeni bileşenleri başlat
                                    if (typeof KPICards !== 'undefined') this.initializeKPICards();
                                    if (typeof InteractiveCharts !== 'undefined') this.initializeInteractiveCharts();
                                    if (typeof QuickActions !== 'undefined') this.initializeQuickActions();
                                    if (typeof AIRecommendations !== 'undefined') this.initializeAIRecommendations();
                                    if (typeof dragDropWidgets !== 'undefined') this.initializeDragDropWidgets();
                                    if (typeof executiveSummaryDashboard !== 'undefined') this.initializeExecutiveSummaryDashboard();
                                    if (typeof operationalDashboard !== 'undefined') this.initializeOperationalDashboard();
                                    if (typeof advancedAnalyticsDashboard !== 'undefined') this.initializeAdvancedAnalyticsDashboard();
                                    
                                    resolve();
                                }, 100);
                            } else if (attempts >= 10) { // 10 x 200ms = 2 saniye
                                clearInterval(checkInterval);
                                console.warn('chartManager 2 saniye içinde yüklenemedi');
                                resolve();
                            }
                        }, 200);
                    });
                }
            }
        } catch (error) {
            console.error('Dashboard başlatılırken hata:', error);
        }
    }

    /**
     * Tab göster
     */
    async showTab(tabName) {
        // Tüm tab'ları gizle
        const tabs = ['dashboard', 'categories', 'transactions', 'reports'];
        tabs.forEach(tab => {
            const content = document.getElementById(`${tab}Content`);
            const button = document.getElementById(`${tab}Tab`);
            
            if (content && button) {
                if (tab === tabName) {
                    content.classList.remove('hidden');
                    button.classList.remove('nav-tab');
                    button.classList.add('nav-tab', 'active');
                } else {
                    content.classList.add('hidden');
                    button.classList.remove('active');
                    button.classList.add('nav-tab');
                }
            }
        });

        this.currentTab = tabName;

        // Tab'a özel işlemler
        switch (tabName) {
            case 'dashboard':
                await this.updateDashboard();
                if (typeof Chart !== 'undefined' && typeof chartManager !== 'undefined') {
                    chartManager.updateCharts();
                } else {
                    console.warn('Chart.js veya chartManager yüklenmemiş, grafikler güncellenemiyor');
                }
                this.updateRecentTransactions();
                
                // Normalize filters for consistency
                const normalizedFilters = chartManager.normalizeFilters({});
                
                // Yeni bileşenleri güncelle
                if (this.kpiCards && typeof this.kpiCards.update === 'function') {
                    this.kpiCards.update(normalizedFilters);
                } else if (typeof KPICards !== 'undefined') {
                    this.initializeKPICards();
                    // Also update with filters after initialization
                    if (this.kpiCards && typeof this.kpiCards.update === 'function') {
                        this.kpiCards.update(normalizedFilters);
                    }
                }
                
                if (this.interactiveCharts && typeof this.interactiveCharts.update === 'function') {
                    this.interactiveCharts.update();
                } else if (typeof InteractiveCharts !== 'undefined') {
                    this.initializeInteractiveCharts();
                }
                
                if (this.quickActions && typeof this.quickActions.update === 'function') {
                    this.quickActions.update();
                } else if (typeof QuickActions !== 'undefined') {
                    this.initializeQuickActions();
                }
                
                if (this.aiRecommendations && typeof this.aiRecommendations.update === 'function') {
                    this.aiRecommendations.update();
                } else if (typeof AIRecommendations !== 'undefined') {
                    this.initializeAIRecommendations();
                }
                
                // DragDropWidgets bileşenini güncelle
                if (this.dragDropWidgets && typeof this.dragDropWidgets.update === 'function') {
                    this.dragDropWidgets.update();
                } else if (typeof dragDropWidgets !== 'undefined') {
                    this.initializeDragDropWidgets();
                }
                
                // Executive Summary Dashboard bileşenini güncelle
                if (this.executiveSummaryDashboard && typeof this.executiveSummaryDashboard.update === 'function') {
                    this.executiveSummaryDashboard.update();
                } else if (typeof executiveSummaryDashboard !== 'undefined') {
                    this.initializeExecutiveSummaryDashboard();
                }
                
                // Operational Dashboard bileşenini güncelle
                if (this.operationalDashboard && typeof this.operationalDashboard.update === 'function') {
                    this.operationalDashboard.update();
                } else if (typeof operationalDashboard !== 'undefined') {
                    this.initializeOperationalDashboard();
                }
                
                // Advanced Analytics Dashboard bileşenini güncelle
                if (this.advancedAnalyticsDashboard && typeof this.advancedAnalyticsDashboard.update === 'function') {
                    this.advancedAnalyticsDashboard.update();
                } else if (typeof advancedAnalyticsDashboard !== 'undefined' && typeof advancedAnalyticsDashboard.update === 'function') {
                    advancedAnalyticsDashboard.update();
                } else if (typeof advancedAnalyticsDashboard !== 'undefined') {
                    this.initializeAdvancedAnalyticsDashboard();
                }
                break;
            
            case 'categories':
                if (typeof categoryManager !== 'undefined') {
                    categoryManager.renderCategories();
                } else {
                    console.warn('categoryManager yüklenmemiş, kategoriler görüntülenemiyor');
                }
                break;
            
            case 'transactions':
                if (typeof tableManager !== 'undefined') {
                    try {
                        if (!tableManager.table) {
                            await tableManager.initializeTable();
                        } else {
                            await tableManager.refreshTable();
                        }
                    } catch (error) {
                        console.error('Error showing tab transactions:', error);
                    }
                } else {
                    console.warn('tableManager yüklenmemiş, işlem tablosu görüntülenemiyor');
                }
                break;
                
            case 'reports':
                if (typeof Chart !== 'undefined' && typeof reportManager !== 'undefined') {
                    try {
                        await reportManager.initializeReports();
                    } catch (error) {
                        console.error('Error initializing reports tab:', error);
                    }
                } else {
                    console.warn('Chart.js veya reportManager yüklenmemiş, raporlar görüntülenemiyor');
                }
                break;
        }

        // URL'yi güncelle (SPA davranışı)
        this.updateURL(tabName);
    }

    /**
     * Dashboard verilerini güncelle
     */
    async updateDashboard() {
        try {
            // Özet istatistikler (async)
            const overallStats = await dataManager.getSummaryStats() || { totalIncome: 0, totalExpense: 0, netBalance: 0 };
            const monthlyStats = await dataManager.getSummaryStats(getCurrentMonthRange()) || { netBalance: 0 };

            // DOM elementlerini güncelle
            this.updateElement('totalIncome', formatCurrency(overallStats.totalIncome || 0));
            this.updateElement('totalExpense', formatCurrency(overallStats.totalExpense || 0));
            this.updateElement('netBalance', formatCurrency(overallStats.netBalance || 0));
            this.updateElement('monthlyBalance', formatCurrency(monthlyStats.netBalance || 0));

            // Renkleri güncelle
            this.updateBalanceColors('netBalance', overallStats.netBalance || 0);
            this.updateBalanceColors('monthlyBalance', monthlyStats.netBalance || 0);

        } catch (error) {
            console.error('Dashboard güncelleme hatası:', error);
            // Fallback - boş değerler göster
            this.updateElement('totalIncome', formatCurrency(0));
            this.updateElement('totalExpense', formatCurrency(0));
            this.updateElement('netBalance', formatCurrency(0));
            this.updateElement('monthlyBalance', formatCurrency(0));
        }
    }

    /**
     * Son işlemleri güncelle
     */
    async updateRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        try {
            // İşlemleri asenkron olarak al ve dizi kontrolü yap
            const transactions = await dataManager.getTransactions();
            
            // Yalnızca en son 5 işlemi al
            const recentTransactions = transactions.slice(0, 5);
            
            if (recentTransactions.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                        <p>Henüz işlem kaydı bulunmuyor</p>
                        <button onclick="tableManager.showTransactionModal()" 
                                class="mt-3 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm">
                            İlk İşlemi Ekle
                        </button>
                    </div>
                `;
            } else {
                try {
                    // Önce kategori ve hesap bilgilerini asenkron olarak toplayalım
                    const transactionDetailsPromises = recentTransactions.map(async transaction => {
                        try {
                            const category = await this.getCategoryById(transaction.categoryId);
                            const account = await this.getAccountById(transaction.accountId);
                            return { transaction, category, account };
                        } catch (error) {
                            console.error('Error fetching transaction details:', error);
                            return { 
                                transaction, 
                                category: null, 
                                account: null 
                            };
                        }
                    });
                    
                    // Tüm detayları paralel olarak al
                    const transactionDetails = await Promise.all(transactionDetailsPromises);
                    
                    // HTML oluştur
                    container.innerHTML = transactionDetails.map(({ transaction, category, account }) => {
                        // Etiketlerin dizi olduğundan emin ol
                        const tags = transaction.tags && Array.isArray(transaction.tags) ? 
                            transaction.tags : [];
                        
                        return `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" 
                                         style="background-color: ${category?.color || '#6B7280'}20; border: 2px solid ${category?.color || '#6B7280'};">
                                        <i data-lucide="${category?.icon || 'folder'}" 
                                           class="w-5 h-5" 
                                           style="color: ${category?.color || '#6B7280'};"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900">${escapeHtml(transaction.description || 'İşlem')}</p>
                                        <div class="flex items-center space-x-2 text-sm text-gray-500">
                                            <span>${category?.name || 'Kategori'}</span>
                                            <span>•</span>
                                            <span>${account?.name || 'Hesap'}</span>
                                            <span>•</span>
                                            <span>${formatDate(transaction.date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount || 0)}
                                    </p>
                                    ${tags.length > 0 ? `
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            ${tags.slice(0, 2).map(tag => `
                                                <span class="inline-block bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                                                    ${escapeHtml(tag)}
                                                </span>
                                            `).join('')}
                                            ${tags.length > 2 ? `<span class="text-xs text-gray-500">+${tags.length - 2}</span>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('');
                } catch (detailError) {
                    console.error('Error processing transaction details:', detailError);
                    container.innerHTML = '<p class="text-center py-4 text-red-500">İşlem detayları işlenirken hata oluştu</p>';
                }
            }

            // İkonları yenile
            if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        } catch (error) {
            console.error('Son işlemler güncellenirken hata:', error);
            container.innerHTML = '<p class="text-center py-4 text-red-500">İşlemler yüklenirken hata oluştu</p>';
        }
    }

    /**
     * Tüm arayüzü yenile
     */
    async refreshAll() {
        try {
            await this.updateDashboard();
            
            if (typeof Chart !== 'undefined' && typeof chartManager !== 'undefined') {
                await chartManager.updateCharts();
            } else {
                console.warn('Chart.js veya chartManager yüklenmemiş, grafikler güncellenemiyor');
            }
            
            await this.updateRecentTransactions();
            
            // Get current dashboard filters
            let filters = {};
            if (typeof chartManager !== 'undefined') {
                const period = chartManager.currentDashboardPeriod || 'thisMonth';
                switch(period) {
                    case 'thisMonth':
                        filters = getCurrentMonthRange();
                        break;
                    case 'lastMonth':
                        filters = getLastMonthRange();
                        break;
                    case 'thisYear':
                        filters = getCurrentYearRange();
                        break;
                    // allTime is empty filters
                }
                
                // Normalize filters
                filters = chartManager.normalizeFilters(filters);
            }
            
            // KPI Cards'ı güncelle
            if (this.kpiCards && typeof this.kpiCards.update === 'function') {
                await this.kpiCards.update(filters);
            }
            
            // Interactive Charts'ı güncelle
            if (this.interactiveCharts && typeof this.interactiveCharts.update === 'function') {
                await this.interactiveCharts.update();
            }
            
            // Quick Actions'ı güncelle
            if (this.quickActions && typeof this.quickActions.update === 'function') {
                await this.quickActions.update();
            }
            
            // AI Recommendations'ı güncelle
            if (this.aiRecommendations && typeof this.aiRecommendations.update === 'function') {
                await this.aiRecommendations.update();
            }
            
            // DragDropWidgets'ı güncelle
            if (this.dragDropWidgets && typeof this.dragDropWidgets.update === 'function') {
                await this.dragDropWidgets.update();
            }
            
            // Executive Summary Dashboard'ı güncelle
            if (this.executiveSummaryDashboard && typeof this.executiveSummaryDashboard.update === 'function') {
                await this.executiveSummaryDashboard.update();
            }
            
            // Operational Dashboard'ı güncelle
            if (this.operationalDashboard && typeof this.operationalDashboard.update === 'function') {
                await this.operationalDashboard.update();
            }
            
            // Advanced Analytics Dashboard'ı güncelle
            if (this.advancedAnalyticsDashboard && typeof this.advancedAnalyticsDashboard.update === 'function') {
                await this.advancedAnalyticsDashboard.update();
            } else if (typeof advancedAnalyticsDashboard !== 'undefined' && typeof advancedAnalyticsDashboard.update === 'function') {
                await advancedAnalyticsDashboard.update();
            }
            
            if (typeof categoryManager !== 'undefined') {
                await categoryManager.renderCategories();
            } else {
                console.warn('categoryManager yüklenmemiş, kategoriler güncellenemiyor');
            }
            
            if (typeof tableManager !== 'undefined' && tableManager.table) {
                await tableManager.refreshTable();
            } else if (typeof tableManager !== 'undefined') {
                console.log('tableManager mevcut ama tablo henüz oluşturulmamış');
            } else {
                console.warn('tableManager yüklenmemiş, tablo güncellenemiyor');
            }

            if (typeof reportManager !== 'undefined' && this.currentTab === 'reports') {
                await reportManager.generateReport();
            } else if (this.currentTab === 'reports') {
                console.warn('reportManager yüklenmemiş, raporlar güncellenemiyor');
            }

            showToast('Arayüz yenilendi', 'success');
        } catch (error) {
            console.error('Arayüz yenileme hatası:', error);
            showToast('Arayüz yenilenirken hata oluştu', 'error');
        }
    }

    /**
     * Hoş geldin mesajı
     */
    showWelcomeMessage() {
        const isFirstTime = !localStorage.getItem('budgetTracker_visited');
        
        if (isFirstTime) {
            localStorage.setItem('budgetTracker_visited', 'true');
            
            setTimeout(() => {
                showToast('Bütçe Takibi uygulamasına hoş geldiniz! 🎉', 'success');
                
                setTimeout(() => {
                    showToast('İlk işleminizi eklemek için + butonunu kullanın', 'info');
                }, 2000);
            }, 1000);
        }
    }

    /**
     * Klavye kısayolları
     */
    handleKeyboardShortcuts(e) {
        // Sadece ana tuşları dinle (modal açıkken çalışmasın)
        if (document.getElementById('modalContainer').children.length > 0) {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.showTab('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.showTab('categories');
                    break;
                case '3':
                    e.preventDefault();
                    this.showTab('transactions');
                    break;
                case '4':
                    e.preventDefault();
                    this.showTab('reports');
                    break;
                case 'n':
                    e.preventDefault();
                    tableManager.showTransactionModal();
                    break;
                case 's':
                    e.preventDefault();
                    exportImportManager.showExportModal();
                    break;
                case 'o':
                    e.preventDefault();
                    exportImportManager.showImportModal();
                    break;
            }
        }

        // ESC tuşu - modal'ları kapat
        if (e.key === 'Escape') {
            const modalContainer = document.getElementById('modalContainer');
            if (modalContainer && modalContainer.children.length > 0) {
                modalContainer.innerHTML = '';
            }
        }
    }

    /**
     * Mobil navigasyon
     */
    setupMobileNavigation() {
        // Mobil cihazlarda swipe gesture'ları eklenebilir
        // Şimdilik basit dokunmatik iyileştirmeler
        
        if (window.innerWidth <= 768) {
            // FAB'ı daha erişilebilir yap
            const fab = document.getElementById('fab');
            if (fab) {
                fab.style.bottom = '20px';
                fab.style.right = '20px';
            }

            // Tab'ları daha büyük yap
            const tabs = document.querySelectorAll('[id$="Tab"]');
            tabs.forEach(tab => {
                tab.style.padding = '12px 16px';
            });
        }
    }

    /**
     * URL'yi güncelle (SPA)
     */
    updateURL(tab) {
        const url = new URL(window.location);
        url.hash = tab;
        window.history.replaceState({}, '', url);
    }

    /**
     * URL'den tab'ı al
     */
    getTabFromURL() {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['dashboard', 'categories', 'transactions', 'reports'];
        return validTabs.includes(hash) ? hash : 'dashboard';
    }

    /**
     * Yardımcı metodlar
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    updateBalanceColors(elementId, amount) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('text-green-600', 'text-red-600', 'text-blue-600');
            if (amount > 0) {
                element.classList.add('text-green-600');
            } else if (amount < 0) {
                element.classList.add('text-red-600');
            } else {
                element.classList.add('text-blue-600');
            }
        }
    }

    /**
     * Kategori ID'sine göre kategori bilgilerini getir
     */
    async getCategoryById(categoryId) {
        try {
            // Kategori ID tanımlı değilse null döndür
            if (!categoryId) {
                console.warn('getCategoryById called with undefined/null categoryId');
                return null;
            }
            
            const categories = await dataManager.getCategories();
            
            // Kategoriler geçerli bir nesne değilse null döndür
            if (!categories || typeof categories !== 'object') {
                console.warn('getCategoryById: categories is not an object', categories);
                return null;
            }
            
            // Her kategori tipini kontrol et
            for (const type in categories) {
                // Tip bir dizi ise
                if (Array.isArray(categories[type])) {
                    const category = categories[type].find(c => c && c.id === categoryId);
                    if (category) return category;
                }
            }
            
            console.log(`Category with ID ${categoryId} not found`);
            return null;
        } catch (error) {
            console.error('Kategori arama hatası:', error);
            return null;
        }
    }

    /**
     * Hesap ID'sine göre hesap bilgilerini getir
     */
    async getAccountById(accountId) {
        try {
            // Hesap ID tanımlı değilse null döndür
            if (!accountId) {
                console.warn('getAccountById called with undefined/null accountId');
                return null;
            }
            
            const accounts = await dataManager.getAccounts();
            
            // accounts zaten dizi olarak döndürülecek (dataManager.getAccounts güncellendi)
            return accounts.find(a => a && a.id === accountId) || null;
        } catch (error) {
            console.error('Hesap arama hatası:', error);
            return null;
        }
    }

    /**
     * Performans monitoring
     */
    startPerformanceMonitoring() {
        // Sayfa yükleme performansı
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`Sayfa yükleme süresi: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
        });

        // Memory kullanımı (Chrome)
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                if (memoryUsage > 50) { // 50MB üzeri uyarı
                    console.warn(`Yüksek memory kullanımı: ${memoryUsage}MB`);
                }
            }, 30000); // 30 saniyede bir kontrol
        }
    }

    /**
     * Error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('JavaScript hatası:', e.error);
            showToast('Beklenmeyen bir hata oluştu!', 'error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promise hatası:', e.reason);
            showToast('İşlem tamamlanamadı!', 'error');
        });
    }

    /**
     * Veri senkronizasyonu (gelecek özellik)
     */
    async syncData() {
        // Bu özellik gelecekte bulut senkronizasyonu için kullanılabilir
        console.log('Veri senkronizasyonu - henüz implement edilmedi');
    }
    
    /**
     * Tüm işlemleri temizleme onayı göster
     */
    showClearTransactionsConfirmation() {
        const modal = createModal(
            'Tüm İşlemleri Temizle',
            `
            <div class="space-y-6">
                <div class="bg-red-50 p-4 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i data-lucide="alert-triangle" class="w-5 h-5 text-red-600 mt-0.5"></i>
                        <div class="text-sm">
                            <p class="text-red-800 font-medium">Dikkat!</p>
                            <p class="text-red-700 mt-1">
                                Bu işlem tüm işlem kayıtlarını kalıcı olarak silecektir. 
                                Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
                            </p>
                        </div>
                    </div>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i data-lucide="info" class="w-5 h-5 text-yellow-600 mt-0.5"></i>
                        <div class="text-sm">
                            <p class="text-yellow-800 font-medium">Öneri</p>
                            <p class="text-yellow-700 mt-1">
                                İşlemlerinizi silmeden önce "Dışa Aktar" butonunu kullanarak bir yedek almanız önerilir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            `,
            [
                {
                    text: 'İptal',
                    class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                },
                {
                    text: 'Tüm İşlemleri Temizle',
                    class: 'bg-red-500 hover:bg-red-600 text-white',
                    onclick: 'app.clearAllTransactions()'
                }
            ]
        );
        
        lucide.createIcons();
    }
    
    /**
     * Tüm işlemleri temizle
     */
    clearAllTransactions() {
        try {
            console.log("Tüm işlemleri temizleme işlemi başladı");
            
            // Önce mevcut verileri al
            const data = dataManager.getData();
            console.log("Mevcut işlem sayısı:", data.transactions ? data.transactions.length : 0);
            
            // İşlemleri sıfırla
            data.transactions = [];
            
            // Verileri kaydet
            const saveResult = dataManager.saveData(data);
            console.log("Veri kaydetme sonucu:", saveResult);
            
            // Modalı kapat
            document.getElementById('modalContainer').innerHTML = '';
            
            // Başarı mesajı göster
            showToast('Tüm işlemler başarıyla temizlendi!', 'success');
            
            // Tablo görünümünü doğrudan güncelle
            if (tableManager && typeof tableManager.refreshTable === 'function') {
                tableManager.refreshTable();
            }
            
            // Dashboard'ı güncelle
            this.updateDashboard();
            
            // Diğer tüm bileşenleri güncelle
            this.refreshAll();
            
            console.log("Tüm işlemleri temizleme işlemi tamamlandı");
        } catch (error) {
            console.error('İşlemler temizlenirken hata oluştu:', error);
            showToast('İşlemler temizlenirken hata oluştu!', 'error');
        }
    }

    /**
     * Advanced KPI Cards'ı başlat
     */
    async initializeKPICards() {
        try {
            const kpiContainer = document.getElementById('advancedKpiContainer');
            if (!kpiContainer) {
                console.warn('KPI container bulunamadı');
                return;
            }

            // KPI Cards sınıfını başlat
            this.kpiCards = new KPICards(dataManager);
            await this.kpiCards.initialize();
            
            console.log('Advanced KPI Cards başarıyla başlatıldı');
        } catch (error) {
            console.error('KPI Cards başlatılırken hata:', error);
        }
    }

    /**
     * Interactive Charts'ı başlat
     */
    async initializeInteractiveCharts() {
        try {
            // Interactive Charts sınıfını başlat
            this.interactiveCharts = new InteractiveCharts(chartManager, dataManager);
            await this.interactiveCharts.initialize();
            
            console.log('Interactive Charts başarıyla başlatıldı');
        } catch (error) {
            console.error('Interactive Charts başlatılırken hata:', error);
        }
    }

    /**
     * Quick Actions'ı başlat
     */
    async initializeQuickActions() {
        try {
            // Quick Actions sınıfını başlat
            this.quickActions = new QuickActions(this, dataManager, tableManager);
            await this.quickActions.initialize();
            
            console.log('Quick Actions başarıyla başlatıldı');
        } catch (error) {
            console.error('Quick Actions başlatılırken hata:', error);
        }
    }
    
    /**
     * AI Recommendations'ı başlat
     */
    async initializeAIRecommendations() {
        try {
            // AI Recommendations sınıfını başlat
            this.aiRecommendations = new AIRecommendations(dataManager);
            await this.aiRecommendations.initialize();
            
            console.log('AI Recommendations başarıyla başlatıldı');
        } catch (error) {
            console.error('AI Recommendations başlatılırken hata:', error);
        }
    }
    
    /**
     * Drag Drop Widgets'ı başlat
     */
    async initializeDragDropWidgets() {
        try {
            // DragDropWidgets sınıfını başlat
            this.dragDropWidgets = dragDropWidgets;
            await this.dragDropWidgets.initialize();
            
            console.log('Drag Drop Widgets başarıyla başlatıldı');
        } catch (error) {
            console.error('Drag Drop Widgets başlatılırken hata:', error);
        }
    }
    
    /**
     * Executive Summary Dashboard'ı başlat
     */
    async initializeExecutiveSummaryDashboard() {
        try {
            // Executive Summary Dashboard sınıfını başlat
            this.executiveSummaryDashboard = executiveSummaryDashboard;
            await this.executiveSummaryDashboard.initialize();
            
            console.log('Executive Summary Dashboard başarıyla başlatıldı');
        } catch (error) {
            console.error('Executive Summary Dashboard başlatılırken hata:', error);
        }
    }
    
    /**
     * Operational Dashboard'ı başlat
     */
    async initializeOperationalDashboard() {
        try {
            // Operational Dashboard sınıfını başlat
            this.operationalDashboard = operationalDashboard;
            await this.operationalDashboard.initialize();
            
            console.log('Operational Dashboard başarıyla başlatıldı');
        } catch (error) {
            console.error('Operational Dashboard başlatılırken hata:', error);
        }
    }
    
    /**
     * Advanced Analytics Dashboard'ı başlat
     */
    async initializeAdvancedAnalyticsDashboard() {
        try {
            // Advanced Analytics Dashboard sınıfını başlat
            if (typeof AdvancedAnalyticsDashboard !== 'undefined') {
                // Make sure AI Recommendations is initialized first
                if (!this.aiRecommendations) {
                    await this.initializeAIRecommendations();
                }
                
                // Create a new instance and pass required dependencies
                this.advancedAnalyticsDashboard = new AdvancedAnalyticsDashboard(
                    dataManager, 
                    chartManager, 
                    this.aiRecommendations
                );
                
                if (this.advancedAnalyticsDashboard) {
                    await this.advancedAnalyticsDashboard.initialize();
                    console.log('Advanced Analytics Dashboard başarıyla başlatıldı');
                }
            } else {
                console.warn('advancedAnalyticsDashboard bileşeni bulunamadı');
            }
        } catch (error) {
            console.error('Advanced Analytics Dashboard başlatılırken hata:', error);
        }
    }

    /**
     * Temizlik işlemleri
     */
    cleanup() {
        // Chart'ları temizle
        if (chartManager) {
            chartManager.destroyCharts();
        }

        if (reportManager) {
            reportManager.destroyCharts();
        }
        
        // Yeni bileşenleri temizle
        if (this.kpiCards && typeof this.kpiCards.cleanup === 'function') {
            this.kpiCards.cleanup();
        }
        
        if (this.interactiveCharts && typeof this.interactiveCharts.cleanup === 'function') {
            this.interactiveCharts.cleanup();
        }
        
        if (this.quickActions && typeof this.quickActions.cleanup === 'function') {
            this.quickActions.cleanup();
        }
        
        if (this.aiRecommendations && typeof this.aiRecommendations.cleanup === 'function') {
            this.aiRecommendations.cleanup();
        }
        
        if (this.dragDropWidgets && typeof this.dragDropWidgets.cleanup === 'function') {
            this.dragDropWidgets.cleanup();
        }
        
        if (this.executiveSummaryDashboard && typeof this.executiveSummaryDashboard.cleanup === 'function') {
            this.executiveSummaryDashboard.cleanup();
        }
        
        if (this.operationalDashboard && typeof this.operationalDashboard.cleanup === 'function') {
            this.operationalDashboard.cleanup();
        }
        
        if (this.advancedAnalyticsDashboard && typeof this.advancedAnalyticsDashboard.cleanup === 'function') {
            this.advancedAnalyticsDashboard.cleanup();
        } else if (typeof advancedAnalyticsDashboard !== 'undefined' && typeof advancedAnalyticsDashboard.cleanup === 'function') {
            advancedAnalyticsDashboard.cleanup();
        }

        // Event listener'ları temizle
        // Bu daha çok SPA geçişlerinde kullanılır
        console.log('Temizlik işlemleri tamamlandı');
    }
}

// Uygulama başlatma
let app;

// DOM hazır olduğunda veya script yüklendiğinde uygulamayı başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new BudgetTrackerApp();
    });
} else {
    app = new BudgetTrackerApp();
}

// Global erişim için
window.budgetApp = app;