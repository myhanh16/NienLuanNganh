const path = require('path');
const express = require('express');

const configViewEngine = (app) => {
    
    //khai báo nơi lưu trữ ejs
    app.set('views', path.join('src', 'views'));
    app.set('view engine','ejs');

    //Cấu hình static 
    app.use(express.static(path.join('src','public')))
} 

module.exports = configViewEngine;