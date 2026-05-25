import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/partner_model.dart';
import '../../viewmodels/partner_viewmodel.dart';

class PartnerDetailsScreen extends StatefulWidget {
  final PartnerModel partner;

  const PartnerDetailsScreen({super.key, required this.partner});

  @override
  State<PartnerDetailsScreen> createState() => _PartnerDetailsScreenState();
}

class _PartnerDetailsScreenState extends State<PartnerDetailsScreen> {
  void _showEditDialog(
    BuildContext context,
    PartnerViewModel vm,
    PartnerModel partner,
  ) {
    final nameController = TextEditingController(text: partner.name);
    final emailController = TextEditingController(text: partner.email);
    final mobileController = TextEditingController(text: partner.mobile);
    final cityController = TextEditingController(text: partner.city);
    final stateController = TextEditingController(text: partner.state);
    final localityController = TextEditingController(text: partner.locality);
    final addressController = TextEditingController(text: partner.address);
    final genderController = TextEditingController(text: partner.gender);
    final experienceController = TextEditingController(
      text: partner.experience,
    );
    final aadhaarController = TextEditingController(
      text: partner.aadhaarNumber,
    );
    final panController = TextEditingController(text: partner.panNumber);
    final bankController = TextEditingController(text: partner.bankName);
    final accountController = TextEditingController(
      text: partner.accountNumber,
    );
    final ifscController = TextEditingController(text: partner.ifscCode);

    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Edit Partner"),
          content: SingleChildScrollView(
            child: SizedBox(
              width: 500,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: "Name"),
                  ),
                  TextField(
                    controller: emailController,
                    decoration: const InputDecoration(labelText: "Email"),
                  ),
                  TextField(
                    controller: mobileController,
                    decoration: const InputDecoration(labelText: "Mobile"),
                  ),
                  TextField(
                    controller: cityController,
                    decoration: const InputDecoration(labelText: "City"),
                  ),
                  TextField(
                    controller: stateController,
                    decoration: const InputDecoration(labelText: "State"),
                  ),
                  TextField(
                    controller: localityController,
                    decoration: const InputDecoration(labelText: "Locality"),
                  ),
                  TextField(
                    controller: addressController,
                    decoration: const InputDecoration(labelText: "Address"),
                  ),
                  TextField(
                    controller: genderController,
                    decoration: const InputDecoration(labelText: "Gender"),
                  ),
                  TextField(
                    controller: experienceController,
                    decoration: const InputDecoration(labelText: "Experience"),
                  ),
                  TextField(
                    controller: aadhaarController,
                    decoration: const InputDecoration(
                      labelText: "Aadhaar Number",
                    ),
                  ),
                  TextField(
                    controller: panController,
                    decoration: const InputDecoration(labelText: "PAN Number"),
                  ),
                  TextField(
                    controller: bankController,
                    decoration: const InputDecoration(labelText: "Bank Name"),
                  ),
                  TextField(
                    controller: accountController,
                    decoration: const InputDecoration(
                      labelText: "Account Number",
                    ),
                  ),
                  TextField(
                    controller: ifscController,
                    decoration: const InputDecoration(labelText: "IFSC Code"),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                final updated = partner.copyWith(
                  name: nameController.text.trim(),
                  email: emailController.text.trim(),
                  mobile: mobileController.text.trim(),
                  city: cityController.text.trim(),
                  state: stateController.text.trim(),
                  locality: localityController.text.trim(),
                  address: addressController.text.trim(),
                  gender: genderController.text.trim(),
                  experience: experienceController.text.trim(),
                  aadhaarNumber: aadhaarController.text.trim(),
                  panNumber: panController.text.trim(),
                  bankName: bankController.text.trim(),
                  accountNumber: accountController.text.trim(),
                  ifscCode: ifscController.text.trim(),
                );

                vm.updatePartner(updated);
                vm.selectPartner(updated);
                Navigator.pop(context);
              },
              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }

  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    /// screen open hote hi selected partner set kar do
    if (!_initialized) {
      final vm = context.read<PartnerViewModel>();
      vm.selectPartner(widget.partner);
      vm.changeTab(PartnerDetailTab.detail);
      _initialized = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PartnerViewModel>(
      builder: (context, vm, child) {
        final partner = vm.selectedPartner ?? widget.partner;

        return Scaffold(
          backgroundColor: const Color(0xffF8FAFC),

          appBar: AppBar(
            backgroundColor: const Color(0xff111827),
            foregroundColor: Colors.white,
            title: const Text("Partner Details"),
          ),

          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1200),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    /// =====================================
                    /// TOP PROFILE SECTION
                    /// =====================================
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          /// PROFILE IMAGE
                          CircleAvatar(
                            radius: 50,
                            backgroundColor: Colors.grey.shade200,
                            backgroundImage: partner.image.isNotEmpty
                                ? NetworkImage(partner.image)
                                : null,
                            child: partner.image.isEmpty
                                ? const Icon(Icons.person, size: 42)
                                : null,
                          ),

                          const SizedBox(width: 20),

                          /// NAME + EMAIL + BADGES
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  partner.name,
                                  style: const TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),

                                const SizedBox(height: 6),

                                Text(
                                  partner.email,
                                  style: TextStyle(
                                    fontSize: 15,
                                    color: Colors.grey.shade700,
                                  ),
                                ),

                                const SizedBox(height: 14),

                                Wrap(
                                  spacing: 10,
                                  runSpacing: 10,
                                  children: [
                                    _statusChip(
                                      text: partner.status
                                          ? "Active"
                                          : "Inactive",
                                      color: partner.status
                                          ? Colors.green
                                          : Colors.red,
                                    ),
                                    _statusChip(
                                      text: partner.isApproved
                                          ? "Approved"
                                          : "Pending Approval",
                                      color: partner.isApproved
                                          ? Colors.blue
                                          : Colors.orange,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          /// ACTION BUTTONS
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              if (partner.isApproved)
                                ElevatedButton.icon(
                                  onPressed: () {
                                    _showEditDialog(context, vm, partner);
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xff111827),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 18,
                                      vertical: 14,
                                    ),
                                  ),
                                  icon: const Icon(Icons.edit),
                                  label: const Text("Edit"),
                                )
                              else
                                ElevatedButton.icon(
                                  onPressed: () {
                                    vm.approvePartner(partner.id);
                                    Navigator.pop(context);
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 18,
                                      vertical: 14,
                                    ),
                                  ),
                                  icon: const Icon(Icons.verified),
                                  label: const Text("Approve"),
                                ),

                              OutlinedButton.icon(
                                onPressed: () {
                                  vm.disapprovePartner(partner.id);
                                  Navigator.pop(context);
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.red,
                                  side: const BorderSide(color: Colors.red),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 18,
                                    vertical: 14,
                                  ),
                                ),
                                icon: const Icon(Icons.block),
                                label: const Text("Disapprove"),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 22),

                    /// =====================================
                    /// TABS
                    /// =====================================
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _tabButton(
                              context,
                              vm,
                              PartnerDetailTab.detail,
                              "Detail",
                              Icons.person,
                            ),
                            _tabButton(
                              context,
                              vm,
                              PartnerDetailTab.additional,
                              "Additional Details",
                              Icons.info_outline,
                            ),
                            _tabButton(
                              context,
                              vm,
                              PartnerDetailTab.kyc,
                              "KYC Details",
                              Icons.verified_user,
                            ),
                            _tabButton(
                              context,
                              vm,
                              PartnerDetailTab.wallet,
                              "Wallet Settlement",
                              Icons.account_balance_wallet,
                            ),
                            _tabButton(
                              context,
                              vm,
                              PartnerDetailTab.reviews,
                              "Reviews & Ratings",
                              Icons.star,
                            ),
                            _tabButton(
                              context,
                              vm,
                              PartnerDetailTab.bookings,
                              "Partner Booking",
                              Icons.calendar_month,
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 22),

                    /// =====================================
                    /// TAB CONTENT
                    /// =====================================
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: _buildTabContent(vm, partner),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  /// =========================================
  /// TAB BUTTON
  /// =========================================
  Widget _tabButton(
    BuildContext context,
    PartnerViewModel vm,
    PartnerDetailTab tab,
    String label,
    IconData icon,
  ) {
    final selected = vm.currentTab == tab;

    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          vm.changeTab(tab);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: selected ? const Color(0xff111827) : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 18,
                color: selected ? Colors.white : Colors.grey.shade700,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : Colors.grey.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// =========================================
  /// TAB CONTENT SWITCH
  /// =========================================
  Widget _buildTabContent(PartnerViewModel vm, PartnerModel partner) {
    switch (vm.currentTab) {
      case PartnerDetailTab.detail:
        return _buildDetailTab(partner);

      case PartnerDetailTab.additional:
        return _buildAdditionalTab(partner);

      case PartnerDetailTab.kyc:
        return _buildKycTab(partner);

      case PartnerDetailTab.wallet:
        return _buildWalletTab(partner);

      case PartnerDetailTab.reviews:
        return _buildReviewsTab(partner);

      case PartnerDetailTab.bookings:
        return _buildBookingsTab(partner);
    }
  }

  /// =========================================
  /// DETAIL TAB
  /// =========================================
  Widget _buildDetailTab(PartnerModel partner) {
    return _sectionCard(
      title: "Basic Details",
      child: Wrap(
        spacing: 16,
        runSpacing: 16,
        children: [
          _fieldCard("Partner ID", partner.id.toString()),
          _fieldCard("Name", partner.name),
          _fieldCard("Email", partner.email),
          _fieldCard("Mobile", partner.mobile),
          _fieldCard("City", partner.city),
          _fieldCard("State", partner.state),
          _fieldCard("Locality", partner.locality),
          _fieldCard("Address", partner.address),
          _fieldCard("Created At", partner.createdAt),
          _fieldCard("Approved", partner.isApproved ? "Yes" : "No"),
          _fieldCard("Active", partner.status ? "Yes" : "No"),
        ],
      ),
    );
  }

  /// =========================================
  /// ADDITIONAL TAB
  /// =========================================
  Widget _buildAdditionalTab(PartnerModel partner) {
    return _sectionCard(
      title: "Additional Details",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _fieldCard("Gender", partner.gender),
              _fieldCard("Experience", partner.experience),
              _fieldCard("City", partner.city),
              _fieldCard("State", partner.state),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            "Services",
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: partner.services.isEmpty
                ? [_smallInfoChip("No services added")]
                : partner.services
                      .map((service) => _smallInfoChip(service))
                      .toList(),
          ),
        ],
      ),
    );
  }

  /// =========================================
  /// KYC TAB
  /// =========================================
  Widget _buildKycTab(PartnerModel partner) {
    return _sectionCard(
      title: "KYC Details",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _fieldCard("Aadhaar Number", partner.aadhaarNumber),
              _fieldCard("PAN Number", partner.panNumber),
              _fieldCard("Bank Name", partner.bankName),
              _fieldCard("Account Number", partner.accountNumber),
              _fieldCard("IFSC Code", partner.ifscCode),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            "Documents",
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: partner.documents.isEmpty
                ? [_smallInfoChip("No documents uploaded")]
                : partner.documents.map((doc) => _smallInfoChip(doc)).toList(),
          ),
        ],
      ),
    );
  }

  /// =========================================
  /// WALLET TAB
  /// =========================================
  Widget _buildWalletTab(PartnerModel partner) {
    return _sectionCard(
      title: "Wallet Settlement",
      child: Wrap(
        spacing: 16,
        runSpacing: 16,
        children: [
          _metricCard(
            "Wallet Balance",
            "₹${partner.walletBalance.toStringAsFixed(0)}",
            Icons.account_balance_wallet,
          ),
          _metricCard(
            "Total Earnings",
            "₹${partner.totalEarnings.toStringAsFixed(0)}",
            Icons.trending_up,
          ),
          _metricCard(
            "Withdrawn Amount",
            "₹${partner.withdrawnAmount.toStringAsFixed(0)}",
            Icons.currency_rupee,
          ),
        ],
      ),
    );
  }

  /// =========================================
  /// REVIEWS TAB
  /// =========================================
  Widget _buildReviewsTab(PartnerModel partner) {
    return _sectionCard(
      title: "Reviews & Ratings",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _metricCard(
                "Average Rating",
                partner.rating.toStringAsFixed(1),
                Icons.star,
              ),
              _metricCard(
                "Total Reviews",
                partner.totalReviews.toString(),
                Icons.rate_review,
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Review list will appear here from backend.",
                  style: TextStyle(fontSize: 14),
                ),
                SizedBox(height: 8),
                Text(
                  "Abhi ke liye summary cards ready hain.",
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// =========================================
  /// BOOKINGS TAB
  /// =========================================
  Widget _buildBookingsTab(PartnerModel partner) {
    return _sectionCard(
      title: "Partner Booking",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _metricCard(
                "Total Bookings",
                partner.totalBookings.toString(),
                Icons.book_online,
              ),
              _metricCard(
                "Completed",
                partner.completedBookings.toString(),
                Icons.verified,
              ),
              _metricCard(
                "Cancelled",
                partner.cancelledBookings.toString(),
                Icons.cancel,
              ),
              _metricCard(
                "Pending",
                partner.pendingBookings.toString(),
                Icons.pending_actions,
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Booking list will appear here from backend.",
                  style: TextStyle(fontSize: 14),
                ),
                SizedBox(height: 8),
                Text(
                  "Yaha future me booking rows, status, dates, aur actions aayenge.",
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// =========================================
  /// SHARED SECTION CARD
  /// =========================================
  Widget _sectionCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }

  /// =========================================
  /// INFO FIELD CARD
  /// =========================================
  Widget _fieldCard(String title, String value) {
    return Container(
      width: 260,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xffF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          Text(
            value.isEmpty ? "-" : value,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  /// =========================================
  /// METRIC CARD
  /// =========================================
  Widget _metricCard(String title, String value, IconData icon) {
    return Container(
      width: 260,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xffF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: const Color(0xff111827),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: Colors.white),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 6),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// =========================================
  /// SMALL CHIP
  /// =========================================
  Widget _smallInfoChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xff111827),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 13),
      ),
    );
  }

  /// =========================================
  /// STATUS CHIP
  /// =========================================
  Widget _statusChip({required String text, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}
