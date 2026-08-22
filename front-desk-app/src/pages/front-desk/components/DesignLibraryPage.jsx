import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function DesignLibraryPage() {
  const { user } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [designLibrarySearch, setDesignLibrarySearch] = useState('');
  const [designLibraryFilter, setDesignLibraryFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [fileUrls, setFileUrls] = useState({});

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('designs')
        .select('*, orders(order_no, clients(name)), assigned_designer:users(id, username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
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

  const handleViewDesign = async (design) => {
    // Fetch design details
    try {
      const { data: designers } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', design.assigned_designer_id)
        .single();
      
      const allFileIds = design.attached_file_ids || [];
      const { data: files } = await supabase
        .from('files')
        .select('id, name, path')
        .in('id', allFileIds);

      const { data: designVersions } = await supabase
        .from('design_versions')
        .select('*, files(id, name, path)')
        .eq('design_id', design.id);

      const { data: communications } = await supabase
        .from('design_communications')
        .select('*, sender:sender_id(id, username), receiver:receiver_id(id, username)')
        .eq('design_id', design.id)
        .order('created_at', { ascending: false });

      const urls = {};
      if (files) {
        for (const file of files) {
          if (file.path) {
            const url = await getFileUrl(file.path);
            if (url) urls[file.id] = url;
          }
        }
      }
      if (designVersions) {
        for (const version of designVersions) {
          if (version.files?.path) {
            const url = await getFileUrl(version.files.path);
            if (url) urls[version.files.id] = url;
          }
        }
      }

      setSelectedTask({
        ...design,
        assigned_designer: designers,
        attached_files: files || [],
        design_versions: designVersions || [],
        communications: communications || []
      });
      setFileUrls(urls);
      setShowTaskModal(true);
    } catch (error) {
      console.error('Error fetching design details:', error);
    }
  };

  const updateDesignStatus = async (designId, newStatus) => {
    try {
      const { error } = await supabase
        .from('designs')
        .update({ status: newStatus })
        .eq('id', designId);
      
      if (error) throw error;
      await fetchDesigns();
    } catch (error) {
      console.error('Error updating design status:', error);
      alert('Error updating design status: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Design Library</h1>
          <p className="text-xs text-slate-500">All designs across all statuses and users</p>
        </div>
        <span className="text-[11px] font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
          <i className="fa-solid fa-database text-blue-500"></i>
          <span>{designs.length}</span> total designs
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by design type, client, or order..."
              value={designLibrarySearch}
              onChange={(e) => setDesignLibrarySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={designLibraryFilter}
          onChange={(e) => setDesignLibraryFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600">Design Type</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Order</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Client</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Priority</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Assigned Designer</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {designs
              .filter(d => designLibraryFilter === 'all' || d.status === designLibraryFilter)
              .filter(d => {
                const matchesSearch = 
                  (d.design_type?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase()) ||
                  (d.orders?.clients?.name?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase()) ||
                  (d.orders?.order_no?.toLowerCase() || '').includes(designLibrarySearch.toLowerCase());
                return matchesSearch;
              })
              .map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {d.design_type || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {d.orders?.order_no || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {d.orders?.clients?.name || '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      d.priority === 'High'
                        ? 'bg-red-50 text-red-700'
                        : d.priority === 'Medium'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {d.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {d.assigned_designer?.username || '-'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleViewDesign(d)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-transparent border-none cursor-pointer flex items-center gap-1"
                  >
                    <i className="fa-solid fa-eye"></i> Show
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTaskModal && selectedTask && (
            <div className="modal-overlay" style={{display: 'flex'}}>
              <div className="modal-content">
                <div className="close-modal-icon" onClick={() => setShowTaskModal(false)}>
                  <i className="fa-solid fa-times"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Task Details</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Design Type</span>
                    <p className="font-semibold text-slate-900">{selectedTask.design_type || '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purpose</span>
                    <p className="text-slate-700">{selectedTask.purpose || '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Date</span>
                    <p className="text-slate-700">{selectedTask.requested_date ? new Date(selectedTask.requested_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Required Date</span>
                    <p className="text-slate-700">{selectedTask.required_date ? new Date(selectedTask.required_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                    <span className={`status-badge ${selectedTask.status === 'Pending' ? 'status-pending' : selectedTask.status === 'In Progress' ? 'status-progress' : selectedTask.status === 'Completed' ? 'status-completed' : 'status-cancelled'}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</span>
                    <span className={`priority-badge ${selectedTask.priority === 'High' ? 'priority-high' : selectedTask.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Designer</span>
                    <p className="text-slate-700">{selectedTask.assigned_designer?.username || '-'}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Brief Dimensions</h3>
                  <p className="text-sm text-slate-600">{selectedTask.brief_dimensions || '-'}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Specifications</h3>
                  <p className="text-sm text-slate-600">{selectedTask.specifications || '-'}</p>
                </div>

                {selectedTask.special_instructions && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Special Instructions</h3>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-900">{selectedTask.special_instructions}</p>
                    </div>
                  </div>
                )}

                {selectedTask.internal_notes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Internal Notes</h3>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600">{selectedTask.internal_notes}</p>
                    </div>
                  </div>
                )}

                {selectedTask.attached_files && selectedTask.attached_files.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Attached Files</h3>
                    <div className="space-y-2">
                      {selectedTask.attached_files.map((file) => {
                        const fileUrl = fileUrls[file.id];
                        return (
                          <div key={file.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                            <i className="fa-solid fa-paperclip text-blue-600"></i>
                            <span className="text-slate-600">{file.name}</span>
                            {fileUrl ? (
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-auto text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <i className="fa-solid fa-external-link-alt"></i> Open
                              </a>
                            ) : (
                              <span className="ml-auto text-slate-400 text-xs">No URL available</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedTask.design_versions && selectedTask.design_versions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Design Versions</h3>
                    <div className="space-y-3">
                      {selectedTask.design_versions.map((version) => (
                        <div key={version.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">Version {version.version_number}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                version.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                version.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                version.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {version.status}
                              </span>
                            </div>
                            {version.sent_on && (
                              <span className="text-xs text-slate-500">
                                {new Date(version.sent_on).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {version.description && (
                            <p className="text-sm text-slate-600 mb-2">{version.description}</p>
                          )}
                          {version.files && (
                            <div className="flex items-center gap-2">
                              <i className="fa-solid fa-file text-slate-400"></i>
                              <span className="text-sm text-slate-600">{version.files.name}</span>
                              {fileUrls[version.files.id] && (
                                <a 
                                  href={fileUrls[version.files.id]} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-auto text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                                >
                                  <i className="fa-solid fa-external-link-alt"></i> Open
                                </a>
                              )}
                            </div>
                          )}
                          {version.sent_by && (
                            <div className="text-xs text-slate-500 mt-2">
                              Sent by: {version.sent_by}
                            </div>
                          )}
                          {version.comment && (
                            <div className="mt-2 p-2 bg-white border border-slate-200 rounded text-xs text-slate-600">
                              <span className="font-semibold">Comment:</span> {version.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.communications && selectedTask.communications.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Communications</h3>
                    <div className="space-y-3">
                      {selectedTask.communications.map((comm) => (
                        <div key={comm.id} className={`p-4 rounded-lg border ${comm.is_read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{comm.sender?.username || 'Unknown'}</span>
                              {!comm.is_read && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">New</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(comm.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{comm.message}</p>
                          {comm.attached_file_ids && comm.attached_file_ids.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <i className="fa-solid fa-paperclip"></i>
                              <span>{comm.attached_file_ids.length} file(s) attached</span>
                            </div>
                          )}
                          {comm.receiver && (
                            <div className="text-xs text-slate-500 mt-2">
                              To: {comm.receiver.username}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  {selectedTask.assigned_designer_id === user?.id && selectedTask.status === 'Pending' && (
                    <button 
                      onClick={() => { updateDesignStatus(selectedTask.id, 'In Progress'); setSelectedTask({...selectedTask, status: 'In Progress'}); }}
                      className="btn-primary-custom"
                    >
                      <i className="fa-solid fa-play"></i> Start Task
                    </button>
                  )}
                  {selectedTask.assigned_designer_id === user?.id && selectedTask.status === 'In Progress' && (
                    <button 
                      onClick={() => { updateDesignStatus(selectedTask.id, 'Completed'); setSelectedTask({...selectedTask, status: 'Completed'}); }}
                      className="btn-primary-custom"
                    >
                      <i className="fa-solid fa-check"></i> Complete Task
                    </button>
                  )}
                  <button onClick={() => setShowTaskModal(false)} className="btn-secondary-custom">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
