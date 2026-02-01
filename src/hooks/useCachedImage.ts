import { useState, useEffect } from 'react';

export function useCachedImage(url: string | undefined) {
  const [cachedUrl, setCachedUrl] = useState<string | undefined>(url);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
        setCachedUrl(undefined);
        setLoading(false);
        return;
    }
    
    let isMounted = true;
    let objectUrl: string | null = null;
    
    const fetchImage = async () => {
        setLoading(true);
        // Initially set to original URL while checking cache to avoid empty flashing if possible, 
        // OR hold off until we know status.
        // If we set to 'url' immediately, browser fetches it.
        // If we wait, we might show a loader or blank.
        // Let's see if we can just return url if cache check fails.
        
        try {
            if (!('caches' in window)) {
                if (isMounted) setCachedUrl(url);
                 return;
            }

            const cache = await caches.open('avatar-reaction-images');
            const cachedResponse = await cache.match(url);
            
            if (cachedResponse) {
                const blob = await cachedResponse.blob();
                objectUrl = URL.createObjectURL(blob);
                if (isMounted) setCachedUrl(objectUrl);
            } else {
                 // Try to fetch and cache
                 try {
                     const response = await fetch(url, { mode: 'cors' });
                     if (response.ok) {
                         await cache.put(url, response.clone());
                         const blob = await response.blob();
                         objectUrl = URL.createObjectURL(blob);
                         if (isMounted) setCachedUrl(objectUrl);
                     } else {
                         if (isMounted) setCachedUrl(url);
                     }
                 } catch (fetchErr) {
                     // Network error or CORS error
                     if (isMounted) setCachedUrl(url);
                 }
            }
        } catch (e) {
             if (isMounted) setCachedUrl(url);
        } finally {
            if (isMounted) setLoading(false);
        }
    }

    fetchImage();

    return () => {
        isMounted = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { src: cachedUrl, loading };
}
