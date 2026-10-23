/* ================= 渲染层 ================= */
var BIND = ' data-sp-bindable="database" data-sp-database-id="EQzLfYTRyNHYYTKfDr5IKg"';
var BIND_LOG = ' data-sp-bindable="database" data-sp-database-id="fr70DVNsj5q5Hw0ZMTXTMU"';
var BIND_CHAT = ' data-sp-bindable="database" data-sp-database-id="kGvG4piRKRISA42OlT4FaH"';
var BIND_NOTE = ' data-sp-bindable="database" data-sp-database-id="bzewu5Qr06DhI7QY60xX5h"';
function renderFilters(){
  var el = $('quadFilter'); if(!el) return;
  var mine = myPlans();
  var left = mine.filter(function(p){ return !doneOf(p); });
  var html = '<button class="chip'+(state.quad === 0 ? ' on' : '')+'" data-quad="0">全部 '+left.length+'</button>';
  QUADS.forEach(function(q){
    var c = left.filter(function(p){ return p.quad === q.n; }).length;
    var on = state.quad === q.n;
    html += '<button class="chip'+(on ? ' on' : '')+'" data-quad="'+q.n+'"'+(on ? '' : ' style="color:'+q.color+'"')+'>'+q.rn+' '+q.short+' '+c+'</button>';
  });
  el.innerHTML = html;
}
function renderMeRow(){
  var chip = $('meChip'); if(chip) chip.textContent = '我 · ' + (state.me || '—');
  var left = myPlans().filter(function(p){ return !doneOf(p); }).length;
  var el = $('meCount'); if(el) el.textContent = left + ' 条待办';
}
function renderToday(){
  var items = todayItems();
  var card = $('todayCard'), list = $('todayList'), cnt = $('todayCount');
  if(cnt) cnt.textContent = String(items.length);
  if(!card || !list) return;
  if(!items.length){
    card.className = 'card todayCard empty';
    list.innerHTML = '<p class="todayHint">今天没有逾期和到期的事，清爽。</p>';
    return;
  }
  card.className = 'card todayCard';
  var html = '';
  items.forEach(function(it){
    var p = it.p;
    var why = it.kind === 'overdue' ? 'red' : (it.kind === 'today' ? 'purple' : 'amber');
    html += '<div class="titem">'
      + '<span class="txt"'+BIND+'>'+esc(p.title)+'</span>'
      + '<span class="why '+why+'">'+esc(it.text)+'</span>'
      + '<button class="miniBtn" data-act="checkin" data-key="'+p.key+'">'+(p.ptype === '量化' ? '打卡' : '标完成')+'</button>'
      + '<button class="miniBtn ghost" data-act="detail" data-key="'+p.key+'">调整</button>'
      + '</div>';
  });
  list.innerHTML = html;
}
function itemHtml(p){
  var q = QUADS[p.quad-1] || QUADS[3];
  var over = isOverdue(p);
  var done = doneOf(p);
  var prog = progressOf(p);
  var tags = '';
  if(done) tags += '<span class="tag gray">已完成</span>';
  else if(over) tags += '<span class="tag red">逾期 '+Math.abs(dayDiff(p.pdate, todayStr()))+' 天</span>';
  else if(isToday(p)) tags += '<span class="tag purple">今天</span>';
  else if(p.pdate) tags += '<span class="tag gray">'+fmtMD(p.pdate)+' '+wdName(p.pdate)+'</span>';
  if(p.ptype === '量化') tags += '<span class="tag green">打卡任务</span>';
  if(p.deadline && !done) tags += '<span class="tag amber">截止 '+fmtMD(p.deadline)+'</span>';
  if(p.plan) tags += '<span class="tag gray">已备预案</span>';
  var meta = '<div class="meta">'+tags+'</div>';
  if(prog){
    meta += '<div class="pbar"><i style="width:'+prog.pct+'%"></i></div>'
      + '<div class="meta"'+BIND_LOG+'>'+prog.done+' / '+prog.total+(p.unit ? (' '+esc(p.unit)) : '')+' · '+prog.pct+'%</div>';
  }
  var tick = done
    ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>'
    : '';
  return '<div class="item '+q.cls+(done ? ' done' : '')+(over ? ' overdue' : '')+'">'
    + '<button class="cb'+(done ? ' done' : '')+'" data-act="toggle" data-key="'+p.key+'" aria-label="切换完成">'+tick+'</button>'
    + '<div class="body" data-act="detail" data-key="'+p.key+'">'
    + '<div class="ttl"'+BIND+'>'+esc(p.title)+'</div>'+meta+'</div>'
    + '<button class="owner" data-act="detail" data-key="'+p.key+'">'+esc(initials(p.owner))+'</button>'
    + '</div>';
}
function renderList(){
  var wrap = $('planList'); if(!wrap) return;
  var list = visiblePlans();
  if(state.quad) list = list.filter(function(p){ return p.quad === state.quad; });
  if(!list.length){
    wrap.innerHTML = '<div class="card"><p style="margin:0;font-size:13.5px;color:var(--ink2)">这里是空的。点下面的「新建计划」试试。</p></div>';
    return;
  }
  var grouped = {1:[], 2:[], 3:[], 4:[]};
  list.forEach(function(p){ grouped[p.quad].push(p); });
  var html = '';
  QUADS.forEach(function(q){
    if(!grouped[q.n].length) return;
    html += '<div class="qgroup '+q.cls+'"><div class="qhead"><span class="rn">'+q.rn+'</span><span>'+q.short+'</span><span class="n">'+grouped[q.n].length+'</span></div>';
    grouped[q.n].forEach(function(p){ html += itemHtml(p); });
    html += '</div>';
  });
  wrap.innerHTML = html;
}
function partnerPlanHtml(list){
  if(!list.length) return '<p style="font-size:13.5px;color:var(--ink2);margin:0">对方还没有计划。</p>';
  var grouped = {1:[], 2:[], 3:[], 4:[]};
  list.forEach(function(p){ grouped[p.quad].push(p); });
  var html = '';
  QUADS.forEach(function(q){
    if(!grouped[q.n].length) return;
    html += '<div style="margin-bottom:12px"><div style="font-size:12.5px;font-weight:700;color:'+q.color+';margin-bottom:6px">'+q.rn+' '+q.short+'</div>';
    grouped[q.n].forEach(function(p){
      var done = doneOf(p);
      var prog = progressOf(p);
      html += '<div class="pRow">'
        + '<span style="width:14px;height:14px;border-radius:50%;flex:none;border:1.6px solid '+(done ? '#9BA0AE' : q.color)+';'+(done ? 'background:#9BA0AE' : '')+'"></span>'
        + '<span class="t"'+(done ? ' style="text-decoration:line-through;color:var(--ink3)"' : '')+BIND+'>'+esc(p.title)+'</span>';
      if(prog) html += '<span style="font-size:11.5px;color:var(--ink3);flex:none"'+BIND_LOG+'>'+prog.done+'/'+prog.total+'</span>';
      html += '<button class="cheerBtn" data-act="cheer" data-title="'+esc(p.title)+'">鼓励</button>'
        + '</div>';
    });
    html += '</div>';
  });
  return html;
}
function chatMsgHtml(c){
  var mine = c.from === state.me;
  var tag = (c.kind === '鼓励' ? ' · 鼓励' : '') + (c.rel ? (' · '+esc(c.rel)) : '');
  return '<div class="msg'+(mine ? ' mine' : '')+'">'
    + '<span class="av" style="background:'+colorOf(c.from)+'">'+esc(initials(c.from))+'</span>'
    + '<div class="bub"><div class="who"'+BIND_CHAT+'>'+esc(c.from || '—')+tag+' · '+fmtDateTime(stampOf(c.ts))+'</div>'
    + '<div class="txt"'+BIND_CHAT+'>'+esc(c.content)+'</div></div></div>';
}
function renderPartner(){
  var pl = partnerPlans();
  var el = $('pPlansTitle'); if(el) el.textContent = (state.partner || '对方') + ' 的计划';
  var cnt = $('pCount'); if(cnt) cnt.textContent = pl.filter(function(p){ return !doneOf(p); }).length + ' 条待办';
  var box = $('partnerPlans'); if(box) box.innerHTML = partnerPlanHtml(pl);

  var pr = presenceText();
  if($('presenceLine')) $('presenceLine').textContent = pr.text;
  if($('pDot')) $('pDot').className = 'dot' + (pr.stale ? ' stale' : '');
  if($('cheerRow')){
    $('cheerRow').innerHTML = QUICK_CHEER.map(function(t){
      return '<button class="chip" data-act="quicksend" data-text="'+esc(t)+'">'+esc(t)+'</button>';
    }).join('');
  }
  var cl = $('chatList');
  if(cl){
    var items = state.chat.slice().sort(function(a,b){ return stampOf(a.ts) - stampOf(b.ts); });
    if(!items.length){
      cl.innerHTML = '<p style="font-size:13.5px;color:var(--ink2);margin:0">还没有留言。</p>';
    } else {
      cl.innerHTML = items.map(chatMsgHtml).join('');
    }
  }
  var n = unreadCount();
  ['tbBadgePartner','sbBadgePartner'].forEach(function(id){
    var b = $(id); if(!b) return;
    if(n > 0){ b.textContent = String(n); b.className = 'badge'; }
    else b.className = 'badge hide';
  });
}
/* ================= 心情日历 ================= */
function moodCursor(){ return state.moodCursor || todayStr(); }
function moodRange(){
  var c = moodCursor();
  if(state.moodView === 'week'){
    var s = mondayOf(c);
    return {start:s, end:addDays(s,6), label:fmtMD(s)+' — '+fmtMD(addDays(s,6))};
  }
  var d = parseDay(c) || parseDay(todayStr());
  var first = new Date(d.getFullYear(), d.getMonth(), 1);
  var last = new Date(d.getFullYear(), d.getMonth()+1, 0);
  return {start:ymd(first), end:ymd(last), label:d.getFullYear()+'年'+(d.getMonth()+1)+'月'};
}
function moodCalHtml(){
  var r = moodRange();
  var days = [], i;
  if(state.moodView === 'week'){
    for(i=0;i<7;i++) days.push(addDays(r.start, i));
  } else {
    var s = parseDay(r.start);
    var lead = s.getDay();                              /* 周日开头，标准月历 */
    for(i=0;i<lead;i++) days.push('');
    var total = dayDiff(r.end, r.start) + 1;
    for(i=0;i<total;i++) days.push(addDays(r.start, i));
    while(days.length % 7 !== 0) days.push('');
  }
  var html = '<div class="whoRow">'
    + '<span><b>' + esc(state.me || '我') + '</b>＝左边</span>'
    + '<span><b>' + esc(state.partner || '对方') + '</b>＝右边</span>'
    + '<span style="margin-left:auto"><i class="mini"></i>虚线框＝没记</span>'
    + '</div>'
    + '<div class="wk">'
    + ['日','一','二','三','四','五','六'].map(function(w, idx){
        return '<span'+(idx === 0 || idx === 6 ? ' class="wend"' : '')+'>'+w+'</span>';
      }).join('')
    + '</div><div class="grid">';
  days.forEach(function(day){
    if(!day){ html += '<div class="cell out" aria-hidden="true"></div>'; return; }
    var mine = moodOf(day, state.me);
    var their = moodOf(day, state.partner);
    var pd = parseDay(day);
    var num = String(pd.getDate());
    var isToday = (day === todayStr());
    var isWend = (pd.getDay() === 0 || pd.getDay() === 6);
    var tip = fmtMD(day) + '：' + (state.me || '我') + ' ' + (mine || '未记')
      + ' · ' + (state.partner || '对方') + ' ' + (their || '未记');
    html += '<div class="cell'+(isToday ? ' today' : '')+(isWend ? ' wend' : '')
      +'" data-mday="'+day+'" role="button" tabindex="0" aria-label="'+esc(tip)+'" title="'+esc(tip)+'">'
      + '<span class="dn">'+num+'</span>'
      + '<span class="faces">'
      + (mine ? moodFace(mine, 19) : '<span class="none" title="未记"></span>')
      + (their ? moodFace(their, 19) : '<span class="none" title="未记"></span>')
      + '</span></div>';
  });
  return html + '</div>';
}
function moodDistHtml(){
  var r = moodRange();
  return [{who:state.me, label:'我'}, {who:state.partner, label:state.partner || '对方'}].map(function(row){
    var res = moodCount(r.start, r.end, row.who);
    var segs = '';
    MOODS.forEach(function(m){
      var n = res.c[m.k] || 0;
      if(!n) return;
      segs += '<i style="flex:'+n+';background:'+m.bg+'"></i>';
    });
    var top = topMoods(r.start, r.end, row.who, 2).list;
    var txt = top.length ? top.map(function(t){ return t.k+' '+t.n; }).join(' · ') : '这期间没记';
    return '<div class="distRow"><span class="who">'+esc(row.label)+'</span>'
      + '<span class="dist'+(segs ? '' : ' empty')+'">'+segs+'</span>'
      + '<span class="txt">'+esc(txt)+'</span></div>';
  }).join('');
}
function moodLegendHtml(){
  return MOODS.map(function(m){
    return '<span>'+moodFace(m.k, 14)+esc(m.k)+'</span>';
  }).join('');
}
function renderMood(){
  var r = moodRange();
  if($('moodLabel')) $('moodLabel').textContent = r.label;
  if($('moodCal')) $('moodCal').innerHTML = moodCalHtml();
  if($('moodDist')) $('moodDist').innerHTML = moodDistHtml();
  if($('moodLegend')) $('moodLegend').innerHTML = moodLegendHtml();
  if($('moodTotals')){
    var a = moodCount(r.start, r.end, state.me), b = moodCount(r.start, r.end, state.partner);
    $('moodTotals').textContent = '我记了 '+a.total+' 天 · '+(state.partner || '对方')+'记了 '+b.total+' 天';
  }
  var seg = $('moodSeg');
  if(seg){
    var bs = seg.querySelectorAll('button');
    for(var i=0;i<bs.length;i++){
      bs[i].className = (bs[i].getAttribute('data-view') === state.moodView) ? 'on' : '';
    }
  }
  var todayMood = moodOf(todayStr(), state.me);
  if($('moodTodayTip')) $('moodTodayTip').textContent = todayMood ? ('你今天记的是「'+todayMood+'」') : '今天还没记，点左上角小格补上';
}
function shiftMood(dir){
  var c = moodCursor();
  if(state.moodView === 'week'){ state.moodCursor = addDays(c, dir*7); renderMood(); return; }
  var d = parseDay(c) || parseDay(todayStr());
  var m = d.getMonth() + dir;
  var y = d.getFullYear() + Math.floor(m/12);
  m = ((m % 12) + 12) % 12;
  var dim = new Date(y, m+1, 0).getDate();
  state.moodCursor = ymd(new Date(y, m, Math.min(d.getDate(), dim)));
  renderMood();
}
/* 计划页顶部的「今天心情」一行条：打卡完只留这一行，不占画面 */
function renderMoodQuick(){
  var bar = $('moodQuick');
  if(!bar) return;
  var cur = moodOf(todayStr(), state.me);
  if($('mqFace')){
    $('mqFace').innerHTML = cur ? moodFace(cur, 30)
      : '<svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true">'
        + '<rect x="2.5" y="2.5" width="43" height="43" rx="15" fill="none" stroke="#E4E7ED" stroke-width="2" stroke-dasharray="4 4"/>'
        + '<path d="M17 25q3 2.5 6 0M25 25q3 2.5 6 0" fill="none" stroke="#C4C9D4" stroke-width="2.4" stroke-linecap="round"/></svg>';
  }
  bar.className = 'moodBar' + (cur ? ' on' : '');
  if($('moodQuickSub')) $('moodQuickSub').textContent = cur ? ('今天：' + cur + ' · 点击可改') : '点一下记录';
  if($('mqGo')) $('mqGo').textContent = cur ? '修改' : '记录';
}

