const con = require('../config/database');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale');


const ListALLEvent = async (req, res) => {
    await con.query(
        'SELECT Name, Start_time, End_time, Location, Description, Image_URL, Price FROM `event` WHERE `Status` = 1',
        function(err, results) {
            if (err) throw err;
            
            const formattedEvents = results.map(event => ({
                ...event,
                Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi })
            }));
            
            // Sử dụng res để render trang home với kết quả sự kiện
            res.render('home', { event: formattedEvents, session: req.session });
        }
    );
};

// Login
const Login = async (req, res) => {
    let { email, password } = req.body;
    await con.query(
        'SELECT * FROM `user` WHERE `Email` = ? AND `Password` = ?', [email, password],
        function (err, results) {
            if (err) throw err;
            if (results.length > 0) {
                req.session.user = results[0];  // Lưu thông tin user vào session

                // Thay đổi từ render sang redirect để thay đổi URL
                res.redirect('/home');  // Chuyển hướng tới trang home
            } else {
                res.render('login', { error: 'Email hoặc mật khẩu không đúng.' });
            }
        }
    );
}

//Register
const Register = async(req, res) => {
    let { email, password, username, phone } = req.body;
  
    // Kiểm tra xem email đã tồn tại hay chưa
    await con.query('SELECT * FROM `user` WHERE `Email` = ?', [email], function (err, results) {
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

//Logout
const Logout = async (req, res) => {
    req.session.destroy(err => {
        if (err) {
          return res.redirect('/home');
        }
        res.clearCookie('connect.sid');
        res.redirect('/home');
      });
}

//Create
// const Create = async (req, res) => {
//     // if (!req.session.user) {
//   //   return res.redirect('/login');
//   // }
//   // else {
//   //   const userEmail = req.session.user.Email;
//   //   let { name, start, end, location, description, Image_URL, ID_type, price } = req.body;

//   // Xử lý file upload
//   const file = '/img/';
//   let { name, start, end, location, description, Image_URL, ID_type, price } = req.body;
//   console.log(Image_URL);
//   Image_URL = file.concat(Image_URL);
//  //  if (req.file) {
//  //    const fileImg = req.file.path; // Lấy đường dẫn đến file hình ảnh
//  //    console.log(req.file.path);
     
     
//  //   }

//    con.query(
//      'INSERT INTO `event`(`Name`, `Start_time`, `End_time`, `Location`, `Description`, `Image_URL`, `ID_type`, `status`, `Price`) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
//      [name, start, end, location, description, Image_URL, ID_type, price],
//      function(err, results) {
//        if (err) {
//          console.error('Error executing query:', err);
//          // console.log(req.body);
//          return res.status(500).send('An error occurred');
//        }
//        else {
//          res.send("Tao thanh cong")
//        }

//    } 
//  );
 
// }

const Create = async (req, res) => {
    // Kiểm tra xem người dùng đã đăng nhập hay chưa
    if (req.session.user == null) {
        // return res.render('create', { error: 'Vui lòng đăng nhập trước khi tạo.' }); 
        return res.redirect('/login');// Chuyển hướng tới trang đăng nhập nếu chưa đăng nhập
    }

    // Đã đăng nhập thì thực hiện logic tạo sự kiện
    const userEmail = req.session.user.Email; // Sử dụng email của người dùng đã đăng nhập nếu cần
    let { name, start, end, location, description, Image_URL, ID_type, price } = req.body;

    // Xử lý file upload
    const file = '/img/';
    console.log(Image_URL);
    Image_URL = file.concat(Image_URL);

  await con.query(
        'INSERT INTO `event`(`Name`, `Start_time`, `End_time`, `Location`, `Description`, `Image_URL`,`Email`, `ID_type`, `status`, `Price`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [name, start, end, location, description, Image_URL, userEmail, ID_type, price],
        function(err, results) {
            if (err) {
                console.error('Error executing query:', err);
                return res.status(500).send('An error occurred');
            } else {
                // res.redirect('/listevent');
                res.render('create', { success: true });
            }
        }
    );
};

const ListEvent = async (req, res) => {
  // Kiểm tra xem người dùng đã đăng nhập hay chưa
  if (req.session.user == null) {
    // return res.render('create', { error: 'Vui lòng đăng nhập trước khi tạo.' }); 
    return res.redirect('/login');// Chuyển hướng tới trang đăng nhập nếu chưa đăng nhập
  }
  // Đã đăng nhập thì thực hiện logic tạo sự kiện
  const userEmail = req.session.user.Email; // Sử dụng email của người dùng đã đăng nhập nếu cần
  await con.query (
    'SELECT * FROM `event` WHERE `Email` = ? ',[userEmail],
        function(err, results) {
            if (err) throw err;
            
            const formattedEvents = results.map(event => ({
                ...event,
                Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi })
            }));
            
            // Sử dụng res để render trang home với kết quả sự kiện
            res.render('listevent', { event: formattedEvents, session: req.session });
        }
  );

}


module.exports = {
  ListALLEvent, 
  Login,
  Register,
  Logout,
  Create,
  ListEvent,

}