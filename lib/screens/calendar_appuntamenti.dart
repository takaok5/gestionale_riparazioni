import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import '../models/appuntamento.dart';
import '../utils/validators.dart';

class CalendarAppuntamenti extends StatefulWidget {
  final List<Appuntamento> appuntamenti;

  const CalendarAppuntamenti({
    Key? key,
    required this.appuntamenti,
  }) : super(key: key);

  @override
  State<CalendarAppuntamenti> createState() => _CalendarAppuntamentiState();
}

class _CalendarAppuntamentiState extends State<CalendarAppuntamenti> {
  late DateTime _focusedDay;
  late DateTime _selectedDay;
  late Map<DateTime, List<Appuntamento>> _events;

  @override
  void initState() {
    super.initState();
    _focusedDay = DateTime.now();
    _selectedDay = _focusedDay;
    _events = _groupAppuntamenti(widget.appuntamenti);
  }

  Map<DateTime, List<Appuntamento>> _groupAppuntamenti(
      List<Appuntamento> appuntamenti) {
    return {
      for (var app in appuntamenti)
        DateTime(app.dataOra.year, app.dataOra.month, app.dataOra.day): [
          ...appuntamenti.where((a) =>
              a.dataOra.year == app.dataOra.year &&
              a.dataOra.month == app.dataOra.month &&
              a.dataOra.day == app.dataOra.day)
        ]
    };
  }

  List<Appuntamento> _getEventsForDay(DateTime day) {
    return _events[day] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TableCalendar(
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
          },
          calendarStyle: const CalendarStyle(
            markersMaxCount: 1,
            markerDecoration: BoxDecoration(
              color: Colors.blue,
              shape: BoxShape.circle,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView(
            children: _getEventsForDay(_selectedDay)
                .map((appuntamento) => Card(
                      child: ListTile(
                        title: Text(
                            'Appuntamento ${Validators.formatTime(appuntamento.dataOra)}'),
                        subtitle: Text(appuntamento.note ?? ''),
                      ),
                    ))
                .toList(),
          ),
        ),
      ],
    );
  }
}
