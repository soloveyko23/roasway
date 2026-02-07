/**********************************************
 * Класс RoaswayTable с поддержкой ресайза колонок,
 * кастомными коллбэками, обработкой ошибок и пр.
 **********************************************/

/**
 * @class
 * @param {string} selector - CSS-селектор для таблиц (например, '.table-type-one')
 * @param {object} options  - объект с дополнительными настройками
 * @param {function} [options.onResize]      - коллбэк, вызываемый при изменении ширины колонки
 * @param {function} [options.onScroll]      - коллбэк, вызываемый при горизонтальной прокрутке
 * @param {function} [options.onStickyAdjust]- коллбэк, вызываемый при пересчёте sticky-колонок
 * @param {number}   [options.minWidthResize]- минимально допустимая ширина колонки при ресайзе
 * @param {number}   [options.maxWidth]      - максимальная ширина колонки
 */
class RoaswayTable {
  constructor(selector = '[data-table]', options = {}) {
    /**
     * Список найденных по селектору таблиц
     * @type {HTMLElement[]}
     */
    this.tables = Array.from(document.querySelectorAll(selector));

    /**
     * Хранилище состояний для каждой таблицы
     * @type {Map<HTMLElement, object>}
     */
    this.states = new Map();

    // Если таблиц не найдено — показать сообщение об ошибке и остановиться
    if (this.tables.length === 0) {
      this.showError(`Не найдено таблиц с селектором: ${selector}`);
      return;
    }

    // Опции с некоторыми значениями по умолчанию
    this.options = {
      onResize: options.onResize || (() => {}),
      onScroll: options.onScroll || (() => {}),
      onStickyAdjust: options.onStickyAdjust || (() => {}),
      minWidthResize: options.minWidthResize || 50, 
      maxWidth: options.maxWidth || 300
    };

    // Инициализация каждой таблицы
    this.tables.forEach((table) => {
      const state = this.initTable(table);
      if (state) this.states.set(table, state);
    });

    // Дебаунс для глобальных событий (скролл, ресайз окна)
    const debouncedResize = debounce(() => this.handleGlobalResize(), 100);
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('load', debouncedResize);
  }

  /**
   * Инициализация одной таблицы. Если возникают ошибки — выводим сообщение и возвращаем null.
   * @param {HTMLElement} table - DOM-элемент таблицы
   * @returns {object|null} - объект состояния таблицы или null при ошибке
   */
  initTable(table) {
    try {
      const state = {
        table,
        // Все ячейки-заголовки
        headerCells: Array.from(table.querySelectorAll('.header-row .table-line')),
        // Все строки (без учёта .header-row)
        rows: Array.from(table.querySelectorAll('.table-row')),
        // Максимальные ширины колонок по изначальным вычислениям
        maxColumnWidths: [],
        // Блок, отвечающий за горизонтальный скролл (если присутствует)
        tableOverflowThumb: table.querySelector('.table-overflow-thumb'),
        // Коллбэки для разных событий
        callbacks: {
          onResize: [this.options.onResize],
          onScroll: [this.options.onScroll],
          onStickyAdjust: [this.options.onStickyAdjust],
        }
      };

      if (!state.headerCells.length || !state.rows.length) {
        throw new Error('Отсутствуют заголовки или строки в одной из таблиц.');
      }

      // Новое: Добавляем свойство isFlexible (если колонок меньше 7)
      state.isFlexible = state.headerCells.length < 7;

      // Новое: Если колонок больше 10, то добавляем padding-right для таблицы
      if (state.headerCells.length > 14) {
        const tableBody = table.querySelector('.table-type-one__body');
        if (tableBody) {
          // Устанавливаем padding-right примерно в 25%
          tableBody.style.paddingRight = '10%';
        }
      }

      // Вычисляем первоначальные оптимальные ширины колонок
      this.calculateColumnWidths(state);
      // Назначаем нужные атрибуты и стили ячейкам
      this.setupCells(state);
      // Подключаем логику ресайза колонок
      this.setupResizableHeaders(state);
      // Настраиваем "липкие" (sticky) колонки, если они есть
      this.setupStickyColumns(state);
      // Создаём полупрозрачный блок-тень для sticky-колонок (визуальный эффект)
      this.createShadowBlock(state);
      // Подгоняем высоту содержимого таблицы
      this.adjustTableHeight(state);
      // Локальные кнопки скрытия/показа контента в строках
      this.setupRowToggleContent(state, table);
      // Глобальная кнопка скрытия/показа контента во всех строках
      this.setupGlobalToggle(state, table);

      return state; 
    } catch (error) {
      this.showError(`Ошибка при инициализации таблицы: ${error.message}`);
      return null;
    }
  }

