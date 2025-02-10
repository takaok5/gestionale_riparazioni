import 'package:flutter/foundation.dart';
import '../models/ordine_ricambi.dart';
import '../services/ordini_service.dart';


  AppState(this._authService) {
    _init();
  }

  bool get isInitialized => _initialized;
  UserProfile? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  Future<void> _init() async {
    _authService.authStateChanges.listen((user) async {
      if (user != null) {
        _currentUser = await _authService.getCurrentUserProfile();
      } else {
        _currentUser = null;
      }
      _initialized = true;
      notifyListeners();
    });
  }

  Future<void> signIn(String email, String password) async {
    await _authService.signInWithEmailAndPassword(email, password);
  }

  Future<void> signOut() async {
    await _authService.signOut();
  }
}

class OrdiniProvider with ChangeNotifier {
  final OrdiniService _ordiniService = OrdiniService();
  final AuthService _authService;
  UserProfile? _currentUser; 
  List<OrdineRicambi> _ordini = [];
  bool _isLoading = false;
  String? _error;
  StatoOrdine? _filtroStato;
  String? _filtroFornitore;

  OrdiniProvider(this._ordiniService, this._authService) {
    _init();
  }

  // Getters
  List<OrdineRicambi> get ordini => _ordini;
  bool get isLoading => _isLoading;
  String? get error => _error;
  StatoOrdine? get filtroStato => _filtroStato;
  String? get filtroFornitore => _filtroFornitore;

  // Stream subscription per gli ordini
  Stream<List<OrdineRicambi>> getOrdiniStream({
    StatoOrdine? stato,
    String? fornitoreId,
  }) {
    if (_currentUser == null) return Stream.value([]);
    
    return _ordiniService.getOrdiniStream(
      userId: _currentUser!.id,
      stato: stato,
      fornitoreId: fornitoreId,
    );
  }
  // Filtri
  void setFiltroStato(StatoOrdine? stato) {
    _filtroStato = stato;
    notifyListeners();
  }

  void setFiltroFornitore(String? fornitoreId) {
    _filtroFornitore = fornitoreId;
    notifyListeners();
  }

  // CRUD Operations
  Future<void> _init() async {
    _currentUser = await _authService.getCurrentUser();
  }

  Future<void> createOrdine(OrdineRicambi ordine) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _ordiniService.createOrdine(ordine);
    } catch (e) {
      _error = 'Errore durante la creazione dell\'ordine: $e';
      debugPrint(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateOrdine(OrdineRicambi ordine) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _ordiniService.updateOrdine(ordine);
    } catch (e) {
      _error = 'Errore durante l\'aggiornamento dell\'ordine: $e';
      debugPrint(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteOrdine(String id) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _ordiniService.deleteOrdine(id);
    } catch (e) {
      _error = 'Errore durante l\'eliminazione dell\'ordine: $e';
      debugPrint(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateStatoOrdine(String id, StatoOrdine nuovoStato) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _ordiniService.updateStatoOrdine(id, nuovoStato);
    } catch (e) {
      _error = 'Errore durante l\'aggiornamento dello stato dell\'ordine: $e';
      debugPrint(_error);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Statistiche
  Future<Map<String, dynamic>> getStatisticheFornitori(
      String fornitoreId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      return await _ordiniService.getStatisticheFornitori(fornitoreId);
    } catch (e) {
      _error = 'Errore durante il recupero delle statistiche: $e';
      debugPrint(_error);
      return {};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Utility methods
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Filtra ordini per stato
  List<OrdineRicambi> getOrdiniByStato(StatoOrdine stato) {
    return _ordini.where((ordine) => ordine.stato == stato).toList();
  }

  // Calcola totale ordini in corso
  double calcolaTotaleOrdiniInCorso() {
    return _ordini
        .where((ordine) =>
            ordine.stato == StatoOrdine.inAttesa ||
            ordine.stato == StatoOrdine.confermato)
        .fold(0, (sum, ordine) => sum + ordine.totale);
  }

  // Ottieni ordini per fornitore
  List<OrdineRicambi> getOrdiniByFornitore(String fornitoreId) {
    return _ordini
        .where((ordine) => ordine.fornitoreId == fornitoreId)
        .toList();
  }
}
