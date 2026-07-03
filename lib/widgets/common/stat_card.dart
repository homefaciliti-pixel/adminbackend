import 'package:flutter/material.dart';

class StatCard extends StatefulWidget {
  final String title;
  final String value;
  final IconData icon;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
  });

  @override
  State<StatCard> createState() => _StatCardState();
}

class _StatCardState extends State<StatCard> {
  bool isHover = false;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;

    final bool small = width < 700;

    return MouseRegion(
      onEnter: (_) => setState(() => isHover = true),
      onExit: (_) => setState(() => isHover = false),

      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        transform: Matrix4.translationValues(
          0,
          isHover ? -3 : 0,
          0,
        ),
        padding: EdgeInsets.all(small ? 12 : 16),

        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: isHover
                  ? Colors.blue.withOpacity(0.12)
                  : Colors.black.withOpacity(0.05),
              blurRadius: isHover ? 14 : 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),

        child: Row(
          children: [

            /// Icon
            Container(
              height: small ? 42 : 50,
              width: small ? 42 : 50,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    Color(0xff1E3A8A),
                    Color(0xff2563EB),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                widget.icon,
                color: Colors.white,
                size: small ? 20 : 24,
              ),
            ),

            const SizedBox(width: 12),

            /// Text
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  Text(
                    widget.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: small ? 11 : 13,
                      color: Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 4),

                  Text(
                    widget.value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: small ? 18 : 24,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xff0F172A),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}