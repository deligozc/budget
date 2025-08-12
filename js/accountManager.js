// js/accountManager.js - Hesap Yönetimi

class AccountManager {
    constructor() {
        this.accountTypes = {
            'cash': { name: 'Nakit', icon: 'banknote' },
            'bank': { name: 'Banka Hesabı', icon: 'building-2' },
            'credit': { name: 'Kredi Kartı', icon: 'credit-card' },
            'savings': { name: 'Tasarruf Hesabı', icon: 'piggy-bank' },
            'investment': { name: 'Yatırım Hesabı', icon: 'trending-up' }
        };
    }

    /**
     * Hesap durumunu güncelle
     */
    updateAccountBalance(accountId, amount, type, description = '') {
        const account = dataManager.getAccounts().find(a => a.id === accountId);
        if (!account) {
            console.error('Hesap bulunamadı:', accountId);
            return false;
        }

        const oldBalance = account.balance;
        let newBalance;

        if (type === 'income') {
            newBalance = oldBalance + amount;
        } else if (type === 'expense') {
            newBalance = oldBalance - amount;
        } else if (type === 'transfer_out') {
            newBalance = oldBalance - amount;
        } else if (type === 'transfer_in') {
            newBalance = oldBalance + amount;
        } else {
            console.error('Geçersiz işlem tipi:', type);
            return false;
        }

        // Kredi kartı için negatif bakiye kontrolü
        if (account.type === 'credit' && newBalance > 0) {
            showToast('Kredi kartı bakiyesi pozitif olamaz!', 'warning');
        }

        // Güncelleme işlemi
        const data = dataManager.getData();
        const accountIndex = data.accounts.findIndex(a => a.id === accountId);
        if (accountIndex !== -1) {
            data.accounts[accountIndex].balance = newBalance;
            return dataManager.saveData(data);
        }

        return false;
    }

    /**
     * Hesaplar arası transfer
     */
    transferBetweenAccounts(fromAccountId, toAccountId, amount, description = '') {
        if (fromAccountId === toAccountId) {
            showToast('Aynı hesaba transfer yapılamaz!', 'error');
            return false;
        }

        if (amount <= 0) {
            showToast('Transfer tutarı 0\'dan büyük olmalıdır!', 'error');
            return false;
        }

        const fromAccount = dataManager.getAccounts().find(a => a.id === fromAccountId);
        const toAccount = dataManager.getAccounts().find(a => a.id === toAccountId);

        if (!fromAccount || !toAccount) {
            showToast('Hesaplar bulunamadı!', 'error');
            return false;
        }

        // Kaynak hesap bakiye kontrolü (kredi kartı hariç)
        if (fromAccount.type !== 'credit' && fromAccount.balance < amount) {
            showToast('Yetersiz bakiye!', 'error');
            return false;
        }

        try {
            // Transfer işlemlerini oluştur
            const transferOut = {
                amount: amount,
                type: 'expense',
                categoryId: this.getTransferCategoryId(),
                accountId: fromAccountId,
                description: `Transfer → ${toAccount.name}${description ? ' - ' + description : ''}`,
                date: new Date().toISOString().split('T')[0],
                tags: ['transfer']
            };

            const transferIn = {
                amount: amount,
                type: 'income',
                categoryId: this.getTransferCategoryId(),
                accountId: toAccountId,
                description: `Transfer ← ${fromAccount.name}${description ? ' - ' + description : ''}`,
                date: new Date().toISOString().split('T')[0],
                tags: ['transfer']
            };

            // İşlemleri kaydet
            const outTransaction = dataManager.addTransaction(transferOut);
            const inTransaction = dataManager.addTransaction(transferIn);

            if (outTransaction && inTransaction) {
                showToast(`${formatCurrency(amount)} ${fromAccount.name}'den ${toAccount.name}'e transfer edildi`, 'success');
                return { outTransaction, inTransaction };
            } else {
                showToast('Transfer işlemi başarısız!', 'error');
                return false;
            }
        } catch (error) {
            console.error('Transfer hatası:', error);
            showToast('Transfer sırasında hata oluştu!', 'error');
            return false;
        }
    }

