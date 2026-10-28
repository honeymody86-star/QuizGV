"""
التداول الورقي اليومي: فلوس وهمية + أسعار حقيقية.

شغّله مرة يومياً بعد إغلاق السوق السعودي (بعد الساعة 3:10 العصر):
    python paper.py

البوت يحفظ حسابه في ملف paper_account.json، وكل يوم يكمل من حيث وقف.
وكل قرار يتسجل مع سببه في ملف paper_log.txt عشان تراجعه وتتعلم.
"""
import json
import os
import sys
from datetime import datetime

import strategy
from account import CashAccount
from data import load_halal_list, load_prices
from engine import run_day

STATE_FILE = "paper_account.json"
LOG_FILE = "paper_log.txt"


def main():
    demo = "--demo" in sys.argv
    names = load_halal_list()

    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, encoding="utf-8") as f:
            state = json.load(f)
        account = CashAccount.from_dict(state["account"])
        last_run = state["last_date"]
    else:
        account, last_run = CashAccount(), None

    prices = {s: strategy.add_indicators(df)
              for s, df in load_prices(list(names), days=300, demo=demo).items()}
    if not prices:
        print("ما فيه أسعار. تأكد من الإنترنت.")
        return
    today = str(max(df.index[-1] for df in prices.values()))[:10]
    if today == last_run:
        print(f"البوت اشتغل اليوم ({today}) من قبل. ارجع بكرة بعد إغلاق السوق.")
        return

    lines = [f"\n===== {today} (تشغيل: {datetime.now():%Y-%m-%d %H:%M}) ====="]
    def explain(msg):
        lines.append(msg)

    rows = {s: df.iloc[-1] for s, df in prices.items()}
    before = len(account.trades)
    run_day(account, today, rows, names, explain)

    for t in account.trades[before:]:
        extra = f" | ربح صافي {t['profit']:+.2f} ريال" if t["profit"] is not None else ""
        lines.append(f"  >>> تنفيذ: {t['action']} {t['shares']} سهم {names[t['symbol']]} "
                     f"بسعر {t['price']} | عمولة {t['fee']}{extra}")

    closes = {s: r["close"] for s, r in rows.items()}
    lines.append(f"  الكاش: {account.cash:.2f} ريال | قيمة الحساب الكلية: "
                 f"{account.total_value(closes):.2f} ريال")
    for s, p in account.positions.items():
        pnl = closes[s] / p["buy_price"] - 1
        lines.append(f"  نملك: {p['shares']} سهم {names[s]} اشتريناه بـ{p['buy_price']:.2f} "
                     f"والآن {closes[s]:.2f} ({pnl:+.1%})")

    text = "\n".join(lines)
    print(text)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(text + "\n")
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"account": account.to_dict(), "last_date": today}, f,
                  ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
