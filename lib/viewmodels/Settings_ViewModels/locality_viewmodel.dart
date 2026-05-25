import 'package:flutter/material.dart';
import 'locality_model.dart';
import '../../data/services/api_service.dart';

class LocalityViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<LocalityModel> localities = [];
  List<LocalityModel> _allLocalities = [];

  List<LocalityModel> get allLocalities => List.from(_allLocalities);

  LocalityViewModel() {
    fetchLocalities();
  }

  Future<void> fetchLocalities() async {
    try {
      _allLocalities = await ApiService.getList('/localities', (json) => LocalityModel.fromJson(json));
      localities = List.from(_allLocalities);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching localities: $e');
    }
  }

  int get totalPages {
    if (localities.isEmpty) return 1;
    return (localities.length / selectedEntries).ceil();
  }

  List<LocalityModel> get paginatedLocalities {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > localities.length) {
      end = localities.length;
    }

    if (start >= localities.length) {
      return [];
    }

    return localities.sublist(start, end);
  }

  void changeEntries(int value) {
    selectedEntries = value;
    currentPage = 1;
    notifyListeners();
  }

  void nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      notifyListeners();
    }
  }

  void previousPage() {
    if (currentPage > 1) {
      currentPage--;
      notifyListeners();
    }
  }

  void searchLocality(String value) {
    if (value.trim().isEmpty) {
      localities = List.from(_allLocalities);
    } else {
      final keyword = value.toLowerCase();

      localities = _allLocalities.where((item) {
        return item.localityName.toLowerCase().contains(keyword) ||
            item.cityName.toLowerCase().contains(keyword) ||
            item.stateName.toLowerCase().contains(keyword);
      }).toList();
    }

    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int id) async {
    final index = _allLocalities.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allLocalities[index];
      final updated = item.copyWith(status: !item.status);
      try {
        await ApiService.put('/localities/$id', updated.toJson(), (json) => LocalityModel.fromJson(json));
        _allLocalities[index] = updated;
        localities = List.from(_allLocalities);
        notifyListeners();
      } catch (e) {
        debugPrint('Error toggling locality status: $e');
      }
    }
  }

  Future<void> addLocality({
    required String localityName,
    required String cityName,
    required String stateName,
  }) async {
    final newLocality = LocalityModel(
      id: 0,
      localityName: localityName,
      cityName: cityName,
      stateName: stateName,
      status: true,
    );
    try {
      final response = await ApiService.post('/localities', newLocality.toJson(), (json) => LocalityModel.fromJson(json));
      _allLocalities.add(response);
      localities = List.from(_allLocalities);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding locality: $e');
    }
  }

  Future<void> updateLocality({
    required int id,
    required String localityName,
    required String cityName,
    required String stateName,
  }) async {
    final index = _allLocalities.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _allLocalities[index];
      final updated = old.copyWith(
        localityName: localityName,
        cityName: cityName,
        stateName: stateName,
      );
      try {
        await ApiService.put('/localities/$id', updated.toJson(), (json) => LocalityModel.fromJson(json));
        _allLocalities[index] = updated;
        localities = List.from(_allLocalities);
        notifyListeners();
      } catch (e) {
        debugPrint('Error updating locality: $e');
      }
    }
  }

  Future<void> deleteLocality(int id) async {
    try {
      await ApiService.delete('/localities/$id');
      _allLocalities.removeWhere((e) => e.id == id);
      localities = List.from(_allLocalities);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting locality: $e');
    }
  }
}