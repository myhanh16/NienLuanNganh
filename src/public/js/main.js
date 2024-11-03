// Main JavaScript file (main.js)

function toggleDropdown() {
    var dropdown = document.getElementById("dropdownMenu");
    var display = dropdown.style.display;
    dropdown.style.display = (display === "block" || display === "") ? "none" : "block";
}

// Đóng menu nếu nhấp chuột bên ngoài menu
window.onclick = function(event) {
    if (!event.target.matches('.fa-chevron-circle-down')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.style.display === "block") {
                openDropdown.style.display = "none";
            }
        }
    }
}


//lấy dữ liệu và cập nhật lưới sản phẩm khi loại sự kiện thay đổi
document.addEventListener('DOMContentLoaded', () => {
    const eventTypeSelect = document.getElementById('event-type');
    const productGrid = document.getElementById('product-grid');

    eventTypeSelect.addEventListener('change', function() {
        const typeId = this.value;
        if (typeId) {
            fetch(`/events/type/${typeId}`)
                .then(response => response.json())
                .then(events => {
                    productGrid.innerHTML = ''; // Xóa nội dung cũ
                    events.forEach(event => {
                        const item = document.createElement('div');
                        item.className = 'product-item';
                        item.innerHTML = `
                            <img src="${event.Image_URL}" alt="${event.Name}">
                            <h3>${event.Name}</h3>
                            <p>${event.Description}</p>
                            <p><strong>Start:</strong> ${event.Start_time}</p>
                            <p><strong>End:</strong> ${event.End_time}</p>
                            <p><strong>Host:</strong> ${event.Host}</p>
                            <p><strong>Location:</strong> ${event.Location}</p>
                        `;
                        productGrid.appendChild(item);
                    });
                })
                .catch(error => console.error('Error fetching events:', error));
        } else {
            productGrid.innerHTML = ''; // Xóa nội dung nếu không có loại nào được chọn
        }
    });
});


//Định dạng ngày giờ Việt Nam
    document.addEventListener("DOMContentLoaded", function() {
        const formatDateTime = (datetime) => {
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Asia/Ho_Chi_Minh' // Thiết lập múi giờ của Việt Nam
            };
            return new Intl.DateTimeFormat('vi-VN', options).format(new Date(datetime));
        };

        document.querySelectorAll('.product-item').forEach(item => {
            const startTime = item.querySelector('.start-time');
            const endTime = item.querySelector('.end-time');
            if (startTime && endTime) {
                startTime.textContent = formatDateTime(startTime.textContent);
                endTime.textContent = formatDateTime(endTime.textContent);
            }
        });
});



//Xử lý hiển thị hình ảnh khi tải file lên
function previewImage(event) {
        var file = event.target.files[0];
        var reader = new FileReader();
    
        reader.onload = function(e) {
            var img = document.getElementById('image-preview');
            img.src = e.target.result;
            img.style.display = 'block'; // Hiển thị hình ảnh
        };
    
        if (file) {
            reader.readAsDataURL(file);
        }
}



// Hàm để xử lý đăng ký tham gia sự kiện
// function registerEvent(eventId) {
//     console.log(`Đăng ký sự kiện với ID: ${eventId}`);

//     if (confirm(`Bạn có muốn đăng ký sự kiện ${eventId} này không?`)) {
//         fetch(`/registerevent/${eventId}`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Requested-With': 'XMLHttpRequest'
//             },
//             body: JSON.stringify({ eventId: eventId })
//         })
//         .then(response => {
//             if (response.status === 401) {
//                 if (confirm('Bạn cần đăng nhập để đăng ký sự kiện này. Bạn có muốn đăng nhập không?')) {
//                     window.location.href = '/login';
//                 }
//                 return;
//             }
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             if (!data) return;

//             if (data.success) {
//                 alert(data.message);

//                 // Lấy thông tin sự kiện từ phản hồi và gửi email
//                 const eventDetails = {
//                     eventName: data.event.Name,
//                     startTime: data.event.Start_time,
//                     endTime: data.event.End_time,
//                     location: data.event.Location,
//                     description: data.event.Description,
//                     // eventId: eventId
//                 };
//                 console.log('Event details:', eventDetails);

//                 // Gửi email qua route sendEmail
//                 fetch('/sendEmail', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({
//                         userEmail: data.Email,
//                         eventDetails: eventDetails
//                     })
//                 })
//                 .then(res => res.text())
//                 .then(msg => console.log(msg))
//                 .catch(err => console.error('Lỗi khi gửi email:', err));
//             } else {
//                 alert(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại');
//             }
//         })
//         .catch(error => {
//             console.error('Lỗi:', error);
//             alert('Đã xảy ra lỗi. Vui lòng thử lại!!!');
//         });
//     }
// }

// function registerEvent(eventId) {
//     console.log(`Đăng ký sự kiện với ID: ${eventId}`);

