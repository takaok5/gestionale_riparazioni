import 'package:meta/meta.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

@immutable
abstract class BaseModel {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;

  const BaseModel({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
  });

  // Getter per le date formattate
  String get createdAtFormatted => AppDateUtils.formatDateTime(createdAt);
  String get updatedAtFormatted => AppDateUtils.formatDateTime(updatedAt);
  String get createdAtRelative => AppDateUtils.timeAgo(createdAt);
  String get updatedAtRelative => AppDateUtils.timeAgo(updatedAt);

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'createdAt': AppDateUtils.toISOString(createdAt),
      'updatedAt': AppDateUtils.toISOString(updatedAt),
    };
  }

  // Utility method per il parsing delle date da Firestore
  static DateTime parseTimestamp(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is Timestamp) return value.toDate();
    if (value is String)
      return AppDateUtils.parseISOString(value) ?? DateTime.now();
    return DateTime.now();
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BaseModel && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
