
const materials = {
    agua: {
        name: "Água",
        melting: 0,
        boiling: 100,
        heat: {
            solid: 2100,
            liquid: 4186,
            gas: 2010
        }
    },

    ferro: {
        name: "Ferro",
        melting: 1538,
        boiling: 2862,
        heat: {
            solid: 449,
            liquid: 820,
            gas: 650
        }
    },

    aluminio: {
        name: "Alumínio",
        melting: 660.3,
        boiling: 2519,
        heat: {
            solid: 897,
            liquid: 1170,
            gas: 1100
        }
    },

    alcool: {
        name: "Álcool etílico",
        melting: -114.1,
        boiling: 78.37,
        heat: {
            solid: 1400,
            liquid: 2440,
            gas: 1430
        }
    }
};

let history = [];

function selectMaterial(name) {
    document.getElementById("material").value = name;
}

function identifyState(temp, material) {
    if (Math.abs(temp - material.melting) < 0.000001) {
        return {
            name: "Transição de fase",
            type: "transition",
            description: "A temperatura está no ponto de fusão ou solidificação. A mudança de estado depende da troca de calor."
        };
    }

    if (Math.abs(temp - material.boiling) < 0.000001) {
        return {
            name: "Transição de fase",
            type: "transition",
            description: "A temperatura está no ponto de ebulição ou condensação. A mudança de estado depende da troca de calor."
        };
    }

    if (temp < material.melting) {
        return {
            name: "Sólido",
            type: "solid",
            description: "A substância está abaixo do ponto de fusão."
        };
    }

    if (temp < material.boiling) {
        return {
            name: "Líquido",
            type: "liquid",
            description: "A substância está entre os pontos de fusão e ebulição."
        };
    }

    return {
        name: "Gasoso",
        type: "gas",
        description: "A substância está acima do ponto de ebulição."
    };
}

function formatNumber(value, decimals = 2) {
    return value.toLocaleString("pt-BR", {
        maximumFractionDigits: decimals
    });
}

function calculate() {
    const materialKey = document.getElementById("material").value;
    const tempInput = document.getElementById("temperature").value;
    const massInput = document.getElementById("mass").value;
    const initialInput = document.getElementById("initialTemp").value;

    if (tempInput.trim() === "" || massInput.trim() === "") {
        alert("Preencha a temperatura e a massa.");
        return;
    }

    const temp = Number(tempInput);
    const mass = Number(massInput);
    const material = materials[materialKey];

    if (!Number.isFinite(temp) || !Number.isFinite(mass) || mass <= 0) {
        alert("Informe valores válidos. A massa deve ser maior que zero.");
        return;
    }

    if (initialInput.trim() !== "" && !Number.isFinite(Number(initialInput))) {
        alert("Informe uma temperatura inicial válida.");
        return;
    }

    const state = identifyState(temp, material);

    document.getElementById("stateResult").textContent = state.name;
    document.getElementById("stateDescription").textContent = state.description;

    const badge = document.getElementById("stateBadge");
    badge.textContent = state.type.toUpperCase();
    badge.className = "state " + state.type;

    document.getElementById("melting").textContent =
        formatNumber(material.melting) + " °C";

    document.getElementById("boiling").textContent =
        formatNumber(material.boiling) + " °C";

    if (state.type === "transition") {
        document.getElementById("capacity").textContent = "Não definido";
        document.getElementById("specificHeat").textContent = "Não definido";
        document.getElementById("heat").textContent = "Não calculado";

        document.getElementById("calculationExplanation").textContent =
            "O material está em uma temperatura de mudança de estado. Para calcular a energia nessa etapa, é necessário considerar o calor latente e a quantidade de matéria que mudou de fase. Escolha outra temperatura para calcular a capacidade térmica.";

        return;
    }

    const c = material.heat[state.type];
    const capacity = mass * c;

    document.getElementById("capacity").textContent =
        formatNumber(capacity) + " J/°C";

    document.getElementById("specificHeat").textContent =
        formatNumber(c) + " J/(kg·°C)";

    let heatText = "---";

    let explanation =
        "CAPACIDADE TÉRMICA<br>" +
        "Fórmula: C = m × c<br>" +
        "C = " + formatNumber(mass) + " × " + formatNumber(c) +
        "<br><strong>C = " + formatNumber(capacity) + " J/°C</strong>";

    if (initialInput.trim() !== "") {
        const initialTemp = Number(initialInput);
        const delta = temp - initialTemp;

        const crossesMelting =
            Math.min(initialTemp, temp) < material.melting &&
            Math.max(initialTemp, temp) > material.melting;

        const crossesBoiling =
            Math.min(initialTemp, temp) < material.boiling &&
            Math.max(initialTemp, temp) > material.boiling;

        const startsAtTransition =
            initialTemp === material.melting ||
            initialTemp === material.boiling;

        const endsAtTransition =
            temp === material.melting ||
            temp === material.boiling;

        if (crossesMelting || crossesBoiling ||
            startsAtTransition || endsAtTransition) {

            heatText = "Requer calor latente";

            explanation +=
                "<br><br><strong>Calor sensível não calculado.</strong>" +
                "<br>O intervalo informado inclui uma mudança de estado. " +
                "É necessário calcular separadamente o calor sensível de cada fase e o calor latente da transição.";
        } else {
            const q = mass * c * delta;

            heatText = formatNumber(q) + " J";

            explanation +=
                "<br><br>CALOR SENSÍVEL<br>" +
                "Fórmula: Q = m × c × ΔT<br>" +
                "ΔT = " + formatNumber(temp) + " - " +
                formatNumber(initialTemp) +
                " = " + formatNumber(delta) + " °C" +
                "<br><strong>Q = " + formatNumber(q) + " J</strong>";

            if (delta > 0) {
                explanation += "<br>O corpo recebeu calor.";
            } else if (delta < 0) {
                explanation += "<br>O corpo perdeu calor.";
            } else {
                explanation += "<br>Não houve variação de temperatura.";
            }
        }
    }

    document.getElementById("heat").textContent = heatText;
    document.getElementById("calculationExplanation").innerHTML = explanation;

    addHistory(material.name, state.name, capacity, heatText);
}

function addHistory(material, state, capacity, heat) {
    history.unshift({
        material,
        state,
        capacity,
        heat
    });

    if (history.length > 8) {
        history.pop();
    }

    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("historyList");

    if (history.length === 0) {
        list.innerHTML =
            '<div class="history-empty">Nenhum cálculo realizado ainda.</div>';
        return;
    }

    list.innerHTML = "";

    history.forEach(item => {
        const element = document.createElement("div");
        element.className = "history-item";

        const left = document.createElement("div");
        const name = document.createElement("strong");

        name.textContent = item.material + " — " + item.state;

        const detail = document.createElement("div");
        detail.style.color = "#91a3bb";
        detail.style.marginTop = "5px";

        detail.textContent =
            "Capacidade: " + formatNumber(item.capacity) + " J/°C";

        left.append(name, detail);

        const right = document.createElement("strong");
        right.textContent = item.heat;

        element.append(left, right);
        list.appendChild(element);
    });
}

function clearHistory() {
    history = [];
    renderHistory();
}
