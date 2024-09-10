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



