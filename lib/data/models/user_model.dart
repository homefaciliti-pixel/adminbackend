class UserModel {

  //basic info

  final int  id;
  final String name ;
  final String  email;
  final String  mobile;
  final String  address;


  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.mobile,
    required this.address,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      mobile: json['mobile'] ?? '',
      address: json['address'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'mobile': mobile,
      'address': address,
    };
  }
}
