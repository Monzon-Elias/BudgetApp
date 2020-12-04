export class BudgetItem {
    constructor(type, date, description, amount) {
        this.id = Date.now();
        this.Type = type,
        this.Date = date,
        this.Description = description,
        this.Amount = amount
    }
}

