import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function ProductionOrderModal({ onClose, onSuccess, editOrder }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [designVersions, setDesignVersions] = useState([]);
  const [existingFileIds, setExistingFileIds] = useState([]);

  const [formData, setFormData] = useState({
    material: '',
    thickness: '',
    color: '',
    machine_id: '',
    order_id: '',
    job_order_id: '',
    length: '',
    width: '',
    height: '',
    gram: '',
    design_version_id: '',
    task_type: 'project',
    priority: 'Medium',
    job_type: 'received',
    note: ''
  });

  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadedFileIds, setUploadedFileIds] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchJobOrders();
    fetchMachines();
    fetchDesignVersions();

    // If editing, populate form with existing data
    if (editOrder) {
      setFormData({
        material: editOrder.material || '',
        thickness: editOrder.thickness || '',
        color: editOrder.color || '',
        machine_id: editOrder.machine_id || '',
        order_id: editOrder.order_id || '',
        job_order_id: editOrder.job_order_id || '',
        length: editOrder.length || '',
        width: editOrder.width || '',
        height: editOrder.height || '',
        gram: editOrder.gram || '',
        design_version_id: editOrder.design_version_id || '',
        task_type: editOrder.task_type || 'project',
        priority: editOrder.priority || 'Medium',
        job_type: editOrder.job_type || 'received',
        note: editOrder.note || ''
      });
      setExistingFileIds(editOrder.attached_file_ids || []);

      // Fetch existing file details
      if (editOrder.attached_file_ids && editOrder.attached_file_ids.length > 0) {
        fetchExistingFiles(editOrder.attached_file_ids);
      }
    }
  }, [editOrder]);

  const fetchExistingFiles = async (fileIds) => {
    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds);

      if (error) throw error;
      setExistingFiles(files || []);
    } catch (error) {
      console.error('Error fetching existing files:', error);
      setExistingFiles([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_no, clients(name)')
        .in('status', ['New', 'In Progress', 'In Production'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchJobOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('job_orders')
        .select('*, invoice:invoices(invoice_no, order:orders(order_no, clients(name)))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobOrders(data || []);
    } catch (error) {
      console.error('Error fetching job orders:', error);
    }
  };

  const fetchMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchDesignVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('design_versions')
        .select('id, version_number, designs(*, orders(order_no, clients(name)))')
        .eq('status', 'Approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesignVersions(data || []);
    } catch (error) {
      console.error('Error fetching design versions:', error);
    }
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList).filter(f => f && f.name);
    if (files.length === 0) return;
    setAttachedFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
      const unique = files.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
      return [...prev, ...unique];
    });
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handlePaste = (e) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const uploadFile = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Insert file record into files table
      const { data: fileRecord, error: insertError } = await supabase
        .from('files')
        .insert({
          name: file.name,
          path: data.path,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return fileRecord.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload files and get their IDs
      const fileIds = [];
      for (const file of attachedFiles) {
        try {
          const fileId = await uploadFile(file);
          fileIds.push(fileId);
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          alert(`Failed to upload file: ${file.name}`);
        }
      }

      // Combine existing file IDs with new ones
      const allFileIds = [...existingFileIds, ...fileIds];

      if (editOrder) {
        // Update existing order
        const { error } = await supabase
          .from('production_orders')
          .update({
            order_id: formData.order_id || null,
            job_order_id: formData.job_order_id || null,
            machine_id: formData.machine_id || null,
            material: formData.material,
            thickness: formData.thickness,
            color: formData.color,
            length: formData.length,
            width: formData.width,
            height: formData.height,
            gram: formData.gram,
            task_type: formData.task_type,
            priority: formData.priority,
            job_type: formData.job_type,
            note: formData.note,
            attached_file_ids: allFileIds
          })
          .eq('id', editOrder.id);

        if (error) throw error;
      } else {
        // Create new order
        const { error } = await supabase
          .from('production_orders')
          .insert({
            order_id: formData.order_id || null,
            job_order_id: formData.job_order_id || null,
            designer_id: user.id,
            machine_id: formData.machine_id || null,
            material: formData.material,
            thickness: formData.thickness,
            color: formData.color,
            length: formData.length,
            width: formData.width,
            height: formData.height,
            gram: formData.gram,
            task_type: formData.task_type,
            priority: formData.priority,
            job_type: formData.job_type,
            status: 'New',
            note: formData.note,
            attached_file_ids: allFileIds
          });

        if (error) throw error;
      }

      // If design version is selected, link it somehow (you may need to add a field to production_orders)
      if (formData.design_version_id) {
        // You might need to add design_version_id to production_orders table
        console.log('Design version selected:', formData.design_version_id);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving production order:', error);
      alert('Failed to save production order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 mt-16">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Send to Production</h2>
            <p className="text-sm text-slate-500">Create a new production order</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} onPaste={handlePaste} className="p-6 space-y-6">
          {/* Task Type */}
          {/* <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Task Type <span className="text-red-500">*</span>
            </label>
            <select
              name="task_type"
              value={formData.task_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="project">Project</option>
              <option value="task">Task</option>
            </select>
          </div> */}

          {/* Order Selection */}
          {/* <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Order
            </label>
            <select
              name="order_id"
              value={formData.order_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Order (Optional)</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.order_no} - {order.clients?.name || 'Unknown Client'}
                </option>
              ))}
            </select>
          </div> */}

          {/* Job Order Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Job Order
            </label>
            <select
              name="job_order_id"
              value={formData.job_order_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Job Order (Optional)</option>
              {jobOrders.map(jobOrder => (
                <option key={jobOrder.id} value={jobOrder.id}>
                  {jobOrder.job_no} - {jobOrder.invoice?.order?.clients?.name || 'Unknown Client'}
                </option>
              ))}
            </select>
          </div>

          {/* Design Version */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Design Version
            </label>
            <select
              name="design_version_id"
              value={formData.design_version_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Design Version (Optional)</option>
              {designVersions.map(version => (
                <option key={version.id} value={version.id}>
                  Version {version.version_number} - {version.designs?.orders?.order_no}
                </option>
              ))}
            </select>
          </div>

          {/* Material, Thickness, Color */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Material <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                required
                placeholder="e.g., Acrylic"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Thickness <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="thickness"
                value={formData.thickness}
                onChange={handleChange}
                required
                placeholder="e.g., 4mm"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Color <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                placeholder="e.g., Transparent"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Machine Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Machine <span className="text-red-500">*</span>
            </label>
            <select
              name="machine_id"
              value={formData.machine_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Machine</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.machine_type})
                </option>
              ))}
            </select>
          </div>

          {/* Designer (Read Only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Designer
            </label>
            <input
              type="text"
              value={profile?.username || user?.email || 'Unknown'}
              readOnly
              disabled
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Dimensions - Size Layout Spec */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Dimensions (Size Layout Spec)
            </label>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Length</label>
                <input
                  type="text"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="e.g., 600 mm"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Width</label>
                <input
                  type="text"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  placeholder="e.g., 400 mm"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Height</label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g., 12 mm"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Gram</label>
                <input
                  type="text"
                  name="gram"
                  value={formData.gram}
                  onChange={handleChange}
                  placeholder="e.g., 150 g"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Task Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Task Type
              </label>
              <select
                name="task_type"
                value={formData.task_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="project">Project</option>
                <option value="task">Task</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Note
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="3"
              placeholder="Add any additional notes..."
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Attached Files
            </label>
            <div
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="text-sm text-slate-600 mb-1">
                <i className="fa-solid fa-cloud-arrow-up text-blue-500 mr-1.5"></i>
                Drag &amp; drop files here, click to select, or paste (Ctrl+V)
              </div>
              <div className="text-xs text-slate-400">Multiple files supported</div>
              {/* Existing files */}
              {existingFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Existing files:</p>
                  {existingFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-file text-blue-500"></i>
                        <span className="text-sm text-slate-700">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(file.file_size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExistingFiles(prev => prev.filter(f => f.id !== file.id));
                          setExistingFileIds(prev => prev.filter(id => id !== file.id));
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove existing file"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* New files */}
              {attachedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">New files to upload:</p>
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-file text-blue-500"></i>
                        <span className="text-sm text-slate-700">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  Send to Production
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
