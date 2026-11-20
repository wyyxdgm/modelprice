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
store['DATA']=CE('script'); store['DATA'].textContent="{\"captured\":\"2026-11-11\",\"scraped\":\"2026-11-14\",\"source\":\"arena.ai/leaderboard\",\"fields\":[\"n\",\"u\",\"lab\",\"lic\",\"r\",\"or\",\"s\",\"u95\",\"d95\",\"pre\",\"ae\",\"v\",\"c\",\"pin\",\"pout\",\"ctx\"],\"datasets\":{\"overall_os\":{\"label\":\"WebDev \u00b7 Overall\",\"path\":\"code/webdev\",\"license\":\"open-source\",\"meta\":\"997,838 votes \u00b7 63 open source models\",\"note\":\"All 63 open-source models\",\"total_claimed\":63,\"rows\":[[\"Kimi K3.1 Pro (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart\",null,\"Kimi K3.1 Pro License\",1,12,1687,10,10,false,false,4977,0.91,2.0,10.0,\"1M\"],[\"DeepSeek-V4.1-Flash-20261017 (Max)\",\"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017\",null,\"MIT\",2,18,1664,7,7,false,false,14108,0.12,0.15,0.6,\"1M\"],[\"Kimi K3 (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-quickstart\",null,\"Kimi K3 license\",3,19,1658,6,6,false,false,22448,1.74,3.0,15.0,\"1M\"],[\"Inkling 2 Small\",\"https://thinkingmachines.ai/news/inkling-2-small/\",\"Thinking Machines\",\"Apache 2.0\",4,23,1647,19,19,true,false,990,0.31,0.3,1.0,null],[\"MiMo-V2.6-Flash\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",5,25,1638,8,8,false,false,8944,0.05,0.14,0.28,\"1.1M\"],[\"Hy4 preview\",\"https://hy.tencent.ai/research/hy4-preview\",\"Tencent\",\"Apache 2.0\",6,26,1632,10,10,true,false,4601,0.35,0.83,2.5,\"1M\"],[\"MiMo-V2.6-Pro\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",7,28,1625,8,8,false,false,8846,0.1,0.43,0.87,\"1.1M\"],[\"Qwen3.8-Flash-Next\",\"https://qwen.ai/blog?id=qwen3.8-flash-next\",null,\"qwen-community-1.0\",8,29,1624,7,7,true,false,11380,0.18,0.16,0.47,\"1M\"],[\"GLM-5.3 (Max)\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",9,30,1622,7,7,false,false,12695,1.38,1.4,4.4,\"1M\"],[\"DeepSeek-V4.1-Flash-20260910 (Max)\",\"https://www.deepseek.com/en/news/deepseek-v4-1-flash/\",null,\"MIT\",10,31,1621,11,11,false,false,3402,0.06,0.3,1.2,\"1M\"],[\"GLM-5.3-Flash\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",11,36,1609,6,6,false,false,23608,0.15,0.05,0.18,\"1M\"],[\"GLM-5.2 (Max)\",\"https://huggingface.co/zai-org/GLM-5.2\",null,\"MIT\",12,38,1608,6,6,false,false,17925,0.94,1.4,4.4,\"1M\"],[\"Qwen3.8-27B\",\"https://huggingface.co/Qwen/Qwen3.8-27B\",null,\"Apache 2.0\",13,40,1590,6,6,false,false,20860,0.41,0.4,3.0,null],[\"MiniMax-M3.1-Flash\",\"https://www.minimax.io/blog/minimax-m31f\",null,\"MiniMax Community License\",14,42,1584,10,10,true,false,4904,0.16,0.15,0.6,null],[\"DeepSeek-V4-Flash (High)\",\"https://api-docs.deepseek.com/updates/#date-2026-07-31\",null,\"MIT\",15,44,1582,9,9,false,false,4829,0.12,0.3,1.2,\"1M\"],[\"DeepSeek-V4-Pro (High, 20260813)\",\"https://api-docs.deepseek.com/updates/#date-2026-08-13\",null,\"MIT\",16,45,1581,10,10,false,false,4605,0.37,1.32,3.96,null],[\"Mistral Large 4\",\"https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B\",null,\"Modified MIT\",17,48,1564,15,15,false,false,1777,0.38,0.7,2.1,\"1M\"],[\"Muse Spark Open (Max)\",\"https://research.meta.ai/blog/muse-spark-open\",\"Meta\",\"muse-model-license\",18,60,1526,15,15,false,false,1831,0.15,1.25,4.25,\"1M\"],[\"Kimi K2.6\",\"https://www.kimi.com/blog/kimi-k2-6\",null,\"Modified MIT\",19,67,1509,7,7,false,false,10005,0.24,0.95,4.0,\"262.1K\"],[\"GLM-5.1\",\"https://huggingface.co/zai-org/GLM-5.1\",null,\"MIT\",20,68,1508,7,7,false,false,10531,0.31,1.4,4.4,\"202.8K\"],[\"Hy3\",\"https://huggingface.co/tencent/Hy3\",\"Tencent\",\"Apache 2.0\",21,70,1505,8,8,false,false,7274,0.04,0.13,0.53,\"262.1K\"],[\"MiniMax-M3\",\"https://www.minimax.io/models/text/m3\",null,\"MiniMax Community License\",22,76,1484,5,5,false,false,21058,0.11,0.3,1.2,\"524.3K\"],[\"MiMo-V2.5-Pro\",\"https://mimo.xiaomi.com/mimo-v2-5-pro/\",null,\"MIT\",23,78,1479,5,5,false,false,22060,0.07,0.43,0.87,\"1M\"],[\"Kimi K2.7 Code\",\"https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart\",null,\"Modified MIT\",24,79,1474,9,9,false,false,4884,0.2,0.6,3.5,\"262.1K\"],[\"DeepSeek-V4-Pro Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",25,81,1463,6,6,false,false,12944,0.06,1.32,3.96,\"1M\"],[\"DeepSeek-V4-Pro\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",26,85,1448,6,6,false,false,13770,0.05,1.32,3.96,\"1M\"],[\"MiMo-V2.5\",\"https://mimo.xiaomi.com/mimo-v2-5/\",null,\"MIT\",27,90,1438,6,6,false,false,14633,0.03,0.4,2.0,\"1M\"],[\"Beam 1.0 501B A23B\",\"https://reflection.ai/blog/introducing-beam\",\"Reflection AI\",\"Apache 2.0\",28,91,1437,14,14,false,false,2513,null,0.3,1.0,\"1M\"],[\"Kimi K2.5 (Thinking)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",29,92,1436,5,5,false,false,19785,0.08,0.6,3.0,null],[\"GLM-5\",\"https://huggingface.co/zai-org/GLM-5\",null,\"MIT\",30,93,1435,8,8,false,false,7413,null,1.0,3.2,\"202.8K\"],[\"GLM-4.7\",\"https://huggingface.co/zai-org/GLM-4.7\",null,\"MIT\",31,94,1435,12,12,false,false,3968,null,0.6,2.2,\"204.8K\"],[\"DeepSeek-V4-Flash Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",32,97,1431,7,7,false,false,9976,0.04,0.3,1.2,\"1M\"],[\"Inkling\",\"https://thinkingmachines.ai/news/introducing-inkling/\",\"Thinking Machines\",\"Apache 2.0\",33,100,1414,6,6,false,false,17174,0.28,1.0,4.05,\"524.3K\"],[\"Inkling-Small\",\"https://thinkingmachines.ai/news/introducing-inkling-small/\",\"Thinking Machines\",\"Apache 2.0\",34,101,1408,9,9,false,false,5219,0.09,0.36,0.96,\"524.3K\"],[\"Kimi K2.5 (Instant)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",35,103,1405,12,12,false,false,3242,null,0.5,2.5,\"262.1K\"],[\"NVIDIA-Nemotron-3.5-Super-VL-120B-A12B (NVFP4)\",\"https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4\",null,\"OpenMDW-1.1\",36,104,1401,11,11,false,false,5127,null,null,null,null],[\"Qwen3.5-397B-A17B\",\"https://huggingface.co/Qwen/Qwen3.5-397B-A17B\",null,\"Apache 2.0\",37,105,1400,5,5,false,false,20848,0.19,0.6,3.6,\"262.1K\"],[\"MiniMax-M2.7\",\"https://www.minimax.io/news/minimax-m27-en\",null,\"Modified MIT\",38,108,1398,6,6,false,false,15724,0.06,0.3,1.2,\"204.8K\"],[\"MiniMax-M2.5\",\"https://www.minimax.io/news/minimax-m25\",null,\"Modified MIT\",39,112,1386,8,8,false,false,7565,null,0.27,0.95,\"198K\"],[\"MiniMax-M2.1 Preview\",\"https://www.minimax.io/news/minimax-m21\",null,\"MIT\",40,114,1384,10,10,false,false,7573,null,0.3,1.2,\"1M\"],[\"Gemma 4 31B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-31b-it\",null,\"Apache 2.0\",41,118,1370,6,6,false,false,16496,0.0075,0.16,0.47,\"128K\"],[\"DeepSeek-V3.2 (Thinking)\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",42,120,1362,9,9,false,false,6850,null,0.26,0.38,\"163.8K\"],[\"Qwen3.5-122B-A10B\",\"https://huggingface.co/Qwen/Qwen3.5-122B-A10B\",null,\"Apache 2.0\",43,121,1360,8,8,false,false,8179,0.09,0.26,2.08,\"262.1K\"],[\"Gemma 4 26B A4B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-26b-a4b-it\",null,\"Apache 2.0\",44,122,1359,17,17,false,false,1491,0.0086,0.05,0.29,\"262.1K\"],[\"Hy3 preview\",\"https://huggingface.co/tencent/Hy3-preview\",\"Tencent\",\"tencent-hunyuan-community\",45,123,1358,17,17,false,false,1426,0.07,0.18,0.6,\"262.1K\"],[\"Qwen3.5-27B\",\"https://huggingface.co/Qwen/Qwen3.5-27B\",null,\"Apache 2.0\",46,124,1357,8,8,false,false,7737,0.08,0.26,2.6,\"262.1K\"],[\"Muse Glimmer\",\"https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model\",\"Meta\",\"Apache-2.0\",47,126,1354,16,16,false,false,1628,null,null,null,null],[\"Laguna M.1\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",48,127,1350,9,9,false,false,5312,0.15,0.2,0.4,\"262.1K\"],[\"GLM-4.6\",\"https://docs.z.ai/guides/llm/glm-4.6\",null,\"MIT\",49,128,1343,11,11,false,false,6660,null,0.5,2.0,\"204.8K\"],[\"MiMo-V2-Flash (Non-Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",50,132,1331,10,10,false,false,5637,null,0.1,0.3,\"262.1K\"],[\"DeepSeek-V3.2\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",51,134,1326,8,8,false,false,9294,null,0.26,0.38,\"163.8K\"],[\"Kimi K2 Thinking Turbo\",\"https://huggingface.co/moonshotai/Kimi-K2-Thinking\",null,\"Modified MIT\",52,135,1321,8,8,false,false,12944,null,0.57,2.3,\"131.1K\"],[\"Laguna XS.2\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",53,136,1303,11,11,false,false,4166,0.07,0.1,0.2,\"262.1K\"],[\"MiniMax-M2\",\"https://www.minimax.io/news/minimax-m2\",null,\"Apache 2.0\",54,137,1299,11,11,false,false,6584,null,0.3,1.2,\"524.3K\"],[\"MiMo-V2-Flash (Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",55,138,1292,17,17,false,false,1666,null,0.1,0.3,\"262.1K\"],[\"Qwen3-Coder-480B-A35B-Instruct\",\"https://qwenlm.github.io/blog/qwen3-coder/\",null,\"Apache 2.0\",56,139,1275,8,8,false,false,12556,null,0.65,3.25,\"1M\"],[\"DeepSeek-V3.2-Exp\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",57,140,1271,14,14,false,false,3892,null,0.27,0.41,\"163.8K\"],[\"Mistral Medium 3.5\",\"https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04\",null,\"Modified MIT\",58,141,1263,15,15,false,false,2277,0.14,0.75,3.75,\"262.1K\"],[\"Qwen3.5-35B-A3B\",\"https://huggingface.co/Qwen/Qwen3.5-35B-A3B\",null,\"Apache 2.0\",59,144,1253,17,17,false,false,1612,0.14,0.14,1.0,\"262.1K\"],[\"Trinity Large Thinking\",\"https://www.arcee.ai/blog/trinity-large-thinking\",null,\"Apache 2.0\",60,148,1236,20,20,false,false,1349,0.07,0.25,0.8,\"262.1K\"],[\"Mistral Large 3\",\"https://mistral.ai/news/mistral-3\",null,\"Apache 2.0\",61,149,1232,26,26,false,false,815,null,0.5,1.5,null],[\"Devstral 2\",\"https://mistral.ai/news/devstral-2-vibe-cli\",null,\"Modified MIT\",62,152,1196,21,21,false,false,1171,null,null,null,null],[\"Granite 4.1 8B\",\"https://research.ibm.com/blog/granite-4-1-ai-foundation-models\",null,\"Apache 2.0\",63,153,1193,19,19,false,false,1749,0.0027,0.05,0.1,\"131.1K\"]],\"stats\":{\"n\":63,\"with_cost\":44,\"score_min\":1193,\"score_max\":1687,\"cost_min\":0.0027,\"cost_max\":1.74}},\"frontend_os\":{\"label\":\"WebDev \u00b7 Frontend\",\"path\":\"code/webdev/frontend\",\"license\":\"open-source\",\"meta\":\"865,237 votes \u00b7 63 open source models\",\"note\":\"All 63 open-source models\",\"total_claimed\":63,\"rows\":[[\"Kimi K3.1 Pro (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart\",null,\"Kimi K3.1 Pro License\",1,12,1703,11,11,false,false,4095,0.91,2.0,10.0,\"1M\"],[\"DeepSeek-V4.1-Flash-20261017 (Max)\",\"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017\",null,\"MIT\",2,16,1683,7,7,false,false,11233,0.12,0.15,0.6,\"1M\"],[\"Kimi K3 (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-quickstart\",null,\"Kimi K3 license\",3,20,1671,6,6,false,false,17914,1.74,3.0,15.0,\"1M\"],[\"Inkling 2 Small\",\"https://thinkingmachines.ai/news/inkling-2-small/\",\"Thinking Machines\",\"Apache 2.0\",4,22,1664,23,23,true,false,771,0.31,0.3,1.0,null],[\"MiMo-V2.6-Flash\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",5,25,1655,9,9,false,false,6999,0.05,0.14,0.28,\"1.1M\"],[\"Hy4 preview\",\"https://hy.tencent.ai/research/hy4-preview\",\"Tencent\",\"Apache 2.0\",6,26,1652,11,11,true,false,3630,0.35,0.83,2.5,\"1M\"],[\"Qwen3.8-Flash-Next\",\"https://qwen.ai/blog?id=qwen3.8-flash-next\",null,\"qwen-community-1.0\",7,27,1645,8,8,true,false,9014,0.18,0.16,0.47,\"1M\"],[\"MiMo-V2.6-Pro\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",8,29,1639,8,8,false,false,6966,0.1,0.43,0.87,\"1.1M\"],[\"GLM-5.3 (Max)\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",9,30,1637,8,8,false,false,9934,1.38,1.4,4.4,\"1M\"],[\"DeepSeek-V4.1-Flash-20260910 (Max)\",\"https://www.deepseek.com/en/news/deepseek-v4-1-flash/\",null,\"MIT\",10,32,1633,13,13,false,false,2654,0.06,0.3,1.2,\"1M\"],[\"GLM-5.3-Flash\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",11,35,1623,7,7,false,false,18561,0.15,0.05,0.18,\"1M\"],[\"GLM-5.2 (Max)\",\"https://huggingface.co/zai-org/GLM-5.2\",null,\"MIT\",12,38,1618,6,6,false,false,14400,0.94,1.4,4.4,\"1M\"],[\"MiniMax-M3.1-Flash\",\"https://www.minimax.io/blog/minimax-m31f\",null,\"MiniMax Community License\",13,40,1599,11,11,true,false,3868,0.16,0.15,0.6,null],[\"Qwen3.8-27B\",\"https://huggingface.co/Qwen/Qwen3.8-27B\",null,\"Apache 2.0\",14,41,1595,7,7,false,false,16531,0.41,0.4,3.0,null],[\"DeepSeek-V4-Pro (High, 20260813)\",\"https://api-docs.deepseek.com/updates/#date-2026-08-13\",null,\"MIT\",15,43,1588,11,11,false,false,3561,0.37,1.32,3.96,null],[\"DeepSeek-V4-Flash (High)\",\"https://api-docs.deepseek.com/updates/#date-2026-07-31\",null,\"MIT\",16,47,1585,11,11,false,false,3874,0.12,0.3,1.2,\"1M\"],[\"Mistral Large 4\",\"https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B\",null,\"Modified MIT\",17,48,1570,17,17,false,false,1423,0.38,0.7,2.1,\"1M\"],[\"Muse Spark Open (Max)\",\"https://research.meta.ai/blog/muse-spark-open\",\"Meta\",\"muse-model-license\",18,62,1519,17,17,false,false,1412,0.15,1.25,4.25,\"1M\"],[\"GLM-5.1\",\"https://huggingface.co/zai-org/GLM-5.1\",null,\"MIT\",19,68,1509,7,7,false,false,9211,0.31,1.4,4.4,\"202.8K\"],[\"Hy3\",\"https://huggingface.co/tencent/Hy3\",\"Tencent\",\"Apache 2.0\",20,69,1508,9,9,false,false,5745,0.04,0.13,0.53,\"262.1K\"],[\"Kimi K2.6\",\"https://www.kimi.com/blog/kimi-k2-6\",null,\"Modified MIT\",21,70,1506,8,8,false,false,8350,0.24,0.95,4.0,\"262.1K\"],[\"MiniMax-M3\",\"https://www.minimax.io/models/text/m3\",null,\"MiniMax Community License\",22,77,1482,6,6,false,false,17559,0.11,0.3,1.2,\"524.3K\"],[\"Kimi K2.7 Code\",\"https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart\",null,\"Modified MIT\",23,78,1476,10,10,false,false,4551,0.2,0.6,3.5,\"262.1K\"],[\"MiMo-V2.5-Pro\",\"https://mimo.xiaomi.com/mimo-v2-5-pro/\",null,\"MIT\",24,79,1474,6,6,false,false,18972,0.07,0.43,0.87,\"1M\"],[\"DeepSeek-V4-Pro Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",25,81,1461,7,7,false,false,11744,0.06,1.32,3.96,\"1M\"],[\"DeepSeek-V4-Pro\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",26,86,1446,7,7,false,false,10971,0.05,1.32,3.96,\"1M\"],[\"Beam 1.0 501B A23B\",\"https://reflection.ai/blog/introducing-beam\",\"Reflection AI\",\"Apache 2.0\",27,87,1445,16,16,false,false,1925,null,0.3,1.0,\"1M\"],[\"Kimi K2.5 (Thinking)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",28,92,1434,5,5,false,false,18490,0.08,0.6,3.0,null],[\"GLM-5\",\"https://huggingface.co/zai-org/GLM-5\",null,\"MIT\",29,93,1434,8,8,false,false,7346,null,1.0,3.2,\"202.8K\"],[\"GLM-4.7\",\"https://huggingface.co/zai-org/GLM-4.7\",null,\"MIT\",30,94,1433,12,12,false,false,3968,null,0.6,2.2,\"204.8K\"],[\"MiMo-V2.5\",\"https://mimo.xiaomi.com/mimo-v2-5/\",null,\"MIT\",31,96,1430,6,6,false,false,13022,0.03,0.4,2.0,\"1M\"],[\"DeepSeek-V4-Flash Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",32,97,1427,7,7,false,false,9136,0.04,0.3,1.2,\"1M\"],[\"Inkling\",\"https://thinkingmachines.ai/news/introducing-inkling/\",\"Thinking Machines\",\"Apache 2.0\",33,100,1410,7,7,false,false,13787,0.28,1.0,4.05,\"524.3K\"],[\"Kimi K2.5 (Instant)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",34,102,1404,12,12,false,false,3242,null,0.5,2.5,\"262.1K\"],[\"NVIDIA-Nemotron-3.5-Super-VL-120B-A12B (NVFP4)\",\"https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4\",null,\"OpenMDW-1.1\",35,103,1403,12,12,false,false,4098,null,null,null,null],[\"Inkling-Small\",\"https://thinkingmachines.ai/news/introducing-inkling-small/\",\"Thinking Machines\",\"Apache 2.0\",36,104,1402,10,10,false,false,4100,0.09,0.36,0.96,\"524.3K\"],[\"Qwen3.5-397B-A17B\",\"https://huggingface.co/Qwen/Qwen3.5-397B-A17B\",null,\"Apache 2.0\",37,106,1397,5,5,false,false,19139,0.19,0.6,3.6,\"262.1K\"],[\"MiniMax-M2.7\",\"https://www.minimax.io/news/minimax-m27-en\",null,\"Modified MIT\",38,109,1393,6,6,false,false,14401,0.06,0.3,1.2,\"204.8K\"],[\"MiniMax-M2.5\",\"https://www.minimax.io/news/minimax-m25\",null,\"Modified MIT\",39,112,1384,8,8,false,false,7559,null,0.27,0.95,\"198K\"],[\"MiniMax-M2.1 Preview\",\"https://www.minimax.io/news/minimax-m21\",null,\"MIT\",40,115,1383,10,10,false,false,7573,null,0.3,1.2,\"1M\"],[\"Gemma 4 31B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-31b-it\",null,\"Apache 2.0\",41,117,1371,6,6,false,false,14976,0.0075,0.16,0.47,\"128K\"],[\"DeepSeek-V3.2 (Thinking)\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",42,120,1361,9,9,false,false,6850,null,0.26,0.38,\"163.8K\"],[\"Qwen3.5-122B-A10B\",\"https://huggingface.co/Qwen/Qwen3.5-122B-A10B\",null,\"Apache 2.0\",43,122,1359,8,8,false,false,8110,0.09,0.26,2.08,\"262.1K\"],[\"Hy3 preview\",\"https://huggingface.co/tencent/Hy3-preview\",\"Tencent\",\"tencent-hunyuan-community\",44,123,1357,18,18,false,false,1397,0.07,0.18,0.6,\"262.1K\"],[\"Gemma 4 26B A4B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-26b-a4b-it\",null,\"Apache 2.0\",45,124,1356,17,17,false,false,1486,0.0086,0.05,0.29,\"262.1K\"],[\"Qwen3.5-27B\",\"https://huggingface.co/Qwen/Qwen3.5-27B\",null,\"Apache 2.0\",46,125,1356,8,8,false,false,7665,0.08,0.26,2.6,\"262.1K\"],[\"Muse Glimmer\",\"https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model\",\"Meta\",\"Apache-2.0\",47,126,1354,17,17,false,false,1378,null,null,null,null],[\"Laguna M.1\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",48,127,1344,10,10,false,false,4721,0.15,0.2,0.4,\"262.1K\"],[\"GLM-4.6\",\"https://docs.z.ai/guides/llm/glm-4.6\",null,\"MIT\",49,128,1341,11,11,false,false,6660,null,0.5,2.0,\"204.8K\"],[\"MiMo-V2-Flash (Non-Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",50,132,1330,10,10,false,false,5637,null,0.1,0.3,\"262.1K\"],[\"DeepSeek-V3.2\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",51,134,1325,8,8,false,false,9283,null,0.26,0.38,\"163.8K\"],[\"Kimi K2 Thinking Turbo\",\"https://huggingface.co/moonshotai/Kimi-K2-Thinking\",null,\"Modified MIT\",52,135,1320,8,8,false,false,12944,null,0.57,2.3,\"131.1K\"],[\"Laguna XS.2\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",53,136,1299,11,11,false,false,3974,0.07,0.1,0.2,\"262.1K\"],[\"MiniMax-M2\",\"https://www.minimax.io/news/minimax-m2\",null,\"Apache 2.0\",54,137,1298,11,11,false,false,6584,null,0.3,1.2,\"204.8K\"],[\"MiMo-V2-Flash (Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",55,138,1290,17,17,false,false,1666,null,0.1,0.3,\"262.1K\"],[\"Qwen3-Coder-480B-A35B-Instruct\",\"https://qwenlm.github.io/blog/qwen3-coder/\",null,\"Apache 2.0\",56,139,1273,8,8,false,false,12556,null,0.65,3.25,\"1M\"],[\"DeepSeek-V3.2-Exp\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",57,140,1269,14,14,false,false,3892,null,0.27,0.41,\"163.8K\"],[\"Mistral Medium 3.5\",\"https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04\",null,\"Modified MIT\",58,141,1264,15,15,false,false,2199,0.14,0.75,3.75,\"262.1K\"],[\"Qwen3.5-35B-A3B\",\"https://huggingface.co/Qwen/Qwen3.5-35B-A3B\",null,\"Apache 2.0\",59,144,1252,17,17,false,false,1612,null,0.14,1.0,\"262.1K\"],[\"Trinity Large Thinking\",\"https://www.arcee.ai/blog/trinity-large-thinking\",null,\"Apache 2.0\",60,148,1236,20,20,false,false,1341,0.07,0.25,0.8,\"262.1K\"],[\"Mistral Large 3\",\"https://mistral.ai/news/mistral-3\",null,\"Apache 2.0\",61,149,1231,26,26,false,false,815,null,0.5,1.5,null],[\"Devstral 2\",\"https://mistral.ai/news/devstral-2-vibe-cli\",null,\"Modified MIT\",62,152,1194,21,21,false,false,1171,null,null,null,null],[\"Granite 4.1 8B\",\"https://research.ibm.com/blog/granite-4-1-ai-foundation-models\",null,\"Apache 2.0\",63,153,1190,19,19,false,false,1706,0.0027,0.05,0.1,\"131.1K\"]],\"stats\":{\"n\":63,\"with_cost\":43,\"score_min\":1190,\"score_max\":1703,\"cost_min\":0.0027,\"cost_max\":1.74}},\"fullstack_os\":{\"label\":\"WebDev \u00b7 Fullstack\",\"path\":\"code/webdev/fullstack\",\"license\":\"open-source\",\"meta\":\"124,674 votes \u00b7 34 open source models\",\"note\":\"All 34 open-source models\",\"total_claimed\":34,\"rows\":[[\"Kimi K3.1 Pro (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart\",null,\"Kimi K3.1 Pro License\",1,10,1678,20,20,false,false,863,0.91,2.0,10.0,\"1M\"],[\"Kimi K3 (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-quickstart\",null,\"Kimi K3 license\",2,15,1660,10,10,false,false,4361,1.74,3.0,15.0,\"1M\"],[\"DeepSeek-V4.1-Flash-20261017 (Max)\",\"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017\",null,\"MIT\",3,19,1646,12,12,false,false,2763,0.12,0.15,0.6,\"1M\"],[\"MiMo-V2.6-Flash\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",4,24,1628,14,14,false,false,1891,0.05,0.14,0.28,\"1.1M\"],[\"GLM-5.3 (Max)\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",5,25,1627,12,12,false,false,2650,1.38,1.4,4.4,\"1M\"],[\"MiMo-V2.6-Pro\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",6,26,1625,14,14,false,false,1825,0.1,0.43,0.87,\"1.1M\"],[\"DeepSeek-V4.1-Flash-20260910 (Max)\",\"https://www.deepseek.com/en/news/deepseek-v4-1-flash/\",null,\"MIT\",7,28,1623,22,22,false,false,710,0.06,0.3,1.2,\"1M\"],[\"Qwen3.8-27B\",\"https://huggingface.co/Qwen/Qwen3.8-27B\",null,\"Apache 2.0\",8,30,1617,10,10,false,false,4124,0.41,0.4,3.0,null],[\"GLM-5.2 (Max)\",\"https://huggingface.co/zai-org/GLM-5.2\",null,\"MIT\",9,33,1614,11,11,false,false,3366,0.94,1.4,4.4,\"1M\"],[\"DeepSeek-V4-Flash (High)\",\"https://api-docs.deepseek.com/updates/#date-2026-07-31\",null,\"MIT\",10,34,1612,20,20,false,false,899,0.12,0.3,1.2,\"1M\"],[\"Qwen3.8-Flash-Next\",\"https://qwen.ai/blog?id=qwen3.8-flash-next\",null,\"qwen-community-1.0\",11,35,1605,13,13,true,false,2271,0.18,0.16,0.47,\"1M\"],[\"GLM-5.3-Flash\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",12,36,1604,9,9,false,false,4831,0.15,0.05,0.18,\"1M\"],[\"Hy4 preview\",\"https://hy.tencent.ai/research/hy4-preview\",\"Tencent\",\"Apache 2.0\",13,38,1602,19,19,true,false,920,0.35,0.83,2.5,\"1M\"],[\"DeepSeek-V4-Pro (High, 20260813)\",\"https://api-docs.deepseek.com/updates/#date-2026-08-13\",null,\"MIT\",14,39,1600,19,19,false,false,998,0.37,1.32,3.96,null],[\"Muse Spark Open (Max)\",\"https://research.meta.ai/blog/muse-spark-open\",\"Meta\",\"muse-model-license\",15,41,1592,30,30,false,false,405,0.15,1.25,4.25,\"1M\"],[\"MiniMax-M3.1-Flash\",\"https://www.minimax.io/blog/minimax-m31f\",null,\"MiniMax Community License\",16,42,1584,19,19,true,false,996,0.16,0.15,0.6,null],[\"Kimi K2.6\",\"https://www.kimi.com/blog/kimi-k2-6\",null,\"Modified MIT\",17,56,1564,18,18,false,false,1546,0.24,0.95,4.0,\"262.1K\"],[\"GLM-5.1\",\"https://huggingface.co/zai-org/GLM-5.1\",null,\"MIT\",18,59,1549,17,17,false,false,1228,0.31,1.4,4.4,\"202.8K\"],[\"MiMo-V2.5-Pro\",\"https://mimo.xiaomi.com/mimo-v2-5-pro/\",null,\"MIT\",19,60,1545,11,11,false,false,2885,0.07,0.43,0.87,\"1M\"],[\"Hy3\",\"https://huggingface.co/tencent/Hy3\",\"Tencent\",\"Apache 2.0\",20,61,1540,16,16,false,false,1462,0.04,0.13,0.53,\"262.1K\"],[\"MiniMax-M3\",\"https://www.minimax.io/models/text/m3\",null,\"MiniMax Community License\",21,63,1539,11,11,false,false,3289,0.11,0.3,1.2,\"524.3K\"],[\"MiMo-V2.5\",\"https://mimo.xiaomi.com/mimo-v2-5/\",null,\"MIT\",22,64,1536,16,16,false,false,1484,0.03,0.4,2.0,\"1M\"],[\"DeepSeek-V4-Pro Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",23,68,1515,18,18,false,false,1107,0.06,1.32,3.96,\"1M\"],[\"DeepSeek-V4-Pro\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",24,71,1502,14,14,false,false,2609,0.05,1.32,3.96,\"1M\"],[\"DeepSeek-V4-Flash Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",25,72,1500,22,22,false,false,762,0.04,0.3,1.2,\"1M\"],[\"Kimi K2.5 (Thinking)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",26,73,1494,17,17,false,false,1195,0.08,0.6,3.0,null],[\"MiniMax-M2.7\",\"https://www.minimax.io/news/minimax-m27-en\",null,\"Modified MIT\",27,75,1480,17,17,false,false,1219,0.06,0.3,1.2,\"204.8K\"],[\"Inkling\",\"https://thinkingmachines.ai/news/introducing-inkling/\",\"Thinking Machines\",\"Apache 2.0\",28,76,1476,11,11,false,false,3166,0.28,1.0,4.05,\"524.3K\"],[\"Inkling-Small\",\"https://thinkingmachines.ai/news/introducing-inkling-small/\",\"Thinking Machines\",\"Apache 2.0\",29,77,1474,19,19,false,false,1032,0.09,0.36,0.96,\"524.3K\"],[\"Qwen3.5-397B-A17B\",\"https://huggingface.co/Qwen/Qwen3.5-397B-A17B\",null,\"Apache 2.0\",30,78,1468,15,15,false,false,1570,0.19,0.6,3.6,\"262.1K\"],[\"Beam 1.0 501B A23B\",\"https://reflection.ai/blog/introducing-beam\",\"Reflection AI\",\"Apache 2.0\",31,80,1455,27,27,false,false,564,null,0.3,1.0,\"1M\"],[\"NVIDIA-Nemotron-3.5-Super-VL-120B-A12B (NVFP4)\",\"https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4\",null,\"OpenMDW-1.1\",32,81,1449,21,21,false,false,976,null,null,null,null],[\"Laguna M.1\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",33,84,1428,26,26,false,false,553,0.15,0.2,0.4,\"262.1K\"],[\"Gemma 4 31B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-31b-it\",null,\"Apache 2.0\",34,89,1402,17,17,false,false,1418,0.0075,0.16,0.47,\"128K\"]],\"stats\":{\"n\":34,\"with_cost\":32,\"score_min\":1402,\"score_max\":1678,\"cost_min\":0.0075,\"cost_max\":1.74}},\"react_os\":{\"label\":\"WebDev \u00b7 React\",\"path\":\"code/webdev/react\",\"license\":\"open-source\",\"meta\":\"656,360 votes \u00b7 59 open source models\",\"note\":\"All 59 open-source models (row 44 Hy3 preview stitched from two scrape chunks; Overall Rank inferred)\",\"total_claimed\":59,\"rows\":[[\"Kimi K3.1 Pro (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart\",null,\"Kimi K3.1 Pro License\",1,12,1699,12,12,false,false,3156,0.91,2.0,10.0,\"1M\"],[\"DeepSeek-V4.1-Flash-20261017 (Max)\",\"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017\",null,\"MIT\",2,17,1675,8,8,false,false,8865,0.12,0.15,0.6,\"1M\"],[\"Kimi K3 (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-quickstart\",null,\"Kimi K3 license\",3,19,1672,7,7,false,false,14765,1.74,3.0,15.0,\"1M\"],[\"Inkling 2 Small\",\"https://thinkingmachines.ai/news/inkling-2-small/\",\"Thinking Machines\",\"Apache 2.0\",4,23,1660,25,25,true,false,639,0.31,0.3,1.0,null],[\"MiMo-V2.6-Flash\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",5,24,1654,9,9,false,false,5560,0.05,0.14,0.28,\"1.1M\"],[\"Qwen3.8-Flash-Next\",\"https://qwen.ai/blog?id=qwen3.8-flash-next\",null,\"qwen-community-1.0\",6,25,1653,9,9,true,false,7201,0.18,0.16,0.47,\"1M\"],[\"Hy4 preview\",\"https://hy.tencent.ai/research/hy4-preview\",\"Tencent\",\"Apache 2.0\",7,26,1653,12,12,true,false,2948,0.35,0.83,2.5,\"1M\"],[\"GLM-5.3 (Max)\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",8,28,1642,8,8,false,false,8151,1.38,1.4,4.4,\"1M\"],[\"MiMo-V2.6-Pro\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",9,29,1637,9,9,false,false,5610,0.1,0.43,0.87,\"1.1M\"],[\"DeepSeek-V4.1-Flash-20260910 (Max)\",\"https://www.deepseek.com/en/news/deepseek-v4-1-flash/\",null,\"MIT\",10,33,1630,14,14,false,false,2073,0.06,0.3,1.2,\"1M\"],[\"GLM-5.3-Flash\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",11,34,1628,7,7,false,false,15065,0.15,0.05,0.18,\"1M\"],[\"GLM-5.2 (Max)\",\"https://huggingface.co/zai-org/GLM-5.2\",null,\"MIT\",12,35,1621,7,7,false,false,12167,0.94,1.4,4.4,\"1M\"],[\"MiniMax-M3.1-Flash\",\"https://www.minimax.io/blog/minimax-m31f\",null,\"MiniMax Community License\",13,40,1603,12,12,true,false,3082,0.16,0.15,0.6,null],[\"Qwen3.8-27B\",\"https://huggingface.co/Qwen/Qwen3.8-27B\",null,\"Apache 2.0\",14,41,1596,7,7,false,false,13356,0.41,0.4,3.0,null],[\"DeepSeek-V4-Pro (High, 20260813)\",\"https://api-docs.deepseek.com/updates/#date-2026-08-13\",null,\"MIT\",15,43,1586,12,12,false,false,3032,0.37,1.32,3.96,null],[\"DeepSeek-V4-Flash (High)\",\"https://api-docs.deepseek.com/updates/#date-2026-07-31\",null,\"MIT\",16,44,1584,11,11,false,false,3285,0.12,0.3,1.2,\"1M\"],[\"Mistral Large 4\",\"https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B\",null,\"Modified MIT\",17,48,1570,20,20,false,false,1056,0.38,0.7,2.1,\"1M\"],[\"Muse Spark Open (Max)\",\"https://research.meta.ai/blog/muse-spark-open\",\"Meta\",\"muse-model-license\",18,60,1523,19,19,false,false,1155,0.15,1.25,4.25,\"1M\"],[\"Hy3\",\"https://huggingface.co/tencent/Hy3\",\"Tencent\",\"Apache 2.0\",19,66,1506,10,10,false,false,4601,0.04,0.13,0.53,\"262.1K\"],[\"Kimi K2.6\",\"https://www.kimi.com/blog/kimi-k2-6\",null,\"Modified MIT\",20,68,1504,8,8,false,false,7218,0.24,0.95,4.0,\"262.1K\"],[\"GLM-5.1\",\"https://huggingface.co/zai-org/GLM-5.1\",null,\"MIT\",21,69,1504,8,8,false,false,8018,0.31,1.4,4.4,\"202.8K\"],[\"MiniMax-M3\",\"https://www.minimax.io/models/text/m3\",null,\"MiniMax Community License\",22,74,1479,6,6,false,false,14657,0.11,0.3,1.2,\"524.3K\"],[\"Kimi K2.7 Code\",\"https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart\",null,\"Modified MIT\",23,77,1475,11,11,false,false,3917,0.2,0.6,3.5,\"262.1K\"],[\"MiMo-V2.5-Pro\",\"https://mimo.xiaomi.com/mimo-v2-5-pro/\",null,\"MIT\",24,79,1468,6,6,false,false,16157,0.07,0.43,0.87,\"1M\"],[\"DeepSeek-V4-Pro Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",25,82,1452,7,7,false,false,10229,0.06,1.32,3.96,\"1M\"],[\"Beam 1.0 501B A23B\",\"https://reflection.ai/blog/introducing-beam\",\"Reflection AI\",\"Apache 2.0\",26,85,1443,18,18,false,false,1583,null,0.3,1.0,\"1M\"],[\"DeepSeek-V4-Pro\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",27,86,1441,7,7,false,false,9473,0.05,1.32,3.96,\"1M\"],[\"Kimi K2.5 (Thinking)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",28,88,1428,6,6,false,false,15919,0.08,0.6,3.0,null],[\"GLM-5\",\"https://huggingface.co/zai-org/GLM-5\",null,\"MIT\",29,92,1423,9,9,false,false,6453,null,1.0,3.2,\"202.8K\"],[\"MiMo-V2.5\",\"https://mimo.xiaomi.com/mimo-v2-5/\",null,\"MIT\",30,93,1423,7,7,false,false,11283,0.03,0.4,2.0,\"1M\"],[\"DeepSeek-V4-Flash Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",31,94,1421,8,8,false,false,7993,0.04,0.3,1.2,\"1M\"],[\"GLM-4.7\",\"https://huggingface.co/zai-org/GLM-4.7\",null,\"MIT\",32,95,1415,69,69,false,false,99,null,0.6,2.2,\"204.8K\"],[\"Inkling\",\"https://thinkingmachines.ai/news/introducing-inkling/\",\"Thinking Machines\",\"Apache 2.0\",33,97,1404,7,7,false,false,11357,0.28,1.0,4.05,\"524.3K\"],[\"Inkling-Small\",\"https://thinkingmachines.ai/news/introducing-inkling-small/\",\"Thinking Machines\",\"Apache 2.0\",34,98,1397,11,11,false,false,3480,0.09,0.36,0.96,\"524.3K\"],[\"NVIDIA-Nemotron-3.5-Super-VL-120B-A12B (NVFP4)\",\"https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4\",null,\"OpenMDW-1.1\",35,101,1393,13,13,false,false,3362,null,null,null,null],[\"Kimi K2.5 (Instant)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",36,102,1391,13,13,false,false,2762,null,0.5,2.5,\"262.1K\"],[\"Qwen3.5-397B-A17B\",\"https://huggingface.co/Qwen/Qwen3.5-397B-A17B\",null,\"Apache 2.0\",37,104,1387,6,6,false,false,16534,0.19,0.6,3.6,\"262.1K\"],[\"MiniMax-M2.7\",\"https://www.minimax.io/news/minimax-m27-en\",null,\"Modified MIT\",38,105,1386,6,6,false,false,12442,0.06,0.3,1.2,\"204.8K\"],[\"MiniMax-M2.5\",\"https://www.minimax.io/news/minimax-m25\",null,\"Modified MIT\",39,110,1373,9,9,false,false,6568,null,0.27,0.95,\"198K\"],[\"MiniMax-M2.1 Preview\",\"https://www.minimax.io/news/minimax-m21\",null,\"MIT\",40,112,1365,15,15,false,false,2283,null,0.3,1.2,\"1M\"],[\"Gemma 4 31B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-31b-it\",null,\"Apache 2.0\",41,113,1362,7,7,false,false,12655,0.0075,0.16,0.47,\"128K\"],[\"Qwen3.5-122B-A10B\",\"https://huggingface.co/Qwen/Qwen3.5-122B-A10B\",null,\"Apache 2.0\",42,117,1351,8,8,false,false,7099,0.09,0.26,2.08,\"262.1K\"],[\"DeepSeek-V3.2 (Thinking)\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",43,118,1350,12,12,false,false,3594,null,0.26,0.38,\"163.8K\"],[\"Hy3 preview\",\"https://huggingface.co/tencent/Hy3-preview\",\"Tencent\",\"tencent-hunyuan-community\",44,119,1350,19,19,false,false,1196,0.07,0.18,0.6,\"262.1K\"],[\"Gemma 4 26B A4B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-26b-a4b-it\",null,\"Apache 2.0\",45,120,1350,18,18,false,false,1280,0.0086,0.05,0.29,\"262.1K\"],[\"Muse Glimmer\",\"https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model\",\"Meta\",\"Apache-2.0\",46,121,1346,19,19,false,false,1199,null,null,null,null],[\"Qwen3.5-27B\",\"https://huggingface.co/Qwen/Qwen3.5-27B\",null,\"Apache 2.0\",47,122,1345,9,9,false,false,6710,0.08,0.26,2.6,\"262.1K\"],[\"Laguna M.1\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",48,123,1339,11,11,false,false,4085,0.15,0.2,0.4,\"262.1K\"],[\"DeepSeek-V3.2\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",49,124,1333,10,10,false,false,5077,null,0.26,0.38,\"163.8K\"],[\"Kimi K2 Thinking Turbo\",\"https://huggingface.co/moonshotai/Kimi-K2-Thinking\",null,\"Modified MIT\",50,127,1313,10,10,false,false,5019,null,0.57,2.3,\"131.1K\"],[\"MiMo-V2-Flash (Non-Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",51,128,1312,14,14,false,false,2355,null,0.1,0.3,\"262.1K\"],[\"Laguna XS.2\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",52,130,1295,12,12,false,false,3455,0.07,0.1,0.2,\"262.1K\"],[\"Qwen3-Coder-480B-A35B-Instruct\",\"https://qwenlm.github.io/blog/qwen3-coder/\",null,\"Apache 2.0\",53,131,1258,11,11,false,false,4091,null,0.65,3.25,\"1M\"],[\"Mistral Medium 3.5\",\"https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04\",null,\"Modified MIT\",54,132,1252,16,16,false,false,1933,0.14,0.75,3.75,\"262.1K\"],[\"Qwen3.5-35B-A3B\",\"https://huggingface.co/Qwen/Qwen3.5-35B-A3B\",null,\"Apache 2.0\",55,134,1236,19,19,false,false,1418,null,0.14,1.0,\"262.1K\"],[\"Trinity Large Thinking\",\"https://www.arcee.ai/blog/trinity-large-thinking\",null,\"Apache 2.0\",56,135,1230,22,22,false,false,1145,0.07,0.25,0.8,\"262.1K\"],[\"MiMo-V2-Flash (Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",57,137,1228,24,24,false,false,809,null,0.1,0.3,\"262.1K\"],[\"Granite 4.1 8B\",\"https://research.ibm.com/blog/granite-4-1-ai-foundation-models\",null,\"Apache 2.0\",58,139,1180,20,20,false,false,1487,0.0027,0.05,0.1,\"131.1K\"],[\"Devstral 2\",\"https://mistral.ai/news/devstral-2-vibe-cli\",null,\"Modified MIT\",59,141,1147,51,51,false,false,192,null,null,null,null]],\"stats\":{\"n\":59,\"with_cost\":43,\"score_min\":1147,\"score_max\":1699,\"cost_min\":0.0027,\"cost_max\":1.74}},\"reference_os\":{\"label\":\"WebDev \u00b7 Reference-based design\",\"path\":\"code/webdev/reference-based-design\",\"license\":\"open-source\",\"meta\":\"227,361 votes \u00b7 63 open source models\",\"note\":\"All 63 open-source models\",\"total_claimed\":63,\"rows\":[[\"Kimi K3.1 Pro (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart\",null,\"Kimi K3.1 Pro License\",1,14,1701,21,21,false,false,981,0.91,2.0,10.0,\"1M\"],[\"Inkling 2 Small\",\"https://thinkingmachines.ai/news/inkling-2-small/\",\"Thinking Machines\",\"Apache 2.0\",2,16,1685,45,45,true,false,186,0.31,0.3,1.0,null],[\"Kimi K3 (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-quickstart\",null,\"Kimi K3 license\",3,20,1677,11,11,false,false,4193,1.74,3.0,15.0,\"1M\"],[\"DeepSeek-V4.1-Flash-20261017 (Max)\",\"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017\",null,\"MIT\",4,21,1673,13,13,false,false,2734,0.12,0.15,0.6,\"1M\"],[\"MiMo-V2.6-Flash\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",5,25,1656,16,16,false,false,1720,0.05,0.14,0.28,\"1.1M\"],[\"Hy4 preview\",\"https://hy.tencent.ai/research/hy4-preview\",\"Tencent\",\"Apache 2.0\",6,28,1648,22,22,true,false,820,0.35,0.83,2.5,\"1M\"],[\"MiMo-V2.6-Pro\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",7,29,1647,16,16,false,false,1694,0.1,0.43,0.87,\"1.1M\"],[\"GLM-5.3 (Max)\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",8,30,1643,13,13,false,false,2446,1.38,1.4,4.4,\"1M\"],[\"Qwen3.8-Flash-Next\",\"https://qwen.ai/blog?id=qwen3.8-flash-next\",null,\"qwen-community-1.0\",9,32,1634,14,14,true,false,2122,0.18,0.16,0.47,\"1M\"],[\"GLM-5.3-Flash\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",10,35,1620,10,10,false,false,4441,0.15,0.05,0.18,\"1M\"],[\"DeepSeek-V4.1-Flash-20260910 (Max)\",\"https://www.deepseek.com/en/news/deepseek-v4-1-flash/\",null,\"MIT\",11,37,1617,25,25,false,false,637,0.06,0.3,1.2,\"1M\"],[\"MiniMax-M3.1-Flash\",\"https://www.minimax.io/blog/minimax-m31f\",null,\"MiniMax Community License\",12,38,1615,20,20,true,false,989,0.16,0.15,0.6,null],[\"GLM-5.2 (Max)\",\"https://huggingface.co/zai-org/GLM-5.2\",null,\"MIT\",13,39,1609,11,11,false,false,3704,0.94,1.4,4.4,\"1M\"],[\"Qwen3.8-27B\",\"https://huggingface.co/Qwen/Qwen3.8-27B\",null,\"Apache 2.0\",14,43,1595,11,11,false,false,3822,0.41,0.4,3.0,null],[\"Mistral Large 4\",\"https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B\",null,\"Modified MIT\",15,45,1588,34,34,false,false,330,0.38,0.7,2.1,\"1M\"],[\"DeepSeek-V4-Pro (High, 20260813)\",\"https://api-docs.deepseek.com/updates/#date-2026-08-13\",null,\"MIT\",16,46,1580,21,21,false,false,869,0.37,1.32,3.96,null],[\"DeepSeek-V4-Flash (High)\",\"https://api-docs.deepseek.com/updates/#date-2026-07-31\",null,\"MIT\",17,48,1577,21,21,false,false,955,0.12,0.3,1.2,\"1M\"],[\"Muse Spark Open (Max)\",\"https://research.meta.ai/blog/muse-spark-open\",\"Meta\",\"muse-model-license\",18,57,1552,36,36,false,false,332,0.15,1.25,4.25,\"1M\"],[\"GLM-5.1\",\"https://huggingface.co/zai-org/GLM-5.1\",null,\"MIT\",19,62,1534,14,14,false,false,2314,0.31,1.4,4.4,\"202.8K\"],[\"Hy3\",\"https://huggingface.co/tencent/Hy3\",\"Tencent\",\"Apache 2.0\",20,69,1512,18,18,false,false,1293,0.04,0.13,0.53,\"262.1K\"],[\"Kimi K2.6\",\"https://www.kimi.com/blog/kimi-k2-6\",null,\"Modified MIT\",21,70,1510,13,13,false,false,2570,0.24,0.95,4.0,\"262.1K\"],[\"Kimi K2.7 Code\",\"https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart\",null,\"Modified MIT\",22,76,1485,18,18,false,false,1313,0.2,0.6,3.5,\"262.1K\"],[\"MiniMax-M3\",\"https://www.minimax.io/models/text/m3\",null,\"MiniMax Community License\",23,77,1480,10,10,false,false,4444,0.11,0.3,1.2,\"524.3K\"],[\"MiMo-V2.5-Pro\",\"https://mimo.xiaomi.com/mimo-v2-5-pro/\",null,\"MIT\",24,78,1477,9,9,false,false,5145,0.07,0.43,0.87,\"1M\"],[\"DeepSeek-V4-Pro Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",25,80,1474,11,11,false,false,3281,0.06,1.32,3.96,\"1M\"],[\"DeepSeek-V4-Pro\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",26,86,1455,11,11,false,false,3407,0.05,1.32,3.96,\"1M\"],[\"MiMo-V2.5\",\"https://mimo.xiaomi.com/mimo-v2-5/\",null,\"MIT\",27,89,1447,11,11,false,false,3687,0.03,0.4,2.0,\"1M\"],[\"GLM-5\",\"https://huggingface.co/zai-org/GLM-5\",null,\"MIT\",28,90,1445,16,16,false,false,1860,null,1.0,3.2,\"202.8K\"],[\"DeepSeek-V4-Flash Preview (High)\",\"https://api-docs.deepseek.com/news/news260424\",null,\"MIT\",29,92,1443,13,13,false,false,2606,0.04,0.3,1.2,\"1M\"],[\"Kimi K2.5 (Thinking)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",30,94,1440,9,9,false,false,4960,0.08,0.6,3.0,null],[\"GLM-4.7\",\"https://huggingface.co/zai-org/GLM-4.7\",null,\"MIT\",31,95,1436,22,22,false,false,1050,null,0.6,2.2,\"204.8K\"],[\"Beam 1.0 501B A23B\",\"https://reflection.ai/blog/introducing-beam\",\"Reflection AI\",\"Apache 2.0\",32,97,1423,32,32,false,false,510,null,0.3,1.0,\"1M\"],[\"Kimi K2.5 (Instant)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",33,98,1418,24,24,false,false,800,null,0.5,2.5,\"262.1K\"],[\"Inkling\",\"https://thinkingmachines.ai/news/introducing-inkling/\",\"Thinking Machines\",\"Apache 2.0\",34,103,1407,12,12,false,false,3130,0.28,1.0,4.05,\"524.3K\"],[\"NVIDIA-Nemotron-3.5-Super-VL-120B-A12B (NVFP4)\",\"https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4\",null,\"OpenMDW-1.1\",35,104,1405,24,24,false,false,938,null,null,null,null],[\"Qwen3.5-397B-A17B\",\"https://huggingface.co/Qwen/Qwen3.5-397B-A17B\",null,\"Apache 2.0\",36,106,1400,9,9,false,false,5309,0.19,0.6,3.6,\"262.1K\"],[\"Inkling-Small\",\"https://thinkingmachines.ai/news/introducing-inkling-small/\",\"Thinking Machines\",\"Apache 2.0\",37,107,1399,21,21,false,false,999,0.09,0.36,0.96,\"524.3K\"],[\"MiniMax-M2.7\",\"https://www.minimax.io/news/minimax-m27-en\",null,\"Modified MIT\",38,110,1391,11,11,false,false,3816,0.06,0.3,1.2,\"204.8K\"],[\"MiniMax-M2.1 Preview\",\"https://www.minimax.io/news/minimax-m21\",null,\"MIT\",39,115,1374,16,16,false,false,1922,null,0.3,1.2,\"1M\"],[\"Muse Glimmer\",\"https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model\",\"Meta\",\"Apache-2.0\",40,116,1369,35,35,false,false,329,null,null,null,null],[\"MiniMax-M2.5\",\"https://www.minimax.io/news/minimax-m25\",null,\"Modified MIT\",41,118,1368,15,15,false,false,1863,null,0.27,0.95,\"198K\"],[\"Qwen3.5-122B-A10B\",\"https://huggingface.co/Qwen/Qwen3.5-122B-A10B\",null,\"Apache 2.0\",42,119,1362,14,14,false,false,2297,0.09,0.26,2.08,\"262.1K\"],[\"Qwen3.5-27B\",\"https://huggingface.co/Qwen/Qwen3.5-27B\",null,\"Apache 2.0\",43,120,1362,14,14,false,false,2205,0.08,0.26,2.6,\"262.1K\"],[\"Gemma 4 26B A4B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-26b-a4b-it\",null,\"Apache 2.0\",44,122,1360,33,33,false,false,408,0.0086,0.05,0.29,\"262.1K\"],[\"Hy3 preview\",\"https://huggingface.co/tencent/Hy3-preview\",\"Tencent\",\"tencent-hunyuan-community\",45,123,1355,32,32,false,false,431,0.07,0.18,0.6,\"262.1K\"],[\"DeepSeek-V3.2 (Thinking)\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",46,124,1353,16,16,false,false,1925,null,0.26,0.38,\"163.8K\"],[\"Gemma 4 31B\",\"https://aistudio.google.com/app/prompts/new_chat?model=gemma-4-31b-it\",null,\"Apache 2.0\",47,125,1350,12,12,false,false,3270,0.0075,0.16,0.47,\"128K\"],[\"Laguna M.1\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",48,127,1348,18,18,false,false,1339,0.15,0.2,0.4,\"262.1K\"],[\"GLM-4.6\",\"https://docs.z.ai/guides/llm/glm-4.6\",null,\"MIT\",49,129,1341,17,17,false,false,2071,null,0.5,2.0,\"204.8K\"],[\"MiMo-V2-Flash (Non-Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",50,131,1321,18,18,false,false,1455,null,0.1,0.3,\"262.1K\"],[\"DeepSeek-V3.2\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",51,133,1319,14,14,false,false,2575,null,0.26,0.38,\"163.8K\"],[\"Kimi K2 Thinking Turbo\",\"https://huggingface.co/moonshotai/Kimi-K2-Thinking\",null,\"Modified MIT\",52,134,1314,12,12,false,false,3778,null,0.57,2.3,\"131.1K\"],[\"MiniMax-M2\",\"https://www.minimax.io/news/minimax-m2\",null,\"Apache 2.0\",53,135,1293,17,17,false,false,2151,null,0.3,1.2,\"204.8K\"],[\"Laguna XS.2\",\"https://poolside.ai/blog/introducing-laguna-xs2-m1\",null,\"Apache 2.0\",54,136,1288,20,20,false,false,1173,0.07,0.1,0.2,\"262.1K\"],[\"Mistral Medium 3.5\",\"https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04\",null,\"Modified MIT\",55,137,1278,26,26,false,false,701,0.14,0.75,3.75,\"262.1K\"],[\"DeepSeek-V3.2-Exp\",\"https://api-docs.deepseek.com/news/news250929\",null,\"MIT\",56,138,1274,21,21,false,false,1318,null,0.27,0.41,\"163.8K\"],[\"MiMo-V2-Flash (Thinking)\",\"https://mimo.xiaomi.com/blog/mimo-v2-flash\",null,\"MIT\",57,139,1264,31,31,false,false,461,null,0.1,0.3,\"262.1K\"],[\"Qwen3-Coder-480B-A35B-Instruct\",\"https://qwenlm.github.io/blog/qwen3-coder/\",null,\"Apache 2.0\",58,140,1264,13,13,false,false,3652,null,0.65,3.25,\"1M\"],[\"Qwen3.5-35B-A3B\",\"https://huggingface.co/Qwen/Qwen3.5-35B-A3B\",null,\"Apache 2.0\",59,143,1249,32,32,false,false,462,null,0.14,1.0,\"262.1K\"],[\"Trinity Large Thinking\",\"https://www.arcee.ai/blog/trinity-large-thinking\",null,\"Apache 2.0\",60,148,1223,40,40,false,false,352,0.07,0.25,0.8,\"262.1K\"],[\"Granite 4.1 8B\",\"https://research.ibm.com/blog/granite-4-1-ai-foundation-models\",null,\"Apache 2.0\",61,150,1216,31,31,false,false,553,0.0027,0.05,0.1,\"131.1K\"],[\"Mistral Large 3\",\"https://mistral.ai/news/mistral-3\",null,\"Apache 2.0\",62,151,1214,51,51,false,false,236,null,0.5,1.5,null],[\"Devstral 2\",\"https://mistral.ai/news/devstral-2-vibe-cli\",null,\"Modified MIT\",63,153,1180,40,40,false,false,305,null,null,null,null]],\"stats\":{\"n\":63,\"with_cost\":43,\"score_min\":1180,\"score_max\":1701,\"cost_min\":0.0027,\"cost_max\":1.74}},\"img2webdev_os\":{\"label\":\"Image-to-WebDev (screenshot to code)\",\"path\":\"code/image-to-webdev\",\"license\":\"open-source\",\"meta\":\"210,832 votes \u00b7 15 open source models\",\"note\":\"All 15 open-source models; this board is dated 2026-11-10\",\"total_claimed\":15,\"rows\":[[\"DeepSeek-V4.1-Flash-20260910 (Max)\",\"https://www.deepseek.com/en/news/deepseek-v4-1-flash/\",null,\"MIT\",1,12,1610,23,23,false,false,729,0.06,0.3,1.2,\"1M\"],[\"DeepSeek-V4.1-Flash-20261017 (Max)\",\"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017\",null,\"MIT\",2,13,1609,10,10,false,false,3881,0.1,0.15,0.6,\"1M\"],[\"MiMo-V2.6-Pro\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",3,18,1597,11,11,false,false,3653,0.11,0.43,0.87,\"1.1M\"],[\"MiMo-V2.6-Flash\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",4,20,1593,11,11,false,false,3318,0.05,0.14,0.28,\"1.1M\"],[\"Kimi K3 (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-quickstart\",null,\"Kimi K3 license\",5,22,1586,10,10,false,false,4678,1.7,3.0,15.0,\"1M\"],[\"GLM-5.3-Flash\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",6,23,1582,8,8,false,false,7909,0.18,0.05,0.18,\"1M\"],[\"Qwen3.8-27B\",\"https://huggingface.co/Qwen/Qwen3.8-27B\",null,\"Apache 2.0\",7,25,1574,8,8,false,false,7985,0.42,0.4,3.0,null],[\"Kimi K2.6\",\"https://www.kimi.com/blog/kimi-k2-6\",null,\"Modified MIT\",8,38,1522,12,12,false,false,3511,0.25,0.95,4.0,\"262.1K\"],[\"Kimi K2.7 Code\",\"https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart\",null,\"Modified MIT\",9,41,1512,20,20,false,false,905,0.22,0.6,3.5,\"262.1K\"],[\"MiniMax-M3\",\"https://www.minimax.io/models/text/m3\",null,\"MiniMax Community License\",10,48,1473,8,8,false,false,6237,0.15,0.3,1.2,\"524.3K\"],[\"Kimi K2.5 (Thinking)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",11,55,1439,17,17,false,false,1635,null,0.6,3.0,null],[\"Kimi K2.5 (Instant)\",\"https://www.kimi.com/blog/kimi-k2-5.html\",null,\"Modified MIT\",12,58,1411,22,22,false,false,961,null,0.5,2.5,\"262.1K\"],[\"Inkling-Small\",\"https://thinkingmachines.ai/news/introducing-inkling-small/\",\"Thinking Machines\",\"Apache 2.0\",13,59,1410,20,20,false,false,1001,0.12,0.36,0.96,\"524.3K\"],[\"NVIDIA-Nemotron-3.5-Super-VL-120B-A12B (NVFP4)\",\"https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4\",null,\"OpenMDW-1.1\",14,60,1392,15,15,false,false,2218,null,null,null,null],[\"Mistral Large 3\",\"https://mistral.ai/news/mistral-3\",null,\"Apache 2.0\",15,62,1362,18,18,false,false,1369,0.21,0.5,1.5,null]],\"stats\":{\"n\":15,\"with_cost\":12,\"score_min\":1362,\"score_max\":1610,\"cost_min\":0.05,\"cost_max\":1.7}},\"overall_all\":{\"label\":\"WebDev \u00b7 Overall (all models)\",\"path\":\"code/webdev\",\"license\":\"all\",\"meta\":\"997,838 votes \u00b7 158 models\",\"note\":\"Top 40 all-license models (incl. closed); ranks 41+ not scraped\",\"total_claimed\":41,\"rows\":[[\"Claude Fable 5.2 (xHigh)\",\"https://www.anthropic.com/claude-fable-and-mythos-5-2\",\"Anthropic\",\"Proprietary\",1,null,1838,21,21,false,false,1215,11.04,8.0,40.0,\"1M\"],[\"Claude Opus 5.5 (Max)\",\"https://www.anthropic.com/claude-opus-5-5\",\"Anthropic\",\"Proprietary\",2,null,1815,12,12,false,false,4208,9.02,4.0,20.0,\"1M\"],[\"Claude Sonnet 5.5 (xHigh)\",\"https://www.anthropic.com/claude-sonnet-5-5\",\"Anthropic\",\"Proprietary\",3,null,1772,10,10,false,false,5895,3.02,2.0,10.0,\"1M\"],[\"Gemini 4 Carbon (High)\",\"https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/\",null,\"Proprietary\",4,null,1768,15,15,true,false,2120,1.61,2.0,10.0,null],[\"GPT-6 Astra (Max)\",\"https://openai.com/index/gpt-6-astra/\",null,\"Proprietary\",5,null,1764,9,9,false,false,8470,9.42,10.0,50.0,\"1.1M\"],[\"GPT-6.1 Sol (Max)\",\"https://openai.com/index/introducing-gpt-6-1-sol/\",null,\"Proprietary\",6,null,1743,10,10,false,false,5590,1.85,2.0,10.0,\"1.1M\"],[\"Claude Fable 5.1 (Max)\",\"https://www.anthropic.com/claude-fable-and-mythos-5-1\",\"Anthropic\",\"Proprietary\",7,null,1742,8,8,false,false,9800,11.47,10.0,50.0,\"1M\"],[\"Muse Wonder Full (Max)\",\"https://dev.meta.ai/models/muse-wonder\",\"Meta\",\"Proprietary\",8,null,1723,14,14,false,false,2068,null,null,null,null],[\"Claude Sonnet 5.5 (High)\",\"https://www.anthropic.com/claude-sonnet-5-5\",\"Anthropic\",\"Proprietary\",9,null,1715,8,8,false,false,7940,1.28,2.0,10.0,\"1M\"],[\"Gemini 4 Hydrogen (High)\",\"https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/\",null,\"Proprietary\",10,null,1704,14,14,true,false,1997,1.35,1.5,7.5,null],[\"Claude Opus 5 (Max)\",\"https://www.anthropic.com/news/claude-opus-5\",\"Anthropic\",\"Proprietary\",11,null,1691,6,6,false,false,19559,4.77,5.0,25.0,\"1M\"],[\"Kimi K3.1 Pro (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart\",null,\"Kimi K3.1 Pro License\",12,null,1687,10,10,false,false,4977,0.91,2.0,10.0,\"1M\"],[\"Gemini 4 Argon (High)\",\"https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/\",null,\"Proprietary\",13,null,1681,10,10,false,false,4991,1.16,2.0,10.0,\"1M\"],[\"GPT-6.1 Terra (Max)\",\"https://openai.com/index/introducing-gpt-6-1-terra/\",null,\"Proprietary\",14,null,1678,11,11,false,false,4016,0.65,1.0,5.0,\"1.1M\"],[\"Qwen3.8-Max (0902)\",\"https://www.qianwenai.com/models/qwen3.8-max-0902\",null,\"Proprietary\",15,null,1676,6,6,true,false,22099,1.89,2.0,6.0,null],[\"GPT-6 Sol (Max)\",\"https://openai.com/index/introducing-gpt-6-sol-and-luna/\",null,\"Proprietary\",16,null,1673,8,8,false,false,7326,1.76,2.0,10.0,\"1.1M\"],[\"Qwen3.8-Max\",\"https://www.qwencloud.com/models/qwen3.8-max\",null,\"Proprietary\",17,null,1670,12,12,true,false,3370,2.3,2.0,6.0,\"1M\"],[\"Ernie 5.5 Flash Preview\",\"https://ernie.baidu.com/release/ernie-5-5-flash-preview/\",null,\"Proprietary\",null,null,1668,16,16,false,true,null,null,0.28,1.13,null],[\"DeepSeek-V4.1-Flash-20261017 (Max)\",\"https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017\",null,\"MIT\",18,null,1664,7,7,false,false,14108,0.12,0.15,0.6,\"1M\"],[\"Kimi K3 (Max)\",\"https://platform.kimi.ai/docs/guide/kimi-k3-quickstart\",null,\"Kimi K3 license\",19,null,1658,6,6,false,false,22448,1.74,3.0,15.0,\"1M\"],[\"Claude Opus 5 (High)\",\"https://www.anthropic.com/news/claude-opus-5\",\"Anthropic\",\"Proprietary\",20,null,1657,5,5,false,false,26934,2.93,5.0,25.0,\"1M\"],[\"Muse Spark 1.3 (Max)\",\"https://developer.meta.com/ai/models/muse-spark/\",\"Meta\",\"Proprietary\",21,null,1655,7,7,false,false,12177,0.77,1.25,4.25,\"1M\"],[\"Muse Wonder (Max)\",\"https://research.meta.ai/blog/muse-wonder\",\"Meta\",\"Proprietary\",22,null,1647,9,9,false,false,5296,1.6,4.0,20.0,\"1M\"],[\"Inkling 2 Small\",\"https://thinkingmachines.ai/news/inkling-2-small/\",\"Thinking Machines\",\"Apache 2.0\",23,null,1647,19,19,true,false,990,0.31,0.3,1.0,null],[\"Grok 4.7 (xHigh)\",\"https://docs.x.ai/developers/models/grok-4.7\",null,\"Proprietary\",24,null,1641,8,8,false,false,8186,3.73,2.0,6.0,\"500K\"],[\"MiMo-V2.6-Flash\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",25,null,1638,8,8,false,false,8944,0.05,0.14,0.28,\"1.1M\"],[\"Hy4 preview\",\"https://hy.tencent.ai/research/hy4-preview\",\"Tencent\",\"Apache 2.0\",26,null,1632,10,10,true,false,4601,0.35,0.83,2.5,\"1M\"],[\"Claude Fable 5 (High)\",\"https://www.anthropic.com/news/claude-fable-5-mythos-5\",\"Anthropic\",\"Proprietary\",27,null,1625,6,6,false,false,16988,3.06,10.0,50.0,\"1M\"],[\"MiMo-V2.6-Pro\",\"https://mimo.xiaomi.com/mimo-v2-6\",null,\"MIT\",28,null,1625,8,8,false,false,8846,0.1,0.43,0.87,\"1.1M\"],[\"Qwen3.8-Flash-Next\",\"https://qwen.ai/blog?id=qwen3.8-flash-next\",null,\"qwen-community-1.0\",29,null,1624,7,7,true,false,11380,0.18,0.16,0.47,\"1M\"],[\"GLM-5.3 (Max)\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",30,null,1622,7,7,false,false,12695,1.38,1.4,4.4,\"1M\"],[\"DeepSeek-V4.1-Flash-20260910 (Max)\",\"https://www.deepseek.com/en/news/deepseek-v4-1-flash/\",null,\"MIT\",31,null,1621,11,11,false,false,3402,0.06,0.3,1.2,\"1M\"],[\"Muse Spark 1.3 (xHigh)\",\"https://developer.meta.com/ai/models/muse-spark/\",\"Meta\",\"Proprietary\",32,null,1620,7,7,false,false,11723,0.48,1.25,4.25,\"1M\"],[\"Grok 4.6 (High)\",\"https://docs.x.ai/developers/models/grok-4.6\",null,\"Proprietary\",33,null,1618,7,7,false,false,12195,1.57,1.6,4.8,\"500K\"],[\"GPT-5.6 Sol (xHigh, Codex Harness)\",\"https://openai.com/index/gpt-5-6/\",null,\"Proprietary\",34,null,1615,6,6,false,false,18903,1.47,4.0,20.0,\"1.1M\"],[\"U2 Flash\",\"https://www.unisound.com/en/u2flash\",\"Unisound\",\"Proprietary\",35,null,1613,17,17,false,false,1467,0.11,0.15,0.3,null],[\"GLM-5.3-Flash\",\"https://z.ai/blog/glm-5.3\",null,\"MIT\",36,null,1609,6,6,false,false,23608,0.15,0.05,0.18,\"1M\"],[\"Muse Ember (Max)\",\"https://research.meta.ai/blog/muse-ember\",\"Meta\",\"Proprietary\",37,null,1609,17,17,true,false,1339,0.03,0.1,0.5,null],[\"GLM-5.2 (Max)\",\"https://huggingface.co/zai-org/GLM-5.2\",null,\"MIT\",38,null,1608,6,6,false,false,17925,0.94,1.4,4.4,\"1M\"],[\"Claude Haiku 5.5 (High)\",\"https://www.anthropic.com/claude-haiku-5-5\",\"Anthropic\",\"Proprietary\",39,null,1593,8,8,false,false,6643,0.11,0.1,0.5,\"1M\"],[\"Qwen3.8-27B\",\"https://huggingface.co/Qwen/Qwen3.8-27B\",null,\"Apache 2.0\",40,null,1590,6,6,false,false,20860,0.41,0.4,3.0,null]],\"stats\":{\"n\":41,\"with_cost\":39,\"score_min\":1590,\"score_max\":1838,\"cost_min\":0.03,\"cost_max\":11.47}}}}";

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

/* ---------- model objects ---------- */
function hydrate(rows){
  return rows.map(a=>{
    const o={}; F.forEach((k,i)=>o[k]=a[i]);
    o.sLo=o.s-o.d95; o.sHi=o.s+o.u95;
    o.ratio = o.c>0 ? o.s/o.c : null;
    /* 榜面原始值：Arena 页面显示的那一版价格。所有时段/日期修正都从这里换算，
       永远不覆盖 cRaw —— 这样切换情景是无损的、可反复的。 */
    o.cRaw=o.c; o.pinRaw=o.pin; o.poutRaw=o.pout;
    return o;
  });
}
const DATASETS={};
for(const k in DATA.datasets){
  const d=DATA.datasets[k];
  DATASETS[k]={...d, models:hydrate(d.rows).filter(m=>m.s!=null)};
}

/* ---------- state ---------- */
const S={ds:'overall_os', mode:'pareto', ci:'point', lo:0, hi:1, minVotes:0, exPrelim:false, exAuto:true, onlyCost:true,
         maxCost:Infinity, sortKey:'s', sortDir:-1, base:null, playing:false};
let cur=null, view=null, tiers=[], frontier=[], adjusted=[];
const BASELINE=1200; // Arena BT 分数的实用地板：低于此基本等于「随机」

/* ==================== 价格情景引擎 ====================
   Arena 榜面的 Price $/M 是「某个时刻的标价」，而标价本身是a function of time：
     · DeepSeek 自 2026-08-16 起峰谷两档价，peak = 工作日 01:00–04:00 与 06:00–10:00 UTC，其余时段（含整个周末）半价
     · GLM-5.3-Flash 榜上仍是首发促销价，促销已于 2026-09-09 结束，现价约为其 3 倍
   Cost/Task = token 用量 × 单价，而 token 用量不随价格变，所以换算 = 按「加权单价比例」缩放榜面成本。
   m.cRaw 永远是榜面原值，任何情景都从它换算 → 切换无损、可反复。 */
const PRICE_EVENTS=[
  {id:'ds_tod', kind:'tod', conf:'official', name:'DeepSeek peak/off-peak pricing',
   windows:[[1,4],[6,10]], weekdaysOnly:true,
   desc:'Peak = weekdays 01:00–04:00 and 06:00–10:00 UTC; all other hours (incl. weekends) are half price. The board lists 20261017 at off-peak and 20260910 / the V4-Pro family at peak — one family, two conventions, one table.',
   src:'DeepSeek official pricing page; confirmed by four independent sources: datacamp / justinmckelvey / felloai / okamomedia',
   entries:{
     'DeepSeek-V4.1-Flash-20261017 (Max)':{listed:'off', peak:[0.30,1.20], off:[0.15,0.60]},
     'DeepSeek-V4.1-Flash-20260910 (Max)':{listed:'peak',peak:[0.30,1.20], off:[0.15,0.60]},
     'DeepSeek-V4-Pro':                   {listed:'peak',peak:[1.32,3.96], off:[0.66,1.98]},
     'DeepSeek-V4-Pro (High, 20260813)':  {listed:'peak',peak:[1.32,3.96], off:[0.66,1.98]},
     'DeepSeek-V4-Pro Preview (High)':    {listed:'peak',peak:[1.32,3.96], off:[0.66,1.98]}}},
  {id:'glm_promo', kind:'date', conf:'official', name:'GLM-5.3-Flash launch promo expired', date:'2026-09-09',
   desc:'Launch promo ended 2026-09-09: $0.05/$0.18 → $0.15/$0.50. The board (11-11 snapshot) still uses the promo price, so its $0.15 Cost/Task is really ~$0.44.',
   src:'benchr.org/pricing (2026-09-11 snapshot, states the promo end date)',
   entries:{'GLM-5.3-Flash':{listed:'before', before:[0.05,0.18], after:[0.15,0.50]}}},
  {id:'gem_dec1', kind:'date', conf:'official', future:true, name:'Gemini 4 Carbon/Argon hike on 12-01 (announced)', date:'2026-12-01',
   desc:'Intro pricing $2/$10 ends 2026-11-30; from 12-01 it is $4/$20 with cache read price $0.10 → $0.20. The board (11-11 snapshot) uses intro pricing. Drag the pricing date into December to watch Carbon collapse out of the overall_all frontier.',
   src:'Google Gemini API pricing page (benchlm.ai / munderdiffl.in / datastudios.org all agree; checked 2026-11-12/13)',
   entries:{
     'Gemini 4 Carbon (High)':{listed:'before',before:[2,10],after:[4,20]},
     'Gemini 4 Argon (High)': {listed:'before',before:[2,10],after:[4,20]}}},
  {id:'ds_v4flash', kind:'tod', conf:'suspected', name:'Does DeepSeek V4-Flash also split peak/off-peak? (uncertain)',
   windows:[[1,4],[6,10]], weekdaysOnly:true,
   desc:'V4-Flash is retired; public sources only confirm peak/off-peak pricing for V4.1-Flash and V4-Pro. Off by default — tick only for sensitivity analysis.',
   src:'insufficient evidence',
   entries:{
     'DeepSeek-V4-Flash (High)':        {listed:'peak',peak:[0.30,1.20],off:[0.15,0.60]},
     'DeepSeek-V4-Flash Preview (High)':{listed:'peak',peak:[0.30,1.20],off:[0.15,0.60]}}},
  {id:'suspect2x', kind:'date', conf:'suspected', name:'2× off vs a third-party index, no promo explanation (uncertain)', date:'2026-09-11',
   desc:'Mistral Medium 3.5 ($0.75/$3.75 vs index $1.50/$7.50) and GPT-6 Sol ($1/$5 vs $2/$10) are listed at exactly half of a third-party index. Could be a promo, or the index is stale. Off by default.',
   src:'benchr.org/pricing comparison',
   entries:{
     'Mistral Medium 3.5':{listed:'before',before:[0.75,3.75],after:[1.50,7.50]},
     'GPT-6 Sol (Max)':   {listed:'before',before:[1.00,5.00],after:[2.00,10.00]}}}
];
S.evState={}; PRICE_EVENTS.forEach(e=>{ S.evState[e.id] = (e.conf==='official'); });
S.hour=new Date().getUTCHours();          // 默认就是「now」
S.dow=new Date().getUTCDay();             // 0=Sun
S.dateISO=DATA.scraped;                   // 默认对齐数据快照日
S.outShare=1/12;                          // Output token share：Agent 榜实测输入/输出比中位约 11×
S.cacheHit=0.95;                            // Cache hit rate，默认 95%（agent 循环重读同一前缀的常见水平）
S.cacheSrc='pub';                           // Cache read-price source：pub=公布价 / flat=一律 10% / off=关闭
S.tz=0;                                   // 显示用时区偏移（小时）

/* 加权单价。Cost/Task = token 用量 × 单价，用量不随价格变，
   所以任何价格修正都能折算成「加权单价的比例」：w = Output token share。 */
function blend(pin,pout){ return pin*(1-S.outShare)+pout*S.outShare; }
function isPeakAt(ev,hour,dow){
  if(ev.weekdaysOnly && (dow===0||dow===6)) return false;
  return ev.windows.some(w=> hour>=w[0] && hour<w[1]);
}

/* ==================== 缓存折扣 ====================
   关键前提：Arena 的 Cost/Task 用的是**未命中（cache-miss）标价**——
   Agent 榜反推能对上 $4/$20 这类原价就是证据。所以榜面成本对「前缀会被反复重读」的
   agent 负载是系统性高估的，缓存折扣是往真实账单方向的修正。

   缓存只作用于**输入** token（输出永远不可能命中）。各家的「缓存读取价」都是其
   **输入标价的固定比例**，所以这里存比例而不是绝对值 —— 峰谷价、促销到期、未来涨价
   都会自动带着缓存价一起变（例：DeepSeek off-peak输入 $0.15，缓存价自动就是 $0.003）。

   写入倍率 wm：Anthropic（5 分钟档）与 OpenAI（30 分钟档）的缓存写入**单独计费**，
   = 输入价的 1.25×，未命中的那部分 token 要按写入价付；
   DeepSeek / Z.ai / 小米 / 腾讯 / Google（隐式缓存，不支持显式创建）/ xAI 不单独收写入费 → 1.0×。 */
const CACHE_RATIO={
  /* DeepSeek：cache-hit = cache-miss 的 2%（V4.1-Flash）/ 3.33%（V4-Pro），峰谷同比例 */
  'DeepSeek-V4.1-Flash-20261017 (Max)':0.02, 'DeepSeek-V4.1-Flash-20260910 (Max)':0.02,
  'DeepSeek-V4-Flash (High)':0.02,           'DeepSeek-V4-Flash Preview (High)':0.02,
  'DeepSeek-V4-Pro':0.0333, 'DeepSeek-V4-Pro (High, 20260813)':0.0333, 'DeepSeek-V4-Pro Preview (High)':0.0333,
  /* Moonshot Kimi：$0.20/$2、$0.30/$3 → 10%；K2.6 $0.16/$0.95 → 16.8%；K2.7 Code $0.19/$0.95 → 20% */
  'Kimi K3.1 Pro (Max)':0.10, 'Kimi K3 (Max)':0.10, 'Kimi K2.6':0.168, 'Kimi K2.7 Code':0.20,
  /* Z.ai GLM：$0.26/$1.40 → 18.6%；GLM-5.3-Flash $0.03/$0.15 → 20%；GLM-4.7 $0.11/$0.60 → 18.3% */
  'GLM-5.3 (Max)':0.186, 'GLM-5.2 (Max)':0.186, 'GLM-5.1':0.186, 'GLM-5.3-Flash':0.20, 'GLM-4.7':0.183,
  /* 小米 MiMo：99% 折扣，$0.0028/$0.14、$0.0036/$0.435 */
  'MiMo-V2.6-Flash':0.02, 'MiMo-V2.6-Pro':0.0083, 'MiMo-V2.5-Pro':0.0083,
  /* 腾讯 Hy3：cache read $0.033 / input $0.132 → 25% */
  'Hy3':0.25,
  /* Anthropic：Opus/Sonnet 5.5 读取 = 输入的 5%，Haiku 5.5 与 Opus 5 = 10%，Fable 系列 = 2.5% */
  'Claude Opus 5.5 (Max)':0.05, 'Claude Sonnet 5.5 (xHigh)':0.05, 'Claude Sonnet 5.5 (High)':0.05,
  'Claude Haiku 5.5 (High)':0.10, 'Claude Opus 5 (Max)':0.10, 'Claude Opus 5 (High)':0.10,
  'Claude Fable 5.2 (xHigh)':0.025, 'Claude Fable 5.1 (Max)':0.025, 'Claude Fable 5 (High)':0.025,
  /* OpenAI：GPT-6.1 Sol/Terra 读取 = 5%，GPT-6 Sol/Astra = 10% */
  'GPT-6.1 Sol (Max)':0.05, 'GPT-6.1 Terra (Max)':0.05, 'GPT-6 Sol (Max)':0.10, 'GPT-6 Astra (Max)':0.10,
  /* Google Gemini 4：$0.10/$2、$0.075/$1.50 → 5%（隐式缓存，≥4096 token 自动生效） */
  'Gemini 4 Argon (High)':0.05, 'Gemini 4 Carbon (High)':0.05, 'Gemini 4 Hydrogen (High)':0.05,
  /* xAI Grok：$0.50/$2 → 25%（≥200K 提示词另有一档 $1/$4，比例不变） */
  'Grok 4.7 (xHigh)':0.25, 'Grok 4.6 (High)':0.25,
  /* Mistral Large 4：$0.07/$0.68 → 10.3% */
  'Mistral Large 4':0.103
};
const CACHE_FALLBACK=0.10;   // 没查到公布价时的行业惯例：读取价 = 输入价的 10%
const CACHE_SRC={pub:'Published cache prices (missing → 10% estimate)', flat:'Flat 10% of input price for all (uniform conservative)', off:'Disable cache discount (= Arena board prices)'};
function cacheRatioOf(m){
  if(S.cacheSrc==='off') return null;
  if(S.cacheSrc==='flat') return {r:CACHE_FALLBACK, est:true};
  if(CACHE_RATIO[m.n]!=null) return {r:CACHE_RATIO[m.n], est:false};
  return {r:CACHE_FALLBACK, est:true};
}
function writeMultOf(m){ return /^(Claude|GPT-)/.test(m.n)?1.25:1.0; }

/* 解析某Model在 (hour, dow, dateISO) 的**标价**（峰谷 / 促销到期 / 已公告的未来涨价）。
   entries 里的 listed 描述的就是榜面显示的那一档，所以直接取目标档的绝对值。 */
function listPricesAt(m,hour,dow,dateISO){
  let pin=m.pinRaw, pout=m.poutRaw; const hits=[];
  if(pin==null||pout==null) return {pin,pout,hits};
  for(const ev of PRICE_EVENTS){
    if(!S.evState[ev.id]) continue;
    const e=ev.entries[m.n]; if(!e) continue;
    let want,listed,tag;
    if(ev.kind==='tod'){
      const pk=isPeakAt(ev,hour,dow);
      want=pk?e.peak:e.off; listed=(e.listed==='peak')?e.peak:e.off; tag=pk?'peak':'off-peak';
    }else{
      const after=String(dateISO)>=ev.date;
      want=after?e.after:e.before; listed=(e.listed==='after')?e.after:e.before;
      tag=ev.future?(after?'in effect':'not yet in effect'):(after?'after promo':'promo period');
      if(ev.future&&!after) continue;              // 未来事件在未生效时对List price没有修正意义
    }
    if(want[0]===listed[0]&&want[1]===listed[1]) continue;
    pin=want[0]; pout=want[1];
    hits.push({id:ev.id,name:ev.name,tag,listed,want,
               kIn:want[0]/listed[0], kOut:want[1]/listed[1]});
  }
  return {pin,pout,hits};
}
/* 某Model在 (hour, dow, dateISO) + 当前缓存口径下，榜面成本应乘的系数。
   分母恒为「榜面标价、不含缓存折扣」的加权单价 —— 因为 cRaw 就是这么算出来的。 */
function priceScale(m,hour,dow,dateISO){
  if(m.cRaw==null||m.pinRaw==null||m.poutRaw==null) return {scale:1,hits:[],cache:null};
  const L=listPricesAt(m,hour,dow,dateISO);
  const board=blend(m.pinRaw,m.poutRaw);
  if(!(board>0)) return {scale:1,hits:L.hits,cache:null};
  const cr=cacheRatioOf(m);
  let pinEff=L.pin, cache=null;
  if(cr){
    const wm=writeMultOf(m), h=S.cacheHit;
    pinEff=(1-h)*L.pin*wm + h*L.pin*cr.r;
    cache={r:cr.r,est:cr.est,wm,h,pc:L.pin*cr.r,pin:L.pin};
  }
  const scale=blend(pinEff,L.pout)/board;
  return {scale,hits:L.hits,cache};
}
/* 某Model一周 168 小时里的成本波动区间（与当前 T、Filters无关） */
function weekSpan(m){
  if(m.cRaw==null) return null;
  let lo=Infinity,hi=-Infinity,loAt=null,hiAt=null;
  for(let i=0;i<168;i++){ const {dow,hour}=dowHourOf(i);
    const c=m.cRaw*priceScale(m,hour,dow,S.dateISO).scale;
    if(c<lo){lo=c;loAt={dow,hour};} if(c>hi){hi=c;hiAt={dow,hour};} }
  return {lo,hi,loAt,hiAt,spread:lo>0?hi/lo:1};
}
/* 把当前情景写回全部Model的 m.c（m.cRaw 不动）。返回本数据集里被修正的Model。 */
function applyPriceScenario(){
  const adj=[];
  for(const k in DATASETS) for(const m of DATASETS[k].models){
    if(m.cRaw==null){ m.c=null; m.adj=null; continue; }
    const r=priceScale(m,S.hour,S.dow,S.dateISO);
    m.c=(Math.abs(r.scale-1)<1e-12)?m.cRaw:m.cRaw*r.scale;
    m.adj=(r.hits.length||r.cache)?{scale:r.scale,hits:r.hits,cache:r.cache}:null;
    if(m.adj&&k===S.ds) adj.push(m);
  }
  return adj;
}

/* 纯函数：某时刻下「分数 ≥ T 的最cheaperModel」。时间轴图逐小时调用它，不碰全局状态。 */
function cheapestAt(T,models,hour,dow,dateISO){
  let best=null;
  for(const m of models){
    if(m.s==null||m.s<T||m.cRaw==null) continue;
    const {scale}=priceScale(m,hour,dow,dateISO);
    const c=m.cRaw*scale;
    if(!best||c<best.c-1e-12||(Math.abs(c-best.c)<=1e-12&&m.s>best.m.s)) best={m,c,scale};
  }
  return best;
}

/* ---------- dataset select ---------- */
const dsSel=$('#ds');
Object.keys(DATASETS).forEach(k=>{
  const d=DATASETS[k];
  const o=document.createElement('option');
  o.value=k;
  /* License口径写在最前面 —— 「仅开源」和「含闭源」两张榜的最高分差 150 分，混看会误判 */
  const lic = d.license==='all' ? 'All-license · ' : 'Open-source · ';
  o.textContent=`${lic} ${d.label} · ${d.stats.n} models · Score ${d.stats.score_min}–${d.stats.score_max}`;
  dsSel.appendChild(o);
});
dsSel.value=S.ds;

function scoreExtent(){
  const d=DATASETS[S.ds];
  const s=d.models.map(m=>m.s);
  return [Math.min(...s), Math.max(...s)];
}
function loadDataset(resetRange=true){
  const d=DATASETS[S.ds];
  if(resetRange){ const [mn,mx]=scoreExtent(); S.lo=mn; S.hi=mx; }
  S.lo=clamp(S.lo, ...scoreExtent()); S.hi=clamp(S.hi, ...scoreExtent());
  if(S.lo>S.hi)[S.lo,S.hi]=[S.hi,S.lo];
  $('#dsNote').innerHTML=`${d.meta} · <b style="color:var(--dim)">${d.note}</b><br>`+
    `Score range <span class="mono">${d.stats.score_min}–${d.stats.score_max}</span> · `+
    `Cost/Task <span class="mono">${fmt$(d.stats.cost_min)}–${fmt$(d.stats.cost_max)}</span> · `+
    `with cost data <span class="mono">${d.stats.with_cost}/${d.stats.n}</span>`;
  const [mn,mx]=scoreExtent();
  $('#inLo').min=mn; $('#inLo').max=mx; $('#inHi').min=mn; $('#inHi').max=mx;
  const cs=d.models.filter(m=>m.c!=null).map(m=>m.c);
  $('#maxCost').max=Math.max(20, Math.ceil(Math.max(...cs,1)));
  recompute();
}

/* ---------- filtering + winner logic ---------- */
function candidates(){
  const d=DATASETS[S.ds];
  return d.models.filter(m=>{
    if(S.onlyCost && m.c==null) return false;
    if(S.exPrelim && m.pre) return false;
    if(S.exAuto && m.ae) return false;
    if(m.v!=null && m.v<S.minVotes) return false;
    if(m.c!=null && m.c>S.maxCost) return false;
    return true;
  });
}
function dominates(a,b){ // is a significantly better than b ?
  if(!a||!b) return false;
  if(S.ci==='strict') return a.sLo > b.sHi;
  return a.s > b.s;
}
function inBand(m){ return m.s>=S.lo && m.s<=S.hi; }

/* 门槛制：C(T) = min{ cost : score >= T }
   把Model按分数从高到低扫，只有当它比「已见过的所有更强Model」都cheaper时，才成为一档。
   得到的就是 (score, cost) 平面上的上包络 / 成本-能力 Pareto 前沿：分数越高，成本单调不减。
   每档统治的分数区间 = [下一档分数+1, 本档分数]，即「这个Model是该区间里唯一不被支配的选择」。 */
/* 给每一档标出它**真正统治**的门槛区间。
   推导：门槛为 T 时，达标集合 = {score ≥ T}，赢家 = 其中成本最低者。
   对第 i 档（分数 s_i，下一档更弱更cheaper、分数 s_{i+1}）：
     · T ≤ s_{i+1} 时下一档也达标，而它更cheaper → 赢家是下一档，不是本档；
     · T = s_{i+1}+1 时下一档刚好出局 → 从此起本档获胜；
     · T > s_i 时本档也不达标（除非它是顶档）→ 到 s_i 为止。
   所以 lower = s_{i+1}+1、upper = s_i；顶档 upper = 数据集最高分（门槛再高就是 degraded，
   工具仍返回顶档）；底档 lower = 候选集最低分（比它更弱的Model都更pricier，否则它们也会进前沿）。
   各档首尾相接、无缝无叠，完整覆盖 [候选集最低分, 数据集最高分]。 */
function setBounds(t, floor, mx){
  for(let i=0;i<t.length;i++) t[i].lower = i<t.length-1 ? t[i+1].model.s+1 : floor;
  for(let i=0;i<t.length;i++) t[i].upper = i>0 ? t[i].model.s : mx;
  return t;
}
function buildTiers(cands){
  if(!cands.length) return [];
  const desc=[...cands].sort((a,b)=> b.s-a.s || a.c-b.c);
  /* 区间端点用**滑块口径**（全榜分数域），不是候选集口径：
     被Filters挡掉的Model不参与竞争，但门槛仍能拖到它们的分数上，
     那时赢家还是底档/顶档 —— 标注必须覆盖工具真正能回答的整个范围。 */
  const [floor,mx]=scoreExtent();
  const raw=[]; let bestC=Infinity;
  for(const m of desc){
    if(m.c==null || !(m.c < bestC - 1e-12)) continue;
    bestC=m.c;
    raw.push({model:m, lower:0, upper:m.s});
  }
  setBounds(raw, floor, mx);
  if(S.ci!=='strict') return raw;
  /* 严格模式：若「更强的一档」与「更cheaper的一档」在 95% CI 上不可区分，
     就不该为这份统计噪声多付钱 → 合并，保留更cheaper的那个作为该段代表。 */
  let cur2=raw;
  for(let pass=0; pass<8 && cur2.length>1; pass++){
    const next=[]; let i=0;
    while(i<cur2.length){
      const a2=cur2[i], b2=cur2[i+1];
      if(b2 && !(a2.model.sLo > b2.model.sHi)){ next.push(b2); i+=2; }
      else { next.push(a2); i+=1; }
    }
    if(next.length===cur2.length) break;
    cur2=next;
    setBounds(cur2, floor, mx);
  }
  return cur2;
}
function frontierOf(cands){ return buildTiers(cands).map(t=>t.model); }

function winnerPareto(cands){
  tiers=buildTiers(cands);
  frontier=tiers.map(t=>t.model);
  if(!tiers.length) return null;
  /* tiers[0] = 分数最高的一档；索引越大 = 分数越低、越cheaper */
  /* tiers 按分数降序（tiers[0] 最强最pricier）。达标集合是前缀 tiers[0..k]，
     其中成本随索引单调递减 → 取最后一个达标者 = 满足 T 的最cheaperModel。 */
  let idx = tiers.map(t=>t.model.s>=S.hi).lastIndexOf(true);
  let degraded=false;
  if(idx<0){ idx=0; degraded=true; }                       // 门槛高于数据集最高分
  const w=tiers[idx].model;
  const nxt = idx>0 ? tiers[idx-1].model : null;             // 更强的一档（升级）
  const prv = idx<tiers.length-1 ? tiers[idx+1].model : null;// 更弱但更cheaper的一档（降级）
  let marginal=null;
  if(nxt && nxt.s>w.s && nxt.c>w.c)
    marginal={ds:nxt.s-w.s, dc:nxt.c-w.c, per:(nxt.c-w.c)/(nxt.s-w.s), model:nxt};
  let downStat=null;
  if(prv && w.s>prv.s && w.c>prv.c)
    downStat={ds:w.s-prv.s, dc:w.c-prv.c, per:(w.c-prv.c)/(w.s-prv.s), model:prv};
  const lo2=Math.max(S.lo,w.s), hi2=Math.min(S.hi,w.s);
  const band = lo2<=hi2 ? [lo2,hi2] : [w.s,w.s];
  return {mode:'pareto', w, band, bandOk:lo2<=hi2, degraded, tierIdx:idx,
          covers:[tiers[idx].lower, tiers[idx].upper],
          nxt, marginal, down:prv, downStat};
}
function winnerRatio(cands, useBaseline){
  tiers=[]; frontier=frontierOf(cands);
  const base = useBaseline ? BASELINE : 0;
  const scored=cands.map(m=>({m, val: useBaseline ? (m.s-base)/m.c : m.s/m.c})).filter(x=>isFinite(x.val)&&x.val>0);
  const inb=scored.filter(x=>inBand(x.m));
  const pool = inb.length?inb:scored;
  pool.sort((a,b)=>b.val-a.val);
  if(!pool.length) return null;
  const top=pool[0];
  const ups=cands.filter(m=>m.s>top.m.s && m.c>top.m.c)
    .map(m=>({m, ds:m.s-top.m.s, dc:m.c-top.m.c, per:(m.c-top.m.c)/(m.s-top.m.s)}))
    .sort((a,b)=>a.per-b.per);
  const dns=cands.filter(m=>m.s<top.m.s && m.c<top.m.c)
    .map(m=>({m, ds:top.m.s-m.s, dc:top.m.c-m.c, per:(top.m.s-m.s)/(top.m.c-m.c)}))
    .sort((a,b)=>b.per-a.per);
  return {mode:useBaseline?'baseline':'ratio', w:top.m, val:top.val, base,
          band:[S.lo,S.hi], bandOk:inb.length>0, nxt:ups[0]?ups[0].m:null,
          marginal:ups[0]?{ds:ups[0].ds,dc:ups[0].dc,per:ups[0].per,model:ups[0].m}:null,
          down:dns[0]?dns[0].m:null, downStat:dns[0]?{ds:dns[0].ds,dc:dns[0].dc,per:dns[0].per,model:dns[0].m}:null,
          inBand: inb.length>0};
}

function recompute(){
  adjusted=applyPriceScenario();   // 先把「now的价格」写进 m.c，后面所有逻辑自动跟随
  cur=candidates();
  cur.forEach(m=>{ m.ratio = m.c>0? m.s/m.c : null; });
  cur.forEach(m=>{ m.baseRatio = m.c>0? (m.s-BASELINE)/m.c : null; });
  const front=new Set(frontierOf(cur).map(m=>m.n));
  cur.forEach(m=>m.pareto=front.has(m.n));
  let res=null;
  if(S.mode==='pareto') res=winnerPareto(cur);
  else if(S.mode==='ratio') res=winnerRatio(cur,false);
  else res=winnerRatio(cur,true);
  view=res;
  render();
}

/* ---------- render: winner card ---------- */
/* ==================== ③ 一周 168 小时价格时间轴 ====================
   横轴 = Mon 00:00 → Sun 23:00（UTC），纵轴 = 该时刻满足门槛 T 的最低成本 C(T)。
   因为 DeepSeek 的峰谷价按「工作日 + 小时」循环，一周正好能画出完整的节律。 */
const DOWS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function peakAtAny(hour,dow){
  return PRICE_EVENTS.some(ev=> ev.kind==='tod' && S.evState[ev.id] && isPeakAt(ev,hour,dow));
}
function idxOf(dow,hour){ return (((dow+6)%7)*24)+hour; }          // 0=Mon00:00 … 167=Sun23:00
function dowHourOf(i){ const d=Math.floor(i/24); return {dow:(d+1)%7, hour:i%24}; }
function jumpToIdx(i){ const {dow,hour}=dowHourOf(i); S.dow=dow; S.hour=hour; syncPriceUI(); recompute(); }

/* 一周内每个时刻的 C(T) 与冠军。纯计算，图与摘要共用。 */
function weekCurve(T,models){
  const out=[];
  for(let i=0;i<168;i++){
    const {dow,hour}=dowHourOf(i);
    const r=cheapestAt(T,models,hour,dow,S.dateISO);
    out.push({i,hour,dow,c:r?r.c:null,n:r?r.m.n:null,peak:peakAtAny(hour,dow)});
  }
  return out;
}
/* 关掉全部价格事件时的 C(T) = 「List price」基准，用来量化修正带来的差别 */
function baselineCostAt(T,models,hour,dow,dateISO){
  const saved={}; PRICE_EVENTS.forEach(e=>saved[e.id]=S.evState[e.id]);
  PRICE_EVENTS.forEach(e=>S.evState[e.id]=false);
  const r=cheapestAt(T,models,hour,dow,dateISO);
  PRICE_EVENTS.forEach(e=>S.evState[e.id]=saved[e.id]);
  return r?r.c:null;
}
function renderTimeline(){
  const svg=$('#tl'), note=$('#tlNote'); svg.innerHTML='';
  const models=cur||[], T=S.hi;
  const pts=weekCurve(T,models);
  const cs=pts.filter(p=>p.c!=null).map(p=>p.c);
  if(!cs.length){
    note.textContent=`No model qualifies at threshold T=${T} (filtered out, or no cost data above this score). Lower the threshold or relax the filters.`;
    svg.appendChild(tx(20,40,'No model qualifies at the current threshold','lbl')); return;
  }
  const baseC=baselineCostAt(T,models,S.hour,S.dow,S.dateISO);
  const W=900,H=300,g={t:18,r:20,b:48,l:66},x0=g.l,x1=W-g.r,y0=H-g.b,y1=g.t;
  const sx=i=>x0+(i/167)*(x1-x0);
  let lo=Math.min(...cs), hi=Math.max(...cs);
  if(baseC!=null){ lo=Math.min(lo,baseC); hi=Math.max(hi,baseC); }
  if(hi-lo<1e-9){ lo*=0.96; hi*=1.04; }
  const pad=(hi-lo)*0.14; lo=Math.max(0,lo-pad); hi+=pad;
  const sy=v=>y0-((v-lo)/(hi-lo))*(y0-y1);

  let run=null;
  const flush=()=>{ if(run){ svg.appendChild(mk('rect',{x:sx(run.a),y:y1,width:Math.max(1,sx(run.b)-sx(run.a)),height:y0-y1,fill:'rgba(255,255,255,0.06)'})); run=null; } };
  pts.forEach(p=>{ if(p.peak){ if(!run)run={a:p.i}; run.b=p.i+1; } else flush(); }); flush();

  for(let d=0;d<7;d++){
    const i=d*24;
    svg.appendChild(mk('line',{x1:sx(i),y1:y1,x2:sx(i),y2:y0,stroke:'rgba(255,255,255,0.14)','stroke-width':1}));
    svg.appendChild(tx(sx(i+12),y0+17,DOWS[dowHourOf(i).dow],'lbl','middle'));
  }
  const ticks=niceTicks(Math.max(lo,1e-4),hi).filter(v=>v>=lo&&v<=hi);
  (ticks.length?ticks:[lo,hi]).forEach(v=>{
    svg.appendChild(mk('line',{x1:x0,y1:sy(v),x2:x1,y2:sy(v),stroke:'rgba(255,255,255,0.07)','stroke-width':1}));
    svg.appendChild(tx(x0-8,sy(v)+4,fmt$(v),'lbl','end'));
  });
  svg.appendChild(tx(x0-8,y1-8,'/task','lbl','end'));
  svg.appendChild(tx(x0,y0+36,'Peak windows = weekdays 01:00–04:00 & 06:00–10:00 UTC (gray); weekends are all off-peak','lbl','start'));

  if(baseC!=null){
    svg.appendChild(mk('line',{x1:x0,y1:sy(baseC),x2:x1,y2:sy(baseC),stroke:'rgba(255,255,255,0.38)','stroke-width':1.2,'stroke-dasharray':'5 4'}));
    svg.appendChild(tx(x1-2,sy(baseC)-6,'List price '+fmt$(baseC),'lbl','end'));
  }
  let dstr='';
  pts.forEach(p=>{ if(p.c==null)return; const Y=sy(p.c);
    dstr+=(dstr?' L':'M')+sx(p.i).toFixed(1)+' '+Y.toFixed(1)+' L'+sx(p.i+1).toFixed(1)+' '+Y.toFixed(1); });
  svg.appendChild(mk('path',{d:dstr,fill:'none',stroke:'var(--accent)','stroke-width':2.2,'stroke-linejoin':'round'}));

  let prev=null; const sw=[];
  pts.forEach(p=>{ if(p.n&&p.n!==prev){ if(prev!==null)sw.push(p); prev=p.n; } });
  sw.slice(0,8).forEach((p,k)=>{
    svg.appendChild(mk('line',{x1:sx(p.i),y1:y1,x2:sx(p.i),y2:y0,stroke:'var(--gold)','stroke-width':1,'stroke-dasharray':'3 3',opacity:0.6}));
    const nm=p.n.length>16?p.n.slice(0,15)+'…':p.n;
    svg.appendChild(tx(sx(p.i)+3,y1+30+(k%2)*0,nm,'lbl','start'));
  });

  const nowI=idxOf(S.dow,S.hour), nowP=pts[nowI];
  svg.appendChild(mk('line',{x1:sx(nowI),y1:y1,x2:sx(nowI),y2:y0,stroke:'var(--gold)','stroke-width':1.6}));
  if(nowP&&nowP.c!=null) svg.appendChild(mk('circle',{cx:sx(nowI),cy:sy(nowP.c),r:4.2,fill:'var(--gold)'}));
  svg.appendChild(tx(sx(nowI),y1-8,'now','lbl','middle'));

  const hit=mk('rect',{x:x0,y:y1,width:x1-x0,height:y0-y1,fill:'transparent',style:'cursor:crosshair'});
  hit.addEventListener('pointerdown',e=>{
    const r=svg.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width*W;
    jumpToIdx(Math.round(clamp((px-x0)/(x1-x0),0,1)*167));
  });
  svg.appendChild(hit);

  const uniq={}; pts.forEach(p=>{ if(p.c==null)return; if(!uniq[p.n])uniq[p.n]={h:0,c:p.c}; uniq[p.n].h++; });
  const peakH=pts.filter(p=>p.peak).length;
  const parts=Object.entries(uniq).sort((a,b)=>a[1].c-b[1].c).map(([n,v])=>`${n} <b class="mono">${fmt$(v.c)}</b>（${v.h} h）`).join(' · ');
  const diff=(baseC!=null&&nowP&&nowP.c!=null)?`(list price ${fmt$(baseC)}, ${nowP.c>baseC?'pricier':'cheaper'} by ${Math.round(Math.abs(nowP.c/baseC-1)*100)}%)`:'(same as list price)';
  note.innerHTML=`Threshold <b class="mono">T=${T}</b> · <b>${peakH}</b> peak hours per 168-hour week · `+
    `Now ${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00 UTC → <b style="color:var(--accent)">${nowP&&nowP.c!=null?fmt$(nowP.c):'—'}</b>, champion <b>${nowP&&nowP.n?nowP.n:'—'}</b>${diff}<br>`+
    `C(T) over the week: ${parts}`+
    (S.cacheSrc!=='off'?`<br><span style="color:var(--dim2)">Cache discount on (hit ${Math.round(S.cacheHit*100)}%): cache applies to input tokens only, compressing both absolute levels and peak/off-peak amplitude.</span>`:'');
}

/* ---------- 价格情景控件 ---------- */
function EV_OFF_ALL(){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=false); }
/* 两个一键情景（按钮与测试共用同一份定义，避免两边漂移） */
function SCEN_BOARD(){ EV_OFF_ALL(); S.cacheSrc='off'; }                       // 榜面原样
function SCEN_ALL(){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=true); S.cacheSrc='pub'; }  // 全部启用
/* 缓存口径Notes：实时统计有多少Model用的是公布价、多少是推算 */
function cacheHintHTML(){
  if(S.cacheSrc==='off')
    return `Off → all input tokens bill at <b>cache-miss prices</b> — exactly <b>Arena's leaderboard Cost/Task basis</b>.`;
  const ms=(cur&&cur.length)?cur:[];
  let pub=0,est=0,na=0;
  for(const m of ms){
    if(m.pinRaw==null){ na++; continue; }
    if(S.cacheSrc==='flat') est++;
    else if(CACHE_RATIO[m.n]!=null) pub++;
    else est++;
  }
  const h=S.cacheHit, wmNote='Anthropic / OpenAI bill cache writes separately (= 1.25× input price) and the missed share is paid at the write price; other providers charge no write fee.';
  return `Hit rate <b class="mono">${Math.round(h*100)}%</b>: ${Math.round(h*100)}% of input tokens bill at cache-read prices, ${Math.round((1-h)*100)}% at (write-multiplier-inclusive) miss prices; <b>output tokens are never discounted</b>, so even a 100% hit rate can't reach zero.`+
    `${pub} models in the candidate set use published cache prices, ${est} estimated at 10%${na?`, ${na} without published prices (N/A)`:''}。${wmNote}`+
    `<br><b>Note</b>: Arena's Cost/Task is computed at <b>cache-miss prices</b> (the Agent board's inferred $4/$20 list prices are the proof), so enabling the cache discount is a hypothetical — "if your workload really hits this often" — not the board's own meaning.`;
}
$('#cacheHit').oninput=e=>{ S.cacheHit=clamp((+e.target.value||0)/100,0,1); syncPriceUI(); recompute(); };
$('#cacheHitN').onchange=e=>{ S.cacheHit=clamp((+e.target.value||0)/100,0,1); syncPriceUI(); recompute(); };
$('#cacheSrc').onchange=e=>{ S.cacheSrc=e.target.value; syncPriceUI(); recompute(); };
document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{
  S.cacheHit=(+b.dataset.ch)/100; if(S.cacheSrc==='off') S.cacheSrc='pub';
  stopPlay(); syncPriceUI(); recompute();
});
function renderEvList(){
  const c=$('#evList'); c.innerHTML='';
  PRICE_EVENTS.forEach(ev=>{
    const n=Object.keys(ev.entries).length;
    const wrap=el('div',null,'');
    wrap.setAttribute('style','margin-bottom:7px;padding:7px 8px;border:1px solid rgba(255,255,255,.09);border-radius:7px');
    const lab=el('label',null,'');
    lab.setAttribute('style','display:flex;gap:7px;align-items:flex-start;font-size:12.5px;cursor:pointer');
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!S.evState[ev.id];
    cb.setAttribute('style','width:auto;margin-top:2px');
    cb.onchange=()=>{ S.evState[ev.id]=cb.checked; recompute(); };
    const conf=ev.conf==='official'
      ? '<span class="pill" style="padding:0 5px;background:rgba(80,200,120,.16);color:var(--good)">verified</span>'
      : '<span class="pill warn" style="padding:0 5px">uncertain</span>';
    const sp=el('span',null,'');
    sp.innerHTML=`${conf} <b>${ev.name}</b> <span style="color:var(--dim2)">· ${n} models</span><br>`+
      `<span style="color:var(--dim);font-size:11.5px">${ev.desc}<br>Source: ${ev.src}</span>`;
    lab.appendChild(cb); lab.appendChild(sp); wrap.appendChild(lab); c.appendChild(wrap);
  });
}
function syncPriceUI(){
  $('#hour').value=String(S.hour); $('#dow').value=String(S.dow);
  $('#dateIso').value=S.dateISO; $('#tz').value=String(S.tz);
  $('#outShare').value=String(Math.round(S.outShare*100));
  $('#hourUtc').textContent=`${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00`;
  const lh=(S.hour+S.tz+48)%24;
  $('#hourLocal').textContent=`${String(Math.floor(lh)).padStart(2,'0')}:00`;
  const pk=peakAtAny(S.hour,S.dow), pill=$('#peakPill');
  pill.textContent=pk?'peak (2×)':'off-peak (½ price)';
  pill.setAttribute('class','pill '+(pk?'warn':''));
  pill.setAttribute('style','padding:0 6px');
  $('#osLab').textContent=Math.round(S.outShare*100)+'%';
  const chP=Math.round(S.cacheHit*100);
  $('#cacheHit').value=String(chP); $('#cacheHitN').value=String(chP);
  $('#cachePill').textContent = S.cacheSrc==='off'?'off':chP+'%';
  $('#cacheSrc').value=S.cacheSrc;
  $('#cacheHint').innerHTML=cacheHintHTML();
  $('#osHint').innerHTML=`Output share decides how a "unit-price change" converts into a "Cost/Task change". Default <b class="mono">8%</b> = input:output 11:1, from measured inference on 14 Agent-board models (ratios 3.8–17.9×).`+
    (S.cacheSrc==='off'
      ? `With cache discount off, DeepSeek's peak/off-peak moves input and output <b>proportionally</b> and this slider has <b>no effect</b> on it; it only matters for corrections like GLM's input ×3 / output ×2.8.`
      : `<b>With cache discount on, this slider becomes critical</b>: cache discounts input only, so the higher the output share, the thinner the discount. At the same 95% hit rate, DeepSeek-20261017 saves 86% at w=2%, 68% at w=8% (default), 55% at w=15%, 40% at w=25%, and only 25% at w=40%.`);
}
$('#hour').oninput=e=>{ S.hour=+e.target.value; syncPriceUI(); recompute(); };
$('#dow').onchange=e=>{ S.dow=+e.target.value; syncPriceUI(); recompute(); };
$('#tz').onchange=e=>{ S.tz=+e.target.value; syncPriceUI(); };
$('#dateIso').onchange=e=>{ if(e.target.value){ S.dateISO=e.target.value; syncPriceUI(); recompute(); } };
$('#outShare').oninput=e=>{ S.outShare=(+e.target.value)/100; syncPriceUI(); recompute(); };
document.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{
  const k=b.dataset.pk;
  if(k==='now'){ const d=new Date(); S.hour=d.getUTCHours(); S.dow=d.getUTCDay(); }
  else if(k==='sat'){ S.dow=6; S.hour=12; }
  else if(k==='board'){ SCEN_BOARD(); S.dow=3; S.hour=12; S.cacheHit=0.95; }
  else if(k==='all'){ SCEN_ALL(); S.dow=3; S.hour=2; }
  else { S.dow=3; S.hour=(k==='peak')?2:12; }
  renderEvList(); stopPlay(); syncPriceUI(); recompute();
});
/* 被时间情景修正的Model清单（提示区） */
function renderAdjNote(){
  const n=$('#adjNote'); if(!n) return;
  const on=PRICE_EVENTS.filter(e=>S.evState[e.id]);
  if(!on.length){ n.innerHTML='<span style="color:var(--dim2)">All corrections off → the board as listed. Tick any rule above to see time effects.</span>'; return; }
  const adj=(cur||[]).filter(m=>m.adj);
  if(!adj.length){ n.innerHTML='No model in the current candidate set is affected by the enabled corrections ('+on.map(e=>e.name).join('、')+'）。'; return; }
  const peak=peakAtAny(S.hour,S.dow);
  n.innerHTML=`<b>${peak?'Peak':'Off-peak'} · ${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00 UTC</b>: <b>${adj.length}</b> models in the candidate set get rewritten → `+
    adj.map(m=>`${m.n} <span class="mono" style="text-decoration:line-through;color:var(--dim2)">${fmt$(m.cRaw)}</span> → <b class="mono" style="color:var(--accent)">${fmt$(m.c)}</b>`).join('；');
}
/* 修正原因的简短标签（徽标 / KPI 副标题用） */
function adjLabel(m){
  if(!m.adj) return 'List price';
  const p=[];
  for(const x of m.adj.hits)
    p.push(`${x.tag} ×${(Math.abs(x.kIn-x.kOut)<1e-9?x.kIn.toFixed(2):x.kIn.toFixed(2)+'/'+x.kOut.toFixed(2))}`);
  if(m.adj.cache) p.push(`cache ${Math.round(m.adj.cache.h*100)}%${m.adj.cache.est?' (est.)':''}`);
  return p.length?p.join(' · '):'List price';
}
/* 成本单元格：被时间情景修正过的，同时显示榜面原值 */
function costCell(m){
  if(m.c==null) return '<span style="color:var(--dim2)">—</span>';
  if(!m.adj) return fmt$(m.c);
  const why=m.adj.hits.map(x=>`${x.name}·${x.tag} input ×${x.kIn.toFixed(2)} output ×${x.kOut.toFixed(2)}`).join('；')+
    (m.adj.cache?`&#10;Cache hit ${Math.round(m.adj.cache.h*100)}%: read price ${fmt$(m.adj.cache.pc)}/M (${m.adj.cache.est?'10%-of-input estimate':'published'}), write multiplier ${m.adj.cache.wm}×`:'')+
    `&#10;Total ×${m.adj.scale.toFixed(3)}`;
  return `<span title="List ${fmt$(m.cRaw)} → current scenario ${fmt$(m.c)}&#10;${why}" style="cursor:help">${fmt$(m.c)}<sup style="color:var(--gold)">◷</sup></span>`+
         ` <span style="color:var(--dim2);font-size:10.5px;text-decoration:line-through">${fmt$(m.cRaw)}</span>`;
}
renderEvList(); syncPriceUI();

