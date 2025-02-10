import '../utils/date_utils.dart' show AppDateUtils;

abstract class BaseService {
  final String collectionName;
  DateTime? _initializationTime;
  DateTime? _lastAccessTime;
  Map<String, DateTime> _operationTimestamps = {};

  BaseService(this.collectionName);

  // Getters per le informazioni temporali
  DateTime? get initializationTime => _initializationTime;
  DateTime? get lastAccessTime => _lastAccessTime;

  String get initializationTimeFormatted => _initializationTime != null
      ? AppDateUtils.formatDateTime(_initializationTime!)
      : 'Not initialized';

  String get lastAccessTimeFormatted => _lastAccessTime != null
      ? AppDateUtils.formatDateTime(_lastAccessTime!)
      : 'Never accessed';

  String get uptime => _initializationTime != null
      ? AppDateUtils.formatDuration(
          AppDateUtils.getCurrentDateTime().difference(_initializationTime!))
      : 'Not initialized';

  // Metodi base che tutti i servizi dovrebbero implementare
  Future<void> initialize() async {
    _initializationTime = AppDateUtils.getCurrentDateTime();
    await updateLastAccess('initialization');
  }

  Future<void> dispose() async {
    await updateLastAccess('disposal');
    _initializationTime = null;
  }

  // Metodi di utilità per il tracciamento temporale
  Future<void> updateLastAccess(String operation) async {
    _lastAccessTime = AppDateUtils.getCurrentDateTime();
    _operationTimestamps[operation] = _lastAccessTime!;
  }

  String getLastOperationTime(String operation) {
    final timestamp = _operationTimestamps[operation];
    return timestamp != null
        ? AppDateUtils.formatDateTime(timestamp)
        : 'Never performed';
  }

  Duration? getTimeSinceOperation(String operation) {
    final timestamp = _operationTimestamps[operation];
    return timestamp != null
        ? AppDateUtils.getCurrentDateTime().difference(timestamp)
        : null;
  }

  String getTimeSinceOperationFormatted(String operation) {
    final duration = getTimeSinceOperation(operation);
    return duration != null
        ? AppDateUtils.formatDuration(duration)
        : 'Never performed';
  }

  // Metodo per ottenere le statistiche temporali del servizio
  Map<String, String> getServiceTimeStats() {
    return {
      'Service': collectionName,
      'Initialization Time': initializationTimeFormatted,
      'Last Access Time': lastAccessTimeFormatted,
      'Uptime': uptime,
      'Operations Count': _operationTimestamps.length.toString(),
      'Last Operation': _lastAccessTime != null
          ? AppDateUtils.formatDateTime(_lastAccessTime!)
          : 'No operations',
    };
  }

  // Metodo per ottenere la cronologia delle operazioni
  Map<String, String> getOperationsHistory() {
    Map<String, String> history = {};
    _operationTimestamps.forEach((operation, timestamp) {
      history[operation] = AppDateUtils.formatDateTime(timestamp);
    });
    return history;
  }

  // Metodo per verificare se il servizio necessita di reinizializzazione
  bool needsReinitialization({Duration? maxAge}) {
    if (_initializationTime == null) return true;

    final age =
        AppDateUtils.getCurrentDateTime().difference(_initializationTime!);
    return maxAge != null && age > maxAge;
  }

  // Metodo per verificare se il servizio è stato usato di recente
  bool wasAccessedRecently({Duration? threshold}) {
    if (_lastAccessTime == null) return false;

    final timeSinceLastAccess =
        AppDateUtils.getCurrentDateTime().difference(_lastAccessTime!);
    return threshold != null && timeSinceLastAccess <= threshold;
  }

  // Metodo per verificare se è un giorno diverso dall'ultima operazione
  bool isNewDay() {
    if (_lastAccessTime == null) return true;
    return !AppDateUtils.isSameDay(
        _lastAccessTime!, AppDateUtils.getCurrentDateTime());
  }
}
