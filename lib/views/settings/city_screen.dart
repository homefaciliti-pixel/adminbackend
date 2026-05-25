import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/Settings models/city_model.dart';
import '../../data/models/Settings models/state_model.dart';
import '../../viewmodels/Settings_ViewModels/city_viewmodel.dart';
import '../../viewmodels/Settings_ViewModels/state_viewmodel.dart';


class CityScreen extends StatelessWidget {
  const CityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CityViewModel>(
      builder: (context, vm, child) {
        /// state dropdown ke liye full list
        final statesVm = context.watch<StateViewModel>();
        final List<StateModel> stateOptions = statesVm.allStates;

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
                        "City",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Home > Settings > City",
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
                      _showAddDialog(context, vm, stateOptions);
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
                        onChanged: vm.searchCity,
                        decoration: InputDecoration(
                          hintText: "Search City",
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
                    child: Column(
                      children: [
                        /// TABLE HEADER
                        Container(
                          padding: const EdgeInsets.all(14),
                          color: Colors.blue.shade50,
                          child: const Row(
                            children: [
                              Expanded(
                                flex: 1,
                                child: Text("ID"),
                              ),
                              Expanded(
                                flex: 3,
                                child: Text("CITY NAME"),
                              ),
                              Expanded(
                                flex: 3,
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
                            itemCount: vm.paginatedCities.length,
                            itemBuilder: (context, index) {
                              final item = vm.paginatedCities[index];

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
                                    Expanded(
                                      flex: 3,
                                      child: Text(
                                        item.cityName,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Expanded(
                                      flex: 3,
                                      child: Text(
                                        item.stateName,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Switch(
                                        value: item.status,
                                        onChanged: (value) {
                                          vm.toggleStatus(item.id);
                                        },
                                      ),
                                    ),
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
                                                stateOptions,
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

              const SizedBox(height: 16),

              /// =====================================
              /// PAGINATION
              /// =====================================
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    onPressed: vm.previousPage,
                    icon: const Icon(Icons.chevron_left),
                  ),
                  Text("${vm.currentPage}"),
                  IconButton(
                    onPressed: vm.nextPage,
                    icon: const Icon(Icons.chevron_right),
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
      CityViewModel vm,
      List<StateModel> stateOptions,
      ) {
    final cityController = TextEditingController();
    String selectedState =
    stateOptions.isNotEmpty ? stateOptions.first.name : "";

    showDialog(
      context: context,
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text("Add City"),
              content: SizedBox(
                width: 450,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: cityController,
                      decoration: const InputDecoration(
                        labelText: "City Name",
                      ),
                    ),
                    const SizedBox(height: 16),

                    /// STATE DROPDOWN
                    DropdownButtonFormField<String>(
                      value: selectedState.isEmpty ? null : selectedState,
                      decoration: const InputDecoration(
                        labelText: "State",
                      ),
                      items: stateOptions.map((stateItem) {
                        return DropdownMenuItem(
                          value: stateItem.name,
                          child: Text(stateItem.name),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            selectedState = value;
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Cancel"),
                ),
                ElevatedButton(
                  onPressed: () {
                    final cityName = cityController.text.trim();

                    if (cityName.isNotEmpty && selectedState.isNotEmpty) {
                      vm.addCity(
                        cityName: cityName,
                        stateName: selectedState,
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
      },
    );
  }

  /// =====================================
  /// EDIT DIALOG
  /// =====================================
  void _showEditDialog(
      BuildContext context,
      CityViewModel vm,
      CityModel item,
      List<StateModel> stateOptions,
      ) {
    final cityController = TextEditingController(text: item.cityName);
    String selectedState = item.stateName;

    showDialog(
      context: context,
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text("Edit City"),
              content: SizedBox(
                width: 450,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: cityController,
                      decoration: const InputDecoration(
                        labelText: "City Name",
                      ),
                    ),
                    const SizedBox(height: 16),

                    /// STATE DROPDOWN
                    DropdownButtonFormField<String>(
                      value: selectedState.isEmpty ? null : selectedState,
                      decoration: const InputDecoration(
                        labelText: "State",
                      ),
                      items: stateOptions.map((stateItem) {
                        return DropdownMenuItem(
                          value: stateItem.name,
                          child: Text(stateItem.name),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            selectedState = value;
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Cancel"),
                ),
                ElevatedButton(
                  onPressed: () {
                    final cityName = cityController.text.trim();

                    if (cityName.isNotEmpty && selectedState.isNotEmpty) {
                      vm.updateCity(
                        id: item.id,
                        cityName: cityName,
                        stateName: selectedState,
                      );
                      Navigator.pop(context);
                    }
                  },
                  child: const Text("Update"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  /// =====================================
  /// DELETE DIALOG
  /// =====================================
  void _showDeleteDialog(
      BuildContext context,
      CityViewModel vm,
      CityModel item,
      ) {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Delete City"),
          content: Text(
            "Do you want to delete \"${item.cityName}\"?",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                vm.deleteCity(item.id);
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