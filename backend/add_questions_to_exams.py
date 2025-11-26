"""
Script pour ajouter des questions fictives supplémentaires aux examens existants
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import QCM, Question, User


def add_questions_to_qcm(qcm_titre: str, questions_data: list):
    """Ajoute des questions à un QCM existant"""
    qcm = QCM.query.filter_by(titre=qcm_titre).first()
    if not qcm:
        print(f"❌ QCM '{qcm_titre}' non trouvé")
        return False

    # Vérifier quelles questions existent déjà
    questions_existantes = {q.enonce for q in qcm.questions}
    nouvelles_questions = 0

    for q_data in questions_data:
        # Vérifier si la question existe déjà
        if q_data['enonce'] in questions_existantes:
            print(f"⏭️  Question déjà existante: {q_data['enonce'][:50]}...")
            continue

        question = Question(
            enonce=q_data['enonce'],
            type_question=q_data['type'],
            points=q_data['points'],
            qcm_id=qcm.id,
            explication=q_data.get('explication')
        )

        if q_data['type'] == 'qcm':
            # Options pour QCM
            question.set_options(q_data['options'])
        elif q_data['type'] == 'vrai_faux':
            question.reponse_correcte = q_data['reponse_correcte']

        db.session.add(question)
        nouvelles_questions += 1
        print(f"✅ Question ajoutée: {q_data['enonce'][:50]}...")

    db.session.commit()
    print(f"✅ {nouvelles_questions} nouvelle(s) question(s) ajoutée(s) au QCM '{qcm_titre}'")
    return True


def main():
    """Fonction principale"""
    print("\n📝 Ajout de questions fictives aux examens\n")
    print("=" * 60)

    app = create_app()

    with app.app_context():
        # Questions supplémentaires pour QCM Algorithmique
        questions_algo = [
            {
                'enonce': 'Quelle est la complexité temporelle du tri par bulles dans le pire des cas?',
                'type': 'qcm',
                'points': 3,
                'options': [
                    {'id': 'a', 'texte': 'O(n)', 'estCorrecte': False},
                    {'id': 'b', 'texte': 'O(n log n)', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'O(n²)', 'estCorrecte': True},
                    {'id': 'd', 'texte': 'O(1)', 'estCorrecte': False}
                ],
                'explication': 'Le tri par bulles a une complexité O(n²) dans le pire des cas car il compare chaque élément avec tous les autres.'
            },
            {
                'enonce': 'Qu\'est-ce qu\'une structure de données LIFO?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'Une pile (stack)', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'Une file (queue)', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'Un arbre', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Une liste chaînée', 'estCorrecte': False}
                ],
                'explication': 'LIFO signifie Last In First Out, ce qui correspond à une pile où le dernier élément ajouté est le premier à être retiré.'
            },
            {
                'enonce': 'La récursivité est toujours plus efficace que l\'itération.',
                'type': 'vrai_faux',
                'points': 1,
                'reponse_correcte': 'Faux',
                'explication': 'La récursivité n\'est pas toujours plus efficace. Elle peut être moins efficace à cause de la surcharge des appels de fonction et de la pile d\'exécution.'
            },
            {
                'enonce': 'Quelle structure de données utilise le principe FIFO?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'Une pile (stack)', 'estCorrecte': False},
                    {'id': 'b', 'texte': 'Une file (queue)', 'estCorrecte': True},
                    {'id': 'c', 'texte': 'Un arbre binaire', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Un graphe', 'estCorrecte': False}
                ],
                'explication': 'FIFO signifie First In First Out, ce qui correspond à une file où le premier élément ajouté est le premier à être retiré.'
            },
            {
                'enonce': 'Quelle est la complexité de la recherche binaire dans un tableau trié?',
                'type': 'qcm',
                'points': 3,
                'options': [
                    {'id': 'a', 'texte': 'O(n)', 'estCorrecte': False},
                    {'id': 'b', 'texte': 'O(log n)', 'estCorrecte': True},
                    {'id': 'c', 'texte': 'O(n log n)', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'O(1)', 'estCorrecte': False}
                ],
                'explication': 'La recherche binaire divise l\'espace de recherche par deux à chaque itération, d\'où la complexité O(log n).'
            }
        ]

        # Questions supplémentaires pour QCM Bases de Données
        questions_bdd = [
            {
                'enonce': 'Qu\'est-ce qu\'une clé étrangère (foreign key)?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'Une clé qui référence une clé primaire d\'une autre table', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'Une clé qui peut être NULL', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'Une clé unique dans une table', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Une clé qui peut être dupliquée', 'estCorrecte': False}
                ],
                'explication': 'Une clé étrangère établit une relation entre deux tables en référençant la clé primaire d\'une autre table.'
            },
            {
                'enonce': 'Qu\'est-ce qu\'une transaction ACID?',
                'type': 'qcm',
                'points': 3,
                'options': [
                    {'id': 'a', 'texte': 'Atomicité, Cohérence, Isolation, Durabilité', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'Association, Clé, Index, Données', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'Accès, Contrôle, Intégrité, Définition', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Analyse, Conception, Implémentation, Déploiement', 'estCorrecte': False}
                ],
                'explication': 'ACID est un acronyme pour Atomicité (tout ou rien), Cohérence (intégrité), Isolation (concurrence), Durabilité (persistance).'
            },
            {
                'enonce': 'Le normalisation d\'une base de données réduit toujours les performances.',
                'type': 'vrai_faux',
                'points': 1,
                'reponse_correcte': 'Faux',
                'explication': 'La normalisation peut améliorer les performances en réduisant la redondance et en optimisant les requêtes, bien qu\'elle puisse parfois nécessiter plus de jointures.'
            },
            {
                'enonce': 'Quelle commande SQL permet de récupérer des données?',
                'type': 'qcm',
                'points': 1,
                'options': [
                    {'id': 'a', 'texte': 'SELECT', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'GET', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'FETCH', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'RETRIEVE', 'estCorrecte': False}
                ],
                'explication': 'La commande SELECT est utilisée pour récupérer des données d\'une ou plusieurs tables.'
            },
            {
                'enonce': 'Qu\'est-ce qu\'un index en base de données?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'Une structure qui accélère les recherches', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'Une table supplémentaire', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'Une contrainte d\'intégrité', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Un type de données', 'estCorrecte': False}
                ],
                'explication': 'Un index est une structure de données qui améliore la vitesse des opérations de recherche dans une table.'
            }
        ]

        # Questions supplémentaires pour QCM Python
        questions_python = [
            {
                'enonce': 'Quelle est la différence entre une liste et un tuple en Python?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'Les listes sont mutables, les tuples sont immutables', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'Les tuples sont mutables, les listes sont immutables', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'Il n\'y a pas de différence', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Les listes utilisent des parenthèses, les tuples des crochets', 'estCorrecte': False}
                ],
                'explication': 'Les listes sont mutables (modifiables) et utilisent [], tandis que les tuples sont immutables (non modifiables) et utilisent ().'
            },
            {
                'enonce': 'Qu\'est-ce qu\'un décorateur en Python?',
                'type': 'qcm',
                'points': 3,
                'options': [
                    {'id': 'a', 'texte': 'Une fonction qui modifie ou étend le comportement d\'une autre fonction', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'Un type de variable', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'Une structure de contrôle', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Un module Python', 'estCorrecte': False}
                ],
                'explication': 'Un décorateur est une fonction qui prend une fonction en paramètre et retourne une nouvelle fonction avec un comportement modifié ou étendu.'
            },
            {
                'enonce': 'En Python, les variables sont typées statiquement.',
                'type': 'vrai_faux',
                'points': 1,
                'reponse_correcte': 'Faux',
                'explication': 'Python est un langage à typage dynamique, le type d\'une variable est déterminé à l\'exécution.'
            },
            {
                'enonce': 'Quelle méthode permet d\'itérer sur les clés et valeurs d\'un dictionnaire?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'items()', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'keys_values()', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'pairs()', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'iterate()', 'estCorrecte': False}
                ],
                'explication': 'La méthode items() retourne une vue des paires clé-valeur du dictionnaire.'
            },
            {
                'enonce': 'Qu\'est-ce qu\'un générateur en Python?',
                'type': 'qcm',
                'points': 3,
                'options': [
                    {'id': 'a', 'texte': 'Une fonction qui utilise yield au lieu de return', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'Une fonction qui génère des nombres aléatoires', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'Un type de boucle', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Un module Python', 'estCorrecte': False}
                ],
                'explication': 'Un générateur est une fonction qui utilise yield pour produire une séquence de valeurs de manière paresseuse (lazy).'
            },
            {
                'enonce': 'Quelle est la syntaxe correcte pour créer un dictionnaire vide?',
                'type': 'qcm',
                'points': 1,
                'options': [
                    {'id': 'a', 'texte': 'dict = {}', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'dict = []', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'dict = ()', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'dict = dict()', 'estCorrecte': True}
                ],
                'explication': 'On peut créer un dictionnaire vide avec {} ou dict(). Les deux sont corrects.'
            }
        ]

        print("\n📚 Ajout de questions au QCM Algorithmique...")
        add_questions_to_qcm("QCM Algorithmique - Bases", questions_algo)

        print("\n💾 Ajout de questions au QCM Bases de Données...")
        add_questions_to_qcm("QCM Bases de Données", questions_bdd)

        print("\n🐍 Ajout de questions au QCM Python...")
        add_questions_to_qcm("QCM Programmation Python", questions_python)

        print("\n" + "=" * 60)
        print("✅ Questions fictives ajoutées avec succès!")
        
        # Afficher le résumé
        qcms = QCM.query.all()
        print("\n📊 Résumé des QCM:")
        for qcm in qcms:
            nb_questions = len(qcm.questions) if qcm.questions else 0
            total_points = sum([q.points for q in qcm.questions]) if qcm.questions else 0
            print(f"   - {qcm.titre}: {nb_questions} questions ({total_points} points)")


if __name__ == '__main__':
    main()

