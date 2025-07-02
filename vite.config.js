// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
export default defineConfig({
build: {
rollupOptions: {
input: {
main: resolve(__dirname, 'index.html'),
student: resolve(__dirname, 'studentPage.html'),
teacher: resolve(__dirname, 'teacherPage.html'),
admin :  resolve(__dirname, 'adminPage.html'),
evalmake :  resolve(__dirname, 'evalmakePage.html'),
eval :  resolve(__dirname, 'evaluationPage.html'),


},
},
},
})