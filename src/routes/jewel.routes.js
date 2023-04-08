import { Router } from "express";
import { validateUser, renderLogin } from "../controllers/LoginController.js";
import { addStock, viewStock, viewStockHis } from "../controllers/StockController.js";
import { addOrder, addOrderInfo, viewOrder, viewOrderDetails } from "../controllers/OrderController.js";
const router = Router();

router.get("/", viewStock);
router.get("/viewStock", viewStock);
router.get("/viewStockHis", viewStockHis);
router.get("/login", renderLogin);
router.get("/vieworder", viewOrder);
router.get("/vieworderdet", viewOrderDetails);

router.post("/validateUser", validateUser);
router.post("/addstock", addStock);
router.post("/neworder", addOrder);
router.post("/addOrderInfo", addOrderInfo);
export default router;
