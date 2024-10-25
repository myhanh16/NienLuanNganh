const con = require('../config/database');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale');
const session = require('express-session');
const { search } = require('../routes/web');
const nodemailer = require('nodemailer');
require('dotenv').config();

//Hiển thị ds sự kiện đã được duyệt và đưa lên trang home và số lượng người tham gia còn lại
const ListALLEvent = async (req, res) => {
  await con.query(
      `SELECT e.*, COUNT(ep.Email) AS Participant_Count
       FROM event e
       LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
       WHERE e.Status = 1
       GROUP BY e.ID_Event`,
      function(err, results) {
          if (err) throw err;
          
          // Định dạng lại thời gian bắt đầu và kết thúc
          const formattedEvents = results.map(event => ({
              ...event,
              Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
              End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
              Participant_Count: event.Participant_Count // Thêm số lượng người tham gia
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
    let { name, start, end, location, description, Image_URL, ID_type, price, max } = req.body;

    // Xử lý file upload
    const file = '/img/';
    console.log(Image_URL);
    Image_URL = file.concat(Image_URL);

  await con.query(
        'INSERT INTO `event`(`Name`, `Start_time`, `End_time`, `Location`, `Description`, `Image_URL`,`Email`, `ID_type`, `Price`, `status`, `Max_Participants`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [name, start, end, location, description, Image_URL, userEmail, ID_type, price, max],
        function(err, results) {
            if (err) {
                console.error('Error executing query:', err);
                return res.status(500).send('An error occurred');
            } else {
              req.flash('success_msg', 'Tạo sự kiện thành công');
              // res.redirect('/create')
                res.redirect('/listevent');
                // res.render('create', { session: req.session });
               
            }
        }
    );
};

//Hiển thị danh sách sự kiện của người dùng nào đó sau khi đăng nhập
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
            const notify = req.flash('success_msg');
            // Sử dụng res để render trang home với kết quả sự kiện
            res.render('listevent', { event: formattedEvents, session: req.session, notify: notify });
        }
  );

}

//đăng kí tham gia sự kiện
const RegisterEvent = async (req, res) => {
  try {
      const eventId = req.params.eventId;

      
      if (!req.session.user) {
          return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để đăng ký sự kiện.' });
      }

      const userEmail = req.session.user.Email;
      await con.query(
          'INSERT INTO event_participants (Email, ID_Event) VALUES (?, ?)',
          [userEmail, eventId],
          (err, results) => {
              if (err) {
                  console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
                  return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng ký sự kiện.' });
              }

              // Lấy thông tin sự kiện
              con.query(
                  'SELECT Name, Start_time, End_time, Location, Description FROM event WHERE ID_Event = ?',
                  [eventId],
                  (err, eventResults) => {
                      if (err) {
                          console.error('Lỗi truy vấn thông tin sự kiện:', err);
                          return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy thông tin sự kiện.' });
                      }

                      if (eventResults.length === 0) {
                          return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện.' });
                      }

                      // Định dạng thời gian
                      const formatDate = (date) => {
                          const d = new Date(date);
                          const day = (`0${d.getDate()}`).slice(-2);
                          const month = (`0${d.getMonth() + 1}`).slice(-2); 
                          const year = d.getFullYear();
                          const hours = (`0${d.getHours()}`).slice(-2);
                          const minutes = (`0${d.getMinutes()}`).slice(-2);
                          return `${day}/${month}/${year} ${hours}:${minutes}`;
                      };

                      
                      const formattedStartTime = formatDate(eventResults[0].Start_time);
                      const formattedEndTime = formatDate(eventResults[0].End_time);

                      
                      return res.json({
                          success: true,
                          message: 'Đăng ký thành công!',
                          event: {
                              Name: eventResults[0].Name,
                              Start_time: formattedStartTime,   
                              End_time: formattedEndTime,       
                              Location: eventResults[0].Location,
                              Description: eventResults[0].Description
                          },
                          Email: userEmail 
                      });
                  }
              );
          }
      );
  } catch (error) {
      console.error('Lỗi:', error);
      return res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại sau.' });
  }
};


//Lấy ID sự kiện
const getEventByID = async (req, res) => {
  if (req.session.user == null) {
    // return res.render('create', { error: 'Vui lòng đăng nhập trước khi tạo.' }); 
    return res.redirect('/login');// Chuyển hướng tới trang đăng nhập nếu chưa đăng nhập
  }
  // Đã đăng nhập thì thực hiện logic tạo sự kiện
  const userEmail = req.session.user.Email;

  const eventID = req.params.ID_Event;

  await con.query('SELECT * FROM `event` WHERE ID_Event = ?', [eventID], 
    function (err, results) {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Error executing query');
      }
      if (results.length === 0) {
        // Nếu không tìm thấy sự kiện, bạn có thể chuyển hướng người dùng hoặc hiển thị thông báo lỗi
        return res.status(404).send('Sự kiện không tồn tại');
      }
      else {
        let event = results[0];
        res.render('edit', {session: req.session, event: event});
      }
      
      // console.log("check: ", results);
    // Xử lý kết quả ở đây
  });
};

//Chỉnh sửa sự kiện
const editEvent = async (req, res) => {
  
  if (req.session.user == null) {
    return res.redirect('/login');
  }

  let { name, start, end, location, description, currentImageURL, ID_type, price, eventID } = req.body;
  const userEmail = req.session.user.Email;

  let Image_URL;
  if (req.files && req.files.Image_URL) {
    const file = '/img/';
    Image_URL = file.concat(req.files.Image_URL.name);
    req.files.Image_URL.mv('./public' + Image_URL);
  } else {
    Image_URL = currentImageURL;
  }

  try {
    const results = await con.query(
      'UPDATE `event` SET `Name`= ?, `Start_time`= ?, `End_time`= ?, `Location`= ?, `Description`= ?, `Image_URL`= ?, `Email`= ?, `ID_type`= ?, `Price`= ? WHERE ID_Event = ?',
      [name, start, end, location, description, Image_URL, userEmail, ID_type, price, eventID]
  );
  
  
    if (results.affectedRows === 0) {
     req.flash('error_msg', 'Sự kiện không tồn tại');
      return res.redirect('/edit/' + eventID);
    } else {
      req.flash('success_msg', 'Cập nhật sự kiện thành công');
      return res.redirect('/listevent');
  }
  } catch (error) {
    req.flash('error_msg', 'Lỗi khi cập nhật sự kiện');
    return res.redirect('/edit/' + eventID);
  }

};

//Xóa sự kiện
const deleteEvent = async (req, res) => {
  if (req.session.user == null) {
    return res.redirect('/login');
  }

  const eventID = req.params.ID_Event;

  try{
    await con.query(
      'DELETE FROM `event` WHERE ID_Event = ? ',[eventID]

    );
    req.flash('success_msg', 'Xóa sự kiện thành công!');
    res.redirect('/listevent')
  }
  catch(error){
    console.error('Lỗi khi xóa sự kiện:', error);
    res.status(500).send('Có lỗi xảy ra khi xóa sự kiện.');
  }
}

//Tìm kiếm sự kiện theo tên
const searchEvent = async (req, res) => {
  // if (req.session.user == null) {
  //     return res.redirect('/login');
  // }

  let { event } = req.query;  // Lấy dữ liệu từ query khi dùng GET method

  await con.query(
      `SELECT e.*, COUNT(ep.Email) AS Participant_Count
       FROM event e
       LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
       WHERE e.Name LIKE ? AND e.Status = 1
       GROUP BY e.ID_Event`,
      [`%${event}%`],
      function (err, results) {
          if (err) {
              console.error('Error executing query:', err);
              return res.status(500).send('Error executing query');
          }

          const formattedEvents = results.map(event => ({
              ...event,
              Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
              End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
              Participant_Count: event.Participant_Count 
          }));

          if (formattedEvents.length === 0) {
              req.flash('error_msg', `Không tìm thấy sự kiện "${event}" nào.`);
          }

          res.render('search', { event: formattedEvents, session: req.session, eventQuery: event, notify: req.flash('error_msg') });
      }
  );
};


//Chứng thực
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        // Thêm thông báo khi chưa đăng nhập
        return res.send(`
          <script>
            alert('Bạn cần đăng nhập trước khi tạo sự kiện.');
            window.location.href = '/login';
          </script>
        `);
    }
}

