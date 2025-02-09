import 'package:flutter/material.dart';
import '../models/riparazione.dart';
import '../models/stato_riparazione.dart';
import '../services/firestore_service.dart';
import '../widgets/riparazione_card.dart';

class KanbanRiparazioniScreen extends StatefulWidget {
  final FirestoreService firestoreService;

  const KanbanRiparazioniScreen({
    Key? key,
    required this.firestoreService,
  }) : super(key: key);

  @override
  State<KanbanRiparazioniScreen> createState() =>
      _KanbanRiparazioniScreenState();
}

class _KanbanRiparazioniScreenState extends State<KanbanRiparazioniScreen> {
  final Map<StatoRiparazione, List<Riparazione>> _riparazioniPerStato = {};
  Map<StatoRiparazione, int> _conteggio = {};

  @override
  void initState() {
    super.initState();
    _initializeStati();
    _loadRiparazioni();
  }

  void _initializeStati() {
    for (var stato in StatoRiparazione.values) {
      _riparazioniPerStato[stato] = [];
      _conteggio[stato] = 0;
    }
  }

  void _loadRiparazioni() {
    widget.firestoreService.getRiparazioni().listen((riparazioni) {
      setState(() {
        _initializeStati();
        for (var riparazione in riparazioni) {
          _riparazioniPerStato[riparazione.stato]?.add(riparazione);
        }
        _updateConteggio();
      });
    });
  }

  void _updateConteggio() {
    for (var stato in StatoRiparazione.values) {
      _conteggio[stato] = _riparazioniPerStato[stato]?.length ?? 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kanban Riparazioni'),
      ),
      body: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: StatoRiparazione.values
              .map((stato) => _buildColonna(stato))
              .toList(),
        ),
      ),
    );
  }

  Widget _buildColonna(StatoRiparazione stato) {
    return Container(
      width: 300,
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: stato.color
                  .withValues(opacity: 0.2), // Aggiornato da withOpacity
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  stato.display,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_conteggio[stato]}',
                    style: TextStyle(
                      color: stato.color,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: DragTarget<Riparazione>(
              onWillAcceptWithDetails:
                  (details) => // Aggiornato da onWillAccept
                      details.data.stato != stato,
              onAcceptWithDetails: (details) => // Aggiornato da onAccept
                  _updateStato(details.data, stato),
              builder: (context, candidateData, rejectedData) {
                return ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: _riparazioniPerStato[stato]?.length ?? 0,
                  itemBuilder: (context, index) {
                    final riparazione = _riparazioniPerStato[stato]![index];
                    return Draggable<Riparazione>(
                      data: riparazione,
                      feedback: SizedBox(
                        width: 280,
                        child: RiparazioneCard(
                          riparazione: riparazione,
                          onTap: () {},
                        ),
                      ),
                      childWhenDragging: const SizedBox.shrink(),
                      child: RiparazioneCard(
                        riparazione: riparazione,
                        onTap: () => _showRiparazioneDetails(riparazione),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _updateStato(
    Riparazione riparazione,
    StatoRiparazione nuovoStato,
  ) async {
    try {
      await widget.firestoreService.updateRiparazioneStato(
        riparazione.id,
        nuovoStato,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showRiparazioneDetails(Riparazione riparazione) {
    // Implementa la navigazione ai dettagli della riparazione
  }
}
