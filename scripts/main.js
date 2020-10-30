import { qs, populateTable, retrieveDataFromUserAndPush, clearInputs } from './utillities.js';
import { getFromLocalStorage, saveToLocalStorage } from './localStorage.js';

let budgetItems = [];
budgetItems = getFromLocalStorage('BudgetItems');
console.log(budgetItems);
if(budgetItems != null) { 
    populateTable(budgetItems);
}
qs('#save').addEventListener(
    'click', () => { 
        console.log("is working!")
        retrieveDataFromUserAndPush(budgetItems);
        saveToLocalStorage('BudgetItems', budgetItems)
        console.log(budgetItems);
        populateTable(budgetItems);
        clearInputs();
    }
);


