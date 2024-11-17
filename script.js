document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerButton').addEventListener('click', register);
    document.getElementById('loginButton').addEventListener('click', login);
    document.getElementById('patientForm').addEventListener('submit', savePatientData);
});

let token = '';
let userId = '';

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
            userId = data.userId; // Assuming the backend sends userId
            alert('Login successful!');
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('registerSection').style.display = 'none';
            document.getElementById('patientSection').style.display = 'block';
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
