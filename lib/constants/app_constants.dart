// ignore_for_file: constant_identifier_names

class AppConstants {
  const AppConstants._(); // Costruttore privato per prevenire l'istanziazione

  // App Info
  static const String APP_NAME = 'Sistema Gestione Riparazioni';
  static const String APP_VERSION = '1.0.0';
  static const String APP_BUILD = '1';
  static const String COMPANY_NAME = 'Your Company Name';
  static const String SUPPORT_EMAIL = 'support@example.com';
  static const String PRIVACY_POLICY_URL = 'https://example.com/privacy';
  static const String TERMS_URL = 'https://example.com/terms';

  // Firebase Collections
  static const String COLLECTION_USERS = 'users';
  static const String COLLECTION_RIPARAZIONI = 'riparazioni';
  static const String COLLECTION_CLIENTI = 'clienti';
  static const String COLLECTION_RICAMBI = 'ricambi';
  static const String COLLECTION_GARANZIE = 'garanzie';
  static const String COLLECTION_FORNITORI = 'fornitori';
  static const String COLLECTION_MESSAGGI = 'messaggi';
  static const String COLLECTION_LOGS = 'logs';
  static const String COLLECTION_SETTINGS = 'settings';
  static const String COLLECTION_NOTIFICATIONS = 'notifications';

  // Shared Preferences Keys
  static const String PREFS_USER = 'user_prefs';
  static const String PREFS_THEME = 'theme_prefs';
  static const String PREFS_LANGUAGE = 'language_prefs';
  static const String PREFS_NOTIFICATIONS = 'notifications_prefs';
  static const String PREFS_LAST_SYNC = 'last_sync';
  static const String PREFS_DEVICE_ID = 'device_id';
  static const String PREFS_FIRST_RUN = 'first_run';
  static const String PREFS_AUTO_LOGIN = 'auto_login';

  // Time Constants (in milliseconds)
  static const int TIMEOUT_CONNECTION = 10000; // 10 seconds
  static const int TIMEOUT_SESSION = 3600000; // 1 hour
  static const int TIMEOUT_CACHE = 86400000; // 24 hours
  static const int TIMEOUT_REFRESH_TOKEN = 1800000; // 30 minutes
  static const int DEBOUNCE_TIME = 500; // 0.5 seconds
  static const int THROTTLE_TIME = 2000; // 2 seconds

  // API Endpoints
  static const String API_BASE_URL = 'https://api.example.com';
  static const String API_VERSION = 'v1';

  // Cache Settings
  static const int CACHE_SIZE_MAX = 100 * 1024 * 1024; // 100MB
  static const int CACHE_ITEMS_MAX = 100;
  static const Duration CACHE_DURATION = Duration(days: 1);

  // Pagination
  static const int PAGE_SIZE = 20;
  static const int MAX_PAGE_SIZE = 100;

  // Validation Rules
  static const int MIN_PASSWORD_LENGTH = 8;
  static const int MAX_PASSWORD_LENGTH = 32;
  static const int MAX_USERNAME_LENGTH = 50;
  static const int MAX_EMAIL_LENGTH = 254;
  static const String PASSWORD_PATTERN =
      r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$';
  static const String EMAIL_PATTERN = r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$';

  // File Upload
  static const int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static const List<String> ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Stati Riparazione
  static const String STATO_IN_ATTESA = 'in_attesa';
  static const String STATO_IN_LAVORAZIONE = 'in_lavorazione';
  static const String STATO_COMPLETATA = 'completata';
  static const String STATO_CONSEGNATA = 'consegnata';
  static const String STATO_ANNULLATA = 'annullata';

  // Ruoli Utente
  static const String ROLE_ADMIN = 'admin';
  static const String ROLE_MANAGER = 'manager';
  static const String ROLE_TECNICO = 'tecnico';
  static const String ROLE_CLIENTE = 'cliente';

  // Messaggi di Errore
  static const String ERROR_GENERIC =
      'Si è verificato un errore. Riprova più tardi.';
  static const String ERROR_CONNECTION =
      'Errore di connessione. Verifica la tua connessione internet.';
  static const String ERROR_AUTHENTICATION =
      'Errore di autenticazione. Effettua nuovamente il login.';
  static const String ERROR_PERMISSION =
      'Non hai i permessi necessari per questa operazione.';
  static const String ERROR_VALIDATION = 'I dati inseriti non sono validi.';
  static const String ERROR_NOT_FOUND = 'Risorsa non trovata.';

  // Messaggi di Successo
  static const String SUCCESS_SAVE = 'Salvataggio completato con successo.';
  static const String SUCCESS_UPDATE = 'Aggiornamento completato con successo.';
  static const String SUCCESS_DELETE = 'Eliminazione completata con successo.';
  static const String SUCCESS_UPLOAD = 'Upload completato con successo.';
}
