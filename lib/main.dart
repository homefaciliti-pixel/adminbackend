import 'package:admin_panel/data/models/booking_earning_model.dart';
import 'package:admin_panel/viewmodels/Settings_ViewModels/banner_viewmodel.dart';
import 'package:admin_panel/viewmodels/Settings_ViewModels/city_viewmodel.dart';
import 'package:admin_panel/viewmodels/Settings_ViewModels/locality_viewmodel.dart';
import 'package:admin_panel/viewmodels/Settings_ViewModels/notification_viewmodel.dart';
import 'package:admin_panel/viewmodels/Settings_ViewModels/review_viewmodel.dart';
import 'package:admin_panel/viewmodels/Settings_ViewModels/state_viewmodel.dart';
import 'package:admin_panel/viewmodels/earnings_viewmodel.dart';
import 'package:admin_panel/viewmodels/order_viewmodel.dart';
import 'package:admin_panel/viewmodels/page_viewmodel.dart';
import 'package:admin_panel/viewmodels/service_viewmodel.dart';
import 'package:admin_panel/viewmodels/user_viewmodel.dart';
import 'package:admin_panel/views/mainScreen/main_screen.dart';
import 'package:admin_panel/views/partner/partner_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'viewmodels/navigation_viewmodel.dart';
import 'viewmodels/partner_viewmodel.dart';

void main() {

  runApp(

    MultiProvider(

      providers: [

        /// navigation provider
        ChangeNotifierProvider(
          create: (_) => NavigationViewModel(),
        ),

        /// partner provider
        ChangeNotifierProvider(
          create: (_) => PartnerViewModel(),
        ),
        ChangeNotifierProvider(
            create: (_)=>EarningsViewModel()),

        ChangeNotifierProvider(
            create: (_)=>UserViewmodel()),

        ChangeNotifierProvider(
            create: (_)=>ServiceViewModel()),
        
        ChangeNotifierProvider(
            create: (_)=>OrderViewModel()),

        ChangeNotifierProvider(
            create: (_)=>PageViewModel()),

        ChangeNotifierProvider(
            create: (_)=>BannerViewModel()),

        ChangeNotifierProvider(
            create: (_)=>StateViewModel()),

        ChangeNotifierProvider(
            create: (_)=>CityViewModel()),

        ChangeNotifierProvider(
            create: (_)=>LocalityViewModel()),

        ChangeNotifierProvider(
            create: (_)=>ReviewViewModel()),

        ChangeNotifierProvider(
            create: (_)=>NotificationViewModel())



      ],

      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {

  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {

    return MaterialApp(

      debugShowCheckedModeBanner: false,

      title: "Admin Panel",

      builder: (context, child) {

        return MediaQuery(

          data: MediaQuery.of(context).copyWith(
            textScaleFactor: 1.0,
          ),

          child: child!,
        );
      },

      home: const MainScreen(),
    );
  }
}