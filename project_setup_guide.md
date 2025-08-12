# 💰 Bütçe Takibi - Kurulum ve Kullanım Rehberi

## 📋 Proje Özeti

**Bütçe Takibi**, kişisel finans yönetimi için geliştirilmiş modern bir web uygulamasıdır. Tamamen **offline** çalışır ve verileriniz sadece tarayıcınızda saklanır.

### ✨ Özellikler

- 📊 **Dashboard**: Chart.js ile interaktif grafikler
- 📈 **Gelişmiş Dashboard'lar**: Yönetici Özet ve Operasyonel Dashboard'lar
- 🏷️ **Kategori Yönetimi**: Ana ve alt kategoriler, renkli etiketler
- 📋 **Gelişmiş Tablo**: Filtreleme, sıralama, gruplama, inline editing
- 💳 **Hesap Yönetimi**: Nakit, banka, kredi kartı hesapları
- 🏷️ **Tag Sistemi**: Esnek etiketleme ve toplu etiket işlemleri
- 📝 **Gelişmiş İşlem Yönetimi**: Notlar, referans numaraları, tarih takibi
- 📤📥 **Export/Import**: UTF-8 JSON ve Excel formatında yedekleme ve rapor oluşturma
- 📊 **Bütçe Planlama**: Kategori ve alt kategori bazlı bütçe planları, Excel'den toplu içe aktarma
- 📈 **Rapor Analizleri**: Aylık ve yıllık Excel formatında detaylı bütçe, etiket ve kategori analizleri
- 📱 **Responsive**: Mobil ve desktop uyumlu
- ⌨️ **Klavye Kısayolları**: Hızlı kullanım
- 🌙 **Modern UI**: Tailwind CSS ile şık tasarım
- 🔄 **Özelleştirilebilir Dashboard**: Sürükle bırak widget'lar ile dashboard düzenleme

## 🚀 Kurulum

### 1. Dosya Yapısı Oluşturma

```
budget-tracker/
├── index.html
├── css/
│   ├── main.css                         # Ana stiller & yardımcı sınıflar
│   ├── dashboard.css                    # Dashboard özel stilleri
│   ├── categories.css                   # Kategoriler sayfası stilleri
│   ├── reports.css                      # Raporlar sayfası stilleri
│   └── table.css                        # Tablo sayfası stilleri
├── js/
│   ├── utils.js                         # Yardımcı fonksiyonlar
│   ├── dataManager.js                   # Veri yönetimi (CRUD)
│   ├── chartManager.js                  # Grafik yönetimi
│   ├── categoryManager.js               # Kategori yönetimi
│   ├── tableManager.js                  # Tablo işlemleri
│   ├── exportImport.js                  # JSON export/import
│   ├── accountManager.js                # Hesap yönetimi
│   ├── reportManager.js                 # Rapor yönetimi
│   ├── components/
│   │   ├── kpiCards.js                  # Performans gösterge kartları
│   │   ├── interactiveCharts.js         # Gelişmiş interaktif grafikler
│   │   ├── quickActions.js              # Hızlı eylem butonları
│   │   ├── aiRecommendations.js         # AI destekli öneriler
│   │   ├── dragDropWidgets.js           # Sürükle-bırak widget yönetimi
│   │   ├── executiveSummaryDashboard.js # Yönetici özet dashboard'u
│   │   └── operationalDashboard.js      # Operasyonel dashboard
│   └── app.js                           # Ana uygulama kontrolcüsü
└── project_setup_guide.md
```

### 2. Dosyaları Kaydetme

**Adım adım:**

1. **Ana klasörü oluşturun**: `budget-tracker`
2. **Alt klasörleri oluşturun**: 
   - `budget-tracker/css`
   - `budget-tracker/js`

3. **Dosyaları kaydedin**:

#### 📄 Ana Dosya
- [ ] `index.html` - Ana sayfa (ana klasöre)

#### 🎨 CSS Dosyaları (css/ klasörüne)
- [ ] `css/main.css` - Ana stiller & utilities
- [ ] `css/dashboard.css` - Dashboard özel stilleri  
- [ ] `css/categories.css` - Kategoriler stilleri
- [ ] `css/table.css` - Tablo stilleri
- [ ] `css/reports.css` - Raporlar stilleri