/* ================= 双人小结 ================= */
function renderDuo(){
  var r = weekRange(state.weekOffset);
  var mine = noteOf(r.start, state.me);
  var theirs = noteOf(r.start, state.partner);
  if($('duoRange')) $('duoRange').textContent = fmtMD(r.start)+' — '+fmtMD(r.end);
  if($('nKeep')) $('nKeep').value = mine ? (mine.keep || '') : '';
  if($('nTry')) $('nTry').value = mine ? (mine.attempt || '') : '';
  if($('duoMeHint')) $('duoMeHint').textContent = (mine && (mine.keep || mine.attempt)) ? '已写，可随时改' : '还没写';
  if($('duoPartnerName')) $('duoPartnerName').textContent = state.partner || '对方';
  if($('duoPartnerHint')) $('duoPartnerHint').textContent = (theirs && (theirs.keep || theirs.attempt)) ? '已写' : '还没写';
  fillRo('pKeep', theirs ? theirs.keep : '');
  fillRo('pTry', theirs ? theirs.attempt : '');
}
function fillRo(id, v){
  var el = $(id);
  if(!el) return;
  if(v){ el.textContent = v; el.className = 'ro'; }
  else { el.textContent = '还没写'; el.className = 'ro empty'; }
}
function saveMyNote(){
  var r = weekRange(state.weekOffset);
  var keep = $('nKeep') ? $('nKeep').value.trim() : '';
  var attempt = $('nTry') ? $('nTry').value.trim() : '';
  var exist = noteOf(r.start, state.me);
  if(exist){
    exist.keep = keep; exist.attempt = attempt; exist.who = state.me;
    saveNoteRemote(exist);
  } else {
    var nt = { key:'n-local-'+Date.now(), rid:'', weekStart:r.start, who:state.me, keep:keep, attempt:attempt };
    state.notes.push(nt);
    saveNoteRemote(nt);
  }
  saveCache();
  renderDuo();
  toast('已保存 '+fmtMD(r.start)+' 那一周的小结');
}

/* ================= 本周对话 ================= */
function renderWeekChat(){
  var r = weekRange(state.weekOffset);
  var ms = state.chat.filter(function(c){
    var t = stampOf(c.ts);
    if(!t) return false;
    var d = ymd(new Date(t));
    return dayDiff(d, r.start) >= 0 && dayDiff(r.end, d) >= 0;
  }).sort(function(a,b){ return stampOf(a.ts) - stampOf(b.ts); });
  var box = $('weekChat');
  if(box){
    box.innerHTML = ms.length
      ? ms.map(chatMsgHtml).join('')
      : '<p style="font-size:13.5px;color:var(--ink2);margin:0">这一周还没有对话。想到什么就说一句，对方打开就能看到。</p>';
  }
  if($('weekChatSub')) $('weekChatSub').textContent = ms.length ? (ms.length + ' 条') : '';
  var cr = $('wCheerRow');
  if(cr){
    cr.innerHTML = QUICK_CHEER.slice(0, 4).map(function(t){
      return '<button class="chip" data-act="wquick" data-text="'+esc(t)+'">'+esc(t)+'</button>';
    }).join('');
  }
}
function sendWeekChat(){
  var el = $('weekInput');
  if(!el) return;
  var v = el.value.replace(/\s+$/,'');
  if(!v){ toast('先写点什么'); return; }
  sendChat('留言', v, '');
  el.value = '';
}
/* ================= 照片记录页 ================= */
function photoDate(){ return state.photoDate || todayStr(); }
function shiftPhotoDay(dir){
  state.photoDate = addDays(photoDate(), dir);
  state.moodCursor = state.photoDate;
  renderPhoto();
}
function renderPhoto(){
  var d = photoDate();
  if($('photoDateText')) $('photoDateText').textContent = fmtMD(d) + (wdName(d) ? ' · ' + wdName(d) : '');
  if($('photoDateSub')){
    var mine = dayRecord(d, state.me);
    var bits = [];
    if(mine && mine.mood) bits.push('心情 ' + mine.mood);
    if(mine && mine.rate) bits.push(mine.rate);
    bits.push(d === todayStr() ? '今天' : '');
    $('photoDateSub').textContent = bits.filter(function(x){ return !!x; }).join(' · ') || '这天还没记录';
  }
  renderMood();
  renderPhotoGrid();
  renderDayFields();
  renderPastDays();
  renderPhotoChat();
}
function renderPhotoGrid(){
  var d = photoDate();
  var list = dayPhotosAll(d);            /* 两个人的照片都显示 */
  var box = $('photoGrid');
  if($('photoCount')) $('photoCount').textContent = list.length ? (list.length + ' 张') : '还没有照片';
  if(!box) return;
  if(!list.length){
    box.innerHTML = '<p class="empty">这天还没照片。点下面的「添加照片」，选一张就存好了。</p>';
    return;
  }
  box.innerHTML = list.map(function(p){
    var mine = p.who === state.me;
    return '<div class="pcard">'
      + '<span class="pwho" style="background:'+colorOf(p.who)+'">'+esc(p.who || '—')+'</span>'
      + '<img src="'+esc(p.img)+'" alt="'+esc(p.cap || '照片')+'">'
      + (mine ? '<button class="del" data-pdel="'+esc(p.key)+'" aria-label="删除这张照片">×</button>' : '')
      + (mine
          ? '<input class="cap" data-pcap="'+esc(p.key)+'" type="text" placeholder="给这张照片写一句…" value="'+esc(p.cap || '')+'">'
          : '<div class="cap ro">'+esc(p.cap || '还没写字')+'</div>')
      + '</div>';
  }).join('');
  /* 每张照片单独的输入框：改完失焦就存 */
  var caps = box.querySelectorAll('[data-pcap]');
  for(var i=0;i<caps.length;i++){
    (function(el){
      el.addEventListener('change', function(){ savePhotoCaption(el.getAttribute('data-pcap'), el.value); });
      el.addEventListener('blur', function(){ savePhotoCaption(el.getAttribute('data-pcap'), el.value); });
    })(caps[i]);
  }
}
function renderDayFields(){
  var d = photoDate();
  var rec = dayRecord(d, state.me);
  var mr = $('phMoodRow');
  if(mr){
    mr.innerHTML = MOODS.map(function(m){
      var on = rec && rec.mood === m.k;
      return '<button class="'+(on ? 'on' : '')+'" data-pmood="'+esc(m.k)+'">'+moodFace(m.k, 26)+'<span>'+esc(m.k)+'</span></button>';
    }).join('');
  }
  var rr = $('phRateRow');
  if(rr){
    rr.innerHTML = RATES.map(function(t){
      var on = rec && rec.rate === t;
      return '<button class="chip2 '+(on ? 'on' : '')+'" data-prate="'+esc(t)+'">'+esc(t)+'</button>';
    }).join('');
  }
  var tr = $('phTagRow');
  if(tr){
    var tags = rec ? String(rec.tags || '').split(/[、,，\s]+/).filter(function(x){ return !!x; }) : [];
    tr.innerHTML = PHOTO_TAGS.map(function(t){
      var on = tags.indexOf(t) >= 0;
      return '<button class="chip2 '+(on ? 'on' : '')+'" data-ptag="'+esc(t)+'">'+esc(t)+'</button>';
    }).join('');
  }
}
function setVal(id, v){ var el = $(id); if(el && el.value !== (v || '')) el.value = v || ''; }
function renderPastDays(){
  var box = $('phPast');
  if(!box) return;
  var days = photoDaysAll().slice(0, 40);   /* 两个人的日子都列出来 */
  if($('phPastCount')) $('phPastCount').textContent = days.length ? (days.length + ' 天') : '';
  if(!days.length){
    box.innerHTML = '<p style="font-size:13px;color:var(--ink3);margin:0">还没有任何记录。选一天、加张照片试试。</p>';
    return;
  }
  box.innerHTML = days.map(function(d){
    var ps = dayPhotosAll(d);
    var rec = dayRecord(d, state.me) || dayRecord(d, state.partner);
    var thumbs = ps.length
      ? ps.slice(0, 3).map(function(p){ return '<img src="'+esc(p.img)+'" alt="">'; }).join('')
      : '<span class="no"></span>';
    var sum = [];
    if(rec && rec.mood) sum.push(rec.mood);
    if(rec && rec.did) sum.push(rec.did);
    else if(rec && rec.say) sum.push(rec.say);
    else if(ps.length) sum.push(ps.length + ' 张照片');
    if(rec && rec.tags) sum.push(String(rec.tags).split(/[、,，\s]+/).filter(function(x){return !!x;}).slice(0,2).join(' · '));
    return '<div class="pastRow" data-pday="'+esc(d)+'" role="button" tabindex="0">'
      + '<span class="thumbs">'+thumbs+'</span>'
      + '<span class="pmeta"><span class="pd">'+esc(fmtMD(d))+(d === todayStr() ? ' · 今天' : (wdName(d) ? ' · '+wdName(d) : ''))+'</span>'
      + '<span class="ps">'+esc(sum.join(' · ') || '只记了几笔')+'</span></span></div>';
  }).join('');
}
/* ================= 照片聊天：挂在某一天上，两个人都能看到 ================= */
function photoChatKey(d){ return 'photo:' + (d || photoDate()); }
function photoChatMsgs(){
  var k = photoChatKey();
  return state.chat.filter(function(c){ return c.rel === k; })
    .sort(function(a,b){ return stampOf(a.ts) - stampOf(b.ts); });
}
function hhmm(t){
  if(!t) return '';
  var d = new Date(t);
  return ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2);
}
function photoChatMsgHtml(c){
  var mine = c.from === state.me;
  return '<div class="msg'+(mine ? ' mine' : '')+'">'
    + '<span class="av" style="background:'+colorOf(c.from)+'">'+esc(initials(c.from))+'</span>'
    + '<div class="bub"><div class="who">'+esc(c.from || '—')+' · '+hhmm(stampOf(c.ts))+'</div>'
    + '<div class="txt">'+esc(c.content)+'</div></div></div>';
}
function renderPhotoChat(){
  var box = $('photoChat');
  if(!box) return;
  var ms = photoChatMsgs();
  if($('photoChatSub')) $('photoChatSub').textContent = ms.length ? (ms.length + ' 条') : '';
  box.innerHTML = ms.length
    ? ms.map(photoChatMsgHtml).join('')
    : '<p class="empty">这天还没人说话。看到照片想说什么，直接发一句，对方打开就能看到。</p>';
  box.scrollTop = box.scrollHeight;
}
function sendPhotoChat(){
  var el = $('photoChatInput');
  if(!el) return;
  var v = String(el.value || '').replace(/\s+$/,'');
  if(!v){ toast('先写点什么'); return; }
  sendChat('留言', v, photoChatKey());
  el.value = '';
  renderPhotoChat();
}

