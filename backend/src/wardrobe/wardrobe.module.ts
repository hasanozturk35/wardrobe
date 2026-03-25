import { Module } from '@nestjs/common';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeService } from './wardrobe.service';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AuthModule, AiModule],
    controllers: [WardrobeController],
    providers: [WardrobeService],
    exports: [WardrobeService],
})
export class WardrobeModule { }
