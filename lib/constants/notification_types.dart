enum NotificationType {
  lowInventory,
  newOrder,
  repairStatus,
  warranty,
  generic
}

class NotificationPayload {
  final NotificationType type;
  final String? id;
  final Map<String, dynamic>? data;

  NotificationPayload({
    required this.type,
    this.id,
    this.data,
  });

  factory NotificationPayload.fromString(String? payload) {
    if (payload == null) {
      return NotificationPayload(type: NotificationType.generic);
    }

    try {
      final parts = payload.split(':');
      final type = parts[0];
      final id = parts.length > 1 ? parts[1] : null;

      return NotificationPayload(
        type: _getTypeFromString(type),
        id: id,
      );
    } catch (e) {
      return NotificationPayload(type: NotificationType.generic);
    }
  }

  static NotificationType _getTypeFromString(String type) {
    switch (type) {
      case 'low_inventory':
        return NotificationType.lowInventory;
      case 'new_order':
        return NotificationType.newOrder;
      case 'repair_status':
        return NotificationType.repairStatus;
      case 'warranty':
        return NotificationType.warranty;
      default:
        return NotificationType.generic;
    }
  }
}
