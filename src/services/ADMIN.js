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
        `SELECT e.*, COUNT(ep.Email) AS Participant_Count FROM event e LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event WHERE e.status = 0 GROUP BY e.ID_Event`,
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
        `SELECT e.*, rr.Reason, COUNT(ep.Email) AS Participant_Count 
         FROM event e 
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event 
         LEFT JOIN rejectionreason rr ON e.ID_Event = rr.ID_Event 
         WHERE e.status = 1 
         GROUP BY e.ID_Event`,
        function(err, results) {
            if (err) throw err;

            
            if (!results || results.length === 0) {
                
                res.render('approved', { event: [], session: req.session, message: null });
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
            if (err) throw err;
            
            req.flash('success_msg', 'Cập nhật thành công!');
            res.redirect('/approved');
        }
    );
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

        req.flash('success_msg', ' Cập nhật thành công!');
        res.redirect('/disapproved'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Có lỗi xảy ra, vui lòng thử lại.'); 
    }
};

//Danh sách sự kiện không duyệt
const getDisapprove = async (req, res) => {
    if (req.session.user == null) {
        return res.redirect('/login');
    }

    await con.query(
        `SELECT e.*, rr.Reason, COUNT(ep.Email) AS Participant_Count 
         FROM event e 
         LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event 
         LEFT JOIN rejectionreason rr ON e.ID_Event = rr.ID_Event 
         WHERE e.status = 2 
         GROUP BY e.ID_Event`,
        function(err, results) {
            if (err) throw err;

            
            if (!results || results.length === 0) {
                
                res.render('disapproved', { event: [], session: req.session, message: null });
            } else {
                
                const formattedEvents = results.map(event => ({
                    ...event,
                    Start_time: format(new Date(event.Start_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    End_time: format(new Date(event.End_time), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
                    Participant_Count: event.Participant_Count,
                    Reason: event.Reason || 'Không có lý do' 
                }));
                
                const notify = req.flash('success_msg');
                res.render('disapproved', { event: formattedEvents, session: req.session, notify: notify });
            }
        }
    );
}


const ListALLEvent = async (req, res) => {
    await con.query(
        `SELECT e.*, COUNT(ep.Email) AS Participant_Count FROM event e LEFT JOIN event_participants ep ON e.ID_Event = ep.ID_Event GROUP BY e.ID_Event`,
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

module.exports = {
    getApprovedEvents,
    getPendingEvents,
    approveEvent,
    ListALLEvent,
    disapproveEvent,
    getDisapprove
}
