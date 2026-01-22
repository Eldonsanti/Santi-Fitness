// Sistema de Dashboard, Rutinas, Registros y Logros - SANTI FITNESS

// ============================================
// 1. SISTEMA DE RUTINAS GUARDADAS
// ============================================

function saveWorkout(workoutName, exercises, notes = '') {
  if (!isAuthenticated()) {
    return { success: false, message: 'Debes iniciar sesión' };
  }

  const workouts = JSON.parse(localStorage.getItem(`workouts_${currentUser.username}`)) || [];
  
  const newWorkout = {
    id: Date.now(),
    name: workoutName,
    exercises: exercises, // Array de {exerciseName, sets, reps, weight}
    notes: notes,
    date: new Date().toISOString(),
    completed: false
  };

  workouts.push(newWorkout);
  localStorage.setItem(`workouts_${currentUser.username}`, JSON.stringify(workouts));
  
  return { success: true, message: 'Rutina guardada exitosamente', workoutId: newWorkout.id };
}

function getWorkouts() {
  if (!isAuthenticated()) return [];
  return JSON.parse(localStorage.getItem(`workouts_${currentUser.username}`)) || [];
}

function deleteWorkout(workoutId) {
  if (!isAuthenticated()) return { success: false };
  
  const workouts = getWorkouts().filter(w => w.id !== workoutId);
  localStorage.setItem(`workouts_${currentUser.username}`, JSON.stringify(workouts));
  
  return { success: true, message: 'Rutina eliminada' };
}

function completeWorkout(workoutId) {
  if (!isAuthenticated()) return { success: false };
  
  const workouts = getWorkouts();
  const workout = workouts.find(w => w.id === workoutId);
  
  if (workout) {
    workout.completed = true;
    workout.completedDate = new Date().toISOString();
    localStorage.setItem(`workouts_${currentUser.username}`, JSON.stringify(workouts));
    
    // Otorgar logro
    unlockAchievement('workout_completed');
    
    return { success: true, message: 'Entrenamiento marcado como completado' };
  }
  
  return { success: false, message: 'Rutina no encontrada' };
}

// ============================================
// 2. TABLA DE REGISTROS DE PESO
// ============================================

function addWeightRecord(weight, notes = '') {
  if (!isAuthenticated()) {
    return { success: false, message: 'Debes iniciar sesión' };
  }

  const weightRecords = JSON.parse(localStorage.getItem(`weights_${currentUser.username}`)) || [];
  
  const record = {
    id: Date.now(),
    weight: parseFloat(weight),
    date: new Date().toISOString(),
    notes: notes
  };

  weightRecords.push(record);
  localStorage.setItem(`weights_${currentUser.username}`, JSON.stringify(weightRecords));
  
  // Actualizar último peso en perfil
  if (currentUser.profile) {
    currentUser.profile.weight = parseFloat(weight);
    const session = { ...currentUser };
    localStorage.setItem('currentSession', JSON.stringify(session));
  }

  return { success: true, message: 'Peso registrado' };
}

function getWeightRecords() {
  if (!isAuthenticated()) return [];
  return JSON.parse(localStorage.getItem(`weights_${currentUser.username}`)) || [];
}

function getWeightStats() {
  const records = getWeightRecords();
  if (records.length === 0) return null;

  const weights = records.map(r => r.weight);
  const current = weights[weights.length - 1];
  const initial = weights[0];
  const lowest = Math.min(...weights);
  const highest = Math.max(...weights);
  
  return {
    current: current,
    initial: initial,
    change: (current - initial).toFixed(2),
    lowest: lowest,
    highest: highest,
    average: (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2),
    recordCount: records.length
  };
}

// ============================================
// 3. SISTEMA DE LOGROS Y BADGES
// ============================================

const ACHIEVEMENTS = {
  'first_login': { name: '🎯 Primera Sesión', description: 'Inicia sesión por primera vez', rarity: 'common' },
  'first_workout': { name: '💪 Primer Entrenamiento', description: 'Completa tu primer entrenamiento', rarity: 'common' },
  'workout_completed': { name: '✅ Entrenador Dedicado', description: 'Completa un entrenamiento', rarity: 'common' },
  'week_warrior': { name: '🔥 Guerrero de la Semana', description: 'Completa 5 entrenamientos en una semana', rarity: 'rare' },
  'month_master': { name: '👑 Maestro del Mes', description: 'Completa 20 entrenamientos en un mes', rarity: 'epic' },
  'weight_logged': { name: '⚖️ Rastreador de Peso', description: 'Registra tu peso 5 veces', rarity: 'common' },
  'profile_complete': { name: '📋 Perfil Completo', description: 'Completa toda la información de tu perfil', rarity: 'common' },
  'routine_created': { name: '📅 Planificador', description: 'Crea tu primera rutina personalizada', rarity: 'uncommon' },
  'five_routines': { name: '🎨 Maestro de Rutinas', description: 'Crea 5 rutinas diferentes', rarity: 'rare' },
  'iron_lifter': { name: '⚔️ Levantador de Hierro', description: 'Realiza 100 entrenamientos', rarity: 'epic' },
  'consistency_king': { name: '🏅 Rey de la Consistencia', description: 'Entrena 30 días consecutivos', rarity: 'legendary' },
  'ten_kilos': { name: '⬇️ Primera Pérdida', description: 'Pierde 10 kg', rarity: 'rare' }
};

