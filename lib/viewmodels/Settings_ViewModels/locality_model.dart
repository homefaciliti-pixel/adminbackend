class LocalityModel {
  /// unique locality id
  final int id;

  /// locality name
  final String localityName;

  /// city name
  final String cityName;

  /// state name
  final String stateName;

  /// active / inactive
  bool status;

  LocalityModel({
    required this.id,
    required this.localityName,
    required this.cityName,
    required this.stateName,
    required this.status,
  });

  /// copyWith
  ///
  /// edit/update me help karega
  LocalityModel copyWith({
    int? id,
    String? localityName,
    String? cityName,
    String? stateName,
    bool? status,
  }) {
    return LocalityModel(
      id: id ?? this.id,
      localityName: localityName ?? this.localityName,
      cityName: cityName ?? this.cityName,
      stateName: stateName ?? this.stateName,
      status: status ?? this.status,
    );
  }

  factory LocalityModel.fromJson(Map<String, dynamic> json) {
    return LocalityModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      localityName: json['localityName'] ?? '',
      cityName: json['cityName'] ?? '',
      stateName: json['stateName'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'localityName': localityName,
      'cityName': cityName,
      'stateName': stateName,
      'status': status ? 1 : 0,
    };
  }
}