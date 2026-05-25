import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../data/models/category_model.dart';
import '../data/services/api_service.dart';

class CategoryViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<CategoryModel> categories = [];
  List<CategoryModel> _allCategories = [];

  CategoryViewModel() {
    fetchCategories();
  }

  Future<void> fetchCategories() async {
    try {
      _allCategories = await ApiService.getList('/categories', (json) => CategoryModel.fromJson(json));
      categories = List.from(_allCategories);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching categories: $e');
    }
  }

  int get totalPages {
    if (categories.isEmpty) return 1;
    return (categories.length / selectedEntries).ceil();
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

  void goToPage(int page) {
    currentPage = page;
    notifyListeners();
  }

  void searchCategory(String value) {
    if (value.trim().isEmpty) {
      categories = List.from(_allCategories);
    } else {
      final keyword = value.toLowerCase();
      categories = _allCategories.where((item) {
        return item.title.toLowerCase().contains(keyword) ||
            item.parent.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int index, bool value) async {
    final category = categories[index];
    final updated = category.copyWith(status: value);
    try {
      await ApiService.put('/categories/${category.id}', updated.toJson(), (json) => CategoryModel.fromJson(json));
      
      final mainIndex = _allCategories.indexWhere((e) => e.id == category.id);
      if (mainIndex != -1) {
        _allCategories[mainIndex] = updated;
      }
      categories[index] = updated;
      notifyListeners();
    } catch (e) {
      debugPrint('Error toggling status: $e');
    }
  }

  Future<void> addCategory(
    String title,
    String parent,
    String image,
    Uint8List? imageBytes,
  ) async {
    try {
      String uploadedImageUrl = image;
      if (imageBytes != null) {
        uploadedImageUrl = await ApiService.uploadImage(
          '/upload',
          fileBytes: imageBytes,
          fieldName: 'image',
          fileName: 'category_${DateTime.now().millisecondsSinceEpoch}.jpg',
        );
      } else if (image.isNotEmpty && !image.startsWith('http')) {
        uploadedImageUrl = await ApiService.uploadImage(
          '/upload',
          filePath: image,
          fieldName: 'image',
        );
      }

      final category = CategoryModel(
        id: 0,
        title: title,
        parent: parent,
        image: uploadedImageUrl,
        status: true,
      );

      final response = await ApiService.post('/categories', category.toJson(), (json) => CategoryModel.fromJson(json));
      _allCategories.add(response);
      categories = List.from(_allCategories);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding category: $e');
    }
  }

  Future<void> deleteCategory(int id) async {
    try {
      await ApiService.delete('/categories/$id');
      _allCategories.removeWhere((e) => e.id == id);
      categories = List.from(_allCategories);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting category: $e');
    }
  }

  Future<void> updateCategory(
    int id,
    String title,
    String parent,
    String image,
    Uint8List? imageBytes,
  ) async {
    try {
      String uploadedImageUrl = image;
      if (imageBytes != null) {
        uploadedImageUrl = await ApiService.uploadImage(
          '/upload',
          fileBytes: imageBytes,
          fieldName: 'image',
          fileName: 'category_${DateTime.now().millisecondsSinceEpoch}.jpg',
        );
      } else if (image.isNotEmpty && !image.startsWith('http')) {
        uploadedImageUrl = await ApiService.uploadImage(
          '/upload',
          filePath: image,
          fieldName: 'image',
        );
      }

      final index = _allCategories.indexWhere((e) => e.id == id);
      if (index != -1) {
        final old = _allCategories[index];
        final updated = old.copyWith(
          title: title,
          parent: parent,
          image: uploadedImageUrl.isEmpty ? old.image : uploadedImageUrl,
        );

        await ApiService.put('/categories/$id', updated.toJson(), (json) => CategoryModel.fromJson(json));
        _allCategories[index] = updated;
        categories = List.from(_allCategories);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error updating category: $e');
    }
  }
}