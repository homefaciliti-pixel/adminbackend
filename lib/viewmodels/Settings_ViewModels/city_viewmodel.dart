import 'package:flutter/material.dart';
import '../../data/models/Settings models/city_model.dart';
import '../../data/services/api_service.dart';

class CityViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<CityModel> cities = [];
  List<CityModel> _allCities = [];

  List<CityModel> get allCities => List.from(_allCities);

  CityViewModel() {
    fetchCities();
  }

  Future<void> fetchCities() async {
    try {
      _allCities = await ApiService.getList('/cities', (json) => CityModel.fromJson(json));
      cities = List.from(_allCities);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching cities: $e');
    }
  }

  int get totalPages {
    if (cities.isEmpty) return 1;
    return (cities.length / selectedEntries).ceil();
  }

  List<CityModel> get paginatedCities {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > cities.length) {
      end = cities.length;
    }

    if (start >= cities.length) {
      return [];
    }

    return cities.sublist(start, end);
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

  void searchCity(String value) {
    if (value.trim().isEmpty) {
      cities = List.from(_allCities);
    } else {
      final keyword = value.toLowerCase();
      cities = _allCities.where((item) {
        return item.cityName.toLowerCase().contains(keyword) ||
            item.stateName.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int id) async {
    final index = _allCities.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allCities[index];
      final updated = item.copyWith(status: !item.status);
      try {
        await ApiService.put('/cities/$id', updated.toJson(), (json) => CityModel.fromJson(json));
        _allCities[index] = updated;
        cities = List.from(_allCities);
        notifyListeners();
      } catch (e) {
        debugPrint('Error toggling city status: $e');
      }
    }
  }

  Future<void> addCity({
    required String cityName,
    required String stateName,
  }) async {
    final newCity = CityModel(
      id: 0,
      cityName: cityName,
      stateName: stateName,
      status: true,
    );
    try {
      final response = await ApiService.post('/cities', newCity.toJson(), (json) => CityModel.fromJson(json));
      _allCities.add(response);
      cities = List.from(_allCities);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding city: $e');
    }
  }

  Future<void> updateCity({
    required int id,
    required String cityName,
    required String stateName,
  }) async {
    final index = _allCities.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _allCities[index];
      final updated = old.copyWith(
        cityName: cityName,
        stateName: stateName,
      );
      try {
        await ApiService.put('/cities/$id', updated.toJson(), (json) => CityModel.fromJson(json));
        _allCities[index] = updated;
        cities = List.from(_allCities);
        notifyListeners();
      } catch (e) {
        debugPrint('Error updating city: $e');
      }
    }
  }

  Future<void> deleteCity(int id) async {
    try {
      await ApiService.delete('/cities/$id');
      _allCities.removeWhere((e) => e.id == id);
      cities = List.from(_allCities);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting city: $e');
    }
  }
}