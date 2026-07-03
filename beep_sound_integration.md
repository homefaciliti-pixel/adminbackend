# Beep Sound Integration Guide (Flutter)

This guide provides the complete setup, pubspec configuration, and code integration to play a **beep sound alert** and trigger a **system notification** when a new booking arrives.

---

## 1. Get the Sound File
We have provided the actual audio file for you. You can download and add it to your project assets:
* **Audio File:** [new_booking.wav](file:///C:/Users/user/.gemini/antigravity/brain/4533860b-0498-4962-9458-418a4aa0e258/new_booking.wav)
* **Project Directory Location:** Put this file in your project under `assets/sounds/new_booking.wav`

---

## 2. Pubspec Configuration (`pubspec.yaml`)
To use the audio players plugin and reference the sound asset, declare the dependency and asset directory inside your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  # For audio playback
  audioplayers: ^6.1.0
  # For push notifications
  flutter_local_notifications: ^18.0.1

flutter:
  assets:
    - assets/sounds/
```

---

## 3. Audio & Notification Controller ([home_viewmodel.dart](file:///E:/hf_partner/lib/ViewModel/home/home_viewmodel.dart))
Below is the ready-to-use Flutter code that manages the `AudioPlayer` instance, initializes notifications, and plays the beep sound:

```dart
import 'package:flutter/widgets.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class HomeViewModel extends ChangeNotifier {
  // Audio player & notification instances
  final AudioPlayer _audioPlayer = AudioPlayer();
  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  // Tracks booking count across api polls to detect new arrivals
  int _lastKnownBookingCount = -1;

  HomeViewModel() {
    _initNotifications();
  }

  // Initialize push notification settings
  Future<void> _initNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    await _notificationsPlugin.initialize(initSettings);
  }

  /// Play beep alert sound from local asset (looping for 5 seconds)
  Future<void> _playBeep() async {
    try {
      await _audioPlayer.stop();
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('sounds/new_booking.wav'));
      
      // Stop the audio loop after exactly 5 seconds
      Future.delayed(const Duration(seconds: 5), () async {
        await _audioPlayer.stop();
      });
    } catch (e) {
      debugPrint('Beep sound error: $e');
    }
  }

  /// Show a system push notification when a new booking arrives
  Future<void> _showNewBookingNotification(int count) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'new_booking_channel',
      'New Bookings',
      channelDescription: 'Alerts for new incoming bookings',
      importance: Importance.max,
      priority: Priority.high,
      playSound: false, // Rely on our custom _playBeep sound player
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );
    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: false,
    );
    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    await _notificationsPlugin.show(
      0,
      'New Booking!',
      'You have $count new booking${count > 1 ? 's' : ''}. Tap to view.',
      details,
    );
  }

  @override
  void dispose() {
    _audioPlayer.dispose(); // Release audio player resource
    super.dispose();
  }
}
```

---

## 4. Trigger on New Booking Arrival
Inside the polling method where bookings are fetched, trigger the beep and notification when the new booking count exceeds the previous known count:

```dart
  Future<void> fetchBookings(String token) async {
    try {
      final response = await http.get(
        Uri.parse("${AuthViewModel.baseUrl}/bookings"),
        headers: {"Authorization": "Bearer $token"},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final newBookings = data.map((item) => {
          "id": item["id"].toString(),
          "status": item["status"].toString(),
          // other fields...
        }).toList();

        final int newCount = newBookings.length;

        // Trigger beep + system notification if count increased
        if (_lastKnownBookingCount >= 0 && newCount > _lastKnownBookingCount) {
          final int diff = newCount - _lastKnownBookingCount;
          _playBeep();
          _showNewBookingNotification(diff);
        }
        _lastKnownBookingCount = newCount;

        bookings = newBookings;
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Error fetching bookings: $e");
    }
  }
```
