import { Chart, registerables } from 'chart.js';
import { chartConfigs } from './chartData.js';

/**********************************************
 * Apps Timeline — утилиты
 **********************************************/

// Извлекает средний цвет из центральной части иконки
function extractDominantColor(img) {
  try {
    const canvas = document.createElement('canvas');
    const size = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height, 64);
    if (size === 0) return { r: 154, g: 164, b: 178 };
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);

    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    let r = 0, g = 0, b = 0, count = 0;
    const margin = Math.floor(size * 0.15);

    for (let y = margin; y < size - margin; y++) {
      for (let x = margin; x < size - margin; x++) {
        const i = (y * size + x) * 4;
        if (data[i + 3] < 128) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }

    if (count === 0) return { r: 154, g: 164, b: 178 };
    return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
  } catch (e) {
    return { r: 154, g: 164, b: 178 };
  }
}

// Парсит строку времени "H.MM" в число часов (дробное)
function parseTimeValue(timeStr) {
  const [hours, minutes] = timeStr.split('.').map(Number);
  return hours + (minutes || 0) / 60;
}

// Группирует записи таймлайна: одинаковые appId подряд объединяет в группу
function groupTimelineEntries(entries) {
  if (!entries || entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) => parseTimeValue(a.time) - parseTimeValue(b.time));
  const groups = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const timeDiff = parseTimeValue(curr.time) - parseTimeValue(prev.time);

    if (curr.appId === prev.appId && timeDiff <= 1.5) {
      currentGroup.push(curr);
    } else {
      groups.push(currentGroup);
      currentGroup = [curr];
    }
  }
  groups.push(currentGroup);
  return groups;
}

// Получает пиксельную координату X для времени, используя шкалу графика
function getPixelForTime(chart, timeStr) {
  const xScale = chart.scales.x;
  const labels = chart.data.labels;
  const [hours, minutes] = timeStr.split('.').map(Number);

  const currentHourIndex = labels.findIndex(label => {
    const [labelHours] = label.split('.').map(Number);
    return labelHours === hours;
  });

  if (currentHourIndex === -1) return null;

  const currentPixel = xScale.getPixelForValue(currentHourIndex);
  const nextPixel = currentHourIndex + 1 < labels.length
    ? xScale.getPixelForValue(currentHourIndex + 1)
    : currentPixel + (currentPixel - xScale.getPixelForValue(Math.max(0, currentHourIndex - 1)));

  const fraction = (minutes || 0) / 60;
  return currentPixel + (nextPixel - currentPixel) * fraction;
}

// Загружает изображения для всех уникальных приложений, извлекает цвета
function loadTimelineImages(timelineData) {
  const uniqueApps = {};
  timelineData.forEach(entry => {
    if (!uniqueApps[entry.appId]) {
      uniqueApps[entry.appId] = entry;
    }
  });

  const images = {};
  const colors = {};
  const promises = [];

  Object.entries(uniqueApps).forEach(([appId, entry]) => {
    const promise = new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        images[appId] = img;
        colors[appId] = extractDominantColor(img);
        resolve();
      };
      img.onerror = () => {
        images[appId] = null;
        colors[appId] = { r: 154, g: 164, b: 178 };
        resolve();
      };
      img.src = entry.icon;
    });
    promises.push(promise);
  });

  return Promise.all(promises).then(() => ({ images, colors }));
}

// Константы таймлайна
const TIMELINE_TOP_PADDING = 78;  // Отступ от chartArea.bottom до центра таймлайна
const TIMELINE_ROW_HEIGHT = 14;   // Половина высоты иконки (для padding.bottom)
const TOTAL_TIMELINE_HEIGHT = TIMELINE_ROW_HEIGHT;
const ICON_SIZE = 24;             // Иконка в квадрате (в центре группы)
const ICON_SIZE_SINGLE = 22;     // Иконка одиночная
const ICON_BORDER_RADIUS = 6;    // Скругление углов иконки
const DOT_RADIUS = 4;            // Точки на линии (в группе)
const LINE_WIDTH = 3;            // Толщина соединительной линии (цветной)
const DASH_LINE_WIDTH = 2;       // Толщина пунктирной линии (между группами)
const DASH_COLOR = '#CDD5DF';    // Цвет пунктирной линии
const LEGEND_ICON_SIZE = 18;     // Маленькая иконка в строке процентов

/**********************************************
 * Базовый класс с общими утилитными методами
 **********************************************/
class BaseChartManager {
  constructor() {
    this.charts = {};
  }

  // Создаёт обёртку для canvas с использованием Tailwind CSS
  _createChartWrapper(canvasId, type, isSimple = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Создаём обёртку, если её ещё нет
    let wrapper = canvas.closest('.chart-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'chart-wrapper relative';
      
      // Применяем стили только для полного менеджера
      if (!isSimple) {
        wrapper.style.cssText = `
          min-height:375px;
          width: 100%;
          overflow: hidden;
        `;
      } else {
        wrapper.style.cssText = `
          width: 100%;
          overflow: hidden;
        `;
      }
      
      canvas.parentNode.insertBefore(wrapper, canvas);

      const overflow = document.createElement('div');
      overflow.className = 'chart-overflow';
      
      // Разные стили для простого и полного менеджера
      if (!isSimple) {
        overflow.style.cssText = `
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 375px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
        `;
      } else {
        overflow.style.cssText = `
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        `;
      }

      // Создаём контейнер для графика с минимальной шириной
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.style.cssText = `
        position: relative;
        ${!isSimple && window.innerWidth < 768 ? 'min-width: 800px;' : 'width: 100%;'}
        height: 100%;
      `;

      wrapper.appendChild(overflow);
      overflow.appendChild(chartContainer);
      chartContainer.appendChild(canvas);
    }

    return wrapper;
  }

  // Применяет общие параметры и настройки для dashed-сегментов
  applyDashedSegments(data, dashedSegments) {
    (data.datasets || []).forEach(dataset => {
      Object.assign(dataset, {
        pointBackgroundColor: dataset.borderColor,
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 2
      });

      if (dataset.dashedSegments) {
        dataset.segment = {
          borderColor: (ctx) => this._getSegmentValue(ctx, dataset, 'color', dataset.borderColor),
          borderDash: (ctx) => this._getSegmentValue(ctx, dataset, 'dash', dataset.borderDash || [])
        };
      }
    });
  }