    /**
     * Transfer kategorisi ID'sini getir (yoksa oluştur)
     */
    getTransferCategoryId() {
        const categories = dataManager.getCategories();
        
        // Transfer kategorisi var mı kontrol et
        let transferCategory = categories.expense.find(c => c.name === 'Transfer');
        
        if (!transferCategory) {
            // Transfer kategorisi oluştur
            transferCategory = dataManager.addCategory({
                name: 'Transfer',
                type: 'expense',
                color: '#6B7280',
                icon: 'arrow-right-left'
            });
        }

        return transferCategory.id;
    }

    /**
     * Hesap raporu oluştur
     */
    generateAccountReport(accountId, period = 'thisMonth') {
        const account = dataManager.getAccounts().find(a => a.id === accountId);
        if (!account) return null;

        let startDate, endDate;
        
        switch (period) {
            case 'thisMonth':
                const thisMonth = getCurrentMonthRange();
                startDate = thisMonth.start;
                endDate = thisMonth.end;
                break;
            case 'lastMonth':
                const lastMonth = getLastMonthRange();
                startDate = lastMonth.start;
                endDate = lastMonth.end;
                break;
            case 'thisYear':
                const thisYear = getCurrentYearRange();
                startDate = thisYear.start;
                endDate = thisYear.end;
                break;
            default:
                // Tüm zamanlar
                const allTransactions = dataManager.getTransactions({ accountId });
                if (allTransactions.length === 0) {
                    startDate = new Date().toISOString().split('T')[0];
                    endDate = new Date().toISOString().split('T')[0];
                } else {
                    startDate = allTransactions[allTransactions.length - 1].date;
                    endDate = allTransactions[0].date;
                }
        }

        const transactions = dataManager.getTransactions({ 
            accountId, 
            startDate, 
            endDate 
        });

        // İstatistikleri hesapla
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const transfers = transactions.filter(t => 
            t.tags && t.tags.includes('transfer')
        );

        const transferIn = transfers
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const transferOut = transfers
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Kategori dağılımı
        const categoryStats = {};
        transactions.forEach(transaction => {
            const category = this.getCategoryById(transaction.categoryId);
            if (category) {
                if (!categoryStats[category.name]) {
                    categoryStats[category.name] = {
                        name: category.name,
                        color: category.color,
                        income: 0,
                        expense: 0,
                        count: 0
                    };
                }
                
                if (transaction.type === 'income') {
                    categoryStats[category.name].income += transaction.amount;
                } else {
                    categoryStats[category.name].expense += transaction.amount;
                }
                categoryStats[category.name].count++;
            }
        });

        return {
            account,
            period: {
                startDate,
                endDate,
                name: this.getPeriodName(period)
            },
            summary: {
                totalIncome: income,
                totalExpense: expense,
                netChange: income - expense,
                transferIn,
                transferOut,
                transactionCount: transactions.length,
                currentBalance: account.balance
            },
            transactions: transactions.slice(0, 10), // Son 10 işlem
            categoryStats: Object.values(categoryStats)
                .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
        };
    }

    /**
     * Tüm hesapların özetini getir
     */
    getAccountsSummary() {
        const accounts = dataManager.getAccounts();
        const allTransactions = dataManager.getTransactions();
        
        const summary = accounts.map(account => {
            const accountTransactions = allTransactions.filter(t => t.accountId === account.id);
            const thisMonth = getCurrentMonthRange();
            const monthlyTransactions = accountTransactions.filter(t => 
                isDateInRange(t.date, thisMonth.start, thisMonth.end)
            );

            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlyExpense = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                ...account,
                monthlyIncome,
                monthlyExpense,
                monthlyChange: monthlyIncome - monthlyExpense,
                transactionCount: accountTransactions.length,
                lastTransaction: accountTransactions[0] || null
            };
        });

