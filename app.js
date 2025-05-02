// app.assets - Main server file
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require("cors")

const app = express();
const port = process.env.PORT || 3000;

app.use(cors())

// 中间件配置
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接池配置
const pool = mysql.createPool({
    host: '172.16.10.1', // 根据实际情况修改
    user: 'cat_weight',  // 根据实际情况修改
    password: '123456',  // 根据实际情况修改
    database: 'cat_weight_tracker', // 根据实际情况修改
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// API 路由

// 获取所有猫咪
app.get('/api/cats', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cats ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching cats:', error);
        res.status(500).json({ error: 'Failed to fetch cats' });
    }
});

// 添加新猫咪
app.post('/api/cats', async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Cat name is required' });
    }

    try {
        const [result] = await pool.query('INSERT INTO cats (name) VALUES (?)', [name.trim()]);
        res.status(201).json({ id: result.insertId, name: name.trim() });
    } catch (error) {
        console.error('Error adding cat:', error);
        res.status(500).json({ error: 'Failed to add cat' });
    }
});

// 获取所有体重记录
app.get('/api/weights', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT w.id, w.cat_id, c.name as cat_name, w.weight, DATE_FORMAT(w.date, "%Y-%m-%d") as date ' +
            'FROM weights w ' +
            'JOIN cats c ON w.cat_id = c.id ' +
            'ORDER BY w.date DESC, c.name'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching weight records:', error);
        res.status(500).json({ error: 'Failed to fetch weight records' });
    }
});

// 添加体重记录
app.post('/api/weights', async (req, res) => {
    const { cat_id, weight, date } = req.body;

    if (!cat_id || !weight || !date) {
        return res.status(400).json({ error: 'Cat ID, weight and date are required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO weights (cat_id, weight, date) VALUES (?, ?, ?)',
            [cat_id, weight, date]
        );

        res.status(201).json({
            id: result.insertId,
            cat_id,
            weight,
            date
        });
    } catch (error) {
        console.error('Error adding weight record:', error);
        res.status(500).json({ error: 'Failed to add weight record' });
    }
});

// 删除体重记录
app.delete('/api/weights/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM weights WHERE id = ?', [id]);
        res.status(200).json({ message: 'Weight record deleted successfully' });
    } catch (error) {
        console.error('Error deleting weight record:', error);
        res.status(500).json({ error: 'Failed to delete weight record' });
    }
});

// 获取指定猫咪的体重记录
app.get('/api/weights/cat/:catId', async (req, res) => {
    const { catId } = req.params;

    try {
        const [rows] = await pool.query(
            'SELECT w.id, w.cat_id, c.name as cat_name, w.weight, DATE_FORMAT(w.date, "%Y-%m-%d") as date ' +
            'FROM weights w ' +
            'JOIN cats c ON w.cat_id = c.id ' +
            'WHERE w.cat_id = ? ' +
            'ORDER BY w.date',
            [catId]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error fetching cat weight records:', error);
        res.status(500).json({ error: 'Failed to fetch cat weight records' });
    }
});

// 获取所有猫咪的体重记录（按猫咪分组）
app.get('/api/weights/all-cats', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT c.name as cat_name, w.weight, DATE_FORMAT(w.date, "%Y-%m-%d") as date ' +
            'FROM weights w ' +
            'JOIN cats c ON w.cat_id = c.id ' +
            'ORDER BY w.date, c.name'
        );

        // 将记录按猫咪名字分组
        const result = {};
        rows.forEach(row => {
            if (!result[row.cat_name]) {
                result[row.cat_name] = [];
            }
            result[row.cat_name].push({
                weight: row.weight,
                date: row.date
            });
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching all cats weight records:', error);
        res.status(500).json({ error: 'Failed to fetch all cats weight records' });
    }
});

// 提供前端HTML页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});