# Refresh API - Sistema de Subscrições com Pagamentos

API completa para gerenciamento de usuários, subscrições e pagamentos integrada com PaySuite.

## 🚀 Recursos

- ✅ Autenticação JWT
- ✅ Gerenciamento de usuários
- ✅ Sistema de planos (Mensal, Trimestral, Anual)
- ✅ Subscrições com pagamento via PaySuite
- ✅ Callbacks automáticos de confirmação de pagamento
- ✅ Integração com MongoDB
- ✅ CORS configurado para Flutter/Mobile

## 📋 Documentação

### Backend (API)
- **[INTEGRACAO_PAGAMENTOS.md](INTEGRACAO_PAGAMENTOS.md)** - Fluxo completo de pagamentos
- **[ROTAS_PAGAMENTOS.md](ROTAS_PAGAMENTOS.md)** - API de pagamentos PaySuite
- **[RESUMO_INTEGRACAO.md](RESUMO_INTEGRACAO.md)** - Resumo executivo da implementação
- **[AJUSTES_FLUTTER.md](AJUSTES_FLUTTER.md)** - Ajustes de CORS e formato de dados

### Frontend (Flutter)
- **[GUIA_FLUTTER_PAGAMENTO.md](GUIA_FLUTTER_PAGAMENTO.md)** - 📱 Guia completo de integração Flutter
- **[FLUTTER_EXEMPLO_MINIMO.md](FLUTTER_EXEMPLO_MINIMO.md)** - ⚡ Quick start - Exemplo mínimo
- **[FLUTTER_FAQ.md](FLUTTER_FAQ.md)** - ❓ Perguntas frequentes e troubleshooting
- **[FLUTTER_INTEGRATION.md](FLUTTER_INTEGRATION.md)** - Modelos de dados e exemplos de código

## ⚙️ Configuração

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure o MongoDB

Opção A - MongoDB Local:
```bash
# Instale o MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Inicie o MongoDB
brew services start mongodb-community
```

Opção B - MongoDB Atlas (Cloud):
1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster gratuito
3. Obtenha a connection string

### 3. Configure o PaySuite

1. Acesse [PaySuite](https://paysuite.tech)
2. Crie uma conta e obtenha seu token de API
3. Guarde o token para configuração

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Edite o `.env`:
```env
# Servidor
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/refresh-api

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# PaySuite
PAYSUITE_BASE_URL=https://paysuite.tech/api/v1
PAYSUITE_TOKEN=seu_token_paysuite_aqui

# URLs
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### 5. Popule os planos no banco de dados

```bash
node seed_plans.js
```

Isso criará 3 planos:
- **Mensal**: 500 MZN
- **Trimestral**: 1.350 MZN
- **Anual**: 4.800 MZN

### 6. Execute o servidor

```bash
npm start
```

## 📍 Endpoints Principais

### Autenticação

**POST** `/api/users/register` - Registrar usuário
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@example.com","password":"123456"}'
```

**POST** `/api/users/login` - Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"123456"}'
```

### Planos

**GET** `/api/plans` - Listar planos (público)
```bash
curl http://localhost:3000/api/plans
```

### Subscrições com Pagamento

**POST** `/api/subscriptions` - Criar subscrição (inicia pagamento)
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"plan":"monthly"}'
```

**GET** `/api/subscriptions` - Obter subscrição ativa
```bash
curl http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer SEU_TOKEN"
```

**GET** `/api/subscriptions/:id/payment-status` - Verificar status do pagamento
```bash
curl http://localhost:3000/api/subscriptions/SUBSCRIPTION_ID/payment-status \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🧪 Testes

Execute o script de teste completo:

```bash
node test_subscription_payment.js
```

Este script testa:
1. ✅ Login/Registro de usuário
2. ✅ Listagem de planos
3. ✅ Criação de subscrição com pagamento
4. ✅ Verificação de status
5. ✅ Simulação de callback (apenas dev)

## 🌐 Desenvolvimento Local com ngrok

Para testar callbacks do PaySuite localmente:

```bash
# Terminal 1 - API
npm start

# Terminal 2 - ngrok
ngrok http 3000
```

Atualize o `.env` com a URL do ngrok:
```env
API_URL=https://abc123.ngrok-free.app
```

## 📊 Fluxo de Pagamento

```
Usuário solicita subscrição
         ↓
API cria subscrição (status: pending_payment)
         ↓
API cria pagamento no PaySuite
         ↓
Retorna checkout_url para usuário
         ↓
Usuário completa pagamento no PaySuite
         ↓
PaySuite envia callback para API
         ↓
