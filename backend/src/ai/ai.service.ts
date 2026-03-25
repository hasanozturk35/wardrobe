import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI | null = null;

    constructor(private readonly prisma: PrismaService) {
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
     * TRIPO AI - 2D to 3D Generation (PoC)
     * This calls Tripo AI to generate a 3D Mesh from the garment image.
     */
    async generate3DModel(garmentId: string, imageUrl: string) {
        const tripoKey = process.env.TRIPO_API_KEY;
        if (!tripoKey) {
            this.logger.warn('TRIPO_API_KEY is missing! Using Mock 3D Mesh for demonstration.');
            // Mock delay to simulate generation
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Assign a "default" mesh path that we serve via /static
            await this.prisma.garmentItem.update({
                where: { id: garmentId },
                data: { meshUrl: '/static/meshes/default_jacket.glb' }
            });
            return;
        }

        try {
            this.logger.log(`Starting 3D Generation for garment ${garmentId}...`);

            // 1. Submit task to Tripo AI
            const response = await fetch('https://api.tripo3d.ai/v1/task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tripoKey}`
                },
                body: JSON.stringify({
                    type: 'image_to_model',
                    file: {
                        type: 'jpg',
                        url: imageUrl // Must be a public URL
                    }
                })
            });

            const taskData = await response.json();
            const taskId = taskData.data?.task_id;

            if (!taskId) {
                this.logger.error('Failed to create Tripo task, falling back to Mock:', taskData);
                await this.prisma.garmentItem.update({
                    where: { id: garmentId },
                    data: { meshUrl: '/static/meshes/default_jacket.glb' }
                });
                return;
            }

            // 2. Poll for completion
            let glbUrl = null;
            for (let i = 0; i < 15; i++) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                const statusRes = await fetch(`https://api.tripo3d.ai/v1/task/${taskId}`, {
                    headers: { 'Authorization': `Bearer ${tripoKey}` }
                });
                const statusData = await statusRes.status === 200 ? await statusRes.json() : null;

                if (statusData?.data?.status === 'success') {
                    glbUrl = statusData.data.output.model;
                    break;
                }
                if (statusData?.data?.status === 'failed') break;
            }

            if (glbUrl) {
                this.logger.log(`3D Model Generated: ${glbUrl}`);
                await this.prisma.garmentItem.update({
                    where: { id: garmentId },
                    data: { meshUrl: glbUrl }
                });
            } else {
                // Final fallback
                await this.prisma.garmentItem.update({
                    where: { id: garmentId },
                    data: { meshUrl: '/static/meshes/default_jacket.glb' }
                });
            }
        } catch (error) {
            this.logger.error('Tripo AI Error, using Mock:', error);
            await this.prisma.garmentItem.update({
                where: { id: garmentId },
                data: { meshUrl: '/static/meshes/default_jacket.glb' }
            });
        }
    }
}
