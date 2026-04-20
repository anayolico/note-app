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
  ChevronLeft
} from 'lucide-react';
import './Dashboard.css';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Session and Sync User
  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, !!session);
      
      // If we find a session, process it
      if (session && mounted) {
        setUser(session.user);
        try {
          // Fetch notes first for better UX
          const res = await fetch(`${API_URL}/api/notes?userId=${session.user.id}`);
          const data = await res.json();
          if (mounted) setNotes(data || []);
          
          // Sync user in background
          fetch(`${API_URL}/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
            }),
          }).catch(e => console.error('Sync failed:', e));

        } catch (err) {
          console.error('Data fetch error:', err);
        } finally {
          if (mounted) setLoading(false);
        }
      } 
      
      // Handle navigation away ONLY on explicit sign out or if truly empty after settling
      if (event === 'SIGNED_OUT') {
        if (mounted) navigate('/');
        return;
      }

      // If it's the initial check and we have no session, wait a bit for OAuth to settle
      if (event === 'INITIAL_SESSION' && !session) {
        const isRedirecting = window.location.hash.includes('access_token=');
        setTimeout(() => {
          if (mounted) {
            supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
              if (!currentSession && !isRedirecting) {
                navigate('/');
              }
            });
          }
        }, 2000);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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


  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Mobile View Logic
  const showListOnMobile = isMobile && !selectedNote;
  const showEditorOnMobile = isMobile && selectedNote;

  return (
    <div className={`dashboard-layout ${isMobile ? 'mobile' : ''}`}>
      
      {/* Sidebar / List View */}
      {(showListOnMobile || !isMobile) && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Notes</h2>
            <div className="header-actions">
              <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
                <Settings size={18} />
              </button>
              <button className="new-note-btn circle" onClick={createNote}>
                <Plus size={20} />
              </button>
            </div>
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
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note, index) => (
                <div 
                  key={note.id} 
                  className={`note-item fade-in ${selectedNote?.id === note.id ? 'active' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="note-item-header">
                    <span className="note-item-title">{note.title || 'Untitled'}</span>
                    <span className="note-item-time">{new Date(note.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="note-item-preview">{note.content || 'No additional text'}</p>
                </div>
              ))
            ) : (
                <div className="empty-notes-list">
                  <PenTool size={40} className="empty-icon" />
                  <p>No notes found</p>
                  <button onClick={createNote} className="create-first-btn">Create your first note</button>
                </div>
            )}
          </div>

          <div className="sidebar-footer">
            <div className="footer-item" onClick={() => navigate('/settings')}>
              <Settings size={18} />
              <span>Settings</span>
            </div>
          </div>
        </aside>
      )}

      {/* Editor / Main Content Area */}
      {(showEditorOnMobile || !isMobile) && (
        <main className="main-content">
          {selectedNote ? (
            <div className="editor-container fade-in" key={selectedNote.id}>
              <div className="editor-nav">
                {isMobile && (
                  <button className="back-btn" onClick={() => setSelectedNote(null)}>
                    <ChevronLeft size={24} />
                  </button>
                )}
                
                <div className="editor-actions">
                  <button 
                    className="delete-btn" 
                    onClick={(e) => deleteNote(selectedNote.id, e)}
                  >
                    <Trash2 size={20} />
                  </button>
                  <div className="save-indicator">
                    {saveStatus === 'saving' && <Clock size={14} className="saving" />}
                    {saveStatus === 'saved' && <CheckCircle size={14} />}
                  </div>
                </div>
              </div>

              <input 
                className="editor-title"
                value={selectedNote.title}
                onChange={(e) => handleEditorChange('title', e.target.value)}
                placeholder="Title"
              />
              <textarea 
                className="editor-content"
                value={selectedNote.content}
                onChange={(e) => handleEditorChange('content', e.target.value)}
                placeholder="Start writing..."
              />
            </div>
          ) : (
            <div className="empty-state desktop-only fade-in">
              <PenTool size={80} className="empty-icon-large" />
              <h2>Select a note to start editing</h2>
              <p>Or create a new one to capture your thoughts.</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default Dashboard;
