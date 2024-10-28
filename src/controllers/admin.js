const session = require('express-session');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale'); // Đảm bảo import đúng locale
const con = require('../config/database');
const CRUD = require('../services/ADMIN');
const {  getApprovedEvents, getPendingEvents, approveEvent, ListALLEvent, disapproveEvent, getDisapprove} = require('../services/ADMIN');

const getapprovedEvents = async (req, res) => {
    try {
      await getApprovedEvents(req, res);
    } catch (error) {
      res.status(500).send('Lỗi khi tải sự kiện');
    }
};

const getpendingEvents = async(req, res) => {
    try {
        await getPendingEvents(req, res);
      } catch (error) {
        res.status(500).send('Lỗi khi tải sự kiện');
      }
}

const ApproveEvent = async(req, res) => {
    try {
        await approveEvent(req, res);
      } catch (error) {
        res.status(500).send('Lỗi khi tải sự kiện');
      }
}

const listEvent = async(req, res) => {
    try {
        await ListALLEvent(req, res);
      } catch (error) {
        res.status(500).send('Lỗi khi tải sự kiện');
      }
}

const disapprove = async(req, res) => {
  try {
      await disapproveEvent(req, res);
    } catch (error) {
      res.status(500).send('Lỗi khi tải sự kiện');
    }
}

const getdisapprove = async(req, res) => {
  try {
      await getDisapprove(req, res);
    } catch (error) {
      res.status(500).send('Lỗi khi tải sự kiện');
    }
}

module.exports = {
    getapprovedEvents,
    getpendingEvents,
    ApproveEvent,
    listEvent,
    disapprove,
    getdisapprove
}