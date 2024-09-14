const express = require('express');
const router = express.Router();
const {getHome, login, register, logout, create, listevent} = require('../controllers/homeController');
const session = require('express-session');

//Khai báo route
router.get('/home', getHome);


// Route để hiển thị form đăng nhập
router.get('/login', (req, res) => {
    res.render('login', { error: req.query.error }); // Hiển thị trang login.ejs hoặc login.html
});
router.post('/login', login); //Router xử lý dữ liệu trang đăng nhập


router.get('/register', (req, res) => {
    res.render('register', { error: req.query.error, no_error: req.query.no_error });
});
router.post ('/register', register)

router.get('/logout', logout);
// router.get('/logout', (req, res) => {
//     req.session.destroy(err => {
//       if (err) {
//         return res.redirect('/home');
//       }
//       res.clearCookie('connect.sid');
//       res.redirect('/home');
//     });
//   });
router.get('/create', (req, res) => {
    res.render('create', { session: req.session, success: true });
})
router.post('/create', create );

router.get('/listevent', listevent); // Sử dụng hàm listevent thay vì render trực tiếp
module.exports = router;