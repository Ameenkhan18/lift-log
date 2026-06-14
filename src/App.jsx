import { useState, useEffect, useCallback } from "react";

const DAYS = [
  {
    day: "Monday", short: "MON", label: "Push", sub: "Chest · Shoulders · Triceps",
    color: "#F97316", glow: "rgba(249,115,22,0.15)",
    exercises: [
      "Flat Barbell Bench Press","Incline Dumbbell Press","Cable Chest Fly",
      "Overhead Barbell Press","Dumbbell Lateral Raise","Tricep Rope Pushdown","Overhead Dumbbell Extension",
    ],
  },
  {
    day: "Tuesday", short: "TUE", label: "Pull", sub: "Back · Biceps · Rear Delts",
    color: "#22D3EE", glow: "rgba(34,211,238,0.15)",
    exercises: [
      "Deadlift / Rack Pull","Lat Pulldown (Wide Grip)","Seated Cable Row",
      "Face Pulls","Barbell Curl","Hammer Curl","Incline Dumbbell Curl",
    ],
  },
  {
    day: "Wednesday", short: "WED", label: "Legs", sub: "Quads · Hamstrings · Calves",
    color: "#A78BFA", glow: "rgba(167,139,250,0.15)",
    exercises: [
      "Barbell Back Squat","Leg Press","Romanian Deadlift",
      "Leg Curl (Lying)","Leg Extension","Standing Calf Raise",
    ],
  },
  { day: "Thursday", short: "THU", label: "Rest", sub: "Recovery", color: "#374151", glow: "transparent", exercises: [], isRest: true },
  {
    day: "Friday", short: "FRI", label: "Push", sub: "Chest · Shoulders · Triceps",
    color: "#F97316", glow: "rgba(249,115,22,0.15)",
    exercises: [
      "Incline Barbell Press","Dumbbell Flat Press","Pec Dec Machine Fly",
      "Dumbbell Shoulder Press","Cable Lateral Raise","Close-Grip Bench Press","Tricep Dip",
    ],
  },
  {
    day: "Saturday", short: "SAT", label: "Pull", sub: "Back · Biceps · Rear Delts",
    color: "#22D3EE", glow: "rgba(34,211,238,0.15)",
    exercises: [
      "Pull-Ups / Assisted Pull-Ups","T-Bar Row / Dumbbell Row","Single Arm Cable Row",
      "Rear Delt Dumbbell Fly","EZ Bar Curl","Cable Curl (Both Arms)","Reverse Curl",
    ],
  },
  { day: "Sunday", short: "SUN", label: "Rest", sub: "Recovery", color: "#374151", glow: "transparent", exercises: [], isRest: true },
];

