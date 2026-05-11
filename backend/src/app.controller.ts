import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

const OPTIONAL_SERVICES: Record<string, string> = {
  'AI Chat (Groq)': 'GROQ_API_KEY',
  'Mail (Resend)': 'RESEND_API_KEY',
  'Try-On (Fashn)': 'FASHN_API_KEY',
  'Try-On (Fal)': 'FAL_KEY',
  'Try-On (Replicate)': 'REPLICATE_API_TOKEN',
  'HuggingFace': 'HF_TOKEN',
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    const services: Record<string, boolean> = {};
    for (const [name, envKey] of Object.entries(OPTIONAL_SERVICES)) {
      services[name] = !!process.env[envKey];
    }
    return {
      status: 'ok',
      env: process.env.NODE_ENV,
      frontend: process.env.FRONTEND_URL || '⚠️ not set',
      services,
    };
  }
}