/* 文字 / 评分 / 标签：改动后 700ms 自动存，不用点保存 */
var _dayTimer = 0;
function onDayField(field, value){
  var d = photoDate();
  var rec = ensureDay(d, state.me);
  rec[field] = value;
  saveCache();
  if(_dayTimer) clearTimeout(_dayTimer);
  _dayTimer = setTimeout(function(){ savePhotoRemote(rec); }, 700);
  if(field === 'rate') renderDayFields();
  if($('photoDateSub')) renderPhoto();
}
function setDayMood(k){
  var d = photoDate();
  var rec = ensureDay(d, state.me);
  rec.mood = (rec.mood === k) ? '' : k;
  savePhotoRemote(rec);
  saveCache();
  renderPhoto();
  toast(rec.mood ? (fmtMD(d) + ' 心情：' + k) : '已清掉这天的心情');
}
function toggleDayTag(t){
  var d = photoDate();
  var rec = ensureDay(d, state.me);
  var tags = String(rec.tags || '').split(/[、,，\s]+/).filter(function(x){ return !!x; });
  var i = tags.indexOf(t);
  if(i >= 0) tags.splice(i, 1); else tags.push(t);
  rec.tags = tags.join('、');
  savePhotoRemote(rec);
  saveCache();
  renderDayFields();
}
function savePhotoCaption(key, value){
  for(var i=0;i<state.photos.length;i++){
    if(state.photos[i].key === key){
      if(state.photos[i].cap === value) return;
      state.photos[i].cap = value;
      savePhotoRemote(state.photos[i]);
      saveCache();
      return;
    }
  }
}
function deletePhoto(key){
  for(var i=0;i<state.photos.length;i++){
    if(state.photos[i].key === key){
      var p = state.photos[i];
      deletePhotoRemote(p);
      state.photos.splice(i, 1);
      saveCache();
      renderPhoto();
      toast('照片已删除');
      return;
    }
  }
}
/* 选照片 → 压缩 → 直接存（一步到位，不用再点保存） */
function onPhotoPicked(e){
  var input = e.target;
  var files = input.files || [];
  if(!files.length) return;
  var d = photoDate();
  var base = dayPhotos(d, state.me).length;   /* 先占好序号，回调里不抢，顺序才跟你选的一致 */
  var room = PHOTO_MAX > 0 ? (PHOTO_MAX - base) : files.length;
  if(room <= 0){ toast('这天已经有 ' + PHOTO_MAX + ' 张了，先删一张再加'); input.value = ''; return; }
  var use = Array.prototype.slice.call(files, 0, Math.min(room, PHOTO_BATCH));
  if(files.length > use.length) toast('一次最多加 ' + PHOTO_BATCH + ' 张，多的下次再加');
  toast('正在处理 ' + use.length + ' 张照片…');
  use.forEach(function(f, idx){
    compressImage(f, function(dataUrl){
      if(!dataUrl) return;
      var p = { key:'ph-local-'+Date.now()+'-'+idx, rid:'', date:d, who:state.me,
                img:dataUrl, cap:'', did:'', ate:'', say:'', mood:'', rate:'', tags:'', seq:base + idx + 1 };
      state.photos.push(p);
      savePhotoRemote(p);
      saveCache();
      renderPhoto();
    });
  });
  input.value = '';
}
/* 压到长边 PHOTO_SIDE 像素的 JPEG，尽量把体积压小 */
function compressImage(file, cb){
  if(!/^image\//.test(file.type)){ toast('只能选图片'); cb(''); return; }
  var fr = new FileReader();
  fr.onload = function(){
    var img = new Image();
    img.onload = function(){
      var w = img.width, h = img.height;
      var scale = Math.min(1, PHOTO_SIDE / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      try{ cb(cv.toDataURL('image/jpeg', PHOTO_QUALITY)); }
      catch(err){ toast('这张图片处理失败了'); cb(''); }
    };
    img.onerror = function(){ toast('这张图片读不出来'); cb(''); };
    img.src = String(fr.result);
  };
  fr.onerror = function(){ cb(''); };
  fr.readAsDataURL(file);
}
function buildReportText(){
  var r = weekRange(state.weekOffset);
  var st = weekStats(r.start, r.end);
  var mine = noteOf(r.start, state.me);
  var theirs = noteOf(r.start, state.partner);
  var pn = state.partner || '对方';
  var L = [];
  L.push('【周复盘】'+fmtMD(r.start)+' — '+fmtMD(r.end));
  L.push('完成待办 '+st.done+' 件（'+splitText(st.byDone.me, st.byDone.other)+'）');
  L.push('打卡 '+st.logs+' 次（'+splitText(st.byLogs.me, st.byLogs.other)+'）');
  L.push('涉及计划 '+st.plans+' 个');
  if(st.doneList.length) L.push('完成：'+st.doneList.map(function(p){ return p.title; }).join('、'));
  var mt = topMoods(r.start, r.end, state.me, 3).list.map(function(x){ return x.k+' '+x.n; }).join('、');
  var pt = topMoods(r.start, r.end, state.partner, 3).list.map(function(x){ return x.k+' '+x.n; }).join('、');
  L.push('我的心情：'+(mt || '这期间没记'));
  L.push(pn+'的心情：'+(pt || '这期间没记'));
  L.push('');
  L.push('【我】');
  L.push('做得好的：'+((mine && mine.keep) || ''));
  L.push('想改的：'+((mine && mine.attempt) || ''));
  L.push('【'+pn+'】');
  L.push('做得好的：'+((theirs && theirs.keep) || ''));
  L.push('想改的：'+((theirs && theirs.attempt) || ''));
  return L.join('\n');
}
function renderMine(){
  if($('nameMe')) $('nameMe').value = state.me || '';
  if($('namePartner')) $('namePartner').value = state.partner || '';
  if($('roomCodeText')) $('roomCodeText').textContent = state.room || '未加入';
  var pc = pendingCount();
  if($('pendingRow')) $('pendingRow').style.display = pc > 0 ? '' : 'none';
  if($('pendingText')) $('pendingText').textContent = pc + ' 项';
  if($('btnFlushPending')) $('btnFlushPending').className = 'btn' + (pc > 0 ? '' : ' hide');
  if($('sideFoot')) $('sideFoot').textContent = '我 · ' + (state.me || '—') + '　|　' + (state.partner || '—');
}
function render(){
  renderFilters();
  renderMeRow();
  renderMoodQuick();
  renderToday();
  renderList();
  renderPartner();
  renderPhoto();
  renderMine();
  renderArchiveMeta();
}
function refreshAll(){ render(); }

/* ================= 轻提示与动效 ================= */
function toast(msg){
  var t = $('toast'); if(!t) return;
  t.textContent = msg;
  t.className = 'on';
  if(state._toastT) clearTimeout(state._toastT);
  state._toastT = setTimeout(function(){ t.className = ''; }, 2200);
}
function celebrate(){
  var fx = $('fx'); if(!fx) return;
  var colors = ['#6D5BF6','#8B7BFF','#EF9F27','#16A34A','#378ADD','#E24B4A'];
  for(var i=0;i<34;i++){
    var s = document.createElement('span');
    s.className = 'cf';
    var dx = Math.round((Math.random()-0.5)*240);
    var dur = Math.round(1000 + Math.random()*700);
    var delay = Math.round(Math.random()*220);
    s.setAttribute('style','left:'+Math.round(Math.random()*100)+'%;top:-16px;background:'+colors[i % colors.length]
      +';--dx:'+dx+'px;--rot:'+Math.round(Math.random()*720-360)+'deg;animation:cfFall '+dur+'ms '+delay+'ms cubic-bezier(.32,.72,.42,1) forwards');
    fx.appendChild(s);
    (function(node, d){
      setTimeout(function(){ if(node && node.parentNode) node.parentNode.removeChild(node); }, d);
    })(s, dur + delay + 150);
  }
}

/* ================= 浮层 ================= */
/* 可通过「点遮罩空白 / ESC / 手机返回键」关闭的弹层。
   maskAsk / maskWho / maskWx / maskA2hs 是必须明确表态的引导，不给随手关掉。 */
var CLOSE_ON_BACK = { maskCompose:1, maskDetail:1, maskCheckin:1, maskMood:1, maskArchive:1 };
var _sheetPushed = false;
function openSheet(id){
  var m = $(id); if(!m) return;
  m.className = 'mask on';
  /* 给可关闭的弹层压一条历史记录，手机返回键才是「关弹层」而不是「退出页面」 */
  if(CLOSE_ON_BACK[id] && !_sheetPushed){
    _sheetPushed = true;
    try{ history.pushState({ wbSheet: 1 }, ''); }catch(e){}
  }
}
function closeSheet(id){
  var m = $(id); if(!m) return;
  m.className = 'mask';
  if(_sheetPushed && !document.querySelector('.mask.on')){
    _sheetPushed = false;
    try{ history.back(); }catch(e){}
  }
}
function closeTopSheet(){
  var open = document.querySelector('.mask.on');
  if(!open || !CLOSE_ON_BACK[open.id]) return false;
  open.className = 'mask';
  if(_sheetPushed && !document.querySelector('.mask.on')){
    _sheetPushed = false;
    try{ history.back(); }catch(e){}
  }
  return true;
}
function askConfirm(title, text, needText, fn){
  if($('askTitle')) $('askTitle').textContent = title;
  if($('askText')) $('askText').textContent = text;
  if($('askInput')){
    $('askInput').value = '';
    $('askInput').className = needText ? '' : 'hide';
    if(needText) $('askInput').placeholder = '输入「'+needText+'」确认';
  }
  state.askFn = {need:needText, fn:fn};
  openSheet('maskAsk');
}
function switchTab(name){
  state.tab = name;
  ['plan','partner','photo','mine'].forEach(function(t){
    var p = $('panel-'+t);
    if(p) p.className = 'panel' + (t === name ? ' on' : '');
  });
  var btns = document.querySelectorAll('.tabbar button, .sidebar nav button');
  for(var i=0;i<btns.length;i++){
    btns[i].className = (btns[i].getAttribute('data-tab') === name) ? 'on' : '';
  }
  if(name === 'partner'){ markRead(); renderPartner(); }
  if(name === 'photo') renderPhoto();
  if(name === 'mine') renderMine();
}

/* ================= 新建 / 编辑 ================= */
function renderQuadPick(){
  var el = $('quadPick');
  if(el){
    el.innerHTML = QUADS.map(function(q){
      var on = state.pickedQuad === q.n;
      return '<button data-q="'+q.n+'" style="'+(on ? ('background:'+q.color+';border-color:'+q.color+';color:#fff') : ('color:'+q.color))+'">'+q.rn+' '+q.short+'</button>';
    }).join('');
  }
  var q = QUADS[state.pickedQuad-1] || QUADS[3];
  if($('qMark')) $('qMark').textContent = q.rn;
  if($('btnToolQuad')) $('btnToolQuad').style.background = q.color;
}
function updateParsed(){
  var el = $('parsedRow'), tx = $('parsedText');
  if(!el || !tx) return;
  var raw = $('fTitle') ? $('fTitle').value : '';
  var hit = parseDateInput(raw);
  if(state.pickedDate){
    el.className = 'parsed';
    tx.textContent = '已设为 ' + fmtMD(state.pickedDate) + ' ' + wdName(state.pickedDate) + (state.pickedDate === todayStr() ? ' · 今天' : '');
  } else if(hit){
    el.className = 'parsed';
    tx.textContent = '识别到 ' + fmtMD(hit.date) + ' ' + wdName(hit.date) + (hit.date === todayStr() ? ' · 今天' : '');
  } else {
    el.className = 'parsed off';
    tx.textContent = '没说时间就不设日期';
  }
}
function openCompose(mode, p){
  state.composeMode = mode || 'new';
  state.pickedQuad = p ? p.quad : 4;
  state.quant = p ? (p.ptype === '量化') : false;
  state.editingKey = p ? p.key : '';
  state.pickedDate = p ? p.pdate : '';
  if($('composeTitle')) $('composeTitle').textContent = (mode === 'edit' ? '修改计划' : '记些重要的事情吧');
  if($('fTitle')) $('fTitle').value = p ? p.title : '';
  if($('fUnit')) $('fUnit').value = p ? p.unit : '';
  if($('fTotal')) $('fTotal').value = (p && p.total) ? String(p.total) : '';
  if($('fDeadline')) $('fDeadline').value = p ? p.deadline : '';
  if($('fObstacle')) $('fObstacle').value = p ? p.obstacle : '';
  if($('fPlan')) $('fPlan').value = p ? p.plan : '';
  if($('fDate')) $('fDate').value = p ? p.pdate : '';
  if($('quadPick')) $('quadPick').className = 'quadPick hide';
  if($('quantBox')) $('quantBox').className = state.quant ? '' : 'hide';
  if($('planBox')) $('planBox').className = 'hide';
  if($('btnToolQuant')) $('btnToolQuant').className = 'tool quant' + (state.quant ? ' on' : '');
  if($('btnToolPlan')) $('btnToolPlan').className = 'tool plan';
  if($('btnToolMore')) $('btnToolMore').className = 'tool more';
  renderQuadPick();
  updateParsed();
  openSheet('maskCompose');
  setTimeout(function(){ if($('fTitle')) $('fTitle').focus(); }, 150);
}
function submitCompose(){
  var raw = $('fTitle') ? $('fTitle').value : '';
  var hit = parseDateInput(raw);
  var title = hit ? stripDate(raw, hit.raw) : String(raw || '').trim();
  if(!title) title = String(raw || '').trim();
  if(!title){ toast('先写一句话吧'); return; }
  var date = state.pickedDate || (hit ? hit.date : '');
  var unit = $('fUnit') ? $('fUnit').value.trim() : '';
  var total = $('fTotal') ? num($('fTotal').value) : 0;
  var deadline = $('fDeadline') ? String($('fDeadline').value || '').trim() : '';
  var obstacle = $('fObstacle') ? $('fObstacle').value.trim() : '';
  var planTxt = $('fPlan') ? $('fPlan').value.trim() : '';

  if(state.composeMode === 'edit'){
    var p = planByKey(state.editingKey);
    if(!p){ closeSheet('maskCompose'); return; }
    p.title = title;
    p.quad = state.pickedQuad;
    p.pdate = date || p.pdate;
    p.ptype = state.quant ? '量化' : '待办';
    p.unit = unit; p.total = total; p.deadline = deadline;
    p.obstacle = obstacle; p.plan = planTxt;
    updatePlanRemote(p);
    saveCache(); closeSheet('maskCompose'); refreshAll();
    toast('已更新「'+title+'」');
    return;
  }
  var np = {
    key: 'p-local-'+Date.now(), rid: '', title: title, unit: unit, total: total,
    deadline: deadline, obstacle: obstacle, plan: planTxt, status: '进行中',
    quad: state.pickedQuad, owner: state.me, pdate: date,
    ptype: state.quant ? '量化' : '待办', doneDate: ''
  };
  state.plans.push(np);
  saveCache();
  closeSheet('maskCompose');
  refreshAll();
  addPlanRemote(np);
  toast('已添加「'+title+'」');
}

/* ================= 详情 / 完成 / 打卡 ================= */
function toggleDone(key){
  var p = planByKey(key);
  if(!p) return;
  if(doneOf(p)){
    p.status = '进行中'; p.doneDate = '';
    updatePlanRemote(p); saveCache(); refreshAll();
    toast('已取消完成');
    return;
  }
  var wasDone = false;
  p.status = '已完成'; p.doneDate = todayStr();
  updatePlanRemote(p); saveCache();
  refreshAll();
  if(!wasDone){ celebrate(); toast('「'+p.title+'」完成，恭喜！'); }
}
function openDetail(key){
  var p = planByKey(key);
  if(!p) return;
  state.detailKey = key;
  var q = QUADS[p.quad-1] || QUADS[3];
  var prog = progressOf(p);
  if($('detailTitle')) $('detailTitle').textContent = p.title;
  var rows = '';
  rows += '<div class="kv"><span class="k">象限</span><span class="v" style="color:'+q.color+';font-weight:600">'+q.rn+' '+q.short+'</span></div>';
  rows += '<div class="kv"><span class="k">负责人</span><span class="v">'+esc(p.owner || '—')+'</span></div>';
  rows += '<div class="kv"><span class="k">计划日期</span><span class="v">'+(p.pdate ? (fmtMD(p.pdate)+' '+wdName(p.pdate)) : '未设')+'</span></div>';
  rows += '<div class="kv"><span class="k">类型</span><span class="v">'+p.ptype+'</span></div>';
  if(p.ptype === '量化'){
    rows += '<div class="kv"><span class="k">进度</span><span class="v">'+(prog ? (prog.done+' / '+prog.total+' '+esc(p.unit||'')+' · '+prog.pct+'%') : '未设总量')+'</span></div>';
  }
  if(p.deadline) rows += '<div class="kv"><span class="k">截止日</span><span class="v">'+fmtMD(p.deadline)+'</span></div>';
  if(p.doneDate) rows += '<div class="kv"><span class="k">完成于</span><span class="v">'+fmtMD(p.doneDate)+'</span></div>';
  if(p.obstacle) rows += '<div class="kv"><span class="k">障碍</span><span class="v">'+esc(p.obstacle)+'</span></div>';
  if(p.plan) rows += '<div class="kv"><span class="k">对策</span><span class="v">'+esc(p.plan)+'</span></div>';

  var logs = state.logs.filter(function(l){ return l.planTitle === p.title; })
    .sort(function(a,b){ return String(b.date).localeCompare(String(a.date)); });
  var logHtml = '';
  if(p.ptype === '量化'){
    logHtml += '<div class="card-h" style="margin:16px 0 4px"><span class="bar"></span><h2>打卡记录</h2><span class="sub">共 '+logs.length+' 条</span></div>';
    if(!logs.length) logHtml += '<p style="font-size:13px;color:var(--ink2);margin:0">还没有记录。</p>';
    logs.slice(0,10).forEach(function(l){
      logHtml += '<div class="logline"><span class="d">'+fmtMD(l.date)+'</span><span class="a">+'+trimNum(l.amount)+' '+esc(l.unit||'')+'</span>'
        + (l.note ? '<span class="tag gray">'+esc(l.note)+'</span>' : '')
        + '<span class="sp"></span>'
        + '<span style="color:var(--ink3);font-size:12px">'+esc(l.who||'')+'</span>'
        + '<button class="delBtn" data-act="dellog" data-key="'+l.key+'">删</button></div>';
    });
  }
  var body = $('detailBody');
  if(body){
    body.innerHTML = rows + logHtml
      + '<div class="btnRow" style="margin-top:16px">'
      + (p.ptype === '量化'
        ? '<button class="btn pri" data-act="checkin" data-key="'+p.key+'">打卡</button>'
        : '<button class="btn pri" data-act="toggle" data-key="'+p.key+'">'+(doneOf(p) ? '取消完成' : '标为完成')+'</button>')
      + '<button class="btn" data-act="edit" data-key="'+p.key+'">编辑</button>'
      + '<button class="btn danger" data-act="delplan" data-key="'+p.key+'">删除</button>'
      + '</div>';
  }
  openSheet('maskDetail');
}
function openCheckin(key){
  var p = planByKey(key);
  if(!p) return;
  state.checkinKey = key;
  state.checkinDate = todayStr();
  if($('checkinTitle')) $('checkinTitle').textContent = '打卡 · ' + p.title;
  if($('fAmount')){
    $('fAmount').value = '';
    $('fAmount').placeholder = p.unit ? ('数量（'+p.unit+'）') : '数量';
  }
  renderDateChips();
  openSheet('maskCheckin');
  setTimeout(function(){ if($('fAmount')) $('fAmount').focus(); }, 150);
}
function renderDateChips(){
  var el = $('dateChips'); if(!el) return;
  var html = '';
  for(var i=0;i<7;i++){
    var day = addDays(todayStr(), -i);
    var on = state.checkinDate === day;
    var label = i === 0 ? '今天' : (i === 1 ? '昨天' : (i === 2 ? '前天' : fmtMD(day)));
    html += '<button class="dchip'+(on ? ' on' : '')+'" data-day="'+day+'">'+label+'</button>';
  }
  el.innerHTML = html;
}
function doCheckin(){
  var p = planByKey(state.checkinKey);
  if(!p) return;
  var amt = $('fAmount') ? num($('fAmount').value) : 0;
  if(amt <= 0){ toast('填一下这次完成多少'); return; }
  var day = state.checkinDate || todayStr();
  var wasFull = false;
  var prog = progressOf(p);
  if(prog && prog.done >= prog.total) wasFull = true;
  var l = {
    key: 'l-local-'+Date.now(), rid: '', date: day, planTitle: p.title,
    amount: amt, unit: p.unit || '', note: (day === todayStr() ? '' : '补'), who: state.me
  };
  state.logs.push(l);
  saveCache();
  closeSheet('maskCheckin');
  refreshAll();
  addLogRemote(l);
  var np = progressOf(p);
  if(!wasFull && np && np.done >= np.total){
    celebrate();
    toast('「'+p.title+'」达成，恭喜！');
  } else {
    toast((day === todayStr() ? '已打卡 +' : '已补记 +')+trimNum(amt)+(p.unit ? (' '+p.unit) : ''));
  }
}
function openEditFrom(key){
  var p = planByKey(key);
  if(!p) return;
  closeSheet('maskDetail');
  openCompose('edit', p);
}
function removePlan(key){
  var p = planByKey(key);
  if(!p) return;
  askConfirm('删除计划', '将删除「'+p.title+'」以及它的全部打卡记录，不能恢复。确认删除？', '', function(ok){
    if(!ok) return;
    deletePlanRemote(p);
    var myLogs = state.logs.filter(function(l){ return l.planTitle === p.title; });
    myLogs.forEach(function(l){ deleteLogRemote(l); });
    state.plans = state.plans.filter(function(x){ return x.key !== p.key; });
    state.logs = state.logs.filter(function(l){ return l.planTitle !== p.title; });
    saveCache();
    closeSheet('maskDetail');
    refreshAll();
    toast('已删除「'+p.title+'」');
  });
}
function sendChat(kind, content, rel){
  var txt = String(content || '').trim();
  if(!txt){ toast('先写点什么'); return; }
  var c = {
    key: 'c-local-'+Date.now(), rid: '', kind: kind || '留言', from: state.me,
    rel: rel || '', content: txt, ts: new Date().toISOString()
  };
  state.chat.push(c);
  saveCache();
  markRead();
  renderPartner();
  renderWeekChat();
  renderPhotoChat();
  addChatRemote(c);
  toast(kind === '鼓励' ? '鼓励已发出' : '留言已发出');
}

/* ================= 记心情 ================= */
/* 默认记「今天」的「我」；对方那天记了什么只读展示 —— 你替不了对方记 */
function openMoodPick(day){
  var d = day || todayStr();
  state.moodPickDate = d;
  var cur = moodOf(d, state.me);
  if($('moodPickTitle')) $('moodPickTitle').textContent = fmtMD(d) + (wdName(d) ? ' · '+wdName(d) : '');
  var grid = $('moodPickGrid');
  if(grid){
    grid.innerHTML = MOODS.map(function(m){
      return '<button class="moodBtn'+(cur === m.k ? ' on' : '')+'" data-pick="'+esc(m.k)+'" aria-label="'+esc(m.k)+'">'
        + moodFace(m.k, 40) + '<span class="lb">'+esc(m.k)+'</span></button>';
    }).join('');
  }
  var row = moodRow(d, state.me);
  if($('moodNote')) $('moodNote').value = row ? (row.note || '') : '';
  if($('moodNoteWrap')) $('moodNoteWrap').className = 'noteWrap' + ((row && row.note) ? '' : ' hide');
  var other = moodOf(d, state.partner);
  var ob = $('moodPickOther');
  if(ob){
    ob.innerHTML = other
      ? ('对方这天记的是 '+moodFace(other, 16)+' <b>'+esc(other)+'</b>')
      : ('对方这天还没记');
  }
  if($('btnMoodClear')) $('btnMoodClear').className = 'linkBtn danger' + (cur ? '' : ' hide');
  openSheet('maskMood');
}
function pickMood(k){
  var d = state.moodPickDate || todayStr();
  var note = $('moodNote') ? $('moodNote').value : '';
  var row = moodRow(d, state.me);
  if(row){
    row.mood = k; row.note = note; row.who = state.me;
  } else {
    row = { key:'m-local-'+Date.now(), rid:'', date:d, who:state.me, mood:k, note:note };
    state.moods.push(row);
  }
  saveMoodRemote(row);
  saveCache();
  closeSheet('maskMood');
  refreshAll();
  toast(fmtMD(d)+' 记下了：'+k);
}
function clearMood(){
  var d = state.moodPickDate || todayStr();
  var row = moodRow(d, state.me);
  if(!row){ toast('这天还没记'); return; }
  deleteMoodRemote(row);
  state.moods = state.moods.filter(function(m){ return m !== row; });
  saveCache();
  closeSheet('maskMood');
  refreshAll();
  toast('已清掉这天的记录');
}
function exportPack(){
  return {
    v: 2,
    exportedAt: new Date().toISOString(),
    me: state.me,
    partner: state.partner,
    plans: state.plans.map(function(p){ return { title:p.title, unit:p.unit, total:p.total, deadline:p.deadline, obstacle:p.obstacle, plan:p.plan, status:p.status, quad:p.quad, owner:p.owner, pdate:p.pdate, ptype:p.ptype, doneDate:p.doneDate }; }),
    logs: state.logs.map(function(l){ return { date:l.date, planTitle:l.planTitle, amount:l.amount, unit:l.unit, note:l.note, who:l.who }; }),
    notes: state.notes.map(function(n){ return { weekStart:n.weekStart, who:n.who, keep:n.keep, problem:n.problem, attempt:n.attempt, next:n.next }; }),
    moods: state.moods.map(function(m){ return { date:m.date, who:m.who, mood:m.mood, note:m.note }; }),
    photos: state.photos.map(function(p){ return { date:p.date, who:p.who, img:p.img, cap:p.cap, did:p.did, ate:p.ate, say:p.say, mood:p.mood, rate:p.rate, tags:p.tags, seq:p.seq }; }),
    chat: state.chat.map(function(c){ return { kind:c.kind, from:c.from, rel:c.rel, content:c.content, ts:c.ts }; })
  };
}
function doExport(){
  var text, name = '计划台备份-' + todayStr() + '.json';
  try{ text = JSON.stringify(exportPack(), null, 2); }
  catch(e){ toast('导出失败：数据无法序列化'); return; }
  try{
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ try{ document.body.removeChild(a); URL.revokeObjectURL(url); }catch(e){} }, 0);
    toast('已导出 ' + state.plans.length + ' 条计划、' + state.logs.length + ' 条打卡、' + state.moods.length + ' 条心情');
  }catch(e){
    toast('当前环境不允许直接下载，请在电脑浏览器打开本页后再导出');
  }
}
function doImport(file){
  if(!file){ return; }
  var fr = new FileReader();
  fr.onload = function(){
    var pack;
    try{ pack = JSON.parse(String(fr.result)); }
    catch(e){ toast('文件解析失败，不是有效的 JSON 备份'); return; }
    if(!pack || (!pack.plans && !pack.logs && !pack.notes && !pack.chat && !pack.moods && !pack.photos)){ toast('备份里没有可导入的数据'); return; }
    var pk = {}, lk = {}, nk = {}, ck = {}, mk = {}, phk = {};
    var n = { plans:0, logs:0, notes:0, chat:0, moods:0, photos:0 };
    state.photos.forEach(function(p){ phk[p.date + '|' + (p.who || '') + '|' + (p.seq || 0)] = 1; });
    state.plans.forEach(function(p){ pk[p.title + '|' + (p.pdate || '')] = 1; });
    state.logs.forEach(function(l){ lk[[l.planTitle, l.date, l.who].join('|')] = 1; });
    state.notes.forEach(function(n){ nk[n.weekStart + '|' + (n.who || state.me)] = 1; });
    state.chat.forEach(function(c){ ck[c.ts + '|' + c.content] = 1; });
    state.moods.forEach(function(m){ mk[m.date + '|' + m.who] = 1; });
    /* 注意：这里原来还有一行 `var n = {...}` 重复声明（且少了 photos 字段），
       后声明的会覆盖前面那个，导致下面 n.photos++ 变成 NaN，导入提示显示「照片 NaN」。 */
    var salt = String(Date.now());

    (pack.plans || []).forEach(function(p){
      if(!p || !p.title) return;
      var k = p.title + '|' + dt(p.pdate);
      if(pk[k]) return;
      pk[k] = 1; n.plans++;
      var item = {
        key: 'ip-' + salt + '-' + n.plans, rid: '',
        title: String(p.title), unit: p.unit || '', total: num(p.total),
        deadline: dt(p.deadline), obstacle: p.obstacle || '', plan: p.plan || '',
        status: p.status || '进行中',
        quad: (p.quad >= 1 && p.quad <= 4) ? p.quad : 2,
        owner: p.owner || '', pdate: dt(p.pdate),
        ptype: (p.ptype === '量化' ? '量化' : '待办'), doneDate: dt(p.doneDate)
      };
      state.plans.push(item);
      queuePush('adds', { table:'plans', properties: planProps(item), local:item.key });
    });

    (pack.logs || []).forEach(function(l){
      if(!l || !l.planTitle) return;
      var k = [l.planTitle, dt(l.date), l.who || ''].join('|');
      if(lk[k]) return;
      lk[k] = 1; n.logs++;
      var item = {
        key: 'il-' + salt + '-' + n.logs, rid: '',
        date: dt(l.date), planTitle: String(l.planTitle), amount: num(l.amount),
        unit: l.unit || '', note: l.note || '', who: l.who || ''
      };
      state.logs.push(item);
      queuePush('adds', { table:'logs', properties: logProps(item), local:item.key });
    });

    (pack.notes || []).forEach(function(m){
      if(!m || !m.weekStart) return;
      var who = m.who || state.me;
      var k = dt(m.weekStart) + '|' + who;
      if(nk[k]) return;
      nk[k] = 1; n.notes++;
      var item = {
        key: 'in-' + salt + '-' + n.notes, rid: '', weekStart: dt(m.weekStart), who: who,
        keep: m.keep || '', problem: m.problem || '', attempt: m.attempt || '', next: m.next || ''
      };
      state.notes.push(item);
      queuePush('adds', { table:'notes', properties: noteProps(item), local:item.key });
    });

    (pack.moods || []).forEach(function(mo){
      if(!mo || !mo.date || !mo.mood) return;
      var who = mo.who || state.me;
      var k = dt(mo.date) + '|' + who;
      if(mk[k]) return;
      if(!moodDef(mo.mood)) return;
      mk[k] = 1; n.moods++;
      var item = {
        key: 'im-' + salt + '-' + n.moods, rid: '', date: dt(mo.date), who: who,
        mood: mo.mood, note: mo.note || ''
      };
      state.moods.push(item);
      queuePush('adds', { table:'moods', properties: moodProps(item), local:item.key });
    });

    (pack.photos || []).forEach(function(ph){
      if(!ph || !ph.date) return;
      var who = ph.who || state.me;
      var k = dt(ph.date) + '|' + who + '|' + (num(ph.seq) || 0);
      if(phk[k]) return;
      phk[k] = 1; n.photos++;
      var item = {
        key: 'iph-' + salt + '-' + n.photos, rid: '', date: dt(ph.date), who: who,
        img: String(ph.img || ''), cap: ph.cap || '', did: ph.did || '', ate: ph.ate || '',
        say: ph.say || '', mood: (moodDef(ph.mood) ? ph.mood : ''), rate: ph.rate || '',
        tags: ph.tags || '', seq: num(ph.seq)
      };
      state.photos.push(item);
      queuePush('adds', { table:'photos', properties: photoProps(item), local:item.key });
    });

    (pack.chat || []).forEach(function(c){
      if(!c || !c.content) return;
      var k = String(c.ts || '') + '|' + String(c.content);
      if(ck[k]) return;
      ck[k] = 1; n.chat++;
      var item = {
        key: 'ic-' + salt + '-' + n.chat, rid: '',
        kind: (String(c.kind || '') === '鼓励' ? '鼓励' : '留言'),
        from: c.from || '', rel: c.rel || '', content: String(c.content), ts: c.ts || ''
      };
      state.chat.push(item);
      queuePush('adds', { table:'chat', properties: chatProps(item), local:item.key });
    });

    saveCache();
    refreshAll();
    if(n.plans + n.logs + n.notes + n.chat + n.moods + n.photos === 0){
      toast('备份内容已存在，没有新增数据');
      return;
    }
    toast('已导入：计划 ' + n.plans + '、打卡 ' + n.logs + '、心情 ' + n.moods + '、照片 ' + n.photos + '、留言 ' + n.chat);
    flushPending().then(function(){
      if(state.online && !state.localOnly) pullAll(false);
    });
  };
  fr.onerror = function(){ toast('读取文件失败'); };
  fr.readAsText(file);
}
function clearAll(){
  askConfirm('清空全部', '将删除全部计划、打卡记录、留言、心情与照片记录，不能恢复。请输入「清空」确认。', '清空', function(ok){
    if(!ok) return;
    var canRemote = !!db && state.online && !state.localOnly;
    /* 先把要删的云端 id 收集起来再清本地：顺序反了会把刚排进队列的删除任务一起清掉，
       离线清空就变成「本机清了、云端永远留着」。 */
    var delPlans = state.plans.slice(), delLogs = state.logs.slice();
    var delChat = [], delNote = [], delMood = [], delPhoto = [];
    state.chat.forEach(function(c){ if(c.rid) delChat.push(c.rid); });
    state.notes.forEach(function(n){ if(n.rid) delNote.push(n.rid); });
    state.moods.forEach(function(m){ if(m.rid) delMood.push(m.rid); });
    state.photos.forEach(function(p){ if(p.rid) delPhoto.push(p.rid); });

    state.plans = []; state.logs = []; state.chat = []; state.notes = []; state.moods = []; state.photos = [];
    try{ localStorage.removeItem(LS_CACHE); localStorage.removeItem(LS_PHOTOS); localStorage.removeItem(LS_PENDING); }catch(e){}
    state.pending = {adds:[], updates:[], deletes:[]};

    /* 计划 / 打卡：走各自的 remote 函数，内部已处理「离线改为入队」 */
    delPlans.forEach(function(p){ deletePlanRemote(p); });
    delLogs.forEach(function(l){ deleteLogRemote(l); });
    /* 留言 / 周记 / 心情 / 照片：原来这里裸调 db.deleteRecord，离线时 db 为 null 会抛
       TypeError，把后面的清空动作全部中断——本机数据还留着，云端却删了一半。 */
    delChat.forEach(function(id){ clearOneRemote('chat', id, canRemote); });
    delNote.forEach(function(id){ clearOneRemote('notes', id, canRemote); });
    delMood.forEach(function(id){ clearOneRemote('moods', id, canRemote); });
    delPhoto.forEach(function(id){ clearOneRemote('photos', id, canRemote); });

    savePending();
    refreshAll();
    toast(canRemote ? '已清空全部数据' : '本机已清空，云端记录会在联网后自动删除');
  });
}
/* 删一条云端记录；离线 / 没有 SDK / 调用本身失败时改为入队，联网后自动补删 */
function clearOneRemote(table, recordId, canRemote){
  var dbid = (table === 'chat') ? 'kGvG4piRKRISA42OlT4FaH'
    : (table === 'notes') ? 'bzewu5Qr06DhI7QY60xX5h'
    : (table === 'moods') ? 'lG9I5mBB0NPhqVZDXHsAYy'
    : 'CmBW74HIqkJZGYDbetXdHg';
  if(!canRemote){ queuePush('deletes', { table: table, recordId: recordId }); return; }
  try{
    db.deleteRecord({ databaseId: dbid, recordId: recordId }).catch(function(){
      queuePush('deletes', { table: table, recordId: recordId });
    });
  }catch(e){
    queuePush('deletes', { table: table, recordId: recordId });
  }
}
function saveMembersHandler(){
  var me = $('nameMe') ? $('nameMe').value.trim() : '';
  var pa = $('namePartner') ? $('namePartner').value.trim() : '';
  if(!me || !pa){ toast('两个名字都填一下'); return; }
  if(me === pa){ toast('两个名字不能一样'); return; }
  var oldMe = state.me, oldPa = state.partner;
  state.me = me; state.partner = pa;
  saveMembers();
  state.plans.forEach(function(p){
    if(p.owner === oldMe){ p.owner = me; updatePlanRemote(p); }
    else if(p.owner === oldPa){ p.owner = pa; updatePlanRemote(p); }
  });
  state.logs.forEach(function(l){
    if(l.who === oldMe) l.who = me;
    else if(l.who === oldPa) l.who = pa;
  });
  state.chat.forEach(function(c){
    if(c.from === oldMe) c.from = me;
    else if(c.from === oldPa) c.from = pa;
  });
  saveCache();
  refreshAll();
  toast('成员已更新');
}

