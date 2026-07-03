import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/dashboard_viewmodel.dart';
import '../../widgets/common/stat_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  int getGrid(double width) {
    if (width > 1400) return 4;
    if (width > 1000) return 3;
    if (width > 700) return 2;
    return 1;
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => DashboardViewModel(),
      child: Consumer<DashboardViewModel>(
        builder: (context, vm, child) {
          final width = MediaQuery.of(context).size.width;

          if (vm.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                const Text(
                  "Dashboard Overview",
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 20),

                GridView.count(
                  crossAxisCount: getGrid(width),
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 18,
                  mainAxisSpacing: 18,
                  childAspectRatio: 2.4,
                  children: [

                    StatCard(title: "Total Users", value: "${vm.totalUsers}", icon: Icons.people),
                    StatCard(title: "Total Categories", value: "${vm.totalCategories}", icon: Icons.category),
                    StatCard(title: "Total Services", value: "${vm.totalServices}", icon: Icons.miscellaneous_services),
                    StatCard(title: "Total Partners", value: "${vm.totalPartners}", icon: Icons.person),
                    StatCard(title: "Total Orders", value: "${vm.totalOrders}", icon: Icons.shopping_cart),
                    StatCard(title: "Today Orders", value: "${vm.todayOrders}", icon: Icons.today),
                    StatCard(title: "Subscription Earning", value: vm.subscriptionEarning, icon: Icons.workspace_premium),
                    StatCard(title: "Order Earning", value: vm.orderEarning, icon: Icons.currency_rupee),
                    StatCard(title: "Complete Orders", value: "${vm.completeOrders}", icon: Icons.check_circle),
                    StatCard(title: "Assigned Orders", value: "${vm.assignedOrders}", icon: Icons.assignment_ind),
                    StatCard(title: "In Progress Orders", value: "${vm.inProgressOrders}", icon: Icons.pending_actions),
                    StatCard(title: "Cancel Orders", value: "${vm.cancelOrders}", icon: Icons.cancel),
                    StatCard(title: "Total Supporters", value: "${vm.totalSupporters}", icon: Icons.support_agent),

                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}