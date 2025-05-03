import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegisterValidationService {
  constructor(private prisma: PrismaService) {}

  async isValidTP(tpNumber: string): Promise<boolean> {
    const exists = await this.prisma.tpTable.findUnique({
      where: { TpNumber: tpNumber },
    });
    return !!exists;
  }

  async isRegisteredTP(tpNumber: string): Promise<boolean> {
    const exists = await this.prisma.users.findUnique({
      where: { TPNumber: tpNumber },
    });
    return !!exists;
  }

  async isRegisteredEmail(email: string): Promise<boolean> {
    const exists = await this.prisma.users.findUnique({
      where: { Email: email },
    });
    return !!exists;
  }
}
