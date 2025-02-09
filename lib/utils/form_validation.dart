class FormValidators {
  static String? required(String? value) {
    if (value == null || value.isEmpty) {
      return 'Campo obbligatorio';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Inserisci un indirizzo email';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Inserisci un indirizzo email valido';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Campo opzionale
    }
    if (!RegExp(r'^\+?[\d\s-]{8,}$').hasMatch(value)) {
      return 'Inserisci un numero di telefono valido';
    }
    return null;
  }

  static String? partitaIva(String? value) {
    if (value == null || value.isEmpty) {
      return 'Inserisci la partita IVA';
    }
    if (!RegExp(r'^\d{11}$').hasMatch(value)) {
      return 'La partita IVA deve contenere 11 cifre';
    }
    return null;
  }

  static String? codiceFiscale(String? value) {
    if (value == null || value.isEmpty) {
      return 'Inserisci il codice fiscale';
    }
    if (!RegExp(r'^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$').hasMatch(value)) {
      return 'Inserisci un codice fiscale valido';
    }
    return null;
  }

  static String? price(String? value) {
    if (value == null || value.isEmpty) {
      return 'Inserisci un prezzo';
    }
    if (!RegExp(r'^\d+([.,]\d{1,2})?$').hasMatch(value)) {
      return 'Inserisci un prezzo valido';
    }
    return null;
  }
}
