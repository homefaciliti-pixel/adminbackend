import 'dart:typed_data';

class CategoryModel {
  final int id;
  final String title;
  final String parent;

  /// picked image path (desktop/mobile)
  final String image;

  /// picked image bytes (web support)
  final Uint8List? imageBytes;

  bool status;

  CategoryModel({
    required this.id,
    required this.title,
    required this.parent,
    required this.image,
    this.imageBytes,
    required this.status,
  });

  /// copy update helper
  CategoryModel copyWith({
    int? id,
    String? title,
    String? parent,
    String? image,
    Uint8List? imageBytes,
    bool? status,
  }) {
    return CategoryModel(
      id: id ?? this.id,
      title: title ?? this.title,
      parent: parent ?? this.parent,
      image: image ?? this.image,
      imageBytes: imageBytes ?? this.imageBytes,
      status: status ?? this.status,
    );
  }

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? '',
      parent: json['parent'] ?? '',
      image: json['image'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'parent': parent,
      'image': image,
      'status': status ? 1 : 0,
    };
  }
}