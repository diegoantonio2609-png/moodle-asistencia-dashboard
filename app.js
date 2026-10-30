/**
 * =============================================================================
 * app.js — Interacción y Conexión de Vistas
 * Sistema de Diseño Moodle Asistencia — Ibero León
 * =============================================================================
 */

(function () {
  'use strict';

  /* ===========================================================================
     1. SISTEMA INSTITUCIONAL DE NOTIFICACIONES (TOASTS)
     =========================================================================== */

  /**
   * Obtiene o crea el contenedor global de notificaciones toast.
   * @returns {HTMLElement}
   */
  function getOrCreateToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Muestra una notificación toast institucional con animación de entrada y salida.
   * @param {string} title - Título de la notificación
   * @param {string} message - Descripción o detalle
   * @param {'info' | 'success' | 'teams'} [type='info'] - Tipo visual de toast
   * @param {number} [duration=3800] - Tiempo de permanencia en milisegundos
   */
  function showToast(title, message, type = 'info', duration = 3800) {
    const container = getOrCreateToastContainer();

    // Íconos SVG según el tipo de mensaje
    let iconSvg = '';
    if (type === 'teams') {
      iconSvg = `
        <svg class="toast__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M12.5 5.5h-4a1 1 0 0 0-1 1V11a2.5 2.5 0 0 0 2.5 2.5h2.5a2 2 0 0 0 2-2V6.5a1 1 0 0 0-2-1zm-1.5-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          <path d="M5.5 6H2a1 1 0 0 0-1 1v3.5A2.5 2.5 0 0 0 3.5 13H5a2 2 0 0 0 1.5-.7V7a1 1 0 0 0-1-1zm-1.5-2a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" opacity="0.75"/>
        </svg>`;
    } else if (type === 'success') {
      iconSvg = `
        <svg class="toast__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="8" cy="8" r="7"/>
          <path d="M5 8l2 2 4-4"/>
        </svg>`;
    } else {
      iconSvg = `
        <svg class="toast__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="8" cy="8" r="7"/>
          <path d="M8 5v3.5M8 11.5h.01"/>
        </svg>`;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      ${iconSvg}
      <div class="toast__content">
        <span class="toast__title">${title}</span>
        <span class="toast__message">${message}</span>
      </div>
      <button class="toast__close" type="button" aria-label="Cerrar notificación">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M1 1l12 12M13 1L1 13"/>
        </svg>
      </button>
    `;

    // Cierre manual al presionar la 'x'
    const closeBtn = toast.querySelector('.toast__close');
    const dismiss = () => {
      if (toast.classList.contains('toast--closing')) return;
      toast.classList.add('toast--closing');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 220);
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', dismiss);
    }

    // Auto-cierre tras transcurrir la duración
    const timer = setTimeout(dismiss, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));

    container.appendChild(toast);
  }


  /* ===========================================================================
     2. CONMUTADOR DE ROL Y NAVEGACIÓN (DOCENTE / ESTUDIANTE)
     =========================================================================== */

  function initRoleSwitcher() {
    const rolePills = document.querySelectorAll('.role-pill');
    if (!rolePills.length) return;

    // Detectar página actual
    const currentPath = window.location.pathname.toLowerCase();
    const isStudentPage = currentPath.endsWith('student.html');

    rolePills.forEach(pill => {
      const href = (pill.getAttribute('href') || '').toLowerCase();
      const targetIsStudent = href.includes('student.html');

      // Marcar estado activo sincronizado
      if ((isStudentPage && targetIsStudent) || (!isStudentPage && !targetIsStudent)) {
        pill.classList.add('is-active');
        pill.setAttribute('aria-current', 'page');
      } else {
        pill.classList.remove('is-active');
        pill.removeAttribute('aria-current');
      }

      // Evitar recargar si ya está en la vista actual
      pill.addEventListener('click', function (e) {
        if (this.classList.contains('is-active')) {
          e.preventDefault();
          showToast(
            'Vista Actual',
            `Ya te encuentras en el panel de ${isStudentPage ? 'Estudiante' : 'Docente'}.`,
            'info',
            2500
          );
        }
      });
    });
  }

  /**
   * Filtros rápidos del panel de resumen lateral (Vista Lista Split-View)
   */
  function initSummaryFilters() {
    const summaryFilters = document.querySelectorAll('.summary-panel__filters');
    if (!summaryFilters.length) return;

    summaryFilters.forEach(container => {
      const chips = container.querySelectorAll('.summary-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
        });
      });
    });
  }


  /* ===========================================================================
     3. CONMUTADOR DE VISTA DEL ORGANIZADOR HÍBRIDO (VISTA LISTA / VISTA CALENDARIO)
     =========================================================================== */

  function initViewSwitcher() {
    const viewSwitchers = document.querySelectorAll('.view-switcher');
    if (!viewSwitchers.length) return;

    viewSwitchers.forEach(switcher => {
      const buttons = switcher.querySelectorAll('.view-btn');
      const cardBody = switcher.closest('.monitoring-card')?.querySelector('.monitoring-card__body');
      if (!cardBody) return;

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const viewType = btn.getAttribute('data-view'); // 'list' o 'calendar'

          buttons.forEach(b => {
            b.classList.remove('is-active');
            b.setAttribute('aria-selected', 'false');
          });

          btn.classList.add('is-active');
          btn.setAttribute('aria-selected', 'true');

          const listView = cardBody.querySelector('.list-view-container');
          const calendarView = cardBody.querySelector('.calendar-view');

          if (viewType === 'list') {
            if (listView) listView.style.display = 'block';
            if (calendarView) calendarView.classList.remove('is-active');
          } else if (viewType === 'calendar') {
            if (listView) listView.style.display = 'none';
            if (calendarView) calendarView.classList.add('is-active');
          }
        });
      });
    });
  }


  /* ===========================================================================
     4. PESTAÑAS TEMPORALES DEL ORGANIZADOR DE ACTIVIDADES (VISTA LISTA)
     =========================================================================== */

  function initActivityTabs() {
    const tabs = document.querySelectorAll('.activity-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTabId = tab.getAttribute('data-tab');
        const container = tab.closest('.list-view-container, .monitoring-card__body');
        if (!container) return;

        const siblingTabs = container.querySelectorAll('.activity-tab');
        siblingTabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        const panels = container.querySelectorAll('.activity-panel');
        panels.forEach(panel => {
          const panelId = panel.getAttribute('id');
          const isTarget = panelId === `panel-${targetTabId.replace('tab-', '')}`;
          panel.classList.toggle('is-active', isTarget);
          if (isTarget) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', 'true');
          }
        });
      });
    });
  }


  /* ===========================================================================
     5. FILTROS DE CATEGORÍA DE EVENTOS DEL CALENDARIO
     =========================================================================== */

  function initCalendarFilters() {
    const calendarFilters = document.querySelectorAll('.calendar-filters');
    if (!calendarFilters.length) return;

    calendarFilters.forEach(filterContainer => {
      const chips = filterContainer.querySelectorAll('.calendar-chip');
      const calendarView = filterContainer.closest('.calendar-view');
      if (!calendarView) return;

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const selectedFilter = chip.getAttribute('data-filter'); // 'all', 'limite', 'evaluacion', 'evento', 'calificacion'

          chips.forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');

          const events = calendarView.querySelectorAll('.calendar-event');
          events.forEach(event => {
            const category = event.getAttribute('data-category');
            if (selectedFilter === 'all' || category === selectedFilter) {
              event.style.display = 'flex';
            } else {
              event.style.display = 'none';
            }
          });
        });
      });
    });
  }


  /* ===========================================================================
     6. ACCIONES Y BOTONES DEL CALENDARIO
     =========================================================================== */

  function initCalendarActions() {
    const gcalButtons = document.querySelectorAll('.btn-gcal');
    gcalButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        showToast(
          'Google Calendar',
          'Sincronizando entregas y evaluaciones de Octubre 2026 con tu cuenta institicional Google...',
          'success',
          3500
        );
      });
    });

    const academicButtons = document.querySelectorAll('.btn-academic-cal');
    academicButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        showToast(
          'Calendario Académico Ibero León',
          'Consultando fechas oficiales del periodo Otoño 2026 en Servicios Escolares.',
          'info',
          3500
        );
      });
    });
  }


  /* ===========================================================================
     7. INTERACCIONES RÁPIDAS
     =========================================================================== */

  /**
   * Interacción para 'Enviar Mensaje' en el Radar de Inactividad
   */
  function initQuickMessageAction() {
    const msgButtons = document.querySelectorAll('.btn-quick-msg');
    if (!msgButtons.length) return;

    msgButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.preventDefault();

        // Extraer nombre del estudiante y materia del contenedor
        const cardItem = this.closest('.inactive-item');
        const studentName = cardItem?.querySelector('.inactive-item__name')?.textContent.trim() || 'Estudiante';
        const courseName = cardItem?.querySelector('.inactive-item__course')?.textContent.trim() || 'Materia';

        // Feedback visual inmediato en el botón
        const originalContent = this.innerHTML;
        this.disabled = true;
        this.style.backgroundColor = '#059669';
        this.style.borderColor = '#059669';
        this.style.color = '#FFFFFF';
        this.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 7l4 4 6-7"/>
          </svg>
          Enviado
        `;

        // Notificación institucional toast
        showToast(
          'Mensaje de Alerta Enviado',
          `Se envió notificación preventiva a <strong>${studentName}</strong> (${courseName}) vía mensajería Moodle.`,
          'success',
          4000
        );

        // Restaurar estado del botón tras 2.2 segundos
        setTimeout(() => {
          this.innerHTML = originalContent;
          this.style.backgroundColor = '';
          this.style.borderColor = '';
          this.style.color = '';
          this.disabled = false;
        }, 2200);
      });
    });
  }

  /**
   * Interacción para 'Iniciar Clase en Teams' (abre enlace en nueva pestaña)
   */
  function initTeamsIntegrationAction() {
    // Escuchar botones de Teams de la vista docente y colaborativa del estudiante
    const teamsButtons = document.querySelectorAll('.btn-teams, .btn-collab-teams');
    if (!teamsButtons.length) return;

    teamsButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.preventDefault();

        // Determinar contexto del curso o equipo
        const courseCard = this.closest('.course-card, .student-course-card');
        const collabCard = this.closest('.collab-card');

        let titleContext = 'Clase Sincrónica';
        if (courseCard) {
          titleContext = courseCard.querySelector('.course-card__name')?.textContent.trim() || 'Curso Moodle';
        } else if (collabCard) {
          titleContext = collabCard.querySelector('.collab-card__name')?.textContent.trim() || 'Equipo de Estudio';
        }

        // URL institucional o enlace estándar de Microsoft Teams
        const teamsUrl = 'https://teams.microsoft.com';

        // Abrir en nueva pestaña con atributos de seguridad
        window.open(teamsUrl, '_blank', 'noopener,noreferrer');

        // Notificación visual rápida de apertura
        showToast(
          'Microsoft Teams',
          `Abriendo sesión sincrónica de <strong>${titleContext}</strong> en una nueva pestaña...`,
          'teams',
          3500
        );
      });
    });
  }


  /* ===========================================================================
     8. MANEJO BASE DE MODALES (COMPONENTE REUTILIZABLE)
     =========================================================================== */

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initBaseModalLogic() {
    // Cerrar al hacer clic en botón [X] o con data-modal-close
    document.addEventListener('click', function (e) {
      const closeBtn = e.target.closest('[data-modal-close]');
      if (closeBtn) {
        const modal = closeBtn.closest('.modal-overlay');
        if (modal) closeModal(modal);
        return;
      }

      // Cerrar al hacer clic en el backdrop/overlay
      if (e.target.classList.contains('modal-overlay')) {
        closeModal(e.target);
      }
    });

    // Cerrar al presionar la tecla ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        const openModals = document.querySelectorAll('.modal-overlay.is-open');
        openModals.forEach(modal => closeModal(modal));
      }
    });
  }


  /* ===========================================================================
     9. LÓGICA DEL MODAL DE EVALUACIÓN DOCENTE (INDEX.HTML)
     =========================================================================== */

  // Datos de muestra de 10 estudiantes
  const sampleStudentsData = [
    { id: 1, name: 'Alejandro Morales Ríos', avatar: 'AM', status: 'pending', date: 'Hoy, 10:15 hrs', grade: null, isLate: false },
    { id: 2, name: 'Sofía Valenzuela Gómez', avatar: 'SV', status: 'pending', date: 'Ayer, 22:40 hrs', grade: null, isLate: false },
    { id: 3, name: 'Carlos Ortiz Mendoza', avatar: 'CO', status: 'pending', date: 'Ayer, 18:20 hrs', grade: null, isLate: true },
    { id: 4, name: 'Mariana Estrada Ruiz', avatar: 'ME', status: 'pending', date: 'Hace 2 días', grade: null, isLate: false },
    { id: 5, name: 'Luis Ramos Fuentes', avatar: 'LR', status: 'graded', date: 'Hace 3 días', grade: '95/100', isLate: false },
    { id: 6, name: 'Ana Laura Gutiérrez', avatar: 'AG', status: 'graded', date: 'Hace 3 días', grade: '88/100', isLate: false },
    { id: 7, name: 'Diego Hernández Vega', avatar: 'DH', status: 'low', date: 'Hace 4 días', grade: '55/100', isLate: true },
    { id: 8, name: 'Fernanda Castillo M.', avatar: 'FC', status: 'graded', date: 'Hace 4 días', grade: '92/100', isLate: false },
    { id: 9, name: 'Roberto Gómez Bolaños', avatar: 'RG', status: 'missing', date: 'Sin entrega', grade: null, isLate: false },
    { id: 10, name: 'Valeria Solares Vega', avatar: 'VS', status: 'missing', date: 'Sin entrega', grade: null, isLate: false }
  ];

  let currentEvalFilter = 'all';

  function renderStudentEvalGrid() {
    const grid = document.getElementById('student-eval-grid');
    if (!grid) return;

    let filtered = sampleStudentsData;
    if (currentEvalFilter === 'pending') {
      filtered = sampleStudentsData.filter(s => s.status === 'pending');
    } else if (currentEvalFilter === 'missing') {
      filtered = sampleStudentsData.filter(s => s.status === 'missing');
    } else if (currentEvalFilter === 'low') {
      filtered = sampleStudentsData.filter(s => s.status === 'low');
    }

    grid.innerHTML = filtered.map(student => {
      let badgeHtml = '';
      if (student.isLate) {
        badgeHtml = `<span class="student-eval-card__badge--late">Atrasado</span>`;
      } else if (student.status === 'missing') {
        badgeHtml = `<span class="student-eval-card__badge--none">Sin entrega</span>`;
      }

      let footerActionHtml = '';
      if (student.status === 'missing') {
        footerActionHtml = `
          <button class="btn-eval-remind" type="button" data-student-id="${student.id}">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2v2l3-2h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
            </svg>
            Enviar recordatorio
          </button>
        `;
      } else {
        footerActionHtml = `
          <button class="btn-eval-grade" type="button" data-student-id="${student.id}">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 2l2 2-8 8H4v-2l8-8z"/>
            </svg>
            Calificar
          </button>
        `;
      }

      let gradeHtml = student.grade ? `<span class="student-eval-card__grade ${student.status === 'low' ? 'student-eval-card__grade--low' : 'student-eval-card__grade--good'}">Calificación: ${student.grade}</span>` : '<span class="student-eval-card__grade" style="color: var(--text-tertiary);">Pendiente</span>';

      return `
        <div class="student-eval-card" data-student-id="${student.id}">
          <div class="student-eval-card__top">
            <div class="student-eval-card__avatar">${student.avatar}</div>
            <div class="student-eval-card__info">
              <span class="student-eval-card__name">${student.name}</span>
              <span class="student-eval-card__date">
                ${student.date} ${badgeHtml}
              </span>
            </div>
          </div>
          <div class="student-eval-card__footer">
            ${gradeHtml}
            ${footerActionHtml}
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners to dynamically created action buttons
    grid.querySelectorAll('.btn-eval-grade').forEach(btn => {
      btn.addEventListener('click', function () {
        const studentId = parseInt(this.getAttribute('data-student-id'), 10);
        const student = sampleStudentsData.find(s => s.id === studentId);
        showToast('Panel de Calificación', `Abriendo editor de calificación y retroalimentación para <strong>${student?.name || 'Estudiante'}</strong>.`, 'info', 3000);
      });
    });

    grid.querySelectorAll('.btn-eval-remind').forEach(btn => {
      btn.addEventListener('click', function () {
        const studentId = parseInt(this.getAttribute('data-student-id'), 10);
        const student = sampleStudentsData.find(s => s.id === studentId);
        showToast('Recordatorio Enviado', `Se notificó a <strong>${student?.name || 'Estudiante'}</strong> para realizar su entrega pendiente.`, 'success', 3500);
      });
    });
  }

  function initTeacherEvalModalLogic() {
    // Trigger opening when clicking on deliveries-box
    const triggers = document.querySelectorAll('.deliveries-box[data-modal-trigger="eval-modal"]');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', function () {
        const courseCode = this.getAttribute('data-course-code') || '';
        const courseName = this.getAttribute('data-course-name') || '';
        const modalTitle = document.getElementById('eval-modal-title');
        if (modalTitle) {
          modalTitle.textContent = `Evaluación: ${courseCode} — ${courseName}`;
        }
        renderStudentEvalGrid();
        openModal('eval-modal');
      });
    });

    // Task selector in header
    const taskSelect = document.getElementById('eval-task-select');
    if (taskSelect) {
      taskSelect.addEventListener('change', function () {
        const selectedText = this.options[this.selectedIndex].text;
        showToast('Filtro de Actividad', `Cargando entregas correspondientes a: <strong>${selectedText}</strong>.`, 'info', 2500);
      });
    }

    // Filter pills
    const evalPills = document.querySelectorAll('.eval-pill[data-eval-filter]');
    evalPills.forEach(pill => {
      pill.addEventListener('click', function () {
        evalPills.forEach(p => p.classList.remove('is-active'));
        this.classList.add('is-active');
        currentEvalFilter = this.getAttribute('data-eval-filter');
        renderStudentEvalGrid();
      });
    });
  }


  /* ===========================================================================
     10. SELECTOR DE GRUPO E INTERACCIÓN EN DISTRIBUCIÓN DE NOTAS (INDEX.HTML)
     =========================================================================== */

  // Datos mock de estudiantes organizados por grupo y rango
  const groupGradesData = {
    'all': {
      avg: '84.2% · Satisfactorio',
      total: 72,
      counts: { '90-100': '28 alum. (39%)', '80-89': '24 alum. (33%)', '70-79': '13 alum. (18%)', '<70': '7 alum. (10%)' },
      riskNote: '7 estudiantes requieren intervención académica preventiva',
      students: {
        '90-100': [{ name: 'Valeria Solares', score: '98%' }, { name: 'Luis Ramos', score: '95%' }, { name: 'Fernanda Castillo', score: '92%' }, { name: 'Ana Laura Gutiérrez', score: '91%' }],
        '80-89': [{ name: 'Sofía Valenzuela', score: '88%' }, { name: 'Mariana Estrada', score: '85%' }, { name: 'Gabriel Torres', score: '82%' }],
        '70-79': [{ name: 'Carlos Ortiz', score: '76%' }, { name: 'Jorge Benítez', score: '72%' }],
        '<70': [{ name: 'Alejandro Morales', score: '58%' }, { name: 'Diego Hernández', score: '55%' }, { name: 'Pedro Almonte', score: '52%' }]
      }
    },
    'INF-201': {
      avg: '86.5% · Sobresaliente',
      total: 24,
      counts: { '90-100': '11 alum. (46%)', '80-89': '8 alum. (33%)', '70-79': '3 alum. (13%)', '<70': '2 alum. (8%)' },
      riskNote: '2 estudiantes del Grupo A en riesgo académico',
      students: {
        '90-100': [{ name: 'Luis Ramos', score: '98%' }, { name: 'Valeria Solares', score: '96%' }, { name: 'Ana Laura Gutiérrez', score: '92%' }],
        '80-89': [{ name: 'Mariana Estrada', score: '86%' }, { name: 'Sofía Valenzuela', score: '84%' }],
        '70-79': [{ name: 'Carlos Ortiz', score: '75%' }],
        '<70': [{ name: 'Alejandro Morales', score: '58%' }, { name: 'Diego Hernández', score: '55%' }]
      }
    },
    'INF-305': {
      avg: '88.1% · Sobresaliente',
      total: 18,
      counts: { '90-100': '8 alum. (44%)', '80-89': '7 alum. (39%)', '70-79': '2 alum. (11%)', '<70': '1 alum. (6%)' },
      riskNote: '1 estudiante del Grupo B requiere seguimiento',
      students: {
        '90-100': [{ name: 'Fernanda Castillo', score: '97%' }, { name: 'Ricardo Lira', score: '94%' }],
        '80-89': [{ name: 'Gabriel Torres', score: '88%' }, { name: 'Sofía Valenzuela', score: '85%' }],
        '70-79': [{ name: 'Laura Pausini', score: '78%' }],
        '<70': [{ name: 'Pedro Almonte', score: '52%' }]
      }
    },
    'ING-410': {
      avg: '79.4% · Suficiente',
      total: 30,
      counts: { '90-100': '9 alum. (30%)', '80-89': '9 alum. (30%)', '70-79': '8 alum. (27%)', '<70': '4 alum. (13%)' },
      riskNote: '4 estudiantes del Grupo C en rango menor a 70%',
      students: {
        '90-100': [{ name: 'Beatriz Luengo', score: '95%' }, { name: 'Emilio Osorio', score: '91%' }],
        '80-89': [{ name: 'Héctor Lavoe', score: '83%' }, { name: 'Ismael Rivera', score: '81%' }],
        '70-79': [{ name: 'Jorge Benítez', score: '74%' }, { name: 'Carlos Ortiz', score: '71%' }],
        '<70': [{ name: 'Marcos Alonso', score: '59%' }, { name: 'Esteban Quito', score: '57%' }, { name: 'Raúl Velasco', score: '54%' }, { name: 'Tomasa Tito', score: '50%' }]
      }
    }
  };

  let selectedGroupKey = 'all';

  function updateGradeGadgetDisplay() {
    const data = groupGradesData[selectedGroupKey] || groupGradesData['all'];

    const summaryVal = document.getElementById('grade-summary-val');
    if (summaryVal) summaryVal.textContent = data.avg;

    const riskNote = document.getElementById('grade-risk-note');
    if (riskNote) riskNote.textContent = data.riskNote;

    const count90 = document.getElementById('count-90-100');
    if (count90) count90.textContent = data.counts['90-100'];

    const count80 = document.getElementById('count-80-89');
    if (count80) count80.textContent = data.counts['80-89'];

    const count70 = document.getElementById('count-70-79');
    if (count70) count70.textContent = data.counts['70-79'];

    const countLess = document.getElementById('count-less-70');
    if (countLess) countLess.textContent = data.counts['<70'];

    // Reset student list box
    const studentsBox = document.getElementById('grade-students-box');
    if (studentsBox) studentsBox.style.display = 'none';

    document.querySelectorAll('.grade-row').forEach(row => row.classList.remove('is-selected'));
  }

  function initGradeDistributionLogic() {
    const select = document.getElementById('grade-group-select');
    if (select) {
      select.addEventListener('change', function () {
        selectedGroupKey = this.value;
        updateGradeGadgetDisplay();
        showToast('Filtro por Grupo', `Distribución actualizada para: <strong>${this.options[this.selectedIndex].text}</strong>.`, 'info', 2500);
      });
    }

    // Clickable grade rows
    const gradeRows = document.querySelectorAll('.grade-row[data-range]');
    gradeRows.forEach(row => {
      row.addEventListener('click', function () {
        const range = this.getAttribute('data-range');
        const isSelected = this.classList.contains('is-selected');

        gradeRows.forEach(r => r.classList.remove('is-selected'));

        const studentsBox = document.getElementById('grade-students-box');
        const list = document.getElementById('grade-students-list');
        const boxTitle = document.getElementById('grade-students-box-title');
        const boxTag = document.getElementById('grade-students-box-tag');

        if (isSelected) {
          if (studentsBox) studentsBox.style.display = 'none';
          return;
        }

        this.classList.add('is-selected');

        const groupData = groupGradesData[selectedGroupKey] || groupGradesData['all'];
        const listData = groupData.students[range] || [];

        if (boxTitle) boxTitle.textContent = `Alumnos en Rango ${range}%`;
        if (boxTag) boxTag.textContent = `${listData.length} en lista`;

        if (list) {
          if (listData.length === 0) {
            list.innerHTML = `<li class="grade-student-item"><span class="grade-student-item__name">No hay alumnos en este rango.</span></li>`;
          } else {
            list.innerHTML = listData.map(st => `
              <li class="grade-student-item">
                <span class="grade-student-item__name">${st.name}</span>
                <span class="grade-student-item__score">${st.score}</span>
              </li>
            `).join('');
          }
        }

        if (studentsBox) studentsBox.style.display = 'flex';
      });
    });
  }


  /* ===========================================================================
     11. MODAL DE DETALLE DE ACTIVIDADES PARA ESTUDIANTE (STUDENT.HTML)
     =========================================================================== */

  const studentTasksByCourse = {
    'INF-201 · Grupo A': [
      { title: 'Tarea 1: Wireframes y Guía de Estilos', status: 'graded', badgeText: 'Calificada 95/100', deadline: 'Entregada el 10 Oct', isLate: false, action: 'Ver retroalimentación' },
      { title: 'Cuestionario 1: Principios de UX/UI', status: 'submitted', badgeText: 'Entregada', deadline: 'En revisión por docente', isLate: false, action: 'Ver entregable' },
      { title: 'Prototipo Interactivo en Figma (Sprint 1)', status: 'pending', badgeText: 'Pendiente', deadline: 'Límite: Jueves 22 Oct, 23:59 hrs', isLate: false, action: 'Subir archivo' },
      { title: 'Investigación: Leyes de Fitts y Hick', status: 'unsubmitted', badgeText: 'Sin entregar', deadline: 'Venció hace 2 días', isLate: true, action: 'Entrega extemporánea' }
    ],
    'INF-305 · Grupo B': [
      { title: 'Práctica 2: Maquetación Responsive CSS', status: 'pending', badgeText: 'Pendiente - Vence hoy', deadline: 'Límite: Hoy, 23:59 hrs', isLate: false, action: 'Subir archivo' },
      { title: 'Práctica 1: HTML5 Semántico y Accesibilidad', status: 'graded', badgeText: 'Calificada 88/100', deadline: 'Entregada el 5 Oct', isLate: false, action: 'Ver retroalimentación' },
      { title: 'Laboratorio 3: Formulario Validado con JS', status: 'submitted', badgeText: 'Entregada', deadline: 'Pendiente de calificación', isLate: false, action: 'Ver entregable' }
    ],
    'ING-410 · Grupo C': [
      { title: 'Avance 1: Marco Teórico y Justificación', status: 'graded', badgeText: 'Calificada 100/100', deadline: 'Entregada el 8 Oct', isLate: false, action: 'Ver retroalimentación' },
      { title: 'Avance 2: Cronograma y Diagrama Gantt', status: 'pending', badgeText: 'Pendiente', deadline: 'Límite: Mar 3 Nov, 18:00 hrs', isLate: false, action: 'Subir archivo' }
    ]
  };

  let currentStudentTaskFilter = 'all';
  let currentStudentCourseKey = 'INF-201 · Grupo A';

  function renderStudentTaskList() {
    const listContainer = document.getElementById('student-task-list');
    if (!listContainer) return;

    const tasks = studentTasksByCourse[currentStudentCourseKey] || studentTasksByCourse['INF-201 · Grupo A'];

    let filtered = tasks;
    if (currentStudentTaskFilter === 'pending') {
      filtered = tasks.filter(t => t.status === 'pending');
    } else if (currentStudentTaskFilter === 'submitted') {
      filtered = tasks.filter(t => t.status === 'submitted');
    } else if (currentStudentTaskFilter === 'graded') {
      filtered = tasks.filter(t => t.status === 'graded');
    } else if (currentStudentTaskFilter === 'unsubmitted') {
      filtered = tasks.filter(t => t.status === 'unsubmitted');
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `<p style="font-size: var(--font-size-xs); color: var(--text-tertiary); text-align: center; padding: var(--space-4);">No hay tareas en esta categoría.</p>`;
      return;
    }

    listContainer.innerHTML = filtered.map(task => {
      let badgeClass = 'student-task-card__badge--pending';
      if (task.status === 'submitted') badgeClass = 'student-task-card__badge--submitted';
      else if (task.status === 'graded') badgeClass = 'student-task-card__badge--graded';
      else if (task.status === 'unsubmitted') badgeClass = 'student-task-card__badge--unsubmitted';

      const isSecondaryBtn = task.status === 'graded' || task.status === 'submitted';

      return `
        <div class="student-task-card">
          <div class="student-task-card__header">
            <h4 class="student-task-card__title">${task.title}</h4>
            <span class="student-task-card__badge ${badgeClass}">${task.badgeText}</span>
          </div>
          <div class="student-task-card__footer">
            <span class="student-task-card__info">${task.deadline}</span>
            <button class="btn-task-action ${isSecondaryBtn ? 'btn-task-action--secondary' : ''}" type="button">
              ${task.action}
            </button>
          </div>
        </div>
      `;
    }).join('');

    listContainer.querySelectorAll('.btn-task-action').forEach(btn => {
      btn.addEventListener('click', function () {
        const actionText = this.textContent.trim();
        showToast('Acción de Actividad', `Iniciando: <strong>${actionText}</strong> para Moodle.`, 'info', 3000);
      });
    });
  }

  function initStudentActivityModalLogic() {
    const triggers = document.querySelectorAll('.student-activity-status[data-modal-trigger="student-activity-modal"]');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', function () {
        const courseCode = this.getAttribute('data-course-code') || 'INF-201 · Grupo A';
        const courseName = this.getAttribute('data-course-name') || '';

        currentStudentCourseKey = courseCode;

        const badgeCourse = document.getElementById('student-activity-modal-course');
        if (badgeCourse) badgeCourse.textContent = `${courseCode} ${courseName ? '· ' + courseName : ''}`;

        renderStudentTaskList();
        openModal('student-activity-modal');
      });
    });

    const taskFilters = document.querySelectorAll('.eval-pill[data-student-task-filter]');
    taskFilters.forEach(pill => {
      pill.addEventListener('click', function () {
        taskFilters.forEach(p => p.classList.remove('is-active'));
        this.classList.add('is-active');
        currentStudentTaskFilter = this.getAttribute('data-student-task-filter');
        renderStudentTaskList();
      });
    });
  }


  /* ===========================================================================
     12. INICIALIZACIÓN GENERAL DEL DOM
     =========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    initRoleSwitcher();
    initViewSwitcher();
    initActivityTabs();
    initCalendarFilters();
    initCalendarActions();
    initQuickMessageAction();
    initTeamsIntegrationAction();
    initSummaryFilters();

    // Fase 12 Integrations
    initBaseModalLogic();
    initTeacherEvalModalLogic();
    initGradeDistributionLogic();
    initStudentActivityModalLogic();
  });

  // Exponer API global ligera si se requiere interactividad programática
  window.IberoDashboard = {
    showToast: showToast
  };

})();
