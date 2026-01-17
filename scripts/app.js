// Budget App - Conectado con autenticación

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : 'https://budgetapp-n1u1.onrender.com/api';

// Variables globales
let budgetItems = [];
let _editMode = false;
let _id = 0;
let token = null;
let slowNoticeTimer = null;

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
        // Show loading spinner
        showDataLoading();
        
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
    } finally {
        // Hide loading spinner
        hideDataLoading();
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

// Funciones de validación visual
function showFieldError(inputId, errorText) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');
    
    input.classList.add('input-error');
    errorElement.textContent = errorText;
    errorElement.classList.add('show');
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');
    
    input.classList.remove('input-error');
    errorElement.classList.remove('show');
    errorElement.textContent = '';
}

function clearAllErrors() {
    clearFieldError('description');
    clearFieldError('amount');
}

// Funciones de presupuesto
async function addBudgetItem() {
    const type = qs('#incomeOrExpense').value;
    const description = qs('#description').value;
    const amount = qs('#amount').value;
    const date = qs('#date').value;
    
    // Clear previous errors
    clearAllErrors();
    
    // Validate required fields
    let hasError = false;
    
    if (!description.trim()) {
        showFieldError('description', 'Description is required');
        hasError = true;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
        showFieldError('amount', 'Please enter a valid amount');
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/budget/items`, {
            method: 'POST',
            body: JSON.stringify({ type, description, amount: parseFloat(amount), dateCreated: date })
        });
        
        if (!response) return;
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error creating item:', errorData);
            return;
        }
        
        const data = await response.json();
        console.log('Item created:', data);
        
        const newItem = {
            id: data._id,
            Type: data.type,
            Date: formatDate(data.dateCreated),
            DateOriginal: data.dateCreated,
            Description: data.description,
            Amount: data.amount
        };
        
        budgetItems.push(newItem);
        
        addRowToTable(newItem);
        updateSummary();
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
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error deleting item:', errorData);
            return;
        }
        
        console.log('Item deleted');
        budgetItems = budgetItems.filter((item) => item.id != budgetItemId);
        removeRow(budgetItemId);
        updateSummary();
    } catch (error) {
        console.error('Error deleting budget item:', error);
    }
}

function editBudgetItem(e) {
    _editMode = true;
    const budgetItemId = e.target.getAttribute('data-id');
    _id = budgetItemId;
    console.log('Editing item:', budgetItemId);
    
    // Clear any validation errors when editing
    clearAllErrors();
    
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
    
    // Clear previous errors
    clearAllErrors();
    
    // Validate required fields
    let hasError = false;
    
    if (!description.trim()) {
        showFieldError('description', 'Description is required');
        hasError = true;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
        showFieldError('amount', 'Please enter a valid amount');
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_URL}/budget/items/${_id}`, {
            method: 'PUT',
            body: JSON.stringify({ type, description, amount: parseFloat(amount), dateCreated: date })
        });
        
        if (!response) return;
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error updating item:', errorData);
            return;
        }
        
        await response.json();
        
        const updatedDate = date || new Date().toISOString().split('T')[0];
        const budgetItem = budgetItems.find((item) => item.id == _id);
        if (budgetItem) {
            budgetItem.Type = type;
            budgetItem.Description = description;
            budgetItem.Amount = parseFloat(amount);
            budgetItem.DateOriginal = updatedDate;
            budgetItem.Date = formatDate(updatedDate);
        }
        
        if (budgetItem) {
            updateRow(budgetItem);
        }
        updateSummary();
        clearInputs();
        _editMode = false;
        _id = 0;
    } catch (error) {
        console.error('Error updating budget item:', error);
    }
}

function handleTableClick(event) {
    const target = event.target;
    if (!target || target.tagName !== 'IMG') return;

    const src = target.getAttribute('src') || '';
    if (src.includes('delete')) {
        deleteBudgetItem(event);
        return;
    }

    if (src.includes('edit')) {
        editBudgetItem(event);
    }
}

function clearInputs() {
    qs('#date').value = '';
    qs('#description').value = '';
    qs('#amount').value = '';
    
    // Clear validation errors when clearing inputs
    clearAllErrors();
}

function getTableBodyForType(type) {
    return type === 'Income' ? qs('#incomes') : qs('#expenses');
}

