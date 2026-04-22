import React, { useEffect, useState, useCallback } from 'react';
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
  ChevronLeft,
  RotateCcw,
  Trash
} from 'lucide-react';
import './Dashboard.css';
import LoadingOverlay from './LoadingOverlay';
import ReactMarkdown from 'react-markdown';
import { useRef } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  is_trash: boolean;
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
  const [isPreview, setIsPreview] = useState(false);
  const [currentView, setCurrentView] = useState<'notes' | 'trash'>('notes');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedNoteRef = useRef<Note | null>(null);

  // Sync ref with state
  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth and Session Handling
  useEffect(() => {
    let mounted = true;
    let hasFoundSession = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, !!session);
      
      if (session && mounted) {
        hasFoundSession = true;
        setUser(session.user);
        
        try {
          // Fetch data based on current view
          const endpoint = currentView === 'trash' ? '/api/notes/trash' : '/api/notes';
          const res = await fetch(`${API_URL}${endpoint}?userId=${session.user.id}`);
          const data = await res.json();
          if (mounted) setNotes(data || []);
          
          // Sync user
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
      
      if (event === 'SIGNED_OUT' && mounted) {
        navigate('/');
      }
    });

    // Check if we need to redirect after a patient wait
    const checkAuthStatus = async () => {
      const hash = window.location.hash;
      const isRedirecting = hash.includes('access_token=') || 
                          hash.includes('id_token=') || 
                          hash.includes('refresh_token=') ||
                          hash.includes('error=');
      
      // Wait longer if we are in an OAuth flow
      const waitTime = isRedirecting ? 6000 : 3000;
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      if (mounted && !hasFoundSession) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession && !hasFoundSession) {
          console.log('No session detected after wait, redirecting to landing...');
          navigate('/');
        }
      }
    };

    checkAuthStatus();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, currentView]);

  const createNote = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const newNote = await res.json();
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      setIsPreview(false);
    } catch (err) {
      console.error('Create note error:', err);
    }
  }, [user, API_URL]);

  const saveSelectedNote = useCallback(async () => {
    const note = selectedNoteRef.current;
    if (!note) return;
    setSaveStatus('saving');
    try {
      await fetch(`${API_URL}/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: note.title, content: note.content }),
      });
      setSaveStatus('saved');
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, title: note.title, content: note.content, updated_at: new Date().toISOString() } : n));
    } catch (err) {
      console.error('Manual save error:', err);
    }
  }, [API_URL]);

  const deleteNote = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const isPermanent = currentView === 'trash';
      const endpoint = isPermanent ? `/api/notes/${id}/permanent` : `/api/notes/${id}`;
      
      await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNoteRef.current?.id === id) {
        setSelectedNote(null);
        setIsPreview(false);
      }
    } catch (err) {
      console.error('Delete note error:', err);
    }
  }, [API_URL, currentView]);

  const restoreNote = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_trash: false }),
      });
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNoteRef.current?.id === id) {
        setSelectedNote(null);
        setIsPreview(false);
      }
    } catch (err) {
      console.error('Restore note error:', err);
    }
  }, [API_URL]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const currentSelectedNote = selectedNoteRef.current;
      
      // New Note: Ctrl + N
      if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNote();
      } 
      // Save: Ctrl + S
      else if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveSelectedNote();
      } 
      // Search: Ctrl + K
      else if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } 
      // Delete: Ctrl + D
      else if (isMod && e.key.toLowerCase() === 'd') {
        if (currentSelectedNote) {
          e.preventDefault();
          if (window.confirm('Are you sure you want to delete this note?')) {
            deleteNote(currentSelectedNote.id);
          }
        }
      } 
      // Toggle Preview: Ctrl + Shift + P
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'p') {
        if (currentSelectedNote) {
          e.preventDefault();
          setIsPreview(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote, deleteNote, saveSelectedNote]); // Removed selectedNote from dependencies

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
    return <LoadingOverlay />;
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
            <h2>{currentView === 'notes' ? 'Notes' : 'Trash'}</h2>
            <div className="header-actions">
              {currentView === 'notes' && (
                <button className="new-note-btn circle" onClick={createNote}>
                  <Plus size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="search-container">
            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input 
                ref={searchInputRef}
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
                  {currentView === 'notes' ? (
                    <>
                      <PenTool size={40} className="empty-icon" />
                      <p>No notes found</p>
                      <button onClick={createNote} className="create-first-btn">Create your first note</button>
                    </>
                  ) : (
                    <>
                      <Trash2 size={40} className="empty-icon" />
                      <p>Trash is empty</p>
                    </>
                  )}
                </div>
            )}
          </div>

          <div className="sidebar-footer">
            <div 
              className={`footer-item ${currentView === 'notes' ? 'active' : ''}`} 
              onClick={() => { setCurrentView('notes'); setSelectedNote(null); }}
            >
              <PenTool size={18} />
              <span>All Notes</span>
            </div>
            <div 
              className={`footer-item ${currentView === 'trash' ? 'active' : ''}`} 
              onClick={() => { setCurrentView('trash'); setSelectedNote(null); }}
            >
              <Trash2 size={18} />
              <span>Trash</span>
            </div>
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
                  {currentView === 'notes' ? (
                    <>
                      <button 
                        className={`preview-toggle-btn ${isPreview ? 'active' : ''}`}
                        onClick={() => setIsPreview(!isPreview)}
                        title="Toggle Preview (Ctrl+Shift+P)"
                      >
                        <PenTool size={18} />
                        <span>{isPreview ? 'Edit' : 'Preview'}</span>
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={(e) => deleteNote(selectedNote.id, e)}
                        title="Move to Trash (Ctrl+D)"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="restore-btn" 
                        onClick={(e) => restoreNote(selectedNote.id, e)}
                        title="Restore Note"
                      >
                        <RotateCcw size={18} />
                        <span>Restore</span>
                      </button>
                      <button 
                        className="delete-btn permanent" 
                        onClick={(e) => {
                          if (window.confirm('Permanently delete this note? This action cannot be undone.')) {
                            deleteNote(selectedNote.id, e);
                          }
                        }}
                        title="Delete Permanently"
                      >
                        <Trash size={20} />
                      </button>
                    </>
                  )}
                  {currentView === 'notes' && (
                    <div className="save-indicator" title="Save Status (Ctrl+S for manual save)">
                      {saveStatus === 'saving' && <Clock size={14} className="saving" />}
                      {saveStatus === 'saved' && <CheckCircle size={14} />}
                    </div>
                  )}
                </div>
              </div>

              <input 
                className="editor-title"
                value={selectedNote.title}
                onChange={(e) => handleEditorChange('title', e.target.value)}
                placeholder="Title"
                disabled={isPreview || currentView === 'trash'}
              />
              {isPreview ? (
                <div className="markdown-preview fade-in">
                  <ReactMarkdown>{selectedNote.content || '*No content*'}</ReactMarkdown>
                </div>
              ) : (
                <textarea 
                  className="editor-content"
                  value={selectedNote.content}
                  onChange={(e) => handleEditorChange('content', e.target.value)}
                  placeholder="Start writing..."
                  disabled={currentView === 'trash'}
                />
              )}
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
