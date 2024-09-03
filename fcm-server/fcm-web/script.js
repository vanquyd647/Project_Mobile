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
    } else {
        alert('Failed to send notification.');
    }
});
