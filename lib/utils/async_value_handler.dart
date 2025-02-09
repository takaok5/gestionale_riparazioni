import 'package:flutter/material.dart';

class AsyncValueHandler<T> extends StatelessWidget {
  final Future<T> future;
  final Widget Function(T data) onData;
  final Widget Function(String error)? onError;
  final Widget? loadingWidget;

  const AsyncValueHandler({
    Key? key,
    required this.future,
    required this.onData,
    this.onError,
    this.loadingWidget,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return loadingWidget ??
              const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          final error = ErrorHandler.handleException(snapshot.error);
          return onError?.call(error) ??
              ErrorHandlerWidget(
                message: error,
                onRetry: () {
                  // Force rebuild
                  (context as Element).markNeedsBuild();
                },
              );
        }

        if (!snapshot.hasData) {
          return const Center(
            child: Text('Nessun dato disponibile'),
          );
        }

        return onData(snapshot.data as T);
      },
    );
  }
}
