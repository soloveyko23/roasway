/**********************************************
 * Класс HorizBarChart с кастомным тултипом и обработкой ошибок
 **********************************************/
class HorizBarChart {
  /**
   * @param {string} canvasId  - ID <canvas>
   * @param {object} chartData - объект с labels/datasets
   * @param {object} userOptions - доп. опции
   */
  constructor(canvasId, chartData, userOptions = {}) {
    this.canvasId = canvasId;
    this.chartData = chartData;
    this.userOptions = userOptions;

    this.canvasEl = null;
    this.chart = null;
    this.legendEl = null;
    this.tooltipEl = null; // Элемент для тултипа
    this.chartOverflow = null; // Контейнер для ограничения тултипа
    this.activeLegend = {}; // Состояние активных легенд

    // 1) Ищем <canvas>
    const originalCanvas = document.getElementById(this.canvasId);
    if (!originalCanvas) {
      console.error(`Canvas with id="${this.canvasId}" not found.`);
      return;
    }
    this.canvasEl = originalCanvas;

    // 1.1) Автоматически добавляем недостающие лейблы, если есть лишние значения в данных
    this._ensureLabelsMatchData();

    // 2) Создаём оболочки вокруг canvas
    const { chartWrapper, chartOverflow, chartInner } = this._createWrappers(this.canvasEl);
    this.chartOverflow = chartOverflow; // Сохраняем ссылку на chartOverflow для использования в тултипе

    // 2.1) Добавляем вертикальный скролл, если количество лейблов больше 3
    if (this.chartData.labels.length > 3) {
      chartOverflow.style.maxHeight = '300px'; // Например, 100px на лейбл
      chartOverflow.style.overflowY = 'auto';
    }

    // 3) Создаём контейнер для легенды
    this.legendEl = document.createElement('div');
    this.legendEl.id = `${this.canvasId}-legend`;
    this.legendEl.classList.add('custom-legend');
    chartWrapper.appendChild(this.legendEl);

    // 4) Валидируем данные
    if (!this._validateData(this.chartData)) {
      console.error('Invalid chart data');
      return;
    }

    // 5) Сливаем дефолтные опции с пользовательскими
    const defaultOptions = this._getDefaultOptions();
    const finalOptions = this._deepMerge(defaultOptions, this.userOptions);

    // 6) Плагин для кастомных лейблов
    const customLabelsPlugin = {
      id: 'customLabels',
      afterDatasetsDraw: (chart) => {
        const horizBarChart = chart.options.plugins.customLabelsContext;
        horizBarChart._addCustomLabels(chart);
      },
      afterUpdate: (chart) => {
        chart.options.plugins.customLabelsContext._addCustomLabels(chart);
      },
    };

    
    // 7) Инициализируем Chart.js с кастомным тултипом
    const ctx = this.canvasEl.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.chartData,
      options: {
        ...finalOptions,
        plugins: {
          ...finalOptions.plugins, // Объединяем плагины
          customLabelsContext: this, // Сохраняем контекст для кастомных лейблов
          tooltip: {
            enabled: false, // Отключаем стандартные тултипы
            external: this._renderCustomTooltip.bind(this), // Указываем кастомную функцию
          },
        },
      },
      plugins: [customLabelsPlugin],
    });

    // 8) Создаём кастомную легенду
    this._buildLegend();

    // 9) Создаём контейнер для кастомного тултипа
    this._createTooltipElement(chartOverflow);

    // 10) Загружаем состояние легенды из localStorage
    this._loadLegendState();
  }

  /**
   * Убедиться, что количество лейблов соответствует количеству данных
   * Если данных больше, чем лейблов, добавляем недостающие лейблы автоматически
   */
  _ensureLabelsMatchData() {
    const maxDataLength = Math.max(...this.chartData.datasets.map(ds => ds.data.length));
    const currentLabelsLength = this.chartData.labels.length;

    if (maxDataLength > currentLabelsLength) {
      for (let i = currentLabelsLength; i < maxDataLength; i++) {
        this.chartData.labels.push(`Label ${i + 1}`);
      }
      console.warn(`Добавлено ${maxDataLength - currentLabelsLength} автоматически сгенерированных лейблов.`);
    }
  }

  /**
   * Глубокое слияние объектов опций
   * @param {object} target 
   * @param {object} source 
   * @returns {object} - Объединённый объект
   */
  _deepMerge(target, source) {
    const merged = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        merged[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        merged[key] = source[key];
      }
    }
    return merged;
  }

  /**
   * Создаём chart-wrapper → chart-overflow → chart-inner с модификаторами
   * @param {HTMLElement} originalCanvas 
   * @returns {object} - Оболочки
   */
  _createWrappers(originalCanvas) {
    const uniqueModifier = this.canvasId.replace(/\s+/g, '-').toLowerCase(); // Преобразуем ID в уникальный модификатор
    const typeModifier = 'bar'; // Тип всегда 'bar' для горизонтальной диаграммы

    const chartWrapper = document.createElement('div');
    chartWrapper.classList.add('chart-wrapper', `chart-wrapper--horiz-${uniqueModifier}`, `chart-wrapper--horiz-${typeModifier}`);

    const chartOverflow = document.createElement('div');
    chartOverflow.classList.add('chart-overflow', `chart-overflow--horiz-${uniqueModifier}`, `chart-overflow--horiz-${typeModifier}`);
    chartOverflow.style.position = 'relative'; // Устанавливаем позиционирование относительно контейнера

    const chartInner = document.createElement('div');
    chartInner.classList.add('chart-inner', 'chart-inner--scrollable', `chart-inner--horiz-${uniqueModifier}`, `chart-inner--horiz-${typeModifier}`);

    const parent = originalCanvas.parentNode;
    parent.replaceChild(chartWrapper, originalCanvas);

    chartWrapper.appendChild(chartOverflow);
    chartOverflow.appendChild(chartInner);
    chartInner.appendChild(originalCanvas);

    return { chartWrapper, chartOverflow, chartInner };
  }

  /**
   * Создаём элемент для кастомного тултипа
   * @param {HTMLElement} chartOverflow 
   */
  _createTooltipElement(chartOverflow) {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.classList.add(
      'bg-white',
      'shadow-md',
      'min-w-64',
      'absolute',
      'opacity-0',
      'pointer-events-none',
      'transition-opacity',
      'duration-200'
    );
    this.tooltipEl.style.position = 'absolute';
    this.tooltipEl.style.top = '0';
    this.tooltipEl.style.left = '0';
    this.tooltipEl.style.transform = 'translate(0, 0)'; // Убираем translate(-50%, 0)
    this.tooltipEl.style.zIndex = '1000'; // Убедитесь, что тултип находится поверх других элементов

    chartOverflow.appendChild(this.tooltipEl);
  }

  /**
   * Сохранение состояния легенды в localStorage
   */
  _saveLegendState() {
    const today = new Date().toDateString();
    const storageKey = `HorizBarChart_${this.canvasId}_legendState`;

    const stateToSave = {
      date: today,
      activeLegend: this.activeLegend,
    };

    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }

  /**
   * Загрузка состояния легенды из localStorage
   */
  _loadLegendState() {
    const today = new Date().toDateString();
    const storageKey = `HorizBarChart_${this.canvasId}_legendState`;
    const savedState = localStorage.getItem(storageKey);

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.date === today) {
          this.activeLegend = parsedState.activeLegend;
          // Применяем сохранённые состояния
          this.chartData.datasets.forEach((ds, index) => {
            const meta = this.chart.getDatasetMeta(index);
            if (this.activeLegend[index] === true) {
              meta.hidden = true;
            } else if (this.activeLegend[index] === false) {
              meta.hidden = false;
            }
          });
          this.chart.update();
        } else {
          // Если дата не совпадает, очищаем состояние
          localStorage.removeItem(storageKey);
          this.activeLegend = {};
        }
      } catch (e) {
        console.error('Error parsing legend state from localStorage:', e);
        this.activeLegend = {};
      }
    }
  }

  /**
   * Кастомный тултип
   * @param {object} context 
   */
  _renderCustomTooltip(context) {
    const { chart, tooltip } = context;
    const tooltipEl = this.tooltipEl;

    // Скрываем тултип, если его не должно быть
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Проверяем наличие данных
    if (!tooltip.dataPoints || tooltip.dataPoints.length === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    const dataPoint = tooltip.dataPoints[0];
    const datasetIndex = dataPoint.datasetIndex;
    const index = dataPoint.dataIndex;

    // Проверяем валидность индексов
    if (
      typeof datasetIndex !== 'number' ||
      typeof index !== 'number' ||
      !chart.data.datasets[datasetIndex] ||
      !chart.data.labels[index]
    ) {
      console.log('Invalid datasetIndex or dataIndex, hiding tooltip');
      tooltipEl.style.opacity = 0;
      return;
    }

    const dataset = chart.data.datasets[datasetIndex];
    const label = chart.data.labels[index];
    const currentValue = dataset.data[index];
    // Форматируем текущее значение
    const formattedCurrentValue = typeof currentValue === 'number' ? currentValue.toLocaleString() : 'N/A';

    // Получаем предыдущее значение для сравнения
    let previousValue = null;
    const previousDataset = chart.data.datasets.find((ds, idx) => idx !== datasetIndex);
    if (chart.data.datasets.length > 1) {
      if (previousDataset && previousDataset.data[index] !== undefined) {
        previousValue = previousDataset.data[index];
      }
    }

    // Вычисляем прирост и проценты
    let difference = null;
    let pctChange = null;
    let arrow = '';
    let arrowColor = '';
    if (previousValue !== null && typeof previousValue === 'number') {
      difference = currentValue - previousValue;
      pctChange = previousValue !== 0 ? ((difference / Math.abs(previousValue)) * 100).toFixed(1) : '0.0';
      arrow = difference > 0 ? '↑' : '↓';
      arrowColor = difference > 0 ? 'secondaryTwo-700' : 'systemRed-600';
    }

    // Формируем HTML для тултипа с использованием шаблонных строк
    let tooltipHTML = `
      <div class="bg-gray-100 p-2 font-medium text-Gray-700">${label}</div>
      <div class="flex items-center p-2 gap-2">
        <div class="inline-flex items-center gap-2 text-base text-Gray-600">
          <span style="background-color: ${dataset.backgroundColor}" class="w-2 h-2 min-w-2 min-h-2 rounded-full"></span>
          ${dataset.label}:
        </div>
        <h2 class="text-base font-bold text-Gray-800">$${formattedCurrentValue}</h2>
        ${difference !== null ? `<span class="text-${arrowColor} font-bold">${arrow}$${Math.abs(difference).toLocaleString()}</span>` : ''}
      </div>
      ${previousValue !== null ? `
        <div class="inline-flex items-center gap-2 text-gray-500 text-sm p-2 pt-0">
          <div class="inline-flex items-center gap-2 text-base text-Gray-600">
            <span style="background-color: ${previousDataset.backgroundColor}" class="w-2 h-2 min-w-2 min-h-2 rounded-full"></span>
            ${previousDataset.label}:
          </div>
          <span class="text-base font-bold text-Gray-800">$${previousValue.toLocaleString()}</span>
        </div>
      ` : ''}
    `;

    tooltipEl.innerHTML = tooltipHTML;

    // Показываем тултип для измерения размеров
    tooltipEl.style.opacity = 1;
    tooltipEl.style.visibility = 'hidden'; // Скрываем для измерения
    const tooltipRect = tooltipEl.getBoundingClientRect();
    tooltipEl.style.visibility = 'visible';
    tooltipEl.style.opacity = 0;

    // Получаем позицию контейнера chartOverflow относительно страницы
    const containerRect = this.chartOverflow.getBoundingClientRect();

    // Получаем координаты тултипа относительно страницы
    const tooltipX = tooltip.caretX;
    const tooltipY = tooltip.caretY;

    // Рассчитываем позицию относительно chartOverflow
    // Поскольку chartOverflow является родителем с position: relative,
    // и caretX/Y относительны к canvas, которые внутри chartOverflow,
    // можно использовать caretX и caretY напрямую.
    let relativeX = tooltipX;
    let relativeY = tooltipY;

    // Логируем координаты для отладки
    console.log('Tooltip.caretX:', tooltip.caretX, 'Tooltip.caretY:', tooltip.caretY);
    console.log('Relative X:', relativeX, 'Relative Y:', relativeY);

    // Вычисляем позицию тултипа
    let finalX = relativeX - (tooltipRect.width / 2); // Центрируем тултип
    let finalY = relativeY - tooltipRect.height - 10; // Смещение вверх

    // Проверяем, не выходит ли тултип за правую границу
    if (finalX + tooltipRect.width > this.chartOverflow.clientWidth) {
      finalX = this.chartOverflow.clientWidth - tooltipRect.width - 10; // Отступ 10px от края
    }

    // Проверяем, не выходит ли тултип за левую границу
    if (finalX < 0) {
      finalX = 10; // Отступ 10px от края
    }

    // Проверяем, не выходит ли тултип за верхнюю границу
    if (finalY < 0) {
      finalY = relativeY + 10; // Смещение вниз на 10px от курсора
    }

    // Проверяем, не выходит ли тултип за нижнюю границу (если нужно)
    if (finalY + tooltipRect.height > this.chartOverflow.clientHeight) {
      finalY = this.chartOverflow.clientHeight - tooltipRect.height - 10; // Отступ 10px от края
    }

    // Устанавливаем позицию тултипа
    tooltipEl.style.left = `${finalX}px`;
    tooltipEl.style.top = `${finalY}px`;
    tooltipEl.style.opacity = 1;
  }

  /**
   * Проверяем структуру chartData
   * @param {object} data 
   * @returns {boolean} - Результат проверки
   */
  _validateData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.labels) || !Array.isArray(data.datasets)) return false;
    for (const ds of data.datasets) {
      if (!Array.isArray(ds.data)) return false;
      // Дополнительные проверки: наличие label и backgroundColor
      if (typeof ds.label !== 'string' || typeof ds.backgroundColor !== 'string') return false;
    }
    return true;
  }

  /**
   * Дефолтные настройки
   * @returns {object} - Объект с настройками
   */
