// Budget App - Conectado con autenticación

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://budget-app-backend.onrender.com/api';

// Variables globales
let budgetItems = [];
let _editMode = false;
let _id = 0;
let token = null;

// Clase BudgetItem
class BudgetItem {
    constructor(type, date, description, amount) {
        this.id = Date.now();
        this.Type = type;
        this.Date = date;
        this.Description = description;
        this.Amount = amount;
    }
}

// Funciones de utilidad
function qs(selector) {
    return document.querySelector(selector);
}

// API Helper functions
async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        // Token invalid or expired
        logout();
        return null;
    }
    
    return response;
}

async function loadBudgetItems() {
    try {
        const response = await fetchWithAuth(`${API_URL}/budget/items`);
        if (!response) return;
        
        const data = await response.json();
        budgetItems = data.map(item => ({
            id: item._id,
            Type: item.type,
            Date: formatDate(item.dateCreated),
            DateOriginal: item.dateCreated, // Guardar fecha original para edición
            Description: item.description,
            Amount: item.amount
        }));
        
        populateTable();
    } catch (error) {
        console.error('Error loading budget items:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Funciones de fecha
function dateOfBudget() {
    let d = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    let date = monthNames[d.getMonth()] + ', ' + d.getFullYear();
    console.log(date);
    qs('#bdate').innerHTML = date;   
}

function todayDate() {
    let d = new Date();
    let date = d.getMonth() + 1 + ' - ' + d.getDate() + ' - ' + d.getFullYear();
    qs('#today').innerHTML = date;
}

// Función para formatear fecha a formato legible
function formatDate(dateString) {
    // Si es formato YYYY-MM-DD, extraer mes y día
    if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${parseInt(month)}/${parseInt(day)}`;
    }
    // Si es formato ISO, extraer solo la parte de fecha
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${parseInt(month)}/${parseInt(day)}`;
}

// Funciones de presupuesto
async function addBudgetItem() {
    const type = qs('#incomeOrExpense').value;
    const description = qs('#description').value;
    const amount = qs('#amount').value;
    const date = qs('#date').value;
    
    try {
        const response = await fetchWithAuth(`${API_URL}/budget/items`, {
            method: 'POST',
            body: JSON.stringify({ type, description, amount: parseFloat(amount), dateCreated: date })
        });
        
        if (!response) return;
        
        const data = await response.json();
        console.log('Item created:', data);
        
        await loadBudgetItems();
        clearInputs();
    } catch (error) {
        console.error('Error adding budget item:', error);
    }
}

function saveBudgetItem() {
    if(_editMode) {
        updateBudgetItem();
    } else {
        addBudgetItem();
    }
}

async function deleteBudgetItem(e) {
    const budgetItemId = e.target.getAttribute('data-id');
    console.log('Deleting item:', budgetItemId);
    
    try {
        const response = await fetchWithAuth(`${API_URL}/budget/items/${budgetItemId}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        
        console.log('Item deleted');
        await loadBudgetItems();
    } catch (error) {
        console.error('Error deleting budget item:', error);
    }
}

function editBudgetItem(e) {
    _editMode = true;
    const budgetItemId = e.target.getAttribute('data-id');
    _id = budgetItemId;
    console.log('Editing item:', budgetItemId);
    
    const budgetItem = budgetItems.find((item) => item.id == budgetItemId);
    if (budgetItem) {
        qs('#incomeOrExpense').value = budgetItem.Type;
        qs('#description').value = budgetItem.Description;
        qs('#amount').value = budgetItem.Amount;
        
        // Usar fecha original para el input date
        if (budgetItem.DateOriginal) {
            // Si es formato YYYY-MM-DD, usarlo directamente
            if (budgetItem.DateOriginal.includes('-') && !budgetItem.DateOriginal.includes('T')) {
                qs('#date').value = budgetItem.DateOriginal;
            } else {
                // Si es ISO, extraer solo la parte de fecha
                const datePart = budgetItem.DateOriginal.split('T')[0];
                qs('#date').value = datePart;
            }
        }
    }
}

async function updateBudgetItem() {
    const type = qs('#incomeOrExpense').value;
    const description = qs('#description').value;
    const amount = qs('#amount').value;
    const date = qs('#date').value;
    
    
    try {
        const response = await fetchWithAuth(`${API_URL}/budget/items/${_id}`, {
            method: 'PUT',
            body: JSON.stringify({ type, description, amount: parseFloat(amount), dateCreated: date })
        });
        
        if (!response) return;
        
        const result = await response.json();
        
        await loadBudgetItems();
        clearInputs();
        _editMode = false;
        _id = 0;
    } catch (error) {
        console.error('Error updating budget item:', error);
    }
}

function clearInputs() {
    qs('#date').value = '';
    qs('#description').value = '';
    qs('#amount').value = '';
}

function populateTable() {
    qs('#incomes').innerHTML = '';
    qs('#expenses').innerHTML = '';

    // Sumar total de ingresos
    let totalIncome = budgetItems
        .filter((budgetItem) => budgetItem.Type == 'Income')
        .reduce((total, budgetItem) => {
            return parseFloat(total) + parseFloat(budgetItem.Amount);
        }, 0);
    qs('#totalIncome').innerHTML = totalIncome;
    
    // Sumar total de gastos
    let totalExpense = budgetItems
        .filter((budgetItem) => budgetItem.Type == 'Expense')
        .reduce((total, budgetItem) => {
            return parseFloat(total) + parseFloat(budgetItem.Amount);
        }, 0);
    qs('#totalExpense').innerHTML = totalExpense;

    // Presupuesto disponible
    let availableBudget = totalIncome - totalExpense;
    qs('#availableBudget').innerHTML = availableBudget;
        
    // Porcentaje de ingresos gastados
    let percentage = totalIncome > 0 ? ((100 * totalExpense) / totalIncome) : 0;
    qs('#percentage').innerHTML = percentage.toFixed(2) + '% of total income';
    
    // Actualizar barra de progreso
    qs('#progressBar').style.width = Math.min(percentage, 100) + '%';
    
    // Actualizar caritas
    updateFaces(Math.min(percentage, 100));
    
    // Poblar tablas
    budgetItems
        .filter((budgetItem) => budgetItem.Type == 'Income')
        .forEach((budgetItem) => {
            qs('#incomes').innerHTML += 
                `<tr>
                    <td>${budgetItem.Type}</td>
                    <td>${budgetItem.Date}</td>
                    <td>${budgetItem.Description}</td>
                    <td>$${budgetItem.Amount}</td>
                    <td><img data-id='${budgetItem.id}' src='delete-24px.svg'></td>
                    <td><img data-id='${budgetItem.id}' src='edit-24px.svg'></td>
                </tr>`; 
        });
        
    budgetItems
        .filter((budgetItem) => budgetItem.Type == 'Expense')
        .forEach((budgetItem) => {
            qs('#expenses').innerHTML += 
                `<tr>
                    <td>${budgetItem.Type}</td>
                    <td>${budgetItem.Date}</td>
                    <td>${budgetItem.Description}</td>
                    <td>$${budgetItem.Amount}</td>
                    <td><img data-id='${budgetItem.id}' src='delete-24px.svg'></td>
                    <td><img data-id='${budgetItem.id}' src='edit-24px.svg'></td>
                </tr>`; 
        });

    // Event listeners para eliminar
    let trashCans = document.querySelectorAll('img[src*="del"]');
    trashCans.forEach((image) => {
        image.addEventListener('click', deleteBudgetItem);
    });

    // Event listeners para editar
    let pencils = document.querySelectorAll('img[src*="edit"]');
    pencils.forEach((image) => {
        image.addEventListener('click', editBudgetItem);
    });

    // Cambiar sombra según presupuesto
    shadowToggle(availableBudget);
}

function shadowToggle(availableBudget) {
    if(availableBudget < 0) 
        qs('#availableBudget').style.textShadow = "3px 6px 5px rgb(238, 76, 76) , -3px -6px 5px rgb(238, 76, 76)";
    else 
        qs('#availableBudget').style.textShadow = "3px 6px 5px rgb(7, 253, 68), -3px -6px 5px rgb(7, 253, 68)";
}

// Función para actualizar la carita
function updateFaces(percentage) {
    const faces = ['😀', '😆', '😁', '🤭', '😐', '😬', '😕', '😳', '😨', '😱'];
    const progressFace = qs('#progressFace');
    
    if (!progressFace) return;
    
    // Si el porcentaje es menor a 1%, no mostrar carita
    if (percentage < 1) {
        progressFace.textContent = '';
        return;
    }
    
    // Si el porcentaje es mayor a 99%, no mostrar carita
    if (percentage > 99) {
        progressFace.textContent = '';
        return;
    }
    
    // Calcular índice de carita (ajustado para rango 1-99%)
    const adjustedPercentage = percentage - 1; // Ajustar para empezar en 0
    const adjustedRange = 98; // Rango de 98% (1% a 99%)
    const faceIndex = Math.floor((adjustedPercentage / adjustedRange) * faces.length);
    const currentFace = faces[Math.min(faceIndex, faces.length - 1)];
    
    progressFace.textContent = currentFace;
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        // Redirect immediately without showing content
        window.location.replace('login.html');
        return;
    }
    
    // Show main container after authentication check
    qs('#mainContainer').style.display = 'block';
    
    // Display user info
    if (user.email) {
        qs('#userEmail').textContent = user.email;
    }
    
    // Logout button
    qs('#logoutBtn').addEventListener('click', logout);

    // Cargar datos del servidor
    await loadBudgetItems();

    // Configurar fechas
    dateOfBudget();
    todayDate();

    // Event listener para el botón guardar
    qs('#save').addEventListener('click', function() {
        console.log("Saving budget item...");
        saveBudgetItem();
    });
});