  _getSegmentValue(ctx, dataset, key, defaultValue) {
    const { p0DataIndex, p1DataIndex } = ctx;
    for (const seg of dataset.dashedSegments) {
      if (p0DataIndex >= seg.start && p1DataIndex <= seg.end) {
        return seg[key];
      }
    }
    return defaultValue;
  }

  // Загружает данные из JSON-файла
  loadDataFromJsonFile(filePath, callback) {
    fetch(filePath)
      .then(response => {
        if (!response.ok) throw new Error(`Не удалось загрузить JSON файл: ${response.statusText}`);
        return response.json();
      })
      .then(data => callback(data))
      .catch(error => console.error("Ошибка при загрузке JSON файла:", error));
  }

  // Уничтожает все созданные графики
  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
  }

  // Универсальный парсер JSON-конфига, объединяющий переданные и новые параметры
  _parseJsonConfig(jsonConfig, data, options, dashedSegments) {
    try {
      const parsed = JSON.parse(jsonConfig);
      return {
        data: parsed.data || data,
        options: { ...options, ...parsed.options },
        dashedSegments: parsed.dashedSegments || dashedSegments
      };
    } catch (error) {
      console.error("Неверный JSON конфиг:", error);
      return null;
    }
  }

  // Добавим новый метод для управления состоянием тултипа
  _resetTooltipState(tooltip, isVisible) {
    if (!tooltip) return;
    
    if (isVisible) {
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
      tooltip.style.display = 'block';
      tooltip.classList.remove('opacity-0');
      tooltip.classList.add('opacity-100');
      tooltip.style.pointerEvents = 'none';
      tooltip.style.userSelect = 'none';
      tooltip.style.webkitUserSelect = 'none';
    } else {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
      tooltip.style.display = 'none';
      tooltip.classList.add('opacity-0');
      tooltip.classList.remove('opacity-100');
      tooltip.style.pointerEvents = 'none';
      tooltip.style.userSelect = 'none';
      tooltip.style.webkitUserSelect = 'none';
    }
  }
}

/**********************************************
 * Полный менеджер графиков (с кастомными тултипами, легендой и вертикальной линией)
 **********************************************/
