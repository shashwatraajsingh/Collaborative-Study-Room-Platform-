import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      throw new WsException('Authentication token missing');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      (client as Socket & { user: JwtPayload }).user = payload;
      return true;
    } catch {
      this.logger.warn(`WebSocket authentication failed for socket ${client.id}`);
      throw new WsException('Invalid or expired authentication token');
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.auth?.['token'] as string | undefined;
    if (authHeader) {
      return authHeader;
    }

    const headerToken = client.handshake.headers?.['authorization'];
    if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.slice(7);
    }

    return null;
  }
}
