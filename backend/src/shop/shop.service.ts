import { Injectable } from '@nestjs/common';

export interface ShopItem {
    id: string;
    brand: string;
    productName: string;
    category: string;
    price: string;
    imageUrl: string;
    buyUrl: string;
    styleNote: string;
}

// ─── Marka linkleri — kendi sitelerine ───────────────────────────────────────
function zara(q: string)    { return `https://www.zara.com/tr/tr/search?searchTerm=${encodeURIComponent(q)}`; }
function bershka(q: string) { return `https://www.bershka.com/tr/q/${encodeURIComponent(q)}`; }
function pb(q: string)      { return `https://www.pullandbear.com/tr/q/${encodeURIComponent(q)}`; }
function str(q: string)     { return `https://www.stradivarius.com/tr/search?q=${encodeURIComponent(q)}`; }
function mango(q: string)   { return `https://shop.mango.com/tr/search?q=${encodeURIComponent(q)}`; }
function hm(q: string)      { return `https://www2.hm.com/tr_tr/search-results.html?q=${encodeURIComponent(q)}`; }
function mavi(q: string)    { return `https://www.mavi.com/tr/urunler?q=${encodeURIComponent(q)}`; }
function defacto(q: string) { return `https://www.defacto.com.tr/?q=${encodeURIComponent(q)}`; }
function koton(q: string)   { return `https://www.koton.com/tr/urunler?q=${encodeURIComponent(q)}`; }
function lcw(q: string)     { return `https://www.lcwaikiki.com/tr-TR/Search?s=${encodeURIComponent(q)}`; }
function tym(q: string)     { return `https://www.trendyol.com/sr?q=${encodeURIComponent('trendyolmilla ' + q)}`; }

// ─── Fotoğraflar ──────────────────────────────────────────────────────────────
// Doğrulanmış Unsplash long-format URL'leri (CDN'de kesin çalışan)
// Ceket/Dış Giyim
const O = [
    'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=800&q=80&fashion-jacket',  // [0] deri ceket
    'https://images.unsplash.com/photo-1544022613-e87ef7556554?w=800&q=80&fashion-coat',    // [1] siyah ceket
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80&fashion-blazer',  // [2] kırmızı blazer
    'https://images.unsplash.com/photo-1539533057403-0c6688c566fa?w=800&q=80&fashion-puffer',  // [3] mavi şişme mont
    'https://images.unsplash.com/photo-1539825387789-ab7e9b7ae414?w=800&q=80&fashion-jacket',  // [4] yeşil ceket
    'https://images.unsplash.com/photo-1544441893-675973e31d85?w=800&q=80&fashion-coat',    // [5] siyah kaban
    'https://images.unsplash.com/photo-1544022613-e87ef7556554?w=800&q=80&fashion-coat',    // [6] uzun palto
    'https://images.unsplash.com/photo-1551778147-ce2e7e1d7d7f?w=800&q=80&fashion-trench',    // [7] trençkot
];

// Üst Giyim - Tişört, Bluz, Gömlek
const T = [
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80&fashion-tshirt',  // [0] beyaz tişört
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80&fashion-hoodie',  // [1] siyah tişört/hoodie
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&fashion-top',     // [2] baskılı tişört
    'https://images.unsplash.com/photo-1596815064285-b539041dd1e7?w=800&q=80&fashion-shirt',   // [3] beyaz gömlek
    'https://images.unsplash.com/photo-1620012253295-c15cc7cb4b35?w=800&q=80&fashion-shirt',   // [4] mavi gömlek
    'https://images.unsplash.com/photo-1609027291979-03674e0ef656?w=800&q=80&fashion-blouse',  // [5] pastel bluz
    'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&q=80&fashion-blouse',  // [6] uzun kollu bluz
];

