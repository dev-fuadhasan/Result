import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { SearchFormData, ResultData, ResultSearchResponse, ResultStatusResponse, CaptchaResponse } from '@/types/result';
import { useToast } from '@/hooks/use-toast';

export function useResultSearch() {
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const { toast } = useToast();

  // Generate initial captcha
  const { data: captchaData, refetch: refetchCaptcha } = useQuery({
    queryKey: ['/api/captcha', sessionToken],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/captcha?session=${sessionToken}`);
      const data: CaptchaResponse = await response.json();
      if (data.success && data.sessionToken) {
        setSessionToken(data.sessionToken);
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });

  // Refresh captcha mutation
  const refreshCaptchaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/captcha/refresh', { sessionToken });
      return await response.json();
    },
    onSuccess: (data: CaptchaResponse) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/captcha'] });
        toast({
          title: "Captcha refreshed",
          description: "Please enter the new security code",
        });
      }
    },
  });

  // Search result mutation
  const searchMutation = useMutation({
    mutationFn: async (formData: SearchFormData) => {
      const response = await apiRequest('POST', '/api/result/search', formData);
      return await response.json();
    },
    onSuccess: (data: ResultSearchResponse) => {
      if (data.success && data.requestId) {
        setCurrentRequestId(data.requestId);
        toast({
          title: "Search initiated",
          description: "Fetching your result, please wait...",
        });
      } else {
        toast({
          title: "Search failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Poll result status
  const { data: resultStatus, isLoading: isLoadingResult } = useQuery({
    queryKey: ['/api/result/status', currentRequestId],
    enabled: !!currentRequestId,
    refetchInterval: (data) => {
      // Stop polling if result is final
      if (data?.status === 'success' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchOnWindowFocus: false,
  });

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

    // Search
    searchResult: searchMutation.mutate,
    isSearching: searchMutation.isPending || isLoadingResult,
    
    // Result status
    resultStatus: resultStatus as ResultStatusResponse | undefined,
    currentRequestId,
    
    // Actions
    retrySearch,
    resetSearch: () => {
      setCurrentRequestId(null);
      queryClient.removeQueries({ queryKey: ['/api/result/status'] });
    },
  };
}
