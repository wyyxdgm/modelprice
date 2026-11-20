// 最小 fake DOM —— 让 index.html 里的应用脚本能在 node 里跑起来做回归测试。
// 注意：innerHTML setter 必须清空 children，否则反复 render 会让 children 无限增长（曾导致测试跑不动）。
function CE(tag){
  return {tagName:(tag||'div').toUpperCase(), children:[], style:{}, dataset:{}, attrs:{},
    value:'',   // 真实 <input>/<textarea> 的 value 永远是字符串，测试里不能是 undefined
    classList:{add(){},remove(){},toggle(){},contains(){return false}},
    set textContent(v){this._t=v}, get textContent(){return this._t||''},
    set innerHTML(v){this._h=v; this.children.length=0}, get innerHTML(){return this._h||''},
    appendChild(c){this.children.push(c);return c},
    setAttribute(k,v){this.attrs[k]=v}, getAttribute(k){return this.attrs[k]},
    addEventListener(){}, removeEventListener(){}, closest(){return null},
    getBoundingClientRect(){return {left:0,top:0,width:900,height:430}},
    setPointerCapture(){}, releasePointerCapture(){}, click(){}, focus(){},
    querySelectorAll(){return []}, querySelector(){return CE('div')}};
}
const store={};
global.document={
  getElementById(id){ return store[id] || (store[id]=CE('div')); },
  querySelector(sel){ const k='q'+sel; return store[k] || (store[k]=CE('div')); },
  querySelectorAll(){ return []; },
  createElement(t){ return CE(t); },
  createElementNS(ns,t){ return CE(t); }
};
global.navigator={clipboard:null};
global.location={search:'',origin:'http://x',pathname:'/'};
global.Blob=class{constructor(p,o){this.p=p}};
global.URL={createObjectURL:()=>'blob:x',revokeObjectURL(){}};
global.alert=()=>{}; global.prompt=()=>'';
module.exports={store,CE};
