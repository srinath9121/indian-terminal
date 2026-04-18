import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI ERROR CAUGHT:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', width: '100vw', background: '#060611',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#FFF', textAlign: 'center', padding: 20
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 10 }}>SYSTEM ERROR DETECTED</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#8892A0', maxWidth: 500 }}>
            {this.state.error?.message || "Critical interface failure occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: 30, padding: '12px 24px', background: 'transparent',
              border: '1px solid #00D4FF', color: '#00D4FF', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 12
            }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
