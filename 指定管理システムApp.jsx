import { useState, useEffect } from "react";

// ============================================================
// DATA & STORAGE HELPERS
// ============================================================
const STORAGE_KEY_RECEIPTS = "fms_receipts";
const STORAGE_KEY_EXPENSES = "fms_expenses";
const STORAGE_KEY_DAILY_NOTES = "fms_daily_notes";

const loadData = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (d) => d ? d.replace(/-/g, "/") : "";
const formatCurrency = (n) => Number(n || 0).toLocaleString("ja-JP") + "円";

const LOCATIONS = ["メインアリーナ", "サブアリーナ", "会議室A", "会議室B", "研修室", "多目的室", "トレーニング室"];
const USAGE_TYPES = ["一般利用", "団体利用", "学校利用", "行政利用", "大会・イベント", "練習利用"];
const PAYMENT_METHODS = ["現金", "振込", "無料"];

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [screen, setScreen] = useState("home");
  const [receipts, setReceipts] = useState(() => loadData(STORAGE_KEY_RECEIPTS));
  const [expenses, setExpenses] = useState(() => loadData(STORAGE_KEY_EXPENSES));
  const [dailyNotes, setDailyNotes] = useState(() => loadData(STORAGE_KEY_DAILY_NOTES));
  const [toast, setToast] = useState(null);
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0, 7));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addReceipt = (r) => {
    const updated = [...receipts, { ...r, id: Date.now() }];
    setReceipts(updated);
    saveData(STORAGE_KEY_RECEIPTS, updated);
    showToast("受付情報を保存しました ✓");
  };

  const addExpense = (e) => {
    const updated = [...expenses, { ...e, id: Date.now() }];
    setExpenses(updated);
    saveData(STORAGE_KEY_EXPENSES, updated);
    showToast("支出情報を保存しました ✓");
  };

  const saveNote = (note) => {
    const existing = dailyNotes.filter(n => n.date !== note.date);
    const updated = [...existing, note];
    setDailyNotes(updated);
    saveData(STORAGE_KEY_DAILY_NOTES, updated);
    showToast("日報を保存しました ✓");
  };

  const screenProps = {
    receipts, expenses, dailyNotes,
    addReceipt, addExpense, saveNote,
    selectedDate, setSelectedDate,
    selectedMonth, setSelectedMonth,
    go: setScreen, showToast
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      {screen !== "home" && (
        <header style={styles.header}>
          <button style={styles.backBtn} onClick={() => setScreen("home")}>
            ◀ ホーム
          </button>
          <span style={styles.headerTitle}>{screenTitles[screen] || ""}</span>
        </header>
      )}

      {/* Screens */}
      <main style={{ ...styles.main, paddingTop: screen !== "home" ? 72 : 0 }}>
        {screen === "home" && <HomeScreen {...screenProps} />}
        {screen === "receipt" && <ReceiptScreen {...screenProps} />}
        {screen === "expense" && <ExpenseScreen {...screenProps} />}
        {screen === "daily" && <DailyScreen {...screenProps} />}
        {screen === "monthly" && <MonthlyScreen {...screenProps} />}
        {screen === "cashbook" && <CashbookScreen {...screenProps} />}
        {screen === "export" && <ExportScreen {...screenProps} />}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "success" ? "#1a7a4a" : "#c0392b" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const screenTitles = {
  receipt: "利用受付",
  expense: "支出入力",
  daily: "日報確認・入力",
  monthly: "月報確認",
  cashbook: "現金出納帳",
  export: "書類出力",
};

// ============================================================
// HOME SCREEN
// ============================================================
function HomeScreen({ go, receipts, selectedDate }) {
  const todayReceipts = receipts.filter(r => r.date === today());
  const todayCount = todayReceipts.length;
  const todayPeople = todayReceipts.reduce((s, r) => s + Number(r.people || 0), 0);
  const todayIncome = todayReceipts.reduce((s, r) => s + Number(r.fee || 0), 0);

  const navItems = [
    { id: "receipt", label: "利用受付", icon: "📋", color: "#1a6fbf", sub: "新しい利用を登録" },
    { id: "expense", label: "支出入力", icon: "💴", color: "#7b3fa0", sub: "支出を記録する" },
    { id: "daily", label: "日報確認", icon: "📝", color: "#1a7a4a", sub: "今日の日報を確認" },
    { id: "monthly", label: "月報確認", icon: "📊", color: "#b45309", sub: "月次集計を確認" },
    { id: "cashbook", label: "現金出納帳", icon: "🗂️", color: "#0f766e", sub: "収支を確認する" },
    { id: "export", label: "書類出力", icon: "🖨️", color: "#64748b", sub: "PDF・Excel出力" },
  ];

  return (
    <div style={styles.homeWrap}>
      {/* Logo / Title */}
      <div style={styles.homeLogo}>
        <div style={styles.homeLogoIcon}>🏟️</div>
        <div>
          <div style={styles.homeTitle}>施設管理システム</div>
          <div style={styles.homeSubtitle}>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</div>
        </div>
      </div>

      {/* Today summary */}
      <div style={styles.summaryBar}>
        <SumCard label="本日の受付件数" value={`${todayCount}件`} color="#1a6fbf" />
        <SumCard label="本日の利用人数" value={`${todayPeople}名`} color="#1a7a4a" />
        <SumCard label="本日の収入" value={formatCurrency(todayIncome)} color="#b45309" />
      </div>

      {/* Nav grid */}
      <div style={styles.navGrid}>
        {navItems.map(item => (
          <button key={item.id} style={{ ...styles.navBtn, background: item.color }} onClick={() => go(item.id)}>
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
            <span style={styles.navSub}>{item.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SumCard({ label, value, color }) {
  return (
    <div style={{ ...styles.sumCard, borderColor: color }}>
      <div style={{ ...styles.sumValue, color }}>{value}</div>
      <div style={styles.sumLabel}>{label}</div>
    </div>
  );
}

// ============================================================
// RECEIPT SCREEN
// ============================================================
function ReceiptScreen({ addReceipt, go }) {
  const emptyForm = {
    date: today(), startTime: "", endTime: "", groupName: "", repName: "",
    people: "", location: "", usageType: "", fee: "", payment: "現金"
  };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.groupName) e.groupName = "必須";
    if (!form.people) e.people = "必須";
    if (!form.location) e.location = "必須";
    if (!form.usageType) e.usageType = "必須";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addReceipt(form);
    setForm(emptyForm);
    go("home");
  };

  return (
    <div style={styles.formWrap}>
      <FormRow label="利用日" required>
        <BigInput type="date" value={form.date} onChange={v => set("date", v)} />
      </FormRow>
      <FormRow label="利用時間">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <BigInput type="time" value={form.startTime} onChange={v => set("startTime", v)} style={{ flex: 1 }} />
          <span style={{ fontSize: 20 }}>〜</span>
          <BigInput type="time" value={form.endTime} onChange={v => set("endTime", v)} style={{ flex: 1 }} />
        </div>
      </FormRow>
      <FormRow label="団体名" required error={errors.groupName}>
        <BigInput placeholder="例：○○スポーツクラブ" value={form.groupName} onChange={v => set("groupName", v)} />
      </FormRow>
      <FormRow label="代表者名">
        <BigInput placeholder="例：山田 太郎" value={form.repName} onChange={v => set("repName", v)} />
      </FormRow>
      <FormRow label="利用人数" required error={errors.people}>
        <BigInput type="number" placeholder="例：20" value={form.people} onChange={v => set("people", v)} />
      </FormRow>
      <FormRow label="利用場所" required error={errors.location}>
        <BigSelect value={form.location} onChange={v => set("location", v)} options={["", ...LOCATIONS]} labels={["選択してください", ...LOCATIONS]} />
      </FormRow>
      <FormRow label="利用区分" required error={errors.usageType}>
        <BigSelect value={form.usageType} onChange={v => set("usageType", v)} options={["", ...USAGE_TYPES]} labels={["選択してください", ...USAGE_TYPES]} />
      </FormRow>
      <FormRow label="利用料金">
        <BigInput type="number" placeholder="例：3000" value={form.fee} onChange={v => set("fee", v)} suffix="円" />
      </FormRow>
      <FormRow label="支払方法">
        <div style={styles.radioGroup}>
          {PAYMENT_METHODS.map(m => (
            <button key={m} style={{ ...styles.radioBtn, ...(form.payment === m ? styles.radioBtnActive : {}) }} onClick={() => set("payment", m)}>
              {m}
            </button>
          ))}
        </div>
      </FormRow>

      <div style={{ height: 24 }} />
      <button style={styles.saveBtn} onClick={handleSave}>
        💾　保存する
      </button>
    </div>
  );
}

// ============================================================
// EXPENSE SCREEN
// ============================================================
function ExpenseScreen({ addExpense, go }) {
  const [form, setForm] = useState({ date: today(), content: "", amount: "", vendor: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.content || !form.amount) return;
    addExpense(form);
    setForm({ date: today(), content: "", amount: "", vendor: "" });
    go("home");
  };

  return (
    <div style={styles.formWrap}>
      <FormRow label="日付" required>
        <BigInput type="date" value={form.date} onChange={v => set("date", v)} />
      </FormRow>
      <FormRow label="内容" required>
        <BigInput placeholder="例：消耗品費" value={form.content} onChange={v => set("content", v)} />
      </FormRow>
      <FormRow label="金額" required>
        <BigInput type="number" placeholder="例：5000" value={form.amount} onChange={v => set("amount", v)} suffix="円" />
      </FormRow>
      <FormRow label="支払先">
        <BigInput placeholder="例：○○商店" value={form.vendor} onChange={v => set("vendor", v)} />
      </FormRow>
      <div style={{ height: 24 }} />
      <button style={styles.saveBtn} onClick={handleSave}>💾　保存する</button>
    </div>
  );
}

// ============================================================
// DAILY REPORT SCREEN
// ============================================================
function DailyScreen({ receipts, dailyNotes, saveNote, selectedDate, setSelectedDate, go }) {
  const note = dailyNotes.find(n => n.date === selectedDate) || { date: selectedDate, special: "", lost: "", broken: "", cleaning: "" };
  const [form, setForm] = useState(note);

  useEffect(() => {
    const n = dailyNotes.find(n => n.date === selectedDate) || { date: selectedDate, special: "", lost: "", broken: "", cleaning: "" };
    setForm(n);
  }, [selectedDate, dailyNotes]);

  const dayReceipts = receipts.filter(r => r.date === selectedDate);
  const totalPeople = dayReceipts.reduce((s, r) => s + Number(r.people || 0), 0);
  const totalIncome = dayReceipts.reduce((s, r) => s + Number(r.fee || 0), 0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={styles.formWrap}>
      <FormRow label="日付">
        <BigInput type="date" value={selectedDate} onChange={setSelectedDate} />
      </FormRow>

      {/* Auto summary */}
      <div style={styles.autoBlock}>
        <div style={styles.autoBlockTitle}>📋 自動集計（受付データより）</div>
        <div style={styles.autoText}>
          本日は団体利用 <strong>{dayReceipts.length}件</strong>、利用人数 <strong>{totalPeople}名</strong>、
          利用料収入 <strong>{formatCurrency(totalIncome)}</strong> でした。
        </div>
        {dayReceipts.length > 0 && (
          <table style={styles.miniTable}>
            <thead>
              <tr>
                <th style={styles.th}>団体名</th>
                <th style={styles.th}>利用場所</th>
                <th style={styles.th}>人数</th>
                <th style={styles.th}>金額</th>
              </tr>
            </thead>
            <tbody>
              {dayReceipts.map(r => (
                <tr key={r.id}>
                  <td style={styles.td}>{r.groupName}</td>
                  <td style={styles.td}>{r.location}</td>
                  <td style={styles.td}>{r.people}名</td>
                  <td style={styles.td}>{formatCurrency(r.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {dayReceipts.length === 0 && <div style={{ color: "#888", fontSize: 16, marginTop: 8 }}>この日の受付データはありません</div>}
      </div>

      {/* Staff notes */}
      <FormRow label="特記事項">
        <BigTextarea placeholder="特記事項があれば入力..." value={form.special} onChange={v => set("special", v)} />
      </FormRow>
      <FormRow label="忘れ物">
        <BigTextarea placeholder="忘れ物の内容..." value={form.lost} onChange={v => set("lost", v)} />
      </FormRow>
      <FormRow label="故障・不具合">
        <BigTextarea placeholder="故障・不具合の内容..." value={form.broken} onChange={v => set("broken", v)} />
      </FormRow>
      <FormRow label="清掃内容">
        <BigTextarea placeholder="清掃した場所・内容..." value={form.cleaning} onChange={v => set("cleaning", v)} />
      </FormRow>

      <div style={{ height: 24 }} />
      <button style={styles.saveBtn} onClick={() => { saveNote({ ...form, date: selectedDate }); go("home"); }}>
        💾　日報を保存する
      </button>
    </div>
  );
}

// ============================================================
// MONTHLY REPORT SCREEN
// ============================================================
function MonthlyScreen({ receipts, expenses, selectedMonth, setSelectedMonth }) {
  const monthReceipts = receipts.filter(r => r.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));

  const totalPeople = monthReceipts.reduce((s, r) => s + Number(r.people || 0), 0);
  const totalCount = monthReceipts.length;
  const totalIncome = monthReceipts.reduce((s, r) => s + Number(r.fee || 0), 0);
  const totalExpense = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // By usage type
  const byType = {};
  USAGE_TYPES.forEach(t => { byType[t] = { count: 0, people: 0, income: 0 }; });
  monthReceipts.forEach(r => {
    if (byType[r.usageType]) {
      byType[r.usageType].count++;
      byType[r.usageType].people += Number(r.people || 0);
      byType[r.usageType].income += Number(r.fee || 0);
    }
  });

  // By group
  const byGroup = {};
  monthReceipts.forEach(r => {
    if (!byGroup[r.groupName]) byGroup[r.groupName] = { count: 0, people: 0, income: 0 };
    byGroup[r.groupName].count++;
    byGroup[r.groupName].people += Number(r.people || 0);
    byGroup[r.groupName].income += Number(r.fee || 0);
  });

  return (
    <div style={styles.formWrap}>
      <FormRow label="対象月">
        <BigInput type="month" value={selectedMonth} onChange={setSelectedMonth} />
      </FormRow>

      {/* Summary cards */}
      <div style={styles.monthSummaryGrid}>
        <MonthCard icon="👥" label="利用人数" value={`${totalPeople.toLocaleString()}名`} color="#1a6fbf" />
        <MonthCard icon="📋" label="利用件数" value={`${totalCount}件`} color="#1a7a4a" />
        <MonthCard icon="💰" label="収入合計" value={formatCurrency(totalIncome)} color="#b45309" />
        <MonthCard icon="💸" label="支出合計" value={formatCurrency(totalExpense)} color="#7b3fa0" />
        <MonthCard icon="📈" label="収支差額" value={formatCurrency(totalIncome - totalExpense)} color={totalIncome - totalExpense >= 0 ? "#0f766e" : "#c0392b"} />
      </div>

      {/* By usage type */}
      <SectionTitle>利用区分別集計</SectionTitle>
      <table style={styles.reportTable}>
        <thead>
          <tr>
            <th style={styles.th}>区分</th>
            <th style={styles.th}>件数</th>
            <th style={styles.th}>人数</th>
            <th style={styles.th}>収入</th>
          </tr>
        </thead>
        <tbody>
          {USAGE_TYPES.filter(t => byType[t].count > 0).map(t => (
            <tr key={t}>
              <td style={styles.td}>{t}</td>
              <td style={styles.td}>{byType[t].count}件</td>
              <td style={styles.td}>{byType[t].people}名</td>
              <td style={styles.td}>{formatCurrency(byType[t].income)}</td>
            </tr>
          ))}
          {USAGE_TYPES.every(t => byType[t].count === 0) && (
            <tr><td colSpan={4} style={{ ...styles.td, color: "#888", textAlign: "center" }}>データがありません</td></tr>
          )}
        </tbody>
      </table>

      {/* By group */}
      <SectionTitle>利用団体別集計（上位10件）</SectionTitle>
      <table style={styles.reportTable}>
        <thead>
          <tr>
            <th style={styles.th}>団体名</th>
            <th style={styles.th}>件数</th>
            <th style={styles.th}>人数</th>
            <th style={styles.th}>収入</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byGroup).sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([name, d]) => (
            <tr key={name}>
              <td style={styles.td}>{name}</td>
              <td style={styles.td}>{d.count}件</td>
              <td style={styles.td}>{d.people}名</td>
              <td style={styles.td}>{formatCurrency(d.income)}</td>
            </tr>
          ))}
          {Object.keys(byGroup).length === 0 && (
            <tr><td colSpan={4} style={{ ...styles.td, color: "#888", textAlign: "center" }}>データがありません</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MonthCard({ icon, label, value, color }) {
  return (
    <div style={{ ...styles.monthCard, borderLeftColor: color }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <div>
        <div style={{ ...styles.monthCardValue, color }}>{value}</div>
        <div style={styles.monthCardLabel}>{label}</div>
      </div>
    </div>
  );
}

// ============================================================
// CASHBOOK SCREEN
// ============================================================
function CashbookScreen({ receipts, expenses, selectedMonth, setSelectedMonth }) {
  const monthReceipts = receipts.filter(r => r.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));

  // Build combined entries
  const entries = [
    ...monthReceipts.map(r => ({
      date: r.date, content: `${r.groupName}（${r.usageType}）`, income: Number(r.fee || 0), expense: 0, type: "income"
    })),
    ...monthExpenses.map(e => ({
      date: e.date, content: `${e.content}（${e.vendor || ""}）`, income: 0, expense: Number(e.amount || 0), type: "expense"
    }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const rows = entries.map(e => {
    balance += e.income - e.expense;
    return { ...e, balance };
  });

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);

  return (
    <div style={styles.formWrap}>
      <FormRow label="対象月">
        <BigInput type="month" value={selectedMonth} onChange={setSelectedMonth} />
      </FormRow>

      <div style={styles.cashSummary}>
        <span>収入合計: <strong style={{ color: "#1a7a4a" }}>{formatCurrency(totalIncome)}</strong></span>
        <span>支出合計: <strong style={{ color: "#c0392b" }}>{formatCurrency(totalExpense)}</strong></span>
        <span>残高: <strong style={{ color: "#1a6fbf" }}>{formatCurrency(totalIncome - totalExpense)}</strong></span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.reportTable}>
          <thead>
            <tr>
              <th style={styles.th}>日付</th>
              <th style={styles.th}>内容</th>
              <th style={styles.th}>収入</th>
              <th style={styles.th}>支出</th>
              <th style={styles.th}>残高</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: r.type === "expense" ? "#fff5f5" : "white" }}>
                <td style={styles.td}>{formatDate(r.date)}</td>
                <td style={styles.td}>{r.content}</td>
                <td style={{ ...styles.td, color: "#1a7a4a", textAlign: "right" }}>{r.income > 0 ? formatCurrency(r.income) : ""}</td>
                <td style={{ ...styles.td, color: "#c0392b", textAlign: "right" }}>{r.expense > 0 ? formatCurrency(r.expense) : ""}</td>
                <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}>{formatCurrency(r.balance)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ ...styles.td, color: "#888", textAlign: "center" }}>データがありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// EXPORT SCREEN
// ============================================================
function ExportScreen({ receipts, expenses, dailyNotes, selectedDate, setSelectedDate, selectedMonth, setSelectedMonth, showToast }) {
  const handleExport = (type) => {
    showToast(`${type}を出力しました（デモ）`, "success");
  };

  const exportItems = [
    { label: "日報（PDF）", icon: "📄", desc: `${formatDate(selectedDate)} の日報`, action: () => handleExport("日報PDF") },
    { label: "月報（PDF）", icon: "📊", desc: `${selectedMonth.replace("-", "年")}月 の月報`, action: () => handleExport("月報PDF") },
    { label: "現金出納帳（PDF）", icon: "🗂️", desc: `${selectedMonth.replace("-", "年")}月 の現金出納帳`, action: () => handleExport("現金出納帳PDF") },
    { label: "利用実績一覧（PDF）", icon: "📋", desc: `${selectedMonth.replace("-", "年")}月 の利用実績`, action: () => handleExport("利用実績PDF") },
    { label: "月報（Excel）", icon: "📗", desc: `${selectedMonth.replace("-", "年")}月 のExcel出力`, action: () => handleExport("月報Excel") },
    { label: "現金出納帳（Excel）", icon: "📗", desc: `${selectedMonth.replace("-", "年")}月 のExcel出力`, action: () => handleExport("現金出納帳Excel") },
  ];

  return (
    <div style={styles.formWrap}>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <FormRow label="対象日（日報用）">
            <BigInput type="date" value={selectedDate} onChange={setSelectedDate} />
          </FormRow>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <FormRow label="対象月（月次書類用）">
            <BigInput type="month" value={selectedMonth} onChange={setSelectedMonth} />
          </FormRow>
        </div>
      </div>

      <div style={styles.exportGrid}>
        {exportItems.map((item, i) => (
          <button key={i} style={styles.exportBtn} onClick={item.action}>
            <span style={{ fontSize: 32 }}>{item.icon}</span>
            <span style={styles.exportBtnLabel}>{item.label}</span>
            <span style={styles.exportBtnDesc}>{item.desc}</span>
          </button>
        ))}
      </div>

      <div style={styles.exportNote}>
        ※ 実際の運用では、データベースと連携してPDF・Excelファイルを自動生成します。<br/>
        　 市役所提出書類のフォーマットに合わせてカスタマイズ可能です。
      </div>
    </div>
  );
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================
function FormRow({ label, required, error, children }) {
  return (
    <div style={styles.formRow}>
      <label style={styles.formLabel}>
        {label}
        {required && <span style={styles.required}>必須</span>}
      </label>
      {children}
      {error && <div style={styles.errorMsg}>⚠ {error}</div>}
    </div>
  );
}

function BigInput({ type = "text", value, onChange, placeholder, suffix, style = {} }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...styles.bigInput, ...style }}
      />
      {suffix && <span style={styles.inputSuffix}>{suffix}</span>}
    </div>
  );
}

function BigSelect({ value, onChange, options, labels }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={styles.bigInput}>
      {options.map((opt, i) => (
        <option key={opt} value={opt}>{labels[i]}</option>
      ))}
    </select>
  );
}

function BigTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      style={styles.bigTextarea}
    />
  );
}

function SectionTitle({ children }) {
  return <div style={styles.sectionTitle}>{children}</div>;
}

// ============================================================
// STYLES
// ============================================================
const BASE_FONT = "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif";

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f0f4f8",
    fontFamily: BASE_FONT,
    color: "#1a202c",
  },
  header: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    height: 64,
    background: "#1a3a5c",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: 16,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },
  backBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontSize: 18,
    fontFamily: BASE_FONT,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 0 40px 0",
  },
  homeWrap: {
    padding: "24px 16px",
  },
  homeLogo: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    padding: "20px 24px",
    background: "#1a3a5c",
    borderRadius: 16,
    color: "white",
  },
  homeLogoIcon: {
    fontSize: 48,
  },
  homeTitle: {
    fontSize: 26,
    fontWeight: "bold",
    lineHeight: 1.2,
  },
  homeSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginTop: 4,
  },
  summaryBar: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  sumCard: {
    flex: 1,
    minWidth: 120,
    background: "white",
    borderRadius: 12,
    padding: "14px 16px",
    borderLeft: "5px solid",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  sumValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  sumLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  },
  navBtn: {
    border: "none",
    borderRadius: 16,
    padding: "24px 16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
    transition: "transform 0.1s, box-shadow 0.1s",
    minHeight: 130,
  },
  navIcon: {
    fontSize: 40,
  },
  navLabel: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: BASE_FONT,
  },
  navSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: BASE_FONT,
  },
  formWrap: {
    padding: "20px 16px",
  },
  formRow: {
    marginBottom: 20,
  },
  formLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 8,
  },
  required: {
    background: "#dc2626",
    color: "white",
    fontSize: 13,
    borderRadius: 4,
    padding: "2px 8px",
    fontWeight: "normal",
  },
  bigInput: {
    width: "100%",
    padding: "16px 18px",
    fontSize: 20,
    borderRadius: 12,
    border: "2px solid #cbd5e1",
    fontFamily: BASE_FONT,
    background: "white",
    boxSizing: "border-box",
    outline: "none",
    color: "#1a202c",
    WebkitAppearance: "none",
  },
  inputSuffix: {
    position: "absolute",
    right: 16,
    fontSize: 18,
    color: "#64748b",
    pointerEvents: "none",
  },
  bigTextarea: {
    width: "100%",
    padding: "16px 18px",
    fontSize: 18,
    borderRadius: 12,
    border: "2px solid #cbd5e1",
    fontFamily: BASE_FONT,
    background: "white",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    color: "#1a202c",
  },
  radioGroup: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  radioBtn: {
    padding: "14px 24px",
    fontSize: 18,
    borderRadius: 12,
    border: "2px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontFamily: BASE_FONT,
    color: "#334155",
  },
  radioBtnActive: {
    background: "#1a6fbf",
    color: "white",
    border: "2px solid #1a6fbf",
    fontWeight: "bold",
  },
  saveBtn: {
    width: "100%",
    padding: "20px",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: BASE_FONT,
    background: "#1a7a4a",
    color: "white",
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(26,122,74,0.35)",
    letterSpacing: "0.05em",
  },
  errorMsg: {
    color: "#dc2626",
    fontSize: 16,
    marginTop: 4,
  },
  autoBlock: {
    background: "#eff6ff",
    border: "2px solid #bfdbfe",
    borderRadius: 14,
    padding: "18px 20px",
    marginBottom: 24,
  },
  autoBlockTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1d4ed8",
    marginBottom: 10,
  },
  autoText: {
    fontSize: 18,
    lineHeight: 1.8,
    color: "#1e3a5f",
  },
  miniTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 12,
    fontSize: 16,
  },
  reportTable: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    fontSize: 16,
    marginBottom: 24,
  },
  th: {
    background: "#1a3a5c",
    color: "white",
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 16,
    fontWeight: "bold",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 16,
  },
  monthSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
    marginBottom: 24,
  },
  monthCard: {
    background: "white",
    borderRadius: 12,
    padding: "16px",
    borderLeft: "5px solid",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  monthCardValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  monthCardLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a3a5c",
    borderBottom: "3px solid #1a3a5c",
    paddingBottom: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  cashSummary: {
    display: "flex",
    gap: 24,
    background: "white",
    padding: "16px 20px",
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 17,
    flexWrap: "wrap",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  exportGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },
  exportBtn: {
    background: "white",
    border: "2px solid #e2e8f0",
    borderRadius: 14,
    padding: "20px 16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  exportBtnLabel: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1a3a5c",
    fontFamily: BASE_FONT,
    textAlign: "center",
  },
  exportBtnDesc: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: BASE_FONT,
    textAlign: "center",
  },
  exportNote: {
    marginTop: 24,
    padding: "16px 20px",
    background: "#fef9c3",
    borderRadius: 12,
    fontSize: 15,
    color: "#713f12",
    lineHeight: 2,
    border: "1px solid #fde68a",
  },
  toast: {
    position: "fixed",
    bottom: 32,
    left: "50%",
    transform: "translateX(-50%)",
    color: "white",
    padding: "16px 32px",
    borderRadius: 14,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: BASE_FONT,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    zIndex: 999,
    whiteSpace: "nowrap",
  },
};
