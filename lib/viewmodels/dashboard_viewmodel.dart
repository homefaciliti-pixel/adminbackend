import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../data/services/api_service.dart';

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
    try {
      isLoading = true;
      notifyListeners();

      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/dashboard'),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(response.body);
        if (body['success'] == true) {
          final List<dynamic> stats = body['data'];
          
          for (var item in stats) {
            final String name = item['name'] ?? '';
            final dynamic amount = item['totalAmount'];
            
            int intAmount = 0;
            if (amount is num) {
              intAmount = amount.toInt();
            } else if (amount != null) {
              intAmount = int.tryParse(amount.toString()) ?? 0;
            }

            switch (name) {
              case 'Total Users':
                totalUsers = intAmount;
                break;
              case 'Total Categories':
                totalCategories = intAmount;
                break;
              case 'Total Services':
                totalServices = intAmount;
                break;
              case 'Total Partners':
                totalPartners = intAmount;
                break;
              case 'Total Orders':
                totalOrders = intAmount;
                break;
              case 'Today Orders':
                todayOrders = intAmount;
                break;
              case 'Complete Orders':
                completeOrders = intAmount;
                break;
              case 'Assigned Orders':
                assignedOrders = intAmount;
                break;
              case 'Cancel Orders':
                cancelOrders = intAmount;
                break;
              case 'Total Supporters':
                totalSupporters = intAmount;
                break;
              case 'Subscription Earnings':
                subscriptionEarning = "₹${amount.toString()}";
                break;
              case 'Order Earnings':
                orderEarning = "₹${amount.toString()}";
                break;
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Error loading dashboard: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}