/* ================= 计算层 ================= */
function planByKey(k){ for(var i=0;i<state.plans.length;i++){ if(state.plans[i].key === k) return state.plans[i]; } return null; }
function doneOf(p){ return String(p.status||'').indexOf('完成') >= 0 || !!p.doneDate; }
function raisedOf(p){
  var s = 0;
  for(var i=0;i<state.logs.length;i++){
    var l = state.logs[i];
    if(l.planTitle === p.title) s += l.amount;
  }
  return s;
}
function progressOf(p){
  if(p.ptype !== '量化' || !p.total) return null;
  var d = raisedOf(p);
  return { done: d, total: p.total, pct: Math.max(0, Math.min(100, Math.round(d / p.total * 100))) };
}
function isOverdue(p){ return !doneOf(p) && !!p.pdate && dayDiff(p.pdate, todayStr()) < 0; }
function isToday(p){ return p.pdate === todayStr(); }
function myPlans(){ return state.plans.filter(function(p){ return p.owner === state.me; }); }
/* 对方也只看进行中的，完成的同样进归档 */
function partnerPlans(){ return state.plans.filter(function(p){ return p.owner !== state.me && !doneOf(p); }); }
function archivePlans(){
  return state.plans.filter(function(p){ return doneOf(p); }).sort(function(a,b){
    return String(b.doneDate || '').localeCompare(String(a.doneDate || ''));
  });
}
/* 主页面只放未完成 / 进行中的计划；已完成的统一进「归档」，不再占着首页 */
function visiblePlans(){
  var list = myPlans().filter(function(p){ return !doneOf(p); });
  list.sort(function(a,b){
    var ao = isOverdue(a) ? 0 : 1, bo = isOverdue(b) ? 0 : 1;
    if(ao !== bo) return ao - bo;
    var ad = isToday(a) ? 0 : 1, bd = isToday(b) ? 0 : 1;
    if(ad !== bd) return ad - bd;
    if(a.quad !== b.quad) return a.quad - b.quad;
    return String(a.pdate).localeCompare(String(b.pdate));
  });
  return list;
}
function todayItems(){
  var out = [];
  visiblePlans().forEach(function(p){
    if(doneOf(p)) return;
    if(isOverdue(p)) out.push({p:p, kind:'overdue', text:'逾期 '+Math.abs(dayDiff(p.pdate, todayStr()))+' 天'});
    else if(isToday(p)) out.push({p:p, kind:'today', text:'今天'});
    else if(p.deadline && dayDiff(p.deadline, todayStr()) >= 0 && dayDiff(p.deadline, todayStr()) <= 3){
      out.push({p:p, kind:'soon', text:'还剩 '+dayDiff(p.deadline, todayStr())+' 天'});
    }
  });
  return out;
}
function weekRange(offset){
  var start = mondayOf(addDays(todayStr(), offset*7));
  return {start:start, end:addDays(start,6)};
}
/* 只统计「能在当前计划列表里找到」的打卡记录，避免历史遗留记录把本周数字抬高 */
function knownTitles(){
  var m = {};
  for(var i=0;i<state.plans.length;i++){ if(state.plans[i].title) m[state.plans[i].title] = 1; }
  return m;
}
/* 归属判断：明确写着对方名字的算对方，其余（含早期没有署名的记录）算我 */
function sideOf(who){ return (who && who === state.partner) ? 'other' : 'me'; }
function weekStats(start, end){
  var done = 0, doneList = [], logs = 0, live = {}, liveBy = {};
  var byDone = {me:0, other:0}, byLogs = {me:0, other:0}, byPlans = {me:0, other:0};
  var known = knownTitles();
  state.plans.forEach(function(p){
    if(doneOf(p) && p.doneDate && dayDiff(p.doneDate, start) >= 0 && dayDiff(end, p.doneDate) >= 0){
      done++; doneList.push(p);
      byDone[sideOf(p.owner)]++;
    }
  });
  state.logs.forEach(function(l){
    if(!known[l.planTitle]) return;
    if(dayDiff(l.date, start) >= 0 && dayDiff(end, l.date) >= 0){
      logs++;
      var sd = sideOf(l.who);
      byLogs[sd]++;
      if(l.planTitle && !live[l.planTitle]){ live[l.planTitle] = 1; liveBy[l.planTitle] = sd; }
    }
  });
  Object.keys(liveBy).forEach(function(t){ byPlans[liveBy[t]]++; });
  return {done:done, doneList:doneList, logs:logs, plans:Object.keys(live).length,
          byDone:byDone, byLogs:byLogs, byPlans:byPlans};
}
/* 「我 2 · 对方 1」这种拆法，一眼看出这周谁在动 */
function splitText(mine, theirs){
  return '我 '+mine+' · '+(state.partner || '对方')+' '+theirs;
}
function dayStats(day){
  var done = 0, logs = 0;
  var known = knownTitles();
  state.plans.forEach(function(p){ if(doneOf(p) && p.doneDate === day) done++; });
  state.logs.forEach(function(l){ if(l.date === day && known[l.planTitle]) logs++; });
  return {done:done, logs:logs};
}

