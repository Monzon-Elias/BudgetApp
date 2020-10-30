//save a budget item to data store
export function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
//get a budget item from LS
export function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}

