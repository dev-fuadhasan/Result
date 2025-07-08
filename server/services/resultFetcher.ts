import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ResultData {
  studentName: string;
  fatherName: string;
  motherName: string;
  roll: string;
  registration: string;
  institution: string;
  group: string;
  session: string;
  gpa: string;
  grade: string;
  result: string;
  subjects: Array<{
    name: string;
    marks: string;
    grade: string;
    gpa: string;
  }>;
}

export interface FetchParams {
  board: string;
  exam: string;
  roll: string;
  registration: string;
  eiin?: string;
}

export class ResultFetcherService {
  private static readonly BASE_URLS = {
    dhaka: 'https://eboardresults.com/en',
    chittagong: 'https://eboardresults.com/en',
    rajshahi: 'https://eboardresults.com/en',
    sylhet: 'https://eboardresults.com/en',
    barisal: 'https://eboardresults.com/en',
    dinajpur: 'https://eboardresults.com/en',
    comilla: 'https://eboardresults.com/en',
    jessore: 'https://eboardresults.com/en',
    mymensingh: 'https://eboardresults.com/en',
    madrasah: 'https://eboardresults.com/en',
    technical: 'https://eboardresults.com/en',
  };

  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
  
  // Cache for storing results in memory (you can replace this with Redis or database)
  private static resultCache: Map<string, { data: ResultData; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static async fetchResult(params: FetchParams): Promise<ResultData> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(params);
    
    // Check cache first
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      console.log(`[ResultFetcher] Returning cached result for roll: ${params.roll}`);
      return cachedResult;
    }

    let lastError: Error | null = null;

    // Check if this is a demo request (for testing purposes)
    if (params.roll === '123456' && params.registration === '1234567890') {
      const demoResult = this.generateDemoResult(params);
      this.cacheResult(cacheKey, demoResult);
      return demoResult;
    }

    // Try multiple strategies to fetch the result
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        console.log(`[ResultFetcher] Attempt ${attempt + 1} for roll: ${params.roll}, board: ${params.board}, exam: ${params.exam}`);
        const result = await this.attemptFetch(params, attempt);
        console.log(`[ResultFetcher] Successfully fetched result for roll: ${params.roll}`);
        
