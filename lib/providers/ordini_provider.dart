import 'package:flutter/foundation.dart';
import '../models/ordine_ricambi.dart';
import '../services/ordini_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class OrdiniProvider with ChangeNotifier {
  final OrdiniService _ordiniService;
  final AuthService _authService;
  UserProfile? _currentUser;
  List<OrdineRicambi> _ordini = [];
  bool _isLoading = false;
  String? _error;
  StatoOrdine? _filtroStato;
  String? _filtroFornitore;
  DateTime? _lastUpdate;
  DateTime? _lastFilterChange;

  OrdiniProvider(this._ordiniService, this._authService) {
    _init();
  }

  // Getters esistenti
  List<OrdineRicambi> get ordini => _ordini;
  bool get isLoading => _isLoading;
  String? get error => _error;
  StatoOrdine? get filtroStato => _filtroStato;
  String? get filtroFornitore => _filtroFornitore;

  // Nuovi getters per le informazioni temporali
  String? get lastUpdateFormatted =>
      _lastUpdate != null ? AppDateUtils.formatDateTime(_lastUpdate!) : null;

  String get lastFilterChangeFormatted => _lastFilterChange != null
      ? AppDateUtils.timeAgo(_lastFilterChange!)
      : 'Mai';

  bool get needsRefresh =>
      _lastUpdate == null || AppDateUtils.minutesSince(_lastUpdate!) > 5;

  // Stream subscription per gli ordini con filtro temporale
  Stream<List<OrdineRicambi>> getOrdiniStream({
    StatoOrdine? stato,
    String? fornitoreId,
    DateTime? fromDate,
    DateTime? toDate,
  }) {
    if (_currentUser == null) return Stream.value([]);

    // Converti le date in UTC se specificate
    final from = fromDate != null ? AppDateUtils.toUtc(fromDate) : null;
    final to = toDate != null ? AppDateUtils.toUtc(toDate) : null;

    return _ordiniService.getOrdiniStream(
      userId: _currentUser!.id,
      stato: stato,
      fornitoreId: fornitoreId,
      fromDate: from,
      toDate: to,
    );
  }

  // Filtri migliorati con timestamp
  void setFiltroStato(StatoOrdine? stato) {
    _filtroStato = stato;
    _lastFilterChange = AppDateUtils.getCurrentDateTime();
    notifyListeners();
  }

  void setFiltroFornitore(String? fornitoreId) {
    _filtroFornitore = fornitoreId;
    _lastFilterChange = AppDateUtils.getCurrentDateTime();
    notifyListeners();
  }

  // CRUD Operations con timestamp
  Future<void> _init() async {
    _currentUser = await _authService.getCurrentUser();
    _lastUpdate = AppDateUtils.getCurrentDateTime();
  }

  Future<void> createOrdine(OrdineRicambi ordine) async {
    try {
      _setLoading(true);
      await _ordiniService.createOrdine(ordine);
      _lastUpdate = AppDateUtils.getCurrentDateTime();
    } catch (e) {
      _setError('Errore durante la creazione dell\'ordine: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateOrdine(OrdineRicambi ordine) async {
    try {
      _setLoading(true);
      await _ordiniService.updateOrdine(ordine);
      _lastUpdate = AppDateUtils.getCurrentDateTime();
    } catch (e) {
      _setError('Errore durante l\'aggiornamento dell\'ordine: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Metodi di utilità migliorati
  List<OrdineRicambi> getOrdiniInRange(DateTime start, DateTime end) {
    final startUtc = AppDateUtils.toUtc(start);
    final endUtc = AppDateUtils.toUtc(end);

    return _ordini.where((ordine) {
      final dataOrdine = AppDateUtils.toUtc(ordine.dataCreazione);
      return dataOrdine.isAfter(startUtc) && dataOrdine.isBefore(endUtc);
    }).toList();
  }

  List<OrdineRicambi> getOrdiniRecenti({int giorni = 7}) {
    final now = AppDateUtils.getCurrentDateTime();
    final limitDate = now.subtract(Duration(days: giorni));

    return _ordini
        .where((ordine) =>
            AppDateUtils.toUtc(ordine.dataCreazione).isAfter(limitDate))
        .toList();
  }

  Map<String, dynamic> getStatisticheOrdini() {
    final now = AppDateUtils.getCurrentDateTime();
    final ordiniRecenti = getOrdiniRecenti();

    return {
      'totaleOrdini': ordiniRecenti.length,
      'ultimoAggiornamento': AppDateUtils.formatDateTime(now),
      'periodoAnalisi':
          '${AppDateUtils.formatDate(now.subtract(const Duration(days: 7)))} - ${AppDateUtils.formatDate(now)}',
      'totaleImporto': calcolaTotaleOrdiniInCorso(),
      'mediaGiornaliera': calcolaTotaleOrdiniInCorso() / 7,
    };
  }

  // Utility methods privati
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String message) {
    _error = message;
    debugPrint(_error);
    notifyListeners();
  }

  // Extension methods per la gestione delle date
  bool isOrdineScaduto(OrdineRicambi ordine) {
    if (ordine.dataConsegnaPrevista == null) return false;
    return AppDateUtils.isDatePassed(ordine.dataConsegnaPrevista!);
  }

  String getStatoConsegna(OrdineRicambi ordine) {
    if (ordine.dataConsegnaPrevista == null) return 'Data non specificata';

    if (isOrdineScaduto(ordine)) {
      return 'In ritardo di ${AppDateUtils.daysSince(ordine.dataConsegnaPrevista!)} giorni';
    }

    final giorniMancanti = AppDateUtils.daysUntil(ordine.dataConsegnaPrevista!);
    return 'Consegna prevista tra $giorniMancanti giorni';
  }
}
