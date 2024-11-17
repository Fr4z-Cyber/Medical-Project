document.addEventListener('DOMContentLoaded', () => {
    // Register event listeners only if the elements exist on the page
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', savePatientData);
    }

    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
        registerButton.addEventListener('click', register);
    }

    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }

    // Admin-related event listeners
    const adminRegisterButton = document.getElementById('adminRegisterButton');
    if (adminRegisterButton) {
        adminRegisterButton.addEventListener('click', registerAdmin);
    }

    const adminLoginButton = document.getElementById('adminLoginButton');
    if (adminLoginButton) {
        adminLoginButton.addEventListener('click', adminLogin);
    }

    const addDoctorButton = document.getElementById('addDoctorButton');
    if (addDoctorButton) {
        addDoctorButton.addEventListener('click', addDoctor);
    }

    const doctorLoginButton = document.getElementById('doctorLoginButton');
    if (doctorLoginButton) {
        doctorLoginButton.addEventListener('click', doctorLogin);
    }
});

let token = '';
let userId = '';
let userRole = ''; // To track the user's role (admin or regular)

// Normal user registration
async function register() {
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
        } else {
            const errorData = await response.json();
            alert('Registration failed: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration request failed. Please check the server connection.');
    }
}

// Admin register function
async function registerAdmin() {
    const username = document.getElementById('adminRegisterUsername').value;
    const password = document.getElementById('adminRegisterPassword').value;

    if (!username || !password) {
        alert('Please enter both admin username and password.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/admin/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert('Admin registration successful. Please log in.');
        } else {
            const errorData = await response.json();
            alert('Admin registration failed: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error during admin registration:', error);
        alert('Admin registration request failed. Please check the server connection.');
    }
}

// Normal user login (for index.html)
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Please enter both username and password for login.');
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
            userId = data.userId;
            userRole = data.role; // This will be 'admin' or 'user' based on backend response
            alert('Login successful!');

            // Hide login section and show patient section for regular users
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('registerSection').style.display = 'none';
            document.getElementById('patientSection').style.display = 'block';

            // Show admin functions if the logged-in user is an admin
            if (userRole === 'admin') {
                document.getElementById('doctorSection').style.display = 'block';
            }

            loadPatientData();
        } else {
            const errorData = await response.json();
            alert('Login failed: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Login request failed. Please check the server connection.');
    }
}

// Admin login (for admin.html)
async function adminLogin() {
    const username = document.getElementById('adminLoginUsername').value;
    const password = document.getElementById('adminLoginPassword').value;

    if (!username || !password) {
        alert('Please enter both username and password for admin login.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/admin/login', {  // Changed endpoint to match backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            userId = data.userId;
            userRole = 'admin'; // Set role explicitly for admin login
            alert('Admin login successful!');

            // Hide the login section and show admin functions
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('registerSection').style.display = 'none';
            document.getElementById('doctorSection').style.display = 'block';
        } else {
            const errorData = await response.text();
            alert('Admin login failed: ' + errorData);
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        alert('Login request failed. Please check the server connection.');
    }
}


// Add a doctor (admin only)
async function addDoctor() {
    const doctorUsername = document.getElementById('doctorUsername').value;
    const doctorPassword = document.getElementById('doctorPassword').value;

    if (!doctorUsername || !doctorPassword) {
        alert('Please enter both doctor username and password.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/doctors', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Admin must be authenticated
            },
            body: JSON.stringify({ username: doctorUsername, password: doctorPassword })
        });

        if (response.ok) {
            alert('Doctor added successfully!');
        } else {
            const errorData = await response.json();
            alert('Failed to add doctor: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error adding doctor:', error);
        alert('Failed to add doctor. Please try again later.');
    }
}

// Add new doctor login function
async function doctorLogin() {
    const username = document.getElementById('doctorLoginUsername').value;
    const password = document.getElementById('doctorLoginPassword').value;  // Fixed ID

    if (!username || !password) {
        alert('Please enter both username and password for doctor login.');
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
            localStorage.setItem('userRole', 'doctor');
            
            // Redirect to doctor interface
            window.location.href = 'doctor.html';
        } else {
            const errorData = await response.json();
            alert('Doctor login failed: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error during doctor login:', error);
        alert('Login request failed. Please check the server connection.');
    }
}

// Patient-related functions (unchanged)
async function loadPatientData() {
    try {
        const response = await fetch('http://192.168.100.102:3000/api/patients', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const patientData = await response.json();
            document.getElementById('patientDataDisplay').innerHTML = `
                <p>Name: ${patientData.name}</p>
                <p>Age: ${patientData.age}</p>
                <p>Condition: ${patientData.condition}</p>
                <p>Passport ID: ${patientData.passport_id}</p>
            `;
        } else {
            document.getElementById('patientDataDisplay').innerHTML = 'Please add your patient data.';
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
        alert('Failed to load patient data.');
    }
}

async function savePatientData(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;
    const condition = document.getElementById('condition').value;
    const passport_id = document.getElementById('passport_id').value;

    if (!name || !age || !condition || !passport_id) {
        alert('All fields are required.');
        return;
    }

    try {
        const response = await fetch('http://192.168.100.102:3000/api/patients', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, age, condition, passport_id })
        });

        if (response.ok) {
            alert('Patient data saved successfully!');
            loadPatientData();
        } else {
            const errorData = await response.json();
            alert('Failed to save patient data: ' + (errorData.message || 'Unknown error.'));
        }
    } catch (error) {
        console.error('Error saving patient data:', error);
        alert('Failed to save patient data. Please try again later.');
    }
}
