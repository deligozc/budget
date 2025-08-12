// js/categoryManager.js - Kategori Yönetimi

class CategoryManager {
    constructor() {
        this.icons = [
            'briefcase', 'trending-up', 'dollar-sign', 'credit-card', 'piggy-bank',
            'shopping-cart', 'car', 'home', 'utensils', 'coffee',
            'book', 'heart', 'phone', 'monitor', 'shirt',
            'plane', 'fuel', 'zap', 'wifi', 'gamepad',
            'music', 'camera', 'gift', 'star', 'umbrella'
        ];
        this.initializeEventListeners();
    }

    /**
     * Event listener'ları başlat
     */
    initializeEventListeners() {
        // Kategori ekleme butonları
        document.getElementById('addIncomeCategory')?.addEventListener('click', () => {
            this.showCategoryModal('income');
        });

        document.getElementById('addExpenseCategory')?.addEventListener('click', () => {
            this.showCategoryModal('expense');
        });

        // Hesap ekleme butonu
        document.getElementById('addAccount')?.addEventListener('click', () => {
            this.showAccountModal();
        });
    }

    /**
     * Kategorileri listele
     */
    async renderCategories() {
        try {
            await Promise.all([
                this.renderCategoryList('income'),
                this.renderCategoryList('expense'),
                this.renderAccounts(),
                this.updateFilterOptions()
            ]);
        } catch (error) {
            console.error('Kategoriler render edilirken hata:', error);
        }
    }

