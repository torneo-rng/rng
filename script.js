// Tournament RNG Application JavaScript

// Data Storage Keys
const STORAGE_KEYS = {
    PARTICIPANTS: 'tournament_participants',
    BRACKETS: 'tournament_brackets'
};

// Division Configuration
const DIVISIONS = {
    elite: {
        name: 'Div Elite',
        icon: 'fas fa-crown',
        color: '#ffd700'
    },
    div1: {
        name: 'Div 1',
        icon: 'fas fa-star',
        color: '#ffd700'
    },
    div2: {
        name: 'Div 2',
        icon: 'fas fa-shield-alt',
        color: '#ffd700'
    },
    div3: {
        name: 'Div 3',
        icon: 'fas fa-medal',
        color: '#ffd700'
    }
};

// Participant Class
class Participant {
    constructor(robloxUsername, discordUsername, division) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.robloxUsername = robloxUsername;
        this.discordUsername = discordUsername;
        this.division = division;
        this.registrationDate = new Date().toISOString();
    }
}

// Tournament Manager Class
class TournamentManager {
    constructor() {
        this.participants = this.loadParticipants();
        this.brackets = this.loadBrackets();
    }

    // Load participants from local storage
    loadParticipants() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading participants:', error);
            return [];
        }
    }

    // Save participants to local storage
    saveParticipants() {
        try {
            localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(this.participants));
        } catch (error) {
            console.error('Error saving participants:', error);
        }
    }

    // Load brackets from local storage
    loadBrackets() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.BRACKETS);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading brackets:', error);
            return {};
        }
    }

    // Save brackets to local storage
    saveBrackets() {
        try {
            localStorage.setItem(STORAGE_KEYS.BRACKETS, JSON.stringify(this.brackets));
        } catch (error) {
            console.error('Error saving brackets:', error);
        }
    }

    // Add a new participant
    addParticipant(robloxUsername, discordUsername, division) {
        // Check if participant already exists
        const existingParticipant = this.participants.find(p => 
            p.robloxUsername.toLowerCase() === robloxUsername.toLowerCase() ||
            p.discordUsername.toLowerCase() === discordUsername.toLowerCase()
        );

        if (existingParticipant) {
            throw new Error('Ya existe un participante con ese nombre de usuario');
        }

        const participant = new Participant(robloxUsername, discordUsername, division);
        this.participants.push(participant);
        this.saveParticipants();
        
        // Auto-generate bracket for the division
        this.generateBracket(division);
        
        return participant;
    }

    // Get participants by division
    getParticipantsByDivision(division) {
        return this.participants.filter(p => p.division === division);
    }

    // Get total participants count
    getTotalParticipants() {
        return this.participants.length;
    }

    // Get active divisions count
    getActiveDivisions() {
        const divisions = new Set(this.participants.map(p => p.division));
        return divisions.size;
    }

    // Generate bracket for a division
    generateBracket(division) {
        const participants = this.getParticipantsByDivision(division);
        
        if (participants.length < 2) {
            return null;
        }

        // Shuffle participants randomly
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        // Create bracket structure
        const bracket = {
            division: division,
            participants: shuffled,
            rounds: this.createBracketRounds(shuffled),
            generated: new Date().toISOString()
        };

        this.brackets[division] = bracket;
        this.saveBrackets();
        return bracket;
    }

    // Create bracket rounds
    createBracketRounds(participants) {
        let rounds = [];
        let currentRound = participants.slice();

        // Ensure even number of participants (add bye if needed)
        if (currentRound.length % 2 !== 0) {
            currentRound.push({ id: 'bye', robloxBountyUsername: 'BYE', robloxUsername: 'BYE' });
        }

        let roundNumber = 1;
        
        while (currentRound.length > 1) {
            const matches = [];
            const nextRound = [];

            // Create matches for current round
            for (let i = 0; i < currentRound.length; i += 2) {
                const match = {
                    id: `round${roundNumber}_match${Math.floor(i/2) + 1}`,
                    player1: currentRound[i],
                    player2: currentRound[i + 1],
                    winner: null
                };
                matches.push(match);
                nextRound.push(null); // Placeholder for winner
            }

            rounds.push({
                round: roundNumber,
                name: this.getRoundName(roundNumber, Math.log2(participants.length)),
                matches: matches
            });

            currentRound = nextRound;
            roundNumber++;
        }

        return rounds;
    }

    // Get round name based on round number and total rounds
    getRoundName(roundNumber, totalRounds) {
        const roundsFromEnd = Math.ceil(totalRounds) - roundNumber + 1;
        
        switch (roundsFromEnd) {
            case 1: return 'Final';
            case 2: return 'Semifinal';
            case 3: return 'Cuartos de Final';
            case 4: return 'Octavos de Final';
            default: return `Ronda ${roundNumber}`;
        }
    }

    // Get bracket for division
    getBracket(division) {
        return this.brackets[division] || null;
    }

    // Reset all brackets
    resetBrackets() {
        this.brackets = {};
        this.saveBrackets();
    }

    // Reset bracket for specific division
    resetBracket(division) {
        delete this.brackets[division];
        this.saveBrackets();
    }

    // Additional methods for participant management
    getParticipantById(id) {
        return this.participants.find(p => p.id === id);
    }

    removeParticipant(id) {
        this.participants = this.participants.filter(p => p.id !== id);
        this.saveParticipants();
    }

    clearParticipants() {
        this.participants = [];
        localStorage.removeItem('tournament_participants');
    }

    getAllBrackets() {
        return this.brackets;
    }

    addParticipant(participantData) {
        // Support both old signature (roblox, discord, division) and new (object)
        let participant;
        if (typeof participantData === 'string') {
            // Old signature: addParticipant(robloxUsername, discordUsername, division)
            participant = {
                id: this.generateId(),
                robloxUsername: participantData,
                discordUsername: arguments[1],
                division: arguments[2],
                registrationDate: new Date().toISOString()
            };
        } else {
            // New signature: addParticipant(participantObject)
            participant = {
                id: participantData.id || this.generateId(),
                robloxUsername: participantData.robloxUsername,
                discordUsername: participantData.discordUsername,
                division: participantData.division,
                registrationDate: participantData.registrationDate || new Date().toISOString()
            };
        }
        
        this.participants.push(participant);
        this.saveParticipants();
        return participant;
    }
}

