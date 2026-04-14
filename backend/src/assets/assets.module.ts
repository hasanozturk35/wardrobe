import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
    imports: [], // StorageModule is global, so it's already available
    controllers: [AssetsController],
    providers: [AssetsService],
})
export class AssetsModule { }
