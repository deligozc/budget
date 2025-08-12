/**
 * KPI Cards Component - Advanced Analytics Cards
 * Implements new KPI cards for financial health monitoring
 */

class KPICards {
    constructor(dataManager) {
        // Store dataManager reference
        this.dataManager = dataManager;
        
        // Chart instances
        this.charts = {};
        
        // KPI card definitions
        this.kpiCardTypes = {
            incomeGrowth: {
                title: "Gelir Artış Oranı",
                description: "Bir önceki dönemle karşılaştırma",
                icon: "trending-up"
            },
            expenseControl: {
                title: "Harcama Kontrolü",
                description: "Hedef vs gerçekleşme yüzdesi",
                icon: "target"
            },
            savingsRate: {
                title: "Tasarruf Oranı",
                description: "Gelir içindeki tasarruf payı",
                icon: "piggy-bank"
            },
            categoryDiversity: {
                title: "Kategori Çeşitliliği",
                description: "Harcama dağılım indeksi",
                icon: "pie-chart"
            },
            budgetDiscipline: {
                title: "Bütçe Disiplini",
                description: "Plan vs gerçekleşme tutarlılığı",
                icon: "check-square"
            }
        };
    }

    /**
     * Initialize KPI cards
     */
    async initialize() {
        // Directly render the KPI cards
        await this.renderAdvancedKPICards();

        // Event delegation for card actions
        document.addEventListener('click', (e) => {
            // Check if target is a KPI card action button
            if (e.target.closest('.kpi-action-btn')) {
                const action = e.target.closest('.kpi-action-btn').dataset.action;
                const cardId = e.target.closest('.stat-card-advanced').id;
                
                this.handleKPIAction(action, cardId);
            }
        });
        
        console.log('KPI Cards initialized successfully');
    }

    /**
     * Render all advanced KPI cards
     */
    async renderAdvancedKPICards() {
        console.log('Rendering advanced KPI cards...');
        const kpiContainer = document.getElementById('advancedKpiContainer');
        if (!kpiContainer) {
            console.error('KPI container not found in DOM!');
            return;
        }

        console.log('KPI container found:', kpiContainer);
        
        // Clear previous cards
        kpiContainer.innerHTML = '';

        try {
            // Calculate KPI data
            console.log('Calculating KPI data with filters:', this.currentFilters);
            const data = await this.calculateKPIData();
            
            // Render each KPI card
            console.log('Rendering KPI cards with data:', data);
            
            this.renderIncomeGrowthCard(kpiContainer, data.incomeGrowth);
            this.renderExpenseControlCard(kpiContainer, data.expenseControl);
            this.renderSavingsRateCard(kpiContainer, data.savingsRate);
            this.renderCategoryDiversityCard(kpiContainer, data.categoryDiversity);
            this.renderBudgetDisciplineCard(kpiContainer, data.budgetDiscipline);
            
            console.log('KPI cards rendered successfully, container now has', kpiContainer.children.length, 'children');
            
            // Ensure cards are visible
            const containerStyle = window.getComputedStyle(kpiContainer);
            console.log('KPI container visibility:', containerStyle.visibility, 'display:', containerStyle.display);
        } catch (error) {
            console.error('KPI cards rendering error:', error);
        }
    }

    /**
     * Calculate all KPI metrics
     */
    async calculateKPIData() {
        try {
            // Use provided filters or default to current month
            let currentPeriodFilters = this.currentFilters || {
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            };
            
            // Get transactions data using the current filters
            const currentMonthTransactions = await this.dataManager.getTransactions(currentPeriodFilters);
            
            // Calculate previous period (e.g., if current is this month, previous is last month)
            let prevPeriodFilters;
            
            if (this.currentFilters) {
                // If we have filters, make a best effort to create a "previous period" of same length
                if (this.currentFilters.startDate && this.currentFilters.endDate) {
                    const start = new Date(this.currentFilters.startDate);
                    const end = new Date(this.currentFilters.endDate);
                    const periodLength = end.getTime() - start.getTime();
                    
                    const prevEnd = new Date(start);
                    prevEnd.setDate(prevEnd.getDate() - 1);
                    
                    const prevStart = new Date(prevEnd);
                    prevStart.setTime(prevEnd.getTime() - periodLength);
                    
                    prevPeriodFilters = {
                        startDate: prevStart.toISOString().split('T')[0],
                        endDate: prevEnd.toISOString().split('T')[0]
                    };
                } else {
                    // Default to previous month if filters don't have dates
                    const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
                    const prevMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
                    
                    prevPeriodFilters = {
                        startDate: prevMonthStart.toISOString().split('T')[0],
                        endDate: prevMonthEnd.toISOString().split('T')[0]
                    };
                }
            } else {
                // Default previous period (last month)
                const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
                const prevMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
                
                prevPeriodFilters = {
                    startDate: prevMonthStart.toISOString().split('T')[0],
                    endDate: prevMonthEnd.toISOString().split('T')[0]
                };
            }
            
            // Get previous period data
            const prevMonthTransactions = await this.dataManager.getTransactions(prevPeriodFilters);
            
            // Get budget data
            const currentMonthBudgets = await this.dataManager.getBudgets({
                period: 'monthly',
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1
            }) || [];

            // Income totals
            const currentMonthIncome = currentMonthTransactions
                .filter(t => t.type === 'income' && t.status === 'actual')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const prevMonthIncome = prevMonthTransactions
                .filter(t => t.type === 'income' && t.status === 'actual')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            // Expense totals
            const currentMonthExpense = currentMonthTransactions
                .filter(t => t.type === 'expense' && t.status === 'actual')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
                
            const prevMonthExpense = prevMonthTransactions
                .filter(t => t.type === 'expense' && t.status === 'actual')
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            // Calculate KPI metrics
            return {
                incomeGrowth: this.calculateIncomeGrowth(currentMonthIncome, prevMonthIncome),
                expenseControl: this.calculateExpenseControl(currentMonthExpense, currentMonthBudgets),
                savingsRate: this.calculateSavingsRate(currentMonthIncome, currentMonthExpense),
                categoryDiversity: this.calculateCategoryDiversity(currentMonthTransactions),
                budgetDiscipline: this.calculateBudgetDiscipline(currentMonthTransactions, currentMonthBudgets)
            };
        } catch (error) {
            console.error('Error calculating KPI data:', error);
            return {
                incomeGrowth: { rate: 0, status: 'neutral' },
                expenseControl: { percentage: 0, status: 'neutral' },
                savingsRate: { rate: 0, status: 'neutral' },
                categoryDiversity: { index: 0, status: 'neutral' },
                budgetDiscipline: { score: 0, status: 'neutral' }
            };
        }
    }

