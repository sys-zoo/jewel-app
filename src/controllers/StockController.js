import {
    pool
} from "../db.js";
import {
    LocalStorage
} from 'node-localstorage'

var localStorage = new LocalStorage('./data');
export const addStock = async (req, res) => {
    console.info("Stock Type : Enter");
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin == null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        try {
            var request = req.body;
            var dbStatus = 0;
            var err = "Success";
            var menuActive = req.query.m;
            localStorage.setItem('menuActive',menuActive);
            if (request) {
                if (request.weight <= 0) {
                    err = "Please check your input. Because Weight should not be less or equal to zero";
                } else {
                    if (request.stockType == 1) {
                        var sql = "INSERT INTO JWL_STOCK_HIS (STOCK_TYPE_ID,WEIGHT) VALUES ?";
                        var values = [[request.stockType, request.weight]];
                        const [status] = await pool.query(sql, [values], function (err, result) {
                            if (err) throw err;
                            return result.affectedRows;
                        });
                        dbStatus = status;
                        if (dbStatus == 0) {
                            err = "Unable to add";
                        }
                        console.info("Stock Type : " + request.stockType);
                    } else {
                        const [rows] = await pool.query('SELECT * FROM JWL_STOCK', [], (err, rows) => {
                            return rows;
                        });
                        console.info("INSTOCK_WEIGHT :" + rows[0].INSTOCK_WEIGHT);
                        console.info("OUTSTOCK_WEIGHT :" + rows[0].OUTSTOCK_WEIGHT);
                        console.info("request.stockType :" + request.stockType);

                        if ((request.stockType == 2 && rows[0].INSTOCK_WEIGHT >= request.weight) ||
                            (request.stockType == 3 && rows[0].OUTSTOCK_WEIGHT >= request.weight)) {
                            var sql = "INSERT INTO JWL_STOCK_HIS (USER_ID,STOCK_TYPE_ID,WEIGHT) VALUES ?";
                            var values = [[request.userid, request.stockType, request.weight]];
                            const [status] = await pool.query(sql, [values], function (err, result) {
                                if (err) throw err;
                                return result.affectedRows;
                            });
                            dbStatus = status;
                            if (dbStatus == 0) {
                                err = "Unable to add";
                            }

                        } else {
                            dbStatus = 0;
                            err = "Please check your input. Because Weight Mismatch : INSTOCK_WEIGHT [" + rows[0].INSTOCK_WEIGHT + "] : OUTSTOCK_WEIGHT [" + rows[0].OUTSTOCK_WEIGHT + "]";
                        }
                    }
                }
                console.info("Status :" + dbStatus);
                res.redirect('/viewStock?status=' + err + "&m=" + menuActive);
            }

        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const viewStock = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    console.info(isLogin);
    if (isLogin == undefined || isLogin == null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var status = req.query.status;
        var menuActive = req.query.m;
        try {
            const [rows] = await pool.query('SELECT * FROM JWL_STOCK', [], (err, rows) => {
                return rows;
            });
            const [balancerows] = await pool.query('SELECT * FROM JWL_BALANCE where date(UPDATED_ON)=CURDATE()', [], (err, balancerows) => {
                return balancerows;
            });
            const [allbalancerows] = await pool.query('select amount_type,sum(amount) as amount from jwl_order_track where amount_type in (1,2) and date(created_on)=curdate() group by amount_type', [], (err, balancerows) => {
                return balancerows;
            });
            if(balancerows == undefined || balancerows.length<=0 || balancerows[0].BALANCE<=0){
                status = "Please update the Open Balance on Today " + new Date();
            }
            const [userrows] = await pool.query('SELECT NAME,USER_ID FROM JWL_USER WHERE IS_GS=1', [], (err, userrows) => {
                return userrows;
            });
            res.render("stock/stock", {
                stocks: rows,
                users : userrows,
                status: status,
                rowCount: 0,
                name: name,
                menuActive : menuActive,
                balancerows : balancerows,
                allbalancerows : allbalancerows
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const viewStockHis = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin == null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var stockTypeId = req.query.st;
        var menuActive = req.query.m;
        var userId = req.query.u;
        var query = "SELECT SH.*,USER.*,JO.ORDER_NO FROM JWL_STOCK_HIS SH JOIN JWL_USER USER ON SH.USER_ID=USER.USER_ID LEFT JOIN JWL_ORDER JO ON SH.ORDER_ID=JO.ORDER_ID WHERE SH.STOCK_TYPE_ID = ? ORDER BY SH.CREATED_ON DESC";
        var queryParam = [stockTypeId];
        if(stockTypeId!=1){
            query = "SELECT SH.*,USER.*,JO.ORDER_NO FROM JWL_STOCK_HIS SH JOIN JWL_USER USER ON SH.USER_ID=USER.USER_ID LEFT JOIN JWL_ORDER JO ON SH.ORDER_ID=JO.ORDER_ID WHERE SH.STOCK_TYPE_ID = ? AND SH.USER_ID = ? ORDER BY SH.CREATED_ON DESC";
            queryParam.push(userId);
        }
        try {
            const [rows] = await pool.query(query, queryParam , (err, rows) => {
                return rows;
            });
            res.render("stock/stockView", {
                stocks: rows,
                rowCount: 0,
                name: name,
                stockTypeId: stockTypeId,
                menuActive : menuActive
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const viewGoldStockHis = async (req, res) => {
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin == null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var stockTypeId = req.query.st;
        var menuActive = req.query.m;
        try {
            const [userrows] = await pool.query('SELECT * FROM JWL_USER WHERE IS_GS = 1 ORDER BY CREATED_ON DESC', [], (err, userrows) => {
                return userrows;
            });
            res.render("stock/stockgoldview", {
                users : userrows,
                rowCount: 0,
                name: name,
                stockTypeId: stockTypeId,
                menuActive : menuActive
            });
            res.end();
        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const updateBalance = async (req, res) => {
    console.info("Stock Type : Enter");
    var isLogin = req.session.isLogin;
    var name = req.session.userName;
    if (isLogin == undefined || isLogin == null || isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        try {
            var request = req.body;
            var dbStatus = 0;
            var err = "Success";
            var menuActive = req.query.m;
            if (request) {
                var sql = "INSERT INTO JWL_BALANCE_HIS (BALANCE_TYPE,BALANCE) VALUES ?";
                var values = [[1, request.balance]];
                const [status] = await pool.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    return result.affectedRows;
                });
                if(status==0){
                    err = "Error";
                }
                res.redirect('/viewStock?m=1&status=' + err + "&m=" + menuActive);
            }
        } catch (e) {
            console.log(e);
        }
    }
};


