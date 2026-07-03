class OrderModel {
  /// unique id
  final int id;

  /// service request number
  final String serviceRequestNumber;

  /// service title
  final String serviceName;

  /// service amount
  final double serviceAmount;

  /// booking slot time
  final String slotTime;

  /// service date
  final String serviceDate;

  /// city name
  final String city;

  /// locality / area
  final String locality;

  /// order status
  /// example:
  /// Pending, Assigned, Completed, Cancelled
  String status;

  /// current vendor name
  final String vendorName;

  final String address;

  /// created time
  final String createdAt;

  OrderModel({
    required this.id,
    required this.serviceRequestNumber,
    required this.serviceName,
    required this.serviceAmount,
    required this.slotTime,
    required this.serviceDate,
    required this.city,
    required this.locality,
    required this.status,
    required this.vendorName,
    required this.createdAt, required this.address,
  });

  /// copyWith
  /// ek-ek field update karne ke liye
  OrderModel copyWith({
    int? id,
    String? serviceRequestNumber,
    String? serviceName,
    double? serviceAmount,
    String? slotTime,
    String? serviceDate,
    String? city,
    String? locality,
    String? status,
    String? vendorName,
    String? createdAt,
    String? address,
  }) {
    return OrderModel(
      id: id ?? this.id,
      serviceRequestNumber: serviceRequestNumber ?? this.serviceRequestNumber,
      serviceName: serviceName ?? this.serviceName,
      serviceAmount: serviceAmount ?? this.serviceAmount,
      slotTime: slotTime ?? this.slotTime,
      serviceDate: serviceDate ?? this.serviceDate,
      city: city ?? this.city,
      locality: locality ?? this.locality,
      status: status ?? this.status,
      vendorName: vendorName ?? this.vendorName,
      createdAt: createdAt ?? this.createdAt,
      address: address ?? this.address,
    );
  }

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      serviceRequestNumber: json['serviceRequestNumber'] ?? '',
      serviceName: json['serviceName'] ?? '',
      serviceAmount: json['serviceAmount'] is num ? (json['serviceAmount'] as num).toDouble() : double.parse(json['serviceAmount'].toString()),
      slotTime: json['slotTime'] ?? '',
      serviceDate: json['serviceDate'] ?? '',
      city: json['city'] ?? '',
      locality: json['locality'] ?? '',
      status: json['status'] ?? '',
      vendorName: json['vendorName'] ?? '',
      address: json['address'] ?? '',
      createdAt: json['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serviceRequestNumber': serviceRequestNumber,
      'serviceName': serviceName,
      'serviceAmount': serviceAmount,
      'slotTime': slotTime,
      'serviceDate': serviceDate,
      'city': city,
      'locality': locality,
      'status': status,
      'vendorName': vendorName,
      'address': address,
      'createdAt': createdAt,
    };
  }
}