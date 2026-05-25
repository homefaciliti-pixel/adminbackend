import 'package:flutter/material.dart';
import '../../data/models/user_model.dart';
import '../../viewmodels/user_viewmodel.dart';

class UserTable extends StatelessWidget {
  final List<UserModel> users;
  final UserViewmodel vm;

  const UserTable({
    super.key,
    required this.users,
    required this.vm,
  });

                        ///users show details

  void _showUserDetails(
      BuildContext context,
      UserModel user,
      ) {

    showDialog(

      context: context,

      builder: (_) {

        return Dialog(

          shape: RoundedRectangleBorder(

            borderRadius:
            BorderRadius.circular(20),
          ),

          child: Container(

            width: 500,

            padding:
            const EdgeInsets.all(24),

            child: Column(

              mainAxisSize:
              MainAxisSize.min,

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                /// HEADER
                Row(

                  mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,

                  children: [

                    const Text(

                      "User Details",

                      style: TextStyle(

                        fontSize: 22,

                        fontWeight:
                        FontWeight.bold,
                      ),
                    ),

                    IconButton(

                      onPressed: () {

                        Navigator.pop(
                          context,
                        );
                      },

                      icon: const Icon(
                        Icons.close,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                _detailRow(
                  "ID",
                  user.id.toString(),
                ),

                _detailRow(
                  "Name",
                  user.name,
                ),

                _detailRow(
                  "Mobile",
                  user.mobile,
                ),

                _detailRow(
                  "Email",
                  user.email,
                ),

                _detailRow(
                  "Address",
                  user.address,
                ),
              ],
            ),
          ),
        );
      },
    );
  }



  void _showDeleteDialog(
      BuildContext context,
      UserModel user
      ){
    showDialog(context: context, builder:(_){
      return AlertDialog(
        title: const Text("Delete User"),
        content: Text("Are you sure you want to delete ${user.name}?",
        ),
        actions: [
          TextButton(onPressed: (){
            Navigator.pop(context);
          }, child: Text("Cancel"),

          ),
          ElevatedButton(onPressed: (){
            vm.deleteUser(user.id);
            Navigator.pop(context);
          },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),

              child:Text("Delete") )
        ],
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          /// =================================
          /// TABLE HEADER
          /// =================================
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 18,
              vertical: 16,
            ),
            decoration: const BoxDecoration(
              color: Color(0xff111827),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
              ),
            ),
            child: const Row(
              children: [
                Expanded(
                  flex: 1,
                  child: Text(
                    "#",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Expanded(
                  flex: 3,
                  child: Text(
                    "Name",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    "Mobile",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Expanded(
                  flex: 3,
                  child: Text(
                    "Email",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Expanded(
                  flex: 4,
                  child: Text(
                    "Address",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Text(
                    "Action",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          /// =================================
          /// TABLE BODY
          /// =================================
          Expanded(
            child: ListView.builder(
              itemCount: users.length,
              itemBuilder: (context, index) {
                final item = users[index];

                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.grey.shade200,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 1,
                        child: Text("${index + 1}"),
                      ),


                                   ///name
                      Expanded(
                        flex: 3,

                        child: InkWell(

                          onTap: () {

                            _showUserDetails(
                              context,
                              item,
                            );
                          },

                          child: Text(

                            item.name,

                            overflow:
                            TextOverflow.ellipsis,

                            style: const TextStyle(

                              color: Colors.blue,

                              fontWeight:
                              FontWeight.w600,
                            ),
                          ),
                        ),
                      ),


                      Expanded(
                        flex: 2,
                        child: Text(
                          item.mobile,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          item.email,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),


                      Expanded(
                        flex: 4,
                        child: Text(
                          item.address,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Expanded(
                        flex: 1,
                        child: IconButton(
                          tooltip: "Delete",
                          icon: const Icon(
                            Icons.delete,
                            color: Colors.red,
                          ),
                          onPressed: () {
                            _showDeleteDialog(context, item);
                          },
                        ),
                      ),

                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}



Widget _detailRow(
    String title,
    String value,
    ) {

  return Padding(

    padding:
    const EdgeInsets.only(
      bottom: 16,
    ),

    child: Row(

      crossAxisAlignment:
      CrossAxisAlignment.start,

      children: [

        SizedBox(

          width: 100,

          child: Text(

            "$title :",

            style: const TextStyle(

              fontWeight:
              FontWeight.w600,
            ),
          ),
        ),

        Expanded(

          child: Text(
            value,
          ),
        ),
      ],
    ),
  );
}