import 'package:meta/meta.dart';
import 'dart:math' as math;
import 'enums/enums.dart';
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

@immutable
class Indirizzo {
  final String? via;
  final String? civico;
  final String? cap;
  final String? citta;
  final String? provincia;
  final String? nazione;
  final Coordinate? coordinate;

  const Indirizzo({
    this.via,
    this.civico,
    this.cap,
    this.citta,
    this.provincia,
    this.nazione,
    this.coordinate,
  });

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
  }) {
    return Indirizzo(
      via: via ?? this.via,
      civico: civico ?? this.civico,
      cap: cap ?? this.cap,
      citta: citta ?? this.citta,
      provincia: provincia ?? this.provincia,
      nazione: nazione ?? this.nazione,
      coordinate: coordinate ?? this.coordinate,
    );
  }
}
