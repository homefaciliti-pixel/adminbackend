import 'package:flutter/material.dart';
import '../data/models/service_model.dart';
import '../data/services/api_service.dart';

class ServiceViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<ServiceModel> services = [];
  List<ServiceModel> _allServices = [];

  ServiceViewModel() {
    fetchServices();
  }

  Future<void> fetchServices() async {
    try {
      _allServices = await ApiService.getList('/services', (json) => ServiceModel.fromJson(json));
      services = List.from(_allServices);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching services: $e');
    }
  }

  int get totalPages {
    if (services.isEmpty) return 1;
    return (services.length / selectedEntries).ceil();
  }

  List<ServiceModel> get paginatedServices {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > services.length) {
      end = services.length;
    }

    if (start >= services.length) {
      return [];
    }

    return services.sublist(start, end);
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

  void searchService(String value) {
    if (value.trim().isEmpty) {
      services = List.from(_allServices);
    } else {
      final keyword = value.toLowerCase();
      services = _allServices.where((item) {
        return item.title.toLowerCase().contains(keyword) ||
            item.description.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }

  Future<void> deleteService(int id) async {
    try {
      await ApiService.delete('/services/$id');
      _allServices.removeWhere((e) => e.id == id);
      services = List.from(_allServices);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting service: $e');
    }
  }

  Future<void> toggleStatus(int id) async {
    final index = _allServices.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allServices[index];
      final updated = item.copyWith(status: !item.status);
      try {
        await ApiService.put('/services/$id', updated.toJson(), (json) => ServiceModel.fromJson(json));
        _allServices[index] = updated;
        
        final visIndex = services.indexWhere((e) => e.id == id);
        if (visIndex != -1) {
          services[visIndex] = updated;
        }
        notifyListeners();
      } catch (e) {
        debugPrint('Error toggling service status: $e');
      }
    }
  }

  Future<void> addService({
    required String title,
    required double price,
    required String image,
    required String description,
  }) async {
    try {
      String uploadedImageUrl = image;
      if (image.isNotEmpty && !image.startsWith('http')) {
        uploadedImageUrl = await ApiService.uploadImage(
          '/upload',
          filePath: image,
          fieldName: 'image',
        );
      }

      final newService = ServiceModel(
        id: 0,
        title: title,
        price: price,
        image: uploadedImageUrl,
        description: description,
        status: true,
      );

      final response = await ApiService.post('/services', newService.toJson(), (json) => ServiceModel.fromJson(json));
      _allServices.add(response);
      services = List.from(_allServices);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding service: $e');
    }
  }
}