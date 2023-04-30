import express from "express";
import path from "path";
import morgan from "morgan";
import session from "express-session";

import customerRoutes from "./routes/jewel.routes.js";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// settings
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middlewares
app.use(morgan("dev"));
const oneDay = 1000 * 60 * 60 * 24;
app.use(express.urlencoded({ extended: false }));
app.use(session({secret: 'ARC$2O2EO40S5', resave: false, saveUninitialized: true, cookie: {
    expires: oneDay ,   maxAge: oneDay
}}))
app.use(express.urlencoded({ extended: false }));

// routes
app.use(customerRoutes);

// static files
app.use(express.static(path.join(__dirname, "public")));

// starting the server
export default app;