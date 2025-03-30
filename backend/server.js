const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Secret key и временное хранилище пользователей
const SECRET_KEY = 'absolute_secure_key';
const users = [];

// Middleware для проверки JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Регистрация пользователя
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Проверка существующего пользователя
        const existingUser = users.find(user => user.username === username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString(),
            username,
            password: hashedPassword
        };

        users.push(newUser);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Аутентификация пользователя
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find(user => user.username === username);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Сравнение паролей
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Генерация JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            userId: user.id
        });
    } catch (error) {
        res.status(500).json({ message: 'Error during authentication' });
    }
});

// Защищенный маршрут
app.get('/protected', authenticateJWT, (req, res) => {
    res.json({
        message: 'Protected content accessed successfully',
        user: req.user
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});