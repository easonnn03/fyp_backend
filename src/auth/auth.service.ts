import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterValidationService } from 'src/registerValidation/register-validation.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

//Injectable is a decorator
//Can be injected into other classes via dependency injection system (DI)
//By default, a service only injectable inside the module
// DI help managing the instance

/*
1. Add Injectable services into module
2. Use it internally or externally (export it)
*/
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly validator: RegisterValidationService,
    private jwtService: JwtService,
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<{ success: boolean }> {
    const { tpNumber, email, username, password } = dto;

    // Step 1: Check TPNumber exists in TpTable
    const isValidTP = await this.validator.isValidTP(tpNumber);
    if (!isValidTP) {
      throw new UnauthorizedException('TP Number not registered in TP Table');
    }

    // Step 2: Ensure TPNumber is not already used
    const isRegisteredTP = await this.validator.isRegisteredTP(tpNumber);
    if (isRegisteredTP) {
      throw new ConflictException('TP Number already registered');
    }
    // Step 3: Ensure Email is not already used
    const isRegisteredEmail = await this.validator.isRegisteredEmail(email);
    if (isRegisteredEmail) {
      throw new ConflictException('Email already registered');
    }

    // Step 4: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 5: Save user to database
    const user = await this.prisma.users.create({
      data: {
        TPNumber: tpNumber,
        Email: email,
        Username: username,
        Password: hashedPassword,
      },
    });

    // Step 6: Save user profiles to database
    const userInfo = await this.prisma.tpTable.findUnique({
      where: { TpNumber: tpNumber },
    });
    const currentYear = new Date().getFullYear();
    const age = currentYear - userInfo!.BornYear;
    const course = userInfo!.CourseName;
    await this.prisma.profiles.create({
      data: {
        UserId: user.Id,
        Age: age,
        CourseName: course,
        Bio: 'Hi there! I am new to this platform',
      },
    });

    await this.prisma.notifications.create({
      data: {
        userId: user.Id,
        message: `Welcome to ApBook, ${user.Username}!`,
      },
    });

    return { success: true };
  }

  async signIn(
    dto: LoginUserDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = dto;

    // Step 1: Find user by email
    const user = await this.prisma.users.findUnique({
      where: { Email: email },
    });

    // Step 2: Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Step 3: Compare password
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Step 4: Generate JWT token (Access Token and Refresh Token)
    const accessToken = await this.jwtService.signAsync(
      { sub: user.Id, email: user.Email },
      {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '2h',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.Id },
      {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: '1d',
      },
    );

    // Step 5: Return success message
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    interface RefreshTokenPayload {
      sub: string;
    }

    try {
      const payload: RefreshTokenPayload = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: process.env.REFRESH_TOKEN_SECRET,
        },
      );

      const user = await this.prisma.users.findUnique({
        where: { Id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const accessToken = await this.jwtService.signAsync(
        { sub: payload.sub, email: user.Email }, // or re-fetch user if needed
        {
          secret: process.env.ACCESS_TOKEN_SECRET,
          expiresIn: '2h',
        },
      );

      return { access_token: accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
