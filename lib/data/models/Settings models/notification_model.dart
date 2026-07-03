class NotificationModel {
  /// unique notification id
  final int id;

  /// notification title
  final String title;

  /// notification message/body
  final String message;

  /// target audience
  /// example: All Users / All Partners / Selected
  final String audience;

  /// created date
  final String createdAt;

  /// active / inactive
  bool status;

  // sent /not sent
  bool isSent;

  ///sent time
  String sentAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.audience,
    required this.createdAt,
    required this.status,
    this.isSent =false,
    this.sentAt ="",

  });

  /// copyWith
  ///
  /// edit/update ke kaam aata hai
  NotificationModel copyWith({
    int? id,
    String? title,
    String? message,
    String? audience,
    String? createdAt,
    bool? status,
    bool? isSent,
    String? sentAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      audience: audience ?? this.audience,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
      isSent: isSent ?? this.isSent,
      sentAt: sentAt ?? this.sentAt,
    );
  }

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      audience: json['audience'] ?? '',
      createdAt: json['createdAt'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
      isSent: json['isSent'] == 1 || json['isSent'] == true,
      sentAt: json['sentAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'audience': audience,
      'createdAt': createdAt,
      'status': status ? 1 : 0,
      'isSent': isSent ? 1 : 0,
      'sentAt': sentAt,
    };
  }
}