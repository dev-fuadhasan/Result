export class CaptchaService {
  private static captchas: Map<string, string> = new Map();

  static generateCaptcha(sessionToken: string): string {
    const captcha = Math.floor(1000 + Math.random() * 9000).toString();
    this.captchas.set(sessionToken, captcha);
    
    // Auto-expire after 10 minutes
    setTimeout(() => {
      this.captchas.delete(sessionToken);
    }, 10 * 60 * 1000);
    
    return captcha;
  }

  static validateCaptcha(sessionToken: string, userInput: string): boolean {
    const correctCaptcha = this.captchas.get(sessionToken);
    if (!correctCaptcha) return false;
    
    const isValid = correctCaptcha === userInput;
    if (isValid) {
      this.captchas.delete(sessionToken); // Use once
    }
    
    return isValid;
  }

  static refreshCaptcha(sessionToken: string): string {
    return this.generateCaptcha(sessionToken);
  }
}
