/**
 * Module Quality Dashboard - App Logic
 */

// --- Data Model & State ---

const STORAGE_KEY = 'qa_dashboard_modules';

// Default sample data
const SAMPLE_DATA = [
    { id: '1', name: 'Authentication Service', status: 'Passed', reason: '', failures: 0, lastUpdated: new Date().toISOString() },
    { id: '2', name: 'Payment Gateway', status: 'Failed', reason: 'Timeout on API response', failures: 5, lastUpdated: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', name: 'User Profile', status: 'In Progress', reason: 'Pending UI tests', failures: 0, lastUpdated: new Date(Date.now() - 3600000).toISOString() },
    { id: '4', name: 'Search Engine', status: 'Passed', reason: '', failures: 1, lastUpdated: new Date().toISOString() },
    { id: '5', name: 'Notifications', status: 'Blocked', reason: 'Waiting for backend fix', failures: 0, lastUpdated: new Date(Date.now() - 172800000).toISOString() },
    { id: '6', name: 'Reporting Module', status: 'Failed', reason: 'Calculation error in totals', failures: 3, lastUpdated: new Date().toISOString() }
];

let modules = [];

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    loadModules();
    renderDashboard();
    setupEventListeners();
});

// --- Core Functions ---

function loadModules() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            modules = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse modules', e);
            modules = [...SAMPLE_DATA];
        }
    } else {
        modules = [...SAMPLE_DATA];
        saveModules();
    }
}

function saveModules() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    renderDashboard();
}

function addModule(module) {
    modules.push({
        ...module,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString()
    });
    saveModules();
}

function updateModule(id, updates) {
    const index = modules.findIndex(m => m.id === id);
    if (index !== -1) {
        modules[index] = { ...modules[index], ...updates, lastUpdated: new Date().toISOString() };
        saveModules();
    }
}

function deleteModule(id) {
    modules = modules.filter(m => m.id !== id);
    saveModules();
}

// --- UI Rendering ---

function renderDashboard() {
    renderSummary();
    renderModuleList();
}

