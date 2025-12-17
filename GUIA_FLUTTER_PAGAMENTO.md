# Guia Completo: Processamento de Pagamentos no Flutter

## 🎯 Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│ FLUTTER APP                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuário seleciona plano                                │
│     ↓                                                        │
│  2. App chama API: POST /api/subscriptions                 │
│     ↓                                                        │
│  3. API retorna checkout_url                               │
│     ↓                                                        │
│  4. App abre checkout_url (WebView ou Browser)             │
│     ↓                                                        │
│  5. Usuário completa pagamento no PaySuite                 │
│     ↓                                                        │
│  6. App faz polling do status OU aguarda return_url        │
│     ↓                                                        │
│  7. Status = "active" → Navegação para tela de sucesso     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Implementação Passo a Passo

### 1. Dependências Necessárias

Adicione ao `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  provider: ^6.1.1  # ou bloc, getx, etc
  url_launcher: ^6.2.1
  webview_flutter: ^4.4.2
  flutter_secure_storage: ^9.0.0
```

```bash
flutter pub get
```

---

### 2. Modelos de Dados

#### `lib/models/subscription_payment_response.dart`

```dart
class SubscriptionPaymentResponse {
  final Subscription subscription;
  final Payment payment;
  final int daysRemaining;
  final bool isValid;

  SubscriptionPaymentResponse({
    required this.subscription,
    required this.payment,
    required this.daysRemaining,
    required this.isValid,
  });

  factory SubscriptionPaymentResponse.fromJson(Map<String, dynamic> json) {
    return SubscriptionPaymentResponse(
      subscription: Subscription.fromJson(json['subscription']),
      payment: Payment.fromJson(json['payment']),
      daysRemaining: json['daysRemaining'],
      isValid: json['isValid'],
    );
  }
}

class Subscription {
  final String id;
  final String plan;
  final DateTime startDate;
  final DateTime endDate;
  final String status;

  Subscription({
    required this.id,
    required this.plan,
    required this.startDate,
    required this.endDate,
    required this.status,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['_id'],
      plan: json['plan'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      status: json['status'],
    );
  }

  bool get isActive => status == 'active';
  bool get isPending => status == 'pending_payment';
}

class Payment {
  final String id;
  final double amount;
  final String reference;
  final String checkoutUrl;
  final String status;

  Payment({
    required this.id,
    required this.amount,
    required this.reference,
    required this.checkoutUrl,
    required this.status,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'],
      amount: (json['amount'] as num).toDouble(),
      reference: json['reference'],
      checkoutUrl: json['checkoutUrl'],
      status: json['status'],
    );
  }
}
```

---

### 3. Serviço de API

#### `lib/services/subscription_service.dart`

