# -*- coding: utf-8 -*-
"""
老数据迁移：给 7 张表的历史记录补「房间号」字段。

背景：加了「房间号」字段后，历史行该字段为空。实测证实 equals 匹配不到空值行，
开了 filter 之后这些历史数据会整体拉不到（看起来像"消失"）。所以必须补。

用法：
    python build2/migrate_room.py <token> <room_code> [--dry-run]

依赖 build2/backup_20261023/ 下的备份文件（取 record_id 列表）。
"""
import json
import os
import subprocess
import sys

PY = sys.executable
HERE = os.path.dirname(os.path.abspath(__file__))
BACKUP = os.path.join(HERE, "backup_20261023")
SCRIPT = os.path.join(
    os.path.dirname(HERE),
)

# skill 脚本路径（WorkBuddy 内置资料库 database 模块）
SKILL_DB = (
    r"C:\ai软件\workbuddy1\resources\app.asar.unpacked\resources\plugins"
    r"\workbuddy-builtin\skills\library\database\batch_update_database_records.py"
)

TABLES = [
    ("01_plans", "EQzLfYTRyNHYYTKfDr5IKg"),
    ("02_logs", "fr70DVNsj5q5Hw0ZMTXTMU"),
    ("03_notes", "bzewu5Qr06DhI7QY60xX5h"),
    ("04_chat", "kGvG4piRKRISA42OlT4FaH"),
    ("05_online", "4ZKcg7SjtcNyWfqYEs9r1z"),
    ("06_moods", "lG9I5mBB0NPhqVZDXHsAYy"),
    ("07_photos", "CmBW74HIqkJZGYDbetXdHg"),
]


def main():
    if len(sys.argv) < 3:
        print("usage: python migrate_room.py <token> <room_code> [--dry-run]")
        return 2
    token = sys.argv[1]
    room = sys.argv[2]
    dry = "--dry-run" in sys.argv

    total = 0
    for name, dbid in TABLES:
        path = os.path.join(BACKUP, name + ".json")
        if not os.path.exists(path):
            print(f"{name}: 备份缺失，跳过")
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        ids = [r.get("record_id") for r in data.get("results", []) if r.get("record_id")]
        if not ids:
            print(f"{name}: 0 条，跳过")
            continue

        recs = json.dumps(
            [{"record_id": i, "properties": {"房间号": {"text": room}}} for i in ids],
            ensure_ascii=False,
        )
        print(f"{name}: {len(ids)} 条 -> 房间号={room}" + ("  [dry-run]" if dry else ""))
        total += len(ids)
        if dry:
            continue

        proc = subprocess.run(
            [PY, SKILL_DB, "--token-stdin", "--database-id", dbid, "--records", recs],
            input=token,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        out = (proc.stdout or "").strip()
        err = (proc.stderr or "").strip()
        if not out:
            print(f"    !! 无输出 stderr={err[:200]}")
            continue
        try:
            res = json.loads(out).get("results", [])
            ok = sum(1 for r in res if r.get("success"))
            bad = [r for r in res if not r.get("success")]
            print(f"    成功 {ok}/{len(res)}")
            for b in bad[:3]:
                print(f"    !! 失败 {b}")
        except Exception as e:
            print(f"    !! 解析失败 {str(e)[:100]} raw={out[:200]}")

    print(f"合计处理 {total} 条")
    return 0


if __name__ == "__main__":
    sys.exit(main())
