const session = require('express-session');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale'); // Đảm bảo import đúng locale
const con = require('../config/database');
const CRUD = require('../services/CRUD');
const {listEvent, Login, Register, Logout, Create} = require('../services/CRUD');

// const file = '/img/';


// Hàm hiển thị trang chính với dữ liệu sự kiện
const getHome = async (req, res) => {
  try {
    await listEvent(req, res);
  } catch (error) {
    res.status(500).send('Lỗi khi tải sự kiện');
  }
};

//Hàm login
const login = async (req, res) => {
  try{
    await Login(req,res);
  }
  catch (error){
    res.status(500).send('Lỗi khi tải')
  }
};

// Hàm đki người dùng
const register = async (req, res) => {
  try{
    await Register(req,res);
  }
  catch (error){
    res.status(500).send('Lỗi khi tải')
  }
};

// Hàm đăng xuất người dùng
const logout = async(req, res) => {
  try{
    await Logout(req,res);
  }
  catch {
    res.status(500).send('Lỗi khi tải')
  }
};


//Tạo sự kiện
const create = async (req, res) => {
  try{
    await Create(req, res);
  }
  catch{
    res.status(500).send('Lỗi khi tải');
  }

};


module.exports = {
  getHome,
  login,
  register,
  // listevent,
  logout,
  create,
};
