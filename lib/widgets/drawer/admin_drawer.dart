import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../viewmodels/navigation_viewmodel.dart';

class AdminDrawer extends StatelessWidget {
  const AdminDrawer({super.key});

  void closeDrawerIfMobile(BuildContext context) {
    if (MediaQuery.of(context).size.width < 900) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<NavigationViewModel>(context);

    return Container(
      height: double.infinity,
      width: double.infinity,
      color: AppColors.sidebar,
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const SizedBox(height: 20),

            /// LOGO
            Center(
              child: Image.asset(
                'assets/images/logo.png',
                width: 120,
                fit: BoxFit.contain,
              )
            ),



            // const Center(
            //   child: Text(
            //     "Home Faciliti",
            //     style: TextStyle(
            //       color: Colors.white,
            //       fontSize: 18,
            //     ),
            //   ),
            // ),

            const SizedBox(height: 20),

            menuTile(context, vm, "Dashboard", Icons.dashboard),
            menuTile(context, vm, "Category", Icons.category),

            expansionMenu(
              context,
              vm,
              "Partner",
              Icons.people,
              ["Partner List", "Pending Approval"],
            ),

            expansionMenu(
              context,
              vm,
              "Earnings",
              Icons.currency_rupee,
              ["Bookings", "Subscriptions"],
            ),

            menuTile(
              context,
              vm,
              "Users",
              Icons.person,
            ),

            menuTile(
              context,
              vm,
              "Services",
              Icons.miscellaneous_services,
            ),

            menuTile(
              context,
              vm,
              "Orders",
              Icons.shopping_cart,
            ),

            menuTile(
              context,
              vm,
              "Pages",
              Icons.pages,
            ),

            expansionMenu(
              context,
              vm,
              "Settings",
              Icons.settings,
              ["Banner",
                "State",
                "City",
                "Locality",
                "Commission",
                "Reviews&Ratings",
                "Notifications"],
            ),

            menuTile(
              context,
              vm,
              "Reports",
              Icons.bar_chart,
            ),

            menuTile(
              context,
              vm,
              "Support",
              Icons.support_agent,
            ),
          ],
        ),
      ),
    );
  }

  Widget menuTile(
      BuildContext context,
      NavigationViewModel vm,
      String title,
      IconData icon,
      ) {
    bool selected = vm.currentPage == title;

    return ListTile(
      tileColor: selected ? AppColors.primary : null,
      leading: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      onTap: () {
        vm.changePage(title);
        closeDrawerIfMobile(context);
      },
    );
  }

  Widget expansionMenu(
      BuildContext context,
      NavigationViewModel vm,
      String title,
      IconData icon,
      List<String> items,
      ) {
    return ExpansionTile(
      iconColor: Colors.white,
      collapsedIconColor: Colors.white,
      leading: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      children: items.map((item) {
        bool selected = vm.currentPage == item;

        return ListTile(
          tileColor: selected ? AppColors.primary : null,
          contentPadding: const EdgeInsets.only(left: 40),
          title: Text(
            item,
            style: const TextStyle(color: Colors.white70),
          ),
          onTap: () {
            vm.changePage(item);
            closeDrawerIfMobile(context);
          },
        );
      }).toList(),
    );
  }
}