// Mock Leads Data (for dashboard reference)
let leads = [
    { value: 5000, stage: 'Qualification', days: 5 },
    { value: 10000, stage: 'Prospecting', days: 10 },
    { value: 15000, stage: 'Negotiation', days: 15 }
];

// Whiteboard Tiles and Connections
let tiles = [];
let connections = [];

function updateDashboard() {
    if (document.getElementById('dashboard')) {
        document.getElementById('total').textContent = leads.reduce((sum, l) => sum + l.value, 0);
        document.getElementById('avg').textContent = (leads.reduce((sum, l) => sum + l.value, 0) / leads.length).toFixed(2) || 0;
        document.getElementById('count').textContent = leads.length;
        document.getElementById('avgDays').textContent = (leads.reduce((sum, l) => sum + l.days, 0) / leads.length).toFixed(1) || 0;

        new Chart(document.getElementById('stageChart'), {
            type: 'bar',
            data: {
                labels: [...new Set(leads.map(l => l.stage))],
                datasets: [{ label: 'Leads', data: leads.map(l => leads.filter(x => x.stage === l.stage).length), backgroundColor: 'rgba(54, 162, 235, 0.5)' }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });

        const topLeadsTable = document.getElementById('topLeads').getElementsByTagName('tbody')[0];
        topLeadsTable.innerHTML = '';
        leads.sort((a, b) => b.value - a.value).slice(0, 10).forEach(lead => {
            const row = topLeadsTable.insertRow();
            row.insertCell().textContent = `$${lead.value}`;
            row.insertCell().textContent = lead.stage;
        });
    }
}

function updateWhiteboard() {
    if (document.getElementById('whiteboard')) {
        const whiteboard = document.getElementById('whiteboard');
        whiteboard.innerHTML = ''; // Clear existing tiles

        tiles.forEach(tile => {
            const div = document.createElement('div');
            div.className = 'workflow-node';
            div.id = `tile-${tile.id}`;
            div.style.left = `${tile.x}px`;
            div.style.top = `${tile.y}px`;
            div.innerHTML = `<strong>${tile.category}</strong><br>${tile.automation}<br><button class="btn btn-sm btn-danger mt-2" onclick="removeTile(${tile.id})">Remove</button>`;
            div.draggable = true;
            div.dataset.id = tile.id;
            div.addEventListener('dragstart', dragStart);
            div.addEventListener('dragover', dragOver);
            div.addEventListener('drop', drop);
            whiteboard.appendChild(div);
        });

        drawConnections();
    }
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const tile = tiles.find(t => t.id == id);
    if (tile) {
        tile.x = e.clientX - e.target.offsetLeft - 50;
        tile.y = e.clientY - e.target.offsetTop - 50;
        updateWhiteboard();
    }
}

function removeTile(id) {
    tiles = tiles.filter(t => t.id !== id);
    connections = connections.filter(c => c.from !== id && c.to !== id);
    updateWhiteboard();
}

// Form Submission Handler
document.querySelector('form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const category = document.getElementById('category').value;
    const automation = document.getElementById('automation').value;
    if (category && automation) {
        tiles.push({ id: Date.now(), category, automation, x: 50, y: 50 });
        document.getElementById('category').value = '';
        document.getElementById('automation').value = '';
        updateWhiteboard();
        console.log('Form submitted. Add Formspree or something later.');
    }
});

function drawConnections() {
    const whiteboard = document.getElementById('whiteboard');
    const svgs = whiteboard.getElementsByTagName('svg');
    for (let svg of svgs) svg.remove();

    connections.forEach(conn => {
        const fromTile = document.getElementById(`tile-${conn.from}`);
        const toTile = document.getElementById(`tile-${conn.to}`);
        if (fromTile && toTile) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const fromRect = fromTile.getBoundingClientRect();
            const toRect = toTile.getBoundingClientRect();
            const whiteboardRect = whiteboard.getBoundingClientRect();
            const x1 = fromRect.left + fromRect.width / 2 - whiteboardRect.left;
            const y1 = fromRect.top + fromRect.height / 2 - whiteboardRect.top;
            const x2 = toRect.left + toRect.width / 2 - whiteboardRect.left;
            const y2 = toRect.top + toRect.height / 2 - whiteboardRect.top;
            svg.setAttribute('style', 'position: absolute; z-index: -1;');
            svg.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:#000; stroke-width:2" />`;
            whiteboard.appendChild(svg);
        }
    });
}

document.getElementById('whiteboard').addEventListener('click', (e) => {
    if (e.target.className === 'workflow-node') {
        const id = e.target.dataset.id;
        const connectTo = prompt(`Connect ${tiles.find(t => t.id == id).category} to another tile (ID):`);
        if (connectTo) {
            const toTile = tiles.find(t => t.id == connectTo);
            if (toTile && id != connectTo) {
                connections.push({ from: parseInt(id), to: parseInt(connectTo) });
                drawConnections();
            }
        }
    }
});

function updateWorkflow() {
    if (document.getElementById('workflow')) {
        const addStepBtn = document.getElementById('addStep');
        const workflowSteps = document.getElementById('workflowSteps');
        addStepBtn.addEventListener('click', () => {
            const newStep = prompt('Enter new workflow step');
            if (newStep) {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = newStep;
                workflowSteps.appendChild(li);
            }
        });

        new Chart(document.getElementById('workflowChart'), {
            type: 'bar',
            data: {
                labels: ['Lead Capture', 'Qualification', 'Follow-up'],
                datasets: [{ label: 'Steps', data: [10, 8, 5], backgroundColor: 'rgba(75, 192, 192, 0.5)' }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }
}

// Initialize on Page Load
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    updateWhiteboard();
    updateWorkflow();
});
