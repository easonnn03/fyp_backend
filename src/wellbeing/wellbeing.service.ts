import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class wellbeingService {
  constructor(private readonly prisma: PrismaService) {}

  async submitMood(userId: string, mood: number) {
    await this.prisma.dailyMood.create({
      data: { userId: userId, mood: mood },
    });

    const moodMessages = {
      1: {
        message:
          '😢 We noticed you’re feeling very down. You’re not alone. Consider talking to someone.',
        buttonURL: 'https://youtu.be/dQw4w9WgXcQ?si=MUDGfwJc1cgIpsvM',
      },
      2: {
        message: '😟 Rough day? Here are some calming tips for your mind.',
        buttonURL: 'https://www.youtube.com/watch?v=HEXWRTEbj1I',
      },
      3: {
        message: '😐 Feeling neutral? Check out activities to boost your mood!',
        buttonURL: 'https://www.youtube.com/watch?v=MtN1YnoL46Q',
      },
      4: {
        message: '🙂 Great to see you doing okay! Keep up the good vibes.',
        buttonURL:
          'https://www.youtube.com/watch?v=astISOttCQ0&ab_channel=icanrockyourworld',
      },
      5: {
        message: '😄 You’re feeling great today! Spread the positivity!',
        buttonURL:
          'https://www.youtube.com/watch?v=NSU2hJ5wT08&ab_channel=YadroGreenScreen',
      },
    } as const;

    type MoodLevel = keyof typeof moodMessages;

    if ([1, 2, 3, 4, 5].includes(mood)) {
      const moodData = moodMessages[mood as MoodLevel];
      await this.prisma.notifications.create({
        data: {
          userId,
          message: moodData.message,
          buttonURL: moodData.buttonURL,
        },
      });
    }
  }

  async getmood(userId: string): Promise<number | null> {
    const moodEntry = await this.prisma.dailyMood.findFirst({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return moodEntry?.mood ?? null; // return null if not submitted
  }
}
