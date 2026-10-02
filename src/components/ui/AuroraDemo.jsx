import React from 'react';
import Aurora from './Aurora';

export default function AuroraBackgroundDemo() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#030712' }}>
      {/* Aurora WebGL Canvas Background Layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Aurora
          colorStops={["#7cff67", "#B497CF", "#5227FF"]}
          blend={0.65}
          amplitude={1.1}
          speed={0.6}
        />
      </div>

      {/* Centered Overlay Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '0 24px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          maxWidth: '640px',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '18px',
          padding: '36px 32px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: '#7cff67',
            display: 'block',
            marginBottom: '8px'
          }}>
            Northern Lights Ambient Canvas
          </span>

          <h1 style={{
            fontSize: '38px',
            fontWeight: 800,
            margin: '0 0 12px',
            letterSpacing: '-0.5px'
          }}>
            Luminous Aurora Waves
          </h1>

          <p style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '24px'
          }}>
            Real-time WebGL 2.0 shader with smooth mathematical noise displacement and GPU color ramping via OGL.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button style={{
              backgroundColor: '#5227FF',
              color: '#ffffff',
              border: 'none',
              padding: '11px 22px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(82, 39, 255, 0.4)'
            }}>
              Launch Console
            </button>
            <button style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '11px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Customize Colors
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
