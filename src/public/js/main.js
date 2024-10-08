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
function registerEvent(eventId) {
    console.log(`Đăng ký sự kiện với ID: ${eventId}`);
    // Hiển thị hộp thoại xác nhận với ID sự kiện
    if (confirm(`Bạn có muốn đăng ký sự kiện ${eventId} này không?`)) { 
        // Nếu người dùng chọn OK, gửi yêu cầu đăng ký sự kiện
        fetch(`/registerevent/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ eventId: eventId })
        })
        .then(response => {
            if (response.status === 401) { // Kiểm tra nếu người dùng chưa đăng nhập
                if (confirm('Bạn cần đăng nhập để đăng ký sự kiện này. Bạn có muốn đăng nhập không?')) {
                    window.location.href = '/login'; // Chuyển hướng đến trang đăng nhập
                }
                return; // Dừng việc tiếp tục xử lý sau khi chuyển hướng
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data) return; // Dừng xử lý nếu không có dữ liệu (do đã chuyển hướng)
            
            console.log(data);
            if (data.success) {
                alert(data.message); // Hiển thị thông báo thành công
                // Cập nhật giao diện nếu cần (VD: đổi trạng thái icon trái tim)
                const eventDetails = {
                    eventName: data.Name,
                    startTime: data.Start_time,
                    endTime: data.End_time,
                    location: data.Location,
                    description: data.Description,
                    eventId: eventId
                };
                // sendEmail(data.Email, eventDetails);
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
                alert(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại'); // Hiển thị thông báo lỗi
            }
        })
        .catch(error => {
            console.error('Lỗi:', error); // Ghi lại lỗi
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
