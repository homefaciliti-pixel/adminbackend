import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api';

  // Helper to construct headers
  static Map<String, String> _headers() {
    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    };
  }

  // GET a list of items
  static Future<List<T>> getList<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => fromJson(json as Map<String, dynamic>)).toList();
      } else {
        throw Exception('Failed to load data from $endpoint: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error on GET $endpoint: $e');
    }
  }

  // GET a single item
  static Future<T> getOne<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers(),
      );

      if (response.statusCode == 200) {
        return fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      } else {
        throw Exception('Failed to load item from $endpoint: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error on GET $endpoint: $e');
    }
  }

  // POST request
  static Future<T> post<T>(
    String endpoint,
    Map<String, dynamic> body,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      } else {
        throw Exception('Failed to post to $endpoint: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      throw Exception('Network error on POST $endpoint: $e');
    }
  }

  // PUT request
  static Future<T> put<T>(
    String endpoint,
    Map<String, dynamic> body,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      } else {
        throw Exception('Failed to put to $endpoint: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      throw Exception('Network error on PUT $endpoint: $e');
    }
  }

  // DELETE request
  static Future<void> delete(String endpoint) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers(),
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Failed to delete $endpoint: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error on DELETE $endpoint: $e');
    }
  }

  // Custom multi-part image upload (handles both File Path and Web Bytes)
  static Future<String> uploadImage(
    String endpoint, {
    String? filePath,
    Uint8List? fileBytes,
    required String fieldName,
    String? fileName,
  }) async {
    try {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl$endpoint'));

      if (fileBytes != null) {
        final multipartFile = http.MultipartFile.fromBytes(
          fieldName,
          fileBytes,
          filename: fileName ?? 'upload.jpg',
          contentType: MediaType('image', 'jpeg'),
        );
        request.files.add(multipartFile);
      } else if (filePath != null && filePath.isNotEmpty) {
        // If it's already a full HTTP URL, don't upload again
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
          return filePath;
        }
        final multipartFile = await http.MultipartFile.fromPath(
          fieldName,
          filePath,
        );
        request.files.add(multipartFile);
      } else {
        throw Exception('No image file or bytes provided');
      }

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> json = jsonDecode(responseBody);
        return json['url'] ?? '';
      } else {
        throw Exception('Image upload failed: ${response.statusCode} - $responseBody');
      }
    } catch (e) {
      throw Exception('Image upload network error: $e');
    }
  }
}
