import { useEffect, useState } from "react";

function Responses({ formId, onBack }) {
  const [formData, setFormData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  /* =========================================
     LOAD RESPONSES
  ========================================= */

  const loadResponses = async () => {
    if (!formId) {
      setError("No form ID found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://student-form-app-l2yr.onrender.com/api/responses/form/${formId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load responses."
        );
      }

      setFormData(data.form || null);
      setQuestions(data.questions || []);
      setResponses(data.responses || []);
    } catch (error) {
      console.error("Load responses error:", error);

      setError(
        error.message ||
          "Failed to load responses."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     LOAD ON PAGE OPEN
  ========================================= */

  useEffect(() => {
    loadResponses();
  }, [formId]);

  /* =========================================
     EXPORT CSV
  ========================================= */

  const handleExportCSV = async () => {
    if (!formId) {
      alert("No form ID found.");
      return;
    }

    try {
      setExporting(true);

      const response = await fetch(
        `https://student-form-app-l2yr.onrender.com/api/responses/form/${formId}/csv`
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to export CSV.";

        try {
          const data = await response.json();

          if (data.message) {
            errorMessage = data.message;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `${formData?.title || "form"}_responses.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(
        "Export CSV error:",
        error
      );

      alert(
        error.message ||
          "Unable to export CSV."
      );
    } finally {
      setExporting(false);
    }
  };

  /* =========================================
     FIND ANSWER
  ========================================= */

  const getAnswer = (
    response,
    questionId
  ) => {
    const answer = (
      response.answers || []
    ).find(
      (item) =>
        Number(item.question_id) ===
        Number(questionId)
    );

    return answer
      ? answer.answer_text
      : "";
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="responses-page">
        <div className="responses-container">
          <div className="responses-loading">
            <div className="responses-spinner"></div>

            <h2>
              Loading responses...
            </h2>

            <p>
              Please wait while we retrieve
              the submitted responses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================
     ERROR
  ========================================= */

  if (error) {
    return (
      <div className="responses-page">
        <div className="responses-container">

          <div className="responses-header">
            <button
              type="button"
              className="responses-back-button"
              onClick={onBack}
            >
              ← Back to Builder
            </button>
          </div>

          <div className="responses-error">
            <div className="responses-error-icon">
              !
            </div>

            <h2>
              Unable to load responses
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="responses-retry-button"
              onClick={loadResponses}
            >
              Try Again
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="responses-page">

      <div className="responses-container">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="responses-header">

          <button
            type="button"
            className="responses-back-button"
            onClick={onBack}
          >
            ← Back to Builder
          </button>

          <div className="responses-header-content">

            <div>
              <h1>
                {formData?.title ||
                  "Form Responses"}
              </h1>

              {formData?.description && (
                <p>
                  {formData.description}
                </p>
              )}
            </div>

            <div className="responses-header-actions">

              <button
                type="button"
                className="responses-refresh-button"
                onClick={loadResponses}
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                className="responses-export-button"
                onClick={handleExportCSV}
                disabled={
                  exporting ||
                  responses.length === 0
                }
              >
                {exporting
                  ? "Exporting..."
                  : "📥 Export CSV"}
              </button>

            </div>

          </div>

        </div>


        {/* =====================================
            STATISTICS
        ===================================== */}

        <div className="responses-stats">

          <div className="response-stat-card">

            <div className="response-stat-icon">
              📊
            </div>

            <div>
              <span>
                Total Responses
              </span>

              <strong>
                {responses.length}
              </strong>
            </div>

          </div>


          <div className="response-stat-card">

            <div className="response-stat-icon">
              ❓
            </div>

            <div>
              <span>
                Questions
              </span>

              <strong>
                {questions.length}
              </strong>
            </div>

          </div>


          <div className="response-stat-card">

            <div className="response-stat-icon">
              📄
            </div>

            <div>
              <span>
                Form
              </span>

              <strong>
                #{formData?.id || formId}
              </strong>
            </div>

          </div>

        </div>


        {/* =====================================
            NO RESPONSES
        ===================================== */}

        {responses.length === 0 ? (

          <div className="responses-empty">

            <div className="responses-empty-icon">
              📭
            </div>

            <h2>
              No responses yet
            </h2>

            <p>
              When respondents submit this
              form, their answers will appear
              here automatically.
            </p>

            <button
              type="button"
              className="responses-empty-back-button"
              onClick={onBack}
            >
              ← Back to Form Builder
            </button>

          </div>

        ) : (

          /* =====================================
             RESPONSES TABLE
          ===================================== */

          <div className="responses-card">

            <div className="responses-card-header">

              <div>
                <h2>
                  Submitted Responses
                </h2>

                <p>
                  {responses.length}{" "}
                  {responses.length === 1
                    ? "response"
                    : "responses"}{" "}
                  received
                </p>
              </div>

              <button
                type="button"
                className="responses-export-small"
                onClick={handleExportCSV}
                disabled={exporting}
              >
                {exporting
                  ? "Exporting..."
                  : "📥 Export CSV"}
              </button>

            </div>


            <div className="responses-table-wrapper">

              <table className="responses-table">

                <thead>

                  <tr>

                    <th>
                      #
                    </th>

                    <th>
                      Submitted At
                    </th>

                    {questions.map(
                      (question, index) => (
                        <th
                          key={
                            question.id ||
                            index
                          }
                        >
                          <div className="response-question-header">

                            <span>
                              Q{index + 1}
                            </span>

                            <strong>
                              {
                                question.question_text
                              }
                            </strong>

                          </div>
                        </th>
                      )
                    )}

                  </tr>

                </thead>


                <tbody>

                  {responses.map(
                    (
                      response,
                      responseIndex
                    ) => (

                      <tr
                        key={
                          response.id ||
                          responseIndex
                        }
                      >

                        <td className="response-number">
                          {responseIndex + 1}
                        </td>

                        <td className="response-date">
                          {response.submitted_at
                            ? new Date(
                                response.submitted_at
                              ).toLocaleString()
                            : "—"}
                        </td>

                        {questions.map(
                          (
                            question,
                            questionIndex
                          ) => (

                            <td
                              key={
                                question.id ||
                                questionIndex
                              }
                            >
                              {getAnswer(
                                response,
                                question.id
                              ) || (
                                <span className="no-answer">
                                  —
                                </span>
                              )}
                            </td>

                          )
                        )}

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default Responses;