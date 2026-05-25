class PartnerModel {
  /// basic info
  final int id;
  final String name;
  final String email;
  final String mobile;
  final String city;
  final String state;
  final String locality;
  final String address;
  final String image;

  /// status flags
  bool status; // active / inactive
  bool isApproved; // approved / pending

  /// additional details
  final String gender;
  final String experience;
  final List<String> services;

  /// kyc
  final String aadhaarNumber;
  final String panNumber;
  final String bankName;
  final String accountNumber;
  final String ifscCode;
  final List<String> documents;

  /// wallet / earnings
  final double walletBalance;
  final double totalEarnings;
  final double withdrawnAmount;

  /// booking stats
  final int totalBookings;
  final int completedBookings;
  final int cancelledBookings;
  final int pendingBookings;

  /// reviews
  final double rating;
  final int totalReviews;

  /// profile created date
  final String createdAt;

  PartnerModel({
    required this.id,
    required this.name,
    required this.email,
    required this.mobile,
    required this.city,
    required this.state,
    required this.locality,
    required this.address,
    required this.image,
    required this.status,
    required this.isApproved,
    required this.gender,
    required this.experience,
    required this.services,
    required this.aadhaarNumber,
    required this.panNumber,
    required this.bankName,
    required this.accountNumber,
    required this.ifscCode,
    required this.documents,
    required this.walletBalance,
    required this.totalEarnings,
    required this.withdrawnAmount,
    required this.totalBookings,
    required this.completedBookings,
    required this.cancelledBookings,
    required this.pendingBookings,
    required this.rating,
    required this.totalReviews,
    required this.createdAt,
  });

  /// helper for updates
  PartnerModel copyWith({
    int? id,
    String? name,
    String? email,
    String? mobile,
    String? city,
    String? state,
    String? locality,
    String? address,
    String? image,
    bool? status,
    bool? isApproved,
    String? gender,
    String? experience,
    List<String>? services,
    String? aadhaarNumber,
    String? panNumber,
    String? bankName,
    String? accountNumber,
    String? ifscCode,
    List<String>? documents,
    double? walletBalance,
    double? totalEarnings,
    double? withdrawnAmount,
    int? totalBookings,
    int? completedBookings,
    int? cancelledBookings,
    int? pendingBookings,
    double? rating,
    int? totalReviews,
    String? createdAt,
  }) {
    return PartnerModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      mobile: mobile ?? this.mobile,
      city: city ?? this.city,
      state: state ?? this.state,
      locality: locality ?? this.locality,
      address: address ?? this.address,
      image: image ?? this.image,
      status: status ?? this.status,
      isApproved: isApproved ?? this.isApproved,
      gender: gender ?? this.gender,
      experience: experience ?? this.experience,
      services: services ?? this.services,
      aadhaarNumber: aadhaarNumber ?? this.aadhaarNumber,
      panNumber: panNumber ?? this.panNumber,
      bankName: bankName ?? this.bankName,
      accountNumber: accountNumber ?? this.accountNumber,
      ifscCode: ifscCode ?? this.ifscCode,
      documents: documents ?? this.documents,
      walletBalance: walletBalance ?? this.walletBalance,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      withdrawnAmount: withdrawnAmount ?? this.withdrawnAmount,
      totalBookings: totalBookings ?? this.totalBookings,
      completedBookings: completedBookings ?? this.completedBookings,
      cancelledBookings: cancelledBookings ?? this.cancelledBookings,
      pendingBookings: pendingBookings ?? this.pendingBookings,
      rating: rating ?? this.rating,
      totalReviews: totalReviews ?? this.totalReviews,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory PartnerModel.fromJson(Map<String, dynamic> json) {
    return PartnerModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      mobile: json['mobile'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      locality: json['locality'] ?? '',
      address: json['address'] ?? '',
      image: json['image'] ?? '',
      status: json['status'] == 1 || json['status'] == true,
      isApproved: json['isApproved'] == 1 || json['isApproved'] == true,
      gender: json['gender'] ?? '',
      experience: json['experience'] ?? '',
      services: json['services'] is String
          ? (json['services'] as String).split(',').where((e) => e.isNotEmpty).toList()
          : (json['services'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      aadhaarNumber: json['aadhaarNumber'] ?? '',
      panNumber: json['panNumber'] ?? '',
      bankName: json['bankName'] ?? '',
      accountNumber: json['accountNumber'] ?? '',
      ifscCode: json['ifscCode'] ?? '',
      documents: json['documents'] is String
          ? (json['documents'] as String).split(',').where((e) => e.isNotEmpty).toList()
          : (json['documents'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      walletBalance: json['walletBalance'] is num ? (json['walletBalance'] as num).toDouble() : double.parse(json['walletBalance']?.toString() ?? '0.0'),
      totalEarnings: json['totalEarnings'] is num ? (json['totalEarnings'] as num).toDouble() : double.parse(json['totalEarnings']?.toString() ?? '0.0'),
      withdrawnAmount: json['withdrawnAmount'] is num ? (json['withdrawnAmount'] as num).toDouble() : double.parse(json['withdrawnAmount']?.toString() ?? '0.0'),
      totalBookings: json['totalBookings'] is int ? json['totalBookings'] : int.parse(json['totalBookings']?.toString() ?? '0'),
      completedBookings: json['completedBookings'] is int ? json['completedBookings'] : int.parse(json['completedBookings']?.toString() ?? '0'),
      cancelledBookings: json['cancelledBookings'] is int ? json['cancelledBookings'] : int.parse(json['cancelledBookings']?.toString() ?? '0'),
      pendingBookings: json['pendingBookings'] is int ? json['pendingBookings'] : int.parse(json['pendingBookings']?.toString() ?? '0'),
      rating: json['rating'] is num ? (json['rating'] as num).toDouble() : double.parse(json['rating']?.toString() ?? '0.0'),
      totalReviews: json['totalReviews'] is int ? json['totalReviews'] : int.parse(json['totalReviews']?.toString() ?? '0'),
      createdAt: json['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'mobile': mobile,
      'city': city,
      'state': state,
      'locality': locality,
      'address': address,
      'image': image,
      'status': status ? 1 : 0,
      'isApproved': isApproved ? 1 : 0,
      'gender': gender,
      'experience': experience,
      'services': services,
      'aadhaarNumber': aadhaarNumber,
      'panNumber': panNumber,
      'bankName': bankName,
      'accountNumber': accountNumber,
      'ifscCode': ifscCode,
      'documents': documents,
      'walletBalance': walletBalance,
      'totalEarnings': totalEarnings,
      'withdrawnAmount': withdrawnAmount,
      'totalBookings': totalBookings,
      'completedBookings': completedBookings,
      'cancelledBookings': cancelledBookings,
      'pendingBookings': pendingBookings,
      'rating': rating,
      'totalReviews': totalReviews,
      'createdAt': createdAt,
    };
  }
}