function unlockAchievement(achievementId) {
  if (!isAuthenticated()) return { success: false };

  const achievements = JSON.parse(localStorage.getItem(`achievements_${currentUser.username}`)) || [];
  
  if (!achievements.includes(achievementId) && ACHIEVEMENTS[achievementId]) {
    achievements.push(achievementId);
    localStorage.setItem(`achievements_${currentUser.username}`, JSON.stringify(achievements));
    
    const ach = ACHIEVEMENTS[achievementId];
    showNotification(`🏆 ¡LOGRO DESBLOQUEADO! ${ach.name}\n${ach.description}`, 'success');
    
    return { success: true, message: `Logro desbloqueado: ${ach.name}` };
  }
  
  return { success: false };
}

function grantAchievementFromPanel(achievementId) {
  if (!isAuthenticated()) return { success: false, message: 'Debes iniciar sesión' };

  if (!ACHIEVEMENTS[achievementId]) {
    return { success: false, message: 'Logro no válido' };
  }

  return unlockAchievement(achievementId);
}

function getAchievements() {
  if (!isAuthenticated()) return [];
  return JSON.parse(localStorage.getItem(`achievements_${currentUser.username}`)) || [];
}

function getAllAchievements() {
  return ACHIEVEMENTS;
}

function getAchievementProgress() {
  if (!isAuthenticated()) return null;

  const unlocked = getAchievements();
  const totalPossible = Object.keys(ACHIEVEMENTS).length;
  const progressPercent = ((unlocked.length / totalPossible) * 100).toFixed(1);

  return {
    unlocked: unlocked.length,
    total: totalPossible,
    percentage: progressPercent,
    nextMilestone: {
      25: '25% - Principiante',
      50: '50% - Intermedio',
      75: '75% - Avanzado',
      100: '100% - Maestro Fitness'
    }[(Math.floor(progressPercent / 25) * 25) || 25]
  };
}

function checkAndUnlockAchievements() {
  if (!isAuthenticated()) return;

  const achievements = getAchievements();
  
  // Week Warrior
  const workouts = getWorkouts();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekWorkouts = workouts.filter(w => new Date(w.completedDate) > weekAgo && w.completed).length;
  if (weekWorkouts >= 5) unlockAchievement('week_warrior');
  
  // Month Master
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthWorkouts = workouts.filter(w => new Date(w.completedDate) > monthAgo && w.completed).length;
  if (monthWorkouts >= 20) unlockAchievement('month_master');
  
  // Weight Logged
  const weights = getWeightRecords();
  if (weights.length >= 5) unlockAchievement('weight_logged');
  
  // Routine Created
  if (workouts.length >= 1) unlockAchievement('routine_created');
  
  // Five Routines
  if (workouts.length >= 5) unlockAchievement('five_routines');
  
  // Profile Complete
  if (currentUser.profile && currentUser.profile.age && currentUser.profile.height && currentUser.profile.weight) {
    unlockAchievement('profile_complete');
  }
}

// ============================================
// 4. NOTIFICACIONES Y RECORDATORIOS
// ============================================

function setReminder(title, time, type = 'workout') {
  if (!isAuthenticated()) return { success: false };

  const reminders = JSON.parse(localStorage.getItem(`reminders_${currentUser.username}`)) || [];
  
  const reminder = {
    id: Date.now(),
    title: title,
    time: time,
    type: type,
    created: new Date().toISOString(),
    active: true
  };

  reminders.push(reminder);
  localStorage.setItem(`reminders_${currentUser.username}`, JSON.stringify(reminders));
  
  return { success: true, message: 'Recordatorio establecido' };
}

function getReminders() {
  if (!isAuthenticated()) return [];
  return JSON.parse(localStorage.getItem(`reminders_${currentUser.username}`)) || [];
}

function deleteReminder(reminderId) {
  if (!isAuthenticated()) return;
  
  const reminders = getReminders().filter(r => r.id !== reminderId);
  localStorage.setItem(`reminders_${currentUser.username}`, JSON.stringify(reminders));
}

// ============================================
// 5. IMPORTAR / EXPORTAR DATOS
// ============================================

function exportUserData() {
  if (!isAuthenticated()) return;

  const userData = {
    user: currentUser,
    workouts: getWorkouts(),
    weights: getWeightRecords(),
    achievements: getAchievements(),
    reminders: getReminders(),
    exportDate: new Date().toISOString()
  };

  return JSON.stringify(userData, null, 2);
}

