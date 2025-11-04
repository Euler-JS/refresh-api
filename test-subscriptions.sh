#!/bin/bash

echo "=== Testando Rotas de Subscrição ==="
echo ""

# Fazer login para obter token
echo "1. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao3@example.com","password":"123456"}')

echo "$LOGIN_RESPONSE" | jq .

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erro ao fazer login. Token não obtido."
  exit 1
fi

echo "✅ Token obtido: ${TOKEN:0:20}..."
echo ""

# Testar GET /api/subscriptions (pode retornar 404 se não houver subscrição)
echo "2. Verificando subscrição existente (GET /api/subscriptions)..."
GET_RESPONSE=$(curl -s -X GET http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$GET_RESPONSE" | jq .
echo ""

# Testar POST /api/subscriptions (criar nova subscrição)
echo "3. Criando nova subscrição mensal (POST /api/subscriptions)..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan":"monthly"}')

echo "$CREATE_RESPONSE" | jq .
echo ""

# Obter ID da subscrição criada
SUBSCRIPTION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.subscription._id')

if [ "$SUBSCRIPTION_ID" != "null" ] && [ -n "$SUBSCRIPTION_ID" ]; then
  echo "✅ Subscrição criada com ID: $SUBSCRIPTION_ID"
  echo ""
  
  # Testar GET novamente
  echo "4. Verificando subscrição criada (GET /api/subscriptions)..."
  GET_RESPONSE2=$(curl -s -X GET http://localhost:3000/api/subscriptions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$GET_RESPONSE2" | jq .
  echo ""
  
  # Testar PATCH /api/subscriptions/:id/renew
  echo "5. Renovando subscrição (PATCH /api/subscriptions/$SUBSCRIPTION_ID/renew)..."
  RENEW_RESPONSE=$(curl -s -X PATCH http://localhost:3000/api/subscriptions/$SUBSCRIPTION_ID/renew \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$RENEW_RESPONSE" | jq .
  echo ""
else
  echo "⚠️  Não foi possível obter ID da subscrição (pode já existir uma ativa)"
fi

echo "=== Testes Concluídos ==="