/* ---------- 心情 ---------- */
function moodKey(date, who){ return date + '|' + (who || ''); }
function moodRow(date, who){
  for(var i=0;i<state.moods.length;i++){
    var m = state.moods[i];
    if(m.date === date && m.who === who) return m;
  }
  return null;
}
function moodOf(date, who){ var r = moodRow(date, who); return r ? r.mood : ''; }
function moodsIn(start, end, who){
  return state.moods.filter(function(m){
    return m.who === who && dayDiff(m.date, start) >= 0 && dayDiff(end, m.date) >= 0;
  });
}
function moodCount(start, end, who){
  var c = {}, list = moodsIn(start, end, who);
  list.forEach(function(m){ c[m.mood] = (c[m.mood] || 0) + 1; });
  return {c:c, total:list.length};
}
function topMoods(start, end, who, n){
  var r = moodCount(start, end, who);
  var arr = MOODS.map(function(d){ return {k:d.k, n:r.c[d.k] || 0}; })
    .filter(function(x){ return x.n > 0; })
    .sort(function(a,b){ return b.n - a.n; });
  return {list:arr.slice(0, n || 3), total:r.total, all:arr};
}
/* 心情也很好，难过/焦虑/烦躁 视为需要关心 */
function moodTone(k){
  var d = moodDef(k); if(!d) return 'neutral';
  if(d.sym === 'star' || d.sym === 'heart' || d.sym === 'dot') return 'good';
  if(d.sym === 'wave') return 'neutral';
  return 'low';
}
function stampOf(ts){
  if(!ts) return 0;
  var t = Date.parse(String(ts));
  if(!isNaN(t)) return t;
  var d = parseDay(ts);
  return d ? d.getTime() : 0;
}
function unreadCount(){
  var n = 0;
  for(var i=0;i<state.chat.length;i++){
    var c = state.chat[i];
    if(c.from !== state.me && stampOf(c.ts) > state._lastRead) n++;
  }
  return n;
}
function presenceText(){
  var row = null;
  for(var i=0;i<state.presence.length;i++){ if(state.presence[i].member === state.partner) row = state.presence[i]; }
  if(!row || !row.at) return {text: state.partner+' 还没来过', stale:true};
  var t = stampOf(row.at);
  if(!t) return {text: state.partner+' 还没来过', stale:true};
  var mins = Math.floor((Date.now()-t)/60000);
  if(mins < 0) mins = 0;
  if(mins <= 2) return {text: state.partner+' 刚刚来过', stale:false};
  if(mins < 60) return {text: state.partner+' '+mins+' 分钟前来过', stale:mins > 5};
  var hrs = Math.floor(mins/60);
  if(hrs < 24) return {text: state.partner+' '+hrs+' 小时前来过', stale:true};
  return {text: state.partner+' '+Math.floor(hrs/24)+' 天前来过', stale:true};
}
/* 云端数据里出现过的所有人名（按出现次数排序），用来给新设备「认人」 */
function knownPeople(){
  var cnt = {}, i, n;
  function add(x){ x = String(x||'').trim(); if(!x || x === '—') return; cnt[x] = (cnt[x]||0) + 1; }
  for(i=0;i<state.plans.length;i++) add(state.plans[i].owner);
  for(i=0;i<state.logs.length;i++) add(state.logs[i].who);
  for(i=0;i<state.chat.length;i++) add(state.chat[i].from);
  for(i=0;i<state.moods.length;i++) add(state.moods[i].who);
  for(i=0;i<state.notes.length;i++) add(state.notes[i].author);
  for(i=0;i<state.presence.length;i++) add(state.presence[i].member);
  var out = [];
  for(n in cnt){ if(Object.prototype.hasOwnProperty.call(cnt,n)) out.push({name:n, n:cnt[n]}); }
  out.sort(function(a,b){ return b.n - a.n; });
  return out;
}
/* 一周可以有两条小结：一条我的、一条对方的。早期没署名的记录按「本人」认领，
   这样老数据不会凭空消失，两人也不会互相覆盖 */
