import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { setOpenDesignChat } from '../../../lib/designChatState';

export default function DesignDetailModal({ design, onClose, selectedVersion }) {
  const { profile } = useAuth();
  const [communications, setCommunications] = useState([]);
  const [client, setClient] = useState(null);
  const [designVersions, setDesignVersions] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(selectedVersion ? 'versions' : 'client');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [versionFileUrls, setVersionFileUrls] = useState({});
  const [commFileUrls, setCommFileUrls] = useState({});
  const [newMessageNotice, setNewMessageNotice] = useState(null);
  const knownCommIdsRef = useRef(null);
  
  // New version form state
  const [showNewVersionForm, setShowNewVersionForm] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version_number: designVersions.length > 0 ? Math.max(...designVersions.map(v => v.version_number)) + 1 : 1,
    description: '',
    status: 'Sent',
    sent_on: new Date().toISOString().slice(0, 16),
    sent_by: profile?.username || '',
    file: null
  });
  const [versionUploading, setVersionUploading] = useState(false);

  // Update version number when design versions change
  useEffect(() => {
    if (designVersions.length > 0) {
      const maxVersion = Math.max(...designVersions.map(v => v.version_number));
      setNewVersion(prev => ({ ...prev, version_number: maxVersion + 1 }));
    } else {
      setNewVersion(prev => ({ ...prev, version_number: 1 }));
    }
  }, [designVersions]);

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
        if (url) {
          newUrls[file.id] = url;
        }
      }
      setCommFileUrls(newUrls);
    };

    generateUrls();
  }, [communications]);

  useEffect(() => {
    if (design?.id) {
      fetchCommunications();
      fetchClientInfo();
      fetchDesignVersionsWithFiles();
    }
  }, [design?.id]);

  // Mark this design as open so the global notifier defers to the in-modal one
  useEffect(() => {
    setOpenDesignChat(design?.id || null);
    return () => setOpenDesignChat(null);
  }, [design?.id]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!design?.id) return;

    const channel = supabase
      .channel(`design-communications-${design.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'design_communications',
          filter: `design_id=eq.${design.id}`
        },
        async (payload) => {
          console.log('Realtime INSERT event:', payload);
          
          // Fetch the full communication with sender info and files
          const newComm = await fetchSingleCommunication(payload.new.id);
          if (newComm) {
            setCommunications(prev => {
              // Avoid duplicates
              if (prev.some(c => c.id === newComm.id)) return prev;
              return [...prev, newComm];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [design?.id]);

  // Fallback polling for messages (in case realtime doesn't work)
  useEffect(() => {
    if (!design?.id) return;

    const interval = setInterval(() => {
      fetchCommunications();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [design?.id]);

  // Auto-mark incoming messages as read while the chat tab is open
  useEffect(() => {
    if (activeTab !== 'chat' || !profile?.id || communications.length === 0) return;

    const unreadIds = communications
      .filter((comm) => comm.sender_id !== profile.id && !comm.is_read)
      .map((comm) => comm.id);

    if (unreadIds.length === 0) return;

    const markAllAsRead = async () => {
      try {
        const readAt = new Date().toISOString();
        await supabase
          .from('design_communications')
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
        console.error('Error auto-marking messages as read:', error);
      }
    };

    markAllAsRead();
  }, [communications, profile?.id, activeTab]);

  // Notify about new incoming messages when not viewing the chat tab
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

    if (incoming.length > 0 && activeTab !== 'chat') {
      setNewMessageNotice(incoming[incoming.length - 1]);
    }
  }, [communications, profile?.id, activeTab, loading]);

  const fetchSingleCommunication = async (commId) => {
    try {
      const { data, error } = await supabase
        .from('design_communications')
        .select('*, sender:users!design_communications_sender_id_fkey(username), receiver:users!design_communications_receiver_id_fkey(username)')
        .eq('id', commId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Fetch attached files if any
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
      console.error('Error fetching new communication:', error);
      return null;
    }
  };

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('design_communications')
        .select('*, sender:users!design_communications_sender_id_fkey(username), receiver:users!design_communications_receiver_id_fkey(username)')
        .eq('design_id', design.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch files for each communication separately
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
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };

  const fetchClientInfo = async () => {
    try {
      if (design.order_id) {
        const { data, error } = await supabase
          .from('orders')
          .select('*, client:clients(*)')
          .eq('id', design.order_id)
          .single();

        if (error) throw error;
        setClient(data?.client || null);
      }
    } catch (error) {
      console.error('Error fetching client info:', error);
    }
  };

  const fetchDesignVersionsWithFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('design_versions')
        .select('*, file:files(id, name, path)')
        .eq('design_id', design.id)
        .order('version_number', { ascending: true });

      if (error) throw error;

      setDesignVersions(data || []);

      // Generate signed URLs for files
      const urls = {};
      for (const version of data || []) {
        if (version.file?.path) {
          const url = await getFileUrl(version.file.path);
          urls[version.id] = url;
        }
      }
      setVersionFileUrls(urls);
    } catch (error) {
      console.error('Error fetching design versions:', error);
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

      // Upload files if attached
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const fileName = `${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Save file metadata to database
          const { data: fileData, error: fileError } = await supabase
            .from('files')
            .insert({
              name: file.name,
              path: uploadData.path,
              mime_type: file.type,
              file_size: file.size,
              uploaded_by: userId,
              description: 'Design communication attachment'
            })
            .select()
            .single();

          if (fileError) throw fileError;
          fileIds.push(fileData.id);
        }
      }

      const { error } = await supabase
        .from('design_communications')
        .insert([{
          design_id: design.id,
          sender_id: userId,
          receiver_id: design.assigned_designer_id,
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

  const handleAddNewVersion = async (e) => {
    e.preventDefault();
    if (!newVersion.version_number || !newVersion.file) {
      alert('Please provide version number and upload a file');
      return;
    }

    try {
      setVersionUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Upload file
      const fileName = `${Date.now()}_${newVersion.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, newVersion.file);

      if (uploadError) throw uploadError;

      // Save file metadata
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          name: newVersion.file.name,
          path: uploadData.path,
          mime_type: newVersion.file.type,
          file_size: newVersion.file.size,
          uploaded_by: userId
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Create design version
      const { error: versionError } = await supabase
        .from('design_versions')
        .insert([{
          design_id: design.id,
          file_id: fileData.id,
          version_number: parseInt(newVersion.version_number),
          description: newVersion.description,
          sent_on: newVersion.sent_on ? new Date(newVersion.sent_on).toISOString() : null,
          sent_by: newVersion.sent_by,
          status: newVersion.status,
          comment: ''
        }]);

      if (versionError) throw versionError;

      // Reset form and refresh versions
      setNewVersion({
        version_number: '',
        description: '',
        status: 'Sent',
        sent_on: new Date().toISOString().slice(0, 16),
        sent_by: profile?.username || '',
        file: null
      });
      setShowNewVersionForm(false);
      await fetchDesignVersionsWithFiles();
    } catch (error) {
      console.error('Error adding new version:', error);
      alert('Error adding new version: ' + error.message);
    } finally {
      setVersionUploading(false);
    }
  };

  const handleVersionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewVersion(prev => ({ ...prev, file }));
    }
  };

  const unreadCount = communications.filter(
    (comm) => comm.sender_id !== profile?.id && !comm.is_read
  ).length;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Design Details</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 mb-6">
            {[
              { id: 'client', label: 'Client Info', icon: 'fa-user' },
              { id: 'design', label: 'Design Request', icon: 'fa-pen-to-square' },
              { id: 'versions', label: 'Design Versions', icon: 'fa-file-code' },
              { id: 'chat', label: 'Chat', icon: 'fa-comments' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                {tab.label}
                {tab.id === 'chat' && unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {/* Client Info Tab */}
            {activeTab === 'client' && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
                  Client Information
                </h3>
                {client ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-medium text-slate-500">Client Name:</span>
                      <p className="text-slate-800">{client.name || '-'}</p>
                    </div>
                    {client.company_name && (
                      <div>
                        <span className="font-medium text-slate-500">Company:</span>
                        <p className="text-slate-800">{client.company_name}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-slate-500">Phone:</span>
                        <p className="text-slate-800">{client.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Email:</span>
                        <p className="text-slate-800">{client.email || '-'}</p>
                      </div>
                    </div>
                    {client.address && (
                      <div>
                        <span className="font-medium text-slate-500">Address:</span>
                        <p className="text-slate-800">{client.address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-slate-500">Type:</span>
                        <p className="text-slate-800">{client.type || '-'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Status:</span>
                        <p className="text-slate-800">{client.status || '-'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No client information available</p>
                )}
              </div>
            )}

            {/* Design Request Tab */}
            {activeTab === 'design' && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
                  Design Request
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-slate-500">Order No:</span>
                      <p className="text-slate-800">{design.order?.order_no || '-'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Design Type:</span>
                      <p className="text-slate-800">{design.design_type || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Purpose:</span>
                    <p className="text-slate-800">{design.purpose || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-slate-500">Requested Date:</span>
                      <p className="text-slate-800">{design.requested_date || '-'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Required Date:</span>
                      <p className="text-slate-800">{design.required_date || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-slate-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        design.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        design.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        design.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {design.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Priority:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        design.priority === 'High' ? 'bg-red-100 text-red-700' :
                        design.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {design.priority}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Assigned Designer:</span>
                    <p className="text-slate-800">{design.assigned_designer?.username || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Brief Dimensions:</span>
                    <p className="text-slate-800">{design.brief_dimensions || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Specifications:</span>
                    <p className="text-slate-800">{design.specifications || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Special Instructions:</span>
                    <p className="text-slate-800">{design.special_instructions || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Internal Notes:</span>
                    <p className="text-slate-800">{design.internal_notes || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Design Versions Tab */}
            {activeTab === 'versions' && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                    Design Versions
                  </h3>
                  <button
                    onClick={() => setShowNewVersionForm(!showNewVersionForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-colors border-none cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Add Version
                  </button>
                </div>

                {/* New Version Form */}
                {showNewVersionForm && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
                    <form onSubmit={handleAddNewVersion} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Version Number</label>
                          <div className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-slate-50 text-slate-600">
                            {newVersion.version_number}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                          <select
                            value={newVersion.status}
                            onChange={(e) => setNewVersion(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                          >
                            <option value="Sent">Sent</option>
                            <option value="Reviewed">Reviewed</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                        <input
                          type="text"
                          value={newVersion.description}
                          onChange={(e) => setNewVersion(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter description"
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Sent On</label>
                        <input
                          type="datetime-local"
                          value={newVersion.sent_on}
                          onChange={(e) => setNewVersion(prev => ({ ...prev, sent_on: e.target.value }))}
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Sent By</label>
                        <div className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-slate-50 text-slate-600">
                          {newVersion.sent_by}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Upload File</label>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <input
                              type="file"
                              onChange={handleVersionFileChange}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                              required
                            />
                          </div>
                        </div>
                        {newVersion.file && (
                          <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg mt-2">
                            <i className="fa-solid fa-check text-green-700"></i>
                            <span className="text-xs text-green-700">{newVersion.file.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowNewVersionForm(false)}
                          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={versionUploading}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1.5 rounded-lg font-medium text-xs cursor-pointer border-none"
                        >
                          {versionUploading ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                          ) : (
                            'Save Version'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {designVersions && designVersions.length > 0 ? (
                  <div className="space-y-3">
                    {designVersions.map((version, index) => (
                      <div key={version.id} className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-xs text-slate-700">Version {version.version_number}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            version.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            version.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            version.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {version.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{version.description || '-'}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div>
                            <span className="font-medium">Sent On:</span> {version.sent_on ? new Date(version.sent_on).toLocaleDateString() : '-'}
                          </div>
                          <div>
                            <span className="font-medium">Sent By:</span> {version.sent_by || '-'}
                          </div>
                        </div>
                        {version.file && versionFileUrls[version.id] && (
                          <div className="mt-2">
                            <a
                              href={versionFileUrls[version.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <i className="fa-solid fa-file-arrow-down"></i>
                              {version.file.name}
                            </a>
                          </div>
                        )}
                        {version.comment && (
                          <div className="mt-2 text-xs text-slate-600">
                            <span className="font-medium">Comment:</span> {version.comment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No design versions yet</p>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col h-[500px]">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
                  Communication with Designer
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
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
                        <p className="text-xs text-slate-800">{comm.message}</p>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New message notification */}
      {newMessageNotice && activeTab !== 'chat' && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4"
          onClick={() => setNewMessageNotice(null)}
        >
          <div
            className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-comment-dots text-blue-600 text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800">New message in active design</p>
                <p className="text-xs text-slate-500 mt-1 break-words">
                  {newMessageNotice.sender?.username || 'Unknown'}: {newMessageNotice.message}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('chat');
                      setNewMessageNotice(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMessageNotice(null)}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
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