class ChartManager extends BaseChartManager {
  createChart({ id, canvasId, type = "line", data = {}, options = {}, jsonConfig = null, dashedSegments = [] }) {
    if (this.charts[id]) {
      console.warn(`Chart with ID "${id}" уже существует.`);
      return this.charts[id];
    }

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas с ID "${canvasId}" не найден.`);
      return null;
    }

    const chartWrapper = this._createChartWrapper(canvasId, type, false);
    if (!chartWrapper) return null;

    // Получаем элемент chart-overflow
    const chartOverflow = chartWrapper.querySelector('.chart-overflow');

    // Если передан JSON-конфиг, объединяем его с текущими параметрами
    if (jsonConfig) {
      const parsed = this._parseJsonConfig(jsonConfig, data, options, dashedSegments);
      if (!parsed) return null;
      ({ data, options, dashedSegments } = parsed);
    }

    const ctx = canvas.getContext("2d");
    this.applyDashedSegments(data, dashedSegments);
    const chartConfig = this.getChartConfig(type, data, options);

    // Настраиваем кастомный тултип
    const tooltipEl = this._createTooltipElement(chartOverflow);
    chartConfig.options.plugins.tooltip = {
      enabled: false,
      external: context => this._renderCustomTooltip(context, tooltipEl, chartWrapper)
    };

    // Передаём параметры для плагина вертикальной линии
    chartConfig.options.plugins.verticalLine = {
      color: 'rgba(0, 0, 0, 0.1)',
      dash: [5, 5],
      lineWidth: 1
    };

    // Передаём данные таймлайна приложений в плагин (до создания графика)
    const config = chartConfigs[id];
    if (config?.appsTimeline?.length) {
      chartConfig.options.plugins.appsTimelinePlugin = {
        data: config.appsTimeline
      };
      // Резервируем место для таймлайна через layout padding
      chartConfig.options.layout = chartConfig.options.layout || {};
      const existingPadding = chartConfig.options.layout.padding || 0;
      const timelineSpace = TOTAL_TIMELINE_HEIGHT + TIMELINE_TOP_PADDING;
      if (typeof existingPadding === 'number') {
        chartConfig.options.layout.padding = {
          top: existingPadding, right: existingPadding,
          bottom: existingPadding + timelineSpace, left: existingPadding
        };
      } else {
        chartConfig.options.layout.padding = {
          ...existingPadding,
          bottom: (existingPadding.bottom || 0) + timelineSpace
        };
      }
    }

    const chart = new Chart(ctx, chartConfig);
    this._createCustomLegend(chart, chartWrapper);

    // Добавляем маркеры изменений, если они есть
    if (config?.changes?.annotations) {
      this._addChangeMarkers(chart, chartWrapper, config.changes.annotations);
    }

    // Загружаем иконки и инициализируем таймлайн приложений
    if (config?.appsTimeline?.length) {
      // Создаём DOM-тултип для таймлайна (стиль как marker-tooltip)
      const timelineTooltip = document.createElement('div');
      timelineTooltip.className = 'apps-timeline-tooltip absolute bg-white shadow-md rounded-md';
      timelineTooltip.style.cssText = `
        position: absolute;
        display: none;
        z-index: 1010;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        min-width: 200px;
      `;
      chartOverflow.appendChild(timelineTooltip);

      chart._appsTimeline = {
        images: {},
        colors: {},
        groups: groupTimelineEntries(config.appsTimeline),
        imagesLoaded: false,
        hoveredApp: null,
        hitRegions: [],
        tooltipEl: timelineTooltip
      };

      loadTimelineImages(config.appsTimeline).then(({ images, colors }) => {
        chart._appsTimeline.images = images;
        chart._appsTimeline.colors = colors;
        chart._appsTimeline.imagesLoaded = true;

        // Добавляем проценты в легенду
        this._addTimelinePercentages(chartWrapper, config.appsTimeline, images);

        chart.draw();
      });
    }

    this.charts[id] = chart;
    return chart;
  }

  getChartConfig(type, data, options) {
    return {
      type,
      data: data || { labels: [], datasets: [] },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          verticalLinePlugin: {
            color: 'rgba(0, 0, 0, 0.1)',
            dash: [5, 5],
            lineWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false, color: '#F5F7FC', },
            ticks: {
              color: "#9aa4b2",
              padding: 10,
              font: { size: 14, family: 'Inter, sans-serif', weight: '500' }
            }
          },
          y: {
            grid: { display: options.showGridY !== false, drawBorder: false, color: '#F5F7FC', },
            ticks: {
              color: "#9aa4b2",
              padding: 5, // Добавляем отступ для тиков
              callback: function(value) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000).toFixed(1) + 'M';
                }
                if (value >= 100000) {
                  return '$' + (value / 1000).toFixed(1) + 'K';
                }
                return '$' + value;
              },
              font: { size: 14, family: 'Inter, sans-serif', weight: '500' }
            },
            beginAtZero: true,
            suggestedMin: 0
          }
        }
      },
      plugins: [this._createVerticalLinePlugin(), this._createAppsTimelinePlugin()]
    };
  }

  // Создаёт и возвращает элемент для кастомного тултипа
  _createTooltipElement(wrapper) {
    let tooltipEl = wrapper.querySelector('.custom-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'custom-tooltip absolute bg-white shadow-md rounded-md opacity-0 transition-opacity duration-300 z-[1005] whitespace-nowrap';
      tooltipEl.style.cssText = `
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      `;
      wrapper.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  _renderCustomTooltip(context, tooltipEl, wrapper) {
    const { chart, tooltip } = context;
    
    // Если тултип не должен быть показан
    if (!this._shouldShowTooltip(tooltip)) {
      this._resetTooltipState(tooltipEl, false);
      return;
    }

    // Показываем тултип
    this._resetTooltipState(tooltipEl, true);
    
    const tooltipData = this._extractTooltipData(context);
    const content = this._generateTooltipContent(tooltipData, chart);
    this._updateTooltipPosition(tooltipEl, content, chart, tooltip, wrapper);
  }

  _shouldShowTooltip(tooltip) {
    return tooltip.opacity !== 0 && tooltip.dataPoints && tooltip.dataPoints.length > 0;
  }

  _hideTooltip(tooltipEl) {
    tooltipEl.classList.add('opacity-0');
    tooltipEl.style.visibility = 'hidden';
  }

  _extractTooltipData(context) {
    const { dataset, dataIndex, raw } = context.tooltip.dataPoints[0];
    const previousDataset = context.chart.data.datasets[1];
    return {
      currentDataset: dataset,
      currentIndex: dataIndex,
      currentValue: raw,
      previousDataset,
      previousValue: previousDataset ? previousDataset.data[dataIndex] : null,
      label: context.chart.data.labels[dataIndex]
    };
  }

  _generateTooltipContent(data, chart) {
    const { currentDataset, currentValue, previousDataset, previousValue, label } = data;
    const isCurrentVisible = !chart.getDatasetMeta(0).hidden;
    const isPreviousVisible = chart.data.datasets[1] && !chart.getDatasetMeta(1).hidden;

    // Функция форматирования числа
    const formatValue = (value) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 100000) {
            return `$${(value / 1000).toFixed(1)}K`;
        }
        return `$${value.toLocaleString()}`;
    };

    const header = `
      <div class="p-2 border-b bg-gray-200 border-gray-200">
        <span class="text-sm text-gray-700">${label}</span>
      </div>
    `;

    let body = '';
    if (isCurrentVisible && isPreviousVisible && currentValue === previousValue && currentValue !== null) {
        body = `
            <div class="p-2 flex items-center space-x-2">
                <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${currentDataset.borderColor};"></span>
                <span class="text-gray-600 text-base">${currentDataset.label}:</span>
                <span class="font-semibold text-gray-900 text-base">${formatValue(currentValue)}</span>
            </div>
        `;
    } else {
        if (isCurrentVisible && currentValue !== null) {
            const difference = isPreviousVisible && previousValue !== null ? currentValue - previousValue : null;
            const pctChange = difference !== null && previousValue ? ((difference / previousValue) * 100).toFixed(1) : null;
            const arrow = difference > 0 ? '↑' : '↓';
            const arrowColor = difference > 0 ? 'text-green-500' : 'text-red-500';

            body += `
                <div class="p-2 flex items-center space-x-2">
                    <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${currentDataset.borderColor};"></span>
                    <span class="text-gray-600 text-base">${currentDataset.label}:</span>
                    <span class="font-semibold text-gray-900 text-base">${formatValue(currentValue)}</span>
                    ${difference !== null && difference !== 0 ?
                        `<span class="${arrowColor} font-bold ml-2">${arrow} ${formatValue(Math.abs(difference))} (${pctChange}%)</span>` : ''}
                </div>
            `;
        }

        if (isPreviousVisible && previousValue !== null) {
            body += `
                <div class="p-2 pt-0 flex items-center space-x-2">
                    <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${previousDataset.borderColor};"></span>
                    <span class="text-gray-600 text-base">${previousDataset.label}:</span>
                    <span class="font-semibold text-gray-900 text-base">${formatValue(previousValue)}</span>
                </div>
            `;
        }
    }

    return `<div class="bg-white shadow-md rounded-md">${header}${body}</div>`;
  }

  // Для обычного тултипа (следует за точками)
  _updateTooltipPosition(tooltipEl, content, chart, tooltip, wrapper) {
    tooltipEl.innerHTML = content;
    tooltipEl.style.opacity = 1;

    const overflow = wrapper.querySelector('.chart-overflow');
    const chartRect = chart.canvas.getBoundingClientRect();
    const overflowRect = overflow.getBoundingClientRect();
    
    // Учитываем скролл и позицию контейнера
    const position = {
        x: tooltip.caretX,
        y: tooltip.caretY
    };

    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const padding = 12; // Отступ от точки

    // Определяем, достаточно ли места справа
    const spaceRight = chartRect.width - position.x - padding;
    const spaceLeft = position.x - padding;
    
    // По умолчанию пытаемся разместить справа
    let left = position.x + padding;
    
    // Если справа не хватает места, размещаем слева
    if (spaceRight < tooltipWidth && spaceLeft > tooltipWidth) {
        left = position.x - tooltipWidth - padding;
    }

    // Вычисляем вертикальную позицию
    let top = position.y - (tooltipHeight / 2); // Центрируем по вертикали относительно точки

    // Проверяем верхнюю границу
    const minTop = 8;
    if (top < minTop) {
        top = minTop;
    }

    // Проверяем нижнюю границу
    const maxTop = chartRect.height - tooltipHeight - 8;
    if (top > maxTop) {
        top = maxTop;
    }

    // Проверяем горизонтальные границы
    const minLeft = 8;
    const maxLeft = chartRect.width - tooltipWidth - 8;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }

  _createVerticalLinePlugin() {
    return {
      id: 'verticalLinePlugin',
      afterDraw: (chart, args, options) => {
        if (chart._hoverPosition != null && chart.chartArea) {
          const ctx = chart.ctx;
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash(options.dash || [5, 5]);
          ctx.lineWidth = options.lineWidth || 1;
          ctx.strokeStyle = options.color || 'rgba(0, 0, 0, 0.1)';
          ctx.moveTo(chart._hoverPosition, chart.chartArea.top);
          ctx.lineTo(chart._hoverPosition, chart.chartArea.bottom);
          ctx.stroke();
          ctx.restore();
        }
      },
      afterEvent: (chart, args) => {
        const { event } = args;
        const chartArea = chart.chartArea;
        if (!chartArea) return;

        if (!event.x) {
          chart._hoverPosition = null;
          chart.draw();
          return;
        }

        const xAxis = chart.scales.x;

        // Проверяем, находится ли курсор в области графика
        if (event.x < chartArea.left || event.x > chartArea.right || 
            event.y < chartArea.top || event.y > chartArea.bottom) {
          chart._hoverPosition = null;
          chart.draw();
          return;
        }

        // Находим ближайшую точку на оси X
        const points = xAxis.ticks;
        let closestPoint = points[0];
        let minDistance = Math.abs(xAxis.getPixelForTick(0) - event.x);

        points.forEach((point, index) => {
          const pixelPosition = xAxis.getPixelForTick(index);
          const distance = Math.abs(pixelPosition - event.x);
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
            chart._hoverPosition = pixelPosition;
          }
        });

        chart.draw();
      }
    };
  }

  _createAppsTimelinePlugin() {
    return {
      id: 'appsTimelinePlugin',

      afterDraw(chart) {
        const state = chart._appsTimeline;
        if (!state || !state.imagesLoaded || !state.groups.length) return;
        if (!chart.chartArea || !chart.scales?.x) return;

        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const centerY = chartArea.bottom + TIMELINE_TOP_PADDING;
        const hoverBorder = 3;
        const hoveredRegion = state.hoveredApp;

        state.hitRegions = [];

        // Гарантируем полную непрозрачность
        ctx.save();
        ctx.globalAlpha = 1;

        // ─── Хелпер: иконка со скруглёнными углами ───
        const drawIcon = (img, cx, cy, size, radius) => {
          const h = size / 2;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.roundRect(cx - h, cy - h, size, size, radius);
          ctx.clip();
          if (img) {
            ctx.drawImage(img, cx - h, cy - h, size, size);
          } else {
            ctx.fillStyle = '#9AA4B2';
            ctx.fill();
          }
          ctx.restore();
        };

        // ─── Хелпер: белый бордер для иконки при ховере ───
        const drawIconHoverBorder = (cx, cy, size, radius) => {
          const h = size / 2 + hoverBorder;
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(cx - h, cy - h, h * 2, h * 2, radius + 2);
          ctx.fill();
          ctx.restore();
        };

        // ─── Хелпер: точка (кружок) ───
        const drawDot = (cx, cy, radius, color) => {
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };

        // ─── Хелпер: белый бордер для точки при ховере ───
        const drawDotHoverBorder = (cx, cy, dotRadius) => {
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cx, cy, dotRadius + hoverBorder, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };

        // ===== ШАГ 1: Собираем позиции групп =====
        const groupPositions = [];
        state.groups.forEach(group => {
          if (group.length === 1) {
            const px = getPixelForTime(chart, group[0].time);
            if (px !== null) groupPositions.push({ startX: px, endX: px });
          } else {
            const pixels = group.map(e => getPixelForTime(chart, e.time)).filter(p => p !== null);
            if (pixels.length >= 2) groupPositions.push({ startX: pixels[0], endX: pixels[pixels.length - 1] });
          }
        });

        // ===== ШАГ 2: Пунктирные соединители МЕЖДУ группами =====
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = DASH_LINE_WIDTH;
        ctx.strokeStyle = DASH_COLOR;
        ctx.lineCap = 'round';
        for (let i = 0; i < groupPositions.length - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(groupPositions[i].endX, centerY);
          ctx.lineTo(groupPositions[i + 1].startX, centerY);
          ctx.stroke();
        }
        ctx.restore();

        // ===== ШАГ 3: Рисуем группы =====
        state.groups.forEach(group => {
          const appId = group[0].appId;
          const img = state.images[appId];
          const color = state.colors[appId] || { r: 154, g: 164, b: 178 };
          const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;

          if (group.length === 1) {
            // ── Одиночная иконка ──
            const entry = group[0];
            const x = getPixelForTime(chart, entry.time);
            if (x === null) return;

            // Создаём hitRegion ДО рисования (чтобы hover работал)
            const hr = {
              appId, name: entry.name, icon: entry.icon,
              developer: entry.developer || '', checkDate: entry.checkDate || '',
              time: entry.time, cx: x,
              x1: x - ICON_SIZE_SINGLE / 2 - 4, x2: x + ICON_SIZE_SINGLE / 2 + 4,
              y1: centerY - ICON_SIZE_SINGLE / 2 - 4, y2: centerY + ICON_SIZE_SINGLE / 2 + 4
            };
            state.hitRegions.push(hr);

            const isHovered = hoveredRegion && hoveredRegion.cx === x && hoveredRegion.time === entry.time;
            if (isHovered) drawIconHoverBorder(x, centerY, ICON_SIZE_SINGLE, ICON_BORDER_RADIUS);
            drawIcon(img, x, centerY, ICON_SIZE_SINGLE, ICON_BORDER_RADIUS);

          } else {
            // ── Группа: линия + точки + иконка по центру ──
            const pixelEntries = [];
            group.forEach(entry => {
              const px = getPixelForTime(chart, entry.time);
              if (px !== null) pixelEntries.push({ entry, px });
            });
            if (pixelEntries.length < 2) return;

            const startX = pixelEntries[0].px;
            const endX = pixelEntries[pixelEntries.length - 1].px;
            const iconX = (startX + endX) / 2;
            const iconHalf = ICON_SIZE / 2;

            // Сплошная цветная линия
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
            ctx.strokeStyle = colorStr;
            ctx.lineWidth = LINE_WIDTH;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX, centerY);
            ctx.lineTo(endX, centerY);
            ctx.stroke();
            ctx.restore();

            // Точки (кроме тех что под иконкой) + hitRegion
            pixelEntries.forEach(({ entry, px }) => {
              const isUnderIcon = Math.abs(px - iconX) < iconHalf + 2;

              // hitRegion для каждой точки
              const hr = {
                appId, name: entry.name, icon: entry.icon,
                developer: entry.developer || '', checkDate: entry.checkDate || '',
                time: entry.time, cx: px,
                x1: px - DOT_RADIUS - 6, x2: px + DOT_RADIUS + 6,
                y1: centerY - DOT_RADIUS - 6, y2: centerY + DOT_RADIUS + 6
              };
              state.hitRegions.push(hr);

              if (!isUnderIcon) {
                const isHovered = hoveredRegion && hoveredRegion.cx === px && hoveredRegion.time === entry.time;
                if (isHovered) drawDotHoverBorder(px, centerY, DOT_RADIUS);
                drawDot(px, centerY, DOT_RADIUS, colorStr);
              }
            });

            // Центральная иконка
            const centerEntry = pixelEntries[Math.floor(pixelEntries.length / 2)].entry;
            const isIconHovered = hoveredRegion && hoveredRegion.cx === iconX && hoveredRegion.time === centerEntry.time;
            if (isIconHovered) drawIconHoverBorder(iconX, centerY, ICON_SIZE, ICON_BORDER_RADIUS);
            drawIcon(img, iconX, centerY, ICON_SIZE, ICON_BORDER_RADIUS);

            // hitRegion для центральной иконки (добавляем ПОСЛЕДНИМ чтобы перекрывал точки)
            state.hitRegions.push({
              appId, name: centerEntry.name, icon: centerEntry.icon,
              developer: centerEntry.developer || '', checkDate: centerEntry.checkDate || '',
              time: centerEntry.time, cx: iconX,
              x1: iconX - ICON_SIZE / 2 - 2, x2: iconX + ICON_SIZE / 2 + 2,
              y1: centerY - ICON_SIZE / 2 - 2, y2: centerY + ICON_SIZE / 2 + 2
            });
          }
        });

        ctx.restore(); // закрываем globalAlpha = 1

        // ===== ШАГ 4: DOM-тултип =====
        const tooltipEl = state.tooltipEl;
        if (tooltipEl) {
          if (hoveredRegion) {
            tooltipEl.innerHTML = `
              <div class="flex flex-col">
                <div class="flex items-center justify-between bg-Gray-100 p-2 rounded-t-md">
                  <span class="text-sm text-Gray-700">${hoveredRegion.checkDate}</span>
                </div>
                <div class="flex items-center gap-2 p-2">
                  <img src="${hoveredRegion.icon || ''}" class="w-8 h-8 min-w-8 rounded-lg" alt="">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-Gray-900">${hoveredRegion.name}</span>
                    <span class="text-xs text-Gray-600">${hoveredRegion.developer || ''}</span>
                  </div>
                </div>
              </div>
            `;

            tooltipEl.style.display = 'block';

            const tw = tooltipEl.offsetWidth;
            const th = tooltipEl.offsetHeight;
            let left = hoveredRegion.cx - tw / 2;
            let top = hoveredRegion.y1 - th - 10;

            left = Math.max(8, Math.min(left, chart.canvas.width - tw - 8));
            if (top < 0) top = hoveredRegion.y2 + 10;

            tooltipEl.style.left = `${left}px`;
            tooltipEl.style.top = `${top}px`;
          } else {
            tooltipEl.style.display = 'none';
          }
        }
      },

      afterEvent(chart, args) {
        const state = chart._appsTimeline;
        if (!state || !state.hitRegions || !chart.chartArea) return;

        const { event } = args;
        if (!event.x || !event.y) {
          if (state.hoveredApp) {
            state.hoveredApp = null;
            args.changed = true;
          }
          return;
        }

        let found = null;
        for (const region of state.hitRegions) {
          if (event.x >= region.x1 && event.x <= region.x2 &&
              event.y >= region.y1 && event.y <= region.y2) {
            found = region;
            break;
          }
        }

        const prevHovered = state.hoveredApp;
        state.hoveredApp = found;

        if (found !== prevHovered) {
          args.changed = true;
        }
      }
    };
  }

  _createCustomLegend(chart, wrapper) {
    const existingLegend = wrapper.querySelector('.custom-legend');
    if (existingLegend) existingLegend.remove();

    const legendContainer = document.createElement('div');
    legendContainer.className = 'custom-legend mt-3';

    chart.data.datasets.forEach((dataset, index) => {
      const legendItem = this._createLegendItem(dataset, index, chart);
      legendContainer.appendChild(legendItem);
    });

    wrapper.appendChild(legendContainer);
  }

  _createLegendItem(dataset, index, chart) {
    const legendItem = document.createElement('button');
    legendItem.className = 'custom-legend-item';
    legendItem.setAttribute('data-index', index);

    const colorBox = document.createElement('span');
    colorBox.className = 'dot';
    colorBox.style.backgroundColor = dataset.borderColor;

    const label = document.createElement('span');
    label.textContent = dataset.label;

    legendItem.append(colorBox, label);
    legendItem.addEventListener('click', () => {
      const meta = chart.getDatasetMeta(index);
      meta.hidden = meta.hidden == null ? !chart.data.datasets[index].hidden : null;
      chart.update();
      legendItem.classList.toggle('opacity-50', meta.hidden);
    });

    return legendItem;
  }

  // Добавляет проценты приложений в легенду (справа)
  _addTimelinePercentages(wrapper, timelineData, images) {
    const legendContainer = wrapper.querySelector('.custom-legend');
    if (!legendContainer) return;

    // Удаляем старые проценты если есть
    const existing = legendContainer.querySelector('.apps-timeline-pct');
    if (existing) existing.remove();

    const totalEntries = timelineData.length;
    const appCounts = {};
    const appMeta = {};
    timelineData.forEach(entry => {
      appCounts[entry.appId] = (appCounts[entry.appId] || 0) + 1;
      if (!appMeta[entry.appId]) {
        appMeta[entry.appId] = { name: entry.name, icon: entry.icon };
      }
    });

    const sorted = Object.entries(appCounts)
      .map(([appId, count]) => ({ appId, count, pct: Math.round((count / totalEntries) * 100) }))
      .sort((a, b) => b.count - a.count);

    const pctContainer = document.createElement('div');
    pctContainer.className = 'apps-timeline-pct';
    pctContainer.style.cssText = 'display:flex;align-items:center;gap:12px;margin-left:auto;';

    sorted.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.style.cssText = 'display:flex;align-items:center;gap:4px;';

      const iconImg = document.createElement('img');
      iconImg.src = appMeta[item.appId].icon;
      iconImg.style.cssText = 'width:20px;height:20px;border-radius:5px;';
      iconImg.alt = appMeta[item.appId].name;

      const pctSpan = document.createElement('span');
      pctSpan.textContent = `${item.pct}%`;
      pctSpan.style.cssText = 'font-size:13px;font-weight:500;color:#364152;';

      itemEl.append(iconImg, pctSpan);
      pctContainer.appendChild(itemEl);
    });

    legendContainer.appendChild(pctContainer);
  }

  // Добавляем новый метод для создания маркеров изменений
  _addChangeMarkers(chart, wrapper, annotations) {
    const chartOverflow = wrapper.querySelector('.chart-overflow');

    // Создаем один общий тултип внутри chart-overflow
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip absolute bg-white shadow-md rounded-md hidden';
    tooltip.style.cssText = `
      position: absolute;
      z-index: 1001;
      min-width: 200px;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
    `;
    chartOverflow.appendChild(tooltip);

    // Добавляем маркеры в chart-overflow
    const markersContainer = document.createElement('div');
    markersContainer.className = 'chart-markers absolute inset-0';
    markersContainer.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: visible;
      z-index: 999;
      pointer-events: none;
    `;
    
    chartOverflow.appendChild(markersContainer);

    // Сортируем аннотации по времени
    const sortedAnnotations = [...annotations].sort((a, b) => {
      const [hoursA, minutesA] = a.time.split('.').map(Number);
      const [hoursB, minutesB] = b.time.split('.').map(Number);
      const timeA = hoursA * 60 + minutesA;
      const timeB = hoursB * 60 + minutesB;
      return timeA - timeB;
    });

    // Группируем аннотации, которые находятся близко друг к другу по времени
    const groups = [];
    let currentGroup = [sortedAnnotations[0]];

    for (let i = 1; i < sortedAnnotations.length; i++) {
      const current = sortedAnnotations[i];
      const prev = sortedAnnotations[i - 1];
      
      const [hoursCurr, minsCurr] = current.time.split('.').map(Number);
      const [hoursPrev, minsPrev] = prev.time.split('.').map(Number);
      
      const timeCurr = hoursCurr * 60 + minsCurr;
      const timePrev = hoursPrev * 60 + minsPrev;
      
      // Если разница во времени меньше 15 минут, добавляем в текущую группу
      if (Math.abs(timeCurr - timePrev) <= 15) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }
    groups.push(currentGroup);

    // Обрабатываем каждую группу
    groups.forEach(groupAnnotations => {
      const offset = 5; // расстояние между маркерами
      
      groupAnnotations.forEach((annotation, index) => {
        let horizontalOffset = 0;
        
        // Применяем смещение для всех маркеров в группе
        if (groupAnnotations.length > 1) {
          horizontalOffset = (index - (groupAnnotations.length - 1) / 2) * offset;
        }
        
        const marker = this._createMarker(chart, annotation, tooltip, {
          offsetX: horizontalOffset
        });
        
        if (marker) {
          markersContainer.appendChild(marker);
        }
      });
    });
  }