function render(){
  renderWinner(); renderScatter(); renderSteps(); renderTimeline(); renderTiers(); renderTable(); renderBadges(); syncInputs(); renderAdjNote();
}
function renderBadges(){
  const d=DATASETS[S.ds];
  $('#topBadges').innerHTML='';
  const add=(t,c)=>$('#topBadges').appendChild(el('span','pill '+ (c||''),t));
  add(`${d.stats.n} models`); add(`${d.stats.with_cost} with Cost/Task`,'good');
  add(`${cur.filter(inBand).length} in range`,'gold');
  add(`Pareto frontier: ${frontier.length} tiers`,'good');
  const onEv=PRICE_EVENTS.filter(e=>S.evState[e.id]);
  if(onEv.length){
    const pk=peakAtAny(S.hour,S.dow);
    add(`${pk?'Peak':'Off-peak'} · ${DOWS[S.dow]} ${String(S.hour).padStart(2,'0')}:00 UTC`, pk?'warn':'');
    const nAdj=(cur||[]).filter(m=>m.adj).length;
    if(nAdj) add(`Prices time-adjusted: ${nAdj} models`,'gold');
  } else add('List price (no time adjustment)');
  add(S.cacheSrc==='off'?'Cache discount: off':`Cache hit ${Math.round(S.cacheHit*100)}%`, S.cacheSrc==='off'?'':'good');
  if(S.ci==='strict') add('Strict CI mode','warn');
}
function renderWinner(){
  const c=$('#winCard'); c.innerHTML='';
  if(!view){
    const d0=DATASETS[S.ds];
    c.appendChild(el('div','empty', d0.stats.with_cost===0
      ? 'This board has no Cost/Task data — an entirely empty cost column cannot support value analysis (the WebDev · HTML board on arena.ai is exactly like this). Pick a board with a cost column.'
      : 'No model passes the current filters — relax "Min votes", "Cost/Task cap", or "Exclude Preliminary".'));
    return;
  }
  const m=view.w;
  const modeName={pareto:'Threshold: cheapest model with score ≥ T',ratio:'max Score/$',baseline:'max excess score/$'}[view.mode];
  c.appendChild(el('div','k', `Current mode · ${modeName} · ${S.ci==='strict'?'strict CI':'point estimate'}`));
  const nm=el('div','nm');
  nm.innerHTML=`<span class="rank">#${m.r!=null?m.r:'—'}</span>${m.n}`;
  c.appendChild(nm);
  c.appendChild(el('div','by', `${m.lab?m.lab+' · ':''}<span class="mono">${m.lic||'license unknown'}</span>${m.pre?' · <span class="pill warn" style="padding:0 5px">Preliminary</span>':''}${m.ae?' · <span class="pill bad" style="padding:0 5px">AutoEval</span>':''}${m.pareto?' · <span class="pill good" style="padding:0 5px">Pareto frontier</span>':' <span class="pill" style="padding:0 5px">dominated</span>'}`));

  const k=el('div','kpis');
  const kpi=(t,v,cl,s)=>{const d=el('div','kpi '+(cl||''));d.innerHTML=`<div class="t">${t}</div><div class="v">${v}${s?` <small>${s}</small>`:''}</div>`;k.appendChild(d);};
  kpi('Arena Score', m.s, 'gold', `+${m.u95}/−${m.d95}`);
  kpi('Cost / Task (P50)', m.adj?`${fmt$(m.c)}<small style="color:var(--dim2);text-decoration:line-through">${fmt$(m.cRaw)}</small>`:fmt$(m.c), 'accent',
      m.adj?adjLabel(m):'List price (no time/cache adjustment)');
  kpi('Score / $', fmtR(m.ratio,0), '', 'pts/$');
  if(view.mode==='baseline') kpi('Excess score / $', fmtR(m.baseRatio,1),'good', `Baseline ${view.base}`);
  kpi('Votes', fmtN(m.v));
  if(m.pin!=null && m.adj && m.adj.cache){
    const cc=m.adj.cache, eff=(1-cc.h)*cc.pin*cc.wm + cc.h*cc.pc;
    kpi('API price $/M', `${fmt$(eff)} / ${fmt$(m.pout)}`, 'good',
        `Effective input price (hit ${Math.round(cc.h*100)}%${cc.est?'·est.':''}) · list ${fmt$(cc.pin)}`);
  } else kpi('API price $/M', m.pin!=null?`${fmt$(m.pin)} / ${fmt$(m.pout)}`:'N/A','', 'in / out');
  kpi('Context', m.ctx||'N/A');
  kpi('Overall rank', m.or!=null?`#${m.or}`:'—');
  c.appendChild(k);

  const v=el('div','verdict');
  let html='';
  if(view.mode==='pareto'){
    const cov=view.covers.map(Math.round);
    html+=`<b>Verdict:</b> below the threshold <span class="mono">T = ${S.hi}</span> (range <span class="mono">[${S.lo}, ${S.hi}]</span>),`+
      `<span class="em">${m.n}</span> is <b>the cheapest model that clears the capability bar</b>.<br>`+
      `It rules the score range <span class="mono">[${cov[0]}, ${cov[1]}]</span> — within it, every higher-scoring model costs more and every cheaper model scores lower (mutually undominated).<br>`;
    if(view.degraded)
      html+=`<span class="warn">⚠ Your threshold ${S.hi} exceeds this dataset's top score ${DATASETS[S.ds].stats.score_max}; no model qualifies — what follows is the strongest, relatively cheapest one.</span><br>`;
    if(!view.bandOk)
      html+=`<span class="warn">⚠ Its score ${m.s} is below your lower bound ${S.lo}: no Pareto-optimal model exists in [${S.lo}, ${S.hi}] because the stronger tier costs more and the cheaper tier scores lower. This is a blind spot of range-style questions — threshold mode only needs one T.</span><br>`;
    const ws=weekSpan(m);
    if(ws && ws.spread>1.0001){
      html+=`<b>Weekly price swing:</b> this champion's own cost bottoms at <span class="mono">${fmt$(ws.lo)}</span> on ${DOWS[ws.loAt.dow]} ${String(ws.loAt.hour).padStart(2,'0')}:00 UTC and`+
        `peaks at <span class="mono">${fmt$(ws.hi)}</span> on ${DOWS[ws.hiAt.dow]} ${String(ws.hiAt.hour).padStart(2,'0')}:00 UTC (${ws.spread.toFixed(2)}× apart).`+
        `Scheduling tasks into off-peak windows is a free <b>${Math.round((1-ws.lo/ws.hi)*100)}%</b> discount at this threshold.<br>`;
    }
    if(view.marginal){
      const g=view.marginal;
      html+=`<b>↑ Next tier up:</b> ${g.model.n} (${g.model.s} pts, ${fmt$(g.model.c)}) → pay <b class="mono">${fmt$(g.dc)}</b> more for <b class="mono">+${g.ds}</b> pts;`+
        `marginal price <span class="mono">${fmt$(g.per)}/pt</span>.`;
      html+= g.per>2 ? ` <span class="warn">This tier is expensive — only worth it if you truly need the capability.</span>`
                     : g.per<0.15 ? ` <span class="em">The upgrade is a bargain.</span>` : ` — a normal range.`;
      html+=`<br>`;
    } else {
      html+=`<b>↑ Next tier up:</b> none — it's already this dataset's capability ceiling.<br>`;
    }
    if(view.downStat){
      const g=view.downStat;
      html+=`<b>↓ One tier down:</b> ${g.model.n} (${g.model.s} pts, ${fmt$(g.model.c)}) → save <span class="mono">${fmt$(g.dc)}</span> but lose <span class="mono">${g.ds}</span> pts;`+
        `i.e. giving up <span class="mono">${fmtR(1/g.per,1)}</span> pts per dollar saved.`;
      html+= (1/g.per)>15 ? ` <span class="warn">Too much capability given up — the saving isn't worth it.</span>` : ` If budget is tight, this tier is acceptable.`;
    }
  } else {
    html+=`<b>Verdict:</b> within the score range <span class="mono">[${S.lo}, ${S.hi}]</span> (${cur.filter(inBand).length} models in range),`+
      `ranked by ${view.mode==='ratio'?'Score÷Cost':'(Score−'+view.base+')÷Cost'}, the top model is <span class="em">${m.n}</span> = <b class="mono">${fmtR(view.val,1)}</b>.`;
    if(!view.inBand) html+=` <span class="warn">Note: no qualifying model in range; this result is from the full domain.</span>`;
    html+=`<br>`;
    if(view.marginal){
      const g=view.marginal;
      html+=`<b>But note:</b> ${g.model.n} scores higher (${g.model.s}) at a marginal price of <span class="mono">${fmt$(g.per)}/pt</span>.`+
        `The top "score per $" model is often not the one you should use — it's just the cheapest per point, and may lack absolute capability.<br>`;
    }
    html+=`<span class="warn">⚠ Modes ② and ③ are systematically biased:</span> Arena Score is a Bradley-Terry-style rating with a ~1000+ baseline offset,`+
      `so ② "score per $" almost always picks cheap models; ③ subtracts the practical 1200 floor to cancel the offset, getting closer to true marginal value.`;
  }
  // 统计可靠性
  const rel = m.v==null ? null : (m.v<1000?'low':m.v<5000?'mid':'high');
  if(rel){
    const cl = rel==='low'?'warn':rel==='mid'?'':'em';
    html+=`<br><b>Reliability:</b> <span class="${cl}">${rel}</span> (${fmtN(m.v)} votes, CI ±${Math.max(m.u95,m.d95)}).`;
    if(rel==='low') html+=` <span class="warn">Sample too small — this "value champion" may be pure noise. Don't make purchasing decisions on it.</span>`;
  }
  if(m.c==null) html+=`<br><span class="warn">Cost/Task missing</span> — Arena doesn't publish this model's median task cost, so it can't take part in value comparisons.`;
  v.innerHTML=html; c.appendChild(v);
}