//     if (confirm(`Bạn có muốn đăng ký sự kiện ${eventId} này không?`)) {
//         fetch(`/registerevent/${eventId}`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Requested-With': 'XMLHttpRequest'
//             },
//             body: JSON.stringify({ eventId: eventId })
//         })
//         .then(response => {
//             if (response.status === 401) {
//                 if (confirm('Bạn cần đăng nhập để đăng ký sự kiện này. Bạn có muốn đăng nhập không?')) {
//                     window.location.href = '/login';
//                 }
//                 return;
//             } else if (response.status === 403) { 
//                 return response.json().then(data => {
//                     alert(data.message); // Thông báo: "Người tạo không thể đăng ký sự kiện của chính mình."
//                 });
//             } else if (response.status === 400) { 
//                 return response.json().then(data => {
//                     alert(data.message); // Thông báo: "Bạn đã đăng ký sự kiện này rồi."
//                 });
//             } else if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             if (!data) return;

//             if (data.success) {
//                 alert(data.message);

//                 // Lấy thông tin sự kiện từ phản hồi và gửi email
//                 const eventDetails = {
//                     eventName: data.event.Name,
//                     startTime: data.event.Start_time,
//                     endTime: data.event.End_time,
//                     location: data.event.Location,
//                     description: data.event.Description,
//                 };
//                 console.log('Event details:', eventDetails);

//                 // Gửi email qua route sendEmail
//                 fetch('/sendEmail', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify({
//                         userEmail: data.Email,
//                         eventDetails: eventDetails
//                     })
//                 })
//                 .then(res => res.text())
//                 .then(msg => console.log(msg))
//                 .catch(err => console.error('Lỗi khi gửi email:', err));
//             } else {
//                 alert(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại');
//             }
//         })
//         .catch(error => {
//             console.error('Lỗi:', error);
//             alert('Đã xảy ra lỗi. Vui lòng thử lại!!!');
//         });
//     }
// }

function registerEvent(eventId, eventName) {
    console.log(`Đăng ký sự kiện với ID: ${eventId}`);

    // Use eventName for confirmation message
    if (confirm(`Bạn có muốn đăng ký sự kiện "${eventName}" không?`)) {
        fetch(`/registerevent/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ eventId: eventId })
        })
        .then(response => {
            if (response.status === 401) {
                if (confirm('Bạn cần đăng nhập để đăng ký sự kiện này. Bạn có muốn đăng nhập không?')) {
                    window.location.href = '/login';
                }
                return;
            } else if (response.status === 403) { 
                return response.json().then(data => {
                    alert(data.message); // Thông báo: "Người tạo không thể đăng ký sự kiện của chính mình."
                });
            } else if (response.status === 400) { 
                return response.json().then(data => {
                    alert(data.message); // Thông báo: "Bạn đã đăng ký sự kiện này rồi."
                });
            } else if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;

            if (data.success) {
                alert(data.message);

                // Lấy thông tin sự kiện từ phản hồi và gửi email
                const eventDetails = {
                    eventName: data.event.Name,
                    startTime: data.event.Start_time,
                    endTime: data.event.End_time,
                    location: data.event.Location,
                    description: data.event.Description,
                };
                console.log('Event details:', eventDetails);

                // Gửi email qua route sendEmail
                fetch('/sendEmail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userEmail: data.Email,
                        eventDetails: eventDetails
                    })
                })
                .then(res => res.text())
                .then(msg => console.log(msg))
                .catch(err => console.error('Lỗi khi gửi email:', err));
            } else {
                alert(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại');
            }
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Đã xảy ra lỗi. Vui lòng thử lại!!!');
        });
    }
}





//Hàm hiển thị bảng thông báo xóa sự kiện
function confirmDelete(eventId, eventName) {
    var confirmed = confirm('Bạn muốn xóa sự kiện tên "' + eventName + '"?');
    if (confirmed) {
        // Nếu người dùng nhấn OK, chuyển hướng tới trang xóa sự kiện
        window.location.href = '/delete/' + eventId;
    }
}

function checkLoginStatus() {
    // Check if the user is logged in using a server-side variable
    const isLoggedIn = document.getElementById('isLoggedIn').value === 'true';
    return isLoggedIn;
}


//Tim kiem su kien theo loai su kien
document.getElementById('event-type').addEventListener('change', function() {
    const eventType = this.value;
    console.log("Giá trị loại sự kiện được chọn: ", eventType);

    // Chuyển hướng người dùng tới route tìm kiếm với loại sự kiện đã chọn
    if (eventType) {
        window.location.href = `/searchbyType?event_type=${eventType}`;
    }
});


// Lí do không duyệt sự kiện
function showModal(eventId) {
    // Hiển thị modal
    document.getElementById("disapproveModal").style.display = "block";
    
    // Cập nhật action cho form
    const form = document.getElementById("disapproveForm");
    form.action = `/disapproved/${eventId}`;
}

function closeModal() {
    document.getElementById("disapproveModal").style.display = "none";
}

// Đóng modal khi nhấn bên ngoài
window.onclick = function(event) {
    const modal = document.getElementById("disapproveModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

//Hien thi thong bao hoi duyet su kien
function confirmApproval(name) {
    return confirm(`Bạn có chắc chắn muốn duyệt sự kiện ${name} không?`);
}