// Jean/Denim
const B = [
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80&fashion-jeans',   // [0] mavi denim
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&fashion-jeans',   // [1] açık mavi jean
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80&fashion-pants',   // [2] siyah denim
    'https://images.unsplash.com/photo-1582418702292-4876af7b9bfe?w=800&q=80&fashion-pants',   // [3] gri jean
    'https://images.unsplash.com/photo-1584865884612-73489c95b41d?w=800&q=80&fashion-pants',   // [4] beyaz denim
];

// Etek/Skirt
const SK = [
    'https://images.unsplash.com/photo-1583496664160-39c17360801d?w=800&q=80&fashion-skirt',   // [0] siyah etek
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&fashion-skirt',   // [1] midi etek
    'https://images.unsplash.com/photo-1602033473980-2b64b719a45d?w=800&q=80&fashion-skirt',   // [2] denim etek
];

// Elbise/Dress
const D = [
    'https://images.unsplash.com/photo-1595777707802-51b40f018e50?w=800&q=80&fashion-dress',   // [0] siyah elbise
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&fashion-dress',   // [1] midi elbise
    'https://images.unsplash.com/photo-1515240651066-61f03ce63761?w=800&q=80&fashion-dress',   // [2] çiçekli elbise
    'https://images.unsplash.com/photo-1595603420277-ffb6ea4364b0?w=800&q=80&fashion-dress',   // [3] beyaz elbise
    'https://images.unsplash.com/photo-1551747116-9586191b4d5f?w=800&q=80&fashion-dress',   // [4] renkli elbise
];

// Ayakkabı/Shoes
const SH = [
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80&fashion-sneaker', // [0] beyaz sneaker
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80&fashion-shoes',   // [1] siyah ayakkabı
    'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=80&fashion-shoes',   // [2] platform ayakkabı
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80&fashion-boots',   // [3] topuklu bot
];

// Aksesuar/Accessories
const A = [
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&fashion-bag',     // [0] deri çanta
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80&fashion-bag',     // [1] kapitone çanta
];

