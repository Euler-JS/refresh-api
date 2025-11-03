# API Google Sheets

Esta é uma API que utiliza Google Sheets como base de dados para cadastro de usuários e controle de subscrição.

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