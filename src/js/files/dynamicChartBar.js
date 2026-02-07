import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Регистрируем все компоненты Chart.js и плагин DataLabels
Chart.register(...registerables, ChartDataLabels);

/* ==== Плагин для закруглённых углов столбиков ==== */
Chart.register({
  id: 'roundedBar',
  beforeDatasetsDraw(chart) {
    const { ctx } = chart;
    const radius = 10;

    function drawRoundedBar(x, y, width, base) {
      ctx.beginPath();
      ctx.moveTo(x - width / 2, base);
      ctx.lineTo(x - width / 2, y + radius);
      ctx.quadraticCurveTo(x - width / 2, y, x - width / 2 + radius, y);
      ctx.lineTo(x + width / 2 - radius, y);
      ctx.quadraticCurveTo(x + width / 2, y, x + width / 2, y + radius);
      ctx.lineTo(x + width / 2, base);
      ctx.closePath();
    }

    chart.data.datasets.forEach((dataset, index) => {
      const meta = chart.getDatasetMeta(index);
      if (!meta.hidden) {
        ctx.save();
        ctx.fillStyle = dataset.backgroundColor;
        meta.data.forEach(bar => {
          const { x, y, base, width } = bar;
          drawRoundedBar(x, y, width, base);
          ctx.fill();
        });
        ctx.restore();
      }
    });
  },
});

/* ==== Плагин для горизонтальных полос внутри столбиков (только label="Today") ==== */
Chart.register({
  id: 'horizontalLinesInsideBars',
  beforeDatasetsDraw(chart) {
    const { ctx } = chart;
    const spacing = 10; // Расстояние между полосами

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.label === "Today") {
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((bar) => {
          const { x, y, base, width } = bar;

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;

          for (let posY = y + spacing; posY < base; posY += spacing) {
            ctx.beginPath();
            ctx.moveTo(x - width / 2, posY);
            ctx.lineTo(x + width / 2, posY);
            ctx.stroke();
          }

          ctx.restore();
        });
      }
    });
  },
});

Chart.defaults.font.family = 'Inter';

/**********************************************
 * Класс для создания одного бар-чарта
 **********************************************/
