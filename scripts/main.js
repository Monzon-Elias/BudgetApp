import { qs, populateTable, saveBudgetItem } from './utilities.js';
import { getFromLS, saveToLS } from './localStorage.js';

let budgetItems = [];
budgetItems = getFromLS('budgetItems');
console.log(budgetItems);

if (budgetItems != null)
    populateTable();
else {
    budgetItems = [];
    saveToLS('budgetItems', budgetItems);
}
//execute add and display budget items list
qs('#save').addEventListener(
    'click', () => {
        console.log("is working!");
        saveBudgetItem();
    }
);




