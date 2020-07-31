const Q=(el,func)=>func? document.querySelectorAll(el).forEach(func):document.querySelector(el);
const cookie = key => document.cookie.split(/;\s?/).map( o => o.split('=') ).find( ([k,v]) => k == key );
