import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/models/Settings models/state_model.dart';
import '../../viewmodels/Settings_ViewModels/state_viewmodel.dart';


class StateScreen extends StatelessWidget {
  const StateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<StateViewModel>(
      builder: (context, vm, child) {

        return Container(

          width: double.infinity,

          padding: const EdgeInsets.all(20),

          child: Column(

            crossAxisAlignment:
            CrossAxisAlignment.start,

            children: [

              /// =====================================
              /// HEADER
              /// =====================================

              Row(

                mainAxisAlignment:
                MainAxisAlignment.spaceBetween,

                children: [

                  Column(

                    crossAxisAlignment:
                    CrossAxisAlignment.start,

                    children: [

                      const Text(

                        "State",

                        style: TextStyle(

                          fontSize: 28,

                          fontWeight:
                          FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 6),

                      Text(

                        "Home > Settings > State",

                        style: TextStyle(

                          color:
                          Colors.grey.shade600,

                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),

                  /// ADD BUTTON
                  ElevatedButton.icon(

                    onPressed: () {

                      _showAddDialog(
                        context,
                        vm,
                      );
                    },

                    style:
                    ElevatedButton.styleFrom(

                      backgroundColor:
                      const Color(0xff111827),

                      foregroundColor:
                      Colors.white,
                    ),

                    icon:
                    const Icon(Icons.add),

                    label:
                    const Text("Add New"),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              /// =====================================
              /// SEARCH + ENTRIES
              /// =====================================

              Container(

                padding:
                const EdgeInsets.symmetric(

                  horizontal: 18,
                  vertical: 14,
                ),

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(14),
                ),

                child: Row(

                  mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,

                  children: [

                    /// ENTRIES
                    Row(
                      children: [

                        const Text("Show"),

                        const SizedBox(width: 10),

                        DropdownButton<int>(

                          value:
                          vm.selectedEntries,

                          items:
                          [10, 20, 50, 100]
                              .map((e) {

                            return DropdownMenuItem(

                              value: e,

                              child:
                              Text("$e"),
                            );

                          }).toList(),

                          onChanged: (value) {

                            if (value != null) {

                              vm.changeEntries(
                                value,
                              );
                            }
                          },
                        ),

                        const SizedBox(width: 10),

                        const Text("entries"),
                      ],
                    ),

                    /// SEARCH
                    SizedBox(

                      width: 260,

                      child: TextField(

                        onChanged:
                        vm.searchState,

                        decoration:
                        InputDecoration(

                          hintText:
                          "Search State",

                          prefixIcon:
                          const Icon(Icons.search),

                          filled: true,

                          fillColor:
                          Colors.white,

                          border:
                          OutlineInputBorder(

                            borderRadius:
                            BorderRadius.circular(
                              12,
                            ),

                            borderSide:
                            BorderSide.none,
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

                    borderRadius:
                    BorderRadius.circular(18),
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
                                flex: 4,
                                child: Text("STATE NAME"),
                              ),

                              Expanded(
                                flex: 2,
                                child: Text("STATUS"),
                              ),

                              Expanded(
                                flex: 2,
                                child: Text("ACTION"),
                              ),
                            ],
                          ),
                        ),

                        /// TABLE BODY
                        Expanded(

                          child: ListView.builder(

                            itemCount:
                            vm.paginatedStates.length,

                            itemBuilder:
                                (context, index) {

                              final item =
                              vm.paginatedStates[index];

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
                                      flex: 4,
                                      child: Text(
                                        item.name,
                                      ),
                                    ),

                                    /// STATUS
                                    Expanded(
                                      flex: 2,

                                      child: Switch(

                                        value:
                                        item.status,

                                        onChanged:
                                            (value) {

                                          vm.toggleStatus(
                                            item.id,
                                          );
                                        },
                                      ),
                                    ),

                                    /// ACTION
                                    Expanded(
                                      flex: 2,

                                      child: Row(

                                        children: [

                                          IconButton(

                                            icon:
                                            const Icon(
                                              Icons.edit,
                                            ),

                                            onPressed: () {

                                              _showEditDialog(

                                                context,
                                                vm,
                                                item,
                                              );
                                            },
                                          ),

                                          IconButton(

                                            icon:
                                            const Icon(

                                              Icons.delete,

                                              color:
                                              Colors.red,
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

              const SizedBox(height: 16),

              /// =====================================
              /// PAGINATION
              /// =====================================

              Row(

                mainAxisAlignment:
                MainAxisAlignment.end,

                children: [

                  IconButton(

                    onPressed:
                    vm.previousPage,

                    icon: const Icon(
                      Icons.chevron_left,
                    ),
                  ),

                  Text(
                    "${vm.currentPage}",
                  ),

                  IconButton(

                    onPressed:
                    vm.nextPage,

                    icon: const Icon(
                      Icons.chevron_right,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  /// =====================================
  /// ADD DIALOG
  /// =====================================

  void _showAddDialog(

      BuildContext context,

      StateViewModel vm,
      ) {

    final controller =
    TextEditingController();

    showDialog(

      context: context,

      builder: (_) {

        return AlertDialog(

          title:
          const Text("Add State"),

          content: TextField(

            controller: controller,

            decoration:
            const InputDecoration(

              labelText:
              "State Name",
            ),
          ),

          actions: [

            TextButton(

              onPressed: () {

                Navigator.pop(context);
              },

              child:
              const Text("Cancel"),
            ),

            ElevatedButton(

              onPressed: () {

                final name =
                controller.text.trim();

                if (name.isNotEmpty) {

                  vm.addState(
                    name: name,
                  );

                  Navigator.pop(context);
                }
              },

              child:
              const Text("Save"),
            ),
          ],
        );
      },
    );
  }

  /// =====================================
  /// EDIT DIALOG
  /// =====================================

  void _showEditDialog(

      BuildContext context,

      StateViewModel vm,

      StateModel item,
      ) {

    final controller =
    TextEditingController(
      text: item.name,
    );

    showDialog(

      context: context,

      builder: (_) {

        return AlertDialog(

          title:
          const Text("Edit State"),

          content: TextField(

            controller: controller,

            decoration:
            const InputDecoration(

              labelText:
              "State Name",
            ),
          ),

          actions: [

            TextButton(

              onPressed: () {

                Navigator.pop(context);
              },

              child:
              const Text("Cancel"),
            ),

            ElevatedButton(

              onPressed: () {

                final name =
                controller.text.trim();

                if (name.isNotEmpty) {

                  vm.updateState(

                    id: item.id,

                    name: name,
                  );

                  Navigator.pop(context);
                }
              },

              child:
              const Text("Update"),
            ),
          ],
        );
      },
    );
  }

  /// =====================================
  /// DELETE DIALOG
  /// =====================================

  void _showDeleteDialog(

      BuildContext context,

      StateViewModel vm,

      StateModel item,
      ) {

    showDialog(

      context: context,

      builder: (_) {

        return AlertDialog(

          title:
          const Text("Delete State"),

          content: Text(

            "Do you want to delete "
                "\"${item.name}\"?",
          ),

          actions: [

            TextButton(

              onPressed: () {

                Navigator.pop(context);
              },

              child:
              const Text("Cancel"),
            ),

            ElevatedButton(

              onPressed: () {

                vm.deleteState(item.id);

                Navigator.pop(context);
              },

              style:
              ElevatedButton.styleFrom(

                backgroundColor:
                Colors.red,

                foregroundColor:
                Colors.white,
              ),

              child:
              const Text("Delete"),
            ),
          ],
        );
      },
    );
  }
}