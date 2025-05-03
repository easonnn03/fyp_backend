import { Controller, UseGuards, Post, Body, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { wellbeingService } from './wellbeing.service';

@UseGuards(JwtAuthGuard)
@Controller('wellbeing')
export class wellbeingController {
  constructor(private readonly wellbeingService: wellbeingService) {}

  @Post('mood-submit')
  async moodSubmit(@Body() body: { userId: string; mood: number }) {
    return this.wellbeingService.submitMood(body.userId, body.mood);
  }

  @Get('mood')
  async getMood(@Query('currentUserId') userId: string) {
    return this.wellbeingService.getmood(userId);
  }
}
