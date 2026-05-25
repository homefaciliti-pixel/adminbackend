class BannerModel {
  /// unique banner id
  final int id;

  /// banner title
  final String title;

  /// banner image url/path
  final String image;

  /// active / inactive
  bool status;

  BannerModel({
    required this.id,
    required this.title,
    required this.image,
    required this.status,
  });

  /// copyWith
  /// edit/update ke kaam aata hai
  BannerModel copyWith({
    int? id,
    String? title,
    String? image,
    bool? status,
  }) {
    return BannerModel(
      id: id ?? this.id,
      title: title ?? this.title,
      image: image ?? this.image,
      status: status ?? this.status,
    );
  }

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? '',
      image: json['image'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'image': image,
      'status': status ? 1 : 0,
    };
  }
}