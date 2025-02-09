import 'package:decimal/decimal.dart';
import 'package:rational/rational.dart';

extension DecimalExtension on Decimal {
  static Decimal fromString(String value) => Decimal.parse(value);
  Decimal operator +(Decimal other) => this + other;
  Decimal operator -(Decimal other) => this - other;
  Decimal operator *(Decimal other) => this * other;
  Decimal operator /(Decimal other) =>
      (toRational() / other.toRational()).toDecimal();

  Rational toRational() => Rational.parse(toString());
}
