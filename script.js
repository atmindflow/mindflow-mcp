// Repo clone tooltip
const cloneBtn = document.getElementById('clone-btn');
const cloneTooltip = document.getElementById('clone-tooltip');
const GIT_URL = 'https://github.com/atmindflow/mindflow-mcp.git';

cloneBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(`git clone ${GIT_URL}`).then(() => {
    showTooltip();
  });
});

function showTooltip() {
  cloneTooltip.hidden = false;
  setTimeout(() => { cloneTooltip.hidden = true; }, 1700);
}

// Animate steps: 
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.style.animationDelay = `${0.07 + i * 0.18}s`;
  });
}

// --- INTERACTIVE SCHEDULER ---
const agentForm = document.getElementById('agent-form');
const agentNameInput = document.getElementById('agent-name');
const taskDescInput = document.getElementById('task-desc');
const agentsList = document.getElementById('agents-list');
const runSimBtn = document.getElementById('run-sim');
const logContainer = document.getElementById('log-container');

let AGENTS = [];

function renderAgents() {
  agentsList.innerHTML = '';
  AGENTS.forEach((a,i) => {
    const agentDiv = document.createElement('div');
    agentDiv.className = 'agent-block';
    agentDiv.innerHTML = `<span class='agent-title'>🤖 ${a.name} <button class='remove-agent' aria-label='Remove agent' data-i='${i}' title='Remove'>&times;</button></span><span class='agent-task'>📝 ${a.task}</span>`;
    agentsList.appendChild(agentDiv);
  });
  Array.from(agentsList.querySelectorAll('.remove-agent')).forEach(btn => {
    btn.onclick = (e) => {
      AGENTS.splice(Number(btn.dataset.i), 1);
      renderAgents();
      runSimBtn.disabled = AGENTS.length === 0;
    };
  });
  runSimBtn.disabled = AGENTS.length === 0;
}

globalThis.renderAgents = renderAgents;

agentForm && agentForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const agent = agentNameInput.value.trim();
  const task = taskDescInput.value.trim();
  if(!agent || !task) return;
  AGENTS.push({name: agent, task});
  renderAgents();
  agentNameInput.value = '';
  taskDescInput.value = '';
  runSimBtn.disabled = false;
  agentNameInput.focus();
});

runSimBtn && runSimBtn.addEventListener('click', ()=>{
  if(!AGENTS.length) return;
  logContainer.style.display = 'block';
  logContainer.innerHTML = '';
  const total = AGENTS.length;
  AGENTS.forEach((a, i) => {
    const entry = document.createElement('div');
    entry.innerHTML = `<span class='sim-log'>[log]</span> <span class='sim-agent'>${a.name}</span>: running <span class='sim-task'>${a.task}</span>...`;
    logContainer.appendChild(entry);
    setTimeout(() => {
      entry.innerHTML = `<span class='sim-log'>[done]</span> <span class='sim-agent'>${a.name}</span> finished <span class='sim-task'>${a.task}</span> <span class='sim-done'>✓</span>`;
      entry.classList.add('sim-done');
      if(i === total-1) {
        const doneMsg = document.createElement('div');
        doneMsg.innerHTML = `<span class='sim-done'>Scheduler finished! Agents ran their tasks 🚀</span>`;
        logContainer.appendChild(doneMsg);
        setTimeout(()=>doneMsg.classList.add('sim-fade'), 2200);
      }
    }, 1300 + Math.random()*1200 + i*450);
  });
});

// Demo button
const tryLiveDemo = document.getElementById('try-live-demo');
if(tryLiveDemo) {
  tryLiveDemo.onclick = () => {
    window.scrollTo({ top: document.querySelector('.interactive-update').offsetTop - 18, behavior: 'smooth' });
    agentNameInput && agentNameInput.focus();
  }
}
