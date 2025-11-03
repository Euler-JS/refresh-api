const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const excelService = require('../services/excelService');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const users = await excelService.getWorksheetData(process.env.EXCEL_FILE_ID, 'Users');
    const existingUser = users.values.find(row => row[2] === email);
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const nextId = users.values.length;
    const newUser = [nextId, name, email, hashedPassword];
    await excelService.updateWorksheetData(process.env.EXCEL_FILE_ID, 'Users', `A${nextId + 1}:D${nextId + 1}`, [newUser]);
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await excelService.getWorksheetData(process.env.EXCEL_FILE_ID, 'Users');
    const user = users.values.find(row => row[2] === email);
    if (!user || !await bcrypt.compare(password, user[3])) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user[0] }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

module.exports = { register, login };