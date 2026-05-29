import { Injectable, Logger } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly messagesRepository: MessagesRepository) {}

  async createMessage(
    roomId: string,
    userId: string,
    content: string,
  ): Promise<Message> {
    const message = await this.messagesRepository.createMessage({
      roomId,
      userId,
      content,
    });

    this.logger.log(`Message sent by user ${userId} in room ${roomId}`);
    return message;
  }

  async getMessageWithUser(messageId: string): Promise<Message | null> {
    return this.messagesRepository.findMessageWithUser(messageId);
  }

  async getRoomMessages(
    roomId: string,
    limit: number,
    beforeId?: string,
  ): Promise<Message[]> {
    return this.messagesRepository.findRoomMessages(roomId, limit, beforeId);
  }
}
