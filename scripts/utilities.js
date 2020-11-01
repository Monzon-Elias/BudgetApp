import { BudgetItem } from './budgetItem.js';

//get list element
export function qs(selector) {
    return document.querySelector(selector);
}

//retrieve from user
export function retrieveDataFromUserAndPush(budgetItems) {
const budgetItem = new BudgetItem();
        
        budgetItem.Type = qs('#incomeOrExpense').value;
        budgetItem.Date = qs('#date').value;
        budgetItem.Description = qs('#description').value;
        budgetItem.Amount = qs('#amount').value;
        budgetItems.push(budgetItem);
        return budgetItems;
    }

//when budgetItems.length > 0
export function populateTable(budgetItems) {
    qs('tbody').innerHTML = '';

    budgetItems.forEach(
        (budgetItem) => {
            qs('tbody').innerHTML += 
                `<tr>
                    <td>${budgetItem.Type}</td>
                    <td>${budgetItem.Date}</td>
                    <td>${budgetItem.Description}</td>
                    <td>${budgetItem.Amount}</td>
                </tr>`;
        }
    )
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