class StateModel {

  /// unique id
  final int id;

  /// state name
  final String name;

  /// active/inactive
  bool status;

  StateModel({

    required this.id,

    required this.name,

    required this.status,
  });

  /// copyWith
  ///
  /// update/edit ke kaam aayega

  StateModel copyWith({

    int? id,

    String? name,

    bool? status,
  }) {

    return StateModel(

      id: id ?? this.id,

      name: name ?? this.name,

      status: status ?? this.status,
    );
  }

  factory StateModel.fromJson(Map<String, dynamic> json) {
    return StateModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'status': status ? 1 : 0,
    };
  }
}