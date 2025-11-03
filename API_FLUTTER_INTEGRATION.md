# Integração API - Flutter

## Formato de Respostas da API

A API agora retorna respostas padronizadas para o Flutter com os seguintes campos:

```json
{
  "message": "Descrição da operação",
  "token": "JWT_TOKEN_STRING",
  "userId": "ID_COMO_STRING"
}
```

## Endpoints de Autenticação

### 1. POST /api/users/register
**Registrar novo usuário**

**Request:**
```json
{
  "username": "joao",
  "email": "joao@example.com",
  "password": "123456"
}
```

**Response (201):**
```json
{
  "message": "Usuário registrado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzg5MGFiY2RlZjEyMzQ1NjciLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3MzAyODA0MDB9.abc123...",
  "userId": "67890abcdef123456"
}
```

**Possíveis Erros:**
- `400` - Email já está em uso
- `500` - Erro ao registrar usuário

---

### 2. POST /api/users/login
**Fazer login**

**Request:**
```json
{
  "email": "joao@example.com",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzg5MGFiY2RlZjEyMzQ1NjciLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3MzAyODA0MDB9.abc123...",
  "userId": "67890abcdef123456"
}
```

**Possíveis Erros:**
- `401` - Credenciais inválidas (email ou senha incorretos)
- `500` - Erro ao realizar login

---

### 3. GET /api/users/profile
**Obter perfil do usuário autenticado**

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response (200):**
```json
{
  "_id": "67890abcdef123456",
  "username": "joao",
  "email": "joao@example.com",
  "status": "active",
  "createdAt": "2025-11-03T10:00:00.000Z",
  "updatedAt": "2025-11-03T10:00:00.000Z"
}
```

**Possíveis Erros:**
- `401` - Sem autorização
- `404` - Usuário não encontrado
- `500` - Erro ao buscar perfil

---

## Mudanças Implementadas

### ✅ Login e Register Agora Retornam:
- `message` (String) - Mensagem de resposta
- `token` (String) - Token JWT para autenticação
- `userId` (String) - ID do usuário como string

### ✅ Conversão de ID
- O `userId` agora é convertido para string usando `.toString()` para evitar erros de tipo no Flutter

### ✅ Fluxo de Autenticação
1. Usuário faz login/register
2. API retorna `token` e `userId`
3. Flutter armazena ambos no `SharedPreferences`
4. Token é usado no header `Authorization: Bearer {token}` para requisições autenticadas

---

## Testando os Endpoints

### Registrar
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "joao",
    "email": "joao@example.com",
    "password": "123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "123456"
  }'
```

### Perfil (com autenticação)
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer {SEU_TOKEN_AQUI}" \
  -H "Content-Type: application/json"
```

---

## Variáveis de Ambiente Necessárias

No arquivo `.env`, certifique-se de ter:
```
PORT=3000
NODE_ENV=development
JWT_SECRET=seu_segredo_muito_seguro_aqui
MONGODB_URI=mongodb+srv://usuario:senha@seu-cluster.mongodb.net/refresh-api?retryWrites=true&w=majority
```

---

## Status Codes Esperados

- `200` - OK (Login bem-sucedido, requisição GET bem-sucedida)
- `201` - Created (Registro bem-sucedido)
- `400` - Bad Request (Dados inválidos, email em uso)
- `401` - Unauthorized (Credenciais inválidas, token inválido)
- `404` - Not Found (Usuário não encontrado)
- `500` - Internal Server Error (Erro no servidor)

