const axios = require('axios');

const getAccessToken = async () => {
  const response = await axios.post(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });
  return response.data.access_token;
};

const getClient = async () => {
  const token = await getAccessToken();
  const { Client } = require('@microsoft/microsoft-graph-client');
  require('isomorphic-fetch');
  const client = Client.init({
    authProvider: (done) => {
      done(null, token);
    }
  });
  return client;
};

module.exports = { getClient };