//Danh sách các sự kiện đã tham gia
const Participants = async (req, res) => {
  if (!req.session.user) {
      return res.redirect('/login'); // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
  }

  const userEmail = req.session.user.Email;

  try {
      await con.query(
          'SELECT e.* FROM event e JOIN event_participants ep ON e.ID_Event = ep.ID_Event WHERE ep.Email = ?', [userEmail],
          (err, results) => {
              if (err) {
                  console.error('Lỗi truy vấn cơ sở dữ liệu:', err); 
                  req.flash('error_msg', 'Lỗi khi tải sự kiện');
                  return res.redirect('/error'); // Điều hướng đến trang lỗi (nếu có)
              }

              if (results.length === 0) {
                req.flash('error_msg', 'Bạn chưa tham gia sự kiện nào.');
                // Render template participants và gửi thông báo
                return res.render('participants', { event: [], session: req.session, notify: req.flash('error_msg') });
              }

              const formattedEvents = results.map(event => ({
                  ...event,
                  Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                  End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi })
              }));

              if (formattedEvents.length === 0) {
                req.flash('error_msg', 'Không tìm thấy sự kiện nào.');
            }
              // const notify = req.flash('success_msg');
              res.render('participants', { event: formattedEvents, session: req.session,  notify: req.flash('error_msg') });
          }
      );
  } catch (error) {
      console.error('Lỗi:', error);
      req.flash('error_msg', 'Lỗi khi tải sự kiện');
      return res.redirect('/error');
  }
};

