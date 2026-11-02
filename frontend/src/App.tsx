import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Prediction = {
  text: string
  label: number
  sentiment: string
  limitation: string
}

type BatchResult = {
  results: Prediction[]
  summary: {
    total: number
    positive: number
    negative: number
  }
}

const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const demoReviews = [
  'The sound quality is excellent.',
  'The battery stopped working after one day.',
  'The product is good, but customer support was frustrating.',
].join('\n')

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(
      response.status === 422
        ? 'Check your input: use 1–100 reviews, each up to 5,000 characters.'
        : `Request failed (${response.status}). Check the backend.`,
    )
  }

  return response.json() as Promise<T>
}

function App() {
  const [review, setReview] = useState('')
  const [singleResult, setSingleResult] = useState<Prediction | null>(null)
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleError, setSingleError] = useState('')

  const [batchInput, setBatchInput] = useState('')
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState('')

  async function analyzeReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSingleError('')
    setSingleResult(null)

    const text = review.trim()

    if (!text) {
      setSingleError('Enter a review first.')
      return
    }

    setSingleLoading(true)

    try {
      const result = await postJson<Prediction>('/api/predict', { text })
      setSingleResult(result)
    } catch (error) {
      setSingleError(
        error instanceof Error ? error.message : 'Unable to analyze review.',
      )
    } finally {
      setSingleLoading(false)
    }
  }

  async function analyzeBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBatchError('')
    setBatchResult(null)

    const reviews = batchInput
      .split(/\r?\n/)
      .map((text) => text.trim())
      .filter(Boolean)

    if (reviews.length === 0 || reviews.length > 100) {
      setBatchError('Enter between 1 and 100 reviews, one per line.')
      return
    }

    if (reviews.some((text) => text.length > 5000)) {
      setBatchError('Each review must contain at most 5,000 characters.')
      return
    }

    setBatchLoading(true)

    try {
      const result = await postJson<BatchResult>('/api/predict/batch', {
        reviews: reviews.map((text) => ({ text })),
      })

      setBatchResult(result)
    } catch (error) {
      setBatchError(
        error instanceof Error ? error.message : 'Unable to analyze reviews.',
      )
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <main className="dashboard">
      <header>
        <p className="eyebrow">NLP · CUSTOMER FEEDBACK</p>
        <h1>Customer Feedback Intelligence</h1>
        <p className="subtitle">
          Explore review sentiment with a locally trained text classifier.
        </p>
      </header>

      <aside className="notice">
        Predictions are positive or negative. The model cannot separately
        identify neutral sentiment or mixed opinions within a review.
      </aside>

      <section className="panel" aria-labelledby="single-heading">
        <h2 id="single-heading">Analyze a review</h2>

        <form onSubmit={analyzeReview}>
          <label htmlFor="single-review">Review text</label>
          <textarea
            id="single-review"
            rows={4}
            maxLength={5000}
            value={review}
            disabled={singleLoading}
            onChange={(event) => setReview(event.target.value)}
            placeholder="For example: The sound quality is excellent."
          />

          <div className="actions">
            <button type="submit" disabled={singleLoading}>
              {singleLoading ? 'Analyzing…' : 'Analyze review'}
            </button>
          </div>
        </form>

        {singleLoading && <p role="status">Analyzing your review…</p>}
        {singleError && <p className="error" role="alert">{singleError}</p>}

        {singleResult && (
          <div className="prediction" role="status">
            <span
              className={`badge ${
                singleResult.label === 1 ? 'positive' : 'negative'
              }`}
            >
              Predicted {singleResult.sentiment.toLowerCase()}
            </span>
            <p className="review-text">{singleResult.text}</p>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="batch-heading">
        <h2 id="batch-heading">Analyze multiple reviews</h2>
        <p className="muted">
          Enter one review per line, up to 100 reviews. Blank lines are ignored.
        </p>

        <form onSubmit={analyzeBatch}>
          <label htmlFor="batch-reviews">Reviews</label>
          <textarea
            id="batch-reviews"
            rows={7}
            value={batchInput}
            disabled={batchLoading}
            onChange={(event) => setBatchInput(event.target.value)}
            placeholder={demoReviews}
          />

          <div className="actions">
            <button type="submit" disabled={batchLoading}>
              {batchLoading ? 'Analyzing…' : 'Analyze batch'}
            </button>

            <button
              type="button"
              className="secondary"
              disabled={batchLoading}
              onClick={() => {
                setBatchInput(demoReviews)
                setBatchResult(null)
                setBatchError('')
              }}
            >
              Load examples
            </button>

            <button
              type="button"
              className="secondary"
              disabled={batchLoading}
              onClick={() => {
                setBatchInput('')
                setBatchResult(null)
                setBatchError('')
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {batchLoading && <p role="status">Analyzing your reviews…</p>}
        {batchError && <p className="error" role="alert">{batchError}</p>}
      </section>

      {batchResult && (
        <section className="panel" aria-labelledby="results-heading">
          <h2 id="results-heading">Batch results</h2>

          <p className="muted">
            These results describe the last analyzed batch.
          </p>

          <div className="metrics" aria-label="Prediction counts">
            <article className="metric-card">
              <h3>Reviews analyzed</h3>
              <p>{batchResult.summary.total}</p>
            </article>

            <article className="metric-card">
              <h3>Predicted positive</h3>
              <p>{batchResult.summary.positive}</p>
            </article>

            <article className="metric-card">
              <h3>Predicted negative</h3>
              <p>{batchResult.summary.negative}</p>
            </article>
          </div>

          <h3>Predicted sentiment distribution</h3>

          <div className="chart">
            {[
              {
                name: 'Positive',
                count: batchResult.summary.positive,
                className: 'positive-fill',
              },
              {
                name: 'Negative',
                count: batchResult.summary.negative,
                className: 'negative-fill',
              },
            ].map((item) => {
              const percent = batchResult.summary.total > 0
                ? (item.count / batchResult.summary.total) * 100
                : 0

              return (
                <div key={item.name} className="chart-row">
                  <div className="chart-label">
                    <span>{item.name}</span>
                    <strong>{item.count} · {percent.toFixed(1)}%</strong>
                  </div>
                  <div className="bar-track" aria-hidden="true">
                    <div
                      className={item.className}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <p className="muted">
            Percentages are shares of model predictions, not confidence scores
            or verified customer satisfaction.
          </p>

          <div className="table-scroll">
            <table>
              <caption>Individual review predictions</caption>
              <thead>
                <tr>
                  <th scope="col">Review</th>
                  <th scope="col">Prediction</th>
                </tr>
              </thead>
              <tbody>
                {batchResult.results.map((result, index) => (
                  <tr key={`${index}-${result.text}`}>
                    <td className="review-text">{result.text}</td>
                    <td>
                      <span
                        className={`badge ${
                          result.label === 1 ? 'positive' : 'negative'
                        }`}
                      >
                        {result.sentiment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer>
        <p>
          TF-IDF + logistic regression · Trained on a small, curated Amazon
          review-sentence dataset from UCI.
        </p>
        <a
          href="https://github.com/Rashmioffcialpage/customer-feedback-intelligence"
          target="_blank"
          rel="noreferrer"
        >
          Follow the project on GitHub ↗
        </a>
      </footer>
    </main>
  )
}

export default App