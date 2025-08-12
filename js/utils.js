// js/utils.js - Yardımcı Fonksiyonlar

/**
 * UUID v4 generator
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Para formatı
 */
function formatCurrency(amount, currency = 'TRY') {
    const formatter = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return formatter.format(amount);
}

/**
 * Sayı formatı (para işareti olmadan)
 */
function formatNumber(number) {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

/**
 * Tarih formatı
 */
function formatDate(date, format = 'dd.MM.yyyy') {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    
    if (format.includes('HH:mm')) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat('tr-TR', options).format(date);
}

/**
 * Tarih aralığı kontrolü - ISO string formatında (YYYY-MM-DD) direkt karşılaştırma
 */
function isDateInRange(date, startDate, endDate) {
    // Eğer date, startDate veya endDate boşsa false döndür
    if (!date || !startDate || !endDate) {
        console.warn('isDateInRange: Invalid date parameters', { date, startDate, endDate });
        return false;
    }
    
    // Eğer date bir string değilse, string'e çevir
    let dateStr = date;
    if (date instanceof Date) {
        dateStr = date.toISOString().split('T')[0];
    } else if (typeof date !== 'string') {
        console.warn('isDateInRange: Invalid date type', typeof date, date);
        return false;
    }
    
    // String tarihleri standart formata çevir: YYYY-MM-DD
    // Sadece tarih kısmını al, saat kısmını at
    dateStr = dateStr.split('T')[0];
    const startStr = startDate.split('T')[0];
    const endStr = endDate.split('T')[0];
    
    console.log(`Date comparison: ${dateStr} >= ${startStr} && ${dateStr} <= ${endStr}`);
    
    // String olarak direkt karşılaştır (YYYY-MM-DD formatı alfabetik olarak sıralanabilir)
    return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Bu ayın başı ve sonu
 */
function getCurrentMonthRange() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
    };
}

/**
 * Bu yılın başı ve sonu
 */
function getCurrentYearRange() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    return {
        start: startOfYear.toISOString().split('T')[0],
        end: endOfYear.toISOString().split('T')[0]
    };
}

/**
 * Geçen ayın başı ve sonu
 */
function getLastMonthRange() {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
        start: startOfLastMonth.toISOString().split('T')[0],
        end: endOfLastMonth.toISOString().split('T')[0]
    };
}

/**
 * Renk oluşturucu
 */
function generateColor() {
    const colors = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
        '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
        '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
        '#EC4899', '#F43F5E'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Element göster/gizle
 */
function showElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.remove('hidden');
        element.classList.add('flex');
    }
}

function hideElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.add('hidden');
        element.classList.remove('flex');
    }
}

/**
 * Toast bildirimi
 */
function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * Modal oluşturucu
 */