/* ================= 已完成归档 ================= */
function renderArchiveMeta(){
  var n = archivePlans().length;
  if($('archCount')) $('archCount').textContent = String(n);
  if($('mineArchCount')) $('mineArchCount').textContent = String(n) + ' 条';
}
function filteredArchive(){
  var q = String(state.archQ || '').trim().toLowerCase();
  var d = state.archDate || '';
  return archivePlans().filter(function(p){
    if(d && p.doneDate !== d) return false;
    if(!q) return true;
    var hay = [p.title, p.owner, p.plan, p.obstacle, p.unit, p.doneDate].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  });
}
function openArchive(){
  if($('archQ')) $('archQ').value = state.archQ || '';
  if($('archDate')) $('archDate').value = state.archDate || '';
  renderArchive();
  openSheet('maskArchive');
}
function renderArchive(){
  var all = archivePlans(), list = filteredArchive();
  if($('archHint')) $('archHint').textContent = '共 ' + all.length + ' 条已完成，当前筛出 ' + list.length + ' 条 · 按完成时间倒序';
  var box = $('archList');
  if(!box) return;
  if(!list.length){
    box.innerHTML = '<p style="font-size:13.5px;color:var(--ink2);margin:0;padding:6px 0">还没有符合条件的已完成计划。</p>';
    return;
  }
  box.innerHTML = list.map(function(p){
    var q = QUADS[p.quad-1] || QUADS[3];
    var who = (p.owner === state.me) ? '我' : (p.owner || '—');
    return '<div class="archItem">'
      + '<span style="width:8px;height:8px;border-radius:50%;flex:none;background:'+q.color+'"></span>'
      + '<span class="am"><span class="at">'+esc(p.title)+'</span>'
      + '<span class="as">'+esc(who)+' · 完成于 '+esc(p.doneDate ? fmtMD(p.doneDate) : '—')+'</span></span>'
      + '<span class="aa">'
      + '<button data-arch="'+esc(p.key)+'" data-archact="view">查看</button>'
      + '<button data-arch="'+esc(p.key)+'" data-archact="restore">恢复</button>'
      + '<button class="del" data-arch="'+esc(p.key)+'" data-archact="del">删除</button>'
      + '</span></div>';
  }).join('');
}
function openPlanDetail(key){ openDetail(key); }
function restorePlan(key){
  var p = planByKey(key);
  if(!p) return;
  p.status = '进行中'; p.doneDate = '';
  updatePlanRemote(p); saveCache();
  renderArchive(); renderArchiveMeta(); refreshAll();
  toast('已恢复到进行中：' + p.title);
}
function askDeleteArchived(key){
  var p = planByKey(key);
  if(!p) return;
  askConfirm('删除已完成计划', '将删除「'+p.title+'」，不能恢复。请输入「删除」确认。', '删除', function(ok){
    if(!ok) return;
    state.plans = state.plans.filter(function(x){ return x.key !== key; });
    deletePlanRemote(p);
    saveCache();
    renderArchive(); renderArchiveMeta(); refreshAll();
    toast('已删除「'+p.title+'」');
  });
}

