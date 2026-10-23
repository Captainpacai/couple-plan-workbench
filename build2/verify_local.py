# -*- coding: utf-8 -*-
"""发布前最终体检：确认 output.html 含全部新功能，且与 parts 拼接结果一致。"""
import io
import os
import re

BASE = r"C:\ai软件\workbuddy工作空间\2026-09-11-11-15-21\build2"
PARTS = os.path.join(BASE, "parts")
OUT = os.path.join(BASE, "verify_local_out.txt")
H = io.open(os.path.join(BASE, "output.html"), "rb").read()
S = H.decode("utf-8", "replace")

lines = []
def w(x=""):
    lines.append(str(x))

w("output.html bytes=%d chars=%d" % (len(H), len(S)))
w("CRLF=%s" % ("\r\n" in S))
w("data-page-node-id=%d" % len(re.findall(r"data-page-node-id", S)))
w()

w("== 新功能标记（必须全 True） ==")
marks = [
    ("房间弹层 maskRoom", 'id="maskRoom"'),
    ("房间码输入 roomCode", 'id="roomCode"'),
    ("创建房间 createRoom", "function createRoom"),
    ("加入房间 joinRoom", "function joinRoom"),
    ("房间引导 openRoomGate", "function openRoomGate"),
    ("邀请链接 inviteLink", "function inviteLink"),
    ("房间码生成 genRoomCode", "function genRoomCode"),
    ("写入盖章 stampRoom", "function stampRoom"),
    ("读取过滤 roomFilter", "function roomFilter"),
    ("表 ID 映射 TABLE", "var TABLE"),
    ("房间存储 LS_ROOM", "LS_ROOM"),
    ("state.room", "state.room"),
    ("我的页房间卡片 roomCard", "roomCard"),
    ("演示模式 enableDemo", "function enableDemo"),
    ("照片去重 seen", "seen"),
]
bad = 0
for name, pat in marks:
    ok = pat in S
    if not ok:
        bad += 1
    w("  %-24s %s" % (name, ok))

w()
w("== 旧风险回归（必须全 False / 符合预期） ==")
w("  T_LOGS 残留(应0): %d" % len(re.findall(r"\bT_LOGS\b", S)))
w("  T_PHOTO 残留(应0): %d" % len(re.findall(r"\bT_PHOTO\b", S)))
w("  裸表ID fr70DVNsj5q5Hw0ZMTXTMU(应0): %d" % S.count("fr70DVNsj5q5Hw0ZMTXTMU"))
w("  裸表ID CmBW74HIqkJZGYDbetXdHg(应0): %d" % S.count("CmBW74HIqkJZGYDbetXdHg"))
w("  inject.js 出现次数(本地应为0，平台注入): %d" % S.count("page_comm/inject.js"))

w()
w("== 与 parts 拼接一致性 ==")
# build_check.py 的拼接顺序：01_head.html 02_body.html 03_js_a.js 04_js_b.js 05_js_c.js (+06?)
order = ["01_head.html", "02_body.html", "03_js_a.js", "04_js_b.js", "05_js_c.js"]
exist = [f for f in sorted(os.listdir(PARTS)) if f.endswith((".html", ".js"))]
w("  parts 文件: %s" % exist)
total = 0
for f in exist:
    b = io.open(os.path.join(PARTS, f), "rb").read()
    total += len(b)
    w("    %-16s %7d bytes" % (f, len(b)))
w("  parts 合计=%d bytes" % total)

w()
w("== script / style 块 ==")
for m in re.finditer(r"<script\b[^>]*>", S):
    w("  script open: %s" % m.group(0)[:120])
for m in re.finditer(r"<style\b[^>]*>", S):
    w("  style  open: %s" % m.group(0)[:120])
w("  script 数=%d style 数=%d" % (len(re.findall(r"<script\b", S)), len(re.findall(r"<style\b", S))))

w()
w("== 尾部 200 字符 ==")
w(repr(S[-200:]))

w()
w("RESULT bad_marks=%d" % bad)
io.open(OUT, "w", encoding="utf-8").write("\n".join(lines))
print("written", OUT)
