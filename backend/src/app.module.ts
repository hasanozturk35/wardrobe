import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WardrobeModule } from './wardrobe/wardrobe.module';
import { AssetsModule } from './assets/assets.module';
import { OutfitsModule } from './outfits/outfits.module';
import { SocialModule } from './social/social.module';
import { AiModule } from './ai/ai.module';
import { CalendarModule } from './calendar/calendar.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DirectoryModule } from './directory/directory.module';
import { AdminModule } from './admin/admin.module';
import { AvatarModule } from './avatar/avatar.module';
import { ShopModule } from './shop/shop.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { ObservabilityModule } from './observability/observability.module';
import { AuditInterceptor } from './observability/audit/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/static',
      serveStaticOptions: {
        setHeaders: (res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
      }
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    UsersModule,
    WardrobeModule,
    AssetsModule,
    OutfitsModule,
    SocialModule,
    AiModule,
    CalendarModule,
    AnalyticsModule,
    DirectoryModule,
    PrismaModule,
    StorageModule,
    ObservabilityModule,
    AvatarModule,
    ShopModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    }
  ],
})
export class AppModule { }
