// Demo in-memory store
const agents = [
  { name: 'LoggerAgent', tasks: ['PrintTask'] },
  { name: 'ComputeAgent', tasks: ['SumTask'] },
];
const tasks = [
  { title: 'PrintTask', desc: 'Prints a message 3 times.', agent: 'LoggerAgent', completed: true },
  { title: 'SumTask', desc: 'Computes 7 + 5.', agent: 'ComputeAgent', completed: false },
];

function renderAgents() {
  const container = document.getElementById('agents-list');
  container.innerHTML = '';
  for (const agent of agents) {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `
      <div class="agent-title">${agent.name}</div>
      <div class="card-desc">${agent.tasks.length} task(s)</div>
      <div>
        ${agent.tasks.map(t => `<span class="card-chip">${t}</span>`).join(' ')}
      </div>
    `;
    container.appendChild(card);
  }
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';
  for (const task of tasks) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-title">${task.title}</div>
      <div class="card-desc">${task.desc}</div>
      <span class="card-chip ${task.completed ? 'completed-chip' : ''}">${task.completed ? 'Completed' : 'Pending'}</span>
      <span class="card-chip" style="background: #88ebf4; color:#166896">${task.agent}</span>
    `;
    container.appendChild(card);
  }
}

// Modal logic
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
const modalForm = document.getElementById('modal-form');

function openModal(type) {
  modal.classList.remove('hidden');
  modalForm.innerHTML = '';
  if (type === 'agent') {
    modalForm.innerHTML = `
      <h3 style="color:#21b5eb">Add Agent</h3>
      <label>Name</label>
      <input name="name" type="text" required placeholder="Agent name...">
      <button type="submit">Add Agent</button>
    `;
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      const name = modalForm.elements['name'].value.trim();
      if (name && !agents.find(a => a.name === name)) {
        agents.push({ name, tasks: [] });
        renderAgents();
      }
      closeModal();
    };
  } else if (type === 'task') {
    modalForm.innerHTML = `<h3 style="color:#21b5eb">Add Task</h3>
      <label>Title</label>
      <input name="title" type="text" required>
      <label>Description</label>
      <input name="desc" type="text" required>
      <label>Agent</label>
      <select name="agent">
          ${agents.map(a => `<option>${a.name}</option>`).join('')}
      </select>
      <button type="submit">Add Task</button>
    `;
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      const title = modalForm.elements['title'].value.trim();
      const desc = modalForm.elements['desc'].value.trim();
      const agent = modalForm.elements['agent'].value;
      tasks.push({ title, desc, agent, completed: false });
      const agentObj = agents.find(a => a.name === agent);
      if (agentObj) agentObj.tasks.push(title);
      renderTasks();
      renderAgents();
      closeModal();
    };
  }
}
function closeModal() {
  modal.classList.add('hidden');
  modalForm.innerHTML = '';
  modalForm.onsubmit = null;
}
closeModalBtn.onclick = closeModal;
window.onclick = function(event) {
  if (event.target === modal) closeModal();
};
document.getElementById('add-agent-btn').onclick = () => openModal('agent');
document.getElementById('add-task-btn').onclick = () => openModal('task');

// Initial render
renderAgents();
renderTasks();