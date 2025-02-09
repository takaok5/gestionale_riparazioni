// Material Design
export 'package:flutter/material.dart' hide TextDirection;
// Firebase
export 'package:cloud_firestore/cloud_firestore.dart';
export 'package:firebase_auth/firebase_auth.dart';
export 'package:firebase_core/firebase_core.dart';
export 'package:firebase_messaging/firebase_messaging.dart';

// Packages di terze parti
export 'package:flutter_local_notifications/flutter_local_notifications.dart';
export 'package:timeago/timeago.dart';
export 'package:fl_chart/fl_chart.dart';
export 'package:intl/intl.dart';

// Models
export '../models/activity.dart';
export '../models/categoria.dart';
export '../models/cliente.dart';
export '../models/fornitore.dart';
export '../models/movimento_magazzino.dart';
export '../models/ordine.dart';
export '../models/ricambio.dart';
export '../models/user_profile.dart';
export '../models/stato_riparazione.dart';
export '../models/riparazione.dart';
export '../models/garanzia.dart';
export '../models/impostazioni_colori.dart';
export '../models/ordine_ricambi.dart';
export '../models/base_model.dart';
export '../models/contatto.dart';
export '../models/preventivo.dart';
export '../models/ricambio_ordinato.dart';
export '../models/dettagli_contabili.dart';
export '../models/tipo_riparazione.dart';
// Services
export '../services/auth_service.dart';
export '../services/contabilita_service.dart';
export '../services/firestore_service.dart';
export '../services/fornitori_service.dart';
export '../services/inventory_service.dart';
export '../services/notification_service.dart';
export '../services/garanzia_service.dart';
export '../services/ordini_service.dart';

// Providers
export 'package:gestionale_riparazioni/providers/app_state.dart';
export '../providers/settings_provider.dart';

// Widgets
export '../widgets/riparazione_card.dart';
export '../widgets/form_nuova_richiesta.dart';
export '../widgets/form_appuntamento.dart';
export '../widgets/garanzia_form.dart';
export '../widgets/fornitore_form.dart';
export '../widgets/ordine_form.dart';
export '../widgets/ricambio_form.dart';
export '../widgets/recent_activities.dart';

// Utils
export '../utils/form_validators.dart';
export '../utils/date_formatter.dart';
// Enums
export '../models/enums.dart';