        const totalBalance = summary.reduce((sum, acc) => sum + acc.balance, 0);
        const totalMonthlyIncome = summary.reduce((sum, acc) => sum + acc.monthlyIncome, 0);
        const totalMonthlyExpense = summary.reduce((sum, acc) => sum + acc.monthlyExpense, 0);

        return {
            accounts: summary,
            totals: {
                balance: totalBalance,
                monthlyIncome: totalMonthlyIncome,
                monthlyExpense: totalMonthlyExpense,
                monthlyChange: totalMonthlyIncome - totalMonthlyExpense
            }
        };
    }

    /**
     * Hesap bakiye geçmişini hesapla
     */
    calculateBalanceHistory(accountId, days = 30) {
        const account = dataManager.getAccounts().find(a => a.id === accountId);
        if (!account) return [];

        const transactions = dataManager.getTransactions({ accountId })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const history = [];
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        let currentBalance = account.balance;
        
        // Gelecekteki işlemlerin etkisini çıkar
        transactions.forEach(t => {
            if (new Date(t.date) > endDate) {
                if (t.type === 'income') {
                    currentBalance -= t.amount;
                } else {
                    currentBalance += t.amount;
                }
            }
        });

        // Günlük bakiyeleri hesapla
        for (let d = new Date(endDate); d >= startDate; d.setDate(d.getDate() - 1)) {
            const dayStr = d.toISOString().split('T')[0];
            
            // Bu gündeki işlemleri bul
            const dayTransactions = transactions.filter(t => t.date === dayStr);
            
            // Bu günün işlemlerini bakiyeden çıkar (geriye doğru gidiyoruz)
            dayTransactions.forEach(t => {
                if (t.type === 'income') {
                    currentBalance -= t.amount;
                } else {
                    currentBalance += t.amount;
                }
            });

            history.unshift({
                date: dayStr,
                balance: currentBalance,
                transactionCount: dayTransactions.length
            });

            // İşlemleri geri ekle (sonraki gün için)
            dayTransactions.forEach(t => {
                if (t.type === 'income') {
                    currentBalance += t.amount;
                } else {
                    currentBalance -= t.amount;
                }
            });
        }

        return history;
    }

    /**
     * Transfer modal'ını göster
     */
    showTransferModal() {
        const accounts = dataManager.getAccounts(true);
        
        if (accounts.length < 2) {
            showToast('Transfer için en az 2 aktif hesap gerekli!', 'error');
            return;
        }

        const modal = createModal(
            'Hesaplar Arası Transfer',
            `
            <form id="transferForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kaynak Hesap</label>
                        <select id="fromAccount" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" required>
                            <option value="">Seçin</option>
                            ${accounts.map(acc => `
                                <option value="${acc.id}">
                                    ${escapeHtml(acc.name)} (${formatCurrency(acc.balance)})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Hedef Hesap</label>
                        <select id="toAccount" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" required>
                            <option value="">Seçin</option>
                            ${accounts.map(acc => `
                                <option value="${acc.id}">
                                    ${escapeHtml(acc.name)} (${formatCurrency(acc.balance)})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Transfer Tutarı</label>
                    <input type="number" id="transferAmount" step="0.01" min="0.01"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                           placeholder="0.00" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Açıklama (İsteğe bağlı)</label>
                    <input type="text" id="transferDescription"
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                           placeholder="Transfer açıklaması">
                </div>

                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i data-lucide="info" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                        <div class="text-sm text-blue-800">
                            <p class="font-medium">Transfer Bilgileri</p>
                            <p>Bu işlem iki ayrı kayıt oluşturacak: kaynak hesaptan çıkış ve hedef hesaba giriş.</p>
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
                    text: 'Transfer Yap',
                    class: 'bg-teal-500 hover:bg-teal-600 text-white',
                    onclick: 'accountManager.executeTransfer()'
                }
            ]
        );

        // Aynı hesap seçimini önle
        const fromSelect = modal.querySelector('#fromAccount');
        const toSelect = modal.querySelector('#toAccount');
        
        [fromSelect, toSelect].forEach(select => {
            select.addEventListener('change', () => {
                const otherSelect = select === fromSelect ? toSelect : fromSelect;
                const selectedValue = select.value;
                
                Array.from(otherSelect.options).forEach(option => {
                    option.disabled = option.value === selectedValue && selectedValue !== '';
                });
            });
        });

        lucide.createIcons();
    }

    /**
     * Transfer işlemini gerçekleştir
     */
    executeTransfer() {
        const fromAccountId = document.getElementById('fromAccount').value;
        const toAccountId = document.getElementById('toAccount').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const description = document.getElementById('transferDescription').value.trim();

        if (!fromAccountId || !toAccountId) {
            showToast('Kaynak ve hedef hesap seçin!', 'error');
            return;
        }

        if (!amount || amount <= 0) {
            showToast('Geçerli bir tutar girin!', 'error');
            return;
        }

        if (this.transferBetweenAccounts(fromAccountId, toAccountId, amount, description)) {
            document.getElementById('modalContainer').innerHTML = '';
            
            // Arayüzü yenile
            if (typeof app !== 'undefined') {
                app.refreshAll();
            }
        }
    }

    /**
     * Yardımcı metodlar
     */
    getCategoryById(categoryId) {
        const categories = dataManager.getCategories();
        for (const type in categories) {
            const category = categories[type].find(c => c.id === categoryId);
            if (category) return category;
        }
        return null;
    }

    getPeriodName(period) {
        const names = {
            'thisMonth': 'Bu Ay',
            'lastMonth': 'Geçen Ay',
            'thisYear': 'Bu Yıl',
            'all': 'Tüm Zamanlar'
        };
        return names[period] || period;
    }

    getAccountTypeName(type) {
        return this.accountTypes[type]?.name || type;
    }

    getAccountTypeIcon(type) {
        return this.accountTypes[type]?.icon || 'wallet';
    }

    /**
     * Hesap performans analizi
     */
    analyzeAccountPerformance(accountId, months = 6) {
        const account = dataManager.getAccounts().find(a => a.id === accountId);
        if (!account) return null;

        const monthlyData = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            
            const transactions = dataManager.getTransactions({
                accountId,
                startDate: monthStart,
                endDate: monthEnd
            });

            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            monthlyData.push({
                month: date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
                income,
                expense,
                net: income - expense,
                transactionCount: transactions.length
            });
        }

        // Trend analizi
        const avgIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / months;
        const avgExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0) / months;
        const avgNet = avgIncome - avgExpense;

        const lastMonth = monthlyData[monthlyData.length - 1];
        const trend = {
            income: lastMonth.income > avgIncome ? 'up' : 'down',
            expense: lastMonth.expense > avgExpense ? 'up' : 'down',
            net: lastMonth.net > avgNet ? 'up' : 'down'
        };

        return {
            account,
            monthlyData,
            averages: {
                income: avgIncome,
                expense: avgExpense,
                net: avgNet
            },
            trend,
            analysis: {
                isPerforming: lastMonth.net > avgNet,
                incomeStability: this.calculateStability(monthlyData.map(m => m.income)),
                expenseStability: this.calculateStability(monthlyData.map(m => m.expense))
            }
        };
    }

    /**
     * Veri kararlılığını hesapla (standart sapma)
     */
    calculateStability(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Kararlılık yüzdesi (düşük standart sapma = yüksek kararlılık)
        const stability = Math.max(0, 100 - (stdDev / mean * 100));
        return Math.round(stability);
    }
}

// Global instance
const accountManager = new AccountManager();