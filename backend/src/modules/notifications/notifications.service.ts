import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly oneSignalAppId: string;
  private readonly oneSignalApiKey: string;
  private readonly restApiUrl = 'https://onesignal.com/api/v1/notifications';

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.oneSignalAppId = this.configService.get<string>('ONESIGNAL_APP_ID');
    this.oneSignalApiKey = this.configService.get<string>('ONESIGNAL_API_KEY');
  }

  /**
   * Send a notification to a specific user and persist it to the database.
   */
  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: any },
  ) {
    // 1. Log notification to DB
    const notification = this.notificationsRepository.create({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      data: payload.data || null,
    });
    await this.notificationsRepository.save(notification);

    // 2. Lookup recipient
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'onesignal_player_id'],
    });

    if (!user || !user.onesignal_player_id) {
      this.logger.warn(
        `User ${userId} has no onesignal_player_id. Push notification skipped.`,
      );
      return;
    }

    // 3. Dispatch to OneSignal API (silently catch failures)
    try {
      const response = await fetch(this.restApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.oneSignalApiKey}`,
        },
        body: JSON.stringify({
          app_id: this.oneSignalAppId,
          include_player_ids: [user.onesignal_player_id],
          headings: { en: payload.title },
          contents: { en: payload.body },
          data: payload.data || {},
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        this.logger.error(`OneSignal API Error: ${JSON.stringify(errData)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
    }
  }

  /**
   * Broadcast a notification to a specific Segment ('All Hosts', 'All Cleaners', etc.)
   */
  async sendToSegment(
    segment: string,
    payload: { title: string; body: string; data?: any },
  ) {
    try {
      const response = await fetch(this.restApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.oneSignalApiKey}`,
        },
        body: JSON.stringify({
          app_id: this.oneSignalAppId,
          included_segments: [segment],
          headings: { en: payload.title },
          contents: { en: payload.body },
          data: payload.data || {},
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        this.logger.error(`OneSignal Segment API Error: ${JSON.stringify(errData)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to dispatch segment push: ${error.message}`);
    }
  }

  /**
   * List paginated notifications for a specific user.
   */
  async getUserNotifications(userId: string, limit = 20, cursor?: string) {
    const query = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC')
      .take(limit);

    if (cursor) {
      // Decode cursor (assuming simple ISO date string for cursor pagination)
      const decodedCursor = new Date(Buffer.from(cursor, 'base64').toString('ascii'));
      query.andWhere('notification.created_at < :cursor', { cursor: decodedCursor });
    }

    const notifications = await query.getMany();

    let nextCursor = null;
    if (notifications.length === limit) {
      const lastItem = notifications[notifications.length - 1];
      nextCursor = Buffer.from(lastItem.created_at.toISOString()).toString('base64');
    }

    return {
      data: notifications,
      next_cursor: nextCursor,
    };
  }

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    await this.notificationsRepository.update(
      { id: notificationId, user_id: userId },
      { is_read: true },
    );
  }

  /**
   * Mark all notifications for a user as read.
   */
  async markAllAsRead(userId: string) {
    await this.notificationsRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
  }
}
