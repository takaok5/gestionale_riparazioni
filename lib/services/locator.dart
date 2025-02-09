import 'package:get_it/get_it.dart';
import 'auth_service.dart';
import 'firestore_service.dart';
import 'inventory_service.dart';
import 'notification_service.dart';
import 'ordini_service.dart';
import 'garanzia_service.dart';
import 'contabilita_service.dart';

final locator = GetIt.instance;

void setupServiceLocator() {
  getIt.registerLazySingleton<FirestoreService>(() => FirestoreService());
  getIt.registerLazySingleton<InventoryService>(() => InventoryService());
  getIt.registerLazySingleton<GaranziaService>(() => GaranziaService());
}

void setupLocator() {
  // Services
  locator.registerLazySingleton(() => AuthService());
  locator.registerLazySingleton(() => FirestoreService());
  locator.registerLazySingleton(() => InventoryService());
  locator.registerLazySingleton(() => NotificationService());
  locator.registerLazySingleton(() => OrdiniService());
  locator.registerLazySingleton(() => GaranziaService());
  locator.registerLazySingleton(() => ContabilitaService());
}

T locate<T extends Object>() => locator<T>();
