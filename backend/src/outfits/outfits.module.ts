import { Module } from '@nestjs/common';
import { OutfitsService } from './outfits.service';
import { OutfitsController } from './outfits.controller';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [OutfitsService],
  controllers: [OutfitsController]
})
export class OutfitsModule { }
