class ReviewModel {
  /// unique review id
  final int id;

  /// customer/user name
  final String userName;

  /// partner name
  final String partnerName;

  /// service name
  final String serviceName;

  /// rating from 1 to 5
  final double rating;

  /// review text
  final String reviewText;

  /// review status
  /// example: Approved / Pending / Hidden
  bool status;

  ReviewModel({
    required this.id,
    required this.userName,
    required this.partnerName,
    required this.serviceName,
    required this.rating,
    required this.reviewText,
    required this.status,
  });

  /// copyWith
  ///
  /// edit/update me help karta hai
  ReviewModel copyWith({
    int? id,
    String? userName,
    String? partnerName,
    String? serviceName,
    double? rating,
    String? reviewText,
    bool? status,
  }) {
    return ReviewModel(
      id: id ?? this.id,
      userName: userName ?? this.userName,
      partnerName: partnerName ?? this.partnerName,
      serviceName: serviceName ?? this.serviceName,
      rating: rating ?? this.rating,
      reviewText: reviewText ?? this.reviewText,
      status: status ?? this.status,
    );
  }

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      userName: json['userName'] ?? '',
      partnerName: json['partnerName'] ?? '',
      serviceName: json['serviceName'] ?? '',
      rating: json['rating'] is num ? (json['rating'] as num).toDouble() : double.parse(json['rating'].toString()),
      reviewText: json['reviewText'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userName': userName,
      'partnerName': partnerName,
      'serviceName': serviceName,
      'rating': rating,
      'reviewText': reviewText,
      'status': status ? 1 : 0,
    };
  }
}