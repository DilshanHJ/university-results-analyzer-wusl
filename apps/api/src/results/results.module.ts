import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller.js';
import { ResultsService } from './results.service.js';

@Module({
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
