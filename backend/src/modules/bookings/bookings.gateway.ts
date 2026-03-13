import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CleanerProfile } from '../../database/entities/cleaner-profile.entity';
import { UserRole } from '../../database/entities/user.entity';

@WebSocketGateway({
  cors: {
    origin: '*', // Restrict to front-end domains in production
  },
  namespace: '/bookings',
})
export class BookingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BookingsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(CleanerProfile)
    private readonly cleanerProfileRepository: Repository<CleanerProfile>,
  ) {}

  /**
   * Handle incoming socket connection attempts
   */
  async handleConnection(client: Socket) {
    try {
      // Expect token from handshake either from query '?token=' or auth object '{ token: string }'
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Disconnecting client without token: ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Format could be 'Bearer <token>' or just '<token>'
      const bearerRegex = /^Bearer\s+(.*)$/i;
      const match = token.match(bearerRegex);
      const extractedToken = match ? match[1] : token;

      const hiddenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync(extractedToken, {
        secret: hiddenSecret,
      });

      // Validated payload format: { sub: userId, email, role, iat, exp }
      const userId = payload.sub;

      // Attach user details to socket for subsequent events
      client.data = {
        userId,
        role: payload.role,
        email: payload.email,
      };

      // Room Pattern: Join room scoped to specific user 'user:{userId}'
      // This allows dispatchers to broadcast targeting them specifically
      const roomName = `user:${userId}`;
      client.join(roomName);
      
      this.logger.log(`Client Connected: ${client.id}. Joined room: ${roomName}`);
    } catch (e) {
      this.logger.error(`Unauthorized connection attempt: ${e.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
  }

  /**
   * Receive from clients: 'cleaner:toggle_availability'
   */
  @SubscribeMessage('cleaner:toggle_availability')
  async handleToggleAvailability(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { is_available: boolean },
  ) {
    if (client.data?.role !== UserRole.CLEANER) {
      return { success: false, message: 'Only cleaners can toggle availability' };
    }

    const { userId } = client.data;
    
    // Update the CleanerProfile in the database
    await this.cleanerProfileRepository.update(
      { user_id: userId },
      { is_available: data.is_available }
    );

    this.logger.log(`Cleaner ${userId} toggled availability to: ${data.is_available}`);
    
    return { success: true, is_available: data.is_available };
  }

  /**
   * Wrapper function to allow internal services to emit targeted events to Users
   */
  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
    this.logger.log(`Emitting '${event}' to room 'user:${userId}'`);
  }
}
