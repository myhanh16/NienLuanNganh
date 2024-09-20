const session = require('express-session');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale'); // Đảm bảo import đúng locale
const con = require('../config/database');
const CRUD = require('../services/CRUD');
const {ListALLEvent, Login, Register, Logout, Create, ListEvent, RegisterEvent, getEventByID} = require('../services/CRUD');

// const file = '/img/';


// Hàm hiển thị trang chính với dữ liệu sự kiện
const getHome = async (req, res) => {
  try {
    await ListALLEvent(req, res);
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

// const list = async (req, res) => {
//   try{
//     await List (re, res);
//   }
//   catch {
//     res.status(500).send('Lỗi khi tải');
//   }
// }

//Hàm hiển thị danh sách sự kiện người dùng đã tạo
const listevent = async (req, res) => {
  try {
    await ListEvent(req, res);
  } catch (error) {
    res.status(500).send('Lỗi khi tải sự kiện');
  }
};

//Đăng kí sự kiện
const registerevent = async (req, res) => {
  try{
    await RegisterEvent(req, res);
  }
  catch(error) {
    res.status(500).send('Lỗi khi tải sự kiện');
  }
}

const getevent = async (req, res) => {
  try{
    await getEventByID(req, res);
  }
  catch(error) {
    res.status(500).send('Lỗi khi tải sự kiện');
  }
}




module.exports = {
  getHome,
  login,
  register,
  listevent,
  logout,
  create,
  registerevent,
  getevent
};
