import 'package:flutter/material.dart';
import '../data/models/page_model.dart';
import '../data/services/api_service.dart';

class PageViewModel extends ChangeNotifier {
  List<PageModel> pages = [];
  List<PageModel> _allPages = [];

  PageViewModel() {
    fetchPages();
  }

  Future<void> fetchPages() async {
    try {
      _allPages = await ApiService.getList('/pages', (json) => PageModel.fromJson(json));
      pages = List.from(_allPages);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching pages: $e');
    }
  }

  Future<void> updatePage({
    required int id,
    required String title,
    required String description,
  }) async {
    final index = _allPages.indexWhere((e) => e.id == id);
    if (index != -1) {
      final updated = _allPages[index].copyWith(
        title: title,
        description: description,
      );
      try {
        await ApiService.put('/pages/$id', updated.toJson(), (json) => PageModel.fromJson(json));
        _allPages[index] = updated;
        pages = List.from(_allPages);
        notifyListeners();
      } catch (e) {
        debugPrint('Error updating page: $e');
      }
    }
  }
}