  /**
   * Выводит сообщение об ошибке в консоль и на страницу
   * @param {string} message - текст ошибки
   */
  showError(message) {
    console.error(message);
    const errorContainer = document.createElement('div');
    errorContainer.textContent = message;
    errorContainer.style.color = 'red';
    document.body.appendChild(errorContainer);
  }

  /**
   * Глобальная реакция на resize окна
   */
  handleGlobalResize() {
    this.states.forEach((state) => this.adjustStickyColumns(state));
  }

  /**
   * Проверка, что ширина экрана >= 992px (для десктопных сценариев)
   * @returns {boolean}
   */
  isNonMobileWidth() {
    return window.innerWidth >= 992;
  }

  /**
   * Локальный переключатель показа/скрытия дополнительных строк (hide-content-table-line)
   * @param {object} state
   * @param {HTMLElement} table
   */
  setupRowToggleContent(state, table) {
    const rows = table.querySelectorAll('.table-row-more-content');
    const globalToggleButton = table.querySelector('.toggle-hide-content-global');
    
    rows.forEach((row) => {
      const toggleButton = row.querySelector('.toggle-hide-content');
      const hiddenContent = row.querySelectorAll('.hide-content-table-line');

      // Гарантируем, что изначально эти ячейки скрыты
      hiddenContent.forEach((content) => {
        if (!content.classList.contains('hidden')) {
          content.classList.add('hidden');
        }
      });

      if (toggleButton) {
        toggleButton.addEventListener('click', () => {
          // Сбрасываем состояние глобальной кнопки
          if (globalToggleButton && globalToggleButton.classList.contains('rotate-180')) {
            globalToggleButton.classList.remove('rotate-180');
          }
          
          // Проверяем, открываем ли контент (есть ли хоть один скрытый блок)
          const isOpening = Array.from(hiddenContent).some((content) => 
            content.classList.contains('hidden')
          );
          
          hiddenContent.forEach((content) => content.classList.toggle('hidden'));
          toggleButton.classList.toggle('rotate-180');

          if (isOpening) {
            row.classList.add('content-self-start', 'focused');
          } else {
            row.classList.remove('content-self-start', 'focused');
          }
        });
      }
    });
  }

  /**
   * Глобальный переключатель показа/скрытия всех дополнительных строк в таблице
   * @param {object} state
   * @param {HTMLElement} table
   */
  setupGlobalToggle(state, table) {
    const globalToggleButton = table.querySelector('.toggle-hide-content-global');
    if (!globalToggleButton) return;
    
    globalToggleButton.addEventListener('click', () => {
      // Проверяем, есть ли в таблице хоть одна скрытая ячейка
      const isAnyContentHidden = Array.from(state.rows).some((row) =>
        row.querySelectorAll('.hide-content-table-line.hidden').length > 0
      );

      state.rows.forEach((row) => {
        if (row.classList.contains('table-row-more-content')) {
          const hiddenContent = row.querySelectorAll('.hide-content-table-line');
          const toggleButton = row.querySelector('.toggle-hide-content');
          
          hiddenContent.forEach((content) => {
            if (isAnyContentHidden) {
              content.classList.remove('hidden');
            } else {
              content.classList.add('hidden');
            }
          });

          if (toggleButton) {
            // Устанавливаем стрелку нужного положения
            toggleButton.classList.toggle('rotate-180', isAnyContentHidden);
          }

          if (isAnyContentHidden) {
            row.classList.add('content-self-start', 'focused');
          } else {
            row.classList.remove('content-self-start', 'focused');
          }
        }
      });

      globalToggleButton.classList.toggle('rotate-180');
    });
  }

  /**
   * Получить фактическую ширину элемента с учётом padding и border
   * @param {HTMLElement} element
   * @param {boolean} useFullWidth - учитывать ли всё (border + padding), или только контент
   * @returns {number}
   */
  getActualWidth(element, useFullWidth = false) {
    if (!element) return 0;
    const style = window.getComputedStyle(element);
    const elementWidth = element.offsetWidth;

    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderRight = parseFloat(style.borderRightWidth) || 0;

    const fullWidth = elementWidth + paddingLeft + paddingRight + borderLeft + borderRight;
    return useFullWidth ? fullWidth : elementWidth;
  }

