"""
Service d'extraction de texte depuis des documents (PDF, DOCX)
"""
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class DocumentParser:
    """Parser pour extraire du texte depuis différents formats de documents"""

    @staticmethod
    def extract_from_pdf(file_bytes: bytes) -> str:
        """
        Extrait le texte d'un fichier PDF

        Args:
            file_bytes: Contenu du fichier PDF en bytes

        Returns:
            Texte extrait du PDF
        """
        try:
            import PyPDF2

            pdf_file = io.BytesIO(file_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            text_parts = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)

            full_text = "\n\n".join(text_parts)

            if not full_text.strip():
                raise ValueError("Le PDF ne contient pas de texte extractible")

            logger.info(f"Texte extrait du PDF: {len(full_text)} caractères")
            return full_text

        except ImportError:
            raise ImportError(
                "PyPDF2 n'est pas installé. Installez-le avec: pip install PyPDF2"
            )
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du PDF: {e}")
            raise ValueError(f"Impossible d'extraire le texte du PDF: {str(e)}")

    @staticmethod
    def extract_from_docx(file_bytes: bytes) -> str:
        """
        Extrait le texte d'un fichier DOCX

        Args:
            file_bytes: Contenu du fichier DOCX en bytes

        Returns:
            Texte extrait du DOCX
        """
        try:
            import docx

            docx_file = io.BytesIO(file_bytes)
            doc = docx.Document(docx_file)

            text_parts = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)

            full_text = "\n\n".join(text_parts)

            if not full_text.strip():
                raise ValueError("Le DOCX ne contient pas de texte")

            logger.info(f"Texte extrait du DOCX: {len(full_text)} caractères")
            return full_text

        except ImportError:
            raise ImportError(
                "python-docx n'est pas installé. Installez-le avec: pip install python-docx"
            )
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du DOCX: {e}")
            raise ValueError(f"Impossible d'extraire le texte du DOCX: {str(e)}")

    @staticmethod
    def extract_text(file_bytes: bytes, file_type: str) -> str:
        """
        Extrait le texte d'un document selon son type

        Args:
            file_bytes: Contenu du fichier en bytes
            file_type: Type de fichier ('pdf' ou 'docx')

        Returns:
            Texte extrait du document
        """
        if file_type.lower() == 'pdf':
            return DocumentParser.extract_from_pdf(file_bytes)
        elif file_type.lower() in ['docx', 'doc']:
            return DocumentParser.extract_from_docx(file_bytes)
        else:
            raise ValueError(f"Type de fichier non supporté: {file_type}")

    @staticmethod
    def clean_text(text: str, max_length: Optional[int] = 10000) -> str:
        """
        Nettoie et tronque le texte pour l'envoyer au modèle IA

        Args:
            text: Texte à nettoyer
            max_length: Longueur maximale du texte (pour éviter de dépasser les limites du modèle)

        Returns:
            Texte nettoyé et tronqué
        """
        # Supprimer les espaces multiples
        text = " ".join(text.split())

        # Tronquer si trop long
        if max_length and len(text) > max_length:
            text = text[:max_length] + "..."
            logger.warning(f"Texte tronqué à {max_length} caractères")

        return text
