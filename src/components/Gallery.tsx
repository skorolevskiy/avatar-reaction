import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Avatar, Reference, Motion, Background, Montage } from '../types';
import { Card } from './Card';
import { Loader } from './Loader';
import { RefreshCw, Play, Video, ImageIcon, Layers, FileVideo } from 'lucide-react';
import { MediaPreviewModal } from './modals/MediaPreviewModal';

type Tab = 'avatars' | 'references' | 'motions' | 'backgrounds' | 'montages';

export function Gallery() {
  const [activeTab, setActiveTab] = useState<Tab>('avatars');
  const [isLoading, setIsLoading] = useState(false);
  
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [motions, setMotions] = useState<Motion[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [montages, setMontages] = useState<Montage[]>([]);

  const [previewItem, setPreviewItem] = useState<{
    url: string;
    type: 'image' | 'video';
    title: string;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [avatarsData, refsData, motionsData, bgsData, montagesData] = await Promise.all([
        api.getAvatars(),
        api.getReferences(),
        api.getMotions(),
        api.getBackgrounds(),
        api.getMontages()
      ]);
      
      // Sort data from old to new (assuming API returns Newest First)
      setAvatars(avatarsData.reverse());
      setReferences(refsData.reverse());
      setMotions(motionsData.reverse());
      setBackgrounds(bgsData.reverse());
      setMontages(montagesData.reverse());
    } catch (err) {
      console.error('Failed to load gallery data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'avatars', label: 'Аватары', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'references', label: 'Референсы', icon: <Play className="w-4 h-4" /> },
    { id: 'motions', label: 'Motion Generation', icon: <Video className="w-4 h-4" /> },
    { id: 'backgrounds', label: 'Бэкграунды', icon: <Layers className="w-4 h-4" /> },
    { id: 'montages', label: 'Финальный монтаж', icon: <FileVideo className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Галерея файлов</h1>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-white text-blue-700 shadow ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/[0.12]'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 sm:p-6 min-h-[400px]">
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <Loader type="spinner" text="Загрузка данных..." />
            </div>
        )}
        
        {!isLoading && activeTab === 'avatars' && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {avatars.map((item) => (
              <Card
                key={item.id}
                title={item.name}
                image={item.image_url}
                selected={false}
                aspect='aspect-square'
                onClick={() => setPreviewItem({
                  url: item.image_url,
                  type: 'image',
                  title: item.name
                })}
              />
            ))}
            {avatars.length === 0 && <EmptyState />}
          </div>
        )}

        {!isLoading && activeTab === 'references' && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {references.map((item) => (
              <Card
                key={item.id}
                title={item.label || item.name}
                image={item.thumbnail_url}
                video={item.video_url}
                selected={false}
                onClick={() => setPreviewItem({
                  url: item.video_url,
                  type: 'video',
                  title: item.label || item.name
                })}
                aspect="aspect-square"
                duration={item.duration}
              />
            ))}
            {references.length === 0 && <EmptyState />}
          </div>
        )}

        {!isLoading && activeTab === 'motions' && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {motions.map((item) => (
              <div key={item.id}>
                 {item.status === 'success' && item.motion_video_url ? (
                    <Card
                        title={`Motion ${item.id.slice(0, 8)}`}
                        image={item.motion_thumbnail_url}
                        video={item.motion_video_url}
                        selected={false}
                        aspect="aspect-square"
                        onClick={() => setPreviewItem({
                          url: item.motion_video_url!,
                          type: 'video',
                          title: `Motion ${item.id.slice(0, 8)}`
                        })}
                    />
                 ) : (
                    <ProcessingCard status={item.status} title={`Motion ${item.id.slice(0, 8)}`} />
                 )}
              </div>
            ))}
            {motions.length === 0 && <EmptyState />}
          </div>
        )}

        {!isLoading && activeTab === 'backgrounds' && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {backgrounds.map((item) => (
              <Card
                key={item.id}
                title={item.title || item.name}
                image={item.thumbnail_url}
                video={item.video_url}
                selected={false}
                onClick={() => setPreviewItem({
                  url: item.video_url,
                  type: 'video',
                  title: item.title || item.name
                })}
                aspect="aspect-[9/16]"
                duration={item.duration}
              />
            ))}
            {backgrounds.length === 0 && <EmptyState />}
          </div>
        )}

        {!isLoading && activeTab === 'montages' && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {montages.map((item) => (
               <div key={item.id}>
                {(item.status === 'ready' || item.status === 'success' as any) && (item.final_video_url || item.video_url) ? (
                    <Card
                        title={`Montage ${item.id.slice(0, 8)}`}
                        image={item.final_thumbnail_url}
                        video={item.final_video_url || item.video_url}
                        selected={false}
                        onClick={() => setPreviewItem({
                          url: item.final_video_url || item.video_url!,
                          type: 'video',
                          title: `Montage ${item.id.slice(0, 8)}`
                        })}
                        aspect="aspect-[9/16]"
                    />
                 ) : (
                    <ProcessingCard status={item.status} title={`Montage ${item.id.slice(0, 8)}`} />
                 )}
              </div>
            ))}
            {montages.length === 0 && <EmptyState />}
          </div>
        )}
      </div>

      {previewItem && (
        <MediaPreviewModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          {...previewItem}
        />
      )}
    </div>
  );
}

function EmptyState() {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
            <p className="text-lg">Здесь пока ничего нет</p>
        </div>
    );
}

function ProcessingCard({ status, title }: { status: string, title: string }) {
    return (
        <div className="relative aspect-[3/4] rounded-xl bg-gray-50 border-2 border-gray-100 flex flex-col items-center justify-center p-4 text-center">
            <Loader type="spinner" />
            <div className="mt-4 font-medium text-sm text-gray-900">{title}</div>
            <div className="mt-1 text-xs text-gray-500 uppercase tracking-wider">{status}</div>
        </div>
    );
}
