"use strict";
const DATA = JSON.parse(document.getElementById('DATA').textContent);
/* i18n：构建时按 locale 内联的字典（<script id="I18N">，与 DATA 同模式）。
   T(key) 查字典；缺失返回 key 本身并记入 I18N_MISSING（测试用它断言字典无缺失）。
   TF(key, vars) = 带占位符模板：字典值里写 {name}，vars.name 替换进去。 */
const I18N = JSON.parse((document.getElementById('I18N')||{textContent:'{}'}).textContent);
const I18N_MISSING=[];
const T = k => { const v=I18N[k]; if(v==null){ I18N_MISSING.push(k); return k; } return v; };
const TF = (k,vars) => T(k).replace(/\{(\w+)\}/g, (m,name)=> (vars&&vars[name]!=null)?vars[name]:m);
const LOCALE_TAG = I18N['meta.locale_tag'] || 'en-US';
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
const fmtN = v => v==null ? 'N/A' : v.toLocaleString(LOCALE_TAG);
const fmtR = (v,d=1) => v==null||!isFinite(v) ? '—' : v.toFixed(d);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

