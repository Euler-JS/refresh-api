const excelService = require('../services/excelService');

const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await excelService.getWorksheetData(process.env.EXCEL_FILE_ID, 'Subscriptions');
    res.json(subscriptions.values);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
};

const addSubscription = async (req, res) => {
  try {
    const { userId, plan } = req.body;
    const subscriptions = await excelService.getWorksheetData(process.env.EXCEL_FILE_ID, 'Subscriptions');
    const nextId = subscriptions.values.length;
    const newSub = [nextId, userId, plan, new Date().toISOString()];
    await excelService.updateWorksheetData(process.env.EXCEL_FILE_ID, 'Subscriptions', `A${nextId + 1}:D${nextId + 1}`, [newSub]);
    res.status(201).json({ message: 'Subscription added' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding subscription' });
  }
};

module.exports = { getSubscriptions, addSubscription };