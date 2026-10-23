# -*- coding: utf-8 -*-
"""开源前敏感信息全量扫描。

输出：build2/os_scan_out.txt
"""
import io
import os
import re
import sys

BASE = r"C:\ai软件\workbuddy工作空间\2026-09-11-11-15-21"
OUT = os.path.join(BASE, "build2", "os_scan_out.txt")

# 敏感模式
PATTERNS = [
    ("平台token", re.compile(r"\bop_[A-Za-z0-9]{20,}")),
    ("微信appid", re.compile(r"\bwx[0-9a-f]{16}\b")),
    ("手机号", re.compile(r"(?<!\d)1[3-9]\d{9}(?!\d)")),
    ("COS临时AK", re.compile(r"\bAKID[A-Za-z0-9]{20,}")),
    ("预签名URL", re.compile(r"https?://[^\s\"']*?(qcloud|cos\.)[^\s\"']*?(sign|q-signature)=", re.I)),
    ("base64图片", re.compile(r"data:image/(png|jpeg|jpg);base64,[A-Za-z0-9+/=]{200,}")),
    ("身份证", re.compile(r"(?<!\d)\d{17}[\dXx](?!\d)")),
]

# 真实房间码不入库：需要扫的时候从命令行传入
#   python opensource_scan.py <ROOM_CODE>
if len(sys.argv) > 1 and sys.argv[1]:
    PATTERNS.append(("房间码", re.compile(re.escape(sys.argv[1]))))

# 只扫这些扩展名
EXTS = {".py", ".js", ".html", ".json", ".txt", ".md", ".css", ".yml", ".yaml", ""}
# 跳过的目录（node_modules 等）
SKIP_DIRS = {"node_modules", ".git", "node_modules"}

lines = []
hits_total = 0
file_count = 0

for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fn in files:
        p = os.path.join(root, fn)
        ext = os.path.splitext(fn)[1].lower()
        if ext not in EXTS:
            continue
        rel = os.path.relpath(p, BASE).replace("\\", "/")
        if rel.startswith(".workbuddy/"):
            continue
        try:
            if os.path.getsize(p) > 4 * 1024 * 1024:
                lines.append("[SKIP>4MB] " + rel)
                continue
            s = io.open(p, encoding="utf-8", errors="ignore").read()
        except Exception as e:
            lines.append("[READFAIL] " + rel + " " + str(e)[:60])
            continue
        file_count += 1
        hits = []
        for name, pat in PATTERNS:
            m = pat.findall(s)
            if m:
                sample = m[0]
                if isinstance(sample, tuple):
                    sample = sample[0]
                sample = str(sample)[:60]
                hits.append("%s x%d (%s...)" % (name, len(m), sample))
        if hits:
            hits_total += 1
            lines.append("[HIT] " + rel + "  <<< " + " | ".join(hits))

lines.append("")
lines.append("扫描文件数=%d，命中文件数=%d" % (file_count, hits_total))

io.open(OUT, "w", encoding="utf-8").write("\n".join(lines))
print("done")