#### ⚙️ JavaScript Dosyaları
- [ ] `js/utils.js` - Yardımcı fonksiyonlar
- [ ] `js/dataManager.js` - Veri yönetimi
- [ ] `js/chartManager.js` - Grafik yönetimi
- [ ] `js/categoryManager.js` - Kategori yönetimi
- [ ] `js/tableManager.js` - Tablo yönetimi
- [ ] `js/exportImport.js` - JSON export/import
- [ ] `js/accountManager.js` - Hesap yönetimi
- [ ] `js/reportManager.js` - Rapor yönetimi
- [ ] `js/app.js` - Ana uygulama kontrolcüsü

#### 🧩 Bileşen Dosyaları (js/components/ klasörüne)
- [ ] `js/components/kpiCards.js` - Performans gösterge kartları
- [ ] `js/components/interactiveCharts.js` - Gelişmiş interaktif grafikler
- [ ] `js/components/quickActions.js` - Hızlı eylem butonları
- [ ] `js/components/aiRecommendations.js` - AI destekli öneriler
- [ ] `js/components/dragDropWidgets.js` - Sürükle-bırak widget yönetimi
- [ ] `js/components/executiveSummaryDashboard.js` - Yönetici özet dashboard'u
- [ ] `js/components/operationalDashboard.js` - Operasyonel dashboard

4. Tüm dosya içeriklerini yukarıda verilen kodları kopyalayarak kaydedin

### 3. Uygulamayı Çalıştırma

#### Basit Yöntem
- `index.html` dosyasına çift tıklayın
- Modern bir tarayıcıda açılacaktır

#### Yerel Sunucu (Önerilen)
```bash
# Python 3
cd budget-tracker
python -m http.server 8000

# Node.js (http-server)
npx http-server .

# PHP
php -S localhost:8000
```

Sonra tarayıcınızda `http://localhost:8000` adresini açın.

## 📚 Kullanım Kılavuzu

### 🏠 Dashboard

Dashboard, mali durumunuzun genel görünümünü sunar:

- **Özet Kartlar**: Toplam gelir, gider, net bakiye, aylık bakiye
- **Aylık Grafik**: Gelir-gider trendi (Chart.js)
- **Kategori Dağılımı**: Gider kategorilerinin pasta grafiği
- **Son İşlemler**: En son 5 işleminiz
- **Özelleştirilebilir Arayüz**: Sürükle-bırak ile widget düzenleme

#### 📊 Yönetici Özet Dashboard'u

Finansal durumunuzun üst düzey bir görünümünü sunar:

- **Üst Düzey KPI'lar**: Net bütçe durumu, tasarruf oranı, en büyük gider kategorisi ve bekleyen ödemeler
- **Trend Özetleri**: Gelir/gider trendleri ve kategori dağılım trendleri
- **Kritik Uyarılar**: Bütçe açıkları, harcama artışları, kategori aşımları ve yaklaşan ödemeler gibi önemli finansal uyarılar
- **Dönem Filtreleme**: Aylık, çeyreklik ve yıllık görünümler

#### 📈 Operasyonel Dashboard

Günlük, haftalık ve aylık finansal metrikleriniz için detaylı analizler:

- **Finansal Performans Skoru**: Tasarruf oranı, gider oranı, bütçe uyumu ve ödeme tamamlama metriklerinden hesaplanan genel bir performans göstergesi
- **Dönemsel Metrikler**: Günlük, haftalık veya aylık finansal metriklerinizin ayrıntılı analizi
- **Performans Geçmişi**: Zaman içindeki finansal performansınızın grafiksel gösterimi
- **İşlem Analizi**: Haftanın günleri, günün saatleri veya ayın günleri bazında işlem desenlerinin analizi
- **Son İşlem Aktiviteleri**: Son işlemlerin durumlarıyla birlikte detaylı görünümü

### 🏷️ Kategoriler Sekmesi

#### Kategori Ekleme
1. "Gelir Kategorileri" veya "Gider Kategorileri" bölümünde **"Ekle"** butonuna tıklayın
2. Kategori adını girin
3. Renk seçin (öntanımlı renkler veya özel renk)
4. İkon seçin (25+ ikon mevcut)
5. **"Ekle"** butonuna tıklayın

