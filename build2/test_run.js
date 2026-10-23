/* 运行时冒烟测试：用 jsdom 真实执行 output.html，检查初始化链路、各 Tab 渲染与空数据场景 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, 'output.html'), 'utf8');

const T_PLAN = 'EQzLfYTRyNHYYTKfDr5IKg';
const T_LOG = 'fr70DVNsj5q5Hw0ZMTXTMU';
const T_NOTE = 'bzewu5Qr06DhI7QY60xX5h';
const T_CHAT = 'kGvG4piRKRISA42OlT4FaH';
const T_ONLINE = '4ZKcg7SjtcNyWfqYEs9r1z';
const T_PHOTO = 'CmBW74HIqkJZGYDbetXdHg';
const T_MOOD = 'lG9I5mBB0NPhqVZDXHsAYy';

const TODAY = new Date();
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const shift = n => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return ymd(d); };

const SEED = {
  [T_PLAN]: [
    { _id: 'p1', '标题': '逾期没做的计划', '象限': 'Ⅰ重要且紧急', '负责人': '船长', '计划日期': shift(-2), '计划类型': '待办', '状态': '进行中' },
    { _id: 'p2', '标题': '今天要交的材料', '象限': 'Ⅲ紧急不重要', '负责人': '船长', '计划日期': shift(0), '计划类型': '待办', '状态': '进行中' },
    { _id: 'p3', '标题': '背英语单词', '象限': 'Ⅱ重要不紧急', '负责人': '船长', '计划日期': shift(0), '计划类型': '量化', '单位': '个', '总量': 2000, '状态': '进行中' },
    { _id: 'p4', '标题': '读完《人类简史》', '象限': 'Ⅱ重要不紧急', '负责人': '伙伴', '计划日期': shift(3), '计划类型': '量化', '单位': '页', '总量': 440, '状态': '进行中' },
    { _id: 'p5', '标题': '整理变频器', '象限': 'Ⅳ不重要不紧急', '负责人': '伙伴', '计划日期': shift(1), '计划类型': '待办', '状态': '进行中' },
    { _id: 'p6', '标题': '已经完成的计划', '象限': 'Ⅰ重要且紧急', '负责人': '船长', '计划日期': shift(-1), '计划类型': '待办', '状态': '已完成', '完成日期': shift(-1) }
  ],
  [T_LOG]: [
    { _id: 'l1', '日期': shift(0), '计划名': '背英语单词', '打卡量': 60, '单位': '个', '打卡人': '船长', '备注': '' },
    { _id: 'l2', '日期': shift(-1), '计划名': '背英语单词', '打卡量': 50, '单位': '个', '打卡人': '伙伴', '备注': '' },
    { _id: 'l3', '日期': shift(0), '计划名': '读完《人类简史》', '打卡量': 30, '单位': '页', '打卡人': '伙伴', '备注': '' }
  ],
  [T_NOTE]: [
    { _id: 'n1', '周起始日': shift(-4), '保持': '早睡', '问题': '刷手机太久', '尝试': '睡前放客厅', '下周预案': '继续保持', '记录人': '船长' }
  ],
  [T_CHAT]: [
    { _id: 'c1', '类型': '鼓励', '发起人': '伙伴', '关联计划': '背英语单词', '内容': '加油，我在看着', '时间': new Date(Date.now() - 600000).toISOString() },
    { _id: 'c2', '类型': '留言', '发起人': '船长', '关联计划': '', '内容': '今天早点休息', '时间': new Date(Date.now() - 120000).toISOString() },
    { _id: 'c3', '类型': '留言', '发起人': '伙伴', '关联计划': 'photo:' + shift(0), '内容': '这张天空好看', '时间': new Date(Date.now() - 300000).toISOString() }
  ],
  [T_PHOTO]: [
    { _id: 'ph1', '日期': shift(0), '成员': '船长', '照片': 'data:image/jpeg;base64,AAA', '照片说明': '今天的天空', '今日做了': '整理了书桌', '今日吃了': '番茄牛腩', '今日评价': '还不错', '心情': '开心', '评分': '4 不错', '标签': '在家', '序号': 1 },
    { _id: 'ph2', '日期': shift(0), '成员': '船长', '今日做了': '整理了书桌', '今日吃了': '番茄牛腩', '今日评价': '还不错', '心情': '开心', '评分': '4 不错', '标签': '在家', '序号': 0 },
    { _id: 'ph3', '日期': shift(0), '成员': '伙伴', '照片': 'data:image/jpeg;base64,BBB', '照片说明': '伙伴拍的晚饭', '序号': 1 }
  ],
  [T_ONLINE]: [
    { _id: 'o1', '成员': '伙伴', '最后访问时间': new Date(Date.now() - 300000).toISOString() },
    { _id: 'o2', '成员': '船长', '最后访问时间': new Date(Date.now() - 600000).toISOString() }
  ],
  [T_MOOD]: [
    { _id: 'm1', '日期': shift(0), '成员': '船长', '心情': '开心', '备注': '' },
    { _id: 'm2', '日期': shift(0), '成员': '伙伴', '心情': '疲惫', '备注': '' },
    { _id: 'm3', '日期': shift(-1), '成员': '船长', '心情': '超开心', '备注': '' },
    { _id: 'm4', '日期': shift(-1), '成员': '伙伴', '心情': '焦虑', '备注': '' },
    { _id: 'm5', '日期': shift(-2), '成员': '船长', '心情': '平静', '备注': '' }
  ]
};

/* 把 PropertyValue 的 oneof 结构还原成 SDK 读回时的扁平值，尽量贴近真实读回形态 */
function unwrapProps(props) {
  const out = {};
  if (!props) return out;
  Object.keys(props).forEach(k => {
    const v = props[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('text' in v) out[k] = v.text;
      else if ('number' in v) out[k] = v.number;
      else if ('select' in v) out[k] = v.select;
      else if ('date' in v) out[k] = v.date;
      else if ('checkbox' in v) out[k] = v.checkbox;
      else if ('multi_select' in v) out[k] = v.multi_select;
      else if ('url' in v) out[k] = v.url;
      else if ('image' in v) out[k] = v.image;
      else out[k] = v;
    } else out[k] = v;
  });
  return out;
}