/* ================= 首次认人 ================= */
/* 新设备第一次打开：必须让用户先说清「我是谁」。
   否则会默认成「船长」，两个人的记录就混在一起了。 */
function whoCandidates(){
  var kp = knownPeople(), out = [], i;
  for(i=0;i<kp.length && out.length<3;i++) out.push(kp[i].name);
  if(out.indexOf('船长') < 0) out.push('船长');
  if(out.indexOf('伙伴') < 0) out.push('伙伴');
  return out.slice(0, 3);
}
function renderWhoList(){
  var box = $('whoList'); if(!box) return;
  box.innerHTML = whoCandidates().map(function(n){
    return '<button class="whoBtn" data-who="'+esc(n)+'">'
      + '<span class="av" style="background:'+colorOf(n)+'">'+esc(initials(n))+'</span>'
      + '<span class="tx"><span class="n">我是 '+esc(n)+'</span><span class="s">另一位自动算作对方</span></span>'
      + '</button>';
  }).join('');
}
function openWhoPicker(){
  renderWhoList();
  if($('whoForm')) $('whoForm').className = 'whoForm hide';
  if($('btnWhoToggle')) $('btnWhoToggle').textContent = '都不是，我自己填';
  openSheet('maskWho');
}
function chooseWho(me){
  var names = whoCandidates(), pa = '', i;
  for(i=0;i<names.length;i++){ if(names[i] !== me){ pa = names[i]; break; } }
  if(!pa) pa = (me === '船长' ? '伙伴' : '船长');
  state.me = me; state.partner = pa; state.needWho = false;
  saveMembers();
  closeSheet('maskWho');
  refreshAll();
  heartbeat();
  toast('好，你是「'+me+'」');
}
function whoCustomApply(){
  var me = $('whoMe') ? $('whoMe').value.trim() : '';
  var pa = $('whoPa') ? $('whoPa').value.trim() : '';
  if(!me || !pa){ toast('两个名字都填一下'); return; }
  if(me === pa){ toast('两个名字不能一样'); return; }
  state.me = me; state.partner = pa; state.needWho = false;
  saveMembers();
  closeSheet('maskWho');
  refreshAll();
  heartbeat();
  toast('好，你是「'+me+'」');
}

