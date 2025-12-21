"use client";

import { useState } from "react";
import { useStudentData } from "@/components/admin/studentData";
import { useTradeRecords } from "@/components/admin/tradeRecords";
import { useTraderData } from "@/components/admin/traderData";

 type AdminMenuKey =
  | "dashboard"
  | "students"
  | "traders"
  | "leaders"
  | "leaderTrades"
  | "dismissed";

export function AdminLayout() {
  const [active, setActive] = useState<AdminMenuKey>("dashboard");

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">加菲猫交易管理系统</div>
        <nav className="admin-menu">
          <button
            className={"admin-menu-item" + (active === "dashboard" ? " admin-menu-item-active" : "")}
            onClick={() => setActive("dashboard")}
          >
            首页概览
          </button>
          <button
            className={"admin-menu-item" + (active === "students" ? " admin-menu-item-active" : "")}
            onClick={() => setActive("students")}
          >
            在训学员管理
          </button>
          <button
            className={"admin-menu-item" + (active === "traders" ? " admin-menu-item-active" : "")}
            onClick={() => setActive("traders")}
          >
            交易员管理
          </button>
          <button
            className={"admin-menu-item" + (active === "leaders" ? " admin-menu-item-active" : "")}
            onClick={() => setActive("leaders")}
          >
            团队长管理
          </button>
          <button
            className={"admin-menu-item" + (active === "leaderTrades" ? " admin-menu-item-active" : "")}
            onClick={() => setActive("leaderTrades")}
          >
            团队长交易管理
          </button>
          <button
            className={"admin-menu-item" + (active === "dismissed" ? " admin-menu-item-active" : "")}
            onClick={() => setActive("dismissed")}
          >
            劝退学员管理
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {active === "dashboard" && <DashboardPage />}
        {active === "students" && <StudentsPage />}
        {active === "traders" && <TradersPage />}
        {active === "leaders" && <LeadersPage />}
        {active === "leaderTrades" && <LeaderTradesPage />}
        {active === "dismissed" && <DismissedPage />}
      </main>
    </div>
  );
}

// 1. 首页 Dashboard（使用静态示例数据，后续可接 API）
function DashboardPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>首页概览</h1>
        <p className="admin-page-sub">核心数据、用户与交易概览。</p>
      </header>

      <section className="admin-cards-grid">
        <DashboardCard title="用户数量" value="120" trend="+8% vs last week" />
        <DashboardCard title="团队长数量" value="6" trend="+0%" />
        <DashboardCard title="在训学员" value="32" trend="+12%" />
        <DashboardCard title="交易员" value="18" trend="+5%" />
      </section>

      <section className="admin-section-row">
        <div className="admin-panel">
          <h2>交易概述</h2>
          <div className="admin-summary-row">
            <div>
              <div className="admin-summary-label">总交易量</div>
              <div className="admin-summary-value">1,280 笔</div>
            </div>
            <div>
              <div className="admin-summary-label">日交易量</div>
              <div className="admin-summary-value">36 笔</div>
            </div>
            <div>
              <div className="admin-summary-label">周交易比</div>
              <div className="admin-summary-value">+7.3%</div>
            </div>
          </div>
          <div className="admin-chart-placeholder">交易趋势图（预留，将来可接真实图表）</div>
        </div>

        <div className="admin-panel">
          <h2>年度用户趋势</h2>
          <div className="admin-chart-placeholder">1-12 月用户趋势图（预留）</div>
        </div>
      </section>

      <section className="admin-panel">
        <header className="admin-panel-header">
          <h2>新用户</h2>
          <div className="admin-segmented">
            <button className="admin-segmented-item admin-segmented-item-active">本月</button>
            <button className="admin-segmented-item">上月</button>
            <button className="admin-segmented-item">今年</button>
          </div>
        </header>
        <div className="admin-chart-placeholder">新用户趋势图（预留）</div>
      </section>
    </div>
  );
}

