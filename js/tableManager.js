// js/tableManager.js - Tablo Yönetimi

// Initialize global variables
window.bulkTypeValue = '';
window.bulkCategoryValue = '';
window.bulkSubcategoryValue = '';
window.bulkAccountValue = '';
window.bulkStatusValue = '';
window.bulkDateValue = '';
window.bulkTagActionValue = '';

class TableManager {
    constructor() {
        this.table = null;
        this.currentFilters = {};
        this.initializeEventListeners();
        
        // Sayfa yüklendiğinde etiket filtresi seçeneklerini doldur
        document.addEventListener('DOMContentLoaded', () => {
            this.updateTagFilterOptions();
        });
    }
    
    /**
     * Tabloyu yenile
     */
    refreshTable() {
        console.log("İşlem tablosu yenileniyor...");
        
        if (this.table) {
            // Mevcut filtreleri koru
            const filters = this.currentFilters;
            
            // Tabloyu yeniden oluştur
            this.table.setData(this.getFilteredTransactions(filters))
                .then(() => {
                    // İkonları yenile
                    lucide.createIcons();
                    
                    // Toplu işlem butonlarını sıfırla
                    this.resetBulkActionButtons();
                    
                    console.log("Tablo yenilendi");
                });
        } else {
            console.log("Tablo henüz oluşturulmamış");
        }
    }
    
    /**
     * Tabloyu zorla yenile - Daha sağlam ve güvenilir bir yenileme için
     * Bu metot veri değişikliklerinden sonra tabloyu tamamen yenilemek için kullanılır
     */
    async forceRefreshTable() {
        console.log("Tablo zorla yenileniyor...");
        
        try {
            // Veri değişikliklerinin IndexedDB'ye yazılması için küçük bir gecikme
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (this.table) {
                // Mevcut filtreleri koru
                const filters = this.currentFilters || {};
                
                // Önce mevcut tabloyu temizle
                this.table.clearData();
                
                // DataManager'dan taze veri al
                console.log("Taze işlem verileri alınıyor...");
                const transactions = await dataManager.getTransactions();
                
                if (Array.isArray(transactions)) {
                    console.log(`${transactions.length} işlem alındı, filtreler uygulanıyor...`);
                    
                    // Filtreleri uygula
                    let filteredData = transactions;
                    if (Object.keys(filters).length > 0) {
                        filteredData = this.applyFiltersToData(transactions, filters);
                        console.log(`Filtreler sonrası ${filteredData.length} işlem görüntülenecek`);
                    }
                    
                    // Veriyi tabloyu aktar
                    await this.table.setData(filteredData);
                    
                    // Tablo görünümünü tamamen yenile
                    this.table.redraw(true);
                    
                    // İkonları yenile
                    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
                        lucide.createIcons();
                    }
                    
                    // Toplu işlem butonlarını sıfırla
                    this.resetBulkActionButtons();
                    
                    console.log("Tablo başarıyla zorla yenilendi");
                } else {
                    console.error("Geçersiz veri formatı:", transactions);
                    this.table.setData([]);
                }
            } else {
                console.log("Tablo henüz oluşturulmamış, başlatılıyor...");
                await this.initializeTable();
            }
        } catch (error) {
            console.error("Tablo zorla yenileme hatası:", error);
            
            // Hatadan kurtulma: Varsayılan yenileme metodu
            try {
                this.refreshTable();
            } catch (fallbackError) {
                console.error("Yedek yenileme de başarısız oldu:", fallbackError);
                showToast("Tablo yenilenirken bir sorun oluştu. Sayfayı yenileyebilirsiniz.", "error");
            }
        }
        
