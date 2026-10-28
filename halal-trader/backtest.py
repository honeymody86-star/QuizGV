"""
الاختبار التاريخي: "لو شغلنا البوت آخر 3 سنوات، وش كان بيصير؟"

التشغيل:
    python backtest.py           (أسعار حقيقية)
    python backtest.py --demo    (أسعار وهمية للتجربة)
"""
import sys
import pandas as pd

import config
import strategy
from account import CashAccount
from data import load_halal_list, load_prices
from engine import run_day


def main():
    demo = "--demo" in sys.argv
    names = load_halal_list()
    prices = {s: strategy.add_indicators(df)
              for s, df in load_prices(list(names), demo=demo).items()}
    if not prices:
        print("ما فيه أسعار. تأكد من الإنترنت أو جرب --demo")
        return

    account = CashAccount()
    dates = sorted(set().union(*(df.index for df in prices.values())))
    history = []
    for date in dates:
        rows = {s: df.loc[date] for s, df in prices.items() if date in df.index}
        run_day(account, date, rows, names, explain=lambda msg: None)
        last = {s: df.loc[:date, "close"].iloc[-1] for s, df in prices.items()
                if not df.loc[:date].empty}
        history.append(account.total_value(last))

    # ---------- النتائج ----------
    print("=" * 60)
    print(f"  نتيجة الاختبار التاريخي {'(أسعار وهمية)' if demo else ''}")
    print(f"  من {str(dates[0])[:10]} إلى {str(dates[-1])[:10]}")
    print("=" * 60)

    sells = [t for t in account.trades if t["action"] == "بيع"]
    wins = [t for t in sells if t["profit"] > 0]
    fees = sum(t["fee"] for t in account.trades)
    final = history[-1]
    print(f"المبلغ في البداية:      {config.START_CASH:,.2f} ريال")
    print(f"المبلغ في النهاية:      {final:,.2f} ريال  ({final / config.START_CASH - 1:+.1%})")
    print(f"عدد الصفقات المكتملة:   {len(sells)}")
    if sells:
        print(f"الصفقات الرابحة:        {len(wins)} من {len(sells)} ({len(wins) / len(sells):.0%})")
    print(f"مجموع العمولات المدفوعة: {fees:,.2f} ريال")
    peak = pd.Series(history).cummax()
    print(f"أسوأ نزول من القمة:      {(pd.Series(history) / peak - 1).min():.1%}")

    # مقارنة مهمة: لو اشترينا الأسهم وتركناها بدون مضاربة؟
    hold = sum(df["close"].iloc[-1] / df["close"].iloc[0] for df in prices.values()) / len(prices)
    print(f"\nللمقارنة - لو اشتريت كل الأسهم بالتساوي وتركتها: {hold - 1:+.1%}")
    print("(إذا البوت أقل من هذا الرقم، المضاربة ما تستاهل التعب والعمولات)")

    print("\n---------- آخر 10 عمليات ----------")
    for t in account.trades[-10:]:
        extra = f"  ربح صافي: {t['profit']:+.2f}" if t["profit"] is not None else ""
        print(f"{t['date']}  {t['action']}  {t['shares']} سهم {names[t['symbol']]} "
              f"بسعر {t['price']}{extra}\n            السبب: {t['reason']}")

    pd.DataFrame(account.trades).to_csv("backtest_trades.csv", index=False, encoding="utf-8-sig")
    print("\nكل العمليات محفوظة في: backtest_trades.csv (تفتحه بالإكسل)")


if __name__ == "__main__":
    main()
