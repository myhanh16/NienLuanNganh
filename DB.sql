-- Sử dụng DB event
USE event;


-- Tạo bảng Event Participants
CREATE TABLE event_participants (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255),
    ID_Event INT,
    FOREIGN KEY (Email) REFERENCES user(Email),
    FOREIGN KEY (ID_Event) REFERENCES event(ID_Event)
);

-- Tạo bảng User
CREATE TABLE user (
    Email VARCHAR(255) PRIMARY KEY,
    Password VARCHAR(255),
    Name_user VARCHAR(255),
    Phone VARCHAR(20),
    admin INT,
    sell INT
);


-- Tạo bảng Type
CREATE TABLE type (
    ID_type INT AUTO_INCREMENT PRIMARY KEY,
    Name_type VARCHAR(255)
);

-- Tạo bảng Event
CREATE TABLE event (
    ID_Event INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Start_time DATETIME NOT NULL,
    End_time DATETIME NOT NULL,
    Host VARCHAR(255) NOT NULL,
    Location VARCHAR(255),
    Description VARCHAR(255),
    Image_URL VARCHAR(255),
    status INT,
    Price INT,
    Email VARCHAR(255),
    FOREIGN KEY (Email) REFERENCES user(Email),
    ID_type INT,
    FOREIGN KEY (ID_type) REFERENCES type(ID_type)
);
