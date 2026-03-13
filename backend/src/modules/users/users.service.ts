import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Register a user's device for Push Notifications (OneSignal player_id)
   */
  async registerDeviceToken(userId: string, playerId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.onesignal_player_id = playerId;
    await this.userRepository.save(user);

    this.logger.log(`Registered device token for user ${userId}: ${playerId}`);
    return { success: true, message: 'Device token registered successfully' };
  }
}
