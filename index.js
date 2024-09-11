require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const configViewEngine = require ('./src/config/viewEngine')
const webRouter = require('./src/routes/web');
const con = require('./src/config/database')

const hostname = process.env.HOSTNAME;
const port = process.env.PORT || 3000;

// Cấu hình session
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // secure: true nếu sử dụng HTTPS
}));

//config req.body
app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true })) // for form data

//const storage = multer.memoryStorage();
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/img'); // Thư mục để lưu file (đảm bảo thư mục này tồn tại)
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname); // Lấy phần đuôi file
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension); // Tạo tên file duy nhất
  }
});
const upload = multer({ storage: storage });


//config template 
configViewEngine(app);

//Khai báo route
app.use('/',webRouter);


con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!!!")
});




app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
