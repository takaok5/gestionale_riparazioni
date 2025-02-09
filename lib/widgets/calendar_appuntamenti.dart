import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import '../models/riparazione.dart';

class CalendarAppuntamenti extends StatefulWidget {
  final List<Riparazione> riparazioni;
  final Function(DateTime) onDaySelected;

  const CalendarAppuntamenti({
    Key? key,
    required this.riparazioni,
    required this.onDaySelected,
  }) : super(key: key);

  @override
  State<CalendarAppuntamenti> createState() => _CalendarAppuntamentiState();
}

class _CalendarAppuntamentiState extends State<CalendarAppuntamenti> {
  late DateTime _focusedDay;
  late DateTime _selectedDay;

  @override
  void initState() {
    super.initState();
    _focusedDay = DateTime.now();
    _selectedDay = DateTime.now();
  }

  List<Riparazione> _getEventsForDay(DateTime day) {
    return widget.riparazioni.where((r) {
      return r.appuntamento != null && isSameDay(r.appuntamento!, day);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TableCalendar<Riparazione>(
          firstDay: DateTime.now().subtract(const Duration(days: 365)),
          lastDay: DateTime.now().add(const Duration(days: 365)),
          focusedDay: _focusedDay,
          selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
          eventLoader: _getEventsForDay,
          onDaySelected: (selectedDay, focusedDay) {
            setState(() {
              _selectedDay = selectedDay;
              _focusedDay = focusedDay;
            });
            widget.onDaySelected(selectedDay);
          },
          calendarStyle: const CalendarStyle(
            markersMaxCount: 3,
            markerSize: 8,
          ),
        ),
        const SizedBox(height: 16),
        ..._getEventsForDay(_selectedDay).map(
          (riparazione) => ListTile(
            title: Text('${riparazione.tipo} - ${riparazione.descrizione}'),
            subtitle: Text(riparazione.appuntamento != null
                ? 'Ore ${riparazione.appuntamento!.hour}:${riparazione.appuntamento!.minute.toString().padLeft(2, '0')}'
                : ''),
          ),
        ),
      ],
    );
  }
}
