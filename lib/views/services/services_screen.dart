import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/service_viewmodel.dart';

class ServiceScreen extends StatelessWidget {
  const ServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ServiceViewModel>(
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
                        "Services",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Home > Services",
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),

                  /// ADD NEW BUTTON
                  ElevatedButton.icon(
                    onPressed: () {
                      _showAddDialog(context, vm);
                    },
                    icon: const Icon(Icons.add),
                    label: const Text("Add New"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xff111827),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 14,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              /// =====================================
              /// FILTERS ROW
              /// =====================================
              Row(
                children: [
                  /// SHOW ENTRIES
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: DropdownButton<int>(
                      value: vm.selectedEntries,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(value: 10, child: Text("10 Entries")),
                        DropdownMenuItem(value: 20, child: Text("20 Entries")),
                        DropdownMenuItem(value: 50, child: Text("50 Entries")),
                        DropdownMenuItem(value: 100, child: Text("100 Entries")),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          vm.changeEntries(value);
                        }
                      },
                    ),
                  ),

                  const Spacer(),

                  /// SEARCH BOX
                  SizedBox(
                    width: 260,
                    child: TextField(
                      onChanged: vm.searchService,
                      decoration: InputDecoration(
                        hintText: "Search Service",
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
              /// TABLE HEADER
              /// =====================================
              Container(
                padding: const EdgeInsets.all(14),
                color: Colors.blue.shade50,
                child: const Row(
                  children: [
                    Expanded(flex: 1, child: Text("#")),
                    Expanded(flex: 3, child: Text("Title")),
                    Expanded(flex: 2, child: Text("Price")),
                    Expanded(flex: 2, child: Text("Image")),
                    Expanded(flex: 4, child: Text("Description")),
                    Expanded(flex: 1, child: Text("Status")),
                    Expanded(flex: 1, child: Text("Action")),
                  ],
                ),
              ),

              /// =====================================
              /// TABLE BODY
              /// =====================================
              Expanded(
                child: Container(
                  color: Colors.white,
                  child: ListView.builder(
                    itemCount: vm.paginatedServices.length,
                    itemBuilder: (context, index) {
                      final item = vm.paginatedServices[index];

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
                              child: Text("${item.id}"),
                            ),

                            Expanded(
                              flex: 3,
                              child: Text(
                                item.title,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),

                            Expanded(
                              flex: 2,
                              child: Text("₹${item.price.toStringAsFixed(0)}"),
                            ),

                            /// IMAGE
                            Expanded(
                              flex: 2,
                              child: item.image.isEmpty
                                  ? const Icon(Icons.image)
                                  : ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  item.image,
                                  height: 45,
                                  width: 45,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(Icons.image);
                                  },
                                ),
                              ),
                            ),

                            Expanded(
                              flex: 4,
                              child: Text(
                                item.description,
                                overflow: TextOverflow.ellipsis,
                                maxLines: 2,
                              ),
                            ),

                            /// STATUS TOGGLE
                            Expanded(
                              flex: 1,
                              child: Switch(
                                value: item.status,
                                onChanged: (value) {
                                  vm.toggleStatus(item.id);
                                },
                              ),
                            ),

                            /// ACTION DELETE
                            Expanded(
                              flex: 1,
                              child: IconButton(
                                tooltip: "Delete",
                                icon: const Icon(
                                  Icons.delete,
                                  color: Colors.red,
                                ),
                                onPressed: () {
                                  _showDeleteDialog(context, vm, item.id, item.title);
                                },
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),

              const SizedBox(height: 15),

              /// =====================================
              /// PAGINATION
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
                    /// LEFT
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

                    /// RIGHT
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

  /// =========================================
  /// ADD NEW SERVICE DIALOG
  /// =========================================
  void _showAddDialog(BuildContext context, ServiceViewModel vm) {
    final titleController = TextEditingController();
    final priceController = TextEditingController();
    final imageController = TextEditingController();
    final descriptionController = TextEditingController();

    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Add Service"),
          content: SingleChildScrollView(
            child: SizedBox(
              width: 450,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(
                      labelText: "Title",
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: "Price",
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: imageController,
                    decoration: const InputDecoration(
                      labelText: "Image URL",
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: descriptionController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: "Description",
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                final title = titleController.text.trim();
                final price = double.tryParse(priceController.text.trim()) ?? 0;
                final image = imageController.text.trim();
                final description = descriptionController.text.trim();

                if (title.isNotEmpty) {
                  vm.addService(
                    title: title,
                    price: price,
                    image: image,
                    description: description,
                  );
                  Navigator.pop(context);
                }
              },
              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }

  /// =========================================
  /// DELETE CONFIRM DIALOG
  /// =========================================
  void _showDeleteDialog(
      BuildContext context,
      ServiceViewModel vm,
      int id,
      String title,
      ) {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Delete Service"),
          content: Text("Do you want to delete \"$title\"?"),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                vm.deleteService(id);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text("Delete"),
            ),
          ],
        );
      },
    );
  }
}