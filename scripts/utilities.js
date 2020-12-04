import { BudgetItem } from './BudgetItem.js';
import { saveToLS, getFromLS } from './localStorage.js';

let _editMode = false;
let _id = 0;
//get list element
export function qs(selector) {
    return document.querySelector(selector);
}

//retrieve from user
export function addBudgetItem() {
const budgetItem = new BudgetItem();
        budgetItem.Type = qs('#incomeOrExpense').value;
        budgetItem.Date = qs('#date').value;
        budgetItem.Description = qs('#description').value;
        budgetItem.Amount = qs('#amount').value;
        let budgetItems = [];
        budgetItems = getFromLS('budgetItems');
        budgetItems.push(budgetItem);
        saveToLS('budgetItems', budgetItems);
        populateTable();
        clearInputs();
    }

//when budgetItems.length > 0
export function populateTable() {
    qs('tbody').innerHTML = '';
    let budgetItems = [];
    budgetItems = getFromLS('budgetItems');
    budgetItems.forEach(
        (budgetItem) => {
            qs('tbody').innerHTML += 
                `<tr>
                    <td>${budgetItem.Type}</td>
                    <td>${budgetItem.Date}</td>
                    <td>${budgetItem.Description}</td>
                    <td>$${budgetItem.Amount}</td>
                    <td><img data-id='${budgetItem.id}' src='delete-24px.svg'></td>
                    <td><img data-id='${budgetItem.id}' src='edit-24px.svg'></td>
                </tr>`; //I changed "id" to "data-id" so I can use it on the future editBudgetItem() method.
        }               //"id" can only be used on one element (in this case on the trash icon), and I need to
                        //create the edit method and attach the data-id to a new "pencil" image that will act
                        //as a "edit button", as the trash can acts as "delete button".
    );
    //this guy populate the list of images (trash cans) and adds an eventListener to each. I tryed this in other
    //file, but it needs to be inside the PRODUCTION LINE, inside this function (that's important).
    
    //delete feature
    let trashCans = document.querySelectorAll('img[src*="del"]');
    trashCans.forEach((image) => {
        image.addEventListener('click', deleteBudgetItem);
    });

    //edit feature
    let pencils = document.querySelectorAll('img[src*="edit"]');
    pencils.forEach((image) => {
        image.addEventListener('click', editBudgetItem);
    });
}

//save budget item
export function saveBudgetItem() {
    if(_editMode) {
        updateBudgetItem();
    }else {
        addBudgetItem();
    }
}

//delete budget item
export function deleteBudgetItem(e) {
    let budgetItemId = e.target.getAttribute('data-id');
    console.log(budgetItemId);
    let budgetItems = [];
    budgetItems = getFromLS('budgetItems');
    let budgetItem = budgetItems.find((budgetItem) => budgetItem.id == budgetItemId);
    const index = budgetItems.indexOf(budgetItem);
    console.log(index);
    budgetItems.splice(index, 1);
    //save to LS
    saveToLS('budgetItems', budgetItems);
    //list the budget items
    populateTable();
}

//edit budget item
export function editBudgetItem(e) {
    _editMode = true;
    let budgetItemId = e.target.getAttribute('data-id');
    _id = budgetItemId;
    console.log(budgetItemId);
    let budgetItems = [];
    budgetItems = getFromLS('budgetItems');
    let budgetItem = budgetItems.find((budgetItem) => budgetItem.id == budgetItemId);
    //put the values of this element back on the input fields so the user can edit them
    qs('#incomeOrExpense').value = budgetItem.Type;
    qs('#date').value = budgetItem.Date;
    qs('#description').value = budgetItem.Description;
    qs('#amount').value = budgetItem.Amount;
}

//update budget item
export function updateBudgetItem() {
    let budgetItems = [];
    budgetItems = getFromLS('budgetItems');
    let budgetItem = budgetItems.find((budgetItem) => budgetItem.id == _id);
    //the user edit the values of the previously stored budget item
    budgetItem.Type = qs('#incomeOrExpense').value;
    budgetItem.Date = qs('#date').value;
    budgetItem.Description = qs('#description').value;
    budgetItem.Amount = qs('#amount').value;
    const index = budgetItems.indexOf(budgetItem);
    console.log(index);
    //I remove the old item and store the edited on back to the array.
    budgetItems.splice(index, 1, budgetItem);
    //save to LS
    saveToLS('budgetItems', budgetItems);
    //list the budget items
    populateTable();
    clearInputs();
    _editMode = false;
    _id = 0;
}

//clear user input
export function clearInputs() {
    qs('#incomeOrExpense').value = '';
        qs('#date').value = '';
        qs('#description').value = '';
        qs('#amount').value = '';
}









            /*
            let tr = document.createElement('tr');

            let tdType = document.createElement('td');
            tdType.textContent = budgetItem.Type;

            let tdDate = document.createElement('td');
            tdDate.textContent = budgetItem.Date;

            let tdDescription = document.createElement('td');
            tdDescription.textContent = budgetItem.Description;

            let tdAmount = document.createElement('td');
            tdAmount.textContent = budgetItem.Amount;

            tr.appendChild(tdType);
            tr.appendChild(tdDate);
            tr.appendChild(tdDescription);
            tr.appendChild(tdAmount);
            

            qs('tbody').appendChild(tr);
            */