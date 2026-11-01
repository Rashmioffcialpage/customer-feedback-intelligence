import json
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen


BASE_URL = "http://127.0.0.1:8002"


def call_api(path, body=None):
    headers = {}
    data = None

    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = Request(
        f"{BASE_URL}{path}",
        data=data,
        headers=headers,
        method="POST" if body is not None else "GET",
    )

    try:
        with urlopen(request, timeout=15) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        try:
            return error.code, json.load(error)
        finally:
            error.close()


class FeedbackApiTests(unittest.TestCase):
    def test_health(self):
        status, result = call_api("/api/health")

        self.assertEqual(status, 200)
        self.assertEqual(result["status"], "ok")

    def test_single_prediction(self):
        text = "The sound quality is excellent."

        status, result = call_api(
            "/api/predict",
            {"text": text},
        )

        self.assertEqual(status, 200)
        self.assertEqual(result["text"], text)
        self.assertIn(result["label"], [0, 1])

        expected_sentiment = (
            "Positive" if result["label"] == 1 else "Negative"
        )

        self.assertEqual(result["sentiment"], expected_sentiment)
        self.assertTrue(result["limitation"])

    def test_blank_review_rejected(self):
        status, _ = call_api(
            "/api/predict",
            {"text": "   "},
        )

        self.assertEqual(status, 422)

    def test_long_review_rejected(self):
        status, _ = call_api(
            "/api/predict",
            {"text": "a" * 5001},
        )

        self.assertEqual(status, 422)

    def test_batch_matches_single_predictions(self):
        texts = [
            "The sound quality is excellent.",
            "The battery stopped working after one day.",
        ]

        status, batch = call_api(
            "/api/predict/batch",
            {"reviews": [{"text": text} for text in texts]},
        )

        self.assertEqual(status, 200)
        self.assertEqual(len(batch["results"]), len(texts))

        # Check that batch results preserve order and agree
        # with predictions from the single-review endpoint.
        for text, batch_item in zip(texts, batch["results"]):
            single_status, single_item = call_api(
                "/api/predict",
                {"text": text},
            )

            self.assertEqual(single_status, 200)
            self.assertEqual(batch_item["text"], text)
            self.assertEqual(
                batch_item["label"],
                single_item["label"],
            )

        expected_positive = sum(
            item["label"] == 1
            for item in batch["results"]
        )

        self.assertEqual(
            batch["summary"],
            {
                "total": len(texts),
                "positive": expected_positive,
                "negative": len(texts) - expected_positive,
            },
        )

    def test_empty_batch_rejected(self):
        status, _ = call_api(
            "/api/predict/batch",
            {"reviews": []},
        )

        self.assertEqual(status, 422)

    def test_oversized_batch_rejected(self):
        status, _ = call_api(
            "/api/predict/batch",
            {"reviews": [{"text": "Good product."}] * 101},
        )

        self.assertEqual(status, 422)


if __name__ == "__main__":
    unittest.main()