# 🔧 Solução Completa - Erro "type 'Null' is not a subtype of type 'String'"

## 🎯 Problema
O Flutter está recebendo valores nulos de algum campo na resposta de autenticação, causando o erro:
```
type 'Null' is not a subtype of type 'String'
```

## ✅ Solução

### Passo 1: Corrigir `auth_response.dart`

Substitua o arquivo `lib/models/auth/auth_response.dart` com:

```dart
// lib/models/auth/auth_response.dart

class AuthResponse {
  final String message;
  final String token;
  final String userId;

  AuthResponse({
    required this.message,
    required this.token,
    required this.userId,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    // Debug: Print para ver exatamente o que vem da API
    print('=== DEBUG AUTH RESPONSE ===');
    print('Raw JSON: $json');
    print('message: ${json['message']} (${json['message'].runtimeType})');
    print('token: ${json['token']} (${json['token'].runtimeType})');
    print('userId: ${json['userId']} (${json['userId'].runtimeType})');
    print('===========================');

    try {
      // Obter valores com verificação de nulidade
      final message = json['message'];
      final token = json['token'];
      final userId = json['userId'];

      // Validação rigorosa
      if (message == null || message.toString().isEmpty) {
        throw FormatException(
          'Campo "message" está ausente, nulo ou vazio',
        );
      }

      if (token == null || token.toString().isEmpty) {
        throw FormatException(
          'Campo "token" está ausente, nulo ou vazio',
        );
      }

      if (userId == null || userId.toString().isEmpty) {
        throw FormatException(
          'Campo "userId" está ausente, nulo ou vazio',
        );
      }

      return AuthResponse(
        message: message.toString().trim(),
        token: token.toString().trim(),
        userId: userId.toString().trim(),
      );
    } catch (e) {
      print('❌ Erro ao desserializar AuthResponse: $e');
      print('JSON recebido: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'token': token,
      'userId': userId,
    };
  }

  @override
  String toString() => 'AuthResponse(message: $message, token: ${token.substring(0, 20)}..., userId: $userId)';
}
```

### Passo 2: Corrigir `auth_service.dart`

Substitua o método `login` em `lib/services/auth_service.dart` com:

```dart
Future<AuthResponse> login(String email, String password) async {
  try {
    print('🔐 Iniciando login para: $email');
    
    final response = await http.post(
      Uri.parse('$baseUrl/users/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': email,
        'password': password,
      }),
    ).timeout(
      const Duration(seconds: 30),
      onTimeout: () => throw Exception('Timeout na requisição de login'),
    );

    print('📡 Response Status: ${response.statusCode}');
    print('📡 Response Body: ${response.body}');

    if (response.statusCode == 200) {
      try {
        final jsonData = json.decode(response.body);
        final authResponse = AuthResponse.fromJson(jsonData);
        
        // Salvar token e ID do usuário
        await _saveAuthData(authResponse.token, authResponse.userId);
        
        print('✅ Login bem-sucedido!');
        return authResponse;
      } catch (e) {
        print('❌ Erro ao desserializar resposta: $e');
        throw Exception('Erro ao processar resposta do servidor: $e');
      }
    } else {
      try {
        final errorData = json.decode(response.body);
        final errorMessage = errorData['message'] ?? 'Falha ao realizar login';
        throw Exception(errorMessage);
      } catch (e) {
        throw Exception('Erro: ${response.statusCode} - ${response.body}');
      }
    }
  } catch (e) {
    print('❌ Erro no login: $e');
    rethrow;
  }
}
```

Substitua o método `register` em `lib/services/auth_service.dart` com:

```dart
Future<AuthResponse> register(String username, String email, String password) async {
  try {
    print('📝 Iniciando registro para: $email');
    
    final response = await http.post(
      Uri.parse('$baseUrl/users/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'username': username,
        'email': email,
        'password': password,
      }),
    ).timeout(
      const Duration(seconds: 30),
      onTimeout: () => throw Exception('Timeout na requisição de registro'),
    );

    print('📡 Response Status: ${response.statusCode}');
    print('📡 Response Body: ${response.body}');

    if (response.statusCode == 201) {
      try {
        final jsonData = json.decode(response.body);
        final authResponse = AuthResponse.fromJson(jsonData);
        
        // Salvar token e ID do usuário
        await _saveAuthData(authResponse.token, authResponse.userId);
        
        print('✅ Registro bem-sucedido!');
        return authResponse;
      } catch (e) {
        print('❌ Erro ao desserializar resposta: $e');
        throw Exception('Erro ao processar resposta do servidor: $e');
      }
    } else {
      try {
        final errorData = json.decode(response.body);
        final errorMessage = errorData['message'] ?? 'Falha ao registrar usuário';
        throw Exception(errorMessage);
      } catch (e) {
        throw Exception('Erro: ${response.statusCode} - ${response.body}');
      }
    }
  } catch (e) {
    print('❌ Erro no registro: $e');
    rethrow;
  }
}
```

### Passo 3: Atualizar a URL Base

Certifique-se de que a URL base está **correta** em `auth_service.dart`:

```dart
class AuthService {
  // ⚠️ IMPORTANTE: Altere para o IP correto do seu servidor
  static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android Emulator
  // OU
  // static const String baseUrl = 'http://localhost:3000/api'; // iOS Simulator
  // OU
  // static const String baseUrl = 'http://seu-ip-real:3000/api'; // Device físico
  
  static const String tokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  // ... resto do código
}
```

## 🔍 Como Debugar

1. **Verificar logs do console** - Os prints vão mostrar exatamente o que está vindo da API
2. **Verificar response status** - Se não for 200 ou 201, algo está errado
3. **Verificar response body** - Ver a estrutura JSON exata

## 📋 Checklist de Verificação

- [ ] API está rodando (npm start)
- [ ] URL base está correta em `auth_service.dart`
- [ ] Campos na resposta são: `message`, `token`, `userId`
- [ ] Nenhum dos campos é `null`
- [ ] Response status é 200 (login) ou 201 (register)

## 🧪 Teste de API

Antes de testar no Flutter, verifique se a API está respondendo corretamente:

```bash
# Terminal 1: Iniciar a API
npm start

# Terminal 2: Testar registro
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teste",
    "email": "teste@example.com",
    "password": "123456"
  }'

# Deve retornar:
# {
#   "message": "Usuário registrado com sucesso",
#   "token": "eyJhbGci...",
#   "userId": "67890abc..."
# }
```

Se a resposta for diferente dessa estrutura, **o problema está na API**, não no Flutter!

