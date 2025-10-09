/*
 Navicat Premium Dump SQL

 Source Server         : xzy
 Source Server Type    : MySQL
 Source Server Version : 80040 (8.0.40)
 Source Host           : localhost:3306
 Source Schema         : smart_study_checkin

 Target Server Type    : MySQL
 Target Server Version : 80040 (8.0.40)
 File Encoding         : 65001

 Date: 21/09/2025 16:52:35
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for checkins
-- ----------------------------
DROP TABLE IF EXISTS `checkins`;
CREATE TABLE `checkins`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `study_time` int NOT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `images` json NULL,
  `mood` enum('excited','happy','normal','tired','frustrated') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `likes` json NULL,
  `comments` json NULL,
  `is_public` tinyint(1) NULL DEFAULT 1,
  `tags` json NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `checkins_user_id_created_at`(`user_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `checkins_created_at`(`created_at` ASC) USING BTREE,
  INDEX `checkins_subject`(`subject` ASC) USING BTREE,
  CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of checkins
-- ----------------------------
INSERT INTO `checkins` VALUES (1, 1, '今天学习了React Hooks，感觉对状态管理有了更深的理解！', 120, '编程', '[]', 'happy', '图书馆', '[]', '[]', 1, '[\"React\", \"前端开发\"]', '2025-09-21 08:23:05', '2025-09-21 08:23:05');
INSERT INTO `checkins` VALUES (2, 1, '完成了数学作业，解出了几道难题，很有成就感！', 90, '数学', '[]', 'excited', '宿舍', '[]', '[]', 1, '[\"微积分\", \"作业\"]', '2025-09-21 08:23:05', '2025-09-21 08:23:05');
INSERT INTO `checkins` VALUES (3, 2, '英语阅读练习，今天读了一篇关于AI的文章，学到了很多新词汇！', 60, '英语', '[]', 'normal', '咖啡厅', '[]', '[]', 1, '[\"阅读\", \"AI\"]', '2025-09-21 08:23:05', '2025-09-21 08:23:05');

-- ----------------------------
-- Table structure for study_plans
-- ----------------------------
DROP TABLE IF EXISTS `study_plans`;
CREATE TABLE `study_plans`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `total_hours` decimal(10, 2) NOT NULL,
  `completed_hours` decimal(10, 2) NULL DEFAULT 0.00,
  `daily_goal` int NULL DEFAULT 60,
  `milestones` json NULL,
  `reminders` json NULL,
  `progress` json NULL,
  `is_active` tinyint(1) NULL DEFAULT 1,
  `is_completed` tinyint(1) NULL DEFAULT 0,
  `tags` json NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `study_plans_user_id_created_at`(`user_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `study_plans_end_date`(`end_date` ASC) USING BTREE,
  INDEX `study_plans_subject`(`subject` ASC) USING BTREE,
  CONSTRAINT `study_plans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of study_plans
-- ----------------------------
INSERT INTO `study_plans` VALUES (1, 1, 'React学习计划', '深入学习React框架，掌握现代前端开发技能', '编程', '掌握React核心概念和最佳实践', '2025-09-06 08:23:05', '2025-10-06 08:23:05', 50.00, 32.50, 120, '[{\"title\": \"完成基础语法学习\", \"description\": \"掌握JSX、组件、Props等基础概念\", \"target_date\": \"2025-09-16T08:23:05.699Z\", \"is_completed\": true}, {\"title\": \"学习Hooks\", \"description\": \"掌握useState、useEffect等常用Hooks\", \"target_date\": \"2025-09-26T08:23:05.699Z\", \"is_completed\": false}]', '[]', '[]', 1, 0, '[]', '2025-09-21 08:23:05', '2025-09-21 08:23:05');
INSERT INTO `study_plans` VALUES (2, 1, '期末考试复习', '全面复习数学课程，准备期末考试', '数学', '期末考试达到90分以上', '2025-09-14 08:23:05', '2025-09-29 08:23:05', 30.00, 12.00, 90, '[]', '[]', '[]', 1, 0, '[]', '2025-09-21 08:23:05', '2025-09-21 08:23:05');

-- ----------------------------
-- Table structure for user_follows
-- ----------------------------
DROP TABLE IF EXISTS `user_follows`;
CREATE TABLE `user_follows`  (
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `follower_id` int NOT NULL,
  `following_id` int NOT NULL,
  PRIMARY KEY (`follower_id`, `following_id`) USING BTREE,
  INDEX `following_id`(`following_id` ASC) USING BTREE,
  CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_follows
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `bio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `study_goals` json NULL,
  `total_study_time` int NULL DEFAULT 0,
  `streak` int NULL DEFAULT 0,
  `last_checkin_date` datetime NULL DEFAULT NULL,
  `is_active` tinyint(1) NULL DEFAULT 1,
  `role` enum('user','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'user',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  UNIQUE INDEX `username_2`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email_2`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'demo_user', 'demo@example.com', '$2a$10$8Bsx67kzLQARVAlfHHzrtOwjzJ1Jxw9fyKT8HUy477PBf8q5KgtgS', '', '这是一个演示用户', '[]', 1250, 7, NULL, 1, 'user', '2025-09-21 08:23:05', '2025-09-21 08:23:05');
INSERT INTO `users` VALUES (2, 'test_user', 'test@example.com', '$2a$10$ifdxlvcRBMaoogmYaYHpGOMSf9pqIX98y204KvqYTz4SSQveSCvni', '', '测试用户', '[]', 800, 5, NULL, 1, 'user', '2025-09-21 08:23:05', '2025-09-21 08:23:05');

SET FOREIGN_KEY_CHECKS = 1;
