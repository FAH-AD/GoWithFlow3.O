import React, { useState } from 'react';
import { X, CheckCircle, Upload, File } from 'lucide-react';

const JobCompletionModal = ({ 
  isOpen, 
  onClose, 
  job, 
  userRole, 
  onComplete, 
  onSubmitWork 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workSubmission, setWorkSubmission] = useState({
    message: '',
    attachments: []
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  if (!isOpen) return null;

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitWork = async () => {
    setIsSubmitting(true);
    try {
      // Here you would typically upload files to your storage service
      // For now, we'll just pass the file data
      const attachments = uploadedFiles.map(file => ({
        filename: file.name,
        url: URL.createObjectURL(file) // In production, this would be the uploaded file URL
      }));

      await onSubmitWork({
        message: workSubmission.message,
        attachments
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting work:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteJob = async () => {
    setIsSubmitting(true);
    try {
      await onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFreelancer = userRole === 'freelancer';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isFreelancer ? 'Submit Work for Review' : 'Complete Job'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">{job?.title}</h4>
          <p className="text-sm text-gray-600">{job?.description}</p>
        </div>

        {isFreelancer ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Message
              </label>
              <textarea
                value={workSubmission.message}
                onChange={(e) => setWorkSubmission(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe the work completed and any additional notes..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-purple-600 hover:text-purple-700"
                >
                  Click to upload files
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Upload project files, screenshots, or documentation
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center">
                        <File className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={isSubmitting || !workSubmission.message.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Work
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                By marking this job as completed, you confirm that the work has been delivered 
                satisfactorily. Both you and the freelancer will be prompted to leave reviews.
              </p>
            </div>

            {job?.workSubmission && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-800 mb-2">Work Submitted</h5>
                <p className="text-sm text-gray-600 mb-2">{job.workSubmission.message}</p>
                {job.workSubmission.attachments?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Attachments:</p>
                    {job.workSubmission.attachments.map((file, index) => (
                      <div key={index} className="flex items-center">
                        <File className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-600">{file.filename}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteJob}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Job
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCompletionModal;