        return true;
    }
    
    /**
     * Filtreleri veri dizisine uygula
     * ForceRefreshTable için yardımcı fonksiyon
     */
    applyFiltersToData(data, filters) {
        if (!Array.isArray(data) || !filters) return data;
        
        return data.filter(item => {
            // Tarih filtresi
            if (filters.dateRange) {
                const { startDate, endDate } = filters.dateRange;
                const itemDate = new Date(item.date);
                
                if (startDate && itemDate < new Date(startDate)) return false;
                if (endDate && itemDate > new Date(endDate)) return false;
            }
            
            // Tip filtresi (gelir/gider)
            if (filters.type && filters.type !== 'all' && item.type !== filters.type) {
                return false;
            }
            
            // Durum filtresi (gerçekleşen/planlanan)
            if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
                return false;
            }
            
            // Kategori filtresi
            if (filters.categoryId && item.categoryId !== filters.categoryId) {
                return false;
            }
            
            // Alt kategori filtresi
            if (filters.subcategoryId && item.subcategoryId !== filters.subcategoryId) {
                return false;
            }
            
            // Hesap filtresi
            if (filters.accountId && item.accountId !== filters.accountId) {
                return false;
            }
            
            // Tutar filtresi
            if (filters.amountRange) {
                const { min, max } = filters.amountRange;
                const amount = item.status === 'actual' ? item.amount : item.plannedAmount;
                
                if (min !== null && amount < min) return false;
                if (max !== null && amount > max) return false;
            }
            
            // Etiket filtresi
            if (filters.tags && filters.tags.length > 0) {
                const itemTags = Array.isArray(item.tags) ? item.tags : [];
                const hasAnyTag = filters.tags.some(tag => itemTags.includes(tag));
                if (!hasAnyTag) return false;
            }
            
            // Metin araması
            if (filters.searchText) {
                const searchText = filters.searchText.toLowerCase();
                const description = (item.description || '').toLowerCase();
                const notes = (item.notes || '').toLowerCase();
                const reference = (item.reference || '').toLowerCase();
                
                const hasText = description.includes(searchText) || 
                               notes.includes(searchText) || 
                               reference.includes(searchText);
                               
                if (!hasText) return false;
            }
            
            return true;
        });
    }

    /**
     * Event listener'ları başlat
     */
    initializeEventListeners() {
        // İşlem ekleme butonu
        document.getElementById('addTransaction')?.addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Filtre event listener'ları
        ['dateFilter', 'typeFilter', 'categoryFilter', 'accountFilter', 'statusFilter', 'tagFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });

        // Etiket yönetimi butonu
        document.getElementById('manageTags')?.addEventListener('click', () => {
            this.showTagManagerModal();
        });

        // FAB (Floating Action Button)
        document.getElementById('fab')?.addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Toplu işlem butonları
        document.getElementById('bulkEditBtn')?.addEventListener('click', async () => {
            try {
                await this.editSelectedTransactions();
            } catch (error) {
                console.error('Error in bulk edit button click handler:', error);
                showToast('İşlem düzenleme sırasında bir hata oluştu', 'error');
            }
        });

        document.getElementById('bulkDeleteBtn')?.addEventListener('click', () => {
            this.deleteSelectedTransactions();
        });

        document.getElementById('bulkRealizeBtn')?.addEventListener('click', () => {
            this.realizeSelectedTransactions();
        });
    }

    /**
     * Toplu işlem butonlarını sıfırla
     */
    resetBulkActionButtons() {
        const bulkEditBtn = document.getElementById('bulkEditBtn');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        const bulkRealizeBtn = document.getElementById('bulkRealizeBtn');
        
        if (bulkEditBtn) {
            bulkEditBtn.disabled = true;
            bulkEditBtn.classList.add('opacity-50');
        }
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = true;
            bulkDeleteBtn.classList.add('opacity-50');
        }
        
        if (bulkRealizeBtn) {
            bulkRealizeBtn.disabled = true;
            bulkRealizeBtn.classList.add('opacity-50');
        }
        
        // Seçili satır sayısını sıfırla
        document.getElementById('selectedRowsCount').textContent = '0';
    }

    /**
     * Tabloyu başlat
     */
    async initializeTable() {
        const container = document.getElementById('transactionsTable');
        if (!container) return;

        // Önceki tabloyu temizle
        if (this.table) {
            this.table.destroy();
        }
        
        // Toplu işlem butonlarını sıfırla
        this.resetBulkActionButtons();

        // Veriyi asenkron olarak getir
        const tableData = await this.getTableData();

        this.table = new Tabulator(container, {
            data: tableData,
            layout: 'fitColumns',
            responsiveLayout: 'hide',
            pagination: 'local',
            paginationSize: 50,
            paginationCounter: 'rows',
            movableColumns: true,
            resizableRows: true,
            selectable: true,
            selectableRangeMode: "click",
            selectableRollingSelection: false,
            // Force row selection to work with CSS
            rowSelectionChanged: function(data, rows) {
                console.log("Row selection changed in table config:", data.length);
                
                // Update selected count display
                document.getElementById('selectedRowsCount').textContent = data.length;
                
                // Get bulk action buttons
                const bulkEditBtn = document.getElementById('bulkEditBtn');
                const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
                const bulkRealizeBtn = document.getElementById('bulkRealizeBtn');
                
                // Enable/disable buttons based on selection
                if (bulkEditBtn) {
                    bulkEditBtn.disabled = data.length === 0;
                    bulkEditBtn.classList.toggle('opacity-50', data.length === 0);
                }
                
                if (bulkDeleteBtn) {
                    bulkDeleteBtn.disabled = data.length === 0;
                    bulkDeleteBtn.classList.toggle('opacity-50', data.length === 0);
                }
                
                // Check if any selected row is a planned transaction
                const hasPlannedTransactions = data.some(row => row.status === 'planned');
                
                if (bulkRealizeBtn) {
                    const shouldDisable = !hasPlannedTransactions || data.length === 0;
                    bulkRealizeBtn.disabled = shouldDisable;
                    bulkRealizeBtn.classList.toggle('opacity-50', shouldDisable);
                }
            },
            locale: 'tr-tr',
            langs: {
                'tr-tr': {
                    'pagination': {
                        'page_size': 'Sayfa Boyutu',
                        'first': 'İlk',
                        'first_title': 'İlk Sayfa',
                        'last': 'Son',
                        'last_title': 'Son Sayfa',
                        'prev': 'Önceki',
                        'prev_title': 'Önceki Sayfa',
                        'next': 'Sonraki',
                        'next_title': 'Sonraki Sayfa',
                        'all': 'Tümü'
                    }
                }
            },
            columns: [
                {
                    title: '', 
                    field: 'type', 
                    width: 50,
                    formatter: (cell) => {
                        const type = cell.getValue();
                        const color = type === 'income' ? '#10B981' : '#EF4444';
                        const icon = type === 'income' ? 'trending-up' : 'trending-down';
                        return `<div class="flex justify-center">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center" style="background-color: ${color}20;">
                                <i data-lucide="${icon}" class="w-3 h-3" style="color: ${color};"></i>
                            </div>
                        </div>`;
                    },
                    headerSort: false
                },
                {
                    title: 'Tarih', 
                    field: 'date', 
                    width: 120,
                    formatter: (cell) => formatDate(cell.getValue()),
                    sorter: 'date',
                    editor: 'input',
                    editorParams: { type: 'date' }
                },
                {
                    title: 'Durum', 
                    field: 'status', 
                    width: 100,
                    formatter: (cell) => {
                        const status = cell.getValue();
                        let statusText, statusClass;
                        
                        if (status === 'planned') {
                            statusText = 'Planlanan';
                            statusClass = 'bg-blue-100 text-blue-800';
                        } else {
                            statusText = 'Gerçekleşen';
                            statusClass = 'bg-green-100 text-green-800';
                        }
                        
                        return `<span class="${statusClass} px-2 py-1 rounded text-xs font-medium">${statusText}</span>`;
                    },
                    headerSort: true
                },
                {
                    title: 'Açıklama', 
                    field: 'description', 
                    minWidth: 200,
                    editor: 'input',
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? escapeHtml(value) : '<span class="text-gray-400 italic">Açıklama yok</span>';
                    }
                },
                {
                    title: 'Kategori', 
                    field: 'categoryName', 
                    width: 150,
                    formatter: (cell, formatterParams, onRendered) => {
                        try {
                            const row = cell.getRow().getData();
                            if (!row || !row.categoryId) return '<span class="text-gray-400">-</span>';
                            
                            // Async getters cause issues in formatters, we'll use the categoryName field
                            const categoryName = row.categoryName || '-';
                            let categoryColor = '#CCCCCC';
                            
                            // Use a placeholder color if we don't have the actual category data
                            let content = `<div class="flex items-center space-x-2">
                                <div class="w-3 h-3 rounded-full" style="background-color: ${categoryColor};"></div>
                                <span class="text-sm">${escapeHtml(categoryName)}</span>
                            </div>`;
                            
                            // Alt kategori varsa ekle
                            if (row.subcategoryName) {
                                content += `<div class="flex items-center space-x-2 ml-4 mt-1">
                                    <div class="w-2 h-2 rounded-full" style="background-color: #EEEEEE;"></div>
                                    <span class="text-xs text-gray-600">${escapeHtml(row.subcategoryName)}</span>
                                </div>`;
                            }
                            
                            return content;
                        } catch (error) {
                            console.error('Error formatting category cell:', error);
                            return '<span class="text-gray-400">-</span>';
                        }
                    },
                    headerSort: false
                },
                {
                    title: 'Hesap', 
                    field: 'accountName', 
                    width: 120,
                    formatter: (cell, formatterParams, onRendered) => {
                        const row = cell.getRow().getData();
                        const account = this.getAccountById(row.accountId);
                        if (!account) return '<span class="text-gray-400">-</span>';
                        
                        return `<div class="flex items-center space-x-2">
                            <div class="w-3 h-3 rounded-full" style="background-color: ${account.color};"></div>
                            <span class="text-sm">${escapeHtml(account.name)}</span>
                        </div>`;
                    },
                    headerSort: false
                },
                {
                    title: 'Etiketler', 
                    field: 'tags', 
                    width: 150,
                    formatter: (cell) => {
                        const tags = cell.getValue() || [];
                        if (tags.length === 0) return '<span class="text-gray-400">-</span>';
                        
                        // Tüm etiketleri ve renklerini al
                        const allTags = dataManager.getTags();
                        
                        return tags.map(tagName => {
                            // Etiket nesnesini bul
                            const tagObj = allTags.find(t => t.name === tagName);
                            // Etiket rengini kullan veya varsayılan renk
                            const tagColor = tagObj ? tagObj.color : '#E5E7EB';
                            const textColor = getContrastYIQ(tagColor);
                            
                            return `<span class="inline-block px-2 py-1 rounded-full text-xs mr-1 mb-1" 
                                        style="background-color: ${tagColor}; color: ${textColor};">
                                    ${escapeHtml(tagName)}
                                </span>`;
                        }).join('');
                    },
                    headerSort: false,
                    editor: this.tagsEditor.bind(this)
                },
                {
                    title: 'Tutar', 
                    field: 'displayAmount', 
                    width: 120,
                    formatter: (cell) => {
                        const row = cell.getRow().getData();
                        const displayAmount = cell.getValue();
                        const plannedAmount = row.plannedAmount;
                        const amount = row.amount;
                        const type = row.type;
                        const color = type === 'income' ? 'text-green-600' : 'text-red-600';
                        const sign = type === 'income' ? '+' : '-';
                        
                        // Debug: Cell data inceleme
                        console.log('Tablo hücresi:', { 
                            id: row.id,
                            status: row.status,
                            displayAmount: displayAmount,
                            amount: amount,
                            plannedAmount: plannedAmount,
                            type: type
                        });
                        
                        // Duruma göre gösterimi ayarla
                        if (row.status === 'planned') {
                            // Planlanan işlemler için plannedAmount alanını kullan
                            return `<span class="${color} font-medium opacity-75">
                                ${sign}${formatCurrency(plannedAmount || 0)} <span class="text-xs">(Planlanan)</span>
                            </span>`;
                        } else if (row.status === 'actual') {
                            // Eğer planlanan tutar varsa, gerçekleşen ve planlanan tutarları göster
                            if (plannedAmount) {
                                const diff = amount - plannedAmount;
                                const diffSign = diff >= 0 ? '+' : '';
                                const diffColor = type === 'income' 
                                    ? (diff >= 0 ? 'text-green-600' : 'text-red-600')
                                    : (diff <= 0 ? 'text-green-600' : 'text-red-600');
                                
                                // Sapma yüzdesini hesapla (0 kontrolü ekle)
                                const percentageChange = plannedAmount !== 0 
                                    ? Math.round((diff / plannedAmount) * 100) 
                                    : 0;
                                
                                return `<div>
                                    <span class="${color} font-medium">${sign}${formatCurrency(amount)}</span>
                                    <div class="text-xs ${diffColor}">
                                        ${diffSign}${formatCurrency(diff)} (${percentageChange}%)
                                    </div>
                                </div>`;
                            } else {
                                return `<span class="${color} font-medium">${sign}${formatCurrency(amount)}</span>`;
                            }
                        }
                        
                        return `<span class="${color} font-medium">${sign}${formatCurrency(displayAmount || 0)}</span>`;
                    },
                    editor: 'number',
                    editorParams: { min: 0, step: 0.01 },
                    headerSortStartingDir: "desc",
                    sorter: function(a, b, aRow, bRow) {
                        // Planlanan ve gerçekleşen işlemler için tutarları karşılaştır
                        const aData = aRow.getData();
                        const bData = bRow.getData();
                        
                        const aAmount = aData.status === 'planned' ? aData.plannedAmount || 0 : aData.amount || 0;
                        const bAmount = bData.status === 'planned' ? bData.plannedAmount || 0 : bData.amount || 0;
                        
                        return aAmount - bAmount;
                    }
                },
                {
                    title: 'İşlemler', 
                    field: 'actions', 
                    width: 140,
                    formatter: (cell) => {
                        const row = cell.getRow().getData();
                        
                        // Planlanan işlemler için gerçekleştir butonu ekle
                        if (row.status === 'planned') {
                            return `<div class="flex space-x-1">
                                <button class="realize-btn text-green-600 hover:text-green-800 p-1" title="Gerçekleştir">
                                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                                </button>
                                <button class="edit-btn text-blue-600 hover:text-blue-800 p-1" title="Düzenle">
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-btn text-red-600 hover:text-red-800 p-1" title="Sil">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>`;
                        } 
                        // Gerçekleşen işlemler için normal düzenle/sil
                        else {
                            return `<div class="flex space-x-1">
                                <button class="edit-btn text-blue-600 hover:text-blue-800 p-1" title="Düzenle">
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-btn text-red-600 hover:text-red-800 p-1" title="Sil">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>`;
                        }
                    },
                    headerSort: false,
                    cellClick: (e, cell) => {
                        e.stopPropagation();
                        const target = e.target.closest('button');
                        if (!target) return;
                        
                        const row = cell.getRow();
                        const data = row.getData();
                        
                        if (target.classList.contains('realize-btn')) {
                            this.realizePlannedTransaction(data.id);
                        } else if (target.classList.contains('edit-btn')) {
                            this.editTransaction(data.id);
                        } else if (target.classList.contains('delete-btn')) {
                            this.deleteTransaction(data.id);
                        }
                    }
                }
            ],
            cellEdited: (cell) => {
                const row = cell.getRow().getData();
                const field = cell.getField();
                const value = cell.getValue();
                
                this.updateTransactionField(row.id, field, value);
            },
            rowFormatter: (row) => {
                // Satır stilini ayarla
                const element = row.getElement();
                element.style.borderLeft = '3px solid transparent';
                
                // Hover effect
                element.addEventListener('mouseenter', () => {
                    element.style.backgroundColor = '#f9fafb';
                });
                element.addEventListener('mouseleave', () => {
                    element.style.backgroundColor = '';
                });
            }
        });

        // İkonları başlat ve butonları yeniden değerlendir
        this.table.on('renderComplete', () => {
            lucide.createIcons();
            this.resetBulkActionButtons();
        });
        
        // Add explicit table event for row selection
        this.table.on('rowSelectionChanged', (data, rows) => {
            console.log('Row selection event triggered:', data.length);
            
            // Update count
            const selectedCount = data.length;
            document.getElementById('selectedRowsCount').textContent = selectedCount;
            
            // Handle buttons
            const bulkEditBtn = document.getElementById('bulkEditBtn');
            const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
            const bulkRealizeBtn = document.getElementById('bulkRealizeBtn');
            
            // Direct DOM manipulation for button states
            if (bulkEditBtn) {
                console.log('Setting bulkEditBtn:', selectedCount > 0 ? 'enabled' : 'disabled');
                bulkEditBtn.disabled = selectedCount === 0;
                if (selectedCount === 0) {
                    bulkEditBtn.classList.add('opacity-50');
                } else {
                    bulkEditBtn.classList.remove('opacity-50');
                }
            }
            
            if (bulkDeleteBtn) {
                console.log('Setting bulkDeleteBtn:', selectedCount > 0 ? 'enabled' : 'disabled');
                bulkDeleteBtn.disabled = selectedCount === 0;
                if (selectedCount === 0) {
                    bulkDeleteBtn.classList.add('opacity-50');
                } else {
                    bulkDeleteBtn.classList.remove('opacity-50');
                }
            }
            
            // Handle planned transactions
            const hasPlannedTransactions = data.some(row => row.status === 'planned');
            
            if (bulkRealizeBtn) {
                console.log('Setting bulkRealizeBtn:', hasPlannedTransactions && selectedCount > 0 ? 'enabled' : 'disabled');
                const shouldDisable = !hasPlannedTransactions || selectedCount === 0;
                bulkRealizeBtn.disabled = shouldDisable;
                if (shouldDisable) {
                    bulkRealizeBtn.classList.add('opacity-50');
                } else {
                    bulkRealizeBtn.classList.remove('opacity-50');
                }
            }
        });

        // Grup fonksiyonları ekle
        this.addGroupingControls();
    }

    /**
     * Tablo verilerini getir
     */
    /**
     * Kategori ID'sine göre kategori nesnesini getir
     */
    async getCategoryById(categoryId) {
        try {
            const categories = await dataManager.getCategories();
            if (!categories || typeof categories !== 'object') {
                return null;
            }
            
            for (const type in categories) {
                if (Array.isArray(categories[type])) {
                    const category = categories[type].find(c => c.id === categoryId);
                    if (category) return category;
                }
            }
            return null;
        } catch (error) {
            console.error('Kategori bulma hatası:', error);
            return null;
        }
    }
    
    /**
     * Hesap ID'sine göre hesap nesnesini getir
     */
    async getAccountById(accountId) {
        try {
            const accounts = await dataManager.getAccounts();
            if (!Array.isArray(accounts)) {
                return null;
            }
            return accounts.find(a => a.id === accountId) || null;
        } catch (error) {
            console.error('Hesap bulma hatası:', error);
            return null;
        }
    }
    
    async getTableData() {
        try {
            const transactions = await dataManager.getTransactions(this.currentFilters);
            
            // Transactions array kontrolü
            if (!Array.isArray(transactions)) {
                console.error('Transactions is not an array:', transactions);
                return [];
            }
            
            // Her işlem için asenkron olarak kategori ve hesap bilgilerini getir
            const transactionPromises = transactions.map(async transaction => {
                let category = null;
                let account = null;
                
                try {
                    category = await this.getCategoryById(transaction.categoryId);
                    account = await this.getAccountById(transaction.accountId);
                } catch (error) {
                    console.error('Error fetching category or account:', error);
                }
                
                let subcategoryName = '';
                
                if (transaction.subcategoryId && category && Array.isArray(category.subcategories)) {
                    const subcategory = category.subcategories.find(s => s.id === transaction.subcategoryId);
                    subcategoryName = subcategory ? subcategory.name : '';
                }
            
            // Debug
            if (transaction.id) {
                console.log('Transaction for table:', {
                    id: transaction.id,
                    status: transaction.status,
                    type: transaction.type,
                    amount: transaction.amount,
                    plannedAmount: transaction.plannedAmount
                });
            }
            
            // Ensure proper handling of planned vs actual amounts
            let displayAmount = 0;
            
            if (transaction.status === 'planned') {
                // For planned transactions, use plannedAmount for display
                displayAmount = parseFloat(transaction.plannedAmount) || 0;
            } else {
                // For actual transactions, use amount for display
                displayAmount = transaction.amount;
                
                // If there's no planned amount but there's an amount, we need to handle the case
                // where a transaction was directly created as actual (not converted from planned)
                if (!transaction.plannedAmount && transaction.amount) {
                    // No special handling needed, amount is already set
                }
            }
            
            return {
                ...transaction,
                categoryName: category?.name || '',
                subcategoryName,
                accountName: account?.name || '',
                // Add displayAmount for easier access in formatters
                displayAmount: displayAmount
            };
        });
        
        // Execute all promises and return the table data
        try {
            return await Promise.all(transactionPromises);
        } catch (error) {
            console.error('Error processing transaction data:', error);
            return [];
        }
    } catch (error) {
        console.error('Error in getTableData:', error);
        return [];
    }
    }

    /**
     * Grup kontrollerini ekle
     */
    addGroupingControls() {
        const container = document.getElementById('transactionsTable');
        if (!container) return;

        // Grup kontrollerini ekle
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg';
        controlsDiv.innerHTML = `
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Grupla:</label>
                    <select id="groupBySelect" class="p-2 border border-gray-300 rounded text-sm">
                        <option value="">Gruplama Yok</option>
                        <option value="type">Tipe Göre</option>
                        <option value="categoryName">Kategoriye Göre</option>
                        <option value="accountName">Hesaba Göre</option>
                        <option value="date">Tarihe Göre</option>
                    </select>
                </div>
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Sırala:</label>
                    <select id="sortSelect" class="p-2 border border-gray-300 rounded text-sm">
                        <option value="date-desc">Tarih (Yeni → Eski)</option>
                        <option value="date-asc">Tarih (Eski → Yeni)</option>
                        <option value="amount-desc">Tutar (Büyük → Küçük)</option>
                        <option value="amount-asc">Tutar (Küçük → Büyük)</option>
                    </select>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-600">Toplam: <span id="totalCount" class="font-medium">0</span> işlem</span>
                <button id="exportTableBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    <i data-lucide="download" class="w-4 h-4 inline mr-1"></i>CSV İndir
                </button>
            </div>
        `;

        container.parentNode.insertBefore(controlsDiv, container);

        // Event listener'ları ekle
        document.getElementById('groupBySelect').addEventListener('change', (e) => {
            this.groupTable(e.target.value);
        });

        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortTable(e.target.value);
        });

        document.getElementById('exportTableBtn').addEventListener('click', () => {
            this.exportTableToCSV();
        });

        // Toplam sayıyı güncelle
        this.updateTotalCount();

        lucide.createIcons();
    }

    /**
     * Tabloyu grupla
     */
    groupTable(field) {
        if (!this.table) return;

        if (field) {
            this.table.setGroupBy(field);
            this.table.setGroupHeader((value, count, data, group) => {
                const total = data.reduce((sum, row) => {
                    // Use the displayAmount field for calculation
                    const amountToUse = row.status === 'planned' ? row.plannedAmount : row.amount;
                    return sum + (row.type === 'income' ? (amountToUse || 0) : -(amountToUse || 0));
                }, 0);
                
                return `<div class="flex justify-between items-center">
                    <span class="font-medium">${value || 'Belirtilmemiş'} (${count} işlem)</span>
                    <span class="font-medium ${total >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(Math.abs(total))}
                    </span>
                </div>`;
            });
        } else {
            this.table.setGroupBy(false);
        }
    }

    /**
     * Tabloyu sırala
     */
    sortTable(sortValue) {
        if (!this.table) return;

        const [field, direction] = sortValue.split('-');
        this.table.setSort(field, direction);
    }

    /**
     * Toplam sayıyı güncelle
     */
    updateTotalCount() {
        const totalElement = document.getElementById('totalCount');
        if (totalElement && this.table) {
            totalElement.textContent = this.table.getDataCount();
        }
    }

    /**
     * İşlem modal'ını göster
     */
    showTransactionModal(transactionId = null, options = {}) {
        try {
            const isEdit = !!transactionId;
            
            // İşlemin nereden geldiğini belirle (gerçekleşen veya planlanan)
            const isPlanned = options.isPlanned === true;
            
            // Uygun veri setinden işlemi al
            let transaction = null;
            if (isEdit) {
                if (isPlanned) {
                    transaction = dataManager.getPlannedTransactions().find(t => t.id === transactionId);
                } else {
                    transaction = dataManager.getTransactions().find(t => t.id === transactionId);
                }
            }
            
            const categories = dataManager.getCategories() || { income: [], expense: [] };
            const accounts = dataManager.getAccounts(true) || [];
            const accountsArray = Array.isArray(accounts) ? accounts : [];
            const tags = dataManager.getTags() || [];
            const allTags = Array.isArray(tags) ? tags.map(t => t.name) : [];
            
            // İşlemin gerçekleşme tarihini ve oluşturulma tarihini kontrol et
            const createdAt = transaction?.createdAt ? new Date(transaction.createdAt).toLocaleDateString('tr-TR') : '-';
            const updatedAt = transaction?.updatedAt ? new Date(transaction.updatedAt).toLocaleDateString('tr-TR') : '-';
            const completedAt = transaction?.completedAt ? new Date(transaction.completedAt).toLocaleDateString('tr-TR') : '-';
            
            // Transaction ID ve referans bilgisini hazırla
            const transactionInfo = isEdit ? `
                <div class="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 grid grid-cols-2 gap-2">
                    <div><span class="font-medium">İşlem ID:</span> ${transaction.id}</div>
                    <div><span class="font-medium">Referans:</span> ${transaction.reference || '-'}</div>
                    <div><span class="font-medium">Oluşturulma:</span> ${createdAt}</div>
                    <div><span class="font-medium">Güncellenme:</span> ${updatedAt}</div>
                    ${transaction.status === 'actual' ? `<div><span class="font-medium">Gerçekleşme:</span> ${completedAt}</div>` : ''}
                </div>
            ` : '';
    
            const modal = createModal(
                isEdit ? 'İşlem Düzenle' : 'Yeni İşlem',
                `
                <form id="transactionForm" class="space-y-4">
                    ${transactionInfo}
                
                    <div class="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-4">
                            <div class="form-check">
                                <input type="radio" id="statusActual" name="transactionStatus" value="actual" 
                                       ${!isPlanned && (!transaction || transaction.status === 'actual') ? 'checked' : ''} 
                                       class="form-check-input">
                                <label for="statusActual" class="form-check-label text-sm font-medium">Gerçekleşen</label>
                            </div>
                            <div class="form-check">
                                <input type="radio" id="statusPlanned" name="transactionStatus" value="planned" 
                                       ${isPlanned || transaction?.status === 'planned' ? 'checked' : ''} 
                                       class="form-check-input">
                                <label for="statusPlanned" class="form-check-label text-sm font-medium">Planlanan</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                            <select id="transactionType" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                                <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>Gelir</option>
                                <option value="expense" ${transaction?.type === 'expense' ? 'selected' : ''}>Gider</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tutar</label>
                            <input type="number" id="transactionAmount" value="${transaction?.amount || ''}" step="0.01" min="0"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                   placeholder="0.00" required>
                        </div>
                    </div>
                    
                    <div id="plannedAmountContainer" class="${transaction?.status === 'actual' ? '' : 'hidden'}">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Planlanan Tutar</label>
                        <input type="number" id="transactionPlannedAmount" value="${transaction?.plannedAmount || ''}" step="0.01" min="0"
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                               placeholder="0.00">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                        <input type="text" id="transactionDescription" value="${transaction ? escapeHtml(transaction.description || '') : ''}"
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                               placeholder="İşlem açıklaması">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                            <select id="transactionCategory" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" required>
                                <option value="">Kategori seçin</option>
                                ${Object.keys(categories).map(type => 
                                    categories[type].map(cat => 
                                        `<option value="${cat.id}" data-type="${type}" ${transaction?.categoryId === cat.id ? 'selected' : ''}>
                                            ${cat.name} (${type === 'income' ? 'Gelir' : 'Gider'})
                                        </option>`
                                    ).join('')
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Alt Kategori</label>
                            <select id="transactionSubcategory" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                                <option value="">Alt kategori seçin</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Hesap</label>
                            <select id="transactionAccount" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" required>
                                <option value="">Hesap seçin</option>
                                ${accountsArray.map(acc => 
                                    `<option value="${acc.id}" ${transaction?.accountId === acc.id ? 'selected' : ''}>
                                        ${escapeHtml(acc.name)}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                            <input type="date" id="transactionDate" value="${transaction ? transaction.date : new Date().toISOString().split('T')[0]}"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" required>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Referans No</label>
                        <input type="text" id="transactionReference" value="${transaction?.reference || ''}"
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                               placeholder="Referans numarası veya kodu">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
                        <div class="relative">
                            <input type="text" id="transactionTags" value="${transaction?.tags ? transaction.tags.join(', ') : ''}"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                   placeholder="Etiketleri virgülle ayırın">
                            <div id="tagsSuggestions" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg hidden max-h-32 overflow-y-auto">
                                ${allTags.map(tag => 
                                    `<div class="tag-suggestion p-2 hover:bg-gray-100 cursor-pointer text-sm">${escapeHtml(tag)}</div>`
                                ).join('')}
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Mevcut etiketler: ${allTags.length > 0 ? allTags.join(', ') : 'Henüz etiket yok'}</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                        <textarea id="transactionNotes" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                                  rows="3" placeholder="İşlemle ilgili notlar">${transaction?.notes || ''}</textarea>
                    </div>
                </form>
                `,
            [
                {
                    text: 'İptal',
                    class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                },
                {
                    text: isEdit ? 'Güncelle' : 'Ekle',
                    class: 'bg-teal-500 hover:bg-teal-600 text-white',
                    onclick: `tableManager.${isEdit ? 'updateTransaction' : 'addTransaction'}(${isEdit ? `'${transactionId}'` : 'null'})`
                }
            ]
        );

        // Kategori-tip sync
        const typeSelect = modal.querySelector('#transactionType');
        const categorySelect = modal.querySelector('#transactionCategory');
        const subcategorySelect = modal.querySelector('#transactionSubcategory');
        const statusRadios = modal.querySelectorAll('input[name="transactionStatus"]');
        const plannedAmountContainer = modal.querySelector('#plannedAmountContainer');
        
        // İşlem durumuna göre planlanan tutar alanını göster/gizle ve alanları güncelle
        statusRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const amountInput = document.getElementById('transactionAmount');
                const plannedAmountInput = document.getElementById('transactionPlannedAmount');
                
                if (radio.value === 'actual') {
                    // Gerçekleşen işlem - planlanan tutar alanını göster
                    plannedAmountContainer.classList.remove('hidden');
                    
                    // Eğer planlanan tutar boşsa ve miktar varsa, planlanan tutara aktar
                    if ((!plannedAmountInput.value || plannedAmountInput.value === '0') && amountInput.value) {
                        plannedAmountInput.value = amountInput.value;
                    }
                } else {
                    // Planlanan işlem - planlanan tutar alanını gizle
                    plannedAmountContainer.classList.add('hidden');
                    
                    // Eğer miktar boşsa ve planlanan tutar varsa, miktara aktar
                    if ((!amountInput.value || amountInput.value === '0') && plannedAmountInput.value) {
                        amountInput.value = plannedAmountInput.value;
                    }
                }
            });
        });
        
        // İlk yüklemede işlem durumuna göre planlanan tutar alanını ayarla
        if (transaction && transaction.status === 'actual') {
            plannedAmountContainer.classList.remove('hidden');
        }
        
        // Kategori değiştiğinde alt kategorileri güncelle
        categorySelect.addEventListener('change', () => {
            this.updateSubcategories(categorySelect.value, subcategorySelect, transaction?.subcategoryId);
        });
        
        typeSelect.addEventListener('change', () => {
            this.filterCategoriesByType(categorySelect, typeSelect.value);
            // Kategori değişebileceği için alt kategorileri de temizle
            subcategorySelect.innerHTML = '<option value="">Alt kategori seçin</option>';
        });

        // İlk yüklemede filtreyi uygula
        if (transaction) {
            this.filterCategoriesByType(categorySelect, transaction.type);
            this.updateSubcategories(transaction.categoryId, subcategorySelect, transaction.subcategoryId);
        }

        // Tag suggestions
        const tagsInput = modal.querySelector('#transactionTags');
        const suggestions = modal.querySelector('#tagsSuggestions');
        
        if (tagsInput && suggestions) {
            tagsInput.addEventListener('focus', () => {
                suggestions.classList.remove('hidden');
            });
            
            tagsInput.addEventListener('blur', () => {
                setTimeout(() => suggestions.classList.add('hidden'), 200);
            });
    
            suggestions.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-suggestion')) {
                    const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
                    const newTag = e.target.textContent;
                    if (!currentTags.includes(newTag)) {
                        currentTags.push(newTag);
                        tagsInput.value = currentTags.join(', ');
                    }
                    suggestions.classList.add('hidden');
                }
            });
            
            // Etiket arama işlevi
            tagsInput.addEventListener('input', (e) => {
                const searchText = e.target.value.split(',').pop().trim().toLowerCase();
                if (searchText) {
                    // Etiket önerilerini filtrele
                    const tagSuggestions = suggestions.querySelectorAll('.tag-suggestion');
                    let hasVisibleSuggestion = false;
                    
                    tagSuggestions.forEach(suggestion => {
                        const tagText = suggestion.textContent.toLowerCase();
                        if (tagText.includes(searchText)) {
                            suggestion.style.display = 'block';
                            hasVisibleSuggestion = true;
                        } else {
                            suggestion.style.display = 'none';
                        }
                    });
                    
                    if (hasVisibleSuggestion) {
                        suggestions.classList.remove('hidden');
                    } else {
                        suggestions.classList.add('hidden');
                    }
                }
            });
        }
        
        // İkon oluşturma
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        } catch (error) {
            console.error("İşlem modalı oluşturulurken hata oluştu:", error);
            showToast('İşlem modalı oluşturulurken bir hata oluştu!', 'error');
        }
    }

    /**
     * Kategorileri tipe göre filtrele
     */
    filterCategoriesByType(categorySelect, type) {
        const options = categorySelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '') {
                option.style.display = 'block';
                return;
            }
            
            const optionType = option.dataset.type;
            option.style.display = optionType === type ? 'block' : 'none';
        });
        
        // Seçili kategori yanlış tipteyse sıfırla
        const selectedOption = categorySelect.querySelector('option:checked');
        if (selectedOption && selectedOption.dataset.type !== type) {
            categorySelect.value = '';
        }
    }
    
    /**
     * Seçilen kategoriye göre alt kategorileri güncelle
     */
    updateSubcategories(categoryId, subcategorySelect, selectedSubcategoryId = null) {
        if (!categoryId || !subcategorySelect) return;
        
        const category = this.getCategoryById(categoryId);
        if (!category) return;
        
        // Alt kategorileri temizle ve yeniden oluştur
        subcategorySelect.innerHTML = '<option value="">Alt kategori seçin</option>';
        
        if (category.subcategories && category.subcategories.length > 0) {
            category.subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory.id;
                option.textContent = subcategory.name;
                if (selectedSubcategoryId === subcategory.id) {
                    option.selected = true;
                }
                subcategorySelect.appendChild(option);
            });
            subcategorySelect.disabled = false;
        } else {
            subcategorySelect.disabled = true;
        }
    }

    /**
     * İşlem ekle
     */
    async addTransaction(transactionId) {
        try {
            const formData = this.getFormData();
            if (!formData) return;
    
            console.log('tableManager.addTransaction çağrıldı, form verisi:', formData);
            
            // Oluşturulma tarihini ekle
            formData.createdAt = new Date().toISOString();
            formData.updatedAt = formData.createdAt;
            
            // Gerçekleşen işlem ise tamamlanma tarihini ekle
            if (formData.status === 'actual') {
                formData.completedAt = formData.createdAt;
            }
    
            // Promise olarak bekliyoruz
            const newTransaction = await dataManager.addTransaction(formData);
            console.log('Yeni işlem eklendi:', newTransaction);
            
            if (newTransaction) {
                this.refreshTable();
                document.getElementById('modalContainer').innerHTML = '';
                
                // Diğer bölümleri güncelle
                if (typeof reportManager !== 'undefined') {
                    console.log('reportManager.updateOtherSections çağrılıyor...');
                    reportManager.updateOtherSections();
                }
                
                // Dashboard güncelle
                if (typeof chartManager !== 'undefined') {
                    console.log('chartManager.updateCharts çağrılıyor...');
                    chartManager.updateCharts();
                }
                
                showToast('İşlem başarıyla eklendi!', 'success');
            } else {
                console.error('İşlem eklenemedi, dataManager.addTransaction null döndü.');
                showToast('İşlem eklenirken bir hata oluştu!', 'error');
            }
        } catch (error) {
            console.error("İşlem eklenirken hata oluştu:", error);
            showToast('İşlem eklenirken bir hata oluştu!', 'error');
        }
    }

    /**
     * İşlem güncelle
     */
    async updateTransaction(transactionId) {
        try {
            console.log('tableManager.updateTransaction çağrıldı, ID:', transactionId);
            
            const formData = this.getFormData();
            if (!formData) {
                console.error('Form verisi alınamadı');
                return;
            }
            
            console.log('Form verisi hazırlandı:', formData);
            
            // İşlemi dataManager üzerinden güncelle
            console.log('dataManager.updateTransaction çağrılıyor...');
            
            // Güncelleme işlemi (Promise olarak bekliyoruz)
            const updateResult = await dataManager.updateTransaction(transactionId, formData);
            console.log('Güncelleme işlemi sonucu:', updateResult);
            
            if (updateResult) {
                console.log('Güncelleme başarılı, tablo yenileniyor...');
                
                // Tabloyu yenile
                this.refreshTable();
                
                // Modalı kapat
                document.getElementById('modalContainer').innerHTML = '';
                
                // Diğer bölümleri güncelle
                if (typeof reportManager !== 'undefined') {
                    console.log('reportManager.updateOtherSections çağrılıyor...');
                    reportManager.updateOtherSections();
                }
                
                // Dashboard güncelle
                if (typeof chartManager !== 'undefined') {
                    console.log('chartManager.updateCharts çağrılıyor...');
                    chartManager.updateCharts();
                }
                
                // Başarı mesajı göster
                showToast('İşlem başarıyla güncellendi!', 'success');
                
                // İşlem özeti 
                console.log('İşlem güncelleme tamamlandı. ID:', transactionId);
            } else {
                console.error('İşlem güncellenemedi, dataManager.updateTransaction false döndü.');
                showToast('İşlem güncellenirken bir hata oluştu!', 'error');
            }
        } catch (error) {
            console.error("İşlem güncellenirken hata oluştu:", error);
            showToast('İşlem güncellenirken bir hata oluştu!', 'error');
        }
    }

    /**
     * Form verilerini al
     */
    getFormData() {
        try {
            const status = document.querySelector('input[name="transactionStatus"]:checked')?.value;
            if (!status) {
                showToast('İşlem durumu seçin!', 'error');
                return null;
            }
            
            const type = document.getElementById('transactionType')?.value;
            if (!type) {
                showToast('İşlem tipini seçin!', 'error');
                return null;
            }
            
            const amountInput = document.getElementById('transactionAmount')?.value;
            
            // Boş input değerini kontrol et
            if (!amountInput || isNaN(parseFloat(amountInput))) {
                showToast('Geçerli bir tutar girin!', 'error');
                return null;
            }
            
            const amountValue = parseFloat(amountInput);
            let amount, plannedAmount;
            
            // İşlem durumuna göre tutar alanlarını belirle
            if (status === 'planned') {
                amount = null;
                plannedAmount = amountValue;
            } else { // actual
                amount = amountValue;
                // Planlanan tutar varsa al
                if (!document.getElementById('plannedAmountContainer').classList.contains('hidden')) {
                    const plannedAmountInput = document.getElementById('transactionPlannedAmount')?.value;
                    plannedAmount = plannedAmountInput ? parseFloat(plannedAmountInput) : null;
                } else {
                    plannedAmount = null;
                }
            }
            
            const description = document.getElementById('transactionDescription')?.value?.trim() || '';
            const categoryId = document.getElementById('transactionCategory')?.value;
            const subcategoryId = document.getElementById('transactionSubcategory')?.value;
            const accountId = document.getElementById('transactionAccount')?.value;
            const date = document.getElementById('transactionDate')?.value;
            const tagsValue = document.getElementById('transactionTags')?.value?.trim() || '';
            const notes = document.getElementById('transactionNotes')?.value?.trim() || '';
            const reference = document.getElementById('transactionReference')?.value?.trim() || '';
    
            // Validation
            if (status === 'planned' && plannedAmount <= 0) {
                showToast('Geçerli bir planlanan tutar girin!', 'error');
                return null;
            } else if (status === 'actual' && amount <= 0) {
                showToast('Geçerli bir tutar girin!', 'error');
                return null;
            }
    
            if (!categoryId) {
                showToast('Kategori seçin!', 'error');
                return null;
            }
    
            if (!accountId) {
                showToast('Hesap seçin!', 'error');
                return null;
            }
    
            if (!date) {
                showToast('Tarih seçin!', 'error');
                return null;
            }
    
            // Etiketleri işle
            const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];
            
            // İşlem güncelleme tarihini güncelle
            const updatedAt = new Date().toISOString();
            
            // Gerçekleşen işlem ise ve status değişmişse gerçekleşme tarihini güncelle
            let completedAt = null;
            if (status === 'actual') {
                completedAt = updatedAt;
            }
            
            const formData = {
                status,
                type,
                amount,
                plannedAmount,
                description,
                categoryId,
                subcategoryId: subcategoryId || null,
                accountId,
                date,
                tags,
                notes,
                reference,
                updatedAt,
                ...(completedAt && { completedAt })
            };
            
            return formData;
        } catch (error) {
            console.error("Form verisi alınırken hata oluştu:", error);
            showToast('Form verisi alınırken bir hata oluştu!', 'error');
            return null;
        }
    }
    
    /**
     * Planlanan işlemi gerçekleştir
     */
    realizePlannedTransaction(plannedId) {
        // Modal göster ve gerçekleşen tutarı sor
        const plannedTransaction = dataManager.getPlannedTransactions().find(t => t.id === plannedId);
        if (!plannedTransaction) return;
        
        const modal = createModal(
            'Planlanan İşlemi Gerçekleştir',
            `
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 class="text-blue-800 font-medium mb-2">Planlanan İşlem Detayları</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-600">Tip:</p>
                            <p class="font-medium">${plannedTransaction.type === 'income' ? 'Gelir' : 'Gider'}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Planlanan Tutar:</p>
                            <p class="font-medium">${formatCurrency(plannedTransaction.plannedAmount || 0)}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Açıklama:</p>
                            <p class="font-medium">${escapeHtml(plannedTransaction.description || '-')}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Tarih:</p>
                            <p class="font-medium">${formatDate(plannedTransaction.date)}</p>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="actualAmount" class="block text-sm font-medium text-gray-700 mb-2">Gerçekleşen Tutar</label>
                    <input type="text" id="actualAmount" value="${plannedTransaction.plannedAmount || 0}"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                </div>
                
                <div class="form-group">
                    <label for="realizationDate" class="block text-sm font-medium text-gray-700 mb-2">Gerçekleşme Tarihi</label>
                    <input type="date" id="realizationDate" value="${new Date().toISOString().split('T')[0]}"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
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
                    text: 'Gerçekleştir',
                    class: 'bg-green-500 hover:bg-green-600 text-white',
                    onclick: `tableManager.completeRealization('${plannedId}')`
                }
            ]
        );
    }
    
    /**
     * Gerçekleştirme işlemini tamamla
     */
    completeRealization(plannedId) {
        // Input değerini al
        const actualAmountInput = document.getElementById('actualAmount').value;
        const realizationDate = document.getElementById('realizationDate').value;
        
        // Planlanan tutarı kullanma seçeneği seçildiyse
        const plannedTransaction = dataManager.getPlannedTransactions().find(t => t.id === plannedId);
        const plannedAmount = plannedTransaction ? plannedTransaction.plannedAmount : 0;
        
        console.log(`DEBUG - completeRealization - Input değeri: "${actualAmountInput}", Planlanan tutar: ${plannedAmount}`);
        
        // Input boş ise veya sadece boşluk karakterleri içeriyorsa planlanan tutarı kullan
        if (!actualAmountInput || actualAmountInput.trim() === '') {
            console.log(`DEBUG - completeRealization - Boş input, planlanan tutar kullanılıyor: ${plannedAmount}`);
            
            if (plannedAmount <= 0) {
                showToast('Geçerli bir tutar girin!', 'error');
                return;
            }
            
            // Gerçekleştirme işlemini yap
            const result = dataManager.realizePlannedTransaction(plannedId, plannedAmount);
            
            if (result) {
                document.getElementById('modalContainer').innerHTML = '';
                this.refreshTable();
                
                // Diğer bölümleri güncelle
                if (typeof reportManager !== 'undefined') {
                    reportManager.updateOtherSections();
                }
                
                // Dashboard'ı güncelle
                if (typeof app !== 'undefined') {
                    app.updateDashboard();
                }
            }
            
            return;
        }
        
        // Türkçe sayı formatı düzeltmesi (126.500,00 -> 126500.00)
        let rawValue = actualAmountInput;
        rawValue = rawValue.replace(/\./g, '').replace(/,/g, '.');
        const actualAmount = parseFloat(rawValue);
        
        console.log(`DEBUG - completeRealization - Input: "${actualAmountInput}", Düzeltilmiş: "${rawValue}", Sayı: ${actualAmount}`);
        
        if (isNaN(actualAmount) || actualAmount <= 0) {
            showToast('Geçerli bir tutar girin!', 'error');
            return;
        }
        
        // Gerçekleştirme işlemini yap
        const result = dataManager.realizePlannedTransaction(plannedId, actualAmount);
        
        if (result) {
            document.getElementById('modalContainer').innerHTML = '';
            this.refreshTable();
            
            // Diğer bölümleri güncelle
            if (typeof reportManager !== 'undefined') {
                reportManager.updateOtherSections();
            }
            
            // Dashboard'ı güncelle
            if (typeof app !== 'undefined') {
                app.updateDashboard();
            }
        }
    }

    /**
     * İşlem düzenle
     */
    editTransaction(transactionId) {
        this.showTransactionModal(transactionId);
    }

    /**
     * İşlem sil
     */
    deleteTransaction(transactionId) {
        if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
            if (dataManager.deleteTransaction(transactionId)) {
                this.refreshTable();
                
                // Diğer bölümleri güncelle
                if (typeof reportManager !== 'undefined') {
                    reportManager.updateOtherSections();
                }
            }
        }
    }

    /**
     * İşlem alanını güncelle
     */
    updateTransactionField(transactionId, field, value) {
        const updates = {};
        updates[field] = value;
        
        if (dataManager.updateTransaction(transactionId, updates)) {
            // Diğer bölümleri güncelle
            if (typeof reportManager !== 'undefined') {
                reportManager.updateOtherSections();
            }
        }
    }

    /**
     * Filtreleri uygula
     */
    applyFilters() {
        const dateFilter = document.getElementById('dateFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const accountFilter = document.getElementById('accountFilter').value;
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const tagFilter = document.getElementById('tagFilter')?.value || 'all';

        this.currentFilters = {
            status: statusFilter
        };

        // Tarih filtresi
        if (dateFilter !== 'all') {
            switch (dateFilter) {
                case 'thisMonth':
                    const thisMonth = getCurrentMonthRange();
                    this.currentFilters.startDate = thisMonth.start;
                    this.currentFilters.endDate = thisMonth.end;
                    break;
                case 'lastMonth':
                    const lastMonth = getLastMonthRange();
                    this.currentFilters.startDate = lastMonth.start;
                    this.currentFilters.endDate = lastMonth.end;
                    break;
                case 'thisYear':
                    const thisYear = getCurrentYearRange();
                    this.currentFilters.startDate = thisYear.start;
                    this.currentFilters.endDate = thisYear.end;
                    break;
            }
        }

        // Diğer filtreler
        if (typeFilter !== 'all') {
            this.currentFilters.type = typeFilter;
        }

        if (categoryFilter !== 'all') {
            this.currentFilters.categoryId = categoryFilter;
        }

        if (accountFilter !== 'all') {
            this.currentFilters.accountId = accountFilter;
        }
        
        // Etiket filtresi
        if (tagFilter !== 'all') {
            this.currentFilters.tags = [tagFilter];
        }

        this.refreshTable();
    }

    /**
     * Tabloyu yenile
     */
    async refreshTable() {
        if (this.table) {
            try {
                console.log('Refreshing transaction table...');
                
                // Tüm filtre parametrelerini sıfırla
                this.table.clearFilter(true);
                
                // Tabloyu yeniden yükle
                const data = await this.getTableData();
                if (Array.isArray(data)) {
                    console.log(`Loaded ${data.length} transactions for table refresh`);
                    
                    // Debug: Check status distribution
                    const actualCount = data.filter(t => t.status === 'actual').length;
                    const plannedCount = data.filter(t => t.status === 'planned').length;
                    console.log(`Status distribution - Actual: ${actualCount}, Planned: ${plannedCount}`);
                    
                    // Debug: Check for any problematic data
                    const problematicData = data.filter(t => {
                        const isPlannedWithAmount = t.status === 'planned' && t.amount !== null;
                        const isActualWithoutAmount = t.status === 'actual' && t.amount === null;
                        return isPlannedWithAmount || isActualWithoutAmount;
                    });
                    
                    if (problematicData.length > 0) {
                        console.warn('Found problematic transaction data:', problematicData);
                    }
                    
                    // Tüm seçimleri temizle
                    this.table.deselectRow();
                    
                    // Verileri güncelle
                    this.table.setData(data);
                    
                    // Tablo görünümünü güncelle
                    this.table.redraw(true);
                } else {
                    console.error('Error: Table data is not an array', data);
                    this.table.setData([]);
                }
                
                // İstatistikleri güncelle
                this.updateTotalCount();
                
                console.log('Table refresh completed');
            } catch (error) {
                console.error('Error refreshing table:', error);
                this.table.setData([]);
            }
        } else {
            console.warn('Table is not initialized, cannot refresh');
        }
    }

    /**
     * CSV olarak dışa aktar
     */
    exportTableToCSV() {
        if (!this.table) return;

        const data = this.table.getData();
        const headers = ['Tarih', 'Durum', 'Tip', 'Açıklama', 'Kategori', 'Hesap', 'Tutar', 'Etiketler'];
        
        const csvContent = [
            headers.join(','),
            ...data.map(row => {
                // Use the appropriate amount based on transaction status
                const amountValue = row.status === 'planned' ? row.plannedAmount : row.amount;
                
                return [
                    row.date,
                    row.status === 'planned' ? 'Planlanan' : 'Gerçekleşen',
                    row.type === 'income' ? 'Gelir' : 'Gider',
                    `"${row.description || ''}"`,
                    `"${row.categoryName || ''}"`,
                    `"${row.accountName || ''}"`,
                    amountValue || 0,
                    `"${(row.tags || []).join(', ')}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `islemler_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
    
    /**
     * Seçili işlemleri düzenle
     */
    async editSelectedTransactions() {
        try {
            if (!this.table) return;
            
            const selectedData = this.table.getSelectedData();
            if (selectedData.length === 0) return;
            
            // Birden fazla işlem için düzenleme sadece şu alanlar için olabilir:
            // - Kategori
            // - Alt kategori
            // - Etiketler
            // - Hesap
            
            // Ortak değerleri bul (hepsi aynı değere sahipse o değeri göster)
            const commonValues = {
                type: this.getCommonValue(selectedData, 'type'),
                categoryId: this.getCommonValue(selectedData, 'categoryId'),
                accountId: this.getCommonValue(selectedData, 'accountId'),
                status: this.getCommonValue(selectedData, 'status')
            };
            
            // Etiketleri asenkron olarak al ve dizi olduğundan emin ol
            const allTagsResult = await dataManager.getTags({ sortBy: 'usageCount', sortOrder: 'desc' });
            const allTags = Array.isArray(allTagsResult) ? allTagsResult : [];
            
            console.log('Retrieved tags for bulk edit:', allTags.length);
            
            // Hesapları asenkron olarak al
            let accountsHtml = '';
            try {
                const accounts = await dataManager.getAccounts(true);
                const accountsArray = Array.isArray(accounts) ? accounts : [];
                
                accountsHtml = accountsArray.map(acc => 
                    `<option value="${acc.id}" ${commonValues.accountId === acc.id ? 'selected' : ''}>
                        ${escapeHtml(acc.name)}
                    </option>`
                ).join('');
            } catch (error) {
                console.error('Error getting accounts for dropdown:', error);
            }
            
            const modal = createModal(
                `${selectedData.length} İşlemi Düzenle`,
                `
                <form id="bulkEditForm" class="space-y-4">
                    <div class="bg-blue-50 p-3 rounded-lg mb-3">
                        <p class="text-sm text-blue-700">
                            ${selectedData.length} işlem seçtiniz. Değiştirmek istemediğiniz alanları boş bırakabilirsiniz.
                        </p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tip</label>
                            <select id="bulkType" name="bulkType" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" onchange="window.bulkTypeValue = this.value; console.log('Type set to global var:', this.value);">
                                <option value="">Değiştirme</option>
                                <option value="income" ${commonValues.type === 'income' ? 'selected' : ''}>Gelir</option>
                                <option value="expense" ${commonValues.type === 'expense' ? 'selected' : ''}>Gider</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Hesap</label>
                            <select id="bulkAccount" name="bulkAccount" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" onchange="window.bulkAccountValue = this.value; console.log('Account set to global var:', this.value);">
                                <option value="">Değiştirme</option>
                                ${accountsHtml}
                            </select>
                        </div>
                    </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                        <select id="bulkCategory" name="bulkCategory" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" onchange="window.bulkCategoryValue = this.value; console.log('Category set to global var:', this.value);">
                            <option value="">Değiştirme</option>
                            ${await (async () => {
                                try {
                                    // Asenkron olarak kategorileri al
                                    const categories = await dataManager.getCategories();
                                    
                                    // Kategorileri oluştur
                                    let options = '';
                                    for (const type in categories) {
                                        if (Array.isArray(categories[type])) {
                                            options += categories[type].map(cat => 
                                                `<option value="${cat.id}" data-type="${type}" ${commonValues.categoryId === cat.id ? 'selected' : ''}>
                                                    ${escapeHtml(cat.name)} (${type === 'income' ? 'Gelir' : 'Gider'})
                                                </option>`
                                            ).join('');
                                        }
                                    }
                                    return options;
                                } catch (error) {
                                    console.error('Error getting categories for dropdown:', error);
                                    return '';
                                }
                            })()}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Alt Kategori</label>
                        <select id="bulkSubcategory" name="bulkSubcategory" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" onchange="window.bulkSubcategoryValue = this.value; console.log('Subcategory set to global var:', this.value);" disabled>
                            <option value="">Değiştirme</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                    <select id="bulkStatus" name="bulkStatus" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" onchange="window.bulkStatusValue = this.value; console.log('Status set to global var:', this.value);">
                        <option value="">Değiştirme</option>
                        <option value="actual">Gerçekleşen</option>
                        <option value="planned">Planlanan</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <input type="date" id="bulkDate" name="bulkDate" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" onchange="window.bulkDateValue = this.value; console.log('Date set to global var:', this.value);">
                        </div>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Etiket İşlemleri</label>
                    <select id="bulkTagAction" name="bulkTagAction" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-3" onchange="window.bulkTagActionValue = this.value; console.log('Tag action set to global var:', this.value);">
                        <option value="">Etiketleri değiştirme</option>
                        <option value="add">Etiket ekle</option>
                        <option value="remove">Etiket kaldır</option>
                        <option value="replace">Tüm etiketleri değiştir</option>
                    </select>
                    
                    <div id="bulkTagsContainer" class="hidden space-y-3">
                        <div class="bg-gray-50 p-3 rounded-md">
                            <p class="text-sm text-gray-600" id="tagActionDescription">
                                Lütfen bir etiket işlemi seçin.
                            </p>
                        </div>
                        
                        <div class="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                            ${allTags.map(tag => `
                                <label class="inline-flex items-center bg-white p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" class="bulk-tag-checkbox mr-2" value="${escapeHtml(tag.name)}" 
                                           data-color="${tag.color}">
                                    <span class="flex items-center">
                                        <span class="w-3 h-3 rounded-full inline-block mr-1" style="background-color: ${tag.color}"></span>
                                        ${escapeHtml(tag.name)}
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <input type="text" id="newBulkTag" placeholder="Yeni etiket ekle" 
                                   class="flex-1 p-2 border border-gray-300 rounded-md">
                            <input type="color" id="newBulkTagColor" value="#3B82F6" class="h-full w-12 border border-gray-300">
                            <button type="button" id="addNewBulkTagBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            `,
            [
                {
                    text: 'İptal',
                    class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                },
                {
                    text: 'Güncelle',
                    class: 'bg-teal-500 hover:bg-teal-600 text-white',
                    onclick: 'tableManager.processBulkEdit().catch(error => { console.error("Error in bulk edit:", error); showToast("İşlem güncellenirken hata oluştu", "error"); })'
                }
            ]
        );
        
        // İkonları yükle
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
        }
        
        // Kategori ve alt kategori bağlantısı
        const bulkCategorySelect = document.getElementById('bulkCategory');
        const bulkSubcategorySelect = document.getElementById('bulkSubcategory');
        
        if (bulkCategorySelect && bulkSubcategorySelect) {
            bulkCategorySelect.addEventListener('change', () => {
                const categoryId = bulkCategorySelect.value;
                if (categoryId) {
                    bulkSubcategorySelect.disabled = false;
                    this.updateSubcategories(categoryId, bulkSubcategorySelect);
                } else {
                    bulkSubcategorySelect.disabled = true;
                    bulkSubcategorySelect.innerHTML = '<option value="">Değiştirme</option>';
                }
            });
            
            // İlk yüklemede kategori seçiliyse alt kategorileri yükle
            if (commonValues.categoryId) {
                this.updateSubcategories(commonValues.categoryId, bulkSubcategorySelect);
                bulkSubcategorySelect.disabled = false;
            }
        }
        
        // Etiket işlemi seçildiğinde etiket konteynerini göster/gizle
        document.getElementById('bulkTagAction').addEventListener('change', (e) => {
            const tagsContainer = document.getElementById('bulkTagsContainer');
            const actionDescElement = document.getElementById('tagActionDescription');
            
            if (e.target.value) {
                tagsContainer.classList.remove('hidden');
                
                // Açıklama metnini güncelle
                switch(e.target.value) {
                    case 'add':
                        actionDescElement.textContent = 'Seçilen etiketler, işlemlerin mevcut etiketlerine eklenecektir.';
                        break;
                    case 'remove':
                        actionDescElement.textContent = 'Seçilen etiketler, işlemlerden kaldırılacaktır.';
                        break;
                    case 'replace':
                        actionDescElement.textContent = 'İşlemlerin tüm etiketleri, seçtiğiniz etiketlerle değiştirilecektir.';
                        break;
                }
            } else {
                tagsContainer.classList.add('hidden');
                actionDescElement.textContent = 'Lütfen bir etiket işlemi seçin.';
            }
        });
        
        // Yeni etiket ekleme butonu
        document.getElementById('addNewBulkTagBtn')?.addEventListener('click', () => {
            const tagName = document.getElementById('newBulkTag').value.trim();
            const tagColor = document.getElementById('newBulkTagColor').value;
            
            if (tagName) {
                // Önce etiket ekle
                const newTag = dataManager.addTag(tagName, tagColor);
                
                if (newTag) {
                    // Etiketleri güncelle
                    this.updateTagFilterOptions();
                    
                    // Checkbox listesine yeni etiket ekle
                    const tagsContainer = document.querySelector('.flex.flex-wrap.gap-2');
                    const newTagElement = document.createElement('label');
                    newTagElement.className = 'inline-flex items-center bg-white p-2 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer';
                    newTagElement.innerHTML = `
                        <input type="checkbox" class="bulk-tag-checkbox mr-2" value="${escapeHtml(newTag.name)}" 
                               data-color="${newTag.color}" checked>
                        <span class="flex items-center">
                            <span class="w-3 h-3 rounded-full inline-block mr-1" style="background-color: ${newTag.color}"></span>
                            ${escapeHtml(newTag.name)}
                        </span>
                    `;
                    tagsContainer.appendChild(newTagElement);
                    
                    // Input'u temizle
                    document.getElementById('newBulkTag').value = '';
                }
            }
        });
        } catch (error) {
            console.error('Error in editSelectedTransactions:', error);
            showToast('İşlem düzenleme sırasında bir hata oluştu', 'error');
        }
    }
    
    /**
     * Toplu düzenleme işlemini tamamla
     */
    async processBulkEdit() {
        try {
            if (!this.table) return;
            
            const selectedRows = this.table.getSelectedRows();
            if (selectedRows.length === 0) return;
            
            // Get form values from global variables set by onchange events
            const type = window.bulkTypeValue || '';
            const categoryId = window.bulkCategoryValue || '';
            const subcategoryId = window.bulkSubcategoryValue || '';
            const accountId = window.bulkAccountValue || '';
            const status = window.bulkStatusValue || '';
            const tagAction = window.bulkTagActionValue || '';
            
            // Get date directly from input
            const date = window.bulkDateValue || '';
            
            console.log('BULK EDIT - Using values from global variables:', {
                type,
                categoryId,
                subcategoryId,
                accountId,
                status,
                date,
                tagAction
            });
            
            console.log('BULK EDIT - Form values captured directly:', {
                type,
                categoryId,
                subcategoryId,
                accountId,
                status,
                globalStatusValue: window.bulkStatusValue
            });
            
            // Etiket değerlerini al (tagAction değerini zaten global değişkenden aldık)
            const selectedTagCheckboxes = document.querySelectorAll('.bulk-tag-checkbox:checked');
            const selectedTags = Array.from(selectedTagCheckboxes).map(cb => cb.value);
            
            // Güncelleme durumunu göster
            showToast('İşlemler güncelleniyor...', 'info');
            
            // Her bir seçili satır için güncelleme yap
            let updateCount = 0;
            
            // Promise'leri sakla
            const updatePromises = [];
            
            // İşlemleri asenkron işle
            for (const row of selectedRows) {
                const data = row.getData();
                const updates = {};
                
                // Sadece dolu alanları güncelle
                if (type) updates.type = type;
                if (categoryId) updates.categoryId = categoryId;
                if (subcategoryId) updates.subcategoryId = subcategoryId;
                if (accountId) updates.accountId = accountId;
                if (date) {
                    updates.date = date;
                    console.log(`BULK EDIT - Adding date update for transaction ${data.id}:`, {
                        oldDate: data.date,
                        newDate: date
                    });
                }
                
                // Status update needs special handling
                if (status && status !== '') { // Make sure status is not empty
                    console.log(`BULK EDIT - Processing status change for transaction ${data.id}:`, {
                        oldStatus: data.status,
                        newStatus: status,
                        storedStatus: window.bulkStatusValue,
                        amount: data.amount,
                        plannedAmount: data.plannedAmount
                    });
                    
                    updates.status = status;
                    
                    // If changing from actual to planned, ensure amount and plannedAmount fields are handled correctly
                    if (data.status === 'actual' && status === 'planned') {
                        // When changing from actual to planned, we need to:
                        // 1. Preserve the actual amount as plannedAmount
                        // 2. Set amount to null (since planned transactions don't have actual amounts)
                        updates.plannedAmount = data.amount;
                        updates.amount = null;
                        
                        console.log('BULK EDIT - Special handling for actual->planned conversion:', {
                            transactionId: data.id,
                            oldAmount: data.amount,
                            newPlannedAmount: updates.plannedAmount,
                            newAmount: updates.amount
                        });
                    }
                    // If changing from planned to actual, reverse the logic
                    else if (data.status === 'planned' && status === 'actual') {
                        // When changing from planned to actual, we need to:
                        // 1. Set actual amount to planned amount
                        updates.amount = data.plannedAmount;
                        
                        console.log('BULK EDIT - Special handling for planned->actual conversion:', {
                            transactionId: data.id,
                            oldPlannedAmount: data.plannedAmount,
                            newAmount: updates.amount
                        });
                    }
                }
                
                // Etiketleri işle (eğer etiket işlemi seçilmişse)
                if (tagAction && selectedTags.length > 0) {
                    const currentTags = Array.isArray(data.tags) ? data.tags : [];
                    
                    switch (tagAction) {
                        case 'add':
                            // Mevcut etiketlere yenilerini ekle
                            updates.tags = [...new Set([...currentTags, ...selectedTags])]; // Benzersiz etiketler
                            break;
                        case 'remove':
                            // Seçili etiketleri kaldır
                            updates.tags = currentTags.filter(tag => !selectedTags.includes(tag));
                            break;
                        case 'replace':
                            // Tüm etiketleri değiştir
                            updates.tags = [...selectedTags];
                            break;
                    }
                }
                
                // Güncelleme yapılacak alan varsa işlemi gerçekleştir
                if (Object.keys(updates).length > 0) {
                    // Debug: Log each transaction update
                    console.log('BULK EDIT - Transaction update details:', {
                        transactionId: data.id,
                        currentStatus: data.status, 
                        newStatus: status,
                        currentDate: data.date,
                        newDate: date || 'unchanged',
                        updates: updates
                    });
                    
                    // Asenkron güncelleme işlemini başlat ve promise'i sakla
                    const updatePromise = dataManager.updateTransaction(data.id, updates)
                        .then(result => {
                            console.log('BULK EDIT - Update result for transaction', data.id, ':', result);
                            if (result) updateCount++;
                            return result;
                        })
                        .catch(error => {
                            console.error(`Error updating transaction ${data.id}:`, error);
                            return false;
                        });
                        
                    updatePromises.push(updatePromise);
                }
            }
            
            // Tüm güncelleme işlemlerinin tamamlanmasını bekle
            await Promise.all(updatePromises);
            
            // Modal'ı kapat
            document.getElementById('modalContainer').innerHTML = '';
            
            // Reset all global variables after use
            window.bulkTypeValue = '';
            window.bulkCategoryValue = '';
            window.bulkSubcategoryValue = '';
            window.bulkAccountValue = '';
            window.bulkStatusValue = '';
            window.bulkDateValue = '';
            window.bulkTagActionValue = '';
            
            // Tabloyu yenile
            await this.refreshTable();
            
            // Bildirim göster
            showToast(`${updateCount} işlem başarıyla güncellendi!`, 'success');
            
            // Dashboard'ı güncelle
            if (typeof chartManager !== 'undefined') {
                chartManager.updateCharts();
            }
        } catch (error) {
            console.error('Toplu düzenleme hatası:', error);
            showToast('Toplu düzenleme sırasında bir hata oluştu!', 'error');
            
            // Hata olsa bile modal'ı kapat
            document.getElementById('modalContainer').innerHTML = '';
        }
    }
    
    /**
     * Seçili işlemleri sil
     */
    deleteSelectedTransactions() {
        if (!this.table) return;
        
        const selectedData = this.table.getSelectedData();
        if (selectedData.length === 0) return;
        
        // Onay iste
        if (confirm(`${selectedData.length} işlemi silmek istediğinizden emin misiniz?`)) {
            let deleteCount = 0;
            
            // Her bir işlemi sil
            selectedData.forEach(data => {
                if (dataManager.deleteTransaction(data.id)) {
                    deleteCount++;
                }
            });
            
            // Tabloyu yenile
            this.refreshTable();
            
            // Bildirim göster
            showToast(`${deleteCount} işlem başarıyla silindi!`, 'success');
            
            // Dashboard'ı güncelle
            if (typeof app !== 'undefined') {
                app.updateDashboard();
            }
        }
    }
    
    /**
     * This function is now handled by the modal's built-in functionality in utils.js
     */
    
    /**
     * Seçili planlanan işlemleri gerçekleştir
     */
    realizeSelectedTransactions() {
        if (!this.table) return;
        
        // Sadece planlanan işlemleri filtrele
        const selectedData = this.table.getSelectedData().filter(d => d.status === 'planned');
        if (selectedData.length === 0) return;
        
        const modal = createModal(
            `${selectedData.length} Planlanan İşlemi Gerçekleştir`,
            `
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 class="text-blue-800 font-medium mb-2">Planlanan İşlemler</h4>
                    <p class="text-sm text-blue-700">Toplam ${selectedData.length} planlanan işlemi gerçekleştirmek üzeresiniz.</p>
                </div>
                
                <div class="form-group">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tutar Ayarı</label>
                    <select id="bulkAmountOption" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                        <option value="planned" selected>Planlanan tutarları kullan</option>
                        <option value="custom">Özel tutar gir (tüm işlemler için)</option>
                        <option value="percentage">Yüzdelik değişim uygula</option>
                    </select>
                </div>
                
                <div id="customAmountContainer" class="form-group" style="display: none;">
                    <label for="bulkAmount" class="block text-sm font-medium text-gray-700 mb-2">Özel Tutar</label>
                    <input type="text" id="bulkAmount" placeholder="Tüm işlemler için geçerli olacak tutar"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    <p class="text-xs text-red-600 font-semibold my-2">
                        Önemli: Özel tutar girdiğinizde, bu değer otomatik olarak kullanılacaktır.
                    </p>
                </div>
                
                <div id="percentageContainer" style="display: none;" class="form-group">
                    <label for="bulkPercentage" class="block text-sm font-medium text-gray-700 mb-2">Yüzde Değişim</label>
                    <div class="flex items-center">
                        <input type="number" id="bulkPercentage" value="0" step="1" min="-100" max="100" 
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                        <span class="ml-2 text-gray-700">%</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Örnek: %10 artış için 10, %10 azalış için -10 girin.</p>
                </div>

                
                <div class="form-group">
                    <label for="realizationDate" class="block text-sm font-medium text-gray-700 mb-2">Gerçekleşme Tarihi</label>
                    <input type="date" id="realizationDate" value="${new Date().toISOString().split('T')[0]}"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    <p class="text-xs text-gray-500 mt-1">Not: Bu tarih sadece bilgi amaçlıdır, gerçekleşme tarihini değiştirmez.</p>
                </div>
                
                <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="p-2 text-left">Açıklama</th>
                                <th class="p-2 text-right">Planlanan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedData.map(t => `
                                <tr class="border-t border-gray-100">
                                    <td class="p-2">${escapeHtml(t.description || '-')}</td>
                                    <td class="p-2 text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.plannedAmount || 0)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
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
                    text: 'Hepsini Gerçekleştir',
                    class: 'bg-green-500 hover:bg-green-600 text-white',
                    onclick: 'tableManager.processBulkRealization()'
                }
            ]
        );
        // Modal içindeki işlevsellik utils.js içindeki updateVisibility fonksiyonu ile otomatik olarak yönetilecek
    }
    
    /**
     * Toplu gerçekleştirme işlemini tamamla
     */
    processBulkRealization() {
        if (!this.table) return;
        
        // Sadece planlanan işlemleri filtrele
        const selectedRows = this.table.getSelectedRows().filter(row => row.getData().status === 'planned');
        if (selectedRows.length === 0) return;
        
        // Form verilerini al - önemli: burada değer otomatik olarak değişmiş olmalı
        let amountOption = document.getElementById('bulkAmountOption')?.value || 'planned';
        console.log("Başlangıç tutar ayarı:", amountOption);
        
        // Özel tutar input alanını al
        const customAmountInput = document.getElementById('bulkAmount');
        
        // Özel tutar var mı kontrol et - doğrudan değer veya global değişkenden
        const customValue = (customAmountInput && customAmountInput.value.trim()) || window.currentBulkAmount || "";
        console.log("DEBUG - Girilen özel tutar değeri:", customValue, "Global değer:", window.currentBulkAmount);
        
        // Eğer custom seçeneği seçilmiş ama değer girilmemişse, hata göster ve işlemi durdur
        if (amountOption === 'custom' && customValue === '') {
            console.log("Hata: 'Özel tutar' seçili ama değer girilmemiş");
            showToast('Lütfen bir tutar girin!', 'error');
            return;
        }
        
        // Eğer özel tutar girilmişse, otomatik olarak özel tutar seçeneğini seç
        if (customValue !== '') {
            amountOption = 'custom';
            const selectElement = document.getElementById('bulkAmountOption');
            if (selectElement) {
                selectElement.value = 'custom';
            }
            console.log("Özel tutar girildiği için, seçenek 'custom' olarak ayarlandı:", customValue);
            
            // Değeri hemen işle
            let rawValue = customValue;
            rawValue = rawValue.replace(/\./g, '').replace(/,/g, '.');
            const parsedValue = parseFloat(rawValue);
            
            if (!isNaN(parsedValue) && parsedValue > 0) {
                console.log("DEBUG - ÖZEL TUTAR DOĞRU İŞLENDİ:", parsedValue);
            }
        }
        
        console.log("Seçilen tutar ayarı:", amountOption, "- Input değeri:", customAmountInput?.value);
        
        // Özel tutar için input değerini al ve geçerli olduğundan emin ol
        let customAmount = 0;
        
        if (customValue) {
            // Türkçe sayı formatı düzeltmesi
            let rawValue = customValue;
            rawValue = rawValue.replace(/\./g, '').replace(/,/g, '.');
            customAmount = parseFloat(rawValue);
            
            console.log("DEBUG - Girilen özel tutar işleniyor:", customValue, "->", customAmount);
            
            if (isNaN(customAmount) || customAmount <= 0) {
                console.log("Hata: Geçersiz tutar");
                showToast('Lütfen geçerli bir tutar girin!', 'error');
                return;
            }
            
            // Tutar girildi, otomatik olarak custom olarak ayarla
            amountOption = 'custom';
            const selectElement = document.getElementById('bulkAmountOption');
            if (selectElement) {
                selectElement.value = 'custom';
            }
            console.log("DEBUG - Özel tutar girildiği için seçenek 'custom' olarak ayarlandı");
        }
        
        console.log("Özel tutar:", customAmount);
        
        // Yüzdelik değişim değerini al ve geçerli olduğundan emin ol
        let percentage = 0;
        const percentageInput = document.getElementById('bulkPercentage');
        if (amountOption === 'percentage') {
            if (percentageInput && percentageInput.value !== '') {
                percentage = parseInt(percentageInput.value);
                if (isNaN(percentage)) {
                    showToast('Lütfen geçerli bir yüzde değeri girin!', 'error');
                    return;
                }
                console.log("Yüzdelik değişim:", percentage, "%");
            } else {
                showToast('Lütfen bir yüzde değeri girin!', 'error');
                return;
            }
        }
        
        console.log('Toplu gerçekleştirme:', {
            amountOption,
            customAmount,
            percentage,
            selectedRows: selectedRows.length
        });
        
        // Her bir işlemi gerçekleştir
        let realizeCount = 0;
        
        selectedRows.forEach(row => {
            const data = row.getData();
            let actualAmount;
            
            // Her işlem için değeri belirle
            if (amountOption === 'custom' && customValue) {
                // Türkçe sayı formatı düzeltmesi (126.500,00 -> 126500.00)
                let rawValue = customValue;
                rawValue = rawValue.replace(/\./g, '').replace(/,/g, '.');
                const parsedValue = parseFloat(rawValue);
                
                if (!isNaN(parsedValue) && parsedValue > 0) {
                    actualAmount = parsedValue;
                    console.log(`İşlem ${data.id} için özel tutar kullanılıyor: ${actualAmount}`);
                } else {
                    useOptionBasedAmount();
                }
            } else {
                useOptionBasedAmount();
            }
            
            // Seçeneğe göre değer belirleme fonksiyonu
            function useOptionBasedAmount() {
                switch (amountOption) {
                    case 'custom':
                        actualAmount = customAmount;
                        console.log(`İşlem ${data.id} için özel tutar kullanılıyor: ${customAmount}`);
                        break;
                    case 'percentage':
                        // Yüzdelik değişim uygula
                        const plannedAmount = data.plannedAmount || 0;
                        actualAmount = plannedAmount * (1 + percentage / 100);
                        console.log(`İşlem ${data.id} için yüzdelik değişim uygulanıyor: ${plannedAmount} -> ${actualAmount} (${percentage}%)`);
                        break;
                    default:
                        // Planlanan tutarı kullan
                        actualAmount = data.plannedAmount || 0;
                        console.log(`İşlem ${data.id} için planlanan tutar kullanılıyor: ${actualAmount}`);
                }
            }
            
            // Son kez tutarı kontrol et
            console.log(`DEBUG - SON KONTROL - İşlem ${data.id} için kullanılacak tutar:`, actualAmount);
            
            if (isNaN(actualAmount) || actualAmount <= 0) {
                console.log(`Hata: İşlem ${data.id} için geçersiz tutar: ${actualAmount}`);
                showToast(`Bir işlem için geçersiz tutar! İşlem gerçekleştirilemiyor.`, 'error');
                return;
            }
            
            // İşlemi gerçekleştir
            if (dataManager.realizePlannedTransaction(data.id, actualAmount)) {
                realizeCount++;
            }
        });
        
        // Modal'ı kapat
        document.getElementById('modalContainer').innerHTML = '';
        
        // Tabloyu zorla yenile (daha sağlam güncelleme için)
        console.log("İşlem gerçekleştirme sonrası tablo zorla yenileniyor...");
        this.forceRefreshTable();
        
        // Bildirim göster
        showToast(`${realizeCount} planlanan işlem başarıyla gerçekleştirildi!`, 'success');
        
        // Dashboard'ı güncelle
        if (typeof app !== 'undefined') {
            app.updateDashboard();
        }
    }
    
    /**
     * Ortak değer bul
     */
    getCommonValue(dataArray, key) {
        if (!dataArray || dataArray.length === 0) return null;
        
        const firstValue = dataArray[0][key];
        const allSame = dataArray.every(item => item[key] === firstValue);
        
        return allSame ? firstValue : null;
    }

    /**
     * Tags editor
     */
    tagsEditor(cell, onRendered, success, cancel) {
        // Wrapper oluştur
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        
        // Input oluştur
        const input = document.createElement('input');
        input.type = 'text';
        input.value = (cell.getValue() || []).join(', ');
        input.style.width = '100%';
        input.style.padding = '4px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '4px';
        
        // Öneri listesi için div
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.style.display = 'none';
        suggestionsDiv.style.position = 'absolute';
        suggestionsDiv.style.width = '100%';
        suggestionsDiv.style.maxHeight = '150px';
        suggestionsDiv.style.overflowY = 'auto';
        suggestionsDiv.style.backgroundColor = 'white';
        suggestionsDiv.style.border = '1px solid #ccc';
        suggestionsDiv.style.borderRadius = '4px';
        suggestionsDiv.style.zIndex = '1000';
        suggestionsDiv.style.top = '100%';
        suggestionsDiv.style.left = '0';
        suggestionsDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        // DOM'a ekle
        wrapper.appendChild(input);
        wrapper.appendChild(suggestionsDiv);
        
        // Mevcut etiketleri al
        const allTags = dataManager.getTags({ sortBy: 'usageCount', sortOrder: 'desc' });
        
        // Input değiştiğinde önerileri göster
        input.addEventListener('input', () => {
            // Virgülden sonraki son etiketi al
            const currentInput = input.value;
            const lastCommaIndex = currentInput.lastIndexOf(',');
            const searchText = lastCommaIndex !== -1 ? 
                currentInput.substring(lastCommaIndex + 1).trim() : currentInput.trim();
            
            // Eğer boşsa önerileri gösterme
            if (!searchText) {
                suggestionsDiv.style.display = 'none';
                return;
            }
            
            // Önerileri filtrele
            const filtered = allTags
                .filter(tag => tag.name.toLowerCase().includes(searchText.toLowerCase()))
                .slice(0, 10); // İlk 10 öneri ile sınırla
            
            if (filtered.length === 0) {
                suggestionsDiv.style.display = 'none';
                return;
            }
            
            // Önerileri göster
            suggestionsDiv.innerHTML = '';
            filtered.forEach(tag => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('tag-suggestion-item');
                suggestionItem.style.padding = '5px 8px';
                suggestionItem.style.cursor = 'pointer';
                suggestionItem.style.display = 'flex';
                suggestionItem.style.alignItems = 'center';
                
                // Renk önizlemesi
                const colorPreview = document.createElement('span');
                colorPreview.style.width = '12px';
                colorPreview.style.height = '12px';
                colorPreview.style.borderRadius = '50%';
                colorPreview.style.backgroundColor = tag.color;
                colorPreview.style.display = 'inline-block';
                colorPreview.style.marginRight = '5px';
                
                // Etiket adı
                const tagName = document.createElement('span');
                tagName.textContent = tag.name;
                
                suggestionItem.appendChild(colorPreview);
                suggestionItem.appendChild(tagName);
                
                // Hover efekti
                suggestionItem.addEventListener('mouseenter', () => {
                    suggestionItem.style.backgroundColor = '#f3f4f6';
                });
                suggestionItem.addEventListener('mouseleave', () => {
                    suggestionItem.style.backgroundColor = '';
                });
                
                // Tıklama ile seçme
                suggestionItem.addEventListener('click', () => {
                    // Mevcut input değerini güncelle
                    if (lastCommaIndex !== -1) {
                        input.value = currentInput.substring(0, lastCommaIndex + 1) + ' ' + tag.name + ', ';
                    } else {
                        input.value = tag.name + ', ';
                    }
                    
                    // Önerileri gizle
                    suggestionsDiv.style.display = 'none';
                    
                    // Input'a odaklan
                    input.focus();
                });
                
                suggestionsDiv.appendChild(suggestionItem);
            });
            
            suggestionsDiv.style.display = 'block';
        });
        
        // Dışarı tıklandığında önerileri kapat
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                suggestionsDiv.style.display = 'none';
            }
        });
        
        // Input kaybedildiğinde submit et
        input.addEventListener('blur', (e) => {
            // Eğer öneri listesine tıklandıysa blur'ı engelle
            if (suggestionsDiv.contains(e.relatedTarget)) {
                return;
            }
            
            // Öneri listesi görünürse ve içine tıklanmadıysa kapat
            setTimeout(() => {
                const tags = input.value.split(',').map(t => t.trim()).filter(t => t);
                // Etiketleri güncelle
                dataManager.updateTags(tags);
                success(tags);
            }, 200);
        });
        
        // Klavye olayları
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const tags = input.value.split(',').map(t => t.trim()).filter(t => t);
                // Etiketleri güncelle
                dataManager.updateTags(tags);
                success(tags);
                suggestionsDiv.style.display = 'none';
            } else if (e.key === 'Escape') {
                suggestionsDiv.style.display = 'none';
                cancel();
            } else if (e.key === 'ArrowDown' && suggestionsDiv.style.display === 'block') {
                // İlk öneriyi seç
                const firstSuggestion = suggestionsDiv.querySelector('.tag-suggestion-item');
                if (firstSuggestion) {
                    firstSuggestion.focus();
                    e.preventDefault();
                }
            }
        });
        
        // Render edildiğinde input'a odaklan
        onRendered(() => {
            input.focus();
        });
        
        return wrapper;
    }

    /**
     * Yardımcı metodlar
     */
    async getCategoryById(categoryId) {
        const categories = await dataManager.getCategories();
        if (!categories) return null;
        
        for (const type in categories) {
            if (Array.isArray(categories[type])) {
                const category = categories[type].find(c => c.id === categoryId);
                if (category) return category;
            }
        }
        return null;
    }

    async getAccountById(accountId) {
        const accounts = await dataManager.getAccounts();
        return Array.isArray(accounts) ? accounts.find(a => a.id === accountId) : null;
    }
    
    /**
     * Etiket yönetimi modalını göster
     */
    showTagManagerModal() {
        // Etiket istatistiklerini al
        const tagStats = dataManager.getTagStats();
        
        // HTML oluştur
        const modalHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">Etiket Yönetimi</h3>
                <div class="flex items-center space-x-2">
                    <select id="tagSortSelect" class="text-sm border-gray-300 rounded-md">
                        <option value="usageCount-desc">Kullanım (Çok → Az)</option>
                        <option value="usageCount-asc">Kullanım (Az → Çok)</option>
                        <option value="name-asc">İsim (A → Z)</option>
                        <option value="name-desc">İsim (Z → A)</option>
                    </select>
                </div>
            </div>
            
            <div class="border-t border-b border-gray-200 py-4">
                <div class="flex mb-4">
                    <input type="text" id="newTagInput" placeholder="Yeni etiket ekle" class="flex-1 p-2 border border-gray-300 rounded-l-md">
                    <input type="color" id="newTagColor" value="#3B82F6" class="h-full w-12 border-y border-r border-gray-300">
                    <button id="addNewTagBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="bg-gray-50 p-3 rounded-md mb-4">
                    <p class="text-sm text-gray-600">
                        <i data-lucide="info" class="w-4 h-4 inline-block align-text-bottom mr-1"></i>
                        Etiketler işlemleri kategorilerden bağımsız olarak gruplandırmanıza yardımcı olur.
                    </p>
                </div>
                
                <div id="tagStatsContainer" class="space-y-3">
                    ${this.generateTagStatsHTML(tagStats)}
                </div>
            </div>
            
            <div class="flex justify-end mt-4">
                <button id="closeTagModal" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
                    Kapat
                </button>
            </div>
        </div>
        `;
        
        // Modal oluştur
        const modal = createModal('Etiket Yönetimi', modalHTML);
        
        // İkonları yükle
        lucide.createIcons();
        
        // Olay dinleyicileri ekle
        document.getElementById('closeTagModal').addEventListener('click', () => {
            document.getElementById('modalContainer').innerHTML = '';
        });
        
        // Etiket ekleme
        document.getElementById('addNewTagBtn').addEventListener('click', () => {
            const tagName = document.getElementById('newTagInput').value.trim();
            const tagColor = document.getElementById('newTagColor').value;
            
            if (tagName) {
                dataManager.addTag(tagName, tagColor);
                document.getElementById('newTagInput').value = '';
                this.refreshTagManagerModal();
                
                // Etiket filtresini güncelle
                this.updateTagFilterOptions();
            }
        });
        
        // Enter tuşu ile ekleme
        document.getElementById('newTagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addNewTagBtn').click();
            }
        });
        
        // Sıralama değişikliği
        document.getElementById('tagSortSelect').addEventListener('change', (e) => {
            this.refreshTagManagerModal();
        });
        
        // Etiket düzenleme/silme butonları
        document.querySelectorAll('.edit-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tagId = e.currentTarget.dataset.tagId;
                this.showEditTagModal(tagId);
            });
        });
        
        document.querySelectorAll('.delete-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tagId = e.currentTarget.dataset.tagId;
                const tagName = e.currentTarget.dataset.tagName;
                
                if (confirm(`"${tagName}" etiketini silmek istediğinizden emin misiniz?\nBu işlem, etiketi kullanan tüm işlemlerden etiketi kaldıracaktır.`)) {
                    if (dataManager.deleteTag(tagId)) {
                        this.refreshTagManagerModal();
                        this.updateTagFilterOptions();
                        this.refreshTable(); // Tabloyu yenile, silinen etiket varsa gösterimi güncelle
                    }
                }
            });
        });
    }
    
    /**
     * Etiket yönetimi modalını yenile
     */
    refreshTagManagerModal() {
        const sortSelect = document.getElementById('tagSortSelect');
        const sortValue = sortSelect ? sortSelect.value : 'usageCount-desc';
        
        // Sıralama seçeneklerini ayırma
        const [sortBy, sortOrder] = sortValue.split('-');
        
        // Etiket istatistiklerini al
        const tagStats = dataManager.getTagStats();
        
        // Sıralama uygula
        const sortedStats = this.sortTagStats(tagStats, sortBy, sortOrder);
        
        // HTML güncelle
        const container = document.getElementById('tagStatsContainer');
        if (container) {
            container.innerHTML = this.generateTagStatsHTML(sortedStats);
            
            // Düğme işlevlerini yeniden ekle
            document.querySelectorAll('.edit-tag-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tagId = e.currentTarget.dataset.tagId;
                    this.showEditTagModal(tagId);
                });
            });
            
            document.querySelectorAll('.delete-tag-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tagId = e.currentTarget.dataset.tagId;
                    const tagName = e.currentTarget.dataset.tagName;
                    
                    if (confirm(`"${tagName}" etiketini silmek istediğinizden emin misiniz?\nBu işlem, etiketi kullanan tüm işlemlerden etiketi kaldıracaktır.`)) {
                        if (dataManager.deleteTag(tagId)) {
                            this.refreshTagManagerModal();
                            this.updateTagFilterOptions();
                            this.refreshTable(); // Tabloyu yenile, silinen etiket varsa gösterimi güncelle
                            chartManager.updateCharts(); // Dashboard grafiklerini güncelle
                        }
                    }
                });
            });
            
            // İkonları yükle
            lucide.createIcons();
        }
    }
    
    /**
     * Etiket istatistiklerini sırala
     */
    sortTagStats(stats, sortBy = 'usageCount', sortOrder = 'desc') {
        return [...stats].sort((a, b) => {
            let result;
            
            switch (sortBy) {
                case 'name':
                    result = a.tagName.localeCompare(b.tagName);
                    break;
                case 'usageCount':
                    result = a.transactionCount - b.transactionCount;
                    break;
                default:
                    result = 0;
            }
            
            return sortOrder === 'desc' ? -result : result;
        });
    }
    
    /**
     * Etiket istatistikleri HTML'i oluştur
     */
    generateTagStatsHTML(tagStats) {
        if (!tagStats || tagStats.length === 0) {
            return '<p class="text-gray-400 text-center py-4">Henüz etiket bulunmuyor.</p>';
        }
        
        return tagStats.map(tag => {
            // Kullanım yüzdesini hesapla (max 100)
            const maxUsage = Math.max(...tagStats.map(t => t.transactionCount));
            const usagePercentage = maxUsage > 0 ? (tag.transactionCount / maxUsage) * 100 : 0;
            
            return `
            <div class="tag-stat-item bg-white border border-gray-200 rounded-md p-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                        <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${tag.tagColor};"></div>
                        <span class="font-medium">${escapeHtml(tag.tagName)}</span>
                    </div>
                    <div class="flex space-x-1">
                        <button class="edit-tag-btn text-blue-600 hover:text-blue-800 p-1" 
                                data-tag-id="${tag.tagId}" data-tag-name="${escapeHtml(tag.tagName)}">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button class="delete-tag-btn text-red-600 hover:text-red-800 p-1" 
                                data-tag-id="${tag.tagId}" data-tag-name="${escapeHtml(tag.tagName)}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                
                <div class="text-sm text-gray-500 mb-2">
                    ${tag.transactionCount} işlemde kullanıldı
                </div>
                
                <div class="flex text-sm justify-between space-x-4">
                    <div class="w-1/2">
                        <span class="text-green-600">${formatCurrency(tag.incomeAmount)}</span> gelir
                    </div>
                    <div class="w-1/2">
                        <span class="text-red-600">${formatCurrency(tag.expenseAmount)}</span> gider
                    </div>
                </div>
                
                <div class="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full" style="width: ${usagePercentage}%;"></div>
                </div>
            </div>
            `;
        }).join('');
    }
    
    /**
     * Etiket düzenleme modalını göster
     */
    showEditTagModal(tagId) {
        const tags = dataManager.getTags();
        const tag = tags.find(t => t.id === tagId);
        
        if (!tag) return;
        
        const modalHTML = `
        <div class="space-y-4">
            <div class="form-group">
                <label for="editTagName" class="block text-sm font-medium text-gray-700 mb-1">Etiket Adı</label>
                <input type="text" id="editTagName" value="${escapeHtml(tag.name)}" 
                       class="w-full p-2 border border-gray-300 rounded-md">
            </div>
            
            <div class="form-group">
                <label for="editTagColor" class="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                <div class="flex items-center space-x-2">
                    <input type="color" id="editTagColor" value="${tag.color}" 
                           class="h-10 w-20 border border-gray-300">
                    <span id="colorPreview" class="text-sm">${tag.color}</span>
                </div>
            </div>
            
            <div class="text-sm text-gray-500">
                Bu etiket ${tag.usageCount} işlemde kullanılıyor.
            </div>
        </div>
        `;
        
        const modal = createModal('Etiketi Düzenle', modalHTML, [
            {
                text: 'İptal',
                class: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
                onclick: 'document.getElementById("modalContainer").innerHTML = "";'
            },
            {
                text: 'Kaydet',
                class: 'bg-blue-500 hover:bg-blue-600 text-white ml-2',
                onclick: `tableManager.saveTagEdit('${tagId}')`
            }
        ]);
        
        // Renk değişikliğini göster
        document.getElementById('editTagColor').addEventListener('input', (e) => {
            document.getElementById('colorPreview').textContent = e.target.value;
        });
    }
    
    /**
     * Etiket düzenlemesini kaydet
     */
    saveTagEdit(tagId) {
        const name = document.getElementById('editTagName').value.trim();
        const color = document.getElementById('editTagColor').value;
        
        if (!name) {
            showToast('Etiket adı boş olamaz!', 'error');
            return;
        }
        
        const updated = dataManager.updateTag(tagId, { name, color });
        
        if (updated) {
            document.getElementById('modalContainer').innerHTML = '';
            this.refreshTagManagerModal();
            this.updateTagFilterOptions();
            this.refreshTable();
            chartManager.updateCharts(); // Dashboard grafiklerini güncelle
        }
    }
    
    /**
     * Etiket filtre seçeneklerini güncelle
     */
    async updateTagFilterOptions() {
        const tagFilter = document.getElementById('tagFilter');
        if (!tagFilter) return;
        
        try {
            // Veriyi async olarak çek
            const tags = await dataManager.getTags({ sortBy: 'usageCount', sortOrder: 'desc' });
            
            // Null veya undefined ise boş dizi kullan
            const safeTags = Array.isArray(tags) ? tags : [];
            
            // Mevcut seçimi koru
            const currentValue = tagFilter.value;
            
            // Seçenekleri güncelle
            tagFilter.innerHTML = '<option value="all">Tümü</option>';
            
            safeTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.name;
                option.textContent = tag.name;
                tagFilter.appendChild(option);
            });
            
            // Mevcut seçimi geri yükle (varsa)
            if (currentValue && safeTags.some(t => t.name === currentValue)) {
                tagFilter.value = currentValue;
            }
        } catch (error) {
            console.error('Etiket seçenekleri güncellenirken hata:', error);
        }
    }
}

// Global instance
const tableManager = new TableManager();