    /**
     * Calculate income growth rate compared to previous period
     */
    calculateIncomeGrowth(currentIncome, previousIncome) {
        if (previousIncome === 0) return { rate: 0, status: 'neutral' };
        
        const growthRate = ((currentIncome - previousIncome) / previousIncome) * 100;
        let status = 'neutral';
        
        if (growthRate > 5) {
            status = 'excellent';
        } else if (growthRate > 0) {
            status = 'good';
        } else if (growthRate > -10) {
            status = 'warning';
        } else {
            status = 'critical';
        }
        
        return {
            rate: parseFloat(growthRate.toFixed(1)),
            previousValue: previousIncome,
            currentValue: currentIncome,
            status
        };
    }

    /**
     * Calculate expense control (target vs actual percentage)
     */
    calculateExpenseControl(actualExpense, budgets) {
        // Sum all expense budgets
        const budgetedAmount = Array.isArray(budgets) ? 
            budgets
                .filter(b => {
                    const cat = this.dataManager.getCategoryById({ income: [], expense: [] }, b.categoryId);
                    return cat && cat.type === 'expense';
                })
                .reduce((sum, b) => sum + (b.plannedAmount || 0), 0) : 0;
        
        if (budgetedAmount === 0) return { percentage: 0, status: 'neutral' };
        
        const controlPercentage = (actualExpense / budgetedAmount) * 100;
        let status = 'neutral';
        
        if (controlPercentage < 80) {
            status = 'excellent';
        } else if (controlPercentage < 95) {
            status = 'good';
        } else if (controlPercentage < 105) {
            status = 'warning';
        } else {
            status = 'critical';
        }
        
        return {
            percentage: parseFloat(controlPercentage.toFixed(1)),
            budgetedAmount,
            actualAmount: actualExpense,
            status
        };
    }

    /**
     * Calculate savings rate (percentage of income saved)
     */
    calculateSavingsRate(income, expense) {
        if (income === 0) return { rate: 0, status: 'neutral' };
        
        const savingsRate = ((income - expense) / income) * 100;
        let status = 'neutral';
        
        if (savingsRate > 20) {
            status = 'excellent';
        } else if (savingsRate > 10) {
            status = 'good';
        } else if (savingsRate > 0) {
            status = 'warning';
        } else {
            status = 'critical';
        }
        
        return {
            rate: parseFloat(savingsRate.toFixed(1)),
            income,
            expense,
            savings: income - expense,
            status
        };
    }

    /**
     * Calculate category diversity index
     */
    calculateCategoryDiversity(transactions) {
        const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.status === 'actual');
        
        if (expenseTransactions.length === 0) {
            return { index: 0, status: 'neutral' };
        }
        
        // Group by category
        const categoryGroups = {};
        expenseTransactions.forEach(t => {
            if (!categoryGroups[t.categoryId]) {
                categoryGroups[t.categoryId] = 0;
            }
            categoryGroups[t.categoryId] += t.amount || 0;
        });
        
        // Calculate Herfindahl-Hirschman Index (HHI) - lower is more diverse
        const totalExpense = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const categoryShares = Object.values(categoryGroups).map(amount => (amount / totalExpense) * 100);
        
        // Sum of squares of percentage market shares
        const hhi = categoryShares.reduce((sum, share) => sum + (share * share), 0);
        
        // Convert to 0-100 diversity index (100 is perfectly diverse)
        const diversityIndex = Math.max(0, Math.min(100, 100 - (hhi / 100)));
        
        let status = 'neutral';
        if (diversityIndex > 70) {
            status = 'excellent';
        } else if (diversityIndex > 50) {
            status = 'good';
        } else if (diversityIndex > 30) {
            status = 'warning';
        } else {
            status = 'critical';
        }
        
