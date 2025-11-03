# 🚀 Guia Rápido: Configuração Google Sheets API

## Passo 1: Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com
2. Clique em "Selecionar projeto" → "Novo Projeto"
3. Nome: `refresh-api` (ou outro nome)
4. Clique em "Criar"

## Passo 2: Ativar Google Sheets API

1. No menu lateral, vá em "APIs e serviços" → "Biblioteca"
2. Busque por "Google Sheets API"
3. Clique em "Ativar"

## Passo 3: Criar Conta de Serviço

1. No menu lateral, vá em "APIs e serviços" → "Credenciais"
2. Clique em "+ CRIAR CREDENCIAIS" → "Conta de serviço"
3. Preencha:
   - Nome: `refresh-api-service`
   - ID: (gerado automaticamente)
   - Descrição: `Conta para acessar Google Sheets`
4. Clique em "Criar e Continuar"
5. Selecione função: "Editor" ou "Proprietário"
6. Clique em "Continuar" → "Concluir"

## Passo 4: Baixar Credenciais JSON

1. Na lista de contas de serviço, clique na conta que você criou
2. Vá na aba "Chaves"
3. Clique em "Adicionar chave" → "Criar nova chave"
4. Selecione tipo: **JSON**
5. Clique em "Criar"
6. O arquivo será baixado automaticamente
7. **Renomeie o arquivo para `credentials.json`**
8. **Mova para a raiz do projeto** (pasta `refresh-api/`)

## Passo 5: Configurar Google Sheets

1. Crie um novo Google Sheets: https://docs.google.com/spreadsheets
2. Crie duas abas (planilhas):
   - **Users**
   - **Subscriptions**

### Aba "Users" - Adicione os cabeçalhos na primeira linha:
```
ID | Username | Email | Password | Created At | Status
```

### Aba "Subscriptions" - Adicione os cabeçalhos na primeira linha:
```
ID | User ID | Plan | Start Date | End Date | Status
```

## Passo 6: Compartilhar Planilha

1. Abra o arquivo `credentials.json`
2. Copie o email que está no campo `client_email` (algo como: `refresh-api-service@projeto.iam.gserviceaccount.com`)
3. Na sua planilha do Google Sheets, clique em "Compartilhar"
4. Cole o email da conta de serviço
5. **Dê permissão de "Editor"**
6. Desmarque "Notificar pessoas"
7. Clique em "Compartilhar"

## Passo 7: Obter ID da Planilha

Na URL da sua planilha, copie o ID:
```
https://docs.google.com/spreadsheets/d/ESTE_É_O_ID/edit
                                        ^^^^^^^^^^^^
```

## Passo 8: Configurar .env

Edite o arquivo `.env` e adicione:
```env
SPREADSHEET_ID=cole_aqui_o_id_da_planilha
```

## Passo 9: Testar

```bash
npm start
```

Se tudo estiver correto, você verá:
```
Server will start on port: 3000
Server running on port 3000
```

## Teste a API

```bash
# Registrar usuário
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"joao","email":"joao@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"123456"}'
```

## ⚠️ Problemas Comuns

### "Credentials file not found"
- Certifique-se que `credentials.json` está na raiz do projeto
- Verifique se o nome do arquivo está correto (sem espaços)

### "Permission denied"
- Compartilhe a planilha com o email da conta de serviço
- Dê permissão de "Editor"

### "Spreadsheet not found"
- Verifique se o ID no `.env` está correto
- Certifique-se que a planilha foi compartilhada

## 📁 Estrutura Final

```
refresh-api/
├── credentials.json          ← Arquivo de credenciais
├── .env                      ← SPREADSHEET_ID configurado
├── src/
└── ...
```
