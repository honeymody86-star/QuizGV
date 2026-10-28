"""
الاستراتيجية: "اشترِ الهبوط المؤقت داخل الاتجاه الصاعد"

الفكرة ببساطة:
1. نختار سهم اتجاهه العام صاعد (سعره فوق متوسط آخر 100 يوم).
2. ننتظر لين ينزل نزول مؤقت قوي (مؤشر RSI تحت 20).
3. نشتري، على أمل إنه يرجع يكمل صعوده.
4. نبيع إذا: ارتفع وانتعش، أو ربحنا 8%، أو خسرنا 5%، أو طالت المدة.
"""
import config


def add_indicators(df):
    """يضيف المؤشرات الفنية لجدول الأسعار."""
    df = df.copy()

    # المتوسط المتحرك: متوسط سعر الإغلاق لآخر 50 يوم
    df["trend"] = df["close"].rolling(config.TREND_DAYS).mean()

    # مؤشر RSI: رقم من 0 إلى 100
    #   تحت 30 تقريباً = السهم نزل كثير بسرعة
    #   فوق 70 تقريباً = السهم طلع كثير بسرعة
    change = df["close"].diff()
    gain = change.clip(lower=0).ewm(alpha=1 / config.RSI_DAYS, adjust=False).mean()
    loss = (-change.clip(upper=0)).ewm(alpha=1 / config.RSI_DAYS, adjust=False).mean()
    df["rsi"] = 100 - 100 / (1 + gain / loss)
    return df


def should_buy(row):
    """يرجع (نعم/لا، السبب بالعربي)."""
    if row.isna().any():
        return False, "ما فيه بيانات كافية لحساب المؤشرات"
    if row["close"] <= row["trend"]:
        return False, f"الاتجاه هابط: السعر {row['close']:.2f} تحت المتوسط {row['trend']:.2f}"
    if row["rsi"] >= config.RSI_BUY_BELOW:
        return False, f"الاتجاه صاعد لكن ما فيه هبوط كافي (RSI = {row['rsi']:.0f})"
    return True, (f"الاتجاه صاعد (السعر فوق المتوسط {row['trend']:.2f}) "
                  f"وفيه هبوط مؤقت (RSI = {row['rsi']:.0f})")


def should_sell(row, buy_price, days_held):
    """يرجع (نعم/لا، السبب بالعربي)."""
    pnl = row["close"] / buy_price - 1
    if pnl <= -config.STOP_LOSS_PCT:
        return True, f"وقف خسارة: الصفقة نازلة {pnl:.1%}"
    if pnl >= config.TAKE_PROFIT_PCT:
        return True, f"جني أرباح: الصفقة رابحة {pnl:.1%}"
    if row["rsi"] >= config.RSI_SELL_ABOVE:
        return True, f"السهم انتعش (RSI = {row['rsi']:.0f}) والصفقة {pnl:+.1%}"
    if days_held >= config.MAX_HOLD_DAYS:
        return True, f"طالت المدة {days_held} يوم والصفقة {pnl:+.1%}"
    return False, f"ننتظر: الصفقة {pnl:+.1%} منذ {days_held} يوم"
