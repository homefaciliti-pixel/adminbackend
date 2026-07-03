import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/page_model.dart';
import '../../viewmodels/page_viewmodel.dart';

class PagesScreen extends StatelessWidget {
  const PagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PageViewModel>(
      builder: (context, vm, child) {

        return SingleChildScrollView(

          padding:
          const EdgeInsets.all(20),

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment.start,

            children: [

              /// =====================================
              /// HEADER
              /// =====================================

              Column(
                crossAxisAlignment:
                CrossAxisAlignment.start,

                children: [

                  const Text(

                    "Pages",

                    style: TextStyle(

                      fontSize: 28,

                      fontWeight:
                      FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 6),

                  Text(

                    "Home > Pages",

                    style: TextStyle(

                      color:
                      Colors.grey.shade600,

                      fontSize: 14,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              /// =====================================
              /// TABLE
              /// =====================================

              Container(

                width: double.infinity,

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(18),

                  boxShadow: [

                    BoxShadow(

                      color:
                      Colors.black.withOpacity(
                        0.04,
                      ),

                      blurRadius: 12,

                      offset:
                      const Offset(0, 4),
                    ),
                  ],
                ),

                child: ClipRRect(

                  borderRadius:
                  BorderRadius.circular(18),

                  child: Column(

                    children: [

                      /// TABLE HEADER
                      Container(

                        padding:
                        const EdgeInsets.all(14),

                        color:
                        Colors.blue.shade50,

                        child: const Row(

                          children: [

                            Expanded(
                              flex: 1,
                              child: Text("ID"),
                            ),

                            Expanded(
                              flex: 3,
                              child: Text("TITLE"),
                            ),

                            Expanded(
                              flex: 6,
                              child: Text("DESCRIPTION"),
                            ),

                            Expanded(
                              flex: 2,
                              child: Text("ACTION"),
                            ),
                          ],
                        ),
                      ),

                      /// TABLE BODY
                      ListView.builder(

                        itemCount:
                        vm.pages.length,

                        shrinkWrap: true,

                        physics:
                        const NeverScrollableScrollPhysics(),

                        itemBuilder:
                            (context, index) {

                          final item =
                          vm.pages[index];

                          return Container(

                            padding:
                            const EdgeInsets.all(14),

                            decoration:
                            BoxDecoration(

                              border: Border(

                                bottom:
                                BorderSide(

                                  color:
                                  Colors.grey.shade200,
                                ),
                              ),
                            ),

                            child: Row(

                              children: [

                                Expanded(
                                  flex: 1,
                                  child: Text(
                                    item.id.toString(),
                                  ),
                                ),

                                Expanded(
                                  flex: 3,
                                  child: Text(
                                    item.title,
                                  ),
                                ),

                                Expanded(
                                  flex: 6,
                                  child: Text(

                                    item.description,

                                    maxLines: 2,

                                    overflow:
                                    TextOverflow.ellipsis,
                                  ),
                                ),

                                /// EDIT BUTTON
                                Expanded(
                                  flex: 2,

                                  child:
                                  OutlinedButton.icon(

                                    onPressed: () {

                                      _showEditDialog(
                                        context,
                                        vm,
                                        item,
                                      );
                                    },

                                    icon: const Icon(
                                      Icons.edit,
                                      size: 18,
                                    ),

                                    label:
                                    const Text("Edit"),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// =====================================
  /// EDIT PAGE DIALOG
  /// =====================================

  void _showEditDialog(

      BuildContext context,

      PageViewModel vm,

      PageModel item,
      ) {

    final titleController =
    TextEditingController(
      text: item.title,
    );

    final descriptionController =
    TextEditingController(
      text: item.description,
    );

    showDialog(

      context: context,

      builder: (_) {

        return AlertDialog(

          title:
          const Text("Edit Page"),

          content: SizedBox(

            width: 500,

            child: Column(

              mainAxisSize:
              MainAxisSize.min,

              children: [

                /// TITLE
                TextField(

                  controller:
                  titleController,

                  decoration:
                  const InputDecoration(

                    labelText: "Title",
                  ),
                ),

                const SizedBox(height: 16),

                /// DESCRIPTION
                TextField(

                  controller:
                  descriptionController,

                  maxLines: 6,

                  decoration:
                  const InputDecoration(

                    labelText:
                    "Description",
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

                vm.updatePage(

                  id: item.id,

                  title:
                  titleController.text.trim(),

                  description:
                  descriptionController.text.trim(),
                );

                Navigator.pop(context);
              },

              child: const Text("Save"),
            ),
          ],
        );
      },
    );
  }
}