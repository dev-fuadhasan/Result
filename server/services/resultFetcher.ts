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

  static async fetchResult(params: FetchParams): Promise<ResultData> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.attemptFetch(params, attempt);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAYS[attempt]);
        }
      }
    }

    throw lastError || new Error('Failed to fetch result after all retry attempts');
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
    const formData = new URLSearchParams({
      'board': params.board,
      'exam': params.exam,
      'roll': params.roll,
      'reg': params.registration,
      'eiin': params.eiin || '',
    });

    const response = await axios.post(`${baseUrl}/ebr.app/home/`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
    });

    return this.parseResultHtml(response.data);
  }

  private static async fetchViaAlternativeEndpoint(baseUrl: string, params: FetchParams): Promise<ResultData> {
    const response = await axios.get(`${baseUrl}/v2/result`, {
      params: {
        board: params.board,
        exam: params.exam,
        roll: params.roll,
        reg: params.registration,
        eiin: params.eiin || '',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResultChecker/1.0)',
        'Accept': 'application/json,text/html',
      },
      timeout: 20000,
    });

    if (response.headers['content-type']?.includes('application/json')) {
      return this.parseResultJson(response.data);
    } else {
      return this.parseResultHtml(response.data);
    }
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

  private static parseResultHtml(html: string): ResultData {
    const $ = cheerio.load(html);
    
    // Check for error messages
    const errorMessage = $('.alert-danger, .error-message').text().trim();
    if (errorMessage) {
      throw new Error(errorMessage);
    }

    // Extract student information
    const studentName = this.extractText($, ['#student-name', '.student-name', '[data-label="name"]']);
    const fatherName = this.extractText($, ['#father-name', '.father-name', '[data-label="father"]']);
    const motherName = this.extractText($, ['#mother-name', '.mother-name', '[data-label="mother"]']);
    const roll = this.extractText($, ['#roll', '.roll', '[data-label="roll"]']);
    const registration = this.extractText($, ['#registration', '.registration', '[data-label="reg"]']);
    const institution = this.extractText($, ['#institution', '.institution', '[data-label="institute"]']);
    const group = this.extractText($, ['#group', '.group', '[data-label="group"]']);
    const session = this.extractText($, ['#session', '.session', '[data-label="session"]']);
    const gpa = this.extractText($, ['#gpa', '.gpa', '[data-label="gpa"]']);
    const grade = this.extractText($, ['#grade', '.grade', '[data-label="grade"]']);
    const result = this.extractText($, ['#result', '.result', '[data-label="result"]']) || 'PASSED';

    // Extract subjects
    const subjects: Array<{name: string, marks: string, grade: string, gpa: string}> = [];
    
    $('table tr, .subject-row').each((index, element) => {
      const $row = $(element);
      const subjectName = $row.find('td:first-child, .subject-name').text().trim();
      const marks = $row.find('td:nth-child(2), .marks').text().trim();
      const subjectGrade = $row.find('td:nth-child(3), .subject-grade').text().trim();
      const subjectGpa = $row.find('td:nth-child(4), .subject-gpa').text().trim();
      
      if (subjectName && marks && subjectGrade && subjectGpa) {
        subjects.push({
          name: subjectName,
          marks,
          grade: subjectGrade,
          gpa: subjectGpa,
        });
      }
    });

    // Validate required fields
    if (!studentName || !roll || !registration) {
      throw new Error('Result not found or invalid response format');
    }

    return {
      studentName,
      fatherName,
      motherName,
      roll,
      registration,
      institution,
      group,
      session,
      gpa,
      grade,
      result,
      subjects,
    };
  }

  private static parseResultJson(data: any): ResultData {
    if (!data.success || !data.result) {
      throw new Error(data.message || 'Result not found');
    }

    const result = data.result;
    return {
      studentName: result.student_name || '',
      fatherName: result.father_name || '',
      motherName: result.mother_name || '',
      roll: result.roll || '',
      registration: result.registration || '',
      institution: result.institution || '',
      group: result.group || '',
      session: result.session || '',
      gpa: result.gpa || '',
      grade: result.grade || '',
      result: result.result || 'PASSED',
      subjects: result.subjects || [],
    };
  }

  private static extractText($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text) return text;
    }
    return '';
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