/* ================= 微信内打开引导 =================
   微信里访问发布链接会被平台强制切到小程序，而小程序里拿不到本页的云端同步。
   这里做一次明确提示，把人引导到手机浏览器，避免莫名其妙被"跳走"。 */
var WX_PUBLIC_URL = 'https://workbuddy.link/p/3M1oqPyAJKYDSeGpFdvw7k';
var WX_STAY_KEY = 'wb_plan_wxstay';
var A2HS_KEY = 'wb_plan_a2hs';
function isWeixin(){ return /MicroMessenger/i.test(navigator.userAgent || ''); }
function isIOS(){
  var ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua) && !/Windows/i.test(ua);
}
function isStandalone(){
  try{
    if(window.navigator && window.navigator.standalone) return true;
    if(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  }catch(e){}
  return false;
}
function needWxGuide(){
  if(!isWeixin()) return false;
  try{ return localStorage.getItem(WX_STAY_KEY) !== '1'; }catch(e){ return true; }
}
function openWxGuide(){ var m = $('maskWx'); if(m) m.classList.add('on'); }
function closeWxGuide(){
  var m = $('maskWx'); if(m) m.classList.remove('on');
  try{ document.documentElement.classList.remove('wx-pending'); }catch(e){}
}
function wxStayHere(){
  try{ localStorage.setItem(WX_STAY_KEY, '1'); }catch(e){}
  closeWxGuide();
  toast('已记住，下次不再提示');
}
function needA2hsGuide(){
  if(isWeixin()) return false;
  if(isStandalone()) return false;
  try{ return localStorage.getItem(A2HS_KEY) !== '1'; }catch(e){ return true; }
}
function openA2hsGuide(){ var m = $('maskA2hs'); if(m) m.classList.add('on'); }
function closeA2hsGuide(){ var m = $('maskA2hs'); if(m) m.classList.remove('on'); }
function a2hsRemember(){
  try{ localStorage.setItem(A2HS_KEY, '1'); }catch(e){}
  closeA2hsGuide();
  toast('已记住，下次不再提示');
}
function fillHomeSteps(){
  var ios = isIOS();
  var t1 = '用手机自带浏览器打开这个链接。微信里请先点右上角「在浏览器打开」。若一闪就进小程序，请长按链接复制，到 Safari 或 Chrome 粘贴。';
  var t2 = ios ? '点底部「分享」→「添加到主屏幕」。' : '点右上角菜单 →「添加到主屏幕」或「安装应用」。';
  var t3 = '桌面会出现图标，以后点它直接进；登录一次即可长期保持。';
  var map = {homeStep1:t1, homeStep2:t2, homeStep3:t3, a2hsStep1:t1, a2hsStep2:t2, a2hsStep3:t3};
  var id;
  for(id in map){ if($(id)) $(id).textContent = map[id]; }
}
function legacyCopy(done, text){
  try{
    var s = text || WX_PUBLIC_URL;
    var ta = document.createElement('textarea');
    ta.value = s;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    if(ta.setSelectionRange) ta.setSelectionRange(0, s.length);
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  }catch(e){ toast('复制失败，请长按上方的链接手动复制'); }
}
function copyWxLink(){
  var ok = function(){ toast('链接已复制，去浏览器里粘贴打开'); };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(WX_PUBLIC_URL).then(ok, function(){ legacyCopy(ok); });
      return;
    }
  }catch(e){}
  legacyCopy(ok);
}

/* ================= 房间（多对情侣隔离） =================
   原理：每张表的每一行都带「房间号」，查询时用服务端 filter 只拉本房间的行。
   实测（2026-10-23）确认 filter 生效，所以别的房间的数据根本不会下发到这台设备。 */
function normRoom(r){
  return String(r || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}
function loadRoom(){
  var r = '';
  try{
    var m = /[?&]room=([A-Za-z0-9]{4,16})/.exec(String((location && location.search) || ''));
    if(m) r = m[1];
  }catch(e){}
  if(!r){
    /* 平台发布页把我们的页面放进 iframe，iframe 的 src 是静态产物地址、不带顶层 query，
       所以 ?room= 通常读不到。这里再试一次顶层地址：同源时能读到，跨源会抛 SecurityError，
       被 catch 静默忽略，不影响后续走 localStorage / 手动输码。 */
    try{
      var top = window.top;
      if(top && top !== window){
        var m2 = /[?&]room=([A-Za-z0-9]{4,16})/.exec(String(top.location.search || ''));
        if(m2) r = m2[1];
      }
    }catch(e){}
  }
  if(!r){ try{ r = localStorage.getItem(LS_ROOM) || ''; }catch(e){} }
  state.room = normRoom(r);
}
function saveRoom(r){
  state.room = normRoom(r);
  try{ localStorage.setItem(LS_ROOM, state.room); }catch(e){}
}
function genRoomCode(){
  /* 去掉 I O 0 1 这些容易看错、念错的字符 */
  var cs = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var s = '';
  for(var i = 0; i < 8; i++) s += cs.charAt(Math.floor(Math.random() * cs.length));
  return s;
}
/* 发布页会在顶层套一个「前往 WorkBuddy」悬浮按钮，点它会按环境跳小程序 / 唤起 App，
   普通浏览器里看着就像"自动跳到微信小程序"。平台留了官方开关 hideWorkBuddyButton=1，
   带上后那个按钮根本不渲染，跳转入口就没了。邀请链接一律带上。 */
var NO_JUMP_PARAM = 'hideWorkBuddyButton=1';
function inviteLink(code){
  var base = WX_PUBLIC_URL;
  try{
    var here = String(location.href || '');
    /* 页面被平台放在 iframe 里时，location.href 是静态产物地址，不是用户看到的发布链接。
       只有确认当前就是发布页地址时才用它，否则退回内置的公开链接常量。 */
    if(here.indexOf('/p/') >= 0 || here.indexOf('/space/d/') >= 0){
      base = here.split('?')[0].split('#')[0];
    }
  }catch(e){}
  return base + '?room=' + code + '&' + NO_JUMP_PARAM;
}
function openRoomGate(){
  var box = $('roomInvite'); if(box) box.className = 'hide';
  var f = $('roomForm'); if(f) f.className = 'whoForm hide';
  openSheet('maskRoom');
}
function createRoom(){
  var code = genRoomCode();
  saveRoom(code);
  var box = $('roomInvite'); if(box) box.className = '';
  var link = $('roomInviteLink'); if(link) link.textContent = inviteLink(code);
  toast('房间已创建：' + code);
}
function joinRoom(){
  var inp = $('roomCode');
  var v = normRoom((inp && inp.value) || '');
  if(v.length < 4){ toast('房间码至少 4 位，再看一下'); return; }
  saveRoom(v);
  closeSheet('maskRoom');
  pullAll(true);
  if(state.needWho) openWhoPicker();
}
function closeRoomGate(){
  if(!state.room){ toast('先创建一个房间，或者输入对方给你的房间码'); return; }
  closeSheet('maskRoom');
  pullAll(true);
  if(state.needWho) openWhoPicker();
}
function copyInviteLink(){
  var url = inviteLink(state.room);
  var ok = function(){ toast('邀请链接已复制，发给对方即可'); };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(ok, function(){ legacyCopy(ok, url); });
      return;
    }
  }catch(e){}
  legacyCopy(ok, url);
}
function toggleRoomForm(){
  var f = $('roomForm'); if(!f) return;
  var open = f.className.indexOf('hide') < 0;
  f.className = open ? 'whoForm hide' : 'whoForm';
  if(!open){ var inp = $('roomCode'); if(inp) inp.focus(); }
}
function switchRoom(){
  askConfirm(
    '换一个房间？',
    '换房间后，这台设备去看新房间的内容。原来的房间码如果没记下来，就找不回去了——建议先抄下来。',
    '换房间',
    function(){
      saveRoom('');
      try{ localStorage.removeItem(LS_CACHE); }catch(e){}
      openRoomGate();
    }
  );
}

