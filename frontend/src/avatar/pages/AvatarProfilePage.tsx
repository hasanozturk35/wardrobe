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
                <div className="w-3 h-3 rounded-full bg-black animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest">{data?.status}</span>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-gray-400">
                  <Activity size={18} strokeWidth={1.5} />
                  <span className="text-[11px] uppercase tracking-widest">Body Geometry: Active</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <ShieldCheck size={18} strokeWidth={1.5} />
                  <span className="text-[11px] uppercase tracking-widest">Privacy: Encrypted</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <Clock size={18} strokeWidth={1.5} />
                  <span className="text-[11px] uppercase tracking-widest">Last Sync: {new Date(data?.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/avatar/onboarding')}
                className="w-full py-6 bg-black text-white rounded-full text-[10px] uppercase font-bold tracking-[0.2em] transition-transform hover:scale-[1.02]"
              >
                Recalibrate Identity
              </button>
            </div>
          </div>

          {/* Asset Gallery */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative aspect-[3/4] bg-white rounded-[2.5rem] border border-black/5 overflow-hidden">
               {data?.url ? (
                 <img src={data.url} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0" alt="Selfie" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center"><User size={48} className="opacity-10" /></div>
               )}
               <div className="absolute top-8 left-8 bg-black/5 backdrop-blur-md px-4 py-2 rounded-full text-[9px] uppercase font-bold tracking-widest border border-white/20">
                 01. Neural Selfie
               </div>
            </div>

            <div className="group relative aspect-[3/4] bg-white rounded-[2.5rem] border border-black/5 overflow-hidden">
               {data?.metadata?.body_photo_url ? (
                 <img src={data.metadata.body_photo_url} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0" alt="Body Geometry" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center opacity-5"><Activity size={48} /></div>
               )}
               <div className="absolute top-8 left-8 bg-black/5 backdrop-blur-md px-4 py-2 rounded-full text-[9px] uppercase font-bold tracking-widest border border-white/20">
                 02. Body Map
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AvatarProfilePage;
