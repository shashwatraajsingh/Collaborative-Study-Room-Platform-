import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Message } from './entities/message.entity';

@Controller('rooms/:id/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(
    @Param('id') roomId: string,
    @Query() query: GetMessagesDto,
  ): Promise<Message[]> {
    return this.messagesService.getRoomMessages(
      roomId,
      query.limit ?? 50,
      query.before,
    );
  }
}