@Injectable()
export class ShopService {
    private readonly catalog: ShopItem[] = [

        // ════════════ ZARA ════════════
        { id: 'z-1',  brand: 'Zara', productName: 'Oversize Blazer',     category: 'Dış Giyim', price: '1.799 TL', styleNote: 'Ofis & Sokak Şıklığı',    imageUrl: O[0], buyUrl: zara('oversize blazer') },
        { id: 'z-2',  brand: 'Zara', productName: 'Saten Bluz',          category: 'Üst Giyim', price: '799 TL',   styleNote: 'Akşam Üstü Şıklığı',       imageUrl: T[6], buyUrl: zara('saten bluz') },
        { id: 'z-3',  brand: 'Zara', productName: 'Wide Leg Denim',      category: 'Alt Giyim', price: '1.199 TL', styleNote: 'Bu Sezonun Trendi',         imageUrl: B[0],    buyUrl: zara('wide leg denim') },
        { id: 'z-4',  brand: 'Zara', productName: 'Crop Knit Kazak',     category: 'Üst Giyim', price: '899 TL',   styleNote: 'Kış Favorisi',              imageUrl: T[0], buyUrl: zara('crop knit kazak') },
        { id: 'z-5',  brand: 'Zara', productName: 'Trençkot',            category: 'Dış Giyim', price: '2.499 TL', styleNote: 'Zamansız Klasik',           imageUrl: O[6], buyUrl: zara('trençkot') },
        { id: 'z-6',  brand: 'Zara', productName: 'Oxford Gömlek',       category: 'Üst Giyim', price: '899 TL',   styleNote: 'Smart Casual Esası',        imageUrl: T[3], buyUrl: zara('oxford gömlek') },
        { id: 'z-7',  brand: 'Zara', productName: 'Slim Fit Chino',      category: 'Alt Giyim', price: '1.299 TL', styleNote: 'Her Ortama Uyum',           imageUrl: B[1],    buyUrl: zara('slim fit chino') },
        { id: 'z-8',  brand: 'Zara', productName: 'Deri Görünümlü Mont', category: 'Dış Giyim', price: '1.999 TL', styleNote: 'Güçlü & Şık Kombin',       imageUrl: O[1], buyUrl: zara('deri görünümlü mont') },
        { id: 'z-9',  brand: 'Zara', productName: 'Zincir Detaylı Çanta',category: 'Aksesuar',  price: '1.099 TL', styleNote: 'İkon Aksesuar',             imageUrl: A[0], buyUrl: zara('zincir çanta') },
        { id: 'z-10', brand: 'Zara', productName: 'Midi Wrap Elbise',    category: 'Elbise',    price: '1.499 TL', styleNote: 'Her Bedene Uyar',           imageUrl: D[0], buyUrl: zara('midi wrap elbise') },
        { id: 'z-11', brand: 'Zara', productName: 'Ekose Blazer',        category: 'Dış Giyim', price: '1.699 TL', styleNote: 'Editorial Görünüm',         imageUrl: O[2], buyUrl: zara('ekose blazer') },
        { id: 'z-12', brand: 'Zara', productName: 'Ribana Crop Top',     category: 'Üst Giyim', price: '549 TL',   styleNote: 'Minimal & Taze',            imageUrl: T[5], buyUrl: zara('ribana crop top') },

        // ════════════ BERSHKA ════════════
        { id: 'b-1',  brand: 'Bershka', productName: 'Crop Hoodie',      category: 'Üst Giyim', price: '499 TL',   styleNote: 'Rahat & Trend',             imageUrl: T[2], buyUrl: bershka('crop hoodie') },
        { id: 'b-2',  brand: 'Bershka', productName: 'Biker Ceket',      category: 'Dış Giyim', price: '1.199 TL', styleNote: 'Urban & Güçlü',             imageUrl: O[4], buyUrl: bershka('biker ceket') },
        { id: 'b-3',  brand: 'Bershka', productName: 'Mini Etek',        category: 'Alt Giyim', price: '449 TL',   styleNote: 'Y2K Ruhunu Yaşa',          imageUrl: SK[0], buyUrl: bershka('mini etek') },
        { id: 'b-4',  brand: 'Bershka', productName: 'Graphic Tee',      category: 'Üst Giyim', price: '349 TL',   styleNote: 'Sokak Sanatı Teması',       imageUrl: T[1], buyUrl: bershka('graphic tee') },
        { id: 'b-5',  brand: 'Bershka', productName: 'Rüzgarlık Mont',   category: 'Dış Giyim', price: '999 TL',   styleNote: 'Mevsim Geçişi Dostu',       imageUrl: O[3], buyUrl: bershka('rüzgarlık mont') },
        { id: 'b-6',  brand: 'Bershka', productName: 'Platform Sneaker', category: 'Ayakkabı',  price: '849 TL',   styleNote: 'Boy Uzatır & Trend',        imageUrl: SH[1], buyUrl: bershka('platform sneaker') },
        { id: 'b-7',  brand: 'Bershka', productName: 'Baggy Denim',      category: 'Alt Giyim', price: '749 TL',   styleNote: '90\'lar Nostaljisi',        imageUrl: B[2],    buyUrl: bershka('baggy denim') },
        { id: 'b-8',  brand: 'Bershka', productName: 'Puf Kollu Bluz',   category: 'Üst Giyim', price: '449 TL',   styleNote: 'Feminen & Romantik',        imageUrl: T[6], buyUrl: bershka('puf kollu bluz') },
        { id: 'b-9',  brand: 'Bershka', productName: 'Kargo Pantolon',   category: 'Alt Giyim', price: '699 TL',   styleNote: 'Fonksiyonel & Cool',        imageUrl: B[3],    buyUrl: bershka('kargo pantolon') },
        { id: 'b-10', brand: 'Bershka', productName: 'Crop Denim Ceket', category: 'Dış Giyim', price: '899 TL',   styleNote: 'Yaz Kombini Tamamlayıcısı', imageUrl: O[0], buyUrl: bershka('crop denim ceket') },

        // ════════════ PULL & BEAR ════════════
        { id: 'pb-1', brand: 'Pull & Bear', productName: 'Boxy Tişört',       category: 'Üst Giyim', price: '399 TL',   styleNote: 'Temel Parça Şart',       imageUrl: T[5], buyUrl: pb('boxy tişört') },
        { id: 'pb-2', brand: 'Pull & Bear', productName: 'Mom Jeans',          category: 'Alt Giyim', price: '799 TL',   styleNote: 'Vintage Kesim Şıklığı',  imageUrl: B[4],    buyUrl: pb('mom jeans') },
        { id: 'pb-3', brand: 'Pull & Bear', productName: 'Sherpa Ceket',       category: 'Dış Giyim', price: '1.299 TL', styleNote: 'Sonbahar Konforu',       imageUrl: O[5], buyUrl: pb('sherpa ceket') },
        { id: 'pb-4', brand: 'Pull & Bear', productName: 'Loose Fit Gömlek',   category: 'Üst Giyim', price: '549 TL',   styleNote: 'Rahat Günlük Stil',      imageUrl: T[3], buyUrl: pb('loose fit gömlek') },
        { id: 'pb-5', brand: 'Pull & Bear', productName: 'Straight Leg Jeans', category: 'Alt Giyim', price: '849 TL',   styleNote: 'Klasik Kesim Denim',     imageUrl: B[0],    buyUrl: pb('straight leg jeans') },
        { id: 'pb-6', brand: 'Pull & Bear', productName: 'Puffer Yelek',       category: 'Dış Giyim', price: '999 TL',   styleNote: 'Layering Trendi',        imageUrl: O[3], buyUrl: pb('puffer yelek') },
        { id: 'pb-7', brand: 'Pull & Bear', productName: 'Chunky Sneaker',     category: 'Ayakkabı',  price: '999 TL',   styleNote: 'Dad Shoe Estetiği',      imageUrl: SH[1], buyUrl: pb('chunky sneaker') },
        { id: 'pb-8', brand: 'Pull & Bear', productName: 'Crop Sweatshirt',    category: 'Üst Giyim', price: '649 TL',   styleNote: 'Günlük Spor Şıklık',    imageUrl: T[2], buyUrl: pb('crop sweatshirt') },
        { id: 'pb-9', brand: 'Pull & Bear', productName: 'Parachute Pantolon', category: 'Alt Giyim', price: '749 TL',   styleNote: 'Y2K & Streetwear',       imageUrl: B[1],    buyUrl: pb('parachute pantolon') },

        // ════════════ STRADİVARİUS ════════════
        { id: 'str-1', brand: 'Stradivarius', productName: 'Fırfırlı Midi Etek',  category: 'Alt Giyim', price: '649 TL',   styleNote: 'Bohem Ruhunu Taşı',      imageUrl: SK[1], buyUrl: str('fırfırlı midi etek') },
        { id: 'str-2', brand: 'Stradivarius', productName: 'Çiçekli Midi Elbise', category: 'Elbise',    price: '1.099 TL', styleNote: 'Bahar Enerjisi',          imageUrl: D[1],  buyUrl: str('çiçekli midi elbise') },
        { id: 'str-3', brand: 'Stradivarius', productName: 'Oversize Sweatshirt', category: 'Üst Giyim', price: '799 TL',   styleNote: 'Konforlu & Şık',          imageUrl: T[1],  buyUrl: str('oversize sweatshirt') },
        { id: 'str-4', brand: 'Stradivarius', productName: 'Straight Denim',      category: 'Alt Giyim', price: '899 TL',   styleNote: 'Her Kombinin Temeli',     imageUrl: B[2],     buyUrl: str('straight denim') },
        { id: 'str-5', brand: 'Stradivarius', productName: 'Kolsuz Blazer',       category: 'Dış Giyim', price: '1.299 TL', styleNote: 'Yaz Ofis Şıklığı',       imageUrl: O[2],  buyUrl: str('kolsuz blazer') },
        { id: 'str-6', brand: 'Stradivarius', productName: 'Omuz Askılı Bluz',    category: 'Üst Giyim', price: '549 TL',   styleNote: 'Yazın Vazgeçilmezi',      imageUrl: T[6],  buyUrl: str('omuz askılı bluz') },
        { id: 'str-7', brand: 'Stradivarius', productName: 'Midi Wrap Etek',      category: 'Alt Giyim', price: '749 TL',   styleNote: 'Her Bedene Uyumlu Kesim', imageUrl: SK[2], buyUrl: str('midi wrap etek') },
        { id: 'str-8', brand: 'Stradivarius', productName: 'Block Heel Bot',      category: 'Ayakkabı',  price: '1.199 TL', styleNote: 'Sonbahar Botuyla Tamamla',imageUrl: SH[2], buyUrl: str('block heel bot') },

        // ════════════ TRENDYOLMİLLA ════════════
        { id: 'tym-1', brand: 'Trendyolmilla', productName: 'Düşük Omuz Bluz',    category: 'Üst Giyim', price: '279 TL', styleNote: 'Uygun Fiyat Şıklığı',      imageUrl: T[0], buyUrl: tym('düşük omuz bluz') },
        { id: 'tym-2', brand: 'Trendyolmilla', productName: 'Şişme Mont',          category: 'Dış Giyim', price: '799 TL', styleNote: 'Kış Boyunca Sıcak',        imageUrl: O[3], buyUrl: tym('şişme mont') },
        { id: 'tym-3', brand: 'Trendyolmilla', productName: 'Paperbag Pantolon',   category: 'Alt Giyim', price: '399 TL', styleNote: 'Bel Vurgulayan Kesim',      imageUrl: B[3],    buyUrl: tym('paperbag pantolon') },
        { id: 'tym-4', brand: 'Trendyolmilla', productName: 'Volanlı Midi Elbise', category: 'Elbise',    price: '649 TL', styleNote: 'Özel Anlara Özel Tasarım', imageUrl: D[2], buyUrl: tym('volanlı midi elbise') },
        { id: 'tym-5', brand: 'Trendyolmilla', productName: 'Crop Basic Tişört',   category: 'Üst Giyim', price: '199 TL', styleNote: 'Temel Dolap Parçası',       imageUrl: T[5], buyUrl: tym('crop basic tişört') },
        { id: 'tym-6', brand: 'Trendyolmilla', productName: 'Kapitone Çanta',      category: 'Aksesuar',  price: '349 TL', styleNote: 'Mini & Feminen',            imageUrl: A[1], buyUrl: tym('kapitone çanta') },
        { id: 'tym-7', brand: 'Trendyolmilla', productName: 'Bağlamalı Gömlek',    category: 'Üst Giyim', price: '329 TL', styleNote: 'Kırsal Romantizm',          imageUrl: T[3], buyUrl: tym('bağlamalı gömlek') },
        { id: 'tym-8', brand: 'Trendyolmilla', productName: 'Skinny Jean',         category: 'Alt Giyim', price: '499 TL', styleNote: 'Klasik Silüet',             imageUrl: B[4],    buyUrl: tym('skinny jean') },

        // ════════════ MANGO ════════════
        { id: 'mg-1', brand: 'Mango', productName: 'Fitted Blazer',    category: 'Dış Giyim', price: '2.299 TL', styleNote: 'Profesyonel & Şık',          imageUrl: O[0], buyUrl: mango('fitted blazer') },
        { id: 'mg-2', brand: 'Mango', productName: 'Linen Gömlek',     category: 'Üst Giyim', price: '1.099 TL', styleNote: 'Yaz Esintisi & Serinlik',     imageUrl: T[6], buyUrl: mango('linen gömlek') },
        { id: 'mg-3', brand: 'Mango', productName: 'Culotte Pantolon', category: 'Alt Giyim', price: '1.299 TL', styleNote: 'Şık Boy Yanılsaması',         imageUrl: B[0],    buyUrl: mango('culotte pantolon') },
        { id: 'mg-4', brand: 'Mango', productName: 'Wrap Elbise',      category: 'Elbise',    price: '1.799 TL', styleNote: 'Feminen & Zamansız',          imageUrl: D[3], buyUrl: mango('wrap elbise') },
        { id: 'mg-5', brand: 'Mango', productName: 'Oversize Blazer',  category: 'Dış Giyim', price: '999 TL',   styleNote: 'Günün Her Anına Uyar',       imageUrl: O[5], buyUrl: mango('oversize blazer') },
        { id: 'mg-6', brand: 'Mango', productName: 'Kapitone Ceket',   category: 'Dış Giyim', price: '2.499 TL', styleNote: 'Lüks Kış Kombini',           imageUrl: O[3], buyUrl: mango('kapitone ceket') },
        { id: 'mg-7', brand: 'Mango', productName: 'Kadife Pantolon',  category: 'Alt Giyim', price: '1.499 TL', styleNote: 'Akşam Yemeği Şıklığı',       imageUrl: B[1],    buyUrl: mango('kadife pantolon') },

        // ════════════ H&M ════════════
        { id: 'hm-1', brand: 'H&M', productName: 'Ribana Crop Top',      category: 'Üst Giyim', price: '299 TL', styleNote: 'Minimal & Şık',               imageUrl: T[5], buyUrl: hm('ribana crop top') },
        { id: 'hm-2', brand: 'H&M', productName: 'Puf Kollu Elbise',     category: 'Elbise',    price: '599 TL', styleNote: 'Doğum Günü Kombini',           imageUrl: D[4], buyUrl: hm('puf kollu elbise') },
        { id: 'hm-3', brand: 'H&M', productName: 'Oversize Denim Ceket', category: 'Dış Giyim', price: '899 TL', styleNote: 'İlkbahar Layering Şampiyonu',  imageUrl: O[2], buyUrl: hm('oversize denim ceket') },
        { id: 'hm-4', brand: 'H&M', productName: 'Jogger Eşofman Altı',  category: 'Alt Giyim', price: '449 TL', styleNote: 'Ev & Sokak Konforu',           imageUrl: B[2],    buyUrl: hm('jogger eşofman altı') },
        { id: 'hm-5', brand: 'H&M', productName: 'Regular Fit Tişört',   category: 'Üst Giyim', price: '199 TL', styleNote: 'Dolabın Temeli',               imageUrl: T[1], buyUrl: hm('regular fit tişört') },
        { id: 'hm-6', brand: 'H&M', productName: 'Slim Jeans',           category: 'Alt Giyim', price: '499 TL', styleNote: 'Her Üste Gider',               imageUrl: B[3],    buyUrl: hm('slim jeans') },
        { id: 'hm-7', brand: 'H&M', productName: 'Kapitone Yelek',       category: 'Dış Giyim', price: '699 TL', styleNote: 'Katmanlı Giyim Trendi',        imageUrl: O[6], buyUrl: hm('kapitone yelek') },

        // ════════════ DeFacto ════════════
        { id: 'df-1', brand: 'DeFacto', productName: 'Basic Pamuk Tişört',   category: 'Üst Giyim', price: '199 TL', styleNote: 'Her Kombinin Başlangıcı',  imageUrl: T[0], buyUrl: defacto('basic pamuk tişört') },
        { id: 'df-2', brand: 'DeFacto', productName: 'Comfort Fit Jeans',    category: 'Alt Giyim', price: '499 TL', styleNote: 'Tüm Gün Konfor',           imageUrl: B[4],    buyUrl: defacto('comfort fit jeans') },
        { id: 'df-3', brand: 'DeFacto', productName: 'Şişme Kaban',          category: 'Dış Giyim', price: '799 TL', styleNote: 'Soğuk Havalarda Güvende',  imageUrl: O[3], buyUrl: defacto('şişme kaban') },
        { id: 'df-4', brand: 'DeFacto', productName: 'Polo Yaka Tişört',     category: 'Üst Giyim', price: '249 TL', styleNote: 'Smart Casual Vazgeçilmez', imageUrl: T[2], buyUrl: defacto('polo yaka tişört') },
        { id: 'df-5', brand: 'DeFacto', productName: 'Relaxed Jogger',       category: 'Alt Giyim', price: '399 TL', styleNote: 'Spor Chic Kombinleri',     imageUrl: B[0],    buyUrl: defacto('relaxed jogger') },
        { id: 'df-6', brand: 'DeFacto', productName: 'Kapüşonlu Sweatshirt', category: 'Üst Giyim', price: '449 TL', styleNote: 'Rahat & Sıcak & Şık',     imageUrl: T[3], buyUrl: defacto('kapüşonlu sweatshirt') },
        { id: 'df-7', brand: 'DeFacto', productName: 'Regular Fit Chino',    category: 'Alt Giyim', price: '499 TL', styleNote: 'Ofisten Sokağa',           imageUrl: B[1],    buyUrl: defacto('regular fit chino') },

        // ════════════ MAVİ ════════════
        { id: 'mv-1', brand: 'Mavi', productName: 'Slim Fit Jean',       category: 'Alt Giyim', price: '849 TL',   styleNote: 'Klasik Denim Şıklığı',    imageUrl: B[2],    buyUrl: mavi('slim fit jean') },
        { id: 'mv-2', brand: 'Mavi', productName: 'Skinny Jean',         category: 'Alt Giyim', price: '799 TL',   styleNote: 'Silüeti Vurgula',          imageUrl: B[3],    buyUrl: mavi('skinny jean') },
        { id: 'mv-3', brand: 'Mavi', productName: 'Regular Jean',        category: 'Alt Giyim', price: '749 TL',   styleNote: 'Günlük Denim Esası',       imageUrl: B[4],    buyUrl: mavi('regular jean') },
        { id: 'mv-4', brand: 'Mavi', productName: 'Basic Tişört',        category: 'Üst Giyim', price: '299 TL',   styleNote: 'Dolap Staple\'ı',          imageUrl: T[5], buyUrl: mavi('basic tişört') },
        { id: 'mv-5', brand: 'Mavi', productName: 'Polo Gömlek',         category: 'Üst Giyim', price: '549 TL',   styleNote: 'Spor Elegance',            imageUrl: T[3], buyUrl: mavi('polo gömlek') },
        { id: 'mv-6', brand: 'Mavi', productName: 'Denim Ceket',         category: 'Dış Giyim', price: '1.299 TL', styleNote: 'Denim-on-Denim Trendi',    imageUrl: O[1], buyUrl: mavi('denim ceket') },
        { id: 'mv-7', brand: 'Mavi', productName: 'Oversize Sweatshirt', category: 'Üst Giyim', price: '649 TL',   styleNote: 'Rahat & Gündelik',         imageUrl: T[1], buyUrl: mavi('oversize sweatshirt') },
        { id: 'mv-8', brand: 'Mavi', productName: 'Straight Jean',       category: 'Alt Giyim', price: '899 TL',   styleNote: 'Y2K Denim Estetiği',       imageUrl: B[0],    buyUrl: mavi('straight jean') },

        // ════════════ LC WAİKİKİ ════════════
        { id: 'lc-1', brand: 'LC Waikiki', productName: 'Basic Tişört',        category: 'Üst Giyim', price: '149 TL', styleNote: 'Bütçe Dostu Temel',       imageUrl: T[0], buyUrl: lcw('basic tişört') },
        { id: 'lc-2', brand: 'LC Waikiki', productName: 'Slim Fit Pantolon',   category: 'Alt Giyim', price: '349 TL', styleNote: 'Her Bütçeye Şıklık',      imageUrl: B[1],    buyUrl: lcw('slim fit pantolon') },
        { id: 'lc-3', brand: 'LC Waikiki', productName: 'Kapüşonlu Sweatshirt',category: 'Üst Giyim', price: '299 TL', styleNote: 'Günlük Konfor',            imageUrl: T[2], buyUrl: lcw('kapüşonlu sweatshirt') },
        { id: 'lc-4', brand: 'LC Waikiki', productName: 'Şişme Yelek',         category: 'Dış Giyim', price: '449 TL', styleNote: 'Katmanlı Geçiş Dönemi',   imageUrl: O[3], buyUrl: lcw('şişme yelek') },
        { id: 'lc-5', brand: 'LC Waikiki', productName: 'Regular Fit Jean',    category: 'Alt Giyim', price: '399 TL', styleNote: 'Uygun Fiyat Kaliteli Denim',imageUrl: B[2],   buyUrl: lcw('regular fit jean') },
        { id: 'lc-6', brand: 'LC Waikiki', productName: 'Uzun Mont',           category: 'Dış Giyim', price: '899 TL', styleNote: 'Kış Koruması',             imageUrl: O[6], buyUrl: lcw('uzun mont') },
        { id: 'lc-7', brand: 'LC Waikiki', productName: 'Polo Yaka Gömlek',    category: 'Üst Giyim', price: '199 TL', styleNote: 'Okul & Günlük Şıklık',    imageUrl: T[3], buyUrl: lcw('polo yaka gömlek') },

        // ════════════ KOTON ════════════
        { id: 'kt-1', brand: 'Koton', productName: 'Çiçekli Bluz',     category: 'Üst Giyim', price: '399 TL',   styleNote: 'Bahar Enerjisiyle Dolu',  imageUrl: T[6], buyUrl: koton('çiçekli bluz') },
        { id: 'kt-2', brand: 'Koton', productName: 'Midi Elbise',       category: 'Elbise',    price: '799 TL',   styleNote: 'Zarif & Konforlu',         imageUrl: D[1], buyUrl: koton('midi elbise') },
        { id: 'kt-3', brand: 'Koton', productName: 'Yüksek Bel Jean',   category: 'Alt Giyim', price: '549 TL',   styleNote: 'Bel Hatlarını Vurgula',    imageUrl: B[3],    buyUrl: koton('yüksek bel jean') },
        { id: 'kt-4', brand: 'Koton', productName: 'Trençkot',          category: 'Dış Giyim', price: '1.499 TL', styleNote: 'Her Mevsim Klasiği',       imageUrl: O[6], buyUrl: koton('trençkot') },
        { id: 'kt-5', brand: 'Koton', productName: 'Crop Tişört',       category: 'Üst Giyim', price: '249 TL',   styleNote: 'Sade & Chic',              imageUrl: T[5], buyUrl: koton('crop tişört') },
        { id: 'kt-6', brand: 'Koton', productName: 'Keten Gömlek',      category: 'Üst Giyim', price: '499 TL',   styleNote: 'Nefes Alan Yaz Stili',     imageUrl: T[3], buyUrl: koton('keten gömlek') },
        { id: 'kt-7', brand: 'Koton', productName: 'Fırfırlı Mini Etek',category: 'Alt Giyim', price: '349 TL',   styleNote: 'Feminen & Oyuncu',         imageUrl: SK[0], buyUrl: koton('fırfırlı mini etek') },
    ];

    private shuffle(arr: ShopItem[]): ShopItem[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    getDiscoverItems(): ShopItem[] {
        const validItems = this.catalog.filter(item => {
            if (!item || !item.productName || !item.imageUrl || !item.buyUrl) return false;

            const link = item.buyUrl.trim().toLowerCase();
            const hasSpecificPathOrQuery = (link.includes('/') && link.split('/').length > 3) || link.includes('?');
            if (!hasSpecificPathOrQuery) return false;

            const img = item.imageUrl.trim().toLowerCase();
            if (!img.startsWith('http') || !img.includes('unsplash.com')) return false;

            return true;
        });
        return this.shuffle(validItems);
    }
}
