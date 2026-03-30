import dotenv from "dotenv";

dotenv.config();

export const config = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3001),
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "quotation_app",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    namedPlaceholders: true,
  },
};