/* ---------- render: scatter ---------- */
const LX={w:900,h:430,m:{t:18,r:16,b:38,l:60}};
const NS='http://www.w3.org/2000/svg';
const mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};
const tx=(x,y,str,cls,anchor)=>{const t=mk('text',{x,y,class:cls||'','text-anchor':anchor||'start'});t.textContent=str;return t;};
function logScale(v,lo,hi){ const a=Math.log10(lo),b=Math.log10(hi); return (Math.log10(v)-a)/(b-a); }
function niceTicks(lo,hi){
  const out=[]; const e0=Math.floor(Math.log10(lo)), e1=Math.ceil(Math.log10(hi));
  for(let e=e0;e<=e1;e++) for(const m of [1,2,5]){ const v=m*Math.pow(10,e); if(v>=lo*0.999&&v<=hi*1.001) out.push(v); }
  return out.length?out:[lo,hi];
}
let scatGeo=null;
function renderScatter(){
  const svg=$('#scat'); svg.innerHTML='';
  const pts=cur.filter(m=>m.c!=null&&m.c>0);
  if(pts.length<2){ svg.appendChild(tx(20,40,'Need at least 2 models with cost data','lbl')); return; }
  const {w,h,m}=LX, x0=m.l, x1=w-m.r, y0=h-m.b, y1=m.t;
  const sLo=Math.min(...cur.map(v=>v.sLo)), sHi=Math.max(...cur.map(v=>v.sHi));
  const pad=(sHi-sLo)*0.05||10, dMin=sLo-pad, dMax=sHi+pad;
  const sx=v=>x0+(v-dMin)/(dMax-dMin)*(x1-x0);
  const cMin=Math.min(...pts.map(v=>v.c))*0.78, cMax=Math.max(...pts.map(v=>v.c))*1.3;
  const sy=v=>y0-logScale(clamp(v,cMin,cMax),cMin,cMax)*(y0-y1);
  scatGeo={sx,x0,x1,dMin,dMax,w};

  // 当前分数区间
  const bx0=sx(S.lo), bx1=sx(S.hi);
  svg.appendChild(mk('rect',{x:Math.min(bx0,bx1),y:y1,width:Math.max(1,Math.abs(bx1-bx0)),height:y0-y1,class:'band'}));
  // 网格 + 轴
  niceTicks(cMin,cMax).forEach(t=>{
    const y=sy(t);
    svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y,y2:y,class:'grid-l'}));
    svg.appendChild(tx(x0-8,y+3,fmt$(t),'','end'));
  });
  const step=Math.max(10,Math.round((dMax-dMin)/9/10)*10);
  for(let t=Math.ceil(dMin/step)*step;t<=dMax;t+=step){
    const x=sx(t);
    svg.appendChild(mk('line',{x1:x,x2:x,y1:y0,y2:y0+5,class:'ax'}));
    svg.appendChild(tx(x,y0+17,String(t),'','middle'));
  }
  svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y0,y2:y0,class:'ax'}));
  const yl=tx(16,(y0+y1)/2,'Cost / Task (P50) · log axis','','middle');
  yl.setAttribute('transform',`rotate(-90 16 ${(y0+y1)/2})`); svg.appendChild(yl);
  svg.appendChild(tx((x0+x1)/2,h-3,'Arena Score (stronger → right)','','middle'));

  // Pareto 前沿（阶梯折线）
  if(frontier.length>1){
    const fr=[...frontier].sort((a,b)=>a.s-b.s);
    let d=`M${sx(fr[0].s)},${sy(fr[0].c)}`;
    for(let i=0;i<fr.length;i++){
      const y=sy(fr[i].c), nx=i<fr.length-1?sx(fr[i+1].s):x1;
      d+=`L${nx},${y}`;
      if(i<fr.length-1) d+=`L${nx},${sy(fr[i+1].c)}`;
    }
    svg.appendChild(mk('path',{d,class:'frontier'}));
  }
  // 拖动分数线（放在点下面，点仍可点击）
  const hit=mk('rect',{x:x0,y:y1,width:x1-x0,height:y0-y1,fill:'transparent',style:'cursor:ew-resize'});
  let drag=false;
  const toScore=e=>{
    const r=svg.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width*w;
    return Math.round(clamp(dMin+(px-x0)/(x1-x0)*(dMax-dMin), scoreExtent()[0], scoreExtent()[1]));
  };
  hit.addEventListener('pointerdown',e=>{drag=true;hit.setPointerCapture(e.pointerId);const v=toScore(e);S.hi=v;if(S.lo>v)S.lo=v;stopPlay();recompute();});
  hit.addEventListener('pointermove',e=>{if(!drag)return;const v=toScore(e);S.hi=v;if(S.lo>v)S.lo=v;recompute();});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>hit.addEventListener(ev,()=>drag=false));
  svg.appendChild(hit);

  // 数据点
  const wn = view&&view.w?view.w.n:null;
  const labelBudget = frontier.length<=16;
  pts.forEach(mm=>{
    const g=mk('g',{class:'dot'});
    const isW = mm.n===wn;
    if(mm.u95||mm.d95)
      g.appendChild(mk('line',{x1:sx(mm.s-mm.d95),x2:sx(mm.s+mm.u95),y1:sy(mm.c),y2:sy(mm.c),class:'ci',
        stroke:isW?'#f5c542':(mm.pareto?'#3ddc97':'#5b6a82')}));
    g.appendChild(mk('circle',{cx:sx(mm.s),cy:sy(mm.c),r:isW?7.5:(mm.pareto?4.8:3),
      fill:isW?'#f5c542':(mm.pareto?'#3ddc97':'#39445a'),
      stroke:isW?'#fff':'none','stroke-width':isW?2:0,opacity:isW||mm.pareto?1:.8}));
    if(mm.adj) g.appendChild(mk('circle',{cx:sx(mm.s),cy:sy(mm.c),r:(isW?7.5:(mm.pareto?4.8:3))+4,
      fill:'none',stroke:'var(--gold)','stroke-width':1.2,'stroke-dasharray':'3 3',opacity:.85}));
    if(isW||(mm.pareto&&labelBudget)){
      const anchor = sx(mm.s) > x1-190 ? 'end' : 'start';
      const dx = anchor==='end'? -10 : 9;
      g.appendChild(tx(sx(mm.s)+dx, sy(mm.c)+3.5, mm.n.length>28?mm.n.slice(0,27)+'…':mm.n, isW?'lblw':'lbl', anchor));
    }
    const t=mk('title'); t.textContent=`${mm.n}\nScore ${mm.s} (+${mm.u95}/-${mm.d95})\nCost/Task ${fmt$(mm.c)}\nVotes ${fmtN(mm.v)}\nAPI ${mm.pin!=null?fmt$(mm.pin)+' / '+fmt$(mm.pout)+' $/M':'N/A'}\n${mm.pareto?'◆ Pareto frontier (undominated)':'Dominated: a higher-scoring, cheaper model exists'}\nclick = set the score range's upper bound to this model`; g.appendChild(t);
    g.addEventListener('click',()=>{ S.hi=mm.s; if(S.lo>mm.s)S.lo=mm.s; stopPlay(); recompute(); });
    svg.appendChild(g);
  });
  // 分数线 T
  svg.appendChild(mk('line',{x1:sx(S.hi),x2:sx(S.hi),y1:y1-8,y2:y0,class:'tline'}));
  svg.appendChild(tx(sx(S.hi)+5,y1-1,`Threshold T = ${S.hi}`,'lblw')).setAttribute('fill','#f5c542');
  if(S.lo<S.hi) svg.appendChild(tx(sx(S.lo)-5,y1-1,`lo = ${S.lo}`,'lbl','end'));
}

