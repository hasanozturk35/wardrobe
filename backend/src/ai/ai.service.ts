import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Generate3DModelJob, GenerateAvatarJob } from './dto/ai-jobs.dto';
import OpenAI from 'openai';
import Replicate from 'replicate';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI | null = null;
    private replicate: Replicate | null = null;

    constructor(
        private readonly prisma: PrismaService,
        @Optional() @InjectQueue('ai-tasks') private readonly aiQueue: Queue,
        @Optional() @InjectQueue('avatar-tasks') private readonly avatarQueue: Queue
    ) {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
        } else {
            this.logger.warn('OPENAI_API_KEY is missing! AI Stylist will run in mock mode.');
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

    async getStylistResponse(userId: string, userMessage: string) {
        // 1. Get user's wardrobe context
        const wardrobe = await this.prisma.wardrobe.findUnique({
            where: { userId },
            include: {
                items: {
                    include: { photos: true }
                }
            }
        });

        if (!wardrobe || !wardrobe.items.length) {
            return {
                message: "Gardırobun henüz boş görünüyor. Kombin önerebilmem ve sana üzerindeki parçaları doğrudan giydirebilmem (Try-On) için önce birkaç kıyafet eklemelisin! 👗✨",
                suggestedOutfitIds: []
            };
        }

        // 2. Prepare context for AI
        const wardrobeSummary = wardrobe.items.map(item =>
            `- ${item.category} (Marka: ${item.brand || 'Bilinmeyen'}), Renk: ${item.colors.join(', ')}, Mevsim: ${item.seasons.join(', ')}`
        ).join('\n');

        const systemPrompt = `
Sen profesyonel, elit bir moda stilisti ve "Personal Shopper" (Kişisel Alışveriş Danışmanı) asistanısın. Kullanıcının gardırobundaki gerçek parçalara dayanarak yaratıcı ve şık tavsiyeler verirsin. 

Kullanıcının gardırobu aşağıdadır:
${wardrobeSummary}

Kritik Görevlerin:
1. SADECE yukarıdaki gardıropta bulunan parçaların ID'lerini kullanarak kombin öner (suggestedOutfitIds).
2. "Personal Shopper" modu: Kullanıcının gardırobundaki eksikleri analiz et (örn: çok fazla üstü var ama hiç uygun altı yoksa) ve stilini tamamlayacak "Eksik Parça" önerilerinde bulun. Bu öneriler gardıropta bulunmayan ama kullanıcının alması gereken parçalar olmalı.
3. Tonun cesaretlendirici, sofistike, elit ve vizyoner olmalı. 
4. YANITINI MUTLAKA JSON FORMATINDA DÖNMELİSİN.

JSON formatı şu şekilde olmalıdır:
{
  "message": "Kullanıcıya gösterilecek stilist mesajı ve alışveriş önerileri...",
  "suggestedOutfitIds": ["mevcut-gardiroptan-kıyafet-id-1", "..."]
}
`;

        // 3. AI Connection
        if (this.openai) {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                });

                const aiResponse = JSON.parse(completion.choices[0].message.content || '{"message": "Bir sorun oluştu.", "suggestedOutfitIds": []}');
                return {
                    message: aiResponse.message,
                    suggestedOutfitIds: aiResponse.suggestedOutfitIds || []
                };
            } catch (error) {
                this.logger.error('OpenAI Error:', error);
                return {
                    message: "Üzgünüm, şu an bağlantıda bir sorun yaşıyorum ama gardırobunu analiz ettim! Birazdan tekrar deneyelim mi?",
                    suggestedOutfitIds: []
                };
            }
        }

        // Fallback to Mock Response if no API Key
        const mockSuggested: string[] = [];
        const top = wardrobe.items.find(i => ['Üst Giyim', 'Dış Giyim'].includes(i.category));
        const bottom = wardrobe.items.find(i => ['Alt Giyim'].includes(i.category));
        const shoes = wardrobe.items.find(i => ['Ayakkabı'].includes(i.category));
        if (top) mockSuggested.push(top.id);
        if (bottom) mockSuggested.push(bottom.id);
        if (shoes) mockSuggested.push(shoes.id);

        const fallbackMessage = `[STİLİST MODU] Harika bir kombin uydurdum! Gardırobundan ${mockSuggested.length} parçayı bir araya getirdim. Aşağıdaki "Hemen Dene" butonuyla avatarında deneyebilirsin. 😉✨`;
        return {
            message: fallbackMessage,
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

            this.logger.log('Sending image to OpenAI Vision...');
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Sen bir dijital gardırop asistanısın. Gösterilen kıyafeti analiz et. Yalnızca şu kategorilerden birini seç: 'Üst Giyim', 'Alt Giyim', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'. Renkleri Türkçe dizi (array) olarak belirt. Yanıtın kesinlikle JSON olmalı. Örn: {\"category\": \"Üst Giyim\", \"colors\": [\"Siyah\", \"Beyaz\"]}"
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Bu kıyafeti analiz et ve JSON dön." },
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content || "{}");
            return result;
        } catch (error) {
            this.logger.error("Vision API Error", error);
            // Fallback to mock on error to maintain UX
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

    async generateOutfitFromList(items: any[], city: string, style: string, gender: string) {
        if (!this.openai) {
            return { 
                outfitIds: items.slice(0, 3).map(i => i.id),
                explanation: `Dolabını analiz ettim. Özellikle seçtiğim bu kombin, ${city} havasına ve ${style} aurasının dinamiklerine kusursuz uyuyor.` 
            };
        }
        
        try {
            const itemDescriptions = items.map(i => `ID: ${i.id} | ${i.category}: ${i.brand || 'Bilinmeyen'} (${i.fabric || ''})`).join('\n');
            const systemPrompt = `Sen profesyonel, elit bir moda stilistisin. Kullanıcının cinsiyeti: ${gender}.
Şu anki şehir: "${city}" ve stil teması: "${style}".
Kullanıcının gardırobunda şu parçalar var:
${itemDescriptions}

Görevin:
1. Kullanıcının cinsiyetine, şehre ve stile en uygun, renk ve doku olarak birbirini en iyi tamamlayan tam 3 parça seç (Örn: 1 Üst, 1 Alt, 1 Ayakkabı veya Aksesuar).
2. Neden bu üçlüyü seçtiğini ve "${city}" şehrinin "${style}" tarzına nasıl uyduğunu açıklayan elit, havalı ve sofistike 2-3 cümlelik bir paragraf yaz.
Yanıtını MUTLAKA aşağıdaki JSON formatında dön:
{
  "outfitIds": ["id1", "id2", "id3"],
  "explanation": "..."
}`;

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: systemPrompt }],
                response_format: { type: "json_object" }
            });
            const result = JSON.parse(response.choices[0].message.content || "{}");
            
            let validIds = (result.outfitIds || []).filter((id: string) => items.some(i => i.id === id));
            if(validIds.length === 0) validIds = items.slice(0,3).map(i=>i.id);

            return { outfitIds: validIds.slice(0,3), explanation: result.explanation || "Kusursuz bir kombin." };
        } catch (error) {
            this.logger.error("Generate Outfit Error", error);
            return { 
                outfitIds: items.slice(0, 3).map(i => i.id),
                explanation: "Dolabını analiz ettim. Seçtiğim bu parçalar auranın dinamiklerini kusursuz taşıyor." 
            };
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

        const fashnCategory = category === 'Alt Giyim' ? 'bottoms'
            : (category === 'Dış Giyim') ? 'one-pieces'
            : 'tops';

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
            this.logger.log(`[Fashn] status: ${status}`);
            if (status === 'completed') {
                const url = Array.isArray(output) ? output[0] : output;
                if (url) return url;
                throw new Error('No output URL from fashn.ai');
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

        const clothType = category === 'Alt Giyim' ? 'lower'
            : (category === 'Dış Giyim' || category === 'Aksesuar') ? 'overall'
            : 'upper';

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