const SETS_COUNT = 3;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekLabel() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getTodayDayIndex() {
  const jsDay = new Date().getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function WorkoutTracker() {
  const [activeDay, setActiveDay] = useState(getTodayDayIndex());
  const [view, setView] = useState("log"); // log | history | diet
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wt_logs") || "{}"); } catch { return {}; }
  });
  const [inputs, setInputs] = useState({});
  const [saved, setSaved] = useState(false);
  const [historyDay, setHistoryDay] = useState(0);

  const day = DAYS[activeDay];
  const dateKey = `${activeDay}_${todayKey()}`;

  useEffect(() => {
    const existing = logs[dateKey] || {};
    setInputs(existing);
    setSaved(false);
  }, [activeDay]);

  useEffect(() => {
    try { localStorage.setItem("wt_logs", JSON.stringify(logs)); } catch {}
  }, [logs]);

  const handleInput = (exIdx, setIdx, field, val) => {
    const key = `${exIdx}_${setIdx}_${field}`;
    setInputs(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const saveSession = () => {
    setLogs(prev => ({ ...prev, [dateKey]: inputs }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getVal = (exIdx, setIdx, field) => inputs[`${exIdx}_${setIdx}_${field}`] || "";

  // History: group by day index
  const histData = () => {
    const hDay = DAYS[historyDay];
    const entries = [];
    Object.keys(logs).forEach(k => {
      const [dIdx, date] = k.split("_");
      if (parseInt(dIdx) === historyDay && date) {
        entries.push({ date, data: logs[k] });
      }
    });
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries;
  };

  const totalVolume = (exIdx, data) => {
    let vol = 0;
    for (let s = 0; s < SETS_COUNT; s++) {
      const w = parseFloat(data[`${exIdx}_${s}_weight`] || 0);
      const r = parseFloat(data[`${exIdx}_${s}_reps`] || 0);
      vol += w * r;
    }
    return vol > 0 ? vol.toFixed(0) : null;
  };

  const completedSets = () => {
    if (!day.exercises) return { done: 0, total: 0 };
    let done = 0, total = day.exercises.length * SETS_COUNT;
    day.exercises.forEach((_, ei) => {
      for (let s = 0; s < SETS_COUNT; s++) {
        if (getVal(ei, s, "weight") && getVal(ei, s, "reps")) done++;
      }
    });
    return { done, total };
  };

  const prog = completedSets();
  const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#E2E8F0", fontFamily: "'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .day-btn:hover { opacity: 1 !important; transform: translateY(-1px); }
        .ex-card { transition: box-shadow 0.2s; }
        .ex-card:hover { box-shadow: 0 0 0 1px #333; }
        .set-input { transition: border-color 0.15s, background 0.15s; }
        .set-input:focus { outline: none; }
        .save-btn { transition: all 0.2s; }
        .save-btn:hover { filter: brightness(1.15); }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d0d1a", borderBottom: "1px solid #1a1a2e", padding: "20px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: "#fff", lineHeight: 1 }}>
             Ameen's LIFT LOG
            </div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginTop: 3 }}>{getWeekLabel()}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["log", "history", "diet"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 14px", border: "1px solid", borderRadius: 6, cursor: "pointer",
                fontSize: 10, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace",
                background: view === v ? "#1a1a2e" : "transparent",
                borderColor: view === v ? "#333" : "#1a1a2e",
                color: view === v ? "#fff" : "#444",
                textTransform: "uppercase",
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div style={{ display: "flex", overflowX: "auto", background: "#0a0a14", borderBottom: "1px solid #1a1a2e", scrollbarWidth: "none" }}>
        {DAYS.map((d, i) => (
          <button key={i} className="day-btn" onClick={() => setActiveDay(i)} style={{
            flexShrink: 0, minWidth: 52, padding: "12px 6px", border: "none", cursor: "pointer",
            background: "transparent", opacity: activeDay === i ? 1 : 0.4, transition: "all 0.2s",
            borderBottom: activeDay === i ? `2px solid ${d.color}` : "2px solid transparent",
          }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: d.color, marginBottom: 3 }}>{d.short}</div>
            <div style={{ fontSize: 11, color: activeDay === i ? "#fff" : "#666", fontFamily: "'JetBrains Mono', monospace" }}>{d.label}</div>
          </button>
        ))}
      </div>

      {view === "log" && (
        <>
          {/* Day Header */}
          <div style={{
            padding: "16px 16px 12px",
            background: `linear-gradient(180deg, ${day.glow} 0%, transparent 100%)`,
            borderBottom: "1px solid #1a1a2e",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: day.color, letterSpacing: 2 }}>
                  {day.day} — {day.label}
                </div>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>{day.sub}</div>
              </div>
              {!day.isRest && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontFamily: "'Bebas Neue', sans-serif", color: pct === 100 ? "#4ade80" : "#fff" }}>
                    {pct}%
                  </div>
                  <div style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>{prog.done}/{prog.total} SETS</div>
                </div>
              )}
            </div>
            {!day.isRest && prog.total > 0 && (
              <div style={{ marginTop: 10, background: "#111", borderRadius: 4, height: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width 0.4s",
                  background: pct === 100 ? "#4ade80" : day.color,
                  width: `${pct}%`,
                }} />
              </div>
            )}
          </div>

          {/* Rest Day */}
          {day.isRest && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🛌</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#333", letterSpacing: 3 }}>
                REST DAY
              </div>
              <div style={{ fontSize: 13, color: "#444", marginTop: 8 }}>Recovery is where growth happens.</div>
            </div>
          )}

          {/* Exercises */}
          {!day.isRest && (
            <div style={{ padding: "12px 14px 100px" }}>
              {day.exercises.map((ex, ei) => {
                const vol = totalVolume(ei, inputs);
                const allDone = Array.from({ length: SETS_COUNT }).every((_, s) =>
                  getVal(ei, s, "weight") && getVal(ei, s, "reps")
                );
                return (
                  <div key={ei} className="ex-card" style={{
                    background: allDone ? `${day.glow}` : "#0d0d1a",
                    border: `1px solid ${allDone ? day.color + "40" : "#1a1a2e"}`,
                    borderRadius: 10, marginBottom: 10, overflow: "hidden",
                  }}>
                    {/* Exercise header */}
                    <div style={{
                      padding: "12px 14px 10px",
                      borderBottom: "1px solid #1a1a2e",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: "50%", fontSize: 10, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: allDone ? day.color : "#1a1a2e",
                          color: allDone ? "#000" : "#555",
                        }}>{allDone ? "✓" : ei + 1}</span>
                        <span style={{ fontSize: 13, color: "#ccc", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{ex}</span>
                      </div>
                      {vol && (
                        <span style={{ fontSize: 10, color: day.color, letterSpacing: 1 }}>
                          {vol} kg vol
                        </span>
                      )}
                    </div>

                    {/* Sets */}
                    <div style={{ padding: "10px 14px" }}>
                      <div style={{
                        display: "grid", gridTemplateColumns: "28px 1fr 1fr 48px",
                        gap: 6, marginBottom: 6, padding: "0 2px",
                      }}>
                        <span />
                        <span style={{ fontSize: 9, color: "#444", letterSpacing: 2, textAlign: "center" }}>WEIGHT (kg)</span>
                        <span style={{ fontSize: 9, color: "#444", letterSpacing: 2, textAlign: "center" }}>REPS</span>
                        <span style={{ fontSize: 9, color: "#444", letterSpacing: 2, textAlign: "center" }}>VOL</span>
                      </div>
                      {Array.from({ length: SETS_COUNT }).map((_, si) => {
                        const w = getVal(ei, si, "weight");
                        const r = getVal(ei, si, "reps");
                        const rowVol = w && r ? (parseFloat(w) * parseFloat(r)).toFixed(0) : "";
                        const rowDone = w && r;
                        return (
                          <div key={si} style={{
                            display: "grid", gridTemplateColumns: "28px 1fr 1fr 48px",
                            gap: 6, marginBottom: 5, alignItems: "center",
                          }}>
                            <span style={{
                              fontSize: 10, color: rowDone ? day.color : "#333",
                              textAlign: "center", fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>S{si + 1}</span>
                            <input
                              className="set-input"
                              type="number" placeholder="—" value={w}
                              onChange={e => handleInput(ei, si, "weight", e.target.value)}
                              style={{
                                background: rowDone ? `${day.color}12` : "#111",
                                border: `1px solid ${rowDone ? day.color + "50" : "#222"}`,
                                borderRadius: 6, padding: "8px 10px", color: rowDone ? "#fff" : "#666",
                                fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                                width: "100%", textAlign: "center",
                              }}
                            />
                            <input
                              className="set-input"
                              type="number" placeholder="—" value={r}
                              onChange={e => handleInput(ei, si, "reps", e.target.value)}
                              style={{
                                background: rowDone ? `${day.color}12` : "#111",
                                border: `1px solid ${rowDone ? day.color + "50" : "#222"}`,
                                borderRadius: 6, padding: "8px 10px", color: rowDone ? "#fff" : "#666",
                                fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                                width: "100%", textAlign: "center",
                              }}
                            />
                            <span style={{
                              fontSize: 11, color: rowDone ? day.color : "#2a2a3a",
                              textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
                            }}>{rowVol || "·"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Save Button */}
              <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px", background: "linear-gradient(0deg, #080810 60%, transparent)" }}>
                <button className="save-btn" onClick={saveSession} style={{
                  width: "100%", padding: "16px",
                  background: saved ? "#4ade80" : day.color,
                  border: "none", borderRadius: 10, cursor: "pointer",
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3,
                  color: saved ? "#000" : "#000",
                }}>
                  {saved ? "✓  SAVED!" : "SAVE SESSION"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {view === "history" && (
        <div style={{ padding: "16px" }}>
          {/* Day picker */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {DAYS.filter(d => !d.isRest).map((d, i) => {
              const realIdx = DAYS.indexOf(d);
              return (
                <button key={i} onClick={() => setHistoryDay(realIdx)} style={{
                  padding: "6px 12px", border: `1px solid ${historyDay === realIdx ? d.color : "#222"}`,
                  borderRadius: 6, background: historyDay === realIdx ? `${d.color}20` : "transparent",
                  color: historyDay === realIdx ? d.color : "#555",
                  fontSize: 10, letterSpacing: 1, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{d.day.slice(0, 3)} {d.label}</button>
              );
            })}
          </div>

          {(() => {
            const entries = histData();
            if (entries.length === 0) return (
              <div style={{ textAlign: "center", padding: "60px 24px", color: "#333" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2 }}>NO SESSIONS YET</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Log a workout first.</div>
              </div>
            );
            const hDay = DAYS[historyDay];
            return entries.map(({ date, data }) => (
              <div key={date} style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
                <div style={{
                  padding: "10px 14px", borderBottom: "1px solid #1a1a2e",
                  background: `${hDay.glow}`, display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: hDay.color, letterSpacing: 2 }}>
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>
                    {(() => {
                      let total = 0;
                      hDay.exercises.forEach((_, ei) => {
                        for (let s = 0; s < SETS_COUNT; s++) {
                          const w = parseFloat(data[`${ei}_${s}_weight`] || 0);
                          const r = parseFloat(data[`${ei}_${s}_reps`] || 0);
                          total += w * r;
                        }
                      });
                      return total > 0 ? `${total.toFixed(0)} kg total vol` : "";
                    })()}
                  </span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  {hDay.exercises.map((ex, ei) => {
                    const sets = Array.from({ length: SETS_COUNT }).map((_, si) => ({
                      w: data[`${ei}_${si}_weight`],
                      r: data[`${ei}_${si}_reps`],
                    })).filter(s => s.w && s.r);
                    if (sets.length === 0) return null;
                    return (
                      <div key={ei} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace" }}>{ex}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {sets.map((s, si) => (
                            <span key={si} style={{
                              background: `${hDay.color}15`, border: `1px solid ${hDay.color}30`,
                              borderRadius: 6, padding: "4px 10px", fontSize: 11,
                              color: hDay.color, fontFamily: "'JetBrains Mono', monospace",
                            }}>{s.w}kg × {s.r}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
      {view === "diet" && (
        <div style={{ padding: "16px 14px 40px" }}>

          {/* Goal Banner */}
          <div style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.15), transparent)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 12, padding: "18px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#F97316", marginBottom: 8, textTransform: "uppercase" }}>🎯 Your Goal</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#fff", letterSpacing: 2 }}>57 KG → 65 KG</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>~25% body fat → muscular & bulky physique</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
              {[["3 Months","60 kg"],["6 Months","62–63 kg"],["12 Months","65 kg"]].map(([t,w]) => (
                <div key={t} style={{ background: "#0d0d1a", borderRadius: 8, padding: "10px 8px", textAlign: "center", border: "1px solid #1a1a2e" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F97316", fontFamily: "'JetBrains Mono', monospace" }}>{w}</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 3, letterSpacing: 1 }}>{t}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Targets */}
          <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "18px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#22D3EE", marginBottom: 12, textTransform: "uppercase" }}>📊 Daily Targets</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["🔥 Calories","2300–2500 kcal","#F97316"],["💪 Protein","110–130 g","#22D3EE"],["💧 Water","3 Litres","#60A5FA"],["😴 Sleep","7.5–9 Hours","#A78BFA"],["⚗️ Creatine","5 g Daily","#4ADE80"]].map(([label, val, color]) => (
                <div key={label} style={{ background: "#111", borderRadius: 8, padding: "12px 10px", border: "1px solid #1a1a2e" }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Meals */}
          {[
            { time: "Early Morning", emoji: "🌅", sub: "Pre-Workout", color: "#F97316", items: ["1 Banana","Black Coffee"], protein: null },
            { time: "Post-Workout", emoji: "💊", sub: "Recovery", color: "#4ADE80", items: ["1 Scoop Whey Protein (optional)","1 Banana"], protein: "~25g" },
            { time: "Breakfast", emoji: "🍳", sub: "Post-Workout", color: "#FACC15", items: ["4 Whole Eggs + 2 Egg Whites","80g Oats with 250ml Milk","1 Fruit (Apple / Banana)"], protein: "~35g" },
            { time: "Lunch", emoji: "🍗", sub: "Midday", color: "#22D3EE", items: ["150–200g Chicken / Fish OR 100g Paneer","2 Chapatis + 1 Bowl Rice","1 Bowl Dal + Salad"], protein: "~40g" },
            { time: "Evening Snack", emoji: "🥜", sub: "Pre-Workout fuel", color: "#A78BFA", items: ["Peanut Butter Sandwich (4 bread + 2 tbsp PB)","200ml Milk"], protein: "~15g" },
            { time: "Dinner", emoji: "🌙", sub: "Evening", color: "#60A5FA", items: ["150–200g Chicken / Fish OR 100g Paneer","3 Chapatis + Mixed Vegetables + Salad"], protein: "~40g" },
            { time: "Before Bed", emoji: "🥛", sub: "Slow protein", color: "#F472B6", items: ["250ml Milk"], protein: null },
          ].map((meal, i) => (
            <div key={i} style={{ background: "#0d0d1a", border: `1px solid ${meal.color}25`, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a2e", background: `${meal.color}10`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{meal.emoji}</span>
                  <div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: meal.color, letterSpacing: 2 }}>{meal.time}</div>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>{meal.sub}</div>
                  </div>
                </div>
                {meal.protein && (
                  <div style={{ background: `${meal.color}20`, border: `1px solid ${meal.color}40`, borderRadius: 20, padding: "4px 10px", fontSize: 11, color: meal.color, fontFamily: "'JetBrains Mono', monospace" }}>
                    {meal.protein} protein
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 16px" }}>
                {meal.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: j < meal.items.length - 1 ? 8 : 0 }}>
                    <span style={{ color: meal.color, fontSize: 10, marginTop: 3, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
