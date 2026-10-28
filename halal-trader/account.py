"""
حساب تداول وهمي "كاش فقط" - متوافق مع الضوابط الشرعية:
  - نشتري بالفلوس الموجودة فقط (ما فيه اقتراض ولا رافعة مالية)
  - ما نبيع إلا سهم نملكه (ما فيه بيع على المكشوف)
  - نشتري أسهم كاملة فقط (ما فيه نصف سهم)
"""
import config


class CashAccount:
    def __init__(self, cash=config.START_CASH):
        self.cash = cash
        self.positions = {}  # رمز السهم -> {"shares", "buy_price", "buy_date", "days"}
        self.trades = []     # سجل كل العمليات

    def buy(self, symbol, price, date, reason, budget):
        # كم سهم نقدر نشتري بالمبلغ المتاح بعد احتساب العمولة؟
        shares = int(budget / (price * (1 + config.COMMISSION_RATE)))
        if shares < 1:
            return f"ما يكفي المبلغ ({budget:.2f} ريال) لشراء سهم واحد بسعر {price:.2f}"
        cost = shares * price
        fee = cost * config.COMMISSION_RATE
        self.cash -= cost + fee
        self.positions[symbol] = {"shares": shares, "buy_price": price,
                                  "buy_date": str(date)[:10], "days": 0}
        self.trades.append({"date": str(date)[:10], "action": "شراء", "symbol": symbol,
                            "shares": shares, "price": round(price, 2),
                            "fee": round(fee, 2), "profit": None, "reason": reason})
        return None

    def sell(self, symbol, price, date, reason):
        pos = self.positions.pop(symbol)
        value = pos["shares"] * price
        fee = value * config.COMMISSION_RATE
        self.cash += value - fee
        buy_cost = pos["shares"] * pos["buy_price"] * (1 + config.COMMISSION_RATE)
        profit = value - fee - buy_cost  # الربح الصافي بعد عمولة الشراء والبيع
        self.trades.append({"date": str(date)[:10], "action": "بيع", "symbol": symbol,
                            "shares": pos["shares"], "price": round(price, 2),
                            "fee": round(fee, 2), "profit": round(profit, 2),
                            "reason": reason})

    def total_value(self, prices):
        """قيمة الحساب = الكاش + قيمة الأسهم بسعر اليوم."""
        return self.cash + sum(p["shares"] * prices[s] for s, p in self.positions.items())

    def to_dict(self):
        return {"cash": self.cash, "positions": self.positions, "trades": self.trades}

    @classmethod
    def from_dict(cls, d):
        acc = cls(d["cash"])
        acc.positions, acc.trades = d["positions"], d["trades"]
        return acc
