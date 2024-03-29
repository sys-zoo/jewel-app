import {
    pool
} from "../db.js";
import {
    LocalStorage
} from 'node-localstorage'

var localStorage = new LocalStorage('./data');
export const renderLogin = async (req, res) => {
	var error = req.query.err;
 	req.session.isLogin = 0;
	req.session.name = '';
    res.render("login", {error : error
    });
};

export const validateUser = async (req, res) => {
	try {
		var request = req.body;
		const [rows]  = await pool.query('SELECT * FROM JWL_USER WHERE USERNAME=? AND PASSWORD=?', [request.username, request.password], (err, rows) => {
			return rows;
		});
		if(rows && rows.length>0){
			var userInfo = rows[0];
			req.session.userName = userInfo.NAME;
			req.session.isLogin = 1;
			res.redirect('/');
		}else{
			res.redirect('/login?err=invalid credentials');
		}
	} catch(e) {
        console.log(e);
    }
};

export const addUser = async (req, res) => {
	try {
		var request = req.body;
		var err = "";
		const [rows]  = await pool.query('SELECT * FROM JWL_USER WHERE MOBILE=?', [request.gmobile], (err, rows) => {
			return rows;
		});
		if(rows && rows.length>0){
			res.redirect('/login?err=Gold Smith already exists!!!');
		}else{
			var sql = "INSERT INTO JWL_USER (NAME,MOBILE,IS_GS) VALUES ?";
			var values = [[request.gname, request.gmobile,1]];
			const [status] = await pool.query(sql, [values], function (err, result) {
				if (err) throw err;
				return result.affectedRows;
			});
			if (status == 0) {
				err = "Unable to add Gold Smith";
			}
			res.redirect('/viewStock?m=1&status=' + err);
		}
	} catch(e) {
        console.log(e);
    }
};
