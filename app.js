/**
 * Module Quality Dashboard - App Logic
 */

// --- Data Model & State ---

const STORAGE_KEY = 'qa_dashboard_modules';

// Default sample data
const SAMPLE_DATA = [
    { id: '1', name: 'Authentication Service', status: 'Passed', reason: '', failures: 0, lastUpdated: new Date().toISOString(), channels: { voice: true, sms: true, chat: true, email: true } },
    { id: '2', name: 'Payment Gateway', status: 'Failed', reason: 'Timeout on API response', failures: 5, lastUpdated: new Date(Date.now() - 86400000).toISOString(), channels: { voice: true, sms: false, chat: true, email: true } },
    { id: '3', name: 'User Profile', status: 'In Progress', reason: 'Pending UI tests', failures: 0, lastUpdated: new Date(Date.now() - 3600000).toISOString(), channels: { voice: true, sms: true, chat: true, email: true } },
    { id: '4', name: 'Search Engine', status: 'Passed', reason: '', failures: 1, lastUpdated: new Date().toISOString(), channels: { voice: true, sms: true, chat: true, email: true } },
    { id: '5', name: 'Notifications', status: 'Blocked', reason: 'Waiting for backend fix', failures: 0, lastUpdated: new Date(Date.now() - 172800000).toISOString(), channels: { voice: false, sms: false, chat: false, email: false } },
    { id: '6', name: 'Reporting Module', status: 'Failed', reason: 'Calculation error in totals', failures: 3, lastUpdated: new Date().toISOString(), channels: { voice: true, sms: true, chat: false, email: true } }
];

let modules = [];
let currentEnvironment = 'QA';
let releaseName = 'Release 1.0';
let statusChart = null;
let simulationInterval = null;

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    loadModules();
    loadReleaseName();
    initTheme();
    renderDashboard();
    setupEventListeners();
});

// --- Core Functions ---

function loadModules() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            modules = JSON.parse(stored);
            // Migration: Assign 'QA' to modules without environment
            let migrated = false;
            modules.forEach(m => {
                if (!m.environment) {
                    m.environment = 'QA';
                    migrated = true;
                }
                if (!m.channels) {
                    m.channels = { voice: true, sms: true, chat: true, email: true };
                    migrated = true;
                }
            });
            if (migrated) saveModules();
        } catch (e) {
            console.error('Failed to parse modules', e);
            modules = [...SAMPLE_DATA.map(m => ({ ...m, environment: 'QA' }))];
        }
    } else {
        modules = [...SAMPLE_DATA.map(m => ({ ...m, environment: 'QA' }))];
        saveModules();
    }
}

function loadReleaseName() {
    const stored = localStorage.getItem('qa_dashboard_release_name');
    if (stored) releaseName = stored;
    document.getElementById('releaseNameDisplay').textContent = releaseName;
}

function saveModules() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    renderDashboard();
}

