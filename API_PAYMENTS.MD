{
"variable": [
{
"id": "baseUrl",
"key": "baseUrl",
"type": "string",
"name": "string",
"value": "https://paysuite.tech"
}
],
"info": {
"name": "PaySuite",
"_postman_id": "3c6e4bb8-c90b-4977-afa8-abdd2133d216",
"description": "",
"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
},
"item": [
{
"name": "Payment Requests",
"description": "\nAPIs for managing payment requests",
"item": [
{
"name": "Create Payment Request",
"request": {
"url": {
"host": "{{baseUrl}}",
"path": "api/v1/payments",
"query": [],
"raw": "{{baseUrl}}/api/v1/payments"
},
"method": "POST",
"header": [
{
"key": "Content-Type",
"value": "application/json"
},
{
"key": "Accept",
"value": "application/json"
}
],
"body": {
"mode": "raw",
"raw": "{\"amount\":\"100.50\",\"reference\":\"INV2024001\",\"description\":\"Payment for invoice INV2024001\",\"return_url\":\"https:\\/\\/example.com\\/success\",\"callback_url\":\"http:\\/\\/nolan.net\\/velit-aut-maiores-odit-laborum-repellat-totam-repellendus-et.html\"}"
},
"description": "Creates a new payment request in the system."
},
"response": [
{
"header": [],
"code": 201,
"body": "{\n    \"status\": \"success\",\n    \"data\": {\n        \"id\": \"550e8400-e29b-41d4-a716-446655440000\",\n        \"amount\": 100.50,\n        \"reference\": \"INV2024001\",\n        \"status\": \"pending\",\n        \"checkout_url\": \"https://paysuite.test/checkout/550e8400-e29b-41d4-a716-446655440000\"\n    }\n}",
"name": ""
},
{
"header": [],
"code": 422,
"body": "{\n    \"status\": \"error\",\n    \"message\": \"Invalid input\"\n}",
"name": ""
}
]
},
{
"name": "Get Payment Request",
"request": {
"url": {
"host": "{{baseUrl}}",
"path": "api/v1/payments/:uuid",
"query": [],
"raw": "{{baseUrl}}/api/v1/payments/:uuid",
"variable": [
{
"id": "uuid",
"key": "uuid",
"value": "550e8400-e29b-41d4-a716-446655440000",
"description": "UUID of the payment request."
}
]
},
"method": "GET",
"header": [
{
"key": "Content-Type",
"value": "application/json"
},
{
"key": "Accept",
"value": "application/json"
}
],
"body": null,
"description": "Returns the details of a specific payment request."
},
"response": [
{
"header": [],
"code": 200,
"body": "{\n    \"status\": \"success\",\n    \"data\": {\n        \"id\": \"550e8400-e29b-41d4-a716-446655440000\",\n        \"amount\": 100.50,\n        \"reference\": \"INV2024001\",\n        \"status\": \"paid\",\n        \"transaction\": {\n            \"id\": 1,\n            \"status\": \"completed\",\n            \"transaction_id\": \"MPESA123456\",\n            \"paid_at\": \"2024-02-10T10:15:00.000000Z\"\n        }\n    }\n}",
"name": ""
},
{
"header": [],
"code": 404,
"body": "{\n    \"status\": \"error\",\n    \"message\": \"Payment request not found.\"\n}",
"name": ""
}
]
}
]
}
],
"auth": {
"type": "bearer",
"bearer": [
{
"key": "key",
"type": "string"
}
]
}
}