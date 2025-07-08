import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { SearchFormData, ResultData, ResultSearchResponse, ResultStatusResponse, CaptchaResponse } from '@/types/result';
import { useToast } from '@/hooks/use-toast';

export function useResultSearch() {
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [resultStatus, setResultStatus] = useState<ResultStatusResponse | undefined>(undefined);
  const { toast } = useToast();

  // Generate initial captcha
  const { data: captchaData, refetch: refetchCaptcha, error: captchaError, isLoading: isLoadingCaptcha } = useQuery({
    queryKey: ['/api/captcha'],
    queryFn: async () => {
      console.log('[useResultSearch] Fetching captcha...');
      try {
        const response = await apiRequest('GET', `/api/captcha`);
        const data: CaptchaResponse = await response.json();
        console.log('[useResultSearch] Captcha response:', data);
        
        if (data.success && data.sessionToken) {
          setSessionToken(data.sessionToken);
          console.log('[useResultSearch] Session token set:', data.sessionToken);
        }
        
        if (!data.success) {
          console.error('[useResultSearch] Captcha fetch failed:', (data as any).message);
          toast({
            title: "Captcha Error",
            description: (data as any).message || "Failed to load security code",
            variant: "destructive",
          });
        }
        
        return data;
      } catch (error) {
        console.error('[useResultSearch] Captcha fetch error:', error);
        toast({
          title: "Network Error",
          description: "Failed to connect to server. Please check your connection.",
          variant: "destructive",
        });
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
  });

  // Refresh captcha mutation
  const refreshCaptchaMutation = useMutation({
    mutationFn: async () => {
      console.log('[useResultSearch] Refreshing captcha...');
      const response = await apiRequest('POST', '/api/captcha/refresh', { sessionToken });
      return await response.json();
    },
    onSuccess: (data: CaptchaResponse) => {
      console.log('[useResultSearch] Captcha refresh response:', data);
      if (data.success) {
        queryClient.setQueryData(['/api/captcha'], data);
        toast({
          title: "Captcha refreshed",
          description: "Please enter the new security code",
        });
      } else {
        toast({
          title: "Refresh failed",
          description: (data as any).message || "Failed to refresh security code",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error('[useResultSearch] Captcha refresh error:', error);
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Search result mutation
  const searchMutation = useMutation({
    mutationFn: async (formData: SearchFormData) => {
      console.log('[useResultSearch] Starting search with data:', formData);
      const response = await apiRequest('POST', '/api/result/search', formData);
      const data = await response.json();
      console.log('[useResultSearch] Raw API response:', data);
      return data;
    },
    onSuccess: (data: ResultSearchResponse) => {
      console.log('[useResultSearch] Search response:', data);
      
      if (data.success) {
        if ((data as any).status === 'success' && (data as any).result) {
          // Direct result response - no polling needed
          const resultStatusData: ResultStatusResponse = {
            success: true,
            status: 'success',
            resultData: (data as any).result as ResultData,
            requestId: data.requestId,
          };
          console.log('[useResultSearch] Setting result data:', resultStatusData);
          console.log('[useResultSearch] Raw result data:', (data as any).result);
          
          // Update state immediately
          setCurrentRequestId(data.requestId || null);
          setResultStatus(resultStatusData);
          
          // Force a re-render by updating query cache
          queryClient.setQueryData(['resultStatus'], resultStatusData);
          
          // Force a re-render by invalidating queries
          queryClient.invalidateQueries({ queryKey: ['resultStatus'] });
          
          toast({
            title: "Result found!",
            description: "Your result has been successfully retrieved.",
          });
        } else if (data.requestId) {
          // Polling response - set up polling
          setCurrentRequestId(data.requestId);
          toast({
            title: "Search initiated",
            description: "Fetching your result, please wait...",
          });
        } else {
          toast({
            title: "Search failed",
            description: data.message || "No result found",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Search failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error('[useResultSearch] Search error:', error);
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  console.log('[useResultSearch] State:', {
    currentRequestId,
    resultStatus,
    isLoadingResult: false,
  });

  // Debug: Log whenever resultStatus changes
  console.log('[useResultSearch] resultStatus changed:', resultStatus);

  // Monitor resultStatus changes
  useEffect(() => {
    console.log('[useResultSearch] useEffect - resultStatus updated:', resultStatus);
  }, [resultStatus]);

  // Retry search function
  const retrySearch = useCallback((formData: SearchFormData) => {
    setCurrentRequestId(null);
    setTimeout(() => {
      searchMutation.mutate(formData);
    }, 1000);
  }, [searchMutation]);

  // Refresh captcha function
  const refreshCaptcha = useCallback(() => {
    if (sessionToken) {
      refreshCaptchaMutation.mutate();
    } else {
      refetchCaptcha();
    }
  }, [sessionToken, refreshCaptchaMutation, refetchCaptcha]);

  return {
    // Captcha
    captcha: captchaData?.captcha || '',
    sessionToken,
    refreshCaptcha,
    isRefreshingCaptcha: refreshCaptchaMutation.isPending,
    isLoadingCaptcha,
    captchaError,

    // Search
    searchResult: searchMutation.mutate,
    isSearching: searchMutation.isPending,
    
    // Result status
    resultStatus: resultStatus as ResultStatusResponse | undefined,
    currentRequestId,
    
    // Actions
    retrySearch,
    resetSearch: () => {
      setCurrentRequestId(null);
      setResultStatus(undefined);
    },
  };
}
