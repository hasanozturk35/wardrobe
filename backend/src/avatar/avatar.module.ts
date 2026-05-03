import { Module } from '@nestjs/common';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [AvatarController],
    providers: [AvatarService],
    exports: [AvatarService]
})
export class AvatarModule { }
