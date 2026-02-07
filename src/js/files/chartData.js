
export const chartConfigs = {
  clickability: {
    id: 'clickability',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Сегодня",
          "data": [7844, 8699, 10259, 10963, 12395, 9993, 10192, 10632, 11999, 14935, 11467, 10155, 10521, 11684, 11851, 12718, 14085, 13952, 13901, null, null, null, null, null],
          "borderColor": "#3777FF",
          "borderWidth": 2,
          "tension": 0.4,
          "datalabels": { "display": false },
          "dashedSegments": [
            { "start": 3, "end": 5, "color": "#FF0000", "dash": [10, 5] },
            { "start": 8, "end": 10, "color": "#00FF00", "dash": [10, 5] },
            { "start": 12, "end": 15, "color": "#FFA500", "dash": [2, 2] }
          ]
        },
        {
          "label": "22.12",
          "data": [2701, 4032, 9266, 10492, 11852, 11985, 8907, 10499, 13028, 16995, 17229, 15266, 16966, 15369, 10369, 12136, 10995, 10862, 7596, 11762, 13197, 12511, 9910, 8913],
          "borderColor": "#99BAFF",
          "borderWidth": 2,
          "tension": 0.4,
          "borderDash": [5, 5],
          "datalabels": { "display": false },
          "dashedSegments": [
            { "start": 2, "end": 4, "color": "#FF0000", "dash": [0, 0] },
            { "start": 7, "end": 9, "color": "#00FF00", "dash": [0, 0] }
          ]
        }
      ]
    }
  },
  
  installs: {
    id: 'installs',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Сегодня",
          "data": [7844, 5699, 10259, 10963, 12395, 1993, 5192, 10632, 180999, 14935, 11467, 10155, 10521, 11684, 11851, 12718, 14085, 13952, 13901, null, null, null, null, null],
          "borderColor": "#3777FF",
          "borderWidth": 2,
          "tension": 0.4,
          "datalabels": { "display": false },
          "dashedSegments": []
        },
        {
          "label": "22.12",
          "data": [2701, 4032, 9266, 10492, 11852, 11985, 8907, 10499, 13028, 16995, 17229, 15266, 16966, 15369, 10369, 12136, 10995, 10862, 7596, 11762, 13197, 12511, 9910, 8913],
          "borderColor": "#99BAFF",
          "borderWidth": 2,
          "tension": 0.4,
          "borderDash": [5, 5],
          "datalabels": { "display": false },
          "dashedSegments": []
        }
      ]
    }
  },
  
  income: {
    id: 'income',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Сегодня",
          "data": [0, 500, 1000, 1400, 1800, 5000, 4000, 3700, 3000, 5500, 5700, 5750, 15000, 15500, 14500, 14200, 13700, null, null, null, null, null, null, null],
          "borderColor": "#3777FF",
          "borderWidth": 2,
          "tension": 0.3,
          "datalabels": { "display": false },
          "dashedSegments": [
            { "start": 14, "end": 17, "color": "#DBE2EB", "dash": [0, 0] },
          ]
        },
        {
          "label": "15 апреля",
          "data": [1232, 950, 2050, 3900, 6100, 7800, 10200, 11800, 13200, 13900, 13600, 12800, 12300, 12100, 11600, 10900, 10400, 9800, 9200, 8600, 8100, 7500, 7200, 6800],
          "borderColor": "#99BAFF",
          "borderWidth": 2,
          "tension": 0.3,
          "borderDash": [10, 5],
          "datalabels": { "display": false },
          
        }
      ]
    },
    appsTimeline: [
      { time: "0.00",  appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 0:12" },
      { time: "1.00",  appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 1:05" },
      { time: "2.00",  appId: "wave-app",  name: "Rastreamento correios - pkge", icon: "../img/apps/icon-2.png", developer: "Vintex Corp", checkDate: "26 апреля, 2:18" },
      { time: "3.00",  appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 3:22" },
      { time: "4.00",  appId: "wave-app",  name: "Rastreamento correios - pkge", icon: "../img/apps/icon-2.png", developer: "Vintex Corp", checkDate: "26 апреля, 4:10" },
      { time: "5.00",  appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 5:33" },
      { time: "6.00",  appId: "tracker-app", name: "Fitness Tracker Pro", icon: "../img/apps/icon-3.png", developer: "HealthTech Inc", checkDate: "26 апреля, 6:45" },
      { time: "7.00",  appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 7:15" },
      { time: "8.00",  appId: "wave-app",  name: "Rastreamento correios - pkge", icon: "../img/apps/icon-2.png", developer: "Vintex Corp", checkDate: "26 апреля, 8:02" },
      { time: "9.00",  appId: "wave-app",  name: "Rastreamento correios - pkge", icon: "../img/apps/icon-2.png", developer: "Vintex Corp", checkDate: "26 апреля, 9:35" },
      { time: "10.00", appId: "wave-app",  name: "Rastreamento correios - pkge", icon: "../img/apps/icon-2.png", developer: "Vintex Corp", checkDate: "26 апреля, 10:48" },
      { time: "11.00", appId: "tracker-app", name: "Fitness Tracker Pro", icon: "../img/apps/icon-3.png", developer: "HealthTech Inc", checkDate: "26 апреля, 11:20" },
      { time: "12.00", appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 12:55" },
      { time: "14.00", appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 14:30" },
      { time: "15.00", appId: "tracker-app", name: "Fitness Tracker Pro", icon: "../img/apps/icon-3.png", developer: "HealthTech Inc", checkDate: "26 апреля, 15:10" },
      { time: "17.00", appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 17:42" },
      { time: "18.00", appId: "wave-app",  name: "Rastreamento correios - pkge", icon: "../img/apps/icon-2.png", developer: "Vintex Corp", checkDate: "26 апреля, 18:05" },
      { time: "19.00", appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 19:28" },
      { time: "20.00", appId: "tracker-app", name: "Fitness Tracker Pro", icon: "../img/apps/icon-3.png", developer: "HealthTech Inc", checkDate: "26 апреля, 20:15" },
      { time: "22.00", appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 22:50" },
      { time: "23.00", appId: "plant-app", name: "Plant Saver - Plant Identifier", icon: "../img/apps/icon.png", developer: "Internet Media", checkDate: "26 апреля, 23:37" },
    ],
    changes: {
      annotations: [
        {
          type: "point",
          time: "12.00",
          oldValue: 9.74,
          newValue: 7.35,
          change: {
            type: "bid_price",
            percentage: 10,
            direction: "decrease"
          },
          user: {
            name: "Dianne Russell",
            email: "jackson.graham@gmail.com",
            avatar: 'https://picsum.photos/200/300'
          },
          style: {
            backgroundColor: "#3777FF",
            borderColor: "#FFFFFF",
            borderWidth: 2,
            radius: 6
          }
        },
        {
          type: "point",
          time: "8.00",
          oldValue: 14.74,
          newValue: 7.35,
          change: {
            type: "budget",
            percentage: 15,
            direction: "decrease"
          },
          user: {
            name: "Dianne Russell",
            email: "jackson.graham@gmail.com",
            avatar: 'https://picsum.photos/200/300'
          },
          style: {
            backgroundColor: "#3777FF",
            borderColor: "#FFFFFF",
            borderWidth: 2,
            radius: 6
          }
        },
        {
          type: "point",
          time: "3.24",
          oldValue: 6.74,
          newValue: 13.35,
          change: {
            type: "budget",
            percentage: 15,
            direction: "decrease"
          },
          user: {
            name: "Dianne Russell",
            email: "jackson.graham@gmail.com",
            avatar: 'https://picsum.photos/200/300'
          },
          style: {
            backgroundColor: "#3777FF",
            borderColor: "#FFFFFF",
            borderWidth: 2,
            radius: 6
          }
        },
        {
          type: "point",
          time: "13.40",
          oldValue: 1000,
          newValue: 1500,
          change: {
            type: "budget",
            percentage: 50,
            direction: "increase"
          },
          user: {
            name: "Dianne Russell",
            email: "jackson.graham@gmail.com",
            avatar: null
          }
        },
        {
          type: "point",
          time: "18.00",
          oldValue: 1500,
          newValue: 100,
          change: {
            type: "budget",
            percentage: 50,
            direction: "increase"
          },
          user: {
            name: "Dianne Russell",
            email: "jackson.graham@gmail.com",
            avatar: null
          }
        }
      ]
    }
  },
  costs: {
    id: 'costs',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Расходы текущего дня",
          "data": [5200, 6100, 8200, 9100, 11500, 1500, 15500, 17500, 15800, 21500, 23500, 25500, 27500, 29500, 31500, 33500, 35500, 37500, 30500, 12500, 5200, null, null, null],
          "borderColor": "#FF5733",
          "borderWidth": 2,
          "tension": 0.3,
          "datalabels": { "display": false },
        },
        {
          "label": "Расходы прошлого дня",
          "data": [3200, 4200, 7200, 8200, 10200, 8200, 1200, 16200, 1200, 5000, 10500, 15150, 26500, 28500, 30500, 32500, 34500, 36500, 38500, 1300, 4227, null, null, null],
          "borderColor": "#33C1FF",
          "borderWidth": 2,
          "tension": 0.3,
          "borderDash": [10, 5],
          "datalabels": { "display": false },
        }
      ]
    }
  },
  installs2: {
    id: 'installs2',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Сегодня",
          "data": [7844, 5699, 10259, 10963, 12395, 1993, 5192, 10632, 18999, 14935, 11467, 10155, 10521, 11684, 11851, 12718, 14085, 13952, 13901, null, null, null, null, null],
          "borderColor": "#3777FF",
          "borderWidth": 2,
          "tension": 0.4,
          "datalabels": { "display": false },
          "dashedSegments": []
        },
        {
          "label": "22.12",
          "data": [2701, 4032, 9266, 10492, 11852, 11985, 8907, 10499, 13028, 16995, 17229, 15266, 16966, 15369, 10369, 12136, 10995, 10862, 7596, 11762, 13197, 12511, 9910, 8913],
          "borderColor": "#99BAFF",
          "borderWidth": 2,
          "tension": 0.4,
          "borderDash": [5, 5],
          "datalabels": { "display": false },
          "dashedSegments": []
        }
      ]
    }
  },
  income2: {
    id: 'income2',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Сегодня",
          "data": [7844, 5699, 6259, 7963, 8395, 1993, 5192, 10632, 18999, 14935, 11467, 10155, 10521, 11684, 11851, 12718, 14085, 13952, 13901, null, null, null, null, null],
          "borderColor": "#3777FF",
          "borderWidth": 2,
          "tension": 0.4,
          "datalabels": { "display": false },
          "dashedSegments": []
        },
        {
          "label": "22.12",
          "data": [2701, 4032, 9266, 5492, 1500, 11985, 8907, 10499, 13028, 16995, 17229, 15266, 16966, 15369, 10369, 12136, 10995, 10862, 7596, 11762, 13197, 12511, 9910, 8913],
          "borderColor": "#99BAFF",
          "borderWidth": 2,
          "tension": 0.4,
          "borderDash": [5, 5],
          "datalabels": { "display": false },
          "dashedSegments": []
        }
      ]
    }
  },
  incomeLast7: {
    id: 'incomeLast7',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Сегодня",
          "data": [7844, 5699, 6259, 7963, 8395, 1993, 5192, 10632, 18999, 14935, 11467, 10155, 10521, 11684, 11851, 12718, 14085, 13952, 13901, 12701, 14032, 19266, 15492, 15500],
          "borderColor": "#3777FF",
          "borderWidth": 2,
          "tension": 0.4,
          "datalabels": { "display": false },
          "dashedSegments": []
        },
        {
          "label": "22.12",
          "data": [12701, 14032, 19266, 15492, 1500, 11985, 8907, 10499, 13028, 16995, 17229, 15266, 16966, 15369, 10369, 12136, 10995, 10862, 7596, 11762, 13197, 12511, 9910, 8913],
          "borderColor": "#99BAFF",
          "borderWidth": 2,
          "tension": 0.4,
          "borderDash": [5, 5],
          "datalabels": { "display": false },
          "dashedSegments": []
        }
      ]
    }
  },
  incomeLast28: {
    id: 'incomeLast28',
    data: {
      "labels": [
        "00.00", "01.00", "02.00", "03.00", "04.00", "05.00", "06.00", "07.00",
        "08.00", "09.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00",
        "16.00", "17.00", "18.00", "19.00", "20.00", "21.00", "22.00", "23.00"
      ],
      "datasets": [
        {
          "label": "Сегодня",
          "data": [7844, 5699, 6259, 7963, 8395, 1993, 5192, 10632, 18999, 14935, 11467, 10155, 10521, 11684, 11851, 12718, 14085, 13952, 13901, 12701, 14032, 19266, 15492, 15500],
          "borderColor": "#3777FF",
          "borderWidth": 2,
          "tension": 0.4,
          "datalabels": { "display": false },
          "dashedSegments": []
        },
        {
          "label": "22.12",
          "data": [12701, 14032, 19266, 15492, 1500, 5985, 8907, 10499, 5028, 6995, 7229, 15266, 16966, 15369, 10369, 12136, 10995, 10862, 7596, 11762, 13197, 12511, 9910, 8913],
          "borderColor": "#99BAFF",
          "borderWidth": 2,
          "tension": 0.4,
          "borderDash": [5, 5],
          "datalabels": { "display": false },
          "dashedSegments": []
        }
      ]
    }
  },
}; 