class DynamicBarChart {
  /**
   * @param {string} canvasId - ID <canvas>, где рисовать
   * @param {object} originalData - объект { labels: [...], datasets: [...] }
   */
  constructor(canvasId, originalData) {
    this.canvasId = canvasId;
    this.canvasEl = document.getElementById(canvasId);

    if (!this.canvasEl) {
      console.error(`Canvas with id "${canvasId}" not found.`);
      return;
    }

    // 1) Создаём оболочку вокруг canvas:
    this._createWrappers();

    // 2) Готовим и проверяем данные
    this.data = this._prepareDataForChart(originalData);
    if (!this.data) {
      console.error('Invalid chart data, chart will not be created.');
      return;
    }

    // 3) Инициализируем сам Chart.js
    const ctx = this.canvasEl.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.data,
      options: this._getChartOptions(),
    });

    // 4) Рисуем кастомную легенду
    this._renderCustomLegend();
  }

  /*******************************************
   * Собираем DOM-структуру вида:
   *
   * <div class="chart-wrapper chart-wrapper--{canvasId} chart-wrapper--bar">
   *   <div class="chart-overflow chart-overflow--{canvasId} chart-overflow--bar">
   *     <div class="chart-inner chart-inner--scrollable chart-inner--{canvasId} chart-inner--bar">
   *       <canvas id="{canvasId}"></canvas>
   *     </div>
   *     <!-- Сюда добавим легенду -->
   *     <div id="{canvasId}-legend" class="custom-legend"></div>
   *   </div>
   * </div>
   *******************************************/
  _createWrappers() {
    // chart-wrapper
    const chartWrapper = document.createElement('div');
    chartWrapper.classList.add('chart-wrapper', `chart-wrapper--${this.canvasId}`, 'chart-wrapper--bar');

    // chart-overflow
    const chartOverflow = document.createElement('div');
    chartOverflow.classList.add('chart-overflow', `chart-overflow--${this.canvasId}`, 'chart-overflow--bar');

    // chart-inner
    const chartInner = document.createElement('div');
    chartInner.classList.add('chart-inner', 'chart-inner--scrollable', `chart-inner--${this.canvasId}`, 'chart-inner--bar');

    // Исходный родитель canvas
    const parent = this.canvasEl.parentNode;
    // Заменяем canvas на chartWrapper
    parent.replaceChild(chartWrapper, this.canvasEl);

    // Вкладываем chartOverflow внутрь chartWrapper
    chartWrapper.appendChild(chartOverflow);
    // chartInner внутрь chartOverflow
    chartOverflow.appendChild(chartInner);
    // сам canvas внутрь chartInner
    chartInner.appendChild(this.canvasEl);

    // И (!) делаем заготовку для легенды сразу же, чтобы она существовала
    const legendContainer = document.createElement('div');
    legendContainer.id = `${this.canvasId}-legend`;
    legendContainer.classList.add('custom-legend');
    // Вставим легенду в chartOverflow (после chart-inner)
    chartWrapper.appendChild(legendContainer);
  }

  /*******************************************
   * Метод для динамического обновления данных
   *******************************************/
  updateData(newData) {
    const prepared = this._prepareDataForChart(newData);
    if (!prepared) {
      console.warn('Invalid data provided for update');
      return;
    }

    const animation = {
      duration: 800,
      easing: 'easeInOutQuart'
    };

    this.chart.data = prepared;
    this.chart.options = this._getChartOptions();
    this.chart.update(animation);
    this._renderCustomLegend();
  }

  /*******************************************
   * Подготовка данных + копирование
   *******************************************/
  _prepareDataForChart(originalData) {
    if (!this._validateChartData(originalData)) return null;

    // Копия labels и datasets
    const dataCopy = {
      labels: [...originalData.labels],
      datasets: originalData.datasets.map((ds) => ({
        ...ds,
        data: [...ds.data],
      })),
    };

    // Если dataset data > labels, доращиваем labels
    const maxLength = dataCopy.datasets.reduce(
      (acc, ds) => Math.max(acc, ds.data.length),
      dataCopy.labels.length
    );
    if (dataCopy.labels.length < maxLength) {
      for (let i = dataCopy.labels.length; i < maxLength; i++) {
        dataCopy.labels.push(`Company name ${i + 1}`);
      }
    }
    return dataCopy;
  }

  /*******************************************
   * Валидируем структуру
   *******************************************/
  _validateChartData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.labels) || !Array.isArray(data.datasets)) return false;

    for (const ds of data.datasets) {
      if (!Array.isArray(ds.data) || !ds.label || !ds.backgroundColor) {
        return false;
      }
    }
    return true;
  }

  /*******************************************
   * Опции Chart.js
   *******************************************/
  _getChartOptions() {
    const isMobile = window.innerWidth < 768;
    const maxValue = Math.max(...this.data.datasets.flatMap(ds => ds.data));
  
    return {
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          left: 0,
          right: 10,
          bottom: 10,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: (context) => this._renderCustomTooltip(context),
        },
        datalabels: {
          display: true, // Включаем отображение
          align: 'top',
          anchor: 'end',
          color: '#121926',
          font: {
            size: isMobile ? 10 : 14,
            weight: 'bold',
          },
          formatter: (value) => value, // Если нужно, форматируем значения
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            callback: function (value) {
              const label = this.getLabelForValue(value) || '';
              const maxLength = 10;
              const words = label.split(' ');
              const lines = [];
              let currentLine = '';
  
              for (const word of words) {
                if ((currentLine + word).length > maxLength) {
                  lines.push(currentLine);
                  currentLine = word + ' ';
                } else {
                  currentLine += word + ' ';
                }
              }
              if (currentLine) lines.push(currentLine.trim());
              return lines;
            },
            font: { size: 12 },
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValue * 1.15,
          grid: {
            color: '#ECEEF4',
            lineWidth: 1,
          },
          ticks: {
            padding: 10,
            color: '#9aa4b2',
            font: {
              size: 14,
              weight: '500',
            },
          },
        },
      },
    };
  }  

  /*******************************************
   * Кастомный тултип
   *******************************************/
  _renderCustomTooltip(context) {
    const tooltipId = `tooltip-${this.canvasId}`;
    let tooltipEl = document.getElementById(tooltipId);
    
    const chartOverflow = document.querySelector(`.chart-overflow--${this.canvasId}`);
    if (!chartOverflow) return;
    
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = tooltipId;
      tooltipEl.classList.add('tooltip-custom', `tooltip-custom--${this.canvasId}`);
      chartOverflow.appendChild(tooltipEl);
    }
  
    const tooltipModel = context.tooltip;
  
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      tooltipEl.style.pointerEvents = 'none';
      return;
    }
  
    // Форматирование данных
    const title = tooltipModel.title?.[0] || '';
    const lines = tooltipModel.dataPoints?.map(point => {
      try {
        const dataset = this.chart.data.datasets[point.datasetIndex];
        if (!dataset) return '';

        return `<div class="tooltip-line">
          <span class="tooltip-label">${dataset.label}</span>
          <span class="tooltip-value">${point.formattedValue}</span>
        </div>`;
      } catch (error) {
        console.warn('Error formatting tooltip line:', error);
        return '';
      }
    }).filter(line => line).join('');
  
    tooltipEl.innerHTML = `
      <div class="tooltip-header">${title}</div>
      <div class="tooltip-body">${lines}</div>
    `;
  
    // Позиционирование
    try {
      tooltipEl.style.opacity = 1;
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.pointerEvents = 'none';
      
      // Получаем размеры тултипа
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const chartRect = chartOverflow.getBoundingClientRect();
      
      // Вычисляем позицию
      let left = tooltipModel.caretX - (tooltipRect.width / 2);
      let top = tooltipModel.caretY - tooltipRect.height - 8;

      // Проверяем и корректируем позицию по горизонтали
      if (left < 0) {
        left = 5;
      } else if (left + tooltipRect.width > chartRect.width) {
        left = chartRect.width - tooltipRect.width - 5;
      }

      // Проверяем и корректируем позицию по вертикали
      if (top < 0) {
        // Если не помещается сверху, показываем снизу от точки
        top = tooltipModel.caretY + 8;
      }

      tooltipEl.style.transform = 'translate3d(0, 0, 0)';
      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    } catch (error) {
      console.warn('Error positioning tooltip:', error);
      tooltipEl.style.opacity = 0;
    }
  }
  

  /*******************************************
   * Кастомная легенда
   *******************************************/
  _renderCustomLegend() {
    // Ищем контейнер легенды, уже созданный в _createWrappers()
    const legendId = `${this.canvasId}-legend`;
    const legendContainer = document.getElementById(legendId);
    if (!legendContainer) {
      // Если по какой-то причине нет - выходим
      console.warn(`Legend container #${legendId} not found.`);
      return;
    }

    // Очищаем, а затем наполняем
    legendContainer.innerHTML = '';

    this.chart.data.datasets.forEach((dataset, index) => {
      const legendItem = document.createElement('div');
      legendItem.classList.add('custom-legend-item');
      legendItem.innerHTML = `
        <span class="dot" style="background-color: ${dataset.backgroundColor};"></span>
        ${dataset.label}
      `;
      legendItem.addEventListener('click', () => {
        const meta = this.chart.getDatasetMeta(index);
        meta.hidden = !meta.hidden;
        this.chart.update();
        legendItem.classList.toggle('active');
      });
      legendContainer.appendChild(legendItem);
    });
  }
}



/**********************************************
 * Пример использования:
 * Убедитесь, что в HTML есть <canvas id="example-chart"></canvas>
 **********************************************/
const exampleData = {
  labels: [
    'General - Low Popularity - USA',
    'General - Mid Popularity - USA',
    'Competitors',
    'General - High Popularity - USA',
  ],
  datasets: [
    {
      label: 'Today',
      data: [1215, 600, 1215, 1215, 1215, 1215],
      backgroundColor: '#00B4C7',
      borderRadius: 6,
    },
    {
      label: '22.04',
      data: [350, 2139, 2139, 2139, 2139, 2139],
      backgroundColor: '#C1F5FA',
      borderRadius: 6,
    },
  ],
};

new DynamicBarChart('example-chart', exampleData);