/* ---------- render: step chart ---------- */
function renderSteps(){
  const svg=$('#steps'); svg.innerHTML='';
  if(!tiers.length){
    svg.appendChild(tx(20,40,'The step chart only exists in ① Threshold mode — it is exactly the curve "threshold T → cheapest model of that tier"','lbl'));
    return;
  }
  const w=900,h=250,m={t:20,r:16,b:42,l:60},x0=m.l,x1=w-m.r,y0=h-m.b,y1=m.t;
  const sTop = DATASETS[S.ds].stats.score_max;
  const fr=[...tiers].sort((a,b)=>a.model.s-b.model.s);
  const sLo=Math.min(...fr.map(t=>t.model.s))-10, sHi=Math.max(sTop, Math.max(...fr.map(t=>t.upper||t.model.s)))+10;
  const cs=fr.map(t=>t.model.c).filter(c=>c>0);
  if(!cs.length){ svg.appendChild(tx(20,40,'No model with cost data on the frontier','lbl')); return; }
  const cMin=Math.min(...cs)*0.72, cMax=Math.max(...cs)*1.45;
  const sx=v=>x0+(v-sLo)/(sHi-sLo)*(x1-x0);
  const sy=v=>y0-logScale(clamp(v,cMin,cMax),cMin,cMax)*(y0-y1);
  niceTicks(cMin,cMax).forEach(t=>{
    const y=sy(t);
    svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y,y2:y,class:'grid-l'}));
    svg.appendChild(tx(x0-8,y+3,fmt$(t),'','end'));
  });
  const step=Math.max(10,Math.round((sHi-sLo)/9/10)*10);
  for(let t=Math.ceil(sLo/step)*step;t<=sHi;t+=step){
    const x=sx(t);
    svg.appendChild(mk('line',{x1:x,x2:x,y1:y0,y2:y0+5,class:'ax'}));
    svg.appendChild(tx(x,y0+17,String(t),'','middle'));
  }
  svg.appendChild(mk('line',{x1:x0,x2:x1,y1:y0,y2:y0,class:'ax'}));
  svg.appendChild(tx((x0+x1)/2,h-4,'Threshold T ("at least this strong") → Cost/Task of the cheapest model clearing T','','middle'));
  const yl=tx(16,(y0+y1)/2,'Cost / Task · log','','middle');
  yl.setAttribute('transform',`rotate(-90 16 ${(y0+y1)/2})`); svg.appendChild(yl);
  svg.appendChild(mk('rect',{x:sx(S.lo),y:y1,width:Math.max(1,sx(S.hi)-sx(S.lo)),height:y0-y1,class:'band'}));

  // 阶梯路径
  let d='', df='';
  fr.forEach((t,i)=>{
    const xa=sx(t.lower), xb=sx(i<fr.length-1?fr[i+1].lower:sHi), y=sy(t.model.c);
    d += (i===0?`M${xa},${y}`:`L${xa},${y}`) + `L${xb},${y}`;
    df += (i===0?`M${xa},${y0} L${xa},${y}`:`L${xa},${y}`) + `L${xb},${y}`;
  });
  df += `L${sx(sHi)},${y0} Z`;
  svg.appendChild(mk('path',{d:df,class:'stepfill'}));
  svg.appendChild(mk('path',{d,class:'stepline'}));

  const wn = view&&view.w?view.w.n:null;
  const cheapIdx = cs.indexOf(Math.min(...cs));
  fr.forEach((t,i)=>{
    const xa=sx(t.lower), xb=sx(i<fr.length-1?fr[i+1].lower:sHi), y=sy(t.model.c);
    const isW=t.model.n===wn;
    const up = t.upper==null? sHi : t.upper;
    const seg=mk('line',{x1:xa,x2:Math.max(xa+2,xb),y1:y,y2:y,class:'seg-hit'});
    const tt=mk('title');
    tt.textContent=`Score range [${Math.round(t.lower)}, ${Math.round(up)}]\nwinner: ${t.model.n}\nScore ${t.model.s} (+${t.model.u95}/-${t.model.d95})\nCost/Task ${fmt$(t.model.c)} · ${fmtN(t.model.v)} votes\nclick = set the score range to this tier`;
    seg.appendChild(tt);
    seg.addEventListener('click',()=>{ S.lo=Math.round(t.lower); S.hi=Math.round(up); stopPlay(); recompute(); });
    svg.appendChild(seg);
    svg.appendChild(mk('circle',{cx:xa,cy:y,r:isW?6.5:4,fill:isW?'#f5c542':'#4cc9f0',stroke:isW?'#fff':'none','stroke-width':isW?2:0}));
    if(fr.length<=16||isW||i===cheapIdx){
      const anchor = xa > x1-210 ? 'end':'start';
      const dx = anchor==='end'?-8:8;
      const nm=t.model.n.length>24?t.model.n.slice(0,23)+'…':t.model.n;
      svg.appendChild(tx(xa+dx, y-8, `${nm}  ${fmt$(t.model.c)}`, isW?'lblw':'lbl', anchor));
    }
  });
  svg.appendChild(mk('line',{x1:sx(S.hi),x2:sx(S.hi),y1:y1-6,y2:y0,class:'tline'}));
  svg.appendChild(tx(sx(S.hi)+5,y1+2,`T = ${S.hi}`,'lblw')).setAttribute('fill','#f5c542');
}