_getDefaultOptions() {
    const maxValue = Math.max(...this.chartData.datasets.flatMap(d => d.data)) || 0;
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // Легенда отключена
        tooltip: { enabled: false }, // Отключаем стандартные тултипы
      },
      scales: {
        x: {
          display: false,
          beginAtZero: true,
          max: maxValue * 1.5,
        },
        y: {
          display: false,
        },
      },
      datasets: {
        bar: {
          categoryPercentage: 2, // Настройка отступов между категориями (группами)
          barPercentage: 1,      // Настройка ширины баров внутри категории
        },
      },
      layout: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      animation: {
        duration: 1000,
        easing: 'easeOutCubic',
      },
    };
  }

  

  /**
   * Плагин: добавляем кастомные лейблы (стрелочки, процент и т.п.)
   * Также добавляем лейблы над барами
   * @param {object} chart 
   */
  _addCustomLabels(chart) {
    const { ctx, data, scales } = chart;
    const xScale = scales.x;
    const yScale = scales.y;

    // ***** Добавление лейблов сверху слева над группами баров *****
    data.labels.forEach((label, idx) => {
      const yPos = yScale.getPixelForTick(idx);
      const font = 'bold 16px Inter';
      const color = '#121926';
      const textAlign = 'left';
      const textBaseline = 'bottom';
      const labelX = xScale.left + 10; // 10px отступ слева
      const labelY = yPos - 35; // Фиксированный отступ вверх

      this._drawText(ctx, label, font, color, textAlign, textBaseline, labelX, labelY);
    });
    // ********************************************

    // ***** Добавление информации над барами *****
    data.datasets.forEach((dataset, datasetIdx) => {
      const meta = chart.getDatasetMeta(datasetIdx);

      // Пропускаем скрытые наборы данных
      if (meta.hidden) return;

      data.labels.forEach((label, idx) => {
        const bar = meta.data[idx]; // Получаем элемент бара
        if (!bar) return;

        const barEndX = bar.x; // Правый край бара
        const barCenterY = bar.y; // Центр бара по вертикали
        const value = dataset.data[idx];

        // Начинаем отступы с 10px от правого края бара
        let currentX = barEndX + 10;
        let currentY = barCenterY; // Центр бара

        // Рисуем значение
        this._drawText(ctx, `$${value}`, 'bold 14px Inter', '#000', 'left', 'middle', currentX, currentY);
        currentX += ctx.measureText(`$${value}`).width + 25; // Добавляем ширину текста + отступ

        // Если есть следующий датасет, добавляем стрелки, разницу и проценты
        const nextDatasetIdx = datasetIdx + 1;
        if (nextDatasetIdx < data.datasets.length) {
          const nextMeta = chart.getDatasetMeta(nextDatasetIdx);

          if (!nextMeta.hidden) {
            const nextValue = chart.data.datasets[nextDatasetIdx].data[idx];
            const difference = value - nextValue;
            const pctChange = ((difference / Math.abs(nextValue)) * 100).toFixed(1);
            const arrow = difference > 0 ? '↑' : '↓';
            const arrowColor = difference > 0 ? '#00A985' : '#EB5050';

            // Рисуем стрелку
            this._drawText(ctx, arrow, 'bold 16px Inter', arrowColor, 'left', 'middle', currentX, currentY);
            currentX += ctx.measureText(arrow).width + 10; // Добавляем ширину стрелки + отступ

            // Рисуем разницу
            this._drawText(ctx, `$${Math.abs(difference)}`, 'bold 14px Inter', arrowColor, 'left', 'middle', currentX, currentY);
            currentX += ctx.measureText(`$${Math.abs(difference)}`).width + 20; // Добавляем ширину разницы + отступ

            // Рисуем процент
            this._drawText(ctx, `(${pctChange}%)`, '14px Inter', '#9AA4B2', 'left', 'middle', currentX, currentY);
          }
        }
      });
    });
    // ********************************************
  }

  /**
   * Хелпер для отрисовки текста
   * @param {CanvasRenderingContext2D} ctx 
   * @param {string} text 
   * @param {string} font 
   * @param {string} color 
   * @param {string} align 
   * @param {string} baseline 
   * @param {number} x 
   * @param {number} y 
   */
  _drawText(ctx, text, font, color, align, baseline, x, y) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Создаём кастомную легенду
   */
  _buildLegend() {
    if (!this.legendEl) return;

    this.legendEl.innerHTML = '';
    // Для каждого набора данных...
    this.chartData.datasets.forEach((ds, index) => {
      const legendItem = document.createElement('div');
      legendItem.classList.add('custom-legend-item');

      // Проверяем, является ли этот набор данных активным
      const isActive = this.activeLegend[index] !== false; // По умолчанию активен

      if (!isActive) {
        legendItem.classList.add('active');
      }

      legendItem.innerHTML = `
        <span class="dot" style="background-color: ${ds.backgroundColor};"></span>
        <span>${ds.label}</span>
      `;

      legendItem.addEventListener('click', () => {
        const meta = this.chart.getDatasetMeta(index);
        meta.hidden = !meta.hidden;
        this.chart.update();

        // Переключаем класс 'active'
        legendItem.classList.toggle('active');

        // Сохраняем состояние в activeLegend
        this.activeLegend[index] = meta.hidden;
        this._saveLegendState();
      });

      this.legendEl.appendChild(legendItem);
    });
  }

  /**
   * Пример метода обновления данных
   * @param {object} newData 
   */
  updateData(newData) {
    // Проверяем корректность
    if (!this._validateData(newData)) {
      console.error('Invalid data for update');
      return;
    }
    // Обновляем chartData
    this.chartData = newData;
    this.chart.data = newData;

    // Пересчитываем max
    const maxValue = Math.max(...newData.datasets.flatMap(d => d.data)) || 0;
    this.chart.options.scales.x.max = maxValue * 1.5;

    // Перерисовываем
    this.chart.update();

    // Перестраиваем легенду
    if (this.legendEl) {
      this.legendEl.innerHTML = '';
      this._buildLegend();
    }

    // Проверяем и добавляем лейблы, если необходимо
    this._ensureLabelsMatchData();

    // Обновляем скролл, если необходимо
    if (this.chartData.labels.length > 3) {
      this.chartOverflow.style.maxHeight = '1000px'; // Например, 100px на лейбл

    } else {
      this.chartOverflow.style.maxHeight = '';
    }
  }
}

/**********************************************
 * Пример инициализации
 **********************************************/
const exampleData = {
  labels: ['Low Popularity – USA', 'Mid Popularity – USA', 'High Popularity – USA'],
  datasets: [
    {
      label: 'Today',
      data: [490, 760, 290],
      backgroundColor: '#00C7DC',
      borderRadius: 5,
      barThickness: 27,
    },
    {
      label: '15.04',
      data: [783, 680, 150],
      backgroundColor: '#C1F5FA',
      borderRadius: 5,
      barThickness: 27,
      
    },
  ],
};

const exampleData1 = {
  labels: ['Low Popularity – USA', 'Mid Popularity – USA', 'High Popularity – USA'],
  datasets: [
    {
      label: 'Today',
      data: [490, 760, 290],
      backgroundColor: '#5E92FF',
      borderRadius: 5,
      barThickness: 27,
    },
    {
      label: '15.04',
      data: [783, 680, 150],
      backgroundColor: '#D9E5FF',
      borderRadius: 5,
      barThickness: 27,
      
    },
  ],
};

// Создаём диаграмму
new HorizBarChart('chart-container1', exampleData);
new HorizBarChart('chart-container2', exampleData1);
