document.getElementById('clientForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const fileInput = document.getElementById('file');
    const messageDiv = document.getElementById('message');
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    }
    
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            messageDiv.textContent = 'Request sent successfully!';
            messageDiv.className = 'success';
            document.getElementById('clientForm').reset();
        } else {
            throw new Error('Submission error');
        }
    } catch (error) {
        messageDiv.textContent = 'An error occurred. Please try again later.';
        messageDiv.className = 'error';
    }
});
