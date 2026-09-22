import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { setOpenProductionChat } from '../lib/productionChatState';

const POLL_INTERVAL = 5000;

export default function ProductionChatPanel({ productionOrderId, height = '480px' }) {
  const { profile } = useAuth();
  const [communications, setCommunications] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [commFileUrls, setCommFileUrls] = useState({});
  const [newMessageNotice, setNewMessageNotice] = useState(null);
  const knownCommIdsRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setOpenProductionChat(productionOrderId || null);
    return () => setOpenProductionChat(null);
  }, [productionOrderId]);

  useEffect(() => {
    if (productionOrderId) fetchCommunications();
  }, [productionOrderId]);

  // Generate signed URLs for communication attached files
  useEffect(() => {
    const generateUrls = async () => {
      const filesToProcess = [];
      communications.forEach(comm => {
        if (comm.attached_files) {
          comm.attached_files.forEach(file => {
            if (file.path && !commFileUrls[file.id]) {
              filesToProcess.push(file);
            }
          });
        }
      });

      if (filesToProcess.length === 0) return;

      const newUrls = { ...commFileUrls };
      for (const file of filesToProcess) {
        const url = await getFileUrl(file.path);
        if (url) newUrls[file.id] = url;
      }
      setCommFileUrls(newUrls);
    };

    generateUrls();
  }, [communications]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!productionOrderId) return;

    const channel = supabase
      .channel(`production-communications-${productionOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'production_communications',
          filter: `production_order_id=eq.${productionOrderId}`
        },
        async (payload) => {
          const newComm = await fetchSingleCommunication(payload.new.id);
          if (newComm) {
            setCommunications(prev => {
              if (prev.some(c => c.id === newComm.id)) return prev;
              return [...prev, newComm];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productionOrderId]);

  // Fallback polling (in case realtime doesn't work)
  useEffect(() => {
    if (!productionOrderId) return;
    const interval = setInterval(() => {
      fetchCommunications();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [productionOrderId]);

  // Auto-mark incoming messages as read while the panel is open
  useEffect(() => {
    if (!profile?.id || communications.length === 0) return;

    const unreadIds = communications
      .filter((comm) => comm.sender_id !== profile.id && !comm.is_read)
      .map((comm) => comm.id);

    if (unreadIds.length === 0) return;

    const markAllAsRead = async () => {
      try {
        const readAt = new Date().toISOString();
        await supabase
          .from('production_communications')
          .update({ is_read: true, read_at: readAt })
          .in('id', unreadIds);

        setCommunications((prev) =>
          prev.map((comm) =>
            unreadIds.includes(comm.id)
              ? { ...comm, is_read: true, read_at: readAt }
              : comm
          )
        );
      } catch (error) {
        console.error('Error auto-marking production messages as read:', error);
      }
    };

    markAllAsRead();
  }, [communications, profile?.id]);

  // Notify about new incoming messages
  useEffect(() => {
    if (!profile?.id || loading) return;

    if (knownCommIdsRef.current === null) {
      knownCommIdsRef.current = new Set(communications.map((comm) => comm.id));
      return;
    }

    const incoming = communications.filter(
      (comm) =>
        comm.sender_id !== profile.id &&
        !knownCommIdsRef.current.has(comm.id)
    );

    incoming.forEach((comm) => knownCommIdsRef.current.add(comm.id));

    if (incoming.length > 0) {
      setNewMessageNotice(incoming[incoming.length - 1]);
      setTimeout(() => setNewMessageNotice(null), 6000);
    }
  }, [communications, profile?.id, loading]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [communications]);

  const fetchSingleCommunication = async (commId) => {
    try {
      const { data, error } = await supabase
        .from('production_communications')
        .select('*, sender:users!production_communications_sender_id_fkey(username), receiver:users!production_communications_receiver_id_fkey(username)')
        .eq('id', commId)
        .single();

      if (error || !data) return null;

      let attachedFiles = [];
      if (data.attached_file_ids && data.attached_file_ids.length > 0) {
        const { data: files } = await supabase
          .from('files')
          .select('id, name, path')
          .in('id', data.attached_file_ids);
        attachedFiles = files || [];
      }

      return { ...data, attached_files: attachedFiles };
    } catch (error) {
      console.error('Error fetching new production communication:', error);
      return null;
    }
  };

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('production_communications')
        .select('*, sender:users!production_communications_sender_id_fkey(username), receiver:users!production_communications_receiver_id_fkey(username)')
        .eq('production_order_id', productionOrderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const communicationsWithFiles = await Promise.all(
        (data || []).map(async (comm) => {
          if (comm.attached_file_ids && comm.attached_file_ids.length > 0) {
            const { data: files } = await supabase
              .from('files')
              .select('id, name, path')
              .in('id', comm.attached_file_ids);
            return { ...comm, attached_files: files || [] };
          }
          return { ...comm, attached_files: [] };
        })
      );

      setCommunications(communicationsWithFiles);
    } catch (error) {
      console.error('Error fetching production communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachedFiles.length === 0) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let fileIds = [];

      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const fileName = `${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: fileData, error: fileError } = await supabase
            .from('files')
            .insert({
              name: file.name,
              path: uploadData.path,
              mime_type: file.type,
              file_size: file.size,
              uploaded_by: userId,
              description: 'Production communication attachment'
            })
            .select()
            .single();

          if (fileError) throw fileError;
          fileIds.push(fileData.id);
        }
      }

      const { error } = await supabase
        .from('production_communications')
        .insert([{
          production_order_id: productionOrderId,
          sender_id: userId,
          receiver_id: null,
          message: newMessage,
          is_read: false,
          attached_file_ids: fileIds
        }]);

      if (error) throw error;

      setNewMessage('');
      setAttachedFiles([]);
      await fetchCommunications();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col" style={{ height }}>
      <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
        Communication on this Work
      </h3>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4" ref={scrollRef}>
        {loading ? (
          <div className="text-center text-slate-400 text-xs py-8">Loading messages...</div>
        ) : communications.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-8">No messages yet. Start the conversation!</div>
        ) : (
          communications.map((comm) => (
            <div
              key={comm.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                comm.sender_id === profile?.id
                  ? 'bg-blue-100 ml-auto'
                  : 'bg-white mr-auto'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-xs text-slate-700">
                  {comm.sender?.username || 'Unknown'}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-800 whitespace-pre-wrap">{comm.message}</p>
              {comm.attached_files && comm.attached_files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {comm.attached_files.map((file) => {
                    const fileUrl = commFileUrls[file.id];
                    return fileUrl ? (
                      <a
                        key={file.id}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/50 p-2 rounded hover:bg-blue-50 transition-colors text-xs text-blue-600 hover:text-blue-800 no-underline"
                      >
                        <i className="fa-solid fa-file text-blue-500 text-xs"></i>
                        <span className="text-xs text-blue-700">{file.name}</span>
                        <i className="fa-solid fa-external-link text-blue-400 text-[10px]"></i>
                      </a>
                    ) : (
                      <div key={file.id} className="flex items-center gap-2 bg-white/50 p-2 rounded">
                        <i className="fa-solid fa-file text-slate-500 text-xs"></i>
                        <span className="text-xs text-slate-700">{file.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {comm.sender_id === profile?.id && (
                <div className="flex justify-end mt-1">
                  <span
                    className={`text-[10px] ${
                      comm.is_read ? 'text-blue-600' : 'text-slate-400'
                    }`}
                    title={comm.is_read ? 'Read' : 'Sent'}
                  >
                    <i
                      className={`fa-solid ${
                        comm.is_read ? 'fa-check-double' : 'fa-check'
                      }`}
                    ></i>
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="space-y-3">
        {attachedFiles.length > 0 && (
          <div className="space-y-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                <i className="fa-solid fa-paperclip text-blue-600 text-xs"></i>
                <span className="text-xs text-blue-700 flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-600 hover:text-red-800 bg-transparent border-none cursor-pointer text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            />
            <label className="cursor-pointer flex items-center justify-center w-10 h-10 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <i className="fa-solid fa-paperclip text-slate-500 text-xs"></i>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none"
          >
            {uploading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-paper-plane"></i>
            )}
          </button>
        </div>
      </form>

      {newMessageNotice && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4"
          onClick={() => setNewMessageNotice(null)}
        >
          <div
            className="w-full max-w-sm bg-red-600 border border-red-700 rounded-xl shadow-xl p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-comment-dots text-white text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">New message on this work</p>
                <p className="text-xs text-red-50 mt-1 break-words">
                  {newMessageNotice.sender?.username || 'Unknown'}: {newMessageNotice.message}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setNewMessageNotice(null)}
                    className="bg-transparent border border-white/60 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}