/* ---------- render: tier table ---------- */
function renderTiers(){
  const tb=$('#tiersT tbody'); tb.innerHTML='';
  $('#tierCount').textContent = tiers.length? `${tiers.length} tiers · threshold frontier${S.ci==='strict'?' · strict CI':''}` : '(only built in ① Threshold mode)';
  if(!tiers.length){ tb.appendChild(el('tr',null,'<td colspan="8" class="empty">Switch to ① Threshold mode to see the full ladder: drag the threshold from high to low and the winners are these models</td>')); return; }
  const fr=[...tiers]; // tiers[0] = 最强
  const sMax=DATASETS[S.ds].stats.score_max;
  const wn = view&&view.w?view.w.n:null;
  fr.forEach((t,i)=>{
    const m=t.model;
    const lo=Math.round(t.lower), up=Math.round(i===0?sMax:t.upper);
    const stronger = i>0?fr[i-1].model:null;
    let marg='—', style='';
    if(stronger && stronger.s>m.s && stronger.c>m.c){
      const per=(stronger.c-m.c)/(stronger.s-m.s);
      marg=`${fmt$(per)}`;
      style = per>2?'style="color:var(--bad)"':per<0.15?'style="color:var(--good)"':'';
    }
    const isW=m.n===wn;
    const tr=el('tr', isW?'winner':'');
    tr.innerHTML=`<td class="mono">${i+1}</td>
      <td class="mono">[${lo}, ${up}]</td>
      <td class="nm">${isW?'<b style="color:var(--gold)">★ ':''}<a href="${m.u}" target="_blank" rel="noopener">${m.n}</a>${isW?'</b>':''} <span class="lab">${m.lab||''}</span></td>
      <td class="num">${m.s}<span style="color:var(--dim2);font-size:11px"> +${m.u95}/−${m.d95}</span></td>
      <td class="num" style="color:var(--accent)">${costCell(m)}</td>
      <td class="num" ${style}>${marg}</td>
      <td class="num">${fmtN(m.v)}</td>
      <td style="color:var(--dim2);font-size:11.5px">${m.pre?'Preliminary ':''}${m.v!=null&&m.v<1000?'low-sample ':''}◆frontier</td>`;
    tr.style.cursor='pointer';
    tr.title='click = set the score range to this tier';
    tr.addEventListener('click',()=>{ S.lo=lo; S.hi=up; stopPlay(); recompute(); });
    tb.appendChild(tr);
  });
}

/* ---------- render: main table ---------- */
const COLS={r:m=>m.r??1e9, or:m=>m.or??1e9, n:m=>m.n, s:m=>m.s, ci:m=>Math.max(m.u95,m.d95),
  c:m=>m.c==null?1e9:m.c, ratio:m=>m.ratio==null?-1:m.ratio, base:m=>m.baseRatio==null?-1:m.baseRatio,
  v:m=>m.v==null?-1:m.v, pin:m=>m.pin==null?1e9:m.pin, pout:m=>m.pout==null?1e9:m.pout,
  ctx:m=>m.ctx||'', lic:m=>m.lic||''};
function renderTable(){
  const tb=$('#tbl tbody'); tb.innerHTML='';
  const rows=[...cur].sort((a,b)=>{
    const A=COLS[S.sortKey](a),B=COLS[S.sortKey](b);
    return (typeof A==='string'? A.localeCompare(B) : A-B)*S.sortDir;
  });
  $('#tblCount').textContent=`${cur.length} / ${DATASETS[S.ds].stats.n} models (click headers to sort; gray rows are outside the current score range)`;
  const wn = view&&view.w?view.w.n:null;
  rows.forEach(m=>{
    const tr=el('tr',(inBand(m)?'in':'out')+(m.n===wn?' winner':'')+(m.pareto?' pareto':''));
    tr.innerHTML=`<td class="num">${m.r!=null?m.r:'—'}</td><td class="num">${m.or!=null?m.or:'—'}</td>
      <td class="nm"><a href="${m.u}" target="_blank" rel="noopener">${m.n}</a> <span class="lab">${m.lab||''}</span>
        ${m.pre?'<span class="pill warn" style="padding:0 4px;font-size:9.5px">PRE</span>':''}${m.ae?'<span class="pill bad" style="padding:0 4px;font-size:9.5px">AE</span>':''}</td>
      <td class="num">${m.s}</td><td class="num" style="color:var(--dim2)">+${m.u95}/−${m.d95}</td>
      <td class="num" style="color:var(--accent)">${costCell(m)}</td>
      <td class="num">${fmtR(m.ratio,0)}</td><td class="num">${fmtR(m.baseRatio,1)}</td>
      <td class="num">${fmtN(m.v)}</td><td class="num">${m.pin!=null?fmt$(m.pin):'—'}</td><td class="num">${m.pout!=null?fmt$(m.pout):'—'}</td>
      <td>${m.ctx||'—'}</td><td style="color:var(--dim2);font-size:11px">${m.lic||'—'}</td>`;
    tr.addEventListener('click',e=>{ if(e.target.tagName==='A')return; S.lo=Math.min(m.s,S.hi); S.hi=m.s; stopPlay(); recompute(); });
    tr.style.cursor='pointer';
    tb.appendChild(tr);
  });
  document.querySelectorAll('#tbl th').forEach(th=>{
    const k=th.dataset.k; if(!k)return;
    if(!th.dataset.lbl) th.dataset.lbl=th.textContent.trim();
    const on=S.sortKey===k;
    th.innerHTML=th.dataset.lbl+` <span class="ar">${on?(S.sortDir<0?'▼':'▲'):'⇅'}</span>`;
    th.onclick=()=>{ if(S.sortKey===k)S.sortDir*=-1; else {S.sortKey=k;S.sortDir=(k==='n'||k==='lic'||k==='ctx')?1:-1;} renderTable(); };
  });
}

/* ---------- range slider ---------- */
const rng=$('#rng');
function syncInputs(){
  const [mn,mx]=scoreExtent();
  const p=v=>(v-mn)/(mx-mn)*100;
  $('#hLo').style.left=p(S.lo)+'%'; $('#hHi').style.left=p(S.hi)+'%';
  $('#fill').style.left=p(S.lo)+'%'; $('#fill').style.width=(p(S.hi)-p(S.lo))+'%';
  $('#hiFill').style.left=p(S.hi)+'%'; $('#hiFill').style.width=(100-p(S.hi))+'%';
  $('#labLo').style.left=p(S.lo)+'%'; $('#labLo').textContent=S.lo;
  $('#labHi').style.left=p(S.hi)+'%'; $('#labHi').textContent=S.hi;
  $('#inLo').value=S.lo; $('#inHi').value=S.hi;
  $('#vLab').textContent=fmtN(S.minVotes);
  $('#cLab').textContent = S.maxCost>=+$('#maxCost').max ? '∞' : S.maxCost;
}
function dragSetup(handle,get){
  let on=false;
  const move=e=>{ if(!on)return; const r=rng.getBoundingClientRect();
    const f=clamp((e.clientX-r.left)/r.width,0,1); const [mn,mx]=scoreExtent();
    const v=Math.round(mn+f*(mx-mn)); get(v); recompute(); };
  handle.addEventListener('pointerdown',e=>{on=true;stopPlay();handle.setPointerCapture(e.pointerId);move(e);});
  handle.addEventListener('pointermove',move);
  handle.addEventListener('pointerup',()=>on=false);
  handle.addEventListener('pointercancel',()=>on=false);
}
dragSetup($('#hLo'),v=>{S.lo=Math.min(v,S.hi);});
dragSetup($('#hHi'),v=>{S.hi=Math.max(v,S.lo);});
$('#inLo').onchange=e=>{S.lo=clamp(+e.target.value||0,...scoreExtent());if(S.lo>S.hi)S.hi=S.lo;stopPlay();recompute();};
$('#inHi').onchange=e=>{S.hi=clamp(+e.target.value||0,...scoreExtent());if(S.hi<S.lo)S.lo=S.hi;stopPlay();recompute();};

/* ---------- play ---------- */
let timer=null;
function stopPlay(){ S.playing=false; if(timer){clearInterval(timer);timer=null;} $('#play').textContent='▶ Play: sweep the threshold from highest to lowest'; $('#playState').textContent='Stop'; }
$('#play').onclick=()=>{
  if(S.playing){ stopPlay(); return; }
  S.mode='pareto'; syncSeg($('#mode'),S.mode); setModeHint();
  const [mn,mx]=scoreExtent(); S.hi=mx; S.lo=mn; S.playing=true;
  $('#play').textContent='⏸ Pause'; $('#playState').textContent='sweeping';
  const spd=+$('#spd').value;
  timer=setInterval(()=>{
    S.hi-=spd;
    if(S.hi<=mn){ S.hi=mn; stopPlay(); }
    recompute();
  }, 90);
};

/* ---------- controls ---------- */
function syncSeg(root,v){ [...root.children].forEach(b=>b.classList.toggle('on',b.dataset.v===v)); }
function setModeHint(){
  $('#modeHint').innerHTML={
    pareto:'<b>Your original idea.</b> Fix threshold T, take the cheapest model among those with score ≥ T. Sweep T downward and the winner sequence is the <b>Pareto lower envelope</b>. The only mathematically self-consistent definition (= capability maximization under a cost constraint).',
    ratio:'<b>Score ÷ Cost.</b> Strongly biased toward cheap models because Arena scores carry a ~1200 baseline offset (the numerator is artificially inflated). For rough comparison only.',
    baseline:'<b>(Score − 1200) ÷ Cost.</b> Arena BT scores have a ~1200 practical floor (below it ≈ random); subtracting it yields "how much real capability gain each dollar buys". Still biased toward cheap models — which is exactly why Threshold mode is the decision-grade definition.'
  }[S.mode];
}
$('#mode').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.mode=b.dataset.v;syncSeg($('#mode'),S.mode);setModeHint();recompute();};
$('#ci').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.ci=b.dataset.v;syncSeg($('#ci'),S.ci);recompute();};
$('#minVotes').oninput=e=>{S.minVotes=+e.target.value;recompute();};
$('#maxCost').oninput=e=>{const v=+e.target.value;S.maxCost=v>=+e.target.max?Infinity:v;recompute();};
$('#exPrelim').onchange=e=>{S.exPrelim=e.target.checked;recompute();};
$('#exAuto').onchange=e=>{S.exAuto=e.target.checked;recompute();};
$('#onlyCost').onchange=e=>{S.onlyCost=e.target.checked;recompute();};
dsSel.onchange=e=>{S.ds=e.target.value;stopPlay();loadDataset(true);};
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{
  const [mn,mx]=scoreExtent(); stopPlay();
  if(b.dataset.p==='full'){S.lo=mn;S.hi=mx;}
  if(b.dataset.p==='sweep'){S.lo=mn;S.hi=mx;}
  if(b.dataset.p==='top10'){const s=[...cur].map(m=>m.s).sort((a,b)=>b-a);S.hi=s[9]||mx;S.lo=s[9]||mn;}
  if(b.dataset.p==='mid'){S.lo=clamp(1400,mn,mx);S.hi=clamp(1550,mn,mx);}
  recompute();
});

