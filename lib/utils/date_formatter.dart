import 'package:intl/intl.dart';

class DateFormatter {
  static final DateFormat _dateFormat = DateFormat('dd/MM/yyyy');
  static final DateFormat _dateTimeFormat = DateFormat('dd/MM/yyyy HH:mm');

  static String formatRelative(DateTime date) {
    final Duration diff = DateTime.now().difference(date);
    if (diff.inDays > 0) return '${diff.inDays} giorni fa';
    if (diff.inHours > 0) return '${diff.inHours} ore fa';
    return '${diff.inMinutes} minuti fa';
  }

  static String formatDate(DateTime date) {
    return _dateFormat.format(date);
  }

  static String formatDateTime(DateTime date) {
    return _dateTimeFormat.format(date);
  }

  static DateTime? tryParse(String input) {
    try {
      return _dateFormat.parse(input);
    } catch (e) {
      return null;
    }
  }

  static String formatTimeAgo(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()} anni fa';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()} mesi fa';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} giorni fa';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} ore fa';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minuti fa';
    } else {
      return 'poco fa';
    }
  }
}
