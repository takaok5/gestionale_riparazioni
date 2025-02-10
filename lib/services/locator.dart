import 'package:get_it/get_it.dart';
import 'auth_service.dart';
import 'firestore_service.dart';
import 'inventory_service.dart';
import 'notification_service.dart';
import 'ordini_service.dart';
import 'garanzia_service.dart';
import 'contabilita_service.dart';
import 'app_context_service.dart'; // Aggiunto per correttezza

final locator = GetIt.instance;

// Rimossa la funzione setupServiceLocator() duplicata e unita con setupLocator()
void setupLocator() {
  // Services
  locator.registerLazySingleton(() => AppContextService()); // Aggiunto perché richiesto da alcuni servizi
  locator.registerLazySingleton(() => AuthService());
  locator.registerLazySingleton(() => FirestoreService(locate<AppContextService>())); // Passaggio dipendenza
  locator.registerLazySingleton(() => InventoryService(locate<AppContextService>())); // Passaggio dipendenza
  locator.registerLazySingleton(() => NotificationService());
  locator.registerLazySingleton(() => OrdiniService());
  locator.registerLazySingleton(() => GaranziaService(locate<NotificationService>())); // Passaggio dipendenza
  locator.registerLazySingleton(() => ContabilitaService());
}

T locate<T extends Object>() => locator<T>();