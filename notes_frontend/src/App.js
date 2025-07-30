import React, { useState, useMemo } from "react";
import "./App.css";

// Theme colors
const COLORS = {
  primary: "#1976d2",
  secondary: "#424242",
  accent: "#ff9800",
  bg: "#ffffff",
  text: "#282c34",
  sidebarBG: "#f8f9fa",
  border: "#e9ecef",
  sidebarActive: "rgba(25, 118, 210, 0.12)"
};

// PUBLIC_INTERFACE
function App() {
  // State shape: [{id, title, content, created, edited}]
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Search and filter notes
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return [...notes].sort((a, b) => b.edited - a.edited);
    return notes
      .filter(
        n =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.edited - a.edited);
  }, [notes, search]);

  // Selected note
  const selectedNote = notes.find(n => n.id === selectedId);

  // PUBLIC_INTERFACE
  function handleCreateNote() {
    const newNote = {
      id: Date.now() + Math.random(),
      title: "Untitled Note",
      content: "",
      created: Date.now(),
      edited: Date.now()
    };
    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
    setIsEditing(true);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (window.confirm("Delete this note?")) {
      setNotes(notes.filter(n => n.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setIsEditing(false);
      }
    }
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(editedNote) {
    setNotes(notes =>
      notes.map(n =>
        n.id === editedNote.id ? { ...editedNote, edited: Date.now() } : n
      )
    );
    setIsEditing(false);
  }

  function handleSelectNote(id) {
    setSelectedId(id);
    setIsEditing(false);
    setSidebarOpen(false);
  }

  function handleEditNote(id) {
    setSelectedId(id);
    setIsEditing(true);
    setSidebarOpen(false);
  }

  // Render ----------
  return (
    <div className="nk-root" style={{ background: COLORS.bg, color: COLORS.text }}>
      <TopBar
        onSidebarToggle={() => setSidebarOpen(v => !v)}
        showSidebarToggle={window.innerWidth < 900}
        />
      <div className="nk-layout">
        <Sidebar
          open={sidebarOpen}
          notes={filteredNotes}
          selectedId={selectedId}
          onSelect={handleSelectNote}
          onCreate={handleCreateNote}
          search={search}
          setSearch={setSearch}
          accentColor={COLORS.accent}
          primaryColor={COLORS.primary}
          sidebarBG={COLORS.sidebarBG}
        />
        <main className="nk-main">
          {/* Empty State */}
          {notes.length === 0 && (
            <div className="nk-empty">
              <h2>No notes</h2>
              <button className="nk-btn" style={{background:COLORS.primary}} onClick={handleCreateNote}>
                + Create your first note
              </button>
            </div>
          )}
          {/* Editor / View note */}
          {notes.length > 0 && selectedNote && (
            <>
              {isEditing ? (
                <NoteEditor
                  note={selectedNote}
                  onSave={handleSaveNote}
                  onCancel={()=>setIsEditing(false)}
                  accentColor={COLORS.accent}
                  />
              ) : (
                <NoteViewer
                  note={selectedNote}
                  onEdit={()=>handleEditNote(selectedNote.id)}
                  onDelete={()=>handleDeleteNote(selectedNote.id)}
                  accentColor={COLORS.accent}
                  />
              )}
            </>
          )}
          {/* Prompt to select */}
          {notes.length > 0 && !selectedNote && <div className="nk-empty">
            <h3>Select a note from the sidebar</h3>
          </div>}
        </main>
      </div>
    </div>
  );
}

// -------- COMPONENTS ------------

function TopBar({ onSidebarToggle, showSidebarToggle }) {
  return (
    <header className="nk-topbar">
      {showSidebarToggle && (
        <button className="nk-sidebar-btn" onClick={onSidebarToggle} title="Toggle sidebar">
          ☰
        </button>
      )}
      <span className="nk-logo-bold">
        <span style={{ color: COLORS.primary }}>note</span>
        <span style={{ color: COLORS.accent }}>keeper</span>
      </span>
    </header>
  );
}

function Sidebar({ open, notes, selectedId, onSelect, onCreate, search, setSearch, accentColor, primaryColor, sidebarBG }) {
  return (
    <aside className={`nk-sidebar ${open ? "open" : "closed"}`} style={{background: sidebarBG, borderRight: `1px solid ${COLORS.border}`}}>
      <div className="nk-sidebar-top">
        <button className="nk-btn nk-create-btn" style={{background: accentColor}} onClick={onCreate}>+ New Note</button>
        <input
          className="nk-search"
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <nav className="nk-note-list">
        {notes.length === 0 && <div style={{color: COLORS.secondary, padding: "1em"}}>No notes</div>}
        {notes.map(note =>
          <SidebarNoteItem
            key={note.id}
            note={note}
            selected={note.id === selectedId}
            onClick={()=>onSelect(note.id)}
            accentColor={accentColor}
            primaryColor={primaryColor}
          />
        )}
      </nav>
    </aside>
  );
}

function SidebarNoteItem({ note, selected, onClick, accentColor, primaryColor }) {
  return (
    <div
      className={`nk-note-list-item${selected ? " selected" : ""}`}
      style={{
        background: selected ? COLORS.sidebarActive : "transparent",
        borderLeft: selected ? `4px solid ${primaryColor}` : "4px solid transparent"
      }}
      onClick={onClick}
      tabIndex={0}
      aria-selected={selected}
      title={note.title}
    >
      <span className="nk-note-title" style={{color: selected ? primaryColor : "#222"}}>
        {note.title || <em>Untitled</em>}
      </span>
      <span className="nk-note-snippet">
        {(note.content||"").substring(0, 24).replace(/\n/g, " ")}
      </span>
      <span className="nk-note-date">{new Date(note.edited).toLocaleDateString()}</span>
    </div>
  );
}

function NoteViewer({ note, onEdit, onDelete, accentColor }) {
  return (
    <div className="nk-view">
      <div className="nk-view-header">
        <h2 className="nk-view-title">{note.title || <em>(Untitled)</em>}</h2>
        <div className="nk-view-actions">
          <button className="nk-btn" style={{background: accentColor}} onClick={onEdit}>Edit</button>
          <button className="nk-btn nk-btn-danger" onClick={onDelete}>Delete</button>
        </div>
      </div>
      <div className="nk-view-date">
        <span>Last edited: {new Date(note.edited).toLocaleString()}</span>
        {note.created !== note.edited &&
          <span style={{ marginLeft: 10, color: "#888" }}>Created: {new Date(note.created).toLocaleString()}</span>
        }
      </div>
      <div className="nk-view-content">
        {note.content.split("\n").map((line, i) => <p key={i}>{line}</p>)}
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave, onCancel, accentColor }) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  return (
    <form
      className="nk-editor"
      onSubmit={e => {
        e.preventDefault();
        onSave({ ...note, title, content });
      }}
      >
      <div className="nk-editor-header">
        <input
          className="nk-editor-title"
          type="text"
          value={title}
          autoFocus
          maxLength={128}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title"
          style={{borderBottom: `2px solid ${accentColor}`}}
        />
        <div>
          <button type="submit" className="nk-btn" style={{background: accentColor}}>Save</button>
          <button type="button" className="nk-btn nk-btn-muted" onClick={onCancel}>Cancel</button>
        </div>
      </div>
      <textarea
        className="nk-editor-content"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write your note here..."
        rows={12}
        spellCheck
      />
    </form>
  );
}

export default App;
