import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/Settings models/review_model.dart';
import '../../viewmodels/Settings_ViewModels/review_viewmodel.dart';



class ReviewsScreen extends StatelessWidget {
  const ReviewsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ReviewViewModel>(
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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  /// LEFT TITLE
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Reviews & Ratings",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Home > Settings > Reviews & Ratings",
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
                      onChanged: vm.searchReview,
                      decoration: InputDecoration(
                        hintText: "Search Review",
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
                                Expanded(flex: 2, child: Text("USER NAME")),
                                Expanded(flex: 2, child: Text("PARTNER NAME")),
                                Expanded(flex: 2, child: Text("SERVICE NAME")),
                                Expanded(flex: 1, child: Text("RATING")),
                                Expanded(flex: 4, child: Text("REVIEW TEXT")),
                                Expanded(flex: 2, child: Text("STATUS")),
                                Expanded(flex: 2, child: Text("ACTION")),
                              ],
                            ),
                          ),

                          /// TABLE BODY
                          SizedBox(
                            height: 520,
                            child: ListView.builder(
                              itemCount: vm.paginatedReviews.length,
                              itemBuilder: (context, index) {
                                final item = vm.paginatedReviews[index];

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

                                      /// USER NAME
                                      Expanded(
                                        flex: 2,
                                        child: InkWell(
                                          onTap: () {
                                            _showReviewDetails(context, item);
                                          },
                                          child: Text(
                                            item.userName,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: Colors.blue,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ),

                                      /// PARTNER NAME CLICKABLE
                                      Expanded(
                                        flex: 2,
                                        child: InkWell(
                                          onTap: () {
                                            _showReviewDetails(context, item);
                                          },
                                          child: Text(
                                            item.partnerName,
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
                                        flex: 1,
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Icons.star,
                                              color: Colors.amber,
                                              size: 18,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              item.rating.toStringAsFixed(1),
                                            ),
                                          ],
                                        ),
                                      ),

                                      Expanded(
                                        flex: 4,
                                        child: Text(
                                          item.reviewText,
                                          overflow: TextOverflow.ellipsis,
                                          maxLines: 2,
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
  /// REVIEW DETAILS DIALOG
  /// =====================================
  void _showReviewDetails(BuildContext context, ReviewModel item) {
    showDialog(
      context: context,
      builder: (_) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 850),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  /// HEADER
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Review Details",
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

                  /// SUMMARY CHIPS
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _detailChip("User", item.userName),
                      _detailChip("Partner", item.partnerName),
                      _detailChip("Service", item.serviceName),
                      _detailChip("Rating", item.rating.toStringAsFixed(1)),
                      _detailChip(
                        "Status",
                        item.status ? "Approved" : "Hidden",
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  /// FULL DETAILS
                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      _detailCard("ID", item.id.toString()),
                      _detailCard("User Name", item.userName),
                      _detailCard("Partner Name", item.partnerName),
                      _detailCard("Service Name", item.serviceName),
                      _detailCard("Rating", item.rating.toStringAsFixed(1)),
                      _detailCard("Review Text", item.reviewText),
                      _detailCard(
                        "Status",
                        item.status ? "Approved" : "Hidden",
                      ),
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

  /// =====================================
  /// EDIT DIALOG
  /// =====================================
  void _showEditDialog(
      BuildContext context,
      ReviewViewModel vm,
      ReviewModel item,
      ) {
    final userController = TextEditingController(text: item.userName);
    final partnerController = TextEditingController(text: item.partnerName);
    final serviceController = TextEditingController(text: item.serviceName);
    final ratingController = TextEditingController(
      text: item.rating.toString(),
    );
    final reviewController = TextEditingController(text: item.reviewText);

    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Edit Review"),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: userController,
                    decoration: const InputDecoration(
                      labelText: "User Name",
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: partnerController,
                    decoration: const InputDecoration(
                      labelText: "Partner Name",
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: serviceController,
                    decoration: const InputDecoration(
                      labelText: "Service Name",
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: ratingController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: "Rating",
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: reviewController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: "Review Text",
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                final userName = userController.text.trim();
                final partnerName = partnerController.text.trim();
                final serviceName = serviceController.text.trim();
                final rating =
                    double.tryParse(ratingController.text.trim()) ?? 0;
                final reviewText = reviewController.text.trim();

                if (userName.isNotEmpty &&
                    partnerName.isNotEmpty &&
                    serviceName.isNotEmpty &&
                    reviewText.isNotEmpty) {
                  vm.updateReview(
                    id: item.id,
                    userName: userName,
                    partnerName: partnerName,
                    serviceName: serviceName,
                    rating: rating,
                    reviewText: reviewText,
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

  /// =====================================
  /// DELETE DIALOG
  /// =====================================
  void _showDeleteDialog(
      BuildContext context,
      ReviewViewModel vm,
      ReviewModel item,
      ) {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Delete Review"),
          content: Text(
            "Do you want to delete review by \"${item.userName}\"?",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                vm.deleteReview(item.id);
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
  /// DETAIL CARD
  /// =====================================
  Widget _detailCard(String title, String value) {
    return Container(
      width: 240,
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
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value.isEmpty ? "-" : value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  /// =====================================
  /// DETAIL CHIP
  /// =====================================
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