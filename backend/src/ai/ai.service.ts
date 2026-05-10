import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Generate3DModelJob, GenerateAvatarJob } from './dto/ai-jobs.dto';
import OpenAI from 'openai';
import Replicate from 'replicate';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI | null = null;
    private anthropic: Anthropic | null = null;
    private replicate: Replicate | null = null;
    private isGroq = false;

    constructor(
        private readonly prisma: PrismaService,
        @Optional() @InjectQueue('ai-tasks') private readonly aiQueue: Queue,
        @Optional() @InjectQueue('avatar-tasks') private readonly avatarQueue: Queue
    ) {
        // Groq — free, fast, Llama 3.3 70B (primary)
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
            this.openai = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
            this.isGroq = true;
            this.logger.log('AI: Groq (Llama 3.3 70B) aktif.');
        } else {
            // OpenAI — fallback
            const openaiKey = process.env.OPENAI_API_KEY;
            if (openaiKey) {
                this.openai = new OpenAI({ apiKey: openaiKey });
                this.logger.log('AI: OpenAI aktif.');
            }
        }

        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (anthropicKey) {
            this.anthropic = new Anthropic({ apiKey: anthropicKey });
            this.logger.log('AI: Anthropic Claude aktif.');
        }

        if (!groqKey && !process.env.OPENAI_API_KEY && !anthropicKey) {
            this.logger.warn('Hiçbir AI key bulunamadı. GROQ_API_KEY ekle (ücretsiz: console.groq.com)');
        }

        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (replicateToken) {
            this.replicate = new Replicate({ auth: replicateToken });
        } else {
            this.logger.warn('REPLICATE_API_TOKEN is missing! Virtual Try-On will run in demo mode.');
        }

        // Keep HuggingFace Space awake (ping every 9 minutes)
        this.startSpaceKeepAlive();
    }

    private startSpaceKeepAlive() {
        const wake = async () => {
            try {
                const { Client } = await import('@gradio/client');
                await Client.connect('yisol/IDM-VTON', { status_callback: () => {} } as any);
                this.logger.log('[Keep-Alive] IDM-VTON Space Gradio connected — GPU awake');
            } catch (err: any) {
                this.logger.warn(`[Keep-Alive] IDM-VTON Space wake failed: ${err?.message}`);
            }
        };
        wake(); // wake immediately on startup
        setInterval(wake, 10 * 60 * 1000); // keep GPU awake every 10 min
    }

    async getStylistResponse(
        userId: string,
        userMessage: string,
        imageBase64?: string,
        history?: { role: 'user' | 'assistant'; content: string }[],
        gender?: string
    ) {
        // 1. Get user's wardrobe context
        const wardrobe = await this.prisma.wardrobe.findUnique({
            where: { userId },
            include: {
                items: {
                    include: { photos: true }
                }
            }
        });

        const wardrobeEmpty = !wardrobe || !wardrobe.items.length;

        // 2. Prepare context for AI — include gender per item
        const wardrobeSummary = wardrobeEmpty
            ? '(Gardırop boş)'
            : wardrobe.items.map(item =>
                `- ID:${item.id} | ${item.category} | Marka: ${item.brand || 'Bilinmeyen'} | Renk: ${item.colors.join(', ')} | Mevsim: ${item.seasons.join(', ')} | Cinsiyet: ${(item as any).gender || 'Unisex'}`
              ).join('\n');

        const genderContext = gender === 'Erkek'
            ? `KULLANICI CİNSİYETİ: ERKEK — BU KURAL HER ŞEYIN ÖNÜNDE GELIR.
CİNSİYET KURALLARI — KESİN ZORUNLU:
• Bu kullanıcı erkektir. Tüm öneriler ERKEK modasına uygun olmalıdır.
• Erkek gardırop ögeleri: düz/slim/chino pantolon, jean (slim/regular/straight/wide erkek kesimi), polo yaka, gömlek, tişört, sweatshirt, kapüşonlu üst, blazer ceket, denim ceket, bomber ceket, mont, spor ayakkabı, bot, oxford/loafer ayakkabı, erkek çantası/sırt çantası.
• KESINLIKLE ÖNERME (bunlar kadın ürünü): etek, palazzo pantolon, wide-leg akışkan kumaş kadın pantolonu, crop top, kadın bluzu, elbise, kadın trençkotu (dar bel, parlak kumaş kadın modeli), yüksek topuklu, kadın çantası, büyük kulplu el çantası.
• CAMEL/BEJ PANTOLON KURALI: Dolaptaki camel renkli pantolon geniş paçalı/akışkan/palazzo kesimli ise ERKEK KULLANICISINA ASLA ÖNERME. Chino/düz/slim kesim erkek pantolonu ise önere bilirsin.
• Dolaptaki parça "Unisex" etiketli olsa bile eğer kesimi/modeli kadın stiline aitse ÖNERME — erkek mantığıyla yorum yap.
• Önereceğin her alt giyim parçasını kontrol et: "Bu erkek pantolonu mu kadın pantolonu mu?" — kadın kesimiyse listeden çıkar.`
            : gender === 'Kadın'
            ? `KULLANICI CİNSİYETİ: KADIN
CİNSİYET KURALLARI — KESİN ZORUNLU:
• Bu kullanıcı kadındır. SADECE kadın ya da unisex parçalar öner.
• Kadın modası: etek, elbise, bluz, kadın kesim pantolon, crop üst, kadın blazer, trençkot, topuklu, kadın bot/sneaker.
• Eğer dolaptaki parça erkek modeli (erkek gömleği, takım elbise pantolonu vb.) ise kadın üzerine nasıl stilize edileceğini açıkla ya da başka parça öner.`
            : `KULLANICI CİNSİYETİ: Belirtilmemiş — Unisex öneriler yap.`;

        const hasImage = !!imageBase64;
        const systemPrompt = `Sen dünyanın en iyi kişisel stil danışmanısın. Adın "Stil". Türkçe konuşuyorsun ve her cevabında gerçek bir uzman gibi davranıyorsun.

${genderContext}

KULLANICININ DOLABI:
${wardrobeSummary}

DİL KURALI — KESİN ZORUNLU:
• SADECE saf Türkçe kullan. İngilizce kelime kesinlikle yasak.
• Yabancı marka isimleri (Zara, Mavi, H&M vb.) hariç hiçbir İngilizce kelime yazma.
• Doğru Türkçe karşılıklar: "self-confidence" → "özgüven", "crochet" → "tığ işi/örgü", "oversized" → "bol kesim", "casual" → "gündelik", "trendy" → "trend", "chic" → "şık", "smart casual" → "akıllı gündelik", "outfit" → "kombin".
• Cümlelerin tamamı Türkçe olacak.

SENİN DERİN BİLGİN:
• Renk teorisi: hangi renkler tamamlar (lacivert+bej, haki+beyaz, bordo+gri), hangileri çatışır, ton uyumu
• Doku ve kumaş: mat+parlak kombinasyonu, keten yazın neden nefes aldırır, kadife kışın nasıl kullanılır
• Kesim ve vücut: bol kesim üst+dar alt dengesi, yüksek bel bacağı uzatır, omuz genişliği nasıl dengelenir
• Türk moda kültürü: Nişantaşı minimalizmi, Karaköy alternatif karışımı, İzmir rahat şıklığı
• Kapsül gardırop felsefesi: 10 parçayla 30 kombin kuralı, temel renk paleti
• Occasion dressing: sabah toplantısı vs akşam yemeği vs hafta sonu vs gece çıkışı
• Marka rehberi: Mavi'nin en iyi kesimi hangisi, Zara'da neye bakılır, LC Waikiki değeri${hasImage ? '\n• Kullanıcı fotoğraf gönderdi: görseli oku, kıyafet türü/renk/stil hakkında spesifik yorum yap, dolabından uyumlu parçaları göster' : ''}

KOMBİN TAMAMLAYICI KURALI — EN KRİTİK KURAL:
Kullanıcı bir parçayı sorarken "buna ne gider?" dediğinde, suggestedOutfitIds'e ASLA aynı kategoriden parça koyma.
Tamamlayıcı kategoriler:
• "Alt Giyim" soruldu → öner: Üst Giyim, Dış Giyim, Ayakkabı, Aksesuar — KESİNLİKLE başka Alt Giyim ekleme
• "Üst Giyim" soruldu → öner: Alt Giyim, Dış Giyim, Ayakkabı, Aksesuar — KESİNLİKLE başka Üst Giyim ekleme
• "Dış Giyim" soruldu → öner: Üst Giyim, Alt Giyim, Ayakkabı, Aksesuar — KESİNLİKLE başka Dış Giyim ekleme
• "Ayakkabı" soruldu → öner: Üst Giyim, Alt Giyim, Dış Giyim, Aksesuar — KESİNLİKLE başka Ayakkabı ekleme
• "Aksesuar" soruldu → öner: Üst Giyim, Alt Giyim, Ayakkabı, Dış Giyim — KESİNLİKLE başka Aksesuar ekleme
BU KURAL İHLAL EDİLEMEZ. "Alt giyime ne gider?" sorusuna alt giyim önermek komple yanlış bir öneridir.

NASIL KONUŞURSUN:
• Cesur ve kesin öner, neden işe yaradığını açıkla
• Eksikleri söyle ama yapıcı ol
• 2-4 cümle yaz, sıkıcı olma

MESAJ TÜRÜNE GÖRE DAVRAN:
• Selamlama/sohbet → samimi karşılık ver, suggestedOutfitIds BOŞ []
• Stil/kombin sorusu → dolabı analiz et, tamamlayıcı kategorilerden öner, ilgili parçaları suggestedOutfitIds'e ekle
• "Buna ne gider?" → sorulan parçanın KATEGORİSİNİ tespit et, o kategoriden HİÇ parça ekleme, sadece tamamlayıcı kategorilerden öner
• Genel soru → cevap ver, dolap SADECE bağlantılıysa dahil et

SADECE JSON formatında cevap ver:
{"message": "cevap buraya", "suggestedOutfitIds": ["SADECE-GERCEK-DOLAP-ID"]}

KRİTİK: suggestedOutfitIds'e YALNIZCA dolap listesindeki gerçek ID'leri yaz. Uydurma. Sohbet mesajlarında kesinlikle [] döndür.
KATEGORİ KURALI: Aynı kategoriden 2 parça asla önerme. Çeşitlilik şart — üst+alt+ayakkabı kombinasyonu ideal.`;

        // 3. Claude (Anthropic) — primary
        if (this.anthropic) {
            try {
                const userContent: any[] = [{ type: 'text', text: userMessage || 'Dolabımı analiz et ve bugün için bir kombin öner.' }];
                if (imageBase64) {
                    userContent.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } });
                }

                const anthropicHistory = (history || []).slice(-8).map(h => ({
                    role: h.role as 'user' | 'assistant',
                    content: h.content
                }));

                const response = await this.anthropic.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 700,
                    system: systemPrompt,
                    messages: [
                        ...anthropicHistory,
                        { role: 'user', content: imageBase64 ? userContent : (userMessage || 'Dolabımı analiz et.') }
                    ],
                });

                const raw = (response.content[0] as any).text || '';
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: raw, suggestedOutfitIds: [] };
                return { message: parsed.message, suggestedOutfitIds: parsed.suggestedOutfitIds || [] };
            } catch (error) {
                this.logger.error('Anthropic Chat Error:', error);
            }
        }

        // 4. OpenAI — fallback
        if (this.openai) {
            try {
                const userContent: any[] = [{ type: 'text', text: userMessage || 'Dolabımı analiz et.' }];
                if (imageBase64) {
                    userContent.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' } });
                }

                const isGroq = !!(process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY);
                const model = isGroq ? 'llama-3.3-70b-versatile' : (imageBase64 ? 'gpt-4o' : 'gpt-4o-mini');
                const msgContent = (imageBase64 && !isGroq) ? userContent : (userMessage || 'Dolabımı analiz et ve bugün için en iyi kombini öner.');

                // Build conversation history (last 8 messages for context)
                const historyMessages = (history || []).slice(-8).map(h => ({
                    role: h.role as 'user' | 'assistant',
                    content: h.content
                }));

                const completion = await this.openai.chat.completions.create({
                    model,
                    ...(isGroq ? {} : { response_format: { type: 'json_object' } }),
                    max_tokens: 700,
                    temperature: 0.85,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...historyMessages,
                        { role: 'user', content: msgContent as any }
                    ],
                });

                const raw = completion.choices[0].message.content || '';
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                const aiResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: raw, suggestedOutfitIds: [] };
                return { message: aiResponse.message, suggestedOutfitIds: aiResponse.suggestedOutfitIds || [] };
            } catch (error) {
                this.logger.error('OpenAI/Groq Chat Error:', error);
            }
        }

        // 5. No API key — informative mock
        if (wardrobeEmpty) {
            return { message: 'Gardırobu henüz boş. Birkaç parça ekleyince sana gerçek kombin önerileri yapabileceğim.', suggestedOutfitIds: [] };
        }
        const mockSuggested: string[] = [];
        const top = wardrobe.items.find(i => ['Üst Giyim', 'Dış Giyim'].includes(i.category));
        const bottom = wardrobe.items.find(i => i.category === 'Alt Giyim');
        const shoes = wardrobe.items.find(i => i.category === 'Ayakkabı');
        if (top) mockSuggested.push(top.id);
        if (bottom) mockSuggested.push(bottom.id);
        if (shoes) mockSuggested.push(shoes.id);
        return {
            message: 'Stil asistanı şu an aktif değil. ANTHROPIC_API_KEY veya OPENAI_API_KEY değerini .env dosyasına ekle.',
            suggestedOutfitIds: mockSuggested
        };
    }

    async analyzeGarmentImage(file: Express.Multer.File) {
        if (!this.openai) {
            // Mock Response for MVP without API Key
            this.logger.log('Mocking Image Analysis...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
            return { category: 'Üst Giyim', colors: ['Siyah'] };
        }

        try {
            const base64Image = file.buffer.toString('base64');
            const mimeType = file.mimetype || 'image/jpeg';

            const visionModel = this.isGroq ? 'llama-3.2-11b-vision-preview' : 'gpt-4o';
            this.logger.log(`Sending image to Vision API (${visionModel})...`);
            const response = await this.openai.chat.completions.create({
                model: visionModel,
                messages: [
                    {
                        role: "system",
                        content: "Sen bir dijital gardırop asistanısın. Gösterilen kıyafeti analiz et. Yalnızca şu kategorilerden birini seç: 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'. Renkler için YALNIZCA şu listeden seç: Siyah, Beyaz, Lacivert, Gri, Vizon, Bej, Camel, Kahverengi, Kırmızı, Bordo, Mavi, Yeşil, Sarı, Turuncu, Pembe, Mor. Yanıtın kesinlikle JSON olmalı. Örn: {\"category\": \"Üst Giyim\", \"colors\": [\"Camel\"]}"
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Bu kıyafeti analiz et ve JSON dön." },
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                        ]
                    }
                ],
                ...(this.isGroq ? {} : { response_format: { type: "json_object" as const } }),
            });

            const content = response.choices[0].message.content || "{}";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
            return result;
        } catch (error) {
            this.logger.error("Vision API Error", error);
            return { category: 'Üst Giyim', colors: ['Siyah'] };
        }
    }

    /**
     * AI Queue Integration - Offloads heavy 3D Generation to the worker
     */
    async generate3DModel(garmentId: string, imageUrl: string) {
        this.logger.log(`[Queue] Request to queue 3D generation for garment ${garmentId}`);
        
        if (!this.aiQueue) {
            this.logger.warn('Queue is not configured. Redis is unavailable; skipping background job.');
            return { success: false, message: 'Queue not configured. Install/start Redis to enable background jobs.' };
        }

        const jobData: Generate3DModelJob = { garmentId, imageUrl };
        const job = await this.aiQueue.add('generate-3d-model', jobData, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });

        return { success: true, jobId: job.id, message: '3D model generation queued' };
    }

    async generateAvatar(userId: string, selfieUrl: string, bodyPhotoUrl: string) {
        this.logger.log(`[Queue] Request to queue avatar synthesis for user ${userId}`);
        
        if (!this.avatarQueue) {
            this.logger.warn('Queue is not configured (avatarQueue). Background job skipped.');
            return { success: false, message: 'Queue not configured.' };
        }

        const jobData: GenerateAvatarJob = { userId, selfieUrl, bodyPhotoUrl };
        const job = await this.avatarQueue.add('synthesize-avatar', jobData, {
            attempts: 2,
            backoff: { type: 'exponential', delay: 10000 }
        });

        return { success: true, jobId: job.id, message: 'Avatar synthesis queued' };
    }

    async getJobStatus(jobId: string) {
        if (!this.aiQueue) {
            this.logger.warn('Queue is not configured. getJobStatus unavailable.');
            return { status: 'unavailable', message: 'Queue not configured.' };
        }

        const job = await this.aiQueue.getJob(jobId);
        if (!job) return { status: 'not_found' };

        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;

        return {
            id: job.id,
            status: state, // 'active', 'completed', 'failed', 'waiting', 'delayed'
            progress,
            result
        };
    }

    private async fetchCityWeather(city: string): Promise<{ temp: number; feelsLike: number; description: string; isRainy: boolean; windKmph: number }> {
        try {
            const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) } as any);
            if (!res.ok) throw new Error('wttr.in failed');
            const data = await res.json() as any;
            const c = data.current_condition[0];
            const desc: string = c.weatherDesc[0].value;
            return {
                temp: parseInt(c.temp_C),
                feelsLike: parseInt(c.FeelsLikeC),
                description: desc,
                isRainy: /rain|drizzle|snow|sleet|shower/i.test(desc),
                windKmph: parseInt(c.windspeedKmph),
            };
        } catch {
            const month = new Date().getMonth();
            const isWinter = month < 2 || month === 11;
            const isSummer = month >= 5 && month <= 8;
            return { temp: isWinter ? 6 : isSummer ? 28 : 16, feelsLike: isWinter ? 3 : isSummer ? 27 : 14, description: isWinter ? 'Soğuk ve bulutlu' : isSummer ? 'Güneşli' : 'Parçalı bulutlu', isRainy: false, windKmph: 10 };
        }
    }

    async generateOutfitFromList(items: any[], city: string, style: string, gender: string) {
        const weather = await this.fetchCityWeather(city);
        const needsOuterwear = weather.temp < 18 || weather.feelsLike < 15;
        const outerwearRule = weather.temp < 10
            ? `Dış giyim ZORUNLU — ${weather.temp}°C çok soğuk, kesinlikle ceket/mont giyin`
            : weather.temp < 18
                ? `Dış giyim ÖNERİLİR — ${weather.temp}°C serin, hafif ceket ideal`
                : weather.temp < 24
                    ? `Dış giyim OPSİYONEL — ${weather.temp}°C ılık, tercihe bırakılır`
                    : `Dış giyim GEREKSIZ — ${weather.temp}°C sıcak, üst giyim yeterli`;

        const fallbackResult = () => {
            const tops    = items.filter(i => i.category === 'Üst Giyim');
            const bottoms = items.filter(i => i.category === 'Alt Giyim');
            const shoes   = items.filter(i => i.category === 'Ayakkabı');
            const outer   = items.filter(i => i.category === 'Dış Giyim');
            const acc     = items.filter(i => i.category === 'Aksesuar');
            const pick = (arr: any[]) => arr.length ? arr[0] : null;
            const top  = pick(tops)    || items[0];
            const bot  = pick(bottoms) || items[1] || items[0];
            const shoe = pick(shoes)   || items[2] || items[0];
            const out  = needsOuterwear ? pick(outer) : null;
            const ac   = pick(acc);
            const selectedItems = [top, bot, shoe, out, ac].filter(Boolean);
            const uniqueItems = Array.from(new Map(selectedItems.map(i => [i.id, i])).values());
            const categoryMap: Record<string,string> = {};
            if (top)  categoryMap['üstGiyim']  = top.id;
            if (bot)  categoryMap['altGiyim']  = bot.id;
            if (shoe) categoryMap['ayakkabı']   = shoe.id;
            if (out)  categoryMap['dışGiyim']   = out.id;
            if (ac)   categoryMap['aksesuar']   = ac.id;
            return {
                outfitIds: uniqueItems.map(i => i.id),
                categoryMap,
                wearOuterwear: needsOuterwear,
                weather: { temp: weather.temp, feelsLike: weather.feelsLike, description: weather.description, isRainy: weather.isRainy },
                weatherNote: `${city} bugün ${weather.temp}°C — ${weather.description}`,
                explanation: `Dolabını analiz ettim. Bugün ${city}'da ${weather.temp}°C hava için seçtiğim bu parçalar ${style} aurasını mükemmel yansıtıyor.`,
            };
        };

        if (!this.openai) return fallbackResult();

        try {
            // Önce kullanıcı cinsiyetiyle uyumlu parçaları filtrele
            const genderFilteredItems = items.filter(i =>
                !i.gender || i.gender === 'Unisex' || i.gender === gender
            );
            const itemsToUse = genderFilteredItems.length >= 2 ? genderFilteredItems : items;

            const itemDescriptions = itemsToUse.map(i => {
                const colors  = Array.isArray(i.colors)  && i.colors.length  ? i.colors.join(', ')  : 'renk belirtilmemiş';
                const seasons = Array.isArray(i.seasons) && i.seasons.length ? i.seasons.join(', ') : 'tüm mevsim';
                return `ID:${i.id} | ${i.category} | ${i.brand || '?'} | Renk: ${colors} | Mevsim: ${seasons} | Cinsiyet: ${i.gender || 'Unisex'}`;
            }).join('\n');

            const systemPrompt = `Sen dünyanın en iyi kişisel moda stilistisin. Kullanıcının gardırobundan BUGÜNE ÖZEL, HAVA DURUMUNA GÖRE mükemmel bir kategori bazlı kombin seç.

KULLANICI:
- Cinsiyet: ${gender}
- Şehir: ${city}
- Stil teması: ${style}

BUGÜNKÜ HAVA DURUMU - ${city}:
- Sıcaklık: ${weather.temp}°C (hissedilen: ${weather.feelsLike}°C)
- Durum: ${weather.description}
- Rüzgar: ${weather.windKmph} km/h
- Yağış: ${weather.isRainy ? 'VAR' : 'Yok'}
- Dış giyim kararı: ${outerwearRule}

GARDIROPTAKİ PARÇALAR:
${itemDescriptions}

KOMBİN KURALLARIN:
1. CİNSİYET — EN ÖNEMLİ KURAL: Kullanıcı ${gender}.
${gender === 'Erkek' ? '   → ERKEK modu: jean, chino, düz pantolon, polo, gömlek, tişört, sweatshirt, ceket, mont, bot/sneaker/oxford seç. Etek, palazzo pantolon, kadın bluzu, elbise, crop top KESİNLİKLE YASAK.' : gender === 'Kadın' ? '   → KADIN modu: etek, elbise, kadın bluz, kadın pantolon, crop üst, kadın blazer seç.' : '   → UNİSEX: Her iki cinsiyete uygun parçalar seç.'}
   Cinsiyet etiketi "Unisex" olan parça bile görsel kesimi erkek/kadına özel ise cinsiyete göre değerlendir.
2. HAVA DURUMU: Sıcaklığa göre dış giyim kararını uygula. ${needsOuterwear ? 'Dış Giyim EKLE.' : 'Dış Giyim ekleme.'}
3. RENK UYUMU: Analog (bej+krem+kahve), tamamlayıcı (lacivert+bej, haki+beyaz), monokromatik. Çakışan parlak renklerden kaçın.
4. KATEGORİ DENGESİ: Her kategoriden EN FAZLA 1 parça. Üst+Alt+Ayakkabı temel üçlüdür.
5. STİL TUTARLIĞI: "${style}" temasına uygun, casual/formal karışımı olmayan bir bütün.

AÇIKLAMA: Seçtiğin kombinin neden renk, doku ve stil açısından birbirini tamamladığını — ve ${city}'daki bugünkü ${weather.temp}°C havayla ${style} aurasıyla nasıl örtüştüğünü — 2 cümlede özgüvenli ve spesifik anlat.

SADECE GEÇERLİ ITEM ID'LERİ KULLAN. Listedeki olmayan ID verme.

SADECE JSON dön:
{
  "outfit": {
    "üstGiyim": "exact_id_from_list or null",
    "altGiyim": "exact_id_from_list or null",
    "dışGiyim": "exact_id_from_list or null",
    "aksesuar": "exact_id_from_list or null",
    "ayakkabı": "exact_id_from_list or null"
  },
  "wearOuterwear": true_or_false,
  "explanation": "2 cümle açıklama"
}`;

            const model = this.isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
            const response = await this.openai.chat.completions.create({
                model,
                messages: [{ role: 'user', content: systemPrompt }],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            });

            const raw = JSON.parse(response.choices[0].message.content || '{}');
            const outfit: Record<string,string> = raw.outfit || {};

            // Validate every ID exists in items list
            const validId = (id: any) => typeof id === 'string' && itemsToUse.some(i => i.id === id);
            const categoryMap: Record<string, string> = {};
            if (validId(outfit.üstGiyim))  categoryMap['üstGiyim']  = outfit.üstGiyim;
            if (validId(outfit.altGiyim))  categoryMap['altGiyim']  = outfit.altGiyim;
            if (validId(outfit.ayakkabı))  categoryMap['ayakkabı']  = outfit.ayakkabı;
            if (validId(outfit.dışGiyim))  categoryMap['dışGiyim']  = outfit.dışGiyim;
            if (validId(outfit.aksesuar))  categoryMap['aksesuar']  = outfit.aksesuar;

            const outfitIds = Object.values(categoryMap);
            if (outfitIds.length === 0) return fallbackResult();

            // Pad to 3 unique items if needed (for collage display)
            const usedIds = new Set(outfitIds);
            const extras = items.filter(i => !usedIds.has(i.id));
            const allIds = [...outfitIds, ...extras.map(i => i.id)].slice(0, 3);

            return {
                outfitIds: allIds,
                categoryMap,
                wearOuterwear: raw.wearOuterwear ?? needsOuterwear,
                weather: { temp: weather.temp, feelsLike: weather.feelsLike, description: weather.description, isRainy: weather.isRainy },
                weatherNote: `${city} bugün ${weather.temp}°C — ${weather.description}`,
                explanation: raw.explanation || 'Kusursuz bir kombin.',
            };
        } catch (error) {
            this.logger.error('Generate Outfit Error', error);
            return fallbackResult();
        }
    }

    async getEditorialResponse(userId: string) {
        const weather = this.getMockWeather();
        const wardrobe = await this.prisma.wardrobe.findUnique({
            where: { userId },
            include: { items: { include: { photos: true } } }
        });

        const hasItems = wardrobe?.items && wardrobe.items.length > 0;
        const wardrobeSummary = hasItems 
            ? wardrobe.items.map(i => `${i.category} (${i.brand})`).join(', ') 
            : 'Şu an boş';
        
        if (!hasItems) {
            return {
                headline: "Yeni Bir Başlangıç: Arşivini Oluştur",
                article: "Dijital gardırobun şu an keşfedilmeyi bekleyen boş bir sayfa gibi. İlk parçanı ekleyerek kişisel stil analizini başlatabilirsin.",
                suggestedCategory: 'Genel'
            };
        }

        const systemPrompt = `
            Sen elit bir moda editörüsün. Kullanıcının gardırobuna ve şu anki moda başkentlerindeki hava durumuna göre 
            günlük bir "Style Briefing" (Stil Özeti) hazırla. 
            Moda başkenti: ${weather.city}, Hava: ${weather.condition}, Sıcaklık: ${weather.temp}°C.
            Gardırop Özeti: ${wardrobeSummary}
            Ses tonu: İlham verici, sofistike, elit.
            JSON formatında dön: {"headline": "...", "article": "...", "suggestedCategory": "...", "recommendations": [{"focus": "...", "description": "..."}]}
            (En fazla 3 adet recommendation ekle)
        `;

        if (this.openai) {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                    messages: [{ role: "system", content: systemPrompt }],
                });
                return JSON.parse(completion.choices[0].message.content || '{}');
            } catch (e) {
                this.logger.error('Editorial AI Error', e);
            }
        }

        // Sophisticated, personalized fallback logic if OpenAI is not configured
        const brandsArray = Array.from(new Set(wardrobe.items.filter(i => i.brand).map(i => i.brand)));
        const brandsStr = brandsArray.slice(0, 2).join(' ve ');
        const topItem = wardrobe.items.find((i: any) => i.category.includes('Giyim'));
        const brandHighlight = topItem?.brand ? topItem.brand + " imzasını taşıyan parçanla" : "seçkin parçalarınla";

        let fallbackArticle = '';
        if (weather.city === 'Milano') {
            fallbackArticle = `Milano'nun podyum havası sokaklara taşmışken, arşivindeki ${wardrobe.items.length} benzersiz lüks tasarım ile şehrin avangart ruhuna uyum sağlama zamanı. Özellikle ${brandHighlight} bu ${weather.temp} derecelik ${weather.condition.toLowerCase()} havada neo-klasik ve elit bir silüet çizebilirsin.`;
        } else if (weather.city === 'Paris') {
            fallbackArticle = `Parisien şıklık, ${weather.condition.toLowerCase()} bir günde en güçlü silaha dönüşür. Dolabındaki ${brandsStr ? brandsStr + ' gibi ' : ''}kült detayları katmanlayarak, ${weather.temp} derecenin serinliğinde eforsuz ama son derece vurucu bir profil yaratabilirsin.`;
        } else if (weather.city === 'Londra') {
            fallbackArticle = `Londra'nın aristokrat ve isyankar tavrı bugün sokaklarda hissediliyor. ${weather.condition.toLowerCase()} esinti, tam da "layering" (katmanlı giyim) sanatı için ideal. Arşivindeki ${wardrobe.items.length} parça ile İngiliz tarzına modern bir lüks yorumu katabilirsin.`;
        } else {
            fallbackArticle = `New York'un bitmez tükenmez ritmine ${weather.condition.toLowerCase()} bir gökyüzü eşlik ediyor. ${brandHighlight} yaratacağın cesur bir kontrast, metropol kalabalığı içinde gerçek bir 'statement' (lüks duruş) sergilemeni sağlayacak.`;
        }

        // Pick 3 items for the mock outfit suggestion
        const suggestedItems: { id: string; imageUrl: string }[] = [];
        if (hasItems) {
            const shuffled = [...wardrobe.items].sort(() => 0.5 - Math.random());
            shuffled.slice(0, 3).forEach(i => {
                const photoUrl = i.photos?.[0]?.url || '';
                suggestedItems.push({ id: i.id, imageUrl: photoUrl });
            });
        }

        // Create mock recommendations for the UI
        const mockRecommendations = [
            { focus: "Katmanlı Giyim", description: "Farklı dokuları bir araya getirerek derinlik yaratın." },
            { focus: "Kontrast Renkler", description: "Beklenmedik renk eşleşmeleriyle cesur bir duruş sergileyin." },
            { focus: "Aksesuar Vurgusu", description: "Minimal bir kombini güçlü aksesuarlarla ön plana çıkarın." }
        ];

        return {
            headline: `${weather.city} Ruhu: ${weather.condition.split(' ')[0]} Elegance`,
            article: fallbackArticle,
            suggestedCategory: 'Dış Giyim',
            suggestedItems,
            recommendations: mockRecommendations,
            weather: { city: weather.city, condition: weather.condition, temp: weather.temp }
        };
    }

    private buildTryOnPrompt(category: string, colors: string[], brand?: string): { prompt: string; negative: string } {
        const colorStr = colors.length ? colors.join(', ') : 'neutral colored';
        const brandStr = brand ? `${brand} ` : '';
        const negative = 'Deformed, blurry, low resolution, unnatural skin tones, mismatched lighting, distorted garment texture, cartoonish, watermark, messy edges, extra limbs, duplicate body parts, text overlays, logos.';

        let prompt: string;
        switch (category) {
            case 'Üst Giyim':
                prompt = `A professional studio fashion photograph of a stylish model wearing a ${colorStr} ${brandStr}shirt or top. Realistic fabric draping on the torso, natural collar and neckline alignment, soft natural lighting from the side, high-fidelity texture detail, clean studio background, fashion photography style, 4k resolution, editorial quality. Photorealistic.`;
                break;
            case 'Dış Giyim':
                prompt = `A fashion lookbook photograph of an elegant model wearing a ${colorStr} ${brandStr}jacket or coat as outer layer. Realistic shoulder fitting, detailed button and zipper textures, consistent fabric weight and drape, natural outdoor or studio lighting, photorealistic, high fashion editorial style, 4k resolution.`;
                break;
            case 'Alt Giyim':
                prompt = `A full body fashion editorial photograph of a model wearing ${colorStr} ${brandStr}trousers or pants. Natural leg silhouettes, realistic fabric folds at the knees and hips, clean studio lighting, sharp and high-definition detail, fashion photography style, 4k resolution.`;
                break;
            case 'Ayakkabı':
                prompt = `A high-quality lifestyle and product photograph of a model wearing ${colorStr} ${brandStr}shoes. Sharp detail on sole, stitching and material texture, natural light reflecting off the surface, minimal clean background, fashion photography style, 4k resolution.`;
                break;
            case 'Aksesuar':
                prompt = `A styled editorial photograph featuring a ${colorStr} ${brandStr}accessory on a model. Detailed material texture, natural soft lighting, high fashion styling, minimal clean background, 4k resolution, photorealistic.`;
                break;
            default:
                prompt = `High-quality fashion editorial photograph of a model wearing a ${colorStr} ${brandStr}garment. Realistic fabric draping, natural lighting, highly detailed texture, 4k resolution, fashion photography style, seamless and professional. Photorealistic.`;
        }

        return { prompt, negative };
    }

    async virtualTryOn(userId: string, input: {
        personImageUrl: string;
        garmentImageUrl: string;
        category?: string;
        brand?: string;
    }) {
        const category = input.category || 'Üst Giyim';
        const garmentDesc = `${input.brand ? input.brand + ' ' : ''}${category}`;

        // ── fashn.ai (primary — best body-shape preservation) ────────────
        if (process.env.FASHN_API_KEY?.trim()) {
            try {
                this.logger.log(`[Try-On] Calling fashn.ai for user ${userId}`);
                const result = await this.runFashnTryOn(input.personImageUrl, input.garmentImageUrl, category);
                if (result) return { imageUrl: result, mock: false, model: 'fashn.ai' };
            } catch (error: any) {
                this.logger.warn(`[Try-On] fashn.ai failed: ${error?.message} — trying fal.ai`);
            }
        }

        // ── fal.ai CatVTON (secondary) ────────────────────────────────────
        if (process.env.FAL_KEY) {
            try {
                this.logger.log(`[Try-On] Calling fal.ai CatVTON for user ${userId}`);
                const result = await this.runFalTryOn(input.personImageUrl, input.garmentImageUrl, category);
                if (result) return { imageUrl: result, mock: false, model: 'CatVTON' };
            } catch (error: any) {
                this.logger.warn(`[Try-On] fal.ai failed: ${error?.message} — trying Kling`);
            }
        }

        // ── Kling AI Kolors (tertiary — needs paid credits) ───────────────
        if (process.env.KLING_API_KEY?.trim() && process.env.KLING_SECRET_KEY?.trim()) {
            try {
                this.logger.log(`[Try-On] Calling Kling AI Kolors for user ${userId}`);
                const result = await this.runKlingTryOn(input.personImageUrl, input.garmentImageUrl);
                if (result) return { imageUrl: result, mock: false, model: 'Kling AI' };
            } catch (error: any) {
                this.logger.warn(`[Try-On] Kling failed: ${error?.message} — trying HuggingFace`);
            }
        }

        // ── OOTDiffusion (secondary HF — better body shape) ──────────────
        try {
            this.logger.log(`[Try-On] Calling OOTDiffusion for user ${userId}`);
            const result = await this.runOOTDTryOn(input.personImageUrl, input.garmentImageUrl, category);
            if (result) return { imageUrl: result, mock: false, model: 'OOTDiffusion' };
        } catch (error: any) {
            this.logger.warn(`[Try-On] OOTDiffusion failed: ${error?.message} — trying IDM-VTON`);
        }

        // ── HuggingFace IDM-VTON (fallback) ───────────────────────────────
        try {
            this.logger.log(`[Try-On] Calling HuggingFace Virtual-Try-On for user ${userId}`);
            const result = await this.runHuggingFaceTryOn(input.personImageUrl, input.garmentImageUrl, garmentDesc);
            if (result) return { imageUrl: result, mock: false, model: 'IDM-VTON' };
        } catch (error: any) {
            this.logger.warn('HuggingFace Try-On failed, trying Replicate:', error?.message);
        }

        // ── Replicate IDM-VTON (paid fallback) ────────────────────────────
        if (this.replicate) {
            try {
                this.logger.log(`[Try-On] Running IDM-VTON via Replicate for user ${userId}`);
                const output = await this.replicate.run(
                    'cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f' as any,
                    {
                        input: {
                            human_img: input.personImageUrl,
                            garm_img: input.garmentImageUrl,
                            garment_des: garmentDesc,
                            is_checked: true,
                            is_checked_crop: false,
                            denoise_steps: 30,
                            seed: 42,
                        }
                    }
                ) as any;
                const imageUrl = Array.isArray(output) ? output[0] : (output?.output?.[0] ?? output);
                return { imageUrl, mock: false, model: 'IDM-VTON' };
            } catch (error: any) {
                this.logger.error('Replicate Try-On Error:', error?.message);
                return { imageUrl: null, error: 'Try-On modeli çalıştırılamadı: ' + error?.message, mock: false };
            }
        }

        // ── DALL-E 3 fallback (no Replicate token) ────────────────────────
        if (this.openai) {
            const { prompt, negative } = this.buildTryOnPrompt(category, [], input.brand);
            try {
                this.logger.log(`[Try-On] Falling back to DALL-E 3 for category: ${category}`);
                const response = await this.openai.images.generate({
                    model: 'dall-e-3',
                    prompt: `${prompt} Avoid: ${negative}`,
                    size: '1024x1792',
                    quality: 'hd',
                    n: 1,
                });
                return { imageUrl: response.data?.[0]?.url ?? null, mock: false, model: 'DALL-E 3' };
            } catch (error: any) {
                this.logger.error('DALL-E Try-On Error:', error?.message);
                return { imageUrl: null, error: 'Görsel oluşturulamadı.', mock: false };
            }
        }

        // ── Demo mode (no tokens) ─────────────────────────────────────────
        return {
            imageUrl: null,
            mock: true,
            error: 'API anahtarı bulunamadı. .env dosyasına REPLICATE_API_TOKEN ekleyin.',
        };
    }

    private async runFashnTryOn(personImageUrl: string, garmentImageUrl: string, category: string): Promise<string | null> {
        const apiKey = process.env.FASHN_API_KEY?.trim();
        if (!apiKey) throw new Error('FASHN_API_KEY not set');

        // fashn.ai needs public URLs or base64. Localhost URLs must be converted to base64.
        const prepareImage = async (url: string): Promise<string> => {
            if (url.startsWith('data:')) return url;
            // Public external URL — pass directly
            if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('localhost') && !url.includes('127.0.0.1')) {
                return url;
            }
            // Local path (/static/...) or localhost URL — fetch and convert to base64
            const fullUrl = url.startsWith('/')
                ? `http://localhost:${process.env.PORT || 3000}${url}`
                : url;
            const res = await globalThis.fetch(fullUrl);
            if (!res.ok) throw new Error(`Failed to fetch local image: ${res.status} ${fullUrl}`);
            const buf = Buffer.from(await res.arrayBuffer());
            const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
            return `data:${mime};base64,${buf.toString('base64')}`;
        };

        const fashnCategory = category === 'Alt Giyim' ? 'bottoms' : 'tops';

        const [modelImage, garmentImage] = await Promise.all([
            prepareImage(personImageUrl),
            prepareImage(garmentImageUrl),
        ]);

        this.logger.log(`[Fashn] Creating try-on prediction (category: ${fashnCategory})...`);
        const runRes = await globalThis.fetch('https://api.fashn.ai/v1/run', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model_name: 'tryon-v1.6',
                inputs: {
                    model_image: modelImage,
                    garment_image: garmentImage,
                    category: fashnCategory,
                },
            }),
        });

        if (!runRes.ok) throw new Error(`fashn.ai run failed: ${runRes.status} ${await runRes.text()}`);
        const { id } = await runRes.json() as any;
        if (!id) throw new Error('No prediction ID from fashn.ai');
        this.logger.log(`[Fashn] Prediction ${id} — polling...`);

        // Poll every 3s, max 3 min
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await globalThis.fetch(`https://api.fashn.ai/v1/status/${id}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            if (!statusRes.ok) continue;
            const { status, output, error } = await statusRes.json() as any;
            this.logger.log(`[Fashn] status: ${status} | output: ${JSON.stringify(output)}`);
            if (status === 'completed') {
                const url = Array.isArray(output) ? output[0] : (output?.url ?? output);
                if (url && typeof url === 'string') return url;
                throw new Error(`fashn.ai completed but no URL. output=${JSON.stringify(output)}`);
            }
            if (status === 'failed') throw new Error(`fashn.ai failed: ${JSON.stringify(error)}`);
        }
        throw new Error('fashn.ai timed out');
    }

    private generateKlingJWT(apiKey: string, secretKey: string): string {
        const crypto = require('crypto') as typeof import('crypto');
        const now = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ iss: apiKey, exp: now + 1800, nbf: now - 5 })).toString('base64url');
        const sig = crypto.createHmac('sha256', secretKey).update(`${header}.${payload}`).digest('base64url');
        return `${header}.${payload}.${sig}`;
    }

    private async runKlingTryOn(personImageUrl: string, garmentImageUrl: string): Promise<string | null> {
        const apiKey = process.env.KLING_API_KEY?.trim();
        const secretKey = process.env.KLING_SECRET_KEY?.trim();
        if (!apiKey || !secretKey) throw new Error('KLING_API_KEY/KLING_SECRET_KEY not set');

        const toBase64 = async (url: string): Promise<string> => {
            if (url.startsWith('data:')) return url.split(',')[1];
            const res = await globalThis.fetch(url);
            return Buffer.from(await res.arrayBuffer()).toString('base64');
        };

        const [humanBase64, clothBase64] = await Promise.all([
            toBase64(personImageUrl),
            toBase64(garmentImageUrl),
        ]);

        // Create task
        this.logger.log('[Kling] Creating virtual try-on task...');
        const createRes = await globalThis.fetch(
            'https://api-singapore.klingai.com/v1/images/kolors-virtual-try-on',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.generateKlingJWT(apiKey, secretKey)}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model_name: 'kolors-virtual-try-on-v1-5',
                    human_image: humanBase64,
                    cloth_image: clothBase64,
                }),
            }
        );
        if (!createRes.ok) throw new Error(`Kling create failed: ${createRes.status} ${await createRes.text()}`);

        const { data } = await createRes.json() as any;
        const taskId = data?.task_id;
        if (!taskId) throw new Error('No task_id from Kling');
        this.logger.log(`[Kling] Task ${taskId} — polling...`);

        // Poll every 8s, max 5 min
        for (let i = 0; i < 37; i++) {
            await new Promise(r => setTimeout(r, 8000));
            const pollRes = await globalThis.fetch(
                `https://api-singapore.klingai.com/v1/images/kolors-virtual-try-on/${taskId}`,
                { headers: { 'Authorization': `Bearer ${this.generateKlingJWT(apiKey, secretKey)}` } }
            );
            if (!pollRes.ok) continue;
            const { data: pd } = await pollRes.json() as any;
            this.logger.log(`[Kling] status: ${pd?.task_status}`);
            if (pd?.task_status === 'succeed') {
                const url = pd?.task_result?.images?.[0]?.url;
                if (url) return url;
                throw new Error('No image URL in Kling result');
            }
            if (pd?.task_status === 'fail') throw new Error(`Kling task failed: ${pd?.task_status_msg}`);
        }
        throw new Error('Kling try-on timed out');
    }

    private async runOOTDTryOn(personImageUrl: string, garmentImageUrl: string, category: string): Promise<string | null> {
        const { Client } = await import('@gradio/client');

        const toBlob = async (url: string): Promise<Blob> => {
            if (url.startsWith('data:')) {
                const [header, b64] = url.split(',');
                const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
                return new Blob([Buffer.from(b64, 'base64')], { type: mime });
            }
            const res = await globalThis.fetch(url);
            return res.blob();
        };

        const [personBlob, garmentBlob] = await Promise.all([
            toBlob(personImageUrl),
            toBlob(garmentImageUrl),
        ]);

        const clothType = category === 'Alt Giyim' ? 'Lower-body'
            : (category === 'Dış Giyim') ? 'Upper-body'
            : 'Upper-body';

        const hfToken = process.env.HF_TOKEN;
        this.logger.log(`[OOTDiff] Connecting${hfToken ? ' with HF token' : ' anonymous'}...`);
        const client = await this.withTimeout(
            Client.connect('levihsu/OOTDiffusion', {
                ...(hfToken ? { token: hfToken } : {}),
                status_callback: (s: any) => this.logger.log(`[OOTDiff] status: ${s?.status}`),
            } as any) as Promise<any>,
            30000, 'OOTDiff connect'
        );

        const result = await this.withTimeout(
            client.predict('/process_dc', {
                vton_img: personBlob,
                garm_img: garmentBlob,
                category: clothType,
                n_samples: 1,
                n_steps: 20,
                image_scale: 2,
                seed: -1,
            }) as Promise<any>,
            150000, 'OOTDiffusion predict'
        );

        this.logger.log('[OOTDiff] Raw result: ' + JSON.stringify(result).substring(0, 600));
        const data = result?.data;
        // OOTDiffusion returns Gallery: data[0] = array of {url, caption} or data[0][0]
        const gallery = Array.isArray(data) ? data[0] : data;
        const firstItem = Array.isArray(gallery) ? gallery[0] : gallery;
        const url = firstItem?.url ?? firstItem?.path ?? firstItem?.image?.url
            ?? (typeof firstItem === 'string' ? firstItem : null);
        if (url) return url;
        throw new Error('No URL in OOTDiffusion response');
    }

    private async runFalTryOn(personImageUrl: string, garmentImageUrl: string, category: string): Promise<string | null> {
        const { fal } = await import('@fal-ai/client');
        fal.config({ credentials: process.env.FAL_KEY });

        const toBlob = async (url: string): Promise<Blob> => {
            if (url.startsWith('data:')) {
                const [header, b64] = url.split(',');
                const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
                return new Blob([Uint8Array.from(Buffer.from(b64, 'base64'))], { type: mime });
            }
            const res = await globalThis.fetch(url);
            return res.blob();
        };

        this.logger.log('[Fal] Uploading images...');
        const [personBlob, garmentBlob] = await Promise.all([
            toBlob(personImageUrl),
            toBlob(garmentImageUrl),
        ]);

        const [personUrl, garmentUrl] = await Promise.all([
            fal.storage.upload(new File([personBlob], 'person.jpg', { type: 'image/jpeg' })),
            fal.storage.upload(new File([garmentBlob], 'garment.jpg', { type: 'image/jpeg' })),
        ]);

        const clothType = category === 'Alt Giyim' ? 'lower' : 'upper';

        this.logger.log(`[Fal] Running CatVTON (cloth_type: ${clothType})...`);
        const result = await this.withTimeout(
            fal.subscribe('fal-ai/cat-vton', {
                input: {
                    human_image_url: personUrl,
                    garment_image_url: garmentUrl,
                    cloth_type: clothType,
                    num_inference_steps: 30,
                    guidance_scale: 2.5,
                },
            }) as Promise<any>,
            120000, 'fal.ai CatVTON'
        );

        this.logger.log('[Fal] CatVTON result received');
        const data = (result as any)?.data ?? result;
        const imageUrl = data?.image?.url ?? data?.images?.[0]?.url;
        if (imageUrl) return imageUrl;
        throw new Error('No image URL in fal.ai response');
    }

    private withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
        return Promise.race([
            promise,
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
            ),
        ]);
    }

    private async runHuggingFaceTryOn(personImageUrl: string, garmentImageUrl: string, garmentDesc: string): Promise<string | null> {
        const { Client } = await import('@gradio/client');

        const toBlob = async (url: string): Promise<Blob> => {
            if (url.startsWith('data:')) {
                const [header, b64] = url.split(',');
                const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
                const buf = Buffer.from(b64, 'base64');
                return new Blob([buf], { type: mime });
            }
            const res = await globalThis.fetch(url);
            return res.blob();
        };

        const [rawPersonBlob, garmentBlob] = await Promise.all([
            toBlob(personImageUrl),
            toBlob(garmentImageUrl),
        ]);

        // ── CatVTON P2P: Mask-free, better arm/body shape (ICLR 2025) ───
        try {
            this.logger.log('[Try-On] Trying CatVTON P2P (anonymous — bypasses per-user quota)...');
            const catvtonClient = await this.withTimeout(
                Client.connect('zhengchong/CatVTON', {
                    status_callback: (s: any) => {
                        this.logger.log(`[CatVTON] status: ${s?.status ?? JSON.stringify(s)}`);
                    },
                } as any) as Promise<any>,
                30000, 'CatVTON connect'
            ) as any;

            const catvtonResult = await this.withTimeout(
                catvtonClient.predict('/submit_function_p2p', {
                    person_image: { background: rawPersonBlob, layers: [], composite: null },
                    cloth_image: garmentBlob,
                    num_inference_steps: 50,
                    guidance_scale: 2.5,
                    seed: 42,
                }) as Promise<any>,
                120000, 'CatVTON P2P predict'
            );

            const catvtonData = catvtonResult?.data;
            const catvtonFirst = Array.isArray(catvtonData) ? catvtonData[0] : catvtonData;
            const catvtonUrl = catvtonFirst?.url ?? catvtonFirst?.path ?? (typeof catvtonFirst === 'string' ? catvtonFirst : null);
            if (catvtonUrl) {
                this.logger.log('[Try-On] CatVTON P2P success!');
                return catvtonUrl;
            }
        } catch (err: any) {
            this.logger.warn(`[Try-On] CatVTON P2P unavailable (${err?.message}) — falling back to IDM-VTON`);
        }

        // ── IDM-VTON fallback: use HF token for higher quota ────────────
        const idmToken = process.env.HF_TOKEN;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                this.logger.log(`[Try-On] Connecting to IDM-VTON ${idmToken ? '(HF token)' : 'anonymous'} (attempt ${attempt}/2)...`);
                const client = await Client.connect('yisol/IDM-VTON', {
                    ...(idmToken ? { token: idmToken } : {}),
                    status_callback: (s: any) => {
                        this.logger.log(`[IDM-VTON] status: ${s?.status ?? JSON.stringify(s)}`);
                    },
                } as any);

                const result = await this.withTimeout(
                    client.predict('/tryon', {
                        dict: { background: rawPersonBlob, layers: [], composite: null },
                        garm_img: garmentBlob,
                        garment_des: garmentDesc,
                        is_checked: true,
                        is_checked_crop: false,
                        denoise_steps: 40,
                        seed: 42,
                    }) as Promise<any>,
                    180000, 'IDM-VTON predict'
                );

                this.logger.log('[Try-On] IDM-VTON result received');
                const data = result?.data;
                const first = Array.isArray(data) ? data[0] : data;
                if (!first) throw new Error('Empty response');

                const url = first?.url ?? first?.path ?? (typeof first === 'string' ? first : null);
                if (url) return url;
                throw new Error('No URL in response');
            } catch (err: any) {
                this.logger.warn(`[Try-On] IDM-VTON attempt ${attempt} failed: ${err?.message}`);
                if (attempt < 2) await new Promise(r => setTimeout(r, 15000));
            }
        }

        throw new Error('All HuggingFace spaces failed');
    }

    private getMockWeather() {
        const cities = [
            { city: 'Milano', temp: 18, condition: 'Parçalı Bulutlu' },
            { city: 'Paris', temp: 14, condition: 'Hafif Yağmurlu' },
            { city: 'Londra', temp: 11, condition: 'Sisli' },
            { city: 'New York', temp: 22, condition: 'Güneşli' }
        ];
        return cities[Math.floor(Math.random() * cities.length)];
    }
}
