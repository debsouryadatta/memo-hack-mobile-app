const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      path.join(__dirname, './app/**/*.{js,jsx,ts,tsx}'),
      path.join(__dirname, './components/**/*.{js,jsx,ts,tsx}'),
    ],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {},
    },
    plugins: [],
  }