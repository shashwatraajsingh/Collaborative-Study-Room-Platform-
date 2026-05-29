import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../infrastructure/redis/redis.service';
import { MessagesService } from '../messages/messages.service';
import { SessionsService } from '../sessions/sessions.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { SendMessageWsDto } from './dto/send-message-ws.dto';

const ROOM_PRESENCE_KEY_PREFIX = 'room';
const ROOM_PRESENCE_KEY_SUFFIX = 'online';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

interface OnlineUser {
  userId: string;
  username: string;
}

@WebSocketGateway({
  namespace: '/rooms',
  cors: { origin: '*' },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StudyRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(StudyRoomGateway.name);

  /**
   * Maps socket.id → Set of roomIds that socket has joined.
   * Used to clean up presence on disconnect.
   */
  private readonly socketRoomMap = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly messagesService: MessagesService,
    private readonly sessionsService: SessionsService,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = this.authenticateSocket(client);
      (client as AuthenticatedSocket).user = user;
      this.socketRoomMap.set(client.id, new Set());
      this.logger.log(`Socket connected: ${client.id} (user: ${user.username})`);
    } catch {
      this.logger.warn(`Socket connection rejected: ${client.id} — invalid token`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const authenticatedClient = client as AuthenticatedSocket;
    const joinedRooms = this.socketRoomMap.get(client.id);

    if (joinedRooms && authenticatedClient.user) {
      for (const roomId of joinedRooms) {
        await this.removeUserFromPresence(roomId, authenticatedClient);
      }
    }

    this.socketRoomMap.delete(client.id);
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const authenticatedClient = client as AuthenticatedSocket;
    const { roomId } = data;
    const user = authenticatedClient.user;

    if (!user) {
      throw new WsException('Not authenticated');
    }

    try {
      await this.roomsService.verifyMembership(roomId, user.sub);
    } catch {
      throw new WsException('You are not a member of this room');
    }

    await client.join(roomId);

    const rooms = this.socketRoomMap.get(client.id);
    if (rooms) {
      rooms.add(roomId);
    }

    const presenceKey = this.buildPresenceKey(roomId);
    const userPayload = JSON.stringify({ userId: user.sub, username: user.username });
    await this.redisService.sAdd(presenceKey, userPayload);

    this.server.to(roomId).emit('userJoined', {
      userId: user.sub,
      username: user.username,
      roomId,
    });

    await this.emitPresenceUpdate(roomId);
    this.logger.log(`User ${user.username} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const authenticatedClient = client as AuthenticatedSocket;
    const { roomId } = data;

    await client.leave(roomId);

    const rooms = this.socketRoomMap.get(client.id);
    if (rooms) {
      rooms.delete(roomId);
    }

    await this.removeUserFromPresence(roomId, authenticatedClient);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageWsDto,
  ): Promise<void> {
    const authenticatedClient = client as AuthenticatedSocket;
    const user = authenticatedClient.user;

    if (!user) {
      throw new WsException('Not authenticated');
    }

    const message = await this.messagesService.createMessage(
      data.roomId,
      user.sub,
      data.content,
    );

    this.server.to(data.roomId).emit('newMessage', {
      id: message.id,
      roomId: message.roomId,
      userId: user.sub,
      username: user.username,
      content: message.content,
      createdAt: message.createdAt,
    });
  }

  @SubscribeMessage('startSession')
  async handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const authenticatedClient = client as AuthenticatedSocket;
    const user = authenticatedClient.user;

    if (!user) {
      throw new WsException('Not authenticated');
    }

    try {
      const session = await this.sessionsService.startStudySession(data.roomId, user.sub);

      this.server.to(data.roomId).emit('sessionStarted', {
        userId: user.sub,
        roomId: data.roomId,
        startedAt: session.startedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start session';
      throw new WsException(message);
    }
  }

  @SubscribeMessage('endSession')
  async handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const authenticatedClient = client as AuthenticatedSocket;
    const user = authenticatedClient.user;

    if (!user) {
      throw new WsException('Not authenticated');
    }

    try {
      const session = await this.sessionsService.endStudySession(data.roomId, user.sub);

      this.server.to(data.roomId).emit('sessionEnded', {
        userId: user.sub,
        roomId: data.roomId,
        durationSeconds: session.durationSeconds,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end session';
      throw new WsException(message);
    }
  }

  private authenticateSocket(client: Socket): JwtPayload {
    const token = this.extractTokenFromSocket(client);
    if (!token) {
      throw new WsException('Authentication token missing');
    }

    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authToken = client.handshake.auth?.['token'] as string | undefined;
    if (authToken) {
      return authToken;
    }

    const headerToken = client.handshake.headers?.['authorization'];
    if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.slice(7);
    }

    return null;
  }

  private async removeUserFromPresence(
    roomId: string,
    client: AuthenticatedSocket,
  ): Promise<void> {
    const user = client.user;
    if (!user) return;

    const presenceKey = this.buildPresenceKey(roomId);
    const userPayload = JSON.stringify({ userId: user.sub, username: user.username });
    await this.redisService.sRem(presenceKey, userPayload);

    this.server.to(roomId).emit('userLeft', {
      userId: user.sub,
      username: user.username,
      roomId,
    });

    await this.emitPresenceUpdate(roomId);
    this.logger.log(`User ${user.username} left room ${roomId}`);
  }

  private async emitPresenceUpdate(roomId: string): Promise<void> {
    const presenceKey = this.buildPresenceKey(roomId);
    const members = await this.redisService.sMembers(presenceKey);

    const onlineUsers: OnlineUser[] = members.map((member) => {
      const parsed = JSON.parse(member) as OnlineUser;
      return { userId: parsed.userId, username: parsed.username };
    });

    this.server.to(roomId).emit('presenceUpdate', {
      roomId,
      onlineUsers,
    });
  }

  private buildPresenceKey(roomId: string): string {
    return `${ROOM_PRESENCE_KEY_PREFIX}:${roomId}:${ROOM_PRESENCE_KEY_SUFFIX}`;
  }
}
