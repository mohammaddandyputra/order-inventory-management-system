import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getAllNotifications() {
    return this.notificationService.getNotifications();
  }

  @Get('user/:userId')
  async getUserNotifications(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationService.getNotifications(userId);
  }

  @Get(':id')
  async getNotificationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.getNotificationById(id);
  }
}