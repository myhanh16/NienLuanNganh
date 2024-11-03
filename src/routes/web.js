const express = require('express');
const router = express.Router();
const {getHome, login, register, logout, create, listevent, registerevent,
    getevent, edit, del, Searchevent, isAuthenticated, participants, sendEmail, searcheventbytype} = require('../controllers/homeController');
const session = require('express-session');
const { route } = require('express/lib/application');
const { getapprovedEvents, getpendingEvents, ApproveEvent, listEvent, disapprove, getdisapprove, listuser} = require('../controllers/admin')

//Khai báo route
router.get('/home', getHome);

router.get('/homeadmin', getHome);

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
// router.get('/create', (req, res) => {
//     res.render('create', { session: req.session });
// })
router.get('/create', isAuthenticated, (req, res) => {
    // Hiển thị trang tạo sự kiện nếu người dùng đã đăng nhập
    res.render('create', { session: req.session });
});
  
router.post('/create', create );

router.get('/listevent', listevent); // Sử dụng hàm listevent thay vì render trực tiếp

router.post('/registerevent/:eventId', registerevent);


// POST route to update the event

router.get('/edit', function (req, res) {
    const notify = req.flash('success_msg'); // Lấy flash message thành công từ session
    const error_msg = req.flash('error_msg'); // Lấy flash message lỗi từ session
    res.render('edit', { notify: notify, error_msg: error_msg});
});
  
router.post('/edit', edit);
//router.post('/edit', upload.single('Image_URL'), edit);


router.get('/edit/:ID_Event', getevent);

router.get('/delete/:ID_Event', del)

router.get('/about', function(req, res) {
    res.render('about', {session: req.session})
})


router.get('/search', Searchevent);

router.get('/participants', participants);

router.post('/sendEmail', sendEmail, (req, res) => {
    res.render('participants', {sesesion: req.sesesion.user})
});

router.get('/searchbyType', searcheventbytype);


// ------------------ADMIN----------------
router.get('/all_event', listEvent);
router.get('/browse_event', (req, res) => {
    res.render('browse_event', { session: req.session });
});
router.get('/pending', getpendingEvents);
router.get('/approved', getapprovedEvents);
router.post('/approved/:ID_Event', ApproveEvent);
router.post('/disapproved/:ID_Event', disapprove);
router.get('/disapproved', getdisapprove);
router.get('/userList', listuser);



module.exports = router;