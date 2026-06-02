let transactions = JSON.parse(localStorage.getItem('redfinance_transactions')) || [];
let investments = JSON.parse(localStorage.getItem('redfinance_investments')) || [];

let totalIncome = 0;
let totalExpense = 0;
let totalInvested = 0;
let totalReturn = 0;

let categoryData = {
    'Roupas': 0, 'Produtos de beleza': 0, 'Moradia': 0, 'Emergência': 0, 
    'Saúde': 0, 'Alimentação': 0, 'Entreterimento': 0, 'Assinaturas': 0, 
    'Parcelas da fatura': 0, 'Outros': 0
};

// ALTERNAR ABAS
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');

    if (tabId === 'tab-home') document.getElementById('btn-tab-home').classList.add('active');
    if (tabId === 'tab-add') document.getElementById('btn-tab-add').classList.add('active');
    if (tabId === 'tab-invest') document.getElementById('btn-tab-invest').classList.add('active');
}

// ATUALIZAR CATEGORIAS DO FORMULÁRIO
function updateCategoryOptions() {
    const type = document.getElementById('transaction-type').value;
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = ''; 

    if (type === 'Receita') {
        const receitasOpcoes = ['Salário', 'Outros'];
        receitasOpcoes.forEach(opt => {
            categorySelect.innerHTML += `<option value="${opt}">${opt}</option>`;
        });
    } else {
        const custosOpcoes = [
            'Roupas', 'Produtos de beleza', 'Moradia', 'Emergência', 
            'Saúde', 'Alimentação', 'Entreterimento', 'Assinaturas', 
            'Parcelas da fatura', 'Outros'
        ];
        custosOpcoes.forEach(opt => {
            categorySelect.innerHTML += `<option value="${opt}">${opt}</option>`;
        });
    }
}

// CONFIGURAÇÃO DO GRÁFICO
let ctx = document.getElementById('categoryChart').getContext('2d');
let myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: Object.keys(categoryData),
        datasets: [{
            data: Object.values(categoryData),
            backgroundColor: [
                '#FF453A', '#FF3B30', '#E03B30', '#C03228', '#A02A22', 
                '#80211B', '#601914', '#40110D', '#280A08', '#150504'
            ],
            borderColor: '#1C1C1E',
            borderWidth: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    }
});

// ADICIONAR MOVIMENTAÇÃO
document.getElementById('btn-add').addEventListener('click', () => {
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const descInput = document.getElementById('desc');
    const desc = descInput.value.trim() === '' ? category : descInput.value.trim();

    if (isNaN(amount) || amount <= 0) {
        alert("Por favor, digite um valor válido.");
        return;
    }

    const t = { id: Date.now(), type, amount, category, desc };
    transactions.push(t);

    document.getElementById('amount').value = '';
    descInput.value = '';
    
    // Salva permanentemente no navegador
    localStorage.setItem('redfinance_transactions', JSON.stringify(transactions));
    
    updateAll();
    switchTab('tab-home');
});

// ADICIONAR INVESTIMENTO
document.getElementById('btn-add-invest').addEventListener('click', () => {
    const name = document.getElementById('invest-name').value.trim();
    const type = document.getElementById('invest-type').value;
    const amount = parseFloat(document.getElementById('invest-amount').value);
    const currentReturn = parseFloat(document.getElementById('invest-return').value);

    if (name === '' || isNaN(amount) || isNaN(currentReturn)) {
        alert("Preencha todos os campos do investimento!");
        return;
    }

    const inv = { id: Date.now(), name, type, amount, currentReturn };
    investments.push(inv);

    document.getElementById('invest-name').value = '';
    document.getElementById('invest-amount').value = '';
    document.getElementById('invest-return').value = '';

    // Salva permanentemente no navegador
    localStorage.setItem('redfinance_investments', JSON.stringify(investments));

    updateAll();
    switchTab('tab-home');
});

// DELETAR TRANSAÇÃO
function deleteTransaction(id) {
    if (confirm("Tem certeza absoluta de que deseja deletar esta transação?")) {
        transactions = transactions.filter(t => t.id !== id);
        // Atualiza o banco de dados local após deletar
        localStorage.setItem('redfinance_transactions', JSON.stringify(transactions));
        updateAll();
    }
}

// DELETAR INVESTIMENTO
function deleteInvestment(id) {
    if (confirm("Tem certeza absoluta de que deseja deletar este investimento?")) {
        investments = investments.filter(inv => inv.id !== id);
        // Atualiza o banco de dados local após deletar
        localStorage.setItem('redfinance_investments', JSON.stringify(investments));
        updateAll();
    }
}

// RECALCULAR E ATUALIZAR TELA
function updateAll() {
    totalIncome = 0;
    totalExpense = 0;
    totalInvested = 0;
    totalReturn = 0;
    Object.keys(categoryData).forEach(k => categoryData[k] = 0);

    const tList = document.getElementById('transaction-list');
    tList.innerHTML = '';
    
    transactions.forEach(t => {
        if (t.type === 'Receita') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
            if(categoryData[t.category] !== undefined) {
                categoryData[t.category] += t.amount;
            }
        }

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="li-info">
                <strong>${t.desc}</strong>
                <small style="color:#AEAEB2;">${t.category}</small>
            </div>
            <div class="li-right">
                <span class="${t.type === 'Receita' ? 'return-positive' : 'return-negative'}">
                    ${t.type === 'Receita' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                </span>
                <button class="btn-delete" onclick="deleteTransaction(${t.id})">Excluir</button>
            </div>
        `;
        tList.appendChild(li);
    });

    const invList = document.getElementById('invest-list');
    invList.innerHTML = '';

    investments.forEach(inv => {
        totalInvested += inv.amount;
        totalReturn += inv.currentReturn;

        const yieldValue = inv.currentReturn - inv.amount;
        const yieldClass = yieldValue >= 0 ? 'return-positive' : 'return-negative';

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="li-info">
                <strong>${inv.name}</strong>
                <small style="color:#AEAEB2;">${inv.type} | Aplicado: R$ ${inv.amount.toFixed(2)}</small>
            </div>
            <div class="li-right">
                <div style="text-align: right;">
                    <strong>R$ ${inv.currentReturn.toFixed(2)}</strong>
                    <p class="${yieldClass}" style="font-size:0.75rem; margin:0;">${yieldValue >= 0 ? '+' : ''}R$ ${yieldValue.toFixed(2)}</p>
                </div>
                <button class="btn-delete" onclick="deleteInvestment(${inv.id})">Excluir</button>
            </div>
        `;
        invList.appendChild(li);
    });

    const netBalance = totalIncome - totalExpense;
    document.getElementById('total-balance').innerText = `R$ ${netBalance.toFixed(2)}`;
    document.getElementById('total-income').innerText = `R$ ${totalIncome.toFixed(2)}`;
    document.getElementById('total-expense').innerText = `R$ ${totalExpense.toFixed(2)}`;
    
    document.getElementById('home-invested').innerText = `R$ ${totalInvested.toFixed(2)}`;
    document.getElementById('home-return').innerText = `R$ ${totalReturn.toFixed(2)}`;

    const statusBadge = document.getElementById('status-badge');
    if (netBalance >= 0) {
        statusBadge.innerText = "Você está no positivo";
        statusBadge.className = "status-message status-positive";
    } else {
        statusBadge.innerText = "Você está no negativo";
        statusBadge.className = "status-message status-negative";
    }

    myChart.data.datasets[0].data = Object.values(categoryData);
    myChart.update();
}

updateCategoryOptions();
updateAll();
