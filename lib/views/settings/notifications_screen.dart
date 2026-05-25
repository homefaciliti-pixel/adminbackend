import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/models/Settings models/notification_model.dart';
import '../../viewmodels/Settings_ViewModels/notification_viewmodel.dart';


class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationViewModel>(
      builder: (context, vm, child) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              /// =====================================
              /// PAGE HEADER
              /// =====================================

              Row(
                mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
                children: [

                  /// LEFT TITLE
                  Column(
                    crossAxisAlignment:
                    CrossAxisAlignment.start,
                    children: [

                      const Text(
                        "Notifications",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 6),

                      Text(
                        "Home > Settings > Notifications",
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
                      _showAddDialog(context, vm);
                    },

                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                      const Color(0xff111827),

                      foregroundColor: Colors.white,

                      padding:
                      const EdgeInsets.symmetric(
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
              /// FILTER BAR
              /// =====================================

              Container(

                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),

                decoration: BoxDecoration(
                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(14),

                  boxShadow: [
                    BoxShadow(
                      color:
                      Colors.black.withOpacity(0.04),

                      blurRadius: 10,

                      offset: const Offset(0, 4),
                    ),
                  ],
                ),

                child: Row(
                  mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,

                  children: [

                    /// SHOW ENTRIES
                    Row(
                      children: [

                        const Text(
                          "Show",
                          style: TextStyle(
                            fontWeight:
                            FontWeight.w500,
                          ),
                        ),

                        const SizedBox(width: 10),

                        Container(

                          padding:
                          const EdgeInsets.symmetric(
                            horizontal: 12,
                          ),

                          decoration: BoxDecoration(
                            borderRadius:
                            BorderRadius.circular(10),

                            border: Border.all(
                              color:
                              Colors.grey.shade300,
                            ),
                          ),

                          child: DropdownButton<int>(

                            value: vm.selectedEntries,

                            underline:
                            const SizedBox(),

                            items:
                            [10, 20, 50, 100]
                                .map((e) {

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

                        onChanged:
                        vm.searchNotification,

                        decoration: InputDecoration(

                          hintText:
                          "Search Notification",

                          prefixIcon:
                          const Icon(Icons.search),

                          filled: true,

                          fillColor: Colors.white,

                          contentPadding:
                          const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),

                          border: OutlineInputBorder(
                            borderRadius:
                            BorderRadius.circular(12),

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

              Container(

                width: double.infinity,

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(18),

                  boxShadow: [
                    BoxShadow(
                      color:
                      Colors.black.withOpacity(0.04),

                      blurRadius: 12,

                      offset: const Offset(0, 4),
                    ),
                  ],
                ),

                child: ClipRRect(

                  borderRadius:
                  BorderRadius.circular(18),

                  child: SingleChildScrollView(

                    scrollDirection: Axis.horizontal,

                    child: SizedBox(

                      width: 1850,

                      child: Column(
                        children: [

                          /// =====================================
                          /// TABLE HEADER
                          /// =====================================

                          Container(

                            padding:
                            const EdgeInsets.all(14),

                            color: Colors.blue.shade50,

                            child: const Row(
                              children: [

                                Expanded(
                                  flex: 1,
                                  child: Text("ID"),
                                ),

                                Expanded(
                                  flex: 2,
                                  child: Text("TITLE"),
                                ),

                                Expanded(
                                  flex: 4,
                                  child: Text("MESSAGE"),
                                ),

                                Expanded(
                                  flex: 2,
                                  child: Text("AUDIENCE"),
                                ),

                                Expanded(
                                  flex: 2,
                                  child: Text("CREATED AT"),
                                ),

                                Expanded(
                                  flex: 2,
                                  child: Text("SENT"),
                                ),

                                Expanded(
                                  flex: 2,
                                  child: Text("STATUS"),
                                ),

                                Expanded(
                                  flex: 3,
                                  child: Text("ACTION"),
                                ),
                              ],
                            ),
                          ),

                          /// =====================================
                          /// TABLE BODY
                          /// =====================================

                          SizedBox(

                            height: 520,

                            child: ListView.builder(

                              itemCount:
                              vm.paginatedNotifications.length,

                              itemBuilder: (context, index) {

                                final item =
                                vm.paginatedNotifications[index];

                                return Container(

                                  padding:
                                  const EdgeInsets.all(14),

                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(
                                        color:
                                        Colors.grey.shade200,
                                      ),
                                    ),
                                  ),

                                  child: Row(
                                    children: [

                                      /// ID
                                      Expanded(
                                        flex: 1,
                                        child:
                                        Text(item.id.toString()),
                                      ),

                                      /// TITLE CLICKABLE
                                      Expanded(
                                        flex: 2,

                                        child: InkWell(

                                          onTap: () {
                                            _showNotificationDetails(
                                              context,
                                              item,
                                            );
                                          },

                                          child: Text(

                                            item.title,

                                            overflow:
                                            TextOverflow.ellipsis,

                                            style: const TextStyle(
                                              color: Colors.blue,
                                              fontWeight:
                                              FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ),

                                      /// MESSAGE
                                      Expanded(
                                        flex: 4,

                                        child: Text(

                                          item.message,

                                          overflow:
                                          TextOverflow.ellipsis,

                                          maxLines: 2,
                                        ),
                                      ),

                                      /// AUDIENCE
                                      Expanded(
                                        flex: 2,

                                        child: Text(
                                          item.audience,
                                        ),
                                      ),

                                      /// CREATED DATE
                                      Expanded(
                                        flex: 2,

                                        child: Text(
                                          item.createdAt,
                                        ),
                                      ),

                                      /// SENT STATUS
                                      Expanded(
                                        flex: 2,

                                        child: Text(

                                          item.isSent
                                              ? "Sent"
                                              : "Draft",

                                          style: TextStyle(

                                            color:
                                            item.isSent
                                                ? Colors.green
                                                : Colors.orange,

                                            fontWeight:
                                            FontWeight.w600,
                                          ),
                                        ),
                                      ),

                                      /// ACTIVE / INACTIVE
                                      Expanded(
                                        flex: 2,

                                        child: Switch(

                                          value: item.status,

                                          onChanged: (value) {
                                            vm.toggleStatus(item.id);
                                          },
                                        ),
                                      ),

                                      /// ACTION BUTTONS
                                      Expanded(
                                        flex: 3,

                                        child: Row(
                                          children: [

                                            /// =====================================
                                            /// SEND BUTTON
                                            /// =====================================

                                            ElevatedButton.icon(

                                              onPressed: item.isSent
                                                  ? null
                                                  : () {
                                                _showSendDialog(
                                                  context,
                                                  vm,
                                                  item,
                                                );
                                              },

                                              style: ElevatedButton.styleFrom(

                                                backgroundColor:
                                                item.isSent
                                                    ? Colors.green
                                                    : Colors.blue,

                                                foregroundColor: Colors.white,

                                                padding:
                                                const EdgeInsets.symmetric(
                                                  horizontal: 14,
                                                  vertical: 10,
                                                ),

                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                  BorderRadius.circular(10),
                                                ),
                                              ),

                                              icon: Icon(

                                                item.isSent
                                                    ? Icons.check
                                                    : Icons.send,

                                                size: 18,
                                              ),

                                              label: Text(
                                                item.isSent
                                                    ? "Sent"
                                                    : "Send",
                                              ),
                                            ),

                                            const SizedBox(width: 8),

                                            /// =====================================
                                            /// EDIT BUTTON
                                            /// =====================================

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

                                            /// =====================================
                                            /// DELETE BUTTON
                                            /// =====================================

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

              const SizedBox(height: 16),

              /// =====================================
              /// PAGINATION
              /// =====================================

              Row(
                mainAxisAlignment:
                MainAxisAlignment.end,

                children: [

                  IconButton(
                    onPressed: vm.previousPage,
                    icon:
                    const Icon(Icons.chevron_left),
                  ),

                  Text("${vm.currentPage}"),

                  IconButton(
                    onPressed: vm.nextPage,
                    icon:
                    const Icon(Icons.chevron_right),
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
  /// SEND DIALOG
  /// =====================================

  void _showSendDialog(
      BuildContext context,
      NotificationViewModel vm,
      NotificationModel item,
      ) {

    showDialog(

      context: context,

      builder: (_) {

        return AlertDialog(

          title:
          const Text("Send Notification"),

          content: Text(
            "Do you want to send "
                "\"${item.title}\" "
                "to ${item.audience}?",
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

                vm.sendNotification(item.id);

                Navigator.pop(context);

                ScaffoldMessenger.of(context)
                    .showSnackBar(

                  const SnackBar(
                    content:
                    Text("Notification sent."),
                  ),
                );
              },

              child: const Text("Send Now"),
            ),
          ],
        );
      },
    );
  }

  /// =====================================
  /// NOTIFICATION DETAILS
  /// =====================================

  void _showNotificationDetails(
      BuildContext context,
      NotificationModel item,
      ) {

    showDialog(

      context: context,

      builder: (_) {

        return Dialog(

          shape: RoundedRectangleBorder(
            borderRadius:
            BorderRadius.circular(20),
          ),

          child: ConstrainedBox(

            constraints:
            const BoxConstraints(
              maxWidth: 850,
            ),

            child: Padding(

              padding:
              const EdgeInsets.all(24),

              child: SingleChildScrollView(

                child: Column(

                  mainAxisSize: MainAxisSize.min,

                  crossAxisAlignment:
                  CrossAxisAlignment.start,

                  children: [

                    /// HEADER
                    Row(
                      mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,

                      children: [

                        const Text(
                          "Notification Details",
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight:
                            FontWeight.bold,
                          ),
                        ),

                        IconButton(

                          onPressed: () {
                            Navigator.pop(context);
                          },

                          icon:
                          const Icon(Icons.close),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    _detailTile("ID", item.id.toString()),
                    _detailTile("Title", item.title),
                    _detailTile("Message", item.message),
                    _detailTile("Audience", item.audience),
                    _detailTile("Created At", item.createdAt),

                    _detailTile(
                      "Sent Status",
                      item.isSent ? "Sent" : "Draft",
                    ),

                    _detailTile(
                      "Status",
                      item.status
                          ? "Active"
                          : "Inactive",
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

  /// =====================================
  /// ADD DIALOG
  /// =====================================

  void _showAddDialog(
      BuildContext context,
      NotificationViewModel vm,
      ) {

    final titleController =
    TextEditingController();

    final messageController =
    TextEditingController();

    String selectedAudience =
        "All Users";

    showDialog(

      context: context,

      builder: (_) {

        return StatefulBuilder(

          builder: (context, setState) {

            return AlertDialog(

              title:
              const Text("Add Notification"),

              contentPadding:
              const EdgeInsets.fromLTRB(
                24,
                20,
                24,
                0,
              ),

              insetPadding:
              const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 24,
              ),

              content: SizedBox(

                width: 500,

                child: SingleChildScrollView(

                  child: Column(

                    mainAxisSize: MainAxisSize.min,

                    children: [

                      TextField(
                        controller: titleController,

                        decoration:
                        const InputDecoration(
                          labelText: "Title",
                        ),
                      ),

                      const SizedBox(height: 14),

                      TextField(
                        controller:
                        messageController,

                        maxLines: 4,

                        decoration:
                        const InputDecoration(
                          labelText: "Message",
                        ),
                      ),

                      const SizedBox(height: 14),

                      DropdownButtonFormField<String>(

                        value: selectedAudience,

                        decoration:
                        const InputDecoration(
                          labelText: "Audience",
                        ),

                        items: const [

                          DropdownMenuItem(
                            value: "All Users",
                            child:
                            Text("All Users"),
                          ),

                          DropdownMenuItem(
                            value: "All Partners",
                            child:
                            Text("All Partners"),
                          ),

                          DropdownMenuItem(
                            value: "Selected",
                            child:
                            Text("Selected"),
                          ),
                        ],

                        onChanged: (value) {

                          if (value != null) {

                            setState(() {
                              selectedAudience =
                                  value;
                            });
                          }
                        },
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

                    final title =
                    titleController.text.trim();

                    final message =
                    messageController.text.trim();

                    if (title.isNotEmpty &&
                        message.isNotEmpty) {

                      vm.addNotification(
                        title: title,
                        message: message,
                        audience:
                        selectedAudience,
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
      NotificationViewModel vm,
      NotificationModel item,
      ) {

    final titleController =
    TextEditingController(
      text: item.title,
    );

    final messageController =
    TextEditingController(
      text: item.message,
    );

    String selectedAudience =
        item.audience;

    showDialog(

      context: context,

      builder: (_) {

        return StatefulBuilder(

          builder: (context, setState) {

            return AlertDialog(

              title:
              const Text("Edit Notification"),

              contentPadding:
              const EdgeInsets.fromLTRB(
                24,
                20,
                24,
                0,
              ),

              insetPadding:
              const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 24,
              ),

              content: SizedBox(

                width: 500,

                child: SingleChildScrollView(

                  child: Column(

                    mainAxisSize: MainAxisSize.min,

                    children: [

                      TextField(
                        controller:
                        titleController,

                        decoration:
                        const InputDecoration(
                          labelText: "Title",
                        ),
                      ),

                      const SizedBox(height: 14),

                      TextField(
                        controller:
                        messageController,

                        maxLines: 4,

                        decoration:
                        const InputDecoration(
                          labelText: "Message",
                        ),
                      ),

                      const SizedBox(height: 14),

                      DropdownButtonFormField<String>(

                        value: selectedAudience,

                        decoration:
                        const InputDecoration(
                          labelText: "Audience",
                        ),

                        items: const [

                          DropdownMenuItem(
                            value: "All Users",
                            child:
                            Text("All Users"),
                          ),

                          DropdownMenuItem(
                            value: "All Partners",
                            child:
                            Text("All Partners"),
                          ),

                          DropdownMenuItem(
                            value: "Selected",
                            child:
                            Text("Selected"),
                          ),
                        ],

                        onChanged: (value) {

                          if (value != null) {

                            setState(() {
                              selectedAudience =
                                  value;
                            });
                          }
                        },
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

                    final title =
                    titleController.text.trim();

                    final message =
                    messageController.text.trim();

                    if (title.isNotEmpty &&
                        message.isNotEmpty) {

                      vm.updateNotification(

                        id: item.id,

                        title: title,

                        message: message,

                        audience:
                        selectedAudience,
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
      NotificationViewModel vm,
      NotificationModel item,
      ) {

    showDialog(

      context: context,

      builder: (_) {

        return AlertDialog(

          title:
          const Text("Delete Notification"),

          content: Text(
            "Do you want to delete "
                "\"${item.title}\"?",
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

                vm.deleteNotification(item.id);

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

  /// =====================================
  /// DETAIL TILE
  /// =====================================

  Widget _detailTile(
      String title,
      String value,
      ) {

    return Padding(

      padding:
      const EdgeInsets.only(bottom: 14),

      child: Column(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Text(

            title,

            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 13,
            ),
          ),

          const SizedBox(height: 4),

          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}