  _createMarker(chart, annotation, tooltip, { offsetX = 0 } = {}) {
    const marker = document.createElement('div');
    marker.className = 'chart-marker absolute';
    marker.style.cssText = `
      position: absolute;
      z-index: 1000;
      pointer-events: auto;
      cursor: pointer;
    `;
    
    const icon = document.createElement('img');
    icon.src = '../img/icons/icon-chart.svg';
    icon.className = 'w-6 min-w-6 min-h-6 h-6';
    marker.appendChild(icon);

    // Получаем wrapper из chart
    const wrapper = chart.canvas.closest('.chart-wrapper');
    const container = wrapper.querySelector('.chart-container');

    // Позиционирование маркера
    const xScale = chart.scales.x;
    let xPixel;
    
    if (annotation.time) {
      const labels = chart.data.labels;
      const [hours, minutes] = annotation.time.split('.').map(Number);
      
      // Находим индексы соседних часовых меток
      const currentHourIndex = labels.findIndex(label => {
        const [labelHours] = label.split('.').map(Number);
        return labelHours === hours;
      });
      
      const nextHourIndex = labels.findIndex(label => {
        const [labelHours] = label.split('.').map(Number);
        return labelHours === hours + 1;
      });

      if (currentHourIndex !== -1) {
        // Получаем координаты для текущего и следующего часа
        const currentPixel = xScale.getPixelForValue(currentHourIndex);
        const nextPixel = nextHourIndex !== -1 
          ? xScale.getPixelForValue(nextHourIndex)
          : xScale.getPixelForValue(currentHourIndex + 1);

        // Интерполируем позицию на основе минут
        const fraction = minutes / 60;
        xPixel = currentPixel + (nextPixel - currentPixel) * fraction;
      }
    } else if (annotation.xValue !== undefined) {
      xPixel = xScale.getPixelForValue(annotation.xValue);
    }

    if (xPixel === undefined) return null;

    const chartArea = chart.chartArea;
    const markerX = xPixel - 16 + offsetX;
    const markerY = chartArea.bottom - 16;

    marker.style.left = `${markerX}px`;
    marker.style.top = `${markerY}px`;

    // Обработчики событий
    const showTooltip = () => {
      // Полностью скрываем обычный тултип
      const customTooltip = wrapper.querySelector('.custom-tooltip');
      this._resetTooltipState(customTooltip, false);

      this._updateTooltipContent(tooltip, annotation);
      tooltip.classList.remove('hidden');
      
      const markerRect = marker.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const chartRect = chart.canvas.getBoundingClientRect();
      const overflow = wrapper.querySelector('.chart-overflow');
      
      // Всегда позиционируем тултип над маркером
      const x = markerRect.left - chartRect.left + (markerRect.width / 2) - (tooltipRect.width / 2);
      const y = markerRect.top - chartRect.top - tooltipRect.height - 8; // Всегда сверху

      // Проверяем горизонтальные границы
      const minX = 8;
      const maxX = chartRect.width - tooltipRect.width - 8;
      const finalX = Math.max(minX, Math.min(x, maxX));

      tooltip.style.transform = 'none';
      tooltip.style.left = `${finalX}px`;
      tooltip.style.top = `${y}px`;
    };

    const hideTooltip = () => {
      tooltip.classList.add('hidden');
      // Полностью восстанавливаем состояние обычного тултипа
      const customTooltip = wrapper.querySelector('.custom-tooltip');
      this._resetTooltipState(customTooltip, true);
    };

    marker.addEventListener('mouseenter', showTooltip);
    marker.addEventListener('mouseleave', hideTooltip);

    return marker;
  }

