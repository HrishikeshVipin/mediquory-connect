import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const recipientType = user.role === 'ADMIN' ? 'ADMIN' : 'DOCTOR';
    const { limit = 20 } = req.query;

    const notifications = await notificationService.getNotifications(
      recipientType,
      user.id,
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: { notifications },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const recipientType = user.role === 'ADMIN' ? 'ADMIN' : 'DOCTOR';

    const count = await notificationService.getUnreadCount(recipientType, user.id);

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message,
    });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    await notificationService.markAsRead(notificationId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const recipientType = user.role === 'ADMIN' ? 'ADMIN' : 'DOCTOR';

    await notificationService.markAllAsRead(recipientType, user.id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error marking all as read',
      error: error.message,
    });
  }
};
