
import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage, UserAvailability, AdminUpdateMetadata, ChatGroup, AnnouncementCategory, Client } from '../types';
import { Send, Paperclip, Smile, Search, FileText, ChevronDown, Hash, Bell, Pin, X, Trash2, Reply, Plus, Settings, Megaphone, CheckCheck, MessageSquare, ArrowLeft, Clock, Target, Phone, Video, Mic, MicOff, VideoOff, Filter, ListFilter } from 'lucide-react';

interface ChatSystemProps {
  currentUser: User | null;
  users: User[];
  clients?: Client[]; 
  messages: ChatMessage[];
  chatGroups: ChatGroup[];
  onSendMessage: (text: string, type: 'text' | 'file' | 'celebration' | 'admin_update', recipientId?: string, fileData?: { name: string, url: string }, metadata?: AdminUpdateMetadata, isPinned?: boolean, replyToId?: string, groupId?: string) => void;
  onUpdateStatus: (status: UserAvailability) => void;
  onViewNotifications: () => void;
  onMarkChatRead?: (senderId: string, groupId?: string) => void;
  onTogglePinChat?: (targetId: string) => void;
  onTogglePinMessage?: (messageId: string) => void;
  onDeleteMessage?: (msgId: string, forEveryone: boolean) => void;
  onReactToMessage?: (msgId: string, emoji: string) => void;
  onCreateGroup?: (group: ChatGroup) => void;
  onUpdateGroup?: (group: ChatGroup) => void;
  initialActiveChatId?: string | null;
}

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '🚀', '👀', '✅', '💯'];
const STATUS_COLORS: Record<string, string> = {
    'Online': 'bg-green-500',
    'Away': 'bg-yellow-500',
    'Busy': 'bg-red-500',
    'In a Meeting': 'bg-purple-500',
    'Out of Office': 'bg-slate-400',
    'Offline': 'bg-slate-300'
};

type ChatFilter = 'All' | 'Unread' | 'Clients' | 'Team' | 'Groups';

