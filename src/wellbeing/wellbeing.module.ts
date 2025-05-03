import { Module } from '@nestjs/common';
import { wellbeingController } from './wellbeing.controller';
import { wellbeingService } from './wellbeing.service';

@Module({
  imports: [],
  controllers: [wellbeingController],
  providers: [wellbeingService],
})
export class wellbeingModule {}