  /**
   * Высчитать оптимальные ширины для каждой колонки (исходя из содержимого заголовков и ячеек)
   * и затем сразу применить их.
   * @param {object} state
   */
  calculateColumnWidths(state) {
    const tableWidth = state.table.offsetWidth;
    let totalFitWidth = 0;
    
    // Сначала получаем базовые ширины для всех колонок
    state.maxColumnWidths = state.headerCells.map((header, index) => {
      const width = this.getMinContentWidth(header, state.rows, index);
      if (header.classList.contains('fit')) {
        totalFitWidth += width;
      }
      return width;
    });

    // Проверяем, нужно ли растягивать колонки
    const shouldStretch = this.shouldStretchColumns(state, totalFitWidth, tableWidth);
    
    if (shouldStretch) {
      // Растягиваем колонки пропорционально
      this.stretchColumns(state, totalFitWidth, tableWidth);
    }

    // Применяем вычисленные ширины
    this.applyColumnWidths(state);
  }

  /**
   * Определяет, нужно ли растягивать колонки
   */
  shouldStretchColumns(state, totalFitWidth, tableWidth) {
    // Считаем общую ширину всех колонок
    const totalWidth = state.maxColumnWidths.reduce((sum, width) => sum + width, 0);

    // Растягиваем если общая ширина меньше ширины таблицы
    return totalWidth < tableWidth;
  }

  /**
   * Растягивает колонки пропорционально доступному пространству
   */
  stretchColumns(state, totalFitWidth, tableWidth) {
    const totalCurrentWidth = state.maxColumnWidths.reduce((sum, w) => sum + w, 0);
    const extraSpace = tableWidth - totalCurrentWidth;

    if (extraSpace <= 0) return;

    // Получаем не-fit колонки для растяжения
    const nonFitColumns = state.headerCells.map((header, index) => ({
      index,
      width: state.maxColumnWidths[index],
      isFit: header.classList.contains('fit')
    })).filter(col => !col.isFit);

    // Если нет не-fit колонок — растягиваем все
    const stretchable = nonFitColumns.length > 0 ? nonFitColumns :
      state.maxColumnWidths.map((w, i) => ({ index: i, width: w }));

    if (stretchable.length === 0) return;

    const totalStretchableWidth = stretchable.reduce((sum, col) => sum + col.width, 0);

    // Распределяем свободное место пропорционально текущим ширинам
    stretchable.forEach(col => {
      const ratio = totalStretchableWidth > 0 ? col.width / totalStretchableWidth : 1 / stretchable.length;
      const addWidth = Math.floor(extraSpace * ratio);
      state.maxColumnWidths[col.index] = col.width + addWidth;
    });
  }

  /**
   * Получить минимальную необходимую ширину для fit-колонок
   */
  getMinContentWidth(header, rows, index) {
    const getCellFullWidth = (cell) => {
      const innerDiv = cell.querySelector('div');
      if (!innerDiv) return 0;

      // Получаем точные размеры div
      const rect = innerDiv.getBoundingClientRect();
      const divWidth = Math.ceil(rect.width);

      // Получаем padding ячейки
      const cellStyle = window.getComputedStyle(cell);
      const cellPadding = parseFloat(cellStyle.paddingLeft) + parseFloat(cellStyle.paddingRight);

      const totalWidth = divWidth + cellPadding;
      
  

      return totalWidth;
    };

    // Получаем максимальную ширину среди всех ячеек в колонке
    let maxWidth = getCellFullWidth(header);

    rows.forEach(row => {
      const cell = row.querySelectorAll('.table-line')[index];
      if (!cell) return;
      maxWidth = Math.max(maxWidth, getCellFullWidth(cell));
    });

    // Добавляем 30px для не-fit колонок
    const isFit = header.classList.contains('fit');
    if (!isFit) {
      maxWidth += 2;
    }

    // Ограничиваем максимальную ширину
    maxWidth = Math.min(maxWidth, 300);
    

    return maxWidth;
  }

