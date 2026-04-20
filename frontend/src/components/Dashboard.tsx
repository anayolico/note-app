import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  PenTool, 
  CheckCircle,
  Clock,
  Menu,
  ChevronLeft
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch Session and Sync User
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      setUser(session.user);
      
      try {
        await fetch(`${API_URL}/api/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
          }),
        });

        // Fetch User Notes
        const res = await fetch(`${API_URL}/api/notes?userId=${session.user.id}`);
        const data = await res.json();
        setNotes(data || []);
      } catch (err) {
        console.error('Error during init:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const createNote = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const newNote = await res.json();
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      setSidebarOpen(false); // Close sidebar on mobile
    } catch (err) {
      console.error('Create note error:', err);
    }
  };

  const deleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/notes/${id}`, { method: 'DELETE' });
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  const debounceSave = useCallback(
    (noteId: string, title: string, content: string) => {
      setSaveStatus('saving');
      const timer = setTimeout(async () => {
        try {
          await fetch(`${API_URL}/api/notes/${noteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
          });
          setSaveStatus('saved');
          // Update local note list snippet without full refetch
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title, content, updated_at: new Date().toISOString() } : n));
        } catch (err) {
          console.error('Auto-save error:', err);
        }
      }, 1000);
      return () => clearTimeout(timer);
    },
    []
  );

  const handleEditorChange = (field: 'title' | 'content', value: string) => {
    if (!selectedNote) return;
    const updatedNote = { ...selectedNote, [field]: value };
    setSelectedNote(updatedNote);
    debounceSave(selectedNote.id, updatedNote.title, updatedNote.content);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-header"><div className="skeleton" style={{width: '100px', height: '24px'}}></div></div>
          <div className="note-list">
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{height: '60px', margin: '1rem', borderRadius: '8px'}}></div>)}
          </div>
        </aside>
        <main className="main-content">
          <div className="skeleton" style={{margin: '5rem', height: '300px', borderRadius: '12px', opacity: 0.5}}></div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="brand-name" style={{fontSize: '1rem', color: 'white'}}>Mindful Canvas</span>
        <button className="new-note-btn" onClick={createNote} style={{padding: '4px'}}>
          <Plus size={20} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
             <button className="menu-toggle" onClick={() => setSidebarOpen(false)} style={{display: 'none'}} id="sidebar-close-btn">
                <ChevronLeft size={24} />
             </button>
             <h2>Notes</h2>
          </div>
          <button className="new-note-btn" onClick={createNote}>
            <Plus size={18} /> New
          </button>
        </div>

        <div className="search-container">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input 
              placeholder="Search notes..." 
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="note-list">
          {filteredNotes.map((note, index) => (
            <div 
              key={note.id} 
              className={`note-item fade-in ${selectedNote?.id === note.id ? 'active' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleNoteSelect(note)}
            >
              <div className="note-item-header">
                <span className="note-item-title">{note.title || 'Untitled'}</span>
                <span className="note-item-time">{new Date(note.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="note-item-preview">{note.content || 'Start typing...'}</p>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="footer-item">
            <Trash2 size={18} />
            <span>Trash</span>
          </div>
          <div className="footer-item" onClick={handleLogout}>
            <Settings size={18} />
            <span>Settings / Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {selectedNote ? (
          <div className="editor-container fade-in" key={selectedNote.id}>
            <div className="editor-header">
              <button 
                className="delete-note-btn" 
                onClick={(e) => deleteNote(selectedNote.id, e)}
                title="Move to trash"
              >
                <Trash2 size={20} />
              </button>
              
              <div className="save-status">
                {saveStatus === 'saving' && <span><Clock size={12} className="saving-icon" /> Saving...</span>}
                {saveStatus === 'saved' && <span><CheckCircle size={12} /> Saved</span>}
              </div>
            </div>

            <input 
              className="editor-title"
              value={selectedNote.title}
              onChange={(e) => handleEditorChange('title', e.target.value)}
              placeholder="Note Title"
            />
            <textarea 
              className="editor-content"
              value={selectedNote.content}
              onChange={(e) => handleEditorChange('content', e.target.value)}
              placeholder="Your thoughts go here..."
            />
          </div>
        ) : (
          <div className="empty-state fade-in">
            <div className="empty-icon"><PenTool size={80} /></div>
            <h2>Select a note to start editing</h2>
            <div className="shortcut-hint">
              <span><span className="key">⌘</span> + N &nbsp; new note</span>
              <span><span className="key">⌘</span> + K &nbsp; search</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