function createRow(budgetItem) {
    const row = document.createElement('tr');
    row.dataset.id = budgetItem.id;
    row.innerHTML = `
        <td>${budgetItem.Type}</td>
        <td>${budgetItem.Date}</td>
        <td>${budgetItem.Description}</td>
        <td>$${budgetItem.Amount}</td>
        <td><img data-id='${budgetItem.id}' src='delete-24px.svg'></td>
        <td><img data-id='${budgetItem.id}' src='edit-24px.svg'></td>
    `;
    return row;
}

function addRowToTable(budgetItem) {
    const tableBody = getTableBodyForType(budgetItem.Type);
    if (!tableBody) return;
    tableBody.appendChild(createRow(budgetItem));
}

function updateRow(budgetItem) {
    const existingRow = document.querySelector(`tr[data-id="${budgetItem.id}"]`);
    const targetBody = getTableBodyForType(budgetItem.Type);
    if (!targetBody) return;

    if (!existingRow) {
        addRowToTable(budgetItem);
        return;
    }

    if (existingRow.parentElement !== targetBody) {
        existingRow.remove();
        addRowToTable(budgetItem);
        return;
    }

    const cells = existingRow.children;
    if (cells.length >= 4) {
        cells[0].textContent = budgetItem.Type;
        cells[1].textContent = budgetItem.Date;
        cells[2].textContent = budgetItem.Description;
        cells[3].textContent = `$${budgetItem.Amount}`;
    }
}

function removeRow(budgetItemId) {
    const row = document.querySelector(`tr[data-id="${budgetItemId}"]`);
    if (row) {
        row.remove();
    }
}

function updateSummary() {
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

    // Cambiar sombra según presupuesto
    shadowToggle(availableBudget);
}

function populateTable() {
    qs('#incomes').innerHTML = '';
    qs('#expenses').innerHTML = '';
    
    // Poblar tablas
    budgetItems
        .filter((budgetItem) => budgetItem.Type == 'Income')
        .forEach((budgetItem) => {
            addRowToTable(budgetItem);
        });
        
    budgetItems
        .filter((budgetItem) => budgetItem.Type == 'Expense')
        .forEach((budgetItem) => {
            addRowToTable(budgetItem);
        });
        
    updateSummary();
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
    
    // Si llega o supera 100%, mostrar ataúd
    if (percentage >= 100) {
        progressFace.textContent = '⚰️';
        return;
    }
    
    // Calcular índice de carita (ajustado para rango 1-99%)
    const adjustedPercentage = percentage - 1; // Ajustar para empezar en 0
    const adjustedRange = 98; // Rango de 98% (1% a 99%)
    const faceIndex = Math.floor((adjustedPercentage / adjustedRange) * faces.length);
    const currentFace = faces[Math.min(faceIndex, faces.length - 1)];
    
    progressFace.textContent = currentFace;
}

// Loading spinner functions for main page
function showDataLoading() {
    const spinner = document.getElementById('dataLoadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }

    const slowNotice = document.getElementById('slowNotice');
    if (slowNotice) {
        slowNotice.style.display = 'none';
    }

    if (slowNoticeTimer) {
        clearTimeout(slowNoticeTimer);
    }

    slowNoticeTimer = setTimeout(() => {
        if (slowNotice) {
            slowNotice.style.display = 'flex';
        }
    }, 5000);
}

function hideDataLoading() {
    const spinner = document.getElementById('dataLoadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }

    const slowNotice = document.getElementById('slowNotice');
    if (slowNotice) {
        slowNotice.style.display = 'none';
    }

    if (slowNoticeTimer) {
        clearTimeout(slowNoticeTimer);
        slowNoticeTimer = null;
    }
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
    
    // Clear validation errors when user starts typing
    qs('#description').addEventListener('input', function() {
        clearFieldError('description');
    });
    
    qs('#amount').addEventListener('input', function() {
        clearFieldError('amount');
    });

    // Delegated table actions
    const incomesTable = qs('#incomes');
    const expensesTable = qs('#expenses');
    if (incomesTable) {
        incomesTable.addEventListener('click', handleTableClick);
    }
    if (expensesTable) {
        expensesTable.addEventListener('click', handleTableClick);
    }

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
