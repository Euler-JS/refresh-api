# Rotas de Pagamento

Este documento descreve as rotas de pagamento da API, que integram com o PaySuite para processamento de pagamentos de assinaturas.

## Visão Geral

A API de pagamentos permite:
- Criar solicitações de pagamento
- Verificar status de pagamentos
- Processar pagamentos de assinaturas
- Receber callbacks do PaySuite
- Consultar histórico de pagamentos

## Autenticação

Todas as rotas (exceto callback) requerem autenticação JWT. Inclua o token no header:
```
Authorization: Bearer <token>
```

## Métodos de Pagamento Suportados

- `credit_card`: Cartão de crédito
- `mpesa`: M-Pesa (Moçambique)
- `emola`: eMola (Moçambique)

## Endpoints

### 1. Criar Solicitação de Pagamento

**POST** `/api/payments/request`

Cria uma nova solicitação de pagamento no PaySuite.

**Corpo da Requisição:**
```json
{
  "amount": 100.00,
  "method": "credit_card",
  "reference": "PAY-123456",
  "description": "Pagamento de assinatura mensal",
  "returnUrl": "https://seusite.com/success",
  "callbackUrl": "https://suapi.com/api/payments/callback"
}
```

**Parâmetros:**
- `amount` (number, obrigatório): Valor do pagamento
- `method` (string, obrigatório): Método de pagamento
- `reference` (string, obrigatório): Referência única do pagamento
- `description` (string, opcional): Descrição do pagamento
- `returnUrl` (string, opcional): URL para redirecionamento após pagamento
- `callbackUrl` (string, opcional): URL para callback do PaySuite

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "paysuiteId": "ps_123456789",
    "amount": 100.00,
    "method": "credit_card",
    "reference": "PAY-123456",
    "description": "Pagamento de assinatura mensal",
    "status": "pending",
    "checkoutUrl": "https://paysuite.com/checkout/ps_123456789",
    "returnUrl": "https://seusite.com/success",
    "callbackUrl": "https://suapi.com/api/payments/callback",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Obter Status de Pagamento

**GET** `/api/payments/request/:reference`

Obtém o status de uma solicitação de pagamento.

**Parâmetros da URL:**
- `reference` (string, obrigatório): Referência do pagamento

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "paysuiteId": "ps_123456789",
    "amount": 100.00,
    "method": "credit_card",
    "reference": "PAY-123456",
    "status": "paid",
    "checkoutUrl": "https://paysuite.com/checkout/ps_123456789",
    "transactionId": "txn_987654321",
    "paidAt": "2024-01-15T10:35:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### 3. Criar Pagamento de Assinatura

**POST** `/api/payments/subscription`

Cria um pagamento específico para uma assinatura, integrando com o sistema de assinaturas existente.

**Corpo da Requisição:**
```json
{
  "subscriptionId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "method": "mpesa",
  "returnUrl": "https://seusite.com/subscription/success"
}
```

**Parâmetros:**
- `subscriptionId` (string, obrigatório): ID da assinatura
- `method` (string, obrigatório): Método de pagamento
- `returnUrl` (string, opcional): URL de retorno após pagamento

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "payment": {
      "paysuiteId": "ps_123456789",
      "amount": 50.00,
      "method": "mpesa",
      "reference": "SUB-64f1a2b3c4d5e6f7g8h9i0j1-1705312200000",
      "status": "pending",
      "checkoutUrl": "https://paysuite.com/checkout/ps_123456789"
    },
    "subscription": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "status": "pending_payment",
      "plan": {
        "name": "Premium",
        "price": 50.00
      }
    }
  }
}
```

### 4. Callback do PaySuite

**POST** `/api/payments/callback`

Endpoint para receber notificações de status do PaySuite. Não requer autenticação.

**Corpo da Requisição (exemplo):**
```json
{
  "paysuiteId": "ps_123456789",
  "status": "paid",
  "transactionId": "txn_987654321",
  "paidAt": "2024-01-15T10:35:00.000Z"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Callback processado com sucesso"
}
```

### 5. Histórico de Pagamentos

**GET** `/api/payments/history`

Obtém o histórico de todos os pagamentos (para fins administrativos).

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "paysuiteId": "ps_123456789",
      "amount": 100.00,
      "method": "credit_card",
      "reference": "PAY-123456",
      "status": "paid",
      "paidAt": "2024-01-15T10:35:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Status de Pagamento

- `pending`: Aguardando processamento
- `processing`: Em processamento
- `paid`: Pago com sucesso
- `failed`: Falhou
- `cancelled`: Cancelado

## Tratamento de Erros

Todos os endpoints retornam erros no formato:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": "Detalhes técnicos (apenas em desenvolvimento)"
}
```

**Códigos de Status HTTP:**
- `400`: Dados inválidos
- `401`: Não autorizado
- `404`: Recurso não encontrado
- `409`: Conflito (referência duplicada)
- `500`: Erro interno do servidor

## Configuração

### Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
PAYSUITE_BASE_URL=https://api.paysuite.com/v1
PAYSUITE_TOKEN=seu_token_do_paysuite
```

### Dependências

Certifique-se de ter as seguintes dependências instaladas:
- `axios`: Para requisições HTTP ao PaySuite
- `mongoose`: Para persistência dos dados de pagamento

## Fluxo de Pagamento

1. **Criação**: Cliente solicita criação de pagamento
2. **Redirecionamento**: Cliente é redirecionado para URL de checkout do PaySuite
3. **Processamento**: PaySuite processa o pagamento
4. **Callback**: PaySuite notifica a API sobre o status
5. **Atualização**: API atualiza status local e ativa assinatura se pago

## Testes

Para testar os pagamentos, use as seguintes referências de teste:

### Cartão de Crédito
- Número: `4111111111111111`
- Validade: `12/25`
- CVV: `123`

### M-Pesa
- Número: `+258841234567`

### eMola
- Número: `+258841234567`

## Segurança

- Todos os endpoints (exceto callback) requerem autenticação JWT
- Dados sensíveis são criptografados no banco de dados
- Callbacks são validados para prevenir fraudes
- Logs de auditoria são mantidos para todas as transações

## Suporte

Para dúvidas sobre integração de pagamentos, consulte:
- Documentação do PaySuite: https://docs.paysuite.com
- Suporte da API: suporte@seusite.com
