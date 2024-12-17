const con = require('../config/database');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale');
const session = require('express-session');
const { search } = require('../routes/web');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

require('dotenv').config();

//Hiển thị ds sự kiện đã được duyệt và đưa lên trang home và số lượng người tham gia còn lại
const ListALLEvent = async (req, res) => {
  await con.query(
      `SELECT e.*, COUNT(ep.Email) AS Participant_Count, u.UserName AS Creator_Name
         FROM event e
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
         LEFT JOIN user u ON e.Email = u.Email
         WHERE e.status = 1
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
          //res.render('home', { event: formattedEvents, session: req.session });
          if (req.session.user && req.session.user.admin === 1) {
           
            res.render('homeadmin', { event: formattedEvents, session: req.session });
        } else {
            
            res.render('home', { event: formattedEvents, session: req.session });
        }
      }
  );
};

// Login
const Login = async (req, res) => {
  let { email, password } = req.body;

  // Mã hóa mật khẩu đầu vào để so sánh
  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

  await con.query(
      'SELECT * FROM `user` WHERE `Email` = ? AND `Password` = ?', [email, hashedPassword],
      function (err, results) {
          if (err) throw err;
          if (results.length > 0) {
              req.session.user = results[0];
              if (results[0].admin == 1) {
                  res.redirect('/homeadmin');
              } else {
                  res.redirect('/');
              }
          } else {
              res.render('login', { error: 'Email hoặc mật khẩu không đúng.' });
          }
      }
  );
};


//Register
const Register = async (req, res) => {
    let { email, password, username, phone } = req.body;
  
    // Mã hóa mật khẩu bằng SHA-1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
  
    await con.query('SELECT * FROM `user` WHERE `Email` = ?', [email], function (err, results) {
        if (err) throw err;

        if (results.length > 0) {
            res.render('register', { error: 'Email đã tồn tại. Vui lòng chọn email khác.', no_error: null });
        } else {
            con.query(
                'INSERT INTO `user`(`Email`, `Password`, `UserName`, `Phone`, `admin`) VALUES (?, ?, ?, ?, 0)',
                [email, hashedPassword, username, phone],
                function (err, results) {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            res.render('register', { error: 'Email đã tồn tại. Vui lòng chọn email khác.', no_error: null });
                        } else {
                            throw err;
                        }
                    } else {
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
          return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
}

//Hàm tạo sự kiện
// const Create = async (req, res) => {

//     if (req.session.user == null) {
//         // return res.render('create', { error: 'Vui lòng đăng nhập trước khi tạo.' }); 
//         return res.redirect('/login');
//     }

    
//     const userEmail = req.session.user.Email; 
//     let { name, start, end, location, description, Image_URL, ID_type, price, max } = req.body;

//     // Xử lý file upload
//     const file = '/img/';
//     console.log(Image_URL);
//     Image_URL = file.concat(Image_URL);

//   await con.query(
//         'INSERT INTO `event`(`Name`, `Start_time`, `End_time`, `Location`, `Description`, `Image_URL`,`Email`, `ID_type`, `Price`, `status`, `Max_Participants`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
//         [name, start, end, location, description, Image_URL, userEmail, ID_type, price, max],
//         function(err, results) {
//             if (err) {
//                 console.error('Error executing query:', err);
//                 return res.status(500).send('An error occurred');
//             } else {
//               req.flash('success_msg', 'Tạo sự kiện thành công');
//               // res.redirect('/create')
//                 res.redirect('/listevent');
//                 // res.render('create', { session: req.session });
               
//             }
//         }
//     );
// };
const Create = async (req, res) => {
    if (req.session.user == null) {
        return res.redirect('/login');
    }

    const userEmail = req.session.user.Email;
    let { name, start, end, location, description, Image_URL, ID_type, price, max } = req.body;

    // Kiểm tra tính hợp lệ của thời gian
    const startTime = new Date(start);
    const endTime = new Date(end);
    const currentTime = new Date();

    if (isNaN(startTime) || isNaN(endTime)) {
        // req.flash('error_msg', 'Thời gian không hợp lệ. Vui lòng nhập lại.');
        return res.render('create', {session: req.session, error_msg: 'Thời gian không hợp lệ. Vui lòng nhập lại.'}  );
    }

    if (startTime >= endTime) {
        // req.flash('error_msg', 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
        return res.render('create', {session: req.session, error_msg: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.'}  );
    }

    if (startTime < currentTime) {
        // req.flash('error_msg', 'Thời gian bắt đầu phải ở tương lai.');
        return res.render('create', {session: req.session, error_msg: 'Thời gian bắt đầu phải ở tương lai.'});
    }

    // Xử lý file upload
    const file = '/img/';
    Image_URL = file.concat(Image_URL);

    // Thực hiện truy vấn chèn dữ liệu
    await con.query(
        'INSERT INTO `event`(`Name`, `Start_time`, `End_time`, `Location`, `Description`, `Image_URL`, `Email`, `ID_type`, `Price`, `status`, `Max_Participants`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [name, start, end, location, description, Image_URL, userEmail, ID_type, price, max],
        function(err, results) {
            if (err) {
                console.error('Error executing query:', err);
                return res.status(500).send('An error occurred');
            } else {
                req.flash('success_msg', 'Tạo sự kiện thành công');
                res.redirect('/listevent');
            }
        }
    );
};


//Hiển thị danh sách sự kiện của người dùng nào đó sau khi đăng nhập
const ListEvent = async (req, res) => {
  
  if (req.session.user == null) {
    return res.redirect('/login'); 
  }
  
  const userEmail = req.session.user.Email;

  
  await con.query(
    `SELECT e.*, COUNT(ep.Email) AS Participant_Count, CASE WHEN e.status = 2 THEN rr.Reason ELSE NULL END AS Reason FROM event e LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event LEFT JOIN rejectionreason rr ON e.ID_Event = rr.ID_Event WHERE e.Email = ? GROUP BY e.ID_Event`,
    [userEmail],
    function(err, results) {
      if (err) throw err;
      
      // Định dạng lại thời gian bắt đầu và kết thúc
      const formattedEvents = results.map(event => ({
        ...event,
        Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
        End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
      }));

      const notify = req.flash('success_msg');
      // Sử dụng res để render trang listevent với kết quả sự kiện
      res.render('listevent', { event: formattedEvents, session: req.session, notify: notify });
    }
  );
}



//đăng kí tham gia sự kiện
// const RegisterEvent = async (req, res) => {
//   try {
//       const eventId = req.params.eventId;

      
//       if (!req.session.user) {
//           return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để đăng ký sự kiện.' });
//       }

//       const userEmail = req.session.user.Email;
//       await con.query(
//           'INSERT INTO event_participants (Email, ID_Event) VALUES (?, ?)',
//           [userEmail, eventId],
//           (err, results) => {
//               if (err) {
//                   console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
//                   return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng ký sự kiện.' });
//               }

//               // Lấy thông tin sự kiện
//               con.query(
//                   `SELECT e.*, COUNT(ep.Email) AS Participant_Count, u.UserName AS Creator_Name
//          FROM event e
//          LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
//          LEFT JOIN user u ON e.Email = u.Email
//          WHERE e.ID_Event = ?`,
//                   [eventId],
//                   (err, eventResults) => {
//                       if (err) {
//                           console.error('Lỗi truy vấn thông tin sự kiện:', err);
//                           return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy thông tin sự kiện.' });
//                       }

//                       if (eventResults.length === 0) {
//                           return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện.' });
//                       }

//                       // Định dạng thời gian
//                       const formatDate = (date) => {
//                           const d = new Date(date);
//                           const day = (`0${d.getDate()}`).slice(-2);
//                           const month = (`0${d.getMonth() + 1}`).slice(-2); 
//                           const year = d.getFullYear();
//                           const hours = (`0${d.getHours()}`).slice(-2);
//                           const minutes = (`0${d.getMinutes()}`).slice(-2);
//                           return `${day}/${month}/${year} ${hours}:${minutes}`;
//                       };

                      
//                       const formattedStartTime = formatDate(eventResults[0].Start_time);
//                       const formattedEndTime = formatDate(eventResults[0].End_time);

                      
//                       return res.json({
//                           success: true,
//                           message: 'Đăng ký thành công!',
//                           event: {
//                               Name: eventResults[0].Name,
//                               Start_time: formattedStartTime,   
//                               End_time: formattedEndTime,       
//                               Location: eventResults[0].Location,
//                               Description: eventResults[0].Description
//                           },
//                           Email: userEmail 
//                       });
//                   }
//               );
//           }
//       );
//   } catch (error) {
//       console.error('Lỗi:', error);
//       return res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại sau.' });
//   }
// };
const RegisterEvent = async (req, res) => {
  try {
      const eventId = req.params.eventId;

      if (!req.session.user) {
          return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để đăng ký sự kiện.' });
      }

      const userEmail = req.session.user.Email;

      // Kiểm tra xem người dùng có phải là người tạo sự kiện không
      con.query(
          'SELECT * FROM event WHERE ID_Event = ? AND Email = ?', 
          [eventId, userEmail],
          (err, results) => {
              if (err) {
                  console.error('Lỗi truy vấn:', err);
                  return res.status(500).json({ success: false, message: 'Lỗi truy vấn. Vui lòng thử lại sau.' });
              }
              
              if (results && results.length > 0) {
                  return res.status(403).json({ success: false, message: 'Người tạo không thể đăng ký sự kiện của chính mình.' });
              }

              // Kiểm tra xem sự kiện đã diễn ra hay chưa
              con.query(
                  'SELECT Start_time, End_time, Max_Participants, Name, Location, Description FROM event WHERE ID_Event = ?',
                  [eventId],
                  (err, results) => {
                      if (err) {
                          console.error('Lỗi truy vấn:', err);
                          return res.status(500).json({ success: false, message: 'Lỗi truy vấn. Vui lòng thử lại sau.' });
                      }

                      if (!results || results.length === 0) {
                          return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện.' });
                      }

                      const event = results[0];
                      const currentTime = new Date();

                      // Nếu sự kiện đã bắt đầu
                      if (new Date(event.Start_time) <= currentTime) {
                          return res.status(400).json({ success: false, message: 'Sự kiện đã diễn ra, bạn không thể đăng ký.' });
                      }

                      // Kiểm tra số lượng người tham gia hiện tại
                      con.query(
                          `SELECT 
                            COUNT(ep.Email) AS Participant_Count
                            FROM event_participants ep 
                            WHERE ep.ID_Event = ?`,
                          [eventId],
                          (err, results) => {
                              if (err) {
                                  console.error('Lỗi truy vấn số lượng người tham gia:', err);
                                  return res.status(500).json({ success: false, message: 'Lỗi truy vấn. Vui lòng thử lại sau.' });
                              }

                              const participantCount = results[0].Participant_Count;
                              const maxParticipants = event.Max_Participants;

                              if (participantCount >= maxParticipants) {
                                  return res.status(400).json({ success: false, message: 'Sự kiện đã đầy, bạn không thể đăng ký.' });
                              }

                              // Kiểm tra nếu người dùng đã đăng ký sự kiện này
                              con.query(
                                  'SELECT * FROM event_participants WHERE Email = ? AND ID_Event = ?',
                                  [userEmail, eventId],
                                  (err, results) => {
                                      if (err) {
                                          console.error('Lỗi truy vấn:', err);
                                          return res.status(500).json({ success: false, message: 'Lỗi truy vấn. Vui lòng thử lại sau.' });
                                      }

                                      if (results && results.length > 0) {
                                          return res.status(400).json({ success: false, message: 'Bạn đã đăng ký sự kiện này trước đó.' });
                                      }

                                      // Thêm người dùng vào danh sách người tham gia
                                      con.query(
                                          'INSERT INTO event_participants (Email, ID_Event) VALUES (?, ?)',
                                          [userEmail, eventId],
                                          (err) => {
                                              if (err) {
                                                  console.error('Lỗi khi thêm người tham gia:', err);
                                                  return res.status(500).json({ success: false, message: 'Lỗi khi thêm người tham gia. Vui lòng thử lại sau.' });
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
                                            const formattedStartTime = formatDate(event.Start_time);
                                            const formattedEndTime = formatDate(event.End_time);
                                              return res.json({
                                                  success: true,
                                                  message: 'Đăng ký thành công!',
                                                  event: {
                                                      Name: event.Name,
                                                      Start_time: formattedStartTime,
                                                      End_time: formattedEndTime,   
                                                      Location: event.Location,
                                                      Description: event.Description
                                                  },
                                                  Email: userEmail 
                                              });
                                          }
                                      );
                                  }
                              );
                          }
                      );
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

  let { name, start, end, location, description, currentImageURL, ID_type, price, max, eventID } = req.body;
  const userEmail = req.session.user.Email;

  let Image_URL;
  try {
  //console.log(req.files.Image_URL);
  // Kiểm tra xem có tệp hình ảnh mới không
  if (req.files && req.files.Image_URL) {
      
      const file = req.files.Image_URL; // Lấy tệp từ req.files
      const uploadPath = './public/img/'; // Đường dẫn đến thư mục lưu hình ảnh
      Image_URL = '/img/' + file.name; // Đường dẫn hình ảnh sẽ lưu trong cơ sở dữ liệu

      // Di chuyển tệp vào thư mục mong muốn
      file.mv(uploadPath + file.name, (err) => {
          if (err) {
              // req.flash('error_msg', 'Lỗi khi tải lên hình ảnh');
              // return res.redirect('/edit/' + eventID);
          }
      });
  } else {
      Image_URL = currentImageURL; // Sử dụng URL hiện tại nếu không có tệp mới
  }

 
      const results = await con.query(
          'UPDATE `event` SET `Name`= ?, `Start_time`= ?, `End_time`= ?, `Location`= ?, `Description`= ?, `Image_URL`= ?, `Email`= ?, `ID_type`= ?, `Price`= ?, `Max_Participants` = ? WHERE ID_Event = ?',
          [name, start, end, location, description, Image_URL, userEmail, ID_type, price, max, eventID]
      );

      if (results.affectedRows === 0) {
          req.flash('error_msg', 'Sự kiện không tồn tại');
          return res.redirect('/edit/' + eventID);
      } else {
          req.flash('success_msg', 'Cập nhật sự kiện thành công');
          return res.redirect('/listevent');
      }
  } catch (error) {
    console.error('Lỗi khi cập nhật sự kiện:', error);
    if (!res.headersSent) {
        req.flash('error_msg', 'Lỗi khi cập nhật sự kiện');
        return res.redirect('/edit/' + eventID);
    }
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
      `SELECT e.*, u.UserName AS Creator_Name, COUNT(ep.Email) AS Participant_Count
         FROM event e
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
         LEFT JOIN user u ON e.Email = u.Email  -- Giả sử e.Email chứa email của người tạo
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
// function isAuthenticated(req, res, next) {
//     if (req.session && req.session.user) {
//         return next();
//     } else {
//         // Thêm thông báo khi chưa đăng nhập
//         return res.send(`
//           <script>
//             alert('Bạn cần đăng nhập trước khi tạo sự kiện.');
//             window.location.href = '/login';
//           </script>
//         `);
//     }
// }

//Danh sách các sự kiện đã tham gia
const Participants = async (req, res) => {
  if (!req.session.user) {
      return res.redirect('/login'); 
  }
  const userEmail = req.session.user.Email;

  try {
      await con.query(
          `SELECT e.*, u.UserName AS Creator_Name 
             FROM event e 
             JOIN event_participants ep ON e.ID_Event = ep.ID_Event 
             JOIN user u ON e.Email = u.Email 
             WHERE ep.Email = ?`, [userEmail],
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
    `SELECT e.*, u.UserName AS Creator_Name, COUNT(ep.Email) AS Participant_Count
     FROM event e
     LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
     LEFT JOIN user u ON e.Email = u.Email  -- Giả sử e.Email chứa email của người tạo
     WHERE e.ID_type = ? AND e.Status = 1
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


//Xem chi tiết sự kiện
const detail = async (req, res) => {
  const eventID = req.params.ID_Event;

  await con.query (
    `SELECT 
       e.*, 
       COUNT(ep.Email) AS Participant_Count, 
       u.UserName AS Creator_Name
     FROM event e
     LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event
     LEFT JOIN user u ON e.Email = u.Email
     WHERE e.ID_Event = ?
     GROUP BY e.ID_Event`, [eventID],
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

      res.render('eventDetail', { event: formattedEvents, session: req.session, notify: req.flash('error_msg') });
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
  // isAuthenticated,
  Participants,
  sendRegistrationEmail,
  searchEventbyType,
  detail
}