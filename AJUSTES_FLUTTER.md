# Ajustes para Integração com Flutter

## Mudanças Implementadas

### 1. CORS Configurado Explicitamente

O CORS foi configurado para aceitar requisições OPTIONS (preflight) do Flutter:

```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. Formato de Resposta Ajustado

#### GET /api/subscriptions

**Resposta com subscrição ativa:**
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

**Resposta sem subscrição:**
```json
{
  "message": "Nenhuma subscrição ativa encontrada"
}
```

#### POST /api/subscriptions

**Request:**
```json
{
  "plan": "monthly"
}
```

**Response (201):**
```json
{
  "subscription": {
    "_id": "sub_123456",
    "plan": "monthly",
    "startDate": "2025-12-16T00:00:00.000Z",
    "endDate": "2026-01-16T00:00:00.000Z",
    "status": "active"
  },
  "daysRemaining": 30,
  "isValid": true
}
```

#### PATCH /api/subscriptions/:id/renew

**Response (200):**
```json
{
  "subscription": {
    "_id": "sub_123456",
    "plan": "monthly",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-02-01T00:00:00.000Z",
    "status": "active"
  },
  "daysRemaining": 30,
  "isValid": true
}
```

#### GET /api/plans

**Response (200):**
```json
{
  "success": true,
  "plans": [
    {
      "id": "plan_1",
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
    }
  ]
}
```

### 3. Suporte a Planos Trimestrais

O modelo de planos foi atualizado para suportar três tipos:
- `monthly`: Plano mensal
- `quarterly`: Plano trimestral
- `annual`: Plano anual

### 4. Script de Seed

Execute o seguinte comando para popular o banco de dados com planos de exemplo:

```bash
node seed_plans.js
```

Isso criará automaticamente os 3 planos:
- **Plano Mensal**: 500 MZN
- **Plano Trimestral**: 1350 MZN (15% desconto)
- **Plano Anual**: 4800 MZN (20% desconto)

## Como Testar

### 1. Popular os Planos
```bash
node seed_plans.js
```

### 2. Iniciar o Servidor
```bash
npm start
```

### 3. Testar Endpoints

**Listar Planos (público):**
```bash
curl http://localhost:3000/api/plans
```

**Obter Subscrição (requer autenticação):**
```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
     http://localhost:3000/api/subscriptions
```

**Criar Subscrição:**
```bash
curl -X POST \
     -H "Authorization: Bearer SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"plan":"monthly"}' \
     http://localhost:3000/api/subscriptions
```

## Notas Importantes

1. **Autenticação**: Todas as rotas de `/api/subscriptions` exigem token JWT
2. **CORS**: Configurado para aceitar requisições de qualquer origem (*)
3. **Formato de Datas**: Todas as datas estão em formato ISO 8601
4. **Preços**: Em MZN (meticais moçambicanos)

## Solução de Problemas

Se continuar recebendo erro 404 OPTIONS:

1. Verifique se o servidor está rodando
2. Confirme que o CORS está habilitado
3. Verifique se a URL está correta no Flutter
4. Use ferramentas como Postman/Insomnia para testar manualmente
