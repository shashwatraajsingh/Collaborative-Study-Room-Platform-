import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from './entities/message.entity';

const DEFAULT_MESSAGE_LIMIT = 50;

@Injectable()
export class MessagesRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createMessage(data: {
    roomId: string;
    userId: string;
    content: string;
  }): Promise<Message> {
    const message = this.messageRepo.create(data);
    return this.messageRepo.save(message);
  }

  async findMessageWithUser(messageId: string): Promise<Message | null> {
    return this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['user'],
    });
  }

  async findRoomMessages(
    roomId: string,
    limit: number = DEFAULT_MESSAGE_LIMIT,
    beforeId?: string,
  ): Promise<Message[]> {
    const queryBuilder = this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message.roomId = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (beforeId) {
      const cursorMessage = await this.messageRepo.findOne({
        where: { id: beforeId },
        select: ['createdAt'],
      });

      if (cursorMessage) {
        queryBuilder.andWhere('message.createdAt < :cursorDate', {
          cursorDate: cursorMessage.createdAt,
        });
      }
    }

    const messages = await queryBuilder.getMany();
    return messages.reverse();
  }
}