#### Alt Kategori Ekleme
1. Ana kategorinin yanındaki **"+"** butonuna tıklayın
2. Alt kategori adını girin
3. Renk seçin
4. **"Ekle"** butonuna tıklayın

#### Hesap Yönetimi
- **Hesap Türleri**: Nakit, Banka Hesabı, Kredi Kartı
- **Renk Kodlama**: Her hesap farklı renk
- **Bakiye Takibi**: Otomatik bakiye güncellemesi
- **Hesap Raporu**: Detaylı performans analizi

### 📋 İşlemler Sekmesi

#### Yeni İşlem Ekleme
1. **"İşlem Ekle"** butonuna tıklayın (veya + FAB butonunu kullanın)
2. **İşlem Durumu**: Gerçekleşen veya Planlanan seçin
3. **Tip**: Gelir veya Gider seçin
4. **Tutar**: Rakam girin (ondalık destekli)
5. **Planlanan Tutar**: Gerçekleşen işlemlerde planlanan tutarı girin (opsiyonel)
6. **Açıklama**: İsteğe bağlı açıklama
7. **Kategori** ve **Alt Kategori**: Uygun kategorileri seçin
8. **Hesap**: İşlemin yapıldığı hesabı seçin
9. **Tarih**: İşlem tarihi
10. **Referans No**: Fatura/makbuz/dekont numarası (opsiyonel)
11. **Etiketler**: Virgülle ayrılmış etiketler
12. **Notlar**: İşlemle ilgili ayrıntılar (opsiyonel)

#### Filtreleme ve Arama
- **Tarih Filtresi**: Bu ay, geçen ay, bu yıl, özel aralık
- **Tip Filtresi**: Gelir, gider veya tümü
- **Kategori Filtresi**: Belirli kategoriler
- **Hesap Filtresi**: Belirli hesaplar

#### Tablo Özellikleri
- **Sıralama**: Herhangi bir sütuna göre sıralama
- **Gruplama**: Tip, kategori, hesap veya tarihe göre
- **Inline Editing**: Hücrelere tıklayarak doğrudan düzenleme
- **Çoklu Seçim**: Toplu işlemler için
- **Pagination**: Büyük veri setleri için sayfalama

#### Toplu İşlemler
- **Toplu Düzenleme**: Birden fazla işlemi aynı anda düzenleyin
- **Toplu Etiketleme**: Birden fazla işleme etiket ekleyin, çıkarın veya değiştirin
- **Toplu Silme**: Birden fazla işlemi aynı anda silin
- **Toplu Gerçekleştirme**: Planlanan işlemleri toplu olarak gerçekleştirin

### 📤 Export/Import

#### Veri Dışa Aktarma
1. **"Dışa Aktar"** butonuna tıklayın
2. Export türünü seçin:
   - **Tam Yedek**: Tüm veriler (işlemler, kategoriler, hesaplar, etiketler ve bütçe planları)
   - **Sadece İşlemler**: İşlemler + kategoriler + hesaplar
   - **Sadece Kategoriler**: Kategori yapısı
   - **Tarih Aralığı**: Belirli dönem
   - **Aylık Excel Raporu**: Seçilen ay için detaylı Excel raporu
   - **Yıllık Excel Raporu**: Seçilen yıl için detaylı Excel raporu
3. İsteğe bağlı olarak "Excel (.xlsx) formatında da dışa aktar" seçeneğini işaretleyin
4. **"Dışa Aktar"** butonuna tıklayın
5. JSON ve/veya Excel dosyası indirilecek
6. **Tam Yedek** seçeneği, bütçe planları dahil tüm verileri içerir ve uygulamanın tam bir kopyasını oluşturur

#### Veri İçe Aktarma
1. **"İçe Aktar"** butonuna tıklayın
2. JSON dosyasını seçin (sürükle-bırak destekli)
3. İçe aktarma modunu seçin:
   - **Değiştir**: Mevcut veriler silinir
   - **Birleştir**: Yeni veriler eklenir
4. **"İçe Aktar"** butonuna tıklayın

