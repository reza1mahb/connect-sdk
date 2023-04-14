const fs = require('fs')
const path = require('path')

fs.rename(path.join(__dirname, 'dist', 'index.ts.js'), path.join(__dirname, 'dist', 'index.js'), function () {
  console.log('CLEAN-UP: Web')
})
fs.rename(path.join(__dirname, 'dist', 'native.ts.js'), path.join(__dirname, 'dist', 'native.js'), function () {
  console.log('CLEAN-UP: Native')
})
fs.rename(path.join(__dirname, 'dist', 'lite.ts.js'), path.join(__dirname, 'dist', 'lite.js'), function () {
  console.log('CLEAN-UP: Lite')
})
