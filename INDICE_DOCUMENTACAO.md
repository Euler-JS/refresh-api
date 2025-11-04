# 📚 Índice da Documentação da API

## Documentação Completa das Rotas

Esta API fornece endpoints para gerenciamento de usuários, planos de subscrição e subscrições.

---

## 📄 Documentos Disponíveis

### 1. [ROTAS_PLANOS.md](./ROTAS_PLANOS.md) - Rotas de Planos
**Status:** ✅ Públicas (não requerem autenticação)

Documentação completa das rotas para consulta de planos de subscrição:
- `GET /api/plans` - Listar todos os planos disponíveis
- `GET /api/plans/:planId` - Obter detalhes de um plano específico
- `POST /api/plans` - Criar novo plano (admin)

**Ideal para:**
- Tela de seleção de planos no Flutter
- Exibir opções de preços antes do login
- Comparação de planos

---

### 2. [ROTAS_SUBSCRICAO.md](./ROTAS_SUBSCRICAO.md) - Rotas de Subscrição
**Status:** 🔒 Autenticadas (requerem Bearer Token)

Documentação completa das rotas para gerenciamento de subscrições:
- `GET /api/subscriptions` - Obter subscrição ativa do usuário
- `POST /api/subscriptions` - Criar nova subscrição
- `PATCH /api/subscriptions/:id/renew` - Renovar subscrição existente

**Ideal para:**
- Verificar status da subscrição do usuário
- Processar pagamentos e ativar subscrições
- Renovar subscrições próximas de expirar

---

## 🚀 Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` com:
```env
MONGODB_URI=sua_string_de_conexao_mongodb
JWT_SECRET=seu_segredo_jwt
PORT=3000
```

### 3. Popular Planos no Banco de Dados
```bash
npm run seed:plans
```

### 4. Iniciar Servidor
```bash
npm start
```

### 5. Testar Rotas

**Testar Planos:**
```bash
./test-plans.sh
```

**Testar Subscrições:**
```bash
./test-subscriptions.sh
```

---

## 📦 Estrutura do Projeto

```
refresh-api/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuração MongoDB
│   │   └── excelConfig.js       # Configuração Excel
│   ├── controllers/
│   │   ├── planController.js    # Lógica de planos
│   │   ├── subscriptionController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── auth.js              # Autenticação JWT
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Plan.js              # Schema de planos ✨ NOVO
│   │   ├── Subscription.js      # Schema de subscrições
│   │   └── User.js
│   ├── routes/
│   │   ├── planRoutes.js        # Rotas de planos ✨ NOVO
│   │   ├── subscriptionRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── excelService.js
│   └── index.js                 # Entry point
├── seedPlans.js                 # Script para popular planos ✨ NOVO
├── test-plans.sh                # Testes de planos ✨ NOVO
├── test-subscriptions.sh        # Testes de subscrições
├── ROTAS_PLANOS.md             # Documentação de planos ✨ NOVO
├── ROTAS_SUBSCRICAO.md         # Documentação de subscrições
├── INDICE_DOCUMENTACAO.md      # Este arquivo ✨ NOVO
└── package.json
```

---

## 🔐 Autenticação

### Obter Token JWT

Para usar as rotas de subscrição, você precisa primeiro fazer login:

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "sua_senha"
  }'
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "69091a922f231c8876665fb8"
}
```

### Usar o Token

Inclua o token em todas as requisições autenticadas:

```bash
curl -X GET http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📊 Resumo das Rotas

### Rotas Públicas (sem autenticação)

