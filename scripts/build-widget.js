import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildWidget() {
  console.log('🔨 Building embedded booking widget...');

  try {
    // Build the widget component
    const result = await esbuild.build({
      entryPoints: ['src/components/bookings/EmbeddedBookingWidget.tsx'],
      bundle: true,
      minify: true,
      format: 'iife', // Immediately Invoked Function Expression
      globalName: 'GMBookingWidget',
      outfile: 'public/widget/gm-booking-widget.js',
      external: ['react', 'react-dom'], // We'll include these in the bundle
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts'
      },
      target: ['es2015'], // Support older browsers
      sourcemap: true,
      metafile: true,
    });

    console.log('✅ Widget built successfully!');
    console.log('📁 Output: public/widget/gm-booking-widget.js');
    
    // Create the widget loader script
    createWidgetLoader();
    
    // Create the CSS file
    createWidgetCSS();
    
    console.log('🎉 Widget distribution files created!');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

function createWidgetLoader() {
  const loaderScript = `
// GM Booking Widget Loader
(function() {
  'use strict';
  
  // Widget configuration
  window.GMBookingWidgetConfig = window.GMBookingWidgetConfig || {
    apiEndpoint: 'https://plksvatjdylpuhjitbfc.supabase.co/functions/v1/public-booking-api-v2',
    apiKey: 'demo-api-key-2024',
    theme: 'light',
    primaryColor: '#007bff',
    showSpecialRequests: true
  };
  
  // Initialize widget when DOM is ready
  function initWidget() {
    const containers = document.querySelectorAll('[data-gm-widget="booking"]');
    
    containers.forEach(container => {
      // Get configuration from data attributes
      const config = {
        venue: container.dataset.venue || 'both',
        defaultVenueArea: container.dataset.venueArea || 'upstairs',
        theme: container.dataset.theme || 'light',
        primaryColor: container.dataset.primaryColor || '#007bff',
        showSpecialRequests: container.dataset.showSpecialRequests !== 'false',
        apiEndpoint: container.dataset.apiEndpoint || window.GMBookingWidgetConfig.apiEndpoint,
        apiKey: container.dataset.apiKey || window.GMBookingWidgetConfig.apiKey
      };
      
      // Call the widget function
      if (window.GMBookingWidget) {
        window.GMBookingWidget(container, config);
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
  // Also initialize on dynamic content changes
  if (window.MutationObserver) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          const containers = mutation.target.querySelectorAll('[data-gm-widget="booking"]');
          if (containers.length > 0) {
            initWidget();
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
`;

  // Ensure the widget directory exists
  const widgetDir = path.join(__dirname, '../public/widget');
  if (!fs.existsSync(widgetDir)) {
    fs.mkdirSync(widgetDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(widgetDir, 'widget-loader.js'), loaderScript);
  console.log('📁 Created: public/widget/widget-loader.js');
}

function createWidgetCSS() {
  const css = `
/* GM Booking Widget Styles */
.gm-booking-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  color: #333;
}

.gm-booking-widget * {
  box-sizing: border-box;
}

.gm-booking-widget .widget-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.gm-booking-widget .widget-header {
  text-align: center;
  margin-bottom: 24px;
}

.gm-booking-widget .widget-title {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.gm-booking-widget .form-group {
  margin-bottom: 16px;
}

.gm-booking-widget .form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #374151;
}

.gm-booking-widget .form-input,
.gm-booking-widget .form-select,
.gm-booking-widget .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.gm-booking-widget .form-input:focus,
.gm-booking-widget .form-select:focus,
.gm-booking-widget .form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.gm-booking-widget .form-textarea {
  resize: vertical;
  min-height: 80px;
}

.gm-booking-widget .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.gm-booking-widget .submit-button {
  background: #007bff;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.gm-booking-widget .submit-button:hover {
  background: #0056b3;
}

.gm-booking-widget .submit-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.gm-booking-widget .loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.gm-booking-widget .status-message {
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
  font-size: 14px;
}

.gm-booking-widget .status-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.gm-booking-widget .status-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.gm-booking-widget .status-loading {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  color: #1976d2;
}

/* Dark theme */
.gm-booking-widget.dark {
  color: #e5e7eb;
}

.gm-booking-widget.dark .widget-card {
  background: #1f2937;
  border-color: #374151;
}

.gm-booking-widget.dark .widget-title {
  color: #f9fafb;
}

.gm-booking-widget.dark .form-label {
  color: #d1d5db;
}

.gm-booking-widget.dark .form-input,
.gm-booking-widget.dark .form-select,
.gm-booking-widget.dark .form-textarea {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.gm-booking-widget.dark .form-input:focus,
.gm-booking-widget.dark .form-select:focus,
.gm-booking-widget.dark .form-textarea:focus {
  border-color: #007bff;
}

/* Responsive design */
@media (max-width: 480px) {
  .gm-booking-widget .widget-card {
    padding: 16px;
  }
  
  .gm-booking-widget .form-row {
    grid-template-columns: 1fr;
  }
}
`;

  // Ensure the widget directory exists
  const widgetDir = path.join(__dirname, '../public/widget');
  if (!fs.existsSync(widgetDir)) {
    fs.mkdirSync(widgetDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(widgetDir, 'widget.css'), css);
  console.log('📁 Created: public/widget/widget.css');
}

// Run the build
buildWidget(); 