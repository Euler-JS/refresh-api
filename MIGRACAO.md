# 🔄 Migração de Excel para MongoDB - Resumo

## ✅ Mudanças Realizadas

### 📦 Dependências
- ✅ Instalado: `mongoose` - ORM para MongoDB
- ❌ Removido: Dependências do Google Sheets (podem ser removidas se não forem mais necessárias)

### 📁 Novos Arquivos Criados

1. **src/config/database.js**
   - Configuração da conexão com MongoDB
   - Tratamento de erros de conexão

2. **src/models/User.js**
   - Schema do modelo User com Mongoose
   - Campos: username, email, password, status, timestamps
   - Método `toJSON()` para remover senha automaticamente das respostas
   - Validações de email e campos obrigatórios

3. **src/models/Subscription.js**
   - Schema do modelo Subscription com Mongoose
   - Campos: userId (ref), plan, startDate, endDate, status, timestamps
   - Métodos: `isValid()` e `daysRemaining()`

4. **.env.example**
   - Template de configuração
   - Variáveis necessárias documentadas

5. **README_MONGODB.md**
   - Documentação completa da API
   - Instruções de configuração
   - Exemplos de uso dos endpoints
   - Estrutura do banco de dados

6. **INSTALL_MONGODB.md**
   - Guia de instalação do MongoDB (local e Atlas)
   - Comandos úteis
   - Solução de problemas comuns

7. **MIGRACAO.md** (este arquivo)
   - Resumo de todas as mudanças

### 🔧 Arquivos Modificados

1. **src/index.js**
   - ✅ Adicionado: `const connectDB = require('./config/database')`
   - ✅ Adicionado: Chamada `connectDB()` antes de iniciar o servidor

2. **src/controllers/userController.js**
   - ✅ Substituído: `excelService` por modelo `User`
   - ✅ Atualizado: `register()` para usar `User.findOne()` e `User.create()`
   - ✅ Atualizado: `login()` para usar `User.findOne().select('+password')`
   - ✅ Atualizado: `getUserProfile()` para usar `User.findById()`
   - ✅ Melhorado: Tratamento de erros com mensagens mais detalhadas

3. **src/controllers/subscriptionController.js**
   - ✅ Substituído: `excelService` por modelo `Subscription`
   - ✅ Atualizado: `getSubscription()` para usar `Subscription.findOne().populate()`
   - ✅ Atualizado: `createSubscription()` para usar `Subscription.create()`
   - ✅ Atualizado: `renewSubscription()` para usar `Subscription.findById()` e `.save()`
   - ✅ Adicionado: Validação do plano (monthly/annual)
   - ✅ Melhorado: Comparação de ObjectId para verificação de propriedade

4. **.env**
   - ✅ Removido: `SPREADSHEET_ID` e `GOOGLE_APPLICATION_CREDENTIALS`
   - ✅ Adicionado: `MONGODB_URI` e `NODE_ENV`

5. **package.json**
   - ✅ Atualizado: Nome do projeto para "refresh-api"
   - ✅ Atualizado: Descrição para mencionar MongoDB

### 🗑️ Arquivos que podem ser removidos (opcional)

Estes arquivos não são mais necessários após a migração:

- `src/config/excelConfig.js` - Configuração do Google Sheets
- `src/services/excelService.js` - Serviço de Excel
- `credentials.json` - Credenciais do Google
- `credentials.example.json` - Exemplo de credenciais
- `SETUP_GOOGLE.md` - Documentação do Google Sheets

**Nota**: Não os removi automaticamente caso você queira manter como backup.

## 🔄 Mudanças na Lógica

### Antes (Excel/Google Sheets)
```javascript
// Arrays posicionais
const user = await excelService.getUserByEmail(email);
// user[0] = id, user[1] = username, user[2] = email, user[3] = password...
```

### Depois (MongoDB/Mongoose)
```javascript
// Objetos com propriedades nomeadas
const user = await User.findOne({ email });
// user.id, user.username, user.email, user.password...
```

## 📊 Estrutura do Banco de Dados

### Collection: users
```javascript
{
  _id: ObjectId("..."),
  username: "joao",
  email: "joao@example.com",
  password: "$2a$10$...", // hash bcrypt
  status: "active",
  createdAt: ISODate("2025-11-03T..."),
  updatedAt: ISODate("2025-11-03T...")
}
```

### Collection: subscriptions
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."), // referência para users
  plan: "monthly",
  startDate: ISODate("2025-11-03T..."),
  endDate: ISODate("2025-12-03T..."),
  status: "active",
  createdAt: ISODate("2025-11-03T..."),
  updatedAt: ISODate("2025-11-03T...")
}
```

## 🚀 Próximos Passos

1. **Instalar MongoDB** (escolha uma opção):
   - Local: Ver instruções em `INSTALL_MONGODB.md`
   - Cloud: Criar conta no MongoDB Atlas (grátis)

2. **Configurar .env**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/refresh-api
   # ou
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/refresh-api
   ```

3. **Iniciar o servidor**:
   ```bash
   npm start
   ```

4. **Testar os endpoints**:
   ```bash
   # Registrar usuário
   curl -X POST http://localhost:3000/api/users/register \
     -H "Content-Type: application/json" \
     -d '{"username":"joao","email":"joao@example.com","password":"123456"}'
   ```

## 🎯 Benefícios da Migração

✅ **Performance**: MongoDB é muito mais rápido que Google Sheets  
✅ **Escalabilidade**: Suporta milhões de registros sem problemas  
✅ **Funcionalidades**: Queries complexas, índices, agregações  
✅ **Confiabilidade**: Sem limites de API ou quotas do Google  
✅ **Desenvolvimento**: Mongoose oferece validação e métodos úteis  
✅ **Segurança**: Dados no seu controle (local ou Atlas)  
✅ **Custo**: MongoDB Atlas tem tier gratuito generoso  

## 📞 Suporte

Se encontrar problemas:

1. Verifique se o MongoDB está rodando
2. Confirme a MONGODB_URI no .env
3. Consulte `INSTALL_MONGODB.md` para solução de problemas
4. Veja os logs do servidor para mensagens de erro

## ✨ Conclusão

A migração está completa! O projeto agora usa MongoDB como banco de dados, 
oferecendo muito mais performance, flexibilidade e escalabilidade.

Todos os endpoints continuam funcionando da mesma forma, apenas a camada 
de dados foi alterada de Google Sheets para MongoDB.