function addModule(module) {
    modules.push({
        ...module,
        id: Date.now().toString(),
        environment: currentEnvironment,
        lastUpdated: new Date().toISOString(),
        channels: { voice: true, sms: true, chat: true, email: true }
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
    updateChart();
    updateActiveTab();
}

function updateActiveTab() {
    document.querySelectorAll('#envTabs .nav-link').forEach(link => {
        if (link.dataset.env === currentEnvironment) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function renderSummary() {
    const envModules = modules.filter(m => m.environment === currentEnvironment);
    const total = envModules.length;
    const passed = envModules.filter(m => m.status === 'Passed').length;
    const failed = envModules.filter(m => m.status === 'Failed').length;
    const inProgress = envModules.filter(m => ['In Progress', 'Blocked'].includes(m.status)).length;
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

function updateChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    const envModules = modules.filter(m => m.environment === currentEnvironment);
    const passed = envModules.filter(m => m.status === 'Passed').length;
    const failed = envModules.filter(m => m.status === 'Failed').length;
    const inProgress = envModules.filter(m => m.status === 'In Progress').length;
    const blocked = envModules.filter(m => m.status === 'Blocked').length;

    const data = {
        labels: ['Passed', 'Failed', 'In Progress', 'Blocked'],
        datasets: [{
            data: [passed, failed, inProgress, blocked],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6b7280'],
            borderWidth: 0
        }]
    };

    if (statusChart) {
        statusChart.data = data;
        statusChart.update();
    } else {
        statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

function renderModuleList() {
    const filterStatus = document.getElementById('statusFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;

    let filtered = modules.filter(m => {
        const matchesEnv = m.environment === currentEnvironment;
        const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
        const matchesSearch = m.name.toLowerCase().includes(searchText);
        return matchesEnv && matchesStatus && matchesSearch;
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
            <td>${renderChannelPills(m)}</td>
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
function renderChannelPills(module) {
    const channels = ['voice', 'sms', 'chat', 'email'];
    return `<div class="d-flex gap-1">
        ${channels.map(ch => {
        const isActive = module.channels && module.channels[ch];
        const colorClass = isActive ? 'status-passed' : 'status-failed';
        const icon = ch === 'voice' ? 'bi-mic' :
            ch === 'sms' ? 'bi-chat-left-text' :
                ch === 'chat' ? 'bi-chat-dots' : 'bi-envelope';
        return `
                <span class="badge badge-status ${colorClass} cursor-pointer" 
                      onclick="toggleChannelStatus('${module.id}', '${ch}')" 
                      title="Toggle ${ch} status" style="cursor: pointer; user-select: none;">
                    <i class="bi ${icon}"></i> ${ch.charAt(0).toUpperCase() + ch.slice(1)}
                </span>
            `;
    }).join('')}
    </div>`;
}

window.toggleChannelStatus = function (moduleId, channel) {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
        if (!module.channels) module.channels = { voice: true, sms: true, chat: true, email: true };
        module.channels[channel] = !module.channels[channel];
        updateModule(moduleId, { channels: module.channels });
    }
};

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

    // New Features
    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
    document.getElementById('simulateBtn').addEventListener('click', toggleSimulation);

    // Tabs & Release Name
    document.querySelectorAll('#envTabs .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentEnvironment = e.target.dataset.env;
            renderDashboard();
        });
    });

    const editReleaseBtn = document.getElementById('editReleaseBtn');
    if (editReleaseBtn) {
        editReleaseBtn.addEventListener('click', handleEditReleaseName);
    }

    const importModal = new bootstrap.Modal(document.getElementById('importModal'));
    const openImportBtn = document.getElementById('openImportModalBtn');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    const importSourceEnv = document.getElementById('importSourceEnv');
    const selectAllImport = document.getElementById('selectAllImport');

    if (openImportBtn) openImportBtn.addEventListener('click', openImportModal);
    if (confirmImportBtn) confirmImportBtn.addEventListener('click', handleImportModules);
    if (importSourceEnv) importSourceEnv.addEventListener('change', renderImportList);
    if (selectAllImport) selectAllImport.addEventListener('change', toggleSelectAllImport);
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
        showToast('Module name is required', 'error');
        return;
    }

    const moduleData = { name, status, reason, failures };

    if (id) {
        updateModule(id, moduleData);
        showToast('Module updated successfully', 'success');
    } else {
        addModule(moduleData);
        showToast('Module added successfully', 'success');
    }

    moduleModal.hide();
}

function handleConfirmDelete() {
    if (currentDeleteId) {
        deleteModule(currentDeleteId);
        showToast('Module deleted successfully', 'success');
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
                showToast('Data imported successfully!', 'success');
            } else {
                showToast('Invalid data format', 'error');
            }
        } catch (err) {
            showToast('Error parsing JSON file', 'error');
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
    showToast(`Status updated to ${newStatus}`, 'success');
};

// --- New Feature Functions ---

function initTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
}

function toggleDarkMode(e) {
    if (e.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function showToast(message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMessage');

    toastBody.textContent = message;
    toastEl.className = 'toast align-items-center border-0 text-white';

    if (type === 'success') toastEl.classList.add('bg-success');
    else if (type === 'error') toastEl.classList.add('bg-danger');
    else toastEl.classList.add('bg-primary');

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function toggleSimulation() {
    const btn = document.getElementById('simulateBtn');
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        btn.innerHTML = '<i class="bi bi-play-circle"></i> Simulate';
        btn.classList.remove('active');
        showToast('Simulation stopped');
    } else {
        simulationInterval = setInterval(simulateRandomUpdate, 2000);
        btn.innerHTML = '<i class="bi bi-stop-circle"></i> Stop';
        btn.classList.add('active');
        showToast('Simulation started', 'info');
    }
}

function simulateRandomUpdate() {
    const envModules = modules.filter(m => m.environment === currentEnvironment);
    if (envModules.length === 0) return;

    const randomModule = envModules[Math.floor(Math.random() * envModules.length)];
    const statuses = ['Passed', 'Failed', 'In Progress', 'Blocked'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

    if (randomModule.status !== newStatus) {
        let updates = { status: newStatus };
        if (newStatus === 'Failed') {
            updates.failures = randomModule.failures + 1;
            updates.reason = 'Simulated failure at ' + new Date().toLocaleTimeString();
        }
        updateModule(randomModule.id, updates);
        showToast(`Simulated: ${randomModule.name} -> ${newStatus}`, 'info');
    }
}

function handleEditReleaseName() {
    const newName = prompt("Enter Release Name:", releaseName);
    if (newName && newName.trim() !== "") {
        releaseName = newName.trim();
        localStorage.setItem('qa_dashboard_release_name', releaseName);
        document.getElementById('releaseNameDisplay').textContent = releaseName;
        showToast('Release name updated', 'success');
    }
}

// --- Import Logic ---

function openImportModal() {
    const sourceSelect = document.getElementById('importSourceEnv');
    const envs = ['QA', 'SAT', 'Prod'];

    sourceSelect.innerHTML = envs
        .filter(e => e !== currentEnvironment)
        .map(e => `<option value="${e}">${e}</option>`)
        .join('');

    renderImportList();
    const modal = new bootstrap.Modal(document.getElementById('importModal'));
    modal.show();
}

function renderImportList() {
    const sourceEnv = document.getElementById('importSourceEnv').value;
    const listContainer = document.getElementById('importModuleList');
    const confirmBtn = document.getElementById('confirmImportBtn');

    // Get modules from source env that are NOT in current env (by name)
    const sourceModules = modules.filter(m => m.environment === sourceEnv);
    const currentModuleNames = new Set(modules.filter(m => m.environment === currentEnvironment).map(m => m.name));

    const availableModules = sourceModules.filter(m => !currentModuleNames.has(m.name));

    if (availableModules.length === 0) {
        listContainer.innerHTML = '<p class="text-muted text-center my-3 small">No new modules to import.</p>';
        confirmBtn.disabled = true;
        return;
    }

    listContainer.innerHTML = availableModules.map(m => `
        <div class="form-check">
            <input class="form-check-input import-checkbox" type="checkbox" value="${m.id}" id="import_${m.id}">
            <label class="form-check-label w-100 cursor-pointer" for="import_${m.id}">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${m.name}</span>
                    <span class="badge bg-light text-dark border">${m.status}</span>
                </div>
            </label>
        </div>
    `).join('');

    confirmBtn.disabled = false;

    // Uncheck select all
    document.getElementById('selectAllImport').checked = false;
}

function toggleSelectAllImport(e) {
    const checkboxes = document.querySelectorAll('.import-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
}

function handleImportModules() {
    const checkboxes = document.querySelectorAll('.import-checkbox:checked');
    if (checkboxes.length === 0) {
        showToast('Please select at least one module', 'error');
        return;
    }

    const sourceEnv = document.getElementById('importSourceEnv').value;
    let count = 0;

    checkboxes.forEach(cb => {
        const original = modules.find(m => m.id === cb.value);
        if (original) {
            addModule({
                name: original.name,
                status: 'In Progress',
                reason: '',
                failures: 0
            });
            count++;
        }
    });

    const modalEl = document.getElementById('importModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    showToast(`Successfully imported ${count} modules from ${sourceEnv}`, 'success');
}
