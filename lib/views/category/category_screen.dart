import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/category_viewmodel.dart';

class CategoryScreen extends StatelessWidget {
  const CategoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => CategoryViewModel(),
      child: Consumer<CategoryViewModel>(
        builder: (context, vm, child) {
          /// pagination indexes
          final start =
              (vm.currentPage - 1) *
                  vm.selectedEntries;

          int end =
              start + vm.selectedEntries;

          if (end > vm.categories.length) {
            end = vm.categories.length;
          }

          final pageData =
          vm.categories.sublist(
            start,
            end,
          );

          return Padding(
            padding:
            const EdgeInsets.all(
                20),
            child: Column(
              crossAxisAlignment:
              CrossAxisAlignment
                  .start,
              children: [

                /// top row
                Row(
                  children: [
                    const Text(
                      "Categories",
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight:
                        FontWeight
                            .bold,
                      ),
                    ),

                    const Spacer(),

                    ElevatedButton.icon(
                      onPressed: () {
                        _showAddDialog(
                          context,
                          vm,
                        );
                      },
                      icon:
                      const Icon(
                        Icons.add,
                      ),
                      label:
                      const Text(
                        "Add New",
                      ),
                    ),
                  ],
                ),

                const SizedBox(
                    height: 20),

                /// filters
                Row(
                  children: [

                    Container(
                      padding:
                      const EdgeInsets.symmetric(
                          horizontal:
                          12),
                      decoration:
                      BoxDecoration(
                        color: Colors
                            .white,
                        borderRadius:
                        BorderRadius.circular(
                            10),
                      ),
                      child:
                      DropdownButton<
                          int>(
                        value: vm
                            .selectedEntries,
                        underline:
                        const SizedBox(),
                        items: const [
                          DropdownMenuItem(
                            value: 10,
                            child: Text(
                                "10 Entries"),
                          ),
                          DropdownMenuItem(
                            value: 20,
                            child: Text(
                                "20 Entries"),
                          ),
                          DropdownMenuItem(
                            value: 50,
                            child: Text(
                                "50 Entries"),
                          ),
                        ],
                        onChanged:
                            (value) {
                          if (value !=
                              null) {
                            vm.changeEntries(
                                value);
                          }
                        },
                      ),
                    ),

                    const Spacer(),

                    SizedBox(
                      width: 220,
                      child:
                      TextField(
                        onChanged:
                            (value) {
                          vm.searchCategory(
                              value);
                        },
                        decoration:
                        InputDecoration(
                          hintText:
                          "Search",
                          filled:
                          true,
                          fillColor:
                          Colors
                              .white,
                          prefixIcon:
                          const Icon(
                            Icons.search,
                          ),
                          border:
                          OutlineInputBorder(
                            borderRadius:
                            BorderRadius.circular(
                                10),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(
                    height: 20),

                /// header
                Container(
                  padding:
                  const EdgeInsets
                      .all(14),
                  color: Colors
                      .blue
                      .shade50,
                  child:
                  const Row(
                    children: [
                      Expanded(
                        flex: 1,
                        child:
                        Text("#"),
                      ),
                      Expanded(
                        flex: 4,
                        child: Text(
                            "Title"),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                            "Parent"),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                            "Image"),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                            "Status"),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                            "Action"),
                      ),
                    ],
                  ),
                ),

                /// list
                Expanded(
                  child:
                  ListView.builder(
                    itemCount:
                    pageData
                        .length,
                    itemBuilder:
                        (
                        context,
                        index,
                        ) {
                      final item =
                      pageData[
                      index];

                      return Container(
                        padding:
                        const EdgeInsets.all(
                            14),
                        decoration:
                        BoxDecoration(
                          color: Colors
                              .white,
                          border:
                          Border(
                            bottom:
                            BorderSide(
                              color: Colors.grey.shade200,
                            ),
                          ),
                        ),
                        child:
                        Row(
                          children: [

                            Expanded(
                              flex:
                              1,
                              child:
                              Text("${item.id}"),
                            ),

                            Expanded(
                              flex:
                              4,
                              child:
                              Text(item.title),
                            ),

                            Expanded(
                              flex:
                              2,
                              child:
                              Text(item.parent),
                            ),

                            Expanded(
                              flex:
                              2,
                              child:
                              _buildImage(
                                item.image,
                                item.imageBytes,
                              ),
                            ),

                            Expanded(
                              flex:
                              2,
                              child:
                              Switch(
                                value:
                                item.status,
                                onChanged:
                                    (v) {
                                  vm.toggleStatus(
                                      index,
                                      v);
                                },
                              ),
                            ),

                            Expanded(
                              flex:
                              2,
                              child:
                              Row(
                                children: [

                                  IconButton(
                                    onPressed:
                                        () {
                                      _showEditDialog(
                                        context,
                                        vm,
                                        item,
                                      );
                                    },
                                    icon:
                                    const Icon(
                                      Icons.edit,
                                    ),
                                  ),

                                  IconButton(
                                    onPressed:
                                        () {
                                      vm.deleteCategory(
                                          item.id);
                                    },
                                    icon:
                                    const Icon(
                                      Icons.delete,
                                      color: Colors.red,
                                    ),
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

                const SizedBox(
                    height: 15),

                /// pagination
                Row(
                  mainAxisAlignment:
                  MainAxisAlignment
                      .end,
                  children: [

                    IconButton(
                      onPressed: vm
                          .previousPage,
                      icon:
                      const Icon(
                        Icons.chevron_left,
                      ),
                    ),

                    Text(
                      "Page ${vm.currentPage} / ${vm.totalPages}",
                      style:
                      const TextStyle(
                        fontWeight:
                        FontWeight
                            .bold,
                      ),
                    ),

                    IconButton(
                      onPressed:
                      vm.nextPage,
                      icon:
                      const Icon(
                        Icons.chevron_right,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// add dialog
  void _showAddDialog(
      BuildContext context,
      CategoryViewModel vm,
      ) {
    final titleController =
    TextEditingController();

    String selectedParent =
        "Main Category";

    String imagePath = "";
    Uint8List? imageBytes;

    showDialog(
      context: context,
      builder: (_) {
        return StatefulBuilder(
          builder: (
              context,
              setState,
              ) {
            return AlertDialog(
              title:
              const Text(
                "Add Category",
              ),
              content:
              SizedBox(
                width: 350,
                child: Column(
                  mainAxisSize:
                  MainAxisSize.min,
                  children: [

                    TextField(
                      controller:
                      titleController,
                      decoration:
                      const InputDecoration(
                        labelText:
                        "Category Name",
                      ),
                    ),

                    const SizedBox(
                        height:
                        15),

                    DropdownButtonFormField<
                        String>(
                      value:
                      selectedParent,
                      items: const [
                        DropdownMenuItem(
                          value:
                          "Main Category",
                          child:
                          Text(
                            "Main Category",
                          ),
                        ),
                        DropdownMenuItem(
                          value:
                          "Contractors",
                          child:
                          Text(
                            "Contractors",
                          ),
                        ),
                        DropdownMenuItem(
                          value:
                          "Home Services",
                          child:
                          Text(
                            "Home Services",
                          ),
                        ),
                      ],
                      onChanged:
                          (v) {
                        setState(
                                () {
                              selectedParent =
                              v!;
                            });
                      },
                    ),

                    const SizedBox(
                        height:
                        15),

                    ElevatedButton.icon(
                      onPressed: () {
                        imagePath = "";
                        imageBytes = null;

                        setState(() {});
                      },
                      icon: const Icon(Icons.image),
                      label: const Text("Pick Image"),
                    ),

                    const SizedBox(
                        height:
                        10),

                    _buildImage(
                      imagePath,
                      imageBytes,
                      size: 80,
                    ),
                  ],
                ),
              ),
              actions: [

                TextButton(
                  onPressed:
                      () {
                    Navigator.pop(
                        context);
                  },
                  child:
                  const Text(
                    "Cancel",
                  ),
                ),

                ElevatedButton(
                  onPressed:
                      () {
                    vm.addCategory(
                      titleController
                          .text
                          .trim(),
                      selectedParent,
                      imagePath,
                      imageBytes,
                    );

                    Navigator.pop(
                        context);
                  },
                  child:
                  const Text(
                    "Save",
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  /// edit dialog
  void _showEditDialog(
      BuildContext context,
      CategoryViewModel vm,
      dynamic item,
      ) {
    final titleController =
    TextEditingController(
      text: item.title,
    );

    String selectedParent =
        item.parent;

    String imagePath =
        item.image;

    Uint8List? imageBytes =
        item.imageBytes;

    showDialog(
      context: context,
      builder: (_) {
        return StatefulBuilder(
          builder: (
              context,
              setState,
              ) {
            return AlertDialog(
              title:
              const Text(
                "Edit Category",
              ),
              content:
              SizedBox(
                width: 350,
                child: Column(
                  mainAxisSize:
                  MainAxisSize.min,
                  children: [

                    TextField(
                      controller:
                      titleController,
                      decoration:
                      const InputDecoration(
                        labelText:
                        "Category Name",
                      ),
                    ),

                    const SizedBox(
                        height:
                        15),

                    DropdownButtonFormField<
                        String>(
                      value:
                      selectedParent,
                      items: const [
                        DropdownMenuItem(
                          value:
                          "Main Category",
                          child:
                          Text(
                            "Main Category",
                          ),
                        ),
                        DropdownMenuItem(
                          value:
                          "Contractors",
                          child:
                          Text(
                            "Contractors",
                          ),
                        ),
                        DropdownMenuItem(
                          value:
                          "Home Services",
                          child:
                          Text(
                            "Home Services",
                          ),
                        ),
                      ],
                      onChanged:
                          (v) {
                        setState(
                                () {
                              selectedParent =
                              v!;
                            });
                      },
                    ),

                    const SizedBox(
                        height:
                        15),

                    ElevatedButton.icon(
                      onPressed: () {
                        imagePath = "";
                        imageBytes = null;

                        setState(() {});
                      },
                      icon: const Icon(Icons.image),
                      label: const Text("Pick Image"),
                    ),


                    /// =======================================
                    /// EDIT CATEGORY DIALOG ME YE REPLACE KARO
                    /// search: Change Image
                    /// =======================================

                    ElevatedButton.icon(
                      onPressed: () {
                        imagePath = "";
                        imageBytes = null;

                        setState(() {});
                      },
                      icon: const Icon(Icons.image),
                      label: const Text("Change Image"),
                    ),

                    const SizedBox(
                        height:
                        10),

                    _buildImage(
                      imagePath,
                      imageBytes,
                      size: 80,
                    ),
                  ],
                ),
              ),
              actions: [

                TextButton(
                  onPressed:
                      () {
                    Navigator.pop(
                        context);
                  },
                  child:
                  const Text(
                    "Cancel",
                  ),
                ),

                ElevatedButton(
                  onPressed:
                      () {
                    vm.updateCategory(
                      item.id,
                      titleController
                          .text
                          .trim(),
                      selectedParent,
                      imagePath,
                      imageBytes,
                    );

                    Navigator.pop(
                        context);
                  },
                  child:
                  const Text(
                    "Update",
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  /// universal image
  static Widget _buildImage(
      String path,
      Uint8List? bytes, {
        double size = 45,
      }) {
    if (bytes != null) {
      return ClipRRect(
        borderRadius:
        BorderRadius.circular(
            8),
        child: Image.memory(
          bytes,
          height: size,
          width: size,
          fit: BoxFit.cover,
        ),
      );
    }

    if (path.isEmpty) {
      return const Icon(
        Icons.image,
      );
    }

    if (!kIsWeb) {
      return ClipRRect(
        borderRadius:
        BorderRadius.circular(
            8),
        child: Image.file(
          File(path),
          height: size,
          width: size,
          fit: BoxFit.cover,
          errorBuilder:
              (
              context,
              error,
              stackTrace,
              ) {
            return const Icon(
              Icons.image,
            );
          },
        ),
      );
    }

    return const Icon(
      Icons.image,
    );
  }
}