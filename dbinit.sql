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