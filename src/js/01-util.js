"use strict";
const DATA = JSON.parse(document.getElementById('DATA').textContent);
const F = DATA.fields, IX = {}; F.forEach((k,i)=>IX[k]=i);
const $ = s => document.querySelector(s);
const el = (t,c,h)=>{const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e;};
const fmt$ = v => {
  if(v==null) return 'N/A';
  const a=Math.abs(v);
  if(a===0) return '$0';
  if(a<0.0001) return '$'+v.toExponential(1);
  if(a<0.01)   return '$'+v.toPrecision(2).replace(/0+$/,'').replace(/\.$/,'');
  if(a<1)      return '$'+v.toFixed(3).replace(/0$/,'').replace(/\.$/,'');
  if(a<10)     return '$'+v.toFixed(2);
  return '$'+v.toFixed(a<100?1:0);
};
const fmtN = v => v==null ? 'N/A' : v.toLocaleString('en-US');
const fmtR = (v,d=1) => v==null||!isFinite(v) ? '—' : v.toFixed(d);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

