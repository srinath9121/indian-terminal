import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: "#0f1520",
            border: "1px solid #1e2530",
            borderRadius: 8,
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, fontFamily: "monospace", marginBottom: 6 }}>
            ⚠ COMPONENT ERROR
          </div>
          <div style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 12,
              background: "none",
              border: "1px solid #3b82f6",
              color: "#3b82f6",
              borderRadius: 5,
              padding: "5px 16px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
