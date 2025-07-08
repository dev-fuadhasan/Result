import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Building, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResultSearch } from '@/hooks/useResultSearch';
import type { SearchFormData } from '@/types/result';

const formSchema = z.object({
  board: z.string().min(1, 'Please select an education board'),
  exam: z.string().min(1, 'Please select an examination'),
  roll: z.string().min(1, 'Roll number is required'),
  registration: z.string().min(1, 'Registration number is required'),
  eiin: z.string().optional(),
  captcha: z.string().min(4, 'Please enter the 4-digit security code'),
});

type FormData = z.infer<typeof formSchema>;

interface ResultFormProps {
  onSearchStart: () => void;
}

export default function ResultForm({ onSearchStart }: ResultFormProps) {
  const { 
    captcha, 
    sessionToken, 
    refreshCaptcha, 
    isRefreshingCaptcha,
    isLoadingCaptcha,
    captchaError,
    searchResult,
    isSearching 
  } = useResultSearch();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      board: '',
      exam: '',
      roll: '',
      registration: '',
      eiin: '',
      captcha: '',
    },
  });

  const onSubmit = (data: FormData) => {
    const searchData: SearchFormData = {
      ...data,
      sessionToken,
    };
    
    onSearchStart();
    searchResult(searchData);
  };

  const handleInstitutionSearch = () => {
    // TODO: Implement institution search functionality
    console.log('Institution search functionality');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-blue-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Search className="w-6 h-6 mr-3" />
          SSC/HSC Result Search
        </h2>
        <p className="text-blue-100 text-sm mt-1">Enter your details below to get your result instantly</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Board Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="board"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education Board <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Education Board" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dhaka">Dhaka Board</SelectItem>
                      <SelectItem value="chittagong">Chittagong Board</SelectItem>
                      <SelectItem value="rajshahi">Rajshahi Board</SelectItem>
                      <SelectItem value="sylhet">Sylhet Board</SelectItem>
                      <SelectItem value="barisal">Barisal Board</SelectItem>
                      <SelectItem value="dinajpur">Dinajpur Board</SelectItem>
                      <SelectItem value="comilla">Comilla Board</SelectItem>
                      <SelectItem value="jessore">Jessore Board</SelectItem>
                      <SelectItem value="mymensingh">Mymensingh Board</SelectItem>
                      <SelectItem value="madrasah">Bangladesh Madrasah Education Board</SelectItem>
                      <SelectItem value="technical">Bangladesh Technical Education Board</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Examination <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Examination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ssc">SSC/Dakhil/SSC Vocational</SelectItem>
                      <SelectItem value="hsc">HSC/Alim/HSC Vocational</SelectItem>
                      <SelectItem value="jsc">JSC/JDC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="roll"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter your roll number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter registration number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* EIIN (Optional) */}
          <FormField
            control={form.control}
            name="eiin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  EIIN (Educational Institution Identification Number)
                  <span className="text-gray-600 text-sm font-normal"> - Optional</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter EIIN if available" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Captcha Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <FormField
              control={form.control}
              name="captcha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security Verification <span className="text-red-500">*</span></FormLabel>
                  
                  {/* Debug Info */}
                  <div className="text-xs text-gray-500 mb-2">
                    Session Token: {sessionToken ? `${sessionToken.substring(0, 8)}...` : 'Not set'}
                    {isLoadingCaptcha && ' | Loading captcha...'}
                    {captchaError && ' | Error loading captcha'}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="bg-white border border-gray-300 rounded-lg p-3 min-w-[120px] h-16 flex items-center justify-center">
                      {isLoadingCaptcha ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                      ) : captchaError ? (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <span className="text-2xl font-bold text-primary tracking-wider">
                          {captcha || '----'}
                        </span>
                      )}
                    </div>
                    <Button 
                      type="button" 
                      onClick={refreshCaptcha}
                      disabled={isRefreshingCaptcha || isLoadingCaptcha}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingCaptcha ? 'animate-spin' : ''}`} />
                      {isRefreshingCaptcha ? 'Refreshing...' : 'Reload'}
                    </Button>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter 4 digits" 
                        maxLength={4}
                        className="flex-1"
                        disabled={!captcha}
                        {...field} 
                      />
                    </FormControl>
                  </div>
                  
                  {/* Error Alert */}
                  {captchaError && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to load security code. Please check your connection and try refreshing.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Search Options */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="submit" 
              disabled={isSearching || !captcha}
              className="flex-1 bg-primary hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Get Individual Result'}
            </Button>
            <Button 
              type="button" 
              onClick={handleInstitutionSearch}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Building className="w-4 h-4 mr-2" />
              Institution Results
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
