/* ============================================================
   Catalyst :: App — routing + global tender state
   ============================================================ */
const { useState: useStateA, useCallback: useCallbackA } = React;

function App() {
  const C = window.CATALYST;
  const [authed, setAuthed] = useStateA(false);
  const [user, setUser] = useStateA(C.USERS[0]);
  const [route, setRoute] = useStateA({ name: "tenders" });
  const [view, setView] = useStateA("list");
  const [tenders, setTenders] = useStateA(C.TENDERS);

  const navigate = useCallbackA((r) => { setRoute(r); window.scrollTo({ top: 0 }); }, []);

  const onLogin = (email) => {
    const u = C.USERS.find((x) => x.email === email) || C.USERS[0];
    setUser(u); setAuthed(true); setRoute({ name: "tenders" });
  };
  const onLogout = () => setAuthed(false);

  const setStatus = (id, status) => setTenders((ts) => ts.map((t) => {
    if (t.id !== id) return t;
    const history = [...t.history, { status, at: new Date().toISOString().slice(0, 19), by: user.name }];
    return { ...t, status, history };
  }));
  const promote = (id) => setStatus(id, "DITINJAU");
  const addNote = (id, text) => setTenders((ts) => ts.map((t) =>
    t.id === id ? { ...t, notes: [...t.notes, { author: user.name, role: C.ROLE_LABELS[user.role], at: new Date().toISOString().slice(0, 19), text }] } : t));
  const createTender = (f) => {
    const id = "TND-" + (2060 + tenders.length);
    const nt = {
      id, source: f.source, title: f.title, agency: f.agency,
      kbliMatched: [], score: null, deadline: f.deadline || null,
      budget: f.budget ? +f.budget : null, status: "DITEMUKAN",
      notes: [], history: [{ status: "DITEMUKAN", at: new Date().toISOString().slice(0, 19), by: user.name }],
      foundAt: new Date().toISOString().slice(0, 19), url: f.url || null,
      tenderText: f.text || "Tender input manual — belum ada deskripsi terperinci.",
      requirements: ["Persyaratan akan dilengkapi setelah review dokumen."],
    };
    setTenders((ts) => [nt, ...ts]);
  };

  const current = route.tenderId ? tenders.find((t) => t.id === route.tenderId) : null;

  if (!authed) return <LoginScreen onLogin={onLogin} />;

  let screen;
  if (route.name === "tenders") screen = <TendersScreen tenders={tenders} navigate={navigate} view={view} setView={setView} onPromote={promote} onMove={setStatus} onCreate={createTender} />;
  else if (route.name === "detail" && current) screen = <DetailScreen tender={current} navigate={navigate} onStatusChange={setStatus} onAddNote={addNote} />;
  else if (route.name === "proposal" && current) screen = <ProposalScreen tender={current} navigate={navigate} />;
  else if (route.name === "kbli") screen = <KbliScreen />;
  else if (route.name === "scraper") screen = <ScraperLogScreen />;
  else if (route.name === "settings") screen = <SettingsScreen user={user} />;
  else screen = <TendersScreen tenders={tenders} navigate={navigate} view={view} setView={setView} onPromote={promote} onMove={setStatus} onCreate={createTender} />;

  return (
    <AppShell route={route} navigate={navigate} user={user} onLogout={onLogout}>
      {screen}
    </AppShell>
  );
}

function Root() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
