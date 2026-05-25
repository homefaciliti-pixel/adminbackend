import 'package:flutter/material.dart';

class DashboardViewModel extends ChangeNotifier {
  bool isLoading = true;

  int totalUsers = 0;
  int totalCategories = 0;
  int totalServices = 0;
  int totalPartners = 0;
  int totalOrders = 0;
  int todayOrders = 0;
  int completeOrders = 0;
  int assignedOrders = 0;
  int cancelOrders = 0;
  int totalSupporters = 0;

  String subscriptionEarning = "₹0";
  String orderEarning = "₹0";

  DashboardViewModel() {
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    await Future.delayed(const Duration(milliseconds: 800));

    totalUsers = 1250;
    totalCategories = 24;
    totalServices = 88;
    totalPartners = 320;
    totalOrders = 5420;
    todayOrders = 36;
    completeOrders = 4800;
    assignedOrders = 210;
    cancelOrders = 62;
    totalSupporters = 14;

    subscriptionEarning = "₹85,000";
    orderEarning = "₹1,85,000";

    isLoading = false;
    notifyListeners();
  }
}