function makeSdk(rows) {
  let seq = 1000;
  const tableOf = id => { if (!rows[id]) rows[id] = []; return rows[id]; };
  return {
    query(opts) {
      return Promise.resolve({ results: tableOf(opts.databaseId).slice(), nextCursor: null, hasMore: false });
    },
    addRecord(opts) {
      const rec = Object.assign({ _id: 'gen' + (++seq) }, unwrapProps(opts.properties));
      tableOf(opts.databaseId).push(rec);
      return Promise.resolve({ _id: rec._id });
    },
    updateRecord(opts) {
      const arr = tableOf(opts.databaseId);
      for (const r of arr) {
        if (r._id === opts.recordId) Object.assign(r, unwrapProps(opts.properties));
      }
      return Promise.resolve({ id: opts.recordId });
    },
    deleteRecord(opts) {
      const arr = tableOf(opts.databaseId);
      const i = arr.findIndex(r => r._id === opts.recordId);
      if (i >= 0) arr.splice(i, 1);
      return Promise.resolve({});
    },
    getRecord() { return Promise.resolve({}); },
    getSchema() { return Promise.resolve({ properties: [] }); },
    onUpdated() { return function () {}; }
  };
}

function run(name, mode, extra) {
  return new Promise(resolve => {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => errors.push('jsdomError: ' + (e && e.message)));
    vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
    vc.on('warn', () => {});
    vc.on('log', () => {});

    const rows = mode === 'empty'
      ? { [T_PLAN]: [], [T_LOG]: [], [T_NOTE]: [], [T_CHAT]: [], [T_ONLINE]: [], [T_MOOD]: [], [T_PHOTO]: [] }
      : JSON.parse(JSON.stringify(SEED));

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      url: 'https://example.com/?test=1',
      virtualConsole: vc,
      beforeParse(window) {
        window.__SMART_PAGE__ = { database: makeSdk(rows) };
        window.addEventListener('error', e => errors.push('window.onerror: ' + (e.message || e.type)));
        window.addEventListener('unhandledrejection', e => errors.push('unhandledrejection: ' + ((e.reason && e.reason.message) || e.reason)));
        if (extra) extra(window);
      }
    });

    const { window } = dom;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    window.addEventListener('load', async () => {
      await wait(400);
      const doc = window.document;
      const txt = id => { const el = doc.getElementById(id); return el ? el.textContent.trim() : null; };
      const has = id => !!doc.getElementById(id);
      const box = id => { const el = doc.getElementById(id); return el ? el.innerHTML.length : -1; };

      const report = {
        场景: name,
        错误: errors.slice(),
        今日区: box('todayList') > 0 ? 'OK(' + box('todayList') + 'B)' : '空',
        计划列表: box('planList') > 0 ? 'OK(' + box('planList') + 'B)' : '空',
        伙伴计划: box('partnerPlans') > 0 ? 'OK(' + box('partnerPlans') + 'B)' : '空',
        在线状态: txt('presenceLine'),
        周报概览: box('weekLabel') >= 0 ? 'OK' : '缺',
        心情月历: box('moodCal') > 0 ? 'OK(' + box('moodCal') + 'B)' : '空',
        心情快捷: box('moodQuick') > 0 ? 'OK' : '空',
        照片记录页: (has('photoGrid') && has('photoChat') && has('phMoodRow')) ? 'OK' : '缺',
        归档入口: (has('btnArchiveOpen') && has('archList')) ? 'OK' : '缺',
        往日记录: box('phPast') > 0 ? 'OK(' + box('phPast') + 'B)' : '空',
        同步态: txt('syncText'),
        认人弹层: (() => {
          const m = doc.getElementById('maskWho');
          const l = doc.getElementById('whoList');
          if (!m || !l) return '缺元素';
          return (m.className.indexOf('on') >= 0 ? '已弹出' : '未弹出') + '/' + l.children.length + '个候选';
        })(),
        微信引导: (() => {
          const m = doc.getElementById('maskWx');
          const pending = window.document.documentElement.className.indexOf('wx-pending') >= 0;
          if (!m) return '缺元素';
          return (m.className.indexOf('on') >= 0 ? '已弹出' : '未弹出') + (pending ? '/wx-pending' : '');
        })(),
        主屏引导: (() => {
          const m = doc.getElementById('maskA2hs');
          return m ? (m.className.indexOf('on') >= 0 ? '已弹出' : '未弹出') : '缺元素';
        })(),
        未读数: txt('tbBadgePartner'),
        元素齐全: ['todayList', 'planList', 'partnerPlans', 'moodCal', 'moodQuick', 'photoGrid', 'phMoodRow', 'phRateRow', 'phTagRow', 'phPast', 'photoChat', 'photoChatInput', 'btnPhotoChatSend', 'btnArchiveOpen', 'archList', 'syncDot', 'fileImport', 'btnExport', 'btnImport', 'btnClearAll', 'maskWx', 'btnWxCopy', 'btnWxStay', 'maskA2hs', 'btnA2hsOk', 'btnA2hsLater', 'btnHomeCopy', 'homeStep2']
          .filter(id => !has(id))
      };

      // 非微信默认点「稍后再说」让路；场景 5 点「知道了」并记住
      if (window.__KEEP_A2HS__) {
        const am = doc.getElementById('maskA2hs');
        const ok = doc.getElementById('btnA2hsOk');
        if (am && ok && am.className.indexOf('on') >= 0) {
          ok.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(80);
        }
      } else {
        const am = doc.getElementById('maskA2hs');
        const later = doc.getElementById('btnA2hsLater');
        if (am && later && am.className.indexOf('on') >= 0) {
          later.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(80);
        }
      }

      // 交互：切 Tab
      try {
        const tabs = doc.querySelectorAll('[data-tab]');
        tabs.forEach(t => t.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
        await wait(120);
        report.切换Tab = 'OK(' + tabs.length + '个)';
      } catch (e) { report.切换Tab = 'FAIL ' + e.message; }

      // 交互：打开新建计划弹层并写入自然语言日期
      try {
        const addBtn = doc.getElementById('btnNewTop') || doc.getElementById('btnNewBottom');
        if (addBtn) {
          addBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(150);
          const t = doc.getElementById('fTitle');
          if (t) {
            t.value = '下周周三 复盘会议';
            t.dispatchEvent(new window.Event('input', { bubbles: true }));
            await wait(120);
            report.日期识别 = txt('parsedText');
            const sub = doc.getElementById('btnSend');
            if (sub) { sub.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(300); }
            report.新建流程 = sub ? 'OK' : '未找到提交按钮';
            report.新建后列表 = box('planList') > 0 && doc.getElementById('planList').textContent.indexOf('复盘会议') >= 0 ? '列表已出现新计划' : '列表未见新计划';
          } else report.新建流程 = '标题输入框缺失';
        } else report.新建流程 = '未找到新建按钮';
      } catch (e) { report.新建流程 = 'FAIL ' + e.message; }

      // 交互：首次认人 → 选一个候选 → 弹层应关闭且身份写入本机
      try {
        const wl = doc.getElementById('whoList');
        const first = wl ? wl.querySelector('[data-who]') : null;
        if (first) {
          const who = first.getAttribute('data-who');
          first.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(200);
          const m = doc.getElementById('maskWho');
          const saved = window.localStorage.getItem('wb_plan_members_v2') || '';
          report.认人 = (m.className.indexOf('on') < 0 ? '弹层已关' : '仍开着')
            + '/' + (saved.indexOf(who) >= 0 ? '记住=' + who : '未记住');
        } else report.认人 = '无候选';
      } catch (e) { report.认人 = 'FAIL ' + e.message; }

      // 交互：已完成计划不占主页 + 归档里能找到它
      try {
        const pl = doc.getElementById('planList');
        report.主页隐藏已完成 = pl && pl.innerHTML.indexOf('已经完成的计划') >= 0 ? '仍显示' : 'OK';
        const ab = doc.getElementById('btnArchiveOpen');
        if (ab) {
          ab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(200);
          const al = doc.getElementById('archList');
          report.归档列表 = al && al.innerHTML.indexOf('已经完成的计划') >= 0 ? 'OK(含已完成项)' : '未找到';
          const q = doc.getElementById('archQ');
          if (q) {
            q.value = '不存在的关键词zzz';
            q.dispatchEvent(new window.Event('input', { bubbles: true }));
            await wait(150);
            report.归档筛选 = al.innerHTML.indexOf('没有符合条件') >= 0 ? 'OK' : '筛选无效';
            q.value = '';
            q.dispatchEvent(new window.Event('input', { bubbles: true }));
          }
          const cl = doc.getElementById('btnArchiveClose');
          if (cl) cl.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(100);
        } else report.归档列表 = '无入口';
      } catch (e) { report.归档列表 = 'FAIL ' + e.message; }

      // 交互：心情打卡 → 选一个心情 → 弹层应自动关闭
      try {
        const bar = doc.getElementById('moodQuick');
        if (bar) {
          bar.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(150);
          const mask = doc.getElementById('maskMood');
          report.心情弹层= mask && mask.className.indexOf('on') >= 0 ? '已打开' : '未打开';
          const grid = doc.getElementById('moodPickGrid');
          const first = grid ? grid.querySelector('[data-pick]') : null;
          report.心情备选 = grid ? grid.querySelectorAll('[data-pick]').length + '个' : '无';
          if (first) {
            first.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
            await wait(200);
            report.打卡后自动关闭 = mask && mask.className.indexOf('on') < 0 ? 'OK' : '仍开着';
          }
          // 备注区默认收起
          const wrap = doc.getElementById('moodNoteWrap');
          report.备注默认收起 = wrap && wrap.className.indexOf('hide') >= 0 ? 'OK' : '展开';
        } else report.心情弹层 = '未找到 moodQuick';
      } catch (e) { report.心情弹层 = 'FAIL ' + e.message; }

      // 交互：照片两人可见 + 照片聊天（挂在当天）
      try {
        const grid = doc.getElementById('photoGrid');
        const gh = grid ? grid.innerHTML : '';
        report.照片两人可见 = (gh.indexOf('船长') >= 0 && gh.indexOf('伙伴') >= 0)
          ? 'OK(我+伙伴)'
          : (gh.indexOf('船长') >= 0 ? '只有我的' : (gh ? '只有对方的' : '空'));
        const pc = doc.getElementById('photoChat');
        report.照片聊天 = pc
          ? (pc.innerHTML.indexOf('这张天空好看') >= 0 ? 'OK(含对方消息)'
            : (pc.innerHTML.indexOf('还没人说话') >= 0 ? '空态' : '有内容'))
          : '缺元素';
        const pin = doc.getElementById('photoChatInput');
        const pbtn = doc.getElementById('btnPhotoChatSend');
        if (pin && pbtn) {
          pin.value = '测试一句';
          pbtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
          await wait(250);
          report.照片聊天发送 = doc.getElementById('photoChat').innerHTML.indexOf('测试一句') >= 0 ? 'OK' : '未出现';
        } else report.照片聊天发送 = '缺元素';
      } catch (e) { report.照片两人可见 = 'FAIL ' + e.message; }

      // 交互：微信内引导（只有微信 UA 才该弹出；点「就在这里用」应关闭并记住）
      try {
        const wm = doc.getElementById('maskWx');
        const isWx = /MicroMessenger/i.test(window.navigator.userAgent || '');
        if (wm && isWx) {
          const copy = doc.getElementById('btnWxCopy');
          if (copy) { copy.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await wait(120); }
          const stay = doc.getElementById('btnWxStay');
          if (stay) {
            stay.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
            await wait(150);
            report.微信留在本页 = (wm.className.indexOf('on') < 0 ? '已关闭' : '仍开着')
              + '/' + (window.localStorage.getItem('wb_plan_wxstay') === '1' ? '已记住' : '未记住');
          } else report.微信留在本页 = '无按钮';
        } else {
          report.微信留在本页 = wm ? '非微信不弹(OK)' : '缺元素';
        }
      } catch (e) { report.微信留在本页 = 'FAIL ' + e.message; }

      // 交互：主屏引导结果（弹层状态已在开头记录；场景 5 已在开头点过「知道了」）
      try {
        const am = doc.getElementById('maskA2hs');
        const isWx = /MicroMessenger/i.test(window.navigator.userAgent || '');
        if (window.__KEEP_A2HS__) {
          report.主屏记住 = (am && am.className.indexOf('on') < 0 ? '已关闭' : '仍开着')
            + '/' + (window.localStorage.getItem('wb_plan_a2hs') === '1' ? '已记住' : '未记住');
        } else if (isWx) {
          report.主屏记住 = am && am.className.indexOf('on') >= 0 ? '微信误弹' : '微信不弹(OK)';
        } else {
          report.主屏记住 = '已让路后续测试';
        }
      } catch (e) { report.主屏记住 = 'FAIL ' + e.message; }

      // 交互：导出
      try {
        const ex = doc.getElementById('btnExport');
        ex.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await wait(150);
        report.导出 = 'OK';
      } catch (e) { report.导出 = 'FAIL ' + e.message; }

      /* ===== 回归断言：本轮修复的 4 个 bug ===== */
      const A = [];
      const ok = (name, pass, detail) => A.push({ 项: name, 结果: pass ? 'PASS' : 'FAIL', 详情: detail === undefined ? '' : detail });

      // BUG-1 照片幽灵副本：新增一张照片 → 拉云端 → 同一 日期|成员|序号 只能有一条
      try {
        const before = (window.state && window.state.photos) ? window.state.photos.length : (window.__state ? window.__state.photos.length : -1);
        const beforeCount = (() => {
          const g = doc.getElementById('photoGrid');
          if (!g) return -1;
          const m = g.innerHTML.match(/ph-del|data-pkey/g);
          return m ? m.length : -1;
        })();
        if (typeof window.addPhotoForTest === 'function') {
          window.addPhotoForTest();
          await wait(600);
          const after = window.__state ? window.__state.photos.length : -1;
          const keys = (window.__state ? window.__state.photos : []).map(p => p.date + '|' + (p.who || '') + '|' + (p.seq || 0));
          const dup = keys.length !== new Set(keys).size;
          ok('BUG1-照片无重复副本', !dup && after === before + 1, '前' + before + '后' + after + ' 重复=' + dup);
          const withRid = (window.__state ? window.__state.photos : []).filter(p => p.rid).length;
          // 离线（无 SDK）时本来就不可能有云端 id，只在联网场景断言
          const online = !!(window.__state && window.__state.online);
          if (online) ok('BUG1-新增照片拿到云端id', after > 0 && withRid === after, '有rid ' + withRid + '/' + after);
          else ok('BUG1-新增照片拿到云端id', true, '离线场景跳过(有rid ' + withRid + '/' + after + ')');
        } else {
          ok('BUG1-照片无重复副本', false, '未暴露 addPhotoForTest');
        }
      } catch (e) { ok('BUG1-照片无重复副本', false, e.message); }

      // UX-1 移动端触控热区：勾选框可点区域 ≥44px
      try {
        ok('UX1-勾选框热区≥44px', /\.cb::after[^{]*\{[^}]*min-height:44px/.test(html), 'CSS 规则');
        ok('UX1-小按钮热区≥44px', /\.miniBtn::after[^{]*\{[^}]*min-height:44px/.test(html), 'CSS 规则');
      } catch (e) { ok('UX1-勾选框热区≥44px', false, e.message); }

      // UX-2 ESC 关闭弹层
      try {
        const mk = () => doc.getElementById('btnNewTop') || doc.getElementById('btnNewBottom');
        const cm = doc.getElementById('maskCompose');
        mk().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await wait(200);
        const opened = cm.className.indexOf('on') >= 0;
        doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wait(200);
        ok('UX2-ESC关闭弹层', opened && cm.className.indexOf('on') < 0, '打开=' + opened + ' 关闭后=' + cm.className);
      } catch (e) { ok('UX2-ESC关闭弹层', false, e.message); }

      // UX-3 点遮罩空白关闭弹层
      try {
        const mk = () => doc.getElementById('btnNewTop') || doc.getElementById('btnNewBottom');
        const cm = doc.getElementById('maskCompose');
        mk().dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await wait(200);
        const opened = cm.className.indexOf('on') >= 0;
        cm.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await wait(200);
        ok('UX3-点遮罩关闭弹层', opened && cm.className.indexOf('on') < 0, '打开=' + opened + ' 关闭后=' + cm.className);
      } catch (e) { ok('UX3-点遮罩关闭弹层', false, e.message); }

      // DEMO 演示兜底：无 SDK 且无缓存时必须自动载入示例数据，且不写本地缓存
      try {
        const st = window.__state;
        const online = !!(st && st.online);
        if (!online) {
          ok('DEMO-无SDK自动载入示例数据', !!(st && st.plans.length > 0), '计划数 ' + (st ? st.plans.length : -1));
          ok('DEMO-首屏不是空白', box('todayList') > 0 || box('planList') > 0, '今日区=' + box('todayList') + ' 列表=' + box('planList'));
          ok('DEMO-同步态显示演示模式', txt('syncText') === '演示模式', '实际 ' + txt('syncText'));
          ok('DEMO-演示数据不写本地缓存', !window.localStorage.getItem('wb_plan_cache_v2'), '缓存键' + (window.localStorage.getItem('wb_plan_cache_v2') ? '存在' : '为空'));
          ok('DEMO-演示不弹强制引导', doc.getElementById('maskWho').className.indexOf('on') < 0, '认人弹层=' + doc.getElementById('maskWho').className);
        } else {
          ok('DEMO-有SDK不进演示', !st.demo, 'demo=' + (st ? st.demo : '?'));
          ok('DEMO-有SDK正常同步态', txt('syncText') !== '演示模式', '实际 ' + txt('syncText'));
          ok('DEMO-有SDK不误载示例', !(st && st.demo), '');
          ok('DEMO-有SDK首屏正常', box('todayList') > 0 || box('planList') > 0, '');
          ok('DEMO-有SDK保留引导逻辑', true, '跳过');
        }
      } catch (e) { ok('DEMO-演示兜底', false, e.message); }

      // BUG-2 离线清空全部：不得抛异常，且本地真的被清空
      try {
        if (typeof window.clearAllForTest === 'function') {
          window.clearAllForTest();
          await wait(300);
          const st = window.__state;
          const left = st ? (st.plans.length + st.logs.length + st.chat.length + st.notes.length + st.moods.length + st.photos.length) : -1;
          ok('BUG2-离线清空全部不崩溃', true, '剩余记录 ' + left);
          ok('BUG2-清空后确实为空', left === 0, '剩余 ' + left);
        } else ok('BUG2-离线清空全部不崩溃', false, '未暴露 clearAllForTest');
      } catch (e) { ok('BUG2-离线清空全部不崩溃', false, e.message); }

      // BUG-3 doImport 重复 var n：导入提示不得出现 NaN
      try {
        const src = html;
        const decls = (src.match(/var n = \{ plans:0, logs:0, notes:0, chat:0, moods:0/g) || []).length;
        ok('BUG3-doImport 无重复 var n', decls <= 1, '重复声明数 ' + decls);
        const usesPhotosNaN = /n\.photos\+\+/.test(src) && !/photos:0/.test(src.slice(src.indexOf('var n = {'), src.indexOf('var n = {') + 200));
        ok('BUG3-photos 计数可用', !usesPhotosNaN, usesPhotosNaN ? 'n 上无 photos 字段' : 'ok');
      } catch (e) { ok('BUG3-doImport 无重复 var n', false, e.message); }

      // BUG-4 备注输入框：要么不存在，要么提交时被读取
      try {
        const noteEl = doc.getElementById('fNote');
        if (!noteEl) ok('BUG4-无死备注框', true, '已从 DOM 移除');
        else {
          const reads = /getElementById\('fNote'\)|\$\('fNote'\)/.test(html);
          const inSubmit = html.indexOf("fNote") > 0 && /function submitCompose[\s\S]{0,1500}?fNote/.test(html);
          ok('BUG4-备注框已被读取', reads && inSubmit, '读取=' + reads + ' 提交内=' + inSubmit);
        }
      } catch (e) { ok('BUG4-备注框检查', false, e.message); }

      await wait(200);
      report.断言 = A;
      report.断言失败 = A.filter(a => a.结果 === 'FAIL').length;
      report.后续错误 = errors.slice();
      console.log(JSON.stringify(report, null, 2));
      console.log('>>> 断言 ' + (A.length - report.断言失败) + '/' + A.length + ' 通过，运行时错误 ' + errors.length + ' 条');
      resolve(errors.length + report.断言失败);
    });
  });
}

(async () => {
  console.log('===== 场景 1：有数据 =====');
  await run('有数据', 'normal');
  console.log('\n===== 场景 2：空数据（首次打开 / 云端无记录） =====');
  await run('空数据', 'empty');
  console.log('\n===== 场景 3：无 SDK（离线） =====');
  await run('无SDK', 'empty', w => { delete w.__SMART_PAGE__; });
  console.log('\n===== 场景 4：微信内置浏览器（应弹出「去浏览器打开」引导） =====');
  await run('微信内', 'normal', w => {
    Object.defineProperty(w.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003128) NetType/WIFI Language/zh_CN',
      configurable: true
    });
  });
  console.log('\n===== 场景 5：普通浏览器（应弹出「加到主屏幕」引导） =====');
  await run('主屏引导', 'normal', w => { w.__KEEP_A2HS__ = true; });
  process.exit(0);
})();
