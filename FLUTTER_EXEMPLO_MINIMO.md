# Flutter - Exemplo Mínimo de Pagamento

## 🚀 Quick Start - Implementação Mínima

Se você quer começar rápido, aqui está a versão mais simples possível:

---

## 1️⃣ Adicionar Dependências

```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  url_launcher: ^6.2.1
```

```bash
flutter pub get
```

---

## 2️⃣ Criar Widget de Pagamento

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import 'dart:async';

class SimplePaymentWidget extends StatefulWidget {
  final String authToken;
  final String planType; // 'monthly', 'quarterly', ou 'annual'

  const SimplePaymentWidget({
    required this.authToken,
    required this.planType,
  });

  @override
  State<SimplePaymentWidget> createState() => _SimplePaymentWidgetState();
}

class _SimplePaymentWidgetState extends State<SimplePaymentWidget> {
  final String baseUrl = 'https://sua-api.ngrok-free.app';
  
  String? subscriptionId;
  String? checkoutUrl;
  bool isProcessing = false;
  String status = 'idle';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Pagamento')),
      body: Center(
        child: _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    if (isProcessing) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Processando...'),
        ],
      );
    }

    if (status == 'awaiting_payment' && checkoutUrl != null) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.payment, size: 64, color: Colors.blue),
          SizedBox(height: 24),
          Text(
            'Complete o Pagamento',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: _openPayment,
            child: Text('Abrir Pagamento'),
          ),
          SizedBox(height: 16),
          TextButton(
            onPressed: _checkPaymentStatus,
            child: Text('Já paguei, verificar'),
          ),
        ],
      );
    }

    if (status == 'checking') {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Verificando pagamento...'),
        ],
      );
    }

    if (status == 'success') {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_circle, size: 100, color: Colors.green),
          SizedBox(height: 24),
          Text(
            'Pagamento Confirmado!',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Continuar'),
          ),
        ],
      );
    }

    // Estado inicial
    return ElevatedButton(
      onPressed: _createSubscription,
      child: Text('Iniciar Pagamento'),
    );
  }

  // PASSO 1: Criar subscrição
  Future<void> _createSubscription() async {
    setState(() => isProcessing = true);

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/subscriptions'),
        headers: {
          'Authorization': 'Bearer ${widget.authToken}',
          'Content-Type': 'application/json',
        },
        body: json.encode({'plan': widget.planType}),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        
        setState(() {
          subscriptionId = data['subscription']['_id'];
          checkoutUrl = data['payment']['checkoutUrl'];
          status = 'awaiting_payment';
          isProcessing = false;
        });
      } else {
        throw Exception('Erro ao criar subscrição');
      }
    } catch (e) {
      setState(() => isProcessing = false);
      _showError(e.toString());
    }
  }

  // PASSO 2: Abrir URL de pagamento
  Future<void> _openPayment() async {
    if (checkoutUrl == null) return;

    final uri = Uri.parse(checkoutUrl!);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      
      // Após abrir, começar a verificar status
      _startPolling();
    } else {
      _showError('Não foi possível abrir o link de pagamento');
    }
  }

  // PASSO 3: Polling automático
  Timer? _pollingTimer;
  int _attempts = 0;

  void _startPolling() {
    setState(() => status = 'checking');
    
    _pollingTimer = Timer.periodic(Duration(seconds: 5), (timer) async {
      _attempts++;
      
      // Parar após 5 minutos (60 tentativas)
      if (_attempts > 60) {
        timer.cancel();
        setState(() => status = 'awaiting_payment');
        return;
      }

      await _checkPaymentStatus();
    });
  }

  // PASSO 4: Verificar status
  Future<void> _checkPaymentStatus() async {
    if (subscriptionId == null) return;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/subscriptions/$subscriptionId/payment-status'),
        headers: {'Authorization': 'Bearer ${widget.authToken}'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final subStatus = data['subscription']['status'];

        if (subStatus == 'active') {
          // PAGAMENTO CONFIRMADO!
          _pollingTimer?.cancel();
          setState(() => status = 'success');
        }
      }
    } catch (e) {
      print('Erro ao verificar status: $e');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}
