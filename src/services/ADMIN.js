const con = require('../config/database');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale');
const session = require('express-session');
const { search } = require('../routes/web');
const nodemailer = require('nodemailer');
require('dotenv').config();

//Danh sách sự kiện chưa duyệt
const getPendingEvents = async (req, res) => {
    if (req.session.user == null) {
        return res.redirect('/login');
    }

    await con.query(
        `SELECT e.*, u.UserName AS Creator_Name, COUNT(ep.Email) AS Participant_Count 
         FROM event e 
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event 
         LEFT JOIN user u ON e.Email = u.Email  -- Join with the user table to get the creator's name
         WHERE e.status = 0 
         GROUP BY e.ID_Event`,
        function(err, results) {
            if (err) throw err;

            
            if (!results || results.length === 0) {
                
                res.render('pending', { event: [], session: req.session, message: null });
            } else {
                
                const formattedEvents = results.map(event => ({
                    ...event,
                    Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    Participant_Count: event.Participant_Count 
                }));
                
               
                res.render('pending', { event: formattedEvents, session: req.session });
            }
        }
    );
};


//Danh sách sự kiện đã duyệt
const getApprovedEvents = async (req, res) => {
    if (req.session.user == null) {
        return res.redirect('/login');
    }
    await con.query(
        `SELECT e.*, u.UserName AS Creator_Name, COUNT(ep.Email) AS Participant_Count 
         FROM event e 
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event 
         LEFT JOIN user u ON e.Email = u.Email  -- Join with the user table to get the creator's name
         WHERE e.status = 1 
         GROUP BY e.ID_Event`,
        function(err, results) {
            if (err) throw err;

            
            if (!results || results.length === 0) {
                // const notify = req.flash('success_msg', 'Không tìm thấy sự kiện nào không duyệt.');
                res.render('approved', { event: [], session: req.session, mess: null});
            } else {
                
                const formattedEvents = results.map(event => ({
                    ...event,
                    Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    Participant_Count: event.Participant_Count,
                    Reason: event.Reason || 'Không có lý do' 
                }));
                
                const notify = req.flash('success_msg');
                res.render('approved', { event: formattedEvents, session: req.session, notify: notify });
            }
        }
    );
};

//Duyệt sự kiện
const approveEvent = async (req, res) => {
    const eventId = req.params.ID_Event;

    await con.query(
        'UPDATE event SET status = 1 WHERE ID_Event = ?', [eventId],
        function(err, results) {
            if (err) {
                console.error('Lỗi khi cập nhật sự kiện:', err);
                return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật sự kiện.' });
            }

            con.query(
                'SELECT * FROM event WHERE ID_Event = ?', 
                [eventId],
                async (err, eventResults) => {
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
                    const userEmail = eventResults[0].Email; 

                    // Gửi email cho người tạo sự kiện
                    try {
                        await sendEmail(userEmail, eventResults[0].Name, formattedStartTime, formattedEndTime, eventResults[0].Location);
                    } catch (emailErr) {
                        console.error('Lỗi gửi email:', emailErr);
                        return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi gửi email.' });
                    }

                    
                    req.flash('success_msg', 'Cập nhật thành công!');
                    res.redirect('/approved'); 
                }
            );
        }
    );
};

//Gửi mail khi đồng ý duyệt sự kiện
const sendEmail = async (to, eventName, startTime, endTime, location) => {
    // Thiết lập transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        }
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER, 
        to: to,
        subject: `Sự kiện "${eventName}" đã được chấp thuận`,
        text: `Sự kiện "${eventName}" của bạn đã được chấp thuận!\n\n` +
              `Thời gian bắt đầu: ${startTime}\n` +
              `Thời gian kết thúc: ${endTime}\n` +
              `Địa điểm: ${location}\n\n` +
              `Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`
    };

    
    await transporter.sendMail(mailOptions);
};


