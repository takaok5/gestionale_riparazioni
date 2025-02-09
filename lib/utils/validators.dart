import 'package:intl/intl.dart';

class Validators {
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  static bool isValidPhoneNumber(String phone) {
    return RegExp(r'^\+?[\d\s-]{10,}$').hasMatch(phone);
  }

  static bool isValidVAT(String vat) {
    return RegExp(r'^[0-9]{11}$').hasMatch(vat);
  }

  static String formatDate(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  static String formatDateTime(DateTime date) {
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }

  static String formatCurrency(double amount) {
    return NumberFormat.currency(locale: 'it_IT', symbol: '€').format(amount);
  }

  static String formatPercent(double value) {
    return NumberFormat.percentPattern('it_IT').format(value / 100);
  }

  static String? required(String? value, String fieldName) {
    if (value == null || value.isEmpty) {
      return '$fieldName è obbligatorio';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email è obbligatoria';
    }
    if (!isValidEmail(value)) {
      return 'Email non valida';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Telefono è obbligatorio';
    }
    if (!isValidPhoneNumber(value)) {
      return 'Numero di telefono non valido';
    }
    return null;
  }

  static String? partitaIva(String? value) {
    if (value == null || value.isEmpty) {
      return 'Partita IVA è obbligatoria';
    }
    if (!isValidVAT(value)) {
      return 'Partita IVA non valida';
    }
    return null;
  }

  static String formatRelativeDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return formatDate(date);
    } else if (difference.inDays > 1) {
      return '${difference.inDays} giorni fa';
    } else if (difference.inDays == 1) {
      return 'Ieri';
    } else if (difference.inHours >= 1) {
      return '${difference.inHours} ore fa';
    } else if (difference.inMinutes >= 1) {
      return '${difference.inMinutes} minuti fa';
    } else {
      return 'Poco fa';
    }
  }
}
