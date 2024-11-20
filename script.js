document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');

    // Sections
    const patientLoginSection = document.getElementById('patientLoginSection');
    const registerSection = document.getElementById('registerSection');
    const doctorLoginSection = document.getElementById('doctorLoginSection');

    // Links
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showDoctorLoginLink = document.getElementById('showDoctorLoginLink');
    const showPatientLoginLinks = document.querySelectorAll('#showPatientLoginLink, #showPatientLoginLinkFromDoctor');

    // Buttons
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const doctorLoginButton = document.getElementById('doctorLoginButton');
    const bookAppointmentButton = document.getElementById('bookAppointmentButton');

    // Check and attach event listeners
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switching to register section.');
            if (patientLoginSection) patientLoginSection.style.display = 'none';
            if (registerSection) registerSection.style.display = 'block';
        });
    }

    if (showDoctorLoginLink) {
        showDoctorLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switching to doctor login section.');
            if (patientLoginSection) patientLoginSection.style.display = 'none';
            if (doctorLoginSection) doctorLoginSection.style.display = 'block';
        });
    }

    if (showPatientLoginLinks) {
        showPatientLoginLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Switching to patient login section.');
                if (registerSection) registerSection.style.display = 'none';
                if (doctorLoginSection) doctorLoginSection.style.display = 'none';
                if (patientLoginSection) patientLoginSection.style.display = 'block';
            });
        });
    }

    if (loginButton) {
        loginButton.addEventListener('click', login);
    }

    if (registerButton) {
        registerButton.addEventListener('click', register);
    }

    if (doctorLoginButton) {
        doctorLoginButton.addEventListener('click', doctorLogin);
    }

    if (bookAppointmentButton) {
        bookAppointmentButton.addEventListener('click', bookAppointment);
    }
});

let token = '';

// Login Function
async function login() {
    console.log('Login button clicked.');
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            alert('Login successful!');
            console.log('Login successful:', data);

            const patientSection = document.getElementById('patientSection');
            if (patientLoginSection) patientLoginSection.style.display = 'none';
            if (patientSection) patientSection.style.display = 'block';

            loadPatientData();
        } else {
            const errorData = await response.json();
            alert('Login failed: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
}

// Register Function
async function register() {
    console.log('Register button clicked.');
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    if (!username || !password) {
        alert('Please enter both username and password for registration.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert('Registration successful. Please log in.');
            console.log('Registration successful.');
            if (registerSection) registerSection.style.display = 'none';
            if (patientLoginSection) patientLoginSection.style.display = 'block';
        } else {
            const errorData = await response.json();
            alert('Registration failed: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error during registration:', error);
    }
}

// Doctor Login Function
async function doctorLogin() {
    console.log('Doctor login button clicked.');
    const username = document.getElementById('doctorLoginUsername').value;
    const password = document.getElementById('doctorLoginPassword').value;

    if (!username || !password) {
        alert('Please enter both doctor username and password.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/doctor/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.doctorId);
            alert('Doctor login successful!');
            console.log('Doctor login successful:', data);
            window.location.href = 'doctor.html';
        } else {
            const errorData = await response.json();
            alert('Doctor login failed: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error during doctor login:', error);
    }
}

// Load Patient Data
async function loadPatientData() {
    console.log('Loading patient data.');
    try {
        const response = await fetch('http://192.168.100.102:3000/api/patients', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const [patientData] = await response.json();
            const display = document.getElementById('patientDataDisplay');
            if (display) {
                display.innerHTML = `
                    <p>Name: ${patientData?.name || 'N/A'}</p>
                    <p>Age: ${patientData?.age || 'N/A'}</p>
                    <p>Condition: ${patientData?.condition || 'N/A'}</p>
                    <p>Passport ID: ${patientData?.passport_id || 'N/A'}</p>
                `;
            }
        } else {
            console.error('Failed to load patient data.');
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
    }
}

// Book Appointment Function
async function bookAppointment() {
    console.log('Book appointment button clicked.');
    const specialist = document.getElementById('specialistDropdown').value;

    if (!specialist) {
        alert('Please select a specialist.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/appointments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ specialist })
        });

        if (response.ok) {
            alert('Appointment booked successfully!');
        } else {
            const errorData = await response.json();
            alert('Error booking appointment: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
    }
}