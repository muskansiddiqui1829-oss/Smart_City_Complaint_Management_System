import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { complaintAPI } from '../services/api';
import { FiUploadCloud, FiX, FiMapPin, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(5, 'Min 5 characters').max(100),
  description: z.string().min(20, 'Min 20 characters').max(2000),
  category: z.string().min(1, 'Select a category'),
  priority: z.string().default('medium'),
  address: z.string().min(5, 'Address is required'),
  ward: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  tags: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

const CATEGORIES = [
  { value: 'roads', label: '🛣️ Roads & Transport' },
  { value: 'water', label: '💧 Water Supply' },
  { value: 'electricity', label: '⚡ Electricity' },
  { value: 'sanitation', label: '🗑️ Sanitation & Waste' },
  { value: 'parks', label: '🌳 Parks & Gardens' },
  { value: 'health', label: '🏥 Public Health' },
  { value: 'noise', label: '🔊 Noise Pollution' },
  { value: 'illegal_construction', label: '🏗️ Illegal Construction' },
  { value: 'public_transport', label: '🚌 Public Transport' },
  { value: 'general', label: '📋 General' },
];

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', isAnonymous: false },
  });

  const onDrop = useCallback((acceptedFiles) => {
    if (images.length + acceptedFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
  });

  const removeImage = (index) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const nextStep = async () => {
    const fields = step === 1 ? ['title', 'description', 'category', 'priority'] : ['address'];
    const valid = await trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('priority', data.priority);
      formData.append('isAnonymous', data.isAnonymous || false);
      if (data.tags) formData.append('tags', data.tags);
      formData.append('location', JSON.stringify({
        address: data.address,
        ward: data.ward || '',
        city: data.city || 'Smart City',
        pincode: data.pincode || '',
      }));
      images.forEach(img => formData.append('images', img.file));

      const res = await complaintAPI.submit(formData);
      toast.success(`Complaint submitted! ID: ${res.data.complaintId}`);
      navigate(`/complaints/${res.data._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
            ${step >= s ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {s}
          </div>
          {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-700' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Complaint</h1>
        <p className="text-gray-500 mt-1">Help us improve your city by reporting issues</p>
      </div>

      <div className="card p-6 sm:p-8">
        <StepIndicator />

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">Issue Details</h2>

              <div className="form-group">
                <label className="label">Title *</label>
                <input {...register('title')} className={`input ${errors.title ? 'input-error' : ''}`}
                  placeholder="Brief description of the issue" />
                {errors.title && <p className="error-msg">{errors.title.message}</p>}
              </div>

              <div className="form-group">
                <label className="label">Description *</label>
                <textarea {...register('description')} rows={4}
                  className={`input resize-none ${errors.description ? 'input-error' : ''}`}
                  placeholder="Describe the issue in detail. Include what happened, when it started, and any other relevant information..." />
                <div className="flex justify-between mt-1">
                  {errors.description ? <p className="error-msg">{errors.description.message}</p> : <span />}
                  <span className="text-xs text-gray-400">{watch('description')?.length || 0}/2000</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Category *</label>
                  <select {...register('category')} className={`input ${errors.category ? 'input-error' : ''}`}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.category && <p className="error-msg">{errors.category.message}</p>}
                </div>

                <div className="form-group">
                  <label className="label">Priority</label>
                  <select {...register('priority')} className="input">
                    <option value="low">🟢 Low</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="critical">🔴 Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Tags (optional)</label>
                <input {...register('tags')} className="input" placeholder="e.g. pothole, streetlight, garbage (comma separated)" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input {...register('isAnonymous')} type="checkbox" className="w-4 h-4 rounded text-primary-600" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Submit Anonymously</span>
                  <p className="text-xs text-gray-400">Your name will not be shown publicly</p>
                </div>
              </label>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">
                <FiMapPin className="inline mr-2 text-primary-600" />
                Location Details
              </h2>

              <div className="form-group">
                <label className="label">Street Address *</label>
                <input {...register('address')} className={`input ${errors.address ? 'input-error' : ''}`}
                  placeholder="e.g. Near Bus Stop, Main Road, Sector 5" />
                {errors.address && <p className="error-msg">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Ward Number</label>
                  <input {...register('ward')} className="input" placeholder="e.g. Ward 12" />
                </div>
                <div className="form-group">
                  <label className="label">Pincode</label>
                  <input {...register('pincode')} className="input" placeholder="e.g. 400001" />
                </div>
              </div>

              <div className="form-group">
                <label className="label">City</label>
                <input {...register('city')} className="input" placeholder="City name" defaultValue="Smart City" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <FiAlertCircle className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Provide as specific a location as possible to help authorities find and resolve the issue faster.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">Photos (Optional)</h2>
              <p className="text-sm text-gray-500">Upload up to 5 photos to help authorities understand the issue better.</p>

              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'}`}>
                <input {...getInputProps()} />
                <FiUploadCloud className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Drop images here...' : 'Drag & drop images or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — Max 5MB each — Up to 5 files</p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.preview} alt={img.name}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center text-xs hover:bg-red-600">
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-5 border-t border-gray-100">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={nextStep} className="btn-primary flex-1">
                Continue →
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary flex-1 btn-lg">
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Submitting...' : '✓ Submit Complaint'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
