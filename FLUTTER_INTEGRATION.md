# Exemplos de Integração API → Flutter

## Status Atual ✅

- ✅ CORS configurado e funcionando
- ✅ Endpoints `/api/plans` e `/api/subscriptions` operacionais
- ✅ Formato de resposta compatível com o Flutter
- ✅ 3 planos criados no banco de dados

## Endpoints Testados

### 1. GET /api/plans (Público - sem autenticação)

**URL:** `http://localhost:3000/api/plans`

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "6941363de2df97b3fa78c5a5",
      "title": "Plano Mensal",
      "description": "Acesso completo por 30 dias",
      "price": 500,
      "features": [
        "Agendamento ilimitado",
        "Gestão de clientes",
        "Relatórios básicos",
        "Suporte por email"
      ],
      "type": "monthly"
    },
    {
      "id": "6941363de2df97b3fa78c5a6",
      "title": "Plano Trimestral",
      "description": "Acesso completo por 90 dias",
      "price": 1350,
      "features": [
        "Agendamento ilimitado",
        "Gestão de clientes",
        "Relatórios avançados",
        "Suporte prioritário",
        "15% de desconto"
      ],
      "type": "quarterly"
    },
    {
      "id": "6941363de2df97b3fa78c5a7",
      "title": "Plano Anual",
      "description": "Acesso completo por 365 dias",
      "price": 4800,
      "features": [
        "Agendamento ilimitado",
        "Gestão de clientes",
        "Relatórios avançados",
        "Suporte prioritário 24/7",
        "Backup automático",
        "20% de desconto"
      ],
      "type": "annual"
    }
  ]
}
```

### 2. GET /api/subscriptions (Requer autenticação)

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Response com subscrição ativa (200):**
```json
{
  "subscription": {
    "_id": "sub_123456",
    "plan": "monthly",
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2026-01-01T00:00:00.000Z",
    "status": "active"
  },
  "daysRemaining": 15,
  "isValid": true
}
```

**Response sem subscrição (404):**
```json
{
  "message": "Nenhuma subscrição ativa encontrada"
}
```

### 3. POST /api/subscriptions (Requer autenticação)

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body:**
```json
{
  "plan": "monthly"
}
```

**Response (201):**
```json
{
  "subscription": {
    "_id": "6941372de2df97b3fa78c5b1",
    "plan": "monthly",
    "startDate": "2025-12-16T00:00:00.000Z",
    "endDate": "2026-01-16T00:00:00.000Z",
    "status": "active"
  },
  "daysRemaining": 31,
  "isValid": true
}
```

### 4. PATCH /api/subscriptions/:id/renew (Requer autenticação)

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Response (200):**
```json
{
  "subscription": {
    "_id": "6941372de2df97b3fa78c5b1",
    "plan": "monthly",
    "startDate": "2025-12-16T00:00:00.000Z",
    "endDate": "2026-02-16T00:00:00.000Z",
    "status": "active"
  },
  "daysRemaining": 62,
  "isValid": true
}
```

## Código Flutter de Exemplo

### Buscar Planos

```dart
Future<List<Plan>> fetchPlans() async {
  final response = await http.get(
    Uri.parse('http://localhost:3000/api/plans'),
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['plans'] as List)
        .map((plan) => Plan.fromJson(plan))
        .toList();
  } else {
    throw Exception('Erro ao carregar planos');
  }
}
```

### Buscar Subscrição do Usuário

```dart
Future<Subscription?> fetchSubscription(String token) async {
  final response = await http.get(
    Uri.parse('http://localhost:3000/api/subscriptions'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return Subscription.fromJson(data);
  } else if (response.statusCode == 404) {
    return null; // Sem subscrição
  } else {
    throw Exception('Erro ao carregar subscrição');
  }
}
```

### Criar Nova Subscrição

```dart
Future<Subscription> createSubscription(String token, String planType) async {
  final response = await http.post(
    Uri.parse('http://localhost:3000/api/subscriptions'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'plan': planType, // 'monthly', 'quarterly', ou 'annual'
    }),
  );

  if (response.statusCode == 201) {
    final data = json.decode(response.body);
    return Subscription.fromJson(data);
  } else {
    throw Exception('Erro ao criar subscrição');
  }
}
```

### Renovar Subscrição

```dart
Future<Subscription> renewSubscription(String token, String subscriptionId) async {
  final response = await http.patch(
    Uri.parse('http://localhost:3000/api/subscriptions/$subscriptionId/renew'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return Subscription.fromJson(data);
  } else {
    throw Exception('Erro ao renovar subscrição');
  }
}
```

## Modelos Dart Sugeridos

### Plan Model

```dart
class Plan {
  final String id;
  final String title;
  final String description;
  final double price;
  final List<String> features;
  final String type;

  Plan({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.features,
    required this.type,
  });

  factory Plan.fromJson(Map<String, dynamic> json) {
    return Plan(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      price: json['price'].toDouble(),
      features: List<String>.from(json['features']),
      type: json['type'],
    );
  }
}
```

### Subscription Model

```dart
class Subscription {
  final SubscriptionData subscription;
  final int daysRemaining;
  final bool isValid;

  Subscription({
    required this.subscription,
    required this.daysRemaining,
    required this.isValid,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      subscription: SubscriptionData.fromJson(json['subscription']),
      daysRemaining: json['daysRemaining'],
      isValid: json['isValid'],
    );
  }
}

class SubscriptionData {
  final String id;
  final String plan;
  final DateTime startDate;
  final DateTime endDate;
  final String status;

  SubscriptionData({
    required this.id,
    required this.plan,
    required this.startDate,
    required this.endDate,
    required this.status,
  });

  factory SubscriptionData.fromJson(Map<String, dynamic> json) {
    return SubscriptionData(
      id: json['_id'],
      plan: json['plan'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      status: json['status'],
    );
  }
}
```

## Testando com ngrok (para testar no dispositivo móvel)

Se você estiver usando ngrok para expor a API localmente:

```bash
# No terminal 1
npm start

# No terminal 2
ngrok http 3000
```

Então no Flutter, use a URL do ngrok:
```dart
final baseUrl = 'https://sua-url.ngrok-free.app';
```

## Checklist de Integração

- ✅ API rodando em http://localhost:3000
- ✅ CORS configurado para aceitar requisições do Flutter
- ✅ Planos populados no banco de dados
- ✅ Formato de resposta compatível com modelos Flutter
- ✅ Endpoints testados e funcionando
- [ ] Atualizar URL base no app Flutter
- [ ] Testar autenticação JWT
- [ ] Testar fluxo completo de subscrição

## Próximos Passos

1. **Integrar Pagamentos**: Use as rotas de `/api/payments` para processar pagamentos
2. **Testar Autenticação**: Verifique se o token JWT está sendo enviado corretamente
3. **Tratamento de Erros**: Implemente tratamento robusto de erros no Flutter
4. **Loading States**: Adicione indicadores de carregamento durante as requisições