  /**
   * Получить оптимальную ширину для обычных колонок
   */
  getOptimalColumnWidth(header, rows, index) {
    const contentWidth = this.getMinContentWidth(header, rows, index);
    
    // Анализируем содержимое для определения типа данных
    const isText = this.isTextContent(header, rows, index);
    const isNumeric = this.isNumericContent(header, rows, index);
    
    if (isNumeric) {
      // Для чисел используем фиксированную ширину
      return Math.min(120, contentWidth);
    }
    
    if (isText) {
      // Для текста используем адаптивную ширину
      const avgWordLength = this.getAverageWordLength(header, rows, index);
      // Если средняя длина слова большая - ограничиваем ширину
      return avgWordLength > 10 ? 200 : Math.min(300, contentWidth);
    }
    
    // По умолчанию используем среднее значение
    return Math.min(200, contentWidth);
  }

  /**
   * Проверить, содержит ли колонка в основном текст
   */
  isTextContent(header, rows, index) {
    const cells = [header, ...rows.map(row => row.querySelectorAll('.table-line')[index])];
    const textCells = cells.filter(cell => {
      if (!cell) return false;
      const content = cell.textContent.trim();
      return content.length > 0 && isNaN(content);
    });
    return textCells.length / cells.length > 0.7; // Если больше 70% ячеек содержат текст
  }

  /**
   * Проверить, содержит ли колонка в основном числа
   */
  isNumericContent(header, rows, index) {
    const cells = [header, ...rows.map(row => row.querySelectorAll('.table-line')[index])];
    const numericCells = cells.filter(cell => {
      if (!cell) return false;
      const content = cell.textContent.trim();
      return !isNaN(content) && content.length > 0;
    });
    return numericCells.length / cells.length > 0.7; // Если больше 70% ячеек содержат числа
  }

  /**
   * Получить среднюю длину слова в колонке
   */
  getAverageWordLength(header, rows, index) {
    const cells = [header, ...rows.map(row => row.querySelectorAll('.table-line')[index])];
    let totalLength = 0;
    let wordCount = 0;
    
    cells.forEach(cell => {
      if (!cell) return;
      const words = cell.textContent.trim().split(/\s+/);
      words.forEach(word => {
        if (word.length > 0) {
          totalLength += word.length;
          wordCount++;
        }
      });
    });
    
    return wordCount > 0 ? totalLength / wordCount : 0;
  }

  /**
   * Считать "логическую" ширину конкретной ячейки (содержимое + паддинги)
   * @param {HTMLElement} cell - элемент ячейки
   * @param {boolean} isHeader - флаг, заголовок ли это
   * @returns {number}
   */
  getCellWidth(cell, isHeader = false) {
    if (!cell) return 0;
    const contentDiv = cell.querySelector('div');
    const contentWidth = contentDiv ? contentDiv.scrollWidth : 0;

    const computedStyle = window.getComputedStyle(cell);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;

    return contentWidth + paddingLeft + paddingRight;
  }

  /**
   * Применить набор ширин к заголовкам и основным ячейкам
   * @param {object} state
   */
  applyColumnWidths(state) {
    const isFlexible = state.isFlexible; // флаг гибкости в зависимости от количества колонок
    // Заголовки
    state.headerCells.forEach((header, index) => {
      this.setCellWidth(header, state.maxColumnWidths[index], isFlexible);
    });
    // Строки
    state.rows.forEach((row) => {
      row.querySelectorAll('.table-line').forEach((cell, index) => {
        this.setCellWidth(cell, state.maxColumnWidths[index], isFlexible);
      });
    });
  }

  /**
   * Установить ширину ячейке, используя CSS-свойства width и flex
   * @param {HTMLElement} cell
   * @param {number} width
   * @param {boolean} isFlexible - флаг гибкости
   */
  setCellWidth(cell, width, isFlexible = false) {
    if (!cell) return;
    width = Math.max(0, width);
    
    cell.style.width = `${width}px`;
  }

  /**
   * Установка атрибутов (role, aria-rowindex и т.п.) и первоначальной ширины для всех ячеек
   * @param {object} state
   */
  setupCells(state) {
    const isFlexible = state.isFlexible;
    // Заголовки
    state.headerCells.forEach((header, headerIndex) => {
      this.setCellWidth(header, state.maxColumnWidths[headerIndex], isFlexible);
      header.setAttribute('role', 'columnheader');
      header.setAttribute('cell-index', headerIndex);
    });

    // Строки таблицы
    state.rows.forEach((row, rowIndex) => {
      row.setAttribute('role', 'row');
      row.setAttribute('aria-rowindex', rowIndex + 1); 
      row.setAttribute('tabindex', '-1');
      row.setAttribute('row-index', rowIndex);
      row.setAttribute('row-id', rowIndex + 1);

      // Ячейки
      row.querySelectorAll('.table-line').forEach((cell, cellIndex) => {
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('cell-index', cellIndex);
        if (state.headerCells[cellIndex].classList.contains('fit')) {
          cell.classList.add('fit');
        }
        this.setCellWidth(cell, state.maxColumnWidths[cellIndex], isFlexible);
      });
    });
  }

