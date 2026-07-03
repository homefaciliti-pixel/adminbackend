import 'package:flutter/material.dart';
import '../../data/models/Settings models/banner_model.dart';
import '../../data/services/api_service.dart';

class BannerViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<BannerModel> banners = [];
  List<BannerModel> _allBanners = [];

  BannerViewModel() {
    fetchBanners();
  }

  Future<void> fetchBanners() async {
    try {
      _allBanners = await ApiService.getList('/banners', (json) => BannerModel.fromJson(json));
      banners = List.from(_allBanners);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching banners: $e');
    }
  }

  int get totalPages {
    if (banners.isEmpty) return 1;
    return (banners.length / selectedEntries).ceil();
  }

  List<BannerModel> get paginatedBanners {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > banners.length) {
      end = banners.length;
    }

    if (start >= banners.length) {
      return [];
    }

    return banners.sublist(start, end);
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

  void searchBanner(String value) {
    if (value.trim().isEmpty) {
      banners = List.from(_allBanners);
    } else {
      final keyword = value.toLowerCase();
      banners = _allBanners.where((item) {
        return item.title.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int id) async {
    final index = _allBanners.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allBanners[index];
      final updated = item.copyWith(status: !item.status);
      try {
        await ApiService.put('/banners/$id', updated.toJson(), (json) => BannerModel.fromJson(json));
        _allBanners[index] = updated;
        banners = List.from(_allBanners);
        notifyListeners();
      } catch (e) {
        debugPrint('Error toggling banner status: $e');
      }
    }
  }

  Future<void> addBanner({
    required String title,
    required String image,
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

      final newBanner = BannerModel(
        id: 0,
        title: title,
        image: uploadedImageUrl,
        status: true,
      );

      final response = await ApiService.post('/banners', newBanner.toJson(), (json) => BannerModel.fromJson(json));
      _allBanners.add(response);
      banners = List.from(_allBanners);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding banner: $e');
    }
  }

  Future<void> updateBanner({
    required int id,
    required String title,
    required String image,
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

      final index = _allBanners.indexWhere((e) => e.id == id);
      if (index != -1) {
        final old = _allBanners[index];
        final updated = old.copyWith(
          title: title,
          image: uploadedImageUrl.isEmpty ? old.image : uploadedImageUrl,
        );

        await ApiService.put('/banners/$id', updated.toJson(), (json) => BannerModel.fromJson(json));
        _allBanners[index] = updated;
        banners = List.from(_allBanners);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error updating banner: $e');
    }
  }

  Future<void> deleteBanner(int id) async {
    try {
      await ApiService.delete('/banners/$id');
      _allBanners.removeWhere((e) => e.id == id);
      banners = List.from(_allBanners);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting banner: $e');
    }
  }
}