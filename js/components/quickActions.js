/**
 * Quick Actions Component
 * Implements enhanced floating action buttons and context-specific quick actions
 */

class QuickActions {
    constructor() {
        this.isMenuOpen = false;
        this.keyboardShortcuts = {
            'Ctrl+Q': this.showQuickTransaction.bind(this),
            'Ctrl+R': this.showQuickReport.bind(this),
            'Ctrl+H': this.showGoalTracker.bind(this),
            'Ctrl+S': this.showQuickSettings.bind(this),
            'Ctrl+E': this.showQuickShare.bind(this)
        };
    }

    /**
     * Initialize quick actions
     */
    initialize() {
        // Create FAB menu once DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.createFABMenu();
            this.addWidgetActions();
            this.setupKeyboardShortcuts();
            this.setupContextActions();
        });
    }

    /**
     * Create floating action button menu
     */
    createFABMenu() {
        // Create FAB container
        const fabContainer = document.createElement('div');
        fabContainer.className = 'fab-container';
        fabContainer.innerHTML = `
            <div class="fab-menu" id="fabMenu">
                <div class="fab-secondary transaction" data-action="transaction">
                    <i data-lucide="credit-card" class="w-5 h-5"></i>
                    <span class="fab-label">Hızlı İşlem</span>
                </div>
                <div class="fab-secondary report" data-action="report">
                    <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                    <span class="fab-label">Hızlı Rapor</span>
                </div>
                <div class="fab-secondary goal" data-action="goal">
                    <i data-lucide="target" class="w-5 h-5"></i>
                    <span class="fab-label">Hedef Takibi</span>
                </div>
                <div class="fab-secondary settings" data-action="settings">
                    <i data-lucide="settings" class="w-5 h-5"></i>
                    <span class="fab-label">Hızlı Ayarlar</span>
                </div>
                <div class="fab-secondary share" data-action="share">
                    <i data-lucide="share-2" class="w-5 h-5"></i>
                    <span class="fab-label">Hızlı Paylaşım</span>
                </div>
                <div class="fab-secondary chart purple" data-action="chart">
                    <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                    <span class="fab-label">Gelişmiş Grafikler</span>
                </div>
            </div>
            <div class="fab-primary" id="fabButton">
                <i data-lucide="plus" class="w-6 h-6" id="fabIcon"></i>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(fabContainer);

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(fabContainer);
        }

        // Add event listener for main FAB
        const fabButton = document.getElementById('fabButton');
        if (fabButton) {
            fabButton.addEventListener('click', () => {
                this.toggleFABMenu();
            });
        }

        // Add event listeners for secondary FABs
        const secondaryFabs = document.querySelectorAll('.fab-secondary');
        secondaryFabs.forEach(fab => {
            fab.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleFABAction(action);
            });
        });
    }

    /**
     * Toggle FAB menu open/close
     */
    toggleFABMenu() {
        const fabMenu = document.getElementById('fabMenu');
        const fabIcon = document.getElementById('fabIcon');
        
        if (!fabMenu || !fabIcon) return;
        
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            fabMenu.classList.add('active');
            
            // Change icon to X with rotation
            fabIcon.innerHTML = '';
            fabIcon.appendChild(lucide.createIcons({
                icons: { x: { toSvg: () => lucide.icons.x.toSvg({ class: 'w-6 h-6' }) } },
                nameAttr: 'data-lucide'
            }).querySelector('svg'));
            
            fabButton.style.transform = 'rotate(180deg)';
        } else {
            fabMenu.classList.remove('active');
            
            // Change icon back to plus
            fabIcon.innerHTML = '';
            fabIcon.appendChild(lucide.createIcons({
                icons: { plus: { toSvg: () => lucide.icons.plus.toSvg({ class: 'w-6 h-6' }) } },
                nameAttr: 'data-lucide'
            }).querySelector('svg'));
            
            fabButton.style.transform = 'rotate(0deg)';
        }
    }

    /**
     * Handle FAB action
     */
    handleFABAction(action) {
        console.log(`FAB action: ${action}`);
        
        // Close menu
        this.toggleFABMenu();
        
        // Handle action
        switch (action) {
            case 'transaction':
                this.showQuickTransaction();
                break;
            case 'report':
                this.showQuickReport();
                break;
            case 'goal':
                this.showGoalTracker();
                break;
            case 'settings':
                this.showQuickSettings();
                break;
            case 'share':
                this.showQuickShare();
                break;
            case 'chart':
                this.showAdvancedCharts();
                break;
        }
    }
    
    /**
     * Show advanced charts
     */
    showAdvancedCharts() {
        // Switch to dashboard tab if not already active
        if (typeof app !== 'undefined' && app.showTab) {
            app.showTab('dashboard');
        }
        
        // Scroll to advanced charts section
        setTimeout(() => {
            const advancedChartsSection = document.getElementById('advancedChartsSection');
            if (advancedChartsSection) {
                advancedChartsSection.scrollIntoView({ behavior: 'smooth' });
                
                // Highlight the section briefly
                advancedChartsSection.classList.add('highlight-section');
                setTimeout(() => {
                    advancedChartsSection.classList.remove('highlight-section');
                }, 1500);
                
                // Trigger chart load if placeholder is visible
                const placeholder = document.getElementById('advancedChartPlaceholder');
                if (placeholder && placeholder.style.display !== 'none') {
                    const loadBtn = document.getElementById('loadAdvancedChart');
                    if (loadBtn) loadBtn.click();
                }
            }
        }, 300);
    }

    /**
     * Show quick transaction modal
     */
    showQuickTransaction() {
        // Get recent categories and accounts for pre-filling
        Promise.all([
            dataManager.getCategories(),
            dataManager.getAccounts(),
            dataManager.getTransactions({ limit: 5 })
        ]).then(([categories, accounts, recentTransactions]) => {
            // Find most used category
            let mostUsedCategoryId = null;
            let mostUsedAccountId = null;
            
            if (recentTransactions && recentTransactions.length > 0) {
                // Count category usage
                const categoryCounts = {};
                const accountCounts = {};
                
                recentTransactions.forEach(t => {
                    if (t.categoryId) {
                        categoryCounts[t.categoryId] = (categoryCounts[t.categoryId] || 0) + 1;
                    }
                    if (t.accountId) {
                        accountCounts[t.accountId] = (accountCounts[t.accountId] || 0) + 1;
                    }
                });
                
                // Find most used
                let maxCategoryCount = 0;
                let maxAccountCount = 0;
                
                Object.entries(categoryCounts).forEach(([id, count]) => {
                    if (count > maxCategoryCount) {
                        maxCategoryCount = count;
                        mostUsedCategoryId = id;
                    }
                });
                
                Object.entries(accountCounts).forEach(([id, count]) => {
                    if (count > maxAccountCount) {
                        maxAccountCount = count;
                        mostUsedAccountId = id;
                    }
                });
            }
            
            // Create category options
            let categoryOptions = '';
            
            // Expense categories
            categoryOptions += '<optgroup label="Giderler">';
            if (categories && categories.expense) {
                categories.expense.forEach(category => {
                    const selected = category.id === mostUsedCategoryId ? 'selected' : '';
                    categoryOptions += `<option value="${category.id}" ${selected}>${category.name}</option>`;
                    
                    // Add subcategories
                    if (category.subcategories && category.subcategories.length > 0) {
                        category.subcategories.forEach(subcategory => {
                            categoryOptions += `<option value="${category.id}:${subcategory.id}">&nbsp;&nbsp;└ ${subcategory.name}</option>`;
                        });
                    }
                });
            }
            categoryOptions += '</optgroup>';
            
            // Income categories
            categoryOptions += '<optgroup label="Gelirler">';
            if (categories && categories.income) {
                categories.income.forEach(category => {
                    const selected = category.id === mostUsedCategoryId ? 'selected' : '';
                    categoryOptions += `<option value="${category.id}" ${selected}>${category.name}</option>`;
                    
                    // Add subcategories
                    if (category.subcategories && category.subcategories.length > 0) {
                        category.subcategories.forEach(subcategory => {
                            categoryOptions += `<option value="${category.id}:${subcategory.id}">&nbsp;&nbsp;└ ${subcategory.name}</option>`;
                        });
                    }
                });
            }
            categoryOptions += '</optgroup>';
            
            // Create account options
            let accountOptions = '';
            if (accounts) {
                accounts.forEach(account => {
                    const selected = account.id === mostUsedAccountId ? 'selected' : '';
                    accountOptions += `<option value="${account.id}" ${selected}>${account.name}</option>`;
                });
            }
            
            // Show modal
            createModal(
                'Hızlı İşlem Ekle',
                `
                <div class="space-y-4">
                    <div class="flex gap-4">
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">İşlem Tipi</label>
                            <div class="flex">
                                <label class="flex-1 inline-flex items-center bg-white border rounded-l-md px-3 py-2 cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="quickTransactionType" value="expense" class="mr-2" checked>
                                    <span>Gider</span>
                                </label>
                                <label class="flex-1 inline-flex items-center bg-white border-t border-b border-r rounded-r-md px-3 py-2 cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="quickTransactionType" value="income" class="mr-2">
                                    <span>Gelir</span>
                                </label>
                            </div>
                        </div>
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                            <input type="number" id="quickTransactionAmount" class="w-full p-2 border border-gray-300 rounded-md" placeholder="0.00" step="0.01">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <input type="text" id="quickTransactionDescription" class="w-full p-2 border border-gray-300 rounded-md" placeholder="İşlem açıklaması">
                    </div>
                    
                    <div class="flex gap-4">
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <select id="quickTransactionCategory" class="w-full p-2 border border-gray-300 rounded-md">
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Hesap</label>
                            <select id="quickTransactionAccount" class="w-full p-2 border border-gray-300 rounded-md">
                                ${accountOptions}
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex gap-4">
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                            <input type="date" id="quickTransactionDate" class="w-full p-2 border border-gray-300 rounded-md" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
                            <input type="text" id="quickTransactionTags" class="w-full p-2 border border-gray-300 rounded-md" placeholder="Etiketleri virgülle ayırın">
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
                        text: 'İşlemi Kaydet',
                        class: 'bg-blue-500 hover:bg-blue-600 text-white',
                        onclick: 'quickActions.saveQuickTransaction()'
                    }
                ]
            );
            
            // Set focus on amount field
            setTimeout(() => {
                document.getElementById('quickTransactionAmount')?.focus();
            }, 100);
            
        }).catch(error => {
            console.error('Error preparing quick transaction:', error);
            showToast('Hızlı işlem hazırlanırken hata oluştu', 'error');
        });
    }

    /**
     * Save quick transaction
     */
    saveQuickTransaction() {
        // Get form values
        const type = document.querySelector('input[name="quickTransactionType"]:checked')?.value;
        const amount = parseFloat(document.getElementById('quickTransactionAmount')?.value || '0');
        const description = document.getElementById('quickTransactionDescription')?.value || '';
        const categoryValue = document.getElementById('quickTransactionCategory')?.value || '';
        const accountId = document.getElementById('quickTransactionAccount')?.value || '';
        const date = document.getElementById('quickTransactionDate')?.value || new Date().toISOString().split('T')[0];
        const tagsInput = document.getElementById('quickTransactionTags')?.value || '';
        
        // Validate
        if (!amount || amount <= 0) {
            showToast('Lütfen geçerli bir tutar girin', 'error');
            return;
        }
        
        if (!accountId) {
            showToast('Lütfen bir hesap seçin', 'error');
            return;
        }
        
        // Parse category and subcategory
        let categoryId = categoryValue;
        let subcategoryId = null;
        
        if (categoryValue.includes(':')) {
            const parts = categoryValue.split(':');
            categoryId = parts[0];
            subcategoryId = parts[1];
        }
        
        // Parse tags
        const tags = tagsInput.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        // Create transaction object
        const transaction = {
            type: type || 'expense',
            amount: amount,
            description: description,
            categoryId: categoryId,
            subcategoryId: subcategoryId,
            accountId: accountId,
            date: date,
            tags: tags,
            status: 'actual'
        };
        
        // Save transaction
        dataManager.addTransaction(transaction).then(newTransaction => {
            // Close modal
            document.getElementById('modalContainer').innerHTML = '';
            
            // Show success message
            showToast('İşlem başarıyla kaydedildi', 'success');
            
            // Refresh charts and tables
            if (typeof chartManager !== 'undefined') {
                chartManager.updateCharts();
            }
            
            if (typeof app !== 'undefined') {
                app.updateRecentTransactions();
            }
            
            if (typeof tableManager !== 'undefined' && tableManager.table) {
                tableManager.refreshTable();
            }
        }).catch(error => {
            console.error('Error saving transaction:', error);
            showToast('İşlem kaydedilirken hata oluştu', 'error');
        });
    }

    /**
     * Show quick report
     */
    showQuickReport() {
        // Get current month data
        const monthRange = getCurrentMonthRange();
        const monthName = new Date().toLocaleDateString('tr-TR', { month: 'long' });
        
        Promise.all([
            dataManager.getSummaryStats(monthRange),
            dataManager.getCategoryStats('expense', monthRange),
            dataManager.getTransactions({ ...monthRange, limit: 5 })
        ]).then(([stats, categoryStats, recentTransactions]) => {
            // Create modal
            createModal(
                `${monthName} Özet Raporu`,
                `
                <div class="space-y-6">
                    <!-- Summary Stats -->
                    <div class="grid grid-cols-3 gap-4">
                        <div class="p-3 bg-blue-50 rounded-lg text-center">
                            <div class="text-sm text-blue-700 mb-1">Gelir</div>
                            <div class="font-bold text-blue-800">${formatCurrency(stats.totalIncome)}</div>
                        </div>
                        <div class="p-3 bg-red-50 rounded-lg text-center">
                            <div class="text-sm text-red-700 mb-1">Gider</div>
                            <div class="font-bold text-red-800">${formatCurrency(stats.totalExpense)}</div>
                        </div>
                        <div class="p-3 bg-green-50 rounded-lg text-center">
                            <div class="text-sm text-green-700 mb-1">Bakiye</div>
                            <div class="font-bold text-green-800">${formatCurrency(stats.netBalance)}</div>
                        </div>
                    </div>
                    
                    <!-- Top Categories -->
                    <div>
                        <h4 class="font-medium text-gray-900 mb-2">En Çok Harcama Yapılan Kategoriler</h4>
                        <div class="space-y-2">
                            ${categoryStats.slice(0, 5).map(cat => `
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${cat.categoryColor}"></div>
                                        <span class="text-sm">${cat.categoryName}</span>
                                    </div>
                                    <span class="text-sm font-medium">${formatCurrency(cat.amount)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Trend Summary -->
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">Trend Özeti</h4>
                        <p class="text-sm text-gray-700">
                            ${this.generateTrendSummary(stats)}
                        </p>
                    </div>
                    
                    <!-- Share Options -->
                    <div class="flex justify-between">
                        <button id="sharePdfBtn" class="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            <i data-lucide="file-text" class="w-4 h-4 mr-1"></i>
                            PDF
                        </button>
                        <button id="shareWhatsAppBtn" class="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            <i data-lucide="message-square" class="w-4 h-4 mr-1"></i>
                            WhatsApp
                        </button>
                        <button id="shareEmailBtn" class="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            <i data-lucide="mail" class="w-4 h-4 mr-1"></i>
                            E-posta
                        </button>
                    </div>
                </div>
                `,
                [
                    {
                        text: 'Kapat',
                        class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                        onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                    },
                    {
                        text: 'Detaylı Rapor',
                        class: 'bg-blue-500 hover:bg-blue-600 text-white',
                        onclick: 'quickActions.openDetailedReport()'
                    }
                ]
            );
            
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Setup share buttons
            document.getElementById('sharePdfBtn')?.addEventListener('click', () => {
                this.shareQuickReport('pdf', stats);
            });
            
            document.getElementById('shareWhatsAppBtn')?.addEventListener('click', () => {
                this.shareQuickReport('whatsapp', stats);
            });
            
            document.getElementById('shareEmailBtn')?.addEventListener('click', () => {
                this.shareQuickReport('email', stats);
            });
            
        }).catch(error => {
            console.error('Error generating quick report:', error);
            showToast('Rapor oluşturulurken hata oluştu', 'error');
        });
    }

    /**
     * Generate trend summary text
     */
    generateTrendSummary(stats) {
        const lastMonthRange = getLastMonthRange();
        
        return new Promise(resolve => {
            dataManager.getSummaryStats(lastMonthRange).then(lastMonthStats => {
                // Calculate changes
                const incomeChange = stats.totalIncome - lastMonthStats.totalIncome;
                const incomeChangePercent = lastMonthStats.totalIncome > 0 ? 
                    (incomeChange / lastMonthStats.totalIncome) * 100 : 0;
                    
                const expenseChange = stats.totalExpense - lastMonthStats.totalExpense;
                const expenseChangePercent = lastMonthStats.totalExpense > 0 ? 
                    (expenseChange / lastMonthStats.totalExpense) * 100 : 0;
                
                // Generate text
                let summary = '';
                
                if (incomeChange > 0) {
                    summary += `Bu ay gelirleriniz geçen aya göre %${Math.abs(incomeChangePercent).toFixed(1)} arttı. `;
                } else if (incomeChange < 0) {
                    summary += `Bu ay gelirleriniz geçen aya göre %${Math.abs(incomeChangePercent).toFixed(1)} azaldı. `;
                } else {
                    summary += `Bu ay gelirleriniz geçen ay ile aynı kaldı. `;
                }
                
                if (expenseChange > 0) {
                    summary += `Giderleriniz %${Math.abs(expenseChangePercent).toFixed(1)} arttı. `;
                } else if (expenseChange < 0) {
                    summary += `Giderleriniz %${Math.abs(expenseChangePercent).toFixed(1)} azaldı. `;
                } else {
                    summary += `Giderleriniz aynı kaldı. `;
                }
                
                if (stats.netBalance > 0) {
                    summary += `Bu ay ${formatCurrency(stats.netBalance)} tasarruf ettiniz.`;
                } else if (stats.netBalance < 0) {
                    summary += `Bu ay ${formatCurrency(Math.abs(stats.netBalance))} açık verdiniz.`;
                } else {
                    summary += `Bu ay gelir ve giderleriniz dengelendi.`;
                }
                
                resolve(summary);
            }).catch(error => {
                console.error('Error calculating trends:', error);
                resolve('Trend verileri hesaplanamadı.');
            });
        });
    }

    /**
     * Share quick report
     */
    shareQuickReport(method, stats) {
        const monthName = new Date().toLocaleDateString('tr-TR', { month: 'long' });
        const year = new Date().getFullYear();
        
        const summaryText = `${monthName} ${year} Mali Özeti:\n\n` +
            `Gelir: ${formatCurrency(stats.totalIncome)}\n` +
            `Gider: ${formatCurrency(stats.totalExpense)}\n` +
            `Bakiye: ${formatCurrency(stats.netBalance)}`;
        
        switch (method) {
            case 'pdf':
                showToast('PDF indirme başlatılıyor...', 'info');
                // In a real implementation, this would generate and download a PDF
                setTimeout(() => {
                    showToast('PDF indirme özelliği henüz geliştirme aşamasında', 'warning');
                }, 1000);
                break;
                
            case 'whatsapp':
                // Create WhatsApp share link
                const whatsappText = encodeURIComponent(summaryText);
                const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
                
                // Open in new tab
                window.open(whatsappUrl, '_blank');
                break;
                
            case 'email':
                // Create email link
                const subject = encodeURIComponent(`${monthName} ${year} Mali Özeti`);
                const body = encodeURIComponent(summaryText);
                const emailUrl = `mailto:?subject=${subject}&body=${body}`;
                
                // Open email client
                window.location.href = emailUrl;
                break;
        }
    }

    /**
     * Open detailed report
     */
    openDetailedReport() {
        // Close current modal
        document.getElementById('modalContainer').innerHTML = '';
        
        // Switch to reports tab
        if (typeof app !== 'undefined') {
            app.showTab('reports');
        }
    }

    /**
     * Show goal tracker
     */
    showGoalTracker() {
        // Get current month and year
        const monthName = new Date().toLocaleDateString('tr-TR', { month: 'long' });
        const year = new Date().getFullYear();
        
        // Get summary stats
        const yearRange = getCurrentYearRange();
        
        Promise.all([
            dataManager.getSummaryStats(yearRange),
            dataManager.getBudgetAnalysis(year)
        ]).then(([yearStats, budgetAnalysis]) => {
            // Calculate yearly goals
            const yearlyGoals = this.calculateYearlyGoals(yearStats, budgetAnalysis);
            
            // Create modal
            createModal(
                'Hedef Takibi',
                `
                <div class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 bg-blue-50 rounded-lg">
                            <h4 class="font-medium text-blue-800 mb-2">Yıllık Tasarruf Hedefi</h4>
                            <div class="text-xl font-bold text-blue-800 mb-2">${formatCurrency(yearlyGoals.savingsGoal)}</div>
                            <div class="relative h-3 bg-blue-100 rounded-full overflow-hidden">
                                <div class="absolute inset-y-0 left-0 bg-blue-600 rounded-full" style="width: ${yearlyGoals.savingsProgress}%"></div>
                            </div>
                            <div class="flex justify-between text-sm text-blue-600 mt-1">
                                <span>%${yearlyGoals.savingsProgress.toFixed(1)}</span>
                                <span>${formatCurrency(yearlyGoals.currentSavings)} / ${formatCurrency(yearlyGoals.savingsGoal)}</span>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-green-50 rounded-lg">
                            <h4 class="font-medium text-green-800 mb-2">Yıllık Gelir Hedefi</h4>
                            <div class="text-xl font-bold text-green-800 mb-2">${formatCurrency(yearlyGoals.incomeGoal)}</div>
                            <div class="relative h-3 bg-green-100 rounded-full overflow-hidden">
                                <div class="absolute inset-y-0 left-0 bg-green-600 rounded-full" style="width: ${yearlyGoals.incomeProgress}%"></div>
                            </div>
                            <div class="flex justify-between text-sm text-green-600 mt-1">
                                <span>%${yearlyGoals.incomeProgress.toFixed(1)}</span>
                                <span>${formatCurrency(yearStats.totalIncome)} / ${formatCurrency(yearlyGoals.incomeGoal)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">Günlük Hedefe Ulaşma Temposu</h4>
                        <div class="space-y-3">
                            <div>
                                <div class="flex justify-between text-sm">
                                    <span>Tasarruf için günlük:</span>
                                    <span class="font-medium">${formatCurrency(yearlyGoals.dailySavingsNeeded)}</span>
                                </div>
                                <div class="relative h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                                    <div class="absolute inset-y-0 left-0 bg-blue-500 rounded-full" 
                                         style="width: ${Math.min(100, yearlyGoals.savingsTempoPercentage)}%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm">
                                    <span>Gelir için günlük:</span>
                                    <span class="font-medium">${formatCurrency(yearlyGoals.dailyIncomeNeeded)}</span>
                                </div>
                                <div class="relative h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                                    <div class="absolute inset-y-0 left-0 bg-green-500 rounded-full" 
                                         style="width: ${Math.min(100, yearlyGoals.incomeTempoPercentage)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-4 bg-yellow-50 rounded-lg">
                        <h4 class="font-medium text-yellow-800 mb-2">Motivasyon</h4>
                        <p class="text-sm text-yellow-700">
                            ${yearlyGoals.motivationMessage}
                        </p>
                    </div>
                </div>
                `,
                [
                    {
                        text: 'Kapat',
                        class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                        onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                    },
                    {
                        text: 'Hedef Ayarla',
                        class: 'bg-blue-500 hover:bg-blue-600 text-white',
                        onclick: 'quickActions.showGoalSettings()'
                    }
                ]
            );
        }).catch(error => {
            console.error('Error loading goal data:', error);
            showToast('Hedef verileri yüklenirken hata oluştu', 'error');
        });
    }

    /**
     * Calculate yearly goals and progress
     */
    calculateYearlyGoals(yearStats, budgetAnalysis) {
        // Get current date info
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        
        // Calculate days
        const totalDays = Math.floor((endOfYear - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        const daysPassed = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        const daysRemaining = totalDays - daysPassed;
        
        // Extract actual values
        const currentIncome = yearStats.totalIncome || 0;
        const currentExpense = yearStats.totalExpense || 0;
        const currentSavings = currentIncome - currentExpense;
        
        // Calculate goals
        // In a real app, these would come from user settings
        // Here we'll estimate based on current pace and budget
        const projectedYearlyIncome = (currentIncome / daysPassed) * totalDays;
        const incomeGoal = Math.max(projectedYearlyIncome * 1.1, currentIncome * 1.2); // 10-20% higher than projection
        
        // For savings goal, use budget if available
        let savingsGoal = projectedYearlyIncome * 0.2; // Default: 20% of projected income
        
        if (budgetAnalysis && budgetAnalysis.length > 0) {
            // Use planned budget to calculate savings goal
            const totalPlannedExpense = budgetAnalysis.reduce((sum, item) => sum + item.plannedAmount, 0);
            const plannedMonthlySavings = projectedYearlyIncome / 12 - totalPlannedExpense;
            
            if (plannedMonthlySavings > 0) {
                savingsGoal = plannedMonthlySavings * 12;
            }
        }
        
        // Calculate progress percentages
        const incomeProgress = Math.min(100, (currentIncome / incomeGoal) * 100);
        const savingsProgress = currentSavings > 0 ? 
            Math.min(100, (currentSavings / savingsGoal) * 100) : 0;
        
        // Calculate daily needed amounts
        const dailySavingsNeeded = daysRemaining > 0 ? 
            (savingsGoal - currentSavings) / daysRemaining : 0;
        const dailyIncomeNeeded = daysRemaining > 0 ? 
            (incomeGoal - currentIncome) / daysRemaining : 0;
        
        // Calculate tempo percentages
        const expectedProgress = (daysPassed / totalDays) * 100;
        const savingsTempoPercentage = expectedProgress > 0 ? 
            (savingsProgress / expectedProgress) * 100 : 0;
        const incomeTempoPercentage = expectedProgress > 0 ? 
            (incomeProgress / expectedProgress) * 100 : 0;
        
        // Generate motivation message
        let motivationMessage = '';
        
        if (savingsProgress >= expectedProgress && incomeProgress >= expectedProgress) {
            motivationMessage = 'Mükemmel gidiyorsunuz! Hem tasarruf hem de gelir hedeflerinizin önündesiniz. Bu tempoyu koruyun!';
        } else if (savingsProgress >= expectedProgress) {
            motivationMessage = 'Tasarruf hedefinizde ileridesiniz. Gelir hedefinizi de yakalamak için biraz daha çaba gösterin.';
        } else if (incomeProgress >= expectedProgress) {
            motivationMessage = 'Gelir hedefinizde iyi ilerliyorsunuz. Harcamalarınızı biraz kısarak tasarruf hedefinizi de yakalayabilirsiniz.';
        } else {
            motivationMessage = 'Hedeflerinize ulaşmak için biraz daha gayret gerekiyor. Günlük temponuzu artırarak hedefe varabilirsiniz.';
        }
        
        // Add progress info
        motivationMessage += ` Şu ana kadar hedeflerinizin %${savingsProgress.toFixed(1)}'ine ulaştınız.`;
        
        return {
            savingsGoal,
            incomeGoal,
            currentSavings,
            savingsProgress,
            incomeProgress,
            dailySavingsNeeded,
            dailyIncomeNeeded,
            daysRemaining,
            savingsTempoPercentage,
            incomeTempoPercentage,
            motivationMessage
        };
    }

    /**
     * Show goal settings
     */
    showGoalSettings() {
        // Close current modal
        document.getElementById('modalContainer').innerHTML = '';
        
        // In a real implementation, this would show a form to set goals
        showToast('Hedef ayarları yakında eklenecek', 'info');
    }

    /**
     * Show quick settings
     */
    showQuickSettings() {
        Promise.all([
            dataManager.getCategories(),
            dataManager.getAccounts()
        ]).then(([categories, accounts]) => {
            // Create modal
            createModal(
                'Hızlı Ayarlar',
                `
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-900 mb-3">Kategori Ekle</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm text-gray-700 mb-1">Kategori Adı</label>
                                <input type="text" id="quickCategoryName" class="w-full p-2 border border-gray-300 rounded-md">
                            </div>
                            <div>
                                <label class="block text-sm text-gray-700 mb-1">Kategori Tipi</label>
                                <div class="flex">
                                    <label class="flex-1 inline-flex items-center bg-white border rounded-l-md px-3 py-2 cursor-pointer hover:bg-gray-50">
                                        <input type="radio" name="quickCategoryType" value="expense" class="mr-2" checked>
                                        <span>Gider</span>
                                    </label>
                                    <label class="flex-1 inline-flex items-center bg-white border-t border-b border-r rounded-r-md px-3 py-2 cursor-pointer hover:bg-gray-50">
                                        <input type="radio" name="quickCategoryType" value="income" class="mr-2">
                                        <span>Gelir</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm text-gray-700 mb-1">Renk</label>
                                <input type="color" id="quickCategoryColor" class="w-full p-0 h-10 border border-gray-300 rounded-md" value="#3B82F6">
                            </div>
                            <button id="addQuickCategoryBtn" class="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md">
                                Kategori Ekle
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-900 mb-3">Hesap Durumu</h4>
                        <div class="space-y-3">
                            ${accounts.map(account => `
                                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p class="font-medium">${account.name}</p>
                                        <p class="text-sm text-gray-500">${formatCurrency(account.balance)}</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer account-toggle" data-account-id="${account.id}" ${account.isActive ? 'checked' : ''}>
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            `).join('')}
                            
                            <h4 class="font-medium text-gray-900 mb-1 mt-4">Bildirim Ayarları</h4>
                            <div class="space-y-2">
                                <label class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span>Aylık özet bildirimleri</span>
                                    <div class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked>
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </label>
                                <label class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span>Bütçe aşım uyarıları</span>
                                    <div class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked>
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                `,
                [
                    {
                        text: 'Kapat',
                        class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                        onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                    },
                    {
                        text: 'Tüm Ayarlar',
                        class: 'bg-blue-500 hover:bg-blue-600 text-white',
                        onclick: 'quickActions.openAllSettings()'
                    }
                ]
            );
            
            // Setup add category button
            document.getElementById('addQuickCategoryBtn')?.addEventListener('click', () => {
                this.addQuickCategory();
            });
            
            // Setup account toggle switches
            document.querySelectorAll('.account-toggle').forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    this.toggleAccountStatus(e.target.dataset.accountId, e.target.checked);
                });
            });
            
        }).catch(error => {
            console.error('Error loading settings data:', error);
            showToast('Ayarlar yüklenirken hata oluştu', 'error');
        });
    }

    /**
     * Add quick category
     */
    addQuickCategory() {
        const name = document.getElementById('quickCategoryName')?.value;
        const type = document.querySelector('input[name="quickCategoryType"]:checked')?.value;
        const color = document.getElementById('quickCategoryColor')?.value;
        
        if (!name) {
            showToast('Lütfen kategori adı girin', 'error');
            return;
        }
        
        const category = {
            name,
            type: type || 'expense',
            color: color || '#3B82F6',
            icon: type === 'income' ? 'briefcase' : 'shopping-cart'
        };
        
        dataManager.addCategory(category).then(newCategory => {
            showToast('Kategori başarıyla eklendi', 'success');
            
            // Reset form
            document.getElementById('quickCategoryName').value = '';
            
            // Refresh category manager if available
            if (typeof categoryManager !== 'undefined') {
                categoryManager.renderCategories();
            }
        }).catch(error => {
            console.error('Error adding category:', error);
            showToast('Kategori eklenirken hata oluştu', 'error');
        });
    }

    /**
     * Toggle account status
     */
    toggleAccountStatus(accountId, isActive) {
        if (!accountId) return;
        
        // Get all accounts
        dataManager.getAccounts().then(accounts => {
            // Find the account
            const account = accounts.find(a => a.id === accountId);
            if (!account) {
                console.error('Account not found:', accountId);
                return;
            }
            
            // Update account
            account.isActive = isActive;
            
            // Save accounts
            const data = dataManager.getData();
            data.accounts = accounts;
            
            dataManager.saveData(data).then(() => {
                showToast(`${account.name} hesabı ${isActive ? 'aktif' : 'pasif'} yapıldı`, 'success');
            }).catch(error => {
                console.error('Error saving account status:', error);
                showToast('Hesap durumu güncellenirken hata oluştu', 'error');
            });
        }).catch(error => {
            console.error('Error loading accounts:', error);
            showToast('Hesaplar yüklenirken hata oluştu', 'error');
        });
    }

    /**
     * Open all settings
     */
    openAllSettings() {
        // Close current modal
        document.getElementById('modalContainer').innerHTML = '';
        
        // Show toast
        showToast('Tam ayarlar sayfası henüz geliştirme aşamasında', 'info');
    }

    /**
     * Show quick share
     */
    showQuickShare() {
        // Get current month data
        const monthRange = getCurrentMonthRange();
        const monthName = new Date().toLocaleDateString('tr-TR', { month: 'long' });
        
        dataManager.getSummaryStats(monthRange).then(stats => {
            // Create share text
            const shareText = `${monthName} ayında ${formatCurrency(stats.totalIncome)} kazandım, ${formatCurrency(stats.totalExpense)} harcadım ve ${formatCurrency(stats.netBalance)} ${stats.netBalance >= 0 ? 'tasarruf ettim' : 'açık verdim'}.`;
            
            // Create modal
            createModal(
                'Hızlı Paylaşım',
                `
                <div class="space-y-6">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <h4 class="font-medium text-gray-900 mb-2">Paylaşım Metni</h4>
                        <textarea id="shareText" class="w-full p-3 border border-gray-300 rounded-md min-h-20">${shareText}</textarea>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <button id="shareWhatsAppBtn" class="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                            <i data-lucide="message-square" class="w-8 h-8 text-green-600 mb-2"></i>
                            <span class="text-sm font-medium text-green-700">WhatsApp</span>
                        </button>
                        
                        <button id="shareTwitterBtn" class="flex flex-col items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                            <i data-lucide="twitter" class="w-8 h-8 text-blue-600 mb-2"></i>
                            <span class="text-sm font-medium text-blue-700">Twitter</span>
                        </button>
                        
                        <button id="shareEmailBtn" class="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                            <i data-lucide="mail" class="w-8 h-8 text-gray-600 mb-2"></i>
                            <span class="text-sm font-medium text-gray-700">E-posta</span>
                        </button>
                    </div>
                    
                    <div class="space-y-2">
                        <h4 class="font-medium text-gray-900 mb-2">Grafik Olarak Paylaş</h4>
                        <button id="sharePngBtn" class="w-full flex items-center justify-center p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100">
                            <i data-lucide="image" class="w-5 h-5 text-purple-600 mr-2"></i>
                            <span class="font-medium text-purple-700">Grafikleri PNG Olarak İndir</span>
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
            
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Setup share buttons
            document.getElementById('shareWhatsAppBtn')?.addEventListener('click', () => {
                this.shareContent('whatsapp', document.getElementById('shareText').value);
            });
            
            document.getElementById('shareTwitterBtn')?.addEventListener('click', () => {
                this.shareContent('twitter', document.getElementById('shareText').value);
            });
            
            document.getElementById('shareEmailBtn')?.addEventListener('click', () => {
                this.shareContent('email', document.getElementById('shareText').value);
            });
            
            document.getElementById('sharePngBtn')?.addEventListener('click', () => {
                this.shareChartImages();
            });
            
        }).catch(error => {
            console.error('Error loading share data:', error);
            showToast('Paylaşım verileri yüklenirken hata oluştu', 'error');
        });
    }

    /**
     * Share content using various methods
     */
    shareContent(method, text) {
        switch (method) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                break;
                
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                break;
                
            case 'email':
                window.location.href = `mailto:?subject=Bütçe Takibi&body=${encodeURIComponent(text)}`;
                break;
        }
    }

    /**
     * Share chart images
     */
    shareChartImages() {
        // Get charts
        const charts = [];
        
        if (chartManager && chartManager.charts) {
            if (chartManager.charts.monthly) {
                charts.push({
                    name: 'Aylık Genel Bakış',
                    chart: chartManager.charts.monthly
                });
            }
            
            if (chartManager.charts.category) {
                charts.push({
                    name: 'Kategori Dağılımı',
                    chart: chartManager.charts.category
                });
            }
        }
        
        if (charts.length === 0) {
            showToast('Paylaşılacak grafik bulunamadı', 'error');
            return;
        }
        
        // In a real implementation, we would:
        // 1. Convert each chart to PNG using canvas.toDataURL()
        // 2. Create a download link for each
        showToast('Grafik paylaşım özelliği henüz geliştirme aşamasında', 'warning');
    }

    /**
     * Add widget actions to dashboard cards
     */
    addWidgetActions() {
        // Add action buttons to stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            // Create actions container
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'widget-actions';
            actionsContainer.innerHTML = `
                <div class="widget-action-btn" data-action="details" title="Detaylar">
                    <i data-lucide="info" class="w-4 h-4"></i>
                </div>
                <div class="widget-action-btn" data-action="share" title="Paylaş">
                    <i data-lucide="share-2" class="w-4 h-4"></i>
                </div>
            `;
            
            // Add to card
            card.appendChild(actionsContainer);
            
            // Setup click event
            actionsContainer.querySelectorAll('.widget-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = e.currentTarget.dataset.action;
                    const cardId = card.id || card.dataset.type;
                    
                    this.handleWidgetAction(action, cardId, card);
                });
            });
        });
        
        // Add action buttons to chart cards
        document.querySelectorAll('.chart-card').forEach(card => {
            // Get chart header
            const chartHeader = card.querySelector('.chart-header');
            if (!chartHeader) return;
            
            // Create actions container
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'widget-actions';
            actionsContainer.innerHTML = `
                <div class="widget-action-btn" data-action="screenshot" title="Ekran Görüntüsü">
                    <i data-lucide="camera" class="w-4 h-4"></i>
                </div>
                <div class="widget-action-btn" data-action="zoom" title="Büyüt">
                    <i data-lucide="maximize-2" class="w-4 h-4"></i>
                </div>
                <div class="widget-action-btn" data-action="export" title="Dışa Aktar">
                    <i data-lucide="download" class="w-4 h-4"></i>
                </div>
            `;
            
            // Add to header
            chartHeader.appendChild(actionsContainer);
            
            // Setup click event
            actionsContainer.querySelectorAll('.widget-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = e.currentTarget.dataset.action;
                    const chartCanvas = card.querySelector('canvas');
                    const chartId = chartCanvas ? chartCanvas.id : null;
                    
                    this.handleChartAction(action, chartId, card);
                });
            });
        });
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Handle widget action
     */
    handleWidgetAction(action, cardId, cardElement) {
        console.log(`Widget action: ${action} on card ${cardId}`);
        
        switch (action) {
            case 'details':
                this.showWidgetDetails(cardId, cardElement);
                break;
                
            case 'share':
                this.shareWidgetData(cardId, cardElement);
                break;
        }
    }

    /**
     * Handle chart action
     */
    handleChartAction(action, chartId, chartElement) {
        console.log(`Chart action: ${action} on chart ${chartId}`);
        
        switch (action) {
            case 'screenshot':
                this.takeChartScreenshot(chartId, chartElement);
                break;
                
            case 'zoom':
                this.showChartFullscreen(chartId, chartElement);
                break;
                
            case 'export':
                this.exportChartData(chartId, chartElement);
                break;
        }
    }

    /**
     * Show widget details
     */
    showWidgetDetails(cardId, cardElement) {
        const cardType = cardId || cardElement.dataset.type;
        let title = '';
        let content = '';
        
        switch (cardType) {
            case 'totalIncome':
                title = 'Toplam Gelir Hakkında';
                content = `
                    <div class="space-y-4">
                        <p>Bu kart, seçilen dönemdeki toplam gelirinizi gösterir.</p>
                        <p class="text-sm text-gray-700">Gelirinizi artırmak için:</p>
                        <ul class="text-sm list-disc pl-5 space-y-1">
                            <li>Yan gelir kaynakları araştırın</li>
                            <li>Becerilerinizi geliştirin</li>
                            <li>Yatırımlarınızı optimize edin</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'totalExpense':
                title = 'Toplam Gider Hakkında';
                content = `
                    <div class="space-y-4">
                        <p>Bu kart, seçilen dönemdeki toplam harcamalarınızı gösterir.</p>
                        <p class="text-sm text-gray-700">Giderlerinizi azaltmak için:</p>
                        <ul class="text-sm list-disc pl-5 space-y-1">
                            <li>Gereksiz abonelikleri iptal edin</li>
                            <li>Bütçe planı oluşturun</li>
                            <li>Alışveriş öncesi fiyat karşılaştırması yapın</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'netBalance':
                title = 'Net Bakiye Hakkında';
                content = `
                    <div class="space-y-4">
                        <p>Net bakiye, gelirlerinizden giderlerinizin çıkarılmasıyla hesaplanan tutardır.</p>
                        <div class="bg-gray-50 p-3 rounded-lg text-center">
                            <span class="font-medium">Net Bakiye = Toplam Gelir - Toplam Gider</span>
                        </div>
                        <p class="text-sm text-gray-700">Net bakiyeniz:</p>
                        <ul class="text-sm list-disc pl-5 space-y-1">
                            <li>Pozitif ise tasarruf yapıyorsunuz</li>
                            <li>Negatif ise fazla harcama yapıyorsunuz</li>
                            <li>Sıfır ise gelir ve giderleriniz dengede</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'monthlyBalance':
                title = 'Aylık Bakiye Hakkında';
                content = `
                    <div class="space-y-4">
                        <p>Bu kart, içinde bulunduğunuz aydaki gelir-gider dengenizi gösterir.</p>
                        <p class="text-sm text-gray-700">Aylık bakiyenizi iyileştirmek için:</p>
                        <ul class="text-sm list-disc pl-5 space-y-1">
                            <li>Ayın başında bütçe planı yapın</li>
                            <li>Haftalık harcama limitlerini belirleyin</li>
                            <li>Acil durumlar için fon ayırın</li>
                        </ul>
                    </div>
                `;
                break;
        }
        
        // Show modal
        if (title && content) {
            createModal(title, content, [
                {
                    text: 'Kapat',
                    class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                }
            ]);
        }
    }

    /**
     * Share widget data
     */
    shareWidgetData(cardId, cardElement) {
        const cardType = cardId || cardElement.dataset.type;
        const cardText = cardElement.querySelector('.stat-value')?.textContent || '';
        
        let shareText = '';
        
        switch (cardType) {
            case 'totalIncome':
                shareText = `Toplam gelirim: ${cardText}`;
                break;
                
            case 'totalExpense':
                shareText = `Toplam giderim: ${cardText}`;
                break;
                
            case 'netBalance':
                shareText = `Net bakiyem: ${cardText}`;
                break;
                
            case 'monthlyBalance':
                shareText = `Bu ayki bakiyem: ${cardText}`;
                break;
        }
        
        if (shareText) {
            // Show share options
            createModal(
                'Paylaş',
                `
                <div class="space-y-4">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <textarea id="shareWidgetText" class="w-full p-3 border border-gray-300 rounded-md min-h-20">${shareText}</textarea>
                    </div>
                    
                    <div class="flex justify-center gap-4">
                        <button id="shareWidgetWhatsApp" class="flex items-center p-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            <i data-lucide="message-square" class="w-5 h-5 mr-2"></i>
                            WhatsApp
                        </button>
                        
                        <button id="shareWidgetTwitter" class="flex items-center p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            <i data-lucide="twitter" class="w-5 h-5 mr-2"></i>
                            Twitter
                        </button>
                        
                        <button id="shareWidgetEmail" class="flex items-center p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            <i data-lucide="mail" class="w-5 h-5 mr-2"></i>
                            E-posta
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
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Setup share buttons
            document.getElementById('shareWidgetWhatsApp')?.addEventListener('click', () => {
                const text = document.getElementById('shareWidgetText').value;
                this.shareContent('whatsapp', text);
            });
            
            document.getElementById('shareWidgetTwitter')?.addEventListener('click', () => {
                const text = document.getElementById('shareWidgetText').value;
                this.shareContent('twitter', text);
            });
            
            document.getElementById('shareWidgetEmail')?.addEventListener('click', () => {
                const text = document.getElementById('shareWidgetText').value;
                this.shareContent('email', text);
            });
        }
    }

    /**
     * Take chart screenshot
     */
    takeChartScreenshot(chartId, chartElement) {
        // Get chart canvas
        const canvas = chartElement.querySelector('canvas');
        if (!canvas) {
            showToast('Grafik bulunamadı', 'error');
            return;
        }
        
        try {
            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            link.download = `${chartId || 'chart'}.png`;
            link.href = dataUrl;
            link.click();
            
            showToast('Grafik görüntüsü indirildi', 'success');
        } catch (error) {
            console.error('Error taking screenshot:', error);
            showToast('Ekran görüntüsü alınırken hata oluştu', 'error');
        }
    }

    /**
     * Show chart in fullscreen
     */
    showChartFullscreen(chartId, chartElement) {
        // Get chart title
        const chartTitle = chartElement.querySelector('.chart-title')?.textContent || 'Grafik';
        
        // Get chart canvas
        const canvas = chartElement.querySelector('canvas');
        if (!canvas) {
            showToast('Grafik bulunamadı', 'error');
            return;
        }
        
        // Create a fullscreen modal
        createModal(
            chartTitle,
            `<div id="fullscreenChartContainer" class="w-full" style="height: 80vh;"></div>`,
            [
                {
                    text: 'Kapat',
                    class: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onclick: 'document.getElementById("modalContainer").innerHTML = "";'
                }
            ],
            { size: 'xl' }
        );
        
        // Clone the chart into the fullscreen container
        const chartInstance = this.getChartInstance(chartId);
        if (chartInstance) {
            // Create a new canvas
            const newCanvas = document.createElement('canvas');
            document.getElementById('fullscreenChartContainer').appendChild(newCanvas);
            
            // Clone the chart
            const newChart = new Chart(newCanvas, {
                type: chartInstance.config.type,
                data: JSON.parse(JSON.stringify(chartInstance.data)),
                options: JSON.parse(JSON.stringify(chartInstance.options))
            });
            
            // Adjust options for fullscreen
            newChart.options.maintainAspectRatio = false;
            newChart.options.responsive = true;
            newChart.options.plugins.legend.position = 'top';
            
            newChart.update();
        }
    }

    /**
     * Export chart data
     */
    exportChartData(chartId, chartElement) {
        // Get chart instance
        const chartInstance = this.getChartInstance(chartId);
        if (!chartInstance) {
            showToast('Grafik bulunamadı', 'error');
            return;
        }
        
        try {
            // Extract data
            const labels = chartInstance.data.labels;
            const datasets = chartInstance.data.datasets;
            
            // Create CSV content
            let csvContent = 'data:text/csv;charset=utf-8,';
            
            // Add header row
            const headerRow = ['Label', ...datasets.map(ds => ds.label)];
            csvContent += headerRow.join(',') + '\n';
            
            // Add data rows
            labels.forEach((label, i) => {
                const row = [label, ...datasets.map(ds => ds.data[i])];
                csvContent += row.join(',') + '\n';
            });
            
            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `${chartId || 'chart'}_data.csv`);
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            document.body.removeChild(link);
            
            showToast('Veri başarıyla dışa aktarıldı', 'success');
        } catch (error) {
            console.error('Error exporting chart data:', error);
            showToast('Veri dışa aktarılırken hata oluştu', 'error');
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle if no modal is open
            if (document.getElementById('modalContainer')?.innerHTML) {
                return;
            }
            
            // Handle Ctrl/Cmd key combinations
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toUpperCase();
                const shortcutKey = `Ctrl+${key}`;
                
                if (this.keyboardShortcuts[shortcutKey]) {
                    e.preventDefault();
                    this.keyboardShortcuts[shortcutKey]();
                }
            }
        });
    }

    /**
     * Setup context-specific quick actions
     */
    setupContextActions() {
        // Add actions to transaction list items
        document.addEventListener('mouseover', (e) => {
            const transactionItem = e.target.closest('.transaction-item');
            if (transactionItem && !transactionItem.dataset.actionsAdded) {
                this.addTransactionItemActions(transactionItem);
                transactionItem.dataset.actionsAdded = 'true';
            }
        });
    }

    /**
     * Add quick actions to transaction item
     */
    addTransactionItemActions(transactionItem) {
        // Add actions container if it doesn't exist
        let actionsContainer = transactionItem.querySelector('.transaction-actions');
        if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'transaction-actions absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity';
            
            // Add action buttons
            actionsContainer.innerHTML = `
                <button class="transaction-action-btn" data-action="edit" title="Düzenle">
                    <i data-lucide="edit" class="w-4 h-4 text-blue-600"></i>
                </button>
                <button class="transaction-action-btn" data-action="duplicate" title="Çoğalt">
                    <i data-lucide="copy" class="w-4 h-4 text-green-600"></i>
                </button>
                <button class="transaction-action-btn" data-action="delete" title="Sil">
                    <i data-lucide="trash-2" class="w-4 h-4 text-red-600"></i>
                </button>
            `;
            
            // Add to transaction item
            transactionItem.style.position = 'relative';
            transactionItem.classList.add('group');
            transactionItem.appendChild(actionsContainer);
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons(actionsContainer);
            }
            
            // Add event listeners
            actionsContainer.querySelectorAll('.transaction-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = e.currentTarget.dataset.action;
                    const transactionId = transactionItem.dataset.id;
                    
                    if (transactionId) {
                        this.handleTransactionAction(action, transactionId);
                    }
                });
            });
        }
    }

    /**
     * Handle transaction quick action
     */
    handleTransactionAction(action, transactionId) {
        if (!transactionId) return;
        
        switch (action) {
            case 'edit':
                if (typeof tableManager !== 'undefined') {
                    tableManager.showTransactionModal(transactionId);
                }
                break;
                
            case 'duplicate':
                if (typeof tableManager !== 'undefined') {
                    tableManager.duplicateTransaction(transactionId);
                }
                break;
                
            case 'delete':
                if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
                    dataManager.deleteTransaction(transactionId).then(() => {
                        showToast('İşlem başarıyla silindi', 'success');
                        
                        // Refresh UI
                        if (typeof app !== 'undefined') {
                            app.refreshAll();
                        }
                    }).catch(error => {
                        console.error('Error deleting transaction:', error);
                        showToast('İşlem silinirken hata oluştu', 'error');
                    });
                }
                break;
        }
    }
}

// Create and initialize quick actions
const quickActions = new QuickActions();
document.addEventListener('DOMContentLoaded', () => {
    quickActions.initialize();
});