# -*- coding: utf-8 -*-
"""验证刚发布的线上 v15：锚点是否被平台重建、SDK 注入器是否在、房间功能是否在。"""
import io
import os
import re

BASE = r"C:\ai软件\workbuddy工作空间\2026-09-11-11-15-21\build2"
REMOTE = os.path.join(BASE, "v15_verify", "index.html")
LOCAL = os.path.join(BASE, "output.html")
OUT = os.path.join(BASE, "verify_v15_out.txt")

R = io.open(REMOTE, "rb").read()
RS = R.decode("utf-8", "replace")
L = io.open(LOCAL, "rb").read()
LS = L.decode("utf-8", "replace")

lines = []
def w(x=""):
    lines.append(str(x))

w("== 体积 ==")
w("remote v15 bytes=%d chars=%d" % (len(R), len(RS)))
w("local  v15 bytes=%d chars=%d" % (len(L), len(LS)))
w("v14 存档 bytes=215195 (对照)")

w()
w("== 平台锚点（关键：是否被重建） ==")
n = len(re.findall(r"data-page-node-id", RS))
w("remote data-page-node-id=%d" % n)
w("remote pnid 注释数=%d" % len(re.findall(r"<!--pnid:", RS)))
w("判定：%s" % ("✅ 平台已自动重建锚点" if n > 100 else "⚠️ 锚点未重建（%d）" % n))

w()
w("== SDK 注入器 ==")
inj = RS.count("page_comm/inject.js")
w("inject.js 出现=%d  → %s" % (inj, "✅ 平台已注入" if inj else "❌ 缺失！页面拿不到 SDK"))

w()
w("== 房间功能是否上线（必须全 True） ==")
marks = [
    ("maskRoom 弹层", 'id="maskRoom"'),
    ("roomCode 输入", 'id="roomCode"'),
    ("创建房间 createRoom", "function createRoom"),
    ("加入房间 joinRoom", "function joinRoom"),
    ("房间引导 openRoomGate", "function openRoomGate"),
    ("邀请链接 inviteLink", "function inviteLink"),
    ("写入盖章 stampRoom", "function stampRoom"),
    ("读取过滤 roomFilter", "function roomFilter"),
    ("表 ID 映射 TABLE", "var TABLE"),
    ("房间本地存储 LS_ROOM", "LS_ROOM"),
    ("演示模式 enableDemo", "function enableDemo"),
    ("房间码文本 roomCodeText", "roomCodeText"),
]
bad = 0
for name, pat in marks:
    ok = pat in RS
    if not ok:
        bad += 1
    w("  %-24s %s" % (name, ok))

w()
w("== 过滤逻辑是否真的带 room（核心隔离） ==")
i = RS.find("function roomFilter")
w(RS[i:i + 400].replace("\r\n", "\n") if i >= 0 else "❌ roomFilter 不存在")

w()
w("== 敏感信息扫描 ==")
for pat, name in [
    (r"1[3-9]\d{9}", "手机号"),
    (r"q-ak=", "COS 临时 AK"),
    (r"op_[a-z0-9]{20,}", "平台 token"),
]:
    hits = re.findall(pat, RS)
    w("  %s: %d" % (name, len(hits)))

w()
w("RESULT bad_marks=%d anchors=%d inject=%d" % (bad, n, inj))
w("CONCLUSION=%s" % ("PASS" if (bad == 0 and n > 100 and inj >= 1) else "NEED_ROLLBACK"))

io.open(OUT, "w", encoding="utf-8").write("\n".join(lines))
print("written", OUT)
