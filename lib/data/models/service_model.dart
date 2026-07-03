class ServiceModel {
  /// unique service id
  final int id;

  /// service title
  final String title;

  /// service price
  final double price;

  /// service image path/url
  final String image;

  /// service description
  final String description;

  /// active / inactive
  bool status;

  ServiceModel({
    required this.id,
    required this.title,
    required this.price,
    required this.image,
    required this.description,
    required this.status,
  });

  /// copyWith
  /// ek-ek field update karne ke kaam aata hai
  ServiceModel copyWith({
    int? id,
    String? title,
    double? price,
    String? image,
    String? description,
    bool? status,
  }) {
    return ServiceModel(
      id: id ?? this.id,
      title: title ?? this.title,
      price: price ?? this.price,
      image: image ?? this.image,
      description: description ?? this.description,
      status: status ?? this.status,
    );
  }

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? '',
      price: json['price'] is num ? (json['price'] as num).toDouble() : double.parse(json['price'].toString()),
      image: json['image'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'price': price,
      'image': image,
      'description': description,
      'status': status ? 1 : 0,
    };
  }
}