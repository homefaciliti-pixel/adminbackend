import 'package:flutter/material.dart';
import '../../data/models/Settings models/review_model.dart';
import '../../data/services/api_service.dart';

class ReviewViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<ReviewModel> reviews = [];
  List<ReviewModel> _allReviews = [];

  List<ReviewModel> get allReviews => List.from(_allReviews);

  ReviewViewModel() {
    fetchReviews();
  }

  Future<void> fetchReviews() async {
    try {
      _allReviews = await ApiService.getList('/reviews', (json) => ReviewModel.fromJson(json));
      reviews = List.from(_allReviews);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching reviews: $e');
    }
  }

  int get totalPages {
    if (reviews.isEmpty) return 1;
    return (reviews.length / selectedEntries).ceil();
  }

  List<ReviewModel> get paginatedReviews {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > reviews.length) {
      end = reviews.length;
    }

    if (start >= reviews.length) {
      return [];
    }

    return reviews.sublist(start, end);
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

  void searchReview(String value) {
    if (value.trim().isEmpty) {
      reviews = List.from(_allReviews);
    } else {
      final keyword = value.toLowerCase();

      reviews = _allReviews.where((item) {
        return item.userName.toLowerCase().contains(keyword) ||
            item.partnerName.toLowerCase().contains(keyword) ||
            item.serviceName.toLowerCase().contains(keyword) ||
            item.reviewText.toLowerCase().contains(keyword) ||
            item.rating.toString().contains(keyword);
      }).toList();
    }

    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int id) async {
    final index = _allReviews.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allReviews[index];
      final updated = item.copyWith(status: !item.status);
      try {
        await ApiService.put('/reviews/$id', updated.toJson(), (json) => ReviewModel.fromJson(json));
        _allReviews[index] = updated;
        reviews = List.from(_allReviews);
        notifyListeners();
      } catch (e) {
        debugPrint('Error toggling review status: $e');
      }
    }
  }

  Future<void> deleteReview(int id) async {
    try {
      await ApiService.delete('/reviews/$id');
      _allReviews.removeWhere((e) => e.id == id);
      reviews = List.from(_allReviews);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting review: $e');
    }
  }

  Future<void> addReview({
    required String userName,
    required String partnerName,
    required String serviceName,
    required double rating,
    required String reviewText,
  }) async {
    final newReview = ReviewModel(
      id: 0,
      userName: userName,
      partnerName: partnerName,
      serviceName: serviceName,
      rating: rating,
      reviewText: reviewText,
      status: true,
    );
    try {
      final response = await ApiService.post('/reviews', newReview.toJson(), (json) => ReviewModel.fromJson(json));
      _allReviews.add(response);
      reviews = List.from(_allReviews);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding review: $e');
    }
  }

  Future<void> updateReview({
    required int id,
    required String userName,
    required String partnerName,
    required String serviceName,
    required double rating,
    required String reviewText,
  }) async {
    final index = _allReviews.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _allReviews[index];
      final updated = old.copyWith(
        userName: userName,
        partnerName: partnerName,
        serviceName: serviceName,
        rating: rating,
        reviewText: reviewText,
      );
      try {
        await ApiService.put('/reviews/$id', updated.toJson(), (json) => ReviewModel.fromJson(json));
        _allReviews[index] = updated;
        reviews = List.from(_allReviews);
        notifyListeners();
      } catch (e) {
        debugPrint('Error updating review: $e');
      }
    }
  }
}
