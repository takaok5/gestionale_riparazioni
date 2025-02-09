abstract class BaseService {
  final String collectionName;

  BaseService(this.collectionName);

  // Metodi base che tutti i servizi dovrebbero implementare
  Future<void> initialize();
  Future<void> dispose();
}
