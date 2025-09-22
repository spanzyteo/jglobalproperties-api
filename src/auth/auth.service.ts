/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto, SignInDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(signupDto: SignupDto, res: Response) {
    const { name, email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const userCount = await this.prisma.user.count();
    if (userCount >= 2) {
      throw new ForbiddenException(
        'Maximum number of users (2) has been reached',
      );
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    //Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    this.setAuthCookies(res, access_token, user);

    return {
      access_token,
      user,
      message: 'User registered successfully',
    };
  }

  async signIn(signInDto: SignInDto, res: Response) {
    const { email, password } = signInDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    //Set HTTP-only cookies
    this.setAuthCookies(res, access_token, user);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      message: 'Signed in successfully',
    };
  }

  logout(res: Response) {
    // Clear all authentication cookies
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('user_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('user_email', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('user_name', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('is_authenticated', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return {
      message: 'Logged out successfully',
    };
  }

  private setAuthCookies(res: Response, access_token: string, user: any) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    };

    const publicCookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    };

    // Set HTTP-only cookies (secure, cannot be accessed by JavaScript)
    res.cookie('access_token', access_token, cookieOptions);
    res.cookie('user_id', user.id, cookieOptions);

    // Set public cookies (can be accessed by frontend JavaScript for UI purposes)
    res.cookie('user_email', user.email, publicCookieOptions);
    res.cookie('user_name', user.name, publicCookieOptions);
    res.cookie('is_authenticated', 'true', publicCookieOptions);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getProfile(userId: string) {
    return this.validateUser(userId);
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getUserStats() {
    const userCount = await this.prisma.user.count();
    const remainingSlots = Math.max(0, 2 - userCount);

    return {
      totalUsers: userCount,
      maxUsers: 2,
      remainingSlots,
      canRegister: remainingSlots > 0,
    };
  }
}
