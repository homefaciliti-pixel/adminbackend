import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/Settings models/city_model.dart';
import '../../data/models/Settings models/state_model.dart';
import '../../viewmodels/Settings_ViewModels/city_viewmodel.dart';
import '../../viewmodels/Settings_ViewModels/locality_model.dart';
import '../../viewmodels/Settings_ViewModels/locality_viewmodel.dart';
import '../../viewmodels/Settings_ViewModels/state_viewmodel.dart';

class LocalityScreen extends StatelessWidget {
  const LocalityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalityViewModel>(
      builder: (context, vm, child) {
        /// state + city list dropdown ke liye
        final stateVm = context.watch<StateViewModel>();
        final cityVm = context.watch<CityViewModel>();

        final List<StateModel> stateOptions = stateVm.allStates;
        final List<CityModel> cityOptions = cityVm.allCities;

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
                        "Locality",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Home > Settings > Locality",
                        style: TextStyle(
                          color: Colors.grey.shade600,
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
                        stateOptions,
                        cityOptions,
                      );
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

                        /// ENTRIES
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
                        onChanged: vm.searchLocality,
                        decoration: InputDecoration(
                          hintText: "Search Locality",
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
                                child: Text("LOCALITY NAME"),
                              ),
                              Expanded(
                                flex: 3,
                                child: Text("CITY"),
                              ),
                              Expanded(
                                flex: 3,
                                child: Text("STATE"),
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
                            itemCount: vm.paginatedLocalities.length,
                            itemBuilder: (context, index) {
                              final item = vm.paginatedLocalities[index];

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
                                        item.localityName,
                                        overflow: TextOverflow.ellipsis,
                                      ),
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
                                                cityOptions,
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
      LocalityViewModel vm,
      List<StateModel> stateOptions,
      List<CityModel> cityOptions,
      ) {
    final localityController = TextEditingController();

    String selectedState =
    stateOptions.isNotEmpty ? stateOptions.first.name : "";

    String selectedCity = "";

    showDialog(
      context: context,
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setState) {
            /// selected state ke hisaab se cities filter
            final filteredCities = cityOptions
                .where((city) => city.stateName == selectedState)
                .toList();

            if (selectedCity.isEmpty && filteredCities.isNotEmpty) {
              selectedCity = filteredCities.first.cityName;
            }

            return AlertDialog(
              title: const Text("Add Locality"),
              content: SizedBox(
                width: 500,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: localityController,
                      decoration: const InputDecoration(
                        labelText: "Locality Name",
                      ),
                    ),
                    const SizedBox(height: 14),

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
                            selectedCity = "";
                          });
                        }
                      },
                    ),

                    const SizedBox(height: 14),

                    /// CITY DROPDOWN
                    DropdownButtonFormField<String>(
                      value: selectedCity.isEmpty ? null : selectedCity,
                      decoration: const InputDecoration(
                        labelText: "City",
                      ),
                      items: filteredCities.map((cityItem) {
                        return DropdownMenuItem(
                          value: cityItem.cityName,
                          child: Text(cityItem.cityName),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            selectedCity = value;
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
                    final localityName = localityController.text.trim();

                    if (localityName.isNotEmpty &&
                        selectedState.isNotEmpty &&
                        selectedCity.isNotEmpty) {
                      vm.addLocality(
                        localityName: localityName,
                        cityName: selectedCity,
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
      LocalityViewModel vm,
      LocalityModel item,
      List<StateModel> stateOptions,
      List<CityModel> cityOptions,
      ) {
    final localityController =
    TextEditingController(text: item.localityName);

    String selectedState = item.stateName;
    String selectedCity = item.cityName;

    showDialog(
      context: context,
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setState) {
            final filteredCities = cityOptions
                .where((city) => city.stateName == selectedState)
                .toList();

            final cityExists = filteredCities.any(
                  (c) => c.cityName == selectedCity,
            );

            if (!cityExists && filteredCities.isNotEmpty) {
              selectedCity = filteredCities.first.cityName;
            }

            return AlertDialog(
              title: const Text("Edit Locality"),
              content: SizedBox(
                width: 500,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: localityController,
                      decoration: const InputDecoration(
                        labelText: "Locality Name",
                      ),
                    ),
                    const SizedBox(height: 14),

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
                            selectedCity = "";
                          });
                        }
                      },
                    ),

                    const SizedBox(height: 14),

                    /// CITY DROPDOWN
                    DropdownButtonFormField<String>(
                      value: selectedCity.isEmpty ? null : selectedCity,
                      decoration: const InputDecoration(
                        labelText: "City",
                      ),
                      items: filteredCities.map((cityItem) {
                        return DropdownMenuItem(
                          value: cityItem.cityName,
                          child: Text(cityItem.cityName),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            selectedCity = value;
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
                    final localityName = localityController.text.trim();

                    if (localityName.isNotEmpty &&
                        selectedState.isNotEmpty &&
                        selectedCity.isNotEmpty) {
                      vm.updateLocality(
                        id: item.id,
                        localityName: localityName,
                        cityName: selectedCity,
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
      LocalityViewModel vm,
      LocalityModel item,
      ) {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Delete Locality"),
          content: Text(
            "Do you want to delete \"${item.localityName}\"?",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                vm.deleteLocality(item.id);
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