        // Cache the successful result
        this.cacheResult(cacheKey, result);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.log(`[ResultFetcher] Attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAYS[attempt]);
        }
      }
    }

    // If all attempts failed, try to get from alternative sources
    try {
      const fallbackResult = await this.fetchFromFallbackSources(params);
      if (fallbackResult) {
        this.cacheResult(cacheKey, fallbackResult);
        return fallbackResult;
      }
    } catch (fallbackError) {
      console.log(`[ResultFetcher] Fallback sources also failed:`, fallbackError.message);
    }

    throw lastError || new Error('Failed to fetch result after all retry attempts');
  }

  private static generateCacheKey(params: FetchParams): string {
    return `${params.board}_${params.exam}_${params.roll}_${params.registration}_${params.eiin || ''}`;
  }

  private static getCachedResult(cacheKey: string): ResultData | null {
    const cached = this.resultCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.resultCache.delete(cacheKey); // Remove expired cache
    }
    return null;
  }

  private static cacheResult(cacheKey: string, data: ResultData): void {
    this.resultCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries (keep only last 1000 entries)
    if (this.resultCache.size > 1000) {
      const entries = Array.from(this.resultCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      this.resultCache.clear();
      entries.slice(0, 1000).forEach(([key, value]) => {
        this.resultCache.set(key, value);
      });
    }
  }

  private static generateDemoResult(params: FetchParams): ResultData {
    return {
      studentName: "MD. DEMO STUDENT",
      fatherName: "MD. DEMO FATHER",
      motherName: "MST. DEMO MOTHER",
      roll: params.roll,
      registration: params.registration,
      institution: "DEMO HIGH SCHOOL",
      group: "Science",
      session: "2024",
      gpa: "4.83",
      grade: "A+",
      result: "PASSED",
      subjects: [
        { name: "Bangla", marks: "82", grade: "A+", gpa: "5.00" },
        { name: "English", marks: "78", grade: "A", gpa: "4.00" },
        { name: "Mathematics", marks: "85", grade: "A+", gpa: "5.00" },
        { name: "Physics", marks: "80", grade: "A+", gpa: "5.00" },
        { name: "Chemistry", marks: "79", grade: "A", gpa: "4.00" },
        { name: "Biology", marks: "83", grade: "A+", gpa: "5.00" },
        { name: "ICT", marks: "88", grade: "A+", gpa: "5.00" },
      ]
    };
  }

  private static async attemptFetch(params: FetchParams, attempt: number): Promise<ResultData> {
    const baseUrl = this.BASE_URLS[params.board as keyof typeof this.BASE_URLS];
    if (!baseUrl) {
      throw new Error(`Unsupported board: ${params.board}`);
    }

    // Strategy 1: Direct form submission (primary method)
    if (attempt === 0) {
      return await this.fetchViaFormSubmission(baseUrl, params);
    }
    
    // Strategy 2: Alternative endpoint (fallback)
    if (attempt === 1) {
      return await this.fetchViaAlternativeEndpoint(baseUrl, params);
    }
    
    // Strategy 3: Scraping approach (last resort)
    return await this.fetchViaScraping(baseUrl, params);
  }

  private static async fetchViaFormSubmission(baseUrl: string, params: FetchParams): Promise<ResultData> {
    // First, get the form page to extract session token and other required fields
    const formResponse = await axios.get(`${baseUrl}/ebr.app/home/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
    });

    // Parse form to get required fields and CSRF token
    const $ = cheerio.load(formResponse.data);
    const csrfToken = $('input[name="_token"]').val() || '';
    
    // Map our board names to the actual form values
    const boardMapping: { [key: string]: string } = {
      'dhaka': 'Dhaka',
      'chittagong': 'Chattogram',
      'rajshahi': 'Rajshahi',
      'sylhet': 'Sylhet',
      'barisal': 'Barisal',
      'dinajpur': 'Dinajpur',
      'comilla': 'Cumilla',
      'jessore': 'Jashore',
      'mymensingh': 'Mymensingh',
      'madrasah': 'Madrasah',
      'technical': 'Technical',
    };

    // Map exam types
    const examMapping: { [key: string]: string } = {
      'ssc': 'SSC/Dakhil/Equivalent',
      'hsc': 'HSC/Alim/Equivalent',
      'jsc': 'JSC/JDC',
    };

    const formData = new URLSearchParams();
    if (csrfToken) {
      formData.append('_token', csrfToken.toString());
    }
    formData.append('exam', examMapping[params.exam] || 'SSC/Dakhil/Equivalent');
    formData.append('year', '2024');
    formData.append('board', boardMapping[params.board] || 'Dhaka');
    formData.append('result_type', 'Individual Result');
    formData.append('roll', params.roll);
    formData.append('reg', params.registration);
    if (params.eiin) {
      formData.append('eiin', params.eiin);
    }

    console.log(`[ResultFetcher] Submitting form with data:`, Object.fromEntries(formData.entries()));

    const response = await axios.post(`${baseUrl}/ebr.app/home/`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': `${baseUrl}/ebr.app/home/`,
        'Origin': baseUrl,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      timeout: 20000,
      maxRedirects: 5,
    });

    console.log(`[ResultFetcher] Response status: ${response.status}, content length: ${response.data.length}`);
    
    // Log a snippet of the response for debugging
    const responseSnippet = response.data.substring(0, 500);
    console.log(`[ResultFetcher] Response preview:`, responseSnippet);

    return this.parseResultHtml(response.data);
  }

  private static async fetchViaAlternativeEndpoint(baseUrl: string, params: FetchParams): Promise<ResultData> {
    // Try a different approach - direct result submission with different form data
    const formData = new URLSearchParams({
      'board': params.board,
      'exam': params.exam,
      'year': '2024',
      'roll': params.roll,
      'reg': params.registration,
      'eiin': params.eiin || '',
      'result_type': 'Individual',
    });

    const response = await axios.post(`${baseUrl}/ebr.app/`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': `${baseUrl}/ebr.app/home/`,
      },
      timeout: 20000,
    });

    return this.parseResultHtml(response.data);
  }

  private static async fetchViaScraping(baseUrl: string, params: FetchParams): Promise<ResultData> {
    // First get the form page to extract any required tokens
    const formResponse = await axios.get(`${baseUrl}/ebr.app/home/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(formResponse.data);
    const csrfToken = $('input[name="_token"]').val() || '';

    // Submit with scraped token
    const formData = new URLSearchParams({
      '_token': csrfToken.toString(),
      'board': params.board,
      'exam': params.exam,
      'roll': params.roll,
      'reg': params.registration,
      'eiin': params.eiin || '',
    });

    const resultResponse = await axios.post(`${baseUrl}/ebr.app/home/`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `${baseUrl}/ebr.app/home/`,
      },
      timeout: 25000,
    });

    return this.parseResultHtml(resultResponse.data);
  }

  // New method: Try alternative sources if main source fails
  private static async fetchFromFallbackSources(params: FetchParams): Promise<ResultData | null> {
    // Try alternative result websites or APIs
    const fallbackUrls = [
      `https://result.bteb.gov.bd/result/${params.board}/${params.exam}/${params.roll}`,
      `https://results.eboardresults.com/v2/result/${params.board}/${params.exam}/${params.roll}/${params.registration}`,
    ];

    for (const url of fallbackUrls) {
      try {
        console.log(`[ResultFetcher] Trying fallback URL: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 15000,
        });

        if (response.data && typeof response.data === 'object') {
          return this.parseResultJson(response.data);
        }
      } catch (error) {
        console.log(`[ResultFetcher] Fallback URL failed: ${url}`, error.message);
      }
    }

    return null;
  }

  private static parseResultHtml(html: string): ResultData {
    const $ = cheerio.load(html);
    
    // Check for error messages or no result found
    const errorSelectors = [
      '.alert-danger', '.error-message', '.text-danger', 
      '.panel-danger', '#result_display .alert-danger'
    ];
    
    for (const selector of errorSelectors) {
      const errorMessage = $(selector).text().trim();
      if (errorMessage && errorMessage.length > 0) {
        throw new Error(errorMessage);
      }
    }

    // Check if "No record found" or similar messages exist
    const bodyText = $('body').text().toLowerCase();
    if (bodyText.includes('no record found') || 
        bodyText.includes('result not found') || 
        bodyText.includes('invalid information') ||
        bodyText.includes('record is not available')) {
      throw new Error('No result found for the provided information. Please check your roll number, registration number, and other details.');
    }

    // Look for result display area
    const resultDisplay = $('#result_display, .result-display, .panel-body');
    if (resultDisplay.length === 0 || resultDisplay.text().trim().length === 0) {
      throw new Error('Result not published yet or information provided is incorrect.');
    }

    // Extract student information with multiple possible selectors
    const studentName = this.extractText($, [
      'td:contains("Name of Student") + td',
      'td:contains("Student Name") + td',
      '.student-name',
      'tr:contains("Name") td:last',
      'b:contains("Name") ~ text()'
    ]);

    const fatherName = this.extractText($, [
      'td:contains("Father\'s Name") + td',
      'td:contains("Father Name") + td',
      '.father-name',
      'tr:contains("Father") td:last'
    ]);

    const motherName = this.extractText($, [
      'td:contains("Mother\'s Name") + td',
      'td:contains("Mother Name") + td',
      '.mother-name',
      'tr:contains("Mother") td:last'
    ]);

    const roll = this.extractText($, [
      'td:contains("Roll No") + td',
      'td:contains("Roll Number") + td',
      '.roll-number',
      'tr:contains("Roll") td:last'
    ]);

    const registration = this.extractText($, [
      'td:contains("Registration No") + td',
      'td:contains("Registration Number") + td',
      '.registration-number',
      'tr:contains("Registration") td:last'
    ]);

    const institution = this.extractText($, [
      'td:contains("Name of Institution") + td',
      'td:contains("Institution") + td',
      '.institution-name',
      'tr:contains("Institution") td:last'
    ]);

    const group = this.extractText($, [
      'td:contains("Group") + td',
      '.group-name',
      'tr:contains("Group") td:last'
    ]);

    const session = this.extractText($, [
      'td:contains("Session") + td',
      'td:contains("Year") + td',
      '.session',
      'tr:contains("Session") td:last'
    ]);

    const gpa = this.extractText($, [
      'td:contains("GPA") + td',
      'td:contains("Grade Point") + td',
      '.gpa',
      'tr:contains("GPA") td:last',
      'b:contains("GPA") ~ text()'
    ]);

    const grade = this.extractText($, [
      'td:contains("Grade") + td',
      '.grade',
      'tr:contains("Grade") td:last'
    ]);

    const result = this.extractText($, [
      'td:contains("Result") + td',
      '.result-status',
      'tr:contains("Result") td:last'
    ]) || 'PASSED';

    // Extract subjects from table
    const subjects: Array<{name: string, marks: string, grade: string, gpa: string}> = [];
    
    // Look for subject tables with various possible structures
    $('table').each((tableIndex, table) => {
      const $table = $(table);
      const headers = $table.find('tr:first th, tr:first td').map((i, el) => $(el).text().trim().toLowerCase()).get();
      
      // Check if this looks like a subjects table
      if (headers.some(h => h.includes('subject') || h.includes('code') || h.includes('marks'))) {
        $table.find('tr').each((rowIndex, row) => {
          if (rowIndex === 0) return; // Skip header
          
          const $row = $(row);
          const cells = $row.find('td').map((i, el) => $(el).text().trim()).get();
          
          if (cells.length >= 4 && cells[0] && cells[1]) {
            subjects.push({
              name: cells[0] || '',
              marks: cells[1] || '',
              grade: cells[2] || '',
              gpa: cells[3] || '',
            });
          }
        });
      }
    });

    // Validate required fields
    if (!studentName && !roll && !registration) {
      throw new Error('Unable to parse result data. The result format may have changed or the result is not available.');
    }

    return {
      studentName: studentName || 'N/A',
      fatherName: fatherName || 'N/A',
      motherName: motherName || 'N/A',
      roll: roll || params.roll,
      registration: registration || params.registration,
      institution: institution || 'N/A',
      group: group || 'N/A',
      session: session || '2024',
      gpa: gpa || 'N/A',
      grade: grade || 'N/A',
      result: result,
      subjects: subjects.length > 0 ? subjects : [
        { name: 'Bangla', marks: 'N/A', grade: 'N/A', gpa: 'N/A' },
        { name: 'English', marks: 'N/A', grade: 'N/A', gpa: 'N/A' },
        { name: 'Mathematics', marks: 'N/A', grade: 'N/A', gpa: 'N/A' },
      ]
    };
  }

  private static parseResultJson(data: any): ResultData {
    // Handle JSON response from alternative APIs
    return {
      studentName: data.studentName || data.name || 'N/A',
      fatherName: data.fatherName || data.father || 'N/A',
      motherName: data.motherName || data.mother || 'N/A',
      roll: data.roll || data.rollNumber || 'N/A',
      registration: data.registration || data.regNumber || 'N/A',
      institution: data.institution || data.school || 'N/A',
      group: data.group || 'N/A',
      session: data.session || data.year || '2024',
      gpa: data.gpa || data.gradePoint || 'N/A',
      grade: data.grade || 'N/A',
      result: data.result || 'PASSED',
      subjects: data.subjects || data.marks || []
    };
  }

  private static extractText($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text) return text;
      }
    }
    return '';
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public method to clear cache (useful for admin purposes)
  static clearCache(): void {
    this.resultCache.clear();
    console.log('[ResultFetcher] Cache cleared');
  }

  // Public method to get cache statistics
  static getCacheStats(): { size: number; entries: number } {
    return {
      size: this.resultCache.size,
      entries: this.resultCache.size
    };
  }
}
