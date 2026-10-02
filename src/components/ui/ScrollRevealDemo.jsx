import React from 'react';
import ScrollReveal from './ScrollReveal';
import './ScrollReveal.css';

export default function ScrollRevealDemo() {
  return (
    <div style={{
      minHeight: '250vh',
      backgroundColor: '#0a0f1d',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '60px 24px',
      overflowX: 'hidden'
    }}>
      {/* Intro Hero */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 120px',
        textAlign: 'center',
        paddingTop: '40px'
      }}>
        <span style={{
          display: 'inline-block',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: '#38bdf8',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '6px 14px',
          borderRadius: '999px',
          marginBottom: '20px'
        }}>
          React Bits · Scroll Reveal
        </span>
        <h1 style={{
          fontSize: '44px',
          fontWeight: 800,
          letterSpacing: '-1px',
          marginBottom: '16px'
        }}>
          Smooth GSAP Kinetic Scroll
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '16px',
          lineHeight: 1.6
        }}>
          Scroll down gently to see the word-by-word kinetic opacity reveal, subtle rotation, and optical blur reduction in action.
        </p>
        <div style={{ marginTop: '30px', color: '#64748b', fontSize: '13px' }}>
          ↓ Scroll down to reveal
        </div>
      </div>

      {/* Main Quote ScrollReveal (From Usage Example) */}
      <div style={{
        maxWidth: '920px',
        margin: '0 auto 160px',
        padding: '40px',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <ScrollReveal
          baseOpacity={0}
          enableBlur={true}
          baseRotation={5}
          blurStrength={10}
          containerClassName="quote-reveal"
          textClassName="quote-text"
        >
          When does a man die? When he is hit by a bullet? No! When he suffers a disease?
          No! When he ate a soup made out of a poisonous mushroom?
          No! A man dies when he is forgotten!
        </ScrollReveal>
      </div>

      {/* Second Showcase: Industrial Safety Manifesto */}
      <div style={{
        maxWidth: '920px',
        margin: '0 auto 160px',
        padding: '40px',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          MineSafe Operational Principle
        </span>
        <ScrollReveal
          baseOpacity={0.08}
          enableBlur={true}
          baseRotation={3}
          blurStrength={6}
          containerClassName="manifesto-reveal"
        >
          In deep mining operations, safety is not an afterthought or a policy document.
          It is an unrelenting commitment made every second at the coal face, in the ventilation shaft, and across every conveyor belt.
          Every hazard reported early saves a human life.
        </ScrollReveal>
      </div>
    </div>
  );
}
