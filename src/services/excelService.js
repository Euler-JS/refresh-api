const { getGoogleSheetsClient } = require('../config/excelConfig');

class ExcelService {
  async getWorksheetData(spreadsheetId, sheetName) {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    return response.data.values || [];
  }

  async appendWorksheetData(spreadsheetId, sheetName, values) {
    const sheets = getGoogleSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });
  }

  async updateWorksheetData(spreadsheetId, sheetName, range, values) {
    const sheets = getGoogleSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: values
      }
    });
  }

  // Helper methods for the simplified interface
  async getUserByEmail(email) {
    const rows = await this.getWorksheetData(process.env.SPREADSHEET_ID, 'Users');
    // Skip header row (index 0)
    return rows.slice(1).find(row => row[2] === email);
  }

  async createUser(userData) {
    const rows = await this.getWorksheetData(process.env.SPREADSHEET_ID, 'Users');
    const nextId = rows.length; // Includes header
    const newUser = [nextId, userData.username, userData.email, userData.password, new Date().toISOString(), 'active'];
    await this.appendWorksheetData(process.env.SPREADSHEET_ID, 'Users', [newUser]);
    return { id: nextId, username: userData.username, email: userData.email, createdAt: newUser[4], status: 'active' };
  }

  async getUserById(id) {
    const rows = await this.getWorksheetData(process.env.SPREADSHEET_ID, 'Users');
    return rows.slice(1).find(row => row[0] == id);
  }

  async getSubscriptionByUserId(userId) {
    const rows = await this.getWorksheetData(process.env.SPREADSHEET_ID, 'Subscriptions');
    return rows.slice(1).find(row => row[1] == userId && row[5] === 'active');
  }

  async getSubscriptionById(id) {
    const rows = await this.getWorksheetData(process.env.SPREADSHEET_ID, 'Subscriptions');
    return rows.slice(1).find(row => row[0] == id);
  }

  async createSubscription(subscriptionData) {
    const rows = await this.getWorksheetData(process.env.SPREADSHEET_ID, 'Subscriptions');
    const nextId = rows.length;
    const newSub = [nextId, subscriptionData.userId, subscriptionData.plan, subscriptionData.startDate, subscriptionData.endDate, 'active'];
    await this.appendWorksheetData(process.env.SPREADSHEET_ID, 'Subscriptions', [newSub]);
    return { id: nextId, ...subscriptionData, status: 'active' };
  }

  async updateSubscription(id, data) {
    const rows = await this.getWorksheetData(process.env.SPREADSHEET_ID, 'Subscriptions');
    const rowIndex = rows.slice(1).findIndex(row => row[0] == id);
    
    if (rowIndex === -1) return null;
    
    const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 0-based to 1-based
    
    if (data.endDate) {
      await this.updateWorksheetData(process.env.SPREADSHEET_ID, 'Subscriptions', `E${actualRowIndex}`, [[data.endDate]]);
    }
    
    const updatedRow = rows[rowIndex + 1];
    if (data.endDate) updatedRow[4] = data.endDate;
    
    return {
      id: updatedRow[0],
      userId: updatedRow[1],
      plan: updatedRow[2],
      startDate: updatedRow[3],
      endDate: updatedRow[4],
      status: updatedRow[5]
    };
  }
}

module.exports = new ExcelService();