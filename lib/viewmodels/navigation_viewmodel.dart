import 'package:flutter/material.dart';

class NavigationViewModel extends ChangeNotifier {
  String _currentPage = "Dashboard";

  String get currentPage => _currentPage;

  void changePage(String page) {
    _currentPage = page;
    notifyListeners();
  }
}