//Lấy lí do không duyệt sự kiện
const disapproveEvent = async (req, res) => {
    if (req.session.user == null) {
        return res.redirect('/login');
    }

    const id = req.params.ID_Event; 
    const { reason } = req.body; 
    console.log(id);
    try {
        
        await con.query('UPDATE event SET status = 2 WHERE ID_Event = ?', [id]);

        
        await con.query('INSERT INTO rejectionreason (ID_Event, ID_status, Reason) VALUES (?, 2, ?)', [id, reason]);

        con.query(
            'SELECT * FROM event WHERE ID_Event = ?', 
            [id],
            async (err, eventResults) => {
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
                const userEmail = eventResults[0].Email; 

                // Gửi email cho người tạo sự kiện
                try {
                    await sendRejectionEmail(userEmail, eventResults[0].Name, formattedStartTime, formattedEndTime, eventResults[0].Location, reason);
                } catch (emailErr) {
                    console.error('Lỗi gửi email:', emailErr);
                    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi gửi email.' });
                }

                 
            }
        );

        req.flash('success_msg', ' Cập nhật thành công!');
        res.redirect('/disapproved'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Có lỗi xảy ra, vui lòng thử lại.'); 
    }
};


//Gui mail khi tu choi duyet su kien
const sendRejectionEmail = async (to, eventName, startTime, endTime, location, reason) => {
    // Thiết lập transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        }
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER, 
        to: to,
        subject: `Sự kiện "${eventName}" đã được không chấp thuận`,
        text: `Sự kiện "${eventName}" của bạn đã được chấp thuận!\n\n` +
              `Thời gian bắt đầu: ${startTime}\n` +
              `Thời gian kết thúc: ${endTime}\n` +
              `Địa điểm: ${location}\n` +
              `Lý do: ${reason}\n\n` +
              `Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`
    };

    
    await transporter.sendMail(mailOptions);
};

//Danh sách sự kiện không duyệt
const getDisapprove = async (req, res) => {
    if (req.session.user == null) {
        return res.redirect('/login');
    }
    await con.query(
        `SELECT e.*, u.UserName AS Creator_Name, COUNT(ep.Email) AS Participant_Count 
         FROM event e 
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event 
         LEFT JOIN user u ON e.Email = u.Email  -- Join with the user table to get the creator's name
         WHERE e.status = 2 
         GROUP BY e.ID_Event`,
        function(err, results) {
            if (err) throw err;

            
            if (!results || results.length === 0) {
                //const notify = req.flash('success_msg', 'Không tìm thấy sự kiện nào không duyệt.');
                res.render('disapproved', { event: [], session: req.session, mess: null });
            } else {
                
                const formattedEvents = results.map(event => ({
                    ...event,
                    Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    Participant_Count: event.Participant_Count,
                    Reason: event.Reason || 'Không có lý do' 
                }));
                
                const notify = req.flash('success_msg','Cập nhật thành công!');

                res.render('disapproved', { event: formattedEvents, session: req.session, notify: notify });
            }
        }
    );
};


const ListALLEvent = async (req, res) => {
    await con.query(
        `SELECT e.*, u.UserName AS Creator_Name, COUNT(ep.Email) AS Participant_Count 
         FROM event e 
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event 
         LEFT JOIN user u ON e.Email = u.Email  -- Join with user table to get the creator's name
         GROUP BY e.ID_Event`,
        function(err, results) {
            if (err) throw err;
            
            
            const formattedEvents = results.map(event => ({
                ...event,
                Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                Participant_Count: event.Participant_Count 
            }));
            res.render('all_event', { event: formattedEvents, session: req.session });
        }
    );
};

//Danh sách người dùng 
const listUser = async (req, res) => {
    if(!req.session && req.session.user == null ){
        return res.redirect('/login');
    }
    await con.query (
        `SELECT Email, UserName, Phone FROM user where admin = 0`,
        function (error, results) {
            if(error) throw err;
            res.render('userList', {user: results, session: req.session});
        }
    );
};

module.exports = {
    getApprovedEvents,
    getPendingEvents,
    approveEvent,
    ListALLEvent,
    disapproveEvent,
    getDisapprove,
    sendEmail,
    sendRejectionEmail,
    listUser
}
