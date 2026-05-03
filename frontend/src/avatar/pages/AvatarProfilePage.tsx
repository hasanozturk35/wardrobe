import React, { useEffect, useState } from 'react';
import { User, Activity, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { avatarApi } from '../avatar-api';
import { useNavigate } from 'react-router-dom';

const AvatarProfilePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const status = await avatarApi.getStatus();
        setData(status);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[10px] uppercase tracking-widest opacity-20">Syncing Identity...</div>;

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-black p-8 lg:p-24 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <header className="flex justify-between items-end border-b border-black/5 pb-12">
          <div className="space-y-4">
            <button onClick={() => navigate('/wardrobe')} className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-8">
              <ArrowLeft size={16} /> <span className="text-[10px] uppercase font-bold tracking-widest">Back to Studio</span>
            </button>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter">Avatar <br /> <span className="not-italic text-black/10">Profile.</span></h1>
          </div>
          <div className="text-right hidden md:block">
            <span className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-20">Neural Index: {data?.id?.split('-')[0]}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Status Card */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-black/5 space-y-10">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${data?.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                <span className="text-[10px] uppercase font-bold tracking-widest capitalize">{data?.status || 'pending'}</span>
              </div>
              
              <div className="space-y-6">
                <div className={`flex items-center gap-4 ${data?.url ? 'text-green-600' : 'text-gray-400'}`}>
                  <User size={18} strokeWidth={1.5} />
                  <span className="text-[11px] uppercase tracking-widest">Neural Selfie: {data?.url ? '✓' : '−'}</span>
                </div>
                <div className={`flex items-center gap-4 ${data?.metadata?.body_photo_url ? 'text-green-600' : 'text-gray-400'}`}>
                  <Activity size={18} strokeWidth={1.5} />
                  <span className="text-[11px] uppercase tracking-widest">Body Geometry: {data?.metadata?.body_photo_url ? '✓' : '−'}</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <ShieldCheck size={18} strokeWidth={1.5} />
                  <span className="text-[11px] uppercase tracking-widest">Privacy: Encrypted</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <Clock size={18} strokeWidth={1.5} />
                  <span className="text-[11px] uppercase tracking-widest">Synced: {data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/avatar/onboarding')}
                className="w-full py-6 bg-black text-white rounded-full text-[10px] uppercase font-bold tracking-[0.2em] transition-transform hover:scale-[1.02]"
              >
                {data?.url ? 'Update Avatar' : 'Create Avatar'}
              </button>
            </div>
          </div>

          {/* 3D Avatar Display */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Selfie Card */}
              <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] border border-black/5 overflow-hidden shadow-lg transition-all hover:shadow-xl">
                {data?.url ? (
                  <>
                    <img src={data.url} className="w-full h-64 object-cover" alt="Neural Selfie" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                    <User size={48} className="opacity-20" />
                  </div>
                )}
                <div className="p-6 bg-white/95 backdrop-blur-sm">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-600 mb-2">01. Neural Selfie</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Facial geometry captured</p>
                </div>
              </div>

              {/* Body Photo Card */}
              <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2.5rem] border border-black/5 overflow-hidden shadow-lg transition-all hover:shadow-xl">
                {data?.metadata?.body_photo_url ? (
                  <>
                    <img src={data.metadata.body_photo_url} className="w-full h-64 object-cover" alt="Body Geometry" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                    <Activity size={48} className="opacity-20" />
                  </div>
                )}
                <div className="p-6 bg-white/95 backdrop-blur-sm">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-600 mb-2">02. Body Geometry</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Body pose and proportions</p>
                </div>
              </div>
            </div>

            {/* Avatar Status Box */}
            <div className="bg-gradient-to-r from-black/5 to-black/0 rounded-[2.5rem] border border-black/10 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-600 mb-2">AVATAR STATUS</p>
                  <p className="text-sm text-gray-700">{data?.url && data?.metadata?.body_photo_url ? '✓ Ready for Virtual Try-Ons' : '− Incomplete. Complete onboarding to activate.'}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${data?.url && data?.metadata?.body_photo_url ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {data?.url && data?.metadata?.body_photo_url ? '✓' : '○'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AvatarProfilePage;