    /**
         * Kategori listesi render et
         */
    async renderCategoryList(type) {
        const container = document.getElementById(`${type}CategoriesList`);
        if (!container) return;

        try {
            const categories = await dataManager.getCategories(type) || [];
            
            // Dizi kontrolü yap
            if (!Array.isArray(categories)) {
                container.innerHTML = '<p class="text-red-500">Kategori verileri yüklenemedi</p>';
                return;
            }
            
                container.innerHTML = categories.map(category => `
                <div class="category-item">
                    <div class="category-header">
                        <div class="category-info">
                            <div class="category-icon" style="background-color: ${category.color}20; border-color: ${category.color};">
                                <i data-lucide="${category.icon}" class="w-5 h-5" style="color: ${category.color};"></i>
                            </div>
                            <div class="category-details">
                                <div class="category-name">${escapeHtml(category.name)}</div>
                                <div class="category-stats">
                                    <div class="category-stat">
                                        <i data-lucide="folder" class="w-3 h-3"></i>
                                        <span>${category.subcategories && Array.isArray(category.subcategories) ? category.subcategories.length : 0} alt kategori</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="category-actions">
                            <button onclick="categoryManager.showSubcategoryModal('${category.id}')" 
                                    class="category-action-btn add" title="Alt Kategori Ekle">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                            </button>
                            <button onclick="categoryManager.editCategory('${category.id}')" 
                                    class="category-action-btn edit" title="Düzenle">
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button onclick="categoryManager.deleteCategory('${category.id}')" 
                                    class="category-action-btn delete" title="Sil">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    
                    ${category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0 ? `
                        <div class="subcategories">
                            <div class="subcategories-header">Alt Kategoriler</div>
                            <div class="subcategory-list">
                                ${category.subcategories.map(sub => `
                                    <div class="subcategory-item">
                                        <div class="subcategory-color" style="background-color: ${sub.color};"></div>
                                        <span class="subcategory-name">${escapeHtml(sub.name)}</span>
                                        <button onclick="categoryManager.deleteSubcategory('${category.id}', '${sub.id}')" 
                                                class="subcategory-remove" title="Sil">
                                            <i data-lucide="x" class="w-3 h-3"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('');

            // İkonları yeniden başlat
            lucide.createIcons();
        } catch (error) {
            console.error(`${type} kategorileri render edilirken hata:`, error);
            container.innerHTML = `<p class="text-red-500">Kategori listesi yüklenirken hata oluştu</p>`;
        }
    }

    /**
     * Hesapları render et
     */
    async renderAccounts() {
        const container = document.getElementById('accountsList');
        if (!container) return;

        try {
            const accounts = await dataManager.getAccounts() || [];
            
            // Dizi kontrolü
            if (!Array.isArray(accounts)) {
                container.innerHTML = '<p class="text-red-500">Hesap verileri yüklenemedi</p>';
                return;
            }
            
            container.innerHTML = accounts.map(account => `
            <div class="account-item bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center" 
                             style="background-color: ${account.color}20; border: 2px solid ${account.color};">
                            <i data-lucide="${this.getAccountIcon(account.type)}" class="w-5 h-5" style="color: ${account.color};"></i>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900">${escapeHtml(account.name)}</h4>
                            <p class="text-sm text-gray-600">${this.getAccountTypeText(account.type)}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="categoryManager.editAccount('${account.id}')" 
                                class="text-gray-600 hover:text-gray-800 p-1">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="categoryManager.deleteAccount('${account.id}')" 
                                class="text-red-600 hover:text-red-800 p-1">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(account.balance)}
                    </p>
                    <button onclick="categoryManager.showAccountReport('${account.id}')" 
                            class="text-sm text-blue-600 hover:text-blue-800 mt-1">
                        Rapor Görüntüle
                    </button>
                </div>
            </div>
        `).join('');

            // İkonları yeniden başlat
            lucide.createIcons();
        } catch (error) {
            console.error('Hesaplar render edilirken hata:', error);
            container.innerHTML = '<p class="text-red-500">Hesap listesi yüklenirken hata oluştu</p>';
        }
    }

    /**
     * Filtre seçeneklerini güncelle
     */
    async updateFilterOptions() {
        try {
            const categoryFilter = document.getElementById('categoryFilter');
            const accountFilter = document.getElementById('accountFilter');
            
            if (categoryFilter) {
                const categories = await dataManager.getCategories();
                
                if (categories && typeof categories === 'object') {
                    categoryFilter.innerHTML = '<option value="all">Tümü</option>';
                    
                    ['income', 'expense'].forEach(type => {
                        if (Array.isArray(categories[type])) {
                            categories[type].forEach(category => {
                                const option = document.createElement('option');
                                option.value = category.id;
                                option.textContent = `${category.name} (${type === 'income' ? 'Gelir' : 'Gider'})`;
                                categoryFilter.appendChild(option);
                            });
                        }
                    });
                }
            }

            if (accountFilter) {
                const accounts = await dataManager.getAccounts();
                
                if (Array.isArray(accounts)) {
                    accountFilter.innerHTML = '<option value="all">Tümü</option>';
                    
                    accounts.forEach(account => {
                        const option = document.createElement('option');
                        option.value = account.id;
                        option.textContent = account.name;
                        accountFilter.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Filtre seçenekleri güncellenirken hata:', error);
        }
    }

    /**
     * Kategori modal'ını göster
     */
    showCategoryModal(type, categoryId = null) {
        const isEdit = !!categoryId;
        const category = isEdit ? this.findCategoryById(categoryId) : null;

        const modal = createModal(
            isEdit ? 'Kategori Düzenle' : 'Yeni Kategori',
            `
            <form id="categoryForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Kategori Adı</label>
                    <input type="text" id="categoryName" value="${category ? escapeHtml(category.name) : ''}" 
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                           placeholder="Kategori adını girin" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                    <div class="flex flex-wrap gap-2">
                        ${this.generateColorOptions(category?.color)}
                    </div>
                    <input type="color" id="customColor" class="mt-2 w-full h-10 border border-gray-300 rounded-lg cursor-pointer">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">İkon</label>
                    <div class="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                        ${this.generateIconOptions(category?.icon)}
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
                    text: isEdit ? 'Güncelle' : 'Ekle',
                    class: 'bg-teal-500 hover:bg-teal-600 text-white',
                    onclick: `categoryManager.${isEdit ? 'updateCategory' : 'addCategory'}('${type}', ${isEdit ? `'${categoryId}'` : 'null'})`
                }
            ]
        );

        // Renk seçimi event listener'ları
        modal.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                modal.querySelectorAll('.color-option').forEach(o => o.classList.remove('ring-2', 'ring-gray-400'));
                e.target.classList.add('ring-2', 'ring-gray-400');
            });
        });

        // İkon seçimi event listener'ları
        modal.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', (e) => {
                modal.querySelectorAll('.icon-option').forEach(o => o.classList.remove('bg-teal-500', 'text-white'));
                e.target.classList.add('bg-teal-500', 'text-white');
            });
        });

        // Custom color event listener
        modal.querySelector('#customColor').addEventListener('change', (e) => {
            modal.querySelectorAll('.color-option').forEach(o => o.classList.remove('ring-2', 'ring-gray-400'));
        });

        lucide.createIcons();
    }

    /**
     * Alt kategori modal'ını göster
     */
    showSubcategoryModal(categoryId) {
        const modalContainer = document.getElementById('modalContainer');
        
        // Basit modal HTML'i oluştur
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Alt Kategori Ekle</h3>
                        <button id="closeSubcategoryModal" class="text-gray-400 hover:text-gray-600 p-1">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form id="subcategoryForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Alt Kategori Adı</label>
                                <input type="text" id="subcategoryName" 
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                       placeholder="Alt kategori adını girin" required>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                                <div class="flex flex-wrap gap-2" id="colorOptions">
                                    ${this.generateColorOptions()}
                                </div>
                                <input type="color" id="customColor" class="mt-2 w-full h-10 border border-gray-300 rounded-lg cursor-pointer">
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-actions flex justify-end mt-6" style="gap: 12px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                        <button id="cancelSubcategoryBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                            İptal
                        </button>
                        <button id="saveSubcategoryBtn" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                            Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modalContainer.innerHTML = modalHTML;
        
        // Event listener'ları ekle
        const modal = modalContainer.querySelector('.modal-overlay');
        const closeBtn = document.getElementById('closeSubcategoryModal');
        const cancelBtn = document.getElementById('cancelSubcategoryBtn');
        const saveBtn = document.getElementById('saveSubcategoryBtn');
        const nameInput = document.getElementById('subcategoryName');
        const form = document.getElementById('subcategoryForm');
        
        // Close handlers
        const closeModal = () => {
            modalContainer.innerHTML = '';
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Save handler
        const saveSubcategory = () => {
            this.addSubcategory(categoryId);
        };
        
        saveBtn.addEventListener('click', saveSubcategory);
        
        // Form submit handler
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSubcategory();
        });
        
        // Enter key handler
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveSubcategory();
            }
        });
        
        // Color selection handlers
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // Önceki seçimi temizle
                document.querySelectorAll('.color-option').forEach(o => {
                    o.classList.remove('ring-2', 'ring-gray-400');
                    o.style.boxShadow = '';
                });
                
                // Yeni seçimi işaretle
                e.target.classList.add('ring-2', 'ring-gray-400');
                e.target.style.boxShadow = '0 0 0 2px #9CA3AF';
            });
        });
        
        // Custom color handler
        document.getElementById('customColor').addEventListener('change', () => {
            document.querySelectorAll('.color-option').forEach(o => {
                o.classList.remove('ring-2', 'ring-gray-400');
                o.style.boxShadow = '';
            });
        });
        
        // Initialize icons
        lucide.createIcons();
        
        // Focus on name input
        setTimeout(() => {
            nameInput.focus();
        }, 100);
        
        console.log('Alt kategori modal\'ı açıldı, categoryId:', categoryId);
    }

    /**
     * Hesap modal'ını göster
     */
    showAccountModal(accountId = null) {
        const isEdit = !!accountId;
        const account = isEdit ? dataManager.getAccounts().find(a => a.id === accountId) : null;

        const modal = createModal(
            isEdit ? 'Hesap Düzenle' : 'Yeni Hesap',
            `
            <form id="accountForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Hesap Adı</label>
                    <input type="text" id="accountName" value="${account ? escapeHtml(account.name) : ''}" 
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                           placeholder="Hesap adını girin" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Hesap Türü</label>
                    <select id="accountType" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                        <option value="cash" ${account?.type === 'cash' ? 'selected' : ''}>Nakit</option>
                        <option value="bank" ${account?.type === 'bank' ? 'selected' : ''}>Banka Hesabı</option>
                        <option value="credit" ${account?.type === 'credit' ? 'selected' : ''}>Kredi Kartı</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Başlangıç Bakiyesi</label>
                    <input type="number" id="accountBalance" value="${account ? account.balance : 0}" step="0.01"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                           placeholder="0.00">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                    <div class="flex flex-wrap gap-2">
                        ${this.generateColorOptions(account?.color)}
                    </div>
                    <input type="color" id="customColor" class="mt-2 w-full h-10 border border-gray-300 rounded-lg cursor-pointer">
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
                    onclick: `categoryManager.${isEdit ? 'updateAccount' : 'addAccount'}(${isEdit ? `'${accountId}'` : 'null'})`
                }
            ]
        );

        // Renk seçimi event listener'ları
        modal.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                modal.querySelectorAll('.color-option').forEach(o => o.classList.remove('ring-2', 'ring-gray-400'));
                e.target.classList.add('ring-2', 'ring-gray-400');
            });
        });
    }

    /**
     * Kategori ekle
     */
    addCategory(type, categoryId) {
        const form = document.getElementById('categoryForm');
        const name = document.getElementById('categoryName').value.trim();
        const selectedColor = document.querySelector('.color-option.ring-2')?.style.backgroundColor || 
                            document.getElementById('customColor').value;
        const selectedIcon = document.querySelector('.icon-option.bg-teal-500')?.dataset.icon || 'folder';

        if (!name) {
            showToast('Kategori adı gereklidir!', 'error');
            return;
        }

        const categoryData = {
            name,
            type,
            color: this.rgbToHex(selectedColor) || generateColor(),
            icon: selectedIcon
        };

        if (dataManager.addCategory(categoryData)) {
            this.renderCategories();
            document.getElementById('modalContainer').innerHTML = '';
            
            // Dashboard grafiklerini güncelle
            chartManager.updateCharts();
        }
    }

    /**
     * Kategori güncelle
     */
    updateCategory(type, categoryId) {
        const name = document.getElementById('categoryName').value.trim();
        const selectedColor = document.querySelector('.color-option.ring-2')?.style.backgroundColor || 
                            document.getElementById('customColor').value;
        const selectedIcon = document.querySelector('.icon-option.bg-teal-500')?.dataset.icon || 'folder';

        if (!name) {
            showToast('Kategori adı gereklidir!', 'error');
            return;
        }

        const updates = {
            name,
            color: this.rgbToHex(selectedColor) || generateColor(),
            icon: selectedIcon
        };

        if (dataManager.updateCategory(categoryId, updates)) {
            this.renderCategories();
            document.getElementById('modalContainer').innerHTML = '';
            
            // Dashboard grafiklerini güncelle
            chartManager.updateCharts();
        }
    }

    /**
     * Alt kategori ekle
     */
    addSubcategory(categoryId) {
        const name = document.getElementById('subcategoryName')?.value?.trim();
        
        if (!name) {
            showToast('Alt kategori adı gereklidir!', 'error');
            return;
        }

        // Seçili rengi al
        const selectedColorElement = document.querySelector('.color-option.ring-2');
        const customColor = document.getElementById('customColor')?.value;
        
        let selectedColor;
        if (selectedColorElement) {
            selectedColor = this.rgbToHex(selectedColorElement.style.backgroundColor);
        } else if (customColor) {
            selectedColor = customColor;
        } else {
            selectedColor = generateColor();
        }

        const subcategoryData = {
            name,
            color: selectedColor
        };

        console.log('Alt kategori ekleniyor:', subcategoryData, 'Kategori ID:', categoryId);

        if (dataManager.addSubcategory(categoryId, subcategoryData)) {
            this.renderCategories();
            document.getElementById('modalContainer').innerHTML = '';
            showToast('Alt kategori başarıyla eklendi!', 'success');
        } else {
            showToast('Alt kategori eklenirken hata oluştu!', 'error');
        }
    }

    /**
     * Hesap ekle
     */
    addAccount(accountId) {
        const form = document.getElementById('accountForm');
        const name = document.getElementById('accountName').value.trim();
        const type = document.getElementById('accountType').value;
        const balance = parseFloat(document.getElementById('accountBalance').value) || 0;
        const selectedColor = document.querySelector('.color-option.ring-2')?.style.backgroundColor || 
                            document.getElementById('customColor').value;

        if (!name) {
            showToast('Hesap adı gereklidir!', 'error');
            return;
        }

        const accountData = {
            name,
            type,
            balance,
            color: this.rgbToHex(selectedColor) || generateColor()
        };

        if (dataManager.addAccount(accountData)) {
            this.renderCategories();
            document.getElementById('modalContainer').innerHTML = '';
        }
    }

    /**
     * Kategori düzenle
     */
    editCategory(categoryId) {
        const category = this.findCategoryById(categoryId);
        if (category) {
            this.showCategoryModal(category.type, categoryId);
        }
    }

    /**
     * Hesap düzenle
     */
    editAccount(accountId) {
        this.showAccountModal(accountId);
    }

    /**
     * Kategori sil
     */
    deleteCategory(categoryId) {
        if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            if (dataManager.deleteCategory(categoryId)) {
                this.renderCategories();
                
                // Dashboard grafiklerini güncelle
                chartManager.updateCharts();
            }
        }
    }

    /**
     * Alt kategori sil
     */
    deleteSubcategory(categoryId, subcategoryId) {
        if (confirm('Bu alt kategoriyi silmek istediğinizden emin misiniz?')) {
            // Alt kategori silme işlemi dataManager'a eklenmelidir
            // Şimdilik ana kategoriden sil
            const data = dataManager.getData();
            let found = false;

            for (const type in data.categories) {
                const category = data.categories[type].find(c => c.id === categoryId);
                if (category) {
                    const subIndex = category.subcategories.findIndex(s => s.id === subcategoryId);
                    if (subIndex !== -1) {
                        category.subcategories.splice(subIndex, 1);
                        found = true;
                        break;
                    }
                }
            }

            if (found && dataManager.saveData(data)) {
                this.renderCategories();
                showToast('Alt kategori silindi!', 'success');
                
                // Dashboard grafiklerini güncelle
                chartManager.updateCharts();
            }
        }
    }

    /**
     * Hesap sil
     */
    deleteAccount(accountId) {
        if (confirm('Bu hesabı silmek istediğinizden emin misiniz?')) {
            // Hesabın kullanılıp kullanılmadığını kontrol et
            const transactions = dataManager.getTransactions({ accountId });
            if (transactions.length > 0) {
                showToast('Bu hesap işlemlerde kullanılıyor, silinemez!', 'error');
                return;
            }

            const data = dataManager.getData();
            const accountIndex = data.accounts.findIndex(a => a.id === accountId);
            
            if (accountIndex !== -1) {
                data.accounts.splice(accountIndex, 1);
                if (dataManager.saveData(data)) {
                    this.renderCategories();
                    showToast('Hesap silindi!', 'success');
                }
            }
        }
    }

    /**
     * Hesap raporu göster
     */
    showAccountReport(accountId) {
        const account = dataManager.getAccounts().find(a => a.id === accountId);
        if (!account) return;

        const transactions = dataManager.getTransactions({ accountId });
        const stats = dataManager.getSummaryStats({ accountId });

        const modal = createModal(
            `${account.name} - Hesap Raporu`,
            `
            <div class="space-y-6">
                <!-- Hesap Özeti -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-green-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600">Toplam Gelir</p>
                        <p class="text-xl font-bold text-green-600">${formatCurrency(stats.totalIncome)}</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600">Toplam Gider</p>
                        <p class="text-xl font-bold text-red-600">${formatCurrency(stats.totalExpense)}</p>
                    </div>
                </div>
                
                <!-- Güncel Bakiye -->
                <div class="bg-blue-50 p-4 rounded-lg text-center">
                    <p class="text-sm text-gray-600">Güncel Bakiye</p>
                    <p class="text-2xl font-bold ${account.balance >= 0 ? 'text-blue-600' : 'text-red-600'}">
                        ${formatCurrency(account.balance)}
                    </p>
                </div>
                
                <!-- Grafik Alanı -->
                <div id="accountChartContainer" class="h-64"></div>
                
                <!-- Son İşlemler -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-3">Son İşlemler</h4>
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                        ${transactions.slice(0, 5).map(t => `
                            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                    <p class="text-sm font-medium">${escapeHtml(t.description || 'İşlem')}</p>
                                    <p class="text-xs text-gray-500">${formatDate(t.date)}</p>
                                </div>
                                <span class="font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
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

        // Hesap grafiğini oluştur
        setTimeout(() => {
            chartManager.createAccountChart(accountId, 'accountChartContainer');
        }, 100);
    }

    /**
     * Yardımcı metodlar
     */
    findCategoryById(categoryId) {
        const categories = dataManager.getCategories();
        for (const type in categories) {
            const category = categories[type].find(c => c.id === categoryId);
            if (category) return category;
        }
        return null;
    }

    generateColorOptions(selectedColor = null) {
        const colors = [
            '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
            '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
            '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
            '#EC4899', '#F43F5E', '#64748B'
        ];

        return colors.map(color => `
            <div class="color-option w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-gray-400 ${selectedColor === color ? 'ring-2 ring-gray-400' : ''}" 
                 style="background-color: ${color};"
                 data-color="${color}"
                 title="${color}"></div>
        `).join('');
    }

    generateIconOptions(selectedIcon = null) {
        return this.icons.map(icon => `
            <button type="button" class="icon-option p-2 rounded-lg border border-gray-200 hover:border-gray-400 ${selectedIcon === icon ? 'bg-teal-500 text-white' : 'bg-white text-gray-600'}" 
                    data-icon="${icon}">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
            </button>
        `).join('');
    }

    getAccountIcon(type) {
        const icons = {
            cash: 'banknote',
            bank: 'building-2',
            credit: 'credit-card'
        };
        return icons[type] || 'wallet';
    }

    getAccountTypeText(type) {
        const types = {
            cash: 'Nakit',
            bank: 'Banka Hesabı',
            credit: 'Kredi Kartı'
        };
        return types[type] || type;
    }

    rgbToHex(rgb) {
        if (!rgb) return null;
        
        // Eğer zaten hex formatındaysa, olduğu gibi döndür
        if (rgb.startsWith('#')) return rgb;
        
        // RGB formatını parse et
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return null;
        
        return '#' + result.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
}

// Global instance
const categoryManager = new CategoryManager();