  _updateTooltipContent(tooltip, annotation) {
    const changeType = annotation.change.type;
    let valuePrefix = '$';
    
    // SVG иконка для старой цены
    const priceIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none" class="inline-block ml-1">
        <g clip-path="url(#clip0_1361_57932)">
          <path d="M10.8772 4.7325C11.6863 3.975 12.8305 2.76583 13.2888 1.6125C13.5013 1.07833 13.0747 0.5 12.4997 0.5H7.49967C6.92467 0.5 6.49801 1.0775 6.71051 1.6125C7.16884 2.76583 8.31301 3.975 9.12217 4.7325C4.64051 5.39833 0.833008 11.015 0.833008 15.5C0.833008 18.2575 3.07551 20.5 5.83301 20.5H14.1663C16.9238 20.5 19.1663 18.2575 19.1663 15.5C19.1663 11.015 15.3588 5.39833 10.8772 4.7325ZM8.86967 11.9675L11.4047 12.39C12.5222 12.5758 13.3338 13.5342 13.3338 14.6675C13.3338 16.0458 12.2122 17.1675 10.8338 17.1675V18.0008C10.8338 18.4608 10.4605 18.8342 10.0005 18.8342C9.54051 18.8342 9.16717 18.4608 9.16717 18.0008V17.1675H8.94384C8.05384 17.1675 7.22467 16.6892 6.77884 15.9183C6.54884 15.52 6.68467 15.0108 7.08301 14.78C7.47967 14.5492 7.99051 14.685 8.22134 15.0842C8.36967 15.3408 8.64717 15.5008 8.94384 15.5008H10.8338C11.293 15.5008 11.6672 15.1267 11.6672 14.6675C11.6672 14.3525 11.4413 14.0858 11.1305 14.0342L8.59551 13.6117C7.47801 13.4258 6.66634 12.4675 6.66634 11.3342C6.66634 9.95583 7.78801 8.83417 9.16634 8.83417V8.00083C9.16634 7.54083 9.53967 7.1675 9.99967 7.1675C10.4597 7.1675 10.833 7.54083 10.833 8.00083V8.83417H11.0563C11.9455 8.83417 12.7755 9.31333 13.2213 10.0842C13.4513 10.4825 13.3155 10.9917 12.9172 11.2225C12.5197 11.4533 12.0097 11.3175 11.7788 10.9183C11.6297 10.6608 11.353 10.5017 11.0563 10.5017H9.16634C8.70717 10.5017 8.33301 10.8758 8.33301 11.335C8.33301 11.65 8.55884 11.9167 8.86967 11.9683V11.9675Z" fill="#CDD5DF"/>
        </g>
        <defs>
          <clipPath id="clip0_1361_57932">
            <rect width="20" height="20" fill="white" transform="translate(0 0.5)"/>
          </clipPath>
        </defs>
      </svg>
    `;

    // Создаем аватар пользователя
    const userAvatar = annotation.user.avatar ? 
      `<img src="${annotation.user.avatar}" class="w-8 min-w-8 min-h-8 h-8 rounded-full" alt="${annotation.user.name}">` :
      `<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <span class="text-Gray-900 text-xs font-bold">${annotation.user.name.split(' ').map(n => n[0]).join('')}</span>
      </div>`;

    const oldValue = `${valuePrefix}${annotation.oldValue}`;
    const newValue = `${valuePrefix}${annotation.newValue}`;
    const isIncrease = parseFloat(annotation.newValue) >= parseFloat(annotation.oldValue);
    const changeColor = isIncrease ? 'price-up' : 'price-down';

    tooltip.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between bg-Gray-100 p-2">
          <span class="text-sm text-Gray-700">${annotation.time}</span>
        </div>
        <div class="flex items-center gap-2 px-2">
          <div class="flex items-center">
            <span class="text-sm font-semibold text-Gray-900 inline-flex items-center gap-2">${changeType === 'budget' ? priceIcon : ''}${oldValue}</span>
            <span class="mx-2 text-Gray-500 font-bold"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
              <path d="M11.9348 6.84337C11.9996 6.67929 12.0166 6.49875 11.9835 6.32457C11.9504 6.15039 11.8687 5.99041 11.7487 5.86487L8.31995 2.27406C8.24088 2.18832 8.14629 2.11993 8.04171 2.07288C7.93713 2.02583 7.82465 2.00107 7.71083 2.00003C7.59701 1.999 7.48414 2.02171 7.37879 2.06685C7.27344 2.11199 7.17774 2.17864 7.09725 2.26293C7.01677 2.34722 6.95312 2.44745 6.91002 2.55777C6.86692 2.6681 6.84523 2.78631 6.84622 2.9055C6.84721 3.0247 6.87085 3.1425 6.91578 3.25202C6.9607 3.36154 7.02601 3.4606 7.10788 3.54341L9.07429 5.60274H0.857197C0.629854 5.60274 0.411823 5.69732 0.251067 5.86568C0.0903117 6.03403 0 6.26236 0 6.50045C0 6.73853 0.0903117 6.96687 0.251067 7.13522C0.411823 7.30357 0.629854 7.39815 0.857197 7.39815H9.07429L7.10874 9.45659C7.02686 9.5394 6.96156 9.63846 6.91664 9.74798C6.87171 9.8575 6.84806 9.9753 6.84707 10.0945C6.84609 10.2137 6.86777 10.3319 6.91088 10.4422C6.95398 10.5526 7.01763 10.6528 7.09811 10.7371C7.1786 10.8214 7.2743 10.888 7.37965 10.9332C7.485 10.9783 7.59787 11.001 7.71169 11C7.82551 10.9989 7.93799 10.9742 8.04257 10.9271C8.14715 10.8801 8.24174 10.8117 8.32081 10.7259L11.7496 7.13513C11.829 7.05155 11.8919 6.95241 11.9348 6.84337Z" fill="#CDD5DF"/>
            </svg></span>
            <span class="text-sm font-semibold ${changeColor}">${newValue}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 px-2 pb-2">
          ${userAvatar}
          <div class="flex flex-col">
            <span class="text-sm font-medium text-Gray-900">${annotation.user.name}</span>
            <span class="text-xs text-Gray-600">${annotation.user.email}</span>
          </div>
        </div>
      </div>
    `;
  }
}

