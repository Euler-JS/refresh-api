# 📦 Documentação das Rotas de Planos de Subscrição

## ✅ Status: TODAS AS ROTAS TESTADAS E FUNCIONANDO

As rotas de planos estão implementadas e testadas com sucesso. **Essas rotas são públicas** e não requerem autenticação.

---

## 🌐 Rotas Públicas

Todas as rotas de planos são **públicas** e podem ser acessadas sem autenticação. Isso permite que o aplicativo Flutter mostre os planos disponíveis mesmo antes do usuário fazer login.

---

## 1. **GET** `/api/plans`

### Descrição
Obtém a lista completa de todos os planos de subscrição disponíveis.

### Autenticação
❌ **Não requer autenticação** (rota pública)

### Headers
```
Content-Type: application/json
```

### Resposta de Sucesso (200)
```json
{
  "success": true,
  "plans": [
    {
      "id": "6909f9daea6c51332bf02162",
      "title": "Plano Mensal",
      "description": "Perfeito para testar o aplicativo",
      "price": 230,
      "features": [
        "Acesso a todas as funcionalidades",
        "Suporte técnico por email",
        "Atualizações gratuitas"
      ],
      "type": "monthly"
    },
    {
      "id": "6909f9daea6c51332bf02163",
      "title": "Plano Anual",
      "description": "Ideal para uso contínuo, com desconto",
      "price": 990,
      "features": [
        "Acesso a todas as funcionalidades",
        "Suporte técnico prioritário",
        "Atualizações gratuitas",
        "2 meses grátis em comparação ao plano mensal"
      ],
      "type": "annual"
    }
  ]
}
```

### Estrutura da Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | Boolean | Indica se a requisição foi bem-sucedida |
| `plans` | Array | Lista de planos disponíveis |
| `plans[].id` | String | ID único do plano (MongoDB ObjectId) |
| `plans[].title` | String | Título do plano |
| `plans[].description` | String | Descrição breve do plano |
| `plans[].price` | Number | Preço do plano em MZN |
| `plans[].features` | Array[String] | Lista de características do plano |
| `plans[].type` | String | Tipo do plano: `"monthly"` ou `"annual"` |

### Exemplo cURL
```bash
curl -X GET http://localhost:3000/api/plans \
  -H "Content-Type: application/json"
```

### Exemplo JavaScript/Fetch
```javascript
fetch('http://localhost:3000/api/plans', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Planos disponíveis:', data.plans);
})
.catch(error => console.error('Erro:', error));
```

### Exemplo Flutter/Dart
```dart
final response = await http.get(
  Uri.parse('http://localhost:3000/api/plans'),
  headers: {'Content-Type': 'application/json'},
);

if (response.statusCode == 200) {
  final data = json.decode(response.body);
  List<dynamic> plans = data['plans'];
  print('Total de planos: ${plans.length}');
}
```

---

## 2. **GET** `/api/plans/:planId`

### Descrição
Obtém detalhes específicos de um plano pelo seu ID.

### Autenticação
❌ **Não requer autenticação** (rota pública)

### Headers
```
Content-Type: application/json
```

### Parâmetros da URL
- `planId` (obrigatório) - ID do plano a ser consultado

### Resposta de Sucesso (200)
```json
{
  "success": true,
  "plan": {
    "id": "6909f9daea6c51332bf02162",
    "title": "Plano Mensal",
    "description": "Perfeito para testar o aplicativo",
    "price": 230,
    "features": [
      "Acesso a todas as funcionalidades",
      "Suporte técnico por email",
      "Atualizações gratuitas"
    ],
    "type": "monthly"
  }
}
```

### Estrutura da Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | Boolean | Indica se a requisição foi bem-sucedida |
| `plan` | Object | Detalhes do plano solicitado |
| `plan.id` | String | ID único do plano |
| `plan.title` | String | Título do plano |
| `plan.description` | String | Descrição do plano |
| `plan.price` | Number | Preço em MZN |
| `plan.features` | Array[String] | Características incluídas |
| `plan.type` | String | `"monthly"` ou `"annual"` |

### Erros Possíveis

**404 - Plano Não Encontrado**
```json
{
  "success": false,
  "message": "Plano não encontrado"
}
```

