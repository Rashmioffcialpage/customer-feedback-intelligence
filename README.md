# Customer Feedback Intelligence

An NLP portfolio project that classifies customer review sentences as
positive or negative using TF-IDF and logistic regression.

The application includes a FastAPI backend and a React and TypeScript
dashboard for single-review and batch predictions.

**Status:** Working local prototype. API tests, browser predictions,
mobile layout, and backend failure and recovery checks have passed.
Public deployment has not been completed.

## Features

- Single-review sentiment prediction.
- Batch analysis of up to 100 reviews.
- Positive and negative prediction counts.
- Visual distribution of batch predictions.
- Individual review predictions table.
- Input validation, loading indicators, and error handling.

## Dashboard example

![Batch sentiment predictions](docs/images/batch-results.png)

Three illustrative reviews produced two positive predictions and one
negative prediction. Percentages describe prediction shares, not model
confidence or verified customer satisfaction.

## Dataset

This project uses the Amazon subset of the
[UCI Sentiment Labelled Sentences dataset](https://archive.ics.uci.edu/dataset/331/sentiment+labelled+sentences).

- Original dataset: 1,000 sentences.
- Cleaned dataset: 987 sentences.
- Training set: 591 sentences.
- Validation set: 198 sentences.
- Final test set: 198 sentences.

Cleaning and splitting are documented in
`notebooks/01_feedback_analysis.ipynb`.

Citation: Kotzias, D. (2015). Sentiment Labelled Sentences [Dataset].
UCI Machine Learning Repository.
[Dataset DOI](https://doi.org/10.24432/C57604).

Dataset license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Processed copies are derived from the original dataset.

## Model development

Initial experiments used TF-IDF with unigrams and bigrams and
`min_df=2`.

| Model | Validation accuracy | Validation macro F1 | Errors |
| --- | ---: | ---: | ---: |
| Dummy baseline | 50.0% | 0.333 | 99 |
| Logistic regression | 79.3% | 0.793 | 41 |
| Multinomial Naive Bayes | 78.8% | 0.788 | 42 |

Both trained classifiers misclassified 33 of the same validation
sentences. Their accuracy differed by one correct prediction.

A subsequent experiment compared minimum document frequencies.
The selected pipeline uses TF-IDF with `ngram_range=(1, 2)`,
`min_df=1`, and logistic regression.

## Selected model results

The selected model was trained on 591 sentences. Model selection used
the validation set; the final test results were not used for tuning.

| Evaluation set | Sentences | Accuracy | Macro F1 |
| --- | ---: | ---: | ---: |
| Validation | 198 | 80.3% | 0.803 |
| Final test | 198 | 76.3% | 0.763 |

The final test produced 151 correct predictions and 47 errors.

## Limitations

- The model predicts positive or negative sentiment only.
- It does not identify neutral sentiment.
- It does not separately classify opinions about individual aspects.
- Mixed feedback receives one overall label.
- Results come from a small, curated sentence dataset.
- These results do not establish production readiness.

For example, the illustrative review
“The product is good, but customer support was frustrating.”
received a positive prediction, which does not separately capture the
complaint about support.

## Tech stack

- Python, pandas, NumPy, and scikit-learn.
- TF-IDF and logistic regression.
- FastAPI and Uvicorn.
- React, TypeScript, and Vite.
- matplotlib, seaborn, and Jupyter.
- unittest API integration tests.

## Local setup

Clone the repository:

```bash
git clone https://github.com/Rashmioffcialpage/customer-feedback-intelligence.git
cd customer-feedback-intelligence
```

Create and activate a Python virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Install frontend dependencies using the committed lockfile:

```bash
npm --prefix frontend ci
```

### Model artifact

The repository currently includes:

- `models/sentiment_pipeline.joblib`
- `models/sentiment_metadata.json`

The API loads the saved pipeline at startup. Only load joblib artifacts
from sources you trust.

The analysis notebook documents model training and saving.
To reproduce training, obtain the dataset from the UCI source above
and place the Amazon file at:

```text
data/raw/sentiment labelled sentences/amazon_cells_labelled.txt
```

Use the notebook's data preparation, training, selection, and saving
steps. Keep final test results separate from model selection.

### Start the backend

From the project root with the virtual environment active:

```bash
python -m uvicorn backend.main:app --reload --port 8002
```

### Start the frontend

In a separate terminal, from the project root:

```bash
npm --prefix frontend run dev -- --port 5173 --strictPort
```

- Dashboard: <http://localhost:5173/>
- API health: <http://127.0.0.1:8002/api/health>
- API documentation: <http://127.0.0.1:8002/docs>

The backend root URL does not serve the dashboard and returns 404.
Keep both development servers running while using the application.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| POST | `/api/predict` | Predict one review |
| POST | `/api/predict/batch` | Predict up to 100 reviews |

### Single-review example

```bash
curl -X POST "http://127.0.0.1:8002/api/predict" \
  -H "Content-Type: application/json" \
  -d '{"text":"The sound quality is excellent."}'
```

### Batch example

```bash
curl -X POST "http://127.0.0.1:8002/api/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{"reviews":[{"text":"The sound quality is excellent."},{"text":"The battery stopped working after one day."}]}'
```

## Verification

With the backend running, execute from the project root:

```bash
python -m unittest discover -s backend/tests -v
npm --prefix frontend run lint
npm --prefix frontend run build
```

Verified during development:

- Seven API integration tests passed.
- Frontend lint and production build passed.
- Single and batch predictions worked in the browser.
- Batch counts and review order matched the submitted examples.
- Mobile layout was checked at 390 px.
- Backend unavailability displayed an error.
- Predictions recovered after restarting the backend without refreshing.

A fresh installation from these instructions remains to be verified.

## Future extensions

- Neutral sentiment classification with suitable labelled data.
- Aspect-level sentiment analysis.
- Broader evaluation across feedback domains.
- Public deployment.

## Reading that inspired the project

[IBM Think: What is sentiment analysis?](https://www.ibm.com/think/topics/sentiment-analysis)

This is an independent learning project and is not affiliated with IBM.