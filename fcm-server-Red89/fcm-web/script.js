document.getElementById('notificationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const token = document.getElementById('token').value;
    const title = document.getElementById('title').value;
    const body = document.getElementById('body').value;

    const response = await fetch('http://localhost:3000/send-notification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: token,
            title: title,
            body: body,
        }),
    });

    if (response.ok) {
        alert('Notification sent successfully!');
        loadNotificationHistory();
    } else {
        alert('Failed to send notification.');
    }
});

// Hàm để tải lịch sử thông báo
async function loadNotificationHistory() {
    try {
        const response = await fetch('http://localhost:3000/notification-history');
        const history = await response.json();

        console.log('Notification history:', history); // Thêm dòng này để kiểm tra dữ liệu

        const historyContainer = document.getElementById('historyContainer');
        historyContainer.innerHTML = ''; // Xóa nội dung cũ

        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <p><strong>Token:</strong> ${item.token}</p>
                <p><strong>Title:</strong> ${item.title}</p>
                <p><strong>Body:</strong> ${item.body}</p>
                <p><strong>Timestamp:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
            `;
            historyContainer.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error loading notification history:', error);
    }
}

// Tải lịch sử thông báo khi trang được tải
window.onload = loadNotificationHistory;
