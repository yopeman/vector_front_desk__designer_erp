import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function DesignDetailModal({ design, onClose, onUpdate }) {
  const { profile } = useAuth();
  const [communications, setCommunications] = useState([]);
  const [client, setClient] = useState(null);
  const [designVersions, setDesignVersions] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState(design.status);
  const [editPriority, setEditPriority] = useState(design.priority);
  const [editNotes, setEditNotes] = useState(design.internal_notes || '');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('client');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [versionFileUrls, setVersionFileUrls] = useState({});

  useEffect(() => {
    if (design?.id) {
      fetchCommunications();
      fetchClientInfo();
      fetchDesignVersionsWithFiles();
    }
  }, [design?.id]);

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
            return { ...comm, attached_files: files || [] };
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

  const handleUpdateDesign = async () => {
    try {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from('designs')
        .update({
          status: editStatus,
          priority: editPriority,
          internal_notes: editNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', design.id);

      if (error) throw error;

      // Update local design object
      design.status = editStatus;
      design.priority = editPriority;
      design.internal_notes = editNotes;

      setEditMode(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating design:', error);
      alert('Failed to update design: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleQuickStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from('designs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', design.id);

      if (error) throw error;

      design.status = newStatus;
      setEditStatus(newStatus);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating design status:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const markAsRead = async (communicationId) => {
    try {
      await supabase
        .from('design_communications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', communicationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Design Request
                  </h3>
                  <div className="flex gap-2">
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditMode(false)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-600 border border-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateDesign}
                          disabled={updatingStatus}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white border-none rounded-lg text-xs font-medium hover:bg-green-700 transition-colors cursor-pointer"
                        >
                          {updatingStatus ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa-solid fa-floppy-disk"></i>
                          )} Save
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Status Update Bar */}
                {!editMode && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-medium text-slate-500">Quick Update Status:</span>
                    {['Pending', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleQuickStatusUpdate(status)}
                        disabled={updatingStatus || design.status === status}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          design.status === status
                            ? 'bg-blue-100 text-blue-700 border-blue-300 cursor-default'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {updatingStatus ? (
                          <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                          status
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  {editMode ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-slate-500 block mb-1">Status</span>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block mb-1">Priority</span>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-500 block mb-1">Internal Notes</span>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={4}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                        />
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Design Versions Tab */}
            {activeTab === 'versions' && (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">
                  Design Versions
                </h3>
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
                            <span className="font-medium">Sent On:</span> {version.sent_on || '-'}
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
                            {comm.attached_files.map((file) => (
                              <div key={file.id} className="flex items-center gap-2 bg-white/50 p-2 rounded">
                                <i className="fa-solid fa-file text-slate-500 text-xs"></i>
                                <span className="text-xs text-slate-700">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!comm.is_read && comm.sender_id !== profile?.id && (
                          <button
                            onClick={() => markAsRead(comm.id)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                          >
                            Mark as read
                          </button>
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
    </div>
  );
}
