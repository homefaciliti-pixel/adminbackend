import 'package:flutter/material.dart';
import '../../data/models/partner_model.dart';
import '../../viewmodels/partner_viewmodel.dart';
import '../../views/partner/partner_details_screen.dart';


class PartnerTable extends StatelessWidget {

  final List<PartnerModel> partners;

  final PartnerViewModel vm;

  final void Function(PartnerModel item)?
  onPartnerTap;

  final void Function(PartnerModel item)?
  onEditTap;

  const PartnerTable({

    super.key,

    required this.partners,

    required this.vm,

    this.onPartnerTap,

    this.onEditTap,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      width: double.infinity,

      decoration: BoxDecoration(

        color: Colors.white,

        borderRadius:
        BorderRadius.circular(18),

        boxShadow: [

          BoxShadow(

            color:
            Colors.black.withOpacity(0.04),

            blurRadius: 12,

            offset:
            const Offset(0, 4),
          ),
        ],
      ),

      child: Column(

        children: [

                               /// HEADER
          Container(

            padding:
            const EdgeInsets.symmetric(
              horizontal: 18,
              vertical: 16,
            ),

            decoration:
            const BoxDecoration(

              color:
              Color(0xff111827),

              borderRadius:
              BorderRadius.only(

                topLeft:
                Radius.circular(18),

                topRight:
                Radius.circular(18),
              ),
            ),

            child: Row(

              children: const [

                Expanded(
                  flex: 1,
                  child: Text(
                    "#",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),

                Expanded(
                  flex: 4,
                  child: Text(
                    "Partner",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),

                Expanded(
                  flex: 2,
                  child: Text(
                    "Mobile",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),

                Expanded(
                  flex: 2,
                  child: Text(
                    "City",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),

                Expanded(
                  flex: 2,
                  child: Text(
                    "State",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),

                Expanded(
                  flex: 2,
                  child: Text(
                    "Created At",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),

                Expanded(
                  flex: 1,
                  child: Text(
                    "Status",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),

                Expanded(
                  flex: 1,
                  child: Text(
                    "Edit",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),

                            /// BODY


          Expanded(

            child: ListView.builder(

              itemCount:
              partners.length,

              itemBuilder:
                  (context, index) {

                                             /// IMPORTANT
                final item =
                partners[index];

                return Container(

                  padding:
                  const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),

                  decoration:
                  BoxDecoration(

                    border: Border(

                      bottom:
                      BorderSide(
                        color:
                        Colors.grey.shade200,
                      ),
                    ),
                  ),

                  child: Row(

                    children: [

                                                    /// SERIAL
                      Expanded(
                        flex: 1,
                        child: Text(
                          "${index + 1}",
                        ),
                      ),

                                            /// PARTNER
                      Expanded(

                        flex: 4,

                        child: InkWell(

                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => PartnerDetailsScreen(
                                  partner: item,
                                ),
                              ),
                            );
                          },
                          child: Row(

                            children: [

                              CircleAvatar(

                                radius: 24,

                                backgroundColor:
                                Colors.grey.shade200,

                                backgroundImage:
                                item.image.isNotEmpty
                                    ? NetworkImage(
                                  item.image,
                                )
                                    : null,

                                child:
                                item.image.isEmpty
                                    ? const Icon(
                                  Icons.person,
                                )
                                    : null,
                              ),

                              const SizedBox(
                                  width: 14),

                              Expanded(

                                child: Column(

                                  crossAxisAlignment:
                                  CrossAxisAlignment.start,

                                  children: [

                                    Text(

                                      item.name,

                                      style:
                                      const TextStyle(

                                        fontWeight:
                                        FontWeight.w600,

                                        fontSize: 15,
                                      ),
                                    ),

                                    const SizedBox(
                                        height: 4),

                                    Text(

                                      item.email,

                                      style: TextStyle(

                                        color:
                                        Colors.grey.shade600,

                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      /// MOBILE
                      Expanded(
                        flex: 2,
                        child: Text(
                          item.mobile,
                        ),
                      ),

                      /// CITY
                      Expanded(
                        flex: 2,
                        child: Text(
                          item.city,
                        ),
                      ),

                      /// STATE
                      Expanded(
                        flex: 2,
                        child: Text(
                          item.state,
                        ),
                      ),

                      /// DATE
                      Expanded(
                        flex: 2,
                        child: Text(
                          item.createdAt,
                        ),
                      ),

                      /// STATUS
                      Expanded(

                        flex: 1,

                        child: Switch(

                          value:
                          item.status,

                          onChanged: (value) {

                            vm.toggleStatus(
                              index,
                              value,
                            );
                          },
                        ),
                      ),

                      /// EDIT
                      Expanded(

                        flex: 1,

                        child: IconButton(

                          icon: const Icon(
                            Icons.edit,
                          ),

                          onPressed: () {

                            if (onEditTap !=
                                null) {

                              onEditTap!(item);
                            }
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