# API Excel Online

Esta é uma API que utiliza Excel Online como base de dados para cadastro de usuários e controle de subscrição.

## Configuração

1. Instale as dependências: `npm install`
2. Configure o arquivo `.env` com suas credenciais do Microsoft App e o ID do arquivo Excel.
3. Execute: `npm start`

## Estrutura do Excel

Certifique-se de que o arquivo Excel tenha as seguintes planilhas:
- `Users`: Colunas A (ID), B (Name), C (Email), D (Password)
- `Subscriptions`: Colunas A (ID), B (UserID), C (Plan), D (Date)

## Endpoints

### Usuários
- `POST /api/users/register` - Registrar usuário
- `POST /api/users/login` - Login

### Subscrições
- `GET /api/subscriptions` - Listar subscrições (autenticado)
- `POST /api/subscriptions` - Adicionar subscrição (autenticado)