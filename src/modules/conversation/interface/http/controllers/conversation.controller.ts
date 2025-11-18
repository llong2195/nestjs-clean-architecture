import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../../common/decorators/current-user.decorator';
import { CreateConversationUseCase } from '../../../application/use-cases/create-conversation.use-case';
import { SendMessageUseCase } from '../../../application/use-cases/send-message.use-case';
import { GetMessageHistoryUseCase } from '../../../application/use-cases/get-message-history.use-case';
import { AddParticipantUseCase } from '../../../application/use-cases/add-participant.use-case';
import { MarkMessagesAsReadUseCase } from '../../../application/use-cases/mark-messages-as-read.use-case';
import { GetConversationListUseCase } from '../../../application/use-cases/get-conversation-list.use-case';
import { GetConversationUseCase } from '../../../application/use-cases/get-conversation.use-case';
import { SearchMessagesUseCase } from '../../../application/use-cases/search-messages.use-case';
import { CreateConversationRequestDto } from '../dtos/create-conversation-request.dto';
import { SendMessageRequestDto } from '../dtos/send-message-request.dto';
import { GetMessagesQueryDto } from '../dtos/get-messages-query.dto';
import { AddParticipantRequestDto } from '../dtos/add-participant-request.dto';
import { SearchMessagesRequestDto } from '../dtos/search-messages-request.dto';
import { GetConversationListDto } from '../../../application/dtos/get-conversation-list.dto';
import { ConversationResponseDto } from '../../../application/dtos/conversation-response.dto';
import { MessageResponseDto } from '../../../application/dtos/message-response.dto';
import { MessageSearchResultDto } from '../../../application/dtos/message-search-result.dto';
import { SendMessageDto } from '../../../application/dtos/send-message.dto';
import { CreateConversationDto } from '../../../application/dtos/create-conversation.dto';
import { ConversationType } from '../../../domain/value-objects/conversation-type.vo';

/**
 * Conversation Controller
 *
 * REST API endpoints for conversation management and message history.
 * WebSocket (Socket.IO) is used for real-time messaging.
 *
 * All endpoints require JWT authentication.
 */
@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(
    private readonly createConversationUseCase: CreateConversationUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getMessageHistoryUseCase: GetMessageHistoryUseCase,
    private readonly addParticipantUseCase: AddParticipantUseCase,
    private readonly markMessagesAsReadUseCase: MarkMessagesAsReadUseCase,
    private readonly getConversationListUseCase: GetConversationListUseCase,
    private readonly getConversationUseCase: GetConversationUseCase,
    private readonly searchMessagesUseCase: SearchMessagesUseCase,
  ) {}

  /**
   * POST /conversations - Create new conversation
   * T039: Create conversation endpoint
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new conversation',
    description:
      'Creates a new conversation (DIRECT or GROUP). For DIRECT conversations, returns existing conversation if it already exists between the participants.',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Existing DIRECT conversation returned',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request (validation failed)' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  async createConversation(
    @Body() dto: CreateConversationRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<ConversationResponseDto> {
    // Map HTTP DTO to application DTO
    const createDto: CreateConversationDto = {
      type: dto.type as ConversationType,
      participantIds: dto.participantIds,
      name: dto.name,
    };

    return this.createConversationUseCase.execute(createDto, userId);
  }

  /**
   * GET /conversations - List conversations
   * T060: Update GET /conversations endpoint with use case
   */
  @Get()
  @ApiOperation({
    summary: 'List user conversations',
    description:
      'Retrieves all conversations where the authenticated user is a participant with pagination and filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    type: [ConversationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  async listConversations(
    @CurrentUser('id') userId: string,
    @Query() query: GetConversationListDto,
  ): Promise<ConversationResponseDto[]> {
    return this.getConversationListUseCase.execute(query, userId);
  }

  /**
   * GET /conversations/:id - Get single conversation
   * T061: Add GET /conversations/:id endpoint
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get conversation details',
    description: 'Retrieves a single conversation by ID. User must be a participant.',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  @ApiResponse({ status: 403, description: 'Forbidden (not a participant)' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ConversationResponseDto> {
    return this.getConversationUseCase.execute(conversationId, userId);
  }

  /**
   * GET /conversations/:id/messages - Get message history
   * T041: Get message history endpoint
   */
  @Get(':id/messages')
  @ApiOperation({
    summary: 'Get message history',
    description: 'Retrieves paginated message history for a conversation (default 50 messages).',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Message history retrieved successfully',
    type: [MessageResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  @ApiResponse({ status: 403, description: 'Forbidden (not a participant)' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessageHistory(
    @Param('id') conversationId: string,
    @Query() query: GetMessagesQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto[]> {
    return this.getMessageHistoryUseCase.execute(conversationId, userId, {
      limit: query.limit,
      offset: query.offset,
    });
  }

  /**
   * POST /conversations/:id/messages - Send message (REST alternative to WebSocket)
   * Note: WebSocket is preferred for real-time messaging
   */
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send message (REST)',
    description:
      'Sends a message to a conversation via REST API. WebSocket is preferred for real-time messaging.',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request (validation failed)' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  @ApiResponse({ status: 403, description: 'Forbidden (not a participant)' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    const sendDto: SendMessageDto = {
      conversationId,
      content: dto.content,
    };

    return this.sendMessageUseCase.execute(sendDto, userId);
  }

  /**
   * POST /conversations/:id/participants - Add participant to GROUP conversation
   * T042: Add participant endpoint
   */
  @Post(':id/participants')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Add participant to GROUP conversation',
    description:
      'Adds a new participant to a GROUP conversation. Not allowed for DIRECT conversations.',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 204, description: 'Participant added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request (DIRECT conversation or validation failed)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async addParticipant(
    @Param('id') conversationId: string,
    @Body() dto: AddParticipantRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.addParticipantUseCase.execute(conversationId, dto.userId, userId);
  }

  /**
   * PATCH /conversations/:id/messages/read - Mark all messages as read
   * T053: User Story 2 - Mark messages as read endpoint
   */
  @Patch(':id/messages/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark messages as read',
    description:
      'Marks all unread messages in a conversation as read by the current user. Only participants can mark messages as read.',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 204, description: 'Messages marked as read successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  @ApiResponse({ status: 403, description: 'Forbidden (not a participant)' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async markMessagesAsRead(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    const dto = {
      conversationId,
    };

    await this.markMessagesAsReadUseCase.execute(dto, userId);
  }

  /**
   * POST /messages/search - Search messages across conversations
   * T081-T083: User Story 5 - Full-text message search
   */
  @Post('messages/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search messages',
    description:
      'Search messages across all conversations using full-text search. Results are ranked by relevance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: { $ref: '#/components/schemas/MessageSearchResultDto' },
        },
        total: { type: 'number', example: 15 },
        hasMore: { type: 'boolean', example: false },
        limit: { type: 'number', example: 50 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request (empty query)' })
  @ApiResponse({ status: 401, description: 'Unauthorized (invalid or missing JWT)' })
  async searchMessages(
    @Body() dto: SearchMessagesRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<{
    results: MessageSearchResultDto[];
    total: number;
    hasMore: boolean;
    limit: number;
  }> {
    // T083: Error handling for empty query (handled by use case + class-validator)
    const searchDto = {
      query: dto.query,
      limit: dto.limit,
    };

    const results = await this.searchMessagesUseCase.execute(searchDto, userId);

    // T082: Add pagination metadata
    const limit = dto.limit ?? 50;
    const hasMore = results.length === limit; // If we got exactly the limit, there might be more

    return {
      results,
      total: results.length,
      hasMore,
      limit,
    };
  }
}