function downloadAsJSON() {
  const data = exportUserData();
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
  element.setAttribute('download', `SANTI-FITNESS-backup-${new Date().toISOString().split('T')[0]}.json`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function downloadAsCSV() {
  let csv = 'Tipo,Fecha,Detalles\n';
  
  // Entrenamientos
  getWorkouts().forEach(w => {
    csv += `Entrenamiento,"${new Date(w.date).toLocaleDateString()}","${w.name} - ${w.exercises.length} ejercicios"\n`;
  });
  
  // Registros de peso
  getWeightRecords().forEach(w => {
    csv += `Peso,"${new Date(w.date).toLocaleDateString()}","${w.weight} kg"\n`;
  });

  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  element.setAttribute('download', `SANTI-FITNESS-data-${new Date().toISOString().split('T')[0]}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// ============================================
// 6. PÁGINA DE ESTADÍSTICAS AVANZADA
// ============================================

function getStatistics() {
  if (!isAuthenticated()) return {};

  const workouts = getWorkouts();
  const weights = getWeightRecords();
  const achievements = getAchievements();

  // Calcular ejercicios más trabajados
  const exerciseCount = {};
  workouts.forEach(w => {
    w.exercises.forEach(e => {
      exerciseCount[e.exerciseName] = (exerciseCount[e.exerciseName] || 0) + 1;
    });
  });

  const topExercises = Object.entries(exerciseCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Calcular estadísticas de entrenamiento
  const totalWorkouts = workouts.length;
  const completedWorkouts = workouts.filter(w => w.completed).length;
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);

  // Promedio de entrenamientos por semana
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekWorkouts = workouts.filter(w => new Date(w.date) > weekAgo).length;

  return {
    totalWorkouts,
    completedWorkouts,
    completionRate: ((completedWorkouts / totalWorkouts) * 100).toFixed(1) || 0,
    totalExercises,
    averageExercisesPerWorkout: (totalExercises / totalWorkouts).toFixed(1) || 0,
    workoutsThisWeek: weekWorkouts,
    topExercises,
    weightStats: getWeightStats(),
    achievements: achievements.length,
    allAchievements: Object.keys(ACHIEVEMENTS).length
  };
}

// ============================================
// 7. SISTEMA DE COMENTARIOS / NOTAS
// ============================================

function addNote(title, content, type = 'general') {
  if (!isAuthenticated()) return { success: false, message: 'Debes iniciar sesión' };

  if (!title || !content) {
    return { success: false, message: 'Título y contenido requeridos' };
  }

  const notes = JSON.parse(localStorage.getItem(`notes_${currentUser.username}`)) || [];
  
  const note = {
    id: Date.now(),
    title: title,
    content: content,
    type: type, // 'general', 'workout', 'nutrition', 'progress'
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    isPinned: false
  };

  notes.unshift(note); // Agregar al inicio
  localStorage.setItem(`notes_${currentUser.username}`, JSON.stringify(notes));
  
  showNotification('📝 Nota guardada correctamente', 'success');
  return { success: true, message: 'Nota guardada', id: note.id };
}

function getNotes(type = null) {
  if (!isAuthenticated()) return [];
  
  const notes = JSON.parse(localStorage.getItem(`notes_${currentUser.username}`)) || [];
  return type ? notes.filter(n => n.type === type) : notes;
}

function deleteNote(noteId) {
  if (!isAuthenticated()) return { success: false };
  
  const notes = getNotes().filter(n => n.id !== noteId);
  localStorage.setItem(`notes_${currentUser.username}`, JSON.stringify(notes));
  showNotification('🗑️ Nota eliminada', 'info');
  return { success: true };
}

function updateNote(noteId, title, content, type) {
  if (!isAuthenticated()) return { success: false };

  const notes = getNotes();
  const noteIndex = notes.findIndex(n => n.id === noteId);
  
  if (noteIndex === -1) {
    return { success: false, message: 'Nota no encontrada' };
  }

  notes[noteIndex].title = title;
  notes[noteIndex].content = content;
  notes[noteIndex].type = type;
  notes[noteIndex].modified = new Date().toISOString();
  
  localStorage.setItem(`notes_${currentUser.username}`, JSON.stringify(notes));
  showNotification('✏️ Nota actualizada', 'success');
  return { success: true };
}

function pinNote(noteId) {
  if (!isAuthenticated()) return { success: false };

  const notes = getNotes();
  const note = notes.find(n => n.id === noteId);
  
  if (note) {
    note.isPinned = !note.isPinned;
    localStorage.setItem(`notes_${currentUser.username}`, JSON.stringify(notes));
    return { success: true, isPinned: note.isPinned };
  }
  
  return { success: false };
}

// ============================================
// 8. TEMA OSCURO / CLARO
// ============================================

function initTheme() {
  const savedTheme = localStorage.getItem(`theme_${currentUser?.username || 'guest'}`) || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'light') {
    root.style.setProperty('--bg-primary', '#f5f5f5');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--text-primary', '#000000');
    root.style.setProperty('--text-secondary', '#333333');
    document.body.style.background = 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)';
    document.body.style.color = '#000000';
  } else {
    root.style.setProperty('--bg-primary', '#000000');
    root.style.setProperty('--bg-secondary', '#0f1419');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--text-secondary', '#cccccc');
    document.body.style.background = 'linear-gradient(180deg, #000 0%, #0f2027 50%, #001a33 100%)';
    document.body.style.color = '#ffffff';
  }

  if (isAuthenticated()) {
    localStorage.setItem(`theme_${currentUser.username}`, theme);
  }
}

function toggleTheme() {
  const currentTheme = localStorage.getItem(`theme_${currentUser?.username || 'guest'}`) || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  showNotification(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
}

// ============================================
// 9. INICIALIZACIÓN DEL DASHBOARD
// ============================================

function initDashboard() {
  if (isAuthenticated()) {
    checkAndUnlockAchievements();
    initTheme();
    unlockAchievement('first_login');
  }
}

// ============================================
// 10. SINCRONIZACIÓN DE DATOS ENTRE PÁGINAS
// ============================================

// Guardar datos del Calendario
function saveCalendarData(calendarData) {
  if (!isAuthenticated()) return;
  localStorage.setItem(`calendar_${currentUser.username}`, JSON.stringify(calendarData));
}

// Obtener datos del Calendario
function getCalendarData() {
  if (!isAuthenticated()) return null;
  const data = localStorage.getItem(`calendar_${currentUser.username}`);
  return data ? JSON.parse(data) : null;
}

// Guardar datos de Progreso
function saveProgressData(progressData) {
  if (!isAuthenticated()) return;
  localStorage.setItem(`progress_${currentUser.username}`, JSON.stringify(progressData));
}

// Obtener datos de Progreso
function getProgressData() {
  if (!isAuthenticated()) return null;
  const data = localStorage.getItem(`progress_${currentUser.username}`);
  return data ? JSON.parse(data) : null;
}

// Guardar datos de Mentalidad
function saveMentalityData(mentalityData) {
  if (!isAuthenticated()) return;
  localStorage.setItem(`mentality_${currentUser.username}`, JSON.stringify(mentalityData));
}

// Obtener datos de Mentalidad
function getMentalityData() {
  if (!isAuthenticated()) return null;
  const data = localStorage.getItem(`mentality_${currentUser.username}`);
  return data ? JSON.parse(data) : null;
}

// Sincronizar todos los datos del usuario
function syncAllUserData() {
  if (!isAuthenticated()) return;
  
  const userData = {
    workouts: getWorkouts(),
    weights: getWeightRecords(),
    achievements: getAchievements(),
    reminders: getReminders(),
    notes: getNotes(),
    calendar: getCalendarData(),
    progress: getProgressData(),
    mentality: getMentalityData(),
    syncDate: new Date().toISOString()
  };
  
  return userData;
}

// Exportar incluyendo Calendario, Progreso y Mentalidad
function exportUserDataComplete() {
  if (!isAuthenticated()) return;

  const userData = {
    user: currentUser,
    workouts: getWorkouts(),
    weights: getWeightRecords(),
    achievements: getAchievements(),
    reminders: getReminders(),
    notes: getNotes(),
    calendar: getCalendarData(),
    progress: getProgressData(),
    mentality: getMentalityData(),
    exportDate: new Date().toISOString()
  };

  return JSON.stringify(userData, null, 2);
}

// ===== SINCRONIZACIÓN EN LA NUBE (Básica) =====
// Función para sincronizar datos (preparado para cloud)
function syncToCloud() {
  if (!isAuthenticated()) return;
  
  const userData = {
    username: currentUser.username,
    lastSync: new Date().toISOString(),
    data: {
      calendar: getCalendarData(),
      progress: getProgressData(),
      mentality: getMentalityData(),
      achievements: getAchievements(),
      notes: getNotes(),
      reminders: getReminders()
    }
  };

  // Simular sincronización
  localStorage.setItem(`sync_backup_${currentUser.username}`, JSON.stringify(userData));
  console.log(`✅ Datos sincronizados a las ${new Date().toLocaleTimeString()}`);
  return userData;
}

// Función para restaurar desde nube
function restoreFromCloud() {
  if (!isAuthenticated()) return;
  
  const backup = localStorage.getItem(`sync_backup_${currentUser.username}`);
  if (!backup) {
    console.log('❌ No hay backup disponible');
    return false;
  }

  const userData = JSON.parse(backup);
  
  // Restaurar cada sección
  if (userData.data.calendar) saveCalendarData(userData.data.calendar);
  if (userData.data.progress) saveProgressData(userData.data.progress);
  if (userData.data.mentality) saveMentalityData(userData.data.mentality);
  if (userData.data.achievements) localStorage.setItem(`achievements_${currentUser.username}`, JSON.stringify(userData.data.achievements));
  if (userData.data.notes) localStorage.setItem(`notes_${currentUser.username}`, JSON.stringify(userData.data.notes));
  if (userData.data.reminders) localStorage.setItem(`reminders_${currentUser.username}`, JSON.stringify(userData.data.reminders));

  console.log(`✅ Datos restaurados desde ${new Date(userData.lastSync).toLocaleString()}`);
  return true;
}

// Sincronización automática cada 5 minutos
setInterval(() => {
  if (isAuthenticated()) {
    syncToCloud();
  }
}, 300000); // 5 minutos

// ============================================
// FUNCIONES DE INTERFAZ DEL DASHBOARD
// ============================================

function setupDashboardUI() {
  if (!isAuthenticated()) {
    showNotification('⚠️ Debes iniciar sesión para ver el dashboard', 'error');
    setTimeout(() => window.location.href = 'index.html', 2000);
    return;
  }
  
  try {
    // Renderizar estadísticas
    renderStats();
    // Renderizar entrenamientos recientes
    renderRecentWorkouts();
    // Renderizar registros de peso
    renderWeightRecords();
    // Renderizar ejercicios más trabajados
    renderTopExercises();
    // Renderizar logros
    renderAchievements();
    // Renderizar notas
    renderNotes();
    // Renderizar recordatorios
    renderReminders();
  } catch (error) {
    console.error('Error al renderizar dashboard:', error);
    showNotification('⚠️ Error al cargar datos', 'error');
  }
}

function renderStats() {
  try {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    const stats = getStatistics();
    const weights = getWeightStats();
    
    const cards = [
      { icon: '💪', label: 'Entrenamientos', value: stats.totalWorkouts || 0, color: '#00ffc8' },
      { icon: '✅', label: 'Completados', value: stats.completedWorkouts || 0, color: '#00ff00' },
      { icon: '📊', label: 'Ejercicios', value: stats.totalExercises || 0, color: '#00d4ff' },
      { icon: '🏆', label: 'Logros', value: stats.achievements || 0, color: '#d4af37' },
      { icon: '⚖️', label: 'Peso Actual', value: weights?.current ? weights.current + ' kg' : '--', color: '#ff6b9d' },
      { icon: '📈', label: 'Cambio', value: weights?.change ? (parseFloat(weights.change) > 0 ? '+' : '') + weights.change + ' kg' : '--', color: weights?.change < 0 ? '#00ff00' : '#ff6b9d' }
    ];

    statsGrid.innerHTML = cards.map(card => `
      <div class="stat-card">
        <h3 style="color: ${card.color};">${card.icon} ${card.label}</h3>
        <div class="stat-value" style="color: ${card.color};">${card.value}</div>
        <div class="stat-label">Total</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error en renderStats:', error);
  }
}

function renderRecentWorkouts() {
  try {
    const container = document.getElementById('recentWorkouts');
    if (!container) return;

    const workouts = getWorkouts().slice(-5).reverse();
    
    if (workouts.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.6); font-size:14px;">📌 No hay entrenamientos registrados aún</p>';
      return;
    }

    container.innerHTML = workouts.map(w => `
      <div class="workout-item ${w.completed ? 'completed' : ''}">
        <div class="workout-name">${w.name || 'Sin nombre'}</div>
        <div class="workout-exercises">${new Date(w.date).toLocaleDateString('es-ES')}</div>
        <div class="exercise-list">
          ${w.exercises && w.exercises.length > 0 ? w.exercises.map(e => `<span class="exercise-tag">${e.exerciseName || 'Ejercicio'}</span>`).join('') : '<span class="exercise-tag">Sin ejercicios</span>'}
        </div>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
          ${!w.completed ? `<button class="btn" style="flex:1; padding: 6px; font-size: 11px;" onclick="completeWorkout(${w.id}); location.reload();">✓ Completar</button>` : '<span style="color: #00ff00; font-weight: 600;">✓ Completado</span>'}
          <button class="btn secondary" style="flex:1; padding: 6px; font-size: 11px;" onclick="deleteWorkout(${w.id}); location.reload();">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error en renderRecentWorkouts:', error);
    const container = document.getElementById('recentWorkouts');
    if (container) container.innerHTML = '<p style="color: #ff6b9d;">❌ Error al cargar entrenamientos</p>';
  }
}

function renderWeightRecords() {
  try {
    const container = document.getElementById('weightRecordsDiv');
    if (!container) return;

    const weights = getWeightRecords().slice(-10).reverse();
    const stats = getWeightStats();

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 20px;">';
    
    if (stats) {
      html += `
        <div style="background: rgba(0, 255, 200, 0.1); border: 1px solid rgba(0, 255, 200, 0.2); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Actual</div>
          <div style="font-size: 20px; font-weight: 800; color: #00ffc8;">${stats.current} kg</div>
        </div>
        <div style="background: rgba(0, 255, 200, 0.1); border: 1px solid rgba(0, 255, 200, 0.2); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Cambio</div>
          <div style="font-size: 20px; font-weight: 800; color: ${stats.change < 0 ? '#00ff00' : '#ff6b9d'};">${stats.change > 0 ? '+' : ''}${stats.change} kg</div>
        </div>
        <div style="background: rgba(0, 255, 200, 0.1); border: 1px solid rgba(0, 255, 200, 0.2); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 5px;">Promedio</div>
          <div style="font-size: 20px; font-weight: 800; color: #00d4ff;">${stats.average} kg</div>
        </div>
      `;
    }
    
    html += '</div>';
    
    if (weights.length > 0) {
      html += '<div style="max-height: 200px; overflow-y: auto;">';
      weights.forEach(w => {
        html += `
          <div class="note-item">
            <div class="note-info">
              <div class="note-title">${w.weight} kg</div>
              <div class="note-date">${new Date(w.date).toLocaleDateString('es-ES')} ${new Date(w.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</div>
              ${w.notes ? `<div class="note-content">${w.notes}</div>` : ''}
            </div>
            <button class="btn secondary" style="padding: 4px 8px; font-size: 11px;" onclick="deleteWeightRecord(${w.id}); location.reload();">✕</button>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<p style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">📌 Inicia registrando tu peso actual</p>';
    }

    container.innerHTML = html;
  } catch (error) {
    console.error('Error en renderWeightRecords:', error);
    const container = document.getElementById('weightRecordsDiv');
    if (container) container.innerHTML = '<p style="color: #ff6b9d;">❌ Error al cargar registros de peso</p>';
  }
}

function renderTopExercises() {
  const container = document.getElementById('topExercises');
  if (!container) return;

  const stats = getStatistics();
  const exercises = stats.topExercises || [];

  if (exercises.length === 0) {
    container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6);">📌 Completa entrenamientos para ver tus ejercicios favoritos</p>';
    return;
  }

  container.innerHTML = exercises.map((ex, idx) => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 255, 200, 0.08); padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #00ffc8;">
      <span style="font-weight: 600; color: #00ffc8;">${idx + 1}. ${ex.name}</span>
      <span style="background: rgba(0, 255, 200, 0.2); padding: 4px 10px; border-radius: 4px; font-size: 11px; color: #00d4ff; font-weight: 600;">${ex.count} veces</span>
    </div>
  `).join('');
}

function renderAchievements() {
  try {
    const container = document.getElementById('achievementsGrid');
    if (!container) return;

    const unlocked = getAchievements();
    const all = getAllAchievements();

    const badges = Object.entries(all).map(([id, ach]) => {
      const isUnlocked = unlocked.includes(id);
      return `
        <div class="achievement-badge" style="opacity: ${isUnlocked ? '1' : '0.4'}; cursor: pointer; position: relative;" title="${ach.description}">
          <div class="achievement-icon">${ach.name.split(' ')[0]}</div>
          <div class="achievement-name">${ach.name}</div>
          ${isUnlocked ? '<div style="position: absolute; top: 5px; right: 5px; background: #d4af37; color: black; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">✓</div>' : ''}
        </div>
      `;
    });

    container.innerHTML = badges.join('');
  } catch (error) {
    console.error('Error en renderAchievements:', error);
  }
}

function renderNotes() {
  try {
    const container = document.getElementById('notesDiv');
    if (!container) return;

    const notes = getNotes().slice(0, 5);

    if (notes.length === 0) {
      container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">📌 No hay notas. Crea tu primera nota</p>';
      return;
    }

    container.innerHTML = notes.map(n => `
      <div class="note-item" id="note-${n.id}">
        <div class="note-info">
          <div class="note-title">${n.title || 'Sin título'}</div>
          <div class="note-content">${(n.content || '').substring(0, 80)}${(n.content || '').length > 80 ? '...' : ''}</div>
          <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
            <span class="note-type">${n.type || 'general'}</span>
            <span class="note-date">${new Date(n.created).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-direction: column;">
          <button class="btn secondary" style="padding: 4px 8px; font-size: 11px;" onclick="openEditNoteModal(${n.id});">✏️</button>
          <button class="btn secondary" style="padding: 4px 8px; font-size: 11px;" onclick="deleteNote(${n.id}); location.reload();">✕</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error en renderNotes:', error);
    const container = document.getElementById('notesDiv');
    if (container) container.innerHTML = '<p style="color: #ff6b9d;">❌ Error al cargar notas</p>';
  }
}

function openEditNoteModal(noteId) {
  const notes = getNotes();
  const note = notes.find(n => n.id === noteId);
  
  if (!note) {
    showNotification('Nota no encontrada', 'error');
    return;
  }

  document.getElementById('editNoteTitle').value = note.title;
  document.getElementById('editNoteContent').value = note.content;
  document.getElementById('editNoteType').value = note.type;
  document.getElementById('editNoteModal').dataset.noteId = noteId;
  document.getElementById('editNoteModal').classList.add('active');
}

function updateNoteFromModal() {
  const noteId = parseInt(document.getElementById('editNoteModal').dataset.noteId);
  const title = document.getElementById('editNoteTitle').value;
  const content = document.getElementById('editNoteContent').value;
  const type = document.getElementById('editNoteType').value;

  if (!title || !content) {
    showNotification('⚠️ Completa todos los campos', 'error');
    return;
  }

  const result = updateNote(noteId, title, content, type);
  if (result.success) {
    closeModal('editNoteModal');
    setupDashboardUI();
  }
}

function renderReminders() {
  try {
    const container = document.getElementById('remindersDiv');
    if (!container) return;

    const reminders = getReminders();

    if (reminders.length === 0) {
      container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">📌 No hay recordatorios. Crea uno para mantenerte motivado</p>';
      return;
    }

    container.innerHTML = reminders.map(r => `
      <div class="note-item">
        <div class="note-info">
          <div class="note-title">${r.title || 'Sin título'}</div>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <span class="note-type" style="background: rgba(100, 200, 255, 0.1); color: #00d4ff;">🕐 ${r.time || '--:--'}</span>
            <span class="note-type">${r.type || 'general'}</span>
          </div>
        </div>
        <button class="btn secondary" style="padding: 4px 8px; font-size: 11px;" onclick="deleteReminder(${r.id}); location.reload();">✕</button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error en renderReminders:', error);
    const container = document.getElementById('remindersDiv');
    if (container) container.innerHTML = '<p style="color: #ff6b9d;">❌ Error al cargar recordatorios</p>';
  }
}

function deleteWeightRecord(recordId) {
  const records = getWeightRecords().filter(r => r.id !== recordId);
  if (!isAuthenticated()) return;
  localStorage.setItem(`weights_${currentUser.username}`, JSON.stringify(records));
  showNotification('⚖️ Registro eliminado', 'info');
}

function openWeightModal() {
  document.getElementById('weightModal').classList.add('active');
}

function openNoteModal() {
  document.getElementById('noteModal').classList.add('active');
}

function openReminderModal() {
  document.getElementById('reminderModal').classList.add('active');
}

function openDataExportModal() {
  document.getElementById('dataExportModal').classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function saveWeight() {
  const weight = document.getElementById('weightInput').value;
  const notes = document.getElementById('weightNotesInput').value;

  if (!weight) {
    showNotification('⚠️ Ingresa el peso', 'error');
    return;
  }

  const weightNum = parseFloat(weight);
  if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
    showNotification('⚠️ Ingresa un peso válido (0-500 kg)', 'error');
    return;
  }

  const result = addWeightRecord(weight, notes);
  if (result.success) {
    document.getElementById('weightInput').value = '';
    document.getElementById('weightNotesInput').value = '';
    closeModal('weightModal');
    setupDashboardUI();
    showNotification('⚖️ Peso registrado correctamente', 'success');
  } else {
    showNotification('❌ ' + (result.message || 'Error al registrar peso'), 'error');
  }
}

function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const type = document.getElementById('noteType').value;

  if (!title || !content) {
    showNotification('⚠️ Completa todos los campos', 'error');
    return;
  }

  if (title.length < 3) {
    showNotification('⚠️ El título debe tener al menos 3 caracteres', 'error');
    return;
  }

  if (content.length < 5) {
    showNotification('⚠️ El contenido debe tener al menos 5 caracteres', 'error');
    return;
  }

  const result = addNote(title, content, type);
  if (result.success) {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    closeModal('noteModal');
    setupDashboardUI();
  } else {
    showNotification('❌ ' + (result.message || 'Error al guardar nota'), 'error');
  }
}

function saveReminder() {
  const title = document.getElementById('reminderTitle').value.trim();
  const time = document.getElementById('reminderTime').value;
  const type = document.getElementById('reminderType').value;

  if (!title || !time) {
    showNotification('⚠️ Completa todos los campos', 'error');
    return;
  }

  if (title.length < 3) {
    showNotification('⚠️ El título debe tener al menos 3 caracteres', 'error');
    return;
  }

  const result = setReminder(title, time, type);
  if (result.success) {
    document.getElementById('reminderTitle').value = '';
    document.getElementById('reminderTime').value = '';
    closeModal('reminderModal');
    setupDashboardUI();
    showNotification('🔔 Recordatorio guardado', 'success');
  } else {
    showNotification('❌ ' + (result.message || 'Error al guardar recordatorio'), 'error');
  }
}

function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #00ffc8, #00d4ff)' : type === 'error' ? 'linear-gradient(135deg, #ff3333, #ff6b9d)' : 'linear-gradient(135deg, #00d4ff, #00ffc8)'};
    color: ${type === 'error' ? 'white' : 'black'};
    padding: 16px 24px;
    border-radius: 10px;
    font-weight: 600;
    z-index: 999;
    box-shadow: 0 8px 24px rgba(0, 255, 200, 0.4);
    animation: slideIn 0.3s ease;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ============================================
// 11. MOTIVACIÓN DIARIA
// ============================================

const motivationalQuotes = [
  "El único límite es el que te impones a ti mismo 💪",
  "Cada gota de sudor es un paso hacia tu meta 🔥",
  "Hoy es el día perfecto para ser mejor que ayer ✨",
  "Tu cuerpo es un templo, entrénalo como tal 🏛️",
  "No es cuestión de fuerza, es cuestión de voluntad 🔗",
  "El dolor es temporal, el orgullo es para siempre 👑",
  "Eres más fuerte de lo que crees 💥",
  "La consistencia es el secreto del éxito 🎯",
  "Cada repetición te acerca a tu mejor versión 🚀",
  "La disciplina es la libertad 🦅",
  "Sueña en grande, trabaja en silencio, déjate sorprender 🌟",
  "Tu futuro depende de lo que hagas hoy 📈"
];

function getDailyMotivation() {
  const date = new Date().toDateString();
  const storedDate = localStorage.getItem('motivationDate');
  const storedQuote = localStorage.getItem('motivationQuote');
  
  if (storedDate !== date) {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const quote = motivationalQuotes[randomIndex];
    localStorage.setItem('motivationDate', date);
    localStorage.setItem('motivationQuote', quote);
    return quote;
  }
  
  return storedQuote || motivationalQuotes[0];
}

function renderMotivation() {
  const quote = getDailyMotivation();
  const motivDiv = document.getElementById('motivationDiv');
  
  if (motivDiv) {
    motivDiv.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(196, 77, 255, 0.1), rgba(0, 212, 255, 0.1)); 
                  border-left: 4px solid #c44dff; padding: 15px; border-radius: 8px; text-align: center;">
        <p style="color: #c44dff; font-size: 16px; font-weight: 600; margin: 0;">${quote}</p>
      </div>
    `;
  }
}

// ============================================
// 12. TRACKER DE RACHA (DÍAS CONSECUTIVOS)
// ============================================

function updateStreak() {
  if (!isAuthenticated()) return;
  
  const today = new Date().toDateString();
  const lastTrainingDate = localStorage.getItem(`lastTrainingDate_${currentUser.username}`);
  const streak = parseInt(localStorage.getItem(`streak_${currentUser.username}`)) || 0;
  
  const lastDate = lastTrainingDate ? new Date(lastTrainingDate) : null;
  const todayDate = new Date();
  
  if (!lastDate) {
    // Primera vez entrenando
    localStorage.setItem(`lastTrainingDate_${currentUser.username}`, today);
    localStorage.setItem(`streak_${currentUser.username}`, 1);
  } else {
    const dayDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      // Entrenó ayer, incrementar racha
      localStorage.setItem(`streak_${currentUser.username}`, streak + 1);
      localStorage.setItem(`lastTrainingDate_${currentUser.username}`, today);
    } else if (dayDiff > 1) {
      // Perdió la racha
      localStorage.setItem(`streak_${currentUser.username}`, 1);
      localStorage.setItem(`lastTrainingDate_${currentUser.username}`, today);
    }
    // Si dayDiff === 0, ya entrenó hoy, no hacer nada
  }
}

function getStreak() {
  if (!isAuthenticated()) return 0;
  return parseInt(localStorage.getItem(`streak_${currentUser.username}`)) || 0;
}

function renderStreak() {
  const streak = getStreak();
  const streakDiv = document.getElementById('streakDiv');
  
  if (streakDiv) {
    const fire = '🔥'.repeat(Math.min(streak, 10)); // Máximo 10 fuegos
    streakDiv.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(255, 51, 51, 0.1)); 
                  border-left: 4px solid #ff6b9d; padding: 15px; border-radius: 8px; text-align: center;">
        <p style="color: #ff6b9d; font-size: 14px; margin: 0;">Racha de Entrenamiento</p>
        <p style="color: #ff3333; font-size: 32px; font-weight: 800; margin: 5px 0; letter-spacing: 2px;">
          ${fire} ${streak} días
        </p>
      </div>
    `;
  }
}

// ============================================
// 13. CALCULADORA IMC RÁPIDA
// ============================================

function calculateIMC(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) {
    return null;
  }
  
  const heightInMeters = height / 100;
  const imc = weight / (heightInMeters * heightInMeters);
  
  let category = '';
  let color = '';
  
  if (imc < 18.5) {
    category = 'Bajo peso';
    color = '#00d4ff';
  } else if (imc < 25) {
    category = 'Peso normal';
    color = '#00ffc8';
  } else if (imc < 30) {
    category = 'Sobrepeso';
    color = '#d4af37';
  } else {
    category = 'Obesidad';
    color = '#ff3333';
  }
  
  return { imc: imc.toFixed(1), category, color };
}

function renderIMCCalculator() {
  const imcDiv = document.getElementById('imcDiv');
  
  if (imcDiv) {
    const currentProfile = currentUser?.profile || {};
    const weight = currentProfile.weight || '';
    const height = currentProfile.height || '';
    
    let imcContent = `
      <div style="background: linear-gradient(135deg, rgba(0, 255, 200, 0.1), rgba(0, 212, 255, 0.1)); 
                  border-left: 4px solid #00ffc8; padding: 15px; border-radius: 8px;">
        <p style="color: #00ffc8; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">📏 Calculadora IMC</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <input type="number" id="imcWeight" placeholder="Peso (kg)" value="${weight}" style="padding: 8px; border-radius: 6px; border: 1px solid #00ffc8; background: rgba(0, 255, 200, 0.1); color: white;">
          <input type="number" id="imcHeight" placeholder="Altura (cm)" value="${height}" style="padding: 8px; border-radius: 6px; border: 1px solid #00ffc8; background: rgba(0, 255, 200, 0.1); color: white;">
        </div>
        <button onclick="calculateAndShowIMC()" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #00ffc8, #00d4ff); border: none; border-radius: 6px; color: black; font-weight: 600; cursor: pointer; font-size: 12px;">Calcular</button>
        <div id="imcResult" style="margin-top: 10px;"></div>
      </div>
    `;
    
    imcDiv.innerHTML = imcContent;
  }
}

function calculateAndShowIMC() {
  const weight = parseFloat(document.getElementById('imcWeight')?.value);
  const height = parseFloat(document.getElementById('imcHeight')?.value);
  
  const result = document.getElementById('imcResult');
  
  if (!weight || !height) {
    result.innerHTML = '<p style="color: #ff3333; font-size: 12px; margin: 0;">Completa los datos</p>';
    return;
  }
  
  const imc = calculateIMC(weight, height);
  
  if (imc) {
    result.innerHTML = `
      <div style="text-align: center; padding: 10px; background: rgba(0, 0, 0, 0.3); border-radius: 6px;">
        <p style="color: ${imc.color}; font-size: 24px; font-weight: 800; margin: 0;">${imc.imc}</p>
        <p style="color: ${imc.color}; font-size: 12px; margin: 5px 0 0 0;">${imc.category}</p>
      </div>
    `;
  }
}
