// js/dataManager.js - Veri Yönetimi

class DataManager {
    constructor() {
        this.storageKey = 'budgetTracker';
        this.db = null;
        this.dbName = 'budgetTrackerDB';
        this.dbVersion = 1;
        this.dataReady = false;
        this.initPromise = this.initDatabase();
    }

    /**
     * IndexedDB veritabanını başlat
     */
    async initDatabase() {
        try {
            console.log('IndexedDB veritabanı başlatılıyor...');
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = (event) => {
                    console.error('IndexedDB başlatma hatası:', event.target.error);
                    // Yedek plan: localStorage kullan
                    console.log('IndexedDB başlatılamadı, localStorage kullanılacak');
                    this.useLocalStorage = true;
                    this.initLocalStorage();
                    resolve(false);
                };
                
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log('IndexedDB başarıyla başlatıldı');
                    this.useLocalStorage = false;
                    this.dataReady = true;
                    resolve(true);
                };
                
                request.onupgradeneeded = (event) => {
                    console.log('IndexedDB veritabanı oluşturuluyor veya güncelleniyor...');
                    const db = event.target.result;
                    
                    // Eski veritabanı yapısını temizle
                    if (db.objectStoreNames.contains('budgetData')) {
                        db.deleteObjectStore('budgetData');
                    }
                    
                    // Yeni nesne deposu oluştur
                    const store = db.createObjectStore('budgetData', { keyPath: 'id' });
                    store.createIndex('id', 'id', { unique: true });
                    
                    console.log('IndexedDB veritabanı yapısı oluşturuldu');
                };
            });
        } catch (error) {
            console.error('IndexedDB başlatma hatası:', error);
            // Yedek plan: localStorage kullan
            this.useLocalStorage = true;
            this.initLocalStorage();
            return false;
        }
    }

    /**
     * Yedek olarak localStorage başlat
     */
    initLocalStorage() {
        console.log('localStorage başlatılıyor...');
        const defaultData = this.getDefaultData();
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        }
        this.dataReady = true;
    }

    /**
     * Varsayılan veri yapısı
     */
    getDefaultData() {
        return {
            id: 'mainData',
            transactions: [],
            categories: {
                income: [
                    {
                        id: generateUUID(),
                        name: 'Maaş',
                        type: 'income',
                        color: '#10B981',
                        icon: 'briefcase',
                        subcategories: []
                    },
                    {
                        id: generateUUID(),
                        name: 'Yatırım',
                        type: 'income',
                        color: '#3B82F6',
                        icon: 'trending-up',
                        subcategories: []
                    }
                ],
                expense: [
                    {
                        id: generateUUID(),
                        name: 'Market',
                        type: 'expense',
                        color: '#EF4444',
                        icon: 'shopping-cart',
                        subcategories: []
                    },
                    {
                        id: generateUUID(),
                        name: 'Ulaşım',
                        type: 'expense',
                        color: '#F59E0B',
                        icon: 'car',
                        subcategories: []
                    }
                ]
            },
            accounts: [
                {
                    id: generateUUID(),
                    name: 'Nakit',
                    type: 'cash',
                    balance: 0,
                    currency: 'TRY',
                    isActive: true,
                    color: '#10B981'
                }
            ],
            budgets: [], // Initialize budgets as an empty array
            tags: [],
            settings: {
                currency: 'TRY',
                language: 'tr',
                theme: 'light'
            }
        };
    }

    /**
     * Veritabanının hazır olmasını bekle
     */
    async ensureDataReady() {
        if (this.dataReady) return true;
        return this.initPromise;
    }

    /**
     * Veri yükleme işlemi
     */
    async getData() {
        try {
            await this.ensureDataReady();
            
            let data;
            
            if (this.useLocalStorage) {
                // localStorage'dan veri yükle
                console.log('Veri localStorage\'dan yükleniyor...');
                const storageData = localStorage.getItem(this.storageKey);
                data = storageData ? JSON.parse(storageData) : null;
            } else {
                // IndexedDB'den veri yükle
                console.log('Veri IndexedDB\'den yükleniyor...');
                data = await new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['budgetData'], 'readonly');
                    const store = transaction.objectStore('budgetData');
                    const request = store.get('mainData');
                    
                    request.onerror = (event) => {
                        console.error('Veri yükleme hatası:', event.target.error);
                        reject(event.target.error);
                    };
                    
                    request.onsuccess = (event) => {
                        if (request.result) {
                            resolve(request.result);
                        } else {
                            // Veri yoksa varsayılan veriyi oluştur ve kaydet
                            const defaultData = this.getDefaultData();
                            this.saveData(defaultData);
                            resolve(defaultData);
                        }
                    };
                });
            }
            
            // Veri null ise varsayılan veriyi döndür
            if (!data) {
                console.warn('Veri yüklenemedi, varsayılan veri oluşturuluyor');
                data = this.getDefaultData();
            }
            
            // Veri yapısını kontrol et ve eksik alanları tamamla
            if (!data.budgets) {
                console.warn('Veri yapısında budgets alanı eksik, ekleniyor');
                data.budgets = [];
                
                // Güncellenen veriyi kaydet
                this.saveData(data).catch(err => {
                    console.error('Veri yapısı güncellenirken hata:', err);
                });
            }
            
            return data;
        } catch (error) {
            console.error('Veri okuma hatası:', error);
            showToast('Veri yüklenirken hata oluştu!', 'error');
            
            // Hata durumunda varsayılan veriyi döndür
            const defaultData = this.getDefaultData();
            return defaultData;
        }
    }

    /**
     * Veri kaydetme işlemi
     */
    async saveData(data) {
        try {
            await this.ensureDataReady();
            console.log('saveData çağrıldı, veri kaydetme başlıyor...');
            console.log('İşlem sayısı:', data.transactions ? data.transactions.length : 0);
            
            // Veri yapısında ID olduğundan emin ol
            if (!data.id) {
                data.id = 'mainData';
            }
            
            // Eski veri yapısından yeni veri yapısına geçiş kontrolü
            if (data.plannedTransactions && Array.isArray(data.plannedTransactions) && data.plannedTransactions.length > 0) {
                console.log('Eski veri yapısı tespit edildi, planlanan işlemler ana listeye taşınıyor...');
                
                // Planlanan işlemleri dönüştür
                data.plannedTransactions.forEach(plannedTransaction => {
                    // Yeni yapıya uygun olarak güncelle
                    const newTransaction = {
                        ...plannedTransaction,
                        status: 'planned',
                        plannedAmount: plannedTransaction.amount,
                        amount: null,
                    };
                    
                    // Ana işlem listesine ekle
                    data.transactions.push(newTransaction);
                });
                
                // Eski plannedTransactions dizisini kaldır
                delete data.plannedTransactions;
                
                console.log('Veri yapısı dönüşümü tamamlandı.');
            }
            
            if (this.useLocalStorage) {
                // localStorage'a kaydet
                console.log('Veri localStorage\'a kaydediliyor...');
                // Verileri JSON'a dönüştür
                const jsonData = JSON.stringify(data);
                console.log('JSON veri boyutu:', jsonData.length, 'karakter');
                
                // localStorage'a kaydet
                localStorage.setItem(this.storageKey, jsonData);
                
                // Kaydedildiğini doğrula
                const savedData = localStorage.getItem(this.storageKey);
                if (savedData) {
                    console.log('Veri başarıyla localStorage\'a kaydedildi, boyut:', savedData.length, 'karakter');
                    return true;
                } else {
                    console.error('Veri localStorage\'a kaydedildi ancak doğrulama başarısız');
                    return false;
                }
            } else {
                // IndexedDB'ye kaydet
                console.log('Veri IndexedDB\'ye kaydediliyor...');
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['budgetData'], 'readwrite');
                    const store = transaction.objectStore('budgetData');
                    const request = store.put(data);
                    
                    request.onerror = (event) => {
                        console.error('Veri kaydetme hatası:', event.target.error);
                        showToast('Veri kaydedilemedi!', 'error');
                        reject(false);
                    };
                    
                    request.onsuccess = (event) => {
                        console.log('Veri başarıyla IndexedDB\'ye kaydedildi');
                        showToast('Veriler kaydedildi', 'success', 500);
                        resolve(true);
                    };
                });
            }
        } catch (error) {
            console.error('Veri kaydetme hatası:', error);
            showToast('Veri kaydedilemedi!', 'error');
            return false;
        }
    }

    // ======================
    // BÜTÇE YÖNETİMİ
    // ======================

    /**
     * Bütçe planlarını getir
     */
    async getBudgets(filters = {}) {
        try {
            const data = await this.getData();
            
            // Veri null ise boş dizi döndür
            if (!data) {
                console.error('getBudgets: data is null');
                return [];
            }
            
            // budgets null veya tanımlı değilse boş dizi döndür
            if (!data.budgets) {
                console.warn('getBudgets: data.budgets is undefined or null');
                return [];
            }
            
            // budgets bir dizi değilse boş dizi döndür
            if (!Array.isArray(data.budgets)) {
                console.error('getBudgets: data.budgets is not an array, type:', typeof data.budgets);
                return [];
            }
            
            let budgets = data.budgets;

            // Filtreleme - null kontrolleri ile
            if (filters.categoryId) {
                budgets = budgets.filter(b => b && b.categoryId === filters.categoryId);
            }

            if (filters.period) {
                budgets = budgets.filter(b => b && b.period === filters.period);
            }

            if (filters.year) {
                budgets = budgets.filter(b => b && b.year === filters.year);
            }

            if (filters.month && filters.period === 'monthly') {
                budgets = budgets.filter(b => b && b.month === filters.month);
            }

            return budgets;
        } catch (error) {
            console.error('Error in getBudgets:', error);
            return []; // Hata durumunda boş dizi döndür
        }
    }

    /**
     * Bütçe planı ekle/güncelle
     */
    async setBudget(budget) {
        const data = await this.getData();
        
        // Budgets dizisi yoksa oluştur
        if (!data.budgets) {
            data.budgets = [];
        }
        
        // Bütçenin benzersiz olduğundan emin ol - ID'yi her zaman yeni oluştur
        const budgetData = {
            id: budget.id || generateUUID(),
            categoryId: budget.categoryId,
            subcategoryId: budget.subcategoryId || null,
            period: budget.period, // 'monthly' | 'yearly'
            year: budget.year,
            month: budget.period === 'monthly' ? budget.month : null,
            plannedAmount: parseFloat(budget.plannedAmount),
            description: budget.description || '',
            createdAt: budget.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Mevcut bir bütçe güncelleniyorsa
        if (budget.id) {
            const budgetIndex = data.budgets.findIndex(b => b.id === budget.id);
            if (budgetIndex !== -1) {
                // Mevcut bütçeyi güncelle
                data.budgets[budgetIndex] = budgetData;
                showToast('Bütçe planı güncellendi!', 'success');
            } else {
                // ID belirtilmiş ama bulunamadı, yeni olarak ekle
                data.budgets.push(budgetData);
                showToast('Bütçe planı eklendi!', 'success');
            }
        } else {
            // Yeni bir bütçe oluştur
            data.budgets.push(budgetData);
            showToast('Bütçe planı eklendi!', 'success');
        }

        if (await this.saveData(data)) {
            return budgetData;
        }
        return null;
    }

    /**
     * Bütçe planı sil
     */
    async deleteBudget(budgetId) {
        const data = await this.getData();
        
        // Budgets dizisi yoksa işlem yapma
        if (!data.budgets) {
            return false;
        }
        
        const budgetIndex = data.budgets.findIndex(b => b.id === budgetId);
        
        if (budgetIndex !== -1) {
            data.budgets.splice(budgetIndex, 1);
            if (await this.saveData(data)) {
                showToast('Bütçe planı silindi!', 'success');
                return true;
            }
        }
        return false;
    }

    /**
     * Bütçe vs gerçekleşme analizi
     */
    async getBudgetAnalysis(year = new Date().getFullYear(), month = null) {
        // getBudgets içinde kontrol var, boş dizi de döndürebilir
        const budgets = await this.getBudgets({ year, month: month, period: month ? 'monthly' : 'yearly' });
        
        // Eğer bütçe yoksa boş analiz döndür
        if (!budgets || budgets.length === 0) {
            return [];
        }
        
        const categories = await this.getCategories();
        const analysis = [];

        for (const budget of budgets) {
            // İlgili kategorinin gerçekleşen harcamalarını hesapla
            let startDate, endDate;
            
            if (budget.period === 'monthly') {
                startDate = new Date(year, budget.month - 1, 1).toISOString().split('T')[0];
                endDate = new Date(year, budget.month, 0).toISOString().split('T')[0];
            } else {
                startDate = new Date(year, 0, 1).toISOString().split('T')[0];
                endDate = new Date(year, 11, 31).toISOString().split('T')[0];
            }

            // İşlem filtresini oluştur
            const transactionFilter = {
                categoryId: budget.categoryId,
                startDate,
                endDate
            };
            
            // Alt kategori bilgisi varsa filtreye ekle
            if (budget.subcategoryId) {
                transactionFilter.subcategoryId = budget.subcategoryId;
            }

            const transactions = await this.getTransactions(transactionFilter);
            const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const category = this.getCategoryById(categories, budget.categoryId);
            
            // Kategori bulunamadıysa bu bütçeyi atla
            if (!category) {
                console.warn(`getBudgetAnalysis: Category with ID ${budget.categoryId} not found, skipping budget`);
                continue;
            }
                
            // Alt kategori bilgisi varsa al
            let subcategory = null;
            if (budget.subcategoryId && category.subcategories) {
                subcategory = category.subcategories.find(s => s.id === budget.subcategoryId);
            }
                
            const variance = actualAmount - budget.plannedAmount;
            const variancePercent = budget.plannedAmount > 0 ? 
                (variance / budget.plannedAmount) * 100 : 0;

            analysis.push({
                budgetId: budget.id,
                categoryId: budget.categoryId,
                categoryName: category.name,
                categoryColor: category.color,
                categoryType: category.type,
                subcategoryId: budget.subcategoryId,
                subcategoryName: subcategory ? subcategory.name : null,
                subcategoryColor: subcategory ? subcategory.color : null,
                period: budget.period,
                year: budget.year,
                month: budget.month,
                plannedAmount: budget.plannedAmount,
                actualAmount,
                variance,
                variancePercent,
                status: this.getBudgetStatus(variance, budget.plannedAmount),
                progress: budget.plannedAmount > 0 ? 
                    Math.min((actualAmount / budget.plannedAmount) * 100, 100) : 0,
                transactionCount: transactions.length
            });
        }

        return analysis.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    }

    /**
     * Bütçe durumu belirle
     */
    getBudgetStatus(variance, planned) {
        if (planned === 0) return 'no-budget';
        
        const percentVariance = (variance / planned) * 100;
        
        if (percentVariance > 10) return 'over-budget';      // %10 üzeri aşım
        if (percentVariance > 0) return 'near-budget';       // 0-10% aşım
        if (percentVariance > -20) return 'on-budget';       // %20 altına kadar OK
        return 'under-budget';                               // %20+ altında
    }

    /**
     * Kategori ID'sine göre kategori bul
     * @param {Object|string} categoriesOrId - Kategoriler nesnesi veya kategori ID'si
     * @param {string} [categoryId] - Kategori ID'si (ilk parametre kategoriler nesnesi ise)
     * @returns {Object|null} - Bulunan kategori veya null
     */
    async getCategoryById(categoriesOrId, categoryId) {
        try {
            console.log('getCategoryById called with:', { categoriesOrId, categoryId });
            
            // Tek parametre ile çağrıldığında (sadece ID)
            if (!categoryId && (typeof categoriesOrId === 'string' || typeof categoriesOrId === 'undefined')) {
                const targetId = categoriesOrId;
                console.log('Single param mode, fetching all categories to search for ID:', targetId);
                
                // Tüm kategorileri getir
                const categories = await this.getCategories();
                console.log('Got categories:', categories);
                
                if (!categories) {
                    console.log('Categories is null, returning null');
                    return null;
                }
                
                // income ve expense kategorilerini kontrol et
                const categoryTypes = ['income', 'expense'];
                for (const type of categoryTypes) {
                    if (!categories[type] || !Array.isArray(categories[type])) {
                        console.log(`Categories[${type}] is not an array, skipping`);
                        continue;
                    }
                    
                    const category = categories[type].find(c => c && c.id === targetId);
                    if (category) {
                        console.log('Found category:', category);
                        return category;
                    }
                }
                
                console.log('Category not found with ID:', targetId);
                return null;
            }
            
            // İki parametre ile çağrıldığında (kategoriler ve ID)
            console.log('Two param mode, searching in provided categories');
            const categories = categoriesOrId;
            
            if (!categories || typeof categories !== 'object') {
                console.log('Invalid categories object:', categories);
                return null;
            }
            
            const categoryTypes = ['income', 'expense'];
            for (const type of categoryTypes) {
                if (!categories[type] || !Array.isArray(categories[type])) {
                    console.log(`Categories[${type}] is not an array, skipping`);
                    continue;
                }
                
                const category = categories[type].find(c => c && c.id === categoryId);
                if (category) {
                    console.log('Found category:', category);
                    return category;
                }
            }
            
            console.log('Category not found with ID:', categoryId);
            return null;
        } catch (error) {
            console.error('Kategori bulma hatası:', error);
            return null;
        }
    }

    // ======================
    // İŞLEM YÖNETİMİ
    // ======================

    /**
     * Tüm işlemleri getir
     */
    async getTransactions(filters = {}) {
        try {
            const data = await this.getData();
            
            // Veri null ise boş dizi döndür
            if (!data) {
                console.error('getTransactions: data is null');
                return [];
            }
            
            // transactions null veya tanımlı değilse boş dizi döndür
            if (!data.transactions) {
                console.warn('getTransactions: data.transactions is undefined or null');
                return [];
            }
            
            // transactions bir dizi değilse boş dizi döndür
            if (!Array.isArray(data.transactions)) {
                console.error('getTransactions: data.transactions is not an array, type:', typeof data.transactions);
                return [];
            }
            
            let transactions = data.transactions;

            // İşlem durumu filtresi uygula
            if (filters.status && filters.status !== 'all') {
                transactions = transactions.filter(t => t.status === filters.status);
            }

            // Diğer filtreler
            if (filters.type && filters.type !== 'all') {
                transactions = transactions.filter(t => t.type === filters.type);
            }

            if (filters.categoryId && filters.categoryId !== 'all') {
                transactions = transactions.filter(t => t.categoryId === filters.categoryId);
            }

            if (filters.subcategoryId && filters.subcategoryId !== 'all') {
                transactions = transactions.filter(t => t.subcategoryId === filters.subcategoryId);
            }

            if (filters.accountId && filters.accountId !== 'all') {
                transactions = transactions.filter(t => t.accountId === filters.accountId);
            }

            if (filters.startDate && filters.endDate) {
                console.log(`Filtering transactions by date range: ${filters.startDate} to ${filters.endDate}`);
                console.log(`Total transactions before date filtering: ${transactions.length}`);
                
                // Tarih aralığına göre işlemleri filtrele
                transactions = transactions.filter(t => {
                    const inRange = isDateInRange(t.date, filters.startDate, filters.endDate);
                    if (!inRange) {
                        console.log(`Transaction outside date range: ${t.id}, date: ${t.date}`);
                    }
                    return inRange;
                });
                
                console.log(`Total transactions after date filtering: ${transactions.length}`);
            }

            if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
                transactions = transactions.filter(t => 
                    t.tags && Array.isArray(t.tags) && t.tags.some(tag => filters.tags.includes(tag))
                );
            }

            // Tarihe göre sırala (en yeni önce)
            return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error in getTransactions:', error);
            return []; // Hata durumunda boş dizi döndür
        }
    }
    
    /**
     * Planlanan işlemleri getir
     */
    async getPlannedTransactions(filters = {}) {
        return this.getTransactions({...filters, status: 'planned'});
    }

    /**
     * İşlem ekle
     */
    async addTransaction(transaction) {
        const data = await this.getData();
        
        // Log transaction data for debugging
        console.log('Adding transaction:', transaction);
        
        // Prepare amount and plannedAmount fields
        let amount = null;
        let plannedAmount = null;
        
        if (transaction.status === 'actual') {
            amount = transaction.amount ? parseFloat(transaction.amount) : 0;
            plannedAmount = transaction.plannedAmount ? parseFloat(transaction.plannedAmount) : null;
        } else if (transaction.status === 'planned') {
            amount = null;
            // Use plannedAmount directly if provided, otherwise fallback to amount field
            plannedAmount = transaction.plannedAmount !== undefined && transaction.plannedAmount !== null 
                ? parseFloat(transaction.plannedAmount) 
                : (transaction.amount ? parseFloat(transaction.amount) : 0);
        }
        
        console.log('Parsed amounts:', { amount, plannedAmount });
        
        // Ensure the date is in standard format (YYYY-MM-DD)
        let dateStr = transaction.date;
        if (dateStr) {
            // If it's a Date object, convert to ISO string and take only the date part
            if (dateStr instanceof Date) {
                dateStr = dateStr.toISOString().split('T')[0];
            } 
            // If it's a string, make sure it's in YYYY-MM-DD format
            else if (typeof dateStr === 'string') {
                // Remove any time component
                dateStr = dateStr.split('T')[0];
                
                // Log the normalized date
                console.log(`Normalized transaction date: ${dateStr}`);
            }
        }
        
        const newTransaction = {
            id: generateUUID(),
            amount: amount,
            plannedAmount: plannedAmount,
            type: transaction.type,
            categoryId: transaction.categoryId,
            subcategoryId: transaction.subcategoryId || null,
            accountId: transaction.accountId,
            tags: transaction.tags || [],
            description: transaction.description || '',
            date: dateStr, // Use the standardized date
            status: transaction.status || 'actual', // 'planned' veya 'actual'
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // İşlemi transactions array'ine ekle
        data.transactions.push(newTransaction);
        
        // Hesap bakiyesini güncelle (sadece gerçekleşen işlemlerde)
        if (transaction.status === 'actual' && newTransaction.amount) {
            await this.updateAccountBalance(transaction.accountId, newTransaction.amount, transaction.type);
        }
        
        // Durum mesajı göster
        if (transaction.status === 'planned') {
            showToast('Planlanan işlem başarıyla eklendi!', 'success');
        } else {
            showToast('İşlem başarıyla eklendi!', 'success');
        }
        
        // Etiketleri güncelle
        if (transaction.tags) {
            await this.updateTags(transaction.tags);
        }

        if (await this.saveData(data)) {
            return newTransaction;
        }
        return null;
    }
    
    /**
     * Planlanan işlemi gerçekleştir
     */
    async realizePlannedTransaction(plannedId, actualAmount = null) {
        const data = await this.getData();
        const plannedTransactionIndex = data.transactions.findIndex(t => t.id === plannedId && t.status === 'planned');
        
        if (plannedTransactionIndex === -1) {
            showToast('Planlanan işlem bulunamadı!', 'error');
            return false;
        }
        
        const plannedTransaction = data.transactions[plannedTransactionIndex];
        
        // Planlanan tutar
        const plannedAmount = plannedTransaction.plannedAmount || 0;
        
        // Gerçekleşen tutarı belirle
        let amount = plannedAmount; // Varsayılan olarak planlanan tutarı kullan
        
        console.log('Planlanan işlem gerçekleştiriliyor:', { 
            plannedId, 
            plannedAmount, 
            providedActualAmount: actualAmount 
        });
        
        // Eğer özel bir tutar belirtilmişse onu kullan
        if (actualAmount !== null) {
            // String ise sayıya çevir, sayı ise olduğu gibi kullan
            amount = typeof actualAmount === 'string' ? parseFloat(actualAmount) : actualAmount;
            console.log('Özel tutar kullanılıyor:', amount);
        } else {
            console.log('Planlanan tutar kullanılıyor:', plannedAmount);
        }
        
        // İşlemi güncelle
        data.transactions[plannedTransactionIndex] = {
            ...plannedTransaction,
            status: 'actual',
            amount: amount,
            plannedAmount: plannedAmount,
            updatedAt: new Date().toISOString()
        };
        
        // Hesap bakiyesini güncelle
        await this.updateAccountBalance(plannedTransaction.accountId, amount, plannedTransaction.type);
        
        if (await this.saveData(data)) {
            showToast('Planlanan işlem gerçekleştirildi!', 'success');
            return data.transactions[plannedTransactionIndex];
        }
        
        return null;
    }

    /**
     * İşlem güncelle
     */
    async updateTransaction(id, updates) {
        console.log('updateTransaction çağrıldı:', { id, updates });
        
        const data = await this.getData();
        if (!data) {
            console.error('updateTransaction: veri yüklenemedi');
            showToast('İşlem güncellenemedi: veri yüklenemedi!', 'error');
            return false;
        }
        
        if (!data.transactions || !Array.isArray(data.transactions)) {
            console.error('updateTransaction: işlemler dizisi bulunamadı veya geçersiz');
            showToast('İşlem güncellenemedi: veri yapısı geçersiz!', 'error');
            return false;
        }
        
        const transactionIndex = data.transactions.findIndex(t => t.id === id);
        
        if (transactionIndex === -1) {
            console.error('updateTransaction: işlem bulunamadı, ID:', id);
            showToast('İşlem bulunamadı!', 'error');
            return false;
        }

        console.log('updateTransaction: işlem bulundu, indeks:', transactionIndex);
        const oldTransaction = data.transactions[transactionIndex];
        console.log('updateTransaction: eski işlem:', oldTransaction);
        
        // Eğer işlem gerçekleşmiş ise ve amount değişmiş ise hesap bakiyesini güncelle
        if (oldTransaction.status === 'actual' && oldTransaction.amount) {
            console.log('updateTransaction: hesap bakiyesi güncelleniyor (eski değer geri alınıyor)');
            // Eski hesap bakiyesini geri al
            await this.updateAccountBalance(
                oldTransaction.accountId, 
                -oldTransaction.amount, 
                oldTransaction.type
            );
        }

        // Durumun değişip değişmediğini kontrol et
        const statusChangedToActual = oldTransaction.status === 'planned' && updates.status === 'actual';
        const statusChangedToPlanned = oldTransaction.status === 'actual' && updates.status === 'planned';
        
        console.log('updateTransaction: DETAILED status change analysis:', { 
            transactionId: id,
            oldStatus: oldTransaction.status, 
            newStatus: updates.status,
            newStatusType: typeof updates.status,
            statusIsValid: updates.status === 'actual' || updates.status === 'planned',
            oldAmount: oldTransaction.amount,
            newAmount: updates.amount,
            oldPlannedAmount: oldTransaction.plannedAmount,
            newPlannedAmount: updates.plannedAmount,
            statusChangedToActual: statusChangedToActual,
            statusChangedToPlanned: statusChangedToPlanned
        });
        
        // Ensure the date is in standard format (YYYY-MM-DD) if it's being updated
        if (updates.date) {
            let dateStr = updates.date;
            // If it's a Date object, convert to ISO string and take only the date part
            if (dateStr instanceof Date) {
                updates.date = dateStr.toISOString().split('T')[0];
            } 
            // If it's a string, make sure it's in YYYY-MM-DD format
            else if (typeof dateStr === 'string') {
                // Remove any time component
                updates.date = dateStr.split('T')[0];
                
                // Log the normalized date
                console.log(`Normalized updated transaction date: ${updates.date}`);
            }
        }
        
        // İşlemi güncelle
        const updatedTransaction = {
            ...oldTransaction,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        // Durum değişimlerine göre özel işlemler
        if (statusChangedToActual) {
            // Planlanan işlem gerçekleşen olarak güncelleniyorsa
            updatedTransaction.amount = updates.amount || oldTransaction.plannedAmount || 0;
            
            // Eğer planlanan tutar yoksa, gerçekleşen tutarı kopyala
            if (!oldTransaction.plannedAmount) {
                updatedTransaction.plannedAmount = oldTransaction.amount;
            }
        } else if (statusChangedToPlanned) {
            // Gerçekleşen işlem planlanan olarak güncelleniyorsa
            updatedTransaction.plannedAmount = updates.plannedAmount !== undefined ? updates.plannedAmount : oldTransaction.amount || 0;
            updatedTransaction.amount = null; // Planlanan işlemlerde amount null olmalı
            
            console.log('STATUS CHANGE TO PLANNED - Updated values:', {
                newAmount: updatedTransaction.amount,
                newPlannedAmount: updatedTransaction.plannedAmount
            });
        } else {
            // Normal durum güncellemesi (durum değişimi yoksa)
            if (updates.amount !== undefined) {
                updatedTransaction.amount = updates.amount;
            }
            
            if (updates.plannedAmount !== undefined) {
                updatedTransaction.plannedAmount = updates.plannedAmount;
            }
        }
        
        // Güncellenen işlemi data'ya kaydet
        data.transactions[transactionIndex] = updatedTransaction;
        
        console.log('updateTransaction: işlem güncellendi:', updatedTransaction);
        
        // Yeni hesap bakiyesini uygula
        if (statusChangedToPlanned) {
            // Gerçekleşen işlem planlanan yapıldığında bakiyeyi geri alma işlemi yapmamız gerekiyor
            // Çünkü artık gerçekleşen bir işlem değil, planlanan bir işlem
            console.log('updateTransaction: Planlanan statüsüne geçildiği için hesap bakiyesi güncellenmeyecek');
            // Hesabın bakiyesini geri almak için, eski işlem tutarını (-) ile çarp
            if (oldTransaction.amount) {
                console.log('updateTransaction: Eski gerçekleşen işlem tutarı bakiyeden çıkarılıyor');
                await this.updateAccountBalance(
                    updatedTransaction.accountId,
                    -oldTransaction.amount, // Eski tutarın tersi ile güncelle
                    updatedTransaction.type
                );
            }
        } else if (updatedTransaction.status === 'actual' && updatedTransaction.amount) {
            console.log('updateTransaction: hesap bakiyesi güncelleniyor (yeni değer uygulanıyor)');
            await this.updateAccountBalance(
                updatedTransaction.accountId,
                updatedTransaction.amount,
                updatedTransaction.type
            );
        }

        // Değişiklikleri kaydet
        console.log('updateTransaction: değişiklikler kaydediliyor...');
        
        // Veriyi kaydet
        if (await this.saveData(data)) {
            console.log('updateTransaction: veri başarıyla kaydedildi');
            showToast('İşlem başarıyla güncellendi!', 'success');
            return true;
        }
        
        console.error('updateTransaction: veri kaydedilemedi');
        showToast('İşlem güncellenemedi: veri kaydedilemedi!', 'error');
        return false;
    }

    /**
     * İşlem sil
     */
    async deleteTransaction(id) {
        const data = await this.getData();
        const transactionIndex = data.transactions.findIndex(t => t.id === id);
        
        if (transactionIndex === -1) {
            showToast('İşlem bulunamadı!', 'error');
            return false;
        }

        const transaction = data.transactions[transactionIndex];
        
        // Sadece gerçekleşen işlemlerde bakiyeyi güncelle
        if (transaction.status === 'actual' && transaction.amount) {
            // Hesap bakiyesini geri al
            await this.updateAccountBalance(
                transaction.accountId, 
                -transaction.amount, 
                transaction.type
            );
        }

        // İşlemi sil
        data.transactions.splice(transactionIndex, 1);

        if (await this.saveData(data)) {
            showToast('İşlem başarıyla silindi!', 'success');
            return true;
        }
        return false;
    }

    // ======================
    // KATEGORİ YÖNETİMİ
    // ======================

    /**
     * Kategorileri getir
     */
    async getCategories(type = null) {
        try {
            const data = await this.getData();
            
            // Veri null ise boş nesne veya dizi döndür
            if (!data) {
                console.error('getCategories: data is null');
                return type ? [] : { income: [], expense: [] };
            }
            
            // categories null veya tanımlı değilse varsayılan döndür
            if (!data.categories) {
                console.warn('getCategories: data.categories is undefined or null');
                return type ? [] : { income: [], expense: [] };
            }
            
            // Belirli bir kategori tipi istenmişse
            if (type) {
                // İstenen tip mevcut değilse boş dizi döndür
                if (!data.categories[type]) {
                    console.warn(`getCategories: category type "${type}" not found`);
                    return [];
                }
                
                // Kategori tipinin bir dizi olduğundan emin ol
                if (!Array.isArray(data.categories[type])) {
                    console.error(`getCategories: data.categories[${type}] is not an array, type:`, 
                        typeof data.categories[type]);
                    return [];
                }
                
                return data.categories[type];
            }
            
            // Tüm kategorileri döndür, ancak tiplerin dizi olduğundan emin ol
            const result = { income: [], expense: [] };
            
            if (data.categories.income) {
                result.income = Array.isArray(data.categories.income) ? 
                    data.categories.income : [];
            }
            
            if (data.categories.expense) {
                result.expense = Array.isArray(data.categories.expense) ? 
                    data.categories.expense : [];
            }
            
            return result;
        } catch (error) {
            console.error('Error in getCategories:', error);
            return type ? [] : { income: [], expense: [] }; // Hata durumunda varsayılan döndür
        }
    }

    /**
     * Kategori ekle
     */
    async addCategory(category) {
        const data = await this.getData();
        
        const newCategory = {
            id: generateUUID(),
            name: category.name,
            type: category.type,
            color: category.color || generateColor(),
            icon: category.icon || 'folder',
            subcategories: []
        };

        data.categories[category.type].push(newCategory);

        if (await this.saveData(data)) {
            showToast('Kategori başarıyla eklendi!', 'success');
            return newCategory;
        }
        return null;
    }

    /**
     * Kategori güncelle
     */
    async updateCategory(id, updates) {
        const data = await this.getData();
        let found = false;

        for (const type in data.categories) {
            const categoryIndex = data.categories[type].findIndex(c => c.id === id);
            if (categoryIndex !== -1) {
                data.categories[type][categoryIndex] = {
                    ...data.categories[type][categoryIndex],
                    ...updates
                };
                found = true;
                break;
            }
        }

        if (!found) {
            showToast('Kategori bulunamadı!', 'error');
            return false;
        }

        if (await this.saveData(data)) {
            showToast('Kategori başarıyla güncellendi!', 'success');
            return true;
        }
        return false;
    }

    /**
     * Kategori sil
     */
    async deleteCategory(id) {
        const data = await this.getData();
        let found = false;

        // Kategorinin kullanılıp kullanılmadığını kontrol et
        const hasTransactions = data.transactions.some(t => t.categoryId === id);
        if (hasTransactions) {
            showToast('Bu kategori işlemlerde kullanılıyor, silinemez!', 'error');
            return false;
        }

        for (const type in data.categories) {
            const categoryIndex = data.categories[type].findIndex(c => c.id === id);
            if (categoryIndex !== -1) {
                data.categories[type].splice(categoryIndex, 1);
                found = true;
                break;
            }
        }

        if (!found) {
            showToast('Kategori bulunamadı!', 'error');
            return false;
        }

        if (await this.saveData(data)) {
            showToast('Kategori başarıyla silindi!', 'success');
            return true;
        }
        return false;
    }

    /**
     * Alt kategori ekle
     */
    async addSubcategory(categoryId, subcategory) {
        const data = await this.getData();
        let found = false;

        console.log('Alt kategori ekleme işlemi başladı:', { categoryId, subcategory });

        for (const type in data.categories) {
            const category = data.categories[type].find(c => c.id === categoryId);
            if (category) {
                console.log('Kategori bulundu:', category.name);
                
                // Alt kategori zaten var mı kontrol et
                const existingSubcategory = category.subcategories.find(s => s.name === subcategory.name);
                if (existingSubcategory) {
                    showToast('Bu isimde alt kategori zaten mevcut!', 'error');
                    return false;
                }

                const newSubcategory = {
                    id: generateUUID(),
                    name: subcategory.name,
                    color: subcategory.color || generateColor()
                };
                
                category.subcategories.push(newSubcategory);
                found = true;
                console.log('Alt kategori eklendi:', newSubcategory);
                break;
            }
        }

        if (!found) {
            console.error('Kategori bulunamadı:', categoryId);
            showToast('Kategori bulunamadı!', 'error');
            return false;
        }

        if (await this.saveData(data)) {
            console.log('Veri başarıyla kaydedildi');
            showToast('Alt kategori başarıyla eklendi!', 'success');
            return true;
        } else {
            console.error('Veri kaydetme hatası');
            showToast('Alt kategori eklenirken hata oluştu!', 'error');
            return false;
        }
    }

    // ======================
    // HESAP YÖNETİMİ
    // ======================

    /**
     * Hesapları getir
     */
    async getAccounts(activeOnly = false) {
        try {
            const data = await this.getData();
            
            // Veri null ise boş dizi döndür
            if (!data) {
                console.error('getAccounts: data is null');
                return [];
            }
            
            // accounts null veya tanımlı değilse boş dizi döndür
            if (!data.accounts) {
                console.warn('getAccounts: data.accounts is undefined or null');
                return [];
            }
            
            // accounts bir dizi değilse boş dizi döndür
            if (!Array.isArray(data.accounts)) {
                console.error('getAccounts: data.accounts is not an array, type:', typeof data.accounts);
                return [];
            }
            
            let accounts = data.accounts;
            
            if (activeOnly) {
                accounts = accounts.filter(a => a.isActive);
            }
            
            return accounts;
        } catch (error) {
            console.error('Error in getAccounts:', error);
            return []; // Hata durumunda boş dizi döndür
        }
    }

    /**
     * Hesap ekle
     */
    async addAccount(account) {
        const data = await this.getData();
        
        const newAccount = {
            id: generateUUID(),
            name: account.name,
            type: account.type || 'cash',
            balance: parseFloat(account.balance || 0),
            currency: account.currency || 'TRY',
            isActive: true,
            color: account.color || generateColor()
        };

        data.accounts.push(newAccount);

        if (await this.saveData(data)) {
            showToast('Hesap başarıyla eklendi!', 'success');
            return newAccount;
        }
        return null;
    }

    /**
     * Hesap bakiyesini güncelle
     */
    async updateAccountBalance(accountId, amount, type) {
        const data = await this.getData();
        const account = data.accounts.find(a => a.id === accountId);
        
        if (!account) return false;

        if (type === 'income') {
            account.balance += amount;
        } else if (type === 'expense') {
            account.balance -= amount;
        }

        return this.saveData(data);
    }

    // ======================
    // ETİKET YÖNETİMİ
    // ======================

    /**
     * Etiketleri getir
     * @param {Object} options - Filtreleme seçenekleri
     * @param {string} options.sortBy - Sıralama seçeneği: 'name', 'usageCount', 'color'
     * @param {string} options.sortOrder - Sıralama yönü: 'asc', 'desc'
     * @param {string} options.searchText - Arama metni
     * @param {number} options.minUsageCount - Minimum kullanım sayısı
     */
    async getTags(options = {}) {
        try {
            const data = await this.getData();
            
            // Veri null ise boş dizi döndür
            if (!data) {
                console.error('getTags: data is null');
                return [];
            }
            
            // tags null veya tanımlı değilse boş dizi döndür
            if (!data.tags) {
                console.warn('getTags: data.tags is undefined or null');
                return [];
            }
            
            // tags bir dizi değilse boş dizi döndür
            if (!Array.isArray(data.tags)) {
                console.error('getTags: data.tags is not an array, type:', typeof data.tags);
                return [];
            }
            
            let tags = data.tags;
            
            // Arama metni ile filtreleme
            if (options.searchText) {
                const searchText = options.searchText.toLowerCase();
                tags = tags.filter(tag => 
                    tag && tag.name && typeof tag.name === 'string' && 
                    tag.name.toLowerCase().includes(searchText)
                );
            }
            
            // Minimum kullanım sayısı ile filtreleme
            if (options.minUsageCount !== undefined) {
                tags = tags.filter(tag => 
                    tag && tag.usageCount !== undefined && 
                    tag.usageCount >= options.minUsageCount
                );
            }
            
            // Sıralama
            if (options.sortBy) {
                tags = [...tags].sort((a, b) => {
                    let result;
                    switch (options.sortBy) {
                        case 'name':
                            if (!a.name || !b.name) return 0;
                            result = a.name.localeCompare(b.name);
                            break;
                        case 'usageCount':
                            if (a.usageCount === undefined || b.usageCount === undefined) return 0;
                            result = a.usageCount - b.usageCount;
                            break;
                        case 'color':
                            if (!a.color || !b.color) return 0;
                            result = a.color.localeCompare(b.color);
                            break;
                        default:
                            result = 0;
                    }
                    
                    return options.sortOrder === 'desc' ? -result : result;
                });
            }
            
            return tags;
        } catch (error) {
            console.error('Error in getTags:', error);
            return []; // Hata durumunda boş dizi döndür
        }
    }

    /**
     * Etiketleri güncelle (işlem eklendiğinde)
     */
    async updateTags(newTags) {
        const data = await this.getData();
        const existingTags = data.tags || [];

        newTags.forEach(tagName => {
            // Boş etiketleri atla
            if (!tagName.trim()) return;
            
            const existingTag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
            if (existingTag) {
                existingTag.usageCount++;
            } else {
                existingTags.push({
                    id: generateUUID(),
                    name: tagName,
                    color: generateColor(),
                    usageCount: 1,
                    createdAt: new Date().toISOString()
                });
            }
        });

        data.tags = existingTags;
        return this.saveData(data);
    }
    
    /**
     * Yeni etiket ekle
     */
    async addTag(tagName, color = null) {
        const data = await this.getData();
        const existingTags = data.tags || [];
        
        // Boş etiket kontrolü
        if (!tagName || !tagName.trim()) {
            showToast('Etiket adı boş olamaz!', 'error');
            return false;
        }
        
        // Mevcut etiket kontrolü
        const normalizedName = tagName.trim();
        const existingTag = existingTags.find(t => t.name.toLowerCase() === normalizedName.toLowerCase());
        
        if (existingTag) {
            showToast('Bu isimde bir etiket zaten mevcut!', 'error');
            return false;
        }
        
        // Yeni etiket oluştur
        const newTag = {
            id: generateUUID(),
            name: normalizedName,
            color: color || generateColor(),
            usageCount: 0,
            createdAt: new Date().toISOString()
        };
        
        existingTags.push(newTag);
        data.tags = existingTags;
        
        if (await this.saveData(data)) {
            showToast('Etiket başarıyla eklendi!', 'success');
            return newTag;
        }
        
        return false;
    }
    
    /**
     * Etiket güncelle
     */
    async updateTag(tagId, updates) {
        const data = await this.getData();
        const existingTags = data.tags || [];
        
        const tagIndex = existingTags.findIndex(t => t.id === tagId);
        if (tagIndex === -1) {
            showToast('Etiket bulunamadı!', 'error');
            return false;
        }
        
        // İsim değişikliği varsa ve bu isimde başka bir etiket varsa hata ver
        if (updates.name && updates.name !== existingTags[tagIndex].name) {
            const normalizedName = updates.name.trim();
            const duplicateTag = existingTags.find(t => 
                t.id !== tagId && t.name.toLowerCase() === normalizedName.toLowerCase()
            );
            
            if (duplicateTag) {
                showToast('Bu isimde bir etiket zaten mevcut!', 'error');
                return false;
            }
            
            if (!normalizedName) {
                showToast('Etiket adı boş olamaz!', 'error');
                return false;
            }
        }
        
        // Etiketi güncelle
        existingTags[tagIndex] = {
            ...existingTags[tagIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        data.tags = existingTags;
        
        if (await this.saveData(data)) {
            showToast('Etiket başarıyla güncellendi!', 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Etiket sil
     */
    async deleteTag(tagId) {
        const data = await this.getData();
        const existingTags = data.tags || [];
        
        const tagIndex = existingTags.findIndex(t => t.id === tagId);
        if (tagIndex === -1) {
            showToast('Etiket bulunamadı!', 'error');
            return false;
        }
        
        const tag = existingTags[tagIndex];
        
        // Etiket kullanımda mı kontrol et
        if (tag.usageCount > 0) {
            const confirmDelete = confirm(`"${tag.name}" etiketi ${tag.usageCount} işlemde kullanılıyor. Silmek istediğinize emin misiniz?`);
            if (!confirmDelete) {
                return false;
            }
            
            // İşlemlerden etiketi kaldır
            const transactions = data.transactions || [];
            transactions.forEach(transaction => {
                if (transaction.tags && transaction.tags.includes(tag.name)) {
                    transaction.tags = transaction.tags.filter(t => t !== tag.name);
                }
            });
            
            data.transactions = transactions;
        }
        
        // Etiketi sil
        existingTags.splice(tagIndex, 1);
        data.tags = existingTags;
        
        if (await this.saveData(data)) {
            showToast('Etiket başarıyla silindi!', 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Etiket istatistiklerini getir
     */
    async getTagStats(filters = {}) {
        const transactions = await this.getTransactions(filters);
        const tags = await this.getTags();
        const stats = [];
        
        // Her bir etiket için kullanım istatistiklerini hesapla
        tags.forEach(tag => {
            const tagTransactions = transactions.filter(t => 
                t.tags && t.tags.includes(tag.name)
            );
            
            // Bu filtrelerdeki toplam işlem sayısı
            const transactionCount = tagTransactions.length;
            
            // Tüm etiketleri göster, sadece kullanılanları değil
            // if (transactionCount > 0) {
                // Bu etiketteki gelir ve gider miktarları
                const incomeAmount = tagTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                    
                const expenseAmount = tagTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                
                stats.push({
                    tagId: tag.id,
                    tagName: tag.name,
                    tagColor: tag.color,
                    transactionCount,
                    incomeAmount,
                    expenseAmount,
                    netAmount: incomeAmount - expenseAmount
                });
            // }
        });
        
        return stats.sort((a, b) => b.transactionCount - a.transactionCount);
    }

    // ======================
    // İSTATİSTİKLER
    // ======================

    /**
     * Özet istatistikler
     */
    async getSummaryStats(filters = {}) {
        // Gerçekleşen işlemler
        const actualTransactions = await this.getTransactions({...filters, status: 'actual'});
        
        const actualIncome = actualTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
            
        const actualExpense = actualTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
            
        // Planlanan işlemler
        const plannedTransactions = await this.getTransactions({...filters, status: 'planned'});
        
        const plannedIncome = plannedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
            
        const plannedExpense = plannedTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
            
        // Gerçekleşen işlemlerdeki planlanan tutarlar
        const actualPlannedIncome = actualTransactions
            .filter(t => t.type === 'income' && t.plannedAmount)
            .reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
            
        const actualPlannedExpense = actualTransactions
            .filter(t => t.type === 'expense' && t.plannedAmount)
            .reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
            
        // Toplam planlanan tutarlar
        const totalPlannedIncome = plannedIncome + actualPlannedIncome;
        const totalPlannedExpense = plannedExpense + actualPlannedExpense;

        return {
            // Gerçekleşen değerler
            totalIncome: actualIncome,
            totalExpense: actualExpense,
            netBalance: actualIncome - actualExpense,
            transactionCount: actualTransactions.length,
            
            // Planlanan değerler
            plannedIncome: totalPlannedIncome,
            plannedExpense: totalPlannedExpense,
            plannedNetBalance: totalPlannedIncome - totalPlannedExpense,
            plannedTransactionCount: plannedTransactions.length,
            
            // Sapmalar
            incomeVariance: actualIncome - totalPlannedIncome,
            expenseVariance: actualExpense - totalPlannedExpense,
            balanceVariance: (actualIncome - actualExpense) - (totalPlannedIncome - totalPlannedExpense)
        };
    }

    /**
     * Aylık istatistikler
     * @param {Object} filters - Optional date filters
     * @param {number} year - Optional year for which to get stats (defaults to current year)
     */
    async getMonthlyStats(filters = {}, year = new Date().getFullYear()) {
        // If filters object is passed but it's not the year parameter
        if (filters && typeof filters === 'object' && filters.startDate) {
            // Extract year from startDate if available
            const startDateObj = new Date(filters.startDate);
            if (!isNaN(startDateObj.getTime())) {
                year = startDateObj.getFullYear();
            }
        } else if (typeof filters === 'number') {
            // Handle case where first parameter is the year (for backward compatibility)
            year = filters;
            filters = {};
        }
        const monthlyData = [];
        
        for (let month = 0; month < 12; month++) {
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
            
            const filters = { startDate, endDate };
            const stats = await this.getSummaryStats(filters);
            
            monthlyData.push({
                month: month + 1,
                monthName: new Date(year, month).toLocaleDateString('tr-TR', { month: 'long' }),
                ...stats
            });
        }
        
        return monthlyData;
    }

    /**
     * Kategori istatistikleri
     */
    async getCategoryStats(type = null, filters = {}) {
        const transactions = await this.getTransactions(filters);
        const categories = await this.getCategories();
        const stats = [];

        const targetTypes = type ? [type] : ['income', 'expense'];

        targetTypes.forEach(categoryType => {
            categories[categoryType].forEach(category => {
                const categoryTransactions = transactions.filter(t => 
                    t.categoryId === category.id && t.type === categoryType
                );
                
                const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
                
                if (total > 0) {
                    stats.push({
                        categoryId: category.id,
                        categoryName: category.name,
                        categoryColor: category.color,
                        type: categoryType,
                        amount: total,
                        transactionCount: categoryTransactions.length
                    });
                }
            });
        });

        return stats.sort((a, b) => b.amount - a.amount);
    }

    // ======================
    // VERİ AKTARIMI
    // ======================

    /**
     * Veriyi dışa aktar
     */
    async exportData() {
        const data = await this.getData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Veriyi içe aktar
     */
    async importData(jsonData, options = { merge: false }) {
        try {
            const importedData = JSON.parse(jsonData);
            
            // Veri doğrulama - temel alanların varlığını kontrol et
            if (!importedData.transactions || !Array.isArray(importedData.transactions)) {
                console.error('İçe aktarma hatası: İşlemler dizisi bulunamadı veya geçersiz');
                throw new Error('Geçersiz veri formatı: İşlemler bulunamadı');
            }
            
            if (!importedData.categories) {
                console.error('İçe aktarma hatası: Kategoriler bulunamadı');
                throw new Error('Geçersiz veri formatı: Kategoriler bulunamadı');
            }
            
            // Budgets alanı varsa kontrol et (opsiyonel alan)
            if (importedData.budgets && !Array.isArray(importedData.budgets)) {
                console.warn('İçe aktarma uyarısı: Bütçeler alanı dizi değil, düzeltiliyor');
                importedData.budgets = [];
            }

            if (options.merge) {
                const currentData = await this.getData();
                
                // İşlemleri birleştir
                const existingIds = new Set(currentData.transactions.map(t => t.id));
                const newTransactions = importedData.transactions.filter(t => !existingIds.has(t.id));
                currentData.transactions.push(...newTransactions);
                
                // Kategorileri birleştir
                Object.keys(importedData.categories).forEach(type => {
                    const existingNames = new Set(currentData.categories[type].map(c => c.name));
                    const newCategories = importedData.categories[type].filter(c => !existingNames.has(c.name));
                    currentData.categories[type].push(...newCategories);
                });
                
                // Hesapları birleştir
                const existingAccountNames = new Set(currentData.accounts.map(a => a.name));
                const newAccounts = importedData.accounts.filter(a => !existingAccountNames.has(a.name));
                currentData.accounts.push(...newAccounts);
                
                // Bütçeleri birleştir
                if (importedData.budgets && Array.isArray(importedData.budgets)) {
                    console.log('İçe aktarma: Bütçe verileri bulundu, birleştiriliyor...');
                    
                    // Eğer mevcut bütçe verisi yoksa, dizi oluştur
                    if (!currentData.budgets || !Array.isArray(currentData.budgets)) {
                        currentData.budgets = [];
                    }
                    
                    // Mevcut bütçe ID'lerini topla
                    const existingBudgetIds = new Set(currentData.budgets.map(b => b.id));
                    
                    // Yeni bütçeleri ekle (sadece ID'si mevcut olmayan)
                    const newBudgets = importedData.budgets.filter(b => !existingBudgetIds.has(b.id));
                    currentData.budgets.push(...newBudgets);
                    
                    console.log(`İçe aktarma: ${newBudgets.length} yeni bütçe eklendi`);
                }
                
                await this.saveData(currentData);
            } else {
                await this.saveData(importedData);
            }
            
            showToast('Veriler başarıyla içe aktarıldı!', 'success');
            return true;
        } catch (error) {
            console.error('İçe aktarma hatası:', error);
            showToast('Veri içe aktarılırken hata oluştu!', 'error');
            return false;
        }
    }

    /**
     * Veriyi sıfırla
     */
    async resetData() {
        if (this.useLocalStorage) {
            localStorage.removeItem(this.storageKey);
        } else {
            // IndexedDB'deki veriyi sil
            const transaction = this.db.transaction(['budgetData'], 'readwrite');
            const store = transaction.objectStore('budgetData');
            await store.delete('mainData');
        }
        
        // Varsayılan veriyi baştan oluştur
        const defaultData = this.getDefaultData();
        await this.saveData(defaultData);
        
        showToast('Veriler sıfırlandı!', 'success');
    }
    
    /**
     * Tüm işlemlerin veri bütünlüğünü kontrol et ve düzelt
     * - Planlanan işlemlerin amount alanı null olmalı
     * - Gerçekleşen işlemlerin amount alanı dolu olmalı
     */
    async fixTransactionDataIntegrity() {
        try {
            const data = await this.getData();
            if (!data || !data.transactions || !Array.isArray(data.transactions)) {
                console.error('fixTransactionDataIntegrity: Veri yapısı geçersiz');
                return false;
            }
            
            console.log('İşlem veri bütünlüğü kontrolü başlatılıyor...');
            let fixedCount = 0;
            
            data.transactions.forEach(transaction => {
                let isFixed = false;
                
                // Planlanan işlemlerin amount alanı null olmalı
                if (transaction.status === 'planned' && transaction.amount !== null) {
                    console.log(`Düzeltme: Planlanan işlem (${transaction.id}) için amount null yapılıyor`, {
                        oldAmount: transaction.amount,
                        plannedAmount: transaction.plannedAmount
                    });
                    
                    // Eğer plannedAmount yoksa, amount değerini aktar
                    if (transaction.plannedAmount === null || transaction.plannedAmount === undefined) {
                        transaction.plannedAmount = transaction.amount;
                    }
                    
                    transaction.amount = null;
                    isFixed = true;
                }
                
                // Gerçekleşen işlemlerin amount alanı dolu olmalı
                if (transaction.status === 'actual' && (transaction.amount === null || transaction.amount === undefined)) {
                    console.log(`Düzeltme: Gerçekleşen işlem (${transaction.id}) için amount değeri atanıyor`, {
                        oldAmount: transaction.amount,
                        plannedAmount: transaction.plannedAmount
                    });
                    
                    // Eğer plannedAmount varsa onu kullan, yoksa 0 ata
                    transaction.amount = transaction.plannedAmount !== null ? transaction.plannedAmount : 0;
                    isFixed = true;
                }
                
                if (isFixed) fixedCount++;
            });
            
            if (fixedCount > 0) {
                console.log(`${fixedCount} işlem düzeltildi, değişiklikler kaydediliyor...`);
                await this.saveData(data);
                showToast(`${fixedCount} işlem düzeltildi!`, 'success');
                return true;
            } else {
                console.log('Düzeltilecek işlem bulunamadı');
                return false;
            }
        } catch (error) {
            console.error('Veri bütünlüğü düzeltme hatası:', error);
            return false;
        }
    }
}

// Global instance
const dataManager = new DataManager();