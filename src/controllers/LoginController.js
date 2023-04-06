import {
    pool
} from "../db.js";
import {
    LocalStorage
} from 'node-localstorage'

var localStorage = new LocalStorage('./data');
export const renderLogin = async (req, res) => {
	var error = req.query.err;
    localStorage.setItem('isLogin', 0);
	localStorage.setItem('userInfo', undefined);
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
			localStorage.setItem('isLogin', 1);
			localStorage.setItem('userInfo', JSON.stringify(userInfo));
			console.info(JSON.stringify(userInfo));
			res.redirect('/');
		}else{
			res.redirect('/login?err=invalid credentials');
		}
	} catch(e) {
        console.log(e);
    }
};

