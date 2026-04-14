import { Global, Module } from '@nestjs/common';
import { DbLoggerService } from './logger/db-logger.service';

@Global()
@Module({
  providers: [DbLoggerService],
  exports: [DbLoggerService],
})
export class ObservabilityModule {}
