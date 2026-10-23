# -*- coding: utf-8 -*-
"""把散落在各处的表 ID 字面量收敛为 TABLE.<key>（评审清单 #33）。

只替换 `databaseId: '<id>'` 这一形态，不动其它字符串，也不动 DATABASE_ID 的定义。
"""
import os
import re
import sys

MAP = {
    "EQzLfYTRyNHYYTKfDr5IKg": "TABLE.plans",
    "fr70DVNsj5q5Hw0ZMTXTMU": "TABLE.logs",
    "bzewu5Qr06DhI7QY60xX5h": "TABLE.notes",
    "kGvG4piRKRISA42OlT4FaH": "TABLE.chat",
    "4ZKcg7SjtcNyWfqYEs9r1z": "TABLE.online",
    "lG9I5mBB0NPhqVZDXHsAYy": "TABLE.moods",
    "CmBW74HIqkJZGYDbetXdHg": "TABLE.photos",
}

HERE = os.path.dirname(os.path.abspath(__file__))
TARGETS = [
    os.path.join(HERE, "parts", "04_js_b.js"),
    os.path.join(HERE, "parts", "05_js_c.js"),
]

PATTERN = re.compile(r"databaseId: '([A-Za-z0-9]{22})'")


def main():
    for path in TARGETS:
        with open(path, encoding="utf-8") as f:
            src = f.read()
        hits = PATTERN.findall(src)
        unknown = sorted({h for h in hits if h not in MAP})
        if unknown:
            print(f"{os.path.basename(path)}: 发现未登记的表 ID {unknown}，已中止")
            return 1

        def rep(m):
            return "databaseId: " + MAP[m.group(1)]

        out = PATTERN.sub(rep, src)
        n = len(hits)
        with open(path, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"{os.path.basename(path)}: 替换 {n} 处")
    return 0


if __name__ == "__main__":
    sys.exit(main())
