# FAQ - Pagamentos no Flutter

## ❓ Perguntas Frequentes

### 1. O app precisa ficar aberto durante o pagamento?

**Não!** Existem duas abordagens:

**Opção A - Navegador Externo:**
- Usuário é redirecionado para o navegador
- App faz polling em background
- Quando retornar ao app, verifica status

**Opção B - WebView:**
- Pagamento acontece dentro do app
- Melhor UX, usuário não sai do app
- Mais controle sobre o fluxo

### 2. Como funciona o polling?

```dart
// Verifica status a cada 5 segundos
Timer.periodic(Duration(seconds: 5), (timer) async {
  final response = await http.get(
    'api/subscriptions/$id/payment-status',
  );
  
  if (status == 'active') {
    timer.cancel(); // Para o polling
    // Mostra tela de sucesso
  }
});
```

### 3. O que acontece se o usuário fechar o app durante o pagamento?

**Cenário:**
1. Usuário abre pagamento
2. Completa no navegador
3. Fecha o app antes de confirmar

**Solução:**
```dart
// Salvar subscriptionId localmente
final prefs = await SharedPreferences.getInstance();
await prefs.setString('pending_sub', subscriptionId);

// Na próxima abertura do app
final pendingId = prefs.getString('pending_sub');
if (pendingId != null) {
  // Verificar status e mostrar resultado
  final status = await checkPaymentStatus(pendingId);
  if (status == 'active') {
    showSuccessDialog();
  }
}
```

### 4. Como lidar com pagamentos duplicados?

A API já previne isso! Se tentar criar nova subscrição:

```json
{
  "message": "Usuário já possui uma subscrição ativa"
}
```

Ou:

```json
{
  "message": "Já existe uma subscrição aguardando pagamento"
}
```

No Flutter:
```dart
try {
  await createSubscription('monthly');
} catch (e) {
  if (e.toString().contains('já possui')) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Subscrição Existente'),
        content: Text('Você já tem uma subscrição ativa.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
        ],
      ),
    );
  }
}
```

### 5. Como testar sem fazer pagamentos reais?

**Opção 1: Simular callback (apenas dev)**

No terminal:
```bash
curl -X POST http://localhost:3000/api/subscriptions/payment-callback \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "reference": "SUB-user123-1234567890"
  }'
```

**Opção 2: Ambiente de sandbox do PaySuite**

Use credenciais de teste fornecidas pelo PaySuite.

### 6. Por quanto tempo o app deve fazer polling?

**Recomendado:** 5 minutos (60 tentativas de 5 segundos)

```dart
Timer.periodic(Duration(seconds: 5), (timer) async {
  attempts++;
  
  if (attempts > 60) {
    timer.cancel();
    showTimeoutMessage();
    return;
  }
  
  // Verificar status...
});
```

Se timeout, mostrar mensagem:
```
"Ainda não recebemos confirmação do pagamento.
Por favor, verifique seu email ou entre em contato
com o suporte se já completou o pagamento."
```

### 7. Como salvar o token de autenticação?

Use `flutter_secure_storage`:

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Salvar
await storage.write(key: 'auth_token', value: token);

// Ler
final token = await storage.read(key: 'auth_token');

// Deletar (logout)
await storage.delete(key: 'auth_token');
```

### 8. O usuário pode usar M-Pesa no emulador?

**Não!** M-Pesa precisa do app oficial instalado.

**Para testes:**
- Use dispositivo físico Android/iOS
- Ou use método de cartão de crédito (pode testar no emulador)

### 9. Como saber se o pagamento falhou?

O callback retorna o status. No Flutter:

```dart
final status = await checkPaymentStatus(subscriptionId);

switch (status) {
  case 'active':
    // ✅ Pagamento confirmado
    break;
  case 'pending_payment':
    // ⏳ Ainda aguardando
    break;
  case 'cancelled':
    // ❌ Pagamento cancelado/falhou
    showErrorDialog('Pagamento não foi concluído');
    break;
}
```

### 10. Como funciona o WebView?

```dart
// 1. Carregar URL de pagamento
WebViewController controller = WebViewController()
  ..loadRequest(Uri.parse(checkoutUrl));

// 2. Monitorar navegação
..setNavigationDelegate(
  NavigationDelegate(
    onPageFinished: (url) {
      // Se chegou na URL de retorno
      if (url.contains('payment-complete')) {
        Navigator.pop(context); // Fecha WebView
        startPolling(); // Verifica status
      }
    },
  ),
);
```

---

## 🐛 Troubleshooting

### Erro: "Failed to launch URL"

**Problema:** `url_launcher` não consegue abrir a URL

**Solução:**

1. Verifique se a URL está correta
2. No Android, adicione ao `AndroidManifest.xml`:

```xml
<queries>
  <intent>
    <action android:name="android.intent.action.VIEW" />
    <data android:scheme="https" />
  </intent>
</queries>
```

3. No iOS, não precisa configuração extra

---

### Erro: "Unable to load assets"

**Problema:** WebView não carrega a página

**Solução:**

1. Verifique conexão com internet
2. Teste a URL no navegador primeiro
3. Adicione headers se necessário:

```dart
controller.loadRequest(
  Uri.parse(checkoutUrl),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Mobile)',
  },
);
```

---

### Polling não para mesmo após pagamento

**Problema:** Timer continua rodando

**Solução:**

```dart
Timer? _pollingTimer;

