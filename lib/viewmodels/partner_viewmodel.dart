import 'package:flutter/material.dart';
import '../data/models/partner_model.dart';
import '../data/services/api_service.dart';

enum PartnerDetailTab {
  detail,
  additional,
  kyc,
  wallet,
  reviews,
  bookings,
}

class PartnerViewModel extends ChangeNotifier {
  int selectedEntries = 10;
  int currentPage = 1;
  List<PartnerModel> partners = [];
  List<PartnerModel> _allPartners = [];

  PartnerViewModel() {
    fetchPartners();
  }

  Future<void> fetchPartners() async {
    try {
      _allPartners = await ApiService.getList('/partners', (json) => PartnerModel.fromJson(json));
      partners = List.from(_allPartners);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching partners: $e');
    }
  }

  int get totalPages {
    if (partners.isEmpty) return 1;
    return (partners.length / selectedEntries).ceil();
  }

  List<PartnerModel> get approvedPartners {
    return _allPartners.where((e) => e.isApproved).toList();
  }

  List<PartnerModel> get pendingPartners {
    return _allPartners.where((e) => !e.isApproved).toList();
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

  void searchPartner(String value) {
    if (value.trim().isEmpty) {
      partners = List.from(_allPartners);
    } else {
      final keyword = value.toLowerCase();
      partners = _allPartners.where((item) {
        return item.name.toLowerCase().contains(keyword) ||
            item.email.toLowerCase().contains(keyword) ||
            item.mobile.toLowerCase().contains(keyword) ||
            item.city.toLowerCase().contains(keyword) ||
            item.state.toLowerCase().contains(keyword) ||
            item.locality.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }

  Future<void> toggleStatus(int index, bool value) async {
    final partner = partners[index];
    final updated = partner.copyWith(status: value);
    try {
      await ApiService.put('/partners/${partner.id}', updated.toJson(), (json) => PartnerModel.fromJson(json));
      
      final mainIndex = _allPartners.indexWhere((e) => e.id == partner.id);
      if (mainIndex != -1) {
        _allPartners[mainIndex] = updated;
      }
      partners[index] = updated;
      notifyListeners();
    } catch (e) {
      debugPrint('Error toggling partner status: $e');
    }
  }

  Future<void> approvePartner(int id) async {
    final index = _allPartners.indexWhere((e) => e.id == id);
    if (index != -1) {
      final updated = _allPartners[index].copyWith(
        isApproved: true,
        status: true,
      );
      try {
        await ApiService.put('/partners/$id', updated.toJson(), (json) => PartnerModel.fromJson(json));
        _allPartners[index] = updated;
        partners = List.from(_allPartners);
        notifyListeners();
      } catch (e) {
        debugPrint('Error approving partner: $e');
      }
    }
  }

  Future<void> disapprovePartner(int id) async {
    final index = _allPartners.indexWhere((e) => e.id == id);
    if (index != -1) {
      final updated = _allPartners[index].copyWith(
        isApproved: true,
        status: false,
      );
      try {
        await ApiService.put('/partners/$id', updated.toJson(), (json) => PartnerModel.fromJson(json));
        _allPartners[index] = updated;
        partners = List.from(_allPartners);
        notifyListeners();
      } catch (e) {
        debugPrint('Error disapproving partner: $e');
      }
    }
  }

  PartnerModel? selectedPartner;
  PartnerDetailTab currentTab = PartnerDetailTab.detail;

  void selectPartner(PartnerModel partner) {
    selectedPartner = partner;
    currentTab = PartnerDetailTab.detail;
    notifyListeners();
  }

  void clearSelectedPartner() {
    selectedPartner = null;
    notifyListeners();
  }

  void changeTab(PartnerDetailTab tab) {
    currentTab = tab;
    notifyListeners();
  }

  Future<void> updatePartner(PartnerModel updatedPartner) async {
    try {
      await ApiService.put('/partners/${updatedPartner.id}', updatedPartner.toJson(), (json) => PartnerModel.fromJson(json));
      final index = _allPartners.indexWhere((e) => e.id == updatedPartner.id);
      if (index != -1) {
        _allPartners[index] = updatedPartner;
        partners = List.from(_allPartners);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error updating partner: $e');
    }
  }

  Future<void> deletePartner(int id) async {
    try {
      await ApiService.delete('/partners/$id');
      _allPartners.removeWhere((e) => e.id == id);
      partners = List.from(_allPartners);
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error deleting partner: $e');
    }
  }

  int get totalApprovedCount => approvedPartners.length;
  int get totalPendingCount => pendingPartners.length;

  void loadApprovedPartners() {
    partners = List.from(approvedPartners);
    currentPage = 1;
    notifyListeners();
  }

  void loadPendingPartners() {
    partners = List.from(pendingPartners);
    currentPage = 1;
    notifyListeners();
  }

  void searchPendingPartner(String value) {
    if (value.trim().isEmpty) {
      partners = List.from(pendingPartners);
    } else {
      final keyword = value.toLowerCase();
      partners = pendingPartners.where((item) {
        return item.name.toLowerCase().contains(keyword) ||
            item.email.toLowerCase().contains(keyword) ||
            item.mobile.toLowerCase().contains(keyword) ||
            item.city.toLowerCase().contains(keyword) ||
            item.state.toLowerCase().contains(keyword) ||
            item.locality.toLowerCase().contains(keyword);
      }).toList();
    }
    currentPage = 1;
    notifyListeners();
  }
}
