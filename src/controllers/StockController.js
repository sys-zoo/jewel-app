import {
    pool
} from "../db.js";
import {
    LocalStorage
} from 'node-localstorage'

var localStorage = new LocalStorage('./data');
export const addStock = async (req, res) => {
    var isLogin = localStorage.getItem('isLogin');
    if (isLogin && isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        try {
            var userInfo = localStorage.getItem('userInfo');
            var userInfoData = JSON.parse(userInfo);
            var request = req.body;
            if (request) {
                var sql = "INSERT INTO JWL_STOCK_HIS (RATE, WEIGHT, PURCHASE_AMT,IS_OLD_MATERIAL) VALUES ?";
                var values = [[request.rate, request.weight, request.purchaseAmount, request.mtype]];
                const [status] = await pool.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    return result.affectedRows;
                });
                if (status == 0) {
                    res.render("stock/stock", { rows: [], err: "Unable to add the stcok", userInfoData : userInfoData });
                    res.end();
                } else {
                    res.redirect('/viewStock?status=success');
                }
            }

        } catch (e) {
            console.log(e);
        }
        res.end();
    }
};
export const viewStock = async (req, res) => {
    var isLogin = localStorage.getItem('isLogin');
    if (isLogin && isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var userInfo = localStorage.getItem('userInfo');
        var userInfoData = JSON.parse(userInfo);
        try {
            const [rows] = await pool.query('SELECT * FROM JWL_STOCK', [], (err, rows) => {
                return rows;
            });
            res.render("stock/stock", {
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
export const viewStockHis = async (req, res) => {
    var isLogin = localStorage.getItem('isLogin');
    if (isLogin && isLogin == '0') {
        res.redirect('/login?err=Session expired!!!');
        res.end();
    } else {
        var userInfo = localStorage.getItem('userInfo');
        var userInfoData = JSON.parse(userInfo);
        try {
            const [rows] = await pool.query('SELECT * FROM JWL_STOCK_HIS ORDER BY CREATED_ON DESC', [], (err, rows) => {
                return rows;
            });
            res.render("stock/stockView", {
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