/* ---------- exports ---------- */
function dl(name,text,type){
  const b=new Blob(['\ufeff'+text],{type:type||'text/csv;charset=utf-8'});
  const a=el('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
$('#expCsv').onclick=()=>{
  const head=['rank','overall_rank','model','lab','license','score','ci_up','ci_down','preliminary','autoeval','votes','cost_per_task_p50','score_per_dollar','excess_score_per_dollar','price_in_per_M','price_out_per_M','context','in_band','pareto','url'];
  const rows=[...cur].sort((a,b)=>b.s-a.s).map(m=>[m.r,m.or,`"${m.n}"`,`"${m.lab||''}"`,`"${m.lic||''}"`,m.s,m.u95,m.d95,m.pre,m.ae,m.v,m.c,
    m.ratio!=null?m.ratio.toFixed(2):'', m.baseRatio!=null?m.baseRatio.toFixed(3):'', m.pin,m.pout,`"${m.ctx||''}"`,inBand(m),m.pareto,`"${m.u}"`]);
  dl(`arena_${S.ds}_${S.lo}-${S.hi}.csv`,[head.join(','),...rows.map(r=>r.join(','))].join('\n'));
};
$('#expTiers').onclick=()=>{
  if(!tiers.length){alert('Switch to ① Threshold mode first');return;}
  const fr=[...tiers].sort((a,b)=>b.model.s-a.model.s);
  const head=['tier','score_band_lo','score_band_hi','model','score','cost_per_task','marginal_$per_point_to_next_tier','votes','license'];
  let pc=null,ps=null; const rows=fr.map((t,i)=>{
    const m=t.model; let marg='';
    if(pc!=null&&m.s<ps){const dc=pc-m.c,ds=ps-m.s; if(ds>0&&dc>0)marg=(dc/ds).toFixed(3);}
    pc=m.c;ps=m.s;
    return [i+1,Math.round(t.lower),Math.round(t.upper==null?t.model.s:t.upper),`"${m.n}"`,m.s,m.c,marg,m.v,`"${m.lic||''}"`];
  });
  dl(`arena_${S.ds}_tiers.csv`,[head.join(','),...rows.map(r=>r.join(','))].join('\n'));
};
$('#copyLink').onclick=()=>{
  const onIds=PRICE_EVENTS.filter(e=>S.evState[e.id]).map(e=>e.id);
  const p=new URLSearchParams({ds:S.ds,mode:S.mode,ci:S.ci,lo:S.lo,hi:S.hi,mv:S.minVotes,pre:S.exPrelim?1:0,
    hr:S.hour,dow:S.dow,date:S.dateISO,os:Math.round(S.outShare*100),tz:S.tz,ev:onIds.join(','),
    ch:Math.round(S.cacheHit*100),cs:S.cacheSrc});
  const u=location.origin+location.pathname+'?'+p;
  (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>{$('#copyLink').textContent='✓ Copied';setTimeout(()=>$('#copyLink').textContent='Copy state link',1500);})
   .catch(()=>prompt('Copy manually: ',u));
};

/* ---------- paste new dataset ---------- */
function parsePasted(text){
  const LINK=/\[([^\]]+)\]\(([^)\s]+)\)/g;
  const SCORE_RE=/(\d{3,4})\s*\+(\d+)\s*\/\s*-(\d+)/;
  const money=x=>{x=(x==null?'':String(x)).replace(/[$,\s]/g,'');return (x&&x!=='N/A'&&x!=='-'&&!isNaN(+x))?+x:null;};
  const isInt=x=>/^[\d,]+$/.test(String(x).trim());
  const isMoney=x=>/^\$[\d.,]+$/.test(String(x).trim());
  const isPrice=x=>/^\$?[\d.]+\s*\/\s*\$?[\d.]+$/.test(String(x).replace(/,/g,'').trim());
  const isCtx=x=>/^[\d.]+\s*[KM]$/i.test(String(x).trim());

  // 表格文本 → 单元格数组（markdown 管道 / 制表符）
  const grid=text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length).map(l=>{
    if(l.startsWith('|')) return l.replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
    if(l.includes('\t'))  return l.split('\t').map(c=>c.trim());
    return null;
  }).filter(Boolean);
  if(!grid.length) return [];

  /* 有表头就按表头名定位列 —— 不要硬编码列号，arena.ai 不同视图列数/列序都不一样：
       开源视图 = Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task | Price | Context
       全部Model = Rank | Rank Spread  | Model | Score | Votes | Cost/Task | Price | Context
       用户自己粘的表可能只有 5 列。
     认不出表头才退化为「按内容猜列」。 */
  const hi=grid.findIndex(r=>/^(Rank|#|排名)$/i.test((r[0]||'').trim()));
  let col=null;
  if(hi>=0){
    const h=grid[hi].map(c=>c.toLowerCase().trim());
    const ex=n=>h.findIndex(x=>x===n);
    const st=n=>h.findIndex(x=>x.startsWith(n));
    const c={rank:ex('rank')>=0?ex('rank'):st('rank'), orank:ex('overall rank'),
             model:ex('model')>=0?ex('model'):st('model'), score:ex('score')>=0?ex('score'):st('score'),
             votes:st('votes'), cost:st('cost'), price:st('price'), ctx:st('context')};
    if(c.model>=0&&c.score>=0) col=c;
  }
  const positional=!!col;
  const body=grid.filter((r,i)=> i!==hi && !r.every(c=>/^[-:\s]*$/.test(c)) && !/^(Rank|#|排名)$/i.test((r[0]||'').trim()));

  const rows=[];
  for(const cells of body){
    if(cells.length<4) continue;
    const linkIdx=cells.findIndex(c=>c.includes('[')&&c.includes(']('));
    if(linkIdx<0) continue;
    const sIdx=cells.findIndex(c=>SCORE_RE.test(c));
    if(sIdx<0) continue;

    const modelCell=cells[linkIdx];
    const links=[...modelCell.matchAll(LINK)];
    const last=links[links.length-1];
    const name=last[1], url=last[2];
    /* lab = 第一个链接之前的前缀（可能带 <br>，如 "Thinking Machines<br>"）
       lic = 最后一个链接之后的那段，形如 "Moonshot · Modified MIT"
       注意不能用 split(')')：Model页 URL 里本身就可能有 ')'。 */
    const lab=modelCell.slice(0,last.index).replace(/<br>/g,' ').trim()||null;
    const after=modelCell.slice(last.index+last[0].length).replace(/<br>/g,' ').trim();
    let lic=null;
    if(after.includes('·')) lic=after.split('·').slice(1).join('·').trim()||null;
    else if(after && !lab) lic=after;
    const scoreCell=cells[sIdx];
    const prelim=/Preliminary/i.test(scoreCell), auto=/AutoEval/i.test(scoreCell);
    const mm=scoreCell.match(SCORE_RE);

    let rank=null, orank=null, votes=null, cost=null, pin=null, pout=null, ctx=null;
    if(positional){
      const at=key=>{ const i=col[key]; return (i!=null&&i>=0&&i<cells.length)?cells[i]:null; };
      rank=money(at('rank')); orank=money(at('orank'));
      votes=money(at('votes')); cost=money(at('cost'));
      const pr=(at('price')||'').split('/'); pin=money(pr[0]); pout=money(pr[1]);
      ctx=at('ctx');
      if(!ctx||/^(N\/A|-|)$/i.test(String(ctx).trim())) ctx=null; else ctx=String(ctx).trim();
    } else {
      /* 猜列。关键陷阱：Rank Spread 也是纯整数列，绝不能当成 votes。
         votes 几乎总是带千分位逗号 → 用「有没有逗号」来区分；没有逗号列时取最大的那个。 */
      const before=[]; for(let i=0;i<linkIdx;i++) if(/^\d+$/.test(cells[i].replace(/,/g,''))) before.push(+cells[i].replace(/,/g,''));
      rank=before.length?before[0]:null;
      orank=before.length>1?before[1]:null;
      const afterIdx=[]; for(let i=sIdx+1;i<cells.length;i++) afterIdx.push(i);
      const pIdx=afterIdx.find(i=>isPrice(cells[i]));
      const cIdx=afterIdx.find(i=>i!==pIdx&&isCtx(cells[i]));
      ctx=cIdx!=null?cells[cIdx].trim():null;
      if(pIdx!=null){ const q=cells[pIdx].split('/'); pin=money(q[0]); pout=money(q[1]); }
      /* cost 一定带 $；votes 是纯整数。两者都先排除 price / context 列再判。 */
            /* 注意：pIdx / cIdx 可能是 undefined，不能用 indexOf(...)<0 之类的写法排除 */
      const notPC=i=>(pIdx===undefined||i!==pIdx)&&(cIdx===undefined||i!==cIdx);
      const mIdx=afterIdx.filter(i=>notPC(i)&&isMoney(cells[i]));
      const iIdx=afterIdx.filter(i=>notPC(i)&&!mIdx.includes(i)&&isInt(cells[i]));
      cost=mIdx.length?money(cells[mIdx[0]]):null;
      const comma=iIdx.filter(i=>cells[i].includes(','));
      let vIdx;
      if(comma.length) vIdx=comma[0];                       // 带千分位的几乎必是 votes
      else if(iIdx.length) vIdx=iIdx[iIdx.length-1];        // 否则取最靠右的（cost 已被 $ 规则拿走）
      votes=vIdx!=null?money(cells[vIdx]):null;
    }
    rows.push({n:name,u:url,lab,lic,r:rank,or:orank,s:+mm[1],u95:+mm[2],d95:+mm[3],
      pre:prelim,ae:auto,v:votes,c:cost,pin,pout,ctx});
  }
  return rows;
}
$('#addDs').onclick=()=>{
  const txt=$('#paste').value.trim();
  if(!txt){$('#pasteMsg').innerHTML='<span style="color:var(--bad)">Paste table text first</span>';return;}
  const rows=parsePasted(txt);
  if(rows.length<2){$('#pasteMsg').innerHTML=`<span style="color:var(--bad)">Only parsed ${rows.length} rows — check this is an arena.ai leaderboard table (needs Score / Cost/Task columns)</span>`;return;}
  const name=($('#pasteName').value.trim()||'Custom board')+' ('+rows.length+')';
  const key='custom_'+Date.now().toString(36);
  const scored=rows.filter(r=>r.s), wc=rows.filter(r=>r.c!=null);
  DATASETS[key]={label:name,path:'custom',license:'custom',meta:`${rows.length} models · user paste`,
    note:'from data you pasted in this session',total_claimed:rows.length,
    stats:{n:rows.length,with_cost:wc.length,score_min:Math.min(...scored.map(r=>r.s)),score_max:Math.max(...scored.map(r=>r.s)),
           cost_min:wc.length?Math.min(...wc.map(r=>r.c)):null,cost_max:wc.length?Math.max(...wc.map(r=>r.c)):null},
    models:hydrate(rows.map(r=>F.map(k=>r[k])))};
  const o=el('option'); o.value=key; o.textContent=name; dsSel.appendChild(o);
  S.ds=key; dsSel.value=key; stopPlay(); loadDataset(true);
  $('#pasteMsg').innerHTML = wc.length===0
    ? `<span style="color:var(--bad)">⚠ Parsed ${rows.length} models, but the Cost/Task column is entirely empty</span> — without costs there's no value analysis (the WebDev · HTML board on arena.ai is exactly like this). The dataset was added: you can view score rankings, but the frontier will be empty.`
    : `<span style="color:var(--good)">✓ Added ${rows.length} models</span> (${wc.length} with cost data). Custom datasets are lost on reload — save them with "Export CSV".`;
  $('#paste').value='';
};

/* ---------- static text ---------- */
$('#scraped').textContent=DATA.scraped; $('#captured').textContent=DATA.captured;
$('#methodBody').innerHTML=`
<p><b>Bottom line: the approach holds — but your phrasing mixes two different things. With the corrections below it becomes a rigorous, useful tool (this page).</b></p>

<p><b>1. "Sort by cost/task + drag the range's left edge" ≠ the winner by itself.</b>
A sort direction produces no conclusion; the real operation is: fix a threshold <code>T</code> and take the min-<code>cost</code> model among those with <code>score ≥ T</code>.
Sweep <code>T</code> from the highest score down and the winner sequence is the <b>lower envelope (Pareto frontier)</b> of the (score, cost) plane.
It can be proven that the map <code>C(T) = min{cost : score ≥ T}</code> is <b>monotonically non-decreasing</b>, so "every tier has a winner, and winners get pricier as the threshold rises" necessarily follows —
your intuition is right. Arena's official <a href="https://arena.ai/leaderboard/code/webdev/pareto" target="_blank" rel="noopener">/pareto</a> view plots exactly this curve.
The key correction: the winner only switches when a <b>strictly cheaper</b> model appears — not on every drag step — so the frontier is a <b>staircase</b>, and each flat segment is "the score range this model rules".</p>

<p><b>2. "Best value" has at least three definitions, with different answers:</b></p>
<ul>
<li><b>Threshold</b> (= your idea, and the only one correct as constrained optimization): <code>min cost s.t. score ≥ T</code>. Meaning: "cheapest among models that clear the bar".</li>
<li><b>Score per $</b>: <code>max score/cost</code>. Meaning: "cheapest per point" — but Arena scores carry a ~1200 baseline offset that inflates the numerator, so this <b>almost always picks the cheapest small model</b>. Little practical value.</li>
<li><b>Excess score per $</b>: <code>max (score − baseline)/cost</code>. Marginal value after removing the offset; good for comparing "pay more, gain how much" efficiency.</li>
</ul>
<p>Closest to a purchasing decision is the <b>marginal price</b>: moving from the current tier up one, <code>Δcost / Δscore</code> = dollars per extra point. The tier table computes it for you.</p>

<p><b>3. Five pitfalls that flip conclusions (each has a toggle in the tool):</b></p>
<ol>
<li><b>Overlapping confidence intervals.</b> If the score range is narrower than the CI, rankings inside it are noise. Example: on the HTML board, Inkling 2 Small has only 130 votes (CI ±55); Muse Spark Open ±41.
This tool offers a "strict mode": only accepts a gap where A's CI lower bound &gt; B's CI upper bound; statistically indistinguishable adjacent tiers are <b>merged into one</b> (keeping the cheaper model).</li>
<li><b>Preliminary / low votes.</b> Don't crown a "value champion" from a model with &lt;1000 votes.</li>
<li><b>Cost/Task (P50) is a workload-mix artifact.</b> The same model can have different costs on different boards (Overall / Frontend / Fullstack / HTML / React) because task length and tool-call depth differ.
P50 also ignores the tail: when an agent goes off the rails, P95 can be 5–10× P50. And it only covers token spend — not latency, retry rates, or context-window limits.</li>
<li><b>Dataset truncation.</b> In this scrape, <code>frontend_os</code> and <code>overall_all</code> only cover the high-score segment (the low tail wasn't fully scraped).
Good news: <b>the high-score end of the Pareto frontier is unaffected by missing low-scoring models</b> (a lower-scoring, pricier model can never enter the frontier);
bad news: the global cheapest price and the "excess score/$" baseline skew. Use the paste box at the bottom to fill the gap.</li>
<li><b>Point-in-time.</b> The official API returns 403, so only page snapshots are possible; prices and ranks change weekly. CSV exports carry the date in the filename.</li>
</ol>

<p><b>4. The question you actually want, and where it lives in the tool:</b>
"on a given board, within an acceptable score range, which model has the best value" → that's <b>Threshold mode + the score-range slider</b>:
set <code>lo</code> to your minimum acceptable capability and <code>hi</code> to the ceiling you won't pay extra for; the card gives the answer,
and the step chart tells you "how much more the next tier costs" — more decision-useful than a single champion.</p>

<p><b>5. One counter-intuitive but important reminder:</b> models on the Pareto frontier are <b>mutually undominated</b>; there is no "best one on the frontier".
"Best" depends on your utility function — how fast your marginal utility of score decays, and your budget.
So the right question is not "which has the best value" but "<b>above the minimum score I can accept, how many points does each extra dollar buy — and from which tier does that exchange rate stop being worth it</b>".
The "marginal cost $/pt" column in the tier table is exactly that exchange-rate curve; find its knee.</p>

<p><b>6. Price is a function of time — this version makes "the hour" a first-class variable.</b>
The board's <code>Price $/M</code> is a <b>snapshot of list price at scrape time</b>, and list prices change over time. Two time dependencies are verified:</p>
<ul>
<li><b>Intraday rhythm (peak/off-peak).</b> DeepSeek peak = weekdays 01:00–04:00 and 06:00–10:00 UTC; all other hours (including the whole weekend) are half price.
The annoyance: the board <b>mixes both conventions in one table</b> — <code>V4.1-Flash-20261017</code> is listed at off-peak $0.15/$0.60, while <code>V4.1-Flash-20260910</code> and the <code>V4-Pro</code> family are listed at peak $0.30/$1.20 and $1.32/$3.96. Comparing across rows means comparing one model's peak against another's off-peak.</li>
<li><b>Calendar events (promo expiry).</b> <code>GLM-5.3-Flash</code>'s board price $0.05/$0.18 was a launch promo that <b>ended 2026-09-09</b>; the current price is $0.15/$0.50 (~2.9×). The 11-11 snapshot still uses the promo price, so its $0.15 Cost/Task is really ~$0.44.</li>
</ul>
<p><b>Conversion:</b> <code>Cost/Task = token usage × unit price</code>; usage doesn't change with price, so the correction = scale by the <b>weighted unit-price ratio</b>:
<code>scale = [pin'·(1−w) + pout'·w] ÷ [pin·(1−w) + pout·w]</code>, where <code>w</code> = output token share, default <b>8%</b>
(from the Agent board: median inferred input/output ratio ≈ 11:1 across 14 models; range 3.8–17.9×; adjustable via slider).
DeepSeek's peak/off-peak moves input and output <b>proportionally</b>, so it is insensitive to <code>w</code>; <code>w</code> only matters for corrections like GLM's input ×3 / output ×2.8.</p>
<p><b>Losslessly reversible:</b> every model keeps <code>cRaw</code> (the raw board value); all scenarios are derived from it, and switching toggles off restores it exactly — no "edits drifting from truth".</p>
<p><b>Conclusions actually change with the hour — that's the point:</b> off-peak, DeepSeek's older version is half price and <b>kicks <code>Hy3</code> and <code>MiMo-V2.5</code> off the Pareto frontier</b> (fully dominated);
the T=1500 winner changes from Hy3 $0.04 to DeepSeek-V4.1-Flash-20260910 $0.03; conversely at peak, <code>20261017</code> rises from $0.12 to $0.24.
Chart ③ draws this as a 168-hour weekly <code>C(T)</code> curve: gray bands are peak windows; jumps in the line are champion changes.</p>
<p><b>Three limits of this section:</b> ① scores are a 2026-11-11 snapshot and don't change with time, so the time axis reflects the time-dependence of <b>prices</b>, not of <b>capability</b> (capability also drifts as boards update);
② board costs use P50 usage and <b>exclude cache-hit discounts</b> (DeepSeek cache input: peak $0.006 / off-peak $0.003; Anthropic cache input $0.10–$1.00), so real agent bills can be well below "usage × list price";
③ two <b>uncertain</b> rules (whether V4-Flash also splits peak/off-peak; Mistral Medium 3.5 and GPT-6 Sol being 2× off vs a third-party index) are <b>off by default</b> — tick them only for sensitivity analysis.
The rule table <code>PRICE_EVENTS</code> lives in the source, free to edit — it's just "model name → unit price at two hours".
One of them, <code>gem_dec1</code>, is a <b>future event</b>: Gemini 4 Carbon/Argon have announced a hike from $2/$10 to $4/$20 on 2026-12-01 (cache price $0.10→$0.20);
drag the pricing date into December and you'll see it drop off the <code>overall_all</code> frontier that day, replaced by GPT-6.1 Sol.</p>

<p><b>7. Cache hit rate — the single most impactful variable (default 95%).</b>
Arena's <code>Cost/Task</code> is computed at <b>cache-miss prices</b>, so for agent workloads — where prefixes get re-read constantly — it's a <b>systematic overestimate</b>.
Cache discounts only apply to <b>input</b> tokens; output is always full price:
<code>effective input price = (1−h)·input price·write multiplier + h·input price·cache ratio</code>, where <code>h</code> is the hit rate.
Two easily-missed details: ① <b>cache read prices are stored as a ratio of the input price, not absolute values</b>, so peak/off-peak, promo expiry and future hikes move cache prices automatically
(DeepSeek peak $0.006 → off-peak automatically $0.003; GLM promo $0.01 → $0.03 after);
② <b>write multiplier</b>: Anthropic (5-min tier) and OpenAI (30-min tier) bill cache writes separately at 1.25× input price, and the missed share is paid at the write price,
so at the same 95% hit rate Claude's discount is thinner than DeepSeek's; DeepSeek / Z.ai / Xiaomi / Tencent / Google (implicit cache) / xAI don't charge a write fee.
39 models use published ratios (DeepSeek 2%–3.3%, MiMo 0.8%–2%, Kimi 10%–20%, GLM 18.3%–20%, Hy3 25%, Grok 25%,
Anthropic 2.5%–10%, OpenAI 5%–10%, Gemini 5%, Mistral Large 4 10.3%); the other 48 have no published price → estimated at an industry-typical <b>10%</b> and labeled "est." in the UI,
or flatten everything with "Flat 10%" for a conservative comparison.
<span style="color:var(--dim2)">Cache price sources: DeepSeek's official pricing page; Anthropic / OpenAI / Google / xAI / Moonshot / Z.ai pricing pages
(cross-checked via benchlm.ai, morphllm, sentra.app, maximem.ai, tech-insider, felloai, eesel, layer3labs, getnadir, imisofts,
munderdiffl.in, datastudios.org, aipricing.guru, glm-ai.chat, glm5.app, subconscious.dev, mem0.ai, llm-stats, orcarouter,
requesty.ai, codersera, saascity, alphasignal, truescho, flowtivity, deepseekai.guide); the full comparison table is in the README.</span></p>
<p><b>Three conclusion-level changes cache discounts bring:</b> ① <b>levels</b>: top models generally save 59%–79% (Fable 5.2 $11.04→$4.10, Kimi $0.91→$0.375, MiMo-V2.6-Flash $0.05→$0.011);
② <b>frontier structure</b>: <code>overall_os</code> goes from 7 tiers to 8, with three DeepSeek variants squeezing in;
③ <b>scheduling value gets compressed</b>: the weekly cost amplitude at T=1600 shrinks from 1.67× to <b>1.11×</b> — with cache at 95%, dodging peak hours only saves ~10% more,
so the right order is <b>fix prefix caching first, then talk scheduling</b>.
Also, the "output share" slider goes from irrelevant to the <b>second-most sensitive parameter</b> once cache is on: at the same 95% hit rate,
DeepSeek-20261017 saves 86% at w=2%, 68% at w=8% (default), 55% at w=15%, 40% at w=25%, and only 25% at w=40%
— the longer your outputs, the less cache can rescue. Conversely, if a tier champion's input and output prices <b>both</b> double (like DeepSeek-20261017 at T=1664),
cache can't compress the amplitude — still 2.00× — and that tier's lever is scheduling.</p>`;

$('#sourceBody').innerHTML=`
<p><b>Source:</b> <a href="https://arena.ai/leaderboard/code/webdev" target="_blank" rel="noopener">arena.ai/leaderboard/code/webdev</a> and its sub-boards (frontend / fullstack), scraped <span class="mono">${DATA.scraped}</span>; leaderboard data dated <span class="mono">${DATA.captured}</span>.</p>
<p><b>Availability:</b> pages are publicly readable and scrapeable; but <span class="mono">arena.ai/api/*</span> and <span class="mono">api.arena.ai/*</span> return 403 (Cloudflare + route allowlist) — <b>no public JSON API</b>. So this tool uses an "embedded snapshot + paste-to-extend" design instead of live requests.</p>
<p><b>Field semantics:</b></p>
<ul>
<li><b>Score</b>: Arena's Bradley-Terry-style rating; <span class="mono">+u/−d</span> is the bootstrap 95% confidence interval.</li>
<li><b>Cost/Task (P50)</b>: the <b>median</b> dollar cost of completing one Arena task = measured token usage × the API prices below. <span class="mono">N/A</span> = not published — such models are excluded by default (toggleable).</li>
<li><b>Price $/M</b>: the <b>vendor's first-party API list price</b> (input / output per million tokens) — not a unified Arena-set price, and not the amortized cost of self-hosting. Note: a low Cost/Task doesn't mean a low unit price (it also depends on how many tokens the model emitted).</li>
</ul>
<p><b>Whose prices are these, exactly? (checked item by item)</b></p>
<p>Compared one-by-one against the independent pricing index <a href="https://benchr.org/pricing" target="_blank" rel="noopener">benchr.org/pricing</a> (2026-09-11 snapshot), Arena's <span class="mono">Price $/M</span> equals each vendor's <b>official API list price</b>:
Kimi K3.1 Pro <span class="mono">$2/$10</span>, Kimi K3 <span class="mono">$3/$15</span> (Moonshot); GLM-5.2 / 5.3 <span class="mono">$1.40/$4.40</span> (Z.ai); Claude Opus 5.5 <span class="mono">$4/$20</span>, Sonnet 5.5 <span class="mono">$2/$10</span>, Haiku 5.5 <span class="mono">$0.10/$0.50</span> (Anthropic); GPT-6.1 Sol <span class="mono">$2/$10</span>, Terra <span class="mono">$1/$5</span>, GPT-6 Astra <span class="mono">$10/$50</span> (OpenAI); Grok 4.7 <span class="mono">$2/$6</span>, Gemini 4 Argon <span class="mono">$2/$10</span>; Mistral Large 4 <span class="mono">$0.70/$2.10</span>; MiniMax M3 <span class="mono">$0.30/$1.20</span>; DeepSeek V4-Pro <span class="mono">$1.32/$3.96</span>.</p>
<p><b>Open-source models are also listed at API prices — not what you'd pay self-hosting.</b> Gemma 4 31B <span class="mono">$0.16/$0.47</span>, Granite 4.1 8B <span class="mono">$0.05/$0.10</span>, Hy3 <span class="mono">$0.13/$0.53</span>, Qwen3.8-27B <span class="mono">$0.40/$3</span>, MiMo-V2.6-Flash <span class="mono">$0.14/$0.28</span> — these are the quotes of Google / IBM / Tencent / Alibaba / Xiaomi's <b>own hosted endpoints</b> (each model's link on the board points to those API docs). Open weights ≠ free inference: self-hosting costs are GPU amortization + power + ops, with no mapping to per-token list prices.</p>
<p><b>Cost/Task is computed from measured usage — three internal proofs:</b></p>
<ul>
<li>A model's <span class="mono">Price $/M</span> is <b>identical across all 7 boards</b> in this tool → unit price is a model-level constant;</li>
<li>A model's <span class="mono">Cost/Task</span> is <b>identical across the five WebDev sub-boards</b> (Overall / Frontend / React / Reference-based / Fullstack) but differs on Image-to-WebDev (e.g. DeepSeek-V4.1-Flash-20261017: $0.12 vs $0.10) → usage is aggregated per <b>task category</b>, not per sub-board;</li>
<li>The Agent board also publishes <span class="mono">Output Tokens/Task</span>, from which input volume can be inferred: 14 models infer to 125K–1.27M input tokens, input/output ratios 3.8–17.9× — exactly a multi-turn tool-calling load signature. And <span class="mono">(Max)/(High)/(xHigh)</span> tiers share the <b>same unit price</b> while Cost differs 2–4× (Claude Opus 5.5: $5.66 vs $2.13) — entirely a token-usage difference.</li>
</ul>
<p><b>Three price traps that make conclusions optimistic:</b></p>
<ul>
<li><b>DeepSeek peak/off-peak.</b> The board lists the 20261017 version at <b>off-peak</b> <span class="mono">$0.15/$0.60</span> and the 20260910 version at <b>peak</b> <span class="mono">$0.30/$1.20</span>. Peak = weekdays 01:00–04:00 and 06:00–10:00 UTC; other hours are half price. If your workload can't be scheduled into off-peak, 20261017's $0.12/task doubles to ~$0.24: it still holds the 1664 tier (structure unchanged), but the "1638→1664" marginal price rises from $0.0027/pt to $0.0073/pt while "1664→1687" falls from $0.0343 to $0.0291 — the knee jump shrinks from 12.8× to 4.0×, weakening the urgency to stop there.</li>
<li><b>GLM-5.3-Flash uses an expired launch-promo price</b> <span class="mono">$0.05/$0.18</span>; the promo ended 2026-09-09, current price <span class="mono">$0.15/$0.50</span> (3×), so its $0.15/task is really ~$0.45. It wasn't on the frontier anyway, but similar stale promo prices may inflate other models.</li>
<li><b>No cache discount.</b> DeepSeek cache-hit input <span class="mono">$0.006</span> (peak) / <span class="mono">$0.003</span> (off-peak); Anthropic cache input <span class="mono">$0.10–$1.00</span>. Multi-turn agent workloads hit cache often; real bills can be well below "list × tokens".</li>
</ul>
<p><b>Want your own cost basis?</b> Use the paste box below and replace the <span class="mono">Cost/Task</span> column with your measured bills or self-hosted amortized costs — the parser reads <b>column names</b> and doesn't care where the numbers come from. The frontier you get is <b>yours</b>.</p>
<ul>
<li><b>Rank vs Overall Rank</b>: the former is the rank within this sub-board/license filter; the latter is the all-models overall rank.</li>
<li><b>Preliminary</b>: votes haven't reached the stability threshold; CIs are usually wide.</li>
<li><b>AutoEval</b>: score from automated evaluation rather than human battles — not directly comparable with human-vote scores → excluded by default.</li>
</ul>
<p><b>Limitations of this tool:</b> data is a snapshot, not live; cost covers token spend only; the definition of "value" is yours to choose and different definitions crown different champions; statistical significance is only enforced in strict mode.</p>
<p><b>Compliance:</b> data comes from public pages and is used for personal analysis. Don't scrape at high frequency. If you publish derived conclusions, attribute the data source and scrape date.</p>`;

/* ---------- url state ---------- */
(function(){
  const p=new URLSearchParams(location.search);
  if(p.get('ds')&&DATASETS[p.get('ds')])S.ds=p.get('ds');
  if(p.get('mode'))S.mode=p.get('mode');
  if(p.get('ci'))S.ci=p.get('ci');
  dsSel.value=S.ds; syncSeg($('#mode'),S.mode); syncSeg($('#ci'),S.ci); setModeHint();
  $('#exPrelim').checked=S.exPrelim=p.get('pre')==='1';
  loadDataset(true);
  if(p.get('hr')!=null) S.hour=clamp(+p.get('hr')||0,0,23);
  if(p.get('dow')!=null) S.dow=clamp(+p.get('dow')||0,0,6);
  if(p.get('date')&&/^\d{4}-\d{2}-\d{2}$/.test(p.get('date'))) S.dateISO=p.get('date');
  if(p.get('os')!=null) S.outShare=clamp((+p.get('os')||0)/100,0,1);
  if(p.get('tz')!=null) S.tz=+p.get('tz')||0;
  if(p.get('ch')!=null) S.cacheHit=clamp((+p.get('ch')||0)/100,0,1);
  if(p.get('cs')&&CACHE_SRC[p.get('cs')]) S.cacheSrc=p.get('cs');
  if(p.get('ev')!=null){ const on=new Set(p.get('ev').split(',').filter(Boolean));
    PRICE_EVENTS.forEach(e=>{ S.evState[e.id]=on.has(e.id); }); }
  syncPriceUI();
  if(p.get('lo')&&p.get('hi')){ S.lo=+p.get('lo'); S.hi=+p.get('hi'); }
  recompute();
})();

/* 回归测试：直接验证 index.html 里内嵌的那份数据与脚本。
   用法： python3 test/build.py && node --max-old-space-size=4096 test/run.js   */
const out=[]; const W=s=>require('fs').writeSync(1,s+'\n');
function T(name,fn){ const t0=Date.now();
  try{ const r=fn(); out.push([name,'OK',r,Date.now()-t0]); }
  catch(e){ out.push([name,'FAIL',e.message,Date.now()-t0]); } }
/* 价格情景固定为「榜面快照」（全部修正关闭），让下面 33 条已记录的结论保持可复现；
   时间引擎单独在文末用 onTime() / offTime() 开关来测。 */
const EV_ALL_OFF=()=>PRICE_EVENTS.forEach(e=>S.evState[e.id]=false);
function reset(){ S.ds='overall_os'; S.mode='pareto'; S.ci='point'; S.minVotes=0; S.exPrelim=false;
  S.exAuto=true; S.onlyCost=true; S.maxCost=Infinity; offTime(); loadDataset(true); }
/* onTime = **只**开时间事件、关缓存 —— 这样「峰时 ×2 / 谷时 ×0.5 / GLM ×2.945」这些
   已记录的断言值不被缓存折扣冲掉；缓存单独用 cacheOn() 测。 */
function onTime(hour,dow,date){ PRICE_EVENTS.forEach(e=>S.evState[e.id]=(e.conf==='official'));
  S.hour=hour; S.dow=dow; S.dateISO=date||DATA.scraped; S.cacheSrc='off'; }
function offTime(){ EV_ALL_OFF(); S.hour=12; S.dow=3; S.dateISO=DATA.scraped; S.outShare=1/12; S.cacheSrc='off'; S.cacheHit=0.95; }
function cacheOn(hit,src){ S.cacheSrc=src||'pub'; S.cacheHit=(hit==null?0.95:hit); }
/* 页面加载时的初始情景快照（必须在第一次 reset() 之前取，否则读到的是被测试改过的值） */
const INIT_EV={}, INIT={hour:S.hour,dow:S.dow,date:S.dateISO,os:S.outShare};
PRICE_EVENTS.forEach(e=>INIT_EV[e.id]=S.evState[e.id]);
/* 暴力参照解：C(T) = min{ cost : score >= T } */
function brute(Th){ const q=cur.filter(m=>m.s>=Th&&m.c!=null); if(!q.length)return null;
  const mc=Math.min(...q.map(m=>m.c)); return q.filter(m=>m.c===mc).sort((a,b)=>b.s-a.s)[0]; }
function sweep(dsKey, step){
  S.ds=dsKey; loadDataset(true);
  const d=DATASETS[dsKey], hi=d.stats.score_max, lo=d.stats.score_min;
  const seen=[], bad=[]; let n=0;
  for(let t=hi; t>=lo; t-=step){
    if(++n>3000) throw new Error('iteration guard at t='+t);
    S.hi=t; recompute();
    const b=brute(t);
    if(!view||!b){ if(view||b) bad.push(`T=${t} null 不一致`); continue; }
    if(view.w.n!==b.n) bad.push(`T=${t}: 工具=${view.w.n} 暴力=${b.n}`);
    if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n);
  }
  const fr=tiers.map(x=>x.model.n);
  const orderOK = seen.length===fr.length && seen.every((x,i)=>x===fr[i]);
  S.hi=hi; recompute();
  return {n, seen, fr, bad, orderOK, tiers:fr.length, models:cur.length};
}
reset();
const D=()=>DATASETS[S.ds];

T('数据集载入', ()=>`overall_os: ${D().models.length} 个模型，Score ${D().stats.score_min}–${D().stats.score_max}，${tiers.length} 档前沿`);
T('前沿：分数越高成本越高（单调）', ()=>{
  const asc=[...tiers].sort((a,b)=>a.model.s-b.model.s);
  for(let i=1;i<asc.length;i++){ if(!(asc[i].model.c>asc[i-1].model.c)) throw new Error('成本未随分数递增 @'+asc[i].model.n);
    if(!(asc[i].model.s>asc[i-1].model.s)) throw new Error('分数未递增'); }
  return `${tiers.length} 档：$${asc[0].model.c}@${asc[0].model.s} → $${asc[asc.length-1].model.c}@${asc[asc.length-1].model.s}`;
});
T('前沿：没有任何模型能支配前沿成员', ()=>{
  for(const f of frontier) for(const m of cur){ if(m.n===f.n)continue;
    if(m.s>f.s && m.c<f.c) throw new Error(`${m.n} 支配了 ${f.n}`); }
  return `${frontier.length} 个前沿成员全部不被支配`;
});
T('各档门槛区间无缝无叠、完整覆盖', ()=>{
  const d=tiers, mx=D().stats.score_max;
  if(Math.round(d[0].upper)!==mx) throw new Error(`顶档上界 ${d[0].upper} != 最高分 ${mx}`);
  for(let i=1;i<d.length;i++) if(Math.round(d[i].upper)+1!==Math.round(d[i-1].lower)) throw new Error(`档 ${i-1} 与 ${i} 之间断裂`);
  const last=d[d.length-1], floor=Math.min(...cur.map(m=>m.s));
  if(Math.round(last.lower)!==Math.round(floor)) throw new Error(`底档 lower 应等于候选集最低分 ${floor}，实际 ${last.lower}`);
  for(let i=0;i<d.length;i++){
    if(Math.round(d[i].upper)!==Math.round(i===0?mx:d[i].model.s)) throw new Error(`档 ${i} upper 应等于自己的分数`);
    if(i<d.length-1 && Math.round(d[i].lower)!==Math.round(d[i+1].model.s)+1) throw new Error(`档 ${i} lower 应等于下一档分数+1`);
    if(d[i].lower>d[i].upper) throw new Error(`档 ${i} 区间退化: [${d[i].lower},${d[i].upper}]`);
  }
  return d.map(t=>`${t.model.n.slice(0,24)}:[${Math.round(t.lower)},${Math.round(t.upper)}]`).join('\n     ');
});
T('暴力校验：每个门槛 T 的赢家 == min{cost | score>=T}', ()=>{
  const mx=D().stats.score_max, mn=D().stats.score_min; const bad=[]; let n=0;
  for(let t=mx;t>=mn;t--){ if(++n>3000) throw new Error('guard'); S.hi=t; recompute();
    const b=brute(t);
    if(!view||!b){ if(view||b) bad.push(`T=${t} null 不一致`); continue; }
    if(view.w.n!==b.n||Math.abs(view.w.c-b.c)>1e-9) bad.push(`T=${t}: 工具=${view.w.n}($${view.w.c}) 暴力=${b.n}($${b.c})`);
  }
  S.hi=mx; recompute();
  if(bad.length) throw new Error(bad.length+' 处不一致：'+bad.slice(0,3).join(' | '));
  return `${n} 个门槛全部与暴力解一致（0 处偏差）`;
});
T('拖动分数线的赢家序列 == 前沿顺序', ()=>{
  const mx=D().stats.score_max, mn=D().stats.score_min; const seen=[]; let n=0;
  for(let t=mx;t>=mn;t--){ if(++n>3000) throw new Error('guard'); S.hi=t; recompute(); if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n); }
  const exp=tiers.map(x=>x.model.n);
  if(seen.length!==exp.length||!seen.every((x,i)=>x===exp[i])) throw new Error('顺序不一致');
  S.hi=mx; recompute();
  return `${seen.length} 档，从高到低依次：\n     `+seen.join('\n     → ');
});
T('T=最高分 → 最强模型', ()=>{ S.hi=D().stats.score_max; recompute(); if(view.w.s!==D().stats.score_max) throw new Error(view.w.n); return `${view.w.n} | ${view.w.s} | $${view.w.c} | ↑ 无（天花板）`; });
T('T=1660 → DeepSeek-V4.1-Flash $0.12（而非 Kimi $0.91）', ()=>{ S.hi=1660; recompute();
  if(view.w.n!=='DeepSeek-V4.1-Flash-20261017 (Max)') throw new Error('实际 '+view.w.n);
  const r=`${view.w.n} | ${view.w.s} | $${view.w.c} | 统治门槛区间 [${view.covers.map(Math.round)}]\n     ↑ 升一档：${view.nxt.n} +${view.marginal.ds} 分 / +$${view.marginal.dc.toFixed(2)} = $${view.marginal.per.toFixed(4)} 每分`;
  S.hi=D().stats.score_max; recompute(); return r; });
T('T=1500 → Hy3 $0.04（Muse Spark Open 被支配故出局）', ()=>{ S.hi=1500; recompute();
  if(view.w.n!=='Hy3') throw new Error('实际 '+view.w.n);
  const muse=cur.find(m=>m.n==='Muse Spark Open (Max)'), dom=cur.find(m=>m.s>muse.s&&m.c<muse.c);
  const r=`${view.w.n} | ${view.w.s} | $${view.w.c}\n     Muse Spark Open (${muse.s}/$${muse.c}) 被 ${dom.n} (${dom.s}/$${dom.c}) 支配 → 不在前沿`;
  S.hi=D().stats.score_max; recompute(); return r; });
T('每一档的「↑升一档 边际单价」', ()=>{
  const rows=[];
  for(let i=tiers.length-1;i>=0;i--){ S.hi=tiers[i].lower; recompute();
    rows.push(`${String(view.w.s).padEnd(5)} $${String(view.w.c).padEnd(8)} ${view.w.n.slice(0,30).padEnd(30)} ↑ ${view.marginal?('$/分 '+view.marginal.per.toPrecision(3)+' → '+view.marginal.model.n.slice(0,22)):'天花板'}`); }
  S.hi=D().stats.score_max; recompute(); return rows.join('\n     ');
});
T('标注区间 == 实际统治区间（全数据集逐个门槛暴力核对）', ()=>{
  let tot=0, bad=[];
  for(const ds of ['overall_os','frontend_os','fullstack_os','react_os','reference_os','img2webdev_os','overall_all']){
    offTime(); S.ds=ds; S.mode='pareto'; S.ci='point'; loadDataset(true);
    const st=DATASETS[ds].stats, fr=[...tiers];
    for(let i=0;i<fr.length;i++){
      const own=[];
      for(let T=st.score_min;T<=st.score_max;T++){ S.hi=T; recompute(); tot++;
        if(view&&view.w&&view.w.n===fr[i].model.n) own.push(T); }
      if(!own.length){ bad.push(`${ds}#${i+1} ${fr[i].model.n} 从未获胜`); continue; }
      const lo=own[0], up=own[own.length-1];
      if(lo!==Math.round(fr[i].lower)||up!==Math.round(i===0?st.score_max:fr[i].upper))
        bad.push(`${ds}#${i+1} ${fr[i].model.n}: 标注[${Math.round(fr[i].lower)},${Math.round(fr[i].upper)}] 实际[${lo},${up}]`);
      if(own.length!==(up-lo+1)) bad.push(`${ds}#${i+1} ${fr[i].model.n} 统治区不连续`);
    }
  }
  S.hi=DATASETS.overall_os.stats.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  if(bad.length) throw new Error(bad.slice(0,4).join(' | ')+(bad.length>4?` …共 ${bad.length} 处`:''));
  return `7 个数据集的全部前沿档、共 ${tot} 次门槛判定：每一档标注的区间与它实际获胜的区间**逐位相同**，且都连续`;
});
T('严格 CI 模式：合并统计上不可区分的档', ()=>{
  const res=[];
  for(const ds of ['overall_os','frontend_os','fullstack_os','overall_all']){
    S.ds=ds; S.ci='point'; loadDataset(true); const a=tiers.length;
    S.ci='strict'; loadDataset(true); const b=tiers.length;
    for(let i=1;i<tiers.length;i++){ const A=tiers[i-1].model,B=tiers[i].model;
      if(!(A.sLo>B.sHi)) throw new Error(`${ds}: ${A.n} 与 ${B.n} 仍不可区分`); }
    res.push(`${ds} ${a}→${b}`);
  }
  S.ci='point'; reset(); return res.join(' | ');
});
T('最少票数过滤', ()=>{ S.minVotes=10000; recompute(); const n=cur.length,t=tiers.length; S.minVotes=0; recompute(); return `${n} 个模型 / ${t} 档（未过滤：${cur.length}/${tiers.length}）`; });
T('排除 Preliminary', ()=>{ S.exPrelim=true; recompute(); if(frontier.some(m=>m.pre)) throw new Error('前沿上仍有 Preliminary'); const t=tiers.length; S.exPrelim=false; recompute(); return `${t} 档，前沿无 Preliminary`; });
T('预算上限 $0.20 → 赢家被压低', ()=>{ S.maxCost=0.2; S.hi=1660; recompute();
  const r=`T=1660 且 ≤$0.20 → ${view?view.w.n+' ('+view.w.s+', $'+view.w.c+')':'无解'}`;
  S.maxCost=Infinity; S.hi=D().stats.score_max; recompute(); return r; });
T('门槛高于最高分 → degraded 提示', ()=>{ S.hi=D().stats.score_max+50; recompute(); const ok=view.degraded===true; S.hi=D().stats.score_max; recompute(); return ok?'degraded=true，回退到最强档':'FAIL'; });
T('无解时返回空状态', ()=>{ S.minVotes=25000; S.maxCost=0.001; recompute(); const ok=view===null; reset(); return ok?'view=null → 卡片显示空状态':'FAIL'; });
T('口径② 分数/美元 的退化（印证文中的警告）', ()=>{ S.mode='ratio'; S.hi=D().stats.score_max; recompute(); const r=`${view.w.n}（${view.w.s} 分 / $${view.w.c}）= ${Math.round(view.val)} 分每美元 ← 荒谬，故不推荐`; S.mode='pareto'; recompute(); return r; });
T('口径③ (Score−1200)/$', ()=>{ S.mode='baseline'; S.hi=D().stats.score_max; recompute(); const r=`${view.w.n}（${view.w.s} 分 / $${view.w.c}）= ${view.val.toFixed(0)} 超额分每美元`; S.mode='pareto'; recompute(); return r; });
/* 其余每个数据集都逐个门槛扫一遍：工具给出的赢家必须等于暴力解 min{cost | score ≥ T} */
['fullstack_os','frontend_os','react_os','reference_os','img2webdev_os','overall_all'].forEach(k=>{
  T('数据集 '+k+' 全门槛扫描', ()=>{ const r=sweep(k,1); reset();
    if(r.bad.length) throw new Error(r.bad.slice(0,3).join(' | '));
    if(!r.orderOK) throw new Error('拖动时赢家顺序与前沿顺序不一致');
    if(r.models<2) throw new Error('可用模型太少：'+r.models);
    return `${r.models} 模型 / ${r.tiers} 档 / ${r.n} 个门槛全部匹配暴力解\n     `+r.seen.join('\n     → '); });
});
T('渲染全链路不抛异常', ()=>{ const mx=D().stats.score_max, mn=D().stats.score_min;
  [mx,1600,1500,1400,1300,mn].forEach(t=>{S.hi=t;recompute();render();});
  S.mode='ratio'; S.hi=mx; recompute(); render();
  S.mode='baseline'; recompute(); render();
  S.ci='strict'; S.mode='pareto'; recompute(); render(); S.ci='point';
  S.hi=mx; recompute(); return '6 个门槛 × 3 种口径 × 2 种 CI 模式，scatter/steps/tiers/table 全部渲染成功'; });
T('金额格式：极小值不被抹成 $0.0000', ()=>{
  const cases=[[0.0027,'$0.0027'],[0.0000274,'$2.7e-5'],[0.05,'$0.050'],[0.91,'$0.91'],[11.04,'$11.0'],[0.0001,'$1.0e-4']];
  return cases.map(([v])=>`${v} → ${fmt$(v)}`).join('  |  ');
});
T('粘贴解析（含 Overall Rank 列）', ()=>{
  const smp='| Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 1 | 5 | [Test X](https://x.com)<br>LabX · MIT | 1700+5/-5 | 110 | 3,000 | $0.42 | $1 / $3 | 200K |\n| 2 | 9 | [Test Y](https://y.com)<br>LabY · Apache 2.0 | 1600+8/-8Preliminary | 520 | 900 | $0.05 | $0.2 / $0.8 | N/A |';
  const r=parsePasted(smp); if(r.length!==2) throw new Error('rows='+r.length);
  if(r[0].s!==1700||r[0].c!==0.42||r[0].lic!=='MIT') throw new Error(JSON.stringify(r[0]));
  if(!r[1].pre) throw new Error('preliminary 未识别');
  return JSON.stringify(r);
});
T('粘贴解析（无 Overall Rank 列）', ()=>{
  const smp='| Rank | Rank Spread | Model | Score | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| 3 | 35 | Anthropic<br>[Claude Test 9 (xHigh)](https://a.com)<br>Anthropic · Proprietary | 1772+10/-10 | 5,895 | $3.02 | $2 / $10 | 1M |';
  const r=parsePasted(smp); if(r.length!==1||r[0].lab!=='Anthropic'||r[0].v!==5895) throw new Error(JSON.stringify(r)); return JSON.stringify(r);
});
T('粘贴解析（制表符分隔、列不全）', ()=>{
  const smp='Rank\tModel\tScore\tVotes\tCost/Task (P50)\n1\t[Zed 1](https://z.com)\t1500+5/-5\t1,000\t$0.20';
  const r=parsePasted(smp);
  if(r.length!==1) throw new Error('rows='+r.length);
  if(r[0].n!=='Zed 1'||r[0].s!==1500||r[0].v!==1000||r[0].c!==0.2) throw new Error(JSON.stringify(r[0]));
  return JSON.stringify(r[0]);
});
T('粘贴解析：Rank Spread 不能被当成 votes / overall rank', ()=>{
  const smp='| Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 19 | 67 | [Kimi K2.6](https://k.com)<br>Moonshot · Modified MIT | 1509+7/-7 | 6172 | 10,005 | $0.24 | $0.95 / $4 | 262.1K |\n| 4 | 23 | Thinking Machines<br>[Inkling 2 Small](https://t.ai)<br>Thinky · Apache 2.0 | 1647+19/-19Preliminary | 1632 | 990 | $0.31 | $0.30 / $1 | N/A |';
  const r=parsePasted(smp);
  if(r.length!==2) throw new Error('rows='+r.length);
  const k=r[0];
  if(k.r!==19) throw new Error('rank '+k.r);
  if(k.or!==67) throw new Error('overall rank '+k.or+' (期望 67，不能是 Rank Spread 6172)');
  if(k.v!==10005) throw new Error('votes '+k.v+' (期望 10005，不能是 Rank Spread 6172)');
  if(k.c!==0.24||k.pin!==0.95||k.pout!==4||k.ctx!=='262.1K') throw new Error(JSON.stringify(k));
  /* arena.ai 的模型单元格有两种写法：
       "Thinking Machines<br>[Inkling 2 Small](url)<br>Thinky · Apache 2.0"  → lab 在链接前
       "[Kimi K2.6](url)<br>Moonshot · Modified MIT"                        → lab 只在链接后的 "X · Y" 里
     所以 Kimi 这行 lab=null 是正确行为，许可取 "· " 之后的部分。 */
  if(k.lab!==null||k.lic!=='Modified MIT') throw new Error('lab/lic '+k.lab+'/'+k.lic);
  const ink=r[1];
  if(ink.lab!=='Thinking Machines'||!ink.pre||ink.v!==990||ink.ctx!==null) throw new Error(JSON.stringify(ink));
  return `Kimi K2.6: rank=${k.r} orank=${k.or} votes=${k.v} cost=$${k.c} ctx=${k.ctx} lab=${k.lab}\n     Inkling 2 Small: lab=${ink.lab} pre=${ink.pre} votes=${ink.v} ctx=${ink.ctx}`;
});
T('粘贴解析：全部模型视图（无 Overall Rank 列，Rank Spread 在第 2 列）', ()=>{
  const smp='| Rank | Rank Spread | Model | Score | Votes | Cost/Task (P50) | Price $/M | Context |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| 12 | 1017 | [Kimi K3.1 Pro (Max)](https://k.ai)<br>Moonshot · Kimi K3.1 Pro License | 1687+10/-10 | 4,977 | $0.91 | $2 / $10 | 1M |\n|  | N/A | [Ernie 5.5 Flash Preview](https://e.com)<br>Baidu · Proprietary | 1668+16/-16 [AutoEval](https://arena.ai/blog/autoeval-scores) | N/A | N/A | $0.28 / $1.13 | N/A |';
  const r=parsePasted(smp);
  if(r.length!==2) throw new Error('rows='+r.length);
  const k=r[0];
  if(k.r!==12||k.or!==null) throw new Error(`rank=${k.r} orank=${k.or}（期望 12 / null，Rank Spread 1017 不能被当 orank）`);
  if(k.v!==4977) throw new Error('votes '+k.v);
  if(k.c!==0.91||k.pin!==2||k.pout!==10||k.ctx!=='1M') throw new Error(JSON.stringify(k));
  const e=r[1];
  if(e.r!==null||!e.ae||e.v!==null||e.c!==null||e.pin!==0.28) throw new Error(JSON.stringify(e));
  return `Kimi: rank=${k.r} orank=${k.or} votes=${k.v} $${k.c}\n     Ernie AutoEval: rank=${e.r} autoeval=${e.ae} votes=${e.v} cost=${e.c} pin=$${e.pin}`;
});
/* 整列没有 Cost/Task 的榜单（arena.ai 的 WebDev · HTML 子榜就是这样）：不能崩，且必须说清原因，
   否则用户会以为是自己的过滤条件设错了。 */
T('无成本列的榜单：不崩溃 + 明确提示原因', ()=>{
  const NOCOST=[
   '| Rank | Overall Rank | Model | Score | Rank Spread | Votes | Cost/Task (P50) | Price $/M | Context |',
   '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
   '| 1 | 11 | [DeepSeek-V4.1-Flash-20261017 (Max)](https://hf.co/a)<br>DeepSeek · MIT | 1696+14/-14 | 618 | 2,351 |  | $0.15 / $0.60 | 1M |',
   '| 2 | 12 | [Kimi K3.1 Pro (Max)](https://k.ai/b)<br>Moonshot · Kimi K3.1 Pro License | 1689+22/-22 | 619 | 934 |  | $2 / $10 | 1M |',
   '| 3 | 16 | Thinking Machines<br>[Inkling 2 Small](https://tm.ai/c)<br>Thinky · Apache 2.0 | 1661+55/-55Preliminary | 538 | 130 |  | $0.30 / $1 | N/A |',
   '| 4 | 23 | [Kimi K3 (Max)](https://k.ai/d)<br>Moonshot · Kimi K3 license | 1640+12/-12 | 1632 | 3,128 |  | $3 / $15 | 1M |'].join('\n');
  const r=parsePasted(NOCOST);
  if(r.length!==4) throw new Error('rows='+r.length);
  if(r.some(x=>x.c!==null)) throw new Error('成本应全为 null: '+JSON.stringify(r.map(x=>x.c)));
  if(r.map(x=>x.s).join()!=='1696,1689,1661,1640') throw new Error('分数解析错 '+JSON.stringify(r.map(x=>x.s)));
  if(r[0].pin!==0.15||r[0].pout!==0.6) throw new Error('$/M 解析错 '+JSON.stringify([r[0].pin,r[0].pout]));
  if(!r[2].pre) throw new Error('Preliminary 未识别');
  $('#paste').value=NOCOST; $('#pasteName').value='HTML 子榜（无成本列）'; $('#addDs').onclick();
  const key=S.ds, d=DATASETS[key];
  if(d.stats.with_cost!==0) throw new Error('with_cost='+d.stats.with_cost);
  const msg=$('#pasteMsg').innerHTML;
  if(!/Cost\/Task column is entirely empty/.test(msg)) throw new Error('paste hint missing reason: '+msg);
  if(view!==null||tiers.length!==0) throw new Error('应无前沿，实际 tiers='+tiers.length);
  const card=$('#winCard');
  // 注意：fake DOM 的 appendChild 不会回写父节点 innerHTML，且 el() 写的是子节点 innerHTML
  const cardTxt=[card.innerHTML,...card.children.map(c=>(c.innerHTML||'')+(c.textContent||''))].join(' ');
  if(!/no Cost\/Task data/.test(cardTxt)) throw new Error('main card missing explanation: '+cardTxt.slice(0,140));
  S.onlyCost=false; loadDataset(true);
  if(cur.length!==4||tiers.length!==0) throw new Error('关掉成本过滤后 cur='+cur.length+' tiers='+tiers.length);
  const said=msg.replace(/<[^>]+>/g,'').slice(0,52);
  reset(); delete DATASETS[key];
  return `4 行 / 成本全空 → 前沿 0 档；提示："${said}…"`;
});
/* 交叉校验：浏览器版 parsePasted() 解析 raw/*.md 的结果，必须与 parse.py 写出的
   data/datasets.json 逐字段一致 —— 两套独立实现互为参照，任何一方跑偏都会在这里暴露。 */
T('交叉校验：JS parsePasted() ≡ Python parse.py（逐字段）', ()=>{
  const fs=require('fs'), P=require('path'), ROOT=P.join(__dirname,'..');
  const ref=JSON.parse(fs.readFileSync(P.join(ROOT,'data','datasets.json'),'utf8'));
  const F=ref.fields, norm=x=>(x===''||x===undefined)?null:x;
  let cells=0, rowsTot=0; const bad=[];
  for(const key of Object.keys(ref.datasets)){
    const f=P.join(ROOT,'raw',key+'.md');
    if(!fs.existsSync(f)){ bad.push(key+': 缺 raw/'+key+'.md'); continue; }
    const got=parsePasted(fs.readFileSync(f,'utf8')), want=ref.datasets[key].rows;
    rowsTot+=want.length;
    if(got.length!==want.length) bad.push(`${key}: 行数 JS=${got.length} PY=${want.length}`);
    const n=Math.min(got.length,want.length);
    for(let i=0;i<n;i++) for(let j=0;j<F.length;j++){
      const a=norm(got[i][F[j]]), b=norm(want[i][j]); cells++;
      if(a!==b) bad.push(`${key}#${i+1}.${F[j]}: JS=${JSON.stringify(a)} PY=${JSON.stringify(b)}`);
    }
  }
  if(bad.length) throw new Error(bad.slice(0,6).join(' | ')+(bad.length>6?` …共 ${bad.length} 处差异`:''));
  return `${Object.keys(ref.datasets).length} 个数据集 / ${rowsTot} 行 × ${F.length} 字段 = ${cells} 个单元格，0 处差异`;
});
/* ==================== 价格情景 / 时间变量 ==================== */
const PEAK={h:2,dow:3}, OFF={h:12,dow:3}, SAT={h:12,dow:6};
function at(sc,T){ onTime(sc.h,sc.dow); S.ds='overall_os'; S.hi=T; recompute(); }
function cOf(name,sc){ at(sc,S.hi); const m=cur.find(x=>x.n===name); return m?m.c:null; }
const DS0910='DeepSeek-V4.1-Flash-20260910 (Max)', DS1017='DeepSeek-V4.1-Flash-20261017 (Max)', GLM='GLM-5.3-Flash';

T('价格情景：全部关闭 = 完全还原榜面价', ()=>{
  offTime(); S.ds='overall_os'; loadDataset(true);
  const d=D().models; let bad=0;
  for(const m of d){ if(m.cRaw==null){ if(m.c!==null)bad++; continue; }
    if(Math.abs(m.c-m.cRaw)>1e-12) bad++;
    if(m.c!==m.cRaw) m.__x=1; }
  if(bad) throw new Error(bad+' 个模型的成本被改写');
  return `${d.length} 个模型全部等于 cRaw；pinRaw/poutRaw 也一并保存`;
});
T('峰时（周三 02:00 UTC）：榜面价是谷价的 DeepSeek 成本翻倍', ()=>{
  offTime(); S.ds='overall_os'; loadDataset(true); const d=D().models;
  const g=n=>d.find(m=>m.n===n);
  at(PEAK,1600);
  const a=g(DS1017), b=g(DS0910);
  if(Math.abs(a.c-a.cRaw*2)>1e-9) throw new Error('20261017 未翻倍: '+a.cRaw+'→'+a.c);
  if(Math.abs(b.c-b.cRaw)>1e-9) throw new Error('20260910 榜面本就是峰价，不该变: '+b.c);
  return `${DS1017}: 榜面 $${a.cRaw} → 峰时 $${a.c.toFixed(4)}（×${a.adj.scale.toFixed(2)}）；${DS0910}: $${b.cRaw} → $${b.c.toFixed(4)}（榜面已是峰价，不变）`;
});
T('谷时（周三 12:00 UTC）：榜面价是峰价的 DeepSeek 成本减半', ()=>{
  offTime(); S.ds='overall_os'; loadDataset(true); const d=D().models; const g=n=>d.find(m=>m.n===n);
  at(OFF,1600);
  const a=g(DS1017), b=g(DS0910), p=g('DeepSeek-V4-Pro');
  if(Math.abs(a.c-a.cRaw)>1e-9) throw new Error('20261017 榜面本就是谷价，不该变: '+a.c);
  if(Math.abs(b.c-b.cRaw/2)>1e-9) throw new Error('20260910 未减半: '+b.cRaw+'→'+b.c);
  if(Math.abs(p.c-p.cRaw/2)>1e-9) throw new Error('V4-Pro 未减半');
  return `${DS0910}: $${b.cRaw} → $${b.c.toFixed(4)}；DeepSeek-V4-Pro: $${p.cRaw} → $${p.c.toFixed(4)}；${DS1017} 保持 $${a.c}（榜面已是谷价）`;
});
T('周末豁免：周六 02:00 仍是谷价（峰时窗口只在工作日）', ()=>{
  const wk=cOf(DS0910,{h:2,dow:3}), we=cOf(DS0910,{h:2,dow:6}), su=cOf(DS0910,{h:2,dow:0});
  if(!(Math.abs(wk-we*2)<1e-9 && Math.abs(we-su)<1e-9)) throw new Error(`周三 ${wk} / 周六 ${we} / 周日 ${su}`);
  return `${DS0910}: 周三 02:00 = $${wk.toFixed(4)}，周六 02:00 = 周日 02:00 = $${we.toFixed(4)}`;
});
T('GLM-5.3-Flash 促销修正：日期跨过 2026-09-09 即涨价', ()=>{
  /* 注意：每次都必须拷贝数值 —— find() 返回的是同一个对象引用，
     后一次 applyPriceScenario 会就地改写它，直接存引用会读到「最后一次」的值。 */
  const snap=d=>{ onTime(OFF.h,OFF.dow,d); S.ds='overall_os'; S.hi=1500; recompute();
    const m=D().models.find(x=>x.n===GLM);
    return {c:m.c, cRaw:m.cRaw, scale:m.adj?m.adj.scale:1, date:d}; };
  const m1=snap('2026-09-01'), m8=snap('2026-09-08'), m9=snap('2026-09-09'), mN=snap(DATA.scraped);
  if(Math.abs(m1.c-m8.c)>1e-9) throw new Error('促销期内应完全相同: '+m1.c+' vs '+m8.c);
  if(Math.abs(m1.c-m1.cRaw)>1e-9) throw new Error('促销期内应等于榜面价: '+m1.c+' vs '+m1.cRaw);
  if(!(m9.c>m1.c)) throw new Error('2026-09-09 当天应已涨价');
  if(Math.abs(m9.c-mN.c)>1e-9) throw new Error('09-09 之后应保持稳定');
  if(Math.abs(m9.scale-2.9452)>1e-4) throw new Error('倍率应为 2.945，实际 '+m9.scale);
  return `促销期（09-01 = 09-08）${fmt$(m1.c)} = 榜面价 → 09-09 起 ${fmt$(m9.c)}（×${m9.scale.toFixed(3)}，此后不再变）；输入 $0.05→$0.15、输出 $0.18→$0.50，按 8% 输出占比加权`;
});
T('输出占比滑块只对「输入输出涨幅不同」的修正起作用', ()=>{
  S.outShare=0;    const ds0=cOf(DS1017,PEAK), glm0=cOf(GLM,OFF);
  S.outShare=0.5;  const ds1=cOf(DS1017,PEAK), glm1=cOf(GLM,OFF);
  S.outShare=1/12;
  if(Math.abs(ds0-ds1)>1e-12) throw new Error('DeepSeek 峰谷是同比涨跌，不该受滑块影响');
  if(Math.abs(glm0-glm1)<1e-12) throw new Error('GLM 修正应随滑块变化');
  return `DeepSeek ×2 恒定（$${ds0.toFixed(4)}）；GLM 0%输出=$${glm0.toFixed(4)} → 50%输出=$${glm1.toFixed(4)}`;
});
T('存疑事件默认关闭，且勾选后可见（敏感性分析）', ()=>{
  const st={}; PRICE_EVENTS.forEach(e=>st[e.id]=S.evState[e.id]);
  if(st.ds_v4flash!==false||st.suspect2x!==false) throw new Error('默认应为 false: '+JSON.stringify(st));
  if(st.ds_tod!==true||st.glm_promo!==true) throw new Error('已核实事件默认应为 true');
  onTime(OFF.h,OFF.dow); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const g=n=>DATASETS.overall_os.models.find(m=>m.n===n);
  const before=[g('Mistral Medium 3.5'),g('GPT-6 Sol (Max)')];
  if(before.some(m=>m&&m.adj)) throw new Error('存疑事件不该在关闭时生效');
  S.evState.suspect2x=true; recompute();
  const after=[g('Mistral Medium 3.5'),g('GPT-6 Sol (Max)')].filter(Boolean);
  const res=`默认 ${JSON.stringify(st)}（已核实=开、存疑=关）。关闭时：`+
    before.filter(Boolean).map((m,i)=>`${m.n} ${fmt$(m.c)}`).join('，')+
    `；勾选「差 2 倍存疑」后：`+after.map((m,i)=>`${m.n} ${fmt$(m.cRaw)}→${fmt$(m.c)}`).join('，')+
    `（${after.length} 个命中）`;
  if(after.some(m=>!m.adj)) throw new Error('勾选后应命中: '+after.map(m=>m.n).join(','));
  S.evState.suspect2x=false; S.ds='overall_os'; return res;
});
T('时间变量下 C(T) 仍是单调阶梯（峰时 168 个门槛暴力对照）', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; S.mode='pareto'; S.ci='point'; loadDataset(true);
  const d=D().models; let bad=0, n=0; const seen=[];
  for(let t=d.stats?0:0, th=d.length?DATASETS.overall_os.stats.score_max:0; th>=DATASETS.overall_os.stats.score_min; th--){
    if(++n>2000) throw new Error('iteration guard');
    S.hi=th; recompute();
    const q=cur.filter(m=>m.s>=th&&m.c!=null);
    if(!q.length){ if(view&&view.w) bad++; continue; }
    const mc=Math.min(...q.map(m=>m.c));
    const b=q.filter(m=>m.c===mc).sort((a,b2)=>b2.s-a.s)[0];
    if(!view||!view.w||view.w.n!==b.n) bad++;
    if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n);
  }
  if(bad) throw new Error(bad+'/'+n+' 个门槛不一致');
  const fr=tiers.map(x=>x.model.n);
  const orderOK=seen.length===fr.length&&seen.every((x,i)=>x===fr[i]);
  if(!orderOK) throw new Error('扫描顺序与前沿顺序不一致');
  S.ds='overall_os'; S.hi=DATASETS.overall_os.stats.score_max;
  return `峰时下 ${n} 个门槛全部与暴力解一致，扫描顺序 = 前沿顺序；前沿 ${fr.length} 档`;
});
T('前沿成员会随时刻变化：谷时 DeepSeek 老版挤掉 Hy3', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); recompute();
  const peakFr=tiers.map(t=>t.model.n);
  onTime(SAT.h,SAT.dow); recompute();
  const offFr=tiers.map(t=>t.model.n);
  const added=offFr.filter(n=>!peakFr.includes(n)), removed=peakFr.filter(n=>!offFr.includes(n));
  if(!added.length) throw new Error('谷时应有新成员进入前沿');
  S.hi=1500; onTime(PEAK.h,PEAK.dow); recompute(); const wp=view.w.n, wc=view.w.c;
  onTime(SAT.h,SAT.dow); recompute(); const wo=view.w.n, woc=view.w.c;
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `峰时 ${peakFr.length} 档 vs 周六谷时 ${offFr.length} 档；新进：${added.join('、')}｜掉出：${removed.join('、')||'无'}。`+
    `\n     T=1500 的赢家：峰时 ${wp} ${fmt$(wc)} → 周六谷时 ${wo} ${fmt$(woc)}`;
});
T('weekCurve 与 cheapestAt 一致，且峰时小时数 = 35', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const pts=weekCurve(1600,cur);
  if(pts.length!==168) throw new Error('应为 168 点');
  const peakH=pts.filter(p=>p.peak).length;
  if(peakH!==35) throw new Error('工作日 7 峰时小时 ×5 = 35，实际 '+peakH);
  let sw=0, prev=null;
  pts.forEach(p=>{ if(p.n&&p.n!==prev){ if(prev!==null)sw++; prev=p.n; } });
  const vals=[...new Set(pts.map(p=>p.c!=null?fmt$(p.c):'—'))];
  for(let i=1;i<168;i++){ const a=pts[i-1],b=pts[i];
    if(a.c!=null&&b.c!=null){ if(!(Math.abs(a.c-b.c)<1e-12 || a.peak!==b.peak)) throw new Error('第'+i+'小时出现无时段切换的成本变化'); } }
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `168 小时 → ${sw} 次冠军易主，C(T) 只取 ${vals.length} 个值：${vals.join(' / ')}`;
});
T('一键开关：「榜面原样（全关）」与「全部启用（含存疑）」', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); S.hi=1500; recompute();
  SCEN_BOARD(); renderEvList(); recompute();
  const boardN=tiers.map(t=>t.model.n), boardAdj=(cur||[]).filter(m=>m.adj).length;
  if(boardAdj!==0) throw new Error('全关后仍有 '+boardAdj+' 个模型被改写');
  const board1500=view.w.n;
  SCEN_ALL(); renderEvList(); recompute();
  const allN=tiers.map(t=>t.model.n), allAdj=(cur||[]).filter(m=>m.adj).length;
  if(allAdj<1) throw new Error('全开后没有任何模型被改写');
  const hitSus=PRICE_EVENTS.filter(e=>e.conf!=='official'&&DATASETS.overall_os.models.some(m=>e.entries[m.n])).map(e=>e.id);
  SCEN_BOARD(); renderEvList(); offTime(); S.ds='overall_os'; loadDataset(true);
  return `全关（含缓存）：前沿 ${boardN.length} 档、0 个改写、T=1500 冠军 ${board1500}；全开：前沿 ${allN.length} 档、${allAdj} 个改写`+
    `（存疑事件在本数据集命中 ${hitSus.length?hitSus.join(','):'无'} 条）；复选框状态已随开关重绘`;
});
/* ==================== 缓存折扣 ==================== */
/* 独立手算：effPin = (1−h)·pin·wm + h·pin·r ；scale = blend(effPin,pout) / blend(pinBoard,poutBoard) */
function expectScale(m,h,r,wm,w,pinNow,poutNow){
  const eff=(1-h)*pinNow*wm + h*pinNow*r;
  const num=eff*(1-w)+poutNow*w, den=m.pinRaw*(1-w)+m.poutRaw*w;
  return num/den;
}
function G(ds,n){ return DATASETS[ds].models.find(m=>m.n===n); }

