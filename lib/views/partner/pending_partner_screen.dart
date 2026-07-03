import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/partner_viewmodel.dart';
import '../../widgets/partner/partner_table.dart';
import 'partner_details_screen.dart';

class PendingPartnerScreen extends StatefulWidget {
  const PendingPartnerScreen({super.key});

  @override
  State<PendingPartnerScreen> createState() => _PendingPartnerScreenState();
}

class _PendingPartnerScreenState extends State<PendingPartnerScreen> {
  bool _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    /// screen open hote hi pending list load ho
    if (!_loaded) {
      final vm = context.read<PartnerViewModel>();
      vm.loadPendingPartners();
      _loaded = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PartnerViewModel>(
      builder: (context, vm, child) {
        return Container(
          width: double.infinity,
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
                        "Pending Approval",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Home > Partners > Pending Approval",
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),

                  /// RIGHT SEARCH
                  SizedBox(
                    width: 260,
                    child: TextField(
                      onChanged: vm.searchPendingPartner,
                      decoration: InputDecoration(
                        hintText: "Search Partner",
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

              const SizedBox(height: 25),

              /// =====================================
              /// PARTNER TABLE
              /// =====================================
              Expanded(
                child: PartnerTable(
                  partners: vm.partners,
                  vm: vm,

                  /// name click
                  onPartnerTap: (item) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PartnerDetailsScreen(
                          partner: item,
                        ),
                      ),
                    );
                  },

                  /// edit click
                  onEditTap: (item) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PartnerDetailsScreen(
                          partner: item,
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 18),

              /// ======================================
              /// PAGINATION SECTION
              /// ======================================
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
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: Colors.grey.shade300,
                            ),
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
                              border: Border.all(
                                color: Colors.grey.shade300,
                              ),
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
                              border: Border.all(
                                color: Colors.grey.shade300,
                              ),
                            ),
                            child: const Icon(Icons.chevron_right),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}