// ---------- Table configuration ----------
// Each entry describes how to talk to the API and how to render the form
// for that table, based on the schema you provided.
const TABLES = {
  users: {
    label: 'Users',
    endpoint: '/api/users',
    pk: 'user_id',
    columns: ['user_id', 'full_name', 'email', 'skills', 'created_at', 'updated_at'],
    createEndpointOverride: '/api/auth/register', // needs password hashing
    fields: [
      { name: 'full_name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', onlyOnCreate: true, required: true },
      { name: 'skills', label: 'Skills', type: 'textarea' },
    ],
  },
  resumes: {
    label: 'Resumes',
    endpoint: '/api/resumes',
    pk: 'resume_id',
    columns: ['resume_id', 'user_id', 'file_name', 'file_type', 'file_path', 'uploaded_at'],
    fields: [
      { name: 'user_id', label: 'User ID', type: 'number', required: true },
      { name: 'file_name', label: 'File name', type: 'text', required: true },
      { name: 'file_path', label: 'File path', type: 'text' },
      { name: 'file_type', label: 'File type', type: 'text' },
      { name: 'resume_text', label: 'Resume text', type: 'textarea' },
    ],
  },
  resume_analysis: {
    label: 'Resume Analysis',
    endpoint: '/api/resume-analysis',
    pk: 'analysis_id',
    columns: ['analysis_id', 'resume_id', 'ats_score', 'overall_score', 'grammar_score', 'formatting_score', 'keyword_score', 'analyzed_at'],
    fields: [
      { name: 'resume_id', label: 'Resume ID', type: 'number', required: true },
      { name: 'ats_score', label: 'ATS score', type: 'number', step: '0.01' },
      { name: 'overall_score', label: 'Overall score', type: 'number', step: '0.01' },
      { name: 'grammar_score', label: 'Grammar score', type: 'number', step: '0.01' },
      { name: 'formatting_score', label: 'Formatting score', type: 'number', step: '0.01' },
      { name: 'keyword_score', label: 'Keyword score', type: 'number', step: '0.01' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'strengths', label: 'Strengths', type: 'textarea' },
      { name: 'weaknesses', label: 'Weaknesses', type: 'textarea' },
      { name: 'missing_skills', label: 'Missing skills', type: 'textarea' },
    ],
  },
  job_descriptions: {
    label: 'Job Descriptions',
    endpoint: '/api/job-descriptions',
    pk: 'job_id',
    columns: ['job_id', 'user_id', 'job_title', 'company_name', 'created_at'],
    fields: [
      { name: 'user_id', label: 'User ID', type: 'number', required: true },
      { name: 'job_title', label: 'Job title', type: 'text', required: true },
      { name: 'company_name', label: 'Company name', type: 'text' },
      { name: 'job_description', label: 'Job description', type: 'textarea' },
    ],
  },
  skills: {
    label: 'Skills',
    endpoint: '/api/skills',
    pk: 'skill_id',
    columns: ['skill_id', 'skill_name', 'skill_category', 'created_at'],
    fields: [
      { name: 'skill_name', label: 'Skill name', type: 'text', required: true },
      { name: 'skill_category', label: 'Skill category', type: 'text' },
    ],
  },
  job_skills: {
    label: 'Job Skills',
    endpoint: '/api/job-skills',
    pk: 'job_skill_id',
    columns: ['job_skill_id', 'job_id', 'skill_id', 'is_required'],
    fields: [
      { name: 'job_id', label: 'Job ID', type: 'number', required: true },
      { name: 'skill_id', label: 'Skill ID', type: 'number', required: true },
      { name: 'is_required', label: 'Required?', type: 'checkbox' },
    ],
  },
};

let currentTable = 'users';
let currentRows = [];
let editingId = null;

const tableTitle = document.getElementById('table-title');
const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('table-body');
const emptyMsg = document.getElementById('empty-msg');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');

// ---------- Auth check + current user ----------
(async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return (window.location.href = '/index.html');
    const { user } = await res.json();
    document.getElementById('current-user').textContent = `${user.full_name} (${user.email})`;
  } catch (_) {
    window.location.href = '/index.html';
  }
  loadTable(currentTable);
})();

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/index.html';
});

// ---------- Nav switching ----------
document.getElementById('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  btn.classList.add('active');
  currentTable = btn.dataset.table;
  loadTable(currentTable);
});