// Global tournament manager instance
let tournamentManager = new TournamentManager();

// Form Validation
function validateUsername(username) {
    if (!username || username.trim().length === 0) {
        return 'El nombre de usuario es requerido';
    }
    if (username.length < 3) {
        return 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    if (username.length > 20) {
        return 'El nombre de usuario no puede tener más de 20 caracteres';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }
    return null;
}

// Initialize Registration Form
function initializeRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    form.addEventListener('submit', handleRegistration);
}

// Handle Registration Form Submit
function handleRegistration(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const robloxUsername = formData.get('robloxUsername').trim();
    const discordUsername = formData.get('discordUsername').trim();
    const division = formData.get('division');

    // Validate inputs
    const robloxError = validateUsername(robloxUsername);
    const discordError = validateUsername(discordUsername);

    if (robloxError || discordError) {
        showMessage('Error: ' + (robloxError || discordError), 'error');
        return;
    }

    if (!division) {
        showMessage('Error: Debe seleccionar una división', 'error');
        return;
    }

    try {
        const participant = tournamentManager.addParticipant(
            robloxUsername,
            discordUsername,
            division
        );

        showMessage('¡Inscripción exitosa! Te has registrado en la división ' + DIVISIONS[division].name, 'success');
        event.target.reset();
        
        // Update participant counts if on home page
        if (typeof updateParticipantCounts === 'function') {
            updateParticipantCounts();
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Show Message
function showMessage(message, type) {
    const messageDiv = document.getElementById('registrationMessage');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    // Hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Reset Registration Form
function resetForm() {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.reset();
    }
    
    const messageDiv = document.getElementById('registrationMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Update Participant Counts (for home page)
function updateParticipantCounts() {
    // Update total participants
    const totalElement = document.getElementById('totalParticipants');
    if (totalElement) {
        totalElement.textContent = tournamentManager.getTotalParticipants();
    }

    // Update division counts
    Object.keys(DIVISIONS).forEach(division => {
        const countElement = document.getElementById(division + 'Count');
        if (countElement) {
            countElement.textContent = tournamentManager.getParticipantsByDivision(division).length;
        }
    });
}

// Load Participants Page
function loadParticipants() {
    updateParticipantsStats();
    loadParticipantsByDivision();
}

// Update Participants Stats
function updateParticipantsStats() {
    const totalCount = document.getElementById('totalParticipantsCount');
    const activeDivisions = document.getElementById('activeDivisions');

    if (totalCount) {
        totalCount.textContent = tournamentManager.getTotalParticipants();
    }

    if (activeDivisions) {
        activeDivisions.textContent = tournamentManager.getActiveDivisions();
    }
}

// Load Participants by Division
function loadParticipantsByDivision() {
    Object.keys(DIVISIONS).forEach(division => {
        const participants = tournamentManager.getParticipantsByDivision(division);
        const container = document.getElementById(division + 'Participants');
        const countElement = document.getElementById(division + 'ParticipantCount');

        if (countElement) {
            countElement.textContent = participants.length;
        }

        if (container) {
            if (participants.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-slash"></i>
                        <p>No hay participantes inscritos en esta división</p>
                    </div>
                `;
            } else {
                container.innerHTML = participants.map(participant => `
                    <div class="participant-card">
                        <h4><i class="fas fa-user"></i> ${participant.robloxUsername}</h4>
                        <p><strong>Discord:</strong> <span class="participant-username">${participant.discordUsername}</span></p>
                        <p><strong>División:</strong> ${DIVISIONS[participant.division].name}</p>
                        <p><strong>Registro:</strong> ${new Date(participant.registrationDate).toLocaleDateString()}</p>
                    </div>
                `).join('');
            }
        }
    });
}

// Load Brackets Page
function loadBrackets() {
    updateBracketParticipantCounts();
    Object.keys(DIVISIONS).forEach(division => {
        const bracket = tournamentManager.getBracket(division);
        const container = document.getElementById(division + 'Bracket');

        if (container) {
            if (!bracket) {
                container.innerHTML = `
                    <div class="bracket-empty">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>No hay suficientes participantes para generar bracket</p>
                    </div>
                `;
            } else {
                container.innerHTML = renderBracket(bracket);
            }
        }
    });
}

// Update Bracket Participant Counts
function updateBracketParticipantCounts() {
    Object.keys(DIVISIONS).forEach(division => {
        const participants = tournamentManager.getParticipantsByDivision(division);
        const countElement = document.getElementById(division + 'ParticipantCount');
        if (countElement) {
            countElement.textContent = `${participants.length} participantes`;
        }
    });
}

// Render Bracket
function renderBracket(bracket) {
    if (!bracket.rounds || bracket.rounds.length === 0) {
        return `
            <div class="bracket-empty">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al generar bracket</p>
            </div>
        `;
    }

    let html = '<div class="bracket-tree">';
    
    bracket.rounds.forEach(round => {
        html += `
            <div class="bracket-round">
                <h4>${round.name}</h4>
                <div class="bracket-matches">
        `;
        
        round.matches.forEach(match => {
            html += `
                <div class="bracket-match">
                    <div class="bracket-player ${match.winner === match.player1?.id ? 'winner' : ''}">
                        <span class="player-name">${match.player1?.robloxUsername || 'TBD'}</span>
                        <span class="player-score">${match.winner === match.player1?.id ? 'W' : ''}</span>
                    </div>
                    <div class="bracket-player ${match.winner === match.player2?.id ? 'winner' : ''}">
                        <span class="player-name">${match.player2?.robloxUsername || 'TBD'}</span>
                        <span class="player-score">${match.winner === match.player2?.id ? 'W' : ''}</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Generate All Brackets
function generateAllBrackets() {
    let generated = 0;
    
    Object.keys(DIVISIONS).forEach(division => {
        const bracket = tournamentManager.generateBracket(division);
        if (bracket) {
            generated++;
        }
    });

    if (generated > 0) {
        loadBrackets();
        alert(`Se generaron ${generated} bracket(s) exitosamente`);
    } else {
        alert('No hay suficientes participantes en ninguna división para generar brackets');
    }
}

// Reset All Brackets
function resetAllBrackets() {
    if (confirm('¿Está seguro de que desea reiniciar todos los brackets?')) {
        tournamentManager.resetBrackets();
        loadBrackets();
        alert('Todos los brackets han sido reiniciados');
    }
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tournament manager
    tournamentManager = new TournamentManager();
    
    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'index.html':
        case '':
            if (typeof updateParticipantCounts === 'function') {
                updateParticipantCounts();
            }
            break;
        case 'register.html':
            initializeRegistrationForm();
            break;
        case 'participants.html':
            loadParticipants();
            break;
        case 'classification.html':
            loadBrackets();
            break;
    }
});

// Admin Panel Functions
function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

function verifyAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    if (password === 'WLT2000') {
        closeAdminLogin();
        showAdminPanel();
    } else {
        alert('Contraseña incorrecta');
        document.getElementById('adminPassword').value = '';
    }
}

function showAdminPanel() {
    document.getElementById('adminPanelModal').style.display = 'block';
    showAdminTab('brackets');
}

function closeAdminPanel() {
    document.getElementById('adminPanelModal').style.display = 'none';
}

function showAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    // Load tab-specific data
    if (tabName === 'participants') {
        loadParticipantsList();
        updateParticipantsStats();
    } else if (tabName === 'data') {
        updateDataPreview();
    }
}

function loadAdminBracket() {
    const division = document.getElementById('adminDivisionSelect').value;
    const editor = document.getElementById('adminBracketEditor');
    
    if (!division) {
        editor.innerHTML = '<p>Selecciona una división para editar su bracket</p>';
        return;
    }

    const participants = tournamentManager.getParticipantsByDivision(division);
    const bracket = tournamentManager.getBracket(division);

    if (participants.length === 0) {
        editor.innerHTML = '<p>No hay participantes en esta división</p>';
        return;
    }

    if (!bracket) {
        editor.innerHTML = `
            <p>No hay bracket generado para esta división</p>
            <button class="btn-primary" onclick="generateSingleBracket('${division}')">
                Generar Bracket para ${DIVISIONS[division].name}
            </button>
        `;
        return;
    }

    editor.innerHTML = renderAdminBracket(bracket, division);
}

function renderAdminBracket(bracket, division) {
    if (!bracket.rounds || bracket.rounds.length === 0) {
        return '<p>Error al cargar el bracket</p>';
    }

    let html = '<div class="admin-bracket-tree">';
    
    bracket.rounds.forEach((round, roundIndex) => {
        html += `
            <div class="admin-bracket-round">
                <h4>${round.name}</h4>
                <div class="admin-bracket-matches">
        `;
        
        round.matches.forEach((match, matchIndex) => {
            html += `
                <div class="editable-match">
                    <div class="match-header">Match ${matchIndex + 1}</div>
                    <div class="editable-player ${match.winner === match.player1?.id ? 'winner' : ''}" 
                         onclick="selectWinner('${division}', ${roundIndex}, ${matchIndex}, 1)">
                        <span class="player-name">${match.player1?.robloxUsername || 'TBD'}</span>
                        <div class="player-controls">
                            <button class="win-button" onclick="event.stopPropagation(); selectWinner('${division}', ${roundIndex}, ${matchIndex}, 1)">
                                Ganar
                            </button>
                        </div>
                    </div>
                    <div class="editable-player ${match.winner === match.player2?.id ? 'winner' : ''}"
                         onclick="selectWinner('${division}', ${roundIndex}, ${matchIndex}, 2)">
                        <span class="player-name">${match.player2?.robloxUsername || 'TBD'}</span>
                        <div class="player-controls">
                            <button class="win-button" onclick="event.stopPropagation(); selectWinner('${division}', ${roundIndex}, ${matchIndex}, 2)">
                                Ganar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    html += `
        <div class="admin-bracket-controls">
            <button class="btn-secondary" onclick="regenerateBracket('${division}')">
                <i class="fas fa-sync"></i>
                Regenerar Bracket
            </button>
            <button class="btn-secondary" onclick="resetBracket('${division}')">
                <i class="fas fa-trash"></i>
                Reiniciar Bracket
            </button>
        </div>
    `;
    
    return html;
}

function selectWinner(division, roundIndex, matchIndex, playerNumber) {
    const bracket = tournamentManager.getBracket(division);
    if (!bracket || !bracket.rounds[roundIndex] || !bracket.rounds[roundIndex].matches[matchIndex]) {
        return;
    }

    const match = bracket.rounds[roundIndex].matches[matchIndex];
    const winner = playerNumber === 1 ? match.player1 : match.player2;
    
    if (!winner || winner.robloxUsername === 'TBD') {
        alert('No se puede seleccionar ganador para un participante indefinido');
        return;
    }

    match.winner = winner.id;
    
    // Update next round if exists
    if (roundIndex + 1 < bracket.rounds.length) {
        const nextRound = bracket.rounds[roundIndex + 1];
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const nextPlayerSlot = matchIndex % 2;
        
        if (nextRound.matches[nextMatchIndex]) {
            if (nextPlayerSlot === 0) {
                nextRound.matches[nextMatchIndex].player1 = winner;
            } else {
                nextRound.matches[nextMatchIndex].player2 = winner;
            }
        }
    }

    tournamentManager.saveBrackets();
    loadAdminBracket();
    loadBrackets(); // Update main view
}

function generateSingleBracket(division) {
    const bracket = tournamentManager.generateBracket(division);
    if (bracket) {
        loadAdminBracket();
        loadBrackets();
        alert(`Bracket generado para ${DIVISIONS[division].name}`);
    } else {
        alert('No hay suficientes participantes para generar bracket');
    }
}

function regenerateBracket(division) {
    if (confirm(`¿Regenerar el bracket de ${DIVISIONS[division].name}? Esto eliminará el progreso actual.`)) {
        tournamentManager.resetBracket(division);
        const bracket = tournamentManager.generateBracket(division);
        if (bracket) {
            loadAdminBracket();
            loadBrackets();
            alert('Bracket regenerado exitosamente');
        } else {
            alert('No hay suficientes participantes para generar bracket');
        }
    }
}

function resetBracket(division) {
    if (confirm(`¿Reiniciar el bracket de ${DIVISIONS[division].name}?`)) {
        tournamentManager.resetBracket(division);
        loadAdminBracket();
        loadBrackets();
        alert('Bracket reiniciado');
    }
}

function generateAllBracketsAdmin() {
    const statusDiv = document.getElementById('generateStatus');
    let generated = 0;
    let results = [];
    
    Object.keys(DIVISIONS).forEach(division => {
        const participants = tournamentManager.getParticipantsByDivision(division);
        if (participants.length >= 2) {
            const bracket = tournamentManager.generateBracket(division);
            if (bracket) {
                generated++;
                results.push(`✓ ${DIVISIONS[division].name}: ${participants.length} participantes`);
            }
        } else {
            results.push(`✗ ${DIVISIONS[division].name}: Solo ${participants.length} participante(s)`);
        }
    });

    statusDiv.innerHTML = `
        <h4>Resultado de generación:</h4>
        <ul>
            ${results.map(result => `<li>${result}</li>`).join('')}
        </ul>
        <p><strong>Total brackets generados: ${generated}</strong></p>
    `;

    loadBrackets();
}

function resetAllBracketsAdmin() {
    if (confirm('¿Está seguro de que desea reiniciar todos los brackets?')) {
        tournamentManager.resetBrackets();
        loadBrackets();
        document.getElementById('generateStatus').innerHTML = '<p>Todos los brackets han sido reiniciados</p>';
        
        // Clear admin bracket editor if open
        const adminSelect = document.getElementById('adminDivisionSelect');
        if (adminSelect.value) {
            loadAdminBracket();
        }
    }
}

// Participants Management Functions
function updateParticipantsStats() {
    const participants = tournamentManager.getAllParticipants();
    const stats = {
        total: participants.length,
        elite: 0,
        div1: 0,
        div2: 0,
        div3: 0
    };

    participants.forEach(participant => {
        stats[participant.division]++;
    });

    document.getElementById('totalParticipants').textContent = stats.total;
    document.getElementById('eliteCount').textContent = stats.elite;
    document.getElementById('div1Count').textContent = stats.div1;
    document.getElementById('div2Count').textContent = stats.div2;
    document.getElementById('div3Count').textContent = stats.div3;
}

function loadParticipantsList() {
    const filter = document.getElementById('participantDivisionFilter').value;
    const participants = tournamentManager.getAllParticipants();
    const listContainer = document.getElementById('participantsList');

    let filteredParticipants = participants;
    if (filter !== 'all') {
        filteredParticipants = participants.filter(p => p.division === filter);
    }

    if (filteredParticipants.length === 0) {
        listContainer.innerHTML = '<p>No hay participantes en esta división</p>';
        return;
    }

    let html = '';
    filteredParticipants.forEach(participant => {
        html += `
            <div class="participant-item">
                <div class="participant-info">
                    <h5>${participant.robloxUsername}</h5>
                    <p><strong>Discord:</strong> ${participant.discordUsername}</p>
                    <p><strong>División:</strong> ${DIVISIONS[participant.division].name}</p>
                    <p><strong>Registrado:</strong> ${new Date(participant.registrationDate).toLocaleString()}</p>
                </div>
                <div class="participant-controls">
                    <button class="btn-edit" onclick="editParticipant('${participant.id}')">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-delete" onclick="deleteParticipant('${participant.id}')">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function editParticipant(participantId) {
    const participant = tournamentManager.getParticipantById(participantId);
    if (!participant) {
        alert('Participante no encontrado');
        return;
    }

    const newRobloxUsername = prompt('Nuevo nombre de Roblox:', participant.robloxUsername);
    if (newRobloxUsername === null) return;

    const newDiscordUsername = prompt('Nuevo nombre de Discord:', participant.discordUsername);
    if (newDiscordUsername === null) return;

    const newDivision = prompt('Nueva división (elite, div1, div2, div3):', participant.division);
    if (newDivision === null) return;

    if (!DIVISIONS[newDivision]) {
        alert('División inválida');
        return;
    }

    // Update participant
    participant.robloxUsername = newRobloxUsername.trim();
    participant.discordUsername = newDiscordUsername.trim();
    participant.division = newDivision;

    tournamentManager.saveParticipants();
    loadParticipantsList();
    updateParticipantsStats();
    updateParticipantCounts();
    loadBrackets();
    
    alert('Participante actualizado exitosamente');
}

function deleteParticipant(participantId) {
    const participant = tournamentManager.getParticipantById(participantId);
    if (!participant) {
        alert('Participante no encontrado');
        return;
    }

    if (confirm(`¿Eliminar a ${participant.robloxUsername}?`)) {
        tournamentManager.removeParticipant(participantId);
        loadParticipantsList();
        updateParticipantsStats();
        updateParticipantCounts();
        loadBrackets();
        
        alert('Participante eliminado exitosamente');
    }
}

// JSON Data Management Functions
function exportParticipantsJSON() {
    const participants = tournamentManager.getAllParticipants();
    const data = {
        exportDate: new Date().toISOString(),
        type: 'participants',
        participants: participants
    };
    
    downloadJSON(data, 'torneo_rng_participantes.json');
    updateDataPreview('participants', participants);
}

function exportBracketsJSON() {
    const brackets = tournamentManager.getAllBrackets();
    const data = {
        exportDate: new Date().toISOString(),
        type: 'brackets',
        brackets: brackets
    };
    
    downloadJSON(data, 'torneo_rng_brackets.json');
    updateDataPreview('brackets', brackets);
}

function exportAllDataJSON() {
    const participants = tournamentManager.getAllParticipants();
    const brackets = tournamentManager.getAllBrackets();
    const data = {
        exportDate: new Date().toISOString(),
        type: 'complete',
        participants: participants,
        brackets: brackets
    };
    
    downloadJSON(data, 'torneo_rng_completo.json');
    updateDataPreview('complete', data);
}

function downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Archivo ${filename} descargado exitosamente`);
}

function handleJSONImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type === 'participants' && data.participants) {
                importParticipants(data.participants);
            } else if (data.type === 'brackets' && data.brackets) {
                importBrackets(data.brackets);
            } else if (data.type === 'complete') {
                importCompleteData(data);
            } else {
                alert('Formato de archivo JSON no válido');
            }
        } catch (error) {
            alert('Error al leer el archivo JSON: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function importParticipants(participants) {
    if (confirm('¿Importar participantes? Esto reemplazará los participantes actuales.')) {
        tournamentManager.clearParticipants();
        
        participants.forEach(participant => {
            tournamentManager.addParticipant(participant);
        });
        
        loadParticipantsList();
        updateParticipantsStats();
        updateParticipantCounts();
        loadBrackets();
        
        alert(`${participants.length} participantes importados exitosamente`);
    }
}

function importBrackets(brackets) {
    if (confirm('¿Importar brackets? Esto reemplazará los brackets actuales.')) {
        localStorage.setItem('tournament_brackets', JSON.stringify(brackets));
        loadBrackets();
        
        alert('Brackets importados exitosamente');
    }
}

function importCompleteData(data) {
    if (confirm('¿Importar todos los datos? Esto reemplazará toda la información actual.')) {
        if (data.participants) {
            tournamentManager.clearParticipants();
            data.participants.forEach(participant => {
                tournamentManager.addParticipant(participant);
            });
        }
        
        if (data.brackets) {
            localStorage.setItem('tournament_brackets', JSON.stringify(data.brackets));
        }
        
        loadParticipantsList();
        updateParticipantsStats();
        updateParticipantCounts();
        loadBrackets();
        
        alert('Datos completos importados exitosamente');
    }
}

function clearAllData() {
    if (confirm('¿ADVERTENCIA: Eliminar todos los datos del torneo? Esta acción no se puede deshacer.')) {
        if (confirm('¿Está completamente seguro? Se perderán todos los participantes y brackets.')) {
            localStorage.removeItem('tournament_participants');
            localStorage.removeItem('tournament_brackets');
            
            loadParticipantsList();
            updateParticipantsStats();
            updateParticipantCounts();
            loadBrackets();
            updateDataPreview();
            
            alert('Todos los datos han sido eliminados');
        }
    }
}

function updateDataPreview(type = null, data = null) {
    const previewDiv = document.getElementById('dataPreview');
    
    if (!type) {
        const participants = tournamentManager.getAllParticipants();
        const brackets = tournamentManager.getAllBrackets();
        
        previewDiv.innerHTML = `
<strong>Resumen de Datos:</strong>

Participantes: ${participants.length}
Brackets generados: ${Object.keys(brackets).length}

Última actualización: ${new Date().toLocaleString()}
        `;
        return;
    }
    
    let preview = '';
    if (type === 'participants') {
        preview = `Participantes exportados: ${data.length}\n\n`;
        preview += JSON.stringify(data.slice(0, 3), null, 2);
        if (data.length > 3) {
            preview += `\n... y ${data.length - 3} más`;
        }
    } else if (type === 'brackets') {
        preview = `Brackets exportados: ${Object.keys(data).length}\n\n`;
        preview += JSON.stringify(data, null, 2);
    } else if (type === 'complete') {
        preview = `Datos completos:\n`;
        preview += `- Participantes: ${data.participants?.length || 0}\n`;
        preview += `- Brackets: ${Object.keys(data.brackets || {}).length}\n\n`;
        preview += JSON.stringify(data, null, 2).substring(0, 500) + '...';
    }
    
    previewDiv.textContent = preview;
}

// Export for global access
window.tournamentManager = tournamentManager;
window.updateParticipantCounts = updateParticipantCounts;
window.resetForm = resetForm;
window.generateAllBrackets = generateAllBrackets;
window.resetAllBrackets = resetAllBrackets;
window.showAdminLogin = showAdminLogin;
window.closeAdminLogin = closeAdminLogin;
window.verifyAdminPassword = verifyAdminPassword;
window.showAdminPanel = showAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.showAdminTab = showAdminTab;
window.loadAdminBracket = loadAdminBracket;
window.selectWinner = selectWinner;
window.generateSingleBracket = generateSingleBracket;
window.regenerateBracket = regenerateBracket;
window.resetBracket = resetBracket;
window.generateAllBracketsAdmin = generateAllBracketsAdmin;
window.resetAllBracketsAdmin = resetAllBracketsAdmin;
window.updateParticipantsStats = updateParticipantsStats;
window.loadParticipantsList = loadParticipantsList;
window.editParticipant = editParticipant;
window.deleteParticipant = deleteParticipant;
window.exportParticipantsJSON = exportParticipantsJSON;
window.exportBracketsJSON = exportBracketsJSON;
window.exportAllDataJSON = exportAllDataJSON;
window.handleJSONImport = handleJSONImport;
window.clearAllData = clearAllData;
window.updateDataPreview = updateDataPreview;
