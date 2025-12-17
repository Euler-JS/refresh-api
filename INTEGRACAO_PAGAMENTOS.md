# Integração de Pagamentos com Subscrições

## Visão Geral

O sistema agora integra automaticamente pagamentos via PaySuite ao criar subscrições. O fluxo completo garante que subscrições só sejam ativadas após confirmação de pagamento.

## Fluxo de Pagamento

```
1. Usuário solicita subscrição
   ↓
2. API cria subscrição com status "pending_payment"
   ↓
3. API cria solicitação de pagamento no PaySuite
   ↓
4. PaySuite retorna URL de checkout
   ↓
5. Usuário é redirecionado para pagar
   ↓
6. Após pagamento, PaySuite chama callback
   ↓
7. API ativa subscrição (status = "active")
```

## Status de Subscrição

- `pending_payment`: Aguardando confirmação de pagamento
- `active`: Paga e ativa
- `expired`: Período expirado
- `cancelled`: Cancelada (pagamento falhou ou usuário cancelou)

## Status de Pagamento

- `pending`: Aguardando pagamento
- `paid`: Pago com sucesso
- `failed`: Pagamento falhou
- `cancelled`: Pagamento cancelado

## Endpoints

### 1. Criar Subscrição com Pagamento

**POST** `/api/subscriptions`

Cria uma subscrição e inicia o processo de pagamento.

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

**Resposta (201):**
```json
{
  "subscription": {
    "_id": "6941372de2df97b3fa78c5b1",
    "plan": "monthly",
    "startDate": "2025-12-16T00:00:00.000Z",
    "endDate": "2026-01-16T00:00:00.000Z",
    "status": "pending_payment"
  },
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 500,
    "reference": "SUB-user123-1702742400000",
    "checkoutUrl": "https://paysuite.tech/checkout/550e8400-e29b-41d4-a716-446655440000",
    "status": "pending"
  },
  "daysRemaining": 31,
  "isValid": false
}
```

**Importante:** 
- A subscrição é criada com status `pending_payment`
- `isValid` será `false` até o pagamento ser confirmado
- Redirecione o usuário para `payment.checkoutUrl` para completar o pagamento

### 2. Verificar Status do Pagamento

**GET** `/api/subscriptions/:subscriptionId/payment-status`

Consulta o status atual do pagamento no PaySuite.

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Resposta (200):**
```json
{
  "subscription": {
    "_id": "6941372de2df97b3fa78c5b1",
    "plan": "monthly",
    "status": "active",
    "paymentStatus": "paid"
  },
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 500,
    "reference": "SUB-user123-1702742400000",
    "status": "paid",
    "transaction": {
      "id": 1,
      "status": "completed",
      "transaction_id": "MPESA123456",
      "paid_at": "2024-12-16T10:15:00.000Z"
    }
  }
}
```

### 3. Callback do PaySuite

**POST** `/api/subscriptions/payment-callback`

Endpoint que recebe notificações do PaySuite sobre mudanças no status do pagamento.

**Não requer autenticação** (é chamado pelo PaySuite)

**Body (exemplo do PaySuite):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "paid",
  "reference": "SUB-user123-1702742400000",
  "transaction": {
    "id": 1,
    "status": "completed",
    "transaction_id": "MPESA123456",
    "paid_at": "2024-12-16T10:15:00.000Z"
  }
}
```

**Resposta (200):**
```json
{
  "status": "success",
  "message": "Callback processado com sucesso"
}
```

## Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# PaySuite
PAYSUITE_BASE_URL=https://paysuite.tech/api/v1
PAYSUITE_TOKEN=seu_token_do_paysuite

# URLs
API_URL=https://sua-api.com
FRONTEND_URL=https://seu-frontend.com
```

### Callback URL

Para receber callbacks do PaySuite em desenvolvimento local, use ngrok:

```bash
# Terminal 1 - Inicie a API
npm start

# Terminal 2 - Inicie o ngrok
ngrok http 3000
```

Use a URL do ngrok como `API_URL`:
```env
API_URL=https://abc123.ngrok-free.app
```