function createModal(title, content, actions = []) {
    const modalContainer = document.getElementById('modalContainer');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    // Actions HTML oluştur
    const actionsHTML = actions.map(action => {
        const buttonClass = action.class || 'btn';
        const buttonText = action.text || 'Button';
        const buttonId = action.id || '';
        const buttonStyle = action.style ? `margin-left: 0.75rem; ${action.style}` : 'margin-left: 0.75rem;';
        
        // Basit cancel/iptal butonları için özel işlem
        const isCloseButton = 
            (buttonText.toLowerCase().includes('iptal') || 
             buttonText.toLowerCase().includes('kapat') || 
             buttonText.toLowerCase().includes('cancel')) && 
            (!action.onclick || action.onclick.trim() === '');
        
        // Sadece data-type özelliği ekle, event dinleyicileri ayrıca eklenecek
        return `
        <button class="${buttonClass} px-4 py-2 rounded-lg text-sm font-medium" 
                data-type="${isCloseButton ? 'close' : 'action'}"
                ${!isCloseButton ? 'data-action-code="' + (action.onclick || '').replace(/"/g, '&quot;') + '"' : ''}
                ${buttonId ? `id="${buttonId}"` : ''}
                style="${buttonStyle}">
            ${buttonText}
        </button>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                <button class="modal-close text-gray-400 hover:text-gray-600 p-1">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-actions flex justify-end mt-6" style="gap: 0.75rem;">
                ${actionsHTML}
            </div>
        </div>
    `;
    
    modalContainer.appendChild(modal);
    
    // Close modal handlers
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modalContainer.innerHTML = '';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modalContainer.innerHTML = '';
        }
    });

    // Action button handlers
    modal.querySelectorAll('button[data-type="action"]').forEach(button => {
        button.addEventListener('click', () => {
            const actionCode = button.getAttribute('data-action-code');
            if (actionCode && actionCode.trim() !== '') {
                try {
                    eval(actionCode);
                } catch (error) {
                    console.error('Modal action error:', error);
                    // Hata durumunda modalı kapat
                    modalContainer.innerHTML = '';
                }
            } else {
                // Eğer bir action kodu tanımlanmamışsa, modalı kapat
                modalContainer.innerHTML = '';
            }
        });
    });
    
    // Close buttons
    modal.querySelectorAll('button[data-type="close"]').forEach(button => {
        button.addEventListener('click', () => {
            // Sadece modalı kapat
            modalContainer.innerHTML = '';
        });
    });
    
    // Initialize icons and form controls
    setTimeout(() => {
        lucide.createIcons();
        
        // Tutar alanları kontrolü için kod ekle
        const bulkAmountOption = modal.querySelector('#bulkAmountOption');
        if (bulkAmountOption) {
            console.log("Modal: bulkAmountOption found!");
            
            // Tutar alanlarını bul
            const customAmountContainer = modal.querySelector('#customAmountContainer');
            const percentageContainer = modal.querySelector('#percentageContainer');
            const bulkAmount = modal.querySelector('#bulkAmount');
            
            // Özel tutar ve yüzde alanlarının görünürlüğünü güncelle
            const updateVisibility = () => {
                console.log("Modal: Updating visibility for option:", bulkAmountOption.value);
                
                // Özel tutar alanını sadece bu seçenek seçildiğinde göster
                if (customAmountContainer) {
                    customAmountContainer.style.display = bulkAmountOption.value === 'custom' ? 'block' : 'none';
                }
                
                // Yüzde alanını sadece bu seçenek seçildiğinde göster
                if (percentageContainer) {
                    percentageContainer.style.display = bulkAmountOption.value === 'percentage' ? 'block' : 'none';
                }
                
                // Çok önemli: input değeri girildiğinde, otomatik olarak custom seçeneğini seç
                if (bulkAmount) {
                    // Daha önce event listener eklenmemişse ekle
                    if (!bulkAmount.hasOwnProperty('_listenerAdded')) {
                        bulkAmount.addEventListener('input', function() {
                            if (this.value && this.value.trim() !== '') {
                                bulkAmountOption.value = 'custom';
                                console.log("Modal: Input girişi algılandı, custom seçeneği otomatik olarak seçildi. Değer:", this.value);
                                
                                // Custom alanını göster, yüzde alanını gizle
                                if (customAmountContainer) {
                                    customAmountContainer.style.display = 'block';
                                }
                                if (percentageContainer) {
                                    percentageContainer.style.display = 'none';
                                }
                                
                                // Değeri global olarak işaretle
                                window.currentBulkAmount = this.value;
                            }
                        });
                        // Listener eklendiğini işaretle
                        bulkAmount._listenerAdded = true;
                    }
                }
            };
            
            // Olayı ekle
            bulkAmountOption.addEventListener('change', updateVisibility);
            
            // İlk yükleme için çağır
            updateVisibility();
        }
    }, 100);
    
    return modal;
}

/**
 * Form validation
 */
function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
        const value = formData[field];
        const rule = rules[field];
        
        if (rule.required && (!value || value.toString().trim() === '')) {
            errors[field] = `${rule.label || field} gereklidir`;
            continue;
        }
        
        if (value && rule.type === 'number' && isNaN(value)) {
            errors[field] = `${rule.label || field} sayı olmalıdır`;
            continue;
        }
        
        if (value && rule.type === 'email' && !/\S+@\S+\.\S+/.test(value)) {
            errors[field] = `${rule.label || field} geçerli bir e-posta olmalıdır`;
            continue;
        }
        
        if (value && rule.min && parseFloat(value) < rule.min) {
            errors[field] = `${rule.label || field} minimum ${rule.min} olmalıdır`;
            continue;
        }
        
        if (value && rule.max && parseFloat(value) > rule.max) {
            errors[field] = `${rule.label || field} maksimum ${rule.max} olmalıdır`;
            continue;
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Group array by property
 */
function groupBy(array, property) {
    return array.reduce((groups, item) => {
        const group = item[property];
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
}

/**
 * Sum array of numbers
 */
function sum(array) {
    return array.reduce((total, num) => total + parseFloat(num || 0), 0);
}

/**
 * Calculate percentage
 */
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
}

/**
 * Truncate text
 */
function truncateText(text, length = 50) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

/**
 * Capitalize first letter
 */
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get contrast color for background
 */
function getContrastColor(hexColor) {
    // Remove # if present
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Arka plan rengine göre kontrast metin rengi hesapla
 * Renk açıksa siyah, koyuysa beyaz döndürür
 */
function getContrastYIQ(hexcolor) {
    // # işaretini kaldır
    hexcolor = hexcolor.replace('#', '');
    
    // 3 haneli renk kodu ise 6 haneye genişlet
    if (hexcolor.length === 3) {
        hexcolor = hexcolor[0] + hexcolor[0] + hexcolor[1] + hexcolor[1] + hexcolor[2] + hexcolor[2];
    }
    
    // RGB değerlerini al
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    
    // YIQ formülü ile parlaklık hesapla
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Eşik değerine göre renk döndür
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
}