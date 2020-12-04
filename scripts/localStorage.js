//save a budget item to data store
export function saveToLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
//get a budget item from LS
export function getFromLS(key) {
    return JSON.parse(localStorage.getItem(key));
}

