class BookingEarningModel {

  /// unique id
  final int id;

  /// transaction id
  final String transactionId;

  /// service amount
  final double serviceAmount;

  /// payment method
  final String paymentMethod;

  /// extra service amount
  final double extraServiceAmount;

  /// extra service payment method
  final String extraServicePaymentMethod;

  /// total amount
  final double totalAmount;

  /// order date
  final String orderDate;

  BookingEarningModel({

    required this.id,

    required this.transactionId,

    required this.serviceAmount,

    required this.paymentMethod,

    required this.extraServiceAmount,

    required this.extraServicePaymentMethod,

    required this.totalAmount,

    required this.orderDate,
  });

  factory BookingEarningModel.fromJson(Map<String, dynamic> json) {
    return BookingEarningModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      transactionId: json['transactionId'] ?? '',
      serviceAmount: json['serviceAmount'] is num ? (json['serviceAmount'] as num).toDouble() : double.parse(json['serviceAmount'].toString()),
      paymentMethod: json['paymentMethod'] ?? '',
      extraServiceAmount: json['extraServiceAmount'] is num ? (json['extraServiceAmount'] as num).toDouble() : double.parse(json['extraServiceAmount'].toString()),
      extraServicePaymentMethod: json['extraServicePaymentMethod'] ?? '',
      totalAmount: json['totalAmount'] is num ? (json['totalAmount'] as num).toDouble() : double.parse(json['totalAmount'].toString()),
      orderDate: json['orderDate'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transactionId': transactionId,
      'serviceAmount': serviceAmount,
      'paymentMethod': paymentMethod,
      'extraServiceAmount': extraServiceAmount,
      'extraServicePaymentMethod': extraServicePaymentMethod,
      'totalAmount': totalAmount,
      'orderDate': orderDate,
    };
  }
}