API ativa subscrição (status: active)
```

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT (expira em 24h)
- ✅ CORS configurado
- ✅ Validação de dados de entrada
- ✅ Callbacks verificados

## 🐛 Troubleshooting

### Erro ao conectar MongoDB
```bash
# Verifique se o MongoDB está rodando
brew services list

# Inicie se necessário
brew services start mongodb-community
```

### Callback não recebido
- Use ngrok para expor a API
- Verifique logs do servidor
- Confirme URL de callback no PaySuite

### Erro ao criar pagamento
- Verifique se `PAYSUITE_TOKEN` está correto
- Confirme que PaySuite está operacional
- Veja logs para detalhes do erro

## 📝 Estrutura do Banco de Dados

### Collection: users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hash),
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: subscriptions
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  plan: String, // 'monthly', 'quarterly', 'annual'
  startDate: Date,
  endDate: Date,
  status: String, // 'pending_payment', 'active', 'expired', 'cancelled'
  paymentId: String,
  paymentReference: String,
  paymentStatus: String, // 'pending', 'paid', 'failed', 'cancelled'
  checkoutUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: plans
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  price: Number,
  features: [String],
  type: String, // 'monthly', 'quarterly', 'annual'
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 📦 Dependências Principais

- `express` - Framework web
- `mongoose` - ODM para MongoDB
- `jsonwebtoken` - Autenticação JWT
- `bcryptjs` - Criptografia de senhas
- `axios` - Cliente HTTP (PaySuite)
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Variáveis de ambiente
- `moment` - Manipulação de datas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🆘 Suporte

Para questões e suporte:
- Abra uma issue no GitHub
- Consulte a documentação em `/docs`
- Email: suporte@exemplo.com

## Configuração

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure o Google Cloud Project

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Sheets API**
4. Vá para "Credenciais" e crie uma **Conta de Serviço**
5. Baixe o arquivo JSON de credenciais
6. Renomeie o arquivo para `credentials.json` e coloque na raiz do projeto

### 3. Configure o Google Sheets

1. Crie um novo Google Sheets
2. Crie duas abas/planilhas:
   - **Users** com cabeçalhos: `ID | Username | Email | Password | Created At | Status`
   - **Subscriptions** com cabeçalhos: `ID | User ID | Plan | Start Date | End Date | Status`
3. Copie o ID da planilha da URL (parte entre `/d/` e `/edit`):
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```
4. **Compartilhe a planilha** com o email da conta de serviço (encontrado no arquivo `credentials.json` no campo `client_email`) com permissão de **Editor**

### 4. Configure o arquivo `.env`

```env
PORT=3000
JWT_SECRET=seu_segredo_muito_seguro_aqui
SPREADSHEET_ID=seu_id_do_google_sheets
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

### 5. Execute o servidor
```bash
npm start
```

## Endpoints

### Usuários
- `POST /api/users/register` - Registrar usuário
  ```bash
  curl -X POST http://localhost:3000/api/users/register \
    -H "Content-Type: application/json" \
    -d '{"username":"joao","email":"joao@example.com","password":"123456"}'
  ```

- `POST /api/users/login` - Login
  ```bash
  curl -X POST http://localhost:3000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"joao@example.com","password":"123456"}'
  ```

- `GET /api/users/profile` - Perfil do usuário (autenticado)
  ```bash
  curl -X GET http://localhost:3000/api/users/profile \
    -H "Authorization: Bearer SEU_TOKEN"
  ```

### Subscrições
- `GET /api/subscriptions` - Obter subscrição ativa (autenticado)
- `POST /api/subscriptions` - Criar subscrição (autenticado)
  ```bash
  curl -X POST http://localhost:3000/api/subscriptions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer SEU_TOKEN" \
    -d '{"plan":"monthly"}'
  ```

- `PATCH /api/subscriptions/:subscriptionId/renew` - Renovar subscrição (autenticado)

### Status
- `GET /api/status` - Verificar status da API

## Estrutura do Google Sheets

### Planilha "Users"
| ID | Username | Email | Password | Created At | Status |
|----|----------|-------|----------|------------|--------|
| 1  | joao     | joao@example.com | $2a$10$... | 2025-11-03T... | active |

### Planilha "Subscriptions"
| ID | User ID | Plan | Start Date | End Date | Status |
|----|---------|------|------------|----------|--------|
| 1  | 1       | monthly | 2025-11-03T... | 2025-12-03T... | active |

## Notas Importantes

- As senhas são criptografadas com bcrypt
- Tokens JWT expiram em 24 horas
- Certifique-se de compartilhar a planilha com a conta de serviço
- Não commite o arquivo `credentials.json` no Git (já está no .gitignore)