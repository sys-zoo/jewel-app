import { createPool } from "mysql2/promise";

export const pool = createPool({
  host: "localhost",
  user: "root",
  password: "Root@123",
  port: 3306,
  database: "jewel_db"
});
