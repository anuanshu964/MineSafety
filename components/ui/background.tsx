import React, { useEffect, useRef, useState } from 'react';

export type BackgroundPalette = 'emerald' | 'ocean' | 'sunset' | 'aurora';

export interface BgBackgroundProps {
    /** Initial color theme mode */
    defaultDark?: boolean;
    /** Background color palette: 'emerald' | 'ocean' | 'sunset' | 'aurora' */
    palette?: BackgroundPalette;
    /** Whether to show the theme toggle button */
    showToggle?: boolean;
    /** Whether to show the "Change Background" cycle button */
    showPaletteSelector?: boolean;
    /** Custom text for button when in Dark mode */
    darkToggleText?: string;
    /** Custom text for button when in Light mode */
    lightToggleText?: string;
    /** Callback fired when theme mode changes */
    onThemeChange?: (isDark: boolean) => void;
    /** Callback fired when background palette changes */
    onPaletteChange?: (palette: BackgroundPalette) => void;
    /** Additional CSS classes for the root container */
    className?: string;
    /** Optional overlay content (hero headings, buttons, cards) placed over the canvas */
    children?: React.ReactNode;
}

const PALETTE_VALUES: Record<BackgroundPalette, number> = {
    emerald: 0.0,
    ocean: 1.0,
    sunset: 2.0,
    aurora: 3.0,
};

const PALETTE_NAMES: BackgroundPalette[] = ['emerald', 'ocean', 'sunset', 'aurora'];