function noteOf(ws, who){
  for(var i=0;i<state.notes.length;i++){
    var n = state.notes[i];
    if(n.weekStart !== ws) continue;
    if((n.who || state.me) === who) return n;
  }
  return null;
}
/* 记心情：同一天同一个人的记录只有一条，存在就改、不存在就加 —— 不会写重复 */
/* ================= 照片记录 ================= */
/* seq=0 的那条是「这一天的文字 / 心情 / 评分 / 标签」，seq>=1 才是具体照片 */
function photoRows(date, who){
  return state.photos.filter(function(p){ return p.date === date && p.who === who; });
}
function dayRecord(date, who){
  var list = photoRows(date, who), i;
  for(i=0;i<list.length;i++){ if(!list[i].seq) return list[i]; }
  return null;
}
function ensureDay(date, who){
  var d = dayRecord(date, who);
  if(!d){
    d = { key:'ph-local-'+Date.now()+'-'+Math.floor(Math.random()*1000), rid:'', date:date, who:who,
          img:'', cap:'', did:'', ate:'', say:'', mood:'', rate:'', tags:'', seq:0 };
    state.photos.push(d);
  }
  return d;
}
function dayPhotos(date, who){
  return photoRows(date, who).filter(function(p){ return p.seq > 0; })
    .sort(function(a,b){ return (a.seq || 0) - (b.seq || 0); });
}
/* 照片是两个人一起看的：不按人过滤，自己的排在前面 */
function dayPhotosAll(date){
  return state.photos.filter(function(p){ return p.date === date && p.seq > 0; })
    .sort(function(a,b){
      var wa = (a.who === state.me) ? 0 : 1, wb = (b.who === state.me) ? 0 : 1;
      if(wa !== wb) return wa - wb;
      return (a.seq || 0) - (b.seq || 0);
    });
}
function photoDaysAll(){
  var m = {}, out = [], i;
  for(i=0;i<state.photos.length;i++){
    var p = state.photos[i];
    if(!p.date) continue;
    if(!m[p.date]){ m[p.date] = 1; out.push(p.date); }
  }
  out.sort(function(a,b){ return String(b).localeCompare(String(a)); });
  return out;
}
function photoDays(who){
  var m = {}, out = [], i;
  for(i=0;i<state.photos.length;i++){
    var p = state.photos[i];
    if(!p.date) continue;
    if(who && p.who !== who) continue;
    if(!m[p.date]){ m[p.date] = 1; out.push(p.date); }
  }
  out.sort(function(a,b){ return String(b).localeCompare(String(a)); });
  return out;
}
function savePhotoRemote(p){
  var properties = photoProps(p);
  if(!state.online || state.localOnly){
    if(p.rid) queuePush('updates', {table:'photos', recordId:p.rid, properties:properties});
    else queuePush('adds', {table:'photos', properties:properties});
    return;
  }
  if(p.rid){
    db.updateRecord({ databaseId: TABLE.photos, recordId: p.rid, properties: properties }).catch(function(){
      queuePush('updates', {table:'photos', recordId:p.rid, properties:properties});
      showBanner('照片记录没写进云端，已暂存本机，恢复后自动补传', true);
      refreshAll();
    });
    return;
  }
  db.addRecord({ databaseId: TABLE.photos, properties: properties }).then(function(res){
    /* 把云端返回的记录 id 回写到本地对象：否则这条记录永远是「没 id 的新记录」，
       下次保存又会新增一条，云端越堆越多。取不到 id 也不影响，去重逻辑会兜住。 */
    var newId = '';
    if(res){
      if(typeof res === 'string') newId = res;
      else newId = res._id || res.id || res.recordId || res.record_id || '';
    }
    if(newId){ p.rid = newId; p.key = 'ph-' + newId; savePhotosCache(); }
    pullAll(false);
  }).catch(function(){
    queuePush('adds', {table:'photos', properties:properties});
    showBanner('照片记录没写进云端，已暂存本机，恢复后自动补传', true);
    refreshAll();
  });
}
function deletePhotoRemote(p){
  if(!p || !p.rid) return;
  if(!state.online || state.localOnly){ queuePush('deletes', {table:'photos', recordId:p.rid}); return; }
  db.deleteRecord({ databaseId: TABLE.photos, recordId: p.rid }).catch(function(){
    queuePush('deletes', {table:'photos', recordId:p.rid});
    showBanner('删除没同步到云端，已暂存本机，恢复后自动补传', true);
    refreshAll();
  });
}
function saveMoodRemote(m){
  var properties = moodProps(m);
  var exist = moodRow(m.date, m.who);
  if(!state.online || state.localOnly){
    if(exist && exist.rid) queuePush('updates', {table:'moods', recordId:exist.rid, properties:properties});
    else queuePush('adds', {table:'moods', properties:properties});
    return;
  }
  if(exist && exist.rid){
    db.updateRecord({ databaseId: TABLE.moods, recordId: exist.rid, properties: properties }).catch(function(){
      queuePush('updates', {table:'moods', recordId:exist.rid, properties:properties});
      showBanner('心情没写进云端，已暂存本机，点右侧重试', true);
      refreshAll();
    });
    return;
  }
  db.addRecord({ databaseId: TABLE.moods, properties: properties }).then(function(){
    pullAll(false);
  }).catch(function(){
    queuePush('adds', {table:'moods', properties:properties});
    showBanner('心情没写进云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function deleteMoodRemote(m){
  if(!m || !m.rid) return;
  if(!state.online || state.localOnly){ queuePush('deletes', {table:'moods', recordId:m.rid}); return; }
  db.deleteRecord({ databaseId: TABLE.moods, recordId: m.rid }).catch(function(){
    queuePush('deletes', {table:'moods', recordId:m.rid});
    showBanner('删除没同步到云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function weekNote(ws){ return noteOf(ws, state.me); }

/* ================= 本地缓存 ================= */
function saveCache(){
  if(state.demo) return;          /* 演示数据不进本地缓存，退出演示后真实数据原样还在 */
  try{
    localStorage.setItem(LS_CACHE, JSON.stringify({
      plans:state.plans, logs:state.logs, notes:state.notes, chat:state.chat,
      presence:state.presence, moods:state.moods
    }));
  }catch(e){}
  savePhotosCache();
}
/* 照片不限张数后本地缓存会撑爆（localStorage 约 5MB），
   写不下就从最老的日期开始裁掉本地副本 —— 只影响离线可见性，云端记录和页面里已加载的照片都不动 */
var _photoTrimWarned = false;
function savePhotosCache(){
  if(state.demo) return;
  var all = state.photos.slice();
  all.sort(function(a, b){
    return String(b.date || '').localeCompare(String(a.date || '')) || ((b.seq || 0) - (a.seq || 0));
  });
  var LIMIT = 3.2 * 1024 * 1024;   /* 给主缓存留足空间 */
  var payload = all, trimmed = false;
  for(var guard = 0; guard < 40; guard++){
    var s = null;
    try{ s = JSON.stringify(payload); }catch(e){ s = null; }
    if(s !== null && s.length <= LIMIT) break;
    trimmed = true;
    if(payload.length <= 1){ payload = []; break; }
    payload = payload.slice(0, Math.max(1, Math.floor(payload.length * 0.8)));
  }
  try{
    localStorage.setItem(LS_PHOTOS, JSON.stringify(payload));
  }catch(e){
    try{ localStorage.removeItem(LS_PHOTOS); }catch(e2){}
    trimmed = true;
  }
  if(trimmed && !_photoTrimWarned){
    _photoTrimWarned = true;
    showBanner('本机缓存已满，较早的照片只在联网时可见（云端没丢）');
  }
}
function loadCache(){
  try{
    var raw = localStorage.getItem(LS_CACHE);
    if(!raw) return false;
    var o = JSON.parse(raw);
    state.plans = o.plans || [];
    state.logs = o.logs || [];
    state.notes = o.notes || [];
    state.chat = o.chat || [];
    state.presence = o.presence || [];
    state.moods = o.moods || [];
    try{
      var pr = localStorage.getItem(LS_PHOTOS);
      state.photos = pr ? (JSON.parse(pr) || []) : [];
    }catch(e){ state.photos = []; }
    return true;
  }catch(e){ return false; }
}
function loadMembers(){
  try{
    var raw = localStorage.getItem(LS_MEMBERS);
    if(raw){ var o = JSON.parse(raw); state.me = o.me || ''; state.partner = o.partner || ''; }
    state.needWho = !raw;   /* 这台设备从没选过身份 → 首次打开要认人 */
    var r = localStorage.getItem(LS_READ);
    if(r) state._lastRead = Number(r) || 0;
  }catch(e){}
  if(!state.me) state.me = '船长';
  if(!state.partner) state.partner = (state.me === '船长' ? '伙伴' : '船长');
  if(state.partner === state.me) state.partner = (state.me === '船长' ? '伙伴' : '船长');
}
function saveMembers(){
  try{ localStorage.setItem(LS_MEMBERS, JSON.stringify({me:state.me, partner:state.partner})); }catch(e){}
  try{ localStorage.setItem(LS_READ, String(state._lastRead || 0)); }catch(e){}
}
function loadPending(){
  try{
    var raw = localStorage.getItem(LS_PENDING);
    if(raw){
      var o = JSON.parse(raw);
      state.pending = { adds:o.adds || [], updates:o.updates || [], deletes:o.deletes || [] };
    }
  }catch(e){ state.pending = {adds:[], updates:[], deletes:[]}; }
}
function savePending(){
  if(state.demo) return;
  try{ localStorage.setItem(LS_PENDING, JSON.stringify(state.pending)); }catch(e){}
}
function pendingCount(){
  return state.pending.adds.length + state.pending.updates.length + state.pending.deletes.length;
}
function markRead(){
  state._lastRead = Date.now();
  try{ localStorage.setItem(LS_READ, String(state._lastRead)); }catch(e){}
}

/* ================= 数据层 · 读取 ================= */
var db = null;
try{
  if(window.__SMART_PAGE__ && window.__SMART_PAGE__.database){
    db = window.__SMART_PAGE__.database;
    state.online = true;
  }
}catch(e){}

/* 服务端过滤条件：只拉本房间的行。
   实测（2026-10-23）确认 filter 的 text.equals 在线上真实生效，
   所以别人的照片 / 日记根本不会下发到这台设备——这是真隔离，不是"拉下来再藏起来"。 */
function roomFilter(){
  return { property: { property: F_ROOM, text: { equals: state.room } } };
}

function fetchTable(key){
  return new Promise(function(resolve, reject){
    if(!state.online || state.localOnly){ reject(new Error('离线')); return; }
    /* 还没进房间：一条都不拉。宁可页面空着，也不能把别人的数据拉到本机 */
    if(!state.room){ resolve([]); return; }
    var out = [], guard = 0;
    function step(cursor){
      if(guard++ > 60){ resolve(out); return; }
      /* 7 张表的查询逻辑完全一致，收敛成一次调用，表 ID 统一从 TABLE 取 */
      db.query({
        databaseId: TABLE[key],
        pageSize: PAGE_SIZE[key] || 200,
        startCursor: cursor,
        filter: roomFilter()
      }).then(function(res){
        var rows = res.results || [];
        for(var i=0;i<rows.length;i++) out.push(rows[i]);
        if(res.hasMore && res.nextCursor && res.nextCursor !== cursor && rows.length) step(res.nextCursor);
        else resolve(out);
      }).catch(reject);
    }
    step(undefined);
  });
}
function applyTable(key, rows){
  if(key === 'plans') state.plans = rows.map(rowToPlan).filter(function(p){ return !!p.title; });
  else if(key === 'logs') state.logs = rows.map(rowToLog).filter(function(l){ return !!l.planTitle && !!l.date; });
  else if(key === 'notes') state.notes = rows.map(rowToNote).filter(function(n){ return !!n.weekStart; });
  else if(key === 'chat') state.chat = rows.map(rowToChat).filter(function(c){ return !!c.content || !!c.from; });
  else if(key === 'moods'){
    /* 还没拿到云端 id 的本地记录先留着，避免刚点完就被服务端结果冲掉 */
    var keep = state.moods.filter(function(m){ return !m.rid; });
    var fresh = rows.map(rowToMood).filter(function(m){ return !!m.date && !!m.mood; });
    var seen = {};
    fresh.forEach(function(m){ seen[m.date+'|'+m.who] = 1; });
    state.moods = fresh.concat(keep.filter(function(m){ return !seen[m.date+'|'+m.who]; }));
  }
  else if(key === 'photos'){
    /* 刚选完还没拿到云端 id 的本地照片先留着。
       注意：必须按「日期|成员|序号」去重——云端一旦写入成功，同一张照片会同时存在于
       pfresh（带 rid）和 pkeep（本地待回写副本），不去重就会每张都显示两遍，且本地
       副本永远拿不到 rid，后续每次拉取都重复一次。 */
    var pkeep = state.photos.filter(function(p){ return !p.rid; });
    var pfresh = rows.map(rowToPhoto).filter(function(p){ return !!p.date && (!!p.img || p.seq === 0); });
    var pseen = {};
    pfresh.forEach(function(p){ pseen[p.date + '|' + (p.who || '') + '|' + (p.seq || 0)] = 1; });
    state.photos = pfresh.concat(pkeep.filter(function(p){
      return !pseen[p.date + '|' + (p.who || '') + '|' + (p.seq || 0)];
    }));
  }
  else state.presence = rows.map(rowToPresence).filter(function(o){ return !!o.member; });
}
function pullAll(interactive){
  if(!state.online || state.localOnly){
    state.lastError = '离线模式，数据只存在本机';
    setSync('off');
    showBanner(state.lastError + '，恢复后会自动同步', false);
    refreshAll();
    return Promise.resolve(false);
  }
  /* 还没进房间：既不拉，也不能拿空结果去覆盖本地已有内容。
     否则用户刚打开、还没选房间，本地缓存就被清成空的了。 */
  if(!state.room){
    setSync('off');
    return Promise.resolve(false);
  }
  setSync('busy');
  return Promise.all(['plans','logs','notes','chat','online','moods','photos'].map(fetchTable)).then(function(res){
    applyTable('plans', res[0]);
    applyTable('logs', res[1]);
    applyTable('notes', res[2]);
    applyTable('chat', res[3]);
    applyTable('presence', res[4]);
    applyTable('moods', res[5]);
    applyTable('photos', res[6]);
    if(state.needWho){ try{ renderWhoList(); }catch(e){} }   /* 新设备：拉到云端人名后刷新「认人」选项 */
    state.lastSync = Date.now();
    state.lastError = '';
    saveCache();
    setSync('ok');
    hideBanner();
    refreshAll();
    return flushPending().then(function(){ return true; });
  }).catch(function(err){
    state.lastError = '读取失败：' + ((err && err.message) || '网络异常');
    setSync('off');
    showBanner(state.lastError + '，点右侧重试', true);
    refreshAll();
    if(interactive) toast('读取失败，请检查网络后重试');
    return false;
  });
}
function setSync(mode){
  var dot = $('syncDot');
  if(dot) dot.className = 'dot' + (mode === 'ok' ? '' : ' stale');
  var t1 = $('syncText'), t2 = $('syncTime');
  if(t1){
    if(state.demo) t1.textContent = '演示模式';
    else if(mode === 'ok') t1.textContent = '已同步';
    else if(mode === 'busy') t1.textContent = '正在同步…';
    else t1.textContent = '离线模式';
  }
  if(t2){
    if(state.lastSync){
      var d = new Date(state.lastSync);
      t2.textContent = '最近一次同步 '+(d.getMonth()+1)+'月'+d.getDate()+'日 '+pad2(d.getHours())+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds());
    } else {
      t2.textContent = '尚未同步';
    }
  }
}
function showBanner(text, isErr){
  var b = $('netBanner');
  if(!b) return;
  if($('bannerText')) $('bannerText').textContent = text;
  b.className = 'banner' + (isErr ? ' err' : '');
}
function hideBanner(){
  var b = $('netBanner');
  if(b) b.className = 'banner hide';
}

/* ================= 数据层 · 写入 ================= */
function queuePush(kind, item){
  if(state.demo) return;          /* 演示模式不排队，避免和真实待同步数据混在一起 */
  state.pending[kind].push(item);
  savePending();
}
function flushPending(){
  var p = state.pending;
  if(state.demo) return Promise.resolve(false);
  if(!state.online || state.localOnly) return Promise.resolve(false);
  if(p.adds.length + p.updates.length + p.deletes.length === 0) return Promise.resolve(true);
  var jobs = [];
  p.adds.forEach(function(a){
    if(a.table === 'plans') jobs.push(db.addRecord({ databaseId: TABLE.plans, properties: a.properties }));
    else if(a.table === 'logs') jobs.push(db.addRecord({ databaseId: TABLE.logs, properties: a.properties }));
    else if(a.table === 'notes') jobs.push(db.addRecord({ databaseId: TABLE.notes, properties: a.properties }));
    else if(a.table === 'chat') jobs.push(db.addRecord({ databaseId: TABLE.chat, properties: a.properties }));
    else if(a.table === 'moods') jobs.push(db.addRecord({ databaseId: TABLE.moods, properties: a.properties }));
    else if(a.table === 'photos') jobs.push(db.addRecord({ databaseId: TABLE.photos, properties: a.properties }));
    else jobs.push(db.addRecord({ databaseId: TABLE.online, properties: a.properties }));
  });
  p.updates.forEach(function(u){
    if(u.table === 'plans') jobs.push(db.updateRecord({ databaseId: TABLE.plans, recordId: u.recordId, properties: u.properties }));
    else if(u.table === 'logs') jobs.push(db.updateRecord({ databaseId: TABLE.logs, recordId: u.recordId, properties: u.properties }));
    else if(u.table === 'notes') jobs.push(db.updateRecord({ databaseId: TABLE.notes, recordId: u.recordId, properties: u.properties }));
    else if(u.table === 'chat') jobs.push(db.updateRecord({ databaseId: TABLE.chat, recordId: u.recordId, properties: u.properties }));
    else if(u.table === 'moods') jobs.push(db.updateRecord({ databaseId: TABLE.moods, recordId: u.recordId, properties: u.properties }));
    else if(u.table === 'photos') jobs.push(db.updateRecord({ databaseId: TABLE.photos, recordId: u.recordId, properties: u.properties }));
    else jobs.push(db.updateRecord({ databaseId: TABLE.online, recordId: u.recordId, properties: u.properties }));
  });
  p.deletes.forEach(function(dl){
    if(dl.table === 'plans') jobs.push(db.deleteRecord({ databaseId: TABLE.plans, recordId: dl.recordId }));
    else if(dl.table === 'logs') jobs.push(db.deleteRecord({ databaseId: TABLE.logs, recordId: dl.recordId }));
    else if(dl.table === 'notes') jobs.push(db.deleteRecord({ databaseId: TABLE.notes, recordId: dl.recordId }));
    else if(dl.table === 'chat') jobs.push(db.deleteRecord({ databaseId: TABLE.chat, recordId: dl.recordId }));
    else if(dl.table === 'moods') jobs.push(db.deleteRecord({ databaseId: TABLE.moods, recordId: dl.recordId }));
    else if(dl.table === 'photos') jobs.push(db.deleteRecord({ databaseId: TABLE.photos, recordId: dl.recordId }));
    else jobs.push(db.deleteRecord({ databaseId: TABLE.online, recordId: dl.recordId }));
  });
  if(!jobs.length) return Promise.resolve(true);
  return Promise.all(jobs).then(function(){
    state.pending = {adds:[], updates:[], deletes:[]};
    savePending();
    hideBanner();
    refreshAll();
    return true;
  }).catch(function(err){
    state.lastError = '写入失败：' + ((err && err.message) || '网络异常');
    showBanner(state.lastError + '，已暂存本机，点右侧重试', true);
    refreshAll();
    return false;
  });
}
function addPlanRemote(p){
  var properties = planProps(p);
  if(!state.online || state.localOnly){
    queuePush('adds', {table:'plans', properties:properties, local:p.key});
    refreshAll();
    return;
  }
  db.addRecord({ databaseId: DATABASE_ID, properties: properties }).then(function(){
    pullAll(false);
  }).catch(function(){
    queuePush('adds', {table:'plans', properties:properties, local:p.key});
    showBanner('新建计划没写进云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function updatePlanRemote(p){
  var properties = planProps(p);
  if(!p.rid) return;
  if(!state.online || state.localOnly){
    queuePush('updates', {table:'plans', recordId:p.rid, properties:properties});
    return;
  }
  db.updateRecord({ databaseId: DATABASE_ID, recordId: p.rid, properties: properties }).catch(function(){
    queuePush('updates', {table:'plans', recordId:p.rid, properties:properties});
    showBanner('修改没写进云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function deletePlanRemote(p){
  if(!p.rid) return;
  if(!state.online || state.localOnly){
    queuePush('deletes', {table:'plans', recordId:p.rid});
    return;
  }
  db.deleteRecord({ databaseId: DATABASE_ID, recordId: p.rid }).catch(function(){
    queuePush('deletes', {table:'plans', recordId:p.rid});
    showBanner('删除没同步到云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function addLogRemote(l){
  var properties = logProps(l);
  if(!state.online || state.localOnly){
    queuePush('adds', {table:'logs', properties:properties, local:l.key});
    return;
  }
  db.addRecord({ databaseId: TABLE.logs, properties: properties }).then(function(){
    pullAll(false);
  }).catch(function(){
    queuePush('adds', {table:'logs', properties:properties, local:l.key});
    showBanner('打卡没写进云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function deleteLogRemote(l){
  if(!l.rid) return;
  if(!state.online || state.localOnly){
    queuePush('deletes', {table:'logs', recordId:l.rid});
    return;
  }
  db.deleteRecord({ databaseId: TABLE.logs, recordId: l.rid }).catch(function(){
    queuePush('deletes', {table:'logs', recordId:l.rid});
    showBanner('删除没同步到云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function saveNoteRemote(nt){
  var properties = noteProps(nt);
  var exist = weekNote(nt.weekStart);
  if(!state.online || state.localOnly){
    if(exist && exist.rid) queuePush('updates', {table:'notes', recordId:exist.rid, properties:properties});
    else queuePush('adds', {table:'notes', properties:properties});
    return;
  }
  var job = (exist && exist.rid)
    ? db.updateRecord({ databaseId: TABLE.notes, recordId: exist.rid, properties: properties })
    : db.addRecord({ databaseId: TABLE.notes, properties: properties });
  job.catch(function(){
    if(exist && exist.rid) queuePush('updates', {table:'notes', recordId:exist.rid, properties:properties});
    else queuePush('adds', {table:'notes', properties:properties});
    showBanner('复盘没写进云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}
function addChatRemote(c){
  var properties = chatProps(c);
  if(!state.online || state.localOnly){
    queuePush('adds', {table:'chat', properties:properties, local:c.key});
    return;
  }
  db.addRecord({ databaseId: TABLE.chat, properties: properties }).then(function(){
    pullAll(false);
  }).catch(function(){
    queuePush('adds', {table:'chat', properties:properties, local:c.key});
    showBanner('留言没写进云端，已暂存本机，点右侧重试', true);
    refreshAll();
  });
}

/* ================= 订阅与在线心跳 ================= */
var subscribed = false;
function subscribe(){
  if(subscribed || !state.online || !db || typeof db.onUpdated !== 'function') return;
  subscribed = true;
  db.onUpdated(function(){
    setSync('busy');
    if(state._timer) clearTimeout(state._timer);
    state._timer = setTimeout(function(){ pullAll(false); }, 300);
  });
}
function heartbeat(){
  if(!state.online || state.localOnly) return;
  if(!state.room) return;         /* 还没进房间，别往在线表写东西 */
  if(state.needWho) return;   /* 还没认人，别写在线状态，避免顶掉对方 */
  var mine = null;
  for(var i=0;i<state.presence.length;i++){ if(state.presence[i].member === state.me) mine = state.presence[i]; }
  var iso = new Date().toISOString();
  if(mine && mine.rid){
    mine.at = iso;
    /* 更新也统一走 presenceProps：首次写入若漏了房间号，这行以后就再也拉不回来 */
    db.updateRecord({ databaseId: TABLE.online, recordId: mine.rid, properties: presenceProps(state.me, iso) }).catch(function(){});
  } else if(state.me){
    /* 原来这里写的是 `state.presence.length || state.plans.length`——
       开了房间过滤之后，新房间里这两者都是空的，第一条在线记录就永远建不出来。
       改成"认过人就可以写"。 */
    db.addRecord({ databaseId: TABLE.online, properties: presenceProps(state.me, iso) }).catch(function(){});
  }
}
