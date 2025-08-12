// js/exportImport.js - JSON Export/Import İşlemleri

class ExportImportManager {
    constructor() {
        this.initializeEventListeners();
    }

    /**
     * Event listener'ları başlat
     */
    initializeEventListeners() {
        // Export butonu
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.showExportModal();
        });

        // Import butonu
        document.getElementById('importBtn')?.addEventListener('click', () => {
            this.showImportModal();
        });

        // File input
        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0]);
        });
    }

    /**
     * Export modal'ını göster
     */
    showExportModal() {
        const stats = dataManager.getSummaryStats();
        const transactionCount = dataManager.getTransactions().length;
        const categoryCount = Object.values(dataManager.getCategories()).flat().length;
        const accountCount = dataManager.getAccounts().length;
        const tagCount = dataManager.getTags().length;

        const modal = createModal(
            'Veri Dışa Aktar',
            `
            <div class="space-y-6">
                <!-- Özet Bilgiler -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-medium text-gray-900 mb-3">Dışa Aktarılacak Veriler</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">İşlemler:</span>
                            <span class="font-medium">${transactionCount}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Kategoriler:</span>
                            <span class="font-medium">${categoryCount}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Hesaplar:</span>
                            <span class="font-medium">${accountCount}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Etiketler:</span>
                            <span class="font-medium">${tagCount}</span>
                        </div>
                    </div>
                </div>

                <!-- Export Seçenekleri -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-3">Export Seçenekleri</h4>
                    <div class="space-y-3">
                        <label class="flex items-center">
                            <input type="radio" name="exportType" value="full" checked class="mr-2">
                            <span class="text-sm">Tam Yedek (Tüm veriler)</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="exportType" value="transactions" class="mr-2">
                            <span class="text-sm">Sadece İşlemler</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="exportType" value="categories" class="mr-2">
                            <span class="text-sm">Sadece Kategoriler</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="exportType" value="dateRange" class="mr-2">
                            <span class="text-sm">Tarih Aralığı</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="exportType" value="monthlyExcel" class="mr-2">
                            <span class="text-sm">Aylık Excel Raporu</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="exportType" value="yearlyExcel" class="mr-2">
                            <span class="text-sm">Yıllık Excel Raporu</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="exportType" value="pivotExcel" class="mr-2">
                            <span class="text-sm">Pivot Excel Raporu</span>
                        </label>
                    </div>
                </div>

                <!-- Tarih Aralığı (Gizli) -->
                <div id="dateRangeOptions" class="hidden space-y-3">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                            <input type="date" id="exportStartDate" class="w-full p-2 border border-gray-300 rounded">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                            <input type="date" id="exportEndDate" class="w-full p-2 border border-gray-300 rounded">
                        </div>
                    </div>
                </div>
                
                <!-- Excel Raporu Seçenekleri (Gizli) -->
                <div id="excelOptions" class="hidden space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Seçim</label>
                        <select id="excelPeriodSelect" class="w-full p-2 border border-gray-300 rounded">
                            <!-- Aylık için ay seçimi veya Yıllık için yıl seçimi (JavaScript ile doldurulacak) -->
                        </select>
                    </div>
                </div>
                
                <!-- Excel Export Seçeneği -->
                <div id="excelExportOption" class="space-y-3">
                    <label class="flex items-center">
                        <input type="checkbox" id="createExcelOption" class="mr-2">
                        <span class="text-sm">Excel (.xlsx) formatında da dışa aktar</span>
                    </label>
                </div>

                <!-- Dosya Bilgisi -->
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i data-lucide="info" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                        <div class="text-sm">
                            <p class="text-blue-800 font-medium">Dosya Formatı</p>
                            <p class="text-blue-700">
                                <span id="fileFormatInfo">UTF-8 kodlamalı JSON dosyası olarak indirilecek. Bu dosya daha sonra aynı uygulamada veya uyumlu sistemlerde kullanılabilir.</span>
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
                    text: 'Dışa Aktar',
                    class: 'bg-blue-500 hover:bg-blue-600 text-white',
                    onclick: 'exportImportManager.executeExport()'
                }
            ]
        );

        // Radio button event listeners
        modal.querySelectorAll('input[name="exportType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const dateRangeOptions = modal.querySelector('#dateRangeOptions');
                const excelOptions = modal.querySelector('#excelOptions');
                const excelExportOption = modal.querySelector('#excelExportOption');
                const fileFormatInfo = modal.querySelector('#fileFormatInfo');
                
                // Tüm opsiyon panellerini gizle
                dateRangeOptions.classList.add('hidden');
                excelOptions.classList.add('hidden');
                
                // Seçilen tipe göre uygun paneli göster
                if (e.target.value === 'dateRange') {
                    dateRangeOptions.classList.remove('hidden');
                    excelExportOption.classList.remove('hidden');
                    // Varsayılan değerleri ayarla
                    const thisMonth = getCurrentMonthRange();
                    modal.querySelector('#exportStartDate').value = thisMonth.start;
                    modal.querySelector('#exportEndDate').value = thisMonth.end;
                    fileFormatInfo.textContent = 'UTF-8 kodlamalı JSON dosyası olarak indirilecek. Bu dosya daha sonra aynı uygulamada veya uyumlu sistemlerde kullanılabilir.';
                } 
                else if (e.target.value === 'monthlyExcel') {
                    excelOptions.classList.remove('hidden');
                    excelExportOption.classList.add('hidden');
                    // Ay seçimi için dropdown içeriğini oluştur
                    const select = modal.querySelector('#excelPeriodSelect');
                    select.innerHTML = '';
                    
                    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                                      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                    const currentYear = new Date().getFullYear();
                    const currentMonth = new Date().getMonth();
                    
                    // Son 12 ay için seçenekleri oluştur
                    for (let i = 0; i < 12; i++) {
                        const monthIndex = (currentMonth - i + 12) % 12;
                        const year = currentYear - Math.floor((i - currentMonth) / 12);
                        const option = document.createElement('option');
                        option.value = `${year}-${monthIndex + 1}`;
                        option.textContent = `${monthNames[monthIndex]} ${year}`;
                        select.appendChild(option);
                    }
                    
                    fileFormatInfo.textContent = 'Excel (.xlsx) formatında detaylı aylık işlem raporu indirilecek.';
                }
                else if (e.target.value === 'yearlyExcel') {
                    excelOptions.classList.remove('hidden');
                    excelExportOption.classList.add('hidden');
                    // Yıl seçimi için dropdown içeriğini oluştur
                    const select = modal.querySelector('#excelPeriodSelect');
                    select.innerHTML = '';
                    
                    const currentYear = new Date().getFullYear();
                    
                    // Son 5 yıl için seçenekleri oluştur
                    for (let year = currentYear; year >= currentYear - 4; year--) {
                        const option = document.createElement('option');
                        option.value = year;
                        option.textContent = `${year} Yılı`;
                        select.appendChild(option);
                    }
                    
                    fileFormatInfo.textContent = 'Excel (.xlsx) formatında detaylı yıllık işlem ve bütçe raporu indirilecek.';
                }
                else if (e.target.value === 'pivotExcel') {
                    excelOptions.classList.remove('hidden');
                    excelExportOption.classList.add('hidden');
                    
                    // Yıl ve rapor tipi seçimi için dropdown içeriğini oluştur
                    const select = modal.querySelector('#excelPeriodSelect');
                    select.innerHTML = '';
                    
                    const currentYear = new Date().getFullYear();
                    
                    // Son 5 yıl için seçenekleri oluştur - gelir ve gider ayrı
                    for (let year = currentYear; year >= currentYear - 4; year--) {
                        // Gelir pivot raporu
                        const incomeOption = document.createElement('option');
                        incomeOption.value = `${year}-income`;
                        incomeOption.textContent = `${year} Gelir Pivot Raporu`;
                        select.appendChild(incomeOption);
                        
                        // Gider pivot raporu
                        const expenseOption = document.createElement('option');
                        expenseOption.value = `${year}-expense`;
                        expenseOption.textContent = `${year} Gider Pivot Raporu`;
                        select.appendChild(expenseOption);
                    }
                    
                    fileFormatInfo.textContent = 'Excel (.xlsx) formatında kategoriler ve aylar bazında pivot raporu indirilecek.';
                }
                else if (e.target.value === 'full' || e.target.value === 'transactions') {
                    excelExportOption.classList.remove('hidden');
                    fileFormatInfo.textContent = 'UTF-8 kodlamalı JSON dosyası olarak indirilecek. Bu dosya daha sonra aynı uygulamada veya uyumlu sistemlerde kullanılabilir.';
                }
                else {
                    excelExportOption.classList.add('hidden');
                    fileFormatInfo.textContent = 'UTF-8 kodlamalı JSON dosyası olarak indirilecek. Bu dosya daha sonra aynı uygulamada veya uyumlu sistemlerde kullanılabilir.';
                }
            });
        });

        lucide.createIcons();
    }

    /**
     * Export işlemini gerçekleştir
     */
    async executeExport() {
        const exportType = document.querySelector('input[name="exportType"]:checked').value;
        const startDate = document.getElementById('exportStartDate')?.value;
        const endDate = document.getElementById('exportEndDate')?.value;
        const periodSelect = document.getElementById('excelPeriodSelect')?.value;
        const createExcel = document.getElementById('createExcelOption')?.checked || false;

        let exportData;
        let filename = `butce_takibi_${new Date().toISOString().split('T')[0]}`;

        try {
            switch (exportType) {
                case 'full':
                    exportData = await this.createFullExport();
                    console.log('Tam yedek verileri:', Object.keys(exportData));
                    filename += '_tam_yedek.json';
                    this.downloadJSON(exportData, filename);
                    
                    // Ayrıca Excel oluşturulsun mu?
                    if (createExcel) {
                        this.convertCsvToExcel(exportData, filename);
                    }
                    break;
                
                case 'transactions':
                    exportData = await this.createTransactionsExport();
                    filename += '_islemler.json';
                    this.downloadJSON(exportData, filename);
                    
                    // Ayrıca Excel oluşturulsun mu?
                    if (createExcel) {
                        this.convertCsvToExcel(exportData, filename);
                    }
                    break;
                
                case 'categories':
                    exportData = await this.createCategoriesExport();
                    filename += '_kategoriler.json';
                    this.downloadJSON(exportData, filename);
                    break;
                
                case 'dateRange':
                    if (!startDate || !endDate) {
                        showToast('Tarih aralığı seçin!', 'error');
                        return;
                    }
                    exportData = await this.createDateRangeExport(startDate, endDate);
                    filename += `_${startDate}_${endDate}.json`;
                    this.downloadJSON(exportData, filename);
                    
                    // Ayrıca Excel oluşturulsun mu?
                    if (createExcel) {
                        this.convertCsvToExcel(exportData, filename);
                    }
                    break;
                
                case 'monthlyExcel':
                    if (!periodSelect) {
                        showToast('Ay seçin!', 'error');
                        return;
                    }
                    const [year, month] = periodSelect.split('-').map(Number);
                    await this.createMonthlyExcelReport(year, month);
                    break;
                
                case 'yearlyExcel':
                    if (!periodSelect) {
                        showToast('Yıl seçin!', 'error');
                        return;
                    }
                    const selectedYear = parseInt(periodSelect);
                    await this.createYearlyExcelReport(selectedYear);
                    break;
                
                case 'pivotExcel':
                    if (!periodSelect) {
                        showToast('Rapor tipini seçin!', 'error');
                        return;
                    }
                    // Yıl ve rapor tipini ayır (örnek: "2023-income")
                    const [pivotYear, pivotType] = periodSelect.split('-');
                    await this.createPivotExcelReport(parseInt(pivotYear), pivotType);
                    break;
                
                default:
                    showToast('Export türü seçin!', 'error');
                    return;
            }

            document.getElementById('modalContainer').innerHTML = '';
            showToast('Veriler başarıyla dışa aktarıldı!', 'success');

        } catch (error) {
            console.error('Export hatası:', error);
            showToast('Export sırasında hata oluştu!', 'error');
        }
    }

    /**
     * Tam export oluştur
     */
    async createFullExport() {
        const data = await dataManager.getData();
        // Veri yapısını kontrol et ve doğrula
        console.log('createFullExport - verilerin tam listesi:', Object.keys(data));
        
        // Eksik alan kontrolü
        if (!data.budgets) {
            console.warn('createFullExport: budgets alanı eksik, boş dizi oluşturuluyor');
            data.budgets = [];
        }
        
        // Export bilgilerini ekle
        return {
            ...data,
            exportInfo: {
                type: 'full',
                date: new Date().toISOString(),
                version: '1.0',
                description: 'Bütçe Takibi - Tam Yedek'
            }
        };
    }

    /**
     * İşlemler export'u oluştur
     */
    async createTransactionsExport() {
        const transactions = await dataManager.getTransactions();
        const categories = await dataManager.getCategories();
        const accounts = await dataManager.getAccounts();

        return {
            transactions,
            categories, // İşlemlerin anlaşılması için gerekli
            accounts,   // İşlemlerin anlaşılması için gerekli
            exportInfo: {
                type: 'transactions',
                date: new Date().toISOString(),
                version: '1.0',
                description: 'Bütçe Takibi - İşlemler'
            }
        };
    }

    /**
     * Kategoriler export'u oluştur
     */
    async createCategoriesExport() {
        const categories = await dataManager.getCategories();
        
        return {
            categories,
            exportInfo: {
                type: 'categories',
                date: new Date().toISOString(),
                version: '1.0',
                description: 'Bütçe Takibi - Kategoriler'
            }
        };
    }

    /**
     * Tarih aralığı export'u oluştur
     */
    async createDateRangeExport(startDate, endDate) {
        const transactions = await dataManager.getTransactions({ startDate, endDate });
        const categories = await dataManager.getCategories();
        const accounts = await dataManager.getAccounts();
        const tags = await dataManager.getTags();

        return {
            transactions,
            categories,
            accounts,
            tags,
            exportInfo: {
                type: 'dateRange',
                startDate,
                endDate,
                date: new Date().toISOString(),
                version: '1.0',
                description: `Bütçe Takibi - ${formatDate(startDate)} - ${formatDate(endDate)}`
            }
        };
    }

    /**
     * JSON dosyasını indir
     */
    downloadJSON(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Bellek temizliği
        URL.revokeObjectURL(link.href);
    }
    
    /**
     * Excel dosyasını indir
     */
    downloadExcel(workbook, filename) {
        // Excel dosyasını oluştur
        XLSX.writeFile(workbook, filename);
    }
    
    /**
     * HTML tabanlı Excel raporu oluştur
     */
    createHTMLReport(data, title) {
        const currentDate = new Date().toLocaleDateString('tr-TR');
        
        // HTML başlık ve stil
        let html = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                h1 {
                    color: #2C3E50;
                    border-bottom: 2px solid #3498DB;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .report-meta {
                    font-size: 14px;
                    color: #7F8C8D;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    box-shadow: 0 2px 3px rgba(0,0,0,0.1);
                }
                th {
                    background-color: #3498DB;
                    color: white;
                    font-weight: bold;
                    text-align: left;
                    padding: 10px;
                    border: 1px solid #ddd;
                }
                td {
                    padding: 8px 10px;
                    border: 1px solid #ddd;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                tr:hover {
                    background-color: #e9f7fe;
                }
                .section-header {
                    background-color: #2980B9;
                    color: white;
                    font-weight: bold;
                }
                .income {
                    color: #27AE60;
                }
                .expense {
                    color: #E74C3C;
                }
                .total-row {
                    font-weight: bold;
                    background-color: #ECF0F1;
                }
                .currency {
                    text-align: right;
                }
                .badge {
                    display: inline-block;
                    padding: 3px 7px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .badge-success {
                    background-color: #D5F5E3;
                    color: #27AE60;
                }
                .badge-warning {
                    background-color: #FCF3CF;
                    color: #F39C12;
                }
                .badge-danger {
                    background-color: #FADBD8;
                    color: #E74C3C;
                }
                .tab-container {
                    margin-bottom: 30px;
                }
                .tab {
                    overflow: hidden;
                    border: 1px solid #ccc;
                    background-color: #f1f1f1;
                }
                .tab button {
                    background-color: inherit;
                    float: left;
                    border: none;
                    outline: none;
                    cursor: pointer;
                    padding: 12px 16px;
                    transition: 0.3s;
                    font-size: 16px;
                }
                .tab button:hover {
                    background-color: #ddd;
                }
                .tab button.active {
                    background-color: #3498DB;
                    color: white;
                }
                .tabcontent {
                    display: none;
                    padding: 6px 12px;
                    border: 1px solid #ccc;
                    border-top: none;
                }
                .visible {
                    display: block;
                }
                footer {
                    margin-top: 30px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #7F8C8D;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>${title}</h1>
                <div class="report-meta">
                    <p>Oluşturma Tarihi: ${currentDate}</p>
                    <p>Bütçe Takibi Uygulaması</p>
                </div>
            </div>
            
            <div class="tab-container">
                <div class="tab">`;
        
        // Sekme başlıkları
        for (let i = 0; i < data.length; i++) {
            const isActive = i === 0 ? 'active' : '';
            html += `<button class="tablinks ${isActive}" onclick="openTab(event, 'tab${i}')">${data[i].title}</button>`;
        }
        
        html += `</div>`;
        
        // Sekme içerikleri
        for (let i = 0; i < data.length; i++) {
            const isVisible = i === 0 ? 'visible' : '';
            html += `
                <div id="tab${i}" class="tabcontent ${isVisible}">
                    <h2>${data[i].title}</h2>
                    ${data[i].content}
                </div>`;
        }
        
        html += `</div>
            
            <footer>
                <p>© ${new Date().getFullYear()} Bütçe Takibi. Tüm hakları saklıdır.</p>
            </footer>
            
            <script>
                function openTab(evt, tabName) {
                    var i, tabcontent, tablinks;
                    tabcontent = document.getElementsByClassName("tabcontent");
                    for (i = 0; i < tabcontent.length; i++) {
                        tabcontent[i].style.display = "none";
                    }
                    tablinks = document.getElementsByClassName("tablinks");
                    for (i = 0; i < tablinks.length; i++) {
                        tablinks[i].className = tablinks[i].className.replace(" active", "");
                    }
                    document.getElementById(tabName).style.display = "block";
                    evt.currentTarget.className += " active";
                }
            </script>
        </body>
        </html>`;
        
        return html;
    }
    
    /**
     * HTML tablosu oluştur
     */
    createHTMLTable(data, options = {}) {
        if (!data || data.length === 0) {
            return '<p>Veri bulunamadı.</p>';
        }
        
        const headers = data[0];
        const rows = data.slice(1);
        
        let tableHTML = '<table>';
        
        // Tablo başlığı
        tableHTML += '<thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead>';
        
        // Tablo gövdesi
        tableHTML += '<tbody>';
        
        rows.forEach(row => {
            // Özel satır sınıfları
            let rowClass = '';
            
            if (row[0] === 'TOPLAM GELİR' || row[0] === 'TOPLAM GİDER' || row[0].startsWith('TOPLAM')) {
                rowClass = 'total-row';
            } else if (row[0] === 'GELİR BÜTÇELERİ' || row[0] === 'GİDER BÜTÇELERİ' || row[0].includes('KATEGORİLERİ') || row[0].includes('ÖZETİ')) {
                rowClass = 'section-header';
            }
            
            tableHTML += `<tr class="${rowClass}">`;
            
            row.forEach((cell, index) => {
                let cellClass = '';
                let cellValue = cell;
                
                // Para birimi ve yüzde formatları
                if (options.currency && options.currency.includes(index)) {
                    cellClass = 'currency';
                    if (typeof cell === 'number') {
                        cellValue = cell.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
                    }
                } else if (options.percent && options.percent.includes(index)) {
                    cellClass = 'currency';
                    if (typeof cell === 'number') {
                        cellValue = cell.toLocaleString('tr-TR', { style: 'percent', minimumFractionDigits: 2 });
                    }
                } else if (cell === 'Gelir') {
                    cellClass = 'income';
                } else if (cell === 'Gider') {
                    cellClass = 'expense';
                } else if (cell === 'Bütçe Aşımı') {
                    cellValue = `<span class="badge badge-danger">Bütçe Aşımı</span>`;
                } else if (cell === 'Bütçe Altında') {
                    cellValue = `<span class="badge badge-success">Bütçe Altında</span>`;
                } else if (cell === 'Bütçe Dahilinde') {
                    cellValue = `<span class="badge badge-warning">Bütçe Dahilinde</span>`;
                }
                
                tableHTML += `<td class="${cellClass}">${cellValue === '' || cellValue === undefined || cellValue === null ? '&nbsp;' : cellValue}</td>`;
            });
            
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        
        return tableHTML;
    }
    
    /**
     * XLSX'ten HTML raporu oluştur ve indir
     */
    generateHTMLReport(workbook, filename) {
        const reportData = [];
        
        // Her sayfayı HTML'e dönüştür
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Para birimi ve yüzde formatlarını belirle
            const currencyColumns = [];
            const percentColumns = [];
            
            // Sütun formatlarını belirle
            if (sheetName === 'İşlemler') {
                currencyColumns.push(9, 10); // Tutar ve Planlanan Tutar sütunları
            } else if (sheetName === 'Özet' || sheetName === 'Yıllık Özet') {
                currencyColumns.push(1); // Değer sütunu
            } else if (sheetName === 'Kategoriler') {
                currencyColumns.push(1); // Tutar sütunu
            } else if (sheetName === 'Bütçe Planları' || sheetName === 'Bütçe Analizi') {
                currencyColumns.push(4, 5, 6); // Planlanan, Gerçekleşen, Fark
                percentColumns.push(7); // Fark % sütunu
            } else if (sheetName === 'Aylık Özet') {
                currencyColumns.push(1, 2, 3, 4, 5, 6); // Gelir, Gider, Net, Planlanan Gelir, Planlanan Gider, Planlanan Net
            }
            
            const tableHTML = this.createHTMLTable(jsonData, {
                currency: currencyColumns,
                percent: percentColumns
            });
            
            reportData.push({
                title: sheetName,
                content: tableHTML
            });
        });
        
        // Başlık oluştur
        const title = filename.replace('.xlsx', '').replace(/_/g, ' ').replace(/butce raporu/i, 'Bütçe Raporu').replace(/yillik/i, 'Yıllık');
        
        // HTML raporu oluştur
        const htmlReport = this.createHTMLReport(reportData, title);
        
        // HTML dosyasını indir
        const htmlFilename = filename.replace('.xlsx', '.html');
        const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = htmlFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        return htmlFilename;
    }
    
    /**
     * CSV formatını Excel formatına dönüştür
     */
    convertCsvToExcel(data, filename) {
        try {
            // İşlemleri al
            let transactions = [];
            
            if (data.transactions) {
                transactions = data.transactions;
            } else if (data.exportInfo && data.exportInfo.type === 'dateRange') {
                transactions = data.transactions || [];
            }
            
            // Boş bir workbook oluştur
            const workbook = XLSX.utils.book_new();
            workbook.Props = {
                Title: "İşlemler Excel Raporu",
                Subject: "Bütçe Takibi",
                Author: "Bütçe Takibi Uygulaması",
                CreatedDate: new Date()
            };
            
            // İşlemler sayfası oluştur
            const transactionsData = [
                // Başlık satırı
                ["ID", "Tarih", "Tür", "Durum", "Kategori", "Alt Kategori", "Hesap", "Açıklama", "Etiketler", "Tutar", "Planlanan Tutar"]
            ];
            
            // İşlemleri ekle
            transactions.forEach(t => {
                const category = dataManager.getCategoryById(t.categoryId);
                const subcategory = category?.subcategories?.find(s => s.id === t.subcategoryId);
                const account = dataManager.getAccounts().find(a => a.id === t.accountId);
                
                transactionsData.push([
                    t.id,
                    t.date,
                    t.type === 'income' ? 'Gelir' : 'Gider',
                    t.status === 'planned' ? 'Planlanan' : 'Gerçekleşen',
                    category ? category.name : '',
                    subcategory ? subcategory.name : '',
                    account ? account.name : '',
                    t.description || '',
                    t.tags ? t.tags.join(', ') : '',
                    t.amount || 0,
                    t.plannedAmount || 0
                ]);
            });
            
            // İşlemler sayfasını ekle
            const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
            XLSX.utils.book_append_sheet(workbook, transactionsSheet, "İşlemler");
            
            // Excel dosyasını indir
            const xlsxFilename = filename.replace(".json", ".xlsx");
            this.downloadExcel(workbook, xlsxFilename);
            
            return true;
        } catch (error) {
            console.error('CSV to Excel dönüşüm hatası:', error);
            showToast('Excel dönüşümü sırasında hata oluştu!', 'error');
            return false;
        }
    }
    
    /**
     * Aylık Excel Raporu oluştur
     */
    async createMonthlyExcelReport(year, month) {
        try {
            console.log(`Aylık Excel raporu oluşturuluyor: ${year}-${month}`);
            
            // XLSX'in yüklenip yüklenmediğini kontrol et
            if (typeof XLSX === 'undefined') {
                console.error('XLSX kütüphanesi yüklenmemiş!');
                showToast('Excel kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'error');
                return false;
            }
            
            // Ay adını al
            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                               'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            const monthName = monthNames[month - 1];
            
            // Tarih aralığını hesapla
            // Ay ve gün değerlerini iki haneli yap
            const monthNum = parseInt(month);
            const monthStr = monthNum.toString().padStart(2, '0');
            
            // Başlangıç tarihi: ayın ilk günü
            const startDate = `${year}-${monthStr}-01`;
            
            // Bitiş tarihi: ayın son günü
            // Bir sonraki ayın 0. günü = bu ayın son günü
            const lastDay = new Date(year, monthNum, 0).getDate();
            const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}`;
            
            console.log(`Tarih aralığı: ${startDate} - ${endDate}`);
            
            // Hem gerçekleşen hem planlanan işlemleri getir
            console.log('Gerçekleşen ve planlanan işlemler alınıyor...');
            
            // Gerçekleşen işlemler
            const actualTransactions = await dataManager.getTransactions({ 
                startDate: startDate, 
                endDate: endDate,
                status: 'actual'
            });
            
            // Planlanan işlemler
            const plannedTransactions = await dataManager.getTransactions({ 
                startDate: startDate, 
                endDate: endDate,
                status: 'planned'
            });
            
            // Tüm işlemler
            const transactions = [...actualTransactions, ...plannedTransactions];
            
            console.log(`İşlem sayısı: Gerçekleşen=${actualTransactions.length}, Planlanan=${plannedTransactions.length}, Toplam=${transactions.length}`);
            
            
            // Boş bir workbook oluştur
            const workbook = XLSX.utils.book_new();
            workbook.Props = {
                Title: `Aylık Bütçe Raporu - ${monthName} ${year}`,
                Subject: "Bütçe Takibi",
                Author: "Bütçe Takibi Uygulaması",
                CreatedDate: new Date()
            };
            
            // Kategorileri getir
            const categories = await dataManager.getCategories();
            console.log('Kategoriler alındı');
            
            // Hesapları getir
            const accounts = await dataManager.getAccounts();
            console.log('Hesaplar alındı');
            
            // Bütçe planlarını getir
            console.log('Bütçe planları alınıyor...');
            const budgetPlans = await dataManager.getBudgets({
                period: 'monthly',
                year: year,
                month: month
            });
            console.log(`Bütçe planı sayısı: ${budgetPlans.length}`);
            
            // İşlemler sayfası oluştur
            const transactionsData = [
                // Başlık satırı
                ["ID", "Tarih", "Tür", "Durum", "Kategori", "Alt Kategori", "Hesap", "Açıklama", "Etiketler", "Tutar", "Planlanan Tutar"]
            ];
            
            // İşlemleri sıralanmış şekilde hazırla (önce kategori, sonra tarih)
            const sortedTransactions = [...transactions].sort((a, b) => {
                // Önce türe göre sırala (gelir, gider)
                if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
                // Sonra kategoriye göre sırala
                if (a.categoryId !== b.categoryId) return a.categoryId.localeCompare(b.categoryId);
                // Son olarak tarihe göre sırala
                return new Date(a.date) - new Date(b.date);
            });
            
            // İşlemleri ekle
            for (const t of sortedTransactions) {
                try {
                    const category = await dataManager.getCategoryById(t.categoryId);
                    const subcategory = category?.subcategories?.find(s => s.id === t.subcategoryId);
                    const account = accounts.find(a => a.id === t.accountId);
                    
                    transactionsData.push([
                        t.id,
                        t.date,
                        t.type === 'income' ? 'Gelir' : 'Gider',
                        t.status === 'planned' ? 'Planlanan' : 'Gerçekleşen',
                        category ? category.name : '',
                        subcategory ? subcategory.name : '',
                        account ? account.name : '',
                        t.description || '',
                        t.tags ? t.tags.join(', ') : '',
                        // Gerçekleşen işlemse amount, planlanan işlemse 0
                        t.status === 'actual' ? (t.amount || 0) : 0,
                        // Planlanan işlemse plannedAmount, gerçekleşen işlemse plannedAmount (varsa)
                        t.status === 'planned' ? (t.plannedAmount || 0) : (t.plannedAmount || 0)
                    ]);
                } catch (err) {
                    console.error(`İşlem ${t.id} için veri dönüştürme hatası:`, err);
                }
            }
            
            console.log('İşlemler hazırlandı, Excel oluşturuluyor...');
            
            // Stil oluştur
            const styles = this.createExcelStyles();
            
            // İşlemler sayfasını oluştur ve ekle
            const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
            
            // İşlemler sayfası için stil ve format tanımlamaları
            const transactionColumns = {
                0: { type: 'text' },      // ID
                1: { type: 'date' },      // Tarih
                2: { styleKey: 'income' }, // Tür
                3: { type: 'text' },      // Durum
                4: { type: 'text' },      // Kategori
                5: { type: 'text' },      // Alt Kategori
                6: { type: 'text' },      // Hesap
                7: { type: 'text' },      // Açıklama
                8: { type: 'text' },      // Etiketler
                9: { type: 'currency' },  // Tutar
                10: { type: 'currency' }  // Planlanan Tutar
            };
            
            // İşlemler sayfasına stil uygula
            this.applyStylesToSheet(transactionsSheet, styles, 1, transactionColumns);
            
            // İşlemler sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, transactionsSheet, "İşlemler");
            
            // Özet sayfası oluştur
            const stats = await dataManager.getSummaryStats({
                startDate: startDate,
                endDate: endDate
            });
            
            const summaryData = [
                ["Aylık Bütçe Özeti", `${monthName} ${year}`],
                [""],
                ["GELİR VE GİDER ÖZETİ", ""],
                ["Toplam Gelir", stats.totalIncome],
                ["Toplam Gider", stats.totalExpense],
                ["Net Bakiye", stats.netBalance],
                [""],
                ["İŞLEM İSTATİSTİKLERİ", ""],
                ["İşlem Sayısı", stats.transactionCount],
                ["Planlanan İşlem Sayısı", stats.plannedTransactionCount],
                [""],
                ["PLANLANAN DEĞERLER", ""],
                ["Planlanan Gelir", stats.plannedIncome],
                ["Planlanan Gider", stats.plannedExpense],
                ["Planlanan Net Bakiye", stats.plannedNetBalance],
                [""],
                ["SAPMALAR", ""],
                ["Gelir Sapması", stats.incomeVariance],
                ["Gider Sapması", stats.expenseVariance],
                ["Bakiye Sapması", stats.balanceVariance]
            ];
            
            // Özet sayfasını oluştur
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            
            // Özet sayfası için stil tanımlamaları - özel sütun tipleri tanımlayalım
            const summaryColumns = {
                0: { type: 'text' },
                1: { type: 'auto' } // auto tipini kullanacağız
            };
            
            // Özet sayfasına stil uygula
            this.applyStylesToSheet(summarySheet, styles, 1, summaryColumns);
            
            // Formatları manuel olarak düzeltmek için her satırı kontrol edelim
            for (let i = 0; i < summaryData.length; i++) {
                const row = summaryData[i];
                if (row.length > 1) {
                    // İşlem sayısı alanları
                    if (row[0] === 'İşlem Sayısı' || row[0] === 'Planlanan İşlem Sayısı') {
                        const cellRef = XLSX.utils.encode_cell({r: i, c: 1});
                        if (summarySheet[cellRef]) {
                            // İşlem sayısı için sayısal format (para birimi değil)
                            summarySheet[cellRef].z = '#,##0';
                            // Eğer sayı değilse, sayıya dönüştür
                            if (typeof summarySheet[cellRef].v !== 'number') {
                                const num = parseInt(summarySheet[cellRef].v);
                                if (!isNaN(num)) {
                                    summarySheet[cellRef].v = num;
                                    summarySheet[cellRef].t = 'n'; // Sayı tipi
                                }
                            }
                        }
                    }
                    // Para birimi alanları
                    else if (row[0].includes('Gelir') || row[0].includes('Gider') || row[0].includes('Bakiye') || row[0].includes('Sapma')) {
                        const cellRef = XLSX.utils.encode_cell({r: i, c: 1});
                        if (summarySheet[cellRef]) {
                            // Para birimi formatı
                            summarySheet[cellRef].z = '"₺"#,##0.00;[Red]-"₺"#,##0.00';
                        }
                    }
                }
            }
            
            // Özet sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Özet");
            
            // Kategori özeti sayfası oluştur
            console.log('Kategori istatistikleri alınıyor...');
            const incomeCategories = await dataManager.getCategoryStats('income', {
                startDate: startDate,
                endDate: endDate
            });
            
            const expenseCategories = await dataManager.getCategoryStats('expense', {
                startDate: startDate,
                endDate: endDate
            });
            
            console.log(`${incomeCategories.length} gelir kategorisi, ${expenseCategories.length} gider kategorisi alındı`);
            
            const categoriesData = [
                ["Kategori Bazlı Gelir ve Giderler", `${monthName} ${year}`],
                [""],
                ["Gelir Kategorileri", ""],
                ["Kategori", "Tutar", "İşlem Sayısı"]
            ];
            
            // Gelir kategorilerini ekle
            incomeCategories.forEach(cat => {
                categoriesData.push([cat.categoryName, cat.amount, cat.transactionCount]);
            });
            
            categoriesData.push([""], ["Gider Kategorileri", ""], ["Kategori", "Tutar", "İşlem Sayısı"]);
            
            // Gider kategorilerini ekle
            expenseCategories.forEach(cat => {
                categoriesData.push([cat.categoryName, cat.amount, cat.transactionCount]);
            });
            
            // Kategoriler sayfasını oluştur
            const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
            
            // Kategoriler sayfası için stil tanımlamaları
            const categoryColumns = {
                0: { type: 'text' },
                1: { type: 'currency' },
                2: { type: 'number' }
            };
            
            // Kategoriler sayfasına stil uygula
            this.applyStylesToSheet(categoriesSheet, styles, 1, categoryColumns);
            
            // Kategoriler sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Kategoriler");
            
            // Bütçe sayfası oluştur - budgetPlans değişkenini zaten üstte almıştık
            console.log(`Bütçe planları işleniyor: ${budgetPlans ? budgetPlans.length : 0} plan`);
            
            const budgetsData = [
                ["Bütçe Planları ve Gerçekleşmeler", `${monthName} ${year}`],
                [""],
                ["Kategori", "Alt Kategori", "Tür", "Durum", "Planlanan", "Gerçekleşen", "Fark", "Fark %", "Açıklama"]
            ];
            
            try {
                // Bütçeleri ekle
                if (budgetPlans && Array.isArray(budgetPlans) && budgetPlans.length > 0) {
                    // Gelir bütçeleri
                    let incomeBudgets = [];
                    // Gider bütçeleri
                    let expenseBudgets = [];
                    
                    for (const budget of budgetPlans) {
                        if (!budget || !budget.categoryId) {
                            console.warn('Geçersiz bütçe verisi, atlanıyor:', budget);
                            continue;
                        }
                        
                        try {
                            const category = await dataManager.getCategoryById(budget.categoryId);
                            const subcategory = category?.subcategories?.find(s => s.id === budget.subcategoryId);
                            
                            // Gerçekleşen tutarı hesapla
                            const transactions = await dataManager.getTransactions({
                                categoryId: budget.categoryId,
                                subcategoryId: budget.subcategoryId,
                                startDate: startDate,
                                endDate: endDate,
                                status: 'actual'
                            });
                            
                            const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const plannedAmount = budget.plannedAmount || 0;
                            const variance = actualAmount - plannedAmount;
                            const variancePercent = plannedAmount !== 0 ? (variance / plannedAmount) * 100 : 0;
                            const status = dataManager.getBudgetStatus(variance, plannedAmount);
                            
                            const budgetRow = [
                                category ? category.name : 'Bilinmeyen Kategori',
                                subcategory ? subcategory.name : '',
                                category ? (category.type === 'income' ? 'Gelir' : 'Gider') : '',
                                this.getBudgetStatusText(status),
                                plannedAmount,
                                actualAmount,
                                variance,
                                variancePercent,
                                budget.description || ''
                            ];
                            
                            // Kategori tipine göre gruplandır
                            if (category && category.type === 'income') {
                                incomeBudgets.push(budgetRow);
                            } else {
                                expenseBudgets.push(budgetRow);
                            }
                        } catch (err) {
                            console.error(`Bütçe ${budget.id} için veri dönüştürme hatası:`, err);
                        }
                    }
                    
                    // Önce gelir bütçelerini ekle
                    if (incomeBudgets.length > 0) {
                        budgetsData.push(['GELİR BÜTÇELERİ', '', '', '', '', '', '', '', '']);
                        const incomeStartRow = budgetsData.length; // Gelir verilerinin başlangıç satırı
                        incomeBudgets.forEach(row => budgetsData.push(row));
                        
                        // Excel formüllü toplam satırı ekle
                        budgetsData.push(this.createExcelFormulaRow(
                            budgetsData, 
                            incomeBudgets, 
                            'TOPLAM GELİR', 
                            incomeStartRow
                        ));
                        budgetsData.push(['', '', '', '', '', '', '', '', '']);
                    }
                    
                    // Sonra gider bütçelerini ekle
                    if (expenseBudgets.length > 0) {
                        budgetsData.push(['GİDER BÜTÇELERİ', '', '', '', '', '', '', '', '']);
                        expenseBudgets.forEach(row => budgetsData.push(row));
                        
                        // Gider toplamları
                        const totalPlanned = expenseBudgets.reduce((sum, row) => sum + (row[4] || 0), 0);
                        const totalActual = expenseBudgets.reduce((sum, row) => sum + (row[5] || 0), 0);
                        const totalVariance = totalActual - totalPlanned;
                        const totalPercent = totalPlanned !== 0 ? (totalVariance / totalPlanned) * 100 : 0;
                        
                        budgetsData.push(['TOPLAM GİDER', '', '', '', totalPlanned, totalActual, totalVariance, totalPercent, '']);
                    }
                    
                    // Hiç bütçe yoksa bilgi mesajı
                    if (incomeBudgets.length === 0 && expenseBudgets.length === 0) {
                        budgetsData.push(["Bütçe planı bulunamadı", "", "", "", "", "", "", "", ""]);
                    }
                } else {
                    console.log('İşlenecek bütçe planı bulunamadı');
                    budgetsData.push(["Bütçe planı bulunamadı", "", "", "", "", "", "", "", ""]);
                }
            } catch (err) {
                console.error('Bütçe verisi işlenirken hata oluştu:', err);
                budgetsData.push(["Bütçe verisi işlenirken hata oluştu", "", "", "", "", "", "", "", ""]);
            }
            
            // Bütçe sayfasını oluştur
            const budgetsSheet = XLSX.utils.aoa_to_sheet(budgetsData);
            
            // Bütçe sayfası için stil tanımlamaları
            const budgetColumns = {
                0: { type: 'text' },
                1: { type: 'text' },
                2: { type: 'text' },
                3: { type: 'text' },
                4: { type: 'currency' },
                5: { type: 'currency' },
                6: { type: 'currency' },
                7: { type: 'percent' },
                8: { type: 'text' }
            };
            
            // Bütçe sayfasına stil uygula
            this.applyStylesToSheet(budgetsSheet, styles, 3, budgetColumns);
            
            // Bütçe sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, budgetsSheet, "Bütçe Planları");
            
            // Excel dosyasını indir
            const filename = `butce_raporu_${year}_${month.toString().padStart(2, '0')}.xlsx`;
            this.downloadExcel(workbook, filename);
            
            return true;
        } catch (error) {
            console.error('Aylık Excel raporu oluşturma hatası:', error);
            showToast('Excel raporu oluşturulurken hata oluştu!', 'error');
            return false;
        }
    }
    
    /**
     * Yıllık Excel Raporu oluştur
     */
    async createYearlyExcelReport(year) {
        try {
            console.log(`Yıllık Excel raporu oluşturuluyor: ${year}`);
            
            // XLSX'in yüklenip yüklenmediğini kontrol et
            if (typeof XLSX === 'undefined') {
                console.error('XLSX kütüphanesi yüklenmemiş!');
                showToast('Excel kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'error');
                return false;
            }
            
            // Tarih aralığını hesapla - Yılın tamamını kapsayacak şekilde
            // JavaScript'te aylar 0-indexed (0=Ocak, 11=Aralık)
            
            // Başlangıç tarihini yılın ilk gününe ayarla
            const startDate = `${year}-01-01`;
            
            // Bitiş tarihini yılın son gününe ayarla
            const endDate = `${year}-12-31`;
            
            console.log(`Yıl: ${year}, tarih aralığı: ${startDate} - ${endDate}`);
            
            console.log(`Tarih aralığı: ${startDate} - ${endDate}`);
            
            // Hem gerçekleşen hem planlanan işlemleri getir
            console.log('Gerçekleşen ve planlanan işlemler alınıyor...');
            
            // Gerçekleşen işlemler
            const actualTransactions = await dataManager.getTransactions({ 
                startDate: startDate, 
                endDate: endDate,
                status: 'actual'
            });
            
            // Planlanan işlemler
            const plannedTransactions = await dataManager.getTransactions({ 
                startDate: startDate, 
                endDate: endDate,
                status: 'planned'
            });
            
            // Tüm işlemler
            const transactions = [...actualTransactions, ...plannedTransactions];
            
            console.log(`İşlem sayısı: Gerçekleşen=${actualTransactions.length}, Planlanan=${plannedTransactions.length}, Toplam=${transactions.length}`);
            
            // Boş bir workbook oluştur
            const workbook = XLSX.utils.book_new();
            workbook.Props = {
                Title: `Yıllık Bütçe Raporu - ${year}`,
                Subject: "Bütçe Takibi",
                Author: "Bütçe Takibi Uygulaması",
                CreatedDate: new Date()
            };
            
            // İşlemler sayfası oluştur
            const transactionsData = [
                // Başlık satırı
                ["ID", "Tarih", "Tür", "Durum", "Kategori", "Alt Kategori", "Hesap", "Açıklama", "Etiketler", "Tutar", "Planlanan Tutar"]
            ];
            
            // Kategorileri getir
            const categories = await dataManager.getCategories();
            console.log('Kategoriler alındı');
            
            // Hesapları getir
            const accounts = await dataManager.getAccounts();
            console.log('Hesaplar alındı');
            
            // İşlemleri ekle
            for (const t of transactions) {
                try {
                    const category = await dataManager.getCategoryById(t.categoryId);
                    const subcategory = category?.subcategories?.find(s => s.id === t.subcategoryId);
                    const account = accounts.find(a => a.id === t.accountId);
                    
                    transactionsData.push([
                        t.id,
                        t.date,
                        t.type === 'income' ? 'Gelir' : 'Gider',
                        t.status === 'planned' ? 'Planlanan' : 'Gerçekleşen',
                        category ? category.name : '',
                        subcategory ? subcategory.name : '',
                        account ? account.name : '',
                        t.description || '',
                        t.tags ? t.tags.join(', ') : '',
                        // Gerçekleşen işlemler için amount, planlanan işlemler için 0
                        t.status === 'actual' ? (t.amount || 0) : 0,
                        // Planlanan işlemler için plannedAmount, gerçekleşen işlemler için plannedAmount (varsa)
                        t.status === 'planned' ? (t.plannedAmount || 0) : (t.plannedAmount || 0)
                    ]);
                } catch (err) {
                    console.error(`İşlem ${t.id} için veri dönüştürme hatası:`, err);
                }
            }
            
            console.log('İşlemler hazırlandı, Excel oluşturuluyor...');
            
            // Stil oluştur
            const styles = this.createExcelStyles();
            
            // İşlemler sayfasını oluştur ve ekle
            const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
            
            // İşlemler sayfası için stil ve format tanımlamaları
            const transactionColumns = {
                0: { type: 'text' },      // ID
                1: { type: 'date' },      // Tarih
                2: { styleKey: 'income' }, // Tür
                3: { type: 'text' },      // Durum
                4: { type: 'text' },      // Kategori
                5: { type: 'text' },      // Alt Kategori
                6: { type: 'text' },      // Hesap
                7: { type: 'text' },      // Açıklama
                8: { type: 'text' },      // Etiketler
                9: { type: 'currency' },  // Tutar
                10: { type: 'currency' }  // Planlanan Tutar
            };
            
            // İşlemler sayfasına stil uygula
            this.applyStylesToSheet(transactionsSheet, styles, 1, transactionColumns);
            
            // İşlemler sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, transactionsSheet, "İşlemler");
            
            // Yıllık özet sayfası oluştur
            const stats = await dataManager.getSummaryStats({
                startDate: startDate,
                endDate: endDate
            });
            
            const summaryData = [
                ["Yıllık Bütçe Özeti", `${year}`],
                [""],
                ["GELİR VE GİDER ÖZETİ", ""],
                ["Toplam Gelir", stats.totalIncome],
                ["Toplam Gider", stats.totalExpense],
                ["Net Bakiye", stats.netBalance],
                [""],
                ["İŞLEM İSTATİSTİKLERİ", ""],
                ["İşlem Sayısı", stats.transactionCount],
                ["Planlanan İşlem Sayısı", stats.plannedTransactionCount],
                [""],
                ["PLANLANAN DEĞERLER", ""],
                ["Planlanan Gelir", stats.plannedIncome],
                ["Planlanan Gider", stats.plannedExpense],
                ["Planlanan Net Bakiye", stats.plannedNetBalance],
                [""],
                ["SAPMALAR", ""],
                ["Gelir Sapması", stats.incomeVariance],
                ["Gider Sapması", stats.expenseVariance],
                ["Bakiye Sapması", stats.balanceVariance]
            ];
            
            // Özet sayfasını oluştur
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            
            // Özet sayfası için stil tanımlamaları - özel sütun tipleri tanımlayalım
            const summaryColumns = {
                0: { type: 'text' },
                1: { type: 'auto' } // auto tipini kullanacağız
            };
            
            // Özet sayfasına stil uygula
            this.applyStylesToSheet(summarySheet, styles, 1, summaryColumns);
            
            // Formatları manuel olarak düzeltmek için her satırı kontrol edelim
            for (let i = 0; i < summaryData.length; i++) {
                const row = summaryData[i];
                if (row.length > 1) {
                    // İşlem sayısı alanları
                    if (row[0] === 'İşlem Sayısı' || row[0] === 'Planlanan İşlem Sayısı') {
                        const cellRef = XLSX.utils.encode_cell({r: i, c: 1});
                        if (summarySheet[cellRef]) {
                            // İşlem sayısı için sayısal format (para birimi değil)
                            summarySheet[cellRef].z = '#,##0';
                            // Eğer sayı değilse, sayıya dönüştür
                            if (typeof summarySheet[cellRef].v !== 'number') {
                                const num = parseInt(summarySheet[cellRef].v);
                                if (!isNaN(num)) {
                                    summarySheet[cellRef].v = num;
                                    summarySheet[cellRef].t = 'n'; // Sayı tipi
                                }
                            }
                        }
                    }
                    // Para birimi alanları
                    else if (row[0].includes('Gelir') || row[0].includes('Gider') || row[0].includes('Bakiye') || row[0].includes('Sapma')) {
                        const cellRef = XLSX.utils.encode_cell({r: i, c: 1});
                        if (summarySheet[cellRef]) {
                            // Para birimi formatı
                            summarySheet[cellRef].z = '"₺"#,##0.00;[Red]-"₺"#,##0.00';
                        }
                    }
                }
            }
            
            // Özet sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Yıllık Özet");
            
            // Aylık özet sayfası oluştur
            console.log('Aylık istatistikler alınıyor...');
            const monthlyStats = await dataManager.getMonthlyStats(year);
            console.log(`${monthlyStats.length} ay için istatistik alındı`);
            
            const monthlyData = [
                ["Aylık Bütçe Özeti", `${year}`],
                [""],
                ["Ay", "Gelir", "Gider", "Net", "Planlanan Gelir", "Planlanan Gider", "Planlanan Net", "İşlem Sayısı"]
            ];
            
            // Aylık verileri ekle
            monthlyStats.forEach(month => {
                monthlyData.push([
                    month.monthName,
                    month.totalIncome,
                    month.totalExpense,
                    month.netBalance,
                    month.plannedIncome,
                    month.plannedExpense,
                    month.plannedNetBalance,
                    month.transactionCount
                ]);
            });
            
            // Tüm ayların toplamını ekle
            const totalIncome = monthlyStats.reduce((sum, month) => sum + month.totalIncome, 0);
            const totalExpense = monthlyStats.reduce((sum, month) => sum + month.totalExpense, 0);
            const totalNetBalance = totalIncome - totalExpense;
            const totalPlannedIncome = monthlyStats.reduce((sum, month) => sum + month.plannedIncome, 0);
            const totalPlannedExpense = monthlyStats.reduce((sum, month) => sum + month.plannedExpense, 0);
            const totalPlannedNetBalance = totalPlannedIncome - totalPlannedExpense;
            const totalTransactionCount = monthlyStats.reduce((sum, month) => sum + month.transactionCount, 0);
            
            monthlyData.push(['']);
            monthlyData.push([
                'TOPLAM',
                totalIncome,
                totalExpense,
                totalNetBalance,
                totalPlannedIncome,
                totalPlannedExpense,
                totalPlannedNetBalance,
                totalTransactionCount
            ]);
            
            // Aylık özet sayfasını oluştur
            const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
            
            // Aylık özet sayfası için stil tanımlamaları
            const monthlyColumns = {
                0: { type: 'text' },
                1: { type: 'currency' },
                2: { type: 'currency' },
                3: { type: 'currency' },
                4: { type: 'currency' },
                5: { type: 'currency' },
                6: { type: 'currency' },
                7: { type: 'number' }
            };
            
            // Aylık özet sayfasına stil uygula
            this.applyStylesToSheet(monthlySheet, styles, 3, monthlyColumns);
            
            // İşlem sayısı sütunu için doğru formatlama
            // Son sütun (7) her zaman işlem sayısıdır, para birimi olmamalı
            for (let r = 3; r < monthlyData.length; r++) {
                const cellRef = XLSX.utils.encode_cell({r: r, c: 7});
                if (monthlySheet[cellRef]) {
                    // İşlem sayısı için sayısal format (para birimi değil)
                    monthlySheet[cellRef].z = '#,##0';
                    // Sayı tipine dönüştür
                    if (typeof monthlySheet[cellRef].v !== 'number') {
                        const num = parseInt(String(monthlySheet[cellRef].v).replace(/[^0-9.-]+/g, ''));
                        if (!isNaN(num)) {
                            monthlySheet[cellRef].v = num;
                            monthlySheet[cellRef].t = 'n'; // Sayı tipi
                        }
                    }
                }
            }
            
            // Aylık özet sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, monthlySheet, "Aylık Özet");
            
            // Kategori özeti sayfası oluştur
            console.log('Kategori istatistikleri alınıyor...');
            const incomeCategories = await dataManager.getCategoryStats('income', {
                startDate: startDate,
                endDate: endDate
            });
            
            const expenseCategories = await dataManager.getCategoryStats('expense', {
                startDate: startDate,
                endDate: endDate
            });
            
            console.log(`${incomeCategories.length} gelir kategorisi, ${expenseCategories.length} gider kategorisi alındı`);
            
            const categoriesData = [
                ["Kategori Bazlı Gelir ve Giderler", `${year}`],
                [""],
                ["GELİR KATEGORİLERİ", "", ""],
                ["Kategori", "Tutar", "İşlem Sayısı"]
            ];
            
            // Gelir kategorileri ve alt kategorileri ekle
            const allCategories = await dataManager.getCategories();
            const incomeWithSubs = await this.enrichCategoryStatsWithSubcategories(
                incomeCategories, 
                allCategories, 
                'income', 
                startDate, 
                endDate
            );
            
            // Gelir kategorilerini ve alt kategorileri ekle
            incomeWithSubs.forEach(entry => {
                if (entry.isSubcategory) {
                    // Alt kategori girişi için girintili gösterim
                    categoriesData.push([`   ${entry.categoryName}`, entry.amount, entry.transactionCount]);
                } else {
                    // Ana kategori
                    categoriesData.push([entry.categoryName, entry.amount, entry.transactionCount]);
                }
            });
            
            // Gelir toplamı
            const totalIncomeAmount = incomeWithSubs.reduce((sum, cat) => sum + cat.amount, 0);
            const totalIncomeCount = incomeWithSubs.reduce((sum, cat) => sum + cat.transactionCount, 0);
            categoriesData.push(["TOPLAM GELİR", totalIncomeAmount, totalIncomeCount]);
            
            categoriesData.push([""], ["GİDER KATEGORİLERİ", "", ""], ["Kategori", "Tutar", "İşlem Sayısı"]);
            
            // Gider kategorileri ve alt kategorileri ekle
            const expenseWithSubs = await this.enrichCategoryStatsWithSubcategories(
                expenseCategories, 
                allCategories, 
                'expense', 
                startDate, 
                endDate
            );
            
            // Gider kategorilerini ve alt kategorileri ekle
            expenseWithSubs.forEach(entry => {
                if (entry.isSubcategory) {
                    // Alt kategori girişi için girintili gösterim
                    categoriesData.push([`   ${entry.categoryName}`, entry.amount, entry.transactionCount]);
                } else {
                    // Ana kategori
                    categoriesData.push([entry.categoryName, entry.amount, entry.transactionCount]);
                }
            });
            
            // Gider toplamı
            const totalExpenseAmount = expenseWithSubs.reduce((sum, cat) => sum + cat.amount, 0);
            const totalExpenseCount = expenseWithSubs.reduce((sum, cat) => sum + cat.transactionCount, 0);
            categoriesData.push(["TOPLAM GİDER", totalExpenseAmount, totalExpenseCount]);
            
            // Kategori sayfasını oluştur
            const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
            
            // Kategori sayfası için stil tanımlamaları
            const categoryColumns = {
                0: { type: 'text' },
                1: { type: 'currency' },
                2: { type: 'number' }
            };
            
            // Kategori sayfasına stil uygula
            this.applyStylesToSheet(categoriesSheet, styles, 1, categoryColumns);
            
            // Kategori sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Kategoriler");
            
            // Bütçe sayfası oluştur
            console.log('Bütçe verileri alınıyor...');
            const budgetPlans = await dataManager.getBudgets({
                period: 'yearly',
                year: year
            });
            console.log(`${budgetPlans ? budgetPlans.length : 0} bütçe planı alındı`);
            
            const budgetsData = [
                ["Yıllık Bütçe Planları ve Gerçekleşmeler", `${year}`],
                [""],
                ["Kategori", "Alt Kategori", "Tür", "Durum", "Planlanan", "Gerçekleşen", "Fark", "Fark %", "Açıklama"]
            ];
            
            try {
                // Tüm kategori ve alt kategoriler için kapsamlı bütçe raporu oluştur
                // Bu fonksiyon hem bütçesi olan hem olmayan tüm kategori/alt kategorileri dahil eder
                const categories = await dataManager.getCategories();
                
                // Tüm işlemleri al - bütçe hesaplaması için gerçekleşen işlemler gerekli
                const allTransactions = await dataManager.getTransactions({
                    startDate: startDate,
                    endDate: endDate,
                    status: 'actual'
                });
                
                // Planlanan işlemleri de al
                const plannedTransactions = await dataManager.getTransactions({
                    startDate: startDate,
                    endDate: endDate,
                    status: 'planned'
                });
                
                console.log(`Bütçe raporu için ${allTransactions.length} gerçekleşen, ${plannedTransactions.length} planlanan işlem alındı`);
                
                // Bu değişkeni daha sonra kullanacağız, önceden tanımlayalım
                this.allTransactions = allTransactions;
                
                // Gerçekleşen işlemlerden bütçe verileri oluştur
                const { incomeBudgets, expenseBudgets } = await this.generateBudgetReportData(
                    categories, 
                    budgetPlans, 
                    startDate, 
                    endDate
                );
                    
                    // Önce gelir bütçelerini ekle
                    if (incomeBudgets.length > 0) {
                        budgetsData.push(['GELİR BÜTÇELERİ', '', '', '', '', '', '', '', '']);
                        const incomeStartRow = budgetsData.length; // Gelir verilerinin başlangıç satırı
                        incomeBudgets.forEach(row => budgetsData.push(row));
                        
                        // Excel formüllü toplam satırı ekle
                        budgetsData.push(this.createExcelFormulaRow(
                            budgetsData, 
                            incomeBudgets, 
                            'TOPLAM GELİR', 
                            incomeStartRow
                        ));
                        budgetsData.push(['', '', '', '', '', '', '', '', '']);
                    }
                    
                    // Sonra gider bütçelerini ekle
                    if (expenseBudgets.length > 0) {
                        budgetsData.push(['GİDER BÜTÇELERİ', '', '', '', '', '', '', '', '']);
                        expenseBudgets.forEach(row => budgetsData.push(row));
                        
                        // Gider toplamları
                        const totalPlanned = expenseBudgets.reduce((sum, row) => sum + (row[4] || 0), 0);
                        const totalActual = expenseBudgets.reduce((sum, row) => sum + (row[5] || 0), 0);
                        const totalVariance = totalActual - totalPlanned;
                        const totalPercent = totalPlanned !== 0 ? (totalVariance / totalPlanned) * 100 : 0;
                        
                        budgetsData.push(['TOPLAM GİDER', '', '', '', totalPlanned, totalActual, totalVariance, totalPercent, '']);
                    }
                    
                    // Hiç bütçe yoksa bilgi mesajı
                    if (incomeBudgets.length === 0 && expenseBudgets.length === 0 && this.allTransactions && this.allTransactions.length > 0) {
                        // Gerçekleşen işlemlerden bütçe verileri oluştur
                        for (const transaction of this.allTransactions) {
                            try {
                                const category = await dataManager.getCategoryById(transaction.categoryId);
                                if (!category) continue;
                                
                                // İşlemdeki alt kategoriyi bul
                                const subcategory = category.subcategories?.find(s => s.id === transaction.subcategoryId);
                                
                                // Kategori tipine göre ilgili listeye ekle
                                const budgetRow = [
                                    category.name,
                                    subcategory ? subcategory.name : "",
                                    category.type === "income" ? "Gelir" : "Gider",
                                    "İşlemlerden Oluşturuldu", // Durum
                                    transaction.plannedAmount || 0, // Planlanan
                                    transaction.amount || 0, // Gerçekleşen
                                    (transaction.amount || 0) - (transaction.plannedAmount || 0), // Fark
                                    transaction.plannedAmount ? ((transaction.amount - transaction.plannedAmount) / transaction.plannedAmount) * 100 : 100, // Yüzde
                                    transaction.description || ""
                                ];
                                
                                if (category.type === "income") {
                                    incomeBudgets.push(budgetRow);
                                } else {
                                    expenseBudgets.push(budgetRow);
                                }
                            } catch (err) {
                                console.error(`İşlemden bütçe verisi oluşturulurken hata: ${transaction.id}`, err);
                            }
                        }
                        
                        // Tekrar kontrol et, eğer hala boşsa mesaj göster
                        if (incomeBudgets.length === 0 && expenseBudgets.length === 0) {
                            budgetsData.push(["Bütçe planı bulunamadı", "", "", "", "", "", "", "", ""]);
                        } else {
                            // Gelir ve gider başlıklarını ekleyip yeniden göster
                            if (incomeBudgets.length > 0) {
                                budgetsData.push(["GELİR BÜTÇELERİ", "", "", "", "", "", "", "", ""]);
                                const incomeStartRow = budgetsData.length;
                                incomeBudgets.forEach(row => budgetsData.push(row));
                                budgetsData.push(this.createExcelFormulaRow(
                                    budgetsData, incomeBudgets, "TOPLAM GELİR", incomeStartRow
                                ));
                                budgetsData.push(["", "", "", "", "", "", "", "", ""]);
                            }
                            
                            if (expenseBudgets.length > 0) {
                                budgetsData.push(["GİDER BÜTÇELERİ", "", "", "", "", "", "", "", ""]);
                                const expenseStartRow = budgetsData.length;
                                expenseBudgets.forEach(row => budgetsData.push(row));
                                budgetsData.push(this.createExcelFormulaRow(
                                    budgetsData, expenseBudgets, "TOPLAM GİDER", expenseStartRow
                                ));
                            }
                        }
                    }
            } catch (err) {
                console.error('Bütçe verisi işlenirken hata oluştu:', err);
                budgetsData.push(["Bütçe verisi işlenirken hata oluştu", "", "", "", "", "", "", "", ""]);
            }
            
            // Bütçe sayfasını oluştur
            const budgetsSheet = XLSX.utils.aoa_to_sheet(budgetsData);
            
            // Bütçe sayfası için stil tanımlamaları
            const budgetColumns = {
                0: { type: 'text' },
                1: { type: 'text' },
                2: { type: 'text' },
                3: { type: 'text' },
                4: { type: 'currency' },
                5: { type: 'currency' },
                6: { type: 'currency' },
                7: { type: 'percent' },
                8: { type: 'text' }
            };
            
            // Bütçe sayfasına stil uygula
            this.applyStylesToSheet(budgetsSheet, styles, 3, budgetColumns);
            
            // Bütçe sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, budgetsSheet, "Bütçe Planları");
            
            // Bütçe analizi sayfası oluştur
            console.log('Bütçe analizi alınıyor...');
            const budgetAnalysis = await dataManager.getBudgetAnalysis(year);
            console.log(`${budgetAnalysis.length} bütçe analizi satırı alındı`);
            
            // Tüm işlemleri al - bütçe analizi için gerçekleşen işlemler gerekli
            const analysisTransactions = await dataManager.getTransactions({
                startDate: startDate,
                endDate: endDate,
                status: 'actual'
            });
            
            // Planlanan işlemleri de al
            const analysisPlanTransactions = await dataManager.getTransactions({
                startDate: startDate,
                endDate: endDate,
                status: 'planned'
            });
            
            console.log(`Bütçe analizi için ${analysisTransactions.length} gerçekleşen, ${analysisPlanTransactions.length} planlanan işlem alındı`);
            
            const analysisData = [
                ["Bütçe Analizi", `${year}`],
                [""],
                ["Kategori", "Alt Kategori", "Tür", "Planlanan", "Gerçekleşen", "Fark", "Fark %", "Durum"]
            ];
            
            // Analiz verilerini tür bazlı gruplandır
            const incomeAnalysis = [];
            const expenseAnalysis = [];
            
            // Varsa bütçe analizi verilerini kullan
            if (budgetAnalysis && budgetAnalysis.length > 0) {
                budgetAnalysis.forEach(analysis => {
                    const row = [
                        analysis.categoryName,
                        analysis.subcategoryName || '',
                        analysis.categoryType === 'income' ? 'Gelir' : 'Gider',
                        analysis.plannedAmount,
                        analysis.actualAmount,
                        analysis.variance,
                        analysis.variancePercent,
                        this.getBudgetStatusText(analysis.status)
                    ];
                    
                    if (analysis.categoryType === 'income') {
                        incomeAnalysis.push(row);
                    } else {
                        expenseAnalysis.push(row);
                    }
                });
            } 
            // Bütçe analizi yoksa, işlem verilerinden oluştur
            else if (analysisTransactions && analysisTransactions.length > 0) {
                console.log('Bütçe analizi bulunamadı, işlem verilerinden oluşturuluyor...');
                
                // Tüm kategorileri getir
                const categories = await dataManager.getCategories();
                
                // İşlemleri kategori ve alt kategorilere göre grupla
                const transactionsByCategory = {};
                
                for (const transaction of analysisTransactions) {
                    const categoryId = transaction.categoryId;
                    const subcategoryId = transaction.subcategoryId;
                    
                    if (!categoryId) continue;
                    
                    const key = `${categoryId}:${subcategoryId || 'main'}`;
                    
                    if (!transactionsByCategory[key]) {
                        transactionsByCategory[key] = {
                            categoryId,
                            subcategoryId,
                            transactions: []
                        };
                    }
                    
                    transactionsByCategory[key].transactions.push(transaction);
                }
                
                // Her grup için analiz verisi oluştur
                for (const key in transactionsByCategory) {
                    const group = transactionsByCategory[key];
                    const category = categories[group.categoryId];
                    
                    if (!category) continue;
                    
                    const subcategory = category.subcategories?.find(s => s.id === group.subcategoryId);
                    const transactions = group.transactions;
                    
                    // Gerçekleşen toplam tutar
                    const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    
                    // Planlanan tutar (yoksa gerçekleşen kullanılır)
                    let plannedAmount = transactions.reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
                    if (plannedAmount === 0) plannedAmount = actualAmount;
                    
                    // Sapma hesapla
                    const variance = actualAmount - plannedAmount;
                    const variancePercent = plannedAmount !== 0 ? (variance / plannedAmount) * 100 : 0;
                    
                    // Durumu belirle
                    const status = dataManager.getBudgetStatus(variance, plannedAmount);
                    
                    // Satır oluştur
                    const row = [
                        category.name,
                        subcategory ? subcategory.name : '',
                        category.type === 'income' ? 'Gelir' : 'Gider',
                        plannedAmount,
                        actualAmount,
                        variance,
                        variancePercent,
                        this.getBudgetStatusText(status)
                    ];
                    
                    // İlgili listeye ekle
                    if (category.type === 'income') {
                        incomeAnalysis.push(row);
                    } else {
                        expenseAnalysis.push(row);
                    }
                }
            }
            
            // Gelir analizlerini ekle
            if (incomeAnalysis.length > 0) {
                analysisData.push(['GELİR BÜTÇELERİ PERFORMANSI', '', '', '', '', '', '', '']);
                incomeAnalysis.forEach(row => analysisData.push(row));
                
                // Gelir toplamları
                const totalPlanned = incomeAnalysis.reduce((sum, row) => sum + (row[3] || 0), 0);
                const totalActual = incomeAnalysis.reduce((sum, row) => sum + (row[4] || 0), 0);
                const totalVariance = totalActual - totalPlanned;
                const totalPercent = totalPlanned !== 0 ? (totalVariance / totalPlanned) * 100 : 0;
                
                analysisData.push(['TOPLAM GELİR', '', '', totalPlanned, totalActual, totalVariance, totalPercent, '']);
                analysisData.push(['', '', '', '', '', '', '', '']);
            }
            
            // Gider analizlerini ekle
            if (expenseAnalysis.length > 0) {
                analysisData.push(['GİDER BÜTÇELERİ PERFORMANSI', '', '', '', '', '', '', '']);
                expenseAnalysis.forEach(row => analysisData.push(row));
                
                // Gider toplamları
                const totalPlanned = expenseAnalysis.reduce((sum, row) => sum + (row[3] || 0), 0);
                const totalActual = expenseAnalysis.reduce((sum, row) => sum + (row[4] || 0), 0);
                const totalVariance = totalActual - totalPlanned;
                const totalPercent = totalPlanned !== 0 ? (totalVariance / totalPlanned) * 100 : 0;
                
                analysisData.push(['TOPLAM GİDER', '', '', totalPlanned, totalActual, totalVariance, totalPercent, '']);
            }
            
            // Analiz sayfasını oluştur
            const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
            
            // Analiz sayfası için stil tanımlamaları
            const analysisColumns = {
                0: { type: 'text' },
                1: { type: 'text' },
                2: { type: 'text' },
                3: { type: 'currency' },
                4: { type: 'currency' },
                5: { type: 'currency' },
                6: { type: 'percent' },
                7: { type: 'text' }
            };
            
            // Analiz sayfasına stil uygula
            this.applyStylesToSheet(analysisSheet, styles, 3, analysisColumns);
            
            // Analiz sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, analysisSheet, "Bütçe Analizi");
            
            // Excel dosyasını indir
            const filename = `yillik_butce_raporu_${year}.xlsx`;
            this.downloadExcel(workbook, filename);
            
            return true;
        } catch (error) {
            console.error('Yıllık Excel raporu oluşturma hatası:', error);
            showToast('Excel raporu oluşturulurken hata oluştu!', 'error');
            return false;
        }
    }
    
    /**
     * Bütçe durumu açıklamasını getir
     */
    getBudgetStatusText(status) {
        const texts = {
            'over-budget': 'Bütçe Aşımı',
            'near-budget': 'Bütçe Sınırında',
            'on-budget': 'Bütçe Dahilinde',
            'under-budget': 'Bütçe Altında',
            'no-budget': 'Bütçe Yok'
        };
        return texts[status] || status;
    }
    
    /**
     * Excel formülü kullanan bir toplam satırı oluşturur
     * @param {Array} data - Veri dizisi
     * @param {Array} budgetData - Hesaplanacak bütçe verileri
     * @param {string} label - Toplam satırının etiketi
     * @param {number} startRow - Veri dizisindeki başlangıç satırı
     * @returns {Array} - XLSX'in kullanabileceği formüllü toplam satırı
     */
    createExcelFormulaRow(data, budgetData, label, startRow) {
        const firstRow = startRow;
        const lastRow = startRow + budgetData.length - 1;
        
        // Planlanan tutarların toplamı
        const plannedSum = budgetData.reduce((sum, row) => sum + (row[4] || 0), 0);
        // Gerçekleşen tutarların toplamı
        const actualSum = budgetData.reduce((sum, row) => sum + (row[5] || 0), 0);
        // Sapma toplamı
        const varianceSum = actualSum - plannedSum;
        // Sapma yüzdesi
        const percentSum = plannedSum !== 0 ? (varianceSum / plannedSum) * 100 : 0;
        
        return [
            label, 
            '', 
            '', 
            '', 
            { t: 'n', f: `SUM(E${firstRow}:E${lastRow})`, v: plannedSum },
            { t: 'n', f: `SUM(F${firstRow}:F${lastRow})`, v: actualSum },
            { t: 'n', f: `SUM(G${firstRow}:G${lastRow})`, v: varianceSum },
            { t: 'n', v: percentSum },
            ''
        ];
    }
    
    /**
     * Kategori istatistiklerine alt kategorileri ekler
     * @param {Array} categoryStats - Kategori istatistikleri
     * @param {Object} allCategories - Tüm kategoriler
     * @param {string} type - Kategori tipi (income/expense)
     * @param {string} startDate - Başlangıç tarihi
     * @param {string} endDate - Bitiş tarihi
     * @returns {Array} - Alt kategorileri içeren zenginleştirilmiş liste
     */
    async enrichCategoryStatsWithSubcategories(categoryStats, allCategories, type, startDate, endDate) {
        const result = [];
        
        // Kategorileri tiplerine göre filtrele
        const typeCategories = Object.values(allCategories).filter(cat => cat.type === type);
        
        // Tüm işlemleri getir - işlemlerde alt kategorileri bulmak için
        const allTransactions = await dataManager.getTransactions({
            startDate: startDate,
            endDate: endDate,
            status: 'actual',
            type: type
        });
        
        console.log(`${type} türünde ${allTransactions.length} işlem alındı`);
        
        // Her ana kategori için
        for (const cat of categoryStats) {
            // Ana kategoriyi ekle
            result.push({
                ...cat,
                isSubcategory: false
            });
            
            // Bu ana kategoriye ait kategori nesnesini bul
            const categoryObj = typeCategories.find(c => c.name === cat.categoryName);
            if (!categoryObj || !categoryObj.subcategories || categoryObj.subcategories.length === 0) {
                console.log(`${cat.categoryName} için alt kategori bulunamadı veya alt kategori yok`);
                continue; // Alt kategori yok, bir sonraki ana kategoriye geç
            }
            
            console.log(`${categoryObj.name} kategorisi için ${categoryObj.subcategories.length} alt kategori işleniyor`);
            
            // Her alt kategori için
            for (const subcategory of categoryObj.subcategories) {
                try {
                    // Bu kategorinin ve alt kategorinin işlemlerini filtrele
                    const subTransactions = allTransactions.filter(t => 
                        t.categoryId === categoryObj.id && t.subcategoryId === subcategory.id
                    );
                    
                    console.log(`${categoryObj.name} > ${subcategory.name} için ${subTransactions.length} işlem bulundu`);
                    
                    // İşlemler varsa alt kategoriyi ekle
                    if (subTransactions.length > 0) {
                        const amount = subTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                        result.push({
                            categoryName: subcategory.name,
                            amount: amount,
                            transactionCount: subTransactions.length,
                            isSubcategory: true,
                            parentCategory: categoryObj.name
                        });
                    } else {
                        // İşlem yoksa bile alt kategoriyi sıfır değerle gösterelim
                        result.push({
                            categoryName: subcategory.name,
                            amount: 0,
                            transactionCount: 0,
                            isSubcategory: true,
                            parentCategory: categoryObj.name
                        });
                    }
                } catch (err) {
                    console.error(`Alt kategori istatistikleri alınırken hata oluştu: ${subcategory.name}`, err);
                }
            }
        }
        
        return result;
    }
    
    /**
     * Kategorilerden bütçe raporu verisi oluştur
     * Bu fonksiyon tüm kategorileri ve alt kategorileri gezer
     * Hem bütçeli hem bütçesiz kategorileri raporlar
     */
    async generateBudgetReportData(categories, budgetPlans, startDate, endDate) {
        // Gelir bütçeleri
        let incomeBudgets = [];
        // Gider bütçeleri
        let expenseBudgets = [];
        
        // Gelir kategorileri
        const incomeCategories = Object.values(categories).filter(cat => cat.type === 'income');
        for (const category of incomeCategories) {
            // Ana kategori bütçesi varsa ekle
            const categoryBudget = budgetPlans && Array.isArray(budgetPlans) ? 
                budgetPlans.find(b => b.categoryId === category.id && !b.subcategoryId) : null;
            
            if (categoryBudget) {
                try {
                    // Gerçekleşen tutarı hesapla
                    const transactions = await dataManager.getTransactions({
                        categoryId: category.id,
                        subcategoryId: null, // Alt kategori olmayanlar
                        startDate: startDate,
                        endDate: endDate,
                        status: 'actual'
                    });
                    
                    const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    const plannedAmount = categoryBudget.plannedAmount || 0;
                    const variance = actualAmount - plannedAmount;
                    const variancePercent = plannedAmount !== 0 ? (variance / plannedAmount) * 100 : 0;
                    const status = dataManager.getBudgetStatus(variance, plannedAmount);
                    
                    incomeBudgets.push([
                        category.name,
                        '', // Alt kategori yok
                        'Gelir',
                        this.getBudgetStatusText(status),
                        plannedAmount,
                        actualAmount,
                        variance,
                        variancePercent,
                        categoryBudget.description || ''
                    ]);
                } catch (err) {
                    console.error(`Kategori bütçesi için veri dönüştürme hatası:`, err);
                }
            } else {
                // Kategori bütçesi yoksa, sadece gerçekleşen işlemler varsa bu kategori için ekle
                try {
                    const transactions = await dataManager.getTransactions({
                        categoryId: category.id,
                        subcategoryId: null,
                        startDate: startDate,
                        endDate: endDate,
                        status: 'actual'
                    });
                    
                    if (transactions.length > 0) {
                        const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                        
                        incomeBudgets.push([
                            category.name,
                            '', // Alt kategori yok
                            'Gelir',
                            'Bütçe Yok',
                            0, // Planlanan yok
                            actualAmount,
                            actualAmount, // Sapma = gerçekleşen
                            100, // %100 sapma
                            ''
                        ]);
                    }
                } catch (err) {
                    console.error(`Kategori işlemleri için veri dönüştürme hatası:`, err);
                }
            }
            
            // Alt kategorileri işle
            if (category.subcategories && category.subcategories.length > 0) {
                for (const subcategory of category.subcategories) {
                    // Alt kategori bütçesi varsa ekle
                    const subcatBudget = budgetPlans && Array.isArray(budgetPlans) ?
                        budgetPlans.find(b => b.categoryId === category.id && b.subcategoryId === subcategory.id) : null;
                    
                    if (subcatBudget) {
                        try {
                            // Gerçekleşen tutarı hesapla
                            const transactions = await dataManager.getTransactions({
                                categoryId: category.id,
                                subcategoryId: subcategory.id,
                                startDate: startDate,
                                endDate: endDate,
                                status: 'actual'
                            });
                            
                            const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const plannedAmount = subcatBudget.plannedAmount || 0;
                            const variance = actualAmount - plannedAmount;
                            const variancePercent = plannedAmount !== 0 ? (variance / plannedAmount) * 100 : 0;
                            const status = dataManager.getBudgetStatus(variance, plannedAmount);
                            
                            incomeBudgets.push([
                                category.name,
                                subcategory.name,
                                'Gelir',
                                this.getBudgetStatusText(status),
                                plannedAmount,
                                actualAmount,
                                variance,
                                variancePercent,
                                subcatBudget.description || ''
                            ]);
                        } catch (err) {
                            console.error(`Alt kategori bütçesi için veri dönüştürme hatası:`, err);
                        }
                    } else {
                        // Alt kategori bütçesi yoksa, sadece gerçekleşen işlemler varsa ekle
                        try {
                            const transactions = await dataManager.getTransactions({
                                categoryId: category.id,
                                subcategoryId: subcategory.id,
                                startDate: startDate,
                                endDate: endDate,
                                status: 'actual'
                            });
                            
                            if (transactions.length > 0) {
                                const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                                
                                incomeBudgets.push([
                                    category.name,
                                    subcategory.name,
                                    'Gelir',
                                    'Bütçe Yok',
                                    0, // Planlanan yok
                                    actualAmount,
                                    actualAmount, // Sapma = gerçekleşen
                                    100, // %100 sapma
                                    ''
                                ]);
                            }
                        } catch (err) {
                            console.error(`Alt kategori işlemleri için veri dönüştürme hatası:`, err);
                        }
                    }
                }
            }
        }
        
        // Gider kategorileri
        const expenseCategories = Object.values(categories).filter(cat => cat.type === 'expense');
        for (const category of expenseCategories) {
            // Ana kategori bütçesi varsa ekle
            const categoryBudget = budgetPlans && Array.isArray(budgetPlans) ? 
                budgetPlans.find(b => b.categoryId === category.id && !b.subcategoryId) : null;
            
            if (categoryBudget) {
                try {
                    // Gerçekleşen tutarı hesapla
                    const transactions = await dataManager.getTransactions({
                        categoryId: category.id,
                        subcategoryId: null, // Alt kategori olmayanlar
                        startDate: startDate,
                        endDate: endDate,
                        status: 'actual'
                    });
                    
                    const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    const plannedAmount = categoryBudget.plannedAmount || 0;
                    const variance = actualAmount - plannedAmount;
                    const variancePercent = plannedAmount !== 0 ? (variance / plannedAmount) * 100 : 0;
                    const status = dataManager.getBudgetStatus(variance, plannedAmount);
                    
                    expenseBudgets.push([
                        category.name,
                        '', // Alt kategori yok
                        'Gider',
                        this.getBudgetStatusText(status),
                        plannedAmount,
                        actualAmount,
                        variance,
                        variancePercent,
                        categoryBudget.description || ''
                    ]);
                } catch (err) {
                    console.error(`Kategori bütçesi için veri dönüştürme hatası:`, err);
                }
            } else {
                // Kategori bütçesi yoksa, sadece gerçekleşen işlemler varsa bu kategori için ekle
                try {
                    const transactions = await dataManager.getTransactions({
                        categoryId: category.id,
                        subcategoryId: null,
                        startDate: startDate,
                        endDate: endDate,
                        status: 'actual'
                    });
                    
                    if (transactions.length > 0) {
                        const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                        
                        expenseBudgets.push([
                            category.name,
                            '', // Alt kategori yok
                            'Gider',
                            'Bütçe Yok',
                            0, // Planlanan yok
                            actualAmount,
                            actualAmount, // Sapma = gerçekleşen
                            100, // %100 sapma
                            ''
                        ]);
                    }
                } catch (err) {
                    console.error(`Kategori işlemleri için veri dönüştürme hatası:`, err);
                }
            }
            
            // Alt kategorileri işle
            if (category.subcategories && category.subcategories.length > 0) {
                for (const subcategory of category.subcategories) {
                    // Alt kategori bütçesi varsa ekle
                    const subcatBudget = budgetPlans && Array.isArray(budgetPlans) ?
                        budgetPlans.find(b => b.categoryId === category.id && b.subcategoryId === subcategory.id) : null;
                    
                    if (subcatBudget) {
                        try {
                            // Gerçekleşen tutarı hesapla
                            const transactions = await dataManager.getTransactions({
                                categoryId: category.id,
                                subcategoryId: subcategory.id,
                                startDate: startDate,
                                endDate: endDate,
                                status: 'actual'
                            });
                            
                            const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const plannedAmount = subcatBudget.plannedAmount || 0;
                            const variance = actualAmount - plannedAmount;
                            const variancePercent = plannedAmount !== 0 ? (variance / plannedAmount) * 100 : 0;
                            const status = dataManager.getBudgetStatus(variance, plannedAmount);
                            
                            expenseBudgets.push([
                                category.name,
                                subcategory.name,
                                'Gider',
                                this.getBudgetStatusText(status),
                                plannedAmount,
                                actualAmount,
                                variance,
                                variancePercent,
                                subcatBudget.description || ''
                            ]);
                        } catch (err) {
                            console.error(`Alt kategori bütçesi için veri dönüştürme hatası:`, err);
                        }
                    } else {
                        // Alt kategori bütçesi yoksa, sadece gerçekleşen işlemler varsa ekle
                        try {
                            const transactions = await dataManager.getTransactions({
                                categoryId: category.id,
                                subcategoryId: subcategory.id,
                                startDate: startDate,
                                endDate: endDate,
                                status: 'actual'
                            });
                            
                            if (transactions.length > 0) {
                                const actualAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                                
                                expenseBudgets.push([
                                    category.name,
                                    subcategory.name,
                                    'Gider',
                                    'Bütçe Yok',
                                    0, // Planlanan yok
                                    actualAmount,
                                    actualAmount, // Sapma = gerçekleşen
                                    100, // %100 sapma
                                    ''
                                ]);
                            }
                        } catch (err) {
                            console.error(`Alt kategori işlemleri için veri dönüştürme hatası:`, err);
                        }
                    }
                }
            }
        }
        
        return { incomeBudgets, expenseBudgets };
    }
    
    /**
     * Pivot raporu oluştur - kategoriler X ekseninde, aylar/yıllar Y ekseninde
     */
    async createPivotExcelReport(year, type) {
        try {
            console.log(`Pivot Excel raporu oluşturuluyor: ${year}, Tip: ${type}`);
            
            // XLSX'in yüklenip yüklenmediğini kontrol et
            if (typeof XLSX === 'undefined') {
                console.error('XLSX kütüphanesi yüklenmemiş!');
                showToast('Excel kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'error');
                return false;
            }
            
            // Tarih aralığını hesapla - tüm yıl için tam ay sınırları
            // Pivot raporun kapsayacağı tam tarih aralığı - yılın ilk gününden son gününe
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            
            // Rapor başlığında gösterilecek tarih aralığı
            const displayStartDate = `01.01.${year}`;
            const displayEndDate = `31.12.${year}`;
            
            console.log(`Pivot raporu yıl: ${year}, tam tarih aralığı: ${startDate} - ${endDate}`);
            
            console.log(`Tarih aralığı: ${startDate} - ${endDate}`);
            
            // Veri tipine göre başlık belirle
            const reportTitle = type === 'income' ? 'Gelir' : 'Gider';
            
            // Gerçekleşen işlemleri getir - sadece seçilen tipte (gelir veya gider)
            console.log(`Fetching actual transactions for year ${year}, type ${type}`);
            const actualTransactions = await dataManager.getTransactions({ 
                startDate: startDate, 
                endDate: endDate,
                status: 'actual',
                type: type
            });
            
            // Sonuçları kontrol et
            console.log(`Received ${actualTransactions.length} actual transactions`);
            if (actualTransactions.length > 0) {
                console.log('Sample actual transaction:', JSON.stringify(actualTransactions[0]));
            }
            
            // Planlanan işlemleri getir - sadece seçilen tipte (gelir veya gider)
            console.log(`Fetching planned transactions for year ${year}, type ${type}`);
            const plannedTransactions = await dataManager.getTransactions({ 
                startDate: startDate, 
                endDate: endDate,
                status: 'planned',
                type: type
            });
            
            // Sonuçları kontrol et
            console.log(`Received ${plannedTransactions.length} planned transactions`);
            if (plannedTransactions.length > 0) {
                console.log('Sample planned transaction:', JSON.stringify(plannedTransactions[0]));
            }
            
            console.log(`İşlem sayısı: Gerçekleşen=${actualTransactions.length}, Planlanan=${plannedTransactions.length}`);
            
            // Tarih formatını kontrol et
            if (actualTransactions.length > 0) {
                console.log(`İlk işlem tarih formatı: ${actualTransactions[0].date} (${typeof actualTransactions[0].date})`);
                console.log(`İlk işlem tarihi:`, actualTransactions[0].date);
                console.log(`Bu işlemin ayı kontrol:`, 
                           actualTransactions[0].date >= `${year}-01-01` && 
                           actualTransactions[0].date <= `${year}-01-31`);
            } else {
                console.log(`Uyarı: ${year} yılı için ${type} tipinde işlem bulunamadı!`);
            }
            
            // Kategorileri getir
            const categories = await dataManager.getCategories();
            const typeCategories = Object.values(categories).filter(cat => cat.type === type);
            console.log(`${type} kategori sayısı: ${typeCategories.length}`);
            
            // Boş bir workbook oluştur
            const workbook = XLSX.utils.book_new();
            workbook.Props = {
                Title: `${year} Yılı ${reportTitle} Pivot Raporu`,
                Subject: "Bütçe Takibi",
                Author: "Bütçe Takibi Uygulaması",
                CreatedDate: new Date()
            };
            
            // Ay adları
            const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                                'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            
            // GERÇEKLEŞEN DEĞERLER SAYFASI
            
            // Pivot tablo verilerini hazırla - Gerçekleşen Değerler
            const actualPivotData = [];
            
            // Rapor başlığı ve tarih aralığı
            actualPivotData.push([`Pivot ${reportTitle} Raporu`]);
            actualPivotData.push([`01.01.${year} - 31.12.${year}`]);
            actualPivotData.push([""]);  // Boş satır
            
            // Başlık satırı - kategori isimleri
            const actualHeaderRow = ["Ay"];
            typeCategories.forEach(category => {
                actualHeaderRow.push(category.name);
            });
            actualHeaderRow.push("TOPLAM"); // Toplam kolonu
            actualPivotData.push(actualHeaderRow);
            
            // Her ay için veri satırı oluştur - Gerçekleşen
            for (let month = 0; month < 12; month++) {
                // Ay numarası 0-indexed olduğu için +1 ile 1-indexed yapıyoruz
                const monthNum = month + 1;
                // Ay başlangıcı: YYYY-MM-01
                const monthStart = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
                
                // Ay sonu: Bir sonraki ayın ilk gününden bir gün öncesi
                // Şubat ve diğer ayların farklı gün sayılarını otomatik hesaplar
                const lastDay = new Date(year, monthNum, 0).getDate();
                const monthEnd = `${year}-${monthNum.toString().padStart(2, '0')}-${lastDay}`;
                
                // Bu aydaki işlemleri filtrele
                console.log(`Filtering transactions for ${monthNames[month]} ${year}: ${monthStart} to ${monthEnd}`);
                
                // Tarih aralığına göre filtreleme - direct string comparison
                // Bu, ISO string formatındaki tarihleri (YYYY-MM-DD) doğru şekilde karşılaştırır
                const monthTransactions = actualTransactions.filter(t => {
                    // Tarih kontrolü
                    const dateStr = t.date ? t.date.split('T')[0] : '';
                    const matches = dateStr >= monthStart && dateStr <= monthEnd;
                    
                    if (matches) {
                        console.log(`Transaction matched for ${monthNames[month]}: ${t.id}, date: ${dateStr}, amount: ${t.amount}`);
                    }
                    return matches;
                });
                
                console.log(`Found ${monthTransactions.length} transactions for ${monthNames[month]} ${year}`);
                
                // Ay satırı oluştur - Ay adı ve yıl bilgisi ile
                const monthRow = [`${monthNames[month]} ${year}`];
                
                // Her kategori için toplam tutarı hesapla
                let monthTotal = 0;
                typeCategories.forEach(category => {
                    // Bu kategorideki işlemleri bul
                    const categoryTransactions = monthTransactions.filter(t => 
                        t.categoryId === category.id
                    );
                    
                    // Toplam tutarı hesapla
                    const categoryTotal = categoryTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    monthRow.push(categoryTotal);
                    monthTotal += categoryTotal;
                });
                
                // Ay toplamını ekle
                monthRow.push(monthTotal);
                
                // Satırı pivot verisine ekle
                actualPivotData.push(monthRow);
            }
            
            // Toplam satırı ekle - Gerçekleşen
            actualPivotData.push([""]);  // Boş satır ekleyerek toplamı ayır
            const actualTotalRow = ["TOPLAM"];
            
            // Her kategori için yıllık toplam
            let actualGrandTotal = 0;
            for (let colIndex = 1; colIndex < actualHeaderRow.length; colIndex++) {
                const categoryTotal = actualPivotData.slice(1).reduce((sum, row) => sum + (row[colIndex] || 0), 0);
                actualTotalRow.push(categoryTotal);
                if (colIndex < actualHeaderRow.length - 1) { // Son sütun zaten toplam olduğu için saymıyoruz
                    actualGrandTotal += categoryTotal;
                }
            }
            actualPivotData.push(actualTotalRow);
            
            // Gerçekleşen pivot sayfasını oluştur
            const actualPivotSheet = XLSX.utils.aoa_to_sheet(actualPivotData);
            
            // Stil oluştur
            const styles = this.createExcelStyles();
            
            // Pivot sayfası için stil tanımlamaları - tüm değer hücreleri para birimi formatında
            const pivotColumns = {};
            for (let i = 0; i < actualHeaderRow.length; i++) {
                pivotColumns[i] = i === 0 ? { type: 'text' } : { type: 'currency' };
            }
            
            // Gerçekleşen pivot sayfasına stil uygula - 4 satırlık başlık (başlık, tarih, boşluk, sütun başlıkları)
            this.applyStylesToSheet(actualPivotSheet, styles, 4, pivotColumns);
            
            // Gerçekleşen pivot sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, actualPivotSheet, `${reportTitle} - Gerçekleşen`);
            
            // PLANLANAN DEĞERLER SAYFASI
            
            // Pivot tablo verilerini hazırla - Planlanan Değerler
            const plannedPivotData = [];
            
            // Rapor başlığı ve tarih aralığı
            plannedPivotData.push([`Pivot ${reportTitle} Raporu (Planlanan)`]);
            plannedPivotData.push([`01.01.${year} - 31.12.${year}`]);
            plannedPivotData.push([""]);  // Boş satır
            
            // Başlık satırı - kategori isimleri (Planlanan)
            const plannedHeaderRow = ["Ay"];
            typeCategories.forEach(category => {
                plannedHeaderRow.push(category.name);
            });
            plannedHeaderRow.push("TOPLAM"); // Toplam kolonu
            plannedPivotData.push(plannedHeaderRow);
            
            // Her ay için veri satırı oluştur - Planlanan
            for (let month = 0; month < 12; month++) {
                // Ay numarası 0-indexed olduğu için +1 ile 1-indexed yapıyoruz
                const monthNum = month + 1;
                // Ay başlangıcı: YYYY-MM-01
                const monthStart = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
                
                // Ay sonu: Bir sonraki ayın ilk gününden bir gün öncesi
                // Şubat ve diğer ayların farklı gün sayılarını otomatik hesaplar
                const lastDay = new Date(year, monthNum, 0).getDate();
                const monthEnd = `${year}-${monthNum.toString().padStart(2, '0')}-${lastDay}`;
                
                // Bu aydaki planlanan işlemleri filtrele - direct string comparison
                // Bu, ISO string formatındaki tarihleri (YYYY-MM-DD) doğru şekilde karşılaştırır
                const monthTransactions = plannedTransactions.filter(t => {
                    // Tarih kontrolü
                    const dateStr = t.date ? t.date.split('T')[0] : '';
                    const matches = dateStr >= monthStart && dateStr <= monthEnd;
                    
                    if (matches) {
                        console.log(`Planned transaction matched for ${monthNames[month]}: ${t.id}, date: ${dateStr}, plannedAmount: ${t.plannedAmount}`);
                    }
                    return matches;
                });
                
                // Ay satırı oluştur - Ay adı ve yıl bilgisi ile
                const monthRow = [`${monthNames[month]} ${year}`];
                
                // Her kategori için toplam tutarı hesapla
                let monthTotal = 0;
                typeCategories.forEach(category => {
                    // Bu kategorideki işlemleri bul
                    const categoryTransactions = monthTransactions.filter(t => 
                        t.categoryId === category.id
                    );
                    
                    // Toplam tutarı hesapla - planlanan işlemlerde plannedAmount kullanılır
                    const categoryTotal = categoryTransactions.reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
                    monthRow.push(categoryTotal);
                    monthTotal += categoryTotal;
                });
                
                // Ay toplamını ekle
                monthRow.push(monthTotal);
                
                // Satırı pivot verisine ekle
                plannedPivotData.push(monthRow);
            }
            
            // Toplam satırı ekle - Planlanan
            plannedPivotData.push([""]);  // Boş satır ekleyerek toplamı ayır
            const plannedTotalRow = ["TOPLAM"];
            
            // Her kategori için yıllık toplam
            let plannedGrandTotal = 0;
            for (let colIndex = 1; colIndex < plannedHeaderRow.length; colIndex++) {
                const categoryTotal = plannedPivotData.slice(1).reduce((sum, row) => sum + (row[colIndex] || 0), 0);
                plannedTotalRow.push(categoryTotal);
                if (colIndex < plannedHeaderRow.length - 1) { // Son sütun zaten toplam olduğu için saymıyoruz
                    plannedGrandTotal += categoryTotal;
                }
            }
            plannedPivotData.push(plannedTotalRow);
            
            // Planlanan pivot sayfasını oluştur
            const plannedPivotSheet = XLSX.utils.aoa_to_sheet(plannedPivotData);
            
            // Planlanan pivot sayfasına stil uygula - 4 satırlık başlık (başlık, tarih, boşluk, sütun başlıkları)
            this.applyStylesToSheet(plannedPivotSheet, styles, 4, pivotColumns);
            
            // Planlanan pivot sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, plannedPivotSheet, `${reportTitle} - Planlanan`);
            
            // KARŞILAŞTIRMA SAYFASI
            
            // Pivot tablo verilerini hazırla - Gerçekleşen vs Planlanan
            const comparisonPivotData = [];
            
            // Başlık satırları
            comparisonPivotData.push([`${year} Yılı ${reportTitle} Karşılaştırma`]);
            comparisonPivotData.push([`01.01.${year} - 31.12.${year}`]);
            comparisonPivotData.push([""]);
            comparisonPivotData.push(["Kategori", "Planlanan", "Gerçekleşen", "Fark", "Gerçekleşme %"]);
            
            // Her kategori için karşılaştırma satırı oluştur
            typeCategories.forEach(category => {
                // Bu kategorideki planlanan işlemleri bul
                const plannedCategoryTransactions = plannedTransactions.filter(t => 
                    t.categoryId === category.id
                );
                
                // Bu kategorideki gerçekleşen işlemleri bul
                const actualCategoryTransactions = actualTransactions.filter(t => 
                    t.categoryId === category.id
                );
                
                // Toplam tutarları hesapla
                const plannedTotal = plannedCategoryTransactions.reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
                const actualTotal = actualCategoryTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                
                // Fark ve yüzde hesapla
                const difference = actualTotal - plannedTotal;
                const percentage = plannedTotal !== 0 ? (actualTotal / plannedTotal) * 100 : 0;
                
                // Karşılaştırma satırını ekle
                comparisonPivotData.push([
                    category.name,
                    plannedTotal,
                    actualTotal,
                    difference,
                    percentage
                ]);
            });
            
            // Toplam karşılaştırma satırı ekle
            comparisonPivotData.push([
                "TOPLAM",
                plannedGrandTotal,
                actualGrandTotal,
                actualGrandTotal - plannedGrandTotal,
                plannedGrandTotal !== 0 ? (actualGrandTotal / plannedGrandTotal) * 100 : 0
            ]);
            
            // Karşılaştırma sayfasını oluştur
            const comparisonSheet = XLSX.utils.aoa_to_sheet(comparisonPivotData);
            
            // Karşılaştırma sayfası için stil tanımlamaları
            const comparisonColumns = {
                0: { type: 'text' },
                1: { type: 'currency' },
                2: { type: 'currency' },
                3: { type: 'currency' },
                4: { type: 'percent' }
            };
            
            // Karşılaştırma sayfasına stil uygula - 4 satırlık başlık (başlık, tarih, boşluk, sütun başlıkları)
            this.applyStylesToSheet(comparisonSheet, styles, 4, comparisonColumns);
            
            // Karşılaştırma sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, comparisonSheet, `${reportTitle} - Karşılaştırma`);
            
            // İşlem dağılımı sayfası ekle - daha detaylı veri için
            const transactionsData = [
                ["ID", "Tarih", "Durum", "Kategori", "Alt Kategori", "Açıklama", "Tutar", "Planlanan Tutar"]
            ];
            
            // Tüm işlemleri birleştir ve tarih sırasına göre ekle
            const allTransactions = [...actualTransactions, ...plannedTransactions];
            const sortedTransactions = allTransactions.sort((a, b) => {
                // Önce tarihe göre sırala
                const dateComp = new Date(a.date) - new Date(b.date);
                if (dateComp !== 0) return dateComp;
                // Sonra kategoriye göre sırala
                return a.categoryId.localeCompare(b.categoryId);
            });
            
            for (const t of sortedTransactions) {
                const category = await dataManager.getCategoryById(t.categoryId);
                const subcategory = category?.subcategories?.find(s => s.id === t.subcategoryId);
                
                transactionsData.push([
                    t.id,
                    t.date,
                    t.status === 'planned' ? 'Planlanan' : 'Gerçekleşen',
                    category ? category.name : '',
                    subcategory ? subcategory.name : '',
                    t.description || '',
                    t.amount || 0,
                    t.plannedAmount || 0
                ]);
            }
            
            // İşlemler sayfasını oluştur
            const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
            
            // İşlemler sayfası için stil tanımlamaları
            const transactionColumns = {
                0: { type: 'text' },      // ID
                1: { type: 'date' },      // Tarih
                2: { type: 'text' },      // Durum
                3: { type: 'text' },      // Kategori
                4: { type: 'text' },      // Alt Kategori
                5: { type: 'text' },      // Açıklama
                6: { type: 'currency' },  // Tutar
                7: { type: 'currency' }   // Planlanan Tutar
            };
            
            // İşlemler sayfasına stil uygula
            this.applyStylesToSheet(transactionsSheet, styles, 1, transactionColumns);
            
            // İşlemler sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, transactionsSheet, `${reportTitle} İşlemleri`);
            
            // Kategori özeti sayfası oluştur
            const categorySummaryData = [];
            
            // Başlıklar
            categorySummaryData.push([`${reportTitle} Kategorileri Özeti`]);
            categorySummaryData.push([`01.01.${year} - 31.12.${year}`]);
            categorySummaryData.push([""]);
            categorySummaryData.push(["Kategori", "Toplam", "Aylık Ortalama", "Yüzde"]);
            
            // Kategori toplamlarını hesapla
            let totalAmount = 0;
            typeCategories.forEach(category => {
                // Debug category
                console.log(`Processing category summary for: ${category.name}`);
                
                // Kategoriye ait işlemleri filtrele
                const categoryTransactions = actualTransactions.filter(t => t.categoryId === category.id);
                console.log(`Found ${categoryTransactions.length} transactions for category ${category.name}`);
                
                // İşlemlerin tutarlarını topla
                const categoryTotal = categoryTransactions.reduce((sum, t) => {
                    const amount = t.amount || 0;
                    console.log(`Transaction ${t.id}: ${amount}`);
                    return sum + amount;
                }, 0);
                
                console.log(`Category ${category.name} total: ${categoryTotal}`);
                totalAmount += categoryTotal;
                
                // Kategori verilerini ekle
                categorySummaryData.push([
                    category.name,
                    categoryTotal,
                    categoryTotal / 12, // Aylık ortalama
                    0 // Yüzde değeri sonra hesaplanacak
                ]);
            });
            
            // Yüzdeleri hesapla
            if (totalAmount > 0) {
                for (let i = 4; i < categorySummaryData.length; i++) {
                    const row = categorySummaryData[i];
                    row[3] = row[1] / totalAmount; // Yüzde değeri (ondalık olarak)
                }
            }
            
            // Toplam satırı ekle
            categorySummaryData.push([""]);
            categorySummaryData.push([
                "Toplam",
                totalAmount,
                totalAmount / 12,
                1 // %100
            ]);
            
            // Kategori özeti sayfasını oluştur
            const categorySummarySheet = XLSX.utils.aoa_to_sheet(categorySummaryData);
            
            // Stil tanımlamaları
            const categorySummaryColumns = {
                0: { type: 'text' },
                1: { type: 'currency' },
                2: { type: 'currency' },
                3: { type: 'percent' }
            };
            
            // Kategori özeti sayfasına stil uygula
            this.applyStylesToSheet(categorySummarySheet, styles, 4, categorySummaryColumns);
            
            // Kategori özeti sayfasını ekle
            XLSX.utils.book_append_sheet(workbook, categorySummarySheet, `${reportTitle} Kategorileri Özeti`);
            
            // Excel dosyasını indir
            const filename = `pivot_${type}_raporu_${year}.xlsx`;
            this.downloadExcel(workbook, filename);
            
            console.log(`Pivot raporu oluşturuldu: ${filename}`);
            showToast('Pivot raporu başarıyla oluşturuldu!', 'success');
            
            return true;
        } catch (error) {
            console.error('Pivot rapor oluşturma hatası:', error);
            showToast('Pivot raporu oluşturulurken hata oluştu!', 'error');
            return false;
        }
    }
    
    /**
     * Create Excel styles and cell formats for proper calculations
     */
    createExcelStyles() {
        // Format objects for SheetJS
        return {
            currency: { numFmt: '"₺"#,##0.00;[Red]-"₺"#,##0.00' },
            date: { numFmt: 'yyyy-mm-dd' },
            percentage: { numFmt: '0.00%' },
            header: { font: { bold: true } },
            section: { font: { bold: true } },
            income: { font: { color: { rgb: "008800" } } },
            expense: { font: { color: { rgb: "CC0000" } } }
        };
    }
    
    /**
     * Apply proper Excel formatting to cells
     * This enhances the native Excel functionality to support calculations
     */
    applyStylesToSheet(sheet, styles, headerRows, columnDefs) {
        // Get cell address range in the sheet
        const range = XLSX.utils.decode_range(sheet['!ref'] || "A1");
        
        // Format currency columns with Excel's built-in currency format
        // This enables Excel calculations to work properly
        for (let c = range.s.c; c <= range.e.c; c++) {
            const colDef = columnDefs[c];
            if (!colDef) continue;
            
            // Apply column-specific formatting
            for (let r = headerRows; r <= range.e.r; r++) {
                const cellRef = XLSX.utils.encode_cell({r: r, c: c});
                const cell = sheet[cellRef];
                if (!cell) continue;
                
                if (!cell.z) { // Only set format if not already set
                    if (colDef.type === 'currency') {
                        // Apply proper Excel currency format
                        cell.z = '"₺"#,##0.00;[Red]-"₺"#,##0.00';
                        
                        // Ensure it's a number for calculations
                        if (typeof cell.v === 'string') {
                            const num = parseFloat(cell.v.replace(/[^0-9.-]+/g, ''));
                            if (!isNaN(num)) {
                                cell.v = num;
                                cell.t = 'n'; // Set as number type
                            }
                        }
                    } 
                    else if (colDef.type === 'percent') {
                        // Apply proper Excel percentage format
                        cell.z = '0.00%';
                        
                        // Convert to decimal for Excel percentage calculation
                        if (typeof cell.v === 'number') {
                            cell.v = cell.v / 100; // Convert percentage to decimal
                        }
                    }
                    else if (colDef.type === 'date') {
                        // Apply Excel date format
                        cell.z = 'yyyy-mm-dd';
                    }
                }
            }
        }
        
        // Apply header row formatting
        for (let r = 0; r < headerRows; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cellRef = XLSX.utils.encode_cell({r: r, c: c});
                if (sheet[cellRef]) {
                    sheet[cellRef].s = styles.header;
                }
            }
        }
        
        // Apply formula cells for calculations
        // Create SUM formulas at the bottom of numeric columns
        // This will show totals that Excel can calculate
        
        // First check if there's already a TOPLAM row
        let hasExistingTotalRow = false;
        let totalRowIndex = -1;
        
        // Look for existing TOPLAM row
        for (let r = range.s.r; r <= range.e.r; r++) {
            const cellRef = XLSX.utils.encode_cell({r: r, c: 0});
            const cell = sheet[cellRef];
            if (cell && cell.v === 'TOPLAM') {
                hasExistingTotalRow = true;
                totalRowIndex = r;
                break;
            }
        }
        
        // If there's already a TOPLAM row in the data, we'll replace it with formulas
        if (hasExistingTotalRow) {
            // For each column that needs a sum formula
            for (let c = range.s.c; c <= range.e.c; c++) {
                const colDef = columnDefs[c];
                if (!colDef) continue;
                
                // Only add SUM formulas to currency or number columns
                if ((colDef.type === 'currency' || colDef.type === 'number') && c > 0) {
                    // Define the range to sum (excluding the TOPLAM row itself)
                    const startRow = headerRows; // First data row after headers
                    const endRow = totalRowIndex - 1; // Last data row before TOPLAM
                    
                    // Skip if no data rows to sum
                    if (endRow < startRow) continue;
                    
                    // Create Excel-style cell references
                    const startRef = XLSX.utils.encode_cell({r: startRow, c: c});
                    const endRef = XLSX.utils.encode_cell({r: endRow, c: c});
                    
                    // Replace the TOPLAM cell with a formula
                    const formulaRef = XLSX.utils.encode_cell({r: totalRowIndex, c: c});
                    
                    // Her zaman formül olarak ayarla
                    sheet[formulaRef] = {
                        t: 'n', // Number type
                        f: `SUM(${startRef}:${endRef})`, // Excel formula
                        z: colDef.type === 'currency' ? '"₺"#,##0.00;[Red]-"₺"#,##0.00' : '#,##0.00' // Format
                    };
                }
            }
            
            // Make sure not to add another formula row
        } else {
            // No existing TOPLAM row, so add formulas at the bottom
            // Only add to sheets that are likely to need calculations
            let hasNumericColumns = false;
            
            // Check if this sheet has any numeric columns
            for (let c = range.s.c; c <= range.e.c; c++) {
                const colDef = columnDefs[c];
                if (colDef && (colDef.type === 'currency' || colDef.type === 'number')) {
                    hasNumericColumns = true;
                    break;
                }
            }
            
            // Only add a formula row if there are numeric columns
            if (hasNumericColumns) {
                const formulaRow = range.e.r + 2; // Leave one blank row
                
                // Add a "TOPLAM" label in the first column of the formula row
                const labelRef = XLSX.utils.encode_cell({r: formulaRow, c: 0});
                sheet[labelRef] = {
                    t: 's', // String type
                    v: 'TOPLAM',
                    s: styles.section // Bold formatting
                };
                
                // For each column
                for (let c = range.s.c; c <= range.e.c; c++) {
                    const colDef = columnDefs[c];
                    if (!colDef) continue;
                    
                    // Only add SUM formulas to currency or number columns
                    if (colDef.type === 'currency' || colDef.type === 'number') {
                        const startRow = headerRows; // First data row
                        const endRow = range.e.r; // Last data row
                        
                        // Create Excel-style cell references
                        const startRef = XLSX.utils.encode_cell({r: startRow, c: c});
                        const endRef = XLSX.utils.encode_cell({r: endRow, c: c});
                        
                        // Create the formula cell
                        const formulaRef = XLSX.utils.encode_cell({r: formulaRow, c: c});
                        sheet[formulaRef] = {
                            t: 'n', // Number type
                            f: `SUM(${startRef}:${endRef})`, // Excel formula
                            z: colDef.type === 'currency' ? '"₺"#,##0.00;[Red]-"₺"#,##0.00' : '#,##0.00' // Format
                        };
                    }
                }
                
                // Update the sheet range to include the formula row
                const newRange = XLSX.utils.decode_range(sheet['!ref']);
                newRange.e.r = Math.max(newRange.e.r, formulaRow);
                sheet['!ref'] = XLSX.utils.encode_range(newRange);
            }
        }
        
        return sheet;
    }

    /**
     * Import modal'ını göster
     */
    showImportModal() {
        const modal = createModal(
            'Veri İçe Aktar',
            `
            <div class="space-y-6">
                <!-- Dosya Seçimi -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">JSON Dosyası Seçin</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <i data-lucide="upload" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                        <p class="text-gray-600 mb-2">Dosyayı buraya sürükleyin veya seçin</p>
                        <button id="selectFileBtn" class="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm">
                            Dosya Seç
                        </button>
                        <input type="file" id="importFileInput" accept=".json" class="hidden">
                    </div>
                    <div id="selectedFile" class="hidden mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div class="flex items-center space-x-2">
                            <i data-lucide="file-text" class="w-4 h-4 text-green-600"></i>
                            <span id="fileName" class="text-sm text-green-800"></span>
                            <span id="fileSize" class="text-sm text-green-600"></span>
                        </div>
                    </div>
                </div>

                <!-- İçe Aktarma Seçenekleri -->
                <div id="importOptions" class="hidden">
                    <h4 class="font-medium text-gray-900 mb-3">İçe Aktarma Seçenekleri</h4>
                    <div class="space-y-3">
                        <label class="flex items-center">
                            <input type="radio" name="importMode" value="replace" checked class="mr-2">
                            <div>
                                <span class="text-sm font-medium">Değiştir</span>
                                <p class="text-xs text-gray-500">Mevcut veriler silinir, yeni veriler yüklenir</p>
                            </div>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="importMode" value="merge" class="mr-2">
                            <div>
                                <span class="text-sm font-medium">Birleştir</span>
                                <p class="text-xs text-gray-500">Yeni veriler mevcut verilerle birleştirilir</p>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Dosya Bilgisi -->
                <div id="fileInfo" class="hidden">
                    <h4 class="font-medium text-gray-900 mb-3">Dosya İçeriği</h4>
                    <div id="fileContent" class="bg-gray-50 p-4 rounded-lg">
                        <!-- Dynamic content -->
                    </div>
                </div>

                <!-- Uyarılar -->
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-600 mt-0.5"></i>
                        <div class="text-sm">
                            <p class="text-yellow-800 font-medium">Dikkat</p>
                            <ul class="text-yellow-700 mt-1 space-y-1">
                                <li>• Sadece bu uygulamadan dışa aktarılan JSON dosyalarını kullanın</li>
                                <li>• "Değiştir" seçeneği tüm mevcut verileri silecektir</li>
                                <li>• İşlem öncesi mevcut verilerinizi yedeklemenizi öneririz</li>
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
                    class: 'bg-green-500 hover:bg-green-600 text-white hidden',
                    onclick: 'exportImportManager.executeImport()',
                    id: 'executeImportBtn'
                }
            ]
        );

        // File selection event listeners
        const selectFileBtn = modal.querySelector('#selectFileBtn');
        const fileInput = modal.querySelector('#importFileInput');
        
        selectFileBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleFileSelection(e.target.files[0], modal);
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
            if (files[0] && files[0].type === 'application/json') {
                this.handleFileSelection(files[0], modal);
            } else {
                showToast('Lütfen geçerli bir JSON dosyası seçin!', 'error');
            }
        });

        lucide.createIcons();
    }

    /**
     * Dosya seçimi işle
     */
    handleFileSelection(file, modal) {
        const selectedFile = modal.querySelector('#selectedFile');
        const fileName = modal.querySelector('#fileName');
        const fileSize = modal.querySelector('#fileSize');
        const importOptions = modal.querySelector('#importOptions');
        const fileInfo = modal.querySelector('#fileInfo');
        const executeBtn = modal.querySelector('#executeImportBtn');

        // Dosya bilgilerini göster
        fileName.textContent = file.name;
        fileSize.textContent = `(${formatFileSize(file.size)})`;
        selectedFile.classList.remove('hidden');

        // Dosyayı oku
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.currentImportData = data;
                
                // Dosya içeriğini analiz et ve göster
                this.displayFileContent(data, modal);
                
                // Import seçeneklerini göster
                importOptions.classList.remove('hidden');
                fileInfo.classList.remove('hidden');
                executeBtn.classList.remove('hidden');
                
            } catch (error) {
                showToast('Geçersiz JSON dosyası!', 'error');
                selectedFile.classList.add('hidden');
            }
        };

        reader.readAsText(file, 'UTF-8');
    }

    /**
     * Dosya içeriğini göster
     */
    displayFileContent(data, modal) {
        const fileContent = modal.querySelector('#fileContent');
        
        const info = data.exportInfo || {};
        const transactions = data.transactions || [];
        const categories = data.categories || {};
        const accounts = data.accounts || [];
        const tags = data.tags || [];

        const categoryCount = Object.values(categories).flat().length;

        fileContent.innerHTML = `
            <div class="space-y-3">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Export Tarihi:</span>
                    <span class="font-medium">${info.date ? formatDate(info.date) : 'Bilinmiyor'}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Export Türü:</span>
                    <span class="font-medium">${this.getExportTypeText(info.type)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">İşlemler:</span>
                    <span class="font-medium">${transactions.length}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Kategoriler:</span>
                    <span class="font-medium">${categoryCount}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Hesaplar:</span>
                    <span class="font-medium">${accounts.length}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Etiketler:</span>
                    <span class="font-medium">${tags.length}</span>
                </div>
                ${info.description ? `
                    <div class="text-sm border-t pt-2">
                        <span class="text-gray-600">Açıklama:</span>
                        <p class="text-gray-800 mt-1">${escapeHtml(info.description)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Import işlemini gerçekleştir
     */
    executeImport() {
        if (!this.currentImportData) {
            showToast('Önce bir dosya seçin!', 'error');
            return;
        }

        const importMode = document.querySelector('input[name="importMode"]:checked').value;
        
        try {
            const success = dataManager.importData(
                JSON.stringify(this.currentImportData), 
                { merge: importMode === 'merge' }
            );

            if (success) {
                document.getElementById('modalContainer').innerHTML = '';
                
                // Tüm arayüzü yenile
                if (typeof app !== 'undefined') {
                    app.refreshAll();
                }
                
                showToast('Veriler başarıyla içe aktarıldı!', 'success');
            }
        } catch (error) {
            console.error('Import hatası:', error);
            showToast('İçe aktarma sırasında hata oluştu!', 'error');
        }

        this.currentImportData = null;
    }

    /**
     * Dosya import'u işle (header'daki buton için)
     */
    handleFileImport(file) {
        if (!file) return;

        if (file.type !== 'application/json') {
            showToast('Lütfen geçerli bir JSON dosyası seçin!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = dataManager.importData(e.target.result, { merge: false });
                
                if (success && typeof app !== 'undefined') {
                    app.refreshAll();
                }
            } catch (error) {
                console.error('Import hatası:', error);
                showToast('İçe aktarma sırasında hata oluştu!', 'error');
            }
        };

        reader.readAsText(file, 'UTF-8');
        
        // File input'u temizle
        document.getElementById('importFile').value = '';
    }

    /**
     * Export türü metni
     */
    getExportTypeText(type) {
        const types = {
            'full': 'Tam Yedek',
            'transactions': 'İşlemler',
            'categories': 'Kategoriler',
            'dateRange': 'Tarih Aralığı'
        };
        return types[type] || 'Bilinmiyor';
    }

    /**
     * Otomatik yedekleme
     */
    async createAutoBackup() {
        const data = await this.createFullExport();
        
        // LocalStorage'a kaydet (yedek olarak)
        try {
            localStorage.setItem('budgetTracker_backup', JSON.stringify(data));
            console.log('Otomatik yedekleme tamamlandı');
        } catch (error) {
            console.error('Otomatik yedekleme hatası:', error);
        }
    }

    /**
     * Yedekten geri yükle
     */
    async restoreFromBackup() {
        try {
            const backup = localStorage.getItem('budgetTracker_backup');
            if (backup) {
                console.log('Yedek veri bulundu, içe aktarılıyor...');
                const success = await dataManager.importData(backup, { merge: false });
                if (success && typeof app !== 'undefined') {
                    app.refreshAll();
                    console.log('Yedekten geri yükleme başarılı');
                    return true;
                }
            } else {
                console.warn('Geri yüklenecek yedek bulunamadı');
            }
        } catch (error) {
            console.error('Yedekten geri yükleme hatası:', error);
        }
        return false;
    }
}

// Global instance
const exportImportManager = new ExportImportManager();