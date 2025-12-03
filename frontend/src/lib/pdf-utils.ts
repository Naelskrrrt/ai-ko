/**
 * Utilitaires pour la gestion des PDF
 */

/**
 * Télécharge un fichier PDF depuis un Blob
 */
export function downloadPDF(blob: Blob, filename: string): void {
  // Créer une URL temporaire pour le blob
  const url = window.URL.createObjectURL(blob);

  // Créer un élément <a> temporaire pour déclencher le téléchargement
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Nettoyer
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Télécharge un fichier générique depuis un Blob
 */
export function downloadFile(
  blob: Blob,
  filename: string,
  mimeType?: string,
): void {
  const url = window.URL.createObjectURL(
    mimeType ? new Blob([blob], { type: mimeType }) : blob,
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Ouvre un PDF dans un nouvel onglet
 */
export function openPDFInNewTab(blob: Blob): void {
  const url = window.URL.createObjectURL(blob);

  window.open(url, "_blank");

  // Ne pas révoquer immédiatement l'URL car le nouvel onglet en a besoin
  // Elle sera révoquée automatiquement quand l'onglet sera fermé
}