```

---

## 3️⃣ Usar o Widget

```dart
// Após o login, quando usuário escolhe plano:
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => SimplePaymentWidget(
      authToken: 'SEU_TOKEN_JWT',
      planType: 'monthly', // ou 'quarterly', 'annual'
    ),
  ),
);
```

---

## 📊 Fluxo Visual

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  [Iniciar Pagamento] (botão)                             │
│                                                            │
└───────────────────┬────────────────────────────────────────┘
                    │
                    ↓ _createSubscription()
                    │
┌───────────────────┴────────────────────────────────────────┐
│                                                            │
│  POST /api/subscriptions                                  │
│  { "plan": "monthly" }                                    │
│                                                            │
│  → Retorna: checkout_url + subscription_id                │
│                                                            │
└───────────────────┬────────────────────────────────────────┘
                    │
                    ↓
┌───────────────────┴────────────────────────────────────────┐
│                                                            │
│  💳 [Abrir Pagamento] (botão)                             │
│  📱 [Já paguei, verificar] (botão)                        │
│                                                            │
└───────────────────┬────────────────────────────────────────┘
                    │
                    ↓ _openPayment()
                    │
┌───────────────────┴────────────────────────────────────────┐
│                                                            │
│  Abre checkout_url no navegador                           │
│  Usuário completa pagamento (M-Pesa, Cartão, etc)        │
│                                                            │
└───────────────────┬────────────────────────────────────────┘
                    │
                    ↓ _startPolling()
                    │
┌───────────────────┴────────────────────────────────────────┐
│                                                            │
│  ⏰ Polling a cada 5 segundos                             │
│  GET /api/subscriptions/:id/payment-status                │
│                                                            │
│  Se status == "active":                                   │
│    → Mostra tela de sucesso ✅                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 Estados do Widget

| Estado | O que mostra |
|--------|--------------|
| `idle` | Botão "Iniciar Pagamento" |
| `isProcessing = true` | Loading circular |
| `awaiting_payment` | Botão "Abrir Pagamento" |
| `checking` | "Verificando pagamento..." |
| `success` | ✅ "Pagamento Confirmado!" |

---

## ⚡ Exemplo de Uso Completo

```dart
import 'package:flutter/material.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('Teste Pagamento')),
        body: Center(
          child: ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SimplePaymentWidget(
                    authToken: 'SEU_TOKEN_AQUI',
                    planType: 'monthly',
                  ),
                ),
              );
            },
            child: Text('Testar Pagamento'),
          ),
        ),
      ),
    );
  }
}

// ... Cole aqui o código do SimplePaymentWidget ...
```

---

## 🔧 Customizações Simples

### Mudar intervalo de polling

```dart
// De 5 segundos para 3 segundos
_pollingTimer = Timer.periodic(Duration(seconds: 3), (timer) async {
  // ...
});
```

### Mudar tempo máximo de espera

```dart
// De 5 minutos para 10 minutos
if (_attempts > 120) { // 120 tentativas x 5s = 10 min
  // ...
}
```

### Adicionar som de sucesso

```dart
// Instale: audioplayers: ^5.2.1
import 'package:audioplayers/audioplayers.dart';

final player = AudioPlayer();
await player.play(AssetSource('sounds/success.mp3'));
```

---

## ✅ Checklist Rápido

- [x] Adicionar `http` e `url_launcher` ao pubspec.yaml
- [x] Copiar código do `SimplePaymentWidget`
- [x] Substituir `baseUrl` pela sua URL do ngrok
- [x] Passar `authToken` correto do usuário logado
- [x] Testar no dispositivo real (não no emulador para M-Pesa)

---

## 🎉 Pronto!

Com apenas **1 arquivo** você tem um sistema de pagamento funcional!

Para uma implementação mais robusta com Provider, WebView, e melhor UX, veja: [GUIA_FLUTTER_PAGAMENTO.md](GUIA_FLUTTER_PAGAMENTO.md)