        return {
            index: parseFloat(diversityIndex.toFixed(1)),
            categoryCount: Object.keys(categoryGroups).length,
            topCategories: Object.entries(categoryGroups)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([id, amount]) => ({ 
                    id, 
                    amount,
                    percentage: parseFloat(((amount / totalExpense) * 100).toFixed(1))
                })),
            status
        };
    }

    /**
     * Calculate budget discipline score
     */
    calculateBudgetDiscipline(transactions, budgets) {
        if (!Array.isArray(budgets) || budgets.length === 0) {
            return { score: 0, status: 'neutral' };
        }
        
        // Group transactions by category
        const categoryExpenses = {};
        transactions
            .filter(t => t.type === 'expense' && t.status === 'actual')
            .forEach(t => {
                if (!categoryExpenses[t.categoryId]) {
                    categoryExpenses[t.categoryId] = 0;
                }
                categoryExpenses[t.categoryId] += t.amount || 0;
            });
        
        // Calculate variance for each budget
        let totalVariance = 0;
        let totalBudget = 0;
        let budgetCount = 0;
        
        budgets.forEach(budget => {
            const actual = categoryExpenses[budget.categoryId] || 0;
            const planned = budget.plannedAmount || 0;
            
            if (planned > 0) {
                const variance = Math.abs(actual - planned);
                totalVariance += variance;
                totalBudget += planned;
                budgetCount++;
            }
        });
        
        if (totalBudget === 0 || budgetCount === 0) {
            return { score: 0, status: 'neutral' };
        }
        
        // Calculate discipline score (100 is perfect adherence)
        const avgVariancePercentage = (totalVariance / totalBudget) * 100;
        const disciplineScore = Math.max(0, 100 - avgVariancePercentage);
        
        let status = 'neutral';
        if (disciplineScore > 90) {
            status = 'excellent';
        } else if (disciplineScore > 75) {
            status = 'good';
        } else if (disciplineScore > 60) {
            status = 'warning';
        } else {
            status = 'critical';
        }
        
        return {
            score: parseFloat(disciplineScore.toFixed(1)),
            budgetCount,
            totalBudget,
            totalVariance,
            status
        };
    }

    /**
     * Render Income Growth Rate KPI Card
     */
    renderIncomeGrowthCard(container, data) {
        const card = document.createElement('div');
        card.id = 'kpi-income-growth';
        card.className = `stat-card-advanced ${data.status}`;
        
        const cardType = 'incomeGrowth';
        const cardInfo = this.kpiCardTypes[cardType] || {
            title: "Gelir Artış Oranı",
            description: "Bir önceki dönemle karşılaştırma",
            icon: "trending-up"
        };
        
        const trend = data.rate >= 0 ? 
            '<i data-lucide="trending-up" class="w-4 h-4"></i>' : 
            '<i data-lucide="trending-down" class="w-4 h-4"></i>';
            
        card.innerHTML = `
            <div class="kpi-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${cardInfo.title}</h3>
                <div class="kpi-actions">
                    <button class="kpi-action-btn" data-action="info" title="Bilgi" style="background: none; border: none; cursor: pointer; padding: 0.25rem;">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="kpi-subtitle text-xs text-gray-500 -mt-2 mb-2" style="font-size: 0.75rem; color: #6B7280; margin-top: -0.5rem; margin-bottom: 0.5rem;">${cardInfo.description}</div>
            <div class="kpi-body" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0.5rem;">
                <div class="circular-progress" id="income-growth-chart"></div>
                <div class="kpi-value" style="text-align: center; margin-top: 0.5rem;">
                    <span class="value" style="font-size: 1.5rem; font-weight: 700;">${data.rate}%</span>
                    <span class="trend ${data.rate >= 0 ? 'positive' : 'negative'}" style="display: inline-flex; align-items: center;">${trend}</span>
                </div>
            </div>
            <div class="kpi-footer" style="font-size: 0.75rem; color: #6B7280;">
                <div class="kpi-detail" style="margin-bottom: 0.25rem;">Önceki dönem: ${formatCurrency(data.previousValue)}</div>
                <div class="kpi-detail">Şimdiki dönem: ${formatCurrency(data.currentValue)}</div>
            </div>
        `;
        
        container.appendChild(card);
        lucide.createIcons();
        
        // Create circular progress chart
        setTimeout(() => {
            this.createCircularChart('income-growth-chart', data.rate, 100, data.status);
        }, 0);
    }

    /**
     * Render Expense Control KPI Card
     */
    renderExpenseControlCard(container, data) {
        const card = document.createElement('div');
        card.id = 'kpi-expense-control';
        card.className = `stat-card-advanced ${data.status}`;
        
        const cardType = 'expenseControl';
        const cardInfo = this.kpiCardTypes[cardType] || {
            title: "Harcama Kontrolü",
            description: "Hedef vs gerçekleşme yüzdesi",
            icon: "target"
        };
        
        card.innerHTML = `
            <div class="kpi-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${cardInfo.title}</h3>
                <div class="kpi-actions">
                    <button class="kpi-action-btn" data-action="info" title="Bilgi" style="background: none; border: none; cursor: pointer; padding: 0.25rem;">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="kpi-subtitle text-xs text-gray-500 -mt-2 mb-2" style="font-size: 0.75rem; color: #6B7280; margin-top: -0.5rem; margin-bottom: 0.5rem;">${cardInfo.description}</div>
            <div class="kpi-body" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0.5rem;">
                <div class="gauge-chart" id="expense-control-chart"></div>
                <div class="kpi-value" style="text-align: center; margin-top: 0.5rem;">
                    <span class="value" style="font-size: 1.5rem; font-weight: 700;">${data.percentage}%</span>
                    <span class="label" style="font-size: 0.75rem; color: #6B7280;">gerçekleşme</span>
                </div>
            </div>
            <div class="kpi-footer" style="font-size: 0.75rem; color: #6B7280;">
                <div class="kpi-detail" style="margin-bottom: 0.25rem;">Hedef: ${formatCurrency(data.budgetedAmount)}</div>
                <div class="kpi-detail">Gerçekleşen: ${formatCurrency(data.actualAmount)}</div>
            </div>
        `;
        
        container.appendChild(card);
        lucide.createIcons();
        
        // Create gauge chart
        setTimeout(() => {
            this.createGaugeChart('expense-control-chart', data.percentage, data.status);
        }, 0);
    }

    /**
     * Render Savings Rate KPI Card
     */
    renderSavingsRateCard(container, data) {
        const card = document.createElement('div');
        card.id = 'kpi-savings-rate';
        card.className = `stat-card-advanced ${data.status}`;
        
        const cardType = 'savingsRate';
        const cardInfo = this.kpiCardTypes[cardType] || {
            title: "Tasarruf Oranı",
            description: "Gelir içindeki tasarruf payı",
            icon: "piggy-bank"
        };
        
        card.innerHTML = `
            <div class="kpi-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${cardInfo.title}</h3>
                <div class="kpi-actions">
                    <button class="kpi-action-btn" data-action="info" title="Bilgi" style="background: none; border: none; cursor: pointer; padding: 0.25rem;">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="kpi-subtitle text-xs text-gray-500 -mt-2 mb-2" style="font-size: 0.75rem; color: #6B7280; margin-top: -0.5rem; margin-bottom: 0.5rem;">${cardInfo.description}</div>
            <div class="kpi-body" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0.5rem;">
                <div class="speedometer-chart" id="savings-rate-chart"></div>
                <div class="kpi-value" style="text-align: center; margin-top: 0.5rem;">
                    <span class="value" style="font-size: 1.5rem; font-weight: 700;">${data.rate}%</span>
                    <span class="label" style="font-size: 0.75rem; color: #6B7280;">tasarruf</span>
                </div>
            </div>
            <div class="kpi-footer" style="font-size: 0.75rem; color: #6B7280;">
                <div class="kpi-detail" style="margin-bottom: 0.25rem;">Gelir: ${formatCurrency(data.income)}</div>
                <div class="kpi-detail">Tasarruf: ${formatCurrency(data.savings)}</div>
            </div>
        `;
        
        container.appendChild(card);
        lucide.createIcons();
        
        // Create speedometer chart
        setTimeout(() => {
            this.createSpeedometerChart('savings-rate-chart', data.rate, data.status);
        }, 0);
    }

    /**
     * Render Category Diversity KPI Card
     */
    renderCategoryDiversityCard(container, data) {
        const card = document.createElement('div');
        card.id = 'kpi-category-diversity';
        card.className = `stat-card-advanced ${data.status}`;
        
        const cardType = 'categoryDiversity';
        const cardInfo = this.kpiCardTypes[cardType] || {
            title: "Kategori Çeşitliliği",
            description: "Harcama dağılım indeksi",
            icon: "pie-chart"
        };
        
        const topCategoriesHTML = data.topCategories && data.topCategories.length > 0 ?
            data.topCategories.map(cat => 
                `<div class="kpi-detail">${cat.percentage}% - Kategori #${cat.id.substring(0, 4)}</div>`
            ).join('') :
            '<div class="kpi-detail">Henüz veri yok</div>';
        
        card.innerHTML = `
            <div class="kpi-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${cardInfo.title}</h3>
                <div class="kpi-actions">
                    <button class="kpi-action-btn" data-action="info" title="Bilgi" style="background: none; border: none; cursor: pointer; padding: 0.25rem;">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="kpi-subtitle text-xs text-gray-500 -mt-2 mb-2" style="font-size: 0.75rem; color: #6B7280; margin-top: -0.5rem; margin-bottom: 0.5rem;">${cardInfo.description}</div>
            <div class="kpi-body" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0.5rem;">
                <div class="hexagon-chart" id="category-diversity-chart"></div>
                <div class="kpi-value" style="text-align: center; margin-top: 0.5rem;">
                    <span class="value" style="font-size: 1.5rem; font-weight: 700;">${data.index}</span>
                    <span class="label" style="font-size: 0.75rem; color: #6B7280;">indeks</span>
                </div>
            </div>
            <div class="kpi-footer" style="font-size: 0.75rem; color: #6B7280;">
                <div class="kpi-detail" style="margin-bottom: 0.25rem;">Toplam Kategori: ${data.categoryCount || 0}</div>
                ${topCategoriesHTML}
            </div>
        `;
        
        container.appendChild(card);
        lucide.createIcons();
        
        // Create hexagon chart
        setTimeout(() => {
            this.createHexagonChart('category-diversity-chart', data.index, data.status);
        }, 0);
    }

    /**
     * Render Budget Discipline KPI Card
     */
    renderBudgetDisciplineCard(container, data) {
        const card = document.createElement('div');
        card.id = 'kpi-budget-discipline';
        card.className = `stat-card-advanced ${data.status}`;
        
        const cardType = 'budgetDiscipline';
        const cardInfo = this.kpiCardTypes[cardType] || {
            title: "Bütçe Disiplini",
            description: "Plan vs gerçekleşme tutarlılığı",
            icon: "check-square"
        };
        
        card.innerHTML = `
            <div class="kpi-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${cardInfo.title}</h3>
                <div class="kpi-actions">
                    <button class="kpi-action-btn" data-action="info" title="Bilgi" style="background: none; border: none; cursor: pointer; padding: 0.25rem;">
                        <i data-lucide="info" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="kpi-subtitle text-xs text-gray-500 -mt-2 mb-2" style="font-size: 0.75rem; color: #6B7280; margin-top: -0.5rem; margin-bottom: 0.5rem;">${cardInfo.description}</div>
            <div class="kpi-body" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0.5rem;">
                <div class="progress-chart" id="budget-discipline-chart"></div>
                <div class="kpi-value" style="text-align: center; margin-top: 0.5rem;">
                    <span class="value" style="font-size: 1.5rem; font-weight: 700;">${data.score}</span>
                    <span class="label" style="font-size: 0.75rem; color: #6B7280;">puan</span>
                </div>
            </div>
            <div class="kpi-footer" style="font-size: 0.75rem; color: #6B7280;">
                <div class="kpi-detail" style="margin-bottom: 0.25rem;">Bütçe Sayısı: ${data.budgetCount || 0}</div>
                <div class="kpi-detail">Tutarlılık: ${data.score ? (100 - Math.abs(100 - data.score)).toFixed(1) : 0}%</div>
            </div>
        `;
        
        container.appendChild(card);
        lucide.createIcons();
        
        // Create progress chart
        setTimeout(() => {
            this.createProgressChart('budget-discipline-chart', data.score, data.status);
        }, 0);
    }

    /**
     * Create circular progress chart
     */
    createCircularChart(elementId, value, maxValue, status) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Calculate percentage of circle
        const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
        
        // Create SVG
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 120 120");
        
        // Background circle
        const bgCircle = document.createElementNS(svgNS, "circle");
        bgCircle.setAttribute("cx", "60");
        bgCircle.setAttribute("cy", "60");
        bgCircle.setAttribute("r", "54");
        bgCircle.setAttribute("fill", "none");
        bgCircle.setAttribute("stroke", "#e5e7eb");
        bgCircle.setAttribute("stroke-width", "12");
        svg.appendChild(bgCircle);
        
        // Progress circle
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", "60");
        circle.setAttribute("cy", "60");
        circle.setAttribute("r", "54");
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke-width", "12");
        circle.setAttribute("stroke-linecap", "round");
        
        // Set stroke color based on status
        let strokeColor;
        switch (status) {
            case 'excellent': strokeColor = "#10B981"; break;
            case 'good': strokeColor = "#3B82F6"; break;
            case 'warning': strokeColor = "#F59E0B"; break;
            case 'critical': strokeColor = "#EF4444"; break;
            default: strokeColor = "#6B7280";
        }
        
        circle.setAttribute("stroke", strokeColor);
        
        // Calculate the circumference
        const circumference = 2 * Math.PI * 54;
        circle.setAttribute("stroke-dasharray", circumference.toString());
        
        // Calculate the value of the dash offset
        const dashOffset = circumference - (percentage / 100) * circumference;
        circle.setAttribute("stroke-dashoffset", dashOffset.toString());
        
        // Rotate to start from the top
        circle.setAttribute("transform", "rotate(-90, 60, 60)");
        
        svg.appendChild(circle);
        
        // Clear and append
        element.innerHTML = '';
        element.appendChild(svg);
        
        // Store chart reference
        this.charts[elementId] = {
            svg,
            circle,
            value,
            maxValue
        };
    }

    /**
     * Create gauge chart
     */
    createGaugeChart(elementId, percentage, status) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Normalize percentage between 0 and 100
        const normalizedPercentage = Math.min(100, Math.max(0, percentage));
        
        // Create SVG
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 120 120");
        
        // Create gauge background (semi-circle)
        const background = document.createElementNS(svgNS, "path");
        background.setAttribute("d", "M 10,110 A 60,60 0 0,1 110,110");
        background.setAttribute("fill", "none");
        background.setAttribute("stroke", "#e5e7eb");
        background.setAttribute("stroke-width", "12");
        background.setAttribute("stroke-linecap", "round");
        svg.appendChild(background);
        
        // Set color based on status
        let strokeColor;
        switch (status) {
            case 'excellent': strokeColor = "#10B981"; break;
            case 'good': strokeColor = "#3B82F6"; break;
            case 'warning': strokeColor = "#F59E0B"; break;
            case 'critical': strokeColor = "#EF4444"; break;
            default: strokeColor = "#6B7280";
        }
        
        // Create gauge foreground (filled portion)
        const foreground = document.createElementNS(svgNS, "path");
        foreground.setAttribute("fill", "none");
        foreground.setAttribute("stroke", strokeColor);
        foreground.setAttribute("stroke-width", "12");
        foreground.setAttribute("stroke-linecap", "round");
        
        // Calculate the angle for the gauge
        const angle = (normalizedPercentage / 100) * 180;
        const radians = angle * (Math.PI / 180);
        const x = 60 - 60 * Math.cos(radians);
        const y = 110 - 60 * Math.sin(radians);
        foreground.setAttribute("d", `M 10,110 A 60,60 0 0,1 ${x},${y}`);
        
        svg.appendChild(foreground);
        
        // Add the needle pointer
        const needle = document.createElementNS(svgNS, "line");
        needle.setAttribute("x1", "60");
        needle.setAttribute("y1", "110");
        needle.setAttribute("x2", x.toString());
        needle.setAttribute("y2", y.toString());
        needle.setAttribute("stroke", "#4B5563");
        needle.setAttribute("stroke-width", "2");
        svg.appendChild(needle);
        
        // Add the center point
        const center = document.createElementNS(svgNS, "circle");
        center.setAttribute("cx", "60");
        center.setAttribute("cy", "110");
        center.setAttribute("r", "4");
        center.setAttribute("fill", "#4B5563");
        svg.appendChild(center);
        
        // Clear and append
        element.innerHTML = '';
        element.appendChild(svg);
        
        // Store chart reference
        this.charts[elementId] = {
            svg,
            foreground,
            needle,
            percentage
        };
    }

    /**
     * Create speedometer chart
     */
    createSpeedometerChart(elementId, value, status) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Normalize value between 0 and 100
        const normalizedValue = Math.min(100, Math.max(0, value));
        
        // Create SVG
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 120 70");
        
        // Create speedometer background (semi-circle)
        const background = document.createElementNS(svgNS, "path");
        background.setAttribute("d", "M 10,60 A 50,50 0 0,1 110,60");
        background.setAttribute("fill", "none");
        background.setAttribute("stroke", "#e5e7eb");
        background.setAttribute("stroke-width", "10");
        svg.appendChild(background);
        
        // Add tick marks
        for (let i = 0; i <= 5; i++) {
            const angle = (i / 5) * Math.PI;
            const x1 = 60 - 50 * Math.cos(angle);
            const y1 = 60 - 50 * Math.sin(angle);
            const x2 = 60 - 40 * Math.cos(angle);
            const y2 = 60 - 40 * Math.sin(angle);
            
            const tick = document.createElementNS(svgNS, "line");
            tick.setAttribute("x1", x1.toString());
            tick.setAttribute("y1", y1.toString());
            tick.setAttribute("x2", x2.toString());
            tick.setAttribute("y2", y2.toString());
            tick.setAttribute("stroke", "#9CA3AF");
            tick.setAttribute("stroke-width", "2");
            svg.appendChild(tick);
            
            // Add tick labels
            const labelX = 60 - 30 * Math.cos(angle);
            const labelY = 60 - 30 * Math.sin(angle);
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", labelX.toString());
            text.setAttribute("y", labelY.toString());
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "8");
            text.setAttribute("fill", "#6B7280");
            text.textContent = `${i * 20}`;
            svg.appendChild(text);
        }
        
        // Set color based on status
        let needleColor;
        switch (status) {
            case 'excellent': needleColor = "#10B981"; break;
            case 'good': needleColor = "#3B82F6"; break;
            case 'warning': needleColor = "#F59E0B"; break;
            case 'critical': needleColor = "#EF4444"; break;
            default: needleColor = "#6B7280";
        }
        
        // Calculate the angle for the needle
        const angle = ((normalizedValue / 100) * Math.PI);
        const x = 60 - 45 * Math.cos(angle);
        const y = 60 - 45 * Math.sin(angle);
        
        // Add the needle
        const needle = document.createElementNS(svgNS, "line");
        needle.setAttribute("x1", "60");
        needle.setAttribute("y1", "60");
        needle.setAttribute("x2", x.toString());
        needle.setAttribute("y2", y.toString());
        needle.setAttribute("stroke", needleColor);
        needle.setAttribute("stroke-width", "3");
        needle.setAttribute("stroke-linecap", "round");
        svg.appendChild(needle);
        
        // Add the center point
        const center = document.createElementNS(svgNS, "circle");
        center.setAttribute("cx", "60");
        center.setAttribute("cy", "60");
        center.setAttribute("r", "5");
        center.setAttribute("fill", needleColor);
        svg.appendChild(center);
        
        // Clear and append
        element.innerHTML = '';
        element.appendChild(svg);
        
        // Store chart reference
        this.charts[elementId] = {
            svg,
            needle,
            value
        };
    }

    /**
     * Create hexagon chart for category diversity
     */
    createHexagonChart(elementId, value, status) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Normalize value between 0 and 100
        const normalizedValue = Math.min(100, Math.max(0, value));
        
        // Create SVG
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 120 120");
        
        // Set color based on status
        let fillColor;
        switch (status) {
            case 'excellent': fillColor = "rgba(16, 185, 129, 0.5)"; break;
            case 'good': fillColor = "rgba(59, 130, 246, 0.5)"; break;
            case 'warning': fillColor = "rgba(245, 158, 11, 0.5)"; break;
            case 'critical': fillColor = "rgba(239, 68, 68, 0.5)"; break;
            default: fillColor = "rgba(107, 114, 128, 0.5)";
        }
        
        // Draw multiple hexagons for a radar-like effect
        for (let i = 1; i <= 5; i++) {
            const size = (i * 10);
            const hex = this.createHexagonPath(60, 60, size);
            
            const hexPath = document.createElementNS(svgNS, "path");
            hexPath.setAttribute("d", hex);
            hexPath.setAttribute("fill", "none");
            hexPath.setAttribute("stroke", "#e5e7eb");
            hexPath.setAttribute("stroke-width", "1");
            svg.appendChild(hexPath);
        }
        
        // Create data hexagon (value)
        const dataSize = (normalizedValue / 100) * 50;
        const dataHex = this.createHexagonPath(60, 60, dataSize);
        
        const dataPath = document.createElementNS(svgNS, "path");
        dataPath.setAttribute("d", dataHex);
        dataPath.setAttribute("fill", fillColor);
        dataPath.setAttribute("stroke", fillColor.replace("0.5", "1"));
        dataPath.setAttribute("stroke-width", "2");
        svg.appendChild(dataPath);
        
        // Clear and append
        element.innerHTML = '';
        element.appendChild(svg);
        
        // Store chart reference
        this.charts[elementId] = {
            svg,
            dataPath,
            value
        };
    }

    /**
     * Helper to create hexagon path
     */
    createHexagonPath(centerX, centerY, size) {
        const angles = [0, 60, 120, 180, 240, 300];
        const points = angles.map(angle => {
            const radians = (angle * Math.PI) / 180;
            const x = centerX + size * Math.cos(radians);
            const y = centerY + size * Math.sin(radians);
            return `${x},${y}`;
        });
        
        return `M${points[0]} L${points[1]} L${points[2]} L${points[3]} L${points[4]} L${points[5]} Z`;
    }

    /**
     * Create progress chart for budget discipline
     */
    createProgressChart(elementId, value, status) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Normalize value between 0 and 100
        const normalizedValue = Math.min(100, Math.max(0, value));
        
        // Create SVG
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 120 30");
        
        // Create background rect
        const background = document.createElementNS(svgNS, "rect");
        background.setAttribute("x", "10");
        background.setAttribute("y", "10");
        background.setAttribute("width", "100");
        background.setAttribute("height", "10");
        background.setAttribute("rx", "5");
        background.setAttribute("fill", "#e5e7eb");
        svg.appendChild(background);
        
        // Set color based on status
        let fillColor;
        switch (status) {
            case 'excellent': fillColor = "#10B981"; break;
            case 'good': fillColor = "#3B82F6"; break;
            case 'warning': fillColor = "#F59E0B"; break;
            case 'critical': fillColor = "#EF4444"; break;
            default: fillColor = "#6B7280";
        }
        
        // Create progress rect
        const progress = document.createElementNS(svgNS, "rect");
        progress.setAttribute("x", "10");
        progress.setAttribute("y", "10");
        progress.setAttribute("width", (normalizedValue).toString());
        progress.setAttribute("height", "10");
        progress.setAttribute("rx", "5");
        progress.setAttribute("fill", fillColor);
        svg.appendChild(progress);
        
        // Clear and append
        element.innerHTML = '';
        element.appendChild(svg);
        
        // Store chart reference
        this.charts[elementId] = {
            svg,
            progress,
            value
        };
    }

    /**
     * Handle KPI card actions
     */
    handleKPIAction(action, cardId) {
        switch (action) {
            case 'info':
                this.showKPIInfo(cardId);
                break;
            default:
                console.log(`Unknown KPI action: ${action} for card ${cardId}`);
        }
    }

    /**
     * Show KPI information modal
     */
    showKPIInfo(cardId) {
        const infoContent = {
            'kpi-income-growth': {
                title: 'Gelir Artış Oranı',
                description: 'Bu gösterge mevcut dönemdeki gelirinizin bir önceki döneme göre artış veya azalış oranını gösterir.',
                interpretations: [
                    { status: 'excellent', label: 'Mükemmel', description: '%5\'ten fazla artış' },
                    { status: 'good', label: 'İyi', description: '%0 - %5 arası artış' },
                    { status: 'warning', label: 'Dikkat', description: '%0 - %10 arası azalış' },
                    { status: 'critical', label: 'Kritik', description: '%10\'dan fazla azalış' }
                ]
            },
            'kpi-expense-control': {
                title: 'Harcama Kontrolü',
                description: 'Bu gösterge harcamalarınızın bütçelenen tutara göre gerçekleşme yüzdesini gösterir.',
                interpretations: [
                    { status: 'excellent', label: 'Mükemmel', description: 'Bütçenin %80\'inden az harcama' },
                    { status: 'good', label: 'İyi', description: 'Bütçenin %80 - %95\'i arası harcama' },
                    { status: 'warning', label: 'Dikkat', description: 'Bütçenin %95 - %105\'i arası harcama' },
                    { status: 'critical', label: 'Kritik', description: 'Bütçenin %105\'inden fazla harcama' }
                ]
            },
            'kpi-savings-rate': {
                title: 'Tasarruf Oranı',
                description: 'Bu gösterge toplam gelirinizin ne kadarını tasarruf ettiğinizi yüzde olarak gösterir.',
                interpretations: [
                    { status: 'excellent', label: 'Mükemmel', description: '%20\'den fazla tasarruf' },
                    { status: 'good', label: 'İyi', description: '%10 - %20 arası tasarruf' },
                    { status: 'warning', label: 'Dikkat', description: '%0 - %10 arası tasarruf' },
                    { status: 'critical', label: 'Kritik', description: 'Tasarruf yok (harcama gelirden fazla)' }
                ]
            },
            'kpi-category-diversity': {
                title: 'Kategori Çeşitliliği',
                description: 'Bu gösterge harcamalarınızın kategoriler arasında ne kadar dengeli dağıldığını gösterir.',
                interpretations: [
                    { status: 'excellent', label: 'Mükemmel', description: '70+ puanla çok dengeli dağılım' },
                    { status: 'good', label: 'İyi', description: '50-70 puan arasında dengeli dağılım' },
                    { status: 'warning', label: 'Dikkat', description: '30-50 puan arasında dengesiz dağılım' },
                    { status: 'critical', label: 'Kritik', description: '30 puanın altında çok dengesiz dağılım' }
                ]
            },
            'kpi-budget-discipline': {
                title: 'Bütçe Disiplini',
                description: 'Bu gösterge bütçelenmiş kategorilerde planlanan ve gerçekleşen harcamalar arasındaki tutarlılığı ölçer.',
                interpretations: [
                    { status: 'excellent', label: 'Mükemmel', description: '90+ puanla çok tutarlı bütçe takibi' },
                    { status: 'good', label: 'İyi', description: '75-90 puan arasında tutarlı bütçe takibi' },
                    { status: 'warning', label: 'Dikkat', description: '60-75 puan arasında kısmen tutarlı bütçe takibi' },
                    { status: 'critical', label: 'Kritik', description: '60 puanın altında tutarsız bütçe takibi' }
                ]
            }
        };
        
        const info = infoContent[cardId];
        if (!info) return;
        
        // Create modal container if it doesn't exist
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            document.body.appendChild(modalContainer);
        }
        
        // Create interpretation rows
        const interpretationRows = info.interpretations.map(interp => `
            <div class="flex items-center p-2 rounded ${interp.status === 'excellent' ? 'bg-green-50' : 
                                                       interp.status === 'good' ? 'bg-blue-50' : 
                                                       interp.status === 'warning' ? 'bg-yellow-50' : 
                                                       interp.status === 'critical' ? 'bg-red-50' : 'bg-gray-50'}">
                <div class="w-3 h-3 rounded-full mr-2 ${interp.status === 'excellent' ? 'bg-green-500' : 
                                                         interp.status === 'good' ? 'bg-blue-500' : 
                                                         interp.status === 'warning' ? 'bg-yellow-500' : 
                                                         interp.status === 'critical' ? 'bg-red-500' : 'bg-gray-500'}"></div>
                <div class="flex-1">
                    <div class="font-medium">${interp.label}</div>
                    <div class="text-sm text-gray-600">${interp.description}</div>
                </div>
            </div>
        `).join('');
        
        // Modal HTML
        modalContainer.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal">
                <div class="modal-header">
                    <h3>${info.title}</h3>
                    <button class="modal-close" onclick="document.getElementById('modalContainer').innerHTML = ''">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="mb-4">${info.description}</p>
                    
                    <h4 class="font-medium mb-2">Değerlendirme Kriterleri</h4>
                    <div class="space-y-2 mb-4">
                        ${interpretationRows}
                    </div>
                    
                    <h4 class="font-medium mb-2">Nasıl İyileştirebilirsiniz?</h4>
                    <p class="text-sm text-gray-700">
                        ${cardId === 'kpi-income-growth' ? 
                            'Gelir artış oranınızı iyileştirmek için ek gelir kaynakları oluşturmayı, mevcut gelir kaynaklarınızı optimize etmeyi veya daha yüksek getirili yatırımlar yapmayı düşünebilirsiniz.' : 
                        cardId === 'kpi-expense-control' ?
                            'Harcama kontrolünüzü iyileştirmek için bütçe planlarınızı düzenli olarak gözden geçirin, gereksiz harcamaları azaltın ve düzenli olarak harcamalarınızı takip edin.' :
                        cardId === 'kpi-savings-rate' ?
                            'Tasarruf oranınızı artırmak için öncelikle sabit giderlerinizi azaltmaya çalışın, otomatik tasarruf sistemleri kurun ve lüks harcamaları kısıtlayın.' :
                        cardId === 'kpi-category-diversity' ?
                            'Kategori çeşitliliğinizi dengelemek için belirli kategorilerdeki yoğun harcamaları azaltın ve daha dengeli bir harcama planı oluşturun.' :
                        cardId === 'kpi-budget-discipline' ?
                            'Bütçe disiplininizi artırmak için gerçekçi bütçe hedefleri belirleyin, düzenli olarak bütçenizi gözden geçirin ve beklenmedik harcamalar için bir acil durum fonu oluşturun.' :
                        ''}
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="document.getElementById('modalContainer').innerHTML = ''">Kapat</button>
                </div>
            </div>
        `;
        
        // Initialize icons
        lucide.createIcons();
    }

    /**
     * Update KPI cards
     * @param {Object} filters - Optional filters to apply
     */
    async update(filters = {}) {
        console.log('Updating KPI cards with filters:', filters);
        // Apply filters when calculating KPI data
        this.currentFilters = filters;
        await this.renderAdvancedKPICards();
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Clean up chart instances to prevent memory leaks
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Helper function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value || 0);
}

// Do not create an instance here, as the app.js will create it
// The class is now exported for use by the main application