# Fluxo Completo: Flutter → API → PaySuite

## 🎬 Diagrama Visual do Processo

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FLUTTER APP                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 1. Usuário escolhe plano
                                  │
                                  ↓
        ┌─────────────────────────────────────────────────┐
        │  POST /api/subscriptions                        │
        │  { "plan": "monthly" }                          │
        │  Headers: { "Authorization": "Bearer TOKEN" }   │
        └─────────────────────────────────────────────────┘
                                  │
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          REFRESH API                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  2. Valida token JWT                                                     │
│  3. Busca preço do plano no MongoDB                                     │
│  4. Cria Subscription { status: "pending_payment" }                     │
│  5. Gera referência única: "SUB-userId-timestamp"                       │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
        ┌─────────────────────────────────────────────────┐
        │  POST https://paysuite.tech/api/v1/payments     │
        │  {                                              │
        │    "amount": "500",                             │
        │    "reference": "SUB-...",                      │
        │    "description": "Subscrição Mensal",          │
        │    "return_url": "https://app.com/success",     │
        │    "callback_url": "https://api.com/callback"   │
        │  }                                              │
        └─────────────────────────────────────────────────┘
                                  │
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          PAYSUITE                                        │
├──────────────────────────────────────────────────────────────────────────┤
│  6. Processa requisição                                                  │
│  7. Cria sessão de pagamento                                            │
│  8. Retorna checkout_url                                                │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
        ┌─────────────────────────────────────────────────┐
        │  Response 201:                                  │
        │  {                                              │
        │    "subscription": {                            │
        │      "_id": "...",                              │
        │      "status": "pending_payment"                │
        │    },                                           │
        │    "payment": {                                 │
        │      "id": "550e8400-...",                      │
        │      "checkoutUrl": "https://paysuite.../..." │
        │    }                                            │
        │  }                                              │
        └─────────────────────────────────────────────────┘
                                  │
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          FLUTTER APP                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  9. Recebe checkout_url                                                  │
│  10. Mostra botão "Abrir Pagamento"                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 11. Usuário clica
                                  │
                                  ↓
        ┌─────────────────────────────────────────────────┐
        │  launchUrl(checkoutUrl)                         │
        │  ou                                             │
        │  WebView(url: checkoutUrl)                      │
        └─────────────────────────────────────────────────┘
                                  │
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                   PAYSUITE (Página de Pagamento)                         │
├──────────────────────────────────────────────────────────────────────────┤
│  12. Usuário escolhe método:                                            │
│      • M-Pesa                                                           │
│      • eMola                                                            │
│      • Cartão de Crédito                                                │
│                                                                          │
│  13. Insere dados do pagamento                                          │
│  14. Confirma transação                                                 │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
        ┌─────────────────────────────────────────────────┐
        │  PaySuite processa pagamento                    │
        │  • Valida dados                                 │
        │  • Comunica com gateway (M-Pesa/Banco)         │
        │  • Recebe confirmação                           │
        └─────────────────────────────────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
              ↓                                       ↓
    15a. Redireciona                       15b. Envia Callback
    para return_url                        (webhook assíncrono)
              │                                       │
              ↓                                       ↓
