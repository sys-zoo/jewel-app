import { Router } from "express";
import { validateUser, renderLogin, addUser } from "../controllers/LoginController.js";
import { addStock, viewStock, viewStockHis, viewGoldStockHis } from "../controllers/StockController.js";
import { addOrder, addOrderInfo, viewOrder, viewOrderDetails, viewBasicOrder, viewCash, assignTo, deleteOrder } from "../controllers/OrderController.js";
const router = Router();

router.get("/", viewBasicOrder);
router.get("/viewStock", viewStock);
router.get("/viewStockHis", viewStockHis);
router.get("/viewgoldstockhis", viewGoldStockHis);
router.get("/login", renderLogin);
router.get("/viewbasicorder", viewBasicOrder);
router.get("/vieworder", viewOrder);
router.get("/vieworderdet", viewOrderDetails);
router.get("/viewcash", viewCash);
router.get("/deleteOrder", deleteOrder);

router.post("/validateUser", validateUser);
router.post("/addstock", addStock);
router.post("/adduser", addUser);
router.post("/neworder", addOrder);
router.post("/addOrderInfo", addOrderInfo);
router.post("/assignTo", assignTo);
export default router;
