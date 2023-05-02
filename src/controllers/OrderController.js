import {
    pool
} from "../db.js";
import {
    LocalStorage
} from 'node-localstorage'

var localStorage = new LocalStorage('./data');
export const addOrder = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        try {
            var orderNumber = new Date().getTime();
            var request = req.body;
            var menuActive = req.query.m;
            if (request) {
                var sql = "INSERT INTO JWL_ORDER (ORDER_NO,ORDER_TYPE,CAT_TYPE,NAME,MOBILE,ADDRESS,ITEM_TYPE,RATE,WEIGHT,ITEM_AMT,ADVANCE_AMT,OLD_ITEM_TYPE,OLD_RATE,OLD_WEIGHT,OLD_ITEM_AMT,DELIVERED_ON,PAYMENT_MODE) VALUES ?";
                var values = [[orderNumber,request.orderType,request.catType,request.name,request.mobile,request.address,request.itemType,request.rate,request.weight,request.itemAmount,getValue(request.advanceAmount),request.oldItemType,getValue(request.oldRate),getValue(request.oldWeight),getValue(request.oldItemAmount),request.deliveredDate,request.paymentMode]];
                const [status] = await pool.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    return result.affectedRows;
                });
                if (status == 0) {
                    res.render("order/order", { rows: [], err: "Unable to add the stcok", name : name });
                    res.end();
                } else {
                    const [rowsOrderPId] = await pool.query('SELECT ORDER_ID,CAT_TYPE FROM JWL_ORDER WHERE ORDER_NO =?', [orderNumber], (err, rows) => {
                        return rows;
                    });
                    var orderPId = rowsOrderPId[0].ORDER_ID;
                    var catType = rowsOrderPId[0].CAT_TYPE;
                    var catTypeName = "MYD";
                    if(catType ==1){
                        catTypeName = "MYD";
                    }else if(catType ==2){
                        catTypeName = "CH";
                    }else if(catType ==3){
                        catTypeName = "ARCT";
                    }
                    catTypeName = catTypeName + orderPId;
                    const [updateOrderId] = await pool.query('UPDATE JWL_ORDER SET ORDER_NO=? WHERE ORDER_ID =?', [catTypeName, orderPId], (err, rows) => {
                        return rows;
                    });
                    console.log("O PID = " + orderPId);
                    var trackOrderQuery = "INSERT INTO JWL_ORDER_TRACK (ORDER_ID,ACTION_TYPE_ID,CONTENT,RATE,WEIGHT) VALUES ?";
                    var trackValues = [[orderPId,1,request.content,request.rate,request.weight]];
                    const [statusTrack] = await pool.query(trackOrderQuery, [trackValues], function (err, result) {
                        if (err) throw err;
                        return result.affectedRows;
                    });
                    if(isNotNull(request.advanceAmount)){
                        var trackOrderQuery = "INSERT INTO JWL_ORDER_TRACK (ORDER_ID,ACTION_TYPE_ID,AMOUNT_TYPE,AMOUNT,PAYMENT_MODE) VALUES ?";
                        var trackValues = [[orderPId,3,1,getValue(request.advanceAmount),request.paymentMode]];
                        const [statusAdvanceAmt] = await pool.query(trackOrderQuery, [trackValues], function (err, result) {
                            if (err) throw err;
                            return result.affectedRows;
                        });
                    }
                    res.redirect('/viewBasicOrder?status=success&m=1');
                }
            }

        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
