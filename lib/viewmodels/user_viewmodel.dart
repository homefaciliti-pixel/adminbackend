import 'package:admin_panel/data/models/user_model.dart';
import 'package:admin_panel/data/services/api_service.dart';
import 'package:flutter/material.dart';

class UserViewmodel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;

  List<UserModel> _allUsers = [];
  List<UserModel> users = [];

  List<UserModel> get paginatedUsers {
    final start = (currentPage - 1) * selectedEntries;
    int end = start + selectedEntries;

    if (end > users.length) {
      end = users.length;
    }

    if (start >= users.length) {
      return [];
    }
    return users.sublist(start, end);
  }

  UserViewmodel() {
    fetchUsers();
  }

  Future<void> fetchUsers() async {
    try {
      _allUsers = await ApiService.getList('/users', (json) => UserModel.fromJson(json));
      users = List.from(_allUsers);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching users: $e');
    }
  }

  int get totalPages {
    if (users.isEmpty) return 1;
    return (users.length / selectedEntries).ceil();
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

  void searchUser(String value) {
    if (value.trim().isEmpty) {
      users = List.from(_allUsers);
    } else {
      final keyword = value.toLowerCase();
      users = _allUsers.where((item) {
        return item.name.toLowerCase().contains(keyword) ||
            item.mobile.toLowerCase().contains(keyword) ||
            item.email.toLowerCase().contains(keyword) ||
            item.address.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }

  Future<void> deleteUser(int id) async {
    try {
      await ApiService.delete('/users/$id');
      _allUsers.removeWhere((e) => e.id == id);
      users = List.from(_allUsers);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting user: $e');
    }
  }
}
