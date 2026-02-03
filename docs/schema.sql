-- Good Driver Incentive Program
-- MySQL Database Schema
-- Version: 1.0

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Table: Sponsors
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Sponsors`;

CREATE TABLE `Sponsors` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `point_dollar_ratio` DECIMAL(10, 4) NOT NULL DEFAULT 0.0100,
  `points_floor` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Table: Users
-- -----------------------------------------------------
-- Note: Authentication is handled by Firebase. 
-- This table stores profile data linked by the Firebase UID.
DROP TABLE IF EXISTS `Users`;

CREATE TABLE `Users` (
  `id` VARCHAR(128) NOT NULL COMMENT 'Firebase UID',
  `username` VARCHAR(50) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `role` ENUM('DRIVER', 'SPONSOR', 'ADMIN') NOT NULL,
  `phone_number` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `avatar_url` VARCHAR(512) NULL,
  `sponsor_id` VARCHAR(128) NULL,
  `points_balance` INT DEFAULT 0 COMMENT 'Only relevant for Drivers',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_unique` (`username` ASC),
  UNIQUE INDEX `email_unique` (`email` ASC),
  CONSTRAINT `fk_user_sponsor`
    FOREIGN KEY (`sponsor_id`)
    REFERENCES `Sponsors` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Table: Products (Catalog)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Products`;

CREATE TABLE `Products` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price_points` INT NOT NULL,
  `image_url` VARCHAR(512) NULL,
  `availability` TINYINT(1) DEFAULT 1,
  `sponsor_id` VARCHAR(128) NULL COMMENT 'If NULL, available to global catalog, else sponsor specific',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_product_sponsor`
    FOREIGN KEY (`sponsor_id`)
    REFERENCES `Sponsors` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Table: DriverApplications
-- -----------------------------------------------------
DROP TABLE IF EXISTS `DriverApplications`;

CREATE TABLE `DriverApplications` (
  `id` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(128) NOT NULL,
  `sponsor_id` VARCHAR(128) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `license_number` VARCHAR(50) NOT NULL,
  `experience_years` INT NOT NULL,
  `reason` TEXT NULL,
  `application_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_app_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_app_sponsor`
    FOREIGN KEY (`sponsor_id`)
    REFERENCES `Sponsors` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Table: PointTransactions
-- -----------------------------------------------------
DROP TABLE IF EXISTS `PointTransactions`;

CREATE TABLE `PointTransactions` (
  `id` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(128) NOT NULL COMMENT 'The driver receiving points',
  `sponsor_id` VARCHAR(128) NULL COMMENT 'The organization awarding points',
  `amount` INT NOT NULL COMMENT 'Positive for award, Negative for deduction',
  `reason` VARCHAR(255) NOT NULL,
  `transaction_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_date` (`user_id`, `transaction_date`),
  CONSTRAINT `fk_tx_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_tx_sponsor`
    FOREIGN KEY (`sponsor_id`)
    REFERENCES `Sponsors` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Table: AuditLogs
-- -----------------------------------------------------
DROP TABLE IF EXISTS `AuditLogs`;

CREATE TABLE `AuditLogs` (
  `id` VARCHAR(128) NOT NULL,
  `actor_id` VARCHAR(128) NULL COMMENT 'User ID who performed action',
  `actor_username` VARCHAR(50) NULL COMMENT 'Denormalized for history if user deleted',
  `action` VARCHAR(50) NOT NULL,
  `target` VARCHAR(255) NULL,
  `category` ENUM('DRIVER_APP', 'POINT_CHANGE', 'LOGIN', 'PASSWORD_CHANGE', 'USER_MGMT', 'SETTINGS') NOT NULL,
  `details` TEXT NULL,
  `log_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- Seed Data (Optional - For Initial AWS Deployment)
-- -----------------------------------------------------
INSERT INTO `Sponsors` (`id`, `name`, `point_dollar_ratio`, `points_floor`) VALUES
('s1', 'FastLane Logistics', 0.01, 0),
('s2', 'Global Freight', 0.015, 0);

INSERT INTO `Products` (`id`, `name`, `description`, `price_points`, `image_url`, `availability`) VALUES
('p1', 'Wireless Headset', 'Noise cancelling headset.', 5000, 'https://picsum.photos/400/300?random=10', 1),
('p2', 'Truck GPS', 'Advanced routing system.', 15000, 'https://picsum.photos/400/300?random=11', 1);
