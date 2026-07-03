class SubscriptionEarningModel {
  final int id;

  final String partnerName;
  final double amount;
  final String paymentMethod;
  final String purchaseDate;
  final String status;

  SubscriptionEarningModel({
    required this.id,

    required this.partnerName,
    required this.amount,
    required this.paymentMethod,
    required this.purchaseDate,
    required this.status,
  });

  factory SubscriptionEarningModel.fromJson(Map<String, dynamic> json) {
    return SubscriptionEarningModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      partnerName: json['partnerName'] ?? '',
      amount: json['amount'] is num ? (json['amount'] as num).toDouble() : double.parse(json['amount'].toString()),
      paymentMethod: json['paymentMethod'] ?? '',
      purchaseDate: json['purchaseDate'] ?? '',
      status: json['status'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'partnerName': partnerName,
      'amount': amount,
      'paymentMethod': paymentMethod,
      'purchaseDate': purchaseDate,
      'status': status,
    };
  }
}