#### Bütçe Planları Excel İşlemleri
1. **Bütçe Planları** bölümünde **"Excel Şablonu İndir"** butonuna tıklayın
2. Excel dosyası indirildikten sonra:
   - **Talimatlar** sayfasını okuyun
   - **Kategoriler** sayfasından mevcut kategorileri kontrol edin
   - **Bütçe Planları** sayfasını düzenleyin
3. **"Excel'den İçe Aktar"** butonuna tıklayın
4. Doldurduğunuz Excel dosyasını seçin
5. İsteğe bağlı olarak "İşaretli planlar için planlanan işlemler oluştur" seçeneğini işaretleyin
6. **"İçe Aktar"** butonuna tıklayın

## ⌨️ Klavye Kısayolları

| Kısayol | Açıklama |
|---------|----------|
| `Ctrl+1` | Dashboard sekmesi |
| `Ctrl+2` | Kategoriler sekmesi |
| `Ctrl+3` | İşlemler sekmesi |
| `Ctrl+N` | Yeni işlem ekle |
| `Ctrl+S` | Export modal'ı aç |
| `Ctrl+O` | Import modal'ı aç |
| `Esc` | Modal'ları kapat |

## 🛠️ Teknik Özellikler

### Kullanılan Teknolojiler
- **HTML5**: Semantic markup
- **CSS3**: Tailwind CSS framework
- **JavaScript ES6+**: Vanilla JS, modüler yapı, bileşen mimarisi
- **Chart.js 4.x**: İnteraktif grafikler ve ileri düzey veri görselleştirme
- **Tabulator.js**: Gelişmiş tablo
- **SheetJS (XLSX)**: Excel dosya işleme
- **Lucide Icons**: Modern ikonlar
- **Drag & Drop API**: Sürükle-bırak widget desteği

### Bileşen Yapısı
- **Modüler Mimari**: Bağımsız bileşenler ve yeniden kullanılabilir kod
- **Yaşam Döngüsü Yönetimi**: initialize(), update(), cleanup() metodları
- **Event Delegasyonu**: Etkin olay dinleyici yönetimi
- **Veri Akışı**: dataManager'dan bileşenlere tutarlı veri akışı
- **LocalStorage Persistence**: Kullanıcı tercihlerinin saklanması

### Tarayıcı Desteği
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Veri Depolama
- **LocalStorage**: Tarayıcı yerel depolaması
- **UTF-8**: Türkçe karakter desteği
- **JSON Format**: İnsan okunabilir veri formatı
- **Otomatik Yedekleme**: Sayfa kapatılırken

## 🔒 Güvenlik ve Gizlilik

- ✅ **Offline Çalışma**: İnternet bağlantısı gerektirmez
- ✅ **Yerel Depolama**: Veriler sadece tarayıcınızda
- ✅ **Şifreleme**: LocalStorage güvenli
- ✅ **Gizlilik**: Hiçbir veri sunucuya gönderilmez
- ✅ **Açık Kaynak**: Kod tamamen görünür

## 🐛 Sorun Giderme

### Veri Kaybolması
1. **Otomatik Yedek**: Tarayıcı geçmişinde arayın
2. **Export**: Düzenli olarak yedek alın
3. **İmport**: Önceki yedekten geri yükleyin

### Performans Sorunları
1. **Tarayıcı Cache**: Sayfayı yenileyin (Ctrl+F5)
2. **LocalStorage**: Aşırı büyümüşse temizleyin
3. **Eski Tarayıcı**: Modern tarayıcı kullanın

### Görsel Sorunlar
1. **Responsive**: Sayfayı yeniden boyutlandırın
2. **İkonlar**: İnternet bağlantısını kontrol edin
3. **Tailwind CSS**: CDN'in yüklendiğinden emin olun

### Grafik ve Raporlama Sorunları
1. **Yenileme**: Sayfayı tam yenileyin (Ctrl+F5)
2. **Alternatif Tarayıcı**: Farklı bir tarayıcı deneyin
3. **Konsol Hataları**: Tarayıcı konsolunu kontrol edin (F12 tuşu)
4. **Canvas Hatası**: "Canvas is already in use" hatası alırsanız sayfayı yenileyin

## 🚀 Gelişmiş Özellikler

