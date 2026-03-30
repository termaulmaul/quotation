import mysql from "mysql2/promise";
import { config } from "./config.js";

let pool;

export async function initDatabase() {
  const bootstrap = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\``);
  await bootstrap.end();

  pool = mysql.createPool(config.db);
  await createSchema(pool);
  return pool;
}

export function getDb() {
  if (!pool) {
    throw new Error("Database pool has not been initialized");
  }
  return pool;
}

async function createSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS quotations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      company_name VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      quotation_no VARCHAR(100) NOT NULL,
      quotation_date VARCHAR(100) NOT NULL,
      project_name VARCHAR(255) NOT NULL,
      client_name VARCHAR(255) NOT NULL,
      client_address VARCHAR(255) NOT NULL,
      valid_until VARCHAR(100) NOT NULL,
      notes TEXT NOT NULL,
      tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1100,
      grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
      tax_total DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_with_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_quotation_no (quotation_no)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS quotation_sections (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      quotation_id BIGINT UNSIGNED NOT NULL,
      position INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sections_quotation_id (quotation_id),
      CONSTRAINT fk_sections_quotation
        FOREIGN KEY (quotation_id) REFERENCES quotations(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS quotation_rows (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      section_id BIGINT UNSIGNED NOT NULL,
      position INT NOT NULL,
      image LONGTEXT NULL,
      description TEXT NOT NULL,
      qty DECIMAL(12,2) NOT NULL DEFAULT 0,
      unit VARCHAR(50) NOT NULL,
      unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
      line_total DECIMAL(15,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_rows_section_id (section_id),
      CONSTRAINT fk_rows_section
        FOREIGN KEY (section_id) REFERENCES quotation_sections(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
