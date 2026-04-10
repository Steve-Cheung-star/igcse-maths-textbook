// src/utils/canvasUtils.js

/**
 * Accurately gets the mouse/touch position on a canvas, 
 * even if the canvas is scaled by CSS or Projector Mode.
 */
export function getScaledPointerPos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.offsetWidth / rect.width;
    const scaleY = canvas.offsetHeight / rect.height;
    
    // Handle both touch and mouse events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

/**
 * Automatically handles Canvas resizing, DPR (Retina displays), 
 * and triggers a callback when the layout changes.
 */
export function observeCanvasResize(container, canvas, ctx, onResizeCallback) {
    const observer = new ResizeObserver(() => {
        if (!canvas || canvas.offsetWidth === 0) return; // Wait for CSS to load
        
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        
        // Pass the new logical width and height back to the app
        if (onResizeCallback) onResizeCallback(width, height);
    });
    
    observer.observe(container);
    return () => observer.disconnect(); // Returns the cleanup function
}