const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const getGoogleSheetsClient = () => {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json';
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(credentialsPath)) {
    console.error(`❌ Arquivo de credenciais não encontrado: ${credentialsPath}`);
    console.error('📋 Siga os passos no README.md para configurar as credenciais do Google');
    throw new Error('Credenciais do Google não configuradas. Veja README.md para instruções.');
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

module.exports = { getGoogleSheetsClient };