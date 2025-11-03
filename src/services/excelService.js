const { getClient } = require('../config/excelConfig');

class ExcelService {
  async getWorksheetData(workbookId, worksheetName) {
    const client = await getClient();
    const response = await client.api(`/me/drive/items/${workbookId}/workbook/worksheets/${worksheetName}/usedRange`).get();
    return response;
  }

  async updateWorksheetData(workbookId, worksheetName, address, values) {
    const client = await getClient();
    await client.api(`/me/drive/items/${workbookId}/workbook/worksheets/${worksheetName}/range(address='${address}')`).patch({
      values: values
    });
  }
}

module.exports = new ExcelService();