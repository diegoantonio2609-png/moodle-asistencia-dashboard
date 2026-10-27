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


  /* ===========================================================================
     3. PESTAÑAS TEMPORALES DEL ORGANIZADOR DE ACTIVIDADES
     =========================================================================== */

  function initActivityTabs() {
    const tabs = document.querySelectorAll('.activity-tab');
    if (!tabs.length) return;

    const panels = {
      'tab-today': document.getElementById('panel-today'),
      'tab-week': document.getElementById('panel-week'),
      'tab-next': document.getElementById('panel-next')
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');

        // Actualizar estados visuales y de accesibilidad de pestañas
        tabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        // Alternar visibilidad de paneles correspondientes
        Object.keys(panels).forEach(key => {
          const panel = panels[key];
          if (panel) {
            const isActive = (key === targetId);
            panel.classList.toggle('is-active', isActive);
            if (isActive) {
              panel.removeAttribute('hidden');
            } else {
              panel.setAttribute('hidden', 'true');
            }
          }
        });
      });
    });
  }


  /* ===========================================================================
     4. INTERACCIONES RÁPIDAS
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
        const courseCard = this.closest('.course-card');
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
     5. INICIALIZACIÓN GENERAL DEL DOM
     =========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    initRoleSwitcher();
    initActivityTabs();
    initQuickMessageAction();
    initTeamsIntegrationAction();
  });

  // Exponer API global ligera si se requiere interactividad programática
  window.IberoDashboard = {
    showToast: showToast
  };

})();