### Kişiselleştirme
- **Kategoriler**: Özel kategori ve alt kategoriler
- **Renkler**: Her kategori için farklı renk
- **İkonlar**: 25+ özel ikon
- **Hesaplar**: Çoklu hesap desteği
- **Dashboard**: Sürükle-bırak widget'lar ile dashboard düzenleme
- **Widget Görünürlüğü**: İstenen widget'ların gösterilmesi/gizlenmesi

### Raporlama ve Analiz
- **Dashboard Grafikleri**: Aylık trend analizi
- **Yönetici Özet Dashboard'u**: Üst düzey finansal görünüm ve kritik uyarılar
- **Operasyonel Dashboard**: Detaylı finansal metrikler ve performans skoru
- **Kategori Dağılımı**: Harcama analizi
- **İşlem Analizi**: Haftanın günleri, günün saatleri veya ayın günleri bazında analiz
- **Performans Takibi**: Tasarruf oranı, gider oranı, bütçe uyumu ve ödeme tamamlama metrikleri
- **Hesap Raporları**: Hesap bazlı detaylar
- **Bütçe Performans Analizi**: Plan vs gerçekleşme karşılaştırması
- **Excel Raporları**: Aylık ve yıllık detaylı Excel raporları
- **Bütçe Planı Yönetimi**: Excel ile toplu veri işleme
- **Export Seçenekleri**: JSON ve Excel format desteği

### Kullanabilirlik
- **Responsive**: Mobil ve desktop
- **Klavye Navigasyonu**: Accessibility
- **Hızlı İşlemler**: FAB butonu
- **Akıllı Filtreler**: Gelişmiş arama

## 📱 Mobil Kullanım

- **Responsive Tasarım**: Tüm cihazlarda uyumlu
- **Touch Friendly**: Dokunmatik optimizasyonu
- **Fast Loading**: Hızlı yükleme
- **Offline First**: İnternet gerektirmez

## 🔄 Güncelleme ve Geliştirme

### Yeni Özellik Fikirleri
- 🌙 Dark mode desteği
- 📊 Daha fazla grafik türü
- 🔄 Otomatik yedekleme
- 📧 E-posta export
- 💱 Döviz kuru desteği
- 🏦 Banka API entegrasyonu
- 📱 PWA (Progressive Web App)
- 🔐 Şifreleme desteği
- 📅 Tekrarlanan işlemler
- 📩 Bildirim sistemi
- 🤖 Gelişmiş AI destekli tahminleme
- 📊 Cohort analizi modülleri
- 📈 RFM (Recency, Frequency, Monetary) analizi
- 📉 Pareto analizi (80/20 kuralı uygulaması)

### Katkıda Bulunma
1. Code review yapın
2. Bug report gönderin
3. Feature request açın
4. UI/UX iyileştirmeleri önerin

## 📞 Destek

### Sık Sorulan Sorular

**S: Verilerim güvende mi?**
C: Evet, tüm veriler sadece tarayıcınızda saklanır. Hiçbir sunucuya gönderilmez.

**S: Birden fazla cihazda kullanabilir miyim?**
C: Export/Import özelliği ile verilerinizi cihazlar arası taşıyabilirsiniz.

**S: Kategorileri silebilir miyim?**
C: Evet, ancak kullanılan kategoriler güvenlik için silinemez.

**S: Ne kadar veri saklayabilirim?**
C: LocalStorage limiti (~5-10MB) kadar. Normal kullanımda yıllar boyunca yeterli.

---

## 🎉 Kullanım İpuçları

1. **Düzenli Yedekleme**: Haftada bir export alın
2. **Kategoriler**: Baştan iyi planlayın
3. **Etiketler**: Arama ve gruplandırma için etiket kullanın
4. **Toplu İşlemler**: Benzer işlemleri toplu düzenleyin
5. **İşlem Bilgileri**: Referans numarası ve notları kullanın
6. **Hesaplar**: Gerçek hesaplarınızı yansıtın
7. **Raporlar**: Aylık analiz yapın
8. **Tarayıcı**: Tarayıcınızı güncel tutun grafik sorunlarını önlemek için

**Başarılı bütçe yönetimi dileriz! 💰✨**