const ChatSystem: React.FC<ChatSystemProps> = ({ 
    currentUser, 
    users, 
    clients = [],
    messages, 
    chatGroups = [],
    onSendMessage, 
    onUpdateStatus, 
    onViewNotifications,
    onMarkChatRead,
    onTogglePinChat,
    onTogglePinMessage,
    onDeleteMessage,
    onReactToMessage,
    onCreateGroup,
    onUpdateGroup,
    initialActiveChatId
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatFilter, setChatFilter] = useState<ChatFilter>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const [isAdminUpdate, setIsAdminUpdate] = useState(false);
  const [adminCategory, setAdminCategory] = useState<AnnouncementCategory>('General');
  const [adminExpiryHours, setAdminExpiryHours] = useState(24);
  const [targetRoles, setTargetRoles] = useState<string[]>(['All']);
  const [targetDepartments, setTargetDepartments] = useState<string[]>(['All']);
  const [targetSkills, setTargetSkills] = useState('');
  
  const [activeChatId, setActiveChatId] = useState<string>(initialActiveChatId || 'general'); 
  const [showMobileList, setShowMobileList] = useState(!initialActiveChatId || initialActiveChatId === 'general');

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [groupForm, setGroupForm] = useState<{name: string, members: string[]}>({ name: '', members: [] });

  // Call State
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<number | null>(null);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChatId, replyingTo]);

  // Handle Initial Chat Target from Props (e.g. from Team List)
  useEffect(() => {
      if (initialActiveChatId) {
          setActiveChatId(initialActiveChatId);
          setShowMobileList(false); // Switch to chat view on mobile
      }
  }, [initialActiveChatId]);

  useEffect(() => {
      if (activeChatId !== 'general' && onMarkChatRead) {
          const isGroup = chatGroups.some(g => g.id === activeChatId);
          if (isGroup) {
              onMarkChatRead(undefined, activeChatId);
          } else {
              onMarkChatRead(activeChatId);
          }
      }
  }, [activeChatId, messages, onMarkChatRead]);

  // Call Timer Logic
  useEffect(() => {
      if (callStatus === 'connected') {
          callTimerRef.current = window.setInterval(() => {
              setCallDuration(prev => prev + 1);
          }, 1000);
      } else {
          if (callTimerRef.current) {
              clearInterval(callTimerRef.current);
              setCallDuration(0);
          }
      }
      return () => {
          if (callTimerRef.current) clearInterval(callTimerRef.current);
      };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = (type: 'audio' | 'video') => {
      setCallType(type);
      setCallStatus('ringing');
      // Simulate answer after 3 seconds
      setTimeout(() => {
          setCallStatus('connected');
      }, 3000);
  };

  const handleEndCall = () => {
      setCallStatus('idle');
      setIsMuted(false);
      setIsVideoOff(false);
  };

  const handleSend = () => {
      if (inputText.trim()) {
          const isGroup = chatGroups.some(g => g.id === activeChatId);
          const recipientId = (activeChatId === 'general' || isGroup) ? undefined : activeChatId;
          const groupId = isGroup ? activeChatId : undefined;
          
          const type = (isAdmin && isAdminUpdate && activeChatId === 'general') ? 'admin_update' : 'text';
          
          let metadata: AdminUpdateMetadata | undefined;
          let isPinned = type === 'admin_update'; // Auto pin admin updates

          if (type === 'admin_update') {
              const expiryDate = new Date();
              expiryDate.setHours(expiryDate.getHours() + adminExpiryHours);
              metadata = {
                  expiresAt: expiryDate.toISOString(),
                  category: adminCategory,
                  targetRoles: targetRoles,
                  affectedDepartments: targetDepartments,
                  targetSkills: targetSkills ? targetSkills.split(',').map(s => s.trim()).filter(s => s) : undefined
              };
          }

          onSendMessage(inputText, type, recipientId, undefined, metadata, isPinned, replyingTo?.id, groupId);
          setInputText('');
          setShowEmojiPicker(false);
          setReplyingTo(null);
          setMentionQuery(null);
          
          if(isAdminUpdate) {
              setIsAdminUpdate(false);
              setAdminCategory('General');
              setTargetRoles(['All']);
              setTargetDepartments(['All']);
              setTargetSkills('');
          }
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInputText(val);

      const cursor = e.target.selectionStart;
      const textBeforeCursor = val.slice(0, cursor);
      const lastAt = textBeforeCursor.lastIndexOf('@');

      if (lastAt !== -1) {
          const query = textBeforeCursor.slice(lastAt + 1);
          if (!/\s\s/.test(query)) { 
              setMentionQuery(query);
              setMentionStartIndex(lastAt);
              return;
          }
      }
      setMentionQuery(null);
  };

  const handleSelectMention = (userName: string) => {
      if (mentionStartIndex === -1) return;
      
      const prefix = inputText.slice(0, mentionStartIndex);
      const suffix = inputText.slice(textAreaRef.current?.selectionStart || inputText.length);
      
      const newValue = `${prefix}@${userName} ${suffix}`;
      setInputText(newValue);
      setMentionQuery(null);
      
      if (textAreaRef.current) {
          textAreaRef.current.focus();
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (mentionQuery) {
              const filteredUsers = users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()));
              if (filteredUsers.length > 0) {
                  handleSelectMention(filteredUsers[0].name);
                  return;
              }
          }
          handleSend();
      }
  };

  const handleEmojiClick = (emoji: string) => {
      setInputText(prev => prev + emoji);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const mockUrl = URL.createObjectURL(file);
          const isGroup = chatGroups.some(g => g.id === activeChatId);
          const recipientId = (activeChatId === 'general' || isGroup) ? undefined : activeChatId;
          const groupId = isGroup ? activeChatId : undefined;

          onSendMessage(`Shared a file: ${file.name}`, 'file', recipientId, { name: file.name, url: mockUrl }, undefined, false, replyingTo?.id, groupId);
          setReplyingTo(null);
      }
  };

  const confirmDelete = (msgId: string, forEveryone: boolean) => {
      if (onDeleteMessage) onDeleteMessage(msgId, forEveryone);
      setDeleteConfirmId(null);
  };

  // --- Private Reply Functionality ---
  const handlePrivateReply = (targetUserId: string) => {
      setActiveChatId(targetUserId);
      setShowMobileList(false);
      setActiveMenuMessageId(null);
      setHoveredMessageId(null);
  };

  // --- Rendering ---

  const filteredMentionUsers = mentionQuery !== null
      ? users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()) && u.status === 'Active')
      : [];

  const formatMessageText = (text: string) => {
      const parts = text.split(/(\*.*?\*)/g);
      return parts.map((part, i) => {
          if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
              return <strong key={i}>{part.slice(1, -1)}</strong>;
          }
          if (part.includes('@')) {
              const mentionParts = part.split(/(@[\w\s]+)/g);
              return mentionParts.map((subPart, j) => {
                  if (subPart.startsWith('@')) {
                      return <span key={`${i}-${j}`} className="text-blue-600 font-medium bg-blue-50 px-1 rounded">{subPart}</span>;
                  }
                  return subPart;
              });
          }
          return part;
      });
  };

  const searchedUsers = users.filter(u => 
      u.id !== currentUser?.id && 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) && u.status !== 'Frozen'
  );

  // Include ALL Clients in search if they match search term (Removed Active filter)
  const searchedClients = clients.filter(c => 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myGroups = chatGroups.filter(g => g.members && g.members.includes(currentUser?.id || ''));

  const usersWithMeta = searchedUsers.map(user => {
      const userMessages = messages.filter(m => 
          (m.senderId === user.id && m.recipientId === currentUser?.id) ||
          (m.senderId === currentUser?.id && m.recipientId === user.id)
      );
      const lastMsg = userMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      const unreadCount = userMessages.filter(m => m.senderId === user.id && !m.read).length;
      const isPinned = currentUser?.pinnedChatIds?.includes(user.id) || false;
      return { ...user, lastMsg, unreadCount, isPinned, type: 'user' as const };
  });

  // Logic for Clients chat list
  const clientsWithMeta = searchedClients.map(client => {
      const clientMessages = messages.filter(m => 
          // Check if message is from this client to ME or Management Pool
          (m.senderId === client.id && (m.recipientId === currentUser?.id || (m.recipientId === 'management-pool' && isAdmin))) ||
          // Check if message is from ME or Management Pool to this client
          ((m.senderId === currentUser?.id || (m.senderId === 'management-pool' && isAdmin)) && m.recipientId === client.id)
      );
      const lastMsg = clientMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      // Unread logic for clients (including management pool logic)
      const unreadCount = clientMessages.filter(m => {
          if (m.senderId === client.id && !m.read) {
              if (m.recipientId === currentUser?.id) return true;
              if (isAdmin && m.recipientId === 'management-pool') return true;
          }
          return false;
      }).length;

      const isPinned = currentUser?.pinnedChatIds?.includes(client.id) || false;
      
      // Only show client in list if there's a history OR search term matches
      // REMOVED status check so pending/prospect clients appear if there's a chat
      if (clientMessages.length === 0 && !searchTerm) return null;

      return { 
          id: client.id, 
          name: client.name, 
          avatar: '', // Clients don't have avatars in this model yet
          lastMsg, 
          unreadCount, 
          isPinned, 
          type: 'client' as const,
          availability: 'Online' // Default for clients for now
      };
  }).filter(Boolean) as any[];

  const groupsWithMeta = myGroups.map(group => {
      const groupMsgs = messages.filter(m => m.groupId === group.id);
      const lastMsg = groupMsgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      const unreadCount = groupMsgs.filter(m => m.senderId !== currentUser?.id && !m.readBy?.includes(currentUser?.id || '')).length;
      const isPinned = currentUser?.pinnedChatIds?.includes(group.id) || false;
      return { ...group, lastMsg, unreadCount, isPinned, type: 'group' as const, avatar: '' };
  });

  let sortedItems = [
      ...usersWithMeta,
      ...clientsWithMeta,
      ...groupsWithMeta
  ].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Get timestamp: Message time > Creation time (for groups) > 0
      const getTime = (item: any) => {
          if (item.lastMsg) return new Date(item.lastMsg.timestamp).getTime();
          if (item.type === 'group' && item.createdAt) return new Date(item.createdAt).getTime();
          return 0;
      };

      const timeA = getTime(a);
      const timeB = getTime(b);
      
      // Sort descending (newest first)
      return timeB - timeA;
  });

  // Apply Filters
  if (chatFilter !== 'All') {
      sortedItems = sortedItems.filter(item => {
          if (chatFilter === 'Unread') return item.unreadCount > 0;
          if (chatFilter === 'Clients') return item.type === 'client';
          if (chatFilter === 'Team') return item.type === 'user';
          if (chatFilter === 'Groups') return item.type === 'group';
          return true;
      });
  }

  const activeMessages = messages.filter(msg => {
      if (msg.deletedForUsers?.includes(currentUser?.id || '')) return false;
      if (activeChatId === 'general') return !msg.recipientId && !msg.groupId;
      
      const isGroup = chatGroups.some(g => g.id === activeChatId);
      if (isGroup) return msg.groupId === activeChatId;
      
      // Logic for User OR Client chat (including management pool)
      const isDirect = (msg.senderId === activeChatId && msg.recipientId === currentUser?.id) ||
                       (msg.senderId === currentUser?.id && msg.recipientId === activeChatId);
      
      // Include Management Pool messages if admin
      const isPool = isAdmin && (
          (msg.senderId === activeChatId && msg.recipientId === 'management-pool') ||
          (msg.senderId === 'management-pool' && msg.recipientId === activeChatId)
      );

      return isDirect || isPool;
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const activeUser = users.find(u => u.id === activeChatId);
  const activeClient = clients.find(c => c.id === activeChatId);
  const activeGroup = chatGroups.find(g => g.id === activeChatId);

  const getMessageSenderName = (id: string) => {
      if(id === currentUser?.id) return 'You';
      const user = users.find(u => u.id === id);
      if (user) return user.name;
      const client = clients.find(c => c.id === id);
      if (client) return client.name;
      if (id === 'management-pool') return 'Management';
      return 'Unknown';
  };

  // Group Creation & Editing Handlers... (Same as before)
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!groupForm.name || groupForm.members.length === 0) {
          alert("Please provide a group name and select at least one member.");
          return;
      }
      if (onCreateGroup && currentUser) {
          const newGroup: ChatGroup = {
              id: `grp-${Date.now()}`,
              name: groupForm.name,
              members: [...groupForm.members, currentUser.id], 
              createdBy: currentUser.id,
              createdAt: new Date().toISOString()
          };
          onCreateGroup(newGroup);
          setShowCreateGroupModal(false);
          setGroupForm({ name: '', members: [] });
          setActiveChatId(newGroup.id);
      }
  };

  const handleUpdateGroupSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const currentGroup = chatGroups.find(g => g.id === activeChatId);
      if (!currentGroup || !onUpdateGroup) return;

      const updatedGroup: ChatGroup = {
          ...currentGroup,
          name: groupForm.name,
          members: groupForm.members 
      };
      onUpdateGroup(updatedGroup);
      setShowGroupSettingsModal(false);
  };

  const toggleMemberSelection = (userId: string) => {
      setGroupForm(prev => {
          const exists = prev.members.includes(userId);
          if (exists) return { ...prev, members: prev.members.filter(id => id !== userId) };
          return { ...prev, members: [...prev.members, userId] };
      });
  };

  const openCreateGroup = () => {
      setGroupForm({ name: '', members: [] });
      setShowCreateGroupModal(true);
  };

  const openGroupSettings = () => {
      const group = chatGroups.find(g => g.id === activeChatId);
      if (group) {
          setGroupForm({ name: group.name, members: group.members });
          setShowGroupSettingsModal(true);
      }
  };

  return (
    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn mx-auto max-w-7xl relative h-[calc(100vh-90px)] md:h-[calc(100vh-140px)]">
        
        {/* Left Sidebar (Chat List) */}
        <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50 absolute md:relative z-10 h-full transition-transform duration-300 ${showMobileList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            
            {/* Profile Section */}
            <div className="p-4 border-b border-slate-200 bg-white relative z-20">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={currentUser?.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200"/>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${STATUS_COLORS[currentUser?.availability || 'Offline'] || 'bg-slate-300'}`}></div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.name}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[currentUser?.availability || 'Offline'] || 'bg-slate-300'}`}></span>
                            <span>{currentUser?.availability || 'Offline'}</span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={openCreateGroup} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Create Group">
                            <Plus size={18}/>
                        </button>
                        <button onClick={onViewNotifications} className="relative p-2 hover:bg-slate-100 rounded-full text-slate-500" title="View Notifications">
                            <Bell size={18}/>
                            {currentUser?.notifications?.some(n => !n.read) && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="p-3 bg-white border-b border-slate-200 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <button 
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`p-2 rounded-lg border transition-colors ${chatFilter !== 'All' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <ListFilter size={18}/>
                    </button>
                    {showFilterMenu && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-fadeIn">
                            {(['All', 'Unread', 'Clients', 'Team', 'Groups'] as ChatFilter[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => { setChatFilter(f); setShowFilterMenu(false); }}
                                    className={`w-full text-left px-4 py-2 text-xs flex justify-between items-center hover:bg-slate-50 ${chatFilter === f ? 'font-bold text-blue-600' : 'text-slate-600'}`}
                                >
                                    {f}
                                    {chatFilter === f && <CheckCheck size={12}/>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-300">
                {(chatFilter === 'All' || chatFilter === 'Groups') && (
                    <button 
                        onClick={() => { setActiveChatId('general'); setShowMobileList(false); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-2 ${activeChatId === 'general' ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-100'}`}
                    >
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                            <Hash size={20}/>
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="font-bold text-slate-800 text-sm">General</h4>
                            <p className="text-xs text-slate-500 truncate">Team announcements</p>
                        </div>
                    </button>
                )}

                <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-4 flex justify-between items-center">
                    Conversations
                    {chatFilter !== 'All' && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">{chatFilter}</span>}
                </p>
                
                {sortedItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => { setActiveChatId(item.id); setShowMobileList(false); }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all relative group ${activeChatId === item.id ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-100'}`}
                    >
                        <div className="relative">
                            {item.type === 'user' ? (
                                <>
                                    <img src={item.avatar} alt="" className="w-10 h-10 rounded-full object-cover"/>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${STATUS_COLORS[item.availability || 'Offline'] || 'bg-slate-300'}`}></div>
                                </>
                            ) : item.type === 'client' ? (
                                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold">
                                    {item.name.charAt(0)}
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                    {item.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium text-slate-800 text-sm truncate flex items-center gap-1">
                                    {item.name}
                                    {item.type === 'client' && <span className="text-[8px] bg-green-100 text-green-800 px-1 rounded border border-green-200">CLIENT</span>}
                                </h4>
                                {item.lastMsg && <span className="text-[10px] text-slate-400">{new Date(item.lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>}
                            </div>
                            <p className={`text-xs truncate ${item.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                {item.lastMsg ? `${item.type === 'group' ? getMessageSenderName(item.lastMsg.senderId) + ': ' : ''}${item.lastMsg.text}` : 'No messages yet'}
                            </p>
                        </div>
                        {item.unreadCount > 0 && (
                            <span className={`text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm ${item.type === 'client' ? 'bg-red-600 animate-pulse' : 'bg-blue-500'}`}>
                                {item.unreadCount}
                            </span>
                        )}
                        {item.isPinned && <Pin size={12} className="text-slate-400 rotate-45 absolute top-2 right-2"/>}
                    </button>
                ))}
            </div>
        </div>

        {/* Right Content - Chat Area */}
        <div className={`flex-1 flex flex-col h-full bg-white relative ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Header */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-6 bg-white shrink-0">
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                    <button onClick={() => setShowMobileList(true)} className="md:hidden text-slate-500 hover:text-slate-800 mr-1 p-1">
                        <ArrowLeft size={20}/>
                    </button>
                    {activeChatId === 'general' ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <Hash size={20}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">General</h3>
                                <p className="text-xs text-slate-500">Team announcements</p>
                            </div>
                        </div>
                    ) : activeGroup ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                {activeGroup.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{activeGroup.name}</h3>
                                <p className="text-xs text-slate-500">{activeGroup.members.length} members</p>
                            </div>
                        </div>
                    ) : activeClient ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold">
                                {activeClient.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    {activeClient.name} <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded border border-green-200 hidden sm:inline-block">CLIENT</span>
                                </h3>
                                <p className="text-xs text-slate-500">UIN: {activeClient.uin}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={activeUser?.avatar} className="w-10 h-10 rounded-full object-cover"/>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${STATUS_COLORS[activeUser?.availability || 'Offline'] || 'bg-slate-300'}`}></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{activeUser?.name}</h3>
                                <p className="text-xs text-slate-500">{activeUser?.role}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Call Buttons (Only for Users and Clients) */}
                    {(activeUser || activeClient) && (
                        <>
                            <button onClick={() => handleStartCall('audio')} className="text-slate-400 hover:text-green-600 p-2 rounded hover:bg-green-50 transition-colors" title="Voice Call">
                                <Phone size={20}/>
                            </button>
                            <button onClick={() => handleStartCall('video')} className="text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition-colors" title="Video Call">
                                <Video size={20}/>
                            </button>
                            <div className="w-px h-5 bg-slate-200 mx-1"></div>
                        </>
                    )}

                    {activeGroup && (
                        <button onClick={openGroupSettings} className="text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-slate-50" title="Group Settings">
                            <Settings size={20}/>
                        </button>
                    )}
                    
                    {onTogglePinChat && activeChatId !== 'general' && (
                        <button onClick={() => onTogglePinChat(activeChatId)} className="text-slate-400 hover:text-orange-500 transition-colors p-2 rounded hover:bg-slate-50">
                            <Pin size={20} className={currentUser?.pinnedChatIds?.includes(activeChatId) ? "fill-orange-500 text-orange-500" : ""}/>
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
                {activeMessages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser?.id || (msg.senderId === 'management-pool' && isAdmin && msg.recipientId === activeChatId);
                    const showAvatar = !isMe && (index === 0 || activeMessages[index - 1].senderId !== msg.senderId);
                    const isDeleted = msg.deletedForEveryone;
                    const isAdminMsg = msg.type === 'admin_update';
                    const showMenu = hoveredMessageId === msg.id || activeMenuMessageId === msg.id;

                    return (
                        <div 
                            key={msg.id} 
                            className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                            onMouseLeave={() => { setHoveredMessageId(null); setActiveMenuMessageId(null); }}
                            onClick={() => {
                                // Toggle menu on mobile via tap
                                if (window.innerWidth < 768) {
                                     setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                                }
                            }}
                        >
                            {!isMe && (
                                <div className="w-8 flex-shrink-0 flex flex-col items-center">
                                    {showAvatar ? (
                                        activeClient ? (
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-800">
                                                {activeClient.name.charAt(0)}
                                            </div>
                                        ) : (
                                            <img src={users.find(u => u.id === msg.senderId)?.avatar} className="w-8 h-8 rounded-full object-cover" title={getMessageSenderName(msg.senderId)}/>
                                        )
                                    ) : <div className="w-8"/>}
                                </div>
                            )}
                            
                            <div className={`max-w-[85%] md:max-w-[75%] relative ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative text-sm ${
                                    isMe 
                                    ? 'bg-blue-50 text-slate-800 border border-blue-100 rounded-tr-none' 
                                    : isAdminMsg 
                                        ? 'bg-red-50 text-red-900 rounded-tl-none border-2 border-red-200' 
                                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                                }`}>
                                    {msg.replyToId && (
                                        <div className={`text-xs mb-2 p-2 rounded border-l-2 ${isMe ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-300 text-slate-500'}`}>
                                            <div className="font-bold mb-0.5 flex items-center gap-1">
                                                <Reply size={10}/> Replying to
                                            </div>
                                            <div className="truncate opacity-80">
                                                {messages.find(m => m.id === msg.replyToId)?.text || "Deleted message"}
                                            </div>
                                        </div>
                                    )}

                                    {isDeleted ? (
                                        <p className="italic opacity-70 flex items-center gap-2"><Trash2 size={14}/> This message was deleted</p>
                                    ) : (
                                        <>
                                            {!isMe && activeGroup && showAvatar && (
                                                <p className="text-[10px] font-bold text-slate-400 mb-1">{getMessageSenderName(msg.senderId)}</p>
                                            )}

                                            {isAdminMsg && (
                                                <div className="mb-2 pb-2 border-b border-red-200 flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-600">
                                                    <Megaphone size={14} className="text-red-600 fill-red-600"/> 
                                                    <span>{msg.metadata?.category} Announcement</span>
                                                </div>
                                            )}
                                            
                                            {msg.type === 'file' ? (
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-blue-200' : 'bg-slate-100'}`}>
                                                        <FileText size={24} className={isMe ? "text-blue-700" : "text-slate-600"}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{msg.fileName}</p>
                                                        <a href={msg.fileUrl} download className={`text-xs underline ${isMe ? 'text-blue-700' : 'text-blue-600'}`}>Download</a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="leading-relaxed whitespace-pre-wrap">
                                                    {formatMessageText(msg.text)}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    
                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-slate-400' : isAdminMsg ? 'text-red-400' : 'text-slate-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        {isMe && (msg.read || (msg.readBy && msg.readBy.length > 0) ? <CheckCheck size={12}/> : <CheckCheck size={12} className="opacity-50"/>)}
                                        {isAdminMsg && <Pin size={10} className="ml-1"/>}
                                    </div>

                                    {/* Message Context Menu */}
                                    {!isDeleted && showMenu && (
                                        <div className={`absolute -top-8 ${isMe ? 'right-0' : 'left-0'} bg-white shadow-xl rounded-lg border border-slate-200 p-1.5 flex items-center gap-1 z-20 animate-fadeIn`}>
                                            <button onClick={(e) => { e.stopPropagation(); onReactToMessage?.(msg.id, '👍'); }} className="p-1.5 hover:bg-slate-100 rounded text-lg">👍</button>
                                            <button onClick={(e) => { e.stopPropagation(); onReactToMessage?.(msg.id, '❤️'); }} className="p-1.5 hover:bg-slate-100 rounded text-lg">❤️</button>
                                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                            <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Reply"><Reply size={14}/></button>
                                            
                                            {/* Private Reply for Groups */}
                                            {!isMe && activeGroup && (
                                                <>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handlePrivateReply(msg.senderId); }} 
                                                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" 
                                                        title="Reply Privately"
                                                    >
                                                        <MessageSquare size={14}/>
                                                    </button>
                                                </>
                                            )}

                                            {isMe && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(msg.id); }}
                                                    className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14}/>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                    <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                            <div key={emoji} className="bg-white border border-slate-200 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-sm">
                                                <span>{emoji}</span>
                                                <span className="text-slate-500 font-bold">{(userIds as string[]).length}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-3 md:p-4 bg-white border-t border-slate-200 ${isAdminUpdate ? 'bg-red-50' : ''} relative`}>
                
                {/* Mention List Pop-up */}
                {mentionQuery !== null && filteredMentionUsers.length > 0 && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">
                            Mention
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                            {filteredMentionUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => handleSelectMention(u.name)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm transition-colors"
                                >
                                    <img src={u.avatar} className="w-6 h-6 rounded-full object-cover"/>
                                    <span>{u.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {replyingTo && (
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg mb-2 border border-slate-200 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Reply size={14}/>
                            <span className="font-bold">Replying to {getMessageSenderName(replyingTo.senderId)}:</span>
                            <span className="truncate max-w-xs">{replyingTo.text}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                    </div>
                )}

                <div className="flex gap-2 items-end">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Paperclip size={20}/>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload}/>
                    
                    <div className={`flex-1 border rounded-lg flex flex-col transition-all duration-300 ${isAdmin && isAdminUpdate ? 'bg-red-50 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-50 border-slate-200'}`}>
                        {isAdmin && activeChatId === 'general' && (
                            <div className="flex flex-col">
                                <div className={`flex items-center gap-2 px-3 py-2 border-b rounded-t-lg transition-all ${isAdminUpdate ? 'border-red-300 bg-red-100' : 'border-slate-200 bg-slate-100'}`}>
                                    <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold select-none ${isAdminUpdate ? 'text-red-700' : 'text-slate-600'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={isAdminUpdate} 
                                            onChange={(e) => setIsAdminUpdate(e.target.checked)} 
                                            className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                                        />
                                        ANNOUNCEMENT
                                    </label>
                                    
                                    {isAdminUpdate && (
                                        <span className="text-[10px] text-red-600 uppercase tracking-widest ml-auto font-bold flex items-center gap-1">
                                            <Pin size={10} className="fill-red-600"/> Pinned
                                        </span>
                                    )}
                                </div>
                                
                                {/* Extended Admin Controls */}
                                {isAdminUpdate && (
                                    <div className="px-3 py-2 bg-red-50 border-b border-red-200 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <label className="block text-red-700 font-bold mb-1">Category</label>
                                            <select 
                                                value={adminCategory} 
                                                onChange={(e) => setAdminCategory(e.target.value as AnnouncementCategory)}
                                                className="w-full p-1 rounded border border-red-200 text-red-800 focus:ring-red-500 outline-none bg-white"
                                            >
                                                <option value="General">General</option>
                                                <option value="Urgent">Urgent</option>
                                                <option value="Policy Update">Policy Update</option>
                                                <option value="Event">Event</option>
                                                <option value="News">News</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-red-700 font-bold mb-1 flex items-center gap-1"><Clock size={10}/> Expires In (Hours)</label>
                                            <input 
                                                type="number"
                                                min="1"
                                                value={adminExpiryHours}
                                                onChange={(e) => setAdminExpiryHours(parseInt(e.target.value))}
                                                className="w-full p-1 rounded border border-red-200 text-red-800 focus:ring-red-500 outline-none bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-red-700 font-bold mb-1 flex items-center gap-1"><Target size={10}/> Target Audience</label>
                                            <select 
                                                value={targetRoles[0]} 
                                                onChange={(e) => setTargetRoles([e.target.value])}
                                                className="w-full p-1 rounded border border-red-200 text-red-800 focus:ring-red-500 outline-none bg-white"
                                            >
                                                <option value="All">All Staff</option>
                                                <option value="Recruiter">Recruiters Only</option>
                                                <option value="Hiring Manager">Managers Only</option>
                                                <option value="Admin">Admins Only</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-end gap-2 p-2">
                            <textarea 
                                ref={textAreaRef}
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                placeholder={isAdminUpdate ? "Type your announcement here (will be pinned)..." : "Type a message..."}
                                className={`flex-1 bg-transparent border-none outline-none text-sm max-h-32 resize-none py-2 ${isAdminUpdate ? 'text-red-900 placeholder-red-300' : 'text-slate-800 placeholder-slate-400'}`}
                                rows={1}
                            />
                            <div className="relative">
                                <button 
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-1.5 rounded transition-colors ${isAdminUpdate ? 'text-red-400 hover:text-red-600 hover:bg-red-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <Smile size={20}/>
                                </button>
                                {showEmojiPicker && (
                                    <div className="absolute bottom-10 right-0 bg-white shadow-xl border border-slate-200 rounded-lg p-2 grid grid-cols-5 gap-1 w-40 z-20">
                                        {EMOJIS.map(emoji => (
                                            <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="p-1.5 hover:bg-slate-100 rounded text-lg text-center">{emoji}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSend} 
                        disabled={!inputText.trim()}
                        className={`p-3 rounded-lg transition-colors text-white shadow-md ${isAdminUpdate ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Send size={20}/>
                    </button>
                </div>
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
            <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full animate-fadeIn">
                    <h3 className="font-bold text-lg mb-2">Delete Message?</h3>
                    <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this message? This cannot be undone.</p>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => confirmDelete(deleteConfirmId, true)} className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Delete for Everyone</button>
                        <button onClick={() => confirmDelete(deleteConfirmId, false)} className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Delete for Me</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm mt-2">Cancel</button>
                    </div>
                </div>
            </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroupModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-bold text-lg">Create New Group</h3>
                        <button onClick={() => setShowCreateGroupModal(false)}><X size={20}/></button>
                    </div>
                    <form onSubmit={handleCreateGroupSubmit} className="p-4 flex flex-col h-[500px]">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group Name</label>
                            <input 
                                required
                                className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Project Alpha"
                                value={groupForm.name}
                                onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                            />
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Members</label>
                            <div className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-1">
                                {users.filter(u => u.id !== currentUser?.id && u.status === 'Active').map(user => (
                                    <label key={user.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-slate-50 ${groupForm.members.includes(user.id) ? 'bg-blue-50 border-blue-100' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={groupForm.members.includes(user.id)}
                                            onChange={() => toggleMemberSelection(user.id)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <img src={user.avatar} className="w-8 h-8 rounded-full object-cover"/>
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 mt-4 border-t">
                            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Create Group</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Group Settings Modal */}
        {showGroupSettingsModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-bold text-lg">Group Settings</h3>
                        <button onClick={() => setShowGroupSettingsModal(false)}><X size={20}/></button>
                    </div>
                    <form onSubmit={handleUpdateGroupSubmit} className="p-4 flex flex-col h-[500px]">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Group Name</label>
                            <input 
                                required
                                className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={groupForm.name}
                                onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                            />
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Manage Members</label>
                            <div className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-1">
                                {users.filter(u => u.id !== currentUser?.id && u.status === 'Active').map(user => (
                                    <label key={user.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-slate-50 ${groupForm.members.includes(user.id) ? 'bg-blue-50 border-blue-100' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={groupForm.members.includes(user.id)}
                                            onChange={() => toggleMemberSelection(user.id)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <img src={user.avatar} className="w-8 h-8 rounded-full object-cover"/>
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 mt-4 border-t">
                            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Call Overlay */}
        {callStatus !== 'idle' && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
                <div className="flex flex-col items-center text-white animate-bounce-slight">
                    {callType === 'video' && !isVideoOff ? (
                        <div className="w-40 h-40 rounded-2xl bg-slate-800 mb-6 flex items-center justify-center border-4 border-slate-700 shadow-2xl overflow-hidden relative">
                             <img src={activeUser?.avatar || ''} className="w-full h-full object-cover opacity-50"/>
                             <Video size={48} className="absolute"/>
                        </div>
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-slate-800 mb-6 flex items-center justify-center border-4 border-slate-700 shadow-2xl overflow-hidden">
                            {activeUser?.avatar ? <img src={activeUser.avatar} className="w-full h-full object-cover"/> : (activeClient ? <div className="text-2xl font-bold">{activeClient.name.charAt(0)}</div> : <span className="text-2xl font-bold">{activeGroup ? activeGroup.name.charAt(0) : '#'}</span>)}
                        </div>
                    )}
                    
                    <h2 className="text-2xl font-bold mb-1">
                        {activeUser?.name || activeClient?.name || activeGroup?.name}
                    </h2>
                    <p className="text-slate-400 mb-8 animate-pulse">
                        {callStatus === 'ringing' ? 'Calling...' : formatDuration(callDuration)}
                    </p>

                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            {isMuted ? <MicOff size={24}/> : <Mic size={24}/>}
                        </button>
                        
                        <button 
                            onClick={handleEndCall}
                            className="p-5 rounded-full bg-red-600 hover:bg-red-700 shadow-lg hover:scale-110 transition-all"
                        >
                            <Phone size={32} className="rotate-[135deg]"/>
                        </button>

                        {callType === 'video' && (
                            <button 
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-white text-slate-900' : 'bg-slate-700 hover:bg-slate-600'}`}
                            >
                                {isVideoOff ? <VideoOff size={24}/> : <Video size={24}/>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default ChatSystem;