  /**
   * Инициализация обработчиков для ресайза колонок (по нажатию на resizer в заголовке)
   * @param {object} state
   */
  setupResizableHeaders(state) {
    // Ищем только те заголовки, где есть класс resizable
    const resizableHeaders = state.headerCells.filter((cell) =>
      cell.classList.contains('resizable') && !cell.classList.contains('fit')
    );

    resizableHeaders.forEach((resizable) => {
      const resizer = resizable.querySelector('.resizer');
      if (!resizer) return;

      // Получаем правильный индекс колонки из атрибута
      const columnIndex = parseInt(resizable.getAttribute('cell-index'));
      if (isNaN(columnIndex)) return;

      // При нажатии на "ползунок" начинаем процесс ресайза
      resizer.addEventListener('mousedown', (e) => {
        if (!this.isNonMobileWidth()) return;
        e.preventDefault();
        this.startColumnResize(e, resizable, columnIndex, state);
      });
    });
  }

  /**
   * Обработчик начала ресайза колонки: сохраняем исходную ширину всех колонок и навешиваем события
   * @param {MouseEvent} e
   * @param {HTMLElement} resizable - заголовок, в котором происходит ресайз
   * @param {number} index          - индекс колонки
   * @param {object} state          - состояние таблицы
   */
  startColumnResize(e, resizable, index, state) {
    const startX = e.clientX;
    const originalWidth = resizable.offsetWidth;
    
    // Сохраняем ширины всех колонок
    const initialColumnWidths = state.headerCells.map(header => header.offsetWidth);

    // Получаем максимальную ширину для sticky колонок (70% от ширины таблицы)
    const maxStickyWidth = state.table.offsetWidth * 0.7;
  
    const minWidth = Math.max(50, typeof this.options.minWidthResize === 'number' 
      ? this.options.minWidthResize 
      : state.maxColumnWidths[index]);
  
    document.body.style.cursor = 'col-resize';
  
    const onMouseMove = (moveEvent) => {
      requestAnimationFrame(() => {
        const widthChange = moveEvent.clientX - startX;
        let newWidth = Math.round(Math.max(minWidth, originalWidth + widthChange));

        // Проверяем общую ширину sticky колонок
        let totalStickyWidth = 0;
        state.headerCells.forEach((header, i) => {
          if (header.classList.contains('sticky')) {
            totalStickyWidth += (i === index ? newWidth : header.offsetWidth);
          }
        });

        // Если текущая колонка sticky и общая ширина превышает лимит, ограничиваем
        if (resizable.classList.contains('sticky') && totalStickyWidth > maxStickyWidth) {
          const maxAllowedChange = maxStickyWidth - (totalStickyWidth - newWidth);
          newWidth = Math.min(newWidth, maxAllowedChange);
        }

        // Обновляем ширину колонки через вспомогательную функцию
        this.updateColumnWidth(state, index, newWidth, initialColumnWidths);

        // Вызов коллбэка onResize
        state.callbacks.onResize.forEach((callback) => {
          const columnId = state.headerCells[index].getAttribute('data-column-id') || index;
          callback(newWidth, columnId);
        });
  
        // Обновляем тень
        const shadowContent = state.table.querySelector('.shadow-block .block');
        if (shadowContent) {
          this.updateShadowDimensions(state, shadowContent);
        }
      });
    };
  
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
    };
  
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Подгонка ширины sticky-колонок для десктопа (если есть класс .sticky)
   * @param {object} state
   */
  setupStickyColumns(state) {
    // Для мобильных не применяем sticky
    if (!this.isNonMobileWidth()) return;

    // Получаем максимальную ширину (70% от ширины таблицы)
    const maxStickyWidth = state.table.offsetWidth * 0.7;

    // Считаем общую ширину sticky колонок
    let totalStickyWidth = 0;
    state.headerCells.forEach(header => {
      if (header.classList.contains('sticky')) {
        totalStickyWidth += header.offsetWidth;
      }
    });

    // Если общая ширина sticky колонок превышает 70%, уменьшаем их пропорционально
    if (totalStickyWidth > maxStickyWidth) {
      const ratio = maxStickyWidth / totalStickyWidth;
      state.headerCells.forEach((header, index) => {
        if (header.classList.contains('sticky')) {
          const newWidth = Math.floor(header.offsetWidth * ratio);
          this.setCellWidth(header, newWidth, false);
          state.rows.forEach(row => {
            const cell = row.querySelectorAll('.table-line')[index];
            if (cell) this.setCellWidth(cell, newWidth, false);
          });
        }
      });
    }

    // Применяем sticky позиционирование
    this.setStickyPosition(state.headerCells);
    state.rows.forEach((row) => {
      this.setStickyPosition(row.querySelectorAll('.table-line'));
    });
  }

