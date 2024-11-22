let userName = '';
let expenses = [];
let income = 0.0;
let savings = 0.0;
let userId = null;
let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

const dbName = 'budgetAppDB';
let db;

// Conectar ao banco de dados (IndexedDB)
function openDb() {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = function(event) {
        db = event.target.result;

        const usersStore = db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
        usersStore.createIndex("name", "name", { unique: false });

        const expensesStore = db.createObjectStore("expenses", { keyPath: "id", autoIncrement: true });
        expensesStore.createIndex("userId", "userId", { unique: false });
        expensesStore.createIndex("expenseDay", "expenseDay", { unique: false });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
    };
}

// Função para pedir o nome do usuário
function askName() {
    const name = prompt('Qual é o seu nome?');
    if (!name) {
        alert('O nome é obrigatório!');
        return askName();
    }
    userName = name;
    askExpenses();
}

// Função para pedir as despesas
function askExpenses() {
    expenses = [];
    let expense;
    while (true) {
        expense = prompt('Digite o nome da despesa ou "fim" para terminar:');
        if (expense.toLowerCase() === 'fim') {
            break;
        }
        const value = parseFloat(prompt(`Qual o valor de ${expense} (em €)?`));
        if (isNaN(value) || value <= 0) {
            alert('O valor da despesa deve ser positivo!');
            continue;
        }
        expenses.push({ name: expense, value: value });
    }
    askIncome();
}

// Função para pedir a renda
function askIncome() {
    income = parseFloat(prompt('Qual é a sua receita mensal (em €)?'));
    if (isNaN(income) || income <= 0) {
        alert('A receita mensal deve ser positiva!');
        return askIncome();
    }
    calculateBalance();
}

// Calcular o saldo
function calculateBalance() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0);
    const balance = income - totalExpenses;
    askSavings(balance);
}

// Função para perguntar se o usuário deseja poupar
function askSavings(balance) {
    const saveChoice = prompt('Você deseja poupar uma porcentagem? (sim/não)');
    if (saveChoice.toLowerCase() === 'sim') {
        const percentage = parseFloat(prompt('Qual porcentagem você deseja poupar?'));
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            alert('Porcentagem inválida! Deve estar entre 0 e 100.');
            return askSavings(balance);
        }
        savings = balance * (percentage / 100);
    }

    saveUserData(balance - savings);
    showSummary(balance - savings);
}

// Salvar os dados do usuário no banco de dados
function saveUserData(finalBalance) {
    const transaction = db.transaction(['users', 'expenses'], 'readwrite');
    const userStore = transaction.objectStore('users');
    const user = { name: userName, balance: finalBalance, savings: savings, month: currentMonth };
    const userRequest = userStore.add(user);
    userRequest.onsuccess = function() {
        userId = userRequest.result;
        saveExpenses();
    };
}

// Salvar as despesas no banco de dados
function saveExpenses() {
    const transaction = db.transaction(['expenses'], 'readwrite');
    const expensesStore = transaction.objectStore('expenses');
    const currentDay = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    expenses.forEach(expense => {
        const expenseData = {
            userId: userId,
            expenseName: expense.name,
            expenseValue: expense.value,
            month: currentMonth,
            expenseDay: currentDay
        };
        expensesStore.add(expenseData);
    });
}

// Exibir o resumo
function showSummary(finalBalance) {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0);

    let tableContent = '<h2>Resumo de Despesas</h2><table id="summary-table"><tr><th>Item</th><th>Valor (€)</th></tr>';
    expenses.forEach(expense => {
        tableContent += `<tr><td>${expense.name}</td><td>€${expense.value.toFixed(2)}</td></tr>`;
    });
    tableContent += `
        <tr><td>Total de Despesas</td><td>€${totalExpenses.toFixed(2)}</td></tr>
        <tr><td>Renda</td><td>€${income.toFixed(2)}</td></tr>
        <tr><td>Saldo</td><td>€${finalBalance.toFixed(2)}</td></tr>
        ${savings > 0 ? `<tr><td>Valor poupado</td><td>€${savings.toFixed(2)}</td></tr>` : ''}
    </table>`;
    document.getElementById('content').innerHTML = tableContent;
}

// Funções adicionais omitidas para brevidade
openDb();
