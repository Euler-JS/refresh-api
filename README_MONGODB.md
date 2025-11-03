# API com MongoDB

Esta API foi migrada de Excel para MongoDB usando Mongoose.

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- MongoDB instalado localmente OU conta no MongoDB Atlas

## 🚀 Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure suas credenciais:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/refresh-api
JWT_SECRET=seu_jwt_secret_muito_seguro
```

### 3. MongoDB Local (Opção 1)

Se estiver usando MongoDB local:

1. Certifique-se de que o MongoDB está instalado
2. Inicie o serviço MongoDB:
   ```bash
   brew services start mongodb-community
   # ou
   mongod
   ```
3. Use a URI: `mongodb://localhost:27017/refresh-api`

### 4. MongoDB Atlas (Opção 2)

Se estiver usando MongoDB Atlas (cloud):

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster
4. Configure o acesso de rede (IP whitelist)
5. Obtenha a connection string
6. Use a URI: `mongodb+srv://username:password@cluster.mongodb.net/refresh-api?retryWrites=true&w=majority`

## 🏃 Executar o projeto

### Modo desenvolvimento

```bash
npm run dev
```

### Modo produção

```bash
npm start
```

## 📝 Estrutura do Banco de Dados

### Coleção: Users

```javascript
{
  _id: ObjectId,
  username: String,
  email: String (único),
  password: String (hash bcrypt),
  status: String ('active', 'inactive', 'suspended'),
  createdAt: Date,
  updatedAt: Date
}
```

### Coleção: Subscriptions

```javascript
{
  _id: ObjectId,
  userId: ObjectId (referência para User),
  plan: String ('monthly', 'annual'),
  startDate: Date,
  endDate: Date,
  status: String ('active', 'expired', 'cancelled'),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 Endpoints da API

### Usuários

#### Registrar usuário
```bash
POST /api/users/register
Content-Type: application/json

{
  "username": "joao",
  "email": "joao@example.com",
  "password": "123456"
}
```

#### Login
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "123456"
}
```

#### Obter perfil (requer autenticação)
```bash
GET /api/users/profile
Authorization: Bearer {seu_token_jwt}
```

### Subscrições

#### Obter subscrição (requer autenticação)
```bash
GET /api/subscriptions
Authorization: Bearer {seu_token_jwt}
```

#### Criar subscrição (requer autenticação)
```bash
POST /api/subscriptions
Authorization: Bearer {seu_token_jwt}
Content-Type: application/json

{
  "plan": "monthly"
}
```

#### Renovar subscrição (requer autenticação)
```bash
PUT /api/subscriptions/:subscriptionId/renew
Authorization: Bearer {seu_token_jwt}
```

## 🧪 Testar a API

### 1. Registrar um usuário

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"joao","email":"joao@example.com","password":"123456"}'
```

### 2. Fazer login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"123456"}'
```

Copie o token retornado.

### 3. Criar uma subscrição

```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"plan":"monthly"}'
```

### 4. Verificar perfil

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🔧 Principais mudanças na migração

1. **Removido**: Google Sheets API e excelService
2. **Adicionado**: Mongoose e MongoDB
3. **Criados**: Modelos User e Subscription
4. **Atualizado**: Controllers para usar modelos Mongoose
5. **Adicionado**: Arquivo de configuração do banco de dados

## 📚 Recursos úteis

- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## ⚠️ Notas importantes

- O campo `password` é automaticamente excluído das respostas através do método `toJSON()` no modelo User
- As datas são gerenciadas automaticamente pelo Mongoose através do `timestamps: true`
- Certifique-se de nunca commitar o arquivo `.env` com suas credenciais reais
