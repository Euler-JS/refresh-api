# Guia de Instalação do MongoDB (macOS)

## Opção 1: MongoDB Local (Recomendado para desenvolvimento)

### 1. Instalar MongoDB via Homebrew

```bash
# Adicionar o tap do MongoDB
brew tap mongodb/brew

# Instalar MongoDB Community Edition
brew install mongodb-community
```

### 2. Iniciar o serviço MongoDB

```bash
# Iniciar e configurar para iniciar automaticamente
brew services start mongodb-community

# OU iniciar apenas uma vez (sem auto-start)
mongod --config /opt/homebrew/etc/mongod.conf
```

### 3. Verificar se está rodando

```bash
# Conectar ao MongoDB shell
mongosh

# Ou verificar o processo
ps aux | grep mongod
```

### 4. Configurar a URI no .env

```env
MONGODB_URI=mongodb://localhost:27017/refresh-api
```

## Opção 2: MongoDB Atlas (Cloud - Grátis)

### 1. Criar conta no MongoDB Atlas

- Acesse: https://www.mongodb.com/cloud/atlas/register
- Crie uma conta gratuita

### 2. Criar um Cluster

1. Clique em "Build a Database"
2. Escolha "FREE" (M0)
3. Selecione uma região próxima (ex: aws/us-east-1)
4. Clique em "Create"

### 3. Configurar acesso

1. **Database Access**:
   - Clique em "Database Access" no menu lateral
   - Clique em "Add New Database User"
   - Username: `admin`
   - Password: `suaSenhaSegura123` (anote essa senha!)
   - Database User Privileges: "Read and write to any database"
   - Clique em "Add User"

2. **Network Access**:
   - Clique em "Network Access" no menu lateral
   - Clique em "Add IP Address"
   - Clique em "Allow Access from Anywhere" (0.0.0.0/0)
   - Clique em "Confirm"

### 4. Obter Connection String

1. Clique em "Database" no menu lateral
2. Clique em "Connect" no seu cluster
3. Escolha "Connect your application"
4. Driver: Node.js, Version: 5.5 or later
5. Copie a connection string

### 5. Configurar a URI no .env

```env
MONGODB_URI=mongodb+srv://admin:suaSenhaSegura123@cluster0.xxxxx.mongodb.net/refresh-api?retryWrites=true&w=majority
```

**Importante**: Substitua:
- `admin` pelo seu username
- `suaSenhaSegura123` pela sua senha
- `cluster0.xxxxx` pelo endereço do seu cluster
- `refresh-api` pelo nome do seu database

## Comandos úteis do MongoDB

### Conectar ao MongoDB local

```bash
mongosh
```

### Ver databases

```javascript
show dbs
```

### Usar um database

```javascript
use refresh-api
```

### Ver coleções

```javascript
show collections
```

### Ver todos os usuários

```javascript
db.users.find()
```

### Ver todas as subscrições

```javascript
db.subscriptions.find()
```

### Limpar uma coleção

```javascript
db.users.deleteMany({})
db.subscriptions.deleteMany({})
```

## Testar a conexão

Depois de configurar, reinicie o servidor:

```bash
npm start
```

Você deve ver:
```
Server will start on port: 3000
MongoDB conectado: localhost
Server running on port 3000
```

Se ver a mensagem "MongoDB conectado", está tudo funcionando! 🎉

## Solução de Problemas

### Erro: "MongooseServerSelectionError: connect ECONNREFUSED"

- **Causa**: MongoDB não está rodando
- **Solução**: Inicie o serviço MongoDB
  ```bash
  brew services start mongodb-community
  ```

### Erro: "MongooseServerSelectionError: bad auth"

- **Causa**: Credenciais incorretas no MongoDB Atlas
- **Solução**: Verifique username e senha na connection string

### Erro: "MongooseServerSelectionError: Could not connect to any servers"

- **Causa**: IP não está na whitelist do MongoDB Atlas
- **Solução**: Adicione 0.0.0.0/0 no Network Access do Atlas
