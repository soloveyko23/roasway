// Підключення функціоналу "Чертоги Фрілансера"
import { isMobile } from "./functions.js";
// Підключення списку активних модулів
import { flsModules } from "./modules.js";


import 'flowbite';

/**********************************************
 * Глобальные настройки (шрифт)
 **********************************************/
// script.js

// Импортируем Chart.js и необходимые компоненты
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Регистрируем все компоненты Chart.js и плагин DataLabels
Chart.register(...registerables, ChartDataLabels);

// Устанавливаем шрифт по умолчанию
Chart.defaults.font.family = 'Inter';

// Импортируем ваши пользовательские модули
import ChartManager from './chart.js';
import HorizBarChart from './HorizBarChart.js';
import DynamicBarChart from './dynamicChartBar.js';
import RoaswayTable from './tableCustom.js';

// Виджет «Триалы по кампаниям» (Doughnut + таблица)
import CampaignTrialsChart from './campaignTrials.js';
import { campaignTrialsConfigs } from './campaignTrialsData.js';

// Инициализация виджетов «Триалы по кампаниям»
document.addEventListener('DOMContentLoaded', () => {
  // Находим все контейнеры [data-campaign-trials] и инициализируем
  Object.entries(campaignTrialsConfigs).forEach(([id, config]) => {
    const container = document.querySelector(`[data-campaign-trials="${id}"]`);
    if (container) {
      new CampaignTrialsChart(id, config);
    }
  });
});










