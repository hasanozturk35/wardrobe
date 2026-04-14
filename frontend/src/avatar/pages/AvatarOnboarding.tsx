import React, { useState } from 'react';
import { Camera, Upload, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { avatarApi } from '../avatar-api';
import { useNavigate } from 'react-router-dom';

const AvatarOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleUpload = async (type: 'selfie' | 'body') => {
    setLoading(true);
    try {
      if (type === 'selfie' && selfie) {
        await avatarApi.uploadSelfie(selfie);
        setStep(2);
      } else if (type === 'body' && bodyPhoto) {
        await avatarApi.uploadBodyPhoto(bodyPhoto);
        await avatarApi.triggerSynthesis();
        setStep(3);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-12">
        {/* Progress Header */}
        <div className="flex justify-between items-center opacity-40 text-[10px] uppercase font-bold tracking-[0.3em] mb-12">
          <span className={step >= 1 ? 'text-black opacity-100' : ''}>01. Selfie</span>
          <span className={step >= 2 ? 'text-black opacity-100' : ''}>02. Full Body</span>
          <span className={step >= 3 ? 'text-black opacity-100' : ''}>03. Ready</span>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl font-serif italic">Identity Capture.</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Upload a clear selfie. This will be used to generate your neural facial mesh for high-fidelity try-ons.
            </p>
            <div className="border-2 border-dashed border-gray-100 rounded-3xl p-12 flex flex-col items-center gap-6 bg-gray-50/50">
              <Camera size={48} className="text-gray-200" strokeWidth={1} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                className="hidden" 
                id="selfie-upload" 
              />
              <label htmlFor="selfie-upload" className="cursor-pointer text-[10px] uppercase font-bold tracking-widest border-b border-black pb-1">
                Select Selfie
              </label>
              {selfie && <span className="text-[10px] text-gray-400">{selfie.name}</span>}
            </div>
            <button 
              onClick={() => handleUpload('selfie')}
              disabled={!selfie || loading}
              className="w-full bg-black text-white py-6 rounded-full text-[10px] uppercase font-bold tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gray-800 transition-all disabled:opacity-20"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl font-serif italic">Body Geometry.</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Upload a full-body photo standing normally. Neutral lighting is best for accurate pose estimation.
            </p>
            <div className="border-2 border-dashed border-gray-100 rounded-3xl p-12 flex flex-col items-center gap-6 bg-gray-50/50">
              <Upload size={48} className="text-gray-200" strokeWidth={1} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setBodyPhoto(e.target.files?.[0] || null)}
                className="hidden" 
                id="body-upload" 
              />
              <label htmlFor="body-upload" className="cursor-pointer text-[10px] uppercase font-bold tracking-widest border-b border-black pb-1">
                Select Body Photo
              </label>
              {bodyPhoto && <span className="text-[10px] text-gray-400">{bodyPhoto.name}</span>}
            </div>
            <button 
              onClick={() => handleUpload('body')}
              disabled={!bodyPhoto || loading}
              className="w-full bg-black text-white py-6 rounded-full text-[10px] uppercase font-bold tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gray-800 transition-all disabled:opacity-20"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Synthesize Avatar'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 text-center animate-fade-in">
            <div className="flex justify-center">
              <CheckCircle size={80} className="text-black" strokeWidth={0.5} />
            </div>
            <h1 className="text-4xl font-serif italic">Avatar Created.</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your neural identity is being processed. It will be ready for virtual try-ons in a few moments.
            </p>
            <button 
              onClick={() => navigate('/avatar/profile')}
              className="w-full bg-black text-white py-6 rounded-full text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-gray-800 transition-all"
            >
              Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarOnboarding;
