# 猫咪体重跟踪器

## 项目概述

用于跟踪和可视化猫咪的体重变化。该应用允许用户：

- 添加和管理多只猫咪
- 记录每只猫咪在不同日期的体重
- 查看单只猫咪的体重变化趋势图
- 查看所有猫咪的体重变化对比图
- 管理体重记录（查看和删除）

## 技术栈

- **前端**：HTML, CSS, JavaScript (ECharts用于图表可视化)
- **后端**：Node.js, Express
- **数据库**：MySQL

## 数据库设计

### 数据库模式

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS cat_weight_tracker DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE cat_weight_tracker;

-- 创建猫咪表
CREATE TABLE IF NOT EXISTS cats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 创建体重记录表
CREATE TABLE IF NOT EXISTS weights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cat_id INT NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE,
    UNIQUE KEY cat_date_unique (cat_id, date)
) ENGINE=InnoDB;

-- 添加索引
CREATE INDEX idx_weights_cat_id ON weights(cat_id);
CREATE INDEX idx_weights_date ON weights(date);
```

### 示例数据

```sql
-- 插入一些示例数据
INSERT INTO cats (name) VALUES 
    ('小花'),
    ('大橘'),
    ('黑豆');

-- 插入一些示例体重记录
INSERT INTO weights (cat_id, weight, date) VALUES
    (1, 3.2, '2025-04-01'),
    (1, 3.3, '2025-04-08'),
    (1, 3.25, '2025-04-15'),
    (1, 3.4, '2025-04-22'),
    (1, 3.5, '2025-04-29'),
    (2, 5.1, '2025-04-01'),
    (2, 5.2, '2025-04-08'),
    (2, 5.0, '2025-04-15'),
    (2, 5.3, '2025-04-22'),
    (2, 5.4, '2025-04-29'),
    (3, 4.0, '2025-04-01'),
    (3, 4.1, '2025-04-08'),
    (3, 4.2, '2025-04-15'),
    (3, 4.3, '2025-04-22'),
    (3, 4.2, '2025-04-29');
```

## 后端实现

后端使用Node.js和Express框架实现，提供以下API端点：

### API端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/cats` | GET | 获取所有猫咪 |
| `/api/cats` | POST | 添加新猫咪 |
| `/api/weights` | GET | 获取所有体重记录 |
| `/api/weights` | POST | 添加体重记录 |
| `/api/weights/:id` | DELETE | 删除体重记录 |
| `/api/weights/cat/:catId` | GET | 获取指定猫咪的体重记录 |
| `/api/weights/all-cats` | GET | 获取所有猫咪的体重记录（按猫咪分组） |

### 完整代码

```javascript
// app.assets - Main server file
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 中间件配置
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接池配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',  // 根据实际情况修改
  password: 'password',  // 根据实际情况修改
  database: 'cat_weight_tracker',
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
```

## 前端实现

前端使用纯HTML、CSS和JavaScript，使用ECharts库实现数据可视化。

### 主要功能

1. **猫咪管理**
    - 添加新猫咪
    - 从下拉列表选择现有猫咪

2. **体重记录**
    - 为选定的猫咪添加体重记录
    - 选择记录日期

3. **数据可视化**
    - 单只猫咪的体重趋势图
    - 所有猫咪的体重对比图
    - 体重记录表格，支持删除操作

### 界面预览

应用界面分为左右两部分：
- 左侧边栏：用于添加猫咪和记录体重
- 右侧主区域：使用选项卡显示不同的数据视图（单只猫咪趋势、所有猫咪趋势、体重记录表）

## 安装指南

### 系统要求

- Node.js (v14.0.0 或更高版本)
- MySQL (v5.7 或更高版本)
- npm (Node包管理器)

### 步骤 1: 数据库设置

1. 登录到MySQL：
   ```bash
   mysql -u root -p
   ```

2. 运行初始化SQL脚本：
   ```bash
   # 在MySQL命令行中
   source path/to/cat_weight_tracker_sql.sql
   ```

   或者复制并粘贴SQL文件内容到MySQL命令行界面。

3. 确认数据库和表已创建：
   ```sql
   USE cat_weight_tracker;
   SHOW TABLES;
   ```

### 步骤 2: 后端设置

1. 创建项目文件夹：
   ```bash
   mkdir cat-weight-tracker
   cd cat-weight-tracker
   ```

2. 初始化Node.js项目：
   ```bash
   npm init -y
   ```

3. 安装所需依赖：
   ```bash
   npm install express mysql2 body-parser
   ```

4. 创建后端文件：
    - 将提供的后端代码保存为 `app.js`
    - 根据您的MySQL设置，修改数据库连接配置：
      ```javascript
      const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',  // 修改为您的MySQL用户名
        password: 'password',  // 修改为您的MySQL密码
        database: 'cat_weight_tracker',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      ```

### 步骤 3: 前端设置

1. 创建前端文件：
   ```bash
   mkdir -p public
   ```

2. 将提供的HTML代码保存为 `public/index.html`

### 步骤 4: 启动应用

1. 启动服务器：
   ```bash
   node app.assets
   ```

2. 在浏览器中访问应用：
   ```
   http://localhost:3000
   ```

## 使用说明

### 添加猫咪

1. 在左侧边栏的"添加新猫咪"部分输入猫咪名字
2. 点击"添加猫咪"按钮

### 记录体重

1. 在左侧边栏的"记录体重"部分选择猫咪
2. 输入体重数值（单位：kg）
3. 选择日期（默认为当天）
4. 点击"记录体重"按钮

### 查看体重趋势

1. **单只猫咪趋势**
    - 在右侧主区域选择"单只猫咪趋势"选项卡
    - 从下拉菜单选择要查看的猫咪
    - 查看该猫咪的体重变化曲线图

2. **所有猫咪趋势**
    - 选择"所有猫咪趋势"选项卡
    - 查看所有猫咪的体重变化曲线对比图

3. **体重记录**
    - 选择"体重记录"选项卡
    - 查看所有记录的表格视图
    - 可以删除不需要的记录

## 常见问题解决

1. **数据库连接错误**：
    - 确保MySQL服务正在运行
    - 检查用户名和密码是否正确
    - 确保cat_weight_tracker数据库已创建

2. **端口冲突**：
    - 如果3000端口已被占用，可以在app.js中修改端口号：
      ```javascript
      const port = process.env.PORT || 3001; // 改为其他可用端口
      ```

3. **跨域问题**：
    - 如果前端和后端分开部署，可能需要设置CORS：
      ```bash
      npm install cors
      ```
      然后在app.js中添加：
      ```javascript
      const cors = require('cors');
      app.use(cors());
      ```

## 扩展功能建议

以下是可以进一步增强应用功能的建议：

1. **用户认证** - 添加登录系统，允许多个用户管理自己的猫咪
2. **照片上传** - 允许为每只猫咪上传照片
3. **饮食记录** - 跟踪猫咪的饮食习惯并与体重变化关联
4. **健康指标** - 添加更多健康指标，如年龄、疫苗接种情况等
5. **数据导出** - 允许用户导出体重数据为CSV或PDF
6. **提醒功能** - 添加定期称重提醒
7. **体重目标** - 设置理想体重目标并跟踪进度