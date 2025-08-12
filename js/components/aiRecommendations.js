// js/components/aiRecommendations.js - Akıllı Bütçe Önerileri

class AIRecommendations {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.container = document.getElementById('aiRecommendationsContainer');
        this.recommendations = [];
        this.transactionPatterns = {};
        this.savingGoals = {};
        this.budgetInsights = {};
        this.forecastData = {};
        this.cohortData = {};
        this.rfmData = {};
        this.paretoData = {};
        this.initialized = false;
    }

    /**
     * Bileşeni başlat
     */
    async initialize() {
        try {
            console.log('AI Recommendations başlatılıyor...');

            // Container yoksa oluştur
            if (!this.container) {
                console.log('AI Recommendations container bulunamadı, oluşturuluyor...');
                this.createContainer();
            }

            // İlk önerileri oluştur
            await this.generateRecommendations();
            
            // Önerileri görüntüle
            this.renderRecommendations();
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('AI Recommendations başarıyla başlatıldı');
            
            return true;
        } catch (error) {
            console.error('AI Recommendations başlatma hatası:', error);
            return false;
        }
    }

    /**
     * Container oluştur
     */
    createContainer() {
        // Dashboard içinde container'ı oluştur
        const dashboardContent = document.getElementById('dashboardContent');
        
        if (dashboardContent) {
            // AI Recommendations section
            const section = document.createElement('div');
            section.classList.add('mb-8');
            section.innerHTML = `
                <h3 class="text-lg font-medium text-gray-900 mb-4">Akıllı Bütçe Önerileri</h3>
                <div id="aiRecommendationsContainer" class="recommendations-grid">
                    <!-- AI recommendations will be added dynamically -->
                </div>
            `;
            
            // Son İşlemler bölümünden önce yerleştir
            const recentTransactions = dashboardContent.querySelector('.recent-transactions');
            if (recentTransactions) {
                dashboardContent.insertBefore(section, recentTransactions);
            } else {
                dashboardContent.appendChild(section);
            }
            
            this.container = document.getElementById('aiRecommendationsContainer');
        }
    }

    /**
     * Event listener'ları kur
     */
    setupEventListeners() {
        // Öneri işlemleri için event listener'lar
        this.container.addEventListener('click', (e) => {
            const target = e.target.closest('.recommendation-action');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const recommendationId = target.closest('.recommendation-card').getAttribute('data-id');
            
            if (action && recommendationId) {
                this.handleRecommendationAction(action, recommendationId);
            }
        });
    }

    /**
     * Önerileri oluştur
     */
    async generateRecommendations() {
        try {
            console.log('Öneriler oluşturuluyor...');
            
            // Tüm veriyi al
            const transactions = await this.dataManager.getTransactions();
            const categories = await this.dataManager.getCategories();
            const stats = await this.dataManager.getSummaryStats();
            const monthlyStats = await this.dataManager.getMonthlyStats();
            
            // Önerileri temizle
            this.recommendations = [];
            
            // Minimum 10 işlem gerekli
            if (transactions.length < 10) {
                this.recommendations.push({
                    id: 'not-enough-data',
                    type: 'info',
                    title: 'Daha fazla işlem ekleyin',
                    description: 'Kişiselleştirilmiş öneriler için en az 10 işlem ekleyin.',
                    actions: [
                        { id: 'add-transaction', label: 'İşlem Ekle', action: 'addTransaction' }
                    ]
                });
                return;
            }
            
            // Bütçe optimizasyonu önerileri
            await this.generateBudgetOptimizationRecommendations(transactions, stats);
            
            // Harcama uyarıları
            await this.generateSpendingAlertRecommendations(transactions, categories, stats, monthlyStats);
            
            // Hedef önerileri
            await this.generateGoalRecommendations(transactions, stats, monthlyStats);
            
            // Kategorilendirme önerileri
            await this.generateCategorizationRecommendations(transactions, categories);
            
            // Tahminleme önerileri
            await this.generateForecastRecommendations(transactions, stats, monthlyStats);
            
            // RFM analizi önerileri
            await this.generateRFMRecommendations(transactions, categories);
            
            // Pareto analizi önerileri
            await this.generateParetoRecommendations(transactions, categories);
            
            // Cohort analizi önerileri
            await this.generateCohortRecommendations(transactions);
            
            console.log(`${this.recommendations.length} öneri oluşturuldu`);
        } catch (error) {
            console.error('Öneri oluşturma hatası:', error);
        }
    }

    /**
     * Bütçe optimizasyonu önerileri
     */
    async generateBudgetOptimizationRecommendations(transactions, stats) {
        try {
            // Son 3 ayın işlemlerini analiz et
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            
            const recentTransactions = transactions.filter(t => 
                new Date(t.date) >= threeMonthsAgo && t.type === 'expense'
            );
            
            // Kategorilere göre harcamaları grupla
            const categorySpending = {};
            for (const transaction of recentTransactions) {
                if (!categorySpending[transaction.categoryId]) {
                    categorySpending[transaction.categoryId] = 0;
                }
                categorySpending[transaction.categoryId] += transaction.amount || 0;
            }
            
            // En yüksek harcama kategorileri
            const topCategories = Object.entries(categorySpending)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
            
            // En yüksek kategori için öneri oluştur
            if (topCategories.length > 0) {
                const [topCategoryId, topAmount] = topCategories[0];
                const topCategory = await this.dataManager.getCategoryById(topCategoryId);
                
                if (topCategory) {
                    // Aylık ortalama harcama
                    const monthlyAverage = topAmount / 3;
                    
                    // Yüksek harcama kategorisi için bütçe optimizasyon önerisi
                    const savingTarget = Math.round(monthlyAverage * 0.15); // %15 tasarruf hedefi
                    
                    this.recommendations.push({
                        id: `budget-opt-${topCategoryId}`,
                        type: 'optimization',
                        title: `${topCategory.name} harcamalarınızı azaltın`,
                        description: `Son 3 ayda ${topCategory.name} kategorisinde aylık ortalama ${formatCurrency(monthlyAverage)} harcadınız. Bu kategoride aylık ${formatCurrency(savingTarget)} tasarruf sağlayabilirsiniz.`,
                        category: topCategory,
                        actions: [
                            { id: 'create-budget', label: 'Bütçe Oluştur', action: 'createBudget', category: topCategory }
                        ],
                        priority: 'high',
                        savings: savingTarget
                    });
                }
            }
            
            // Gelir/gider dengesi için öneri
            if (stats.totalIncome > 0 && stats.totalExpense > 0) {
                const expenseRatio = stats.totalExpense / stats.totalIncome;
                
                if (expenseRatio > 0.9) {
                    // Harcamaların gelirin %90'ından fazla olduğu durumda
                    this.recommendations.push({
                        id: 'income-expense-balance',
                        type: 'alert',
                        title: 'Gelir ve gider dengeniz kritik',
                        description: `Harcamalarınız gelirinizin %${Math.round(expenseRatio * 100)}'ini oluşturuyor. Finansal güvenliğiniz için bu oranı %80'in altına düşürmenizi öneririz.`,
                        actions: [
                            { id: 'view-reports', label: 'Raporu Görüntüle', action: 'viewReports' }
                        ],
                        priority: 'critical'
                    });
                }
            }
        } catch (error) {
            console.error('Bütçe optimizasyonu önerileri oluşturma hatası:', error);
        }
    }

    /**
     * Harcama uyarı önerileri
     */
    async generateSpendingAlertRecommendations(transactions, categories, stats, monthlyStats) {
        try {
            // Bu ayki verileri al
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            
            const thisMonthStats = monthlyStats.find(m => m.month === currentMonth) || { totalExpense: 0 };
            
            // Kategori bazlı aşırı harcama uyarıları
            const categoryBudgetData = await this.dataManager.getBudgetAnalysis(currentYear, currentMonth);
            
            for (const budget of categoryBudgetData) {
                if (budget.status === 'over-budget' && budget.variance > 0) {
                    // Aşırı harcama uyarısı
                    this.recommendations.push({
                        id: `over-budget-${budget.categoryId}`,
                        type: 'warning',
                        title: `${budget.categoryName} bütçesi aşıldı`,
                        description: `${budget.categoryName} kategorisinde bu ay bütçenizi ${formatCurrency(budget.variance)} aştınız. Toplam ${formatCurrency(budget.actualAmount)} harcadınız, planınız ${formatCurrency(budget.plannedAmount)} idi.`,
                        category: {
                            id: budget.categoryId,
                            name: budget.categoryName,
                            color: budget.categoryColor,
                            type: budget.categoryType
                        },
                        actions: [
                            { id: 'adjust-budget', label: 'Bütçeyi Düzenle', action: 'adjustBudget', budgetId: budget.budgetId }
                        ],
                        priority: 'high'
                    });
                }
            }
            
            // Anormal işlem tespiti (son bir ayda yapılan ortalama harcamanın 2 katından fazla)
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            // Son bir aydaki işlemler
            const lastMonthTransactions = transactions.filter(t => 
                new Date(t.date) >= lastMonth && t.type === 'expense'
            );
            
            // Kategorilere göre ortalama hesapla
            const categoryAverages = {};
            const categoryCounts = {};
            
            for (const transaction of lastMonthTransactions) {
                if (!categoryAverages[transaction.categoryId]) {
                    categoryAverages[transaction.categoryId] = 0;
                    categoryCounts[transaction.categoryId] = 0;
                }
                
                categoryAverages[transaction.categoryId] += transaction.amount || 0;
                categoryCounts[transaction.categoryId]++;
            }
            
            // Ortalamaları hesapla
            for (const categoryId in categoryAverages) {
                if (categoryCounts[categoryId] > 0) {
                    categoryAverages[categoryId] = categoryAverages[categoryId] / categoryCounts[categoryId];
                }
            }
            
            // Son bir haftadaki anormal harcamaları tespit et
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            
            const lastWeekTransactions = transactions.filter(t => 
                new Date(t.date) >= lastWeek && t.type === 'expense'
            );
            
            // Her bir işlem için kontrol et
            for (const transaction of lastWeekTransactions) {
                const average = categoryAverages[transaction.categoryId] || 0;
                
                if (average > 0 && (transaction.amount || 0) > average * 2) {
                    // Bu işlemin kategorisini bul
                    const category = await this.dataManager.getCategoryById(transaction.categoryId);
                    
                    if (category) {
                        // Anormal harcama uyarısı
                        this.recommendations.push({
                            id: `unusual-transaction-${transaction.id}`,
                            type: 'alert',
                            title: 'Anormal harcama tespit edildi',
                            description: `${formatDate(transaction.date)} tarihinde ${category.name} kategorisinde ${formatCurrency(transaction.amount)} tutarında anormal bir harcama tespit edildi. Bu, ortalamanızın ${Math.round((transaction.amount || 0) / average)} katı.`,
                            transaction: transaction,
                            category: category,
                            actions: [
                                { id: 'view-transaction', label: 'İşlemi Görüntüle', action: 'viewTransaction', transactionId: transaction.id }
                            ],
                            priority: 'medium'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Harcama uyarıları oluşturma hatası:', error);
        }
    }

    /**
     * Hedef önerileri
     */
    async generateGoalRecommendationRecommendations(transactions, stats, monthlyStats) {
        try {
            // Net kazanç durumu
            const netMonthlySavings = monthlyStats
                .filter(m => m.netBalance > 0)
                .reduce((sum, m) => sum + m.netBalance, 0) / monthlyStats.length;
            
            if (netMonthlySavings > 0) {
                // Aylık tasarruf miktarı
                const monthlySavingGoal = Math.round(netMonthlySavings * 0.8); // %80'i kadar hedef
                
                // Tasarruf hedefi önerisi
                this.recommendations.push({
                    id: 'saving-goal',
                    type: 'goal',
                    title: 'Tasarruf hedefi oluşturun',
                    description: `Aylık ortalama ${formatCurrency(netMonthlySavings)} kazancınız var. Aylık ${formatCurrency(monthlySavingGoal)} tasarruf hedefi koymanızı öneririz.`,
                    actions: [
                        { id: 'set-goal', label: 'Hedef Oluştur', action: 'setSavingGoal', amount: monthlySavingGoal }
                    ],
                    priority: 'medium',
                    savingAmount: monthlySavingGoal
                });
            }
            
            // Büyük harcamalar için tasarruf önerisi
            const highestExpenseTransaction = transactions
                .filter(t => t.type === 'expense')
                .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
                
            if (highestExpenseTransaction && highestExpenseTransaction.amount > 0) {
                const category = await this.dataManager.getCategoryById(highestExpenseTransaction.categoryId);
                
                if (category) {
                    // Büyük harcama için tasarruf hedefi
                    const targetAmount = Math.round(highestExpenseTransaction.amount * 1.2); // %20 fazlası
                    const monthsToSave = Math.ceil(targetAmount / (netMonthlySavings * 0.3)); // %30'u ile aylık tasarruf
                    
                    if (monthsToSave > 0 && monthsToSave < 24) { // 2 yıldan kısa olmalı
                        this.recommendations.push({
                            id: `large-expense-${category.id}`,
                            type: 'goal',
                            title: `${category.name} için tasarruf planı`,
                            description: `Geçmişte ${category.name} için ${formatCurrency(highestExpenseTransaction.amount)} harcadınız. Benzer bir harcama için ${monthsToSave} ay boyunca aylık ${formatCurrency(targetAmount / monthsToSave)} biriktirmenizi öneririz.`,
                            category: category,
                            actions: [
                                { id: 'set-large-goal', label: 'Hedef Oluştur', action: 'setSavingGoal', amount: targetAmount, months: monthsToSave }
                            ],
                            priority: 'low',
                            savingAmount: targetAmount,
                            savingMonths: monthsToSave
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Hedef önerileri oluşturma hatası:', error);
        }
    }

    /**
     * Kategorilendirme önerileri
     */
    async generateCategorizationRecommendations(transactions, categories) {
        try {
            // Kategorilendirilmemiş işlemleri bul
            const uncategorizedTransactions = transactions.filter(t => 
                !t.categoryId || t.categoryId === 'uncategorized'
            );
            
            if (uncategorizedTransactions.length > 0) {
                // Kategorilendirilmemiş işlem uyarısı
                this.recommendations.push({
                    id: 'uncategorized-transactions',
                    type: 'info',
                    title: 'Kategorilendirilmemiş işlemler',
                    description: `${uncategorizedTransactions.length} adet işlem henüz kategorilenmemiş. Daha doğru raporlar için işlemlerinizi kategorilendirin.`,
                    actions: [
                        { id: 'view-uncategorized', label: 'İşlemleri Görüntüle', action: 'viewUncategorizedTransactions' }
                    ],
                    priority: 'medium'
                });
                
                // Benzer açıklamalara sahip işlemleri bularak kategori öner
                const descriptionPatterns = {};
                
                // Önce kategorili işlemlerin açıklama paternlerini oluştur
                for (const transaction of transactions) {
                    if (transaction.categoryId && transaction.categoryId !== 'uncategorized' && transaction.description) {
                        const words = transaction.description.toLowerCase().split(/\s+/);
                        
                        for (const word of words) {
                            if (word.length > 3) { // Kısa kelimeleri atla
                                if (!descriptionPatterns[word]) {
                                    descriptionPatterns[word] = {};
                                }
                                
                                if (!descriptionPatterns[word][transaction.categoryId]) {
                                    descriptionPatterns[word][transaction.categoryId] = 0;
                                }
                                
                                descriptionPatterns[word][transaction.categoryId]++;
                            }
                        }
                    }
                }
                
                // Kategorisiz işlemler için öneriler
                for (const transaction of uncategorizedTransactions.slice(0, 3)) { // En fazla 3 öneri
                    if (transaction.description) {
                        const words = transaction.description.toLowerCase().split(/\s+/);
                        const categoryMatches = {};
                        
                        // Her kelime için kategori eşleşmelerini bul
                        for (const word of words) {
                            if (word.length > 3 && descriptionPatterns[word]) {
                                for (const [categoryId, count] of Object.entries(descriptionPatterns[word])) {
                                    if (!categoryMatches[categoryId]) {
                                        categoryMatches[categoryId] = 0;
                                    }
                                    
                                    categoryMatches[categoryId] += count;
                                }
                            }
                        }
                        
                        // En çok eşleşen kategoriyi bul
                        let bestCategoryId = null;
                        let bestCount = 0;
                        
                        for (const [categoryId, count] of Object.entries(categoryMatches)) {
                            if (count > bestCount) {
                                bestCount = count;
                                bestCategoryId = categoryId;
                            }
                        }
                        
                        // Öneri oluştur
                        if (bestCategoryId && bestCount >= 2) {
                            const category = await this.dataManager.getCategoryById(bestCategoryId);
                            
                            if (category) {
                                this.recommendations.push({
                                    id: `categorize-${transaction.id}`,
                                    type: 'categorization',
                                    title: 'Kategori önerisi',
                                    description: `"${transaction.description}" açıklamalı işleminiz için "${category.name}" kategorisini öneriyoruz.`,
                                    transaction: transaction,
                                    suggestedCategory: category,
                                    actions: [
                                        { id: 'apply-category', label: 'Kategoriyi Uygula', action: 'applyCategory', transactionId: transaction.id, categoryId: category.id }
                                    ],
                                    priority: 'low'
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Kategorilendirme önerileri oluşturma hatası:', error);
        }
    }
    
    /**
     * Hedef önerileri
     */
    async generateGoalRecommendations(transactions, stats, monthlyStats) {
        try {
            // Net kazanç durumu
            const netMonthlySavings = monthlyStats
                .filter(m => m.netBalance > 0)
                .reduce((sum, m) => sum + m.netBalance, 0) / Math.max(1, monthlyStats.filter(m => m.netBalance > 0).length);
            
            if (netMonthlySavings > 0) {
                // Aylık tasarruf miktarı
                const monthlySavingGoal = Math.round(netMonthlySavings * 0.8); // %80'i kadar hedef
                
                // Tasarruf hedefi önerisi
                this.recommendations.push({
                    id: 'saving-goal',
                    type: 'goal',
                    title: 'Tasarruf hedefi oluşturun',
                    description: `Aylık ortalama ${formatCurrency(netMonthlySavings)} kazancınız var. Aylık ${formatCurrency(monthlySavingGoal)} tasarruf hedefi koymanızı öneririz.`,
                    actions: [
                        { id: 'set-goal', label: 'Hedef Oluştur', action: 'setSavingGoal', amount: monthlySavingGoal }
                    ],
                    priority: 'medium',
                    savingAmount: monthlySavingGoal
                });
            }
            
            // Büyük harcamalar için tasarruf önerisi
            const highestExpenseTransaction = transactions
                .filter(t => t.type === 'expense' && t.amount)
                .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
                
            if (highestExpenseTransaction && highestExpenseTransaction.amount > 0) {
                const category = await this.dataManager.getCategoryById(highestExpenseTransaction.categoryId);
                
                if (category) {
                    // Büyük harcama için tasarruf hedefi
                    const targetAmount = Math.round(highestExpenseTransaction.amount * 1.2); // %20 fazlası
                    const monthsToSave = Math.ceil(targetAmount / (netMonthlySavings * 0.3)); // %30'u ile aylık tasarruf
                    
                    if (monthsToSave > 0 && monthsToSave < 24) { // 2 yıldan kısa olmalı
                        this.recommendations.push({
                            id: `large-expense-${category.id}`,
                            type: 'goal',
                            title: `${category.name} için tasarruf planı`,
                            description: `Geçmişte ${category.name} için ${formatCurrency(highestExpenseTransaction.amount)} harcadınız. Benzer bir harcama için ${monthsToSave} ay boyunca aylık ${formatCurrency(targetAmount / monthsToSave)} biriktirmenizi öneririz.`,
                            category: category,
                            actions: [
                                { id: 'set-large-goal', label: 'Hedef Oluştur', action: 'setSavingGoal', amount: targetAmount, months: monthsToSave }
                            ],
                            priority: 'low',
                            savingAmount: targetAmount,
                            savingMonths: monthsToSave
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Hedef önerileri oluşturma hatası:', error);
        }
    }

    /**
     * Önerileri HTML olarak render et
     */
    renderRecommendations() {
        // Container'ı temizle
        if (!this.container) return;
        this.container.innerHTML = '';
        
        // Öneriler yoksa mesaj göster
        if (this.recommendations.length === 0) {
            this.container.innerHTML = `
                <div class="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                    <i data-lucide="lightbulb" class="w-8 h-8 mx-auto mb-2 text-gray-400"></i>
                    <p>Henüz öneri bulunmuyor. Daha fazla işlem ekledikçe kişiselleştirilmiş öneriler görüntülenecek.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        // Önerileri öncelik sırasına göre sırala
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        const sortedRecommendations = [...this.recommendations].sort((a, b) => {
            return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
        });
        
        // Önerileri render et
        for (const recommendation of sortedRecommendations) {
            const card = this.createRecommendationCard(recommendation);
            this.container.appendChild(card);
        }
        
        // İkonları yenile
        lucide.createIcons();
    }

    /**
     * Öneri kartı oluştur
     */
    createRecommendationCard(recommendation) {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.setAttribute('data-id', recommendation.id);
        card.setAttribute('data-type', recommendation.type);
        
        // Tipe göre ikon ve renk belirle
        let icon, bgColor, iconColor, borderColor;
        
        switch (recommendation.type) {
            case 'optimization':
                icon = 'trending-up';
                bgColor = 'bg-blue-50';
                iconColor = 'text-blue-500';
                borderColor = 'border-blue-200';
                break;
            case 'alert':
                icon = 'alert-triangle';
                bgColor = 'bg-red-50';
                iconColor = 'text-red-500';
                borderColor = 'border-red-200';
                break;
            case 'warning':
                icon = 'alert-circle';
                bgColor = 'bg-amber-50';
                iconColor = 'text-amber-500';
                borderColor = 'border-amber-200';
                break;
            case 'goal':
                icon = 'target';
                bgColor = 'bg-green-50';
                iconColor = 'text-green-500';
                borderColor = 'border-green-200';
                break;
            case 'categorization':
                icon = 'tag';
                bgColor = 'bg-purple-50';
                iconColor = 'text-purple-500';
                borderColor = 'border-purple-200';
                break;
            case 'info':
            default:
                icon = 'info';
                bgColor = 'bg-gray-50';
                iconColor = 'text-gray-500';
                borderColor = 'border-gray-200';
                break;
        }
        
        // Önceliğe göre özel stil
        let priorityClass = '';
        if (recommendation.priority === 'critical') {
            priorityClass = 'recommendation-critical';
        } else if (recommendation.priority === 'high') {
            priorityClass = 'recommendation-high';
        }
        
        // Kart HTML'i
        card.innerHTML = `
            <div class="p-4 rounded-lg border ${borderColor} ${bgColor} ${priorityClass}">
                <div class="flex items-start">
                    <div class="mr-3">
                        <div class="p-2 rounded-full ${bgColor} ${iconColor}">
                            <i data-lucide="${icon}" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${recommendation.title}</h4>
                        <p class="text-sm text-gray-600 mt-1">${recommendation.description}</p>
                        
                        ${recommendation.category ? `
                            <div class="flex items-center mt-2">
                                <span class="inline-block w-3 h-3 rounded-full mr-1" style="background-color: ${recommendation.category.color};"></span>
                                <span class="text-xs text-gray-500">${recommendation.category.name}</span>
                            </div>
                        ` : ''}
                        
                        <div class="mt-3 flex flex-wrap gap-2">
                            ${recommendation.actions.map(action => `
                                <button class="recommendation-action px-3 py-1 text-sm rounded-md ${this.getActionButtonStyle(recommendation.type)}"
                                        data-action="${action.action}"
                                        ${Object.entries(action).filter(([key]) => key !== 'label' && key !== 'action')
                                            .map(([key, value]) => `data-${key}="${value}"`).join(' ')}>
                                    ${action.label}
                                </button>
                            `).join('')}
                            <button class="recommendation-action dismiss-btn px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600" data-action="dismiss">
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * Öneri tipine göre buton stili
     */
    getActionButtonStyle(type) {
        switch (type) {
            case 'optimization':
                return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
            case 'alert':
                return 'bg-red-100 hover:bg-red-200 text-red-700';
            case 'warning':
                return 'bg-amber-100 hover:bg-amber-200 text-amber-700';
            case 'goal':
                return 'bg-green-100 hover:bg-green-200 text-green-700';
            case 'categorization':
                return 'bg-purple-100 hover:bg-purple-200 text-purple-700';
            case 'info':
            default:
                return 'bg-gray-100 hover:bg-gray-200 text-gray-700';
        }
    }

    /**
     * Öneri aksiyonu işle
     */
    handleRecommendationAction(action, recommendationId) {
        console.log(`Öneri aksiyonu: ${action}, id: ${recommendationId}`);
        
        // Öneriyi bul
        const recommendation = this.recommendations.find(r => r.id === recommendationId);
        if (!recommendation) return;
        
        // Aksiyon tipine göre işlem yap
        switch (action) {
            case 'addTransaction':
                // İşlem ekle modalını aç
                if (typeof tableManager !== 'undefined') {
                    tableManager.showTransactionModal();
                }
                break;
                
            case 'createBudget':
                // Bütçe oluştur modalını aç
                // Burada doğrudan çağrılamaz, uygulama bileşenleri arasında bağımlılık yaratmamak için
                // custom event yayınlayalım
                document.dispatchEvent(new CustomEvent('aiRecommendation:createBudget', {
                    detail: { categoryId: recommendation.category?.id }
                }));
                break;
                
            case 'adjustBudget':
                // Bütçe düzenleme modalını aç
                const budgetId = event.target.getAttribute('data-budgetid');
                document.dispatchEvent(new CustomEvent('aiRecommendation:adjustBudget', {
                    detail: { budgetId }
                }));
                break;
                
            case 'viewReports':
                // Raporlar sekmesine git
                if (typeof app !== 'undefined') {
                    app.showTab('reports');
                }
                break;
                
            case 'viewTransaction':
                // İşlem detayını göster
                const transactionId = event.target.getAttribute('data-transactionid');
                if (typeof tableManager !== 'undefined' && transactionId) {
                    tableManager.showTransactionDetail(transactionId);
                }
                break;
                
            case 'setSavingGoal':
                // Tasarruf hedefi oluştur
                const amount = event.target.getAttribute('data-amount');
                const months = event.target.getAttribute('data-months');
                
                document.dispatchEvent(new CustomEvent('aiRecommendation:setSavingGoal', {
                    detail: { amount, months }
                }));
                break;
                
            case 'viewUncategorizedTransactions':
                // Kategorisiz işlemleri görüntüle
                if (typeof app !== 'undefined' && typeof tableManager !== 'undefined') {
                    app.showTab('transactions');
                    // İşlem tablosunu filtrele
                    setTimeout(() => {
                        document.getElementById('categoryFilter').value = 'uncategorized';
                        tableManager.applyFilters();
                    }, 300);
                }
                break;
                
            case 'applyCategory':
                // Önerilen kategoriyi uygula
                const categoryId = event.target.getAttribute('data-categoryid');
                const trxId = event.target.getAttribute('data-transactionid');
                
                if (trxId && categoryId) {
                    this.applyCategoryToTransaction(trxId, categoryId);
                }
                break;
                
            case 'viewForecast':
                // Tahmin analizini görüntüle
                this.showForecastAnalysisModal(recommendation.forecastData);
                break;
                
            case 'viewCohortAnalysis':
                // Cohort analizini görüntüle
                this.showCohortAnalysisModal(recommendation.cohortData);
                break;
                
            case 'viewRFMAnalysis':
                // RFM analizini görüntüle
                this.showRFMAnalysisModal(recommendation.rfmData);
                break;
                
            case 'viewParetoAnalysis':
                // Pareto analizini görüntüle
                this.showParetoAnalysisModal(recommendation.paretoData);
                break;
                
            case 'optimizeBudget':
                // Bütçe optimizasyonu sayfasına git
                if (typeof app !== 'undefined') {
                    app.showTab('reports');
                    // Bütçe optimizasyonu sekmesine odaklan
                    setTimeout(() => {
                        const budgetTab = document.querySelector('.tab-button[data-tab="budget-optimization"]');
                        if (budgetTab) budgetTab.click();
                    }, 300);
                }
                break;
                
            case 'optimizeCategory':
                // Kategori optimizasyonu
                const catId = event.target.getAttribute('data-categoryid');
                document.dispatchEvent(new CustomEvent('aiRecommendation:optimizeCategory', {
                    detail: { categoryId: catId }
                }));
                break;
                
            case 'viewExpenseTrends':
                // Gider trendlerini göster
                if (typeof app !== 'undefined') {
                    app.showTab('reports');
                    // Trendler sekmesine odaklan
                    setTimeout(() => {
                        const trendsTab = document.querySelector('.tab-button[data-tab="trends"]');
                        if (trendsTab) trendsTab.click();
                    }, 300);
                }
                break;
                
            case 'createBudgetPlan':
                // Bütçe planı oluştur
                const budgetCategoryId = event.target.getAttribute('data-categoryid');
                document.dispatchEvent(new CustomEvent('aiRecommendation:createBudgetPlan', {
                    detail: { categoryId: budgetCategoryId }
                }));
                break;
                
            case 'dismiss':
                // Öneriyi kapat
                this.dismissRecommendation(recommendationId);
                break;
        }
    }
    
    /**
     * Tahmin analizi modalını göster
     */
    showForecastAnalysisModal(forecastData) {
        if (!forecastData) return;
        
        // Modal HTML'i oluştur
        const modalHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>Gelir/Gider Tahmin Analizi</h3>
                    <button class="modal-close" onclick="document.getElementById('modalContainer').innerHTML = ''">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="mb-6">
                        <p class="text-gray-600 mb-4">Son 6 ay verilerine dayanarak gelecek 3 ay için tahminleme yapılmıştır. Bu tahminler, geçmiş harcama ve gelir trendlerinize göre doğrusal regresyon yöntemiyle hesaplanmıştır.</p>
                        
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 class="font-medium text-gray-900 mb-2">Gelecek Ay Tahmini</h4>
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <p class="text-sm text-gray-600">Tahmini Gelir</p>
                                    <p class="text-xl font-bold text-green-600">${formatCurrency(forecastData.forecastIncome[0])}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Tahmini Gider</p>
                                    <p class="text-xl font-bold text-red-600">${formatCurrency(forecastData.forecastExpense[0])}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Tahmini Bakiye</p>
                                    <p class="text-xl font-bold ${forecastData.forecastIncome[0] - forecastData.forecastExpense[0] >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(forecastData.forecastIncome[0] - forecastData.forecastExpense[0])}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="h-64">
                            <canvas id="forecastChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <h4 class="font-medium text-gray-900 mb-2">3 Aylık Tahminler</h4>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                        <th class="py-3 px-4 text-left">Ay</th>
                                        <th class="py-3 px-4 text-right">Tahmini Gelir</th>
                                        <th class="py-3 px-4 text-right">Tahmini Gider</th>
                                        <th class="py-3 px-4 text-right">Tahmini Bakiye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[0, 1, 2].map(i => `
                                        <tr class="border-b border-gray-200 hover:bg-gray-50">
                                            <td class="py-3 px-4 text-left">${i + 1}. Ay</td>
                                            <td class="py-3 px-4 text-right text-green-600">${formatCurrency(forecastData.forecastIncome[i])}</td>
                                            <td class="py-3 px-4 text-right text-red-600">${formatCurrency(forecastData.forecastExpense[i])}</td>
                                            <td class="py-3 px-4 text-right ${forecastData.forecastIncome[i] - forecastData.forecastExpense[i] >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(forecastData.forecastIncome[i] - forecastData.forecastExpense[i])}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML = ''">Kapat</button>
                </div>
            </div>
        `;
        
        // Modal container oluştur/güncelle
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = modalHTML;
        
        // Lucide ikonlarını yükle
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Tahmin grafiğini oluştur
        setTimeout(() => {
            const ctx = document.getElementById('forecastChart');
            if (ctx) {
                const chart = new Chart(ctx, {
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
            }
        }, 300);
    }
    
    /**
     * Cohort analizi modalını göster
     */
    showCohortAnalysisModal(cohortData) {
        if (!cohortData) return;
        
        // Son 6 ayı göster (veya daha az sayıda ay varsa tümünü)
        const cohortKeys = Array.isArray(cohortData.months) ? cohortData.months : (cohortData.cohorts || []).sort();
        const displayedCohorts = cohortKeys.slice(-6);
        
        // Modal HTML'i oluştur
        const modalHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>Kohort Analizi</h3>
                    <button class="modal-close" onclick="document.getElementById('modalContainer').innerHTML = ''">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="mb-6">
                        <p class="text-gray-600 mb-4">Kohort analizi, aynı zaman diliminde (ay) yapılan işlemleri gruplayarak finansal davranışlarınızdaki değişimleri tespit etmeye yarar.</p>
                        
                        <div class="h-64 mb-6">
                            <canvas id="cohortChart"></canvas>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-medium text-gray-900 mb-2">Gider/Gelir Oranı Değişimi</h4>
                            <p class="text-sm text-gray-600 mb-2">Bu oran, her ay harcamalarınızın gelirinize oranını gösterir. Düşük oran daha iyi finansal durum anlamına gelir.</p>
                            
                            ${cohortData.firstMonthRatio && cohortData.lastMonthRatio ? `
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm text-gray-600">İlk Ay Oranı</p>
                                        <p class="text-xl font-medium">${Math.round(cohortData.firstMonthRatio * 100)}%</p>
                                        <p class="text-xs text-gray-500">${cohortData.firstMonth}</p>
                                    </div>
                                    <div class="text-2xl text-gray-400">
                                        <i data-lucide="arrow-right"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">Son Ay Oranı</p>
                                        <p class="text-xl font-medium ${cohortData.lastMonthRatio <= cohortData.firstMonthRatio ? 'text-green-600' : 'text-red-600'}">
                                            ${Math.round(cohortData.lastMonthRatio * 100)}%
                                            ${cohortData.lastMonthRatio <= cohortData.firstMonthRatio ? 
                                                `<span class="text-sm">(-${Math.round((1 - cohortData.lastMonthRatio / cohortData.firstMonthRatio) * 100)}%)</span>` : 
                                                `<span class="text-sm">(+${Math.round((cohortData.lastMonthRatio / cohortData.firstMonthRatio - 1) * 100)}%)</span>`
                                            }
                                        </p>
                                        <p class="text-xs text-gray-500">${cohortData.lastMonth}</p>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <h4 class="font-medium text-gray-900 mb-2">Ay Bazlı Kohort Verileri</h4>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                        <th class="py-3 px-4 text-left">Ay</th>
                                        <th class="py-3 px-4 text-right">İşlem Sayısı</th>
                                        <th class="py-3 px-4 text-right">Gelir</th>
                                        <th class="py-3 px-4 text-right">Gider</th>
                                        <th class="py-3 px-4 text-right">Net Bakiye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${displayedCohorts.map(cohortKey => {
                                        const metrics = cohortData.metrics?.[cohortKey] || {};
                                        return `
                                            <tr class="border-b border-gray-200 hover:bg-gray-50">
                                                <td class="py-3 px-4 text-left">${cohortKey}</td>
                                                <td class="py-3 px-4 text-right">${metrics.transactionCount || 0}</td>
                                                <td class="py-3 px-4 text-right text-green-600">${formatCurrency(metrics.totalIncome || 0)}</td>
                                                <td class="py-3 px-4 text-right text-red-600">${formatCurrency(metrics.totalExpense || 0)}</td>
                                                <td class="py-3 px-4 text-right ${(metrics.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(metrics.netBalance || 0)}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML = ''">Kapat</button>
                </div>
            </div>
        `;
        
        // Modal container oluştur/güncelle
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = modalHTML;
        
        // Lucide ikonlarını yükle
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Cohort grafiğini oluştur
        setTimeout(() => {
            const ctx = document.getElementById('cohortChart');
            if (ctx && displayedCohorts.length > 0) {
                // Grafik verilerini hazırla
                const labels = displayedCohorts;
                const incomeData = [];
                const expenseData = [];
                const balanceData = [];
                
                displayedCohorts.forEach(cohortKey => {
                    const metrics = cohortData.metrics?.[cohortKey] || {};
                    incomeData.push(metrics.totalIncome || 0);
                    expenseData.push(metrics.totalExpense || 0);
                    balanceData.push(metrics.netBalance || 0);
                });
                
                // Grafik oluştur
                const chart = new Chart(ctx, {
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
            }
        }, 300);
    }
    
    /**
     * RFM analizi modalını göster
     */
    showRFMAnalysisModal(rfmData) {
        if (!rfmData) return;
        
        // En yüksek 10 kategoriyi göster
        const topCategories = Object.entries(rfmData.categoryRFM || {})
            .sort((a, b) => b[1].rfmScore - a[1].rfmScore)
            .slice(0, 10)
            .map(([categoryId, data]) => ({
                id: categoryId,
                ...data
            }));
        
        // Modal HTML'i oluştur
        const modalHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>RFM Analizi (Recency, Frequency, Monetary)</h3>
                    <button class="modal-close" onclick="document.getElementById('modalContainer').innerHTML = ''">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="mb-6">
                        <p class="text-gray-600 mb-4">RFM analizi, harcama kategorilerinizi 3 boyutta değerlendirir: Yakınlık (son harcama ne kadar yakın), Sıklık (ne kadar sık harcama yapıyorsunuz) ve Parasal Değer (ne kadar harcıyorsunuz).</p>
                        
                        <div class="h-64 mb-6">
                            <canvas id="rfmChart"></canvas>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-medium text-gray-900 mb-2">RFM Skor Açıklaması</h4>
                            <p class="text-sm text-gray-600">Skorlar 1-5 arasındadır (5 en yüksek değer). Yüksek skor, finansal planlamanızda önemli kategorileri gösterir.</p>
                            <div class="grid grid-cols-3 gap-4 mt-3">
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
                    
                    <div class="mt-6">
                        <h4 class="font-medium text-gray-900 mb-2">Kategori RFM Skorları</h4>
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
                                <tbody>
                                    ${topCategories.map(category => `
                                        <tr class="border-b border-gray-200 hover:bg-gray-50">
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
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML = ''">Kapat</button>
                </div>
            </div>
        `;
        
        // Modal container oluştur/güncelle
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = modalHTML;
        
        // Lucide ikonlarını yükle
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // RFM grafiğini oluştur
        setTimeout(() => {
            const ctx = document.getElementById('rfmChart');
            if (ctx && topCategories.length > 0) {
                // Radar chart için verileri hazırla
                const chart = new Chart(ctx, {
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
            }
        }, 300);
    }
    
    /**
     * Pareto analizi modalını göster
     */
    showParetoAnalysisModal(paretoData) {
        if (!paretoData) return;
        
        // Pareto kategorilerini al
        const paretoCategories = paretoData.paretoCategories || [];
        const allCategories = paretoData.allCategories || [];
        const topCategory = paretoData.topCategory || paretoCategories[0];
        const categoryCount = paretoData.categoryCount || allCategories.length;
        const paretoCategoryCount = paretoData.paretoCategoryCount || paretoCategories.length;
        
        // Modal HTML'i oluştur
        const modalHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>Pareto Analizi (80/20 Kuralı)</h3>
                    <button class="modal-close" onclick="document.getElementById('modalContainer').innerHTML = ''">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="mb-6">
                        <p class="text-gray-600 mb-4">Pareto Analizi (80/20 Kuralı), harcamalarınızın %80'inin kategorilerinizin %20'sinden geldiğini tespit eder. Bu, en kritik harcama alanlarınızı belirlemenize yardımcı olur.</p>
                        
                        <div class="h-64 mb-6">
                            <canvas id="paretoChart"></canvas>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h4 class="font-medium text-gray-900 mb-2">Pareto Analizi Sonuçları</h4>
                            <div class="grid grid-cols-2 gap-6">
                                <div>
                                    <p class="text-sm text-gray-600">Kategori Dağılımı</p>
                                    <p class="text-xl font-medium">
                                        Toplam ${categoryCount} kategoriden ${paretoCategoryCount} tanesi
                                        <span class="text-blue-600">(%${Math.round((paretoCategoryCount / categoryCount) * 100)})</span>
                                        harcamalarınızın
                                        <span class="text-red-600">%${Math.round(paretoCategories.length > 0 ? paretoCategories[paretoCategories.length - 1].cumulativePercentage : 0)}'sini</span>
                                        oluşturuyor.
                                    </p>
                                </div>
                                ${topCategory ? `
                                <div>
                                    <p class="text-sm text-gray-600">En Yüksek Kategori</p>
                                    <p class="text-xl font-medium">${topCategory.name}</p>
                                    <p class="text-sm">
                                        Tüm harcamaların <span class="text-red-600">%${Math.round(topCategory.percentage)}'si</span>
                                        <span class="text-gray-500">(${formatCurrency(topCategory.total)})</span>
                                    </p>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <h4 class="font-medium text-gray-900 mb-2">Kategori Dağılımı</h4>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead>
                                    <tr class="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                                        <th class="py-3 px-4 text-left">Kategori</th>
                                        <th class="py-3 px-4 text-center">İşlem Sayısı</th>
                                        <th class="py-3 px-4 text-right">Toplam</th>
                                        <th class="py-3 px-4 text-right">Yüzde (%)</th>
                                        <th class="py-3 px-4 text-right">Kümülatif (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${allCategories.slice(0, 10).map((category, index) => `
                                        <tr class="border-b border-gray-200 hover:bg-gray-50 ${index < paretoCategoryCount ? 'bg-red-50' : ''}">
                                            <td class="py-3 px-4 text-left font-medium">${category.name}</td>
                                            <td class="py-3 px-4 text-center">${category.transactionCount}</td>
                                            <td class="py-3 px-4 text-right text-red-600">${formatCurrency(category.total)}</td>
                                            <td class="py-3 px-4 text-right">${Math.round(category.percentage)}%</td>
                                            <td class="py-3 px-4 text-right">
                                                ${Math.round(category.cumulativePercentage || 0)}%
                                                ${index === paretoCategoryCount - 1 ? 
                                                    '<span class="inline-block ml-2 w-2 h-5 bg-blue-500"></span>' : ''}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML = ''">Kapat</button>
                </div>
            </div>
        `;
        
        // Modal container oluştur/güncelle
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        modalContainer.innerHTML = modalHTML;
        
        // Lucide ikonlarını yükle
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Pareto grafiğini oluştur
        setTimeout(() => {
            const ctx = document.getElementById('paretoChart');
            if (ctx && allCategories.length > 0) {
                // Grafik için verileri hazırla
                const categories = allCategories.slice(0, 10).map(c => c.name);
                const amounts = allCategories.slice(0, 10).map(c => c.total);
                const cumulativePercentages = allCategories.slice(0, 10).map(c => c.cumulativePercentage || 0);
                
                // Grafik oluştur
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: categories,
                        datasets: [
                            {
                                label: 'Kategori Harcaması',
                                data: amounts,
                                backgroundColor: (context) => {
                                    const index = context.dataIndex;
                                    return index < paretoCategoryCount ? 'rgba(239, 68, 68, 0.7)' : 'rgba(156, 163, 175, 0.7)';
                                },
                                borderColor: (context) => {
                                    const index = context.dataIndex;
                                    return index < paretoCategoryCount ? 'rgba(239, 68, 68, 1)' : 'rgba(156, 163, 175, 1)';
                                },
                                borderWidth: 1,
                                order: 2
                            },
                            {
                                label: 'Kümülatif Yüzde',
                                data: cumulativePercentages,
                                backgroundColor: 'rgba(0, 0, 0, 0)',
                                borderColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 2,
                                type: 'line',
                                order: 1,
                                yAxisID: 'y1',
                                pointRadius: 4,
                                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 1
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
                                    text: 'Kümülatif Yüzde (%)'
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
                            annotation: {
                                annotations: {
                                    line1: {
                                        type: 'line',
                                        yMin: 80,
                                        yMax: 80,
                                        borderColor: 'rgba(59, 130, 246, 0.5)',
                                        borderWidth: 2,
                                        borderDash: [6, 6],
                                        label: {
                                            content: '80%',
                                            enabled: true,
                                            position: 'end',
                                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                            color: 'white',
                                            font: {
                                                size: 12
                                            }
                                        },
                                        yScaleID: 'y1'
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        if (context.dataset.label === 'Kategori Harcaması') {
                                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                                        } else {
                                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }, 300);
    }
    
    /**
     * RFM yıldızlarını render et
     */
    renderRFMStars(score) {
        const fullStars = Math.floor(score);
        const halfStar = score - fullStars >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let html = '';
        
        // Dolu yıldızlar
        for (let i = 0; i < fullStars; i++) {
            html += '<i data-lucide="star" class="w-4 h-4 inline-block text-amber-500"></i>';
        }
        
        // Yarım yıldız
        if (halfStar) {
            html += '<i data-lucide="star-half" class="w-4 h-4 inline-block text-amber-500"></i>';
        }
        
        // Boş yıldızlar
        for (let i = 0; i < emptyStars; i++) {
            html += '<i data-lucide="star" class="w-4 h-4 inline-block text-gray-300"></i>';
        }
        
        return html;
    }

    /**
     * İşleme kategori uygula
     */
    async applyCategoryToTransaction(transactionId, categoryId) {
        try {
            // İşlemi güncelle
            await this.dataManager.updateTransaction(transactionId, { categoryId });
            
            // Başarı mesajı
            showToast('Kategori başarıyla uygulandı', 'success');
            
            // Öneriyi kaldır
            this.dismissRecommendation(`categorize-${transactionId}`);
            
            // Önerileri yeniden oluştur
            await this.update();
        } catch (error) {
            console.error('Kategori uygulama hatası:', error);
            showToast('Kategori uygulanırken hata oluştu', 'error');
        }
    }

    /**
     * Öneriyi kapat
     */
    dismissRecommendation(recommendationId) {
        // Öneriyi diziden kaldır
        this.recommendations = this.recommendations.filter(r => r.id !== recommendationId);
        
        // DOM'dan kaldır
        const card = this.container.querySelector(`[data-id="${recommendationId}"]`);
        if (card) {
            card.remove();
        }
        
        // Tüm öneriler kapandıysa mesaj göster
        if (this.recommendations.length === 0) {
            this.renderRecommendations();
        }
    }

    /**
     * Güncelleme
     */
    async update() {
        try {
            if (!this.initialized) {
                return await this.initialize();
            }
            
            // Önerileri yeniden oluştur
            await this.generateRecommendations();
            
            // Render et
            this.renderRecommendations();
            
            return true;
        } catch (error) {
            console.error('AI Recommendations güncelleme hatası:', error);
            return false;
        }
    }

    /**
     * Tahminleme önerileri oluştur
     */
    async generateForecastRecommendations(transactions, stats, monthlyStats) {
        try {
            // Son 6 aylık veriyi kullanarak gelecek 3 ay için tahmin yap
            if (monthlyStats.length < 6) {
                console.log('Tahminleme için yeterli veri yok (en az 6 ay gerekli)');
                return;
            }

            // Son 6 ay verisini al
            const recentMonths = monthlyStats.slice(-6);
            
            // Gelir ve gider trend analizini yap
            const incomeData = recentMonths.map(m => m.totalIncome);
            const expenseData = recentMonths.map(m => m.totalExpense);
            
            // Basit doğrusal regresyon ile tahmin
            const incomeForecast = this.linearRegression(incomeData, 3);
            const expenseForecast = this.linearRegression(expenseData, 3);
            
            // Tahmin verilerini kaydet
            this.forecastData = {
                historicalIncome: incomeData,
                historicalExpense: expenseData,
                forecastIncome: incomeForecast,
                forecastExpense: expenseForecast,
                createdAt: new Date().toISOString()
            };
            
            // Gelecek ay tahminine göre öneri oluştur
            const nextMonthIncome = incomeForecast[0];
            const nextMonthExpense = expenseForecast[0];
            const predictedBalance = nextMonthIncome - nextMonthExpense;
            
            // Eğer tahmin edilen harcama gelirden fazlaysa uyarı oluştur
            if (nextMonthExpense > nextMonthIncome) {
                this.recommendations.push({
                    id: 'income-expense-forecast',
                    type: 'warning',
                    title: 'Negatif bakiye tahmini',
                    description: `Gelecek ay için yapılan tahmine göre giderleriniz (${formatCurrency(nextMonthExpense)}) gelirlerinizden (${formatCurrency(nextMonthIncome)}) fazla olabilir. Yaklaşık ${formatCurrency(nextMonthExpense - nextMonthIncome)} tutarında negatif bakiye bekleniyor.`,
                    actions: [
                        { id: 'view-forecast', label: 'Tahminleri Görüntüle', action: 'viewForecast' },
                        { id: 'optimize-budget', label: 'Bütçe Optimizasyonu', action: 'optimizeBudget' }
                    ],
                    priority: 'high',
                    forecastData: this.forecastData
                });
            } 
            // Bütçe dengesi iyiyse bilgilendirme oluştur
            else if (predictedBalance > 0 && predictedBalance > stats.netBalance * 0.2) {
                this.recommendations.push({
                    id: 'positive-forecast',
                    type: 'info',
                    title: 'Olumlu bütçe tahmini',
                    description: `Gelecek ay için yaklaşık ${formatCurrency(predictedBalance)} pozitif bakiye bekleniyor. Bu tutarı tasarruf veya yatırım için değerlendirebilirsiniz.`,
                    actions: [
                        { id: 'view-forecast', label: 'Tahminleri Görüntüle', action: 'viewForecast' },
                        { id: 'set-saving-goal', label: 'Tasarruf Hedefi Belirle', action: 'setSavingGoal', amount: Math.round(predictedBalance * 0.5) }
                    ],
                    priority: 'medium',
                    forecastData: this.forecastData
                });
            }
            
            // Anormal artış veya azalış tahmini varsa uyarı oluştur
            const lastMonthIncome = incomeData[incomeData.length - 1];
            const lastMonthExpense = expenseData[expenseData.length - 1];
            
            const incomeChange = (nextMonthIncome - lastMonthIncome) / lastMonthIncome;
            const expenseChange = (nextMonthExpense - lastMonthExpense) / lastMonthExpense;
            
            if (incomeChange < -0.15) {
                // Gelirde önemli düşüş
                this.recommendations.push({
                    id: 'income-decrease-forecast',
                    type: 'alert',
                    title: 'Gelir düşüşü tahmini',
                    description: `Gelecek ay için gelirinizde yaklaşık %${Math.abs(Math.round(incomeChange * 100))} oranında düşüş tahmin ediliyor. Bu durum bütçe dengenizi etkileyebilir.`,
                    actions: [
                        { id: 'view-forecast', label: 'Tahminleri Görüntüle', action: 'viewForecast' },
                        { id: 'reduce-expenses', label: 'Giderleri Azalt', action: 'optimizeBudget' }
                    ],
                    priority: 'high',
                    forecastData: this.forecastData
                });
            }
            
            if (expenseChange > 0.15) {
                // Giderde önemli artış
                this.recommendations.push({
                    id: 'expense-increase-forecast',
                    type: 'warning',
                    title: 'Gider artışı tahmini',
                    description: `Gelecek ay için giderlerinizde yaklaşık %${Math.round(expenseChange * 100)} oranında artış tahmin ediliyor. Bu artışın nedenlerini analiz etmeniz önerilir.`,
                    actions: [
                        { id: 'view-forecast', label: 'Tahminleri Görüntüle', action: 'viewForecast' },
                        { id: 'view-expense-trends', label: 'Gider Trendlerini İncele', action: 'viewExpenseTrends' }
                    ],
                    priority: 'medium',
                    forecastData: this.forecastData
                });
            }
        } catch (error) {
            console.error('Tahminleme önerileri oluşturma hatası:', error);
        }
    }
    
    /**
     * Cohort analizi önerileri oluştur
     */
    async generateCohortRecommendations(transactions) {
        try {
            // İşlemleri kümeler halinde analiz et
            if (transactions.length < 20) {
                console.log('Cohort analizi için yeterli veri yok (en az 20 işlem gerekli)');
                return;
            }
            
            // İşlemleri tarih bazlı gruplara ayır (aylık)
            const cohorts = {};
            
            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const cohortKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                
                if (!cohorts[cohortKey]) {
                    cohorts[cohortKey] = [];
                }
                
                cohorts[cohortKey].push(transaction);
            });
            
            // Her kohort için temel metrikleri hesapla
            const cohortMetrics = {};
            
            for (const [cohortKey, cohortTransactions] of Object.entries(cohorts)) {
                const incomeTransactions = cohortTransactions.filter(t => t.type === 'income');
                const expenseTransactions = cohortTransactions.filter(t => t.type === 'expense');
                
                const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                const totalExpense = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                
                // Kategorilere göre dağılım
                const categoryDistribution = {};
                expenseTransactions.forEach(t => {
                    if (!categoryDistribution[t.categoryId]) {
                        categoryDistribution[t.categoryId] = 0;
                    }
                    categoryDistribution[t.categoryId] += t.amount || 0;
                });
                
                cohortMetrics[cohortKey] = {
                    totalIncome,
                    totalExpense,
                    netBalance: totalIncome - totalExpense,
                    transactionCount: cohortTransactions.length,
                    incomeCount: incomeTransactions.length,
                    expenseCount: expenseTransactions.length,
                    avgIncomeAmount: incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0,
                    avgExpenseAmount: expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0,
                    categoryDistribution
                };
            }
            
            // Cohort analiz verilerini kaydet
            this.cohortData = {
                cohorts: Object.keys(cohorts),
                metrics: cohortMetrics,
                createdAt: new Date().toISOString()
            };
            
            // Cohort analizi sonuçlarına göre öneriler oluştur
            const cohortKeys = Object.keys(cohorts).sort();
            if (cohortKeys.length >= 3) {
                // Son 3 ay için trend analizi
                const last3Months = cohortKeys.slice(-3);
                const trend = last3Months.map(key => cohortMetrics[key].netBalance);
                
                // Negatif trend tespiti
                if (trend[2] < trend[1] && trend[1] < trend[0]) {
                    this.recommendations.push({
                        id: 'cohort-negative-trend',
                        type: 'warning',
                        title: 'Azalan bütçe dengesi',
                        description: `Son 3 aydır bütçe dengenizde sürekli düşüş gözleniyor. Bu trendin devam etmesi durumunda finansal zorluklarla karşılaşabilirsiniz.`,
                        actions: [
                            { id: 'view-cohort-analysis', label: 'Kohort Analizini Görüntüle', action: 'viewCohortAnalysis' },
                            { id: 'optimize-budget', label: 'Bütçe Optimizasyonu', action: 'optimizeBudget' }
                        ],
                        priority: 'high',
                        cohortData: {
                            months: last3Months,
                            trend: trend
                        }
                    });
                }
                
                // Son ay ve ilk ay karşılaştırması (iyileşme veya kötüleşme)
                const firstMonth = cohortKeys[0];
                const lastMonth = cohortKeys[cohortKeys.length - 1];
                
                const firstMonthRatio = cohortMetrics[firstMonth].totalExpense / cohortMetrics[firstMonth].totalIncome;
                const lastMonthRatio = cohortMetrics[lastMonth].totalExpense / cohortMetrics[lastMonth].totalIncome;
                
                if (lastMonthRatio > firstMonthRatio * 1.2) {
                    // Gider/Gelir oranı kötüleşmiş
                    this.recommendations.push({
                        id: 'cohort-ratio-worsened',
                        type: 'warning',
                        title: 'Bütçe oranı kötüleşiyor',
                        description: `İlk kayıtlarınıza göre aylık gider/gelir oranınız %${Math.round(firstMonthRatio * 100)}'den %${Math.round(lastMonthRatio * 100)}'e yükselmiş durumda. Bu trend finansal sürdürülebilirliğinizi etkileyebilir.`,
                        actions: [
                            { id: 'view-cohort-analysis', label: 'Kohort Analizini Görüntüle', action: 'viewCohortAnalysis' }
                        ],
                        priority: 'medium',
                        cohortData: {
                            firstMonth: firstMonth,
                            lastMonth: lastMonth,
                            firstMonthRatio: firstMonthRatio,
                            lastMonthRatio: lastMonthRatio
                        }
                    });
                } else if (lastMonthRatio < firstMonthRatio * 0.8) {
                    // Gider/Gelir oranı iyileşmiş
                    this.recommendations.push({
                        id: 'cohort-ratio-improved',
                        type: 'optimization',
                        title: 'Bütçe oranı iyileşiyor',
                        description: `İlk kayıtlarınıza göre aylık gider/gelir oranınız %${Math.round(firstMonthRatio * 100)}'den %${Math.round(lastMonthRatio * 100)}'e düşmüş durumda. Bu olumlu trendi sürdürmenizi öneririz.`,
                        actions: [
                            { id: 'view-cohort-analysis', label: 'Kohort Analizini Görüntüle', action: 'viewCohortAnalysis' }
                        ],
                        priority: 'low',
                        cohortData: {
                            firstMonth: firstMonth,
                            lastMonth: lastMonth,
                            firstMonthRatio: firstMonthRatio,
                            lastMonthRatio: lastMonthRatio
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Cohort analizi önerileri oluşturma hatası:', error);
        }
    }
    
    /**
     * RFM (Recency, Frequency, Monetary) analizi önerileri oluştur
     */
    async generateRFMRecommendations(transactions, categories) {
        try {
            // Kategori ve etiket bazlı RFM analizi
            if (transactions.length < 20) {
                console.log('RFM analizi için yeterli veri yok (en az 20 işlem gerekli)');
                return;
            }
            
            // Sadece harcama işlemlerini kullan
            const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.status === 'actual');
            
            // Kategori bazlı RFM analizi
            const categoryRFM = {};
            const today = new Date();
            
            // Kategori adlarını al
            const categoryNames = {};
            for (const type in categories) {
                if (Array.isArray(categories[type])) {
                    categories[type].forEach(category => {
                        categoryNames[category.id] = category.name;
                    });
                }
            }
            
            expenseTransactions.forEach(transaction => {
                const categoryId = transaction.categoryId || 'unknown';
                
                if (!categoryRFM[categoryId]) {
                    categoryRFM[categoryId] = {
                        name: categoryNames[categoryId] || `Kategori #${categoryId.substring(0, 4)}`,
                        transactions: [],
                        recency: 0,
                        frequency: 0,
                        monetary: 0,
                        rfmScore: 0
                    };
                }
                
                categoryRFM[categoryId].transactions.push(transaction);
            });
            
            // Her kategori için RFM skorlarını hesapla
            for (const [categoryId, data] of Object.entries(categoryRFM)) {
                if (data.transactions.length === 0) continue;
                
                // En son işlem (Recency)
                const latestTransaction = data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                const daysSinceLatest = Math.floor((today - new Date(latestTransaction.date)) / (1000 * 60 * 60 * 24));
                
                // İşlem sıklığı (Frequency)
                const frequency = data.transactions.length;
                
                // Toplam harcama (Monetary)
                const totalSpent = data.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                
                // RFM skorları (1-5 arası, 5 en iyi)
                const recencyScore = this.calculateRecencyScore(daysSinceLatest);
                const frequencyScore = this.calculateFrequencyScore(frequency, expenseTransactions.length);
                const monetaryScore = this.calculateMonetaryScore(totalSpent, expenseTransactions);
                
                // Toplam RFM skoru
                const rfmScore = (recencyScore + frequencyScore + monetaryScore) / 3;
                
                categoryRFM[categoryId].recency = daysSinceLatest;
                categoryRFM[categoryId].frequency = frequency;
                categoryRFM[categoryId].monetary = totalSpent;
                categoryRFM[categoryId].recencyScore = recencyScore;
                categoryRFM[categoryId].frequencyScore = frequencyScore;
                categoryRFM[categoryId].monetaryScore = monetaryScore;
                categoryRFM[categoryId].rfmScore = rfmScore;
            }
            
            // RFM analiz verilerini kaydet
            this.rfmData = {
                categoryRFM: categoryRFM,
                createdAt: new Date().toISOString()
            };
            
            // RFM analizi sonuçlarına göre öneriler oluştur
            
            // En yüksek RFM skoruna sahip kategori (en kritik kategori)
            const topRFMCategory = Object.entries(categoryRFM)
                .sort((a, b) => b[1].rfmScore - a[1].rfmScore)[0];
            
            if (topRFMCategory && topRFMCategory[1].rfmScore >= 4) {
                this.recommendations.push({
                    id: `rfm-top-category-${topRFMCategory[0]}`,
                    type: 'info',
                    title: 'Önemli harcama kategorisi',
                    description: `"${topRFMCategory[1].name}" en sık ve yüksek tutarlı harcama yaptığınız kategori. Bu kategorideki harcamalarınızı yakından takip etmeniz bütçe yönetiminiz için kritik öneme sahip.`,
                    actions: [
                        { id: 'view-rfm-analysis', label: 'RFM Analizini Görüntüle', action: 'viewRFMAnalysis' },
                        { id: 'create-budget-plan', label: 'Bütçe Planı Oluştur', action: 'createBudgetPlan', categoryId: topRFMCategory[0] }
                    ],
                    priority: 'medium',
                    rfmData: {
                        categoryId: topRFMCategory[0],
                        categoryName: topRFMCategory[1].name,
                        rfmScore: topRFMCategory[1].rfmScore,
                        monetary: topRFMCategory[1].monetary,
                        frequency: topRFMCategory[1].frequency
                    }
                });
            }
            
            // Yüksek recency (yakın zamanda), düşük frequency (seyrek) olan kategoriler
            const irregularCategories = Object.entries(categoryRFM)
                .filter(([_, data]) => data.recencyScore >= 4 && data.frequencyScore <= 2);
                
            if (irregularCategories.length > 0) {
                const category = irregularCategories[0][1];
                this.recommendations.push({
                    id: 'rfm-irregular-spending',
                    type: 'info',
                    title: 'Düzensiz harcama tespit edildi',
                    description: `"${category.name}" kategorisinde nadir ancak yakın zamanda harcama yaptınız. Bu tür düzensiz harcamalar bütçe planlamasını zorlaştırabilir.`,
                    actions: [
                        { id: 'view-rfm-analysis', label: 'RFM Analizini Görüntüle', action: 'viewRFMAnalysis' }
                    ],
                    priority: 'low',
                    rfmData: {
                        categoryName: category.name,
                        recencyScore: category.recencyScore,
                        frequencyScore: category.frequencyScore
                    }
                });
            }
        } catch (error) {
            console.error('RFM analizi önerileri oluşturma hatası:', error);
        }
    }
    
    /**
     * Pareto analizi (80/20 kuralı) önerileri oluştur
     */
    async generateParetoRecommendations(transactions, categories) {
        try {
            // Pareto prensibi: Harcamaların %80'inin kategorilerin %20'sinden geldiğini analiz et
            if (transactions.length < 20) {
                console.log('Pareto analizi için yeterli veri yok (en az 20 işlem gerekli)');
                return;
            }
            
            // Sadece harcama işlemlerini kullan
            const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.status === 'actual');
            
            // Kategori bazlı toplam harcamalar
            const categoryTotals = {};
            const totalExpense = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            
            // Kategori adlarını al
            const categoryNames = {};
            for (const type in categories) {
                if (Array.isArray(categories[type])) {
                    categories[type].forEach(category => {
                        categoryNames[category.id] = category.name;
                    });
                }
            }
            
            // Kategori bazlı harcamaları hesapla
            expenseTransactions.forEach(transaction => {
                const categoryId = transaction.categoryId || 'unknown';
                
                if (!categoryTotals[categoryId]) {
                    categoryTotals[categoryId] = {
                        id: categoryId,
                        name: categoryNames[categoryId] || `Kategori #${categoryId.substring(0, 4)}`,
                        total: 0,
                        percentage: 0,
                        transactionCount: 0
                    };
                }
                
                categoryTotals[categoryId].total += transaction.amount || 0;
                categoryTotals[categoryId].transactionCount++;
            });
            
            // Yüzdeleri hesapla ve sırala
            const sortedCategories = Object.values(categoryTotals)
                .map(category => {
                    category.percentage = (category.total / totalExpense) * 100;
                    return category;
                })
                .sort((a, b) => b.total - a.total);
                
            // Kümülatif yüzdeleri hesapla
            let cumulativePercentage = 0;
            const paretoData = sortedCategories.map(category => {
                cumulativePercentage += category.percentage;
                return {
                    ...category,
                    cumulativePercentage
                };
            });
            
            // Pareto prensibi: Harcamaların %80'ini oluşturan kategorileri bul
            const paretoCategories = [];
            for (const category of paretoData) {
                paretoCategories.push(category);
                if (category.cumulativePercentage >= 80) break;
            }
            
            // Pareto analiz verilerini kaydet
            this.paretoData = {
                paretoCategories,
                allCategories: sortedCategories,
                categoryCount: sortedCategories.length,
                paretoCategoryCount: paretoCategories.length,
                paretoRatio: paretoCategories.length / sortedCategories.length,
                createdAt: new Date().toISOString()
            };
            
            // Pareto analizi sonuçlarına göre öneriler oluştur
            if (paretoCategories.length <= Math.ceil(sortedCategories.length * 0.2)) {
                // 80/20 kuralı doğrulanıyor
                const topCategory = paretoCategories[0];
                
                this.recommendations.push({
                    id: 'pareto-analysis',
                    type: 'info',
                    title: 'Pareto Analizi: 80/20 Kuralı',
                    description: `Harcamalarınızın %${Math.round(paretoCategories[paretoCategories.length-1].cumulativePercentage)}'i sadece ${paretoCategories.length} kategoriden geliyor (toplam ${sortedCategories.length} kategori içinden). "${topCategory.name}" en yüksek harcama kategoriniz (%${Math.round(topCategory.percentage)}).`,
                    actions: [
                        { id: 'view-pareto-analysis', label: 'Pareto Analizini Görüntüle', action: 'viewParetoAnalysis' },
                        { id: 'optimize-top-category', label: 'En Yüksek Kategoriyi Optimize Et', action: 'optimizeCategory', categoryId: topCategory.id }
                    ],
                    priority: 'medium',
                    paretoData: {
                        topCategory,
                        categoryCount: sortedCategories.length,
                        paretoCategoryCount: paretoCategories.length
                    }
                });
                
                // En yüksek kategoride bütçe optimizasyonu tavsiyesi
                if (topCategory.percentage > 40) {
                    this.recommendations.push({
                        id: `pareto-top-category-${topCategory.id}`,
                        type: 'optimization',
                        title: 'Kritik harcama kategorisi',
                        description: `"${topCategory.name}" harcamalarınızın %${Math.round(topCategory.percentage)}'ini oluşturuyor. Bu kategoride yapacağınız küçük tasarruflar bile genel bütçenize önemli katkı sağlayabilir.`,
                        actions: [
                            { id: 'create-budget-plan', label: 'Bütçe Planı Oluştur', action: 'createBudgetPlan', categoryId: topCategory.id },
                            { id: 'set-saving-goal', label: 'Tasarruf Hedefi Belirle', action: 'setSavingGoal', amount: Math.round(topCategory.total * 0.1) }
                        ],
                        priority: 'high',
                        paretoData: {
                            categoryId: topCategory.id,
                            categoryName: topCategory.name,
                            percentage: topCategory.percentage,
                            total: topCategory.total
                        }
                    });
                }
            } else {
                // Dengeli harcama dağılımı
                this.recommendations.push({
                    id: 'pareto-balanced',
                    type: 'info',
                    title: 'Dengeli harcama dağılımı',
                    description: `Harcamalarınız kategoriler arasında görece dengeli dağılmış durumda. Bu durum bütçe kontrolü için olumlu bir gösterge olabilir.`,
                    actions: [
                        { id: 'view-pareto-analysis', label: 'Kategori Dağılımını Görüntüle', action: 'viewParetoAnalysis' }
                    ],
                    priority: 'low',
                    paretoData: {
                        categoryCount: sortedCategories.length,
                        paretoCategoryCount: paretoCategories.length,
                        paretoRatio: this.paretoData.paretoRatio
                    }
                });
            }
        } catch (error) {
            console.error('Pareto analizi önerileri oluşturma hatası:', error);
        }
    }
    
    /**
     * Recency skoru hesapla (1-5 arası, 5 en iyi)
     */
    calculateRecencyScore(daysSinceLatest) {
        if (daysSinceLatest <= 7) return 5;
        if (daysSinceLatest <= 14) return 4;
        if (daysSinceLatest <= 30) return 3;
        if (daysSinceLatest <= 60) return 2;
        return 1;
    }
    
    /**
     * Frequency skoru hesapla (1-5 arası, 5 en iyi)
     */
    calculateFrequencyScore(frequency, totalTransactions) {
        const ratio = frequency / totalTransactions;
        if (ratio >= 0.2) return 5;
        if (ratio >= 0.15) return 4;
        if (ratio >= 0.1) return 3;
        if (ratio >= 0.05) return 2;
        return 1;
    }
    
    /**
     * Monetary skoru hesapla (1-5 arası, 5 en iyi)
     */
    calculateMonetaryScore(amount, transactions) {
        // Tüm işlemleri tutarlarına göre sırala
        const sortedAmounts = transactions
            .map(t => t.amount || 0)
            .sort((a, b) => b - a);
        
        // Tutarın persantil konumunu hesapla
        const percentile = this.findPercentile(amount, sortedAmounts);
        
        if (percentile >= 80) return 5;
        if (percentile >= 60) return 4;
        if (percentile >= 40) return 3;
        if (percentile >= 20) return 2;
        return 1;
    }
    
    /**
     * Bir değerin persantil konumunu hesapla
     */
    findPercentile(value, sortedArray) {
        const index = sortedArray.findIndex(v => v <= value);
        if (index === -1) return 0;
        return (index / sortedArray.length) * 100;
    }
    
    /**
     * Basit doğrusal regresyon ile tahmin
     */
    linearRegression(data, forecastPeriods = 3) {
        // En az 3 veri noktası gerekli
        if (!data || data.length < 3) return Array(forecastPeriods).fill(data[data.length - 1] || 0);
        
        const n = data.length;
        const xValues = Array.from({length: n}, (_, i) => i);
        
        // Ortalamalar
        const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
        const yMean = data.reduce((sum, y) => sum + y, 0) / n;
        
        // Slope (m) hesapla
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
            numerator += (xValues[i] - xMean) * (data[i] - yMean);
            denominator += (xValues[i] - xMean) * (xValues[i] - xMean);
        }
        
        const slope = numerator / denominator;
        const intercept = yMean - (slope * xMean);
        
        // Tahminleri hesapla
        const forecast = [];
        for (let i = 1; i <= forecastPeriods; i++) {
            const xForecast = n + i - 1;
            const yForecast = Math.max(0, slope * xForecast + intercept); // Negatif değerleri engelle
            forecast.push(Math.round(yForecast));
        }
        
        return forecast;
    }
    
    /**
     * Temizlik
     */
    cleanup() {
        // Event listener'ları temizle
        if (this.container) {
            this.container.removeEventListener('click', this.handleRecommendationAction);
        }
        
        // Önerileri temizle
        this.recommendations = [];
        
        // Container içeriğini temizle
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.initialized = false;
    }
}