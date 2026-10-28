import unittest

import cv2
import numpy as np

from decoupe_fond import decouper_fond


class DecouperFondTests(unittest.TestCase):
    def creer_image(self, contraste):
        height, width = 1200, 1600
        gradient = np.linspace(-8, 8, height, dtype=np.float32)[:, None, None]
        background = np.full((height, width, 3), 245, dtype=np.float32) + gradient
        image = np.clip(background, 0, 255).astype(np.uint8)
        couleur_piece = tuple(245 - contraste for _ in range(3))
        cv2.rectangle(image, (450, 350), (1150, 790), couleur_piece, -1)
        cv2.rectangle(image, (450, 350), (1150, 790), (35, 35, 35), 5)
        cv2.putText(image, "IDENTITE", (510, 530), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (30, 30, 30), 3)
        return image

    def test_recadre_piece_claire_sur_fond_clair(self):
        image = self.creer_image(25)

        carte = decouper_fond(image)

        self.assertIsNotNone(carte)
        self.assertLessEqual(abs(carte.shape[1] - 700), 20)
        self.assertLessEqual(abs(carte.shape[0] - 440), 20)

    def test_recadre_piece_a_faible_contraste_sur_fond_clair(self):
        image = self.creer_image(15)

        carte = decouper_fond(image)

        self.assertIsNotNone(carte)
        self.assertLessEqual(abs(carte.shape[1] - 700), 20)
        self.assertLessEqual(abs(carte.shape[0] - 440), 20)


if __name__ == "__main__":
    unittest.main()
