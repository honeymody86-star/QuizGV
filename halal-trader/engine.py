"""
"عقل" البوت: هذي الدالة تشتغل مرة كل يوم تداول.
نفس الدالة تُستخدم في الاختبار التاريخي وفي التداول الورقي اليومي.
"""
import config
import strategy


def run_day(account, date, rows, names, explain=print):
    """
    rows: رمز السهم -> صف اليوم (فيه السعر والمؤشرات)
    explain: دالة تطبع شرح كل قرار (نخليها صامتة في الاختبار التاريخي)
    """
    # ١) أول شي: نراجع الأسهم اللي نملكها - هل نبيع؟
    for symbol in list(account.positions):
        if symbol not in rows:
            continue
        pos = account.positions[symbol]
        pos["days"] += 1
        sell, reason = strategy.should_sell(rows[symbol], pos["buy_price"], pos["days"])
        explain(f"  [{names[symbol]}] نملكه - {'بيع' if sell else 'احتفاظ'}: {reason}")
        if sell:
            account.sell(symbol, rows[symbol]["close"], date, reason)

    # ٢) بعدها: ندور على فرص شراء جديدة
    for symbol, row in rows.items():
        if symbol in account.positions:
            continue
        free_slots = config.MAX_POSITIONS - len(account.positions)
        buy, reason = strategy.should_buy(row)
        if not buy:
            explain(f"  [{names[symbol]}] لا شراء: {reason}")
            continue
        if free_slots == 0:
            explain(f"  [{names[symbol]}] إشارة شراء لكن ما فيه مكان: نملك {config.MAX_POSITIONS} أسهم")
            continue
        budget = account.cash / free_slots  # نوزع الكاش بالتساوي على الأماكن الفاضية
        problem = account.buy(symbol, row["close"], date, reason, budget)
        explain(f"  [{names[symbol]}] " + (f"إشارة شراء لكن {problem}" if problem
                                           else f"شراء: {reason}"))
