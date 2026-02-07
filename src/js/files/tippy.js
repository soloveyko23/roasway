// Підключення функціоналу "Чертоги Фрілансера"
import { isMobile, FLS } from "./functions.js";
// Підключення списку активних модулів
import { flsModules } from "./modules.js";

// Підключення з node_modules
import tippy from 'tippy.js';

// Підключення стилів з src/scss/libs
import "../../scss/libs/tippy.scss";
// Підключення стилів з node_modules
//import 'tippy.js/dist/tippy.css';

// Запускаємо та додаємо в об'єкт модулів
tippy('[data-tippy-small]', {
  arrow: true,
  content(reference) {
    return reference.getAttribute('data-tippy-content');
  },
  theme: 'small',
  animation: 'shift-away',
  allowHTML: true
});


tippy('[data-tippy-medium]', {
  content(reference) {
    const contentId = reference.getAttribute('data-tippy-medium');
    const contentElement = document.querySelector(`#tooltip-contents #${contentId}`);
    return contentElement ? contentElement.innerHTML : 'Контент не найден';
  },
  theme: 'small',
  animation: 'shift-away',
  allowHTML: true,
  maxWidth: 400,
});
