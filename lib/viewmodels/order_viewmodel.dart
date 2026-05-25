import 'package:flutter/material.dart';
import '../data/models/order_model.dart';
import '../data/services/api_service.dart';

class OrderViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<OrderModel> orders = [];
  List<OrderModel> _allOrders = [];

  OrderViewModel() {
    fetchOrders();
  }

  Future<void> fetchOrders() async {
    try {
      _allOrders = await ApiService.getList('/orders', (json) => OrderModel.fromJson(json));
      orders = List.from(_allOrders);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching orders: $e');
    }
  }

  int get totalPages {
    if (orders.isEmpty) return 1;
    return (orders.length / selectedEntries).ceil();
  }

  List<OrderModel> get paginatedOrders {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > orders.length) {
      end = orders.length;
    }

    if (start >= orders.length) {
      return [];
    }

    return orders.sublist(start, end);
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

  void searchOrder(String value) {
    if (value.trim().isEmpty) {
      orders = List.from(_allOrders);
    } else {
      final keyword = value.toLowerCase();
      orders = _allOrders.where((item) {
        return item.serviceRequestNumber.toLowerCase().contains(keyword) ||
            item.serviceName.toLowerCase().contains(keyword) ||
            item.city.toLowerCase().contains(keyword) ||
            item.locality.toLowerCase().contains(keyword) ||
            item.vendorName.toLowerCase().contains(keyword) ||
            item.status.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }

  Future<void> deleteOrder(int id) async {
    try {
      await ApiService.delete('/orders/$id');
      _allOrders.removeWhere((e) => e.id == id);
      orders = List.from(_allOrders);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting order: $e');
    }
  }

  Future<void> assignVendor(int id, String vendorName) async {
    final index = _allOrders.indexWhere((e) => e.id == id);
    if (index != -1) {
      final updated = _allOrders[index].copyWith(
        status: "Assigned",
        vendorName: vendorName,
      );
      try {
        await ApiService.put('/orders/$id', updated.toJson(), (json) => OrderModel.fromJson(json));
        _allOrders[index] = updated;
        
        final visIndex = orders.indexWhere((e) => e.id == id);
        if (visIndex != -1) {
          orders[visIndex] = updated;
        }
        notifyListeners();
      } catch (e) {
        debugPrint('Error assigning vendor: $e');
      }
    }
  }

  Future<void> updateStatus(int id, String status) async {
    final index = _allOrders.indexWhere((e) => e.id == id);
    if (index != -1) {
      final updated = _allOrders[index].copyWith(
        status: status,
      );
      try {
        await ApiService.put('/orders/$id', updated.toJson(), (json) => OrderModel.fromJson(json));
        _allOrders[index] = updated;

        final visIndex = orders.indexWhere((e) => e.id == id);
        if (visIndex != -1) {
          orders[visIndex] = updated;
        }
        notifyListeners();
      } catch (e) {
        debugPrint('Error updating order status: $e');
      }
    }
  }

  Future<void> unassignVendor(int id) async {
    final index = _allOrders.indexWhere((e) => e.id == id);
    if (index != -1) {
      final updated = _allOrders[index].copyWith(
        vendorName: "",
        status: "Pending",
      );
      try {
        await ApiService.put('/orders/$id', updated.toJson(), (json) => OrderModel.fromJson(json));
        _allOrders[index] = updated;

        final visIndex = orders.indexWhere((e) => e.id == id);
        if (visIndex != -1) {
          orders[visIndex] = updated;
        }
        notifyListeners();
      } catch (e) {
        debugPrint('Error unassigning vendor: $e');
      }
    }
  }

  int get totalPendingCount =>
      _allOrders.where((e) => e.status.toLowerCase() == "pending").length;

  int get totalAssignedCount =>
      _allOrders.where((e) => e.status.toLowerCase() == "assigned").length;

  int get totalCompletedCount =>
      _allOrders.where((e) => e.status.toLowerCase() == "completed").length;

  int get totalCancelledCount =>
      _allOrders.where((e) => e.status.toLowerCase() == "cancelled").length;
}