<script>
(function(){
'use strict';

/* ================= 常量 ================= */
var DATABASE_ID = 'EQzLfYTRyNHYYTKfDr5IKg';

/* 7 张表的 ID 统一收在这张映射里，调用点一律 TABLE[key]。
   以前是以字面量散落在 5-9 处，换表 ID 极易漏改。 */
var TABLE = {
  plans:  DATABASE_ID,
  logs:   'fr70DVNsj5q5Hw0ZMTXTMU',
  notes:  'bzewu5Qr06DhI7QY60xX5h',
  chat:   'kGvG4piRKRISA42OlT4FaH',
  online: '4ZKcg7SjtcNyWfqYEs9r1z',
  moods:  'lG9I5mBB0NPhqVZDXHsAYy',
  photos: 'CmBW74HIqkJZGYDbetXdHg'
};
/* 照片表单页拉少一点（base64 很重），其余走 200 上限 */
var PAGE_SIZE = { photos: 100 };

/* 「房间号」字段名：7 张表共用，读写都从这里取，改字段名只改这一处 */
var F_ROOM = '房间号';

var LS_CACHE = 'wb_plan_cache_v2';
var LS_PHOTOS = 'wb_plan_photos_v2';
var LS_MEMBERS = 'wb_plan_members_v2';
var LS_READ = 'wb_plan_read_v2';
var LS_PENDING = 'wb_plan_pending_v2';
var LS_ROOM = 'wb_plan_room_v1';
var LS_ROOMWHO = 'wb_plan_room_who_v1';

var QUADS = [
  {n:1, rn:'Ⅰ', name:'Ⅰ重要且紧急', short:'重要且紧急', color:'#E24B4A', cls:'q1'},
  {n:2, rn:'Ⅱ', name:'Ⅱ重要不紧急', short:'重要不紧急', color:'#EF9F27', cls:'q2'},
  {n:3, rn:'Ⅲ', name:'Ⅲ紧急不重要', short:'紧急不重要', color:'#16A34A', cls:'q3'},
  {n:4, rn:'Ⅳ', name:'Ⅳ不重要不紧急', short:'不重要不紧急', color:'#378ADD', cls:'q4'}
];
var SEED_TITLES = ['气缸劣化预警','制定学习规划','练习单摆','背英语单词','读完《人类简史》','整理变频器','了解一下 wireshark','西裤','耳机修','确认出差行程','电源线报修'];
var QUICK_CHEER = ['加油，我在看着','别急，一点一点来','今天已经很好了','明天继续','这个我也想试试','坚持住，快到了'];
var WD = ['日','一','二','三','四','五','六'];

/* 心情 8 档：颜色先表达情绪方向，五官+小符号再区分同类
   黄/粉=正向 绿/紫=中性 蓝/灰蓝=低谷 橙红=烦躁 */
var MOODS = [
  {k:'超开心', bg:'#FFE49A', ink:'#B07900', sym:'star'},
  {k:'开心',   bg:'#FFD3DC', ink:'#D2556F', sym:'heart'},
  {k:'还行',   bg:'#D8EFCB', ink:'#5C9B57', sym:'dot'},
  {k:'平静',   bg:'#E1DAFA', ink:'#7461C7', sym:'wave'},
  {k:'疲惫',   bg:'#CFE0F5', ink:'#5A82B8', sym:'sweat'},
  {k:'难过',   bg:'#BFD3EE', ink:'#3F66A8', sym:'tear'},
  {k:'焦虑',   bg:'#C9D7DB', ink:'#4F707A', sym:'spiral'},
  {k:'烦躁',   bg:'#FFD0BC', ink:'#CE5A33', sym:'burst'}
];
/* 照片记录：评分档位与常用标签 */
var RATES = ['5 很棒','4 不错','3 一般','2 有点糟','1 很差'];
var PHOTO_TAGS = ['工作','学习','运动','美食','出门','在家','和朋友','独处','充实','摸鱼'];
var PHOTO_MAX = 0;          /* 每天最多几张照片；0 = 不限（云端按张存，本地缓存超了会自动裁最旧的） */
var PHOTO_BATCH = 20;       /* 一次最多处理多少张，防止一口气选几百张把手机卡死 */
var PHOTO_SIDE = 900;       /* 长边压到多少像素 */
var PHOTO_QUALITY = 0.62;   /* JPEG 质量 */
function moodDef(k){
  for(var i=0;i<MOODS.length;i++){ if(MOODS[i].k === k) return MOODS[i]; }
  return null;
}
/* 不同心情的符号画法（全部内联 SVG，跨设备完全一致） */
function moodSym(s, ink){
  if(s === 'star')  return '<path d="M38 6.4l1.7 4.6 4.6 1.7-4.6 1.7L38 19l-1.7-4.6L31.7 12.7l4.6-1.7z" fill="'+ink+'"/>';
  if(s === 'heart') return '<path d="M38.6 8.6c-1.1-1.4-3.4-.6-3.4 1.1 0 1.5 2.1 2.7 3.4 3.6 1.3-.9 3.4-2.1 3.4-3.6 0-1.7-2.3-2.5-3.4-1.1z" fill="'+ink+'"/>';
  if(s === 'dot')   return '<circle cx="38.4" cy="12" r="2.5" fill="'+ink+'" opacity=".72"/>';
  if(s === 'wave')  return '<path d="M33.6 13.4q2.5-3 5 0t5 0" fill="none" stroke="'+ink+'" stroke-width="2" stroke-linecap="round" opacity=".8"/>';
  if(s === 'sweat') return '<path d="M40.4 20.6c2.3 3 3.5 4.8 3.5 6.5a3.5 3.5 0 0 1-7 0c0-1.7 1.2-3.5 3.5-6.5z" fill="'+ink+'" opacity=".85"/>';
  if(s === 'tear')  return '<path d="M28.6 23.6c1.6 2.1 2.4 3.3 2.4 4.5a2.4 2.4 0 0 1-4.8 0c0-1.2.8-2.4 2.4-4.5z" fill="'+ink+'"/>';
  if(s === 'spiral') return '<path d="M31.6 15.4c-2.4-.4-3.9-2-3.6-3.9.3-1.7 1.8-2.8 3.5-2.6 1.5.2 2.6 1.4 2.5 2.8-.1 1.2-1 2-2.2 2-.9 0-1.6-.7-1.6-1.5" fill="none" stroke="'+ink+'" stroke-width="1.9" stroke-linecap="round"/>';
  /* burst */
  return '<path d="M37.6 12.4l3.2-3.2M41 15.8l3.6-.9" fill="none" stroke="'+ink+'" stroke-width="2.2" stroke-linecap="round"/>';
}
/* 生成一张心情脸；size 为像素宽 */
function moodFace(k, size){
  var d = moodDef(k);
  var s = size || 20;
  if(!d){
    return '<svg class="mt" viewBox="0 0 48 48" width="'+s+'" height="'+s+'" aria-hidden="true">'
      + '<rect x="2.5" y="2.5" width="43" height="43" rx="15" fill="none" stroke="#DFE2EC" stroke-width="2" stroke-dasharray="4 4"/></svg>';
  }
  var ink = d.ink, face = '', i;
  if(k === '超开心' || k === '开心'){
    face = '<path d="M13.6 22q3.5-5 7 0M27.4 22q3.5-5 7 0" fill="none" stroke="'+ink+'" stroke-width="2.5" stroke-linecap="round"/>';
    face += (k === '超开心')
      ? '<path d="M15.4 29c2.4 6.2 15.2 6.2 17.6 0z" fill="'+ink+'"/>'
      : '<path d="M16.8 29.4q7.2 6 14.4 0" fill="none" stroke="'+ink+'" stroke-width="2.6" stroke-linecap="round"/>';
    face += moodSym(d.sym, ink);
  } else if(k === '还行'){
    face = '<circle cx="17" cy="21" r="2.7" fill="'+ink+'"/><circle cx="31" cy="21" r="2.7" fill="'+ink+'"/>';
    face += '<path d="M18.4 31.4h11.2" fill="none" stroke="'+ink+'" stroke-width="2.4" stroke-linecap="round"/>';
    face += moodSym(d.sym, ink);
  } else if(k === '平静'){
    face = '<path d="M13.8 21.4q3.2 3 6.4 0M27.8 21.4q3.2 3 6.4 0" fill="none" stroke="'+ink+'" stroke-width="2.4" stroke-linecap="round"/>';
    face += '<path d="M18.8 31.2q5.2 2.6 10.4 0" fill="none" stroke="'+ink+'" stroke-width="2.4" stroke-linecap="round"/>';
    face += moodSym(d.sym, ink);
  } else if(k === '疲惫'){
    face = '<path d="M13.8 20.6q3.2 3.4 6.4 0M27.8 20.6q3.2 3.4 6.4 0" fill="none" stroke="'+ink+'" stroke-width="2.4" stroke-linecap="round"/>';
    face += '<path d="M19.6 32.6h9" fill="none" stroke="'+ink+'" stroke-width="2.4" stroke-linecap="round"/>';
    face += moodSym(d.sym, ink);
  } else if(k === '难过'){
    face = '<circle cx="17" cy="20.6" r="2.6" fill="'+ink+'"/><circle cx="31" cy="20.6" r="2.6" fill="'+ink+'"/>';
    face += '<path d="M17.4 34.2q6.6-6 13.2 0" fill="none" stroke="'+ink+'" stroke-width="2.5" stroke-linecap="round"/>';
    face += moodSym(d.sym, ink);
  } else if(k === '焦虑'){
    face = '<circle cx="17" cy="21" r="2.6" fill="'+ink+'"/><circle cx="31" cy="21" r="2.6" fill="'+ink+'"/>';
    face += '<path d="M16.6 31.2q3.2-3.4 6.4 0t6.4 0" fill="none" stroke="'+ink+'" stroke-width="2.4" stroke-linecap="round"/>';
    face += moodSym(d.sym, ink);
  } else { /* 烦躁 */
    face = '<path d="M13.2 19.4l7.4 4.2M34.8 19.4l-7.4 4.2" fill="none" stroke="'+ink+'" stroke-width="2.5" stroke-linecap="round"/>';
    face += '<path d="M17.8 34.4q6.2-5 12.4 0" fill="none" stroke="'+ink+'" stroke-width="2.5" stroke-linecap="round"/>';
    face += moodSym(d.sym, ink);
  }
  return '<svg class="mt" viewBox="0 0 48 48" width="'+s+'" height="'+s+'" role="img" aria-label="'+esc(k)+'">'
    + '<rect x="1.6" y="1.6" width="44.8" height="44.8" rx="15.5" fill="'+d.bg+'" stroke="'+ink+'" stroke-opacity=".16" stroke-width="1.6"/>'
    + face + '</svg>';
}

/* ================= 状态 ================= */
var state = {
  plans:[], logs:[], notes:[], chat:[], presence:[], moods:[], photos:[],
  room:'',            /* 房间号。为空 = 还没进房间，此时不拉任何云端数据 */
  me:'', partner:'', needWho:false,
  tab:'plan', quad:0, weekOffset:0,
  photoDate:'', archQ:'', archDate:'',
  moodView:'month', moodCursor:'', moodPickDate:'', moodSaved:0,
  online:false, localOnly:false,
  lastSync:0, lastError:'', pending:{adds:[],updates:[],deletes:[]},
  composeMode:'new', editingKey:'', pickedQuad:4, quant:false, pickedDate:'',
  detailKey:'', checkinKey:'', checkinDate:'', _timer:0, _lastRead:0, _toastT:0, askFn:null
};

/* ================= 工具 ================= */
function $(id){ return document.getElementById(id); }
function pad2(n){ return (n<10?'0':'')+n; }
function ymd(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function todayStr(){ return ymd(new Date()); }
function parseDay(s){
  var p = String(s||'').slice(0,10).split('-');
  if(p.length !== 3) return null;
  var d = new Date(Number(p[0]), Number(p[1])-1, Number(p[2]));
  return isNaN(d.getTime()) ? null : d;
}
function dayDiff(a,b){
  var x = parseDay(a), y = parseDay(b);
  if(!x || !y) return 0;
  return Math.round((x.getTime()-y.getTime())/86400000);
}
function addDays(s,n){ var d = parseDay(s); if(!d) return todayStr(); d.setDate(d.getDate()+n); return ymd(d); }
function mondayOf(s){
  var d = parseDay(s); if(!d) return todayStr();
  var w = d.getDay(); var off = (w === 0 ? -6 : 1-w);
  d.setDate(d.getDate()+off); return ymd(d);
}
function dt(v){ return String(v == null ? '' : v).slice(0,10); }
function num(v){ var n = Number(v); return isFinite(n) ? n : 0; }
function rid(row){ return (row && (row._id || row.id)) || ''; }
function esc(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function trimNum(n){ return String(Math.round(n*100)/100); }
function fmtMD(s){ var d = parseDay(s); return d ? ((d.getMonth()+1)+'月'+d.getDate()+'日') : ''; }
function wdName(s){ var d = parseDay(s); return d ? ('周'+WD[d.getDay()]) : ''; }
function initials(name){ var t = String(name||'?').trim(); return t ? t.slice(0,1) : '?'; }
function colorOf(name){ return name === state.me ? '#6D5BF6' : '#EF9F27'; }
function shortTime(t){
  if(!t) return '';
  var d = new Date(t);
  return pad2(d.getHours())+':'+pad2(d.getMinutes());
}
function fmtDateTime(t){
  if(!t) return '';
  var d = new Date(t);
  return (d.getMonth()+1)+'月'+d.getDate()+'日 '+pad2(d.getHours())+':'+pad2(d.getMinutes());
}

/* ================= 自然语言日期识别 ================= */
function nextWeekday(target){
  var t = parseDay(todayStr());
  var cur = t.getDay();
  var add = (target - cur + 7) % 7;
  if(add === 0) add = 7;
  t.setDate(t.getDate()+add);
  return ymd(t);
}
function parseDateInput(text){
  var s = String(text||'');
  if(!s) return null;
  var m, d, ii, tgt, base;
  var WKCH = '一二三四五六日天';

  m = s.match(/(20\d{2})\s*[年\-\/\.]\s*(\d{1,2})\s*[月\-\/\.]\s*(\d{1,2})\s*[日号]?/);
  if(m) return {date: Number(m[1])+'-'+pad2(Number(m[2]))+'-'+pad2(Number(m[3])), raw: m[0]};

  m = s.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]/);
  if(m){ d = new Date(); return {date: d.getFullYear()+'-'+pad2(Number(m[1]))+'-'+pad2(Number(m[2])), raw: m[0]}; }

  m = s.match(/(\d{1,2})\s*月\s*(\d{1,2})(?!\d)/);
  if(m){ d = new Date(); return {date: d.getFullYear()+'-'+pad2(Number(m[1]))+'-'+pad2(Number(m[2])), raw: m[0]}; }

  m = s.match(/(\d{1,2})\s*月(?!\s*[\d后前])/);
  if(m){ d = new Date(); var mm = Number(m[1]); if(mm >= 1 && mm <= 12) return {date: d.getFullYear()+'-'+pad2(mm)+'-01', raw: m[0]}; }

  m = s.match(/(^|[^\d\/\.\-])(\d{1,2})[\/\.](\d{1,2})(?![\d\/\.])/);
  if(m){ d = new Date(); var a = Number(m[2]), b = Number(m[3]); if(a >= 1 && a <= 12 && b >= 1 && b <= 31) return {date: d.getFullYear()+'-'+pad2(a)+'-'+pad2(b), raw: m[0].slice(m[1].length)}; }

  m = s.match(/下个?\s*(?:星期|礼拜|周)\s*([一二三四五六日天])/);
  if(m){
    ii = WKCH.indexOf(m[1]); tgt = (ii === 7 ? 0 : ii+1);
    base = parseDay(addDays(mondayOf(todayStr()), 7));
    base.setDate(base.getDate() + (tgt === 0 ? 6 : tgt-1));
    return {date: ymd(base), raw: m[0]};
  }

  m = s.match(/(?:本|这)\s*(?:星期|礼拜|周)\s*([一二三四五六日天])/);
  if(m){
    ii = WKCH.indexOf(m[1]); tgt = (ii === 7 ? 0 : ii+1);
    base = parseDay(mondayOf(todayStr()));
    base.setDate(base.getDate() + (tgt === 0 ? 6 : tgt-1));
    return {date: ymd(base), raw: m[0]};
  }

  m = s.match(/(?:星期|礼拜|周)\s*([一二三四五六日天])/);
  if(m){ ii = WKCH.indexOf(m[1]); return {date: nextWeekday(ii === 7 ? 0 : ii+1), raw: m[0]}; }

  m = s.match(/下个?月底|下月月底/);
  if(m){ d = parseDay(todayStr()); d.setDate(1); d.setMonth(d.getMonth()+2); d.setDate(0); return {date: ymd(d), raw: m[0]}; }

  m = s.match(/月底/);
  if(m){ d = parseDay(todayStr()); d.setDate(1); d.setMonth(d.getMonth()+1); d.setDate(0); return {date: ymd(d), raw: m[0]}; }

  m = s.match(/月初/);
  if(m){ d = parseDay(todayStr()); d.setDate(1); d.setMonth(d.getMonth()+1); return {date: ymd(d), raw: m[0]}; }

  m = s.match(/下个?月(?!\s*\d)/);
  if(m){ d = parseDay(todayStr()); d.setDate(1); d.setMonth(d.getMonth()+1); return {date: ymd(d), raw: m[0]}; }

  m = s.match(/下个?\s*周末/);
  if(m){ d = parseDay(mondayOf(todayStr())); d.setDate(d.getDate()+12); return {date: ymd(d), raw: m[0]}; }

  m = s.match(/下个?周(?!\s*[一二三四五六日天])/);
  if(m) return {date: addDays(mondayOf(todayStr()), 7), raw: m[0]};

  m = s.match(/这个?周末|本周末|周末/);
  if(m){
    d = parseDay(mondayOf(todayStr())); d.setDate(d.getDate()+5);
    if(dayDiff(ymd(d), todayStr()) < 0) d.setDate(d.getDate()+7);
    return {date: ymd(d), raw: m[0]};
  }

  m = s.match(/大后天/);
  if(m) return {date: addDays(todayStr(), 3), raw: m[0]};
  m = s.match(/后天/);
  if(m) return {date: addDays(todayStr(), 2), raw: m[0]};
  m = s.match(/明天|明日/);
  if(m) return {date: addDays(todayStr(), 1), raw: m[0]};
  m = s.match(/今天|今日|当天|本日/);
  if(m) return {date: todayStr(), raw: m[0]};
  m = s.match(/昨天|昨日/);
  if(m) return {date: addDays(todayStr(), -1), raw: m[0]};

  m = s.match(/(\d{1,3})\s*天后/);
  if(m) return {date: addDays(todayStr(), Number(m[1])), raw: m[0]};
  m = s.match(/(\d{1,2})\s*周后/);
  if(m) return {date: addDays(todayStr(), Number(m[1])*7), raw: m[0]};
  m = s.match(/(\d{1,2})\s*个?月后/);
  if(m){ d = parseDay(todayStr()); d.setMonth(d.getMonth()+Number(m[1])); return {date: ymd(d), raw: m[0]}; }

  return null;
}
function stripDate(text, raw){
  if(!raw) return String(text||'').trim();
  return String(text||'').replace(raw, ' ').replace(/\s+/g,' ').trim();
}

/* ================= 行映射 ================= */
function quadIndexOf(v){
  var s = String(v||'');
  for(var i=0;i<QUADS.length;i++){
    if(s && s.indexOf(QUADS[i].short) >= 0) return QUADS[i].n;
    if(s === QUADS[i].rn) return QUADS[i].n;
  }
  return 4;
}
/* select 字段读回可能是选项文本，也可能是选项 id；两种都归一成文本，避免错位 */
var SEL_ALIAS = {
  'DCKTXnuaxd1g': 'Ⅰ重要且紧急',
  'f82MK9GbhZdx': 'Ⅱ重要不紧急',
  'pGsBcaIvGVpI': 'Ⅲ紧急不重要',
  'Lf6VvUyoMY28': 'Ⅳ不重要不紧急',
  'CHaouNhHIZ0b': '待办',
  '0wSTqWSL0QjD': '量化',
  '6EnhwvVj8rwY': '鼓励',
  '6OUV8OfUUSO5': '留言',
  '8TOM2P9oMm09': '超开心',
  '7kmJKhsZfwD5': '开心',
  'sKhlmjpJX8eA': '还行',
  '6GGSzrLoD6rM': '平静',
  'ivC7VnOXKDAt': '疲惫',
  '55wMX1XMLtnq': '难过',
  'ObbdEbEdrGly': '焦虑',
  'mfRSPVFq2pUe': '烦躁'
};
function selText(v){
  var s = String(v == null ? '' : v);
  return SEL_ALIAS[s] || s;
}
function rowToPlan(row){
  return {
    key: 'p-'+rid(row), rid: rid(row),
    title: row['标题'] || '',
    unit: row['单位'] || '',
    total: num(row['总量']),
    deadline: dt(row['截止日期']),
    obstacle: row['障碍预案'] || '',
    plan: row['对策'] || '',
    status: row['状态'] || '进行中',
    quad: quadIndexOf(selText(row['象限'])),
    owner: row['负责人'] || '',
    pdate: dt(row['计划日期']),
    ptype: (selText(row['计划类型']) === '量化' ? '量化' : '待办'),
    doneDate: dt(row['完成日期'])
  };
}
function rowToLog(row){
  return {
    key: 'l-'+rid(row), rid: rid(row),
    date: dt(row['日期']),
    planTitle: row['计划名'] || '',
    amount: num(row['打卡量']),
    unit: row['单位'] || '',
    note: row['备注'] || '',
    who: row['打卡人'] || ''
  };
}
function rowToNote(row){
  return {
    key: 'n-'+rid(row), rid: rid(row),
    weekStart: dt(row['周起始日']),
    who: row['记录人'] || '',
    keep: row['保持'] || '',
    problem: row['问题'] || '',
    attempt: row['尝试'] || '',
    next: row['下周预案'] || ''
  };
}
function rowToMood(row){
  return {
    key: 'm-'+rid(row), rid: rid(row),
    date: dt(row['日期']),
    who: row['成员'] || '',
    mood: moodDef(selText(row['心情'])) ? selText(row['心情']) : '',
    note: row['备注'] || ''
  };
}
/* 照片记录：seq=0 是「这一天的文字/心情」，seq>=1 才是照片 */
function rowToPhoto(row){
  return {
    key: 'ph-'+rid(row), rid: rid(row),
    date: dt(row['日期']),
    who: row['成员'] || '',
    img: row['照片'] || '',
    cap: row['照片说明'] || '',
    did: row['今日做了'] || '',
    ate: row['今日吃了'] || '',
    say: row['今日评价'] || '',
    mood: (moodDef(selText(row['心情'])) ? selText(row['心情']) : ''),
    rate: selText(row['评分']) || '',
    tags: row['标签'] || '',
    seq: num(row['序号'])
  };
}
function rowToChat(row){
  return {
    key: 'c-'+rid(row), rid: rid(row),
    kind: selText(row['类型']) === '鼓励' ? '鼓励' : '留言',
    from: row['发起人'] || '',
    rel: row['关联计划'] || '',
    content: row['内容'] || '',
    ts: row['时间'] || ''
  };
}
function rowToPresence(row){
  return { key:'o-'+rid(row), rid: rid(row), member: row['成员'] || '', at: row['最后访问时间'] || '' };
}
/* 给一条待写入的记录打上房间号。
   所有写入都必须过这里——漏了房间号的行，在开了服务端 filter 之后就再也拉不回来。 */
function stampRoom(properties){
  properties[F_ROOM] = { text: state.room || '' };
  return properties;
}

function planProps(p){
  var properties = {};
  properties['标题'] = { text: p.title };
  properties['象限'] = { select: (QUADS[p.quad-1] || QUADS[3]).name };
  properties['负责人'] = { text: p.owner };
  properties['计划日期'] = { text: p.pdate };
  properties['计划类型'] = { select: p.ptype };
  properties['状态'] = { text: p.status };
  if(p.unit) properties['单位'] = { text: p.unit };
  if(p.total) properties['总量'] = { number: p.total };
  if(p.deadline) properties['截止日期'] = { text: p.deadline };
  if(p.obstacle) properties['障碍预案'] = { text: p.obstacle };
  if(p.plan) properties['对策'] = { text: p.plan };
  if(p.doneDate) properties['完成日期'] = { text: p.doneDate };
  return stampRoom(properties);
}
function logProps(l){
  var properties = {};
  properties['日期'] = { text: l.date };
  properties['计划名'] = { text: l.planTitle };
  properties['打卡量'] = { number: l.amount };
  properties['单位'] = { text: l.unit || '' };
  properties['备注'] = { text: l.note || '' };
  properties['打卡人'] = { text: l.who || '' };
  return stampRoom(properties);
}
function noteProps(nt){
  var properties = {};
  properties['周起始日'] = { date: nt.weekStart };
  properties['记录人'] = { text: nt.who || '' };
  /* 只写界面上真的在编辑的两栏，老记录里的「问题 / 下周预案」原样留在云端不被覆盖 */
  properties['保持'] = { text: nt.keep || '' };
  properties['尝试'] = { text: nt.attempt || '' };
  if(nt.keepProblem) properties['问题'] = { text: nt.keepProblem };
  if(nt.keepNext) properties['下周预案'] = { text: nt.keepNext };
  return stampRoom(properties);
}
function moodProps(m){
  return stampRoom({
    '日期': { date: m.date },
    '成员': { text: m.who || '' },
    '心情': { select: m.mood },
    '备注': { text: m.note || '' }
  });
}
function photoProps(p){
  var properties = {};
  properties['日期'] = { date: p.date };
  properties['成员'] = { text: p.who || '' };
  properties['照片'] = { text: p.img || '' };
  properties['照片说明'] = { text: p.cap || '' };
  properties['序号'] = { number: p.seq || 0 };
  if(p.seq === 0){
    properties['今日做了'] = { text: p.did || '' };
    properties['今日吃了'] = { text: p.ate || '' };
    properties['今日评价'] = { text: p.say || '' };
    properties['标签'] = { text: p.tags || '' };
    if(p.mood) properties['心情'] = { select: p.mood };
    if(p.rate) properties['评分'] = { select: p.rate };
  }
  return stampRoom(properties);
}
function chatProps(c){
  var properties = {};
  properties['类型'] = { select: c.kind };
  properties['发起人'] = { text: c.from };
  properties['内容'] = { text: c.content };
  properties['时间'] = { text: c.ts };
  if(c.rel) properties['关联计划'] = { text: c.rel };
  return stampRoom(properties);
}

/* 在线表（presence）的写入属性 */
function presenceProps(member, at){
  return stampRoom({
    '成员': { text: member || '' },
    '最后访问时间': { text: at || '' }
  });
}
