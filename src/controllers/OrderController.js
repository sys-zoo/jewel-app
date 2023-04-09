import {
    pool
} from "../db.js";
import {
    LocalStorage
} from 'node-localstorage'

var localStorage = new LocalStorage('./data');
export const addOrder = async (req, res) => {
    var isLogin = localStorage.getItem('isLogin');
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        try {
            var userInfo = localStorage.getItem('userInfo');
            var userInfoData = JSON.parse(userInfo);
            var orderNumber = new Date().getTime();
            var request = req.body;
            if (request) {
                var sql = "INSERT INTO JWL_ORDER (ORDER_NO,ORDER_TYPE,NAME,MOBILE,ADDRESS,ITEM_TYPE,RATE,WEIGHT,PURCHASE_AMT,ADVANCE_AMT,OLD_ITEM_TYPE,OLD_RATE,OLD_WEIGHT,OLD_ITEM_AMT,DELIVERED_ON) VALUES ?";
                var values = [[orderNumber,request.orderType,request.name,request.mobile,request.address,request.itemType,request.rate,request.weight,request.purchaseAmount,request.advanceAmount,request.oldItemType,request.oldRate,request.oldWeight,request.oldItemAmount,request.deliveredDate]];
                const [status] = await pool.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    return result.affectedRows;
                });
                if (status == 0) {
                    res.render("order/order", { rows: [], err: "Unable to add the stcok", userInfoData : userInfoData });
                    res.end();
                } else {
                    const [rowsOrderPId] = await pool.query('SELECT ORDER_ID FROM JWL_ORDER WHERE ORDER_NO =?', [orderNumber], (err, rows) => {
                        return rows;
                    });
                    var orderPId = rowsOrderPId[0].ORDER_ID;
                    console.log("O PID = " + orderPId);
                    var trackOrderQuery = "INSERT INTO JWL_ORDER_TRACK (ORDER_ID,ACTION_TYPE_ID,CONTENT,RATE,WEIGHT,AMOUNT_TYPE,AMOUNT,PAYMENT_MODE) VALUES ?";
                    var trackValues = [[orderPId,1,request.content,request.rate,request.weight,1,request.advanceAmount,request.paymentMode]];
                    const [statusTrack] = await pool.query(trackOrderQuery, [trackValues], function (err, result) {
                        if (err) throw err;
                        return result.affectedRows;
                    });
                    res.redirect('/vieworder?status=success');
                }
            }

        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const viewOrder = async (req, res) => {
    var isLogin = localStorage.getItem('isLogin');
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var userInfo = localStorage.getItem('userInfo');
        var userInfoData = JSON.parse(userInfo);
        try {
            const [rows] = await pool.query('SELECT * FROM JWL_ORDER ORDER BY CREATED_ON DESC', [], (err, rows) => {
                return rows;
            });
            res.render("order/order", {
                stocks: rows,
                rowCount: 0,
                userInfoData: userInfoData
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const viewOrderDetails = async (req, res) => {
    var isLogin = localStorage.getItem('isLogin');
    var orderNumber = req.query.o;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var userInfo = localStorage.getItem('userInfo');
        var userInfoData = JSON.parse(userInfo);
        try {
            const [rowsOrder] = await pool.query('SELECT * FROM JWL_ORDER WHERE ORDER_NO =?', [orderNumber], (err, rows) => {
                return rows;
            });
            var orderPId = rowsOrder[0].ORDER_ID;
            const [rows] = await pool.query('SELECT * FROM JWL_ORDER_TRACK o join JWL_ACTION_TYPE at on o.ACTION_TYPE_ID=at.ACTION_TYPE_ID where o.ORDER_ID=?', [orderPId], (err, rows) => {
                return rows;
            });
            const [rowsActionType] = await pool.query('SELECT * FROM JWL_ACTION_TYPE', [], (err, rows) => {
                return rows;
            });
            const [rowsStock] = await pool.query('SELECT * FROM JWL_STOCK', [], (err, rows) => {
                return rows;
            });
            localStorage.setItem('currentNumber', orderNumber);
            localStorage.setItem('currentOrderId', orderPId);
            res.render("order/orderView", {
                order : rowsOrder,
                orderDetails: rows,
                stock : rowsStock,
                rowsActionType : rowsActionType,
                rowCount: 0,
                userInfoData: userInfoData,
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const addOrderInfo = async (req, res) => {
    var isLogin = localStorage.getItem('isLogin');
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        try {
            var orderPId = localStorage.getItem('currentOrderId');
            var orderNumber = localStorage.getItem('currentNumber');
            var request = req.body;
            var trackOrderQuery = "INSERT INTO JWL_ORDER_TRACK (ORDER_ID,ACTION_TYPE_ID,CONTENT,RATE,WEIGHT,AMOUNT_TYPE,AMOUNT,PAYMENT_MODE) VALUES ?";
            var trackValues = [[orderPId,request.atype,request.content,request.rate,request.weight,request.amountType,request.amount,request.paymentMode]];
            const [statusTrack] = await pool.query(trackOrderQuery, [trackValues], function (err, result) {
            if (err) throw err;
                return result.affectedRows;
            });
            res.redirect('/vieworderdet?status=success&o=' + orderNumber);  

        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};

