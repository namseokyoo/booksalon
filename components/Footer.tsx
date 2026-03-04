import React from 'react';

export const Footer: React.FC = () => (
  <footer className="bg-background border-t border-border mt-auto py-6">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
        <p>© 2026 북살롱. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</a>
          <a href="/terms" className="hover:text-foreground transition-colors">이용약관</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
