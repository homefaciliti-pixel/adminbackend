import 'package:flutter/material.dart';
import '../../data/models/Settings models/notification_model.dart';
import '../../data/services/api_service.dart';

class NotificationViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<NotificationModel> notifications = [];
  List<NotificationModel> _allNotifications = [];

  List<NotificationModel> get allNotifications => List.from(_allNotifications);

  NotificationViewModel() {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    try {
      _allNotifications = await ApiService.getList('/notifications', (json) => NotificationModel.fromJson(json));
      notifications = List.from(_allNotifications);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    }
  }

  int get totalPages {
    if (notifications.isEmpty) return 1;
    return (notifications.length / selectedEntries).ceil();
  }

  List<NotificationModel> get paginatedNotifications {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > notifications.length) {
      end = notifications.length;
    }

    if (start >= notifications.length) {
      return [];
    }

    return notifications.sublist(start, end);
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

  void searchNotification(String value) {
    if (value.trim().isEmpty) {
      notifications = List.from(_allNotifications);
    } else {
      final keyword = value.toLowerCase();

      notifications = _allNotifications.where((item) {
        return item.title.toLowerCase().contains(keyword) ||
            item.message.toLowerCase().contains(keyword) ||
            item.audience.toLowerCase().contains(keyword);
      }).toList();
    }

    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int id) async {
    final index = _allNotifications.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allNotifications[index];
      final updated = item.copyWith(status: !item.status);
      try {
        await ApiService.put('/notifications/$id', updated.toJson(), (json) => NotificationModel.fromJson(json));
        _allNotifications[index] = updated;
        notifications = List.from(_allNotifications);
        notifyListeners();
      } catch (e) {
        debugPrint('Error toggling notification status: $e');
      }
    }
  }

  Future<void> addNotification({
    required String title,
    required String message,
    required String audience,
  }) async {
    final newNotification = NotificationModel(
      id: 0,
      title: title,
      message: message,
      audience: audience,
      createdAt: DateTime.now().toString().split(" ").first,
      status: true,
    );
    try {
      final response = await ApiService.post('/notifications', newNotification.toJson(), (json) => NotificationModel.fromJson(json));
      _allNotifications.add(response);
      notifications = List.from(_allNotifications);
      notifyListeners();
    } catch (e) {
      debugPrint('Error adding notification: $e');
    }
  }

  Future<void> updateNotification({
    required int id,
    required String title,
    required String message,
    required String audience,
  }) async {
    final index = _allNotifications.indexWhere((e) => e.id == id);
    if (index != -1) {
      final old = _allNotifications[index];
      final updated = old.copyWith(
        title: title,
        message: message,
        audience: audience,
      );
      try {
        await ApiService.put('/notifications/$id', updated.toJson(), (json) => NotificationModel.fromJson(json));
        _allNotifications[index] = updated;
        notifications = List.from(_allNotifications);
        notifyListeners();
      } catch (e) {
        debugPrint('Error updating notification: $e');
      }
    }
  }

  Future<void> deleteNotification(int id) async {
    try {
      await ApiService.delete('/notifications/$id');
      _allNotifications.removeWhere((e) => e.id == id);
      notifications = List.from(_allNotifications);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting notification: $e');
    }
  }

  Future<void> sendNotification(int id) async {
    final index = _allNotifications.indexWhere((e) => e.id == id);
    if (index != -1) {
      final item = _allNotifications[index];
      final updated = item.copyWith(
        isSent: true,
        sentAt: DateTime.now().toString().split(".").first,
      );
      try {
        await ApiService.put('/notifications/$id', updated.toJson(), (json) => NotificationModel.fromJson(json));
        _allNotifications[index] = updated;
        notifications = List.from(_allNotifications);
        notifyListeners();
      } catch (e) {
        debugPrint('Error sending notification: $e');
      }
    }
  }
}