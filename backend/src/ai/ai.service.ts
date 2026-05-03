import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Generate3DModelJob, GenerateAvatarJob } from './dto/ai-jobs.dto';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI | null = null;

    constructor(
        private readonly prisma: PrismaService,
        @Optional() @InjectQueue('ai-tasks') private readonly aiQueue: Queue,
        @Optional() @InjectQueue('avatar-tasks') private readonly avatarQueue: Queue
    ) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        } else {
            this.logger.warn('OPENAI_API_KEY is missing! AI Stylist will run in mock mode.');
        }
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
