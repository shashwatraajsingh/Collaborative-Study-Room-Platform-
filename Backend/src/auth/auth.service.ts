import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponse,
  AuthTokens,
  JwtPayload,
  JwtRefreshPayload,
} from './types/jwt-payload.type';

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const REFRESH_TOKEN_KEY_PREFIX = 'refresh';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('This username is already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.createUser({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.username);
    this.logger.log(`New user registered: ${user.username} (${user.id})`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.username);
    this.logger.log(`User logged in: ${user.username} (${user.id})`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: JwtRefreshPayload;
    try {
      payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const redisKey = this.buildRefreshTokenKey(payload.sub, payload.tokenId);
    const storedToken = await this.redisService.get(redisKey);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.usersService.findById(payload.sub);
    const accessToken = this.generateAccessToken(user.id, user.email, user.username);

    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    await this.redisService.deleteByPattern(`${REFRESH_TOKEN_KEY_PREFIX}:${userId}:*`);
    this.logger.log(`User logged out, all refresh tokens revoked: ${userId}`);
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    username: string,
  ): Promise<AuthTokens> {
    const tokenId = uuidv4();

    const accessToken = this.generateAccessToken(userId, email, username);
    const refreshToken = this.generateRefreshToken(userId, tokenId);

    const redisKey = this.buildRefreshTokenKey(userId, tokenId);
    await this.redisService.set(redisKey, refreshToken, REFRESH_TOKEN_TTL_SECONDS);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(
    userId: string,
    email: string,
    username: string,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      username,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  private generateRefreshToken(userId: string, tokenId: string): string {
    const payload: JwtRefreshPayload = {
      sub: userId,
      tokenId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });
  }

  private buildRefreshTokenKey(userId: string, tokenId: string): string {
    return `${REFRESH_TOKEN_KEY_PREFIX}:${userId}:${tokenId}`;
  }
}
