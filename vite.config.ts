import { defineConfig } from 'vite';
export default defineConfig({base:'./',server:{host:'0.0.0.0',port:5232,strictPort:true},preview:{host:'0.0.0.0',port:4232,strictPort:true},build:{target:'es2022'}});
