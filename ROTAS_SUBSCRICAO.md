# 📋 Documentação das Rotas de Subscrição

## ✅ Status: TODAS AS ROTAS TESTADAS E FUNCIONANDO

As 3 rotas de subscrição necessárias para integração com o Flutter estão implementadas e testadas com sucesso.

> 📦 **Procurando pelas rotas de planos?** Consulte [ROTAS_PLANOS.md](./ROTAS_PLANOS.md)

---

## 🔐 Autenticação

**Todas as rotas de subscrição** requerem autenticação via Bearer Token no header:

```
Authorization: Bearer {seu_token_jwt}
```

Para obter o token, faça login primeiro:

```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "sua_senha"
}
```

---

##  ROTAS DE SUBSCRIÇÃO

### 1. **GET** `/api/subscriptions`

#### Descrição
Obtém informações da subscrição ativa do usuário autenticado.

##### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

##### Resposta de Sucesso (200)
```json
{
  "subscription": {
    "_id": "6909f661507b9d19b87974ad",
    "plan": "monthly",
    "startDate": "2025-11-04T12:49:37.547Z",
    "endDate": "2025-12-04T12:49:37.547Z",
    "status": "active",
    "userId": "69091a922f231c8876665fb8"
  },
  "isValid": true,
  "daysRemaining": 30
}
```

##### Resposta quando Não Há Subscrição (404)
```json
{
  "message": "Nenhuma subscrição encontrada"
}
```

#### Exemplo cURL
```bash
curl -X GET http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### 2. **POST** `/api/subscriptions`

##### Descrição
Cria uma nova subscrição para o usuário autenticado.

##### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

##### Body
```json
{
  "plan": "monthly"  // ou "annual"
}
```

##### Opções de Plano
- `"monthly"` - Subscrição mensal (30 dias) - MZN 230
- `"annual"` - Subscrição anual (365 dias) - MZN 990

##### Resposta de Sucesso (201)
```json
{
  "message": "Subscrição criada com sucesso",
  "subscription": {
    "_id": "6909f661507b9d19b87974ad",
    "plan": "monthly",
    "startDate": "2025-11-04T12:49:37.547Z",
    "endDate": "2025-12-04T12:49:37.547Z",
    "status": "active",
    "userId": "69091a922f231c8876665fb8"
  },
  "isValid": true,
  "daysRemaining": 30
}
```

#### Erros Possíveis

**400 - Plano Inválido**
```json
{
  "message": "Plano inválido. Escolha \"monthly\" ou \"annual\""
}
```

**400 - Subscrição Já Existe**
```json
{
  "message": "Usuário já possui uma subscrição ativa"
}
```

#### Exemplo cURL
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"plan":"monthly"}'
```

---

### 3. **PATCH** `/api/subscriptions/:subscriptionId/renew`

##### Descrição
Renova uma subscrição existente, estendendo a data de término.

##### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

##### Parâmetros da URL
- `subscriptionId` - ID da subscrição a ser renovada

##### Body
Nenhum body necessário.

##### Resposta de Sucesso (200)
```json
{
  "message": "Subscrição renovada com sucesso",
  "subscription": {
    "_id": "6909f661507b9d19b87974ad",
    "plan": "monthly",
    "startDate": "2025-11-04T12:49:37.547Z",
    "endDate": "2026-01-04T12:49:37.547Z",
    "status": "active",
    "userId": "69091a922f231c8876665fb8"
  },
  "isValid": true,
  "daysRemaining": 61
}
```

#### Erros Possíveis

**404 - Subscrição Não Encontrada**
```json
{
  "message": "Subscrição não encontrada"
}
```

**403 - Acesso Não Autorizado**
```json
{
  "message": "Acesso não autorizado a esta subscrição"
}
```

#### Exemplo cURL
```bash
curl -X PATCH http://localhost:3000/api/subscriptions/6909f661507b9d19b87974ad/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🔧 Integração com Flutter

### URL da API no Flutter

No arquivo `subscription_screen.dart`, atualize a URL base da API:

```dart
// Trocar de:
Uri.parse('https://sua-api.com/api/subscriptions')

// Para (desenvolvimento local):
Uri.parse('http://localhost:3000/api/subscriptions')

// Ou (produção):
Uri.parse('https://seu-dominio.com/api/subscriptions')
```

### Estrutura de Dados Esperada

O Flutter espera exatamente esta estrutura nas respostas:

```dart
{
  "subscription": {
    "_id": String,
    "plan": String ("monthly" | "annual"),
    "startDate": DateTime (ISO 8601),
    "endDate": DateTime (ISO 8601),
    "status": String ("active" | "expired" | "cancelled"),
    "userId": String
  },
  "isValid": bool,
  "daysRemaining": int
}
```

---

## 📊 Modelo de Dados

### Subscription Schema (MongoDB)

```javascript
{
  userId: ObjectId (ref: 'User'),
  plan: String (enum: ['monthly', 'annual']),
  startDate: Date,
  endDate: Date,
  status: String (enum: ['active', 'expired', 'cancelled']),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Métodos do Modelo

- `isValid()` - Retorna `true` se a subscrição está ativa e não expirou
- `daysRemaining()` - Calcula quantos dias faltam até expirar

---

## 🧪 Script de Teste

Use o script `test-subscriptions.sh` para testar todas as rotas:

```bash
chmod +x test-subscriptions.sh
./test-subscriptions.sh
```

O script testa automaticamente:
1. ✅ Login e obtenção de token
2. ✅ Verificação de subscrição existente (GET)
3. ✅ Criação de nova subscrição (POST)
4. ✅ Verificação da subscrição criada (GET)
5. ✅ Renovação da subscrição (PATCH)

---

## 🚀 Como Executar a API

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Ou com auto-reload (desenvolvimento)
npm run dev
```

---

## 📝 Notas Importantes

1. **Autenticação Obrigatória**: Todas as rotas de subscrição requerem token JWT válido
2. **Planos Disponíveis**: Consulte `/api/plans` para ver planos disponíveis (ver [ROTAS_PLANOS.md](./ROTAS_PLANOS.md))
3. **Uma Subscrição por Usuário**: Apenas uma subscrição ativa permitida por vez
4. **Cálculo Automático de Datas**: 
   - Monthly: +1 mês
   - Annual: +12 meses
5. **Renovação**: Estende a partir da `endDate` atual, não da data atual
6. **Status**: Gerenciado automaticamente (`active`, `expired`, `cancelled`)

---

## 🔒 Segurança

- ✅ Middleware de autenticação implementado
- ✅ Validação de propriedade da subscrição (usuário só acessa suas próprias)
- ✅ Validação de tipos de plano
- ✅ Proteção contra criação de múltiplas subscrições
- ✅ Token JWT com expiração configurável

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique se o MongoDB está conectado
2. Confirme que o token JWT é válido
3. Valide os dados enviados no body das requisições
4. Consulte os logs do servidor para erros detalhados

**Data de Documentação**: 04/11/2025  
**Versão da API**: 1.0.0