T('缓存算术：与独立手算公式逐项吻合（含写入倍率）', ()=>{
  onTime(12,3); cacheOn(0.95); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const w=S.outShare, cases=[];
  for(const n of ['DeepSeek-V4.1-Flash-20261017 (Max)','Kimi K3.1 Pro (Max)','MiMo-V2.6-Flash','Hy3','GLM-5.3 (Max)']){
    const m=G('overall_os',n); if(!m) throw new Error('缺模型 '+n);
    const got=priceScale(m,S.hour,S.dow,S.dateISO);
    const exp=expectScale(m,0.95,got.cache.r,got.cache.wm,w,got.cache.pin,m.poutRaw);
    if(Math.abs(got.scale-exp)>1e-12) throw new Error(`${n}: 引擎 ${got.scale} ≠ 手算 ${exp}`);
    cases.push(`${n} r=${(got.cache.r*100).toFixed(1)}%${got.cache.est?'(推算)':'(公布)'} wm=${got.cache.wm} → ×${got.scale.toFixed(4)} = ${fmt$(m.cRaw)}→${fmt$(m.c)}`);
  }
  const cl=G('overall_all','Claude Opus 5.5 (Max)');
  onTime(12,3); cacheOn(0.95); S.ds='overall_all'; loadDataset(true); S.hi=1800; recompute();
  const cl2=G('overall_all','Claude Opus 5.5 (Max)');
  const gc=priceScale(cl2,S.hour,S.dow,S.dateISO);
  if(gc.cache.wm!==1.25) throw new Error('Anthropic 写入倍率应为 1.25，实际 '+gc.cache.wm);
  const ec=expectScale(cl2,0.95,gc.cache.r,1.25,S.outShare,gc.cache.pin,cl2.poutRaw);
  if(Math.abs(gc.scale-ec)>1e-12) throw new Error('Claude 手算不符');
  const dsc=G('overall_os','DeepSeek-V4.1-Flash-20261017 (Max)');
  if(writeMultOf(dsc)!==1) throw new Error('DeepSeek 不应有写入倍率');
  offTime(); S.ds='overall_os'; loadDataset(true);
  return cases.join('\n     ')+`\n     Claude Opus 5.5 (Max) wm=1.25 → ×${gc.scale.toFixed(4)}（写入费吃掉一部分折扣）`;
});
T('命中率单调：h 越高越便宜，h=0 精确等于「关缓存」', ()=>{
  onTime(12,3); S.ds='overall_os'; loadDataset(true); S.hi=1600;
  const m=G('overall_os','Kimi K3.1 Pro (Max)');
  S.cacheSrc='off'; recompute(); const off=m.c;
  const seq=[]; let prev=Infinity;
  for(const hh of [0,0.25,0.5,0.85,0.95,0.99,1]){
    cacheOn(hh); recompute(); const c=m.c; seq.push(`${Math.round(hh*100)}%:${fmt$(c)}`);
    if(c>prev+1e-12) throw new Error(`h=${hh} 时成本反而上升: ${prev} → ${c}`);
    prev=c;
  }
  cacheOn(0); recompute(); const zero=m.c;
  if(Math.abs(zero-off)>1e-12) throw new Error(`h=0 (${zero}) 应等于关缓存 (${off})`);
  cacheOn(1); recompute(); const full=m.c;
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `Kimi K3.1 Pro：关缓存 ${fmt$(off)} → ${seq.join(' → ')}；h=0 与关缓存完全相同（差 ${Math.abs(zero-off).toExponential(1)}）`;
});
T('输出 token 是折扣地板：h=100% 也压不到零，且余下账单几乎全是输出', ()=>{
  onTime(12,6); cacheOn(1); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const w=S.outShare, bad=[]; let outShareOfResidual=[];
  for(const m of cur){
    if(m.pinRaw==null||!m.adj) continue;
    const L=listPricesAt(m,S.hour,S.dow,S.dateISO), cr=cacheRatioOf(m);
    if(!cr) continue;
    /* h=1 时仍要付缓存读取价 L.pin·r；且峰谷事件会把 L.pout 一起改掉 */
    const floor=(L.pin*cr.r*(1-w)+L.pout*w)/(m.pinRaw*(1-w)+m.poutRaw*w);
    if(m.c < m.cRaw*floor-1e-12) bad.push(`${m.n}: ${m.c.toFixed(6)} < 地板 ${(m.cRaw*floor).toFixed(6)}`);
    const outPart=L.pout*w, inPart=L.pin*cr.r*(1-w);
    outShareOfResidual.push([m.n,outPart/(outPart+inPart)]);
  }
  if(bad.length) throw new Error(bad.slice(0,3).join(' | '));
  outShareOfResidual.sort((a,b)=>a[1]-b[1]);
  const lo=outShareOfResidual[0], hi=outShareOfResidual[outShareOfResidual.length-1];
  const m=G('overall_os','DeepSeek-V4.1-Flash-20261017 (Max)');
  const L=listPricesAt(m,S.hour,S.dow,S.dateISO);
  const floor=(L.pin*0.02*(1-w)+L.pout*w)/(m.pinRaw*(1-w)+m.poutRaw*w);
  const cFloor=m.c;                      // offTime() 会把 m.c 还原成榜面值，必须先取
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${outShareOfResidual.length} 个模型全部不低于「读取价 + 输出」地板；h=100% 时残余账单里输出 token 占比 ${(lo[1]*100).toFixed(1)}%（${lo[0]}）～ ${(hi[1]*100).toFixed(1)}%（${hi[0]}）。`+
    `\n     例：DeepSeek-20261017 h=100% → ×${floor.toFixed(4)}，${fmt$(m.cRaw)} → ${fmt$(cFloor)}，再高命中率也压不下去了`;
});
T('缓存 95% 是否换冠军：全门槛逐个对照 h=0', ()=>{
  onTime(12,6); S.ds='overall_os'; S.mode='pareto'; S.ci='point'; loadDataset(true);
  const st=DATASETS.overall_os.stats;
  const grab=()=>{ const r={}; for(let th=st.score_max; th>=st.score_min; th--){ S.hi=th; recompute();
      r[th]=view&&view.w?view.w.n:null; } return r; };
  cacheOn(0,'off'); const A=grab();
  cacheOn(0.95);    const B=grab();
  const diff=Object.keys(A).filter(t=>A[t]!==B[t]);
  /* 前沿成员差异 */
  cacheOn(0,'off'); S.hi=st.score_max; recompute(); const f0=tiers.map(t=>t.model.n);
  cacheOn(0.95); recompute(); const f1=tiers.map(t=>t.model.n);
  const res=`${Object.keys(A).length} 个门槛中 ${diff.length} 个换了冠军`+
    (diff.length?`（例：T=${diff[0]} ${A[diff[0]]} → ${B[diff[0]]}；T=${diff[diff.length-1]} ${A[diff[diff.length-1]]} → ${B[diff[diff.length-1]]}）`:'')+
    `；前沿 ${f0.length} → ${f1.length} 档，新进 [${f1.filter(n=>!f0.includes(n)).join('、')||'无'}]，掉出 [${f0.filter(n=>!f1.includes(n)).join('、')||'无'}]`;
  S.hi=st.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  return res;
});
T('敏感性数字锁定：面板/README 里引用的百分比必须可复现', ()=>{
  onTime(12,6); cacheOn(0.95); S.ds='overall_os'; loadDataset(true); S.hi=1600;
  const saveW=S.outShare;
  const pct=(n,w)=>{ S.outShare=w; const m=G('overall_os',n);
    return Math.round((1-priceScale(m,S.hour,S.dow,S.dateISO).scale)*100); };
  const DS='DeepSeek-V4.1-Flash-20261017 (Max)';
  const want=[[0.02,86],[1/12,68],[0.15,55],[0.25,40],[0.40,25]];
  for(const [w,exp] of want){ const got=pct(DS,w);
    if(got!==exp) throw new Error(`DeepSeek w=${(w*100).toFixed(0)}% 应省 ${exp}%，实际 ${got}%`); }
  const kimi=pct('Kimi K3.1 Pro (Max)',1/12), mimo=pct('MiMo-V2.6-Flash',1/12);
  if(kimi!==59) throw new Error('Kimi w=8% 应省 59%，实际 '+kimi);
  if(mimo!==79) throw new Error('MiMo w=8% 应省 79%，实际 '+mimo);
  /* 峰谷振幅被缓存压缩：T=1600 从 1.67× → 1.11× */
  const amp=hh=>{ cacheOn(hh,hh===0?'off':'pub'); S.outShare=1/12; S.hi=1600; recompute();
    const cs=weekCurve(1600,cur).filter(p=>p.c!=null).map(p=>p.c);
    return Math.max(...cs)/Math.min(...cs); };
  const a0=amp(0), a95=amp(0.95);
  if(Math.abs(a0-5/3)>0.01) throw new Error('h=0 振幅应约 1.67×，实际 '+a0.toFixed(3));
  if(!(a95<a0-0.4)) throw new Error(`缓存应显著压缩振幅: ${a0.toFixed(2)} → ${a95.toFixed(2)}`);
  S.outShare=saveW; S.hi=DATASETS.overall_os.stats.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  return `DeepSeek-20261017 @h=95%：w=2%→省86% / 8%→68% / 15%→55% / 25%→40% / 40%→25%；Kimi 省 ${kimi}%、MiMo 省 ${mimo}%。`+
    `T=1600 一周振幅 ${a0.toFixed(2)}× → 缓存 95% 后 ${a95.toFixed(2)}×`;
});
T('缓存读取价随峰谷/促销自动缩放（存比例而非绝对值的好处）', ()=>{
  const d=G('overall_os','DeepSeek-V4.1-Flash-20261017 (Max)');
  onTime(2,3); cacheOn(0.95); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const pk=priceScale(d,2,3,S.dateISO).cache.pc;
  const offp=priceScale(d,12,3,S.dateISO).cache.pc;
  if(Math.abs(pk-0.006)>1e-9) throw new Error('峰时缓存价应为 $0.006，实际 '+pk);
  if(Math.abs(offp-0.003)>1e-9) throw new Error('谷时缓存价应为 $0.003，实际 '+offp);
  const g=G('overall_os','GLM-5.3-Flash');
  S.dateISO='2026-09-01'; const promo=priceScale(g,12,3,S.dateISO).cache.pc;
  S.dateISO='2026-11-14'; const now=priceScale(g,12,3,S.dateISO).cache.pc;
  if(Math.abs(promo-0.01)>1e-9) throw new Error('促销期缓存价应为 $0.05×20%=$0.01，实际 '+promo);
  if(Math.abs(now-0.03)>1e-9) throw new Error('促销后缓存价应为 $0.15×20%=$0.03，实际 '+now);
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `DeepSeek-20261017：峰时 $${pk}/M、谷时 $${offp}/M（公布值 $0.006/$0.003）；GLM-5.3-Flash：促销期 $${promo}/M、促销后 $${now}/M（= 输入价的 20%）`;
});
T('缓存价来源三档：公布价 / 一律 10% / 关闭', ()=>{
  onTime(12,3); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const m=G('overall_os','MiMo-V2.6-Flash');       // 公布 ratio = 2%
  const f=G('overall_os','Gemma 4 31B');           // 无公布价 → 推算 10%
  cacheOn(0.95,'pub');  recompute(); const mp=m.c, fp=f.c;
  const rp=priceScale(m,S.hour,S.dow,S.dateISO).cache, rf=priceScale(f,S.hour,S.dow,S.dateISO).cache;
  cacheOn(0.95,'flat'); recompute(); const mf=m.c, ff=f.c;
  cacheOn(0.95,'off');  recompute(); const mo=m.c, fo=f.c;
  if(rp.est!==false) throw new Error('MiMo 应为公布价');
  if(rf.est!==true) throw new Error('Gemma 4 31B 应为推算');
  if(Math.abs(rp.r-0.02)>1e-9) throw new Error('MiMo ratio 应为 2%，实际 '+rp.r);
  if(Math.abs(rf.r-0.10)>1e-9) throw new Error('Gemma 推算 ratio 应为 10%，实际 '+rf.r);
  if(!(mp<mf)) throw new Error('公布价 2% 应比推算 10% 更便宜');
  if(Math.abs(mo-m.cRaw)>1e-12) throw new Error('关闭时应等于榜面价');
  if(Math.abs(fo-f.cRaw)>1e-12) throw new Error('关闭时应等于榜面价');
  let pub=0,est=0;
  cacheOn(0.95,'pub'); recompute();
  for(const x of cur){ if(x.pinRaw==null)continue; (CACHE_RATIO[x.n]!=null)?pub++:est++; }
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `MiMo-V2.6-Flash（公布 2%）：pub ${fmt$(mp)} / flat ${fmt$(mf)} / off ${fmt$(mo)}；Gemma 4 31B（推算 10%）：pub ${fmt$(fp)} / flat ${fmt$(ff)} / off ${fmt$(fo)}。候选集 ${pub} 个公布价、${est} 个推算`;
});
T('缓存 95% 下 C(T) 仍是单调阶梯（168 门槛暴力对照）', ()=>{
  onTime(2,3); cacheOn(0.95); S.ds='overall_os'; S.mode='pareto'; S.ci='point'; loadDataset(true);
  const st=DATASETS.overall_os.stats; let bad=0,n=0; const seen=[];
  for(let th=st.score_max; th>=st.score_min; th--){
    if(++n>2000) throw new Error('guard');
    S.hi=th; recompute();
    const q=cur.filter(m=>m.s>=th&&m.c!=null);
    if(!q.length){ if(view&&view.w) bad++; continue; }
    const mc=Math.min(...q.map(m=>m.c));
    const b=q.filter(m=>m.c===mc).sort((a,b2)=>b2.s-a.s)[0];
    if(!view||!view.w||view.w.n!==b.n) bad++;
    if(seen[seen.length-1]!==view.w.n) seen.push(view.w.n);
  }
  if(bad) throw new Error(bad+'/'+n+' 个门槛与暴力解不一致');
  const fr=tiers.map(x=>x.model.n);
  if(!(seen.length===fr.length&&seen.every((x,i)=>x===fr[i]))) throw new Error('扫描顺序 ≠ 前沿顺序');
  const res=`缓存 95% + 峰时下 ${n} 个门槛全部与暴力解一致；前沿 ${fr.length} 档（榜面口径为 7 档）`;
  S.hi=st.score_max; offTime(); S.ds='overall_os'; loadDataset(true);
  return res;
});
T('缓存把冠军换掉：h=0 → h=95% 的前沿与门槛赢家对比', ()=>{
  onTime(12,6); S.ds='overall_os'; loadDataset(true);
  cacheOn(0,'off'); S.hi=DATASETS.overall_os.stats.score_max; recompute();
  const f0=tiers.map(t=>`${t.model.n}@${t.model.s}`), c0={};
  for(const T0 of [1687,1664,1638,1600,1500]) { S.hi=T0; recompute(); c0[T0]=view.w?`${view.w.n} ${fmt$(view.w.c)}`:'—'; }
  cacheOn(0.95); S.hi=DATASETS.overall_os.stats.score_max; recompute();
  const f1=tiers.map(t=>`${t.model.n}@${t.model.s}`), c1={};
  for(const T0 of [1687,1664,1638,1600,1500]) { S.hi=T0; recompute(); c1[T0]=view.w?`${view.w.n} ${fmt$(view.w.c)}`:'—'; }
  const moved=Object.keys(c0).filter(T0=>c0[T0].split(' ')[0]!==c1[T0].split(' ')[0]);
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `档数 ${f0.length} → ${f1.length}；冠军易主的门槛：${moved.length?moved.map(T0=>`T=${T0}（${c0[T0]} → ${c1[T0]}）`).join('；'):'无'}`+
    `\n     h=95% 各门槛：${Object.keys(c1).map(T0=>`T=${T0} ${c1[T0]}`).join(' | ')}`;
});
T('未来事件：Gemini 4 Carbon/Argon 2026-12-01 涨价', ()=>{
  onTime(12,3); cacheOn(0.95); S.ds='overall_all'; loadDataset(true); S.hi=1770;
  const c=G('overall_all','Gemini 4 Carbon (High)');
  S.dateISO='2026-11-30'; recompute(); const before={c:c.c,pin:priceScale(c,S.hour,S.dow,S.dateISO).cache.pin};
  S.dateISO='2026-12-01'; recompute(); const after={c:c.c,sc:priceScale(c,S.hour,S.dow,S.dateISO)};
  if(!(after.c>before.c*1.9)) throw new Error(`12-01 应约翻倍: ${before.c} → ${after.c}`);
  const hit=after.sc.hits.find(x=>x.id==='gem_dec1');
  if(!hit) throw new Error('12-01 应命中 gem_dec1 事件');
  if(Math.abs(after.sc.cache.pin-4)>1e-9) throw new Error('涨价后输入标价应为 $4，实际 '+after.sc.cache.pin);
  if(Math.abs(after.sc.cache.pc-0.20)>1e-9) throw new Error('涨价后缓存价应为 $0.20，实际 '+after.sc.cache.pc);
  S.hi=DATASETS.overall_all.stats.score_max; S.dateISO='2026-11-30'; recompute();
  const fr0=tiers.map(t=>t.model.n);
  S.dateISO='2026-12-01'; recompute(); const fr1=tiers.map(t=>t.model.n);
  S.dateISO=DATA.scraped; offTime(); S.ds='overall_os'; loadDataset(true);
  return `Carbon：11-30 ${fmt$(before.c)} → 12-01 ${fmt$(after.c)}（输入 $2→$4、缓存 $0.10→$0.20）；overall_all 前沿 ${fr0.length} → ${fr1.length} 档`+
    (fr0.join()!==fr1.join()?`，成员变化：${fr1.filter(n=>!fr0.includes(n)).join(',')||'无'} 进 / ${fr0.filter(n=>!fr1.includes(n)).join(',')||'无'} 出`:'，成员未变');
});
T('渲染全链路：缓存控件 × 时刻 × 门槛不抛异常', ()=>{
  let n=0;
  for(const src of ['pub','flat','off']) for(const hh of [0,0.5,0.85,0.95,1]){
    for(const sc of [{h:2,dow:3},{h:12,dow:6}]){
      onTime(sc.h,sc.dow); cacheOn(hh,src);
      for(const T0 of [1687,1600,1500]){ S.ds='overall_os'; S.hi=T0; render(); n++;
        if(!$('#tl').children.length) throw new Error('tl 空');
        if(!$('#cacheHint').innerHTML.length) throw new Error('cacheHint 空');
        renderAdjNote(); }
    }
  }
  for(const ds of ['overall_all','reference_os','img2webdev_os']){
    onTime(2,3); cacheOn(0.95); S.ds=ds; loadDataset(true); S.hi=DATASETS[ds].stats.score_max; render(); n++; }
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${n} 种（缓存来源 × 命中率 × 时刻 × 门槛 × 数据集）组合渲染通过`;
});
T('weekSpan：冠军自己的一周成本波动区间', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); S.hi=1600; recompute();
  const g=n=>DATASETS.overall_os.models.find(m=>m.n===n);
  const a=weekSpan(g(DS0910)), b=weekSpan(g(DS1017)), c=weekSpan(g('Kimi K3.1 Pro (Max)'));
  if(Math.abs(a.lo-0.03)>1e-9||Math.abs(a.hi-0.06)>1e-9) throw new Error('20260910 应为 0.03–0.06，实际 '+a.lo+'–'+a.hi);
  if(Math.abs(a.spread-2)>1e-6) throw new Error('spread 应为 2.0');
  if(Math.abs(b.lo-0.12)>1e-9||Math.abs(b.hi-0.24)>1e-9) throw new Error('20261017 应为 0.12–0.24');
  if(Math.abs(c.spread-1)>1e-9) throw new Error('Kimi 无峰谷价，spread 应为 1，实际 '+c.spread);
  if(a.hiAt.hour!==1||!(a.hiAt.dow>=1&&a.hiAt.dow<=5)) throw new Error('最贵时刻应落在工作日峰时窗口起点');
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${DS0910}: ${fmt$(a.lo)}（${DOWS[a.loAt.dow]} ${a.loAt.hour}:00）— ${fmt$(a.hi)}（${DOWS[a.hiAt.dow]} ${a.hiAt.hour}:00），${a.spread.toFixed(2)}×；`+
    `${DS1017}: ${fmt$(b.lo)}–${fmt$(b.hi)}；Kimi K3.1 Pro: ${fmt$(c.lo)}–${fmt$(c.hi)}（无波动）`;
});
T('②③ 比值口径也跟着时间变量走（ratio 必须由修正后的 c 重算）', ()=>{
  onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true);
  S.mode='ratio'; S.hi=DATASETS.overall_os.stats.score_max; recompute();
  const peakW=view.w.n, peakV=view.val;
  S.mode='baseline'; recompute(); const peakB=view.w.n;
  let bad=0;
  for(const m of cur){ if(m.c>0 && Math.abs(m.ratio-m.s/m.c)>1e-9) bad++; }
  if(bad) throw new Error(bad+' 个模型的 ratio 没有用修正后的成本重算');
  onTime(SAT.h,SAT.dow); S.mode='ratio'; recompute(); const offW=view.w.n, offV=view.val;
  S.mode='pareto'; offTime(); S.ds='overall_os'; loadDataset(true);
  return `峰时 ②=${peakW}(${fmtR(peakV,0)} pts/$) ③=${peakB}；周六谷时 ②=${offW}(${fmtR(offV,0)} pts/$)；`+
    `${peakW===offW?'比值口径冠军未变（它本来就不受峰谷价影响，说明退化口径对时间变量也不敏感）':'比值口径冠军已改变'}`;
});
T('默认状态 = 「此刻」+ 只启用已核实的修正', ()=>{
  const st=INIT_EV;
  const off=PRICE_EVENTS.filter(e=>e.conf!=='official'&&st[e.id]).map(e=>e.id);
  const onBad=PRICE_EVENTS.filter(e=>e.conf==='official'&&!st[e.id]).map(e=>e.id);
  if(off.length) throw new Error('存疑事件不该默认开启: '+off.join(','));
  if(onBad.length) throw new Error('已核实事件不该默认关闭: '+onBad.join(','));
  const conf={official:0,suspected:0}; PRICE_EVENTS.forEach(e=>conf[e.conf]++);
  const models=Object.values(conf);
  const nHit=PRICE_EVENTS.filter(e=>e.conf==='official').reduce((a,e)=>a+Object.keys(e.entries).length,0);
  if(INIT.date!==DATA.scraped) throw new Error('默认计价日期应为抓取日: '+INIT.date);
  if(!(INIT.hour>=0&&INIT.hour<=23&&INIT.dow>=0&&INIT.dow<=6)) throw new Error('默认时刻越界: '+INIT.hour+'/'+INIT.dow);
  if(Math.abs(INIT.os-1/12)>1e-9) throw new Error('默认输出占比应为 1/12: '+INIT.os);
  return `${PRICE_EVENTS.length} 条规则（已核实 ${conf.official} 条默认开、存疑 ${conf.suspected} 条默认关），命中 ${nHit} 个模型条目；`+
    `初始状态 = UTC ${DOWS[INIT.dow]} ${String(INIT.hour).padStart(2,'0')}:00、计价日期 ${INIT.date}、输出占比 ${(INIT.os*100).toFixed(0)}%`;
});
T('idxOf/dowHourOf 往返一致 + jumpToIdx 落点正确', ()=>{
  let bad=0;
  for(let i=0;i<168;i++){ const {dow,hour}=dowHourOf(i); if(idxOf(dow,hour)!==i) bad++; }
  if(bad) throw new Error(bad+' 个索引往返失败');
  const d0=dowHourOf(0), d167=dowHourOf(167), mid=dowHourOf(idxOf(6,3));
  if(d0.hour!==0||d0.dow!==1) throw new Error('索引 0 应为周一 00:00');
  if(d167.hour!==23||d167.dow!==0) throw new Error('索引 167 应为周日 23:00');
  if(mid.hour!==3||mid.dow!==6) throw new Error('周六 03:00 往返失败');
  const keep={h:S.hour,d:S.dow}; jumpToIdx(idxOf(6,3));
  if(S.dow!==6||S.hour!==3) throw new Error('jumpToIdx 未写入状态');
  S.hour=keep.h; S.dow=keep.d; offTime(); S.ds='overall_os'; loadDataset(true);
  return '168 个索引全部往返一致；idx 0 = 周一 00:00，idx 167 = 周日 23:00';
});
T('渲染全链路：时间控件 + 时间轴 SVG 不抛异常', ()=>{
  let n=0;
  for(const sc of [PEAK,OFF,SAT,{h:1,dow:5},{h:23,dow:0}]){
    for(const T0 of [1687,1660,1600,1500,1400]){
      onTime(sc.h,sc.dow); S.ds='overall_os'; S.hi=T0; render(); n++;
      if(!$('#tl').children.length) throw new Error(`tl 空 @${sc.h}/${sc.dow}/T=${T0}`);
      const nt=$('#tlNote').innerHTML;
      if(!nt||nt.length<20) throw new Error('tlNote 空 @T='+T0);
      renderAdjNote(); if(!$('#adjNote').innerHTML) throw new Error('adjNote 空');
    }
  }
  for(const ds of ['overall_all','reference_os','img2webdev_os','fullstack_os','react_os','frontend_os']){
    onTime(PEAK.h,PEAK.dow); S.ds=ds; loadDataset(true); S.hi=DATASETS[ds].stats.score_max; render(); n++;
  }
  S.hi=99999; onTime(PEAK.h,PEAK.dow); S.ds='overall_os'; loadDataset(true); render(); n++;  // 门槛过高
  offTime(); S.ds='overall_os'; loadDataset(true);
  return `${n} 种（时刻 × 门槛 × 数据集）组合渲染通过，含门槛过高的空态`;
});
let fail=0;
for(const [n,st,r,ms] of out){ if(st!=='OK')fail++; W((st==='OK'?'✓ ':'✗ ')+n+`  [${ms}ms]\n     `+String(r).slice(0,1500)); }
W('\n'+(out.length-fail)+'/'+out.length+' passed');
process.exit(fail?1:0);