  /**
   * Назначение position: sticky и left: offset для переданных элементов
   * @param {NodeListOf<HTMLElement> | HTMLElement[]} elements
   */
  setStickyPosition(elements) {
    elements.forEach((element) => {
      if (element.classList.contains('sticky')) {
        element.style.position = 'sticky';
        element.style.left = `${element.offsetLeft}px`;
      }
    });
  }

  /**
   * Создание полупрозрачного блока (тени) для левой части таблицы
   * @param {object} state
   */
  createShadowBlock(state) {
    if (!this.isNonMobileWidth()) return;

    const shadowBlock = document.createElement('div');
    shadowBlock.classList.add('shadow-block', 'absolute', 'inset-0', 'pointer-events-none', 'z-50');

    const shadowContent = document.createElement('span');
    shadowContent.classList.add('block', 'bg-opacity-10');
    shadowContent.style.opacity = '0';
    
    // Ограничиваем максимальную ширину тени 70% от ширины таблицы
    shadowContent.style.maxWidth = '70%';

    shadowBlock.appendChild(shadowContent);

    const tableWrapper = state.table.querySelector('.table-type-one__wrapper');
    if (!tableWrapper) {
      this.showError('Table wrapper .table-type-one__wrapper not found.');
      return;
    }
    tableWrapper.appendChild(shadowBlock);

    this.updateShadowDimensions(state, shadowContent, false);

    if (state.tableOverflowThumb) {
      state.tableOverflowThumb.addEventListener('scroll', () => {
        this.updateShadowDimensions(state, shadowContent, true);
      });
    }
  }

  /**
   * Обновление размеров тени под текущие sticky-колонки
   * @param {object} state
   * @param {HTMLElement} shadowContent
   * @param {boolean} isScrolling - флаг, указывающий происходит ли скролл
   */
  updateShadowDimensions(state, shadowContent, isScrolling = false) {
    // Суммарная ширина всех sticky-заголовков
    const totalStickyWidth = Array.from(state.table.querySelectorAll('.header-row > .sticky')).reduce(
      (acc, stickyHeader) => acc + stickyHeader.offsetWidth,
      0
    );

    // Высота содержимого таблицы (чтобы тень закрывала всю высоту)
    const tableHeight = state.table.querySelector('.table-type-one__body')?.offsetHeight || 0;
    shadowContent.style.width = `${totalStickyWidth}px`;
    shadowContent.style.height = `${tableHeight}px`;

    // Проверяем видимость тени только при скролле
    if (isScrolling) {
        this.checkShadowVisibility(state, shadowContent);
    }
  }

  /**
   * Проверяем, "прилип" ли sticky-элемент к левому краю, чтобы отобразить тень
   * @param {object} state
   * @param {HTMLElement} shadowContent
   */
  checkShadowVisibility(state, shadowContent) {
    const tableWrapper = state.table.querySelector('.table-type-one__wrapper');
    if (!tableWrapper) return;

    const stickyElements = state.table.querySelectorAll('.sticky, .sticky-row');
    if (stickyElements.length === 0) return;

    const wrapperRect = tableWrapper.getBoundingClientRect();
    const firstStickyRect = stickyElements[0].getBoundingClientRect();
    
    // Проверяем скролл
    const hasScroll = state.tableOverflowThumb && state.tableOverflowThumb.scrollLeft > 0;
    
    // Показываем тень только если есть скролл и sticky-элемент касается левого края
    const shouldShowShadow = hasScroll && Math.abs(firstStickyRect.left - wrapperRect.left) <= 1;
    shadowContent.style.opacity = shouldShowShadow ? '1' : '0';
  }