//Gửi mail
const sendRegistrationEmail = async (userEmail, eventDetails) => {
//   if (!req.session.user) {
//     return res.redirect('/login'); // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
// }

// const userEmail = req.session.user.Email;


  if (!userEmail) {
    console.error('Email không tìm thấy trong session');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail, // Sử dụng email từ session
      subject: 'Xác nhận đăng ký sự kiện thành công',
      html: `
      <h2>Chào bạn,</h2>
      <p>Cảm ơn bạn đã đăng ký thành công sự kiện <strong>${eventDetails.eventName}</strong> trên hệ thống của chúng tôi. Chúng tôi rất vui mừng được đón tiếp bạn tại sự kiện.</p>
      <h3>Thông tin chi tiết sự kiện:</h3>
      <ul>
          <li><strong>Tên sự kiện:</strong> ${eventDetails.eventName}</li>
          <li><strong>Thời gian bắt đầu:</strong> ${eventDetails.startTime}</li>
          <li><strong>Thời gian kết thúc:</strong> ${eventDetails.endTime}</li>
          <li><strong>Địa điểm:</strong> ${eventDetails.location}</li>
          <li><strong>Mô tả:</strong> ${eventDetails.description}</li>
      </ul>
      <p>Chúng tôi hy vọng bạn sẽ có một trải nghiệm tuyệt vời tại sự kiện. Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email này.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ tổ chức sự kiện</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email đã được gửi:', info.response);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error.message);
  }
};

//Tìm kiếm sự kiện theo loại sự kiện
const searchEventbyType = async (req, res) => {
  // if (req.session.user == null) {
  //   return res.redirect('/login');
  // }

  let { event_type } = req.query;  // Lấy dữ liệu từ query khi dùng GET method

  await con.query(
    `SELECT e.*, COUNT(ep.Email) AS Participant_Count
     FROM event e
     LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
     WHERE e.ID_type = ? AND e.status = 1
     GROUP BY e.ID_Event`,  // Thêm GROUP BY để tính toán số lượng người tham gia cho từng sự kiện
    [event_type],
    function (err, results) {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Error executing query');
      }

      const formattedEvents = results.map(event => ({
        ...event,
        Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
        End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
        Participant_Count: event.Participant_Count // Thêm Participant_Count vào kết quả
      }));

      if (formattedEvents.length === 0) {
        req.flash('error_msg', 'Không tìm thấy sự kiện nào.');
      }

      res.render('searchbyType', { event: formattedEvents, session: req.session, eventQuery: event_type, notify: req.flash('error_msg') });
    }
  );
};



module.exports = {
  ListALLEvent, 
  Login,
  Register,
  Logout,
  Create,
  ListEvent,
  RegisterEvent,
  getEventByID,
  editEvent,
  deleteEvent,
  searchEvent,
  isAuthenticated,
  Participants,
  sendRegistrationEmail,
  searchEventbyType
}