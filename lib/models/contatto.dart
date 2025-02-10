import 'package:meta/meta.dart';
import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../utils/validators.dart';
import 'enums/enums.dart';

// Base class for location-related data
@immutable
class Coordinate {
  final double latitudine;
  final double longitudine;

  const Coordinate({
    required this.latitudine,
    required this.longitudine,
  });

  factory Coordinate.fromMap(Map<String, dynamic> map) {
    return Coordinate(
      latitudine: (map['latitudine'] as num).toDouble(),
      longitudine: (map['longitudine'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'latitudine': latitudine,
      'longitudine': longitudine,
    };
  }

  double distanzaDa(Coordinate altra) {
    const r = 6371.0; // raggio della Terra in km
    final lat1 = latitudine * math.pi / 180;
    final lat2 = altra.latitudine * math.pi / 180;
    final dlat = (altra.latitudine - latitudine) * math.pi / 180;
    final dlon = (altra.longitudine - longitudine) * math.pi / 180;

    final a = math.sin(dlat / 2) * math.sin(dlat / 2) +
        math.cos(lat1) *
            math.cos(lat2) *
            math.sin(dlon / 2) *
            math.sin(dlon / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return r * c;
  }
}

// Enhanced address class with validation and formatting
@immutable
class Indirizzo {
  final String? via;
  final String? civico;
  final String? cap;
  final String? citta;
  final String? provincia;
  final String? nazione;
  final Coordinate? coordinate;
  final bool isPrimario;
  final TipoIndirizzo tipo;

  const Indirizzo({
    this.via,
    this.civico,
    this.cap,
    this.citta,
    this.provincia,
    this.nazione,
    this.coordinate,
    this.isPrimario = false,
    this.tipo = TipoIndirizzo.residenza,
  });

  // Formatted address string
  String get indirizzoCompleto {
    final parts = <String>[];
    if (via != null) parts.add(via!);
    if (civico != null) parts.add(civico!);
    if (cap != null) parts.add(cap!);
    if (citta != null) parts.add(citta!);
    if (provincia != null) parts.add('($provincia)');
    if (nazione != null && nazione != 'Italia') parts.add(nazione!);
    return parts.join(', ');
  }

  bool get isValid {
    return via != null &&
        civico != null &&
        cap != null &&
        citta != null &&
        provincia != null;
  }

  factory Indirizzo.fromMap(Map<String, dynamic> map) {
    return Indirizzo(
      via: map['via'] as String?,
      civico: map['civico'] as String?,
      cap: map['cap'] as String?,
      citta: map['citta'] as String?,
      provincia: map['provincia'] as String?,
      nazione: map['nazione'] as String?,
      coordinate: map['coordinate'] != null
          ? Coordinate.fromMap(map['coordinate'] as Map<String, dynamic>)
          : null,
      isPrimario: map['isPrimario'] as bool? ?? false,
      tipo: TipoIndirizzo.values.firstWhere(
        (e) => e.toString() == 'TipoIndirizzo.${map['tipo']}',
        orElse: () => TipoIndirizzo.residenza,
      ),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'via': via,
      'civico': civico,
      'cap': cap,
      'citta': citta,
      'provincia': provincia,
      'nazione': nazione,
      'coordinate': coordinate?.toMap(),
      'isPrimario': isPrimario,
      'tipo': tipo.toString().split('.').last,
    };
  }

  Indirizzo copyWith({
    String? via,
    String? civico,
    String? cap,
    String? citta,
    String? provincia,
    String? nazione,
    Coordinate? coordinate,
    bool? isPrimario,
    TipoIndirizzo? tipo,
  }) {
    return Indirizzo(
      via: via ?? this.via,
      civico: civico ?? this.civico,
      cap: cap ?? this.cap,
      citta: citta ?? this.citta,
      provincia: provincia ?? this.provincia,
      nazione: nazione ?? this.nazione,
      coordinate: coordinate ?? this.coordinate,
      isPrimario: isPrimario ?? this.isPrimario,
      tipo: tipo ?? this.tipo,
    );
  }
}

// Enhanced contact class with validation and type checking
@immutable
class Contatto {
  final TipoContatto tipo;
  final String valore;
  final bool isPrimario;
  final String? note;

  const Contatto({
    required this.tipo,
    required this.valore,
    this.isPrimario = false,
    this.note,
  }) : assert(valore.isNotEmpty);

  bool get isValid {
    switch (tipo) {
      case TipoContatto.email:
        return EmailValidator.isValid(valore);
      case TipoContatto.telefono:
        return PhoneValidator.isValid(valore);
      case TipoContatto.pec:
        return EmailValidator.isValid(valore) && valore.toLowerCase().endsWith('.pec.it');
      default:
        return valore.isNotEmpty;
    }
  }

  String get formattedValue {
    switch (tipo) {
      case TipoContatto.telefono:
        return PhoneFormatter.format(valore);
      default:
        return valore;
    }
  }

  Map<String, dynamic> toMap() => {
        'tipo': tipo.toString().split('.').last,
        'valore': valore,
        'isPrimario': isPrimario,
        'note': note,
      };

  factory Contatto.fromMap(Map<String, dynamic> map) => Contatto(
        tipo: TipoContatto.values.firstWhere(
          (e) => e.toString() == 'TipoContatto.${map['tipo']}',
          orElse: () => TipoContatto.altro,
        ),
        valore: map['valore'] as String,
        isPrimario: map['isPrimario'] as bool? ?? false,
        note: map['note'] as String?,
      );

  Contatto copyWith({
    TipoContatto? tipo,
    String? valore,
    bool? isPrimario,
    String? note,
  }) {
    return Contatto(
      tipo: tipo ?? this.tipo,
      valore: valore ?? this.valore,
      isPrimario: isPrimario ?? this.isPrimario,
      note: note ?? this.note,
    );
  }
}

// Enums for contact and address types
enum TipoContatto {
  email,
  telefono,
  pec,
  fax,
  mobile,
  whatsapp,
  telegram,
  altro,
}

enum TipoIndirizzo {
  residenza,
  domicilio,
  sede_legale,
  sede_operativa,
  magazzino,
  altro,
}

// Validators
class EmailValidator {
  static bool isValid(String email) {
    return RegExp(r'^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]+').hasMatch(email);
  }
}

class PhoneValidator {
  static bool isValid(String phone) {
    return RegExp(r'^\+?[\d\s-]+$').hasMatch(phone);
  }
}

class PhoneFormatter {
  static String format(String phone) {
    // Remove all non-digit characters
    final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
    
    // Format based on length
    if (digits.length <= 10) {
      // National number
      return digits.replaceAllMapped(
        RegExp(r'(\d{3})(\d{3})(\d+)'),
        (m) => '${m[1]} ${m[2]} ${m[3]}'
      );
    } else {
      // International number
      return '+${digits.substring(0, 2)} ${digits.substring(2).replaceAllMapped(
        RegExp(r'(\d{3})(\d{3})(\d+)'),
        (m) => '${m[1]} ${m[2]} ${m[3]}'
      )}';
    }
  }
}