// ---------- Load + render table ----------
async function loadTable(tableKey) {
  const cfg = TABLES[tableKey];
  tableTitle.textContent = cfg.label;
  tableHead.innerHTML = '';
  tableBody.innerHTML = '';
  emptyMsg.hidden = true;

  try {
    const res = await fetch(cfg.endpoint);
    if (res.status === 401) return (window.location.href = '/index.html');
    currentRows = await res.json();
  } catch (err) {
    console.error(err);
    currentRows = [];
  }

  renderHead(cfg);
  renderBody(cfg);
}

function renderHead(cfg) {
  const tr = document.createElement('tr');
  cfg.columns.forEach((col) => {
    const th = document.createElement('th');
    th.textContent = col;
    tr.appendChild(th);
  });
  const thActions = document.createElement('th');
  thActions.textContent = 'Actions';
  tr.appendChild(thActions);
  tableHead.appendChild(tr);
}

function renderBody(cfg) {
  if (!currentRows || currentRows.length === 0) {
    emptyMsg.hidden = false;
    return;
  }
  currentRows.forEach((row) => {
    const tr = document.createElement('tr');
    cfg.columns.forEach((col) => {
      const td = document.createElement('td');
      let val = row[col];
      if (val === null || val === undefined) val = '';
      if (val instanceof Object) val = JSON.stringify(val);
      td.textContent = val;
      td.title = val;
      tr.appendChild(td);
    });
    const tdActions = document.createElement('td');
    tdActions.innerHTML = `
      <div class="row-actions">
        <button class="icon-btn-sm update-btn">Update</button>
        <button class="icon-btn-sm delete-btn">Delete</button>
      </div>`;
    tdActions.querySelector('.update-btn').addEventListener('click', () => openModal(cfg, row));
    tdActions.querySelector('.delete-btn').addEventListener('click', () => deleteRow(cfg, row));
    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  });
}

// ---------- Add / Edit modal ----------
document.getElementById('add-btn').addEventListener('click', () => openModal(TABLES[currentTable], null));
document.getElementById('modal-close').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

function openModal(cfg, row) {
  editingId = row ? row[cfg.pk] : null;
  modalTitle.textContent = row ? `Update ${cfg.label.slice(0, -1) || cfg.label}` : `Create ${cfg.label.slice(0, -1) || cfg.label}`;
  modalForm.innerHTML = '';

  cfg.fields.forEach((field) => {
    if (field.onlyOnCreate && row) return; // e.g. hide password field on edit

    const label = document.createElement('label');
    label.textContent = field.label;

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
    } else if (field.type === 'checkbox') {
      input = document.createElement('select');
      input.innerHTML = '<option value="true">Yes</option><option value="false">No</option>';
    } else {
      input = document.createElement('input');
      input.type = field.type;
      if (field.step) input.step = field.step;
    }
    input.name = field.name;
    if (field.required) input.required = true;

    if (row && field.name in row && row[field.name] !== null) {
      input.value = row[field.name];
    }

    label.appendChild(input);
    modalForm.appendChild(label);
  });

  const actions = document.createElement('div');
  actions.className = 'modal-form-actions';
  actions.innerHTML = `
    <button type="button" class="btn-ghost" id="cancel-btn">Cancel</button>
    <button type="submit" class="btn-primary">${row ? 'Update' : 'Create'}</button>`;
  modalForm.appendChild(actions);
  modalForm.querySelector('#cancel-btn').addEventListener('click', closeModal);

  modalOverlay.hidden = false;
}

function closeModal() {
  modalOverlay.hidden = true;
  editingId = null;
}

modalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cfg = TABLES[currentTable];
  const data = Object.fromEntries(new FormData(modalForm));

  // Convert checkbox-style "true"/"false" selects to real booleans
  cfg.fields.forEach((f) => {
    if (f.type === 'checkbox' && f.name in data) data[f.name] = data[f.name] === 'true';
    if (f.type === 'number' && data[f.name] === '') delete data[f.name];
  });

  const isEdit = editingId !== null;
  const endpoint = isEdit ? `${cfg.endpoint}/${editingId}` : (cfg.createEndpointOverride || cfg.endpoint);

  try {
    const res = await fetch(endpoint, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      alert(body.error || 'Something went wrong');
      return;
    }
    closeModal();
    loadTable(currentTable);
  } catch (err) {
    console.error(err);
    alert('Could not reach the server');
  }
});

// ---------- Delete ----------
async function deleteRow(cfg, row) {
  const id = row[cfg.pk];
  if (!confirm(`Delete this row (${cfg.pk} = ${id})? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${cfg.endpoint}/${id}`, { method: 'DELETE' });
    const body = await res.json();
    if (!res.ok) {
      alert(body.error || 'Could not delete row');
      return;
    }
    loadTable(currentTable);
  } catch (err) {
    console.error(err);
    alert('Could not reach the server');
  }
}