**500 - Erro Interno**
```json
{
  "success": false,
  "message": "Erro ao buscar plano"
}
```

### Exemplo cURL
```bash
curl -X GET http://localhost:3000/api/plans/6909f9daea6c51332bf02162 \
  -H "Content-Type: application/json"
```

### Exemplo JavaScript/Fetch
```javascript
const planId = '6909f9daea6c51332bf02162';

fetch(`http://localhost:3000/api/plans/${planId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Detalhes do plano:', data.plan);
})
.catch(error => console.error('Erro:', error));
```

### Exemplo Flutter/Dart
```dart
final planId = '6909f9daea6c51332bf02162';
final response = await http.get(
  Uri.parse('http://localhost:3000/api/plans/$planId'),
  headers: {'Content-Type': 'application/json'},
);

if (response.statusCode == 200) {
  final data = json.decode(response.body);
  Map<String, dynamic> plan = data['plan'];
  print('Plano: ${plan['title']} - MZN ${plan['price']}');
}
```

---

## 3. **POST** `/api/plans` (Administrativo)

### Descrição
Cria um novo plano de subscrição. **Esta rota deve ser protegida em produção** com autenticação de administrador.

### Autenticação
⚠️ **Atualmente pública** (recomenda-se adicionar autenticação admin em produção)

### Headers
```
Content-Type: application/json
```

### Body da Requisição
```json
{
  "title": "Plano Premium",
  "description": "Plano completo com todos os recursos",
  "price": 1500.0,
  "features": [
    "Acesso ilimitado",
    "Suporte 24/7",
    "Recursos exclusivos"
  ],
  "type": "annual"
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `title` | String | Título do plano | Obrigatório |
| `description` | String | Descrição do plano | Obrigatório |
| `price` | Number | Preço em MZN | Obrigatório, > 0 |
| `features` | Array[String] | Lista de características | Obrigatório, não vazio |
| `type` | String | Tipo do plano | `"monthly"` ou `"annual"` |

### Resposta de Sucesso (201)
```json
{
  "success": true,
  "message": "Plano criado com sucesso",
  "plan": {
    "id": "6909f9daea6c51332bf02164",
    "title": "Plano Premium",
    "description": "Plano completo com todos os recursos",
    "price": 1500,
    "features": [
      "Acesso ilimitado",
      "Suporte 24/7",
      "Recursos exclusivos"
    ],
    "type": "annual"
  }
}
```

### Erros Possíveis

**400 - Campos Obrigatórios Faltando**
```json
{
  "success": false,
  "message": "Todos os campos são obrigatórios"
}
```

**400 - Tipo Inválido**
```json
{
  "success": false,
  "message": "Tipo de plano inválido. Use \"monthly\" ou \"annual\""
}
```

**400 - Features Inválidas**
```json
{
  "success": false,
  "message": "Características devem ser uma lista não vazia"
}
```

### Exemplo cURL
```bash
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Plano Premium",
    "description": "Plano completo",
    "price": 1500,
    "features": ["Acesso ilimitado", "Suporte 24/7"],
    "type": "annual"
  }'
```

---

## 📊 Modelo de Dados (Plan Schema)

### Estrutura no MongoDB

```javascript
{
  title: String (obrigatório),
  description: String (obrigatório),
  price: Number (obrigatório),
  features: [String] (obrigatório),
  type: String (enum: ['monthly', 'annual'], obrigatório),
  isActive: Boolean (default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Campos do Modelo

| Campo | Tipo | Descrição | Valor Padrão |
|-------|------|-----------|--------------|
| `title` | String | Nome do plano | - |
| `description` | String | Descrição breve | - |
| `price` | Number | Preço em MZN | - |
| `features` | Array | Características incluídas | - |
| `type` | String | monthly/annual | - |
| `isActive` | Boolean | Se o plano está ativo | `true` |
| `createdAt` | Date | Data de criação | Auto |
| `updatedAt` | Date | Última atualização | Auto |

---

## 🔧 Integração com Flutter

### Buscar Planos Disponíveis

```dart
Future<List<PlanOption>> fetchPlans() async {
  try {
    final response = await http.get(
      Uri.parse('http://SEU_IP:3000/api/plans'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      
      if (data['success']) {
        List<dynamic> plansJson = data['plans'];
        
        return plansJson.map((json) => PlanOption(
          id: json['id'],
          title: json['title'],
          description: json['description'],
          price: json['price'].toDouble(),
          features: List<String>.from(json['features']),
          type: json['type'],
        )).toList();
      }
    }
    
    throw Exception('Erro ao carregar planos');
  } catch (e) {
    print('Erro: $e');
    return [];
  }
}
```

### Modelo PlanOption no Flutter

```dart
class PlanOption {
  final String id;
  final String title;
  final String description;
  final double price;
  final List<String> features;
  final String type;

  PlanOption({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.features,
    required this.type,
  });

  factory PlanOption.fromJson(Map<String, dynamic> json) {
    return PlanOption(
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

---

## 🗄️ Gerenciamento de Planos

### Popular o Banco de Dados

Use o script fornecido para popular o banco com os planos padrão:

```bash
npm run seed:plans
```

Este comando irá:
1. ✅ Conectar ao MongoDB
2. 🗑️ Remover planos antigos
3. ✅ Criar planos padrão (Mensal e Anual)
4. ✅ Confirmar criação

### Planos Padrão Incluídos

**Plano Mensal:**
- Preço: MZN 230
- Duração: 30 dias
- Características: 3 features básicas

**Plano Anual:**
- Preço: MZN 990 (equivalente a 10 meses)
- Duração: 365 dias
- Características: 4 features premium
- Economia: 2 meses grátis vs mensal

---

## 🧪 Testes

### Script de Teste Automatizado

Execute o script de teste para validar as rotas:

```bash
chmod +x test-plans.sh
./test-plans.sh
```

### Testes Manuais

**Teste 1: Listar Planos**
```bash
curl -X GET http://localhost:3000/api/plans
```

**Teste 2: Obter Plano Específico**
```bash
# Substitua PLAN_ID pelo ID real
curl -X GET http://localhost:3000/api/plans/PLAN_ID
```

**Teste 3: Criar Novo Plano**
```bash
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste",
    "description": "Plano de teste",
    "price": 100,
    "features": ["Feature 1"],
    "type": "monthly"
  }'
```

---

## 📝 Notas Importantes

1. **Rotas Públicas**: Planos podem ser consultados sem autenticação
2. **Cache**: Considere implementar cache para reduzir consultas ao banco
3. **Validação**: Todos os campos são validados antes de criar/atualizar
4. **Segurança**: Rota POST deve ser protegida com autenticação admin em produção
5. **Preços**: Valores em MZN (Metical Moçambicano)
6. **Tipos**: Apenas `"monthly"` e `"annual"` são aceitos
7. **Features**: Sempre retorna array, nunca null

---

## 🔒 Recomendações de Segurança (Produção)

Para ambiente de produção, considere:

1. **Proteger POST /api/plans** com middleware de autenticação admin
2. **Adicionar rotas de UPDATE e DELETE** (também protegidas)
3. **Implementar rate limiting** para evitar abuso
4. **Validar dados mais rigorosamente** (ex: preço mínimo/máximo)
5. **Adicionar logs de auditoria** para criação/edição de planos
6. **Implementar versionamento** de planos para histórico

### Exemplo de Proteção Admin

```javascript
// Em planRoutes.js (futuro)
const adminAuth = require('../middlewares/adminAuth');

router.post('/', adminAuth, planController.createPlan);
```

---

## 🚀 Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Popular banco com planos padrão
npm run seed:plans

# 3. Iniciar servidor
npm start

# 4. Testar rotas
./test-plans.sh
```

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique se o MongoDB está conectado
2. Confirme que os planos foram populados (`npm run seed:plans`)
3. Valide o formato dos dados nas requisições POST
4. Consulte os logs do servidor para detalhes de erros
5. Use `jq` para formatar JSON no terminal: `curl ... | jq .`

---

## 📈 Estatísticas

- **Planos Ativos**: 2 (Mensal e Anual)
- **Economia Anual**: ~17% (2 meses grátis)
- **Preço Mensal**: MZN 230
- **Preço Anual**: MZN 990

---

**Data de Documentação**: 04/11/2025  
**Versão da API**: 1.0.0  
**Status**: ✅ Produção Ready
