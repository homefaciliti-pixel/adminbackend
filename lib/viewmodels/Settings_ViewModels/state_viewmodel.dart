import 'package:flutter/material.dart';
import '../../data/models/Settings models/state_model.dart';
import '../../data/services/api_service.dart';

class StateViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<StateModel> states = [];
  List<StateModel> _allStates = [];

  List<StateModel> get allStates => List.from(_allStates);

  StateViewModel() {
    fetchStates();
  }

  Future<void> fetchStates() async {
    try {
      _allStates = await ApiService.getList('/states', (json) => StateModel.fromJson(json));
      states = List.from(_allStates);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching states: $e');
    }
  }

  int get totalPages {
    if (states.isEmpty) return 1;
    return (states.length / selectedEntries).ceil();
  }

  List<StateModel> get paginatedStates {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > states.length) {
      end = states.length;
    }

    if (start >= states.length) {
      return [];
    }

    return states.sublist(start, end);
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

  void searchState(String value) {
    if (value.trim().isEmpty) {
      states = List.from(_allStates);
    } else {
      final keyword = value.toLowerCase();

      states = _allStates.where((item) {
        return item.name.toLowerCase().contains(keyword);
      }).toList();
    }

    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int id) async {
    final index = _allStates.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allStates[index];
      final updated = item.copyWith(status: !item.status);
      try {
        await ApiService.put('/states/$id', updated.toJson(), (json) => StateModel.fromJson(json));
        _allStates[index] = updated;
        states = List.from(_allStates);
        notifyListeners();
      } catch (e) {
        debugPrint('Error toggling state status: $e');
      }
    }
  }

  Future<void> addState({
    required String name,
  }) async {
    final newState = StateModel(
      id: 0,
      name: name,
      status: true,
    );
    try {
      final response = await ApiService.post('/states', newState.toJson(), (json) => StateModel.fromJson(json));
      _allStates.add(response);
      states = List.from(_allStates);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding state: $e');
    }
  }

  Future<void> updateState({
    required int id,
    required String name,
  }) async {
    final index = _allStates.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _allStates[index];
      final updated = old.copyWith(
        name: name,
      );
      try {
        await ApiService.put('/states/$id', updated.toJson(), (json) => StateModel.fromJson(json));
        _allStates[index] = updated;
        states = List.from(_allStates);
        notifyListeners();
      } catch (e) {
        debugPrint('Error updating state: $e');
      }
    }
  }

  Future<void> deleteState(int id) async {
    try {
      await ApiService.delete('/states/$id');
      _allStates.removeWhere((e) => e.id == id);
      states = List.from(_allStates);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting state: $e');
    }
  }
}