/**********************************************
 * Упрощённый менеджер графиков (без тултипов и легенд)
 **********************************************/
class SimpleChartManager extends BaseChartManager {
  createChart({ id, canvasId, type = "line", data = {}, options: chartOptions = {}, jsonConfig = null, dashedSegments = [] }) {
    if (this.charts[id]) {
      console.warn(`График с ID "${id}" уже существует.`);
      return this.charts[id];
    }

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas с ID "${canvasId}" не найден.`);
      return null;
    }

    const chartWrapper = this._createChartWrapper(canvasId, type, true);
    if (!chartWrapper) return null;

    if (jsonConfig) {
      const parsed = this._parseJsonConfig(jsonConfig, data, chartOptions, dashedSegments);
      if (!parsed) return null;
      ({ data, options: chartOptions, dashedSegments } = parsed);
    }

    const ctx = canvas.getContext("2d");
    this.applyDashedSegments(data, dashedSegments);
    const chartConfig = this.getChartConfig(type, data, chartOptions);
    const chart = new Chart(ctx, chartConfig);
    this.charts[id] = chart;
    return chart;
  }

  getChartConfig(type, data, options) {
    return {
      type,
      data: data || { labels: [], datasets: [] },
      options: {
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        elements: {
          point: {
            radius: 0,
            hoverRadius: 0,
            hitRadius: 0,
            borderWidth: 0,
            backgroundColor: 'transparent'
          },
          line: {
            tension: 0.1,
            borderWidth: 2,
            capBezierPoints: true
          }
        },
        hover: {
          mode: null,
          intersect: false
        },
        scales: {
          x: {
            display: false,
            grid: { display: false, drawBorder: false, color: 'rgba(0, 0, 0, 0.1)', },
          },
          y: {
            display: false,
            grid: { display: false, drawBorder: false, color: 'red',},
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                }
                if (value >= 1000) {
                  return (value / 1000).toFixed(0) + 'k';
                }
                return value;
              }
            },
            beginAtZero: true,
            suggestedMax: function(context) {
              const values = context.chart.data.datasets[0].data;
              const max = Math.max(...values.filter(v => v !== null));
              return max * 1.1;
            }
          }
        },
        maintainAspectRatio: false,
        responsive: true
      }
    };
  }
}

// Инициализация графиков
window.initCharts = () => {
  Object.values(chartConfigs).forEach(config => {
    // Создаем основной график
    initChart({ 
      id: config.id,
      canvasId: `chart-${config.id}`,
      data: config.data
    });

    // Создаем его simple версию
    initChart({ 
      id: `simple-${config.id}`,
      simple: true,
      canvasId: `simpleСhart-${config.id}`,
      originalChartId: config.id
    });
  });
};

// Упрощенная функция создания одного графика
window.initChart = (options = {}) => {
  const manager = options.simple ? new SimpleChartManager() : new ChartManager();
  const config = options.simple ? chartConfigs[options.originalChartId] : chartConfigs[options.id];
  
  return manager.createChart({
    id: options.id,
    canvasId: options.canvasId,
    type: options.type || "line",
    data: options.data || config?.data,
    options: { tooltip: true, ...options.chartOptions }
  });
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', window.initCharts);