export function BgBackground({
    defaultDark = false,
    palette = 'emerald',
    showToggle = true,
    showPaletteSelector = true,
    darkToggleText = 'Switch to Light Mode',
    lightToggleText = 'Switch to Dark Mode',
    onThemeChange,
    onPaletteChange,
    className = '',
    children,
}: BgBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDark, setIsDark] = useState(defaultDark);
    const [activePalette, setActivePalette] = useState<BackgroundPalette>(palette);

    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const uResolutionRef = useRef<WebGLUniformLocation | null>(null);
    const uModeRef = useRef<WebGLUniformLocation | null>(null);
    const uPaletteRef = useRef<WebGLUniformLocation | null>(null);

    // ---- Shader Sources ----
    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;

        uniform vec2 u_resolution;
        uniform float u_mode;    // 0.0 = Light Mode, 1.0 = Dark Mode
        uniform float u_palette; // 0.0 = Emerald, 1.0 = Ocean, 2.0 = Sunset, 3.0 = Aurora

        // --- Simplex Noise Functions for Organic Shapes ---
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                               -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m;
            m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 3; i++) {
                value += amplitude * snoise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            vec2 aspectSt = st;
            aspectSt.x *= u_resolution.x / u_resolution.y;

            // --- Multi-Palette Color Definitions ---
            vec3 lightBase;
            vec3 lightAccent;
            vec3 lightSun;
            vec3 lightVapor;

            vec3 darkBase;
            vec3 darkAccent;
            vec3 darkWarm;
            vec3 darkShadow;

            if (u_palette < 0.5) {
                // 0. EMERALD MINT (Classic Organic)
                lightBase   = vec3(0.89, 0.925, 0.902);
                lightAccent = vec3(0.72, 0.86, 0.78);
                lightSun    = vec3(1.0, 0.94, 0.80);
                lightVapor  = vec3(0.96, 0.98, 0.96);

                darkBase    = vec3(0.02, 0.047, 0.027);
                darkAccent  = vec3(0.055, 0.18, 0.125);
                darkWarm    = vec3(0.33, 0.22, 0.086);
                darkShadow  = vec3(0.01, 0.02, 0.01);
            } else if (u_palette < 1.5) {
                // 1. OCEAN CYAN & DEEP INDIGO
                lightBase   = vec3(0.88, 0.93, 0.97);
                lightAccent = vec3(0.42, 0.74, 0.92);
                lightSun    = vec3(0.78, 0.88, 1.00);
                lightVapor  = vec3(0.95, 0.98, 1.00);

                darkBase    = vec3(0.02, 0.04, 0.09);
                darkAccent  = vec3(0.05, 0.24, 0.38);
                darkWarm    = vec3(0.12, 0.48, 0.70);
                darkShadow  = vec3(0.01, 0.02, 0.04);
            } else if (u_palette < 2.5) {
                // 2. SUNSET AMBER & OBSIDIAN
                lightBase   = vec3(0.97, 0.92, 0.88);
                lightAccent = vec3(0.92, 0.65, 0.48);
                lightSun    = vec3(1.00, 0.82, 0.58);
                lightVapor  = vec3(0.99, 0.96, 0.93);

                darkBase    = vec3(0.08, 0.03, 0.03);
                darkAccent  = vec3(0.32, 0.11, 0.09);
                darkWarm    = vec3(0.58, 0.30, 0.12);
                darkShadow  = vec3(0.04, 0.01, 0.01);
            } else {
                // 3. AURORA VIOLET & NEON CYBER
                lightBase   = vec3(0.93, 0.91, 0.96);
                lightAccent = vec3(0.74, 0.52, 0.88);
                lightSun    = vec3(0.60, 0.85, 0.95);
                lightVapor  = vec3(0.97, 0.95, 0.99);

                darkBase    = vec3(0.05, 0.02, 0.08);
                darkAccent  = vec3(0.22, 0.08, 0.38);
                darkWarm    = vec3(0.10, 0.48, 0.55);
                darkShadow  = vec3(0.02, 0.01, 0.04);
            }

            // --- Radial Lighting Setup ---
            vec2 sunCenter = vec2(u_resolution.x / u_resolution.y * 0.82, 0.82);
            float distSun = length(aspectSt - sunCenter);
            float sunGlow = smoothstep(0.8, 0.0, distSun);

            vec2 mintCenter = vec2(u_resolution.x / u_resolution.y * 0.2, 0.7);
            float distMint = length(aspectSt - mintCenter);
            float mintGlow = smoothstep(0.85, 0.0, distMint);

            // --- Organic Vapor Curves ---
            vec2 q = vec2(fbm(aspectSt * 1.2), fbm(aspectSt * 1.2 + vec2(1.0)));
            vec2 r = vec2(fbm(aspectSt * 1.5 + q + vec2(1.7, 9.2)), fbm(aspectSt * 1.5 + q + vec2(8.3, 2.8)));
            float organicFlow = fbm(aspectSt + r);
            float leafShape = smoothstep(-0.25, 0.55, organicFlow);

            // --- Mode Blending ---
            vec3 finalColor;

            if (u_mode < 0.5) {
                // Render LIGHT MODE
                finalColor = mix(lightBase, lightAccent, mintGlow * 0.7 + leafShape * 0.3);
                finalColor = mix(finalColor, lightSun, sunGlow * 0.85);
                finalColor = mix(finalColor, lightVapor, leafShape * 0.4);
            } else {
                // Render DARK MODE
                finalColor = mix(darkBase, darkAccent, mintGlow * 0.85 + leafShape * 0.35);
                finalColor = mix(finalColor, darkWarm, sunGlow * 0.75);
                float shadowMask = smoothstep(0.0, 0.6, r.x);
                finalColor *= (0.5 + 0.5 * shadowMask);
            }

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        if (!vertexShader || !fragmentShader) return null;

        const program = gl.createProgram();
        if (!program) return null;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    function render(
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        uResolution: WebGLUniformLocation | null,
        uMode: WebGLUniformLocation | null,
        uPalette: WebGLUniformLocation | null,
        currentMode: number,
        paletteValue: number
    ) {
        if (uMode) gl.uniform1f(uMode, currentMode);
        if (uPalette) gl.uniform1f(uPalette, paletteValue);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function resizeCanvas(
        canvas: HTMLCanvasElement,
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        uResolution: WebGLUniformLocation | null
    ) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (uResolution) {
            gl.uniform2f(uResolution, canvas.width, canvas.height);
        }
    }

    // ---- WebGL Setup Effect ----
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (!gl) {
            console.warn('WebGL not supported');
            return;
        }
        glRef.current = gl;

        const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
        if (!program) return;
        programRef.current = program;
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        );

        const positionLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uResolution = gl.getUniformLocation(program, 'u_resolution');
        const uMode = gl.getUniformLocation(program, 'u_mode');
        const uPalette = gl.getUniformLocation(program, 'u_palette');
        uResolutionRef.current = uResolution;
        uModeRef.current = uMode;
        uPaletteRef.current = uPalette;

        resizeCanvas(canvas, gl, program, uResolution);
        render(gl, program, uResolution, uMode, uPalette, isDark ? 1.0 : 0.0, PALETTE_VALUES[activePalette]);

        const handleResize = () => {
            resizeCanvas(canvas, gl, program, uResolution);
            render(gl, program, uResolution, uMode, uPalette, isDark ? 1.0 : 0.0, PALETTE_VALUES[activePalette]);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            gl.deleteProgram(program);
            gl.deleteBuffer(positionBuffer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Effect: Re-render on Theme or Palette Change ----
    useEffect(() => {
        const gl = glRef.current;
        const program = programRef.current;
        const uResolution = uResolutionRef.current;
        const uMode = uModeRef.current;
        const uPalette = uPaletteRef.current;
        if (gl && program && uResolution && uMode && uPalette) {
            render(gl, program, uResolution, uMode, uPalette, isDark ? 1.0 : 0.0, PALETTE_VALUES[activePalette]);
        }
        if (onThemeChange) onThemeChange(isDark);
    }, [isDark, activePalette, onThemeChange]);

    const toggleTheme = () => {
        setIsDark((prev) => !prev);
    };

    const cyclePalette = () => {
        const currentIndex = PALETTE_NAMES.indexOf(activePalette);
        const nextPalette = PALETTE_NAMES[(currentIndex + 1) % PALETTE_NAMES.length];
        setActivePalette(nextPalette);
        if (onPaletteChange) onPaletteChange(nextPalette);
    };

    return (
        <div
            className={`relative w-screen h-screen overflow-hidden ${className}`}
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            <style>{`
                /* Action Button Controls Bar */
                .demo-controls-bar {
                    position: absolute;
                    top: 24px;
                    right: 24px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 50;
                }
                .demo-glass-btn {
                    padding: 9px 16px;
                    border-radius: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    background: rgba(255, 255, 255, 0.16);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    user-select: none;
                }
                .demo-glass-btn.light-active {
                    background: rgba(255, 255, 255, 0.88);
                    border-color: rgba(0, 0, 0, 0.12);
                    color: #1a2a20;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                }
                .demo-glass-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.2);
                }
                .demo-canvas {
                    width: 100vw;
                    height: 100vh;
                    display: block;
                }
                .overlay-content-wrapper {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 20;
                }
                .overlay-content-wrapper > * {
                    pointer-events: auto;
                }
            `}</style>

            <div className="demo-controls-bar">
                {/* Change Background Palette Button */}
                {showPaletteSelector && (
                    <button
                        className={`demo-glass-btn ${!isDark ? 'light-active' : ''}`}
                        onClick={cyclePalette}
                        title="Click to cycle background palette"
                        aria-label="Change Background Palette"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10"></path>
                        </svg>
                        <span>Background: <strong style={{ textTransform: 'capitalize' }}>{activePalette}</strong></span>
                    </button>
                )}

                {/* Light / Dark Mode Toggle */}
                {showToggle && (
                    <button
                        className={`demo-glass-btn ${!isDark ? 'light-active' : ''}`}
                        onClick={toggleTheme}
                        aria-label="Toggle Theme"
                    >
                        {isDark ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        )}
                        <span>{isDark ? darkToggleText : lightToggleText}</span>
                    </button>
                )}
            </div>

            {/* Optional Overlay Content */}
            {children && (
                <div className="overlay-content-wrapper">
                    {children}
                </div>
            )}

            <canvas ref={canvasRef} className="demo-canvas" id="webgl-canvas" />
        </div>
    );
}

export default BgBackground;