var getValue = function (value) {
    return isNull(value)?'0.00':value;
}
var isNull = function (value) {
    return (value == undefined || value == null || value =='')?true:false;
}
var isNotNull = function (value) {
    return !isNull(value);
}
export const viewOrder = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var menuActive = req.query.m;
        try {
            const [rows] = await pool.query('SELECT * FROM JWL_ORDER WHERE IS_DEL=0 ORDER BY CREATED_ON DESC', [], (err, rows) => {
                return rows;
            });
            res.render("order/order", {
                stocks: rows,
                rowCount: 0,
                name: name,
                menuActive : 1
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};

export const viewBasicOrder = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var menuActive = req.query.m;
        try {
            const [rows] = await pool.query('SELECT JO.*,USER.NAME AS GOLDSMITH_NAME FROM JWL_ORDER JO LEFT JOIN JWL_USER USER ON JO.GOLDSMITH_USER_ID=USER.USER_ID WHERE JO.IS_DEL=0 ORDER BY JO.ORDER_ID DESC', [], (err, rows) => {
                return rows;
            });
            const [userrows] = await pool.query('SELECT * FROM JWL_USER WHERE IS_GS=1', [], (err, userrows) => {
                return userrows;
            });
            res.render("order/orderbasic", {
                stocks: rows,
                users : userrows,
                rowCount: 0,
                name: name,
                menuActive : 1
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};

export const viewCash = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var menuActive = req.query.m;
        var openbalance = localStorage.getItem('openbalance');
        try {
            const [rows] = await pool.query("select jo.order_no, date_format(jot.created_on,'%d-%m-%Y %H:%m:%s') as order_date, jat.action_type,jot.amount_type,jot.amount as trans_amount,jo.item_amt from jwl_order_track jot join jwl_order jo on jot.order_id=jo.order_id join jwl_action_type jat on jot.action_type_id=jat.action_type_id where jot.action_type_id in(3,5,6,10) and jo.is_del=0 and date(jot.UPDATED_ON)=CURDATE() and jot.IS_CLOSED_BAL=0 order by jot.order_id desc, jot.created_on asc", [], (err, rows) => {
                return rows;
            });
            res.render("order/cashview", {
                orders: rows,
                rowCount: 0,
                name: name,
                menuActive : 3,
                openbalance : openbalance
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};

export const deleteOrder = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var orderNumber = req.query.deleteOrderNumber;
        var menuActive = req.query.m;
        try {
            const [status] = await pool.query('UPDATE JWL_ORDER SET IS_DEL = 1 WHERE ORDER_NO = ?', [orderNumber], (err, rows) => {
                return rows;
            });
            var err = "success";
            if(status==0){
                err = "Error"
            }
            res.redirect('/viewBasicOrder?status=' + err + "&m=1");
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};

export const assignTo = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var request = req.body;
        var menuActive = req.query.m;
        var err  = "";
        try {
            if (request) {
                console.info(request);
                const [status] = await pool.query("UPDATE JWL_ORDER SET GOLDSMITH_USER_ID = ?,STATUS=2 WHERE ORDER_NO= ?", [request.userId,request.orderNumber], function (err, result) {
                    if (err) throw err;
                    return result.affectedRows;
                });
                if (status == 0) {
                    res.render("order/order", { rows: [], err: "Unable to set the Goldsmith", name : name });
                    res.end();
                } else {
                    var trackOrderQuery = "INSERT INTO JWL_ORDER_TRACK (ORDER_ID,GOLDSMITH_USER_ID,ACTION_TYPE_ID) VALUES ?";
                    var trackValues = [[request.orderId,request.userId,2]];
                    const [statusAdvanceAmt] = await pool.query(trackOrderQuery, [trackValues], function (err, result) {
                        if (err) throw err;
                        return result.affectedRows;
                    });
                    var err = "success";
                    if(status==0){
                        err = "Error"
                    }
                    res.redirect('/viewBasicOrder?status=' + err + "&m=1");
                    res.end();
                }
           }
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const viewOrderDetails = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    var orderNumber = req.query.o;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var menuActive = req.query.m;
        var itemAmount = req.query.ia;
        var advanceAmount = req.query.aa;
        try {
            const [rowsOrder] = await pool.query('SELECT * FROM JWL_ORDER WHERE ORDER_NO =?', [orderNumber], (err, rows) => {
                return rows;
            });
            if(rowsOrder.length>0){
                var orderPId = rowsOrder[0].ORDER_ID;
                const [rows] = await pool.query('SELECT o.*,at.ACTION_TYPE_ID AS ACTION_TYPE_ID,at.ACTION_TYPE AS ACTION_TYPE,USER.NAME AS NAME FROM JWL_ORDER_TRACK o join JWL_ACTION_TYPE at on o.ACTION_TYPE_ID=at.ACTION_TYPE_ID LEFT JOIN JWL_USER USER ON o.GOLDSMITH_USER_ID=USER.USER_ID where o.ORDER_ID=? ORDER BY o.CREATED_ON DESC', [orderPId], (err, rows) => {
                    return rows;
                });
                var conditionQuery = "";
                var isItemDeliveredFromGS = 0;
                if(rows.length>0){
                    for(var idx=0;idx<rows.length;idx++){
                        if(rows[idx].ACTION_TYPE_ID==4){
                            conditionQuery = " WHERE ACTION_TYPE_ID>4";
                            isItemDeliveredFromGS = 1;
                        }
                    }
                }
                const [rowsActionType] = await pool.query('SELECT * FROM JWL_ACTION_TYPE' + conditionQuery, [], (err, rows) => {
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
                    orderNumber : orderNumber,
                    rowsActionType : rowsActionType,
                    rowCount: 0,
                    name: name,
                    isItemDeliveredFromGS : isItemDeliveredFromGS,
                    menuActive : 1,
                    itemAmount : itemAmount,
                    advanceAmount : advanceAmount
                });
            }else{
                res.render("order/orderView", {
                    order : [],
                    orderDetails: [],
                    stock : [],
                    orderNumber : "",
                    rowsActionType : [],
                    rowCount: 0,
                    name: name,
                    isItemDeliveredFromGS : 0,
                    menuActive : 1,
                    itemAmount : itemAmount,
                    advanceAmount : advanceAmount
                });
            }
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const addOrderInfo = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin==null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        try {
            var orderPId = localStorage.getItem('currentOrderId');
            var orderNumber = localStorage.getItem('currentNumber');
            var request = req.body;
            var amountType = 0;
            var menuActive = req.query.m;
            if(request.atype ==3 || request.atype ==10){
                amountType = 1;
                if(request.atype ==10){
                    request.amount = request.bamount;
                    request.paymentMode = request.paymentModef;
                }
            }else if(request.atype ==5 || request.atype ==6){
                amountType = 2;
            }
            var trackOrderQuery = "INSERT INTO JWL_ORDER_TRACK (ORDER_ID,WAGES_NAME,ACTION_TYPE_ID,CONTENT,RATE,WEIGHT,AMOUNT_TYPE,AMOUNT,PAYMENT_MODE,DISCOUNT_AMT) VALUES ?";
            var trackValues = [[orderPId,request.wagesName,request.atype,request.content,getValue(request.rate),getValue(request.weight),amountType,getValue(request.amount),request.paymentMode,getValue(request.damount)]];
            const [statusTrack] = await pool.query(trackOrderQuery, [trackValues], function (err, result) {
            if (err) throw err;
                return result.affectedRows;
            });
            res.redirect('/vieworderdet?status=success&o=' + orderNumber + "&m=1");  

        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};

