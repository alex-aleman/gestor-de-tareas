const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const toggleThemeBtn = document.getElementById('toggle-theme');
const prioritySelect = document.getElementById('task-priority');
const orderSelect = document.getElementById('orden');
const dateInput = document.getElementById('task-date');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

document.getElementById('orden').addEventListener('change', renderTasks);





if (Notification.permission === "default") {
  Notification.requestPermission();
}


form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  const priority = prioritySelect.value;
  const dueDate = dateInput.value;
  
  if (text === '') return;

  tasks.push({
    text,
    completed: false,
    priority,
    createdAt: Date.now(),
    dueDate: dueDate || null
  });

  input.value = '';
  dateInput.value = '';
  prioritySelect.value = 'medium';
  saveAndRender();
});

//BUSCAR TAREA
const searchInput = document.getElementById("search-task");

searchInput.addEventListener("input", () => {
  renderTasks(); // Cada vez que se escribe, vuelve a renderizar la lista
});


function renderTasks() {
  list.innerHTML = '';

  // Ordenar tareas
  
  if (orderSelect.value === 'prioridad') {
    const prioridadOrden = { alta: 1, media: 2, baja: 3 };
    tasks.sort((a, b) => prioridadOrden[a.priority] - prioridadOrden[b.priority]);
  } 

  else if (orderSelect.value === 'vencimiento') {
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } 
  
  else {
    tasks.sort((a, b) => a.createdAt - b.createdAt);
  }

  const searchText = searchInput ? searchInput.value.toLowerCase() : '';

  tasks.forEach((task, index) => {
     const matchesSearch = task.text.toLowerCase().includes(searchText);
    
    const shouldShow = matchesSearch &&
      currentFilter === 'all' ||
      (matchesSearch && currentFilter === 'completed' && task.completed) ||
      (matchesSearch && currentFilter === 'pending' && !task.completed);

    if (!shouldShow) return;

    const li = document.createElement('li');
    li.className = `${task.completed ? 'completed' : ''} ${task.priority}`;
    li.dataset.index = index;

    const span = document.createElement('span');
    span.textContent = task.text;
    span.dataset.action = 'toggle';
    span.addEventListener('click', () => toggleComplete(index));

    const priorityLabel = document.createElement('small');
    priorityLabel.textContent = `(${task.priority})`;
    priorityLabel.className = 'priority-label';

    // Botón Editar
    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => editTask(index));

    // Botón Eliminar
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.addEventListener('click', () => deleteTask(index));

// Botones en un contenedor
const actions = document.createElement('div');
actions.className = 'actions';
actions.appendChild(editBtn);
actions.appendChild(deleteBtn);

    const today = new Date();
const dueDate = task.dueDate ? new Date(task.dueDate) : null;

let alertMsg = '';
if (dueDate && !task.completed) {
  const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    alertMsg = '⚠️';
  } else if (diffDays <= 1) {
    alertMsg = '🔔';
  }
}

if (alertMsg) {
  const alertSpan = document.createElement('small');
  alertSpan.textContent = alertMsg;
  alertSpan.className = 'task-alert';
  li.appendChild(alertSpan);
}

    
li.appendChild(span);
li.appendChild(priorityLabel);
li.appendChild(actions); //ambos botones están dentro de este div
    
list.appendChild(li);

  });
  updateCounter(); // ✅ ACTUALIZA EL CONTADOR DE TAREAS
}

function checkDueTasks() {
  const now = new Date().toISOString().split("T")[0]; // fecha actual en formato YYYY-MM-DD

  tasks.forEach(task => {
    if (task.dueDate && task.dueDate <= now && !task.completed) {
      // Evitar notificaciones duplicadas
      if (!task.notified) {
        if (Notification.permission === "granted") {
          new Notification("Tarea vencida", {
            body: `La tarea "${task.text}" está vencida.`,
            icon: "https://cdn-icons-png.flaticon.com/512/1827/1827349.png"
          });
        }
        task.notified = true; // marcamos como notificada
      }
    }
  });
}

setInterval(() => {
  const ahora = Date.now();
  const notificados = JSON.parse(localStorage.getItem('notificados')) || [];

  tasks.forEach((task, index) => {
    if (!task.dueDate) return; // Si la tarea no tiene fecha, no hace nada
    const vencida = new Date(task.dueDate) < ahora;

    if (vencida && !notificados.includes(index)) {
      if (Notification.permission === 'granted') {
        new Notification(`⚠️ Tarea vencida`, {
          body: `${task.text} ha vencido.`,
        });
      }
      notificados.push(index);
    }
  });

  localStorage.setItem('notificados', JSON.stringify(notificados));
}, 60000);

function saveAndRender() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
  checkDueTasks(); // 🔔 Revisa si hay tareas vencidas
}


//CONTADOR DE TAREAS
function updateCounter() {
  const pending = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;

  document.getElementById('pending-count').textContent = pending;
  document.getElementById('completed-count').textContent = completed;
}


function editTask(index) {
  const newText = prompt("Edita la tarea:", tasks[index].text);
  if (newText !== null && newText.trim() !== '') {
    tasks[index].text = newText.trim();
    saveAndRender();
  }
}

function toggleComplete(index) {
  if (!tasks[index]) return;
  tasks[index].completed = !tasks[index].completed;
  saveAndRender();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveAndRender();
}

function saveAndRender() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
}

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

orderSelect.addEventListener('change', renderTasks);

// Tema oscuro
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  toggleThemeBtn.textContent = isDark ? '☀️' : '🌓';
});

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark');
    toggleThemeBtn.textContent = '☀️';
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      document.body.classList.toggle('dark', e.matches);
      toggleThemeBtn.textContent = e.matches ? '☀️' : '🌓';
    }
  });

  renderTasks();
 checkDueTasks(); // 🔔 Verificar tareas vencidas al cargar la página

});