┌──────────────────────────┐          ┌──────────────────────────────────┐
│     FLUTTER APP          │          │       REFRESH API                │
├──────────────────────────┤          ├──────────────────────────────────┤
│ 16a. Detecta return_url  │          │ POST /api/subscriptions/         │
│      (se usando WebView) │          │      payment-callback            │
│                          │          │                                  │
│ 17a. Fecha WebView       │          │ {                                │
│                          │          │   "id": "550e8400-...",          │
│ 18a. Inicia polling      │          │   "status": "paid",              │
└──────────────────────────┘          │   "reference": "SUB-...",        │
              │                        │   "transaction": {...}           │
              │                        │ }                                │
              │                        └──────────────────────────────────┘
              │                                       │
              │                                       ↓
              │                        ┌──────────────────────────────────┐
              │                        │ 16b. Busca Subscription          │
              │                        │      por reference               │
              │                        │                                  │
              │                        │ 17b. Atualiza campos:            │
              │                        │      • status = "active"         │
              │                        │      • paymentStatus = "paid"    │
              │                        │                                  │
              │                        │ 18b. Salva no MongoDB            │
              │                        └──────────────────────────────────┘
              │                                       │
              │                                       ↓
              │                        ┌──────────────────────────────────┐
              │                        │ Response 200:                    │
              │                        │ {                                │
              │                        │   "status": "success",           │
              │                        │   "message": "Callback OK"       │
              │                        │ }                                │
              │                        └──────────────────────────────────┘
              │
              │ 19. Polling a cada 5s
              │
              ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          FLUTTER APP                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  Timer.periodic(5s) {                                                    │
│    GET /api/subscriptions/:id/payment-status                            │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          REFRESH API                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  20. Consulta PaySuite (opcional, para dados mais recentes)            │
│  21. Retorna status atual do MongoDB                                    │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
        ┌─────────────────────────────────────────────────┐
        │  Response 200:                                  │
        │  {                                              │
        │    "subscription": {                            │
        │      "status": "active",      ← MUDOU!          │
        │      "paymentStatus": "paid"                    │
        │    },                                           │
        │    "payment": {                                 │
        │      "status": "paid",                          │
        │      "transaction": {                           │
        │        "transaction_id": "MPESA123",            │
        │        "paid_at": "2025-12-16T..."              │
        │      }                                           │
        │    }                                            │
        │  }                                              │
        └─────────────────────────────────────────────────┘
                                  │
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          FLUTTER APP                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  22. Detecta status == "active"                                         │
│  23. Cancela polling (timer.cancel())                                   │
│  24. Navega para tela de sucesso                                        │
│                                                                          │
│      ┌─────────────────────────────────────┐                           │
│      │   ✅ Pagamento Confirmado!           │                           │
│      │                                      │                           │
│      │   Sua assinatura está ativa          │                           │
│      │   Plano: Mensal                      │                           │
│      │   Valor: 500 MZN                     │                           │
│      │   Dias restantes: 30                 │                           │
│      │                                      │                           │
│      │   [Continuar]                        │                           │
│      └─────────────────────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🕐 Timeline Esperada

| Passo | Ação | Tempo |
|-------|------|-------|
| 1-8 | Criar subscrição + requisição PaySuite | ~2-5 segundos |
| 9-11 | Flutter recebe URL e abre pagamento | ~1 segundo |
| 12-14 | Usuário completa pagamento | 30s - 5min |
| 15-18 | PaySuite processa + envia callback | ~2-10 segundos |
| 19-24 | Polling detecta mudança + mostra sucesso | 0-15 segundos |

**Total:** ~1-6 minutos (depende da velocidade do usuário)

---

## 📊 Estados do Sistema

### No MongoDB (Subscription)

```javascript
// Estado Inicial
{
  status: "pending_payment",
  paymentStatus: "pending",
  checkoutUrl: "https://paysuite.tech/checkout/..."
}

// Após Callback do PaySuite
{
  status: "active",           ← MUDOU
  paymentStatus: "paid",      ← MUDOU
  checkoutUrl: "https://..."  (permanece)
}
```

### No Flutter (UI)

```dart
// Estado Inicial
SubscriptionStatus.idle

// Criando Subscrição
SubscriptionStatus.loading

// URL Recebida
SubscriptionStatus.awaitingPayment
  → Mostra botão "Abrir Pagamento"

// Pagamento Aberto
SubscriptionStatus.processingPayment
  → Mostra "Verificando pagamento..."
  → Polling ativo

// Confirmado
SubscriptionStatus.active
  → Mostra tela de sucesso ✅
```

---

## 🔄 Cenários Alternativos

### Cenário 1: Usuário Fecha App Durante Pagamento

```
1. Usuário abre pagamento
2. Completa no M-Pesa
3. Fecha app antes de voltar

❓ O que acontece?
✅ Callback já foi enviado para API
✅ Subscrição já está ativa no MongoDB
✅ Na próxima abertura do app, verifica status
✅ Usuário vê que está ativo
```

**Implementação:**
```dart
@override
void initState() {
  super.initState();
  _checkPendingSubscription();
}

Future<void> _checkPendingSubscription() async {
  final prefs = await SharedPreferences.getInstance();
  final pendingId = prefs.getString('pending_subscription');
  
  if (pendingId != null) {
    final status = await checkPaymentStatus(pendingId);
    if (status == 'active') {
      showSuccessDialog();
      prefs.remove('pending_subscription');
    }
  }
}
```

---

### Cenário 2: Callback Chega Antes do Polling Iniciar

```
1. Pagamento muito rápido (< 5 segundos)
2. Callback chega e ativa subscrição
3. App ainda não iniciou polling

✅ Não tem problema!
✅ Quando polling iniciar, primeira tentativa já verá "active"
✅ Mostra sucesso imediatamente
```

---

### Cenário 3: Pagamento Falha

```
1. Usuário tenta pagar
2. Cartão recusado / M-Pesa sem saldo
3. PaySuite envia callback com status="failed"

API:
  → Atualiza status = "cancelled"
  → Atualiza paymentStatus = "failed"

Flutter Polling:
  → Detecta status == "cancelled"
  → Para polling
  → Mostra mensagem de erro
```

**Implementação:**
```dart
if (status == 'cancelled') {
  timer.cancel();
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Pagamento Não Concluído'),
      content: Text(
        'O pagamento não foi processado. '
        'Tente novamente com outro método.'
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context); // Fecha dialog
            Navigator.pop(context); // Volta para planos
          },
          child: Text('Tentar Novamente'),
        ),
      ],
    ),
  );
}
```

---

### Cenário 4: Timeout no Polling

```
1. Polling roda por 5 minutos
2. Status ainda é "pending_payment"
3. Atinge limite de tentativas

Flutter:
  → Para polling
  → Mostra mensagem
```

**Implementação:**
```dart
if (attempts > 60) { // 60 × 5s = 5 minutos
  timer.cancel();
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Verificação Demorada'),
      content: Text(
        'Ainda não recebemos confirmação do pagamento.\n\n'
        'Se você já completou o pagamento, entre em contato '
        'com o suporte ou verifique novamente mais tarde.'
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('OK'),
        ),
        TextButton(
          onPressed: () {
            Navigator.pop(context);
            _checkPaymentStatus(); // Tentar novamente
          },
          child: Text('Verificar Agora'),
        ),
      ],
    ),
  );
}
```

---

## 💡 Otimizações Possíveis

### 1. Exponential Backoff

Em vez de polling fixo de 5s, aumentar gradualmente:

```dart
int _getDelay(int attempt) {
  if (attempt < 6) return 3;      // 0-30s: cada 3s
  if (attempt < 12) return 5;     // 30-60s: cada 5s
  if (attempt < 24) return 10;    // 1-3min: cada 10s
  return 15;                      // 3-5min: cada 15s
}

void _startPolling() {
  void check() async {
    _attempts++;
    await _checkStatus();
    
    if (!_isDone && _attempts < 60) {
      Future.delayed(
        Duration(seconds: _getDelay(_attempts)),
        check,
      );
    }
  }
  
  check();
}
```

### 2. WebSocket (Avançado)

Para eliminar polling completamente:

```dart
// API envia notificação em tempo real
final channel = IOWebSocketChannel.connect(
  'wss://api.com/ws/subscriptions/$userId',
);

channel.stream.listen((message) {
  final data = json.decode(message);
  if (data['event'] == 'payment_confirmed') {
    showSuccessScreen();
  }
});
```

### 3. Push Notifications

API pode enviar notificação push:

```dart
FirebaseMessaging.onMessage.listen((message) {
  if (message.data['type'] == 'payment_confirmed') {
    showSuccessScreen();
  }
});
```

---

## 🎯 Resumo Executivo

**O app Flutter faz 3 coisas principais:**

1. **Criar subscrição** → Chama API, recebe checkout_url
2. **Abrir pagamento** → Usuário paga no PaySuite
3. **Verificar status** → Polling até detectar "active"

**A API faz 3 coisas principais:**

1. **Criar pagamento no PaySuite** → Retorna URL para Flutter
2. **Receber callback** → PaySuite notifica quando pago
3. **Responder status** → Flutter pergunta, API responde

**O PaySuite faz 2 coisas:**

1. **Processar pagamento** → Cobra do usuário
2. **Enviar callback** → Notifica API quando concluído

---

**Simples assim!** 🎉

Todos os arquivos de código estão prontos nos outros guias.
