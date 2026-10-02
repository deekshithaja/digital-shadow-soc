import React, { useContext, useState, useMemo, useEffect } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Server,
  KeyRound,
  Radio,
  Trash2,
  Search,
  ExternalLink,
  AlertOctagon,
  RefreshCw,
  LogOut,
  Fingerprint,
  Plus,
  CheckCircle2,
  EyeOff,
} from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [playbook, setPlaybook] = useState([]);
  const [loading, setLoading] = useState(true);

  // Operational form state
  const [form, setForm] = useState({
    platform: "",
    domain: "",
    category: "Productivity & Work",
    authMethod: "Master Password",
    mfaType: "Authenticator App (TOTP)",
    exposedVectorsInput: "",
    breached: false,
    oauthScopesInput: "",
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch telemetry & playbook items from MongoDB
  const fetchDashboardTelemetry = async () => {
    try {
      setLoading(true);
      const [footprintRes, playbookRes] = await Promise.all([
        API.get("/footprints"),
        API.get("/playbook"),
      ]);
      setAccounts(footprintRes.data);
      setPlaybook(playbookRes.data);
    } catch (err) {
      console.error("Failed to retrieve SOC telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardTelemetry();
  }, []);

  // Dynamic Telemetry Engine
  const metrics = useMemo(() => {
    const total = accounts.length;
    const breached = accounts.filter((a) => a.breached).length;

    const avgRisk =
      total > 0
        ? Math.round(
            accounts.reduce((acc, curr) => acc + (curr.riskScore || 20), 0) /
              total,
          )
        : 0;

    let posture = "DEFENSIBLE";
    let postureColor = "var(--cyber-emerald)";
    if (avgRisk > 65) {
      posture = "HIGH EXPOSURE HAZARD";
      postureColor = "var(--cyber-rose)";
    } else if (avgRisk > 40) {
      posture = "MODERATE ATTACK SURFACE";
      postureColor = "var(--cyber-amber)";
    }

    return { total, breached, avgRisk, posture, postureColor };
  }, [accounts]);

  // Filtered accounts list
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.exposedVectors || []).some((v) =>
          v.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesFilter =
        selectedSeverityFilter === "ALL" ||
        (acc.riskRating || "").toUpperCase() ===
          selectedSeverityFilter.toUpperCase();

      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchQuery, selectedSeverityFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Persist footprint to MongoDB Atlas
  const handleCreateTelemetryRecord = async (e) => {
    e.preventDefault();
    if (!form.platform.trim()) return;

    let computedRisk = 25;
    if (form.breached) computedRisk += 40;
    if (form.mfaType === "Disabled") computedRisk += 25;
    if (form.mfaType.includes("SMS")) computedRisk += 15;
    if (
      form.exposedVectorsInput.toLowerCase().includes("password") ||
      form.exposedVectorsInput.toLowerCase().includes("hash")
    )
      computedRisk += 15;

    const finalRisk = Math.min(99, Math.max(12, computedRisk));
    const rating =
      finalRisk > 75
        ? "Critical"
        : finalRisk > 45
          ? "High"
          : finalRisk > 30
            ? "Medium"
            : "Low";

    const payload = {
      platform: form.platform,
      domain:
        form.domain || `${form.platform.toLowerCase().replace(/\s+/g, "")}.com`,
      category: form.category,
      authMethod: form.authMethod,
      mfaType: form.mfaType,
      exposedVectors: form.exposedVectorsInput
        ? form.exposedVectorsInput.split(",").map((s) => s.trim())
        : ["Identity Metadata", "Public Profile"],
      breached: form.breached,
      riskRating: rating,
      riskScore: finalRisk,
      oauthScopes: form.oauthScopesInput
        ? form.oauthScopesInput.split(",").map((s) => s.trim())
        : ["Basic Read"],
      lastRotated: new Date().toISOString().split("T")[0],
    };

    try {
      const { data } = await API.post("/footprints", payload);
      setAccounts((prev) => [data, ...prev]);
      setForm({
        platform: "",
        domain: "",
        category: "Productivity & Work",
        authMethod: "Master Password",
        mfaType: "Authenticator App (TOTP)",
        exposedVectorsInput: "",
        breached: false,
        oauthScopesInput: "",
      });
    } catch (err) {
      console.error("Failed to commit footprint to database", err);
    }
  };

  // Delete footprint from MongoDB Atlas
  const handleDeleteRecord = async (id) => {
    try {
      await API.delete(`/footprints/${id}`);
      setAccounts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Failed to purge footprint record", err);
    }
  };

  // Toggle playbook item state in MongoDB Atlas
  const handleToggleTask = async (dbId) => {
    try {
      const { data: updatedItem } = await API.patch(`/playbook/${dbId}/toggle`);
      setPlaybook((prev) =>
        prev.map((t) => (t._id === dbId ? updatedItem : t)),
      );
    } catch (err) {
      console.error("Failed to toggle playbook item", err);
    }
  };

  const handleSimulateSync = async () => {
    setIsRefreshing(true);
    await fetchDashboardTelemetry();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div style={css.root}>
      {/* 1. STATUS BAR */}
      <div style={css.statusStrip}>
        <div style={css.statusGroup}>
          <div style={css.pulseDot}></div>
          <span style={css.statusText}>
            SOC TELEMETRY:{" "}
            <strong style={{ color: "var(--cyber-emerald)" }}>
              ACTIVE MONITORING
            </strong>
          </span>
          <span style={css.stripDivider}>|</span>
          <span style={css.statusText}>
            NODE: <strong>BENGALURU-CLUSTER-04</strong>
          </span>
          <span style={css.stripDivider}>|</span>
          <span style={css.statusText}>
            LATENCY: <strong>14ms</strong>
          </span>
        </div>
        <div style={css.statusGroup}>
          <span style={css.statusText}>
            CVSS RISK STANDARD: <strong>v3.1 ALIGNED</strong>
          </span>
        </div>
      </div>

      {/* 2. COMMAND HEADER */}
      <header style={css.header}>
        <div style={css.brandBlock}>
          <div style={css.brandIcon}>
            <Fingerprint size={24} color="var(--cyber-cyan)" />
          </div>
          <div>
            <div style={css.brandTitle}>
              DIGITAL SHADOW{" "}
              <span style={css.brandBadge}>SOC ANALYST SUITE</span>
            </div>
            <div style={css.brandDesc}>
              Perimeter Privacy Intelligence & Attack Surface Management
            </div>
          </div>
        </div>

        <div style={css.operatorBlock}>
          <div style={css.operatorMeta}>
            <span style={css.operatorName}>{user?.name}</span>
            <span style={css.operatorOrg}>{user?.email}</span>
          </div>
          <button
            onClick={handleSimulateSync}
            style={css.iconActionBtn}
            title="Sync Nodes"
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
              color="var(--text-muted)"
            />
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={css.logoutBtn}
          >
            <LogOut size={14} /> Terminate Session
          </button>
        </div>
      </header>

      {/* 3. METRIC GAUGES STRIP */}
      <main style={css.mainContainer}>
        <section style={css.metricStrip}>
          <div style={css.gaugeCard}>
            <div style={css.cardTop}>
              <span style={css.cardTitle}>AGGREGATE ATTACK SURFACE</span>
              <ShieldAlert size={18} color={metrics.postureColor} />
            </div>
            <div style={{ ...css.hugeScore, color: metrics.postureColor }}>
              {metrics.avgRisk}
              <span style={{ fontSize: "20px", color: "var(--text-dim)" }}>
                /100
              </span>
            </div>
            <div style={css.gaugeStatus}>
              <span
                style={{
                  ...css.indicatorPill,
                  backgroundColor: `${metrics.postureColor}22`,
                  color: metrics.postureColor,
                  borderColor: metrics.postureColor,
                }}
              >
                {metrics.posture}
              </span>
            </div>
          </div>

          <div style={css.gaugeCard}>
            <div style={css.cardTop}>
              <span style={css.cardTitle}>IDENTITIES & PLATFORMS</span>
              <Server size={18} color="var(--cyber-blue)" />
            </div>
            <div style={css.hugeScore}>{metrics.total}</div>
            <div style={css.cardFootnote}>
              <span style={{ color: "var(--cyber-emerald)" }}>
                Persistent cloud records
              </span>{" "}
              stored in MongoDB
            </div>
          </div>

          <div style={css.gaugeCard}>
            <div style={css.cardTop}>
              <span style={css.cardTitle}>ACTIVE BREACH SIGNATURES</span>
              <AlertOctagon size={18} color="var(--cyber-rose)" />
            </div>
            <div
              style={{
                ...css.hugeScore,
                color:
                  metrics.breached > 0
                    ? "var(--cyber-rose)"
                    : "var(--cyber-emerald)",
              }}
            >
              {metrics.breached}
            </div>
            <div style={css.cardFootnote}>
              {metrics.breached > 0 ? (
                <span style={{ color: "var(--cyber-rose)" }}>
                  Critical: Password invalidation advised
                </span>
              ) : (
                <span style={{ color: "var(--cyber-emerald)" }}>
                  Zero known exposure vectors detected
                </span>
              )}
            </div>
          </div>

          <div style={css.gaugeCard}>
            <div style={css.cardTop}>
              <span style={css.cardTitle}>PLAYBOOK RESOLUTION</span>
              <CheckCircle2 size={18} color="var(--cyber-cyan)" />
            </div>
            <div style={{ ...css.hugeScore, color: "var(--cyber-cyan)" }}>
              {playbook.filter((p) => p.done).length} / {playbook.length}
            </div>
            <div style={css.cardFootnote}>
              Hygiene countermeasures verified this cycle
            </div>
          </div>
        </section>

        {/* 4. MAIN LAYOUT */}
        <div style={css.dashboardLayout}>
          {/* LEFT: INTAKE & INVENTORY */}
          <section style={css.leftDeck}>
            <div style={css.panel}>
              <div style={css.panelHeader}>
                <div>
                  <h2 style={css.panelHeading}>
                    Ingest New Digital Footprint Node
                  </h2>
                  <p style={css.panelSubheading}>
                    Register an account or 3rd-party integration to calculate
                    exposure.
                  </p>
                </div>
                <KeyRound size={20} color="var(--cyber-cyan)" />
              </div>

              <form
                onSubmit={handleCreateTelemetryRecord}
                style={css.intakeForm}
              >
                <div style={css.formGrid}>
                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>
                      PLATFORM / ENTITY NAME *
                    </label>
                    <input
                      type="text"
                      name="platform"
                      placeholder="e.g. AWS, Slack, Dropbox, Spotify"
                      value={form.platform}
                      onChange={handleInputChange}
                      required
                      style={css.primaryInput}
                    />
                  </div>

                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>ENDPOINT DOMAIN</label>
                    <input
                      type="text"
                      name="domain"
                      placeholder="e.g. platform.com"
                      value={form.domain}
                      onChange={handleInputChange}
                      style={css.primaryInput}
                    />
                  </div>
                </div>

                <div style={css.formGrid}>
                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>SERVICE ARCHETYPE</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
                      style={css.primarySelect}
                    >
                      <option>Cloud Infrastructure</option>
                      <option>Productivity & Work</option>
                      <option>Financial Vault & Banking</option>
                      <option>Social Intelligence</option>
                      <option>Developer Operations</option>
                      <option>E-Commerce</option>
                      <option>Communication & VoIP</option>
                    </select>
                  </div>

                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>
                      AUTHENTICATION DISCIPLINE
                    </label>
                    <select
                      name="authMethod"
                      value={form.authMethod}
                      onChange={handleInputChange}
                      style={css.primarySelect}
                    >
                      <option>Master Password (Independent)</option>
                      <option>FIDO2 Hardware Key</option>
                      <option>Federated Identity (Google OAuth)</option>
                      <option>Federated Identity (Apple ID)</option>
                      <option>Personal API Token / Webhook</option>
                      <option>Legacy Reused Password</option>
                    </select>
                  </div>
                </div>

                <div style={css.formGrid}>
                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>
                      MFA ENFORCEMENT PROTOCOL
                    </label>
                    <select
                      name="mfaType"
                      value={form.mfaType}
                      onChange={handleInputChange}
                      style={css.primarySelect}
                    >
                      <option>FIDO2 / WebAuthn Hardware</option>
                      <option>Authenticator App (TOTP)</option>
                      <option>Push Notification (Number Match)</option>
                      <option>SMS OTP (Vulnerable to SIM-Swap)</option>
                      <option>Disabled (Critical Exposure)</option>
                    </select>
                  </div>

                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>DATA COMPROMISE STATUS</label>
                    <div style={css.breachCheckboxArea}>
                      <label style={css.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="breached"
                          checked={form.breached}
                          onChange={handleInputChange}
                          style={css.checkboxElement}
                        />
                        <span
                          style={{
                            color: form.breached
                              ? "var(--cyber-rose)"
                              : "var(--text-muted)",
                          }}
                        >
                          Flag as Past Known Breach / Exfiltration Target
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div style={css.formGrid}>
                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>
                      EXPOSED DATA ASSETS (COMMA SEPARATED)
                    </label>
                    <input
                      type="text"
                      name="exposedVectorsInput"
                      placeholder="e.g. Phone Number, Credit Card, GPS Coordinates"
                      value={form.exposedVectorsInput}
                      onChange={handleInputChange}
                      style={css.primaryInput}
                    />
                  </div>

                  <div style={css.inputFieldGroup}>
                    <label style={css.inputLabel}>
                      AUTHORIZED OAUTH SCOPES
                    </label>
                    <input
                      type="text"
                      name="oauthScopesInput"
                      placeholder="e.g. read:profile, write:messages"
                      value={form.oauthScopesInput}
                      onChange={handleInputChange}
                      style={css.primaryInput}
                    />
                  </div>
                </div>

                <div style={css.formSubmitRow}>
                  <div style={css.formHint}>
                    * Footprints and mitigations sync directly to MongoDB Atlas.
                  </div>
                  <button type="submit" style={css.submitTelemetryBtn}>
                    <Plus size={16} /> COMMIT TO ATTACK SURFACE INVENTORY
                  </button>
                </div>
              </form>
            </div>

            {/* INVENTORY VIEWER */}
            <div style={css.panel}>
              <div style={css.inventoryControls}>
                <div style={css.searchWrapper}>
                  <Search
                    size={15}
                    color="var(--text-dim)"
                    style={css.searchIcon}
                  />
                  <input
                    type="text"
                    placeholder="Search by platform name, domain, exposed vector..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={css.inventorySearchInput}
                  />
                </div>

                <div style={css.filterPills}>
                  {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedSeverityFilter(lvl)}
                      style={{
                        ...css.pillBtn,
                        backgroundColor:
                          selectedSeverityFilter === lvl
                            ? "var(--cyber-blue)"
                            : "var(--bg-input)",
                        color:
                          selectedSeverityFilter === lvl
                            ? "#fff"
                            : "var(--text-dim)",
                        borderColor:
                          selectedSeverityFilter === lvl
                            ? "var(--cyber-blue)"
                            : "var(--border-subtle)",
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIST OF ASSETS */}
              <div style={css.recordsList}>
                {loading ? (
                  <div style={css.emptyState}>
                    Loading telemetry data from MongoDB...
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div style={css.emptyState}>
                    No footprint records correlate with current telemetry
                    filter.
                  </div>
                ) : (
                  filteredAccounts.map((item) => (
                    <div key={item._id} style={css.recordCard}>
                      <div style={css.recordTop}>
                        <div style={css.recordIdent}>
                          <div style={css.recordId}>
                            {item._id
                              ? item._id.slice(-6).toUpperCase()
                              : "NODE"}
                          </div>
                          <h3 style={css.recordName}>{item.platform}</h3>
                          <span style={css.recordDomain}>{item.domain}</span>
                          <span style={css.recordCategoryBadge}>
                            {item.category}
                          </span>
                        </div>

                        <div
                          style={{
                            ...css.scoreBadge,
                            backgroundColor:
                              item.riskRating === "Critical"
                                ? "rgba(244,63,94,0.1)"
                                : "rgba(14,165,233,0.1)",
                            borderColor:
                              item.riskRating === "Critical"
                                ? "var(--cyber-rose)"
                                : "var(--cyber-blue)",
                            color:
                              item.riskRating === "Critical"
                                ? "var(--cyber-rose)"
                                : "var(--cyber-blue)",
                          }}
                        >
                          {item.riskRating?.toUpperCase()} RISK • SCORE{" "}
                          {item.riskScore}
                        </div>
                      </div>

                      <div style={css.recordDetailsGrid}>
                        <div style={css.detailItem}>
                          <span style={css.detailLabel}>
                            AUTH SPECIFICATION:
                          </span>
                          <span style={css.detailValue}>{item.authMethod}</span>
                        </div>

                        <div style={css.detailItem}>
                          <span style={css.detailLabel}>MFA LEVEL:</span>
                          <span
                            style={{
                              ...css.detailValue,
                              color:
                                item.mfaType === "Disabled"
                                  ? "var(--cyber-rose)"
                                  : "var(--text-main)",
                            }}
                          >
                            {item.mfaType}
                          </span>
                        </div>

                        <div style={css.detailItem}>
                          <span style={css.detailLabel}>LAST ROTATED:</span>
                          <span style={css.detailValue}>
                            {item.lastRotated}
                          </span>
                        </div>

                        <div style={css.detailItem}>
                          <span style={css.detailLabel}>BREACH RECORD:</span>
                          <span
                            style={{
                              ...css.detailValue,
                              color: item.breached
                                ? "var(--cyber-rose)"
                                : "var(--cyber-emerald)",
                            }}
                          >
                            {item.breached
                              ? "CONFIRMED EXFILTRATION"
                              : "CLEAN / UNREPORTED"}
                          </span>
                        </div>
                      </div>

                      <div style={css.vectorsArea}>
                        <span style={css.vectorsTitle}>EXPOSED VECTORS:</span>
                        <div style={css.tagCluster}>
                          {(item.exposedVectors || []).map((vec, i) => (
                            <span key={i} style={css.vectorTag}>
                              {vec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={css.recordFooter}>
                        <span style={css.recordTimestamp}>
                          Cloud Record Synchronized
                        </span>
                        <div style={css.recordActionGroup}>
                          {item.domain && (
                            <button
                              onClick={() =>
                                window.open(`https://${item.domain}`, "_blank")
                              }
                              style={css.recordActionBtn}
                            >
                              <ExternalLink size={13} /> Visit Node
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRecord(item._id)}
                            style={{
                              ...css.recordActionBtn,
                              color: "var(--cyber-rose)",
                            }}
                          >
                            <Trash2 size={13} /> Purge Record
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: PLAYBOOK & STATUTORY ERASURE */}
          <aside style={css.rightDeck}>
            <div style={css.panel}>
              <div style={css.panelHeader}>
                <div>
                  <h3 style={css.panelHeading}>
                    Active Incident Mitigation Playbook
                  </h3>
                  <p style={css.panelSubheading}>
                    Standard Operating Procedures (SOP) to decrease risk index.
                  </p>
                </div>
                <Radio size={18} color="var(--cyber-amber)" />
              </div>

              <div style={css.playbookList}>
                {playbook.map((step) => (
                  <div
                    key={step._id || step.taskId}
                    onClick={() => handleToggleTask(step._id)}
                    style={{
                      ...css.playbookCard,
                      borderColor: step.done
                        ? "var(--border-subtle)"
                        : "var(--border-focus)",
                      backgroundColor: step.done
                        ? "rgba(15, 23, 42, 0.4)"
                        : "var(--bg-card)",
                    }}
                  >
                    <div style={css.playbookTop}>
                      <span
                        style={{
                          ...css.severityTag,
                          backgroundColor:
                            step.severity === "CRITICAL"
                              ? "rgba(244,63,94,0.15)"
                              : "rgba(245,158,11,0.15)",
                          color:
                            step.severity === "CRITICAL"
                              ? "var(--cyber-rose)"
                              : "var(--cyber-amber)",
                        }}
                      >
                        {step.severity}
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(step.done)}
                        readOnly
                        style={css.taskCheckbox}
                      />
                    </div>
                    <div
                      style={{
                        ...css.playbookTitle,
                        textDecoration: step.done ? "line-through" : "none",
                        color: step.done
                          ? "var(--text-dim)"
                          : "var(--text-pure)",
                      }}
                    >
                      {step.title}
                    </div>
                    <div style={css.playbookDesc}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={css.panel}>
              <div style={css.panelHeader}>
                <div>
                  <h3 style={css.panelHeading}>
                    Statutory Data Erasure Protocol
                  </h3>
                  <p style={css.panelSubheading}>
                    Article 17 GDPR / CCPA Right-To-Be-Forgotten Generator
                  </p>
                </div>
                <EyeOff size={18} color="var(--cyber-purple)" />
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  lineHeight: "1.6",
                }}
              >
                Prepare pre-formatted legal notices to force vendors to delete
                dormant profiles, telemetry, and payment instruments
                permanently.
              </p>
              <div style={css.statutoryNoticeBox}>
                <code>
                  REQUEST FOR DATA DESTRUCTION (GDPR Art. 17 / CCPA § 1798.105)
                  <br />
                  <br />
                  Subject: Notice to Terminate Identity Record for [
                  {user?.email}]<br />
                  To: Data Protection Officer (DPO)
                  <br />
                  Demand: Immediate and irrevocable deletion of all personal
                  identifiers, tracking tokens, and transaction logs.
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `REQUEST FOR DATA DESTRUCTION (GDPR Art. 17 / CCPA § 1798.105)\nSubject: Notice to Terminate Identity Record for [${user?.email}]\nTo: Data Protection Officer (DPO)\nDemand: Immediate and irrevocable deletion of all personal identifiers, tracking tokens, and transaction logs.`,
                  );
                  alert(
                    `Copied GDPR Right-To-Be-Forgotten request drafted for ${user?.email}`,
                  );
                }}
                style={css.statutoryBtn}
              >
                Copy Legal Deletion Notice
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

// Styles
const css = {
  root: {
    minHeight: "100vh",
    backgroundColor: "var(--bg-core)",
    color: "var(--text-main)",
    fontFamily: "var(--font-sans)",
  },
  statusStrip: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 28px",
    backgroundColor: "#02050c",
    borderBottom: "1px solid #131d35",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
  },
  statusGroup: { display: "flex", alignItems: "center", gap: "12px" },
  pulseDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "var(--cyber-emerald)",
    boxShadow: "0 0 8px var(--cyber-emerald)",
  },
  statusText: { color: "var(--text-muted)" },
  stripDivider: { color: "#1e293b" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 28px",
    backgroundColor: "var(--bg-surface)",
    borderBottom: "1px solid var(--border-subtle)",
  },
  brandBlock: { display: "flex", alignItems: "center", gap: "14px" },
  brandIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    borderRadius: "8px",
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    border: "1px solid rgba(14, 165, 233, 0.25)",
  },
  brandTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "var(--text-pure)",
    letterSpacing: "0.8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandBadge: {
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    color: "var(--cyber-cyan)",
    border: "1px solid rgba(14, 165, 233, 0.3)",
  },
  brandDesc: { fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" },
  operatorBlock: { display: "flex", alignItems: "center", gap: "16px" },
  operatorMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  operatorName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--text-pure)",
  },
  operatorOrg: {
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-dim)",
  },
  iconActionBtn: {
    background: "none",
    border: "1px solid var(--border-subtle)",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "#1e293b",
    color: "var(--text-main)",
    border: "1px solid #334155",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  mainContainer: { maxWidth: "1540px", margin: "0 auto", padding: "24px 28px" },
  metricStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
    marginBottom: "28px",
  },
  gaugeCard: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "10px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    fontWeight: "700",
    color: "var(--text-dim)",
    letterSpacing: "0.8px",
  },
  hugeScore: {
    fontSize: "34px",
    fontWeight: "800",
    fontFamily: "var(--font-mono)",
    letterSpacing: "-1px",
    margin: "12px 0 6px 0",
  },
  gaugeStatus: { marginTop: "4px" },
  indicatorPill: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: "700",
    fontFamily: "var(--font-mono)",
    padding: "3px 8px",
    borderRadius: "4px",
    border: "1px solid",
  },
  cardFootnote: { fontSize: "12px", color: "var(--text-dim)" },
  dashboardLayout: {
    display: "grid",
    gridTemplateColumns: "2.2fr 1fr",
    gap: "24px",
    alignItems: "start",
  },
  leftDeck: { display: "flex", flexDirection: "column", gap: "24px" },
  rightDeck: { display: "flex", flexDirection: "column", gap: "24px" },
  panel: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "12px",
    padding: "22px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  panelHeading: {
    fontSize: "15px",
    fontWeight: "700",
    color: "var(--text-pure)",
    letterSpacing: "-0.3px",
  },
  panelSubheading: {
    fontSize: "12px",
    color: "var(--text-muted)",
    marginTop: "3px",
  },
  intakeForm: { display: "flex", flexDirection: "column", gap: "14px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  inputFieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  inputLabel: {
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    fontWeight: "700",
    color: "var(--text-dim)",
    letterSpacing: "0.6px",
  },
  primaryInput: {
    padding: "10px 12px",
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    color: "var(--text-main)",
    fontSize: "13px",
    outline: "none",
  },
  primarySelect: {
    padding: "10px 12px",
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    color: "var(--text-main)",
    fontSize: "13px",
    outline: "none",
  },
  breachCheckboxArea: {
    padding: "9px 12px",
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    cursor: "pointer",
  },
  checkboxElement: { accentColor: "var(--cyber-rose)", cursor: "pointer" },
  formSubmitRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "6px",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-subtle)",
  },
  formHint: { fontSize: "11px", color: "var(--text-dim)", maxWidth: "55%" },
  submitTelemetryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    backgroundColor: "var(--cyber-blue)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "var(--font-mono)",
    fontWeight: "700",
    cursor: "pointer",
  },
  inventoryControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "14px",
  },
  searchWrapper: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
  },
  searchIcon: { position: "absolute", left: "12px" },
  inventorySearchInput: {
    width: "100%",
    padding: "8px 12px 8px 36px",
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    color: "var(--text-main)",
    fontSize: "12px",
    outline: "none",
  },
  filterPills: { display: "flex", gap: "6px" },
  pillBtn: {
    padding: "6px 12px",
    border: "1px solid",
    borderRadius: "6px",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },
  recordsList: { display: "flex", flexDirection: "column", gap: "12px" },
  emptyState: {
    padding: "30px",
    textAlign: "center",
    color: "var(--text-dim)",
    fontSize: "13px",
    border: "1px dashed var(--border-subtle)",
    borderRadius: "8px",
  },
  recordCard: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "8px",
    padding: "16px 18px",
  },
  recordTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  recordIdent: { display: "flex", alignItems: "center", gap: "10px" },
  recordId: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--cyber-cyan)",
    backgroundColor: "rgba(6,182,212,0.1)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  recordName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "var(--text-pure)",
  },
  recordDomain: {
    fontSize: "12px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-dim)",
  },
  recordCategoryBadge: {
    fontSize: "11px",
    padding: "2px 8px",
    backgroundColor: "#1e293b",
    color: "var(--text-muted)",
    borderRadius: "4px",
  },
  scoreBadge: {
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "4px",
    border: "1px solid",
  },
  recordDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    padding: "10px 0",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    marginBottom: "12px",
  },
  detailItem: { display: "flex", flexDirection: "column", gap: "2px" },
  detailLabel: {
    fontSize: "9px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-dim)",
  },
  detailValue: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-main)",
  },
  vectorsArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  vectorsTitle: {
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-dim)",
  },
  tagCluster: { display: "flex", gap: "6px", flexWrap: "wrap" },
  vectorTag: {
    fontSize: "11px",
    padding: "2px 8px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#fda4af",
    borderRadius: "4px",
  },
  recordFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "14px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.03)",
  },
  recordTimestamp: { fontSize: "11px", color: "var(--text-dim)" },
  recordActionGroup: { display: "flex", gap: "10px" },
  recordActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "12px",
    cursor: "pointer",
  },
  playbookList: { display: "flex", flexDirection: "column", gap: "10px" },
  playbookCard: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "12px 14px",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  playbookTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  severityTag: {
    fontSize: "9px",
    fontFamily: "var(--font-mono)",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  taskCheckbox: {
    accentColor: "var(--cyber-emerald)",
    width: "15px",
    height: "15px",
    cursor: "pointer",
  },
  playbookTitle: { fontSize: "13px", fontWeight: "600", marginBottom: "3px" },
  playbookDesc: {
    fontSize: "11px",
    color: "var(--text-dim)",
    lineHeight: "1.4",
  },
  statutoryNoticeBox: {
    backgroundColor: "var(--bg-input)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    padding: "12px",
    margin: "12px 0",
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-dim)",
    lineHeight: "1.4",
    maxHeight: "130px",
    overflowY: "auto",
  },
  statutoryBtn: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1e1b4b",
    border: "1px solid #4338ca",
    borderRadius: "6px",
    color: "#c7d2fe",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default Dashboard;
