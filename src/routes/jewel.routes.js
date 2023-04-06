import { Router } from "express";
import { validateUser, renderLogin } from "../controllers/LoginController.js";
import { addStock, viewStock, viewStockHis } from "../controllers/StockController.js";
import { addOrder, viewOrder, viewOrderDetails } from "../controllers/OrderController.js";
const router = Router();

router.get("/", viewStock);
router.get("/viewStock", viewStock);
router.get("/viewStockHis", viewStockHis);
router.get("/login", renderLogin);
router.post("/validateUser", validateUser);
router.post("/addstock", addStock);
router.post("/neworder", addOrder);
router.get("/vieworder", viewOrder);
router.get("/vieworderdet", viewOrderDetails);
export default router;
