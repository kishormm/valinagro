// src/components/UploadProofModal.jsx

'use client';
import { useState, useRef } from 'react';
import { uploadPaymentProof } from '@/services/apiService'; // We will add this function
import toast from 'react-hot-toast';

export default function UploadProofModal({ isOpen, onClose, transactionId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Optional: Check file size or type
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File is too large (max 5MB).');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadPaymentProof(transactionId, formData);
      toast.success('Payment proof uploaded successfully! Admin will verify shortly.');
      onUploadSuccess(); // This will call fetchData on the dashboard
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      // Error toast is already handled by apiService
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload Payment Proof</h2>
        <p className="text-gray-600 mb-4">Please upload a screenshot of your completed payment for transaction ID: <span className="font-medium text-blue-600">{transactionId.slice(0, 10)}...</span></p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="payment-proof">
              Screenshot File (PNG, JPG, max 5MB)
            </label>
            <input
              ref={fileInputRef}
              id="payment-proof"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <p className="text-sm text-gray-600 mb-4">Selected file: <span className="font-medium">{file.name}</span></p>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Uploading...' : 'Submit Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}