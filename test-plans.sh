#!/bin/bash

echo "=== Testando Rotas de Planos ==="
echo ""

# Testar GET /api/plans (listar todos os planos)
echo "1. Listando todos os planos disponíveis (GET /api/plans)..."
PLANS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/plans \
  -H "Content-Type: application/json")

echo "$PLANS_RESPONSE" | jq .
echo ""

# Obter ID do primeiro plano
PLAN_ID=$(echo "$PLANS_RESPONSE" | jq -r '.plans[0].id')

if [ "$PLAN_ID" != "null" ] && [ -n "$PLAN_ID" ]; then
  echo "✅ Planos encontrados. Primeiro plano ID: $PLAN_ID"
  echo ""
  
  # Testar GET /api/plans/:id (obter plano específico)
  echo "2. Obtendo detalhes do plano específico (GET /api/plans/$PLAN_ID)..."
  PLAN_DETAIL=$(curl -s -X GET http://localhost:3000/api/plans/$PLAN_ID \
    -H "Content-Type: application/json")
  
  echo "$PLAN_DETAIL" | jq .
  echo ""
else
  echo "⚠️  Nenhum plano encontrado"
fi

echo "=== Testes de Planos Concluídos ==="