  /**
   * Перерасчитывает position sticky-элементов (если они есть)
   * @param {object} state
   */
  adjustStickyColumns(state) {
    if (!this.isNonMobileWidth()) return;

    // Обновляем позиционирование sticky для заголовков
    const stickyHeaders = state.table.querySelectorAll('.header-row > .sticky');
    this.updateStickyPositions(stickyHeaders);

    // Для каждой строки обновляем позиционирование sticky-ячейки
    state.rows.forEach((row) => {
      const stickyCells = row.querySelectorAll('.sticky-row');
      this.updateStickyPositions(stickyCells);
    });

    // Вызываем коллбэки onStickyAdjust
    state.callbacks.onStickyAdjust.forEach((callback) => callback());
  }

  /**
   * Задаёт (или сбрасывает) высоту для таблицы, если строк > 15 — для примера
   * @param {object} state
   */
  adjustTableHeight(state) {
    const totalRows = state.rows.length + 1; // +1 для .header-row
    const tableBody = state.table.querySelector('.table-type-one__body');
    if (tableBody) {
      if (totalRows > 15) {
        tableBody.style.height = '500px'; 
      } else {
        tableBody.style.height = '';
      }
    }
  }

  /* ===== Новые вспомогательные функции ===== */

  /**
   * Обновляет ширину указанной колонки как в заголовке, так и в строках.
   * Если режим гибкий, то также восстанавливает ширину fit-колонок.
   * @param {object} state - состояние таблицы
   * @param {number} index - индекс колонки
   * @param {number} newWidth - новая ширина
   * @param {number[]} [initialColumnWidths] - исходные ширины колонок для восстановления fit-колонок
   */
  updateColumnWidth(state, index, newWidth, initialColumnWidths = null) {
    if (state.isFlexible) {
      // Обновляем текущую колонку
      this.setCellWidth(state.headerCells[index], newWidth, state.isFlexible);
      state.rows.forEach(row => {
        const cell = row.querySelectorAll('.table-line')[index];
        if (cell) this.setCellWidth(cell, newWidth, state.isFlexible);
      });
      // Восстанавливаем ширину остальных fit-колонок
      if (initialColumnWidths) {
        state.headerCells.forEach((header, idx) => {
          if (idx !== index && header.classList.contains('fit')) {
            const fitWidth = initialColumnWidths[idx];
            this.setCellWidth(header, fitWidth, state.isFlexible);
            state.rows.forEach(row => {
              const cell = row.querySelectorAll('.table-line')[idx];
              if (cell) this.setCellWidth(cell, fitWidth, state.isFlexible);
            });
          }
        });
      }
    } else {
      // Негибкий режим
      this.setCellWidth(state.headerCells[index], newWidth, state.isFlexible);
      state.rows.forEach(row => {
        const cell = row.querySelectorAll('.table-line')[index];
        if (cell) this.setCellWidth(cell, newWidth, state.isFlexible);
      });
    }
  }

  /**
   * Обновляет позицию sticky-элементов, устанавливая для каждого left с учётом накопленного смещения.
   * @param {NodeListOf<HTMLElement>|HTMLElement[]} elements - коллекция элементов
   */
  updateStickyPositions(elements) {
    let offset = 0;
    elements.forEach(element => {
      element.style.left = `${offset}px`;
      offset += element.offsetWidth;
    });
  }
}

/**
 * Функция-декоратор debounce: не даёт вызывать func чаще, чем раз в delay миллисекунд
 * @param {function} func  - исходная функция
 * @param {number}   delay - время задержки в мс
 * @returns {function}
 */
function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Пример инициализации. Вы можете перенести этот участок кода в другое место вашего приложения.
document.addEventListener('DOMContentLoaded', () => {
  new RoaswayTable('.table-type-one', {
    minWidthResize: 70,
    onResize: debounce((width, columnId) => {
      console.log(`Column ${columnId} resized to ${width}px`);
    }, 200),
    onScroll: debounce((scrollLeft) => {
      console.log(`Scrolled to ${scrollLeft}px`);
    }, 200),
    onStickyAdjust: debounce(() => {
      console.log('Sticky columns adjusted');
    }, 200),
  });
});
