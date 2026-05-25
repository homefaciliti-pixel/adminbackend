import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/Settings models/banner_model.dart';
import '../../viewmodels/Settings_ViewModels/banner_viewmodel.dart';

class BannerScreen extends StatelessWidget {
  const BannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<BannerViewModel>(
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
                        "Banner",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Home > Settings > Banner",
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
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xff111827),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 14,
                      ),
                    ),
                    icon: const Icon(Icons.add),
                    label: const Text("Add New"),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              /// =====================================
              /// SHOW ENTRIES + SEARCH
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
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 10),

                        /// ENTRIES DROPDOWN
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

                    /// SEARCH BOX
                    SizedBox(
                      width: 260,
                      child: TextField(
                        onChanged: vm.searchBanner,
                        decoration: InputDecoration(
                          hintText: "Search Banner",
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
              ),

              const SizedBox(height: 20),

              /// =====================================
              /// TABLE
              /// =====================================
              Expanded(
                child: Container(
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
                        width: 1200,
                        child: Column(
                          children: [
                            /// TABLE HEADER
                            Container(
                              padding: const EdgeInsets.all(14),
                              color: Colors.blue.shade50,
                              child: const Row(
                                children: [
                                  Expanded(flex: 1, child: Text("ID")),
                                  Expanded(flex: 3, child: Text("TITLE")),
                                  Expanded(flex: 3, child: Text("IMAGE")),
                                  Expanded(flex: 2, child: Text("STATUS")),
                                  Expanded(flex: 2, child: Text("ACTION")),
                                ],
                              ),
                            ),

                            /// TABLE BODY
                            Expanded(
                              child: ListView.builder(
                                itemCount: vm.paginatedBanners.length,
                                itemBuilder: (context, index) {
                                  final item = vm.paginatedBanners[index];

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
                                        /// ID
                                        Expanded(
                                          flex: 1,
                                          child: Text(item.id.toString()),
                                        ),

                                        /// TITLE
                                        Expanded(
                                          flex: 3,
                                          child: Text(
                                            item.title,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),

                                        /// IMAGE
                                        Expanded(
                                          flex: 3,
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(12),
                                            child: Container(
                                              height: 55,
                                              width: 120,
                                              color: Colors.grey.shade100,
                                              child: item.image.isEmpty
                                                  ? const Icon(Icons.image)
                                                  : Image.network(
                                                item.image,
                                                fit: BoxFit.cover,
                                                errorBuilder: (
                                                    context,
                                                    error,
                                                    stackTrace,
                                                    ) {
                                                  return const Icon(
                                                    Icons.broken_image,
                                                  );
                                                },
                                              ),
                                            ),
                                          ),
                                        ),

                                        /// STATUS
                                        Expanded(
                                          flex: 2,
                                          child: Switch(
                                            value: item.status,
                                            onChanged: (value) {
                                              vm.toggleStatus(item.id);
                                            },
                                          ),
                                        ),

                                        /// ACTION
                                        Expanded(
                                          flex: 2,
                                          child: Row(
                                            children: [
                                              IconButton(
                                                tooltip: "Edit",
                                                icon: const Icon(Icons.edit),
                                                onPressed: () {
                                                  _showEditDialog(
                                                    context,
                                                    vm,
                                                    item,
                                                  );
                                                },
                                              ),
                                              IconButton(
                                                tooltip: "Delete",
                                                icon: const Icon(
                                                  Icons.delete,
                                                  color: Colors.red,
                                                ),
                                                onPressed: () {
                                                  _showDeleteDialog(
                                                    context,
                                                    vm,
                                                    item,
                                                  );
                                                },
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

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
                    Row(
                      children: [
                        const Text(
                          "Page",
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
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
                      ],
                    ),
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
  /// ADD BANNER DIALOG
  /// =========================================
  void _showAddDialog(BuildContext context, BannerViewModel vm) {
    final titleController = TextEditingController();
    final imageController = TextEditingController();

    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Add Banner"),
          content: SizedBox(
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
                  controller: imageController,
                  decoration: const InputDecoration(
                    labelText: "Image URL",
                  ),
                ),
              ],
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
                final image = imageController.text.trim();

                if (title.isNotEmpty) {
                  vm.addBanner(
                    title: title,
                    image: image,
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
  /// EDIT BANNER DIALOG
  /// =========================================
  void _showEditDialog(
      BuildContext context,
      BannerViewModel vm,
      BannerModel item,
      ) {
    final titleController = TextEditingController(text: item.title);
    final imageController = TextEditingController(text: item.image);

    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Edit Banner"),
          content: SizedBox(
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
                  controller: imageController,
                  decoration: const InputDecoration(
                    labelText: "Image URL",
                  ),
                ),
              ],
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
                final image = imageController.text.trim();

                if (title.isNotEmpty) {
                  vm.updateBanner(
                    id: item.id,
                    title: title,
                    image: image,
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
  /// DELETE BANNER DIALOG
  /// =========================================
  void _showDeleteDialog(
      BuildContext context,
      BannerViewModel vm,
      BannerModel item,
      ) {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Delete Banner"),
          content: Text("Do you want to delete \"${item.title}\"?"),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                vm.deleteBanner(item.id);
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