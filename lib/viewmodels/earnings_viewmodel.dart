import 'package:flutter/material.dart';
import '../data/models/booking_earning_model.dart';
import '../data/models/subscription_earning_model.dart';
import '../data/services/api_service.dart';

enum EarningsTab {
  bookings,
  subscriptions,
}

class EarningsViewModel extends ChangeNotifier {
  EarningsTab currentTab = EarningsTab.bookings;

  void changeTab(EarningsTab tab) {
    currentTab = tab;
    notifyListeners();
  }

  List<BookingEarningModel> _allBookingEarnings = [];
  List<BookingEarningModel> bookingEarnings = [];

  List<SubscriptionEarningModel> _allSubscriptionEarnings = [];
  List<SubscriptionEarningModel> subscriptionEarnings = [];

  String searchText = "";

  EarningsViewModel() {
    fetchEarnings();
  }

  Future<void> fetchEarnings() async {
    try {
      _allBookingEarnings = await ApiService.getList('/earnings/booking', (json) => BookingEarningModel.fromJson(json));
      bookingEarnings = List.from(_allBookingEarnings);

      _allSubscriptionEarnings = await ApiService.getList('/earnings/subscription', (json) => SubscriptionEarningModel.fromJson(json));
      subscriptionEarnings = List.from(_allSubscriptionEarnings);

      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching earnings: $e');
    }
  }

  void searchBookings(String value) {
    searchText = value.trim();

    if (searchText.isEmpty) {
      bookingEarnings = List.from(_allBookingEarnings);
    } else {
      final keyword = searchText.toLowerCase();

      bookingEarnings = _allBookingEarnings.where((item) {
        return item.transactionId.toLowerCase().contains(keyword) ||
            item.paymentMethod.toLowerCase().contains(keyword) ||
            item.extraServicePaymentMethod.toLowerCase().contains(keyword) ||
            item.orderDate.toLowerCase().contains(keyword);
      }).toList();
    }

    notifyListeners();
  }

  void searchSubscriptions(String value) {
    searchText = value.trim();

    if (searchText.isEmpty) {
      subscriptionEarnings = List.from(_allSubscriptionEarnings);
    } else {
      final keyword = searchText.toLowerCase();

      subscriptionEarnings = _allSubscriptionEarnings.where((item) {
        return item.partnerName.toLowerCase().contains(keyword) ||
            item.status.toLowerCase().contains(keyword);
      }).toList();
    }

    notifyListeners();
  }

  double get totalBookingEarning {
    return _allBookingEarnings.fold(
      0,
      (sum, item) => sum + item.totalAmount,
    );
  }

  double get totalSubscriptionEarning {
    return _allSubscriptionEarnings.fold(
      0,
      (sum, item) => sum + item.amount,
    );
  }

  double get grandTotalEarning {
    return totalBookingEarning + totalSubscriptionEarning;
  }

  int get totalBookingCount => _allBookingEarnings.length;

  int get totalSubscriptionCount => _allSubscriptionEarnings.length;
}