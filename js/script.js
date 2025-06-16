// Mock Leads Data (for dashboard reference)
let leads = [
    { value: 5000, stage: 'Qualification', days: 5 },
    { value: 10000, stage: 'Prospecting', days: 10 },
    { value: 15000, stage: 'Negotiation', days: 15 }
];

// Whiteboard Workflow Steps and Connections
let workflowSteps = JSON.parse(localStorage.getItem('workflowSteps')) || [];
let connections = JSON.parse(localStorage.getItem('connections')) || [];

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
        whiteboard.innerHTML = ''; // Clear existing steps

        // Initialize with random positions if not set
        workflowSteps.forEach(step => {
            if (!step.x || !step.y) {
                step.x = Math.random() * 400; // Random x within whiteboard width
                step.y = Math.random() * 400; // Random y within whiteboard height
            }
        });

        workflowSteps.forEach((step, index) => {
            const div = document.createElement('div');
            div.className = 'workflow-node';
            div.id = `step-${step.id}`;
            div.style.left = `${step.x}px`;
            div.style.top = `${step.y}px`;
            div.innerHTML = `<strong>${step.name}</strong><br><small>${step.condition}</small><br>${step.action}<br><button class="btn btn-sm btn-secondary mt-1" onclick="connectStep(${index})">Connect</button><button class="btn btn-sm btn-danger mt-1" onclick="removeStep(${index})">Remove</button>`;
            div.draggable = true;
            div.dataset.id = step.id;
            div.addEventListener('dragstart', dragStart);
            whiteboard.appendChild(div);
        });

        whiteboard.addEventListener('dragover', dragOver);
        whiteboard.addEventListener('drop', drop);
        drawConnections();
        localStorage.setItem('workflowSteps', JSON.stringify(workflowSteps));
        localStorage.setItem('connections', JSON.stringify(connections));
    }
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const step = workflowSteps.find(s => s.id == id);
    if (step) {
        const whiteboardRect = document.getElementById('whiteboard').getBoundingClientRect();
        step.x = e.clientX - whiteboardRect.left - 100; // Adjust for node width
        step.y = e.clientY - whiteboardRect.top - 50;  // Adjust for node height
        if (step.x < 0) step.x = 0;
        if (step.y < 0) step.y = 0;
        if (step.x > whiteboardRect.width - 200) step.x = whiteboardRect.width - 200;
        if (step.y > whiteboardRect.height - 100) step.y = whiteboardRect.height - 100;
        updateWhiteboard();
    }
}

function removeStep(index) {
    workflowSteps.splice(index, 1);
    connections = connections.filter(c => c.from !== workflowSteps[index]?.id && c.to !== workflowSteps[index]?.id);
    updateWhiteboard();
}

// Form Submission Handler for Workflow Steps
document.querySelector('#workflowForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('stepName').value.trim();
    const condition = document.getElementById('condition').value.trim();
    const action = document.getElementById('action').value.trim();
    if (name && condition && action) {
        workflowSteps.push({ id: Date.now(), name, condition, action, x: Math.random() * 400, y: Math.random() * 400 });
        document.getElementById('stepName').value = '';
        document.getElementById('condition').value = '';
        document.getElementById('action').value = '';
        updateWhiteboard();
        console.log('Workflow step added locally.');
    }
});

function drawConnections() {
    const whiteboard = document.getElementById('whiteboard');
    const svgs = whiteboard.getElementsByTagName('svg');
    for (let svg of svgs) svg.remove();

    connections.forEach(conn => {
        const fromStep = document.getElementById(`step-${conn.from}`);
        const toStep = document.getElementById(`step-${conn.to}`);
        if (fromStep && toStep) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const fromRect = fromStep.getBoundingClientRect();
            const toRect = toStep.getBoundingClientRect();
            const whiteboardRect = whiteboard.getBoundingClientRect();
            const x1 = fromRect.left + fromRect.width / 2 - whiteboardRect.left;
            const y1 = fromRect.bottom - whiteboardRect.top; // Connect from bottom
            const x2 = toRect.left + toRect.width / 2 - whiteboardRect.left;
            const y2 = toRect.top - whiteboardRect.top; // Connect to top
            svg.setAttribute('style', 'position: absolute; z-index: -1;');
            svg.innerHTML = `<path d="M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}" style="stroke:#000; stroke-width:2; fill:none;" />`;
            whiteboard.appendChild(svg);
        }
    });
}

function connectStep(index) {
    const id = workflowSteps[index].id;
    const connectTo = prompt(`Connect ${workflowSteps[index].name} to another step (ID):`);
    if (connectTo) {
        const toStep = workflowSteps.find(s => s.id == connectTo);
        if (toStep && id != connectTo) {
            connections.push({ from: parseInt(id), to: parseInt(connectTo) });
            drawConnections();
        } else {
            alert('Invalid connection or self-connection not allowed.');
        }
    }
}

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