void startPolling() {
  // Cancelar timer anterior se existir
  _pollingTimer?.cancel();
  
  _pollingTimer = Timer.periodic(Duration(seconds: 5), (timer) async {
    final status = await checkPaymentStatus(id);
    
    if (status == 'active' || status == 'cancelled') {
      timer.cancel(); // ✅ Importante!
      _pollingTimer = null;
    }
  });
}

@override
void dispose() {
  _pollingTimer?.cancel(); // ✅ Limpar no dispose
  super.dispose();
}
```

---

### Status sempre retorna "pending_payment"

**Possíveis causas:**

1. **Callback não está sendo recebido**
   - Verifique se ngrok está rodando
   - Confirme URL de callback na API

2. **Pagamento ainda não foi completado**
   - Usuário ainda não finalizou
   - PaySuite ainda processando

3. **Erro no callback**
   - Veja logs do servidor
   - Verifique se a referência está correta

**Debug:**
```dart
// Adicionar logs
print('Checking subscription: $subscriptionId');
final response = await http.get(url);
print('Response: ${response.body}');
```

---

### App trava ao abrir WebView

**Problema:** `webview_flutter` não carrega

**Solução:**

1. Verificar versão mínima do Android (API 20+)

2. Adicionar ao `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        minSdkVersion 20 // ou superior
    }
}
```

3. No iOS, adicionar ao `Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

---

### Erro: "Unauthorized" ao chamar API

**Problema:** Token inválido ou expirado

**Solução:**

```dart
try {
  final response = await http.post(url, headers: headers);
  
  if (response.statusCode == 401) {
    // Token expirado, fazer logout
    await logout();
    Navigator.pushReplacementNamed(context, '/login');
  }
} catch (e) {
  // ...
}
```

---

### Pagamento completado mas app não detecta

**Problema:** Polling parou antes de confirmar

**Solução:**

1. Aumentar tempo de polling:
```dart
if (attempts > 120) { // 10 minutos em vez de 5
```

2. Adicionar botão manual:
```dart
TextButton(
  onPressed: () async {
    final status = await checkPaymentStatus(id);
    if (status == 'active') {
      showSuccessScreen();
    }
  },
  child: Text('Verificar Status Manualmente'),
)
```

---

## 🎯 Boas Práticas

### 1. Sempre Cancelar Timers

```dart
@override
void dispose() {
  _pollingTimer?.cancel();
  super.dispose();
}
```

### 2. Feedback Visual

```dart
// Mostrar sempre o que está acontecendo
if (isChecking) {
  return Column(
    children: [
      CircularProgressIndicator(),
      SizedBox(height: 16),
      Text('Verificando pagamento...'),
      Text('Tentativa $_attempts de 60'),
    ],
  );
}
```

### 3. Tratamento de Erros

```dart
try {
  // Código
} on SocketException {
  showError('Sem conexão com internet');
} on TimeoutException {
  showError('Tempo esgotado, tente novamente');
} catch (e) {
  showError('Erro: $e');
}
```

### 4. Loading States

```dart
enum PaymentState {
  idle,
  creating,      // Criando subscrição
  awaiting,      // Aguardando pagamento
  processing,    // Processando pagamento
  success,       // Concluído
  error,         // Erro
}
```

### 5. Persistência

```dart
// Salvar estado para recuperar depois
class PaymentStorage {
  static const _key = 'payment_state';
  
  static Future<void> save(String subscriptionId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, subscriptionId);
  }
  
  static Future<String?> get() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  }
  
  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
```

---

## 📊 Métricas Recomendadas

Monitore essas métricas:

```dart
// 1. Taxa de abandono
abandonRate = subscriptionsCreated / paymentsCompleted

// 2. Tempo médio de pagamento
averageTime = sum(paymentCompletionTimes) / count

// 3. Método de pagamento mais usado
paymentMethods = {
  'mpesa': count,
  'card': count,
  'emola': count,
}
```

---

## 🔐 Segurança

### Nunca armazene dados sensíveis

```dart
// ❌ ERRADO
final cardNumber = '1234567890123456';
await prefs.setString('card', cardNumber);

// ✅ CORRETO
// Deixe o PaySuite lidar com dados de pagamento
// Apenas armazene IDs e status
```

### Use HTTPS sempre

```dart
// ✅ CORRETO
final baseUrl = 'https://sua-api.com';

// ❌ ERRADO (apenas dev local)
final baseUrl = 'http://localhost:3000';
```

### Validar responses da API

```dart
if (response.statusCode == 200) {
  final data = json.decode(response.body);
  
  // ✅ Validar campos obrigatórios
  if (data['subscription'] == null || 
      data['payment'] == null) {
    throw Exception('Response inválido');
  }
}
```

---

## 💡 Dicas Finais

1. **Teste em dispositivo real** - Especialmente para M-Pesa
2. **Use ngrok para desenvolvimento** - Permite receber callbacks
3. **Implemente retry logic** - Para falhas de rede
4. **Adicione analytics** - Para entender comportamento do usuário
5. **Documente o fluxo** - Para sua equipe

---

**Precisa de mais ajuda?** Veja os outros guias:
- [GUIA_FLUTTER_PAGAMENTO.md](GUIA_FLUTTER_PAGAMENTO.md) - Guia completo
- [FLUTTER_EXEMPLO_MINIMO.md](FLUTTER_EXEMPLO_MINIMO.md) - Exemplo rápido
- [INTEGRACAO_PAGAMENTOS.md](INTEGRACAO_PAGAMENTOS.md) - Detalhes da API
