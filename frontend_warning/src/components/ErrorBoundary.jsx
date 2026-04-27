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
    console.error("WARNING SYSTEM ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', width: '100vw', background: '#050505',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#FFF', textAlign: 'center', padding: 20
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ fontFamily: "'Space Mono', monospace", marginBottom: 10, color: '#EF4444' }}>SYSTEM ERROR DETECTED</h2>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#9CA3AF', maxWidth: 500 }}>
            {this.state.error?.message || "Critical interface failure in Warning System."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: 30, padding: '12px 24px', background: 'transparent',
              border: '1px solid #EF4444', color: '#EF4444', borderRadius: 4, cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: 12
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
