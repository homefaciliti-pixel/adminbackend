import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/order_model.dart';
import '../../viewmodels/order_viewmodel.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<OrderViewModel>(
      builder: (context, vm, child) {
        return SingleChildScrollView(
          /// पूरा page scroll होगा
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              /// =====================================
              /// PAGE HEADER
              /// =====================================
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  /// LEFT TITLE
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Orders",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Home > Orders",
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),

                  /// SEARCH BOX
                  SizedBox(
                    width: 260,
                    child: TextField(
                      onChanged: vm.searchOrder,
                      decoration: InputDecoration(
                        hintText: "Search Order",
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              /// =====================================
              /// SHOW ENTRIES + PAGINATION TOP
              /// =====================================
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    /// LEFT SECTION
                    Row(
                      children: [
                        const Text(
                          "Show",
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(width: 10),

                        /// ENTRIES DROPDOWN
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.grey.shade300),
                          ),
                          child: DropdownButton<int>(
                            value: vm.selectedEntries,
                            underline: const SizedBox(),
                            items: [10, 20, 50, 100].map((e) {
                              return DropdownMenuItem(
                                value: e,
                                child: Text("$e"),
                              );
                            }).toList(),
                            onChanged: (value) {
                              if (value != null) {
                                vm.changeEntries(value);
                              }
                            },
                          ),
                        ),

                        const SizedBox(width: 10),
                        const Text("entries"),
                      ],
                    ),

                    /// RIGHT SECTION
                    Row(
                      children: [
                        InkWell(
                          onTap: vm.previousPage,
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: const Icon(Icons.chevron_left),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xff111827),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            "${vm.currentPage}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        InkWell(
                          onTap: vm.nextPage,
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: const Icon(Icons.chevron_right),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              /// =====================================
              /// TABLE
              /// =====================================
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: SizedBox(
                      width: 1750,
                      child: Column(
                        children: [
                          /// TABLE HEADER
                          Container(
                            padding: const EdgeInsets.all(14),
                            color: Colors.blue.shade50,
                            child: const Row(
                              children: [
                                Expanded(flex: 1, child: Text("ID")),
                                Expanded(
                                  flex: 3,
                                  child: Text("SERVICE REQUEST NUMBER"),
                                ),
                                Expanded(flex: 2, child: Text("SERVICE NAME")),
                                Expanded(
                                  flex: 2,
                                  child: Text("SERVICE AMOUNT"),
                                ),
                                Expanded(flex: 2, child: Text("SLOT TIME")),
                                Expanded(flex: 2, child: Text("SERVICE DATE")),
                                Expanded(flex: 2, child: Text("CITY")),
                                Expanded(flex: 2, child: Text("LOCALITY")),
                                Expanded(flex: 2, child: Text("STATUS")),
                                Expanded(flex: 2, child: Text("VENDOR NAME")),
                                Expanded(flex: 2, child: Text("ASSIGN VENDOR")),
                                Expanded(flex: 2, child: Text("CREATED AT")),
                              ],
                            ),
                          ),

                          /// TABLE BODY
                          SizedBox(
                            height: 520,
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: SizedBox(
                                width: 1750,
                                child: ListView.builder(
                                  itemCount: vm.paginatedOrders.length,
                                  itemBuilder: (context, index) {
                                    final item = vm.paginatedOrders[index];

                                    return Container(
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Colors.grey.shade200,
                                          ),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            flex: 1,
                                            child: Text(item.id.toString()),
                                          ),

                                          /// REQUEST NUMBER CLICKABLE
                                          Expanded(
                                            flex: 3,
                                            child: InkWell(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                              onTap: () {
                                                _showOrderDetails(
                                                  context,
                                                  item,
                                                );
                                              },
                                              child: Text(
                                                item.serviceRequestNumber,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  color: Colors.blue,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              item.serviceName,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              "₹${item.serviceAmount.toStringAsFixed(0)}",
                                            ),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(item.slotTime),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(item.serviceDate),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(item.city),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(item.locality),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: _statusChip(item.status),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              item.vendorName.isEmpty
                                                  ? "-"
                                                  : item.vendorName,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),

                                          /// ASSIGN VENDOR
                                          Expanded(
                                            flex: 2,
                                            child: OutlinedButton.icon(
                                              onPressed: () {
                                                _showAssignVendorSheet(
                                                  context,
                                                  vm,
                                                  item,
                                                );
                                              },
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: const Color(
                                                  0xff111827,
                                                ),
                                                side: const BorderSide(
                                                  color: Color(0xff111827),
                                                ),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 14,
                                                      vertical: 12,
                                                    ),
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                              ),
                                              icon: const Icon(
                                                Icons.person_add_alt_1,
                                                size: 18,
                                              ),
                                              label: const Text("Assign"),
                                            ),
                                          ),

                                          Expanded(
                                            flex: 2,
                                            child: Text(item.createdAt),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// =========================================
  /// STATUS CHIP
  /// =========================================
  Widget _statusChip(String status) {
    Color color;

    switch (status.toLowerCase()) {
      case "completed":
        color = Colors.green;
        break;
      case "assigned":
        color = Colors.blue;
        break;
      case "cancelled":
        color = Colors.red;
        break;
      default:
        color = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }

  /// =========================================
  /// ORDER DETAILS DIALOG
  /// =========================================
  void _showOrderDetails(BuildContext context, OrderModel item) {
    showDialog(
      context: context,
      builder: (_) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Order Details",
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),

                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _detailChip("Request No", item.serviceRequestNumber),
                      _detailChip("Service", item.serviceName),
                      _detailChip("Status", item.status),
                      _detailChip(
                        "Vendor",
                        item.vendorName.isEmpty ? "-" : item.vendorName,
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      _detailCard("ID", item.id.toString()),
                      _detailCard(
                        "Service Request No",
                        item.serviceRequestNumber,
                      ),
                      _detailCard("Service Name", item.serviceName),
                      _detailCard(
                        "Service Amount",
                        "₹${item.serviceAmount.toStringAsFixed(0)}",
                      ),
                      _detailCard("Slot Time", item.slotTime),
                      _detailCard("Service Date", item.serviceDate),
                      _detailCard("City", item.city),
                      _detailCard("Locality", item.locality),
                      _detailCard("Status", item.status),
                      _detailCard(
                        "Vendor Name",
                        item.vendorName.isEmpty ? "-" : item.vendorName,
                      ),
                      _detailCard("Created At", item.createdAt),
                      _detailCard("Address", item.address),
                    ],
                  ),

                  const SizedBox(height: 24),

                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xff111827),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 14,
                        ),
                      ),
                      child: const Text("Close"),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// =========================================
  /// ASSIGN / UNASSIGN BOTTOM SHEET
  /// =========================================
  void _showAssignVendorSheet(
    BuildContext context,
    OrderViewModel vm,
    OrderModel item,
  ) {
    final vendorController = TextEditingController(text: item.vendorName);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setState) {
            final bool isAssigned = item.vendorName.trim().isNotEmpty;

            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 50,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    "Assign Vendor",
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Request No: ${item.serviceRequestNumber}",
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 20),

                  /// VENDOR INPUT
                  TextField(
                    controller: vendorController,
                    decoration: InputDecoration(
                      labelText: "Vendor Name",
                      hintText: "Enter vendor name",
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  Text(
                    isAssigned
                        ? "This order is already assigned. You can unassign it."
                        : "Add vendor name to assign this order.",
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),

                  const SizedBox(height: 20),

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text("Cancel"),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            final vendorName = vendorController.text.trim();

                            if (vendorName.isNotEmpty) {
                              vm.assignVendor(item.id, vendorName);
                              Navigator.pop(context);
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xff111827),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: Text(isAssigned ? "Reassign" : "Assign"),
                        ),
                      ),
                    ],
                  ),

                  if (isAssigned) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          vm.unassignVendor(item.id);
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: const Text("Unassign Vendor"),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  /// =========================================
  /// DETAIL CARD
  /// =========================================
  Widget _detailCard(String title, String value) {
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
  /// DETAIL CHIP
  /// =========================================
  Widget _detailChip(String title, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xff111827),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        "$title: $value",
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
