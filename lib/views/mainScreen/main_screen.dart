import 'package:admin_panel/views/Earning%20screens/subscriptions_earning_screen.dart';
import 'package:admin_panel/views/Pages/pages_screen.dart';
import 'package:admin_panel/views/category/category_screen.dart';
import 'package:admin_panel/views/orderScreen/order_screen.dart';
import 'package:admin_panel/views/services/services_screen.dart';
import 'package:admin_panel/views/settings/banner_screen.dart';
import 'package:admin_panel/views/settings/city_screen.dart';
import 'package:admin_panel/views/settings/locality_screen.dart';
import 'package:admin_panel/views/settings/reviews_screen.dart';
import 'package:admin_panel/views/settings/state_screen.dart';
import 'package:admin_panel/views/user/user_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../viewmodels/navigation_viewmodel.dart';
import '../../widgets/drawer/admin_drawer.dart';
import '../Earning screens/booking_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../partner/partner_screen.dart';
import '../partner/pending_partner_screen.dart';
import '../settings/notifications_screen.dart';

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  Widget getScreen(String page) {
    switch (page) {
      case "Dashboard":
        return const DashboardScreen();

      case "Category":
        return const CategoryScreen();

      case "Partner List":
        return const PartnerScreen();


      case "Pending Approval":
        return const PendingPartnerScreen();


      case "Bookings":
        return const BookingScreen();

      case "Subscriptions":
        return const SubscriptionsEarningScreen();

      case "Users":
        return const UserScreen();

      case "Services":
        return const ServiceScreen();

      case "Orders":
        return const OrdersScreen();

      case "Pages":
        return const PagesScreen();

      case"Banner":
        return const BannerScreen();

      case "State":
        return const StateScreen();

      case "City":
        return const CityScreen();

      case "Locality":
        return const LocalityScreen();

      case "Reviews&Ratings":
        return const ReviewsScreen();

      case "Notifications":
        return const NotificationsScreen();


      default:
        return Center(
          child: Text(
            page,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<NavigationViewModel>(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final bool isDesktop = constraints.maxWidth > 900;

        return Scaffold(
          backgroundColor: AppColors.background,
          drawer: isDesktop
              ? null
              : const Drawer(
            child: AdminDrawer(),
          ),
          body: Row(
            children: [
              if (isDesktop)
                const SizedBox(
                  width: 260,
                  child: AdminDrawer(),
                ),
              Expanded(
                child: Column(
                  children: [
                    Container(
                      height: 72,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xff0F172A),
                            Color(0xff1E3A8A),
                            Color(0xff2563EB),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.12),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          if (!isDesktop)
                            Builder(
                              builder: (context) => IconButton(
                                icon: const Icon(
                                  Icons.menu,
                                  color: Colors.white,
                                ),
                                onPressed: () {
                                  Scaffold.of(context).openDrawer();
                                },
                              ),
                            ),
                          const Spacer(),
                          const Text(
                            "Admin Panel",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            width: isDesktop ? 280 : 180,
                            height: 44,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.14),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.12),
                              ),
                            ),
                            child: const Row(
                              children: [
                                Icon(
                                  Icons.search,
                                  size: 20,
                                  color: Colors.white70,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  "Search...",
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white24,
                                    width: 2,
                                  ),
                                ),
                                child: const CircleAvatar(
                                  radius: 18,
                                  backgroundColor: Colors.white,
                                  child: Icon(
                                    Icons.person,
                                    color: Color(0xff1E3A8A),
                                  ),
                                ),
                              ),
                              if (isDesktop) ...[
                                const SizedBox(width: 10),
                                const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Admin",
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      "Control Panel",
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ]
                            ],
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Container(
                        width: double.infinity,
                        color: AppColors.background,
                        child: getScreen(vm.currentPage),
                      ),
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
}