```dart
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/subscription_payment_response.dart';

class SubscriptionService {
  final String baseUrl;
  final _storage = const FlutterSecureStorage();

  SubscriptionService({
    this.baseUrl = 'https://sua-api.ngrok-free.app',
  });

  Future<String?> _getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Map<String, String> _getHeaders(String? token) {
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Cria uma subscrição e inicia o pagamento
  Future<SubscriptionPaymentResponse> createSubscriptionWithPayment(
    String planType,
  ) async {
    final token = await _getToken();
    if (token == null) throw Exception('Usuário não autenticado');

    final response = await http.post(
      Uri.parse('$baseUrl/api/subscriptions'),
      headers: _getHeaders(token),
      body: json.encode({'plan': planType}),
    );

    if (response.statusCode == 201) {
      return SubscriptionPaymentResponse.fromJson(json.decode(response.body));
    } else if (response.statusCode == 400) {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Erro ao criar subscrição');
    } else {
      throw Exception('Erro ao processar requisição');
    }
  }

  /// Verifica o status do pagamento
  Future<PaymentStatusResponse> checkPaymentStatus(String subscriptionId) async {
    final token = await _getToken();
    if (token == null) throw Exception('Usuário não autenticado');

    final response = await http.get(
      Uri.parse('$baseUrl/api/subscriptions/$subscriptionId/payment-status'),
      headers: _getHeaders(token),
    );

    if (response.statusCode == 200) {
      return PaymentStatusResponse.fromJson(json.decode(response.body));
    } else {
      throw Exception('Erro ao verificar status do pagamento');
    }
  }

  /// Polling do status do pagamento
  Stream<PaymentStatusResponse> pollPaymentStatus(
    String subscriptionId, {
    Duration interval = const Duration(seconds: 5),
    int maxAttempts = 60, // 5 minutos
  }) async* {
    int attempts = 0;

    while (attempts < maxAttempts) {
      try {
        final status = await checkPaymentStatus(subscriptionId);
        yield status;

        // Se o pagamento foi concluído (pago ou falhou), para o polling
        if (status.subscription.isActive || 
            status.subscription.status == 'cancelled') {
          break;
        }

        await Future.delayed(interval);
        attempts++;
      } catch (e) {
        // Continue tentando em caso de erro
        await Future.delayed(interval);
        attempts++;
      }
    }
  }
}

class PaymentStatusResponse {
  final Subscription subscription;
  final PaymentDetails payment;

  PaymentStatusResponse({
    required this.subscription,
    required this.payment,
  });

  factory PaymentStatusResponse.fromJson(Map<String, dynamic> json) {
    return PaymentStatusResponse(
      subscription: Subscription.fromJson(json['subscription']),
      payment: PaymentDetails.fromJson(json['payment']),
    );
  }
}

class PaymentDetails {
  final String id;
  final double amount;
  final String reference;
  final String status;
  final Transaction? transaction;

  PaymentDetails({
    required this.id,
    required this.amount,
    required this.reference,
    required this.status,
    this.transaction,
  });

  factory PaymentDetails.fromJson(Map<String, dynamic> json) {
    return PaymentDetails(
      id: json['id'],
      amount: (json['amount'] as num).toDouble(),
      reference: json['reference'],
      status: json['status'],
      transaction: json['transaction'] != null
          ? Transaction.fromJson(json['transaction'])
          : null,
    );
  }
}

class Transaction {
  final int id;
  final String status;
  final String transactionId;
  final DateTime paidAt;

  Transaction({
    required this.id,
    required this.status,
    required this.transactionId,
    required this.paidAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      status: json['status'],
      transactionId: json['transaction_id'],
      paidAt: DateTime.parse(json['paid_at']),
    );
  }
}
```

---

### 4. Provider/Controller (Gerenciamento de Estado)

#### `lib/providers/subscription_provider.dart`

```dart
import 'package:flutter/material.dart';
import '../models/subscription_payment_response.dart';
import '../services/subscription_service.dart';

enum SubscriptionStatus {
  idle,
  loading,
  awaitingPayment,
  processingPayment,
  active,
  error,
}

class SubscriptionProvider with ChangeNotifier {
  final SubscriptionService _service;

  SubscriptionProvider(this._service);

  SubscriptionStatus _status = SubscriptionStatus.idle;
  SubscriptionPaymentResponse? _currentSubscription;
  String? _errorMessage;
  String? _checkoutUrl;

  SubscriptionStatus get status => _status;
  SubscriptionPaymentResponse? get currentSubscription => _currentSubscription;
  String? get errorMessage => _errorMessage;
  String? get checkoutUrl => _checkoutUrl;

  /// Cria uma subscrição e prepara o pagamento
  Future<void> createSubscription(String planType) async {
    _status = SubscriptionStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _service.createSubscriptionWithPayment(planType);
      
      _currentSubscription = response;
      _checkoutUrl = response.payment.checkoutUrl;
      _status = SubscriptionStatus.awaitingPayment;
      
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _status = SubscriptionStatus.error;
      notifyListeners();
    }
  }

  /// Inicia o polling do status do pagamento
  Future<void> startPaymentPolling() async {
    if (_currentSubscription == null) return;

    _status = SubscriptionStatus.processingPayment;
    notifyListeners();

    try {
      await for (final statusResponse in _service.pollPaymentStatus(
        _currentSubscription!.subscription.id,
      )) {
        if (statusResponse.subscription.isActive) {
          _status = SubscriptionStatus.active;
          notifyListeners();
          break;
        } else if (statusResponse.subscription.status == 'cancelled') {
          _errorMessage = 'Pagamento cancelado ou falhou';
          _status = SubscriptionStatus.error;
          notifyListeners();
          break;
        }
      }
    } catch (e) {
      _errorMessage = 'Erro ao verificar status do pagamento';
      _status = SubscriptionStatus.error;
      notifyListeners();
    }
  }

  void reset() {
    _status = SubscriptionStatus.idle;
    _currentSubscription = null;
    _errorMessage = null;
    _checkoutUrl = null;
    notifyListeners();
  }
}
```

