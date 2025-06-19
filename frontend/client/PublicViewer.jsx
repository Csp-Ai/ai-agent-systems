import React, { useState, useEffect } from 'react';
import { detectLocale, t } from './i18n';

export default function PublicViewer({ url = '' }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">{t(locale, 'sharedReport')}</h1>
      {url ? (
        <object data={url} type="application/pdf" className="w-full h-screen">
          <p className="text-center">
            {t(locale, 'pdfPreviewNA')}{' '}
            <a href={url} className="underline" target="_blank" rel="noopener noreferrer">
              {t(locale, 'download')}
            </a>
          </p>
        </object>
      ) : (
        <p>{t(locale, 'noReportFound')}</p>
      )}
    </div>
  );
}
