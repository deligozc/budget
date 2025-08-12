// js/reportManager.js - Rapor Yönetimi

class ReportManager {
    constructor() {
        this.currentPeriod = 'monthly';
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
        this.budgetCharts = {
            overview: null,
            status: null,
            tagAnalysis: null,
            categoryAnalysis: null
        };
        this.initializeEventListeners();
    }

    /**
     * Event listener'ları başlat
     */
    initializeEventListeners() {
        // Dönem değişikliği
        document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.toggleMonthSelector();
            this.generateReport();
        });

        // Yıl değişikliği
        document.getElementById('reportYear')?.addEventListener('change', (e) => {
            this.currentYear = parseInt(e.target.value);
            this.generateReport();
        });

        // Ay değişikliği
        document.getElementById('reportMonth')?.addEventListener('change', (e) => {
            this.currentMonth = parseInt(e.target.value);
            this.generateReport();
        });

        // Rapor oluştur butonu
        document.getElementById('generateReport')?.addEventListener('click', () => {
            this.generateReport();
        });

        // Bütçe planı ekle butonu
        document.getElementById('addBudgetPlan')?.addEventListener('click', async () => {
            try {
                await this.showBudgetPlanModal();
            } catch (error) {
                console.error('Bütçe planı modal açma hatası:', error);
            }
        });

        // Bütçe planı Excel'den içe aktar butonu
        document.getElementById('importBudgetPlans')?.addEventListener('click', () => {
            this.showImportBudgetModal();
        });

        // Bütçe planı Excel şablonu indir butonu
        document.getElementById('exportBudgetPlans')?.addEventListener('click', () => {
            this.exportBudgetTemplate();
        });

        // Rapor export butonu
        document.getElementById('exportBudgetReport')?.addEventListener('click', () => {
            this.exportBudgetReport();
        });
    }

    /**
     * Rapor sekmesini başlat
     */
    async initializeReports() {
        try {
            this.populateYearSelector();
            this.setCurrentPeriod();
            this.toggleMonthSelector();
            this.setupExportButtons();
            await this.generateReport();
        } catch (error) {
            console.error('Error initializing reports:', error);
        }
    }
    
    /**
     * Export butonlarını ayarla
     */
    setupExportButtons() {
        // Raporlar üst bölümüne Excel export butonları ekle
        const container = document.getElementById('reportActions');
        if (!container) return;
        
        // Butonları ekle
        container.innerHTML = `
            <button id="exportMonthlyExcel" class="btn btn-secondary mr-2">
                <i data-lucide="file-spreadsheet" class="w-4 h-4 mr-1"></i>
                Aylık Excel
            </button>
            <button id="exportYearlyExcel" class="btn btn-secondary mr-2">
                <i data-lucide="file-spreadsheet" class="w-4 h-4 mr-1"></i>
                Yıllık Excel
            </button>
            <button id="exportPivotExcel" class="btn btn-secondary">
                <i data-lucide="layout-grid" class="w-4 h-4 mr-1"></i>
                Pivot Excel
            </button>
        `;
        
        // Event listener'lar ekle
        document.getElementById('exportMonthlyExcel')?.addEventListener('click', () => {
            this.exportMonthlyExcel();
        });
        
        document.getElementById('exportYearlyExcel')?.addEventListener('click', () => {
            this.exportYearlyExcel();
        });
        
        document.getElementById('exportPivotExcel')?.addEventListener('click', () => {
            this.exportPivotExcel();
        });
        
        // İkonları yenile
        lucide.createIcons();
    }

    /**
     * Yıl seçicisini doldur
     */
    populateYearSelector() {
        const yearSelect = document.getElementById('reportYear');
        if (!yearSelect) return;

        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '';

        // Son 5 yıl + gelecek 2 yıl
        for (let year = currentYear - 5; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }
    }

    /**
     * Güncel dönemi ayarla
     */
    setCurrentPeriod() {
        const now = new Date();
        document.getElementById('reportYear').value = now.getFullYear();
        document.getElementById('reportMonth').value = now.getMonth() + 1;
    }

    /**
     * Ay seçicisini göster/gizle
     */
    toggleMonthSelector() {
        const monthGroup = document.getElementById('monthSelectorGroup');
        if (monthGroup) {
            if (this.currentPeriod === 'monthly') {
                monthGroup.style.display = 'flex';
            } else {
                monthGroup.style.display = 'none';
            }
        }
    }

    /**
     * Rapor oluştur
     */
    async generateReport() {
        try {
            this.updatePeriodLabel();
            await this.renderBudgetPlanning();
            await this.renderBudgetAnalysis();
            await this.renderBudgetCharts();
            await this.renderTagCategoryAnalysis();
        } catch (error) {
            console.error('Error generating report:', error);
        }
    }

    /**
     * Dönem etiketini güncelle
     */
    updatePeriodLabel() {
        const label = document.getElementById('budgetPeriodLabel');
        if (!label) return;

        if (this.currentPeriod === 'monthly') {
            const monthNames = [
                'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
            ];
            label.textContent = `${monthNames[this.currentMonth - 1]} ${this.currentYear}`;
        } else {
            label.textContent = `${this.currentYear} Yılı`;
        }
    }

    /**
     * Bütçe planlama tablosunu render et
     */
    async renderBudgetPlanning() {
        try {
            const container = document.getElementById('budgetPlanningTable');
            if (!container) return;
    
            const categories = await dataManager.getCategories() || { income: [], expense: [] };
            const rawBudgets = await dataManager.getBudgets({
                period: this.currentPeriod,
                year: this.currentYear,
                month: this.currentPeriod === 'monthly' ? this.currentMonth : null
            }) || [];
            const budgets = Array.isArray(rawBudgets) ? rawBudgets : [];

            let html = '<div class="budget-grid-header">';
            html += '<div class="budget-grid-column">Kategori / Alt Kategori</div>';
            html += '<div class="budget-grid-column">Tip</div>';
            html += '<div class="budget-grid-column">Planlanan</div>';
            html += '<div class="budget-grid-column">Gerçekleşen</div>';
            html += '<div class="budget-grid-column">Fark</div>';
            html += '<div class="budget-grid-column">İşlemler</div>';
            html += '</div>';

            // Tüm kategoriler için satır oluştur
            ['income', 'expense'].forEach(type => {
                // Kategori tipi varsa ve dizi ise devam et
                if (categories[type] && Array.isArray(categories[type])) {
                    categories[type].forEach(category => {
                        // Kategori düzeyindeki bütçeler
                        const categoryBudgets = budgets.filter(b => 
                            b.categoryId === category.id && (!b.subcategoryId || b.subcategoryId === null)
                        );
                    
                        if (categoryBudgets.length > 0) {
                            // Kategori düzeyinde bütçe var, her biri için satır oluştur
                            // Use placeholder analysis data first, will be updated by AJAX later
                            const placeholderAnalysis = {
                                actualAmount: 0,
                                plannedAmount: 0,
                                variance: 0,
                                variancePercent: 0,
                                status: 'neutral'
                            };
                            
                            categoryBudgets.forEach(budget => {
                                html += this.renderBudgetRow(category, null, budget, placeholderAnalysis, type);
                                
                                // Start async analysis in the background
                                this.getCategoryAnalysis(category.id, null, budget).then(analysis => {
                                    // Update the row with real data when available
                                    this.updateBudgetRow(category.id, null, analysis);
                                }).catch(error => {
                                    console.error('Error getting category analysis:', error);
                                });
                            });
                        } else {
                            // Kategori düzeyinde bütçe yoksa, boş bir satır göster
                            const placeholderAnalysis = {
                                actualAmount: 0,
                                plannedAmount: 0,
                                variance: 0,
                                variancePercent: 0,
                                status: 'neutral'
                            };
                            
                            html += this.renderBudgetRow(category, null, null, placeholderAnalysis, type);
                            
                            // Start async analysis in the background
                            this.getCategoryAnalysis(category.id, null, null).then(analysis => {
                                // Update the row with real data when available
                                this.updateBudgetRow(category.id, null, analysis);
                            }).catch(error => {
                                console.error('Error getting category analysis:', error);
                            });
                        }
                        
                        // Alt kategoriler için bütçeler
                        if (category.subcategories && category.subcategories.length > 0) {
                            category.subcategories.forEach(subcategory => {
                                // Tüm eşleşen bütçeleri bul (sadece ilk eşleşeni değil)
                                const subcategoryBudgets = budgets.filter(b => 
                                    b.categoryId === category.id && b.subcategoryId === subcategory.id
                                );
                                
                                if (subcategoryBudgets && subcategoryBudgets.length > 0) {
                                    // Her bir bütçe için ayrı satır oluştur
                                    const placeholderAnalysis = {
                                        actualAmount: 0,
                                        plannedAmount: 0,
                                        variance: 0,
                                        variancePercent: 0,
                                        status: 'neutral'
                                    };
                                    
                                    subcategoryBudgets.forEach(budget => {
                                        placeholderAnalysis.plannedAmount = budget ? budget.plannedAmount : 0;
                                        html += this.renderBudgetRow(category, subcategory, budget, placeholderAnalysis, type);
                                        
                                        // Start async analysis in the background
                                        this.getCategoryAnalysis(category.id, subcategory.id, budget).then(analysis => {
                                            // Update the row with real data when available
                                            this.updateBudgetRow(category.id, subcategory.id, analysis);
                                        }).catch(error => {
                                            console.error('Error getting subcategory analysis:', error);
                                        });
                                    });
                                } else {
                                    // Eğer bütçe yoksa boş bir satır göster
                                    const placeholderAnalysis = {
                                        actualAmount: 0,
                                        plannedAmount: 0,
                                        variance: 0,
                                        variancePercent: 0,
                                        status: 'neutral'
                                    };
                                    
                                    html += this.renderBudgetRow(category, subcategory, null, placeholderAnalysis, type);
                                    
                                    // Start async analysis in the background
                                    this.getCategoryAnalysis(category.id, subcategory.id, null).then(analysis => {
                                        // Update the row with real data when available
                                        this.updateBudgetRow(category.id, subcategory.id, analysis);
                                    }).catch(error => {
                                        console.error('Error getting subcategory analysis:', error);
                                    });
                                }
                            });
                        }
                    });
                }
            });

            container.innerHTML = html;
            lucide.createIcons();
            
            // Store container reference for later updates
            this.budgetPlanningContainer = container;
        } catch (error) {
            console.error('Error rendering budget planning:', error);
            if (container) {
                container.innerHTML = '<div class="text-center p-8 text-gray-500">Bütçe planı yüklenirken bir hata oluştu</div>';
            }
        }
    }
    
    /**
     * Update a budget row with analysis data
     */
    updateBudgetRow(categoryId, subcategoryId, analysis) {
        try {
            if (!this.budgetPlanningContainer) return;
            
            // Find the row to update
            const rowId = subcategoryId ? 
                `budget-row-${categoryId}-${subcategoryId}` : 
                `budget-row-${categoryId}`;
                
            const row = document.getElementById(rowId);
            if (!row) return;
            
            // Update the amount cell
            const actualAmountCell = row.querySelector('.budget-actual-amount');
            if (actualAmountCell) {
                actualAmountCell.textContent = formatCurrency(analysis.actualAmount);
            }
            
            // Update the variance cell
            const varianceCell = row.querySelector('.budget-variance');
            if (varianceCell) {
                varianceCell.innerHTML = this.renderVarianceCell(analysis);
            }
        } catch (error) {
            console.error('Error updating budget row:', error);
        }
    }
    
    /**
     * Bütçe planı satırını oluştur
     */
    renderBudgetRow(category, subcategory, budget, analysis, type) {
        const rowId = subcategory ? 
            `budget-row-${category.id}-${subcategory.id}` : 
            `budget-row-${category.id}`;
            
        return `<div id="${rowId}" class="budget-grid-row" data-category-id="${category.id}" ${subcategory ? `data-subcategory-id="${subcategory.id}"` : ''}>
            <div class="budget-grid-cell">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${subcategory ? subcategory.color : category.color};"></div>
                    <span class="font-medium">
                        ${escapeHtml(category.name)}
                        ${subcategory ? `<span class="text-sm text-gray-500 ml-1">/ ${escapeHtml(subcategory.name)}</span>` : ''}
                    </span>
                </div>
                ${budget && budget.description ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(budget.description)}</div>` : ''}
            </div>
            <div class="budget-grid-cell">
                <span class="badge ${type === 'income' ? 'badge-success' : 'badge-error'}">
                    ${type === 'income' ? 'Gelir' : 'Gider'}
                </span>
            </div>
            <div class="budget-grid-cell">
                <span class="font-medium ${budget ? 'text-gray-900' : 'text-gray-400'}">
                    ${budget ? formatCurrency(budget.plannedAmount) : 'Plan yok'}
                </span>
            </div>
            <div class="budget-grid-cell">
                <span class="budget-actual-amount font-medium ${analysis.actualAmount > 0 ? 'text-gray-900' : 'text-gray-400'}">
                    ${analysis.actualAmount > 0 ? formatCurrency(analysis.actualAmount) : '₺0'}
                </span>
            </div>
            <div class="budget-grid-cell budget-variance">
                ${this.renderVarianceCell(analysis)}
            </div>
            <div class="budget-grid-cell">
                <div class="flex space-x-1">
                    <button onclick="reportManager.editBudgetPlan('${category.id}', ${subcategory ? `'${subcategory.id}'` : 'null'})" 
                            class="btn-icon btn-primary" title="${budget ? 'Düzenle' : 'Plan Ekle'}">
                        <i data-lucide="${budget ? 'edit-2' : 'plus'}" style="width: 0.875rem; height: 0.875rem;"></i>
                    </button>
                    ${budget ? `
                        <button onclick="reportManager.deleteBudgetPlan('${budget.id}')" 
                                class="btn-icon btn-error" title="Sil">
                            <i data-lucide="trash-2" style="width: 0.875rem; height: 0.875rem;"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>`;
    }

    /**
     * Kategori analizi getir
     */
    async getCategoryAnalysis(categoryId, subcategoryId = null, budget = null) {
        try {
            let startDate, endDate;
            
            if (this.currentPeriod === 'monthly') {
                startDate = new Date(this.currentYear, this.currentMonth - 1, 1).toISOString().split('T')[0];
                endDate = new Date(this.currentYear, this.currentMonth, 0).toISOString().split('T')[0];
            } else {
                startDate = new Date(this.currentYear, 0, 1).toISOString().split('T')[0];
                endDate = new Date(this.currentYear, 11, 31).toISOString().split('T')[0];
            }

        // Filtreleme kriterlerini oluştur
        const filters = {
            categoryId,
            startDate,
            endDate
        };
        
        // Alt kategori belirtilmişse filtreye ekle
        if (subcategoryId) {
            filters.subcategoryId = subcategoryId;
        }

        // İşlemleri getir
        const transactions = await dataManager.getTransactions(filters) || [];

        // İşlem dizisini kontrol et
        const transactionsArray = Array.isArray(transactions) ? transactions : [];
        
        // İşlemlerin benzersiz ID'lerini sakla
        const uniqueTransactionIds = new Set();
        
        // İşlemleri toplarken çifte hesaplamayı önle
        const actualAmount = transactionsArray.reduce((sum, t) => {
            // Her işlemi sadece bir kez hesapla
            if (uniqueTransactionIds.has(t.id)) {
                return sum;
            }
            
            // ID'yi kaydet ve tutarı ekle
            uniqueTransactionIds.add(t.id);
            return sum + (t.amount || 0);
        }, 0);
        
        // Planlanan tutarı ayarla
        const plannedAmount = budget ? budget.plannedAmount : 0;
        const variance = actualAmount - plannedAmount;

        return {
            actualAmount,
            plannedAmount,
            variance,
            variancePercent: plannedAmount > 0 ? (variance / plannedAmount) * 100 : 0,
            status: dataManager.getBudgetStatus(variance, plannedAmount)
        };
        } catch (error) {
            console.error('Error getting category analysis:', error);
            return {
                actualAmount: 0,
                plannedAmount: 0,
                variance: 0,
                variancePercent: 0,
                status: 'neutral'
            };
        }
    }

    /**
     * Varyans hücresini render et
     */
    renderVarianceCell(analysis) {
        if (analysis.plannedAmount === 0) {
            return '<span class="text-gray-400 text-sm">Plan yok</span>';
        }

        const absVariance = Math.abs(analysis.variance);
        const sign = analysis.variance >= 0 ? '+' : '-';
        const color = analysis.variance > 0 ? 'text-red-600' : 'text-green-600';
        const percent = Math.abs(analysis.variancePercent).toFixed(1);

        return `
            <div class="text-center">
                <div class="${color} font-medium">${sign}${formatCurrency(absVariance)}</div>
                <div class="${color} text-xs">(${sign}${percent}%)</div>
            </div>
        `;
    }

    /**
     * Bütçe analiz tablosunu render et
     */
    async renderBudgetAnalysis() {
        try {
            const container = document.getElementById('budgetAnalysisTable');
            if (!container) return;
    
            const month = this.currentPeriod === 'monthly' ? this.currentMonth : null;
            const analysis = await dataManager.getBudgetAnalysis(this.currentYear, month) || [];
            
            // Make sure analysis is an array
            if (!Array.isArray(analysis) || analysis.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i data-lucide="chart-line" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                        <p class="text-lg font-medium mb-2">Bütçe analizi bulunamadı</p>
                        <p>Bu dönem için bütçe planı oluşturun</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }
    
            // Summary cards
            const totalPlanned = analysis.reduce((sum, item) => sum + (item.plannedAmount || 0), 0);
            const totalActual = analysis.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
            const totalVariance = totalActual - totalPlanned;

            let html = `
                <div class="budget-summary-cards">
                    <div class="budget-summary-card">
                    <div class="budget-summary-label">Toplam Planlanan</div>
                    <div class="budget-summary-value">${formatCurrency(totalPlanned)}</div>
                </div>
                <div class="budget-summary-card">
                    <div class="budget-summary-label">Toplam Gerçekleşen</div>
                    <div class="budget-summary-value">${formatCurrency(totalActual)}</div>
                </div>
                <div class="budget-summary-card">
                    <div class="budget-summary-label">Toplam Fark</div>
                    <div class="budget-summary-value ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}">
                        ${totalVariance >= 0 ? '+' : ''}${formatCurrency(totalVariance)}
                    </div>
                </div>
            </div>
        `;

            // Detailed analysis
            html += '<div class="budget-analysis-list">';
            analysis.forEach(item => {
                const statusClass = this.getStatusClass(item.status);
                const progressPercent = Math.min(item.progress || 0, 100);
                
                html += `
                    <div class="budget-analysis-item ${statusClass}">
                        <div class="budget-analysis-header">
                            <div class="flex items-center space-x-3">
                                <div class="w-4 h-4 rounded-full" style="background-color: ${item.subcategoryColor || item.categoryColor || '#CCCCCC'};"></div>
                                <span class="font-semibold">
                                    ${escapeHtml(item.categoryName || 'Kategori Yok')}
                                    ${item.subcategoryName ? 
                                        `<span class="text-sm text-gray-500 ml-1">/ ${escapeHtml(item.subcategoryName)}</span>` : ''}
                                </span>
                                <span class="badge ${item.categoryType === 'income' ? 'badge-success' : 'badge-error'}">
                                    ${item.categoryType === 'income' ? 'Gelir' : 'Gider'}
                                </span>
                            </div>
                            <div class="budget-status-badge status-${item.status || 'neutral'}">
                                ${this.getStatusText(item.status || 'neutral')}
                            </div>
                        </div>
                        <div class="budget-progress-bar">
                            <div class="budget-progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                        <div class="budget-analysis-details">
                            <div class="budget-detail">
                                <span class="budget-detail-label">Planlanan:</span>
                                <span class="budget-detail-value">${formatCurrency(item.plannedAmount || 0)}</span>
                            </div>
                            <div class="budget-detail">
                                <span class="budget-detail-label">Gerçekleşen:</span>
                                <span class="budget-detail-value">${formatCurrency(item.actualAmount || 0)}</span>
                            </div>
                            <div class="budget-detail">
                                <span class="budget-detail-label">İlerleme:</span>
                                <span class="budget-detail-value">${progressPercent.toFixed(1)}%</span>
                            </div>
                            <div class="budget-detail">
                            <span class="budget-detail-label">Fark:</span>
                            <span class="budget-detail-value ${item.variance >= 0 ? 'text-red-600' : 'text-green-600'}">
                                ${item.variance >= 0 ? '+' : ''}${formatCurrency(item.variance)}
                                (${item.variancePercent >= 0 ? '+' : ''}${item.variancePercent.toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
            lucide.createIcons();
        } catch (error) {
            console.error('Error rendering budget analysis:', error);
            const container = document.getElementById('budgetAnalysisTable');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <p class="text-lg font-medium mb-2">Bütçe analizi yüklenirken bir hata oluştu</p>
                        <p>Lütfen daha sonra tekrar deneyin</p>
                    </div>
                `;
                lucide.createIcons();
            }
        }
    }

    /**
     * Bütçe grafiklerini render et
     */
    async renderBudgetCharts() {
        try {
            await this.renderBudgetOverviewChart();
            await this.renderBudgetStatusChart();
        } catch (error) {
            console.error('Error rendering budget charts:', error);
        }
    }

    /**
     * Bütçe genel bakış grafiği
     */
    async renderBudgetOverviewChart() {
        try {
            const ctx = document.getElementById('budgetOverviewChart');
            if (!ctx) return;
    
            // Güvenli bir şekilde önceki grafiği temizle
            this.safelyDestroyChart(ctx, this.budgetCharts.overview);
            this.budgetCharts.overview = null;
            
            // Canvas'a yeni grafik çizmeden önce kısa bir bekleme ekle
            await new Promise(resolve => setTimeout(resolve, 50));
    
            const month = this.currentPeriod === 'monthly' ? this.currentMonth : null;
            const analysis = await dataManager.getBudgetAnalysis(this.currentYear, month) || [];

            // Veri yoksa boş grafik göster
            if (!Array.isArray(analysis) || analysis.length === 0) {
                this.budgetCharts.overview = await this.showEmptyChart(ctx, 'Bütçe verisi bulunamadı');
                return;
            }

            // Canvas elementinin hala DOM'da olduğunu kontrol et
            if (!document.body.contains(ctx)) {
                console.warn('Budget overview chart canvas is no longer in the document');
                return;
            }

            const labels = analysis.map(item => item.categoryName);
            const plannedData = analysis.map(item => item.plannedAmount);
            const actualData = analysis.map(item => item.actualAmount);

            // Chart.js tarafından kontrol edilen herhangi bir grafik instance'ı var mı tekrar kontrol et
            if (typeof Chart !== 'undefined' && Chart.getChart && Chart.getChart(ctx)) {
                console.warn('Canvas still has a chart instance, destroying again');
                Chart.getChart(ctx).destroy();
            }

            this.budgetCharts.overview = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Planlanan',
                            data: plannedData,
                            backgroundColor: '#3B82F6',
                            borderColor: '#2563EB',
                            borderWidth: 1,
                            borderRadius: 4
                        },
                        {
                            label: 'Gerçekleşen',
                            data: actualData,
                            backgroundColor: '#10B981',
                            borderColor: '#059669',
                            borderWidth: 1,
                            borderRadius: 4
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
                                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
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
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating budget overview chart:', error);
            // Hata durumunda boş grafik göstermeyi dene
            try {
                if (ctx) this.budgetCharts.overview = await this.showEmptyChart(ctx, 'Grafik yüklenirken hata oluştu');
            } catch (e) {
                console.error('Error showing empty chart:', e);
            }
        }
    }

    /**
     * Bütçe durumu grafiği
     */
    async renderBudgetStatusChart() {
        try {
            const ctx = document.getElementById('budgetStatusChart');
            if (!ctx) return;

            // Güvenli bir şekilde önceki grafiği temizle
            this.safelyDestroyChart(ctx, this.budgetCharts.status);
            this.budgetCharts.status = null;
            
            // Canvas'a yeni grafik çizmeden önce kısa bir bekleme ekle
            await new Promise(resolve => setTimeout(resolve, 50));

            const month = this.currentPeriod === 'monthly' ? this.currentMonth : null;
            const analysis = await dataManager.getBudgetAnalysis(this.currentYear, month) || [];

            // Veri yoksa boş grafik göster
            if (!Array.isArray(analysis) || analysis.length === 0) {
                this.budgetCharts.status = await this.showEmptyChart(ctx, 'Bütçe verisi bulunamadı');
                return;
            }

            // Canvas elementinin hala DOM'da olduğunu kontrol et
            if (!document.body.contains(ctx)) {
                console.warn('Budget status chart canvas is no longer in the document');
                return;
            }

            // Durum bazında gruplama
            const statusGroups = {
                'over-budget': 0,
                'near-budget': 0,
                'on-budget': 0,
                'under-budget': 0
            };

            analysis.forEach(item => {
                statusGroups[item.status]++;
            });

            const labels = [];
            const data = [];
            const colors = [];

            if (statusGroups['over-budget'] > 0) {
                labels.push('Bütçe Aşımı');
                data.push(statusGroups['over-budget']);
                colors.push('#EF4444');
            }
            if (statusGroups['near-budget'] > 0) {
                labels.push('Bütçe Sınırında');
                data.push(statusGroups['near-budget']);
                colors.push('#F59E0B');
            }
            if (statusGroups['on-budget'] > 0) {
                labels.push('Bütçe Dahilinde');
                data.push(statusGroups['on-budget']);
                colors.push('#10B981');
            }
            if (statusGroups['under-budget'] > 0) {
                labels.push('Bütçe Altında');
                data.push(statusGroups['under-budget']);
                colors.push('#6B7280');
            }

            // Chart.js tarafından kontrol edilen herhangi bir grafik instance'ı var mı tekrar kontrol et
            if (typeof Chart !== 'undefined' && Chart.getChart && Chart.getChart(ctx)) {
                console.warn('Canvas still has a chart instance, destroying again');
                Chart.getChart(ctx).destroy();
            }

            this.budgetCharts.status = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating budget status chart:', error);
            // Hata durumunda boş grafik göstermeyi dene
            try {
                if (ctx) this.budgetCharts.status = await this.showEmptyChart(ctx, 'Grafik yüklenirken hata oluştu');
            } catch (e) {
                console.error('Error showing empty chart:', e);
            }
        }
    }

    /**
     * Boş grafik göster
     */
    showEmptyChart(ctx, message, chartType = 'doughnut', chartInstance = null) {
        try {
            // Güvenli bir şekilde mevcut grafiği temizle
            this.safelyDestroyChart(ctx, chartInstance);
            
            // Grafiği oluşturmadan önce ufak bir gecikme ekle
            // Bu Chart.js'in registry'sini güncellemesi için zaman tanır
            return new Promise(resolve => {
                setTimeout(() => {
                    try {
                        const chart = new Chart(ctx, {
                            type: chartType,
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
                                    legend: { display: false },
                                    tooltip: { enabled: false }
                                }
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
                        resolve(chart);
                    } catch (error) {
                        console.error("Error creating empty chart:", error);
                        resolve(null);
                    }
                }, 50); // 50ms delay
            });
        } catch (error) {
            console.error("Error showing empty chart:", error);
            return Promise.resolve(null);
        }
    }

    /**
     * Bütçe planı modal'ını göster
     */
    async showBudgetPlanModal(categoryId = null, subcategoryId = null) {
        console.log("showBudgetPlanModal çağrıldı:", { categoryId, subcategoryId });
        const categories = await dataManager.getCategories() || { income: [], expense: [] };
        
        // Mevcut bütçeyi getir (eğer düzenleme ise)
        let existingBudget = null;
        if (categoryId) {
            // Filtre oluştur
            const budgetFilter = {
                categoryId,
                period: this.currentPeriod,
                year: this.currentYear,
                month: this.currentPeriod === 'monthly' ? this.currentMonth : null
            };
            
            console.log("Bütçe filtreleniyor:", budgetFilter);
            
            // Eğer alt kategori belirtilmişse filtreye ekle
            if (subcategoryId) {
                console.log("Alt kategori ID'si ile filtreleniyor:", subcategoryId);
                // getBudgets fonksiyonu subcategoryId filtrelemesini desteklemediği için 
                // sonuçları manuel olarak filtreleyeceğiz
                const budgets = await dataManager.getBudgets(budgetFilter) || [];
                console.log("Alınan bütçeler:", budgets);
                
                const budgetsArray = Array.isArray(budgets) ? budgets : [];
                const filteredBudgets = budgetsArray.filter(b => b.subcategoryId === subcategoryId);
                console.log("Alt kategori filtrelenmiş bütçeler:", filteredBudgets);
                
                existingBudget = filteredBudgets[0] || null;
            } else {
                console.log("Sadece kategori düzeyindeki bütçeler alınıyor");
                // Sadece kategori düzeyindeki bütçeleri al (subcategoryId = null olanlar)
                const budgets = await dataManager.getBudgets(budgetFilter) || [];
                console.log("Alınan bütçeler:", budgets);
                
                const budgetsArray = Array.isArray(budgets) ? budgets : [];
                const filteredBudgets = budgetsArray.filter(b => !b.subcategoryId || b.subcategoryId === null);
                console.log("Kategori düzeyi filtrelenmiş bütçeler:", filteredBudgets);
                
                existingBudget = filteredBudgets[0] || null;
            }
            
            console.log("Bulunan mevcut bütçe:", existingBudget);
        }

        const modal = createModal(
            existingBudget ? 'Bütçe Planını Düzenle' : 'Yeni Bütçe Planı',
            `
            <form id="budgetPlanForm" class="space-y-4">
                <div>
                    <label class="form-label">Kategori</label>
                    <select id="budgetCategoryId" class="form-control" required ${categoryId ? 'disabled' : ''}>
                        <option value="">Kategori seçin</option>
                        ${Object.keys(categories).map(type => 
                            categories[type].map(cat => 
                                `<option value="${cat.id}" ${existingBudget?.categoryId === cat.id ? 'selected' : ''}>
                                    ${cat.name} (${type === 'income' ? 'Gelir' : 'Gider'})
                                </option>`
                            ).join('')
                        ).join('')}
                    </select>
                </div>
                
                <div id="subcategoryContainer">
                    <label class="form-label">Alt Kategori</label>
                    <select id="budgetSubcategoryId" class="form-control">
                        <option value="">Alt kategori seçin (opsiyonel)</option>
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Dönem</label>
                        <select id="budgetPeriod" class="form-control" required>
                            <option value="monthly" ${this.currentPeriod === 'monthly' ? 'selected' : ''}>Aylık</option>
                            <option value="yearly" ${this.currentPeriod === 'yearly' ? 'selected' : ''}>Yıllık</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Yıl</label>
                        <select id="budgetYear" class="form-control" required>
                            ${Array.from({length: 8}, (_, i) => this.currentYear - 3 + i).map(year => 
                                `<option value="${year}" ${year === this.currentYear ? 'selected' : ''}>${year}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div id="budgetMonthGroup">
                    <label class="form-label">Ay</label>
                    <select id="budgetMonth" class="form-control">
                        ${Array.from({length: 12}, (_, i) => {
                            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                                               'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                            return `<option value="${i + 1}" ${i + 1 === this.currentMonth ? 'selected' : ''}>${monthNames[i]}</option>`;
                        }).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="form-label">Planlanan Tutar</label>
                    <input type="number" id="budgetAmount" class="form-control" 
                           value="${existingBudget ? existingBudget.plannedAmount : ''}" 
                           step="0.01" min="0" placeholder="0.00" required>
                </div>
                
                <div>
                    <label class="form-label">Açıklama</label>
                    <textarea id="budgetDescription" class="form-control" 
                              placeholder="Bütçe planı için açıklama girin (opsiyonel)">${existingBudget?.description || ''}</textarea>
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="createPlannedTransaction" class="form-checkbox h-4 w-4 text-teal-600">
                    <label class="ml-2 text-sm text-gray-700" for="createPlannedTransaction">
                        Planlanan işlem olarak ekle
                    </label>
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
                    text: existingBudget ? 'Güncelle' : 'Kaydet',
                    class: 'bg-teal-500 hover:bg-teal-600 text-white',
                    onclick: `reportManager.saveBudgetPlan(${existingBudget ? `'${existingBudget.id}'` : 'null'})`
                }
            ]
        );

        // Dönem değişikliğinde ay seçicisini göster/gizle
        const periodSelect = modal.querySelector('#budgetPeriod');
        const monthGroup = modal.querySelector('#budgetMonthGroup');
        
        const toggleMonthGroup = () => {
            monthGroup.style.display = periodSelect.value === 'monthly' ? 'block' : 'none';
        };
        
        periodSelect.addEventListener('change', toggleMonthGroup);
        toggleMonthGroup();

        // Kategori önceden seçilmişse disable et
        if (categoryId) {
            modal.querySelector('#budgetCategoryId').value = categoryId;
        }

        // Alt kategorileri güncelle fonksiyonu
        const updateSubcategories = async (selectedCategoryId) => {
            const subcategorySelect = document.getElementById('budgetSubcategoryId');
            subcategorySelect.innerHTML = '<option value="">Alt kategori seçin (opsiyonel)</option>';
            
            if (!selectedCategoryId) return;
            
            // Seçili kategoriye ait alt kategorileri bul
            const category = await dataManager.getCategoryById(selectedCategoryId);
            if (category && category.subcategories && category.subcategories.length > 0) {
                category.subcategories.forEach(subcategory => {
                    const option = document.createElement('option');
                    option.value = subcategory.id;
                    option.textContent = subcategory.name;
                    
                    // Mevcut bütçede bu alt kategori seçili mi kontrol et
                    if (existingBudget && existingBudget.subcategoryId === subcategory.id) {
                        option.selected = true;
                    }
                    
                    subcategorySelect.appendChild(option);
                });
                
                document.getElementById('subcategoryContainer').style.display = 'block';
            } else {
                document.getElementById('subcategoryContainer').style.display = 'none';
            }
        };
        
        // Kategori değiştiğinde alt kategorileri güncelle
        const categorySelect = modal.querySelector('#budgetCategoryId');
        categorySelect.addEventListener('change', async (e) => {
            try {
                await updateSubcategories(e.target.value);
            } catch (error) {
                console.error('Alt kategori güncelleme hatası:', error);
            }
        });
        
        // İlk yüklemeyle alt kategorileri göster/gizle
        try {
            await updateSubcategories(categorySelect.value);
        } catch (error) {
            console.error('İlk alt kategori yükleme hatası:', error);
        }
    }

    /**
     * Bütçe planı kaydet
     */
    async saveBudgetPlan(existingBudgetId = null) {
        const categoryId = document.getElementById('budgetCategoryId').value;
        const subcategoryId = document.getElementById('budgetSubcategoryId')?.value || null;
        const period = document.getElementById('budgetPeriod').value;
        const year = parseInt(document.getElementById('budgetYear').value);
        const month = period === 'monthly' ? parseInt(document.getElementById('budgetMonth').value) : null;
        const amount = parseFloat(document.getElementById('budgetAmount').value);
        const description = document.getElementById('budgetDescription')?.value || '';
        const createPlannedTransaction = document.getElementById('createPlannedTransaction').checked;

        if (!categoryId || !amount || amount <= 0) {
            showToast('Lütfen tüm alanları doldurun!', 'error');
            return;
        }

        const budgetData = {
            id: existingBudgetId,
            categoryId,
            subcategoryId: subcategoryId || null,
            period,
            year,
            month,
            plannedAmount: amount,
            description: description
        };

        const savedBudget = await dataManager.setBudget(budgetData);
        
        if (savedBudget) {
            // Modalı kapat
            document.getElementById('modalContainer').innerHTML = '';
            
            // İsteğe bağlı olarak planlanan işlem oluştur
            if (createPlannedTransaction) {
                await this.createPlannedTransactionFromBudget(savedBudget);
                showToast('Bütçe planı ve planlanan işlem başarıyla oluşturuldu!', 'success');
            } else {
                showToast('Bütçe planı başarıyla kaydedildi!', 'success');
            }
            
            // Bütçe raporunu güncelle
            this.generateReport();
            
            // Dashboard ve diğer bölümleri güncelle
            this.updateOtherSections();
        }
    }
    
    /**
     * Bütçe planından planlanan işlem oluştur
     */
    async createPlannedTransactionFromBudget(budget) {
        const category = await dataManager.getCategoryById(budget.categoryId);
        if (!category) return;
        
        // İşlem tarihini belirle
        let transactionDate;
        if (budget.period === 'monthly') {
            // Ayın ilk günü
            transactionDate = new Date(budget.year, budget.month - 1, 1);
        } else {
            // Yılın ilk günü
            transactionDate = new Date(budget.year, 0, 1);
        }
        
        // Aktif hesaplardan ilkini al veya varsayılan olarak ilk hesabı
        let accountId = null;
        try {
            const accounts = await dataManager.getAccounts(true) || [];
            console.log('Retrieved accounts for planned transaction:', accounts);
            
            const accountsArray = Array.isArray(accounts) ? accounts : [];
            
            if (accountsArray.length === 0) {
                console.warn('No active accounts found. Attempting to get any account...');
                // Aktif hesap yoksa herhangi bir hesabı kullan
                const allAccounts = await dataManager.getAccounts(false) || [];
                const allAccountsArray = Array.isArray(allAccounts) ? allAccounts : [];
                
                if (allAccountsArray.length === 0) {
                    showToast('İşlem oluşturmak için hesap bulunamadı! Lütfen önce bir hesap ekleyin.', 'error');
                    return;
                }
                
                accountId = allAccountsArray[0].id;
                console.log('Using non-active account:', allAccountsArray[0]);
            } else {
                accountId = accountsArray[0].id;
            }
            
            if (!accountId) {
                showToast('İşlem oluşturmak için geçerli hesap bulunamadı!', 'error');
                return;
            }
        } catch (error) {
            console.error('Hesapları getirirken hata oluştu:', error);
            showToast('Hesaplar yüklenirken bir hata oluştu!', 'error');
            return;
        }
        
        // Bütçe açıklaması oluştur
        const periodText = budget.period === 'monthly' ? 
            `${new Date(budget.year, budget.month - 1).toLocaleDateString('tr-TR', { month: 'long' })} ${budget.year}` : 
            `${budget.year} yılı`;
        
        let description = `Bütçe: ${category.name}`;
        
        // Alt kategori bilgisi varsa açıklamaya ekle
        if (budget.subcategoryId) {
            const subcategory = category.subcategories.find(s => s.id === budget.subcategoryId);
            if (subcategory) {
                description += ` - ${subcategory.name}`;
            }
        }
        
        description += ` (${periodText})`;
        
        // Bütçe açıklaması varsa ekle
        if (budget.description) {
            description += ` - ${budget.description}`;
        }
        
        // Planlanan işlemi oluştur
        const transaction = {
            type: category.type,
            categoryId: budget.categoryId,
            subcategoryId: budget.subcategoryId,
            accountId: accountId,
            description: description,
            plannedAmount: budget.plannedAmount,
            date: transactionDate.toISOString().split('T')[0],
            status: 'planned'
        };
        
        const result = await dataManager.addTransaction(transaction);
        
        if (result) {
            // Not: Ana saveBudgetPlan metodunda zaten toast gösteriliyor, burada ekstra mesaj göstermeye gerek yok
            console.log('Planlanan işlem başarıyla oluşturuldu:', result);
        }
    }

    /**
     * Bütçe planını düzenle
     */
    async editBudgetPlan(categoryId, subcategoryId = null) {
        try {
            // Kategori ve alt kategori ID'sini birlikte değerlendirerek bütçe plan modalını göster
            await this.showBudgetPlanModal(categoryId, subcategoryId);
        } catch (error) {
            console.error('Bütçe planı düzenleme hatası:', error);
        }
    }

    /**
     * Bütçe planını sil
     */
    deleteBudgetPlan(budgetId) {
        if (confirm('Bu bütçe planını silmek istediğinizden emin misiniz?')) {
            if (dataManager.deleteBudget(budgetId)) {
                // Bütçe raporunu güncelle
                this.generateReport();
                
                // Dashboard ve diğer bölümleri güncelle
                this.updateOtherSections();
            }
        }
    }

    /**
     * Bütçe raporunu export et
     */
    exportBudgetReport() {
        // Kullanıcıya format seçeneği sor
        const options = {
            title: 'Rapor Formatı Seçin',
            message: 'Raporu hangi formatta indirmek istiyorsunuz?',
            buttons: [
                {
                    text: 'JSON',
                    value: 'json',
                    class: 'bg-blue-500 hover:bg-blue-600 text-white'
                },
                {
                    text: 'Excel',
                    value: 'excel',
                    class: 'bg-green-500 hover:bg-green-600 text-white'
                }
            ],
            callback: (format) => {
                this._executeBudgetExport(format);
            }
        };
        
        // Seçenek modelini göster
        this.showFormatSelectionModal(options);
    }
    
    /**
     * Format seçimi modalını göster
     */
    showFormatSelectionModal(options) {
        const modal = createModal(
            options.title,
            `
            <div class="space-y-6">
                <p class="text-gray-700">${options.message}</p>
            </div>
            `,
            options.buttons.map(button => ({
                text: button.text,
                class: button.class,
                onclick: `reportManager._formatModalCallback('${button.value}')`
            }))
        );
        
        // Callback'i sakla
        this._formatSelectionCallback = options.callback;
    }
    
    /**
     * Format seçim modalı callback
     */
    _formatModalCallback(format) {
        // Modalı kapat
        document.getElementById('modalContainer').innerHTML = '';
        
        // Callback'i çağır
        if (this._formatSelectionCallback) {
            this._formatSelectionCallback(format);
        }
    }
    
    /**
     * Bütçe raporunu seçilen formatta export et
     */
    _executeBudgetExport(format) {
        const month = this.currentPeriod === 'monthly' ? this.currentMonth : null;
        const analysis = dataManager.getBudgetAnalysis(this.currentYear, month);

        const reportData = {
            reportInfo: {
                type: 'budget-analysis',
                period: this.currentPeriod,
                year: this.currentYear,
                month: this.currentMonth,
                generatedAt: new Date().toISOString()
            },
            analysis,
            summary: {
                totalPlanned: analysis.reduce((sum, item) => sum + item.plannedAmount, 0),
                totalActual: analysis.reduce((sum, item) => sum + item.actualAmount, 0),
                categoriesCount: analysis.length
            }
        };

        if (format === 'json') {
            // JSON formatında indir
            const filename = `butce_raporu_${this.currentYear}${month ? `_${month.toString().padStart(2, '0')}` : ''}.json`;
            const jsonString = JSON.stringify(reportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Bütçe raporu başarıyla indirildi!', 'success');
        } 
        else if (format === 'excel') {
            // Excel formatında indir
            if (this.currentPeriod === 'monthly') {
                exportImportManager.createMonthlyExcelReport(this.currentYear, this.currentMonth);
            } else {
                exportImportManager.createYearlyExcelReport(this.currentYear);
            }
        }
    }
    
    /**
     * Aylık Excel raporunu export et
     */
    exportMonthlyExcel() {
        exportImportManager.createMonthlyExcelReport(this.currentYear, this.currentMonth);
    }
    
    /**
     * Yıllık Excel raporunu export et
     */
    exportYearlyExcel() {
        exportImportManager.createYearlyExcelReport(this.currentYear);
    }
    
    /**
     * Pivot Excel raporunu export et
     */
    exportPivotExcel() {
        this.showPivotOptionsModal();
    }
    
    /**
     * Pivot Excel raporu için seçenekler modalını göster
     */
    showPivotOptionsModal() {
        const modal = createModal(
            'Pivot Excel Raporu',
            `
            <div class="space-y-6">
                <p class="text-gray-600">Kategori ve zaman bazlı pivot Excel raporu oluşturun. Kategoriler X ekseninde, Yıl ve Aylar Y ekseninde gösterilecektir.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rapor Türü</label>
                        <select id="pivotReportType" class="w-full p-2 border border-gray-300 rounded">
                            <option value="expense">Gider Raporu</option>
                            <option value="income">Gelir Raporu</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Zaman Aralığı</label>
                        <select id="pivotTimeRange" class="w-full p-2 border border-gray-300 rounded">
                            <option value="1">Son 12 ay</option>
                            <option value="2">Son 24 ay</option>
                            <option value="3">Son 36 ay</option>
                            <option value="custom">Özel Aralık</option>
                        </select>
                    </div>
                </div>
                
                <div id="customDateRange" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                        <input type="date" id="pivotStartDate" class="w-full p-2 border border-gray-300 rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                        <input type="date" id="pivotEndDate" class="w-full p-2 border border-gray-300 rounded">
                    </div>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i data-lucide="info" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                        <div class="text-sm">
                            <p class="text-blue-800 font-medium">Pivot Raporu Hakkında</p>
                            <p class="text-blue-700">
                                Bu rapor, seçilen zaman aralığındaki tüm kategorileri aylık olarak gruplandırır. Her kategori bir sütunda, her ay bir satırda gösterilir. Bu sayede kategorilerin zaman içindeki değişimini kolayca görüntüleyebilirsiniz.
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
                    text: 'Rapor Oluştur',
                    class: 'bg-blue-500 hover:bg-blue-600 text-white',
                    onclick: 'reportManager.createPivotExcelReport()'
                }
            ]
        );
        
        // Tarih aralığı seçimi event listener'ı
        const timeRangeSelect = document.getElementById('pivotTimeRange');
        const customDateRange = document.getElementById('customDateRange');
        
        timeRangeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customDateRange.classList.remove('hidden');
                
                // Varsayılan olarak son 12 ay
                const today = new Date();
                const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                const startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);
                
                document.getElementById('pivotStartDate').value = startDate.toISOString().split('T')[0];
                document.getElementById('pivotEndDate').value = endDate.toISOString().split('T')[0];
            } else {
                customDateRange.classList.add('hidden');
            }
        });
        
        // İkonları yenile
        lucide.createIcons();
    }

    /**
     * Pivot Excel raporu oluştur
     */
    async createPivotExcelReport() {
        try {
            showToast('Pivot raporu oluşturuluyor...', 'info');
            
            // Form değerlerini al
            const reportType = document.getElementById('pivotReportType')?.value || 'expense';
            const timeRange = document.getElementById('pivotTimeRange')?.value || '1';
            
            let startDate, endDate;
            const today = new Date();
            
            // Tarih aralığını belirle
            if (timeRange === 'custom') {
                startDate = document.getElementById('pivotStartDate')?.value;
                endDate = document.getElementById('pivotEndDate')?.value;
                
                if (!startDate || !endDate) {
                    showToast('Lütfen tarih aralığını belirtin', 'error');
                    return;
                }
            } else {
                // Son X ay
                const months = parseInt(timeRange) * 12;
                // Ay sonu: Bugünün ayının son günü
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                endDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${lastDay}`;
                console.log(`Otomatik hesaplanan bitiş tarihi: ${endDate}`);
                
                // Başlangıç tarihi, bitiş tarihinden months ay öncesi
                // Ay başı olarak belirle (1. gün)
                const startYear = today.getFullYear() - Math.floor(months / 12);
                const startMonth = today.getMonth() - (months % 12);
                // Ay değerini düzelt (negatif değerler için)
                const normalizedMonth = startMonth < 0 ? 12 + startMonth : startMonth;
                const normalizedYear = startMonth < 0 ? startYear - 1 : startYear;
                
                startDate = `${normalizedYear}-${(normalizedMonth + 1).toString().padStart(2, '0')}-01`;
                console.log(`Otomatik hesaplanan başlangıç tarihi: ${startDate}`);
            }
            
            // Kategori verilerini al
            const categories = await dataManager.getCategories();
            const categoryList = categories[reportType] || [];
            
            if (categoryList.length === 0) {
                showToast(`Hiç ${reportType === 'income' ? 'gelir' : 'gider'} kategorisi bulunamadı`, 'error');
                return;
            }
            
            console.log('Pivot raporu tarih aralığı:', {startDate, endDate});
            console.log('Kategori sayısı:', categoryList.length);
            
            // Ay listesini oluştur
            const monthList = this.getMonthsBetweenDates(startDate, endDate);
            console.log('Ay sayısı:', monthList.length);
            
            if (monthList.length === 0) {
                showToast('Geçerli bir tarih aralığı seçin', 'error');
                return;
            }
            
            // Tüm işlemleri al - tam tarih aralığını kullanarak
            // startDate'in başlangıcı (00:00:00) ve endDate'in sonu (23:59:59) dahil olmalı
            console.log(`Tam tarih aralığı için işlemleri getiriyorum: ${startDate} - ${endDate}`);
            const transactions = await dataManager.getTransactions({
                startDate: startDate,
                endDate: endDate,
                type: reportType
            });
            
            console.log('İşlem sayısı:', transactions.length);
            
            // Pivot tablo verilerini hazırla
            const pivotData = this.preparePivotData(transactions, categoryList, monthList);
            
            // Excel dosyası oluştur
            await this.generatePivotExcel(pivotData, reportType, startDate, endDate);
            
            // Modalı kapat
            document.getElementById('modalContainer').innerHTML = '';
            
        } catch (error) {
            console.error('Pivot raporu oluşturma hatası:', error);
            showToast('Pivot raporu oluşturulurken hata oluştu!', 'error');
        }
    }
    
    /**
     * İki tarih arasındaki ayları listele
     * @param {string} startDateStr - Başlangıç tarihi (YYYY-MM-DD formatında)
     * @param {string} endDateStr - Bitiş tarihi (YYYY-MM-DD formatında)
     * @returns {Array} Ay bilgilerini içeren dizi
     */
    getMonthsBetweenDates(startDateStr, endDateStr) {
        // String tarihlerden Date nesneleri oluştur
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        console.log(`getMonthsBetweenDates: ${startDateStr} to ${endDateStr}`);
        console.log(`Start date: ${startDate}, End date: ${endDate}`);
        
        const months = [];
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        
        // Ay/yıl olarak başlangıç ve bitiş (0-indexed aylar)
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const endMonth = endDate.getMonth();
        const endYear = endDate.getFullYear();
        
        console.log(`Start: ${startYear}-${startMonth+1}, End: ${endYear}-${endMonth+1}`);
        
        // Her ay için
        let currentYear = startYear;
        let currentMonth = startMonth;
        
        while (
            (currentYear < endYear) || 
            (currentYear === endYear && currentMonth <= endMonth)
        ) {
            // Ay bilgisini formatla ve ekle
            const monthKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
            const monthName = `${monthNames[currentMonth]} ${currentYear}`;
            
            months.push({
                key: monthKey,
                name: monthName,
                year: currentYear,
                month: currentMonth + 1
            });
            
            // Sonraki aya geç
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }
        
        return months;
    }
    
    /**
     * Pivot tablo verilerini hazırla
     */
    preparePivotData(transactions, categories, monthList) {
        // Kategori bilgilerini hazırla
        const categoryInfo = {};
        categories.forEach(category => {
            categoryInfo[category.id] = {
                id: category.id,
                name: category.name,
                color: category.color,
                subcategories: {}
            };
            
            // Alt kategorileri hazırla
            if (category.subcategories && Array.isArray(category.subcategories)) {
                category.subcategories.forEach(subcategory => {
                    categoryInfo[category.id].subcategories[subcategory.id] = {
                        id: subcategory.id,
                        name: subcategory.name,
                        color: subcategory.color || category.color
                    };
                });
            }
        });
        
        // Ay bazında kategori toplamlarını hesapla
        const pivotData = {};
        
        // Tüm aylar için boş bir tablo oluştur
        monthList.forEach(monthInfo => {
            pivotData[monthInfo.key] = {
                name: monthInfo.name,
                year: monthInfo.year,
                month: monthInfo.month,
                categories: {}
            };
            
            // Her kategori için 0 başlangıç değeri ata
            categories.forEach(category => {
                pivotData[monthInfo.key].categories[category.id] = {
                    id: category.id,
                    name: category.name,
                    amount: 0,
                    subcategories: {}
                };
                
                // Alt kategoriler için de 0 başlangıç değeri ata
                if (category.subcategories && Array.isArray(category.subcategories)) {
                    category.subcategories.forEach(subcategory => {
                        pivotData[monthInfo.key].categories[category.id].subcategories[subcategory.id] = {
                            id: subcategory.id,
                            name: subcategory.name,
                            amount: 0
                        };
                    });
                }
            });
        });
        
        // İşlemleri pivot tabloya ekle
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const monthKey = `${transactionDate.getFullYear()}-${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}`;
            
            // Bu ay pivot tabloda var mı?
            if (pivotData[monthKey]) {
                const categoryId = transaction.categoryId;
                const subcategoryId = transaction.subcategoryId;
                const amount = transaction.amount || 0;
                
                // Ana kategori toplamını güncelle
                if (pivotData[monthKey].categories[categoryId]) {
                    pivotData[monthKey].categories[categoryId].amount += amount;
                    
                    // Alt kategori toplamını güncelle
                    if (subcategoryId && pivotData[monthKey].categories[categoryId].subcategories[subcategoryId]) {
                        pivotData[monthKey].categories[categoryId].subcategories[subcategoryId].amount += amount;
                    }
                }
            }
        });
        
        return {
            monthList,
            categories,
            categoryInfo,
            pivotData
        };
    }
    
    /**
     * Pivot Excel raporu oluştur
     */
    async generatePivotExcel(pivotData, reportType, startDate, endDate) {
        try {
            // XLSX kontrolü
            if (typeof XLSX === 'undefined') {
                console.error('XLSX kütüphanesi yüklenmemiş!');
                showToast('Excel kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'error');
                return false;
            }
            
            // Rapor başlığını hazırla
            const reportTitle = reportType === 'income' ? 'Gelir' : 'Gider';
            
            // Workbook oluştur
            const workbook = XLSX.utils.book_new();
            workbook.Props = {
                Title: `Pivot ${reportTitle} Raporu`,
                Subject: "Bütçe Takibi",
                Author: "Bütçe Takibi Uygulaması",
                CreatedDate: new Date()
            };
            
            // Pivot sayfa verileri
            const pivotSheetData = [];
            
            // Başlık satırı
            pivotSheetData.push([
                `Pivot ${reportTitle} Raporu`,
                `${formatDate(startDate)} - ${formatDate(endDate)}`
            ]);
            pivotSheetData.push([""]);
            
            // Sütun başlıkları
            const headerRow = ["Ay / Kategori"];
            
            // Kategorileri ekle
            pivotData.categories.forEach(category => {
                headerRow.push(category.name);
                
                // Alt kategorileri ekle
                if (category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
                    category.subcategories.forEach(subcategory => {
                        headerRow.push(`${category.name} / ${subcategory.name}`);
                    });
                }
            });
            
            // Toplam sütunu
            headerRow.push("Toplam");
            
            pivotSheetData.push(headerRow);
            
            // Ay satırları
            pivotData.monthList.forEach(monthInfo => {
                const monthData = pivotData.pivotData[monthInfo.key];
                const row = [monthInfo.name];
                
                let monthTotal = 0;
                
                // Her kategori için tutarları ekle
                pivotData.categories.forEach(category => {
                    const categoryAmount = monthData.categories[category.id]?.amount || 0;
                    row.push(categoryAmount);
                    monthTotal += categoryAmount;
                    
                    // Alt kategoriler için tutarları ekle
                    if (category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
                        category.subcategories.forEach(subcategory => {
                            const subcategoryAmount = monthData.categories[category.id]?.subcategories[subcategory.id]?.amount || 0;
                            row.push(subcategoryAmount);
                        });
                    }
                });
                
                // Ay toplamını ekle
                row.push(monthTotal);
                
                pivotSheetData.push(row);
            });
            
            // Toplam satırı
            const totalRow = ["Toplam"];
            let grandTotal = 0;
            
            // Her kategori için toplam
            pivotData.categories.forEach(category => {
                let categoryTotal = 0;
                
                // Tüm aylar üzerinden topla
                pivotData.monthList.forEach(monthInfo => {
                    categoryTotal += pivotData.pivotData[monthInfo.key].categories[category.id]?.amount || 0;
                });
                
                totalRow.push(categoryTotal);
                grandTotal += categoryTotal;
                
                // Alt kategoriler için toplam
                if (category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
                    category.subcategories.forEach(subcategory => {
                        let subcategoryTotal = 0;
                        
                        // Tüm aylar üzerinden topla
                        pivotData.monthList.forEach(monthInfo => {
                            subcategoryTotal += pivotData.pivotData[monthInfo.key].categories[category.id]?.subcategories[subcategory.id]?.amount || 0;
                        });
                        
                        totalRow.push(subcategoryTotal);
                    });
                }
            });
            
            // Genel toplamı ekle
            totalRow.push(grandTotal);
            
            pivotSheetData.push(totalRow);
            
            // Pivot sayfasını oluştur
            const pivotSheet = XLSX.utils.aoa_to_sheet(pivotSheetData);
            
            // Stil ayarları
            pivotSheet['!cols'] = [{ wch: 20 }]; // İlk sütun genişliği
            for (let i = 1; i < headerRow.length; i++) {
                pivotSheet['!cols'].push({ wch: 15 }); // Diğer sütunların genişliği
            }
            
            // Sayfayı ekle
            XLSX.utils.book_append_sheet(workbook, pivotSheet, "Pivot Rapor");
            
            // Kategori özet sayfası
            const categorySheetData = [];
            
            // Başlık
            categorySheetData.push([`${reportTitle} Kategorileri Özeti`]);
            categorySheetData.push([""]);
            categorySheetData.push(["Kategori", "Toplam", "Aylık Ortalama", "Yüzde"]);
            
            // Kategori toplamlarını hesapla
            const categoryTotals = [];
            
            pivotData.categories.forEach(category => {
                let total = 0;
                
                // Tüm aylar üzerinden topla
                pivotData.monthList.forEach(monthInfo => {
                    total += pivotData.pivotData[monthInfo.key].categories[category.id]?.amount || 0;
                });
                
                categoryTotals.push({
                    id: category.id,
                    name: category.name,
                    total: total
                });
            });
            
            // Toplamı hesapla
            const totalAmount = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);
            
            // Kategori verilerini ekle
            categoryTotals.sort((a, b) => b.total - a.total).forEach(cat => {
                const monthlyAverage = cat.total / pivotData.monthList.length;
                const percentage = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
                
                categorySheetData.push([
                    cat.name,
                    cat.total,
                    monthlyAverage,
                    percentage.toFixed(2) + '%'
                ]);
            });
            
            // Toplamı ekle
            categorySheetData.push([
                "Toplam",
                totalAmount,
                totalAmount / pivotData.monthList.length,
                "100%"
            ]);
            
            // Kategori sayfasını oluştur
            const categorySheet = XLSX.utils.aoa_to_sheet(categorySheetData);
            
            // Sayfayı ekle
            XLSX.utils.book_append_sheet(workbook, categorySheet, "Kategori Özeti");
            
            // Excel dosyasını indir
            const filename = `pivot_${reportType}_raporu_${startDate}_${endDate}.xlsx`;
            XLSX.writeFile(workbook, filename);
            
            showToast('Pivot raporu başarıyla oluşturuldu!', 'success');
            return true;
            
        } catch (error) {
            console.error('Pivot Excel raporu oluşturma hatası:', error);
            showToast('Pivot Excel raporu oluşturulurken hata oluştu!', 'error');
            return false;
        }
    }
    
    /**
     * Yardımcı metodlar
     */
    getStatusClass(status) {
        const classes = {
            'over-budget': 'budget-over',
            'near-budget': 'budget-near', 
            'on-budget': 'budget-on',
            'under-budget': 'budget-under'
        };
        return classes[status] || '';
    }

    getStatusText(status) {
        const texts = {
            'over-budget': 'Aşım',
            'near-budget': 'Sınırda',
            'on-budget': 'Hedefte', 
            'under-budget': 'Altında'
        };
        return texts[status] || status;
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
     * Grafikleri temizle
     */
    destroyCharts() {
        Object.keys(this.budgetCharts).forEach(key => {
            const chartInstance = this.budgetCharts[key];
            const canvasId = {
                'overview': 'budgetOverviewChart',
                'status': 'budgetStatusChart',
                'tagAnalysis': 'tagAnalysisChart',
                'categoryAnalysis': 'categoryAnalysisChart'
            }[key];
            
            if (canvasId) {
                const canvas = document.getElementById(canvasId);
                if (canvas) {
                    this.safelyDestroyChart(canvas, chartInstance);
                } else if (chartInstance && typeof chartInstance.destroy === 'function') {
                    try {
                        chartInstance.destroy();
                    } catch (error) {
                        console.error(`Error destroying ${key} chart:`, error);
                    }
                }
            }
            this.budgetCharts[key] = null;
        });
        this.budgetCharts = {};
    }
    
    /**
     * Diğer bölümleri güncelle (Dashboard, özet, grafikler vb.)
     */
    updateOtherSections() {
        // app.js'deki güncellemeleri tetikle
        if (typeof app !== 'undefined' && app.updateDashboard) {
            console.log("Dashboard güncelleniyor...");
            app.updateDashboard();
        }
        
        // Eğer chartManager varsa grafikleri güncelle
        if (typeof chartManager !== 'undefined' && chartManager.updateCharts) {
            console.log("Grafikler güncelleniyor...");
            chartManager.updateCharts();
        }
        
        // İşlem tablosunu güncelle
        if (typeof tableManager !== 'undefined' && tableManager.refreshTable) {
            console.log("İşlem tablosu güncelleniyor...");
            try {
                // Since refreshTable is now async, handle it properly
                tableManager.refreshTable().catch(error => {
                    console.error("Error refreshing transaction table:", error);
                });
            } catch (error) {
                console.error("Error calling table refresh:", error);
            }
        }
        
        // Kategoriler ve hesaplar bölümünü güncelle
        if (typeof categoryManager !== 'undefined') {
            console.log("Kategoriler ve hesaplar güncelleniyor...");
            categoryManager.renderCategories();
        }
    }
    
    /**
     * Excel bütçe şablonunu dışa aktar
     */
    exportBudgetTemplate() {
        try {
            // Tüm kategorileri al
            const categories = dataManager.getCategories();
            
            // Boş bir workbook oluştur
            const workbook = XLSX.utils.book_new();
            workbook.Props = {
                Title: "Bütçe Planı Şablonu",
                Subject: "Bütçe Takibi",
                Author: "Bütçe Takibi Uygulaması",
                CreatedDate: new Date()
            };
            
            // Şablonun açıklamalarını içeren sayfa oluştur
            const instructionsData = [
                ["Bütçe Planı İçe Aktarma Şablonu", ""],
                [""],
                ["Talimatlar:"],
                ["1. 'Bütçe Planları' sekmesini kullanarak bütçe planlarınızı toplu olarak girebilirsiniz."],
                ["2. Gerekli tüm alanları doldurduğunuzdan emin olun (Kategori, Tutar)."],
                ["3. Kategori sütununda tam olarak 'Kategoriler' sekmesindeki isimleri kullanmalısınız."],
                ["4. Dönem sütununda 'Aylık' veya 'Yıllık' değerlerini kullanabilirsiniz."],
                ["5. Dosyayı kaydedin ve 'Excel'den İçe Aktar' butonunu kullanarak yükleyin."],
                [""],
                ["Not: Kategori ve Alt Kategori isimleri, sistemde tanımlı olanlarla tam olarak eşleşmelidir."],
                [""],
                ["Tarih:", new Date().toLocaleDateString()]
            ];
            
            // Kategori listesi sayfası oluştur
            const categoryData = [
                ["Kategori Listesi", ""],
                [""],
                ["Kategori", "Tür", "Alt Kategoriler"]
            ];
            
            // Gelir kategorilerini ekle
            categories.income.forEach(category => {
                const subcategories = category.subcategories?.map(s => s.name).join(", ") || "-";
                categoryData.push([category.name, "Gelir", subcategories]);
            });
            
            // Gider kategorilerini ekle
            categories.expense.forEach(category => {
                const subcategories = category.subcategories?.map(s => s.name).join(", ") || "-";
                categoryData.push([category.name, "Gider", subcategories]);
            });
            
            // Bütçe planları sayfası için şablon oluştur
            const templateData = [
                ["Bütçe Planları", `Dönem: ${this.currentPeriod === 'monthly' ? 'Aylık' : 'Yıllık'}, Yıl: ${this.currentYear}${this.currentPeriod === 'monthly' ? `, Ay: ${this.currentMonth}` : ''}`],
                [""],
                ["Kategori", "Alt Kategori", "Dönem", "Yıl", "Ay", "Planlanan Tutar", "Açıklama", "İşlem Oluştur"]
            ];
            
            // Örnek veri ekle
            templateData.push(
                ["Market", "", "Aylık", this.currentYear, this.currentMonth, 1500, "Haftalık alışveriş", "Evet"],
                ["Kira", "", "Aylık", this.currentYear, this.currentMonth, 3000, "Ev kirası", "Evet"],
                ["Maaş", "Yan Gelir", "Aylık", this.currentYear, this.currentMonth, 15000, "Part-time iş geliri", "Hayır"]
            );
            
            // Sayfaları ekle
            const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
            const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
            const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
            
            XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Talimatlar");
            XLSX.utils.book_append_sheet(workbook, categorySheet, "Kategoriler");
            XLSX.utils.book_append_sheet(workbook, templateSheet, "Bütçe Planları");
            
            // Excel dosyasını indir
            const filename = `butce_plani_sablonu_${this.currentYear}${this.currentPeriod === 'monthly' ? `_${this.currentMonth.toString().padStart(2, '0')}` : ''}.xlsx`;
            XLSX.writeFile(workbook, filename);
            
            showToast('Bütçe planı şablonu indirildi!', 'success');
            return true;
        } catch (error) {
            console.error('Bütçe planı şablonu oluşturma hatası:', error);
            showToast('Şablon oluşturulurken hata oluştu!', 'error');
            return false;
        }
    }
    
    /**
     * Bütçe planı içe aktarma modalını göster
     */
    showImportBudgetModal() {
        const modal = createModal(
            'Bütçe Planlarını İçe Aktar',
            `
            <div class="space-y-6">
                <!-- Dosya Seçimi -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Excel Dosyası Seçin</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <i data-lucide="upload" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                        <p class="text-gray-600 mb-2">Dosyayı buraya sürükleyin veya seçin</p>
                        <button id="selectBudgetFileBtn" class="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm">
                            Dosya Seç
                        </button>
                        <input type="file" id="importBudgetFileInput" accept=".xlsx, .xls" class="hidden">
                    </div>
                    <div id="selectedBudgetFile" class="hidden mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div class="flex items-center space-x-2">
                            <i data-lucide="file-spreadsheet" class="w-4 h-4 text-green-600"></i>
                            <span id="budgetFileName" class="text-sm text-green-800"></span>
                            <span id="budgetFileSize" class="text-sm text-green-600"></span>
                        </div>
                    </div>
                </div>

                <!-- İçe Aktarma Seçenekleri -->
                <div id="budgetImportOptions" class="hidden space-y-3">
                    <h4 class="font-medium text-gray-900 mb-3">İçe Aktarma Seçenekleri</h4>
                    <div class="space-y-3">
                        <label class="flex items-center">
                            <input type="checkbox" id="createTransactionsOption" checked class="mr-2">
                            <span class="text-sm">İşaretli planlar için planlanan işlemler oluştur</span>
                        </label>
                    </div>
                </div>

                <!-- Uyarılar -->
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-600 mt-0.5"></i>
                        <div class="text-sm">
                            <p class="text-yellow-800 font-medium">Dikkat</p>
                            <ul class="text-yellow-700 mt-1 space-y-1">
                                <li>• Excel şablonundan içe aktarma yapılırken "Bütçe Planları" sayfası kullanılır</li>
                                <li>• Kategori ve alt kategori isimleri sistemde tanımlı olanlarla eşleşmelidir</li>
                                <li>• "İşlem Oluştur" sütununda "Evet" yazılı planlar için planlanan işlemler oluşturulacaktır</li>
                                <li>• Excel şablonunu indirmek için "Excel Şablonu İndir" butonunu kullanabilirsiniz</li>
                            </ul>
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
                    text: 'İçe Aktar',
                    class: 'bg-green-500 hover:bg-green-600 text-white',
                    onclick: 'reportManager.importBudgetPlans()',
                    id: 'executeBudgetImportBtn',
                    style: 'display: none;'
                }
            ]
        );

        // File selection event listeners
        const selectFileBtn = modal.querySelector('#selectBudgetFileBtn');
        const fileInput = modal.querySelector('#importBudgetFileInput');
        
        selectFileBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleBudgetFileSelection(e.target.files[0], modal);
            }
        });

        // Drag and drop
        const dropZone = modal.querySelector('.border-dashed');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-teal-400', 'bg-teal-50');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-teal-400', 'bg-teal-50');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-teal-400', 'bg-teal-50');
            
            const files = e.dataTransfer.files;
            if (files[0] && (files[0].type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                           files[0].type === 'application/vnd.ms-excel')) {
                this.handleBudgetFileSelection(files[0], modal);
            } else {
                showToast('Lütfen geçerli bir Excel dosyası seçin!', 'error');
            }
        });

        lucide.createIcons();
    }
    
    /**
     * Bütçe planı dosya seçimini işle
     */
    handleBudgetFileSelection(file, modal) {
        const selectedFile = modal.querySelector('#selectedBudgetFile');
        const fileName = modal.querySelector('#budgetFileName');
        const fileSize = modal.querySelector('#budgetFileSize');
        const importOptions = modal.querySelector('#budgetImportOptions');
        const executeBtn = modal.querySelector('#executeBudgetImportBtn');

        // Dosya bilgilerini göster
        fileName.textContent = file.name;
        fileSize.textContent = `(${formatFileSize(file.size)})`;
        selectedFile.classList.remove('hidden');
        
        // Import seçeneklerini göster
        importOptions.classList.remove('hidden');
        
        // İçe aktar butonunu göster
        if (executeBtn) {
            executeBtn.style.display = 'inline-flex';
        }
        
        // Dosyayı sakla
        this.currentBudgetFile = file;
    }
    
    /**
     * Bütçe planlarını Excel'den içe aktar
     */
    async importBudgetPlans() {
        if (!this.currentBudgetFile) {
            showToast('Önce bir Excel dosyası seçin!', 'error');
            return;
        }
        
        const createTransactions = document.getElementById('createTransactionsOption').checked;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Excel dosyasını oku
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Bütçe Planları sayfasını kontrol et
                const sheetName = 'Bütçe Planları';
                if (!workbook.SheetNames.includes(sheetName)) {
                    showToast(`'${sheetName}' sayfası bulunamadı!`, 'error');
                    return;
                }
                
                // Sayfayı JSON'a dönüştür
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Başlık satırını kontrol et
                if (rows.length < 3) {
                    showToast('Geçersiz Excel formatı!', 'error');
                    return;
                }
                
                const headerRow = rows[2];
                const expectedHeaders = ['Kategori', 'Alt Kategori', 'Dönem', 'Yıl', 'Ay', 'Planlanan Tutar', 'Açıklama', 'İşlem Oluştur'];
                
                // Tüm gerekli başlıkların var olduğunu kontrol et
                for (const header of expectedHeaders) {
                    if (!headerRow.includes(header)) {
                        showToast(`'${header}' başlığı bulunamadı!`, 'error');
                        return;
                    }
                }
                
                // Başlık indekslerini al
                const categoryIndex = headerRow.indexOf('Kategori');
                const subcategoryIndex = headerRow.indexOf('Alt Kategori');
                const periodIndex = headerRow.indexOf('Dönem');
                const yearIndex = headerRow.indexOf('Yıl');
                const monthIndex = headerRow.indexOf('Ay');
                const amountIndex = headerRow.indexOf('Planlanan Tutar');
                const descriptionIndex = headerRow.indexOf('Açıklama');
                const createTransactionIndex = headerRow.indexOf('İşlem Oluştur');
                
                // Veri satırlarını işle
                const budgetPlans = [];
                const errors = [];
                
                for (let i = 3; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row[categoryIndex]) continue; // Boş satırları atla
                    
                    try {
                        // Kategori adını al ve ID'sini bul
                        const categoryName = row[categoryIndex]?.toString().trim();
                        if (!categoryName) {
                            errors.push(`Satır ${i+1}: Kategori boş olamaz`);
                            continue;
                        }
                        
                        // Kategorinin türünü ve ID'sini bul
                        let categoryId = null;
                        let categoryType = null;
                        
                        const categories = await dataManager.getCategories() || { income: [], expense: [] };
                        for (const type in categories) {
                            const category = categories[type].find(c => c.name === categoryName);
                            if (category) {
                                categoryId = category.id;
                                categoryType = type;
                                break;
                            }
                        }
                        
                        if (!categoryId) {
                            errors.push(`Satır ${i+1}: '${categoryName}' kategorisi bulunamadı`);
                            continue;
                        }
                        
                        // Alt kategori (varsa) adını al ve ID'sini bul
                        let subcategoryId = null;
                        const subcategoryName = row[subcategoryIndex]?.toString().trim();
                        
                        if (subcategoryName) {
                            const category = await dataManager.getCategoryById(categoryId);
                            const subcategory = category?.subcategories?.find(s => s.name === subcategoryName);
                            
                            if (!subcategory) {
                                errors.push(`Satır ${i+1}: '${subcategoryName}' alt kategorisi '${categoryName}' kategorisinde bulunamadı`);
                                continue;
                            }
                            
                            subcategoryId = subcategory.id;
                        }
                        
                        // Dönem bilgisini al
                        const periodValue = row[periodIndex]?.toString().trim();
                        let period;
                        
                        if (periodValue === 'Aylık') {
                            period = 'monthly';
                        } else if (periodValue === 'Yıllık') {
                            period = 'yearly';
                        } else {
                            errors.push(`Satır ${i+1}: Geçersiz dönem değeri. 'Aylık' veya 'Yıllık' olmalıdır.`);
                            continue;
                        }
                        
                        // Yıl bilgisini al
                        const year = parseInt(row[yearIndex]);
                        if (isNaN(year)) {
                            errors.push(`Satır ${i+1}: Geçersiz yıl değeri`);
                            continue;
                        }
                        
                        // Ay bilgisini al (aylık dönem için)
                        let month = null;
                        if (period === 'monthly') {
                            month = parseInt(row[monthIndex]);
                            if (isNaN(month) || month < 1 || month > 12) {
                                errors.push(`Satır ${i+1}: Geçersiz ay değeri. 1-12 arasında olmalıdır.`);
                                continue;
                            }
                        }
                        
                        // Tutar bilgisini al
                        const amount = parseFloat(row[amountIndex]);
                        if (isNaN(amount) || amount <= 0) {
                            errors.push(`Satır ${i+1}: Geçersiz tutar değeri. Pozitif bir sayı olmalıdır.`);
                            continue;
                        }
                        
                        // Açıklama bilgisini al
                        const description = row[descriptionIndex]?.toString().trim() || '';
                        
                        // İşlem oluşturma bilgisini al
                        const createTransactionValue = row[createTransactionIndex]?.toString().trim();
                        const shouldCreateTransaction = createTransactionValue === 'Evet' && createTransactions;
                        
                        // Bütçe planı nesnesini oluştur
                        budgetPlans.push({
                            categoryId,
                            categoryType,
                            subcategoryId,
                            period,
                            year,
                            month,
                            plannedAmount: amount,
                            description: description,
                            createTransaction: shouldCreateTransaction
                        });
                        
                    } catch (error) {
                        console.error(`Satır ${i+1} işleme hatası:`, error);
                        errors.push(`Satır ${i+1}: İşleme hatası: ${error.message}`);
                    }
                }
                
                // Hata varsa bildir
                if (errors.length > 0) {
                    const errorMessage = `${errors.length} hatalar bulundu:<br>` + errors.slice(0, 5).join('<br>');
                    showToast(errorMessage, 'error');
                    
                    if (errors.length > 5) {
                        console.error('Tüm hatalar:', errors);
                    }
                    
                    if (budgetPlans.length === 0) {
                        return; // İşlenebilir plan yoksa çık
                    }
                }
                
                // Başarılı planları ekle
                let successCount = 0;
                let failCount = 0;
                
                // forEach ile async/await kullanılamayacağı için for...of döngüsü kullanıyoruz
                for (const plan of budgetPlans) {
                    const budgetData = {
                        categoryId: plan.categoryId,
                        subcategoryId: plan.subcategoryId,
                        period: plan.period,
                        year: plan.year,
                        month: plan.month,
                        plannedAmount: plan.plannedAmount,
                        description: plan.description || ''
                    };
                    
                    console.log("İçe aktarılan bütçe planı:", budgetData);
                    // Her bir bütçe planı için benzersiz bir id oluşturulmalı - setBudget bunu sağlıyor
                    const savedBudget = await dataManager.setBudget(budgetData);
                    
                    if (savedBudget) {
                        successCount++;
                        
                        // İsteğe bağlı olarak planlanan işlem oluştur
                        if (plan.createTransaction) {
                            await this.createPlannedTransactionFromBudget(savedBudget);
                        }
                    } else {
                        failCount++;
                    }
                }
                
                // Modalı kapat
                document.getElementById('modalContainer').innerHTML = '';
                
                // Sonucu bildir
                const resultMessage = `${successCount} bütçe planı başarıyla içe aktarıldı.`;
                showToast(resultMessage, 'success');
                
                if (failCount > 0) {
                    showToast(`${failCount} bütçe planı eklenemedi.`, 'warning');
                }
                
                // Bütçe raporunu güncelle
                this.generateReport();
                
                // Dashboard ve diğer bölümleri güncelle
                this.updateOtherSections();
                
            } catch (error) {
                console.error('Excel dosyası okuma hatası:', error);
                showToast('Excel dosyası okunurken hata oluştu!', 'error');
            }
        };
        
        reader.readAsArrayBuffer(this.currentBudgetFile);
    }
    
    /**
     * Etiket ve kategori analiz raporunu render et
     */
    async renderTagCategoryAnalysis() {
        try {
            // Check if tag and category analysis elements exist
            const tagChartElement = document.getElementById('tagAnalysisChart');
            const categoryChartElement = document.getElementById('categoryAnalysisChart');
            const topTagsElement = document.getElementById('topTagsTable');
            const topCategoriesElement = document.getElementById('topCategoriesTable');
            
            // Event listener'ları kaldır ve yeniden ekle (event dinleyici birikimini önlemek için)
            const tagReportType = document.getElementById('tagReportType');
            const categoryReportType = document.getElementById('categoryReportType');
            const exportTagCategoryReport = document.getElementById('exportTagCategoryReport');
            
            if (tagReportType) {
                // Eski event listener'ları kaldır
                const newTagReportType = tagReportType.cloneNode(true);
                tagReportType.parentNode.replaceChild(newTagReportType, tagReportType);
                
                // Yeni event listener ekle
                newTagReportType.addEventListener('change', () => {
                    this.renderTagAnalysisChart();
                });
            }
            
            if (categoryReportType) {
                // Eski event listener'ları kaldır
                const newCategoryReportType = categoryReportType.cloneNode(true);
                categoryReportType.parentNode.replaceChild(newCategoryReportType, categoryReportType);
                
                // Yeni event listener ekle
                newCategoryReportType.addEventListener('change', () => {
                    this.renderCategoryAnalysisChart();
                });
            }
            
            if (exportTagCategoryReport) {
                // Eski event listener'ları kaldır
                const newExportButton = exportTagCategoryReport.cloneNode(true);
                exportTagCategoryReport.parentNode.replaceChild(newExportButton, exportTagCategoryReport);
                
                // Yeni event listener ekle
                newExportButton.addEventListener('click', () => {
                    this.exportTagCategoryReport();
                });
            }
            
            // İkonları yeniden oluştur
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Sıralı olarak render et - çakışmaları önlemek için
            // Promise ile işlemleri zincirleyelim
            if (tagChartElement) {
                try {
                    await this.renderTagAnalysisChart();
                } catch (error) {
                    console.error("Error rendering tag analysis chart:", error);
                }
            }
            
            // Biraz bekle ve sonra diğer elementi render et
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (categoryChartElement) {
                try {
                    await this.renderCategoryAnalysisChart();
                } catch (error) {
                    console.error("Error rendering category analysis chart:", error);
                }
            }
            
            // Biraz daha bekle ve sonra tabloları render et
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (topTagsElement) {
                try {
                    await this.renderTopTagsTable();
                } catch (error) {
                    console.error("Error rendering top tags table:", error);
                }
            }
            
            if (topCategoriesElement) {
                try {
                    await this.renderTopCategoriesTable();
                } catch (error) {
                    console.error("Error rendering top categories table:", error);
                }
            }
            
        } catch (error) {
            console.error("Error rendering tag/category analysis:", error);
        }
    }
    
    /**
     * Etiket analiz grafiğini render et
     */
    async renderTagAnalysisChart() {
        try {
            const ctx = document.getElementById('tagAnalysisChart');
            if (!ctx) return;
            
            // Güvenli bir şekilde önceki grafiği temizle
            this.safelyDestroyChart(ctx, this.budgetCharts.tagAnalysis);
            this.budgetCharts.tagAnalysis = null;
            
            // Canvas'a yeni grafik çizmeden önce kısa bir bekleme ekle
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Dönem filtresini al
            let startDate, endDate;
            if (this.currentPeriod === 'monthly') {
                startDate = new Date(this.currentYear, this.currentMonth - 1, 1).toISOString().split('T')[0];
                endDate = new Date(this.currentYear, this.currentMonth, 0).toISOString().split('T')[0];
            } else {
                startDate = new Date(this.currentYear, 0, 1).toISOString().split('T')[0];
                endDate = new Date(this.currentYear, 11, 31).toISOString().split('T')[0];
            }
            
            // Tip filtresi
            const typeFilter = document.getElementById('tagReportType')?.value || 'expense';
            
            // Filtre oluştur
            const filters = { startDate, endDate };
            if (typeFilter !== 'all') {
                filters.type = typeFilter;
            }
            
            // Etiket istatistiklerini al
            const tagStats = await dataManager.getTagStats(filters) || [];
            
            // Ensure we have an array
            const tagStatsArray = Array.isArray(tagStats) ? tagStats : [];
            
            if (tagStatsArray.length === 0) {
                this.budgetCharts.tagAnalysis = await this.showEmptyChart(ctx, 'Etiket verisi bulunamadı', 'bar');
                return;
            }
            
            // Canvas elementinin hala DOM'da olduğunu kontrol et
            if (!document.body.contains(ctx)) {
                console.warn('Tag analysis chart canvas is no longer in the document');
                return;
            }
            
            // Chart.js tarafından kontrol edilen herhangi bir grafik instance'ı var mı tekrar kontrol et
            if (typeof Chart !== 'undefined' && Chart.getChart && Chart.getChart(ctx)) {
                console.warn('Canvas still has a chart instance, destroying again');
                Chart.getChart(ctx).destroy();
            }
            
            // Grafiği oluştur - en çok kullanılan 10 etiketi göster
            const topTags = tagStatsArray.slice(0, 10);
            
            const labels = topTags.map(tag => tag.tagName);
            let data, backgroundColor;
            
            if (typeFilter === 'income') {
                data = topTags.map(tag => tag.incomeAmount);
                backgroundColor = topTags.map(tag => tag.tagColor);
            } else if (typeFilter === 'expense') {
                data = topTags.map(tag => tag.expenseAmount);
                backgroundColor = topTags.map(tag => tag.tagColor);
            } else {
                data = topTags.map(tag => tag.netAmount);
                backgroundColor = topTags.map(tag => tag.netAmount >= 0 ? '#10B981' : '#EF4444');
            }
            
            try {
                this.budgetCharts.tagAnalysis = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: typeFilter === 'income' ? 'Gelir' : (typeFilter === 'expense' ? 'Gider' : 'Net'),
                            data,
                            backgroundColor,
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ${formatCurrency(context.parsed.x)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
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
                console.error("Error creating tag analysis chart:", error);
                try {
                    this.budgetCharts.tagAnalysis = await this.showEmptyChart(ctx, 'Grafik oluşturulurken hata oluştu', 'bar');
                } catch (e) {
                    console.error('Error showing empty chart:', e);
                }
            }
        } catch (error) {
            console.error("Error rendering tag analysis chart:", error);
            try {
                if (ctx) this.budgetCharts.tagAnalysis = await this.showEmptyChart(ctx, 'Grafik yüklenirken hata oluştu', 'bar');
            } catch (e) {
                console.error('Error showing empty chart:', e);
            }
        }
    }
    
    /**
     * Kategori analiz grafiğini render et
     */
    async renderCategoryAnalysisChart() {
        try {
            const ctx = document.getElementById('categoryAnalysisChart');
            if (!ctx) return;
            
            // Güvenli bir şekilde önceki grafiği temizle
            this.safelyDestroyChart(ctx, this.budgetCharts.categoryAnalysis);
            this.budgetCharts.categoryAnalysis = null;
            
            // Canvas'a yeni grafik çizmeden önce kısa bir bekleme ekle
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Dönem filtresini al
            let startDate, endDate;
            if (this.currentPeriod === 'monthly') {
                startDate = new Date(this.currentYear, this.currentMonth - 1, 1).toISOString().split('T')[0];
                endDate = new Date(this.currentYear, this.currentMonth, 0).toISOString().split('T')[0];
            } else {
                startDate = new Date(this.currentYear, 0, 1).toISOString().split('T')[0];
                endDate = new Date(this.currentYear, 11, 31).toISOString().split('T')[0];
            }
            
            // Tip filtresi
            const typeFilter = document.getElementById('categoryReportType')?.value || 'expense';
            
            // Filtre oluştur
            const filters = { startDate, endDate };
            
            // Kategori istatistiklerini al
            const categoryStats = await dataManager.getCategoryStats(typeFilter, filters) || [];
            
            // Ensure we have an array
            const categoryStatsArray = Array.isArray(categoryStats) ? categoryStats : [];
            
            if (categoryStatsArray.length === 0) {
                this.budgetCharts.categoryAnalysis = await this.showEmptyChart(ctx, 'Kategori verisi bulunamadı', 'doughnut');
                return;
            }
            
            // Canvas elementinin hala DOM'da olduğunu kontrol et
            if (!document.body.contains(ctx)) {
                console.warn('Category analysis chart canvas is no longer in the document');
                return;
            }
            
            // Chart.js tarafından kontrol edilen herhangi bir grafik instance'ı var mı tekrar kontrol et
            if (typeof Chart !== 'undefined' && Chart.getChart && Chart.getChart(ctx)) {
                console.warn('Canvas still has a chart instance, destroying again');
                Chart.getChart(ctx).destroy();
            }
            
            // Grafiği oluştur
            const labels = categoryStatsArray.map(cat => cat.categoryName || 'Kategori');
            const data = categoryStatsArray.map(cat => cat.amount || 0);
            const backgroundColor = categoryStatsArray.map(cat => cat.categoryColor || '#CCCCCC');
            
            try {
                this.budgetCharts.categoryAnalysis = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels,
                        datasets: [{
                            data,
                            backgroundColor,
                            borderColor: 'white',
                            borderWidth: 2,
                            hoverOffset: 10
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    font: {
                                        size: 12
                                    },
                                    boxWidth: 15
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error("Error creating category analysis chart:", error);
                try {
                    this.budgetCharts.categoryAnalysis = await this.showEmptyChart(ctx, 'Grafik oluşturulurken hata oluştu', 'doughnut');
                } catch (e) {
                    console.error('Error showing empty chart:', e);
                }
            }
        } catch (error) {
            console.error("Error rendering category analysis chart:", error);
            try {
                if (ctx) this.budgetCharts.categoryAnalysis = await this.showEmptyChart(ctx, 'Grafik yüklenirken hata oluştu', 'doughnut');
            } catch (e) {
                console.error('Error showing empty chart:', e);
            }
        }
    }
    
    /**
     * En çok kullanılan etiketlerin tablosunu render et
     */
    async renderTopTagsTable() {
        try {
            const container = document.getElementById('topTagsTable');
            if (!container) return;
        
        // Dönem filtresini al
        let startDate, endDate;
        if (this.currentPeriod === 'monthly') {
            startDate = new Date(this.currentYear, this.currentMonth - 1, 1).toISOString().split('T')[0];
            endDate = new Date(this.currentYear, this.currentMonth, 0).toISOString().split('T')[0];
        } else {
            startDate = new Date(this.currentYear, 0, 1).toISOString().split('T')[0];
            endDate = new Date(this.currentYear, 11, 31).toISOString().split('T')[0];
        }
        
        // Filtre oluştur
        const filters = { startDate, endDate };
        
        // Etiket istatistiklerini al
        const tagStats = await dataManager.getTagStats(filters) || [];
        
        // HTML oluştur
        let html = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiket</th>
                    <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanım</th>
                    <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gelir</th>
                    <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gider</th>
                    <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        // Ensure tagStats is an array
        const tagStatsArray = Array.isArray(tagStats) ? tagStats : [];
        
        if (tagStatsArray.length === 0) {
            html += `
                <tr>
                    <td colspan="5" class="px-3 py-4 text-center text-sm text-gray-500">Etiket verisi bulunamadı</td>
                </tr>
            `;
        } else {
            // En çok kullanılan 15 etiketi göster
            const topTags = tagStatsArray.slice(0, 15);
            
            topTags.forEach(tag => {
                const netAmount = tag.incomeAmount - tag.expenseAmount;
                const netClass = netAmount >= 0 ? 'text-green-600' : 'text-red-600';
                
                html += `
                    <tr>
                        <td class="px-3 py-2 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${tag.tagColor};"></div>
                                <span class="text-sm font-medium text-gray-900">${escapeHtml(tag.tagName)}</span>
                            </div>
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-right">${tag.transactionCount}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-green-600">${formatCurrency(tag.incomeAmount)}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-red-600">${formatCurrency(tag.expenseAmount)}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-right ${netClass}">${formatCurrency(netAmount)}</td>
                    </tr>
                `;
            });
        }
        
        html += `
            </tbody>
        </table>
        `;
        
        container.querySelector('.overflow-x-auto').innerHTML = html;
        } catch (error) {
            console.error("Error rendering top tags table:", error);
        }
    }
    
    /**
     * En çok kullanılan kategorilerin tablosunu render et
     */
    async renderTopCategoriesTable() {
        try {
            const container = document.getElementById('topCategoriesTable');
            if (!container) return;
        
        // Dönem filtresini al
        let startDate, endDate;
        if (this.currentPeriod === 'monthly') {
            startDate = new Date(this.currentYear, this.currentMonth - 1, 1).toISOString().split('T')[0];
            endDate = new Date(this.currentYear, this.currentMonth, 0).toISOString().split('T')[0];
        } else {
            startDate = new Date(this.currentYear, 0, 1).toISOString().split('T')[0];
            endDate = new Date(this.currentYear, 11, 31).toISOString().split('T')[0];
        }
        
        // Filtre oluştur
        const filters = { startDate, endDate };
        
        // Kategori istatistiklerini al
        const incomeStats = await dataManager.getCategoryStats('income', filters) || [];
        const expenseStats = await dataManager.getCategoryStats('expense', filters) || [];
        
        // HTML oluştur
        let html = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                    <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem Sayısı</th>
                    <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        // Ensure stats are arrays
        const incomeStatsArray = Array.isArray(incomeStats) ? incomeStats : [];
        const expenseStatsArray = Array.isArray(expenseStats) ? expenseStats : [];
        
        if (incomeStatsArray.length === 0 && expenseStatsArray.length === 0) {
            html += `
                <tr>
                    <td colspan="4" class="px-3 py-4 text-center text-sm text-gray-500">Kategori verisi bulunamadı</td>
                </tr>
            `;
        } else {
            // En çok kullanılan kategorileri göster
            const allStats = [...incomeStatsArray, ...expenseStatsArray].sort((a, b) => b.amount - a.amount).slice(0, 15);
            
            allStats.forEach(cat => {
                const amountClass = cat.type === 'income' ? 'text-green-600' : 'text-red-600';
                
                html += `
                    <tr>
                        <td class="px-3 py-2 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${cat.categoryColor};"></div>
                                <span class="text-sm font-medium text-gray-900">${escapeHtml(cat.categoryName)}</span>
                            </div>
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-right">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${cat.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${cat.type === 'income' ? 'Gelir' : 'Gider'}
                            </span>
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-right">${cat.transactionCount}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-right ${amountClass}">${formatCurrency(cat.amount)}</td>
                    </tr>
                `;
            });
        }
        
        html += `
            </tbody>
        </table>
        `;
        
        container.querySelector('.overflow-x-auto').innerHTML = html;
        } catch (error) {
            console.error("Error rendering top categories table:", error);
        }
    }
    
    /**
     * Etiket ve kategori raporunu Excel olarak dışa aktar
     */
    exportTagCategoryReport() {
        try {
            // Dönem filtresini al
            let startDate, endDate;
            if (this.currentPeriod === 'monthly') {
                startDate = new Date(this.currentYear, this.currentMonth - 1, 1).toISOString().split('T')[0];
                endDate = new Date(this.currentYear, this.currentMonth, 0).toISOString().split('T')[0];
            } else {
            startDate = new Date(this.currentYear, 0, 1).toISOString().split('T')[0];
            endDate = new Date(this.currentYear, 11, 31).toISOString().split('T')[0];
        }
        
        // Filtre oluştur
        const filters = { startDate, endDate };
        
        // Verileri al
        const tagStats = dataManager.getTagStats(filters);
        const incomeStats = dataManager.getCategoryStats('income', filters);
        const expenseStats = dataManager.getCategoryStats('expense', filters);
        
        // Excel dosyasını oluştur
        const wb = XLSX.utils.book_new();
        
        // Etiket sayfası
        const tagData = [
            ['Etiket', 'Renk', 'Kullanım Sayısı', 'Gelir', 'Gider', 'Net']
        ];
        
        tagStats.forEach(tag => {
            tagData.push([
                tag.tagName,
                tag.tagColor,
                tag.transactionCount,
                tag.incomeAmount,
                tag.expenseAmount,
                tag.incomeAmount - tag.expenseAmount
            ]);
        });
        
        const tagWs = XLSX.utils.aoa_to_sheet(tagData);
        XLSX.utils.book_append_sheet(wb, tagWs, 'Etiketler');
        
        // Kategori sayfası
        const categoryData = [
            ['Kategori', 'Renk', 'Tip', 'İşlem Sayısı', 'Toplam']
        ];
        
        [...incomeStats, ...expenseStats].forEach(cat => {
            categoryData.push([
                cat.categoryName,
                cat.categoryColor,
                cat.type === 'income' ? 'Gelir' : 'Gider',
                cat.transactionCount,
                cat.amount
            ]);
        });
        
        const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(wb, categoryWs, 'Kategoriler');
        
        // Dosyayı indir
        const periodStr = this.currentPeriod === 'monthly' ? 
            `${this.currentYear}-${this.currentMonth.toString().padStart(2, '0')}` : 
            `${this.currentYear}`;
        
        XLSX.writeFile(wb, `etiket_kategori_raporu_${periodStr}.xlsx`);
        
        showToast('Etiket ve kategori raporu indirildi!', 'success');
        } catch (error) {
            console.error('Etiket ve kategori raporu oluşturma hatası:', error);
            showToast('Rapor oluşturulurken hata oluştu!', 'error');
        }
    }
}

// Global instance
const reportManager = new ReportManager();