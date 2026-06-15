"use client";

import { useState, useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";
import { Plus, Trash2, FileText } from "lucide-react";
import { getProposalTemplates, uploadProposalTemplate, deleteProposalTemplate } from "@/actions/aiActions";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const TABS = ["Pengguna", "Scraper Config", "Templates"];

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Pengguna");

  // Users State
  const { data: users } = useSWR("/api/users", fetcher);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "engineer" });

  // Settings State
  const { data: settingsData } = useSWR("/api/settings", fetcher);
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
      setTimeout(() => {
        setScraperSettings(settingsData.scraperSettings || []);
        setAppSettings(settingsData.appSettings || {});
      }, 0);
    }
  }, [settingsData]);

  function getInitials(name = "") {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  async function loadTemplates() {
    setIsLoadingTemplates(true);
    const res = await getProposalTemplates();
    console.log("res data", res)
    if (res.success) {
      setTemplates(res.data.data || []);
    } else {
      console.error("Failed to load templates:", res.error);
    }
    setIsLoadingTemplates(false);
  }

  useEffect(() => {
    if (activeTab === "Templates") {
      setTimeout(loadTemplates, 0);
    }
  }, [activeTab]);

  async function handleUploadTemplate(e) {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

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
    <div className="h-full overflow-y-auto">
      <div className="mb-5 flex gap-0.5 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`border-b-2 px-4 py-2 font-mono text-[13.5px] transition-colors ${activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pengguna */}
      {activeTab === "Pengguna" && (
        <div>
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setIsAddingUser(!isAddingUser)}>
              <Plus size={14} strokeWidth={2.2} />
              {isAddingUser ? "Cancel" : "Tambah User"}
            </Button>
          </div>

          {isAddingUser && (
            <div className="mb-5 rounded-[14px] border border-border bg-surface p-5">
              <form onSubmit={handleAddUser} className="flex items-end gap-3">
                <div className="flex-1">
                  <Label>Name</Label>
                  <Input required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div className="flex-1">
                  <Label>Email</Label>
                  <Input type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div className="w-30">
                  <Label>Role</Label>
                  <Select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="engineer">Engineer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <Button type="submit" size="sm">Save</Button>
              </form>
            </div>
          )}

          <div className="rounded-[14px] border border-border bg-surface p-5">
            {!users ? (
              <p className="py-4 text-sm text-foreground-muted">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="py-4 text-sm text-foreground-muted">No users found.</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b border-border py-2.75 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-[13px] text-white">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-foreground">{user.name}</div>
                      <div className="mt-0.5 text-xs text-foreground-muted">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="kejar">{user.role}</Badge>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-danger hover:text-danger-hover" title="Delete User">
                      <Trash2 size={16} strokeWidth={2} />
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
          <div className="rounded-[14px] border border-border bg-surface p-5">
            {!settingsData ? (
              <p className="py-4 text-sm text-foreground-muted">Loading settings...</p>
            ) : (
              <>
                {scraperSettings.map((scraper, idx) => (
                  <div key={scraper.id} className="flex items-center justify-between border-b border-border py-2.75 last:border-0">
                    <div>
                      <div className="text-[13.5px] font-medium text-foreground">{scraper.targetName} interval (hours)</div>
                      <div className="mt-0.5 text-xs text-foreground-muted">Frekuensi scraping {scraper.targetName}</div>
                    </div>
                    <Input
                      type="number"
                      className="w-24 text-center"
                      value={scraper.cronSchedule}
                      onChange={(e) => {
                        const newScrapers = [...scraperSettings];
                        newScrapers[idx].cronSchedule = e.target.value;
                        setScraperSettings(newScrapers);
                      }}
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between border-b border-border py-2.75 last:border-0">
                  <div>
                    <div className="text-[13.5px] font-medium text-foreground">Match score threshold</div>
                    <div className="mt-0.5 text-xs text-foreground-muted">Skor minimum untuk rekomendasi KEJAR (0-100)</div>
                  </div>
                  <Input
                    type="number"
                    className="w-24 text-center"
                    value={appSettings["MATCH_SCORE_THRESHOLD"] || ""}
                    onChange={(e) => setAppSettings({ ...appSettings, MATCH_SCORE_THRESHOLD: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between border-0 py-2.75">
                  <div>
                    <div className="text-[13.5px] font-medium text-foreground">Max tender per run</div>
                    <div className="mt-0.5 text-xs text-foreground-muted">Batas maksimum tender per proses scrape</div>
                  </div>
                  <Input
                    type="number"
                    className="w-24 text-center"
                    value={appSettings["MAX_TENDER_PER_RUN"] || ""}
                    onChange={(e) => setAppSettings({ ...appSettings, MAX_TENDER_PER_RUN: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={handleSaveSettings} loading={isSavingSettings} disabled={!settingsData}>
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      )}

      {/* Templates */}
      {activeTab === "Templates" && (
        <div>
          <div className="mb-3 flex justify-end">
            <form onSubmit={handleUploadTemplate} className="flex items-center gap-3">
              <input
                type="file"
                accept=".docx"
                ref={fileInputRef}
                required
                className="cursor-pointer text-sm file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-92"
              />
              <Button type="submit" size="sm" loading={isUploading}>
                Upload Template
              </Button>
            </form>
          </div>

          <div className="rounded-[14px] border border-border bg-surface p-5">
            {isLoadingTemplates ? (
              <p className="py-4 text-sm text-foreground-muted">Memuat templates...</p>
            ) : templates.length === 0 ? (
              <p className="py-4 text-sm text-foreground-muted">Belum ada template proposal.</p>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between border-b border-border py-2.75 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-hover text-foreground">
                      <FileText size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-foreground">{tpl.name}</div>
                      <div className="mt-0.5 text-xs text-foreground-muted">Dibuat: {new Date(tpl.created_at).toLocaleDateString("id-ID")}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteTemplate(tpl.id)} className="text-danger hover:text-danger-hover" title="Hapus Template">
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
