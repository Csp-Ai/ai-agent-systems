export const translations = {
  en: {
    reports: 'Reports',
    activity: 'Activity',
    billing: 'Billing',
    yourReports: 'Your Reports',
    noReports: 'No reports available.',
    exportZip: 'Export to ZIP',
    copyShareLink: 'Copy Shareable Link',
    recentActivity: 'Recent Activity',
    billingSoon: 'Billing information coming soon.',
    sharedReport: 'Shared Report',
    pdfPreviewNA: 'PDF preview not available.',
    download: 'Download',
    noReportFound: 'No report found.'
  },
  es: {
    reports: 'Informes',
    activity: 'Actividad',
    billing: 'Facturación',
    yourReports: 'Tus informes',
    noReports: 'No hay informes disponibles.',
    exportZip: 'Exportar a ZIP',
    copyShareLink: 'Copiar enlace compartible',
    recentActivity: 'Actividad reciente',
    billingSoon: 'La información de facturación estará disponible pronto.',
    sharedReport: 'Informe Compartido',
    pdfPreviewNA: 'Vista previa de PDF no disponible.',
    download: 'Descargar',
    noReportFound: 'No se encontró ningún informe.'
  },
  fr: {
    reports: 'Rapports',
    activity: 'Activité',
    billing: 'Facturation',
    yourReports: 'Vos rapports',
    noReports: 'Aucun rapport disponible.',
    exportZip: 'Exporter au format ZIP',
    copyShareLink: 'Copier le lien partageable',
    recentActivity: 'Activité récente',
    billingSoon: 'Informations de facturation à venir.',
    sharedReport: 'Rapport partagé',
    pdfPreviewNA: 'Aperçu PDF non disponible.',
    download: 'Télécharger',
    noReportFound: 'Aucun rapport trouvé.'
  }
};

export function detectLocale() {
  const lang = (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en';
  const base = lang.slice(0,2);
  return translations[base] ? base : 'en';
}

export function t(locale, key) {
  const lang = translations[locale] ? locale : 'en';
  return translations[lang][key] || translations.en[key] || key;
}
