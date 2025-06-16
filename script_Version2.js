const leads = [
  { value: 5000, stage: 'Qualification', days: 5 },
  { value: 10000, stage: 'Prospecting', days: 10 },
];

// Metrics
document.getElementById('total').textContent = leads.reduce((sum, l) => sum + l.value, 0);
document.getElementById('avg').textContent = (leads.reduce((sum, l) => sum + l.value, 0) / leads.length).toFixed(2);
document.getElementById('count').textContent = leads.length;
document.getElementById('avgDays').textContent = (leads.reduce((sum, l) => sum + l.days, 0) / leads.length).toFixed(1);

// Chart
const stages = [...new Set(leads.map(l => l.stage))];
const stageCounts = stages.map(stage => leads.filter(l => l.stage === stage).length);
new Chart(document.getElementById('stageChart'), {
  type: 'bar',
  data: {
    labels: stages,
    datasets: [{ label: 'Leads', data: stageCounts }]
  }
});

// Top Leads Table
const topLeadsTable = document.getElementById('topLeads');
leads.sort((a, b) => b.value - a.value).slice(0, 10).forEach(lead => {
  const row = topLeadsTable.insertRow();
  row.insertCell().textContent = `$${lead.value}`;
  row.insertCell().textContent = lead.stage;
});