function renderSummary() {
    const total = modules.length;
    const passed = modules.filter(m => m.status === 'Passed').length;
    const failed = modules.filter(m => m.status === 'Failed').length;
    const inProgress = modules.filter(m => ['In Progress', 'Blocked'].includes(m.status)).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    const summaryHTML = `
        <div class="col-md-3 col-sm-6">
            <div class="card summary-card border-0 h-100 p-3 kpi-total">
                <div class="d-flex align-items-center">
                    <div class="kpi-icon me-3"><i class="bi bi-layers"></i></div>
                    <div>
                        <p class="text-muted mb-0 small text-uppercase fw-bold">Total Modules</p>
                        <h3 class="fw-bold mb-0">${total}</h3>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6">
            <div class="card summary-card border-0 h-100 p-3 kpi-passed">
                <div class="d-flex align-items-center">
                    <div class="kpi-icon me-3"><i class="bi bi-check-circle"></i></div>
                    <div>
                        <p class="text-muted mb-0 small text-uppercase fw-bold">Passed</p>
                        <h3 class="fw-bold mb-0">${passed}</h3>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6">
            <div class="card summary-card border-0 h-100 p-3 kpi-failed">
                <div class="d-flex align-items-center">
                    <div class="kpi-icon me-3"><i class="bi bi-x-circle"></i></div>
                    <div>
                        <p class="text-muted mb-0 small text-uppercase fw-bold">Failed</p>
                        <h3 class="fw-bold mb-0">${failed}</h3>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6">
            <div class="card summary-card border-0 h-100 p-3 kpi-rate">
                <div class="d-flex align-items-center">
                    <div class="kpi-icon me-3"><i class="bi bi-pie-chart"></i></div>
                    <div>
                        <p class="text-muted mb-0 small text-uppercase fw-bold">Pass Rate</p>
                        <h3 class="fw-bold mb-0">${passRate}%</h3>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('summarySection').innerHTML = summaryHTML;
}

function renderModuleList() {
    const filterStatus = document.getElementById('statusFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;

    let filtered = modules.filter(m => {
        const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
        const matchesSearch = m.name.toLowerCase().includes(searchText);
        return matchesStatus && matchesSearch;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        if (sortBy === 'failures_desc') return b.failures - a.failures;
        return 0;
    });

    const tbody = document.getElementById('modulesList');
    const emptyState = document.getElementById('emptyState');

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }

    emptyState.classList.add('d-none');
    tbody.innerHTML = filtered.map(m => `
        <tr>
            <td class="ps-4 fw-medium">${m.name}</td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm p-0 border-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="badge badge-status ${getStatusClass(m.status)}">${m.status} <i class="bi bi-chevron-down ms-1" style="font-size: 0.8em;"></i></span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="quickUpdateStatus('${m.id}', 'Passed')">Set to Passed</a></li>
                        <li><a class="dropdown-item" href="#" onclick="quickUpdateStatus('${m.id}', 'Failed')">Set to Failed</a></li>
                        <li><a class="dropdown-item" href="#" onclick="quickUpdateStatus('${m.id}', 'In Progress')">Set to In Progress</a></li>
                        <li><a class="dropdown-item" href="#" onclick="quickUpdateStatus('${m.id}', 'Blocked')">Set to Blocked</a></li>
                    </ul>
                </div>
            </td>
            <td class="text-muted small text-truncate" style="max-width: 200px;" title="${m.reason || ''}">${m.reason || '-'}</td>
            <td>${m.failures}</td>
            <td class="text-muted small">${formatDate(m.lastUpdated)}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-light text-primary me-1" onclick="openEditModal('${m.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger" onclick="openDeleteModal('${m.id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --- Helpers ---

function getStatusClass(status) {
    switch (status) {
        case 'Passed': return 'status-passed';
        case 'Failed': return 'status-failed';
        case 'In Progress': return 'status-inprogress';
        case 'Blocked': return 'status-blocked';
        default: return 'bg-secondary text-white';
    }
}

function formatDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- Event Listeners & Modal Handling ---

let currentDeleteId = null;
const moduleModal = new bootstrap.Modal(document.getElementById('moduleModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', renderModuleList);
    document.getElementById('statusFilter').addEventListener('change', renderModuleList);
    document.getElementById('sortBy').addEventListener('change', renderModuleList);

    document.getElementById('saveModuleBtn').addEventListener('click', handleSaveModule);
    document.getElementById('addModuleBtn').addEventListener('click', () => openEditModal(null));
    document.getElementById('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);

    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', handleExport);
    document.getElementById('importFile').addEventListener('change', handleImport);
}

// Expose functions to window for onclick handlers
window.openEditModal = function (id) {
    const form = document.getElementById('moduleForm');
    const modalTitle = document.getElementById('moduleModalLabel');

    if (id) {
        const module = modules.find(m => m.id === id);
        if (!module) return;

        document.getElementById('moduleId').value = module.id;
        document.getElementById('moduleName').value = module.name;
        document.getElementById('moduleStatus').value = module.status;
        document.getElementById('failureReason').value = module.reason || '';
        document.getElementById('failureCount').value = module.failures;
        modalTitle.textContent = 'Edit Module';
    } else {
        form.reset();
        document.getElementById('moduleId').value = '';
        document.getElementById('failureCount').value = 0;
        modalTitle.textContent = 'Add Module';
    }

    moduleModal.show();
};

window.openDeleteModal = function (id) {
    currentDeleteId = id;
    deleteModal.show();
};

function handleSaveModule() {
    const id = document.getElementById('moduleId').value;
    const name = document.getElementById('moduleName').value.trim();
    const status = document.getElementById('moduleStatus').value;
    const reason = document.getElementById('failureReason').value.trim();
    const failures = parseInt(document.getElementById('failureCount').value) || 0;

    if (!name) {
        alert('Module name is required');
        return;
    }

    const moduleData = { name, status, reason, failures };

    if (id) {
        updateModule(id, moduleData);
    } else {
        addModule(moduleData);
    }

    moduleModal.hide();
}

function handleConfirmDelete() {
    if (currentDeleteId) {
        deleteModule(currentDeleteId);
        currentDeleteId = null;
        deleteModal.hide();
    }
}

function handleExport() {
    const dataStr = JSON.stringify(modules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                modules = imported;
                saveModules();
                alert('Data imported successfully!');
            } else {
                alert('Invalid data format');
            }
        } catch (err) {
            alert('Error parsing JSON file');
        }
        event.target.value = ''; // Reset input
    };
    reader.readAsText(file);
}

window.quickUpdateStatus = function (id, newStatus) {
    const module = modules.find(m => m.id === id);
    if (!module) return;

    if (module.status === newStatus) return;

    let reason = module.reason;
    let failures = module.failures;

    // Logic for quick updates
    if (newStatus === 'Failed' || newStatus === 'Blocked') {
        const input = prompt(`Enter reason for ${newStatus} (optional):`, reason);
        if (input !== null) {
            reason = input;
        }

        if (newStatus === 'Failed') {
            // Suggest incrementing failure count
            const failInput = prompt("Update failure count?", failures + 1);
            if (failInput !== null) {
                failures = parseInt(failInput) || failures;
            }
        }
    } else if (newStatus === 'Passed') {
        // Optional: Clear reason when passing?
        // reason = ''; 
    }

    updateModule(id, { status: newStatus, reason, failures });
};
