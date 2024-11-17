document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in as doctor
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize the interface
    const refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click', fetchQueue);

    // Fetch queue immediately and set up auto-refresh
    fetchQueue();
    setInterval(fetchQueue, 60000); // Refresh every minute
});

async function fetchQueue() {
    const queueContainer = document.getElementById('queueContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch('http://192.168.100.102:3000/api/doctor/queue', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch queue');
        
        const queue = await response.json();
        
        // Clear previous content
        queueContainer.innerHTML = '';
        errorMessage.style.display = 'none';
        
        if (queue.length === 0) {
            queueContainer.innerHTML = `
                <div class="empty-queue">
                    No patients in queue
                </div>
            `;
            return;
        }
        
        // Render each appointment
        queue.forEach(appointment => {
            const appointmentTime = new Date(appointment.appointment_time);
            const card = document.createElement('div');
            card.className = 'patient-card';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 18px;">${appointment.patient_name}</h3>
                    <span class="status-badge ${appointment.status === 'waiting' ? 'status-waiting' : 'status-in-progress'}">
                        ${appointment.status === 'waiting' ? 'Waiting' : 'In Progress'}
                    </span>
                </div>
                <p style="color: #666; margin: 8px 0;">
                    Scheduled: ${appointmentTime.toLocaleTimeString()}
                </p>
                <button 
                    class="complete-btn"
                    onclick="completeAppointment('${appointment.appointment_id}')"
                >
                    Mark as Complete
                </button>
            `;
            queueContainer.appendChild(card);
        });
        
    } catch (err) {
        console.error('Error fetching queue:', err);
        errorMessage.textContent = 'Failed to load queue';
        errorMessage.style.display = 'block';
    }
}

async function completeAppointment(appointmentId) {
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch(`http://192.168.100.102:3000/api/appointments/${appointmentId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to complete appointment');
        
        // Refresh the queue after completing appointment
        fetchQueue();
        
    } catch (err) {
        console.error('Error completing appointment:', err);
        errorMessage.textContent = 'Failed to complete appointment';
        errorMessage.style.display = 'block';
    }
}