// tailwind.config.js
module.exports = {
  content: [
    './node_modules/flowbite/**/*.js', // добавляем путь к компонентам Flowbite
    './src/**/*.{html,js}',            // пути к твоим собственным шаблонам
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E1EFFE', // Equivalent to RGB(0.949, 0.980, 1)
          200: '#C3DDFD', // Equivalent to RGB(0.921, 0.945, 1)
          300: '#A4CAFE', // Equivalent to RGB(0.850, 0.898, 1)
          400: '#99bbff', // Equivalent to RGB(0.600, 0.729, 1)
          500: '#3F83F8', // Equivalent to RGB(0.368, 0.572, 1)
          600: '#1C64F2', // Equivalent to RGB(0.215, 0.466, 1)
          700: '#1A56DB', // Equivalent to RGB(0.176, 0.384, 0.819)
          800: '#193354', // Equivalent to RGB(0.149, 0.290, 0.588)
          900: '#', // Equivalent to RGB(0.098, 0.215, 0.458)
        },
        Primary: {
          100: '#F2F6FF', // Equivalent to RGB(0.949, 0.980, 1)
          200: '#EBF1FF', // Equivalent to RGB(0.921, 0.945, 1)
          300: '#D9E5FF', // Equivalent to RGB(0.850, 0.898, 1)
          400: '#99BAFF', // Equivalent to RGB(0.600, 0.729, 1)
          500: '#5E92FF', // Equivalent to RGB(0.368, 0.572, 1)
          600: '#3777FF', // Equivalent to RGB(0.215, 0.466, 1)
          700: '#2D62D1', // Equivalent to RGB(0.176, 0.384, 0.819)
          800: '#264A96', // Equivalent to RGB(0.149, 0.290, 0.588)
          900: '#193775', // Equivalent to RGB(0.098, 0.215, 0.458)
        },
        gray: {
          100: '#F6F8FC', // Equivalent to RGB(0.945, 0.952, 0.968)
          200: '#F1F3F7', // Equivalent to RGB(0.898, 0.909, 0.925)
          300: '#E3E8EF', // Equivalent to RGB(0.925, 0.933, 0.956)
          400: '#CDD5DF', // Equivalent to RGB(0.858, 0.886, 0.921)
          500: '#9AA4B2', // Equivalent to RGB(0.803, 0.835, 0.874)
          600: '#697586', // Equivalent to RGB(0.603, 0.643, 0.698)
          700: '#364152', // Equivalent to RGB(0.411, 0.458, 0.525)
          900: '#121926', // Equivalent to RGB(0.204, 0.212, 0.227)
        },
        Gray: {
          50: '#F9FBFF', // Equivalent to RGB(0.945, 0.952, 0.968)
          100: '#F5F7FC', // Equivalent to RGB(0.945, 0.952, 0.968)
          200: '#F1F3F9', // Equivalent to RGB(0.898, 0.909, 0.925)
          300: '#ECEEF4', // Equivalent to RGB(0.925, 0.933, 0.956)
          400: '#DBE2EB', // Equivalent to RGB(0.858, 0.886, 0.921)
          500: '#CDD5DF', // Equivalent to RGB(0.803, 0.835, 0.874)
          600: '#9AA4B2',
          700: '#697586', // Equivalent to RGB(0.603, 0.643, 0.698)
          800: '#364152', // Equivalent to RGB(0.411, 0.458, 0.525)
          900: '#121926', // Equivalent to RGB(0.204, 0.212, 0.227)
        },
      
        secondary: {
          100: '#e5f7f6', // Equivalent to RGB(0.898, 0.984, 0.968)
          200: '#bbf5f5', // Equivalent to RGB(0.898, 0.984, 0.968)
          300: '#92eceb', // Equivalent to RGB(0.823, 0.976, 0.949)
          400: '#6fcbca', // Equivalent to RGB(0.439, 0.878, 0.800)
          500: '#15d0cc', // Equivalent to RGB(0.082, 0.819, 0.682)
          600: '#35a5aa', // Equivalent to RGB(0.133, 0.760, 0.688)
          700: '#228589', // Equivalent to RGB(0, 0.662, 0.521)
        },
        secondaryTwo: {
          100: '#F2FDFB', // Equivalent to RGB(0.898, 0.984, 0.968)
          200: '#E5FBF7', // Equivalent to RGB(0.898, 0.984, 0.968)
          300: '#D2F9F2', // Equivalent to RGB(0.823, 0.976, 0.949)
          400: '#70E0CC', // Equivalent to RGB(0.439, 0.878, 0.800)
          500: '#15D1AE', // Equivalent to RGB(0.082, 0.819, 0.682)
          600: '#00C29E', // Equivalent to RGB(0.133, 0.760, 0.688)
          700: '#00A985',
          800: '#00805E', // Equivalent to RGB(0, 0.662, 0.521)
          900: '#005942'
        },
        secondaryThree: {
          100: '#FFFBF5', // Equivalent to RGB(0.898, 0.984, 0.968)
          200: '#FEF7EC', // Equivalent to RGB(0.898, 0.984, 0.968)
          300: '#FEF3E1', // Equivalent to RGB(0.823, 0.976, 0.949)
          400: '#FEEAC8', // Equivalent to RGB(0.439, 0.878, 0.800)
          500: '#FAE0B9', // Equivalent to RGB(0.082, 0.819, 0.682)
          600: '#ECCD9E', // Equivalent to RGB(0.133, 0.760, 0.688)
          700: '#D1B891',
          800: '#AB926D', // Equivalent to RGB(0, 0.662, 0.521)
          900: '#806B4D'
        },
        systemRed: {
          200: '#FDF2F2', // Equivalent to RGB(0.898, 0.984, 0.968)
          300: '#FDE8E8', // Equivalent to RGB(0.823, 0.976, 0.949)
          400: '#F8B4B4', // Equivalent to RGB(0.439, 0.878, 0.800)
          500: '#EB5050', // Equivalent to RGB(0.082, 0.819, 0.682)
          600: '#C81E1E', // Equivalent to RGB(0.133, 0.760, 0.688)
          700: '#B51818',
          800: '#991414', // Equivalent to RGB(0, 0.662, 0.521)
          900: '#801111'
        },
        teal: {
          400: '#16BDCA'
        }
      },
      container: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1563px',
      },
      boxShadow: {
        customMd: '13px 0px 19px 0px #364152',
        custom: '0px 1px 2px -1px rgba(0, 0, 0, 0.1), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        sm: '0px 1px 2px rgba(0, 0, 0, 0.08)',
        md: '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.05)',
      },
      dropShadow: {
        sm: '0px 1px 2px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        '0': '0px',
        'px': '1px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
      },
      maxWidth: {
        'xs': '320px',
        'sm': '384px',
        'md': '448px',
        'lg': '512px',
        'xl': '576px',
        '2xl': '672px',
        '3xl': '768px',
        '4xl': '896px',
        '5xl': '1024px',
        '6xl': '1152px',
        '7xl': '1280px',
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '9999px',
      },
    },
  },
  plugins: [
    require('flowbite/plugin')({
      charts: true,
  }),
  ],
};