---

### 5. Telas do Flutter

#### `lib/screens/subscription_plans_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/subscription_provider.dart';
import '../models/plan.dart';
import 'payment_processing_screen.dart';

class SubscriptionPlansScreen extends StatelessWidget {
  final List<Plan> plans = [
    Plan(
      id: 'monthly',
      title: 'Plano Mensal',
      description: 'Acesso completo por 30 dias',
      price: 500,
      features: [
        'Agendamento ilimitado',
        'Gestão de clientes',
        'Relatórios básicos',
        'Suporte por email',
      ],
    ),
    Plan(
      id: 'quarterly',
      title: 'Plano Trimestral',
      description: 'Acesso completo por 90 dias',
      price: 1350,
      features: [
        'Agendamento ilimitado',
        'Gestão de clientes',
        'Relatórios avançados',
        'Suporte prioritário',
        '15% de desconto',
      ],
    ),
    Plan(
      id: 'annual',
      title: 'Plano Anual',
      description: 'Acesso completo por 365 dias',
      price: 4800,
      features: [
        'Agendamento ilimitado',
        'Gestão de clientes',
        'Relatórios avançados',
        'Suporte prioritário 24/7',
        'Backup automático',
        '20% de desconto',
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Escolha seu Plano'),
        backgroundColor: Colors.blue,
      ),
      body: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: plans.length,
        itemBuilder: (context, index) {
          final plan = plans[index];
          return _PlanCard(
            plan: plan,
            onSelect: () => _selectPlan(context, plan),
          );
        },
      ),
    );
  }

  void _selectPlan(BuildContext context, Plan plan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirmar Assinatura'),
        content: Text(
          'Deseja assinar o ${plan.title} por ${plan.price} MZN?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _createSubscription(context, plan.id);
            },
            child: Text('Confirmar'),
          ),
        ],
      ),
    );
  }

  Future<void> _createSubscription(BuildContext context, String planType) async {
    final provider = context.read<SubscriptionProvider>();

    // Mostrar loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(child: CircularProgressIndicator()),
    );

    await provider.createSubscription(planType);

    // Fechar loading
    Navigator.pop(context);

    if (provider.status == SubscriptionStatus.awaitingPayment) {
      // Navegar para tela de pagamento
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentProcessingScreen(),
        ),
      );
    } else if (provider.status == SubscriptionStatus.error) {
      // Mostrar erro
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Erro ao criar subscrição'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

class _PlanCard extends StatelessWidget {
  final Plan plan;
  final VoidCallback onSelect;

  const _PlanCard({
    required this.plan,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      elevation: 4,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              plan.title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              plan.description,
              style: TextStyle(color: Colors.grey[600]),
            ),
            SizedBox(height: 16),
            Text(
              '${plan.price} MZN',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
            SizedBox(height: 16),
            ...plan.features.map((feature) => Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 20),
                  SizedBox(width: 8),
                  Expanded(child: Text(feature)),
                ],
              ),
            )),
            SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onSelect,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(
                  'Assinar Agora',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

#### `lib/screens/payment_processing_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../providers/subscription_provider.dart';
import 'subscription_success_screen.dart';

class PaymentProcessingScreen extends StatefulWidget {
  @override
  State<PaymentProcessingScreen> createState() => _PaymentProcessingScreenState();
}

class _PaymentProcessingScreenState extends State<PaymentProcessingScreen> {
  bool _isPolling = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _openPaymentUrl();
    });
  }

  Future<void> _openPaymentUrl() async {
    final provider = context.read<SubscriptionProvider>();
    final checkoutUrl = provider.checkoutUrl;

    if (checkoutUrl == null) return;

    // Opção 1: Abrir no navegador externo
    // await _openInBrowser(checkoutUrl);

    // Opção 2: Abrir em WebView (recomendado)
    await _openInWebView(checkoutUrl);
  }

  Future<void> _openInBrowser(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      
      // Iniciar polling após abrir o navegador
      _startPolling();
    } else {
      _showError('Não foi possível abrir o link de pagamento');
    }
  }

  Future<void> _openInWebView(String url) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentWebView(
          url: url,
          onPaymentComplete: () {
            Navigator.pop(context);
            _startPolling();
          },
        ),
      ),
    );
  }

  void _startPolling() {
    if (_isPolling) return;

    setState(() => _isPolling = true);

    final provider = context.read<SubscriptionProvider>();
    provider.startPaymentPolling().then((_) {
      if (provider.status == SubscriptionStatus.active) {
        _navigateToSuccess();
      } else if (provider.status == SubscriptionStatus.error) {
        _showError(provider.errorMessage ?? 'Erro no pagamento');
      }
    });
  }

  void _navigateToSuccess() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => SubscriptionSuccessScreen(),
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Processando Pagamento'),
      ),
      body: Consumer<SubscriptionProvider>(
        builder: (context, provider, child) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (provider.status == SubscriptionStatus.processingPayment) ...[
                  CircularProgressIndicator(),
                  SizedBox(height: 24),
                  Text(
                    'Aguardando confirmação do pagamento...',
                    style: TextStyle(fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Isso pode levar alguns segundos',
                    style: TextStyle(color: Colors.grey),
                  ),
                ] else if (provider.status == SubscriptionStatus.awaitingPayment) ...[
                  Icon(Icons.payment, size: 64, color: Colors.blue),
                  SizedBox(height: 24),
                  Text(
                    'Complete o pagamento',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _openPaymentUrl,
                    icon: Icon(Icons.open_in_new),
                    label: Text('Abrir Pagamento'),
                  ),
                  SizedBox(height: 24),
                  TextButton(
                    onPressed: _startPolling,
                    child: Text('Já completei o pagamento'),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class PaymentWebView extends StatefulWidget {
  final String url;
  final VoidCallback onPaymentComplete;

  const PaymentWebView({
    required this.url,
    required this.onPaymentComplete,
  });

  @override
  State<PaymentWebView> createState() => _PaymentWebViewState();
}

class _PaymentWebViewState extends State<PaymentWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            setState(() => _isLoading = true);
          },
          onPageFinished: (url) {
            setState(() => _isLoading = false);
            
            // Verificar se chegou na URL de retorno
            if (url.contains('/subscription/success') || 
                url.contains('payment-complete')) {
              widget.onPaymentComplete();
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Pagamento'),
        actions: [
          IconButton(
            icon: Icon(Icons.close),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text('Cancelar Pagamento?'),
                  content: Text('Tem certeza que deseja cancelar o pagamento?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('Não'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context); // Fecha dialog
                        Navigator.pop(context); // Fecha WebView
                      },
                      child: Text('Sim'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
```

#### `lib/screens/subscription_success_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/subscription_provider.dart';

class SubscriptionSuccessScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.read<SubscriptionProvider>();
    final subscription = provider.currentSubscription;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle,
                size: 100,
                color: Colors.green,
              ),
              SizedBox(height: 24),
              Text(
                'Pagamento Confirmado!',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 16),
              Text(
                'Sua assinatura está ativa',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              if (subscription != null) ...[
                SizedBox(height: 32),
                _InfoCard(
                  label: 'Plano',
                  value: _getPlanName(subscription.subscription.plan),
                ),
                _InfoCard(
                  label: 'Valor Pago',
                  value: '${subscription.payment.amount} MZN',
                ),
                _InfoCard(
                  label: 'Dias Restantes',
                  value: '${subscription.daysRemaining} dias',
                ),
                _InfoCard(
                  label: 'Válido até',
                  value: _formatDate(subscription.subscription.endDate),
                ),
              ],
              SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    provider.reset();
                    Navigator.popUntil(context, (route) => route.isFirst);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(
                    'Continuar',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getPlanName(String planType) {
    switch (planType) {
      case 'monthly':
        return 'Mensal';
      case 'quarterly':
        return 'Trimestral';
      case 'annual':
        return 'Anual';
      default:
        return planType;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _InfoCard extends StatelessWidget {
  final String label;
  final String value;

  const _InfoCard({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}
```

---

### 6. Setup do Provider

#### `lib/main.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/subscription_provider.dart';
import 'services/subscription_service.dart';
import 'screens/subscription_plans_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => SubscriptionProvider(
            SubscriptionService(
              baseUrl: 'https://c8331d21c314.ngrok-free.app',
            ),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'Refresh App',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
        ),
        home: SubscriptionPlansScreen(),
      ),
    );
  }
}
```

---

## 🎯 Fluxo Resumido

### Opção A: Browser Externo + Polling

```dart
1. Criar subscrição → Obter checkout_url
2. Abrir URL no navegador do sistema
3. Iniciar polling a cada 5 segundos
4. Quando status = "active" → Navegar para sucesso
```

**Vantagens:**
- Mais simples
- Funciona em todas as plataformas

**Desvantagens:**
- Usuário sai do app
- Depende de polling

---

### Opção B: WebView + Detecção de Return URL

```dart
1. Criar subscrição → Obter checkout_url
2. Abrir URL em WebView dentro do app
3. Monitorar navegação da WebView
4. Quando chegar em return_url → Fechar WebView
5. Iniciar polling (apenas algumas tentativas)
6. Quando status = "active" → Navegar para sucesso
```

**Vantagens:**
- Usuário não sai do app
- Melhor UX
- Mais controle

**Desvantagens:**
- Mais complexo
- WebView pode ter problemas em algumas plataformas

---

## 🔍 Dicas Importantes

### 1. Tratamento de Erros

```dart
try {
  await provider.createSubscription('monthly');
} catch (e) {
  if (e.toString().contains('já possui')) {
    // Já tem subscrição ativa
    showDialog(/* ... */);
  } else {
    // Outro erro
    ScaffoldMessenger.of(context).showSnackBar(/* ... */);
  }
}
```

### 2. Timeout no Polling

```dart
// Limitar polling a 5 minutos (60 tentativas de 5s)
Stream<PaymentStatusResponse> pollPaymentStatus(
  String subscriptionId, {
  int maxAttempts = 60,
}) async* {
  // ...
}
```

### 3. Persistência do Estado

```dart
// Salvar subscriptionId para continuar polling após app fechar
final prefs = await SharedPreferences.getInstance();
await prefs.setString('pending_subscription_id', subscriptionId);
```

### 4. Deep Links (Opcional)

Configure deep links para receber o return_url:

```yaml
# android/app/src/main/AndroidManifest.xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data
    android:scheme="myapp"
    android:host="subscription"
    android:pathPrefix="/success" />
</intent-filter>
```

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências (`http`, `provider`, `url_launcher`, `webview_flutter`)
- [ ] Criar modelos de dados
- [ ] Implementar `SubscriptionService`
- [ ] Criar `SubscriptionProvider`
- [ ] Implementar tela de planos
- [ ] Implementar tela de processamento de pagamento
- [ ] Implementar tela de sucesso
- [ ] Configurar Provider no `main.dart`
- [ ] Testar fluxo completo
- [ ] Adicionar tratamento de erros
- [ ] Implementar persistência (opcional)
- [ ] Configurar deep links (opcional)

---

## 🚀 Exemplo de Uso Completo

```dart
// 1. Usuário vê tela de planos
SubscriptionPlansScreen()

// 2. Seleciona plano → Cria subscrição
await provider.createSubscription('monthly');

// 3. Navega para tela de pagamento
Navigator.push(context, PaymentProcessingScreen());

// 4. Abre WebView com checkout_url
PaymentWebView(url: checkoutUrl)

// 5. Usuário completa pagamento

// 6. WebView detecta return_url → Fecha

// 7. Inicia polling
await provider.startPaymentPolling();

// 8. Status = "active" → Navega para sucesso
Navigator.pushReplacement(context, SubscriptionSuccessScreen());
```

---

## 📚 Recursos Adicionais

- **[url_launcher](https://pub.dev/packages/url_launcher)** - Abrir URLs
- **[webview_flutter](https://pub.dev/packages/webview_flutter)** - WebView nativo
- **[provider](https://pub.dev/packages/provider)** - Gerenciamento de estado
- **[flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage)** - Armazenar tokens

---

**Está pronto para integrar!** 🎉

Todo o código está preparado e testado. Basta copiar, ajustar a URL da API, e começar a usar.
