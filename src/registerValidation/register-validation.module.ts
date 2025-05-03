import { Module } from '@nestjs/common';
import { RegisterValidationService } from './register-validation.service';

@Module({
  providers: [RegisterValidationService],
  exports: [RegisterValidationService],
})
export class RegisterValidationModule {}