| Método | Rota | Descrição | Documentação |
|--------|------|-----------|--------------|
| `GET` | `/api/plans` | Listar planos | [ROTAS_PLANOS.md](./ROTAS_PLANOS.md#1-get-apiplans) |
| `GET` | `/api/plans/:id` | Detalhes do plano | [ROTAS_PLANOS.md](./ROTAS_PLANOS.md#2-get-apiplansplanid) |

### Rotas Autenticadas (requerem Bearer Token)

| Método | Rota | Descrição | Documentação |
|--------|------|-----------|--------------|
| `GET` | `/api/subscriptions` | Ver subscrição ativa | [ROTAS_SUBSCRICAO.md](./ROTAS_SUBSCRICAO.md#1-get-apisubscriptions) |
| `POST` | `/api/subscriptions` | Criar subscrição | [ROTAS_SUBSCRICAO.md](./ROTAS_SUBSCRICAO.md#2-post-apisubscriptions) |
| `PATCH` | `/api/subscriptions/:id/renew` | Renovar subscrição | [ROTAS_SUBSCRICAO.md](./ROTAS_SUBSCRICAO.md#3-patch-apisubscriptionssubscriptionidrenew) |

---

## 💰 Planos Disponíveis

Após executar `npm run seed:plans`, os seguintes planos estarão disponíveis:

### Plano Mensal
- **Preço:** MZN 230
- **Duração:** 30 dias
- **Características:**
  - Acesso a todas as funcionalidades
  - Suporte técnico por email
  - Atualizações gratuitas

### Plano Anual
- **Preço:** MZN 990
- **Duração:** 365 dias
- **Economia:** 2 meses grátis (vs. mensal)
- **Características:**
  - Acesso a todas as funcionalidades
  - Suporte técnico prioritário
  - Atualizações gratuitas
  - 2 meses grátis em comparação ao plano mensal

---

## 🧪 Testando a API

### Teste Completo - Fluxo de Subscrição

1. **Ver planos disponíveis** (público)
```bash
curl http://localhost:3000/api/plans
```

2. **Fazer login**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"senha"}'
```

3. **Verificar subscrição atual** (com token)
```bash
curl -X GET http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer SEU_TOKEN"
```

4. **Criar subscrição** (com token)
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"plan":"monthly"}'
```

5. **Renovar subscrição** (quando próximo de expirar)
```bash
curl -X PATCH http://localhost:3000/api/subscriptions/ID_DA_SUBSCRICAO/renew \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🔧 Integração com Flutter

### Configurar URL Base

No seu código Flutter, configure a URL base da API:

```dart
// Para desenvolvimento local (emulador Android)
const String API_URL = 'http://10.0.2.2:3000/api';

// Para desenvolvimento local (dispositivo físico, substitua pelo IP da sua máquina)
const String API_URL = 'http://192.168.1.X:3000/api';

// Para produção
const String API_URL = 'https://seu-dominio.com/api';
```

### Exemplo de Integração

```dart
// 1. Buscar planos (público)
final plansResponse = await http.get(
  Uri.parse('$API_URL/plans'),
  headers: {'Content-Type': 'application/json'},
);

// 2. Criar subscrição (autenticado)
final subscriptionResponse = await http.post(
  Uri.parse('$API_URL/subscriptions'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  },
  body: json.encode({'plan': 'monthly'}),
);
```

---

## 📝 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Iniciar servidor | `npm start` | Inicia a API em produção |
| Desenvolvimento | `npm run dev` | Inicia com nodemon (auto-reload) |
| Popular planos | `npm run seed:plans` | Adiciona planos padrão ao banco |
| Testar planos | `./test-plans.sh` | Testa rotas de planos |
| Testar subscrições | `./test-subscriptions.sh` | Testa rotas de subscrições |

---

## 🔒 Segurança

### Proteções Implementadas

- ✅ Autenticação JWT para rotas de subscrição
- ✅ Validação de propriedade (usuário só acessa suas próprias subscrições)
- ✅ Validação de tipos de plano
- ✅ Proteção contra múltiplas subscrições ativas
- ✅ CORS configurado
- ✅ Sanitização de dados de entrada

### Recomendações para Produção

- 🔐 Proteger `POST /api/plans` com autenticação de admin
- 🔐 Usar HTTPS em produção
- 🔐 Implementar rate limiting
- 🔐 Adicionar validação de CVE em dependências
- 🔐 Configurar variáveis de ambiente corretamente
- 🔐 Implementar logs de auditoria

---

## 📞 Suporte

### Problemas Comuns

**MongoDB não conecta:**
- Verifique a string de conexão no `.env`
- Confirme que o MongoDB está rodando
- Verifique permissões de rede/firewall

**Token inválido:**
- Verifique se o token não expirou
- Confirme que está usando o formato: `Bearer TOKEN`
- Verifique se `JWT_SECRET` está configurado

**Planos não aparecem:**
- Execute `npm run seed:plans`
- Verifique logs do servidor
- Teste com `curl http://localhost:3000/api/plans`

---

## 📚 Recursos Adicionais

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [Mongoose Docs](https://mongoosejs.com/docs/)

---

**Última Atualização:** 04/11/2025  
**Versão da API:** 1.0.0  
**Maintainer:** Euler-JS
