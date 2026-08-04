// Storage module for file upload and voice recording functionality

let attachedFiles = [];
let voiceRecordingBlob = null;
let mediaRecorder = null;
let recordingChunks = [];

// Helper function to get file URL with fallback
async function getFileUrl(filePath) {
    try {
        console.log('Attempting to get signed URL for:', filePath);
        const { data, error } = await window.supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
        if (error) {
            console.error('Supabase signed URL error:', error);
            // Try public URL as fallback
            const { data: publicData, error: publicError } = await window.supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            if (publicError) {
                console.error('Public URL error:', publicError);
                return null;
            }
            console.log('Using public URL:', publicData.publicUrl);
            return publicData.publicUrl;
        }
        console.log('Signed URL generated:', data.signedUrl);
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting file URL:', error);
        return null;
    }
}

// Voice Recording using MediaRecorder API
async function toggleVoiceRecording(buttonId) {
    const btn = document.getElementById(buttonId);
    
    if (!btn.classList.contains('active-status')) {
        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordingChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordingChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                voiceRecordingBlob = new Blob(recordingChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            btn.classList.add('active-status');
            btn.innerText = "🛑 Recording voice...";
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please ensure microphone permissions are granted.');
        }
    } else {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        btn.classList.remove('active-status');
        btn.innerText = "🎤 Record Voice";
        
        if (voiceRecordingBlob) {
            alert("Voice message has been successfully recorded!");
        }
    }
}

// File Selection Handler
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    attachedFiles = [...attachedFiles, ...files];
    
    // Update UI to show attached files
    const labelId = event.target.id.replace('_file', '_file_lbl');
    const label = document.getElementById(labelId);
    if (label) {
        label.innerText = `✓ ${files.length} file(s) attached`;
        label.style.color = "#10b981";
    }
}

// Reset storage state
function resetStorageState() {
    attachedFiles = [];
    voiceRecordingBlob = null;
}

// Get current storage state
function getStorageState() {
    return {
        attachedFiles,
        voiceRecordingBlob
    };
}
