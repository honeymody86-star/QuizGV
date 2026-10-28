"""
جلب أسعار الأسهم.

- الوضع العادي: نجيب الأسعار الحقيقية من Yahoo Finance (مجاني).
- الوضع التجريبي (--demo): نولّد أسعار وهمية، مفيد إذا ما فيه إنترنت.
"""
import csv
import numpy as np
import pandas as pd


def load_halal_list(path="halal_list.csv"):
    """يقرأ قائمة الأسهم النقية. البوت ما يتداول أي سهم خارجها أبداً."""
    with open(path, encoding="utf-8") as f:
        return {row["symbol"]: row["name"] for row in csv.DictReader(f)}


def load_prices(symbols, days=750, demo=False):
    """يرجع قاموس: رمز السهم -> جدول فيه سعر الإغلاق اليومي."""
    if demo:
        return {s: _fake_prices(s, days) for s in symbols}

    import yfinance as yf
    prices = {}
    for s in symbols:
        df = yf.download(s, period=f"{days}d", interval="1d",
                         auto_adjust=True, progress=False)
        if df.empty:
            print(f"تنبيه: ما قدرت أجيب أسعار {s}")
            continue
        close = df["Close"]
        if isinstance(close, pd.DataFrame):  # بعض إصدارات yfinance ترجع أعمدة متعددة
            close = close.iloc[:, 0]
        prices[s] = pd.DataFrame({"close": close}).dropna()
    return prices


def _fake_prices(symbol, days):
    rng = np.random.default_rng(abs(hash(symbol)) % 2**32)
    start = rng.uniform(15, 100)
    daily_moves = rng.normal(0.0003, 0.017, days)  # حركة يومية عشوائية ~1.7%
    close = start * np.exp(np.cumsum(daily_moves))
    dates = pd.bdate_range(end=pd.Timestamp.today().normalize(), periods=days)
    return pd.DataFrame({"close": close.round(2)}, index=dates)
