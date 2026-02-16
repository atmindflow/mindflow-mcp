// Interactive demo for Mindflow MCP v3 (frontend simulation)

const AGENTS = [
  {
    name: 'LoggerAgent',
    tasks: [
      { name: 'PrintTask', action: 'print_message', params: { message: 'Agentic is live!', times: 3 }, completed: false }
    ]
  },
  {
    name: 'ComputeAgent',
    tasks: [
      { name: 'SumTask', action: 'compute_sum', params: { a: 7, b: 5 }, completed: false }
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  renderAgents();
  populateAgentSelect();
  setupTaskForm();
  document.getElementById('run-scheduler').addEventListener('click', runScheduler);
});

function renderAgents(){
  const list = document.getElementById('agents-list');
  list.innerHTML = '';
  AGENTS.forEach(agent => {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `<h3>${escapeHtml(agent.name)}</h3>`;

    const tasksDiv = document.createElement('div');
    agent.tasks.forEach(t => {
      const taskEl = document.createElement('div');
      taskEl.className = 'task-item' + (t.completed ? ' task-completed' : '');
      taskEl.textContent = `${t.name} (${t.action})${t.completed ? ' ✓' : ''}`;
      tasksDiv.appendChild(taskEl);
    });

    card.appendChild(tasksDiv);
    list.appendChild(card);
  });
}

function populateAgentSelect(){
  const select = document.getElementById('agent-select');
  select.innerHTML = '';
  AGENTS.forEach((agent, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = agent.name;
    select.appendChild(opt);
  });
}

function setupTaskForm(){
  const actionSel = document.getElementById('task-action');
  actionSel.addEventListener('change', updateParamsFields);
  updateParamsFields();
  document.getElementById('task-form').addEventListener('submit', handleAddTask);
}

function updateParamsFields(){
  const action = document.getElementById('task-action').value;
  const fields = document.getElementById('params-fields');
  fields.innerHTML = '';

  if(action === 'print_message') {
    fields.innerHTML = `
      <label for="param-message">Message:</label>
      <input id="param-message" type="text" value="Hello from Mindflow MCP v3!">
      <label for="param-times">Times:</label>
      <input id="param-times" type="number" value="1" min="1" style="width: 90px;">
    `;
  } else {
    fields.innerHTML = `
      <label for="param-a">A:</label>
      <input id="param-a" type="number" value="7">
      <label for="param-b">B:</label>
      <input id="param-b" type="number" value="5">
    `;
  }
}

function handleAddTask(e){
  e.preventDefault();
  const agentIdx = parseInt(document.getElementById('agent-select').value, 10);
  const name = document.getElementById('task-name').value.trim();
  const action = document.getElementById('task-action').value;

  let params = {};
  if(action === 'print_message') {
    params.message = document.getElementById('param-message').value;
    params.times = Math.max(1, parseInt(document.getElementById('param-times').value, 10) || 1);
  } else {
    params.a = parseInt(document.getElementById('param-a').value, 10) || 0;
    params.b = parseInt(document.getElementById('param-b').value, 10) || 0;
  }

  AGENTS[agentIdx].tasks.push({ name, action, params, completed: false });
  renderAgents();
  e.target.reset();
  updateParamsFields();
  setStatus('Task added!');
}

function runScheduler(){
  setStatus('Running tasks... (check console output)');

  const pending = [];
  AGENTS.forEach(a => a.tasks.forEach(t => { if(!t.completed) pending.push(t); }));
  if(pending.length === 0) return setStatus('All tasks are completed!');

  let done = 0;
  let delay = 0;
  pending.forEach(task => {
    setTimeout(() => {
      executeTask(task);
      task.completed = true;
      done++;
      renderAgents();
      if(done === pending.length) setStatus('All tasks completed!');
    }, delay);
    delay += 700;
  });
}

function executeTask(task){
  if(task.action === 'print_message') {
    const times = Math.max(1, parseInt(task.params.times, 10) || 1);
    for(let i=0;i<times;i++) console.log(task.params.message);
  } else {
    const a = parseInt(task.params.a, 10) || 0;
    const b = parseInt(task.params.b, 10) || 0;
    console.log(`Sum of ${a} + ${b} = ${a+b}`);
  }
}

function setStatus(msg){
  const el = document.getElementById('status-bar');
  el.textContent = msg;
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(() => el.textContent = '', 2000);
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
