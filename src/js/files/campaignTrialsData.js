/**
 * Конфигурация данных для виджета «Триалы по кампаниям»
 * Ключ = data-campaign-trials="" в HTML
 */
export const campaignTrialsConfigs = {
  'trials-income': {
    title: 'Триалы по кампаниям',
    campaigns: [
      {
        name: 'General - Low Popularity - USA',
        color: '#3F83F8',
        trials: 30,
        trialsDiff: 21,
        trialsPct: -1.07,
        price: '$32',
        priceDiff: '$9.74',
        pricePct: -1.07,
      },
      {
        name: 'General - Mid Popularity - USA',
        color: '#76A9FA',
        trials: 19,
        trialsDiff: 7,
        trialsPct: -1.07,
        price: '$53',
        priceDiff: '$9.74',
        pricePct: -1.07,
      },
      {
        name: 'Competitors',
        color: '#16BDCA',
        trials: 14,
        trialsDiff: -12,
        trialsPct: -1.07,
        price: '$12',
        priceDiff: '$9.74',
        pricePct: -1.07,
      },
      {
        name: 'General - High Popularity - USA',
        color: '#C3DDFD',
        trials: 7,
        trialsDiff: -3,
        trialsPct: -1.07,
        price: '$15',
        priceDiff: '$9.74',
        pricePct: -1.07,
      },
      {
        name: 'Test USA',
        color: '#E1EFFE',
        trials: 4,
        trialsDiff: 8,
        trialsPct: -1.07,
        price: '$32',
        priceDiff: '$9.74',
        pricePct: -1.07,
      },
    ]
  },
};