/* ================= 事件绑定 ================= */
function bind(){
  /* 弹层关闭：点遮罩空白处 + ESC 键（手机上没有 ESC，主要给桌面端和调试用） */
  var masks = document.querySelectorAll('.mask');
  for(var mi = 0; mi < masks.length; mi++){
    (function(m){
      m.addEventListener('click', function(e){
        if(e.target !== m) return;          /* 点内容区不关，只认遮罩本身 */
        if(!CLOSE_ON_BACK[m.id]) return;    /* 强制引导类不允许背景关闭 */
        m.className = 'mask';
        if(_sheetPushed && !document.querySelector('.mask.on')){
          _sheetPushed = false;
          try{ history.back(); }catch(e2){}
        }
      });
    })(masks[mi]);
  }
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape' && e.key !== 'Esc' && e.keyCode !== 27) return;
    closeTopSheet();
  });
  /* 手机返回键：拦截为「关弹层」 */
  window.addEventListener('popstate', function(){
    if(!_sheetPushed) return;
    _sheetPushed = false;
    closeTopSheet();
  });

  var btns = document.querySelectorAll('.tabbar button, .sidebar nav button');
  for(var i=0;i<btns.length;i++){
    btns[i].addEventListener('click', function(){ switchTab(this.getAttribute('data-tab')); });
  }
  if($('quadFilter')) $('quadFilter').addEventListener('click', function(e){
    var b = e.target.closest('[data-quad]');
    if(!b) return;
    state.quad = Number(b.getAttribute('data-quad'));
    renderFilters(); renderList();
  });
  if($('planList')) $('planList').addEventListener('click', function(e){
    var t = e.target.closest('[data-act]');
    if(!t) return;
    var act = t.getAttribute('data-act'), key = t.getAttribute('data-key');
    if(act === 'toggle') toggleDone(key);
    else if(act === 'detail') openDetail(key);
    else if(act === 'checkin') openCheckin(key);
  });
  if($('todayList')) $('todayList').addEventListener('click', function(e){
    var t = e.target.closest('[data-act]');
    if(!t) return;
    var act = t.getAttribute('data-act'), key = t.getAttribute('data-key');
    if(act === 'checkin') openCheckin(key);
    else if(act === 'detail') openDetail(key);
  });
  if($('detailBody')) $('detailBody').addEventListener('click', function(e){
    var t = e.target.closest('[data-act]');
    if(!t) return;
    var act = t.getAttribute('data-act'), key = t.getAttribute('data-key');
    if(act === 'checkin'){ closeSheet('maskDetail'); openCheckin(key); }
    else if(act === 'toggle'){ toggleDone(key); openDetail(key); }
    else if(act === 'edit') openEditFrom(key);
    else if(act === 'delplan') removePlan(key);
    else if(act === 'dellog'){
      var lg = null;
      for(var j=0;j<state.logs.length;j++){ if(state.logs[j].key === key) lg = state.logs[j]; }
      if(!lg) return;
      var dk = state.detailKey;
      deleteLogRemote(lg);
      state.logs = state.logs.filter(function(x){ return x.key !== key; });
      saveCache(); openDetail(dk);
      toast('已删除该条记录');
    }
  });
  if($('partnerPlans')) $('partnerPlans').addEventListener('click', function(e){
    var t = e.target.closest('[data-act="cheer"]');
    if(!t) return;
    sendChat('鼓励', '给你加油：'+t.getAttribute('data-title'), t.getAttribute('data-title'));
  });
  if($('cheerRow')) $('cheerRow').addEventListener('click', function(e){
    var t = e.target.closest('[data-act="quicksend"]');
    if(!t) return;
    sendChat('留言', t.getAttribute('data-text'), '');
  });
  if($('btnSendChat')) $('btnSendChat').addEventListener('click', function(){
    var el = $('chatInput');
    if(!el) return;
    sendChat('留言', el.value, '');
    el.value = '';
  });
  if($('chatInput')) $('chatInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); if($('btnSendChat')) $('btnSendChat').click(); }
  });

  if($('btnNewTop')) $('btnNewTop').addEventListener('click', function(){ openCompose('new', null); });
  if($('btnNewBottom')) $('btnNewBottom').addEventListener('click', function(){ openCompose('new', null); });
  if($('btnGoMine')) $('btnGoMine').addEventListener('click', function(){ switchTab('mine'); });
  if($('btnComposeClose')) $('btnComposeClose').addEventListener('click', function(){ closeSheet('maskCompose'); });
  if($('btnSend')) $('btnSend').addEventListener('click', submitCompose);
  if($('fTitle')) $('fTitle').addEventListener('input', updateParsed);
  if($('btnToolTime')) $('btnToolTime').addEventListener('click', function(){
    var d = $('fDate');
    if(!d) return;
    d.className = '';
    if(d.showPicker){ try{ d.showPicker(); }catch(e){} } else { d.focus(); }
  });
  if($('fDate')) $('fDate').addEventListener('change', function(){
    state.pickedDate = this.value || '';
    this.className = 'hide';
    updateParsed();
  });
  if($('btnToolQuad')) $('btnToolQuad').addEventListener('click', function(){
    var el = $('quadPick');
    if(el) el.className = (el.className.indexOf('hide') >= 0) ? 'quadPick' : 'quadPick hide';
  });
  if($('quadPick')) $('quadPick').addEventListener('click', function(e){
    var b = e.target.closest('[data-q]');
    if(!b) return;
    state.pickedQuad = Number(b.getAttribute('data-q'));
    renderQuadPick();
  });
  if($('btnToolQuant')) $('btnToolQuant').addEventListener('click', function(){
    state.quant = !state.quant;
    this.className = 'tool quant' + (state.quant ? ' on' : '');
    if($('quantBox')) $('quantBox').className = state.quant ? '' : 'hide';
  });
  if($('btnToolPlan')) $('btnToolPlan').addEventListener('click', function(){
    var el = $('planBox');
    if(!el) return;
    var shown = el.className.indexOf('hide') < 0;
    el.className = shown ? 'hide' : '';
    this.className = 'tool plan' + (shown ? '' : ' on');
  });
  if($('btnToolMore')) $('btnToolMore').addEventListener('click', function(){
    var el = $('quantBox');
    state.quant = true;
    if($('btnToolQuant')) $('btnToolQuant').className = 'tool quant on';
    if(el) el.className = (el.className.indexOf('hide') >= 0) ? '' : 'hide';
    this.className = 'tool more' + (el && el.className.indexOf('hide') < 0 ? ' on' : '');
  });

  if($('btnDetailClose')) $('btnDetailClose').addEventListener('click', function(){ closeSheet('maskDetail'); });
  if($('btnCheckinClose')) $('btnCheckinClose').addEventListener('click', function(){ closeSheet('maskCheckin'); });
  if($('btnMoodClose')) $('btnMoodClose').addEventListener('click', function(){ closeSheet('maskMood'); });
  if($('btnDoCheckin')) $('btnDoCheckin').addEventListener('click', doCheckin);
  if($('dateChips')) $('dateChips').addEventListener('click', function(e){
    var b = e.target.closest('[data-day]');
    if(!b) return;
    state.checkinDate = b.getAttribute('data-day');
    renderDateChips();
  });

  if($('btnAskCancel')) $('btnAskCancel').addEventListener('click', function(){ closeSheet('maskAsk'); state.askFn = null; });
  if($('btnAskOk')) $('btnAskOk').addEventListener('click', function(){
    var a = state.askFn;
    var v = $('askInput') ? $('askInput').value.trim() : '';
    if(!a) { closeSheet('maskAsk'); return; }
    if(a.need && v !== a.need){ toast('请输入「'+a.need+'」以确认'); return; }
    closeSheet('maskAsk');
    state.askFn = null;
    a.fn(true);
  });

  if($('btnPhotoPrev')) $('btnPhotoPrev').addEventListener('click', function(){ shiftPhotoDay(-1); });
  if($('btnPhotoNext')) $('btnPhotoNext').addEventListener('click', function(){ shiftPhotoDay(1); });
  if($('btnPhotoToday')) $('btnPhotoToday').addEventListener('click', function(){
    state.photoDate = todayStr(); state.moodCursor = todayStr(); renderPhoto();
  });
  if($('btnRefreshPhoto')) $('btnRefreshPhoto').addEventListener('click', function(){ toast('正在重新同步…'); pullAll(true); });
  if($('btnAddPhoto')) $('btnAddPhoto').addEventListener('click', function(){
    var f = $('photoFile'); if(f) f.click();
  });
  if($('photoFile')) $('photoFile').addEventListener('change', onPhotoPicked);
  if($('photoGrid')) $('photoGrid').addEventListener('click', function(e){
    var d = e.target.closest('[data-pdel]');
    if(d){ deletePhoto(d.getAttribute('data-pdel')); return; }
  });
  if($('btnPhotoChatSend')) $('btnPhotoChatSend').addEventListener('click', sendPhotoChat);
  if($('photoChatInput')) $('photoChatInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); sendPhotoChat(); }
  });
  if($('phMoodRow')) $('phMoodRow').addEventListener('click', function(e){
    var b = e.target.closest('[data-pmood]');
    if(b) setDayMood(b.getAttribute('data-pmood'));
  });
  if($('phRateRow')) $('phRateRow').addEventListener('click', function(e){
    var b = e.target.closest('[data-prate]');
    if(b) onDayField('rate', b.getAttribute('data-prate'));
  });
  if($('phTagRow')) $('phTagRow').addEventListener('click', function(e){
    var b = e.target.closest('[data-ptag]');
    if(b) toggleDayTag(b.getAttribute('data-ptag'));
  });
  if($('phPast')) $('phPast').addEventListener('click', function(e){
    var r = e.target.closest('[data-pday]');
    if(!r) return;
    state.photoDate = r.getAttribute('data-pday');
    state.moodCursor = state.photoDate;
    renderPhoto();
  });
  if($('moodPrev')) $('moodPrev').addEventListener('click', function(){ shiftMood(-1); });
  if($('moodNext')) $('moodNext').addEventListener('click', function(){ shiftMood(1); });
  if($('moodSeg')) $('moodSeg').addEventListener('click', function(e){
    var b = e.target.closest('[data-view]');
    if(!b) return;
    state.moodView = b.getAttribute('data-view');
    renderMood();
  });
  if($('moodCal')) $('moodCal').addEventListener('click', function(e){
    var c = e.target.closest('[data-mday]');
    if(!c) return;
    state.photoDate = c.getAttribute('data-mday');   /* 点日历＝切到那一天的记录 */
    state.moodCursor = state.photoDate;
    renderPhoto();
  });
  if($('moodPickGrid')) $('moodPickGrid').addEventListener('click', function(e){
    var b = e.target.closest('[data-pick]');
    if(!b) return;
    pickMood(b.getAttribute('data-pick'));
  });
  if($('btnMoodClear')) $('btnMoodClear').addEventListener('click', clearMood);
  if($('btnMoodNoteSave')) $('btnMoodNoteSave').addEventListener('click', function(){
    var row = moodRow(state.moodPickDate || todayStr(), state.me);
    if(!row){ toast('先选一个心情再写备注'); return; }
    row.note = $('moodNote') ? $('moodNote').value : '';
    saveMoodRemote(row);
    saveCache();
    closeSheet('maskMood');
    renderMood();
    toast('备注已保存');
  });
  if($('btnMoodQuickOpen')) $('btnMoodQuickOpen').addEventListener('click', function(){ openMoodPick(todayStr()); });
  if($('moodQuick')) $('moodQuick').addEventListener('click', function(){ openMoodPick(todayStr()); });
  if($('btnMoodNoteToggle')) $('btnMoodNoteToggle').addEventListener('click', function(){
    var w = $('moodNoteWrap');
    if(!w) return;
    var open = w.className.indexOf('hide') >= 0;
    w.className = 'noteWrap' + (open ? '' : ' hide');
    if(open && $('moodNote')) $('moodNote').focus();
  });
  /* 归档：完成的计划统一在这里查看 / 恢复 / 删除 */
  if($('btnArchiveOpen')) $('btnArchiveOpen').addEventListener('click', openArchive);
  if($('btnArchiveOpen2')) $('btnArchiveOpen2').addEventListener('click', openArchive);
  if($('btnArchiveClose')) $('btnArchiveClose').addEventListener('click', function(){ closeSheet('maskArchive'); });
  if($('archQ')) $('archQ').addEventListener('input', function(){ state.archQ = this.value; renderArchive(); });
  if($('archDate')) $('archDate').addEventListener('change', function(){ state.archDate = this.value; renderArchive(); });
  if($('btnArchClear')) $('btnArchClear').addEventListener('click', function(){
    state.archQ = ''; state.archDate = '';
    if($('archQ')) $('archQ').value = '';
    if($('archDate')) $('archDate').value = '';
    renderArchive();
  });
  if($('archList')) $('archList').addEventListener('click', function(e){
    var b = e.target.closest('[data-arch]');
    if(!b) return;
    var key = b.getAttribute('data-arch'), act = b.getAttribute('data-archact');
    if(act === 'view') openPlanDetail(key);
    else if(act === 'restore') restorePlan(key);
    else if(act === 'del') askDeleteArchived(key);
  });

  if($('btnResync')) $('btnResync').addEventListener('click', function(){
    toast('正在重新同步…');
    pullAll(true);
  });
  if($('btnFlushPending')) $('btnFlushPending').addEventListener('click', function(){ flushPending(); });
  if($('btnRetry')) $('btnRetry').addEventListener('click', function(){ pullAll(true); });
  ['btnRefreshTop','btnRefreshP','btnRefreshW'].forEach(function(id){
    if($(id)) $(id).addEventListener('click', function(){ toast('正在重新同步…'); pullAll(true); });
  });
  if($('btnSaveMembers')) $('btnSaveMembers').addEventListener('click', saveMembersHandler);
  if($('btnRewho')) $('btnRewho').addEventListener('click', function(){ openWhoPicker(); });
  if($('btnWxCopy')) $('btnWxCopy').addEventListener('click', copyWxLink);
  if($('btnHomeCopy')) $('btnHomeCopy').addEventListener('click', copyWxLink);
  if($('btnWxStay')) $('btnWxStay').addEventListener('click', wxStayHere);
  if($('btnA2hsOk')) $('btnA2hsOk').addEventListener('click', a2hsRemember);
  if($('btnA2hsLater')) $('btnA2hsLater').addEventListener('click', closeA2hsGuide);
  if($('whoList')) $('whoList').addEventListener('click', function(e){
    var b = e.target.closest('[data-who]');
    if(!b) return;
    chooseWho(b.getAttribute('data-who'));
  });
  if($('btnRoomCreate')) $('btnRoomCreate').addEventListener('click', createRoom);
  if($('btnRoomToggle')) $('btnRoomToggle').addEventListener('click', toggleRoomForm);
  if($('btnRoomJoin')) $('btnRoomJoin').addEventListener('click', joinRoom);
  if($('btnRoomOk')) $('btnRoomOk').addEventListener('click', closeRoomGate);
  if($('btnRoomCopy')) $('btnRoomCopy').addEventListener('click', copyInviteLink);
  if($('btnRoomCopy2')) $('btnRoomCopy2').addEventListener('click', copyInviteLink);
  if($('btnRoomSwitch')) $('btnRoomSwitch').addEventListener('click', switchRoom);
  if($('btnWhoToggle')) $('btnWhoToggle').addEventListener('click', function(){
    var f = $('whoForm'); if(!f) return;
    var open = f.className.indexOf('hide') < 0;
    f.className = 'whoForm' + (open ? ' hide' : '');
    this.textContent = open ? '都不是，我自己填' : '收起';
    if(!open && $('whoMe')){
      if(!$('whoMe').value) $('whoMe').value = '';
      if($('whoPa') && !$('whoPa').value) $('whoPa').value = '';
    }
  });
  if($('btnWhoCustom')) $('btnWhoCustom').addEventListener('click', whoCustomApply);
  if($('btnExport')) $('btnExport').addEventListener('click', doExport);
  if($('btnImport')) $('btnImport').addEventListener('click', function(){ if($('fileImport')) $('fileImport').click(); });
  if($('fileImport')) $('fileImport').addEventListener('change', function(e){
    var f = e.target.files && e.target.files[0];
    doImport(f);
    e.target.value = '';
  });
  if($('btnClearAll')) $('btnClearAll').addEventListener('click', clearAll);

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible'){ heartbeat(); pullAll(false); }
    else heartbeat();
  });
  window.addEventListener('pagehide', function(){ heartbeat(); });
  /* 网络恢复的瞬间自动重连：先补发离线期间暂存的操作，再拉云端最新 */
  window.addEventListener('online', function(){
    state.localOnly = false;
    setSync('busy');
    toast('网络已恢复，正在同步…');
    flushPending().then(function(){ return pullAll(false); });
  });
  window.addEventListener('offline', function(){
    state.lastError = '网络断开，进入离线模式';
    setSync('off');
    showBanner('网络断开，数据暂存本机，恢复后自动同步', true);
  });
}

