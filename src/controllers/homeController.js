const session = require('express-session');
const con = require('../config/database');

// Hàm hiển thị trang chính với dữ liệu sự kiện
const getHome = (req, res) => {
  con.query(
    'SELECT Name, Start_time, End_time, Location, Description, Image_URL FROM `event` WHERE `Status` = 1',
    function (err, results) {
      if (err) throw err;
      res.render('home', { event: results, session: req.session });
    }
  );
};

const login = (req, res) => {
  let { email, password } = req.body;
  con.query(
    'SELECT * FROM `user` WHERE `Email` = ? AND `Password` = ?', [email, password], 
    function (err, results) {
      if (err) throw err;
      if (results.length > 0) {
        req.session.user = results[0];  // Lưu thông tin user vào session
        
        // Sau khi đăng nhập, lấy dữ liệu sự kiện và hiển thị trang chính
        con.query(
          'SELECT Name, Start_time, End_time, Location, Description, Image_URL, Price FROM `event`',
          function (err, eventResults) {
            if (err) throw err;
            res.render('home', { event: eventResults, session: req.session });
          }
        );
      } else {
        res.render('login', { error: 'Email hoặc mật khẩu không đúng.' });
      }
    }
  );
};


// Hàm đăng ký người dùng
const register = (req, res) => {
  let { email, password, username, phone } = req.body;

  // Kiểm tra xem email đã tồn tại hay chưa
  con.query('SELECT * FROM `user` WHERE `Email` = ?', [email], function (err, results) {
    if (err) throw err;

    if (results.length > 0) {
      // Email đã tồn tại
      res.render('register', { error: 'Email đã tồn tại. Vui lòng chọn email khác.', no_error: null});
    } else {
      // Chèn bản ghi mới vào cơ sở dữ liệu
      con.query(
        'INSERT INTO `user`(`Email`, `Password`, `UserName`, `Phone`) VALUES (?, ?, ?, ?)', [email, password, username, phone],
        function (err, results) {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              // Xử lý lỗi trùng lặp nếu có
              res.render('register', { error: 'Email đã tồn tại. Vui lòng chọn email khác.', no_error: null });
            } else {
              // Xử lý lỗi khác
              throw err;
            }
          } else {
            // Đăng ký thành công, chuyển hướng đến trang đăng nhập
            // res.redirect('/login');
            res.render('register', { error: null, no_error: 'Đăng ký thành công.' });
          }
        }
      );
    }
  });
};


// Hàm hiển thị sự kiện
// const listevent = (req, res) => {
//   con.query(
//     'SELECT Name, Start_time, End_time, Location, Description, Image_URL FROM `event`',
//     function (err, results) {
//       if (err) throw err;
//       res.render('home', { event: results, session: req.session });
//     }
//   );
// };

const { format } = require('date-fns');
const { vi } = require('date-fns/locale'); // Đảm bảo import đúng locale

const listevent = (req, res) => {
  con.query(
    'SELECT Name, Start_time, End_time, Location, Description, Image_URL, Price FROM `event`WHERE `Status` = 1',
    function(err, results) {
      if (err) throw err;
      const formattedEvents = results.map(event => ({
        ...event,
        Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
        End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi })
      }));
      res.render('home', { event: formattedEvents, session: req.session });
    }
  );
};

// Hàm đăng xuất người dùng
const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid');
    res.redirect('/home');
  });
};

//Tạo sự kiện
const create = (req, res) => {
  if(!req.session.user){
    res.render('login');
  }
  let {name, start, end, location, Image_URL, description, ID_type, price} = req.body;
  
  
}

module.exports = {
  getHome,
  login,
  register,
  listevent,
  logout,
  create
};
