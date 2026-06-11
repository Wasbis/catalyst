"use client";

import { useState, useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";
import { getProposalTemplates, uploadProposalTemplate, deleteProposalTemplate } from "@/actions/aiActions";

const TABS = ["Pengguna", "Scraper Config", "Templates"];

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Pengguna");

  // Users State
  const { data: users, error: usersError } = useSWR("/api/users", fetcher);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "engineer" });

  // Settings State
  const { data: settingsData, error: settingsError } = useSWR("/api/settings", fetcher);
  const [scraperSettings, setScraperSettings] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settingsData) {
      setScraperSettings(settingsData.scraperSettings || []);
      setAppSettings(settingsData.appSettings || {});
    }
  }, [settingsData]);

  function getInitials(name = "") {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  async function loadTemplates() {
    setIsLoadingTemplates(true);
    const res = await getProposalTemplates();
    if (res.success) {
      setTemplates(res.data || []);
    } else {
      console.error("Failed to load templates:", res.error);
    }
    setIsLoadingTemplates(false);
  }

  useEffect(() => {
    if (activeTab === "Templates") {
      loadTemplates();
    }
  }, [activeTab]);

  async function handleUploadTemplate(e) {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);
    // Optional: description could be added to formData if we had an input

    setIsUploading(true);
    const res = await uploadProposalTemplate(formData);
    setIsUploading(false);

    if (res.success) {
      fileInputRef.current.value = "";
      loadTemplates();
    } else {
      alert("Gagal mengunggah template: " + res.error);
    }
  }

  async function handleDeleteTemplate(id) {
    if (!confirm("Hapus template ini?")) return;
    const res = await deleteProposalTemplate(id);
    if (res.success) {
      loadTemplates();
    } else {
      alert("Gagal menghapus: " + res.error);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setNewUser({ name: "", email: "", role: "engineer" });
        setIsAddingUser(false);
        mutate("/api/users");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        mutate("/api/users");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveSettings() {
    setIsSavingSettings(true);
    try {
      const appSettingsArray = Object.entries(appSettings).map(([key, value]) => ({ key, value }));

      const payload = {
        appSettings: appSettingsArray,
        scraperSettings: scraperSettings,
      };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        mutate("/api/settings");
        alert("Settings saved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="settings-tabs">
        {TABS.map((tab) => (
          <button key={tab} className={`settings-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Pengguna */}
      {activeTab === "Pengguna" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button className="btn btn-primary btn-sm" style={{ gap: 6 }} onClick={() => setIsAddingUser(!isAddingUser)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              {isAddingUser ? "Cancel" : "Tambah User"}
            </button>
          </div>

          {isAddingUser && (
            <div className="settings-section" style={{ marginBottom: 20 }}>
              <form onSubmit={handleAddUser} style={{ display: "flex", gap: 12, alignItems: "end" }}>
                <div style={{ flex: 1 }}>
                  <label className="settings-label">Name</label>
                  <input type="text" className="form-input w-full mt-1" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="settings-label">Email</label>
                  <input type="email" className="form-input w-full mt-1" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div style={{ width: 120 }}>
                  <label className="settings-label">Role</label>
                  <select className="form-input w-full mt-1" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="engineer">Engineer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm h-9">Save</button>
              </form>
            </div>
          )}

          <div className="settings-section">
            {!users ? (
              <p className="text-foreground-muted text-sm py-4">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-foreground-muted text-sm py-4">No users found.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),#4f46e5)", color: "#fff", fontWeight: 800, fontSize: 13, display: "grid", placeItems: "center" }}>
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="settings-label">{user.name}</div>
                      <div className="settings-hint">{user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span className="badge badge-violet">{user.role}</span>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-danger hover:text-danger-hover" title="Delete User">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Scraper Config */}
      {activeTab === "Scraper Config" && (
        <div>
          <div className="settings-section">
            {!settingsData ? (
              <p className="text-foreground-muted text-sm py-4">Loading settings...</p>
            ) : (
              <>
                {scraperSettings.map((scraper, idx) => (
                  <div key={scraper.id} className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="settings-label">{scraper.targetName} interval (hours)</div>
                      <div className="settings-hint">Frekuensi scraping {scraper.targetName}</div>
                    </div>
                    <div>
                      <input
                        type="number"
                        className="form-input w-24 text-center"
                        value={scraper.cronSchedule}
                        onChange={(e) => {
                          const newScrapers = [...scraperSettings];
                          newScrapers[idx].cronSchedule = e.target.value;
                          setScraperSettings(newScrapers);
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="settings-label">Match score threshold</div>
                    <div className="settings-hint">Skor minimum untuk rekomendasi KEJAR (0-100)</div>
                  </div>
                  <div>
                    <input
                      type="number"
                      className="form-input w-24 text-center"
                      value={appSettings["MATCH_SCORE_THRESHOLD"] || ""}
                      onChange={(e) => setAppSettings({ ...appSettings, MATCH_SCORE_THRESHOLD: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 0 }}>
                  <div>
                    <div className="settings-label">Max tender per run</div>
                    <div className="settings-hint">Batas maksimum tender per proses scrape</div>
                  </div>
                  <div>
                    <input
                      type="number"
                      className="form-input w-24 text-center"
                      value={appSettings["MAX_TENDER_PER_RUN"] || ""}
                      onChange={(e) => setAppSettings({ ...appSettings, MAX_TENDER_PER_RUN: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={isSavingSettings || !settingsData}
            >
              {isSavingSettings ? "Saving..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      )}

      {/* Templates */}
      {activeTab === "Templates" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <form onSubmit={handleUploadTemplate} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="file"
                accept=".docx"
                ref={fileInputRef}
                required
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-indigo-600 cursor-pointer"
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={isUploading}>
                {isUploading ? "Mengunggah..." : "Upload Template"}
              </button>
            </form>
          </div>

          <div className="settings-section">
            {isLoadingTemplates ? (
              <p className="text-foreground-muted text-sm py-4">Memuat templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-foreground-muted text-sm py-4">Belum ada template proposal.</p>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "8px", background: "var(--surface-hover)", color: "var(--foreground)", display: "grid", placeItems: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"></path><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"></path></svg>
                    </div>
                    <div>
                      <div className="settings-label">{tpl.name}</div>
                      <div className="settings-hint">Dibuat: {new Date(tpl.created_at).toLocaleDateString("id-ID")}</div>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => handleDeleteTemplate(tpl.id)} className="text-danger hover:text-danger-hover" title="Hapus Template">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