O PaySuite enviará callbacks para:
```
https://abc123.ngrok-free.app/api/subscriptions/payment-callback
```

## Integração com Flutter

### Exemplo: Criar Subscrição com Pagamento

```dart
Future<Map<String, dynamic>> createSubscriptionWithPayment(
  String token, 
  String planType
) async {
  final response = await http.post(
    Uri.parse('${apiUrl}/api/subscriptions'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({'plan': planType}),
  );

  if (response.statusCode == 201) {
    final data = json.decode(response.body);
    
    // Abrir URL de pagamento no navegador
    final checkoutUrl = data['payment']['checkoutUrl'];
    await launchUrl(Uri.parse(checkoutUrl));
    
    return data;
  } else {
    throw Exception('Erro ao criar subscrição');
  }
}
```

### Exemplo: Verificar Status do Pagamento

```dart
Future<void> checkPaymentStatus(String token, String subscriptionId) async {
  final response = await http.get(
    Uri.parse('${apiUrl}/api/subscriptions/$subscriptionId/payment-status'),
    headers: {'Authorization': 'Bearer $token'},
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    
    if (data['subscription']['status'] == 'active') {
      // Pagamento confirmado!
      print('Subscrição ativada com sucesso!');
    } else {
      // Ainda aguardando pagamento
      print('Status: ${data['subscription']['status']}');
    }
  }
}
```

### Fluxo Recomendado no Flutter

```dart
// 1. Criar subscrição
final result = await createSubscriptionWithPayment(token, 'monthly');
final subscriptionId = result['subscription']['_id'];
final checkoutUrl = result['payment']['checkoutUrl'];

// 2. Abrir URL de pagamento
await launchUrl(Uri.parse(checkoutUrl));

// 3. Polling para verificar status (a cada 5 segundos)
Timer.periodic(Duration(seconds: 5), (timer) async {
  final status = await checkPaymentStatus(token, subscriptionId);
  
  if (status['subscription']['status'] == 'active') {
    timer.cancel();
    // Navegar para tela de sucesso
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => SubscriptionSuccessScreen()),
    );
  }
});
```

## Preços dos Planos

| Plano | Duração | Preço (MZN) |
|-------|---------|-------------|
| Mensal | 30 dias | 500 |
| Trimestral | 90 dias | 1.350 |
| Anual | 365 dias | 4.800 |

## Tratamento de Erros

### Erro ao Criar Pagamento

```json
{
  "message": "Erro ao processar pagamento",
  "error": "Detalhes do erro do PaySuite"
}
```

**Causas comuns:**
- Token PaySuite inválido ou expirado
- PaySuite indisponível
- Dados de pagamento inválidos

### Subscrição Já Existe

```json
{
  "message": "Usuário já possui uma subscrição ativa"
}
```

ou

```json
{
  "message": "Já existe uma subscrição aguardando pagamento"
}
```

## Segurança

1. **Callback Validation**: Em produção, adicione verificação de assinatura do PaySuite
2. **HTTPS**: Use sempre HTTPS em produção
3. **Token Expiry**: Tokens JWT expiram em 24h
4. **Payment Verification**: Sempre verifique o status no PaySuite antes de ativar benefícios

## Testes

### Testar Criação com Pagamento

```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly"}'
```

### Simular Callback (apenas desenvolvimento)

```bash
curl -X POST http://localhost:3000/api/subscriptions/payment-callback \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "paid",
    "reference": "SUB-user123-1702742400000"
  }'
```

### Verificar Status

```bash
curl http://localhost:3000/api/subscriptions/SUBSCRIPTION_ID/payment-status \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Troubleshooting

### Callback não está sendo recebido

1. Verifique se a URL está acessível publicamente (use ngrok)
2. Confirme que a URL de callback está correta no PaySuite
3. Verifique os logs do servidor

### Subscrição não ativa mesmo após pagamento

1. Verifique se o callback foi recebido
2. Use o endpoint de verificação de status manualmente
3. Verifique logs do servidor para erros

### Erro ao criar pagamento no PaySuite

1. Verifique se `PAYSUITE_TOKEN` está configurado
2. Confirme que o token é válido
3. Verifique se o PaySuite está operacional