/* ================= 启动 ================= */
/* ================= 演示模式 =================
   触发条件：显式 ?demo=1 ；或「拿不到平台数据库 SDK 且本机没有任何缓存」。
   目的：本地双击打开 / 被微信切到小程序壳 / 评委直接开文件时，首屏不是空白。
   边界：只写内存，绝不写 localStorage、不进待同步队列，真实数据不受影响。 */
function enableDemo(){
  if(state.demo) return;
  state.demo = true;
  state.online = false;
  state.localOnly = true;
  state.needWho = false;      /* 演示不需要先认人 */
  state.lastError = '';
  var T = todayStr();
  function D(n){ var d = parseDay(T); d.setDate(d.getDate() + n); return ymd(d); }
  var me = state.me, pa = state.partner;

  state.plans = [
    { key:'dm1', rid:'', title:'交这周的周报', unit:'', total:0, deadline:D(-2), obstacle:'', plan:'', status:'进行中', quad:3, owner:me, pdate:D(-2), ptype:'待办', doneDate:'' },
    { key:'dm2', rid:'', title:'下午三点 组会', unit:'', total:0, deadline:D(0), obstacle:'', plan:'', status:'进行中', quad:1, owner:me, pdate:D(0), ptype:'待办', doneDate:'' },
    { key:'dm3', rid:'', title:'背英语单词', unit:'个', total:2000, deadline:D(14), obstacle:'晚上容易困', plan:'每天 80 个，早上做完', status:'进行中', quad:2, owner:pa, pdate:D(0), ptype:'量化', doneDate:'' },
    { key:'dm4', rid:'', title:'读完《人类简史》', unit:'页', total:440, deadline:D(20), obstacle:'', plan:'', status:'进行中', quad:2, owner:pa, pdate:D(3), ptype:'量化', doneDate:'' },
    { key:'dm5', rid:'', title:'整理书桌', unit:'', total:0, deadline:'', obstacle:'', plan:'', status:'进行中', quad:4, owner:me, pdate:D(1), ptype:'待办', doneDate:'' },
    { key:'dm6', rid:'', title:'修耳机', unit:'', total:0, deadline:D(-1), obstacle:'', plan:'', status:'已完成', quad:4, owner:me, pdate:D(-1), ptype:'待办', doneDate:D(-1) }
  ];
  state.logs = [
    { key:'dl1', rid:'', date:D(0), planTitle:'背英语单词', amount:60, unit:'个', note:'', who:pa },
    { key:'dl2', rid:'', date:D(-1), planTitle:'背英语单词', amount:50, unit:'个', note:'', who:pa },
    { key:'dl3', rid:'', date:D(0), planTitle:'读完《人类简史》', amount:30, unit:'页', note:'', who:pa }
  ];
  state.chat = [
    { key:'dc1', rid:'', kind:'留言', from:pa, rel:'photo:' + D(0), content:'今天的晚霞好看', ts:new Date(Date.now() - 30 * 60000).toISOString() },
    { key:'dc2', rid:'', kind:'鼓励', from:pa, rel:'背英语单词', content:'加油，我在看着', ts:new Date(Date.now() - 90 * 60000).toISOString() }
  ];
  state.moods = [
    { key:'dmo1', rid:'', date:D(0), who:me, mood:'平静', note:'' },
    { key:'dmo2', rid:'', date:D(0), who:pa, mood:'开心', note:'今天效率不错' },
    { key:'dmo3', rid:'', date:D(-1), who:me, mood:'疲惫', note:'' },
    { key:'dmo4', rid:'', date:D(-1), who:pa, mood:'超开心', note:'' },
    { key:'dmo5', rid:'', date:D(-2), who:pa, mood:'疲惫', note:'' }
  ];
  state.photos = [
    { key:'dph1', rid:'', date:D(0), who:pa, img:'', cap:'', did:'自习了一下午，背完 60 个单词', ate:'食堂的番茄牛腩', say:'今天状态还行', mood:'开心', rate:'4 不错', tags:'在学习', seq:0 },
    { key:'dph2', rid:'', date:D(0), who:me, img:'', cap:'', did:'开了一天会', ate:'外卖', say:'有点累', mood:'疲惫', rate:'3 一般', tags:'在忙', seq:0 }
  ];
  state.notes = [
    { key:'dn1', rid:'', weekStart:D(-4), who:me, keep:'早睡', problem:'睡前刷手机太久', attempt:'把手机放到客厅', next:'继续保持' }
  ];
  state.presence = [{ key:'do1', rid:'', member:pa, at:new Date(Date.now() - 5 * 60000).toISOString() }];
}

function boot(){
  loadMembers();
  loadRoom();        /* 房间号必须早于任何云端读写：没有它，一条数据都不该拉 */
  loadPending();
  loadCache();
  var demoForced = /[?&]demo=1/.test(String((location && location.search) || ''));
  /* 没有 SDK 且本机完全没有数据 → 视为演示环境，兜一份示例数据，别让首屏空白 */
  if(demoForced || (!state.online && state.plans.length === 0 && state.chat.length === 0 && state.moods.length === 0)){
    enableDemo();
  }
  if(!state.photoDate) state.photoDate = todayStr();
  if(!state.moodCursor) state.moodCursor = todayStr();
  bind();
  render();
  setSync(state.online ? 'busy' : 'off');
  subscribe();
  heartbeat();
  pullAll(false);
  fillHomeSteps();
  if(state.demo){
    /* 演示环境：不弹微信/加主屏/认人引导，别挡住首屏；用横幅说明这是示例数据 */
    showBanner('演示模式 · 示例数据不会上传；真实双人同步请用在线链接打开', false);
    setSync('off');
  } else {
    if(needWxGuide()) openWxGuide();   /* 微信里会被切到小程序，先提示去浏览器打开 */
    else if(needA2hsGuide()) openA2hsGuide();
    /* 先有房间，再认人：没房间时不拉任何云端数据，避免拉到别人的 */
    if(!state.room) openRoomGate();
    else if(state.needWho) openWhoPicker();   /* 新设备先认人，避免默认成同一个人 */
  }
  setInterval(heartbeat, 75000);
  setInterval(function(){
    if(state.tab === 'partner') renderPartner();
    if(state.tab === 'mine') setSync(state.lastError ? 'off' : 'ok');
  }, 45000);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

/* ===== 冒烟测试钩子：仅在 ?test=1 时暴露，正常使用完全不生效 ===== */
try{
  if(window.__WB_TEST__ || /[?&]test=1/.test(String((location && location.search) || ''))){
    window.__state = state;
    window.addPhotoForTest = function(){
      var d = todayStr();
      var base = dayPhotos(d, state.me).length;
      var p = { key:'ph-local-t-'+Date.now(), rid:'', date:d, who:state.me,
                img:'data:image/jpeg;base64,TEST'+Date.now(), cap:'测试', did:'', ate:'',
                say:'', mood:'', rate:'', tags:'', seq: base + 1 };
      state.photos.push(p);
      savePhotoRemote(p);
      saveCache();
      renderPhoto();
      return true;
    };
    window.clearAllForTest = function(){
      var orig = askConfirm;
      askConfirm = function(t, m, need, cb){ cb(true); };
      try{ clearAll(); } finally { askConfirm = orig; }
    };
  }
}catch(e){}

})();
</script>
</body>
</html>
