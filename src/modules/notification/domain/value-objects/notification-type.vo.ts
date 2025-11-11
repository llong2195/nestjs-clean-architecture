/**
 * Notification Type Value Object
 *
 * Defines the available notification delivery channels.
 * Each type determines how the notification will be sent to the user.
 */
export enum NotificationType {
  /**
   * Email notification - sent via SMTP
   */
  EMAIL = 'email',

  /**
   * Push notification - sent to mobile devices
   */
  PUSH = 'push',

  /**
   * WebSocket notification - real-time in-app notification
   */
  WEBSOCKET = 'websocket',

  /**
   * SMS notification - sent via SMS gateway
   */
  SMS = 'sms',
}

/**
 * Type guard to check if a string is a valid NotificationType
 */
export function isValidNotificationType(type: string): type is NotificationType {
  return Object.values(NotificationType).includes(type as NotificationType);
}
