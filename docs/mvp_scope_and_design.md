# MVP Kapsamı ve Tasarım Kuralları (Sprint 1)

## 1. MVP Akışları (Ekran Akışları)
MVP için temel kullanıcı yolculuğu kesin olarak şu şekilde tanımlanmıştır:
1. **Kayıt/Giriş (Auth)**: Basit e-posta/şifre veya OAuth girişi.
2. **Kıyafet Yükle (Upload)**: Tekli veya çoklu görsel yükleme. Görseller standart bir en-boy oranında kırpılıp thumbnail (küçük resim) haline getirilir.
3. **Avatar Yükle (Avatar)**: Kullanıcı temel bir 3D GLB modeli yükler veya üretir.
4. **Try-on Studio (3D Görüntüleyici)**: Temel özellik. Kullanıcı 3D avatarını üzerine bindirilmiş 2D kıyafet katmanlarıyla görüntüler.
5. **Kombin Kaydet (Save Outfit)**: 3D sahnesinin görünümünün snapshot'ı alınıp kapak (cover) görseli olarak kaydedilir ve kombin detaylarıyla saklanır.
6. **Paylaş (Share)**: Kombin için basit URL paylaşımı veya WhatsApp entegrasyonu.
7. **Yorum/Öneri (Social)**: Arkadaşlar yorum yapabilir veya değişiklik önerebilir (mevcut kombini bozmadan, kopya üzerinden).
8. **AI Yorum (AI Stylist)**: Kaydedilmiş belirli bir kombin için yapay zekadan stil değerlendirmesialınması.
9. **Takvim (Calendar)**: Bir kombinin ne zaman giyildiğinin kaydedilmesi.
10. **İstatistik (Analytics)**: En çok giyilen renkler, en az giyilen parçalar gibi temel metrikler.

## 2. MVP İçin Kıyafet Kategorileri
Kapsamı yönetilebilir tutmak adına, MVP sadece şu temel kategorileri destekleyecektir:
- **Üst (Top)**
- **Alt (Bottom)**
- **Ayakkabı (Shoes)**
- *(Opsiyonel)* **Aksesuar (Accessory)**

## 3. Kabul Kriterleri
- **3D Açılış Süresi**: 3D Avatar görüntüleyici ortalama cihazlarda 3 saniyenin altında yüklenmelidir. Lazy loading (tembel yükleme) ve yükleme animasyonları (spinner) kullanılmalıdır.
- **Stabilite**: Kombin düzenleme veya çoklu parça seçimi sırasında uygulama çökmemelidir.
- **"Temiz Görünüm" (Dağınık Görünüm Yok)**: Arayüz kalabalık bir dolap hissiyatı vermemelidir. Aşağıdaki Tasarım Kurallarına kesinlikle uyulmalıdır.

---

## 4. Tasarım Kuralları: "Dağınık Görünüm Yok" Sözleşmesi

**Amaç**: Kullanıcı arayüzünü premium, odaklanmış ve gereksiz kalabalıktan uzak tutmak.

### Gardırop Kart Şablonu
- **Standart En-Boy Oranı**: Yüklenen tüm parça görselleri standart bir oranda (ör. 3:4 veya 1:1) kırpılmalı/gösterilmelidir.
- **Geniş Boşluklar (Padding)**: Izgara (grid) öğeleri arasında bolca boşluk bırakılmalıdır.
- **Metin Sınırları**: Kart üzerinde yer alan her türlü metin (marka, isim) tek satırda zarifçe kesilmelidir (truncate).

### Filtre UX (Kullanıcı Deneyimi)
- Uzun, kalıcı ve ekranı kaplayan yan çubuklardan (sidebar) kaçınılmalıdır.
- Aktif filtreler için ekranın üst kısmında bir **Chip Bar** (etiket çubuğu) kullanılmalıdır.
- Filtre seçimi ekranı, mobilde bir **Alt Çekmece (Bottom Drawer)**, masaüstünde ise **Yan Çekmece (Side Drawer)** içinde olmalıdır.
- Her zaman belirgin bir **"Tümünü Temizle (Clear All)"** butonu bulunmalıdır.

### Try-on Ekranı (Studio UI)
- **Tek Odak Noktası**: Ekranın mutlak odak noktası 3D Avatar olmalıdır.
- **Gizli Ayarlar**: Katman sırasını, konumlandırmayı (offset) ayarlamaya yarayan kontroller bir çekmece içerisine veya temiz, yüzen bir araç çubuğuna (floating toolbar) saklanmalıdır.
- 3D görüntüleyicinin üzerinde yer alan Arayüz (UI) elemanları çok minimal olmalıdır (örneğin sadece "Fotoğraf Çek" ve "Geri" butonları).
