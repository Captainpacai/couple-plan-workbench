# -*- coding: utf-8 -*-
"""发布流水线：整体上传本地 output.html → commit → publish。

回滚点：build2/v15_backup/index.html（线上 v15 发布态存档）。
若验证不通过，用 --rollback 重新上传该存档即可。

用法（token 走环境变量 WB_TOKEN）：
  python publish_v15.py                          # 上传 output.html
  python publish_v15.py --rollback               # 上传 v15_backup/index.html 回滚
  python publish_v15.py --message "说明"          # 自定义 commit message
  python publish_v15.py --resume tx_xxx          # 复用已有事务，只做 commit+publish
"""
from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
SKILL = r"C:\ai软件\workbuddy1\resources\app.asar.unpacked\resources\plugins\workbuddy-builtin\skills\library\page"
NODE_ID = "3M1oqPyAJKYDSeGpFdvw7k"
PY = sys.executable
LOG = os.path.join(BASE, "publish_v15_log.txt")


def log(msg=""):
    print(msg)
    with io.open(LOG, "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")


def run_skill(script, args, token):
    cmd = [PY, os.path.join(SKILL, script), "--token-stdin"] + args
    proc = subprocess.run(
        cmd, input=(token + "\n").encode("utf-8"), capture_output=True
    )
    out = (proc.stdout or b"").decode("utf-8", "replace").strip()
    err = (proc.stderr or b"").decode("utf-8", "replace").strip()
    line = ""
    for raw in out.splitlines():
        raw = raw.strip()
        if raw.startswith("{"):
            line = raw
            break
    if not line:
        log("EMPTY_OUTPUT %s | stderr=%s" % (script, err[:400]))
        sys.exit(1)
    try:
        env = json.loads(line)
    except Exception:
        log("BAD_JSON %s | %s" % (script, line[:400]))
        sys.exit(1)
    if env.get("error") or (isinstance(env.get("code"), int) and env.get("code") != 0):
        log("SKILL_ERROR %s | %s" % (script, json.dumps(env, ensure_ascii=True)[:500]))
        sys.exit(1)
    return env


def main():
    io.open(LOG, "w", encoding="utf-8").write("")
    token = os.environ.get("WB_TOKEN", "").strip()
    if not token:
        log("MISSING WB_TOKEN")
        sys.exit(1)

    rollback = "--rollback" in sys.argv
    resume = ""
    for i, a in enumerate(sys.argv):
        if a == "--resume" and i + 1 < len(sys.argv):
            resume = sys.argv[i + 1].strip()

    src = (
        os.path.join(BASE, "v15_backup", "index.html")
        if rollback
        else os.path.join(BASE, "output.html")
    )
    if not os.path.exists(src):
        log("SRC_MISSING %s" % src)
        sys.exit(1)
    body = io.open(src, "rb").read()
    log("SRC %s bytes=%d" % (src, len(body)))

    if resume:
        tx = resume
        log("RESUME_TX %s" % tx)
    else:
        created = run_skill(
            "create_page_transaction.py", ["--node-id", NODE_ID], token
        )
        data = created.get("data") or {}
        tx = data.get("transactionId")
        log("TX %s baseVersion=%s" % (tx, data.get("baseVersion")))
        if not tx:
            log("NO_TX %s" % json.dumps(created, ensure_ascii=True)[:400])
            sys.exit(1)

        up = run_skill(
            "get_page_upload_url.py",
            ["--transaction-id", tx, "--path", "index.html"],
            token,
        )
        url = (up.get("data") or {}).get("uploadUrl")
        if not url:
            log("NO_UPLOAD_URL %s" % json.dumps(up, ensure_ascii=True)[:400])
            sys.exit(1)

        req = urllib.request.Request(url, data=body, method="PUT")
        req.add_header("Content-Type", "text/html; charset=utf-8")
        try:
            resp = urllib.request.urlopen(req, timeout=180)
            log("PUT %s bytes=%d" % (resp.status, len(body)))
        except urllib.error.HTTPError as e:
            log("PUT_FAILED %s %s" % (e.code, e.read()[:300]))
            sys.exit(1)
        except Exception as e:
            log("PUT_FAILED %s %s" % (type(e).__name__, str(e)[:300]))
            sys.exit(1)

    msg = "回滚到 v15" if rollback else "v16 邀请链接带 hideWorkBuddyButton=1，去掉误跳小程序的按钮"
    for i, a in enumerate(sys.argv):
        if a == "--message" and i + 1 < len(sys.argv):
            msg = sys.argv[i + 1]
    committed = run_skill(
        "commit_page_transaction.py",
        ["--transaction-id", tx, "--pnid", NODE_ID, "--message", msg],
        token,
    )
    cdata = committed.get("data") or {}
    log("COMMIT version=%s url=%s" % (cdata.get("newVersion"), cdata.get("url")))

    published = run_skill("publish_page.py", ["--node-id", NODE_ID], token)
    pdata = published.get("data") or {}
    log("PUBLISH %s" % json.dumps(pdata, ensure_ascii=True)[:400])
    log("DONE")


if __name__ == "__main__":
    main()
