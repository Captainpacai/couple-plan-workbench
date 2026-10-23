# -*- coding: utf-8 -*-
"""验证线上 v16：锚点重建、SDK 注入、以及本轮「禁止跳转」相关改动是否真的上线。"""
import io
import os
import re

BASE = r"C:\ai软件\workbuddy工作空间\2026-09-11-11-15-21\build2"
REMOTE = os.path.join(BASE, "v16_verify", "index.html")
OUT = os.path.join(BASE, "verify_v16_out.txt")

R = io.open(REMOTE, "rb").read()
RS = R.decode("utf-8", "replace")

lines = []
def w(x=""):
    lines.append(str(x))

w("== 体积 ==")
w("remote v16 bytes=%d chars=%d" % (len(R), len(RS)))

w()
w("== 平台锚点 / SDK ==")
n = len(re.findall(r"data-page-node-id", RS))
w("data-page-node-id=%d  → %s" % (n, "OK" if n > 100 else "异常"))
w("inject.js=%d  → %s" % (RS.count("page_comm/inject.js"),
                        "OK" if RS.count("page_comm/inject.js") >= 1 else "异常"))

w()
w("== 本轮改动是否上线 ==")
marks = [
    ("隐藏参数常量 NO_JUMP_PARAM", "hideWorkBuddyButton=1"),
    ("inviteLink 用公开链接常量", "WX_PUBLIC_URL"),
    ("loadRoom 读顶层地址", "window.top"),
    ("房间弹层 maskRoom", 'id="maskRoom"'),
    ("写入盖章 stampRoom", "function stampRoom"),
    ("读取过滤 roomFilter", "function roomFilter"),
]
bad = 0
for name, pat in marks:
    ok = pat in RS
    if not ok:
        bad += 1
    w("  %-26s %s" % (name, ok))

w()
w("== inviteLink 实际实现 ==")
i = RS.find("function inviteLink")
w(RS[i:i + 700].replace("\r\n", "\n") if i >= 0 else "未找到")

w()
w("== loadRoom 实际实现 ==")
i = RS.find("function loadRoom")
w(RS[i:i + 800].replace("\r\n", "\n") if i >= 0 else "未找到")

w()
w("== 敏感信息 ==")
for pat, name in [(r"1[3-9]\d{9}", "手机号"), (r"q-ak=", "COS AK"), (r"op_[a-z0-9]{20,}", "token")]:
    w("  %s: %d" % (name, len(re.findall(pat, RS))))

w()
w("CONCLUSION=%s (bad=%d anchors=%d)" % ("PASS" if bad == 0 and n > 100 else "NEED_ROLLBACK", bad, n))
io.open(OUT, "w", encoding="utf-8").write("\n".join(lines))
print("written", OUT)