function DashboardCard(props: { title: string; value: string; trend: string }) {
  return (
    <div className="admin-card">
      <div className="admin-card-title">{props.title}</div>
      <div className="admin-card-value">{props.value}</div>
      <div className="admin-card-trend">{props.trend}</div>
    </div>
  );
}

// 2. 在训学员管理（使用本地存储模拟数据源 + 编辑交易弹窗）
function StudentsPage() {
  const { students, addStudent, dismissStudent } = useStudentData();
  const { getLatestForStudent, getAllForStudent, addRecord } = useTradeRecords();

  const [nameFilter, setNameFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  // 新建学员弹窗
  const [showForm, setShowForm] = useState(false);
  const [studentTab, setStudentTab] = useState<"student" | "trade">("student");
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formGender, setFormGender] = useState("male");
  const [formLevel, setFormLevel] = useState("");
  const [formBirthday, setFormBirthday] = useState("");
  const [formStage, setFormStage] = useState("");

  // 编辑交易弹窗
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stageStartDate, setStageStartDate] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [tradeResult, setTradeResult] = useState("");
  const [strategyImage, setStrategyImage] = useState<string | undefined>();
  const [weeklyImage, setWeeklyImage] = useState<string | undefined>();
  const [remark, setRemark] = useState("");

  const filtered = students.filter((s) => {
    if (nameFilter && !s.name.includes(nameFilter)) return false;
    if (genderFilter && s.gender !== genderFilter) return false;
    if (stageFilter && s.currentStage !== stageFilter) return false;
    return true;
  });

  function handleCreate() {
    if (!formName || !formDate) {
      alert("请填写学员名称和培训起始日期");
      return;
    }
    addStudent({
      name: formName,
      trainingStartDate: formDate,
      gender: formGender as any,
      currentStage: formStage || undefined
    });
    setFormName("");
    setFormDate("");
    setFormStage("");
    setFormGender("male");
    setShowForm(false);
  }

  function handleDismiss(id: string) {
    const reason = window.prompt("请输入劝退原因：", "长期不参与训练");
    if (!reason) return;
    dismissStudent(id, reason);
  }

  function openEditTrade(id: string) {
    setEditingId(id);
    const latest = getLatestForStudent(id);
    setStageStartDate(latest?.stageStartDate || "");
    setCurrentStage(latest?.currentStage || "");
    setTradeResult(latest?.tradeResult || "");
    setStrategyImage(latest?.strategyImage);
    setWeeklyImage(latest?.weeklySummaryImage);
    setRemark(latest?.remark || "");
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleTradeSubmit() {
    if (!editingId) return;
    if (!stageStartDate || !currentStage || !tradeResult) {
      alert("请至少填写阶段起始、当前阶段和交易结果");
      return;
    }
    addRecord({
      studentId: editingId,
      stageStartDate,
      currentStage,
      tradeResult,
      strategyImage,
      weeklySummaryImage: weeklyImage,
      remark
    });
    setEditingId(null);
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>在训学员管理</h1>
        <p className="admin-page-sub">管理学员基础信息与训练阶段记录（当前为原型功能，数据保存在浏览器本地）。</p>
      </header>

      <section className="admin-filter-row">
        <div className="admin-filter-field">
          <span className="admin-filter-label">姓名</span>
          <input
            className="admin-filter-input"
            placeholder="请输入姓名"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
        <div className="admin-filter-field">
          <span className="admin-filter-label">性别</span>
          <select
            className="admin-filter-input fx-select"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="">全部</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div className="admin-filter-field">
          <span className="admin-filter-label">当前阶段</span>
          <input
            className="admin-filter-input"
            placeholder="请选择当前阶段"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          />
        </div>
        <div className="admin-filter-actions">
          <button className="btn btn-primary" onClick={() => {}}>
            查询
          </button>
          <button
            className="btn btn-outline"
            style={{ marginLeft: 8 }}
            onClick={() => {
              setNameFilter("");
              setGenderFilter("");
              setStageFilter("");
            }}
          >
            重置
          </button>
        </div>
      </section>

      <div className="admin-actions-row">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          添加学员
        </button>
      </div>

      {showForm && (
        <div className="admin-panel" style={{ marginBottom: 12 }}>
          <h2>新建学员</h2>
          <div className="admin-filter-row" style={{ marginTop: 12 }}>
            <div className="admin-filter-field">
              <span className="admin-filter-label">学员名称</span>
              <input
                className="admin-filter-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="学员名称"
              />
            </div>
            <div className="admin-filter-field">
              <span className="admin-filter-label">培训起始</span>
              <input
                className="admin-filter-input"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="admin-filter-field">
              <span className="admin-filter-label">性别</span>
              <select
                className="admin-filter-input fx-select"
                value={formGender}
                onChange={(e) => setFormGender(e.target.value)}
              >
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="unknown">保密</option>
              </select>
            </div>
            <div className="admin-filter-field">
              <span className="admin-filter-label">当前阶段</span>
              <input
                className="admin-filter-input"
                value={formStage}
                onChange={(e) => setFormStage(e.target.value)}
                placeholder="如：入门期/模拟期/实盘期"
              />
            </div>
            <div className="admin-filter-actions">
              <button className="btn btn-primary" onClick={handleCreate}>
                确定
              </button>
              <button
                className="btn btn-outline"
                style={{ marginLeft: 8 }}
                onClick={() => setShowForm(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>培训起始时间</th>
              <th>性别</th>
              <th>当前阶段</th>
              <th>最近一次记录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  暂无数据
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const latest = getLatestForStudent(s.id);
                return (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.name}</td>
                    <td>{s.trainingStartDate}</td>
                    <td>{s.gender === "male" ? "男" : s.gender === "female" ? "女" : "保密"}</td>
                    <td>{s.currentStage || "-"}</td>
                    <td>
                      {latest
                        ? `${latest.currentStage} / ${latest.tradeResult}`
                        : "暂无记录"}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ paddingInline: 10, fontSize: 12 }}
                        onClick={() => openEditTrade(s.id)}
                      >
                        编辑交易
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ paddingInline: 10, fontSize: 12, marginLeft: 8 }}
                        onClick={() => handleDismiss(s.id)}
                      >
                        劝退
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h2>编辑交易 / 阶段记录</h2>
            <div className="admin-filter-row" style={{ marginTop: 12 }}>
              <div className="admin-filter-field">
                <span className="admin-filter-label">阶段起始</span>
                <input
                  className="admin-filter-input"
                  type="date"
                  value={stageStartDate}
                  onChange={(e) => setStageStartDate(e.target.value)}
                />
              </div>
              <div className="admin-filter-field">
                <span className="admin-filter-label">当前阶段</span>
                <input
                  className="admin-filter-input"
                  value={currentStage}
                  onChange={(e) => setCurrentStage(e.target.value)}
                  placeholder="如：入门期/模拟期/实盘期"
                />
              </div>
              <div className="admin-filter-field">
                <span className="admin-filter-label">交易结果</span>
                <input
                  className="admin-filter-input"
                  value={tradeResult}
                  onChange={(e) => setTradeResult(e.target.value)}
                  placeholder="如：达标/未达标/待评估"
                />
              </div>
            </div>

            <div className="admin-filter-row" style={{ marginTop: 8 }}>
              <div className="admin-filter-field">
                <span className="admin-filter-label">交易策略（图片）</span>
                <input
                  className="admin-filter-input"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await fileToDataUrl(file);
                    setStrategyImage(url);
                  }}
                />
                {strategyImage && (
                  <span className="admin-filter-label" style={{ marginTop: 4 }}>
                    已选图片
                  </span>
                )}
              </div>
              <div className="admin-filter-field">
                <span className="admin-filter-label">本周总结（图片）</span>
                <input
                  className="admin-filter-input"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await fileToDataUrl(file);
                    setWeeklyImage(url);
                  }}
                />
                {weeklyImage && (
                  <span className="admin-filter-label" style={{ marginTop: 4 }}>
                    已选图片
                  </span>
                )}
              </div>
            </div>

            <div className="admin-filter-field" style={{ marginTop: 10 }}>
              <span className="admin-filter-label">备注</span>
              <textarea
                className="admin-filter-input"
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="输入备注"
              />
            </div>

            <div className="admin-filter-actions" style={{ marginTop: 14, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setEditingId(null)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                style={{ marginLeft: 8 }}
                onClick={handleTradeSubmit}
              >
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. 交易员管理：从学员升级
function TradersPage() {
  const { students } = useStudentData();
  const { traders, addTrader } = useTraderData();

  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [level, setLevel] = useState("");
  const [accountType, setAccountType] = useState("");
  const [passDate, setPassDate] = useState("");

  function handleCreateTrader() {
    const base = students.find((s) => s.id === studentId);
    if (!base) {
      alert("请选择一名学员作为交易员来源");
      return;
    }
    addTrader({
      studentId: base.id,
      name: base.name,
      gender: base.gender,
      level,
      accountType,
      passDate
    });
    setShowForm(false);
    setStudentId("");
    setLevel("");
    setAccountType("");
    setPassDate("");
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>交易员管理</h1>
        <p className="admin-page-sub">从在训学员中升级产生交易员，并管理其基础信息。</p>
      </header>

      <FilterRow
        fields={[
          { label: "姓名", placeholder: "请输入姓名" },
          { label: "性别", placeholder: "请选择性别" },
          { label: "账户类型", placeholder: "请选择账户类型" }
        ]}
      />

      <div className="admin-actions-row">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          添加交易员
        </button>
      </div>

      {showForm && (
        <div className="admin-panel" style={{ marginBottom: 12 }}>
          <h2>从学员升级为交易员</h2>
          <div className="admin-filter-row" style={{ marginTop: 12 }}>
            <div className="admin-filter-field">
              <span className="admin-filter-label">选择学员</span>
              <select
                className="admin-filter-input fx-select"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">请选择学员</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-filter-field">
              <span className="admin-filter-label">人员等级</span>
              <input
                className="admin-filter-input"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="如：A/B/C 或 初级/高级"
              />
            </div>
            <div className="admin-filter-field">
              <span className="admin-filter-label">账户类型</span>
              <input
                className="admin-filter-input"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                placeholder="如：实盘/模拟/评估账户"
              />
            </div>
            <div className="admin-filter-field">
              <span className="admin-filter-label">考核通过时间</span>
              <input
                className="admin-filter-input"
                type="date"
                value={passDate}
                onChange={(e) => setPassDate(e.target.value)}
              />
            </div>
            <div className="admin-filter-actions">
              <button className="btn btn-primary" onClick={handleCreateTrader}>
                确定
              </button>
              <button
                className="btn btn-outline"
                style={{ marginLeft: 8 }}
                onClick={() => setShowForm(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <Table
        columns={["ID", "姓名", "考核通过时间", "性别", "等级", "账户类型", "操作"]}
        rows={traders.map((t) => [
          t.id,
          t.name,
          t.passDate || "-",
          t.gender === "male" ? "男" : t.gender === "female" ? "女" : "保密",
          t.level || "-",
          t.accountType || "-",
          "编辑（预留）"
        ])}
      />
    </div>
  );
}

// 4. 团队长管理（仍示意，后续可按 Trader 数据升级）
function LeadersPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>团队长管理</h1>
        <p className="admin-page-sub">管理团队长基本信息与团队成立时间（当前为示意，后续可基于交易员数据扩展）。</p>
      </header>

      <FilterRow
        fields={[
          { label: "姓名", placeholder: "请输入姓名" },
          { label: "性别", placeholder: "请选择性别" },
          { label: "日期", placeholder: "请选择日期" }
        ]}
      />

      <div className="admin-actions-row">
        <button className="btn btn-primary">添加团队（预留）</button>
      </div>

      <Table
        columns={["ID", "姓名", "团队成立时间", "性别", "年龄", "操作"]}
        rows={[["1", "王五", "2024-07-01", "男", "32", "编辑"]]}
      />
    </div>
  );
}

// 5. 团队长交易管理（暂与团队长管理结构一致，占位）
function LeaderTradesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>团队长交易管理</h1>
        <p className="admin-page-sub">用于后续扩展团队长维度的交易表现统计。</p>
      </header>

      <FilterRow
        fields={[
          { label: "姓名", placeholder: "请输入姓名" },
          { label: "性别", placeholder: "请选择性别" },
          { label: "日期", placeholder: "请选择日期" }
        ]}
      />

      <div className="admin-actions-row">
        <button className="btn btn-primary">添加团队长（预留）</button>
      </div>

      <Table
        columns={["ID", "姓名", "团队成立时间", "性别", "年龄", "操作"]}
        rows={[["1", "王五", "2024-07-01", "男", "32", "编辑"]]}
      />
    </div>
  );
}

// 6. 劝退学员管理（使用与在训学员共享的数据源）
function DismissedPage() {
  const { dismissed, restoreStudent, deleteDismissed, batchDelete, batchRestore } = useStudentData();
  const [selected, setSelected] = useState<string[]>([]);

  const allIds = dismissed.map((d) => d.id);
  const allChecked = selected.length > 0 && selected.length === allIds.length;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected((prev) => (prev.length === allIds.length ? [] : allIds));
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>劝退学员管理</h1>
        <p className="admin-page-sub">已劝退学员的回收站，可恢复或永久删除。当前数据保存在浏览器本地。</p>
      </header>

      <div className="admin-actions-row">
        <button
          className="btn btn-outline"
          disabled={selected.length === 0}
          onClick={() => {
            batchRestore(selected);
            setSelected([]);
          }}
        >
          批量恢复
        </button>
        <button
          className="btn btn-primary"
          style={{ marginLeft: 8 }}
          disabled={selected.length === 0}
          onClick={() => {
            if (!window.confirm("确定要永久删除选中的学员吗？该操作不可恢复。")) return;
            batchDelete(selected);
            setSelected([]);
          }}
        >
          永久删除
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th>ID</th>
              <th>姓名</th>
              <th>培训起始时间</th>
              <th>性别</th>
              <th>删除时间</th>
              <th>删除原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {dismissed.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  暂无数据
                </td>
              </tr>
            ) : (
              dismissed.map((s) => (
                <tr key={s.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggle(s.id)}
                    />
                  </td>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.trainingStartDate}</td>
                  <td>{s.gender === "male" ? "男" : s.gender === "female" ? "女" : "保密"}</td>
                  <td>{new Date(s.dismissedAt).toLocaleString()}</td>
                  <td>{s.reason}</td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ paddingInline: 10, fontSize: 12 }}
                      onClick={() => restoreStudent(s.id)}
                    >
                      恢复
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ paddingInline: 10, fontSize: 12, marginLeft: 8 }}
                      onClick={() => {
                        if (!window.confirm("确定要永久删除该学员吗？")) return;
                        deleteDismissed(s.id);
                      }}
                    >
                      永久删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 通用小组件 -------------------------------------------------

function FilterRow(
  props: {
    fields: { label: string; placeholder: string }[];
  }
) {
  return (
    <section className="admin-filter-row">
      {props.fields.map((f) => (
        <div className="admin-filter-field" key={f.label}>
          <span className="admin-filter-label">{f.label}</span>
          <input className="admin-filter-input" placeholder={f.placeholder} />
        </div>
      ))}
      <div className="admin-filter-actions">
        <button className="btn btn-primary">查询</button>
        <button className="btn btn-outline" style={{ marginLeft: 8 }}>
          重置
        </button>
      </div>
    </section>
  );
}

function Table(props: { columns: string[]; rows: string[][] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {props.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.length === 0 ? (
            <tr>
              <td colSpan={props.columns.length} className="admin-table-empty">
                暂无数据
              </td>
            </tr>
          ) : (
            props.rows.map((r, idx) => (
              <tr key={idx}>
                {r.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
