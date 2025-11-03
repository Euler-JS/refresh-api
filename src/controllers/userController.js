const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o novo usuário
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Gerar token JWT
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      userId: newUser._id.toString()
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ 
      message: 'Erro ao registrar usuário',
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário pelo email (incluindo a senha para comparação)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      userId: user._id.toString()
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ message: 'Erro ao realizar login' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Obtido do middleware de autenticação
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user); // A senha já é removida automaticamente pelo método toJSON()
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário' });
  }
};